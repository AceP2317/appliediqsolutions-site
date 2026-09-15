/* ============================================================================
   SELLING ONLINE — one source, read by /stores/, by scripts/make-stores-pdf.mjs
   and by scripts/make-stores-cheatsheet.mjs.

   THE THIRD SHEET, AND THE THREE ANSWER DIFFERENT QUESTIONS. platform-
   comparison.js answers "where should my website live". getting-paid.js answers
   "how should the money reach my bank". This one answers "what does it cost to
   sell a thing online, and who owns the customer afterwards" — and the second
   half of that question is the one nobody else's comparison asks.

   IT PRICES ONE TERM AND SENDS THE OTHER SOMEWHERE ELSE. Every card here is
   costed on what the PLATFORM takes: its plan fee plus its own percentage,
   before any card processor's cut. src/lib/store-cost.js sets out why at length
   — a total including processing compares a bundle against a component and that
   is why every published store comparison disagrees with every other one. Card
   processing belongs to /getting-paid/, which already carries every processor's
   rate with a read date on it, and every card here points at it.

   THE HOURS ARE ON THE SHEET AND ARE NEVER PRICED. Running a store is the
   largest cost in it and nothing can compute the number. So each card answers
   "what it costs you in hours" in words, the page takes the owner's own estimate
   as an input and prints it beside the money rather than inside it, and
   store-cost.js's hoursCost() refuses in one named sentence to convert it. The
   free check already refuses the same conversion for the same reason (L-193).

   THE GROUPING PRINCIPLE IS WHO OWNS THE BUYER WHEN THE SALE IS DONE, which is
   the axis a maker actually decides on and the one no pricing page mentions. A
   store on your own address and a listing on a marketplace can cost the same
   money and leave you in completely different positions two years later.

   EVERY FIGURE WAS READ IN A BROWSER ON 2026-09-11 ON THAT COMPANY'S OWN PAGE,
   and every one is registered in src/data/external-claims.js under the block
   headed THE STORE-PLATFORM AUDIT, so it ages and warns. They are `assisted`:
   Claude can re-read them by driving the browser, nothing here may probe those
   hosts automatically, and neither kind ever passes a check — they only age.

   WHAT THE READING CHANGED, and this is why it was worth doing rather than
   quoting a comparison somebody else published:

     - FACEBOOK AND INSTAGRAM SHOPS STOPPED TAKING THE PAYMENT IN SEPTEMBER 2025.
       Buyers are sent to the seller's own website, and a shop that has not been
       updated needs a checkout URL. Most published comparisons still describe
       Instagram Checkout as a live feature. Every business selling through
       Instagram now needs a website to send people to.
     - BIGCOMMERCE MOVES YOU UP A TIER WITHOUT ASKING. Plans auto-upgrade as
       trailing twelve-month sales pass each threshold. Nobody reading the
       headline price expects that, and it is not a fee, so no comparison lists
       it.
     - ECWID IS PRICED BY HOW MANY THINGS YOU LIST, not by how much you sell.
       That makes it the cheapest entry on the sheet for a maker with a short
       catalog and one of the dearest for a shop with a long one.
     - TIKTOK SHOP'S FEE IS BEHIND A SELLER LOGIN. The page returns 401. The
       figure that circulates comes from summaries of pages nobody could open, so
       this sheet prints that it is not publicly readable rather than repeating a
       number nobody checked.
     - ETSY'S 6.5% LANDS ON THE SHIPPING YOU CHARGED, not only on the price of
       the item. That is the half sellers do not expect.

   EVERY ENTRY MUST CARRY `doesBetter`, AND A GATE ENFORCES IT.
   scripts/verify-stores.mjs fails the run if any card's `doesBetter` text is
   missing from the rendered page, and refuses one under 100 characters. It is
   the row that makes the other five believable, and it is the row that quietly
   goes first in a later copy pass — nobody deletes it on purpose, it just gets
   softened until it says nothing.

   THE COUNT IS NEVER TYPED. Derive it from `cards.length`, per D22.
   ============================================================================ */

/** The fixed row set, in the order every card prints it. A shared order is what
    lets a reader compare down a column instead of reassembling eleven
    paragraphs, and naming the rows here rather than in the template is what
    stops one card quietly growing a seventh row that none of the others has. */
export const rows = [
  { key: 'costToSell', label: 'What the platform takes, before your card processor' },
  { key: 'whoOwnsBuyer', label: 'Who owns the customer when the sale is done' },
  { key: 'takeWithYouOnLeaving', label: 'What you take with you if you leave' },
  { key: 'hoursItCosts', label: 'What it costs you in hours' },
  { key: 'doesBetter', label: 'What it does better than I do' },
  { key: 'whoFixesIt', label: 'Who fixes it when it breaks' },
];

/** The date every figure below was read off the vendor's own page, in a browser.
    Printed in visible copy on the page and on both PDFs, because printed paper
    does not warn and the read date is the only thing that tells a reader a sheet
    in a drawer has gone stale. */
export const READ_ON = '11 September 2026';

/** The two worked examples the cost tables run on.

    THERE ARE TWO BECAUSE THE ANSWER FLIPS BETWEEN THEM, and that flip is the
    single most useful thing on the sheet. A flat monthly plan is dear for a
    maker selling twelve hundred dollars a month and cheap for a shop selling ten
    times that; a marketplace percentage is the other way round. One example
    would have hidden that behind whichever business it described.

    THESE NUMBERS ARE AN ASSUMPTION AND THE PAGE SAYS SO BESIDE THEM. They are
    not a claim about what any other business does. That shape was already
    refused once in this repo, at platform-comparison.js's no-website row,
    because a benchmark about other people is the weakest thing you can hand a
    reader deciding about her own shop. A reader swaps in her own four numbers
    and the arithmetic is identical. */
export const EXAMPLES = [
  {
    id: 'maker',
    monthlyVolumeCents: 120000,
    averageOrderCents: 4500,
    listedItems: 40,
    ownerHoursPerMonth: 10,
    title: 'A maker with a short catalog',
    label:
      '$1,200 a month through the store, an average order of $45, forty things listed, and about ten hours a month spent on it',
  },
  {
    id: 'shop',
    monthlyVolumeCents: 1200000,
    averageOrderCents: 8500,
    listedItems: 300,
    ownerHoursPerMonth: 25,
    title: 'A shop doing real volume',
    label:
      '$12,000 a month through the store, an average order of $85, three hundred things listed, and about twenty-five hours a month spent on it',
  },
];

export const cards = [
  {
    id: 'shopify',
    name: 'Shopify',
    kind: 'Your own store, your own address',
    how: 'The one most people mean when they say "an online store"',
    claimIds: ['shopify-price-basic'],
    fees: { planMonthlyCents: 2900, planName: 'Basic, billed annually', cutHundredths: 0 },
    headline: '$29 a month on Basic, and no cut of what you sell',
    assumption: 'Priced on the Basic plan billed annually. The dearer plans lower the card rate rather than the monthly fee.',
    leavesOut:
      'Apps. A Shopify store that does anything unusual ends up paying for three or four of them, and nothing can work out which ones you will want before you have run it for a season.',
    costToSell:
      'Twenty-nine dollars a month, and Shopify takes no percentage of your sales on top of that — as long as you use their own payment processing. Use anybody else and they add 2% to every order, which is the single largest number on this sheet and the one people find out about after they have moved.',
    whoOwnsBuyer:
      'You do. The customer bought from your store at your address, you have the email, and nothing stops you writing to them next month. That is the difference between this and a marketplace and it is worth more than the rate.',
    takeWithYouOnLeaving:
      'Products, customers and orders export cleanly, which is better than most of this sheet manages. The storefront itself is written in Shopify’s own template language and runs nowhere else, so the look is what you rebuild.',
    hoursItCosts:
      'Less than anything else here. It updates itself, nothing breaks on a Tuesday, and the hours you spend go on photographs and descriptions rather than on keeping software alive. For most people that is what the monthly fee is actually buying.',
    doesBetter:
      'Selling at any scale, and it is not close. Sales tax by jurisdiction and shipping worked out from a buyer’s address are the two things I will not build at any price, and a company whose whole business is keeping those correct maintains them. If you are selling more than a few things a week, you want this rather than me.',
    whoFixesIt:
      'Shopify, around the clock, with the largest ecosystem of any name on this sheet. Whatever has gone wrong, somebody has already written about it.',
  },
  {
    id: 'bigcommerce',
    name: 'BigCommerce',
    kind: 'Your own store, your own address',
    how: 'The full platform that is not Shopify, and Shift4Shop beside it',
    claimIds: ['bigcommerce-plan-prices', 'shift4shop-price'],
    fees: { planMonthlyCents: 3900, planName: 'Core, billed annually', cutHundredths: 0 },
    headline: '$39 a month on Core, and the plan moves up on its own',
    assumption:
      'Priced on the Core plan billed annually. Shift4Shop advertises an unlimited plan at $41 and sits beside this one; the figure in the table is BigCommerce’s.',
    leavesOut:
      'What happens when you have a good year. Plans upgrade themselves as your trailing twelve months of sales pass each threshold, so the price in the table is the price today rather than the price after a strong Christmas.',
    costToSell:
      'Thirty-nine dollars a month on Core, rising to $105 on Growth and $399 on Scale, and no percentage of your sales below the Scale ceiling of $33,333 a month. Above that ceiling they take 0.9% of the excess. The part worth knowing is that you do not choose when to move up — the plan upgrades itself as your trailing twelve months pass each line, and that is not a fee so no comparison lists it.',
    whoOwnsBuyer:
      'You do, exactly as on Shopify. Your address, your customer list, your relationship.',
    takeWithYouOnLeaving:
      'Products, customers and orders export. The storefront is theirs. Same shape as Shopify, with a smaller ecosystem to rebuild into.',
    hoursItCosts:
      'About the same as Shopify — low, and mostly spent on your own photographs. The one thing to diary is the plan threshold, because the month it moves is the month the bill changes without anybody sending you an email first.',
    doesBetter:
      'Giving you more of the store without an app for every piece of it. A good deal of what costs extra on Shopify is included here, which is the reason to look at it at all, and for a business with an unusual catalog that difference is real money.',
    whoFixesIt:
      'BigCommerce, by phone and chat. Fewer people have used it than have used Shopify, so the answer to an odd question is more often theirs to give than a forum’s.',
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    kind: 'Your own store, your own address',
    how: 'A store bolted onto WordPress, running on hosting you rent',
    claimIds: ['woocommerce-cost-model'],
    fees: {
      planMonthlyCents: 0,
      planName: 'The software itself is free',
      cutHundredths: 0,
      rangedMonthly: {
        lowCents: 2500,
        highCents: 35000,
        reason:
          'The software is free and the cost moved somewhere else. WooCommerce’s own pricing page puts hosting at $25 to $350 a month for most stores, and that is their range rather than an estimate of mine. Where in it you land depends on a host you have not picked yet, so this row gives both ends instead of averaging them into a number nobody published.',
      },
    },
    headline: 'Free software, and hosting somewhere between $25 and $350 a month',
    assumption:
      'The range is WooCommerce’s own published figure for hosting, not a guess. Nothing else here is priced, because nothing else here has a price until you choose a host.',
    leavesOut:
      'Extensions, at $29 to $299 a year each, and whoever keeps the thing patched. A Woo store with six extensions is normal and costs more a year than the hosting does.',
    costToSell:
      'Nothing, for the software, and a 0% revenue share — those are both WooCommerce’s own words. Then hosting at $25 to $350 a month, extensions at $29 to $299 a year each, and somebody to keep it all updated. The honest reading of this card is that the platform is free and the cost moved to places that do not appear on a pricing page.',
    whoOwnsBuyer:
      'You do, more completely than anywhere else on this sheet. It is your database on your hosting, and there is no company in the middle of the relationship at all.',
    takeWithYouOnLeaving:
      'Everything. The content, the theme, the orders and the database together. This is the one row where that answer is honestly everything, and it is a large part of why WordPress runs so much of the web.',
    hoursItCosts:
      'The most of anything here, and it is the reason people leave it. WooCommerce is plugins, plugins update, and an update can take a working store down on a Tuesday for a reason nobody chose. Budget an evening a month that you will not always need and will badly want when you do.',
    doesBetter:
      'Freedom, and price at the bottom end. There is a plugin for nearly anything, a plugin costing seventy-nine dollars once beats me building the same thing for four figures, and nobody can switch your store off. If what you need already exists there, buy it and keep your money.',
    whoFixesIt:
      'You, or whoever you pay. It is the option with the most freedom on this sheet and the most homework attached to it.',
  },
  {
    id: 'square-online',
    name: 'Square Online',
    kind: 'It came with something else',
    how: 'Already sitting in the account of anybody taking cards through Square',
    claimIds: ['square-free-online-site', 'square-online-card-rate'],
    fees: { planMonthlyCents: 0, planName: 'Square Free', cutHundredths: 0 },
    headline: 'Nothing a month, and all of it in the card rate instead',
    assumption:
      'Priced on the free plan. The whole of Square’s take is in what they charge to process a card, which is the column this sheet deliberately leaves to /getting-paid/.',
    leavesOut:
      'The card rate, which on this one is the entire cost. Square Free charges 3.3% plus 30 cents on an online sale against 2.9% plus 30 cents on their paid plan, and on a store doing real volume that gap is the whole decision.',
    costToSell:
      'Nothing as a monthly fee, and no percentage taken as a platform. Then read the payments sheet, because this is the card where the money is entirely in the processing rate: 3.3% plus 30 cents online on the free plan. Cheapest row in this table and not necessarily the cheapest store.',
    whoOwnsBuyer:
      'You do, and the customer list is the same one your card reader has been building. For a shop that already runs on Square that single fact is worth more than the rate difference.',
    takeWithYouOnLeaving:
      'Your item list and your customer records export. The site itself does not. Card-on-file records do not travel either, so anything on a subscription has to be re-entered by the customer.',
    hoursItCosts:
      'Very few, because there is not much of it. It is a storefront bolted to a card reader rather than a store you tend, and the thing you will spend hours on is working around what it cannot do.',
    doesBetter:
      'Costing nothing and already existing. If you take cards through Square you have an online store right now whether you knew it or not, and you should go and look at it before you pay anybody for one — including me.',
    whoFixesIt:
      'Square, and there is a telephone number a person answers during business hours. The reader, the store and the bank account are one company, so a problem is one conversation rather than three.',
  },
  {
    id: 'ecwid',
    name: 'Ecwid',
    kind: 'Your own store, your own address',
    how: 'A store you drop into a site you already have',
    claimIds: ['ecwid-plan-prices', 'ecwid-public-storefront-token'],
    fees: {
      cutHundredths: 0,
      itemTiers: [
        { maxItems: 10, cents: 500, name: 'Starter, up to 10 products' },
        { maxItems: 100, cents: 2900, name: 'Venture, up to 100 products' },
        { maxItems: 2500, cents: 4900, name: 'Business, up to 2,500 products' },
        { cents: 11900, name: 'Unlimited' },
      ],
    },
    headline: '$5 to $119 a month, priced by how many things you list',
    assumption:
      'The tier in the table is the one your catalog size lands on. Annual billing saves 16% and is not applied here.',
    leavesOut:
      'Where you want to sell. Selling on Instagram and Facebook starts at Venture, and selling in person needs Unlimited, so the tier your catalog picks is not always the tier your plans pick.',
    costToSell:
      'Five dollars a month up to ten products, twenty-nine up to a hundred, forty-nine up to twenty-five hundred, and a hundred and nineteen above that. No percentage of your sales at any tier. It is the only thing on this sheet priced by how much you LIST rather than by how much you SELL, which makes it the cheapest row here for a maker with a short catalog and one of the dearest for a shop with a long one.',
    whoOwnsBuyer:
      'You do. It sits inside a site that is already yours, so the customer never leaves your address to buy.',
    takeWithYouOnLeaving:
      'Your catalog and your orders export. What does not move is the store itself, and because it was embedded in your site rather than being your site, what you are left with is the site with a hole in it.',
    hoursItCosts:
      'Few, and the reason is that there is less of it than the full platforms. The hours arrive later, when you want something it does not do and find the answer is to move.',
    doesBetter:
      'Being small and cheap without being a toy. For somebody selling a dozen things beside a website they already have, five dollars a month against twenty-nine is a real difference and nothing above is doing anything they need.',
    whoFixesIt:
      'Ecwid, by chat and email, with phone support on the dearer tiers. It is a smaller company than the two above it and that shows in both directions.',
  },
  {
    id: 'bigcartel',
    name: 'Big Cartel',
    kind: 'Your own store, your own address',
    how: 'Built for artists and independent makers, and it shows',
    claimIds: ['bigcartel-plan-prices', 'bigcartel-carts-abandoned-only'],
    fees: { planMonthlyCents: 1500, planName: 'Platinum', cutHundredths: 0 },
    headline: '$15 a month on Platinum, and a free plan underneath it',
    assumption:
      'Priced on Platinum. A free Gold plan exists and is limited; exactly how it is limited was not read on 11 September 2026 and is not claimed here.',
    leavesOut:
      'What you give up for the price. Abandoned-cart recovery is a Diamond feature at $30, and the older reporting is thinner than anything above it on this sheet.',
    costToSell:
      'Fifteen dollars a month on Platinum and thirty on Diamond, with a free plan under both, and no percentage of your sales on any of them. It is the cheapest real store on this sheet and it is aimed squarely at somebody selling their own work.',
    whoOwnsBuyer:
      'You do, and the store is at your own address. What is thinner here than above is what you can DO with the list once you have it.',
    takeWithYouOnLeaving:
      'Your products and your orders. Like the rest of this group, the storefront stays behind.',
    hoursItCosts:
      'Almost none, because there is almost nothing to configure. That is the product rather than a shortcoming — it does one thing and it stops.',
    doesBetter:
      'Knowing exactly who it is for. An artist selling twenty pieces does not need sales tax by jurisdiction or abandoned-cart email, and a platform that refuses to grow features it does not need is rarer and more valuable than it sounds.',
    whoFixesIt:
      'Big Cartel, by email, and the company is small enough that the answer usually comes from somebody who knows the product.',
  },
  {
    id: 'etsy',
    name: 'Etsy',
    kind: 'Somebody else’s crowd',
    how: 'A marketplace that brings the buyers with it',
    claimIds: ['etsy-seller-fees', 'etsy-api-key-carries-secret'],
    fees: { planMonthlyCents: 0, planName: 'No subscription required', cutHundredths: 650 },
    headline: '6.5% of every sale, no monthly fee, and the 6.5% lands on your shipping too',
    assumption:
      'Priced on the 6.5% transaction fee alone, against the order value you gave. The real figure is higher, and the line below says by how much.',
    leavesOut:
      'Two things, and both are real money. Twenty cents to list each item, charged whether or not it sells and again every time the listing renews. And the 6.5% is charged on the shipping and gift wrapping you billed, not only on the price of the item — so the figure in the table is a floor rather than the answer.',
    costToSell:
      'No subscription, then 6.5% of the price you displayed plus what you charged for shipping and gift wrap, plus twenty cents for every listing whether it sells or not and again on every renewal, plus payment processing on top that varies with where your bank is. Etsy Plus is another ten dollars a month and is optional. Add it up and this is the dearest per-sale option here — which is the fair trade for a marketplace that brings its own buyers, and the card should say both halves.',
    whoOwnsBuyer:
      'Etsy does, and this is the row that matters more than the fee. The buyer thinks she bought from Etsy, the email address is not yours to write to, and the search results that found you can stop finding you without anybody explaining why. You are renting an audience, and the rent is the 6.5%.',
    takeWithYouOnLeaving:
      'Your listings, as data, and very little else. The reviews stay, the search position stays, and the customers stay — they were never yours. A seller moving off Etsy starts the audience again from nothing, which is why so few do.',
    hoursItCosts:
      'Real hours, and they go somewhere unusual: into the marketplace itself. Relisting, tags, the ads system, and watching a search position you do not control. That work does not transfer anywhere if you leave.',
    doesBetter:
      'Bringing buyers, and nothing on this sheet comes close. A store on your own address gets exactly the visitors you drive to it; a listing on Etsy gets people who came to Etsy to buy. For a maker with no audience yet that is the whole game, and the fee is what it costs.',
    whoFixesIt:
      'Etsy, by a form. You are one of millions of sellers, which is the same fact that makes the buyers arrive.',
  },
  {
    id: 'tiktok-shop',
    name: 'TikTok Shop',
    kind: 'Somebody else’s crowd',
    how: 'Selling inside the app people are already scrolling',
    claimIds: ['tiktok-shop-checkout-in-app', 'tiktok-shop-referral-fee'],
    fees: {
      unpublished: true,
      unpublishedReason:
        'TikTok Shop charges a referral fee on every order and its own fee page sits behind a seller login that refused to open. The figure people quote comes from summaries of pages nobody outside a seller account can read, so it is not printed here. Ask somebody who sells on it, or open a seller account and read it yourself — and treat any number you find elsewhere as unchecked.',
    },
    headline: 'A referral fee on every order, and the number is not publicly readable',
    assumption: 'Nothing is assumed, because nothing is computed. The fee page returned a permission error on 11 September 2026.',
    leavesOut:
      'Everything, because nothing was priced. That is the card rather than a gap in it.',
    costToSell:
      'A referral fee on each order and no setup fee, and I am not going to print the percentage because I could not read it. Their fee page requires a seller login and returns a permission error without one. Every published figure for this traces back to somebody summarizing a page they also could not open, and a guessed number on a sheet whose whole claim is that every figure was read would be worse than no sheet.',
    whoOwnsBuyer:
      'TikTok does, completely. The purchase happens inside the app, the buyer never reaches an address of yours, and the audience belongs to a recommendation system rather than to you.',
    takeWithYouOnLeaving:
      'Nothing that matters. There is no customer list to take and no store to move. What you built was attention, and attention does not export.',
    hoursItCosts:
      'More than any other row here, and the hours are not shop hours. Selling on TikTok is making video, continuously, and the day you stop the sales stop with it. That is a job rather than a channel.',
    doesBetter:
      'Reaching people who were not looking for you. Nothing else on this sheet can put your product in front of somebody who has never heard of you and has no intention of shopping. For the right product that is genuinely transformative, and it is why people put up with the rest of it.',
    whoFixesIt:
      'TikTok, through the seller center, and getting a human is difficult. Plan for that before you make it the only place you sell.',
  },
  {
    id: 'meta-shops',
    name: 'Facebook and Instagram Shops',
    kind: 'Somebody else’s crowd',
    how: 'What most small businesses already have, and it changed in 2025',
    claimIds: ['meta-shops-checkout-retired'],
    fees: {
      nothingToPrice: true,
      nothingToPriceReason:
        'There is no store fee to work out here any more, and the reason is the most useful fact on this sheet. Since September 2025, Shops on Facebook and Instagram send the buyer to the seller’s own website to pay. Meta no longer takes the payment, so there is nothing for Meta to charge — and a shop that has not been updated needs a checkout URL, which means it needs a website.',
    },
    headline: 'No fee, because Meta no longer takes the payment at all',
    assumption: 'Nothing is assumed. There is genuinely nothing to price, and the reason is dated September 2025.',
    leavesOut:
      'The cost of the website the buyer is now sent to, which is what this change moved the money to. That is what the other sheet here is about.',
    costToSell:
      'Nothing to Meta. As of September 2025 your product tags direct the customer to your own website to complete the purchase, and managing the post-purchase side inside Commerce Manager has been discontinued. Most comparisons you will find still describe Instagram Checkout as a live feature. It is not, and that is worth knowing before you plan around it.',
    whoOwnsBuyer:
      'You do now, which is the change. The buyer finishes on your site, so the email address, the order and the relationship are yours — and that is the opposite of how this worked two years ago.',
    takeWithYouOnLeaving:
      'Your posts and your followers stay with Meta. What is different since the change is that the CUSTOMERS do not, because they bought on your own site. That is the first time that sentence has been true here.',
    hoursItCosts:
      'The hours go into posting rather than into a store, and the store half is now somebody else’s problem — yours, on your own site. Which is the point.',
    doesBetter:
      'Being where your customers already are, for free, with an audience you may have spent years building. Nothing here argues against having it. What it can no longer do is take the money, so it needs somewhere to send people.',
    whoFixesIt:
      'Meta, by a help center and very little else. The half that matters is now on your own site, where you can actually get somebody to fix it.',
  },
  {
    id: 'no-store',
    name: 'No online store at all',
    kind: 'What plenty of good businesses do',
    how: 'A page, a photograph, a price and a phone number',
    /* NO CLAIM IDS, AND THAT IS THE POINT RATHER THAN AN OMISSION. Every
       sentence below is structural — true by how selling works — so it needs no
       vendor page and cannot go stale. The same reasoning is written out at
       getting-paid.js for the no-processor row and at platform-comparison.js for
       the no-website row. */
    claimIds: [],
    fees: { planMonthlyCents: 0, planName: 'Nothing to subscribe to', cutHundredths: 0 },
    headline: 'Nothing, and for a lot of businesses it is the right answer',
    assumption: 'Nothing is assumed. There is no subscription and no percentage, so the figure is zero and it is exact.',
    leavesOut:
      'The sales you do not make because somebody wanted to buy at eleven at night. That is a real cost and nothing on this page can measure it for you.',
    costToSell:
      'Nothing at all. A page showing what you make, what it costs and how to ask for it, with a payment link for a deposit if you want one. No basket, no stock counts, no checkout. For a business selling ten commissioned things a month at four figures each, a basket is machinery nobody needed.',
    whoOwnsBuyer:
      'You do, entirely, and you probably spoke to them. This is the only row where the customer relationship starts as a conversation.',
    takeWithYouOnLeaving:
      'Everything, because there is nothing to leave. The record is your own bookkeeping and the relationship is with the customer.',
    hoursItCosts:
      'The hours are spent on the customers rather than on the store, which is the trade. What it costs you is answering the same question forty times a week, and a good page is what stops that.',
    doesBetter:
      'Cost, and simplicity, and it is not close. It is free, there is nothing to break, and for a maker taking commissions rather than shipping stock it may genuinely be the whole answer. Ask what a basket would actually do for you before you rent one.',
    whoFixesIt:
      'Nobody, because nothing breaks. What it quietly does is less than you think, and the way to find out is to count how many people asked to buy and did not.',
  },
  {
    id: 'aiq',
    name: 'A page on your own site that reads your store',
    kind: 'Mine',
    how: 'Built once, pointed at whichever platform above you are on',
    claimIds: ['shopify-storefront-public-token', 'woocommerce-store-api-unauthenticated'],
    isMine: true,
    fees: {
      passThrough: true,
      passThroughReason:
        'I take no percentage of anything sold through it, so this adds nothing to what the platform above already charges you. There is no figure to print here and inventing one would be inventing a fee. The build itself is quoted once, in writing, before it starts.',
    },
    headline: 'Their fee, with nothing added by me, and the build quoted once',
    assumption:
      'Nothing is assumed about cost, because there is no recurring cost from me. What it can be built on at all depends entirely on which platform you are on — the table further down answers that.',
    leavesOut:
      'Your platform’s own fee, which does not go away. This sits on top of a store you already have rather than replacing one.',
    costToSell:
      'Nothing, month to month. I take no percentage, no markup and no share of anything you sell, and that is a term in the agreement rather than a promise. The build is quoted once before it starts. A real store — a basket, a checkout and stock counts — is separate work with its own price, and I do not build shipping by address or sales tax by state at any price.',
    whoOwnsBuyer:
      'You do, and more of them than before, because the customer stays on your address for the part where they decide what they want. The checkout still happens on your platform, where it belongs.',
    takeWithYouOnLeaving:
      'All of it, because none of it was ever mine. The files, the hosting account and every login are in your name, and if you stop working with me tomorrow nothing switches off.',
    hoursItCosts:
      'The point of the thing is that it costs you none. You add a listing in the store you already run and the page follows, because it reads your catalog live rather than holding a copy I have to update. That is the one requirement that decides which version you get.',
    doesBetter:
      'Nothing at all, as a store — I am not a store platform and I do not compete with one. What this does instead is the part no platform does: the page where your customer configures the thing they actually want, in your words, before they land in your checkout with it.',
    whoFixesIt:
      'Me for the page, the platform for the store and the money. Where the platform changes something underneath it, keeping up is quoted in the same breath as the build rather than assumed.',
  },
];

/* ============================================================================
   CAN A PAGE I BUILD READ YOUR CATALOG?

   THIS IS THE FINDING THE WHOLE SHEET TURNS ON AND IT IS A PER-PLATFORM FACT, so
   it lives in its own table rather than as a seventh row on a card. Several
   cards hold more than one platform and the answer differs inside them: the
   group that arrived with a website holds Wix, which permits this, and
   Squarespace, which has no cart to hand anything to.

   THE SPLIT IS ABOUT ONE THING: what credential the platform requires. Four
   permit a page to read a catalog and build a cart with a credential that is
   safe in a browser. Six require a secret on the request, which would mean
   running a server holding a token that can read the client's orders — customer
   data this practice does not hold, per the Scope's section 3 and the
   data-handling note. Two have no cart to build against at all.

   IT IS NOT A RANKING AND THE PAGE SAYS SO. A platform refusing this is not a
   worse platform. It is a platform on which one particular thing I sell cannot
   be built, which is a fact about me rather than about them.

   EVERY ROW WAS READ ON THE VENDOR'S OWN DEVELOPER DOCUMENTATION on
   2026-09-11, not from a summary and not from a review site. A wrong answer in
   the permissive direction would have me promising a client something the
   platform forbids, which is the one direction that costs somebody money.
   ============================================================================ */

/** The three answers, written once so a row cannot invent a fourth. */
export const VERDICTS = {
  yes: { label: 'Yes', tone: 'yes' },
  qualified: { label: 'With a caveat', tone: 'qualified' },
  no: { label: 'No', tone: 'no' },
};

export const catalogAccess = [
  {
    platform: 'Shopify',
    verdict: 'yes',
    credential: 'A public storefront token, which is not a secret',
    detail:
      'Their Storefront API lets an outside page read products, build a cart and hand the buyer to Shopify’s own checkout. It also exposes the price, whether an item is available and how many are left, so the page never holds a stale copy of your catalog.',
    claimIds: ['shopify-storefront-public-token'],
  },
  {
    platform: 'WooCommerce',
    verdict: 'yes',
    credential: 'None at all',
    detail:
      'The Store API is explicitly unauthenticated and needs no key. The honest caveat is that its sessions are cookie-based and writes need a one-time token, which is straightforward on the same site and unproven from another — so nobody should promise this on Woo until it has been built against a real store.',
    claimIds: ['woocommerce-store-api-unauthenticated'],
  },
  {
    platform: 'BigCommerce',
    verdict: 'yes',
    credential: 'A storefront token BigCommerce itself calls safe in a browser',
    detail:
      'Locked to the addresses you name, up to two per token, so a staging site and a live site use both. There is a deprecation clock on tokens created without an address: from March 2027 they stop being accepted, so anything built here names the address from day one.',
    claimIds: ['bigcommerce-storefront-token-browser', 'bigcommerce-storefront-token-deprecation'],
  },
  {
    platform: 'Wix',
    verdict: 'yes',
    credential: 'A client ID, with no secret',
    detail:
      'Wix Headless authenticates a visitor with an ID alone. A secret is required for anything administrative, so the safe half is visitor and member access — which is all a configurator needs. The cart shape was seen but not read endpoint by endpoint, so confirm it before building rather than assuming it matches Shopify’s.',
    claimIds: ['wix-headless-client-id-only'],
  },
  {
    platform: 'Ecwid',
    verdict: 'qualified',
    credential: 'A public token, for their widget rather than your page',
    detail:
      'Ecwid’s public tokens are safe in a storefront, and the model is that you embed THEIR storefront into your page and customize it — not that your page reads their catalog and builds its own. That is a different product from the Shopify pattern and it should not be sold as the same thing.',
    claimIds: ['ecwid-public-storefront-token'],
  },
  {
    platform: 'Square',
    verdict: 'no',
    credential: 'A secret access token, server-side only',
    detail:
      'Square instructs outright that access tokens must not be exposed in client-side code. Building this would mean running a server holding a token that can read your orders, which is customer data I do not hold. Whether Square Online exposes an unauthenticated add-to-cart address is unsettled; community posts suggest one and Square does not document it.',
    claimIds: ['square-tokens-server-side-only'],
  },
  {
    platform: 'Squarespace',
    verdict: 'no',
    credential: 'There is no cart to hand anything to',
    detail:
      'A harder no than Square’s, and for a different reason. Square has a cart and forbids reaching it from a browser. Squarespace’s commerce interfaces manage a merchant’s own data and include no cart or checkout at all, so even with a server there is nothing to hand a configured item to.',
    claimIds: ['squarespace-no-cart-api'],
  },
  {
    platform: 'Etsy',
    verdict: 'no',
    credential: 'A shared secret travels on every request',
    detail:
      'That rules a browser out before any question about carts. Etsy is a marketplace and the buyer buys on Etsy — the cart interfaces that exist read a shopper’s own Etsy cart after she authorizes an app, which is not a checkout an outside site can send anybody to.',
    claimIds: ['etsy-api-key-carries-secret'],
  },
  {
    platform: 'Big Cartel',
    verdict: 'no',
    credential: 'A secret, and an application they have to approve',
    detail:
      'Three separate blocks and any one is enough. It needs a secret; its cart interface reports abandoned carts from the last seven days rather than building one, and only on the dearest plan; and Big Cartel approves a select number of developers at all.',
    claimIds: ['bigcartel-carts-abandoned-only'],
  },
  {
    platform: 'Shift4Shop',
    verdict: 'no',
    credential: 'A private key on every request',
    detail:
      'Their public key is not a browser credential — it is what a merchant uses to subscribe to an application. The private key is what authenticates the request, so this is server-side only.',
    claimIds: ['shift4shop-private-key-required'],
  },
  {
    platform: 'TikTok Shop',
    verdict: 'no',
    credential: 'The checkout happens inside the app',
    detail:
      'Purchases complete inside TikTok and there is no documented way for an outside page to build a cart against it. That rests on the absence of public developer documentation rather than on a statement by TikTok, and the sheet says so rather than dressing it up.',
    claimIds: ['tiktok-shop-checkout-in-app'],
  },
  {
    platform: 'Facebook and Instagram Shops',
    verdict: 'no',
    credential: 'There is no longer a checkout here to build against',
    detail:
      'Since September 2025 the buyer is sent to the seller’s own website to pay. So the question does not arise — and the page they are sent to is exactly the kind of thing this practice builds.',
    claimIds: ['meta-shops-checkout-retired'],
  },
];

/* THE SHEET REFUSES TO BUILD BELOW THIS, and the floor is not decoration. A
   comparison that lost half its cards to a bad edit would still render, still
   look finished, and still be published. verify-stores.mjs asserts all three. */
export const MIN_CARDS = 8;
export const MIN_ROWS = 5;
export const MIN_CATALOG_ROWS = 10;
