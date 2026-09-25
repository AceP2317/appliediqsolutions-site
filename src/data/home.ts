// Single source of truth for the home page copy. Since D29 that page is the
// PITCH — the small-business offer — not a welcome hub, and since D118 (2026-09-20)
// the pitch is three doors, so what lives here is the opener, the three doors and
// the tools band that now renders on /main-street/. The exports /approach/ and
// /faq/ read (process, comparison, fit, whoItsFor, faq) left with those pages
// on 2026-09-20 (D118); they are in git.
//
// Edit copy here, not in the section components. The live-tool sections read
// from ./demos.ts so tool names/taglines never drift.
//
// HONESTY NOTE: nothing in here is fabricated. Client logos, ratings, dollar
// figures, and testimonials are intentionally ABSENT — the live tools are the
// proof. The labeled slot below (namedDomains) is designed-for and stays empty
// until there is something real to put in it.
//
// TOOL COUNT: never hardcode it. It derives from demos.ts (as /llms.txt already
// does), so shipping a new demo can't leave a stale "7 live tools" behind.

import { demos, shelfCount, workGroups } from './demos';
import { included as websiteScope } from './website-scope.js';
import { isOpen as foundingOpen, eyebrow as foundingEyebrow } from './founding';
import { countWord } from '../lib/count-words.js';
import { tradesLine, tradeCountWord } from '../lib/trades.js';
/* THE FAQ NAMES FIGURES NOW, AND NOT ONE OF THEM IS TYPED. `npm run gate`
   refuses a hand-typed published price anywhere under src/, and the reason it
   exists applies here more than anywhere else on the site: an FAQ is the page a
   reader trusts to be the plain version, so a figure here that disagrees with
   the page selling it is the worst place on the site for that to happen.

   REVISION ROUNDS AND THE HOURLY RATE ARE DELIBERATELY ABSENT. They live in
   src/lib/engagement-rates.js, which is the module of figures that are NEVER
   published, and the gate refuses any of them reaching page copy. A reader who
   needs them is reading a rate card attached to a quote, which is where they
   belong. */
import { money } from '../lib/format.js';


/* Length of the operations career, DERIVED — never written as a literal. Same
   rule as the tool count above and for the same reason: a hardcoded "14" is
   wrong from one particular morning onward and nothing anywhere would error.

   MOVED to src/lib/career.js on 2026-08-25, and the move is the point. This
   page derived the figure while scripts/gen-og.mjs held the WORDS "Fourteen
   years running operations." as a literal, under a comment telling whoever
   edits this file to change that one too. The two agreed, so nothing looked
   wrong — which is exactly how that class hides. See LEDGER L-196. The lib is
   plain .js so the Node card generator can import the same derivation.

   The start date, the sourcing, and why the divisor lags the calendar by two
   months all live in that file rather than being restated here. */

export type CapabilityIcon = 'puzzle' | 'scan-search' | 'radar' | 'activity';

export interface Capability {
  icon: CapabilityIcon;
  title: string;
  body: string;
  /** Slug (./demos.ts) of the live tool that demonstrates this problem-shape —
   *  renders an evidence link on the card. Omitted where no single tool proves
   *  it; never reach. */
  proofSlug?: string;
  /** One line: what this shape looks like inside a small local business. The
   *  spine of D29 — the catalog is organized by problem SHAPE, not company
   *  size, so a shop owner can see their own version of a tool built for a
   *  manufacturing floor. Written for every shape, including the three with no
   *  local demo yet: that is honest, because only one such demo exists. */
  atShop?: string;
  /** The same shape proven at industrial scale. A {href,label} rather than a
   *  slug because the target may be Confirmation Outlook, which is NOT a
   *  demos.ts row and never will be. Only needed where `proofSlug` already
   *  points at the LOCAL tool — elsewhere the proof link IS the at-scale one. */
  atScale?: { href: string; label: string };
}

/* ── S1 Opener — the thing no competitor can say ────────────────────────────
   REWRITTEN 2026-08-24, on a market finding rather than a taste one. The old
   headline was "Big-company software, built for your business" — a category
   claim, and a competitive sweep found the whole category taken:
   owned-not-rented, custom-not-template, direct-with-the-builder, local, and AI
   are each already published by a named competitor inside these counties, one of
   them at a fixed price on a page written for Greenville.

   What is NOT taken is the career. Restaurant floor, bank lending division, clinic
   front office, insurance book, then the planning floor of the appliance plant
   in town. Nobody who has not lived that can copy the sentence, and it lands on
   a New Bern reader because four of those five are on their own street.

   REWRITTEN AGAIN 2026-08-25, on the operator's own read: "I ran a restaurant
   for five years. Then a bank. Now a factory." was accurate and vastly
   undersold what actually happened. "A restaurant" was a Jimmy Buffett's
   Margaritaville inside Mohegan Sun, where he was Restaurant Operations Manager
   AND Beverage Department Head for five and a half years. "A bank" was Consumer
   Lending Operations Manager at a bank's corporate office, then cash management
   at a second bank. Between them sat a psychiatric practice and a licensed
   insurance practice. Reducing that to three plain nouns made a genuinely unusual
   career read as an ordinary one.

   THE LINE IS DOMAIN-LEVEL, and it went from four beats to SIX on 2026-08-26 on
   the operator's own call. The four-beat version deliberately withheld
   "Manufacturing", on the grounds that he does supply chain AT a manufacturer
   rather than running manufacturing. He put it back, and the distinction still
   holds: this is a list of domains a career has been spent inside, and it makes
   no verb, so it claims nothing about what he ran. "Corporate banking" is still
   not used and that has not changed — it means banking FOR corporations, and he
   worked in a bank's corporate OFFICE, which is a different thing.

   THE LIST LIVES IN src/lib/trades.js, NOT HERE, and that is the fix for a real
   failure rather than tidiness. It was a string here and a second hand-split
   copy inside gen-og.mjs, under a comment asking whoever edits one to remember
   the other — and the share card had already kept selling a retired positioning
   for weeks because nothing connected them. The line beneath it typed the COUNT
   of that string by hand, so going to six beats left "Four industries" printed
   directly under six. Both now derive. See LEDGER L-196 and src/lib/career.js,
   which is the same fix applied to the year count.

   THE EMPLOYER IS NEVER NAMED (D1, D8). "the appliance plant in town" resolves
   instantly for every local, borrows no company's branding, and is the whole
   reason this gets the credibility without going near the fence.

   `visionAccent` is the phrase rendered in the brand gradient and MUST appear
   verbatim, exactly once, inside `visionLead` — Opener.astro splits the string
   on it, and a mismatch renders `undefined` silently. */
export const opener = {
  /* ── THE CLAIM, D113 — and it is the operator's explicit pick ──────────────
     He compared five treatments and told us the deciding factor in his own
     words: "I wanted the font, size, thickness, and verbiage to match the A+C
     artifact, that was a main choosing point." All four of those are matched
     here and in `.statement` — Fraunces at weight 500 rather than 600, the
     optical-size and wonk axes driven, and this sentence rather than the trades
     line as the h1.

     THE FIRST BUILD SHIPPED THIS WRONG, ON A JUDGMENT THAT WAS NOT MINE TO
     MAKE. It kept the six-trade line as the h1, on the reasoning that D33 makes
     that headline the positioning and that PICKUP records him declining to
     reopen it. The reasoning was sound and the conclusion was still wrong: he
     had not overlooked the headline in the mockup, it was the thing he was
     choosing. A concern raised once and answered is his call.

     ⚠️ THIS SENTENCE IS ALSO `/bio/`'s H1, WORD FOR WORD — see bio.astro. The
     comment on `visionLead` below warns about exactly this: the two pages make
     the same argument and must not use the same words. He asked for this
     verbiage here, so the duplicate has to break on the OTHER page, and that is
     a copy decision sitting with him rather than something to quietly reword. */
  claim: 'Before I built software, I ran the businesses.',
  label: 'Custom software · yours to own',
  headline: tradesLine(),
  /* THE AUTHORITY IS STATED, NOT CLAIMED. The line this replaces — "I have been
     the one fighting the spreadsheet at midnight" — described a mood, and it
     read as junior: anyone at any level can be tired. What replaced it has to
     carry accountability, because this is the only place on the page where the
     reader is told he was answerable for the outcome rather than adjacent to it.

     "That was my job" DID THAT JOB AND HAS BEEN RETIRED. Operator's call
     2026-08-26: the whole site should read as a professional rather than as
     somebody holding a position, and "my job" is the plainest example of the
     second. "I owned that" carries the same accountability in the same number of
     beats — ownership is a stronger claim than employment, not a softer one —
     and it does not put him in a seat.

     The count is derived. It read "Four industries" beside a four-beat headline
     that is now six beats long. */
  operatorLine:
    `${tradeCountWord({ capital: true })} domains that share nothing, and the same failure in every one: the work outran the software, and somebody closed the gap by hand. I owned that. Now I build the thing that closes it, and you own it outright.`,
  // Do NOT open this with "For years, real custom software was something only
  // big companies could afford" — that is the opening sentence of
  // /main-street/'s /01, and the verbatim echo was a measured 78-char duplicate
  // between the two pages. They make the same argument; they must not use the
  // same words.
  visionLead:
    'Every business I have worked in ran on something almost right — a spreadsheet held together by one person, a system that fit somebody else’s business. The software that would have fixed it was priced for companies a hundred times the size. That stopped being true.',
  visionAccent: 'a system that fit somebody else’s business',
};

/* ── Opener local portal — the doorway into /main-street ─────────────────────
   New Bern is home base and first market, not a fence (D29). The tile is the
   geographic door for the visitors it IS about; everyone else keeps scrolling
   into an offer that already applies to them. */
export const localPortal = {
  eyebrow: 'Home base · New Bern, NC',
  title: 'In New Bern? Start on Main Street.',
};

/* ── The most approachable demo — Review Autopilot (D25/D29, amended by D33) ──────────────────────────────
   Canonical home for this copy since the home page became the pitch. The same
   product is described on /main-street/ in New Bern framing; the two must not
   share a body verbatim (that is the cannibalization risk), but the AUTOPILOT
   RULE is required on every surface that describes it and is the deliberate
   exception — positives post automatically, negatives are always held. Never
   say the drafting is "trained"; the demo's replies are pre-written samples. */
export const leadOffer = {
  /* WHAT THIS BAND NOW CARRIES, rewritten 2026-08-25.

     It sold Review Autopilot, whose category closed in March 2026 when a
     platform shipped the whole thing free inside the tool the buyer already
     opens daily. Leaving it here meant the home page's one product band was
     selling something with no price, feature or trust position left in it.

     A SWAP, NEVER AN ADDITION. Home measures ~8,950px on a 390px phone and
     its own header records it growing back to 12,696px in July, so a new
     section was never available — this reuses the same component and the same
     shape, so the page stays flat while the band starts selling something
     that exists to be sold.

     THE EXPORT NAME STAYS `leadOffer`. Renaming it would touch four files for
     no behavior change, and this comment carries the meaning — the same
     reasoning the previous occupant left behind.

     The count is DERIVED (D22). Never write it here as a numeral. */
  eyebrow: 'Built already · open one now · no login',
  name: 'Tools that are already finished',
  tagline: 'Small, narrow, and running on rules that belong to you rather than to your trade.',
  body:
    'Each does a single job still being done on a legal pad — splitting a night’s tips, counting a back bar, working out what to reorder. No platform has taken any of them, because the rule inside each one is a decision that business made once and kept. Open any of them now on made-up numbers, then put your own in.',
  cta: { label: 'See the finished tools', href: '/tools/' },
  shot: '/shots/tip-out-sheet.webp',
  shotAlt:
    'The Tip Out Calculator — a night’s tips split across a bar’s own rules, with every figure showing the arithmetic beside it.',
  facts: [
    { v: String(shelfCount), k: 'Finished tools' },
    { v: 'Yours', k: 'To own outright' },
    { v: 'None', k: 'Accounts or logins' },
    { v: 'Nothing', k: 'Leaves your browser' },
  ],

  /* ── THE ASK, added D113 ─────────────────────────────────────────────────
     "Save what is on this screen" has been on every shelf tool since D58 and
     NO PAGE HAS EVER ASKED ANYBODY TO USE IT. Meanwhile every proof surface on
     the site ended at "Start with a free conversation" — a phone call with a
     stranger, which is the highest-friction step here, placed at the moment of
     highest intent.

     This is the lower step, and it costs nothing to offer because the button
     already exists. It sits INSIDE this band rather than in one of its own, so
     the page gains a step without gaining a section. */
  ask: {
    title: 'And if the number looks wrong — send me the screen.',
    body:
      'Every tool has a Save what is on this screen button. It writes what you typed to a small file on your own machine, and it sends nothing anywhere. Email me that file and I will tell you what I would change, before either of us has talked about money.',
    emphasis: 'Save what is on this screen',
    cta: { label: 'How that works', href: '/work/' },
  },
};

/* ── The free check, set as a ledger (D113) ──────────────────────────────────
   Same words the band has always carried; what changed is the SHAPE. The rows
   below are the arithmetic the check actually runs, shown as the column it is.

   THE EXAMPLE IS LABELED AS AN EXAMPLE AND THE ANSWER IS NOT PRINTED, and both
   halves of that matter. The two inputs are the ones /check/ itself pre-fills,
   so a visitor who follows the button meets the same numbers. The final row
   deliberately carries NO figure: the whole contract of this tool is that every
   number it prints is the visitor's own input multiplied out, so a total sitting
   here would be a figure about nobody, which is the exact thing the tool exists
   to refuse. */
export const checkLedger = {
  caption: 'An example, using the two numbers the check starts with',
  rows: [
    { k: 'What you spend on stock in a normal month', v: '$8,000' },
    { k: 'Hours a week ordering, chasing and checking', v: '6' },
    { k: 'Hours a year, from those two numbers alone', v: '312' },
    { k: 'What the paperwork costs you a year', v: 'your figure, with its working' },
  ],
};

/* ── The objection band (D113) ───────────────────────────────────────────────
   ⚠️ THIS COPY WAS DRAFTED BY CLAUDE AND THE OPERATOR HAS NOT PASSED IT YET.
   He approves every word of public copy, and he approved the SHAPE of this band
   from a mockup rather than these sentences. Treat it exactly like the
   photograph beside it: real enough to build and judge, not yet signed off.

   WHY THE BAND EXISTS. Every skilled site in the 2026-09-12 research says one
   sentence that loses it a customer — ONCE's "That's obscene", Plausible's "It's
   time to ditch Google Analytics", Sivers' "Everything here is 100% me, no AI".
   Anonymous sites never refuse anything, because a refusal needs a position and
   a position can be wrong. It costs no color, no motion and no motif, and a
   template cannot generate it.

   WHY THE ANSWER CONCEDES. 37signals heads a section with the objection verbatim
   and answers it. Conceding that the nephew is sometimes right is what makes the
   rest believable — an answer that refused to concede anything would be the
   thing this band exists not to be. */
export const objection = {
  /* ── APPROVED BY THE OPERATOR 2026-09-12, and the route matters ────────────
     He was shown two drafts against the price objection and picked this one,
     with the instruction "Treat this as a decision of mine before publishing".
     Nothing went near the live page until he chose. THIS BLOCK IS HIS.

     THE OBJECTION CHANGED FROM WHO BUILDS IT TO WHAT IT COSTS, on his call.
     The first version answered "but my nephew can build me a website" — Claude's
     pick, and Claude's words, which shipped live before he had read them. He
     replaced the objection outright, and the band is stronger for it: the price
     box has always sat in here, so the money question was already on the page
     with nothing answering it.

     THE FOUR THINGS HE NAMED, all four of which had to survive the drafting:
     a partnership from day one; deciding together through the uncertainties;
     the partnership REMAINING after the client is up and running; and what that
     covers — emergencies, breakage, crisis, triage, consultation.

     ⚠️ IT MUST NOT READ AS FREE LIFETIME SUPPORT, and that is a hard line rather
     than a wording preference. Upkeep is a PAID monthly arrangement, and this
     page saying the relationship simply continues would contradict the rate
     sheet a client signs. So the copy claims continuity and never claims it is
     unpriced, and the button points at `/upkeep/`, where what staying actually
     costs is published. That link IS the honesty mechanism here, not decoration.

     IT OPENS BY CONCEDING, and that was the choice between the two drafts. The
     other led with the position; this one agrees with the customer first. His
     read, and it is the warmer of the two for somebody standing in their own
     shop being told what they are buying. */
  heading: '“I got a cheaper quote.”',
  body: [
    'You probably did, and sometimes the cheaper quote is the right answer. I will tell you so on the first call, and that call costs you nothing.',
    'What a cheap quote buys is a thing, handed over. What this buys is a partner, starting before the first decision gets made — we work out together what your business actually needs this to do, and which of the unknowns are worth spending money on and which are not. That part matters more than the build does.',
    'And it does not stop at launch. When something breaks, when a supplier changes something under you, when you need somebody to look at it on a Saturday and tell you straight what is happening — that is the person who built it. Not a ticket, and not a stranger reading it for the first time.',
  ],
  portrait: '/ian-provencher.webp',
  portraitAlt: 'Ian Provencher',
  priceLabel: 'What a build costs',
  /* THE HONESTY MECHANISM MOVED WITH THE FEE, 2026-09-20 (D118). /upkeep/ is gone
     and the fee, its cap and its refusal now render as a section of /websites/,
     which is where this points. Never repoint it at a surface with no figure. */
  cta: { label: 'What staying looks like, and what it costs', href: '/websites/#upkeep' },
};


/* ── THE THREE DOORS (D118, Phase 5, 2026-09-20) ──────────────────────────────
   The home page is these three bands and nothing else between the opener and
   the closing call. Every fact under a door is DERIVED: the scope items from
   website-scope.js, the shelf count from demos.ts, the founding line from
   founding.ts, the factory tool names from workGroups. A door that typed
   "seven tools" would be wrong the day an eighth shipped (D22).

   THE SENTENCES ARE THE SHAPE PACK'S, which the operator picked from on
   2026-09-20, minus every typed count and every figure: the website figure
   arrives from services.ts in index.astro with its qualifier in the same panel,
   and the factory floor does not exist until Phase 7 of that decision. The
   local door's title is the sentence the Opener's portal tile carried since
   D29. The copy is his to pass before a customer reads it, and it reached him
   as a decision in the session that wrote it.

   WHAT THIS REPLACED: the problem-shape section header and the /work/ doorway,
   which made the proof-at-scale argument on the home page. That argument now
   belongs to the manufacturers door and to /supply-chain/; Breadth.astro still
   renders the grid on /bio/. */
export const doors = {
  websites: {
    id: 'door-websites',
    eyebrow: 'A website you own',
    title: 'A site you own, and what it costs.',
    body:
      'Paid once, on a domain and hosting in your name, with one working tool built into it. Any developer can pick it up tomorrow, and nobody can switch it off but you.',
    cta: { label: 'See what a site includes', href: '/websites/' },
    facts: websiteScope.map((item) => item.t),
  },
  local: {
    id: 'door-local',
    eyebrow: localPortal.eyebrow,
    title: localPortal.title,
    body:
      'Finished tools you can drive right now, a free check on what the paperwork is costing you, and the founding offer while it lasts. In person, at your counter.',
    cta: { label: 'Go to Main Street', href: '/main-street/' },
    facts: [
      `${countWord(shelfCount, { capital: true })} finished tools, open one now, no login`,
      'The free check: two numbers in, one about your business back',
      ...(foundingOpen ? [foundingEyebrow] : []),
      'The Craven County deadlines list, free',
    ],
  },
  manufacturers: {
    id: 'door-manufacturers',
    eyebrow: 'For manufacturers',
    title: 'Numbers your planning system is sure about.',
    body:
      'Factory tools built to order for one plant on its own extract, or run once for the answer. Quoted per plant, and agreed before anything starts.',
    cta: { label: 'See the factory tools', href: '/supply-chain/' },
    facts: workGroups
      .filter((g) => g.band === 'scale')
      .flatMap((g) => g.slugs)
      .map((slug) => demos.find((d) => d.slug === slug)?.name ?? slug),
  },
};

/* Sections died here, all for the same reason: the home page keeps growing back,
   and each one was saying something a neighboring section already said.

   The moat rows went 2026-07-13 (three tools with a full-width row each, which
   LiveTools then re-listed on the same page). LiveTools itself went with D29 —
   its "built at real scale, which is why yours will be good" claim is the same
   argument the problem-shape grid makes with evidence links, so the claim moved
   into `shapesHead.lede` and only its door to /work/ survived.

   Nine more section components went with D29's sweep, along with the exports
   only they consumed: `signalStrip` (Hero), `gaps` (Gap), `positioning`
   (Positioning), and `paths` + `pathsHead` (WaysIn, the old "two ways in"
   small-vs-established split the problem shapes replaced). Those components had
   been imported by zero pages for months. `process`, `comparison`, `fit`, and
   `whoItsFor` survived the same sweep — their components died but /approach
   still renders the data directly. */

/* ── Problem shapes — the spine of the catalog (D29) ──────────────────────────
   Organized by SHAPE, not company size. A one-person shop and a global
   manufacturer hit the same four problems; only the nouns change. This is what
   makes the supply-chain tools SELL the small-business offer instead of
   competing with it — and why a tool built for a shop transfers upward.
   Ordered lead-first: the shape with a live local proof goes first. */
export const capabilities: Capability[] = [
  {
    icon: 'radar',
    title: 'A stream of inbound, triaged',
    body: 'A daily flood of incoming things turned into a short list of what actually needs a decision today — with the rest already answered.',
    proofSlug: 'recall-sheet',
    atShop: 'Everybody past the interval you set, sorted by how far past — and nobody scored, ranked or guessed at.',
    atScale: { href: '/work/asn-update-radar/', label: 'ASN Update Radar' },
  },
  {
    icon: 'scan-search',
    title: 'Hidden-error & integrity triage',
    body: 'Surfacing the wrong data a clean-looking summary hides — before it costs you downstream.',
    proofSlug: 'bar-count-sheet',
    atShop: 'The month that balances on paper because two mistakes quietly canceled each other out.',
    atScale: { href: '/work/staging-triage-console/', label: 'Staging Triage Console' },
  },
  {
    /* SWAPPED 2026-08-25. This card was “volatility and drift detection”, a real
       capability with no small-business instance anywhere on the shelf — its proof
       was a factory tool and its shop line described a problem nothing here
       solves. Cover is the shape the most local trades actually share: a bar, a
       chandlery, a contractor’s van and a clinic’s supply cupboard all have it,
       and it has a perfect at-scale twin already live. */
    icon: 'activity',
    title: 'Cover, before you run out',
    body: 'How long what you have on hand actually lasts, against how long the next lot takes to arrive.',
    proofSlug: 'reorder-list',
    atShop: 'The thing you run out of on a Saturday because nobody was counting the days it had left.',
    atScale: { href: '/work/production-plan-churn/', label: 'Production Plan Churn' },
  },
  {
    icon: 'puzzle',
    title: 'The tool your system left out',
    body: 'The bespoke connective tissue between platforms that no vendor will ever build for you.',
    proofSlug: 'tip-out-sheet',
    atShop: 'The part of the job that lives in a spreadsheet, a text thread, and somebody’s memory.',
  },
];

// Honest capability areas (capabilities, NOT industry claims). Editable.
export const capabilityAreas: string[] = [
  'Internal tools & system integration',
  'End-to-end implementations',
  'Data & analytics tooling',
  'Workflow automation',
  'Operational reporting & dashboards',
  'Root-cause analysis & troubleshooting',
  'AI woven into an existing workflow',
];

// SLOT: named adjacent domains to claim, once confirmed. Stays empty until real.
export const namedDomains: string[] = [];

/* ── THE WEBSITE COMPARISON, added 2026-09-03 with /websites/ ─────────────
   A SECOND `comparison`-shaped record rather than an edit to the one above,
   because the two argue against different things. That one answers "why not a
   consultant"; this answers "why not the $16-a-month one", which is the question
   a local business actually asks and which nothing on this site had ever
   answered.

   EVERY LEFT-HAND LINE IS A CHECKABLE FACT ABOUT A NAMED PLATFORM, registered in
   src/data/external-claims.js so it ages and warns rather than quietly rotting.
   Naming them is deliberate: "a rented template" is a category nobody recognizes
   themselves in, and the whole persuasive weight sits in the specifics.

   ONE ARGUMENT IS DELIBERATELY ABSENT AND MUST STAY ABSENT — that builder sites
   are slow. They are not. Measured 2026-09-03, default-template mobile Core Web
   Vitals pass rates run Wix 80.7%, Squarespace 70.2%, WordPress 49.3%. A speed
   claim here would be disprovable by any prospect with a free testing tool, on
   the one site whose entire product is an honesty contract.

   FOUR ROWS IS DELIBERATELY NARROW, AND /websites/compare/ IS WHERE THE REST
   LIVES. This block argues against ONE thing, a template subscription, and it is
   accurate about that. It is not the field: two of the nine options a local
   business actually has are FREE, and one of them hands over real source code,
   so "the rent never stops" and "the files are yours" both miss those two
   entirely. Widening this block would turn the page that sells into the page
   that explains. src/data/platform-comparison.js carries the full set.

   THE THIRD LINE CHANGED ON 2026-09-10 BECAUSE IT HAD GONE FALSE. It read
   "Nothing of yours fits inside it — GoDaddy has no app market at all", sourced
   from a review site. GoDaddy has since retired Websites + Marketing for an AI
   builder whose own page advertises code export. The replacement is read off
   GoDaddy's own plans table and is a harder fact: the editing is metered. */
export const websiteComparison = {
  left: {
    title: 'A template subscription',
    items: [
      'You rent it, and the rent never stops',
      'Leaving means rebuilding — Wix exports no design, no layout, no pages',
      'Stop paying and it goes dark: Squarespace expires a site 15 days past due',
      'Even editing it is rationed — GoDaddy meters changes in monthly AI credits',
    ],
  },
  right: {
    title: 'A site you own',
    items: [
      'Paid once. Upkeep is optional and you can stop it',
      'The files are yours — any developer can pick it up tomorrow',
      'Nobody can switch it off but you',
      'The tool your business actually runs on is built into it',
    ],
  },
};

/* THE TESTIMONIAL SLOT LEFT WITH THE DOORWAY THAT RENDERED IT (D118, Phase 5).
   The honesty note above still governs: nothing here is fabricated, and a real
   consented quote gets a home when there is one, under the release in
   docs/engagement/agreements/. */
