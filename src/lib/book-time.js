/* ============================================================================
   BOOK TIME — a repair shop's week, read against the clock as well as the till.

   A shop quotes labour out of a flat-rate book: a job is "2.4 hours" whatever
   it actually takes, and the customer is billed those hours at the shop's rate.
   The tech then takes however long they take. Those two numbers are on the same
   repair order and nothing in the world puts them side by side.

   TWO QUESTIONS, AND ONLY ONE OF THEM IS ON THE INVOICE.

     Did it bill what book says?   money — book hours x rate, against what went
                                   on the ticket
     Did it take what book says?   time — book hours against clock hours, which
                                   is the shop's efficiency and is invisible on
                                   every financial report ever printed

   A shop can bill exactly to book all month and still lose, because the clock
   ran longer than the book on every ticket. That gap is what this is for, and
   it is the same shape as the industrial Staging Triage Console: a total that
   looks right with the error hiding underneath it.

   ── THE MONEY HALF IS NOT REWRITTEN HERE ────────────────────────────────────

   It is computeRateCard out of ./rate-card.js — line item, applicable rate,
   what it comes to, and the variance against what was actually charged. That is
   precisely this question, so this module composes it rather than carrying a
   fourth copy of the same reduce, and adds only the half rate-card has no
   concept of, which is the clock.

   Money is integer cents. Hours are integer hundredths, so 2.4 hours is 240 and
   a hundred tickets do not drift.

   THE HONESTY CONTRACT. The labour rate, which book the shop quotes from, and
   what counts as a comeback are the shop's own. There is no suggested rate, no
   target efficiency, no industry figure, and nothing compared against what any
   other shop runs. Efficiency is printed as what it is — two numbers divided —
   with no opinion about whether it is good.
   ============================================================================ */

import { computeRateCard } from './rate-card.js';

/**
 * @param {object} input
 * @param {number} input.labourRate  the shop's own door rate, cents per hour
 * @param {Array}  input.jobs
 *   [{id, ticket, vehicle, bookHours, clockHours, billed, comeback}]
 *   bookHours / clockHours are hundredths of an hour; billed is cents;
 *   comeback is true for work redone at no charge.
 */
export function computeBookTime(input) {
  const { labourRate = 0, jobs } = input;

  /* THE MONEY HALF, on the shared engine — but only the jobs that HAVE a price.
     A comeback bills nothing by definition and a ticket with no book time has
     nothing to price, so handing either to rate-card makes it report "nothing to
     bill against" on work that is behaving exactly as intended.

     PASSING THEM AND FILTERING THE MESSAGES AFTERWARDS WAS THE FIRST ATTEMPT and
     it is worse than it looks: matching another module's wording with a regex
     means the day somebody rephrases a problem there, this tool silently starts
     showing it or silently stops. Selecting the input is a coupling the compiler
     can see; matching the output is one nothing can. */
  const priceable = jobs.filter((j) => !j.comeback && (j.bookHours || 0) > 0);
  const money = computeRateCard({
    mode: 'rate-times-quantity',
    rates: [{ id: 'labour', key: 'Labour', basis: 'per-unit', perUnit: labourRate, minimum: null }],
    items: priceable.map((j) => ({
      id: j.id,
      label: j.ticket,
      key: 'Labour',
      qty: j.bookHours,
      extra: 0,
      actual: j.billed == null ? null : j.billed,
    })),
  });
  const moneyById = new Map(money.rows.map((m) => [m.id, m]));

  const rows = jobs.map((j) => {
    /* A job with no priced row expects nothing and varies by nothing — it is
       not a gap, it is a comeback or a ticket with no book time on it, and both
       are named separately below. */
    const m = moneyById.get(j.id) || { expected: 0, variance: j.billed == null ? null : j.billed };
    const book = Math.max(0, Math.round(j.bookHours || 0));
    const clock = Math.max(0, Math.round(j.clockHours || 0));
    /* NULL, NEVER A NUMBER, when either side is missing. An efficiency of zero
       and an efficiency of "nobody wrote the time down" are different facts, and
       printing the first for the second is how a shop ends up chasing a tech who
       did nothing wrong. Hundredths of a percent, so 118.75% is 11875. */
    const efficiency = book > 0 && clock > 0 ? Math.round((book * 10000) / clock) : null;
    const hoursLost = clock - book;

    return {
      ...j,
      book, clock, efficiency, hoursLost,
      expected: m.expected,
      billed: j.billed == null ? null : j.billed,
      variance: m.variance,
      comeback: !!j.comeback,
      short: m.variance != null && m.variance < 0,
      overClock: clock > book,
    };
  });

  const clocked = rows.filter((r) => r.clock > 0);
  const totals = {
    book: rows.reduce((a, r) => a + r.book, 0),
    clock: rows.reduce((a, r) => a + r.clock, 0),
    expected: rows.reduce((a, r) => a + (r.expected || 0), 0),
    billed: rows.reduce((a, r) => a + (r.billed || 0), 0),
    comebackClock: rows.filter((r) => r.comeback).reduce((a, r) => a + r.clock, 0),
    tickets: rows.length,
    comebacks: rows.filter((r) => r.comeback).length,
  };
  totals.variance = totals.billed - totals.expected;
  /* THE SHOP'S OWN EFFICIENCY, over the SAME tickets on both sides. Averaging
     the per-ticket percentages instead would weight a twenty-minute job the same
     as a full day and quietly flatter the answer. */
  totals.efficiency = totals.clock > 0 ? Math.round((totals.book * 10000) / totals.clock) : null;
  /* What the hours the clock ran past book would have billed at the door rate.
     Not money anybody lost on paper — it is the door rate on time already paid
     for in wages, which is exactly the figure no report prints. */
  totals.hoursLost = totals.clock - totals.book;
  totals.hoursLostAtRate = Math.round((totals.hoursLost * labourRate) / 100);

  const problems = [];
  /* THE MONEY HALF'S PROBLEMS COME THROUGH WHOLE, none dropped. That is only
     safe because the input was selected above: every job rate-card sees has a
     rate, a positive quantity and a real ticket, so the only problem it can
     raise is the one worth raising — a ticket that came in under book. */
  problems.push(...money.problems);
  for (const r of rows.filter((x) => x.book > 0 && x.clock === 0)) {
    problems.push(`${r.ticket} has book time on it and no clock time, so there is no efficiency to work out for it.`);
  }
  for (const r of rows.filter((x) => x.clock > 0 && x.book === 0 && !x.comeback)) {
    problems.push(`${r.ticket} has clock time and no book time, so it is time the shop spent and cannot bill against anything.`);
  }
  /* A COMEBACK THAT WAS STILL CHARGED. Both facts look ordinary on their own and
     they contradict each other, which is exactly the kind of thing a total
     hides. */
  for (const r of rows.filter((x) => x.comeback && x.billed)) {
    problems.push(`${r.ticket} is marked a comeback and still has ${(r.billed / 100).toFixed(2)} on it. One of those two is wrong.`);
  }
  for (const ticket of [...new Set(rows.map((r) => r.ticket))]) {
    if (rows.filter((r) => r.ticket === ticket).length > 1) {
      problems.push(`There is more than one ticket numbered “${ticket}”, so two lines here are the same job as far as anybody reading it can tell.`);
    }
  }
  if (clocked.length === 0 && rows.length > 0) {
    problems.push('Nothing here has clock time on it, so the whole efficiency half of this is blank — it is only checking the money.');
  }

  return { rows, totals, problems, money };
}
