// Single source for the Services page.
//
// Imports plain .js on purpose — see the header of src/lib/pricing.js.
//
// PRICING NOTE, REWRITTEN 2026-08-24 — D5 AMENDED, REWRITTEN 2026-09-03, AND THE
// COUNT TAKEN OUT ON 2026-09-11. It said "exactly ONE published number", then
// "THREE", and named them; by then it had been wrong twice and was wrong again
// within a week. **NO COUNT OF PUBLISHED FIGURES IS WRITTEN HERE** — read
// src/lib/pricing.js, which is the only file that holds them, or grep it for
// `export const` and a digit.
//
// THE ARGUMENT IS WHAT SURVIVES, AND IT NEVER DEPENDED ON THE NUMBER. Each figure
// prices a DIFFERENT product, which is what keeps this off being a menu — a menu
// is several prices for one thing. Everything past an entry point is still a fixed
// quote agreed before any work begins, which is the half of D5 that was doing real
// work and which survives untouched.
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
  ASSESSMENT_VIDEO_USD,
  ASSESSMENT_ONSITE_USD,
  ASSESSMENT_VIDEO_LENGTH,
  ASSESSMENT_ONSITE_LENGTH,
  ASSESSMENT_CREDIT_USD,
  ASSESSMENT_VIDEO_QUALIFIER,
  ASSESSMENT_ONSITE_QUALIFIER,
  WEBSITE_USD,
  WEBSITE_QUALIFIER,
  ADVISORY_MONTHLY_USD,
  ADVISORY_MINIMUM_MONTHS,
  ADVISORY_QUALIFIER,
  RESCUE_AUDIT_USD,
  RESCUE_AUDIT_DAYS,
  RESCUE_AUDIT_QUALIFIER,
  UPKEEP_MONTHLY_USD,
  UPKEEP_INCLUDED_MINUTES,
  UPKEEP_QUALIFIER,
  VISIBILITY_MONTHLY_USD,
  VISIBILITY_QUALIFIER,
} from '../lib/pricing.js';
import { money } from '../lib/format.js';

export type BuildIcon = 'wrench' | 'layers' | 'database' | 'plug' | 'sparkles';

export interface Build {
  icon: BuildIcon;
  title: string;
  body: string;
  /** ONE REAL JOB, in a trade the operator has actually worked. Grafted here from
   *  `Offer` in src/data/home.ts on 2026-09-11, when the home page's three-shapes
   *  section was cut and the operator chose to move its career lines rather than
   *  its card bodies — the five cards below already cover the same ground in their
   *  own words, and the lines were the half no competitor can publish.
   *
   *  NOTHING HERE MAY BE INVENTED. Every line describes work from the career in
   *  docs/career-record.md. A fabricated example on a page whose whole argument is
   *  "I have actually done this" would be the worst thing this site could carry.
   *  That rule came across from home.ts with the field and is not softened.
   *
   *  THE FIELD IS OPTIONAL BECAUSE THREE CARDS HONESTLY HAVE NONE, and that is the
   *  finding rather than a gap left by laziness. Three real lines existed and five
   *  cards wanted one. The bar program is a single tool and the clinic-lending-plant
   *  trio is work that fit no box; the third line — "a business running on a Facebook
   *  page and a phone number" — is about having no website at all, so it went to
   *  /websites/ where it was always the subject. A suite, a full system and
   *  integration work get NO line, because inventing one is the only way to give
   *  them one. An absent instance is the honest state and reads as ordinary; a
   *  plausible invented one would read exactly like the true ones beside it. */
  instance?: string;
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
    instance: 'I ran a bar program out of one of these. Pour cost, par levels, and a Sunday-night count that took two hours.',
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
    instance: 'A clinic’s front desk, a lending team’s day-to-day, a plant’s reorder logic. Same problem, three buildings.',
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

/* THE AI FIT ASSESSMENT — TWO FORMS, TWO FIGURES, AND THE BUYER PICKS NEITHER.

   Built in the same shape as startingPrice above and for the same reason: a
   figure and the sentence qualifying it travel in one object, so no page can
   render a price without what happens to it. That matters more here than
   anywhere else on the site, because the half a page would drop — that the fee
   comes off the build — is the half stopping the assessment competing with the
   thing it recommends.

   THE FLAT .line AND .qualifier FIELDS ARE GONE ON PURPOSE, 2026-09-06. Every
   page that quoted this now has to say WHICH FORM it means, and a stale consumer
   fails the build rather than rendering the wrong figure or nothing at all. That
   is the same enforcement the qualifier already had, one level out.

   `rule` IS THE LOAD-BEARING FIELD. It is what turns two prices into two forms
   of one product instead of a menu, and it exists once here because
   docs/engagement/agreements/assessment-agreement.md states the same rule in
   prose and the two must not drift. src/lib/pricing.js carries the full
   argument; the short version is that a menu asks the buyer to pick a version of
   themselves, and nobody picks here.

   THE TWO KINDS OF NUMBER ARE STILL DIFFERENT and the copy must keep saying so.
   The floor is a starting point for a build; these are the entire cost of a
   finished piece of work. Writing "starts at" beside either would collapse the
   distinction the last pricing note on this page rests on. */
export const assessmentPrice = {
  /* Printed on /ai-fit/ between the two figures, so a reader works out which one
     applies to them before they make contact. A page that prints the figures
     without this is a menu. */
  rule:
    'You do not pick which one. It follows from where the work that is slowing you down actually happens. '
    + 'On a screen — a booking system, a spreadsheet, an invoicing tool — we do it on video, and you share it, '
    + 'because seeing the real thing beats any description of it. On a floor, a dock, a kitchen or a van, '
    + 'I come to you, anywhere in Craven County or about forty-five minutes out.',

  /* "EITHER WAY" MEANS WHICH FORM OF THE ASSESSMENT, NOT WHICH DESTINATION, and
     the sentence had to be re-cut on 2026-09-10 to keep saying that. It used to
     read "comes off your build either way", which was exact while a build was
     the only thing the credit could land on. With advisory published there are
     two destinations and two forms, and a reader meeting "either way" beside two
     of each has no way to tell which pair it refers to. So both are named. */
  credit: {
    amount: money(ASSESSMENT_CREDIT_USD),
    line: `${money(ASSESSMENT_CREDIT_USD)} comes off a build or a first advisory month, whichever form of the assessment you bought.`,
  },

  video: {
    amount: money(ASSESSMENT_VIDEO_USD),
    line: `The AI Fit Assessment on video is ${money(ASSESSMENT_VIDEO_USD)}.`,
    qualifier: ASSESSMENT_VIDEO_QUALIFIER,
    length: ASSESSMENT_VIDEO_LENGTH,
    whatItIs:
      `${ASSESSMENT_VIDEO_LENGTH.charAt(0).toUpperCase()}${ASSESSMENT_VIDEO_LENGTH.slice(1)} in a private room on this site, `
      + 'with your screen shared so I watch the actual work rather than hear about it. '
      + 'Then the written list, and a call to go through it.',
    whoItIsFor:
      'Booking, invoicing, quoting, scheduling, stock, payroll — anything whose bottleneck lives in a file or a system.',
  },

  onSite: {
    amount: money(ASSESSMENT_ONSITE_USD),
    line: `The AI Fit Assessment in your business is ${money(ASSESSMENT_ONSITE_USD)}.`,
    qualifier: ASSESSMENT_ONSITE_QUALIFIER,
    length: ASSESSMENT_ONSITE_LENGTH,
    whatItIs:
      `A ${ASSESSMENT_ONSITE_LENGTH} in your business while the work is happening, `
      + 'asking the people doing the job and not only the owner. '
      + 'Then the written list, and a call to go through it.',
    whoItIsFor:
      'A shop floor, a kitchen, a dock, a yard, a van, a waiting room — anything whose bottleneck is a place rather than a file.',
  },
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

/* THE FOURTH PRODUCT, added 2026-09-10, and it is the first one here that
   delivers nothing.

   THE OTHER THREE ALL END IN AN ARTIFACT — a fitted tool, a site, a written list
   of what is worth building. This ends in a decision somebody else acts on, and
   the copy has to say so plainly rather than implying a deliverable that is not
   coming. A retainer sold as though it produces software is the shape that gets
   resented in month two.

   IT IS SOLD TO A DIFFERENT PERSON AND THAT IS WHY IT HAS ITS OWN PAGE. Every
   other surface on this site talks to a local owner who wants something built.
   This talks to somebody at a manufacturer who has been asked what the company
   is doing about AI and does not have an answer. Putting it on /services/ beside
   the ladder would ask both readers to sort themselves out, and the one with the
   budget would leave.

   WHY THE CREDENTIAL IS DESCRIBED RATHER THAN NAMED. D1 and D8 keep the employer
   off every surface, and nothing here bends that. What the copy says is the SHAPE
   of the work — deciding which of a long list of possible AI projects are real,
   which are vendor theater, and what order the real ones go in. That is
   supportable from the résumé and claims no span of control, which is the line a
   draft of the LinkedIn About crossed once and had to be pulled back from. */
export const advisoryPrice = {
  amount: money(ADVISORY_MONTHLY_USD),
  line: `Monthly advisory is ${money(ADVISORY_MONTHLY_USD)} a month.`,
  qualifier: ADVISORY_QUALIFIER,
  minimumMonths: ADVISORY_MINIMUM_MONTHS,

  /* WHAT IS ACTUALLY INCLUDED, held here so the fee and its contents cannot
     drift. Advisory's own agreement fills its scope section from this list.

     THE REPLY PROMISE IS HOURS AND NOT WORKING DAYS, and that is not a wording
     preference. It said "answered the next working day" until 2026-09-11, which
     promised a reply on a day the operator spends on a plant's planning floor --
     src/lib/consult-hours.js is weekday evenings 18:00-20:00 and weekend
     mornings 08:00-10:30, fifteen hours a week with none of it inside a business
     day. The same approved plan that shipped this product had already applied
     that constraint BY NAME to the supply-chain offer, which is sold as
     fixed-price deliverables precisely because day-rate work is business-hours
     work. It was applied to the item that stayed unbuilt and not to the one that
     went live.

     48 HOURS ANY DAY IS STRONGER THAN THE THING IT REPLACED, not a retreat. A
     window exists every single day including both weekend mornings, so Friday
     afternoon to Sunday morning is inside the promise where "next working day"
     would have meant Monday evening. DO NOT TIDY THIS BACK TO WORKING DAYS --
     that unit describes a consultancy and does not describe this practice. */
  includes: [
    'A written roadmap inside the first thirty days — the AI work worth doing in your business, in the order that pays, with what each one costs and what it returns',
    'Two or three working sessions a month, an hour each — decisions, not status updates',
    'Reachable in between, answered inside 48 hours, any day of the week — including "is this vendor telling us the truth"',
    'One written piece a quarter you can put in front of a board or an owner',
  ],

  /* NAMED OUT LOUD, because a retainer with no stated edge becomes whatever the
     client asks for, and the practice has twelve client-facing hours a week. */
  excludes:
    'Building the thing. Where the roadmap says something is worth doing, that is scoped and quoted on its own — inside the retainer it would quietly turn a monthly arrangement into an unpaid build.',

  /* THE REFUSAL IS PART OF THE OFFER RATHER THAN A DISCLAIMER. Advising other
     manufacturers while employed at one is only clean if the line is drawn
     first and in public, so it is drawn here and the page renders it. */
  conflictRule:
    'I do not advise appliance manufacturers, and that is in writing before anything starts.',
};

/* THE FIFTH PRODUCT, added 2026-09-10, and the only one whose buyer already
   knows they have a problem.

   EVERY OTHER THING ON THIS SITE HAS TO CONVINCE SOMEBODY FIRST. A shop running
   on a spreadsheet does not wake up wanting a tool; a manufacturer does not wake
   up wanting an AI roadmap. Somebody holding software that half works and a
   developer who stopped replying wakes up wanting exactly this, and has usually
   already been told by two people that it just needs a bit more work. That is
   why the copy sells the DECISION and not the reading.

   THE REFUSAL IS THE PRODUCT, AND IT RENDERS. A read whose author is paid only
   when it recommends a rebuild cannot credibly say "this is fine for another
   year" or "this cannot be saved". The fee is what buys those two sentences, so
   `alsoSays` is not a reassurance at the bottom of the page — it is the reason
   the fee exists, and it renders beside the figure.

   IT REUSES THE ENGAGEMENT MACHINERY RATHER THAN GROWING ITS OWN. A repair that
   follows is an ordinary build: the statement of work, the 30-day warranty, the
   10-business-day nonconformance window and the change order all already exist
   and all already say the right things. Nothing new gets signed for the read
   itself, because the read has no deliverable to warrant beyond the document. */
export const rescueAudit = {
  amount: money(RESCUE_AUDIT_USD),
  line: `A read of software you already have is ${money(RESCUE_AUDIT_USD)}.`,
  qualifier: RESCUE_AUDIT_QUALIFIER,
  days: RESCUE_AUDIT_DAYS,

  whoItIsFor:
    'You paid somebody to build it, or you built it yourself with an AI tool, and now it half works. The person who made it has stopped replying, or never knew, or was you.',

  /* WHAT LANDS, and the first item is there because a reader has to be able to
     check that the rest is worth anything. An audit that opens with a verdict
     the owner cannot verify is an audit they have to take on faith. */
  includes: [
    'What this software actually does today, in plain terms — so you can check I understood it before you weigh anything below',
    'What is wrong, ranked by what will bite first rather than by what looks worst',
    'What repair would cost, as a range with the assumption it rests on stated',
    'Whether repairing beats starting again, answered rather than implied',
    'What happens if you do nothing, because sometimes that is the right call for another year',
  ],

  alsoSays:
    'If it is not worth repairing, the answer says so and names what you would lose by trying. If it is fine as it is, the answer says that too. Neither of those makes me any money, which is the point of charging for the read.',

  /* THE CEILING IS NAMED IN THE COPY, not only in the qualifier. It is what makes
     a fixed price on an uninspectable input safe for both sides, and a reader who
     meets the fee without it is being sold an open engagement. */
  ceiling:
    `${RESCUE_AUDIT_DAYS} working days is the whole of it. At the end I write the answer from what I reached, and I name what I did not reach rather than quietly leaving it out.`,
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
    //
    // AND IT STILL OPENED WITH "Three numbers on this site" UNTIL 2026-09-10,
    // which is the same defect surviving inside the paragraph written to explain
    // why it is a defect. It went stale on the very next decision, exactly as
    // predicted two sentences above it, when a fourth product was admitted. The
    // count is gone rather than corrected, for the reason D22 gives and LEDGER
    // L-402 measures: a number beside a list nothing recomputes is wrong the day
    // the list changes.
    title: 'Why each price belongs to one thing',
    body: 'Every number on this site is the whole price of a different product rather than a tier of the same one. That is the difference between a price and a menu: a menu asks you to pick a version of yourself, and every figure on it is set by what the average company will pay. Past the number that applies to you, the right figure depends on your problem, so it gets scoped honestly.',
  },
];

/* ── WHAT KEEPING IT RUNNING BUYS ────────────────────────────────────────────
   ADDED 2026-09-11, when the operator decided to publish the upkeep fee. The
   figure moved from engagement-rates.js into pricing.js on the same day, which is
   the route every published figure takes; read the block above UPKEEP_MONTHLY_USD
   there for why 400 and why the cap is not optional.

   THIS IS NOT A NEW PRODUCT AND THE FOURTH-PRODUCT TEST DOES NOT APPLY. Upkeep is
   bought only by somebody who already has a build, which is the opposite of what
   that test asks. What changed is that the price is on a page instead of in a
   quote.

   THE CAP IS NOT A TERM, IT IS HALF THE PRODUCT, and it renders beside the figure
   for the same reason rescueAudit.alsoSays does. Below it, a reader takes it for a
   disclaimer; beside it, they take it for what they are buying. An unbounded
   "small fixes as they arise" at this fee is a worse deal for the practice than
   the same words at a third of it, because what a buyer feels entitled to spend
   scales with what they paid. */
export const upkeep = {
  amount: money(UPKEEP_MONTHLY_USD),
  minutes: UPKEEP_INCLUDED_MINUTES,
  line: `Upkeep is ${money(UPKEEP_MONTHLY_USD)} a month.`,
  qualifier: UPKEEP_QUALIFIER,

  whoItIsFor:
    'You already have something I built, it is running, and you would rather a small change took one message than a morning of your own. This is for the fortnight where a price list moves, a photograph is wrong, or a form stops arriving somewhere.',

  /* WHAT LANDS, and the first item is the one people do not expect to be included
     at all — which is exactly why it leads. */
  includes: [
    'Small fixes and changes as they arise — a price that moved, a photograph swapped, a detail corrected, a broken thing put right',
    'The updates underneath it, so what was built stays current rather than quietly aging',
    'A reply from me rather than a queue, inside 48 hours and any day of the week',
    'An honest answer on whether something you want is inside this or needs quoting, before I start it',
  ],

  /* THE REFUSAL IS THE PART THAT MAKES THE FEE HONEST, and it is the sentence a
     client should be able to quote back. */
  alsoSays:
    'Anything bigger than a small change gets quoted on its own, and I will say which side of that line a request falls on before I touch it. Stopping this turns nothing off — what was built is yours outright, it keeps running in your own accounts, and there is nothing for me to switch off.',

  cap:
    `${UPKEEP_INCLUDED_MINUTES} minutes a month, and it does not roll forward. An unused month does not bank, because six banked hours spent at once is a promise I could not keep against the hours I actually have.`,
};

/* ── THE MANUFACTURER SIDE ───────────────────────────────────────────────────
   ADDED 2026-09-11, on the operator's answer in the alignment session. D29 had
   deferred this in its own words — "secondary, or a later venture as the practice
   grows" — so this is that deferral ending rather than a reversal of it.

   NO PUBLISHED FIGURE, AND THAT IS THE DECISION RATHER THAN AN OMISSION. Each
   deliverable is quoted per engagement exactly as projectModel is, so nothing here
   adds to the count of published prices and D93's standing warning about the next
   figure is untouched.

   FIXED PRICE BY DELIVERABLE, NEVER A DAY RATE, AND THE REASON IS ARITHMETIC
   RATHER THAN PREFERENCE. Day-rate work in this field is weekday-business-hours
   work, and src/lib/consult-hours.js is weekday evenings and weekend mornings —
   fifteen hours a week with none of it inside a business day. A day rate would be
   selling hours that do not exist. Fixed-price-by-deliverable is a published model
   in this market, and a named one: master-data, bill-of-materials and planning-
   parameter audits are things firms already sell that way.

   THE EMPLOYER IS NEVER NAMED HERE AND NEITHER IS ANY PLANT. D1 and D8 hold
   without exception, and D86 means verify:industrial reads this page's RENDERED
   text for stray codes — body prose is the easiest place to introduce one, so
   there are no bare four-digit numbers in any string below.

   WHAT THE PROOF IS, AND IT IS DERIVED. The at-scale demos already on this site
   are the evidence, read from workGroups by band rather than listed here, so a new
   group joins this page for free. They were proof of caliber with nothing stated
   under them; this is the stated thing. */
export const supplyChain = {
  whoItIsFor:
    'You run planning, or materials, or master data, and you already know which of your numbers you do not trust. The system is not wrong so much as nobody has had a clear week to go and check it.',

  /* THE TIME HALF. Three deliverables, each one a thing that ends. */
  deliverables: [
    {
      title: 'A bill-of-materials accuracy audit',
      body: 'Your structures read against what is actually consumed, with every disagreement listed and ranked by what it costs you. Not a sample — the whole set, because the expensive errors are the ones that never looked unusual.',
    },
    {
      title: 'A planning-parameter review against real consumption',
      body: 'Lot sizes, lead times, safety stock and coverage profiles checked against what your own history says they should be. Parameters get set once at go-live and then outlive the demand they were set for, which is why this is the review nobody schedules.',
    },
    {
      title: 'Change-order cutover timing',
      body: 'When a change can actually be implemented without stranding stock or breaking a build, worked out from your open orders and your real lead times rather than from the date on the paperwork.',
    },
  ],

  /* HOW IT IS SOLD, and the refusal is the part worth reading. */
  howItIsSold:
    'Each of those is quoted as a fixed price for a finished answer, agreed before anything starts. Not a day rate, and not an hourly one: I hold a full-time position, my hours are evenings and weekend mornings, and a day rate would be me selling you time I do not have. A fixed deliverable is the honest shape for that and it puts the risk of it taking longer on me.',

  /* THE PRODUCT HALF, which builds nothing in advance. */
  toolHalf:
    'If what you need is a tool rather than an answer, it gets scoped and quoted when you buy it, and you own it outright — the same way everything else here works. Nothing is built speculatively and there is no license to renew.',

  /* NAMED BEFORE ANYTHING STARTS, same shape as advisory's conflict rule. */
  conflictRule:
    'I do not take this work from appliance manufacturers, and that is in writing before anything begins.',
};

/* ── WHETHER AN ASSISTANT NAMES YOU ─────────────────────────────────────────
   THE SIXTH PUBLISHED FIGURE, added 2026-09-11. The test at the head of
   src/lib/pricing.js was RUN and the argument is written beside the constant
   there; read it before touching a word of this.

   THE OFFERING IS THE HONESTY AND NOT THE CAPABILITY. Two firms in these counties
   already claim this category and neither publishes a method. Anybody can ask an
   assistant a question; what nobody in the sweep would do is say out loud that they
   cannot show their work caused the answer to change. That sentence is the product,
   which is why it lives in the engine rather than on this page — see
   CAUSATION_REFUSAL in src/lib/assistant-visibility.js, so no surface can print the
   figures without it.

   NOTHING HERE DESCRIBES A RESULT, AND THAT IS DELIBERATE. The plan that proposed
   this said to run it free for the founding clients first so three months of real
   data existed before anyone was charged; the operator chose to publish now, with
   the cost stated. So every sentence below describes the METHOD and the REFUSAL.
   Not one of them says what has been found, because nothing has been found yet, and
   a page implying otherwise would break the one thing being sold. */
export const visibility = {
  amount: money(VISIBILITY_MONTHLY_USD),
  line: `Knowing whether an assistant names you is ${money(VISIBILITY_MONTHLY_USD)} a month.`,
  qualifier: VISIBILITY_QUALIFIER,

  whoItIsFor:
    'Somebody asked an assistant who does what you do near them, and you have no idea whether your name came up. Your search ranking does not answer it, because an assistant is not reading a results page.',

  /* THE METHOD, PUBLISHED, because that is the whole differentiator. */
  method: [
    'A fixed set of questions, written down and shown to you, in the words somebody would actually type',
    'Each one asked of each assistant on a stated date, by me, and the answer recorded as it came back',
    'Whether your business was named, yes or no — one judgment per answer and nothing inferred from a maybe',
    'Any source the answer credited, recorded as it was credited',
    'The same questions next month, so the two months can be compared at all',
  ],

  /* WHAT IT REFUSES, and each of these is enforced in the engine rather than
     promised here. The wording matches what `problems` actually returns. */
  refuses: [
    'It never claims a cause. Assistants change their own answers, and nobody selling this can show that anything done to your website moved one.',
    'It gives you no score. A visibility score is a number with no unit and nothing to compare it against, so there is none.',
    'It refuses a comparison it cannot make. Change the questions and the two months stop being comparable, and the report says so rather than showing a number that moved because the questions did.',
    'An empty month reads as a month nobody asked, never as a month with no mentions.',
  ],

  firstMonth:
    'The first month is a starting point and the report says so in those words. There is nothing to compare it against yet, and a first reading dressed up as a trend is the thing this exists not to do.',
};
