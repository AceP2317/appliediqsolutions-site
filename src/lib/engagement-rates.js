/* ============================================================================
   THE STANDING FIGURES ON CLIENT PAPER — held once, never published.

   ── WHY THIS IS NOT src/lib/pricing.js ───────────────────────────────────────

   That module holds the numbers this site RENDERS -- as of 2026-09-03 the build
   floor, the AI Fit Assessment and the website floor. Everything here is the
   opposite kind of figure. These reach exactly one
   audience — somebody holding a signed scope document — and a gate in
   scripts/check-dist.mjs refuses any of them appearing in a built page. Putting
   them beside FLOOR_USD would put a published figure and an unpublished one in
   the same import, one edit away from a page rendering the wrong one.

   WEBSITE_BUILD_START_USD LIVED HERE UNTIL 2026-09-03 and is now WEBSITE_USD in
   src/lib/pricing.js. It was published, so it changed file rather than gaining an
   exemption -- an exempted constant here would sit one import away from every
   figure that must never reach a page, which is the hazard this split exists to
   prevent. Do not move it back; move the DECISION first.

   Not src/lib/rate-card.js either: that name is already an arithmetic engine
   serving four tools on the shelf, and a second meaning for it would be read
   wrong by the next person in this directory.

   ── THE DIRECTION OF ENFORCEMENT ─────────────────────────────────────────────

   Same as src/lib/house-terms.js, and for the same reason. A signed document is
   prose and cannot interpolate a value, so the documents state each number in
   words and scripts/check-paperwork.mjs refuses any document stating a
   different one. The rate card at docs/engagement/reference/rate-card.md carried
   every one of these as an empty [FILL: ] field until 2026-08-30, which meant
   there was no number to disagree with and no way to notice.
   ============================================================================ */

/* ── WHAT A LATER HOUR COSTS ─────────────────────────────────────────────── */

/** Hourly rate for work outside an agreed scope, and for anything after the
 *  warranty window closes. In whole US dollars.
 *
 *  THE FLOOR UNDER THIS NUMBER IS NOT A MARKET RATE, it is the practice's own
 *  effective rate. Since D126 (2026-09-27) a standard website build is three pages
 *  and about 25 hours on an untimed estimate, and at WEBSITE_USD in
 *  src/lib/pricing.js that fixed price earns about $100 an hour. THIS NUMBER MUST
 *  SIT ABOVE THAT, and the direction is the whole point: price hourly work BELOW
 *  the effective build rate and a client works out that asking by the hour costs
 *  less than agreeing a scope — at which point the fixed-price model every
 *  agreement in the set rests on quietly stops holding, without anyone deciding
 *  to abandon it. D126 lowered the build and left this alone, so the fence now
 *  has half again the room it had.
 *
 *  THE PARAGRAPHS BELOW ARE THE HISTORY OF THIS NUMBER UNDER THE OLD $4,500 BUILD,
 *  and their arithmetic is about that build rather than today's.
 *
 *  RAISED 125 -> 150 ON 2026-09-12, AND THE OLD COMMENT ARGUED AGAINST ITSELF IN
 *  TWO CONSECUTIVE SENTENCES. It said $129 sitting "just above this number" was
 *  "the relationship that has to hold", and then said pricing hourly below the
 *  build rate breaks the model. Both cannot be true: at 125 the hourly WAS below
 *  the $128.57 build rate, so ten hours bought hourly cost $1,250 against $1,286
 *  scoped, and the cheaper route for a client was the one that dissolves the
 *  fixed price. The fence was on the wrong side of the thing it was fencing.
 *
 *  THE MARGIN WAS ALSO 3 PER CENT ON AN ESTIMATE NOTHING HAS MEASURED. $128.57
 *  assumes 35 hours, and docs/engagement/reference/rate-card.md records that no
 *  build here has ever been timed end to end. At 40 hours the build earns $112
 *  and the relationship inverts without anything changing. 150 clears the
 *  estimate with room for it to be wrong.
 *
 *  IT COLLIDES WITH UPKEEP_MONTHLY_USD AND FOUNDING_UPKEEP_USD, both also 150 since
 *  D126, and that is a real cost accepted rather than overlooked. On every rate
 *  sheet "$150" appears as both the monthly fee and the hourly rate. Every check
 *  that reads either keys on the words around it and never on the integer.
 *
 *  THIS SENTENCE SAID "at FLOOR_USD ... fifteen to twenty-five hours" until
 *  2026-09-03, an estimate D55 had already retired: at the build floor those 35
 *  hours earn $71, so the argument was resting on a figure that made it false.
 *  House rule 4 already says a change order states a fixed price and never a
 *  rate; this is the number for what is too small to be one. */
export const HOURLY_USD = 150;

/** The smallest unit billed at that rate, in minutes. Anything shorter is not
 *  invoiced at all. Billing in six-minute units is what law firms do and it
 *  makes a client count every question they ask, which is the opposite of the
 *  relationship this practice is built on. */
export const MIN_BILLING_MINUTES = 30;

/** The effective hourly rate below which a published price is re-derived, in
 *  whole US dollars. The operator's line, set 2026-09-27 with D126.
 *
 *  EVERY PRICE HERE RESTS ON HOURS NOBODY HAS TIMED, and this is what turns the
 *  first timing into a decision instead of a note. After each build is handed
 *  over, its fee and honest hours go into "Checking the price is right" in
 *  docs/engagement/reference/rate-card.md. A build that earned under this figure
 *  reopens its price with a real number under it.
 *
 *  AT WEBSITE_USD THIS IS 33 HOURS, which leaves room for the 25-hour estimate to
 *  be wrong by a third before anything moves. A trigger set at the estimate itself
 *  would reopen the price on one slow client; one set at half would let the
 *  practice work at half its planned rate for a long time without anything saying
 *  so. It is not a rate anybody is charged, so no page or document may quote it to
 *  a client. */
export const PRICE_REVIEW_HOURLY_USD = 75;

/* ── WHAT A MONTH COSTS — MOVED OUT ──────────────────────────────────────────
   UPKEEP_MONTHLY_USD AND UPKEEP_INCLUDED_MINUTES LEFT THIS FILE ON 2026-09-11
   AND ARE NOW IN src/lib/pricing.js. The operator decided to publish the fee, so
   they changed file rather than gaining an exemption here — exactly the route
   WEBSITE_BUILD_START_USD took on 2026-09-03, and for the reason this file's own
   header gives: an exempted constant here would sit one import away from every
   figure that must never reach a page, which is the hazard the split exists to
   prevent. Do not move them back; move the DECISION first.

   ONE THING DID NOT MOVE WITH THEM AND IT MATTERS. EXTRA_PAGE_USD below is also
   400, so the two figures share a value. That means the client-facing comparison
   sheet STILL refuses a literal "$400": scripts/make-compare-pdf.mjs keeps the
   per-page rate on its leak list, and no string-level guard can tell a published
   $400 from an unpublished one. Measured rather than assumed on 2026-09-11 —
   upkeep was removed from that list, an upkeep line was planted on the client
   sheet, and the build still refused, naming the per-page figure. The operator's
   call was to leave the sheet without the figure rather than narrow the guard or
   move a real price to suit a checker.
   THE REASONING MOVED WITH THE CONSTANTS rather than being copied here. Why 400
   and not 150, why the cap is not optional, and why sixty minutes — all of it is
   in pricing.js beside the numbers it explains. A commented-out copy in this file
   would be a second writer for one fact, which is the class L-093 names.
   ────────────────────────────────────────────────────────────────────────────── */


/* ── WHAT MORE OF THE SAME COSTS ─────────────────────────────────────────── */

/** One page beyond the ceiling, in whole US dollars.
 *
 *  A page is not a layout. It is words placed, pictures sized and cut, links
 *  wired, its own preview picture for when the page is shared, an entry in the
 *  file that tells search engines the page exists, and it has to pass every
 *  check the rest of the site passes. That is three to four hours honestly
 *  counted. Priced under about three hundred it becomes cheaper for a client to
 *  ask than for the practice to build, which is how a fixed price becomes an
 *  open one page at a time.
 *
 *  ── IT DOES NOT CLEAR HOURLY_USD, THE OPERATOR KNOWS, AND 400 STANDS ────────
 *  DECIDED 2026-09-12 WITH THE ARITHMETIC STATED. At the three to four hours
 *  above this earns $133 to $100 an hour against a $150 hourly, so a client
 *  wanting a page always prefers the flat price -- $400 against $525 of metered
 *  work -- and the fixed price pays the practice least. That is the same
 *  fence-inversion HOURLY_USD was raised to fix, one product along, and it was
 *  already true at the old $125 hourly: this figure has never cleared.
 *
 *  THE CEILING IS 450 AND IT IS THE OPERATOR'S OWN NUMBER. Clearing $150 an hour
 *  on a 3.5-hour page would take about $550, and he will not go there. A page
 *  price is a number a client reads and reacts to, where being obviously fair
 *  beats being optimally priced -- the same call D90 records for the monthly
 *  fee. The margin lost is on an occasional job; the goodwill is on every quote.
 *
 *  DO NOT RAISE THIS AGAIN WITHOUT A MEASUREMENT. It was put to him twice on
 *  2026-09-12 and settled both times. The three-to-four hours has never been
 *  timed -- nothing in this practice has -- so the honest way to reopen it is to
 *  time a real page end to end and bring a number, not an estimate.
 *  ponytail: unmeasured hours; upgrade path is to time one page and re-derive. */
export const EXTRA_PAGE_USD = 400;

/* ── HOW BIG A BUILD IS ──────────────────────────────────────────────────── */

/** Pages included in a paid website build at the published floor. Home, about or
 *  services, and contact — the three a small business actually needs.
 *
 *  FIVE UNTIL D126 (2026-09-27), THREE SINCE, and the smaller build is what makes
 *  the lower price honest rather than a discount. The standard build is now the
 *  founding client's size, and a fourth or fifth page is EXTRA_PAGE_YEAR_ONE_USD
 *  inside the first year.
 *
 *  THIS IS THE ONLY LEVER HOLDING THE FLOOR. A build at that price includes
 *  sender records, a search listing, two policy pages and one working tool
 *  before a single page is designed. Without a written ceiling the size of a
 *  job is decided later by whoever argues hardest, which house rule 2 names as
 *  the exact shape every scope argument takes. */
export const PAGE_CEILING = 3;

/** Rounds of changes included, on a paid build. A round is one consolidated set
 *  of changes, collected and sent at once. Counting individual requests instead
 *  turns every message into a negotiation about whether it counted. Two until
 *  D126, one since, matching the founding build.
 *
 *  src/lib/capabilities.js imports this and PAGE_CEILING to word a published line;
 *  counts may reach a page, the dollar figures in this module may not.
 *
 *  HOW LONG A BUILD TAKES IS NOT HERE. BUILD_DAYS lives in src/lib/build-slots.js,
 *  beside the rule the public slot display computes from. */
export const REVISION_ROUNDS = 1;

/* ── WHAT A PAYING CLIENT PAYS AFTERWARDS, SINCE D126 ─────────────────────────
 * THE FOUNDING CLIENT'S FIGURES BECAME THE STANDARD ON 2026-09-27. Until then a
 * paying client added a page at EXTRA_PAGE_USD from day one and a second tool was
 * quoted from FLOOR_USD. The operator made the founding shape everyone's, and the
 * reason the founding figures gave still holds for any build done here: a page or
 * a tool added to a site this practice built last month, with the code to hand
 * and the accounts already granted, is not the same work as the same thing added
 * to a site it has never seen.
 *
 * THE FOUNDING_* CONSTANTS BELOW STAY SEPARATE, and every price among them equals
 * these. Only the free months differ, six against three, by the operator's revisit
 * the same day. Keeping them separate is what lets a founding term move without
 * touching the standard, and scripts/check-client-pack.mjs refuses a founding pack
 * whose terms are no better than these.
 *
 * NONE OF THESE IS PUBLISHED. A price a client reads only in a signed Scope is
 * not a tier a visitor can pick. */

/** Months the monthly upkeep fee is held from the FIRST CHARGE. retainer-agreement.md
 *  §5 already promised twelve to every retainer client; it is written here so the
 *  paid Scope and Statement of Work, which now state it, are held to one number. */
export const RATE_HOLD_MONTHS = 12;

/** One page beyond PAGE_CEILING inside the first year, in whole US dollars.
 *
 *  THE BREAK-EVEN IS ONE AND TWO-THIRDS HOURS against HOURLY_USD, where the
 *  EXTRA_PAGE_USD note above counts a page at three to four hours. So this is a
 *  deliberate loss on a page that takes the full time, accepted by the operator
 *  with the arithmetic stated, as it was for the founding figure. It survives
 *  because a page added to a three-page site built here last month is quicker than
 *  one added cold, and because it is how a four- or five-page site is bought
 *  without a second price on the website page. */
export const EXTRA_PAGE_YEAR_ONE_USD = 250;

/** Months from DELIVERY that the reduced page price runs, after which
 *  EXTRA_PAGE_USD applies. From delivery because that is the date a client
 *  associates with the site. */
export const EXTRA_PAGE_YEAR_ONE_MONTHS = 12;

/** A second tool fitted into a site built here, inside the early window, in
 *  whole US dollars. 400 at HOURLY_USD buys 2.7 hours.
 *  ponytail: no fitting has been timed, so this and the next are unmeasured.
 *  Upgrade path: time the first fitting end to end and re-derive both through the
 *  rate card's "Checking the price is right".
 *  hourly-ok: the break-even is stated; the operator accepted it, as for the
 *  founding figure it copies. */
export const TOOL_ADD_EARLY_USD = 400;

/** Months from delivery during which TOOL_ADD_EARLY_USD applies. Equal to
 *  UPKEEP_FREE_MONTHS in pricing.js on purpose, so a client meets ONE early
 *  window: the free months and the cheap-tool months are the same three. */
export const TOOL_ADD_EARLY_MONTHS = 3;

/** A second tool fitted in after the early window but inside the first year.
 *  800 at HOURLY_USD buys 5.3 hours. It sits below FLOOR_USD, a tool on its own,
 *  because a site built here already carries the hosting and the handover a
 *  tool on its own has to build from nothing. */
export const TOOL_ADD_YEAR_ONE_USD = 800;

/** Months from delivery after which a second tool is quoted like any other job.
 *  Equal to EXTRA_PAGE_YEAR_ONE_MONTHS so the first year ends on ONE date. */
export const TOOL_ADD_WINDOW_MONTHS = 12;

/* ── HOW BIG A FREE BUILD IS ─────────────────────────────────────────────── */

/** Pages included in a founding build. Smaller than a paid one until D126 made
 *  the paid build the same size; D35's cap exists because an uncapped free offer
 *  fills every spare hour with unpaid work while paid work waits. */
export const FOUNDING_PAGE_CEILING = 3;

/** Rounds of changes included on a founding build. */
export const FOUNDING_REVISION_ROUNDS = 1;

/** Days from kickoff after which a founding build closes in whatever state it
 *  has reached.
 *
 *  A FREE BUILD WITH NO END DATE ENDS ONLY WHEN SOMEBODY DECIDES TO STOP, and
 *  that decision always costs the relationship it was meant to build. This
 *  window is deliberately shorter than the 60 days in
 *  docs/engagement/agreements/founding-build-agreement.md section 4, which is
 *  the point at which either party may walk away entirely — closing is not
 *  walking away, and the two need different numbers. */
export const FOUNDING_CLOSE_DAYS = 45;

/* ── WHAT A FOUNDING CLIENT PAYS AFTERWARDS ──────────────────────────────── */

/* SINCE D126 (2026-09-27) EVERY PRICE IN THIS BLOCK EQUALS THE STANDARD ONE
 * ABOVE, because the standard was set to these. The operator's revisit the same
 * day kept them equal and moved one term instead: FOUNDING_UPKEEP_FREE_MONTHS is
 * six against everyone's three. scripts/check-client-pack.mjs refuses a founding
 * pack whose terms are no better than the standard, so the paperwork's "these cost
 * less" is checked rather than remembered. The history below is about the
 * standard as it was before D126, $400 a month and $400 a page.
 *
 * THESE FIVE EXIST BECAUSE A FREE BUILD USED TO END AT FULL RETAIL. Until
 * 2026-09-12, section 6 of founding-website-scope.md and section 9a of
 * founding-build-agreement.md quoted a founding client the same figures a
 * stranger pays. A neighbor who was given something and is then quoted the
 * rack rate does not argue; they go quiet, and the recurring income the free
 * build was meant to earn never arrives.
 *
 * THE BASIS IS THE WORK AND NEVER GOODWILL RETURNED, and that distinction is
 * load-bearing rather than decorative. Section 12 of founding-build-agreement.md
 * makes it a TERM that no review, rating, testimonial, endorsement or referral
 * is consideration for a founding build, and the free-build-review rule in
 * scripts/check-paperwork.mjs refuses any document framing one as such. So the
 * reduction cannot be bought with exposure. What justifies it is that a
 * three-page site the practice built itself costs less to keep than a
 * five-page one it inherited, and that the first months after launch are spent
 * mostly correcting its own work.
 *
 * NONE OF THESE IS PUBLISHED, which is the whole reason they live here rather
 * than in src/lib/pricing.js. src/data/services.ts renders the sentence "Every
 * number on this site is the whole price of a different product rather than a
 * tier of the same one" -- a second published price for upkeep would make that
 * copy false. A private rate reaching only somebody holding a signed document
 * is not a tier a visitor can pick, so the published sentence stays true. The
 * file boundary IS the enforcement; see the header of pricing.js. */

/** What a founding client pays a month for upkeep, in whole US dollars.
 *
 *  Against FOUNDING_UPKEEP_MINUTES below, the worst case is $200 an hour, which
 *  clears HOURLY_USD by a third.
 *
 *  IT DID NOT, FOR ABOUT AN HOUR ON 2026-09-12, AND THE FAULT IS WORTH KEEPING.
 *  This fee was set at 150 with sixty included minutes while HOURLY_USD was 125,
 *  which left a fifth of the fee as margin. The hourly then moved to 150 and the
 *  two figures MET: a client using the full hour paid exactly what calling
 *  ad-hoc would have cost.
 *
 *  THE PROBLEM WAS NOT THIN MARGIN, IT WAS THAT THE PRODUCT LOST ITS REASON TO
 *  EXIST. At parity the client has no reason to prefer a retainer over calling,
 *  and the practice has no reason to sell one. A retainer is only a product
 *  where there is a BAND between what it costs and what the same work costs
 *  ad-hoc -- the client buys not having to ask, and the practice buys a floor
 *  under a quiet month. No band, no product.
 *
 *  FIXED BY THE MINUTES AND NOT THE FEE, deliberately. 150 is the number a
 *  neighbor reads and remembers; the minutes are the half that costs time rather
 *  than the half a client judges the offer by. 45 minutes at 150 is $200 an hour
 *  against $112.50 of ad-hoc work, so the client pays about $37 for the
 *  certainty and the band is real again. Nothing had been sent when this moved,
 *  which is the only reason it was free to do -- after a send it would have cost
 *  credibility instead.
 *
 *  The published figure was $400 until D126 made it this one, so for now the
 *  founding fee is no discount at all; the revisit that follows D126 moves it. */
export const FOUNDING_UPKEEP_USD = 150;

/** Minutes of changes included in a founding month. Smaller than the sixty in
 *  UPKEEP_INCLUDED_MINUTES (src/lib/pricing.js) on purpose.
 *
 *  THIS IS THE LEVER THAT KEEPS THE FOUNDING RETAINER A PRODUCT. See the note
 *  above: at sixty minutes the fee equalled one hour at HOURLY_USD and neither
 *  side had a reason to prefer the arrangement to a phone call. Moving the
 *  minutes rather than the fee restores the band without touching a figure a
 *  client reads as a price.
 *
 *  IT DOES NOT ROLL FORWARD, for the reason D90 gives about the paid cap: the
 *  cap is half the decision, and minutes that accumulate turn a standing
 *  availability into a bank of owed work. */
export const FOUNDING_UPKEEP_MINUTES = 45;

/** Months after delivery before the first upkeep charge falls, for a founding
 *  client. SIX SINCE 2026-09-27, THE REVISIT THAT FOLLOWED D126.
 *
 *  D126 set the standard to every founding figure, so for a few hours the founding
 *  terms were no better than anybody's and the paperwork saying so was false. The
 *  operator was shown four ways back — six free months at the same prices, a
 *  little off every price, lower upkeep alone, or rewording the paperwork to say
 *  equal — and chose six months: every price stays one he publishes, so there is
 *  no private rate, and only the start date differs. The reason written into the
 *  paperwork is the work: the months after one of the practice's first launches go
 *  on correcting its own work more than any later one will. UPKEEP_FREE_MONTHS in
 *  pricing.js is everyone else's three.
 *
 *  A START DATE, not free months of a running arrangement. The
 *  arrangement is signed at delivery with the payment method set up then, and
 *  the first charge falls afterwards. Collecting card details from a neighbor
 *  three months after handover is the moment the relationship goes quiet, so
 *  the gap sits before the first charge rather than before the signature. */
export const FOUNDING_UPKEEP_FREE_MONTHS = 6;

/** Months the founding monthly fee is held from the FIRST CHARGE.
 *
 *  Twelve is also what section 5 of retainer-agreement.md already promises
 *  every retainer client, so this length is not itself a founding benefit and
 *  was chosen knowing that. The free months and the rate carry the offer. */
export const FOUNDING_RATE_HOLD_MONTHS = 12;

/** One page beyond the founding ceiling, in whole US dollars, inside the
 *  window below.
 *
 *  THE BREAK-EVEN IS TWO HOURS against HOURLY_USD, where EXTRA_PAGE_USD buys a
 *  little over three. EXTRA_PAGE_USD's own note above counts a page at three to
 *  four hours honestly counted, so this figure is under that count and is a
 *  deliberate loss on a page that takes the full time. It survives because a
 *  page added to a three-page site the practice built last month is not the
 *  same work as a page added to a site it inherited. Accepted with the
 *  break-even stated. */
export const FOUNDING_EXTRA_PAGE_USD = 250;

/** Months from DELIVERY that the reduced page price runs, after which
 *  EXTRA_PAGE_USD applies.
 *
 *  A DIFFERENT ANCHOR FROM FOUNDING_RATE_HOLD_MONTHS, and the difference is
 *  deliberate rather than an oversight. The fee hold runs from the first
 *  charge because that is the date a client associates with a fee; this runs
 *  from delivery because that is the date a client associates with the site.
 *  Forcing the two to share an anchor would make one of them read wrong. Both
 *  documents must say which is which. */
export const FOUNDING_PAGE_PRICE_MONTHS = 12;

/* ── A TOOL ADDED AFTER A FOUNDING BUILD ─────────────────────────────────────
 * ponytail: THESE TWO FIGURES HAVE NO MEASUREMENT UNDER THEM AND THE CEILING IS
 * NAMED RATHER THAN DISCOVERED LATER. Nothing in this practice has ever timed a
 * fitting end to end. The upgrade path is written and is not vague: time the
 * first one, kickoff to acceptance including the waiting, and re-derive both
 * numbers through the "Checking the price is right" loop in
 * docs/engagement/reference/rate-card.md. Until then the break-even below is the
 * only honest thing that can be said about them.
 *
 * WHAT WAS PUT TO THE OPERATOR BEFORE HE CHOSE THESE, recorded so it is not
 * rediscovered as an oversight. FLOOR_USD in pricing.js is not the price of "a
 * build" in general -- its own header says it "was sized for exactly one job,
 * taking a finished shelf tool and changing what it computes OVER", which is
 * precisely this work. So $2,500 is the published price of the same thing. At
 * HOURLY_USD, 400 buys 2.7 hours and 800 buys 5.3 -- both re-derived when the
 * hourly moved 125 -> 150 on 2026-09-12, and both shorter than they were -- while EXTRA_PAGE_USD above
 * costs one page at three to four hours and a founding client pays 250 for it.
 * A fitted tool is more work than two pages. He chose these with that in front
 * of him, which makes it a decision rather than a miss.
 *
 * WHY CHEAPER EARLY, which is the part that is genuinely defensible: a tool
 * fitted while the build is still open is work done inside a codebase already
 * loaded, with the client's data already to hand and the accounts already
 * granted. The same job six months later starts cold. The shape rewards the
 * thing that is actually cheaper to do. */

/** A fitted tool added inside the early window, in whole US dollars.
 *
 *  400 COLLIDES WITH TWO OTHER FIGURES and that is a real cost rather than an
 *  inconvenience. UPKEEP_MONTHLY_USD and EXTRA_PAGE_USD are both 400 already,
 *  and on a founding client's rate sheet this number sits a few rows from the
 *  page price it reverts to after FOUNDING_PAGE_PRICE_MONTHS -- the same "$400"
 *  meaning "you moved quickly" in one row and "you waited" in another. Every
 *  check that reads it must therefore key on wording and never on the integer.
 *  hourly-ok: the break-even is stated above; the operator accepted it. */
export const FOUNDING_TOOL_EARLY_USD = 400;

/** Months from delivery during which FOUNDING_TOOL_EARLY_USD applies.
 *
 *  A THIRD ANCHOR, and all three in this file now run from different events.
 *  The fee hold runs from the first charge; the page window runs from delivery;
 *  this runs from delivery too, because it is about how warm the build still is
 *  rather than about billing. It equalled FOUNDING_UPKEEP_FREE_MONTHS, so a client
 *  met one early window, until the revisit after D126 moved the free months to
 *  six and left every price, this window included, equal to the standard's. The
 *  cheaper tool is about how warm the build is, which does not change with when
 *  the fee starts, so the two windows now differ and the documents state each. */
export const FOUNDING_TOOL_EARLY_MONTHS = 3;

/** A fitted tool added after the early window but inside the first year.
 *
 *  Collides with nothing, which is the one thing it has over the figure above.
 *  hourly-ok: 5.3 hours at HOURLY_USD; see the block comment. */
export const FOUNDING_TOOL_YEAR_ONE_USD = 800;

/** Months from delivery after which a fitted tool is quoted like any other job.
 *
 *  Equals FOUNDING_PAGE_PRICE_MONTHS on purpose: a founding client's first year
 *  ends on ONE date for everything priced by it, and two different year-ends in
 *  one document would be a question nobody should have to ask. */
export const FOUNDING_TOOL_WINDOW_MONTHS = 12;
