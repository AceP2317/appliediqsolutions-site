/* ============================================================================
   TIP-OUT SHEET — the engine, and nothing else.

   Pure functions: no React, no DOM, no module state, no markup. It lives in a
   plain .js file rather than inside the island so that scripts/verify-tools.mjs
   can import and exercise it directly on Node. An engine reachable only through
   a browser can only be tested through a browser, and that buys slow tests and
   few of them.

   The gate imports THESE FUNCTIONS and compares them against arithmetic worked
   out by hand in the test file. It never imports the arithmetic — a test that
   re-uses the code it is testing agrees with that code's bugs.
   ============================================================================ */

const BASIS_LABEL = { food: 'food sales', bar: 'bar sales', total: 'total sales' };

/** Cents in a percentage of a cents amount, rounded half-up to the penny. */
export function pctOfCents(cents, percent) {
  return Math.round((cents * percent) / 100);
}

/**
 * Split `total` cents across `weights`, exactly.
 *
 * Floor every share, then hand the leftover pennies out one at a time by
 * largest fractional remainder, ties broken by position. That is the
 * largest-remainder method, and the reason it is here rather than rounding each
 * share independently is that independent rounding does not add back up: three
 * shares of 33.33 cents each round to 33 and lose a penny off the night.
 *
 * Returns the shares AND which positions got a leftover penny, because the page
 * says so out loud rather than quietly absorbing them.
 */
export function splitCents(total, weights) {
  /* GUARD THE INPUTS HERE, not only in the callers.
     `sum <= 0` is FALSE for NaN, so a single NaN weight sailed past this and
     produced all-NaN shares with the whole pot silently lost. Infinity gave
     [NaN, 0]. A fractional total over-distributed, because a `for (k < left)`
     loop with left = 1.5 runs twice and hands out a penny that does not exist.
     Both current callers happen to round and default their inputs, so none of
     these is reachable today — but this function is exported and shared, and a
     guard that lives only in the caller is not a guard on the function. */
  const clean = weights.map((w) => (Number.isFinite(w) && w > 0 ? w : 0));
  const sum = clean.reduce((a, w) => a + w, 0);
  const pot = Number.isFinite(total) ? Math.floor(total) : 0;
  if (sum <= 0 || pot <= 0) {
    return { shares: weights.map(() => 0), pennies: [] };
  }
  weights = clean;
  total = pot;
  const exact = weights.map((w) => (total * w) / sum);
  const shares = exact.map((v) => Math.floor(v));
  const left = total - shares.reduce((a, v) => a + v, 0);

  const order = exact
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);

  const pennies = [];
  for (let k = 0; k < left; k += 1) {
    const { i } = order[k % order.length];
    shares[i] += 1;
    pennies.push(i);
  }
  return { shares, pennies };
}

/**
 * The whole calculation, in one pure pass.
 * The order is load-bearing and is the order a house actually works in:
 * gross tips, then anything taken off the top, then the support roles off the
 * sales figures, then whatever remains split across the pool.
 */
export function computeTipOut(input) {
  const { sales, tips, deductions, support, poolBasis, staff } = input;

  const salesTotal = sales.food + sales.bar;
  const grossTips = tips.card + tips.cash;

  const deductionRows = deductions.map((d) => {
    const amount =
      d.basis === 'flat'
        ? Math.round(d.value * 100)
        : d.basis === 'card'
          ? pctOfCents(tips.card, d.value)
          : pctOfCents(grossTips, d.value);
    const how =
      d.basis === 'flat'
        ? 'a flat amount you entered'
        : d.basis === 'card'
          ? d.value + '% of card tips'
          : d.value + '% of all tips';
    return { ...d, amount, how };
  });
  const deductionTotal = deductionRows.reduce((a, r) => a + r.amount, 0);
  const afterDeductions = grossTips - deductionTotal;

  const basisCents = { food: sales.food, bar: sales.bar, total: salesTotal };
  const weightOf = (p) => (poolBasis === 'points' ? p.points : p.hours) || 0;

  const supportRows = support.map((s) => {
    const base = basisCents[s.basis] || 0;
    const amount = pctOfCents(base, s.percent);
    const people = staff.filter((p) => p.role === s.role);
    const { shares, pennies } = splitCents(amount, people.map(weightOf));
    return {
      ...s,
      amount,
      base,
      how: s.percent + '% of ' + BASIS_LABEL[s.basis],
      people: people.map((p, i) => ({ ...p, share: shares[i] })),
      pennies,
      orphaned: people.length === 0,
    };
  });
  const supportTotal = supportRows.reduce((a, r) => a + r.amount, 0);

  const supportRoles = new Set(support.map((s) => s.role));
  const poolPeople = staff.filter((p) => !supportRoles.has(p.role));
  const poolAmount = afterDeductions - supportTotal;
  const poolWeights = poolPeople.map(weightOf);
  const poolWeightTotal = poolWeights.reduce((a, w) => a + w, 0);
  const { shares: poolShares, pennies: poolPennies } = splitCents(
    Math.max(0, poolAmount),
    poolWeights,
  );

  /* THE FOUR WAYS THIS GOES WRONG IN A REAL BAR, each surfaced rather than
     absorbed. Staying quiet on any of them is how a tip sheet pays somebody
     the wrong amount and nobody notices until payday. */
  const problems = [];
  if (poolAmount < 0) {
    problems.push(
      'The tip-outs off the top come to more than the tips collected. Nothing is left for the pool, and somebody is being asked to pay in.',
    );
  }
  if (poolPeople.length > 0 && poolWeightTotal === 0) {
    problems.push(
      'Everyone in the pool is down for zero ' + poolBasis + '. There is no way to divide the money until that is filled in.',
    );
  }
  if (poolPeople.length === 0 && poolAmount > 0) {
    problems.push(
      'Nobody is in the pool, so what is left after the tip-outs has nowhere to go.',
    );
  }
  /* A SUPPORT POT WITH PEOPLE IN IT BUT NO HOURS ON THEM. The orphan check
     below only fires when NOBODY worked the role. If somebody is on the roster
     for that role at zero hours, splitCents divides by a total weight of zero,
     the pot pays out nothing, and the money simply vanishes — with `problems`
     empty. The night's balance check does catch it, but it sits under the answer
     rather than in the red banner above it, which is the mechanism for this. */
  for (const r of supportRows) {
    if (!r.orphaned && r.amount > 0 && r.people.every((x) => ((poolBasis === 'points' ? x.points : x.hours) || 0) <= 0)) {
      problems.push(
        `${r.role} is owed ${(r.amount / 100).toFixed(2)} but everybody down for it has no ${poolBasis} on them, ` +
        `so that money is not being paid to anyone.`,
      );
    }
  }
  for (const s of support.filter((x) => x.percent < 0)) {
    problems.push(`${s.role} is set to a negative percentage, which pays money INTO the pool rather than out of it.`);
  }
  for (const d of deductions.filter((x) => x.value < 0)) {
    problems.push(`“${d.label}” is a negative amount, which adds to the tips rather than coming off them.`);
  }
  /* TWO ROWS FOR ONE ROLE pay the same people twice from two pots, and the
     second silently changes nothing about the first. */
  for (const role of [...new Set(support.map((x) => x.role))]) {
    if (support.filter((x) => x.role === role).length > 1) {
      problems.push(`There is more than one “${role}” line off the top, so anyone in that role is being paid from both.`);
    }
  }
  for (const r of supportRows) {
    if (r.orphaned && r.amount > 0) {
      problems.push(
        r.role + ' is owed ' + (r.amount / 100).toFixed(2) + ' but nobody on tonight worked that role.',
      );
    }
  }

  const payouts = [
    ...supportRows.flatMap((r) =>
      r.people.map((p) => ({
        id: p.id, name: p.name, role: p.role, hours: p.hours, points: p.points,
        pot: r.role, basis: r.how, amount: p.share,
      })),
    ),
    ...poolPeople.map((p, i) => ({
      id: p.id, name: p.name, role: p.role, hours: p.hours, points: p.points,
      pot: 'Pool', basis: 'what was left, by ' + poolBasis, amount: poolShares[i],
    })),
  ];

  const paidOut = payouts.reduce((a, p) => a + p.amount, 0);

  return {
    salesTotal, grossTips,
    deductionRows, deductionTotal, afterDeductions,
    supportRows, supportTotal,
    poolPeople, poolAmount, poolWeightTotal, poolShares, poolPennies, poolBasis,
    payouts, paidOut,
    /* THE BOOKS-BALANCE CHECK, printed on the page rather than asserted in a
       comment. Everything handed out plus everything taken off the top must
       equal the tips that came in, to the penny. An arithmetic claim nobody
       can see is a claim nobody can check. */
    balances: paidOut + deductionTotal === grossTips,
    shortfall: grossTips - deductionTotal - paidOut,
    problems,
  };
}

// === END ENGINE ===
