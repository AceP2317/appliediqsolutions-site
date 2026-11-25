/* Bill-of-materials explosion and where-used. Pure: long-format extract rows
   in, answers out. A row is one BOM position: { site, mat, level, item, comp,
   qty, proc, pii, asm, ... }, in traversal order within each (site, mat). */
import { r6, qty, validOn, lineFactor } from "./shared.js";

// ---- stable, content-derived row id (never index-derived) ---------------------
export function rowId(r) {
  const s = `${r.site}|${r.mat}|${r.level}|${r.item}|${r.comp}|${r.qty}|${r.seq}`;
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return "r" + (h >>> 0).toString(36);
}

// ---- derive parent material per row via a level stack (order-dependent) -------
// In long-format, a row's parent is the nearest preceding row one level shallower
// WITHIN the same (site, FG) block. The stack reconstruction is what makes
// per-unit quantity math possible.
export function deriveParents(rows) {
  const out = [];
  let stack = [];          // stack[level] = { comp, qty }
  let curKey = null;
  for (const r of rows) {
    const key = r.site + "|" + r.mat;
    if (key !== curKey) { stack = []; curKey = key; }
    const rr = { ...r, id: rowId(r), parent: r.level === 1 ? r.mat : (stack[r.level - 1]?.comp ?? r.mat) };
    stack[r.level] = { comp: r.comp, qty: r.qty };
    stack.length = r.level + 1;   // drop anything deeper
    out.push(rr);
  }
  return out;
}

// ---- classification: every row lands in exactly ONE bucket (a partition) ------
export const BUCKETS = ["document", "phantom", "assembly", "purchased", "in_house", "unclassified"];
export function classify(r) {
  if (!r.comp) return "document";          // no component number -> text/drawing
  if (r.pii === "X") return "phantom";     // phantom assembly
  if (r.asm === "X") return "assembly";    // real sub-assembly
  if (r.proc === "F" || r.proc === "X") return "purchased";
  if (r.proc === "E") return "in_house";
  return "unclassified";                   // honest bucket: has a comp but no proc signal
}

// ---- where-used: for a component, all FGs + usage paths + per-FG-unit qty ------
// Walks each (site, FG) block, maintaining the level stack; when the target
// component is hit, multiplies Component Qty up the chain to get per-FG-unit qty
// and records the path. Sums across every path within an FG. Keyed (site, FG).
export function whereUsed(rows, target) {
  if (!target) return [];
  const byKey = new Map();   // `${site}|${fg}` -> { site, fg, fgDesc, totalQty, paths:[] }
  let stack = [];            // stack[level] = { comp, compDesc, qty }
  let curKey = null;
  for (const r of rows) {
    const blockKey = r.site + "|" + r.mat;
    if (blockKey !== curKey) { stack = []; curKey = blockKey; }
    stack[r.level] = { comp: r.comp, compDesc: r.compDesc, qty: r.qty };
    stack.length = r.level + 1;
    if (r.comp === target) {
      let q = 1;
      const path = [{ comp: r.mat, desc: r.matDesc, qty: null }];
      for (let lv = 1; lv <= r.level; lv++) {
        const s = stack[lv];
        q *= s.qty;
        path.push({ comp: s.comp, desc: s.compDesc, qty: s.qty });
      }
      const k = r.site + "|" + r.mat;
      if (!byKey.has(k)) byKey.set(k, { site: r.site, fg: r.mat, fgDesc: r.matDesc, totalQty: 0, paths: [] });
      const e = byKey.get(k);
      e.totalQty += q;
      e.paths.push({ qty: q, level: r.level, path });
    }
  }
  return Array.from(byKey.values()).sort((a, b) => (a.site === b.site ? a.fg.localeCompare(b.fg) : a.site.localeCompare(b.site)));
}

// ---- per-unit qty for one (FG, component) in one site (sum across paths) ------
export function pathQty(rows, site, fg, target) {
  let total = 0, paths = 0;
  let stack = [], curKey = null;
  for (const r of rows) {
    if (r.site !== site) continue;
    const blockKey = r.site + "|" + r.mat;
    if (blockKey !== curKey) { stack = []; curKey = blockKey; }
    stack[r.level] = r.qty;
    stack.length = r.level + 1;
    if (r.mat === fg && r.comp === target) {
      let q = 1;
      for (let lv = 1; lv <= r.level; lv++) q *= stack[lv];
      total += q; paths++;
    }
  }
  return { total, paths };
}

// ---- BOM tree: the explosion for one (site, FG), already in traversal order ----
export function bomTree(rows, site, fg) {
  return rows.filter((r) => r.site === site && r.mat === fg);
}

// ---- summary stats ------------------------------------------------------------
export function summarize(rows) {
  const counts = Object.fromEntries(BUCKETS.map((b) => [b, 0]));
  let neg = 0;
  const fgs = new Set(), comps = new Set();
  for (const r of rows) {
    counts[classify(r)]++;
    if (Number(r.qty) < 0) neg++;
    fgs.add(r.site + "|" + r.mat);
    if (r.comp) comps.add(r.comp);
  }
  return { total: rows.length, counts, neg, fgCount: fgs.size, compCount: comps.size };
}

// ---- explosion of a single-level bill into long-format rows, as of one day ---
// items: [{ id, desc, kind: FG|ASM|PHANTOM|PURCH, unit, conv }]; bom lines:
// [{ parent, pos, comp, qty, uom, from, to }]. Quantities land in the
// component's base unit, and a line not in force on the day is left out with
// everything beneath it. Returns the rows pathQty and whereUsed read.
export function explodeBom({ items, bom, fg, asOf, site }) {
  const byId = new Map(items.map((i) => [i.id, i]));
  const top = byId.get(fg);
  if (!top) throw new Error(`${fg} is not an item`);
  const rows = [], lines = [];
  const visit = (parent, level, trail) => {
    if (level > 40) throw new Error(`the bill under ${fg} loops back on itself`);
    for (const l of bom) {
      if (l.parent !== parent) continue;
      const comp = byId.get(l.comp);
      if (!comp) throw new Error(`a bill line under ${parent} names ${l.comp}, which is not an item`);
      if (!validOn(l, asOf)) {
        lines.push(`${parent} → ${l.comp} (position ${l.pos}) is in force ${l.from ? `from ${l.from}` : ""}${l.from && l.to ? " " : ""}${l.to ? `through ${l.to}` : ""}, so on ${asOf} it is left out, with anything beneath it.`);
        continue;
      }
      const f = lineFactor(l, comp);
      const q = r6(l.qty * f);
      if (f !== 1) lines.push(`${parent} → ${l.comp}: ${qty(l.qty)} ${l.uom} is ${qty(l.qty)} × ${qty(f)} = ${qty(q)} ${comp.unit}.`);
      rows.push({
        site, mat: fg, matDesc: top.desc || "", level, item: l.pos, comp: l.comp, compDesc: comp.desc || "",
        qty: q, uom: comp.unit, proc: comp.kind === "PURCH" ? "F" : "E",
        pii: comp.kind === "PHANTOM" ? "X" : "", asm: comp.kind === "ASM" ? "X" : "", seq: rows.length,
      });
      visit(l.comp, level + 1, trail.concat(l.comp));
    }
  };
  visit(fg, 1, [fg]);
  return { rows, lines };
}

/** How many base units of comp go into one fg on asOf, every path summed, with its arithmetic. */
export function workPathQty({ items, bom, fg, comp, asOf, site }) {
  const { rows, lines: walked } = explodeBom({ items, bom, fg, asOf, site });
  /* Keep only the conversions and cut-offs on a path down to comp. */
  const reaches = new Set([comp]);
  for (let grew = true; grew; ) {
    grew = false;
    for (const l of bom) if (reaches.has(l.comp) && !reaches.has(l.parent)) { reaches.add(l.parent); grew = true; }
  }
  const lines = walked.filter((l) => [...reaches].some((id) => l.includes(`→ ${id}:`) || l.includes(`→ ${id} (`)));
  const unit = (items.find((i) => i.id === comp) || {}).unit || "";
  const hit = whereUsed(rows, comp).find((e) => e.fg === fg);
  const products = [];
  for (const p of hit ? hit.paths : []) {
    const steps = p.path.slice(1);
    lines.push(`Path ${[fg, ...steps.map((s) => `${s.comp} (${qty(s.qty)})`)].join(" → ")}: ${steps.map((s) => qty(s.qty)).join(" × ")} = ${qty(p.qty)} ${unit}.`);
    products.push(p.qty);
  }
  const total = r6(pathQty(rows, site, fg, comp).total);
  lines.push(products.length ? `One ${fg} takes ${products.length > 1 ? `${products.map(qty).join(" + ")} = ` : ""}${qty(total)} ${unit} of ${comp} on ${asOf}.` : `${fg} does not use ${comp} on ${asOf}.`);
  return { answer: total, lines };
}

/** Which finished goods use comp on asOf, and how much per unit, with its arithmetic. */
export function workWhereUsed({ items, bom, comp, asOf, site }) {
  const unit = (items.find((i) => i.id === comp) || {}).unit || "";
  const fgs = items.filter((i) => i.kind === "FG").map((i) => i.id).sort();
  const answer = [], lines = [];
  for (const fg of fgs) {
    const w = workPathQty({ items, bom, fg, comp, asOf, site });
    if (w.answer > 0) { answer.push({ fg, qty: w.answer }); lines.push(...w.lines); }
    else lines.push(`${fg} does not use ${comp} on ${asOf}.`);
  }
  lines.push(answer.length ? `${comp} is used in ${answer.map((a) => `${a.fg} (${qty(a.qty)} ${unit} each)`).join(", ")}.` : `No finished good uses ${comp} on ${asOf}.`);
  return { answer, lines };
}
