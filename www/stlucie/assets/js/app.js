'use strict';
const State={name:'',lucDesc:'',page:1,perPage:25,sort:'Owner',dir:'ASC',total:0,pages:0,loading:false};
const $=id=>document.getElementById(id);

function escHtml(str){return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function animateCount(el,target){if(!el)return;const start=parseInt(el.textContent.replace(/\D/g,''))||0;const steps=50,duration=800,delta=(target-start)/steps;let current=start,count=0;const timer=setInterval(()=>{count++;current+=delta;el.textContent=Math.round(count>=steps?target:current).toLocaleString();if(count>=steps)clearInterval(timer);},duration/steps);}
function updateTimestamp(el){if(el)el.textContent=new Date().toLocaleTimeString('en-US',{hour12:false,hour:'2-digit',minute:'2-digit',second:'2-digit'});}

document.addEventListener('DOMContentLoaded',()=>{

  // ── Element refs ────────────────────────────────────────────
  const nameInput     = $('nameInput');
  const addressInput  = $('addressInput');
  const acDropdown    = $('acDropdown');
  const filterBtn     = $('filterBtn');
  const clearBtn      = $('clearBtn');
  const perPageSelect = $('perPageSelect');
  const activeBadgeBar= $('activeBadgeBar');
  const badgeName     = $('badgeName');
  const badgeRemove   = $('badgeRemove');
  const lucBadgeBar   = $('lucBadgeBar');
  const lucBadgeName  = $('lucBadgeName');
  const lucBadgeRemove= $('lucBadgeRemove');
  const tableBody     = $('tableBody');
  const resultsPanel  = $('resultsPanel');
  const resultsCount  = $('resultsCount');
  const paginationBar = $('paginationBar');
  const paginationInfo= $('paginationInfo');
  const paginationCtrls=$('paginationCtrls');
  const timestampEl   = $('timestamp');
  const statTotal     = $('statTotal');
  const statOwners    = $('statOwners');
  const statCities    = $('statCities');
  const statDistricts = $('statDistricts');
  const statAvgPrice  = $('statAvgPrice');
  const statAvgSqft   = $('statAvgSqft');
  const sortHeaders   = document.querySelectorAll('[data-sort]');

  // ── Autocomplete ────────────────────────────────────────────
  let acFiltered=[],acHighIdx=-1,acTimer=null;

  async function fetchNames(q){
    try{const r=await fetch('api/names.php?q='+encodeURIComponent(q));const d=await r.json();return d.success?d.names:[];}
    catch{return[];}
  }

  function renderDropdown(names,q){
    acDropdown.innerHTML='';
    if(!names.length){acDropdown.classList.remove('open');return;}
    const re=new RegExp('('+q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','gi');
    names.forEach((name,i)=>{
      const item=document.createElement('div');
      item.className='autocomplete-item';
      item.innerHTML=name.replace(re,'<mark>$1</mark>');
      item.addEventListener('mousedown',e=>{e.preventDefault();selectName(name);});
      item.addEventListener('mouseover',()=>{acHighIdx=i;highlightItem();});
      acDropdown.appendChild(item);
    });
    acDropdown.classList.add('open');acHighIdx=-1;
  }

  function highlightItem(){acDropdown.querySelectorAll('.autocomplete-item').forEach((el,i)=>el.classList.toggle('highlighted',i===acHighIdx));}
  function selectName(name){nameInput.value=name;acDropdown.classList.remove('open');acHighIdx=-1;}
  function closeDropdown(){acDropdown.classList.remove('open');acHighIdx=-1;}

  nameInput.addEventListener('input',()=>{
    clearTimeout(acTimer);
    const q=nameInput.value.trim();
    if(!q){closeDropdown();return;}
    acTimer=setTimeout(async()=>{acFiltered=await fetchNames(q);renderDropdown(acFiltered,q);},220);
  });

  nameInput.addEventListener('keydown',e=>{
    const items=acDropdown.querySelectorAll('.autocomplete-item');
    if(e.key==='ArrowDown'&&acDropdown.classList.contains('open')){
      e.preventDefault();acHighIdx=Math.min(acHighIdx+1,items.length-1);highlightItem();
      if(acHighIdx>=0)nameInput.value=acFiltered[acHighIdx];
    }else if(e.key==='ArrowUp'&&acDropdown.classList.contains('open')){
      e.preventDefault();acHighIdx=Math.max(acHighIdx-1,-1);highlightItem();
      if(acHighIdx>=0)nameInput.value=acFiltered[acHighIdx];
    }else if(e.key==='Enter'){
      e.preventDefault();
      if(acDropdown.classList.contains('open')&&acHighIdx>=0&&acFiltered[acHighIdx])selectName(acFiltered[acHighIdx]);
      applyFilter();
    }else if(e.key==='Escape'){closeDropdown();}
  });

  nameInput.addEventListener('blur',()=>{setTimeout(closeDropdown,150);});

  // ── Filters ─────────────────────────────────────────────────
  function applyFilter(){
    closeDropdown();
    State.name=nameInput.value.trim();
    State.address=addressInput.value.trim();
    State.page=1;
    activeBadgeBar.classList.toggle('visible',!!State.name);
    if(State.name)badgeName.textContent=State.name;
    loadData();loadStats();
  }

  function clearFilter(){
    nameInput.value='';State.name='';addressInput.value='';State.address='';State.page=1;
    activeBadgeBar.classList.remove('visible');
    loadData();loadStats();
  }

  function applyLucFilter(v){
    if(State.lucDesc===v){clearLucFilter();return;}
    State.lucDesc=v;State.page=1;
    lucBadgeName.textContent=v;
    lucBadgeBar.classList.add('visible');
    loadData();loadStats();
  }

  function clearLucFilter(){
    State.lucDesc='';State.page=1;
    lucBadgeBar.classList.remove('visible');
    document.querySelectorAll('.luc-type-badge.active-filter').forEach(el=>el.classList.remove('active-filter'));
    loadData();loadStats();
  }

  filterBtn.addEventListener('click',applyFilter);
  clearBtn.addEventListener('click',clearFilter);
  badgeRemove.addEventListener('click',clearFilter);
  lucBadgeRemove.addEventListener('click',clearLucFilter);

  perPageSelect.addEventListener('change',()=>{
    State.perPage=parseInt(perPageSelect.value);State.page=1;loadData();
  });

  // ── Sorting ─────────────────────────────────────────────────
  function updateSortUI(){
    sortHeaders.forEach(th=>{
      const col=th.dataset.sort;
      const icon=th.querySelector('.sort-icon');
      th.classList.remove('sorted-asc','sorted-desc');
      if(col===State.sort){
        th.classList.add(State.dir==='ASC'?'sorted-asc':'sorted-desc');
        if(icon)icon.textContent=State.dir==='ASC'?'↑':'↓';
      }else{if(icon)icon.textContent='⇅';}
    });
  }

  sortHeaders.forEach(th=>{
    th.addEventListener('click',()=>{
      const col=th.dataset.sort;
      if(State.sort===col){State.dir=State.dir==='ASC'?'DESC':'ASC';}
      else{State.sort=col;State.dir='ASC';}
      State.page=1;updateSortUI();loadData();
    });
  });

  // ── Data loading ─────────────────────────────────────────────
  async function loadData(){
    if(State.loading)return;
    State.loading=true;showLoading();
    const params=new URLSearchParams({
      name:State.name,luc_desc:State.lucDesc,
      page:State.page,per_page:State.perPage,
      sort:State.sort,dir:State.dir
    });
    try{
      const res=await fetch('api/records.php?'+params);
      const data=await res.json();
      if(!data.success)throw new Error(data.error||'Query failed');
      State.total=data.total;State.pages=data.pages;
      renderTable(data.records);
      renderPagination();
      updateResultsCount(data.total,data.page,data.per_page);
    }catch(err){showError();console.error(err);}
    finally{State.loading=false;}
  }

  async function loadStats(){
    try{
      const params=new URLSearchParams({name:State.name,luc_desc:State.lucDesc});
      const res=await fetch('api/stats.php?'+params);
      const data=await res.json();
      if(!data.success)return;
      const s=data.stats;
      animateCount(statTotal,parseInt(s.total_records));
      animateCount(statOwners,parseInt(s.unique_owners));
      animateCount(statCities,parseInt(s.cities));
      animateCount(statDistricts,parseInt(s.districts));
      const price=parseFloat(s.avg_sale_price)||0;
      if(statAvgPrice)statAvgPrice.textContent=price>0?'$'+Math.round(price).toLocaleString():'—';
      const sqft=parseFloat(s.avg_sqft)||0;
      if(statAvgSqft)statAvgSqft.textContent=sqft>0?Math.round(sqft).toLocaleString():'—';
    }catch(e){console.error(e);}
  }

  // ── Rendering ─────────────────────────────────────────────────
  function renderTable(records){
    const ex=resultsPanel.querySelector('.state-loading,.state-empty');
    if(ex)ex.remove();
    if(!records||!records.length){tableBody.innerHTML='';showEmpty();return;}
    tableBody.innerHTML=records.map(r=>{
      const isActive=State.lucDesc===r['LUC Description']?' active-filter':'';
      const sqft=r['Finished Area (sq ft)']?parseInt(r['Finished Area (sq ft)']).toLocaleString():'—';
      return '<tr>'+
        '<td class="col-owner">'+escHtml(r['Owner']||'—')+'</td>'+
        '<td>'+escHtml(r['Situs']||'—')+'</td>'+
        '<td>'+escHtml(r['City']||'—')+'</td>'+
        '<td><span class="luc-type-badge'+isActive+'" title="Double-click to filter">'+escHtml(r['LUC Description']||'—')+'</span></td>'+
        '<td class="col-price">'+escHtml(r['Sale Price']||'—')+'</td>'+
        '<td>'+escHtml(r['Sale Date']||'—')+'</td>'+
        '<td class="col-sqft">'+sqft+'</td>'+
        '<td><div class="bed-bath"><span class="bb-pill">'+escHtml(r['Bedrooms']||'—')+' <span>bd</span></span>'+
        '<span class="bb-pill">'+escHtml(r['Bathrooms']||'—')+' <span>ba</span></span></div></td>'+
        '<td>'+escHtml(r['Year Built']||'—')+'</td>'+
        '<td>'+escHtml(r['District Group Description']||'—')+'</td>'+
        '<td class="col-parcel">'+escHtml(r['Parcel ID']||'—')+'</td>'+
        '</tr>';
    }).join('');
    tableBody.querySelectorAll('.luc-type-badge').forEach(badge=>{
      badge.addEventListener('dblclick',()=>{applyLucFilter(badge.textContent.trim());});
    });
  }

  function showLoading(){
    tableBody.innerHTML='';
    const ex=resultsPanel.querySelector('.state-loading,.state-empty');if(ex)ex.remove();
    const div=document.createElement('div');div.className='state-loading';
    div.innerHTML='<div class="spinner"></div><div class="state-title">Retrieving Records</div><div class="state-desc">Querying the database…</div>';
    tableBody.closest('.table-wrap').after(div);
  }

  function showEmpty(){
    const ex=resultsPanel.querySelector('.state-loading,.state-empty');if(ex)ex.remove();
    const div=document.createElement('div');div.className='state-empty';
    div.innerHTML='<div class="state-icon">⬡</div><div class="state-title">No Records Found</div>'+
      '<div class="state-desc">'+(State.name||State.lucDesc?'No properties match the current filters.':'Begin by searching for an owner name above.')+'</div>';
    tableBody.closest('.table-wrap').after(div);
  }

  function showError(){
    tableBody.innerHTML='<tr><td colspan="11" style="text-align:center;color:var(--accent-red);padding:32px;font-size:12px;">⚠ Failed to load records.</td></tr>';
  }

  function updateResultsCount(total,page,perPage){
    const from=total===0?0:(page-1)*perPage+1;
    const to=Math.min(page*perPage,total);
    resultsCount.innerHTML='Showing <strong>'+from+'–'+to+'</strong> of <strong>'+total.toLocaleString()+'</strong> records';
  }

  function renderPagination(){
    if(State.total===0){paginationBar.style.display='none';return;}
    paginationBar.style.display='';
    paginationInfo.textContent='Page '+State.page+' of '+State.pages;
    paginationCtrls.innerHTML='';
    const addBtn=(label,tp,isActive,disabled)=>{
      const btn=document.createElement('button');
      btn.className='page-btn'+(isActive?' active':'');
      btn.textContent=label;btn.disabled=!!disabled;
      btn.addEventListener('click',()=>{State.page=tp;loadData();});
      paginationCtrls.appendChild(btn);
    };
    const addEllipsis=()=>{const span=document.createElement('span');span.className='page-ellipsis';span.textContent='…';paginationCtrls.appendChild(span);};
    addBtn('‹',State.page-1,false,State.page===1);
    let shown=new Set([1,State.pages]);
    for(let p=Math.max(1,State.page-2);p<=Math.min(State.pages,State.page+2);p++)shown.add(p);
    let prev=null;
    [...shown].sort((a,b)=>a-b).forEach(p=>{if(prev!==null&&p-prev>1)addEllipsis();addBtn(p,p,p===State.page,false);prev=p;});
    addBtn('›',State.page+1,false,State.page===State.pages||State.pages===0);
  }

  // ── Init ─────────────────────────────────────────────────────
  updateSortUI();
  loadData();
  loadStats();
  updateTimestamp(timestampEl);
  setInterval(()=>updateTimestamp(timestampEl),1000);

}); // end DOMContentLoaded
