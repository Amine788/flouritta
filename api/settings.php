<?php
require_once __DIR__ . '/auth_utils.php';

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getPDO();

// ─── GET : Récupère un ou tous les paramètres ─────────────────────────────────
if ($method === 'GET') {
    $key = $_GET['key'] ?? null;
    if ($key) {
        // Sécurité : Ne jamais renvoyer le mot de passe admin via cette route
        if ($key === 'admin_password') {
            http_response_code(403);
            echo json_encode(['error' => 'Accès interdit']);
            exit;
        }
        $stmt = $pdo->prepare("SELECT value FROM settings WHERE `key` = :key");
        $stmt->execute([':key' => $key]);
        $row = $stmt->fetch();
        echo json_encode(['value' => $row ? $row['value'] : null]);
    } else {
        $stmt = $pdo->query("SELECT `key`, value FROM settings WHERE `key` != 'admin_password'");
        $rows = $stmt->fetchAll();
        $result = [];
        foreach ($rows as $r) $result[$r['key']] = $r['value'];
        echo json_encode($result);
    }
}

// ─── PUT : Met à jour un paramètre ────────────────────────────────────────────
elseif ($method === 'PUT') {
    checkAuth(); // Protection JWT

    $data = json_decode(file_get_contents('php://input'), true);
    $key   = $data['key']   ?? null;
    $value = $data['value'] ?? null;

    if (!$key || $value === null) {
        http_response_code(400);
        echo json_encode(['error' => 'key ou value manquant']);
        exit;
    }

    // Si on change le mot de passe, on doit le hasher
    if ($key === 'admin_password') {
        $value = hashPassword($value);
    }

    $stmt = $pdo->prepare(
        "INSERT INTO settings (`key`, value) VALUES (:key, :value)
         ON DUPLICATE KEY UPDATE value = :value2"
    );
    $stmt->execute([':key' => $key, ':value' => $value, ':value2' => $value]);

    echo json_encode(['success' => true]);
}

else {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
}
