/* ============================================================================
   UNIT TURN AND VACANCY COST — what a turn between tenants actually cost,
   which is not what the contractor invoiced.

   ── WHY THIS BELONGS TO THE OWNER OF THE BUSINESS AND NOT TO A PLATFORM ─────

   Property software records the invoice and the lease dates perfectly well.
   What it does not do is put them in the same sentence, because they arrive
   from two different places — the invoice comes from accounts payable and the
   dates come from the tenancy — and nothing in between has an opinion about
   what the two of them add up to.

   So the number every landlord quotes for a turn is the invoice, and the
   invoice is usually the smaller half.

   ── THE FIRST FINDING: THE INVOICE IS THE SMALLER HALF ──────────────────────

   A unit standing empty is costing rent every day of it, and that rent is not
   billed by anybody, does not appear on a statement and is never reconciled
   against anything. It is money that did not arrive, so there is no line
   anywhere to look at. Nobody is hiding it; it simply has no document.

   Make-ready and lost rent are printed side by side here, and the sum of them
   is what the turn cost. On an ordinary turn the second figure is the larger,
   which reads as a surprise the first time somebody sees it.

   ── THE SECOND FINDING, AND IT IS THE REASON THIS TOOL EXISTS ───────────────

   ONE HALF OF A VACANCY IS YOURS TO FIX AND THE OTHER IS NOT, AND A SINGLE
   "DAYS VACANT" FIGURE HIDES WHICH IS WHICH.

     DAYS TO READY is the work. Scheduling, materials, whoever you called and
     how long they took to come. A turn taken a week faster is money, and it is
     money nobody has to be persuaded of.

     DAYS ON MARKET is price and demand. A unit sitting ready and unlet is not
     a make-ready problem, and no amount of chasing a contractor moves it.

   They are the same currency and they are not the same question. Split the
   lost rent between them and the answer stops being "we were empty 39 days"
   and becomes two numbers with two different answers behind them.

   ⚠ THIS SPLITS A NUMBER THE LANDLORD ALREADY OWNS AND DOES NOTHING ELSE. It
   does not suggest a rent, say how long a turn ought to take, take a view on
   whether a unit is priced wrong, compare anything to a published vacancy
   figure, or forecast when a unit will let. Every one of those would be a guess
   about a market dressed up as arithmetic.

   ── WHY THE DATE ARITHMETIC IS recall.js's AND NOT ITS OWN ──────────────────

   `daysBetween` was read before this was written and it FITS, which is the
   opposite of what happened when rent-roll.js read rate-card.js. The reasons
   are specific rather than "it does dates":

     IT RETURNS NULL FOR A DATE IT CANNOT READ, never NaN. That is the exact
     behavior this tool needs and it is the whole reason a shared function is
     safe here: NaN compares false against everything, so an unreadable
     move-out would have sorted quietly into "nothing to see" — and a zero
     would have printed a same-day turn, which is a plausible number and the
     wrong one.

     IT IS WHOLE DAYS BETWEEN TWO PLAIN ISO DAYS, which is the only unit this
     tool counts in. Nothing here needs a time, a zone or a duration.

     IT TAKES NO VIEW ON WHICH DIRECTION IS VALID. It goes negative the other
     way, and a negative is a refusal shape below rather than an error, so the
     shared function does not have to know anything about turns.

   property-round.js and claim-aging.js reached the same conclusion, and so has
   every tool on this shelf that counts whole days: one function, no copy of it
   anywhere. No count is written here, because the one that was went stale.

   `asOf` IS AN INPUT AND NOT THE CLOCK, for the same reason recall.js injects
   `today`: a unit that is still empty has an age, and an age read off the
   system clock changes every night. A gate could then only ever assert that it
   changed, which is the check nobody writes.

   Money is integer cents and days are whole integers, so a hundred turns do not
   drift.
   ============================================================================ */

import { daysBetween } from './recall.js';
/* AND THE MONEY FORMATTER IS THE SHARED ONE, WHICH IS A REPAIR AS WELL AS A
   REUSE. Two engines here hand-rolled a dollar sign concatenated onto
   toFixed(2) for their problems text, so a Problems panel printed `$1554.96`
   two inches under a table column reading `$1,554.96` — one page, one figure,
   two formats, and it reads as carelessness rather than as a bug.
   src/lib/format.js has held the correct formatter since before any of them and
   was imported by none. The other two were moved onto it the day this was
   written, and `npm run gate` now refuses a third; see LEDGER L-379. */
import { money as usd } from './format.js';

/* A DAY'S RENT IS THE MONTHLY RENT TIMES TWELVE OVER 365, and the convention is
   stated on the page rather than assumed here. It is the only way to price a
   day that does not make February's days worth more than July's — dividing a
   month by its own length would value the same unit differently depending on
   which month it happened to stand empty in, and a turn straddling two months
   would then have no single answer at all. */
export const dailyRentOf = (monthlyCents) =>
  monthlyCents == null ? null : Math.round((monthlyCents * 12) / 365);

/**
 * @param {object} input
 * @param {string} input.asOf   ISO day the still-empty units are counted to
 * @param {Array}  input.turns
 *   [{id, ref, unitName, monthlyRentCents, movedOut, readyOn, reLetOn, work}]
 *   monthlyRentCents  NULL means nobody entered one, which is a different state
 *                     from 0 and is treated as one — a caretaker's flat let
 *                     rent-free loses no rent, and an empty box loses an
 *                     unknown amount.
 *   reLetOn           NULL means it is still empty. Not an error.
 *   work              [{id, note, cents}] — the make-ready line items
 */
export function computeUnitTurn(input) {
  const asOf = input.asOf;
  /* THE HOUSE DATE IS CHECKED FIRST AND CHECKED THROUGH THE SAME FUNCTION.
     daysBetween(asOf, asOf) is null exactly when asOf is unreadable, so this
     asks the question with the instrument that will be used on it rather than
     with a second parser that could disagree. Same shape as claim-aging.js. */
  const asOfOk = !!asOf && daysBetween(asOf, asOf) != null;
  const src = Array.isArray(input.turns) ? input.turns : [];

  const turns = src.map((t) => {
    const work = Array.isArray(t.work) ? t.work : [];
    const makeReady = work.reduce((a, w) => a + Math.max(0, Math.round(w.cents || 0)), 0);

    /* NOT SET AND ZERO ARE DIFFERENT STATES AND THEY ARE SPELLED DIFFERENTLY.
       An empty rent box cannot price a day at all; a rent of zero prices it at
       nothing, which is a real arrangement and a correct answer. Reading both
       as zero would put a confident $0.00 of lost rent on a unit nobody has
       entered a rent for — the flattering answer, and the wrong one. */
    const rawRent = t.monthlyRentCents;
    const rentSet = rawRent != null && rawRent !== '' && Number.isFinite(Number(rawRent));
    const monthlyRent = rentSet ? Math.max(0, Math.round(Number(rawRent))) : null;
    const dailyRent = dailyRentOf(monthlyRent);

    /* EACH DATE IS ASKED FOR TWICE — is it there, and can it be read — because
       a box nobody filled in and a box holding "07/11/26" are different
       mistakes and the sentences below have to say which. */
    const movedOutGiven = !!t.movedOut;
    const readyOnGiven = !!t.readyOn;
    const reLetOnGiven = !!t.reLetOn;
    const movedOutOk = movedOutGiven && daysBetween(t.movedOut, t.movedOut) != null;
    const readyOnOk = readyOnGiven && daysBetween(t.readyOn, t.readyOn) != null;
    const reLetOnOk = reLetOnGiven && daysBetween(t.reLetOn, t.reLetOn) != null;

    const rawToReady = movedOutOk && readyOnOk ? daysBetween(t.movedOut, t.readyOn) : null;
    /* A NEGATIVE TURN IS NOT WORKABLE AND IS NOT CLAMPED. Clamping it to zero
       would print a same-day turn — a believable figure standing in for two
       dates that contradict each other, which is the exact shape this whole
       shelf refuses. */
    const readyBeforeOut = rawToReady != null && rawToReady < 0;
    const daysToReady = readyBeforeOut ? null : rawToReady;

    /* STILL EMPTY IS COUNTED TO asOf AND IS NOT AN ERROR. The figure is real
       and it is still growing, which is a different claim from a finished one
       and is carried through to the totals so the page can say so. */
    const stillEmpty = readyOnOk && !reLetOnGiven;
    const marketEnd = reLetOnOk ? t.reLetOn : (stillEmpty && asOfOk ? asOf : null);
    const rawOnMarket = readyOnOk && marketEnd ? daysBetween(t.readyOn, marketEnd) : null;
    /* RE-LET BEFORE READY HAPPENS. A tenant signs while the painter is still in
       the unit, and the lease starts before the punch list is closed. The market
       days are counted as ZERO rather than as a negative, because a negative
       would hand rent back that was genuinely lost — and it is named below so
       nobody reads the zero as a unit that let the day it was ready. */
    const reLetBeforeReady = rawOnMarket != null && rawOnMarket < 0;
    const daysOnMarket = rawOnMarket == null ? null : Math.max(0, rawOnMarket);

    const daysVacant = daysToReady == null || daysOnMarket == null
      ? null : daysToReady + daysOnMarket;

    /* WORKABLE IS ONE FLAG AND EVERY MONEY FIGURE HANGS OFF IT. A turn missing
       a date or a rent has no lost rent, and a null folded into a sum as zero
       would understate the whole sheet by exactly the thing that is missing. */
    const workable = daysVacant != null && rentSet;
    const lostRent = workable ? daysVacant * dailyRent : null;
    const lostToWork = workable ? daysToReady * dailyRent : null;
    const lostToMarket = workable ? daysOnMarket * dailyRent : null;
    const trueCost = workable ? makeReady + lostRent : null;

    return {
      ...t,
      work, makeReady, monthlyRent, rentSet, dailyRent,
      movedOutGiven, readyOnGiven, reLetOnGiven, movedOutOk, readyOnOk, reLetOnOk,
      daysToReady, daysOnMarket, daysVacant,
      lostRent, lostToWork, lostToMarket, trueCost,
      workable, stillEmpty, readyBeforeOut, reLetBeforeReady,
      noWork: work.length === 0,
      /* A DECIMAL POINT IN THE WRONG PLACE IS THE ORDINARY CAUSE and it is
         checkable without knowing anything about the trade: a make-ready that
         costs more than the unit earns in a year is either a rebuild that is
         not a turn, or a figure typed in the wrong units. */
      workOverYear: rentSet && monthlyRent > 0 && makeReady > monthlyRent * 12,
    };
  });

  const counted = turns.filter((t) => t.workable);
  const foot = (f) => counted.reduce((a, t) => a + f(t), 0);
  /* COUNTED OVER EVERY TURN AND NOT ONLY OVER THE FOOTED ONES, which is the
     difference between an honest running total and a false final one. A unit
     that is still empty AND cannot be worked out — an unreadable as-of date is
     the way that happens — contributes nothing to the money and still means the
     sheet is not finished. Footing this over `counted` made the page say "every
     turn here is closed, so this figure is final" on a sheet with a unit
     standing empty in front of it. */
  const stillEmpty = turns.filter((t) => t.stillEmpty);

  const totals = {
    turns: turns.length,
    counted: counted.length,
    makeReady: foot((t) => t.makeReady),
    lostRent: foot((t) => t.lostRent),
    lostToWork: foot((t) => t.lostToWork),
    lostToMarket: foot((t) => t.lostToMarket),
    trueCost: foot((t) => t.trueCost),
    daysToReady: foot((t) => t.daysToReady),
    daysOnMarket: foot((t) => t.daysOnMarket),
    daysVacant: foot((t) => t.daysVacant),
    stillEmpty: stillEmpty.length,
    /* THE ONE FLAG THAT STOPS A RUNNING TOTAL BEING READ AS A FINISHED ONE.
       Every figure above is still growing while a single unit is empty, and a
       page that prints them without saying so has stated something false with
       correct arithmetic. */
    growing: stillEmpty.length > 0,
  };

  const problems = [];
  const money = (c) => usd(Math.abs(c) / 100, { cents: true });
  const days = (n) => `${n} ${n === 1 ? 'day' : 'days'}`;
  const name = (t) => t.unitName || t.ref || 'A unit';

  if (!asOfOk) {
    problems.push(`The date this sheet is counted to reads "${asOf == null || asOf === '' ? '' : asOf}", which is not a date this can use. It wants YYYY-MM-DD, and until it has one no unit that is still empty can be counted at all.`);
  }
  for (const t of turns) {
    for (const [given, ok, label, value] of [
      [t.movedOutGiven, t.movedOutOk, 'moved out', t.movedOut],
      [t.readyOnGiven, t.readyOnOk, 'was ready', t.readyOn],
      [t.reLetOnGiven, t.reLetOnOk, 'was re-let', t.reLetOn],
    ]) {
      if (given && !ok) {
        problems.push(`The date ${name(t)} ${label} reads "${value}", which is not a date this can use. It wants YYYY-MM-DD, and nothing on that turn is worked out until it has one.`);
      }
    }
    if (!t.movedOutGiven) {
      problems.push(`${name(t)} has no move-out date, so there is nothing to count the turn from and none of it is in the totals.`);
    }
    if (!t.readyOnGiven) {
      problems.push(`${name(t)} has no ready date, so the work and the marketing cannot be told apart and none of that turn is in the totals.`);
    }
    if (t.readyBeforeOut) {
      problems.push(`${name(t)} is down as ready on ${t.readyOn}, which is before the tenant moved out on ${t.movedOut}. That turn is in none of the totals — counting it as a same-day turn would print a believable figure for two dates that contradict each other.`);
    }
    if (t.reLetBeforeReady) {
      problems.push(`${name(t)} was re-let on ${t.reLetOn}, before it was ready on ${t.readyOn} — which happens, when a tenant signs while the work is still going on. Its days on the market are counted as none rather than as a negative, so no rent is handed back that was genuinely lost.`);
    }
    if (!t.rentSet) {
      problems.push(`${name(t)} has no monthly rent entered — an empty box rather than a rent of nothing — so its lost rent is not worked out and that turn is in none of the totals. A rent of 0.00 is a different thing and would be priced at nothing quite happily.`);
    }
    if (t.noWork) {
      problems.push(`${name(t)} has no make-ready lines at all, so its make-ready reads ${money(0)} because nothing was entered rather than because nothing was spent.`);
    }
    if (t.workOverYear) {
      problems.push(`${name(t)} has ${money(t.makeReady)} of make-ready against ${money(t.monthlyRent)} a month, which is more than the unit earns in a year. That is usually a decimal point in the wrong place, or a rebuild rather than a turn.`);
    }
    if (t.stillEmpty && t.workable) {
      problems.push(`${name(t)} is still empty. It is counted to ${asOf} and stands at ${days(t.daysVacant)} and ${money(t.lostRent)} of lost rent so far — that figure is still growing, and so is every total on this sheet.`);
    }
  }
  for (const r of [...new Set(turns.map((t) => t.ref).filter(Boolean))]) {
    if (turns.filter((t) => t.ref === r).length > 1) {
      problems.push(`There is more than one turn numbered ${r}, so two punch lists here are the same reference as far as anybody filing them can tell.`);
    }
  }
  if (turns.length === 0) {
    problems.push('There are no turns on this sheet, so there is nothing to work out.');
  }

  return { turns, totals, problems };
}
