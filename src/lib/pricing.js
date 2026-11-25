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
   and its buyer has nothing of ours. Advisory left with D118, so the two no longer
   sit one import apart.

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
   bugs. Its hand-typed copy of FLOOR_USD SHOULD break when this number moves.
   That failure is the alarm telling a human to re-verify the payback copy.

   ── D126, 2026-09-27: THE LOCAL FIGURES CAME DOWN, ON PURPOSE AND TOGETHER ──
   The practice is a side business worked in the evenings (D124), and the
   operator set the local prices to what the one founding client already pays
   after launch, with a build price chosen rather than copied because that
   client's build is free. FLOOR_USD, WEBSITE_USD, the assessment and upkeep all
   moved on the same day and each block below says why its own number did. The
   ladder they make is the argument: a second tool fitted into a site built here
   (engagement-rates.js), then a tool on its own, then a whole site, each step up
   being more work. Nothing on the factory side moved.
   ============================================================================ */

/** The published floor for one tool fitted to a business, in whole US dollars. A
 *  floor, never a quote.
 *
 *  MOVED 2500 -> 1300 ON 2026-09-27 (D126), AND WEBSITE_USD IS WHY. The standard
 *  website dropped to 2500 and includes one fitted tool, so a tool on its own at
 *  the same figure would have cost exactly what a whole site with that tool built
 *  in costs. The operator set 1300, which sits between a second tool fitted into a
 *  site already built here (800 later in year one) and a whole site.
 *
 *  hourly-ok: A FLOOR HAS NO HOURS TO DIVIDE BY, and that is the difference between
 *  this number and every other one in this file. It says "you are in the right
 *  place" and settles nothing else, so the hourly test is applied to the QUOTE that
 *  follows it, job by job, where the hours are actually known. Dividing 1300 by an
 *  invented average would produce a figure that looks like the test having been run
 *  and would be the thing this file refuses everywhere else. A fitting has never
 *  been timed end to end; the first one timed is the first number this can be
 *  checked against. */
export const FLOOR_USD = 1300;

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
 *  read and the written list is about four hours, so 500 is roughly $125 an hour
 *  against a HOURLY_USD of 150. That is under the deterrent rate on purpose, like
 *  every fixed price here, and above the roughly $100 an hour a standard website
 *  build earns at WEBSITE_USD, so the read is never the cheapest hour sold.
 *
 *  MOVED 750 -> 500 ON 2026-09-27 (D126). At 750 against a 2500 website the read
 *  cost a local owner close to a third of the build before the build started. 500
 *  also matches RESCUE_AUDIT_USD, so both reads cost the same. The block above
 *  records what happened when the CREDIT was a full $1,000 against a smaller fee:
 *  every assessed engagement dropped below the floor, which is what D81 undid. */
export const ASSESSMENT_VIDEO_USD = 500;

/** What comes off a build. It equals the price on purpose: with one form the
    whole fee is the read, and the read is what is credited.
 *
 *  hourly-ok: nothing is SOLD at this figure, so there are no hours to divide by.
 *  It is a deduction from another price, and the hourly test that matters about it
 *  is the one on what it leaves behind. An assessed website brings in 2500 in all
 *  for about 29 hours, the read's four plus the build's untimed 25, which is about
 *  $86 an hour. That clears PRICE_REVIEW_HOURLY_USD in engagement-rates.js, the
 *  line below which the operator re-prices. */
export const ASSESSMENT_CREDIT_USD = 500;

/** Travels with its figure for the same reason FLOOR_QUALIFIER does: the price
    and what happens to it are one statement, and half of it is a different and
    worse offer. */
export const ASSESSMENT_VIDEO_QUALIFIER =
  `That is the whole price, and all of it comes off a build you go ahead with within ${QUOTE_VALID_DAYS} days.`;


/* ── WHAT A WEBSITE BUILD STARTS AT ────────────────────────────────────────
   A SECOND FLOOR, AND IT STAYS ABOVE THE FIRST. FLOOR_USD is the smallest thing
   sold, one shelf tool fitted to a business, and its job is telling a reader
   whether they are in the same world before anything is scoped. A website build
   is that fitting PLUS the pages, sender records so their mail is not junked, a
   search listing, two policy pages, a payment link and a handover with the
   access test actually run. So this figure must always sit above FLOOR_USD, and
   D126 moved FLOOR_USD down rather than let the two meet.

   D126, 2026-09-27: 4500 -> 2500, AND THE BUILD GOT SMALLER WITH IT. The standard
   build is now the founding client's size: three pages and one round of changes
   (PAGE_CEILING and REVISION_ROUNDS in engagement-rates.js), due 30 days after
   kickoff, with the same seven inclusions. The operator chose the figure over
   3000 and 3500, knowing the arithmetic below, because the practice is a side
   business and the first buyers are neighbors. A fourth and fifth page cost
   EXTRA_PAGE_YEAR_ONE_USD each in the first year, which is how a bigger site is
   bought without a second tier here.

   THE HOURLY TEST. HOURLY_USD (150) is a deterrent set above what fixed-price
   work earns, so that asking by the hour never beats agreeing a scope. A
   three-page build is about 25 hours on an estimate nobody has timed — the old
   35 hours for five pages, less two pages at three to four hours each and one
   round. 2500 over 25 is about $100 an hour, under the deterrent, so the fence
   holds with room. The line below which this figure is re-priced is
   PRICE_REVIEW_HOURLY_USD in engagement-rates.js: $75 an hour, which is 33 hours.

   THE ESTIMATE HAS NO MEASUREMENT BEHIND IT AND PUBLISHING IT DOES NOT CHANGE
   THAT. TIME THE NEXT BUILD -- kickoff to acceptance, including the waiting --
   and record it in the rate card's "Checking the price is right". It is
   published as a floor because a floor survives being an underestimate and a
   quote does not. */

/** The published floor for a website build, in whole US dollars. */
export const WEBSITE_USD = 2500;

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

   THE COLLISION MOVED WITH THE FEE ON 2026-09-27 (D126) AND DID NOT GO AWAY.
   Until then upkeep was 400 and shared its value with EXTRA_PAGE_USD, a rate a
   prospect may not read. It is now 150 and shares its value with HOURLY_USD,
   which a prospect may not read either. So the client-facing comparison sheet
   still cannot print the upkeep figure: scripts/make-compare-pdf.mjs keeps the
   hourly rate on its leak list, and no string-level guard can separate a
   published $150 from an unpublished one. The operator's call from 2026-09-11
   stands: leave that sheet without the figure rather than narrow a guard on his
   hourly rate or move a real price to suit a checker. Every page that shows the
   fee interpolates it, which is the only form the scanner in check-dist.mjs
   accepts. */

/** Monthly upkeep, in whole US dollars — the light monthly touch already promised
 *  on /websites/ and /main-street/: small fixes and changes as they come up.
 *
 *  D126, 2026-09-27: 400 -> 150, THE FOUNDING CLIENT'S FIGURE MADE EVERYONE'S. It
 *  was 150 once before, until 2026-09-10, and went to 400 on a market argument: ten
 *  to twenty per cent of project value a month, and owners in public calling $379
 *  fair. That argument is still true of the market and is not what sets this now.
 *  The practice is a side business (D124), the buyers are neighbors, and the
 *  operator made what the founding client pays after launch the standard. At 150
 *  against a 2500 build this is six per cent a month, below the market band on
 *  purpose.
 *
 *  THE HOURLY TEST, AND WHY THE MINUTES MOVED WITH IT. HOURLY_USD is also 150, so a
 *  full hour included would make the retainer cost exactly what calling by the hour
 *  costs, and a retainer with no band between the two is not a product: neither
 *  side has a reason to prefer it. At 45 minutes the worst case is $200 an hour for
 *  the practice against $112.50 of work bought by the hour, so the client pays about
 *  $37 a month for not having to ask. That is the same fix the founding figure got
 *  on 2026-09-12, moved by the minutes rather than the fee.
 *
 *  THE CAP IS HALF THE PRODUCT, and at a lower fee it matters more rather than less.
 *
 *  It is a SERVICE SUBSCRIPTION and never a license. Cancel it and everything keeps
 *  running unchanged in the client's own accounts — see docs/ownership-delivery.md
 *  section 8, which is what keeps "no subscription, no lock-in" true on the public
 *  pages alongside recurring revenue. */
export const UPKEEP_MONTHLY_USD = 150;

/** Minutes of changes included in a month of upkeep, before MIN_BILLING_MINUTES
 *  and HOURLY_USD in engagement-rates.js take over.
 *
 *  IT EXISTS BECAUSE THE WORDS ALONE HAVE NO EDGE. "Small fixes and changes as they
 *  arise" is four documents' wording for something with no stated limit, and every
 *  individual request under it is reasonable — which is exactly how an open retainer
 *  is built, one yes at a time. The bound has to be a number, because a judgment
 *  call made monthly is a negotiation held monthly.
 *
 *  FORTY-FIVE SINCE D126, and the block above says why it is not sixty: at the same
 *  150 as the hourly rate, sixty minutes leaves no band and no product.
 *
 *  IT DOES NOT ROLL FORWARD. An unused month that banks is a liability growing
 *  quietly against a fixed number of evening hours, and the first client to spend
 *  half a year of banked minutes at once would discover the practice cannot serve
 *  them.
 *
 *  IT TRAVELS WITH THE FIGURE EVERYWHERE, and that is not a style rule. A published
 *  monthly fee with no stated limit beside it is where an unbounded expectation gets
 *  set. */
export const UPKEEP_INCLUDED_MINUTES = 45;

/** Months after delivery before the first upkeep charge falls. Since D126 the
 *  standard, and the founding client's before that.
 *
 *  A START DATE, NOT FREE MONTHS OF A RUNNING ARRANGEMENT. The arrangement is signed
 *  at delivery with the payment method set up then, and the first charge falls
 *  afterwards. The reason is the work, and it is true of any build rather than of
 *  one client: the first months after a launch go mostly on correcting the
 *  practice's own work, which is not work a client should pay for. */
export const UPKEEP_FREE_MONTHS = 3;

/** Travels with the fee for the reason FLOOR_QUALIFIER does: a monthly number
 *  without what it includes is a smaller commitment than the one being sold. */
export const UPKEEP_QUALIFIER =
  `That is the whole monthly price, and it includes ${UPKEEP_INCLUDED_MINUTES} minutes of changes a month. Unused minutes do not roll forward, anything past them is quoted, and stopping it turns nothing off — what was built stays yours and keeps running. Nothing is charged for the first ${UPKEEP_FREE_MONTHS} months after your site goes live.`;


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
   figure too low reads as a hobby, and a floor is what a buyer compares against
   a quote — and the first plant sold is the first measurement, which this
   comment must then carry.

   WHAT IT SITS BESIDE, READ 2026-09-27 WHEN HE ASKED IF IT WAS TOO HIGH, and
   registered in src/data/external-claims.js. At or below every alternative a
   plant would set it against: one year of the cheapest named planning product
   read ($900 a month, netstock-starting-price), the bottom of the common custom
   software project range ($10,000–$49,999, clutch-custom-software-range), and
   57 to 74 hours of a senior SAP functional contractor ($135–$175 an hour,
   sap-functional-contract-rate). Above only the four featured Upwork
   supply-chain profiles ($20–$49 an hour), which sell to a different buyer.
   THIS SENTENCE SAID a plant "spends more than this on a consultant's week"
   until that day; at the contractor band a week is $5,400 to $7,000, so the
   reason was wrong even where the figure is not.

   THE HOURLY TEST, run on the shape rather than derived from it. Against
   HOURLY_USD (150) this is about sixty-seven hours, and a tool built to order
   on a real extract is likely more than that: the read of the extract comes
   first, the rules are the plant's own, and the handover is a hosted copy in
   their account plus the file that runs offline. So its effective rate sits at
   or below the deterrent, which is the fence every fixed price here must keep,
   and at 133 hours it reaches PRICE_REVIEW_HOURLY_USD, the line that reopens it.

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
