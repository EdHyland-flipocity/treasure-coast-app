<?php $pageTitle='St. Lucie County · Single Family Property Intelligence'; ?>
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
                <span class="brand-title">Realtime Real Estate Tracker</span>
                <span class="brand-sub">St. Lucie &middot; Single Family Property Intelligence</span>
            </div>
        </div>
        <div class="topnav-meta">
            <div class="live-indicator"><div class="live-dot"></div><span>Live</span></div>
            <div class="topnav-timestamp" id="timestamp">00:00:00</div>
        </div>
    </nav>
    <header class="page-hero">
        <div class="hero-eyebrow">Single Family Property Intelligence</div>
        <h1 class="hero-title">St. Lucie County <span>Property Registry</span></h1>
        <p class="hero-desc">Search &middot; Filter &middot; Analyze single family home ownership across St. Lucie County districts</p>
    </header>
    <div class="stats-bar">
        <div class="stat-cell"><div class="stat-label">Total Records</div><div class="stat-value loading" id="statTotal">—</div></div>
        <div class="stat-cell"><div class="stat-label">Unique Owners</div><div class="stat-value loading" id="statOwners">—</div></div>
        <div class="stat-cell"><div class="stat-label">Cities</div><div class="stat-value loading" id="statCities">—</div></div>
        <div class="stat-cell"><div class="stat-label">Districts</div><div class="stat-value loading" id="statDistricts">—</div></div>
        <div class="stat-cell"><div class="stat-label">Avg Sale Price</div><div class="stat-value loading" id="statAvgPrice">—</div></div>
        <div class="stat-cell"><div class="stat-label">Avg Sq Ft</div><div class="stat-value loading" id="statAvgSqft">—</div></div>
    </div>
    <main class="main-content">
        <section class="filter-panel">
            <div class="filter-header"><span class="filter-header-icon">⬡</span><span class="filter-header-text">Filter by Owner Name</span></div>
            <div class="filter-row">
                <div class="filter-group">
                    <label class="filter-label" for="nameInput">Owner / Grantee Name</label>
                    <div class="autocomplete-wrap">
                        <span class="input-icon">⬡</span>
                        <input type="text" id="nameInput" class="filter-input" placeholder="Search owner name…" autocomplete="off" spellcheck="false">
                        <div class="autocomplete-dropdown" id="acDropdown"></div>
                    </div>
                </div>
                <div class="per-page-wrap">
                    <label class="filter-label" for="perPageSelect">Rows / Page</label>
                    <select id="perPageSelect" class="select-input">
                        <option value="10">10</option>
                        <option value="25" selected>25</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                    </select>
                </div>
                <div class="filter-actions">
                    <button class="btn btn-primary" id="filterBtn"><span>⬡</span> Search</button>
                    <button class="btn btn-ghost" id="clearBtn">&#x2715; Clear</button>
                </div>
            </div>
        </section>
        <div class="active-filter-bar" id="activeBadgeBar">
            <span class="filter-badge-label">Owner Filter:</span>
            <div class="filter-badge"><span id="badgeName"></span><span class="filter-badge-remove" id="badgeRemove">&#x00D7;</span></div>
        </div>
        <div class="luc-badge-bar" id="lucBadgeBar">
            <span class="filter-badge-label">Property Type Filter:</span>
            <div class="luc-badge"><span id="lucBadgeName"></span><span class="luc-badge-remove" id="lucBadgeRemove">&#x00D7;</span></div>
        </div>
        <section class="results-panel" id="resultsPanel">
            <div class="results-header">
                <div class="results-count" id="resultsCount">Loading records…</div>
                <div class="results-sort-info">Double-click property type to filter &middot; Click headers to sort</div>
            </div>
            <div class="table-wrap">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th data-sort="Owner">Owner <span class="sort-icon">&#x21C5;</span></th>
                            <th data-sort="Situs">Address <span class="sort-icon">&#x21C5;</span></th>
                            <th data-sort="City">City <span class="sort-icon">&#x21C5;</span></th>
                            <th data-sort="LUC Description">Property Type <span class="sort-icon">&#x21C5;</span></th>
                            <th data-sort="Sale Price">Sale Price <span class="sort-icon">&#x21C5;</span></th>
                            <th data-sort="Sale Date">Sale Date <span class="sort-icon">&#x21C5;</span></th>
                            <th data-sort="Finished Area (sq ft)">Sq Ft <span class="sort-icon">&#x21C5;</span></th>
                            <th data-sort="Bedrooms">Bed / Bath <span class="sort-icon">&#x21C5;</span></th>
                            <th data-sort="Year Built">Year Built <span class="sort-icon">&#x21C5;</span></th>
                            <th data-sort="District Group Description">District <span class="sort-icon">&#x21C5;</span></th>
                            <th>Parcel ID</th>
                        </tr>
                    </thead>
                    <tbody id="tableBody"></tbody>
                </table>
            </div>
            <div class="pagination-bar" id="paginationBar" style="display:none;">
                <div class="pagination-info" id="paginationInfo"></div>
                <div class="pagination-controls" id="paginationCtrls"></div>
            </div>
        </section>
    </main>
    <footer class="app-footer">
        <span class="footer-text">Realtime Real Estate Tracker &mdash; St. Lucie County Single Family Property Intelligence</span>
        <span class="footer-db">rt_realestate &middot; stluciecty_singleFamily</span>
    </footer>
</div>
<script src="assets/js/app.js"></script>
</body>
</html>
