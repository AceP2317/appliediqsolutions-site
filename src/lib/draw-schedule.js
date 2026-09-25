/* ============================================================================
   DRAW SCHEDULE — the stages a financed job draws against, checked against the
   work that has actually been done.

   ── WHY THIS BELONGS TO THE OWNER OF THE BUSINESS AND NOT TO A PLATFORM ─────

   A draw schedule is a list of stages with a share of the contract against each
   one, and it was negotiated for this job with this lender. There is no
   industry schedule to default to: a builder who does his own framing splits
   the money differently from one who subs it, a lender that inspects at four
   points writes four stages and one that inspects at eight writes eight, and
   the percentages come out of whatever argument the two of them had at closing.

   That is why no platform holds this. Job-costing software knows what was
   spent, accounting software knows what came in, and neither of them has ever
   seen the schedule — it is a page stapled to the contract.

   ── THE FIRST FINDING, AND IT IS WHY THIS EXISTS ────────────────────────────

   A STAGE IS FINISHED AND NOBODY DREW AGAINST IT.

   On a financed job the draw is REQUESTED, not paid. Nothing arrives because a
   stage was completed; it arrives because somebody filled in a form and sent
   it. So a stage that was finished, signed off and never drawn is money already
   earned, sitting in the loan, waiting on a piece of paper nobody wrote.

   And it is invisible on every report, for a reason worth stating plainly: the
   missing line IS the problem. A ledger shows what was drawn. A job cost shows
   what was spent. Neither of them has a row for a draw that was never
   requested, because a row is created by requesting one.

   Sorted by days since the stage was finished, furthest first — the same shape
   retainage.js uses for its release trigger and claim-aging.js for its payers,
   for the same reason: the top of the list is where the conversation starts.

   ── THE SECOND FINDING: THE SCHEDULE DOES NOT ADD UP TO THE CONTRACT ────────

   A schedule typed as percentages that foot to 97, or as amounts that miss the
   contract value, is wrong on no single line. Every stage reads plausibly and
   the error only exists in the column total, which is exactly the kind of error
   that survives being checked — because checking a schedule means reading down
   it, and reading down it is what cannot see this.

   The gap is named in dollars and the direction is said out loud, because short
   and over are different problems: short means part of the contract has no
   stage to draw it against, and over means the stages between them promise more
   than the job pays.

   ⚠ THIS COMPARES WHAT THE SCHEDULE ALREADY SAYS AGAINST THE WORK ALREADY DONE
   AND DOES NOTHING ELSE. It does not suggest a draw schedule, propose stage
   percentages, say when to submit a draw, take a view on whether a draw is
   contractually due, compare anything to a published industry schedule, or
   compute financing cost or interest. Every one of those would be a lender's
   decision or a market guess dressed up as arithmetic.

   ── WHAT WAS REUSED, AND WHY EACH ONE FITS ──────────────────────────────────

   `daysBetween` IS recall.js's AND NOT A SECOND COPY. It was read before this
   was written, the way unit-turn.js and retainage.js both read it, and it fits
   for reasons specific to a completed stage rather than "it does dates":

     IT RETURNS NULL FOR A DATE IT CANNOT READ, never NaN and never zero. A
     finish date this cannot parse must not age to nothing, because zero days is
     a real and flattering answer — it says the stage was finished today, which
     would sort a five-month-old undrawn stage to the bottom of the one list
     this tool exists to put things at the top of.

     IT IS WHOLE DAYS BETWEEN TWO PLAIN ISO DAYS. A stage is finished on a date
     and signed off on a date; nothing here counts in anything finer.

     IT TAKES NO VIEW ON DIRECTION, so a finish date typed in the future comes
     back negative and can be NAMED rather than printed into a days column.

   That is every tool on this shelf that counts whole days, on one function,
   with no copy of it anywhere. No count is written here — this line held one and
   it went stale the next time a tool joined, which is what happened in every
   engine that copied this paragraph.

   `money` IS format.js's. Two engines on this shelf once hand-rolled a dollar
   sign onto toFixed(2) and printed `$1554.96` in a problems panel two inches
   under a column reading `$1,554.96`. See LEDGER L-379; `npm run gate` refuses
   a third.

   ── THE UNITS, AND ONE FIELD DELIBERATELY RENAMED ───────────────────────────

   Money is integer cents. Both percentages are integer HUNDREDTHS of a per
   cent, so twenty per cent is 2000 and a hundred per cent is 10000.

   `percentCompleteHundredths` CARRIES THE SUFFIX, and the reason is a hazard
   rather than a style. retainage.js has a field called `percentComplete` and it
   is a WHOLE PER CENT — its header says so, and says the missing suffix is the
   warning. These are the two construction tools on the shelf and they sit in
   the same group, so a row copied from one to the other is the ordinary case
   rather than the rare one. Two fields with the same name and a hundredfold
   difference in unit is the one shape no gate here could catch, because both
   values are plausible integers. The suffix is the house convention retainage
   wrote down, and this field is in hundredths, so it takes the suffix.
   ============================================================================ */

import { daysBetween } from './recall.js';
import { money as usd } from './format.js';

/**
 * @param {object} input
 * @param {string} input.asOf   ISO day the stages are aged to
 * @param {number} input.contractValueCents
 * @param {Array}  input.stages
 *   [{id, ref, stagePctHundredths, stageAmountCents, percentCompleteHundredths,
 *     drawnCents, completedOn, inspectionName}]
 *   stagePctHundredths        NULL means the line is not written as a share of
 *                             the contract. 0 means it is, and the share is
 *                             nothing — a different claim, spelled differently.
 *   stageAmountCents          NULL means the line is not written as an amount.
 *   percentCompleteHundredths NULL means nobody has recorded how far along it
 *                             is. 0 means it has not been started.
 *   completedOn               NULL while the stage is still running, which on a
 *                             live job is not an error.
 *   inspectionName            what signs the stage off, in the builder's own
 *                             words. Empty where the schedule names none.
 */
export function computeDrawSchedule(input) {
  const asOf = input.asOf;
  /* THE HOUSE DATE IS CHECKED THROUGH THE INSTRUMENT THAT WILL BE USED ON IT.
     daysBetween(asOf, asOf) is null exactly when asOf is unreadable, so this
     asks the question with the same parser rather than with a second one that
     could disagree. Same shape as retainage.js and unit-turn.js. */
  const asOfOk = !!asOf && daysBetween(asOf, asOf) != null;
  const src = Array.isArray(input.stages) ? input.stages : [];
  const contractValue = Math.max(0, Math.round(Number(input.contractValueCents) || 0));

  const set = (v) => v != null && v !== '' && Number.isFinite(Number(v));

  const rows = src.map((s) => {
    const drawn = Math.max(0, Math.round(Number(s.drawnCents) || 0));

    /* NOT SET AND ZERO ARE DIFFERENT STATES ON ALL THREE OF THESE, and each one
       is spelled differently below. A schedule line with no share written
       against it is not a line worth nothing, a line with no amount is not a
       line for nothing, and a stage with no progress recorded is not a stage
       nobody has started. Every one of those pairs would otherwise collapse
       into a confident $0.00 beside a column of real money. */
    const pctSet = set(s.stagePctHundredths);
    const pct = pctSet ? Math.round(Number(s.stagePctHundredths)) : null;
    const amountSet = set(s.stageAmountCents);
    const amount = amountSet ? Math.round(Number(s.stageAmountCents)) : null;

    /* THE AMOUNT WINS WHERE BOTH ARE WRITTEN, and the disagreement is named
       rather than absorbed. A figure somebody typed against this line is more
       specific than a share of a total that may itself have moved since — a
       change order raises the contract value and nobody goes back and re-derives
       six stage amounts from it. */
    const fromPct = pctSet ? Math.round((contractValue * pct) / 10000) : null;
    const stageValue = amountSet ? amount : fromPct;
    const valueSet = stageValue != null;
    const bothWritten = pctSet && amountSet;
    const bothDisagree = bothWritten && fromPct !== amount;

    const completeSet = set(s.percentCompleteHundredths);
    const complete = completeSet ? Math.round(Number(s.percentCompleteHundredths)) : null;

    const earned = valueSet && completeSet
      ? Math.round((stageValue * complete) / 10000) : null;
    /* AHEAD IS SIGNED AND IS NOT CLAMPED. Positive is money drawn ahead of the
       work, negative is work done and not yet drawn, and folding the two into
       one absolute figure would print a job as balanced when it is running
       ahead on one stage and behind on another by the same amount. */
    const ahead = earned == null ? null : drawn - earned;
    const notDrawn = ahead == null ? null : Math.max(0, -ahead);
    const drawnAhead = ahead == null ? null : Math.max(0, ahead);

    /* THE DATE IS ASKED FOR TWICE — is it there, and can it be read — because a
       stage still running and a stage whose date was typed "04/02/2026" are
       different states and the sentences below have to say which. */
    const finishGiven = !!s.completedOn;
    const finishOk = finishGiven && daysBetween(s.completedOn, s.completedOn) != null;
    const daysSinceComplete = finishOk && asOfOk ? daysBetween(s.completedOn, asOf) : null;
    /* A FINISH DATE AFTER THE SHEET IS A TYPO AND IS NAMED RATHER THAN PRINTED.
       The box records the day a stage WAS finished, so a date still to come is a
       year keyed wrong rather than something waiting to happen — and left alone
       it puts a negative into a days column, which is a plausible-looking number
       and the wrong one. */
    const finishAhead = daysSinceComplete != null && daysSinceComplete < 0;
    const inspectionNamed = !!(s.inspectionName && String(s.inspectionName).trim());

    /* THE FINDING, AS ONE FLAG. Finished, and under-drawn. A finished stage that
       was drawn in full is the case that WORKED and must not appear here —
       otherwise the list this tool sorts is a list of every finished stage
       rather than a list of draws nobody has requested. */
    const finishedNotDrawn = daysSinceComplete != null && daysSinceComplete > 0
      && notDrawn != null && notDrawn > 0;

    return {
      ...s,
      drawn, pct, pctSet, amount, amountSet, fromPct,
      stageValue, valueSet, bothWritten, bothDisagree,
      complete, completeSet, earned, ahead, notDrawn, drawnAhead,
      finishGiven, finishOk, finishAhead, inspectionNamed,
      daysSinceComplete, finishedNotDrawn,
      overComplete: completeSet && complete > 10000,
      /* DRAWN AT NOTHING DONE. A real dispute on a real job, and this page makes
         it visible without taking a side — a deposit against a stage not started
         happens, and whether it should have is between the builder and whoever
         signed the draw. */
      drawnAtZero: completeSet && complete === 0 && drawn > 0,
      overDrawn: valueSet && drawn > stageValue,
      /* COMPLETE, WITH A CONDITION NAMED AND NO DATE. The sign-off is written
         down and the day it happened is not, which is a different sentence from
         "still running" and the difference is the one a builder can act on. */
      doneNoDate: completeSet && complete >= 10000 && inspectionNamed && !finishGiven,
      open: !finishGiven,
    };
  });

  /* SORTED BY DAYS SINCE THE STAGE WAS FINISHED, FURTHEST FIRST, with anything
     that has no finish date at the end rather than at either extreme. A row that
     cannot be aged must not sort as though it were the most urgent or the least;
     claim-aging.js and retainage.js both do this and the reasoning carries. */
  const sorted = [...rows].sort((a, b) => {
    if (a.daysSinceComplete == null && b.daysSinceComplete == null) return 0;
    if (a.daysSinceComplete == null) return 1;
    if (b.daysSinceComplete == null) return -1;
    return b.daysSinceComplete - a.daysSinceComplete;
  });

  /* TWO DENOMINATORS, NOT ONE, because the two halves of this page need
     different things to be true. What the SCHEDULE is worth needs a share or an
     amount against each line and nothing else. What has been EARNED needs that
     and a percent complete as well. Footing both over one count would drop a
     line with no progress recorded out of the schedule total, which is the one
     figure on this page that does not depend on anybody having recorded any. */
  const valued = rows.filter((r) => r.valueSet);
  const counted = rows.filter((r) => r.earned != null);
  const flagged = rows.filter((r) => r.finishedNotDrawn);
  const sum = (list, f) => list.reduce((a, r) => a + f(r), 0);

  const withPct = rows.filter((r) => r.pctSet);
  const withAmount = rows.filter((r) => r.amountSet);
  /* HOW THE SCHEDULE IS WRITTEN, decided once and used by both the sentence and
     the page. The amount arm is tested FIRST so a sheet carrying both on every
     line is read as an amount schedule — which is what it is, because that is
     the figure every stage value above was taken from.

     AND THE PERCENTAGE ARM REQUIRES THAT NO LINE CARRIES AN AMOUNT AT ALL. One
     amount override on an otherwise percentage sheet used to leave this reading
     'percentages', so the sentence below would add up the column as typed and
     then quote a dollar gap taken from a total that override had already moved —
     two true figures in one sentence that do not describe each other. A sheet
     with one override is a mixed sheet, and it is named as one. */
  const writtenAs = rows.length === 0 ? 'nothing'
    : withAmount.length === rows.length ? 'amounts'
      : (withPct.length === rows.length && withAmount.length === 0) ? 'percentages'
        : 'both';

  const scheduleSum = sum(valued, (r) => r.stageValue);
  const pctSumHundredths = sum(withPct, (r) => r.pct);

  const totals = {
    stages: rows.length,
    valued: valued.length,
    counted: counted.length,
    contractValue,
    writtenAs,
    scheduleSum,
    /* POSITIVE MEANS THE SCHEDULE IS SHORT OF THE CONTRACT — part of the job has
       no stage to draw it against. Negative means the stages promise more than
       the contract pays. The sign is the direction and the page says it in
       words rather than leaving a reader to work it out from a minus. */
    scheduleGap: contractValue - scheduleSum,
    /* WHAT THE STAGES FOOT TO, AS A SHARE OF THE CONTRACT, and it is computed
       here rather than on the page. It works whichever way the schedule is
       written — an amount schedule has no percentage column to add up — and a
       ratio derived in an island is arithmetic no Node gate can check. NULL
       rather than zero on a contract of nothing, because a share of nothing is
       not a share of none. */
    scheduleShareHundredths: contractValue > 0
      ? Math.round((scheduleSum * 10000) / contractValue) : null,
    pctSumHundredths,
    pctGapHundredths: withPct.length ? 10000 - pctSumHundredths : null,
    earned: sum(counted, (r) => r.earned),
    drawn: sum(rows, (r) => r.drawn),
    ahead: sum(counted, (r) => r.ahead),
    notDrawn: sum(counted, (r) => r.notDrawn),
    drawnAhead: sum(counted, (r) => r.drawnAhead),
    finished: rows.filter((r) => r.daysSinceComplete != null && r.daysSinceComplete >= 0).length,
    finishedNotDrawn: flagged.length,
    finishedNotDrawnCents: sum(flagged, (r) => r.notDrawn),
    /* THE LONGEST A FINISHED STAGE HAS GONE UNDRAWN, which is the sentence a
       builder repeats down the phone. It is taken over the FLAGGED stages and
       not over every finished one — a stage finished six months ago and drawn in
       full would otherwise set this figure while being the case that worked.
       NULL rather than zero when nothing is flagged, because zero days would
       read as "one of these came due today". */
    longestNotDrawn: flagged.length
      ? Math.max(...flagged.map((r) => r.daysSinceComplete)) : null,
    open: rows.filter((r) => r.open).length,
  };

  const problems = [];
  const money = (c) => usd(Math.abs(c) / 100, { cents: true });
  const pc = (h) => `${(h / 100).toFixed(2)}%`;
  const days = (n) => `${n} ${n === 1 ? 'day' : 'days'}`;
  const name = (r) => r.ref || 'A stage';

  if (!asOfOk) {
    problems.push(`The date this sheet is counted to reads "${asOf == null || asOf === '' ? '' : asOf}", which is not a date this can use. It wants YYYY-MM-DD, and until it has one no stage can be aged since it was finished.`);
  }

  /* THE SECOND FINDING, AT THE TOP, because it is about the sheet rather than
     about a line and a reader who acts on a stage figure before reading it is
     acting on a schedule that does not describe the contract.

     THE PERCENTAGE GAP AND THE DOLLAR GAP ARE COMPUTED SEPARATELY AND BOTH ARE
     PRINTED. The dollar figure is the contract less the sum of the ROUNDED stage
     values, which is what actually has no stage against it; the percentage
     figure is the column total off the schedule as typed. On an awkward contract
     value the two can differ by a cent or two, and the honest answer is to print
     each one as what it is rather than to derive one from the other. */
  if (contractValue <= 0 && withPct.length > 0) {
    problems.push('This schedule has stages written as a share of the contract and no contract value to take a share of, so every one of those stages is worth nothing here. That is a missing figure at the top of the sheet rather than a job with no money in it.');
  } else if (writtenAs === 'percentages' && pctSumHundredths !== 10000) {
    problems.push(pctSumHundredths < 10000
      ? `The ${rows.length} stages on this schedule add up to ${pc(pctSumHundredths)} of the contract rather than 100%, which leaves ${money(totals.scheduleGap)} of ${money(contractValue)} with no stage to draw it against. A schedule like this is wrong on no single line — it only shows when the column is added up.`
      : `The ${rows.length} stages on this schedule add up to ${pc(pctSumHundredths)} of the contract rather than 100%, so between them they promise ${money(totals.scheduleGap)} more than the ${money(contractValue)} the job pays. A schedule like this is wrong on no single line — it only shows when the column is added up.`);
  } else if (writtenAs === 'amounts' && scheduleSum !== contractValue) {
    problems.push(scheduleSum < contractValue
      ? `The ${rows.length} stage amounts on this schedule add up to ${money(scheduleSum)} against a contract of ${money(contractValue)}, which is ${money(totals.scheduleGap)} short. Nothing is wrong on any one line; the gap exists only in the total.`
      : `The ${rows.length} stage amounts on this schedule add up to ${money(scheduleSum)} against a contract of ${money(contractValue)}, which is ${money(totals.scheduleGap)} more than the job pays. Nothing is wrong on any one line; the gap exists only in the total.`);
  } else if (writtenAs === 'both' && scheduleSum !== contractValue) {
    /* THE WORDING COVERS BOTH MIXES. A sheet is 'both' when its lines are not
       all written the same way, and that happens two ways: some as shares and
       some as amounts, or some carrying no figure at all. Naming only the first
       would print a sentence about amounts on a sheet that has none. */
    problems.push(`This schedule does not write every stage the same way, and the ${totals.valued} stages carrying a figure at all foot to ${money(scheduleSum)} against a contract of ${money(contractValue)} — ${money(totals.scheduleGap)} ${scheduleSum < contractValue ? 'short' : 'more than the job pays'}. A mixed schedule hides this best, because neither column can be read down on its own.`);
  }

  for (const r of sorted) {
    if (r.finishGiven && !r.finishOk) {
      problems.push(`The finish date on ${name(r)} reads "${r.completedOn}", which is not a date this can use. It wants YYYY-MM-DD, and that stage is aged against nothing until it has one.`);
    }
    if (r.finishAhead) {
      problems.push(`${name(r)} is dated finished on ${r.completedOn}, which is after ${asOf}. That box records the day a stage was finished, so a date still to come is a year or a month keyed wrong rather than work waiting to happen, and it is aged against nothing.`);
    }
    if (!r.valueSet) {
      problems.push(`${name(r)} carries neither a share of the contract nor an amount, so there is nothing to say what it is worth and nothing it can have earned. It is out of the schedule total and out of the money.`);
    }
    if (r.bothDisagree) {
      problems.push(`${name(r)} is written both ways and the two do not agree: ${pc(r.pct)} of ${money(contractValue)} comes to ${money(r.fromPct)}, and the amount on the line reads ${money(r.amount)}. This sheet uses ${money(r.amount)}, because a figure typed against the line is more specific than a share of a total that may have moved since the schedule was written.`);
    }
    if (!r.completeSet) {
      problems.push(`${name(r)} has no percent complete recorded — an empty box rather than a stage nobody has started. Nothing is counted as earned against it, which is a missing figure and not a zero.`);
    }
    if (r.overComplete) {
      problems.push(`${name(r)} is down as ${pc(r.complete)} complete, and there is no more of a stage than all of it. That is usually a figure typed into the wrong column.`);
    }
    if (r.overDrawn) {
      problems.push(`${name(r)} has ${money(r.drawn)} drawn against it and the schedule writes it at ${money(r.stageValue)}, so more has come out of that stage than the stage is worth. Either a draw went against the wrong line or the schedule figure is not what the contract says, and this cannot tell the two apart.`);
    }
    if (r.finishedNotDrawn) {
      problems.push(`${name(r)} was finished on ${r.completedOn}, ${days(r.daysSinceComplete)} ago${r.inspectionNamed ? ` with ${String(r.inspectionName).trim()} against it` : ''}, and ${money(r.notDrawn)} of what it earned has never been drawn.`);
    }
    if (r.drawnAtZero) {
      problems.push(`${money(r.drawn)} has been drawn against ${name(r)}, which is down as nothing done. That happens on real jobs and this page takes no view on whether it should have — it is printed because it is the one thing on this sheet nobody finds by reading down a column of totals.`);
    }
    if (r.doneNoDate) {
      problems.push(`${name(r)} is down as complete and names ${String(r.inspectionName).trim()} as what signs it off, and carries no date. The condition is recorded and the day it was met is not, so that stage is aged against nothing.`);
    }
  }

  for (const ref of [...new Set(rows.map((r) => r.ref).filter(Boolean))]) {
    if (rows.filter((r) => r.ref === ref).length > 1) {
      problems.push(`There is more than one stage called ${ref}, so two lines on this schedule are the same stage as far as anybody reading the draw request can tell.`);
    }
  }
  if (rows.length === 0) {
    problems.push('There are no stages on this schedule, so there is nothing to work out.');
  }

  return { rows: sorted, totals, problems };
}
