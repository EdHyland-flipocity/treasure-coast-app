<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../includes/db.php';
set_time_limit(60);
ini_set('memory_limit','256M');

$mode = trim($_GET['mode'] ?? 'summary');

try {
    $pdo = getDBConnection();
    $pdo->exec("SET SESSION sql_mode=''");

    if ($mode === 'summary') {

        // Year cycle — WD only, cap outliers at $2M
        $cycle = $pdo->query("
            SELECT 
                YEAR(SaleDate) as yr,
                COUNT(*) as transactions,
                ROUND(AVG(CASE WHEN SalePrice <= 2000000 THEN SalePrice END)) as avg_price,
                SUM(CASE WHEN DeedType='QC' THEN 1 ELSE 0 END) as quit_claims,
                SUM(CASE WHEN DeedType='CT' THEN 1 ELSE 0 END) as consent_deeds,
                COUNT(DISTINCT ParcelID) as unique_parcels,
                ROUND(100.0 * SUM(CASE WHEN DeedType IN ('QC','CT') THEN 1 ELSE 0 END) / COUNT(*), 2) as stress_pct
            FROM indian_river_sales
            WHERE YEAR(SaleDate) >= 2000
            AND SaleDate IS NOT NULL
            AND DeedType = 'WD'
            AND SalePrice > 10000
            GROUP BY yr
            ORDER BY yr
        ")->fetchAll();

        // KPI summary
        $kpi = $pdo->query("
            SELECT
                COUNT(*) as total_wd,
                ROUND(AVG(CASE WHEN SalePrice <= 2000000 THEN SalePrice END)) as avg_price,
                COUNT(DISTINCT ParcelID) as unique_parcels,
                ROUND(AVG(CASE WHEN YEAR(SaleDate)=2025 AND SalePrice<=2000000 THEN SalePrice END)) as avg_2025,
                ROUND(AVG(CASE WHEN YEAR(SaleDate)=2024 AND SalePrice<=2000000 THEN SalePrice END)) as avg_2024,
                ROUND(AVG(CASE WHEN YEAR(SaleDate)=2022 AND SalePrice<=2000000 THEN SalePrice END)) as peak_avg
            FROM indian_river_sales
            WHERE DeedType='WD' AND SalePrice > 10000 AND SaleDate IS NOT NULL
        ")->fetch();

        // Out of state owners
        $oos = $pdo->query("
            SELECT State, COUNT(*) as cnt
            FROM indian_river_owners
            WHERE State != 'FL' AND State IS NOT NULL AND State != ''
            AND PrimaryOwner = 'Y'
            GROUP BY State
            ORDER BY cnt DESC
            LIMIT 12
        ")->fetchAll();

        // Flip summary
        $flips = $pdo->query("
            SELECT
                COUNT(*) as total_pairs,
                ROUND(AVG(gain_pct),1) as avg_gain_pct,
                ROUND(AVG(gain_dollars)) as avg_gain_dollars,
                ROUND(AVG(hold_days)) as avg_hold_days,
                MAX(gain_pct) as best_flip_pct,
                ROUND(SUM(gain_dollars)/1000000000,2) as total_value_b
            FROM indian_river_flip_pairs
        ")->fetch();

        // Stress by year (all deed types)
        $stress = $pdo->query("
            SELECT
                YEAR(SaleDate) as yr,
                ROUND(100.0 * SUM(CASE WHEN DeedType='QC' THEN 1 ELSE 0 END) / COUNT(*), 2) as qc_pct,
                ROUND(100.0 * SUM(CASE WHEN DeedType='CT' THEN 1 ELSE 0 END) / COUNT(*), 2) as ct_pct,
                ROUND(100.0 * SUM(CASE WHEN DeedType IN ('QC','CT') THEN 1 ELSE 0 END) / COUNT(*), 2) as total_stress
            FROM indian_river_sales
            WHERE YEAR(SaleDate) >= 2000 AND SaleDate IS NOT NULL
            GROUP BY yr ORDER BY yr
        ")->fetchAll();

        // Price tiers
        $tiers = $pdo->query("
            SELECT
                YEAR(SaleDate) as yr,
                SUM(CASE WHEN SalePrice < 200000 THEN 1 ELSE 0 END) as under_200k,
                SUM(CASE WHEN SalePrice BETWEEN 200000 AND 399999 THEN 1 ELSE 0 END) as t200_400k,
                SUM(CASE WHEN SalePrice BETWEEN 400000 AND 599999 THEN 1 ELSE 0 END) as t400_600k,
                SUM(CASE WHEN SalePrice BETWEEN 600000 AND 999999 THEN 1 ELSE 0 END) as t600k_1m,
                SUM(CASE WHEN SalePrice >= 1000000 THEN 1 ELSE 0 END) as over_1m,
                COUNT(*) as total
            FROM indian_river_sales
            WHERE DeedType='WD' AND SalePrice > 10000
            AND YEAR(SaleDate) >= 2010
            GROUP BY yr ORDER BY yr
        ")->fetchAll();

        // Top grantors
        $grantors = $pdo->query("
            SELECT Grantor,
                COUNT(*) as transactions,
                ROUND(AVG(SalePrice)) as avg_price,
                ROUND(SUM(SalePrice)) as total_volume,
                MIN(YEAR(SaleDate)) as first_yr,
                MAX(YEAR(SaleDate)) as last_yr
            FROM indian_river_sales
            WHERE DeedType='WD' AND SalePrice > 10000
            AND YEAR(SaleDate) >= 2015
            AND Grantor IS NOT NULL AND Grantor != ''
            GROUP BY Grantor
            HAVING transactions >= 10
            ORDER BY transactions DESC
            LIMIT 15
        ")->fetchAll();

        echo json_encode([
            'success' => true,
            'cycle'   => $cycle,
            'kpi'     => $kpi,
            'oos'     => $oos,
            'flips'   => $flips,
            'stress'  => $stress,
            'tiers'   => $tiers,
            'grantors'=> $grantors,
        ]);

    } elseif ($mode === 'flips') {

        $page    = max(1, (int)($_GET['page'] ?? 1));
        $perPage = min(50, max(10, (int)($_GET['per_page'] ?? 25)));
        $offset  = ($page - 1) * $perPage;
        $yearFrom = (int)($_GET['year_from'] ?? 2020);
        $yearTo   = (int)($_GET['year_to']   ?? 2026);
        $minGain  = (float)($_GET['min_gain'] ?? 0);
        $grantor  = trim($_GET['grantor'] ?? '');

        $cond = ['YEAR(buy_date) >= :yf', 'YEAR(buy_date) <= :yt'];
        $params = [':yf'=>$yearFrom, ':yt'=>$yearTo];
        if ($minGain > 0) { $cond[] = 'gain_pct >= :mg'; $params[':mg'] = $minGain; }
        if ($grantor !== '') { $cond[] = 'seller LIKE :gr'; $params[':gr'] = '%'.$grantor.'%'; }
        $w = 'WHERE '.implode(' AND ', $cond);

        $total = $pdo->prepare("SELECT COUNT(*) FROM indian_river_flip_pairs $w");
        $total->execute($params);
        $totalCount = (int)$total->fetchColumn();

        $rows = $pdo->prepare("
            SELECT * FROM indian_river_flip_pairs $w
            ORDER BY gain_pct DESC
            LIMIT $perPage OFFSET $offset
        ");
        $rows->execute($params);

        echo json_encode([
            'success' => true,
            'total'   => $totalCount,
            'page'    => $page,
            'pages'   => (int)ceil($totalCount/$perPage),
            'flips'   => $rows->fetchAll(),
        ]);

    } elseif ($mode === 'owners') {

        $search  = trim($_GET['search'] ?? '');
        $state   = trim($_GET['state']  ?? '');
        $page    = max(1, (int)($_GET['page'] ?? 1));
        $perPage = 25;
        $offset  = ($page - 1) * $perPage;

        $cond = ['o.PrimaryOwner = "Y"'];
        $params = [];
        if ($search !== '') {
            $cond[] = '(o.OwnerName LIKE :s OR o.Address1 LIKE :s2 OR o.ParcelID LIKE :s3)';
            $params[':s']  = '%'.$search.'%';
            $params[':s2'] = '%'.$search.'%';
            $params[':s3'] = '%'.$search.'%';
        }
        if ($state !== '' && $state !== 'FL') {
            $cond[] = 'o.State = :st';
            $params[':st'] = $state;
        }
        $w = 'WHERE '.implode(' AND ', $cond);

        $total = $pdo->prepare("SELECT COUNT(*) FROM indian_river_owners o $w");
        $total->execute($params);
        $totalCount = (int)$total->fetchColumn();

        $rows = $pdo->prepare("
            SELECT o.*, 
                s.last_sale_date, s.last_sale_price, s.total_purchases
            FROM indian_river_owners o
            LEFT JOIN (
                SELECT Grantee,
                    MAX(SaleDate) as last_sale_date,
                    MAX(SalePrice) as last_sale_price,
                    COUNT(*) as total_purchases
                FROM indian_river_sales
                WHERE DeedType='WD' AND SalePrice > 10000
                GROUP BY Grantee
            ) s ON s.Grantee = o.OwnerName
            $w
            ORDER BY o.OwnerName
            LIMIT $perPage OFFSET $offset
        ");
        $rows->execute($params);

        echo json_encode([
            'success' => true,
            'total'   => $totalCount,
            'page'    => $page,
            'pages'   => (int)ceil($totalCount/$perPage),
            'owners'  => $rows->fetchAll(),
        ]);
    }

} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(['success'=>false,'error'=>$e->getMessage()]);
}
