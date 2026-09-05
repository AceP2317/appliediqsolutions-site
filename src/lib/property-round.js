/* ============================================================================
   PROPERTY ROUND — a lawn crew's or a cleaner's book, priced against the clock.

   A crew quotes a property once, usually standing in the driveway, and then
   goes back to it every week or every fortnight for years. The price never
   moves. What moves is how long the property actually takes and how far it is
   from the last stop — and both of those are invisible on an invoice.

   So the question this answers is not "what did we bill" but "which of these
   customers is actually worth the truck being there", and the answer needs the
   drive time counted, because a twenty-minute drive to a thirty-minute job is
   a fifty-minute job whatever the invoice says.

   ── WHAT IS THE OWNER'S AND WHAT IS ARITHMETIC ──────────────────────────────

   The price, the interval, the crew's loaded hourly cost and how long a
   property really takes are all HIS, measured or decided by him. What this does
   is divide. It suggests no price, no interval and no target rate per hour, and
   it will not tell him to drop a customer — that is a decision about a
   relationship, and it has more in it than a number.

   Money is integer cents, time is whole minutes, and the round's totals are
   summed from the rows rather than recomputed, so the parts and the whole
   cannot disagree.

   THE DUE ARITHMETIC IS BORROWED, not rewritten: daysBetween comes from
   src/lib/recall.js, which is the same "how far past the interval" question the
   Recall Sheet asks about a patient. Two trades, one piece of date arithmetic.
   ============================================================================ */

import { daysBetween } from './recall.js';

/**
 * @param {object} input
 * @param {string} input.today            ISO date, the day the round is planned for
 * @param {number} input.crewCostPerHour  loaded cost of the WHOLE crew, cents per hour
 * @param {Array}  input.properties
 *   [{id, name, priceCents, minutesOnSite, minutesDrive, intervalDays, lastVisit}]
 *   lastVisit is an ISO date, or null for a property never done
 */
export function computeRound(input) {
  const { today, crewCostPerHour = 0, properties } = input;

  const rows = properties.map((p) => {
    const onSite = Math.max(0, Math.round(p.minutesOnSite || 0));
    const drive = Math.max(0, Math.round(p.minutesDrive || 0));
    /* THE DRIVE IS PART OF THE JOB. Leaving it out is the single reason a round
       looks profitable on paper and does not pay for itself — it is the half of
       the day nobody invoices for and everybody spends. */
    const minutes = onSite + drive;
    const price = p.priceCents || 0;

    const cost = Math.round((crewCostPerHour * minutes) / 60);
    const margin = price - cost;
    /* NULL, NEVER ZERO OR INFINITY. A property with no time on it has no rate
       per hour, and printing one would be inventing the number the whole tool
       exists to produce honestly. */
    const perHour = minutes > 0 ? Math.round((price * 60) / minutes) : null;

    const daysSince = p.lastVisit ? daysBetween(p.lastVisit, today) : null;
    const interval = Math.round(p.intervalDays || 0);
    const daysOver = daysSince == null || interval <= 0 ? null : daysSince - interval;

    return {
      ...p,
      onSite, drive, minutes, price, cost, margin, perHour,
      daysSince, interval, daysOver,
      due: daysOver != null && daysOver >= 0,
      losing: margin < 0,
    };
  });

  const due = rows.filter((r) => r.due);
  const totals = {
    price: rows.reduce((a, r) => a + r.price, 0),
    cost: rows.reduce((a, r) => a + r.cost, 0),
    margin: rows.reduce((a, r) => a + r.margin, 0),
    minutes: rows.reduce((a, r) => a + r.minutes, 0),
    drive: rows.reduce((a, r) => a + r.drive, 0),
    duePrice: due.reduce((a, r) => a + r.price, 0),
    dueMinutes: due.reduce((a, r) => a + r.minutes, 0),
  };
  /* THE ROUND'S OWN RATE, over the SAME rows the money is summed on. Averaging
     the per-property rates instead would weight a ten-minute stop the same as a
     two-hour one and quietly flatter the answer. */
  totals.perHour = totals.minutes > 0 ? Math.round((totals.price * 60) / totals.minutes) : null;

  const problems = [];
  /* A STOP THAT DOES NOT PAY FOR ITSELF. Named per property, because a round
     total can be comfortably positive with two customers underwater inside it. */
  for (const r of rows.filter((x) => x.losing)) {
    problems.push(`${r.name} costs ${(Math.abs(r.margin) / 100).toFixed(2)} more in crew time than it pays, once the drive is counted.`);
  }
  for (const r of rows.filter((x) => x.minutes === 0)) {
    problems.push(`${r.name} has no time on it at all, so there is no rate per hour to work out and it is not in the round's own rate.`);
  }
  for (const r of rows.filter((x) => x.lastVisit && x.daysSince == null)) {
    problems.push(`${r.name} has a last visit this cannot read, so it is not being called due or not due.`);
  }
  for (const r of rows.filter((x) => x.daysSince != null && x.daysSince < 0)) {
    problems.push(`${r.name} was last done in the future, which cannot be right, so its interval means nothing.`);
  }
  for (const r of rows.filter((x) => (x.intervalDays || 0) <= 0)) {
    problems.push(`${r.name} has no interval set, so nothing here can say when it is due again.`);
  }
  for (const name of [...new Set(rows.map((r) => r.name))]) {
    if (rows.filter((r) => r.name === name).length > 1) {
      problems.push(`There is more than one property called “${name}”, and the round cannot tell you which one it just did.`);
    }
  }
  /* A ROUND THAT IS MOSTLY DRIVING. Not a judgement about how much is too much —
     that is his to decide and depends on the county. It is arithmetic: when more
     of the day is spent moving than working, the per-hour figures above are
     mostly a statement about the map rather than about the work. */
  if (totals.minutes > 0 && totals.drive > totals.minutes - totals.drive) {
    problems.push('More of this round is spent driving than working, so the rates below are as much about the route as about the properties.');
  }

  return { rows, due, totals, problems };
}
