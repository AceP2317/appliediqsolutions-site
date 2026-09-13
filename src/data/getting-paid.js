/* ============================================================================
   GETTING PAID — one source, read by /getting-paid/, by
   scripts/make-getpaid-pdf.mjs and by scripts/make-getpaid-cheatsheet.mjs.

   WHY IT IS SEPARATE FROM platform-comparison.js. That file answers "where
   should my website live". This one answers "how should the money reach my
   bank", and three of its nine cards already publish a processor rate as part of
   a website argument — Square Online, Shopify, and the Square free plan. Those
   rates are correct there and they are scoped to a PLAN rather than to a
   payments decision, which is exactly the confusion this page exists to clear
   up. external-claims.js:622 carries that warning in its own words.

   THE GROUPING PRINCIPLE IS HOW THE BUSINESS ENDED UP WITH THE RATE IT HAS, and
   it is what lets one sheet serve a restaurant counter and a digital storefront
   at the same width. Three cards name one company because the owner chose it.
   Three group several because nobody chose anything: the rate came bundled with
   software already being paid for, or it arrived with hardware a bank sold, or
   it is a personal app being used for business. One card hands the selling over
   entirely. One takes no card at all. One is mine.

   THE AUDIENCE IS ANY SMALL BUSINESS, INCLUDING ONE THAT ONLY EXISTS ONLINE.
   That is wider than /websites/compare/ and it is deliberate — D29 says local is
   the home base and not a fence. It is also what put the merchant-of-record card
   on the sheet, because a business selling across a border faces a question
   about who owes the tax that a shop on Middle Street never meets.

   EVERY FIGURE WAS READ IN A BROWSER ON 2026-09-11 ON THAT COMPANY'S OWN PAGE,
   and every one is registered in src/data/external-claims.js so it ages and
   warns. They are `assisted`: Claude can re-read them by driving the browser,
   nothing here may probe those hosts automatically, and neither kind ever passes
   a check — they only age. REACHABLE_HOSTS defaults to no and D64 already
   refused adding a payment host to it.

   WHAT THE READING CHANGED, and this is why it was worth doing rather than
   quoting a comparison somebody else published:

     - TOAST PUBLISHES NO PROCESSING RATE AT ALL. Its pricing page says "custom
       pricing" and "simple, flat rate" with no number on it, and states that
       Toast is a payment facilitator rather than a processor. The terminals card
       refuses to print a figure because of that, rather than in spite of it.
     - INTUIT'S OWN COMPARISON TABLE IS STAMPED 30 APRIL 2026 AND TWO OF ITS
       COMPETITOR FIGURES ARE WRONG TODAY. It shows Stripe ACH at 1.2% where
       Stripe's page says 0.8% capped at $5, and Square in person at 2.6% + 10c
       where Square's page says 2.6% + 15c. Both were read the same day. That is
       the single best argument for this page existing: the comparison a business
       finds is written by somebody selling to them.
     - SQUARE'S FREE PLAN HAS NO ACH CAP. 1% with a $1 minimum and no ceiling on
       an invoice, against a $10 ceiling on Plus. A $10,000 invoice costs $100
       instead of $10, and nothing on the plan card says so.
     - VENMO'S BUSINESS PROFILE IS THE CHEAPEST HEADLINE RATE HERE. 1.9% + 10c
       beats every card processor on this sheet. That belongs on the page because
       it is true, not in spite of being inconvenient.
     - STRIPE NOW SELLS A MERCHANT-OF-RECORD PRODUCT. Managed Payments at 3.5% on
       top of payment fees. So the merchant-of-record card is not a niche two
       companies occupy.

   EVERY ENTRY MUST CARRY `doesBetter`, AND A GATE ENFORCES IT.
   scripts/verify-getpaid.mjs fails the run if any option's `doesBetter` text is
   missing from the rendered page, and refuses one under 100 characters. It is
   the row that makes the other four believable, and it is the row that quietly
   goes first in a later copy pass — nobody deletes it on purpose, it just gets
   softened until it says nothing.

   THE COUNT IS NEVER TYPED. Derive it from `options.length`, per D22.
   ============================================================================ */

/** The fixed row set, in the order every card prints it. A shared order is what
    lets a reader compare down a column instead of reassembling nine paragraphs,
    and naming the rows here rather than in the template is what stops one card
    quietly growing a sixth row that none of the others has. */
export const rows = [
  { key: 'costToBePaid', label: 'What it costs you to be paid' },
  { key: 'whenMoneyArrives', label: 'When the money actually reaches your bank' },
  { key: 'takeWithYouOnLeaving', label: 'What you take with you if you leave' },
  { key: 'doesBetter', label: 'What it does better than I do' },
  { key: 'whoFixesIt', label: 'Who fixes it when it breaks' },
];

/** The date every figure below was read off the vendor's own page, in a browser.
    Printed in visible copy on the page and on both PDFs, because printed paper
    does not warn and the read date is the only thing that tells a reader a sheet
    in a drawer has gone stale. */
export const READ_ON = '11 September 2026';

/** The two worked examples the cost tables run on.

    THERE ARE TWO BECAUSE THE AUDIENCE IS TWO BUSINESSES. A shop taking most of
    its money over a counter and a business that only exists online get different
    answers from the same arithmetic, and three of the nine options refuse to
    price one of the two — which is itself the most useful thing those cards say.
    One example would have hidden that behind whichever business it described.

    THESE NUMBERS ARE AN ASSUMPTION AND THE PAGE SAYS SO BESIDE THEM. They are
    not a claim about what any other business does. That shape was already
    refused once in this repo, at platform-comparison.js:210-216, because a
    benchmark about other people is the weakest thing you can hand a reader
    deciding about her own shop. A reader swaps in his own three numbers and the
    arithmetic is identical. */
export const EXAMPLES = [
  {
    id: 'counter',
    monthlyVolumeCents: 1500000,
    averageTicketCents: 4500,
    inPersonShare: 0.7,
    title: 'A shop',
    label: '$15,000 a month through the card, an average sale of $45, and seven dollars in ten taken over a counter',
  },
  {
    id: 'online',
    monthlyVolumeCents: 800000,
    averageTicketCents: 8000,
    inPersonShare: 0,
    title: 'A business that only exists online',
    label: '$8,000 a month through the card, an average sale of $80, and nothing taken in person',
  },
];

export const options = [
  {
    id: 'stripe',
    name: 'Stripe',
    kind: 'You chose it',
    how: 'Chosen deliberately, usually for a website',
    claimIds: ['stripe-fees-us', 'stripe-managed-payments-mor'],
    rates: { onlinePct: 290, onlineFixedCents: 30, inPersonPct: 270, inPersonFixedCents: 5, monthlyUsd: 0 },
    headline: '2.9% + 30c online, 2.7% + 5c in person',
    costToBePaid:
      'No monthly fee and no minimum. Online is 2.9% plus 30 cents; in person is 2.7% plus 5 cents, and a further 10 cents if you tap the card against a phone. A bank transfer is 0.8% and stops at five dollars however large the invoice, which is the cheapest way on this page to collect a big number. International cards add 1.5% and a currency conversion adds 1%.',
    whenMoneyArrives:
      'On a schedule you set — rolling, weekly or monthly. A disputed payment costs fifteen dollars to receive and fifteen more to answer, and you get the second one back if you win.',
    takeWithYouOnLeaving:
      'Your customer records and your card details both move, because Stripe will migrate saved cards to another processor on request. Your payment history is exportable. This is the strongest leaving story here and it is the reason developers pick it.',
    doesBetter:
      'Everything about being a website. It is the one built for a developer to wire into a page, the documentation is the best in the industry, and if your business lives on the internet rather than on a street this is the default for good reasons.',
    whoFixesIt:
      'Stripe, by email, chat or phone, around the clock. You will be talking to somebody technical, which helps if your problem is technical and does not if your problem is that you cannot find a button.',
  },
  {
    id: 'square',
    name: 'Square',
    kind: 'You chose it',
    how: 'Chosen deliberately, usually for a counter',
    claimIds: ['square-fee-table-2026', 'square-free-online-site', 'square-online-card-rate'],
    rates: { onlinePct: 330, onlineFixedCents: 30, inPersonPct: 260, inPersonFixedCents: 15, monthlyUsd: 0 },
    headline: '2.6% + 15c in person, 3.3% + 30c online on the free plan',
    costToBePaid:
      'The free plan is 2.6% plus 15 cents at the counter and 3.3% plus 30 cents online. Paying $49 a month for Plus drops those to 2.5% and 2.9%. A typed-in card is 3.5% plus 15 cents on every plan. Watch the bank transfer line: on the free plan an invoice paid by transfer is 1% with no ceiling, so a ten thousand dollar invoice costs a hundred dollars, where Plus caps the same fee at ten.',
    whenMoneyArrives:
      'Next day on every plan, at no charge, which is genuinely unusual. Same-day costs extra. Square is also the one most often reported to hold funds on a newly busy account, and there is no appeal you can telephone.',
    takeWithYouOnLeaving:
      'Your customer list and your item catalog export. Your card-on-file records do not travel, so anything on a subscription has to be re-entered by the customer, and that is where a move actually hurts.',
    doesBetter:
      'Being one thing instead of five. Register, card reader, online store, invoices, payroll and a bank account that all already know about each other, for nothing a month. For a shop or a salon that is worth more than a fifth of a point on the rate.',
    whoFixesIt:
      'Square, and there is a telephone number that a person answers during business hours. The hardware is theirs too, so a dead reader is one conversation rather than two.',
  },
  {
    id: 'paypal',
    name: 'PayPal',
    kind: 'You chose it',
    how: 'Chosen deliberately, or inherited from a buyer who insisted',
    claimIds: ['paypal-merchant-fees-us', 'paypal-risk-rate-increase'],
    rates: { onlinePct: 349, onlineFixedCents: 49, inPersonPct: 229, inPersonFixedCents: 9, monthlyUsd: 0 },
    headline: '3.49% + 49c through a PayPal checkout, 2.29% + 9c in person',
    costToBePaid:
      'The dearest common rate here. A PayPal checkout is 3.49% plus 49 cents; a plain card through them is 2.99% plus 49 cents; a QR code at a counter is 2.29% plus 9 cents. An invoice paid by bank transfer is 1% capped at ten dollars. A chargeback is twenty dollars and a dispute is fifteen, thirty if you have a lot of them. Selling abroad adds 1.5%, and converting the currency costs a further 3% to 4% — the widest conversion spread on this page.',
    whenMoneyArrives:
      'Quickly into your PayPal balance, then free to your bank on the standard route or 1.5% to have it now. Read the risk clause before you rely on any of that: PayPal reserves the right to raise your rate by up to five percentage points on thirty days notice if it decides your account looks risky, and it is the only company on this sheet that publishes such a term.',
    takeWithYouOnLeaving:
      'Very little that matters. The buyer relationship is PayPal’s — they hold the payment method and the buyer trusts them rather than you — so leaving means your repeat customers have to pay you a new way.',
    doesBetter:
      'Getting a stranger to finish the purchase. A buyer who will not type a card number into a small business website will click a button they already have an account with, and for a new shop with no reputation that is the difference between a sale and a bounce.',
    whoFixesIt:
      'PayPal, eventually. Support is the weakest thing about them and the account-freeze stories are real, but they are also thirty years old and they are not going to disappear with your money.',
  },
  {
    id: 'bundled',
    name: 'Payments built into software you already pay for',
    kind: 'Nobody chose it',
    how: 'Shopify, Wix, Squarespace, QuickBooks — it came with the subscription',
    claimIds: ['squarespace-payment-rates', 'wix-payments-fees-us', 'quickbooks-payment-rates', 'shopify-price-basic'],
    rates: {
      onlinePct: 290,
      onlineFixedCents: 30,
      monthlyUsd: 29,
      onlineOnly: true,
      onlineOnlyReason:
        'This is the rate on money taken through your website. The share you take over a counter runs through something else, so it cannot be costed on this line.',
    },
    headline: '2.9% + 30c, and the rate moves with the plan rather than with you',
    costToBePaid:
      'The rate rides on the subscription, which is the whole point of this card. Squarespace charges 2.9% plus 30 cents on its two cheaper plans and 2.5% on its dearest, so the same sale costs different money depending on a website decision. Wix is 2.9% plus 30 cents — except American Express, which is 3.7%. Shopify is 2.9% plus 30 cents, and 2% more again if you use any processor other than theirs. QuickBooks is 2.99% on an invoice and 2.5% in person. Squarespace charges 3.2% on a rewards card and Wix charges more for Amex, and neither of those is on the page you read when you chose the plan.',
    whenMoneyArrives:
      'On the platform’s schedule, usually two days. The thing to know is that a failed subscription payment can take the storefront down, and the payments stop with it — the money and the website share a switch.',
    takeWithYouOnLeaving:
      'The orders usually export. The payment history often does not, and neither do the saved cards, so a subscription business that moves platforms asks every customer to pay again. That is the most expensive sentence on this card.',
    doesBetter:
      'Not making you do anything. It is already on, it is already connected to the catalog and the tax settings and the order emails, and for a business selling twenty things online the saved afternoon is worth more than the rate difference.',
    whoFixesIt:
      'The platform, and only during their hours. When the payment breaks you are explaining a payments problem to a website company, which is a worse conversation than it sounds.',
  },
  {
    id: 'terminals',
    name: 'The terminal your bank sold you',
    kind: 'Nobody chose it',
    how: 'Clover, Toast and the readers a bank or reseller puts on your counter',
    claimIds: ['clover-retail-rates', 'toast-no-published-rate'],
    rates: {
      quoteOnly: true,
      quoteReason:
        'Nothing here can be costed, and that is the finding. Toast publishes no processing rate at all — its pricing page says "custom pricing" and "simple, flat rate" with no number on it. Clover publishes rates only for a system bought directly from Clover online, and its page says so; the one a bank or reseller sells you is a different rate on a different contract. Ask for the number in writing before you sign anything.',
    },
    headline: 'No published rate you can rely on — ask, in writing',
    costToBePaid:
      'Bought straight from Clover, a retail system is 2.6% plus 10 cents on the cheapest tier and 2.3% plus 10 cents above it, with a typed-in card at 3.5% plus 10 cents, hardware from $349 to $2,648 or spread over thirty-six months, and software from $84.95 a month. Clover’s own page says those prices are only available online. Toast starts at $0 a month for a starter kit and $69 for the software, and does not publish a processing rate anywhere. So the honest answer is that you cannot know what this costs until somebody quotes you, and a thirty-six month term is the usual price of finding out.',
    whenMoneyArrives:
      'Next day as a rule, or within minutes for 1.75% on Clover. The contract is the thing to read rather than the payout schedule: these are the only options here sold on a multi-year term, and leaving early is the expensive part.',
    takeWithYouOnLeaving:
      'The hardware, if you bought rather than leased it, and usually nothing else. The menu, the item catalog and the order history live in their system, and a restaurant that has run four years on one of these is not moving in a weekend.',
    doesBetter:
      'Running the actual floor. Toast for a restaurant and Clover for a busy retail counter do table management, kitchen tickets, shift handover and stock in a way nothing else here approaches, and a rate is a poor reason to refuse the tool that runs your business.',
    whoFixesIt:
      'Whoever sold it to you, which may be your bank rather than the manufacturer, and that is worth establishing on day one rather than on a Saturday night.',
  },
  {
    id: 'p2p-apps',
    name: 'Venmo, Cash App and Zelle',
    kind: 'Nobody chose it',
    how: 'The app you already had, now taking business money',
    claimIds: ['venmo-business-profile-fees', 'cashapp-business-fees', 'zelle-business-no-fee'],
    rates: { onlinePct: 190, onlineFixedCents: 10, inPersonPct: 229, inPersonFixedCents: 9, monthlyUsd: 0 },
    headline: 'Venmo business profile 1.9% + 10c — the cheapest headline on this page',
    costToBePaid:
      'A Venmo business profile is 1.9% plus 10 cents, or 2.29% plus 9 cents if the customer taps a card against your phone. Cash App for Business is 2.6% plus 15 cents, or 3% for a tap. Zelle charges nothing at all, because Zelle is not a processor — it moves money between bank accounts and your bank decides whether you can use it for business. Taking business money on a PERSONAL Venmo account is the expensive mistake: the sender can mark it as goods and services and you are charged 2.99% on a payment you thought was free.',
    whenMoneyArrives:
      'Fast, and that is the appeal. It is also the risk: Zelle is irreversible and Zelle’s own guidance is to treat it like cash and only use it with people you trust. None of the three gives you what a card network gives you when a customer disputes a charge.',
    takeWithYouOnLeaving:
      'Nothing, because nothing was ever yours. There is no customer list, no exportable payment history a bookkeeper will accept without argument, and no record tying a payment to an invoice. At tax time that is the bill for the cheap rate.',
    doesBetter:
      'Price, and it is not close. Venmo’s business rate beats every card processor on this page, the customer already has the app, and for a market stall or a mobile trade taking twenty payments a week it may genuinely be the right answer. Get a business profile rather than using your personal one.',
    whoFixesIt:
      'Nobody you can telephone. Support is a form, the answer takes days, and for Zelle the answer comes from your bank rather than from Zelle.',
  },
  {
    id: 'merchant-of-record',
    name: 'Somebody else becomes the seller',
    kind: 'You handed the selling over',
    how: 'Paddle, Lemon Squeezy, and Stripe’s Managed Payments',
    claimIds: ['paddle-pricing', 'lemonsqueezy-pricing', 'stripe-managed-payments-mor'],
    rates: {
      onlinePct: 500,
      onlineFixedCents: 50,
      monthlyUsd: 0,
      onlineOnly: true,
      onlineOnlyReason:
        'These sell digital things over the internet. There is no version of this that takes a card at a counter, so the in-person share of your money cannot run through it.',
    },
    headline: '5% + 50c, and they owe the tax instead of you',
    costToBePaid:
      'Paddle and Lemon Squeezy both charge 5% plus 50 cents, with no monthly fee. Stripe’s Managed Payments charges 3.5% on top of its ordinary payment fees, which works out dearer than either on most sale sizes. That is roughly double what Stripe alone costs, and what you are buying with the difference is that they become the legal seller: they calculate, collect and remit sales tax, VAT and GST in the countries you sell into, and they carry the fraud and the chargebacks.',
    whenMoneyArrives:
      'On a payout schedule rather than continuously, typically twice a month, so your cash sits with them longer than it would anywhere else here. A refund comes out of a future payout.',
    takeWithYouOnLeaving:
      'This is the card where leaving costs most, and for a reason people miss: the buyer’s receipt has their name on it, not yours. Every subscription is legally theirs, so moving means re-signing every customer, and the chargeback history you built does not follow you.',
    doesBetter:
      'Making a tax problem disappear. If you sell software or a download to buyers in several countries, working out where you have crossed a registration threshold is a real job with real penalties, and handing the whole thing to somebody who does it for a living is worth five percent. For a business selling to one country it is money for nothing. If what you sell is physical rather than a download, a marketplace does the same thing to you without calling it that — the store sheet asks the same question about every platform on it, because who the legal seller is decides who owes the tax there too.',
    whoFixesIt:
      'They do, including your customer’s support email about a charge, because as far as the card network is concerned they sold it.',
  },
  {
    id: 'no-processor',
    name: 'An invoice and a bank transfer',
    kind: 'No card at all',
    how: 'What plenty of trades and consultancies already do',
    /* NO CLAIM IDS, AND THAT IS THE POINT RATHER THAN AN OMISSION. Every sentence
       below is structural — true by how banks and invoices work — so it needs no
       vendor page and cannot go stale. The same reasoning is written out at
       platform-comparison.js:210-216 for the no-website row. */
    claimIds: [],
    rates: { onlinePct: 0, onlineFixedCents: 0, inPersonPct: 0, inPersonFixedCents: 0, monthlyUsd: 0 },
    headline: 'Nothing, and it is the only free row on this page',
    costToBePaid:
      'Nothing. You send an invoice, they transfer the money, and no percentage comes off it. What it costs instead is not money: somebody has to notice the payment arrived, match it to the invoice, and chase the ones that did not. That is an hour a week you are already spending if you do this today.',
    whenMoneyArrives:
      'One to three days for an ordinary transfer, and there is no hold, no reserve and nobody deciding your account looks risky. Once it is in, it is in — a transfer is not reversible the way a card payment is, which cuts both ways.',
    takeWithYouOnLeaving:
      'Everything, because there is nothing to leave. The records are your own bookkeeping and the relationship is with the customer rather than with a platform.',
    doesBetter:
      'Cost, and it is not close. It is free, it needs no account and no approval, and for a trade billing ten customers a month in four figures it is very hard to beat — a card on a $6,000 job costs about $174 and a transfer costs nothing. Consider a card only for the customers who will not pay any other way.',
    whoFixesIt:
      'Your bank, and it almost never breaks. What breaks is somebody paying late, and no processor on this page fixes that either.',
  },
  {
    id: 'aiq',
    name: 'An account in your name, and I connect it',
    kind: 'Mine',
    how: 'Whichever of the above you pick, opened by you and wired in by me',
    claimIds: [],
    isMine: true,
    rates: {
      passThrough: true,
      passThroughReason:
        'I add nothing to what you are charged, so this costs exactly whatever the option you picked above costs. There is no figure to print here and inventing one would be inventing a fee.',
    },
    headline: 'Their rate, with nothing added by me',
    costToBePaid:
      'The processor’s own rate, and not a cent more. I take no percentage, no markup and no share of anything you sell — that is a term in the agreement rather than a promise. If I am building you a site, one payment link connected to one page is included in it. If you have no account with a processor yet, opening one with you is quoted before it starts, because that runs on their identity checks rather than on my time. An actual store — a basket, a checkout, stock counts — is separate work with its own price, and I do not build shipping by address or sales tax by state at any price.',
    whenMoneyArrives:
      'Whenever your processor says, because I am not in the path and never will be. The money goes from your customer to your account without passing through anything of mine.',
    takeWithYouOnLeaving:
      'All of it, because none of it was ever mine. The account is opened in your name with your email and your bank details, I am never an owner on it, and there is nothing for you to take back from me later.',
    doesBetter:
      'Nothing at all, on price — I am not a processor and I do not compete with one. What I do instead is read the table above with your actual numbers in it, tell you which row you are in today, and say plainly when the answer is to change nothing.',
    whoFixesIt:
      'The processor, for anything about the money, because that is their job and their license. Me, for anything about the thing I built that points at them.',
  },
];

/* THE SHEET REFUSES TO BUILD BELOW THIS, and the floor is not decoration. A
   comparison that lost half its options to a bad edit would still render, still
   look finished, and still be published. verify-getpaid.mjs asserts both. */
export const MIN_OPTIONS = 6;
export const MIN_ROWS = 4;
