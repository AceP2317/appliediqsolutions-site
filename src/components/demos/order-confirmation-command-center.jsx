import React, { useState, useMemo, useRef, useLayoutEffect } from "react";
// The northpoint palette (D120): every color a var() reference, the values on
// the house frame's root for the mode in force.
import { northpointTokens } from "../kit/industrial.js";
import { figure, percent, date as houseDate, count } from "../../lib/format.js";
import {
  HouseFrame, Intro, HowItWorks, AnswerCards, AnswerCard, ExportPair,
  Help, Term, Hint, Legend, Dot, pinColumns, useNorthpoint,
} from "../kit/house.jsx";
import { writeWorkbook } from "../kit/house-export.js";
// The fictional company these seven are set in — one file, so the world
// cannot drift into two companies across seven tools.
import { NORTHPOINT } from "../../lib/northpoint.js";
// xlsx is loaded lazily inside exportWorkbook() so its ~480 KB chunk stays off
// the initial bundle — export is a secondary action.

/* ====================== ENGINE — START ======================
   Order Confirmation Command Center — synthetic generator + pure engine.
   Northpoint Manufacturing (fictional). No real data, no real process.
   A deterministic seed builds two sample weeks of order-confirmation
   root-cause data; the engine below aggregates them. OCR = confirmed /
   (confirmed + unconfirmed) units. Lower unconfirmed = better.
   ============================================================ */

/* The company, its plants and its house style all arrive with the faceplate. */
const COMPANY = NORTHPOINT.company;
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

/* ============================================================================
   THE HOUSE FRAME (D120, 2026-09-24). Everything below the engine is the
   screen: HouseFrame from ../kit/house.jsx, the northpoint palette, the house
   formats, writeWorkbook() with its About sheet. The gauge stays a chart (Ian's
   call); every tile became an answer card.
   ============================================================================ */
const SLUG = "order-confirmation-command-center";
const NAME = "Order Confirmation Command Center";
const SCOPE = "Reads order-confirmation extracts in your browser. Never connects to SAP.";

/* THE NORTHPOINT PALETTE, "demand & planning" band. Every value a var()
   reference; the house frame's root carries the values for the mode in force. */
const T = northpointTokens(SLUG);

/* The engine's status helpers take a color set; these are the palette's. Green
   and red mean status only: an improving cause is green, one growing by 20 or
   more units is red, a smaller growth is amber. */
const S = { success: T.good, warning: T.warn, risk: T.bad, muted: T.textMuted };
const WORD_TONE = { improving: "good", worsening: "warn", deteriorating: "bad", flat: undefined };
const rateTone = (rate) => (rate >= 95 ? "good" : rate >= 90 ? "warn" : "bad");
const rateDot = (rate) => (rate >= 95 ? "ok" : rate >= 90 ? "warn" : "bad");

/* A ROOT-CAUSE CATEGORY IS A CATEGORY, so it takes the series. Until D120 the
   five took brass, steel, olive, orange and gray, two of them severity colors,
   so Supply read as "a little bad" and Customer as "worse" for no reason. */
const CAT_SERIES = { Forecasting: "series1", Logistics: "series2", Supply: "series3", Customer: "series4", Other: "series5" };
const Swatch = ({ cat }) => (
  <i aria-hidden="true" style={{ display: "inline-block", width: 9, height: 9, borderRadius: 2, flex: "none", background: T[CAT_SERIES[cat] || "series5"] }} />
);

const nfmt = (n) => figure(num(n), { zeroMeans: "zero" });
/* The engine keeps rates on a 0 to 100 scale; the house formatter takes a share. */
const pc = (v, digits = 1) => percent(num(v) / 100, { digits });
const wowText = (wow) => { const st = unconfStatus(S, wow); return `${st.arrow} ${nfmt(Math.abs(wow))} ${st.word}`; };
/* The extract writes a requested date as DD.MM.YYYY; the screen writes "22 Jun 2026". */
const crddIso = (s) => { const [d, m, y] = String(s).split("."); return `${y}-${m}-${d}`; };

const GLOSSARY = {
  "OCR": "Order confirmation rate: the share of ordered units that can be confirmed complete on the calculated requested delivery date. Higher is better; the service-level target is 95%.",
  "Unconfirmed": "Ordered units that could not be confirmed on the requested date: the volume that needs a root cause and an action.",
  "Confirmed": "Ordered units confirmed complete on time. No action needed.",
  "WoW": "Week over week: the change from the other sample week to this one. For unconfirmed units, a fall is an improvement.",
  "cRDD": "Calculated requested delivery date: entry date plus dispatch, pick and pack, and transit days, or the customer's requested date if that is later.",
  "Root Cause Category": "The five-bucket rollup of every miss: Forecasting, Logistics, Supply, Customer, Other.",
  "Detailed Root Cause": "The specific reason a line went unconfirmed, assigned by a first-match-wins waterfall over the line's signals.",
  "Waterfall": "The classification walks the causes in a fixed priority order and stops at the first one a line satisfies, so a line with several problems is booked to the highest-priority one.",
  "RDC": "Regional distribution center: pickable, ships to customers. A CDC, a central distribution center, feeds the regional ones.",
  "Overseas": "Supply sourced through an overseas import, with long lead time and container and customs exposure. Local supply is a transfer between sites.",
};

/* ============================================================================
   THE INSTRUCTION MANUAL (tool-conventions § N), built from CAT_ORDER, CAT_MAP,
   WATERFALL, ACTIONS and GLOSSARY above, so a rule change reaches it on its own.
   ============================================================================ */
export const MANUAL = {
  tool: NAME,
  purpose: "Explains every unconfirmed order line with one root cause, shows where the miss sits and which way it is moving, and hands over a worklist.",
  sections: [
    {
      id: "start", title: "What it is for, and what to do first",
      blocks: [
        { p: "Every order line that cannot ship complete on its requested date needs a reason and an owner. This console books each unconfirmed line to one root cause, rolls the causes into five categories, and compares two weeks so the new fires stand out from the old ones." },
        { list: [
          { lead: "Read the answer cards and the gauge.", text: "The confirmation rate against its 95% target, the unconfirmed units and which way they moved." },
          { lead: "Read Act here first.", text: "The causes that grew most since the other week are the highest-leverage work this week." },
          { lead: "Press a category or a cause.", text: "Root causes shows where it concentrates by region, product line, site and supply source, with the recommended actions." },
          { lead: "Check Customers.", text: "Any customer under 70% confirmation is listed first; press one to open its lines." },
          { lead: "Work the Worklist.", text: "Every unconfirmed line with its reason; export the full list or what the filters show." },
        ] },
      ],
    },
    {
      id: "numbers", title: "What the numbers mean",
      blocks: [
        { table: { head: ["Figure", "What it is"], rows: [
          ["Order confirmation rate", "Confirmed units over confirmed plus unconfirmed units."],
          ["Unconfirmed units", "Units that could not be confirmed on the requested date."],
          ["Order volume", "Every ordered unit in the week, confirmed or not."],
          ["Lines to action", "Unconfirmed order lines: the worklist."],
          ["Share of the miss", "A category's unconfirmed units over the week's."],
          ["Week over week", "This week's unconfirmed units minus the other week's, per category, cause or customer."],
        ] } },
      ],
    },
    {
      id: "flags", title: "Every root cause, and what to do about it",
      blocks: [
        { table: { head: ["Cause", "Category", "What to do"], rows: WATERFALL.map((c) => [c, CAT_MAP[c] || "Other", (ACTIONS[c] || []).join(" ")]) } },
        { p: "A cause's status follows its week-over-week direction: green where it fell, amber where it grew, red where it grew by 20 units or more." },
      ],
    },
    {
      id: "derived", title: "How to read the derived columns",
      blocks: [
        { p: GLOSSARY.cRDD, lead: "cRDD." },
        { p: GLOSSARY.Waterfall + " The order is the flags table above, top to bottom.", lead: "The waterfall." },
        { p: "A rate at or over 95% is green, from 90% amber, under 90% red. A customer under 70% with 50 units or more on order is a service crisis and is listed first.", lead: "Rate colors." },
        { p: "Each customer's confirmation rate over the last eleven weeks. Green where it ended higher than it started, red where lower.", lead: "The 11-week line." },
      ],
    },
    {
      id: "data", title: "How the data is handled",
      blocks: [
        { p: `This copy runs entirely in your browser. On open it builds two sample weeks of order-confirmation extracts for ${NORTHPOINT.company}, an invented manufacturer, from a fixed seed (${SEED}). New sample draws a different seed.` },
        { p: "The sample ships a second category rollup that files two causes differently, so the reconciliation check has something real to catch. Nothing is sent anywhere; the exports are written in your browser." },
      ],
    },
    {
      id: "thresholds", title: "Every threshold",
      blocks: [
        { table: { head: ["Threshold", "Value", "What it does"], rows: [
          ["Service-level target", "95%", "The gauge's mark; a rate at or over it is green."],
          ["Watch", "90%", "A rate from here to the target is amber."],
          ["Service crisis", "under 70%, 50 units or more", "A customer listed first on Customers."],
          ["Deteriorating", "20 units or more", "Growth this large marks a cause red rather than amber."],
          ["Worklist on screen", "400 lines", "The screen shows the first 400; both exports carry every line."],
        ] } },
        { p: "Set for this demo. A delivered copy takes the plant's own rules." },
      ],
    },
    {
      id: "limits", title: "What it cannot tell you",
      blocks: [
        { list: [
          "What the miss costs. The extract carries no price, so no value is shown rather than a guessed one.",
          "Why a customer ordered inside lead time. Unrealistic RDD says it happened, not why.",
          "Anything below the signal columns. Needs Investigation means no single signal dominates; open the line.",
          "Whether an action was taken. Write-back is the connector a delivered copy adds.",
        ] },
      ],
    },
  ],
};

/* ============================================================================
   CHARTS. The gauge and the sparklines are SVG, which takes a color as an
   attribute, so they read the resolved values for the mode in force.
   ============================================================================ */
function Gauge({ value, prev }) {
  const { hex } = useNorthpoint();
  const W = 240, H = 152, cx = 120, cy = 118, r = 92, sw = 18;
  const ang = (p) => Math.PI + (0 - Math.PI) * (p / 100);
  const pt = (p, rr = r) => [cx + rr * Math.cos(ang(p)), cy - rr * Math.sin(ang(p))];
  const arc = (p0, p1, rr = r) => { const [x0, y0] = pt(p0, rr), [x1, y1] = pt(p1, rr); return `M ${x0} ${y0} A ${rr} ${rr} 0 0 1 ${x1} ${y1}`; };
  const delta = value - prev;
  /* The target tick reaches past both edges of the arc and is drawn LAST, in the
     ink: drawn first and barely longer than the arc was thick, the value arc's
     rounded end covered it at any rate near the target. */
  const [tOut, tIn] = [pt(95, r + 15), pt(95, r - 15)];
  return (
    <figure style={{ margin: 0, width: "100%", maxWidth: 260, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }} role="img"
        aria-label={`Order confirmation rate ${pc(value)}, ${delta >= 0 ? "up" : "down"} ${figure(Math.abs(delta), { digits: 2, zeroMeans: "zero" })} points week over week, against a 95% target`}>
        <path d={arc(0, 100)} fill="none" stroke={hex.borderStrong} strokeWidth={sw} strokeLinecap="round" />
        <path d={arc(0, Math.max(0.5, value))} fill="none" stroke={hex.accentFill} strokeWidth={sw} strokeLinecap="round" />
        <line x1={tIn[0]} y1={tIn[1]} x2={tOut[0]} y2={tOut[1]} stroke={hex.text} strokeWidth={3} />
        <text x={cx} y={cy - 32} textAnchor="middle" fontFamily={T.fontData} fontSize={38} fontWeight={600} fill={hex.text}>{figure(value, { digits: 1 })}<tspan fontSize={18} dy={-13}>%</tspan></text>
        <text x={cx} y={cy - 9} textAnchor="middle" fontFamily={T.fontBody} fontSize={10} fontWeight={600} fill={hex.textSec} letterSpacing="0.8">CONFIRMATION RATE</text>
        <text x={cx} y={cy + 15} textAnchor="middle" fontFamily={T.fontBody} fontSize={12.5} fontWeight={600} fill={delta >= 0 ? hex.good : hex.bad}>
          {delta >= 0 ? "▲" : "▼"} {figure(Math.abs(delta), { digits: 2, zeroMeans: "zero" })} pts WoW</text>
      </svg>
      <figcaption style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 4, fontSize: 12, color: T.textMuted }}>
        <span style={{ display: "inline-block", width: 3, height: 14, background: T.text }} />95% service-level target
      </figcaption>
    </figure>
  );
}
function Sparkline({ series, w = 132, h = 30 }) {
  const { hex } = useNorthpoint();
  const vals = series.filter((v) => v != null);
  if (vals.length < 2) return <svg width={w} height={h} />;
  const min = Math.min(...vals), max = Math.max(...vals), span = (max - min) || 1, n = series.length;
  const xs = (i) => 2 + i * ((w - 4) / (n - 1));
  const ys = (v) => h - 3 - ((v - min) / span) * (h - 8);
  let d = "", started = false, lastX = 2, lastY = h / 2;
  series.forEach((v, i) => { if (v == null) return; const x = xs(i), y = ys(v); d += started ? ` L ${x} ${y}` : `M ${x} ${y}`; started = true; lastX = x; lastY = y; });
  const up = vals[vals.length - 1] >= vals[0];
  const col = up ? hex.good : hex.bad;
  return (
    <svg width={w} height={h} role="img" aria-label={`Eleven weeks, ${up ? "ending higher" : "ending lower"}: ${figure(vals[0], { digits: 1 })}% to ${figure(vals[vals.length - 1], { digits: 1 })}%`}>
      <path d={d} fill="none" stroke={col} strokeWidth={1.8} /><circle cx={lastX} cy={lastY} r={2.6} fill={col} />
    </svg>
  );
}

/* A ranked list of causes, each a button: its name, its units and week-over-week
   move, and a bar in its category's series color. */
function CauseBars({ rows, onPick }) {
  const max = Math.max(1, ...rows.map((r) => r.unconf));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {rows.map((r) => {
        const st = unconfStatus(S, r.wow);
        return (
          <button key={r.cause} type="button" onClick={() => onPick && onPick(r.cause)} title={`Open ${r.cause}`}
            style={{ textAlign: "left", background: "transparent", border: 0, padding: "2px 0", cursor: "pointer", width: "100%", font: "inherit", color: "inherit" }}>
            <span style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, marginBottom: 3 }}>
              <span style={{ fontSize: 13, color: T.text }}>{r.cause}</span>
              <span className="np-num" style={{ fontSize: 12.5, color: T.textSec, whiteSpace: "nowrap" }}>
                {nfmt(r.unconf)} <span style={{ color: st.color, marginLeft: 6 }} title={st.word}>{st.arrow}{nfmt(Math.abs(r.wow))}</span>
              </span>
            </span>
            <span style={{ display: "block", height: 8, borderRadius: 2, background: T.surfaceAlt, overflow: "hidden" }}>
              <span style={{ display: "block", width: Math.max(3, (r.unconf / max) * 100) + "%", height: "100%", background: T[CAT_SERIES[r.cat] || "series5"] }} />
            </span>
          </button>
        );
      })}
    </div>
  );
}
function Panel({ title, help, right, children }) {
  return (
    <section className="np-panel" style={{ margin: 0 }}>
      <div className="np-panel-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
        <span style={{ color: T.text, fontWeight: 600 }}>{title}{help && <Help label={typeof title === "string" ? title : "this panel"} text={help} />}</span>
        {right}
      </div>
      <div className="np-panel-body">{children}</div>
    </section>
  );
}
const Empty = ({ children }) => <div className="np-empty">{children}</div>;
const Legendary = () => <Legend lead="Category:" items={CAT_ORDER.map((c) => ({ label: c, swatch: T[CAT_SERIES[c]] }))} />;
const WOW_LEGEND = [
  { label: "Falling (improving)", tone: "ok" },
  { label: "Growing", tone: "warn" },
  { label: "Growing by 20 or more", tone: "bad" },
];

/* ---- COMMAND ---------------------------------------------------------- */
function CommandView({ D, wk, other, go }) {
  const meta = metaFor(D, wk), pm = metaFor(D, other);
  const cats = catRows(D, wk, other);
  const total = meta.unconf;
  const movers = moverRows(D, wk, other);
  const worsen = movers.filter((m) => m.wow > 0).slice(0, 5);
  const improve = movers.filter((m) => m.wow < 0).slice(-5).reverse();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 var(--np-pad)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))", gap: 8, alignItems: "stretch" }}>
        <section className="np-panel" style={{ margin: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: "14px 12px" }}>
          <Gauge value={meta.ocr} prev={pm.ocr} />
        </section>
        <Panel title="Where the miss sits" help={GLOSSARY["Root Cause Category"]} right={<span className="np-muted">press a category to open its causes</span>}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(150px, 100%), 1fr))", gap: 8 }}>
            {cats.map((c) => {
              const st = unconfStatus(S, c.wow);
              const share = total > 0 ? c.unconf / total : 0;
              return (
                <button key={c.cat} type="button" className="np-card is-button" data-cat={c.cat} onClick={() => go("drill", { cat: c.cat })} title={`Open ${c.cat}`}>
                  <span className="lab"><Swatch cat={c.cat} />{c.cat}</span>
                  <span className="val" style={{ display: "block" }}>{nfmt(c.unconf)}</span>
                  <span style={{ fontSize: 12.5, color: T.textSec, lineHeight: 1.45 }}>
                    {percent(share, { digits: 0, zeroMeans: "zero" })} of the miss; <span style={{ color: st.color }}>{st.arrow} {nfmt(Math.abs(c.wow))}</span> {st.word} against {other}.
                  </span>
                </button>
              );
            })}
          </div>
        </Panel>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(360px, 100%), 1fr))", gap: 8 }}>
        <Panel title={<><span style={{ color: T.bad }}>{"▲"}</span> Act here first: growing week over week</>}
          right={<Hint text={`The detailed causes whose unconfirmed units grew most since ${other}. These are the new fires.`}><span className="np-muted">why these?</span></Hint>}>
          {worsen.length ? <CauseBars rows={worsen} onPick={(c) => go("drill", { cause: c, cat: D.catMap[c] })} />
            : <Empty>Nothing grew this week: every cause is flat or improving.</Empty>}
        </Panel>
        <Panel title={<><span style={{ color: T.good }}>{"▼"}</span> Holding the gains: falling week over week</>}
          right={<Hint text={`The causes that fell most since ${other}. Protect these wins.`}><span className="np-muted">why these?</span></Hint>}>
          {improve.length ? <CauseBars rows={improve} onPick={(c) => go("drill", { cause: c, cat: D.catMap[c] })} />
            : <Empty>Nothing fell this week.</Empty>}
        </Panel>
      </div>
      <div className="np-panel" style={{ margin: 0 }}><Legendary /></div>
    </div>
  );
}

/* ---- ROOT CAUSES ------------------------------------------------------ */
function DimMini({ title, rows, help, onPick }) {
  const max = Math.max(1, ...rows.map((r) => r.v));
  const top = rows.slice(0, 6);
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: T.textSec, marginBottom: 7 }}>{title}{help && <Help label={title} text={help} />}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {top.length ? top.map((r) => (
          <button key={r.k} type="button" onClick={() => onPick && onPick(r.k)} title="Open these lines in the worklist"
            style={{ textAlign: "left", background: "transparent", border: 0, cursor: "pointer", padding: 0, font: "inherit", color: "inherit" }}>
            <span style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12.5, color: T.text, marginBottom: 2 }}>
              <span>{r.k}</span><span className="np-num" style={{ color: T.textSec }}>{nfmt(r.v)}</span>
            </span>
            <span style={{ display: "block", height: 6, borderRadius: 2, background: T.surfaceAlt, overflow: "hidden" }}>
              <span style={{ display: "block", width: Math.max(3, (r.v / max) * 100) + "%", height: "100%", background: T.series2 }} />
            </span>
          </button>
        )) : <Empty>No lines on this slice.</Empty>}
      </div>
    </div>
  );
}
function DrillView({ D, wk, other, drill, setDrill, go }) {
  const cat = drill.cat || null, cause = drill.cause || null;
  const cats = catRows(D, wk, other);
  const causes = causeRows(D, wk, other, cat);
  const flt = { cat, cause };
  const causeRow = cause ? causeRows(D, wk, other, cat).find((r) => r.cause === cause) : null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 var(--np-pad)" }}>
      <nav aria-label="Where you are" className="np-row" style={{ fontSize: 13 }}>
        <button type="button" className="np-btn quiet" aria-current={!cat ? "page" : undefined} onClick={() => setDrill({})}>All categories</button>
        {cat && <><span className="np-muted">›</span><button type="button" className="np-btn quiet" aria-current={!cause ? "page" : undefined} onClick={() => setDrill({ cat })}>{cat}</button></>}
        {cause && <><span className="np-muted">›</span><span style={{ color: T.text }}>{cause}</span></>}
      </nav>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))", gap: 8, alignItems: "start" }}>
        <Panel title={cat ? `${cat}: detailed causes` : "Pick a category"} help={GLOSSARY["Detailed Root Cause"]}>
          {!cat && (
            <div className="np-row" data-role="cat-chips">
              {cats.map((c) => {
                const st = unconfStatus(S, c.wow);
                return (
                  <button key={c.cat} type="button" className="np-chip" aria-pressed="false" onClick={() => setDrill({ cat: c.cat })}>
                    <Swatch cat={c.cat} /> {c.cat} <span className="n">{nfmt(c.unconf)}</span> <span style={{ color: st.color }}>{st.arrow}{nfmt(Math.abs(c.wow))}</span>
                  </button>
                );
              })}
            </div>
          )}
          {cat && <CauseBars rows={causes} onPick={(c) => setDrill({ cat: D.catMap[c] || cat, cause: c })} />}
        </Panel>
        <Panel title={cause ? `${cause}: where it concentrates` : "Breakdown"}>
          {!cause && <Empty>{cat ? "Pick a cause to see where it concentrates and what to do." : "Pick a category, then a cause."}</Empty>}
          {cause && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div data-role="dims" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(200px, 100%), 1fr))", gap: 16 }}>
                <DimMini title="By region" rows={dimAgg(D, wk, "region", flt)} onPick={(k) => go("worklist", { cause, region: k })} />
                <DimMini title="By product line" rows={dimAgg(D, wk, "division", flt)} onPick={(k) => go("worklist", { cause, division: k })} />
                <DimMini title="By site" rows={dimAgg(D, wk, "site", flt)} help={GLOSSARY.RDC} onPick={(k) => go("worklist", { cause, site: k })} />
                <DimMini title="By supply source" rows={dimAgg(D, wk, "supplier", flt)} help={GLOSSARY.Overseas} onPick={(k) => go("worklist", { cause, supplier: k })} />
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", color: T.textMuted, marginBottom: 6 }}>Recommended actions</p>
                <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: T.textSec, lineHeight: 1.55, display: "flex", flexDirection: "column", gap: 5 }}>
                  {(D.actions[cause] && D.actions[cause].length ? D.actions[cause] : ["Open the lines and confirm the driver before acting."]).map((a, i) => <li key={i}>{a}</li>)}
                </ol>
              </div>
              <div>
                <button type="button" className="np-btn primary" onClick={() => go("worklist", { cause })}>
                  Open the {nfmt(causeRow ? causeRow.unconf : 0)} unconfirmed units in the worklist
                </button>
              </div>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

/* ---- CUSTOMERS -------------------------------------------------------- */
function CustomerView({ D, wk, other, go }) {
  const rows = customerScorecard(D, wk, other);
  const red = rows.filter((r) => r.rate < 70 && (r.conf + r.unconf) >= 50).sort((a, b) => a.rate - b.rate);
  const [sort, setSort] = useState("unconf");
  const tableRef = useRef(null);
  const sorted = [...rows].sort((a, b) => { if (sort === "rate") return a.rate - b.rate; if (sort === "wow") return b.wow - a.wow; return b.unconf - a.unconf; }).slice(0, 40);
  useLayoutEffect(() => { pinColumns(tableRef.current); }, [sorted]);
  const Sort = ({ k, children }) => (
    <button type="button" onClick={() => setSort(k)} aria-pressed={sort === k} title="Sort by this column">{children}{sort === k ? " ▾" : ""}</button>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {red.length > 0 && (
        <>
          <div className="np-intro" style={{ paddingTop: 0 }}><b>Service crisis:</b> {count(red.length, "customer")} under 70% confirmation with 50 units or more on order. Press one to open its lines.</div>
          <AnswerCards>
            {red.map((r) => (
              <AnswerCard key={r.name} label={r.name} value={pc(r.rate, 0)} tone="bad" onClick={() => go("worklist", { customer: r.name })} title="Open this customer's unconfirmed lines">
                {nfmt(r.unconf)} units unconfirmed; {wowText(r.wow)} against {other}.
              </AnswerCard>
            ))}
          </AnswerCards>
        </>
      )}
      <div className="np-gridwrap">
        <div className="np-gridhead">
          <span style={{ color: T.text, fontWeight: 600 }}>Customer scorecard</span>
          <span>{rows.length > 40 ? `the first 40 of ${count(rows.length, "customer")}` : `all ${count(rows.length, "customer")}`} with unconfirmed units · press a header to sort, a row to open its lines</span>
        </div>
        <div className="np-scroll">
          <table className="np-grid" ref={tableRef} style={{ minWidth: 640 }}>
            <thead>
              <tr>
                <th className="pin">Customer</th>
                <th className="r"><Sort k="rate">OCR</Sort><Help label="OCR" text={GLOSSARY.OCR} /></th>
                <th className="r"><Sort k="unconf">Unconfirmed</Sort></th>
                <th className="r"><Sort k="wow">WoW</Sort><Help label="WoW" text={GLOSSARY.WoW} /></th>
                <th>11-week confirmation</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => {
                const st = unconfStatus(S, r.wow);
                return (
                  <tr key={r.name} className="is-row" onClick={() => go("worklist", { customer: r.name })} title="Open this customer's unconfirmed lines">
                    <td className="pin"><span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Dot tone={rateDot(r.rate)} title={`Confirmation ${pc(r.rate, 0)}`} /><span style={{ color: T.text }}>{r.name}</span></span></td>
                    <td className="r num">{pc(r.rate, 0)}</td>
                    <td className="r num">{nfmt(r.unconf)}</td>
                    <td className="r num" style={{ color: st.color }} title={st.word}>{st.arrow}{nfmt(Math.abs(r.wow))}</td>
                    <td style={{ paddingTop: 3, paddingBottom: 3 }}>{r.ftl ? <Sparkline series={r.ftl} /> : <span className="np-muted">—</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Legend lead="Confirmation:" items={[
          { label: "95% or more", tone: "ok" }, { label: "90% to 95%", tone: "warn" }, { label: "under 90%", tone: "bad" },
        ]} />
        <Legend lead="Week over week:" items={WOW_LEGEND} />
      </div>
    </div>
  );
}

/* ---- WORKLIST --------------------------------------------------------- */
const FILTER_NAME = { cat: "Category", cause: "Cause", region: "Region", division: "Product line", site: "Site", supplier: "Supply", customer: "Customer" };
const CAP = 400;
function WorklistView({ D, wk, seed, flt, setFlt }) {
  const [q, setQ] = useState(flt.q || "");
  const tableRef = useRef(null);
  const eff = { ...flt, q: q || undefined };
  const rows = lineRows(D, wk, eff);
  const allRows = lineRows(D, wk, {});
  const total = rows.reduce((a, r) => a + r.uq, 0);
  const chips = Object.entries(flt).filter(([k, v]) => v && k !== "q");
  useLayoutEffect(() => { pinColumns(tableRef.current); }, [rows.length, q]);

  const exportWorkbook = async (full) => {
    const XLSX = await import("xlsx");
    const data = full ? allRows : rows;
    const header = ["Region", "Product Line", "Site", "Customer", "Product", "Material", "Order", "Item", "Loc Type", "Supply", "cRDD", "Order Qty", "Unconfirmed", "Category", "Detailed Cause", "Reason"];
    const body = data.map((r) => [r.rg, r.dv, r.site, r.cust, r.prod, r.mat, r.doc, r.it, r.loc, r.sup, r.crdd, r.oq, r.uq, r.cat, r.det, r.rsn]);
    writeWorkbook(XLSX, {
      slug: SLUG, which: full ? "full" : "filtered", tool: NAME,
      what: full
        ? `Every unconfirmed order line in ${wk} (${allRows.length}), with its cause, category and reason.`
        : `The ${count(data.length, "unconfirmed line")} the filters showed in ${wk}, with cause, category and reason.`,
      source: `The ${NORTHPOINT.company} sample, generated in your browser from seed ${seed}, ${wk} as of ${houseDate(D.meta[wk].asof)}`,
      shown: full ? [] : [...chips.map(([k, v]) => `${FILTER_NAME[k] || k}: ${v}`), ...(q ? [`Search: "${q}"`] : [])],
      sheets: [{ name: full ? "All unconfirmed" : "Filtered", rows: [header, ...body] }],
    });
  };

  return (
    <div className="np-gridwrap">
      <div className="np-gridhead">
        <span style={{ color: T.text, fontWeight: 600 }}>Unconfirmed worklist, {wk}</span>
        <span data-role="worklist-sum"><span className="np-num">{nfmt(rows.length)}</span> lines, <span className="np-num">{nfmt(total)}</span> units{chips.length || q ? " (filtered)" : ""}</span>
        <span style={{ marginLeft: "auto" }} />
        <ExportPair fullCount={allRows.length} filteredCount={rows.length} noun="lines" onFull={() => exportWorkbook(true)} onFiltered={() => exportWorkbook(false)} />
      </div>
      <div className="np-gridhead">
        <input className="np-in" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search customer, product, material, order or cause"
          aria-label="Search the worklist" style={{ flex: "1 1 260px" }} />
        {chips.map(([k, v]) => (
          <button key={k} type="button" className="np-chip" aria-pressed="true" title="Remove this filter"
            onClick={() => { const n = { ...flt }; delete n[k]; setFlt(n); }}>
            {FILTER_NAME[k] || k}: {v} ✕
          </button>
        ))}
        {(chips.length > 0 || q) && <button type="button" className="np-btn quiet" onClick={() => { setFlt({}); setQ(""); }}>Clear all</button>}
        <span>{rows.length > CAP ? <>Showing the first <span className="np-num">{CAP}</span> of <span className="np-num">{nfmt(rows.length)}</span>; both exports carry every line</> : <>Showing all <span className="np-num">{nfmt(rows.length)}</span></>}</span>
      </div>
      <div className="np-scroll">
        <table className="np-grid" ref={tableRef} style={{ minWidth: 1180 }}>
          <thead>
            <tr>
              <th className="pin">Order</th>
              <th className="pin">Customer</th>
              <th>Detailed cause<Help label="Detailed cause" text={GLOSSARY["Detailed Root Cause"]} /></th>
              <th>Category</th>
              <th>Product</th>
              <th>Material</th>
              <th>Site</th>
              <th>Supply</th>
              <th className="r">Unconfirmed</th>
              <th>cRDD<Help label="cRDD" text={GLOSSARY.cRDD} /></th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, CAP).map((r, i) => (
              <tr key={r.doc + r.it + i}>
                <td className="pin"><span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Swatch cat={r.cat} /><span className="code">{r.doc}</span></span></td>
                <td className="pin clip" title={r.cust}>{r.cust}</td>
                <td style={{ whiteSpace: "nowrap" }}><Hint text={r.rsn}><span style={{ color: T.text }}>{r.det}</span></Hint></td>
                <td style={{ whiteSpace: "nowrap" }}>{r.cat}</td>
                <td><span className="code" style={{ color: T.textSec }}>{r.prod}</span></td>
                <td><span className="code" style={{ color: T.textSec }}>{r.mat}</span></td>
                <td><span className="code" style={{ color: T.textSec }}>{r.site}</span></td>
                <td>{r.sup}</td>
                <td className="r num">{nfmt(r.uq)}</td>
                <td className="num">{houseDate(crddIso(r.crdd))}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr className="detail"><td colSpan={10} className="np-empty">No lines match these filters. Remove a filter or clear the search.</td></tr>}
          </tbody>
        </table>
      </div>
      <Legendary />
    </div>
  );
}

/* ---- ABOUT THE DATA --------------------------------------------------- */
function DataView({ D, wk, other }) {
  const meta = metaFor(D, wk);
  const sources = D.weeks.map((w) => ({ wk: w, file: `northpoint_order_confirmation_sample_${w.replace(/\s+/g, "").toLowerCase()}.csv`, meta: D.meta[w] }));
  const mis = Object.keys(D.catMap).filter((k) => D.secondaryRollup[k] !== D.catMap[k]);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 var(--np-pad)" }}>
      <Panel title="The sample feed">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))", gap: 8 }}>
          {sources.map((s) => (
            <div key={s.wk} data-role="source" style={{ border: `1px solid ${s.wk === wk ? T.accentText : T.border}`, borderRadius: T.radius, padding: "10px 12px", background: s.wk === wk ? T.surfaceAlt : "transparent" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <b style={{ color: T.text, fontWeight: 600 }}>{s.wk}{s.wk === wk ? " · shown" : s.wk === other ? " · compared" : ""}</b>
                <span className="np-muted">invented</span>
              </div>
              <div className="np-num" style={{ fontSize: 12, color: T.textSec, marginTop: 4, overflowWrap: "anywhere" }}>{s.file}</div>
              <div style={{ fontSize: 12.5, color: T.textMuted, marginTop: 4 }}>{nfmt(s.meta.unconf)} unconfirmed units · OCR {pc(s.meta.ocr, 2)} · as of {houseDate(s.meta.asof)}</div>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="How a line gets its cause" help={GLOSSARY.Waterfall}>
        <p style={{ fontSize: 13, color: T.textSec, lineHeight: 1.6 }}>
          A line is confirmed if its full quantity can ship complete on its <Term text={GLOSSARY.cRDD}>calculated requested date</Term>; otherwise the shortfall is unconfirmed and gets one cause, the first of these it satisfies:
        </p>
        <ol style={{ margin: "8px 0 0", paddingLeft: 20, columns: "2 16em", fontSize: 13, color: T.text }}>
          {WATERFALL.filter((w) => w !== "Needs Investigation").map((w) => <li key={w} style={{ marginBottom: 3 }}>{w} <span className="np-muted">→ {D.catMap[w]}</span></li>)}
        </ol>
        <p style={{ fontSize: 13, color: T.textSec, marginTop: 8 }}>
          OCR is confirmed over confirmed plus unconfirmed units. For {wk}: <span className="np-num">{nfmt(meta.conf)}</span> over <span className="np-num">{nfmt(meta.conf + meta.unconf)}</span> is <span className="np-num">{pc(meta.ocr, 2)}</span>.
        </p>
      </Panel>
      <Panel title="What it reconciles, and what it cannot compute">
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: T.textSec, lineHeight: 1.6, display: "flex", flexDirection: "column", gap: 6 }}>
          <li>The sample ships a <b style={{ color: T.text, fontWeight: 600 }}>second rollup that files two causes differently</b>: {mis.map((m, i) => <span key={m}><b style={{ color: T.text, fontWeight: 600 }}>{m}</b> as {D.secondaryRollup[m]}{i < mis.length - 1 ? " and " : ""}</span>)}, where the rollup this screen uses places both under <b style={{ color: T.text, fontWeight: 600 }}>{D.catMap[mis[0]]}</b>. The tool flags the divergence rather than trusting either.</li>
          <li><b style={{ color: T.text, fontWeight: 600 }}>What it cannot compute:</b> the value of the miss, because the extract carries no price. Nothing is guessed in its place.</li>
          <li>Actions stay in this tab. Writing them back to a system of record is the connector a delivered copy adds.</li>
        </ul>
      </Panel>
    </div>
  );
}

/* ---- THE CONSOLE ------------------------------------------------------ */
const VIEWS = [["command", "Command"], ["drill", "Root causes"], ["customers", "Customers"], ["worklist", "Worklist"], ["data", "About the data"]];

function Console() {
  const [seed, setSeed] = useState(SEED);
  const [wk, setWk] = useState(CURRENT);
  const [view, setView] = useState("command");
  const [drill, setDrill] = useState({});
  const [flt, setFlt] = useState({});

  const D = useMemo(() => buildData(seed), [seed]);
  const other = D.weeks.find((w) => w !== wk) || D.weeks[0];
  const meta = D.meta[wk], pm = D.meta[other];
  const cats = catRows(D, wk, other);
  const worstCat = [...cats].sort((a, b) => b.wow - a.wow)[0];
  const topCause = causeRows(D, wk, other, null)[0];
  const up = meta.ocr - pm.ocr;
  const unconfMove = meta.unconf - pm.unconf;
  const st = unconfStatus(S, unconfMove);

  const go = (v, f = {}) => { if (v === "drill") setDrill(f); if (v === "worklist") setFlt(f); setView(v); };
  const reload = () => { setSeed((s) => (s * 1664525 + 1013904223) >>> 0); setDrill({}); setFlt({}); };

  return (
    <>
      <div className="np-part">
        <div className="np-ident">
          <h2>{NORTHPOINT.company} · order confirmation, two sample weeks</h2>
          <p>Loaded <b>the synthetic sample</b>, generated in your browser from seed {seed}: {D.weeks.join(" and ")}, as of <b>{houseDate(D.meta[D.weeks[0]].asof)}</b> and <b>{houseDate(D.meta[D.weeks[1]].asof)}</b>, {count(D.lines.length, "unconfirmed line")} in all. No real company data.</p>
        </div>
        <div className="np-row">
          <button type="button" className="np-btn" onClick={reload} title="Draw a new deterministic sample from the next seed">New sample</button>
        </div>
      </div>

      <div className="np-bar">
        <div className="np-row" role="group" aria-label="Week">
          <span className="np-muted">Week</span>
          {D.weeks.map((w) => <button key={w} type="button" className="np-chip" aria-pressed={w === wk} onClick={() => setWk(w)}>{w}</button>)}
        </div>
        <div className="np-row" role="tablist" aria-label="Views">
          {VIEWS.map(([v, label]) => <button key={v} type="button" role="tab" className="np-chip" aria-selected={view === v} aria-pressed={view === v} onClick={() => setView(v)}>{label}</button>)}
        </div>
      </div>

      <Intro>
        In <b>{wk}</b>, as of {houseDate(meta.asof)}, <b>{pc(meta.ocr, 1)}</b> of ordered units were <Term text={GLOSSARY.OCR}>confirmed</Term> on the requested date, {up >= 0 ? "up" : "down"} {figure(Math.abs(up), { digits: 2, zeroMeans: "zero" })} points on {other}, and <b>{nfmt(meta.unconf)}</b> units were not, {nfmt(Math.abs(unconfMove))} {unconfMove <= 0 ? "fewer" : "more"} than in {other}.
        {" "}<b>{worstCat.cat}</b> moved most the wrong way ({figure(worstCat.wow, { sign: true, zeroMeans: "zero" })} units), and the largest single cause is <b>{topCause.cause}</b>.
      </Intro>
      <HowItWorks points={[
        { lead: "Every unconfirmed line gets exactly one cause.", text: "The causes are checked in a fixed priority order and the first one a line satisfies wins, so a line with several problems is booked to the most important." },
        { lead: `${WATERFALL.length} causes roll into ${CAT_ORDER.length} categories.`, text: `${CAT_ORDER.slice(0, -1).join(", ")} and ${CAT_ORDER[CAT_ORDER.length - 1]}; each category and cause opens to where it concentrates.` },
        { lead: "Two weeks are compared.", text: `Every figure is this week against the other; a cause growing since ${other} is a new fire, one falling is a gain to protect.` },
        { lead: "The confirmation rate is a plain ratio.", text: "Confirmed units over confirmed plus unconfirmed units, against a 95% service-level target." },
        { lead: "Nothing is guessed.", text: "The extract carries no price, so the value of the miss is not shown." },
      ]} />

      <AnswerCards>
        <AnswerCard label="Unconfirmed units" value={nfmt(meta.unconf)} tone={WORD_TONE[st.word]} help={GLOSSARY.Unconfirmed}>
          {st.arrow} {nfmt(Math.abs(unconfMove))} {st.word} against {other}: the volume that needs a cause and an action.
        </AnswerCard>
        <AnswerCard label="Confirmed on time" value={pc(meta.ocr, 1)} tone={rateTone(meta.ocr)} help={GLOSSARY.OCR}>
          {nfmt(meta.conf)} of {nfmt(meta.conf + meta.unconf)} units; the target is 95%.
        </AnswerCard>
        <AnswerCard label="Order volume" value={nfmt(meta.order)}>
          {figure(meta.order - pm.order, { sign: true, zeroMeans: "zero" })} units against {other}.
        </AnswerCard>
        <AnswerCard label="Lines to action" value={nfmt(meta.uncLines)} onClick={() => go("worklist", {})} title="Open the worklist">
          Unconfirmed order lines; press to open the worklist.
        </AnswerCard>
      </AnswerCards>

      <div style={{ marginTop: 8 }}>
        {view === "command" && <CommandView D={D} wk={wk} other={other} go={go} />}
        {view === "drill" && <DrillView D={D} wk={wk} other={other} drill={drill} setDrill={setDrill} go={go} />}
        {view === "customers" && <CustomerView D={D} wk={wk} other={other} go={go} />}
        {view === "worklist" && <WorklistView D={D} wk={wk} seed={seed} flt={flt} setFlt={setFlt} />}
        {view === "data" && <DataView D={D} wk={wk} other={other} />}
      </div>
    </>
  );
}

export default function OrderConfirmationCommandCenter() {
  return (
    <HouseFrame slug={SLUG} name={NAME} scope={SCOPE} manual={MANUAL}>
      <Console />
    </HouseFrame>
  );
}
