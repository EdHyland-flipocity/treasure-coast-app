<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../includes/db.php';

set_time_limit(30);
ini_set('memory_limit','128M');

$mode       = trim($_GET['mode']       ?? 'matches');
$city       = trim($_GET['city']       ?? '');
$tier       = trim($_GET['tier']       ?? '');
$seller_id  = (int)($_GET['seller_id'] ?? 0);
$buyer_name = trim($_GET['buyer']      ?? '');
$page       = max(1, (int)($_GET['page']     ?? 1));
$perPage    = min(20, max(5, (int)($_GET['per_page'] ?? 10)));
$offset     = ($page - 1) * $perPage;

try {
    $pdo = getDBConnection();
    $pdo->exec("SET SESSION sql_mode=''");

    // ── MATCHES mode ──────────────────────────────────────────
    if ($mode === 'matches') {

        $cond = ['ms.score >= 40'];
        $params = [];
        if ($city !== '') { $cond[] = 'ms.SiteCity = :city';   $params[':city'] = $city; }
        if ($tier !== '') { $cond[] = 'ms.price_tier = :tier'; $params[':tier'] = $tier; }
        $address = trim($_GET['address'] ?? '');
        if ($address !== '') {
            $cond[] = '(ms.SiteAddress LIKE :addr OR ms.ParcelID LIKE :addr2 OR ms.CurrentOwner LIKE :addr3)';
            $params[':addr']  = '%'.$address.'%';
            $params[':addr2'] = '%'.$address.'%';
            $params[':addr3'] = '%'.$address.'%';
        }
        $w = 'WHERE ' . implode(' AND ', $cond);

        // Count
        $cs = $pdo->prepare("SELECT COUNT(*) FROM martin_motivated_sellers ms $w");
        $cs->execute($params);
        $total = (int)$cs->fetchColumn();

        // Sellers page
        $st = $pdo->prepare("
            SELECT ms.id, ms.PropertyID, ms.ParcelID,
                ms.SiteAddress, ms.SiteCity, ms.SiteZip,
                ms.CurrentOwner, ms.SaleDate, ms.SalePrice,
                ms.JustValue, ms.PremiumPaid, ms.Homestead,
                ms.Bedrooms, ms.LUC, ms.score AS seller_score,
                ms.score_reasons, ms.price_tier, ms.yr_bought,
                ms.days_held, ms.is_llc_owner
            FROM martin_motivated_sellers ms $w
            ORDER BY ms.score DESC, ms.SalePrice DESC
            LIMIT $perPage OFFSET $offset
        ");
        $st->execute($params);
        $sellers = $st->fetchAll();

        // Pre-load ALL buyers indexed by city+tier for fast matching
        // (1475 rows is tiny — load once, match in PHP)
        $allBuyers = $pdo->query("
            SELECT BuyerName, IsEntity, PurchasesSince2020,
                LastBuy, AvgPrice, MinPrice, MaxPrice,
                PriceTier, PrimaryCity, Cities,
                BuyScore, MailState, MailCity, LandUsePreference
            FROM martin_motivated_buyers
            WHERE BuyScore >= 40
            ORDER BY BuyScore DESC
        ")->fetchAll();

        // Match in PHP — much faster than per-row SQL
        foreach ($sellers as &$s) {
            $sCity  = $s['SiteCity'];
            $sTier  = $s['price_tier'];
            $sPrice = floatval($s['SalePrice']);
            $scored = [];

            foreach ($allBuyers as $b) {
                $ms = 0;
                // City match
                if ($b['PrimaryCity'] === $sCity || strpos($b['Cities'] ?? '', $sCity) !== false)
                    $ms += 40;
                // Tier/price match
                if ($b['PriceTier'] === $sTier)
                    $ms += 30;
                elseif ($b['MinPrice'] <= $sPrice && $b['MaxPrice'] >= $sPrice)
                    $ms += 20;
                // Recency
                $lastBuy = $b['LastBuy'] ? strtotime($b['LastBuy']) : 0;
                $ms += $lastBuy > strtotime('-12 months') ? 10 : 5;
                // Buyer score bonus
                if ($b['BuyScore'] >= 70) $ms += 10;

                if ($ms >= 30) $scored[] = array_merge($b, ['match_score' => $ms]);
            }
            usort($scored, fn($a,$b) => $b['match_score'] - $a['match_score']);
            $s['matched_buyers'] = array_slice($scored, 0, 4);
        }

        // Summary (fast — uses indexed counts)
        $summary = $pdo->query("
            SELECT
                (SELECT COUNT(*) FROM martin_motivated_sellers WHERE score>=40)  AS total_sellers,
                (SELECT COUNT(*) FROM martin_motivated_sellers WHERE score>=80)  AS hot_sellers,
                (SELECT COUNT(*) FROM martin_motivated_buyers)                   AS total_buyers,
                (SELECT COUNT(*) FROM martin_motivated_buyers WHERE BuyScore>=70) AS hot_buyers,
                (SELECT COUNT(*) FROM martin_motivated_buyers WHERE IsEntity=1)  AS entity_buyers,
                (SELECT COUNT(*) FROM martin_motivated_buyers
                 WHERE LastBuy >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH))         AS recent_buyers
        ")->fetch();

        // City tabs (cached query — simple GROUP BY)
        $cities = $pdo->query("
            SELECT SiteCity AS city, COUNT(*) AS sellers,
                SUM(CASE WHEN score>=60 THEN 1 ELSE 0 END) AS hot_warm
            FROM martin_motivated_sellers
            WHERE score>=40 AND SiteCity IS NOT NULL AND SiteCity!=''
            GROUP BY SiteCity HAVING sellers>=3
            ORDER BY sellers DESC LIMIT 15
        ")->fetchAll();

        echo json_encode([
            'success'  => true, 'mode' => 'matches',
            'total'    => $total, 'page' => $page,
            'pages'    => (int)ceil($total/$perPage),
            'per_page' => $perPage,
            'sellers'  => $sellers,
            'summary'  => $summary,
            'cities'   => $cities,
        ]);

    // ── BUYERS mode ───────────────────────────────────────────
    } elseif ($mode === 'buyers') {

        $cond = ['BuyScore >= 40'];
        $params = [];
        if ($city !== '') {
            $cond[] = '(PrimaryCity=:city OR Cities LIKE :cl)';
            $params[':city'] = $city; $params[':cl'] = '%'.$city.'%';
        }
        if ($tier !== '') { $cond[] = 'PriceTier=:tier'; $params[':tier'] = $tier; }
        if ($buyer_name !== '') { $cond[] = 'BuyerName LIKE :b'; $params[':b'] = '%'.$buyer_name.'%'; }
        $w = 'WHERE '.implode(' AND ',$cond);

        $cs = $pdo->prepare("SELECT COUNT(*) FROM martin_motivated_buyers $w");
        $cs->execute($params); $total=(int)$cs->fetchColumn();

        $st = $pdo->prepare("SELECT * FROM martin_motivated_buyers $w ORDER BY BuyScore DESC,LastBuy DESC LIMIT $perPage OFFSET $offset");
        $st->execute($params);

        echo json_encode([
            'success'  => true, 'mode' => 'buyers',
            'total'    => $total, 'page' => $page,
            'pages'    => (int)ceil($total/$perPage),
            'per_page' => $perPage,
            'buyers'   => $st->fetchAll(),
        ]);

    // ── SELLER DETAIL mode ────────────────────────────────────
    } elseif ($mode === 'seller_detail' && $seller_id) {

        $s = $pdo->prepare("SELECT * FROM martin_motivated_sellers WHERE id=:id");
        $s->execute([':id'=>$seller_id]);
        $seller = $s->fetch();
        if (!$seller) { echo json_encode(['success'=>false,'error'=>'Not found']); exit; }

        $parcel = $pdo->prepare("
            SELECT p.*, ps.YearBuilt, ps.BuildingTypeDescription, ps.Beds, ps.Baths, ps.TotalFinishedArea,
                pv.JustMarketValue, pv.TotalTaxableValue
            FROM martin_parcels p
            LEFT JOIN martin_parcel_structure ps ON ps.PropertyID=p.PropertyID
            LEFT JOIN martin_parcel_values pv ON pv.PropertyID=p.PropertyID
            WHERE p.PropertyID=:pid
        ");
        $parcel->execute([':pid'=>$seller['PropertyID']]);

        // Load buyers and match in PHP
        $allBuyers = $pdo->query("
            SELECT * FROM martin_motivated_buyers WHERE BuyScore>=30 ORDER BY BuyScore DESC
        ")->fetchAll();

        $sCity=$seller['SiteCity']; $sTier=$seller['price_tier']; $sPrice=floatval($seller['SalePrice']);
        $scored=[];
        foreach($allBuyers as $b){
            $ms=0;
            if($b['PrimaryCity']===$sCity||strpos($b['Cities']??'',$sCity)!==false) $ms+=40;
            if($b['PriceTier']===$sTier) $ms+=30;
            elseif($b['MinPrice']<=$sPrice&&$b['MaxPrice']>=$sPrice) $ms+=20;
            $lastBuy=$b['LastBuy']?strtotime($b['LastBuy']):0;
            $ms+=$lastBuy>strtotime('-12 months')?10:5;
            if($b['BuyScore']>=70) $ms+=10;
            if($ms>=25) $scored[]=array_merge($b,['match_score'=>$ms]);
        }
        usort($scored,fn($a,$b)=>$b['match_score']-$a['match_score']);

        echo json_encode([
            'success'=>true,'mode'=>'seller_detail',
            'seller'=>$seller,'parcel'=>$parcel->fetch(),
            'buyers'=>array_slice($scored,0,10),
        ]);
    }

} catch(PDOException $e){
    http_response_code(500);
    echo json_encode(['success'=>false,'error'=>$e->getMessage()]);
}
