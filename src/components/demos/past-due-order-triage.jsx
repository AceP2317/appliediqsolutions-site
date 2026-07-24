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

import React, {
  useState, useMemo, useEffect, useRef, useContext, createContext, useCallback,
} from "react";
// xlsx is loaded lazily inside exportWorkbook() so its ~480 KB chunk stays off
// the initial bundle — export is a secondary action.

// ============================================================================
// EDITABLE DOMAIN CONFIG — one block; a domain correction is a one-line edit
// ============================================================================
const COMPANY = "Northpoint Manufacturing";
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
    label: "Unfirm / delete planned order", short: "Unfirm", accent: "orange", prio: 0,
    rule: "The receipt is a firmed planned order that is past due. MRP cannot move or delete a firmed receipt, so it sits forever. Unfirm or delete it and the next run regenerates supply at an honest date.",
  },
  TECO: {
    label: "Close / technically complete", short: "Close", accent: "red", prio: 1,
    rule: `Past due more than ${CFG.TECO_DAYS} days — or more than ${CFG.SUPERSEDED_MIN_DAYS} days with a newer past-due order for the same material at equal or larger quantity (a superseded pattern). Verify residual work-in-process, then close the order so the planning run stops counting it as incoming.`,
  },
  VERIFY_PARTIAL: {
    label: "Verify partial confirmation", short: "Verify", accent: "yellow", prio: 2,
    rule: `Between ${CFG.LATE_MIN} and ${CFG.LATE_MAX} days past due with an open quantity at or below ${CFG.PARTIAL_FRACTION * 100}% of this material's largest open past-due order — the pattern of a partially confirmed order whose remnant was never cleaned up. Check confirmations; reduce or close the remainder.`,
  },
  RESCHEDULE: {
    label: "Reschedule to honest date", short: "Reschedule", accent: "cyan", prio: 3,
    rule: `Between ${CFG.LATE_MIN} and ${CFG.LATE_MAX} days past due with no remnant or superseded pattern — the receipt looks real but late. Move it to an achievable date so planning works against the truth instead of a date already in the past.`,
  },
  EXPEDITE_LEAVE: {
    label: "Expedite / leave", short: "Leave", accent: "green", prio: 4,
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
// THEME — vivid slate base + cyan / green / yellow / orange / red spectrum.
// Light / dark toggle, default dark. No corporate palette or branding.
// The aging spectrum (DECAY) is its own gradient, distinct from ACCENT so the
// "diagnosis" colors never collide with the "control" color.
// ============================================================================
const THEMES = {
  dark: {
    bg: "#0B1120", surface: "#131C2E", surfaceAlt: "#1E2A41", border: "#2B3A55",
    text: "#F1F5F9", textSec: "#A9B6CC", textMuted: "#6B7A93",
    headBg: "#0E1626",
  },
  light: {
    bg: "#F4F7FB", surface: "#FFFFFF", surfaceAlt: "#EEF2F8", border: "#D4DEEC",
    text: "#0E1A2B", textSec: "#475569", textMuted: "#7C8AA0",
    headBg: "#FFFFFF",
  },
};
const ACCENT = {
  cyan:   "#22D3EE",
  green:  "#34D399",
  yellow: "#FACC15",
  orange: "#FB923C",
  red:    "#F87171",
  slate:  "#94A3B8",
};
// solid fills for badges (slightly deeper so white/ink text reads on them)
const FILL = { cyan: "#0E7490", green: "#047857", yellow: "#A16207", orange: "#C2410C", red: "#B91C1C", slate: "#475569" };

// Age → decay color. Green (fresh) ramps through to crimson (rot).
const DECAY = {
  "0":      "#34D399",
  "1-7":    "#A3E635",
  "8-30":   "#FACC15",
  "31-90":  "#FB923C",
  "91-180": "#F87171",
  "180+":   "#DC2626",
};

const FONT_BODY = "'Inter','Segoe UI',system-ui,sans-serif";
const FONT_DATA = "'JetBrains Mono','SF Mono','Consolas',monospace";

const ThemeCtx = createContext({ T: THEMES.dark, mode: "dark" });

// ============================================================================
// TOOLTIP LAYER — fixed-position singleton + Q glossary markers
// ============================================================================
const TipCtx = createContext({ show: () => {}, hide: () => {} });

function TipProvider({ children }) {
  const [tip, setTip] = useState(null);
  const show = useCallback((text, x, y) => text && setTip({ text, x, y }), []);
  const hide = useCallback(() => setTip(null), []);
  const { T } = useContext(ThemeCtx);
  return (
    <TipCtx.Provider value={{ show, hide }}>
      {children}
      {tip && (
        <div style={{
          position: "fixed",
          left: Math.min(tip.x + 12, (typeof window !== "undefined" ? window.innerWidth : 1200) - 340),
          top: tip.y + 14, zIndex: 1000, maxWidth: 320, background: T.surfaceAlt, color: T.text,
          border: `1px solid ${T.border}`, borderRadius: 8, padding: "9px 11px",
          fontSize: 12, lineHeight: 1.5, fontFamily: FONT_BODY,
          boxShadow: "0 8px 28px rgba(0,0,0,0.45)", pointerEvents: "none",
        }}>{tip.text}</div>
      )}
    </TipCtx.Provider>
  );
}

function Hover({ text, children, style }) {
  const { show, hide } = useContext(TipCtx);
  return (
    <span
      style={style}
      onMouseMove={(e) => show(text, e.clientX, e.clientY)}
      onMouseLeave={hide}
      onFocus={(e) => { const r = e.target.getBoundingClientRect(); show(text, r.left, r.bottom); }}
      onBlur={hide}
      tabIndex={text ? 0 : undefined}
    >{children}</span>
  );
}

function Q({ term }) {
  const { T } = useContext(ThemeCtx);
  return (
    <Hover text={GLOSSARY[term] || term} style={{ cursor: "help" }}>
      <span style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 14, height: 14, marginLeft: 4, borderRadius: "50%",
        border: `1px solid ${ACCENT.cyan}`, color: ACCENT.cyan, fontSize: 9,
        lineHeight: 1, verticalAlign: "middle", fontWeight: 700,
      }}>?</span>
    </Hover>
  );
}

// ============================================================================
// SMALL UI ATOMS
// ============================================================================
function Dot({ c }) {
  return <span style={{ display: "inline-block", width: 9, height: 9, borderRadius: "50%", background: c, marginRight: 6, verticalAlign: "middle" }} />;
}

function Badge({ accent, children, title }) {
  const { mode } = useContext(ThemeCtx);
  const ink = mode === "light" ? "#FFFFFF" : "#0B1120";
  return (
    <Hover text={title}>
      <span style={{
        display: "inline-block", padding: "2px 9px", borderRadius: 999, fontSize: 11, fontWeight: 700,
        background: ACCENT[accent], color: ink, whiteSpace: "nowrap", letterSpacing: 0.2,
        cursor: title ? "help" : "default",
      }}>{children}</span>
    </Hover>
  );
}

// ============================================================================
// XLSX EXPORT — .xlsx only, named sheets, widths, autofilter
// ============================================================================
function sheetFromAoa(XLSX, aoa, widths) {
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = widths.map((w) => ({ wch: w }));
  if (aoa.length > 1) ws["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: aoa.length - 1, c: aoa[0].length - 1 } }) };
  return ws;
}
function msToIso(ms) { return ms == null ? "" : new Date(ms).toISOString().slice(0, 10); }

function ordersAoa(list, dispositions, bomMap, moveMap) {
  const head = ["Order", "Material", "Description", "Plant", "Qty", "UoM", "Due date", "Days past due", "Age bucket", "Category", "Firmed", "Recommended action", "Why", "Phantom score", "Chronic material", "BOM context", "Movement vs prior", "Disposition", "Note"];
  const rows = list.map((o) => {
    const d = dispositions[o.order] || {};
    const b = bomMap ? bomMap.get(keyPM(o.plant, o.mat)) : null;
    const bomTxt = !b ? "" : b.state === "no-bom" ? "no BOM in scope for plant" : b.state === "not-found" ? `not found in loaded scope (${b.scopeFGs} FGs)` : `${b.skus.length} tools · ${b.fkids.length} purchased parts`;
    return [o.order, o.mat, o.desc, o.plant, o.qty, o.uom, msToIso(o.dueMs), o.days, o.bucket, o.category, o.firmed ? "X" : "", RECS[o.rec].label, o.reason, Math.round(o.phantom * 10) / 10, o.chronic ? "X" : "", bomTxt, moveMap ? (moveMap.get(o.order) || "") : "", d.status || "Pending", d.note || ""];
  });
  return { aoa: [head, ...rows], widths: [11, 12, 34, 7, 8, 6, 11, 9, 10, 11, 7, 26, 70, 10, 9, 30, 22, 13, 28] };
}

async function exportWorkbook({ full, list, rollup, diff, dispositions, bomMap, moveMap, asOfMs }) {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();
  const o = ordersAoa(list, dispositions, bomMap, moveMap);
  XLSX.utils.book_append_sheet(wb, sheetFromAoa(XLSX, o.aoa, o.widths), full ? "Orders" : "Filtered Orders");
  if (full) {
    const sorted = [...list].sort((a, b) => RECS[a.rec].prio - RECS[b.rec].prio || b.days - a.days);
    const al = [["Recommended action", "Order", "Material", "Description", "Plant", "Qty", "Due date", "Days past due", "Disposition", "Note"],
      ...sorted.map((x) => { const d = dispositions[x.order] || {}; return [RECS[x.rec].label, x.order, x.mat, x.desc, x.plant, x.qty, msToIso(x.dueMs), x.days, d.status || "Pending", d.note || ""]; })];
    XLSX.utils.book_append_sheet(wb, sheetFromAoa(XLSX, al, [26, 11, 12, 34, 7, 8, 11, 9, 13, 28]), "Action List");
    const ru = [["Material", "Description", "Plant", "Past-due orders", "Total qty", "Oldest (days)", "Phantom score", "Chronic"],
      ...rollup.map((r) => [r.mat, r.desc, r.plant, r.orders, r.totalQty, r.oldestDays, Math.round(r.phantom * 10) / 10, r.chronic ? "X" : ""])];
    XLSX.utils.book_append_sheet(wb, sheetFromAoa(XLSX, ru, [12, 34, 7, 14, 10, 12, 12, 8]), "Material Rollup");
    if (diff) {
      const dr = [["Set", "Order", "Material", "Description", "Plant", "Prior qty", "Current qty", "Qty change", "Due date"]];
      for (const p of diff.cleared) dr.push(["Cleared", p.order, p.mat, p.desc, p.plant, p.qty, "", "", msToIso(p.dueMs)]);
      for (const c of diff.added) dr.push(["New", c.order, c.mat, c.desc, c.plant, "", c.qty, "", msToIso(c.dueMs)]);
      for (const x of diff.persisting) dr.push(["Persisting", x.cur.order, x.cur.mat, x.cur.desc, x.cur.plant, x.prev.qty, x.cur.qty, x.qtyDelta, msToIso(x.cur.dueMs)]);
      XLSX.utils.book_append_sheet(wb, sheetFromAoa(XLSX, dr, [10, 11, 12, 34, 7, 9, 11, 10, 11]), "Snapshot Diff");
    }
  }
  XLSX.writeFile(wb, `northpoint-past-due-${full ? "full" : "filtered"}-${msToIso(asOfMs)}.xlsx`);
}

// ============================================================================
// DECAY WATERFALL — signature element. The aging distribution as one strip
// that runs green (fresh churn) → crimson (rot), so the eye reads "where the
// phantom demand piles up" in a glance. Click a band to filter the worklist.
// ============================================================================
function DecayWaterfall({ bucketCounts, bucketQty, orders, onPick, active }) {
  const { T } = useContext(ThemeCtx);
  const present = BUCKETS.filter((b) => bucketCounts[b.id]);
  const total = present.reduce((a, b) => a + bucketCounts[b.id], 0) || 1;
  return (
    <div style={{ display: "flex", width: "100%", borderRadius: 10, overflow: "hidden", border: `1px solid ${T.border}`, height: 64 }}>
      {present.map((b) => {
        const n = bucketCounts[b.id];
        const w = Math.max((n / total) * 100, 9.5);
        const byPlant = {};
        for (const o of orders) if (o.bucket === b.id) byPlant[o.plant] = (byPlant[o.plant] || 0) + 1;
        const tip = `${b.label}: ${n} orders · ${fmtN(bucketQty[b.id])} units · ` + Object.entries(byPlant).map(([p, c]) => `plant ${p}: ${c}`).join(" · ") + " — click to filter";
        const isActive = active === b.id;
        const rot = b.id === "91-180" || b.id === "180+";
        return (
          <Hover key={b.id} text={tip} style={{ width: w + "%", display: "block" }}>
            <div onClick={() => onPick(isActive ? "all" : b.id)} style={{
              height: "100%", background: DECAY[b.id], cursor: "pointer",
              display: "flex", flexDirection: "column", justifyContent: "center", paddingLeft: 11,
              borderRight: `1px solid ${T.bg}`, boxSizing: "border-box",
              outline: isActive ? `2px solid ${ACCENT.cyan}` : "none", outlineOffset: -2,
              boxShadow: isActive ? `0 0 0 2px ${T.bg} inset` : "none",
            }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: rot ? "#FFF" : "#0B1120", fontFamily: FONT_DATA }}>{n}</div>
              <div style={{ fontSize: 10, color: rot ? "#FFFFFFD8" : "#0B1120C0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: 600 }}>{b.label}</div>
            </div>
          </Hover>
        );
      })}
    </div>
  );
}

// ============================================================================
// MAIN APP
// ============================================================================
export default function PastDueOrderTriage() {
  const [mode, setMode] = useState("dark");
  const T = THEMES[mode];

  const asOfMs = useMemo(() => {
    const d = new Date();
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  }, []);
  const asOfIso = msToIso(asOfMs);

  // --- synthetic self-loading data -----------------------------------------
  const [seed, setSeed] = useState(SAMPLE.seed);
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
  const [toast, setToast] = useState(null);

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

  const plants = [...new Set(result.orders.map((o) => o.plant))].sort();
  const setDisp = (order, patch) => setDispositions((d) => ({ ...d, [order]: { ...(d[order] || {}), ...patch } }));
  const flash = (msg) => { setToast(msg); setTimeout(() => setToast((t) => (t === msg ? null : t)), 2600); };

  const dispositionedCount = Object.values(dispositions).filter((d) => d.status && d.status !== "Pending").length;
  const phantom90 = result.orders.filter((o) => o.days > 90).reduce((a, o) => a + o.phantom, 0);

  // --- styles ---------------------------------------------------------------
  const page = { background: T.bg, color: T.text, minHeight: "100vh", fontFamily: FONT_BODY, fontSize: 13, backgroundImage: mode === "dark" ? "radial-gradient(1200px 500px at 80% -10%, rgba(34,211,238,0.07), transparent)" : "none" };
  const wrap = { maxWidth: 1320, margin: "0 auto", padding: "20px 18px 40px" };
  const sel = { background: T.surface, color: T.text, border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 9px", fontSize: 12, fontFamily: FONT_BODY };
  const card = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 };
  const btn = (primary) => ({
    fontSize: 12, padding: "7px 13px", borderRadius: 8, cursor: "pointer", fontFamily: FONT_BODY, fontWeight: 600,
    border: `1px solid ${primary ? ACCENT.cyan : T.border}`,
    background: primary ? ACCENT.cyan : T.surface, color: primary ? "#06283A" : T.text,
  });
  const thBase = { position: "sticky", top: 0, zIndex: 2, background: T.surfaceAlt, textAlign: "left", padding: "9px 11px", fontSize: 11, fontWeight: 700, color: T.textSec, whiteSpace: "nowrap", borderBottom: `1px solid ${T.border}`, letterSpacing: 0.2 };

  const recOrder = ["UNFIRM_PLORD", "TECO", "VERIFY_PARTIAL", "RESCHEDULE", "EXPEDITE_LEAVE"];

  return (
    <ThemeCtx.Provider value={{ T, mode }}>
      <TipProvider>
        <div style={page}>
          <div style={wrap}>

            {/* ---- header ---- */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 16 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 11, height: 26, borderRadius: 3, background: `linear-gradient(${ACCENT.green},${ACCENT.yellow},${ACCENT.red})`, display: "inline-block" }} />
                  <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: -0.4 }}>Past-Due Order Triage</h1>
                </div>
                <div style={{ color: T.textSec, fontSize: 13, marginTop: 5, maxWidth: 760 }}>
                  Stale in-house production orders keep signaling <Hover text={GLOSSARY["Phantom demand"]} style={{ color: ACCENT.cyan, cursor: "help", fontWeight: 600 }}>phantom demand</Hover> for their raw-material components — so MRP keeps procuring parts that land and overstock, until someone closes, reschedules, or unfirms the order. This console sorts the worklist into one clear action per order.
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                <div style={{ display: "flex", gap: 4, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 9, padding: 3 }}>
                  {["dark", "light"].map((m) => (
                    <button key={m} onClick={() => setMode(m)} title={`${m} theme`} style={{
                      fontSize: 11, padding: "4px 11px", borderRadius: 6, cursor: "pointer", fontFamily: FONT_BODY, fontWeight: 600,
                      border: "none", background: mode === m ? ACCENT.cyan : "transparent", color: mode === m ? "#06283A" : T.textSec,
                    }}>{m === "dark" ? "Dark" : "Light"}</button>
                  ))}
                </div>
                <span style={{ fontSize: 11, color: T.textMuted }}>{COMPANY} · demo data</span>
              </div>
            </div>

            {/* ---- synthetic-data banner ---- */}
            <div style={{ ...card, padding: "11px 14px", marginBottom: 14, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", borderColor: ACCENT.cyan + "55" }}>
              <span style={{ fontSize: 12, color: T.textSec }}>
                <strong style={{ color: T.text }}>Synthetic sample</strong> — {result.orders.length} past-due orders across plants {plants.join(" & ")}, as of {asOfIso}. No real company data or process.
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
                <label style={{ fontSize: 11, color: T.textMuted }}>seed</label>
                <input type="number" value={seed} onChange={(e) => setSeed(Number(e.target.value) || 0)} style={{ ...sel, width: 76 }} title="Re-roll the deterministic sample" />
                <button style={btn(false)} onClick={() => setSeed((s) => s + 1)} title="Generate a fresh deterministic sample">Reload sample</button>
              </span>
            </div>

            {/* ---- stat tiles ---- */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 16 }}>
              {[
                { k: "Orders past due", v: fmtN(result.orders.length), sub: `${fmtN(result.totalQty)} units open`, c: ACCENT.slate },
                { k: "Close candidates", v: fmtN(result.recCounts.TECO || 0), sub: "over 90 days / superseded", c: ACCENT.red, rec: "TECO" },
                { k: "To reschedule", v: fmtN(result.recCounts.RESCHEDULE || 0), sub: "real but late", c: ACCENT.cyan, rec: "RESCHEDULE" },
                { k: "Phantom score 90+", v: fmtN(Math.round(phantom90)), sub: "qty × months stale", c: ACCENT.orange, tip: GLOSSARY["Phantom score"] },
                { k: "Dispositioned", v: fmtN(dispositionedCount), sub: "in session", c: ACCENT.green },
              ].map((s) => (
                <div key={s.k} onClick={() => { if (s.rec) { setFRec(fRec === s.rec ? "all" : s.rec); setTab("triage"); } }}
                  style={{ ...card, padding: 13, borderLeft: `3px solid ${s.c}`, cursor: s.rec ? "pointer" : "default" }}>
                  <Hover text={s.tip}>
                    <div style={{ fontSize: 11, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.4, display: "flex", alignItems: "center" }}>{s.k}{s.tip && <Q term="Phantom score" />}</div>
                  </Hover>
                  <div style={{ fontSize: 26, fontWeight: 800, fontFamily: FONT_DATA, marginTop: 3, color: s.c }}>{s.v}</div>
                  <div style={{ fontSize: 11, color: T.textSec, marginTop: 1 }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* ---- decay waterfall (signature) ---- */}
            <div style={{ marginBottom: 6, display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.textSec, letterSpacing: 0.3 }}>AGING WATERFALL — fresh churn → rot</div>
              <div style={{ fontSize: 11, color: T.textMuted }}>click a band to filter{fBucket !== "all" && <span style={{ color: ACCENT.cyan, cursor: "pointer", marginLeft: 8 }} onClick={() => setFBucket("all")}>· clear ✕</span>}</div>
            </div>
            <DecayWaterfall bucketCounts={result.bucketCounts} bucketQty={result.bucketQty} orders={result.orders} active={fBucket} onPick={(b) => { setFBucket(b); setTab("triage"); }} />

            {/* ---- tabs + exports ---- */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "18px 0 12px", flexWrap: "wrap" }}>
              {[["triage", "Triage"], ["materials", "Materials"], ["diff", "Snapshot diff"], ["how", "How this works"]].map(([id, label]) => {
                const active = tab === id;
                return (
                  <button key={id} onClick={() => setTab(id)} style={{
                    fontSize: 13, padding: "7px 14px", borderRadius: 8, cursor: "pointer", fontFamily: FONT_BODY, fontWeight: 600,
                    border: `1px solid ${active ? ACCENT.cyan : T.border}`,
                    background: active ? ACCENT.cyan + "22" : T.surface, color: active ? ACCENT.cyan : T.textSec,
                  }}>{label}</button>
                );
              })}
              <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                <button style={btn(false)} title="Exports exactly the rows on screen — filters, search, and sort applied."
                  onClick={() => exportWorkbook({ full: false, list: filtered, rollup: result.rollup, diff, dispositions, bomMap: bom.out, moveMap, asOfMs })}>
                  Export filtered (.xlsx) — {filtered.length}
                </button>
                <button style={btn(true)} title="Exports every order regardless of view, plus the action list, material rollup, and snapshot diff."
                  onClick={() => exportWorkbook({ full: true, list: result.orders, rollup: result.rollup, diff, dispositions, bomMap: bom.out, moveMap, asOfMs })}>
                  Export full (.xlsx) — {result.orders.length}
                </button>
              </div>
            </div>

            {/* ================= TRIAGE ================= */}
            {tab === "triage" && (
              <div>
                {/* filters */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
                  <select value={fPlant} onChange={(e) => setFPlant(e.target.value)} style={sel} title="Filter by plant">
                    <option value="all">All plants</option>{plants.map((p) => <option key={p} value={p}>Plant {p}</option>)}
                  </select>
                  <select value={fRec} onChange={(e) => setFRec(e.target.value)} style={sel} title="Filter by recommended action">
                    <option value="all">All actions</option>{recOrder.map((r) => <option key={r} value={r}>{RECS[r].label}</option>)}
                  </select>
                  <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} style={sel} title="Filter by your disposition status">
                    <option value="all">All statuses</option>{STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search order / material / description"
                    style={{ ...sel, flex: "1 1 240px", minWidth: 200 }} />
                  <span style={{ fontSize: 11, color: T.textMuted }}>{filtered.length} of {result.orders.length}</span>
                </div>

                {/* legend */}
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 10, fontSize: 11, color: T.textSec }}>
                  {recOrder.map((r) => (
                    <Hover key={r} text={RECS[r].rule} style={{ cursor: "help", display: "inline-flex", alignItems: "center" }}>
                      <Dot c={ACCENT[RECS[r].accent]} />{RECS[r].label} ({result.recCounts[r] || 0})
                    </Hover>
                  ))}
                </div>

                <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 8 }}>
                  Dispositions live in this session only — export to keep them. Click a row for the full reason, BOM context, and a note field.
                </div>

                {/* worklist table — bounded dual-sticky window */}
                <div style={{ ...card, padding: 0, overflow: "hidden" }}>
                  <div style={{ overflow: "auto", maxHeight: "max(440px, calc(100vh - 360px))", overscrollBehavior: "contain" }}>
                    <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 1080 }}>
                      <thead>
                        <tr>
                          <th style={{ ...thBase, left: 0, zIndex: 3 }}>Order / Material</th>
                          <th style={thBase}>Plant<Q term="Plant" /></th>
                          <th style={thBase}>Qty</th>
                          <th style={thBase}>Due<Q term="Availability date" /></th>
                          <th style={thBase}>Days late</th>
                          <th style={thBase}>Category<Q term="Production order" /></th>
                          <th style={thBase}>Recommendation<Q term="Close / TECO" /></th>
                          <th style={thBase}>Phantom<Q term="Phantom score" /></th>
                          <th style={thBase}>BOM<Q term="BOM scope" /></th>
                          <th style={thBase}>Movement<Q term="Snapshot diff" /></th>
                          <th style={thBase}>Disposition</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((o, i) => {
                          const rowBg = i % 2 ? T.surface : T.bg;
                          const acc = ACCENT[RECS[o.rec].accent];
                          const b = bom.out.get(keyPM(o.plant, o.mat));
                          const mv = moveMap.get(o.order);
                          const isOpen = expanded === o.order;
                          const disp = dispositions[o.order] || {};
                          return (
                            <React.Fragment key={o.order}>
                              <tr onClick={() => setExpanded(isOpen ? null : o.order)} style={{ cursor: "pointer", background: isOpen ? T.surfaceAlt : rowBg, borderBottom: `1px solid ${T.border}` }}>
                                <td style={{ position: "sticky", left: 0, zIndex: 1, background: isOpen ? T.surfaceAlt : rowBg, padding: "8px 11px", borderRight: `1px solid ${T.border}` }}>
                                  <div style={{ fontFamily: FONT_DATA, fontSize: 12, color: T.text, display: "flex", alignItems: "center", gap: 6 }}>
                                    {o.order}{o.chronic && <Hover text={GLOSSARY["Chronic offender"]} style={{ cursor: "help" }}><span style={{ fontSize: 9, color: ACCENT.orange, border: `1px solid ${ACCENT.orange}`, borderRadius: 4, padding: "0 4px", fontWeight: 700 }}>CHRONIC</span></Hover>}
                                  </div>
                                  <div style={{ fontSize: 11, color: T.textSec, maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.mat} · {o.desc}</div>
                                </td>
                                <td style={{ padding: "8px 11px", fontFamily: FONT_DATA, color: T.textSec }}>{o.plant}</td>
                                <td style={{ padding: "8px 11px", fontFamily: FONT_DATA, textAlign: "right" }}>{fmtN(o.qty)}<span style={{ color: T.textMuted, fontSize: 10 }}> {o.uom}</span></td>
                                <td style={{ padding: "8px 11px", fontFamily: FONT_DATA, color: T.textSec, fontSize: 11 }}>{msToIso(o.dueMs)}</td>
                                <td style={{ padding: "8px 11px", fontFamily: FONT_DATA, textAlign: "right", color: DECAY[o.bucket], fontWeight: 700 }}>{o.days}</td>
                                <td style={{ padding: "8px 11px", fontSize: 11, color: T.textSec }}>{/PlOrd/i.test(o.category) ? <span style={{ color: ACCENT.orange }}>Planned{o.firmed ? " · firmed" : ""}</span> : <>Production{o.firmed ? <span style={{ color: T.textMuted }}> · firmed</span> : ""}</>}</td>
                                <td style={{ padding: "8px 11px" }}><Badge accent={RECS[o.rec].accent} title={RECS[o.rec].rule}>{RECS[o.rec].short}</Badge></td>
                                <td style={{ padding: "8px 11px", fontFamily: FONT_DATA, textAlign: "right", color: T.textSec }}>{fmtN(Math.round(o.phantom))}</td>
                                <td style={{ padding: "8px 11px", fontSize: 11 }}>{!b ? "—" : b.state === "found" ? <span style={{ color: ACCENT.green }}>{b.skus.length} tool{b.skus.length === 1 ? "" : "s"}</span> : b.state === "not-found" ? <span style={{ color: T.textMuted }} title="not found in loaded scope">not in scope</span> : <span style={{ color: T.textMuted }}>no BOM</span>}</td>
                                <td style={{ padding: "8px 11px", fontSize: 11, fontFamily: FONT_DATA }}>{mv === "new" ? <span style={{ color: ACCENT.yellow }}>new</span> : mv == null ? <span style={{ color: T.textMuted }}>—</span> : mv < 0 ? <span style={{ color: ACCENT.green }}>{mv} confirming</span> : <span style={{ color: ACCENT.red }}>+{mv}</span>}</td>
                                <td style={{ padding: "8px 11px" }}>
                                  <select value={disp.status || "Pending"} onClick={(e) => e.stopPropagation()} onChange={(e) => { setDisp(o.order, { status: e.target.value }); if (e.target.value !== "Pending") flash(`Disposition “${e.target.value}” saved in session — connect a backend to write it through.`); }}
                                    style={{ ...sel, padding: "3px 6px", fontSize: 11, borderColor: (disp.status && disp.status !== "Pending") ? ACCENT.green : T.border }}>
                                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                                  </select>
                                </td>
                              </tr>
                              {isOpen && (
                                <tr style={{ background: T.surfaceAlt }}>
                                  <td colSpan={11} style={{ padding: "0 14px 14px 14px", borderBottom: `1px solid ${T.border}` }}>
                                    <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 18, paddingTop: 12 }}>
                                      <div>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT[RECS[o.rec].accent], textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 5 }}>{RECS[o.rec].label}</div>
                                        <div style={{ fontSize: 12.5, color: T.text, lineHeight: 1.55 }}>{o.reason}</div>
                                        <div style={{ marginTop: 10 }}>
                                          <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>Disposition note (session only)</div>
                                          <textarea value={disp.note || ""} onClick={(e) => e.stopPropagation()} onChange={(e) => setDisp(o.order, { note: e.target.value })}
                                            placeholder="e.g. confirmed 0 WIP with line lead, closing"
                                            style={{ width: "100%", minHeight: 52, background: T.surface, color: T.text, border: `1px solid ${T.border}`, borderRadius: 8, padding: "7px 9px", fontSize: 12, fontFamily: FONT_BODY, resize: "vertical", boxSizing: "border-box" }} />
                                        </div>
                                      </div>
                                      <div>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: T.textSec, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 }}>Where-used <Q term="Where-used" /></div>
                                        {!b || b.state === "no-bom" ? <div style={{ fontSize: 12, color: T.textMuted }}>No BOM explosion loaded for plant {o.plant}.</div>
                                          : b.state === "not-found" ? <div style={{ fontSize: 12, color: T.textMuted }}>Not found in the loaded scope ({b.scopeFGs} finished tools). Absent from the sample is <em>not</em> proven obsolete.</div>
                                          : <div>
                                              <div style={{ fontSize: 12, color: T.text, marginBottom: 6 }}>Exposes {b.skus.length} finished tool{b.skus.length === 1 ? "" : "s"}:</div>
                                              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                                                {b.skus.map((s) => <span key={s.fg} style={{ fontSize: 11, fontFamily: FONT_DATA, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: "2px 7px" }} title={s.desc}>{s.fg} · {s.desc}</span>)}
                                              </div>
                                              {b.fkids.length > 0 && <>
                                                <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>Purchased parts feeding it <Q term="Procurement type F" /></div>
                                                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                                  {b.fkids.map((f) => <span key={f.mat} style={{ fontSize: 11, fontFamily: FONT_DATA, color: ACCENT.cyan, background: ACCENT.cyan + "18", borderRadius: 6, padding: "2px 7px" }}>{f.mat} · {f.desc} ×{fmtN(f.qty)}</span>)}
                                                </div>
                                              </>}
                                            </div>}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                        {filtered.length === 0 && (
                          <tr><td colSpan={11} style={{ padding: 28, textAlign: "center", color: T.textMuted }}>No orders match these filters. Clear a filter or reload the sample.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ================= MATERIALS ================= */}
            {tab === "materials" && (
              <div style={{ ...card, padding: 0, overflow: "hidden" }}>
                <div style={{ overflow: "auto", maxHeight: "max(440px, calc(100vh - 320px))", overscrollBehavior: "contain" }}>
                  <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 820 }}>
                    <thead>
                      <tr>
                        <th style={{ ...thBase, left: 0, zIndex: 3 }}>Material</th>
                        <th style={thBase}>Plant<Q term="Plant" /></th>
                        <th style={thBase}>Past-due orders</th>
                        <th style={thBase}>Total qty</th>
                        <th style={thBase}>Oldest (days)</th>
                        <th style={thBase}>Phantom score<Q term="Phantom score" /></th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.rollup.map((r, i) => (
                        <tr key={r.plant + r.mat} style={{ background: i % 2 ? T.surface : T.bg, borderBottom: `1px solid ${T.border}` }}>
                          <td style={{ position: "sticky", left: 0, zIndex: 1, background: i % 2 ? T.surface : T.bg, padding: "8px 11px", borderRight: `1px solid ${T.border}` }}>
                            <div style={{ fontFamily: FONT_DATA, fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>{r.mat}{r.chronic && <span style={{ fontSize: 9, color: ACCENT.orange, border: `1px solid ${ACCENT.orange}`, borderRadius: 4, padding: "0 4px", fontWeight: 700 }}>CHRONIC</span>}</div>
                            <div style={{ fontSize: 11, color: T.textSec }}>{r.desc}</div>
                          </td>
                          <td style={{ padding: "8px 11px", fontFamily: FONT_DATA, color: T.textSec }}>{r.plant}</td>
                          <td style={{ padding: "8px 11px", fontFamily: FONT_DATA, textAlign: "right" }}>{r.orders}</td>
                          <td style={{ padding: "8px 11px", fontFamily: FONT_DATA, textAlign: "right" }}>{fmtN(r.totalQty)}</td>
                          <td style={{ padding: "8px 11px", fontFamily: FONT_DATA, textAlign: "right", color: r.oldestDays > 90 ? ACCENT.red : T.textSec }}>{r.oldestDays}</td>
                          <td style={{ padding: "8px 11px", fontFamily: FONT_DATA, textAlign: "right", color: ACCENT.orange, fontWeight: 700 }}>{fmtN(Math.round(r.phantom))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ================= SNAPSHOT DIFF ================= */}
            {tab === "diff" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 14 }}>
                {[
                  { title: "Cleared since prior pull", c: ACCENT.green, rows: diff.cleared.map((p) => ({ o: p.order, m: p.mat, d: p.desc, p: p.plant, q: `${fmtN(p.qty)} gone` })), note: "Present in the prior pull, absent now — resolved or closed." },
                  { title: "New this pull", c: ACCENT.yellow, rows: diff.added.map((c) => ({ o: c.order, m: c.mat, d: c.desc, p: c.plant, q: `${fmtN(c.qty)} new` })), note: "Absent from the prior pull — newly past due." },
                  { title: "Persisting & confirming", c: ACCENT.cyan, rows: diff.persisting.filter((x) => x.qtyDelta < 0).sort((a, b) => a.qtyDelta - b.qtyDelta).map((x) => ({ o: x.cur.order, m: x.cur.mat, d: x.cur.desc, p: x.cur.plant, q: `${x.qtyDelta} qty` })), note: "In both pulls with a quantity drop — actively confirming, leave alone." },
                ].map((col) => (
                  <div key={col.title} style={card}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: col.c }}><Dot c={col.c} />{col.title}</div>
                      <span style={{ fontFamily: FONT_DATA, fontSize: 13, color: col.c }}>{col.rows.length}</span>
                    </div>
                    <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 10 }}>{col.note}</div>
                    <div style={{ maxHeight: 360, overflow: "auto", overscrollBehavior: "contain" }}>
                      {col.rows.slice(0, 60).map((r) => (
                        <div key={r.o} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "5px 0", borderBottom: `1px solid ${T.border}`, fontSize: 11.5 }}>
                          <span style={{ fontFamily: FONT_DATA }}>{r.o} <span style={{ color: T.textMuted }}>· {r.p}</span></span>
                          <span style={{ color: T.textSec, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.d}</span>
                          <span style={{ fontFamily: FONT_DATA, color: col.c, whiteSpace: "nowrap" }}>{r.q}</span>
                        </div>
                      ))}
                      {col.rows.length === 0 && <div style={{ fontSize: 12, color: T.textMuted, padding: "8px 0" }}>None.</div>}
                      {col.rows.length > 60 && <div style={{ fontSize: 11, color: T.textMuted, padding: "8px 0" }}>+{col.rows.length - 60} more — see the full export.</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ================= HOW THIS WORKS ================= */}
            {tab === "how" && (
              <div style={{ ...card, maxWidth: 880, lineHeight: 1.6 }}>
                <h3 style={{ marginTop: 0, fontSize: 16 }}>How the triage works</h3>
                <p style={{ color: T.textSec }}>
                  Every row is one open in-house production order whose date is already in the past. While it stays open, MRP keeps honoring its dependent demand for raw materials — so it quietly over-procures components that land and overstock. The engine measures how late each order is, weights it by size and staleness, and sorts it into exactly one of five actions.
                </p>
                <div style={{ display: "grid", gap: 10, margin: "14px 0" }}>
                  {["UNFIRM_PLORD", "TECO", "VERIFY_PARTIAL", "RESCHEDULE", "EXPEDITE_LEAVE"].map((r) => (
                    <div key={r} style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
                      <span style={{ marginTop: 2 }}><Badge accent={RECS[r].accent}>{RECS[r].short}</Badge></span>
                      <div><strong style={{ color: T.text }}>{RECS[r].label}.</strong> <span style={{ color: T.textSec }}>{RECS[r].rule}</span></div>
                    </div>
                  ))}
                </div>
                <h4 style={{ marginBottom: 4 }}>Phantom score <Q term="Phantom score" /></h4>
                <p style={{ color: T.textSec, marginTop: 0 }}>Each order's quantity is weighted by months past due (capped at {CFG.PHANTOM_CAP_MONTHS}), giving a single size-times-staleness number. It ranks the worklist so the orders driving the most false demand float to the top.</p>
                <h4 style={{ marginBottom: 4 }}>Snapshot diff <Q term="Snapshot diff" /></h4>
                <p style={{ color: T.textSec, marginTop: 0 }}>Two consecutive pulls join on order number. A persisting order whose quantity dropped is actively confirming — leave it. One that never moves is the phantom this console is built to surface.</p>
                <h4 style={{ marginBottom: 4 }}>Honest scope</h4>
                <p style={{ color: T.textSec, marginTop: 0 }}>BOM where-used is reported only within the loaded explosion sample. A material absent from it shows as <em>not in scope</em>, never as obsolete — the tool refuses to assert what the data can't support. Every total is kept per <Hover text={GLOSSARY["Plant"]} style={{ color: ACCENT.cyan, cursor: "help" }}>plant</Hover>, because the same part number runs at both sites with different orders.</p>
                <p style={{ color: T.textMuted, fontSize: 12, marginTop: 16 }}>This is a public portfolio demo on synthetic data. Dispositions persist for the session only; a production build writes them through a backend connector.</p>
              </div>
            )}

            {/* ---- footer / byline ---- */}
            <div style={{ marginTop: 26, paddingTop: 14, borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <span style={{ fontSize: 12, color: T.textMuted }}>Built by Ian Provencher · {COMPANY} portfolio demo · synthetic data</span>
              <span style={{ fontSize: 11, color: T.textMuted }}>Demand-signal integrity — past-due in-house orders that fake demand and overstock raw materials</span>
            </div>
          </div>

          {/* ---- connector toast (stands in for write-back) ---- */}
          {toast && (
            <div style={{ position: "fixed", bottom: 22, left: "50%", transform: "translateX(-50%)", zIndex: 1100, background: T.surfaceAlt, color: T.text, border: `1px solid ${ACCENT.green}`, borderRadius: 10, padding: "11px 16px", fontSize: 12.5, maxWidth: 460, boxShadow: "0 10px 32px rgba(0,0,0,0.5)" }}>
              <span style={{ color: ACCENT.green, fontWeight: 700, marginRight: 6 }}>✓</span>{toast}
            </div>
          )}
        </div>
      </TipProvider>
    </ThemeCtx.Provider>
  );
}
