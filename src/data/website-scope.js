/* ============================================================================
   WHAT A WEBSITE BUILD BUYS — one source, read by three surfaces.

   Straight off §1 of docs/engagement/agreements/website-build-scope.md, which
   gained §1.7 on 2026-09-11: a payment link connected to the client's own
   account. D96 carries the reasoning. THE COUNT IS NOT IN THIS COMMENT AND MUST
   NOT COME BACK — it read "the six things" through six versions of this file and
   was wrong the moment a seventh landed, which is D22's rule applied to a
   sentence rather than to a page. Derive it from `included.length`.
   THE SCOPE IS THE ARGUMENT FOR THE NUMBER, so this list and that document must
   not drift — five of these six were never priced into the published shelf
   floor, which is the whole reason a second floor exists.

   WHY IT IS A PLAIN .js MODULE AND NOT PART OF websites.astro, WHICH IS WHERE
   IT LIVED UNTIL 2026-09-10. An .astro file is readable by exactly one thing:
   the Astro build. The printed comparison sheet is rendered by a Node script,
   and a Node script imports plain ESM natively and cannot read .astro or .ts at
   all. So the list was invisible to the one document whose entire job is
   arguing what the figure buys, and the sheet answered it in a single borrowed
   sentence on its last page. The same reasoning is written into
   src/lib/pricing.js's header for the same reason.

   ITEM 03 SAYS `checked against` AND NEVER `set up`. D84: the Business Profile
   is the client's to create, verify and hold, and nobody here takes a seat on
   one. Reading what a listing shows the public needs no access, and that
   comparison is one of the six things the floor is argued from — which is why
   D55's refusal to cut it still stands. scripts/lib/listing-access.mjs holds
   the rule and three gates read it.

   FIELD NAMES ARE `n`, `t`, `b` because that is what the template already
   spreads. Renaming them would be a second edit buying nothing.
   ============================================================================ */

/** @type {{ n: string, t: string, b: string }[]} */
export const included = [
  {
    n: '01',
    t: 'A website that belongs to you',
    b: 'Built for your business rather than picked off a rack, on a domain and hosting in your name. You hold the accounts. I do not sit between you and anything.',
  },
  {
    n: '02',
    t: 'Email from your own address that lands in inboxes',
    b: 'The records that tell the world your mail is really yours. Skip them and a quote sent to a customer goes to junk, which is the failure nobody notices until they lose the job.',
  },
  {
    n: '03',
    t: 'Findable, and right when somebody shares it',
    b: 'Your site submitted to Google with your business details in the form it reads directly, checked against what your Google listing already shows the public, and the link showing your name and a real picture when it is pasted into a message rather than a blank box.',
  },
  {
    n: '04',
    t: 'A privacy page and a terms page in your name',
    b: 'The moment a form on your site asks for a name and an email, California law reaches you whatever state you trade in, and there is no size threshold to hide under.',
  },
  {
    n: '05',
    t: 'One working tool built into the site',
    b: 'Not a contact form. The arithmetic your business actually runs on — the tip-out, the reorder point, the job quote — sitting on your own site where your customers or your crew can use it.',
  },
  {
    n: '06',
    t: 'Handed over so it survives without me',
    b: 'Every account tested by you logging into it while I watch, not a list of passwords in an email. If I disappear, nothing about your business stops.',
  },
  {
    n: '07',
    t: 'A way to be paid, on your own account',
    b: 'A button that sends your customer to a payment page your own provider runs, for a deposit or a single item, tested with a real payment before you get the keys. Your account, never mine, and the card details never touch anything I built. If you have no account yet, opening one is quoted separately.',
  },
];

/** The floor. It is not a style choice — it tracks the subsection count of §1 of
 *  the signed scope, and a list that has quietly lost one has stopped being the
 *  argument for the figure. Every importer calls this before rendering.
 *
 *  IT IS A FLOOR RATHER THAN AN EQUALITY, WHICH IS WHY §1.7 COST NOTHING HERE.
 *  Had it been written as `!== 6`, adding a section to the signed document would
 *  have failed a gate that was right about the number and wrong about the world. */
export function assertScopeIntact(who) {
  const short = included.filter((i) => !i.n || !i.t || (i.b || '').length < 80);
  if (included.length >= 6 && !short.length) return;
  console.error(`${who}: the website scope list holds ${included.length} item(s), ${short.length} of them thin.`);
  console.error(`${who}: §1 of the signed scope has more than that. This list IS the argument for the figure.`);
  process.exit(2);
}
