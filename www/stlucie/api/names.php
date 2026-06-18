<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../includes/db.php';
$q = trim($_GET['q'] ?? '');
try {
    $pdo = getDBConnection();
    if ($q !== '') {
        $stmt = $pdo->prepare("SELECT DISTINCT `Owner` FROM `stluciecty_singleFamily` WHERE `Owner` LIKE :q ORDER BY `Owner` LIMIT 50");
        $stmt->execute([':q' => '%'.$q.'%']);
    } else {
        $stmt = $pdo->query("SELECT DISTINCT `Owner` FROM `stluciecty_singleFamily` ORDER BY `Owner` LIMIT 200");
    }
    echo json_encode(['success' => true, 'names' => $stmt->fetchAll(PDO::FETCH_COLUMN)]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Query failed.']);
}
