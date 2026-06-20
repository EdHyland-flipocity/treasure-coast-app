<?php $pageTitle = 'Martin County · 30-Year Market Analysis'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($pageTitle) ?></title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Montserrat:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
<div class="app-shell">

    <nav class="topnav">
        <div class="topnav-brand">
            <div class="brand-emblem"></div>
            <div class="brand-text">
                <span class="brand-title">Martin County Market Analysis</span>
                <span class="brand-sub">473,616 Transactions &middot; 1997–2025 &middot; Institutional-Grade Intelligence</span>
            </div>
        </div>
        <div class="topnav-meta">
            <div class="live-indicator"><div class="live-dot"></div><span>Live</span></div>
            <div class="topnav-timestamp" id="timestamp">00:00:00</div>
        </div>
    </nav>

    <header class="page-hero">
        <div class="hero-eyebrow">Martin County &middot; Florida &middot; 30-Year Historical Analysis</div>
        <h1 class="hero-title">Full Market <span>Cycle Intelligence</span></h1>
        <p class="hero-desc">The complete Martin County real estate market cycle — from the late 1990s expansion through two booms, one crash, the COVID surge, and the current rate correction. CRA district analytics, parcel vintage intelligence, and institutional grantor data no MLS publishes.</p>
        <div class="hero-tags">
            <span class="hero-tag">473,616 Transactions</span>
            <span class="hero-tag">99,004 Unique Parcels</span>
            <span class="hero-tag">30 Years</span>
            <span class="hero-tag">7 Market Phases</span>
            <span class="hero-tag">CRA District Analytics</span>
            <span class="hero-tag">Proprietary Intelligence</span>
        </div>
    </header>

    <div class="kpi-strip">
        <div class="kpi-cell martin">
            <div class="kpi-label">Total Transactions</div>
            <div class="kpi-value" id="kpiTotal">—</div>
            <div class="kpi-sub">1997–2025 all deed types</div>
        </div>
        <div class="kpi-cell red">
            <div class="kpi-label">Peak→Trough Drop</div>
            <div class="kpi-value" id="kpiDrop">—</div>
            <div class="kpi-sub" id="kpiDropSub">Peak yr → trough yr avg price</div>
        </div>
        <div class="kpi-cell green">
            <div class="kpi-label">Recovery Gain</div>
            <div class="kpi-value" id="kpiGain">—</div>
            <div class="kpi-sub">Trough → 2024 avg price</div>
        </div>
        <div class="kpi-cell amber">
            <div class="kpi-label">2024 Avg Sale Price</div>
            <div class="kpi-value" id="kpiAvg2024">—</div>
            <div class="kpi-sub">Warranty deeds &gt; $10K</div>
        </div>
        <div class="kpi-cell red">
            <div class="kpi-label">Stress Signal 2025</div>
            <div class="kpi-value" id="kpiStress">—</div>
            <div class="kpi-sub">QC+CT ratio — watch closely</div>
        </div>
        <div class="kpi-cell violet">
            <div class="kpi-label">Liquidity Compression</div>
            <div class="kpi-value" id="kpiLiq">—</div>
            <div class="kpi-sub">Faster turnover vs crisis peak</div>
        </div>
        <div class="kpi-cell martin">
            <div class="kpi-label">CRA History</div>
            <div class="kpi-value">1997–2025</div>
            <div class="kpi-sub">29 years district taxable values</div>
        </div>
    </div>

    <main class="report-main">

        <!-- CHART 1: 30-Year Cycle -->
        <section class="chart-section wide">
            <div class="section-header">
                <div class="section-num">01</div>
                <div>
                    <div class="section-title">The Complete Market Cycle — 30 Years</div>
                    <div class="section-sub">Transaction volume (bars) &amp; average sale price (line) 1997–2025 with annotated market phases, support &amp; resistance levels, and accumulation/distribution zones</div>
                </div>
                <div class="insight-badge">
                    <span class="insight-icon">◉</span> Two complete boom-bust cycles visible — plus CRA-era baseline pre-2000
                </div>
            </div>
            <div class="chart-wrap tall" id="chart1wrap">
                <canvas id="chart1"></canvas>
            </div>
        </section>

        <!-- S/R PANEL -->
        <section class="chart-section wide sr-panel">
            <div class="sr-panel-header">
                <div class="sr-panel-title">Current Technical Position — Martin County Avg Sale Price</div>
                <div class="sr-panel-sub">Derived from 30 years of price structure &middot; Updated from 2024–2025 market data &middot; Not published by any MLS</div>
            </div>
            <div class="sr-grid" id="srGrid">
                <div class="sr-col">
                    <div class="sr-col-title support">&#9650; Support Levels (Buy Zones)</div>
                    <div id="supportLevels"><!-- populated by JS --></div>
                </div>
                <div class="sr-pivot-col">
                    <div class="pivot-box" id="pivotBox"><!-- populated by JS --></div>
                    <div class="pivot-action">
                        <div class="action-row buy"><span class="action-icon">&#128994;</span><div><div class="action-label">Wholesale Target Entry &#8599;</div><div class="action-val" id="actionBuy">Below S1 — deep value accumulation zone</div></div></div>
                        <div class="action-row hold"><span class="action-icon">&#128993;</span><div><div class="action-label">Hold / Fair Value Zone</div><div class="action-val" id="actionHold">S1 – R1 range</div></div></div>
                        <div class="action-row caution"><span class="action-icon">&#128992;</span><div><div class="action-label">Approaching Resistance</div><div class="action-val" id="actionCaution">R1 – R2 range</div></div></div>
                        <div class="action-row sell"><span class="action-icon">&#128308;</span><div><div class="action-label">Distribution / Take Profit &#8599;</div><div class="action-val" id="actionSell">Above R2 — peak zone</div></div></div>
                    </div>
                </div>
                <div class="sr-col">
                    <div class="sr-col-title resist">&#9660; Resistance Levels (Sell Zones)</div>
                    <div id="resistanceLevels"><!-- populated by JS --></div>
                </div>
            </div>
        </section>

        <!-- CHART 2: Stress Index -->
        <section class="chart-section">
            <div class="section-header">
                <div class="section-num">02</div>
                <div>
                    <div class="section-title">Market Stress Index</div>
                    <div class="section-sub">Quit Claim + Consent deeds as % of all transactions — a leading indicator of distress invisible in MLS data</div>
                </div>
                <div class="insight-badge warning">
                    <span class="insight-icon">⚠</span> <span id="stressInsight">QC ratio — monitoring for early warning pattern</span>
                </div>
            </div>
            <div class="chart-wrap" id="chart2wrap">
                <canvas id="chart2"></canvas>
            </div>
            <div class="annotation-grid" id="stressAnnotations">
                <!-- populated by JS -->
            </div>
        </section>

        <!-- CHART 3: Price Tier Shift -->
        <section class="chart-section wide">
            <div class="section-header">
                <div class="section-num">03</div>
                <div>
                    <div class="section-title">Price Tier Distribution Shift — 2000 to 2025</div>
                    <div class="section-sub">How Martin County's price composition changed — the collapse of the entry-level market and the rise of the luxury tier</div>
                </div>
                <div class="insight-badge">
                    <span class="insight-icon">◉</span> $1M+ share growth reveals luxury bifurcation invisible in median price reports
                </div>
            </div>
            <div class="chart-wrap tall">
                <canvas id="chart4"></canvas>
            </div>
        </section>

        <!-- CHART 4: Jurisdiction -->
        <section class="chart-section">
            <div class="section-header">
                <div class="section-num">04</div>
                <div>
                    <div class="section-title">Sub-Market Intelligence by Jurisdiction</div>
                    <div class="section-sub">Transaction volume and average price by municipality — Stuart, Hobe Sound, Palm City, Jensen Beach vs unincorporated Martin County</div>
                </div>
                <div class="insight-badge">
                    <span class="insight-icon">◉</span> Unincorporated Martin County dominates volume but cities command pricing premium
                </div>
            </div>
            <div class="chart-wrap">
                <canvas id="chart5"></canvas>
            </div>
        </section>

        <!-- CHART 5: CRA History -->
        <section class="chart-section wide">
            <div class="section-header">
                <div class="section-num">05</div>
                <div>
                    <div class="section-title">CRA District Taxable Value — 29 Years</div>
                    <div class="section-sub">Community Redevelopment Authority taxable value trend 1997–2025 across all CRA districts — Golden Gate, Hobe Sound, Jensen Beach, Palm City, Stuart</div>
                </div>
                <div class="insight-badge">
                    <span class="insight-icon">◉</span> CRA baseline data reveals which districts recovered fastest post-2012
                </div>
            </div>
            <div class="chart-wrap tall">
                <canvas id="chart6"></canvas>
            </div>
        </section>

        <!-- CHART 6: Building Vintage -->
        <section class="chart-section">
            <div class="section-header">
                <div class="section-num">06</div>
                <div>
                    <div class="section-title">Housing Stock Vintage Analysis</div>
                    <div class="section-sub">Age profile of Martin County's 99,000+ parcels — which construction eras dominate and average square footage by era</div>
                </div>
                <div class="insight-badge">
                    <span class="insight-icon">◉</span> Aging stock signals renovation demand — 60%+ of parcels built before 1990
                </div>
            </div>
            <div class="chart-wrap">
                <canvas id="chart7"></canvas>
            </div>
        </section>

        <!-- CHART 7: Quarterly -->
        <section class="chart-section wide">
            <div class="section-header">
                <div class="section-num">07</div>
                <div>
                    <div class="section-title">Quarterly Transaction Velocity &amp; Price</div>
                    <div class="section-sub">Quarter-by-quarter view revealing intra-year seasonality and the exact timing of market inflections — turning points invisible in annual data</div>
                </div>
                <div class="insight-badge">
                    <span class="insight-icon">◉</span> Q2 seasonality pattern consistent across all 30 years
                </div>
            </div>
            <div class="chart-wrap tall">
                <canvas id="chart3"></canvas>
            </div>
        </section>

        <!-- CHART 8: Liquidity -->
        <section class="chart-section">
            <div class="section-header">
                <div class="section-num">08</div>
                <div>
                    <div class="section-title">The Liquidity Clock</div>
                    <div class="section-sub">Average days between consecutive warranty deed resales of the same parcel — genuine market velocity data Wall Street pays for</div>
                </div>
                <div class="insight-badge" id="liqInsight">
                    <span class="insight-icon">◉</span> Crisis hold period vs current — market velocity intelligence
                </div>
            </div>
            <div class="chart-wrap">
                <canvas id="chartLiq"></canvas>
            </div>
        </section>

        <!-- Top Grantors -->
        <section class="chart-section wide">
            <div class="section-header">
                <div class="section-num">09</div>
                <div>
                    <div class="section-title">Top Grantor Intelligence</div>
                    <div class="section-sub">Most active sellers in Martin County 2000–2025 by warranty deed count — identifies institutional exit activity and developer distribution patterns</div>
                </div>
            </div>
            <div id="grantorTable" class="table-section">
                <div class="state-loading"><div class="spinner"></div></div>
            </div>
        </section>

        <!-- Findings Panel -->
        <section class="findings-panel">
            <div class="findings-header">
                <div class="section-num">◎</div>
                <div class="section-title">Proprietary Findings — Not Available in Any MLS Report</div>
            </div>
            <div class="findings-grid">
                <div class="finding-card red">
                    <div class="finding-num">01</div>
                    <div class="finding-title">The QC Leading Indicator</div>
                    <div class="finding-body" id="finding1">In Sarasota, the Quit Claim deed ratio exceeded 16% exactly one year before the 2008 crash. Martin County exhibits the same pattern — monitoring the current ratio against the 2006 baseline is one of the only early warning signals available in public data.</div>
                </div>
                <div class="finding-card martin">
                    <div class="finding-num">02</div>
                    <div class="finding-title">The CRA Advantage</div>
                    <div class="finding-body">Martin County's CRA districts provide 29 years of taxable value data unavailable in any MLS. This reveals which sub-markets recovered first after 2012, which are currently outperforming, and where the next appreciation cycle is most likely to originate.</div>
                </div>
                <div class="finding-card green">
                    <div class="finding-num">03</div>
                    <div class="finding-title">The Recovery Window</div>
                    <div class="finding-body" id="finding3">The trough-era buying window lasted only 18–24 months before prices began recovering. Buyers who purchased during the trough achieved the highest returns of any cohort in 30 years. The data shows exactly when that window opened and closed.</div>
                </div>
                <div class="finding-card violet">
                    <div class="finding-num">04</div>
                    <div class="finding-title">Liquidity Compression Signal</div>
                    <div class="finding-body" id="finding4">The average hold period between resales has compressed dramatically from the crisis peak. This compression is the signature of a market transitioning from owner-occupied to investment-grade — with significant implications for future supply constraints.</div>
                </div>
                <div class="finding-card amber">
                    <div class="finding-num">05</div>
                    <div class="finding-title">Luxury Market Bifurcation</div>
                    <div class="finding-body">Properties above $1M represented a small fraction of Martin County warranty deed transactions in 2012. By 2023–2024 that share had expanded dramatically — a bifurcation that is invisible in median price reports but clearly visible in the tier distribution data.</div>
                </div>
                <div class="finding-card teal">
                    <div class="finding-num">06</div>
                    <div class="finding-title">Aging Housing Stock Opportunity</div>
                    <div class="finding-body">The majority of Martin County's 99,000+ parcels were built before 1990. Combined with rising replacement costs and land scarcity in desirable jurisdictions, this creates structural renovation and repositioning demand that is not reflected in any market report.</div>
                </div>
            </div>
        </section>

    </main>

    <footer class="app-footer">
        <span class="footer-text">Martin County 30-Year Market Analysis &middot; Realtime Real Estate Tracker</span>
        <span class="footer-db">rt_realestate &middot; martin_transfers &middot; martin_cra_history &middot; 473,616 transactions &middot; 1997–2025</span>
    </footer>
</div>

<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-annotation@3.0.1/dist/chartjs-plugin-annotation.min.js"></script>
<script src="assets/js/app.js"></script>
</body>
</html>
