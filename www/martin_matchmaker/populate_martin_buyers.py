"""
Martin County Motivated Buyer Population Script
================================================
Identifies active repeat buyers (2020-2026) in Martin County,
scores them on acquisition likelihood, and populates a buyer profile table.

Scoring (max 100):
  - Purchase frequency:   2 buys +10, 3-4 +20, 5-9 +30, 10+ +40
  - Recency:              < 6mo +25, < 12mo +20, < 24mo +10
  - Entity type:          LLC/Corp/Trust +15
  - Price consistency:    tight range = focused buyer +10
  - Multi-city activity:  3+ cities +5
  - Out-of-state mail:    +10

Run: python3 populate_martin_buyers.py
"""

import os, pymysql, re
from datetime import date, timedelta

MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", "3306"))
MYSQL_USER = os.getenv("MYSQL_USER", "crypto")
MYSQL_PASS = os.getenv("MYSQL_PASS", "")
MYSQL_DB   = os.getenv("MYSQL_DB",   "rt_realestate")

def get_conn():
    return pymysql.connect(host=MYSQL_HOST, port=MYSQL_PORT,
                           user=MYSQL_USER, password=MYSQL_PASS,
                           database=MYSQL_DB, charset='utf8mb4',
                           autocommit=False)

def is_entity(name):
    n = (name or '').upper()
    return bool(re.search(r'\b(LLC|L\.L\.C|INC|CORP|TRUST|RLTY|REALTY|PROP|PROPERTIES|'
                           r'INVEST|GROUP|PARTNER|FUND|ACQUISIT|CAPITAL|ASSET|HOLDING|'
                           r'DEVELOPMENT|DEV|MGMT|MANAGEMENT|VENTURES?)\b', n))

def price_tier(price):
    p = float(price or 0)
    if p >= 800000: return 'Ultra-Premium'
    if p >= 500000: return 'Luxury'
    if p >= 300000: return 'Mid-Market'
    return 'Entry'

def score_buyer(purchases, last_buy_date, avg_price, min_price, max_price,
                is_entity_flag, cities_count, mail_state):
    score = 0
    reasons = []
    today = date.today()

    # Purchase frequency
    if purchases >= 10:
        score += 40; reasons.append(f'{purchases} purchases — highly active acquirer')
    elif purchases >= 5:
        score += 30; reasons.append(f'{purchases} purchases — active acquirer')
    elif purchases >= 3:
        score += 20; reasons.append(f'{purchases} purchases — repeat buyer')
    else:
        score += 10; reasons.append(f'{purchases} purchases — emerging buyer')

    # Recency
    if last_buy_date:
        days_ago = (today - last_buy_date).days
        if days_ago <= 180:
            score += 25; reasons.append('Active in last 6 months')
        elif days_ago <= 365:
            score += 20; reasons.append('Active in last 12 months')
        elif days_ago <= 730:
            score += 10; reasons.append('Active in last 24 months')

    # Entity type
    if is_entity_flag:
        score += 15; reasons.append('Entity buyer (LLC/Corp/Trust)')

    # Price range consistency (tight range = focused buyer)
    if avg_price > 0 and max_price > 0 and min_price > 0:
        spread = (max_price - min_price) / avg_price
        if spread < 0.3:
            score += 10; reasons.append('Consistent price range — focused strategy')

    # Multi-city activity
    if cities_count >= 3:
        score += 5; reasons.append(f'Active in {cities_count} cities')

    # Out of state
    if mail_state and mail_state.strip().upper() not in ('FL', ''):
        score += 10; reasons.append(f'Out-of-state buyer ({mail_state.strip()})')

    return min(score, 100), ' · '.join(reasons)


def main():
    conn = get_conn()
    today = date.today()

    print("Building motivated buyer profiles from 2020-2026 purchase history...")

    with conn.cursor(pymysql.cursors.DictCursor) as cur:

        # Create buyer profile table if not exists
        cur.execute("""
            CREATE TABLE IF NOT EXISTS `martin_motivated_buyers` (
                `id`              int UNSIGNED NOT NULL AUTO_INCREMENT,
                `BuyerName`       varchar(300) NOT NULL,
                `IsEntity`        tinyint DEFAULT 0,
                `TotalPurchases`  int DEFAULT 0,
                `PurchasesSince2020` int DEFAULT 0,
                `FirstBuy`        date DEFAULT NULL,
                `LastBuy`         date DEFAULT NULL,
                `AvgPrice`        decimal(14,2) DEFAULT NULL,
                `MinPrice`        decimal(14,2) DEFAULT NULL,
                `MaxPrice`        decimal(14,2) DEFAULT NULL,
                `PriceTier`       varchar(20) DEFAULT NULL,
                `PrimaryCity`     varchar(60) DEFAULT NULL,
                `Cities`          varchar(500) DEFAULT NULL,
                `CitiesCount`     int DEFAULT 0,
                `MailState`       varchar(10) DEFAULT NULL,
                `MailCity`        varchar(60) DEFAULT NULL,
                `BuyScore`        tinyint unsigned DEFAULT 0,
                `ScoreReasons`    varchar(500) DEFAULT NULL,
                `LandUsePreference` varchar(200) DEFAULT NULL,
                `RecentProperties` text DEFAULT NULL,
                PRIMARY KEY (`id`),
                KEY `idx_mb_BuyerName` (`BuyerName`(100)),
                KEY `idx_mb_BuyScore` (`BuyScore`),
                KEY `idx_mb_PriceTier` (`PriceTier`),
                KEY `idx_mb_PrimaryCity` (`PrimaryCity`),
                KEY `idx_mb_IsEntity` (`IsEntity`),
                KEY `idx_mb_LastBuy` (`LastBuy`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
              COMMENT='Martin County active repeat buyers scored by acquisition likelihood'
        """)
        conn.commit()

        # Build buyer profiles
        cur.execute("""
            SELECT
                t.Grantee                                       AS BuyerName,
                COUNT(*)                                        AS TotalPurchases,
                SUM(CASE WHEN YEAR(t.SaleDate)>=2020 THEN 1 ELSE 0 END) AS PurchasesSince2020,
                MIN(t.SaleDate)                                 AS FirstBuy,
                MAX(t.SaleDate)                                 AS LastBuy,
                ROUND(AVG(t.SalePrice),0)                       AS AvgPrice,
                ROUND(MIN(t.SalePrice),0)                       AS MinPrice,
                ROUND(MAX(t.SalePrice),0)                       AS MaxPrice,
                COUNT(DISTINCT p.SitusCity)                     AS CitiesCount,
                GROUP_CONCAT(DISTINCT p.SitusCity ORDER BY p.SitusCity SEPARATOR ', ') AS Cities,
                -- Primary city = most purchased in
                (SELECT p2.SitusCity FROM martin_transfers t2
                 JOIN martin_parcels p2 ON p2.PropertyID=t2.PropertyID
                 WHERE t2.Grantee=t.Grantee AND t2.DeedType='WD'
                   AND t2.SalePrice>50000 AND p2.SitusCity IS NOT NULL
                 GROUP BY p2.SitusCity ORDER BY COUNT(*) DESC LIMIT 1) AS PrimaryCity,
                -- Most common land use
                (SELECT p3.LandUseCodeDescription FROM martin_transfers t3
                 JOIN martin_parcels p3 ON p3.PropertyID=t3.PropertyID
                 WHERE t3.Grantee=t.Grantee AND t3.DeedType='WD' AND t3.SalePrice>50000
                   AND p3.LandUseCodeDescription IS NOT NULL
                 GROUP BY p3.LandUseCodeDescription ORDER BY COUNT(*) DESC LIMIT 1) AS LUCPref,
                -- Mail state from most recent purchase
                (SELECT pm.MailState FROM martin_transfers t4
                 JOIN martin_parcel_mailing pm ON pm.PropertyID=t4.PropertyID
                 WHERE t4.Grantee=t.Grantee AND t4.DeedType='WD'
                 ORDER BY t4.SaleDate DESC LIMIT 1) AS MailState,
                (SELECT pm2.MailCity FROM martin_transfers t5
                 JOIN martin_parcel_mailing pm2 ON pm2.PropertyID=t5.PropertyID
                 WHERE t5.Grantee=t.Grantee AND t5.DeedType='WD'
                 ORDER BY t5.SaleDate DESC LIMIT 1) AS MailCity,
                -- Recent property addresses (last 3)
                (SELECT GROUP_CONCAT(CONCAT(p4.SiteAddress,' ',p4.SitusCity)
                    ORDER BY t6.SaleDate DESC SEPARATOR ' | ')
                 FROM (SELECT t6a.PropertyID, t6a.SaleDate FROM martin_transfers t6a
                       WHERE t6a.Grantee=t.Grantee AND t6a.DeedType='WD'
                       ORDER BY t6a.SaleDate DESC LIMIT 3) t6
                 JOIN martin_parcels p4 ON p4.PropertyID=t6.PropertyID
                ) AS RecentProperties
            FROM martin_transfers t
            JOIN martin_parcels p ON p.PropertyID = t.PropertyID
            WHERE t.DeedType = 'WD'
              AND t.SalePrice > 50000
              AND t.Grantee IS NOT NULL AND t.Grantee != ''
              AND YEAR(t.SaleDate) >= 2020
            GROUP BY t.Grantee
            HAVING PurchasesSince2020 >= 2
            ORDER BY LastBuy DESC
        """)
        rows = cur.fetchall()
        print(f"Found {len(rows):,} active repeat buyers since 2020")

        # Clear and repopulate
        cur.execute("TRUNCATE TABLE martin_motivated_buyers")
        conn.commit()

        insert_sql = """
            INSERT INTO martin_motivated_buyers
            (BuyerName, IsEntity, TotalPurchases, PurchasesSince2020,
             FirstBuy, LastBuy, AvgPrice, MinPrice, MaxPrice, PriceTier,
             PrimaryCity, Cities, CitiesCount, MailState, MailCity,
             BuyScore, ScoreReasons, LandUsePreference, RecentProperties)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """

        batch = []
        hot = warm = 0

        for r in rows:
            entity  = is_entity(r['BuyerName'])
            last_buy = r['LastBuy']
            if isinstance(last_buy, str):
                from datetime import datetime
                last_buy = datetime.strptime(last_buy[:10], '%Y-%m-%d').date()

            score, reasons = score_buyer(
                purchases      = int(r['PurchasesSince2020'] or 0),
                last_buy_date  = last_buy,
                avg_price      = float(r['AvgPrice'] or 0),
                min_price      = float(r['MinPrice'] or 0),
                max_price      = float(r['MaxPrice'] or 0),
                is_entity_flag = entity,
                cities_count   = int(r['CitiesCount'] or 0),
                mail_state     = r['MailState'] or '',
            )

            tier = price_tier(float(r['AvgPrice'] or 0))
            if score >= 70: hot += 1
            elif score >= 50: warm += 1

            batch.append((
                (r['BuyerName'] or '')[:300],
                1 if entity else 0,
                int(r['TotalPurchases'] or 0),
                int(r['PurchasesSince2020'] or 0),
                r['FirstBuy'],
                last_buy,
                float(r['AvgPrice'] or 0) or None,
                float(r['MinPrice'] or 0) or None,
                float(r['MaxPrice'] or 0) or None,
                tier,
                (r['PrimaryCity'] or '')[:60],
                (r['Cities'] or '')[:500],
                int(r['CitiesCount'] or 0),
                (r['MailState'] or '')[:10],
                (r['MailCity'] or '')[:60],
                score,
                reasons[:500],
                (r['LUCPref'] or '')[:200],
                (r['RecentProperties'] or '')[:1000] if r.get('RecentProperties') else None,
            ))

            if len(batch) >= 200:
                cur.executemany(insert_sql, batch)
                conn.commit()
                print(f"  Inserted {len(batch)} buyer profiles...")
                batch = []

        if batch:
            cur.executemany(insert_sql, batch)
            conn.commit()

    print(f"\n{'='*55}")
    print(f"  BUYER POPULATION COMPLETE")
    print(f"{'='*55}")
    print(f"  Total buyer profiles: {len(rows):,}")
    print(f"  HOT buyers (70+): {hot:,}")
    print(f"  WARM buyers (50-69): {warm:,}")
    print("\nDone.")

    conn.close()

if __name__ == '__main__':
    main()
