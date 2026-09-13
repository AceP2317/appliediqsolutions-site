// Single source of truth for the home page copy. Since D29 that page is the
// PITCH — the small-business offer — not a welcome hub, so what lives here is
// the offer, the lead offer, and the problem shapes. Some exports (process,
// comparison, fit, whoItsFor, faq) are read by /approach and /faq instead.
//
// Edit copy here, not in the section components. The live-tool sections read
// from ./demos.ts so tool names/taglines never drift.
//
// HONESTY NOTE: nothing in here is fabricated. Client logos, ratings, dollar
// figures, and testimonials are intentionally ABSENT — the live tools are the
// proof. The labeled slots below (testimonial, namedDomains) are designed-for
// and stay empty until there is something real to put in them.
//
// TOOL COUNT: never hardcode it. It derives from demos.ts (as /llms.txt already
// does), so shipping a new demo can't leave a stale "7 live tools" behind.

import { demos, shelfCount } from './demos';
import { opsYears } from '../lib/career.js';
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
import { FLOOR_USD, WEBSITE_USD, RESCUE_AUDIT_DAYS } from '../lib/pricing.js';
import { REPLY_SHORT } from '../lib/reply-window.js';
import { money } from '../lib/format.js';

const toolCount = demos.length;

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

export interface Stat {
  value: string;
  label: string;
  caption: string;
  /** Optional size modifier class for the value (text phrases vs. big numbers). */
  valueClass?: string;
  /** Optional evidence link under the caption (e.g. the /projects ship log). */
  link?: { href: string; label: string };
}
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
export interface Step {
  n: string;
  title: string;
  body: string;
}
export interface Persona {
  title: string;
  body: string;
}
export interface Faq {
  q: string;
  a: string;
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

/* ── S2 Proof bar — the career IS the credential ────────────────────────────
   The old lede led with the manufacturer alone, which made this page an
   industrial pitch wearing a small-business hat — the operator's own diagnosis
   of why it was not working. The credential is now the whole run of trades, and
   the plant is the last one rather than the only one.

   ONE SET OF NUMBERS, TWO READINGS — the device taken from Stripe's home page,
   which carries no code at all and proves depth through operational magnitude
   instead. A shop owner reads "fourteen years running operations" as somebody
   who has stood where they stand. An operations director reads it as a career
   rather than a side project. Neither number is aimed at only one of them. */
export const proofHead = {
  lede: 'Restaurant floor, bank lending division, clinic front office, insurance book, and now the planning floor of the appliance plant in town. Not advising any of them — running them.',
  claim: 'No mockups. The tools on this site are running in your browser right now.',
};

/* Verifiable facts, and the honest stand-in for a logo wall.

   FOUR SLOTS, because ProofBar.astro lays out `lg:grid-cols-4`. A fifth
   silently reflows into an orphan on desktop.

   WHAT WAS CUT, AND WHY: "100% owned & deployed" used to sit here. The
   competitive sweep found a national shop publishing "YOU OWN EVERYTHING… walk
   away and it keeps running" at a fixed price, on pages already generated for
   Greenville and Kinston. Ownership is table stakes in this category now, so it
   stays as reassurance inside the offer copy and stops pretending to be proof.

   THE SENTENCE ABOVE IS QUOTED IN src/data/what-you-get.js AS THE RULE EVERY LINE
   ON THE PRINTED COMPARISON SHEET OBEYS, so it outlives this file's own data.
   It said "inside the offers" until 2026-09-11, naming the three-shapes list that
   was deleted that day when its career lines moved to /services/ and /websites/.
   The RULE is untouched — ownership is not argued as a differentiator anywhere —
   and only the pointer needed correcting. */
export const proofStats: Stat[] = [
  {
    value: String(opsYears()),
    label: 'Years running operations',
    caption:
      'Five trades, from the inside — restaurant, banking, a clinic, insurance, manufacturing. Every one of them ran on something that almost worked.',
  },
  {
    value: String(toolCount),
    label: 'Live tools, running now',
    caption: 'Open any one in your browser — synthetic data, no login, nothing to install.',
  },
  {
    value: 'Zero',
    label: 'Spec required',
    caption: 'You say where your business is and where you want it to be. Working out what to build is mine to solve — it’s the part that’s actually hard.',
  },
  {
    value: 'Hours',
    label: 'Pain-point to deployed',
    caption: 'Some tools here went from problem to deployed in under an hour. Knowing what to build is the hard part — and it’s solved first.',
    link: { href: '/projects/#ship-log', label: 'See the receipts' },
  },
];

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
  cta: { label: 'What staying looks like, and what it costs', href: '/upkeep/' },
};


/* ── The problem-shape section header + the /work/ door ───────────────────────
   This absorbed the old "where I go deepest: supply chain" section. That
   section made the same proof-at-scale argument the shape grid already makes,
   and cost 763px on a page measured at 9,462px on a phone — so the caliber
   claim moved into this lede and only the door survived. The supply-chain depth
   is still the reason the work is good; it is no longer the pitch (D29). */
export const shapesHead = {
  index: '/ 02',
  eyebrow: 'The shapes I keep solving',
  title: 'Same problem, different size.',
  lede: 'A one-person shop and a global manufacturer hit the same handful of problems — only the nouns change. The tools below were built at both sizes, and the big ones are not what you are being sold: they are why the small one will hold up, and why it scales with you as you grow.',
};
export const toolsDoorway = {
  title: 'Open the full gallery — the one built for a local business first.',
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

/* ── S8 How I work — the method (condensed from /approach) ───────────────── */
export const process: Step[] = [
  {
    n: '01',
    title: 'Domain mastery',
    body: 'I’ve run the operation itself — the flow of material and the systems behind it, down to the planning and BOM mechanics most software is built without ever touching — so the problem is fully understood before a line of code exists.',
  },
  {
    n: '02',
    title: 'AI orchestration',
    body: 'I direct AI to turn that operator insight into real, version-controlled, deployable software — fast. Because the hard part is already solved, the distance between problem and shipped fix collapses: weeks for a focused tool, and at the fastest, under an hour from pain-point to deployed.',
  },
  {
    n: '03',
    title: 'Working software — that you own',
    body: 'What ships is working software people use on the floor — a tool, a full implementation, or just the fix itself — not decks they file. And you own what ships: codebases and data models that are yours to run and change — no per-seat license, no subscription holding the work hostage — like the tools running on this site.',
  },
];

/* ── S9 Working software vs. slideware ──────────────────────────────────── */
export const comparison = {
  left: {
    title: 'What AI consulting usually ends with',
    items: [
      'A strategy deck',
      'An “AI readiness” audit',
      'A roadmap and a vendor shortlist',
      'A prototype that dies after the demo',
    ],
  },
  right: {
    title: 'What I ship',
    items: [
      'A deployed tool your team opens Monday',
      'Built on your real workflow and data',
      'Owned, version-controlled, yours to keep',
      'Iterated in production, not filed away',
    ],
  },
};

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

/* ── S10 Who I help ─────────────────────────────────────────────────────── */
export const whoItsFor: Persona[] = [
  {
    title: 'The ops leader',
    body: 'You’ve got a problem the ERP never solved — and no appetite for a nine-month integration to maybe fix it.',
  },
  {
    title: 'The planner / operator',
    body: 'You’re carrying a manual workaround that should have been a tool years ago, and everyone just learned to live with it.',
  },
  {
    title: 'The systems owner',
    body: 'You need the gap between platforms filled without buying yet another seat-license product to babysit.',
  },
  {
    title: 'The owner on spreadsheets',
    body: 'You run lean — maybe no ERP at all — and the real operation lives in spreadsheets. You want it turned into a tool you own, then the system to run on, without renting a SaaS seat forever.',
  },
];

/* ── S11 Fit / not a fit ────────────────────────────────────────────────── */
export const fit = {
  fit: [
    'You’ve got a real operational problem — from one nagging gap to a whole system you need built',
    'You want to own what gets built and change it freely — not rent a seat forever',
    'You know how the work really runs — even if it lives in spreadsheets today',
    'You’re ready to actually put AI to work, not just talk about it',
  ],
  notFit: [
    'A big off-the-shelf product already does exactly what you need',
    'You want process and slideware — decks and discovery over software that actually ships',
    'You want a black-box platform to rent and never own',
    'No one on your side actually owns the outcome',
  ],
};

/* ── S12 FAQ ──────────────────────────────────────────────────────────────
   REWRITTEN 2026-09-12, and most of it was not merely stale.

   ONE ANSWER CONTRADICTED A PUBLISHED REFUSAL. "We're stuck with big-name
   software" replied "That's a classic fit" — while src/lib/capabilities.js
   refuses the categories a platform already owns outright, and prices
   connecting to a system you already run as separate work. The FAQ promised
   enthusiasm on the page where the comparison sheets publish a refusal, which
   is the worst kind of drift this site can carry: two surfaces, both confident,
   pointing opposite ways.

   ONE WAS AN UNFALSIFIABLE CLAIM. "Fast enough to surprise you", plus a tool
   built "in under an hour". The honesty contract everywhere else on this site
   is arithmetic a reader can check, and that answer was the one place the FAQ
   asked to be taken on faith. It now names only commitments that can be held
   against a date.

   FOUR CARRIED PRE-PIVOT POSITIONING that D29 and D33 retired — a progression
   up to "the custom system your business runs on" through ladder rungs removed
   on 2026-08-24, an enterprise IT-and-security-review frame, and AI as the
   thing that makes the practice possible rather than a tool it uses.

   AND THE CATALOG WAS SIMPLY ABSENT. Eleven questions named no price, no free
   check, no website build, no assessment, no monthly arrangement, no rescue
   audit, no shelf, and nothing this practice will not do. "Complete" was the
   operator's word for what was missing and it was the right one. */
export const faq: Faq[] = [
  {
    q: 'Is this real, or vaporware?',
    a: 'Real. Every tool on this site runs in your browser right now, on an invented town called Marker Nine — no login, nothing to install, and the arithmetic printed beside every number so you can check it rather than take my word for it. What I ship for you is the same software, fitted to your business and deployed into accounts in your name.',
  },
  {
    q: 'Can I try something before I talk to you?',
    a: 'Yes, and nothing here asks for an email first. The free check takes two numbers about your own paperwork and hands you a third back, with the arithmetic shown. Every tool on the shelf opens and runs. The Craven County deadline list is free and every row carries its source. If none of it is useful you have lost five minutes and given up nothing.',
  },
  {
    q: 'I’m small — no ERP, just spreadsheets. Is this for me?',
    a: 'Especially. The spreadsheet somebody is quietly holding together is the normal place this starts, not something to apologize for. I turn it into a tool that checks its own arithmetic and does not break when a row moves, and you own it outright at the end. No enterprise budget, and no system you have to already have.',
  },
  {
    q: 'What does it cost?',
    a: `Builds start at ${money(FLOOR_USD)} and a website build starts at ${money(WEBSITE_USD)}. Both are floors rather than quotes, and the scope is agreed in writing before anything begins. The assessment, the rescue audit and each monthly arrangement carry their own published figure on their own page — there is no price list to work through, because a price with no scope beside it is not information. Small work outside an agreed scope runs at the rate on your own rate card, which you read before you sign it.`,
  },
  {
    q: 'What will you not build?',
    a: 'There is a published list and it is on every comparison sheet I hand out, in two kinds kept apart on purpose. Some would make a promise you already hold in writing false: anything that sees a card or bank number, a seat on your Google listing, a system holding records that carry their own legal regime, legal or tax advice, a way into your computer when you are not sitting at it. The rest I could build and will not — sales tax by state, shipping worked out from a customer’s address, and the categories a platform you already pay for has taken. Where you need one of those, I will name the product that does it properly.',
  },
  {
    q: 'Do I actually own what you build?',
    a: 'Yes — outright. You get the codebase and the data model, deployed on accounts in your own name. No per-seat license, no subscription holding it hostage, and you are free to change it or hand it to any developer. You also get a single keep-forever file that runs offline, so the thing you paid for works with no internet and nothing of mine involved.',
  },
  {
    q: 'Where does it run — and what does hosting cost?',
    a: 'In accounts that belong to you. I set the hosting, code and database accounts up in your name — your email, your billing — and build as an invited collaborator you can remove at any time. A single tool usually runs free. A site with a database is a few dollars a month, paid by you straight to the providers at cost, with nothing added by me. An account your own customers log into is a different build and is quoted on its own, because it is the largest single step in cost of anything here. If I disappeared tomorrow, all of it keeps running.',
  },
  {
    q: 'We’re stuck with big-name software that won’t do what we need. Can you help?',
    a: 'Often, and the honest answer has two halves. The platform stays and I build the tool or the report around it, fitted to your operation instead of the average company it was designed for — and connecting to that platform is real work with its own price, named in the statement of work rather than assumed into a build. Where what you want is a category that platform has already taken — booking, invoicing, chasing payment, review requests, staff scheduling, waiting lists — I will not build you a worse version of it. I will tell you which product does it.',
  },
  {
    q: 'What if the software I already have is the problem?',
    a: `Then the first thing worth buying is a reading of it rather than a build. The rescue audit is a fixed price with a written answer inside ${RESCUE_AUDIT_DAYS} working days, and it can end with me telling you to keep what you have and change nothing. That happens, and it is a result rather than a wasted fee.`,
  },
  {
    q: 'It’s just you?',
    a: 'Yes, and you are never locked to me because of it. You work directly with the person building the thing, so what I know about how the work actually runs is not diluted through a delivery team — and because you own the codebase outright, any developer can pick it up and carry on. The bio is there if you want to know what that knowledge is and where it came from.',
  },
  {
    q: 'What about our data and security?',
    a: 'Your data stays yours, in your accounts. The tools on this site send nothing anywhere — what you type stays in your browser, and every one of them says so on its own face. I do not see, store or transmit card or bank numbers. I do not build systems holding records that carry their own legal regime, such as patient notes. And every remote session needs you present and letting me in, and it ends when you close it.',
  },
  {
    q: 'How fast?',
    a: `Fast is not a claim worth making in the abstract, so here are the ones you can hold me to instead. A message gets a reply ${REPLY_SHORT}. A rescue audit is a written answer inside ${RESCUE_AUDIT_DAYS} working days. Everything else is a date agreed in writing before it starts, because a deadline nobody wrote down is a hope. The part that takes the time is working out exactly what to build, and that happens before any code is written.`,
  },
  {
    q: 'Is there anything ongoing after the build, and do I have to?',
    a: 'You do not have to. What was built for you is yours and keeps working whether or not you ever message me again — stopping a monthly arrangement turns nothing off. If you would rather not be the one editing it, upkeep is a monthly fee with a stated limit on what it covers. There is also monthly advisory for a company that wants a direction rather than a build, and a monthly reading of whether AI assistants name your business when somebody asks. Each has its own page and its own published figure.',
  },
  {
    q: 'Do you only work with New Bern businesses?',
    a: 'No. New Bern and Craven County are home base and the first market, which is why they have a page of their own, and being local means the first conversation can happen at your counter. Nothing about the work needs us in the same room. A business anywhere can buy any of it.',
  },
  {
    q: 'What does a first engagement look like?',
    a: 'It starts with a conversation and that one is free. You tell me the specific problem your software never solved; I tell you straight how I would build the fix, or that I would not build it at all. From there it is scoped and quoted in writing, built against your real workflow, and handed over into your own accounts. Then you decide whether there is a second thing.',
  },
];

/* ── Proof slots — designed-for, EMPTY until real (never fabricate) ──────── */
// Fill with a real, consented quote: { quote, attribution, role }.
export const testimonial: { quote: string; attribution: string; role?: string } | null = null;
