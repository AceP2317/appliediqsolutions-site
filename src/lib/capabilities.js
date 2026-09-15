/* ============================================================================
   WHAT I BUILD, WHAT I WILL NOT BUILD, AND WHAT HAS TO BE QUOTED FIRST.

   ONE MODULE, THREE SHEETS. /websites/compare/, /getting-paid/ and /stores/
   each end with the same three headings, and until this file existed each would
   have grown its own copy. The website Scope's section 3 is the source under all
   of it, and a second copy of that section written in a sales voice is the exact
   shape that drifts: the sheet gets softened in a copy pass, the Scope does not,
   and the client signs one thing having read another.

   THE THREE HEADINGS ARE THE OPERATOR'S AND THE MIDDLE ONE IS THE WHOLE POINT.
   What I can do, what I will not do, what needs scoping or pricing. Merging the
   second into the third was refused on 2026-09-11: a reader who is told that a
   store is "quoted separately" and that sales tax by state is also "quoted
   separately" has been told two different things in one sentence, and only one of
   them is buyable at any price.

   EVERY ITEM IN THE MIDDLE LIST CARRIES A `basis`, AND THERE ARE EXACTLY TWO.

     'promise'  building it would make something already in writing false. The
                reason names the document, because a refusal a client can go and
                check is a different thing from a refusal he has to take on
                trust.
     'choice'   it could be built and it is not going to be. The reason says why,
                and the why is always that somebody else maintains it better
                forever.

   MERGING THOSE TWO WAS ALSO REFUSED, AND FOR THE STRONGER REASON. A client
   reading that I CANNOT build sales tax by state would be reading something
   untrue. I can. I will not, because rates move without notice and the thing has
   to stay right for years after I have been paid. Writing an unwilling as an
   unable buys a cleaner list at the price of a false sentence, which is the
   trade this practice exists not to make.

   THE SHEET-SPECIFIC HALF IS SMALL AND IT IS WHAT THE GATES DISCRIMINATE ON.
   Everything in CAN, WONT and SCOPED below is true on every sheet. EXTRA adds
   what only one sheet's reader needs — a configurator on the store sheet, a rate
   negotiation on the payments sheet — and because the shared half is identical
   on all three pages by design, it cannot be its own control. Each gate proves
   it read THIS page by asserting that this sheet's EXTRA items are absent from
   the other two, and proves the module really is shared by asserting the common
   half is present on all three.

   PURE ESM, NO REACT, on the split stated in CLAUDE.md. An .astro page imports
   it, a .mjs gate imports it natively, and both read the same sentences rather
   than two copies that agree until one is edited.

   NO COUNT IS TYPED ANYWHERE, per D22. Every denominator comes from the arrays.
   ============================================================================ */

/** The three headings, written once. A sheet that renamed one would drift from
    the other two, and the rename is exactly what a copy pass does. */
export const HEADINGS = {
  can: 'What I can build for you',
  wont: 'What I will not build, and why',
  scoped: 'What has to be quoted before it starts',
};

/** The one-line frame under each heading. Short, because the items carry the
    weight and a paragraph above a list is the part nobody reads. */
export const INTROS = {
  can: 'All of it ends up in accounts opened in your name, and none of it needs me afterwards.',
  wont: 'Two different reasons, kept apart on purpose. Some of these would make a promise you already hold in writing false. The rest I could build and will not, and the reason is the same each time — somebody else has to keep it correct for years and does.',
  scoped: 'Real work, quoted in writing before anything starts, and never folded into a build price to win one.',
};

/* ── WHAT I CAN BUILD ──────────────────────────────────────────────────────
   Sourced from §1 of the website build Scope and from what the shelf actually
   ships. Nothing aspirational is on this list: every line names something that
   has been delivered or is named in a signed section. */
export const CAN = [
  {
    id: 'site-you-own',
    what: 'A website that is yours outright',
    detail:
      'The files, the domain, the hosting account and every login open in your name. There is no leaving, because you were never standing on anything of mine.',
  },
  {
    id: 'fitted-tool',
    what: 'A tool built for the way your business actually works',
    detail:
      'Your rate card, your roster, your categories, your trade’s words. It arrives twice — as a page at your own web address, and as one file that opens with the internet switched off and needs no login and no subscription.',
  },
  {
    id: 'payment-link',
    what: 'One payment link, connected to one page',
    detail:
      'Tested with a real payment before handover and refunded afterwards, on an account that is yours throughout. This is included in a build under §1.7 of the Scope, and I am never an owner on the account.',
  },
  {
    id: 'contact-form',
    what: 'A form that reaches your inbox',
    detail:
      'Names, emails and phone numbers are ordinary work and always were. What a form collects and how long it is kept is written into the privacy page the build includes.',
  },
  {
    id: 'the-reading',
    what: 'The arithmetic on your own numbers, printed where you can check it',
    detail:
      'No model, no forecast, no industry average and no suggested rate. Your figures through a sum you can follow, and a plain sentence wherever the sum cannot be done.',
  },
  {
    id: 'listing-read',
    what: 'A read of what your Google listing shows the public',
    detail:
      'Checked against what your site says, so the two agree. This needs no access to anything of yours — it is the same page any customer sees.',
  },
];

/* ── WHAT I WILL NOT BUILD ─────────────────────────────────────────────────
   THE ORDER IS DELIBERATE: every `promise` first, then every `choice`. A reader
   who meets "sales tax by state" before the card-data line reads the whole list
   as preference. */
export const WONT = [
  {
    id: 'card-details',
    what: 'Anything that sees, stores or transmits a card or bank number',
    basis: 'promise',
    why:
      'The master agreement says outright that I do not see, store, transmit or process payment card data. A payment link hands your customer to your provider’s own page, on your provider’s own address, and nothing about the way I build changes that.',
  },
  {
    id: 'listing-seat',
    what: 'A seat on your Google Business Profile',
    basis: 'promise',
    why:
      'Both Scopes say that nothing in them asks you to grant me any access to it, and Google’s own rules for third parties require the business to hold its profile at all times. The listing is yours to create, to verify and to keep.',
  },
  {
    id: 'regulated-records',
    what: 'A system that holds records carrying their own legal regime',
    basis: 'promise',
    why:
      'Patient notes, medical history and the like. Section 3 of the Scope says I do not build systems that hold them. A practice holding such records can still have a website — the site simply does not touch that material.',
  },
  {
    id: 'professional-advice',
    what: 'Legal, tax, accounting, employment or financial advice',
    basis: 'promise',
    why:
      'Named in section 3 of the Scope as outside every build. I will tell you who the merchant of record is, because that decides who owes the sales tax. Whether you owe any is a question for your accountant and the answer is worth paying for.',
  },
  {
    id: 'unattended-access',
    what: 'A way into your computer when you are not sitting at it',
    basis: 'promise',
    why:
      'The data-handling note in your pack says I have no way to do it and do not want one. Every remote session needs you present and letting me in, and it ends when you close it.',
  },
  {
    id: 'state-sales-tax',
    what: 'Sales tax worked out by state',
    basis: 'choice',
    why:
      'I could build this and I am not going to. Rates and rules change without notice and it has to stay correct for years after I have been paid. A company whose entire business is that maintains it, and I will name the one that does rather than sell you a version of it that rots.',
  },
  {
    id: 'address-shipping',
    what: 'Shipping worked out from a customer’s address',
    basis: 'choice',
    why:
      'Same answer and the same reason. Carrier rates, zones and surcharges move on somebody else’s schedule, and a shipping calculator that is six months out of date overcharges your customers quietly.',
  },
  {
    id: 'platform-categories',
    what: 'Online booking, invoicing and payment chasing, review requests, staff scheduling, waiting lists',
    basis: 'choice',
    why:
      'Every one of these is a category a platform you already pay for has taken, or will inside a year. Where you need one, I will say which product does it. That answer is worth more to you than a worse version of it with my name on.',
  },
];

/* ── WHAT HAS TO BE QUOTED FIRST ───────────────────────────────────────────
   NOT A SOFTER VERSION OF THE LIST ABOVE. Everything here is buyable. What it
   is not is free, and it is never inside a build price. */
export const SCOPED = [
  {
    id: 'online-store',
    what: 'An online store — a basket, a checkout and stock counts',
    detail:
      'A real store is a different build at a different price, quoted in writing before it starts. One payment link on one page is a much smaller thing and comes with a build.',
  },
  {
    id: 'open-processor-account',
    what: 'Opening a payment account from scratch',
    detail:
      'This runs on your identity documents, your bank account and a verification process the provider controls, which neither of us can hurry. Where you already hold an account, connecting it is included.',
  },
  {
    id: 'listing-setup',
    what: 'Setting up or running your Google Business Profile',
    detail:
      'Separate work with its own price, and still in your name when it is done. Reading what the listing already shows is included; holding it is not.',
  },
  {
    id: 'customer-logins',
    what: 'Any account your own customers log in to',
    detail:
      'Logins are the largest single step in cost of anything on this page. A site that has them is a different build, and pretending otherwise at quoting time is how a build goes wrong in month two.',
  },
  {
    id: 'other-systems',
    what: 'Connecting to another system you already run',
    detail:
      'Possible, often useful, and never assumed. It gets named in the Statement of Work with its own price, because the cost lives in the other system rather than in mine.',
  },
  {
    id: 'second-phase',
    what: 'A second tool, a further phase, or anything else named in section 3',
    detail:
      'Quoted as its own fixed price. Small work outside a Scope runs at the hourly rate on the rate card, with thirty minutes the smallest unit invoiced.',
  },
];

/* ── THE SHEET-SPECIFIC HALF ───────────────────────────────────────────────
   WHAT EACH SHEET'S READER NEEDS THAT THE OTHER TWO DO NOT, and the half every
   gate discriminates on. Keys must match the sheet ids below. */
export const EXTRA = {
  websites: {
    can: [
      {
        id: 'pages-and-rounds',
        what: 'Five pages and two rounds of changes, with your words placed and fitted',
        detail:
          'You supply the text and the pictures; I place them, size them and say where a page is missing something. A page swapped for a different page costs nothing.',
      },
    ],
    wont: [
      {
        id: 'inherit-a-site',
        what: 'Taking over, repairing or migrating a site somebody else built',
        basis: 'choice',
        why:
          'I could and I do not quote it as a build. Inheriting somebody else’s decisions costs more to unpick than a new site costs to make, and you would be paying me to find out what they did.',
      },
    ],
    scoped: [],
  },
  payments: {
    can: [
      {
        id: 'wire-your-processor',
        what: 'Whichever processor you picked, wired to the thing I built',
        detail:
          'I take no percentage, no markup and no share of anything you sell. That is a term in the agreement rather than a promise, and it means this costs exactly what your processor charges.',
      },
    ],
    wont: [
      {
        id: 'negotiate-your-rate',
        what: 'Getting you a better rate from your processor',
        basis: 'choice',
        why:
          'Several of them do negotiate above a volume floor, and one publishes an invitation to call. That call is yours to make, on a contract I am not a party to, and standing in the middle of it would help nobody.',
      },
    ],
    scoped: [],
  },
  stores: {
    can: [
      {
        id: 'live-configurator',
        what: 'A page that reads your own catalog and hands a configured item to your cart',
        detail:
          'Your customer builds the thing on your site and lands in your platform’s own checkout with it. You add a listing in your store and the page follows, with nothing new for you to learn.',
      },
    ],
    wont: [
      {
        id: 'secret-holding-server',
        what: 'A configurator on a platform that will not let a browser read the catalog',
        basis: 'promise',
        why:
          'Some platforms require a secret key on every request, which would mean me running a server holding a token that can read your orders. That is customer data, and both the Scope and the data-handling note say I do not hold it. On those platforms the honest answer is that this cannot be built the clean way.',
      },
    ],
    scoped: [
      {
        id: 'configurator-is-quoted',
        what: 'The configurator itself, on a platform where it is possible',
        detail:
          'It runs on a login belonging to your store rather than on your own machine, so it is never one of the free fitted tools. It is quoted work, and the quote covers keeping it working when your platform changes.',
      },
    ],
  },
};

/** The sheets that may ask for a list. Named rather than open, so a typo gets an
    error instead of a silently empty extra. */
export const SHEETS = Object.freeze(['websites', 'payments', 'stores']);

/** The three lists for one sheet: the shared half, then that sheet's own.
 *  Throws on an unknown sheet rather than returning the shared half alone, which
 *  would render a complete-looking list missing the only part a gate can tell
 *  apart from the other two sheets. */
export function capabilityList(sheet) {
  if (!SHEETS.includes(sheet)) {
    throw new Error(`capabilities: "${sheet}" is not a sheet. Known: ${SHEETS.join(', ')}.`);
  }
  const extra = EXTRA[sheet];
  return {
    can: [...CAN, ...extra.can],
    wont: [...WONT, ...extra.wont],
    scoped: [...SCOPED, ...extra.scoped],
  };
}

/** Every sentence that must reach a rendered surface, for one sheet. Flattened
 *  so a gate walks one list rather than three, and so a fourth list added above
 *  is guarded without anybody editing the gates. */
export function capabilityStrings(sheet) {
  const { can, wont, scoped } = capabilityList(sheet);
  const out = [HEADINGS.can, HEADINGS.wont, HEADINGS.scoped, INTROS.can, INTROS.wont, INTROS.scoped];
  for (const i of can) out.push(i.what, i.detail);
  for (const i of wont) out.push(i.what, i.why);
  for (const i of scoped) out.push(i.what, i.detail);
  return out;
}

/** Only this sheet's own items — what proves a check read THIS page rather than
 *  matching a sentence all three sheets carry. */
export function sheetOnlyStrings(sheet) {
  if (!SHEETS.includes(sheet)) throw new Error(`capabilities: "${sheet}" is not a sheet.`);
  const e = EXTRA[sheet];
  const out = [];
  for (const i of e.can) out.push(i.what, i.detail);
  for (const i of e.wont) out.push(i.what, i.why);
  for (const i of e.scoped) out.push(i.what, i.detail);
  return out;
}

/* THE FLOORS. A list that lost half its items still renders, still looks
   finished, and still gets printed and handed to somebody. */
export const MIN_CAN = 5;
export const MIN_WONT = 6;
export const MIN_SCOPED = 5;
const MIN_REASON = 120;

/** Refuses a thinned, mislabelled or unexplained list. Exits rather than
 *  throwing, so a caller cannot file a rule violation as a flaky import. */
export function assertCapabilities(who) {
  const problems = [];

  if (CAN.length < MIN_CAN) problems.push(`CAN holds ${CAN.length}, floor is ${MIN_CAN}`);
  if (WONT.length < MIN_WONT) problems.push(`WONT holds ${WONT.length}, floor is ${MIN_WONT}`);
  if (SCOPED.length < MIN_SCOPED) problems.push(`SCOPED holds ${SCOPED.length}, floor is ${MIN_SCOPED}`);

  /* BOTH BASES MUST SURVIVE. A list that drifted to all-'promise' would read as
     a practice hiding behind its paperwork; one that drifted to all-'choice'
     would read as preference, and the card-data line is not a preference. */
  const bases = new Set(WONT.map((i) => i.basis));
  for (const i of WONT) {
    if (i.basis !== 'promise' && i.basis !== 'choice') {
      problems.push(`WONT "${i.id}" carries basis "${i.basis}", which is neither promise nor choice`);
    }
    if (!i.why || i.why.length < MIN_REASON) {
      problems.push(`WONT "${i.id}" has ${(i.why || '').length} characters of reason, floor ${MIN_REASON}`);
    }
  }
  if (!bases.has('promise')) problems.push('no item in WONT rests on a promise — the card-data line has gone');
  if (!bases.has('choice')) problems.push('no item in WONT is a choice — the list now reads as inability');

  /* EVERY SHEET HAS AN EXTRA IT CAN BE TOLD APART BY. A sheet whose extras all
     emptied would pass every delivery check on every page, which is the same as
     having no check at all. */
  for (const sheet of SHEETS) {
    if (!EXTRA[sheet]) problems.push(`sheet "${sheet}" has no entry in EXTRA`);
    else if (sheetOnlyStrings(sheet).length === 0) {
      problems.push(`sheet "${sheet}" adds nothing of its own, so no gate can tell its list from another sheet's`);
    }
  }

  /* AND NO TWO SHEETS MAY SHARE AN EXTRA. Two sheets carrying the same
     sheet-only sentence would each fail the other's absence control, and the
     failure would read as a rendering bug rather than as a data mistake. */
  const seen = new Map();
  for (const sheet of SHEETS) {
    for (const s of sheetOnlyStrings(sheet)) {
      if (seen.has(s) && seen.get(s) !== sheet) {
        problems.push(`"${s.slice(0, 50)}…" is claimed by both ${seen.get(s)} and ${sheet}`);
      }
      seen.set(s, sheet);
    }
  }

  if (!problems.length) return;
  console.error(`${who}: ${problems.length} problem(s) in the capability list:`);
  for (const p of problems) console.error(`  - ${p}`);
  console.error(`${who}: fix them in src/lib/capabilities.js.`);
  process.exit(2);
}
