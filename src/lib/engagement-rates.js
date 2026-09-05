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
 *  effective rate. A website build runs roughly 35 hours, and at WEBSITE_USD in
 *  src/lib/pricing.js that fixed price earns about $129 an hour -- just above this
 *  number, which is the relationship that has to hold. THIS SENTENCE SAID "at
 *  FLOOR_USD ... fifteen to twenty-five hours" until 2026-09-03, an estimate D55
 *  had already retired: at the build floor those 35 hours earn $71, so the
 *  argument below was resting on a figure that made it false. Price
 *  hourly work BELOW that and a client works out that asking by the hour costs
 *  less than agreeing a scope — at which point the fixed-price model every
 *  agreement in the set rests on quietly stops holding, without anyone deciding
 *  to abandon it. House rule 4 already says a change order states a fixed price
 *  and never a rate; this is the number for what is too small to be one. */
export const HOURLY_USD = 125;

/** The smallest unit billed at that rate, in minutes. Anything shorter is not
 *  invoiced at all. Billing in six-minute units is what law firms do and it
 *  makes a client count every question they ask, which is the opposite of the
 *  relationship this practice is built on. */
export const MIN_BILLING_MINUTES = 30;

/* ── WHAT A MONTH COSTS ──────────────────────────────────────────────────── */

/** Monthly upkeep, in whole US dollars. This is the "light monthly touch"
 *  already promised on /services/ and /main-street/ — small fixes and changes
 *  as they come up.
 *
 *  THE TEST THAT SETS THIS NUMBER: it must exceed one hour at HOURLY_USD. A
 *  monthly fee smaller than a single hour loses money the first month anybody
 *  actually uses it, and an arrangement that loses money stops being a service
 *  and starts being an obligation — which is how a retainer ends up resented by
 *  the person providing it. At 150 against 125 there is room for one real
 *  request and still a margin for being reachable in a month with none.
 *
 *  It is a SERVICE SUBSCRIPTION and never a licence. Cancel it and everything
 *  keeps running unchanged in the client's own accounts — see
 *  docs/ownership-delivery.md section 8, which is what keeps "no subscription,
 *  no lock-in" true on the public pages alongside recurring revenue. */
export const UPKEEP_MONTHLY_USD = 150;

/* ── WHAT MORE OF THE SAME COSTS ─────────────────────────────────────────── */

/** One page beyond the ceiling, in whole US dollars.
 *
 *  A page is not a layout. It is words placed, pictures sized and cut, links
 *  wired, its own preview picture for when the page is shared, an entry in the
 *  file that tells search engines the page exists, and it has to pass every
 *  check the rest of the site passes. That is three to four hours honestly
 *  counted. Priced under about three hundred it becomes cheaper for a client to
 *  ask than for the practice to build, which is how a fixed price becomes an
 *  open one page at a time. */
export const EXTRA_PAGE_USD = 400;

/* ── HOW BIG A BUILD IS ──────────────────────────────────────────────────── */

/** Pages included in a paid website build at the published floor. Home, about,
 *  services, contact, and one more the business actually needs.
 *
 *  THIS IS THE ONLY LEVER HOLDING THE FLOOR. A build at that price includes
 *  sender records, a search listing, two policy pages and one working tool
 *  before a single page is designed. Without a written ceiling the size of a
 *  job is decided later by whoever argues hardest, which house rule 2 names as
 *  the exact shape every scope argument takes. */
export const PAGE_CEILING = 5;

/** Rounds of changes included, on a paid build. A round is one consolidated set
 *  of changes, collected and sent at once. Counting individual requests instead
 *  turns every message into a negotiation about whether it counted. */
export const REVISION_ROUNDS = 2;

/* ── HOW BIG A FREE BUILD IS ─────────────────────────────────────────────── */

/** Pages included in a founding build. Smaller than a paid one on purpose:
 *  D35's cap exists because an uncapped free offer fills every spare hour with
 *  unpaid work while paid work waits. A smaller number is what makes the same
 *  inclusion list survivable at no fee. */
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
