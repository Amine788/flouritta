<?php
require_once __DIR__ . '/auth_utils.php';

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getPDO();

// ─── GET : Liste toutes les réservations ──────────────────────────────────────
if ($method === 'GET') {
    checkAuth(); // Protection JWT
    $stmt = $pdo->query(
        "SELECT id, submitted_at, name, phone, services, barber, date, time, status
         FROM reservations
         ORDER BY submitted_at DESC"
    );
    $rows = $stmt->fetchAll();

    // Normaliser les noms de champs (snake_case → camelCase) + décoder services JSON
    $result = array_map(fn($r) => [
        'id'          => $r['id'],
        'submittedAt' => $r['submitted_at'],
        'name'        => $r['name'],
        'phone'       => $r['phone'],
        'services'    => json_decode($r['services'] ?? '[]', true) ?? [],
        'barber'      => $r['barber'] ?? '',
        'date'        => $r['date'],
        'time'        => $r['time'],
        'status'      => $r['status'],
    ], $rows);

    echo json_encode($result);
}

// ─── POST : Créer une nouvelle réservation ────────────────────────────────────
elseif ($method === 'POST') {
    // PUBLIC : Pas de checkAuth ici
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data) {
        http_response_code(400);
        echo json_encode(['error' => 'Données invalides']);
        exit;
    }

    // Support du nouveau champ 'services' (tableau) et fallback vers 'service' (string ancien format)
    if (!empty($data['services']) && is_array($data['services']) && count($data['services']) > 0) {
        $services = $data['services'];
    } elseif (!empty($data['service']) && is_string($data['service'])) {
        // Compatibilité ascendante : wrapper l'ancien champ en tableau
        $services = [['id' => '0', 'name' => $data['service'], 'price' => 0]];
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Le champ services est requis et doit être un tableau non vide']);
        exit;
    }

    $id = uniqid('res_', true);
    $stmt = $pdo->prepare(
        "INSERT INTO reservations (id, submitted_at, name, phone, services, barber, date, time, status)
         VALUES (:id, NOW(), :name, :phone, :services, :barber, :date, :time, 'En attente')"
    );
    $stmt->execute([
        ':id'       => $id,
        ':name'     => $data['name']   ?? '',
        ':phone'    => $data['phone']  ?? '',
        ':services' => json_encode($services, JSON_UNESCAPED_UNICODE),
        ':barber'   => $data['barber'] ?? '',
        ':date'     => $data['date']   ?? '',
        ':time'     => $data['time']   ?? '',
    ]);

    http_response_code(201);
    echo json_encode(['success' => true, 'id' => $id]);
}

// ─── PUT : Mettre à jour le statut d'une réservation ──────────────────────────
elseif ($method === 'PUT') {
    checkAuth(); // Protection JWT
    $data = json_decode(file_get_contents('php://input'), true);
    $id     = $data['id']     ?? null;
    $status = $data['status'] ?? null;

    $allowed = ['En attente', 'Confirmé', 'Annulé', 'Servi'];
    if (!$id || !$status || !in_array($status, $allowed)) {
        http_response_code(400);
        echo json_encode(['error' => 'id ou status invalide']);
        exit;
    }

    $stmt = $pdo->prepare("UPDATE reservations SET status = :status WHERE id = :id");
    $stmt->execute([':status' => $status, ':id' => $id]);

    echo json_encode(['success' => true]);
}

// ─── DELETE : Supprimer une réservation ───────────────────────────────────────
elseif ($method === 'DELETE') {
    checkAuth(); // Protection JWT
    $id = $_GET['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'id manquant']);
        exit;
    }

    $stmt = $pdo->prepare("DELETE FROM reservations WHERE id = :id");
    $stmt->execute([':id' => $id]);

    echo json_encode(['success' => true]);
}

else {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
}
