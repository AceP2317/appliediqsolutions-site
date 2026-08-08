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

import { demos } from './demos';

const toolCount = demos.length;

export type CapabilityIcon = 'puzzle' | 'scan-search' | 'radar' | 'activity';
export type OfferIcon = 'globe' | 'table' | 'wrench';

export interface Offer {
  icon: OfferIcon;
  title: string;
  body: string;
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

/* ── S1 Opener — the offer, stated first ──────────────────────────────────────
   Since D29 this page IS the pitch, not a welcome hub: a visitor arriving from
   Google, a business card, or Nextdoor must read the offer before they read a
   menu. The headline is the geography-free twin of /main-street's — that page
   keeps "built for Main Street", this one serves a small business anywhere.
   `visionAccent` is the phrase rendered in the indigo→cyan brand gradient and
   MUST appear verbatim, exactly once, inside `visionLead` — Opener.astro splits
   the string on it, and a mismatch renders `undefined` silently. */
export const opener = {
  label: 'Custom software · yours to own',
  headline: 'Big-company software, built for your business.',
  operatorLine:
    'Custom tools built around exactly how you actually work — and you own them outright.',
  // Do NOT open this with "For years, real custom software was something only
  // big companies could afford" — that is the opening sentence of
  // /main-street/'s /01, and the verbatim echo was a measured 78-char duplicate
  // between the two pages. They make the same argument; they must not use the
  // same words.
  visionLead:
    'Custom-built software used to be a big-company luxury. That ended, and the businesses moving now will own what they run on instead of renting it forever.',
  visionAccent: 'own what they run on',
};

/* ── Opener local portal — the doorway into /main-street ─────────────────────
   New Bern is home base and first market, not a fence (D29). The tile is the
   geographic door for the visitors it IS about; everyone else keeps scrolling
   into an offer that already applies to them. */
export const localPortal = {
  eyebrow: 'Home base · New Bern, NC',
  title: 'In New Bern? Start on Main Street.',
};

/* ── S2 Proof bar header — the credential, framed as a reason to trust ────────
   The manufacturer stays (D8: a credential, stated generically, never a client)
   but it is no longer a competing pitch — it is why the small-business tools
   are worth trusting. Do NOT soften this into small-business language: that
   either deletes the only real credential the practice has, or starts implying
   the employer is a client. */
export const proofHead = {
  lede: 'Built by an operator who does this daily at industrial scale — inside a major manufacturer — and points the same tooling at the businesses that were never going to get software this good.',
  claim: 'No mockups. The tools on this site are running in your browser right now.',
};

/* ── S2 Proof bar — verifiable facts (the honest stand-in for a logo wall) ─ */
export const proofStats: Stat[] = [
  {
    value: String(toolCount),
    label: 'Live tools, running now',
    caption: 'Open any one in your browser — synthetic data, no login, nothing to install.',
  },
  {
    value: 'Zero',
    label: 'Spec required',
    caption: 'You say where your business is and where you want it to be. Working out what to build is my job — it’s the part that’s actually hard.',
  },
  {
    value: '100%',
    label: 'Owned & deployed',
    caption: 'Version-controlled codebases on infrastructure you control. No black-box platform.',
  },
  {
    value: 'Hours',
    label: 'Pain-point to deployed',
    caption: 'Some tools here went from problem to deployed in under an hour. Knowing what to build is the hard part — and it’s solved first.',
    link: { href: '/projects/#ship-log', label: 'See the receipts' },
  },
];

/* ── The lead offer — Review Autopilot (D25/D29) ──────────────────────────────
   Canonical home for this copy since the home page became the pitch. The same
   product is described on /main-street/ in New Bern framing; the two must not
   share a body verbatim (that is the cannibalization risk), but the AUTOPILOT
   RULE is required on every surface that describes it and is the deliberate
   exception — positives post automatically, negatives are always held. Never
   say the drafting is "trained"; the demo's replies are pre-written samples. */
export const leadOffer = {
  eyebrow: 'The lead offer · live demo · no login',
  name: 'Review Autopilot',
  tagline: 'Every review answered, in your voice — and you keep the final say.',
  body: 'Reviews land on Google, Yelp, and Facebook whether you’re watching or not. Review Autopilot puts them all in one queue and drafts a reply to every one in your voice — happy customers get thanked automatically, and anything negative is always held for you. Nothing critical goes out without your say. Try it below as five different businesses; one of them will look like yours.',
  cta: { label: 'Try the live demo', href: '/work/review-autopilot/' },
  shot: '/shots/review-autopilot.webp',
  shotAlt:
    'The Review Autopilot console — a review queue with drafted replies and the Autopilot toggle, shown as a family auto-repair shop.',
  facts: [
    { v: '3', k: 'Review platforms' },
    { v: '5', k: 'Business types' },
    { v: 'Auto', k: 'Positives posted' },
    { v: 'Held', k: 'Negatives — for you' },
  ],
};

/* ── What I build — the three offers ─────────────────────────────────────────
   Moved here from main-street.astro when / became the pitch: this file is now
   their canonical home, and /main-street/ no longer carries the grid. */
export const offersHead = {
  index: '/ 01',
  eyebrow: 'What I build for you',
  title: 'Yours to own — not rented, not borrowed.',
  lede: 'You don’t need to know what to build, or how. Tell me where your business is and where you want it to be; I build the way there, and it belongs to you at the end.',
};
export const offers: Offer[] = [
  {
    icon: 'globe',
    title: 'A real website you own',
    body: 'Not a rented template, not a page on someone else’s platform. A real site that’s yours outright — one you can change, grow, or hand to anyone, and never pay rent on forever.',
  },
  {
    icon: 'table',
    title: 'Your spreadsheets, turned into a live tool',
    body: 'The operation you run by hand — quotes, jobs, inventory, scheduling — made into something live you actually use. Your data, made into a working tool now, no enterprise stack required.',
  },
  {
    icon: 'wrench',
    title: 'Any custom tool your business needs',
    body: 'A booking tool, a quote builder, an inventory tracker, a workflow that erases an hour of busywork a day — whatever saves you time or money. If it can be built, I build it around exactly how you work. Yours to keep.',
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
  lede: 'A one-person shop and a global manufacturer hit the same handful of problems — only the nouns change. Most of the tools below were built for a supply-chain operation running at real scale, which is not what you’re being sold: it’s why the tool built for you will hold up, and why it scales with you as you grow.',
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
    proofSlug: 'review-autopilot',
    atShop: 'Every Google, Yelp, and Facebook review in one queue, each with a reply already written in your voice.',
    atScale: { href: '/work/asn-update-radar/', label: 'ASN Update Radar' },
  },
  {
    icon: 'scan-search',
    title: 'Hidden-error & integrity triage',
    body: 'Surfacing the wrong data a clean-looking summary hides — before it costs you downstream.',
    proofSlug: 'staging-triage-console',
    atShop: 'The month that balances on paper because two mistakes quietly cancelled each other out.',
  },
  {
    icon: 'activity',
    title: 'Volatility & drift detection',
    body: 'Measuring how much something is really moving, and attributing why — real change, not noise.',
    proofSlug: 'production-plan-churn',
    atShop: 'The schedule that gets torn up every week, with nobody able to say what actually changed.',
  },
  {
    icon: 'puzzle',
    title: 'The tool your system left out',
    body: 'The bespoke connective tissue between platforms that no vendor will ever build for you.',
    atShop: 'The part of the job that lives in a spreadsheet, a text thread, and somebody’s memory.',
  },
];

// Honest capability areas (capabilities, NOT industry claims). Editable.
export const capabilityAreas: string[] = [
  'Internal tools & system integration',
  'End-to-end implementations & solution suites',
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
    a: 'Fast enough to surprise you. The hard part — knowing exactly what to build — is solved before any code is written, so the build itself is quick. A focused first tool is usually weeks, not quarters — and at the fastest, some of the tools on this site went from pain-point to a working, deployed solution in under an hour. That’s what domain depth plus AI velocity buys you.',
  },
  {
    q: 'Is it always a custom tool?',
    a: 'No. A tool is the most common output, but the work spans the whole range — a full implementation or solution suite, system integration, or pure problem-solving: troubleshooting and root-cause analysis when the question is “why is this broken,” not “build me something new.” I take on whatever the operational problem actually needs.',
  },
  {
    q: 'What does a first engagement look like?',
    a: 'It starts with a conversation, and that one is free — you tell me the hard, specific problem your software never solved, and I tell you straight how I’d build the fix. From there I scope it, quote it, build a working tool against your real workflow, and you put it to use — then we iterate or expand from there.',
  },
];

/* ── Proof slots — designed-for, EMPTY until real (never fabricate) ──────── */
// Fill with a real, consented quote: { quote, attribution, role }.
export const testimonial: { quote: string; attribution: string; role?: string } | null = null;
