<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

try {
    $pdo = new PDO("mysql:host=127.0.0.1;dbname=rt_realestate;charset=utf8mb4", 'crypto', '#42RevresBew!');
    $pdo->exec("SET SESSION sql_mode=''");

    $rows = $pdo->query("
        SELECT 
            e.canonical_name,
            e.total_vol_m,
            e.last_seen,
            COALESCE((
                SELECT SUM(t2.total_vol_m) 
                FROM entity_timeline t2 
                WHERE t2.canonical_name = e.canonical_name 
                AND t2.yr = 2025 AND t2.qtr >= 3
            ), 0) as vol_recent,
            COALESCE((
                SELECT SUM(t3.total_vol_m) 
                FROM entity_timeline t3 
                WHERE t3.canonical_name = e.canonical_name 
                AND t3.yr = 2024 AND t3.qtr >= 3
            ), 0) as vol_prior
        FROM entity_intelligence e
        WHERE e.last_seen >= '2025-01-01'
        ORDER BY e.total_vol_m DESC
        LIMIT 25
    ")->fetchAll(PDO::FETCH_ASSOC);

    $ticker = [];
    foreach ($rows as $e) {
        $recent = floatval($e['vol_recent']);
        $prior  = floatval($e['vol_prior']);
        if ($prior > 0 && $recent > 0) {
            $chg = round(100 * ($recent - $prior) / $prior, 1);
            $dir = $chg > 0.5 ? 'up' : ($chg < -0.5 ? 'down' : 'flat');
        } elseif ($recent > 0 && $prior == 0) {
            $chg = null;
            $dir = 'new';
        } else {
            $chg = null;
            $dir = 'flat';
        }
        $ticker[] = [
            'name'      => $e['canonical_name'],
            'vol_m'     => round(floatval($e['total_vol_m']), 1),
            'recent'    => round($recent, 1),
            'chg'       => $chg,
            'dir'       => $dir,
            'last_seen' => $e['last_seen'],
        ];
    }

    echo json_encode(['success' => true, 'ticker' => $ticker]);

} catch (PDOException $ex) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $ex->getMessage()]);
}
