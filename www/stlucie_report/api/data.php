<?php
header('Content-Type: application/json');

$cacheFile = sys_get_temp_dir() . '/stlucie_report_cache.json';
$cacheTTL  = 86400;

if (file_exists($cacheFile) && (time() - filemtime($cacheFile)) < $cacheTTL) {
    echo file_get_contents($cacheFile);
    exit;
}

require_once __DIR__ . '/../includes/db.php';
set_time_limit(120);
ini_set('memory_limit', '256M');

try {
    $pdo = getDBConnection();
    $pdo->exec("SET SESSION sql_mode=''");

    // Helper: clean price expression
    $priceExpr = "CAST(REPLACE(REPLACE(`Sale Price`,'$',''),',','') AS DECIMAL(14,2))";
    $validPrice = "`Sale Price` NOT IN ('\$0','') AND $priceExpr > 10000 AND $priceExpr < 10000000";

    // 1. Quarterly trend
    $quarterly = $pdo->query("
        SELECT
            SUBSTRING(`Sale Date`,7,4) AS yr,
            CASE
                WHEN SUBSTRING(`Sale Date`,1,2) IN ('01','02','03') THEN 'Q1'
                WHEN SUBSTRING(`Sale Date`,1,2) IN ('04','05','06') THEN 'Q2'
                WHEN SUBSTRING(`Sale Date`,1,2) IN ('07','08','09') THEN 'Q3'
                ELSE 'Q4'
            END AS qtr,
            CONCAT(SUBSTRING(`Sale Date`,7,4),' ',
                CASE
                    WHEN SUBSTRING(`Sale Date`,1,2) IN ('01','02','03') THEN 'Q1'
                    WHEN SUBSTRING(`Sale Date`,1,2) IN ('04','05','06') THEN 'Q2'
                    WHEN SUBSTRING(`Sale Date`,1,2) IN ('07','08','09') THEN 'Q3'
                    ELSE 'Q4'
                END) AS label,
            COUNT(*) AS sales,
            ROUND(AVG($priceExpr),0) AS avg_price,
            ROUND(MIN($priceExpr),0) AS min_price,
            ROUND(MAX($priceExpr),0) AS max_price,
            COUNT(DISTINCT `Parcel ID`) AS unique_parcels
        FROM stluciecty_singleFamily
        WHERE $validPrice
        GROUP BY yr, qtr
        ORDER BY yr, qtr
    ")->fetchAll();

    // 2. Out-of-state buyer analysis
    $outOfState = $pdo->query("
        SELECT
            State,
            COUNT(*) AS buyers,
            ROUND(AVG($priceExpr),0) AS avg_price
        FROM stluciecty_singleFamily
        WHERE State != 'FL' AND State != '' AND State IS NOT NULL
        AND $validPrice
        GROUP BY State
        ORDER BY buyers DESC
        LIMIT 15
    ")->fetchAll();

    // 3. FL vs out-of-state breakdown by quarter
    $buyerOrigin = $pdo->query("
        SELECT
            CONCAT(SUBSTRING(`Sale Date`,7,4),' ',
                CASE
                    WHEN SUBSTRING(`Sale Date`,1,2) IN ('01','02','03') THEN 'Q1'
                    WHEN SUBSTRING(`Sale Date`,1,2) IN ('04','05','06') THEN 'Q2'
                    WHEN SUBSTRING(`Sale Date`,1,2) IN ('07','08','09') THEN 'Q3'
                    ELSE 'Q4'
                END) AS label,
            SUM(CASE WHEN State='FL' THEN 1 ELSE 0 END) AS fl_buyers,
            SUM(CASE WHEN State!='FL' AND State!='' AND State IS NOT NULL THEN 1 ELSE 0 END) AS out_of_state,
            SUM(CASE WHEN State='' OR State IS NULL THEN 1 ELSE 0 END) AS unknown
        FROM stluciecty_singleFamily
        WHERE $validPrice
        GROUP BY label
        ORDER BY SUBSTRING(`Sale Date`,7,4), SUBSTRING(`Sale Date`,1,2)
    ")->fetchAll();

    // 4. Bedroom price analysis
    $bedrooms = $pdo->query("
        SELECT
            Bedrooms,
            COUNT(*) AS sales,
            ROUND(AVG($priceExpr),0) AS avg_price,
            ROUND(MIN($priceExpr),0) AS min_price,
            ROUND(MAX($priceExpr),0) AS max_price
        FROM stluciecty_singleFamily
        WHERE $validPrice
        AND Bedrooms IN ('1','2','3','4','5','6')
        GROUP BY Bedrooms
        ORDER BY CAST(Bedrooms AS UNSIGNED)
    ")->fetchAll();

    // 5. Top selling cities (normalize Port St Lucie variants)
    $cities = $pdo->query("
        SELECT
            CASE
                WHEN City IN ('Port St Lucie','Port Saint Lucie','Port Saint Lucie ','PSL') THEN 'Port St Lucie'
                WHEN City IN ('Fort Pierce','Ft Pierce') THEN 'Fort Pierce'
                ELSE City
            END AS city_name,
            COUNT(*) AS sales,
            ROUND(AVG($priceExpr),0) AS avg_price
        FROM stluciecty_singleFamily
        WHERE $validPrice AND City != '' AND City IS NOT NULL
        GROUP BY city_name
        HAVING sales >= 20
        ORDER BY sales DESC
        LIMIT 12
    ")->fetchAll();

    // 6. Year built analysis — age of homes selling
    $yearBuilt = $pdo->query("
        SELECT
            CASE
                WHEN CAST(`Year Built` AS UNSIGNED) < 1980 THEN 'Pre-1980'
                WHEN CAST(`Year Built` AS UNSIGNED) < 1990 THEN '1980s'
                WHEN CAST(`Year Built` AS UNSIGNED) < 2000 THEN '1990s'
                WHEN CAST(`Year Built` AS UNSIGNED) < 2010 THEN '2000s'
                WHEN CAST(`Year Built` AS UNSIGNED) < 2020 THEN '2010s'
                ELSE '2020+'
            END AS era,
            COUNT(*) AS sales,
            ROUND(AVG($priceExpr),0) AS avg_price
        FROM stluciecty_singleFamily
        WHERE $validPrice
        AND `Year Built` != '' AND `Year Built` IS NOT NULL
        AND CAST(`Year Built` AS UNSIGNED) > 1950
        GROUP BY era
        ORDER BY FIELD(era,'Pre-1980','1980s','1990s','2000s','2010s','2020+')
    ")->fetchAll();

    // 7. Price per sqft analysis
    $sqft = $pdo->query("
        SELECT
            CASE
                WHEN CAST(`Finished Area (sq ft)` AS UNSIGNED) < 1000 THEN 'Under 1,000'
                WHEN CAST(`Finished Area (sq ft)` AS UNSIGNED) < 1500 THEN '1,000–1,500'
                WHEN CAST(`Finished Area (sq ft)` AS UNSIGNED) < 2000 THEN '1,500–2,000'
                WHEN CAST(`Finished Area (sq ft)` AS UNSIGNED) < 2500 THEN '2,000–2,500'
                WHEN CAST(`Finished Area (sq ft)` AS UNSIGNED) < 3000 THEN '2,500–3,000'
                ELSE '3,000+'
            END AS size_band,
            COUNT(*) AS sales,
            ROUND(AVG($priceExpr),0) AS avg_price,
            ROUND(AVG($priceExpr / CAST(`Finished Area (sq ft)` AS UNSIGNED)),0) AS avg_ppsf
        FROM stluciecty_singleFamily
        WHERE $validPrice
        AND `Finished Area (sq ft)` != '' AND `Finished Area (sq ft)` IS NOT NULL
        AND CAST(`Finished Area (sq ft)` AS UNSIGNED) > 500
        GROUP BY size_band
        ORDER BY FIELD(size_band,'Under 1,000','1,000–1,500','1,500–2,000','2,000–2,500','2,500–3,000','3,000+')
    ")->fetchAll();

    // 8. Motivated sellers — out of state owners selling local property
    $motivated = $pdo->query("
        SELECT
            Owner,
            Grantor,
            Grantee,
            `Sale Price`,
            `Sale Date`,
            Situs,
            State AS mailing_state,
            City AS mailing_city,
            Bedrooms,
            Bathrooms,
            `Year Built`,
            `Finished Area (sq ft)` AS sqft
        FROM stluciecty_singleFamily
        WHERE State != 'FL' AND State != '' AND State IS NOT NULL
        AND $validPrice
        ORDER BY $priceExpr DESC
        LIMIT 100
    ")->fetchAll();

    // 9. Summary stats
    $summary = $pdo->query("
        SELECT
            COUNT(*) AS total_sales,
            COUNT(DISTINCT `Parcel ID`) AS unique_parcels,
            COUNT(DISTINCT Owner) AS unique_owners,
            ROUND(AVG($priceExpr),0) AS avg_price,
            ROUND(MIN($priceExpr),0) AS min_price,
            ROUND(MAX($priceExpr),0) AS max_price,
            SUM(CASE WHEN State!='FL' AND State!='' THEN 1 ELSE 0 END) AS out_of_state_buyers,
            ROUND(SUM(CASE WHEN State!='FL' AND State!='' THEN 1 ELSE 0 END)*100.0/COUNT(*),1) AS oos_pct
        FROM stluciecty_singleFamily
        WHERE $validPrice
    ")->fetch();

    $result = json_encode([
        'success'      => true,
        'quarterly'    => $quarterly,
        'outOfState'   => $outOfState,
        'buyerOrigin'  => $buyerOrigin,
        'bedrooms'     => $bedrooms,
        'cities'       => $cities,
        'yearBuilt'    => $yearBuilt,
        'sqft'         => $sqft,
        'motivated'    => $motivated,
        'summary'      => $summary,
    ]);

    file_put_contents($cacheFile, $result);
    echo $result;

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
