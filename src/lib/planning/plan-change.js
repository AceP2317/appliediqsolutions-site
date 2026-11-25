/* Reading the change between two versions of a production plan: match the
   orders, name each change, and weigh it in units or order-lines. Pure.
   Weeks are bucketed off a fixed Monday epoch, in UTC. */
import { isoDay } from "./shared.js";

export const TYPES = {
  pullin:    { label: "Pulled in",   sev: 3, desc: "Schedule moved earlier — parts needed sooner.", group: "reschedule" },
  pushout:   { label: "Pushed out",  sev: 2, desc: "Schedule moved later — parts now sit early.",   group: "reschedule" },
  added:     { label: "Added",       sev: 3, desc: "New order not in the prior snapshot — new demand.", group: "added" },
  canceled: { label: "Canceled",   sev: 3, desc: "Future order vanished from the window — deferred or canceled.", group: "canceled" },
  qty:       { label: "Qty revised", sev: 2, desc: "Total order quantity changed.", group: "qty" },
  renumber:  { label: "Renumbered",  sev: 1, desc: "Same logical order, new planned-order number (MRP regen).", group: "cosmetic" },
  line:      { label: "Line moved",  sev: 1, desc: "Reassigned to a different production line.", group: "cosmetic" },
  version:   { label: "Version chg", sev: 1, desc: "Production version changed.", group: "cosmetic" },
};
/* ---- date utils (UTC, week-bucketed off a fixed Monday epoch) ---- */
export const EPOCH = Date.UTC(2026, 3, 27);
export const DAY = 86400000;
export function dms(s) { const [y, m, dd] = s.split("-").map(Number); return Date.UTC(y, m - 1, dd); }
export function weekIndex(s) { return Math.floor((dms(s) - EPOCH) / (7 * DAY)); }
export function daysBetween(a, b) { return Math.round((dms(b) - dms(a)) / DAY); }
export function addDays(s, n) {
  const t = new Date(dms(s) + n * DAY);
  const p = (x) => String(x).padStart(2, "0");
  return `${t.getUTCFullYear()}-${p(t.getUTCMonth() + 1)}-${p(t.getUTCDate())}`;
}
export function weekLabel(w) { return "W" + w; }
export const FLEX_RE = /flex/i;
export const CTX = { renumberWindowDays: 5 };

export function normalize(o) {
  return {
    po: String(o.po), material: String(o.material), line: o.line, platform: o.platform,
    pvCode: String(o.pvCode), pvText: o.pvText, isFlex: FLEX_RE.test(o.pvText),
    schedDate: o.schedDate, week: weekIndex(o.schedDate),
    totalQty: o.totalQty, openQty: o.openQty == null ? o.totalQty : o.openQty,
    orderType: o.orderType || "", seq: o.seq,
  };
}

export function matchPair(prev, next, anchorWeek, ctx) {
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
export function classify(a, b) {
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
export function unitsOf(type, a, b) {
  if (type === "qty") return Math.abs((b.totalQty || 0) - (a.totalQty || 0));
  if (type === "renumber") return 0;
  if (type === "added") return b.totalQty || 0;
  if (type === "canceled") return a.totalQty || 0;
  return a.totalQty || 0;
}
export function reasonOf(type, a, b) {
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
export function diffPair(prev, next, snapDateNext, ctx) {
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
export function buildMatrix(changes) {
  const cells = new Map();
  for (const c of changes) {
    const k = `${c.material}|${c.week}`;
    if (!cells.has(k)) cells.set(k, { material: c.material, week: c.week, count: 0, units: 0, sevSum: 0, rows: [] });
    const cell = cells.get(k);
    cell.count += 1; cell.units += c.units; cell.sevSum += c.sev; cell.rows.push(c);
  }
  return cells;
}
export function aggregate(changes, windowedNext, scope) {
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
/* Two plan versions read change by change, written apart from diffPair() so
   the lab check can hold the two against each other. Orders are normalized
   (normalize above). The answer lists each change as { po, type, units },
   sorted by order number. */
const weekOf = (w) => `the week of ${isoDay(EPOCH + w * 7 * 86400000)}`;

export function workPlanChange(prev, next, snapDateNext, ctx = CTX) {
  const anchor = weekIndex(snapDateNext);
  const lines = [`The newer version was pulled ${snapDateNext}, in ${weekOf(anchor)}. Orders scheduled before that week are left out of both versions.`];
  const p = prev.filter((o) => o.week >= anchor), n = next.filter((o) => o.week >= anchor);
  const answer = [];
  const add = (po, type, units, text) => { answer.push({ po, type, units }); lines.push(`${text} So: ${type}, ${units} unit${units === 1 ? "" : "s"}.`); };
  const nextByPo = new Map(n.map((o) => [o.po, o])), prevPos = new Set(p.map((o) => o.po));
  const gone = [];
  for (const a of p) {
    const b = nextByPo.get(a.po);
    if (!b) { gone.push(a); continue; }
    if (a.orderType === "" && b.orderType === "FIRMED") { lines.push(`${a.po} (${a.material}) was firmed: a step in its life, not a change.`); continue; }
    if (a.week !== b.week) add(a.po, b.week < a.week ? "pullin" : "pushout", a.totalQty || 0, `${a.po} (${a.material}): from ${weekOf(a.week)} to ${weekOf(b.week)}, ${b.week < a.week ? "earlier" : "later"}.`);
    else if (a.totalQty !== b.totalQty) add(a.po, "qty", Math.abs((b.totalQty || 0) - (a.totalQty || 0)), `${a.po} (${a.material}): same week, quantity ${a.totalQty} to ${b.totalQty}, a difference of ${Math.abs(b.totalQty - a.totalQty)}.`);
    else if (a.line !== b.line) add(a.po, "line", a.totalQty || 0, `${a.po} (${a.material}): same week and quantity, line ${a.line} to ${b.line}.`);
    else if (a.pvText !== b.pvText || a.pvCode !== b.pvCode) add(a.po, "version", a.totalQty || 0, `${a.po} (${a.material}): same week, quantity and line, version "${a.pvText}" to "${b.pvText}".`);
  }
  const fresh = n.filter((o) => !prevPos.has(o.po));
  const taken = new Set();
  const canceled = [];
  for (const a of gone) {
    const i = fresh.findIndex((b, j) => !taken.has(j) && b.material === a.material && b.line === a.line && b.totalQty === a.totalQty && Math.abs(daysBetween(a.schedDate, b.schedDate)) <= ctx.renumberWindowDays);
    if (i < 0) { canceled.push(a); continue; }
    taken.add(i);
    const b = fresh[i];
    add(b.po, "renumber", 0, `${a.po} is gone and ${b.po} is new, with the same material ${a.material}, line ${a.line} and quantity ${a.totalQty}, ${Math.abs(daysBetween(a.schedDate, b.schedDate))} days apart (within ${ctx.renumberWindowDays}): the same order re-keyed.`);
  }
  fresh.forEach((b, j) => { if (!taken.has(j)) add(b.po, "added", b.totalQty || 0, `${b.po} (${b.material}) is new in ${weekOf(b.week)} and matches no order that left.`); });
  for (const a of canceled) add(a.po, "canceled", a.totalQty || 0, `${a.po} (${a.material}) in ${weekOf(a.week)} is gone and no new order matches it.`);
  answer.sort((x, y) => x.po.localeCompare(y.po) || x.type.localeCompare(y.type));
  return { answer, lines };
}

export function runTrend(snapshots, scopes, ctx) {
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
