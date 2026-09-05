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

   THE LINK IS null UNTIL THE ACCOUNT EXISTS, and that is load-bearing rather
   than a placeholder. A button pointing at a link nobody has created is worse
   than no button: it reads as working and fails at the one moment somebody has
   decided to pay. Every consumer of ASSESSMENT_PAYMENT_LINK must check it, the
   /ai-fit/ page renders nothing when it is null, and scripts/verify-payments.mjs
   asserts BOTH states rather than only the happy one.

   PLAIN ESM, NOT TYPESCRIPT, for the same reason as src/lib/pricing.js: a .mjs
   gate imports this natively, so the check reads the value the page renders
   instead of a second copy of it.
   ============================================================================ */

/**
 * The hosted Stripe page that collects the AI Fit Assessment fee.
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
export const ASSESSMENT_PAYMENT_LINK = null;

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
 * Fees read from stripe.com/pricing on 2026-09-03 and registered as an ageing
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
export const canTakePayment = (link = ASSESSMENT_PAYMENT_LINK) =>
  typeof link === 'string'
  && link.startsWith('https://buy.stripe.com/')
  && !link.startsWith('https://buy.stripe.com/test_');

/**
 * The sentence under the pay button. It is here rather than in the page for the
 * same reason a price qualifier lives beside its figure: a button that takes
 * money and says nothing about what happens next is the shape of every checkout
 * a small business owner has learned to distrust.
 */
export const PAY_NOTE =
  'You are handed to Stripe to pay. Your card details go to them and never to this site or to me. '
  + 'I will email you within a day or two to arrange the visit.';
