/* ============================================================================
   BOARDING AND GROOMING DAY RATE — what a stay comes to, once the peak nights
   and the add-ons are counted in.

   ── WHY THIS BELONGS TO THE OWNER OF THE KENNEL AND NOT TO A PLATFORM ───────

   Two rules govern the price of a stay here and both of them were invented by
   whoever runs the place.

   The first is which DAYS are peak. Not "holidays" — the specific nights this
   kennel charges more for, which is a list somebody wrote on the office wall
   and which is different at the place two towns over: one counts the four
   nights around Thanksgiving, the next counts the whole week of it, the next
   counts every Friday and Saturday from June to August. A booking platform can
   hold a calendar. It cannot hold the reason a Wednesday in November is worth
   more here than a Wednesday in February, because that reason is a judgment
   about this town and this building.

   The second is what a shared run is worth. Two dogs from one house in one run
   is less work and less space, and every kennel prices that differently or not
   at all.

   ── THE FIRST FINDING: THE PEAK NIGHTS CARRY THE MONEY AND THE CALENDAR HIDES
      THEM ──────────────────────────────────────────────────────────────────

   A stay across a holiday weekend prices completely differently from the same
   length of stay a week later, and a booking sheet showing only dates cannot
   show that. Six nights is six nights on a calendar. So every stay is split
   into the nights that fall on a declared peak date and the nights that do not,
   with the money each side carries, and both are totaled across the house —
   beside what the same nights would have come to at the base rate on every one
   of them. The difference between those two figures IS the peak rule, in
   dollars, and it is the one number no calendar and no booking form prints.

   A night is counted by the date it STARTS, because that is the night somebody
   is paying for. A stay checking out on a peak morning did not board on it.

   ── THE SECOND FINDING: THE ADD-ONS ARE A SECOND BUSINESS INSIDE THE FIRST ──

   Baths, nail trims, medication and extra walks are quoted per item, invoiced
   per item, and never totaled against board. So nobody knows what share of the
   week's take they are, which is the ordinary way a real line of work stays
   invisible inside the one it was bolted onto. The add-on total is printed
   beside the board total with the share it comes to, and that is arithmetic on
   bookings that already happened rather than a suggestion about pricing.

   ⚠ THIS APPLIES THE RATES AND THE DATES THE OWNER ALREADY SET, AND NOTHING
   ELSE. It does not suggest a nightly rate, name which days should be peak,
   propose a sibling discount, price an add-on, compare anything to a published
   kennel figure, or say whether the place is full. Every one of those is either
   a market guess or the owner's own judgment wearing arithmetic's clothes.

   ── WHAT WAS REUSED, AND WHY EACH ONE FITS ──────────────────────────────────

   `daysBetween` IS recall.js's AND NOT A SECOND COPY. It was read before this
   was written, and it fits for reasons specific to counting nights rather than
   "it does dates":

     A STAY IS CHECK-OUT MINUS CHECK-IN, which is exactly what this returns —
     whole days between two plain ISO days. A Friday-to-Sunday stay is two
     nights, not three, and that subtraction is the whole of the count.

     IT RETURNS NULL FOR A DATE IT CANNOT READ, never NaN and never zero. Nought
     nights is a real and different answer — it means somebody typed the same
     day twice and there is nothing to charge — so a date this cannot parse must
     not arrive wearing that answer's clothes.

     IT TAKES NO VIEW ON DIRECTION, so a check-out before a check-in comes back
     negative rather than clamped. That is how the reversed booking is caught,
     with the same parser rather than with a second one that could disagree.

   That is every tool on this shelf that counts whole days, on one function,
   with no copy of it anywhere. No count is written here — this line held one and
   it went stale the next time a tool joined, which is what happened in every
   engine that copied this paragraph.

   `money` IS format.js's. Two engines on this shelf once hand-rolled a dollar
   sign onto toFixed(2) and printed `$1554.96` in a problems panel two inches
   under a column reading `$1,554.96`. See LEDGER L-379; `npm run gate` refuses
   a third.

   WHAT WAS NOT REUSED, AND WHY. recall.js also exports `addMonths`, and nothing
   here wants it: a peak date is a plain day off a wall calendar and no quantity
   in this file is measured in months. Nor is there a day-by-day walk of a stay
   anywhere below, which would have wanted a helper neither module has. Peak
   nights are counted by testing each DECLARED DATE against the stay instead of
   by enumerating the stay's nights — the declared list is short and the owner
   wrote it, so the loop is bounded by their own rule. Walking the nights would
   make a mistyped year ("2026" to "3026") spin three hundred thousand times
   inside a render, which is a page that hangs rather than a page that reports a
   bad date.

   ── THE UNITS ───────────────────────────────────────────────────────────────

   Money is integer cents. Nights are whole integers — there is no such thing as
   half a night on a kennel card.

   ⚠ EVERY `Hundredths` FIELD IN THIS FILE IS HUNDREDTHS OF A PER CENT, and
   there is exactly one DIVISION by ten thousand in the whole engine: the
   sibling discount, which turns a percentage into money. Everything else is a
   count of nights multiplied by a rate in cents, with no divisor at all.

     siblingDiscountCents = boardCents * siblingDiscountHundredths / 10000

     34400 cents of board at 1000 hundredths of a per cent — ten per cent — is
     34,400,000, over 10,000 is 3,440 cents, which is $34.40. Dividing by a
     hundred instead gives $344.00, a plausible-looking figure wrong by a factor
     of a hundred, and no gate here would say a word.

   `addOnShareHundredths` is the same KIND of quantity — hundredths of a per
   cent — and it is arrived at by MULTIPLYING by ten thousand and dividing by
   the two lines it is comparing. Read the noun, then read which side of the
   fraction the ten thousand is on. billable-hours.js is the engine where two
   different kinds of hundredths live in one file, and it is worth reading
   beside this one.
   ============================================================================ */

import { daysBetween } from './recall.js';
import { money as usd } from './format.js';

/**
 * @param {object} input
 * @param {string} input.asOf       ISO day the sheet is counted to
 * @param {string[]} input.peakDates
 *   THE OWNER'S OWN RULE. Plain ISO days they have declared peak. A night is
 *   peak when the date it STARTS on is in this list.
 * @param {Array} input.bookings
 *   [{id, ref, owner, checkIn, checkOut, baseRateCents, peakRateCents,
 *     sharedWithRef, siblingDiscountHundredths, addOns, depositPaidCents}]
 *   baseRateCents             NULL means nobody has entered a nightly rate.
 *                             0 means one has, and it is nothing — a comped
 *                             stay. Two different claims.
 *   peakRateCents             NULL means no peak rate has been entered, and
 *                             every peak night falls to the base rate. 0 means
 *                             peak nights are free, which is a real answer.
 *   sharedWithRef             NULL means the pet is in a run on its own.
 *   siblingDiscountHundredths NULL means no discount has been entered. 0 means
 *                             one has, and it is nothing.
 *   addOns                    [{name, unitCents, qty}] — a price and a count,
 *                             and one without the other is named rather than
 *                             assumed to be one of them.
 */
export function computeBoardingRate(input) {
  const asOf = input.asOf;
  /* THE HOUSE DATE IS CHECKED THROUGH THE INSTRUMENT THAT WILL BE USED ON IT.
     daysBetween(asOf, asOf) is null exactly when asOf is unreadable, so this
     asks the question with the same parser rather than with a second one that
     could disagree. Same shape as retainer-burn.js and draw-schedule.js. */
  const readable = (d) => !!d && daysBetween(d, d) != null;
  const asOfOk = readable(asOf);
  const src = Array.isArray(input.bookings) ? input.bookings : [];

  const set = (v) => v != null && v !== '' && Number.isFinite(Number(v));
  const whole = (v) => Math.max(0, Math.round(Number(v) || 0));

  /* THE DECLARED LIST, DEDUPED AND SPLIT INTO WHAT CAN BE READ AND WHAT CANNOT.
     A date typed twice must not price its night twice, and a date this cannot
     parse must be named as unreadable rather than reported as a rule that
     applies to nothing — those are opposite sentences about the same box. */
  const declared = Array.isArray(input.peakDates) ? input.peakDates : [];
  const peakSeen = [...new Set(declared.map((d) => String(d)))];
  const peakDates = peakSeen.filter((d) => readable(d));
  const unreadablePeak = peakSeen.filter((d) => !readable(d));

  /* A NIGHT STARTING ON `d` IS INSIDE A STAY when the stay has begun by then
     and has not ended: checkIn <= d < checkOut. The second half is `>= 1`
     rather than `> 0` for the same reason — a night starting on the check-out
     date was never boarded. */
  const nightIn = (start, end, d) => {
    const from = daysBetween(start, d);
    const to = daysBetween(d, end);
    return from != null && to != null && from >= 0 && to >= 1;
  };

  const rows = src.map((x) => {
    const inOk = readable(x.checkIn);
    const outOk = readable(x.checkOut);
    const spanOk = inOk && outOk;
    /* NULL WHEN EITHER DATE CANNOT BE READ, and NEVER nought — nought nights is
       the real answer for a stay typed in and out on one day. */
    const nights = spanOk ? daysBetween(x.checkIn, x.checkOut) : null;
    const datesBackwards = nights != null && nights < 0;
    const sameDay = nights === 0;
    const nightsCharged = nights != null && nights > 0 ? nights : 0;

    const peakNights = nightsCharged === 0
      ? 0 : peakDates.filter((d) => nightIn(x.checkIn, x.checkOut, d)).length;
    const standardNights = nightsCharged - peakNights;

    const baseSet = set(x.baseRateCents);
    const base = baseSet ? whole(x.baseRateCents) : null;
    const peakSet = set(x.peakRateCents);
    const peakRate = peakSet ? whole(x.peakRateCents) : null;
    /* THE OWNER'S RULE WITH A BLANK IN IT. A peak night with no peak rate
       entered is charged at the base rate — which is what the arithmetic has to
       do with an empty box — and the row carries a flag so the page can say so
       out loud rather than applying it quietly. */
    const peakFellToBase = peakNights > 0 && !peakSet;
    const nightRate = base == null ? 0 : base;
    const peakNightRate = peakSet ? peakRate : nightRate;

    const peakBoardCents = peakNights * peakNightRate;
    const standardBoardCents = standardNights * nightRate;
    const boardCents = standardBoardCents + peakBoardCents;
    /* WHAT THE SAME NIGHTS WOULD HAVE COME TO AT THE BASE RATE ON EVERY ONE OF
       THEM. Not a counterfactual price and not a suggestion — it is the same
       stay run through the OTHER rate the owner already typed, and the gap
       between the two is the peak rule expressed in money. */
    const boardAtBaseCents = nightsCharged * nightRate;
    const peakUpliftCents = boardCents - boardAtBaseCents;

    const addOnsSrc = Array.isArray(x.addOns) ? x.addOns : [];
    const addOns = addOnsSrc.map((a) => {
      const priceSet = set(a.unitCents);
      const qtySet = set(a.qty);
      const unitCents = priceSet ? whole(a.unitCents) : null;
      const qty = qtySet ? whole(a.qty) : null;
      return {
        ...a, priceSet, qtySet, unitCents, qty,
        /* A LINE MISSING EITHER HALF ADDS NOTHING, and it is not treated as a
           quantity of one or a price of nought. Both of those are real answers
           somebody could have meant, and neither is what a blank box says. */
        lineCents: priceSet && qtySet ? unitCents * qty : 0,
        incomplete: priceSet !== qtySet,
      };
    });
    const addOnsCents = addOns.reduce((a, b) => a + b.lineCents, 0);

    const sharedWith = x.sharedWithRef == null || x.sharedWithRef === '' ? null : String(x.sharedWithRef);
    const discountSet = set(x.siblingDiscountHundredths);
    const discountHundredths = discountSet ? whole(x.siblingDiscountHundredths) : null;
    /* THE ONE DIVISION BY TEN THOUSAND IN THIS FILE — see the units note. */
    const siblingDiscountCents = sharedWith != null && discountSet
      ? Math.round((boardCents * discountHundredths) / 10000) : 0;

    const stayTotalCents = boardCents + addOnsCents - siblingDiscountCents;
    const depositPaidCents = whole(x.depositPaidCents);
    const balanceDueCents = stayTotalCents - depositPaidCents;

    const grossCents = boardCents + addOnsCents;
    /* THE SHARE, AND IT IS NULL RATHER THAN NOUGHT ON A CARD WITH NOTHING ON
       IT. A share of nothing is undefined, and printing 0% would say the
       add-ons are none of a stay that has no figures on it at all. */
    const addOnShareHundredths = grossCents > 0
      ? Math.round((addOnsCents * 10000) / grossCents) : null;

    /* WHERE THE STAY SITS AGAINST THE HOUSE DATE. A balance on an animal that
       has already gone home is money to chase; a balance on one still in the
       runs is money collected at the door. Same figure, two different jobs, and
       nothing but the date can tell them apart. */
    const nightsToGo = outOk && asOfOk ? daysBetween(asOf, x.checkOut) : null;
    return {
      ...x,
      inOk, outOk, nights, nightsCharged, datesBackwards, sameDay,
      peakNights, standardNights,
      baseSet, base, peakSet, peakRate, peakFellToBase, peakNightRate,
      boardCents, peakBoardCents, standardBoardCents, boardAtBaseCents, peakUpliftCents,
      addOns, addOnsCents, addOnShareHundredths,
      sharedWith, discountSet, discountHundredths, siblingDiscountCents,
      stayTotalCents, depositPaidCents, balanceDueCents,
      /* A CREDIT IS NOT AN ERROR. Named, never judged. */
      inCredit: balanceDueCents < 0,
      nightsToGo,
      goneHome: nightsToGo == null ? null : nightsToGo < 0,
    };
  });

  /* SORTED BY CHECK-OUT, SOONEST FIRST, because a card rack is worked in
     departure order — the bill is made up when the animal goes home. ISO days
     sort chronologically as plain strings, so this needs no arithmetic and
     holds even when the house date cannot be read. Anything with no readable
     check-out sits at the END rather than at either extreme: a stay nobody can
     time must not sort as though it were leaving first. */
  const sorted = [...rows].sort((a, b) => {
    if (!a.outOk && !b.outOk) return 0;
    if (!a.outOk) return 1;
    if (!b.outOk) return -1;
    return a.checkOut < b.checkOut ? -1 : (a.checkOut > b.checkOut ? 1 : 0);
  });

  const sum = (list, f) => list.reduce((a, r) => a + f(r), 0);
  const gone = rows.filter((r) => r.goneHome === true);
  const boardCents = sum(rows, (r) => r.boardCents);
  const addOnsCents = sum(rows, (r) => r.addOnsCents);
  const grossCents = boardCents + addOnsCents;

  const totals = {
    bookings: rows.length,
    nights: sum(rows, (r) => r.nightsCharged),
    peakNights: sum(rows, (r) => r.peakNights),
    standardNights: sum(rows, (r) => r.standardNights),
    boardCents,
    peakBoardCents: sum(rows, (r) => r.peakBoardCents),
    standardBoardCents: sum(rows, (r) => r.standardBoardCents),
    /* THE FIRST FINDING, AS ARITHMETIC. What the nights came to, what the same
       nights would have come to at the base rate, and the difference — which is
       the peak rule and nothing else. */
    boardAtBaseCents: sum(rows, (r) => r.boardAtBaseCents),
    /* THE SAME PEAK NIGHTS PRICED AT THE BASE RATE, on its own. Derived here
       rather than in the page, because the page would have to subtract the
       standard board out of the whole-sheet figure to get it and a subtraction
       written in JSX is a subtraction no gate reads. */
    peakBoardAtBaseCents: sum(rows, (r) => r.peakNights * (r.base == null ? 0 : r.base)),
    peakUpliftCents: sum(rows, (r) => r.peakUpliftCents),
    /* PEAK NIGHTS PRICED AT THE BASE RATE BECAUSE NO PEAK RATE WAS ENTERED.
       Counted so the uplift figure above cannot be read as "the peak rule is
       worth less than you thought" when what actually happened is that a box
       was left empty. */
    peakNightsAtBase: sum(rows.filter((r) => r.peakFellToBase), (r) => r.peakNights),
    bookingsMissingPeakRate: rows.filter((r) => r.peakFellToBase).length,
    /* THE SECOND FINDING, AS ARITHMETIC. */
    addOnsCents,
    addOnShareHundredths: grossCents > 0 ? Math.round((addOnsCents * 10000) / grossCents) : null,
    siblingDiscountCents: sum(rows, (r) => r.siblingDiscountCents),
    sharedRuns: rows.filter((r) => r.sharedWith != null).length,
    stayTotalCents: sum(rows, (r) => r.stayTotalCents),
    depositPaidCents: sum(rows, (r) => r.depositPaidCents),
    balanceDueCents: sum(rows, (r) => r.balanceDueCents),
    /* MONEY OUTSTANDING ON ANIMALS THAT HAVE ALREADY LEFT. The one figure on
       this page that needs the house date, and the only reason it is data
       rather than the clock. */
    balanceDueGoneCents: sum(gone, (r) => r.balanceDueCents),
    goneHome: gone.length,
    creditRows: rows.filter((r) => r.inCredit).length,
  };

  const problems = [];
  const money = (c) => usd(Math.abs(c) / 100, { cents: true });
  const pct = (h) => `${(h / 100).toFixed(2)}%`;
  const nightWord = (n) => `${n} ${n === 1 ? 'night' : 'nights'}`;
  const name = (r) => r.ref || 'A booking';
  const said = (v) => (v == null || v === '' ? '' : String(v));

  if (!asOfOk) {
    problems.push(`The date this sheet is counted to reads "${said(asOf)}", which is not a date this can use. It wants YYYY-MM-DD, and until it has one no stay can be told whether it has already gone home, so nothing is counted as owed after a check-out.`);
  }
  for (const d of unreadablePeak) {
    problems.push(`One of your peak dates reads "${said(d)}", which is not a date this can use. It wants YYYY-MM-DD, and no night on this sheet is priced against it — the stays that fall on that date are charged at the base rate as though you had never declared it.`);
  }

  for (const r of sorted) {
    if (!r.inOk) {
      problems.push(`The check-in on ${name(r)} reads "${said(r.checkIn)}", which is not a date this can use. It wants YYYY-MM-DD, and until it has one that stay has no nights to charge and not one of them can be counted against your peak dates.`);
    }
    if (!r.outOk) {
      problems.push(`The check-out on ${name(r)} reads "${said(r.checkOut)}", which is not a date this can use. It wants YYYY-MM-DD, so that stay has no nights at all rather than a stay of none, and it sits at the bottom of the sheet rather than anywhere in the departure order.`);
    }
    if (r.datesBackwards) {
      problems.push(`${name(r)} runs from ${r.checkIn} to ${r.checkOut}, which ends before it starts. This takes no view on which of the two dates is the typo. No board is charged on that line, because there are no nights between those dates to charge for.`);
    }
    if (r.sameDay) {
      problems.push(`${name(r)} checks in and out on ${r.checkIn}, which is a day rather than a night. A stay is counted from check-in to check-out, so a Friday to Sunday booking is two nights — this one is nought, and no board is charged on it. Whatever was done for that animal is on the add-ons or nowhere.`);
    }
    if (!r.baseSet) {
      problems.push(`No nightly rate has been entered on ${name(r)}, so its board comes to nothing. That is a figure nobody typed rather than a stay you gave away — its ${nightWord(r.nightsCharged)} are counted and none of them is priced, and the add-ons on that card are the whole of what it comes to.`);
    } else if (r.base === 0) {
      problems.push(`${name(r)} is written at a nightly rate of nothing, which is a real arrangement and not a blank one. Its ${nightWord(r.nightsCharged)} come to nought in board, and that is what the arithmetic says rather than a figure this could not work out.`);
    }
    if (r.peakFellToBase) {
      problems.push(`${name(r)} has ${r.peakNights} of its ${nightWord(r.nightsCharged)} on your peak list and no peak rate entered against it, so every one of them is charged at the base rate of ${money(r.peakNightRate)}. That is what an empty box does to the price, said out loud rather than applied quietly — as it stands that stay is priced as though your peak dates were ordinary nights.`);
    }
    if (r.sharedWith == null && r.discountSet) {
      problems.push(`${name(r)} carries a sibling discount of ${pct(r.discountHundredths)} and names no other booking it shares a run with, so there is no second pet for it to be a discount on. Nothing is taken off that line — the percentage is on the card and changes no figure on it.`);
    }
    for (const a of r.addOns) {
      if (!a.incomplete) continue;
      if (a.qtySet) {
        problems.push(`"${a.name || 'An add-on'}" on ${name(r)} is written ${a.qty} times with no unit price, so it adds nothing to that stay. A blank price is a figure nobody typed rather than something given away, and once the total is printed the two look identical.`);
      } else {
        problems.push(`"${a.name || 'An add-on'}" on ${name(r)} carries a unit price of ${money(a.unitCents)} and no quantity, so it adds nothing to that stay. Nothing is assumed to be one of them — an item priced and not counted is an item somebody has not finished writing down.`);
      }
    }
    if (r.inCredit) {
      problems.push(`${name(r)} has paid ${money(r.depositPaidCents)} against a stay that comes to ${money(r.stayTotalCents)}, so that card is ${money(r.balanceDueCents)} in credit rather than short. This takes no view on whether that is a refund, a rolling balance, or a deposit against the next stay — it is money you are holding, and the balance on that line is below nought because of it.`);
    }
  }

  /* A RUN-MATE THAT IS NOT ON THE SHEET, AND TWO CARDS THAT DISAGREE. Both are
     read off the REF, which is a name somebody typed, so both are matched by
     exact text — a sheet that guessed at near-matches would silently pair the
     wrong two animals and take a discount off a stranger's bill. */
  const byRef = new Map();
  for (const r of rows) {
    if (!r.ref) continue;
    if (!byRef.has(r.ref)) byRef.set(r.ref, []);
    byRef.get(r.ref).push(r);
  }
  for (const r of sorted) {
    if (r.sharedWith == null) continue;
    if (!byRef.has(r.sharedWith)) {
      problems.push(`${name(r)} is written as sharing a run with "${r.sharedWith}", and there is no booking by that name on this sheet. The discount is still taken off ${name(r)} because you entered it there, and nothing is taken off the other animal, because there is no other animal here to take it off.`);
    }
  }
  /* NAMED ONCE PER PAIR, not once per card. Sorting the two refs and keying on
     the pair is what stops the same disagreement being reported twice from
     opposite ends, which reads as two problems and is one. */
  const seenPair = new Set();
  for (const r of rows) {
    if (r.sharedWith == null) continue;
    const others = byRef.get(r.sharedWith) || [];
    for (const o of others) {
      if (o.sharedWith !== r.ref) continue;
      if (r.discountHundredths === o.discountHundredths) continue;
      const key = JSON.stringify([r.ref, o.ref].sort());
      if (seenPair.has(key)) continue;
      seenPair.add(key);
      problems.push(`${r.ref} and ${o.ref} are each written as sharing a run with the other, at two different discounts — ${r.discountSet ? pct(r.discountHundredths) : 'none at all'} on one card and ${o.discountSet ? pct(o.discountHundredths) : 'none at all'} on the other. Each line is worked out at its own figure, which is what the two cards say; this sheet cannot pick between them and does not try.`);
    }
  }
  for (const [ref, list] of byRef) {
    if (list.length > 1) {
      problems.push(`There is more than one booking called ${ref} on this sheet, so two cards are the same animal as far as anybody reading them can tell, and both are counted. A discount naming that name cannot be told which of the two it means.`);
    }
  }

  /* A DECLARED PEAK DATE WITH NOTHING TO APPLY IT TO. It changes no figure on
     the sheet, which is exactly why nothing but a sentence can report it. */
  for (const d of peakDates) {
    if (rows.some((r) => nightIn(r.checkIn, r.checkOut, d))) continue;
    problems.push(`${d} is on your peak list and no booking on this sheet has a night starting on it, so that rate is on the sheet and changes no figure on it. Either the stay is not entered yet, or the date belongs to a season that is not on this page.`);
  }

  if (rows.length === 0) {
    problems.push('There are no bookings on this sheet, so there is nothing to work out.');
  }

  return { rows: sorted, totals, problems };
}
