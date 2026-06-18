<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../includes/db.php';
$name = trim($_GET['name'] ?? '');
$lucDesc = trim($_GET['luc_desc'] ?? '');
try {
    $pdo = getDBConnection();
    $conditions = []; $params = [];
    if ($name    !== '') { $conditions[] = '`Owner` = :name';           $params[':name'] = $name; }
    if ($lucDesc !== '') { $conditions[] = '`LUC Description` = :luc'; $params[':luc']  = $lucDesc; }
    $where = $conditions ? 'WHERE '.implode(' AND ', $conditions) : '';
    $stmt = $pdo->prepare("SELECT COUNT(*) AS total_records, COUNT(DISTINCT `Owner`) AS unique_owners, COUNT(DISTINCT `City`) AS cities, COUNT(DISTINCT `District Group Description`) AS districts, AVG(CASE WHEN CAST(REPLACE(REPLACE(`Sale Price`,'$',''),',','') AS DECIMAL(12,2)) > 10000 THEN CAST(REPLACE(REPLACE(`Sale Price`,'$',''),',','') AS DECIMAL(12,2)) END) AS avg_sale_price, AVG(CAST(`Finished Area (sq ft)` AS UNSIGNED)) AS avg_sqft FROM `stluciecty_singleFamily` $where");
    $stmt->execute($params);
    echo json_encode(['success' => true, 'stats' => $stmt->fetch()]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Query failed.']);
}
