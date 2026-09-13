/* ============================================================================
   THE FREE CHECK'S ARITHMETIC — the lead offer's engine, and now the only copy.

   WHY IT MOVED HERE, 2026-08-26. Every one of the shelf tools keeps its
   arithmetic in this directory, pure and React-free, so that a Node gate can run
   the same function the page runs. The free check is the LEAD OFFER (D34) and it
   was the one thing whose arithmetic still lived inside its React island — which
   was fine while nothing else needed it, and stopped being fine the moment the
   home share card had to draw the check's own numbers. The alternative was a
   second implementation inside a card generator, which is exactly the class that
   left that card selling a retired offer for weeks (L-196).

   THE HONESTY CONTRACT IS THE PRODUCT AND IT LIVES IN THE ARITHMETIC (D34).
   Every line below is ONE multiplication a visitor can redo by hand on their own
   numbers. No model, no forecast, no benchmark, no industry average, no
   suggested rate. Nothing here reaches for a figure the visitor did not give.

   THE DEFAULTS ARE DELIBERATELY CONSERVATIVE. A check that flatters its own
   answer is a check nobody believes twice. Two of the four are ZERO on purpose:
   assuming a supplier price rise or a stockout the visitor did not report would
   be inventing their data, which is the one thing this page cannot do.
   ============================================================================ */
import { FLOOR_USD } from './pricing.js';

export const DEFAULTS = Object.freeze({
  /* What an hour of an owner's own time is worth. Deliberately low: this is the
     COST of the hour, not what they bill for it. */
  hourlyValue: 25,
  /* How much supplier prices moved this year. Zero unless they say otherwise. */
  priceRise: 0,
  /* Times a month something is out of stock when it is needed. Same. */
  stockoutsPerMonth: 0,
  /* What one stockout costs — a lost sale, an emergency order, an idle hour. */
  stockoutCost: 120,
});

/**
 * Work out what the ordering paperwork is costing, from the visitor's own two
 * numbers plus whatever they chose to override.
 *
 * @param {{monthlySpend:number, weeklyHours:number, hourly?:number,
 *          risePct?:number, stockouts?:number, stockoutCost?:number}} input
 * @returns {object} every intermediate figure, because the arithmetic is printed
 */
export function costCheck(input) {
  const monthlySpend = input.monthlySpend || 0;
  const weeklyHours = input.weeklyHours || 0;
  const hourly = input.hourly || DEFAULTS.hourlyValue;
  const risePct = input.risePct || 0;
  const stockouts = input.stockouts || 0;
  const stockoutCost = input.stockoutCost || DEFAULTS.stockoutCost;

  const hoursYear = weeklyHours * 52;
  const timeCost = hoursYear * hourly;
  const riseCost = monthlySpend * 12 * (risePct / 100);
  const stockoutCostYear = stockouts * 12 * stockoutCost;
  const total = timeCost + riseCost + stockoutCostYear;

  return {
    monthlySpend, weeklyHours, hourly, risePct, stockouts, stockoutCost,
    hoursYear, timeCost, riseCost, stockoutCostYear, total,
  };
}

/**
 * How long a build takes to pay for itself.
 *
 * ⚠️ MEASURED AGAINST THE HOURS ALONE, NEVER THE TOTAL, and this is the single
 * most load-bearing line on the page. The other two lines are real money, but a
 * tool does not recover a supplier's price rise and it does not recover every
 * stockout — so a payback computed on the total would claim credit for money
 * software never gets back. Against the hours alone the answer is slower,
 * smaller and less flattering, and it is the only version this page can defend
 * if somebody checks it. `npm run verify:check` asserts both halves: that the
 * figure matches the hours, and that it does NOT match the total. See L-193.
 *
 * @param {{timeCost:number}} r a result from costCheck()
 * @returns {number|null} days, or null when there are no hours to measure
 */
export const paybackDays = (r) =>
  r.timeCost > 0 ? (FLOOR_USD / r.timeCost) * 365 : null;

/**
 * The same figure in the words the page prints.
 *
 * NO FLOOR AT ONE MONTH. An earlier version wrapped this in Math.max(1, …) so it
 * would never print "0 months" — and that fired on exactly the results where the
 * answer is most striking, rendering eight days as "about one month" and
 * understating the case fourfold. Below a month it says days or weeks.
 */
export function paybackText(r) {
  const d = paybackDays(r);
  if (d === null) return null;
  if (d < 10) return `about ${Math.max(1, Math.round(d))} days`;
  if (d < 30) return `about ${Math.round(d / 7)} weeks`;
  return `about ${Math.round(d / 30.4)} months`;
}

/* ============================================================================
   WHAT THE HAND-STEERING COSTS AGAINST THE STOCK ITSELF.

   ── THE DEFECT THIS CLOSES, 2026-08-26 ───────────────────────────────────────

   The check asks two questions and puts the monthly stock spend FIRST, where it
   reads as the important one. That number then fed exactly one calculation —
   spend × 12 × the supplier price rise — and the price rise DEFAULTS TO ZERO, on
   purpose, because assuming a rise the visitor never reported would be inventing
   their data. Correct, and the consequence was that in the path almost everybody
   takes, the largest number they typed contributed nothing and appeared nowhere
   in the answer.

   Measured on the live page: $14,000 a month and 9 hours a week returned $11,700,
   which is 9 × 52 × $25 and nothing else. A visitor who types their biggest
   figure and never sees it again concludes either that the tool ignored them or
   that there is one multiplication behind it. Both readings cost exactly the
   credibility this page exists to build, and neither is a copy problem.

   ── WHY A RATIO, AND WHY THIS RATIO ──────────────────────────────────────────

   It is ONE DIVISION OF TWO NUMBERS THE VISITOR TYPED. No model, no forecast, no
   benchmark, no industry average, no suggested rate — the contract in D34 is
   untouched, and it has to be, because that contract is the product.

   AGAINST THE HOURS, NEVER THE TOTAL, for the same reason paybackDays() is. The
   total legitimately includes a supplier price rise and the cost of running out;
   neither is paperwork, and calling them a share of the stock spend would be
   comparing inflation to inventory and printing the result as if it meant
   something. The hours are the hand-steering. That is the thing being weighed.

   IT IS NOT AN ADDEND AND THE PAGE MUST NOT RENDER IT AS ONE. The three money
   lines sum to the total; this does not. It is the same money expressed as a
   proportion, which is the form an owner can actually judge — "eleven thousand a
   year" means little without knowing whether the business turns over fifty
   thousand or five million, and this is the number that says which.
   ============================================================================ */

/**
 * The hand-steering cost as a share of a year's stock spend.
 *
 * @param {object} r a result from costCheck()
 * @returns {{annualSpend:number, perDollar:number}|null} null when there is
 *   nothing to divide — no spend given, or no hours given. Returning null
 *   rather than zero or Infinity is the honesty rule the shelf tools follow:
 *   where a tool cannot work something out it says so instead of printing a
 *   plausible figure.
 */
export function stockShare(r) {
  const annualSpend = (r.monthlySpend || 0) * 12;
  if (annualSpend <= 0 || !(r.timeCost > 0)) return null;
  return { annualSpend, perDollar: r.timeCost / annualSpend };
}

/**
 * The same figure in the words the page prints. Lives here rather than in the
 * island for the reason paybackText() does: the home share card draws this
 * check, and a second implementation inside a card generator is the class that
 * left that card selling a retired offer for weeks (L-196).
 */
export function stockShareText(r) {
  const s = stockShare(r);
  if (!s) return null;
  const cents = s.perDollar * 100;
  /* Above a dollar it stops being cents. Rare — it needs a small spend against
     many hours — but a page printing "137.0¢" would read as a rounding bug in
     the one place a reader is checking the arithmetic. */
  return cents < 100
    ? `${cents.toFixed(1)}¢`
    : `$${s.perDollar.toFixed(2)}`;
}
