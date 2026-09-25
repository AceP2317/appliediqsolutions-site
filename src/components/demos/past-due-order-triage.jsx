// ============================================================================
// PAST-DUE ORDER TRIAGE — Northpoint Manufacturing (portfolio demo)
// Triage console for past-due in-house production orders (procurement type E).
// While open, each keeps generating dependent demand for its raw-material
// (type F / ROH) components — so a past-due order is a FALSE DEMAND signal MRP
// keeps procuring against, and the parts land and overstock until someone
// closes, reschedules, or unfirms the order.
//
// Snapshot diff + disposition engine + optional BOM-explosion enrichment
// (which finished tools are exposed, which purchased parts feed the late sub).
//
// Built by Ian Provencher
// Public portfolio demo — synthetic self-loading data, no real company data or
// process. Dispositions are in-session by design; write-back is the connector
// story. Fifth demo in the Northpoint set — angle: MRP demand-signal integrity.
// ============================================================================

import React, { useState, useMemo, useRef, useLayoutEffect } from "react";
// The northpoint palette (D120): every color a var() reference, the values on
// the house frame's root for the mode in force.
import { northpointTokens, alpha } from "../kit/industrial.js";
import { figure, date as houseDate, time, count, todayEt } from "../../lib/format.js";
import {
  HouseFrame, Intro, HowItWorks, NoticeBanner, AnswerCards, AnswerCard, ExportPair,
  ConfirmButton, Help, Term, Hint, Legend, Dot, Pill, NumberField, pinColumns,
} from "../kit/house.jsx";
import { writeWorkbook } from "../kit/house-export.js";
// The fictional company these seven are set in — one file, so the world
// cannot drift into two companies across seven tools.
import { NORTHPOINT } from "../../lib/northpoint.js";
// xlsx is loaded lazily inside exportWorkbook() so its ~480 KB chunk stays off
// the initial bundle — export is a secondary action.

// ============================================================================
// EDITABLE DOMAIN CONFIG — one block; a domain correction is a one-line edit
// ============================================================================
/* The company, its plants and its house style all arrive with the faceplate. */
const COMPANY = NORTHPOINT.company;
const SAMPLE = { seed: 73, n: 345 };   // deterministic synthetic sample

const CFG = {
  TECO_DAYS: 90,            // past-due age beyond which an order is a close candidate
  SUPERSEDED_MIN_DAYS: 30,  // min age for the "superseded by newer order" close rule
  LATE_MIN: 8,              // below this, an order is normal completion churn
  LATE_MAX: 90,             // reschedule window upper bound
  PARTIAL_FRACTION: 0.25,   // qty ≤ this share of material's largest open order → remnant
  CHRONIC_MIN: 3,           // ≥ this many past-due orders for one (plant, material) → chronic
  PHANTOM_CAP_MONTHS: 6,    // phantom weighting cap, in 30-day months
};

const BUCKETS = [
  { id: "0",      label: "Due / future", min: -1e15, max: 0 },
  { id: "1-7",    label: "1–7 days",     min: 1,     max: 7 },
  { id: "8-30",   label: "8–30 days",    min: 8,     max: 30 },
  { id: "31-90",  label: "31–90 days",   min: 31,    max: 90 },
  { id: "91-180", label: "91–180 days",  min: 91,    max: 180 },
  { id: "180+",   label: "180+ days",    min: 181,   max: 1e15 },
];

// Recommendation classes. `accent` keys into the vivid spectrum (see THEME).
const RECS = {
  UNFIRM_PLORD: {
    label: "Unfirm / delete planned order", short: "Unfirm", accent: "mid", prio: 0,
    rule: "The receipt is a firmed planned order that is past due. MRP cannot move or delete a firmed receipt, so it sits forever. Unfirm or delete it and the next run regenerates supply at an honest date.",
  },
  TECO: {
    label: "Close / technically complete", short: "Close", accent: "bad", prio: 1,
    rule: `Past due more than ${CFG.TECO_DAYS} days — or more than ${CFG.SUPERSEDED_MIN_DAYS} days with a newer past-due order for the same material at equal or larger quantity (a superseded pattern). Verify residual work-in-process, then close the order so the planning run stops counting it as incoming.`,
  },
  VERIFY_PARTIAL: {
    label: "Verify partial confirmation", short: "Verify", accent: "caution", prio: 2,
    rule: `Between ${CFG.LATE_MIN} and ${CFG.LATE_MAX} days past due with an open quantity at or below ${CFG.PARTIAL_FRACTION * 100}% of this material's largest open past-due order — the pattern of a partially confirmed order whose remnant was never cleaned up. Check confirmations; reduce or close the remainder.`,
  },
  RESCHEDULE: {
    label: "Reschedule to honest date", short: "Reschedule", accent: "control", prio: 3,
    rule: `Between ${CFG.LATE_MIN} and ${CFG.LATE_MAX} days past due with no remnant or superseded pattern — the receipt looks real but late. Move it to an achievable date so planning works against the truth instead of a date already in the past.`,
  },
  EXPEDITE_LEAVE: {
    label: "Expedite / leave", short: "Leave", accent: "good", prio: 4,
    rule: `Within ${CFG.LATE_MIN - 1} days of the due date — inside normal completion churn. Expedite if a downstream order needs it; otherwise expect it to confirm and clear on its own.`,
  },
};

const STATUS_OPTIONS = [
  "Pending", "Investigating", "Close sent", "Rescheduled", "Qty reduced", "Expedited", "Keep as-is",
];

const GLOSSARY = {
  "Phantom demand": "An open production order keeps generating dependent demand for its raw-material components. Past due and never going to run, that demand is false — but MRP has already procured against it, so the components land and overstock. The core problem this console triages.",
  "Phantom score": "Quantity weighted by how long it has been past due: qty × months past due, capped at " + CFG.PHANTOM_CAP_MONTHS + " months. A rough size-times-staleness measure of how much false demand one stale order drives into the plan.",
  "Close / TECO": "Technically complete — the status that closes a production order so MRP stops planning against it: no more phantom demand for its components. The action this console recommends for dead orders.",
  "Procurement type E": "In-house production — the material is made, not bought. Every order in this console is type E.",
  "Procurement type F": "External procurement — purchased raw material (ROH). These are the components a past-due order keeps generating false demand for; the BOM drawer lists the ones feeding each late subassembly.",
  "Planned order": "A supply proposal not yet converted to a production order. A firmed planned order past due blocks the run from replanning it.",
  "Production order": "A released in-house production order — the shop floor is (nominally) executing it.",
  "Firmed": "The firming indicator. A firmed receipt is locked against automatic replanning — which is exactly why past-due firmed orders never self-heal.",
  "Availability date": "The date the order's quantity is expected to be available. Past-due means this date is before the as-of date.",
  "Where-used": "The finished tools whose bill-of-material contains this material — the SKUs exposed if this order never completes.",
  "BOM scope": "Only the finished goods inside the loaded explosion sample. A material absent from it is 'not found in scope' — never proven obsolete.",
  "Chronic offender": "A (plant, material) with " + CFG.CHRONIC_MIN + " or more past-due orders at once — a supply-process problem, not a single-order problem.",
  "Partial confirmation": "Part of the order quantity was confirmed and the remainder left open — a small stale remnant that looks like supply but isn't coming.",
  "Snapshot diff": "Two pulls joined on order number: cleared (gone from the current pull), new (absent from the prior pull), persisting (in both — a quantity drop means it is actively confirming).",
  "As-of date": "The date past-due ages are measured against. Defaults to today.",
  "Plant": "The site that makes the material. Northpoint runs two: 1710 (Assembly) and 1720 (Fabrication). The same part number exists at both with different orders, so every total is kept per-plant.",
};

// ============================================================================
// === ENGINE === (pure) — context passed as parameters; no module state.
// Everything between the ENGINE markers runs headless for parity testing,
// including the deterministic synthetic generator that stands in for an export.
// ============================================================================
const DAY_MS = 86400000;

function normId(v) {
  let s = String(v == null ? "" : v).trim();
  if (/^\d+\.0$/.test(s)) s = s.slice(0, -2);
  return s;
}

function bucketOf(days, buckets) {
  for (const b of buckets) if (days >= b.min && days <= b.max) return b.id;
  return buckets[buckets.length - 1].id;
}

function keyPM(plant, mat) { return plant + "|" + mat; } // plant-qualified keying

function fmtN(n) {
  if (n == null || isNaN(n)) return "—";
  return Math.round(n) === n ? n.toLocaleString("en-US") : n.toLocaleString("en-US", { maximumFractionDigits: 1 });
}

function buildMaterialStats(orders) {
  const m = new Map();
  for (const o of orders) {
    const k = keyPM(o.plant, o.mat);
    let s = m.get(k);
    if (!s) { s = { n: 0, maxQty: 0, totalQty: 0, oldestDays: -1e15, phantom: 0, list: [] }; m.set(k, s); }
    s.n += 1; s.totalQty += o.qty;
    if (o.qty > s.maxQty) s.maxQty = o.qty;
    if (o.days > s.oldestDays) s.oldestDays = o.days;
    s.list.push(o);
  }
  return m;
}

// Single source of truth for classification. Total over every order — returns
// exactly one rec, so the five classes partition the worklist by construction.
function recommend(o, matStats, cfg) {
  const st = matStats.get(keyPM(o.plant, o.mat));
  if (/PlOrd/i.test(o.category)) {
    return { rec: "UNFIRM_PLORD", reason: `Firmed planned order ${o.days} days past due — the run cannot replan a firmed receipt. Unfirm or delete it; supply regenerates at an honest date.` };
  }
  if (o.days > cfg.TECO_DAYS) {
    return { rec: "TECO", reason: `${o.days} days past due (over ${cfg.TECO_DAYS}) — these ${fmtN(o.qty)} ${o.uom} have driven false demand for ~${Math.round(o.days / 30)} months. Verify residual work, then close so MRP stops over-procuring against it.` };
  }
  const supersededBy = st ? st.list.find((s) => s.order !== o.order && s.dueMs > o.dueMs && s.qty >= o.qty) : null;
  if (o.days > cfg.SUPERSEDED_MIN_DAYS && supersededBy) {
    return { rec: "TECO", reason: `${o.days} days past due and order ${supersededBy.order} for the same material is newer at equal or larger quantity (${fmtN(supersededBy.qty)} vs ${fmtN(o.qty)}) — this older receipt looks superseded. Verify, then close.` };
  }
  if (o.days >= cfg.LATE_MIN && o.days <= cfg.LATE_MAX && st && st.n >= 2 && o.qty <= cfg.PARTIAL_FRACTION * st.maxQty) {
    return { rec: "VERIFY_PARTIAL", reason: `Open quantity ${fmtN(o.qty)} is ≤ ${cfg.PARTIAL_FRACTION * 100}% of this material's largest open past-due order (${fmtN(st.maxQty)}) — the pattern of a partially confirmed remnant. Verify confirmations; reduce or close the remainder.` };
  }
  if (o.days >= cfg.LATE_MIN && o.days <= cfg.LATE_MAX) {
    return { rec: "RESCHEDULE", reason: `${o.days} days past due — the receipt looks real but late. Move it to an achievable date so planning works against the truth.` };
  }
  if (o.days < 1) {
    return { rec: "EXPEDITE_LEAVE", reason: `Due today or later as of the selected date — not past due by this measure.` };
  }
  return { rec: "EXPEDITE_LEAVE", reason: `${o.days} day${o.days === 1 ? "" : "s"} past due — inside normal completion churn. Expedite only if a downstream order needs it.` };
}

function computeAll(rawOrders, asOfMs, cfg, buckets) {
  const orders = rawOrders.map((r) => {
    const days = Math.floor((asOfMs - r.dueMs) / DAY_MS);
    return { ...r, days, bucket: bucketOf(days, buckets), phantom: r.qty * Math.min(Math.max(days, 0) / 30, cfg.PHANTOM_CAP_MONTHS) };
  });
  const matStats = buildMaterialStats(orders);
  for (const o of orders) {
    const { rec, reason } = recommend(o, matStats, cfg);
    o.rec = rec; o.reason = reason;
    o.chronic = (matStats.get(keyPM(o.plant, o.mat)) || { n: 0 }).n >= cfg.CHRONIC_MIN;
  }
  const bucketCounts = {}, bucketQty = {}, recCounts = {};
  let totalQty = 0, phantomTotal = 0;
  for (const o of orders) {
    bucketCounts[o.bucket] = (bucketCounts[o.bucket] || 0) + 1;
    bucketQty[o.bucket] = (bucketQty[o.bucket] || 0) + o.qty;
    recCounts[o.rec] = (recCounts[o.rec] || 0) + 1;
    totalQty += o.qty; phantomTotal += o.phantom;
  }
  const rollup = [];
  for (const [k, s] of matStats) {
    const [plant, mat] = k.split("|");
    const any = s.list[0];
    rollup.push({
      plant, mat, desc: any.desc, orders: s.n, totalQty: s.totalQty,
      oldestDays: s.oldestDays, phantom: s.list.reduce((a, o) => a + o.phantom, 0),
      chronic: s.n >= cfg.CHRONIC_MIN,
    });
  }
  rollup.sort((a, b) => b.phantom - a.phantom);
  return { orders, matStats, rollup, bucketCounts, bucketQty, recCounts, totalQty, phantomTotal };
}

function diffSnapshots(currentOrders, priorOrders) {
  const cur = new Map(currentOrders.map((o) => [o.order, o]));
  const pri = new Map(priorOrders.map((o) => [o.order, o]));
  const cleared = [], added = [], persisting = [];
  for (const [k, p] of pri) if (!cur.has(k)) cleared.push(p);
  for (const [k, c] of cur) {
    const p = pri.get(k);
    if (!p) added.push(c);
    else persisting.push({ cur: c, prev: p, qtyDelta: c.qty - p.qty });
  }
  return { cleared, added, persisting };
}

// BOM enrichment: per (plant, material) → where-used finished tools + purchased
// (F) descendants, scanned via indented-explosion level sequence. Scope-honest:
// "not found" means absent from the loaded sample, never proven obsolete.
function bomEnrich(bomFiles, targets) {
  const plantScope = new Map();
  const occIdx = [];
  for (const bf of bomFiles) {
    let ps = plantScope.get(bf.plant);
    if (!ps) { ps = { fgSet: new Set(), files: [] }; plantScope.set(bf.plant, ps); }
    for (const fg of bf.fgs) ps.fgSet.add(fg);
    ps.files.push(bf.name);
    const m = new Map();
    bf.comps.forEach((c, i) => { const a = m.get(c); if (a) a.push(i); else m.set(c, [i]); });
    occIdx.push(m);
  }
  const out = new Map();
  for (const t of targets) {
    const ps = plantScope.get(t.plant);
    if (!ps) { out.set(keyPM(t.plant, t.mat), { state: "no-bom" }); continue; }
    const skus = new Map(), fkids = new Map();
    bomFiles.forEach((bf, fi) => {
      if (bf.plant !== t.plant) return;
      const occ = occIdx[fi].get(t.mat);
      if (!occ) return;
      for (const i of occ) {
        skus.set(bf.fgs[i], bf.fgDescs ? bf.fgDescs[i] : "");
        const L = bf.levels[i];
        let j = i + 1;
        while (j < bf.comps.length && bf.levels[j] > L && bf.fgs[j] === bf.fgs[i]) {
          if (bf.procs[j] === "F" && !fkids.has(bf.comps[j])) {
            fkids.set(bf.comps[j], { desc: bf.descs[j], qty: bf.qtys[j], depth: bf.levels[j] - L });
          }
          j += 1;
        }
      }
    });
    if (skus.size === 0) out.set(keyPM(t.plant, t.mat), { state: "not-found", scopeFGs: ps.fgSet.size });
    else out.set(keyPM(t.plant, t.mat), {
      state: "found", scopeFGs: ps.fgSet.size,
      skus: [...skus].map(([fg, desc]) => ({ fg, desc })),
      fkids: [...fkids].map(([mat, v]) => ({ mat, ...v })).sort((a, b) => a.depth - b.depth),
    });
  }
  return { out, plantScope };
}

// ---- deterministic synthetic data (stands in for a real MRP export) ---------
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// In-house subassemblies (procurement type E) for a cordless-power-tool maker.
const CATALOG = [
  ["90204411", "Motor assembly 18V brushless"],
  ["90204412", "Gear housing 2-speed"],
  ["90204413", "Battery pack 4.0Ah cell stack"],
  ["90204414", "Trigger module variable-speed"],
  ["90204415", "Chuck assembly 13mm keyless"],
  ["90204416", "Switch board control PCBA"],
  ["90204417", "Clutch ring 21-stage"],
  ["90204418", "Stator winding 18V"],
  ["90204419", "Rotor shaft assembly"],
  ["90204420", "LED ring module"],
  ["90204421", "Blade guard 7-1/4in"],
  ["90204422", "Bevel plate assembly"],
  ["90204423", "Spindle lock module"],
  ["90204424", "Handle clamshell left"],
  ["90204425", "Gearbox planetary 3-stage"],
  ["90204426", "Brush ring carbon set"],
  ["90204427", "Battery contact block"],
  ["90204428", "Worklight driver board"],
];
const PLANTS = ["1710", "1720"]; // 1710 = Assembly, 1720 = Fabrication

// Seeded spot rows — known classification by construction. They use dedicated
// material numbers (902090xx, outside the bulk CATALOG) so bulk generation can
// never perturb their material statistics; the headless harness asserts the
// engine lands each one in the right class deterministically.
function spotRows(asOfMs) {
  const due = (d) => asOfMs - d * DAY_MS;
  return [
    { order: "SPOT0001", mat: "90209010", desc: "Drive coupler firmed sub", plant: "1710", qty: 240, uom: "PC", dueMs: due(45), category: "PlOrd", firmed: true },        // → UNFIRM_PLORD
    { order: "SPOT0002", mat: "90209011", desc: "Field coil legacy run", plant: "1710", qty: 600, uom: "PC", dueMs: due(120), category: "PrdOrd R", firmed: false },      // → TECO (over 90)
    { order: "SPOT0003", mat: "90209012", desc: "Bearing carrier rev A", plant: "1720", qty: 100, uom: "PC", dueMs: due(40), category: "PrdOrd R", firmed: false },       // → TECO (superseded by SPOT0004)
    { order: "SPOT0004", mat: "90209012", desc: "Bearing carrier rev A", plant: "1720", qty: 150, uom: "PC", dueMs: due(15), category: "PrdOrd R", firmed: false },       // → RESCHEDULE (newer, larger, the max)
    { order: "SPOT0005", mat: "90209013", desc: "Cell holder remnant", plant: "1710", qty: 20, uom: "PC", dueMs: due(25), category: "PrdOrd R", firmed: false },          // → VERIFY_PARTIAL (≤25% of 200)
    { order: "SPOT0006", mat: "90209013", desc: "Cell holder remnant", plant: "1710", qty: 200, uom: "PC", dueMs: due(25), category: "PrdOrd R", firmed: false },         // → RESCHEDULE (the max)
    { order: "SPOT0007", mat: "90209014", desc: "Detent spring assembly", plant: "1720", qty: 80, uom: "PC", dueMs: due(3), category: "PrdOrd R", firmed: false },        // → EXPEDITE_LEAVE
    { order: "SPOT0008", mat: "90209015", desc: "Index plate chronic", plant: "1720", qty: 50, uom: "PC", dueMs: due(60), category: "PrdOrd R", firmed: false },          // chronic trio
    { order: "SPOT0009", mat: "90209015", desc: "Index plate chronic", plant: "1720", qty: 50, uom: "PC", dueMs: due(58), category: "PrdOrd R", firmed: false },
    { order: "SPOT0010", mat: "90209015", desc: "Index plate chronic", plant: "1720", qty: 50, uom: "PC", dueMs: due(56), category: "PrdOrd R", firmed: false },
  ];
}

function genCurrent(asOfMs, seed, n) {
  const rnd = mulberry32(seed);
  const rows = spotRows(asOfMs);
  let serial = 80031000;
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  // days distribution biased to look like a real worklist: lots of fresh churn,
  // a long thin tail of rot. Covers every bucket and every rec class.
  const dayDraw = () => {
    const u = rnd();
    if (u < 0.30) return Math.floor(rnd() * 8);            // 0–7   churn / leave
    if (u < 0.62) return 8 + Math.floor(rnd() * 23);       // 8–30  reschedule/partial
    if (u < 0.84) return 31 + Math.floor(rnd() * 60);      // 31–90 reschedule/teco-superseded
    if (u < 0.95) return 91 + Math.floor(rnd() * 90);      // 91–180 teco
    return 181 + Math.floor(rnd() * 120);                  // 180+   deep rot
  };
  while (rows.length < n) {
    const [mat, desc] = pick(CATALOG);
    const plant = pick(PLANTS);
    const days = dayDraw();
    const isPlord = rnd() < 0.04;                          // a few firmed planned orders
    const base = 40 + Math.floor(rnd() * 760);
    const qty = Math.max(5, Math.round(base / 5) * 5);     // tidy round quantities
    rows.push({
      order: String(serial++),
      mat, desc, plant, qty, uom: "PC",
      dueMs: asOfMs - days * DAY_MS,
      category: isPlord ? "PlOrd" : "PrdOrd R",
      firmed: isPlord ? true : rnd() < 0.18,
    });
  }
  return rows;
}

// Prior pull derived from current: drop some (those read as "new" now), add some
// orders that have since cleared, and bump prior qty on a share of persisting
// orders so the current pull shows an honest confirming drawdown.
function genPrior(current, asOfMs, seed) {
  const rnd = mulberry32(seed ^ 0x9e3779b9);
  const prior = [];
  let serial = 79050000;
  for (const o of current) {
    if (o.order.startsWith("SPOT")) { prior.push({ ...o }); continue; }
    if (rnd() < 0.12) continue;                            // absent from prior → "new" in current
    const bumped = rnd() < 0.40 ? o.qty + (5 + Math.round(rnd() * 12) * 5) : o.qty;
    prior.push({ ...o, qty: bumped, dueMs: o.dueMs + (rnd() < 0.5 ? 0 : DAY_MS * 7) });
  }
  const clears = Math.round(current.length * 0.08);        // present in prior only → "cleared"
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  for (let i = 0; i < clears; i++) {
    const [mat, desc] = pick(CATALOG);
    prior.push({
      order: String(serial++), mat, desc, plant: pick(PLANTS),
      qty: 5 + Math.round(rnd() * 120) * 5, uom: "PC",
      dueMs: asOfMs - (8 + Math.floor(rnd() * 170)) * DAY_MS,
      category: "PrdOrd R", firmed: rnd() < 0.2,
    });
  }
  return prior;
}

// Two synthetic BOM explosions (one per plant). Indented level sequence: a
// finished tool, then its in-house subassemblies (E), then purchased parts (F).
function genBoms() {
  const file = (name, plant, fgRows) => {
    const fgs = [], fgDescs = [], levels = [], comps = [], procs = [], descs = [], qtys = [];
    for (const fg of fgRows) for (const c of fg.lines) {
      fgs.push(fg.fg); fgDescs.push(fg.fgDesc);
      levels.push(c.lvl); comps.push(c.comp); procs.push(c.proc); descs.push(c.desc); qtys.push(c.qty);
    }
    return { name, plant, fgs, fgDescs, levels, comps, procs, descs, qtys, fgCount: new Set(fgs).size };
  };
  const f1710 = file("BOM_1710.xlsx", "1710", [
    { fg: "70011001", fgDesc: "Cordless drill 18V kit", lines: [
      { lvl: 1, comp: "90204411", proc: "E", desc: "Motor assembly 18V brushless", qty: 1 },
      { lvl: 2, comp: "55120031", proc: "F", desc: "Neodymium magnet ring", qty: 4 },
      { lvl: 2, comp: "55120044", proc: "F", desc: "Ball bearing 608ZZ", qty: 2 },
      { lvl: 1, comp: "90204414", proc: "E", desc: "Trigger module variable-speed", qty: 1 },
      { lvl: 2, comp: "55120077", proc: "F", desc: "Hall-effect sensor", qty: 1 },
      { lvl: 1, comp: "90204413", proc: "E", desc: "Battery pack 4.0Ah cell stack", qty: 1 },
      { lvl: 2, comp: "55120090", proc: "F", desc: "Li-ion cell 21700", qty: 10 },
    ]},
    { fg: "70011002", fgDesc: "Cordless impact driver 18V", lines: [
      { lvl: 1, comp: "90204411", proc: "E", desc: "Motor assembly 18V brushless", qty: 1 },
      { lvl: 2, comp: "55120031", proc: "F", desc: "Neodymium magnet ring", qty: 4 },
      { lvl: 1, comp: "90204413", proc: "E", desc: "Battery pack 4.0Ah cell stack", qty: 1 },
      { lvl: 2, comp: "55120090", proc: "F", desc: "Li-ion cell 21700", qty: 10 },
    ]},
  ]);
  const f1720 = file("BOM_1720.xlsx", "1720", [
    { fg: "70022001", fgDesc: "Circular saw 7-1/4in", lines: [
      { lvl: 1, comp: "90204412", proc: "E", desc: "Gear housing 2-speed", qty: 1 },
      { lvl: 2, comp: "55120120", proc: "F", desc: "Helical gear 38T", qty: 1 },
      { lvl: 1, comp: "90204421", proc: "E", desc: "Blade guard 7-1/4in", qty: 1 },
      { lvl: 1, comp: "90204415", proc: "E", desc: "Chuck assembly 13mm keyless", qty: 1 },
      { lvl: 2, comp: "55120131", proc: "F", desc: "Spring clip set", qty: 3 },
    ]},
    { fg: "70022002", fgDesc: "Cordless angle grinder", lines: [
      { lvl: 1, comp: "90204417", proc: "E", desc: "Clutch ring 21-stage", qty: 1 },
      { lvl: 2, comp: "55120150", proc: "F", desc: "Friction disc", qty: 2 },
      { lvl: 1, comp: "90204412", proc: "E", desc: "Gear housing 2-speed", qty: 1 },
    ]},
  ]);
  return [f1710, f1720];
}
// === END ENGINE ===

// ============================================================================
// THE HOUSE FRAME (D120, 2026-09-23). Everything below the engine is the
// screen: HouseFrame from ../kit/house.jsx, the northpoint palette, the house
// formats, banners in place of the toast, writeWorkbook() with its About sheet.
// ============================================================================
const SLUG = "past-due-order-triage";
const NAME = "Past-Due Order Triage";
const SCOPE = "Reads a past-due production order list and BOM explosions in your browser. Never connects to SAP.";

/* THE NORTHPOINT PALETTE, "demand & planning" band. Every value a var()
   reference; the house frame's root carries the values for the mode in force. */
const T = northpointTokens(SLUG);

/* THE AGE RAMP IS A STATUS, so it keeps the severity colors: fresh churn is
   fine, rot is the alarm. Step 3 was brass until 2026-09-23; brass is chrome
   now, and the step at the threshold is amber. The oldest bucket repeats the
   alarm and is hatched instead of given a sixth hue. `text` is the color a
   figure takes; `fill` is the band's ground in the waterfall. */
const DECAY = {
  "0":      { text: T.good,      fill: T.goodFill },
  "1-7":    { text: T.sevOlive,  fill: T.oliveFill },
  "8-30":   { text: T.warn,      fill: T.warnFill },
  "31-90":  { text: T.sevOrange, fill: T.orangeFill },
  "91-180": { text: T.bad,       fill: T.badFill },
  "180+":   { text: T.bad,       fill: T.badFill },
};
const DECAY_HATCHED = new Set(["180+"]);

/* A recommendation's pill. Close is the alarm; Leave is healthy; Reschedule is
   a date that has slipped (amber); Verify and Unfirm take the two ramp steps
   between. */
const REC_TONE = { UNFIRM_PLORD: "orange", TECO: "bad", VERIFY_PARTIAL: "olive", RESCHEDULE: "warn", EXPEDITE_LEAVE: "ok" };
const REC_ORDER = ["UNFIRM_PLORD", "TECO", "VERIFY_PARTIAL", "RESCHEDULE", "EXPEDITE_LEAVE"];

/* A UTC-midnight timestamp as the calendar day it names. The engine keys every
   date at UTC midnight, so the UTC date IS the day, and the house formatter
   reads a bare YYYY-MM-DD without shifting it through a zone. */
function msToIso(ms) { return ms == null ? "" : new Date(ms).toISOString().slice(0, 10); }
const nfmt = (n) => figure(n, { zeroMeans: "zero", digits: Math.round(n) === n ? 0 : 1, empty: "—" });

/* THE AS-OF DATE IS TODAY IN EASTERN TIME. It was the UTC date, so from 8 PM
   ET every age on screen ran a day ahead of the reader's own calendar. */
function asOfEt() {
  const [y, m, d] = todayEt().split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

// ============================================================================
// XLSX EXPORT — the full workbook carries four sheets, the filtered one the
// orders on screen; writeWorkbook() adds the About sheet to either.
// ============================================================================
function ordersRows(list, dispositions, bomMap, moveMap) {
  const head = ["Order", "Material", "Description", "Plant", "Qty", "UoM", "Due date", "Days past due", "Age bucket", "Category", "Firmed", "Recommended action", "Why", "Phantom score", "Chronic material", "BOM context", "Movement vs prior", "Disposition", "Note"];
  const rows = list.map((o) => {
    const d = dispositions[o.order] || {};
    const b = bomMap ? bomMap.get(keyPM(o.plant, o.mat)) : null;
    const bomTxt = !b ? "" : b.state === "no-bom" ? "no BOM in scope for plant" : b.state === "not-found" ? `not found in loaded scope (${b.scopeFGs} FGs)` : `${b.skus.length} tools · ${b.fkids.length} purchased parts`;
    return [o.order, o.mat, o.desc, o.plant, o.qty, o.uom, msToIso(o.dueMs), o.days, o.bucket, o.category, o.firmed ? "X" : "", RECS[o.rec].label, o.reason, Math.round(o.phantom * 10) / 10, o.chronic ? "X" : "", bomTxt, moveMap ? (moveMap.get(o.order) ?? "") : "", d.status || "Pending", d.note || ""];
  });
  return [head, ...rows];
}

// ============================================================================
// THE INSTRUCTION MANUAL (tool-conventions § N), built from CFG, BUCKETS, RECS
// and GLOSSARY above, so a threshold change reaches it on its own.
// ============================================================================
export const MANUAL = {
  tool: NAME,
  purpose: "Sorts past-due in-house production orders into one clear action each, so the false demand they keep signaling stops reaching the purchasing plan.",
  sections: [
    {
      id: "start", title: "What it is for, and what to do first",
      blocks: [
        { p: "A production order that is past due and never going to run still tells the planning run its components are needed. The run buys them; they land and overstock. This console finds those orders and says, for each, whether to close it, move it, check it, unfirm it or leave it." },
        { list: [
          { lead: "Read the answer cards.", text: "Close candidates and the phantom score say how much false demand is in the plan. Press a card to show only those orders." },
          { lead: "Read the aging waterfall.", text: "Where the orders pile up by age, fresh on the left and rot on the right. Press a band to filter to it." },
          { lead: "Work the Triage tab.", text: "Open a row for the reason, the tools it exposes and a note field; set a disposition as you decide." },
          { lead: "Check the Snapshot diff tab.", text: "Orders confirming against the prior pull are moving on their own; leave them." },
        ] },
      ],
    },
    {
      id: "numbers", title: "What the numbers mean",
      blocks: [
        { table: { head: ["Figure", "What it is"], rows: [
          ["Orders past due", "Every open order in the list, and the units still open on them."],
          ["Close candidates", `Orders over ${CFG.TECO_DAYS} days past due, or over ${CFG.SUPERSEDED_MIN_DAYS} days with a newer order for the same material at equal or larger quantity.`],
          ["To reschedule", `Orders ${CFG.LATE_MIN} to ${CFG.LATE_MAX} days past due that look real but late.`],
          ["Phantom score 90+", "The phantom score summed over orders more than 90 days past due."],
          ["Dispositioned", "Orders given a disposition in this tab."],
          ["Days late", "The as-of date minus the order's availability date."],
        ] } },
      ],
    },
    {
      id: "flags", title: "Every recommended action, and what to do about it",
      blocks: [
        { table: { head: ["Action", "When it applies, and what to do"], rows: REC_ORDER.map((r) => [RECS[r].label, RECS[r].rule]) } },
        { p: `A CHRONIC tag marks a (plant, material) with ${CFG.CHRONIC_MIN} or more past-due orders at once: a supply-process problem, not a single-order one.` },
      ],
    },
    {
      id: "derived", title: "How to read the derived columns",
      blocks: [
        { p: `Quantity times months past due, capped at ${CFG.PHANTOM_CAP_MONTHS} months. A size-times-staleness measure of how much false demand one order drives; it ranks, it does not price.`, lead: "Phantom score." },
        { p: "Two pulls joined on order number. Cleared: in the prior pull, gone now. New: absent from the prior pull. Persisting: in both; a quantity drop means the order is confirming.", lead: "Movement and the snapshot diff." },
        { p: GLOSSARY["BOM scope"], lead: "BOM." },
      ],
    },
    {
      id: "data", title: "How the data is handled",
      blocks: [
        { p: `This copy runs entirely in your browser. On open it generates ${SAMPLE.n} past-due orders for ${COMPANY}, an invented manufacturer, from a fixed seed (${SAMPLE.seed}), with a prior pull and two BOM explosions beside it. Change the seed for a different sample. Ages are measured against today in Eastern Time.` },
        { p: "Dispositions and notes stay in this tab and go into both exports. Nothing is sent anywhere." },
      ],
    },
    {
      id: "thresholds", title: "Every threshold",
      blocks: [
        { table: { head: ["Threshold", "Value", "What it does"], rows: [
          ["Close after", `${CFG.TECO_DAYS} days`, "Past this, an order is a close candidate."],
          ["Superseded after", `${CFG.SUPERSEDED_MIN_DAYS} days`, "Past this, a newer equal-or-larger order makes an older one a close candidate."],
          ["Normal churn", `under ${CFG.LATE_MIN} days`, "Inside this, an order is left to confirm on its own."],
          ["Reschedule window", `${CFG.LATE_MIN} to ${CFG.LATE_MAX} days`, "A real but late order gets an honest date."],
          ["Remnant share", `${CFG.PARTIAL_FRACTION * 100}% of the material's largest open order`, "At or under this, a late order looks like a partial confirmation's leftover."],
          ["Chronic", `${CFG.CHRONIC_MIN} or more orders`, "Past-due orders for one (plant, material) at once."],
          ["Phantom cap", `${CFG.PHANTOM_CAP_MONTHS} months`, "The staleness weight stops growing here."],
        ] } },
        { p: "Set for this demo. A delivered copy takes the plant's own rules." },
      ],
    },
    {
      id: "limits", title: "What it cannot tell you",
      blocks: [
        { list: [
          "Whether work is still in process on an order it recommends closing. Verify before you close.",
          "What a material costs, so the phantom score ranks rather than prices.",
          "Anything about a material outside the loaded BOM explosions: 'not in scope' never means obsolete.",
          "Why an order slipped. It sorts the worklist; the reason is found on the floor.",
        ] },
      ],
    },
  ],
};

// ============================================================================
// THE AGING WATERFALL — the signature. One strip, fresh churn to rot; press a
// band to filter the worklist. Each band is a button, so it is reachable by
// keyboard, and its figures show on hover and focus.
// ============================================================================
function DecayWaterfall({ bucketCounts, bucketQty, orders, onPick, active }) {
  const present = BUCKETS.filter((b) => bucketCounts[b.id]);
  const total = present.reduce((a, b) => a + bucketCounts[b.id], 0) || 1;
  return (
    <div className="np-waterfall" style={{ display: "flex", width: "100%", borderRadius: 4, overflow: "hidden", border: `1px solid ${T.border}`, height: 60 }}>
      {present.map((b) => {
        const n = bucketCounts[b.id];
        const w = Math.max((n / total) * 100, 9.5);
        const byPlant = {};
        for (const o of orders) if (o.bucket === b.id) byPlant[o.plant] = (byPlant[o.plant] || 0) + 1;
        const tip = `${b.label}: ${count(n, "order")}, ${nfmt(bucketQty[b.id])} units; ` + Object.entries(byPlant).map(([p, c]) => `plant ${p} ${c}`).join(", ") + ". Press to filter.";
        const isActive = active === b.id;
        return (
          <button key={b.id} type="button" aria-pressed={isActive} title={tip} onClick={() => onPick(isActive ? "all" : b.id)}
            style={{
              width: w + "%", height: "100%", border: 0, borderRight: `1px solid ${T.bg}`, cursor: "pointer", textAlign: "left",
              background: DECAY[b.id].fill, color: T.accentInk, padding: "0 10px", display: "flex", flexDirection: "column", justifyContent: "center",
              backgroundImage: DECAY_HATCHED.has(b.id) ? `repeating-linear-gradient(45deg, transparent 0 7px, ${alpha(T.accentInk, 0.22)} 7px 14px)` : "none",
              outline: isActive ? `3px solid ${T.text}` : "none", outlineOffset: -3, minWidth: 0,
            }}>
            <span className="np-num" style={{ fontSize: 17, fontWeight: 700, color: T.accentInk }}>{n}</span>
            <span style={{ fontSize: 10.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: T.accentInk }}>{b.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function Triage() {
  const asOfMs = useMemo(() => asOfEt(), []);
  const asOfIso = msToIso(asOfMs);

  // --- synthetic self-loading data -----------------------------------------
  const [seed, setSeed] = useState(SAMPLE.seed);
  const [loadedAt, setLoadedAt] = useState(() => new Date());
  const sample = useMemo(() => {
    const current = genCurrent(asOfMs, seed, SAMPLE.n);
    const prior = genPrior(current, asOfMs, seed);
    const boms = genBoms();
    return { current, prior, boms };
  }, [asOfMs, seed]);

  const [tab, setTab] = useState("triage");
  const [fPlant, setFPlant] = useState("all");
  const [fBucket, setFBucket] = useState("all");
  const [fRec, setFRec] = useState("all");
  const [fStatus, setFStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [dispositions, setDispositions] = useState({}); // order# → {status, note} — in-session by design
  const [notice, setNotice] = useState(null);
  const tableRef = useRef(null);
  const matRef = useRef(null);

  const result = useMemo(() => computeAll(sample.current, asOfMs, CFG, BUCKETS), [sample, asOfMs]);
  const priorResult = useMemo(() => computeAll(sample.prior, asOfMs, CFG, BUCKETS), [sample, asOfMs]);
  const diff = useMemo(() => diffSnapshots(result.orders, priorResult.orders), [result, priorResult]);

  const moveMap = useMemo(() => {
    const m = new Map();
    for (const x of diff.persisting) if (x.qtyDelta !== 0) m.set(x.cur.order, x.qtyDelta);
    for (const c of diff.added) m.set(c.order, "new");
    return m;
  }, [diff]);

  const bom = useMemo(() => {
    const targets = [...new Map(result.orders.map((o) => [keyPM(o.plant, o.mat), { plant: o.plant, mat: o.mat }])).values()];
    return bomEnrich(sample.boms, targets);
  }, [result, sample]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return result.orders.filter((o) => {
      if (fPlant !== "all" && o.plant !== fPlant) return false;
      if (fBucket !== "all" && o.bucket !== fBucket) return false;
      if (fRec !== "all" && o.rec !== fRec) return false;
      const st = (dispositions[o.order] || {}).status || "Pending";
      if (fStatus !== "all" && st !== fStatus) return false;
      if (q && !(o.order.toLowerCase().includes(q) || o.mat.toLowerCase().includes(q) || o.desc.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [result, fPlant, fBucket, fRec, fStatus, search, dispositions]);

  useLayoutEffect(() => { pinColumns(tableRef.current); pinColumns(matRef.current); }, [filtered, expanded, tab]);

  const plants = [...new Set(result.orders.map((o) => o.plant))].sort();
  const setDisp = (order, patch) => setDispositions((d) => ({ ...d, [order]: { ...(d[order] || {}), ...patch } }));
  const dispositionedCount = Object.values(dispositions).filter((d) => d.status && d.status !== "Pending").length;
  const phantom90 = result.orders.filter((o) => o.days > 90).reduce((a, o) => a + o.phantom, 0);

  const newSample = (s) => { setSeed(s); setLoadedAt(new Date()); setDispositions({}); setExpanded(null); setNotice(null); };

  /* The filters in force, in words, for a filtered export's About sheet. */
  const shown = () => {
    const out = [];
    if (fPlant !== "all") out.push(`Plant: ${fPlant}`);
    if (fBucket !== "all") out.push(`Age: ${BUCKETS.find((b) => b.id === fBucket).label}`);
    if (fRec !== "all") out.push(`Action: ${RECS[fRec].label}`);
    if (fStatus !== "all") out.push(`Disposition: ${fStatus}`);
    if (search.trim()) out.push(`Search: "${search.trim()}"`);
    return out;
  };
  const exportWorkbook = async (full) => {
    const XLSX = await import("xlsx");
    const list = full ? result.orders : filtered;
    const sheets = [{ name: full ? "Orders" : "Filtered Orders", rows: ordersRows(list, dispositions, bom.out, moveMap) }];
    if (full) {
      const sorted = [...list].sort((a, b) => RECS[a.rec].prio - RECS[b.rec].prio || b.days - a.days);
      sheets.push({ name: "Action List", rows: [["Recommended action", "Order", "Material", "Description", "Plant", "Qty", "Due date", "Days past due", "Disposition", "Note"],
        ...sorted.map((x) => { const d = dispositions[x.order] || {}; return [RECS[x.rec].label, x.order, x.mat, x.desc, x.plant, x.qty, msToIso(x.dueMs), x.days, d.status || "Pending", d.note || ""]; })] });
      sheets.push({ name: "Material Rollup", rows: [["Material", "Description", "Plant", "Past-due orders", "Total qty", "Oldest (days)", "Phantom score", "Chronic"],
        ...result.rollup.map((r) => [r.mat, r.desc, r.plant, r.orders, r.totalQty, r.oldestDays, Math.round(r.phantom * 10) / 10, r.chronic ? "X" : ""])] });
      const dr = [["Set", "Order", "Material", "Description", "Plant", "Prior qty", "Current qty", "Qty change", "Due date"]];
      for (const p of diff.cleared) dr.push(["Cleared", p.order, p.mat, p.desc, p.plant, p.qty, "", "", msToIso(p.dueMs)]);
      for (const c of diff.added) dr.push(["New", c.order, c.mat, c.desc, c.plant, "", c.qty, "", msToIso(c.dueMs)]);
      for (const x of diff.persisting) dr.push(["Persisting", x.cur.order, x.cur.mat, x.cur.desc, x.cur.plant, x.prev.qty, x.cur.qty, x.qtyDelta, msToIso(x.cur.dueMs)]);
      sheets.push({ name: "Snapshot Diff", rows: dr });
    }
    writeWorkbook(XLSX, {
      slug: SLUG, which: full ? "full" : "filtered", tool: NAME,
      what: full
        ? `Every past-due order (${result.orders.length}) with its action, reason, phantom score, BOM context, movement and disposition; then the action list, the material rollup and the snapshot diff.`
        : `The ${count(list.length, "order")} on screen when it was exported, with action, reason, phantom score, BOM context, movement and disposition.`,
      source: `The ${COMPANY} sample, generated in your browser from seed ${seed}, as of ${houseDate(asOfIso)}`,
      shown: full ? [] : shown(),
      sheets,
    });
  };

  const moveCell = (mv) => mv === "new" ? <span style={{ color: T.sevOlive }}>new</span>
    : mv == null ? <span className="np-muted">—</span>
    : mv < 0 ? <span style={{ color: T.good }}>{figure(mv)} confirming</span>
    : <span style={{ color: T.bad }}>{figure(mv, { sign: true })}</span>;
  const bomCell = (b) => !b ? <span className="np-muted">—</span>
    : b.state === "found" ? <span style={{ color: T.good }}>{count(b.skus.length, "tool")}</span>
    : b.state === "not-found" ? <span className="np-muted" title="Not found in the loaded BOM scope — never proven obsolete">not in scope</span>
    : <span className="np-muted">no BOM</span>;

  const reload = dispositionedCount > 0
    ? <ConfirmButton label="New sample" effect={`Draws a new sample from seed ${seed + 1} and clears the ${count(dispositionedCount, "disposition")} made in this tab.`} confirmLabel="Draw and clear" onConfirm={() => newSample(seed + 1)} />
    : <button type="button" className="np-btn" onClick={() => newSample(seed + 1)} title="Draw a new deterministic sample from the next seed">New sample</button>;

  return (
    <>
      <div className="np-part">
        <div className="np-ident">
          <h2>{COMPANY} · past-due production orders</h2>
          <p>Loaded <b>the synthetic sample</b> at {time(loadedAt)}, generated in your browser from seed {seed}: {count(result.orders.length, "past-due order")} across plants {plants.join(" and ")}, as of <b>{houseDate(asOfIso)}</b>, with a prior pull and two BOM explosions. No real company data.</p>
        </div>
        <div className="np-row">
          <NumberField label="Seed" value={seed} min={1} max={999999} width="6em" onCommit={(s) => { if (s !== seed) newSample(s); }} />
          {reload}
        </div>
      </div>

      {notice && <NoticeBanner tag={notice.tag} tone={notice.tone} onDismiss={() => setNotice(null)}>{notice.text}</NoticeBanner>}

      <Intro>
        Of <b>{nfmt(result.orders.length)}</b> past-due production orders, <b>{nfmt(result.recCounts.TECO || 0)}</b> are close candidates and{" "}
        <b>{nfmt(result.recCounts.RESCHEDULE || 0)}</b> need an honest date; <b>{nfmt(result.bucketCounts["180+"] || 0)}</b> are more than 180 days late.
        Together they keep <Term text={GLOSSARY["Phantom demand"]}>phantom demand</Term> worth a phantom score of <b>{nfmt(Math.round(result.phantomTotal))}</b> in the plan.
      </Intro>
      <HowItWorks points={[
        { lead: "Every order gets exactly one action.", text: "Unfirm a firmed planned order; close an order over the age limit or superseded by a newer one; verify a small remnant; reschedule one that is real but late; leave one inside normal churn. The rules are checked in that order, so the five partition the list." },
        { lead: "The phantom score ranks false demand.", text: `Quantity times months past due, capped at ${CFG.PHANTOM_CAP_MONTHS}. It floats the orders driving the most false demand to the top.` },
        { lead: "The snapshot diff separates the moving from the stuck.", text: "An order in both pulls whose quantity dropped is confirming on its own; one that never moves is the phantom." },
        { lead: "BOM scope is honest.", text: "Where-used is reported only inside the loaded explosions; a material absent from them is 'not in scope', never obsolete." },
        { lead: "Every total is per plant.", text: "The same part number runs at both sites with different orders." },
      ]} />

      <AnswerCards>
        <AnswerCard label="Orders past due" value={nfmt(result.orders.length)}>
          {nfmt(result.totalQty)} units still open against demand that will not run.
        </AnswerCard>
        <AnswerCard label="Close candidates" value={nfmt(result.recCounts.TECO || 0)} tone="bad" pressed={fRec === "TECO"}
          onClick={() => { setFRec(fRec === "TECO" ? "all" : "TECO"); setTab("triage"); }} title="Press to show only these orders; press again to show all.">
          Over {CFG.TECO_DAYS} days, or superseded — close them so the run stops buying for them.
        </AnswerCard>
        <AnswerCard label="To reschedule" value={nfmt(result.recCounts.RESCHEDULE || 0)} tone="warn" pressed={fRec === "RESCHEDULE"}
          onClick={() => { setFRec(fRec === "RESCHEDULE" ? "all" : "RESCHEDULE"); setTab("triage"); }} title="Press to show only these orders; press again to show all.">
          Real but late: give each an achievable date.
        </AnswerCard>
        <AnswerCard label="Phantom score 90+" value={nfmt(Math.round(phantom90))} help={GLOSSARY["Phantom score"]}>
          False demand from orders more than 90 days late, still in the plan.
        </AnswerCard>
        <AnswerCard label="Dispositioned" value={nfmt(dispositionedCount)} tone={dispositionedCount ? "good" : undefined}>
          Decided in this tab; both exports carry them.
        </AnswerCard>
      </AnswerCards>

      <section className="np-panel">
        <div className="np-panel-head" style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
          <span>Aging waterfall — fresh churn to rot</span>
          <span className="np-muted" style={{ fontSize: 12 }}>
            Press a band to filter{fBucket !== "all" && <> · <button type="button" className="np-btn quiet" style={{ minHeight: 22, padding: "0 6px" }} onClick={() => setFBucket("all")}>Clear the age filter</button></>}
          </span>
        </div>
        <div className="np-panel-body">
          <DecayWaterfall bucketCounts={result.bucketCounts} bucketQty={result.bucketQty} orders={result.orders} active={fBucket} onPick={(b) => { setFBucket(b); setTab("triage"); }} />
        </div>
      </section>

      <div className="np-gridwrap">
        <div className="np-gridhead">
          <div className="np-row" role="tablist" aria-label="Views">
            {[["triage", "Triage", result.orders.length], ["materials", "Materials", result.rollup.length], ["diff", "Snapshot diff", diff.cleared.length + diff.added.length + diff.persisting.length]].map(([id, label, n]) => (
              <button key={id} type="button" role="tab" className="np-chip" aria-selected={tab === id} aria-pressed={tab === id} onClick={() => setTab(id)}>
                {label} <span className="n">({n})</span>
              </button>
            ))}
          </div>
          <span style={{ marginLeft: "auto" }} />
          <ExportPair fullCount={result.orders.length} filteredCount={filtered.length} noun="orders"
            onFull={() => exportWorkbook(true)} onFiltered={() => exportWorkbook(false)} />
        </div>

        {tab === "triage" && (
          <>
            <div className="np-gridhead">
              <select className="np-in" value={fPlant} onChange={(e) => setFPlant(e.target.value)} aria-label="Filter by plant">
                <option value="all">All plants</option>{plants.map((p) => <option key={p} value={p}>Plant {p}</option>)}
              </select>
              <select className="np-in" value={fRec} onChange={(e) => setFRec(e.target.value)} aria-label="Filter by recommended action">
                <option value="all">All actions</option>{REC_ORDER.map((r) => <option key={r} value={r}>{RECS[r].label} ({result.recCounts[r] || 0})</option>)}
              </select>
              <select className="np-in" value={fStatus} onChange={(e) => setFStatus(e.target.value)} aria-label="Filter by disposition">
                <option value="all">All dispositions</option>{STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <input className="np-in" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search order, material or description"
                aria-label="Search orders" style={{ flex: "1 1 220px" }} />
              <span>Showing <span className="np-num">{filtered.length}</span> of <span className="np-num">{result.orders.length}</span> orders</span>
            </div>
            <div className="np-scroll">
              <table className="np-grid" ref={tableRef} style={{ minWidth: 1240 }}>
                <thead>
                  <tr>
                    <th className="pin">Order</th>
                    <th className="pin">Material</th>
                    <th>Plant<Help label="Plant" text={GLOSSARY.Plant} /></th>
                    <th className="r">Qty</th>
                    <th>Due<Help label="Availability date" text={GLOSSARY["Availability date"]} /></th>
                    <th className="r">Days late</th>
                    <th>Category<Help label="Production order" text={GLOSSARY["Production order"]} /></th>
                    <th>Action<Help label="Recommended action" text={GLOSSARY["Close / TECO"]} /></th>
                    <th className="r">Phantom<Help label="Phantom score" text={GLOSSARY["Phantom score"]} /></th>
                    <th>BOM<Help label="BOM scope" text={GLOSSARY["BOM scope"]} /></th>
                    <th>Movement<Help label="Snapshot diff" text={GLOSSARY["Snapshot diff"]} /></th>
                    <th>Disposition</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((o) => {
                    const b = bom.out.get(keyPM(o.plant, o.mat));
                    const isOpen = expanded === o.order;
                    const disp = dispositions[o.order] || {};
                    const done = disp.status && disp.status !== "Pending";
                    return (
                      <React.Fragment key={o.order}>
                        <tr className={`is-row${done ? " is-done" : ""}`} aria-expanded={isOpen} onClick={() => setExpanded(isOpen ? null : o.order)}>
                          <td className="pin">
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                              <Dot tone={REC_TONE[o.rec]} title={RECS[o.rec].label} />
                              <span className="code">{o.order}</span>
                              {o.chronic && <Hint text={GLOSSARY["Chronic offender"]}><Pill tone="quiet">Chronic</Pill></Hint>}
                            </span>
                          </td>
                          <td className="pin clip" title={`${o.mat} · ${o.desc}`}>
                            <span className="code">{o.mat}</span> <span>{o.desc}</span>
                          </td>
                          <td className="num">{o.plant}</td>
                          <td className="r num">{nfmt(o.qty)} <span className="np-muted" style={{ fontSize: 11 }}>{o.uom}</span></td>
                          <td className="num">{houseDate(msToIso(o.dueMs))}</td>
                          <td className="r num" style={{ color: DECAY[o.bucket].text, fontWeight: 600 }}>{o.days}</td>
                          <td style={{ whiteSpace: "nowrap" }}>{/PlOrd/i.test(o.category) ? <span style={{ color: T.sevOrange }}>Planned{o.firmed ? " · firmed" : ""}</span> : <>Production{o.firmed ? <span className="np-muted"> · firmed</span> : ""}</>}</td>
                          <td><Hint text={RECS[o.rec].rule}><Pill tone={REC_TONE[o.rec]}>{RECS[o.rec].short}</Pill></Hint></td>
                          <td className="r num">{nfmt(Math.round(o.phantom))}</td>
                          <td style={{ whiteSpace: "nowrap" }}>{bomCell(b)}</td>
                          <td className="num">{moveCell(moveMap.get(o.order))}</td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <select className="np-in" value={disp.status || "Pending"} aria-label={`Disposition for order ${o.order}`}
                              style={{ minHeight: 24, padding: "1px 6px", fontSize: 12 }}
                              onChange={(e) => { setDisp(o.order, { status: e.target.value }); setNotice({ tag: "Recorded", tone: "ok", text: `Order ${o.order} set to "${e.target.value}" in this tab. A delivered copy writes it back through a connector.` }); }}>
                              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </td>
                        </tr>
                        {isOpen && (
                          <tr className="detail">
                            <td colSpan={12}>
                              <div className="np-detail" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))", gap: 18, padding: "6px 4px 10px" }}>
                                <div>
                                  <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", color: T.textMuted, marginBottom: 4 }}>{RECS[o.rec].label}</p>
                                  <p style={{ color: T.text, lineHeight: 1.55 }}>{o.reason}</p>
                                  <label style={{ display: "block", marginTop: 10, fontSize: 12, color: T.textMuted }}>
                                    Disposition note, kept in this tab
                                    <textarea className="np-in" value={disp.note || ""} onClick={(e) => e.stopPropagation()} onChange={(e) => setDisp(o.order, { note: e.target.value })}
                                      placeholder="For example: confirmed no WIP with the line lead, closing"
                                      style={{ display: "block", width: "100%", minHeight: 52, marginTop: 4, resize: "vertical" }} />
                                  </label>
                                </div>
                                <div>
                                  <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", color: T.textMuted, marginBottom: 4 }}>Where-used<Help label="Where-used" text={GLOSSARY["Where-used"]} /></p>
                                  {!b || b.state === "no-bom" ? <p className="np-muted">No BOM explosion loaded for plant {o.plant}.</p>
                                    : b.state === "not-found" ? <p className="np-muted">Not found in the loaded scope ({count(b.scopeFGs, "finished tool")}). Absent from the sample is not proven obsolete.</p>
                                    : <>
                                        <p style={{ color: T.text, marginBottom: 6 }}>Exposes {count(b.skus.length, "finished tool")}:</p>
                                        <div className="np-row" style={{ marginBottom: 8 }}>
                                          {b.skus.map((s) => <span key={s.fg} className="np-chip" title={s.desc}><span className="n">{s.fg}</span> {s.desc}</span>)}
                                        </div>
                                        {b.fkids.length > 0 && <>
                                          <p className="np-muted" style={{ marginBottom: 4 }}>Purchased parts feeding it<Help label="Purchased parts" text={GLOSSARY["Procurement type F"]} /></p>
                                          <div className="np-row">
                                            {b.fkids.map((f) => <span key={f.mat} className="np-chip"><span className="n">{f.mat}</span> {f.desc} ×{nfmt(f.qty)}</span>)}
                                          </div>
                                        </>}
                                      </>}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr className="detail"><td colSpan={12} className="np-empty">No orders match these filters. Clear a filter or the search.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <Legend lead="Actions:" items={REC_ORDER.map((r) => ({ label: `${RECS[r].short} (${result.recCounts[r] || 0})`, tone: REC_TONE[r], note: RECS[r].rule }))} />
            <Legend lead="Days late:" items={BUCKETS.filter((b) => b.id !== "180+").map((b) => ({ label: b.label, swatch: DECAY[b.id].text }))} />
          </>
        )}

        {tab === "materials" && (
          <div className="np-scroll">
            <table className="np-grid" ref={matRef} style={{ minWidth: 820 }}>
              <thead>
                <tr>
                  <th className="pin">Material</th>
                  <th className="pin">Description</th>
                  <th>Plant<Help label="Plant" text={GLOSSARY.Plant} /></th>
                  <th className="r">Past-due orders</th>
                  <th className="r">Total qty</th>
                  <th className="r">Oldest (days)</th>
                  <th className="r">Phantom score<Help label="Phantom score" text={GLOSSARY["Phantom score"]} /></th>
                </tr>
              </thead>
              <tbody>
                {result.rollup.map((r) => (
                  <tr key={r.plant + r.mat}>
                    <td className="pin"><span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span className="code">{r.mat}</span>{r.chronic && <Hint text={GLOSSARY["Chronic offender"]}><Pill tone="quiet">Chronic</Pill></Hint>}</span></td>
                    <td className="pin clip" title={r.desc}>{r.desc}</td>
                    <td className="num">{r.plant}</td>
                    <td className="r num">{r.orders}</td>
                    <td className="r num">{nfmt(r.totalQty)}</td>
                    <td className="r num" style={{ color: r.oldestDays > 90 ? T.bad : T.text }}>{r.oldestDays}</td>
                    <td className="r num">{nfmt(Math.round(r.phantom))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "diff" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(280px,100%),1fr))", gap: 8, padding: "0 8px 8px" }}>
            {[
              { title: "Cleared since the prior pull", tone: "ok", rows: diff.cleared.map((p) => ({ o: p.order, p: p.plant, d: p.desc, q: `${nfmt(p.qty)} gone` })), note: "In the prior pull, gone now: resolved or closed." },
              { title: "New this pull", tone: "olive", rows: diff.added.map((c) => ({ o: c.order, p: c.plant, d: c.desc, q: `${nfmt(c.qty)} new` })), note: "Absent from the prior pull: newly past due." },
              { title: "Persisting and confirming", tone: "info", rows: diff.persisting.filter((x) => x.qtyDelta < 0).sort((a, b) => a.qtyDelta - b.qtyDelta).map((x) => ({ o: x.cur.order, p: x.cur.plant, d: x.cur.desc, q: `${figure(x.qtyDelta)} qty` })), note: "In both pulls with a quantity drop: confirming, leave alone." },
            ].map((col) => (
              <section key={col.title} className="np-panel" style={{ margin: 0 }}>
                <div className="np-panel-head" style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Dot tone={col.tone} />{col.title}</span>
                  <span className="np-num">{col.rows.length}</span>
                </div>
                <div className="np-panel-body">
                  <p className="np-muted" style={{ marginBottom: 8 }}>{col.note}</p>
                  <div style={{ maxHeight: 360, overflow: "auto" }}>
                    {col.rows.slice(0, 60).map((r) => (
                      <div key={r.o} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "5px 0", borderBottom: `1px solid ${T.border}`, fontSize: 12.5 }}>
                        <span className="np-num" style={{ color: T.text }}>{r.o} <span className="np-muted">· {r.p}</span></span>
                        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.d}</span>
                        <span className="np-num" style={{ color: T.text }}>{r.q}</span>
                      </div>
                    ))}
                    {col.rows.length === 0 && <p className="np-muted">None.</p>}
                    {col.rows.length > 60 && <p className="np-muted" style={{ paddingTop: 8 }}>Showing the first 60 of {col.rows.length}; the full export carries every one.</p>}
                  </div>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default function PastDueOrderTriage() {
  return (
    <HouseFrame slug={SLUG} name={NAME} scope={SCOPE} manual={MANUAL}>
      <Triage />
    </HouseFrame>
  );
}
