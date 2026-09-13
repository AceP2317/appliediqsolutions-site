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

/* ── THE AI FIT ASSESSMENT ─ ONE PRODUCT, TWO FORMS, TWO PRICES ─────────
   A FLAT PRICE, NOT A FLOOR, and the difference is the whole reason either can
   sit on a page beside one. The floor above says "you are in the right place"
   and settles nothing; these are the entire cost of the thing, so each is quoted
   as a fact rather than a starting point.

   THIS WAS ONE NUMBER, $1,000, FROM 2026-09-03 TO 2026-09-06. Three measured
   things moved it. The page promised "an hour" while the signed agreement
   committed to half a day or a day, and $1,000 covers the first and not the
   second. The operator's sit-down windows are weekday evenings and weekend
   mornings, when a business is either closed or at its busiest, so the visit
   barely fitted anybody. And a full $1,000 credit dropped every assessed
   engagement below the $125 floor engagement-rates.js says a fixed price has to
   clear -- roughly $96 an hour on the shelf path.

   THESE TWO NUMBERS ARE NOT A FOURTH PRODUCT, so the test above is untouched
   and still governs the next figure that wants publishing. This is one product
   in two forms. The count of published FIGURES went to four; the count of
   PRODUCTS stayed at three.

   AND THE WHOLE SHAPE RESTS ON ONE CONDITION: THE BUYER DOES NOT PICK. D81
   records this and the evidence behind it; D61 is what it reverses. D61
   refused a $750/$1,000 pair in September on the grounds that a buyer cannot
   judge what a visit is worth before having one, so nearly all take the cheaper
   and the better form never sells. That reasoning is correct and it assumes the
   buyer is choosing. Here the operator assigns the form on a rule PRINTED ON THE
   PAGE, so a reader can apply it to themselves before they make contact. That
   also settles D5: pricingNotes in src/data/services.ts defines a menu as one
   that "asks you to pick a version of yourself", and a buyer who never picks has
   not been handed one.

   SO A PAGE THAT LETS A VISITOR SELECT A FORM TURNS THIS INTO A MENU. Not a
   style slip -- the single argument holding it up. No radio, no pair of pay
   buttons, no two links differing only by price. scripts/verify-assessment.mjs
   asserts the absence, because that is the one part of this no comment can hold.

   WHY THEY ARE CREDITED. An assessment ending in a priced list of builds and NOT
   credited makes the build it recommends cost more than the same build bought
   directly. The document would then be arguing against its own recommendation,
   and a buyer does that arithmetic out loud. A fixed credit erases it on the
   video form entirely -- $750 paid, $750 back -- and leaves the on-site buyer
   paying for the one thing that was never a discount waiting to happen, which is
   half a day of somebody standing in their business.

   THE WINDOW IS QUOTE_VALID_DAYS AND THAT IS NOT A CONVENIENCE. The report ends
   in priced builds, which IS a quote, so the credit and the prices it rests on
   have to expire together. A credit outliving its prices means honoring a
   number the practice no longer stands behind. */

import { QUOTE_VALID_DAYS } from './house-terms.js';

/** Whole US dollars, formatted. Local rather than imported from
    src/data/services.ts, because that module imports THIS one and a .mjs gate
    has to be able to read these strings without pulling in TypeScript. */
const usd = (n) => `$${n.toLocaleString('en-US')}`;

/* HOW LONG EACH FORM RUNS, AS WORDS, and they are here because of the defect that
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

/** How long the in-business session runs, as a noun phrase: "half day". Written
    without its article so a sentence can say "a half day" or "the half day". */
export const ASSESSMENT_ONSITE_LENGTH = 'half day';

/** The whole price of an AI Fit Assessment done on video.
 *
 *  THE HOURLY TEST, NAMED RATHER THAN LEFT IN PROSE. Ninety minutes live plus the
 *  read and the written list is about four hours, so 750 is roughly $188 against a
 *  HOURLY_USD of 125. The block above records what happened when the CREDIT was a
 *  full $1,000: every assessed engagement dropped to roughly $96 an hour, below the
 *  floor, which is what D81 had to undo. That argument was already written there
 *  and did not name the constant, so no check could see it. */
export const ASSESSMENT_VIDEO_USD = 750;

/** The whole price of one done in the business, which is a half day plus the
    driving. About six hours of work against about nine and a half.
 *
 *  Against a HOURLY_USD of 125 those nine and a half hours make 1500 roughly $158
 *  an hour, which clears the floor — and the travel is why this form exists as a
 *  second figure rather than a surcharge on the first. */
export const ASSESSMENT_ONSITE_USD = 1500;

/** What comes off a build, the same amount whichever form was bought. It equals
    the video price on purpose: the credit covers the READ, which both forms
    deliver, and never the visit, which only one does.
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
  `That is the whole price, and all of it comes off whichever you go ahead with within ${QUOTE_VALID_DAYS} days — a build, or the first month of an advisory retainer.`;

/** The on-site half. It must say what is NOT credited, because a reader who
    assumes the whole fee comes back is being told a better offer than the one
    being sold. */
export const ASSESSMENT_ONSITE_QUALIFIER =
  `That is the whole price. ${usd(ASSESSMENT_CREDIT_USD)} of it comes off whichever you go ahead with within ${QUOTE_VALID_DAYS} days, a build or the first month of an advisory retainer — the written answer is credited, the ${ASSESSMENT_ONSITE_LENGTH} I spend in your business is not.`;


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


/* ── WHAT MONTHLY ADVISORY COSTS ───────────────────────────────────────────
   THE FOURTH PRODUCT, ADMITTED 2026-09-10 AGAINST THE TEST AT THE TOP OF THIS
   FILE. A company with no AI direction buys the judgment rather than the build.
   Nothing is delivered but a decision, which is why this is not a build price.

   IT IS A FLAT MONTHLY FEE AND NOT A FLOOR, for the same reason the assessment
   is flat: a floor says "you are in the right place" and settles nothing, and
   this has to settle something before a buyer will start a three-month
   commitment. Everything included is named in src/data/services.ts so the fee
   and what it buys cannot drift apart.

   THE NUMBER IS THE BOTTOM OF AN OBSERVED BAND, NOT A GUESS. The published
   market for fractional AI leadership sold to small and mid-size business sits
   at $4,000 to $8,000 a month for an advisory tier of roughly two days a month,
   with one seller publishing $7,500 and capping her roster at eight. 4000 is the
   bottom of that band because this practice has no named client in this line and
   the first one buys on a credential alone. RE-DERIVE IT AFTER TWO ENGAGEMENTS
   HAVE RUN THEIR COURSE and not before — a price raised on ambition rather than
   on a finished engagement is the shape D81 had to undo.

   IT ALSO CLEARS THE PRACTICE'S OWN HOURLY FLOOR, which is the test every figure
   here has to pass. Steady state is about six hours a month — three calls, the
   email in between, and a quarter of a written piece — so 4000 is roughly $660
   an hour against a HOURLY_USD of 125. THAT RATIO IS NOT A MARGIN AND READING IT
   AS ONE WOULD BE THE MISTAKE: the first month carries the roadmap and is far
   heavier than the eleven after it, and the whole arrangement is priced on the
   judgment rather than on the clock. If it is ever re-derived from hours it
   becomes consulting sold by the hour, which is the thing it exists not to be.

   THE MINIMUM TERM IS NOT A SALES TACTIC. A roadmap nobody is around to correct
   after thirty days is "an AI readiness audit whose deliverable is a document",
   which D61 refuses by name. Three months is what makes this not that. */

/** What one month of advisory costs, in whole US dollars. A flat fee. */
export const ADVISORY_MONTHLY_USD = 4000;

/** Months committed at the start. Below three this becomes the document D61
    refuses, so it is part of the product rather than a term of business. */
export const ADVISORY_MINIMUM_MONTHS = 3;

/** Travels with the figure for the reason FLOOR_QUALIFIER does, and it has to
    carry the minimum: a monthly number without its term is a smaller commitment
    than the one being sold, which is the same defect the on-site assessment
    qualifier exists to prevent. */
export const ADVISORY_QUALIFIER =
  `That is the whole monthly price, for a minimum of ${ADVISORY_MINIMUM_MONTHS} months. Nothing is built and nothing is licensed — you are buying the decision, and you can end it at the close of any month after that.`;


/* ── WHAT KNOWING WHETHER AN ASSISTANT NAMES YOU COSTS ─────────────────────
   THE SIXTH PUBLISHED FIGURE, AND D93'S STANDING WARNING SAID TO REFUSE IT UNLESS
   IT IS AS OBVIOUSLY SEPARATE AS THE FIFTH. The test was RUN rather than waved
   through, and the argument is written here because that is this file's rule.

   IT PASSES, AND HERE IS THE WORK. A business buying monthly visibility
   measurement buys none of the other six: no tool is fitted, no site is built, no
   assessment is booked, no retainer begins, no broken software is read, and there
   is nothing of ours to keep running — they may not be a client at all. It is not a
   tier of anything, which is the failure the test exists to catch and the defect
   that removed ladder rungs 5 and 6 on 2026-08-24. It is not even adjacent: every
   other figure here prices something BUILT or something READ about software, and
   this prices a reading about the outside world.

   THE OPERATOR OVERRODE A RECOMMENDATION TO BUILD IT AND THAT IS RECORDED RATHER
   THAN SOFTENED. He was shown two costs before choosing: that this is the sixth
   figure D93 says to turn down, and that the plan which proposed it said to gather
   three months of real data before charging anybody. He chose to publish now. On
   inspection the first objection does not survive — D94 resolved the count problem
   by PLACEMENT, each product on its own page with /services/ accepting no further
   panels, and this page is its own. The second stands and is answered on the page
   itself rather than buried: the METHOD is published, no result is claimed, and
   nothing on it implies a reading that has not been taken.

   WHAT THE NUMBER RESTS ON. Two firms in Eastern North Carolina already claim this
   category and neither publishes a methodology, and the local floor for the nearest
   named service sits near $797. 300 sits well below that deliberately, because the
   thing being sold is the honesty rather than the capability and a premium price on
   an unproven method would be the opposite of the argument.

   IT CLEARS THE PRACTICE'S OWN HOURLY FLOOR, which is the test every figure here
   has to pass and the one the rescue audit skipped. Steady state is about an hour a
   month — the questions asked, the answers recorded, the report written — so 300 is
   roughly $300 an hour against a HOURLY_USD of 125. RE-DERIVE IT AFTER THREE
   MONTHS HAVE ACTUALLY RUN, because an hour a month is an estimate of work nobody
   has done twice yet.

   AND IT DEPENDS ON NO THIRD PARTY, which was the operator's own call against the
   plan. The plan priced this after a $99 tool it never named, in any file, so the
   margin rested on a dependency nobody had opened — the shape D58a already cost
   this practice once. src/lib/assistant-visibility.js reaches nothing instead. */

/** What one month of visibility measurement costs, in whole US dollars. A flat
 *  fee rather than a floor, for the reason the assessment is flat: a floor settles
 *  nothing, and a monthly arrangement has to settle something before it starts. */
export const VISIBILITY_MONTHLY_USD = 300;

/** Travels with the figure. It carries the REFUSAL rather than the inclusions,
 *  because what this does not claim is the only thing separating it from two
 *  competitors who publish no method at all. */
export const VISIBILITY_QUALIFIER =
  `That is the whole monthly price, with no minimum term — stop it at the end of any month. What you get is what changed and how it was measured; what you never get is a claim about what caused it, because no method exists that shows one.`;


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
