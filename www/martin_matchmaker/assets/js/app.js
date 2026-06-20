'use strict';

const State = {
    mode:'matches', city:'', tier:'', page:1, perPage:20,
    total:0, pages:0, buyerSearch:'', addressSearch:''
};
let searchTimer = null;

function fmtK(n){const v=parseFloat(n)||0;if(!v)return'—';if(v>=1e6)return'$'+(v/1e6).toFixed(1)+'M';return'$'+(v/1000).toFixed(0)+'K';}
function fmtNum(n){return Math.round(parseFloat(n)||0).toLocaleString();}
function escHtml(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function animateCount(el,target,fmt){
    if(!el)return;const steps=50,dur=700,delta=target/steps;let cur=0,cnt=0;
    const t=setInterval(()=>{cnt++;cur+=delta;const v=cnt>=steps?target:cur;
        el.textContent=fmt?fmt(v):Math.round(v).toLocaleString();if(cnt>=steps)clearInterval(t);},dur/steps);
}
function sellerScoreClass(s){return s>=80?'hot':s>=60?'warm':s>=40?'mod':'low';}
function buyerScoreClass(s){return s>=70?'bscore-70':s>=50?'bscore-50':'bscore-low';}

// ── Load Data ────────────────────────────────────────────────
async function loadData(){
    document.getElementById('contentArea').innerHTML =
        '<div class="loading-state"><div class="spinner"></div><div>Loading…</div></div>';

    const params = new URLSearchParams({
        mode:State.mode, city:State.city, tier:State.tier,
        page:State.page, per_page:State.perPage,
        buyer:State.buyerSearch,
        address:State.addressSearch,
    });

    try {
        const res  = await fetch('api/matchmaker.php?'+params);
        const data = await res.json();
        if(!data.success) throw new Error(data.error);

        State.total = data.total; State.pages = data.pages;

        // Update KPIs on first load
        if(data.summary){
            const s=data.summary;
            animateCount(document.getElementById('kpiSellers'),    parseInt(s.total_sellers)||0);
            animateCount(document.getElementById('kpiHotSellers'), parseInt(s.hot_sellers)||0);
            animateCount(document.getElementById('kpiBuyers'),     parseInt(s.total_buyers)||0);
            animateCount(document.getElementById('kpiHotBuyers'),  parseInt(s.hot_buyers)||0);
            animateCount(document.getElementById('kpiEntities'),   parseInt(s.entity_buyers)||0);
            animateCount(document.getElementById('kpiRecent'),     parseInt(s.recent_buyers)||0);
            document.getElementById('tagSellers').textContent = fmtNum(s.total_sellers)+' Motivated Sellers';
            document.getElementById('tagBuyers').textContent  = fmtNum(s.total_buyers)+' Active Buyers';
            document.getElementById('tagHotBuyers').textContent = fmtNum(s.hot_buyers)+' HOT Buyers';
        }

        // City tabs
        if(data.cities){
            const ct=document.getElementById('cityTabs');
            const allBtn=document.createElement('button');
            allBtn.className='city-tab'+(State.city===''?' active':'');
            allBtn.textContent='All Cities';
            allBtn.addEventListener('click',()=>{State.city='';State.page=1;
                ct.querySelectorAll('.city-tab').forEach(b=>b.classList.remove('active'));
                allBtn.classList.add('active');loadData();});
            ct.innerHTML=''; ct.appendChild(allBtn);
            data.cities.forEach(c=>{
                const b=document.createElement('button');
                b.className='city-tab'+(State.city===c.city?' active':'');
                b.innerHTML=escHtml(c.city)+' <span style="opacity:.5">('+c.sellers+')</span>';
                b.addEventListener('click',()=>{State.city=c.city;State.page=1;
                    ct.querySelectorAll('.city-tab').forEach(x=>x.classList.remove('active'));
                    b.classList.add('active');loadData();});
                ct.appendChild(b);
            });
        }

        document.getElementById('resultCount').innerHTML =
            `Showing <strong>${State.mode==='matches'?data.sellers?.length||0:data.buyers?.length||0}</strong> of <strong>${data.total.toLocaleString()}</strong>`;

        if(State.mode==='matches') renderMatches(data.sellers||[]);
        else renderBuyers(data.buyers||[]);

        renderPagination();

    } catch(e){
        console.error(e);
        document.getElementById('contentArea').innerHTML =
            '<div class="loading-state" style="color:var(--red-light)">⚠ Failed to load. Run populate scripts first.</div>';
    }
}

// ── Render Matched Pairs ─────────────────────────────────────
function renderMatches(sellers){
    if(!sellers.length){
        document.getElementById('contentArea').innerHTML =
            '<div class="loading-state" style="color:var(--text-muted)">No matches found for current filters.</div>';
        return;
    }
    const html = sellers.map(s=>{
        const sc     = sellerScoreClass(parseInt(s.seller_score));
        const price  = parseFloat(s.SalePrice||0);
        const jv     = parseFloat(s.JustValue||0);
        const prem   = parseFloat(s.PremiumPaid||0);
        const yrs    = ((parseInt(s.days_held)||0)/365).toFixed(1);
        const isInv  = s.Homestead==='N';
        const isLlc  = parseInt(s.is_llc_owner)===1;
        const buyers = s.matched_buyers||[];

        return `<div class="match-card">
            <div class="match-card-top ${sc}"></div>
            <div class="match-card-body">
                <div class="seller-side">
                    <div class="side-label seller-lbl">Motivated Seller</div>
                    <div class="seller-owner">${escHtml(s.CurrentOwner||'Unknown Owner')}</div>
                    <div class="seller-address" onclick="openSellerDetail(${s.id})">${escHtml(s.SiteAddress||'Unknown Address')}</div>
                    <div class="seller-city">${escHtml(s.SiteCity||'')} · ${escHtml(s.SiteZip||'')} · <span class="parcel-id">${escHtml(s.ParcelID||'')}</span></div>
                    <div class="seller-metrics">
                        <div class="s-metric"><div class="s-metric-label">Peak Price</div><div class="s-metric-val price">${fmtK(price)}</div></div>
                        <div class="s-metric"><div class="s-metric-label">Just Value</div><div class="s-metric-val">${jv>0?fmtK(jv):'—'}</div></div>
                        <div class="s-metric"><div class="s-metric-label">Premium</div><div class="s-metric-val ${prem>50?'price':prem>20?'':'green'}">${prem>0?'+'+prem.toFixed(0)+'%':'—'}</div></div>
                        <div class="s-metric"><div class="s-metric-label">Hold</div><div class="s-metric-val">${yrs}yr</div></div>
                    </div>
                    <span class="seller-score-badge ${sc}">Score ${s.seller_score} · ${sc.toUpperCase()}</span>
                    <div class="seller-tags">
                        <span class="stag ${isInv?'investor':'owner'}">${isInv?'INVESTOR':'OWNER-OCC'}</span>
                        ${isLlc?'<span class="stag llc">LLC</span>':''}
                        <span class="stag owner">${escHtml(s.price_tier||'')}</span>
                    </div>
                </div>

                <div class="match-arrow">
                    <div class="arrow-icon">⟷</div>
                    <div class="match-count-badge"><strong>${buyers.length}</strong>Matches</div>
                </div>

                <div class="buyer-side">
                    <div class="side-label buyer-lbl">Likely Buyers</div>
                    <div class="buyer-matches">
                        ${buyers.length ? buyers.map(b=>{
                            const ms = parseInt(b.match_score)||0;
                            const isEnt = parseInt(b.IsEntity)===1;
                            const daysAgo = b.LastBuy ? Math.round((Date.now()-new Date(b.LastBuy))/86400000) : 999;
                            return `<div class="buyer-match-row" onclick="openBuyerDetail('${escHtml(b.BuyerName)}')">
                                <div class="buyer-match-score">${ms}</div>
                                <div class="buyer-match-info">
                                    <div class="buyer-match-name">${escHtml(b.BuyerName)}</div>
                                    <div class="buyer-match-meta">
                                        <span>${escHtml(b.PrimaryCity||'')}</span>
                                        <span>${fmtK(b.AvgPrice)} avg</span>
                                        <span>${b.PurchasesSince2020} buys</span>
                                    </div>
                                </div>
                                <div class="buyer-match-badges">
                                    ${isEnt?'<span class="b-badge entity">LLC</span>':''}
                                    ${daysAgo<=180?'<span class="b-badge active">Active</span>':''}
                                    ${b.MailState&&b.MailState!=='FL'?'<span class="b-badge outstate">'+escHtml(b.MailState)+'</span>':''}
                                </div>
                            </div>`;
                        }).join('') : '<div class="no-buyers">No buyers matched in this market segment</div>'}
                    </div>
                </div>
            </div>
        </div>`;
    }).join('');

    document.getElementById('contentArea').innerHTML = `<div class="match-list">${html}</div>`;
}

// ── Render Buyer Profiles ────────────────────────────────────
function renderBuyers(buyers){
    if(!buyers.length){
        document.getElementById('contentArea').innerHTML =
            '<div class="loading-state" style="color:var(--text-muted)">No buyer profiles found.</div>';
        return;
    }
    const html = buyers.map(b=>{
        const sc     = buyerScoreClass(parseInt(b.BuyScore));
        const isEnt  = parseInt(b.IsEntity)===1;
        const daysAgo= b.LastBuy ? Math.round((Date.now()-new Date(b.LastBuy))/86400000) : 999;
        const isActive= daysAgo<=180;

        return `<div class="buyer-card ${sc}">
            <div class="buyer-card-heat"></div>
            <div class="buyer-card-header">
                <div class="buyer-name-wrap">
                    <div class="buyer-name">${escHtml(b.BuyerName)}</div>
                    <div class="buyer-sub">${escHtml(b.PrimaryCity||'—')} · ${escHtml(b.PriceTier||'—')}</div>
                </div>
                <div class="buy-score-badge">
                    <div class="buy-score-num">${b.BuyScore}</div>
                    <div class="buy-score-lbl">Buy Score</div>
                </div>
            </div>
            <div class="buyer-card-body">
                <div class="buyer-badges">
                    ${isEnt?'<span class="b-badge entity">LLC/Entity</span>':''}
                    ${isActive?'<span class="b-badge active">Active &lt;6mo</span>':''}
                    ${b.MailState&&b.MailState!=='FL'?'<span class="b-badge outstate">Out-of-State ('+escHtml(b.MailState)+')</span>':''}
                </div>
                <div class="buyer-metrics">
                    <div class="b-metric"><div class="b-metric-label">Purchases</div><div class="b-metric-val martin">${b.PurchasesSince2020}</div></div>
                    <div class="b-metric"><div class="b-metric-label">Avg Price</div><div class="b-metric-val amber">${fmtK(b.AvgPrice)}</div></div>
                    <div class="b-metric"><div class="b-metric-label">Last Buy</div><div class="b-metric-val">${String(b.LastBuy||'').substring(0,7)}</div></div>
                    <div class="b-metric"><div class="b-metric-label">Min Price</div><div class="b-metric-val">${fmtK(b.MinPrice)}</div></div>
                    <div class="b-metric"><div class="b-metric-label">Max Price</div><div class="b-metric-val">${fmtK(b.MaxPrice)}</div></div>
                    <div class="b-metric"><div class="b-metric-label">Cities</div><div class="b-metric-val">${b.CitiesCount}</div></div>
                </div>
                ${b.Cities?`<div class="buyer-cities">📍 ${escHtml(b.Cities)}</div>`:''}
                ${b.ScoreReasons?`<div class="buyer-reasons">${escHtml(b.ScoreReasons)}</div>`:''}
                ${b.RecentProperties?`<div class="buyer-recent">Recent: ${escHtml(b.RecentProperties)}</div>`:''}
            </div>
        </div>`;
    }).join('');

    document.getElementById('contentArea').innerHTML = `<div class="buyer-grid">${html}</div>`;
}

// ── Seller Detail Modal ──────────────────────────────────────
async function openSellerDetail(sellerId){
    const overlay = document.getElementById('modalOverlay');
    document.getElementById('modalTitle').textContent = 'Property & Buyer Match Detail';
    document.getElementById('modalBody').innerHTML =
        '<div class="loading-state"><div class="spinner" style="margin:0 auto"></div></div>';
    overlay.classList.add('open');

    try {
        const res  = await fetch('api/matchmaker.php?mode=seller_detail&seller_id='+sellerId);
        const data = await res.json();
        if(!data.success) throw new Error();

        const s = data.seller, p = data.parcel||{}, buyers = data.buyers||[];

        const parcelHtml = `<div class="modal-parcel-card">
            ${[
                ['Parcel ID',   p.ParcelID||s.ParcelID,  'mono'],
                ['Address',     s.SiteAddress||'—',       ''],
                ['City',        s.SiteCity||'—',          ''],
                ['Land Use',    p.LandUseCodeDescription||'—', ''],
                ['Year Built',  p.YearBuilt||'—',         'mono'],
                ['Beds/Baths',  p.Beds&&p.Baths?p.Beds+'bd / '+p.Baths+'ba':'—', ''],
                ['Sq Ft',       p.TotalFinishedArea?parseInt(p.TotalFinishedArea).toLocaleString()+' sf':'—', 'mono'],
                ['Peak Price',  fmtK(s.SalePrice),        'green'],
                ['Just Value',  fmtK(s.JustValue),        'martin'],
                ['Premium',     s.PremiumPaid?'+'+parseFloat(s.PremiumPaid).toFixed(0)+'%':'—', ''],
                ['Hold Period', ((parseInt(s.days_held)||0)/365).toFixed(1)+'yr', 'mono'],
                ['Seller Score',s.seller_score+' / '+s.seller_score>=80?'HOT':s.seller_score>=60?'WARM':'MOD', ''],
            ].map(([lbl,val,cls])=>`
                <div class="modal-field">
                    <div class="modal-field-label">${escHtml(lbl)}</div>
                    <div class="modal-field-value ${cls}">${escHtml(String(val))}</div>
                </div>`).join('')}
        </div>`;

        const buyersHtml = buyers.length ? buyers.map((b,i)=>{
            const ms = parseInt(b.match_score)||0;
            const pct = Math.min(ms, 100);
            return `<div class="modal-buyer-row">
                <div class="modal-buyer-rank">${i+1}</div>
                <div class="modal-buyer-score">${ms}</div>
                <div class="modal-buyer-info">
                    <div class="modal-buyer-name">${escHtml(b.BuyerName)}</div>
                    <div class="modal-buyer-detail">
                        <span>📍 ${escHtml(b.PrimaryCity||'—')}</span>
                        <span>💰 ${fmtK(b.AvgPrice)} avg</span>
                        <span>🏠 ${b.PurchasesSince2020} purchases</span>
                        <span>📅 Last buy: ${String(b.LastBuy||'').substring(0,7)}</span>
                        ${b.IsEntity?'<span>🏢 Entity/LLC</span>':''}
                        ${b.MailState&&b.MailState!=='FL'?'<span>✈️ Out-of-state ('+escHtml(b.MailState)+')</span>':''}
                    </div>
                    ${b.Cities?`<div style="font-size:10px;color:var(--text-muted);margin-top:3px">Active in: ${escHtml(b.Cities)}</div>`:''}
                    <div class="modal-match-bar"><div class="modal-match-bar-fill" style="width:${pct}%"></div></div>
                </div>
            </div>`;
        }).join('') : '<p style="color:var(--text-muted);text-align:center;padding:20px">No buyer matches found for this property.</p>';

        document.getElementById('modalBody').innerHTML =
            parcelHtml +
            '<div class="modal-section-title">Top Buyer Matches — Scored by Geographic + Price Fit</div>' +
            buyersHtml;

    } catch(e){
        document.getElementById('modalBody').innerHTML =
            '<p style="color:var(--red-light);text-align:center;padding:32px">Failed to load detail.</p>';
    }
}

function openBuyerDetail(buyerName){
    // Switch to buyers mode and search for this buyer
    State.mode = 'buyers';
    State.buyerSearch = buyerName;
    State.page = 1;
    document.querySelectorAll('.mode-btn').forEach(b=>{
        b.classList.toggle('active', b.dataset.mode==='buyers');
    });
    const bs = document.getElementById('buyerSearch');
    if(bs){ bs.style.display=''; bs.value=buyerName; }
    loadData();
}

// ── Pagination ───────────────────────────────────────────────
function renderPagination(){
    const bar=document.getElementById('paginationBar');
    if(State.total===0){bar.style.display='none';return;}
    bar.style.display='flex';
    document.getElementById('pageInfo').textContent=`Page ${State.page} of ${State.pages}`;
    const ctrls=document.getElementById('pageControls');
    ctrls.innerHTML='';
    const addBtn=(label,p,active,disabled)=>{
        const btn=document.createElement('button');
        btn.className='page-btn'+(active?' active':'');
        btn.textContent=label; btn.disabled=!!disabled;
        btn.addEventListener('click',()=>{State.page=p;loadData();window.scrollTo(0,0);});
        ctrls.appendChild(btn);
    };
    const ell=()=>{const s=document.createElement('span');s.className='page-ellipsis';s.textContent='…';ctrls.appendChild(s);};
    addBtn('‹',State.page-1,false,State.page===1);
    let shown=new Set([1,State.pages]);
    for(let p=Math.max(1,State.page-2);p<=Math.min(State.pages,State.page+2);p++)shown.add(p);
    let prev=null;
    [...shown].sort((a,b)=>a-b).forEach(p=>{if(prev!==null&&p-prev>1)ell();addBtn(p,p,p===State.page,false);prev=p;});
    addBtn('›',State.page+1,false,State.page===State.pages||State.pages===0);
}

// ── Event Listeners ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded',()=>{
    // Mode buttons
    document.querySelectorAll('.mode-btn').forEach(btn=>{
        btn.addEventListener('click',()=>{
            document.querySelectorAll('.mode-btn').forEach(b=>b.classList.remove('active'));
            btn.classList.add('active');
            State.mode=btn.dataset.mode; State.page=1;
            const bs=document.getElementById('buyerSearch');
            if(bs) bs.style.display=State.mode==='buyers'?'':'none';
            loadData();
        });
    });

    // Tier tabs
    document.querySelectorAll('.score-tab[data-tier]').forEach(tab=>{
        tab.addEventListener('click',()=>{
            document.querySelectorAll('.score-tab[data-tier]').forEach(t=>t.classList.remove('active'));
            tab.classList.add('active'); State.tier=tab.dataset.tier; State.page=1; loadData();
        });
    });

    // Address search
    document.getElementById('addressSearch').addEventListener('input',function(){
        clearTimeout(searchTimer);
        searchTimer=setTimeout(()=>{State.addressSearch=this.value.trim();State.page=1;loadData();},350);
    });

    // Buyer search
    document.getElementById('buyerSearch').addEventListener('input',function(){
        clearTimeout(searchTimer);
        searchTimer=setTimeout(()=>{State.buyerSearch=this.value.trim();State.page=1;loadData();},350);
    });

    // Export
    document.getElementById('exportBtn').addEventListener('click',function(e){
        e.preventDefault();
        window.location.href=`api/export.php?mode=${State.mode}&city=${encodeURIComponent(State.city)}&tier=${encodeURIComponent(State.tier)}`;
    });

    // Modal close
    document.getElementById('modalClose').addEventListener('click',()=>document.getElementById('modalOverlay').classList.remove('open'));
    document.getElementById('modalOverlay').addEventListener('click',e=>{if(e.target===document.getElementById('modalOverlay'))document.getElementById('modalOverlay').classList.remove('open');});
    document.addEventListener('keydown',e=>{if(e.key==='Escape')document.getElementById('modalOverlay').classList.remove('open');});

    // Timestamp
    const ts=document.getElementById('timestamp');
    function tick(){if(ts)ts.textContent=new Date().toLocaleTimeString('en-US',{hour12:false,hour:'2-digit',minute:'2-digit',second:'2-digit'});}
    tick(); setInterval(tick,1000);

    loadData();
});
