/* ============================================================================
   MARKDOWN MARGIN — what a sale does to the margin on each line, against the
   floor this shop decided it will not go below.

   ── THE ARITHMETIC IS ONE SUBTRACTION AND A DIVISION, AND IT IS STILL NOT DONE

   A markdown is decided standing in front of a rail, usually in whole dollars
   and usually on the sticker price. What it does to the margin is a different
   number in the owner's head every time, because the cost sits in a different
   system from the price and neither of them is in the till.

   ── WHAT THIS REFUSES TO WORK OUT, AND WHY THAT IS THE HONEST HALF ──────────

   The real cost of a markdown is not the discount times the quantity. It is the
   margin given up on the units that would have sold anyway, LESS the margin
   gained on units that only sold because of the discount. The second half of
   that is unknowable from anything a shop holds — it needs a counterfactual
   about a week that did not happen.

   Every markdown calculator on the internet quietly answers it anyway, by
   assuming either that nothing extra sells or that everything does. This one
   refuses, states the refusal on the page, and shows the two figures it CAN
   stand behind: what each line makes at the new price, and which lines have
   dropped through the floor the owner set.

   ── THE FLOOR IS THE OWNER'S AND IT IS NOT A BENCHMARK ──────────────────────

   A margin floor is not an industry figure. It is what a particular shop needs
   to cover a particular rent with a particular staff, and two shops on the same
   street will not have the same one. Nothing here suggests a floor, and where
   none is set the tool says so rather than assuming one.

   Money is integer cents; margin is integer hundredths of a percent, so 42.50%
   is 4250 and a hundred lines do not drift.

   MARGIN IS ON THE PRICE, NOT ON THE COST. (price - cost) / price is margin;
   (price - cost) / cost is markup, and they are different numbers that people
   say interchangeably. The tool computes margin, says so on the page, and shows
   the markup beside it so nobody has to guess which one they are reading.
   ============================================================================ */

/**
 * @param {object} input
 * @param {number} input.floorHundredths  the margin this shop will not go under
 * @param {Array}  input.lines
 *   [{id, name, costCents, priceCents, markdownCents, qty}]
 */
export function computeMarkdown(input) {
  const floor = Number.isFinite(input.floorHundredths) ? Math.max(0, Math.round(input.floorHundredths)) : null;
  const src = Array.isArray(input.lines) ? input.lines : [];

  /* NULL, NOT ZERO, for a margin that cannot be worked out. A free item has a
     real margin of nothing; an item with no price has no margin at all, and a
     zero would put the two in the same column. */
  const marginOf = (price, cost) => (price > 0 ? Math.round(((price - cost) * 10000) / price) : null);
  const markupOf = (price, cost) => (cost > 0 ? Math.round(((price - cost) * 10000) / cost) : null);

  const lines = src.map((v) => {
    const cost = Math.max(0, Math.round(v.costCents || 0));
    const price = Math.max(0, Math.round(v.priceCents || 0));
    const cut = Math.max(0, Math.round(v.markdownCents || 0));
    const qty = Math.max(0, Math.round(v.qty || 0));

    const newPrice = Math.max(0, price - cut);
    const wasMargin = marginOf(price, cost);
    const nowMargin = marginOf(newPrice, cost);
    const nowMarkup = markupOf(newPrice, cost);

    const wasPerUnit = price - cost;
    const nowPerUnit = newPrice - cost;

    return {
      ...v,
      cost, price, cut, qty, newPrice,
      wasMargin, nowMargin, nowMarkup,
      wasPerUnit, nowPerUnit,
      /* WHAT THE SHELF MAKES AT THE NEW PRICE IF IT ALL SELLS. Stated as a
         conditional because it is one — see the header. */
      makesIfAllSells: nowPerUnit * qty,
      gaveUpIfAllSells: cut * qty,
      belowCost: newPrice < cost,
      wasBelowCost: price < cost,
      underFloor: floor != null && nowMargin != null && nowMargin < floor,
      noCost: cost === 0,
      noPrice: price === 0,
      cutOverPrice: cut > price,
    };
  });

  const priced = lines.filter((l) => !l.noPrice);
  const sum = (f) => lines.reduce((a, l) => a + f(l), 0);

  const totals = {
    lines: lines.length,
    units: sum((l) => l.qty),
    /* WEIGHTED ON THE SAME ROWS THE MONEY IS SUMMED ON, never an average of the
       per-line percentages — that would weight one clearance jacket the same as
       forty pairs of socks. */
    retailWas: sum((l) => l.price * l.qty),
    retailNow: sum((l) => l.newPrice * l.qty),
    costOfStock: sum((l) => l.cost * l.qty),
    makesIfAllSells: sum((l) => l.makesIfAllSells),
    gaveUpIfAllSells: sum((l) => l.gaveUpIfAllSells),
    underFloor: lines.filter((l) => l.underFloor).length,
    belowCost: lines.filter((l) => l.belowCost).length,
    floor,
  };
  totals.marginNow = totals.retailNow > 0
    ? Math.round(((totals.retailNow - totals.costOfStock) * 10000) / totals.retailNow)
    : null;
  totals.marginWas = totals.retailWas > 0
    ? Math.round(((totals.retailWas - totals.costOfStock) * 10000) / totals.retailWas)
    : null;

  const problems = [];

  for (const l of lines.filter((x) => x.noPrice)) {
    problems.push(`${l.name || 'A line'} has no price on it, so it has no margin to work out and it is in none of the totals below.`);
  }
  for (const l of lines.filter((x) => x.noCost && !x.noPrice)) {
    problems.push(`${l.name} has no cost entered, so its margin reads as the whole price and that is almost certainly not true.`);
  }
  for (const l of lines.filter((x) => x.wasBelowCost)) {
    problems.push(`${l.name} was already priced under what it cost you, before any markdown.`);
  }
  for (const l of lines.filter((x) => x.belowCost && !x.wasBelowCost)) {
    problems.push(`${l.name} goes under cost at this markdown — every one that sells takes ${((l.cost - l.newPrice) / 100).toFixed(2)} off the day.`);
  }
  for (const l of lines.filter((x) => x.cutOverPrice)) {
    problems.push(`${l.name}'s markdown is bigger than its price, so the new price is held at zero rather than going negative.`);
  }
  for (const l of lines.filter((x) => x.underFloor && !x.belowCost)) {
    problems.push(`${l.name} lands at ${(l.nowMargin / 100).toFixed(2)}%, under the ${(floor / 100).toFixed(2)}% floor you set.`);
  }
  for (const l of lines.filter((x) => x.qty === 0 && x.cut > 0)) {
    problems.push(`${l.name} is marked down with none on hand, so the markdown costs nothing and does nothing.`);
  }
  for (const name of [...new Set(lines.map((l) => l.name).filter(Boolean))]) {
    if (lines.filter((l) => l.name === name).length > 1) {
      problems.push(`There is more than one line called ${name}, so two rows here are the same product as far as anybody reading it can tell.`);
    }
  }
  if (floor == null && priced.length > 0) {
    problems.push('No margin floor is set, so nothing here can be under one. That figure is yours — it comes from your rent and your staff, never from a published average.');
  }
  if (lines.length > 0 && lines.every((l) => l.cut === 0)) {
    problems.push('Nothing is marked down, so every figure below is just what the shelf makes today.');
  }
  if (lines.length === 0) {
    problems.push('There are no lines entered, so there is nothing to work out.');
  }

  return { lines, totals, problems };
}
