/* ============================================================================
   NET PER NIGHT — what a host actually keeps from a booking, once everything
   has come off it.

   ── WHY THIS TOOL BELONGS TO THE OWNER AND NOT TO THE PLATFORM ──────────────

   The platform's commission is trade-wide. Every host on that platform pays the
   same percentage, the platform prints it on the payout, and a tool whose whole
   argument was "we subtract 15%" would be doing arithmetic the platform has
   already done and shown you.

   The two figures that are NOT trade-wide are the ones this rests on:

     THE TURN. What it costs this house to make the room ready — its own
     housekeeping standard, its own linens, its own consumables. It comes off
     every booking exactly once, it appears on no statement anywhere, and it is
     the figure the Room Turn Cost tool produces.

     THE TAX HANDLING. Whether the platform collected occupancy tax on top and
     remitted it, or whether this house collected it and owes it, changes both
     what the gross is and what is left. Two bookings at the same nightly rate on
     two platforms keep different amounts for this reason alone, and nothing on
     either payout says so.

   ── THE FINDING: THE CLEANING FEE IS ALMOST NEVER THE TURN COST ─────────────

   A cleaning fee is set once, in a listing, usually years ago and usually by
   copying what the place down the road charges. A turn cost is worked out never.
   So the two numbers have no relationship, and the gap between them is invisible
   because they live on different screens.

   Charge more than the turn costs and the surplus is quietly subsidizing the
   nightly rate — the room looks cheaper than it is and the cleaning line is
   carrying the difference. Charge less and the host is absorbing part of every
   single turn, forever, without a line item anywhere saying so.

   Both directions are printed, per booking, beside the net.

   ── AND OCCUPANCY TAX A PLATFORM REMITS IS NOT INCOME ───────────────────────

   Where the platform collects the tax on top and pays the county direct, that
   money is never the host's. It must not appear in gross and must not appear in
   what they keep, because a host who counts it as revenue is looking at a figure
   that includes somebody else's tax payment. Where the platform does NOT remit,
   the host collected it and owes it, so it comes off what they keep.

   THE TAX IS ON THE ACCOMMODATION, NOT ON THE CLEANING FEE. That is the common
   shape across US jurisdictions and it is what this computes. It is not
   universal — some places tax the whole charge, some tax nothing under a night
   threshold — so the rate is the host's own field and a house whose county works
   differently sets it to zero and handles the tax outside this sheet. The tool
   says which shape it applied rather than assuming the reader knows.

   Money is integer cents. Percentages are integer hundredths, so 15.00% is 1500.

   THE HONESTY CONTRACT. Every rate, every fee and every percentage is the
   host's own. Nothing here suggests a nightly rate, suggests a cleaning fee,
   predicts occupancy, compares anything to a market rate, or has an opinion on
   whether a platform's commission is worth paying.
   ============================================================================ */

/* THE PROBLEMS PANEL PRINTS MONEY THE SAME WAY THE TABLE ABOVE IT DOES, which
   it did not until 2026-09-07: this file hand-rolled a dollar sign
   concatenated onto toFixed(2), so a four-figure amount lost the thousands
   separator the column above it carries. See the note in src/lib/unit-turn.js,
   where it was caught, and LEDGER L-379. */
import { money as usd } from './format.js';

/**
 * @param {object} input
 * @param {number} input.occupancyTaxPctHundredths  the house's own rate, 600 = 6.00%
 * @param {number} input.turnCostCents              what one turn costs this house
 * @param {Array}  input.platforms
 *   [{id, name, commissionPctHundredths, processingPctHundredths, remitsTax}]
 * @param {Array}  input.bookings
 *   [{id, ref, nights, nightlyRateCents, cleaningFeeChargedCents, bookingPlatformId}]
 */
export function computeNetPerNight(input) {
  const taxPct = Math.max(0, Math.round(input.occupancyTaxPctHundredths || 0));
  const turnCost = Math.max(0, Math.round(input.turnCostCents || 0));
  const srcP = Array.isArray(input.platforms) ? input.platforms : [];
  const srcB = Array.isArray(input.bookings) ? input.bookings : [];

  const platforms = srcP.map((p) => {
    const commission = Math.max(0, Math.round(p.commissionPctHundredths || 0));
    const processing = Math.max(0, Math.round(p.processingPctHundredths || 0));
    return {
      ...p,
      commission,
      processing,
      /* A BOOLEAN, COERCED. A missing flag is "they do not remit", which is the
         answer that costs the host money if it is wrong in the other direction —
         it books tax they owe rather than tax somebody else already paid. */
      remitsTax: !!p.remitsTax,
      takesEverything: commission + processing >= 10000,
    };
  });
  const byId = new Map(platforms.map((p) => [p.id, p]));

  const rows = srcB.map((b) => {
    const nights = Math.max(0, Math.round(b.nights || 0));
    const rate = Math.max(0, Math.round(b.nightlyRateCents || 0));
    const cleaning = Math.max(0, Math.round(b.cleaningFeeChargedCents || 0));
    const p = byId.get(b.bookingPlatformId) || null;

    const accommodation = rate * nights;
    /* GROSS IS THE ROOM PLUS THE CLEANING FEE AND NOTHING ELSE. Occupancy tax a
       platform collects on top never enters here, because it is not the host's
       money in either direction — see the header. */
    const gross = accommodation + cleaning;

    /* THE ACCOMMODATION IS THE BASE, NOT THE GROSS. Taxing the cleaning fee
       would overstate what is owed on every booking on the sheet. */
    const tax = Math.round((accommodation * taxPct) / 10000);
    const taxRemitted = p && p.remitsTax ? tax : 0;
    const taxOwed = p && p.remitsTax ? 0 : tax;

    /* NULL, NOT ZERO, WHERE THERE IS NO PLATFORM. A booking against a platform
       that is not on the list has no commission rate, and a zero would read as
       a platform that takes nothing — which is the flattering answer. */
    const commission = p ? Math.round((gross * p.commission) / 10000) : null;
    const processing = p ? Math.round((gross * p.processing) / 10000) : null;

    const net = p ? gross - commission - processing - taxOwed - turnCost : null;
    /* NULL WHEN THERE ARE NO NIGHTS TO DIVIDE BY. A zero would read as a night
       that earned nothing, which is a different and much worse sentence. */
    const perNight = net != null && nights > 0 ? Math.round(net / nights) : null;

    /* THE FINDING, PER ROW. Positive means the guest paid more for cleaning than
       the turn costs and the surplus is subsidizing the nightly rate; negative
       means this house is absorbing part of every turn. */
    const cleaningGap = cleaning - turnCost;

    return {
      ...b,
      nights, rate, cleaning,
      platform: p, platformName: p ? p.name : null,
      accommodation, gross, tax, taxOwed, taxRemitted,
      commission, processing, net, perNight, cleaningGap,
      noPlatform: !p,
      noNights: nights === 0,
      negative: net != null && net < 0,
      absorbingTurn: cleaning === 0 && turnCost > 0,
    };
  });

  /* THE TOTALS ARE FOOTED OVER THE PRICEABLE ROWS ONLY. A booking whose platform
     is unknown has no commission, and folding a null into a sum as zero would
     put its whole gross into what the house keeps. */
  const priced = rows.filter((r) => !r.noPlatform);
  const sum = (f) => priced.reduce((a, x) => a + f(x), 0);

  const nights = sum((r) => r.nights);
  const gross = sum((r) => r.gross);
  const net = sum((r) => r.net);

  const totals = {
    bookings: rows.length,
    priced: priced.length,
    nights,
    gross,
    commission: sum((r) => r.commission),
    processing: sum((r) => r.processing),
    taxOwed: sum((r) => r.taxOwed),
    taxRemitted: sum((r) => r.taxRemitted),
    turns: turnCost * priced.length,
    net,
    cleaningCharged: sum((r) => r.cleaning),
    /* WHAT THE CLEANING LINE IS ACTUALLY DOING, across the sheet. */
    cleaningGap: sum((r) => r.cleaningGap),
    /* WEIGHTED ON THE SAME ROWS THE MONEY IS FOOTED ON, never the mean of the
       per-night figures — a seven-night booking is not one row's worth of a
       two-night one. */
    perNight: nights > 0 ? Math.round(net / nights) : null,
    turnCost,
    taxPct,
  };

  const problems = [];
  const money = (c) => usd(Math.abs(c) / 100, { cents: true });
  const name = (r) => r.ref || 'A booking';

  for (const r of rows.filter((x) => x.noPlatform)) {
    problems.push(`${name(r)} is booked against a platform that is not on your list, so nothing can be taken off it and it is in none of the totals.`);
  }
  for (const r of rows.filter((x) => x.noNights)) {
    problems.push(`${name(r)} has no nights on it, so there is no figure per night for it at all.`);
  }
  for (const r of rows.filter((x) => x.negative)) {
    problems.push(`${name(r)} comes to minus ${money(r.net)} once everything is off it, so that booking cost you money.`);
  }
  for (const r of rows.filter((x) => x.absorbingTurn)) {
    problems.push(`${name(r)} charges no cleaning fee and a turn costs ${money(turnCost)}, so you are absorbing the whole of that turn.`);
  }
  for (const p of platforms.filter((x) => x.takesEverything)) {
    problems.push(`${p.name || 'A platform'} takes ${((p.commission + p.processing) / 100).toFixed(2)}% between commission and processing, so there is nothing left on anything booked through it.`);
  }
  for (const n of [...new Set(platforms.map((p) => p.name).filter(Boolean))]) {
    if (platforms.filter((p) => p.name === n).length > 1) {
      problems.push(`There is more than one platform called ${n}, so two lines here are the same platform as far as anybody reading it can tell.`);
    }
  }
  /* NOT-SET AND ZERO ARE THE SAME STATE HERE AND THAT IS DELIBERATE: a turn
     always costs something, so a house that has not worked it out and a house
     claiming it is free are making the identical mistake. The sentence names the
     size of it — exactly one turn per booking — rather than saying "check this". */
  if (turnCost === 0 && rows.length > 0) {
    problems.push('No turn cost is set, so every net below is overstated by exactly one turn on every booking.');
  }
  /* A SETTING, NOT A FACT, and the sentence has to say so. Zero is a legitimate
     answer in a place with no occupancy tax and it is also what an empty box
     looks like, and the two are indistinguishable from here. */
  if (taxPct === 0 && rows.length > 0) {
    problems.push('The occupancy tax rate is zero, so nothing can be owed on any of these — which is a setting on this page rather than a fact about your county.');
  }
  if (rows.length === 0) {
    problems.push('There are no bookings entered, so there is nothing to work out.');
  }

  return { rows, platforms, totals, problems };
}
