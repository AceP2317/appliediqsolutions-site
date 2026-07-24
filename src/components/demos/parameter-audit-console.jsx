import { useState, useMemo, useCallback, useRef, createContext, useContext, useEffect } from "react";
// xlsx is loaded lazily inside exportXlsx() so its ~480 KB chunk stays off the
// initial bundle — export is a secondary action.
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from "recharts";
import { Sun, Moon, RefreshCw, Download, ArrowLeft, Info, Cpu, X } from "lucide-react";

// Respect the OS reduced-motion preference (client:only island — window exists).
const REDUCE_MOTION = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ============================================================================
   PARAMETER AUDIT CONSOLE  ·  Northpoint Manufacturing  ·  Built by Ian Provencher

   A geography-aware MRP parameter governance demo. Audits planning settings
   (safety stock, lot size, rounding, lot procedure, time fence) against
   sourcing-tier × ABC × XYZ targets, weights by BOM criticality, and surfaces
   inventory-health and lifecycle findings — each with a dollar exposure.

   Public portfolio demo: synthetic self-loading data, fictional company,
   no real master data or ERP. Dispositions are in-session by design — write-
   back to a planning system or ticket queue is the connector story.
   ========================================================================== */

/* ---- EDITABLE CONSTANTS (re-skin the whole demo from here) --------------- */
const COMPANY = "Northpoint Manufacturing";
const SEED = 73;          // deterministic dataset seed
const SAMPLE_SIZE = 460;  // synthetic material-plant rows to generate
const PLANTS = ["P10", "P20"]; // two facilities — exercises (plant, material) keying

// Sourcing tiers: target days-of-supply + categorical color
const TGT = {
  jit:      { l: "JIT / Release", d: 0.5, c: "#06B6D4" }, // cyan
  local:    { l: "Local",         d: 1.5, c: "#22C55E" }, // green
  regional: { l: "Regional",      d: 3,   c: "#EAB308" }, // yellow
  domestic: { l: "Domestic",      d: 7,   c: "#F97316" }, // orange
  overseas: { l: "Overseas",      d: 30,  c: "#8B5CF6" }, // violet (distinct from severity)
  inhouse:  { l: "In-House",      d: 1,   c: "#0E7490" }, // deep cyan-slate
  unknown:  { l: "Unclassified",  d: 7,   c: "#94A3B8" }  // slate-muted
};

// Parameter matrix: target SS / lot / rounding (in days of supply) + lot procedure,
// per sourcing tier per ABC+XYZ segment. Illustrative targets for the demo.
const PM = {
  overseas: { AX:{ss:7,lot:46,rnd:5,lp:"PER"},AY:{ss:10,lot:40,rnd:5,lp:"PER"},AZ:{ss:14,lot:32,rnd:5,lp:"PER"},BX:{ss:8,lot:44,rnd:10,lp:"PER"},BY:{ss:12,lot:36,rnd:10,lp:"PER"},BZ:{ss:15,lot:30,rnd:10,lp:"OPT"},CX:{ss:5,lot:50,rnd:15,lp:"OPT"},CY:{ss:8,lot:44,rnd:15,lp:"OPT"},CZ:{ss:10,lot:40,rnd:15,lp:"OPT"},_d:{ss:10,lot:40,rnd:10,lp:"OPT"} },
  domestic: { AX:{ss:2,lot:10,rnd:1,lp:"PER"},AY:{ss:3,lot:8,rnd:1,lp:"PER"},AZ:{ss:4,lot:6,rnd:2,lp:"PER"},BX:{ss:2,lot:10,rnd:2,lp:"PER"},BY:{ss:3,lot:8,rnd:2,lp:"PER"},BZ:{ss:4,lot:6,rnd:3,lp:"OPT"},CX:{ss:1,lot:12,rnd:3,lp:"OPT"},CY:{ss:2,lot:10,rnd:5,lp:"OPT"},CZ:{ss:3,lot:8,rnd:5,lp:"OPT"},_d:{ss:3,lot:8,rnd:3,lp:"OPT"} },
  regional: { AX:{ss:.5,lot:5,rnd:.5,lp:"L4L"},AY:{ss:1,lot:4,rnd:.5,lp:"PER"},AZ:{ss:1.5,lot:3,rnd:1,lp:"PER"},BX:{ss:.5,lot:5,rnd:1,lp:"PER"},BY:{ss:1,lot:4,rnd:1,lp:"PER"},BZ:{ss:1.5,lot:3,rnd:1,lp:"OPT"},CX:{ss:.5,lot:5,rnd:2,lp:"OPT"},CY:{ss:1,lot:4,rnd:2,lp:"OPT"},CZ:{ss:1.5,lot:3,rnd:2,lp:"OPT"},_d:{ss:1,lot:4,rnd:1,lp:"PER"} },
  local:    { AX:{ss:.25,lot:2.5,rnd:0,lp:"L4L"},AY:{ss:.5,lot:2,rnd:0,lp:"L4L"},AZ:{ss:.75,lot:1.5,rnd:.5,lp:"PER"},BX:{ss:.25,lot:2.5,rnd:.5,lp:"L4L"},BY:{ss:.5,lot:2,rnd:.5,lp:"PER"},BZ:{ss:.75,lot:1.5,rnd:.5,lp:"PER"},CX:{ss:.25,lot:3,rnd:1,lp:"OPT"},CY:{ss:.5,lot:2.5,rnd:1,lp:"OPT"},CZ:{ss:.75,lot:2,rnd:1,lp:"OPT"},_d:{ss:.5,lot:2,rnd:.5,lp:"PER"} },
  jit:      { AX:{ss:0,lot:1,rnd:0,lp:"L4L"},AY:{ss:.1,lot:.8,rnd:0,lp:"L4L"},AZ:{ss:.25,lot:.5,rnd:0,lp:"L4L"},BX:{ss:0,lot:1,rnd:0,lp:"L4L"},BY:{ss:.1,lot:.8,rnd:0,lp:"L4L"},BZ:{ss:.25,lot:.5,rnd:0,lp:"L4L"},CX:{ss:0,lot:1,rnd:0,lp:"L4L"},CY:{ss:.1,lot:1,rnd:0,lp:"L4L"},CZ:{ss:.25,lot:1,rnd:0,lp:"L4L"},_d:{ss:.1,lot:.8,rnd:0,lp:"L4L"} },
  inhouse:  { AX:{ss:.25,lot:2,rnd:0,lp:"L4L"},AY:{ss:.5,lot:2,rnd:0,lp:"L4L"},AZ:{ss:1,lot:2,rnd:0,lp:"L4L"},BX:{ss:.25,lot:3,rnd:0,lp:"L4L"},BY:{ss:.5,lot:3,rnd:0,lp:"L4L"},BZ:{ss:1,lot:3,rnd:0,lp:"L4L"},CX:{ss:0,lot:5,rnd:0,lp:"MAKE"},CY:{ss:0,lot:5,rnd:0,lp:"MAKE"},CZ:{ss:.5,lot:5,rnd:0,lp:"MAKE"},_d:{ss:.5,lot:3,rnd:0,lp:"L4L"} }
};
PM.unknown = PM.domestic;

// Rule catalog: code -> display name
const RN = { SS:"Safety Stock \u0394", MOQ:"MOQ Review", RND:"Rounding \u0394", LP:"Lot Procedure \u0394", PTF:"Time Fence", DEAD:"Dead Stock", OVER:"Overstocked", UNDER:"Understocked", CLS:"Missing Class.", BLK:"Blocked Stock", PO_SS:"Phase-Out + SS", OBSOL:"Lifecycle Obsolete", PI_NO:"Phase-In No Stock", STRCR:"Structural Crit.", PHNTM:"Phantom Params" };

const NON_US = new Set("DE,IT,TR,MX,CN,TW,SI,ES,AT,FR,CH,CA,PL,TH,SK,CZ,PT,NL,JP,KR,IN,BR,GB,SE,HU,RO,VN,MY".split(","));

/* ====================== ENGINE  (pure, headless-testable) ================= */
/* ENGINE-START */
// Deterministic PRNG (xmur3 seed -> mulberry32)
function xmur3(str) { let h = 1779033703 ^ str.length; for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); } return function () { h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return (h ^= h >>> 16) >>> 0; }; }
function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// Stable content-derived id (cyrb53-lite) — never index-derived.
function cid(s) { let h1 = 0xdeadbeef, h2 = 0x41c6ce57; for (let i = 0; i < s.length; i++) { const ch = s.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); } h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909); h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909); return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36); }

const ADJ = ["Hinge","Bracket","Harness","Seal","Gasket","Module","Bearing","Valve","Clip","Spring","Panel","Grommet","Sensor","Coupler","Bushing","Shroud","Damper","Insert","Latch","Spacer","Manifold","Terminal","Standoff","Cap"];
const MAT = ["Zinc","EPDM","12V","Rev C","Stainless","Nylon 66","Copper","Brass","ABS","PA6-GF30","Silicone","Aluminum","Galv.","PTFE","HV","Class H","Tinned","Composite"];

// Generate a synthetic material-master + BOM dataset. ctx carries plants + tier lists.
function generateData(ctx) {
  const seedFn = xmur3(String(ctx.seed));
  const rnd = mulberry32(seedFn());
  const pick = arr => arr[Math.floor(rnd() * arr.length)];
  const rint = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const ctrls = ["M01","M02","M03","M04","M05","M06","M07","M08"];
  const ctrlName = { M01:"Holt, R.",M02:"Diaz, P.",M03:"Okafor, N.",M04:"Sato, K.",M05:"Brenner, L.",M06:"Vance, T.",M07:"Ruiz, A.",M08:"Fenn, C." };
  const supJIT = ["S4001","S4002","S4003"];
  const supLocal = ["S5001","S5002","S5003","S5004"];
  const supReg = ["S6001","S6002","S6003"];
  ctx.jitSet = new Set(supJIT); ctx.localSet = new Set(supLocal); ctx.regSet = new Set(supReg);
  const overseasC = ["DE","CN","TW","IT","MX","PL","TR","KR","VN"];
  const rows = [];

  // --- Constructed spot-check rows (known classifications by construction) ---
  const fixed = [
    { tag:"UNDER",  proc:"F", mtyp:"ROH", abc:"A", xyz:"X", ctry:"US", sup:"S7001", ss:0,  stk:40,  cons:[900,880,910,890,920,900], ml:0,  rv:0, lp:"PER", ptf:10, mrp:"PD", price:18, blk:0,  mc:"M01" },
    { tag:"DEAD",   proc:"F", mtyp:"ROH", abc:"C", xyz:"Z", ctry:"DE", sup:"S7002", ss:5,  stk:380, cons:[0,0,0,0,0,0],         ml:0,  rv:0, lp:"OPT", ptf:0,  mrp:"PD", price:22, blk:0,  mc:"M02" },
    { tag:"OVER",   proc:"F", mtyp:"ROH", abc:"B", xyz:"Y", ctry:"US", sup:"S7003", ss:30, stk:9000,cons:[180,170,175,165,172,168],ml:0, rv:0, lp:"OPT", ptf:10, mrp:"PD", price:9,  blk:0,  mc:"M03" },
    { tag:"CLS",    proc:"F", mtyp:"ROH", abc:"",  xyz:"",  ctry:"US", sup:"S7004", ss:10, stk:200, cons:[120,110,130,115,125,118],ml:0, rv:0, lp:"OPT", ptf:5,  mrp:"PD", price:6,  blk:0,  mc:"M04" },
    { tag:"BLK",    proc:"F", mtyp:"ROH", abc:"B", xyz:"X", ctry:"CN", sup:"S7005", ss:20, stk:500, cons:[300,290,310,295,305,300],ml:0, rv:0, lp:"PER", ptf:30, mrp:"PD", price:14, blk:6200,mc:"M05" },
    { tag:"PHNTM",  proc:"E", mtyp:"HALB",abc:"A", xyz:"X", ctry:"",   sup:"",      ss:40, stk:0,   cons:[600,590,610,595,605,600],ml:50, rv:0, lp:"L4L", ptf:0,  mrp:"PD", price:0,  blk:0,  mc:"UFB" },
    { tag:"SS0",    proc:"F", mtyp:"ROH", abc:"A", xyz:"X", ctry:"DE", sup:"S7006", ss:0,  stk:1200,cons:[400,390,410,395,405,400],ml:0, rv:0, lp:"PER", ptf:45, mrp:"PD", price:31, blk:0,  mc:"M06" },
    { tag:"MOQ",    proc:"F", mtyp:"ROH", abc:"C", xyz:"Z", ctry:"US", sup:"S7007", ss:5,  stk:300, cons:[60,55,65,58,62,60],     ml:9000,rv:0, lp:"OPT", ptf:10, mrp:"PD", price:4,  blk:0,  mc:"M07" },
    { tag:"PINO",   proc:"F", mtyp:"ROH", abc:"B", xyz:"X", ctry:"US", sup:"S7008", ss:0,  stk:0,   cons:[200,210,190,205,195,200],ml:0, rv:0, lp:"OPT", ptf:10, mrp:"PD", price:12, blk:0,  mc:"M08" }
  ];
  let pinoMat = "";
  fixed.forEach((f, i) => {
    const mat = "NP-" + (100001 + i);
    if (f.tag === "PINO") pinoMat = mat;
    rows.push(buildRow(ctx.plants[0], mat, descFor(pick), f, ctrlName[f.mc] || "Phantom Ctrl"));
  });

  // --- Random body ---
  for (let i = 0; i < ctx.sampleSize; i++) {
    const plant = pick(ctx.plants);
    const mat = "NP-" + (100100 + i);
    const r = rnd();
    let proc = r < 0.82 ? "F" : "E";
    let mtyp = rnd() < 0.78 ? "ROH" : "HALB";
    const mc = proc === "E" && rnd() < 0.18 ? "UFB" : pick(ctrls);
    const abc = rnd() < 0.08 ? "" : pick(["A","A","B","B","B","C","C","C","C"]);
    const xyz = rnd() < 0.08 ? "" : pick(["X","Y","Y","Z","Z","Z"]);
    // geography driver
    let ctry = "", sup = "";
    const g = rnd();
    if (proc === "F") {
      if (g < 0.10) { sup = pick(supJIT); ctry = "US"; }
      else if (g < 0.22) { sup = pick(supLocal); ctry = "US"; }
      else if (g < 0.34) { sup = pick(supReg); ctry = "US"; }
      else if (g < 0.62) { sup = "S" + rint(7000, 7999); ctry = "US"; }
      else if (g < 0.92) { sup = "S" + rint(8000, 8999); ctry = pick(overseasC); }
      else { sup = "S" + rint(9000, 9999); ctry = ""; } // missing -> unclassified
    }
    const price = +(rnd() * 60 + 1.5).toFixed(2);
    const base = rnd() < 0.12 ? 0 : rint(20, 1400); // some zero-consumption
    const cons = Array.from({ length: 6 }, () => base === 0 ? 0 : Math.max(0, Math.round(base * (0.7 + rnd() * 0.6))));
    const am = cons.reduce((a, b) => a + b, 0) / 6;
    const daily = am / 30;
    // seed a spread of defects
    const ssMode = rnd();
    const ss = ssMode < 0.18 ? 0 : Math.round(daily * (rnd() * 25));
    const stkMode = rnd();
    const stk = base === 0 ? rint(0, 400) : stkMode < 0.12 ? Math.round(am * (8 + rnd() * 10)) : stkMode < 0.22 ? Math.round(am * rnd() * 0.6) : Math.round(am * (0.8 + rnd() * 4));
    const ml = rnd() < 0.14 ? Math.round(daily * (rnd() * 60 + 30)) : Math.round(daily * (rnd() * 8));
    const rv = rnd() < 0.20 ? Math.round(daily * (rnd() * 25)) : 0;
    const lp = pick(["PER","OPT","L4L","",""]);
    const ptf = rnd() < 0.30 ? 0 : rnd() < 0.05 ? 360 : rint(3, 45);
    const mrp = rnd() < 0.06 ? "ND" : "PD";
    const blk = rnd() < 0.06 ? rint(1200, 14000) : 0;
    rows.push(buildRow(plant, mat, descFor(pick), { proc, mtyp, abc, xyz, ctry, sup, ss, stk, cons, ml, rv, lp, ptf, mrp, price, blk, mc }, ctrlName[mc] || ""));
  }

  // --- Synthetic BOM explosion (component -> parent FG SKUs, with lifecycle status) ---
  const bomRows = [];
  const STAT = ["Active","Active","Active","Active","Phased Out","Phase-Out Planned","Phase-In Planned"];
  const fgPerPlant = {};
  ctx.plants.forEach(p => { fgPerPlant[p] = Array.from({ length: 60 }, (_, k) => "NP-FG-" + p + "-" + (1000 + k)); });
  rows.forEach(row => {
    const plant = row["Plant"], mat = row["Material"];
    const isPino = mat === pinoMat;
    let nParents;
    const pr = rnd();
    if (isPino) nParents = 2;                      // constructed: guarantee BOM linkage for PI_NO
    else if (pr < 0.05) nParents = rint(20, 34);  // structurally critical
    else if (pr < 0.18) nParents = rint(5, 19);
    else if (pr < 0.62) nParents = rint(1, 4);
    else nParents = 0;                            // no BOM linkage (honest gap)
    const fgs = fgPerPlant[plant];
    const used = new Set();
    for (let k = 0; k < nParents; k++) {
      let fg; do { fg = fgs[Math.floor(rnd() * fgs.length)]; } while (used.has(fg) && used.size < fgs.length);
      used.add(fg);
      // constructed PI_NO material: force its first position to Phase-In Planned
      const st = (isPino && k === 0) ? "Phase-In Planned" : STAT[Math.floor(rnd() * STAT.length)];
      bomRows.push({ Plant: plant, SKU: fg, "Material Description": "FG " + fg.slice(-4), Level: "FG" }); // header row
      bomRows.push({ Plant: plant, Material: mat, Level: 1, Status: st, Quantity: rint(1, 6), "Replaces / Replaced By": rnd() < 0.15 ? "NP-" + rint(100000, 199999) : null });
    }
  });
  // mark some materials as fully obsolete by retro-tagging (kept simple: handled above via status mix)
  return { rows, bomRows };
}

function descFor(pick) { return pick(ADJ) + ", " + pick(MAT); }
function buildRow(plant, mat, desc, f, mcn) {
  return {
    Plant: plant, Material: mat, "Material Description": desc,
    "ABC Indicator": f.abc, XYZ: f.xyz, "Procurement Type": f.proc, "Material Type": f.mtyp,
    "MRP Controller": f.mc, "MRP controller name": mcn, "Lot Sizing Procedure": f.lp,
    Supplier: f.sup, "Name 1": f.sup ? "Supplier " + f.sup : "", "Country/Region Key": f.ctry, "Country Goods Suppl.": f.ctry,
    "Base Unit of Measure": "PC", "MRP Type": f.mrp, "Planning time fence": f.ptf, "Release Creation Profile": "",
    "Safety Stock": f.ss, "Total Stock": f.stk, "Stock value": f.stk * (f.price || 1), "Minimum Lot Size": f.ml,
    "Rounding value": f.rv, "Moving price": f.price, "Value blocked sto": f.blk,
    "Con.quantity act.month": f.cons[0], "Con.quantity act.month+1": f.cons[1], "Con.quantity act.month+2": f.cons[2],
    "Con.quantity act.month+3": f.cons[3], "Con.quantity act.month+4": f.cons[4], "Con.quantity act.month+5": f.cons[5]
  };
}

function classifyHALB(row) {
  const mc = String(row["MRP Controller"] || "").trim();
  const proc = String(row["Procurement Type"] || "").trim();
  if (mc === "UFB") return "phantom";
  if (proc === "F") return "external";
  return "counted";
}

function classifyGeo(row, ctx) {
  const proc = String(row["Procurement Type"] || "").trim();
  if (proc === "E") { return String(row["MRP Controller"] || "").trim() === "UFB" ? "phantom" : "inhouse"; }
  if (proc !== "F") return "unknown";
  const sup = String(row["Supplier"] || "").trim();
  if (ctx.jitSet.has(sup)) return "jit";
  if (ctx.localSet.has(sup)) return "local";
  if (ctx.regSet.has(sup)) return "regional";
  const c1 = String(row["Country Goods Suppl."] || "").trim().toUpperCase();
  const c2 = String(row["Country/Region Key"] || "").trim().toUpperCase();
  const c = c1 || c2;
  if (!c || c === "NAN" || c === "UNDEFINED") return "unknown";
  if (c === "US") return "domestic";
  if (NON_US.has(c) || c.length === 2) return "overseas";
  return "unknown";
}

// BOM keyed (plant, material) — never material alone.
function processBOM(rows, ctx) {
  const map = {}; const pDesc = {}; let curSku = "", curPlant = "";
  for (const row of rows) {
    const lv = row["Level"];
    if (lv != null && typeof lv === "string" && isNaN(Number(lv))) {
      curSku = String(row["SKU"] || "").trim(); curPlant = String(row["Plant"] || "").trim();
      if (curSku && !pDesc[curSku]) pDesc[curSku] = String(row["Material Description"] || "").trim().substring(0, 48);
      continue;
    }
    const mat = row["Material"]; if (mat == null) continue;
    const plant = String(row["Plant"] || curPlant || "").trim();
    const key = plant + "::" + String(mat).trim();
    if (!map[key]) map[key] = { parents: new Set(), act: 0, po: 0, pop: 0, pip: 0, repl: false, topP: {} };
    const m = map[key];
    if (curSku) { m.parents.add(curSku); m.topP[curSku] = (m.topP[curSku] || 0) + (Number(row["Quantity"]) || 0); }
    const st = String(row["Status"] || "");
    if (st === "Active") m.act++; else if (st === "Phased Out") m.po++; else if (st === "Phase-Out Planned") m.pop++; else if (st === "Phase-In Planned") m.pip++;
    if (row["Replaces / Replaced By"] != null) m.repl = true;
  }
  const r = {};
  for (const [key, m] of Object.entries(map)) {
    const sortedP = Object.entries(m.topP).sort((a, b) => b[1] - a[1]);
    r[key] = { pc: m.parents.size, act: m.act, po: m.po, pop: m.pop, pip: m.pip, repl: m.repl, top3: sortedP.slice(0, 3).map(e => e[0]), allParents: sortedP.map(([sku, qty]) => ({ sku, desc: pDesc[sku] || "", qty })), allOut: m.act === 0 && (m.po > 0 || m.pop > 0) };
  }
  return r;
}

// Main audit. ctx = { rows, bomMap, jitSet, localSet, regSet }. Returns findings[] (raw floats).
function runAudit(ctx) {
  const CC = ["Con.quantity act.month","Con.quantity act.month+1","Con.quantity act.month+2","Con.quantity act.month+3","Con.quantity act.month+4","Con.quantity act.month+5"];
  const out = [];
  const push = (rule, base, o) => out.push({ ...base, rule, fid: cid(base.pl + "|" + base.mat + "|" + rule), ...o });
  for (const row of ctx.rows) {
    const mat = String(row["Material"] || "").trim();
    const pl = String(row["Plant"] || "").trim();
    const desc = String(row["Material Description"] || "").trim().substring(0, 50);
    const abc = String(row["ABC Indicator"] || "").trim();
    const xyz = String(row["XYZ"] || "").trim();
    const proc = String(row["Procurement Type"] || "").trim();
    const mtyp = String(row["Material Type"] || "").trim();
    const mc = String(row["MRP Controller"] || "").trim();
    const mcn = String(row["MRP controller name"] || "").trim().substring(0, 22);
    const lp = String(row["Lot Sizing Procedure"] || "").trim();
    const sup = String(row["Supplier"] || "").trim();
    const supN = String(row["Name 1"] || "").trim();
    const ctry = String(row["Country/Region Key"] || "").trim();
    const uom = String(row["Base Unit of Measure"] || "PC").trim();
    const mrpType = String(row["MRP Type"] || "").trim();
    const ptf = Number(row["Planning time fence"]) || 0;
    const ss = Number(row["Safety Stock"]) || 0;
    const stk = Number(row["Total Stock"]) || 0;
    const sv = Number(row["Stock value"]) || 0;
    const ml = Number(row["Minimum Lot Size"]) || 0;
    const rv = Number(row["Rounding value"]) || 0;
    const price = Number(row["Moving price"]) || 0;
    const bv = Number(row["Value blocked sto"]) || 0;
    const cq = CC.map(c => Number(row[c]) || 0);
    const tc = cq.reduce((a, b) => a + b, 0);
    const am = tc / 6, daily = am / 30;
    const uc = stk > 0 ? sv / stk : price;          // full precision, round at display
    const mos = am > 0 ? stk / am : (stk > 0 ? 999 : 0);
    if (am === 0 && stk === 0 && bv === 0) continue;

    const geo = classifyGeo(row, ctx);
    const bom = ctx.bomMap ? ctx.bomMap[pl + "::" + mat] : null;
    const pc = bom ? bom.pc : 0;

    if (geo === "phantom") {
      if ((ss > 0 || ml > 0) && am > 0) {
        const base = mkBase({ mat, pl, desc, proc, mc, mcn, lp, abc, xyz, ss, stk, sv, ml, rv, ptf, mrpType, geo, geoL: "Phantom", tDays: 0, seg: "\u2014", sup, supN, ctry, uom, uc: 0, am: 0, daily: 0, mos: 0, pc, critMult: 1, rSS: 0, rRnd: 0, rLP: "", cAvgV: 0, rAvgV: 0, invD: 0, bv: 0, isPhantom: true, isND: false, halbType: "phantom", allOut: false, hasPIP: false, hasPOP: false, hasRepl: false, top3: bom ? bom.top3 : [], allParents: bom ? bom.allParents : [], cq });
        push("PHNTM", base, { sev: "LOW", exp: 0, dir: "CLEAN", act: "Phantom assembly carries SS=" + Math.round(ss) + ", MinLot=" + Math.round(ml) + " — planning ignores these. Zero them out in the item master.", det: "Phantom assemblies explode straight to components; their own planning parameters are never used." });
      }
      continue;
    }

    const halbType = mtyp === "HALB" ? classifyHALB(row) : "n/a";
    const abcN = "ABC".includes(abc) && abc ? abc : "";
    const xyzN = "XYZ".includes(xyz) && xyz ? xyz : "";
    const seg = abcN && xyzN ? abcN + xyzN : "_d";
    const matrix = PM[geo] || PM.unknown;
    const params = matrix[seg] || matrix._d;
    const tgt = TGT[geo] || TGT.unknown;
    const rSS = Math.ceil(daily * params.ss);
    const rLot = Math.max(1, Math.ceil(daily * params.lot));
    const rRnd = Math.max(0, Math.ceil(daily * params.rnd));
    const rLP = params.lp;
    const cAvg = ss + (ml > 0 ? ml / 2 : (rv > 0 ? rv / 2 : 0));
    const rAvg = rSS + rLot / 2;
    const cAvgV = cAvg * uc, rAvgV = rAvg * uc, invD = cAvgV - rAvgV;
    const isND = mrpType === "ND";
    const critMult = pc >= 20 ? 1.5 : pc >= 5 ? 1.2 : 1.0;
    const allOut = bom ? bom.allOut : false, hasPIP = bom ? bom.pip > 0 : false, hasPOP = bom ? bom.pop > 0 : false, hasRepl = bom ? bom.repl : false;
    const isExternal = proc === "F";

    const base = mkBase({ mat, pl, desc, proc, mc, mcn, lp, abc: abcN || "\u2014", xyz: xyzN || "\u2014", ss, stk, sv, ml, rv, ptf, mrpType, geo, geoL: tgt.l, tDays: tgt.d, seg: seg === "_d" ? "\u2014" : seg, sup, supN, ctry, uom, uc, am, daily, mos: Math.min(mos, 999), pc, critMult, rSS, rRnd, rLP, cAvgV, rAvgV, invD, bv, isPhantom: false, isND, halbType, allOut, hasPIP, hasPOP, hasRepl, top3: bom ? bom.top3 : [], allParents: bom ? bom.allParents : [], cq });

    // ---- Parameter findings (external procurement, MRP active) ----
    if (isExternal && am > 0 && !isND) {
      const adjRSS = Math.ceil(rSS * critMult), ssG = adjRSS - ss;
      if (Math.abs(ssG) > daily * 0.5) {
        const ssev = abcN === "A" ? (ss === 0 ? "CRITICAL" : "HIGH") : (ss === 0 && abcN === "B" ? "HIGH" : (pc >= 20 && ss === 0 ? "HIGH" : "MEDIUM"));
        const cn = pc >= 20 ? " [critical: " + pc + " parents]" : (pc >= 5 ? " [" + pc + " parents]" : "");
        push("SS", base, { sev: ssev, exp: Math.abs(ssG) * uc, dir: ssG > 0 ? "INCREASE" : "DECREASE", act: "Safety Stock: " + Math.round(ss) + " \u2192 " + Math.round(adjRSS) + " " + uom + ". Target " + params.ss + "d \u00d7 " + critMult + "x = " + (params.ss * critMult).toFixed(1) + "d for " + tgt.l + " " + (seg !== "_d" ? seg : "") + "." + cn, det: ss === 0 ? "No safety stock buffer on an active item." : "Current buffer " + (daily > 0 ? (ss / daily).toFixed(1) : "0") + "d vs " + (params.ss * critMult).toFixed(1) + "d target." });
      }
      if (ml > 0 && daily > 0 && ml > daily * params.lot * 3) {
        push("MOQ", base, { sev: ml > daily * params.lot * 5 ? "HIGH" : "MEDIUM", exp: (ml - daily * params.lot) * uc / 2, dir: "NEGOTIATE", act: "Min lot " + Math.round(ml) + " " + uom + " = " + (ml / daily).toFixed(1) + "d/order vs " + params.lot + "d target. Verify supplier agreement; negotiate or consign if supplier-imposed.", det: "Each order lands " + (ml / daily).toFixed(1) + " days of supply. MOQ treated as a constraint, not a unilateral change." });
      }
      if (rv > 0 && daily > 0 && Math.abs(rv - rRnd) > daily) {
        push("RND", base, { sev: rv > rRnd * 3 ? "HIGH" : "MEDIUM", exp: Math.abs(rv - rRnd) * uc / 2, dir: "REVIEW", act: "Rounding " + Math.round(rv) + " " + uom + " = " + (rv / daily).toFixed(1) + "d/order vs " + params.rnd + "d target. If packaging-driven, verify pack size; else reset to " + Math.round(rRnd) + ".", det: "Rounding often reflects a pack/pallet unit — confirm before changing." });
      }
      if (rLP && lp !== rLP) {
        push("LP", base, { sev: "MEDIUM", exp: 0, dir: "CHANGE", act: "Lot procedure: " + (lp || "(blank)") + " \u2192 " + rLP + " for " + tgt.l + " " + (abcN || "") + "-class.", det: rLP === "PER" ? "Period lot sizing — responsive to delivery frequency." : rLP === "L4L" ? "Lot-for-lot — minimal inventory." : rLP === "OPT" ? "Optimized — consolidates orders." : "Recommended for segment." });
      }
      if (ptf === 0) {
        const recPtf = geo === "overseas" ? 45 : geo === "domestic" ? 10 : geo === "regional" ? 7 : geo === "local" ? 3 : geo === "jit" ? 1 : 5;
        push("PTF", base, { sev: abcN === "A" ? "HIGH" : "MEDIUM", exp: 0, dir: "SET", act: "Planning time fence 0 \u2192 " + recPtf + "d. A zero fence lets planning churn orders inside lead time.", det: "No firm horizon — the planning run reschedules freely, creating noise." });
      } else if (ptf >= 333) {
        push("PTF", base, { sev: "MEDIUM", exp: 0, dir: "REDUCE", act: "Planning time fence " + ptf + "d \u2192 review. An over-long fence suppresses real demand signals.", det: ptf + "-day fence blocks the planning run from responding to demand." });
      }
    }

    // ---- In-house counted subassemblies (ABC-A buffer) ----
    if (proc === "E" && geo === "inhouse" && am > 0 && !isND) {
      const ihAdj = Math.ceil(rSS * critMult), ihG = ihAdj - ss;
      if (Math.abs(ihG) > daily * 0.5 && abcN === "A") {
        push("SS", base, { sev: ss === 0 ? "HIGH" : "MEDIUM", exp: Math.abs(ihG) * uc, dir: ihG > 0 ? "INCREASE" : "DECREASE", act: "Safety Stock: " + Math.round(ss) + " \u2192 " + Math.round(ihAdj) + " " + uom + ". In-house ABC-A target " + (params.ss * critMult).toFixed(1) + "d for production variability.", det: "Counted subassembly produced in-house; ABC-A needs a buffer against line variability." });
      }
    }

    // ---- Inventory-health findings (all types) ----
    if (stk > 0 && tc === 0) {
      push("DEAD", base, { sev: "MEDIUM", exp: sv, dir: "REVIEW", act: Math.round(stk) + " " + uom + " (" + fmt(sv) + ") with zero consumption over 6 months." + (isND ? " Disposition: scrap / transfer / return." : " Set to No-MRP, then disposition."), det: "Stagnant stock." + (allOut ? " All BOM positions phased out — obsolescence signal." : "") });
    }
    if (am > 0 && mos > 6 && isExternal && !isND) {
      const eq = Math.max(0, stk - (am * tgt.d / 30 * 1.5)), ev = eq * uc;
      if (ev > 100) push("OVER", base, { sev: "HIGH", exp: ev, dir: "REDUCE", act: mos.toFixed(1) + "mo on hand vs " + tgt.d + "d target. Excess ~" + Math.ceil(eq) + " " + uom + " (" + fmt(ev) + ").", det: tgt.l + " items should target " + tgt.d + " days of supply." });
    }
    if (am > 0 && mos > 0 && mos < 1 && ss === 0 && isExternal && !isND) {
      push("UNDER", base, { sev: "CRITICAL", exp: am * uc, dir: "URGENT", act: "Only " + mos.toFixed(1) + "mo supply and no safety stock. Expedite and set SS = " + Math.ceil(rSS * critMult) + " " + uom + "." + (pc >= 10 ? " Affects " + pc + " parent SKUs." : ""), det: am.toFixed(0) + " " + uom + "/mo consumption." + (pc > 0 ? " Parents: " + (base.top3 || []).slice(0, 3).join(", ") : "") });
    }
    if (am > 0 && (!abcN || !xyzN) && isExternal && !isND) {
      push("CLS", base, { sev: "LOW", exp: 0, dir: "CLASSIFY", act: "Missing " + (!abcN ? "ABC" : "") + (!abcN && !xyzN ? " & " : "") + (!xyzN ? "XYZ" : "") + " class. Run the analysis; defaults are being used until then.", det: "Cannot tune parameters without segmentation." + (pc > 0 ? " Feeds " + pc + " SKUs." : "") });
    }
    if (bv > 1000) {
      push("BLK", base, { sev: "MEDIUM", exp: bv, dir: "REVIEW", act: fmt(bv) + " in blocked stock — review to release, return, or scrap.", det: "Blocked stock tying up working capital." });
    }

    // ---- Lifecycle findings (BOM-driven; honest gap when no linkage) ----
    if (bom) {
      if (hasPOP && ss > 0 && am > 0) {
        push("PO_SS", base, { sev: "HIGH", exp: ss * uc, dir: "REDUCE", act: "Phase-out planned but SS=" + Math.round(ss) + ". Wind safety stock to 0; on-hand covers " + (am > 0 ? (stk / am).toFixed(1) : "\u221e") + "mo.", det: bom.pop + " position(s) phasing out." + (hasRepl ? " Replacement exists." : "") });
      }
      if (allOut && stk > 0 && !isND) {
        push("OBSOL", base, { sev: "HIGH", exp: sv, dir: "DISPOSE", act: "All BOM positions retired but " + Math.round(stk) + " " + uom + " (" + fmt(sv) + ") on hand. Set No-MRP and disposition.", det: bom.po + " phased out, " + bom.pop + " phase-out planned." + (hasRepl ? " Supersession exists." : "") });
      }
      if (hasPIP && stk === 0 && !isND && isExternal) {
        push("PI_NO", base, { sev: "HIGH", exp: 0, dir: "PREPARE", act: "Phase-in planned but zero stock. Initiate procurement before the phase-in date.", det: bom.pip + " position(s) phase-in planned." });
      }
      if (pc >= 20 && abcN === "C" && am > 0 && !isND) {
        push("STRCR", base, { sev: "MEDIUM", exp: 0, dir: "REVIEW", act: "ABC-C but feeds " + pc + " parent SKUs — structurally critical. Consider reclassifying to B/A. Top: " + (base.top3 || []).join(", "), det: "A stockout here cascades across " + pc + " SKUs." });
      }
    }
  }
  return out;
}

function mkBase(o) { return o; }
// display formatters (rounding happens HERE, not in the engine)
function fmt(v) { return (v == null || isNaN(v)) ? "\u2014" : "$" + Math.round(v).toLocaleString(); }
/* ENGINE-END */

const F = fmt;
const N = v => (v == null || isNaN(v)) ? "\u2014" : Number(v).toLocaleString(undefined, { maximumFractionDigits: 1 });
const I = v => v == null || isNaN(v) ? "\u2014" : Math.round(v).toLocaleString();
const MO = { fontFamily: "'JetBrains Mono','SF Mono','Courier New',monospace" };

/* ============================ THEME (vivid / slate) ======================= */
const SEV = { CRITICAL: "#EF4444", HIGH: "#F97316", MEDIUM: "#EAB308", LOW: "#64748B" };
const DIRC = { INCREASE:"#22C55E", PREPARE:"#22C55E", DECREASE:"#EAB308", REDUCE:"#EAB308", NEGOTIATE:"#EAB308", URGENT:"#EF4444", DISPOSE:"#EF4444", REVIEW:"#06B6D4", CHANGE:"#06B6D4", SET:"#06B6D4", CLASSIFY:"#64748B", CLEAN:"#64748B" };
const THEME = {
  dark:  { bg:"#0F172A", surface:"#1E293B", surfaceAlt:"#334155", border:"#334155", borderHi:"#475569", text:"#F1F5F9", textSec:"#94A3B8", textMuted:"#64748B", accent:"#06B6D4", rowHover:"#1E293B", thBg:"#1E293B" },
  light: { bg:"#F8FAFC", surface:"#FFFFFF", surfaceAlt:"#F1F5F9", border:"#E2E8F0", borderHi:"#CBD5E1", text:"#0F172A", textSec:"#475569", textMuted:"#94A3B8", accent:"#0891B2", rowHover:"#F1F5F9", thBg:"#F1F5F9" }
};

/* ============================ GLOSSARY + TOOLTIPS ========================= */
const GLOSSARY = {
  "Safety Stock": "A buffer quantity held to cover demand or supply variability during the replenishment lead time. The audit compares the current buffer to a target expressed in days of supply.",
  "ABC": "Value-based classification: A items drive most of the spend/value, C items the least. Tighter parameters are justified on A items.",
  "XYZ": "Demand-variability classification: X is steady, Z is erratic. Combined with ABC it segments items into 9 buckets, each with its own parameter targets.",
  "Days of Supply": "How long current stock (or a buffer) lasts at the average consumption rate. The common currency the audit uses to compare items of very different volumes.",
  "Lot Procedure": "The rule that decides order quantities — lot-for-lot (L4L), period (PER), or optimized (OPT). The right rule depends on order frequency and sourcing distance.",
  "Min Lot / MOQ": "Minimum order quantity. Often supplier-imposed, so the audit flags an oversized MOQ as a constraint to verify or negotiate — not a value to change unilaterally.",
  "Rounding": "Order quantities are rounded up to a multiple of this value, usually a pack, box, or pallet size. Excess rounding inflates average inventory.",
  "Time Fence": "A firm horizon inside which the planning run won't reschedule orders. Zero lets the engine churn inside lead time; an over-long fence suppresses real demand.",
  "Exposure": "An estimate of the working capital or risk a finding represents, in dollars — used to rank the worklist. Estimated, not a booked figure.",
  "Months of Supply (MoS)": "Current stock divided by average monthly consumption. Below ~1 signals stockout risk; above the geo target signals overstock.",
  "Criticality Multiplier": "Components feeding many finished-goods SKUs carry a larger safety-stock target (1.2x at 5+ parents, 1.5x at 20+) because a stockout cascades widely.",
  "Phantom Assembly": "A subassembly that exists only to structure the bill of material — it explodes straight to its components and is never stocked. Its own planning parameters are ignored, so any set values are cleanup noise.",
  "Where-Used": "The set of parent finished-goods SKUs a component feeds. Drives criticality and lets a planner see the blast radius of a stockout.",
  "Lifecycle Status": "Each BOM position is Active, Phase-In Planned, Phase-Out Planned, or Phased Out. The audit reconciles parameters against where an item sits in its lifecycle.",
  "Sourcing Tier": "A geography bucket (JIT, Local, Regional, Domestic, Overseas, In-House) with its own days-of-supply target — closer sourcing justifies leaner buffers.",
  "No-MRP (ND)": "An item flagged to suppress the planning run. The audit skips parameter recommendations for these but still flags leftover stock for disposition.",
  "Unclassified": "An item the audit can't place in a sourcing tier because country/supplier data is missing — an honest data-quality gap, defaulted to Domestic targets and surfaced rather than hidden."
};
const TipCtx = createContext(null);
function TipProvider({ children }) {
  const [tip, setTip] = useState(null);
  return (<TipCtx.Provider value={setTip}>{children}<TipLayer tip={tip} /></TipCtx.Provider>);
}
function TipLayer({ tip }) {
  if (!tip) return null;
  const w = 280, x = Math.min(Math.max(8, tip.x - w / 2), (typeof window !== "undefined" ? window.innerWidth : 1200) - w - 8);
  return (<div style={{ position: "fixed", left: x, top: tip.y + 14, width: w, zIndex: 9999, background: "#0B1220", color: "#E2E8F0", border: "1px solid #334155", borderRadius: 8, padding: "9px 11px", fontSize: 11.5, lineHeight: 1.5, boxShadow: "0 8px 24px rgba(0,0,0,.45)", pointerEvents: "none" }}><div style={{ fontWeight: 700, marginBottom: 3, color: "#22D3EE", ...MO, fontSize: 11 }}>{tip.title}</div>{tip.body}</div>);
}
function Q({ term, children }) {
  const setTip = useContext(TipCtx);
  const body = GLOSSARY[term] || children;
  const show = e => { const r = e.currentTarget.getBoundingClientRect(); setTip({ x: r.left + r.width / 2, y: r.bottom, title: term, body }); };
  const hide = () => setTip(null);
  return (<span tabIndex={0} onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 13, height: 13, borderRadius: "50%", border: "1px solid currentColor", fontSize: 9, lineHeight: 1, cursor: "help", opacity: .6, marginLeft: 3, verticalAlign: "middle", ...MO }}>?</span>);
}

/* ============================ SMALL UI PRIMITIVES ========================= */
function Badge({ s }) { const c = SEV[s] || SEV.LOW; return (<span style={{ background: c, color: "#fff", padding: "2px 7px", borderRadius: 4, fontSize: 9, fontWeight: 700, letterSpacing: .6, ...MO }}>{s}</span>); }
function DirBadge({ dir }) { const c = DIRC[dir] || DIRC.REVIEW; return (<span style={{ background: c + "26", color: c, border: "1px solid " + c + "66", padding: "2px 7px", borderRadius: 4, fontSize: 9, fontWeight: 700, ...MO }}>{dir}</span>); }
function GeoBadge({ geo }) { const t = TGT[geo] || TGT.unknown; return (<span style={{ background: t.c + "1f", color: t.c, border: "1px solid " + t.c + "55", padding: "2px 7px", borderRadius: 4, fontSize: 9, fontWeight: 600, whiteSpace: "nowrap", ...MO }}>{t.l} ({t.d}d)</span>); }
function KPI({ label, value, sub, color, T }) { return (<div style={{ background: T.surface, border: "1px solid " + T.border, borderRadius: 8, padding: "11px 13px", flex: 1, minWidth: 104, borderTop: "3px solid " + (color || T.accent) }}><div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2, ...MO }}>{label}</div><div style={{ fontSize: 17, fontWeight: 700, color: T.text, ...MO }}>{value}</div>{sub && <div style={{ fontSize: 10, color: T.textMuted, marginTop: 1 }}>{sub}</div>}</div>); }
function Pills({ opts, sel, onTog, label, T, colorMap }) { return (<div><div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 3, ...MO }}>{label}</div><div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>{opts.map(o => { const on = sel.includes(o); const ac = (colorMap && colorMap[o]) || T.accent; return (<button key={o} onClick={() => onTog(o)} style={{ padding: "2px 8px", borderRadius: 4, border: "1px solid " + (on ? ac : T.border), background: on ? ac + "22" : "transparent", color: on ? ac : T.textMuted, fontSize: 10, cursor: "pointer", ...MO }}>{o}</button>); })}</div></div>); }

/* ============================ MAIN APP ==================================== */
export default function App() {
  const [mode, setMode] = useState("dark");
  const T = THEME[mode];
  const [seedN, setSeedN] = useState(SEED);
  const [data, setData] = useState(null);
  const [findings, setFindings] = useState([]);
  const [view, setView] = useState("worklist");
  const [selMat, setSelMat] = useState(null);
  const [dismissed, setDismissed] = useState({});       // fid -> true (in-session only)
  const [toast, setToast] = useState(null);
  const [sevF, setSevF] = useState(["CRITICAL", "HIGH", "MEDIUM", "LOW"]);
  const [geoF, setGeoF] = useState(Object.keys(TGT).filter(k => k !== "phantom"));
  const [plantF, setPlantF] = useState("");
  const [ctrlF, setCtrlF] = useState("");
  const [ruleF, setRuleF] = useState("");
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState("exp");
  const [sortDir, setSortDir] = useState("desc");
  const [showHow, setShowHow] = useState(false);
  const tog = s => v => s(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v]);

  const build = useCallback((sd) => {
    const ctx = { seed: sd, sampleSize: SAMPLE_SIZE, plants: PLANTS };
    const { rows, bomRows } = generateData(ctx);
    const bomMap = processBOM(bomRows, ctx);
    const aCtx = { rows, bomMap, jitSet: ctx.jitSet, localSet: ctx.localSet, regSet: ctx.regSet };
    const res = runAudit(aCtx);
    setData({ rows, bomMap }); setFindings(res); setDismissed({}); setSelMat(null);
  }, []);
  useEffect(() => { build(seedN); }, []); // self-load on boot

  const regenerate = () => { const s = (seedN + 7) % 9999; setSeedN(s); build(s); flash("Regenerated synthetic dataset (seed " + s + ")"); };
  const flash = msg => { setToast(msg); setTimeout(() => setToast(null), 2600); };
  const dismiss = (fid, e) => { e.stopPropagation(); setDismissed(d => ({ ...d, [fid]: true })); flash("Dismissed (in-session). In production this writes back to your planning system or ticket queue."); };

  const allCtrls = useMemo(() => [...new Set(findings.map(f => f.mc))].sort(), [findings]);

  const filtered = useMemo(() => {
    let f = findings.filter(r => !dismissed[r.fid] && sevF.includes(r.sev) && geoF.includes(r.geo) && (!plantF || r.pl === plantF) && (!ctrlF || r.mc === ctrlF) && (!ruleF || r.rule === ruleF));
    if (search) { const t = search.toLowerCase(); f = f.filter(r => r.mat.toLowerCase().includes(t) || r.desc.toLowerCase().includes(t) || (r.mc || "").toLowerCase().includes(t) || r.act.toLowerCase().includes(t)); }
    f = [...f].sort((a, b) => { let va = a[sortCol], vb = b[sortCol]; if (typeof va === "string") return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va); return sortDir === "asc" ? (va || 0) - (vb || 0) : (vb || 0) - (va || 0); });
    return f;
  }, [findings, dismissed, sevF, geoF, plantF, ctrlF, ruleF, search, sortCol, sortDir]);

  const liveAll = useMemo(() => findings.filter(r => !dismissed[r.fid]), [findings, dismissed]);

  const stats = useMemo(() => {
    const src = filtered; if (!src.length) return null;
    const bySev = {}, byGeo = {}, byRule = {}, byCtrl = {};
    src.forEach(f => {
      (bySev[f.sev] ||= { n: 0, e: 0 }).n++; bySev[f.sev].e += f.exp;
      (byGeo[f.geo] ||= { n: 0, e: 0 }).n++; byGeo[f.geo].e += f.exp;
      (byRule[f.rule] ||= { n: 0, e: 0 }).n++; byRule[f.rule].e += f.exp;
      (byCtrl[f.mc] ||= { nm: f.mcn, n: 0, e: 0, cr: 0 }).n++; byCtrl[f.mc].e += f.exp; if (f.sev === "CRITICAL") byCtrl[f.mc].cr++;
    });
    return { bySev, byGeo, byRule, byCtrl, totalE: src.reduce((s, f) => s + f.exp, 0) };
  }, [filtered]);

  const matCount = data ? new Set(data.rows.map(r => r.Plant + r.Material)).size : 0;

  // ---- exports (full + filtered pair) ----
  const rowsToAOA = (rs) => {
    const head = ["Plant","Material","Description","Controller","ABC","XYZ","Proc","Type","Geo","TgtDays","Seg","Parents","CritX","CurSS","RecSS","CurMinLot","CurRnd","RecRnd","CurLP","RecLP","PTF","Avg/Mo","MoS","Stock $","InvΔ $","Severity","Dir","Rule","Exposure $","Action","Detail","TopParents"];
    const body = rs.map(f => [f.pl, f.mat, f.desc, f.mc, f.abc, f.xyz, f.proc, f.halbType || "", f.geoL, f.tDays, f.seg, f.pc, f.critMult, Math.round(f.ss), Math.round(f.rSS), Math.round(f.ml), Math.round(f.rv), Math.round(f.rRnd), f.lp, f.rLP, f.ptf, +(f.am).toFixed(1), +(f.mos).toFixed(1), Math.round(f.sv), Math.round(f.invD), f.sev, f.dir, RN[f.rule] || f.rule, Math.round(f.exp), f.act, f.det, (f.top3 || []).join("; ")]);
    return [head, ...body];
  };
  const exportXlsx = async (rs, tag) => {
    if (!rs.length) { flash("Nothing to export"); return; }
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.aoa_to_sheet(rowsToAOA(rs));
    ws["!cols"] = [8,11,26,9,5,5,6,7,12,8,6,8,6,8,8,10,8,8,7,7,6,8,6,10,10,9,10,16,11,60,60,28].map(w => ({ wch: w }));
    ws["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rs.length, c: 31 } }) };
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Findings");
    XLSX.writeFile(wb, "northpoint-parameter-audit-" + tag + ".xlsx");
  };

  const card = { background: T.surface, border: "1px solid " + T.border, borderRadius: 8 };
  const byline = (<div style={{ fontSize: 10, color: T.textMuted, ...MO }}>Built by Ian Provencher · <span style={{ color: T.accent }}>{COMPANY}</span> demo · synthetic data</div>);

  /* ----------------------------- DETAIL VIEW ----------------------------- */
  if (selMat && data) {
    const [p, m0] = selMat.split("||");
    const mf = liveAll.filter(f => f.pl === p && f.mat === m0);
    const m = mf[0] || findings.find(f => f.pl === p && f.mat === m0);
    if (!m) { setSelMat(null); return null; }
    const adjRSS = Math.ceil((m.rSS || 0) * (m.critMult || 1));
    const paramRows = [
      { p: "Safety Stock", cur: I(m.ss), rec: I(adjRSS), d: adjRSS - m.ss, path: "Item Master → Planning" },
      { p: "Min Lot Size", cur: I(m.ml), rec: "\u26a0 verify MOQ", note: true, path: "Supplier Agreement" },
      { p: "Rounding", cur: I(m.rv), rec: I(m.rRnd), d: (m.rRnd || 0) - m.rv, path: "Item Master → Lot Sizing" },
      { p: "Lot Procedure", cur: m.lp || "\u2014", rec: m.rLP, txt: true, path: "Item Master → Lot Sizing" },
      { p: "Time Fence", cur: I(m.ptf), rec: m.ptf === 0 ? String(m.geo === "overseas" ? 45 : m.geo === "domestic" ? 10 : m.geo === "regional" ? 7 : m.geo === "local" ? 3 : 5) : "OK", txt: true, path: "Item Master → Planning" }
    ];
    return (
      <div style={{ background: T.bg, color: T.text, minHeight: "100vh", fontFamily: "'Inter',system-ui,sans-serif", padding: 16 }}>
        <button onClick={() => setSelMat(null)} style={{ background: "none", border: "none", color: T.accent, cursor: "pointer", fontSize: 12, ...MO, marginBottom: 8, display: "inline-flex", alignItems: "center", gap: 4 }}><ArrowLeft size={13} /> Back to worklist</button>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 2 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, ...MO }}>{m.mat}</h2>
          <span style={{ fontSize: 10, color: T.textMuted, ...MO }}>· Plant {m.pl}</span>
          <GeoBadge geo={m.geo} />
          {m.abc !== "\u2014" && <span style={{ fontSize: 10, ...MO }}>{m.abc}{m.xyz !== "\u2014" ? m.xyz : ""}</span>}
          {m.halbType && m.halbType !== "n/a" && <span style={{ fontSize: 9, color: T.textSec, border: "1px solid " + T.border, padding: "1px 5px", borderRadius: 3, ...MO }}>{m.halbType}</span>}
          {m.mrpType && <span style={{ fontSize: 9, color: T.textMuted, border: "1px solid " + T.border, padding: "1px 5px", borderRadius: 3, ...MO }}>MRP:{m.mrpType}</span>}
          {m.pc > 0 && <span style={{ fontSize: 9, color: m.pc >= 20 ? SEV.HIGH : m.pc >= 5 ? SEV.MEDIUM : T.textMuted, border: "1px solid " + T.border, padding: "1px 5px", borderRadius: 3, ...MO }}>{m.pc} parents</span>}
        </div>
        <p style={{ color: T.textSec, fontSize: 12, margin: "0 0 1px" }}>{m.desc}</p>
        <p style={{ color: T.textMuted, fontSize: 10, margin: "0 0 12px" }}>{m.mc} ({m.mcn || "—"}) · {m.supN || "no supplier"} {m.ctry ? "(" + m.ctry + ")" : ""}{(m.top3 || []).length ? " · Parents: " + m.top3.join(", ") : ""}</p>

        {!m.isPhantom && !m.isND && m.proc === "F" && m.am > 0 && (
          <div style={{ ...card, padding: 12, marginBottom: 12, overflowX: "auto" }}>
            <div style={{ fontSize: 10, color: T.text, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6, ...MO }}>Parameters — {m.geoL} {m.seg !== "\u2014" ? m.seg : ""} ({m.tDays}d){m.critMult > 1 ? " × " + m.critMult + "x crit" : ""}</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, ...MO }}>
              <thead><tr>{["Param", "Current", "Recommended", "\u0394", "Path"].map(h => (<th key={h} style={{ padding: "4px 8px", textAlign: "left", fontSize: 9, color: T.textMuted, borderBottom: "1px solid " + T.border, textTransform: "uppercase" }}>{h}</th>))}</tr></thead>
              <tbody>
                {paramRows.map((r, i) => {
                  const ch = r.note ? false : r.txt ? String(r.cur) !== String(r.rec) && r.rec !== "OK" : Math.abs(r.d) > 0;
                  return (<tr key={i} style={{ background: ch ? T.accent + "11" : "transparent" }}><td style={{ padding: "4px 8px" }}>{r.p}</td><td style={{ padding: "4px 8px", color: ch ? SEV.MEDIUM : T.text }}>{r.cur}</td><td style={{ padding: "4px 8px", color: r.note ? SEV.MEDIUM : ch ? "#22C55E" : T.text, fontWeight: ch ? 600 : 400 }}>{r.rec}</td><td style={{ padding: "4px 8px", color: !ch ? T.textMuted : (r.d > 0 ? "#22C55E" : SEV.MEDIUM) }}>{r.note ? "constraint" : r.txt ? (ch ? "\u2192" : "OK") : ((r.d > 0 ? "+" : "") + I(r.d))}</td><td style={{ padding: "4px 8px", color: T.textMuted, fontSize: 9 }}>{r.path}</td></tr>);
                })}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
          <KPI T={T} label="Stock $" value={F(m.sv)} color={T.textSec} />
          <KPI T={T} label="Avg / Mo" value={N(m.am)} color="#22C55E" />
          <KPI T={T} label="MoS" value={m.mos > 100 ? "\u221e" : N(m.mos)} color={m.mos > 6 ? SEV.MEDIUM : m.mos < 1 ? SEV.CRITICAL : "#22C55E"} />
          <KPI T={T} label="Cur AvgInv $" value={F(m.cAvgV)} color={T.textMuted} />
          <KPI T={T} label="Rec AvgInv $" value={F(m.rAvgV)} color={T.accent} />
          <KPI T={T} label="Inv Δ $" value={F(m.invD)} sub={m.invD > 0 ? "release" : "invest"} color={m.invD > 0 ? "#22C55E" : SEV.MEDIUM} />
        </div>

        {m.cq && m.cq.some(v => v > 0) && (
          <div style={{ ...card, padding: 10, marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: T.text, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6, ...MO }}>6-Month Consumption <span style={{ color: T.textMuted, textTransform: "none", letterSpacing: 0 }}>· stock {I(m.stk)} · SS {I(m.ss)} {m.uom}</span></div>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={["Cur","+1","+2","+3","+4","+5"].map((lbl, i) => ({ month: lbl, qty: Math.round(m.cq[i] || 0) }))} margin={{ left: 4, right: 40, top: 8, bottom: 4 }}>
                <XAxis dataKey="month" stroke={T.border} tick={{ fontSize: 10, fill: T.textSec, ...MO }} />
                <YAxis stroke={T.border} tick={{ fontSize: 9, fill: T.textSec, ...MO }} tickFormatter={v => v >= 1000 ? (v / 1000).toFixed(1) + "k" : v} />
                <Tooltip isAnimationActive={!REDUCE_MOTION} formatter={v => N(v) + " " + (m.uom || "PC")} contentStyle={{ background: T.surface, border: "1px solid " + T.border, borderRadius: 6, fontSize: 11 }} />
                {m.stk > 0 && <ReferenceLine y={m.stk} stroke={T.textSec} strokeDasharray="4 3" label={{ value: "Stock", fill: T.textSec, fontSize: 9, position: "right" }} />}
                {m.ss > 0 && <ReferenceLine y={m.ss} stroke={SEV.CRITICAL} strokeDasharray="4 3" label={{ value: "SS", fill: SEV.CRITICAL, fontSize: 9, position: "right" }} />}
                <Bar dataKey="qty" radius={[3, 3, 0, 0]} fill={T.accent} fillOpacity={.8} isAnimationActive={!REDUCE_MOTION} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div style={{ fontSize: 10, color: T.text, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6, ...MO }}>Findings ({mf.length})</div>
        {mf.map((f) => (
          <div key={f.fid} style={{ ...card, padding: 10, marginBottom: 5, borderLeft: "3px solid " + SEV[f.sev] }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3, flexWrap: "wrap" }}><Badge s={f.sev} /><DirBadge dir={f.dir} /><span style={{ fontSize: 10, color: T.textSec, ...MO }}>{RN[f.rule] || f.rule}</span><span style={{ marginLeft: "auto", color: T.accent, fontWeight: 700, ...MO, fontSize: 11 }}>{F(f.exp)}</span></div>
            <p style={{ color: T.text, fontSize: 11.5, margin: "0 0 2px", lineHeight: 1.45, ...MO }}>{f.act}</p>
            <p style={{ color: T.textMuted, fontSize: 10, margin: 0, fontStyle: "italic" }}>{f.det}</p>
          </div>
        ))}

        {m.allParents && m.allParents.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 10, color: T.text, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6, ...MO }}>Where-Used<Q term="Where-Used" /> <span style={{ color: T.textMuted, textTransform: "none", letterSpacing: 0 }}>· {m.allParents.length} FG SKU{m.allParents.length === 1 ? "" : "s"}{m.pc >= 20 ? " · high criticality" : m.pc >= 5 ? " · elevated" : ""}</span></div>
            <div style={{ ...card, maxHeight: 260, overflow: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead><tr>{["FG SKU","Description","Qty/Asm"].map((h, i) => (<th key={h} style={{ padding: "4px 8px", textAlign: i === 2 ? "right" : "left", fontSize: 9, color: T.textMuted, borderBottom: "1px solid " + T.border, textTransform: "uppercase", ...MO, background: T.thBg, position: "sticky", top: 0, zIndex: 1 }}>{h}</th>))}</tr></thead>
                <tbody>{m.allParents.map((pp, i) => (<tr key={i} style={{ borderBottom: "1px solid " + T.border }}><td style={{ padding: "3px 8px", fontSize: 10, ...MO, fontWeight: 700 }}>{pp.sku}</td><td style={{ padding: "3px 8px", color: T.textSec, fontSize: 10 }}>{pp.desc || "\u2014"}</td><td style={{ padding: "3px 8px", fontSize: 10, ...MO, textAlign: "right" }}>{N(pp.qty)}</td></tr>))}</tbody>
              </table>
            </div>
          </div>
        )}
        <div style={{ marginTop: 18 }}>{byline}</div>
      </div>
    );
  }

  /* ----------------------------- DASHBOARD ------------------------------- */
  const ctrlChart = stats ? Object.entries(stats.byCtrl).sort((a, b) => b[1].e - a[1].e).slice(0, 12).map(([c, v]) => ({ name: c, e: v.e, full: c + " — " + (v.nm || "") })) : [];
  const ruleChart = stats ? Object.entries(stats.byRule).sort((a, b) => b[1].e - a[1].e).map(([id, v]) => ({ name: (RN[id] || id), id, e: v.e, n: v.n })) : [];
  const critN = stats?.bySev.CRITICAL?.n || 0, highN = stats?.bySev.HIGH?.n || 0;

  return (
    <TipProvider>
      <div style={{ background: T.bg, color: T.text, minHeight: "100vh", fontFamily: "'Inter',system-ui,sans-serif", padding: 14 }}>
        {/* header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
          <div>
            <div style={{ fontSize: 9, color: T.accent, letterSpacing: 2, textTransform: "uppercase", ...MO }}>{COMPANY} · Planning</div>
            <h1 style={{ fontSize: 19, fontWeight: 800, margin: "2px 0 0", letterSpacing: -.3 }}>Parameter Audit Console</h1>
          </div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
            {["worklist", "summary", "controllers", "reference"].map(v => (
              <button key={v} onClick={() => setView(v)} style={{ padding: "5px 10px", background: view === v ? T.accent + "22" : T.surface, border: "1px solid " + (view === v ? T.accent : T.border), color: view === v ? T.accent : T.textSec, borderRadius: 5, fontSize: 10.5, cursor: "pointer", ...MO, textTransform: "capitalize" }}>{v}</button>
            ))}
            <button onClick={() => exportXlsx(liveAll, "full")} title="Every live finding in the dataset, ignoring filters" style={{ padding: "5px 9px", background: "#22C55E22", border: "1px solid #22C55E", color: "#22C55E", borderRadius: 5, fontSize: 10, cursor: "pointer", ...MO, display: "inline-flex", alignItems: "center", gap: 4 }}><Download size={12} />Full ({liveAll.length})</button>
            <button onClick={() => exportXlsx(filtered, "filtered")} title="Exactly the rows currently on screen, with active filters applied" style={{ padding: "5px 9px", background: T.surface, border: "1px solid " + T.border, color: T.textSec, borderRadius: 5, fontSize: 10, cursor: "pointer", ...MO, display: "inline-flex", alignItems: "center", gap: 4 }}><Download size={12} />Filtered ({filtered.length})</button>
            <button onClick={regenerate} title="Generate a fresh synthetic dataset" style={{ padding: "5px 9px", background: T.surface, border: "1px solid " + T.border, color: T.textSec, borderRadius: 5, fontSize: 10, cursor: "pointer", ...MO, display: "inline-flex", alignItems: "center", gap: 4 }}><RefreshCw size={12} />Regenerate</button>
            <button onClick={() => setMode(mode === "dark" ? "light" : "dark")} title="Toggle theme" style={{ padding: "5px 8px", background: T.surface, border: "1px solid " + T.border, color: T.textSec, borderRadius: 5, cursor: "pointer", display: "inline-flex" }}>{mode === "dark" ? <Sun size={13} /> : <Moon size={13} />}</button>
          </div>
        </div>

        {/* intro + KPIs */}
        <div style={{ ...card, padding: "10px 12px", marginBottom: 8 }}>
          <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: T.textSec }}>
            Of <b style={{ color: T.text }}>{matCount.toLocaleString()}</b> material-plant records across {PLANTS.length} facilities, <b style={{ color: T.text }}>{liveAll.length.toLocaleString()}</b> carry a parameter, inventory, or lifecycle finding worth an estimated <b style={{ color: T.accent }}>{F(liveAll.reduce((s, f) => s + f.exp, 0))}</b> in exposure<Q term="Exposure" />. Each finding is sized by <Q term="Days of Supply">days of supply</Q> against a <Q term="Sourcing Tier">sourcing-tier</Q> × <Q term="ABC">ABC</Q>/<Q term="XYZ">XYZ</Q> target and weighted by BOM <Q term="Criticality Multiplier">criticality</Q>.
            <button onClick={() => setShowHow(h => !h)} style={{ marginLeft: 6, background: "none", border: "none", color: T.accent, cursor: "pointer", fontSize: 11.5, ...MO }}>{showHow ? "hide" : "How this works"}</button>
          </p>
          {showHow && (
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid " + T.border, fontSize: 11.5, color: T.textSec, lineHeight: 1.6 }}>
              <b style={{ color: T.text }}>1 · Classify</b> each item into a sourcing tier from its procurement type, supplier tier list, and country (closer sourcing → leaner target). <b style={{ color: T.text }}>2 · Target</b> safety-stock / lot / rounding days from a tier × ABC × XYZ matrix, then convert to quantities at the item's daily run rate. <b style={{ color: T.text }}>3 · Weight</b> safety-stock targets by how many finished-goods SKUs the component feeds (1.2x at 5+ parents, 1.5x at 20+). <b style={{ color: T.text }}>4 · Audit</b> current vs. target across {Object.keys(RN).length} rules — parameters, inventory health, and lifecycle reconciliation — sized in dollars. MOQ and rounding are flagged as <i>constraints to verify</i>, not values to change blindly; items with missing data surface as an honest <Q term="Unclassified">Unclassified</Q> gap rather than a fabricated number.
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
          <KPI T={T} label="Findings" value={filtered.length.toLocaleString()} sub={matCount.toLocaleString() + " materials"} color={T.accent} />
          <KPI T={T} label="Exposure" value={F(stats ? stats.totalE : 0)} color={SEV.CRITICAL} />
          <KPI T={T} label="Critical" value={critN.toLocaleString()} sub={F(stats?.bySev.CRITICAL?.e || 0)} color={SEV.CRITICAL} />
          <KPI T={T} label="High" value={highN.toLocaleString()} sub={F(stats?.bySev.HIGH?.e || 0)} color={SEV.HIGH} />
          <KPI T={T} label="BOM" value={data ? Object.keys(data.bomMap).length.toLocaleString() : "—"} sub="linked comps" color={T.textSec} />
          {Object.keys(dismissed).length > 0 && <KPI T={T} label="Dismissed" value={Object.keys(dismissed).length.toLocaleString()} sub="this session" color="#22C55E" />}
        </div>

        {/* filters */}
        {view !== "reference" && (
          <div style={{ ...card, padding: 8, marginBottom: 8 }}>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end" }}>
              <Pills T={T} label="Severity" opts={["CRITICAL", "HIGH", "MEDIUM", "LOW"]} sel={sevF} onTog={tog(setSevF)} colorMap={SEV} />
              <Pills T={T} label="Sourcing tier" opts={Object.keys(TGT).filter(k => k !== "phantom")} sel={geoF} onTog={tog(setGeoF)} colorMap={Object.fromEntries(Object.entries(TGT).map(([k, v]) => [k, v.c]))} />
              <div><div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 3, ...MO }}>Search</div>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="material, desc, ctrl…" style={{ padding: "4px 7px", background: T.bg, border: "1px solid " + T.border, borderRadius: 4, color: T.text, fontSize: 11, width: 160, ...MO, outline: "none" }} /></div>
              <div><div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 3, ...MO }}>Plant</div>
                <select value={plantF} onChange={e => setPlantF(e.target.value)} style={{ padding: "4px 7px", background: T.bg, border: "1px solid " + T.border, borderRadius: 4, color: T.text, fontSize: 11, ...MO, outline: "none" }}><option value="">All</option>{PLANTS.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
              <div><div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 3, ...MO }}>Controller</div>
                <select value={ctrlF} onChange={e => setCtrlF(e.target.value)} style={{ padding: "4px 7px", background: T.bg, border: "1px solid " + T.border, borderRadius: 4, color: T.text, fontSize: 11, ...MO, outline: "none" }}><option value="">All</option>{allCtrls.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              {ruleF && (<div><div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 3, ...MO }}>Rule</div>
                <button onClick={() => setRuleF("")} style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid " + T.accent, background: T.accent + "22", color: T.accent, fontSize: 10, cursor: "pointer", ...MO }}>{RN[ruleF] || ruleF} ×</button></div>)}
            </div>
          </div>
        )}

        {/* WORKLIST */}
        {view === "worklist" && (
          <div>
            <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 4, ...MO }}>{filtered.length.toLocaleString()} actions · {F(stats ? stats.totalE : 0)} · click a row for detail · hover a row for the reason</div>
            <div style={{ overflow: "auto", border: "1px solid " + T.border, borderRadius: 8, maxHeight: "max(440px, calc(100vh - 320px))", overscrollBehavior: "contain" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead><tr>
                  {[["sev","Sev",1],["dir","Act",0],["mat","Material",0],["desc","Description",0],["pl","Plt",0],["geo","Tier",0],["mc","Ctrl",0],["abc","Seg",0],["pc","#SKU",0],["exp","Exp $",0],["x","",0]].map(([c, l], idx) => (
                    <th key={c} onClick={() => { if (!l) return; sortCol === c ? setSortDir(d => d === "asc" ? "desc" : "asc") : (setSortCol(c), setSortDir("desc")); }}
                      style={{ padding: "5px 6px", textAlign: c === "exp" || c === "pc" ? "right" : "left", fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: .5, cursor: l ? "pointer" : "default", borderBottom: "1px solid " + T.borderHi, ...MO, whiteSpace: "nowrap", position: "sticky", top: 0, background: T.thBg, zIndex: idx === 2 ? 3 : 2, left: idx === 2 ? 0 : undefined }}>{l}{sortCol === c && l ? (sortDir === "desc" ? " \u25be" : " \u25b4") : ""}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {filtered.slice(0, 400).map((f) => (
                    <tr key={f.fid} onClick={() => setSelMat(f.pl + "||" + f.mat)} title={f.act} style={{ cursor: "pointer", borderBottom: "1px solid " + T.border }}
                      onMouseEnter={e => { e.currentTarget.style.background = T.rowHover; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                      <td style={{ padding: "4px 6px" }}><Badge s={f.sev} /></td>
                      <td style={{ padding: "4px 6px" }}><DirBadge dir={f.dir} /></td>
                      <td style={{ padding: "4px 6px", fontSize: 10, ...MO, position: "sticky", left: 0, background: T.bg, zIndex: 1 }}>{f.mat}</td>
                      <td style={{ padding: "4px 6px", color: T.textSec, fontSize: 10, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.desc}</td>
                      <td style={{ padding: "4px 6px", color: T.textMuted, fontSize: 10, ...MO }}>{f.pl}</td>
                      <td style={{ padding: "4px 6px" }}><GeoBadge geo={f.geo} /></td>
                      <td style={{ padding: "4px 6px", color: T.textMuted, fontSize: 10, ...MO }}>{f.mc}</td>
                      <td style={{ padding: "4px 6px", fontSize: 10, ...MO, textAlign: "center" }}>{f.abc !== "\u2014" ? f.abc : ""}{f.xyz !== "\u2014" ? f.xyz : ""}</td>
                      <td style={{ padding: "4px 6px", color: f.pc >= 20 ? SEV.HIGH : f.pc >= 5 ? SEV.MEDIUM : T.textMuted, fontSize: 10, ...MO, textAlign: "right" }}>{f.pc || "\u2014"}</td>
                      <td style={{ padding: "4px 6px", fontWeight: 700, fontSize: 10, ...MO, textAlign: "right", color: T.text }}>{F(f.exp)}</td>
                      <td style={{ padding: "4px 4px" }}><button onClick={e => dismiss(f.fid, e)} title="Dismiss (in-session)" style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", display: "inline-flex", opacity: .6 }}><X size={12} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length > 400 && <div style={{ padding: 6, textAlign: "center", color: T.textMuted, fontSize: 10, ...MO }}>showing 400 of {filtered.length.toLocaleString()} — filter or export the full list</div>}
            </div>
          </div>
        )}

        {/* SUMMARY */}
        {view === "summary" && stats && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ ...card, padding: 10 }}>
              <div style={{ fontSize: 10, color: T.text, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6, ...MO }}>Exposure by finding type <span style={{ color: T.textMuted, textTransform: "none" }}>· click to filter</span></div>
              <ResponsiveContainer width="100%" height={Math.max(200, ruleChart.length * 24)}>
                <BarChart data={ruleChart} layout="vertical" margin={{ left: 4, right: 10 }}>
                  <XAxis type="number" tickFormatter={v => "$" + (v / 1000).toFixed(0) + "k"} stroke={T.border} tick={{ fontSize: 9, fill: T.textSec }} />
                  <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 9, fill: T.textSec }} stroke="transparent" />
                  <Tooltip isAnimationActive={!REDUCE_MOTION} formatter={v => F(v)} contentStyle={{ background: T.surface, border: "1px solid " + T.border, borderRadius: 6, fontSize: 11 }} />
                  <Bar dataKey="e" radius={[0, 3, 3, 0]} cursor="pointer" isAnimationActive={!REDUCE_MOTION} onClick={d => { if (d?.id) { setRuleF(d.id); setView("worklist"); } }}>
                    {ruleChart.map((d, i) => <Cell key={i} fill={T.accent} fillOpacity={.85} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ ...card, padding: 10 }}>
              <div style={{ fontSize: 10, color: T.text, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6, ...MO }}>Top controllers <span style={{ color: T.textMuted, textTransform: "none" }}>· click to filter</span></div>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={ctrlChart} margin={{ left: 0, right: 10 }}>
                  <XAxis dataKey="name" stroke={T.border} tick={{ fontSize: 9, fill: T.textSec }} />
                  <YAxis tickFormatter={v => "$" + (v / 1000).toFixed(0) + "k"} stroke={T.border} tick={{ fontSize: 9, fill: T.textSec }} />
                  <Tooltip isAnimationActive={!REDUCE_MOTION} formatter={v => F(v)} labelFormatter={l => { const d = ctrlChart.find(c => c.name === l); return d ? d.full : l; }} contentStyle={{ background: T.surface, border: "1px solid " + T.border, borderRadius: 6, fontSize: 11 }} />
                  <Bar dataKey="e" radius={[3, 3, 0, 0]} fill="#8B5CF6" fillOpacity={.85} cursor="pointer" isAnimationActive={!REDUCE_MOTION} onClick={d => { if (d?.name) { setCtrlF(d.name); setView("worklist"); } }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ ...card, padding: 10, gridColumn: "1/-1" }}>
              <div style={{ fontSize: 10, color: T.text, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6, ...MO }}>By sourcing tier</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {Object.entries(stats.byGeo).map(([g, v]) => { const t = TGT[g] || TGT.unknown; return (
                  <div key={g} onClick={() => { setGeoF([g]); setView("worklist"); }} style={{ background: T.bg, border: "1px solid " + t.c + "55", borderRadius: 6, padding: "8px 12px", borderLeft: "3px solid " + t.c, flex: 1, minWidth: 120, cursor: "pointer" }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: t.c }}>{t.l} <span style={{ color: T.textMuted, fontWeight: 400 }}>({t.d}d)</span></div>
                    <div style={{ fontSize: 18, fontWeight: 700, ...MO }}>{v.n.toLocaleString()}</div>
                    <div style={{ fontSize: 10, color: T.textMuted }}>{F(v.e)}</div>
                  </div>
                ); })}
              </div>
            </div>
          </div>
        )}

        {/* CONTROLLERS */}
        {view === "controllers" && stats && (
          <div style={{ overflow: "auto", border: "1px solid " + T.border, borderRadius: 8, maxHeight: "max(440px, calc(100vh - 320px))" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead><tr>{["Ctrl", "Name", "Findings", "Critical", "Exposure $"].map(h => (<th key={h} style={{ padding: "6px 8px", textAlign: h.includes("$") ? "right" : "left", fontSize: 9, color: T.textMuted, textTransform: "uppercase", borderBottom: "1px solid " + T.borderHi, ...MO, background: T.thBg, position: "sticky", top: 0, zIndex: 1 }}>{h}</th>))}</tr></thead>
              <tbody>{Object.entries(stats.byCtrl).sort((a, b) => b[1].e - a[1].e).map(([c, v]) => (
                <tr key={c} onClick={() => { setCtrlF(c); setView("worklist"); }} style={{ cursor: "pointer", borderBottom: "1px solid " + T.border }} onMouseEnter={e => { e.currentTarget.style.background = T.rowHover; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                  <td style={{ padding: "5px 8px", ...MO, fontWeight: 700 }}>{c}</td>
                  <td style={{ padding: "5px 8px", color: T.textSec }}>{v.nm || "—"}</td>
                  <td style={{ padding: "5px 8px", ...MO }}>{v.n}</td>
                  <td style={{ padding: "5px 8px", ...MO, color: v.cr > 0 ? SEV.CRITICAL : T.textMuted }}>{v.cr}</td>
                  <td style={{ padding: "5px 8px", ...MO, fontWeight: 700, textAlign: "right" }}>{F(v.e)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}

        {/* REFERENCE */}
        {view === "reference" && <Reference T={T} />}

        {/* footer */}
        <div style={{ marginTop: 14, paddingTop: 10, borderTop: "1px solid " + T.border, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
          {byline}
          <div style={{ fontSize: 10, color: T.textMuted, ...MO }}>Dispositions are in-session by design · write-back is the connector story</div>
        </div>

        {toast && <div style={{ position: "fixed", bottom: 18, left: "50%", transform: "translateX(-50%)", background: "#0B1220", color: "#E2E8F0", border: "1px solid " + T.accent, borderRadius: 8, padding: "9px 14px", fontSize: 11.5, ...MO, zIndex: 9999, maxWidth: 460, boxShadow: "0 8px 24px rgba(0,0,0,.4)", display: "flex", alignItems: "center", gap: 8 }}><Cpu size={14} color={T.accent} />{toast}</div>}
      </div>
    </TipProvider>
  );
}

/* ============================ REFERENCE PANEL ============================= */
function Reference({ T }) {
  const sec = { marginBottom: 18 };
  const hd = { fontSize: 11, color: T.text, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6, ...MO };
  const tbl = { width: "100%", borderCollapse: "collapse", fontSize: 11 };
  const th = { padding: "5px 8px", textAlign: "left", fontSize: 9, color: T.textMuted, borderBottom: "1px solid " + T.border, textTransform: "uppercase" };
  const td = { padding: "5px 8px", color: T.text, borderBottom: "1px solid " + T.border };
  const rules = [
    ["SS","Safety Stock Δ","Buffer vs tier×ABC/XYZ target × criticality, gap > 0.5d","CRIT: ABC-A + zero SS. HIGH: ABC-A delta / ABC-B zero. MED: rest."],
    ["MOQ","MOQ Review","Min lot > 3× target lot days","HIGH > 5×, MED 3–5×. Constraint, not a unilateral change."],
    ["RND","Rounding Δ","Rounding delta > 1 day of supply","HIGH > 3× target, else MED. Often packaging-driven."],
    ["LP","Lot Procedure Δ","Current ≠ recommended for tier/ABC","MEDIUM."],
    ["PTF","Time Fence","Fence = 0 (missing) or ≥ 333 (excessive)","HIGH: ABC-A + zero. MED otherwise."],
    ["DEAD","Dead Stock","Stock > 0, zero consumption 6 months","MEDIUM. Stronger when BOM fully retired."],
    ["OVER","Overstocked","> 6 months supply vs tier target","HIGH. Exposure = excess above 1.5× target."],
    ["UNDER","Understocked","< 1 month supply + zero SS + external","CRITICAL."],
    ["CLS","Missing Class.","Active consumption, no ABC and/or XYZ","LOW. Defaults used until classified."],
    ["BLK","Blocked Stock","Blocked value > $1,000","MEDIUM."],
    ["PO_SS","Phase-Out + SS","BOM phase-out planned + SS > 0","HIGH. Exposure = SS × unit cost."],
    ["OBSOL","Lifecycle Obsolete","All BOM positions retired, stock remains","HIGH. Exposure = full stock value."],
    ["PI_NO","Phase-In No Stock","BOM phase-in planned + zero stock","HIGH. Pre-position before launch."],
    ["STRCR","Structural Crit.","ABC-C but ≥ 20 parent SKUs","MEDIUM. Reclassification recommended."],
    ["PHNTM","Phantom Params","Phantom assembly with SS or MinLot set","LOW. Cleanup only."]
  ];
  return (
    <div style={{ maxWidth: 960 }}>
      <div style={sec}>
        <div style={hd}>Sourcing tiers — target days of supply</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {Object.entries(TGT).filter(([k]) => k !== "phantom").map(([k, t]) => (
            <div key={k} style={{ background: T.surface, border: "1px solid " + t.c + "55", borderRadius: 6, padding: "8px 12px", borderLeft: "3px solid " + t.c, minWidth: 110 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: t.c }}>{t.l}</div><div style={{ fontSize: 20, fontWeight: 700, ...MO }}>{t.d}d</div>
            </div>
          ))}
        </div>
      </div>
      <div style={sec}>
        <div style={hd}>Criticality multiplier (BOM-driven)</div>
        <table style={tbl}><thead><tr><th style={th}>Parent SKUs</th><th style={th}>Multiplier</th><th style={th}>Effect</th></tr></thead><tbody>
          <tr><td style={td}>20+</td><td style={td}>1.5×</td><td style={td}>Safety-stock target raised 50% — a stockout cascades widely.</td></tr>
          <tr><td style={td}>5–19</td><td style={td}>1.2×</td><td style={td}>Safety-stock target raised 20%.</td></tr>
          <tr><td style={td}>0–4</td><td style={td}>1.0×</td><td style={td}>No adjustment.</td></tr>
        </tbody></table>
      </div>
      <div style={sec}>
        <div style={hd}>Parameter matrix — Overseas (30d) · SS / Lot / Rnd days → procedure</div>
        <div style={{ display: "grid", gridTemplateColumns: "40px repeat(3,1fr)", gap: 2, fontSize: 10, ...MO }}>
          <div></div>{["X","Y","Z"].map(x => <div key={x} style={{ textAlign: "center", color: T.textMuted, fontWeight: 600 }}>XYZ {x}</div>)}
          {["A","B","C"].map(a => [<div key={a} style={{ color: T.textMuted, fontWeight: 600 }}>{a}</div>, ...["X","Y","Z"].map(x => { const p = PM.overseas[a + x]; return <div key={a + x} style={{ textAlign: "center", color: T.text, background: T.surfaceAlt, borderRadius: 3, padding: "2px 4px" }}>{p.ss}/{p.lot}/{p.rnd}→{p.lp}</div>; })])}
        </div>
      </div>
      <div style={sec}>
        <div style={hd}>Parameter matrix — Domestic (7d)</div>
        <div style={{ display: "grid", gridTemplateColumns: "40px repeat(3,1fr)", gap: 2, fontSize: 10, ...MO }}>
          <div></div>{["X","Y","Z"].map(x => <div key={x} style={{ textAlign: "center", color: T.textMuted, fontWeight: 600 }}>XYZ {x}</div>)}
          {["A","B","C"].map(a => [<div key={a} style={{ color: T.textMuted, fontWeight: 600 }}>{a}</div>, ...["X","Y","Z"].map(x => { const p = PM.domestic[a + x]; return <div key={a + x} style={{ textAlign: "center", color: T.text, background: T.surfaceAlt, borderRadius: 3, padding: "2px 4px" }}>{p.ss}/{p.lot}/{p.rnd}→{p.lp}</div>; })])}
        </div>
      </div>
      <div style={sec}>
        <div style={hd}>Audit rules ({rules.length})</div>
        <table style={tbl}><thead><tr><th style={th}>Rule</th><th style={th}>Name</th><th style={th}>Trigger</th><th style={th}>Severity logic</th></tr></thead>
          <tbody>{rules.map(r => <tr key={r[0]}><td style={{ ...td, ...MO, fontWeight: 700 }}>{r[0]}</td><td style={td}>{r[1]}</td><td style={{ ...td, color: T.textSec }}>{r[2]}</td><td style={{ ...td, color: T.textSec }}>{r[3]}</td></tr>)}</tbody>
        </table>
      </div>
      <div style={sec}>
        <div style={hd}>Treatment notes</div>
        <p style={{ color: T.textSec, fontSize: 12, margin: 0, lineHeight: 1.55 }}>Min lot size and rounding are treated as <b style={{ color: SEV.MEDIUM }}>constraints</b>, not free parameters: MOQs are often supplier-negotiated and rounding usually reflects a pack or pallet unit. The engine flags excessive coverage and recommends verifying the supplier agreement before changing. Items the engine cannot place in a sourcing tier surface as <b>Unclassified</b> — an honest data-quality gap defaulted to Domestic targets, never hidden.</p>
      </div>
    </div>
  );
}
