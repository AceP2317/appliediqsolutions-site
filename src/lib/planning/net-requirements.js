/* Net requirements for one item, week by week. Gross requirements are held
   against stock as booked and open receipts, with a safety stock kept. Each
   shortfall is covered by a planned order raised to the minimum lot and then to
   the rounding multiple, and released its lead time earlier. An order whose
   release would fall before week 1 is counted as late. Pure, and it returns the
   arithmetic line by line beside the answer. */
import { r6, qty, signed } from "./shared.js";

/**
 * @param {object} p
 * @param {number} p.weeks            weekly buckets, week 1 first
 * @param {string} p.unit             the item's base unit
 * @param {Object<string, number>} [p.conv]  base units in one of another unit, e.g. { BOX: 50 }
 * @param {number} p.onHand           stock as booked, a negative balance included
 * @param {number} [p.safetyStock]
 * @param {number} [p.leadWeeks]
 * @param {number} [p.minLot]
 * @param {number} [p.rounding]       every order is a whole multiple of this
 * @param {number[]} p.gross          gross requirement per week, in the base unit
 * @param {{week: number, qty: number, uom?: string}[]} [p.receipts]
 */
export function netRequirements(p) {
  const N = p.weeks, unit = p.unit, conv = p.conv || {};
  const ss = p.safetyStock || 0, lt = p.leadWeeks || 0, minLot = p.minLot || 0, rounding = p.rounding || 0;
  if (!(N >= 1) || p.gross.length !== N) throw new Error(`gross requirements cover ${p.gross.length} weeks, not ${N}`);
  const lines = [];
  const receipts = Array(N).fill(0);
  for (const r of p.receipts || []) {
    if (r.week < 1 || r.week > N) throw new Error(`a receipt in week ${r.week} falls outside weeks 1 to ${N}`);
    let base = r.qty;
    if (r.uom && r.uom !== unit) {
      const f = conv[r.uom];
      if (!(f > 0)) throw new Error(`receipts in ${r.uom} have no factor to ${unit}`);
      base = r6(r.qty * f);
      lines.push(`Open receipt in week ${r.week}: ${qty(r.qty)} ${r.uom} × ${qty(f)} = ${qty(base)} ${unit}.`);
    }
    receipts[r.week - 1] = r6(receipts[r.week - 1] + base);
  }
  lines.push(`Start with ${qty(p.onHand)} ${unit} on hand as booked${p.onHand < 0 ? ", a deficit that week 1 must cover" : ""}. Safety stock ${qty(ss)}, lead time ${lt} week${lt === 1 ? "" : "s"}, minimum lot ${qty(minLot)}, rounding multiple ${qty(rounding)}.`);

  const net = [], plannedReceipts = [], releases = Array(N).fill(0);
  let late = 0, bal = p.onHand;
  for (let w = 1; w <= N; w++) {
    const g = p.gross[w - 1] || 0, s = receipts[w - 1];
    const avail = r6(bal + s);
    const need = r6(Math.max(0, g + ss - avail));
    let text = `Week ${w}: ${signed(bal)} carried + ${qty(s)} received = ${signed(avail)} available. Gross ${qty(g)} + safety ${qty(ss)} = ${qty(g + ss)} needed`;
    let order = 0;
    if (need > 0) {
      text += `, so the net requirement is ${qty(g + ss)} − ${signed(avail)} = ${qty(need)}.`;
      order = need;
      if (minLot > order) { text += ` Raised to the minimum lot, ${qty(minLot)}.`; order = minLot; }
      if (rounding > 0) {
        const up = r6(Math.ceil(r6(order / rounding)) * rounding);
        text += up !== order ? ` Rounded up to a multiple of ${qty(rounding)}: ${qty(up)}.` : ` Already a multiple of ${qty(rounding)}.`;
        order = up;
      }
      const rw = w - lt;
      if (rw >= 1) { releases[rw - 1] = r6(releases[rw - 1] + order); text += ` Planned receipt ${qty(order)} in week ${w}, released in week ${rw}.`; }
      else { late = r6(late + order); text += ` Planned receipt ${qty(order)} in week ${w}; its release falls ${1 - rw} week${1 - rw === 1 ? "" : "s"} before week 1, so it is late.`; }
    } else {
      text += `, and ${signed(avail)} covers it: no order.`;
    }
    bal = r6(avail + order - g);
    text += ` Ending balance ${signed(avail)} + ${qty(order)} − ${qty(g)} = ${signed(bal)}.`;
    lines.push(text);
    net.push(need);
    plannedReceipts.push(order);
  }
  lines.push(`Releases by week: ${releases.map((x, i) => `week ${i + 1} ${qty(x)}`).join(", ")}; late ${qty(late)}.`);
  return { answer: { net, plannedReceipts, releases, late }, lines };
}
