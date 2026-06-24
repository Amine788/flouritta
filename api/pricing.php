<?php
require_once __DIR__ . '/auth_utils.php';

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getPDO();

// ─── GET : Récupère toutes les catégories et leurs items ──────────────────────
if ($method === 'GET') {
    $cats = $pdo->query(
        "SELECT id, label, icon FROM pricing_categories ORDER BY sort_order ASC"
    )->fetchAll();

    $items = $pdo->query(
        "SELECT category_id, name, price, description, popular, from_price
         FROM pricing_items ORDER BY sort_order ASC"
    )->fetchAll();

    $result = array_map(function($cat) use ($items) {
        $catItems = array_filter($items, fn($it) => $it['category_id'] === $cat['id']);
        return [
            'id'    => $cat['id'],
            'label' => $cat['label'],
            'icon'  => $cat['icon'],
            'items' => array_values(array_map(fn($it) => [
                'name'      => $it['name'],
                'price'     => $it['price'],
                'desc'      => $it['description'],
                'popular'   => (bool)$it['popular'],
                'fromPrice' => (bool)$it['from_price'],
            ], $catItems)),
        ];
    }, $cats);

    echo json_encode(array_values($result));
}

// ─── POST : Remplacer toutes les catégories et items ──────────────────────────
elseif ($method === 'POST') {
    checkAuth(); // Protection JWT
    $categories = json_decode(file_get_contents('php://input'), true);
    if (!is_array($categories)) {
        http_response_code(400);
        echo json_encode(['error' => 'Données invalides']);
        exit;
    }

    $pdo->exec("DELETE FROM pricing_items");
    $pdo->exec("DELETE FROM pricing_categories");

    $catStmt = $pdo->prepare(
        "INSERT INTO pricing_categories (id, label, icon, sort_order) VALUES (:id, :label, :icon, :sort_order)"
    );
    $itemStmt = $pdo->prepare(
        "INSERT INTO pricing_items (category_id, sort_order, name, price, description, popular, from_price)
         VALUES (:category_id, :sort_order, :name, :price, :description, :popular, :from_price)"
    );

    foreach ($categories as $ci => $cat) {
        $catStmt->execute([
            ':id'         => $cat['id'],
            ':label'      => $cat['label'],
            ':icon'       => $cat['icon'],
            ':sort_order' => $ci,
        ]);
        foreach (($cat['items'] ?? []) as $ii => $item) {
            $itemStmt->execute([
                ':category_id' => $cat['id'],
                ':sort_order'  => $ii,
                ':name'        => $item['name']      ?? '',
                ':price'       => $item['price']     ?? '',
                ':description' => $item['desc']      ?? '',
                ':popular'     => $item['popular']   ? 1 : 0,
                ':from_price'  => $item['fromPrice'] ? 1 : 0,
            ]);
        }
    }

    echo json_encode(['success' => true]);
}

else {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
}
