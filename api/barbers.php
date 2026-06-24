<?php
require_once __DIR__ . '/auth_utils.php';

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getPDO();

// ─── GET : Liste tous les barbiers ────────────────────────────────────────────
if ($method === 'GET') {
    $stmt = $pdo->query(
        "SELECT name, title, specialty, experience, photo, tag, photo_position AS photoPosition
         FROM barbers
         ORDER BY sort_order ASC"
    );
    echo json_encode($stmt->fetchAll());
}

// ─── POST : Remplacer tous les barbiers ───────────────────────────────────────
elseif ($method === 'POST') {
    checkAuth(); // Protection JWT
    $barbers = json_decode(file_get_contents('php://input'), true);
    if (!is_array($barbers)) {
        http_response_code(400);
        echo json_encode(['error' => 'Données invalides']);
        exit;
    }

    $pdo->exec("DELETE FROM barbers");
    $stmt = $pdo->prepare(
        "INSERT INTO barbers (sort_order, name, title, specialty, experience, photo, tag, photo_position)
         VALUES (:sort_order, :name, :title, :specialty, :experience, :photo, :tag, :photo_position)"
    );
    foreach ($barbers as $i => $b) {
        $stmt->execute([
            ':sort_order'     => $i,
            ':name'           => $b['name']       ?? '',
            ':title'          => $b['title']      ?? 'Expert Barber',
            ':specialty'      => $b['specialty']  ?? '',
            ':experience'     => $b['experience'] ?? '5+ Ans',
            ':photo'          => $b['photo']      ?? '',
            ':tag'            => $b['tag']        ?? 'Expert Barber',
            ':photo_position' => $b['photoPosition'] ?? 'center',
        ]);
    }

    echo json_encode(['success' => true]);
}

else {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
}
