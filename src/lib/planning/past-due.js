/* Past-due order triage: age each open in-house order against an as-of
   date, give it exactly one disposition, and diff two pulls. Pure. */
import { qty, isoDay } from "./shared.js";

export const CFG = {
  TECO_DAYS: 90,            // past-due age beyond which an order is a close candidate
  SUPERSEDED_MIN_DAYS: 30,  // min age for the "superseded by newer order" close rule
  LATE_MIN: 8,              // below this, an order is normal completion churn
  LATE_MAX: 90,             // reschedule window upper bound
  PARTIAL_FRACTION: 0.25,   // qty ≤ this share of material's largest open order → remnant
  CHRONIC_MIN: 3,           // ≥ this many past-due orders for one (plant, material) → chronic
  PHANTOM_CAP_MONTHS: 6,    // phantom weighting cap, in 30-day months
};

export const BUCKETS = [
  { id: "0",      label: "Due / future", min: -1e15, max: 0 },
  { id: "1-7",    label: "1–7 days",     min: 1,     max: 7 },
  { id: "8-30",   label: "8–30 days",    min: 8,     max: 30 },
  { id: "31-90",  label: "31–90 days",   min: 31,    max: 90 },
  { id: "91-180", label: "91–180 days",  min: 91,    max: 180 },
  { id: "180+",   label: "180+ days",    min: 181,   max: 1e15 },
];

export const DAY_MS = 86400000;

export function normId(v) {
  let s = String(v == null ? "" : v).trim();
  if (/^\d+\.0$/.test(s)) s = s.slice(0, -2);
  return s;
}

export function bucketOf(days, buckets) {
  for (const b of buckets) if (days >= b.min && days <= b.max) return b.id;
  return buckets[buckets.length - 1].id;
}

export function keyPM(plant, mat) { return plant + "|" + mat; } // plant-qualified keying

// Built once: this runs for every order's reason line, and building a formatter costs about 20 uses of one.
const WHOLE = new Intl.NumberFormat("en-US");
const ONE_PLACE = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

export function fmtN(n) {
  if (n == null || isNaN(n)) return "—";
  return Math.round(n) === n ? WHOLE.format(n) : ONE_PLACE.format(n);
}

export function buildMaterialStats(orders) {
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
export function recommend(o, matStats, cfg) {
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

export function computeAll(rawOrders, asOfMs, cfg, buckets) {
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

export function diffSnapshots(currentOrders, priorOrders) {
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

/* Every order walked down the disposition ladder rung by rung, written apart
   from recommend() so the lab check can hold the two against each other. The
   answer maps each order to its one disposition. */
export function workTriage(rawOrders, asOfMs, cfg = CFG) {
  const lines = [`As of ${isoDay(asOfMs)}. Days past due = as-of date minus due date, in whole days.`];
  const aged = rawOrders.map((r) => ({ ...r, days: Math.floor((asOfMs - r.dueMs) / DAY_MS) }));
  const groups = new Map();
  for (const o of aged) { const k = keyPM(o.plant, o.mat); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(o); }
  const answer = {};
  for (const o of [...aged].sort((a, b) => String(a.order).localeCompare(String(b.order)))) {
    const same = groups.get(keyPM(o.plant, o.mat));
    const maxQty = Math.max(...same.map((s) => s.qty));
    const head = `Order ${o.order} (${o.mat}, ${qty(o.qty)} ${o.uom}): due ${isoDay(o.dueMs)}, ${o.days} day${o.days === 1 ? "" : "s"} past due.`;
    let rec, why;
    const newer = same.find((s) => s.order !== o.order && s.dueMs > o.dueMs && s.qty >= o.qty);
    if (/PlOrd/i.test(o.category)) { rec = "UNFIRM_PLORD"; why = "It is a firmed planned order, which the run cannot replan: unfirm it."; }
    else if (o.days > cfg.TECO_DAYS) { rec = "TECO"; why = `${o.days} is over ${cfg.TECO_DAYS}: close it.`; }
    else if (o.days > cfg.SUPERSEDED_MIN_DAYS && newer) { rec = "TECO"; why = `${o.days} is over ${cfg.SUPERSEDED_MIN_DAYS}, and order ${newer.order} for the same material is due later at ${qty(newer.qty)}, no less than ${qty(o.qty)}: superseded, close it.`; }
    else if (o.days >= cfg.LATE_MIN && o.days <= cfg.LATE_MAX && same.length >= 2 && o.qty <= cfg.PARTIAL_FRACTION * maxQty) { rec = "VERIFY_PARTIAL"; why = `${o.days} is from ${cfg.LATE_MIN} to ${cfg.LATE_MAX}, and ${qty(o.qty)} is no more than ${qty(cfg.PARTIAL_FRACTION)} × ${qty(maxQty)} = ${qty(cfg.PARTIAL_FRACTION * maxQty)}, the material's largest open order: a remnant, verify it.`; }
    else if (o.days >= cfg.LATE_MIN && o.days <= cfg.LATE_MAX) { rec = "RESCHEDULE"; why = `${o.days} is from ${cfg.LATE_MIN} to ${cfg.LATE_MAX}${same.length >= 2 ? `, and ${qty(o.qty)} is more than ${qty(cfg.PARTIAL_FRACTION)} × ${qty(maxQty)}` : ""}: real but late, reschedule it.`; }
    else { rec = "EXPEDITE_LEAVE"; why = o.days < 1 ? "Not past due on this date: leave it." : `${o.days} is under ${cfg.LATE_MIN}, normal completion churn: leave it, or expedite if a later order needs it.`; }
    answer[o.order] = rec;
    lines.push(`${head} ${why}`);
  }
  return { answer, lines };
}

// BOM enrichment: per (plant, material) → where-used finished tools + purchased
// (F) descendants, scanned via indented-explosion level sequence. Scope-honest:
// "not found" means absent from the loaded sample, never proven obsolete.
export function bomEnrich(bomFiles, targets) {
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
