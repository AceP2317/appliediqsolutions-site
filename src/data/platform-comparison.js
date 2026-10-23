/* ============================================================================
   THE PLATFORM COMPARISON — one source, read by /websites/compare/ and by
   scripts/make-cheatsheet.mjs.

   SOMETHING OUTSIDE THIS REPO EDITS THIS FILE IN PLACE, AND NOTHING ELSE HERE
   SAYS SO. `~/.claude/LEDGER.md` entry L-398 carries a CANARY that guts the
   Shopify `doesBetter` field to a short stub, runs
   `scripts/verify-compare.mjs --data-only` to confirm the concession floor still
   refuses it, and restores the file from a per-run backup. It is correct and it
   is meant to be here. This paragraph exists because on 2026-09-10 a session
   found the stub in the working tree, searched `scripts/` for it, found nothing,
   and reported an unexplained write to a tracked source file — the search was
   right and the place was wrong, because it did not occur to anybody that a
   check living in another repo reaches into this one.

   THE STUB IS NOT QUOTED HERE, AND THE FIRST VERSION OF THIS PARAGRAPH QUOTED
   IT. The wording changed within the hour — it now signs itself, naming L-398
   and the repair — so a comment holding the literal was already wrong. That is
   LEDGER L-402's class reproduced inside the warning written to prevent a
   different confusion: name the property, never the text.

   IF YOU FIND A GUTTED CONCESSION HERE, IT IS RESIDUE AND NOT SOMEBODY'S WORK.
   `git checkout -- src/data/platform-comparison.js` is the whole repair, and a
   `.LEDGER-CANARY-RUNNING` file at the repo root beside it means a canary died
   mid-run. It survives only when two ledger audits overlap, which
   `ledger-audit.sh` now refuses outright; the mechanism and its fix are LEDGER
   L-403. This file's own gate refuses any concession under 100 characters, so a
   stub can never ship — the cost of residue is confusion, not a bad deploy.

   ONE TRAP IF YOU MEET IT ANYWAY: a canary restores whatever it FOUND, so
   running one over damage that was already there preserves the damage and
   reports dirty, which reads exactly like the repair having failed. Restore by
   hand first, then re-run.

   WHY IT IS SEPARATE FROM websiteComparison IN home.ts. That record is four
   lines arguing against ONE thing, a template subscription, and it is accurate
   about that. This is the whole field, and the field turned out to be wider than
   four lines can hold: two of the nine entries here are FREE, and one of them
   hands the customer real source code. A four-row block cannot carry that
   without becoming a different block.

   EVERY ENTRY MUST CARRY `doesBetter`, AND A GATE ENFORCES IT.
   scripts/verify-compare.mjs fails the run if any platform's `doesBetter` text
   is missing from the rendered page. It is the row that makes the other five
   believable, and it is the row that quietly goes first in a later copy pass —
   nobody deletes it on purpose, it just gets softened until it says nothing.
   A comparison with no losing rows is an advertisement wearing a table.

   PRICES READ 2026-09-10 OFF EACH COMPANY'S OWN PRICING PAGE, IN A BROWSER,
   because four of them refuse a plain fetch and two render their figures in
   JavaScript. Every one is registered in src/data/external-claims.js so it ages
   and warns. They are `assisted`: Claude can re-read them by driving the
   browser, nothing here may probe those hosts automatically, and neither kind
   ever passes a check — they only age.

   WHAT THE READING CHANGED, and this is why it was worth doing rather than
   quoting a review site. Squarespace's plans are no longer Personal and
   Business; they are Basic, Core, Plus and Advanced, and the review sites still
   say otherwise. GoDaddy's Websites + Marketing is gone, replaced by an AI
   builder that meters editing in monthly credits. Both facts are invisible from
   anywhere except the vendor's own page, and one of them made a line already
   published on /websites/ unsupportable.
   ============================================================================ */

/** The fixed row set, in the order every card prints it. A shared order is what
    lets a reader compare down a column instead of reassembling nine paragraphs,
    and naming the rows here rather than in the template is what stops one card
    quietly growing a seventh row that none of the others has. */
export const rows = [
  { key: 'ownWhatOnLeaving', label: 'What you own if you leave' },
  { key: 'ifYouStopPaying', label: 'If you stop paying' },
  { key: 'wontDo', label: 'What it will not do' },
  { key: 'doesBetter', label: 'What it does better than I do' },
  { key: 'whoFixesIt', label: 'Who fixes it when it breaks' },
];

export const platforms = [
  {
    id: 'wix',
    name: 'Wix',
    kind: 'Template subscription',
    monthlyUsd: 17.77,
    planName: 'Light, billed annually',
    claimIds: ['wix-price-light', 'wix-no-site-export'],
    ownWhatOnLeaving:
      'Your words and your pictures, if you save them off a page at a time. Not the design, not the layout, not the pages themselves. Moving means building it again somewhere else.',
    ifYouStopPaying:
      'The site comes down. Your domain stays yours while you keep renewing it, but the thing it pointed at is gone.',
    wontDo:
      'Hold software that is yours. Wix has a developer platform and real code can be written on it, but that code is written against Wix and runs only on Wix. It does not leave when you do.',
    doesBetter:
      'It is live this afternoon and it looks fine. If you need a website by Friday and you have twenty dollars, Wix is the right answer and I will say so on the call.',
    whoFixesIt:
      'Wix does, around the clock, with a real support team behind it. You are never waiting on one person to pick up his phone.',
  },
  {
    id: 'squarespace',
    name: 'Squarespace',
    kind: 'Template subscription',
    monthlyUsd: 19,
    planName: 'Basic, billed annually',
    claimIds: ['squarespace-price-basic', 'squarespace-lapse-window'],
    ownWhatOnLeaving:
      'An export file carrying your text and your images. The design does not come with it, so whoever rebuilds from that file is starting the layout from nothing.',
    ifYouStopPaying:
      'The site expires fifteen days after payment was due, and content can be deleted permanently thirty days after that. Both numbers are theirs, off their own help page.',
    wontDo:
      'Hold a tool built for how your business actually works. You get their blocks, their blocks are good, and none of them is your reorder point or your tip-out.',
    doesBetter:
      'The design, and it is not a close call. A Squarespace site straight out of the box looks better than plenty of work that gets billed at four figures.',
    whoFixesIt:
      'Squarespace, with support that is genuinely well regarded by the people who use it.',
  },
  {
    id: 'godaddy',
    name: 'GoDaddy Website Builder',
    kind: 'Template subscription',
    monthlyUsd: 9.99,
    planName: 'Starter, billed annually',
    claimIds: ['godaddy-price-starter', 'godaddy-ai-credits'],
    ownWhatOnLeaving:
      'GoDaddy now says you can view and export the generated code. I have not tested what actually comes out of that, so read it as their claim rather than as mine.',
    ifYouStopPaying:
      'The site comes down. The domain is a separate bill and stays yours while that one is paid.',
    wontDo:
      'Let you edit as much as you like. Every plan is metered in monthly AI credits, fifty on the free tier and a hundred and fifty on Starter, so changing your own website is rationed. The month you run out is the busy one.',
    doesBetter:
      'Price, and reach. It is the cheapest paid option on this page, and if your domain already sits at GoDaddy it is one login rather than two.',
    whoFixesIt:
      'GoDaddy, by telephone, and they answer it. Their phone support is the most reachable of any company here.',
  },
  {
    id: 'square',
    name: 'Square Online',
    kind: 'Free, bundled with something else',
    monthlyUsd: 0,
    planName: 'Square Free',
    claimIds: ['square-free-online-site', 'square-online-card-rate'],
    ownWhatOnLeaving:
      'Your item list and your customer records export. The site itself does not.',
    ifYouStopPaying:
      'There is nothing to stop paying. This one is free and it stays free.',
    wontDo:
      'Be a website first. It is a storefront bolted to a card reader, shaped for taking an order rather than for explaining what you do and why somebody should call you.',
    doesBetter:
      'It costs nothing and it is already sitting in your account. If you take cards through Square you have a website right now whether you knew it or not, and you should go and look at it before you pay anybody for one.',
    whoFixesIt:
      'Square does. What the free site actually costs shows up in the card rate: 3.3% plus 30 cents on an online sale, against 2.9% plus 30 cents on their $49 plan.',
  },
  {
    id: 'shopify',
    name: 'Shopify',
    kind: 'Built for selling',
    monthlyUsd: 29,
    planName: 'Basic, billed annually',
    claimIds: ['shopify-price-basic'],
    ownWhatOnLeaving:
      'Products, customers and orders export cleanly, which is better than most of this page manages. The storefront itself is written in Shopify’s own template language and runs nowhere else.',
    ifYouStopPaying:
      'The store closes. Your data stays exportable for a while afterwards, which again is better than most of this page.',
    wontDo:
      'Earn its keep if you are not selling products online. You would be renting an engine you never start.',
    doesBetter:
      'Selling at any scale. Sales tax by jurisdiction and shipping worked out from a buyer’s address are the two I will not build at any price, because they have to stay right for years as rates and rules move without telling anyone, and a company whose entire business is that maintains them. I will build a small store — a basket, a checkout, stock counts — quoted on its own. Past that you want this rather than me.',
    whoFixesIt:
      'Shopify, with the largest ecosystem of anything named on this page.',
  },
  {
    id: 'wordpress',
    name: 'WordPress',
    kind: 'You host it, you mind it',
    monthlyUsd: 17.5,
    planName: 'WordPress.com Business, or your own hosting',
    claimIds: ['wordpress-price-business'],
    ownWhatOnLeaving:
      'Everything. This is the one platform besides mine where that answer is honestly everything, the content and the theme and the database together, and it is a large part of why it runs so much of the web.',
    ifYouStopPaying:
      'On WordPress.com the site comes down. Hosted yourself it keeps running for as long as the hosting bill is paid, and that bill is small.',
    wontDo:
      'Look after itself. WordPress is plugins, plugins update, and an update can take a working site down on a Tuesday for a reason nobody chose.',
    doesBetter:
      'Breadth. There is a plugin for nearly anything, and a plugin costing seventy-nine dollars once beats me building the same thing for four figures. If what you need already exists there, buy it and keep your money.',
    whoFixesIt:
      'You, or whoever you pay. It is the option with the most freedom on this page and the most homework attached to it.',
  },
  {
    id: 'ai-builders',
    name: 'The AI builders',
    kind: 'Describe it and it writes it',
    monthlyUsd: 25,
    planName: 'Lovable Pro; Framer starts at $10',
    claimIds: ['lovable-price-pro', 'lovable-github-sync', 'framer-price-basic'],
    ownWhatOnLeaving:
      'Real code, and this is the honest one on the page. Lovable syncs what it writes into a GitHub repository you control, so the files are yours in the same sense that mine are.',
    ifYouStopPaying:
      'The hosted copy goes. If you exported the code first you still have it, and knowing to do that before you cancel is the whole trick.',
    wontDo:
      'Know your business. It builds what you describe, so the result is only as good as the description, and you will not find out what you forgot to ask for until a customer finds it first.',
    doesBetter:
      'Speed and price, and it is closing on the argument I lean hardest on. If you can describe what you want precisely and you can read what comes back, this is a real option and I am not going to pretend otherwise.',
    whoFixesIt:
      'You, with the AI, at eleven at night. That is the part worth sitting with: owning code that nobody at your business can read is not the same as owning something you can fix.',
  },
  {
    id: 'no-site',
    name: 'No website at all',
    kind: 'What most of the street actually does',
    monthlyUsd: 0,
    planName: 'A Facebook page and a Google listing',
    /* ONE CLAIM, AND IT ARRIVED ON 2026-09-11 AFTER THIS ROW HAD RUN WITH NONE.
       The paragraph below used to say every sentence here was structural and
       needed no source. That was true and it is no longer the whole truth: the
       store-platform audit found a DATED change at Meta that bears directly on
       this row, and a dated fact needs a registered claim so it ages and warns.
       The rest of the row is still structural. The one sourced sentence is in
       `wontDo` and it is the strongest argument on this page for the product
       this page sells, which is exactly why it needs an expiry rather than
       somebody's memory.

       WHAT THE ORIGINAL PARAGRAPH SAID, KEPT BECAUSE IT STILL GOVERNS EVERY
       OTHER SENTENCE HERE. The first draft of this row leaned on two statistics
       — Facebook's organic reach and the share of US small businesses with no
       website — and both came from lead-generation blogs rather than from Meta
       or from anyone who counted. A benchmark about other people is also the
       weakest thing you can hand a reader deciding about her own shop. So the
       bar for adding a source here is a statement by the company itself about
       its own product, which is what meta-shops-checkout-retired is. */
    claimIds: ['meta-shops-checkout-retired'],
    ownWhatOnLeaving:
      'Nothing, and there is nowhere to leave to. The page belongs to Meta and the listing belongs to Google.',
    ifYouStopPaying:
      'There is nothing to pay, and nothing stops. What it costs you is not money: a post reaches the people who already follow you, and a follower is somebody who found you some other way first.',
    wontDo:
      'Get found by somebody who does not already know your name, or answer the question you get asked forty times a week without you answering it again yourself. And since September 2025 it will not take the money either: Meta says Shops on Facebook and Instagram now use website checkout, so a product tag sends the buyer to the seller’s own website to pay and a shop nobody has updated needs a checkout address created. Anybody selling through Instagram today needs a website to send people to, and most comparisons you will find still describe Instagram Checkout as a live feature.',
    doesBetter:
      'Cost, and it is not close. It is free, it is already running, and for a business that lives on word of mouth it may genuinely be enough. Get the Google listing right first, because a good listing beats a bad website.',
    whoFixesIt:
      'Nobody, because nothing breaks. It just quietly does less than you think it is doing.',
  },
  {
    id: 'aiq',
    name: 'A site I build for you',
    kind: 'Paid once, and yours',
    monthlyUsd: 0,
    planName: 'Paid once, then hosting at your own cost',
    claimIds: [],
    isMine: true,
    ownWhatOnLeaving:
      'All of it. The files, the domain, the hosting account, every login in your name. There is no leaving, because you were never standing on anything of mine.',
    ifYouStopPaying:
      'There is nothing to stop. It is paid once. Hosting costs about what a coffee costs and the bill has your name on it rather than mine.',
    wontDo:
      'Be the cheap option, and it is nowhere near being one. Read the arithmetic below before you decide anything.',
    doesBetter:
      'Nothing at all, on price. What it does instead is hold one piece of software built for the way your business actually works, on a site nobody else can switch off. That is the entire argument and there is not a second one.',
    whoFixesIt:
      'Me while I am here, and anybody you hire after that, because it is ordinary code sitting in your own account rather than a platform only I understand.',
  },
];

/** The read date, printed in visible copy on the page rather than only in the
    claim register. A dated page lets a reader go and check for himself; an
    undated one is asking to be trusted about somebody else's terms. */
export const READ_ON = '10 September 2026';
