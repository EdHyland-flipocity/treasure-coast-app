'use strict';

Chart.defaults.color = '#5C7088';
Chart.defaults.borderColor = '#1B2D4F';
Chart.defaults.font.family = "'Montserrat', system-ui, sans-serif";
Chart.defaults.font.size = 11;

const C = {
    martin:  '#1DA88A', martinL: '#3ECFB0', martinA: 'rgba(29,168,138,0.15)',
    coral:   '#E8506A', coralL:  '#F57E94', coralA:  'rgba(232,80,106,0.15)',
    teal:    '#2ABFB0', tealL:   '#5ED8CC', tealA:   'rgba(42,191,176,0.15)',
    gold:    '#C9A84C', goldL:   '#E8C97E', goldA:   'rgba(201,168,76,0.15)',
    amber:   '#E8823A', amberL:  '#F5A96B', amberA:  'rgba(232,130,58,0.15)',
    violet:  '#8B5CF6', violetL: '#A78BFA', violetA: 'rgba(139,92,246,0.15)',
    emerald: '#10B981', emeraldL:'#34D399', emeraldA:'rgba(16,185,129,0.15)',
    red:     '#EF4444', redL:    '#FCA5A5', redA:    'rgba(239,68,68,0.15)',
};

const PHASES = [
    { start:'2000', end:'2002', label:'Post Dot-Com\nRecovery',  color:'rgba(42,191,176,0.08)'  },
    { start:'2003', end:'2005', label:'The Great\nBubble',       color:'rgba(232,80,106,0.10)'  },
    { start:'2006', end:'2011', label:'Crash &\nCrisis',         color:'rgba(239,68,68,0.10)'   },
    { start:'2012', end:'2016', label:'Long\nRecovery',          color:'rgba(201,168,76,0.08)'  },
    { start:'2017', end:'2019', label:'Steady\nExpansion',       color:'rgba(16,185,129,0.08)'  },
    { start:'2020', end:'2022', label:'COVID\nBoom',             color:'rgba(139,92,246,0.10)'  },
    { start:'2023', end:'2025', label:'Rate\nCorrection',        color:'rgba(232,130,58,0.10)'  },
];

function fmtM(n) {
    const v = parseFloat(n)||0;
    if (Math.abs(v)>=1e9)  return '$'+(v/1e9).toFixed(1)+'B';
    if (Math.abs(v)>=1e6)  return '$'+(v/1e6).toFixed(1)+'M';
    if (Math.abs(v)>=1000) return '$'+(v/1000).toFixed(0)+'K';
    return '$'+Math.round(v).toLocaleString();
}
function fmtNum(n)  { return Math.round(parseFloat(n)||0).toLocaleString(); }
function fmtPct(n)  { return (parseFloat(n)||0).toFixed(1)+'%'; }
function fmtPrice(n){ return '$'+Math.round(parseFloat(n)||0).toLocaleString(); }

function animateCount(el, target, fmt) {
    if (!el) return;
    const steps=60, dur=1000, delta=target/steps;
    let cur=0, cnt=0;
    const t=setInterval(()=>{
        cnt++; cur+=delta;
        const v=cnt>=steps?target:cur;
        el.textContent=fmt?fmt(v):Math.round(v).toLocaleString();
        if(cnt>=steps)clearInterval(t);
    }, dur/steps);
}

const tooltipDef = {
    backgroundColor:'#111D33', borderColor:'#1B2D4F', borderWidth:1,
    padding:10, titleFont:{size:12,weight:'600'}, bodyFont:{size:11},
};

function phaseAnnotations(years) {
    const ann = {};
    PHASES.forEach((p,i)=>{
        const si=years.indexOf(p.start), ei=years.indexOf(p.end);
        if(si===-1||ei===-1) return;
        ann[`box${i}`]={type:'box',xMin:si-0.5,xMax:ei+0.5,backgroundColor:p.color,borderWidth:0};
        ann[`lbl${i}`]={type:'label',xValue:(si+ei)/2,yValue:'max',content:p.label.split('\n'),
            color:'rgba(255,255,255,0.22)',font:{size:9,weight:'600',family:"'Montserrat'"},
            textAlign:'center',position:{x:'center',y:'start'},yAdjust:12};
    });
    return ann;
}

// ── Populate S/R Panel ──────────────────────────────────────
function buildSRPanel(sr, findings) {
    if (!sr) return;

    const fmt = p => fmtPrice(p);

    // Support levels
    const supEl = document.getElementById('supportLevels');
    if (supEl && sr.support) {
        supEl.innerHTML = sr.support.map(s => {
            const isCurrent = s.strength === 'current';
            const isMajor   = s.strength === 'major';
            return `<div class="sr-level${isCurrent?' current':isMajor?' s-major':''}">
                <div class="sr-dot support${isCurrent?' pulse':''}"></div>
                <div>
                    <div class="sr-level-price">${fmt(s.price)}</div>
                    <div class="sr-level-label">${s.label}</div>
                    <div class="sr-level-note">${s.note}</div>
                </div>
            </div>`;
        }).join('');
    }

    // Resistance levels
    const resEl = document.getElementById('resistanceLevels');
    if (resEl && sr.resistance) {
        resEl.innerHTML = sr.resistance.map(r => {
            const isCurrent = r.strength === 'current';
            const isTarget  = r.strength === 'target';
            const isMajor   = r.strength === 'major';
            return `<div class="sr-level${isCurrent?' current':isMajor?' s-major':''}">
                <div class="sr-dot resist${isCurrent?' pulse':''}${isTarget?' target':''}"></div>
                <div>
                    <div class="sr-level-price">${fmt(r.price)}</div>
                    <div class="sr-level-label">${r.label}</div>
                    <div class="sr-level-note">${r.note}</div>
                </div>
            </div>`;
        }).join('');
    }

    // Pivot box
    const pvEl = document.getElementById('pivotBox');
    if (pvEl && sr.pivot) {
        const p = sr.pivot;
        const biasClass = (sr.bias||'ranging').toLowerCase();
        pvEl.innerHTML = `
            <div class="pivot-title">${p.year} Annual Pivot Point</div>
            <div class="pivot-main">${fmt(p.pp)}</div>
            <div class="pivot-levels">
                <div class="pivot-row r"><span class="pivot-key">R2</span><span class="pivot-val">${fmt(p.r2)}</span><span class="pivot-desc">Breakout target</span></div>
                <div class="pivot-row r"><span class="pivot-key">R1</span><span class="pivot-val">${fmt(p.r1)}</span><span class="pivot-desc">First resistance</span></div>
                <div class="pivot-row p"><span class="pivot-key">PP</span><span class="pivot-val">${fmt(p.pp)}</span><span class="pivot-desc">Pivot &mdash; current ceiling</span></div>
                <div class="pivot-row s"><span class="pivot-key">S1</span><span class="pivot-val">${fmt(p.s1)}</span><span class="pivot-desc">First support</span></div>
                <div class="pivot-row s"><span class="pivot-key">S2</span><span class="pivot-val">${fmt(p.s2)}</span><span class="pivot-desc">Second support</span></div>
            </div>
            <div class="pivot-signal">
                <span class="signal-dot ${biasClass}"></span>
                Current Bias: <strong>${sr.bias||'RANGING'}</strong> &mdash; price between S1 and PP
            </div>`;
    }

    // Action rows
    if (sr.support && sr.resistance) {
        const s1 = sr.support[3]?.price || 0;
        const r1 = sr.resistance[0]?.price || 0;
        const r2 = sr.resistance[1]?.price || 0;
        const el = id => document.getElementById(id);
        if(el('actionBuy'))    el('actionBuy').textContent    = `Below ${fmt(s1)} — deep value accumulation zone`;
        if(el('actionHold'))   el('actionHold').textContent   = `${fmt(s1)} – ${fmt(r1)}`;
        if(el('actionCaution'))el('actionCaution').textContent= `${fmt(r1)} – ${fmt(r2)}`;
        if(el('actionSell'))   el('actionSell').textContent   = `Above ${fmt(r2)} — peak zone`;
    }
}

// ── Load Data ───────────────────────────────────────────────
async function loadData() {
    try {
        const res  = await fetch('api/data.php');
        const json = await res.json();
        if (!json.success) { console.error(json.error); return; }

        const f = json.findings || {};

        // KPIs
        animateCount(document.getElementById('kpiTotal'),   473616);
        animateCount(document.getElementById('kpiAvg2024'), parseFloat(f.p2024)||0, v=>fmtM(v));
        animateCount(document.getElementById('kpiStress'),  parseFloat(f.stress_2025)||0, v=>v.toFixed(1)+'%');

        const dropEl = document.getElementById('kpiDrop');
        if (dropEl) dropEl.textContent = (f.drop_pct||0)+'%';

        const gainEl = document.getElementById('kpiGain');
        if (gainEl) gainEl.textContent = '+'+(f.recovery_pct||0)+'%';

        const liqEl  = document.getElementById('kpiLiq');
        if (liqEl)  liqEl.textContent  = (f.liq_compression||'—')+'×';

        const subEl  = document.getElementById('kpiDropSub');
        if (subEl && f.peak_yr && f.trough_yr)
            subEl.textContent = f.peak_yr+' peak → '+f.trough_yr+' trough avg price';

        // Liquidity insight
        const liqIns = document.getElementById('liqInsight');
        if (liqIns && f.hold_crisis && f.hold_current)
            liqIns.innerHTML = '<span class="insight-icon">◉</span> Crisis peak: '+f.hold_crisis+'yr avg hold · Current: '+f.hold_current+'yr — '+f.liq_compression+'× compression';

        // Stress insight
        const stIns = document.getElementById('stressInsight');
        if (stIns && f.stress_2025)
            stIns.textContent = '2025 QC ratio: '+f.stress_2025+'% — '+(f.stress_2025>13?'rising, echoes 2006 early warning pattern':'monitoring closely');

        // Stress annotations
        buildStressAnnotations(f);

        // S/R Panel
        buildSRPanel(json.srLevels, f);

        // Finding bodies — update with real numbers
        const f1 = document.getElementById('finding1');
        if (f1 && f.stress_2006 && f.stress_2025)
            f1.innerHTML = `The Quit Claim deed ratio exceeded ${f.stress_2006}% in 2006, exactly one year before the crash. Martin County's current ratio of ${f.stress_2025}% in 2025 — ${f.stress_2025>13?'has risen above 13% for the first time since the recovery. This is a pattern worth monitoring closely.':'remains below the historical warning threshold but is trending upward.'}  This stress signal is not reported in any conventional real estate analysis.`;

        const f3 = document.getElementById('finding3');
        if (f3 && f.trough_yr && f.recovery_pct)
            f3.innerHTML = `Buyers who purchased Martin County properties in ${f.trough_yr} at the trough avg of ${fmtM(f.trough_price)} achieved the highest returns of any cohort in 30 years. The data shows the recovery window lasted only 18–24 months before prices began rising again. From trough to 2024, average prices recovered ${f.recovery_pct}%.`;

        const f4 = document.getElementById('finding4');
        if (f4 && f.liq_compression && f.hold_crisis)
            f4.innerHTML = `The average hold period before resale has compressed from ${f.hold_crisis} years at the crisis peak to ${f.hold_current} years currently — a ${f.liq_compression}× acceleration. This is the signature of a market transitioning from owner-occupied to investment-grade, with significant implications for future supply constraints in Martin County's limited geography.`;

        // Charts
        buildChart1(json.priceCycle, json.srLevels);
        buildChart2(json.stress);
        buildChart3(json.quarterly);
        buildChart4(json.tierShift);
        buildChart5(json.jurisdictions);
        buildChart6(json.craHistory);
        buildChart7(json.buildingVintage);
        buildChartLiq(json.liquidity);
        buildGrantorTable(json.topGrantors);

    } catch(e) { console.error('Data load failed:', e); }
}

function buildStressAnnotations(f) {
    const el = document.getElementById('stressAnnotations');
    if (!el) return;
    const items = [
        { yr:'2006', val:f.stress_2006?f.stress_2006+'%':'—', label:'Warning — 1yr before crash', cls:'red' },
        { yr:'2009', val:'Peak crisis distress', label:'', cls:'red' },
        { yr:'2021', val:'Boom-era low', label:'Healthiest market signal', cls:'green' },
        { yr:'2025', val:f.stress_2025?f.stress_2025+'%':'—', label:'Rising — monitor closely', cls:'amber' },
    ];
    el.innerHTML = items.map(i=>`
        <div class="annotation ${i.cls}">
            <div class="ann-year">${i.yr}</div>
            <div class="ann-val">${i.val}</div>
            <div class="ann-label">${i.label}</div>
        </div>`).join('');
}

// ── Chart 1: 30-Year Cycle + S/R Overlays ───────────────────
function buildChart1(data, sr) {
    const ctx = document.getElementById('chart1');
    if (!ctx||!data) return;
    const years     = data.map(d=>String(d.yr));
    const avgPrices = data.map(d=>parseFloat(d.avg_price)||0);
    const volumes   = data.map(d=>parseInt(d.transactions)||0);
    const stress    = data.map(d=>parseFloat(d.stress_index)||0);

    // Build S/R annotation lines from actual data
    const srAnn = {};
    if (sr) {
        const supColors = ['rgba(16,185,129,0.5)','rgba(16,185,129,0.5)','rgba(16,185,129,0.6)','rgba(16,185,129,0.9)'];
        const supWidths = [1.5,1.5,1.5,2.5];
        (sr.support||[]).forEach((s,i)=>{
            srAnn[`sup_${i}`]={type:'line',yMin:s.price,yMax:s.price,
                borderColor:supColors[i],borderWidth:supWidths[i],borderDash:[6,4],
                label:{display:true,content:`S${4-i} · ${fmtM(s.price)}`,position:'start',
                    color:`rgba(52,211,153,${0.6+i*0.1})`,font:{size:8.5,weight:'600',family:"'Space Mono'"},
                    backgroundColor:'rgba(8,14,26,0.85)',padding:{x:6,y:3},borderRadius:3,xAdjust:8}};
        });
        const resColors=['rgba(224,92,92,0.5)','rgba(224,92,92,0.9)','rgba(224,92,92,0.4)','rgba(224,92,92,0.5)'];
        const resWidths=[1.5,2.5,1.5,1.5];
        const resDash=[[6,4],[6,4],[3,6],[6,4]];
        (sr.resistance||[]).forEach((r,i)=>{
            srAnn[`res_${i}`]={type:'line',yMin:r.price,yMax:r.price,
                borderColor:resColors[i],borderWidth:resWidths[i],borderDash:resDash[i],
                label:{display:true,content:`R${i+1} · ${fmtM(r.price)}`,position:'end',
                    color:`rgba(252,165,165,${0.6+i*0.1})`,font:{size:8.5,weight:'600',family:"'Space Mono'"},
                    backgroundColor:'rgba(8,14,26,0.85)',padding:{x:6,y:3},borderRadius:3,xAdjust:-8}};
        });
        // Pivot line
        if (sr.pivot) {
            srAnn['pivot']={type:'line',yMin:sr.pivot.pp,yMax:sr.pivot.pp,
                borderColor:'rgba(232,130,58,0.7)',borderWidth:1.5,borderDash:[4,3],
                label:{display:true,content:`PIVOT · ${fmtM(sr.pivot.pp)}`,position:'center',
                    color:'rgba(245,169,107,0.9)',font:{size:8,weight:'700',family:"'Space Mono'"},
                    backgroundColor:'rgba(8,14,26,0.9)',padding:{x:5,y:2},borderRadius:3}};
        }
        // Accumulation zone (between S2 and S1)
        if (sr.support && sr.support.length>=4) {
            srAnn['acc_zone']={type:'box',yMin:sr.support[2].price,yMax:sr.support[3].price,
                backgroundColor:'rgba(16,185,129,0.05)',borderColor:'rgba(16,185,129,0.12)',borderWidth:1,
                label:{display:true,content:'📈 ACCUMULATION ZONE',color:'rgba(52,211,153,0.45)',
                    font:{size:9,weight:'600'},position:{x:'center',y:'center'}}};
        }
        // Distribution zone (between R1 and R2)
        if (sr.resistance && sr.resistance.length>=2) {
            srAnn['dist_zone']={type:'box',yMin:sr.resistance[0].price,yMax:sr.resistance[1].price,
                backgroundColor:'rgba(224,92,92,0.04)',borderColor:'rgba(224,92,92,0.1)',borderWidth:1,
                label:{display:true,content:'⚠ DISTRIBUTION ZONE',color:'rgba(252,165,165,0.4)',
                    font:{size:9,weight:'600'},position:{x:'center',y:'center'}}};
        }
    }

    const allAnn = { ...phaseAnnotations(years), ...srAnn };

    new Chart(ctx, {
        type:'bar',
        data:{
            labels:years,
            datasets:[
                {type:'line',label:'Avg Sale Price',data:avgPrices,
                    borderColor:C.martin,backgroundColor:C.martinA,borderWidth:3,
                    pointBackgroundColor:avgPrices.map(p=>p<200000?C.emerald:p>800000?C.red:C.martin),
                    pointRadius:4,pointHoverRadius:7,tension:0.35,fill:true,yAxisID:'yPrice',order:1,z:10},
                {type:'bar',label:'Transaction Volume',data:volumes,
                    backgroundColor:'rgba(42,191,176,0.15)',borderColor:'rgba(42,191,176,0.3)',
                    borderWidth:1,yAxisID:'yVol',order:2},
                {type:'line',label:'Stress Index %',data:stress,
                    borderColor:C.amber,borderWidth:1.5,borderDash:[4,3],
                    pointRadius:0,tension:0.4,fill:false,yAxisID:'yStress',order:0},
            ]
        },
        options:{
            responsive:true,maintainAspectRatio:false,
            interaction:{mode:'index',intersect:false},
            plugins:{
                legend:{labels:{color:'#9AAABB',boxWidth:12,padding:16}},
                tooltip:{...tooltipDef,callbacks:{label:c=>{
                    if(c.dataset.label==='Avg Sale Price') return ' '+fmtPrice(c.raw);
                    if(c.dataset.label==='Transaction Volume') return ' '+fmtNum(c.raw)+' transactions';
                    return ' Stress: '+fmtPct(c.raw);
                }}},
                annotation:{annotations:allAnn}
            },
            scales:{
                x:{grid:{color:'rgba(27,45,79,0.4)'},ticks:{color:'#9AAABB',maxRotation:45}},
                yPrice:{position:'left',grid:{color:'rgba(27,45,79,0.4)'},
                    ticks:{color:'#9AAABB',callback:v=>fmtM(v)},min:0},
                yVol:{position:'right',grid:{display:false},
                    ticks:{color:'#5C7088',callback:v=>(v/1000).toFixed(0)+'K'}},
                yStress:{position:'right',grid:{display:false},display:false,max:50},
            }
        }
    });
}

// ── Chart 2: Stress Index ────────────────────────────────────
function buildChart2(data) {
    const ctx=document.getElementById('chart2');
    if(!ctx||!data) return;
    const years =data.map(d=>String(d.yr));
    const qc    =data.map(d=>parseFloat(d.qc_pct)||0);
    const ct    =data.map(d=>parseFloat(d.ct_pct)||0);
    const stress=data.map(d=>parseFloat(d.total_stress)||0);

    new Chart(ctx,{type:'bar',data:{labels:years,datasets:[
        {label:'QC Deeds %',data:qc,backgroundColor:'rgba(232,80,106,0.55)',borderColor:C.coral,borderWidth:1,borderRadius:2,stack:'s'},
        {label:'Consent Deeds %',data:ct,backgroundColor:'rgba(239,68,68,0.55)',borderColor:C.red,borderWidth:1,borderRadius:2,stack:'s'},
        {type:'line',label:'Total Stress %',data:stress,borderColor:C.amber,borderWidth:2.5,
            pointBackgroundColor:C.amber,pointRadius:3,tension:0.4,fill:false},
    ]},options:{
        responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},
        plugins:{
            legend:{labels:{color:'#9AAABB',boxWidth:12,padding:16}},
            tooltip:{...tooltipDef,callbacks:{label:c=>' '+fmtPct(c.raw)}},
            annotation:{annotations:{dangerLine:{type:'line',yMin:16,yMax:16,
                borderColor:'rgba(239,68,68,0.4)',borderWidth:1.5,borderDash:[5,5],
                label:{content:'16% — Pre-crash threshold',display:true,position:'start',
                    color:'rgba(239,68,68,0.6)',font:{size:9},backgroundColor:'transparent'}}}}
        },
        scales:{
            x:{stacked:true,grid:{color:'rgba(27,45,79,0.4)'}},
            y:{stacked:false,max:35,ticks:{callback:v=>v+'%'},grid:{color:'rgba(27,45,79,0.4)'}}
        }
    }});
}

// ── Chart 3: Quarterly ───────────────────────────────────────
function buildChart3(data) {
    const ctx=document.getElementById('chart3');
    if(!ctx||!data) return;
    const labels   =data.map(d=>`${d.yr} Q${d.qtr}`);
    const volumes  =data.map(d=>parseInt(d.transactions)||0);
    const avgPrices=data.map(d=>parseFloat(d.avg_price)||0);
    const stress   =data.map(d=>parseFloat(d.stress_index)||0);

    new Chart(ctx,{type:'bar',data:{labels,datasets:[
        {type:'bar',label:'Transactions',data:volumes,
            backgroundColor:'rgba(29,168,138,0.18)',borderColor:'rgba(29,168,138,0.35)',borderWidth:0.5,yAxisID:'yVol',order:3},
        {type:'line',label:'Avg Sale Price',data:avgPrices,
            borderColor:C.martin,borderWidth:2,pointRadius:0,tension:0.3,fill:false,yAxisID:'yPrice',order:1},
        {type:'line',label:'Stress Index %',data:stress,
            borderColor:C.amber,borderWidth:1.5,borderDash:[4,3],pointRadius:0,tension:0.4,fill:false,yAxisID:'yStress',order:2},
    ]},options:{
        responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},
        plugins:{
            legend:{labels:{color:'#9AAABB',boxWidth:12,padding:16}},
            tooltip:{...tooltipDef,callbacks:{label:c=>{
                if(c.dataset.label==='Avg Sale Price') return ' '+fmtM(c.raw);
                if(c.dataset.label==='Stress Index %') return ' Stress: '+fmtPct(c.raw);
                return ' '+fmtNum(c.raw)+' transactions';
            }}}
        },
        scales:{
            x:{grid:{color:'rgba(27,45,79,0.3)'},ticks:{color:'#5C7088',maxTicksLimit:28,
                callback:(_,i)=>labels[i]?.includes('Q1')?labels[i].split(' ')[0]:''}},
            yVol:{position:'right',grid:{display:false},ticks:{color:'#5C7088',callback:v=>(v/1000).toFixed(0)+'K'}},
            yPrice:{position:'left',grid:{color:'rgba(27,45,79,0.4)'},ticks:{color:'#9AAABB',callback:v=>fmtM(v)}},
            yStress:{position:'right',grid:{display:false},display:false,max:50},
        }
    }});
}

// ── Chart 4: Price Tier Shift ────────────────────────────────
function buildChart4(data) {
    const ctx=document.getElementById('chart4');
    if(!ctx||!data) return;
    const years=data.map(d=>String(d.yr));
    const pct=field=>data.map(d=>{const t=parseInt(d.total)||1;return Math.round(parseInt(d[field]||0)*100/t*10)/10;});

    new Chart(ctx,{type:'bar',data:{labels:years,datasets:[
        {label:'Under $200K',  data:pct('under_200k'),backgroundColor:'rgba(42,191,176,0.75)',borderWidth:0,stack:'t'},
        {label:'$200K–$400K', data:pct('t200_400k'), backgroundColor:'rgba(16,185,129,0.75)',borderWidth:0,stack:'t'},
        {label:'$400K–$600K', data:pct('t400_600k'), backgroundColor:'rgba(201,168,76,0.75)', borderWidth:0,stack:'t'},
        {label:'$600K–$1M',   data:pct('t600k_1m'),  backgroundColor:'rgba(232,130,58,0.75)', borderWidth:0,stack:'t'},
        {label:'$1M–$3M',     data:pct('t1m_3m'),    backgroundColor:'rgba(232,80,106,0.75)', borderWidth:0,stack:'t'},
        {label:'Over $3M',    data:pct('over_3m'),   backgroundColor:'rgba(139,92,246,0.85)', borderWidth:0,stack:'t'},
    ]},options:{
        responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},
        plugins:{
            legend:{position:'bottom',labels:{color:'#9AAABB',boxWidth:12,padding:12,font:{size:10}}},
            tooltip:{...tooltipDef,callbacks:{label:c=>' '+c.dataset.label+': '+fmtPct(c.raw)}}
        },
        scales:{
            x:{stacked:true,grid:{color:'rgba(27,45,79,0.4)'}},
            y:{stacked:true,max:100,ticks:{callback:v=>v+'%',color:'#9AAABB'},grid:{color:'rgba(27,45,79,0.4)'}}
        }
    }});
}

// ── Chart 5: Jurisdiction ────────────────────────────────────
function buildChart5(data) {
    const ctx=document.getElementById('chart5');
    if(!ctx||!data) return;
    const labels=data.map(d=>d.jurisdiction);
    const txns  =data.map(d=>parseInt(d.transactions)||0);
    const prices=data.map(d=>parseFloat(d.avg_price)||0);

    new Chart(ctx,{type:'bar',data:{labels,datasets:[
        {type:'bar',label:'Transactions',data:txns,
            backgroundColor:labels.map((_,i)=>`rgba(29,168,138,${0.3+i*0.06})`),
            borderColor:C.martin,borderWidth:1,borderRadius:4,yAxisID:'yTxn'},
        {type:'line',label:'Avg Sale Price',data:prices,
            borderColor:C.amber,backgroundColor:C.amberA,borderWidth:2.5,
            pointBackgroundColor:C.amber,pointRadius:6,pointHoverRadius:9,
            tension:0.3,fill:false,yAxisID:'yPrice'},
    ]},options:{
        responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},
        plugins:{
            legend:{labels:{color:'#9AAABB',boxWidth:12,padding:16}},
            tooltip:{...tooltipDef,callbacks:{label:c=>c.dataset.label==='Avg Sale Price'?' '+fmtM(c.raw):' '+fmtNum(c.raw)+' transactions'}}
        },
        scales:{
            x:{grid:{color:'rgba(27,45,79,0.4)'},ticks:{color:'#9AAABB',maxRotation:30}},
            yTxn:{position:'left',grid:{color:'rgba(27,45,79,0.4)'},ticks:{color:'#9AAABB',callback:v=>v.toLocaleString()}},
            yPrice:{position:'right',grid:{display:false},ticks:{color:'#5C7088',callback:v=>fmtM(v)}},
        }
    }});
}

// ── Chart 6: CRA History ─────────────────────────────────────
function buildChart6(data) {
    const ctx=document.getElementById('chart6');
    if(!ctx||!data) return;
    const distMap={};
    data.forEach(r=>{
        const k=r.district||'Unknown';
        if(!distMap[k]) distMap[k]={};
        distMap[k][r.yr]=parseFloat(r.total_taxable)||0;
    });
    const years=[...new Set(data.map(d=>d.yr))].sort();
    const dists=Object.keys(distMap).slice(0,8);
    const palette=[C.martin,C.coral,C.teal,C.amber,C.violet,C.emerald,C.gold,C.red];

    const datasets=dists.map((dist,i)=>({
        label:dist,
        data:years.map(yr=>(distMap[dist][yr]||0)/1e6),
        borderColor:palette[i%palette.length],
        backgroundColor:palette[i%palette.length]+'22',
        borderWidth:2,pointRadius:2,pointHoverRadius:5,tension:0.4,fill:false,
    }));

    new Chart(ctx,{type:'line',data:{labels:years.map(String),datasets},options:{
        responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},
        plugins:{
            legend:{position:'bottom',labels:{color:'#9AAABB',boxWidth:12,padding:10,font:{size:10}}},
            tooltip:{...tooltipDef,callbacks:{label:c=>' '+c.dataset.label+': $'+parseFloat(c.raw).toFixed(0)+'M'}}
        },
        scales:{
            x:{grid:{color:'rgba(27,45,79,0.4)'},ticks:{color:'#9AAABB',maxRotation:45}},
            y:{grid:{color:'rgba(27,45,79,0.4)'},ticks:{color:'#9AAABB',callback:v=>'$'+v.toFixed(0)+'M'}}
        }
    }});
}

// ── Chart 7: Building Vintage ────────────────────────────────
function buildChart7(data) {
    const ctx=document.getElementById('chart7');
    if(!ctx||!data) return;
    const labels=data.map(d=>d.era);
    const counts=data.map(d=>parseInt(d.parcels)||0);
    const sqft  =data.map(d=>parseInt(d.avg_sqft)||0);

    new Chart(ctx,{type:'bar',data:{labels,datasets:[
        {type:'bar',label:'Parcels',data:counts,
            backgroundColor:labels.map((_,i)=>`rgba(29,168,138,${0.35+i*0.08})`),
            borderColor:C.martin,borderWidth:1,borderRadius:4,yAxisID:'yCount'},
        {type:'line',label:'Avg Sq Ft',data:sqft,
            borderColor:C.amber,borderWidth:2.5,pointBackgroundColor:C.amber,
            pointRadius:5,pointHoverRadius:8,tension:0.3,fill:false,yAxisID:'ySqft'},
    ]},options:{
        responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},
        plugins:{
            legend:{labels:{color:'#9AAABB',boxWidth:12,padding:16}},
            tooltip:{...tooltipDef,callbacks:{label:c=>c.dataset.label==='Avg Sq Ft'?' '+fmtNum(c.raw)+' sq ft avg':' '+fmtNum(c.raw)+' parcels'}}
        },
        scales:{
            x:{grid:{display:false},ticks:{color:'#9AAABB'}},
            yCount:{position:'left',grid:{color:'rgba(27,45,79,0.4)'},ticks:{color:'#9AAABB',callback:v=>v.toLocaleString()}},
            ySqft:{position:'right',grid:{display:false},ticks:{color:'#5C7088',callback:v=>v.toLocaleString()+' sf'}},
        }
    }});
}

// ── Chart Liquidity ──────────────────────────────────────────
function buildChartLiq(data) {
    const ctx=document.getElementById('chartLiq');
    if(!ctx||!data) return;
    const years  =data.map(d=>String(d.yr));
    const holdYrs=data.map(d=>parseFloat(d.avg_hold_years)||0);
    const pairs  =data.map(d=>parseInt(d.resale_pairs)||0);

    new Chart(ctx,{type:'line',data:{labels:years,datasets:[
        {label:'Avg Hold Period (years)',data:holdYrs,
            borderColor:C.amber,backgroundColor:C.amberA,borderWidth:3,
            pointBackgroundColor:holdYrs.map(v=>v>6?C.red:v<2?C.emerald:C.amber),
            pointRadius:5,pointHoverRadius:8,tension:0.4,fill:true,yAxisID:'yHold'},
        {type:'bar',label:'Resale Pairs',data:pairs,
            backgroundColor:'rgba(139,92,246,0.15)',borderColor:'rgba(139,92,246,0.3)',
            borderWidth:1,yAxisID:'yPairs'},
    ]},options:{
        responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},
        plugins:{
            legend:{labels:{color:'#9AAABB',boxWidth:12,padding:16}},
            tooltip:{...tooltipDef,callbacks:{label:c=>c.dataset.label.includes('Hold')?' '+parseFloat(c.raw).toFixed(2)+' years avg hold':' '+fmtNum(c.raw)+' resale pairs'}}
        },
        scales:{
            x:{grid:{color:'rgba(27,45,79,0.4)'}},
            yHold:{position:'left',grid:{color:'rgba(27,45,79,0.4)'},
                ticks:{callback:v=>v.toFixed(1)+'yr',color:'#9AAABB'},
                title:{display:true,text:'Avg Hold Period (years)',color:'#5C7088',font:{size:10}}},
            yPairs:{position:'right',grid:{display:false},ticks:{color:'#5C7088',callback:v=>v.toLocaleString()}},
        }
    }});
}

// ── Grantor Table ────────────────────────────────────────────
function buildGrantorTable(data) {
    const wrap=document.getElementById('grantorTable');
    if(!wrap||!data||!data.length){if(wrap)wrap.innerHTML='<p style="padding:24px;color:var(--text-muted)">No data available.</p>';return;}
    let html=`<table><thead><tr>
        <th>#</th><th>Grantor (Seller)</th><th>Transactions</th>
        <th>Avg Price</th><th>Total Volume</th><th>Years Active</th>
    </tr></thead><tbody>`;
    data.forEach((r,i)=>{
        const vol=(parseFloat(r.total_volume)/1e6).toFixed(1);
        html+=`<tr>
            <td class="td-mono" style="color:var(--text-muted)">${i+1}</td>
            <td class="td-martin">${r.Grantor}</td>
            <td class="td-mono">${parseInt(r.transactions).toLocaleString()}</td>
            <td class="td-green">${fmtM(r.avg_price)}</td>
            <td class="td-mono">$${vol}M</td>
            <td class="td-mono" style="color:var(--text-muted)">${r.first_yr}–${r.last_yr}</td>
        </tr>`;
    });
    wrap.innerHTML=html+'</tbody></table>';
}

// ── Timestamp ────────────────────────────────────────────────
function updateTimestamp(){
    const el=document.getElementById('timestamp');
    if(el) el.textContent=new Date().toLocaleTimeString('en-US',{hour12:false,hour:'2-digit',minute:'2-digit',second:'2-digit'});
}

document.addEventListener('DOMContentLoaded',()=>{loadData();updateTimestamp();setInterval(updateTimestamp,1000);});
