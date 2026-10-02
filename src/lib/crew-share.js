/* ============================================================================
   CREW SHARE — the engine.

   A boat comes in, the catch sells, and the money splits. The order is fixed and
   old: the trip's own costs come off the top first, then the boat takes its
   share for fuel-tank-to-hull ownership and upkeep, then what remains divides
   across the people who worked it by their lay.

   "Lay" is the share weight. A captain might be on a share and a half where a
   deckhand is on one, and a greenhorn on three quarters. Every boat sets its own
   and it does not travel — which is exactly why no software has taken this job.

   REUSES splitCents() FROM THE TIP-OUT SHEET, deliberately and not by accident.
   Splitting a pot across weights while making the pennies add back up is the
   same problem in both, and solving it twice would be two chances to get it
   wrong. That shared function is the reason these two tools were built back to
   back.

   Money is integer cents throughout. See src/lib/tip-out.js for why.

   THE HONESTY CONTRACT. Every figure is the boat's own number through arithmetic
   printed beside the answer. No standard lay, no typical boat share, nothing
   compared against what other boats do.
   ============================================================================ */

import { splitCents } from './tip-out.js';

export function computeCrewShare(input) {
  const { gross, expenses, boatPercent, crew } = input;

  const expenseRows = expenses.map((e) => ({ ...e }));
  const expenseTotal = expenseRows.reduce((a, e) => a + e.amount, 0);
  const afterExpenses = gross - expenseTotal;

  /* The boat's share comes off what is LEFT, never off the gross. Taking it off
     the gross would charge the crew for the boat's cut of money that went
     straight back out as fuel, and that is the argument this tool exists to
     stop having. */
  const boatShare = afterExpenses > 0 ? Math.round((afterExpenses * boatPercent) / 100) : 0;
  const crewPot = afterExpenses - boatShare;

  const weights = crew.map((p) => p.lay || 0);
  const layTotal = weights.reduce((a, w) => a + w, 0);
  const { shares, pennies } = splitCents(Math.max(0, crewPot), weights);

  const payouts = crew.map((p, i) => ({ ...p, amount: shares[i] }));
  const paidOut = payouts.reduce((a, p) => a + p.amount, 0);

  const problems = [];
  if (afterExpenses < 0) {
    problems.push(
      'The trip cost more than the catch sold for. There is nothing to split, and the difference is the boat’s to carry.',
    );
  }
  if (boatPercent > 100) {
    problems.push('The boat is set to take more than everything. Nothing is left for anyone aboard.');
  }
  if (boatPercent === 100 && afterExpenses > 0) {
    problems.push('The boat is set to take all of it, so every hand aboard settles at nothing.');
  }
  if (boatPercent < 0) {
    problems.push('The boat share is negative, which hands the crew more money than the trip made.');
  }
  for (const e of expenseRows.filter((x) => x.amount < 0)) {
    problems.push(`“${e.label}” is a negative cost, which adds money to the trip rather than taking it off.`);
  }
  if (crew.length > 0 && layTotal === 0) {
    problems.push('Everybody aboard is down for no lay, so there is no way to divide the crew share.');
  }
  /* ONE HAND ON A BLANK LAY IS THE DANGEROUS CASE, not everybody on one.
     The all-zero check above only fires when NOBODY has a lay. A new deckhand's
     row starts at zero, so the common shape is one person at zero and the rest
     fine — and that person settles at $0.00 while `balances` reads true and
     every honesty check on the page agrees. Somebody worked a four-day trip and
     the sheet says the money is all accounted for. */
  for (const h of crew.filter((c) => (c.lay || 0) <= 0)) {
    problems.push(
      `${h.name || 'Somebody'} is aboard with ${(h.lay || 0) < 0 ? 'a negative lay' : 'no lay set'}, ` +
      `so they settle at nothing while the rest split the whole crew share.`,
    );
  }
  if (crew.length === 0 && crewPot > 0) {
    problems.push('Nobody is on the crew list, so the crew share has nowhere to go.');
  }

  return {
    expenseRows, expenseTotal, afterExpenses,
    boatShare, boatPercent, crewPot, layTotal,
    payouts, pennies, paidOut,
    /* The trip balances when every dollar landed somewhere: costs, the boat, or
       a person. Printed on the page rather than asserted in a comment. */
    balances: expenseTotal + boatShare + paidOut === gross,
    unaccounted: gross - expenseTotal - boatShare - paidOut,
    problems,
  };
}
