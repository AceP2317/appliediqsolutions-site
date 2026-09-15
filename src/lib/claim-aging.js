/* ============================================================================
   CLAIM AGING — which claims are past THIS practice's own follow-up interval
   for THAT payer, and how far past.

   ── THE SAME SHAPE AS THE RECALL DUE LIST, POINTED AT MONEY ─────────────────

   A recall list asks "who is past the interval we set, and how far past". This
   asks exactly that about claims, and it reuses the same date arithmetic from
   src/lib/recall.js rather than carrying a second copy of it. Two trades, one
   piece of date arithmetic — which is also true of the Lawn Route Pricing Sheet.

   ── WHY THE INTERVAL IS PER PAYER, AND WHY THAT IS THE OWNER'S RULE ─────────

   Every practice management system ages receivables into thirty, sixty and
   ninety day buckets. Those buckets are the same everywhere, which is exactly
   why a platform can do them and why they answer nothing: a claim at forty days
   with a payer who always settles at fifty is fine, and a claim at forty days
   with a payer who settles at twenty is a phone call that should have happened
   a fortnight ago.

   The interval is the practice's own, per payer, learned from what that payer
   actually does. That is the decision this tool is built around, and it is the
   one a platform refuses to hold because it differs per practice.

   THERE ARE NO 30/60/90 BUCKETS HERE ON PURPOSE. Adding them would put a
   universal answer beside the practice's own one and quietly teach the reader
   that the universal one is the real measure.

   ── A DENIAL IS STILL OUTSTANDING ───────────────────────────────────────────

   Money that was denied has not arrived and has not been written off, so it is
   still owed to the practice until somebody decides otherwise. It stays in the
   total and is flagged, rather than being netted away — a denial silently
   removed from an aging report is how a practice discovers a year later that
   nobody appealed anything.

   Money is integer cents. Dates are ISO `YYYY-MM-DD` and every one of them is
   read through recall.js's daysBetween, which returns null rather than NaN for
   anything it cannot parse.

   THE HONESTY CONTRACT. The intervals, the amounts and the as-of date are the
   practice's. Nothing here predicts whether a payer will pay, scores a payer,
   suggests an interval, or compares any of it to a published days-in-AR figure.
   It also never decides to write anything off.
   ============================================================================ */

import { daysBetween } from './recall.js';

/**
 * @param {object} input
 * @param {string} input.asOf                ISO date the aging is run at
 * @param {Array}  input.payers              [{id, name, followUpDays}]
 * @param {Array}  input.claims
 *   [{id, ref, payerId, submitted, billedCents, paidCents, writtenOffCents, denied}]
 */
export function computeClaimAging(input) {
  const asOf = typeof input.asOf === 'string' ? input.asOf : '';
  const payers = Array.isArray(input.payers) ? input.payers : [];
  const src = Array.isArray(input.claims) ? input.claims : [];

  const payerOf = (id) => payers.find((p) => p.id === id) || null;

  const rows = src.map((c) => {
    const payer = payerOf(c.payerId);
    const billed = Math.max(0, Math.round(c.billedCents || 0));
    const paid = Math.max(0, Math.round(c.paidCents || 0));
    const writtenOff = Math.max(0, Math.round(c.writtenOffCents || 0));
    const outstanding = billed - paid - writtenOff;

    /* NULL, NOT ZERO, for an age that cannot be worked out. Zero would sort a
       broken date to the top of a list ordered by newest, or the bottom of one
       ordered by oldest, and either way it would look like an answer. */
    const age = daysBetween(c.submitted, asOf);
    /* NOT SET AND ZERO ARE DIFFERENT STATES AND MUST NOT BE SPELLED THE SAME.
       A payer with no interval has nothing to be past, so their claims are in
       no worklist at all. A payer set to zero is one this practice chases the
       day it submits, so every open claim of theirs is past from day one. Both
       are legitimate; reading them as one another is how a payer nobody is
       chasing looks exactly like a payer who is up to date. Caught by the gate
       on 2026-09-07, when the refusal text said one thing and the arithmetic
       did the other. */
    const interval = payer && Number.isFinite(payer.followUpDays) ? Math.max(0, Math.round(payer.followUpDays)) : null;
    const daysPast = age != null && interval != null ? age - interval : null;

    return {
      ...c,
      payerName: payer ? payer.name : null,
      billed, paid, writtenOff, outstanding,
      age, interval, daysPast,
      denied: c.denied === true,
      open: outstanding > 0,
      /* PAST FOLLOW-UP is a comparison against the practice's own interval, and
         it is only ever true when both halves are actually known. */
      pastFollowUp: daysPast != null && daysPast > 0 && outstanding > 0,
      overApplied: paid + writtenOff > billed,
      futureDated: age != null && age < 0,
      unreadableDate: age == null,
      orphan: !payer,
    };
  });

  /* SORTED FURTHEST PAST FIRST, and only on a number that came from a date. A
     row with no age sorts to the end rather than to either extreme. */
  const sorted = [...rows].sort((a, b) => {
    if (a.daysPast == null && b.daysPast == null) return 0;
    if (a.daysPast == null) return 1;
    if (b.daysPast == null) return -1;
    return b.daysPast - a.daysPast;
  });

  const byPayer = payers.map((p) => {
    const mine = rows.filter((r) => r.payerId === p.id);
    const open = mine.filter((r) => r.open);
    const past = mine.filter((r) => r.pastFollowUp);
    const ages = open.map((r) => r.age).filter((a) => a != null);
    return {
      ...p,
      claims: mine.length,
      openClaims: open.length,
      outstanding: open.reduce((a, r) => a + r.outstanding, 0),
      pastFollowUp: past.length,
      pastFollowUpValue: past.reduce((a, r) => a + r.outstanding, 0),
      oldest: ages.length ? Math.max(...ages) : null,
      denied: mine.filter((r) => r.denied && r.open).length,
    };
  });

  const open = rows.filter((r) => r.open);
  const past = rows.filter((r) => r.pastFollowUp);
  const totals = {
    claims: rows.length,
    openClaims: open.length,
    billed: rows.reduce((a, r) => a + r.billed, 0),
    paid: rows.reduce((a, r) => a + r.paid, 0),
    writtenOff: rows.reduce((a, r) => a + r.writtenOff, 0),
    outstanding: open.reduce((a, r) => a + r.outstanding, 0),
    pastFollowUp: past.length,
    pastFollowUpValue: past.reduce((a, r) => a + r.outstanding, 0),
    deniedOpen: open.filter((r) => r.denied).length,
    deniedValue: open.filter((r) => r.denied).reduce((a, r) => a + r.outstanding, 0),
    oldestOpen: open.map((r) => r.age).filter((a) => a != null).reduce((m, a) => (m == null || a > m ? a : m), null),
  };

  const problems = [];

  for (const r of rows.filter((x) => x.unreadableDate)) {
    problems.push(`${r.ref || 'A claim with no reference'} has a submitted date this cannot read, so it has no age and is in no follow-up list.`);
  }
  for (const r of rows.filter((x) => x.futureDated)) {
    problems.push(`${r.ref} was submitted after the date you are aging to, so its age is negative.`);
  }
  for (const r of rows.filter((x) => x.orphan)) {
    problems.push(`${r.ref || 'A claim'} is against a payer who is not on the list, so no follow-up interval applies to it.`);
  }
  for (const r of rows.filter((x) => x.overApplied)) {
    problems.push(`${r.ref} has more paid and written off against it than was ever billed.`);
  }
  /* A PAYER WITH NO INTERVAL. Nothing of theirs can ever be past due, so their
     claims sit in the total and never in the worklist — a silence that looks
     exactly like a payer who is up to date. */
  for (const p of byPayer.filter((x) => !Number.isFinite(x.followUpDays))) {
    if (p.openClaims > 0) {
      problems.push(`${p.name} has no follow-up interval set, so none of their ${p.openClaims} open claim(s) can ever show as past due.`);
    }
  }
  /* AND A PAYER SET TO ZERO IS THE OPPOSITE, not the same thing. Every open
     claim of theirs is past due the day it is submitted, which is a real way to
     work a payer and a surprise if it was a typo. */
  for (const p of byPayer.filter((x) => Number.isFinite(x.followUpDays) && x.followUpDays === 0)) {
    if (p.openClaims > 0) {
      problems.push(`${p.name} is set to be chased immediately, so all ${p.openClaims} of their open claim(s) are past due from the day they were submitted.`);
    }
  }
  for (const ref of [...new Set(rows.map((r) => r.ref).filter(Boolean))]) {
    if (rows.filter((r) => r.ref === ref).length > 1) {
      problems.push(`There is more than one claim called ${ref}, so two lines here are the same claim as far as anybody reading it can tell.`);
    }
  }
  if (totals.deniedOpen > 0) {
    problems.push(`${totals.deniedOpen} denied claim(s) still carry money. Denials stay in this total until somebody appeals or writes them off — they are not netted away here.`);
  }
  if (!asOf || daysBetween(asOf, asOf) == null) {
    problems.push('The date you are aging to cannot be read, so nothing here has an age.');
  }
  if (rows.length === 0) {
    problems.push('There are no claims entered, so there is nothing to age.');
  }

  return { rows: sorted, byPayer, totals, problems };
}
