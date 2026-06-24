<?php
require_once __DIR__ . '/auth_utils.php';

// ─── CORS headers ────────────────────────────────────────────────────────────
header('Content-Type: application/json; charset=utf-8');

// ─── GET : liste publique des photos uploadées ────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $uploadDir = __DIR__ . '/uploads/';

    if (!is_dir($uploadDir)) {
        echo json_encode(['photos' => []]);
        exit;
    }

    // Récupère uniquement les images WebP, JPG, PNG
    $allowedExts = ['webp', 'jpg', 'jpeg', 'png'];
    $files = [];

    foreach (new DirectoryIterator($uploadDir) as $file) {
        if ($file->isDot() || $file->isDir()) continue;

        $ext = strtolower($file->getExtension());
        if (!in_array($ext, $allowedExts, true)) continue;

        $filename = $file->getFilename();
        $files[] = [
            'filename'   => $filename,
            'url'        => 'api/uploads/' . $filename,
            'size'       => $file->getSize(),
            'created_at' => date('c', $file->getCTime()), // ISO 8601
        ];
    }

    // Tri par date de création décroissante (plus récent en premier)
    usort($files, fn($a, $b) => strcmp($b['created_at'], $a['created_at']));

    echo json_encode(['photos' => $files]);
    exit;
}

// ─── DELETE : suppression d'une photo (JWT requis) ───────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    checkAuth(); // Vérifie le JWT

    // Lire le corps JSON
    $body = json_decode(file_get_contents('php://input'), true);
    $filename = $body['filename'] ?? '';

    // ── Validation du nom de fichier (sécurité : pas de path traversal) ───────
    if (empty($filename) || !preg_match('/^[a-zA-Z0-9_\-\.]+$/', $filename)) {
        http_response_code(400);
        echo json_encode(['error' => 'Nom de fichier invalide']);
        exit;
    }

    // Interdire les extensions exécutables
    $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
    $allowedExts = ['webp', 'jpg', 'jpeg', 'png'];
    if (!in_array($ext, $allowedExts, true)) {
        http_response_code(400);
        echo json_encode(['error' => 'Extension non autorisée']);
        exit;
    }

    $targetPath = __DIR__ . '/uploads/' . $filename;

    // Vérifier que le chemin résolu est bien dans le dossier uploads (anti path traversal)
    $realUploadDir = realpath(__DIR__ . '/uploads');
    $realTarget    = realpath($targetPath);

    if ($realTarget === false || strpos($realTarget, $realUploadDir) !== 0) {
        http_response_code(403);
        echo json_encode(['error' => 'Accès refusé']);
        exit;
    }

    if (!file_exists($targetPath)) {
        http_response_code(404);
        echo json_encode(['error' => 'Fichier introuvable']);
        exit;
    }

    if (unlink($targetPath)) {
        logAdminAction('file_delete', "Fichier supprimé : $filename");
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Impossible de supprimer le fichier']);
    }
    exit;
}

// ─── Méthode non autorisée ───────────────────────────────────────────────────
http_response_code(405);
echo json_encode(['error' => 'Méthode non autorisée']);
