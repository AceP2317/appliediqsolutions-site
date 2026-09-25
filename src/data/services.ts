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
  ASSESSMENT_VIDEO_LENGTH,
  ASSESSMENT_CREDIT_USD,
  ASSESSMENT_VIDEO_QUALIFIER,
  WEBSITE_USD,
  WEBSITE_QUALIFIER,
  RESCUE_AUDIT_USD,
  INDUSTRIAL_TOOL_USD,
  INDUSTRIAL_TOOL_QUALIFIER,
  RESCUE_AUDIT_DAYS,
  RESCUE_AUDIT_QUALIFIER,
  UPKEEP_MONTHLY_USD,
  UPKEEP_INCLUDED_MINUTES,
  UPKEEP_QUALIFIER,
} from '../lib/pricing.js';
import { money } from '../lib/format.js';
import { countWord } from '../lib/count-words.js';

/* The horizon the banking sentence in `upkeep.cap` argues against. Named rather
   than left inside the sentence so the two numbers there cannot drift apart —
   see the comment on that field. */
const BANKED_MONTHS = 6;

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

/* THE AI FIT ASSESSMENT: ONE FORM, ONE FIGURE, AND THE CREDIT EQUALS IT.

   Built in the same shape as startingPrice above and for the same reason: a
   figure and the sentence qualifying it travel in one object, so no page can
   render a price without what happens to it. That matters more here than
   anywhere else on the site, because the half a page would drop, that the fee
   comes off the build, is the half stopping the assessment competing with the
   thing it recommends.

   THE FLAT .line AND .qualifier FIELDS STAY GONE. They left on 2026-09-06 when
   the product had two forms; with one form again the figure still lives under
   `video`, so that a stale consumer of the old flat fields fails the build
   rather than rendering the wrong figure or nothing at all.

   ONE FORM SINCE 2026-09-20 (D118). The `rule` field that assigned a form and
   the `onSite` block that priced it left with the in-business form; D81 and
   the pricing module's history carry the two-form argument. What is left is
   one figure, its qualifier, and the credit that equals it.

   THE TWO KINDS OF NUMBER ARE STILL DIFFERENT and the copy must keep saying so.
   The floor is a starting point for a build; this is the entire cost of a
   finished piece of work. Writing "starts at" beside it would collapse the
   distinction the last pricing note on this page rests on. */
export const assessmentPrice = {
  credit: {
    amount: money(ASSESSMENT_CREDIT_USD),
    line: `${money(ASSESSMENT_CREDIT_USD)} comes off a build you go ahead with.`,
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

  /* BOTH FIGURES IN THIS SENTENCE DERIVE, 2026-09-13, AND ONE OF THEM DID NOT.
     It read "six banked hours" beside an interpolated UPKEEP_INCLUDED_MINUTES.
     Sixty minutes across BANKED_MONTHS happens to come to six hours, so the
     sentence was arithmetic dressed as prose — correct only by coincidence, and
     wrong the moment the minutes constant moved, with nothing able to notice
     because half of it was a word. Same class as the count defects found across
     this site today, one indirection further out: not a number beside a list,
     but a number computed from another number by hand. */
  cap:
    `${UPKEEP_INCLUDED_MINUTES} minutes a month, and it does not roll forward. An unused month does not bank, because ${countWord((BANKED_MONTHS * UPKEEP_INCLUDED_MINUTES) / 60)} banked hours spent at once is a promise I could not keep against the hours I actually have.`,
};

/* THE SIXTH PUBLISHED FIGURE, 2026-09-20 (D118, Phase 7): a floor per plant for a
   factory tool built to order. Same shape as websitePrice and for the same
   reason — the figure and its qualifier travel in one object, so no page can
   show one without what happens to it. The counter in scripts/check-dist.mjs
   counts renders of `industrialPrice` and exits 2 at zero, because a floor
   nothing renders is a floor that has quietly stopped being published. */
export const industrialPrice = {
  amount: money(INDUSTRIAL_TOOL_USD),
  line: `A factory tool starts at ${money(INDUSTRIAL_TOOL_USD)} per plant.`,
  qualifier: INDUSTRIAL_TOOL_QUALIFIER,
};

/* ── THE MANUFACTURER SIDE ──────────────────────────────────────────────
   ADDED 2026-09-11 as three audits with the seven demos underneath as proof, and
   TURNED AROUND ON 2026-09-20 (D118): the seven factory tools are the product,
   built to order for one plant on its own extract or run once for the answer,
   and an audit is the run-once form of a named tool. D29 had deferred the
   manufacturer side in its own words; D118 made it one of the three doors.

   NO PUBLISHED FIGURE IN THIS OBJECT, AND THE FLOOR IS PHASE 7 OF D118. The
   operator set a floor per plant ($10,000) and it lands in src/lib/pricing.js
   with its fourth-product test and its render counter, never as a string here:
   a figure typed into copy is what npm run gate refuses.

   FIXED PRICE PER PLANT, NEVER A DAY RATE, AND THE REASON IS ARITHMETIC RATHER
   THAN PREFERENCE. Day-rate work in this field is weekday-business-hours work,
   and src/lib/consult-hours.js is weekday evenings and weekend mornings —
   fifteen hours a week with none of it inside a business day. A day rate would
   be selling hours that do not exist.

   THE EMPLOYER IS NEVER NAMED HERE AND NEITHER IS ANY PLANT. D1 and D8 hold
   without exception, and since Phase 6 scripts/verify-industrial.mjs reads the
   RENDERED prose of /supply-chain/ and of every factory tool's offer box for
   stray plant codes, with P10 planted as its control — this comment claimed
   that from 2026-09-11 while the gate only opened /work/<slug>/. Body prose is
   the easiest place to introduce a code, so no string below carries a bare
   four-digit number.

   THE LIST IS DERIVED. The page reads the tools out of workGroups by band, so a
   group joining the scale band is sold there with no edit here (D22). */
export const supplyChain = {
  whoItIsFor:
    'You run planning, or materials, or master data, and you already know which of your numbers you do not trust. The system is not wrong so much as nobody has had a clear week to go and check it.',

  /* THE SEVEN FACTORY TOOLS ARE THE PRODUCT SINCE 2026-09-20 (D118). Until then
     this object sold three audits with the tools shown underneath as proof; the
     operator's decision reversed that: the tools are what is for sale, quoted
     per plant, and an audit is the run-once form of one of them. Nothing here
     types a count — the page derives the list from workGroups — and no string
     carries a bare four-digit number, because verify-industrial.mjs reads the
     rendered prose for stray plant codes. */
  own:
    'Built to order for your plant, on your own extract, and yours outright: the code, the accounts, and a copy that runs with the internet off. Nothing is built before it is bought and there is no license to renew.',
  once:
    'Or run once. The same tool on one extract of yours, and what you get is the written answer it produced rather than the tool. The audits below are that form, and each names the tool behind it.',

  /* THE RUN-ONCE FORMS, each one the answer a named tool gives on one extract.
     The change-order cutover audit left on 2026-09-20 with D118, because no tool
     stands behind it, and an audit with no tool behind it is a day of hand work
     sold as a product. */
  audits: [
    {
      slug: 'bom-explorer',
      title: 'A bill-of-materials accuracy audit',
      body: 'Your structures read against what is actually consumed, with every disagreement listed and ranked by what it costs you. Not a sample — the whole set, because the expensive errors are the ones that never looked unusual.',
    },
    {
      slug: 'parameter-audit-console',
      title: 'A planning-parameter review against real consumption',
      body: 'Lot sizes, lead times, safety stock and coverage profiles checked against what your own history says they should be. Parameters get set once at go-live and then outlive the demand they were set for, which is why this pays.',
    },
  ],

  /* HOW IT IS SOLD, and the refusal is the part worth reading. */
  howItIsSold:
    'Each is quoted as a fixed price for one plant, agreed before anything starts. Not a day rate, and not an hourly one: I hold a full-time position, my hours are evenings and weekend mornings, and a day rate would be me selling you time I do not have. A fixed price for a finished thing is the honest shape for that and it puts the risk of it taking longer on me.',

  /* NAMED BEFORE ANYTHING STARTS, same shape as advisory's conflict rule. */
  conflictRule:
    'I do not take this work from appliance manufacturers, and that is in writing before anything begins.',
};

