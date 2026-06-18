'use strict';

Chart.defaults.color = '#5C7088';
Chart.defaults.borderColor = '#1B2D4F';
Chart.defaults.font.family = "'Montserrat', system-ui, sans-serif";

const FMT = {
    price:   v => v >= 1000000 ? '$' + (v/1000000).toFixed(2) + 'M' : '$' + Math.round(v/1000) + 'K',
    num:     v => v ? v.toLocaleString() : '—',
    pct:     v => (v > 0 ? '+' : '') + v + '%',
    days:    v => v >= 365 ? (v/365).toFixed(1) + 'yr' : v + 'd',
};

let currentPage = 1;
let gainChart = null, holdChart = null, yearChart = null;

setInterval(() => {
    const el = document.getElementById('timestamp');
    if (el) el.textContent = new Date().toTimeString().slice(0,8);
}, 1000);

function buildParams(extra = {}) {
    return new URLSearchParams({
        year_from: document.getElementById('fYearFrom').value || 2020,
        year_to:   document.getElementById('fYearTo').value   || 2026,
        min_gain:  document.getElementById('fMinGain').value  || -999,
        min_hold:  document.getElementById('fMinHold').value  || 0,
        max_hold:  document.getElementById('fMaxHold').value  || 99999,
        grantor:   document.getElementById('fGrantor').value  || '',
        ...extra,
    });
}

async function loadStats() {
    const res  = await fetch('api/stats.php?' + buildParams());
    const data = await res.json();
    if (!data.success) return;

    const s = data.stats;
    document.getElementById('kpiFlips').textContent   = FMT.num(s.total_flips);
    document.getElementById('kpiParcels').textContent = FMT.num(s.unique_parcels);
    document.getElementById('kpiGain').textContent    = FMT.pct(s.avg_gain_pct);
    document.getElementById('kpiDollar').textContent  = FMT.price(s.avg_dollar_gain);
    document.getElementById('kpiHold').textContent    = FMT.days(s.avg_hold_days);
    document.getElementById('kpiProfit').textContent  = FMT.num(s.profitable_flips);
    document.getElementById('kpiTotal').textContent   = FMT.price(s.total_value_created);
    document.getElementById('kpiBest').textContent    = '+' + s.best_flip_pct + '%';

    renderGainChart(data.distribution);
    renderHoldChart(data.holdDist);
    renderYearChart(data.byYear);
}

async function loadRecords(page = 1) {
    currentPage = page;
    const tbody = document.getElementById('flipBody');
    tbody.innerHTML = '<tr><td colspan="10" class="loading-row">Loading…</td></tr>';

    const params = buildParams({
        sort: document.getElementById('sortField').value,
        dir:  document.getElementById('sortDir').value,
        page, per_page: document.getElementById('fPerPage').value,
    });

    const res  = await fetch('api/records.php?' + params);
    const data = await res.json();
    if (!data.success) return;

    document.getElementById('tableCount').textContent =
        `— ${FMT.num(data.total)} records`;

    tbody.innerHTML = data.records.map(r => `
        <tr>
            <td><span style="font-family:monospace;font-size:10px;color:#5ED8CC">${r.ParcelID}</span></td>
            <td title="${r.seller}">${r.seller?.substring(0,30) || '—'}${r.seller?.length > 30 ? '…' : ''}</td>
            <td title="${r.buyer}">${r.buyer?.substring(0,25) || '—'}${r.buyer?.length > 25 ? '…' : ''}</td>
            <td>${r.buy_date}</td>
            <td>${r.sell_date}</td>
            <td>${FMT.price(r.buy_price)}</td>
            <td>${FMT.price(r.sell_price)}</td>
            <td class="${r.dollar_gain >= 0 ? 'gain-pos' : 'gain-neg'}">${FMT.price(Math.abs(r.dollar_gain))}</td>
            <td class="${r.gain_pct >= 0 ? 'gain-pos' : 'gain-neg'}">${FMT.pct(r.gain_pct)}</td>
            <td>${FMT.days(r.hold_days)}</td>
        </tr>
    `).join('');

    renderPagination(data.total, data.perPage, page);
}

function renderPagination(total, perPage, current) {
    const pages = Math.ceil(total / perPage);
    const el = document.getElementById('pagination');
    if (pages <= 1) { el.innerHTML = ''; return; }

    const buttons = [];
    if (current > 1) buttons.push(`<button class="page-btn" onclick="loadRecords(${current-1})">← Prev</button>`);
    const start = Math.max(1, current - 2);
    const end   = Math.min(pages, current + 2);
    for (let i = start; i <= end; i++) {
        buttons.push(`<button class="page-btn ${i===current?'active':''}" onclick="loadRecords(${i})">${i}</button>`);
    }
    if (current < pages) buttons.push(`<button class="page-btn" onclick="loadRecords(${current+1})">Next →</button>`);
    el.innerHTML = buttons.join('');
}

function renderGainChart(dist) {
    if (gainChart) gainChart.destroy();
    const colors = ['#EF4444','#94A3B8','#C9A84C','#2ABFB0','#10B981','#8B5CF6'];
    gainChart = new Chart(document.getElementById('chartGain'), {
        type: 'bar',
        data: {
            labels: dist.map(d => d.gain_bucket),
            datasets: [{
                label: 'Flips',
                data: dist.map(d => d.cnt),
                backgroundColor: colors,
                borderColor: colors,
                borderWidth: 1,
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { grid: { color: '#1B2D4F' } }, x: { grid: { color: '#1B2D4F' } } }
        }
    });
}

function renderHoldChart(dist) {
    if (holdChart) holdChart.destroy();
    const colors = ['#EC4899','#E8823A','#C9A84C','#2ABFB0','#8B5CF6','#64748B'];
    holdChart = new Chart(document.getElementById('chartHold'), {
        type: 'doughnut',
        data: {
            labels: dist.map(d => d.hold_bucket),
            datasets: [{
                data: dist.map(d => d.cnt),
                backgroundColor: colors.map(c => c + 'CC'),
                borderColor: colors,
                borderWidth: 2,
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'right', labels: { font: { size: 10 } } } }
        }
    });
}

function renderYearChart(byYear) {
    if (yearChart) yearChart.destroy();
    yearChart = new Chart(document.getElementById('chartYear'), {
        data: {
            labels: byYear.map(y => y.buy_year),
            datasets: [
                {
                    type: 'bar', label: 'Flip Count', data: byYear.map(y => y.flips),
                    backgroundColor: 'rgba(42,191,176,0.3)', borderColor: '#2ABFB0', borderWidth: 1, yAxisID: 'y2',
                },
                {
                    type: 'line', label: 'Avg % Gain', data: byYear.map(y => y.avg_gain),
                    borderColor: '#C9A84C', backgroundColor: 'transparent',
                    borderWidth: 2, pointRadius: 5, pointBackgroundColor: '#C9A84C',
                    tension: 0.3, yAxisID: 'y1',
                }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: { legend: { position: 'top' } },
            scales: {
                y1: { position: 'left', ticks: { callback: v => v + '%' }, grid: { color: '#1B2D4F' } },
                y2: { position: 'right', grid: { display: false } },
                x:  { grid: { color: '#1B2D4F' } }
            }
        }
    });
}

document.getElementById('btnApply').addEventListener('click', () => { loadStats(); loadRecords(1); });
document.getElementById('btnClear').addEventListener('click', () => {
    ['fYearFrom','fYearTo','fMinGain','fMinHold','fMaxHold','fGrantor'].forEach(id => {
        const el = document.getElementById(id);
        if (el.tagName === 'INPUT') el.value = el.defaultValue || '';
    });
    document.getElementById('fYearFrom').value = 2020;
    document.getElementById('fYearTo').value   = 2026;
    loadStats(); loadRecords(1);
});
document.getElementById('sortField').addEventListener('change', () => loadRecords(1));
document.getElementById('sortDir').addEventListener('change',   () => loadRecords(1));
document.getElementById('fPerPage').addEventListener('change',  () => loadRecords(1));

loadStats();
loadRecords(1);
