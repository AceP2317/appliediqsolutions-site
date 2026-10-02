/* ============================================================================
   RETAINAGE HELD — what a trade has earned, been paid for, and is still
   waiting on.

   ── WHY THIS BELONGS TO THE OWNER OF THE BUSINESS AND NOT TO A PLATFORM ─────

   Accounting software knows what was invoiced and it knows what came in. It
   does not know why the two disagree, because the reason is not in either
   number: it is a clause in a contract that nobody keyed anywhere. Retainage is
   a percentage the general contractor holds back off every pay application, and
   it is released when one named condition is satisfied — substantial
   completion, the punch list signed off, the final lien waiver filed. The
   percentage differs per contract and so does the condition, because both were
   negotiated one job at a time.

   That is why no platform holds this. There is no industry retainage rate to
   default to and no standard release condition to key against, so the only
   place the rule exists is on the paper the trade signed.

   ── THE FIRST FINDING: THIS IS EARNED MONEY, AND IT HAS NO DOCUMENT ─────────

   A trade's books show what was billed and what was paid. Retainage sits in the
   gap between them, and on every report either side of that gap it is invisible
   — the invoice reads as billed, the payment reads as short, and the difference
   reads as a customer who pays slowly. It is none of those. It is work that was
   done, inspected, approved and billed, withheld on purpose, sitting in
   somebody else's bank account.

   So the headline here is what is held right now, and the page says in words
   what that figure is: money already earned. There is no second field for it in
   this engine and that is deliberate — one number under two names is how a page
   ends up printing it twice as though it were two findings.

   ── THE SECOND FINDING, AND IT IS THE REASON THIS TOOL EXISTS ───────────────

   THE RELEASE TRIGGER IS PER CONTRACT, AND MONEY SITS PAST IT.

   Every other figure here can be read off a statement with enough patience.
   This one cannot be read anywhere, because it is a comparison between a date
   written into one contract and today, and no ledger in the world sorts by it —
   a ledger sorts by invoice date, and every contract's trigger fell on a
   different day for a different reason.

   A contract whose condition was met four months ago with the money still held
   is a phone call that should already have happened. A contract still running
   has nothing to chase and is not a fault. Those two look identical on an
   aging report and they are not the same thing at all.

   Sorted by days past the trigger, furthest first — the same shape claim
   aging uses on payers, for the same reason: the top of the list is where the
   conversation starts.

   ⚠ THIS AGES WHAT THE CONTRACTS ALREADY SAY AND DOES NOTHING ELSE. It does not
   suggest a retainage percentage, say when to chase anybody, take a view on
   whether a hold-back is contractually valid, compare anything to a published
   industry figure, or compute interest on money held. Every one of those would
   be a legal opinion or a market guess dressed up as arithmetic.

   ── WHAT WAS REUSED, AND WHY EACH ONE FITS ──────────────────────────────────

   `daysBetween` IS recall.js's AND NOT A SECOND COPY. It was read before this
   was written, the same way unit-turn.js read it, and it fits for reasons that
   are specific rather than "it does dates":

     IT RETURNS NULL FOR A DATE IT CANNOT READ, never NaN and never zero. A
     trigger date this cannot parse must not age to nothing, because zero days
     past is a real and flattering answer — it says the condition was satisfied
     today, which would sort a four-month-old hold-back to the bottom of the
     list this tool exists to put things at the top of.

     IT IS WHOLE DAYS BETWEEN TWO PLAIN ISO DAYS. A release condition is
     satisfied on a date, not at a time, and nothing here counts in anything
     finer.

     IT TAKES NO VIEW ON DIRECTION. It goes negative the other way, which is
     exactly what a trigger date typed in the future needs to do so that this
     file can name it rather than printing a negative into a days column.

   That is every tool on this shelf that counts whole days, on one function,
   with no copy of it anywhere. No count is written here — this line carried one
   and it was wrong by six. The list is `grep -l "import { daysBetween }" src/lib/`.

   `money` IS format.js's. Two engines on this shelf once hand-rolled a dollar
   sign onto toFixed(2) and printed `$1554.96` in a problems panel two inches
   under a column reading `$1,554.96`. See LEDGER L-379; `npm run gate` refuses
   a third.

   ── THE UNITS, AND THE ONE THAT IS NOT WHAT IT LOOKS LIKE ───────────────────

   Money is integer cents. The retainage rate is integer HUNDREDTHS of a per
   cent, so ten per cent is 1000 — the house convention, and it is what lets a
   contract written at 7.5% divide without drifting over a hundred pay
   applications.

   `percentComplete` IS A WHOLE PER CENT AND CARRIES NO `Hundredths` SUFFIX, and
   the missing suffix is the whole warning. It is typed off a pay application,
   where it prints as a whole number, and it never multiplies anything — it is
   read only to notice that a job is finished. Giving it the house unit would
   put two percentages of different scales in one object, and the field name is
   the only thing that could ever tell them apart.
   ============================================================================ */

import { daysBetween } from './recall.js';
import { money as usd } from './format.js';

/**
 * @param {object} input
 * @param {string} input.asOf   ISO day the hold-backs are aged to
 * @param {Array}  input.contracts
 *   [{id, ref, customer, contractValueCents, billedToDateCents,
 *     retainagePctHundredths, retainedToDateCents, releasedToDateCents,
 *     percentComplete, triggerMet, triggerName}]
 *   retainagePctHundredths  NULL means nobody entered one, which is a different
 *                           state from 0 and is treated as one.
 *   triggerMet              NULL means the condition has not been satisfied
 *                           yet. On a running job that is not an error.
 *   triggerName             what the contract calls that condition, in the
 *                           trade's own words.
 */
export function computeRetainage(input) {
  const asOf = input.asOf;
  /* THE HOUSE DATE IS CHECKED THROUGH THE INSTRUMENT THAT WILL BE USED ON IT.
     daysBetween(asOf, asOf) is null exactly when asOf is unreadable, so this
     asks the question with the same parser rather than with a second one that
     could disagree. Same shape as claim-aging.js and unit-turn.js. */
  const asOfOk = !!asOf && daysBetween(asOf, asOf) != null;
  const src = Array.isArray(input.contracts) ? input.contracts : [];

  const rows = src.map((c) => {
    const cents = (v) => Math.max(0, Math.round(Number(v) || 0));
    const contractValue = cents(c.contractValueCents);
    const billed = cents(c.billedToDateCents);
    const retained = cents(c.retainedToDateCents);
    const released = cents(c.releasedToDateCents);

    /* NOT SET AND ZERO ARE DIFFERENT STATES AND THEY ARE SPELLED DIFFERENTLY.
       A contract written with no retainage clause holds back nothing, and zero
       is the correct answer for it. An empty box is not that — it is a rate
       nobody has keyed, and reading it as zero would print a confident
       "should be $0.00 retained" beside a column showing thousands held, which
       reads as a dispute the tool invented. */
    const rawPct = c.retainagePctHundredths;
    const pctSet = rawPct != null && rawPct !== '' && Number.isFinite(Number(rawPct));
    const pct = pctSet ? Math.max(0, Math.round(Number(rawPct))) : null;
    const shouldBeRetained = pctSet ? Math.round((billed * pct) / 10000) : null;

    /* MORE RELEASED THAN WAS EVER HELD IS NOT CLAMPED AND IS NOT NETTED. A
       negative held figure folded into the headline would quietly reduce it —
       the one number on this page a trade would act on, made smaller by a
       bookkeeping contradiction. The row drops out of the money and is named. */
    const overReleased = released > retained;
    const heldNow = overReleased ? null : retained - released;
    const overHeld = shouldBeRetained == null ? null : retained - shouldBeRetained;

    /* EACH DATE IS ASKED FOR TWICE — is it there, and can it be read — because
       a condition nobody has met yet and a date typed as "8/14/26" are
       different states and the sentences below have to say which. */
    const triggerGiven = !!c.triggerMet;
    const triggerOk = triggerGiven && daysBetween(c.triggerMet, c.triggerMet) != null;
    const daysSinceTrigger = triggerOk && asOfOk ? daysBetween(c.triggerMet, asOf) : null;
    /* A TRIGGER DATED AFTER THE SHEET IS A TYPO, AND IT IS NAMED RATHER THAN
       PRINTED. The field records the day a condition WAS satisfied, so a future
       date is not a condition that will be met later — it is a year keyed
       wrong, and left alone it puts a negative into a days column, which is a
       plausible-looking number and the wrong one. */
    const triggerAhead = daysSinceTrigger != null && daysSinceTrigger < 0;
    const triggerNamed = !!(c.triggerName && String(c.triggerName).trim());

    /* THE FINDING, AS ONE FLAG. Past the condition, with money still held. A
       contract past its trigger that has been released in full is the case that
       worked, and it must not appear here — otherwise the list this tool sorts
       is a list of every finished job rather than a list of phone calls. */
    const pastTrigger = daysSinceTrigger != null && daysSinceTrigger > 0
      && heldNow != null && heldNow > 0;

    const complete = Number(c.percentComplete);
    const completeSet = c.percentComplete != null && c.percentComplete !== '' && Number.isFinite(complete);

    return {
      ...c,
      contractValue, billed, retained, released,
      pct, pctSet, shouldBeRetained, heldNow, overHeld, overReleased,
      triggerGiven, triggerOk, triggerNamed, triggerAhead,
      daysSinceTrigger, pastTrigger,
      complete: completeSet ? complete : null,
      completeSet,
      overComplete: completeSet && complete > 100,
      overBilled: contractValue > 0 && billed > contractValue,
      /* FINISHED WITH NO CONDITION RECORDED. The job is done and the paperwork
         does not say what would release the money — which is a different
         sentence from "the condition has not been met", and the difference is
         the one a trade can act on. */
      doneNoTrigger: completeSet && complete >= 100 && !triggerGiven,
      running: !triggerGiven,
    };
  });

  /* SORTED BY DAYS PAST THE TRIGGER, FURTHEST FIRST, with anything that has no
     trigger date at the end rather than at either extreme. claim-aging.js does
     this for payers and the reasoning carries over exactly: a row that cannot
     be aged must not sort as though it were the most urgent or the least. */
  const sorted = [...rows].sort((a, b) => {
    if (a.daysSinceTrigger == null && b.daysSinceTrigger == null) return 0;
    if (a.daysSinceTrigger == null) return 1;
    if (b.daysSinceTrigger == null) return -1;
    return b.daysSinceTrigger - a.daysSinceTrigger;
  });

  /* TWO DENOMINATORS, NOT ONE, because the two halves of this page need
     different things to be true. What is HELD is two numbers a person typed and
     needs no rate at all; what is OVER-HELD is a comparison against the
     contract and cannot be made without one. Footing both over a single
     "counted" would have taken a contract with no rate out of the headline
     figure, which is the one number here that does not depend on a rate. */
  const held = rows.filter((r) => r.heldNow != null);
  const rated = rows.filter((r) => r.pctSet);
  const overdue = rows.filter((r) => r.pastTrigger);
  const sum = (list, f) => list.reduce((a, r) => a + f(r), 0);

  const totals = {
    contracts: rows.length,
    counted: held.length,
    rated: rated.length,
    billed: sum(rows, (r) => r.billed),
    retained: sum(held, (r) => r.retained),
    released: sum(held, (r) => r.released),
    heldNow: sum(held, (r) => r.heldNow),
    shouldBeRetained: sum(rated, (r) => r.shouldBeRetained),
    overHeld: sum(rated, (r) => Math.max(0, r.overHeld)),
    pastTrigger: overdue.length,
    heldPastTrigger: sum(overdue, (r) => r.heldNow),
    /* THE LONGEST WAIT ON THE SHEET, which is the sentence a trade repeats down
       the phone. NULL rather than zero when nothing is past its trigger — zero
       days would read as "one of these came due today". */
    longestPastTrigger: overdue.length
      ? Math.max(...overdue.map((r) => r.daysSinceTrigger)) : null,
    running: rows.filter((r) => r.running).length,
  };

  const problems = [];
  const money = (c) => usd(Math.abs(c) / 100, { cents: true });
  const days = (n) => `${n} ${n === 1 ? 'day' : 'days'}`;
  const name = (r) => r.ref || r.customer || 'A contract';

  if (!asOfOk) {
    problems.push(`The date this sheet is aged to reads "${asOf == null || asOf === '' ? '' : asOf}", which is not a date this can use. It wants YYYY-MM-DD, and until it has one nothing can be counted as past its release condition.`);
  }
  for (const r of sorted) {
    if (r.triggerGiven && !r.triggerOk) {
      problems.push(`The release date on ${name(r)} reads "${r.triggerMet}", which is not a date this can use. It wants YYYY-MM-DD, and that contract is aged against nothing until it has one.`);
    }
    if (r.triggerAhead) {
      problems.push(`${name(r)} has its release condition dated ${r.triggerMet}, which is after ${asOf}. That box records the day a condition was satisfied, so a date still to come is a year or a month keyed wrong rather than something waiting to happen, and it is aged against nothing.`);
    }
    if (r.triggerGiven && r.triggerOk && !r.triggerNamed) {
      problems.push(`${name(r)} has a release date of ${r.triggerMet} and nothing saying what was satisfied on it. A condition nobody can name is a condition nobody can invoke, and it is what the general contractor will ask for first.`);
    }
    if (!r.pctSet) {
      problems.push(`${name(r)} has no retainage percentage entered — an empty box rather than a contract that holds nothing back. Its should-be figure reads ${money(0)} because nothing was keyed, not because nothing is being held, so it is left out of the over-held comparison.`);
    }
    if (r.overReleased) {
      problems.push(`${name(r)} shows ${money(r.released)} released against ${money(r.retained)} ever held, which is more money back than was ever withheld. Nothing on that contract is in the held figure — netting a negative into it would quietly shrink the one number on this page worth acting on.`);
    }
    if (r.overHeld != null && r.overHeld > 0) {
      problems.push(`${name(r)} has ${money(r.retained)} withheld where the contract's ${(r.pct / 100).toFixed(2)}% on ${money(r.billed)} billed comes to ${money(r.shouldBeRetained)} — ${money(r.overHeld)} more than the contract allows. This page does not say who is right; it says the two figures disagree and by how much.`);
    }
    if (r.pastTrigger) {
      problems.push(`${name(r)} met ${r.triggerNamed ? String(r.triggerName).trim() : 'its release condition'} on ${r.triggerMet}, ${days(r.daysSinceTrigger)} ago, and ${money(r.heldNow)} of it is still held.`);
    }
    if (r.overComplete) {
      problems.push(`${name(r)} is down as ${r.complete}% complete, and there is no more of a job than all of it. That is usually a figure typed into the wrong column.`);
    }
    if (r.overBilled) {
      problems.push(`${name(r)} has ${money(r.billed)} billed against a contract of ${money(r.contractValue)}, so more has been applied for than the contract is worth. Approved change orders do that and so does a decimal point, and this cannot tell the two apart.`);
    }
    if (r.doneNoTrigger) {
      problems.push(`${name(r)} is complete and has no release date recorded — which says the condition has not been written down here, not that it has not been met. Until it has one there is nothing to age it against.`);
    }
  }
  for (const ref of [...new Set(rows.map((r) => r.ref).filter(Boolean))]) {
    if (rows.filter((r) => r.ref === ref).length > 1) {
      problems.push(`There is more than one contract numbered ${ref}, so two pay applications here are the same reference as far as anybody filing them can tell.`);
    }
  }
  if (rows.length === 0) {
    problems.push('There are no contracts on this sheet, so there is nothing to work out.');
  }

  return { rows: sorted, totals, problems };
}
