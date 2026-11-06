// @ts-nocheck
/* ============================================================================
   PRODUCTION PLAN CHURN  —  public portfolio demo
   ----------------------------------------------------------------------------
   A decision-layer instrument that measures MRP "plan nervousness." It ingests
   N saved production-plan exports, sequences them by date, diffs each
   consecutive snapshot pair, and surfaces churn three ways — a trend across the
   sequence, a material x week severity grid, and a filterable order-level
   detail — with a second axis attributing each change to a planner (manual) vs.
   an MRP regen (system).

   This is the PUBLIC portfolio build: rebuilt from the capability spec (not a
   code fork of the internal tool), re-domained to the fictional NORTHPOINT
   MANUFACTURING, self-loading synthetic data only, in the northpoint palette
   on the house frame (D120). No real company data, plant codes, transaction
   codes, or internal site/line topology appear anywhere in this file.

   ENGINE PARITY — validated headless (Node) on the synthetic snapshot set,
   2026-06-13. 5 snapshots -> 4 diff pairs. All identities pass:
     - type partition: sum of by-type counts == total change count (every pair)
     - reschedule == pulled-in + pushed-out (every pair)
     - near (cosmetic, sev 1) <= total churn (every pair)
     - material x week matrix cell sum == change-list length (every pair)
     - line counts additive (L1+L2 == ALL); line %-disturbed ratios independent
     - conversions excluded from churn; roll-off (below window anchor) excluded
     - classification precedence: date > qty > line > version
     - dual-key fallback re-keys a renumbered order instead of drop+add
   Re-confirm parity after any edit inside the // === ENGINE === block.

   Built by Ian Provencher.
   ========================================================================== */

import React, { useState, useMemo, useRef, useLayoutEffect } from "react";
// The northpoint palette (D120): every color a var() reference, the values on
// the house frame's root for the mode in force.
import { northpointTokens, alpha } from "../kit/industrial.js";
import { figure, percent, date as houseDate, dateShort, count, MINUS } from "../../lib/format.js";
import {
  HouseFrame, Intro, HowItWorks, AnswerCards, AnswerCard, ExportPair,
  Help, Term, Hint, Legend, Dot, Pill, pinColumns, useNorthpoint,
} from "../kit/house.jsx";
import { writeWorkbook } from "../kit/house-export.js";
// The fictional company these seven are set in — one file, so the world
// cannot drift into two companies across seven tools.
import { NORTHPOINT } from "../../lib/northpoint.js";
// xlsx is loaded lazily inside exportWorkbook() so its ~480 KB chunk stays off
// the initial bundle — export is a secondary action.
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip as RTooltip,
} from "recharts";

/* ============================================================================
   DOMAIN CLASSIFICATION  (single editable block — types, colors, topology)
   ========================================================================== */
const TYPES = {
  pullin:    { label: "Pulled in",   sev: 3, desc: "Schedule moved earlier — parts needed sooner.", group: "reschedule" },
  pushout:   { label: "Pushed out",  sev: 2, desc: "Schedule moved later — parts now sit early.",   group: "reschedule" },
  added:     { label: "Added",       sev: 3, desc: "New order not in the prior snapshot — new demand.", group: "added" },
  canceled: { label: "Canceled",   sev: 3, desc: "Future order vanished from the window — deferred or canceled.", group: "canceled" },
  qty:       { label: "Qty revised", sev: 2, desc: "Total order quantity changed.", group: "qty" },
  renumber:  { label: "Renumbered",  sev: 1, desc: "Same logical order, new planned-order number (MRP regen).", group: "cosmetic" },
  line:      { label: "Line moved",  sev: 1, desc: "Reassigned to a different production line.", group: "cosmetic" },
  version:   { label: "Version chg", sev: 1, desc: "Production version changed.", group: "cosmetic" },
};
const GROUP_LABEL = { reschedule: "Reschedule", added: "Added", canceled: "Canceled", qty: "Qty revised", cosmetic: "Cosmetic" };
const LINES = ["NP-LINE-1", "NP-LINE-2"];
const SCOPES = ["ALL", ...LINES];

/* ---- date utils (UTC, week-bucketed off a fixed Monday epoch) ---- */
const EPOCH = Date.UTC(2026, 3, 27);
const DAY = 86400000;
function dms(s) { const [y, m, dd] = s.split("-").map(Number); return Date.UTC(y, m - 1, dd); }
function weekIndex(s) { return Math.floor((dms(s) - EPOCH) / (7 * DAY)); }
function daysBetween(a, b) { return Math.round((dms(b) - dms(a)) / DAY); }
function addDays(s, n) {
  const t = new Date(dms(s) + n * DAY);
  const p = (x) => String(x).padStart(2, "0");
  return `${t.getUTCFullYear()}-${p(t.getUTCMonth() + 1)}-${p(t.getUTCDate())}`;
}
function weekLabel(w) { return "W" + w; }
const FLEX_RE = /flex/i;
const CTX = { renumberWindowDays: 5 };

function normalize(o) {
  return {
    po: String(o.po), material: String(o.material), line: o.line, platform: o.platform,
    pvCode: String(o.pvCode), pvText: o.pvText, isFlex: FLEX_RE.test(o.pvText),
    schedDate: o.schedDate, week: weekIndex(o.schedDate),
    totalQty: o.totalQty, openQty: o.openQty == null ? o.totalQty : o.openQty,
    orderType: o.orderType || "", seq: o.seq,
  };
}

/* ============================================================================
   === ENGINE ===  (verbatim from validated engine.mjs; context threaded, pure)
   ========================================================================== */
function matchPair(prev, next, anchorWeek, ctx) {
  const p = prev.filter((o) => o.week >= anchorWeek);
  const n = next.filter((o) => o.week >= anchorWeek);
  const byNext = new Map(n.map((o) => [o.po, o]));
  const byPrev = new Map(p.map((o) => [o.po, o]));
  const matched = [];
  const dropLeft = [];
  for (const o of p) { if (byNext.has(o.po)) matched.push([o, byNext.get(o.po)]); else dropLeft.push(o); }
  const addLeft = n.filter((o) => !byPrev.has(o.po));
  const renumbered = [];
  const usedAdd = new Set();
  for (const od of dropLeft) {
    let found = -1;
    for (let i = 0; i < addLeft.length; i++) {
      if (usedAdd.has(i)) continue;
      const oa = addLeft[i];
      if (oa.material === od.material && oa.line === od.line && oa.totalQty === od.totalQty &&
          Math.abs(daysBetween(od.schedDate, oa.schedDate)) <= ctx.renumberWindowDays) { found = i; break; }
    }
    if (found >= 0) { usedAdd.add(found); renumbered.push([od, addLeft[found]]); }
  }
  const renumDrops = new Set(renumbered.map((r) => r[0].po));
  const canceled = dropLeft.filter((o) => !renumDrops.has(o.po));
  const added = addLeft.filter((_, i) => !usedAdd.has(i));
  return { matched, renumbered, canceled, added, windowedNext: n };
}
function classify(a, b) {
  if (a.orderType === "" && b.orderType === "FIRMED") return { type: "converted", lifecycle: true };
  let type = null;
  if (a.week !== b.week) type = b.week < a.week ? "pullin" : "pushout";
  else if (a.totalQty !== b.totalQty) type = "qty";
  else if (a.line !== b.line) type = "line";
  else if (a.pvText !== b.pvText || a.pvCode !== b.pvCode) type = "version";
  else return { type: "none" };
  const seqChanged = a.seq !== b.seq;
  const attribution = seqChanged ? "manual" : "system";
  return { type, attribution };
}
function unitsOf(type, a, b) {
  if (type === "qty") return Math.abs((b.totalQty || 0) - (a.totalQty || 0));
  if (type === "renumber") return 0;
  if (type === "added") return b.totalQty || 0;
  if (type === "canceled") return a.totalQty || 0;
  return a.totalQty || 0;
}
function reasonOf(type, a, b) {
  switch (type) {
    case "pullin":    return `Scheduled week moved earlier (${weekLabel(a.week)}->${weekLabel(b.week)}) — ${a.totalQty} units now needed sooner.`;
    case "pushout":   return `Scheduled week moved later (${weekLabel(a.week)}->${weekLabel(b.week)}) — ${a.totalQty} units now sit early.`;
    case "qty":       return `Total order quantity revised ${a.totalQty}->${b.totalQty} (${b.totalQty - a.totalQty >= 0 ? "+" : ""}${b.totalQty - a.totalQty}).`;
    case "line":      return `Reassigned ${a.line}->${b.line} (${a.totalQty} units move lines).`;
    case "version":   return `Production version changed "${a.pvText}"->"${b.pvText}".`;
    case "renumber":  return `Same order re-keyed ${a.po}->${b.po} (same material, line, qty within ${CTX.renumberWindowDays} days) — MRP regen, not real churn.`;
    case "added":     return `New planned order, not in the prior snapshot — ${b.totalQty} units of new demand at ${weekLabel(b.week)}.`;
    case "canceled": return `In-window order disappeared — ${a.totalQty} units at ${weekLabel(a.week)} deferred or canceled.`;
    default:          return "";
  }
}
function diffPair(prev, next, snapDateNext, ctx) {
  const anchorWeek = weekIndex(snapDateNext);
  const { matched, renumbered, canceled, added, windowedNext } = matchPair(prev, next, anchorWeek, ctx);
  const changes = [];
  const converted = [];
  let rid = 0;
  const rec = (o, type, attribution, a, b) => ({
    id: `${type}:${o.po}:${o.material}:${o.line}:${o.week}:${rid++}`,
    po: o.po, material: o.material, line: o.line, platform: o.platform,
    isFlex: o.isFlex, week: o.week, schedDate: o.schedDate,
    type, sev: TYPES[type].sev, group: TYPES[type].group,
    units: unitsOf(type, a, b), attribution, reason: reasonOf(type, a, b),
    pvCode: o.pvCode, pvText: o.pvText, totalQty: o.totalQty,
  });
  for (const [a, b] of matched) {
    const c = classify(a, b);
    if (c.type === "converted") { converted.push({ po: b.po, material: b.material, line: b.line, week: b.week }); continue; }
    if (c.type === "none") continue;
    changes.push(rec(b, c.type, c.attribution, a, b));
  }
  for (const [a, b] of renumbered) changes.push(rec(b, "renumber", "system", a, b));
  for (const o of added) changes.push(rec(o, "added", "ambiguous", o, o));
  for (const o of canceled) changes.push(rec(o, "canceled", "ambiguous", o, o));
  return { changes, converted, windowedNext };
}
function buildMatrix(changes) {
  const cells = new Map();
  for (const c of changes) {
    const k = `${c.material}|${c.week}`;
    if (!cells.has(k)) cells.set(k, { material: c.material, week: c.week, count: 0, units: 0, sevSum: 0, rows: [] });
    const cell = cells.get(k);
    cell.count += 1; cell.units += c.units; cell.sevSum += c.sev; cell.rows.push(c);
  }
  return cells;
}
function aggregate(changes, windowedNext, scope) {
  const filt = scope === "ALL" ? changes : changes.filter((c) => c.line === scope);
  const denom = scope === "ALL" ? windowedNext.length : windowedNext.filter((o) => o.line === scope).length;
  const byType = {};
  for (const t of Object.keys(TYPES)) byType[t] = { count: 0, units: 0 };
  let count = 0, units = 0, manual = 0, system = 0, near = 0;
  for (const c of filt) {
    byType[c.type].count += 1; byType[c.type].units += c.units;
    count += 1; units += c.units;
    if (c.sev === 1) near += 1;
    if (c.attribution === "manual") manual += 1;
    else if (c.attribution === "system") system += 1;
  }
  const attributable = manual + system;
  const reschedule = byType.pullin.count + byType.pushout.count;
  return {
    scope, count, units, near, reschedule, denom,
    pctDisturbed: denom ? count / denom : 0,
    manualShare: attributable ? manual / attributable : 0,
    byType, manual, system,
  };
}
function runTrend(snapshots, scopes, ctx) {
  const points = [];
  for (let i = 1; i < snapshots.length; i++) {
    const prev = snapshots[i - 1], next = snapshots[i];
    const { changes, converted, windowedNext } = diffPair(prev.orders, next.orders, next.date, ctx);
    const scoped = {};
    for (const s of scopes) scoped[s] = aggregate(changes, windowedNext, s);
    points.push({ from: prev.date, to: next.date, label: next.date.slice(5), changes, converted, windowedNextCount: windowedNext.length, scoped });
  }
  return points;
}
/* ============================================================================
   === END ENGINE ===
   ========================================================================== */

/* ---- synthetic snapshot generator (demo data; real tool ingests saved exports) ---- */
const PV = {
  A2: { code: "201", text: "STD A / Line 2" },
  A1H: { code: "101", text: "FLEX A / Line 1" },
  B1: { code: "101", text: "STD B / Line 1" },
};
function baseOrder(po, material, platform, line, pv, week, qty, opts = {}) {
  return {
    po, material, platform, line, pvCode: pv.code, pvText: pv.text,
    schedDate: addDays("2026-05-04", week * 7 + 1),
    totalQty: qty, openQty: opts.openQty == null ? qty : opts.openQty,
    orderType: opts.orderType || "", seq: opts.seq == null ? po % 1000 : opts.seq,
  };
}
function buildBase() {
  return [
    baseOrder(10001, "NM-A-1001", "A", "NP-LINE-2", PV.A2, 2, 480),
    baseOrder(10002, "NM-A-1002", "A", "NP-LINE-2", PV.A2, 3, 360),
    baseOrder(10003, "NM-A-1003", "A", "NP-LINE-2", PV.A2, 2, 600),
    baseOrder(10004, "NM-A-1004", "A", "NP-LINE-2", PV.A2, 3, 540),
    baseOrder(10005, "NM-A-1005", "A", "NP-LINE-2", PV.A2, 4, 420),
    baseOrder(10006, "NM-A-1001", "A", "NP-LINE-2", PV.A2, 5, 480),
    baseOrder(10007, "NM-A-1002", "A", "NP-LINE-2", PV.A2, 6, 360),
    baseOrder(10008, "NM-A-1003", "A", "NP-LINE-2", PV.A2, 7, 600),
    baseOrder(10009, "NM-A-1004", "A", "NP-LINE-2", PV.A2, 8, 540),
    baseOrder(10010, "NM-A-1005", "A", "NP-LINE-2", PV.A2, 9, 420),
    baseOrder(10011, "NM-A-1001", "A", "NP-LINE-2", PV.A2, -1, 300, { openQty: 120 }),
    baseOrder(10012, "NM-A-1002", "A", "NP-LINE-2", PV.A2, -1, 300, { openQty: 90 }),
    baseOrder(20001, "NM-B-2001", "B", "NP-LINE-1", PV.B1, 2, 720),
    baseOrder(20002, "NM-B-2002", "B", "NP-LINE-1", PV.B1, 3, 540),
    baseOrder(20003, "NM-B-2003", "B", "NP-LINE-1", PV.B1, 2, 660),
    baseOrder(20004, "NM-B-2004", "B", "NP-LINE-1", PV.B1, 4, 600),
    baseOrder(20005, "NM-B-2005", "B", "NP-LINE-1", PV.B1, 5, 480),
    baseOrder(20006, "NM-B-2001", "B", "NP-LINE-1", PV.B1, 6, 720),
    baseOrder(20007, "NM-B-2002", "B", "NP-LINE-1", PV.B1, 7, 540),
    baseOrder(20008, "NM-B-2003", "B", "NP-LINE-1", PV.B1, 8, 660),
    baseOrder(20009, "NM-B-2004", "B", "NP-LINE-1", PV.B1, -1, 360, { openQty: 150 }),
    baseOrder(20010, "NM-B-2005", "B", "NP-LINE-1", PV.B1, -1, 360, { openQty: 110 }),
    baseOrder(30001, "NM-A-1004", "A", "NP-LINE-1", PV.A1H, 2, 240),
    baseOrder(30002, "NM-A-1001", "A", "NP-LINE-1", PV.A1H, 3, 180),
    baseOrder(30003, "NM-A-1004", "A", "NP-LINE-1", PV.A1H, 6, 240),
  ].map(normalize);
}
function applyOps(prev, ops) {
  let next = prev.map((o) => ({ ...o }));
  const byPo = new Map(next.map((o) => [Number(o.po), o]));
  for (const op of ops) {
    if (op.op === "move") { const o = byPo.get(op.po); if (o) { o.schedDate = addDays(o.schedDate, op.days); o.week = weekIndex(o.schedDate); if (op.reseq) o.seq = o.seq + 50; } }
    else if (op.op === "qty") { const o = byPo.get(op.po); if (o) { o.totalQty = op.qty; o.openQty = op.qty; } }
    else if (op.op === "line") { const o = byPo.get(op.po); if (o) { o.line = op.line; if (op.pv) { o.pvCode = op.pv.code; o.pvText = op.pv.text; o.isFlex = FLEX_RE.test(op.pv.text); o.platform = op.platform || o.platform; } } }
    else if (op.op === "version") { const o = byPo.get(op.po); if (o) { o.pvText = op.text; o.isFlex = FLEX_RE.test(op.text); } }
    else if (op.op === "convert") { const o = byPo.get(op.po); if (o) o.orderType = "FIRMED"; }
    else if (op.op === "cancel") { next = next.filter((o) => Number(o.po) !== op.po); byPo.delete(op.po); }
    else if (op.op === "renumber") { const o = byPo.get(op.po); if (o) { o.po = String(op.newPo); byPo.delete(op.po); byPo.set(op.newPo, o); } }
    else if (op.op === "add") { const no = normalize(op.order); next.push(no); byPo.set(Number(no.po), no); }
  }
  return next;
}
function buildSnapshots() {
  const s0 = buildBase();
  const s1 = applyOps(s0, [
    { op: "move", po: 10004, days: -7, reseq: true }, { op: "move", po: 20002, days: 14 },
    { op: "qty", po: 20004, qty: 780 },
    { op: "add", order: baseOrder(10020, "NM-A-1005", "A", "NP-LINE-2", PV.A2, 5, 480) },
    { op: "cancel", po: 20005 }, { op: "convert", po: 10003 },
    { op: "renumber", po: 30002, newPo: 30050 },
    { op: "version", po: 30003, text: "FLEX A / Line 1 (rev B)" },
    { op: "line", po: 10009, line: "NP-LINE-1", pv: PV.A1H },
    { op: "cancel", po: 10011 }, { op: "cancel", po: 20009 },
  ]);
  const s2 = applyOps(s1, [
    { op: "move", po: 20006, days: -14, reseq: true }, { op: "move", po: 10005, days: 14 },
    { op: "qty", po: 10001, qty: 600 },
    { op: "add", order: baseOrder(20020, "NM-B-2002", "B", "NP-LINE-1", PV.B1, 7, 540) },
    { op: "cancel", po: 10007 }, { op: "convert", po: 10004 },
    { op: "version", po: 20004, text: "STD B / Line 1 (alt)" },
    { op: "renumber", po: 20008, newPo: 20080 },
    { op: "cancel", po: 10012 }, { op: "cancel", po: 20010 },
  ]);
  const s3 = applyOps(s2, [
    { op: "move", po: 10008, days: -14, reseq: true }, { op: "move", po: 30003, days: 14 },
    { op: "qty", po: 20007, qty: 420 },
    { op: "add", order: baseOrder(30060, "NM-A-1001", "A", "NP-LINE-1", PV.A1H, 5, 180) },
    { op: "cancel", po: 10006 }, { op: "convert", po: 20004 },
    { op: "line", po: 10010, line: "NP-LINE-1", pv: PV.A1H },
  ]);
  const s4 = applyOps(s3, [
    { op: "move", po: 10009, days: -14, reseq: true }, { op: "move", po: 20006, days: 14 },
    { op: "qty", po: 10005, qty: 480 }, { op: "version", po: 10005, text: "STD A / Line 2 (rev)" },
    { op: "add", order: baseOrder(10040, "NM-A-1002", "A", "NP-LINE-2", PV.A2, 8, 360) },
    { op: "cancel", po: 20020 },
  ]);
  return [
    { date: "2026-05-01", orders: s0 }, { date: "2026-05-08", orders: s1 },
    { date: "2026-05-15", orders: s2 }, { date: "2026-05-22", orders: s3 },
    { date: "2026-05-29", orders: s4 },
  ];
}
function snapComposition(orders) {
  let a = 0, b = 0, h = 0;
  for (const o of orders) { if (o.isFlex) h += 1; else if (o.platform === "A") a += 1; else b += 1; }
  return { a, b, h, total: orders.length };
}
function pastDueByLine(snapshot) {
  const anchor = weekIndex(snapshot.date);
  const out = {};
  for (const l of LINES) out[l] = { orders: 0, units: 0 };
  for (const o of snapshot.orders) {
    if (o.week < anchor && o.openQty > 0) { out[o.line].orders += 1; out[o.line].units += o.openQty; }
  }
  return out;
}

/* ============================================================================
   THE HOUSE FRAME (D120, 2026-09-24). Everything below is the screen:
   HouseFrame from ../kit/house.jsx, the northpoint palette, the house formats,
   writeWorkbook() with its About sheet. The engine and the sample above are
   unchanged.
   ========================================================================== */
const SLUG = "production-plan-churn";
const NAME = "Production Plan Churn";
const SCOPE = "Reads saved production-plan snapshots in your browser. Never connects to SAP.";
const COMPANY = NORTHPOINT.company;

/* THE NORTHPOINT PALETTE, "demand & planning" band. Every value a var()
   reference; the house frame's root carries the values for the mode in force. */
const T = northpointTokens(SLUG);

/* A CHANGE'S DOT IS ITS SEVERITY, the engine's own `sev`: the three swings that
   hit the supply base hardest, the two that move a date or a quantity, and the
   three cosmetic edits. Severity is a judgment of how bad a change is, so the
   status ramp carries it. */
const SEV_TONE = { 3: "orange", 2: "warn", 1: "quiet" };
const SEV_LABEL = { 3: "High impact", 2: "Medium", 1: "Cosmetic" };
const TYPE_ORDER = ["pullin", "pushout", "added", "canceled", "qty", "renumber", "line", "version"];

/* A CATEGORY IN A CHART TAKES THE SERIES, never a status color. Until D120
   `canceled` was painted green here, which read "healthy" for demand that had
   vanished, and a line's platform mix borrowed the change colors. */
const GROUP_SERIES = { reschedule: "series1", added: "series2", canceled: "series3", qty: "series4", cosmetic: "series5" };
const MIX = [
  { k: "B native", field: "b", series: "series2" },
  { k: "A native", field: "a", series: "series1" },
  { k: "A via Flex", field: "h", series: "series4" },
];

/* THE HEATMAP RAMP, in brass. Three washes carry the page's own ink; the busiest
   quarter is the solid fill with the one ink every fill takes. A brass wash past
   about half strength drops light ink under 4.5:1 in dark mode, so the ramp
   stops washing there and fills. It was an off-palette blue until D120. */
const HEAT_STEPS = [
  { upTo: 0.25, style: { background: alpha(T.accentFill, 0.14), color: T.text }, label: "Up to a quarter of the busiest cell" },
  { upTo: 0.5, style: { background: alpha(T.accentFill, 0.28), color: T.text }, label: "Up to half" },
  { upTo: 0.75, style: { background: alpha(T.accentFill, 0.42), color: T.text }, label: "Up to three quarters" },
  { upTo: 1, style: { background: T.accentFill, color: T.accentInk }, label: "The busiest quarter" },
];
/* No step for a zero: a cell can hold changes and still move no units (a
   renumber disturbs none), so it stays unshaded but pressable. */
const heatStep = (val, max) => (val ? HEAT_STEPS.find((s) => val / max <= s.upTo + 1e-9) : null);

const nfmt = (n) => figure(n, { zeroMeans: "zero" });

/* The engine writes its reasons in ASCII: "->" for a move and a hyphen for a
   fall in quantity. The screen shows an arrow and the true minus; the export
   keeps the engine's words. */
const showReason = (s) => s.replace(/->/g, "→").replace(/(^|[\s([:])-(\d)/g, `$1${MINUS}$2`);

/* Weeks are counted from Monday 27 Apr 2026, week 0 (EPOCH above). */
const weekOf = (w) => dateShort(addDays("2026-04-27", 7 * w));

const GLOSSARY = {
  "Churn": "How much the production plan changed between two saved snapshots: the count of orders disturbed, or the units those disturbances move. High churn is a nervous plan that whipsaws purchasing and the lines.",
  "Snapshot": "One saved export of the full production plan at a point in time. The tool compares each consecutive pair to measure how the plan moved.",
  "Snapshot pair": "Two consecutive snapshots, such as 15 May and 22 May. All churn is measured per pair; the trend chart strings the pairs together.",
  "Planned order": "The planning-generated order number. It is the match key because it stays with an order through its whole life, even after it firms into a production order.",
  "MRP regen": "A planning run that regenerates orders. It can re-key an order (new planned-order number, same demand); the tool detects that and labels it renumbered, not real churn.",
  "Renumbered": `Same material, line and quantity within ${CTX.renumberWindowDays} days under a new planned-order number: an MRP regen artifact. Counted as cosmetic, so a regen does not pass for instability.`,
  "Window anchor": "Each pair is windowed to the later snapshot's date. Orders scheduled before that date that simply fell off, because time passed, are roll-off and are excluded.",
  "Roll-off": "An order that left the plan only because time passed. Excluded from cancellations.",
  "Conversion": "A planned order firming into a production order. Normal progression, and deliberately excluded from churn.",
  "Total order quantity": "The full order quantity, not the open quantity. Churn is measured on the total so routine burndown of open quantity is never mistaken for a quantity change.",
  "Production version": "The routing a material is built under. The same material can run under different versions on different lines.",
  "Flex": "A capability on Line 1 that lets it run Platform A materials, normally Line 2's, through a Flex production version. Detected on the version text, never the numeric code, because codes overlap.",
  "Platform": "The product family a material belongs to. Platform A runs natively on Line 2, Platform B on Line 1, and Line 1 also absorbs Platform A through Flex.",
  "%-disturbed": "The share of a scope's in-window orders disturbed in this pair. Each line is computed against its own order count, so line figures are ratios, not a split of the plant figure.",
  "Manual vs MRP": "Whether a change looks planner-driven (the order kept its number but was re-sequenced, a hand move) or system-driven (a clean regen). Read from the sequence field.",
  "Near-churn": "Cosmetic, low-severity edits: renumbers, line moves, version changes. Real edits, but not the demand and timing swings that stress the supply base.",
  "Basis": "Whether every figure counts order-lines (how many orders moved) or units (how many pieces those moves disturb).",
  "Week": "Weeks are counted from Monday 27 Apr 2026, which is week 0. W5 is the week of 1 Jun.",
};

/* ============================================================================
   THE INSTRUCTION MANUAL (tool-conventions § N), built from TYPES, GROUP_LABEL,
   CTX and GLOSSARY, so a rule change reaches it on its own.
   ========================================================================== */
export const MANUAL = {
  tool: NAME,
  purpose: "Measures how much the production plan moved between saved snapshots, where it moved, and whether a planner or the planning run moved it.",
  sections: [
    {
      id: "start", title: "What it is for, and what to do first",
      blocks: [
        { p: "A plan that moves every week whipsaws purchasing and the lines. This tool compares consecutive saved plans and counts every order that was pulled in, pushed out, added, canceled or re-quantified, so a nervous plan shows up as a number rather than a feeling." },
        { list: [
          { lead: "Pick a snapshot pair.", text: "The newest pair is chosen on open; every figure below it recomputes for the pair you pick." },
          { lead: "Read the answer cards.", text: "Total churn and the share of orders disturbed say how nervous the plan was; the manual share says who moved it." },
          { lead: "Read the trend and the week strip.", text: "The trend shows whether churn is growing across pairs; the strip shows which scheduled weeks took it." },
          { lead: "Press a heatmap cell.", text: "The detail grid below shows only that material in that week." },
          { lead: "Open a detail row.", text: "It gives the full reason, the version and the scheduled date." },
          { lead: "Switch the basis or the scope.", text: "Units weigh a change by its size; order-lines count it once. A line scope recomputes everything for that line." },
        ] },
      ],
    },
    {
      id: "numbers", title: "What the numbers mean",
      blocks: [
        { table: { head: ["Figure", "What it is"], rows: [
          ["Total churn", "Every disturbed order in the pair, counted in the basis chosen."],
          ["Orders disturbed", "Disturbed orders over the in-window orders of the later snapshot."],
          ["Reschedule", "Orders whose scheduled week moved, in or out."],
          ["Added / canceled", "New orders, then in-window orders that vanished."],
          ["Manual share", "Planner-driven changes over every change the tool can attribute."],
          ["Near-churn", "Cosmetic edits: renumbers, line moves and version changes."],
          ["Past-due open", "Open quantity on orders scheduled before the latest snapshot's week, per line."],
        ] } },
      ],
    },
    {
      id: "flags", title: "Every change type, and what it means",
      blocks: [
        { table: { head: ["Change", "Severity", "What it means"], rows: TYPE_ORDER.map((t) => [TYPES[t].label, SEV_LABEL[TYPES[t].sev], TYPES[t].desc]) } },
        { p: "Each disturbed order gets exactly one label, checked in this order: a date move that crosses a week boundary, then quantity, then line, then version." },
      ],
    },
    {
      id: "derived", title: "How to read the derived columns",
      blocks: [
        { p: GLOSSARY["Manual vs MRP"] + " Added and canceled orders are left unattributed, because one field cannot prove intent.", lead: "Attribution." },
        { p: GLOSSARY["Renumbered"], lead: "Renumbered." },
        { p: GLOSSARY["Window anchor"], lead: "The window." },
        { p: GLOSSARY["Total order quantity"], lead: "Units." },
        { p: GLOSSARY["Week"], lead: "Weeks." },
      ],
    },
    {
      id: "data", title: "How the data is handled",
      blocks: [
        { p: `This copy runs entirely in your browser. On open it builds five saved plan snapshots for ${COMPANY}, an invented manufacturer, from a fixed script dated May 2026, so every visitor sees the same figures.` },
        { p: "Nothing you choose is stored or sent anywhere. The exports are written in your browser." },
      ],
    },
    {
      id: "thresholds", title: "Every threshold",
      blocks: [
        { table: { head: ["Threshold", "Value", "What it does"], rows: [
          ["Renumber window", `${CTX.renumberWindowDays} days`, "A dropped and an added order this close, same material, line and quantity, are one order re-keyed."],
          ["Date move", "a week boundary", "A move inside the same week is not churn."],
          ["Near-churn", `severity ${TYPES.renumber.sev}`, "The three cosmetic types."],
          ["Heatmap steps", "quarters of the busiest cell", "Each cell's shade is its share of the busiest cell in view."],
        ] } },
        { p: "Set for this demo. A delivered copy takes the plant's own rules." },
      ],
    },
    {
      id: "limits", title: "What it cannot tell you",
      blocks: [
        { list: [
          "Why an order was added or canceled. It says what moved, not the intent.",
          "Whether a move was right. A pull-in may be the plan catching up with real demand.",
          "What a change costs. Units weigh a change by size, not by value.",
          "Anything between two snapshots. An order that moved twice between saves shows as one move.",
          "A plant-wide share from the line figures. Line percentages are ratios against their own lines and do not add up to the plant's.",
        ] },
      ],
    },
  ],
};

/* ============================================================================
   THE CHARTS. Recharts takes a color as an SVG attribute, which cannot resolve
   var(), so these read the resolved values for the mode in force.
   ========================================================================== */
function ChurnCharts({ trendData, weekStrip, unitWord, scopeWord, groupKeys }) {
  const { hex } = useNorthpoint();
  const tick = { fontSize: 11, fill: hex.textSec };
  const tip = {
    contentStyle: { background: hex.surfaceAlt, border: `1px solid ${hex.control}`, borderRadius: 4, fontSize: 12, color: hex.text },
    itemStyle: { color: hex.text }, labelStyle: { color: hex.text }, cursor: { fill: hex.border },
  };
  const legend = [
    ...groupKeys.map((g) => ({ label: GROUP_LABEL[g], swatch: T[GROUP_SERIES[g]] })),
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(420px, 100%), 1fr))", gap: 8, margin: "0 var(--np-pad)" }}>
      <section className="np-panel" style={{ margin: "8px 0 0" }}>
        <div className="np-panel-head">Churn across the snapshots <span className="np-muted">· stacked by category · {unitWord} · {scopeWord}</span></div>
        <div className="np-panel-body">
          <div style={{ height: 230 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trendData} margin={{ top: 8, right: 8, bottom: 4, left: -8 }}>
                <CartesianGrid stroke={hex.border} vertical={false} />
                <XAxis dataKey="label" tick={tick} stroke={hex.control} />
                <YAxis tick={tick} stroke={hex.control} />
                <RTooltip {...tip} />
                {groupKeys.map((g) => <Bar key={g} dataKey={g} name={GROUP_LABEL[g]} stackId="c" fill={hex[GROUP_SERIES[g]]} />)}
                <Line type="monotone" dataKey="churn" name="Total churn" stroke={hex.text} strokeWidth={2} dot={{ r: 3, fill: hex.text }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
        <Legend items={[...legend, { label: "Total churn (the line)", swatch: T.text }]} />
      </section>
      <section className="np-panel" style={{ margin: "8px 0 0" }}>
        <div className="np-panel-head">Disruption by scheduled week <Help label="Week" text={GLOSSARY.Week} /> <span className="np-muted">· chosen pair · {unitWord}</span></div>
        <div className="np-panel-body">
          <div style={{ height: 230 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={weekStrip} margin={{ top: 8, right: 8, bottom: 4, left: -8 }}>
                <CartesianGrid stroke={hex.border} vertical={false} />
                <XAxis dataKey="week" tick={tick} stroke={hex.control} />
                <YAxis tick={tick} stroke={hex.control} />
                <RTooltip {...tip} />
                {groupKeys.map((g) => <Bar key={g} dataKey={g} name={GROUP_LABEL[g]} stackId="w" fill={hex[GROUP_SERIES[g]]} />)}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
        <Legend items={legend} />
      </section>
    </div>
  );
}

function Churn() {
  const [basis, setBasis] = useState("units"); // units by default; order-lines is the switch-to view
  const [scope, setScope] = useState("ALL");

  const snapshots = useMemo(() => buildSnapshots(), []);
  const trend = useMemo(() => runTrend(snapshots, SCOPES, CTX), [snapshots]);
  const [pairIdx, setPairIdx] = useState(trend.length - 1);
  const pt = trend[pairIdx];
  const sc = pt.scoped[scope];
  const first = snapshots[0].date;
  const last = snapshots[snapshots.length - 1].date;

  const metric = (obj) => (basis === "units" ? obj.units : obj.count);
  const unitWord = basis === "units" ? "units" : "order-lines";
  const scopeWord = scope === "ALL" ? "all lines" : scope;
  const groupKeys = Object.keys(GROUP_LABEL);

  const [typeFilter, setTypeFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [cell, setCell] = useState(null);       // { material, week } from the heatmap
  const [expanded, setExpanded] = useState(null);
  const tableRef = useRef(null);
  const heatRef = useRef(null);
  const detailRef = useRef(null);

  const scopedChanges = useMemo(
    () => (scope === "ALL" ? pt.changes : pt.changes.filter((c) => c.line === scope)),
    [pt, scope]
  );
  const detailRows = useMemo(() => {
    let rows = scopedChanges.slice();
    if (typeFilter !== "ALL") rows = rows.filter((r) => r.type === typeFilter);
    if (cell) rows = rows.filter((r) => r.material === cell.material && r.week === cell.week);
    const q = search.trim().toLowerCase();
    if (q) rows = rows.filter((r) =>
      r.material.toLowerCase().includes(q) || r.po.toLowerCase().includes(q) ||
      r.line.toLowerCase().includes(q) || TYPES[r.type].label.toLowerCase().includes(q));
    return rows.sort((a, b) => b.sev - a.sev || a.week - b.week || a.material.localeCompare(b.material));
  }, [scopedChanges, typeFilter, cell, search]);

  const matrix = useMemo(() => buildMatrix(scopedChanges), [scopedChanges]);
  const matWeeks = useMemo(() => [...new Set(scopedChanges.map((c) => c.week))].sort((a, b) => a - b), [scopedChanges]);
  const matMaterials = useMemo(() => [...new Set(scopedChanges.map((c) => c.material))].sort(), [scopedChanges]);
  const maxCell = useMemo(() => Math.max(1, ...[...matrix.values()].map((c) => (basis === "units" ? c.units : c.count))), [matrix, basis]);

  const trendData = useMemo(() => trend.map((p, i) => {
    const s = p.scoped[scope];
    const row = { label: dateShort(p.to), idx: i, churn: metric(s) };
    for (const g of groupKeys) row[g] = 0;
    for (const t of Object.keys(TYPES)) row[TYPES[t].group] += (basis === "units" ? s.byType[t].units : s.byType[t].count);
    return row;
  }), [trend, scope, basis]);

  const weekStrip = useMemo(() => matWeeks.map((w) => {
    const rows = scopedChanges.filter((c) => c.week === w);
    const o = { week: weekLabel(w) };
    for (const g of groupKeys) o[g] = 0;
    for (const r of rows) o[r.group] += (basis === "units" ? r.units : 1);
    return o;
  }), [matWeeks, scopedChanges, basis]);

  const linePanel = useMemo(() => {
    const latest = snapshots[snapshots.length - 1];
    const pastDue = pastDueByLine(latest);
    return LINES.map((l) => {
      const s = pt.scoped[l];
      const comp = snapComposition(latest.orders.filter((o) => o.line === l));
      return { line: l, churn: metric(s), pctDisturbed: s.pctDisturbed, inWin: s.denom, comp, pastDue: pastDue[l] };
    });
  }, [pt, snapshots, basis]);

  const sharedMaterials = useMemo(() => {
    const lastOrders = snapshots[snapshots.length - 1].orders;
    const m1 = new Set(lastOrders.filter((o) => o.line === "NP-LINE-1").map((o) => o.material));
    const m2 = new Set(lastOrders.filter((o) => o.line === "NP-LINE-2").map((o) => o.material));
    return [...m1].filter((m) => m2.has(m));
  }, [snapshots]);

  useLayoutEffect(() => { pinColumns(tableRef.current); pinColumns(heatRef.current); }, [detailRows, expanded, matMaterials]);

  const pickPair = (i) => { setPairIdx(i); setCell(null); setExpanded(null); };
  const pickScope = (s) => { setScope(s); setCell(null); setExpanded(null); };
  const pickCell = (material, week) => {
    const same = cell && cell.material === material && cell.week === week;
    setCell(same ? null : { material, week });
    setExpanded(null);
    if (!same && detailRef.current) detailRef.current.scrollIntoView({ block: "start" });
  };

  /* The filters in force, in words, for a filtered export's About sheet. */
  const shown = () => {
    const out = [];
    if (typeFilter !== "ALL") out.push(`Change: ${TYPES[typeFilter].label}`);
    if (cell) out.push(`Heatmap cell: ${cell.material} in ${weekLabel(cell.week)}`);
    if (search.trim()) out.push(`Search: "${search.trim()}"`);
    return out;
  };
  const exportWorkbook = async (full) => {
    const XLSX = await import("xlsx");
    const list = full ? scopedChanges : detailRows;
    const header = ["Planned Order", "Material", "Line", "Platform", "Prod Ver", "Prod Ver Text", "Flex", "Sched Week", "Change Type", "Severity", "Units Disturbed", "Attribution", "Reason", "Snapshot Pair"];
    const rows = [header, ...list.map((r) => [
      r.po, r.material, r.line, r.platform, r.pvCode, r.pvText, r.isFlex ? "Y" : "", weekLabel(r.week),
      TYPES[r.type].label, r.sev, r.units, r.attribution, r.reason, `${pt.from} to ${pt.to}`,
    ])];
    writeWorkbook(XLSX, {
      slug: SLUG, which: full ? "full" : "filtered", tool: NAME,
      what: full
        ? `Every disturbed order (${scopedChanges.length}) from ${houseDate(pt.from)} to ${houseDate(pt.to)}, ${scopeWord}, with its change, severity, units, attribution and reason.`
        : `The ${count(list.length, "disturbed order")} on screen when it was exported, from ${houseDate(pt.from)} to ${houseDate(pt.to)}, ${scopeWord}.`,
      source: `The ${COMPANY} sample: five plan snapshots from ${houseDate(first)} to ${houseDate(last)}, built in your browser`,
      shown: full ? [`Scope: ${scopeWord}`] : [`Scope: ${scopeWord}`, ...shown()],
      sheets: [{ name: full ? "Plan Churn" : "Filtered Churn", rows }],
    });
  };

  const typeCounts = useMemo(() => {
    const m = {};
    for (const r of scopedChanges) m[r.type] = (m[r.type] || 0) + 1;
    return m;
  }, [scopedChanges]);

  return (
    <>
      <div className="np-part">
        <div className="np-ident">
          <h2>{COMPANY} · production plan, saved weekly</h2>
          <p>Loaded <b>the synthetic sample</b>, built in your browser: {count(snapshots.length, "saved plan snapshot")} from <b>{houseDate(first)}</b> to <b>{houseDate(last)}</b>, {count(snapshots[0].orders.length, "order")} in the first. No real company data.</p>
        </div>
      </div>

      <div className="np-bar">
        <div className="np-row" role="group" aria-label="Snapshot pair">
          <span className="np-muted">Pair<Help label="Snapshot pair" text={GLOSSARY["Snapshot pair"]} /></span>
          {trend.map((p, i) => (
            <button key={i} type="button" className="np-chip" aria-pressed={i === pairIdx} onClick={() => pickPair(i)}>
              {dateShort(p.from)} → {dateShort(p.to)}
            </button>
          ))}
        </div>
        <div className="np-row" role="group" aria-label="Basis">
          <span className="np-muted">Count<Help label="Basis" text={GLOSSARY.Basis} /></span>
          {[["units", "Units"], ["lines", "Order-lines"]].map(([b, label]) => (
            <button key={b} type="button" className="np-chip" aria-pressed={basis === b} onClick={() => setBasis(b)}>{label}</button>
          ))}
        </div>
        <label>
          Scope
          <select className="np-in" value={scope} onChange={(e) => pickScope(e.target.value)} aria-label="Scope">
            <option value="ALL">All lines (plant)</option>
            {LINES.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </label>
      </div>

      <Intro>
        {count(snapshots.length, "saved plan snapshot")}, {houseDate(first)} to {houseDate(last)}, compared in {count(trend.length, "consecutive pair")}.
        From <b>{dateShort(pt.from)}</b> to <b>{houseDate(pt.to)}</b>{scope !== "ALL" && <> on <b>{scope}</b></>}, <b>{nfmt(sc.count)}</b> of {nfmt(sc.denom)} in-window orders were disturbed
        {" "}(<Term text={GLOSSARY["%-disturbed"]}>{percent(sc.pctDisturbed)}</Term>): {nfmt(sc.byType.pullin.count)} pulled in, {nfmt(sc.byType.pushout.count)} pushed out, {nfmt(sc.byType.added.count)} added and {nfmt(sc.byType.canceled.count)} canceled.
        {" "}Of the changes the tool can attribute, <b>{percent(sc.manualShare)}</b> look <Term text={GLOSSARY["Manual vs MRP"]}>planner-driven</Term>; {count(pt.converted.length, "order")} simply <Term text={GLOSSARY.Conversion}>converted</Term>, which is progress, not churn.
      </Intro>
      <HowItWorks points={[
        { lead: "Orders are matched on their planned-order number.", text: `It stays with an order through its whole life. A leftover drop and add with the same material, line and total quantity within ${CTX.renumberWindowDays} days is one order renumbered by an MRP regen, not real churn.` },
        { lead: "Each pair is windowed to the later snapshot's date.", text: "Orders that fell off only because time passed are roll-off and are excluded, so the plan moving forward is never counted as churn." },
        { lead: "Each disturbed order gets one label.", text: "A date move that crosses a week boundary comes first, then quantity, then line, then version. Quantity is measured on the total order quantity, never the open quantity, so burndown is not churn. Conversions are excluded." },
        { lead: "A re-sequenced order reads as a planner's move.", text: "An order that kept its number but changed sequence looks like a hand move; a clean regen reads as the system." },
        { lead: "The gaps are left honest.", text: "Added and canceled orders are left unattributed, because one field cannot prove intent. Line figures are ratios against each line's own orders, not a split of the plant figure." },
      ]} />

      <AnswerCards>
        <AnswerCard label={`Total churn (${unitWord})`} value={nfmt(metric(sc))} help={GLOSSARY.Churn}>
          {unitWord === "units" ? "Units" : "Order-lines"} disturbed from {dateShort(pt.from)} to {dateShort(pt.to)}{scope !== "ALL" ? ` on ${scope}` : ""}.
        </AnswerCard>
        <AnswerCard label="Orders disturbed" value={percent(sc.pctDisturbed)} help={GLOSSARY["%-disturbed"]}>
          {nfmt(sc.count)} of {count(sc.denom, "in-window order")} moved in this pair.
        </AnswerCard>
        <AnswerCard label="Reschedule" value={nfmt(basis === "units" ? sc.byType.pullin.units + sc.byType.pushout.units : sc.reschedule)}>
          {nfmt(sc.byType.pullin.count)} pulled in and {nfmt(sc.byType.pushout.count)} pushed out: the largest source of supplier whiplash.
        </AnswerCard>
        <AnswerCard label="Added / canceled" value={`${sc.byType.added.count} / ${sc.byType.canceled.count}`}>
          New demand, then orders that vanished: the hardest swings to absorb.
        </AnswerCard>
        <AnswerCard label="Manual share" value={percent(sc.manualShare)} help={GLOSSARY["Manual vs MRP"]}>
          Of the changes the tool can attribute, the share a planner made by hand.
        </AnswerCard>
        <AnswerCard label="Near-churn" value={nfmt(sc.near)} help={GLOSSARY["Near-churn"]}>
          Cosmetic edits: renumbers, line moves and version changes.
        </AnswerCard>
      </AnswerCards>

      <ChurnCharts trendData={trendData} weekStrip={weekStrip} unitWord={unitWord} scopeWord={scopeWord} groupKeys={groupKeys} />

      <section className="np-panel">
        <div className="np-panel-head">Lines and platforms <span className="np-muted">· each line on its own base · platform mix in the latest snapshot</span></div>
        <div className="np-panel-body">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))", gap: 8 }}>
            {linePanel.map((lp) => {
              const ct = lp.comp.total || 1;
              const seg = MIX.map((m) => ({ ...m, v: lp.comp[m.field] })).filter((s) => s.v > 0);
              return (
                <div key={lp.line} data-line={lp.line} style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: "10px 12px" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                    <span className="np-num" style={{ fontWeight: 600, color: T.text }}>{lp.line}</span>
                    <span className="np-muted" style={{ marginLeft: "auto" }}>{count(lp.inWin, "in-window order")}</span>
                  </div>
                  <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginBottom: 10 }}>
                    {[
                      [`Churn (${unitWord})`, nfmt(lp.churn), T.text, GLOSSARY.Churn],
                      ["Disturbed", percent(lp.pctDisturbed), T.text, GLOSSARY["%-disturbed"]],
                      ["Past-due open", nfmt(lp.pastDue.units), lp.pastDue.units > 0 ? T.warn : T.textMuted, "Open quantity on orders scheduled before the latest snapshot's week."],
                    ].map(([lab, val, color, help]) => (
                      <div key={lab}>
                        <div style={{ fontSize: 11, letterSpacing: ".07em", textTransform: "uppercase", fontWeight: 600, color: T.textMuted }}>{lab}<Help label={lab} text={help} /></div>
                        <div className="np-num" data-fig="" style={{ fontSize: 18, fontWeight: 600, color }}>{val}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", height: 9, borderRadius: 2, overflow: "hidden", marginBottom: 6 }}>
                    {seg.map((s) => <div key={s.k} title={`${s.k}: ${s.v}`} style={{ width: `${(s.v / ct) * 100}%`, background: T[s.series] }} />)}
                  </div>
                  <div className="np-row" style={{ gap: "4px 12px", fontSize: 12, color: T.textMuted }}>
                    {seg.map((s) => (
                      <span key={s.k} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                        <i style={{ display: "inline-block", width: 9, height: 9, borderRadius: 2, background: T[s.series] }} />
                        {s.k} <span className="np-num">{s.v}</span>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="np-muted" style={{ marginTop: 10, lineHeight: 1.55 }}>
            <b style={{ color: T.textSec, fontWeight: 600 }}>Why the lines do not add up to the plant figure.</b> Each line's share is a ratio against its own orders, not a split of the plant's.{" "}
            {sharedMaterials.length > 0 && <>Material <span className="np-num">{sharedMaterials[0]}</span> runs on both lines (Line 2 natively, Line 1 through <Term text={GLOSSARY.Flex}>Flex</Term>), so it counts on each line it touches. </>}
            Churn counts are tagged by line and do add up; the shares do not.
          </p>
        </div>
      </section>

      <div className="np-gridwrap">
        <div className="np-gridhead">
          <span style={{ color: T.text, fontWeight: 600 }}>Material by scheduled week</span>
          <span>{unitWord} disturbed in the chosen pair · press a cell to show its orders below</span>
        </div>
        {matMaterials.length === 0 ? (
          <div className="np-empty">No disturbances in this scope and pair.</div>
        ) : (
          <div className="np-scroll" style={{ maxHeight: "min(52vh, 460px)" }}>
            <table className="np-grid" ref={heatRef} style={{ minWidth: 120 + 64 * matWeeks.length }}>
              <thead>
                <tr>
                  <th className="pin">Material</th>
                  {matWeeks.map((w) => <th key={w} className="c" title={`Week of ${weekOf(w)}`}>{weekLabel(w)}</th>)}
                </tr>
              </thead>
              <tbody>
                {matMaterials.map((mat) => (
                  <tr key={mat}>
                    <td className="pin"><span className="code">{mat}</span></td>
                    {matWeeks.map((w) => {
                      const c = matrix.get(`${mat}|${w}`);
                      const val = c ? (basis === "units" ? c.units : c.count) : 0;
                      const step = heatStep(val, maxCell);
                      const isSel = cell && cell.material === mat && cell.week === w;
                      if (!c) return <td key={w} className="c num" />;
                      return (
                        <td key={w} className="c num" role="button" tabIndex={0} aria-pressed={!!isSel}
                          title={`${mat}, ${weekLabel(w)} (week of ${weekOf(w)}): ${count(c.count, "change")}, ${nfmt(c.units)} units. Press to show these orders.`}
                          onClick={() => pickCell(mat, w)}
                          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pickCell(mat, w); } }}
                          style={{ ...(step ? step.style : null), cursor: "pointer", fontWeight: 600, outline: isSel ? `2px solid ${T.text}` : "none", outlineOffset: -2 }}>
                          {val ? nfmt(val) : ""}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Legend lead="Shade:" items={HEAT_STEPS.map((s) => ({ label: s.label, swatch: s.style.background }))} />
      </div>

      <div className="np-gridwrap" ref={detailRef} style={{ scrollMarginTop: 8 }}>
        <div className="np-gridhead">
          <div className="np-row" role="group" aria-label="Filter by change">
            <button type="button" className="np-chip" aria-pressed={typeFilter === "ALL"} onClick={() => setTypeFilter("ALL")}>All <span className="n">({scopedChanges.length})</span></button>
            {TYPE_ORDER.filter((t) => typeCounts[t]).map((t) => (
              <button key={t} type="button" className="np-chip" aria-pressed={typeFilter === t} title={TYPES[t].desc}
                onClick={() => setTypeFilter(typeFilter === t ? "ALL" : t)}>
                <Dot tone={SEV_TONE[TYPES[t].sev]} /> {TYPES[t].label} <span className="n">({typeCounts[t]})</span>
              </button>
            ))}
          </div>
          <span style={{ marginLeft: "auto" }} />
          <ExportPair fullCount={scopedChanges.length} filteredCount={detailRows.length} noun="orders"
            onFull={() => exportWorkbook(true)} onFiltered={() => exportWorkbook(false)} />
        </div>
        <div className="np-gridhead">
          <input className="np-in" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search material, order, line or change"
            aria-label="Search the disturbed orders" style={{ flex: "1 1 220px" }} />
          {cell && (
            <button type="button" className="np-chip" aria-pressed="true" onClick={() => setCell(null)} title="Show every week and material again">
              {cell.material} · {weekLabel(cell.week)} ✕
            </button>
          )}
          <span>Showing <span className="np-num">{detailRows.length}</span> of <span className="np-num">{scopedChanges.length}</span> disturbed orders</span>
        </div>
        <div className="np-scroll">
          <table className="np-grid" ref={tableRef} style={{ minWidth: 1080 }}>
            <thead>
              <tr>
                <th className="pin">Planned order<Help label="Planned order" text={GLOSSARY["Planned order"]} /></th>
                <th className="pin">Material</th>
                <th>Line</th>
                <th>Platform<Help label="Platform" text={GLOSSARY.Platform} /></th>
                <th>Prod ver<Help label="Production version" text={GLOSSARY["Production version"]} /></th>
                <th>Week<Help label="Week" text={GLOSSARY.Week} /></th>
                <th>Change<Help label="Change" text="The one primary label for this order's change." /></th>
                <th className="r">Units<Help label="Units" text="Units this change disturbs." /></th>
                <th>Attribution<Help label="Attribution" text={GLOSSARY["Manual vs MRP"]} /></th>
                <th>Why</th>
              </tr>
            </thead>
            <tbody>
              {detailRows.map((r) => {
                const isOpen = expanded === r.id;
                return (
                  <React.Fragment key={r.id}>
                    <tr className="is-row" aria-expanded={isOpen} onClick={() => setExpanded(isOpen ? null : r.id)}>
                      <td className="pin">
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <Dot tone={SEV_TONE[r.sev]} title={`${SEV_LABEL[r.sev]}: ${TYPES[r.type].label}`} />
                          <span className="code">{r.po}</span>
                        </span>
                      </td>
                      <td className="pin"><span className="code">{r.material}</span></td>
                      <td><span className="code" style={{ color: T.textSec }}>{r.line}</span></td>
                      <td>{r.isFlex ? <Hint text={GLOSSARY.Flex}><Pill tone="quiet">Flex</Pill></Hint> : r.platform}</td>
                      <td className="num">{r.pvCode}</td>
                      <td className="num" title={`Week of ${weekOf(r.week)}`}>{weekLabel(r.week)}</td>
                      <td style={{ whiteSpace: "nowrap" }}>{TYPES[r.type].label}</td>
                      <td className="r num">{nfmt(r.units)}</td>
                      <td>{r.attribution === "manual" ? <Pill tone="quiet">manual</Pill> : <span className="np-muted">{r.attribution}</span>}</td>
                      <td title={showReason(r.reason)} style={{ maxWidth: 340, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{showReason(r.reason)}</td>
                    </tr>
                    {isOpen && (
                      <tr className="detail">
                        <td colSpan={10}>
                          <div className="np-detail" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))", gap: 18, padding: "6px 4px 10px" }}>
                            <div>
                              <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", color: T.textMuted, marginBottom: 4 }}>{TYPES[r.type].label} · {SEV_LABEL[r.sev]}</p>
                              <p style={{ color: T.text, lineHeight: 1.55 }}>{showReason(r.reason)}</p>
                              <p className="np-muted" style={{ marginTop: 6 }}>{TYPES[r.type].desc}</p>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "3px 12px", fontSize: 13, alignContent: "start" }}>
                              <span className="np-muted">Production version</span><span style={{ color: T.text }}><span className="np-num">{r.pvCode}</span> · {r.pvText}</span>
                              <span className="np-muted">Scheduled</span><span style={{ color: T.text }}>{houseDate(r.schedDate)} ({weekLabel(r.week)})</span>
                              <span className="np-muted">Units disturbed</span><span className="np-num" style={{ color: T.text }}>{nfmt(r.units)}</span>
                              <span className="np-muted">Attribution</span><span style={{ color: T.text }}>{r.attribution === "ambiguous" ? "not attributed: one field cannot prove intent" : r.attribution === "manual" ? "planner, by hand" : "system, a clean regen"}</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {detailRows.length === 0 && (
                <tr className="detail"><td colSpan={10} className="np-empty">No disturbed orders match these filters. Clear a filter, the cell or the search.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Legend lead="Severity:" items={[3, 2, 1].map((s) => ({
          label: `${SEV_LABEL[s]} (${TYPE_ORDER.filter((t) => TYPES[t].sev === s).map((t) => TYPES[t].label.toLowerCase()).join(", ")})`,
          tone: SEV_TONE[s],
        }))} />
      </div>
    </>
  );
}

export default function ProductionPlanChurn() {
  return (
    <HouseFrame slug={SLUG} name={NAME} scope={SCOPE} manual={MANUAL}>
      <Churn />
    </HouseFrame>
  );
}
