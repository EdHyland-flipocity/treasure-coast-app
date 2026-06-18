<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../includes/db.php';

set_time_limit(30);
$yearFrom = (int)($_GET['year_from'] ?? 2023);
$yearTo   = (int)($_GET['year_to']   ?? 2026);
$minGain  = (float)($_GET['min_gain'] ?? -999);
$minHold  = (int)($_GET['min_hold']  ?? 0);
$maxHold  = (int)($_GET['max_hold']  ?? 99999);
$grantor  = trim($_GET['grantor'] ?? '');
$sort     = in_array($_GET['sort'] ?? '', ['gain_pct','dollar_gain','hold_days','buy_price','sell_price']) ? $_GET['sort'] : 'gain_pct';
$dir      = ($_GET['dir'] ?? 'DESC') === 'ASC' ? 'ASC' : 'DESC';
$page     = max(1, (int)($_GET['page'] ?? 1));
$perPage  = min(50, max(10, (int)($_GET['per_page'] ?? 25)));
$offset   = ($page - 1) * $perPage;

$sortMap = [
    'gain_pct'    => 'gain_pct',
    'dollar_gain' => 'dollar_gain',
    'hold_days'   => 'hold_days',
    'buy_price'   => 'buy_price',
    'sell_price'  => 'sell_price',
];
$orderBy = $sortMap[$sort] ?? 'gain_pct';

try {
    $pdo = getDBConnection();

    $where = "WHERE YEAR(buy_date) >= $yearFrom
        AND YEAR(sell_date) <= $yearTo
        AND hold_days >= $minHold
        AND hold_days <= $maxHold
        AND gain_pct >= $minGain";

    if ($grantor !== '') {
        $safe = $pdo->quote('%' . $grantor . '%');
        $where .= " AND seller LIKE $safe";
    }

    $total   = $pdo->query("SELECT COUNT(*) FROM martin_flip_pairs $where")->fetchColumn();
    $records = $pdo->query("
        SELECT * FROM martin_flip_pairs
        $where
        ORDER BY $orderBy $dir
        LIMIT $perPage OFFSET $offset
    ")->fetchAll();

    echo json_encode(['success'=>true, 'total'=>(int)$total, 'page'=>$page, 'perPage'=>$perPage, 'records'=>$records]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success'=>false, 'error'=>$e->getMessage()]);
}
