/* The lab's task set. A task is one family's question about one generated
   plant. It carries a seed, a size, the question as a planner would put it,
   the shape the answer must take, and the key the reply is scored against.
   Every rule the key uses is written into the question, because the test
   measures the model answering from the prompt alone.

   Public seeds are listed below, so anyone can rebuild their tasks and check
   the key. A private seed is made fresh for each job by privateSeed() and is
   never written into this repository. */
import { plant, seeded, auditCtx, triageOrders, netInput, dayMs, SIZES } from "../../lib/planning/plant.js";
import { workWhereUsed } from "../../lib/planning/bom.js";
import { workAuditRow, TASK_RULES, TGT, PM, fmt } from "../../lib/planning/setting-audit.js";
import { workTriage, CFG } from "../../lib/planning/past-due.js";
import { workPlanChange, normalize, CTX } from "../../lib/planning/plan-change.js";
import { netRequirements } from "../../lib/planning/net-requirements.js";
import { shortageCall } from "../../lib/planning/shortage.js";
import { money } from "../../lib/format.js";

export const PUBLIC_SEEDS = ["public-1", "public-2"];
export const PRIVATE_SEED = /\bjob-[0-9a-f]{16}\b/;
export const TOLERANCE = "within one part in ten thousand";

/** A seed for one job, never committed. */
export function privateSeed() {
  const b = new Uint8Array(8);
  globalThis.crypto.getRandomValues(b);
  return `job-${[...b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

/* ---------------------------------------------------------------- reading */
const num = (x) => String(Math.round(x * 1e6) / 1e6);
const toNum = (v) => (typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v.replace(/,/g, "")) : NaN);
const close = (a, b) => Number.isFinite(a) && Math.abs(a - b) <= 1e-6 + 1e-4 * Math.abs(b);

/** The answer inside a reply: the last fenced JSON block, or else the outermost JSON value in the text. */
export function parseReply(text) {
  const s = String(text ?? "");
  const fences = [...s.matchAll(/```(?:json)?[ \t]*\r?\n([\s\S]*?)```/gi)].map((m) => m[1]).reverse();
  for (const f of fences) {
    try { return { ok: true, value: JSON.parse(f) }; } catch { /* a fence that is not JSON: try the next */ }
  }
  const starts = [], ends = [];
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "{" || s[i] === "[") starts.push(i);
    else if (s[i] === "}" || s[i] === "]") ends.push(i);
  }
  let tries = 0;
  for (const a of starts) {
    for (let k = ends.length - 1; k >= 0 && ends[k] > a; k--) {
      if (++tries > 4000) return { ok: false };
      try { return { ok: true, value: JSON.parse(s.slice(a, ends[k] + 1)) }; } catch { /* not this span: keep looking */ }
    }
  }
  return { ok: false };
}

/* --------------------------------------------------------------- scoring */
/** A list scored entry by entry: 1 when right, 1/2 when the entry is named and its detail is wrong, extras counted against. */
function scoreList(value, key, { id, label, exact, detail }) {
  if (!Array.isArray(value)) return { score: 0, notes: ["the answer is not a list"] };
  const notes = [];
  const said = new Map();
  let extras = 0;
  for (const e of value) {
    if (!e || typeof e !== "object") { extras++; notes.push(`an entry is not an object: ${JSON.stringify(e)}`); continue; }
    const k = id(e);
    if (said.has(k)) { extras++; notes.push(`${label(e)} is named twice`); continue; }
    said.set(k, e);
  }
  let credit = 0;
  for (const k of key) {
    const e = said.get(id(k));
    if (!e) { notes.push(`${label(k)} is missing`); continue; }
    said.delete(id(k));
    if (exact(e, k)) credit += 1;
    else { credit += 0.5; notes.push(detail(e, k)); }
  }
  for (const e of said.values()) { extras++; notes.push(`${label(e)} is named and is not in the key`); }
  const denom = key.length + extras;
  return { score: denom ? credit / denom : 1, notes };
}

const scoreWhereUsed = (value, key) => scoreList(value, key, {
  id: (e) => String(e.fg),
  label: (e) => `finished good ${e.fg}`,
  exact: (e, k) => close(toNum(e.qty), k.qty),
  detail: (e, k) => `finished good ${k.fg}: said ${e.qty}, the key has ${num(k.qty)}`,
});

function scoreAudit(value, key) {
  if (!Array.isArray(value) || value.some((v) => typeof v !== "string")) return { score: 0, notes: ["the answer is not a list of finding codes"] };
  const said = new Set(value.map((v) => v.trim().toUpperCase()));
  const k = new Set(key);
  const notes = [];
  for (const c of k) if (!said.has(c)) notes.push(`${c} fires and was not named`);
  for (const c of said) if (!k.has(c)) notes.push(`${c} was named and does not fire`);
  const both = [...k].filter((c) => said.has(c)).length;
  const either = new Set([...k, ...said]).size;
  return { score: either ? both / either : 1, notes };
}

function scoreTriage(value, key) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { score: 0, notes: ["the answer is not an object of order numbers"] };
  const notes = [];
  const ids = Object.keys(key);
  let right = 0;
  for (const id of ids) {
    const v = value[id];
    const s = typeof v === "string" ? v.trim().toUpperCase() : v;
    if (s === key[id]) right++;
    else notes.push(v == null ? `order ${id} has no disposition` : `order ${id}: said ${v}, the key has ${key[id]}`);
  }
  return { score: right / ids.length, notes };
}

const scoreChange = (value, key) => scoreList(value, key, {
  id: (e) => `${e.po}|${String(e.type).toLowerCase()}`,
  label: (e) => `order ${e.po} as ${e.type}`,
  exact: (e, k) => close(toNum(e.units), k.units),
  detail: (e, k) => `order ${k.po} as ${k.type}: said ${e.units} units, the key has ${num(k.units)}`,
});

function scoreNet(value, key) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { score: 0, notes: ["the answer is not an object with net, plannedReceipts, releases and late"] };
  const notes = [], parts = [];
  for (const f of ["net", "plannedReceipts", "releases"]) {
    const a = value[f];
    if (!Array.isArray(a)) { parts.push(0); notes.push(`${f} is missing`); continue; }
    if (a.length !== key[f].length) notes.push(`${f} lists ${a.length} weeks, not ${key[f].length}`);
    let ok = 0;
    key[f].forEach((x, i) => {
      if (close(toNum(a[i]), x)) ok++;
      else notes.push(`${f} week ${i + 1}: said ${a[i]}, the key has ${num(x)}`);
    });
    parts.push(ok / key[f].length);
  }
  const lateOk = close(toNum(value.late), key.late);
  if (!lateOk) notes.push(`late: said ${value.late}, the key has ${num(key.late)}`);
  parts.push(lateOk ? 1 : 0);
  return { score: parts.reduce((a, b) => a + b, 0) / parts.length, notes };
}

const scoreShortage = (value, key) => scoreList(value, key, {
  id: (e) => String(e.part),
  label: (e) => `part ${e.part}`,
  exact: (e, k) => toNum(e.week) === k.week && close(toNum(e.short), k.short),
  detail: (e, k) => `part ${k.part}: said week ${e.week} short ${e.short}, the key has week ${k.week} short ${num(k.short)}`,
});

/* ------------------------------------------------------------- the plant, in words */
const KIND_WORDS = {
  FG: "finished good",
  ASM: "assembly built in-house",
  PHANTOM: "phantom assembly, never stocked, so its components are planned straight through it",
  PURCH: "bought part",
};
function itemLines(pl, { stock }) {
  return pl.items.map((it) => {
    const conv = it.conv ? ` (${Object.entries(it.conv).map(([u, f]) => `1 ${u} = ${num(f)} ${it.unit}`).join("; ")})` : "";
    const held = stock && it.kind !== "FG" ? `, on hand ${num(it.onHand || 0)} ${it.unit}` : "";
    return `- ${it.id} ${it.desc}: ${KIND_WORDS[it.kind]}, kept in ${it.unit}${conv}${held}`;
  });
}
function billLines(pl) {
  const parents = pl.items.filter((i) => pl.bom.some((l) => l.parent === i.id));
  return parents.map((p) => {
    const ls = pl.bom.filter((l) => l.parent === p.id).map((l) => {
      const dated = l.from || l.to ? ` (in force ${[l.from && `from ${l.from}`, l.to && `through ${l.to}`].filter(Boolean).join(" ")})` : "";
      return `${l.comp} ${num(l.qty)} ${l.uom}${dated}`;
    });
    return `- each ${p.id} takes: ${ls.join("; ")}`;
  });
}
const weekLines = (pl) => pl.weeks.map((d, i) => `week ${i + 1} starts Monday ${d}`).join("; ");
const OPEN = "You are planning at a manufacturing plant. Work only from what is given here.";
const askFor = (shape) => `Reply with JSON only, in exactly this shape: ${shape}`;

/* ------------------------------------------------------------- the families */
const has = (pl, id, test) => pl.bom.some((l) => l.comp === id && test(l));

const bom = {
  name: "Where a part is used",
  shape: '[{"fg": "FG-1", "qty": 2.5}]',
  partial: `Each finished good in the key earns 1 when named with the right quantity and 1/2 when named with the wrong one. The total is divided by the key's count plus every finished good named that is not in the key, so naming one too many costs as much as leaving one out. An empty key scores 1 for an empty list and 0 for anything else. Numbers match ${TOLERANCE}.`,
  build(pl, r) {
    const asOf = r.pick(pl.weeks);
    const base = { items: pl.items, bom: pl.bom, asOf, site: pl.site };
    const kindOf = new Map(pl.items.map((i) => [i.id, i]));
    const used = pl.items.filter((i) => i.kind === "PURCH").filter((p) => workWhereUsed({ ...base, comp: p.id }).answer.length);
    const tagged = used.filter((p) => has(pl, p.id, (l) => l.uom !== p.unit || l.from || l.to || kindOf.get(l.parent).kind === "PHANTOM"));
    const p = r.pick(tagged.length && r.chance(0.75) ? tagged : used);
    const w = workWhereUsed({ ...base, comp: p.id });
    const question = [
      OPEN,
      `At plant ${pl.site}, as of ${asOf}, which finished goods use bought part ${p.id} (${p.desc}), and how much of it goes into one of each?`,
      "", "Items:", ...itemLines(pl, { stock: false }),
      "", "Bills of material, each line per one of its parent:", ...billLines(pl),
      "", "Rules:",
      "- Follow every path from the finished good down to the part, through assemblies and phantoms alike. Multiply the quantities along a path, and add the paths together.",
      `- A line marked in force from or through a date counts only when ${asOf} falls inside its dates. Both ends count as inside.`,
      `- Give each quantity in the part's own unit, ${p.unit}. A line in another unit converts at the factor shown for the part.`,
      "- List only the finished goods that use some of the part.",
      "", askFor(this.shape),
    ].join("\n");
    return { question, key: w.answer, lines: w.lines, about: `${p.id} as of ${asOf}` };
  },
  score: scoreWhereUsed,
};

function policyLines(pl) {
  const t = Object.entries(TGT).map(([k, v]) => `${k} ${num(v.d)}`).join(", ");
  const table = Object.entries(PM).map(([tier, segs]) => `- ${tier}: ${Object.entries(segs).map(([s, p]) => `${s === "_d" ? "no class" : s} ${num(p.ss)}/${num(p.lot)}/${num(p.rnd)}`).join("; ")}`);
  return [
    "Policy:",
    "1. Monthly use is the six months' total divided by 6, and daily use is monthly use divided by 30. A material with no use, no stock and nothing blocked raises nothing.",
    "2. A material made in-house (procurement E) under MRP controller UFB is a phantom. A phantom with use raises PHNTM when it carries any safety stock or any minimum lot, and a phantom raises nothing else.",
    `3. The sourcing tier of a bought material (procurement F) comes from its supplier: on the release-supplier list (${pl.audit.sets.jit.join(", ")}) it is jit, on the local list (${pl.audit.sets.local.join(", ")}) local, on the regional list (${pl.audit.sets.regional.join(", ")}) regional. Any other supplier goes by the country it ships from: US is domestic, any other country is overseas, and no country is unknown. A material made in-house that is not a phantom is inhouse.`,
    `4. Days of supply targeted by tier: ${t}.`,
    "5. The class is the ABC class and the XYZ class together, such as BY. When either is missing, the tier's \"no class\" row applies. Days of safety stock / lot / rounding by tier and class:",
    ...table,
    "6. The parent multiplier is 1.5 when the material goes into 20 or more finished goods, 1.2 when it goes into 5 or more, and 1 otherwise.",
    "7. For a bought material with use and an MRP type other than ND:",
    "   - SS: the target is daily use times the safety-stock days, rounded up to a whole number, then times the parent multiplier, rounded up again. SS fires when the target and the safety stock differ by more than half a day's use.",
    "   - MOQ: when a minimum lot is set, MOQ fires when it is more than daily use times the lot days times 3.",
    "   - RND: when a rounding value is set, its target is daily use times the rounding days, rounded up. RND fires when the rounding value and its target differ by more than one day's use.",
    "   - PTF fires when the planning time fence is 0 days, or 333 days or more.",
    `   - OVER: months on hand are stock divided by monthly use. When that is more than 6, keep = monthly use times the tier's target days divided by 30 times 1.5, and excess = stock minus keep, never below zero. Unit cost is the stock value divided by the stock, or the moving price when there is no stock. OVER fires when the excess times the unit cost is more than ${fmt(100)}.`,
    "   - UNDER fires when months on hand are more than 0 and less than 1, and the safety stock is 0.",
    "8. For a material made in-house that is not a phantom, with use and an MRP type other than ND, only SS applies, worked as in 7, and only for an A-class material.",
    `9. For every material that is not a phantom: DEAD fires when there is stock and no use in six months, and BLK fires when the blocked stock is valued at more than ${fmt(1000)}.`,
  ];
}
const MONTH_COLS = ["Con.quantity act.month", "Con.quantity act.month+1", "Con.quantity act.month+2", "Con.quantity act.month+3", "Con.quantity act.month+4", "Con.quantity act.month+5"];
const audit = {
  name: "Planning-setting audit",
  shape: '["OVER", "SS"]',
  partial: "The answer is scored by overlap: the findings named correctly, divided by every finding that is in the key or was named. A material with no findings scores 1 only for an empty list.",
  build(pl, r) {
    const ctx = auditCtx(pl);
    const all = pl.audit.rows.map((row) => ({ row, w: workAuditRow(row, ctx) }));
    const firing = all.filter((x) => x.w.answer.length);
    const { row, w } = r.pick(firing.length && !r.chance(1 / 6) ? firing : all);
    const v = (k) => row[k];
    const cls = v("ABC Indicator") || v("XYZ") ? `ABC class ${v("ABC Indicator") || "none"}, XYZ class ${v("XYZ") || "none"}` : "no ABC or XYZ class set";
    const proc = v("Procurement Type") === "F" ? "bought (F)" : "made in-house (E)";
    const who = v("Procurement Type") === "F" ? `- Supplier ${v("Supplier")}, shipping from ${v("Country Goods Suppl.") || v("Country/Region Key") || "no country given"}` : null;
    const question = [
      OPEN,
      `Audit the planning settings of one material at plant ${pl.site} against the policy below, and say which findings it raises.`,
      "", "The material:",
      `- ${v("Material")} ${v("Material Description")}: ${proc}, MRP controller ${v("MRP Controller")}, MRP type ${v("MRP Type")}, kept in ${v("Base Unit of Measure")}`,
      ...(who ? [who] : []),
      `- ${cls}`,
      `- Use in each of the last six months: ${MONTH_COLS.map((c) => num(v(c) || 0)).join(", ")}`,
      `- Total stock ${num(v("Total Stock"))}, valued at ${money(v("Stock value"), { cents: true })}; moving price ${money(v("Moving price"), { cents: true })}`,
      `- Safety stock ${num(v("Safety Stock"))}; minimum lot ${num(v("Minimum Lot Size"))}; rounding value ${num(v("Rounding value"))}; planning time fence ${num(v("Planning time fence"))} days`,
      `- Blocked stock valued at ${money(v("Value blocked sto"), { cents: true })}`,
      (() => { const n = pl.audit.parents[v("Material")] || 0; return `- It goes into ${n} finished good${n === 1 ? "" : "s"}.`; })(),
      "", ...policyLines(pl),
      "", `Name only these findings: ${TASK_RULES.join(", ")}.`,
      askFor(this.shape),
    ].join("\n");
    return { question, key: w.answer, lines: w.lines, about: v("Material") };
  },
  score: scoreAudit,
};

const triage = {
  name: "Past-due triage",
  shape: '{"1000100": "TECO", "1000107": "RESCHEDULE"}',
  partial: "Each order earns 1 for the right disposition, and the score is the share of orders right.",
  build(pl) {
    const orders = triageOrders(pl);
    const w = workTriage(orders, dayMs(pl.asOf));
    const question = [
      OPEN,
      `These production orders are open at plant ${pl.site} as of ${pl.asOf}. Give each one exactly one disposition.`,
      "", "Orders (order, material, quantity, due date, category; PrdOrd is a production order, PlOrd a firmed planned order):",
      ...pl.orders.map((o) => `- ${o.order}, ${o.mat} ${o.desc}, ${num(o.qty)} ${o.uom}, due ${o.due}, ${o.category}`),
      "", "Rules, in order. The first rule that fits decides:",
      "1. A firmed planned order (PlOrd): UNFIRM_PLORD.",
      `2. More than ${CFG.TECO_DAYS} days past due: TECO.`,
      `3. More than ${CFG.SUPERSEDED_MIN_DAYS} days past due, when another order for the same material is due later with a quantity no smaller: TECO.`,
      `4. From ${CFG.LATE_MIN} to ${CFG.LATE_MAX} days past due, when the material has two or more orders in the list and this one's quantity is no more than ${num(CFG.PARTIAL_FRACTION)} times the material's largest: VERIFY_PARTIAL.`,
      `5. From ${CFG.LATE_MIN} to ${CFG.LATE_MAX} days past due: RESCHEDULE.`,
      "6. Anything else: EXPEDITE_LEAVE.",
      `Days past due are ${pl.asOf} minus the due date, in whole days. A material's orders are every order in the list for it, of either category.`,
      "", askFor(this.shape),
    ].join("\n");
    return { question, key: w.answer, lines: w.lines, about: `${pl.orders.length} orders` };
  },
  score: scoreTriage,
};

const change = {
  name: "Plan-change reading",
  shape: '[{"po": "4100013", "type": "pushout", "units": 80}]',
  partial: `Each change in the key earns 1 when named with its order, kind and units, and 1/2 when the order and kind are right and the units are not. The total is divided by the key's count plus every change named that is not in the key. Numbers match ${TOLERANCE}.`,
  build(pl) {
    const prev = pl.plan.prev.map(normalize), next = pl.plan.next.map(normalize);
    const w = workPlanChange(prev, next, pl.plan.nextDate, CTX);
    const row = (o) => `- ${o.po}, ${o.material}, line ${o.line}, ${o.schedDate}, ${num(o.totalQty)}, version ${o.pvText}, ${o.orderType === "FIRMED" ? "firmed" : "not firmed"}`;
    const anchorMonday = pl.plan.nextDate;
    const question = [
      OPEN,
      `Two versions of the production plan at plant ${pl.site}: the older pulled ${pl.plan.prevDate}, the newer pulled ${pl.plan.nextDate}. List every change between them.`,
      "", "Older version (order, material, line, scheduled date, quantity, production version, firmed or not):", ...pl.plan.prev.map(row),
      "", "Newer version:", ...pl.plan.next.map(row),
      "", "Rules:",
      `- Count only orders scheduled in the week starting Monday ${anchorMonday} or later, in either version. Weeks run Monday to Sunday.`,
      "- Match orders between the versions by order number first.",
      "- An order that went from not firmed to firmed has taken a step in its life rather than changed: leave it out.",
      "- For any other order in both versions, report the first of these that differs. Its week: pullin when earlier, pushout when later. Then its quantity: qty. Then its line: line. Then its production version: version. A move inside the same week is not a change.",
      `- An order only in the older version and an order only in the newer version, with the same material, line and quantity and scheduled no more than ${CTX.renumberWindowDays} days apart, are one order re-keyed: renumber, reported under the newer order number.`,
      "- Any other order only in the newer version is added. Any other order only in the older version is canceled.",
      "- Units: for qty, the size of the difference; for renumber, 0; for added, the newer quantity; for every other kind, the older quantity.",
      "", askFor(this.shape),
    ].join("\n");
    return { question, key: w.answer, lines: w.lines, about: `${pl.plan.prev.length} and ${pl.plan.next.length} orders` };
  },
  score: scoreChange,
};

const net = {
  name: "Net requirements",
  shape: '{"net": [0, 5, 0], "plannedReceipts": [0, 40, 0], "releases": [40, 0, 0], "late": 0}',
  partial: `The three weekly rows and the late total are scored apart, each as its share of values right, and the score is their average. Numbers match ${TOLERANCE}.`,
  build(pl, r) {
    const bought = pl.items.filter((i) => i.kind === "PURCH").map((p) => ({ p, input: netInput(pl, p.id) })).filter((x) => x.input.gross.some((g) => g > 0));
    const tagged = bought.filter(({ p, input }) => p.onHand < 0 || input.receipts.some((x) => x.uom && x.uom !== p.unit) || input.minLot || input.rounding);
    const { p, input } = r.pick(tagged.length && r.chance(0.75) ? tagged : bought);
    const w = netRequirements(input);
    const conv = Object.keys(input.conv).length ? ` (${Object.entries(input.conv).map(([u, f]) => `1 ${u} = ${num(f)} ${input.unit}`).join("; ")})` : "";
    const question = [
      OPEN,
      `Plan net requirements for bought part ${p.id} (${p.desc}) at plant ${pl.site} over the next ${input.weeks} weeks.`,
      "",
      `- Kept in ${input.unit}${conv}.`,
      `- On hand as booked: ${num(input.onHand)} ${input.unit}. A booked balance can be below zero.`,
      `- Safety stock ${num(input.safetyStock || 0)}; lead time ${input.leadWeeks || 0} week${input.leadWeeks === 1 ? "" : "s"}; minimum lot ${num(input.minLot || 0)}; rounding multiple ${num(input.rounding || 0)}. A minimum lot or rounding multiple of 0 means none.`,
      `- Gross requirements by week: ${input.gross.map((g, i) => `week ${i + 1} ${num(g)}`).join(", ")}.`,
      `- Open receipts: ${input.receipts.length ? input.receipts.map((x) => `week ${x.week} ${num(x.qty)} ${x.uom || input.unit}`).join(", ") : "none"}.`,
      "", "Rules, week by week from week 1:",
      `- Available is the balance carried in plus the receipts due that week, in ${input.unit}. Week 1's balance carried in is the stock on hand.`,
      "- The net requirement is gross plus safety stock minus available, or 0 when that is below 0.",
      "- When the net requirement is above 0, plan a receipt that week: the net requirement, raised to the minimum lot when it is below it, then rounded up to a whole multiple of the rounding multiple.",
      "- Release each planned receipt its lead time earlier. When that falls before week 1, the receipt is late: add it to late, and it has no release.",
      "- The balance carried out is available plus the planned receipt minus gross.",
      "", askFor(this.shape),
    ].join("\n");
    return { question, key: w.answer, lines: w.lines, about: p.id };
  },
  score: scoreNet,
};

const shortage = {
  name: "The shortage call",
  shape: '[{"part": "P-03", "week": 1, "short": 90}]',
  partial: `Each short part in the key earns 1 when named with its first short week and its deepest shortfall, and 1/2 when the part is right and either is wrong. The total is divided by the key's count plus every part named that is not in the key. An empty key scores 1 for an empty list and 0 for anything else. Numbers match ${TOLERANCE}.`,
  build(pl) {
    const w = shortageCall({ items: pl.items, bom: pl.bom, weeks: pl.weeks, builds: pl.builds, receipts: pl.receipts });
    const fgs = pl.items.filter((i) => i.kind === "FG");
    const question = [
      OPEN,
      `Here is plant ${pl.site}'s build plan for the next ${pl.weeks.length} weeks, with its bills of material, stock and open receipts. Which bought parts run short? For each, give the first week it runs short and its deepest shortfall over the ${pl.weeks.length} weeks.`,
      "", `Weeks: ${weekLines(pl)}.`,
      "", "Items:", ...itemLines(pl, { stock: true }),
      "", "Bills of material, each line per one of its parent:", ...billLines(pl),
      "", "Build plan:", ...fgs.map((f) => `- ${f.id}: ${pl.weeks.map((_, i) => `week ${i + 1} ${num(pl.builds.filter((b) => b.item === f.id && b.week === i + 1).reduce((a, b) => a + b.qty, 0))}`).join(", ")}`),
      "", `Open receipts: ${pl.receipts.length ? pl.receipts.map((x) => `${x.item} week ${x.week} ${num(x.qty)} ${x.uom || pl.items.find((i) => i.id === x.item).unit}`).join("; ") : "none"}.`,
      "", "Rules:",
      "- Work week by week. A bill line counts in a week only when it is in force on that week's Monday. Both ends of its dates count as in force.",
      "- Everything happens in the week of the build: there is no lead-time offset.",
      "- An assembly built in-house nets its stock as booked, which can be below zero, and its open receipts. Each week it builds whatever its requirement exceeds what it has available, and carries any rest forward. What it builds drives its components that same week.",
      "- A phantom carries no stock. Its requirement passes straight to its components that same week.",
      "- Convert every quantity into the component's own unit with the factor shown for it.",
      "- A bought part gets no new orders. Its balance is its stock on hand plus its receipts so far minus its requirements so far. It runs short from the first week that balance falls below zero, by the most negative balance over the weeks, given as a positive number.",
      "- List only the parts that run short.",
      "", askFor(this.shape),
    ].join("\n");
    return { question, key: w.answer, lines: w.lines, about: `${fgs.length} finished goods` };
  },
  score: scoreShortage,
};

export const FAMILIES = { bom, audit, triage, change, net, shortage };

/** One task: one family's question about the plant one seed builds. */
export function buildTask(family, size, seed) {
  const f = FAMILIES[family];
  if (!f) throw new Error(`family "${family}" is not one of ${Object.keys(FAMILIES).join(", ")}`);
  const pl = plant(seed, size);
  const r = seeded(`${seed}/${size}/${family}`);
  const t = f.build(pl, r);
  return { id: `${family}-${size}-${seed}`, family, name: f.name, size, seed: String(seed), question: t.question, shape: f.shape, partial: f.partial, key: t.key, lines: t.lines, about: t.about };
}

/** Every family at every size, for each seed given. */
export function taskSet(seeds = PUBLIC_SEEDS, sizes = Object.keys(SIZES)) {
  return seeds.flatMap((s) => sizes.flatMap((z) => Object.keys(FAMILIES).map((f) => buildTask(f, z, s))));
}

/** A reply scored against its task: a share from 0 to 1, and a note naming each error. */
export function scoreReply(task, text) {
  const got = parseReply(text);
  if (!got.ok) return { score: 0, notes: ["no JSON answer was found in the reply"] };
  return FAMILIES[task.family].score(got.value, task.key);
}
