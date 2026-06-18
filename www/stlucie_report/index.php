<?php $pageTitle = 'St. Lucie County · Single Family Intelligence'; ?>
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
            <div class="brand-emblem">SL</div>
            <div class="brand-text">
                <span class="brand-title">St. Lucie County · Single Family Intelligence</span>
                <span class="brand-sub">20,000 Transactions · 2023–2026 · Port St. Lucie & Fort Pierce</span>
            </div>
        </div>
        <div class="topnav-meta">
            <div class="live-indicator"><div class="live-dot"></div><span>Live</span></div>
            <div class="topnav-timestamp" id="timestamp">00:00:00</div>
        </div>
    </nav>

    <header class="page-hero">
        <div class="hero-eyebrow">St. Lucie County · Florida · Single Family Market Intelligence</div>
        <h1 class="hero-title">Single Family <span>Market Intelligence</span></h1>
        <p class="hero-desc">Every single family sale in St. Lucie County — price trends, out-of-state investor migration, bedroom analysis, and motivated seller identification. The fastest growing county in Florida, tracked in real time.</p>
        <div class="hero-tags">
            <span class="hero-tag">20,000 TRANSACTIONS</span>
            <span class="hero-tag">2023–2026</span>
            <span class="hero-tag">PORT ST. LUCIE</span>
            <span class="hero-tag">FORT PIERCE</span>
            <span class="hero-tag">OUT-OF-STATE BUYERS</span>
        </div>
    </header>

    <!-- KPI Strip -->
    <div class="kpi-strip">
        <div class="kpi-cell teal">
            <div class="kpi-label">Total Sales</div>
            <div class="kpi-value" id="kpiTotal">—</div>
            <div class="kpi-sub">Single family 2023–2026</div>
        </div>
        <div class="kpi-cell gold">
            <div class="kpi-label">Avg Sale Price</div>
            <div class="kpi-value" id="kpiAvg">—</div>
            <div class="kpi-sub">All qualified sales</div>
        </div>
        <div class="kpi-cell coral">
            <div class="kpi-label">Peak Quarter</div>
            <div class="kpi-value" id="kpiPeak">—</div>
            <div class="kpi-sub" id="kpiPeakLabel">Highest avg price</div>
        </div>
        <div class="kpi-cell red">
            <div class="kpi-label">2026 Trend</div>
            <div class="kpi-value" id="kpiTrend">—</div>
            <div class="kpi-sub">vs 2025 avg</div>
        </div>
        <div class="kpi-cell amber">
            <div class="kpi-label">Out-of-State Buyers</div>
            <div class="kpi-value" id="kpiOOS">—</div>
            <div class="kpi-sub" id="kpiOOSPct">Investor migration</div>
        </div>
        <div class="kpi-cell violet">
            <div class="kpi-label">Unique Parcels</div>
            <div class="kpi-value" id="kpiParcels">—</div>
            <div class="kpi-sub">Active in market</div>
        </div>
    </div>

    <!-- Chart 01: Quarterly Price Trend -->
    <div class="chart-section">
        <div class="chart-header">
            <div class="chart-num">01</div>
            <div class="chart-meta">
                <div class="chart-title">Quarterly Price & Volume — 2023 to 2026</div>
                <div class="chart-desc">Average single family sale price and transaction volume by quarter — tracking the St. Lucie market cycle</div>
            </div>
            <div class="chart-insight" id="insight01">● Loading…</div>
        </div>
        <div class="chart-wrap"><canvas id="chart01"></canvas></div>
    </div>

    <!-- Section 02: S/R Technical Panel -->
    <div class="sr-section">
        <div class="sr-header">
            <div class="chart-num">02</div>
            <div class="chart-meta">
                <div class="chart-title">Current Technical Position — St. Lucie Single Family Avg Price</div>
                <div class="chart-desc">Derived from 3 years of price structure · Updated from 2024–2026 market data · Not published by any MLS</div>
            </div>
        </div>
        <div class="sr-body">
            <div class="sr-col support-col">
                <div class="sr-col-title support">&#9650; Support Levels (Buy Zones)</div>
                <div class="sr-level s-major">
                    <div class="sr-dot support"></div>
                    <div class="sr-level-price">$351K</div>
                    <div class="sr-level-label">S4 · 2026 Q2 Low — Recent Floor</div>
                    <div class="sr-level-note">Lowest recent quarter — key demand test level</div>
                </div>
                <div class="sr-level s-major">
                    <div class="sr-dot support"></div>
                    <div class="sr-level-price">$374K</div>
                    <div class="sr-level-label">S3 · 2025 Q4 / 2026 Q1 Base</div>
                    <div class="sr-level-note">Double bottom forming — structural support zone</div>
                </div>
                <div class="sr-level">
                    <div class="sr-dot support"></div>
                    <div class="sr-level-price">$383K</div>
                    <div class="sr-level-label">S2 · 2023–2024 Average Base</div>
                    <div class="sr-level-note">Multi-year mean — tested repeatedly and held</div>
                </div>
                <div class="sr-level current">
                    <div class="sr-dot support pulse"></div>
                    <div class="sr-level-price">$390K</div>
                    <div class="sr-level-label">S1 · Current Primary Support</div>
                    <div class="sr-level-note">2024 Q4 / 2025 Q1 cluster — active support</div>
                </div>
            </div>

            <div class="sr-pivot-col">
                <div class="pivot-box">
                    <div class="pivot-title">2024 Annual Pivot Point</div>
                    <div class="pivot-main">$387K</div>
                    <div class="pivot-levels">
                        <div class="pivot-row r"><span class="pivot-key">R2</span><span class="pivot-val">$430K</span><span class="pivot-desc">Breakout target</span></div>
                        <div class="pivot-row r"><span class="pivot-key">R1</span><span class="pivot-val">$410K</span><span class="pivot-desc">First resistance</span></div>
                        <div class="pivot-row p"><span class="pivot-key">PP</span><span class="pivot-val">$387K</span><span class="pivot-desc">Pivot — current ceiling</span></div>
                        <div class="pivot-row s"><span class="pivot-key">S1</span><span class="pivot-val">$374K</span><span class="pivot-desc">First support</span></div>
                        <div class="pivot-row s"><span class="pivot-key">S2</span><span class="pivot-val">$351K</span><span class="pivot-desc">Second support</span></div>
                    </div>
                    <div class="pivot-signal"><span class="signal-dot bearish"></span>Current Bias: <strong>BEARISH</strong> — 2026 price declining below PP</div>
                </div>
                <div class="pivot-action">
                    <div class="action-row buy">
                        <span class="action-icon">&#128994;</span>
                        <div>
                            <div class="action-label">Wholesale Target Entry</div>
                            <div class="action-val">Below $374K — strong value zone</div>
                        </div>
                    </div>
                    <div class="action-row hold">
                        <span class="action-icon">&#128993;</span>
                        <div>
                            <div class="action-label">Hold / Fair Value Zone</div>
                            <div class="action-val">$374K – $410K</div>
                        </div>
                    </div>
                    <div class="action-row caution">
                        <span class="action-icon">&#128992;</span>
                        <div>
                            <div class="action-label">Approaching Resistance</div>
                            <div class="action-val">$410K – $430K</div>
                        </div>
                    </div>
                    <div class="action-row sell">
                        <span class="action-icon">&#128308;</span>
                        <div>
                            <div class="action-label">Distribution / Take Profit</div>
                            <div class="action-val">Above $403K — 2025 Q1 peak zone</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="sr-col resist-col">
                <div class="sr-col-title resist">&#9660; Resistance Levels (Sell Zones)</div>
                <div class="sr-level current">
                    <div class="sr-dot resist pulse"></div>
                    <div class="sr-level-price">$392K</div>
                    <div class="sr-level-label">R1 · 2024 Q2 High — Key Level</div>
                    <div class="sr-level-note">Tested twice — acting as current ceiling</div>
                </div>
                <div class="sr-level s-major">
                    <div class="sr-dot resist"></div>
                    <div class="sr-level-price">$396K</div>
                    <div class="sr-level-label">R2 · 2025 Q2 High ← TESTING NOW</div>
                    <div class="sr-level-note">Recent peak — primary resistance cluster</div>
                </div>
                <div class="sr-level">
                    <div class="sr-dot resist target"></div>
                    <div class="sr-level-price">$403K</div>
                    <div class="sr-level-label">R3 · 2025 Q1 All-Time High</div>
                    <div class="sr-level-note">Dataset peak — bull case breakout target</div>
                </div>
                <div class="sr-level s-major">
                    <div class="sr-dot resist"></div>
                    <div class="sr-level-price">$430K</div>
                    <div class="sr-level-label">R4 · Projected Breakout Target</div>
                    <div class="sr-level-note">Next major resistance if $403K breaks</div>
                </div>
            </div>
        </div>
    </div>

    <!-- Chart 03: Out-of-State Buyers -->
    <div class="chart-section">
        <div class="chart-header">
            <div class="chart-num">03</div>
            <div class="chart-meta">
                <div class="chart-title">Out-of-State Buyer Migration — Top 15 States</div>
                <div class="chart-desc">Where buyers are coming from — New York leads, followed by Arizona, New Jersey, California, and Georgia. Ontario Canada buyers also present.</div>
            </div>
            <div class="chart-insight" id="insight03">● Loading…</div>
        </div>
        <div class="chart-wrap"><canvas id="chart03"></canvas></div>
    </div>

    <!-- Chart 04: FL vs Out-of-State by Quarter -->
    <div class="chart-section">
        <div class="chart-header">
            <div class="chart-num">04</div>
            <div class="chart-meta">
                <div class="chart-title">Local vs Out-of-State Buyer Share — by Quarter</div>
                <div class="chart-desc">Florida residents vs out-of-state investors and migrants — tracking the institutional demand wave over time</div>
            </div>
            <div class="chart-insight" id="insight04">● Loading…</div>
        </div>
        <div class="chart-wrap"><canvas id="chart04"></canvas></div>
    </div>

    <!-- Chart 05: Bedroom Price Analysis -->
    <div class="chart-section">
        <div class="chart-header">
            <div class="chart-num">05</div>
            <div class="chart-meta">
                <div class="chart-title">Price by Bedroom Count — Market Segmentation</div>
                <div class="chart-desc">Average price and volume by bedroom count — 3BR dominates volume, 5BR commands the premium tier</div>
            </div>
            <div class="chart-insight" id="insight05">● Loading…</div>
        </div>
        <div class="chart-wrap"><canvas id="chart05"></canvas></div>
    </div>

    <!-- Chart 06: City Breakdown -->
    <div class="chart-section">
        <div class="chart-header">
            <div class="chart-num">06</div>
            <div class="chart-meta">
                <div class="chart-title">City Market Intelligence — Volume & Avg Price</div>
                <div class="chart-desc">Transaction volume and average price across St. Lucie municipalities</div>
            </div>
            <div class="chart-insight" id="insight06">● Loading…</div>
        </div>
        <div class="chart-wrap"><canvas id="chart06"></canvas></div>
    </div>

    <!-- Chart 07: Year Built Era -->
    <div class="chart-section">
        <div class="chart-header">
            <div class="chart-num">07</div>
            <div class="chart-meta">
                <div class="chart-title">Home Age vs Sale Price — Era Analysis</div>
                <div class="chart-desc">Which vintage of homes is selling and at what price — new construction premium vs older inventory discount</div>
            </div>
            <div class="chart-insight" id="insight07">● Loading…</div>
        </div>
        <div class="chart-wrap"><canvas id="chart07"></canvas></div>
    </div>

    <!-- Chart 08: Price per Sqft -->
    <div class="chart-section">
        <div class="chart-header">
            <div class="chart-num">08</div>
            <div class="chart-meta">
                <div class="chart-title">Price Per Square Foot by Home Size</div>
                <div class="chart-desc">PPSF across size bands — reveals where the true value density is in the St. Lucie market</div>
            </div>
            <div class="chart-insight" id="insight08">● Loading…</div>
        </div>
        <div class="chart-wrap"><canvas id="chart08"></canvas></div>
    </div>

    <!-- Motivated Sellers Table -->
    <div class="table-section">
        <div class="table-header">
            <div class="table-title">Out-of-State Owners — Motivated Seller Intelligence</div>
            <div class="table-sub">Property owners with out-of-state mailing addresses who recently sold — highest prices first</div>
        </div>
        <div class="table-wrap">
            <table id="motivatedTable">
                <thead>
                    <tr>
                        <th>Address</th>
                        <th>Seller (Grantor)</th>
                        <th>Buyer (Grantee)</th>
                        <th>Sale Price</th>
                        <th>Sale Date</th>
                        <th>Beds/Bath</th>
                        <th>Sqft</th>
                        <th>Yr Built</th>
                        <th>Owner State</th>
                    </tr>
                </thead>
                <tbody id="motivatedBody">
                    <tr><td colspan="9" class="loading-row">Loading…</td></tr>
                </tbody>
            </table>
        </div>
    </div>

    <div class="findings-footer">
        <div class="findings-icon">◎</div>
        <div class="findings-text">Proprietary Findings — Not Available in Any MLS Report</div>
    </div>

</div>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-annotation@3.0.1/dist/chartjs-plugin-annotation.min.js"></script>
<script src="assets/js/app.js"></script>
</body>
</html>
