'use strict';

function fmtK(n){const v=parseFloat(n)||0;if(!v)return'—';if(v>=1e9)return'$'+(v/1e9).toFixed(1)+'B';if(v>=1e6)return'$'+(v/1e6).toFixed(1)+'M';return'$'+(v/1000).toFixed(0)+'K';}
function fmtNum(n){return Math.round(parseFloat(n)||0).toLocaleString();}
function escHtml(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function animateCount(el,target,fmt){
    if(!el)return;const steps=50,dur=700,delta=target/steps;let cur=0,cnt=0;
    const t=setInterval(()=>{cnt++;cur+=delta;const v=cnt>=steps?target:cur;
        el.textContent=fmt?fmt(v):Math.round(v).toLocaleString();if(cnt>=steps)clearInterval(t);},dur/steps);
}

let State = { mode:'report', flipPage:1, ownerPage:1, flipData:null };

// ── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    // Timestamp
    const ts = document.getElementById('timestamp');
    function tick(){if(ts)ts.textContent=new Date().toLocaleTimeString('en-US',{hour12:false,hour:'2-digit',minute:'2-digit',second:'2-digit'});}
    tick(); setInterval(tick,1000);

    // Mode buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.mode-btn').forEach(b=>b.classList.remove('active'));
            btn.classList.add('active');
            State.mode = btn.dataset.mode;
            document.getElementById('reportMode').style.display = State.mode==='report'?'':'none';
            document.getElementById('flipMode').style.display   = State.mode==='flips'?'':'none';
            document.getElementById('ownerMode').style.display  = State.mode==='owners'?'':'none';
            if(State.mode==='flips' && !State.flipData) loadFlips();
        });
    });

    document.getElementById('flipSearchBtn').addEventListener('click', ()=>{State.flipPage=1;loadFlips();});
    document.getElementById('ownerSearchBtn').addEventListener('click', ()=>{State.ownerPage=1;loadOwners();});

    // Enter key on inputs
    ['flipYearFrom','flipYearTo','flipMinGain','flipGrantor'].forEach(id=>{
        document.getElementById(id).addEventListener('keydown', e=>{ if(e.key==='Enter'){State.flipPage=1;loadFlips();}});
    });
    ['ownerSearch','ownerState'].forEach(id=>{
        document.getElementById(id).addEventListener('keydown', e=>{ if(e.key==='Enter'){State.ownerPage=1;loadOwners();}});
    });

    loadReport();
});

// ── Load Report ──────────────────────────────────────────────
async function loadReport() {
    try {
        const res  = await fetch('api/data.php?mode=summary');
        const data = await res.json();
        if(!data.success) throw new Error();

        // KPIs
        const k = data.kpi;
        animateCount(document.getElementById('kpiTotal'),   parseInt(k.total_wd)||0, fmtNum);
        animateCount(document.getElementById('kpiParcels'), parseInt(k.unique_parcels)||0, fmtNum);
        document.getElementById('kpi2025').textContent = fmtK(k.avg_2025);
        document.getElementById('kpi2024').textContent = fmtK(k.avg_2024);
        animateCount(document.getElementById('kpiFlips'),   parseInt(data.flips.total_pairs)||0, fmtNum);
        document.getElementById('kpiValue').textContent = '$'+data.flips.total_value_b+'B';

        // Stress insight
        const latestStress = data.stress[data.stress.length-1];
        if(latestStress) {
            document.getElementById('stressInsight').textContent =
                `Current ${latestStress.yr} stress: ${latestStress.total_stress}% — Peak was 28.8% in 2009`;
        }

        buildCycleChart(data.cycle);
        buildStressChart(data.stress);
        buildOOSChart(data.oos);
        buildTiersChart(data.tiers);
        buildGrantorTable(data.grantors);

    } catch(e) {
        console.error('Report load failed', e);
    }
}

// ── Charts ───────────────────────────────────────────────────
function buildCycleChart(cycle) {
    const ctx = document.getElementById('chartCycle').getContext('2d');
    new Chart(ctx, {
        data: {
            labels: cycle.map(r=>r.yr),
            datasets: [
                {
                    type:'bar', label:'Transactions',
                    data: cycle.map(r=>r.transactions),
                    backgroundColor: 'rgba(46,134,171,0.3)',
                    borderColor: 'rgba(46,134,171,0.6)',
                    borderWidth:1, yAxisID:'y1'
                },
                {
                    type:'line', label:'Avg Price',
                    data: cycle.map(r=>r.avg_price),
                    borderColor:'#C9A84C', backgroundColor:'rgba(201,168,76,0.1)',
                    borderWidth:2, pointRadius:3, tension:0.3, yAxisID:'y2', fill:true
                }
            ]
        },
        options: {
            responsive:true, maintainAspectRatio:false,
            plugins:{legend:{labels:{color:'#E8EDF5',font:{size:11}}}},
            scales:{
                x:{ticks:{color:'#6B7A8D',font:{size:10}},grid:{color:'rgba(26,46,74,0.5)'}},
                y1:{position:'left',ticks:{color:'#6B7A8D',font:{size:10}},grid:{color:'rgba(26,46,74,0.5)'},title:{display:true,text:'Transactions',color:'#6B7A8D',font:{size:10}}},
                y2:{position:'right',ticks:{color:'#C9A84C',font:{size:10},callback:v=>'$'+(v/1000).toFixed(0)+'K'},grid:{display:false},title:{display:true,text:'Avg Price',color:'#C9A84C',font:{size:10}}}
            }
        }
    });
}

function buildStressChart(stress) {
    const ctx = document.getElementById('chartStress').getContext('2d');
    new Chart(ctx, {
        type:'line',
        data: {
            labels: stress.map(r=>r.yr),
            datasets: [
                {label:'Total Stress %', data:stress.map(r=>r.total_stress), borderColor:'#EF4444', backgroundColor:'rgba(239,68,68,0.15)', borderWidth:2, fill:true, tension:0.3},
                {label:'QC %', data:stress.map(r=>r.qc_pct), borderColor:'#D4A017', borderWidth:1.5, tension:0.3, borderDash:[4,4]},
                {label:'CT %', data:stress.map(r=>r.ct_pct), borderColor:'#8B5CF6', borderWidth:1.5, tension:0.3, borderDash:[4,4]}
            ]
        },
        options:{
            responsive:true, maintainAspectRatio:false,
            plugins:{legend:{labels:{color:'#E8EDF5',font:{size:11}}}},
            scales:{
                x:{ticks:{color:'#6B7A8D',font:{size:10}},grid:{color:'rgba(26,46,74,0.5)'}},
                y:{ticks:{color:'#6B7A8D',font:{size:10},callback:v=>v+'%'},grid:{color:'rgba(26,46,74,0.5)'}}
            }
        }
    });
}

function buildOOSChart(oos) {
    const ctx = document.getElementById('chartOOS').getContext('2d');
    const colors = ['#2E86AB','#C9A84C','#2ABFB0','#E8823A','#8B5CF6','#EF4444','#10B981','#D4A017','#5BA3C9','#E8C97E','#5ED8CC','#F87171'];
    new Chart(ctx, {
        type:'bar',
        data: {
            labels: oos.map(r=>r.State),
            datasets:[{
                label:'Out-of-State Owners',
                data: oos.map(r=>r.cnt),
                backgroundColor: colors,
                borderWidth:0
            }]
        },
        options:{
            responsive:true, maintainAspectRatio:false,
            plugins:{legend:{display:false}},
            scales:{
                x:{ticks:{color:'#E8EDF5',font:{size:11,weight:'600'}},grid:{display:false}},
                y:{ticks:{color:'#6B7A8D',font:{size:10}},grid:{color:'rgba(26,46,74,0.5)'}}
            }
        }
    });
}

function buildTiersChart(tiers) {
    const ctx = document.getElementById('chartTiers').getContext('2d');
    new Chart(ctx, {
        type:'bar',
        data: {
            labels: tiers.map(r=>r.yr),
            datasets:[
                {label:'Under $200K',  data:tiers.map(r=>r.under_200k), backgroundColor:'#2E86AB', stack:'s'},
                {label:'$200K–$400K',  data:tiers.map(r=>r.t200_400k),  backgroundColor:'#2ABFB0', stack:'s'},
                {label:'$400K–$600K',  data:tiers.map(r=>r.t400_600k),  backgroundColor:'#C9A84C', stack:'s'},
                {label:'$600K–$1M',    data:tiers.map(r=>r.t600k_1m),   backgroundColor:'#E8823A', stack:'s'},
                {label:'$1M+',         data:tiers.map(r=>r.over_1m),    backgroundColor:'#8B5CF6', stack:'s'},
            ]
        },
        options:{
            responsive:true, maintainAspectRatio:false,
            plugins:{legend:{labels:{color:'#E8EDF5',font:{size:10}}}},
            scales:{
                x:{stacked:true,ticks:{color:'#6B7A8D',font:{size:10}},grid:{color:'rgba(26,46,74,0.5)'}},
                y:{stacked:true,ticks:{color:'#6B7A8D',font:{size:10}},grid:{color:'rgba(26,46,74,0.5)'}}
            }
        }
    });
}

function buildGrantorTable(grantors) {
    if(!grantors||!grantors.length){document.getElementById('grantorTable').innerHTML='<p style="color:var(--text-muted);padding:20px">No grantor data available.</p>';return;}
    const html = `<table class="grantor-table">
        <thead><tr>
            <th>Grantor / Seller</th><th>Transactions</th><th>Avg Price</th>
            <th>Total Volume</th><th>First Sale</th><th>Last Sale</th>
        </tr></thead>
        <tbody>${grantors.map(g=>`<tr>
            <td style="font-weight:500">${escHtml(g.Grantor)}</td>
            <td style="font-family:'Space Mono',monospace;color:var(--ir-light)">${fmtNum(g.transactions)}</td>
            <td style="color:var(--amber)">${fmtK(g.avg_price)}</td>
            <td style="color:var(--green)">${fmtK(g.total_volume)}</td>
            <td style="color:var(--text-muted)">${g.first_yr}</td>
            <td style="color:var(--text-muted)">${g.last_yr}</td>
        </tr>`).join('')}</tbody>
    </table>`;
    document.getElementById('grantorTable').innerHTML = html;
}

// ── Flip Tracker ─────────────────────────────────────────────
async function loadFlips() {
    document.getElementById('flipResults').innerHTML =
        '<div class="loading-state"><div class="spinner"></div><div>Loading flip data…</div></div>';

    const params = new URLSearchParams({
        mode:'flips',
        year_from: document.getElementById('flipYearFrom').value,
        year_to:   document.getElementById('flipYearTo').value,
        min_gain:  document.getElementById('flipMinGain').value||0,
        grantor:   document.getElementById('flipGrantor').value,
        page:      State.flipPage,
        per_page:  25,
    });

    try {
        const res  = await fetch('api/data.php?'+params);
        const data = await res.json();
        if(!data.success) throw new Error();

        State.flipData = data;

        // Summary strip
        const flips = data.flips||[];
        if(flips.length){
            const avgGain = flips.reduce((s,f)=>s+parseFloat(f.gain_pct||0),0)/flips.length;
            const avgDays = flips.reduce((s,f)=>s+parseInt(f.hold_days||0),0)/flips.length;
            const totalGain = flips.reduce((s,f)=>s+parseFloat(f.gain_dollars||0),0);
            document.getElementById('flipSummaryStrip').innerHTML = `
                <div class="flip-stat"><div class="flip-stat-label">Results</div><div class="flip-stat-val">${fmtNum(data.total)}</div></div>
                <div class="flip-stat"><div class="flip-stat-label">Avg Gain %</div><div class="flip-stat-val">${avgGain.toFixed(1)}%</div></div>
                <div class="flip-stat"><div class="flip-stat-label">Avg Hold</div><div class="flip-stat-val">${Math.round(avgDays)}d</div></div>
                <div class="flip-stat"><div class="flip-stat-label">Page Value</div><div class="flip-stat-val">${fmtK(totalGain)}</div></div>
                <div class="flip-stat"><div class="flip-stat-label">Page</div><div class="flip-stat-val">${data.page} / ${data.pages}</div></div>
            `;
        }

        // Table
        const html = `<table class="flip-table">
            <thead><tr>
                <th>Parcel ID</th><th>Buy Date</th><th>Sell Date</th>
                <th>Buy Price</th><th>Sell Price</th><th>Gain %</th>
                <th>Gain $</th><th>Hold Days</th><th>Buyer</th>
            </tr></thead>
            <tbody>${flips.map(f=>{
                const g = parseFloat(f.gain_pct)||0;
                const cls = g>=100?'gain-high':'gain-pos';
                return `<tr>
                    <td style="font-family:'Space Mono',monospace;font-size:11px">${escHtml(f.ParcelID)}</td>
                    <td style="color:var(--text-muted)">${String(f.buy_date||'').substring(0,10)}</td>
                    <td style="color:var(--text-muted)">${String(f.sell_date||'').substring(0,10)}</td>
                    <td>${fmtK(f.buy_price)}</td>
                    <td style="color:var(--green)">${fmtK(f.sell_price)}</td>
                    <td class="${cls}">+${g.toFixed(1)}%</td>
                    <td style="color:var(--amber)">${fmtK(f.gain_dollars)}</td>
                    <td style="font-family:'Space Mono',monospace">${f.hold_days}</td>
                    <td style="font-size:11px;max-width:150px;overflow:hidden;text-overflow:ellipsis">${escHtml(f.buyer||'—')}</td>
                </tr>`;
            }).join('')}</tbody>
        </table>`;
        document.getElementById('flipResults').innerHTML = html;

        renderFlipPagination(data.total, data.page, data.pages);

    } catch(e) {
        document.getElementById('flipResults').innerHTML =
            '<div class="loading-state" style="color:var(--red)">Failed to load flip data.</div>';
    }
}

function renderFlipPagination(total, page, pages) {
    const bar = document.getElementById('flipPagination');
    if(total===0){bar.style.display='none';return;}
    bar.style.display='flex';
    document.getElementById('flipPageInfo').textContent = `Page ${page} of ${pages} · ${fmtNum(total)} total pairs`;
    const ctrls = document.getElementById('flipPageControls');
    ctrls.innerHTML='';
    const addBtn=(label,p,active,disabled)=>{
        const btn=document.createElement('button');
        btn.className='page-btn'+(active?' active':'');
        btn.textContent=label; btn.disabled=!!disabled;
        btn.addEventListener('click',()=>{State.flipPage=p;loadFlips();window.scrollTo(0,0);});
        ctrls.appendChild(btn);
    };
    addBtn('‹',page-1,false,page===1);
    for(let p=Math.max(1,page-2);p<=Math.min(pages,page+2);p++) addBtn(p,p,p===page,false);
    addBtn('›',page+1,false,page===pages||pages===0);
}

// ── Owner Search ─────────────────────────────────────────────
async function loadOwners() {
    document.getElementById('ownerResults').innerHTML =
        '<div class="loading-state"><div class="spinner"></div><div>Searching owners…</div></div>';

    const params = new URLSearchParams({
        mode:'owners',
        search: document.getElementById('ownerSearch').value,
        state:  document.getElementById('ownerState').value,
        page:   State.ownerPage,
    });

    try {
        const res  = await fetch('api/data.php?'+params);
        const data = await res.json();
        if(!data.success) throw new Error();

        if(!data.owners||!data.owners.length){
            document.getElementById('ownerResults').innerHTML =
                '<div class="loading-state" style="color:var(--text-muted)">No owners found. Try a different search.</div>';
            return;
        }

        const html = `<div style="margin-bottom:12px;font-size:12px;color:var(--text-muted)">
            Showing ${data.owners.length} of ${fmtNum(data.total)} owners
        </div>
        <table class="owner-table">
            <thead><tr>
                <th>Owner Name</th><th>Parcel ID</th><th>Mailing Address</th>
                <th>City</th><th>State</th><th>Last Sale</th><th>Last Price</th>
            </tr></thead>
            <tbody>${data.owners.map(o=>{
                const isOOS = o.State && o.State !== 'FL';
                return `<tr>
                    <td style="font-weight:500">${escHtml(o.OwnerName)}</td>
                    <td style="font-family:'Space Mono',monospace;font-size:11px">${escHtml(o.ParcelID)}</td>
                    <td style="font-size:12px;color:var(--text-muted)">${escHtml(o.Address1||'')} ${escHtml(o.Address2||'')}</td>
                    <td>${escHtml(o.City||'—')}</td>
                    <td>${isOOS?`<span class="oos-badge">${escHtml(o.State)}</span>`:escHtml(o.State||'FL')}</td>
                    <td style="color:var(--text-muted);font-size:12px">${String(o.last_sale_date||'—').substring(0,10)}</td>
                    <td style="color:var(--amber)">${o.last_sale_price?fmtK(o.last_sale_price):'—'}</td>
                </tr>`;
            }).join('')}</tbody>
        </table>`;
        document.getElementById('ownerResults').innerHTML = html;

        renderOwnerPagination(data.total, data.page, data.pages);

    } catch(e) {
        document.getElementById('ownerResults').innerHTML =
            '<div class="loading-state" style="color:var(--red)">Failed to load owner data.</div>';
    }
}

function renderOwnerPagination(total, page, pages) {
    const bar = document.getElementById('ownerPagination');
    if(total===0){bar.style.display='none';return;}
    bar.style.display='flex';
    document.getElementById('ownerPageInfo').textContent = `Page ${page} of ${pages} · ${fmtNum(total)} total owners`;
    const ctrls = document.getElementById('ownerPageControls');
    ctrls.innerHTML='';
    const addBtn=(label,p,active,disabled)=>{
        const btn=document.createElement('button');
        btn.className='page-btn'+(active?' active':'');
        btn.textContent=label; btn.disabled=!!disabled;
        btn.addEventListener('click',()=>{State.ownerPage=p;loadOwners();window.scrollTo(0,0);});
        ctrls.appendChild(btn);
    };
    addBtn('‹',page-1,false,page===1);
    for(let p=Math.max(1,page-2);p<=Math.min(pages,page+2);p++) addBtn(p,p,p===page,false);
    addBtn('›',page+1,false,page===pages||pages===0);
}
