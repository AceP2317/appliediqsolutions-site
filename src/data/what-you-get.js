/* ============================================================================
   WHAT A BUILD HERE IS, AND WHAT NONE OF THE PLATFORMS CAN HOLD.

   The prose half of the printed comparison sheet's back end. Read by
   scripts/make-compare-pdf.mjs today and available to /websites/compare/ if
   that page ever wants it, which is the whole reason it is a module rather than
   a template literal inside the renderer.

   WHY IT EXISTS. The sheet's own callout tells a reader to buy "because of what
   you are holding at the end, and because of the one piece of software your
   business actually runs on that none of these will house" — and until
   2026-09-10 the document never said what either of those was. The only
   description of the offer in either file was the imported website qualifier on
   the last page. This module is the answer to a question the document already
   asked and then dropped.

   THE RULE EVERY SENTENCE HERE OBEYS, AND IT IS NARROWER THAN IT LOOKS.
   D33's competitive sweep found every obvious differentiator already published
   by a named competitor inside these counties: owned rather than rented, custom
   rather than template, direct with the builder, local, AI. src/data/home.ts
   records the "100% owned & deployed" stat being deleted for exactly that
   reason — "Ownership is table stakes in this category now, so it stays as
   reassurance inside the offers and stops pretending to be proof."

   SO NOTHING BELOW ARGUES OWNERSHIP AS A DIFFERENTIATOR. Every entry is a fact
   about something that exists — a filter, a refusal, a second copy, a written
   way to revoke access — rather than a claim about character. A sentence that
   could be published verbatim by a competitor tomorrow does not belong here,
   and `whyThisOne.concession` says so out loud before the section makes a
   single claim, which is the same move the concession rows make on the cards.

   NO COUNT OF ANYTHING IS WRITTEN HERE (D22). The shelf is described by its
   property, never by its size, because a number beside a list that nothing
   recomputes is wrong the day the list changes.

   NO FIGURE IS WRITTEN HERE EITHER. Every price the sheet prints is imported
   from src/lib/pricing.js by the renderer and travels with its own qualifier,
   which is the rule verify-website.mjs enforces on the site for the same
   reason: a qualifier a screen below its figure is one a reader never reaches.
   ============================================================================ */

/** The bridge out of the arithmetic. It has to concede first, because the two
 *  pages above it just spent their whole length arguing the reader should rent. */
export const buildIntro =
  'Everything above says renting is cheaper, and it is, for about twenty years. So this is the ' +
  'other half of that sentence: what the money actually buys, and why the answer is not a nicer ' +
  'website. Six things are in every build, and five of them are the ones people forget until ' +
  'something breaks.';

/** The two things sold WITHOUT a website, named here because a sheet about
 *  websites is where somebody first learns a site is not the only shape. The
 *  figures are added by the renderer from pricing.js — never typed here. */
export const alsoSold = [
  {
    label: 'A tool on its own, without a site',
    body:
      'A shelf of finished tools already runs in a browser at appliediqsolutions.com/tools/ — a tip-out, ' +
      'a reorder point, a job quote, a drawer count. Each one is fitted to your roster, your rates and ' +
      'your words, and delivered whether or not you ever want a website. That is a smaller job than a ' +
      'build and it carries its own floor.',
  },
  {
    label: 'A read of the work, before anything is built',
    body:
      'If you cannot tell which of these you need, the assessment is a read of how the work actually ' +
      'runs and a written list of what is worth building, in order, with a number beside each line. ' +
      'You do not pick the form it takes. It follows from where the work that is slowing you down ' +
      'happens — on a screen, or on a floor.',
  },
];

/** THE STRUCTURAL SECTION. Each entry names a mechanism rather than a virtue,
 *  because a virtue is a sentence anybody can write and a mechanism is not. */
export const cannotHold = [
  {
    label: 'The rule that is yours, not your trade’s',
    body:
      'A platform writes a feature once and earns it back across every customer it has. So it takes any ' +
      'rule that is identical across a trade — booking, invoicing, staff scheduling, review requests — ' +
      'and refuses any rule that is one owner’s invention, because the cost of building that one never ' +
      'spreads. Your tip-out ratio, your reorder point, your labor target, your rate card, your crew ' +
      'share: none of them is taken, and that is why they are still done on a legal pad. It is also why ' +
      'nothing on that shelf is something a subscription quietly adds next year.',
  },
  {
    label: 'A tool that says when it cannot answer',
    body:
      'Every figure shows its arithmetic beside it. Nothing is modeled, forecast, smoothed, or compared ' +
      'against an industry average I cannot show you, and none of them suggests a rate, a target, a par ' +
      'or an interval — those are the decisions you are paid to make. Where a tool cannot work something ' +
      'out it stops the sheet and says so in a plain sentence rather than printing a plausible-looking ' +
      'number. That refusal is not a promise I remember to keep: the build fails if a tool stops making it.',
  },
  {
    label: 'Nothing you type leaves the page, by construction',
    body:
      'No account, no login, no upload. Even a spreadsheet you drop in is read by the page itself. That ' +
      'is not a policy I could change later — it is how they are built, and the copy you keep proves it ' +
      'by working with the internet switched off.',
  },
  {
    label: 'Delivered twice, and one copy needs nobody',
    body:
      'A fitted tool arrives two ways: hosted in an account set up in your own name, and as a single file ' +
      'you keep forever that opens from your own disk with no internet at all. The second one is what ' +
      'matters in ten years, and it has been measured working in all three browser engines rather than ' +
      'assumed.',
  },
  {
    label: 'A written way to fire me',
    body:
      'The code sits in a repository in your name, the hosting and the domain are billed to your card at ' +
      'cost with nothing added, and I am an invited collaborator you can remove in minutes. The handover ' +
      'includes the steps for doing exactly that. Nothing is called delivered until you have logged into ' +
      'every account yourself while I watch, and the test is whether revoking my access tomorrow leaves ' +
      'everything still running.',
  },
  {
    label: 'A comparison that names where the others win',
    body:
      'The pages in front of you say where eight competitors beat a build here, print arithmetic showing ' +
      'renting is cheaper for decades, and tell you to buy the subscription if neither of the two things ' +
      'above matters to you. That is on the public website and not only on this sheet, and a check ' +
      'refuses to ship the site if those losing rows are ever cut.',
  },
];

/** THE PERSON SECTION, and it opens by giving away the argument a reader has
 *  already heard from two other quotes. */
export const whyThisOne = {
  concession:
    'Every builder you talk to will tell you that you own what they make. In this category that is now ' +
    'table stakes rather than a reason, and a competitor two counties over publishes the same promise at ' +
    'a fixed price. So it is not the argument. What is left is narrower and harder to copy.',
  run:
    'A restaurant floor for five and a half years, a bank’s lending division, cash management at a ' +
    'second bank, a clinic’s front office, a licensed insurance practice, and now the planning floor ' +
    'of the appliance plant in town. Four of those five are on a New Bern street. Not advising any of ' +
    'them — running them.',
  points: [
    {
      label: 'The person who writes it is the person you talked to',
      body:
        'No account manager, no handoff, no team the work is passed to. That also means one person’s ' +
        'capacity and one person’s calendar, which is a real limit and the reason a build is quoted ' +
        'before it starts rather than metered while it runs.',
    },
    {
      label: 'Every one of those trades ran on something almost right',
      body:
        'A spreadsheet one person was quietly holding together, or a system fitted to somebody else’s ' +
        'business. The hard part of ending that is not the code. It is knowing which fifteen minutes of ' +
        'the week to point it at, and that is what a career in the work buys and a portfolio of websites ' +
        'does not.',
    },
    {
      label: 'The answer is sometimes that you should not buy anything',
      body:
        'If a plugin costing seventy-nine dollars once does what you need, buy it and keep your money. ' +
        'If the rule you want automated is one your whole trade shares, something already does it and I ' +
        'will tell you what. That answer is worth more to both of us than a build that should not have ' +
        'happened.',
    },
  ],
};

/* THE FLOORS. Same reasoning as every other generated artifact here: a section
   that rendered empty prints exactly like a full one from the outside. The
   failure this guards is a section softened to nothing rather than one deleted,
   because nobody deletes one on purpose. The length test runs on the SHORTEST
   entry, so shortening any single body fires it. */
const MIN_BODY = 150;
const MIN_CANNOT_HOLD = 5;

export function assertWhatYouGet(who) {
  const problems = [];
  if (buildIntro.length < 200) problems.push(`buildIntro is ${buildIntro.length} characters`);
  if (cannotHold.length < MIN_CANNOT_HOLD) {
    problems.push(`cannotHold holds ${cannotHold.length}, floor is ${MIN_CANNOT_HOLD}`);
  }
  if (alsoSold.length < 2) problems.push(`alsoSold holds ${alsoSold.length}`);
  if (whyThisOne.points.length < 3) problems.push(`whyThisOne has ${whyThisOne.points.length} point(s)`);
  if (whyThisOne.concession.length < 150) problems.push('whyThisOne.concession has been cut');
  if (whyThisOne.run.length < 150) problems.push('whyThisOne.run has been cut');
  const lists = [
    ['cannotHold', cannotHold],
    ['alsoSold', alsoSold],
    ['whyThisOne.points', whyThisOne.points],
  ];
  for (const [name, list] of lists) {
    for (const e of list) {
      if (!e.label || (e.body || '').length < MIN_BODY) {
        problems.push(`${name}: ${e.label ?? '(no label)'} is ${(e.body || '').length} chars, floor ${MIN_BODY}`);
      }
    }
  }
  if (!problems.length) return;
  console.error(`${who}: ${problems.length} problem(s) in src/data/what-you-get.js:`);
  for (const p of problems) console.error(`  - ${p}`);
  console.error(`${who}: this is the section the sheet's own callout promises. Restore it.`);
  process.exit(2);
}
