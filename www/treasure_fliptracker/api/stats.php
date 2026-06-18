<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../includes/db.php';

set_time_limit(30);
$yearFrom = (int)($_GET['year_from'] ?? 2020);
$yearTo   = (int)($_GET['year_to']   ?? 2026);
$minGain  = (float)($_GET['min_gain'] ?? -999);
$minHold  = (int)($_GET['min_hold']  ?? 0);
$maxHold  = (int)($_GET['max_hold']  ?? 99999);
$grantor  = trim($_GET['grantor'] ?? '');

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

    $stats = $pdo->query("
        SELECT
            COUNT(*) AS total_flips,
            COUNT(DISTINCT ParcelID) AS unique_parcels,
            ROUND(AVG(gain_pct),1) AS avg_gain_pct,
            ROUND(AVG(dollar_gain),0) AS avg_dollar_gain,
            ROUND(AVG(hold_days),0) AS avg_hold_days,
            SUM(CASE WHEN sell_price > buy_price THEN 1 ELSE 0 END) AS profitable_flips,
            ROUND(SUM(dollar_gain),0) AS total_value_created,
            ROUND(MAX(gain_pct),1) AS best_flip_pct
        FROM martin_flip_pairs $where
    ")->fetch();

    $distribution = $pdo->query("
        SELECT
            CASE
                WHEN gain_pct < 0   THEN 'Loss'
                WHEN gain_pct < 10  THEN '0–10%'
                WHEN gain_pct < 25  THEN '10–25%'
                WHEN gain_pct < 50  THEN '25–50%'
                WHEN gain_pct < 100 THEN '50–100%'
                ELSE '100%+'
            END AS gain_bucket,
            COUNT(*) AS cnt
        FROM martin_flip_pairs $where
        GROUP BY gain_bucket
        ORDER BY FIELD(gain_bucket,'Loss','0–10%','10–25%','25–50%','50–100%','100%+')
    ")->fetchAll();

    $holdDist = $pdo->query("
        SELECT
            CASE
                WHEN hold_days < 90   THEN '< 3mo'
                WHEN hold_days < 180  THEN '3–6mo'
                WHEN hold_days < 365  THEN '6–12mo'
                WHEN hold_days < 730  THEN '1–2yr'
                WHEN hold_days < 1460 THEN '2–4yr'
                ELSE '4yr+'
            END AS hold_bucket,
            COUNT(*) AS cnt
        FROM martin_flip_pairs $where
        GROUP BY hold_bucket
        ORDER BY FIELD(hold_bucket,'< 3mo','3–6mo','6–12mo','1–2yr','2–4yr','4yr+')
    ")->fetchAll();

    $byYear = $pdo->query("
        SELECT YEAR(buy_date) AS buy_year, COUNT(*) AS flips,
            ROUND(AVG(gain_pct),1) AS avg_gain
        FROM martin_flip_pairs $where
        GROUP BY buy_year ORDER BY buy_year
    ")->fetchAll();

    echo json_encode(['success'=>true,'stats'=>$stats,'distribution'=>$distribution,'holdDist'=>$holdDist,'byYear'=>$byYear]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success'=>false,'error'=>$e->getMessage()]);
}
