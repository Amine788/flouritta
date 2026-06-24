<?php
// ─── Chargement des variables d'environnement ─────────────────────────────────
function loadEnv(string $path): void {
    if (!file_exists($path)) return;
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (!str_contains($line, '=')) continue;
        [$key, $value] = explode('=', $line, 2);
        $key   = trim($key);
        $value = trim($value);
        if (!empty($key) && !array_key_exists($key, $_ENV)) {
            $_ENV[$key] = $value;
            putenv("$key=$value");
        }
    }
}

loadEnv(__DIR__ . '/.env');

// ─── Configuration base de données ────────────────────────────────────────────
define('DB_HOST',    $_ENV['DB_HOST']    ?? 'localhost');
define('DB_NAME',    $_ENV['DB_NAME']    ?? 'aviator_barbershop');
define('DB_USER',    $_ENV['DB_USER']    ?? 'root');
define('DB_PASS',    $_ENV['DB_PASS']    ?? '');
define('DB_CHARSET', 'utf8mb4');

// ─── Sécurité JWT ─────────────────────────────────────────────────────────────
$jwtSecret = $_ENV['JWT_SECRET'] ?? '';
if (empty($jwtSecret) || $jwtSecret === 'CHANGE_ME_GENERATE_WITH_openssl_rand_hex_64') {
    // En production, bloquer si la clé n'est pas configurée
    if (!in_array($_SERVER['REMOTE_ADDR'] ?? '', ['127.0.0.1', '::1'])) {
        http_response_code(500);
        echo json_encode(['error' => 'Configuration serveur incomplète']);
        exit;
    }
    // En local seulement : clé de développement (ne jamais en production)
    $jwtSecret = 'local_dev_secret_not_for_production_only';
}
define('JWT_SECRET', $jwtSecret);
define('JWT_EXPIRY', 43200); // 12 heures

// ─── Brute Force ──────────────────────────────────────────────────────────────
define('MAX_LOGIN_ATTEMPTS', (int)($_ENV['MAX_LOGIN_ATTEMPTS'] ?? 5));
define('LOCKOUT_DURATION',   (int)($_ENV['LOCKOUT_DURATION']   ?? 900)); // 15 min

// ─── Connexion PDO ────────────────────────────────────────────────────────────
function getPDO(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn     = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Connexion base de données échouée']);
            exit;
        }
    }
    return $pdo;
}

// ─── Headers de Sécurité ──────────────────────────────────────────────────────
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Content-Security-Policy: default-src \'none\'');
header('Permissions-Policy: geolocation=(), microphone=(), camera=()');
// Décommenter en production HTTPS :
// header('Strict-Transport-Security: max-age=31536000; includeSubDomains');

// ─── CORS Restreint ────────────────────────────────────────────────────────────
$allowedOrigin = $_ENV['ALLOWED_ORIGIN'] ?? 'http://localhost:5173';
$requestOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';

// Accepter aussi localhost avec n'importe quel port en développement
$isLocalhost = preg_match('/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/', $requestOrigin);

// Générer automatiquement la variante www / non-www pour le domaine autorisé
$allowedOrigins = [$allowedOrigin];
if (strpos($allowedOrigin, 'https://') === 0) {
    $domainOnly = substr($allowedOrigin, 8);
    if (strpos($domainOnly, 'www.') === 0) {
        $allowedOrigins[] = 'https://' . substr($domainOnly, 4);
    } else {
        $allowedOrigins[] = 'https://www.' . $domainOnly;
    }
}

// Accepter également les déploiements Vercel du projet frontend
$isVercel = preg_match('/^https?:\/\/.*\.vercel\.app$/', $requestOrigin);

if (in_array($requestOrigin, $allowedOrigins, true) || $isLocalhost || $isVercel) {
    header("Access-Control-Allow-Origin: $requestOrigin");
    header('Access-Control-Allow-Credentials: true');
} else {
    // Origine non autorisée : pas de header CORS = le navigateur bloquera
    // On laisse la requête continuer (les API non-browser passent quand même)
}

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Max-Age: 86400');

// Répondre aux preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}
