<?php
require_once __DIR__ . '/db.php';

define('OTP_EXPIRY',         (int)($_ENV['OTP_EXPIRY']          ?? 300)); // 5 min
define('ADMIN_EMAIL',        $_ENV['ADMIN_EMAIL']        ?? '');
define('ADMIN_EMAIL_NAME',   $_ENV['ADMIN_EMAIL_NAME']   ?? 'AVIATOR Admin');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getClientIP(): string {
    // Récupère l'IP réelle même derrière un proxy
    $keys = ['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'REMOTE_ADDR'];
    foreach ($keys as $key) {
        if (!empty($_SERVER[$key])) {
            $ip = trim(explode(',', $_SERVER[$key])[0]);
            if (filter_var($ip, FILTER_VALIDATE_IP)) return $ip;
        }
    }
    return '0.0.0.0';
}

// ─── Brute Force Protection ───────────────────────────────────────────────────

/**
 * Vérifie si l'IP est bloquée. Retourne null si OK, sinon les secondes restantes.
 */
function checkBruteForce(): ?int {
    $pdo = getPDO();
    $ip  = getClientIP();

    $stmt = $pdo->prepare(
        "SELECT attempts, locked_until FROM login_attempts WHERE ip = ?"
    );
    $stmt->execute([$ip]);
    $row = $stmt->fetch();

    if (!$row) return null;

    // Vérifier si le blocage est actif
    if ($row['locked_until'] && strtotime($row['locked_until']) > time()) {
        return strtotime($row['locked_until']) - time();
    }

    return null;
}

/**
 * Enregistre une tentative de connexion. Bloque après MAX_LOGIN_ATTEMPTS échecs.
 */
function recordLoginAttempt(bool $success): void {
    $pdo = getPDO();
    $ip  = getClientIP();

    if ($success) {
        // Connexion réussie : réinitialiser le compteur
        $pdo->prepare("DELETE FROM login_attempts WHERE ip = ?")->execute([$ip]);
        return;
    }

    // Échec : incrémenter le compteur
    $stmt = $pdo->prepare(
        "INSERT INTO login_attempts (ip, attempts, last_attempt)
         VALUES (?, 1, NOW())
         ON DUPLICATE KEY UPDATE
           attempts = attempts + 1,
           last_attempt = NOW(),
           locked_until = IF(attempts + 1 >= ?, DATE_ADD(NOW(), INTERVAL ? SECOND), NULL)"
    );
    $stmt->execute([$ip, MAX_LOGIN_ATTEMPTS, LOCKOUT_DURATION]);

    // Récupérer le nombre de tentatives actuel pour log
    $stmt2 = $pdo->prepare("SELECT attempts FROM login_attempts WHERE ip = ?");
    $stmt2->execute([$ip]);
    $row = $stmt2->fetch();
}

// ─── Logs d'audit Admin ────────────────────────────────────────────────────────

/**
 * Enregistre une action admin dans les logs.
 */
function logAdminAction(string $action, string $details = '', bool $success = true): void {
    try {
        $pdo = getPDO();
        $stmt = $pdo->prepare(
            "INSERT INTO admin_logs (action, details, ip, user_agent, success, created_at)
             VALUES (?, ?, ?, ?, ?, NOW())"
        );
        $stmt->execute([
            $action,
            $details,
            getClientIP(),
            substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 255),
            $success ? 1 : 0,
        ]);
    } catch (Throwable $e) {
        // Ne pas bloquer si les logs échouent
    }
}

// ─── JWT ─────────────────────────────────────────────────────────────────────

/**
 * Encode un JWT signé HMAC-SHA256
 */
function encodeJWT(array $payload): string {
    $header  = base64url_encode(json_encode(['typ' => 'JWT', 'alg' => 'HS256']));
    $payload = base64url_encode(json_encode($payload));
    $sig     = base64url_encode(hash_hmac('sha256', "$header.$payload", JWT_SECRET, true));
    return "$header.$payload.$sig";
}

/**
 * Décode et vérifie un JWT. Retourne le payload ou null si invalide/expiré.
 */
function decodeJWT(string $jwt): ?array {
    $parts = explode('.', $jwt);
    if (count($parts) !== 3) return null;

    [$header, $payload, $sigProvided] = $parts;

    // Vérifier la signature
    $sigExpected = base64url_encode(hash_hmac('sha256', "$header.$payload", JWT_SECRET, true));
    if (!hash_equals($sigExpected, $sigProvided)) return null;

    $data = json_decode(base64url_decode($payload), true);
    if (!is_array($data)) return null;

    // Vérifier l'expiration
    if (isset($data['exp']) && $data['exp'] < time()) return null;

    return $data;
}

function base64url_encode(string $data): string {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64url_decode(string $data): string {
    return base64_decode(strtr($data, '-_', '+/') . str_repeat('=', (4 - strlen($data) % 4) % 4));
}

// ─── Récupération du Token Bearer ─────────────────────────────────────────────

function getBearerToken(): ?string {
    $headers = array_change_key_case(getallheaders(), CASE_LOWER);
    $auth = $headers['authorization']
        ?? $_SERVER['HTTP_AUTHORIZATION']
        ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
        ?? '';

    if (preg_match('/^Bearer\s+(\S+)$/i', $auth, $m)) {
        return $m[1];
    }
    return null;
}

// ─── Middleware d'Authentification ────────────────────────────────────────────

/**
 * Vérifie le JWT et retourne le payload. Stoppe la requête si invalide.
 */
function checkAuth(): array {
    $token = getBearerToken();
    if (!$token) {
        http_response_code(401);
        echo json_encode(['error' => 'Authentification requise']);
        exit;
    }

    $payload = decodeJWT($token);
    if (!$payload) {
        http_response_code(401);
        echo json_encode(['error' => 'Session expirée ou invalide. Veuillez vous reconnecter.']);
        exit;
    }

    if (($payload['role'] ?? '') !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Accès non autorisé']);
        exit;
    }

    return $payload;
}

// ─── Hash Mots de Passe ───────────────────────────────────────────────────────

function hashPassword(string $password): string {
    return password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
}

function verifyPassword(string $password, string $hash): bool {
    return password_verify($password, $hash);
}

// ─── OTP (Vérification par Email) ────────────────────────────────────────────

/**
 * Génère un OTP 6 chiffres, le stocke en BDD, et l'envoie par email.
 * Retourne true si l'email a été envoyé, false sinon.
 */
function generateAndSendOTP(): bool {
    $pdo = getPDO();

    // Invalider les anciens OTPs non utilisés
    $pdo->prepare("DELETE FROM admin_otp WHERE used = 0 OR expires_at < NOW()")->execute();

    // Générer un code 6 chiffres sécurisé
    $code      = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    $expiresAt = date('Y-m-d H:i:s', time() + OTP_EXPIRY);

    // Stocker le hash du code (pas le code en clair)
    $codeHash = password_hash($code, PASSWORD_BCRYPT, ['cost' => 10]);
    $pdo->prepare(
        "INSERT INTO admin_otp (code_hash, expires_at, attempts, used) VALUES (?, ?, 0, 0)"
    )->execute([$codeHash, $expiresAt]);

    // Envoyer par email
    $sent = sendOTPEmail($code);

    // DEBUG LOCAL : Si on est en local, on écrit le code dans un fichier pour que le dev puisse le voir
    if (in_array($_SERVER['REMOTE_ADDR'] ?? '', ['127.0.0.1', '::1'])) {
        file_put_contents(__DIR__ . '/otp_debug.txt', "[" . date('Y-m-d H:i:s') . "] OTP Code: $code\n", FILE_APPEND);
    }

    return $sent;
}

/**
 * Envoie un email via un socket SMTP (STARTTLS 587) avec authentification.
 * Si les informations SMTP ne sont pas renseignées dans le .env, fait un fallback sur mail().
 */
function sendEmailSMTP(string $to, string $subject, string $htmlMessage, string $textMessage): bool {
    $host = $_ENV['SMTP_HOST'] ?? '';
    $port = (int)($_ENV['SMTP_PORT'] ?? 587);
    $user = $_ENV['SMTP_USER'] ?? '';
    $pass = $_ENV['SMTP_PASS'] ?? '';
    $fromName = $_ENV['ADMIN_EMAIL_NAME'] ?? 'AVIATOR Admin';

    if (empty($host) || empty($user)) {
        // Fallback sur la fonction mail() standard de PHP si non configuré
        $boundary = md5(uniqid());
        $headers  = "From: \"$fromName\" <$to>\r\n";
        $headers .= "Reply-To: $to\r\n";
        $headers .= "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: multipart/alternative; boundary=\"$boundary\"\r\n";
        $headers .= "X-Mailer: AVIATOR-Security/1.0\r\n";

        $message  = "--$boundary\r\n";
        $message .= "Content-Type: text/plain; charset=UTF-8\r\n\r\n$textMessage\r\n";
        $message .= "--$boundary\r\n";
        $message .= "Content-Type: text/html; charset=UTF-8\r\n\r\n$htmlMessage\r\n";
        $message .= "--$boundary--";

        return mail($to, $subject, $message, $headers);
    }

    try {
        $socket = fsockopen($host, $port, $errno, $errstr, 2);
        if (!$socket) {
            error_log("SMTP connection failed: $errstr ($errno)");
            return false;
        }
        stream_set_timeout($socket, 3);

        $read = function($socket, $expected) {
            $response = '';
            while (strpos($response, "\r\n") === false || (isset($response[3]) && $response[3] === '-')) {
                $line = fgets($socket, 515);
                if ($line === false) break;
                $response .= $line;
            }
            $code = (int)substr($response, 0, 3);
            if ($code !== $expected) {
                error_log("SMTP error: Expected $expected, got: $response");
                return false;
            }
            return true;
        };

        if (!$read($socket, 220)) { fclose($socket); return false; }

        fwrite($socket, "EHLO localhost\r\n");
        if (!$read($socket, 250)) { fclose($socket); return false; }

        // STARTTLS
        if ($port === 587) {
            fwrite($socket, "STARTTLS\r\n");
            if (!$read($socket, 220)) { fclose($socket); return false; }
            if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                error_log("SMTP crypto negotiation failed");
                fclose($socket);
                return false;
            }
            fwrite($socket, "EHLO localhost\r\n");
            if (!$read($socket, 250)) { fclose($socket); return false; }
        }

        // AUTH LOGIN
        fwrite($socket, "AUTH LOGIN\r\n");
        if (!$read($socket, 334)) { fclose($socket); return false; }

        fwrite($socket, base64_encode($user) . "\r\n");
        if (!$read($socket, 334)) { fclose($socket); return false; }

        fwrite($socket, base64_encode($pass) . "\r\n");
        if (!$read($socket, 235)) { fclose($socket); return false; }

        // MAIL FROM
        fwrite($socket, "MAIL FROM: <$user>\r\n");
        if (!$read($socket, 250)) { fclose($socket); return false; }

        // RCPT TO
        fwrite($socket, "RCPT TO: <$to>\r\n");
        if (!$read($socket, 250)) { fclose($socket); return false; }

        // DATA
        fwrite($socket, "DATA\r\n");
        if (!$read($socket, 354)) { fclose($socket); return false; }

        // En-têtes du message
        $boundary = md5(uniqid());
        $headers = [
            "MIME-Version: 1.0",
            "Content-Type: multipart/alternative; boundary=\"$boundary\"",
            "To: <$to>",
            "From: \"$fromName\" <$user>",
            "Subject: $subject",
            "Date: " . date('r'),
            "X-Mailer: AVIATOR-Security/1.0"
        ];

        $content  = implode("\r\n", $headers) . "\r\n\r\n";
        $content .= "--$boundary\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n$textMessage\r\n\r\n";
        $content .= "--$boundary\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n$htmlMessage\r\n\r\n";
        $content .= "--$boundary--\r\n";

        // Protection point double
        $content = str_replace("\n.", "\n..", $content);

        fwrite($socket, $content . ".\r\n");
        if (!$read($socket, 250)) { fclose($socket); return false; }

        fwrite($socket, "QUIT\r\n");
        fclose($socket);
        return true;
    } catch (Exception $e) {
        error_log("SMTP exception: " . $e->getMessage());
        return false;
    }
}

/**
 * Envoie le code OTP par email à l'adresse admin.
 */
function sendOTPEmail(string $code): bool {
    $to      = ADMIN_EMAIL;
    $name    = ADMIN_EMAIL_NAME;
    $expMin  = (int)ceil(OTP_EXPIRY / 60);

    if (empty($to)) return false;

    $subject  = "[AVIATOR] Code de vérification : $code";

    $htmlBody = "
<!DOCTYPE html>
<html lang='fr'>
<head><meta charset='UTF-8'><meta name='viewport' content='width=device-width'></head>
<body style='margin:0;padding:0;background:#060b07;font-family:Raleway,Arial,sans-serif;'>
  <table width='100%' cellpadding='0' cellspacing='0' style='background:#060b07;padding:40px 20px;'>
    <tr><td align='center'>
      <table width='480' cellpadding='0' cellspacing='0' style='background:#0a110a;border:1px solid rgba(212,175,55,0.15);padding:40px;'>
        <tr><td align='center' style='padding-bottom:24px;'>
          <p style='color:rgba(212,175,55,0.5);font-size:10px;letter-spacing:0.4em;text-transform:uppercase;margin:0;'>AVIATOR BARBER SHOP</p>
          <h1 style='color:#D4AF37;font-size:18px;letter-spacing:0.2em;text-transform:uppercase;margin:8px 0 0;'>Code de Vérification</h1>
        </td></tr>
        <tr><td align='center' style='padding:24px 0;border-top:1px solid rgba(212,175,55,0.1);border-bottom:1px solid rgba(212,175,55,0.1);'>
          <p style='color:rgba(240,235,224,0.5);font-size:11px;letter-spacing:0.2em;margin:0 0 16px;'>Votre code d'accès admin</p>
          <div style='background:#040809;border:1px solid rgba(212,175,55,0.3);padding:20px 32px;display:inline-block;'>
            <span style='color:#D4AF37;font-size:36px;font-weight:700;letter-spacing:0.5em;font-family:monospace;'>$code</span>
          </div>
          <p style='color:rgba(240,235,224,0.3);font-size:10px;letter-spacing:0.15em;margin:16px 0 0;'>Valide pendant $expMin minutes</p>
        </td></tr>
        <tr><td style='padding-top:24px;'>
          <p style='color:rgba(240,235,224,0.3);font-size:10px;line-height:1.6;margin:0;text-align:center;'>
            Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.<br>
            Ne partagez jamais ce code.
          </p>
        </td></tr>
      </table>
      <p style='color:rgba(240,235,224,0.15);font-size:9px;margin-top:16px;letter-spacing:0.2em;'>© AVIATOR Barber Shop — Accès restreint</p>
    </td></tr>
  </table>
</body>
</html>";

    $textBody = "[AVIATOR] Code de vérification admin : $code\nValide $expMin minutes.\nNe partagez pas ce code.";

    return sendEmailSMTP($to, $subject, $htmlBody, $textBody);
}

/**
 * Vérifie un code OTP soumis par l'utilisateur.
 * Retourne 'ok', 'invalid', 'expired', ou 'locked'.
 */
function verifyOTPCode(string $code): string {
    $pdo = getPDO();

    // Récupérer l'OTP actif le plus récent
    $stmt = $pdo->prepare(
        "SELECT id, code_hash, expires_at, attempts FROM admin_otp
         WHERE used = 0 ORDER BY id DESC LIMIT 1"
    );
    $stmt->execute();
    $row = $stmt->fetch();

    if (!$row) return 'expired';

    // Vérifier l'expiration
    if (strtotime($row['expires_at']) < time()) {
        $pdo->prepare("DELETE FROM admin_otp WHERE id = ?")->execute([$row['id']]);
        return 'expired';
    }

    // Vérifier le nombre de tentatives (max 5)
    if ($row['attempts'] >= 5) {
        $pdo->prepare("DELETE FROM admin_otp WHERE id = ?")->execute([$row['id']]);
        return 'locked';
    }

    // Incrémenter les tentatives
    $pdo->prepare("UPDATE admin_otp SET attempts = attempts + 1 WHERE id = ?")
        ->execute([$row['id']]);

    // Vérifier le code
    if (!password_verify($code, $row['code_hash'])) {
        return 'invalid';
    }

    // Marquer comme utilisé
    $pdo->prepare("UPDATE admin_otp SET used = 1 WHERE id = ?")
        ->execute([$row['id']]);

    return 'ok';
}

/**
 * Retourne l'email admin masqué pour affichage (ex: av***@gmail.com)
 */
function getMaskedAdminEmail(): string {
    $email = ADMIN_EMAIL;
    if (empty($email) || !str_contains($email, '@')) return '***@***.***';
    [$local, $domain] = explode('@', $email, 2);
    $masked = substr($local, 0, min(2, strlen($local))) . str_repeat('*', max(1, strlen($local) - 2));
    return "$masked@$domain";
}
