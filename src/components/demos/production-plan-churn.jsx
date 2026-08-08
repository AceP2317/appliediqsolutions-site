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
   MANUFACTURING, self-loading synthetic data only, neutral theme (no corporate
   branding). No real company data, plant codes, transaction codes, or internal
   site/line topology appear anywhere in this file.

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

import React, { useState, useMemo, useCallback, createContext, useContext } from "react";
// xlsx is loaded lazily inside exportRows() so its ~480 KB chunk stays off the
// initial bundle (this island is embedded on the home page).
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip as RTooltip, Legend,
} from "recharts";
import { Layers, Sun, Moon, HelpCircle, Activity, X, FileSpreadsheet } from "lucide-react";

/* ============================================================================
   PALETTE — neutral light / dark, single restrained accent (NOT a brand color)
   ========================================================================== */
const THEMES = {
  dark: {
    bg: "#14161b", bg2: "#191c22", surface: "#20242c", surface2: "#272c35",
    hover: "#2e333d", border: "#333a45", borderSoft: "#252a32",
    text: "#e8eaef", textMute: "#9aa2af", textFaint: "#6b7280",
    accent: "#5b8def", accentSoft: "rgba(91,141,239,0.16)",
    teal: "#2bb3a3", amber: "#e0a33e", risk: "#e05d5d", grey: "#8a92a3",
    violet: "#9b8ac4", good: "#4caf82",
    tipBg: "#0e1014", tipBorder: "#3a4150",
  },
  light: {
    bg: "#f6f7f9", bg2: "#ffffff", surface: "#ffffff", surface2: "#f1f3f6",
    hover: "#eceff3", border: "#d9dee6", borderSoft: "#e7ebf0",
    text: "#1d2330", textMute: "#5b6573", textFaint: "#8b94a3",
    accent: "#3a6fd8", accentSoft: "rgba(58,111,216,0.12)",
    teal: "#1f9488", amber: "#c8861f", risk: "#cf4b4b", grey: "#7b8493",
    violet: "#7c6bb0", good: "#2e9466",
    tipBg: "#1d2330", tipBorder: "#39414f",
  },
};
const FONT = `"Inter","Segoe UI",system-ui,sans-serif`;
const MONO = `"IBM Plex Mono",ui-monospace,"SFMono-Regular",monospace`;

/* ============================================================================
   DOMAIN CLASSIFICATION  (single editable block — types, colors, topology)
   ========================================================================== */
const TYPES = {
  pullin:    { label: "Pulled in",   sev: 3, desc: "Schedule moved earlier — parts needed sooner.", group: "reschedule" },
  pushout:   { label: "Pushed out",  sev: 2, desc: "Schedule moved later — parts now sit early.",   group: "reschedule" },
  added:     { label: "Added",       sev: 3, desc: "New order not in the prior snapshot — new demand.", group: "added" },
  cancelled: { label: "Cancelled",   sev: 3, desc: "Future order vanished from the window — deferred or cancelled.", group: "cancelled" },
  qty:       { label: "Qty revised", sev: 2, desc: "Total order quantity changed.", group: "qty" },
  renumber:  { label: "Renumbered",  sev: 1, desc: "Same logical order, new planned-order number (MRP regen).", group: "cosmetic" },
  line:      { label: "Line moved",  sev: 1, desc: "Reassigned to a different production line.", group: "cosmetic" },
  version:   { label: "Version chg", sev: 1, desc: "Production version changed.", group: "cosmetic" },
};
const TYPE_COLOR = (T) => ({
  pullin: T.accent, pushout: "#7c93b3", added: T.risk, cancelled: T.teal,
  qty: T.amber, renumber: T.grey, line: T.violet, version: T.textFaint,
});
const GROUP_COLOR = (T) => ({ reschedule: T.grey, added: T.accent, cancelled: T.teal, qty: T.amber, cosmetic: "#5b6472" });
const GROUP_LABEL = { reschedule: "Reschedule", added: "Added", cancelled: "Cancelled", qty: "Qty revised", cosmetic: "Cosmetic" };
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
  const cancelled = dropLeft.filter((o) => !renumDrops.has(o.po));
  const added = addLeft.filter((_, i) => !usedAdd.has(i));
  return { matched, renumbered, cancelled, added, windowedNext: n };
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
  if (type === "cancelled") return a.totalQty || 0;
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
    case "cancelled": return `In-window order disappeared — ${a.totalQty} units at ${weekLabel(a.week)} deferred or cancelled.`;
    default:          return "";
  }
}
function diffPair(prev, next, snapDateNext, ctx) {
  const anchorWeek = weekIndex(snapDateNext);
  const { matched, renumbered, cancelled, added, windowedNext } = matchPair(prev, next, anchorWeek, ctx);
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
  for (const o of cancelled) changes.push(rec(o, "cancelled", "ambiguous", o, o));
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
   GLOSSARY + TOOLTIP SYSTEM
   ========================================================================== */
const GLOSSARY = {
  "Churn": "How much the production plan changed between two saved snapshots — the count of orders disturbed, or the units those disturbances move. High churn = a nervous plan that whipsaws purchasing and the lines.",
  "Snapshot": "One saved export of the full production plan at a point in time. The tool diffs each consecutive pair to measure how the plan moved.",
  "Snapshot pair": "Two consecutive snapshots (e.g. 05-15 -> 05-22). All churn is measured per pair; the trend chart strings the pairs together.",
  "Planned order": "The planning-generated order number. It is the primary match key because it stays with an order through its whole lifecycle, even after it firms into a production order.",
  "MRP regen": "A planning run that regenerates orders. It can legitimately re-key an order (new planned-order number, same demand) — the tool detects that and labels it 'renumbered', not real churn.",
  "Renumbered": "Same material, line, and quantity within a few days under a new planned-order number — an MRP regen artifact. Counted as cosmetic, not churn, so a regen does not masquerade as instability.",
  "Window anchor": "Each pair is windowed to the later snapshot's date. Orders scheduled before that date that simply fell off (the plan moved forward in time) are roll-off — excluded — so natural progression is never counted as churn.",
  "Roll-off": "An order that left the plan only because time passed (it was scheduled before the new snapshot's window). Excluded from cancellations.",
  "Conversion": "A planned order firming into a production order (order type blank -> FIRMED). Normal plan progression — a lifecycle event, deliberately excluded from churn.",
  "Total order quantity": "The full order quantity, not the open (remaining) quantity. Churn is measured on Total so routine burndown of open quantity is not mistaken for a quantity change — the 'burndown trap'.",
  "Production version": "The routing/recipe a SKU is built under. The same SKU can run under different versions on different lines.",
  "Flex": "A capability on Line 1 that lets it run Platform-A SKUs (normally Line 2's) via a Flex production version. Detected on the version TEXT (contains 'FLEX'), never the numeric code — codes overlap between Flex and native runs.",
  "Platform": "The product family a SKU belongs to. Platform A runs natively on Line 2; Platform B runs natively on Line 1; Line 1 also absorbs Platform A via Flex.",
  "%-disturbed": "Share of a scope's in-window orders that were disturbed in this pair. Computed independently per line against that line's own order count — so line figures are ratios, not a partition of the plant figure.",
  "Manual vs MRP": "Whether a change looks planner-driven (the order kept its number but was re-sequenced — a hand move) or system-driven (a clean MRP regen). Derived from the sequence field.",
  "Near-churn": "Cosmetic, low-severity changes (renumber, line move, version change) — real edits, but not the disruptive demand/timing shifts that stress the supply base.",
  "Basis": "Whether every metric is counted as order-lines (how many orders moved) or units (how many pieces those moves disturb). Toggle in the header.",
};
const TipCtx = createContext(null);
function TipLayer({ children }) {
  const [tip, setTip] = useState(null);
  const show = useCallback((content, e) => { if (content) setTip({ content, x: e.clientX, y: e.clientY }); }, []);
  const move = useCallback((e) => setTip((t) => (t ? { ...t, x: e.clientX, y: e.clientY } : t)), []);
  const hide = useCallback(() => setTip(null), []);
  return (
    <TipCtx.Provider value={{ show, move, hide }}>
      {children}
      {tip && (
        <div style={{
          position: "fixed",
          left: Math.min(tip.x + 14, (typeof window !== "undefined" ? window.innerWidth : 1200) - 320),
          top: tip.y + 16, zIndex: 9999, maxWidth: 300, pointerEvents: "none",
          background: "var(--tip-bg)", color: "#e8eaef", border: "1px solid var(--tip-border)",
          borderRadius: 8, padding: "9px 11px", fontSize: 12.5, lineHeight: 1.5,
          boxShadow: "0 8px 28px rgba(0,0,0,0.4)", fontFamily: FONT,
        }}>{tip.content}</div>
      )}
    </TipCtx.Provider>
  );
}
function useTip() { return useContext(TipCtx); }
function Q({ term, children, text }) {
  const tip = useTip();
  const content = text || GLOSSARY[term] || "";
  return (
    <span
      onMouseEnter={(e) => tip.show(content, e)} onMouseMove={tip.move} onMouseLeave={tip.hide}
      onFocus={(e) => tip.show(content, e)} onBlur={tip.hide} tabIndex={0}
      style={{ borderBottom: "1px dotted var(--text-faint)", cursor: "help", outline: "none" }}
    >{children || term}</span>
  );
}

/* ============================================================================
   SMALL UI HELPERS
   ========================================================================== */
function fmt(n) { return Math.round(n).toLocaleString("en-US"); }
function pct(x) { return (x * 100).toFixed(1) + "%"; }

function Panel({ T, title, subtitle, children, right }) {
  return (
    <div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 12 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11.5, color: T.textFaint }}>{subtitle}</div>}
        {right && <div style={{ marginLeft: "auto" }}>{right}</div>}
      </div>
      {children}
    </div>
  );
}
function Tile({ T, label, value, sub, tipText, color }) {
  const tip = useTip();
  return (
    <div
      onMouseEnter={(e) => tipText && tip.show(tipText, e)} onMouseMove={tip.move} onMouseLeave={tip.hide}
      style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "12px 14px", minWidth: 0, flex: "1 1 0", cursor: tipText ? "help" : "default" }}>
      <div style={{ fontSize: 11.5, color: T.textMute, fontWeight: 600, letterSpacing: 0.2, marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 23, fontWeight: 700, color: color || T.text, fontFamily: MONO, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11.5, color: T.textFaint, marginTop: 5 }}>{sub}</div>}
    </div>
  );
}

/* ============================================================================
   RESPONSIVE VIEWPORT HOOK (presentational only — no engine/logic effect)
   ========================================================================== */
function useIsNarrow(bp = 760) {
  const [narrow, setNarrow] = React.useState(
    () => typeof window !== "undefined" && window.matchMedia(`(max-width: ${bp}px)`).matches
  );
  React.useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${bp}px)`);
    const on = () => setNarrow(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [bp]);
  return narrow;
}

/* ============================================================================
   MAIN
   ========================================================================== */
export default function App() {
  const [mode, setMode] = useState("dark");
  const [basis, setBasis] = useState("units"); // default to units; order-lines is the switch-to view
  const [scope, setScope] = useState("ALL");
  const narrow = useIsNarrow();
  const T = THEMES[mode];

  const snapshots = useMemo(() => buildSnapshots(), []);
  const trend = useMemo(() => runTrend(snapshots, SCOPES, CTX), [snapshots]);
  const [pairIdx, setPairIdx] = useState(trend.length - 1);
  const pt = trend[pairIdx];
  const sc = pt.scoped[scope];

  const tColor = TYPE_COLOR(T);
  const gColor = GROUP_COLOR(T);
  const metric = (obj) => (basis === "units" ? obj.units : obj.count);
  const unitWord = basis === "units" ? "units" : "order-lines";
  const groupKeys = Object.keys(GROUP_LABEL);

  const [typeFilter, setTypeFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [drill, setDrill] = useState(null);
  const [howOpen, setHowOpen] = useState(false);

  const scopedChanges = useMemo(
    () => (scope === "ALL" ? pt.changes : pt.changes.filter((c) => c.line === scope)),
    [pt, scope]
  );
  const detailRows = useMemo(() => {
    let rows = scopedChanges.slice();
    if (typeFilter !== "ALL") rows = rows.filter((r) => r.type === typeFilter);
    const q = search.trim().toLowerCase();
    if (q) rows = rows.filter((r) =>
      r.material.toLowerCase().includes(q) || r.po.toLowerCase().includes(q) ||
      r.line.toLowerCase().includes(q) || TYPES[r.type].label.toLowerCase().includes(q));
    return rows.sort((a, b) => b.sev - a.sev || a.week - b.week || a.material.localeCompare(b.material));
  }, [scopedChanges, typeFilter, search]);

  const matrix = useMemo(() => buildMatrix(scopedChanges), [scopedChanges]);
  const matWeeks = useMemo(() => [...new Set(scopedChanges.map((c) => c.week))].sort((a, b) => a - b), [scopedChanges]);
  const matMaterials = useMemo(() => [...new Set(scopedChanges.map((c) => c.material))].sort(), [scopedChanges]);
  const maxCell = useMemo(() => Math.max(1, ...[...matrix.values()].map((c) => (basis === "units" ? c.units : c.count))), [matrix, basis]);

  const trendData = useMemo(() => trend.map((p, i) => {
    const s = p.scoped[scope];
    const row = { label: p.label, idx: i, churn: metric(s) };
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
    const last = snapshots[snapshots.length - 1].orders;
    const m1 = new Set(last.filter((o) => o.line === "NP-LINE-1").map((o) => o.material));
    const m2 = new Set(last.filter((o) => o.line === "NP-LINE-2").map((o) => o.material));
    return [...m1].filter((m) => m2.has(m));
  }, [snapshots]);

  const exportRows = async (rows, tag) => {
    const XLSX = await import("xlsx");
    const header = ["Planned Order", "Material", "Line", "Platform", "Prod Ver", "Prod Ver Text", "Flex", "Sched Week", "Change Type", "Severity", "Units Disturbed", "Attribution", "Reason", "Snapshot Pair"];
    const aoa = [header, ...rows.map((r) => [
      r.po, r.material, r.line, r.platform, r.pvCode, r.pvText, r.isFlex ? "Y" : "", weekLabel(r.week),
      TYPES[r.type].label, r.sev, r.units, r.attribution, r.reason, `${pt.from}->${pt.to}`,
    ])];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!cols"] = [10, 13, 11, 8, 8, 20, 7, 8, 12, 8, 13, 11, 60, 18].map((w) => ({ wch: w }));
    ws["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: aoa.length - 1, c: header.length - 1 } }) };
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plan Churn");
    XLSX.writeFile(wb, `production-plan-churn-${tag}-${pt.to}.xlsx`);
  };

  const cssVars = { "--tip-bg": T.tipBg, "--tip-border": T.tipBorder, "--text-faint": T.textFaint };
  const btn = (active) => ({
    padding: "5px 10px", fontSize: 12, fontWeight: 600, borderRadius: 7, cursor: "pointer",
    border: `1px solid ${active ? T.accent : T.border}`, background: active ? T.accentSoft : T.surface,
    color: active ? T.accent : T.textMute,
  });

  return (
    <TipLayer>
      <div style={{ ...cssVars, fontFamily: FONT, background: T.bg, color: T.text, minHeight: "100vh", paddingBottom: 48 }}>
        {/* ---- HEADER ---- */}
        <div style={{ background: T.bg2, borderBottom: `1px solid ${T.border}`, padding: "14px 22px", position: "sticky", top: 0, zIndex: 50 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <Activity size={22} color={T.accent} />
            <div style={{ marginRight: "auto" }}>
              <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.2 }}>Production Plan Churn</div>
              <div style={{ fontSize: 12, color: T.textMute }}>How nervous is the plan — and who moved it · <span style={{ color: T.textFaint }}>Built by Ian Provencher</span></div>
            </div>
            <div style={{ display: "flex", border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden" }}>
              {["units", "lines"].map((b) => (
                <button key={b} onClick={() => setBasis(b)} title={GLOSSARY["Basis"]}
                  style={{ padding: "6px 11px", fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer",
                    background: basis === b ? T.accent : "transparent", color: basis === b ? "#fff" : T.textMute }}>
                  {b === "lines" ? "Order-lines" : "Units"}
                </button>
              ))}
            </div>
            <select value={scope} onChange={(e) => setScope(e.target.value)} title="Recompute the whole dashboard for one line, or the plant"
              style={{ background: T.surface, color: T.text, border: `1px solid ${T.border}`, borderRadius: 8, padding: "7px 9px", fontSize: 12.5, fontWeight: 600, fontFamily: FONT }}>
              <option value="ALL">All lines (plant)</option>
              {LINES.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
            <button onClick={() => setMode(mode === "dark" ? "light" : "dark")} title="Toggle light / dark"
              style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 7, cursor: "pointer", color: T.text, display: "flex" }}>
              {mode === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>

        <div style={{ maxWidth: 1180, margin: "0 auto", padding: narrow ? "14px 12px" : "20px 22px" }}>
          {/* ---- INTRO ---- */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
            <div style={{ fontSize: 13.5, lineHeight: 1.65, color: T.text }}>
              Five saved <Q term="Snapshot">plan snapshots</Q> ({snapshots[0].date} -&gt; {snapshots[snapshots.length - 1].date}) are diffed across {trend.length} consecutive <Q term="Snapshot pair">pairs</Q>.
              In the focused pair <b>{pt.from} -&gt; {pt.to}</b>{scope !== "ALL" && <> on <b>{scope}</b></>}, <b style={{ color: T.accent }}>{fmt(sc.count)}</b> of {sc.denom} in-window orders were disturbed
              {" "}(<Q term="%-disturbed">{pct(sc.pctDisturbed)} disturbed</Q>) — {sc.byType.pullin.count} pulled in, {sc.byType.pushout.count} pushed out, {sc.byType.added.count} added, {sc.byType.cancelled.count} cancelled.
              {" "}Of the changes the tool can attribute, <b>{pct(sc.manualShare)}</b> look <Q term="Manual vs MRP">planner-driven</Q>. {pt.converted.length} order(s) simply <Q term="Conversion">converted</Q> (lifecycle, not churn).
            </div>
            <button onClick={() => setHowOpen(!howOpen)}
              style={{ marginTop: 10, background: "transparent", border: `1px solid ${T.border}`, borderRadius: 7, padding: "5px 10px", fontSize: 12, color: T.textMute, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
              <HelpCircle size={13} /> How this works {howOpen ? "\u25B4" : "\u25BE"}
            </button>
            {howOpen && (
              <div style={{ marginTop: 11, fontSize: 12.5, lineHeight: 1.7, color: T.textMute, borderTop: `1px solid ${T.borderSoft}`, paddingTop: 11 }}>
                <b style={{ color: T.text }}>Match.</b> Orders are matched across a pair on <Q term="Planned order">planned-order number</Q> (stable through the order's whole life). Any leftover drop/add sharing material + line + total quantity within {CTX.renumberWindowDays} days is treated as <Q term="Renumbered">renumbered</Q> — an <Q term="MRP regen">MRP regen</Q> artifact, not real churn.<br />
                <b style={{ color: T.text }}>Window.</b> Each pair is windowed to the later snapshot's date (<Q term="Window anchor">the anchor</Q>); orders that fell off only because time passed are <Q term="Roll-off">roll-off</Q> and excluded.<br />
                <b style={{ color: T.text }}>Classify.</b> Each disturbed order gets exactly one primary label by precedence: date move (only if it crosses a week boundary) -&gt; quantity -&gt; line -&gt; version. Quantity churn is measured on <Q term="Total order quantity">Total order quantity</Q>, never open quantity (the burndown trap). <Q term="Conversion">Conversions</Q> are excluded.<br />
                <b style={{ color: T.text }}>Attribute.</b> A disturbed order that kept its number but was re-sequenced reads as a <Q term="Manual vs MRP">planner (manual)</Q> move; a clean regen reads as system.<br />
                <b style={{ color: T.text }}>Honest gaps.</b> Added and cancelled orders are left <i>unattributed</i> — one field can't prove intent. Line figures are independent ratios, not a partition of the plant figure (see Lines &amp; Platforms).
              </div>
            )}
          </div>

          {/* ---- PAIR SELECTOR ---- */}
          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: T.textMute, fontWeight: 600 }}>Focused transition:</span>
            {trend.map((p, i) => (
              <button key={i} onClick={() => { setPairIdx(i); setDrill(null); }} style={btn(i === pairIdx)}>{p.label}</button>
            ))}
          </div>

          {/* ---- KPI TILES ---- */}
          {/* Narrow: grid so tiles wrap to a readable 2+-up instead of squishing
              to near-zero (flex:1 1 0 + minWidth:0 doesn't wrap, it crams). */}
          <div style={{ display: narrow ? "grid" : "flex", gridTemplateColumns: narrow ? "repeat(auto-fit, minmax(130px, 1fr))" : undefined, gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
            <Tile T={T} label={`TOTAL CHURN (${unitWord})`} value={fmt(metric(sc))} color={T.accent}
              tipText={`Total disturbed ${unitWord} in ${pt.from}->${pt.to}${scope !== "ALL" ? " on " + scope : ""}. ${GLOSSARY["Churn"]}`} />
            <Tile T={T} label="% ORDERS DISTURBED" value={pct(sc.pctDisturbed)} sub={`${sc.count} of ${sc.denom} in-window`} tipText={GLOSSARY["%-disturbed"]} />
            <Tile T={T} label="RESCHEDULE" value={fmt(basis === "units" ? sc.byType.pullin.units + sc.byType.pushout.units : sc.reschedule)}
              sub={`${sc.byType.pullin.count} in · ${sc.byType.pushout.count} out`} color={T.grey}
              tipText="Orders whose scheduled week moved (in or out). The single largest source of supplier whiplash." />
            <Tile T={T} label="ADDED / CANCELLED" value={`${sc.byType.added.count} / ${sc.byType.cancelled.count}`} color={T.risk}
              tipText="New demand appearing and future orders vanishing — the hardest swings to absorb." />
            <Tile T={T} label="MANUAL SHARE" value={pct(sc.manualShare)} sub="of attributable changes" tipText={GLOSSARY["Manual vs MRP"]} />
            <Tile T={T} label="NEAR-CHURN" value={fmt(sc.near)} sub="cosmetic edits" color={T.textMute} tipText={GLOSSARY["Near-churn"]} />
          </div>

          {/* ---- TREND + WEEK STRIP ---- */}
          <div style={{ display: "grid", gridTemplateColumns: narrow ? "1fr" : "1.6fr 1fr", gap: 14, marginBottom: 0 }}>
            <Panel T={T} title="Churn trend across snapshots" subtitle={`stacked by category · ${unitWord} · ${scope === "ALL" ? "all lines" : scope}`}>
              <div style={{ height: 230 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={trendData} margin={{ top: 8, right: 8, bottom: 4, left: -8 }}>
                    <CartesianGrid stroke={T.borderSoft} vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: T.textMute }} stroke={T.border} />
                    <YAxis tick={{ fontSize: 11, fill: T.textMute }} stroke={T.border} />
                    <RTooltip contentStyle={{ background: T.tipBg, border: `1px solid ${T.tipBorder}`, borderRadius: 8, fontSize: 12, color: "#e8eaef" }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    {groupKeys.map((g) => <Bar key={g} dataKey={g} name={GROUP_LABEL[g]} stackId="c" fill={gColor[g]} />)}
                    <Line type="monotone" dataKey="churn" name="Total churn" stroke={T.accent} strokeWidth={2} dot={{ r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </Panel>
            <Panel T={T} title="Disruption by scheduled week" subtitle={`focused pair · ${unitWord}`}>
              <div style={{ height: 230 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={weekStrip} margin={{ top: 8, right: 8, bottom: 4, left: -8 }}>
                    <CartesianGrid stroke={T.borderSoft} vertical={false} />
                    <XAxis dataKey="week" tick={{ fontSize: 11, fill: T.textMute }} stroke={T.border} />
                    <YAxis tick={{ fontSize: 11, fill: T.textMute }} stroke={T.border} />
                    <RTooltip contentStyle={{ background: T.tipBg, border: `1px solid ${T.tipBorder}`, borderRadius: 8, fontSize: 12, color: "#e8eaef" }} />
                    {groupKeys.map((g) => <Bar key={g} dataKey={g} name={GROUP_LABEL[g]} stackId="w" fill={gColor[g]} />)}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>

          {/* ---- LINES & PLATFORMS ---- */}
          <Panel T={T} title="Lines & platforms" subtitle="independent per-line load, %-disturbed, and platform mix (latest snapshot)">
            <div style={{ display: "grid", gridTemplateColumns: narrow ? "1fr" : "1fr 1fr", gap: 12 }}>
              {linePanel.map((lp) => {
                const ct = lp.comp.total || 1;
                const seg = [
                  { k: "B native", v: lp.comp.b, c: T.grey },
                  { k: "A native", v: lp.comp.a, c: tColor.pullin },
                  { k: "A via Flex", v: lp.comp.h, c: T.violet },
                ].filter((s) => s.v > 0);
                return (
                  <div key={lp.line} style={{ background: T.surface2, border: `1px solid ${T.borderSoft}`, borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <Layers size={15} color={T.accent} />
                      <b style={{ fontSize: 13.5 }}>{lp.line}</b>
                      <span style={{ marginLeft: "auto", fontSize: 11.5, color: T.textFaint }}>{lp.inWin} in-window orders</span>
                    </div>
                    <div style={{ display: "flex", gap: 16, marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 11, color: T.textMute, fontWeight: 600 }}>CHURN ({unitWord})</div>
                        <div style={{ fontSize: 19, fontWeight: 700, fontFamily: MONO, color: T.accent }}>{fmt(lp.churn)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: T.textMute, fontWeight: 600 }}><Q term="%-disturbed">%-DISTURBED</Q></div>
                        <div style={{ fontSize: 19, fontWeight: 700, fontFamily: MONO }}>{pct(lp.pctDisturbed)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: T.textMute, fontWeight: 600 }}>PAST-DUE OPEN</div>
                        <div style={{ fontSize: 19, fontWeight: 700, fontFamily: MONO, color: lp.pastDue.units > 0 ? T.amber : T.textMute }}>{fmt(lp.pastDue.units)}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", height: 9, borderRadius: 5, overflow: "hidden", marginBottom: 5 }}>
                      {seg.map((s) => <div key={s.k} title={`${s.k}: ${s.v}`} style={{ width: `${(s.v / ct) * 100}%`, background: s.c }} />)}
                    </div>
                    <div style={{ fontSize: 10.5, color: T.textFaint, display: "flex", gap: 10, flexWrap: "wrap" }}>
                      {seg.map((s) => <span key={s.k}><span style={{ display: "inline-block", width: 8, height: 8, background: s.c, borderRadius: 2, marginRight: 4 }} />{s.k} {s.v}</span>)}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 11, fontSize: 11.5, color: T.textFaint, lineHeight: 1.55, borderTop: `1px solid ${T.borderSoft}`, paddingTop: 9 }}>
              <b style={{ color: T.textMute }}>Why lines don't sum to the plant figure.</b> Per-line <Q term="%-disturbed">%-disturbed</Q> are independent ratios, each against its own line's order base — they are not a partition of the plant percentage. {sharedMaterials.length > 0 && <>SKU {sharedMaterials[0]} runs on <i>both</i> lines (Line 2 natively and Line 1 via <Q term="Flex">Flex</Q>), so it is reflected in each line it touches.</>} Churn <i>counts</i> are line-tagged and do add up; the ratios do not.
            </div>
          </Panel>

          {/* ---- MATERIAL x WEEK HEATMAP (bounded dual-sticky) ---- */}
          <Panel T={T} title="Material x scheduled-week severity" subtitle={`${unitWord} disturbed · click a cell to drill · focused pair`}>
            {matMaterials.length === 0 ? (
              <div style={{ fontSize: 12.5, color: T.textFaint, padding: "8px 2px" }}>No disturbances in this scope/pair.</div>
            ) : (
              <div style={{ overflow: "auto", WebkitOverflowScrolling: "touch", maxHeight: "max(360px, calc(100vh - 320px))", overscrollBehavior: "contain", border: `1px solid ${T.borderSoft}`, borderRadius: 8 }}>
                <table style={{ borderCollapse: "collapse", fontSize: 12, minWidth: 420 }}>
                  <thead>
                    <tr>
                      <th style={{ position: "sticky", top: 0, left: 0, zIndex: 3, background: T.surface2, color: T.textMute, fontWeight: 700, textAlign: "left", padding: "8px 10px", borderBottom: `1px solid ${T.border}`, minWidth: 120 }}>Material</th>
                      {matWeeks.map((w) => (
                        <th key={w} style={{ position: "sticky", top: 0, zIndex: 2, background: T.surface2, color: T.textMute, fontWeight: 600, padding: "8px 10px", borderBottom: `1px solid ${T.border}`, minWidth: 54 }}>{weekLabel(w)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {matMaterials.map((mat) => (
                      <tr key={mat}>
                        <td style={{ position: "sticky", left: 0, zIndex: 1, background: T.surface, color: T.text, fontFamily: MONO, fontWeight: 600, padding: "7px 10px", borderBottom: `1px solid ${T.borderSoft}` }}>{mat}</td>
                        {matWeeks.map((w) => {
                          const cell = matrix.get(`${mat}|${w}`);
                          const val = cell ? (basis === "units" ? cell.units : cell.count) : 0;
                          const intensity = val ? 0.12 + 0.6 * (val / maxCell) : 0;
                          const isSel = drill && drill.kind === "cell" && drill.material === mat && drill.week === w;
                          return (
                            <td key={w}
                              onClick={() => cell && setDrill({ kind: "cell", material: mat, week: w, rows: cell.rows })}
                              style={{
                                textAlign: "center", padding: "7px 10px", borderBottom: `1px solid ${T.borderSoft}`,
                                cursor: cell ? "pointer" : "default", fontFamily: MONO, fontWeight: 600,
                                background: cell ? `rgba(91,141,239,${intensity})` : "transparent",
                                outline: isSel ? `2px solid ${T.accent}` : "none", color: T.text,
                              }}>{val || ""}</td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {/* legend */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 11, fontSize: 11, color: T.textMute }}>
              {Object.keys(TYPES).map((t) => (
                <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 2, background: tColor[t], display: "inline-block" }} />
                  <Q text={TYPES[t].desc}>{TYPES[t].label}</Q>
                </span>
              ))}
            </div>
          </Panel>

          {/* ---- ORDER-LEVEL DETAIL ---- */}
          <Panel T={T} title="Order-level detail" subtitle="every disturbed order in the focused pair/scope"
            right={
              <div style={{ display: "flex", gap: 7 }}>
                <button onClick={() => exportRows(scopedChanges, "full")} title="Every disturbed order in the loaded pair/scope, ignoring the on-screen filter"
                  style={{ display: "inline-flex", alignItems: "center", gap: 5, background: T.accent, color: "#fff", border: "none", borderRadius: 7, padding: "6px 10px", fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}>
                  <FileSpreadsheet size={13} /> Export full ({scopedChanges.length})
                </button>
                <button onClick={() => exportRows(detailRows, "filtered")} title="Exactly the rows shown below, with the active type filter and search applied"
                  style={{ display: "inline-flex", alignItems: "center", gap: 5, background: T.surface, color: T.text, border: `1px solid ${T.border}`, borderRadius: 7, padding: "6px 10px", fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}>
                  <FileSpreadsheet size={13} /> Filtered ({detailRows.length})
                </button>
              </div>
            }>
            {/* filters */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10, alignItems: "center" }}>
              <button onClick={() => setTypeFilter("ALL")} style={btn(typeFilter === "ALL")}>All ({scopedChanges.length})</button>
              {Object.keys(TYPES).map((t) => {
                const n = scopedChanges.filter((r) => r.type === t).length;
                if (!n) return null;
                return <button key={t} onClick={() => setTypeFilter(t)} title={TYPES[t].desc} style={{ ...btn(typeFilter === t), borderColor: typeFilter === t ? tColor[t] : T.border, color: typeFilter === t ? tColor[t] : T.textMute }}>{TYPES[t].label} ({n})</button>;
              })}
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="search material / order / line..."
                style={{ marginLeft: narrow ? 0 : "auto", background: T.surface, color: T.text, border: `1px solid ${T.border}`, borderRadius: 7, padding: "6px 10px", fontSize: 12, fontFamily: FONT, minWidth: narrow ? 0 : 200, width: narrow ? "100%" : undefined }} />
            </div>
            <div style={{ overflow: "auto", WebkitOverflowScrolling: "touch", maxHeight: "max(360px, calc(100vh - 300px))", overscrollBehavior: "contain", border: `1px solid ${T.borderSoft}`, borderRadius: 8 }}>
              <table style={{ borderCollapse: "collapse", fontSize: 12, width: "100%", minWidth: 760 }}>
                <thead>
                  <tr>
                    {[["Planned Order", 1], ["Material", 0], ["Line", 0], ["Plat", 0], ["Prod ver", 0], ["Wk", 0], ["Change", 0], ["Units", 0], ["Attribution", 0], ["Why", 0]].map(([h, lead], i) => (
                      <th key={h} style={{
                        position: "sticky", top: 0, left: lead ? 0 : undefined, zIndex: lead ? 3 : 2,
                        background: T.surface2, color: T.textMute, fontWeight: 700, textAlign: "left",
                        padding: "8px 10px", borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap",
                      }}>
                        {h === "Change" || h === "Attribution" || h === "Units" ? <Q text={h === "Attribution" ? GLOSSARY["Manual vs MRP"] : h === "Units" ? "Units this change disturbs (see Basis)." : "The single primary change label for this order."}>{h}</Q> : h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {detailRows.map((r) => (
                    <tr key={r.id} onClick={() => setDrill({ kind: "row", rows: [r] })}
                      style={{ cursor: "pointer", background: drill && drill.kind === "row" && drill.rows[0].id === r.id ? T.hover : "transparent" }}>
                      <td style={{ position: "sticky", left: 0, zIndex: 1, background: drill && drill.kind === "row" && drill.rows[0].id === r.id ? T.hover : T.surface, fontFamily: MONO, padding: "7px 10px", borderBottom: `1px solid ${T.borderSoft}`, fontWeight: 600 }}>{r.po}</td>
                      <td style={{ fontFamily: MONO, padding: "7px 10px", borderBottom: `1px solid ${T.borderSoft}` }}>{r.material}</td>
                      <td style={{ padding: "7px 10px", borderBottom: `1px solid ${T.borderSoft}`, color: T.textMute, whiteSpace: "nowrap" }}>{r.line}</td>
                      <td style={{ padding: "7px 10px", borderBottom: `1px solid ${T.borderSoft}` }}>
                        {r.isFlex ? <span style={{ fontSize: 10, fontWeight: 700, color: T.violet, border: `1px solid ${T.violet}`, borderRadius: 4, padding: "1px 4px" }}>FLEX</span> : <span style={{ color: T.textMute }}>{r.platform}</span>}
                      </td>
                      <td style={{ padding: "7px 10px", borderBottom: `1px solid ${T.borderSoft}`, color: T.textFaint, fontSize: 11, whiteSpace: "nowrap" }}>{r.pvCode}</td>
                      <td style={{ padding: "7px 10px", borderBottom: `1px solid ${T.borderSoft}`, fontFamily: MONO, color: T.textMute }}>{weekLabel(r.week)}</td>
                      <td style={{ padding: "7px 10px", borderBottom: `1px solid ${T.borderSoft}`, whiteSpace: "nowrap" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                          <span style={{ width: 8, height: 8, borderRadius: 2, background: tColor[r.type] }} />
                          {TYPES[r.type].label}
                        </span>
                      </td>
                      <td style={{ padding: "7px 10px", borderBottom: `1px solid ${T.borderSoft}`, fontFamily: MONO, textAlign: "right" }}>{fmt(r.units)}</td>
                      <td style={{ padding: "7px 10px", borderBottom: `1px solid ${T.borderSoft}` }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: r.attribution === "manual" ? T.amber : r.attribution === "system" ? T.textMute : T.textFaint }}>{r.attribution}</span>
                      </td>
                      <td style={{ padding: "7px 10px", borderBottom: `1px solid ${T.borderSoft}`, color: T.textMute, maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.reason}>{r.reason}</td>
                    </tr>
                  ))}
                  {detailRows.length === 0 && (
                    <tr><td colSpan={10} style={{ padding: "16px", textAlign: "center", color: T.textFaint }}>No rows match the current filter.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>

          <div style={{ fontSize: 11, color: T.textFaint, textAlign: "center", marginTop: 18, lineHeight: 1.6 }}>
            Synthetic demonstration data · no real production or company data · neutral theme, not corporate-branded.<br />
            Production Plan Churn — Built by Ian Provencher.
          </div>
        </div>

        {/* ---- DRILLDOWN SIDEBAR ---- */}
        {drill && (
          <div style={{ position: "fixed", top: 0, right: 0, height: "100vh", width: 360, maxWidth: "92vw", background: T.bg2, borderLeft: `1px solid ${T.border}`, zIndex: 200, boxShadow: "-12px 0 32px rgba(0,0,0,0.35)", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "14px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 8 }}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700 }}>{drill.kind === "cell" ? `${drill.material} · ${weekLabel(drill.week)}` : "Order detail"}</div>
                <div style={{ fontSize: 11.5, color: T.textFaint }}>{drill.rows.length} change(s) · {pt.from} -&gt; {pt.to}</div>
              </div>
              <button onClick={() => setDrill(null)} style={{ marginLeft: "auto", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 7, padding: 6, cursor: "pointer", color: T.text, display: "flex" }}><X size={15} /></button>
            </div>
            <div style={{ overflow: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
              {drill.rows.map((r) => (
                <div key={r.id} style={{ background: T.surface, border: `1px solid ${T.borderSoft}`, borderRadius: 10, padding: "11px 13px", borderLeft: `3px solid ${tColor[r.type]}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: tColor[r.type] }}>{TYPES[r.type].label}</span>
                    <span style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 12, color: T.text }}>{r.po}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "3px 10px", fontSize: 11.5, color: T.textMute, marginBottom: 8 }}>
                    <span style={{ color: T.textFaint }}>Material</span><span style={{ fontFamily: MONO, color: T.text }}>{r.material}</span>
                    <span style={{ color: T.textFaint }}>Line</span><span>{r.line} {r.isFlex && <span style={{ fontSize: 10, fontWeight: 700, color: T.violet, border: `1px solid ${T.violet}`, borderRadius: 4, padding: "0 4px", marginLeft: 4 }}>FLEX</span>}</span>
                    <span style={{ color: T.textFaint }}>Platform</span><span>{r.platform}</span>
                    <span style={{ color: T.textFaint }}>Prod ver</span><span style={{ fontFamily: MONO }}>{r.pvCode} · {r.pvText}</span>
                    <span style={{ color: T.textFaint }}>Sched wk</span><span style={{ fontFamily: MONO }}>{weekLabel(r.week)}</span>
                    <span style={{ color: T.textFaint }}>Units disturbed</span><span style={{ fontFamily: MONO }}>{fmt(r.units)}</span>
                    <span style={{ color: T.textFaint }}>Attribution</span><span style={{ color: r.attribution === "manual" ? T.amber : T.textMute }}>{r.attribution}</span>
                  </div>
                  <div style={{ fontSize: 12, color: T.text, lineHeight: 1.5, background: T.surface2, borderRadius: 7, padding: "8px 10px" }}>{r.reason}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </TipLayer>
  );
}
