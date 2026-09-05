/* ============================================================================
   THE PUBLISHED NUMBERS — as numbers.

   THIS FILE SAID "THE ONE PUBLISHED NUMBER" UNTIL 2026-09-03, SAID "TWO" LATER
   THE SAME DAY, AND THERE ARE NOW THREE. They are the floor a build starts at,
   the flat price of an AI Fit Assessment, and the floor a website build starts
   at. What keeps D5 intact is that each one prices a DIFFERENT PRODUCT rather
   than a tier of the same one. A menu is several prices for ONE thing, which is
   what pricingNotes in src/data/services.ts explains this site does not do.
   Three products with one price each is not that.

   THE TEST FOR A FOURTH IS UNCHANGED AND IT IS THE ONLY THING HOLDING THE LINE.
   It is only allowed for a product a visitor could buy without buying any of
   these, and if that test ever stops being applied this file is back to being a
   rate sheet. The website floor was admitted against it deliberately: a business
   can buy a site without buying a shelf tool or an assessment.

   WHY THE WEBSITE FLOOR MOVED HERE FROM src/lib/engagement-rates.js. That module
   holds figures that reach exactly one audience, somebody holding a signed scope
   document, and a gate refuses every one of them in page copy. The split those
   two modules enforce is published against never-published, so a number changing
   status changes file. Exempting it in place would have left a published figure
   and an unpublished one in the same import, one edit away from a page rendering
   the wrong one — which is the exact hazard that module's own header names.

   D5-amended publishes the floor a build starts at. Before this module it
   existed in two shapes in two files — a
   formatted STRING in src/data/services.ts and a bare NUMBER in
   src/components/CostCheck.jsx, which computes the payback period against it.
   Two shapes meant the page could quote one figure while the arithmetic under
   it used another, and nothing would have reported that.

   This is plain ESM JavaScript, not TypeScript, on purpose. A .mjs gate script
   can import a .js module natively on Node 22.12; it cannot import a .ts module
   without a loader flag. Keeping the shared primitives importable by the gates
   is what stops a third copy appearing inside a check.

   NOT imported by scripts/verify-check.mjs, and that is deliberate. That file
   states its own rule at :23-25 — it duplicates the arithmetic rather than
   importing it, because a test that imports the thing it tests agrees with its
   bugs. Its hardcoded 2500 SHOULD break when this number moves. That failure is
   the alarm telling a human to re-verify the payback copy.
   ============================================================================ */

/** The published floor, in whole US dollars. A floor, never a quote. */
export const FLOOR_USD = 2500;

/** The qualifier travels with the figure so no surface can show one without the
    other — D5-amended states that requirement, and keeping them in one module
    is what enforces it rather than remembering it. */
export const FLOOR_QUALIFIER =
  'That is a floor, not a quote. What yours costs is agreed before any work begins.';

/* ── THE AI FIT ASSESSMENT ─────────────────────────────────────────────────
   A FLAT PRICE, NOT A FLOOR, and the difference is the whole reason it can sit
   on a page beside one. The floor above says "you are in the right place" and
   settles nothing; this one is the entire cost of the thing, so it is quoted as
   a fact rather than a starting point.

   WHY IT IS CREDITED. An assessment that ends in a priced list of builds and is
   NOT credited makes the build it recommends cost more than the same build
   bought directly -- $3,500 against $2,500. The document would then be arguing
   against its own recommendation, and a buyer does that arithmetic out loud. The
   credit erases it: someone who only wants the read pays in full, someone who
   goes ahead pays nothing for it.

   THE WINDOW IS QUOTE_VALID_DAYS AND THAT IS NOT A CONVENIENCE. The report ends
   in priced builds, which IS a quote, so the credit and the prices it rests on
   have to expire together. A credit outliving its prices means honouring a
   number the practice no longer stands behind. */

import { QUOTE_VALID_DAYS } from './house-terms.js';

/** The whole price of an AI Fit Assessment, in whole US dollars. */
export const ASSESSMENT_USD = 1000;

/** Travels with the figure for the same reason FLOOR_QUALIFIER does: the price
    and what happens to it are one statement, and half of it is a different
    offer. */
export const ASSESSMENT_QUALIFIER =
  `That is the whole price. It comes off your build in full if you go ahead within ${QUOTE_VALID_DAYS} days.`;

/* ── WHAT A WEBSITE BUILD STARTS AT ────────────────────────────────────────
   A SECOND FLOOR, AND THE FIRST ONE DOES NOT MOVE TO MEET IT. "Builds start at
   $2,500" stays true of the smallest thing sold, which is a shelf tool fitted to
   a business, and its whole job is telling a reader whether they are in the same
   world before anything is scoped. Raising it was rejected on evidence: it would
   price the shelf out of reach, and the shelf is the volume.

   WHY TWO FLOORS RATHER THAN ONE. The published floor was sized for exactly one
   job — taking a finished shelf tool and changing what it computes OVER. The
   rate card says so in its own words, "the floor buys a fitting". A website
   build is that fitting PLUS five more things: the pages, sender records so
   their mail is not junked, a search listing and business profile, two policy
   pages, and a handover with the access test actually run. Five of the six were
   never priced, and nothing re-derived the floor when they were added. One
   number covering both told a website buyer something untrue.

   THE NUMBER IS THE PRACTICE'S OWN HOURLY TEST RUN BACKWARDS. HOURLY_USD in
   src/lib/engagement-rates.js is set at or above what a fixed-price build earns
   per hour, so that asking by the hour never beats agreeing a scope. Run that
   the other way and a build taking roughly 35 hours has to clear 35 x HOURLY,
   which is $4,375. At the published floor it cleared $71 an hour. Rounded up
   rather than to the arithmetic, because a fixed price means every overrun is
   absorbed here.

   THE ESTIMATE HAS NO MEASUREMENT BEHIND IT AND PUBLISHING IT DOES NOT CHANGE
   THAT. Nothing in this practice has ever timed a client build end to end. TIME
   THE NEXT ONE -- kickoff to acceptance, including the waiting -- and re-derive
   this figure from what it actually says. It is published as a floor precisely
   because a floor survives being an underestimate and a quote does not. */

/** The published floor for a website build, in whole US dollars. */
export const WEBSITE_USD = 4500;

/** Carries what the figure buys, because the scope IS the argument for the
    number. A floor with no referent is the defect this constant exists to fix,
    so this qualifier does more work than the other two: it names the six things
    rather than only saying the figure can move. */
export const WEBSITE_QUALIFIER =
  'That is a floor for the whole thing — the pages, working email that does not land in junk, your search listing, the two policy pages the law now requires, and one tool of your own built in. What yours costs is agreed before any work begins.';
