<?php
require_once __DIR__ . '/../includes/db.php';

$score_min = max(0,   (int)($_GET['score_min'] ?? 60));
$score_max = min(100, (int)($_GET['score_max'] ?? 100));
$city      = trim($_GET['city']      ?? '');
$tier      = trim($_GET['tier']      ?? '');
$homestead = trim($_GET['homestead'] ?? '');

header('Content-Type: text/csv');
header('Content-Disposition: attachment; filename="martin_motivated_sellers_' . date('Y-m-d') . '.csv"');

try {
    $pdo = getDBConnection();
    $conditions = ['score >= :smin', 'score <= :smax'];
    $params = [':smin' => $score_min, ':smax' => $score_max];

    if ($city      !== '') { $conditions[] = 'SiteCity = :city';   $params[':city'] = $city; }
    if ($tier      !== '') { $conditions[] = 'price_tier = :tier'; $params[':tier'] = $tier; }
    if ($homestead !== '') { $conditions[] = 'Homestead = :hs';    $params[':hs']   = $homestead; }

    $w  = 'WHERE ' . implode(' AND ', $conditions);
    $st = $pdo->prepare("
        SELECT ParcelID, SiteAddress, SiteCity, SiteZip,
            MailStreet, MailCity, MailState, MailZip,
            CurrentOwner, PeakSeller, SaleDate, SalePrice,
            Homestead, JustValue, PremiumPaid, Bedrooms,
            days_held, score, score_reasons, price_tier, yr_bought, is_llc_owner
        FROM martin_motivated_sellers $w
        ORDER BY score DESC, SalePrice DESC
        LIMIT 5000
    ");
    $st->execute($params);

    $out = fopen('php://output', 'w');
    fputcsv($out, [
        'Parcel ID', 'Site Address', 'City', 'Zip',
        'Mail Street', 'Mail City', 'Mail State', 'Mail Zip',
        'Current Owner', 'Peak Seller', 'Peak Sale Date', 'Peak Sale Price',
        'Homestead', 'Just Value', 'Premium Paid %', 'Bedrooms',
        'Days Held', 'Score', 'Score Reasons', 'Price Tier', 'Year Bought', 'LLC Owner'
    ]);

    while ($row = $st->fetch()) {
        fputcsv($out, [
            $row['ParcelID'],
            $row['SiteAddress'],
            $row['SiteCity'],
            $row['SiteZip'],
            $row['MailStreet'],
            $row['MailCity'],
            $row['MailState'],
            $row['MailZip'],
            $row['CurrentOwner'],
            $row['PeakSeller'],
            $row['SaleDate'],
            $row['SalePrice'],
            $row['Homestead'] === 'Y' ? 'Owner-Occupied' : 'Investor',
            $row['JustValue'],
            $row['PremiumPaid'],
            $row['Bedrooms'],
            $row['days_held'],
            $row['score'],
            $row['score_reasons'],
            $row['price_tier'],
            $row['yr_bought'],
            $row['is_llc_owner'] ? 'Yes' : 'No',
        ]);
    }
    fclose($out);

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
