<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../includes/db.php';

$type       = trim($_GET['type']     ?? '');
$counties   = trim($_GET['counties'] ?? '');
$search     = trim($_GET['search']   ?? '');
$sort       = $_GET['sort']          ?? 'total_txn';
$dir        = strtoupper($_GET['dir'] ?? 'DESC') === 'ASC' ? 'ASC' : 'DESC';
$page       = max(1,(int)($_GET['page']     ?? 1));
$perPage    = min(100,max(10,(int)($_GET['per_page'] ?? 50)));
$offset     = ($page-1)*$perPage;

$allowedSort = ['total_txn','total_vol_m','overall_avg','county_count',
                'sara_txn','mana_txn','stlu_txn','first_seen','last_seen'];
if(!in_array($sort,$allowedSort)) $sort='total_txn';

try {
    $pdo = getDBConnection();
    $conditions = [];
    $params     = [];

    if($type !== '' && $type !== 'All') {
        $conditions[] = 'entity_type = :type';
        $params[':type'] = $type;
    }
    if($counties === '2+') {
        $conditions[] = 'county_count >= 2';
    } elseif($counties === '3') {
        $conditions[] = 'county_count >= 3';
    } elseif($counties === 'Sarasota') {
        $conditions[] = 'sara_txn > 0';
    } elseif($counties === 'Manatee') {
        $conditions[] = 'mana_txn > 0';
    } elseif($counties === 'St.Lucie') {
        $conditions[] = 'stlu_txn > 0';
    } elseif($counties === 'Lee') {
        $conditions[] = 'lee_txn > 0';
    } elseif($counties === 'Pinellas') {
        $conditions[] = 'pin_parcels > 0';
    }
    if($search !== '') {
        $conditions[] = 'display_name LIKE :search';
        $params[':search'] = '%'.$search.'%';
    }

    $w = $conditions ? 'WHERE '.implode(' AND ',$conditions) : '';

    $cs = $pdo->prepare("SELECT COUNT(*) FROM entity_intelligence $w");
    $cs->execute($params);
    $total = (int)$cs->fetchColumn();

    $st = $pdo->prepare("
        SELECT id, display_name, entity_type, county_count, counties_list,
               sara_txn, sara_vol_m, sara_avg, sara_first, sara_last,
               mana_txn, mana_vol_m, mana_avg, mana_first, mana_last,
               stlu_txn, stlu_vol_m, stlu_avg, stlu_first, stlu_last,
               lee_txn, lee_vol_m, lee_avg, lee_first, lee_last,
               brev_txn, brev_vol_m, brev_avg, brev_first, brev_last, brev_parcels,
               pin_parcels, pin_first, pin_last,
               total_txn, total_vol_m, overall_avg, first_seen, last_seen,
               canonical_name
        FROM entity_intelligence $w
        ORDER BY `$sort` $dir
        LIMIT $perPage OFFSET $offset
    ");
    $st->execute($params);
    $records = $st->fetchAll();

    // Summary stats
    $ss = $pdo->prepare("
        SELECT COUNT(*) AS total_entities,
               SUM(CASE WHEN county_count >= 2 THEN 1 ELSE 0 END) AS multi_county,
               SUM(CASE WHEN county_count = 3 THEN 1 ELSE 0 END) AS tri_county,
               SUM(total_txn) AS total_transactions,
               ROUND(SUM(total_vol_m),1) AS total_volume_b,
               COUNT(DISTINCT entity_type) AS types
        FROM entity_intelligence $w
    ");
    $ss->execute($params);
    $summary = $ss->fetch();

    // Type counts for filter tabs
    $tc = $pdo->query("
        SELECT entity_type, COUNT(*) AS cnt
        FROM entity_intelligence
        GROUP BY entity_type ORDER BY cnt DESC
    ")->fetchAll();

    echo json_encode([
        'success'  => true,
        'total'    => $total,
        'page'     => $page,
        'per_page' => $perPage,
        'pages'    => (int)ceil($total/$perPage),
        'records'  => $records,
        'summary'  => $summary,
        'type_counts' => $tc,
    ]);

} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(['success'=>false,'error'=>$e->getMessage()]);
}
