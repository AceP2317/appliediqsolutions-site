import { useState, useMemo, useEffect, useRef, createContext, useContext } from "react";
// xlsx is loaded lazily inside exportXlsx() so its ~480 KB chunk stays off the
// initial bundle — export is a secondary action.

/* ====================== ENGINE — START ======================
   Order Confirmation Command Center — synthetic generator + pure engine.
   Northpoint Manufacturing (fictional). No real data, no real process.
   A deterministic seed builds two sample weeks of order-confirmation
   root-cause data; the engine below aggregates them. OCR = confirmed /
   (confirmed + unconfirmed) units. Lower unconfirmed = better.
   ============================================================ */

const COMPANY = "Northpoint Manufacturing";
const SEED = 20260626;
const WEEKS = ["Wk 24", "Wk 26"];          // prior, current
const PRIOR = "Wk 24", CURRENT = "Wk 26";

/* five-bucket canonical rollup (cause -> category) */
const CAT_ORDER = ["Forecasting", "Logistics", "Supply", "Customer", "Other"];
const CAT_MAP = {
  "Under Forecasted":"Forecasting", "Stock in Staging Buffer":"Forecasting",
  "Obsolete":"Forecasting", "Insufficient Lead Time (Regional DC)":"Forecasting",
  "Late Inbound (Overseas)":"Logistics", "Late Inbound (Local)":"Logistics",
  "Delivery Not Created":"Logistics", "System Date Error":"Logistics",
  "Insufficient Production":"Supply", "Quality Hold":"Supply",
  "Loss of Supply":"Supply", "Insufficient Receipts (Overseas)":"Supply",
  "Unrealistic RDD":"Customer", "Needs Investigation":"Other",
};
// the demo's SECONDARY rollup deliberately mislabels two causes, so the
// reconciliation check in the Data view has something real to catch.
const SECONDARY_ROLLUP = { ...CAT_MAP,
  "Stock in Staging Buffer":"Logistics",                 // canonical: Forecasting
  "Insufficient Lead Time (Regional DC)":"Customer",     // canonical: Forecasting
};

// classification waterfall (first match wins) — priority order
const WATERFALL = [
  "System Date Error","Unrealistic RDD","Obsolete","Late Inbound (Overseas)",
  "Late Inbound (Local)","Delivery Not Created","Stock in Staging Buffer",
  "Insufficient Lead Time (Regional DC)","Quality Hold","Insufficient Production",
  "Loss of Supply","Insufficient Receipts (Overseas)","Under Forecasted","Needs Investigation",
];

// per-week unconfirmed-unit targets per cause (the narrative shape)
const TARGETS = {
  "Wk 24":{
    "Under Forecasted":660, "Stock in Staging Buffer":360, "Obsolete":55, "Insufficient Lead Time (Regional DC)":110,
    "Late Inbound (Overseas)":560, "Late Inbound (Local)":150, "Delivery Not Created":250, "System Date Error":5,
    "Insufficient Production":175, "Quality Hold":25, "Loss of Supply":85, "Insufficient Receipts (Overseas)":110,
    "Unrealistic RDD":210, "Needs Investigation":90,
  },
  "Wk 26":{
    "Under Forecasted":410, "Stock in Staging Buffer":210, "Obsolete":95, "Insufficient Lead Time (Regional DC)":70,
    "Late Inbound (Overseas)":520, "Late Inbound (Local)":60, "Delivery Not Created":180, "System Date Error":25,
    "Insufficient Production":400, "Quality Hold":140, "Loss of Supply":30, "Insufficient Receipts (Overseas)":120,
    "Unrealistic RDD":60, "Needs Investigation":20,
  },
};
const CONF = { "Wk 24":25050, "Wk 26":28500 };   // confirmed units per week
const ASOF = { "Wk 24":"2026-06-15", "Wk 26":"2026-06-29" };

// fictional dimensions
const REGIONS  = ["US","CA"];
const DIVISIONS = ["Cooking","Cooling","Laundry","Dishwashing","Built-in","Small Appliances"];
const SITES = { US:["RDC-ATL","RDC-DFW","RDC-CHI","RDC-SEA","CDC-WEST","CDC-EAST"], CA:["RDC-TOR","RDC-VAN"] };
const CUSTOMERS = [
  "Cardinal Appliance Group","Summit Retail Partners","Harbor Home Distributors",
  "Granite State Appliance","Meridian Appliance Co-op","Lakeside Dealers Alliance",
  "Ironwood Retail Group","Coastal Appliance Supply","Northern Tier Distributors",
  "Beacon Home Goods","Tradewind Appliance Co.","Sterling Dealers Network",
  "Cascade Appliance Partners","Keystone Home Supply",
];
// per-customer target order-confirmation rate -> red-list (0,4,2), watch (7,9), healthy rest
const CUST_TARGET_OCR = CUSTOMERS.map((_,i)=>
  i===0?0.58 : i===4?0.63 : i===2?0.69 : i===7?0.84 : i===9?0.88 : 0.94 + ((i*7)%6)*0.01);
const SUP_BY_CAUSE = {
  "Late Inbound (Overseas)":"Overseas","Insufficient Receipts (Overseas)":"Overseas",
}; // default Local

const ACTIONS = {
  "Insufficient Production":["Escalate the short build to plant scheduling; confirm next firm production slot.","Check for a substitute build location or flex line that can absorb the volume.","Re-promise affected orders to the recovered date; notify the dealers proactively."],
  "Quality Hold":["Pull the QN; get disposition ETA from quality before re-promising.","Quarantine vs. rework decision drives the date — get it in writing.","If hold clears, expedite the release so the stock re-enters pickable inventory."],
  "Late Inbound (Overseas)":["Confirm the vessel/container ETA against the promise date.","If the import slips, look for domestic substitute stock to cover near-term.","Update the confirmed date to the realistic arrival; flag at-risk dealers."],
  "Late Inbound (Local)":["Chase the local STO/transfer; confirm pick and load at the source DC.","Check for closer pickable stock that can satisfy the order sooner."],
  "Under Forecasted":["Feed the miss back to demand planning for the next forecast cycle.","Check whether a safety-stock or min level should rise for this item.","Where possible, pull a future receipt forward to cover the gap."],
  "Stock in Staging Buffer":["Stock exists but sits in a staging buffer — raise a move order to pickable.","Confirm the put-away/move SLA; this is a placement fix, not a supply fix."],
  "Delivery Not Created":["Stock is available — create/confirm the outbound delivery to release it.","Check the delivery-block reason; clear it and re-run the confirmation."],
  "Unrealistic RDD":["The requested date is inside lead time — align the dealer on the earliest feasible date.","Educate on standard lead time; capture the realistic RDD to stop repeat misses."],
  "Insufficient Lead Time (Regional DC)":["Order placed inside the regional DC's handling window — re-promise to the feasible date.","Review the DC's lead-time parameter if this recurs for the lane."],
  "Obsolete":["Item is phasing out — confirm successor SKU and redirect the order.","If truly obsolete, work the dealer to the replacement; close the line cleanly."],
  "Loss of Supply":["Supply source disrupted — confirm the recovery plan and revised availability.","Hold dealer communication until a credible date exists; avoid false promises."],
  "Insufficient Receipts (Overseas)":["Inbound import receipts short of demand — confirm the next container's contents.","Look for partial-ship options to cover the most at-risk dealers first."],
  "System Date Error":["Date signal looks wrong (past/blank cRDD) — correct the source date and re-confirm.","Route to data stewardship if the bad date pattern repeats."],
  "Needs Investigation":["No single signal dominates — open the line and inspect inventory, dates, and flags.","Reclassify once the driver is confirmed so it leaves this bucket."],
};

/* ---- deterministic PRNG (mulberry32) ---------------------------------- */
function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0;
  let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t;
  return ((t^t>>>14)>>>0)/4294967296; }; }
const pick = (rng,arr)=> arr[Math.floor(rng()*arr.length)];
const ri   = (rng,lo,hi)=> lo + Math.floor(rng()*(hi-lo+1));

/* ---- reason strings (plain-language, cite synthetic values) ----------- */
function reasonFor(det, uq, site, sup){
  switch(det){
    case "Insufficient Production": return `Local build short by ${uq} units; no pickable buffer to cover the gap.`;
    case "Quality Hold": return `${uq} units sit on a quality hold at ${site}; not releasable until disposition clears.`;
    case "Late Inbound (Overseas)": return `${uq} units depend on an overseas inbound (${sup}) arriving after the requested date.`;
    case "Late Inbound (Local)": return `${uq} units await a local transfer into ${site}; pick/load not yet confirmed.`;
    case "Under Forecasted": return `Demand exceeded forecast by ${uq} units; no receipt scheduled in time.`;
    case "Stock in Staging Buffer": return `${uq} units on hand but parked in a staging buffer, not yet in pickable stock.`;
    case "Delivery Not Created": return `Stock available for ${uq} units, but no outbound delivery was created to release it.`;
    case "Unrealistic RDD": return `Requested date falls inside lead time for ${uq} units; earliest feasible date is later.`;
    case "Insufficient Lead Time (Regional DC)": return `Order placed inside ${site}'s handling window; ${uq} units can't make the date.`;
    case "Obsolete": return `${uq} units of a phasing-out item; successor SKU should carry the order.`;
    case "Loss of Supply": return `Supply disruption removed coverage for ${uq} units; recovery date pending.`;
    case "Insufficient Receipts (Overseas)": return `Overseas receipts short by ${uq} units against open demand.`;
    case "System Date Error": return `Date signal invalid (blank/past cRDD) on ${uq} units; needs correction before it can confirm.`;
    default: return `${uq} units unconfirmed; no single signal dominates — needs investigation.`;
  }
}

/* ---- synthetic builder ------------------------------------------------ */
function buildData(seed){
  const rng = mulberry32(seed>>>0);
  const meta={}, cubes={}, customers={}, linesAll=[];
  // per-week customer order weights, biased to create WoW deteriorations
  const baseW = CUSTOMERS.map((_,i)=> 1 + (i%5)*0.6);
  const weekBias = {
    "Wk 24": CUSTOMERS.map(()=>1),
    // current week: spike a few specific customers (crisis red-list + WoW jump)
    "Wk 26": CUSTOMERS.map((_,i)=> i===0?3.6 : i===4?2.8 : i===2?2.1 : i===7?1.6 : 1),
  };

  WEEKS.forEach(wk=>{
    const tg = TARGETS[wk];
    const cube = { category:{}, detailed:{}, region:{}, division:{}, site:{}, locType:{}, supplier:{}, country:{} };
    CAT_ORDER.forEach(c=> cube.category[c]=[0,0,0]);
    const custUnconf = {}; CUSTOMERS.forEach(n=> custUnconf[n]=0);
    const wgt = baseW.map((b,i)=> b*weekBias[wk][i]);
    const wsum = wgt.reduce((a,b)=>a+b,0);
    const custWeighted = (r)=>{ let x=r*wsum; for(let i=0;i<CUSTOMERS.length;i++){ x-=wgt[i]; if(x<=0) return CUSTOMERS[i]; } return CUSTOMERS[CUSTOMERS.length-1]; };

    let weekUnconf=0;
    Object.keys(tg).forEach(det=>{
      let remaining = tg[det];
      const cat = CAT_MAP[det];
      const sup = SUP_BY_CAUSE[det] || "Local";
      while(remaining>0){
        const uq = Math.min(remaining, ri(rng,1,12));
        remaining -= uq;
        const rg = pick(rng, REGIONS);
        const site = pick(rng, SITES[rg]);
        const loc = site.startsWith("CDC")? "CDC":"RDC";
        const dv = pick(rng, DIVISIONS);
        const cust = custWeighted(rng());
        const mat = "NP-" + ri(rng,10000,99999);
        const prod = "NP-" + pick(rng,["RF","WL","DW","OV","CT","HD"]) + ri(rng,10,99);
        const doc = "" + ri(rng,4200000000,4299999999);
        const it = "" + (ri(rng,1,40)*10);
        const day = ri(rng,8,28), mon = wk===PRIOR?"06":"06";
        const crdd = String(day).padStart(2,"0")+"."+mon+".2026";
        const cq = rng()<0.25? ri(rng,1,uq):0;     // some lines partially confirmed
        const oq = uq + cq;
        linesAll.push({ wk, rg, dv, site, cust, mat, prod, doc, it, loc, sup,
          crdd, oq, uq, cq, cat, det, rsn: reasonFor(det, uq, site, sup) });
        // aggregates
        cube.category[cat][2]+=uq; cube.category[cat][0]+=oq; cube.category[cat][1]+=cq;
        (cube.detailed[det]=cube.detailed[det]||[0,0,0])[2]+=uq;
        (cube.region[rg]=cube.region[rg]||[0,0,0])[2]+=uq;
        (cube.division[dv]=cube.division[dv]||[0,0,0])[2]+=uq;
        (cube.site[site]=cube.site[site]||[0,0,0])[2]+=uq;
        (cube.locType[loc]=cube.locType[loc]||[0,0,0])[2]+=uq;
        (cube.supplier[sup]=cube.supplier[sup]||[0,0,0])[2]+=uq;
        (cube.country[rg]=cube.country[rg]||[0,0,0])[2]+=uq;
        custUnconf[cust]+=uq;
        weekUnconf+=uq;
      }
    });

    // distribute confirmed across categories by weight to give believable OCR
    const conf = CONF[wk];
    const cw = { Forecasting:0.32, Logistics:0.30, Supply:0.22, Customer:0.10, Other:0.06 };
    CAT_ORDER.forEach(c=>{ const add=Math.round(conf*cw[c]); cube.category[c][1]+=add; cube.category[c][0]+=add; });
    const order = conf + weekUnconf;

    // customer scorecard rows: order sized from a target OCR so a real
    // red-list emerges (crisis customers carry a high unconfirmed fraction)
    const custObj={};
    CUSTOMERS.forEach((n,i)=>{
      const tOCR = CUST_TARGET_OCR[i];
      const cUnconf = custUnconf[n];
      if(cUnconf<=0) return;
      const cOrder = Math.max(cUnconf, Math.round(cUnconf/Math.max(0.03,(1-tOCR))));
      const cConf = Math.max(0, cOrder - cUnconf);
      custObj[n] = [cOrder, cConf, cUnconf];
    });
    customers[wk]=custObj;

    meta[wk] = { asof:ASOF[wk], order, conf, unconf:weekUnconf,
      ocr: Math.round(conf/(conf+weekUnconf)*10000)/100,
      lines: 12000 + Math.round(rng()*1500),
      uncLines: linesAll.filter(l=>l.wk===wk).length };
    cubes[wk]=cube;
  });

  // customerKPI (union set for scorecard) — current-week order desc
  const curCust = customers[CURRENT];
  const customerKPI = Object.entries(curCust)
    .map(([name,v])=>({name, order:v[0], conf:v[1], unconf:v[2]}))
    .sort((a,b)=> b.order-a.order);

  // FTL: 11-week confirmation% sparkline per scorecard customer
  const ftlWeeks = Array.from({length:11},(_,i)=> (16+i)+".2026");
  const ftlRows = CUSTOMERS.map((name,i)=>{
    const r2 = mulberry32((seed^(i+1)*2654435761)>>>0);
    let base = 70 + r2()*22;
    const series = ftlWeeks.map(()=>{ base += (r2()-0.5)*16; base=Math.max(38,Math.min(99,base)); return Math.round(base*10)/10; });
    return { id:"50100"+String(10001+i), name, series, wow: Math.round((series[10]-series[9])*10)/10 };
  });

  return { company:COMPANY, weeks:WEEKS, meta, cubes, lines:linesAll, customers,
    customerKPI, ftl:{weeks:ftlWeeks, rows:ftlRows},
    catMap:CAT_MAP, secondaryRollup:SECONDARY_ROLLUP, catMismatch:[], actions:ACTIONS };
}

/* ---- pure engine ------------------------------------------------------ */
const num = (x)=> (typeof x==="number" && isFinite(x))? x : 0;
const ocrOf = (conf,unconf)=> (conf+unconf)>0 ? conf/(conf+unconf)*100 : 0;

function metaFor(D, wk){ return D.meta[wk]; }
function catRows(D, wk, otherWk){
  const c=D.cubes[wk].category, o=D.cubes[otherWk]?.category||{};
  return CAT_ORDER.map(cat=>{ const a=c[cat]||[0,0,0], b=o[cat]||[0,0,0];
    return { cat, order:a[0], conf:a[1], unconf:a[2], rate:ocrOf(a[1],a[2]), wow:a[2]-b[2], prevUnconf:b[2] }; });
}
function causeRows(D, wk, otherWk, catFilter){
  const c=D.cubes[wk].detailed, o=D.cubes[otherWk]?.detailed||{};
  const keys=new Set([...Object.keys(c),...Object.keys(o)]); let rows=[];
  keys.forEach(k=>{ if(!k) return; const cat=D.catMap[k]||"Other"; if(catFilter && cat!==catFilter) return;
    const a=c[k]||[0,0,0], b=o[k]||[0,0,0];
    rows.push({ cause:k, cat, unconf:a[2], wow:a[2]-b[2], prevUnconf:b[2], actions:D.actions[k]||[] }); });
  rows.sort((x,y)=> y.unconf-x.unconf); return rows;
}
function moverRows(D, wk, otherWk){ return causeRows(D,wk,otherWk,null).slice().sort((a,b)=> b.wow-a.wow); }
const DIM_FIELD = { region:"rg", division:"dv", site:"site", supplier:"sup", locType:"loc", customer:"cust" };
function dimAgg(D, wk, dim, flt){
  const f=DIM_FIELD[dim]; const map=new Map();
  for(const ln of D.lines){ if(ln.wk!==wk) continue;
    if(flt?.cause && ln.det!==flt.cause) continue;
    if(flt?.cat && (D.catMap[ln.det]||"Other")!==flt.cat) continue;
    const k=ln[f]||"(blank)"; map.set(k,(map.get(k)||0)+num(ln.uq)); }
  return [...map.entries()].map(([k,v])=>({k,v})).sort((a,b)=> b.v-a.v);
}
function lineRows(D, wk, flt){
  let rows=D.lines.filter(ln=> ln.wk===wk);
  if(flt?.cat) rows=rows.filter(ln=> (D.catMap[ln.det]||"Other")===flt.cat);
  if(flt?.cause) rows=rows.filter(ln=> ln.det===flt.cause);
  if(flt?.region) rows=rows.filter(ln=> ln.rg===flt.region);
  if(flt?.division) rows=rows.filter(ln=> ln.dv===flt.division);
  if(flt?.site) rows=rows.filter(ln=> ln.site===flt.site);
  if(flt?.supplier) rows=rows.filter(ln=> ln.sup===flt.supplier);
  if(flt?.customer) rows=rows.filter(ln=> ln.cust===flt.customer);
  if(flt?.q){ const q=flt.q.toLowerCase();
    rows=rows.filter(ln=> [ln.cust,ln.prod,ln.mat,ln.doc,ln.det,ln.site].join(" ").toLowerCase().includes(q)); }
  return rows.sort((a,b)=> b.uq-a.uq);
}
const _norm = (s)=> (s||"").toUpperCase().replace(/[^A-Z0-9]/g,"");
function customerScorecard(D, wk, otherWk){
  const ftlMap=new Map(D.ftl.rows.map(r=>[_norm(r.name),r]));
  const prev=D.customers[otherWk]||{}, cur=D.customers[wk]||{};
  const fromKPI=new Map(D.customerKPI.map(r=>[r.name,r]));
  const names=new Set([...Object.keys(cur),...fromKPI.keys()]); let rows=[];
  names.forEach(name=>{
    const a=cur[name]||(fromKPI.get(name)?[fromKPI.get(name).order,fromKPI.get(name).conf,fromKPI.get(name).unconf]:[0,0,0]);
    const b=prev[name]||[0,0,0];
    if(num(a[2])<=0 && num(b[2])<=0) return;
    const ftl=ftlMap.get(_norm(name))||null;
    rows.push({ name, order:a[0], conf:a[1], unconf:a[2], rate:ocrOf(a[1],a[2]),
      wow:a[2]-b[2], prevUnconf:b[2], ftl:ftl?ftl.series:null, ftlWow:ftl?ftl.wow:null }); });
  rows.sort((x,y)=> y.unconf-x.unconf); return rows;
}
function unconfStatus(S, wow){
  if(wow<=-1) return { color:S.success, arrow:"\u25Bc", word:"improving" };
  if(wow>=20) return { color:S.risk, arrow:"\u25B2", word:"deteriorating" };
  if(wow>0)   return { color:S.warning, arrow:"\u25B2", word:"worsening" };
  return { color:S.muted, arrow:"\u25A0", word:"flat" };
}
function rateStatus(S, rate){ if(rate>=95) return S.success; if(rate>=90) return S.warning; return S.risk; }

/* ======================= ENGINE — END ======================= */


/* ---- vivid portfolio theme (light / dark) ----------------------------- */
const ACCENT = "#6366F1", ACCENT2 = "#A855F7", CYAN = "#06B6D4";
const THEME = {
  dark:{ bg:"#0B0F1A", surface:"#141A2A", surfaceAlt:"#1C2436", border:"#2A3550",
    text:"#F8FAFC", textSec:"#CBD5E1", muted:"#7C8BA8", grid:"#1C2436", track:"#283450",
    success:"#34D399", warning:"#FBBF24", risk:"#FB7185" },
  light:{ bg:"#F6F7FC", surface:"#FFFFFF", surfaceAlt:"#F1F3FB", border:"#E3E7F2",
    text:"#0F172A", textSec:"#475569", muted:"#94A3B8", grid:"#EEF1F8", track:"#E7EAF4",
    success:"#10B981", warning:"#F59E0B", risk:"#F43F5E" },
};
const CAT_HUE = { Forecasting:"#6366F1", Logistics:"#06B6D4", Supply:"#A855F7", Customer:"#F59E0B", Other:"#64748B" };
const FONT_H = '"Inter","Segoe UI",system-ui,sans-serif';
const FONT_B = '"Inter","Segoe UI",system-ui,sans-serif';
const fmt = (n)=> Math.round(num(n)).toLocaleString("en-US");
const pct = (n,d=1)=> (num(n)).toFixed(d);

const GLOSSARY = {
  "OCR":"Order Confirmation Rate — the share of ordered units that can be confirmed complete on the calculated requested delivery date. Higher is better.",
  "Unconfirmed":"Ordered units that could NOT be confirmed on the requested date — the volume that needs a root cause and an action.",
  "Confirmed":"Ordered units confirmed complete on time. No action needed; the good half of the denominator.",
  "WoW":"Week over week — the change from the prior sample week to the current one. For unconfirmed units, a fall is an improvement.",
  "cRDD":"Calculated Requested Delivery Date — entry date plus dispatch, pick/pack, and transit days, or the customer's requested date if that is later.",
  "RDD":"Requested Delivery Date entered by the customer.",
  "Root Cause Category":"The five-bucket rollup of every miss: Forecasting, Logistics, Supply, Customer, Other.",
  "Detailed Root Cause":"The specific reason a line went unconfirmed, assigned by a first-match-wins waterfall over the signal columns.",
  "Waterfall":"The classification walks causes in a fixed priority order and stops at the first criterion a line satisfies, so a line with several problems is booked to the highest-priority one.",
  "Stock in Staging Buffer":"Stock is on hand but parked in a staging buffer instead of pickable distribution stock — a placement problem, booked to Forecasting.",
  "Staging Buffer":"A holding location feeding a distribution center; stock there must be moved before it can pick against an order.",
  "RDC":"Regional Distribution Center — pickable, ships to customers.",
  "CDC":"Central Distribution Center — feeds the regional DCs.",
  "Overseas":"Supply sourced via overseas import — long lead, container and customs exposure.",
  "Local":"Supply sourced domestically via a transfer between sites — shorter lead than overseas import.",
};

/* ---- tooltip layer (fixed-position, scroll-safe) ---------------------- */
const TipCtx = createContext(null);
function TipProvider({ children }){
  const [tip, setTip] = useState(null);
  const show=(content,e)=> setTip({content,x:e.clientX,y:e.clientY});
  const move=(e)=> setTip(t=> t?{...t,x:e.clientX,y:e.clientY}:t);
  const hide=()=> setTip(null);
  return <TipCtx.Provider value={{show,move,hide}}>{children}
    {tip && <TipLayer tip={tip}/>}</TipCtx.Provider>;
}
function TipLayer({ tip }){
  const vw = typeof window!=="undefined"? window.innerWidth:1200;
  const left = Math.min(tip.x+14, vw-340);
  return <div style={{ position:"fixed", left, top:tip.y+16, zIndex:9999, maxWidth:320,
    background:"var(--surface)", color:"var(--text)", border:"1px solid var(--accent)",
    borderRadius:10, padding:"10px 12px", fontSize:12.5, lineHeight:1.5, fontFamily:FONT_B,
    boxShadow:"0 12px 40px rgba(0,0,0,.45)", pointerEvents:"none" }}>{tip.content}</div>;
}
const useTip = ()=> useContext(TipCtx);
function Q({ term, text }){
  const tip=useTip(); const body=text||GLOSSARY[term]||term;
  const node=<span><b style={{color:"var(--accent2)"}}>{term}</b><br/>{body}</span>;
  return <sup tabIndex={0} role="button" aria-label={term}
    onMouseEnter={(e)=>tip.show(node,e)} onMouseMove={tip.move} onMouseLeave={tip.hide}
    onFocus={(e)=>tip.show(node,e)} onBlur={tip.hide}
    style={{cursor:"help",color:"var(--accent2)",fontWeight:700,fontSize:"0.7em",marginLeft:2,borderBottom:"1px dotted var(--accent2)"}}>?</sup>;
}
function Info({ children }){
  const tip=useTip();
  return <span tabIndex={0} onMouseEnter={(e)=>tip.show(children,e)} onMouseMove={tip.move} onMouseLeave={tip.hide}
    onFocus={(e)=>tip.show(children,e)} onBlur={tip.hide}
    style={{cursor:"help",display:"inline-flex",alignItems:"center",justifyContent:"center",width:15,height:15,
      borderRadius:"50%",border:"1px solid var(--muted)",color:"var(--muted)",fontSize:10,fontWeight:700,marginLeft:5}}>i</span>;
}

/* ---- chart primitives ------------------------------------------------- */
function Gauge({ value, prev, S, T }){
  const W=240, H=152, cx=120, cy=118, r=92, sw=18;
  const ang=(p)=> Math.PI + (0-Math.PI)*(p/100);
  const pt=(p,rr=r)=> [cx+rr*Math.cos(ang(p)), cy-rr*Math.sin(ang(p))];
  const arc=(p0,p1,rr=r)=>{ const [x0,y0]=pt(p0,rr),[x1,y1]=pt(p1,rr);
    return `M ${x0} ${y0} A ${rr} ${rr} 0 0 1 ${x1} ${y1}`; };
  const delta=value-prev, dCol=delta>=0?S.success:S.risk;
  const [tOut,tIn]=[pt(95,r+10),pt(95,r-10)];
  return (
    <div style={{width:"100%",maxWidth:248,display:"flex",flexDirection:"column",alignItems:"center"}}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",display:"block"}}>
        <defs>
          <linearGradient id="ocrarc" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={ACCENT}/><stop offset="1" stopColor={ACCENT2}/>
          </linearGradient>
        </defs>
        <path d={arc(0,100)} fill="none" stroke={T.track} strokeWidth={sw} strokeLinecap="round"/>
        <line x1={tIn[0]} y1={tIn[1]} x2={tOut[0]} y2={tOut[1]} stroke={T.muted} strokeWidth={2.5} strokeDasharray="2.5 2"/>
        <path d={arc(0,Math.max(0.5,value))} fill="none" stroke="url(#ocrarc)" strokeWidth={sw} strokeLinecap="round"/>
        <text x={cx} y={cy-32} textAnchor="middle" fontFamily={FONT_H} fontSize={40} fontWeight={700} fill={T.text}>{pct(value,1)}<tspan fontSize={18} dy={-13} fontWeight={600}>%</tspan></text>
        <text x={cx} y={cy-9} textAnchor="middle" fontFamily={FONT_B} fontSize={10.5} fontWeight={600} fill={T.textSec} letterSpacing="1.3">ORDER CONFIRMATION RATE</text>
        <text x={cx} y={cy+15} textAnchor="middle" fontFamily={FONT_B} fontSize={12.5} fontWeight={700} fill={dCol}>
          {delta>=0?"\u25B2":"\u25BC"} {Math.abs(delta).toFixed(2)} pts WoW</text>
      </svg>
      <div style={{display:"flex",alignItems:"center",gap:7,marginTop:4,fontSize:10.5,color:T.muted}}>
        <span style={{display:"inline-block",width:18,borderTop:`2.5px dashed ${T.muted}`}}/>95% service-level target</div>
    </div>
  );
}
function Sparkline({ series, w=132, h=30, S, good="up" }){
  const vals=series.filter(v=>v!=null); if(vals.length<2) return <svg width={w} height={h}/>;
  const min=Math.min(...vals), max=Math.max(...vals), span=(max-min)||1, n=series.length;
  const xs=(i)=> 2+i*((w-4)/(n-1)); const ys=(v)=> h-3-((v-min)/span)*(h-8);
  let d="",started=false,lastX=2,lastY=h/2;
  series.forEach((v,i)=>{ if(v==null) return; const x=xs(i),y=ys(v); d+=(started?` L ${x} ${y}`:`M ${x} ${y}`); started=true; lastX=x; lastY=y; });
  const up=vals[vals.length-1]>=vals[0]; const col=(good==="up"?up:!up)?S.success:S.risk;
  return <svg width={w} height={h}><path d={d} fill="none" stroke={col} strokeWidth={1.8}/><circle cx={lastX} cy={lastY} r={2.6} fill={col}/></svg>;
}
function CauseBars({ rows, S, T, onPick }){
  const max=Math.max(1,...rows.map(r=>r.unconf));
  return <div style={{display:"flex",flexDirection:"column",gap:8}}>
    {rows.map(r=>{ const st=unconfStatus({...S,muted:T.muted}, r.wow); const w=Math.max(3,(r.unconf/max)*100);
      return <button key={r.cause} onClick={()=>onPick&&onPick(r.cause)} title="Drill into this cause"
        style={{textAlign:"left",background:"transparent",border:"none",padding:"2px 0",cursor:onPick?"pointer":"default"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:3}}>
          <span style={{fontSize:12.5,color:T.text,fontWeight:600}}>{r.cause}</span>
          <span style={{fontSize:12,color:T.textSec}}>{fmt(r.unconf)}
            <span style={{color:st.color,fontWeight:700,marginLeft:7}}>{st.arrow}{Math.abs(r.wow)}</span></span>
        </div>
        <div style={{height:8,borderRadius:5,background:T.surfaceAlt,overflow:"hidden"}}>
          <div style={{width:w+"%",height:"100%",borderRadius:5,background:`linear-gradient(90deg,${CAT_HUE[r.cat]||ACCENT},${ACCENT2})`}}/></div>
      </button>; })}
  </div>;
}

/* ---- atoms ------------------------------------------------------------ */
function Card({ children, style, pad=16 }){
  return <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:14,padding:pad,...style}}>{children}</div>;
}
function Eyebrow({ children }){
  return <div style={{fontSize:11,fontWeight:700,letterSpacing:0.8,textTransform:"uppercase",color:"var(--muted)",marginBottom:9}}>{children}</div>;
}
function WowChip({ wow, S }){
  const st=unconfStatus({...S,muted:"var(--muted)"}, wow);
  return <span style={{fontSize:11.5,fontWeight:700,color:st.color}}>{st.arrow} {fmt(Math.abs(wow))} {st.word}</span>;
}
function CategoryTile({ row, S, T, total, onPick }){
  const hue=CAT_HUE[row.cat]||ACCENT; const share=total>0?(row.unconf/total*100):0;
  const st=unconfStatus({...S,muted:T.muted}, row.wow);
  return <button onClick={()=>onPick(row.cat)} className="lift" title={`Drill into ${row.cat}`}
    style={{textAlign:"left",cursor:"pointer",borderRadius:13,padding:14,border:`1px solid ${T.border}`,
      background:T.surface,borderTop:`3px solid ${hue}`,display:"flex",flexDirection:"column",gap:7}}>
    <div style={{fontSize:13,fontWeight:700,color:T.text}}>{row.cat}</div>
    <div style={{fontSize:26,fontWeight:800,fontFamily:FONT_H,color:hue,lineHeight:1}}>{fmt(row.unconf)}</div>
    <div style={{fontSize:11,color:T.muted}}>{pct(share,0)}% of miss</div>
    <div style={{height:6,borderRadius:4,background:T.surfaceAlt,overflow:"hidden"}}>
      <div style={{width:Math.max(3,share)+"%",height:"100%",background:hue,borderRadius:4}}/></div>
    <div style={{fontSize:11.5,fontWeight:700,color:st.color}}>{st.arrow} {fmt(Math.abs(row.wow))} WoW</div>
  </button>;
}
function Empty({ children, T }){
  return <div style={{padding:"18px 8px",textAlign:"center",color:T.muted,fontSize:12.5}}>{children}</div>;
}

/* ---- COMMAND ---------------------------------------------------------- */
function CommandView({ D, wk, other, S, T, go }){
  const meta=metaFor(D,wk), pm=metaFor(D,other);
  const cats=catRows(D,wk,other); const total=meta.unconf;
  const movers=moverRows(D,wk,other);
  const worsen=movers.filter(m=>m.wow>0).slice(0,5);
  const improve=movers.filter(m=>m.wow<0).slice(-5).reverse();
  const topCause=causeRows(D,wk,other,null)[0];
  const kpiUp=meta.ocr-pm.ocr;
  const worstCat=[...cats].sort((a,b)=>b.wow-a.wow)[0];
  return <div style={{display:"flex",flexDirection:"column",gap:18}}>
    <div style={{display:"grid",gridTemplateColumns:"minmax(248px,280px) 1fr",gap:18,alignItems:"stretch"}} className="hero">
      <Card style={{display:"flex",alignItems:"center",justifyContent:"center"}}>
        <Gauge value={meta.ocr} prev={pm.ocr} S={S} T={T}/>
      </Card>
      <Card style={{display:"flex",flexDirection:"column",justifyContent:"center",gap:14}}>
        <div>
          <Eyebrow>Executive verdict — {wk} ({meta.asof}) vs {other}</Eyebrow>
          <div style={{fontSize:19,lineHeight:1.45,color:T.text,fontFamily:FONT_H,fontWeight:400}}>
            Confirmation rose to <b style={{fontWeight:800,color:ACCENT}}>{pct(meta.ocr,1)}%</b> ({kpiUp>=0?"+":""}{pct(kpiUp,2)} pts),
            with <b style={{fontWeight:800}}>{fmt(pm.unconf-meta.unconf)}</b> fewer unconfirmed units —
            but <b style={{fontWeight:800,color:S.risk}}>{worstCat.cat}</b> went the wrong way
            ({worstCat.wow>=0?"+":""}{fmt(worstCat.wow)} units), led by <b style={{fontWeight:800}}>{topCause.cause}</b>.
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
          {[
            {l:"Unconfirmed units",v:fmt(meta.unconf),sub:<WowChip wow={meta.unconf-pm.unconf} S={S}/>,t:"Unconfirmed"},
            {l:"Order volume",v:fmt(meta.order),sub:<span style={{fontSize:11,color:T.muted}}>{fmt(meta.order-pm.order)} vs {other}</span>},
            {l:"Lines to action",v:fmt(meta.uncLines),sub:<span style={{fontSize:11,color:T.muted}}>unconfirmed order lines</span>},
          ].map((s,i)=>(
            <div key={i} style={{borderLeft:`3px solid ${[ACCENT,CYAN,ACCENT2][i]}`,paddingLeft:11}}>
              <div style={{fontSize:10.5,color:T.muted,textTransform:"uppercase",letterSpacing:0.5,marginBottom:3}}>{s.l}{s.t&&<Q term={s.t}/>}</div>
              <div style={{fontSize:23,fontWeight:800,color:T.text,fontFamily:FONT_H,lineHeight:1}}>{s.v}</div>
              <div style={{marginTop:3}}>{s.sub}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>

    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:9}}>
        <Eyebrow>Where the miss sits — root-cause category <Q term="Root Cause Category"/></Eyebrow>
        <span style={{fontSize:11.5,color:T.muted}}>click any tile to drill →</span>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:11}} className="cat-grid">
        {cats.map(c=> <CategoryTile key={c.cat} row={c} S={S} T={T} total={total} onPick={(cat)=>go("drill",{cat})}/>)}
      </div>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}} className="movers">
      <Card pad={0}>
        <div style={{padding:"13px 16px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:13.5,fontWeight:800,color:T.text}}><span style={{color:S.risk}}>{"\u25B2"}</span> Act here first — worsening WoW</span>
          <Info>The detailed causes whose unconfirmed units grew most since {other}. These are the new fires — highest leverage this week.</Info>
        </div>
        <div style={{padding:"12px 14px"}}>
          {worsen.length? <CauseBars rows={worsen} S={S} T={T} onPick={(c)=>go("drill",{cause:c,cat:D.catMap[c]})}/>
            : <Empty T={T}>Nothing grew this week — every cause is flat or improving.</Empty>}
        </div>
      </Card>
      <Card pad={0}>
        <div style={{padding:"13px 16px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:13.5,fontWeight:800,color:T.text}}><span style={{color:S.success}}>{"\u25BC"}</span> Holding the gains — improving WoW</span>
          <Info>The causes that fell most since {other}. Protect these wins; don't redirect the resources that earned them.</Info>
        </div>
        <div style={{padding:"12px 14px"}}>
          <CauseBars rows={improve} S={S} T={T} onPick={(c)=>go("drill",{cause:c,cat:D.catMap[c]})}/>
        </div>
      </Card>
    </div>
  </div>;
}

/* ---- DRILL cascade ---------------------------------------------------- */
function Crumb({ children, active, onClick, T }){
  return <button onClick={onClick} style={{background:"transparent",border:"none",cursor:"pointer",
    fontSize:12.5,fontWeight:active?800:600,color:active?T.text:"var(--accent)",padding:0}}>{children}</button>;
}
function DimMini({ title, rows, S, T, dimTerm, onPick }){
  const max=Math.max(1,...rows.map(r=>r.v)); const top=rows.slice(0,6);
  return <div>
    <div style={{fontSize:11.5,fontWeight:700,color:T.textSec,marginBottom:7}}>{title}{dimTerm&&<Q term={dimTerm}/>}</div>
    <div style={{display:"flex",flexDirection:"column",gap:6}}>
      {top.length?top.map(r=>(
        <button key={r.k} onClick={()=>onPick&&onPick(r.k)} title="Open these lines"
          style={{textAlign:"left",background:"transparent",border:"none",cursor:onPick?"pointer":"default",padding:0}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:T.text,marginBottom:2}}>
            <span>{r.k}</span><span style={{color:T.textSec}}>{fmt(r.v)}</span></div>
          <div style={{height:6,borderRadius:4,background:T.surfaceAlt,overflow:"hidden"}}>
            <div style={{width:Math.max(3,(r.v/max)*100)+"%",height:"100%",borderRadius:4,background:`linear-gradient(90deg,${CYAN},${ACCENT})`}}/></div>
        </button>)):<Empty T={T}>No lines on this slice.</Empty>}
    </div>
  </div>;
}
function ActionCard({ cause, actions, S, T }){
  return <Card style={{borderLeft:`4px solid ${ACCENT}`}}>
    <Eyebrow>Recommended actions — {cause}</Eyebrow>
    <ol style={{margin:0,paddingLeft:18,fontSize:12.5,color:T.textSec,lineHeight:1.55,display:"flex",flexDirection:"column",gap:6}}>
      {(actions&&actions.length?actions:["Open the lines and confirm the driver before acting."]).map((a,i)=><li key={i}>{a}</li>)}
    </ol>
  </Card>;
}
function DrillView({ D, wk, other, S, T, drill, setDrill, go }){
  const cat=drill.cat||null, cause=drill.cause||null;
  const cats=catRows(D,wk,other);
  const causes=causeRows(D,wk,other,cat);
  const flt={cat,cause};
  return <div style={{display:"flex",flexDirection:"column",gap:14}}>
    <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
      <Crumb active={!cat} onClick={()=>setDrill({})} T={T}>All categories</Crumb>
      {cat&&<><span style={{color:T.muted}}>›</span>
        <Crumb active={cat&&!cause} onClick={()=>setDrill({cat})} T={T}>{cat}</Crumb></>}
      {cause&&<><span style={{color:T.muted}}>›</span><Crumb active onClick={()=>{}} T={T}>{cause}</Crumb></>}
    </div>

    <div style={{display:"grid",gridTemplateColumns:"minmax(280px,360px) 1fr",gap:16,alignItems:"start"}} className="drill">
      <Card>
        <Eyebrow>{cat?`${cat} — detailed causes`:"Pick a category"}</Eyebrow>
        {!cat && <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:12}}>
          {cats.map(c=>{ const st=unconfStatus({...S,muted:T.muted},c.wow);
            return <button key={c.cat} onClick={()=>setDrill({cat:c.cat})}
              style={{cursor:"pointer",border:`1px solid ${T.border}`,borderRadius:20,padding:"6px 12px",
                background:T.surfaceAlt,color:T.text,fontSize:12.5,fontWeight:600}}>
              {c.cat} <b style={{color:CAT_HUE[c.cat]}}>{fmt(c.unconf)}</b> <span style={{color:st.color}}>{st.arrow}{Math.abs(c.wow)}</span></button>; })}
        </div>}
        {cat && <CauseBars rows={causes} S={S} T={T} onPick={(c)=>setDrill({cat:D.catMap[c]||cat,cause:c})}/>}
      </Card>

      <Card>
        {!cause && <Empty T={T}>{cat? "Select a cause to see its breakdown and actions." : "Select a category, then a cause, to cascade into the breakdown."}</Empty>}
        {cause && <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div>
            <Eyebrow>{cause} — where it concentrates</Eyebrow>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,rowGap:16}} className="dimgrid">
              <DimMini title="By region" rows={dimAgg(D,wk,"region",flt)} S={S} T={T} onPick={(k)=>go("worklist",{cause,region:k})}/>
              <DimMini title="By product line" rows={dimAgg(D,wk,"division",flt)} S={S} T={T} onPick={(k)=>go("worklist",{cause,division:k})}/>
              <DimMini title="By site" rows={dimAgg(D,wk,"site",flt)} S={S} T={T} dimTerm="RDC" onPick={(k)=>go("worklist",{cause,site:k})}/>
              <DimMini title="By supply source" rows={dimAgg(D,wk,"supplier",flt)} S={S} T={T} dimTerm="Overseas" onPick={(k)=>go("worklist",{cause,supplier:k})}/>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 200px",gap:14,alignItems:"start"}} className="actrow">
            <ActionCard cause={cause} actions={D.actions[cause]} S={S} T={T}/>
            <button onClick={()=>go("worklist",{cause})} className="lift"
              style={{cursor:"pointer",border:"none",borderRadius:12,padding:"14px 16px",color:"#fff",fontWeight:800,fontSize:13.5,
                background:`linear-gradient(135deg,${ACCENT},${ACCENT2})`,boxShadow:"0 8px 24px rgba(99,102,241,.35)"}}>
              View {fmt(causeRows(D,wk,other,cat).find(r=>r.cause===cause)?.unconf||0)} unconfirmed units →</button>
          </div>
        </div>}
      </Card>
    </div>
  </div>;
}

/* ---- CUSTOMERS -------------------------------------------------------- */
function CustomerView({ D, wk, other, S, T, go }){
  const rows=customerScorecard(D,wk,other);
  const red=rows.filter(r=> r.rate<70 && (r.conf+r.unconf)>=50).sort((a,b)=>a.rate-b.rate);
  const [sort,setSort]=useState("unconf");
  const sorted=[...rows].sort((a,b)=>{ if(sort==="rate") return a.rate-b.rate; if(sort==="wow") return b.wow-a.wow; return b.unconf-a.unconf; }).slice(0,40);
  const Hd=({k,children,align})=> <th onClick={()=>setSort(k)} style={{cursor:k?"pointer":"default",textAlign:align||"left",
    padding:"9px 11px",fontSize:11,fontWeight:700,color:sort===k?T.text:T.muted,whiteSpace:"nowrap",
    position:"sticky",top:0,background:T.surfaceAlt,borderBottom:`1px solid ${T.border}`}}>{children}{sort===k?" ▾":""}</th>;
  return <div style={{display:"flex",flexDirection:"column",gap:14}}>
    {red.length>0 && <Card style={{borderLeft:`4px solid ${S.risk}`}}>
      <Eyebrow>Service crisis — customers under 70% confirmation</Eyebrow>
      <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
        {red.map(r=>(
          <button key={r.name} onClick={()=>go("worklist",{customer:r.name})} className="lift" title="Open this customer's unconfirmed lines"
            style={{cursor:"pointer",border:`1px solid ${T.border}`,borderRadius:12,padding:"11px 14px",background:T.surface,textAlign:"left",minWidth:172}}>
            <div style={{fontSize:12.5,fontWeight:700,color:T.text,marginBottom:4}}>{r.name}</div>
            <div style={{display:"flex",alignItems:"baseline",gap:8}}>
              <span style={{fontSize:22,fontWeight:800,color:S.risk,fontFamily:FONT_H}}>{pct(r.rate,0)}%</span>
              <span style={{fontSize:11,color:T.muted}}>{fmt(r.unconf)} unconf</span></div>
            <div style={{marginTop:5}}><WowChip wow={r.wow} S={S}/></div>
          </button>))}
      </div>
    </Card>}

    <Card pad={0}>
      <div style={{padding:"13px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid ${T.border}`}}>
        <div>
          <span style={{fontSize:13.5,fontWeight:800,color:T.text}}>Customer scorecard</span>
          <span style={{fontSize:11.5,color:T.muted,marginLeft:8}}>top 40 by unconfirmed · click a header to sort · click a row to open lines</span>
        </div>
      </div>
      <div style={{maxHeight:"62vh",overflow:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontFamily:FONT_B}}>
          <thead><tr>
            <Hd k="unconf">Customer</Hd>
            <Hd k="rate" align="right">OCR <Q term="OCR"/></Hd>
            <Hd k="unconf" align="right">Unconf</Hd>
            <Hd k="wow" align="right">WoW</Hd>
            <Hd>11-wk confirmation</Hd>
          </tr></thead>
          <tbody>
            {sorted.map((r,i)=>{ const rc=rateStatus(S,r.rate); const st=unconfStatus({...S,muted:T.muted},r.wow);
              return <tr key={r.name} onClick={()=>go("worklist",{customer:r.name})} title="Open this customer's unconfirmed lines"
                style={{cursor:"pointer",background:i%2?T.bg:"transparent",borderBottom:`1px solid ${T.grid}`}}>
                <td style={{padding:"9px 11px",fontSize:12.5,color:T.text,fontWeight:600}}>{r.name}</td>
                <td style={{padding:"9px 11px",textAlign:"right",fontSize:12.5,fontWeight:800,color:rc}}>{pct(r.rate,0)}%</td>
                <td style={{padding:"9px 11px",textAlign:"right",fontSize:12.5,color:T.text}}>{fmt(r.unconf)}</td>
                <td style={{padding:"9px 11px",textAlign:"right",fontSize:12.5,fontWeight:700,color:st.color}}>{st.arrow}{fmt(Math.abs(r.wow))}</td>
                <td style={{padding:"6px 11px"}}>{r.ftl? <Sparkline series={r.ftl} S={S} good="up"/> : <span style={{fontSize:11,color:T.muted}}>—</span>}</td>
              </tr>; })}
          </tbody>
        </table>
      </div>
    </Card>
  </div>;
}

/* ---- WORKLIST --------------------------------------------------------- */
const WCOL = { region:"Region",division:"Product Line",site:"Site",customer:"Customer",
  prod:"Product",mat:"Material",doc:"Order",it:"Item",loc:"Loc Type",sup:"Supply",
  crdd:"cRDD",oq:"Order Qty",uq:"Unconfirmed",cat:"Category",det:"Detailed Cause" };
function buildSheet(XLSX, rows, name){
  const header=["Region","Product Line","Site","Customer","Product","Material","Order","Item","Loc Type","Supply","cRDD","Order Qty","Unconfirmed","Category","Detailed Cause","Reason"];
  const body=rows.map(r=>[r.rg,r.dv,r.site,r.cust,r.prod,r.mat,r.doc,r.it,r.loc,r.sup,r.crdd,r.oq,r.uq,r.cat,r.det,r.rsn]);
  const ws=XLSX.utils.aoa_to_sheet([header,...body]);
  ws["!cols"]=[8,13,9,24,10,10,12,6,8,9,11,9,11,12,24,46].map(w=>({wch:w}));
  ws["!autofilter"]={ref:XLSX.utils.encode_range({s:{r:0,c:0},e:{r:body.length,c:header.length-1}})};
  const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,name.slice(0,31)); return wb;
}
function WorklistView({ D, wk, other, S, T, flt, setFlt }){
  const [q,setQ]=useState(flt.q||"");
  const eff={...flt, q:q||undefined};
  const rows=lineRows(D,wk,eff);
  const allRows=lineRows(D,wk,{});
  const total=rows.reduce((a,r)=>a+r.uq,0);
  const chips=Object.entries(flt).filter(([k,v])=>v&&k!=="q");
  const exportXlsx=async(which)=>{
    const XLSX=await import("xlsx");
    const data=which==="filtered"?rows:allRows;
    const wb=buildSheet(XLSX, data, which==="filtered"?"Filtered":"All unconfirmed");
    const fn=`northpoint_order_confirmation_${wk.replace(/\s+/g,"").toLowerCase()}_${which}_${data.length}rows.xlsx`;
    XLSX.writeFile(wb,fn);
  };
  return <div style={{display:"flex",flexDirection:"column",gap:14}}>
    <Card>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
        <div>
          <span style={{fontSize:15,fontWeight:800,color:T.text}}>Unconfirmed worklist — {wk}</span>
          <span style={{fontSize:12.5,color:T.muted,marginLeft:10}}>{fmt(rows.length)} lines · {fmt(total)} units{chips.length?" (filtered)":""}</span>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>exportXlsx("filtered")} className="lift"
            style={{cursor:"pointer",border:"none",borderRadius:9,padding:"8px 13px",color:"#fff",fontWeight:700,fontSize:12.5,
              background:`linear-gradient(135deg,${ACCENT},${ACCENT2})`}}>Export filtered (.xlsx)</button>
          <button onClick={()=>exportXlsx("all")}
            style={{cursor:"pointer",border:`1px solid ${T.border}`,borderRadius:9,padding:"8px 13px",color:T.text,fontWeight:700,fontSize:12.5,background:T.surface}}>Export full list</button>
        </div>
      </div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center",marginTop:12}}>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search customer, product, material, order, cause…"
          style={{flex:"1 1 280px",minWidth:200,background:T.bg,border:`1px solid ${T.border}`,borderRadius:9,padding:"9px 12px",color:T.text,fontSize:13,fontFamily:FONT_B}}/>
        {chips.map(([k,v])=>(
          <span key={k} style={{display:"inline-flex",alignItems:"center",gap:6,background:T.surfaceAlt,border:`1px solid ${T.border}`,borderRadius:18,padding:"5px 11px",fontSize:12,color:T.text}}>
            <b style={{color:ACCENT}}>{WCOL[k]||k}:</b> {v}
            <button onClick={()=>{const n={...flt};delete n[k];setFlt(n);}} aria-label="clear" style={{border:"none",background:"none",color:T.muted,cursor:"pointer",fontSize:14,lineHeight:1,padding:0}}>×</button>
          </span>))}
        {(chips.length||q)&&<button onClick={()=>{setFlt({});setQ("");}} style={{fontSize:11.5,color:ACCENT,background:"none",border:"none",cursor:"pointer",fontWeight:700}}>clear all</button>}
      </div>
    </Card>

    <Card pad={0}>
      <div style={{maxHeight:"66vh",overflow:"auto"}}>
        <table style={{borderCollapse:"separate",borderSpacing:0,fontFamily:FONT_B,fontSize:12.5,minWidth:1080}}>
          <thead><tr>
            {["Customer","Detailed Cause","Category","Product","Material","Order","Site","Sup","Unconf","cRDD"].map((h,ci)=>(
              <th key={h} style={{position:"sticky",top:0,left:ci===0?0:"auto",zIndex:ci===0?3:2,background:T.surfaceAlt,
                color:T.muted,fontSize:11,fontWeight:700,textAlign:ci>=5?"right":"left",padding:"9px 11px",
                borderBottom:`1px solid ${T.border}`,whiteSpace:"nowrap"}}>{h}</th>))}
          </tr></thead>
          <tbody>
            {rows.slice(0,400).map((r,i)=>(
              <tr key={r.doc+r.it+i} style={{background:i%2?T.bg:T.surface}}>
                <td style={{position:"sticky",left:0,zIndex:1,background:i%2?T.bg:T.surface,padding:"8px 11px",color:T.text,fontWeight:600,whiteSpace:"nowrap",borderBottom:`1px solid ${T.grid}`}}>{r.cust}</td>
                <td title={r.rsn} style={{padding:"8px 11px",color:T.text,whiteSpace:"nowrap",borderBottom:`1px solid ${T.grid}`,borderLeft:`3px solid ${CAT_HUE[r.cat]||ACCENT}`}}>{r.det}</td>
                <td style={{padding:"8px 11px",color:T.textSec,borderBottom:`1px solid ${T.grid}`}}>{r.cat}</td>
                <td style={{padding:"8px 11px",color:T.textSec,borderBottom:`1px solid ${T.grid}`}}>{r.prod}</td>
                <td style={{padding:"8px 11px",color:T.textSec,borderBottom:`1px solid ${T.grid}`}}>{r.mat}</td>
                <td style={{padding:"8px 11px",color:T.textSec,textAlign:"right",borderBottom:`1px solid ${T.grid}`}}>{r.doc}</td>
                <td style={{padding:"8px 11px",color:T.textSec,borderBottom:`1px solid ${T.grid}`}}>{r.site}</td>
                <td style={{padding:"8px 11px",color:T.textSec,borderBottom:`1px solid ${T.grid}`}}>{r.sup}</td>
                <td style={{padding:"8px 11px",color:T.text,fontWeight:700,textAlign:"right",borderBottom:`1px solid ${T.grid}`}}>{fmt(r.uq)}</td>
                <td style={{padding:"8px 11px",color:T.textSec,textAlign:"right",whiteSpace:"nowrap",borderBottom:`1px solid ${T.grid}`}}>{r.crdd}</td>
              </tr>))}
          </tbody>
        </table>
      </div>
      {rows.length>400 && <div style={{padding:"10px 14px",fontSize:11.5,color:T.muted}}>Showing first 400 of {fmt(rows.length)} lines — export for the full set. Hover a cause for the per-line reason.</div>}
      {rows.length===0 && <Empty T={T}>No lines match this filter.</Empty>}
    </Card>
    <div style={{fontSize:11,color:T.muted}}>Built by <b style={{color:T.textSec}}>Ian Provencher</b> · per-row reason on cause hover · exports ship the full + filtered pair with live row counts.</div>
  </div>;
}

/* ---- DATA / honesty surface ------------------------------------------ */
function DataView({ D, wk, other, S, T, onReload }){
  const meta=metaFor(D,wk);
  const sources=D.weeks.map(w=>({ wk:w, file:`northpoint_order_confirmation_sample_${w.replace(/\s+/g,"").toLowerCase()}.csv`, meta:D.meta[w] }));
  const mis=Object.keys(D.catMap).filter(k=> D.secondaryRollup[k]!==D.catMap[k]);
  return <div style={{display:"flex",flexDirection:"column",gap:14}}>
    <Card style={{borderLeft:`4px solid ${ACCENT}`}}>
      <Eyebrow>About this demo</Eyebrow>
      <div style={{fontSize:13,color:T.textSec,lineHeight:1.6}}>
        This is a public portfolio demo for <b style={{color:T.text}}>{D.company}</b>, a fictional manufacturer. Every record is
        <b style={{color:T.text}}> synthetic, generated deterministically from a fixed seed</b> — no real company, customer, product, or process data is present.
        It demonstrates the <i>capability</i>: a live order-confirmation root-cause engine that ties confirmed and unconfirmed units to a five-bucket rollup,
        drills to line level, scores customers, and exports a worklist. Persistence and write-back are the connector story — in a wired deployment, dispositions would post back to your ERP.
      </div>
      <button onClick={onReload} className="lift" style={{marginTop:12,cursor:"pointer",border:"none",borderRadius:9,padding:"9px 14px",
        color:"#fff",fontWeight:700,fontSize:12.5,background:`linear-gradient(135deg,${ACCENT},${ACCENT2})`}}>↻ Reload sample data</button>
    </Card>

    <Card>
      <Eyebrow>Sample feed — provenance</Eyebrow>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}} className="prov">
        {sources.map(s=>(
          <div key={s.wk} style={{border:`1px solid ${s.wk===wk?ACCENT:T.border}`,borderRadius:11,padding:"12px 14px",background:s.wk===wk?T.surfaceAlt:"transparent"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <b style={{fontSize:13,color:T.text}}>{s.wk}{s.wk===wk&&<span style={{color:ACCENT,fontSize:11,marginLeft:6}}>current</span>}{s.wk===other&&<span style={{color:T.muted,fontSize:11,marginLeft:6}}>comparison</span>}</b>
              <span style={{fontSize:11,color:T.muted}}>synthetic</span>
            </div>
            <div style={{fontSize:11.5,color:T.textSec,marginTop:5,wordBreak:"break-all"}}>{s.file}</div>
            <div style={{fontSize:11.5,color:T.muted,marginTop:4}}>{fmt(s.meta.unconf)} unconfirmed units · OCR {pct(s.meta.ocr,2)}% · as-of {s.meta.asof}</div>
          </div>))}
      </div>
    </Card>

    <Card>
      <Eyebrow>How this works — the classification engine</Eyebrow>
      <div style={{fontSize:13,color:T.textSec,lineHeight:1.6,display:"flex",flexDirection:"column",gap:9}}>
        <p style={{margin:0}}>Every order line carries a calculated requested delivery date (<Q term="cRDD"/>). A line is <b style={{color:T.text}}>confirmed</b> if its full ordered quantity can ship complete on that date; otherwise the shortfall is <b style={{color:T.text}}>unconfirmed</b> and gets one root cause.</p>
        <p style={{margin:0}}>The cause is assigned by a <b style={{color:T.text}}>first-match-wins waterfall</b><Q term="Waterfall"/> over the line's signals. A line that trips several criteria is booked to the highest-priority one, in this order:</p>
        <ol style={{margin:"2px 0 0",paddingLeft:20,columns:2,fontSize:12.5,color:T.text}}>
          {WATERFALL.filter(w=>w!=="Needs Investigation").map(w=>(
            <li key={w} style={{marginBottom:3}}>{w} <span style={{color:T.muted}}>→ {D.catMap[w]}</span></li>))}
        </ol>
        <p style={{margin:0}}>OCR = confirmed ÷ (confirmed + unconfirmed) units. For {wk}: {fmt(meta.conf)} ÷ {fmt(meta.conf+meta.unconf)} = {pct(meta.ocr,2)}%.</p>
      </div>
    </Card>

    <Card style={{borderLeft:`4px solid ${S.warning}`}}>
      <Eyebrow>Honest surfaces — what the tool reconciles and what it can't compute</Eyebrow>
      <ul style={{margin:0,paddingLeft:18,fontSize:12.5,color:T.textSec,lineHeight:1.6,display:"flex",flexDirection:"column",gap:7}}>
        <li>The canonical rollup the dashboard uses is internally consistent. To show the reconciliation check working, the sample feed ships a <b style={{color:T.text}}>secondary rollup that deliberately mislabels two causes</b> — {mis.map((m,i)=><span key={m}><b style={{color:T.text}}>{m}</b> as {D.secondaryRollup[m]}{i<mis.length-1?" and ":""}</span>)} — where the canonical map places both under <b style={{color:T.text}}>{D.catMap[mis[0]]}</b>. The tool flags the divergence rather than silently trusting either source.</li>
        <li><b style={{color:T.text}}>Unobservable here:</b> the dollar value of the miss (no price carried in this feed — by design) and any below-line detail beyond the signal columns. The engine never fabricates a value it can't read; those cells read “—”, not a guessed number.</li>
        <li>Disposition / write-back is <b style={{color:T.text}}>in-session only by design</b>. Persisting actions back to a system of record is the connector story, framed as such — not a gap.</li>
      </ul>
    </Card>
  </div>;
}

/* ---- base + responsive CSS (media queries override inline grids) ------ */
const CSS = `
*{box-sizing:border-box}
.occ-root{ -webkit-font-smoothing:antialiased; text-rendering:optimizeLegibility }
.occ-root button{ font-family:inherit }
.occ-root ::-webkit-scrollbar{ height:10px; width:10px }
.occ-root ::-webkit-scrollbar-thumb{ background:var(--border); border-radius:6px }
.occ-root ::-webkit-scrollbar-track{ background:transparent }
.seg{ display:inline-flex; border-radius:10px; overflow:hidden; border:1px solid var(--border); background:var(--surface) }
.seg button{ border:none; background:transparent; color:var(--muted); padding:6px 13px; font-size:12.5px; font-weight:700; cursor:pointer; transition:background .12s,color .12s; white-space:nowrap }
.seg button:hover{ color:var(--text) }
.seg button[data-on="1"]{ background:linear-gradient(135deg,var(--accent),var(--accent2)); color:#fff }
.navtab{ position:relative; border:none; background:transparent; color:var(--muted); padding:11px 15px 13px; font-size:14px; font-weight:700; cursor:pointer; white-space:nowrap }
.navtab:hover{ color:var(--text) }
.navtab[data-on="1"]{ color:var(--text) }
.navtab[data-on="1"]::after{ content:""; position:absolute; left:13px; right:13px; bottom:-1px; height:3px; border-radius:3px 3px 0 0; background:linear-gradient(90deg,var(--accent),var(--accent2)) }
.lift{ transition:transform .13s ease, box-shadow .13s ease }
.lift:hover{ transform:translateY(-2px) }
.occ-root :focus-visible{ outline:2px solid var(--accent); outline-offset:2px; border-radius:5px }
@media (max-width: 900px){
  .hero{ grid-template-columns:1fr !important }
  .movers{ grid-template-columns:1fr !important }
  .drill{ grid-template-columns:1fr !important }
  .dimgrid{ grid-template-columns:1fr !important }
  .prov{ grid-template-columns:1fr !important }
  .actrow{ grid-template-columns:1fr !important }
  .cat-grid{ grid-template-columns:repeat(3,1fr) !important }
}
@media (max-width: 560px){ .cat-grid{ grid-template-columns:repeat(2,1fr) !important } }
@media (prefers-reduced-motion: reduce){ .lift,.seg button,.navtab{ transition:none !important } }
`;

export default function App(){
  const [seed, setSeed] = useState(SEED);
  const [mode, setMode] = useState("dark");
  const [wk, setWk]     = useState(CURRENT);
  const [view, setView] = useState("command");
  const [drill, setDrill] = useState({});
  const [flt, setFlt]   = useState({});

  const D = useMemo(()=> buildData(seed), [seed]);
  const T = THEME[mode];
  const S = { success:T.success, warning:T.warning, risk:T.risk, muted:T.muted };
  const weeks = D.weeks;
  const other = weeks.find(w=> w!==wk) || weeks[0];
  const meta = D.meta[wk];

  const go = (v, f={})=>{ if(v==="drill") setDrill(f); if(v==="worklist") setFlt(f); setView(v); };
  const reload = ()=> setSeed(s=> (s*1664525 + 1013904223) >>> 0);

  const vars = {
    "--bg":T.bg, "--surface":T.surface, "--surface-alt":T.surfaceAlt, "--border":T.border,
    "--text":T.text, "--text-sec":T.textSec, "--muted":T.muted, "--accent":ACCENT, "--accent2":ACCENT2,
  };
  const NAV = [["command","Command"],["drill","Root Causes"],["customers","Customers"],["worklist","Worklist"],["data","About / Data"]];
  const ocrColor = rateStatus(S, meta.ocr);

  return (
    <TipProvider>
    <div className="occ-root" style={{ ...vars, background:T.bg, color:T.text, minHeight:"100vh", fontFamily:FONT_B }}>
      <style>{CSS}</style>

      <header style={{ position:"sticky", top:0, zIndex:30, background:T.bg, borderBottom:`1px solid ${T.border}` }}>
        <div style={{ maxWidth:1280, margin:"0 auto", padding:"13px 22px 0" }}>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:16, flexWrap:"wrap" }}>
            <div style={{ display:"flex", alignItems:"center", gap:13 }}>
              <div style={{ width:12, height:38, borderRadius:4, background:`linear-gradient(160deg,${ACCENT},${ACCENT2})` }}/>
              <div>
                <div style={{ fontFamily:FONT_H, fontSize:19, fontWeight:800, letterSpacing:-0.3, lineHeight:1.1 }}>
                  Order Confirmation Command Center</div>
                <div style={{ fontSize:12, color:T.muted, marginTop:3 }}>
                  {COMPANY} · order-confirmation root cause · {wk} as-of {meta.asof} · <span style={{color:T.textSec}}>synthetic demo</span></div>
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:13, flexWrap:"wrap" }}>
              <div style={{ textAlign:"right", lineHeight:1.15 }}>
                <div style={{ fontSize:21, fontWeight:800, fontFamily:FONT_H, color:ocrColor }}>{pct(meta.ocr,2)}%</div>
                <div style={{ fontSize:10, color:T.muted, letterSpacing:0.3, textTransform:"uppercase" }}>OCR {wk}</div>
              </div>
              <div style={{ width:1, height:30, background:T.border }}/>
              <div className="seg">{weeks.map(w=> <button key={w} data-on={w===wk?1:0} onClick={()=>setWk(w)}>{w}</button>)}</div>
              <div className="seg">{[["light","Light"],["dark","Dark"]].map(([m,lbl])=>
                <button key={m} data-on={m===mode?1:0} onClick={()=>setMode(m)}>{lbl}</button>)}</div>
            </div>
          </div>
          <nav style={{ display:"flex", gap:2, marginTop:9, overflowX:"auto" }}>
            {NAV.map(([v,lbl])=> <button key={v} className="navtab" data-on={v===view?1:0} onClick={()=>setView(v)}>{lbl}</button>)}
          </nav>
        </div>
      </header>

      <main style={{ maxWidth:1280, margin:"0 auto", padding:"20px 22px 64px" }}>
        {view==="command"   && <CommandView  D={D} wk={wk} other={other} S={S} T={T} go={go}/>}
        {view==="drill"     && <DrillView    D={D} wk={wk} other={other} S={S} T={T} drill={drill} setDrill={setDrill} go={go}/>}
        {view==="customers" && <CustomerView D={D} wk={wk} other={other} S={S} T={T} go={go}/>}
        {view==="worklist"  && <WorklistView D={D} wk={wk} other={other} S={S} T={T} flt={flt} setFlt={setFlt}/>}
        {view==="data"      && <DataView     D={D} wk={wk} other={other} S={S} T={T} onReload={reload}/>}
      </main>

      <footer style={{ maxWidth:1280, margin:"0 auto", padding:"0 22px 36px", color:T.muted, fontSize:11.5 }}>
        <div style={{ borderTop:`1px solid ${T.border}`, paddingTop:14, display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
          <span>Built by <b style={{ color:T.textSec }}>Ian Provencher</b> · synthetic-data portfolio demo · live in-browser engine, no real data or process.</span>
          <span>Lower unconfirmed = better · status color follows week-over-week direction.</span>
        </div>
      </footer>
    </div>
    </TipProvider>
  );
}
