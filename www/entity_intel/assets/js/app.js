'use strict';
Chart.defaults.color='#5C7088';Chart.defaults.borderColor='#1B2D4F';
Chart.defaults.font.family="'Montserrat',system-ui,sans-serif";Chart.defaults.font.size=11;

const C={
  coral:'#E8506A',coralL:'#F57E94',coralA:'rgba(232,80,106,0.7)',
  cyan:'#06B6D4',cyanL:'#67E8F9',cyanA:'rgba(6,182,212,0.7)',
  teal:'#2ABFB0',tealL:'#5ED8CC',tealA:'rgba(42,191,176,0.7)',
  violet:'#8B5CF6',violetL:'#A78BFA',
  amber:'#E8823A',amberL:'#F5A96B',
  gold:'#C9A84C',goldL:'#E8C97E',
};
const TT={backgroundColor:'#111D33',borderColor:'#1B2D4F',borderWidth:1,padding:10,
  titleFont:{size:12,weight:'600'},bodyFont:{size:11}};

const State={type:'',counties:'',search:'',sort:'total_txn',dir:'DESC',page:1,perPage:50,total:0,pages:0};
let timelineChart=null;
let searchTimer=null;

function fmtM(n){const v=parseFloat(n)||0;if(!v)return'—';
  if(Math.abs(v)>=1000)return'$'+(v/1000).toFixed(1)+'B';
  return'$'+parseFloat(v).toFixed(1)+'M';}
function fmtNum(n){return Math.round(parseFloat(n)||0).toLocaleString();}
function fmtAvg(n){const v=parseInt(n)||0;if(!v)return'—';
  if(v>=1000000)return'$'+(v/1000000).toFixed(1)+'M';
  return'$'+(v/1000).toFixed(0)+'K';}
function fmtDate(d){if(!d)return'—';return d.substring(0,4);}
function typeClass(t){
  return t==='Builder'?'Builder':t==='iBuyer'?'iBuyer':
    t==='SFR Operator'?'SFR':t==='Bank/GSE'?'BankGSE':
    t==='Government'?'Government':t==='LLC/Corporation'?'LLC':'Other';
}
function typeBadge(t){const c=typeClass(t);return`<span class="entity-type-badge badge-${c}">${t}</span>`;}
function animateCount(el,target,fmt){
  if(!el)return;
  const steps=50,dur=700,delta=target/steps;
  let cur=0,cnt=0;
  const timer=setInterval(()=>{
    cnt++;cur+=delta;
    const v=cnt>=steps?target:cur;
    el.textContent=fmt?fmt(v):Math.round(v).toLocaleString();
    if(cnt>=steps)clearInterval(timer);
  },dur/steps);
}

// ── Data loading ────────────────────────────────────────────────
async function loadEntities(){
  document.getElementById('entityGrid').innerHTML=
    '<div class="loading-state"><div class="spinner"></div><div>Loading entities…</div></div>';

  const params=new URLSearchParams({
    type:State.type,counties:State.counties,search:State.search,
    sort:State.sort,dir:State.dir,page:State.page,per_page:State.perPage
  });

  try{
    const res=await fetch('api/entities.php?'+params);
    const d=await res.json();
    if(!d.success)throw new Error(d.error);

    State.total=d.total;State.pages=d.pages;

    // KPIs from summary
    const s=d.summary;
    animateCount(document.getElementById('kpiTotal'),parseInt(s.total_entities)||0);
    animateCount(document.getElementById('kpiMulti'),parseInt(s.multi_county)||0);
    animateCount(document.getElementById('kpiTri'),parseInt(s.tri_county)||0);
    animateCount(document.getElementById('kpiTxn'),parseInt(s.total_transactions)||0);
    animateCount(document.getElementById('kpiVol'),parseFloat(s.total_volume_b)||0,v=>fmtM(v));

    // Type counts
    let builders=0,ibuyers=0,sfr=0;
    d.type_counts.forEach(r=>{
      if(r.entity_type==='Builder')builders=r.cnt;
      if(r.entity_type==='iBuyer')ibuyers=r.cnt;
      if(r.entity_type==='SFR Operator')sfr=r.cnt;
    });
    animateCount(document.getElementById('kpiBuilders'),builders);
    animateCount(document.getElementById('kpiIbuyers'),ibuyers);
    animateCount(document.getElementById('kpiSfr'),sfr);

    // Result count
    document.getElementById('resultCount').innerHTML=
      `Showing <strong>${d.records.length}</strong> of <strong>${d.total.toLocaleString()}</strong> entities`;

    renderEntities(d.records);
    renderPagination();

  }catch(e){
    console.error(e);
    document.getElementById('entityGrid').innerHTML=
      '<div class="loading-state" style="color:var(--red-light)">⚠ Failed to load entities</div>';
  }
}

// ── Render entity rows ──────────────────────────────────────────
function renderEntities(records){
  const grid=document.getElementById('entityGrid');
  if(!records||!records.length){
    grid.innerHTML='<div class="loading-state" style="color:var(--text-muted)">No entities match your filters</div>';
    return;
  }

  const offset=(State.page-1)*State.perPage;
  grid.innerHTML=records.map((r,i)=>{
    const tc=typeClass(r.entity_type);
    const hasSara=parseInt(r.sara_txn)>0;
    const hasMana=parseInt(r.mana_txn)>0;
    const hasStlu=parseInt(r.stlu_txn)>0;
    const hasLee=parseInt(r.lee_txn||0)>0;
    const hasBrev=parseInt(r.brev_txn||0)>0;
    const hasPin=parseInt(r.pin_parcels||0)>0;

    const saraPill=hasSara
      ?`<div class="county-pill sara">
          <span class="pill-county">Sarasota</span>
          <span class="pill-count">${fmtNum(r.sara_txn)}</span>
          <span class="pill-label">transactions</span>
        </div>`
      :`<div class="county-pill empty">
          <span class="pill-county">Sarasota</span>
          <span class="pill-count">—</span>
          <span class="pill-label">not active</span>
        </div>`;

    const manaPill=hasMana
      ?`<div class="county-pill mana">
          <span class="pill-county">Manatee</span>
          <span class="pill-count">${fmtNum(r.mana_txn)}</span>
          <span class="pill-label">transactions</span>
        </div>`
      :`<div class="county-pill empty">
          <span class="pill-county">Manatee</span>
          <span class="pill-count">—</span>
          <span class="pill-label">not active</span>
        </div>`;

    const stluPill=hasStlu
      ?`<div class="county-pill stlu">
          <span class="pill-county">St. Lucie</span>
          <span class="pill-count">${fmtNum(r.stlu_txn)}</span>
          <span class="pill-label">transactions</span>
        </div>`
      :`<div class="county-pill empty">
          <span class="pill-county">St. Lucie</span>
          <span class="pill-count">—</span>
          <span class="pill-label">not active</span>
        </div>`;

    const dateRange=`${fmtDate(r.first_seen)} – ${fmtDate(r.last_seen)}`;

    const brevPill=hasBrev?`<div class="county-pill brev"><span class="pill-county">Brevard</span><span class="pill-count">${fmtNum(r.brev_txn)}</span><span class="pill-label">transactions</span></div>`:`<div class="county-pill empty"><span class="pill-county">Brevard</span><span class="pill-count">—</span><span class="pill-label">not active</span></div>`;
    const leePill=hasLee?`<div class="county-pill lee"><span class="pill-county">Lee</span><span class="pill-count">${fmtNum(r.lee_txn)}</span><span class="pill-label">transactions</span></div>`:`<div class="county-pill empty"><span class="pill-county">Lee</span><span class="pill-count">—</span><span class="pill-label">not active</span></div>`;
    const pinPill=hasPin?`<div class="county-pill pin"><span class="pill-county">Pinellas</span><span class="pill-count">${fmtNum(r.pin_parcels)}</span><span class="pill-label">parcels</span></div>`:`<div class="county-pill empty"><span class="pill-county">Pinellas</span><span class="pill-count">—</span><span class="pill-label">not active</span></div>`;
    return `<div class="entity-row type-${tc}"  data-canonical="${escAttr(r.canonical_name)}">
      <div class="entity-rank">#${offset+i+1}</div>
      <div class="entity-main">
        <div class="entity-name">${escHtml(r.display_name)}</div>
        <div class="entity-meta">
          ${typeBadge(r.entity_type)}
          <span class="entity-dates">${dateRange}</span>
          ${parseInt(r.county_count)>=2?`<span style="font-size:9px;font-weight:600;letter-spacing:.12em;color:var(--amber);text-transform:uppercase">${r.county_count} counties</span>`:''}
        </div>
      </div>
      <div class="county-pills">${saraPill}${manaPill}${stluPill}${leePill}${brevPill}${pinPill}</div>
      <div class="entity-totals">
        <div class="entity-total-txn">${fmtNum(r.total_txn)}</div>
        <div class="entity-total-vol">${fmtM(r.total_vol_m)} volume</div>
        <div class="entity-total-avg">avg ${fmtAvg(r.overall_avg)}</div>
      </div>
      <div class="entity-arrow">›</div>
    </div>`;
  }).join('');

  // Attach click handlers
  grid.querySelectorAll('.entity-row').forEach(row=>{
    row.addEventListener('click',()=>openModal(row.dataset.canonical));
  });
}

// ── Pagination ──────────────────────────────────────────────────
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
    btn.textContent=label;btn.disabled=!!disabled;
    btn.addEventListener('click',()=>{State.page=p;loadEntities();window.scrollTo(0,0);});
    ctrls.appendChild(btn);
  };
  const ellipsis=()=>{const s=document.createElement('span');s.className='page-ellipsis';s.textContent='…';ctrls.appendChild(s);};

  addBtn('‹',State.page-1,false,State.page===1);
  let shown=new Set([1,State.pages]);
  for(let p=Math.max(1,State.page-2);p<=Math.min(State.pages,State.page+2);p++)shown.add(p);
  let prev=null;
  [...shown].sort((a,b)=>a-b).forEach(p=>{
    if(prev!==null&&p-prev>1)ellipsis();
    addBtn(p,p,p===State.page,false);prev=p;
  });
  addBtn('›',State.page+1,false,State.page===State.pages||State.pages===0);
}

// ── Modal ───────────────────────────────────────────────────────
async function openModal(canonical){
  const overlay=document.getElementById('modalOverlay');
  overlay.classList.add('open');
  document.getElementById('modalName').textContent='Loading…';
  document.getElementById('modalType').textContent='';
  document.getElementById('modalCountyDots').innerHTML='';
  document.getElementById('modalCountyCards').innerHTML='';
  document.getElementById('modalInsight').innerHTML='';
  if(timelineChart){timelineChart.destroy();timelineChart=null;}

  try{
    const res=await fetch('api/timeline.php?entity='+encodeURIComponent(canonical));
    const d=await res.json();
    if(!d.success)throw new Error(d.error);

    const e=d.entity;
    document.getElementById('modalType').textContent=e.entity_type;
    document.getElementById('modalName').textContent=e.display_name;

    // County dots
    const dots=[];
    if(parseInt(e.sara_txn)>0)dots.push(`<div class="modal-county-dot sara">Sarasota · ${fmtNum(e.sara_txn)} txn</div>`);
    if(parseInt(e.mana_txn)>0)dots.push(`<div class="modal-county-dot mana">Manatee · ${fmtNum(e.mana_txn)} txn</div>`);
    if(parseInt(e.stlu_txn)>0)dots.push(`<div class="modal-county-dot stlu">St. Lucie · ${fmtNum(e.stlu_txn)} txn</div>`);
    if(parseInt(e.brev_txn||0)>0)dots.push(`<div class="modal-county-dot brev">Brevard · ${fmtNum(e.brev_txn)} txn</div>`);
    if(parseInt(e.lee_txn||0)>0)dots.push(`<div class="modal-county-dot lee">Lee · ${fmtNum(e.lee_txn)} txn</div>`);
    if(parseInt(e.pin_parcels||0)>0)dots.push(`<div class="modal-county-dot pin">Pinellas · ${fmtNum(e.pin_parcels)} parcels</div>`);
    document.getElementById('modalCountyDots').innerHTML=dots.join('');

    // Build timeline chart
    buildTimelineChart(d.quarters,d.datasets);

    // County cards
    const cards=[];
    if(parseInt(e.sara_txn)>0){
      cards.push(`<div class="modal-county-card sara">
        <div class="mcc-title">Sarasota County</div>
        <div class="mcc-txn">${fmtNum(e.sara_txn)}</div>
        <div class="mcc-row"><span class="mcc-label">Avg Price</span><span class="mcc-val">${fmtAvg(e.sara_avg)}</span></div>
        <div class="mcc-row"><span class="mcc-label">Volume</span><span class="mcc-val">${fmtM(e.sara_vol_m)}</span></div>
        <div class="mcc-row"><span class="mcc-label">Active</span><span class="mcc-val">${fmtDate(e.sara_first)} – ${fmtDate(e.sara_last)}</span></div>
      </div>`);
    }
    if(parseInt(e.mana_txn)>0){
      cards.push(`<div class="modal-county-card mana">
        <div class="mcc-title">Manatee County</div>
        <div class="mcc-txn">${fmtNum(e.mana_txn)}</div>
        <div class="mcc-row"><span class="mcc-label">Avg Price</span><span class="mcc-val">${fmtAvg(e.mana_avg)}</span></div>
        <div class="mcc-row"><span class="mcc-label">Volume</span><span class="mcc-val">${fmtM(e.mana_vol_m)}</span></div>
        <div class="mcc-row"><span class="mcc-label">Active</span><span class="mcc-val">${fmtDate(e.mana_first)} – ${fmtDate(e.mana_last)}</span></div>
      </div>`);
    }
    if(parseInt(e.stlu_txn)>0){
      cards.push(`<div class="modal-county-card stlu">
        <div class="mcc-title">St. Lucie County</div>
        <div class="mcc-txn">${fmtNum(e.stlu_txn)}</div>
        <div class="mcc-row"><span class="mcc-label">Avg Price</span><span class="mcc-val">${fmtAvg(e.stlu_avg)}</span></div>
        <div class="mcc-row"><span class="mcc-label">Volume</span><span class="mcc-val">${fmtM(e.stlu_vol_m)}</span></div>
        <div class="mcc-row"><span class="mcc-label">Active</span><span class="mcc-val">${fmtDate(e.stlu_first)} – ${fmtDate(e.stlu_last)}</span></div>
      </div>`);
    }
    if(parseInt(e.brev_txn||0)>0){cards.push(`<div class="modal-county-card brev"><div class="mcc-title">Brevard County</div><div class="mcc-txn">${fmtNum(e.brev_txn)}</div><div class="mcc-row"><span class="mcc-label">Avg Price</span><span class="mcc-val">${fmtAvg(e.brev_avg)}</span></div><div class="mcc-row"><span class="mcc-label">Volume</span><span class="mcc-val">${fmtM(e.brev_vol_m)}</span></div><div class="mcc-row"><span class="mcc-label">Active</span><span class="mcc-val">${fmtDate(e.brev_first)} – ${fmtDate(e.brev_last)}</span></div></div>`);}
    if(parseInt(e.lee_txn||0)>0){cards.push(`<div class="modal-county-card lee"><div class="mcc-title">Lee County</div><div class="mcc-txn">${fmtNum(e.lee_txn)}</div><div class="mcc-row"><span class="mcc-label">Avg Price</span><span class="mcc-val">${fmtAvg(e.lee_avg)}</span></div><div class="mcc-row"><span class="mcc-label">Volume</span><span class="mcc-val">${fmtM(e.lee_vol_m)}</span></div><div class="mcc-row"><span class="mcc-label">Active</span><span class="mcc-val">${fmtDate(e.lee_first)} – ${fmtDate(e.lee_last)}</span></div></div>`);}
    if(parseInt(e.pin_parcels||0)>0){cards.push(`<div class="modal-county-card pin"><div class="mcc-title">Pinellas County</div><div class="mcc-txn">${fmtNum(e.pin_parcels)}</div><div class="mcc-row"><span class="mcc-label">Data Type</span><span class="mcc-val">Parcel ownership</span></div></div>`);}
    document.getElementById('modalCountyCards').innerHTML=cards.join('');

    // Insight
    document.getElementById('modalInsight').innerHTML=generateInsight(e);

  }catch(err){
    console.error(err);
    document.getElementById('modalName').textContent='Error loading data';
  }
}

function buildTimelineChart(quarters,datasets){
  const ctx=document.getElementById('timelineChart');
  if(!ctx)return;
  if(timelineChart){timelineChart.destroy();}

  const chartDatasets=[];

  if(datasets['Sarasota']){
    chartDatasets.push({
      type:'bar',label:'Sarasota',data:datasets['Sarasota'].txn,
      backgroundColor:'rgba(232,80,106,0.65)',borderColor:C.coral,borderWidth:1,
      borderRadius:3,stack:'txn',yAxisID:'yTxn',order:3
    });
  }
  if(datasets['Manatee']){
    chartDatasets.push({
      type:'bar',label:'Manatee',data:datasets['Manatee'].txn,
      backgroundColor:'rgba(6,182,212,0.65)',borderColor:C.cyan,borderWidth:1,
      borderRadius:3,stack:'txn',yAxisID:'yTxn',order:2
    });
  }
  if(datasets['Lee']){chartDatasets.push({type:'bar',label:'Lee',data:datasets['Lee'].txn,backgroundColor:'rgba(201,168,76,0.65)',borderColor:'#C9A84C',borderWidth:1,borderRadius:3,stack:'txn',yAxisID:'yTxn',order:0});}
  if(datasets['Brevard']){chartDatasets.push({type:'bar',label:'Brevard',data:datasets['Brevard'].txn,backgroundColor:'rgba(42,191,176,0.65)',borderColor:'#2ABFB0',borderWidth:1,borderRadius:3,stack:'txn',yAxisID:'yTxn',order:0});}
  if(datasets['St.Lucie']){
    chartDatasets.push({
      type:'bar',label:'St. Lucie',data:datasets['St.Lucie'].txn,
      backgroundColor:'rgba(42,191,176,0.65)',borderColor:C.teal,borderWidth:1,
      borderRadius:3,stack:'txn',yAxisID:'yTxn',order:1
    });
  }

  // Avg price line — use whichever county has the most data
  const mainCounty=['Sarasota','Lee','Manatee','St.Lucie','Brevard'].find(c=>datasets[c]);
  if(mainCounty&&datasets[mainCounty].avg){
    chartDatasets.push({
      type:'line',label:'Avg Price',data:datasets[mainCounty].avg,
      borderColor:C.amber,backgroundColor:'transparent',borderWidth:2.5,
      pointRadius:3,pointBackgroundColor:C.amber,tension:0.35,
      yAxisID:'yPrice',order:0,spanGaps:true
    });
  }

  timelineChart=new Chart(ctx,{
    type:'bar',
    data:{labels:quarters,datasets:chartDatasets},
    options:{
      responsive:true,maintainAspectRatio:false,
      interaction:{mode:'index',intersect:false},
      plugins:{
        legend:{labels:{color:'#9AAABB',boxWidth:12,padding:14,font:{size:10}}},
        tooltip:{...TT,callbacks:{
          label:c=>c.dataset.label==='Avg Price'
            ?' Avg: '+fmtAvg(c.raw)
            :' '+c.dataset.label+': '+fmtNum(c.raw)+' txn'
        }}
      },
      scales:{
        x:{stacked:true,grid:{color:'rgba(27,45,79,0.4)'},
          ticks:{color:'#9AAABB',maxTicksLimit:16,maxRotation:45,font:{size:9}}},
        yTxn:{stacked:true,position:'left',grid:{color:'rgba(27,45,79,0.4)'},
          ticks:{color:'#9AAABB',callback:v=>v.toLocaleString()},
          title:{display:true,text:'Transactions',color:'#5C7088',font:{size:9}}},
        yPrice:{position:'right',grid:{display:false},
          ticks:{color:'#5C7088',callback:v=>fmtAvg(v)},
          title:{display:true,text:'Avg Price',color:'#5C7088',font:{size:9}}}
      }
    }
  });
}

function generateInsight(e){
  const name=e.display_name;
  const type=e.entity_type;
  const counties=parseInt(e.county_count);
  const total=parseInt(e.total_txn);
  const vol=parseFloat(e.total_vol_m);
  const avg=parseInt(e.overall_avg);
  const first=fmtDate(e.first_seen);
  const last=fmtDate(e.last_seen);

  let insight='';

  if(counties>=3){
    insight=`<strong>${name}</strong> is one of only <strong>3 entities</strong> active across all three counties in this database — Sarasota, Manatee, and St. Lucie. With <strong>${total.toLocaleString()} total transactions</strong> and <strong>${fmtM(vol)}</strong> in volume since ${first}, this entity operates at institutional scale across the entire Gulf Coast and Treasure Coast corridor. Its pricing and activity patterns serve as a leading indicator for market-wide sentiment.`;
  } else if(type==='Builder'&&counties>=2){
    insight=`<strong>${name}</strong> is a multi-county production builder with <strong>${total.toLocaleString()} transactions</strong> totaling <strong>${fmtM(vol)}</strong> in volume. Active since ${first}, this builder's delivery timeline and avg price of <strong>${fmtAvg(avg)}</strong> tracks the new construction premium across the counties where they operate. When this builder accelerates delivery in a county, it signals land has been acquired and financing is in place — typically 12–18 months ahead of public announcements.`;
  } else if(type==='iBuyer'){
    insight=`<strong>${name}</strong> is an algorithmic iBuyer operating across <strong>${counties} ${counties===1?'county':'counties'}</strong>. With <strong>${total.toLocaleString()} transactions</strong> at avg <strong>${fmtAvg(avg)}</strong>, their activity pattern reveals where their pricing model sees value or where they are liquidating inventory. When an iBuyer's transaction count shifts from net-buying to net-selling in a county, it is a bearish signal for that market — their algorithm detected deteriorating return expectations before it became visible in public data.`;
  } else if(type==='SFR Operator'){
    insight=`<strong>${name}</strong> is an institutional single-family rental operator with <strong>${total.toLocaleString()} acquisitions</strong> at avg <strong>${fmtAvg(avg)}</strong>. SFR operators compete for the same 3-bedroom, 1,500–2,000 sqft workforce housing product that wholesale investors target. Their presence in a market typically compresses available inventory in the $300K–$500K tier and creates a price floor — they will not sell below acquisition cost.`;
  } else if(type==='Bank/GSE'){
    insight=`<strong>${name}</strong> is a lender or government-sponsored enterprise that appeared as a seller in <strong>${total.toLocaleString()} transactions</strong>. GSE and bank sales are predominantly REO (real-estate owned) properties acquired through foreclosure. A rising GSE transaction count in a county precedes stress index increases — they are the canary in the coal mine for credit market deterioration.`;
  } else {
    insight=`<strong>${name}</strong> has recorded <strong>${total.toLocaleString()} transactions</strong> totaling <strong>${fmtM(vol)}</strong> across ${counties} ${counties===1?'county':'counties'} between ${first} and ${last}. Average transaction price: <strong>${fmtAvg(avg)}</strong>. The quarterly chart above shows the full timeline of activity — look for acceleration patterns (rising bars) and deceleration (falling bars) as signals of strategic market entry and exit.`;
  }

  return insight;
}

// ── Filter controls ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded',()=>{

  // Type tabs
  document.getElementById('typeTabs').addEventListener('click',e=>{
    const tab=e.target.closest('.type-tab');
    if(!tab)return;
    document.querySelectorAll('#typeTabs .type-tab').forEach(t=>t.classList.remove('active'));
    tab.classList.add('active');
    State.type=tab.dataset.type;
    State.page=1;
    loadEntities();
  });

  // County tabs
  document.getElementById('countyTabs').addEventListener('click',e=>{
    const tab=e.target.closest('.type-tab');
    if(!tab)return;
    document.querySelectorAll('#countyTabs .type-tab').forEach(t=>t.classList.remove('active'));
    tab.classList.add('active');
    State.counties=tab.dataset.county;
    State.page=1;
    loadEntities();
  });

  // Search
  const searchInput=document.getElementById('searchInput');
  const searchClear=document.getElementById('searchClear');
  searchInput.addEventListener('input',()=>{
    clearTimeout(searchTimer);
    searchClear.style.display=searchInput.value?'':'none';
    searchTimer=setTimeout(()=>{
      State.search=searchInput.value.trim();
      State.page=1;
      loadEntities();
    },350);
  });
  searchClear.addEventListener('click',()=>{
    searchInput.value='';searchClear.style.display='none';
    State.search='';State.page=1;loadEntities();
  });

  // Sort
  document.getElementById('sortSelect').addEventListener('change',function(){
    State.sort=this.value;State.page=1;loadEntities();
  });
  document.getElementById('dirSelect').addEventListener('change',function(){
    State.dir=this.value;State.page=1;loadEntities();
  });

  // Modal close
  document.getElementById('modalClose').addEventListener('click',closeModal);
  document.getElementById('modalOverlay').addEventListener('click',e=>{
    if(e.target===e.currentTarget)closeModal();
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});

  // Timestamp
  const tsEl=document.getElementById('timestamp');
  function tick(){if(tsEl)tsEl.textContent=new Date().toLocaleTimeString('en-US',{hour12:false,hour:'2-digit',minute:'2-digit',second:'2-digit'});}
  tick();setInterval(tick,1000);

  // Initial load
  loadEntities();
});

function closeModal(){
  document.getElementById('modalOverlay').classList.remove('open');
  if(timelineChart){timelineChart.destroy();timelineChart=null;}
}

function escHtml(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function escAttr(s){return String(s).replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
