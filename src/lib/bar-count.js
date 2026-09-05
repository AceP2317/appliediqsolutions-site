/* ============================================================================
   BAR COUNT SHEET — the engine, and nothing else.

   Pure functions: no React, no DOM, no module state, no markup. Same reasoning
   as src/lib/tip-out.js — an engine reachable only through a browser can only be
   tested through a browser, which buys slow tests and few of them.

   COUNTS ARE INTEGER HUNDREDTHS OF A UNIT, never decimal units. A bar counts
   half a bottle, and 0.1 + 0.2 is not 0.3 in binary floating point, so a sheet
   that adds a hundred lines of decimals drifts. 250 here means 2.50 bottles.
   Money is integer cents for the same reason.

   THE HONESTY CONTRACT. Every figure is the bar's own count and the bar's own
   cost, through arithmetic printed beside the answer. There is no suggested par,
   no industry pour cost, and nothing compared against what other bars run. A
   target is an input and starts blank, because a number nobody reported is a
   number this page invented.

   WHAT IT DELIBERATELY DOES NOT DO: it never compares what was used against what
   SHOULD have been used. That comparison needs a recipe for every drink and a
   pour size for every pour, neither of which this tool has, and inventing them
   would produce a confident variance figure with nothing underneath it.
   ============================================================================ */

/** A count in hundredths back to a readable number of units. */
export const units = (hundredths) => hundredths / 100;

/**
 * One product's line.
 * used = opening + received - closing, all in hundredths, so it is exact.
 */
export function lineFor(p) {
  const used = p.opening + p.received - p.closing;
  const cost = Math.round((used * p.unitCost) / 100);
  /* Order back up to par, in whole units. A bar cannot order 1.4 bottles, and
     rounding down would leave it short of the par it just told us it wants. */
  const shortBy = p.par - p.closing;
  const toOrder = shortBy > 0 ? Math.ceil(shortBy / 100) : 0;
  return { ...p, used, cost, toOrder };
}

/**
 * The whole sheet, in one pure pass.
 * @param {{sales: Record<string, number>, target: number|null, products: any[]}} input
 */
export function computeCount(input) {
  const { sales, target, products } = input;

  const rows = products.map(lineFor);

  /* Per category, because a bar runs liquor, beer and wine as separate numbers
     and a single blended figure hides the one that moved. */
  const categories = [...new Set(rows.map((r) => r.category))].sort();
  const byCategory = categories.map((c) => {
    const of = rows.filter((r) => r.category === c);
    const cost = of.reduce((a, r) => a + r.cost, 0);
    const revenue = sales[c] ?? 0;
    return {
      category: c,
      cost,
      revenue,
      /* NULL, not zero, when there is no revenue to divide by. Printing 0% for
         "we cannot work this out" is inventing an answer, and a bar reading 0%
         pour cost would think it had a very good week. */
      pourCost: revenue > 0 ? (cost / revenue) * 100 : null,
      lines: of.length,
    };
  });

  /* SALES ENTERED FOR A KIND THAT NO LONGER HAS ANY PRODUCTS.
     Delete every Wine line and the Wine sales field disappears from the page —
     but the figure stays in state, stays in storage, and comes back PRE-FILLED
     the moment any product is re-categorised as Wine. That is a revenue number
     the page supplied for a count the owner never entered it for, feeding the
     pour-cost denominator, and it is a breach of this tool's own promise that
     these are the only numbers the pour cost is divided by. Named, so it can be
     cleared rather than lurking. */
  const orphanSales = Object.entries(sales)
    .filter(([k, v]) => v > 0 && !categories.includes(k))
    .map(([k, v]) => ({ category: k, revenue: v }));

  const totalCost = rows.reduce((a, r) => a + r.cost, 0);
  const totalRevenue = categories.reduce((a, c) => a + (sales[c] ?? 0), 0);
  const totalPourCost = totalRevenue > 0 ? (totalCost / totalRevenue) * 100 : null;

  const orderList = rows.filter((r) => r.toOrder > 0);

  /* THE THINGS A REAL SUNDAY-NIGHT COUNT GETS WRONG, surfaced rather than
     absorbed. Every one of these produces a plausible-looking number if it is
     left alone, which is exactly why they have to be said out loud. */
  const problems = [];
  for (const r of rows.filter((x) => x.used < 0)) {
    problems.push(
      `${r.name}: you finished with more than you started with plus what came in. ` +
      `That is a miscount or a delivery nobody wrote down — not usage.`,
    );
  }
  for (const r of rows.filter((x) => x.unitCost === 0 && x.used > 0)) {
    problems.push(
      `${r.name} has no cost on it, so everything you poured of it counts as free. ` +
      `The pour cost below is lower than the truth until that is filled in.`,
    );
  }
  for (const o of orphanSales) {
    problems.push(
      `There are still ${(o.revenue / 100).toFixed(2)} of ${o.category} sales entered, but nothing on the shelf is a ${o.category} any more. ` +
      `That figure is not in the pour cost below and it will come back if you add a ${o.category} product — clear it or add the product.`,
    );
  }
  for (const c of byCategory.filter((x) => x.cost > 0 && x.revenue === 0)) {
    problems.push(
      `You poured ${(c.cost / 100).toFixed(2)} of ${c.category} and entered no ${c.category} sales, ` +
      `so its pour cost cannot be worked out.`,
    );
  }

  return {
    rows, byCategory, categories,
    totalCost, totalRevenue, totalPourCost,
    orderList, target, orphanSales,
    /* Over or under the bar's OWN target, never anybody else's, and null when
       they have not set one. */
    vsTarget: target != null && totalPourCost != null ? totalPourCost - target : null,
    problems,
  };
}
