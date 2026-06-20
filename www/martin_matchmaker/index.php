<?php $pageTitle = 'Buyer–Seller Matchmaker · Martin County'; ?>
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
    <div class="brand-emblem">⟷</div>
    <div class="brand-text">
      <span class="brand-title">Martin County · Buyer–Seller Matchmaker</span>
      <span class="brand-sub">Motivated Sellers · Active Buyers · Proprietary Match Intelligence</span>
    </div>
  </div>
  <div class="topnav-meta">
    <div class="live-indicator"><div class="live-dot"></div><span>Live</span></div>
    <div class="topnav-timestamp" id="timestamp">00:00:00</div>
  </div>
</nav>

<header class="page-hero">
  <div class="hero-eyebrow">Martin County · Seller × Buyer Intelligence · First-of-Kind</div>
  <h1 class="hero-title">Buyer–Seller <span>Matchmaker</span></h1>
  <p class="hero-desc">Every motivated seller (2021–2022 peak buyers still holding) matched against Martin County's most active acquirers — scored by price tier fit, geographic overlap, purchase recency, and entity type. The intelligence layer that turns raw data into actionable deals.</p>
  <div class="hero-tags">
    <span class="hero-tag" id="tagSellers">— Motivated Sellers</span>
    <span class="hero-tag" id="tagBuyers">— Active Buyers</span>
    <span class="hero-tag" id="tagHotBuyers">— HOT Buyers</span>
    <span class="hero-tag">Proprietary Algorithm</span>
    <span class="hero-tag">Martin County</span>
  </div>
</header>

<div class="kpi-strip">
  <div class="kpi-cell red"><div class="kpi-label">Motivated Sellers</div><div class="kpi-value" id="kpiSellers">—</div><div class="kpi-sub">Peak buyers still holding</div></div>
  <div class="kpi-cell amber"><div class="kpi-label">Hot Sellers (80+)</div><div class="kpi-value" id="kpiHotSellers">—</div><div class="kpi-sub">Highest motivation score</div></div>
  <div class="kpi-cell martin"><div class="kpi-label">Active Buyers</div><div class="kpi-value" id="kpiBuyers">—</div><div class="kpi-sub">Repeat acquirers since 2020</div></div>
  <div class="kpi-cell martin"><div class="kpi-label">Hot Buyers (70+)</div><div class="kpi-value" id="kpiHotBuyers">—</div><div class="kpi-sub">Highest acquisition likelihood</div></div>
  <div class="kpi-cell violet"><div class="kpi-label">Entity Buyers</div><div class="kpi-value" id="kpiEntities">—</div><div class="kpi-sub">LLC / Corp / Trust acquirers</div></div>
  <div class="kpi-cell amber"><div class="kpi-label">Active Last 6mo</div><div class="kpi-value" id="kpiRecent">—</div><div class="kpi-sub">Bought within last 6 months</div></div>
</div>

<main class="report-main">

  <!-- Mode Switcher -->
  <div class="mode-bar">
    <button class="mode-btn active" data-mode="matches">⟷ Matched Pairs</button>
    <button class="mode-btn" data-mode="buyers">👤 Buyer Profiles</button>
  </div>

  <!-- Filter Panel -->
  <div class="filter-panel">
    <div class="filter-row">
      <div class="filter-group">
        <div class="filter-label">CITY / MARKET</div>
        <div class="city-tabs" id="cityTabs"></div>
      </div>
      <div class="filter-group">
        <div class="filter-label">PRICE TIER</div>
        <div class="score-tabs">
          <button class="score-tab active" data-tier="">All Tiers</button>
          <button class="score-tab" data-tier="Ultra-Premium">Ultra-Premium $800K+</button>
          <button class="score-tab" data-tier="Luxury">Luxury $500K+</button>
          <button class="score-tab" data-tier="Mid-Market">Mid-Market $300K+</button>
          <button class="score-tab" data-tier="Entry">Entry Under $300K</button>
        </div>
      </div>
      <div class="filter-right">
        <input type="text" id="addressSearch" class="search-input" placeholder="🔍 Search address or parcel ID…">
        <input type="text" id="buyerSearch" class="search-input" placeholder="Search buyer name…" style="display:none">
        <a href="#" id="exportBtn" class="export-btn">⬇ Export CSV</a>
        <span class="result-count" id="resultCount">Loading…</span>
      </div>
    </div>
  </div>

  <!-- Content Area -->
  <div id="contentArea">
    <div class="loading-state"><div class="spinner"></div><div>Loading matches…</div></div>
  </div>

  <!-- Pagination -->
  <div class="pagination-bar" id="paginationBar" style="display:none">
    <div class="page-info" id="pageInfo"></div>
    <div class="page-controls" id="pageControls"></div>
  </div>

</main>

<!-- Detail Modal -->
<div class="modal-overlay" id="modalOverlay">
  <div class="modal">
    <div class="modal-header">
      <div class="modal-title" id="modalTitle">Property Detail</div>
      <button class="modal-close" id="modalClose">✕</button>
    </div>
    <div class="modal-body" id="modalBody"></div>
  </div>
</div>

<footer class="app-footer">
  <span>Buyer–Seller Matchmaker · Martin County · Realtime Real Estate Tracker</span>
  <span class="footer-db">martin_motivated_sellers · martin_motivated_buyers · martin_transfers</span>
</footer>
</div>
<script src="assets/js/app.js"></script>
</body>
</html>
