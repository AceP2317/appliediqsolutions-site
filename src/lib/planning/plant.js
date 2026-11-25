/* A made-up plant, built from a seed. The same seed always builds the same
   plant, so a task is named by its seed and anyone can work its answer again.
   It comes in three sizes. It carries four planner traps, and each can be
   switched off: a phantom assembly, a part used in one unit and kept in
   another, a bill line that starts or stops on a date, and stock booked below
   zero. Nothing but the seed decides the plant: there is no clock in it and no
   unseeded random number.

   One plant feeds every family: a bill and a build plan for the explosion,
   the shortage call and net requirements; material rows for the setting audit;
   open production orders for past-due triage; and two versions of a plan for
   reading what changed. */
import { explodeBom } from "./bom.js";
import { addDays, dms } from "./plan-change.js";
import { shortageCall } from "./shortage.js";
import { PM } from "./setting-audit.js";

export const SIZES = {
  small: { fg: 2, asm: 2, phantom: 1, purch: 7, weeks: 3, cutovers: 1, orders: 6, plan: 8 },
  medium: { fg: 3, asm: 4, phantom: 1, purch: 12, weeks: 5, cutovers: 1, orders: 10, plan: 14 },
  large: { fg: 6, asm: 7, phantom: 2, purch: 20, weeks: 8, cutovers: 2, orders: 16, plan: 22 },
};
export const TRAPS = ["phantom", "uom", "validity", "negative"];
export const SITE = "1710";
const FIRST_MONDAY = "2026-11-30";
const DAY = 86400000;
export const dayMs = dms;
export { addDays };

/** A seeded stream of numbers: the same seed gives the same stream on every machine. */
export function seeded(seed) {
  let h = 2166136261;
  for (const ch of String(seed)) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); }
  let a = h >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (lo, hi) => lo + Math.floor(next() * (hi - lo + 1));
  return {
    next, int,
    chance: (p) => next() < p,
    pick: (arr) => arr[int(0, arr.length - 1)],
    shuffle: (arr) => { const b = arr.slice(); for (let i = b.length - 1; i > 0; i--) { const j = int(0, i); [b[i], b[j]] = [b[j], b[i]]; } return b; },
  };
}

const FG_NAMES = ["Pump set, 2 kW", "Pump set, 4 kW", "Valve station", "Fan module", "Compressor skid", "Mixer drive", "Filter unit", "Blower pack"];
const ASM_NAMES = ["Motor mount", "Frame weldment", "Control box", "Impeller assembly", "Shaft assembly", "Housing assembly", "Cable harness", "Base plate assembly", "Cover assembly"];
const PHANTOM_NAMES = ["Seal kit", "Fastener kit", "Hose kit", "Label kit"];
const EA_PARTS = ["Hex bolt M8", "Hex nut M8", "Washer M8", "O-ring 40 mm", "Bearing 6204", "Shaft key", "Cable tie", "Terminal block", "Relay 24 V", "Rocker switch", "Rubber foot", "Compression spring", "Dowel pin", "Bronze bushing", "Hose clamp", "Rivet 4 mm", "Screw M5", "Rating label", "Fuse 5 A", "Grommet", "Gasket", "Spacer"];
const BULK_PARTS = [["Sealant", "KG", "G"], ["Grease", "KG", "G"], ["Copper wire", "M", "MM"], ["Rubber hose", "M", "MM"], ["Primer paint", "L", "ML"]];
const PACKS = [10, 20, 25, 50];
const SUPPLIERS = {
  jit: [["S-JIT1", "US"]],
  local: [["S-LOC1", "US"], ["S-LOC2", "US"]],
  regional: [["S-REG1", "US"]],
  domestic: [["S-DOM1", "US"], ["S-DOM2", "US"]],
  overseas: [["S-OVS1", "CN"], ["S-OVS2", "DE"], ["S-OVS3", "MX"]],
};
const TIER_WEIGHTS = [["jit", 1], ["local", 2], ["regional", 2], ["domestic", 3], ["overseas", 3]];

const round1 = (x) => Math.round(x * 10) / 10;

/** Six whole months of use that add up to exactly 180 days at `daily` a day. */
function sixMonths(r, daily) {
  const total = 180 * daily;
  if (!total) return [0, 0, 0, 0, 0, 0];
  const w = Array.from({ length: 6 }, () => r.int(1, 10));
  const sum = w.reduce((a, b) => a + b, 0);
  const m = w.map((x) => Math.floor((total * x) / sum));
  m[5] += total - m.reduce((a, b) => a + b, 0);
  return m;
}

/**
 * @param {string|number} seed
 * @param {"small"|"medium"|"large"} [size]
 * @param {{phantom?: boolean, uom?: boolean, validity?: boolean, negative?: boolean}} [traps]  every trap is on unless set false
 */
export function plant(seed, size = "small", traps = {}) {
  const S = SIZES[size];
  if (!S) throw new Error(`size "${size}" is not one of ${Object.keys(SIZES).join(", ")}`);
  for (const k of Object.keys(traps)) if (!TRAPS.includes(k)) throw new Error(`trap "${k}" is not one of ${TRAPS.join(", ")}`);
  const on = Object.fromEntries(TRAPS.map((t) => [t, traps[t] !== false]));
  const r = seeded(`${seed}/${size}`);

  const start = addDays(FIRST_MONDAY, 7 * r.int(0, 12));
  const weeks = Array.from({ length: S.weeks }, (_, i) => addDays(start, 7 * i));

  /* ---- items ---- */
  const fgNames = r.shuffle(FG_NAMES), asmNames = r.shuffle(ASM_NAMES), phNames = r.shuffle(PHANTOM_NAMES);
  const fgs = Array.from({ length: S.fg }, (_, i) => ({ id: `FG-${i + 1}`, desc: fgNames[i], kind: "FG", unit: "EA" }));
  const asms = Array.from({ length: S.asm }, (_, i) => ({ id: `ASM-${i + 1}`, desc: asmNames[i], kind: "ASM", unit: "EA", onHand: r.int(0, 10) }));
  const phs = on.phantom ? Array.from({ length: S.phantom }, (_, i) => ({ id: `PH-${i + 1}`, desc: `${phNames[i]} (phantom)`, kind: "PHANTOM", unit: "EA", onHand: 0 })) : [];
  const bulkN = size === "small" ? 1 : 2;
  const bulk = r.shuffle(BULK_PARTS).slice(0, bulkN);
  const ea = r.shuffle(EA_PARTS).slice(0, S.purch - bulkN);
  const specs = r.shuffle([...ea.map((d) => ({ desc: d, unit: "EA" })), ...bulk.map(([d, u, sub]) => ({ desc: d, unit: u, sub }))]);
  const purch = specs.map((p, i) => ({
    id: `P-${String(i + 1).padStart(2, "0")}`, desc: p.desc, kind: "PURCH", unit: p.unit, onHand: 0,
    ...(p.sub && on.uom ? { conv: { [p.sub]: 0.001 } } : {}),
  }));
  const common = purch.find((p) => p.unit === "EA");

  /* ---- the bill ---- */
  const bom = [];
  const seen = new Map();
  const add = (parent, comp, qty, uom) => {
    const s = seen.get(parent.id) || new Set();
    if (s.has(comp.id)) return false;
    s.add(comp.id); seen.set(parent.id, s);
    bom.push({ parent: parent.id, pos: String(s.size * 10).padStart(4, "0"), comp: comp.id, qty, uom: uom || comp.unit });
    return true;
  };
  const used = new Set([common.id]);
  const others = purch.filter((p) => p !== common);
  const takePart = (prefer) => {
    const all = others.filter((x) => !prefer || prefer(x));
    const fresh = all.filter((x) => !used.has(x.id));
    const p = r.pick(fresh.length ? fresh : all);
    used.add(p.id);
    return p;
  };
  const partLine = (parent, p) => {
    if (p.unit === "EA") return add(parent, p, r.int(1, 4));
    if (p.conv) return add(parent, p, 50 * r.int(1, 8), Object.keys(p.conv)[0]);
    return add(parent, p, (5 * r.int(1, 8)) / 100);
  };

  const asmUsed = new Set();
  asms.forEach((a, i) => {
    for (let k = r.int(2, 3); k > 0; k--) partLine(a, takePart());
    if (i < asms.length - 1 && size !== "small" && r.chance(0.4)) {
      const sub = asms[r.int(i + 1, asms.length - 1)];
      if (add(a, sub, r.int(1, 2))) asmUsed.add(sub.id);
    }
  });
  phs.forEach((ph) => {
    const b = purch.find((p) => p.unit !== "EA" && !seen.get(ph.id)?.has(p.id));
    if (b) { used.add(b.id); partLine(ph, b); }
    for (let k = r.int(1, 2); k > 0; k--) partLine(ph, takePart((p) => p.unit === "EA"));
  });
  const freeAsms = r.shuffle(asms.filter((a) => !asmUsed.has(a.id)));
  fgs.forEach((fg, i) => {
    add(fg, common, r.int(2, 6));
    const mine = freeAsms.filter((_, j) => j % fgs.length === i);
    if (!mine.length) mine.push(r.pick(asms));
    for (const a of mine) add(fg, a, r.int(1, 2));
    for (let k = r.int(1, 2); k > 0; k--) partLine(fg, takePart());
  });
  phs.forEach((ph, i) => {
    add(fgs[i % fgs.length], ph, r.int(1, 2));
    if (fgs.length > 1 && r.chance(0.5)) add(fgs[(i + 1) % fgs.length], ph, r.int(1, 2));
  });
  const parentsOfParts = [...asms, ...phs, ...fgs];
  for (const p of purch) if (!bom.some((l) => l.comp === p.id)) partLine(r.pick(parentsOfParts), p);

  /* ---- cut-overs: an old part runs through a day, its replacement starts the next ---- */
  const items = [...fgs, ...asms, ...phs, ...purch];
  if (on.validity) {
    for (let c = 0; c < S.cutovers; c++) {
      const candidates = bom.filter((l) => !l.to && !l.from && l.comp !== common.id && items.find((i) => i.id === l.comp).kind === "PURCH" && items.find((i) => i.id === l.comp).unit === "EA");
      if (!candidates.length) break;
      const l = r.pick(candidates);
      const old = items.find((i) => i.id === l.comp);
      const k = r.int(1, S.weeks - 1);
      const last = addDays(weeks[k], r.pick([-1, 0, 2]));
      const fresh = { id: `P-${String(items.filter((i) => i.kind === "PURCH").length + 1).padStart(2, "0")}`, desc: `${old.desc}, revised`, kind: "PURCH", unit: "EA", onHand: 0 };
      items.push(fresh); purch.push(fresh);
      l.to = last;
      const s = seen.get(l.parent);
      s.add(fresh.id);
      bom.push({ parent: l.parent, pos: String(s.size * 10).padStart(4, "0"), comp: fresh.id, qty: l.qty, uom: "EA", from: addDays(last, 1) });
    }
  }

  /* ---- the build plan, and stock set against what it needs ---- */
  const builds = [];
  for (const fg of fgs) {
    let any = false;
    weeks.forEach((_, w) => { if (r.chance(0.75)) { builds.push({ item: fg.id, week: w + 1, qty: 5 * r.int(1, 6) }); any = true; } });
    if (!any) builds.push({ item: fg.id, week: 1, qty: 5 * r.int(1, 6) });
  }
  const receipts = [];
  if (r.chance(0.5)) receipts.push({ item: r.pick(asms).id, week: r.int(1, S.weeks), qty: 5 * r.int(1, 4) });
  const gross = shortageCall({ items, bom, weeks, builds, receipts }).gross;
  const need = (id) => gross[id].reduce((a, b) => a + b, 0);
  for (const p of purch) {
    const total = need(p.id);
    const f = r.pick([0.2, 0.4, 0.6, 0.9, 1.2, 1.6]);
    p.onHand = total ? (p.unit === "EA" ? Math.round(total * f) : round1(total * f)) : r.int(0, 20);
  }
  const withReceipt = r.shuffle(purch.filter((p) => need(p.id) > 0)).slice(0, Math.ceil(purch.length * 0.4));
  for (const p of withReceipt) {
    const q = need(p.id) * r.pick([0.3, 0.5, 0.7]);
    receipts.push({ item: p.id, week: r.int(1, S.weeks), qty: p.unit === "EA" ? Math.max(1, Math.round(q)) : Math.max(0.5, round1(q)) });
  }
  if (on.uom) {
    const boxed = withReceipt.find((p) => p.unit === "EA");
    if (boxed) {
      const pack = r.pick(PACKS);
      boxed.conv = { BOX: pack };
      const rc = receipts.find((x) => x.item === boxed.id);
      rc.qty = Math.max(1, Math.ceil(rc.qty / pack));
      rc.uom = "BOX";
    }
  }
  if (on.negative) {
    const p = r.pick(purch.filter((x) => x.unit === "EA" && need(x.id) > 0));
    p.onHand = -r.int(5, 40);
    if (size !== "small") r.pick(asms).onHand = -r.int(3, 12);
  }

  /* ---- planning settings, for net requirements ---- */
  const settings = {};
  for (const p of purch) {
    const each = p.unit === "EA";
    settings[p.id] = {
      safetyStock: r.chance(0.5) ? 0 : each ? 5 * r.int(1, 6) : r.int(1, 4) / 2,
      leadWeeks: r.int(1, Math.min(3, S.weeks - 1)),
      minLot: r.chance(0.5) ? 0 : each ? 10 * r.int(2, 10) : 5 * r.int(1, 4),
      rounding: r.chance(0.5) ? 0 : each ? r.pick([10, 12, 25, 50]) : r.pick([0.5, 1, 5]),
    };
  }

  /* ---- open production orders, aged against the first Monday ---- */
  const asOf = weeks[0];
  const pdMats = r.shuffle([...fgs, ...asms]).slice(0, Math.max(2, Math.ceil(S.orders / 2)));
  const orders = [];
  for (let i = 0; i < S.orders; i++) {
    const m = r.pick(pdMats);
    const [lo, hi] = r.pick([[1, 7], [8, 30], [31, 90], [91, 200]]);
    orders.push({
      order: String(1000100 + 7 * i), plant: SITE, mat: m.id, desc: m.desc,
      qty: r.chance(0.2) ? r.int(2, 9) : 10 * r.int(2, 20), uom: "EA",
      due: addDays(asOf, -r.int(lo, hi)), category: r.chance(0.15) ? "PlOrd" : "PrdOrd",
    });
  }

  /* ---- two versions of the plan, the newer dated the first Monday ---- */
  const LINES = ["L1", "L2", "L3"];
  const span = 7 * S.weeks;
  let seq = 0, poN = 0;
  const newPo = () => String(4100000 + 13 * ++poN);
  const order = (o) => ({ platform: "NP", pvCode: "0001", pvText: "Standard", orderType: "", ...o, openQty: o.totalQty });
  const prev = [];
  const triples = new Set();
  while (prev.length < S.plan) {
    const m = r.pick(fgs).id, ln = r.pick(LINES), q = 10 * r.int(2, 15);
    if (triples.has(`${m}|${ln}|${q}`)) continue;
    triples.add(`${m}|${ln}|${q}`);
    prev.push(order({ po: newPo(), material: m, line: ln, schedDate: addDays(asOf, r.int(0, span - 1)), totalQty: q, orderType: r.chance(0.3) ? "FIRMED" : "", seq: ++seq }));
  }
  const early = order({ po: newPo(), material: r.pick(fgs).id, line: r.pick(LINES), schedDate: addDays(asOf, -r.int(2, 6)), totalQty: 10 * r.int(2, 15), seq: ++seq });
  prev.push(early);
  const next = prev.map((o) => ({ ...o }));
  const nextOf = new Map(next.map((o) => [o.po, o]));
  const dropped = new Set(), added = [];
  const KINDS = ["pullin", "pushout", "qty", "line", "version", "renumber", "canceled", "firm", "sameweek", "double"];
  const inWindow = r.shuffle(prev.filter((o) => o !== early));
  for (const o of inWindow.slice(0, Math.ceil(inWindow.length * 0.6))) {
    const n = nextOf.get(o.po);
    const day = (dayMs(o.schedDate) - dayMs(asOf)) / DAY, wk = Math.floor(day / 7);
    let kind = r.pick(KINDS);
    if (kind === "pullin" && wk === 0) kind = "pushout";
    if (kind === "firm" && o.orderType !== "") kind = "qty";
    if (kind === "pullin") n.schedDate = addDays(o.schedDate, -7 * r.int(1, Math.min(2, wk)));
    else if (kind === "pushout") n.schedDate = addDays(o.schedDate, 7 * r.int(1, 2));
    else if (kind === "qty") { n.totalQty = o.totalQty + 10 * r.pick([-1, 1, 2, 3]); n.openQty = n.totalQty; }
    else if (kind === "line") { n.line = r.pick(LINES.filter((l) => l !== o.line)); n.seq = ++seq; }
    else if (kind === "version") { n.pvText = "Alternate"; n.pvCode = "0002"; }
    else if (kind === "renumber") {
      dropped.add(o.po);
      const shift = day >= 3 ? r.int(-3, 3) : r.int(0, 3);
      added.push({ ...o, po: newPo(), schedDate: addDays(o.schedDate, shift), seq: ++seq });
    } else if (kind === "canceled") dropped.add(o.po);
    else if (kind === "firm") n.orderType = "FIRMED";
    else if (kind === "sameweek") { const d = day % 7; n.schedDate = addDays(o.schedDate, r.pick([0, 1, 2, 3, 4, 5, 6].filter((x) => x !== d)) - d); }
    else { n.schedDate = addDays(o.schedDate, 7); n.totalQty = o.totalQty + 10; n.openQty = n.totalQty; }
  }
  /* A new order's quantity ends in 5 and no earlier one's does, so a new order
     can never pass for a renumbered one. */
  for (let i = Math.max(1, Math.round(S.plan / 6)); i > 0; i--) {
    added.push(order({ po: newPo(), material: r.pick(fgs).id, line: r.pick(LINES), schedDate: addDays(asOf, r.int(0, span - 1)), totalQty: 10 * r.int(2, 15) + 5, seq: ++seq }));
  }
  const plan = { prevDate: addDays(asOf, -7), nextDate: asOf, prev, next: [...next.filter((o) => !dropped.has(o.po)), ...added] };

  /* ---- material rows for the setting audit ---- */
  const parents = {};
  for (const fg of fgs) {
    const inside = new Set(explodeBom({ items, bom, fg: fg.id, asOf, site: SITE }).rows.map((x) => x.comp));
    for (const id of inside) parents[id] = (parents[id] || 0) + 1;
  }
  const tierOf = () => { let t = r.int(1, TIER_WEIGHTS.reduce((a, [, w]) => a + w, 0)); for (const [k, w] of TIER_WEIGHTS) { t -= w; if (t <= 0) return k; } return "domestic"; };
  const rows = [];
  const row = (it, o) => {
    const daily = o.daily;
    const months = sixMonths(r, daily);
    const stock = o.stock;
    const price = r.int(20, 4000) / 100;
    rows.push({
      Material: it.id, Plant: SITE, "Material Description": it.desc, "Base Unit of Measure": it.unit,
      "ABC Indicator": o.abc, XYZ: o.xyz, "Procurement Type": o.proc, "Material Type": o.proc === "F" ? "ROH" : "HALB",
      "MRP Controller": o.controller, "MRP Type": r.chance(0.05) ? "ND" : "PD", "Lot Sizing Procedure": o.lp,
      Supplier: o.supplier || "", "Country/Region Key": o.country || "", "Country Goods Suppl.": "",
      "Planning time fence": o.ptf, "Safety Stock": o.ss, "Total Stock": stock, "Stock value": Math.round(stock * price * 100) / 100,
      "Minimum Lot Size": o.ml, "Rounding value": o.rv, "Moving price": price, "Value blocked sto": r.chance(0.12) ? r.int(500, 3000) : 0,
      ...Object.fromEntries(months.map((q, i) => [i ? `Con.quantity act.month+${i}` : "Con.quantity act.month", q])),
    });
  };
  const klass = () => (r.chance(0.08) ? ["", ""] : [r.pick(["A", "B", "C"]), r.pick(["X", "Y", "Z"])]);
  const near = (daily, days, mult = 1) => Math.ceil(Math.ceil(daily * days) * mult);
  for (const p of purch) {
    const tier = tierOf();
    const [supplier, country] = r.pick(SUPPLIERS[tier]);
    const [abc, xyz] = klass();
    const params = PM[tier][abc && xyz ? abc + xyz : "_d"] || PM[tier]._d;
    const dead = r.chance(0.08);
    const daily = dead ? 0 : r.int(1, 40);
    const pc = parents[p.id] || 0, mult = pc >= 20 ? 1.5 : pc >= 5 ? 1.2 : 1;
    row(p, {
      daily, abc, xyz, proc: "F", controller: "101", lp: params.lp, supplier, country,
      stock: dead ? 10 * r.int(1, 20) : Math.round(daily * 30 * r.pick([0.4, 0.8, 1.5, 3, 5, 8, 12])),
      ss: r.pick([0, near(daily, params.ss, mult), near(daily, params.ss, mult) * 2 + 5]),
      ml: r.pick([0, 0, Math.ceil(daily * params.lot), Math.ceil(daily * params.lot * 4) + 10]),
      rv: r.pick([0, 0, Math.ceil(daily * params.rnd), Math.ceil(daily * params.rnd) + 2 * daily + 1]),
      ptf: r.chance(0.1) ? 0 : r.chance(0.06) ? 365 : r.int(5, 60),
    });
  }
  for (const it of [...asms, ...phs]) {
    const [abc, xyz] = klass();
    const ph = it.kind === "PHANTOM";
    const daily = r.int(1, 20);
    const params = PM.inhouse[abc && xyz ? abc + xyz : "_d"] || PM.inhouse._d;
    row(it, {
      daily, abc, xyz, proc: "E", controller: ph ? "UFB" : "101", lp: ph ? "L4L" : params.lp,
      stock: ph ? 0 : Math.round(daily * 30 * r.pick([0.5, 1, 2])),
      ss: ph ? r.pick([0, 0, 5 * r.int(1, 4)]) : r.pick([0, near(daily, params.ss), near(daily, params.ss) + 3 * daily]),
      ml: ph ? r.pick([0, 0, 20]) : 0, rv: 0, ptf: r.int(5, 30),
    });
  }
  const audit = {
    rows,
    sets: { jit: SUPPLIERS.jit.map(([s]) => s), local: SUPPLIERS.local.map(([s]) => s), regional: SUPPLIERS.regional.map(([s]) => s) },
    parents,
  };

  return { seed: String(seed), size, traps: on, site: SITE, weeks, asOf, items, bom, builds, receipts, settings, orders, plan, audit };
}

/** The setting audit's context for a plant: supplier lists and each part's count of finished goods. */
export function auditCtx(pl) {
  const bomMap = {};
  for (const [id, pc] of Object.entries(pl.audit.parents)) bomMap[`${pl.site}::${id}`] = { pc, act: pc, po: 0, pop: 0, pip: 0, repl: false, top3: [], allParents: [], allOut: false };
  return { jitSet: new Set(pl.audit.sets.jit), localSet: new Set(pl.audit.sets.local), regSet: new Set(pl.audit.sets.regional), bomMap };
}

/** A plant's open orders as past-due triage reads them, each due date in milliseconds. */
export function triageOrders(pl) {
  return pl.orders.map((o) => ({ ...o, dueMs: dayMs(o.due) }));
}

/** Net requirements for one bought part: its settings, its stock, its receipts, and the gross the build plan puts on it. */
export function netInput(pl, id) {
  const it = pl.items.find((i) => i.id === id);
  if (!it || it.kind !== "PURCH") throw new Error(`${id} is not a bought part in this plant`);
  const gross = shortageCall({ items: pl.items, bom: pl.bom, weeks: pl.weeks, builds: pl.builds, receipts: pl.receipts }).gross[id];
  return {
    weeks: pl.weeks.length, unit: it.unit, conv: it.conv || {}, onHand: it.onHand,
    ...pl.settings[id], gross, receipts: pl.receipts.filter((x) => x.item === id).map(({ week, qty, uom }) => ({ week, qty, ...(uom ? { uom } : {}) })),
  };
}
