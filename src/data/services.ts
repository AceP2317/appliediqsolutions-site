// Single source for the Services page.
//
// PRICING NOTE: quote-based throughout — there are NO published prices here, by
// the operator's deliberate (premium) choice. Concreteness comes from precise
// inclusions + the pricing-transparency notes below, never from a number. So
// nothing in this file is fabricated; if real ranges are ever wanted, the
// structure already holds them.

export type BuildIcon = 'wrench' | 'layers' | 'database' | 'plug' | 'sparkles';

export interface Build {
  icon: BuildIcon;
  title: string;
  body: string;
}
export interface Model {
  title: string;
  tagline: string;
  includes: string[];
}
export interface PricingNote {
  title: string;
  body: string;
}

/* ── What I build — the deliverable ladder (one tool → a full system) ─────── */
export const builds: Build[] = [
  {
    icon: 'wrench',
    title: 'A single tool',
    body: 'The signature: one focused tool that fixes the exact operational gap your systems left open. The fastest of these have gone from pain-point to deployed in under an hour.',
  },
  {
    icon: 'layers',
    title: 'A tool suite',
    body: 'Several tools built to work together — a connected set that covers a whole workflow instead of a single step. Same bespoke fit, more ground covered.',
  },
  {
    icon: 'database',
    title: 'A full system you own',
    body: 'When a spreadsheet or an off-the-shelf platform has run its course: a custom system your business actually runs on — CRM, ERP-class, whatever it needs — built around your operation and owned outright by you.',
  },
  {
    icon: 'plug',
    title: 'Integration & implementation',
    body: 'Make the software you already run do what you need. I wire AI, tools, and data into your existing stack — the connective tissue and the implementation work the big platforms leave to you.',
  },
  {
    icon: 'sparkles',
    title: 'Something else entirely',
    body: 'Troubleshooting, root-cause analysis, a process redesign, a one-off automation — if it doesn’t fit a box, that’s usually the one most worth solving. Tell me the problem; I’ll tell you straight how I’d solve it.',
  },
];

export interface LadderRung {
  n: string;
  name: string;
  forWhom: string;
  includes: string[];
}
export interface LadderBand {
  label: string;
  rungs: LadderRung[];
}

/* ── How we work together — one-off Project + a 6-rung ongoing ladder ─────── */
// All quote-based (no price). The ladder mirrors the company vision: a visitor
// climbs it as they grow — from sole-prop (Foundation) to enterprise (Strategic).
export const projectModel: Model = {
  title: 'Project',
  tagline: 'A single defined build — the no-commitment way in.',
  includes: [
    'Fixed scope, agreed before any work begins',
    'A fixed quote — you know the number up front, no meter running',
    'Built, deployed, and handed over — yours to own',
  ],
};

export const ladder: LadderBand[] = [
  {
    label: 'Just starting',
    rungs: [
      {
        n: '1',
        name: 'Foundation',
        forWhom: 'the solo operator just getting started',
        includes: [
          'Your data turned into a working tool — and kept running',
          'A real website you own, if you need one — not a Facebook page, not a rented template',
          'A light monthly touch — small fixes and tweaks as they come up',
          'Everything yours outright — no subscription, no lock-in',
        ],
      },
      {
        n: '2',
        name: 'Growth',
        forWhom: 'the small business with recurring needs',
        includes: [
          'A steady monthly block of build capacity — a new tool or two, plus ongoing iteration',
          'Your spreadsheets and manual workarounds turned into real tools, one by one',
          'Priority over one-off requests, and a standing line for “can you make it do X?”',
          'Everything documented and owned by you as it ships',
        ],
      },
    ],
  },
  {
    label: 'Established',
    rungs: [
      {
        n: '3',
        name: 'Scale',
        forWhom: 'the operation running several workflows that should connect',
        includes: [
          'A connected suite of tools, not just one-offs — built and maintained as a set',
          'Integration with the systems you already run (ERP, CRM, whatever’s in place)',
          'Regular cadence and faster turnaround',
          'Continuous iteration, so nothing you rely on goes stale',
        ],
      },
      {
        n: '4',
        name: 'Backbone',
        forWhom: 'the mid-sized business ready to own its core system',
        includes: [
          'The full custom system your business runs on — CRM, ERP-class, whatever it needs — built and owned',
          'Run as a dedicated program, with multiple workstreams in parallel',
          'The move off spreadsheets and rented platforms, for good',
          'Yours outright — the system, the data model, the codebase, all of it',
        ],
      },
    ],
  },
  {
    label: 'At scale',
    rungs: [
      {
        n: '5',
        name: 'Embedded',
        forWhom: 'the larger company that wants a build capability on tap',
        includes: [
          'I’m effectively part of your team — continuous building, not a request queue',
          'Deep integration into your stack — the connective tissue the big platforms leave out',
          'Troubleshooting, root-cause analysis, and implementation on demand',
          'Near-immediate responsiveness and standing availability',
        ],
      },
      {
        n: '6',
        name: 'Strategic',
        forWhom: 'the enterprise shaping where AI goes across the operation',
        includes: [
          'A strategic partnership — shaping the path, scope, and roadmap for AI across your operation',
          'Implementations led end-to-end, across teams and regions',
          'The full arc: from “what should we even build” to shipped, owned software',
          'A long-term relationship, not a transaction',
        ],
      },
    ],
  },
];

/* ── How pricing works — the premium "concrete, not vague" without numbers ──── */
export const pricingNotes: PricingNote[] = [
  {
    title: 'A fixed quote, before any work',
    body: 'Every engagement starts with a scoped, fixed quote. You know the number before a line of code is written — no open meter, no surprise invoice.',
  },
  {
    title: 'What shapes it',
    body: 'Scope, complexity, and whether it’s a one-off build or an ongoing arrangement — honest inputs, not a generic rate sheet.',
  },
  {
    title: 'You own everything',
    body: 'Codebases and data models, in accounts set up in your name — your email, your billing, infrastructure you control. No per-seat license, no subscription holding your own tools hostage.',
  },
  {
    title: 'Why there’s no price list',
    body: 'The right number depends on your problem, not a category. I’d rather scope it honestly than anchor you to a figure built for the average company instead of yours.',
  },
];
