import React, { useState, useMemo, useRef, useLayoutEffect } from "react";
// xlsx is loaded lazily inside exportWorkbook() so its ~480 KB chunk stays off
// the initial bundle — export is a secondary action.
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from "recharts";
// The northpoint palette (D120): every color a var() reference, the values on
// the house frame's root for the mode in force.
import { northpointTokens } from "../kit/industrial.js";
import { figure, dollars, count, time } from "../../lib/format.js";
import {
  HouseFrame, Intro, HowItWorks, NoticeBanner, AnswerCards, AnswerCard, ExportPair,
  ConfirmButton, Help, Term, Hint, Legend, Dot, Pill, pinColumns, useNorthpoint,
} from "../kit/house.jsx";
import { writeWorkbook } from "../kit/house-export.js";
// The fictional company these seven are set in — one file, so the world
// cannot drift into two companies across seven tools.
import { NORTHPOINT } from "../../lib/northpoint.js";

/* Resolved here and not lower down: TGT below reads it at module level, and a
   const is unreachable until its own line has run. Every value a var()
   reference; the house frame's root carries the values for the mode in force. */
const SLUG = "parameter-audit-console";
const T = northpointTokens(SLUG);

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
const SEED = 73;          // deterministic dataset seed
const SAMPLE_SIZE = 460;  // synthetic material-plant rows to generate
/* NORTHPOINT HAS TWO PLANTS AND THEY ARE 1710 AND 1720. This file said P10
   and P20 while two other tools on the same gallery page said 1710 and 1720 —
   one fictional company with two numbering schemes, visible to anyone who
   opened two tabs. The engine takes these as ctx.plants, so the codes moved
   without a line inside the protected block changing. */
const COMPANY = NORTHPOINT.company;
const PLANTS = NORTHPOINT.plantCodes; // exercises (plant, material) keying

// Sourcing tiers: target days-of-supply, and the color each tier is drawn in.
/* A TIER IS A CATEGORY, so the five sourced tiers take the series, nearest
   first. In-house and unclassified take neutrals, honestly: an in-house part is
   not sourced from anywhere, and an unclassified one is a data gap. Until D120
   the five took brass, green, olive, orange and steel, so Local read as healthy
   and Domestic as a warning. The engine reads only `l` and `d`. */
const TGT = {
  jit:      { l: "JIT / Release", d: 0.5, c: T.series1 },
  local:    { l: "Local",         d: 1.5, c: T.series2 },
  regional: { l: "Regional",      d: 3,   c: T.series3 },
  domestic: { l: "Domestic",      d: 7,   c: T.series4 },
  overseas: { l: "Overseas",      d: 30,  c: T.series5 },
  inhouse:  { l: "In-House",      d: 1,   c: T.textSec },
  unknown:  { l: "Unclassified",  d: 7,   c: T.textMuted }
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

/* ============================================================================
   THE HOUSE FRAME (D120, 2026-09-24). Everything below the engine is the
   screen: HouseFrame from ../kit/house.jsx, the northpoint palette, the house
   formats, banners in place of the toast, writeWorkbook() with its About sheet.
   ========================================================================== */
const NAME = "Parameter Audit Console";
const SCOPE = "Reads a material master and BOM extract in your browser. Never connects to SAP.";

/* Figures through the house formats: dollars() for money, the true minus, and
   one decimal only where the value has one. */
const money$ = (v) => (v == null || Number.isNaN(v) ? "—" : dollars(v));
const whole = (v) => (v == null || Number.isNaN(v) ? "—" : figure(Math.round(v), { zeroMeans: "zero" }));
const oneDp = (v) => {
  if (v == null || Number.isNaN(v)) return "—";
  const r = Math.round(Number(v) * 10) / 10;
  return figure(r, { digits: Number.isInteger(r) ? 0 : 1, zeroMeans: "zero" });
};

/* SEVERITY IS STATUS: red, orange, olive, and a quiet outline for LOW, because
   a low finding is one you are not acting on today. */
const SEVS = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
const SEV_TONE = { CRITICAL: "bad", HIGH: "orange", MEDIUM: "olive", LOW: "quiet" };
const SEV_WORD = { CRITICAL: "Critical", HIGH: "High", MEDIUM: "Medium", LOW: "Low" };
/* The action verb is a kind of action, not a status, so it carries no color;
   the severity beside it already does. */
const verb = (d) => (d ? d.charAt(0) + d.slice(1).toLowerCase() : "Review");

/* THE TIERS THE SCREEN SHOWS: the engine's seven, plus Phantom. The engine
   files a phantom assembly's finding under a "phantom" tier it never lists, and
   until D120 the tier filter started from the list, so those findings were
   counted in the sentence above the grid and could never be shown in it. */
const TIERS = { ...TGT, phantom: { l: "Phantom", d: 0, c: T.borderStrong } };
const TIER_ORDER = ["jit", "local", "regional", "domestic", "overseas", "inhouse", "unknown", "phantom"];
const tierText = (g) => { const t = TIERS[g] || TIERS.unknown; return g === "phantom" ? t.l : `${t.l} (${t.d}d)`; };
const TierSwatch = ({ geo }) => (
  <i aria-hidden="true" style={{ display: "inline-block", width: 9, height: 9, borderRadius: 2, flex: "none", background: (TIERS[geo] || TIERS.unknown).c }} />
);

const GLOSSARY = {
  "Safety Stock": "A buffer held to cover demand or supply variability during the replenishment lead time. The audit compares the current buffer to a target in days of supply.",
  "ABC": "Value-based classification: A items drive most of the value, C items the least. Tighter parameters are justified on A items.",
  "XYZ": "Demand-variability classification: X is steady, Z is erratic. With ABC it makes nine segments, each with its own targets.",
  "Days of Supply": "How long stock or a buffer lasts at the average consumption rate: the common unit the audit compares items of very different volumes in.",
  "Lot Procedure": "The rule that sets order quantities: lot-for-lot (L4L), period (PER) or optimized (OPT). The right one depends on order frequency and sourcing distance.",
  "Min Lot / MOQ": "Minimum order quantity. Often set by the supplier, so an oversized one is flagged as a constraint to verify or negotiate, not a value to change alone.",
  "Rounding": "Order quantities round up to a multiple of this, usually a pack, box or pallet. Excess rounding inflates average inventory.",
  "Time Fence": "A firm horizon inside which the planning run will not reschedule. Zero lets it churn inside lead time; an over-long fence suppresses real demand.",
  "Exposure": "An estimate of the working capital or risk a finding represents, in dollars, used to rank the worklist. Estimated, not a booked figure.",
  "Months of Supply": "Stock divided by average monthly consumption. Under about one signals stockout risk; above the tier's target signals overstock.",
  "Criticality Multiplier": "A component feeding many finished goods gets a larger safety-stock target (1.2 times at 5 or more parents, 1.5 times at 20 or more), because a stockout cascades.",
  "Phantom Assembly": "A subassembly that only structures the bill of material: it explodes straight to its components and is never stocked, so any planning values it carries are cleanup.",
  "Where-Used": "The finished goods a component feeds. It drives criticality and shows how far a stockout would reach.",
  "Sourcing Tier": "A geography bucket (JIT, Local, Regional, Domestic, Overseas, In-House) with its own days-of-supply target: closer sourcing justifies leaner buffers.",
  "Unclassified": "An item the audit cannot place in a sourcing tier because its country or supplier is missing: a data-quality gap, given Domestic targets and shown rather than hidden.",
};

/* The audit's rules, one row each: the code, its name, what triggers it, how
   its severity is set. The manual and the Rules view both read this. */
const RULES = [
  ["SS", "Safety Stock Δ", "Buffer against tier × ABC/XYZ target × criticality, gap over half a day", "Critical: ABC-A with zero safety stock. High: ABC-A gap, or ABC-B at zero. Medium: the rest."],
  ["MOQ", "MOQ Review", "Minimum lot over 3 times the target lot days", "High over 5 times, Medium 3 to 5 times. A constraint, not a change to make alone."],
  ["RND", "Rounding Δ", "Rounding gap over one day of supply", "High over 3 times the target, else Medium. Often set by packaging."],
  ["LP", "Lot Procedure Δ", "Current differs from recommended for the tier and ABC class", "Medium."],
  ["PTF", "Time Fence", "Fence of zero (missing) or 333 days and over (excessive)", "High: ABC-A and zero. Medium otherwise."],
  ["DEAD", "Dead Stock", "Stock with zero consumption over 6 months", "Medium. Stronger when the BOM is fully retired."],
  ["OVER", "Overstocked", "Over 6 months of supply against the tier's target", "High. Exposure is the excess above 1.5 times target."],
  ["UNDER", "Understocked", "Under 1 month of supply, zero safety stock, bought in", "Critical."],
  ["CLS", "Missing Class.", "Active consumption with no ABC or XYZ class", "Low. Defaults are used until classified."],
  ["BLK", "Blocked Stock", "Blocked value over $1,000", "Medium."],
  ["PO_SS", "Phase-Out + SS", "BOM phase-out planned and safety stock above zero", "High. Exposure is safety stock times unit cost."],
  ["OBSOL", "Lifecycle Obsolete", "Every BOM position retired, stock remains", "High. Exposure is the whole stock value."],
  ["PI_NO", "Phase-In No Stock", "BOM phase-in planned and no stock", "High. Pre-position before launch."],
  ["STRCR", "Structural Crit.", "ABC-C but 20 or more parent finished goods", "Medium. Reclassification recommended."],
  ["PHNTM", "Phantom Params", "Phantom assembly with safety stock or a minimum lot set", "Low. Cleanup only."],
];

/* ============================================================================
   THE INSTRUCTION MANUAL (tool-conventions § N), built from RULES, TGT, PM and
   GLOSSARY above, so a rule change reaches it on its own.
   ========================================================================== */
export const MANUAL = {
  tool: NAME,
  purpose: "Audits every item's planning parameters, inventory health and lifecycle against targets set by where it is sourced from and how it sells, and ranks the findings by the money they tie up.",
  sections: [
    {
      id: "start", title: "What it is for, and what to do first",
      blocks: [
        { p: "Planning parameters drift: a safety stock set for an overseas part stays after the part moves to a local supplier, a phased-out item keeps its buffer. This console checks every material in every plant against a target for its sourcing tier and its ABC and XYZ classes, and puts a dollar figure on each finding so the worklist sorts itself." },
        { list: [
          { lead: "Read the answer cards.", text: "Findings, exposure, and how many are critical or high; press Critical or High to show only those." },
          { lead: "Work the worklist.", text: "Sorted by exposure. Filter by severity, tier, plant, controller or text; open a row for the parameters, the consumption, every finding and the where-used." },
          { lead: "Read Summary.", text: "Which kinds of finding and which controllers carry the exposure; press a bar to filter the worklist to it." },
          { lead: "Dismiss what you have handled.", text: "It leaves the worklist for this tab, and a banner offers to undo it." },
        ] },
      ],
    },
    {
      id: "numbers", title: "What the numbers mean",
      blocks: [
        { table: { head: ["Figure", "What it is"], rows: [
          ["Findings", "Findings that pass the filters, out of every live finding."],
          ["Exposure", GLOSSARY.Exposure],
          ["Critical, High", "Findings at that severity, and the exposure they carry."],
          ["BOM-linked", "Components the bill of materials links to at least one parent."],
          ["Months of supply", GLOSSARY["Months of Supply"]],
          ["Inventory Δ", "Current average inventory value minus the recommended one: positive releases cash, negative is an investment."],
        ] } },
      ],
    },
    {
      id: "flags", title: "Every finding, and what to do about it",
      blocks: [
        { table: { head: ["Finding", "Triggers when", "Severity"], rows: RULES.map((r) => [r[1], r[2], r[3]]) } },
        { p: "A minimum lot and a rounding value are treated as constraints, not free parameters: minimums are often negotiated and rounding usually reflects a pack or pallet. Verify the supplier agreement before changing either." },
      ],
    },
    {
      id: "derived", title: "How to read the derived columns",
      blocks: [
        { p: GLOSSARY["Sourcing Tier"] + " A phantom assembly sits in a tier of its own.", lead: "Tier." },
        { p: "The ABC class followed by the XYZ class, such as AX. A dash means a class is missing and default targets apply.", lead: "Segment." },
        { p: GLOSSARY["Criticality Multiplier"], lead: "Parents and criticality." },
        { p: GLOSSARY.Exposure, lead: "Exposure." },
      ],
    },
    {
      id: "data", title: "How the data is handled",
      blocks: [
        { p: `This copy runs entirely in your browser. On open it builds ${SAMPLE_SIZE} material-plant records for ${COMPANY}, an invented manufacturer, across plants ${PLANTS.join(" and ")}, from a fixed seed (${SEED}). New sample draws another seed.` },
        { p: "Dismissals stay in this tab. Nothing is sent anywhere; the exports are written in your browser." },
      ],
    },
    {
      id: "thresholds", title: "Every threshold",
      blocks: [
        { table: { head: ["Tier", "Target days of supply"], rows: Object.values(TGT).map((t) => [t.l, `${t.d} days`]) } },
        { table: { head: ["Parent finished goods", "Safety-stock multiplier"], rows: [["20 or more", "1.5 times"], ["5 to 19", "1.2 times"], ["0 to 4", "1 (no change)"]] } },
        { p: "Each tier has a nine-cell matrix of safety-stock, lot and rounding days and a lot procedure per ABC and XYZ segment; the Rules view shows two of them. Set for this demo. A delivered copy takes the plant's own targets." },
      ],
    },
    {
      id: "limits", title: "What it cannot tell you",
      blocks: [
        { list: [
          "Whether a supplier will accept a smaller minimum. A minimum-lot finding is a question for the agreement.",
          "The exact cost of a finding. Exposure ranks; it is an estimate, not a booked figure.",
          "The right tier for an item with no country or supplier. It stays Unclassified with Domestic targets.",
          "Anything about an item the extract does not carry: open orders, forecasts, or a planner's reasons.",
        ] },
      ],
    },
  ],
};

/* ============================================================================
   THE SCREEN
   ========================================================================== */
const CAP = 400;
const SORTABLE = [["mat", "Material"], ["desc", "Description"], ["sev", "Severity"], ["dir", "Action"], ["rule", "Finding"], ["pl", "Plant"], ["geo", "Tier"], ["mc", "Controller"], ["abc", "Seg"], ["pc", "Parents"], ["exp", "Exposure"]];

function rowsToAOA(rs) {
  const head = ["Plant","Material","Description","Controller","ABC","XYZ","Proc","Type","Geo","TgtDays","Seg","Parents","CritX","CurSS","RecSS","CurMinLot","CurRnd","RecRnd","CurLP","RecLP","PTF","Avg/Mo","MoS","Stock $","InvΔ $","Severity","Dir","Rule","Exposure $","Action","Detail","TopParents"];
  const body = rs.map(f => [f.pl, f.mat, f.desc, f.mc, f.abc, f.xyz, f.proc, f.halbType || "", f.geoL, f.tDays, f.seg, f.pc, f.critMult, Math.round(f.ss), Math.round(f.rSS), Math.round(f.ml), Math.round(f.rv), Math.round(f.rRnd), f.lp, f.rLP, f.ptf, +(f.am).toFixed(1), +(f.mos).toFixed(1), Math.round(f.sv), Math.round(f.invD), f.sev, f.dir, RN[f.rule] || f.rule, Math.round(f.exp), f.act, f.det, (f.top3 || []).join("; ")]);
  return [head, ...body];
}

function Detail({ m, mf, onBack, onDismiss }) {
  const { hex } = useNorthpoint();
  const adjRSS = Math.ceil((m.rSS || 0) * (m.critMult || 1));
  const paramRows = [
    { p: "Safety Stock", cur: whole(m.ss), rec: whole(adjRSS), d: adjRSS - m.ss, path: "Item Master → Planning" },
    { p: "Min Lot Size", cur: whole(m.ml), rec: "verify the minimum", note: true, path: "Supplier Agreement" },
    { p: "Rounding", cur: whole(m.rv), rec: whole(m.rRnd), d: (m.rRnd || 0) - m.rv, path: "Item Master → Lot Sizing" },
    { p: "Lot Procedure", cur: m.lp || "—", rec: m.rLP, txt: true, path: "Item Master → Lot Sizing" },
    { p: "Time Fence", cur: whole(m.ptf), rec: m.ptf === 0 ? String(m.geo === "overseas" ? 45 : m.geo === "domestic" ? 10 : m.geo === "regional" ? 7 : m.geo === "local" ? 3 : 5) : "OK", txt: true, path: "Item Master → Planning" },
  ];
  const showParams = !m.isPhantom && !m.isND && m.proc === "F" && m.am > 0;
  const where = m.allParents || [];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 var(--np-pad)" }}>
      <div><button type="button" className="np-btn quiet" onClick={onBack}>← Back to the worklist</button></div>
      <section className="np-panel" style={{ margin: 0 }}>
        <div className="np-panel-head" style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
          <h2 className="np-num" style={{ fontSize: 16 }}>{m.mat}</h2>
          <span className="np-muted">Plant {m.pl}</span>
          <Pill tone="quiet"><TierSwatch geo={m.geo} /> {tierText(m.geo)}</Pill>
          {m.abc !== "—" && <Pill tone="quiet">{m.abc}{m.xyz !== "—" ? m.xyz : ""}</Pill>}
          {m.halbType && m.halbType !== "n/a" && <Pill tone="quiet">{m.halbType}</Pill>}
          {m.mrpType && <Pill tone="quiet">MRP {m.mrpType}</Pill>}
          {m.pc > 0 && <Pill tone="quiet">{count(m.pc, "parent")}</Pill>}
        </div>
        <div className="np-panel-body">
          <p style={{ color: T.text }}>{m.desc}</p>
          <p className="np-muted">{m.mc} ({m.mcn || "—"}) · {m.supN || "no supplier"}{m.ctry ? ` (${m.ctry})` : ""}{(m.top3 || []).length ? " · Parents: " + m.top3.join(", ") : ""}</p>
        </div>
      </section>

      {showParams && (
        <div className="np-gridwrap" style={{ margin: 0 }}>
          <div className="np-gridhead"><span style={{ color: T.text, fontWeight: 600 }}>Parameters</span><span>{m.geoL} {m.seg !== "—" ? m.seg : ""} ({m.tDays} days){m.critMult > 1 ? ` × ${m.critMult} for criticality` : ""}</span></div>
          <div className="np-scroll">
            <table className="np-grid" style={{ minWidth: 620 }}>
              <thead><tr><th>Parameter</th><th className="r">Current</th><th className="r">Recommended</th><th className="r">Change</th><th>Where to set it</th></tr></thead>
              <tbody>
                {paramRows.map((r) => {
                  const ch = r.note ? false : r.txt ? String(r.cur) !== String(r.rec) && r.rec !== "OK" : Math.abs(r.d) > 0;
                  return (
                    <tr key={r.p}>
                      <td style={{ color: T.text }}>{r.p}{r.note && <Help label="Minimum lot" text={GLOSSARY["Min Lot / MOQ"]} />}</td>
                      <td className="r num">{r.cur}</td>
                      <td className="r num" style={{ fontWeight: ch ? 600 : 400 }}>{r.rec}</td>
                      <td className="r num">{r.note ? <span className="np-muted">constraint</span> : r.txt ? (ch ? "→" : "OK") : figure(Math.round(r.d), { sign: true, zeroMeans: "zero" })}</td>
                      <td className="np-muted">{r.path}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={{ margin: "0 calc(-1 * var(--np-pad))" }}>
        <AnswerCards>
          <AnswerCard label="Stock value" value={money$(m.sv)}>{whole(m.stk)} {m.uom || "PC"} on hand.</AnswerCard>
          <AnswerCard label="Average a month" value={oneDp(m.am)}>{m.uom || "PC"} consumed, over six months.</AnswerCard>
          <AnswerCard label="Months of supply" value={m.mos > 100 ? "∞" : oneDp(m.mos)} tone={m.mos > 6 ? "warn" : m.mos < 1 ? "bad" : undefined} help={GLOSSARY["Months of Supply"]}>At the average rate.</AnswerCard>
          <AnswerCard label="Inventory Δ" value={money$(m.invD)} tone={m.invD > 0 ? "good" : undefined}>
            {m.invD > 0 ? "Released" : "Invested"} by moving from {money$(m.cAvgV)} to {money$(m.rAvgV)} average inventory.
          </AnswerCard>
        </AnswerCards>
      </div>

      {m.cq && m.cq.some((v) => v > 0) && (
        <section className="np-panel" style={{ margin: 0 }}>
          <div className="np-panel-head">Six months of consumption <span className="np-muted">· stock {whole(m.stk)} · safety stock {whole(m.ss)} {m.uom}</span></div>
          <div className="np-panel-body">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={["Now", "+1", "+2", "+3", "+4", "+5"].map((lbl, i) => ({ month: lbl, qty: Math.round(m.cq[i] || 0) }))} margin={{ left: 4, right: 44, top: 8, bottom: 4 }}>
                <XAxis dataKey="month" stroke={hex.control} tick={{ fontSize: 11, fill: hex.textSec }} />
                <YAxis stroke={hex.control} tick={{ fontSize: 11, fill: hex.textSec }} tickFormatter={(v) => (v >= 1000 ? figure(v / 1000, { digits: 1 }) + "k" : v)} />
                <Tooltip isAnimationActive={!REDUCE_MOTION} formatter={(v) => oneDp(v) + " " + (m.uom || "PC")} contentStyle={{ background: hex.surfaceAlt, border: `1px solid ${hex.control}`, borderRadius: 4, fontSize: 12, color: hex.text }} itemStyle={{ color: hex.text }} labelStyle={{ color: hex.text }} cursor={{ fill: hex.border }} />
                {m.stk > 0 && <ReferenceLine y={m.stk} stroke={hex.textSec} strokeDasharray="4 3" label={{ value: "Stock", fill: hex.textSec, fontSize: 11, position: "right" }} />}
                {m.ss > 0 && <ReferenceLine y={m.ss} stroke={hex.bad} strokeDasharray="4 3" label={{ value: "SS", fill: hex.bad, fontSize: 11, position: "right" }} />}
                <Bar dataKey="qty" radius={[2, 2, 0, 0]} fill={hex.series1} isAnimationActive={!REDUCE_MOTION} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <Legend items={[{ label: "Consumption", swatch: T.series1 }, { label: "Stock on hand (dashed)", swatch: T.textSec }, { label: "Safety stock (dashed)", swatch: T.bad }]} />
        </section>
      )}

      <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", color: T.textMuted, marginTop: 4 }}>Findings ({mf.length})</p>
      {mf.map((f) => (
        <section key={f.fid} className="np-panel" style={{ margin: 0 }} data-finding={f.fid}>
          <div className="np-panel-head" style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <Pill tone={SEV_TONE[f.sev]}>{SEV_WORD[f.sev]}</Pill>
            <Pill tone="quiet">{verb(f.dir)}</Pill>
            <span style={{ color: T.textSec, fontWeight: 400 }}>{RN[f.rule] || f.rule}</span>
            <span className="np-num" style={{ marginLeft: "auto", color: T.text }}>{money$(f.exp)}</span>
            <button type="button" className="np-btn quiet" onClick={() => onDismiss(f)}>Dismiss</button>
          </div>
          <div className="np-panel-body">
            <p style={{ color: T.text, lineHeight: 1.5 }}>{f.act}</p>
            <p className="np-muted" style={{ marginTop: 3 }}>{f.det}</p>
          </div>
        </section>
      ))}

      {where.length > 0 && (
        <div className="np-gridwrap" style={{ margin: 0 }}>
          <div className="np-gridhead"><span style={{ color: T.text, fontWeight: 600 }}>Where-used<Help label="Where-used" text={GLOSSARY["Where-Used"]} /></span><span>{count(where.length, "finished good")}{m.pc >= 20 ? " · high criticality" : m.pc >= 5 ? " · elevated" : ""}</span></div>
          <div className="np-scroll" style={{ maxHeight: 300 }}>
            <table className="np-grid" style={{ minWidth: 420 }}>
              <thead><tr><th>Finished good</th><th>Description</th><th className="r">Qty / assembly</th></tr></thead>
              <tbody>{where.map((pp, i) => <tr key={i}><td><span className="code">{pp.sku}</span></td><td>{pp.desc || "—"}</td><td className="r num">{oneDp(pp.qty)}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryView({ stats, onRule, onCtrl, onTier }) {
  const { hex } = useNorthpoint();
  const ruleChart = Object.entries(stats.byRule).sort((a, b) => b[1].e - a[1].e).map(([id, v]) => ({ name: RN[id] || id, id, e: v.e, n: v.n }));
  const ctrlChart = Object.entries(stats.byCtrl).sort((a, b) => b[1].e - a[1].e).slice(0, 12).map(([c, v]) => ({ name: c, e: v.e, full: c + " — " + (v.nm || "") }));
  const tick = { fontSize: 11, fill: hex.textSec };
  const tip = { contentStyle: { background: hex.surfaceAlt, border: `1px solid ${hex.control}`, borderRadius: 4, fontSize: 12, color: hex.text }, itemStyle: { color: hex.text }, labelStyle: { color: hex.text }, cursor: { fill: hex.border } };
  /* Ticks in thousands, said once in the title: "$3,000k" read as thousands of
     thousands, and the old axis's "$3000k" had the same shape. */
  const inK = (v) => figure(v / 1000, { zeroMeans: "zero" });
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 var(--np-pad)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(420px, 100%), 1fr))", gap: 8 }}>
        <section className="np-panel" style={{ margin: 0 }}>
          <div className="np-panel-head">Exposure by finding <span className="np-muted">· thousands of dollars · press a bar to filter the worklist</span></div>
          <div className="np-panel-body">
            <ResponsiveContainer width="100%" height={Math.max(220, ruleChart.length * 26)}>
              <BarChart data={ruleChart} layout="vertical" margin={{ left: 4, right: 12 }}>
                <XAxis type="number" tickFormatter={inK} stroke={hex.control} tick={tick} />
                <YAxis type="category" dataKey="name" width={140} tick={tick} stroke="transparent" />
                <Tooltip isAnimationActive={!REDUCE_MOTION} formatter={(v) => money$(v)} {...tip} />
                <Bar dataKey="e" name="Exposure" radius={[0, 2, 2, 0]} cursor="pointer" isAnimationActive={!REDUCE_MOTION} onClick={(d) => d && d.id && onRule(d.id)}>
                  {ruleChart.map((d, i) => <Cell key={i} fill={hex.series1} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="np-panel" style={{ margin: 0 }}>
          <div className="np-panel-head">Top controllers <span className="np-muted">· thousands of dollars · press a bar to filter the worklist</span></div>
          <div className="np-panel-body">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={ctrlChart} margin={{ left: 0, right: 12 }}>
                <XAxis dataKey="name" stroke={hex.control} tick={tick} />
                <YAxis tickFormatter={inK} stroke={hex.control} tick={tick} />
                <Tooltip isAnimationActive={!REDUCE_MOTION} formatter={(v) => money$(v)} labelFormatter={(l) => { const d = ctrlChart.find((c) => c.name === l); return d ? d.full : l; }} {...tip} />
                <Bar dataKey="e" name="Exposure" radius={[2, 2, 0, 0]} fill={hex.series3} cursor="pointer" isAnimationActive={!REDUCE_MOTION} onClick={(d) => d && d.name && onCtrl(d.name)} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
      <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", color: T.textMuted, marginTop: 4 }}>By sourcing tier<Help label="Sourcing tier" text={GLOSSARY["Sourcing Tier"]} /></p>
      <div style={{ margin: "0 calc(-1 * var(--np-pad))" }}>
        <AnswerCards>
          {TIER_ORDER.filter((g) => stats.byGeo[g]).map((g) => (
            <AnswerCard key={g} label={<><TierSwatch geo={g} />{tierText(g)}</>} value={nfmtN(stats.byGeo[g].n)} onClick={() => onTier(g)} title="Press to show only this tier">
              {money$(stats.byGeo[g].e)} of exposure.
            </AnswerCard>
          ))}
        </AnswerCards>
      </div>
    </div>
  );
}
const nfmtN = (n) => figure(n, { zeroMeans: "zero" });

function ControllersView({ stats, onCtrl }) {
  const ref = useRef(null);
  const rows = Object.entries(stats.byCtrl).sort((a, b) => b[1].e - a[1].e);
  useLayoutEffect(() => { pinColumns(ref.current); }, [rows.length]);
  return (
    <div className="np-gridwrap">
      <div className="np-gridhead"><span style={{ color: T.text, fontWeight: 600 }}>Controllers</span><span>press a row to filter the worklist to it</span></div>
      <div className="np-scroll">
        <table className="np-grid" ref={ref} style={{ minWidth: 560 }}>
          <thead><tr><th className="pin">Controller</th><th>Name</th><th className="r">Findings</th><th className="r">Critical</th><th className="r">Exposure</th></tr></thead>
          <tbody>
            {rows.map(([c, v]) => (
              <tr key={c} className="is-row" onClick={() => onCtrl(c)}>
                <td className="pin"><span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Dot tone={v.cr > 0 ? "bad" : "quiet"} title={v.cr > 0 ? `${v.cr} critical` : "No critical findings"} /><span className="code">{c}</span></span></td>
                <td>{v.nm || "—"}</td>
                <td className="r num">{nfmtN(v.n)}</td>
                <td className="r num">{nfmtN(v.cr)}</td>
                <td className="r num">{money$(v.e)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Legend items={[{ label: "Has critical findings", tone: "bad" }, { label: "None critical", tone: "quiet" }]} />
    </div>
  );
}

function Matrix({ tier }) {
  return (
    <div className="np-scroll" style={{ maxHeight: "none" }}>
      <table className="np-grid" style={{ minWidth: 420 }}>
        <thead><tr><th>ABC</th>{["X", "Y", "Z"].map((x) => <th key={x} className="c">XYZ {x}</th>)}</tr></thead>
        <tbody>
          {["A", "B", "C"].map((a) => (
            <tr key={a}>
              <td style={{ color: T.text }}>{a}</td>
              {["X", "Y", "Z"].map((x) => { const p = PM[tier][a + x]; return <td key={x} className="c num">{p.ss} / {p.lot} / {p.rnd} → {p.lp}</td>; })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RulesView() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 var(--np-pad)" }}>
      <section className="np-panel" style={{ margin: 0 }}>
        <div className="np-panel-head">Sourcing tiers: target days of supply<Help label="Sourcing tier" text={GLOSSARY["Sourcing Tier"]} /></div>
        <div className="np-panel-body np-row" style={{ gap: 8 }}>
          {Object.keys(TGT).map((k) => (
            <span key={k} className="np-chip" style={{ cursor: "default" }}><TierSwatch geo={k} /> {TGT[k].l} <span className="n">{TGT[k].d}d</span></span>
          ))}
        </div>
      </section>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(420px, 100%), 1fr))", gap: 8 }}>
        <section className="np-panel" style={{ margin: 0 }}>
          <div className="np-panel-head">Overseas ({TGT.overseas.d} days): safety stock / lot / rounding days → procedure</div>
          <div className="np-panel-body"><Matrix tier="overseas" /></div>
        </section>
        <section className="np-panel" style={{ margin: 0 }}>
          <div className="np-panel-head">Domestic ({TGT.domestic.d} days)</div>
          <div className="np-panel-body"><Matrix tier="domestic" /></div>
        </section>
      </div>
      {/* THE RULES ARE PROSE, so they are entries rather than a grid: a table of
          sentences wraps to a different height on every row at phone width,
          which is a grid out of line and a harder read besides. */}
      <section className="np-panel" style={{ margin: 0 }}>
        <div className="np-panel-head">The audit's {count(RULES.length, "rule")}</div>
        <dl className="np-panel-body" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(340px, 100%), 1fr))", gap: "12px 20px", margin: 0 }}>
          {RULES.map((r) => (
            <div key={r[0]} style={{ borderTop: `1px solid ${T.border}`, paddingTop: 8 }}>
              <dt style={{ color: T.text, fontWeight: 600 }}><span className="np-num" style={{ color: T.textSec, marginRight: 8 }}>{r[0]}</span>{r[1]}</dt>
              <dd style={{ margin: "3px 0 0", fontSize: 13, color: T.textSec }}>Triggers when: {r[2]}.</dd>
              <dd style={{ margin: "2px 0 0", fontSize: 13, color: T.textMuted }}>Severity: {r[3]}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}

const VIEWS = [["worklist", "Worklist"], ["summary", "Summary"], ["controllers", "Controllers"], ["reference", "Rules"]];

function Console() {
  const [seedN, setSeedN] = useState(SEED);
  const [loadedAt, setLoadedAt] = useState(() => new Date());
  const audit = useMemo(() => {
    const ctx = { seed: seedN, sampleSize: SAMPLE_SIZE, plants: PLANTS };
    const { rows, bomRows } = generateData(ctx);
    const bomMap = processBOM(bomRows, ctx);
    const findings = runAudit({ rows, bomMap, jitSet: ctx.jitSet, localSet: ctx.localSet, regSet: ctx.regSet });
    return { data: { rows, bomMap }, findings };
  }, [seedN]);
  const { data, findings } = audit;
  const [view, setView] = useState("worklist");
  const [selMat, setSelMat] = useState(null);
  const [dismissed, setDismissed] = useState({});
  const [notice, setNotice] = useState(null);
  const [sevF, setSevF] = useState(SEVS);
  const [geoF, setGeoF] = useState(TIER_ORDER);
  const [plantF, setPlantF] = useState("");
  const [ctrlF, setCtrlF] = useState("");
  const [ruleF, setRuleF] = useState("");
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState("exp");
  const [sortDir, setSortDir] = useState("desc");
  const tableRef = useRef(null);
  const tog = (set) => (v) => set((p) => (p.includes(v) ? p.filter((x) => x !== v) : [...p, v]));

  const allCtrls = useMemo(() => [...new Set(findings.map((f) => f.mc))].sort(), [findings]);
  const filtered = useMemo(() => {
    let f = findings.filter((r) => !dismissed[r.fid] && sevF.includes(r.sev) && geoF.includes(r.geo) && (!plantF || r.pl === plantF) && (!ctrlF || r.mc === ctrlF) && (!ruleF || r.rule === ruleF));
    if (search) { const t = search.toLowerCase(); f = f.filter((r) => r.mat.toLowerCase().includes(t) || r.desc.toLowerCase().includes(t) || (r.mc || "").toLowerCase().includes(t) || r.act.toLowerCase().includes(t)); }
    f = [...f].sort((a, b) => { const va = a[sortCol], vb = b[sortCol]; if (typeof va === "string") return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va); return sortDir === "asc" ? (va || 0) - (vb || 0) : (vb || 0) - (va || 0); });
    return f;
  }, [findings, dismissed, sevF, geoF, plantF, ctrlF, ruleF, search, sortCol, sortDir]);
  const liveAll = useMemo(() => findings.filter((r) => !dismissed[r.fid]), [findings, dismissed]);
  const stats = useMemo(() => {
    const bySev = {}, byGeo = {}, byRule = {}, byCtrl = {};
    filtered.forEach((f) => {
      (bySev[f.sev] ||= { n: 0, e: 0 }).n++; bySev[f.sev].e += f.exp;
      (byGeo[f.geo] ||= { n: 0, e: 0 }).n++; byGeo[f.geo].e += f.exp;
      (byRule[f.rule] ||= { n: 0, e: 0 }).n++; byRule[f.rule].e += f.exp;
      (byCtrl[f.mc] ||= { nm: f.mcn, n: 0, e: 0, cr: 0 }).n++; byCtrl[f.mc].e += f.exp; if (f.sev === "CRITICAL") byCtrl[f.mc].cr++;
    });
    return { bySev, byGeo, byRule, byCtrl, totalE: filtered.reduce((s, f) => s + f.exp, 0) };
  }, [filtered]);
  useLayoutEffect(() => { pinColumns(tableRef.current); }, [filtered, view, selMat]);

  const matCount = new Set(data.rows.map((r) => r.Plant + r.Material)).size;
  const dismissedN = Object.keys(dismissed).length;
  const totalAll = liveAll.reduce((s, f) => s + f.exp, 0);

  const dismiss = (f) => {
    setDismissed((d) => ({ ...d, [f.fid]: true }));
    setNotice({ fid: f.fid, text: `Dismissed the ${RN[f.rule] || f.rule} finding on ${f.mat} in this tab. A delivered copy writes it back to the planning system or a ticket queue.` });
  };
  const undo = (fid) => { setDismissed((d) => { const n = { ...d }; delete n[fid]; return n; }); setNotice(null); };
  const newSample = () => { const s = (seedN + 7) % 9999; setSeedN(s); setLoadedAt(new Date()); setDismissed({}); setSelMat(null); setNotice(null); };
  const setOnly = (setter, v) => { setter(v); setSelMat(null); setView("worklist"); };

  const shown = () => {
    const out = [];
    if (sevF.length < SEVS.length) out.push(`Severity: ${sevF.map((s) => SEV_WORD[s]).join(", ") || "none"}`);
    if (geoF.length < TIER_ORDER.length) out.push(`Tier: ${geoF.map((g) => TIERS[g].l).join(", ") || "none"}`);
    if (plantF) out.push(`Plant: ${plantF}`);
    if (ctrlF) out.push(`Controller: ${ctrlF}`);
    if (ruleF) out.push(`Finding: ${RN[ruleF] || ruleF}`);
    if (search) out.push(`Search: "${search}"`);
    return out;
  };
  const exportWorkbook = async (full) => {
    const XLSX = await import("xlsx");
    const list = full ? liveAll : filtered;
    writeWorkbook(XLSX, {
      slug: SLUG, which: full ? "full" : "filtered", tool: NAME,
      what: full
        ? `Every live finding (${liveAll.length}) with its parameters, targets, severity, exposure, action and detail.`
        : `The ${count(list.length, "finding")} the filters showed, with parameters, targets, severity, exposure, action and detail.`,
      source: `The ${COMPANY} sample, generated in your browser from seed ${seedN}`,
      shown: full ? [] : shown(),
      sheets: [{ name: full ? "Findings" : "Filtered findings", rows: rowsToAOA(list) }],
    });
  };

  const selected = selMat ? (() => {
    const [p, m0] = selMat.split("||");
    const mf = liveAll.filter((f) => f.pl === p && f.mat === m0);
    return { m: mf[0] || findings.find((f) => f.pl === p && f.mat === m0), mf };
  })() : null;

  const reload = dismissedN > 0
    ? <ConfirmButton label="New sample" effect={`Draws a new sample from seed ${(seedN + 7) % 9999} and brings back the ${count(dismissedN, "dismissed finding")}.`} confirmLabel="Draw it" onConfirm={newSample} />
    : <button type="button" className="np-btn" onClick={newSample} title="Draw a new deterministic sample">New sample</button>;
  const sortBy = (c) => { if (sortCol === c) setSortDir((d) => (d === "asc" ? "desc" : "asc")); else { setSortCol(c); setSortDir("desc"); } };

  return (
    <>
      <div className="np-part">
        <div className="np-ident">
          <h2>{COMPANY} · planning parameters, {count(PLANTS.length, "plant")}</h2>
          <p>Loaded <b>the synthetic sample</b> at {time(loadedAt)}, generated in your browser from seed {seedN}: {nfmtN(matCount)} material-plant records across plants {PLANTS.join(" and ")}, with a bill of materials. No real master data.</p>
        </div>
        <div className="np-row">{reload}</div>
      </div>

      <div className="np-bar">
        <div className="np-row" role="tablist" aria-label="Views">
          {VIEWS.map(([v, label]) => <button key={v} type="button" role="tab" className="np-chip" aria-selected={view === v && !selMat} aria-pressed={view === v && !selMat} onClick={() => { setView(v); setSelMat(null); }}>{label}</button>)}
        </div>
      </div>

      {notice && (
        <NoticeBanner tag="Dismissed" tone="ok" onDismiss={() => setNotice(null)}>
          {notice.text} <button type="button" className="np-btn quiet" style={{ minHeight: 22, padding: "0 6px" }} onClick={() => undo(notice.fid)}>Undo</button>
        </NoticeBanner>
      )}

      <Intro>
        Of <b>{nfmtN(matCount)}</b> material-plant records across {count(PLANTS.length, "plant")}, <b>{nfmtN(liveAll.length)}</b> carry a parameter, inventory or lifecycle finding worth an estimated <b>{money$(totalAll)}</b> in <Term text={GLOSSARY.Exposure}>exposure</Term>.
        {" "}Each is sized in <Term text={GLOSSARY["Days of Supply"]}>days of supply</Term> against a <Term text={GLOSSARY["Sourcing Tier"]}>sourcing tier</Term> × <Term text={GLOSSARY.ABC}>ABC</Term>/<Term text={GLOSSARY.XYZ}>XYZ</Term> target and weighted by BOM <Term text={GLOSSARY["Criticality Multiplier"]}>criticality</Term>.
      </Intro>
      <HowItWorks points={[
        { lead: "Classify.", text: "Each item goes into a sourcing tier from its procurement type, its supplier's tier list and its country; closer sourcing gets a leaner target." },
        { lead: "Target.", text: "Safety-stock, lot and rounding days come from a tier × ABC × XYZ matrix and become quantities at the item's daily rate." },
        { lead: "Weight.", text: "Safety-stock targets rise with the number of finished goods a component feeds: 1.2 times at 5 or more, 1.5 times at 20 or more." },
        { lead: `Audit against ${count(RULES.length, "rule")}.`, text: "Parameters, inventory health and lifecycle, each sized in dollars. A minimum lot and a rounding value are constraints to verify, not values to change blindly." },
        { lead: "Nothing is guessed.", text: "An item with missing country or supplier data is Unclassified, with Domestic targets, rather than given a made-up tier." },
      ]} />

      <AnswerCards>
        <AnswerCard label="Findings" value={nfmtN(filtered.length)}>
          On screen, of {count(liveAll.length, "live finding")}.
        </AnswerCard>
        <AnswerCard label="Exposure" value={money$(stats.totalE)} help={GLOSSARY.Exposure}>
          Estimated, on the findings shown; it ranks, it is not booked.
        </AnswerCard>
        <AnswerCard label="Critical" value={nfmtN(stats.bySev.CRITICAL?.n || 0)} tone={(stats.bySev.CRITICAL?.n || 0) > 0 ? "bad" : undefined}
          pressed={sevF.length === 1 && sevF[0] === "CRITICAL"} title="Press to show only critical findings; press again for all."
          onClick={() => setOnly(setSevF, sevF.length === 1 && sevF[0] === "CRITICAL" ? SEVS : ["CRITICAL"])}>
          {money$(stats.bySev.CRITICAL?.e || 0)} of exposure; act on these first.
        </AnswerCard>
        <AnswerCard label="High" value={nfmtN(stats.bySev.HIGH?.n || 0)}
          pressed={sevF.length === 1 && sevF[0] === "HIGH"} title="Press to show only high findings; press again for all."
          onClick={() => setOnly(setSevF, sevF.length === 1 && sevF[0] === "HIGH" ? SEVS : ["HIGH"])}>
          {money$(stats.bySev.HIGH?.e || 0)} of exposure.
        </AnswerCard>
        <AnswerCard label="BOM-linked" value={nfmtN(Object.keys(data.bomMap).length)}>
          Components the bill of materials links to a parent.
        </AnswerCard>
        {dismissedN > 0 && (
          <AnswerCard label="Dismissed" value={nfmtN(dismissedN)} tone="good">In this tab; New sample brings them back.</AnswerCard>
        )}
      </AnswerCards>

      {selected && selected.m ? (
        <Detail m={selected.m} mf={selected.mf} onBack={() => setSelMat(null)} onDismiss={dismiss} />
      ) : (
        <>
          {view !== "reference" && (
            <div className="np-bar" style={{ borderTop: `1px solid ${T.border}` }}>
              <div className="np-row" role="group" aria-label="Severity">
                <span className="np-muted">Severity</span>
                {SEVS.map((s) => <button key={s} type="button" className="np-chip" aria-pressed={sevF.includes(s)} onClick={() => tog(setSevF)(s)}><Dot tone={SEV_TONE[s]} /> {SEV_WORD[s]}</button>)}
              </div>
              <div className="np-row" role="group" aria-label="Sourcing tier">
                <span className="np-muted">Tier<Help label="Sourcing tier" text={GLOSSARY["Sourcing Tier"]} /></span>
                {TIER_ORDER.map((g) => <button key={g} type="button" className="np-chip" aria-pressed={geoF.includes(g)} onClick={() => tog(setGeoF)(g)}><TierSwatch geo={g} /> {TIERS[g].l}</button>)}
              </div>
              <label>Plant
                <select className="np-in" value={plantF} onChange={(e) => setPlantF(e.target.value)} aria-label="Plant"><option value="">All</option>{PLANTS.map((p) => <option key={p} value={p}>{p}</option>)}</select>
              </label>
              <label>Controller
                <select className="np-in" value={ctrlF} onChange={(e) => setCtrlF(e.target.value)} aria-label="Controller"><option value="">All</option>{allCtrls.map((c) => <option key={c} value={c}>{c}</option>)}</select>
              </label>
              {ruleF && <button type="button" className="np-chip" aria-pressed="true" onClick={() => setRuleF("")} title="Show every finding again">{RN[ruleF] || ruleF} ✕</button>}
            </div>
          )}

          {view === "worklist" && (
            <div className="np-gridwrap">
              <div className="np-gridhead">
                <input className="np-in" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search material, description, controller or action" aria-label="Search findings" style={{ flex: "1 1 260px" }} />
                <span data-role="count-line"><span className="np-num">{nfmtN(filtered.length)}</span> findings · <span className="np-num">{money$(stats.totalE)}</span></span>
                <span style={{ marginLeft: "auto" }} />
                <ExportPair fullCount={liveAll.length} filteredCount={filtered.length} noun="findings" onFull={() => exportWorkbook(true)} onFiltered={() => exportWorkbook(false)} />
              </div>
              <div className="np-gridhead">
                <span>{filtered.length > CAP ? <>Showing the first <span className="np-num">{CAP}</span> of <span className="np-num">{nfmtN(filtered.length)}</span>; both exports carry every finding</> : <>Showing all <span className="np-num">{nfmtN(filtered.length)}</span></>} · press a row for its detail, a header to sort</span>
              </div>
              <div className="np-scroll">
                <table className="np-grid" ref={tableRef} style={{ minWidth: 1260 }}>
                  <thead>
                    <tr>
                      {SORTABLE.map(([c, l], i) => (
                        <th key={c} className={`${i < 2 ? "pin" : ""}${c === "exp" || c === "pc" ? " r" : ""}`}>
                          <button type="button" onClick={() => sortBy(c)} aria-pressed={sortCol === c}>{l}{sortCol === c ? (sortDir === "desc" ? " ▾" : " ▴") : ""}</button>
                          {c === "geo" && <Help label="Sourcing tier" text={GLOSSARY["Sourcing Tier"]} />}
                          {c === "exp" && <Help label="Exposure" text={GLOSSARY.Exposure} />}
                        </th>
                      ))}
                      <th><span className="np-muted">Dismiss</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.slice(0, CAP).map((f) => (
                      <tr key={f.fid} className="is-row" onClick={() => setSelMat(f.pl + "||" + f.mat)}>
                        <td className="pin"><span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Dot tone={SEV_TONE[f.sev]} title={SEV_WORD[f.sev]} /><span className="code">{f.mat}</span></span></td>
                        <td className="pin clip" title={f.desc}>{f.desc}</td>
                        <td><Pill tone={SEV_TONE[f.sev]}>{SEV_WORD[f.sev]}</Pill></td>
                        <td><Hint text={f.act}><Pill tone="quiet">{verb(f.dir)}</Pill></Hint></td>
                        <td style={{ whiteSpace: "nowrap" }}>{RN[f.rule] || f.rule}</td>
                        <td className="num">{f.pl}</td>
                        <td style={{ whiteSpace: "nowrap" }}><span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><TierSwatch geo={f.geo} />{tierText(f.geo)}</span></td>
                        <td><span className="code" style={{ color: T.textSec }}>{f.mc}</span></td>
                        <td className="num">{f.abc !== "—" ? f.abc : ""}{f.xyz !== "—" ? f.xyz : ""}</td>
                        <td className="r num">{f.pc || "—"}</td>
                        <td className="r num">{money$(f.exp)}</td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <button type="button" className="np-btn quiet" style={{ minHeight: 22, padding: "0 6px" }} aria-label={`Dismiss the ${RN[f.rule] || f.rule} finding on ${f.mat}`} onClick={() => dismiss(f)}>✕</button>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && <tr className="detail"><td colSpan={12} className="np-empty">No findings match these filters. Turn a severity or tier back on, or clear the search.</td></tr>}
                  </tbody>
                </table>
              </div>
              <Legend lead="Severity:" items={SEVS.map((s) => ({ label: SEV_WORD[s], tone: SEV_TONE[s] }))} />
              <Legend lead="Tier:" items={TIER_ORDER.map((g) => ({ label: TIERS[g].l, swatch: TIERS[g].c }))} />
            </div>
          )}
          {view === "summary" && <SummaryView stats={stats} onRule={(id) => setOnly(setRuleF, id)} onCtrl={(c) => setOnly(setCtrlF, c)} onTier={(g) => setOnly(setGeoF, [g])} />}
          {view === "controllers" && <ControllersView stats={stats} onCtrl={(c) => setOnly(setCtrlF, c)} />}
          {view === "reference" && <RulesView />}
        </>
      )}
    </>
  );
}

export default function ParameterAuditConsole() {
  return (
    <HouseFrame slug={SLUG} name={NAME} scope={SCOPE} manual={MANUAL}>
      <Console />
    </HouseFrame>
  );
}
