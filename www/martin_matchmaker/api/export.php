<?php
require_once __DIR__ . '/../includes/db.php';

$city = trim($_GET['city'] ?? '');
$tier = trim($_GET['tier'] ?? '');
$mode = trim($_GET['mode'] ?? 'matches');

header('Content-Type: text/csv');
header('Content-Disposition: attachment; filename="martin_'.$mode.'_'.date('Y-m-d').'.csv"');

try {
    $pdo = getDBConnection();
    $out = fopen('php://output', 'w');

    if ($mode === 'buyers') {
        fputcsv($out, ['Buyer Name','Entity','Purchases Since 2020','Last Buy','Avg Price',
            'Min Price','Max Price','Price Tier','Primary City','Cities Active',
            'Buy Score','Score Reasons','Mail State','Land Use Preference','Recent Properties']);

        $cond = ['BuyScore >= 50']; $params = [];
        if ($city !== '') { $cond[] = '(PrimaryCity=:city OR Cities LIKE :cl)'; $params[':city']=$city; $params[':cl']='%'.$city.'%'; }
        if ($tier !== '') { $cond[] = 'PriceTier=:tier'; $params[':tier']=$tier; }

        $st = $pdo->prepare('SELECT * FROM martin_motivated_buyers WHERE '.implode(' AND ',$cond).' ORDER BY BuyScore DESC LIMIT 2000');
        $st->execute($params);
        while ($r = $st->fetch()) {
            fputcsv($out, [$r['BuyerName'],$r['IsEntity']?'Yes':'No',$r['PurchasesSince2020'],
                $r['LastBuy'],$r['AvgPrice'],$r['MinPrice'],$r['MaxPrice'],
                $r['PriceTier'],$r['PrimaryCity'],$r['Cities'],$r['BuyScore'],
                $r['ScoreReasons'],$r['MailState'],$r['LandUsePreference'],$r['RecentProperties']]);
        }
    } else {
        // Matched pairs export
        fputcsv($out, [
            'Seller Parcel ID','Seller Address','Seller City','Seller Price','Seller Score',
            'Seller Owner','Year Bought','Days Held','Homestead',
            'Buyer 1','Buyer 1 Score','Buyer 1 City','Buyer 1 Avg Price',
            'Buyer 2','Buyer 2 Score','Buyer 2 City','Buyer 2 Avg Price',
            'Buyer 3','Buyer 3 Score','Buyer 3 City','Buyer 3 Avg Price',
        ]);

        $cond = ['ms.score >= 50']; $params = [];
        if ($city !== '') { $cond[] = 'ms.SiteCity=:city'; $params[':city']=$city; }
        if ($tier !== '') { $cond[] = 'ms.price_tier=:tier'; $params[':tier']=$tier; }

        $sellers = $pdo->prepare('SELECT * FROM martin_motivated_sellers ms WHERE '.implode(' AND ',$cond).' ORDER BY ms.score DESC LIMIT 2000');
        $sellers->execute($params);

        // Load all buyers into memory once — no per-row SQL
        $allBuyers = $pdo->query('SELECT * FROM martin_motivated_buyers WHERE BuyScore>=40 ORDER BY BuyScore DESC')->fetchAll();

        while ($s = $sellers->fetch()) {
            $sCity  = $s['SiteCity'];
            $sTier  = $s['price_tier'];
            $sPrice = floatval($s['SalePrice']);
            $scored = [];

            foreach ($allBuyers as $b) {
                $ms = 0;
                if ($b['PrimaryCity'] === $sCity || strpos($b['Cities'] ?? '', $sCity) !== false) $ms += 40;
                if ($b['PriceTier'] === $sTier) $ms += 30;
                elseif (floatval($b['MinPrice']) <= $sPrice && floatval($b['MaxPrice']) >= $sPrice) $ms += 20;
                $last = $b['LastBuy'] ? strtotime($b['LastBuy']) : 0;
                $ms += $last > strtotime('-12 months') ? 10 : 5;
                if ($b['BuyScore'] >= 70) $ms += 10;
                if ($ms >= 30) $scored[] = ['name'=>$b['BuyerName'],'score'=>$ms,'city'=>$b['PrimaryCity'],'avg'=>$b['AvgPrice']];
            }
            usort($scored, fn($a,$b) => $b['score'] - $a['score']);

            $row = [
                $s['ParcelID'],
                $s['SiteAddress'],
                $s['SiteCity'],
                $s['SalePrice'],
                $s['score'],
                $s['CurrentOwner'],
                $s['yr_bought'],
                $s['days_held'],
                $s['Homestead'] === 'Y' ? 'Owner-Occupied' : 'Investor',
            ];
            for ($i = 0; $i < 3; $i++) {
                $b = $scored[$i] ?? null;
                $row[] = $b ? $b['name']  : '';
                $row[] = $b ? $b['score'] : '';
                $row[] = $b ? $b['city']  : '';
                $row[] = $b ? $b['avg']   : '';
            }
            fputcsv($out, $row);
        }
    }
    fclose($out);
} catch (Exception $e) {
    fputcsv($out ?? fopen('php://output','w'), ['Error: ' . $e->getMessage()]);
}
