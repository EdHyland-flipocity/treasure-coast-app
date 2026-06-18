<?php $pageTitle = 'Multi-County Entity Intelligence'; ?>
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
    <div class="brand-emblem">🔎</div>
    <div class="brand-text">
      <span class="brand-title">Multi-County Entity Intelligence</span>
      <span class="brand-sub">Sarasota · Manatee · St. Lucie · Lee · Pinellas · 5-County Network</span>
    </div>
  </div>
  <div class="topnav-meta">
    <div class="live-indicator"><div class="live-dot"></div><span>Live</span></div>
    <div class="topnav-timestamp" id="timestamp">00:00:00</div>
  </div>
</nav>

<header class="page-hero">
  <div class="hero-eyebrow">Florida Gulf Coast, Treasure Coast &amp; Tampa Bay &middot; 5-County Intelligence</div>
  <h1 class="hero-title">Entity <span>Intelligence Network</span></h1>
  <p class="hero-desc">Every builder, investor, LLC, and institutional operator tracked across Sarasota, Manatee, St. Lucie, Lee, and Pinellas counties — with a full historical transaction timeline. Click any entity to see when and where they moved.</p>
  <div class="hero-tags">
    <span class="hero-tag">1,387 Entities</span>
    <span class="hero-tag">54 Multi-County</span>
    <span class="hero-tag">3 All-County</span>
    <span class="hero-tag">17,119 Timeline Points</span>
    <span class="hero-tag">Click for History</span>
  </div>
</header>

<div class="kpi-strip">
  <div class="kpi-cell violet"><div class="kpi-label">Total Entities</div><div class="kpi-value" id="kpiTotal">—</div><div class="kpi-sub">Tracked across all counties</div></div>
  <div class="kpi-cell violet"><div class="kpi-label">Multi-County</div><div class="kpi-value" id="kpiMulti">—</div><div class="kpi-sub">Active in 2+ counties</div></div>
  <div class="kpi-cell gold"><div class="kpi-label">3+ Counties</div><div class="kpi-value" id="kpiTri">—</div><div class="kpi-sub">Active in 3+ counties</div></div>
  <div class="kpi-cell violet"><div class="kpi-label">Total Transactions</div><div class="kpi-value" id="kpiTxn">—</div><div class="kpi-sub">Across all entities shown</div></div>
  <div class="kpi-cell coral"><div class="kpi-label">Total Volume</div><div class="kpi-value" id="kpiVol">—</div><div class="kpi-sub">Combined transaction volume</div></div>
  <div class="kpi-cell violet"><div class="kpi-label">Builders Tracked</div><div class="kpi-value" id="kpiBuilders">—</div><div class="kpi-sub">Production builders identified</div></div>
  <div class="kpi-cell amber"><div class="kpi-label">iBuyers Active</div><div class="kpi-value" id="kpiIbuyers">—</div><div class="kpi-sub">Algorithmic buyers/sellers</div></div>
  <div class="kpi-cell teal"><div class="kpi-label">SFR Operators</div><div class="kpi-value" id="kpiSfr">—</div><div class="kpi-sub">Institutional rental operators</div></div>
</div>

<main class="report-main">

  <!-- Filter Bar -->
  <div class="filter-panel">
    <div class="filter-row">
      <div class="filter-group">
        <div class="filter-label">ENTITY TYPE</div>
        <div class="type-tabs" id="typeTabs">
          <button class="type-tab active" data-type="">All Types</button>
          <button class="type-tab" data-type="Builder">Builders</button>
          <button class="type-tab" data-type="iBuyer">iBuyers</button>
          <button class="type-tab" data-type="SFR Operator">SFR Operators</button>
          <button class="type-tab" data-type="Bank/GSE">Banks/GSE</button>
          <button class="type-tab" data-type="LLC/Corporation">LLC/Corp</button>
        </div>
      </div>
      <div class="filter-group">
        <div class="filter-label">COUNTY PRESENCE</div>
        <div class="type-tabs" id="countyTabs">
          <button class="type-tab active" data-county="">All</button>
          <button class="type-tab county-sara" data-county="Sarasota">Sarasota</button>
          <button class="type-tab county-mana" data-county="Manatee">Manatee</button>
          <button class="type-tab county-stlu" data-county="St.Lucie">St. Lucie</button>
          <button class="type-tab county-lee" data-county="Lee">Lee</button>
          <button class="type-tab county-pin" data-county="Pinellas">Pinellas</button>
          <button class="type-tab county-multi" data-county="2+">2+ Counties</button>
          <button class="type-tab county-tri" data-county="3">3+ Counties</button>
        </div>
      </div>
      <div class="filter-group">
        <div class="filter-label">SEARCH</div>
        <div class="search-wrap">
          <input type="text" id="searchInput" class="search-input" placeholder="Search entity name…">
          <button class="search-clear" id="searchClear" style="display:none">✕</button>
        </div>
      </div>
    </div>
    <div class="sort-row">
      <span class="sort-label">Sort by:</span>
      <select id="sortSelect" class="sort-select">
        <option value="total_txn">Total Transactions</option>
        <option value="total_vol_m">Total Volume</option>
        <option value="county_count">County Count</option>
        <option value="sara_txn">Sarasota Transactions</option>
        <option value="mana_txn">Manatee Transactions</option>
        <option value="stlu_txn">St. Lucie Transactions</option>
        <option value="first_seen">First Active</option>
        <option value="last_seen">Last Active</option>
      </select>
      <select id="dirSelect" class="sort-select">
        <option value="DESC">High → Low</option>
        <option value="ASC">Low → High</option>
      </select>
      <span class="result-count" id="resultCount">Loading…</span>
    </div>
  </div>

  <!-- Entity Grid -->
  <div class="entity-grid" id="entityGrid">
    <div class="loading-state"><div class="spinner"></div><div>Loading entities…</div></div>
  </div>

  <!-- Pagination -->
  <div class="pagination-bar" id="paginationBar" style="display:none">
    <div class="page-info" id="pageInfo"></div>
    <div class="page-controls" id="pageControls"></div>
  </div>

</main>

<!-- Timeline Modal -->
<div class="modal-overlay" id="modalOverlay">
  <div class="modal-box">
    <div class="modal-header">
      <div class="modal-header-left">
        <div class="modal-entity-type" id="modalType"></div>
        <div class="modal-entity-name" id="modalName">—</div>
        <div class="modal-county-dots" id="modalCountyDots"></div>
      </div>
      <button class="modal-close" id="modalClose">✕</button>
    </div>
    <div class="modal-body">
      <div class="modal-chart-wrap">
        <canvas id="timelineChart"></canvas>
      </div>
      <div class="modal-county-cards" id="modalCountyCards"></div>
      <div class="modal-insight" id="modalInsight"></div>
    </div>
  </div>
</div>

<footer class="app-footer">
  <span class="footer-text">Multi-County Entity Intelligence &middot; Realtime Real Estate Tracker</span>
  <span class="footer-db">entity_intelligence · entity_timeline · Sarasota + Manatee + St.Lucie</span>
</footer>

</div><!-- app-shell -->

<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<script src="assets/js/app.js"></script>
</body>
</html>
