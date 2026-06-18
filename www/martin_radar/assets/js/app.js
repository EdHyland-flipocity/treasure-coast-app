'use strict';

const State = {
    scoreMin:0, scoreMax:100, hs:'', tier:'', yr:'', city:'', search:'',
    sort:'score', dir:'DESC', page:1, perPage:25, total:0, pages:0
};
let searchTimer = null;

function fmtK(n){
    const v=parseFloat(n)||0; if(!v) return '—';
    if(v>=1000000) return '$'+(v/1000000).toFixed(1)+'M';
    return '$'+(v/1000).toFixed(0)+'K';
}
function fmtNum(n){ return Math.round(parseFloat(n)||0).toLocaleString(); }
function escHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function animateCount(el,target,fmt){
    if(!el) return;
    const steps=50,dur=700,delta=target/steps;
    let cur=0,cnt=0;
    const t=setInterval(()=>{
        cnt++; cur+=delta;
        const v=cnt>=steps?target:cur;
        el.textContent=fmt?fmt(v):Math.round(v).toLocaleString();
        if(cnt>=steps) clearInterval(t);
    },dur/steps);
}
function scoreClass(s){ return s>=80?'score-hot':s>=60?'score-warm':s>=40?'score-mod':'score-low'; }
function scoreLabel(s){ return s>=80?'HOT':s>=60?'WARM':s>=40?'MOD':'LOW'; }

function buildActionScript(r){
    const price = parseFloat(r.SalePrice||0);
    const jv    = parseFloat(r.JustValue||0);
    const yrs   = ((parseInt(r.days_held)||0)/365).toFixed(1);
    const yr    = r.yr_bought;
    const hs    = r.Homestead==='Y';
    const prem  = parseFloat(r.PremiumPaid||0);

    if(!hs && prem>50){
        return `<strong>Why they might sell:</strong> Bought at ${fmtK(price)} in ${yr} — county currently assesses at ${fmtK(jv)}. After ${yrs} years of carrying costs with no resale, the original return thesis no longer works at current rates.`;
    } else if(!hs){
        return `<strong>Why they might sell:</strong> Non-homestead investor holding since ${yr} — ${yrs} years of property taxes, insurance, and opportunity cost without a primary residence exemption.`;
    }
    return `<strong>Context:</strong> Owner-occupied, bought in ${yr}. May be motivated by life event, upgrade, or downsizing after ${yrs} years.`;
}

async function loadData(){
    document.getElementById('propertyGrid').innerHTML =
        '<div class="loading-state"><div class="spinner"></div><div>Loading…</div></div>';

    const params = new URLSearchParams({
        score_min:State.scoreMin, score_max:State.scoreMax,
        hs:State.hs, tier:State.tier, yr:State.yr,
        city:State.city, search:State.search,
        sort:State.sort, dir:State.dir,
        page:State.page, per_page:State.perPage
    });

    try {
        const res  = await fetch('api/radar.php?'+params);
        const data = await res.json();
        if(!data.success) throw new Error(data.error);

        State.total=data.total; State.pages=data.pages;

        const s=data.summary;
        animateCount(document.getElementById('kpiHot'),     parseInt(s.hot)||0);
        animateCount(document.getElementById('kpiWarm'),    parseInt(s.warm)||0);
        animateCount(document.getElementById('kpiTotal'),   parseInt(s.total)||0);
        animateCount(document.getElementById('kpiInv'),     parseInt(s.investors)||0);
        animateCount(document.getElementById('kpiAvgPrice'),parseFloat(s.avg_peak_price)||0, v=>fmtK(v));
        animateCount(document.getElementById('kpiHold'),    parseFloat(s.avg_yrs_held)||0,   v=>parseFloat(v).toFixed(1)+'yr');
        animateCount(document.getElementById('kpiPremium'), parseFloat(s.avg_premium)||0,    v=>'+'+Math.round(v)+'%');
        animateCount(document.getElementById('kpiJust'),    parseFloat(s.avg_just)||0,       v=>fmtK(v));

        document.getElementById('tagTotal').textContent = fmtNum(s.total)+' Candidates';
        document.getElementById('tagHot').textContent   = fmtNum(s.hot)+' HOT (80+)';
        document.getElementById('tagWarm').textContent  = fmtNum(s.warm)+' WARM (60-79)';

        document.getElementById('resultCount').innerHTML =
            `Showing <strong>${data.records.length}</strong> of <strong>${data.total.toLocaleString()}</strong>`;

        // City tabs
        if(data.cities && data.cities.length){
            const ct=document.getElementById('cityTabs');
            const allBtn=document.createElement('button');
            allBtn.className='city-tab'+(State.city===''?' active':'');
            allBtn.textContent='All Cities';
            allBtn.addEventListener('click',()=>{
                State.city=''; State.page=1;
                ct.querySelectorAll('.city-tab').forEach(b=>b.classList.remove('active'));
                allBtn.classList.add('active'); loadData();
            });
            ct.innerHTML=''; ct.appendChild(allBtn);
            data.cities.forEach(c=>{
                const b=document.createElement('button');
                b.className='city-tab'+(State.city===c.city?' active':'');
                b.textContent=c.city+' ('+c.hot_warm+')';
                b.addEventListener('click',()=>{
                    State.city=c.city; State.page=1;
                    ct.querySelectorAll('.city-tab').forEach(x=>x.classList.remove('active'));
                    b.classList.add('active'); loadData();
                });
                ct.appendChild(b);
            });
        }

        renderCards(data.records);
        renderPagination();

    } catch(e){
        console.error(e);
        document.getElementById('propertyGrid').innerHTML =
            '<div class="loading-state" style="color:var(--red-light)">⚠ Failed to load data. Run the population script first.</div>';
    }
}

function renderCards(records){
    const grid=document.getElementById('propertyGrid');
    if(!records||!records.length){
        grid.innerHTML='<div class="loading-state" style="color:var(--text-muted);grid-column:1/-1">No properties match your filters</div>';
        return;
    }
    grid.innerHTML=records.map(r=>{
        const score  =parseInt(r.score)||0;
        const sc     =scoreClass(score);
        const sl     =scoreLabel(score);
        const price  =parseFloat(r.SalePrice||0);
        const jv     =parseFloat(r.JustValue||0);
        const prem   =parseFloat(r.PremiumPaid||0);
        const yrs    =((parseInt(r.days_held)||0)/365).toFixed(1);
        const isLlc  =parseInt(r.is_llc_owner)===1;
        const isInv  =r.Homestead==='N';
        // Martin uses SiteAddress (full) not SiteNum+SiteStreet
        const addr   =r.SiteAddress||'Address Unknown';
        const mailAddr=[r.MailStreet,r.MailCity,r.MailState,r.MailZip].filter(Boolean).join(', ');
        const beds   =r.Bedrooms?r.Bedrooms+'bd':'—';
        const premColor=prem>100?'red':prem>30?'amber':'green';
        const priceColor=price>800000?'red':price>500000?'amber':'green';

        return `<div class="prop-card ${sc}">
            <div class="prop-card-heat"></div>
            <div class="prop-card-header">
                <div class="prop-address">
                    <div class="prop-street">${escHtml(addr.substring(0,60))}</div>
                    <div class="prop-city">${escHtml(r.SiteCity||'')} · ${escHtml(r.SiteZip||'')}</div>
                </div>
                <div class="score-badge">
                    <div class="score-num">${score}</div>
                    <div class="score-label">${sl}</div>
                </div>
            </div>
            <div class="prop-card-body">
                <div class="prop-owner">
                    <span>${escHtml((r.CurrentOwner||'Unknown Owner').substring(0,50))}</span>
                    ${isLlc?'<span class="llc-badge">LLC</span>':''}
                    <span class="hx-badge ${isInv?'investor':'owner'}">${isInv?'INVESTOR':'OWNER-OCC'}</span>
                </div>
                <div class="prop-metrics">
                    <div class="metric">
                        <div class="metric-label">Peak Price</div>
                        <div class="metric-val ${priceColor}">${fmtK(price)}</div>
                    </div>
                    <div class="metric">
                        <div class="metric-label">Just Value</div>
                        <div class="metric-val">${jv>0?fmtK(jv):'—'}</div>
                    </div>
                    <div class="metric">
                        <div class="metric-label">Premium</div>
                        <div class="metric-val ${premColor}">${prem>0?'+'+prem.toFixed(0)+'%':'—'}</div>
                    </div>
                    <div class="metric">
                        <div class="metric-label">Hold Period</div>
                        <div class="metric-val">${yrs}yr</div>
                    </div>
                    <div class="metric">
                        <div class="metric-label">Bought</div>
                        <div class="metric-val">${String(r.SaleDate||'').substring(0,7)}</div>
                    </div>
                    <div class="metric">
                        <div class="metric-label">Beds</div>
                        <div class="metric-val">${beds}</div>
                    </div>
                </div>
                <div class="prop-reasons">${escHtml(r.score_reasons||'')}</div>
            </div>
            <div class="prop-action">
                ${buildActionScript(r)}
                ${mailAddr?`<div class="prop-mail-addr">📮 ${escHtml(mailAddr)}</div>`:''}
            </div>
        </div>`;
    }).join('');
}

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
    for(let p=Math.max(1,State.page-2);p<=Math.min(State.pages,State.page+2);p++) shown.add(p);
    let prev=null;
    [...shown].sort((a,b)=>a-b).forEach(p=>{if(prev!==null&&p-prev>1)ell();addBtn(p,p,p===State.page,false);prev=p;});
    addBtn('›',State.page+1,false,State.page===State.pages||State.pages===0);
}

function buildExportUrl(){
    return `api/export.php?score_min=${State.scoreMin}&score_max=${State.scoreMax}`+
        `&hs=${encodeURIComponent(State.hs)}&tier=${encodeURIComponent(State.tier)}`+
        `&city=${encodeURIComponent(State.city)}`;
}

document.addEventListener('DOMContentLoaded',()=>{
    document.querySelectorAll('.score-tab[data-min]').forEach(tab=>{
        tab.addEventListener('click',()=>{
            document.querySelectorAll('.score-tab[data-min]').forEach(t=>t.classList.remove('active'));
            tab.classList.add('active');
            State.scoreMin=parseInt(tab.dataset.min); State.scoreMax=parseInt(tab.dataset.max);
            State.page=1; loadData();
        });
    });
    document.querySelectorAll('.score-tab[data-hs]').forEach(tab=>{
        tab.addEventListener('click',()=>{
            document.querySelectorAll('.score-tab[data-hs]').forEach(t=>t.classList.remove('active'));
            tab.classList.add('active'); State.hs=tab.dataset.hs; State.page=1; loadData();
        });
    });
    document.querySelectorAll('.score-tab[data-tier]').forEach(tab=>{
        tab.addEventListener('click',()=>{
            document.querySelectorAll('.score-tab[data-tier]').forEach(t=>t.classList.remove('active'));
            tab.classList.add('active'); State.tier=tab.dataset.tier; State.page=1; loadData();
        });
    });
    document.querySelectorAll('.score-tab[data-yr]').forEach(tab=>{
        tab.addEventListener('click',()=>{
            document.querySelectorAll('.score-tab[data-yr]').forEach(t=>t.classList.remove('active'));
            tab.classList.add('active'); State.yr=tab.dataset.yr; State.page=1; loadData();
        });
    });
    document.getElementById('sortSelect').addEventListener('change',function(){
        State.sort=this.value; State.page=1; loadData();
    });
    document.getElementById('searchInput').addEventListener('input',function(){
        clearTimeout(searchTimer);
        searchTimer=setTimeout(()=>{State.search=this.value.trim();State.page=1;loadData();},350);
    });
    document.getElementById('exportBtn').addEventListener('click',function(e){
        e.preventDefault(); window.location.href=buildExportUrl();
    });
    const ts=document.getElementById('timestamp');
    function tick(){if(ts)ts.textContent=new Date().toLocaleTimeString('en-US',{hour12:false,hour:'2-digit',minute:'2-digit',second:'2-digit'});}
    tick(); setInterval(tick,1000);
    loadData();
});
