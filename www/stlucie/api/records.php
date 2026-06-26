<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../includes/db.php';
$name    = trim($_GET['name']     ?? '');
$address = trim($_GET['address']  ?? '');
$lucDesc = trim($_GET['luc_desc'] ?? '');
$page    = max(1, (int)($_GET['page']     ?? 1));
$perPage = min(100, max(10, (int)($_GET['per_page'] ?? 25)));
$offset  = ($page - 1) * $perPage;
$allowedSort = ['Owner','Situs','City','Sale Price','Sale Date','Finished Area (sq ft)','Bedrooms','Bathrooms','Year Built','LUC Description','District Group Description'];
$sort = in_array($_GET['sort'] ?? '', $allowedSort) ? $_GET['sort'] : 'Owner';
$dir  = strtoupper($_GET['dir'] ?? 'ASC') === 'DESC' ? 'DESC' : 'ASC';
try {
    $pdo = getDBConnection();
    $conditions = []; $params = [];
    if ($name    !== '') { $conditions[] = '(`Grantor` LIKE :name1 OR `Grantee` LIKE :name2 OR `Owner` LIKE :name3)'; $params[':name1'] = '%'.$name.'%'; $params[':name2'] = '%'.$name.'%'; $params[':name3'] = '%'.$name.'%'; }
    if ($address !== '') { $conditions[] = '`Situs` LIKE :addr'; $params[':addr'] = '%'.$address.'%'; }
    if ($lucDesc !== '') { $conditions[] = '`LUC Description` = :luc'; $params[':luc']  = $lucDesc; }
    $w = $conditions ? 'WHERE '.implode(' AND ', $conditions) : '';
    $countStmt = $pdo->prepare("SELECT COUNT(*) FROM `stluciecty_singleFamily` $w");
    $countStmt->execute($params);
    $total = (int)$countStmt->fetchColumn();
    $stmt = $pdo->prepare("SELECT `id`,`Property ID`,`Parcel ID`,`Situs`,`Owner`,`City`,`State`,`Zip Code`,`Grantor`,`Grantee`,`Sale Price`,`Sale Date`,`Finished Area (sq ft)`,`Bedrooms`,`Bathrooms`,`Year Built`,`OR Book`,`OR Page`,`LUC`,`LUC Description`,`District Group`,`District Group Description` FROM `stluciecty_singleFamily` $w ORDER BY `$sort` $dir LIMIT :limit OFFSET :offset");
    foreach ($params as $k => $v) $stmt->bindValue($k, $v);
    $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    echo json_encode(['success' => true, 'total' => $total, 'page' => $page, 'per_page' => $perPage, 'pages' => (int)ceil($total/$perPage), 'records' => $stmt->fetchAll()]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Query failed.']);
}
