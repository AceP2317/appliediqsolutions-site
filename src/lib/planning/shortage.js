/* The shortage call. The build plan explodes through the bill of materials
   week by week, using only the lines in force on each week's Monday. An
   in-house assembly nets its stock and open orders, and what is left is built
   that same week. A phantom passes straight through and carries no stock. A
   bought part nets its stock and open receipts, with no new orders. It runs
   short in the first week its projected balance falls below zero, by the
   deepest deficit over the horizon. Pure, and it returns the arithmetic line by
   line beside the answer. */
import { r6, qty, signed, validOn, lineFactor } from "./shared.js";

export const KINDS = ["FG", "ASM", "PHANTOM", "PURCH"];

/** Depth of each item below the finished goods; a loop in the bill refuses. */
export function lowLevelCodes(items, bom) {
  const llc = new Map(items.map((i) => [i.id, 0]));
  for (let pass = 0; ; pass++) {
    if (pass > items.length) throw new Error("the bill of materials loops back on itself");
    let moved = false;
    for (const l of bom) {
      const d = llc.get(l.parent) + 1;
      if (d > llc.get(l.comp)) { llc.set(l.comp, d); moved = true; }
    }
    if (!moved) return llc;
  }
}

/**
 * @param {object} p
 * @param {{id: string, kind: string, unit: string, conv?: object, onHand?: number}[]} p.items
 * @param {{parent: string, comp: string, qty: number, uom?: string, from?: string, to?: string}[]} p.bom
 * @param {string[]} p.weeks    each week's Monday, "YYYY-MM-DD", week 1 first
 * @param {{item: string, week: number, qty: number}[]} p.builds   finished goods to build
 * @param {{item: string, week: number, qty: number, uom?: string}[]} [p.receipts]
 */
export function shortageCall(p) {
  const N = p.weeks.length;
  const byId = new Map(p.items.map((i) => [i.id, i]));
  for (const i of p.items) {
    if (!KINDS.includes(i.kind)) throw new Error(`${i.id} is of kind ${i.kind}, which the shortage call does not plan`);
    if (i.kind === "PHANTOM" && (i.onHand || 0) !== 0) throw new Error(`phantom ${i.id} carries stock, and the key does not decide how a phantom's stock is used`);
  }
  for (const l of p.bom) {
    if (!byId.has(l.parent) || !byId.has(l.comp)) throw new Error(`a bill line names ${byId.has(l.parent) ? l.comp : l.parent}, which is not an item`);
    if (byId.get(l.parent).kind === "PURCH") throw new Error(`bought part ${l.parent} has a bill of its own`);
    if (byId.get(l.comp).kind === "FG") throw new Error(`finished good ${l.comp} is used inside ${l.parent}`);
  }
  const llc = lowLevelCodes(p.items, p.bom);
  const zeros = () => Array(N).fill(0);
  const gross = Object.fromEntries(p.items.map((i) => [i.id, zeros()]));
  const receipts = Object.fromEntries(p.items.map((i) => [i.id, zeros()]));
  const lines = [];
  const wk = (w) => `week ${w + 1}`;

  for (const r of p.receipts || []) {
    const it = byId.get(r.item);
    if (!it) throw new Error(`a receipt names ${r.item}, which is not an item`);
    if (r.week < 1 || r.week > N) throw new Error(`a receipt in week ${r.week} falls outside weeks 1 to ${N}`);
    const f = lineFactor(r, it);
    const base = r6(r.qty * f);
    receipts[r.item][r.week - 1] = r6(receipts[r.item][r.week - 1] + base);
    lines.push(`Open receipt: ${r.item} ${qty(r.qty)} ${r.uom || it.unit}${f !== 1 ? ` × ${qty(f)} = ${qty(base)} ${it.unit}` : ""} in week ${r.week}.`);
  }

  const make = {};
  const order = [...p.items].sort((a, b) => llc.get(a.id) - llc.get(b.id) || a.id.localeCompare(b.id));
  const answer = [];
  for (const it of order) {
    const g = gross[it.id], rc = receipts[it.id];
    if (it.kind === "FG") {
      const m = zeros();
      for (const b of p.builds) if (b.item === it.id) {
        if (b.week < 1 || b.week > N) throw new Error(`a build in week ${b.week} falls outside weeks 1 to ${N}`);
        m[b.week - 1] = r6(m[b.week - 1] + b.qty);
      }
      make[it.id] = m;
      if (m.some((x) => x)) lines.push(`${it.id} builds ${m.map((x, w) => `${wk(w)} ${qty(x)}`).join(", ")}.`);
    } else if (it.kind === "PHANTOM") {
      make[it.id] = g.slice();
      if (g.some((x) => x)) lines.push(`${it.id} is a phantom: it carries no stock, so its requirement ${g.map((x, w) => `${wk(w)} ${qty(x)}`).join(", ")} passes straight to its components.`);
    } else if (it.kind === "ASM") {
      const m = zeros();
      let bal = it.onHand || 0;
      const parts = [];
      for (let w = 0; w < N; w++) {
        const avail = r6(bal + rc[w]);
        m[w] = r6(Math.max(0, g[w] - avail));
        const end = r6(avail + m[w] - g[w]);
        if (g[w] || rc[w] || bal) parts.push(`${wk(w)} ${signed(bal)} + ${qty(rc[w])} received against ${qty(g[w])} needed, build ${qty(m[w])}, ending ${signed(end)}`);
        bal = end;
      }
      make[it.id] = m;
      if (parts.length) lines.push(`${it.id} is an in-house assembly with ${qty(it.onHand || 0)} on hand: ${parts.join("; ")}.`);
    } else {
      let bal = it.onHand || 0, first = null, low = 0;
      const parts = [];
      for (let w = 0; w < N; w++) {
        const end = r6(bal + rc[w] - g[w]);
        if (end < 0 && first === null) first = w + 1;
        if (end < low) low = end;
        parts.push(`${wk(w)} ${signed(bal)} + ${qty(rc[w])} − ${qty(g[w])} = ${signed(end)}`);
        bal = end;
      }
      if (g.some((x) => x) || rc.some((x) => x) || (it.onHand || 0) < 0) {
        lines.push(`${it.id}, bought, ${qty(it.onHand || 0)} ${it.unit} on hand: ${parts.join("; ")}. ${first === null ? "Never below zero: not short." : `Short from week ${first}, by ${qty(-low)} ${it.unit} at the deepest.`}`);
      }
      if (first !== null) answer.push({ part: it.id, week: first, short: r6(-low) });
      continue;
    }
    for (const l of p.bom) {
      if (l.parent !== it.id) continue;
      const comp = byId.get(l.comp);
      const f = lineFactor(l, comp);
      const per = r6(l.qty * f);
      const used = [], skipped = [];
      for (let w = 0; w < N; w++) {
        if (!validOn(l, p.weeks[w])) { if (make[it.id][w]) skipped.push(`${wk(w)} (${p.weeks[w]})`); continue; }
        const add = r6(make[it.id][w] * per);
        gross[l.comp][w] = r6(gross[l.comp][w] + add);
        if (make[it.id][w]) used.push(`${wk(w)} ${qty(make[it.id][w])} × ${qty(per)} = ${qty(add)}`);
      }
      if (!used.length && !skipped.length) continue;
      const unitNote = f !== 1 ? ` (${qty(l.qty)} ${l.uom} = ${qty(per)} ${comp.unit})` : "";
      const window = l.from || l.to ? ` The line is in force ${l.from ? `from ${l.from}` : ""}${l.from && l.to ? " " : ""}${l.to ? `through ${l.to}` : ""}${skipped.length ? `, so it does not count in ${skipped.join(", ")}` : ""}.` : "";
      lines.push(`${it.id} → ${l.comp}, ${qty(per)} ${comp.unit} each${unitNote}: ${used.length ? used.join(", ") : "nothing in force"}.${window}`);
    }
  }
  answer.sort((a, b) => a.part.localeCompare(b.part));
  lines.push(answer.length ? `Short: ${answer.map((a) => `${a.part} from week ${a.week} by ${qty(a.short)}`).join("; ")}.` : "Nothing runs short.");
  return { answer, gross, lines };
}
