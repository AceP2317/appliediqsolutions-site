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
export type OfferIcon = 'globe' | 'table' | 'wrench';

export interface Offer {
  icon: OfferIcon;
  title: string;
  body: string;
  /** ONE REAL JOB, in a trade Ian has actually worked. This field is the whole
   *  difference between a category and an instance: "any custom tool your
   *  business needs" is invisible because the reader has to imagine themselves
   *  into it, and they will not. A named job does that work for them.
   *
   *  NOTHING HERE MAY BE INVENTED. Every line below describes work from the
   *  career recorded in docs/career-record.md. A fabricated example on a page
   *  whose whole argument is "I have actually done this" would be the single
   *  worst thing this site could carry. */
  instance: string;
}

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
   stays as reassurance inside the offers and stops pretending to be proof. */
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
     no behaviour change, and this comment carries the meaning — the same
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
    'The Tip-Out Sheet — a night’s tips split across a bar’s own rules, with every figure showing the arithmetic beside it.',
  facts: [
    { v: String(shelfCount), k: 'Finished tools' },
    { v: 'Yours', k: 'To own outright' },
    { v: 'None', k: 'Accounts or logins' },
    { v: 'Nothing', k: 'Leaves your browser' },
  ],
};

/* ── What I build — the three offers ─────────────────────────────────────────
   Moved here from main-street.astro when / became the pitch: this file is now
   their canonical home, and /main-street/ no longer carries the grid. */
export const offersHead = {
  index: '/ 01',
  eyebrow: 'What I build for you',
  // WAS "Yours to own — not rented, not borrowed." Retired 2026-08-24: a
  // national shop publishes that claim almost verbatim at a fixed price, on
  // pages already generated for Greenville and Kinston. Ownership is table
  // stakes in this category, so it lives inside each offer as reassurance and
  // stops pretending to be the reason to choose anyone.
  title: 'Three shapes. I have needed all three myself.',
  lede: 'You don’t need to know what to build, or how. Tell me where your business is and where you want it to be — I work out the rest. Every one of these is work I have actually done, in a trade I have actually run.',
};
export const offers: Offer[] = [
  {
    icon: 'globe',
    title: 'A real website you own',
    body: 'Not a rented template, and not a page on somebody else’s platform. A site that is yours outright — one you can change, grow, or hand to any developer, and never pay rent on.',
    instance: 'For a business running on a Facebook page and a phone number.',
  },
  {
    icon: 'table',
    title: 'The spreadsheet, turned into something that works',
    body: 'The part of the operation you run by hand — the orders, the jobs, the stock, the schedule. It becomes a live tool built around how you already work, rather than a system you have to bend to fit.',
    instance: 'I ran a bar program out of one of these. Pour cost, par levels, and a Sunday-night count that took two hours.',
  },
  {
    icon: 'wrench',
    title: 'The one thing nobody sells software for',
    body: 'A quote builder, a booking flow, a reminder that goes out on its own, an hour of copying between two systems that stops happening. If it can be built, it gets built around exactly how you work — and it is yours to keep.',
    instance: 'A clinic’s front desk, a lending team’s day-to-day, a plant’s reorder logic. Same problem, three buildings.',
  },
];

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
   and each one was saying something a neighbouring section already said.

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
    atShop: 'The month that balances on paper because two mistakes quietly cancelled each other out.',
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
   Naming them is deliberate: "a rented template" is a category nobody recognises
   themselves in, and the whole persuasive weight sits in the specifics.

   ONE ARGUMENT IS DELIBERATELY ABSENT AND MUST STAY ABSENT — that builder sites
   are slow. They are not. Measured 2026-09-03, default-template mobile Core Web
   Vitals pass rates run Wix 80.7%, Squarespace 70.2%, WordPress 49.3%. A speed
   claim here would be disprovable by any prospect with a free testing tool, on
   the one site whose entire product is an honesty contract. */
export const websiteComparison = {
  left: {
    title: 'A template subscription',
    items: [
      'You rent it, and the rent never stops',
      'Leaving means rebuilding — Wix exports no design, no layout, no pages',
      'Stop paying and it goes dark: Squarespace expires a site 15 days past due',
      'Nothing of yours fits inside it — GoDaddy has no app market at all',
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

/* ── S12 FAQ ────────────────────────────────────────────────────────────── */
export const faq: Faq[] = [
  {
    q: 'Is this real, or vaporware?',
    a: 'Real. Every tool on this site runs in your browser right now — synthetic data, no login, nothing to install. What I ship for you is the same: deployed software, not a prototype that dies after the demo.',
  },
  {
    q: 'I’m small — no ERP, just spreadsheets. Is this for me?',
    a: 'Especially. You don’t need big systems to start — your spreadsheets are enough. First I build the tool that turns them into something live and actionable — a working AI product you can use right away; then, when you’re ready, the custom system your business runs on — one you fully own. No enterprise budget required.',
  },
  {
    q: 'We’re stuck with big-name software that won’t do what we need. Can you help?',
    a: 'That’s a classic fit. The platform stays — I build the tool, process, or integration around it that makes it do the specific thing you need, tailored to your operation instead of the average company it was designed for. AI is what finally makes that practical.',
  },
  {
    q: 'Do I actually own what you build?',
    a: 'Yes — outright. You get the codebase and the data model, deployed on infrastructure you control. No per-seat license, no subscription holding it hostage, and you’re free to change it or hand it to anyone. You own it, not rent it.',
  },
  {
    q: 'Where does it run — and what does hosting cost?',
    a: 'In accounts that belong to you. Standard onboarding: I set up the hosting, code, and database accounts in your name — your email, your billing — and build as an invited collaborator you can revoke anytime. A single tool typically runs free on modern hosting; a full system with logins and a database usually costs a few dollars a month, paid by you directly to the providers — at cost, no markup, no middleman. If I disappeared tomorrow, everything keeps running.',
  },
  {
    q: 'It’s just you?',
    a: 'Yes — and that’s the point. The domain insight isn’t diluted through a delivery team, and AI is the leverage that lets one operator who knows the problem cold ship production software fast. You work directly with the person building it — and because you own the codebase outright, you’re never locked to me: hand it to any developer and they can run with it.',
  },
  {
    q: 'What about our data and security?',
    a: 'Your data stays yours. I build on your real data models, with access controls and audit trails where they matter, and I’m happy to work inside your IT and security review. Nothing here requires handing sensitive data to a third party.',
  },
  {
    q: 'What do you build on?',
    a: 'Owned, version-controlled codebases — modern web stacks, real data models, deployed to infrastructure you control. No black-box platform, no per-seat license trapping you. You own what I ship.',
  },
  {
    q: 'How fast?',
    a: 'Fast enough to surprise you. The hard part — knowing exactly what to build — is solved before any code is written, so the build itself is quick. A focused first tool is usually weeks, not quarters — and at the fastest, some of the tools on this site went from pain-point to a working, deployed tool in under an hour. That’s what domain depth plus AI velocity buys you.',
  },
  {
    q: 'Is it always a custom tool?',
    a: 'No. A tool is the most common output, but the work spans the whole range — a full implementation, system integration, or pure problem-solving: troubleshooting and root-cause analysis when the question is “why is this broken,” not “build me something new.” I take on whatever the operational problem actually needs.',
  },
  {
    q: 'What does a first engagement look like?',
    a: 'It starts with a conversation, and that one is free — you tell me the hard, specific problem your software never solved, and I tell you straight how I’d build the fix. From there I scope it, quote it, build a working tool against your real workflow, and you put it to use — then we iterate or expand from there.',
  },
];

/* ── Proof slots — designed-for, EMPTY until real (never fabricate) ──────── */
// Fill with a real, consented quote: { quote, attribution, role }.
export const testimonial: { quote: string; attribution: string; role?: string } | null = null;
