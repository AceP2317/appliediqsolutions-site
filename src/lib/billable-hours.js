/* ============================================================================
   BILLABLE HOURS REALIZATION — where the gap goes between an hour worked and a
   dollar collected.

   ── WHY THIS BELONGS TO THE OWNER OF THE PRACTICE AND NOT TO A PLATFORM ─────

   Realization is what is left of an hour by the time the money arrives, and
   every practice loses it in two different places for two different reasons.
   Part of it never reaches an invoice at all — a partner takes time off a bill
   because the matter ran long, because the client is new, because somebody
   decided it was not chargeable. The rest is invoiced and then not paid.

   The first half is a WRITE-OFF POLICY, and it is nowhere but in the owner's
   head. It is not a rate, it is not a discount schedule, and no two practices
   apply it the same way — one firm writes off anything over the estimate, the
   next writes off the first hour of any new client, the next writes off nothing
   and argues about it. That is why no platform holds this: practice-management
   software knows what was billed, accounting software knows what came in, and
   the decision that separates the two was never keyed anywhere.

   ── THE FIRST FINDING: THE LEAK HAS TWO HALVES AND THEY NEED DIFFERENT FIXES ─

   Money lost at BILLING and money lost at COLLECTION arrive as one shortfall on
   any summary anybody has, and they are not the same problem. Lost at billing
   is a decision somebody made — talk to whoever made it. Lost at collection is
   an invoice sitting unpaid — talk to the client.

   And the billing half is invisible in a way the collection half is not. An
   unpaid invoice is a row on an aging report; every receivables system in the
   world will show it. Work that was never invoiced has NO ROW ANYWHERE, because
   a row is created by invoicing. It exists only as hours on a time record, which
   is the one place nobody reconciles against the money. So the two halves are
   printed separately, in dollars, and each one is named for where it happened.

   ── THE SECOND FINDING: HOURS WORKED, NEVER BILLED, AND GOING COLD ──────────

   This is the actionable half. A matter carrying logged hours, no invoice and no
   activity for months is work already done that nobody is now going to bill —
   and the longer it sits the harder it is to defend, because the client has
   stopped thinking about it.

   Sorted by days since last activity, furthest first, which is the same shape
   draw-schedule.js uses for its finished stages and claim-aging.js for its
   payers, for the same reason: the top of the list is where the conversation
   starts. A matter with a write-off reason recorded against it is NOT on this
   list — that is a decision somebody already took, and the list is for work
   nobody has decided anything about.

   ⚠ THIS COMPARES WHAT WAS WORKED, BILLED AND COLLECTED AGAINST THE RATE THE
   FIRM ALREADY SET, AND DOES NOTHING ELSE. It does not suggest a billing rate,
   propose a target realization figure, say which hours to write off, compare
   anything to a published firm average, or say what a matter should have been
   worth. Every one of those is either a market guess or the owner's own
   judgment, dressed up as arithmetic.

   ── WHAT WAS REUSED, AND WHY EACH ONE FITS ──────────────────────────────────

   `daysBetween` IS recall.js's AND NOT A SECOND COPY. It was read before this
   was written, and it fits for reasons specific to unbilled work rather than
   "it does dates":

     IT RETURNS NULL FOR A DATE IT CANNOT READ, never NaN and never zero. A last
     activity date this cannot parse must not age to nothing, because zero days
     is a real and flattering answer — it says the matter was touched today,
     which would sort five months of unbilled work to the bottom of the one list
     this tool exists to put things at the top of.

     IT IS WHOLE DAYS BETWEEN TWO PLAIN ISO DAYS. Time is logged against a day
     and a matter goes quiet over months; nothing here counts in anything finer.

     IT TAKES NO VIEW ON DIRECTION, so an activity date typed in the future comes
     back negative and can be NAMED rather than printed into a days column.

   That is every tool on this shelf that counts whole days, on one function,
   with no copy of it anywhere. No count is written here — this line held one and
   it went stale the next time a tool joined, which is what happened in every
   engine that copied this paragraph.

   `money` IS format.js's. Two engines on this shelf once hand-rolled a dollar
   sign onto toFixed(2) and printed `$1554.96` in a problems panel two inches
   under a column reading `$1,554.96`. See LEDGER L-379; `npm run gate` refuses
   a third.

   ── THE UNITS, AND THE ONE PLACE THE HOUSE SUFFIX IS AMBIGUOUS ──────────────

   Money is integer cents. Hours are integer HUNDREDTHS OF AN HOUR, so 2.50
   hours is 250 — which is how a time record is kept, because the billing
   increment is a tenth of an hour. The three realization ratios are integer
   hundredths OF A PER CENT, so 87.42% is 8742.

   ⚠ SO THE `Hundredths` SUFFIX NAMES THE SCALE AND THE NOUN NAMES THE QUANTITY,
   AND THIS IS THE FIRST ENGINE ON THE SHELF WHERE THE TWO DIFFER. The house
   convention retainage.js wrote down, and `npm run gate` now enforces, is that
   a value kept in integer hundredths carries the suffix. It was written when
   every such value was a per cent. `hoursWorkedHundredths` is hundredths of an
   HOUR and `billingRealizationHundredths` is hundredths of a PER CENT, and that
   is why the two divisors below are different:

     worth   = hoursWorkedHundredths * standardRateCents / 100
               (a rate is cents per WHOLE hour, so hundredths of an hour divides
               by a hundred — dividing by ten thousand here would price 18.40
               hours at $300 an hour at $55.20, which is a plausible-looking
               figure and wrong by a factor of a hundred)

     ratios  = numerator * 10000 / denominator
               (a share expressed in hundredths of a per cent)

   Read the noun, not the suffix. The gate can see that a divisor by ten
   thousand has a suffixed field somewhere in the file; it cannot see which
   quantity that field measures, and on this engine both kinds are present.
   ============================================================================ */

import { daysBetween } from './recall.js';
import { money as usd } from './format.js';

/**
 * @param {object} input
 * @param {string} input.asOf   ISO day the matters are aged to
 * @param {Array}  input.matters
 *   [{id, ref, timekeeper, hoursWorkedHundredths, hoursBilledHundredths,
 *     standardRateCents, billedCents, collectedCents, writeOffReason,
 *     lastActivityOn}]
 *   standardRateCents  NULL means no rate has been entered against this line.
 *                      0 means one has, and it is nothing — a matter taken on
 *                      at no charge. Two different claims, spelled differently.
 *   writeOffReason     Free text, in the practice's own words. Empty means
 *                      nobody has recorded why anything came off.
 *   lastActivityOn     NULL while a matter is live and nobody has written a date
 *                      against it, which on a running file is not an error.
 */
export function computeBillableHours(input) {
  const asOf = input.asOf;
  /* THE HOUSE DATE IS CHECKED THROUGH THE INSTRUMENT THAT WILL BE USED ON IT.
     daysBetween(asOf, asOf) is null exactly when asOf is unreadable, so this
     asks the question with the same parser rather than with a second one that
     could disagree. Same shape as retainage.js and draw-schedule.js. */
  const asOfOk = !!asOf && daysBetween(asOf, asOf) != null;
  const src = Array.isArray(input.matters) ? input.matters : [];

  const set = (v) => v != null && v !== '' && Number.isFinite(Number(v));
  const whole = (v) => Math.max(0, Math.round(Number(v) || 0));

  const rows = src.map((m) => {
    const worked = whole(m.hoursWorkedHundredths);
    const billedHours = whole(m.hoursBilledHundredths);
    const billed = whole(m.billedCents);
    const collected = whole(m.collectedCents);

    /* NOT SET AND ZERO ARE DIFFERENT STATES ON THE RATE, and they are spelled
       differently below. A line with no rate against it is not a line worth
       nothing; a line taken on at no charge is worth nothing and that is a real
       answer. Collapsing the two would print a confident $0.00 of value beside
       a column of real money and call it the same thing. */
    const rateSet = set(m.standardRateCents);
    const rate = rateSet ? Math.max(0, Math.round(Number(m.standardRateCents))) : null;

    /* WHAT THE WORK IS WORTH AT THE RATE THE FIRM ALREADY SET. Nothing here
       proposes a rate; this is the figure on their own rate card multiplied by
       the hours on their own time record. */
    const worth = rateSet ? Math.round((worked * rate) / 100) : null;
    /* A DENOMINATOR OF NOTHING IS NOT A DENOMINATOR. Every ratio below divides
       by a figure that can be zero, and each one returns NULL rather than a
       confident 0.00% — a realization of nothing means the practice collected
       nothing, and an undefined realization means there was nothing to collect
       a share of. Those are opposite readings of the same blank cell. */
    const worthCounts = worth != null && worth > 0;

    /* THE TWO HALVES OF THE LEAK, EACH SIGNED AND NEITHER CLAMPED. Positive is
       money lost; negative is the opposite thing happening — billed above the
       rate card, or more collected than was invoiced — and folding either into
       an absolute figure would report a practice as leaking when one matter
       carried a premium and another was written down by the same amount. */
    const writtenDownNet = worth == null ? null : worth - billed;
    const writtenDown = writtenDownNet == null ? null : Math.max(0, writtenDownNet);
    const overStandard = writtenDownNet == null ? null : Math.max(0, -writtenDownNet);
    const notCollectedNet = billed - collected;
    const notCollected = Math.max(0, notCollectedNet);
    const overCollected = Math.max(0, -notCollectedNet);

    const hoursNotBilled = worked - billedHours;

    const billingRealizationHundredths = worthCounts
      ? Math.round((billed * 10000) / worth) : null;
    const collectionRealizationHundredths = billed > 0
      ? Math.round((collected * 10000) / billed) : null;
    const overallRealizationHundredths = worthCounts
      ? Math.round((collected * 10000) / worth) : null;

    /* THE DATE IS ASKED FOR TWICE — is it there, and can it be read — because a
       live matter nobody has dated and a matter whose date was typed
       "03/18/2026" are different states, and the sentences below have to say
       which one this is. */
    const activityGiven = !!m.lastActivityOn;
    const activityOk = activityGiven && daysBetween(m.lastActivityOn, m.lastActivityOn) != null;
    const rawDays = activityOk && asOfOk ? daysBetween(m.lastActivityOn, asOf) : null;
    /* AN ACTIVITY DATE AFTER THE SHEET IS A TYPO AND IS NAMED RATHER THAN
       PRINTED. The box records the last day somebody DID something, so a date
       still to come is a year keyed wrong — and left alone it puts a negative
       into a days column, which is a plausible-looking number and the wrong
       one. */
    const activityAhead = rawDays != null && rawDays < 0;
    /* AND THEN IT IS AGED AGAINST NOTHING, WHICH IS WHAT THE SENTENCE BELOW
       SAYS. draw-schedule.js names the same shape and leaves the negative in
       its row, so its own refusal text and its own days column disagree by a
       few hundred days. A row this cannot age must carry no age. */
    const daysSinceActivity = activityAhead ? null : rawDays;
    const reasonGiven = !!(m.writeOffReason && String(m.writeOffReason).trim());

    /* THE FINDING, AS ONE FLAG. Hours worked, nothing invoiced, and nobody has
       written down why. A matter billed in full is the case that WORKED and must
       not appear here, and a matter written off with a reason is a decision
       somebody already took — otherwise this list is every matter on the sheet
       rather than the work nobody has decided anything about. */
    const unbilled = worked > 0 && billed === 0 && !reasonGiven;

    return {
      ...m,
      worked, billedHours, billed, collected, rate, rateSet,
      worth, worthCounts, writtenDownNet, writtenDown, overStandard,
      notCollectedNet, notCollected, overCollected, hoursNotBilled,
      billingRealizationHundredths, collectionRealizationHundredths,
      overallRealizationHundredths,
      activityGiven, activityOk, activityAhead, daysSinceActivity,
      reasonGiven, unbilled,
      /* MORE HOURS BILLED THAN WORKED, and more collected than billed. Both are
         keying errors rather than achievements, and both are named. */
      billedOverWorked: billedHours > worked,
      collectedOverBilled: collected > billed,
      /* A PREMIUM NEEDS A RATE CARD ON BOTH SIDES. With no hours recorded the
         comparison is a bill against nothing, and calling that "a premium over
         the rate card" implies a comparison that was never made — the
         no-hours sentence below is the one that belongs to it. The ARITHMETIC
         is untouched: the signed difference is still carried, so the identity
         writtenDown − billedOverStandard = writtenDownNet still holds. */
      billedOverWorth: worth != null && worked > 0 && billed > worth,
      /* A REASON GIVEN FOR SOMETHING THAT DID NOT HAPPEN. Somebody recorded why
         time came off a bill and no time came off it, which means either the
         write-off was never applied or the reason belongs to another line. */
      /* THE TEST IS ON THE SIGNED FIGURE, not on the clamped one. A matter
         invoiced ABOVE the rate card also has a written-down of zero, and
         saying "the invoice matches the rate card to the cent" about it would
         be false — the premium sentence above is the one that belongs to it. */
      reasonNoWriteDown: reasonGiven && writtenDownNet != null && writtenDownNet === 0,
      workedNothing: worked === 0 && billed > 0,
      live: !activityGiven,
    };
  });

  /* SORTED BY DAYS SINCE LAST ACTIVITY, FURTHEST FIRST, with anything that has
     no date at the end rather than at either extreme. A row that cannot be aged
     must not sort as though it were the most urgent or the least; claim-aging
     and draw-schedule both do this and the reasoning carries. */
  const sorted = [...rows].sort((a, b) => {
    if (a.daysSinceActivity == null && b.daysSinceActivity == null) return 0;
    if (a.daysSinceActivity == null) return 1;
    if (b.daysSinceActivity == null) return -1;
    return b.daysSinceActivity - a.daysSinceActivity;
  });

  /* TWO DENOMINATORS, NOT ONE, because the two halves of this page need
     different things to be true. What the HOURS come to needs a time record and
     nothing else. What the work was WORTH needs a rate as well, so a matter
     with no rate against it drops out of the money without dropping out of the
     hours — which is the one figure on this page that does not depend on
     anybody having entered a rate. */
  const rated = rows.filter((r) => r.worth != null);
  const flagged = rows.filter((r) => r.unbilled);
  const aged = flagged.filter((r) => r.daysSinceActivity != null && r.daysSinceActivity >= 0);
  const sum = (list, f) => list.reduce((a, r) => a + f(r), 0);

  const worth = sum(rated, (r) => r.worth);
  const billed = sum(rows, (r) => r.billed);
  const collected = sum(rows, (r) => r.collected);

  const totals = {
    matters: rows.length,
    rated: rated.length,
    hoursWorkedHundredths: sum(rows, (r) => r.worked),
    hoursBilledHundredths: sum(rows, (r) => r.billedHours),
    hoursNotBilledHundredths: sum(rows, (r) => r.hoursNotBilled),
    worth,
    billed,
    collected,
    /* LOST AT BILLING AND LOST AT COLLECTION, footed over the POSITIVE side
       only, with the opposite direction carried beside each one. The identity
       below is what the gate checks: the two directions must foot back to the
       signed difference, which no clamped engine can do. */
    writtenDown: sum(rated, (r) => r.writtenDown),
    billedOverStandard: sum(rated, (r) => r.overStandard),
    writtenDownNet: sum(rated, (r) => r.writtenDownNet),
    notCollected: sum(rows, (r) => r.notCollected),
    overCollected: sum(rows, (r) => r.overCollected),
    notCollectedNet: billed - collected,
    /* THE THREE HOUSE RATIOS, computed here rather than on the page. A ratio
       derived in an island is arithmetic no Node gate can check, and all three
       divide by a figure that can be nothing. */
    billingRealizationHundredths: worth > 0 ? Math.round((billed * 10000) / worth) : null,
    collectionRealizationHundredths: billed > 0 ? Math.round((collected * 10000) / billed) : null,
    overallRealizationHundredths: worth > 0 ? Math.round((collected * 10000) / worth) : null,
    /* THE SECOND FINDING, AS ARITHMETIC. */
    unbilled: flagged.length,
    unbilledHoursHundredths: sum(flagged, (r) => r.worked),
    unbilledCents: sum(flagged, (r) => (r.worth == null ? 0 : r.worth)),
    /* THE LONGEST A MATTER HAS GONE QUIET WITH HOURS ON IT AND NO INVOICE,
       taken over the FLAGGED matters and not over every matter — a file closed
       and paid two years ago would otherwise set this figure while being the
       case that worked. NULL rather than zero when nothing is flagged, because
       zero days would read as "one of these went quiet today". */
    oldestUnbilledDays: aged.length ? Math.max(...aged.map((r) => r.daysSinceActivity)) : null,
    live: rows.filter((r) => r.live).length,
  };

  const problems = [];
  const money = (c) => usd(Math.abs(c) / 100, { cents: true });
  const hrs = (h) => `${(Math.abs(h) / 100).toFixed(2)} hours`;
  const pc = (h) => `${(h / 100).toFixed(2)}%`;
  const days = (n) => `${n} ${n === 1 ? 'day' : 'days'}`;
  const name = (r) => r.ref || 'A matter';
  const who = (r) => (r.timekeeper ? `${name(r)} (${r.timekeeper})` : name(r));

  if (!asOfOk) {
    problems.push(`The date this sheet is counted to reads "${asOf == null || asOf === '' ? '' : asOf}", which is not a date this can use. It wants YYYY-MM-DD, and until it has one no matter can be aged since anybody last touched it.`);
  }

  for (const r of sorted) {
    if (!r.rateSet) {
      problems.push(`${who(r)} has no standard rate entered, so there is nothing to say what its ${hrs(r.worked)} are worth. That is a rate nobody typed rather than work with no value in it, and every realization figure above that line is undefined rather than nothing.`);
    } else if (r.rate === 0) {
      problems.push(`${who(r)} is written at a standard rate of nothing, which is a real answer and not a missing one. Its ${hrs(r.worked)} are worth nothing to measure a bill against, so its realization is undefined rather than zero.`);
    }
    if (r.activityGiven && !r.activityOk) {
      problems.push(`The last activity date on ${name(r)} reads "${r.lastActivityOn}", which is not a date this can use. It wants YYYY-MM-DD, and that matter is aged against nothing until it has one.`);
    }
    if (r.activityAhead) {
      problems.push(`${name(r)} is dated last worked on ${r.lastActivityOn}, which is after ${asOf}. That box records the last day somebody did something, so a date still to come is a year or a month keyed wrong rather than work waiting to happen, and it is aged against nothing.`);
    }
    if (r.billedOverWorked) {
      problems.push(`${name(r)} has ${hrs(r.billedHours)} billed against ${hrs(r.worked)} worked, so more time went on the invoice than the time record carries. This cannot tell a mis-keyed entry from time logged to the wrong matter, and it takes no view on which it is.`);
    }
    if (r.collectedOverBilled) {
      problems.push(`${money(r.collected)} has come in against ${name(r)} and ${money(r.billed)} was invoiced, so more was collected than was ever billed. That is usually a payment posted to the wrong matter, and until it is moved the collection figure on this sheet is somebody else's money.`);
    }
    if (r.billedOverWorth) {
      problems.push(`${name(r)} was invoiced ${money(r.billed)} against ${hrs(r.worked)} at ${money(r.rate)} an hour, which comes to ${money(r.worth)} — a premium of ${money(r.overStandard)} over the rate card. This page prints that and takes no view on it: a bill above the standard rate is a decision somebody made, and it is not this sheet's to second-guess.`);
    }
    if (r.workedNothing) {
      problems.push(`${money(r.billed)} was invoiced against ${name(r)} and no hours are recorded on it at all. There is nothing to measure that bill against, so it counts toward what was billed and toward nothing else.`);
    }
    if (r.unbilled) {
      problems.push(`${who(r)} carries ${hrs(r.worked)} worth ${money(r.worth == null ? 0 : r.worth)}, has never been invoiced, and has no write-off reason recorded${r.daysSinceActivity == null ? ' — and nobody has dated the last work on it' : `, with nothing done on it for ${days(r.daysSinceActivity)}`}. Nothing anywhere else you have will show this, because a receivables report has a row for every invoice and none at all for the one nobody raised.`);
    }
    if (r.reasonNoWriteDown) {
      problems.push(`${name(r)} records "${String(r.writeOffReason).trim()}" as why time came off the bill, and nothing came off it — the invoice matches the rate card to the cent. Either the write-off was never applied or that reason belongs to another line.`);
    }
  }

  /* ONE MATTER MAY LEGITIMATELY CARRY SEVERAL TIMEKEEPERS, which is why the key
     is the PAIR and not the matter. A partner and a paralegal on one file are
     two rows on every real time record, and refusing that would refuse the
     ordinary case.

     THE PAIR IS CARRIED ALONGSIDE ITS KEY RATHER THAN PARSED BACK OUT OF ONE. A
     matter is named in words — "Ferry Point rezoning" — so a key joined on any
     printable character can be split apart wrongly by a matter that contains it,
     and the sentence below would then name the wrong timekeeper while every
     count stayed right. */
  const pairs = new Map();
  for (const r of rows) {
    if (!r.ref) continue;
    const key = JSON.stringify([r.ref, r.timekeeper || '']);
    if (!pairs.has(key)) pairs.set(key, { ref: r.ref, timekeeper: r.timekeeper, n: 0 });
    pairs.get(key).n += 1;
  }
  for (const { ref, timekeeper, n } of pairs.values()) {
    if (n > 1) {
      problems.push(`There is more than one line for ${ref} under ${timekeeper || 'no timekeeper'}, so two rows on this sheet are the same person's time on the same matter as far as anybody reading it can tell.`);
    }
  }
  if (rows.length === 0) {
    problems.push('There are no matters on this sheet, so there is nothing to work out.');
  }

  return { rows: sorted, totals, problems };
}
