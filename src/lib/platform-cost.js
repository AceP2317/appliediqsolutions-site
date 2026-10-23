/* ============================================================================
   PLATFORM COST — the arithmetic under /websites/compare/.

   THIS MODULE EXISTS BECAUSE THE OBVIOUS ARGUMENT IS FALSE AND THE NUMBERS SAY
   SO. Every comparison page written by somebody selling custom websites reaches
   for "a subscription costs more in the long run". At these prices it does not.
   Five years of Wix Light is $1,066 against a $4,500 build, and renting stays
   cheaper until roughly year twenty-one. Publishing a five-year total as though
   it favored the build would be a number arranged to flatter the seller, which
   is the exact failure the honesty contract on this site exists to refuse.

   SO THE FIGURE THIS PRINTS IS THE CROSSOVER, NOT A TOTAL. It answers "how long
   until renting has cost more", and for most platforms here the honest answer is
   longer than the business will exist. A reader who works that out for himself
   after reading a page that hid it never trusts the page again.

   PURE ESM, NO REACT, on the split stated in CLAUDE.md: a .mjs gate can import
   this natively and check the same function the page runs, rather than a copy of
   it that agrees with its own bugs.

   WEBSITE_USD IS IMPORTED AND NEVER TYPED. src/lib/pricing.js is its only home,
   and check-dist.mjs refuses a hand-typed $4,500 beside website wording in any
   scanned source file.
   ============================================================================ */
import { WEBSITE_USD } from './pricing.js';

/** Whole months of subscription that add up to one build. A platform costing
    nothing per month never reaches it, so this returns null rather than
    Infinity — a template printing "Infinity years" is worse than one printing
    nothing, and null forces the caller to say what it means. */
export function monthsToParity(monthlyUsd) {
  if (!(monthlyUsd > 0)) return null;
  return Math.ceil(WEBSITE_USD / monthlyUsd);
}

/** The same figure in years, rounded to one decimal, which is the unit a reader
    actually reasons in. Nobody weighs "253 months". */
export function yearsToParity(monthlyUsd) {
  const months = monthsToParity(monthlyUsd);
  return months === null ? null : Math.round((months / 12) * 10) / 10;
}

/** What the subscription costs over a stated number of years. The span is an
    ARGUMENT rather than a constant on purpose: a five-year figure hardcoded here
    would be a decision made once and then re-quoted by every caller as though it
    were a property of the platform. */
export function totalOverYears(monthlyUsd, years) {
  return Math.round(monthlyUsd * 12 * years * 100) / 100;
}

/** Everything a row needs, computed once so the page never does arithmetic in a
    template. `cheaperForYears` is deliberately the FIRST field: it is the fact
    that argues against the sale, and putting it last is how a comparison starts
    quietly burying it. */
export function costShape(monthlyUsd, years = 5) {
  return {
    monthlyUsd,
    cheaperForYears: yearsToParity(monthlyUsd),
    monthsToParity: monthsToParity(monthlyUsd),
    total: totalOverYears(monthlyUsd, years),
    years,
    buildUsd: WEBSITE_USD,
  };
}
