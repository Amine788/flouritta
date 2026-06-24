<?php
require_once __DIR__ . '/auth_utils.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
    exit;
}

checkAuth(); // JWT requis

if (!isset($_FILES['photo'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Aucun fichier reçu']);
    exit;
}

$file = $_FILES['photo'];

// ─── Vérification de la taille (5 Mo max) ────────────────────────────────────
$maxSize = 5 * 1024 * 1024; // 5 MB
if ($file['size'] > $maxSize) {
    http_response_code(400);
    echo json_encode(['error' => 'Fichier trop volumineux (max 5 Mo)']);
    exit;
}

if ($file['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['error' => 'Erreur lors de la réception du fichier']);
    exit;
}

// ─── Vérification du MIME type RÉEL (pas juste l'extension déclarée) ─────────
$allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/x-webp'];
$allowedExts  = ['jpg', 'jpeg', 'png', 'webp'];

// finfo vérifie la signature binaire du fichier, pas son extension
$finfo    = new finfo(FILEINFO_MIME_TYPE);
$realMime = $finfo->file($file['tmp_name']);
$declaredExt = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

// ── Détection WebP robuste : lecture signature binaire RIFF/WEBP ─────────
// Nécessaire car finfo/libmagic de certains hébergeurs retourne un MIME
// incorrect (application/octet-stream ou image/riff) pour les fichiers WebP.
if ($declaredExt === 'webp') {
    $handle = fopen($file['tmp_name'], 'rb');
    $header = fread($handle, 12);
    fclose($handle);
    // Format WebP : octets 0-3 = "RIFF", octets 8-11 = "WEBP"
    if (strlen($header) >= 12
        && substr($header, 0, 4) === 'RIFF'
        && substr($header, 8, 4) === 'WEBP'
    ) {
        $realMime = 'image/webp';
    }
}

// Fallback : application/octet-stream déclaré avec extension .webp
if ($realMime === 'application/octet-stream' && $declaredExt === 'webp') {
    $realMime = 'image/webp';
}

if (!in_array($realMime, $allowedMimes, true)) {
    http_response_code(400);
    echo json_encode(['error' => 'Format d\'image non supporté (MIME: ' . $realMime . '). JPG, PNG, WEBP uniquement.']);
    exit;
}

// Vérifier l'extension déclarée aussi
if (!in_array($declaredExt, $allowedExts, true)) {
    http_response_code(400);
    echo json_encode(['error' => 'Extension de fichier non autorisée']);
    exit;
}

// ─── Création du dossier uploads ─────────────────────────────────────────────
$uploadDir = __DIR__ . '/uploads/';
if (!is_dir($uploadDir)) {
    if (!mkdir($uploadDir, 0755, true)) {
        logAdminAction('file_upload_error', "Échec création dossier : $uploadDir", false);
        http_response_code(500);
        echo json_encode(['error' => 'Erreur serveur : impossible de créer le dossier de destination.']);
        exit;
    }
}

// ─── Nom de fichier sécurisé (hash aléatoire, pas de données utilisateur) ────
$ext      = match($realMime) {
    'image/jpeg'   => 'jpg',
    'image/png'    => 'png',
    'image/webp'   => 'webp',
    'image/x-webp' => 'webp',
    default        => 'jpg',
};
$filename   = bin2hex(random_bytes(16)) . '.' . $ext;
$targetPath = $uploadDir . $filename;

if (move_uploaded_file($file['tmp_name'], $targetPath)) {
    logAdminAction('file_upload', "Fichier uploadé : $filename");
    echo json_encode([
        'success' => true,
        'url'     => 'api/uploads/' . $filename,
    ]);
} else {
    $errorMsg = "Échec move_uploaded_file de {$file['tmp_name']} vers $targetPath";
    logAdminAction('file_upload_error', $errorMsg, false);
    http_response_code(500);
    echo json_encode(['error' => 'Erreur lors de l\'enregistrement du fichier sur le serveur.']);
}
