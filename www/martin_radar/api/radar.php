<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../includes/db.php';

$score_min = max(0,   (int)($_GET['score_min']  ?? 0));
$score_max = min(100, (int)($_GET['score_max']  ?? 100));
$city      = trim($_GET['city']      ?? '');
$tier      = trim($_GET['tier']      ?? '');
$homestead = trim($_GET['homestead'] ?? '');
$yr        = trim($_GET['yr']        ?? '');
$search    = trim($_GET['search']    ?? '');
$sort      = $_GET['sort']           ?? 'score';
$dir       = strtoupper($_GET['dir'] ?? 'DESC') === 'ASC' ? 'ASC' : 'DESC';
$page      = max(1, (int)($_GET['page']     ?? 1));
$perPage   = min(100, max(10, (int)($_GET['per_page'] ?? 25)));
$offset    = ($page - 1) * $perPage;

$allowedSort = ['score','SalePrice','SaleDate','days_held','JustValue','PremiumPaid','SiteCity'];
if (!in_array($sort, $allowedSort)) $sort = 'score';

try {
    $pdo = getDBConnection();
    $conditions = ['score >= :smin', 'score <= :smax'];
    $params = [':smin' => $score_min, ':smax' => $score_max];

    if ($city      !== '') { $conditions[] = 'SiteCity = :city';    $params[':city'] = $city; }
    if ($tier      !== '') { $conditions[] = 'price_tier = :tier';  $params[':tier'] = $tier; }
    if ($homestead !== '') { $conditions[] = 'Homestead = :hs';     $params[':hs']   = $homestead; }
    if ($yr        !== '') { $conditions[] = 'yr_bought = :yr';     $params[':yr']   = (int)$yr; }
    if ($search    !== '') {
        $conditions[] = '(CurrentOwner LIKE :s OR SiteAddress LIKE :s OR SiteCity LIKE :s)';
        $params[':s'] = '%' . $search . '%';
    }

    $w = 'WHERE ' . implode(' AND ', $conditions);

    // Total count
    $cs = $pdo->prepare("SELECT COUNT(*) FROM martin_motivated_sellers $w");
    $cs->execute($params);
    $total = (int)$cs->fetchColumn();

    // Records
    $st = $pdo->prepare("
        SELECT id, PropertyID, ParcelID, SaleDate, SalePrice, DeedType,
            CurrentOwner, PeakSeller,
            SiteAddress, SiteCity, SiteZip,
            MailStreet, MailCity, MailState, MailZip,
            Homestead, JustValue, AssessedValue, PremiumPaid,
            Bedrooms, LUC, score, score_reasons,
            yr_bought, days_held, is_llc_owner, price_tier
        FROM martin_motivated_sellers $w
        ORDER BY `$sort` $dir, SalePrice DESC
        LIMIT $perPage OFFSET $offset
    ");
    $st->execute($params);
    $records = $st->fetchAll();

    // Summary stats
    $ss = $pdo->prepare("
        SELECT
            COUNT(*)                                                    AS total,
            SUM(CASE WHEN score >= 80 THEN 1 ELSE 0 END)               AS hot,
            SUM(CASE WHEN score BETWEEN 60 AND 79 THEN 1 ELSE 0 END)   AS warm,
            SUM(CASE WHEN score BETWEEN 40 AND 59 THEN 1 ELSE 0 END)   AS moderate,
            SUM(CASE WHEN Homestead = 'N' THEN 1 ELSE 0 END)           AS investors,
            ROUND(AVG(SalePrice), 0)                                    AS avg_peak_price,
            ROUND(AVG(JustValue), 0)                                    AS avg_just,
            ROUND(AVG(PremiumPaid), 1)                                  AS avg_premium,
            ROUND(AVG(days_held / 365.0), 1)                           AS avg_yrs_held
        FROM martin_motivated_sellers $w
    ");
    $ss->execute($params);
    $summary = $ss->fetch();

    // City counts
    $cc = $pdo->query("
        SELECT SiteCity AS city, COUNT(*) AS cnt,
            SUM(CASE WHEN score >= 60 THEN 1 ELSE 0 END) AS hot_warm
        FROM martin_motivated_sellers
        WHERE SiteCity IS NOT NULL AND SiteCity != ''
        GROUP BY SiteCity HAVING cnt >= 5
        ORDER BY hot_warm DESC LIMIT 20
    ")->fetchAll();

    echo json_encode([
        'success'  => true,
        'total'    => $total,
        'page'     => $page,
        'per_page' => $perPage,
        'pages'    => (int)ceil($total / $perPage),
        'records'  => $records,
        'summary'  => $summary,
        'cities'   => $cc,
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
