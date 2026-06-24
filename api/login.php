<?php
require_once __DIR__ . '/auth_utils.php';

error_reporting(E_ALL);
ini_set('display_errors', 0);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
    exit;
}

// ─── Vérification Brute Force ─────────────────────────────────────────────────
$remaining = checkBruteForce();
if ($remaining !== null) {
    $minutes = (int)ceil($remaining / 60);
    http_response_code(429);
    echo json_encode([
        'error'      => "Trop de tentatives. Réessayez dans $minutes minute(s).",
        'locked'     => true,
        'retryAfter' => $remaining,
    ]);
    logAdminAction('login_blocked', "IP bloquée, $remaining secondes restantes", false);
    exit;
}

// ─── Validation des données ───────────────────────────────────────────────────
$raw      = file_get_contents('php://input');
$data     = json_decode($raw, true);
$password = trim($data['password'] ?? '');

if (empty($password) || strlen($password) > 128) {
    http_response_code(400);
    echo json_encode(['error' => 'Mot de passe invalide']);
    exit;
}

// ─── Récupération du hash en BDD ──────────────────────────────────────────────
$pdo  = getPDO();
$stmt = $pdo->prepare("SELECT value FROM settings WHERE `key` = 'admin_password'");
$stmt->execute();
$row  = $stmt->fetch();

if (!$row) {
    $hash = hashPassword('aviator2024');
    $pdo->prepare("INSERT INTO settings (`key`, value) VALUES ('admin_password', ?)")
        ->execute([$hash]);
    $storedHash = $hash;
} else {
    $storedHash = $row['value'];
}

// ─── Migration : hash en clair → bcrypt ───────────────────────────────────────
if (!str_starts_with($storedHash, '$2')) {
    if ($password === $storedHash) {
        $newHash = hashPassword($password);
        $pdo->prepare("UPDATE settings SET value = ? WHERE `key` = 'admin_password'")
            ->execute([$newHash]);
        $ok = true;
    } else {
        $ok = false;
    }
} else {
    $ok = verifyPassword($password, $storedHash);
}

// ─── Résultat ─────────────────────────────────────────────────────────────────
if ($ok) {
    recordLoginAttempt(true);
    logAdminAction('login_password_ok', 'Mot de passe vérifié, envoi OTP', true);

    // Générer et envoyer l'OTP par email
    $sent = generateAndSendOTP();

    // En local, on continue même si l'email échoue car le code est loggé dans otp_debug.txt
    $isLocal = in_array($_SERVER['REMOTE_ADDR'] ?? '', ['127.0.0.1', '::1']);

    if (!$sent && !$isLocal) {
        http_response_code(500);
        echo json_encode(['error' => 'Impossible d\'envoyer l\'email de vérification. Vérifiez ADMIN_EMAIL dans .env']);
        exit;
    }

    echo json_encode([
        'success'     => true,
        'requireOTP'  => true,
        'maskedEmail' => getMaskedAdminEmail(),
        'expiresIn'   => OTP_EXPIRY,
    ]);
} else {
    recordLoginAttempt(false);
    logAdminAction('login_failed', 'Mot de passe incorrect', false);

    $stmt2 = $pdo->prepare("SELECT attempts FROM login_attempts WHERE ip = ?");
    $stmt2->execute([getClientIP()]);
    $attempts = (int)($stmt2->fetchColumn() ?: 0);
    $left     = max(0, MAX_LOGIN_ATTEMPTS - $attempts);

    http_response_code(401);
    echo json_encode([
        'error'        => 'Mot de passe incorrect',
        'attemptsLeft' => $left,
    ]);
}
