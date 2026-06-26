<?php $pageTitle = 'Indian River County · Market Intelligence'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
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
    <div class="brand-emblem">◎</div>
    <div class="brand-text">
      <span class="brand-title">Indian River County · Market Intelligence</span>
      <span class="brand-sub">448,398 Warranty Deeds · 1960–2026 · Vero Beach & Treasure Coast</span>
    </div>
  </div>
  <div class="topnav-meta">
    <div class="live-indicator"><div class="live-dot"></div><span>Live</span></div>
    <div class="topnav-timestamp" id="timestamp">00:00:00</div>
  </div>
</nav>

<header class="page-hero">
  <div class="hero-eyebrow">Indian River County · Florida · 65-Year Historical Analysis</div>
  <h1 class="hero-title">Full Market <span>Cycle Intelligence</span></h1>
  <p class="hero-desc">The complete Indian River County real estate market cycle — Vero Beach, Sebastian, Fellsmere, and the barrier island corridor. 109,500 verified flip pairs, 26-year stress index, and out-of-state buyer migration data no MLS publishes.</p>
  <div class="hero-tags">
    <span class="hero-tag">448,398 Warranty Deeds</span>
    <span class="hero-tag">93,931 Unique Parcels</span>
    <span class="hero-tag">65 Years</span>
    <span class="hero-tag">109,500 Flip Pairs</span>
    <span class="hero-tag">$21.8B Value Created</span>
  </div>
</header>

<div class="kpi-strip">
  <div class="kpi-cell ir"><div class="kpi-label">Total WD Sales</div><div class="kpi-value" id="kpiTotal">—</div><div class="kpi-sub">1960–2026 warranty deeds</div></div>
  <div class="kpi-cell amber"><div class="kpi-label">Unique Parcels</div><div class="kpi-value" id="kpiParcels">—</div><div class="kpi-sub">Active in market</div></div>
  <div class="kpi-cell green"><div class="kpi-label">2025 Avg Price</div><div class="kpi-value" id="kpi2025">—</div><div class="kpi-sub">Warranty deeds ≤$2M</div></div>
  <div class="kpi-cell red"><div class="kpi-label">2024 Avg Price</div><div class="kpi-value" id="kpi2024">—</div><div class="kpi-sub">Warranty deeds ≤$2M</div></div>
  <div class="kpi-cell violet"><div class="kpi-label">Flip Pairs</div><div class="kpi-value" id="kpiFlips">—</div><div class="kpi-sub">2015+ verified pairs</div></div>
  <div class="kpi-cell ir"><div class="kpi-label">Value Created</div><div class="kpi-value" id="kpiValue">—</div><div class="kpi-sub">Total flip gains</div></div>
</div>

<main class="report-main">

  <!-- Mode switcher -->
  <div class="mode-bar">
    <button class="mode-btn active" data-mode="report">📊 Market Report</button>
    <button class="mode-btn" data-mode="flips">⚡ Flip Tracker</button>
    <button class="mode-btn" data-mode="owners">👤 Owner Search</button>
  </div>

  <!-- REPORT MODE -->
  <div id="reportMode">

    <section class="chart-section wide">
      <div class="section-header">
        <div class="section-num">01</div>
        <div>
          <div class="section-title">25-Year Market Cycle — Warranty Deed Transactions</div>
          <div class="section-sub">Annual transaction volume and average sale price 2000–2026 · Prices capped at $2M to exclude outliers</div>
        </div>
      </div>
      <div class="chart-wrap tall"><canvas id="chartCycle"></canvas></div>
    </section>

    <section class="chart-section wide">
      <div class="section-header">
        <div class="section-num">02</div>
        <div>
          <div class="section-title">Market Stress Index — QC + CT Deed Ratio</div>
          <div class="section-sub">Quit Claim and Consent deeds as % of all transactions — leading indicator of distress · Indian River peaked at 28.8% in 2009</div>
        </div>
        <div class="insight-badge warning"><span class="insight-icon">⚠</span> <span id="stressInsight">Current stress level monitoring</span></div>
      </div>
      <div class="chart-wrap"><canvas id="chartStress"></canvas></div>
    </section>

    <section class="chart-section wide">
      <div class="section-header">
        <div class="section-num">03</div>
        <div>
          <div class="section-title">Out-of-State Owner Migration</div>
          <div class="section-sub">Non-Florida mailing addresses in Indian River County ownership records — Northeast corridor dominates</div>
        </div>
      </div>
      <div class="chart-wrap"><canvas id="chartOOS"></canvas></div>
    </section>

    <section class="chart-section wide">
      <div class="section-header">
        <div class="section-num">04</div>
        <div>
          <div class="section-title">Price Tier Distribution Shift — 2010 to 2026</div>
          <div class="section-sub">How Indian River's price composition has changed — entry-level compression vs luxury expansion</div>
        </div>
      </div>
      <div class="chart-wrap tall"><canvas id="chartTiers"></canvas></div>
    </section>

    <section class="chart-section wide">
      <div class="section-header">
        <div class="section-num">05</div>
        <div>
          <div class="section-title">Top Grantor Intelligence</div>
          <div class="section-sub">Most active sellers 2015–2026 by warranty deed count</div>
        </div>
      </div>
      <div id="grantorTable" class="table-section"></div>
    </section>

  </div>

  <!-- FLIP TRACKER MODE -->
  <div id="flipMode" style="display:none">
    <div class="filter-panel">
      <div class="filter-row">
        <div class="filter-group">
          <div class="filter-label">BUY YEAR FROM</div>
          <input type="number" id="flipYearFrom" class="filter-input" value="2020" min="2015" max="2026">
        </div>
        <div class="filter-group">
          <div class="filter-label">BUY YEAR TO</div>
          <input type="number" id="flipYearTo" class="filter-input" value="2026" min="2015" max="2026">
        </div>
        <div class="filter-group">
          <div class="filter-label">MIN % GAIN</div>
          <input type="number" id="flipMinGain" class="filter-input" placeholder="e.g. 20">
        </div>
        <div class="filter-group">
          <div class="filter-label">SELLER NAME</div>
          <input type="text" id="flipGrantor" class="filter-input" placeholder="Search seller...">
        </div>
        <div class="filter-group">
          <button id="flipSearchBtn" class="search-btn">⚡ Search Flips</button>
        </div>
      </div>
    </div>
    <div class="flip-summary-strip" id="flipSummaryStrip"></div>
    <div id="flipResults"></div>
    <div id="flipPagination" class="pagination-bar" style="display:none">
      <div id="flipPageInfo" class="page-info"></div>
      <div id="flipPageControls" class="page-controls"></div>
    </div>
  </div>

  <!-- OWNER SEARCH MODE -->
  <div id="ownerMode" style="display:none">
    <div class="filter-panel">
      <div class="filter-row">
        <div class="filter-group" style="flex:2">
          <div class="filter-label">OWNER NAME / ADDRESS / PARCEL ID</div>
          <input type="text" id="ownerSearch" class="filter-input" placeholder="Search owner name, address, or parcel ID...">
        </div>
        <div class="filter-group">
          <div class="filter-label">OUT-OF-STATE</div>
          <select id="ownerState" class="filter-input">
            <option value="">All States</option>
            <option value="NY">New York</option>
            <option value="MA">Massachusetts</option>
            <option value="PA">Pennsylvania</option>
            <option value="NJ">New Jersey</option>
            <option value="CT">Connecticut</option>
            <option value="IL">Illinois</option>
            <option value="TX">Texas</option>
            <option value="OH">Ohio</option>
            <option value="MI">Michigan</option>
            <option value="GA">Georgia</option>
          </select>
        </div>
        <div class="filter-group">
          <button id="ownerSearchBtn" class="search-btn">🔍 Search Owners</button>
        </div>
      </div>
    </div>
    <div id="ownerResults"></div>
    <div id="ownerPagination" class="pagination-bar" style="display:none">
      <div id="ownerPageInfo" class="page-info"></div>
      <div id="ownerPageControls" class="page-controls"></div>
    </div>
  </div>

</main>

<footer class="app-footer">
  <span class="footer-text">Indian River County Market Intelligence · Flipocity Analytics</span>
  <span class="footer-db">rt_realestate · indian_river_sales · indian_river_owners · indian_river_flip_pairs</span>
</footer>
</div>

<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<script src="assets/js/app.js"></script>
</body>
</html>
