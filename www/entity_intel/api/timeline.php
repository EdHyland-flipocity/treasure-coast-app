<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../includes/db.php';

$canonical = trim($_GET['entity'] ?? '');
if(!$canonical) {
    echo json_encode(['success'=>false,'error'=>'No entity specified']);
    exit;
}

try {
    $pdo = getDBConnection();

    // Entity detail
    $st = $pdo->prepare("SELECT * FROM entity_intelligence WHERE canonical_name = :c LIMIT 1");
    $st->execute([':c'=>$canonical]);
    $entity = $st->fetch();
    if(!$entity) {
        echo json_encode(['success'=>false,'error'=>'Entity not found']);
        exit;
    }

    // Timeline data
    $tl = $pdo->prepare("
        SELECT county, yr, qtr,
               txn_count, avg_price, total_vol_m,
               CONCAT(yr,' Q',qtr) AS label
        FROM entity_timeline
        WHERE canonical_name = :c
        ORDER BY county, yr, qtr
    ");
    $tl->execute([':c'=>$canonical]);
    $timeline = $tl->fetchAll();

    // Build unified quarter list across all counties
    $quarters = [];
    $by_county = ['Sarasota'=>[],'Manatee'=>[],'St.Lucie'=>[],'Lee'=>[],'Brevard'=>[]];

    foreach($timeline as $row) {
        $lbl = $row['label'];
        if(!in_array($lbl,$quarters)) $quarters[] = $lbl;
        $county = $row['county'];
        if(isset($by_county[$county])) {
            $by_county[$county][$lbl] = [
                'txn'   => (int)$row['txn_count'],
                'avg'   => (int)$row['avg_price'],
                'vol_m' => (float)$row['total_vol_m'],
            ];
        }
    }

    // Sort quarters chronologically
    usort($quarters, function($a,$b){
        preg_match('/(\d+) Q(\d)/', $a, $ma);
        preg_match('/(\d+) Q(\d)/', $b, $mb);
        $ya=(int)$ma[1]; $qa=(int)$ma[2];
        $yb=(int)$mb[1]; $qb=(int)$mb[2];
        return $ya!=$yb ? $ya-$yb : $qa-$qb;
    });

    // Align data to quarter list
    $datasets = [];
    foreach($by_county as $county => $data) {
        if(empty($data)) continue;
        $txns = [];
        $avgs = [];
        foreach($quarters as $q) {
            $txns[] = $data[$q]['txn']   ?? 0;
            $avgs[] = $data[$q]['avg']   ?? null;
        }
        $datasets[$county] = ['txn'=>$txns,'avg'=>$avgs];
    }

    echo json_encode([
        'success'  => true,
        'entity'   => $entity,
        'quarters' => $quarters,
        'datasets' => $datasets,
    ]);

} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(['success'=>false,'error'=>$e->getMessage()]);
}
