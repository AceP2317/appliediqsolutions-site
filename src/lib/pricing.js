/* ============================================================================
   THE PUBLISHED NUMBERS — as numbers.

   THIS FILE COUNTED ITSELF FOUR TIMES AND WAS WRONG THREE OF THEM. It said "the
   one published number" until 2026-09-03, said "two" later the same day, said
   "there are now FOUR PRODUCTS" until 2026-09-12, and on that date the count was
   removed rather than corrected again. Every product that shipped after a count
   was typed made that count wrong the same day, and nothing read it. READ THE
   `export const` LIST BELOW — it is the only honest answer to how many there are,
   and it cannot go stale.

   WHAT KEEPS D5 INTACT IS NOT THE COUNT. It is that each figure prices a
   DIFFERENT PRODUCT rather than a tier of the same one. A menu is several prices
   for ONE thing, which is what pricingNotes in src/data/services.ts explains this
   site does not do. One price each, per product, is not that.

   THE TEST FOR A FOURTH IS UNCHANGED AND IT IS THE ONLY THING HOLDING THE LINE.
   It is only allowed for a product a visitor could buy without buying any of
   these, and if that test ever stops being applied this file is back to being a
   rate sheet. The website floor was admitted against it deliberately: a business
   can buy a site without buying a shelf tool or an assessment.

   THE FOURTH WAS ADMITTED ON 2026-09-10 AND THE TEST WAS RUN RATHER THAN
   ASSUMED. A company buying monthly advisory buys none of the other three: no
   shelf tool is fitted, no site is built, no assessment is required first. The
   buyer is not even the same person — the other three are sold to a local owner
   who wants something built, and this is sold to a manufacturer that wants a
   decision made. It passes.

   WHAT IT IS NOT, AND THE DISTINCTION IS LOAD-BEARING. It is not a fifth rung on
   the ladder in src/data/services.ts. Those four rungs are ongoing arrangements
   for a client who already has a build, priced by quote; this is an arrangement
   for a company with no build at all. Putting it on the ladder would have made
   it a tier of an existing thing, which is exactly what the test refuses, and it
   would have handed a two-person shop a fifth row to scroll past — the same
   defect that removed rungs 5 and 6 on 2026-08-24.

   IT IS ALSO NOT UPKEEP. UPKEEP_MONTHLY_USD is support for software already
   delivered and is bought only by a client who has some; advisory builds nothing
   and its buyer has nothing of ours. **BOTH NOW LIVE IN THIS FILE**, since
   2026-09-11, and the sentence that used to sit here said they were kept apart by
   being in different modules. They are not any more — $400 and $4,000, one
   import apart — so read the block above UPKEEP_MONTHLY_USD for what replaced
   that separation: the `monthly-figures` rule in scripts/check-paperwork.mjs,
   which scopes the advisory figure to advisory's own agreement and requires it
   there. A file boundary never asserted anything; it only made the mistake less
   convenient.

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

/** The published floor, in whole US dollars. A floor, never a quote.
 *
 *  hourly-ok: A FLOOR HAS NO HOURS TO DIVIDE BY, and that is the difference between
 *  this number and every other one in this file. It says "you are in the right
 *  place" and settles nothing else, so the hourly test is applied to the QUOTE that
 *  follows it, job by job, where the hours are actually known. Dividing 2500 by an
 *  invented average would produce a figure that looks like the test having been run
 *  and would be the thing this file refuses everywhere else.
 *
 *  WHAT THE TEST DOES SAY ABOUT IT, recorded in engagement-rates.js beside
 *  HOURLY_USD rather than here: a 35-hour job at this floor earns $71 an hour,
 *  which is BELOW the $125 floor — and that is exactly why 35 hours is a website
 *  and not a fitted tool. D55 retired the estimate that blurred the two. */
export const FLOOR_USD = 2500;

/** The qualifier travels with the figure so no surface can show one without the
    other — D5-amended states that requirement, and keeping them in one module
    is what enforces it rather than remembering it. */
export const FLOOR_QUALIFIER =
  'That is a floor, not a quote. What yours costs is agreed before any work begins.';

/** THE SAME PROMISE FOR TWO FIGURES AT ONCE, and it lives here for the reason
 *  the singular one does. The FAQ answers "What does it cost?" with the build
 *  floor and the website floor in one sentence, so it cannot use the line above
 *  — "That is a floor" names one figure. It had its own hand-written version:
 *  "Both are floors rather than quotes, and the scope is agreed in writing
 *  before anything begins." Two statements of one promise sharing no literal,
 *  which is the exact shape D81 closed on /services/ and the shape that put an
 *  unqualified figure on /contact/, /main-street/ and llms.txt.
 *
 *  ADDED 2026-09-13, when check-dist.mjs gained a rule refusing the floor
 *  printed without what happens to it. That rule accepts EITHER of these two
 *  sentences and nothing else, so the set of ways this promise may be worded is
 *  now closed and lives in one file. */
export const FLOORS_QUALIFIER =
  'Both are floors rather than quotes, and the scope is agreed in writing before anything begins.';

/* ── THE AI FIT ASSESSMENT ─ ONE PRODUCT, ONE FORM, ONE FLAT PRICE ──────────
   A FLAT PRICE, NOT A FLOOR, and the difference is the whole reason it can sit
   on a page beside one. The floor above says "you are in the right place" and
   settles nothing; this is the entire cost of the thing, quoted as a fact.

   ONE FORM SINCE 2026-09-20 (D118). From 2026-09-06 the assessment was sold in
   two forms at two figures, on video and in the business, with the operator
   assigning the form on a rule printed above the figures so that a buyer never
   picked; D81 records that shape and the three measured things behind it. The
   operator cut the in-business form with the three-door decision, so the rule,
   the drive that bounded it, the second figure and the buyer-never-picks
   mechanism all left together; there is nothing to pick. The whole fee is
   credited against a build started inside QUOTE_VALID_DAYS, because an
   assessment ending in priced builds and not credited would argue against its
   own recommendation. The two-form argument is in git and in D81. */

import { QUOTE_VALID_DAYS } from './house-terms.js';

/** Whole US dollars, formatted. Local rather than imported from
    src/data/services.ts, because that module imports THIS one and a .mjs gate
    has to be able to read these strings without pulling in TypeScript. */
const usd = (n) => `$${n.toLocaleString('en-US')}`;

/* HOW LONG THE SESSION RUNS, AS WORDS, and it is here because of the defect that
   caused this whole split. /ai-fit/ said the assessment was "an hour" while the
   signed agreement committed to "half a day or a day" -- two sentences about one
   product, sharing no literal, so nothing could diff them and nobody read them
   together for three days. The price was then right for one of the two.

   These are the noun phrases every sentence on the site interpolates, so the
   duration is typed once. It cannot reach the AGREEMENT, which is prose somebody
   signs and cannot import anything -- so scripts/check-paperwork.mjs reads these
   and refuses an assessment agreement stating a different length, which is the
   same inverted enforcement house-terms.js already uses. See LEDGER L-365. */

/** How long the video session runs, as a noun phrase: "ninety minutes". */
export const ASSESSMENT_VIDEO_LENGTH = 'ninety minutes';

/** The whole price of an AI Fit Assessment done on video.
 *
 *  THE HOURLY TEST, NAMED RATHER THAN LEFT IN PROSE. Ninety minutes live plus the
 *  read and the written list is about four hours, so 750 is roughly $188 against a
 *  HOURLY_USD of 125. The block above records what happened when the CREDIT was a
 *  full $1,000: every assessed engagement dropped to roughly $96 an hour, below the
 *  floor, which is what D81 had to undo. That argument was already written there
 *  and did not name the constant, so no check could see it. */
export const ASSESSMENT_VIDEO_USD = 750;

/** What comes off a build. It equals the price on purpose: with one form the
    whole fee is the read, and the read is what is credited.
 *
 *  hourly-ok: nothing is SOLD at this figure, so there are no hours to divide by.
 *  It is a deduction from another price, and the hourly test that matters about it
 *  is the one on what it leaves behind — which is argued in the block above, and is
 *  the whole reason D81 cut the credit from a full $1,000. */
export const ASSESSMENT_CREDIT_USD = 750;

/** Travels with its figure for the same reason FLOOR_QUALIFIER does: the price
    and what happens to it are one statement, and half of it is a different and
    worse offer. */
export const ASSESSMENT_VIDEO_QUALIFIER =
  `That is the whole price, and all of it comes off a build you go ahead with within ${QUOTE_VALID_DAYS} days.`;


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
   their mail is not junked, a search listing, two policy
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


/* ── ADVISORY AND VISIBILITY LEFT THIS FILE ON 2026-09-20 (D118) ────────────
   Monthly advisory ($4,000 a month, three-month minimum, published 2026-09-10)
   and the monthly visibility reading ($300 a month, published 2026-09-11) were
   cut with the three-door decision, with their pages, their gate counters and
   advisory's own agreement. Both arguments are in git under this file's
   history; neither was ever sold to anyone. */

/* ── WHAT KEEPING IT RUNNING COSTS ─────────────────────────────────────────
   MOVED HERE FROM src/lib/engagement-rates.js ON 2026-09-11, because the operator
   decided to publish the fee. It changed file rather than gaining an exemption
   there, which is the route WEBSITE_BUILD_START_USD took on 2026-09-03 and the
   route that file's own header requires: an exempted constant sitting among the
   figures that must never reach a page is one edit away from a page rendering the
   wrong one.

   THIS IS NOT A SIXTH PRODUCT AND THE FOURTH-PRODUCT TEST IS NOT RUN ON IT.
   Upkeep is the thing that follows a build, bought only by somebody who already
   has one, and a figure becoming PUBLISHED is a different event from a product
   being ADMITTED. Nothing about the catalog changed; what changed is that a price
   a client used to learn from a quote is now on a page.

   D91 NAMED A HAZARD THAT THIS MOVE CREATES, AND THE ANSWER IS NOT "it will be
   fine". It says advisory and upkeep sat in different files precisely because two
   monthly figures that could be confused for each other is a hazard — and as of
   today they are in the same file, one import apart, $400 and $4,000. So the
   protection had to move from SEPARATION to an ASSERTION, and it did: the
   `monthly-figures` rule in scripts/check-paperwork.mjs scopes the advisory figure
   to advisory's own agreement, requires it there, and checks membership everywhere
   else. Three poison rows prove all three of its branches. A file boundary never
   asserted anything; it only made the mistake less convenient.

   AND ONE COLLISION SURVIVES THE MOVE, MEASURED RATHER THAN REASONED.
   EXTRA_PAGE_USD is also 400, and it is still a rate a prospect may not read. So
   the client-facing comparison sheet STILL refuses a literal "$400" —
   scripts/make-compare-pdf.mjs keeps the per-page figure on its leak list, and no
   string-level guard can separate a published $400 from an unpublished one. Proven
   on 2026-09-11 by removing upkeep from that list, planting an upkeep line on the
   client sheet, and watching the build refuse and name the per-page figure. The
   operator's call: leave that sheet without the figure rather than narrow a guard
   on his hourly rate or move a real price to suit a checker. */

/** Monthly upkeep, in whole US dollars — the light monthly touch already promised
 *  on /services/ and /main-street/: small fixes and changes as they come up.
 *
 *  RAISED FROM 150 TO 400 ON 2026-09-10, AND THE OLD TEST WAS NOT WRONG, IT WAS A
 *  FLOOR READ AS AN ANSWER. It said the fee must exceed one hour at HOURLY_USD,
 *  because a monthly fee smaller than a single hour loses money the first month
 *  anybody uses it. That is still true and 400 still passes it. What it never did
 *  was set an upper bound, and nothing else was looking.
 *
 *  WHAT SETS IT NOW IS WHAT THE THING IS WORTH TO THE BUYER, MEASURED RATHER THAN
 *  ASSUMED. Ten to twenty per cent of project value per month is the observed
 *  shape of a build-plus-retainer contract across this market; against WEBSITE_USD
 *  that is $450 to $900, and 150 was 3.3 per cent. Business owners defend this
 *  line in public with no seller in the room — a thread of them argued $379 a month
 *  was fair for exactly this, and one named $500 as his own floor for sites he had
 *  built. 400 sits below every one of those on purpose: the first clients here are
 *  neighbors, and being obviously fair beats being optimally priced.
 *
 *  THE PRICE IS ONLY HALF THE CHANGE AND THE OTHER HALF IS THE CAP BELOW. An
 *  unbounded "small fixes as they arise" at 400 is a worse deal for the practice
 *  than the same words at 150, because what a client feels entitled to spend scales
 *  with what they paid.
 *
 *  It is a SERVICE SUBSCRIPTION and never a license. Cancel it and everything keeps
 *  running unchanged in the client's own accounts — see docs/ownership-delivery.md
 *  section 8, which is what keeps "no subscription, no lock-in" true on the public
 *  pages alongside recurring revenue. */
export const UPKEEP_MONTHLY_USD = 400;

/** Minutes of changes included in a month of upkeep, before MIN_BILLING_MINUTES
 *  and HOURLY_USD in engagement-rates.js take over.
 *
 *  IT EXISTS BECAUSE THE WORDS ALONE HAVE NO EDGE. "Small fixes and changes as they
 *  arise" is four documents' wording for something with no stated limit, and every
 *  individual request under it is reasonable — which is exactly how an open retainer
 *  is built, one yes at a time. The bound has to be a number, because a judgment
 *  call made monthly is a negotiation held monthly.
 *
 *  SIXTY RATHER THAN MORE, and the reason is the practice's own capacity rather
 *  than the client's appetite: CONSULT_HOURS is twelve client-facing hours a week,
 *  so ten upkeep clients at an hour each is already most of a week if every one of
 *  them uses it. They will not all use it in the same month, and that is the
 *  arrangement working rather than a margin being taken.
 *
 *  IT DOES NOT ROLL FORWARD. An unused month that banks is a liability growing
 *  quietly against a fixed twelve hours, and the first client to spend six banked
 *  hours at once would discover the practice cannot serve them.
 *
 *  IT TRAVELS WITH THE FIGURE EVERYWHERE, and that is not a style rule. A published
 *  monthly fee with no stated limit beside it is where an unbounded expectation gets
 *  set, and it gets set harder at 400 than it ever did at 150. */
export const UPKEEP_INCLUDED_MINUTES = 60;

/** Travels with the fee for the reason FLOOR_QUALIFIER does: a monthly number
 *  without what it includes is a smaller commitment than the one being sold. */
export const UPKEEP_QUALIFIER =
  `That is the whole monthly price, and it includes ${UPKEEP_INCLUDED_MINUTES} minutes of changes a month. It does not roll forward, anything past it is quoted, and stopping it turns nothing off — what was built stays yours and keeps running.`;


/* ── WHAT A READ OF BROKEN SOFTWARE COSTS ──────────────────────────────────
   THE FIFTH PRODUCT, ADMITTED 2026-09-10 AGAINST THE TEST AT THE TOP OF THIS
   FILE, AND THE TEST IS GETTING HARDER TO PASS RATHER THAN EASIER. A business
   holding software somebody else built and broke buys none of the other four:
   no tool is fitted, no site is built, no assessment is booked, no retainer
   begins. The buyer is not even in the market for a build yet — they are trying
   to find out whether they own an asset or a liability. It passes.

   READ THE COUNT AS A WARNING ANYWAY. Five figures is where a price list starts
   looking like the menu pricingNotes says this site does not publish, and the
   defense is not the count — it is that each names a whole different product and
   none is a tier of another. THE NEXT ONE SHOULD BE REFUSED unless it is as
   obviously separate as this, and refusing it is what keeps the other five
   meaning anything.

   IT IS A FLAT PRICE AND A HARD CEILING ON THE WORK, which is the only reason it
   can be flat. Reading somebody else's broken software is unbounded work on an
   input nobody can inspect before quoting — the same problem that stops every
   seller in the spreadsheet-migration market publishing a number. The whole
   market's answer is the same one: fix the price of the READ, quote the repair
   afterwards. So the days are part of the product and live in the object below.

   WHY IT IS NOT FREE, WHICH SEVERAL SELLERS IN THIS CATEGORY OFFER. A free audit
   attracts somebody who wants a free opinion, and it prices the practice at the
   bottom of a band whose top is $500 anyway. More to the point, the deliverable
   here is a judgment a business will spend real money acting on, and nothing this
   practice gives away has that shape.

   THE ONE THING THIS MUST NEVER BECOME is a lead magnet for the rebuild. The
   honest answer is sometimes that the software is fine for another year, or that
   it cannot be saved and the money is gone — and a read whose author is paid only
   when it recommends a rebuild cannot credibly say either. The fee is what buys
   the ability to say them, which is the same argument the assessment's credit
   rests on, one product along. */

/** The whole price of a read of software this practice did not build.
 *
 *  THE HOURLY TEST, AND IT SITS HERE BECAUSE IT IS ABOUT THIS FIGURE. 500 against a
 *  HOURLY_USD of 125 pays for FOUR HOURS. Two weekday evenings in
 *  src/lib/consult-hours.js are four hours, which is why RESCUE_AUDIT_DAYS is two
 *  and not five: at five working days the same 500 is ten evening hours, about $50
 *  an hour, which is 40% of what the practice charges for an hour of out-of-scope
 *  work and half the $96 D81 already judged too low.
 *
 *  THIS ARGUMENT WAS WRITTEN ONE CONSTANT DOWN AND THE SWEEP CAUGHT THAT. It landed
 *  in RESCUE_AUDIT_DAYS' block on 2026-09-11, which is where the ceiling moved —
 *  correct reasoning attached to the wrong number, so a reader checking whether the
 *  FEE had been tested would have found nothing. The fee did not change: 500 is the
 *  top of the band this category publishes, so the time moved instead. */
export const RESCUE_AUDIT_USD = 500;

/** Working days from start to delivered answer. It is a CEILING rather than an
    estimate: at the end of it the answer is written from what was reached, and
    what was not reached is named. That is what makes the price safe to fix.

    IT WAS FIVE UNTIL 2026-09-11 AND THE FEE NEVER PAID FOR FIVE. This block
    argued 500 three ways -- where the market's band sits, why a free audit
    attracts the wrong buyer, and what the refusal buys -- and never ran the test
    the top of this file says every figure must pass. 500 at a HOURLY_USD of 125
    pays for FOUR HOURS. Two weekday evenings in src/lib/consult-hours.js are
    four hours, so two days lands exactly on the floor; five working days is ten
    evening hours against 500, which is about $50 an hour. D81 already corrected
    this same class once, at $96 an hour, and judged it too low.

    THE FEE DID NOT MOVE AND THAT WAS THE OPERATOR'S CALL, 2026-09-11. 500 is
    already the top of the band this category publishes, so raising it would make
    this the most expensive read in the market before there is one named client
    in it. The time moved instead.

    TWO DAYS IS SAFE FOR THE SAME REASON FIVE WAS, and the mechanism is already
    in `rescueAudit.ceiling`: the ceiling bounds the WORK and never the
    completeness, because what was not reached gets named rather than quietly
    left out. A hard read does not overrun, it arrives with its gaps printed. */
export const RESCUE_AUDIT_DAYS = 2;

/** Carries the ceiling and the refusal, because both change what is being sold.
    A flat fee with no time bound is an open engagement, and a read that cannot
    say "do not repair this" is a sales call with an invoice attached. */
export const RESCUE_AUDIT_QUALIFIER =
  `That is the whole price, answered inside ${RESCUE_AUDIT_DAYS} working days. Repair is quoted separately and only if it is worth doing — if it is not, the answer says so, and that answer is the thing you paid for.`;

/* ── WHAT A FACTORY TOOL STARTS AT, PER PLANT ─────────────────────────────────
   ADMITTED 2026-09-20 (D118) AND THE FOURTH-PRODUCT TEST WAS RUN RATHER THAN
   ASSUMED. A manufacturer buying a factory tool buys none of the others: no
   website is built, no shelf tool is fitted, no assessment is required first,
   and no rescue read applies, because nothing of ours is being repaired. The
   buyer is a planner or a materials lead at a plant, not a local owner who
   wants something built. It passes.

   A FLOOR, NEVER A QUOTE, AND PUBLISHED AS A FLOOR FOR AN HONEST REASON: there
   is no measurement under it yet. Nothing has been sold at it. The operator
   set it on 2026-09-20 with the credibility argument in front of him — a
   figure too low reads as a hobby to a plant that spends more than this on a
   consultant's week, and a floor is what a buyer compares against a quote —
   and the first plant sold is the first measurement, which this comment must
   then carry.

   THE HOURLY TEST, run on the shape rather than derived from it. Against
   HOURLY_USD (150) this is about sixty-seven hours, and a tool built to order
   on a real extract is more than that: the read of the extract comes first,
   the rules are the plant's own, and the handover is a hosted copy in their
   account plus the file that runs offline. The floor clears the deterrent
   rate with room, which is the test every figure in this file must pass.

   THE QUALIFIER TRAVELS WITH THE FIGURE for the reason FLOOR_QUALIFIER does. It
   says PER PLANT, because a second plant is a second extract and a second set
   of rules, and it says the price is agreed before anything starts, because
   the manufacturer page sells nothing by checkout. */

/** The published floor for a factory tool built to order, per plant, in whole
    US dollars. About sixty-seven hours at HOURLY_USD; the block above says why
    that is a check on the shape and not a derivation. */
export const INDUSTRIAL_TOOL_USD = 10000;

/** Travels with the figure. Half of it — the floor without "per plant" and
    without "agreed before" — is a different and worse offer. */
export const INDUSTRIAL_TOOL_QUALIFIER =
  'That is a floor per plant for a tool built to order on your own extract, never a quote. What yours costs is agreed before any work begins.';
