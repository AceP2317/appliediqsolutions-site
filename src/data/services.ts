// Single source for the Services page.
//
// Imports plain .js on purpose — see the header of src/lib/pricing.js.
//
// PRICING NOTE, REWRITTEN 2026-08-24 — D5 AMENDED, AND REWRITTEN AGAIN
// 2026-09-03. THIS SAID "exactly ONE published number" AND THERE ARE NOW THREE:
// builds start at $2,500, the AI Fit Assessment is $1,000, and a website build
// starts at $4,500. Each prices a different product, which is what keeps it off
// being a menu — a menu is several prices for one thing. Everything past that
// entry point is still a fixed quote agreed before any work, which is the half
// of D5 that was doing real work and which survives untouched.
//
// WHY THE CHANGE. Nine of the twelve providers in these counties publish no
// price at all. The three that do are the ones appearing with a figure in search
// results, and researchers watched a buyer reject a service in thirty-five
// seconds purely for not stating its rate. A visitor who cannot tell whether
// they can afford you does not ask — they leave.
//
// THE NUMBER IS A FLOOR, NEVER A QUOTE. It says "you are in the right place" and
// nothing else. Do not let it drift into an implied price for a specific job.

import {
  FLOOR_USD,
  FLOOR_QUALIFIER,
  ASSESSMENT_USD,
  ASSESSMENT_QUALIFIER,
  WEBSITE_USD,
  WEBSITE_QUALIFIER,
} from '../lib/pricing.js';
import { money } from '../lib/format.js';

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
  /* RUNGS 5 AND 6 WERE REMOVED 2026-08-24.
     They described an embedded build capability and an enterprise AI partnership
     — engagements this practice is not selling and that D29 explicitly defers.
     Leaving them up asked a two-person shop to scroll past six tiers hunting for
     the one that was theirs, and it quietly contradicted the page above it.

     They are not lost: the structure holds them and the words are in git. Put
     them back when there is an actual engagement of that shape to sell, not
     before. */
];

/* THE ONE PUBLISHED NUMBER. Kept as data rather than typed into a page so it
   cannot end up saying two different things on two surfaces — which is exactly
   what happened to the home page headline and its share card.

   The DIGITS now live in src/lib/pricing.js and every string here is derived
   from them. Before that, this file held '$2,500' as text while CostCheck.jsx
   held 2500 as a number and divided by it — so the page could have quoted one
   figure while the arithmetic beneath it used another, with nothing reporting
   the disagreement. One number, one place, three consumers. */
export const startingPrice = {
  amount: money(FLOOR_USD),
  line: `Builds start at ${money(FLOOR_USD)}.`,
  qualifier: FLOOR_QUALIFIER,
  /* WHAT THE FLOOR NOW POINTS AT, added 2026-08-25 with the shelf.
     D5-amended publishes exactly one number and this does not add a second — it
     gives the existing one a referent. Before the shelf the floor was an abstract
     entry threshold on a page of abstractions; now it names a finished thing a
     visitor has already driven in their own browser and can have in days.
     Travels in the same object as the figure and the qualifier, so no surface
     can show the price without the distinction. */
  shelf:
    'That is what a finished tool off the shelf costs, fitted to your business. Built from nothing, it is scoped and quoted first.',
};

/* THE SECOND PUBLISHED NUMBER, added 2026-09-03 with the AI Fit Assessment.

   Built in the same shape as startingPrice above and for the same reason: the
   figure and the sentence that qualifies it travel in one object, so no surface
   can render a price without what happens to it. Here that matters more than it
   does above, because the half a page would be tempted to drop -- that the fee
   comes off the build -- is the half that stops the assessment competing with
   the thing it recommends.

   THE TWO ARE DIFFERENT KINDS OF NUMBER and the copy must keep saying so. The
   floor is a starting point for a build; this is the entire cost of a finished
   piece of work. Writing "starts at" beside this one would turn two products
   with one price each into a menu, which is what the last pricing note on this
   page explains the practice does not publish. */
export const assessmentPrice = {
  amount: money(ASSESSMENT_USD),
  line: `The AI Fit Assessment is ${money(ASSESSMENT_USD)}.`,
  qualifier: ASSESSMENT_QUALIFIER,
};

/* THE THIRD PUBLISHED NUMBER, added 2026-09-03, and it exists to repair
   something the other two were quietly breaking.

   "Builds start at $2,500" is the floor for a fitted shelf tool, and it renders
   on seven pages with no referent on six of them. A visitor reading it on the
   contact page has no way to know it does not describe a website, and a website
   is the thing most of them arrive wanting. D55 saw this on 2026-08-30 and
   answered it with a disclaiming sentence saying a site "carries its own
   number", which leaves a reader knowing only that it is more than $2,500 —
   true, unhelpful, and it reads as evasion to anybody comparing three quotes.

   IT IS A SECOND FLOOR, NOT A TIER OF THE FIRST. Both are floors and they belong
   to different products, so "starts at" is correct on both and neither is the
   other's upgrade. The published build floor does NOT move to meet this one;
   raising it was rejected on evidence, because it would price the shelf out of
   reach and the shelf is the volume.

   THE QUALIFIER CARRIES THE SCOPE AND THAT IS WHY IT IS LONGER THAN THE OTHER
   TWO. The whole argument for $4,500 over a $16-a-month subscription is the six
   things it buys, so a page rendering the figure without them has published the
   objection and not the answer. */
export const websitePrice = {
  amount: money(WEBSITE_USD),
  line: `A website build starts at ${money(WEBSITE_USD)}.`,
  qualifier: WEBSITE_QUALIFIER,
};

/* ── How pricing works — one number, then honest scoping ──────────────────── */
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
    // REPLACED 2026-08-24, and again 2026-09-03. The 2026-08-24 note was titled
    // "Why there's no price list" and stopped being true the moment a number
    // went on the page. Its replacement was titled "Why there's one number and
    // not a menu" and stopped being true the moment there were three. Both
    // failed the same way: a note explaining the price list argued from a count
    // that nothing recomputes, so it went stale on the next decision. This one
    // argues from the RULE instead, which is what actually holds.
    title: 'Why each price belongs to one thing',
    body: 'Three numbers on this site, and each is the whole price of a different product rather than a tier of the same one. That is the difference between a price and a menu: a menu asks you to pick a version of yourself, and every figure on it is set by what the average company will pay. Past the number that applies to you, the right figure depends on your problem, so it gets scoped honestly.',
  },
];
