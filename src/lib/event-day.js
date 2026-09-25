/* ============================================================================
   EVENT DAY — a food truck or a market stall, against the pitch fee.

   Somebody rings up in July and offers a pitch at a festival for $450. The
   question is not whether $450 is a lot. It is how many plates have to go out
   of the window before the day has paid for itself, and that number is never
   worked out, because working it out means knowing what each plate actually
   contributes after what went into it.

   ── THE ONE PIECE OF ARITHMETIC ─────────────────────────────────────────────

   Every unit sold contributes its price minus what that unit cost to make. The
   fixed cost of the day — the pitch, the fuel, the propane, the extra pair of
   hands — does not move with sales. So the day breaks even at

       fixed cost  /  what a unit contributes

   and with more than one thing on the menu, "a unit" means one unit AT THE MIX
   BEING EXPECTED. That assumption is real and it is stated on the page rather
   than buried: sell a different mix and the number moves.

   WASTE IS SEPARATE AND DELIBERATELY SO. Prepping more than sells is a cost of
   the day like the pitch fee, but it is not fixed and it is not per-sale — it
   is the difference between what went on and what went out, at what it cost.
   Rolling it into either one would hide the single number a vendor can most
   easily change.

   Money is integer cents, units are whole numbers.

   THE HONESTY CONTRACT. Every price, every cost, every expected quantity is the
   vendor's own. Nothing here forecasts a crowd, suggests a price, or knows what
   a festival is worth — it divides what was typed in. The break-even is
   arithmetic; whether the day is worth doing has weather and a queue and a
   Saturday in it, and none of those are in this file.
   ============================================================================ */

/**
 * @param {object} input
 * @param {number} input.feeCents        the pitch or booth fee
 * @param {number} input.otherFixedCents everything else that does not move with
 *                                       sales — fuel, propane, ice, extra hands
 * @param {Array}  input.items
 *   [{id, name, priceCents, unitCostCents, expectedSold, prepped}]
 */
export function computeEventDay(input) {
  const { feeCents = 0, otherFixedCents = 0, items } = input;
  const fixed = feeCents + otherFixedCents;

  const rows = items.map((it) => {
    const price = it.priceCents || 0;
    const cost = it.unitCostCents || 0;
    const expected = Math.max(0, Math.round(it.expectedSold || 0));
    const prepped = Math.max(0, Math.round(it.prepped || 0));

    const contribution = price - cost;
    const revenue = price * expected;
    const contributed = contribution * expected;
    /* WASTE IS WHAT WENT ON AND DID NOT GO OUT, at what it cost — never at what
       it would have sold for. Costing it at the price counts money that was
       never anybody's. */
    const wasteUnits = Math.max(0, prepped - expected);
    const wasteCost = wasteUnits * cost;

    return {
      ...it,
      price, cost, expected, prepped,
      contribution, revenue, contributed, wasteUnits, wasteCost,
      belowCost: contribution < 0,
      willRunOut: prepped < expected,
    };
  });

  const expectedUnits = rows.reduce((a, r) => a + r.expected, 0);
  const contributed = rows.reduce((a, r) => a + r.contributed, 0);
  const wasteCost = rows.reduce((a, r) => a + r.wasteCost, 0);
  const revenue = rows.reduce((a, r) => a + r.revenue, 0);

  /* ONE UNIT AT THE EXPECTED MIX. Averaging the per-item contributions instead
     would weight a $3 tea the same as a $14 plate and give a break-even for a
     menu nobody is selling. */
  const perUnit = expectedUnits > 0 ? Math.round(contributed / expectedUnits) : null;
  /* CEILING, NEVER ROUNDING. Half a plate does not pay half a pitch fee, and a
     break-even rounded DOWN is a number that has not actually broken even. */
  const breakEvenUnits = perUnit != null && perUnit > 0 ? Math.ceil(fixed / perUnit) : null;
  const profit = contributed - fixed - wasteCost;

  const totals = {
    fixed, fee: feeCents, otherFixed: otherFixedCents,
    revenue, contributed, wasteCost,
    expectedUnits, perUnit, breakEvenUnits, profit,
    wasteUnits: rows.reduce((a, r) => a + r.wasteUnits, 0),
    /* How much of the expected day is already spoken for by the fixed cost —
       stated as units rather than a percentage, because units are the thing a
       person at a window can actually count. */
    unitsPastBreakEven: breakEvenUnits == null ? null : expectedUnits - breakEvenUnits,
  };

  const problems = [];
  /* AN ITEM PRICED UNDER ITS OWN COST. Every one sold makes the day worse, and
     on a busy stall it is the best seller that does the most damage. */
  for (const r of rows.filter((x) => x.belowCost)) {
    problems.push(`${r.name} costs ${(Math.abs(r.contribution) / 100).toFixed(2)} more to make than it sells for, so every one that goes out makes the day worse.`);
  }
  /* NO NUMBER OF SALES BREAKS EVEN. The arithmetic would divide by zero or go
     negative and hand back a break-even that looks like an ordinary figure. */
  if (perUnit != null && perUnit <= 0) {
    problems.push('At the mix you are expecting, a unit contributes nothing, so there is no number of sales that pays for the day.');
  }
  if (expectedUnits === 0) {
    problems.push('Nothing is expected to sell, so there is no mix to work a break-even out against.');
  }
  for (const r of rows.filter((x) => x.willRunOut)) {
    problems.push(`${r.name} has ${r.expected - r.prepped} fewer prepped than you expect to sell, so you run out before the day does.`);
  }
  for (const name of [...new Set(rows.map((r) => r.name))]) {
    if (rows.filter((r) => r.name === name).length > 1) {
      problems.push(`There is more than one item called “${name}”, so two lines here are the same thing as far as anybody reading it can tell.`);
    }
  }
  /* THE FEE ALONE IS MORE THAN THE DAY CONTRIBUTES. Not an opinion about the
     fee — it is the comparison a vendor is actually being asked to make when
     somebody rings up in July, and nothing else states it. */
  if (contributed > 0 && feeCents > contributed) {
    problems.push('The pitch fee on its own is more than the whole day contributes at the sales you expect.');
  }

  return { rows, totals, problems };
}
