"""
Martin County Motivated Seller Population Script
=================================================
Identifies peak buyers (2021-2022) still holding in 2025,
scores them by motivation level, and populates martin_motivated_sellers.

Scoring factors (max 100):
  - Non-homestead (investor)            +25
  - LLC owner                           +15
  - Premium paid over just value        +10 (>20%), +20 (>50%), +25 (>100%)
  - Hold period (longer = more motivated) +5 (2yr), +10 (3yr+)
  - Price tier (high value = more motivated) +5 luxury, +10 ultra
  - Out-of-state mailing address         +10
  - Multiple properties same owner       +5

Run: python3 populate_martin_motivated.py
"""

import os, pymysql
from datetime import date

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

def score_record(r):
    score   = 0
    reasons = []

    hs        = r.get('Homestead', 'N')
    is_llc    = r.get('is_llc_owner', 0)
    premium   = float(r.get('PremiumPaid') or 0)
    days_held = int(r.get('days_held') or 0)
    price     = float(r.get('SalePrice') or 0)
    jv        = float(r.get('JustValue') or 0)
    mail_state= (r.get('MailState') or '').strip().upper()

    # Non-homestead = investor
    if hs != 'Y':
        score += 25
        reasons.append('Non-homestead investor')

    # LLC owner
    if is_llc:
        score += 15
        reasons.append('LLC ownership')

    # Premium paid over just value at purchase
    if premium >= 100:
        score += 25
        reasons.append(f'+{premium:.0f}% over assessed at purchase')
    elif premium >= 50:
        score += 20
        reasons.append(f'+{premium:.0f}% over assessed at purchase')
    elif premium >= 20:
        score += 10
        reasons.append(f'+{premium:.0f}% over assessed at purchase')

    # Hold period
    yrs = days_held / 365.25
    if yrs >= 3:
        score += 10
        reasons.append(f'{yrs:.1f}yr hold — extended carrying costs')
    elif yrs >= 2:
        score += 5
        reasons.append(f'{yrs:.1f}yr hold')

    # Out of state mail
    if mail_state and mail_state != 'FL':
        score += 10
        reasons.append(f'Out-of-state owner ({mail_state})')

    # Price tier bonus
    if price >= 800000:
        score += 10
        reasons.append('Ultra-premium purchase')
    elif price >= 500000:
        score += 5
        reasons.append('Luxury purchase')

    return min(score, 100), ' · '.join(reasons)


def price_tier(price):
    p = float(price or 0)
    if p >= 800000: return 'Ultra-Premium'
    if p >= 500000: return 'Luxury'
    if p >= 300000: return 'Mid-Market'
    return 'Entry'


def main():
    conn = get_conn()
    today = date.today()

    print("Fetching peak buyers (2021-2022) still holding...")

    with conn.cursor(pymysql.cursors.DictCursor) as cur:

        # Get all WD purchases in 2021-2022 that have NOT resold
        # i.e. the most recent WD transfer is still in 2021-2022
        cur.execute("""
            SELECT
                t.PropertyID,
                p.ParcelID,
                t.SaleDate,
                t.SalePrice,
                t.DeedType,
                t.Grantee                                       AS CurrentOwner,
                t.Grantor                                       AS PeakSeller,
                p.SiteAddress,
                p.SitusCity                                     AS SiteCity,
                p.SitusPostal                                   AS SiteZip,
                pm.MailAddress                                  AS MailStreet,
                pm.MailCity,
                pm.MailState,
                pm.MailZip,
                CASE WHEN ex.PropertyID IS NOT NULL THEN 'Y' ELSE 'N' END AS Homestead,
                pv.JustMarketValue                              AS JustValue,
                pv.TotalAssessedValue                          AS AssessedValue,
                ps.Beds                                        AS Bedrooms,
                p.LandUseCode                                  AS LUC,
                CASE WHEN t.Grantee REGEXP '\\bLLC\\b|\\bL\\.L\\.C\\b|\\bLTD\\b|\\bINC\\b|\\bCORP\\b|\\bTRUST\\b' THEN 1 ELSE 0 END AS is_llc_owner,
                DATEDIFF(CURDATE(), t.SaleDate)               AS days_held,
                YEAR(t.SaleDate)                              AS yr_bought
            FROM martin_transfers t
            JOIN martin_parcels p      ON p.PropertyID  = t.PropertyID
            LEFT JOIN martin_parcel_mailing pm  ON pm.PropertyID = t.PropertyID
            LEFT JOIN martin_parcel_values  pv  ON pv.PropertyID = t.PropertyID
            LEFT JOIN martin_parcel_structure ps ON ps.PropertyID = t.PropertyID
            LEFT JOIN martin_exemptions ex
                ON ex.PropertyID = t.PropertyID
                AND ex.YearID = 2024
                AND (ex.Exemption LIKE '%HX%'
                     OR ex.ExemptionShortDescription LIKE '%Homestead%'
                     OR ex.ExemptionShortDescription LIKE '%HMSTD%')
            WHERE t.DeedType = 'WD'
              AND YEAR(t.SaleDate) IN (2021, 2022)
              AND t.SalePrice >= 150000
              AND t.SalePrice < 30000000
              -- No subsequent WD transfer (still holding)
              AND NOT EXISTS (
                  SELECT 1 FROM martin_transfers t2
                  WHERE t2.PropertyID = t.PropertyID
                    AND t2.DeedType = 'WD'
                    AND t2.SaleDate > t.SaleDate
              )
              -- Most recent transfer overall is the peak purchase
              AND t.SaleDate = (
                  SELECT MAX(t3.SaleDate) FROM martin_transfers t3
                  WHERE t3.PropertyID = t.PropertyID AND t3.DeedType = 'WD'
                    AND YEAR(t3.SaleDate) IN (2021, 2022)
              )
            ORDER BY t.SalePrice DESC
        """)
        rows = cur.fetchall()
        print(f"Found {len(rows):,} peak buyers still holding")

        # Compute multi-property owners (same owner name > 1 property)
        owner_counts = {}
        for r in rows:
            owner = (r['CurrentOwner'] or '').strip().upper()
            owner_counts[owner] = owner_counts.get(owner, 0) + 1

        # Clear existing data
        cur.execute("TRUNCATE TABLE martin_motivated_sellers")
        conn.commit()
        print("Cleared existing records")

        # Compute premium paid and insert
        insert_sql = """
            INSERT INTO martin_motivated_sellers
            (PropertyID, ParcelID, SaleDate, SalePrice, DeedType,
             CurrentOwner, PeakSeller, SiteAddress, SiteCity, SiteZip,
             MailStreet, MailCity, MailState, MailZip,
             Homestead, JustValue, AssessedValue, PremiumPaid,
             Bedrooms, LUC, score, score_reasons,
             yr_bought, days_held, is_llc_owner, price_tier, county)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,'Martin')
        """

        batch = []
        hot = warm = mod = 0

        for r in rows:
            sale_price = float(r['SalePrice'] or 0)
            jv         = float(r['JustValue'] or 0)

            # Premium paid = (purchase price - just value) / just value * 100
            if jv > 0:
                premium = round((sale_price - jv) / jv * 100, 1)
            else:
                premium = 0.0

            # Multi-property bonus
            owner = (r['CurrentOwner'] or '').strip().upper()
            if owner_counts.get(owner, 0) > 1:
                r['_multi'] = True

            r['PremiumPaid'] = premium
            score, reasons = score_record(r)

            # Multi-property bonus
            if owner_counts.get(owner, 0) > 1:
                score = min(score + 5, 100)
                reasons += ' · Multi-property owner'

            tier = price_tier(sale_price)

            if score >= 80:   hot += 1
            elif score >= 60: warm += 1
            elif score >= 40: mod += 1

            batch.append((
                r['PropertyID'], r['ParcelID'],
                r['SaleDate'], sale_price, r['DeedType'],
                (r['CurrentOwner'] or '')[:300],
                (r['PeakSeller'] or '')[:300],
                (r['SiteAddress'] or '')[:200],
                (r['SiteCity'] or '')[:60],
                (r['SiteZip'] or '')[:15],
                (r['MailStreet'] or '')[:150],
                (r['MailCity'] or '')[:60],
                (r['MailState'] or '')[:10],
                (r['MailZip'] or '')[:15],
                r['Homestead'],
                jv if jv > 0 else None,
                float(r['AssessedValue'] or 0) or None,
                premium,
                r['Bedrooms'],
                (r['LUC'] or '')[:10],
                score, reasons[:500],
                r['yr_bought'], r['days_held'],
                r['is_llc_owner'], tier,
            ))

            if len(batch) >= 500:
                cur.executemany(insert_sql, batch)
                conn.commit()
                print(f"  Inserted {len(batch)} records...")
                batch = []

        if batch:
            cur.executemany(insert_sql, batch)
            conn.commit()

    print(f"\n{'='*50}")
    print(f"  POPULATION COMPLETE")
    print(f"{'='*50}")
    print(f"  Total candidates: {len(rows):,}")
    print(f"  HOT  (80+): {hot:,}")
    print(f"  WARM (60-79): {warm:,}")
    print(f"  MOD  (40-59): {mod:,}")

    conn.close()
    print("\nDone. Run the Martin radar at http://localhost:8080/martin_radar/")

if __name__ == '__main__':
    main()
