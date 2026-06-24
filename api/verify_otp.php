<?php
require_once __DIR__ . '/auth_utils.php';

error_reporting(E_ALL);
ini_set('display_errors', 0);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
    exit;
}

$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);
$code = trim($data['otp'] ?? '');

// Validation basique du format
if (!preg_match('/^\d{6}$/', $code)) {
    http_response_code(400);
    echo json_encode(['error' => 'Code invalide (6 chiffres requis)']);
    exit;
}

$result = verifyOTPCode($code);

switch ($result) {
    case 'ok':
        logAdminAction('login_otp_success', 'Code OTP vérifié — accès accordé', true);

        $token = encodeJWT([
            'role' => 'admin',
            'iat'  => time(),
            'exp'  => time() + JWT_EXPIRY,
        ]);

        echo json_encode([
            'success'   => true,
            'token'     => $token,
            'expiresIn' => JWT_EXPIRY,
        ]);
        break;

    case 'invalid':
        logAdminAction('login_otp_failed', 'Code OTP incorrect', false);
        http_response_code(401);
        echo json_encode(['error' => 'Code incorrect. Vérifiez votre email.']);
        break;

    case 'expired':
        logAdminAction('login_otp_expired', 'Code OTP expiré', false);
        http_response_code(401);
        echo json_encode([
            'error'   => 'Code expiré. Veuillez recommencer la connexion.',
            'expired' => true,
        ]);
        break;

    case 'locked':
        logAdminAction('login_otp_locked', 'Trop de tentatives OTP', false);
        http_response_code(429);
        echo json_encode([
            'error'  => 'Trop de tentatives. Veuillez recommencer depuis le début.',
            'locked' => true,
        ]);
        break;

    default:
        http_response_code(500);
        echo json_encode(['error' => 'Erreur serveur']);
}
