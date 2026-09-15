/* ============================================================================
   HOW MONEY ARRIVES — one copy, and it is deliberately small.

   WHY THIS FILE EXISTS. Until 2026-09-03 this practice published three prices
   and had no way to collect any of them. The only payment machinery anywhere in
   the repo was three unfilled placeholders in a client invoice —
   `[FILL: Bank transfer — account details or payment link]` and two like it —
   plus two Permissions-Policy headers DENYING the browser payment interface.

   THE WHOLE DESIGN IS "HOSTED PAGES ONLY", AND IT IS NOT A PREFERENCE. Three
   separate constraints each force it on their own:

     1. A SIGNED TERM. master-services-agreement.md and
        founding-build-agreement.md both represent that the consultant "does not
        see, store, transmit or process payment card data". A card field on a
        page this repo builds would make a term a client has signed false. On a
        Stripe-hosted page the card is typed on Stripe's page and never touches
        this origin, so the representation stays true.
     2. NO STORAGE. wrangler.jsonc binds exactly one thing, the static assets.
        There is no KV, no D1, no R2, no Durable Object. A payment confirmation
        arriving by webhook would have nowhere to be written, so the only honest
        design is one where nothing has to be written back.
     3. THE HEADER. public/_headers sends `Permissions-Policy: payment=()` for
        the whole site, and worker/index.js re-denies it on /meet/. An embedded
        checkout would need that opened. A LINK OUT does not — the policy governs
        this origin's own pages, and a navigation away from them is not affected.

   SO THERE IS NO SERVER ROUTE HERE, no secret key, and nothing for a gate to
   classify in the Worker's environment. The site's whole involvement in a
   payment is a link. Stripe does the rest and emails the operator.

   WHAT IS DELIBERATELY NOT HERE. Stripe's tax calculator: invoice.md already
   cites N.C.G.S. 105-164.13(43) for custom software not being taxed in North
   Carolina, so a calculator would work out a tax that should not be charged.

   THE LINKS ARE null UNTIL THE ACCOUNT EXISTS, and that is load-bearing rather
   than a placeholder. A button pointing at a link nobody has created is worse
   than no button: it reads as working and fails at the one moment somebody has
   decided to pay. Every consumer must check, and scripts/verify-payments.mjs
   asserts BOTH states rather than only the happy one.

   THERE ARE TWO NOW, AND NO PAGE RENDERS EITHER — 2026-09-06. The AI Fit
   Assessment became one product in two forms, on video and in the business, and
   the operator assigns the form rather than the buyer choosing it. That is the
   single argument holding two published figures clear of D5's ban on a menu, so
   /ai-fit/ cannot offer a pair of pay buttons: two buttons IS the buyer
   choosing. One button cannot work either, because nothing on that page knows
   which form a visitor needs, and a button charging the wrong amount is worse
   than none.

   SO THE SITE'S PAY PATH IS NOW AN EMAIL, and that costs less than it sounds.
   The form is assigned in a conversation that was already happening; the right
   link goes in the reply. Nothing here becomes machinery, which is the same
   trade D52 made over the calendar. verify-payments.mjs asserts the ABSENCE on
   the page and the shape of both links here.

   PLAIN ESM, NOT TYPESCRIPT, for the same reason as src/lib/pricing.js: a .mjs
   gate imports this natively, so the check reads the value the page renders
   instead of a second copy of it.
   ============================================================================ */

/**
 * The hosted Stripe page that collects the fee for an AI Fit Assessment done on
 * video. Sent by email once the form is assigned; no page links to it.
 *
 * SET THIS ONLY FROM A LINK THAT HAS BEEN OPENED IN A BROWSER AND SEEN TO ASK
 * for the right amount. A Stripe payment link is created in Stripe's own
 * dashboard, so nothing in this repo can verify the AMOUNT behind it — the gate
 * can only check the shape of the address and that the page renders. That gap
 * is the reason for this sentence rather than a comment saying "the link".
 *
 * Must be an https://buy.stripe.com/ address. A test-mode link starts
 * https://buy.stripe.com/test_ and MUST NOT ship: verify-payments.mjs refuses
 * one, because a test link takes a real customer's decision to pay and returns
 * nothing, and it looks identical from the page.
 */
export const ASSESSMENT_VIDEO_PAYMENT_LINK = null;

/**
 * The same, for an assessment done in the business. Everything in the comment
 * above applies here word for word, including that the amount behind the link
 * is the one thing nothing in this repo can verify — and it matters more here,
 * because this is the larger of the two and the two are one digit apart to
 * anybody creating them in a hurry.
 */
export const ASSESSMENT_ONSITE_PAYMENT_LINK = null;

/**
 * What a client may pay with, in the order the practice prefers them.
 *
 * BANK TRANSFER IS FIRST AND THE REASON IS ARITHMETIC, not preference. Card
 * costs 2.9% plus 30 cents; a bank transfer costs 0.8% and stops at $5 whatever
 * the size. On a $4,500 website billed as a deposit and a balance that is about
 * $14 against about $135. On the $1,000 assessment the gap is much smaller —
 * $5 against $29.30 — which is why the assessment can reasonably be a card
 * payment on a link and a build should not be.
 *
 * Fees read from stripe.com/pricing on 2026-09-03 and registered as an aging
 * claim in src/data/external-claims.js. THEY WILL MOVE. Nothing in this repo can
 * check them, because Stripe is not on the REACHABLE_HOSTS allowlist and adding
 * it would be a deliberate act with a name beside it.
 */
export const PAYMENT_METHODS = [
  { id: 'bank', label: 'Bank transfer', note: 'Cheapest for both of us on anything over about $700, and the one I will ask for on a build.' },
  { id: 'card', label: 'Card', note: 'Any card, on a page Stripe hosts. I never see the number.' },
  { id: 'check', label: 'Check', note: 'Payable to Ian David Provencher. Slowest, and entirely fine.' },
];

/**
 * True when the site can actually take a payment for the assessment.
 * Every render site asks this rather than testing the constant itself, so the
 * question is asked one way in one place.
 *
 * IT TAKES AN ARGUMENT ONLY SO A GATE CAN EXERCISE IT, and that is worth a
 * sentence. A control that re-implements this rule inside the checker proves
 * the checker's copy works and says nothing about this function — which is the
 * exact shape LEDGER L-227 names. Passing a link in lets scripts/verify-
 * payments.mjs run the REAL predicate against a test-mode address, a foreign
 * host and an empty string, and watch the answer move. No caller in the site
 * passes anything.
 */
export const canTakePayment = (link) =>
  typeof link === 'string'
  && link.startsWith('https://buy.stripe.com/')
  && !link.startsWith('https://buy.stripe.com/test_');

/** True when BOTH links are live, which is the only state in which the operator
    can send either one without checking first. It has no default argument on
    purpose: there is no longer a single link this question could be about, and
    a default would quietly pick one. */
export const canTakeAnyPayment = () =>
  canTakePayment(ASSESSMENT_VIDEO_PAYMENT_LINK) && canTakePayment(ASSESSMENT_ONSITE_PAYMENT_LINK);

/**
 * The sentence sent WITH a link, in the same message. It is here rather than
 * typed into an email for the same reason a price qualifier lives beside its
 * figure: a request for money that says nothing about what happens next is the
 * shape of every checkout a small business owner has learned to distrust.
 *
 * IT NO LONGER PROMISES "THE VISIT", because half the time there is not one.
 * That word was correct while the assessment had one form and became a false
 * promise the moment it had two.
 */
export const PAY_NOTE =
  'You are handed to Stripe to pay. Your card details go to them and never to this site or to me. '
  + 'I will email you within a day or two to set the time.';
