/* ============================================================================
   RETAINER BURN — what a client bought, what they used, and what disappears at
   the end of the period.

   ── WHY THIS BELONGS TO THE OWNER OF THE SHOP AND NOT TO A PLATFORM ─────────

   A retainer is two agreements wearing one number. The first is a price: this
   many dollars a month. The second is a RULE about what happens to the hours
   that price bought and nobody used — they roll over in full, they roll over up
   to a cap, or they are gone at midnight on the last day of the period.

   That second half is the owner's own invention. It is not a rate, it is not a
   discount, and no two shops write it the same way: one agency carries
   everything forward forever, the next carries five hours and no more, the next
   carries nothing and says so in the engagement letter. Time-tracking software
   knows the hours. Accounting software knows the fee. The rule that decides
   which of those hours survive the month was never keyed into either one,
   because it lives in a paragraph somebody wrote once.

   ── THE FIRST FINDING: HOURS ALREADY PAID FOR ARE ABOUT TO DISAPPEAR ────────

   This is the actionable half. Under a no-rollover or a capped policy, unused
   hours expire when the period closes — and nobody looks until after it has
   closed, at which point the work that could have been delivered against them
   is gone and so is the goodwill it would have bought. The client paid for
   those hours. They will not feel like they got them.

   Sorted by days left in the period, FEWEST FIRST, which is the same shape
   claim-aging.js uses for its payers and billable-hours.js for its quiet
   matters, for the same reason: the top of the list is where this week's
   conversation starts. A period that has already closed sorts above one closing
   today, because minus thirty-one is fewer days than nought — and its own row
   says the hours are gone rather than going.

   ── THE SECOND FINDING: THE FEE IS FIXED AND THE HOURLY RATE IS NOT ─────────

   A retainer at one price is a different rate every period. Bill the same
   $2,400 against 9.40 hours and it worked out at $255.32 an hour; against 26.80
   hours it worked out at $111.94. Same agreement, same invoice, and the shop
   feels the difference in a way no statement shows, because a statement prints
   the fee and the fee never moves.

   So the rate the fee bought — the fee over the hours it INCLUDES — is printed
   beside the rate it actually came to — the fee over the hours actually USED.
   Both are arithmetic on figures the shop already has. Neither is a judgment
   about whether the price is right.

   ⚠ THIS REPORTS WHAT THE AGREEMENT THEY ALREADY WROTE DOES TO THE HOURS THEY
   ALREADY LOGGED, AND NOTHING ELSE. It does not suggest a retainer fee, propose
   a rollover policy, set an overage rate, name a target utilization, say
   whether a client is worth keeping, or forecast next period's usage. Every one
   of those is either a market guess or the owner's own judgment wearing
   arithmetic's clothes.

   ── WHAT WAS REUSED, AND WHY EACH ONE FITS ──────────────────────────────────

   `daysBetween` IS recall.js's AND NOT A SECOND COPY. It was read before this
   was written, and it fits for reasons specific to a period running down rather
   than "it does dates":

     IT RETURNS NULL FOR A DATE IT CANNOT READ, never NaN and never zero. A
     period end this cannot parse must not count as nought days left, because
     nought days left is a real and urgent answer — it means the period closes
     tonight — and it would put a row nobody can time at the top of the one list
     this tool exists to order.

     IT TAKES NO VIEW ON DIRECTION, so a period that has already ended comes back
     negative rather than clamped. That is exactly the reading this page wants:
     the hours on a closed period are GONE, not going, and a clamped zero would
     have said they were still there to be used tonight.

     IT IS WHOLE DAYS BETWEEN TWO PLAIN ISO DAYS. A retainer period is written on
     an engagement letter as two dates, and nothing here counts in anything
     finer than a day.

   That is every tool on this shelf that counts whole days, on one function,
   with no copy of it anywhere. NO COUNT AND NO LIST IS WRITTEN HERE: both went
   stale the next time a tool joined, in this file and in three others. The list
   is `grep -l "import { daysBetween }" src/lib/`, which cannot be wrong.

   `money` IS format.js's. Two engines on this shelf once hand-rolled a dollar
   sign onto toFixed(2) and printed `$1554.96` in a problems panel two inches
   under a column reading `$1,554.96`. See LEDGER L-379; `npm run gate` refuses
   a third.

   ── THE UNITS, AND THE DIVISOR THAT IS EASY TO GET WRONG ────────────────────

   Money is integer cents. Hours are integer HUNDREDTHS OF AN HOUR, so 41.20
   hours is 4120 — the way a time record is kept, because the billing increment
   is a tenth of an hour.

   ⚠ EVERY `Hundredths` FIELD IN THIS FILE IS HUNDREDTHS OF AN HOUR, and there
   is no per cent anywhere in it. So every rate multiplication divides by A
   HUNDRED and never by ten thousand:

     value = hoursHundredths * centsPerWholeHour / 100

     4120 hundredths of an hour at 25000 cents an hour is 103,000,000, over 100
     is 1,030,000 cents, which is $10,300.00. Dividing by ten thousand instead
     gives $103.00 — a plausible-looking figure, wrong by a factor of a hundred,
     and `npm run gate`'s divisor rule cannot see it because that rule only
     asks whether a file dividing by ten thousand names a suffixed field. Read
     the noun. billable-hours.js is the engine where both kinds live, and it is
     worth reading beside this one.
   ============================================================================ */

import { daysBetween } from './recall.js';
import { money as usd } from './format.js';

/** The three rules a shop can write. Anything else is named rather than guessed. */
export const ROLLOVER_POLICIES = ['none', 'full', 'capped'];

/**
 * @param {object} input
 * @param {string} input.asOf   ISO day the ledger is counted to
 * @param {Array}  input.retainers
 *   [{id, ref, periodStart, periodEnd, retainerFeeCents, hoursIncludedHundredths,
 *     hoursUsedHundredths, carriedInHundredths, rolloverPolicy,
 *     rolloverCapHundredths, overageRateCents}]
 *   retainerFeeCents         NULL means nobody has entered what the client pays.
 *                            0 means one has, and it is nothing — a period
 *                            carried at no fee. Two different claims.
 *   hoursIncludedHundredths  NULL means nobody has entered how many hours the
 *                            fee buys. 0 means the fee buys none of them, which
 *                            is a real arrangement and not a blank.
 *   rolloverCapHundredths    NULL means no cap has been entered. Only means
 *                            anything under a 'capped' policy.
 *   overageRateCents         NULL means overage is not charged on this retainer.
 *                            0 means it is charged at nothing, which is the same
 *                            money and a different agreement.
 */
export function computeRetainerBurn(input) {
  const asOf = input.asOf;
  /* THE HOUSE DATE IS CHECKED THROUGH THE INSTRUMENT THAT WILL BE USED ON IT.
     daysBetween(asOf, asOf) is null exactly when asOf is unreadable, so this
     asks the question with the same parser rather than with a second one that
     could disagree. Same shape as billable-hours.js and draw-schedule.js. */
  const asOfOk = !!asOf && daysBetween(asOf, asOf) != null;
  const src = Array.isArray(input.retainers) ? input.retainers : [];

  const set = (v) => v != null && v !== '' && Number.isFinite(Number(v));
  const whole = (v) => Math.max(0, Math.round(Number(v) || 0));
  const readable = (d) => !!d && daysBetween(d, d) != null;

  const rows = src.map((x) => {
    const feeSet = set(x.retainerFeeCents);
    const fee = feeSet ? whole(x.retainerFeeCents) : null;
    const includedSet = set(x.hoursIncludedHundredths);
    const included = includedSet ? whole(x.hoursIncludedHundredths) : null;
    const carriedIn = whole(x.carriedInHundredths);
    const used = whole(x.hoursUsedHundredths);

    /* AN UNENTERED "HOURS INCLUDED" COUNTS AS NOTHING TOWARD WHAT IS AVAILABLE,
       and that is the honest reading rather than a convenience: the client can
       only draw on hours somebody wrote down. What it must NOT do is make the
       rate per included hour come out at nought — see includedRate below. */
    const available = (included || 0) + carriedIn;
    const unused = Math.max(0, available - used);
    const over = Math.max(0, used - available);

    const policySet = ROLLOVER_POLICIES.includes(x.rolloverPolicy);
    const policy = policySet ? x.rolloverPolicy : null;
    const capSet = set(x.rolloverCapHundredths);
    const cap = capSet ? whole(x.rolloverCapHundredths) : null;

    /* THE OWNER'S OWN RULE, APPLIED AND NOT INVENTED. A policy this does not
       recognize carries NO carry-forward figure rather than a zero, because
       zero is what the strictest of the three rules produces and guessing it
       would print the harshest answer as though somebody had chosen it. */
    let carryForward = null;
    if (policy === 'none') carryForward = 0;
    else if (policy === 'full') carryForward = unused;
    else if (policy === 'capped') carryForward = capSet ? Math.min(unused, cap) : null;
    const expiring = carryForward == null ? null : unused - carryForward;

    /* TWO RATES OUT OF ONE FEE, AND EACH DIVIDES BY A FIGURE THAT CAN BE ZERO.
       Both return NULL rather than a confident $0.00: a rate of nothing says
       the shop worked for free, and an undefined rate says there was nothing to
       divide the fee by. Those are opposite readings of the same blank cell. */
    const includedRate = fee != null && included != null && included > 0
      ? Math.round((fee * 100) / included) : null;
    const effectiveRate = fee != null && used > 0
      ? Math.round((fee * 100) / used) : null;
    const expiringValue = expiring == null || includedRate == null
      ? null : Math.round((expiring * includedRate) / 100);

    const overageRateSet = set(x.overageRateCents);
    const overageRate = overageRateSet ? whole(x.overageRateCents) : null;
    const overageDue = overageRateSet ? Math.round((over * overageRate) / 100) : null;

    /* THE PERIOD, ASKED FOR TWICE — is there a date, and can it be read —
       because a blank period end and one typed "09/30/2026" are different
       states and the sentences below have to say which one this is. */
    const startOk = readable(x.periodStart);
    const endOk = readable(x.periodEnd);
    const spanOk = startOk && endOk;
    const spanDays = spanOk ? daysBetween(x.periodStart, x.periodEnd) : null;
    const datesReversed = spanDays != null && spanDays < 0;
    const daysLeft = endOk && asOfOk ? daysBetween(asOf, x.periodEnd) : null;

    return {
      ...x,
      fee, feeSet, included, includedSet, carriedIn, used,
      available, unused, over,
      policy, policySet, cap, capSet, carryForward, expiring,
      includedRate, effectiveRate, expiringValue,
      overageRate, overageRateSet, overageDue,
      startOk, endOk, spanDays, datesReversed, daysLeft,
      /* A CLOSED PERIOD IS A FACT ABOUT THE DATE AND NOT ABOUT THE HOURS.
         Anything this cannot time is neither closed nor open, and it is carried
         as null rather than folded into either. */
      periodClosed: daysLeft == null ? null : daysLeft < 0,
      /* HOURS WORKED BEYOND THE RETAINER THAT NOTHING CAN BILL. Not an error —
         plenty of shops absorb overage deliberately — but it is the one figure
         on this page that is work delivered and money never asked for. */
      unbillableOver: over > 0 && !overageRateSet,
      /* AN OVERRUN ON A FULL-ROLLOVER RETAINER THAT CARRIED HOURS IN. Worth
         naming on its own, because the reader's first thought is that the bank
         of carried hours should have covered it and it did not. */
      overspentBank: over > 0 && policy === 'full' && carriedIn > 0,
    };
  });

  /* SORTED BY DAYS LEFT, FEWEST FIRST, with anything that cannot be timed at
     the end rather than at either extreme. A row with no readable period end
     must not sort as though it were the most urgent or the least; claim-aging,
     draw-schedule and billable-hours all do this and the reasoning carries. */
  const sorted = [...rows].sort((a, b) => {
    if (a.daysLeft == null && b.daysLeft == null) return 0;
    if (a.daysLeft == null) return 1;
    if (b.daysLeft == null) return -1;
    return a.daysLeft - b.daysLeft;
  });

  const sum = (list, f) => list.reduce((a, r) => a + f(r), 0);
  const priced = rows.filter((r) => r.includedRate != null);
  /* THREE BUCKETS FOR ONE FIGURE, because "hours that expire" is three
     different claims depending on where the period is. Going, gone, and
     cannot be timed — and the identity below is what stops a row falling
     between them. */
  const known = rows.filter((r) => r.expiring != null);
  const going = known.filter((r) => r.periodClosed === false);
  const gone = known.filter((r) => r.periodClosed === true);
  const untimed = known.filter((r) => r.periodClosed == null);
  const goingWithHours = going.filter((r) => r.expiring > 0);

  /* TWO DENOMINATORS, NOT ONE, AND EACH IS PAIRED WITH ITS OWN NUMERATOR.
     What the fee BOUGHT needs a fee and a count of included hours on the same
     line, so a retainer missing either one leaves both sides of that rate — an
     earlier draft summed every fee over every included hour and reported the
     house rate falling by ten per cent when one client's fee was blanked, which
     is a figure about a missing box rather than about the work. What the work
     CAME TO needs a fee and hours used. The hours themselves need neither, so
     the ledger's own hour totals foot over every row. */
  const feeRows = rows.filter((r) => r.fee != null);
  const fee = sum(feeRows, (r) => r.fee);
  const usedOnPricedRows = sum(feeRows, (r) => r.used);
  const pricedFee = sum(priced, (r) => r.fee);
  const pricedIncluded = sum(priced, (r) => r.included);
  const included = sum(rows.filter((r) => r.included != null), (r) => r.included);
  const used = sum(rows, (r) => r.used);

  const totals = {
    retainers: rows.length,
    priced: priced.length,
    feeCents: fee,
    hoursIncludedHundredths: included,
    carriedInHundredths: sum(rows, (r) => r.carriedIn),
    hoursAvailableHundredths: sum(rows, (r) => r.available),
    hoursUsedHundredths: used,
    hoursUnusedHundredths: sum(rows, (r) => r.unused),
    hoursOverHundredths: sum(rows, (r) => r.over),
    carryForwardHundredths: sum(known, (r) => r.carryForward),
    /* THE FIRST FINDING, AS ARITHMETIC. `expiring` is what is still to be lost;
       `expired` is what already has been. They are printed apart because one is
       a conversation to have this week and the other is one to have about the
       last invoice. */
    expiringHundredths: sum(going, (r) => r.expiring),
    expiringValueCents: sum(going, (r) => (r.expiringValue == null ? 0 : r.expiringValue)),
    expiringOn: goingWithHours.length,
    expiredHundredths: sum(gone, (r) => r.expiring),
    expiredValueCents: sum(gone, (r) => (r.expiringValue == null ? 0 : r.expiringValue)),
    expiredOn: gone.filter((r) => r.expiring > 0).length,
    /* HOURS THAT WOULD EXPIRE ON A PERIOD NOBODY CAN TIME. Never folded into
       either figure above, and counted so a row cannot fall out of the page
       between two buckets. */
    untimedExpiringHundredths: sum(untimed, (r) => r.expiring),
    /* ROWS WHERE THE RULE COULD NOT BE APPLIED AT ALL — a policy this does not
       know, or a capped policy with no cap under it. They carry no carry-forward
       and no expiring figure, so without this count they would leave the page
       through a gap between two buckets. */
    ruleNotApplied: rows.length - known.length,
    /* THE FEWEST DAYS LEFT ON A PERIOD THAT STILL HAS HOURS TO LOSE. NULL when
       nothing is going to expire, because nought days would read as "one of
       these closes tonight". */
    soonestDaysLeft: goingWithHours.length
      ? Math.min(...goingWithHours.map((r) => r.daysLeft)) : null,
    /* THE SECOND FINDING, AS ARITHMETIC. Both divide by a figure that can be
       nothing, and both return NULL rather than a rate of nought. */
    includedRateCents: pricedIncluded > 0 ? Math.round((pricedFee * 100) / pricedIncluded) : null,
    effectiveRateCents: usedOnPricedRows > 0 ? Math.round((fee * 100) / usedOnPricedRows) : null,
    overageDueCents: sum(rows.filter((r) => r.overageDue != null), (r) => r.overageDue),
    unbillableOverHundredths: sum(rows.filter((r) => r.unbillableOver), (r) => r.over),
    closed: rows.filter((r) => r.periodClosed === true).length,
  };

  const problems = [];
  const money = (c) => usd(Math.abs(c) / 100, { cents: true });
  const hrs = (h) => `${(Math.abs(h) / 100).toFixed(2)} hours`;
  const days = (n) => `${Math.abs(n)} ${Math.abs(n) === 1 ? 'day' : 'days'}`;
  const name = (r) => r.ref || 'A retainer';

  if (!asOfOk) {
    problems.push(`The date this ledger is counted to reads "${asOf == null || asOf === '' ? '' : asOf}", which is not a date this can use. It wants YYYY-MM-DD, and until it has one no period can be told how much of it is left.`);
  }

  for (const r of sorted) {
    if (!r.startOk) {
      problems.push(`The period start on ${name(r)} reads "${r.periodStart == null || r.periodStart === '' ? '' : r.periodStart}", which is not a date this can use. It wants YYYY-MM-DD, and until it has one nothing can say whether that period runs the right way round.`);
    }
    if (!r.endOk) {
      problems.push(`The period end on ${name(r)} reads "${r.periodEnd == null || r.periodEnd === '' ? '' : r.periodEnd}", which is not a date this can use. It wants YYYY-MM-DD, and that retainer has no days left rather than none left — its hours are not counted as going or as gone.`);
    }
    if (r.datesReversed) {
      problems.push(`${name(r)} runs from ${r.periodStart} to ${r.periodEnd}, which ends before it starts. This takes no view on which of the two dates is the typo. The days left on that line are counted to the end date exactly as it is typed, so that figure is wrong in whatever way the date is.`);
    }
    if (!r.policySet) {
      problems.push(`${name(r)} carries a rollover rule of "${r.rolloverPolicy == null || r.rolloverPolicy === '' ? '' : r.rolloverPolicy}", which is not one this can apply. It knows three: none, full, and capped. Nothing is carried forward for that line and nothing is shown as expiring, because guessing would print the strictest of the three as though you had chosen it.`);
    }
    if (r.policy === 'capped' && !r.capSet) {
      problems.push(`${name(r)} is set to carry hours forward up to a cap and no cap has been entered. A capped rule with no number in it is not a rule, so nothing is carried forward and nothing is shown as expiring on that line until you say how many hours survive the close.`);
    }
    if (r.policy !== 'capped' && r.capSet) {
      problems.push(`${name(r)} carries a rollover cap of ${hrs(r.cap)} under a "${r.policy || 'unreadable'}" rule, which is a cap governing nothing. Either that line should be capped, or the cap belongs to another client — as it stands the number is on the ledger and changes no figure on it.`);
    }
    if (r.policy === 'none' && r.carriedIn > 0) {
      problems.push(`${name(r)} shows ${hrs(r.carriedIn)} brought forward from last period under a rule that carries nothing forward. Those hours are counted as available here because somebody wrote them down, and under this client's own rule they should not exist — either the rule changed and the ledger did not, or the hours belong to another period.`);
    }
    if (r.used > 0 && !r.includedSet) {
      problems.push(`${hrs(r.used)} are logged against ${name(r)} and nobody has entered how many hours the fee buys. That is a figure nobody typed rather than a fee that buys nothing, so the hours available are counted from what was carried in alone and the rate the fee bought is undefined rather than nought.`);
    } else if (r.used > 0 && r.included === 0) {
      problems.push(`${name(r)} is written as a fee that buys no hours at all, which is a real arrangement and not a blank one. Every one of its ${hrs(r.used)} is over the retainer, and there is no rate per included hour to work out because there are no included hours to divide by.`);
    }
    if (r.used > 0 && !r.feeSet) {
      problems.push(`${hrs(r.used)} are logged against ${name(r)} and nobody has entered what the client pays for the period. The rate that work came to is undefined rather than nothing, and that line adds no money to anything on this page.`);
    } else if (r.used > 0 && r.fee === 0) {
      problems.push(`${name(r)} is written at a fee of nothing for the period, which is a real answer and not a missing one. Its ${hrs(r.used)} came to nought an hour, and that is what the arithmetic says rather than a figure this could not work out.`);
    }
    if (r.unbillableOver) {
      problems.push(`${name(r)} is ${hrs(r.over)} over its retainer and carries no overage rate, so that work is delivered and cannot be billed by anything on this ledger. This takes no view on whether it should be — plenty of shops absorb the overrun on purpose — but nowhere else you have will show it, because there is no invoice line for work nobody charged for.`);
    }
    if (r.overspentBank) {
      problems.push(`${name(r)} carries hours forward in full, brought ${hrs(r.carriedIn)} in, and is still ${hrs(r.over)} over. The overrun is on this period rather than on the bank: ${hrs(r.used)} were used against ${hrs(r.available)} available, and the carried hours were spent before the overage started.`);
    }
    if (r.periodClosed === true && r.expiring > 0) {
      problems.push(`${name(r)} closed on ${r.periodEnd}, ${days(r.daysLeft)} ago, with ${hrs(r.expiring)} unused and a rule that does not carry them. Those hours are gone rather than going — ${money(r.expiringValue == null ? 0 : r.expiringValue)} of work the client paid for and did not get, and nothing on this page can put them back.`);
    }
  }

  /* ONE CLIENT MAY LEGITIMATELY HAVE SEVERAL RETAINERS, which is why the key is
     the PAIR of client and period start and not the client alone. A shop that
     bills a client monthly has twelve rows for them in a year and refusing that
     would refuse the ordinary case.

     THE PAIR IS CARRIED ALONGSIDE ITS KEY RATHER THAN PARSED BACK OUT OF ONE. A
     client is named in words, so a key joined on any printable character can be
     split apart wrongly by a name that contains it, and the sentence below would
     then name the wrong period while every count stayed right. */
  const pairs = new Map();
  for (const r of rows) {
    if (!r.ref) continue;
    const key = JSON.stringify([r.ref, r.periodStart || '']);
    if (!pairs.has(key)) pairs.set(key, { ref: r.ref, periodStart: r.periodStart, n: 0 });
    pairs.get(key).n += 1;
  }
  for (const { ref, periodStart, n } of pairs.values()) {
    if (n > 1) {
      problems.push(`There is more than one line for ${ref} starting ${periodStart || 'on no date at all'}, so two rows on this ledger are the same client's same period as far as anybody reading it can tell, and both are counted.`);
    }
  }
  if (rows.length === 0) {
    problems.push('There are no retainers on this ledger, so there is nothing to work out.');
  }

  return { rows: sorted, totals, problems };
}
