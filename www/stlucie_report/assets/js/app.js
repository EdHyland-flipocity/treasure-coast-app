'use strict';

Chart.defaults.color = '#5C7088';
Chart.defaults.borderColor = '#1B2D4F';
Chart.defaults.font.family = "'Montserrat', system-ui, sans-serif";

const FMT = {
    price: v => v >= 1000000 ? '$' + (v/1000000).toFixed(2) + 'M' : '$' + Math.round(v/1000) + 'K',
    num:   v => v ? v.toLocaleString() : '—',
    pct:   v => (v > 0 ? '+' : '') + v + '%',
};

setInterval(() => {
    const el = document.getElementById('timestamp');
    if (el) el.textContent = new Date().toTimeString().slice(0,8);
}, 1000);

async function loadData() {
    const res  = await fetch('api/data.php');
    const data = await res.json();
    if (!data.success) { console.error(data.error); return; }

    renderKPIs(data.summary, data.quarterly);
    renderChart01(data.quarterly);
    renderChart03(data.outOfState);
    renderChart04(data.buyerOrigin);
    renderChart05(data.bedrooms);
    renderChart06(data.cities);
    renderChart07(data.yearBuilt);
    renderChart08(data.sqft);
    renderMotivatedTable(data.motivated);
}

function renderKPIs(s, quarterly) {
    document.getElementById('kpiTotal').textContent   = FMT.num(s.total_sales);
    document.getElementById('kpiAvg').textContent     = FMT.price(s.avg_price);
    document.getElementById('kpiParcels').textContent = FMT.num(s.unique_parcels);
    document.getElementById('kpiOOS').textContent     = FMT.num(s.out_of_state_buyers);
    document.getElementById('kpiOOSPct').textContent  = s.oos_pct + '% of all buyers';

    const prices = quarterly.map(q => parseFloat(q.avg_price)).filter(Boolean);
    const peak   = Math.max(...prices);
    const peakQ  = quarterly[prices.indexOf(peak)];
    document.getElementById('kpiPeak').textContent     = FMT.price(peak);
    document.getElementById('kpiPeakLabel').textContent = peakQ?.label || '—';

    // 2026 vs 2025 trend
    const q2025 = quarterly.filter(q => q.yr === '2025').map(q => parseFloat(q.avg_price));
    const q2026 = quarterly.filter(q => q.yr === '2026').map(q => parseFloat(q.avg_price));
    if (q2025.length && q2026.length) {
        const avg2025 = q2025.reduce((a,b)=>a+b,0)/q2025.length;
        const avg2026 = q2026.reduce((a,b)=>a+b,0)/q2026.length;
        const pct = Math.round((avg2026-avg2025)/avg2025*100*10)/10;
        document.getElementById('kpiTrend').textContent = FMT.pct(pct);
    }
}

function renderChart01(quarterly) {
    const labels = quarterly.map(q => q.label);
    const prices = quarterly.map(q => parseFloat(q.avg_price));
    const vols   = quarterly.map(q => parseInt(q.sales));
    const peak   = Math.max(...prices.filter(Boolean));
    const peakQ  = quarterly[prices.indexOf(peak)]?.label;

    // S/R annotations
    const annotations = {
        s1: { type:'line', scaleID:'y1', value:390000, borderColor:'rgba(16,185,129,1.0)', borderWidth:1.5, borderDash:[2,2],
              label:{content:'S1 · $390K Support', enabled:true, position:'start', backgroundColor:'rgba(6,13,26,0.8)', color:'#10B981', font:{size:9}, padding:3} },
        s2: { type:'line', scaleID:'y1', value:374000, borderColor:'rgba(16,185,129,0.7)', borderWidth:1.5, borderDash:[4,3],
              label:{content:'S2 · $374K Base', enabled:true, position:'start', backgroundColor:'rgba(6,13,26,0.8)', color:'#10B981', font:{size:9}, padding:3} },
        r1: { type:'line', scaleID:'y1', value:403000, borderColor:'rgba(239,68,68,0.8)', borderWidth:1.5, borderDash:[4,3],
              label:{content:'R3 · $403K Peak', enabled:true, position:'end', backgroundColor:'rgba(6,13,26,0.8)', color:'#EF4444', font:{size:9}, padding:3} },
        pp: { type:'line', scaleID:'y1', value:387000, borderColor:'rgba(212,160,23,0.8)', borderWidth:2, borderDash:[3,3],
              label:{content:'PP · $387K Pivot', enabled:true, position:'center', backgroundColor:'rgba(6,13,26,0.85)', color:'#D4A017', font:{size:9,weight:'bold'}, padding:3} },
        accumZone: { type:'box', scaleID:'y1', yMin:351000, yMax:390000, backgroundColor:'rgba(16,185,129,0.05)', borderColor:'transparent' },
        distZone:  { type:'box', scaleID:'y1', yMin:403000, yMax:450000, backgroundColor:'rgba(239,68,68,0.05)', borderColor:'transparent' },
    };

    document.getElementById('insight01').textContent =
        `● Peak: ${FMT.price(peak)} (${peakQ}) — 2026 showing softness below pivot`;

    new Chart(document.getElementById('chart01'), {
        data: {
            labels,
            datasets: [
                { type:'bar', label:'Sales Volume', data:vols,
                  backgroundColor:'rgba(42,191,176,0.25)', borderColor:'rgba(42,191,176,0.5)', borderWidth:1, yAxisID:'y2' },
                { type:'line', label:'Avg Sale Price', data:prices,
                  borderColor:'#2ABFB0', backgroundColor:'rgba(42,191,176,0.08)',
                  borderWidth:2.5, pointRadius:5, pointBackgroundColor:'#2ABFB0', tension:0.3, yAxisID:'y1', fill:true }
            ]
        },
        options: {
            responsive:true, maintainAspectRatio:false,
            interaction:{mode:'index',intersect:false},
            plugins:{ legend:{position:'top'}, annotation:{annotations} },
            scales: {
                y1:{position:'left', ticks:{callback:v=>FMT.price(v)}, grid:{color:'#1B2D4F'}, min:300000},
                y2:{position:'right', grid:{display:false}, ticks:{callback:v=>v.toLocaleString()}},
                x:{grid:{color:'#1B2D4F'}}
            }
        }
    });
}

function renderChart03(outOfState) {
    const labels = outOfState.map(o => o.State);
    const buyers = outOfState.map(o => parseInt(o.buyers));
    const prices = outOfState.map(o => parseFloat(o.avg_price));
    const colors = ['#EF4444','#E8823A','#C9A84C','#10B981','#2ABFB0','#8B5CF6','#EC4899',
                    '#F59E0B','#06B6D4','#84CC16','#F97316','#A78BFA','#34D399','#60A5FA','#FB7185'];

    document.getElementById('insight03').textContent =
        `● NY leads out-of-state buyers (${buyers[0]}) — ${outOfState.length} states represented`;

    new Chart(document.getElementById('chart03'), {
        data: {
            labels,
            datasets: [
                { type:'bar', label:'Buyers', data:buyers,
                  backgroundColor:colors.map(c=>c+'99'), borderColor:colors, borderWidth:1, yAxisID:'y2' },
                { type:'line', label:'Avg Price', data:prices,
                  borderColor:'#C9A84C', backgroundColor:'transparent',
                  borderWidth:2, pointRadius:5, pointBackgroundColor:'#C9A84C', tension:0.2, yAxisID:'y1' }
            ]
        },
        options: {
            responsive:true, maintainAspectRatio:false,
            interaction:{mode:'index',intersect:false},
            plugins:{legend:{position:'top'}},
            scales: {
                y1:{position:'left', ticks:{callback:v=>FMT.price(v)}, grid:{color:'#1B2D4F'}},
                y2:{position:'right', grid:{display:false}},
                x:{grid:{color:'#1B2D4F'}}
            }
        }
    });
}

function renderChart04(buyerOrigin) {
    const labels  = buyerOrigin.map(b => b.label);
    const fl      = buyerOrigin.map(b => parseInt(b.fl_buyers));
    const oos     = buyerOrigin.map(b => parseInt(b.out_of_state));
    const totals  = buyerOrigin.map((b,i) => fl[i] + oos[i]);
    const oosPct  = buyerOrigin.map((b,i) => totals[i] > 0 ? Math.round(oos[i]/totals[i]*100) : 0);
    const avgOOS  = Math.round(oosPct.reduce((a,b)=>a+b,0)/oosPct.length);

    document.getElementById('insight04').textContent =
        `● Average out-of-state share: ${avgOOS}% — investor migration clearly visible in 2024–2025`;

    new Chart(document.getElementById('chart04'), {
        data: {
            labels,
            datasets: [
                { type:'bar', label:'FL Buyers', data:fl,
                  backgroundColor:'rgba(42,191,176,0.4)', borderColor:'#2ABFB0', borderWidth:1 },
                { type:'bar', label:'Out-of-State', data:oos,
                  backgroundColor:'rgba(239,68,68,0.4)', borderColor:'#EF4444', borderWidth:1 },
                { type:'line', label:'OOS %', data:oosPct,
                  borderColor:'#C9A84C', backgroundColor:'transparent',
                  borderWidth:2, pointRadius:4, pointBackgroundColor:'#C9A84C', tension:0.3, yAxisID:'y2' }
            ]
        },
        options: {
            responsive:true, maintainAspectRatio:false,
            interaction:{mode:'index',intersect:false},
            plugins:{legend:{position:'top'}},
            scales: {
                y:{stacked:false, grid:{color:'#1B2D4F'}},
                y2:{position:'right', grid:{display:false}, ticks:{callback:v=>v+'%'}, max:50},
                x:{grid:{color:'#1B2D4F'}}
            }
        }
    });
}

function renderChart05(bedrooms) {
    const labels = bedrooms.map(b => b.Bedrooms + ' BR');
    const sales  = bedrooms.map(b => parseInt(b.sales));
    const prices = bedrooms.map(b => parseFloat(b.avg_price));
    const colors = ['#8B5CF6','#2ABFB0','#C9A84C','#E8823A','#EF4444','#EC4899'];

    document.getElementById('insight05').textContent =
        `● 3BR dominates (${FMT.num(bedrooms.find(b=>b.Bedrooms==='3')?.sales)} sales) — 5BR avg ${FMT.price(bedrooms.find(b=>b.Bedrooms==='5')?.avg_price)}`;

    new Chart(document.getElementById('chart05'), {
        data: {
            labels,
            datasets: [
                { type:'bar', label:'Sales Volume', data:sales,
                  backgroundColor:colors.map(c=>c+'66'), borderColor:colors, borderWidth:1, yAxisID:'y2' },
                { type:'line', label:'Avg Price', data:prices,
                  borderColor:'#C9A84C', backgroundColor:'transparent',
                  borderWidth:2.5, pointRadius:8, pointBackgroundColor:colors, tension:0.2, yAxisID:'y1' }
            ]
        },
        options: {
            responsive:true, maintainAspectRatio:false,
            interaction:{mode:'index',intersect:false},
            plugins:{legend:{position:'top'}},
            scales: {
                y1:{position:'left', ticks:{callback:v=>FMT.price(v)}, grid:{color:'#1B2D4F'}},
                y2:{position:'right', grid:{display:false}},
                x:{grid:{color:'#1B2D4F'}}
            }
        }
    });
}

function renderChart06(cities) {
    const labels = cities.map(c => c.city_name.split(' ').map(w=>w[0]+w.slice(1).toLowerCase()).join(' '));
    const sales  = cities.map(c => parseInt(c.sales));
    const prices = cities.map(c => parseFloat(c.avg_price));

    document.getElementById('insight06').textContent =
        `● Port St. Lucie dominates volume — ${cities.length} municipalities tracked`;

    new Chart(document.getElementById('chart06'), {
        data: {
            labels,
            datasets: [
                { type:'bar', label:'Total Sales', data:sales,
                  backgroundColor:'rgba(42,191,176,0.3)', borderColor:'#2ABFB0', borderWidth:1, yAxisID:'y2' },
                { type:'line', label:'Avg Price', data:prices,
                  borderColor:'#C9A84C', backgroundColor:'transparent',
                  borderWidth:2, pointRadius:5, pointBackgroundColor:'#C9A84C', tension:0.2, yAxisID:'y1' }
            ]
        },
        options: {
            responsive:true, maintainAspectRatio:false,
            interaction:{mode:'index',intersect:false},
            plugins:{legend:{position:'top'}},
            scales: {
                y1:{position:'left', ticks:{callback:v=>FMT.price(v)}, grid:{color:'#1B2D4F'}},
                y2:{position:'right', grid:{display:false}},
                x:{grid:{color:'#1B2D4F'}}
            }
        }
    });
}

function renderChart07(yearBuilt) {
    const labels = yearBuilt.map(y => y.era);
    const sales  = yearBuilt.map(y => parseInt(y.sales));
    const prices = yearBuilt.map(y => parseFloat(y.avg_price));
    const newEra = yearBuilt.find(y=>y.era==='2020+');
    const oldEra = yearBuilt.find(y=>y.era==='Pre-1980');
    const premium = newEra && oldEra ? Math.round((newEra.avg_price - oldEra.avg_price)/oldEra.avg_price*100) : 0;

    document.getElementById('insight07').textContent =
        `● New construction (2020+) commands +${premium}% premium over pre-1980 homes`;

    new Chart(document.getElementById('chart07'), {
        data: {
            labels,
            datasets: [
                { type:'bar', label:'Sales', data:sales,
                  backgroundColor:'rgba(139,92,246,0.3)', borderColor:'#8B5CF6', borderWidth:1, yAxisID:'y2' },
                { type:'line', label:'Avg Price', data:prices,
                  borderColor:'#2ABFB0', backgroundColor:'rgba(42,191,176,0.1)',
                  borderWidth:2.5, pointRadius:7, pointBackgroundColor:'#2ABFB0', tension:0.3, yAxisID:'y1', fill:true }
            ]
        },
        options: {
            responsive:true, maintainAspectRatio:false,
            interaction:{mode:'index',intersect:false},
            plugins:{legend:{position:'top'}},
            scales: {
                y1:{position:'left', ticks:{callback:v=>FMT.price(v)}, grid:{color:'#1B2D4F'}},
                y2:{position:'right', grid:{display:false}},
                x:{grid:{color:'#1B2D4F'}}
            }
        }
    });
}

function renderChart08(sqft) {
    const labels = sqft.map(s => s.size_band + ' sqft');
    const sales  = sqft.map(s => parseInt(s.sales));
    const ppsf   = sqft.map(s => parseFloat(s.avg_ppsf));
    const prices = sqft.map(s => parseFloat(s.avg_price));
    const bestPPSF = Math.max(...ppsf.filter(Boolean));
    const bestBand = sqft[ppsf.indexOf(bestPPSF)]?.size_band;

    document.getElementById('insight08').textContent =
        `● Best value density: ${bestBand} sqft at $${bestPPSF}/sqft — small homes carry the highest PPSF`;

    new Chart(document.getElementById('chart08'), {
        data: {
            labels,
            datasets: [
                { type:'bar', label:'Sales Volume', data:sales,
                  backgroundColor:'rgba(201,168,76,0.25)', borderColor:'#C9A84C', borderWidth:1, yAxisID:'y3' },
                { type:'line', label:'Avg Price', data:prices,
                  borderColor:'#2ABFB0', backgroundColor:'transparent',
                  borderWidth:2, pointRadius:5, pointBackgroundColor:'#2ABFB0', tension:0.2, yAxisID:'y1' },
                { type:'line', label:'Price Per SqFt', data:ppsf,
                  borderColor:'#EF4444', backgroundColor:'transparent',
                  borderWidth:2, pointRadius:5, pointBackgroundColor:'#EF4444', tension:0.2, yAxisID:'y2' }
            ]
        },
        options: {
            responsive:true, maintainAspectRatio:false,
            interaction:{mode:'index',intersect:false},
            plugins:{legend:{position:'top'}},
            scales: {
                y1:{position:'left', ticks:{callback:v=>FMT.price(v)}, grid:{color:'#1B2D4F'}},
                y2:{position:'right', grid:{display:false}, ticks:{callback:v=>'$'+v+'/sf'}},
                y3:{display:false},
                x:{grid:{color:'#1B2D4F'}}
            }
        }
    });
}

function renderMotivatedTable(motivated) {
    const tbody = document.getElementById('motivatedBody');
    if (!motivated || !motivated.length) {
        tbody.innerHTML = '<tr><td colspan="9" class="loading-row">No data</td></tr>';
        return;
    }
    tbody.innerHTML = motivated.map(m => `
        <tr>
            <td style="color:var(--teal-light);font-size:10px">${m.Situs || '—'}</td>
            <td title="${m.Grantor}">${(m.Grantor||'').substring(0,22)}${(m.Grantor||'').length>22?'…':''}</td>
            <td title="${m.Grantee}">${(m.Grantee||'').substring(0,22)}${(m.Grantee||'').length>22?'…':''}</td>
            <td style="color:var(--gold-light);font-weight:600">${m['Sale Price']||'—'}</td>
            <td>${m['Sale Date']||'—'}</td>
            <td>${m.Bedrooms||'—'}bd/${m.Bathrooms||'—'}ba</td>
            <td>${m.sqft ? parseInt(m.sqft).toLocaleString() : '—'}</td>
            <td>${m['Year Built']||'—'}</td>
            <td><span class="state-badge">${m.mailing_state||'—'}</span></td>
        </tr>
    `).join('');
}

loadData();
