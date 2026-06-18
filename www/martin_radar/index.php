<?php $pageTitle = 'Motivated Seller Radar · Martin County'; ?>
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

<nav class="portfolio-nav">
  <span class="portfolio-nav-label">Portfolio</span>
  <a href="http://localhost:8080/realestate_tracker/" class="portfolio-nav-link gold-active"><span class="nav-dot"></span>Pinellas</a>
  <div class="portfolio-nav-divider"></div>
  <a href="http://localhost:8080/sarasota_report/" class="portfolio-nav-link coral-active"><span class="nav-dot"></span>Sarasota Report</a>
  <div class="portfolio-nav-divider"></div>
  <a href="http://localhost:8080/martin/" class="portfolio-nav-link martin-active"><span class="nav-dot"></span>Martin Sales</a>
  <div class="portfolio-nav-divider"></div>
  <a href="http://localhost:8080/martin_report/" class="portfolio-nav-link martin-active"><span class="nav-dot"></span>Martin Analysis</a>
  <div class="portfolio-nav-divider"></div>
  <a href="http://localhost:8080/entity_intel/" class="portfolio-nav-link violet-active"><span class="nav-dot"></span>Entity Intel</a>
  <div class="portfolio-nav-divider"></div>
  <a href="http://localhost:8080/motivated_radar/" class="portfolio-nav-link coral-active"><span class="nav-dot"></span>Sarasota Radar</a>
  <div class="portfolio-nav-divider"></div>
  <a href="http://localhost:8080/martin_radar/" class="portfolio-nav-link active"><span class="nav-dot"></span>Martin Radar</a>
</nav>

<nav class="topnav">
  <div class="topnav-brand">
    <div class="brand-emblem">🎯</div>
    <div class="brand-text">
      <span class="brand-title">Martin County · Motivated Seller Radar</span>
      <span class="brand-sub">Martin County · Peak Buyers Still Holding · Agent Intelligence</span>
    </div>
  </div>
  <div class="topnav-meta">
    <div class="live-indicator"><div class="live-dot"></div><span>Live</span></div>
    <div class="topnav-timestamp" id="timestamp">00:00:00</div>
  </div>
</nav>

<header class="page-hero">
  <div class="hero-eyebrow">Martin County · 2021–2022 Peak Buyers · Still Holding 2025</div>
  <h1 class="hero-title">Motivated Seller <span>Radar</span></h1>
  <p class="hero-desc">Every investor who bought at the 2021–2022 Martin County peak and hasn't resold — scored by motivation level based on purchase price, hold period, homestead status, premium paid over assessed value, and LLC ownership. Data no MLS publishes.</p>
  <div class="hero-tags">
    <span class="hero-tag" id="tagTotal">— Candidates</span>
    <span class="hero-tag" id="tagHot">— HOT (80+)</span>
    <span class="hero-tag" id="tagWarm">— WARM (60-79)</span>
    <span class="hero-tag">2021–2022 Peak Buyers</span>
    <span class="hero-tag">Martin County</span>
    <span class="hero-tag">Direct Mail Ready</span>
  </div>
</header>

<div class="kpi-strip">
  <div class="kpi-cell red"><div class="kpi-label">HOT Leads</div><div class="kpi-value" id="kpiHot">—</div><div class="kpi-sub">Score 80+ · Most motivated</div></div>
  <div class="kpi-cell amber"><div class="kpi-label">WARM Leads</div><div class="kpi-value" id="kpiWarm">—</div><div class="kpi-sub">Score 60–79 · Strong signal</div></div>
  <div class="kpi-cell violet"><div class="kpi-label">Total Candidates</div><div class="kpi-value" id="kpiTotal">—</div><div class="kpi-sub">Peak buyers still holding</div></div>
  <div class="kpi-cell coral"><div class="kpi-label">Confirmed Investors</div><div class="kpi-value" id="kpiInv">—</div><div class="kpi-sub">Non-homestead = no primary residence</div></div>
  <div class="kpi-cell violet"><div class="kpi-label">Avg Peak Price</div><div class="kpi-value" id="kpiAvgPrice">—</div><div class="kpi-sub">What they paid at the top</div></div>
  <div class="kpi-cell amber"><div class="kpi-label">Avg Hold Period</div><div class="kpi-value" id="kpiHold">—</div><div class="kpi-sub">Years since purchase</div></div>
  <div class="kpi-cell coral"><div class="kpi-label">Avg Premium Paid</div><div class="kpi-value" id="kpiPremium">—</div><div class="kpi-sub">Over county just value</div></div>
  <div class="kpi-cell red"><div class="kpi-label">Avg Just Value Now</div><div class="kpi-value" id="kpiJust">—</div><div class="kpi-sub">Current county assessment</div></div>
</div>

<main class="report-main">

  <div class="filter-panel">
    <div class="filter-top">
      <div class="filter-group">
        <div class="filter-label">HEAT SCORE</div>
        <div class="score-tabs">
          <button class="score-tab active" data-min="0"  data-max="100">All</button>
          <button class="score-tab hot"    data-min="80" data-max="100">🔴 HOT 80+</button>
          <button class="score-tab warm"   data-min="60" data-max="79">🟠 WARM 60–79</button>
          <button class="score-tab mod"    data-min="40" data-max="59">🟡 MOD 40–59</button>
        </div>
      </div>
      <div class="filter-group">
        <div class="filter-label">OWNERSHIP</div>
        <div class="score-tabs">
          <button class="score-tab active" data-hs="">All</button>
          <button class="score-tab"        data-hs="N">Investors Only</button>
          <button class="score-tab"        data-hs="Y">Owner-Occupied</button>
        </div>
      </div>
      <div class="filter-group">
        <div class="filter-label">PRICE TIER</div>
        <div class="score-tabs">
          <button class="score-tab active" data-tier="">All</button>
          <button class="score-tab"        data-tier="Ultra-Premium">Ultra-Premium $800K+</button>
          <button class="score-tab"        data-tier="Luxury">Luxury $500K+</button>
          <button class="score-tab"        data-tier="Mid-Market">Mid-Market $300K+</button>
          <button class="score-tab"        data-tier="Entry">Entry Under $300K</button>
        </div>
      </div>
      <div class="filter-group">
        <div class="filter-label">YEAR BOUGHT</div>
        <div class="score-tabs">
          <button class="score-tab active" data-yr="">Both Years</button>
          <button class="score-tab"        data-yr="2021">2021 Peak</button>
          <button class="score-tab"        data-yr="2022">2022 Peak</button>
        </div>
      </div>
    </div>
    <div class="filter-bottom">
      <div class="city-filter-wrap">
        <div class="filter-label">CITY / JURISDICTION</div>
        <div class="city-tabs" id="cityTabs"></div>
      </div>
      <input type="text" id="searchInput" class="search-input" placeholder="Search owner, address, city…">
      <select id="sortSelect" class="sort-select">
        <option value="score">Sort: Score</option>
        <option value="SalePrice">Sort: Sale Price</option>
        <option value="PremiumPaid">Sort: Premium Paid</option>
        <option value="days_held">Sort: Hold Period</option>
        <option value="JustValue">Sort: Just Value</option>
        <option value="SiteCity">Sort: City</option>
      </select>
      <a href="#" id="exportBtn" class="export-btn">⬇ Export CSV</a>
      <span class="result-count" id="resultCount">Loading…</span>
    </div>
  </div>

  <div class="property-grid" id="propertyGrid">
    <div class="loading-state"><div class="spinner"></div><div>Loading motivated sellers…</div></div>
  </div>

  <div class="pagination-bar" id="paginationBar" style="display:none">
    <div class="page-info" id="pageInfo"></div>
    <div class="page-controls" id="pageControls"></div>
  </div>

</main>

<footer class="app-footer">
  <span class="footer-text">Motivated Seller Radar · Martin County · Realtime Real Estate Tracker</span>
  <span class="footer-db">martin_motivated_sellers · martin_transfers · martin_parcels · 2021–2022 peak buyers</span>
</footer>
</div>
<script src="assets/js/app.js"></script>
</body>
</html>
