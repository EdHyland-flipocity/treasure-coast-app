<?php $pageTitle = 'Flip Velocity Tracker · Treasure Coast'; ?>
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
            <div class="brand-emblem">⟳</div>
            <div class="brand-text">
                <span class="brand-title">Flip Velocity Tracker</span>
                <span class="brand-sub">Martin County · Treasure Coast · 2020–2026</span>
            </div>
        </div>
        <div class="topnav-meta">
            <div class="live-indicator"><div class="live-dot"></div><span>Live</span></div>
            <div class="topnav-timestamp" id="timestamp">00:00:00</div>
        </div>
    </nav>

    <header class="page-hero">
        <div class="hero-eyebrow">Martin County · Treasure Coast · Parcel Sales 2020–2026</div>
        <h1 class="hero-title">Flip <span>Velocity Tracker</span></h1>
        <p class="hero-desc">Every property sold more than once in Martin County — holding periods, price gains, annualized returns, and serial flipper intelligence — data no MLS publishes</p>
    </header>

    <div class="kpi-strip">
        <div class="kpi-cell green"><div class="kpi-label">Total Flips</div><div class="kpi-value" id="kpiFlips">—</div><div class="kpi-sub">Consecutive WD pairs</div></div>
        <div class="kpi-cell teal"><div class="kpi-label">Unique Parcels</div><div class="kpi-value" id="kpiParcels">—</div><div class="kpi-sub">Flipped 1+ times</div></div>
        <div class="kpi-cell gold"><div class="kpi-label">Avg Price Gain</div><div class="kpi-value" id="kpiGain">—</div><div class="kpi-sub">Across all flip pairs</div></div>
        <div class="kpi-cell amber"><div class="kpi-label">Avg Dollar Gain</div><div class="kpi-value" id="kpiDollar">—</div><div class="kpi-sub">Per transaction</div></div>
        <div class="kpi-cell coral"><div class="kpi-label">Avg Hold Period</div><div class="kpi-value" id="kpiHold">—</div><div class="kpi-sub">Between buy and sell</div></div>
        <div class="kpi-cell violet"><div class="kpi-label">Profitable Flips</div><div class="kpi-value" id="kpiProfit">—</div><div class="kpi-sub">Sold above purchase price</div></div>
        <div class="kpi-cell red"><div class="kpi-label">Total Value Created</div><div class="kpi-value" id="kpiTotal">—</div><div class="kpi-sub">Sum of all gains</div></div>
        <div class="kpi-cell lime"><div class="kpi-label">Best Single Flip</div><div class="kpi-value" id="kpiBest">—</div><div class="kpi-sub">Highest % gain recorded</div></div>
    </div>

    <div class="filter-panel">
        <div class="filter-title">⚡ Filter Flip Data</div>
        <div class="filter-grid">
            <div class="filter-field"><label>Buy Year From</label><input type="number" id="fYearFrom" value="2023" min="2020" max="2026"></div>
            <div class="filter-field"><label>Buy Year To</label><input type="number" id="fYearTo" value="2026" min="2020" max="2026"></div>
            <div class="filter-field"><label>Min % Gain</label><input type="number" id="fMinGain" placeholder="e.g. 20"></div>
            <div class="filter-field"><label>Min Hold (Days)</label><input type="number" id="fMinHold" placeholder="e.g. 30"></div>
            <div class="filter-field"><label>Max Hold (Days)</label><input type="number" id="fMaxHold" placeholder="e.g. 730"></div>
            <div class="filter-field filter-wide"><label>Grantor (Seller) Name</label><input type="text" id="fGrantor" placeholder="Search seller name..."></div>
            <div class="filter-field"><label>Rows / Page</label><select id="fPerPage"><option value="25">25</option><option value="50">50</option><option value="100">100</option></select></div>
        </div>
        <div class="filter-actions">
            <button class="btn-apply" id="btnApply">↗ Apply</button>
            <button class="btn-clear" id="btnClear">✕ Clear</button>
        </div>
    </div>

    <div class="charts-row">
        <div class="chart-card">
            <div class="chart-card-title">Gain Distribution <span class="county-badge">MARTIN</span></div>
            <div class="chart-card-sub">Number of flips per return bracket</div>
            <div class="chart-card-wrap"><canvas id="chartGain"></canvas></div>
        </div>
        <div class="chart-card">
            <div class="chart-card-title">Hold Period Distribution <span class="county-badge">MARTIN</span></div>
            <div class="chart-card-sub">How long owners hold before flipping</div>
            <div class="chart-card-wrap"><canvas id="chartHold"></canvas></div>
        </div>
    </div>

    <div class="chart-full">
        <div class="chart-card-title">Flip Activity by Year <span class="county-badge">TREASURE COAST 2020–2026</span></div>
        <div class="chart-card-sub">Buy year · bars = flip count · line = avg % gain</div>
        <div class="chart-full-wrap"><canvas id="chartYear"></canvas></div>
    </div>

    <div class="table-section">
        <div class="table-header">
            <div class="table-title">Flip Records <span id="tableCount"></span></div>
            <div class="table-sort">
                Sort by:
                <select id="sortField">
                    <option value="gain_pct">% Gain</option>
                    <option value="dollar_gain">Dollar Gain</option>
                    <option value="hold_days">Hold Period</option>
                    <option value="buy_price">Buy Price</option>
                    <option value="sell_price">Sell Price</option>
                </select>
                <select id="sortDir">
                    <option value="DESC">High → Low</option>
                    <option value="ASC">Low → High</option>
                </select>
            </div>
        </div>
        <div class="table-wrap">
            <table>
                <thead>
                    <tr>
                        <th>Parcel ID</th>
                        <th>Seller</th>
                        <th>Buyer</th>
                        <th>Buy Date</th>
                        <th>Sell Date</th>
                        <th>Buy Price</th>
                        <th>Sell Price</th>
                        <th>$ Gain</th>
                        <th>% Gain</th>
                        <th>Hold</th>
                        <th>Deed</th>
                    </tr>
                </thead>
                <tbody id="flipBody"><tr><td colspan="11" class="loading-row">Loading flip data…</td></tr></tbody>
            </table>
        </div>
        <div class="pagination" id="pagination"></div>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<script src="assets/js/app.js"></script>
</body>
</html>
