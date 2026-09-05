/* ============================================================================
   RATE CARD — one engine, three tools.

   A marina bills a boat by its length against a rate card. An agency checks a
   carrier's commission statement against the rates in its own book. A contractor
   quotes a job from his own labour rates and his own markup on parts. Those look
   like three different jobs and they are the same arithmetic: take a line item,
   find the rate that applies to it, work out what it comes to, and — where there
   is an amount somebody actually paid or charged — say what the difference is.

   Built once because the second tool would otherwise have been a copy of the
   first with different nouns, and a copy is where two answers start to diverge.

   Money is integer cents. Quantities are integer hundredths, so a 31.5-foot
   boat is 3150 and a hundred slips do not drift.

   ── HOW A RATE APPLIES IS A PROPERTY OF THE RATE, NOT OF THE CALL ────────────

   `mode` sets the default for every line, and that was enough while each tool
   priced one kind of thing. A contractor's quote is not one kind of thing: the
   labour lines are hours times a rate, and the materials lines are what the part
   cost plus his own markup, ON THE SAME QUOTE. So a rate may carry its own
   `basis` and the call-level `mode` becomes the fallback.

     'per-unit'   qty in hundredths of a unit x perUnit in cents  (hours, feet)
     'percent'    qty in cents x perUnit in hundredths of a percent  (commission)
     'cost-plus'  qty in cents, PLUS perUnit hundredths of a percent of it

   cost-plus is the only one whose answer includes the quantity itself, because a
   marked-up part is billed at cost AND markup — the other two bill the result of
   the rate alone. That is the whole of the difference.

   THE HONESTY CONTRACT. Every rate is the business's own, entered by them. There
   is no suggested rate, no typical commission, no usual markup, and nothing
   compared against what anybody else charges. Where no rate matches a line, the
   tool says so and refuses to price it rather than falling back on something
   plausible.
   ============================================================================ */

/** How a call-level `mode` reads as a per-rate basis. */
const MODE_BASIS = {
  'rate-times-quantity': 'per-unit',
  'percent-of-quantity': 'percent',
};

/**
 * @param {object} input
 * @param {Array}  input.rates  [{id, key, perUnit, minimum?, surcharge?, basis?}]
 *   basis    'per-unit' | 'percent' | 'cost-plus'; defaults from input.mode
 * @param {Array}  input.items  [{id, label, key, qty, extra?, actual?}]
 *   qty      hundredths of the billing unit (feet, hours, or an amount in cents)
 *   extra    an optional per-line flat addition in cents (a liveaboard fee,
 *            a travel charge)
 *   actual   what was really paid or charged, in cents; null when not applicable
 * @param {'rate-times-quantity'|'percent-of-quantity'} input.mode
 */
export function computeRateCard(input) {
  const { rates, items, mode } = input;
  const byKey = new Map(rates.map((r) => [r.key, r]));
  const basisOf = (rate) => rate.basis || MODE_BASIS[mode] || 'per-unit';

  /* One place that turns a quantity and a rate into money, so the minimum rule
     below and the negative-quantity branch cannot drift apart from it. */
  const applyRate = (qty, rate) => {
    const basis = basisOf(rate);
    if (basis === 'percent') return Math.round((qty * rate.perUnit) / 10000);
    if (basis === 'cost-plus') return qty + Math.round((qty * rate.perUnit) / 10000);
    return Math.round((qty * rate.perUnit) / 100);
  };

  const rows = items.map((it) => {
    const rate = byKey.get(it.key);
    if (!rate) {
      /* NO RATE MEANS NO PRICE. Falling back on an average of the other rates,
         or on zero, would put a confident number on a line nobody can justify —
         which is precisely the sort of figure a customer asks about. */
      return { ...it, rate: null, base: null, extra: 0, expected: null, variance: null, unpriced: true };
    }
    const raw = applyRate(it.qty, rate);
    /* A NEGATIVE QUANTITY IS BELOW EVERY MINIMUM, so the minimum rule turned a
       -31.5ft boat into a clean $150 invoice line with no problem raised. The
       hand-typed fields strip the minus sign, but sheet-read.js deliberately
       keeps it, so an imported spreadsheet delivers negatives straight here. */
    const base = it.qty < 0
      ? raw
      : (rate.minimum != null && raw < rate.minimum ? rate.minimum : raw);
    const extra = it.extra || 0;
    const expected = base + extra;
    return {
      ...it, rate, base, extra, expected,
      /* The row carries its own basis so a caller can label the column in the
         unit the line is actually in — hours, feet or dollars — without
         re-deriving the fallback and getting it subtly different. */
      basis: basisOf(rate),
      atMinimum: rate.minimum != null && raw < rate.minimum,
      variance: it.actual == null ? null : it.actual - expected,
      unpriced: false,
    };
  });

  const priced = rows.filter((r) => !r.unpriced);
  const totalExpected = priced.reduce((a, r) => a + r.expected, 0);
  const withActual = priced.filter((r) => r.actual != null);
  const totalActual = withActual.reduce((a, r) => a + r.actual, 0);
  const totalVariance = withActual.reduce((a, r) => a + r.variance, 0);
  /* THE THREE HEADLINES WERE COMPUTED OVER DIFFERENT ROW SETS: expected covered
     every priced row, while actual and variance covered only the rows somebody
     had filled an amount in for. Side by side that reads as "you are owed
     $860, you were paid $378, the difference is $0". This is what expected
     comes to across the SAME rows the variance is measured on, so the three
     numbers can be read together. */
  const expectedOnChecked = withActual.reduce((a, r) => a + r.expected, 0);
  const uncheckedCount = priced.length - withActual.length;

  const byRate = rates.map((rate) => {
    const of = priced.filter((r) => r.key === rate.key);
    return {
      key: rate.key,
      lines: of.length,
      expected: of.reduce((a, r) => a + r.expected, 0),
      variance: of.filter((r) => r.actual != null).reduce((a, r) => a + r.variance, 0),
    };
  });

  const problems = [];
  /* TWO RATE ROWS WITH THE SAME KEY: the Map keeps the last, so the first is
     silently ignored for pricing — and the per-rate summary lists the key twice
     with the full total against each, so the breakdown adds up to double the
     bill. The key IS the free-text label, so a duplicate is one careless line. */
  for (const key of [...new Set(rates.map((r) => r.key))]) {
    if (rates.filter((r) => r.key === key).length > 1) {
      problems.push(`There is more than one “${key}” on the rate card. Only the last one is being used, and the breakdown counts it twice.`);
    }
  }
  for (const r of priced.filter((x) => x.qty < 0)) {
    problems.push(`${r.label} has a negative quantity on it, which cannot be right and is not billed at your minimum.`);
  }
  for (const r of rows.filter((x) => x.unpriced)) {
    problems.push(`${r.label} is down as “${r.key}”, and there is no rate on the card for that. It is not priced below.`);
  }
  for (const r of priced.filter((x) => x.qty === 0)) {
    problems.push(`${r.label} has nothing to bill against, so it comes to the minimum or to nothing.`);
  }
  /* A NEGATIVE MARKUP BILLS A PART BELOW WHAT IT COST, and the line still looks
     like an ordinary priced row because the arithmetic is perfectly happy. This
     is not a judgement about whether a markup is high or low enough — the engine
     has no opinion on that and never will. It is the one case where the sign
     alone says the quote is losing money on the part. */
  for (const rate of rates.filter((x) => basisOf(x) === 'cost-plus' && x.perUnit < 0)) {
    const lines = priced.filter((r) => r.key === rate.key).length;
    if (lines) {
      problems.push(`“${rate.key}” is marked up by less than nothing, so those ${lines === 1 ? 'line bills' : 'lines bill'} below what the parts cost you.`);
    }
  }
  /* An UNDERPAYMENT is the finding this whole shape exists to surface, so it is
     named per line rather than buried in a total that might net out to zero.

     "THE RATE ON YOUR CARD" WAS WRONG AS SOON AS THERE WERE FOUR TOOLS. A
     marina and an agency both keep a rate card; a repair shop keeps a door
     rate, and the sentence read as though it were describing somebody else's
     business. Nothing broke and nothing could — a message is the one thing in
     this engine no check compares against reality. The wording is neutral now,
     which is what a shared engine's copy has to be. */
  for (const r of withActual.filter((x) => x.variance < 0)) {
    problems.push(`${r.label} came in ${(Math.abs(r.variance) / 100).toFixed(2)} short of what your rate works out to.`);
  }

  return {
    rows, priced, byRate,
    totalExpected, totalActual, totalVariance, expectedOnChecked, uncheckedCount,
    checked: withActual.length,
    unpricedCount: rows.filter((r) => r.unpriced).length,
    problems,
  };
}
