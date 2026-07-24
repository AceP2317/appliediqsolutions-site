// Single source of truth for the long-scroll home page copy.
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

export interface Stat {
  value: string;
  label: string;
  caption: string;
  /** Optional size modifier class for the value (text phrases vs. big numbers). */
  valueClass?: string;
  /** Optional evidence link under the caption (e.g. the /projects ship log). */
  link?: { href: string; label: string };
}
export interface Gap {
  n: string;
  title: string;
  body: string;
}
export interface Capability {
  icon: CapabilityIcon;
  title: string;
  body: string;
  /** Slug (./demos.ts) of the live tool that demonstrates this problem-shape —
   *  renders an evidence link on the card. Omitted where no single tool proves
   *  it; never reach. */
  proofSlug?: string;
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
export interface Path {
  /** who this road is for — the mono "for who" label */
  forWho: string;
  title: string;
  body: string;
}
export interface Faq {
  q: string;
  a: string;
}

/* ── S1 Hero — the honest signal strip under the CTAs ───────────────────── */
// (Legacy: consumed by the now-unplaced Hero.astro. Kept so its import resolves.)
export const signalStrip: string[] = [
  'Deep supply-chain operations',
  `${toolCount} live tools on this site`,
  'Synthetic data · no login',
];

/* ── S1 Opener — light, operator-led headline with the vision layered in ──── */
// Operator credibility leads (label + headline + operator line); the vision rides
// underneath as a compact pullquote. `visionAccent` is the phrase rendered in the
// indigo→cyan brand gradient (must appear verbatim, once, inside `visionLead`).
export const opener = {
  label: 'Working software · not slideware',
  headline: 'I build the operational software your systems leave out.',
  operatorLine:
    'A supply-chain operator directing AI at the problems no product will solve.',
  visionLead:
    'Most teams will keep renting their software. The ones who move now will own it — built around how they actually run.',
  visionAccent: 'own it',
};

/* ── Opener local portal — the distinct doorway into /main-street ──────────── */
export const localPortal = {
  eyebrow: 'Local business · New Bern, NC',
  title: 'Enter the Main Street portal',
};

/* ── S3 Two ways in — the vision as a concrete offer (replaces gap/positioning) ─ */
export const pathsHead = {
  title: 'However your business runs today, there’s a way in.',
  lede: 'That workaround everyone ‘just learned to live with’ is still costing you every week. No ERP? Stuck with one you can’t bend? Both roads end at software built around your operation — that you own.',
};
export const paths: Path[] = [
  {
    forWho: 'Small · lean · spreadsheet-run',
    title: 'Your data, made into a live tool now — and a system you own.',
    body: 'No ERP or elaborate stack required. First, the tool that turns your spreadsheets into something live and actionable — a working AI product you use right away. Then, when you’re ready, the custom system your business runs on — CRM, ERP, whatever it needs — yours to own and change. No license, no subscription, no lock-in.',
  },
  {
    forWho: 'Established · big-name software',
    title: 'Stop fighting your software — I’ll make it do what you actually need.',
    body: 'Still running the same system the same way for years — and moving mountains to make it do one specific thing? That’s exactly what AI changes. I build the tool, process, or product tailored to your operation — not the average company the software was designed for.',
  },
];

/* ── S2 Proof bar — verifiable facts (the honest stand-in for a logo wall) ─ */
export const proofStats: Stat[] = [
  {
    value: String(toolCount),
    label: 'Live tools, running now',
    caption: 'Open any one in your browser — synthetic data, no login, nothing to install.',
  },
  {
    value: 'End-to-end',
    valueClass: 'stat-value--phrase',
    label: 'Supply-chain operations',
    caption: 'Planning, sourcing, production, logistics, inventory. The problem understood before any code.',
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

/* ── S3 The gap — the wedge, stated as a market-wide problem ─────────────── */
export const gaps: Gap[] = [
  {
    n: '01',
    title: 'The tools don’t know your operation.',
    body: 'Generic AI ships generic software. The fix has to come from someone who has actually run the operation — in operational terms, not a spec.',
  },
  {
    n: '02',
    title: 'The big systems leave gaps on purpose.',
    body: 'ERPs are built for the 80% case. The 20% that’s specific to your floor is exactly where the pain lives — and where no vendor will ever build for you.',
  },
  {
    n: '03',
    title: 'Advice doesn’t run on the floor.',
    body: 'Decks, audits, and roadmaps don’t move material. Working software does — it’s the only deliverable that changes Monday.',
  },
];

/* ── S4 Positioning line ────────────────────────────────────────────────── */
export const positioning =
  'I turn deep, hands-on experience running supply-chain operations into AI velocity — and point it at the hardest, most specific problems your software was never going to touch.';

/* The moat rows lived here until 2026-07-13. They gave three tools a full-width
   row each — and LiveTools then listed all seven again on the same page, with
   the same names and the same blurbs. The claim ("where I go deepest: supply
   chain") survives, in LiveTools' header. The duplicate listing does not. */

/* ── S6 Breadth (secondary) — problem-shapes generalized from the real tools ─ */
export const capabilities: Capability[] = [
  {
    icon: 'puzzle',
    title: 'The tool your system left out',
    body: 'The bespoke connective tissue between platforms that no vendor will ever build for you.',
  },
  {
    icon: 'scan-search',
    title: 'Hidden-error & integrity triage',
    body: 'Surfacing the wrong data a clean-looking summary hides — before it costs you downstream.',
    proofSlug: 'staging-triage-console',
  },
  {
    icon: 'radar',
    title: 'Signal from noise',
    body: 'Turning a daily flood of updates into a ranked worklist of what actually needs action today.',
    proofSlug: 'asn-update-radar',
  },
  {
    icon: 'activity',
    title: 'Volatility & drift detection',
    body: 'Measuring how much something is really moving, and attributing why — real change, not noise.',
    proofSlug: 'production-plan-churn',
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
