import { versioned } from './asset-version';
// Single source of truth for the browser-local tool demos. Never state the
// count in prose — derive it from `demos.length` (D22).
// The Work index and each /work/<slug> route read from here, so titles,
// taglines, and OpenGraph meta stay in sync. Each demo has its own hand-written
// route file at src/pages/work/<slug>.astro importing its island directly;
// there is no [slug].astro.

export interface Demo {
  slug: string;
  name: string;
  /** One-line hook (cards, hero). */
  tagline: string;
  /** Sentence-length description (Work cards + on-page "what it does"). */
  blurb: string;
  /** ≤155-char trimmed description for the demo route's <meta> + OG card. */
  seoDescription: string;
  /** The real-world problem the tool was built for — demo-route framing strip. */
  problem: string;
  /** ~100-word crawlable "about this tool" prose for the demo route (SEO + AI-citation). */
  about: string;
  /** A tool-specific first question for the live assistant — the DemoAbout
   *  "Ask the assistant" chip deep-links to /work/#ask with it prefilled. */
  ask: string;
  /** ONE LINE, IN A SHOP OWNER'S WORDS, saying what kind of problem this is.
   *
   *  Not a simplification of the tool — the precise phrasing above stays exactly
   *  as it is, because that precision is what makes the tool credible to the
   *  operations person it was built for. This is the second reader's version,
   *  rendered beside it rather than instead of it.
   *
   *  Omitted on the demo built for a local business, which needs no translating. */
  plain?: string;

  /** A short name of its own, shown BESIDE the plain one rather than instead
   *  of it. The plain name is what a bar manager types into a search box at
   *  eleven at night, so it stays the name; this carries the character a
   *  catalogue of sheets and lists would otherwise lack. Shelf tools only. */
  instrument?: string;

  /** Who this is for, in the trade's own words. Rendered on the gallery card so
   *  a marina owner can tell at a glance whether a card is theirs, without the
   *  catalogue having to be organised by trade — grouping by trade tells most
   *  visitors "nothing here for you" before they have read anything. */
  forWhom?: string;

  /** The most approachable demo — renders the "Featured" pill on the Work gallery card.
   *  Exactly one demo carries it. */
  hero?: boolean;
}

export const demos: Demo[] = [
  {
    slug: 'staging-triage-console',
    name: 'Staging Triage Console',
    tagline: 'Catch the count errors a total-only view hides.',
    plain: 'Your stock count adds up to the right total and is still wrong underneath — two mistakes that cancel out.',
    blurb:
      'A triage worklist for physical inventory: per-bin integrity checks flag impossible quantities and offsetting errors that net to a believable total, alongside line-side overstaging — each one ready to accept, reject, or defer.',
    seoDescription:
      'Per-bin integrity checks for physical inventory: flag impossible quantities and offsetting errors a total-only count hides, plus line-side overstaging.',
    problem:
      'A physical inventory nets to a believable total, so the count passes — while offsetting per-bin errors and overstaged line-side stock hide inside it.',
    about:
      'A physical inventory can foot to a believable grand total and still be wrong underneath — two bin errors that cancel out, an impossible negative quantity, stock staged line-side that was never counted back. Total-only reconciliation passes them straight through. The Staging Triage Console checks integrity at the bin level: it flags quantities that can’t be real, finds offsetting errors that net to a clean total, and surfaces line-side overstaging — then hands each exception to a reviewer to accept, reject, or defer. It’s count integrity for the cases a summary hides: the difference between a count that balances and a count that’s actually right.',
    ask: 'How would the Staging Triage Console catch a count that balances in total but is wrong by bin?',
  },
  {
    slug: 'asn-update-radar',
    name: 'ASN Update Radar',
    tagline: 'Know which inbound updates actually matter today.',
    plain: 'A hundred delivery updates land today. Three of them actually change what you can do this week.',
    blurb:
      'A daily inbound worklist that picks the firmest arrival date for every open shipment and tells you which to act on — verify receipt, chase logistics, reschedule, or drop — with the vessel and container moves that hit many lines surfaced up top.',
    seoDescription:
      'A daily inbound worklist that picks the firmest arrival date for every open shipment and tells you which to act on — verify, chase, reschedule, or drop.',
    problem:
      'Dozens of inbound shipment updates land every day; most are noise, and the few that actually need action today are buried among them.',
    about:
      'Inbound shipments throw off a constant stream of updates — new ETAs, vessel and container moves, customs and carrier changes — and most days the volume buries the handful that actually need a decision today. ASN Update Radar reads the day’s advance-ship-notice traffic, picks the firmest arrival date for every open shipment, and sorts each one into a clear action: verify the receipt, chase logistics, reschedule, or drop it. Moves that ripple across many lines — a delayed vessel, a re-routed container — surface at the top. It turns an inbox of inbound noise into a ranked worklist, so the receiving and planning desks work the few shipments that matter instead of re-reading all of them.',
    ask: 'How does ASN Update Radar decide which arrival date to trust for a shipment?',
  },
  {
    slug: 'production-plan-churn',
    name: 'Production Plan Churn',
    tagline: 'See how much the plan is really moving — and who moved it.',
    plain: 'The schedule changed again. Was that a real change, or the system reshuffling itself?',
    blurb:
      'A week-over-week volatility tracker for the production plan: it separates real reschedules from MRP renumbering noise, attributes each change to planner or system, and pinpoints the materials and weeks taking the most whiplash.',
    seoDescription:
      'A week-over-week volatility tracker for the production plan: real reschedules vs MRP renumbering noise, attributed to planner or system.',
    problem:
      'The production plan changes constantly, but you can’t tell real reschedules from MRP renumbering noise — or whether a planner or the system moved it.',
    about:
      'Every week, MRP regenerates the production plan and thousands of order lines shift. Most of that movement isn’t a real schedule change — it’s renumbering: orders dropping and re-creating with new identities while the actual dates barely move. The few genuine reschedules a planner needs to act on get buried in that churn. Production Plan Churn diffs the plan week-over-week, separates real date moves from renumbering noise, and attributes each change to a planner decision or a system action — so you can see how volatile the plan really is, and where the whiplash concentrates by material and by week. It’s the plan-stability question MRP exception reports were never built to answer.',
    ask: 'How does Production Plan Churn tell a real reschedule from MRP renumbering noise?',
  },
  {
    slug: 'order-confirmation-command-center',
    name: 'Order Confirmation Command Center',
    tagline: 'See why orders miss their date — and where to act first.',
    plain: 'Which of these orders is going to be late, and which one do you chase first?',
    blurb:
      'A command center for order-confirmation rate: it roots every unconfirmed unit to a specific cause, rolls them into five buckets, drills category → cause → line, scores customers by service crisis, and exports a ranked worklist with a recommended action per cause.',
    seoDescription:
      'An order-confirmation-rate command center: roots every unconfirmed unit to a cause, drills category to line, scores customers, and exports a worklist.',
    problem:
      'Order confirmation rate is slipping, but the miss is buried — thousands of unconfirmed units with no clear root cause, owner, or next action.',
    about:
      'When orders can’t be confirmed on their requested date, the shortfall scatters across causes — a late overseas inbound, a quality hold, a forecast miss, stock stuck in a staging buffer — and a single confirmation-rate number hides where it actually lives. The Order Confirmation Command Center roots every unconfirmed unit to a specific cause by a first-match-wins waterfall, rolls them into five buckets — forecasting, logistics, supply, customer, other — and lets you drill from category to cause to the individual order line. It scores customers by service crisis, attributes week-over-week movement, recommends an action for each cause, and exports a ranked worklist — turning a confirmation-rate miss into owned, accountable work instead of a number on a slide.',
    ask: 'How does the Order Confirmation Command Center decide which cause owns an unconfirmed order?',
  },
  {
    slug: 'bom-explorer',
    name: 'BOM Explorer',
    tagline: 'Search a BOM, trace where-used, get the true per-unit quantity.',
    plain: 'What is this thing actually made of, where else do we use that part, and how many do we really need?',
    blurb:
      'A bill-of-materials explorer: field-qualified search across every BOM attribute, reverse where-used lookup for any component, and multi-level tree explosion — with the true per-finished-good-unit quantity rolled up across every usage path and kept separate by site.',
    seoDescription:
      'A BOM explorer: field-qualified search, reverse where-used lookup, and multi-level tree explosion, with the true per-finished-good-unit quantity rolled up.',
    problem:
      'A bill of materials hides its real structure — which finished goods use a part, how deep it sits, and how many are actually needed per unit across every path.',
    about:
      'A bill of materials looks simple on the surface and is tangled underneath: the same component can appear at several positions, under phantom assemblies, down different branches — each carrying a quantity that only means something relative to its direct parent. BOM Explorer makes that structure searchable. Field-qualified queries hit any attribute — material, level, procurement type, MRP controller, quantity range — a reverse where-used lookup shows every finished good a component feeds and by which path, and multi-level explosion walks the whole tree. Its signature is the true per-finished-good-unit quantity: each component quantity multiplied down its parent chain and summed across every usage path, kept separate by site because the same part can carry different quantities in different plants.',
    ask: 'How does BOM Explorer work out the true per-unit quantity when a component sits on several paths?',
  },
  {
    slug: 'parameter-audit-console',
    name: 'Parameter Audit Console',
    tagline: 'Catch the planning parameters that don’t fit how a part is sourced.',
    plain: 'The settings that decide when to reorder were set once and never checked. Some of them are wrong.',
    blurb:
      'An MRP parameter-governance console: it audits planning settings — safety stock, lot size, rounding, lot procedure, time fence — against sourcing-tier × ABC × XYZ targets, weights each finding by BOM criticality, flags inventory-health and lifecycle issues, and puts a dollar exposure on every one.',
    seoDescription:
      'An MRP parameter-governance console: audits planning settings against sourcing-tier × ABC × XYZ targets, weighted by BOM criticality, each finding priced.',
    problem:
      'Thousands of planning parameters drift out of line with how each part is actually sourced — and nothing flags which misfits are costing the most money.',
    about:
      'MRP only plans as well as its parameters, and across thousands of material-plant records those settings quietly drift away from how each part is actually sourced — overseas safety stock on a local part, a lot-for-lot policy where periodic belongs, a time fence that doesn’t fit the lead time. The Parameter Audit Console grades every planning setting — safety stock, lot size, rounding, lot procedure, time fence — against the target for its sourcing tier, ABC value class, and XYZ demand variability, weights each finding by where it sits in the BOM, and folds in inventory-health and lifecycle checks: dead stock, blocked stock, phase-in and phase-out mismatches. Every finding carries a dollar exposure, so the worklist sorts by money, not noise.',
    ask: 'How does the Parameter Audit Console spot a planning parameter that no longer fits how a part is sourced?',
  },
  {
    slug: 'past-due-order-triage',
    name: 'Past-Due Order Triage',
    tagline: 'Stop past-due production orders from over-ordering your raw materials.',
    plain: 'An old order nobody closed is quietly telling the system to buy more material.',
    blurb:
      'A triage worklist for past-due in-house production orders — the ones still signaling false demand for the raw materials MRP keeps procuring. It ages every open order, weights each by size and staleness, and sorts it into one clear action — unfirm, close, verify a partial, reschedule, or leave — with the where-used BOM showing which purchased components each stale order is over-ordering, and a snapshot diff that tells the orders actively confirming apart from the dead ones inflating your stock.',
    seoDescription:
      'A triage worklist for past-due production orders faking demand for raw materials MRP keeps over-procuring — ages each one and sorts it into a clear action.',
    problem:
      'An open in-house production order keeps generating dependent demand for the raw materials it was built to consume. Past due and never going to run, that demand is false — but MRP has already procured the components to cover it, so they land and pile up as overstock. Nothing flags which stale orders are quietly inflating your raw-material inventory.',
    about:
      'An in-house production order doesn’t just wait in MRP — while it stays open, it keeps generating dependent demand for the raw materials it was built to consume. When the order is past due and never going to run, that demand is false: MRP has already triggered procurement to cover it, so the externally-sourced components arrive, get stored, and pile up as overstock no one ordered on purpose. Past-Due Order Triage finds those stale orders, ages each one, weights it by quantity and how long it’s been late — a phantom score — and sorts it into exactly one action: unfirm a firmed planned order, close a dead one, verify a partial remnant, reschedule to an honest date, or leave it. The where-used BOM shows which purchased components each order is over-ordering, and a snapshot diff tells the orders actively confirming apart from the dead ones quietly inflating raw-material stock. It’s the planning-signal integrity check MRP exception reports were never built to run.',
    ask: 'How does Past-Due Order Triage know a stale production order is inflating raw-material stock?',
  },
  {
    slug: 'crew-share',
    name: 'Crew Share',
    instrument: 'The Lay',
    forWhom: 'Commercial fishing, charter boats',
    tagline: 'Costs off the top, then the boat, then the rest by lay.',
    blurb:
      'A boat comes in, the catch sells, and the money splits in a fixed order — the trip\'s own costs first, then the boat\'s share of what is left, then the rest across the people who worked it by their lay. Every boat sets its own lay and its own boat share, and neither of them travels.',
    seoDescription:
      'A crew share calculator for a working boat: trip costs off the top, the boat\'s share of what remains, and the rest split by each hand\'s lay.',
    problem:
      'The settlement gets worked out on a legal pad at the dock, at the end of a four-day trip, by whoever is least tired. It is the one arithmetic on the boat where a mistake gets remembered.',
    about:
      'Splitting a trip is not one calculation, it is an order of operations a boat settled on once and has kept ever since. The trip\'s own costs come off the top in real money — fuel, ice, bait, grub, the offload. The boat then takes its share of what is left rather than of the gross, because charging the crew for the boat\'s cut of money that went straight back out as fuel is the argument this tool exists to stop having. What survives divides across the people aboard by lay, the share weight this boat uses, where a captain on a share and a half against a deckhand on one is simply 1.5 to 1. Money is counted in whole cents from the first line to the last, and the spare pennies from an uneven split go to the biggest lays so the shares always add back up to what the catch made — which the page checks and says out loud. It refuses to suggest a lay or a boat share, because those are the boat\'s own and nobody else\'s.',
    ask: 'How does Crew Share handle a trip that cost more than the catch sold for?',
  },
  {
    slug: 'schedule-cost-check',
    name: 'Schedule Cost Check',
    instrument: 'The Board',
    forWhom: 'Restaurants, bars, retail, salons',
    tagline: 'What you have scheduled, at your rates, against the week you expect.',
    blurb:
      'Next week\'s schedule costed at the wages you actually pay, shown against the sales you expect and the share of them you have decided you want. It shows where the payroll sits by role, because one blended figure hides whichever role moved.',
    seoDescription:
      'A labour cost checker for a small business: your scheduled hours at your own wage rates, against the sales you expect and the target share you set.',
    problem:
      'The schedule gets posted on Wednesday and the payroll number arrives ten days later, by which point the week is over and there was nothing to be done about it anyway.',
    about:
      'A schedule is a spending decision that nobody prices until afterwards. The Schedule Cost Check takes the hours as written and the wage each person is actually paid, and gives the week\'s payroll before the week happens — broken out by role, so a kitchen that crept up is visible rather than blended into one number. Against that it puts two figures, and both are the owner\'s: the sales they expect, and the share of those sales they have decided payroll should be. From those it works out what the week affords at that target and how far above or below the schedule sits, in plain money rather than only in points. It will not guess next week\'s sales, because a tool that predicted takings from last week would be selling a forecast dressed as arithmetic. It carries no target of its own, because what share of sales your payroll should be is a decision about your business rather than a figure from a survey. And it computes nobody\'s take-home: tips, taxes, overtime and tip credit are specific to you, and it will not print a number it cannot show the working for.',
    ask: 'Does the Schedule Cost Check forecast my sales, or do I tell it what I expect?',
  },
  {
    slug: 'marina-storage',
    name: 'Marina Storage Billing',
    instrument: 'By the Foot',
    forWhom: 'Marinas, boatyards, dry stacks',
    tagline: 'Your rate card, your boats, this month\'s bill.',
    blurb:
      'Marinas bill by the foot at a different rate for a wet slip, a dry stack and a boat on the hard, with a minimum for the small ones and a surcharge for anybody living aboard. Every yard\'s rate card is its own invention, which is why the first of the month is still a spreadsheet.',
    seoDescription:
      'Marina storage billing by boat length: your own per-foot rates by kind, minimums, liveaboard surcharges, and the month\'s total.',
    problem:
      'Billing by the foot is simple arithmetic done sixty times, and it is done on the first of every month by somebody who would rather be doing anything else. One mistyped length is an invoice a customer rings about.',
    about:
      'A marina\'s rate card is not a price, it is a small system: a rate per foot that differs by whether the boat is in the water, in the stack or on the hard, a minimum below which a bill is not worth sending, and whatever flat lines the yard adds on top for living aboard or for power. The Marina Storage Billing sheet takes that card and the boat list and produces the month, line by line, showing which boats landed on their minimum rather than on their footage — because that is the line a customer queries. Lengths are held in half-feet and money in whole cents, so sixty slips do not drift. A boat entered under a kind that is not on the card is reported and left unpriced rather than quietly billed at something plausible, because a made-up figure on an invoice is worse than a blank one. It suggests no rate and no minimum: that card is the yard\'s own.',
    ask: 'What does Marina Storage Billing do with a boat whose kind is not on my rate card?',
  },
  {
    slug: 'commission-check',
    name: 'Commission Check',
    instrument: 'The Statement',
    forWhom: 'Insurance agencies, brokers',
    tagline: 'Your rate schedule against what the carrier actually paid.',
    blurb:
      'A carrier sends a statement, and the agency\'s own book says what each policy should have paid at the rate agreed for that carrier and that product. This puts the two side by side, line by line, and names every line that came in short rather than summing them away.',
    seoDescription:
      'An insurance commission reconciliation sheet: your own carrier and product rates against the amounts a statement actually paid, line by line.',
    problem:
      'The statement arrives, it looks about right, and it gets filed. Checking it properly means reading every line against a rate schedule that lives in somebody\'s head or in a folder of contracts.',
    about:
      'Commission reconciliation is a rate card applied to a list, with one extra column: what somebody actually paid. The Commission Check holds the agency\'s own schedule — carrier and product together, at the rate in that contract — and works out what each policy on a statement should have paid on its premium. It then shows the difference per line, and it lists every short line separately rather than only reporting a total, because a statement that nets to zero can still hide an underpayment cancelled out by an overpayment. A policy whose carrier and product are not on the schedule is reported and left unpriced. It suggests no rate, knows nothing about what other agencies are paid, and takes no view on what to do about a difference — that part is a phone call.',
    ask: 'Can the Commission Check hide an underpayment inside a total that looks right?',
  },
  {
    slug: 'recall-sheet',
    name: 'Recall Sheet',
    instrument: 'Due Back',
    forWhom: 'Dental, medical, veterinary, any service interval',
    tagline: 'Who is past the interval you set, and how far past.',
    blurb:
      'A call list built from dates rather than opinions. It holds a name, a way to reach them and when they were last seen, applies the interval you set, and sorts by how far past due — furthest first. Nothing else, on purpose.',
    seoDescription:
      'A recall and follow-up call list: your own interval applied to when each person was last seen, sorted by how far past due they are.',
    problem:
      'The recall list is a report somebody runs when they remember to, or a printed page that goes out of date the moment it comes off the printer. The people who quietly stopped coming back are the ones nobody notices.',
    about:
      'Working out who is due back is a date calculation, and it stays a date calculation here. The Recall Sheet takes the interval the practice has decided on — with a different one for any individual who needs it — applies it to when each person was last seen, and sorts by how far past that date they are, furthest first. That is the only ordering it applies, and it comes from a date rather than from a judgement about the person. It deliberately does not score anybody on how likely they are to book, rank them by what they are worth, or suggest a best time to call: each of those is a guess about a person dressed up as arithmetic. The fields are a name, a contact and a date, with nothing clinical and nothing about why — a practice using this is keeping a call list rather than a record, and the field list is what keeps it one. A person with no date to count from, or no way to be reached, is named rather than quietly dropped from the list.',
    ask: 'Does the Recall Sheet rank people by how likely they are to book?',
  },
  {
    slug: 'storm-haul-out',
    name: 'Storm Haul-Out Plan',
    instrument: 'Marker Nine',
    forWhom: 'Boatyards, marinas, dry stacks',
    tagline: 'How many hulls come out before the clock and the ground run out.',
    blurb:
      'A storm is coming and the yard has to get boats out of the water. Two things run out — the time you have left to lift, and the ground you can block on. This counts both, in your numbers, and names every boat that does not make it and which of the two stopped it.',
    seoDescription:
      'A storm haul-out planner for a boatyard: your lifting hours, cycle time, machines and yard area against your boat list, and which hulls do not make it.',
    problem:
      'The call gets made at four in the morning on a legal pad, by somebody working out how many lifts fit into the hours left while also trying to remember how much ground is free behind the shed.',
    about:
      'A haul-out is bounded by two things at once and yards usually count only the first. How many hulls fit through the machines in the hours left is a cycle-time question. Whether they then fit on the ground is an area question, and it is the one that bites, because a yard that plans on hull dimensions runs out of room before it runs out of list — the number that matters is the hull plus the blocking and walking space around it. This counts both, in the yard\'s own figures, and names every boat that stays in the water along with which constraint stopped it, because time and space have different answers: another machine and an earlier start fix one, somewhere else to put them fixes the other. It predicts nothing about the storm — the hours remaining is a figure the yard types in from whatever it is watching, and every answer moves with it. And it does not decide: which boat goes first is contracts, relationships and judgement, and the page says in those words that the tool counts and the yard decides.',
    ask: 'Does the Storm Haul-Out Plan know anything about the storm itself?',
  },
  {
    slug: 'reorder-list',
    name: 'Reorder List',
    instrument: 'Days of Cover',
    forWhom: 'Retail, chandlery, parts, any shelf',
    tagline: 'How long each line lasts, and when the order has to go.',
    blurb:
      'Drop the stock export you already get, tell it which column means what, and it works out how long each line lasts at the usage you gave it and when the order has to go to beat the lead time. Your file is read by the page and never uploaded.',
    seoDescription:
      'A reorder and days-of-cover worksheet: your stock export, your usage and lead times, and which lines have to be ordered today.',
    problem:
      'Running out is expensive and ordering early is expensive, and the line between them is a lead time nobody writes down. Shopify’s Stocky, which did this for its own merchants, was retired on 31 August 2026.',
    about:
      'Days of cover is one division and this keeps it as one. What is on hand divided by what goes out in a day is how long a line lasts; take the supplier\'s lead time off that and you have how long before the order has to go. Everything else is the owner\'s: how many days their usage figure covers, how much buffer they want on top, and how far ahead they order for. It reads a spreadsheet dropped straight onto the page, guesses which column means what from the owner\'s own headers, and SHOWS the guess so it can be corrected, because a tool that matched the wrong column silently would do confident arithmetic on the wrong number. It forecasts nothing, fits no curve and smooths nothing. It invents no safety stock: the buffer starts at zero, because a margin nobody chose is a number the page made up. And it never states the date you run out, because that is a promise about the future rather than a division.',
    ask: 'Does the Reorder List forecast demand, or does it just divide what I gave it?',
  },
  {
    slug: 'bar-count-sheet',
    name: 'Bar Count Sheet',
    instrument: 'Back Bar',
    forWhom: 'Bars, restaurants, breweries, taprooms',
    tagline: 'What poured, what it cost, and what to order back to par.',
    blurb:
      'The Sunday-night count, worked out instead of guessed. What was on the shelf, what came in, what is left — so what poured, what it cost against the week you actually rang, and what to order back up to the pars you set. It flags a count that cannot be true rather than quietly turning it into a number.',
    seoDescription:
      'A bar inventory count sheet: opening, received and closing counts give you what poured, your pour cost, and an order list against your own par levels.',
    problem:
      'The count takes two hours on a Sunday night and produces a spreadsheet nobody trusts by Wednesday. The till knows what was sold; it does not know the well is a 1.75 and the call is a 750, or what you keep back-ups of.',
    about:
      'A bar’s inventory is not one number, it is a shelf. The Bar Count Sheet takes an opening count, whatever came in, and a closing count, and works out what actually poured — then prices it at the costs you enter and divides it by the sales you rang, per kind, because liquor, beer and wine move differently and one blended figure hides whichever one moved. It orders back to the pars you set, rounded up, because nobody orders part of a bottle. Counts are kept in half-units and money in whole cents, so a shelf of a hundred lines does not drift. It refuses to tell you what a pour cost should be or what to set a par at, and it will not compare what you used against what you theoretically should have — that needs a recipe and a pour size for every drink you make, and guessing them prints a confident number with nothing under it.',
    ask: 'How does the Bar Count Sheet know a count is wrong rather than just unusual?',
  },
  {
    slug: 'tip-out-sheet',
    name: 'Tip-Out Sheet',
    instrument: 'Last Call',
    forWhom: 'Restaurants, bars, breweries',
    tagline: 'Your split, your roster, your night — worked out to the penny.',
    blurb:
      'At close, the tips have to be divided: what comes off the top for the bar, the bussers and the runners, off which sales figure, and whether what is left splits by hours or by points. Every one of those is the house’s own rule. Type them once, the sheet remembers them, and every night after that is four numbers and a roster.',
    seoDescription:
      'A tip-out calculator that runs on your house rules: support tip-outs off the top, the rest split by hours or points, every figure worked out to the penny.',
    problem:
      'Nobody agrees on how tips get split, because there is no standard — there is only what this house decided. So it gets rebuilt in a spreadsheet, or done on a legal pad at one in the morning by somebody who has been on their feet for ten hours.',
    about:
      'Splitting a night’s tips is not one calculation, it is a house’s own set of rules applied in a fixed order. Something may come off the top before anything is divided. Support roles — the bar, the bussers, the runners, the host — are each owed a percentage of a particular sales figure, and which figure is itself a decision. Whatever survives that splits across the pool, weighted by hours in some houses and by points in others. The Tip-Out Sheet takes those rules as input rather than assuming any of them, applies them in that order, and prints the arithmetic beside every figure. It counts in whole cents throughout and hands out the leftover pennies by largest remainder, so the shares always add back up to the money that came in — and it says on the page when they do. It refuses to suggest a rate, because that is the one thing the house is actually paid to decide.',
    ask: 'How does the Tip-Out Sheet handle a night where the tip-outs come to more than the tips?',
  },
  {
    slug: 'job-quote',
    name: 'Job Quote',
    instrument: 'Estimate Pad',
    forWhom: 'HVAC, plumbing, electrical, any trade that quotes',
    tagline: 'Your hours, your parts, your markup — priced before you start.',
    blurb:
      'Labour at your own rates and parts at your own markup, on one estimate, with a call-out minimum that holds and a travel charge that rides on the line it belongs to. Every figure shows the arithmetic beside it, so the number you hand a customer is one you can stand behind at the kitchen table.',
    seoDescription:
      'A job quote builder for the trades: your labour rates, your parts markup, your call-out minimum and travel charge — with the arithmetic printed beside every line.',
    problem:
      'A quote is written on a pad in a driveway, and the markup gets done in somebody’s head. Get it wrong low and the job pays for itself and nothing else; get it wrong twice on the same customer and there is no way back to the right number without admitting the first one was made up.',
    about:
      'Pricing a job forward is a different piece of arithmetic from checking a bill backwards, and it is the one every trade does standing up. Labour is hours against a rate. Parts are what the supply house charged, plus the markup that shop decided on once and kept. A call-out minimum means a fifteen-minute visit still pays for the truck being there, and a travel charge belongs to a particular line rather than floating at the bottom. The Job Quote takes all four as input and applies them in that order, showing the working beside every line — the hours times the rate, the cost and the markup separately, and where a line was lifted to the minimum it says so on the line rather than in a footnote. It suggests no rate and no markup, because those are the two decisions a shop is actually paid to make, and it knows nothing about what anybody else in the county charges. Where a markup would price a part below what it cost, it says so rather than quoting it.',
    ask: 'Does the Job Quote ever suggest what my markup should be?',
  },
  {
    slug: 'chair-split',
    name: 'Chair Split',
    instrument: 'Settlement Card',
    forWhom: 'Salons, barber shops, any chair rented or split',
    tagline: 'Booth rent, commission, product and the card fee — settled to the cent.',
    blurb:
      'Some chairs are on rent and some on commission, the product charge comes off services before anything is divided, and the card fee is shared across the chairs that actually took the money. Four rules your shop settled once, applied in order, with the odd pennies landing somewhere real instead of vanishing.',
    seoDescription:
      'A weekly settlement sheet for a salon or barber shop: booth rent, commission splits, the product charge and the card fee, worked out chair by chair to the cent.',
    problem:
      'Settling up is four rules layered on each other and no two shops layer them the same way, so it lives in a spreadsheet somebody rebuilds every time a chair changes. Get the order wrong and a stylist is charged a share of a deduction they already carried in full.',
    about:
      'A salon week is not one split, it is a stack of a shop’s own decisions applied in a fixed order. The product charge comes off services first, because taking it afterwards would charge the chair a share of something they have already paid for outright. What is left splits at whatever rate that shop settled on, and retail usually splits at a different one. A chair on booth rent sits outside all of it and pays for the chair instead. The card fee is shared on what each chair actually ran through the reader rather than evenly, because splitting it evenly charges the quiet chair for money it never took — and the pennies are handed out by largest remainder, the same routine the Tip-Out Sheet uses, so the shares add back up to the fee. It takes no cut of tips, ever. It suggests no rent, no split and no product charge, and where a chair comes out owing the shop money it says so on the line rather than printing a minus and moving on.',
    ask: 'How does the Chair Split handle a week where a chair does not cover its rent?',
  },
  {
    slug: 'property-round',
    name: 'Property Round',
    instrument: 'Route Sheet',
    forWhom: 'Lawn crews, cleaners, pest, pool — anything on a route',
    tagline: 'What each property pays per crew hour, with the drive counted.',
    blurb:
      'You quoted the property once, standing in the driveway, and the price has not moved since. This works out what each one actually pays for an hour of your crew’s day — drive included — and which of them are past the interval you set. Nothing here suggests a price or a rate you should be hitting.',
    seoDescription:
      'A route worksheet for lawn crews and cleaners: what each property pays per crew hour with the drive counted, which are past their interval, and which do not cover the time they take.',
    problem:
      'The price was set once and the drive was never in it. A far customer on a low price can quietly cost more in crew time than it bills, and nothing on an invoice, a schedule or a bank statement will ever show you which one it is.',
    about:
      'A route business is priced per property and paid for per hour, and those two things never meet on paper. The Property Round puts them together: what a property pays, divided by the crew time it actually takes — with the drive to it counted, because a twenty-minute drive to a thirty-minute job is a fifty-minute job whatever the invoice says. That single inclusion is usually the whole finding, since the properties that lose money are almost never the slow ones, they are the far ones. It works out the round’s own rate over the same rows the money is summed on rather than averaging the per-property rates, which would weight a ten-minute stop the same as a two-hour one. It also says which properties are past the interval, reusing the same date arithmetic the Recall Sheet uses on a patient. It suggests no price, no interval and no rate you should be hitting, and it will never tell you to drop a customer — a property that loses money can still be the reason you got the street, and a page cannot see that.',
    ask: 'Does the Property Round tell me what to charge, or only what I am getting?',
  },
  {
    slug: 'book-time',
    name: 'Book Time',
    instrument: 'Repair Order',
    forWhom: 'Repair shops, body shops, anything quoted from flat rate',
    tagline: 'What book said, what the clock said, and what went on the ticket.',
    blurb:
      'Book hours against clock hours is your efficiency, and no accounting package has ever printed it. This puts it beside the money half — what each ticket should have billed at your door rate against what it actually did — so a week that looks fine on the invoices has nowhere left to hide.',
    seoDescription:
      'A flat-rate efficiency worksheet for a repair shop: book hours against clock hours, and what each ticket should have billed against what it did.',
    problem:
      'The book says 2.4 hours and the tech took 3.1, and those two numbers are on the same repair order without ever meeting. A shop can bill exactly to book all month and still lose, because the clock ran long on every ticket and nothing anywhere adds that up.',
    about:
      'A repair order carries two facts that never meet. The customer is billed book hours at the door rate, which every accounting package can check. The tech takes however long they take, which none of them record against the book. Book Time sets the two side by side: what each ticket should have billed against what it did, and what book said the job takes against what the clock said it took. The second is the shop’s efficiency, and it is the number that decides whether a week that billed correctly actually paid. It works the shop’s own rate over the same tickets on both sides rather than averaging the per-ticket percentages, which would weight a twenty-minute job like a full day. A comeback is treated as what it is — no bill and no book time, but clock hours the shop ate — rather than as a ticket that came in short. It sets no target efficiency and knows nothing about what any other shop runs; what a good number looks like is different in every bay and anybody quoting you one is selling something.',
    ask: 'Does Book Time tell me what efficiency I should be running?',
  },
  {
    slug: 'event-day',
    name: 'Event Day',
    instrument: 'Day Book',
    forWhom: 'Food trucks, caterers, market and festival vendors',
    tagline: 'How many have to go out of the window before the pitch is paid.',
    blurb:
      'Somebody offers you a pitch for the weekend. This works out how many have to sell before the day has paid for itself at the mix you expect, draws where that sits against the day you are planning, and costs the prep that does not sell at what it cost you rather than at what it would have made.',
    seoDescription:
      'A break-even worksheet for a food truck or market stall: how many have to sell before the pitch fee and the day’s fixed costs are paid, drawn against the day you expect.',
    problem:
      'A pitch fee arrives as a single number in July and gets answered on instinct. Nobody works out how many plates it actually costs, because that means knowing what a plate contributes after what went into it — and that figure lives in four places, none of them together.',
    about:
      'A day at a festival has one piece of arithmetic in it and almost nobody does it. Everything sold contributes its price minus what that one cost to make. The pitch fee, the fuel, the propane and the extra pair of hands do not move with sales at all. So the day breaks even at the fixed cost divided by what a unit contributes — and with more than one thing on the menu, a unit means one unit at the mix being expected, which is an assumption this states on the page rather than burying. It rounds that number UP, because half a plate does not pay half a pitch fee and a break-even that has not broken even is worse than none. Prep that does not sell is costed separately and at what it cost, never at what it would have sold for, because that money was never anybody’s. It is the only tool here that draws its answer, and the line is straight because the arithmetic is — nothing is fitted, smoothed or projected. It forecasts no crowd, suggests no price, and will not tell you whether to take the booking.',
    ask: 'Does Event Day predict how busy the festival will be?',
  },
  {
    slug: 'review-autopilot',
    name: 'Review Autopilot',
    tagline: 'Every review answered, in your voice — and you keep the final say.',
    blurb:
      'A review-response console for a local business: every Google, Yelp, and Facebook review in one queue, an on-brand reply drafted for each, and an autopilot with one firm rule — positive reviews post automatically, negative ones are always held for the owner. Switch between five businesses and the whole console re-skins to match.',
    seoDescription:
      'A review-response console: Google, Yelp, and Facebook reviews in one queue, replies drafted in your voice — positives auto-post, negatives held for you.',
    problem:
      'Reviews land on Google, Yelp, and Facebook whether you’re watching or not — and answering each one well takes time no owner has, so the good ones go unthanked and the bad ones sit in public, unanswered.',
    about:
      'Every public review is a customer conversation that happens with or without you. Review Autopilot pulls Google, Yelp, and Facebook reviews into one queue, reads each rating, and drafts an on-brand reply — in the business’s own voice, ready to edit or post in one click. The autopilot rule is deliberately conservative: positive reviews post automatically, neutral ones wait as drafts, and a negative review is always held for the owner — a critical reply never goes out without a human decision. The demo runs five businesses — an auto shop, a restaurant, a salon, a dental practice, and an HVAC company — and switching re-skins the entire console, reviews and all, so an owner sees their own kind of business.',
    ask: 'What does Review Autopilot do with a 1-star review — does it ever auto-post one?',
    },
];

/**
 * Grouping for the /work catalog. `band` splits the gallery into its two
 * sections: `local` is what a small business is actually being offered, `scale`
 * is the supply-chain work — kept live and browsable as PROOF of what gets
 * built, never as the offer (D29). The Work index renders one section per
 * group, local band first; adding a group to a band needs no markup change.
 */
export interface WorkGroup {
  label: string;
  band: 'local' | 'scale';
  slugs: string[];
  /** Local, but NOT sold on /tools/ and NOT in shelfCount.
   *
   *  Review Autopilot is the only one. It IS a tool built for a local business,
   *  so it belongs in the local band on /work/ — but it is not on the shelf and
   *  must not be counted there. Its drafting is sample-only with the live path
   *  deliberately removed (D25), so it fails two of the blanket claims /tools/
   *  makes about everything on that page: that each runs on the visitor's own
   *  numbers, and that nothing is modelled. And its category closed in March
   *  2026, which is exactly why the shelf exists — selling it at the shelf price
   *  would be selling the thing that taught us not to. */
  offShelf?: boolean;
}
export const workGroups: WorkGroup[] = [
  {
    label: 'Money going out the door',
    band: 'local',
    slugs: ['bar-count-sheet', 'schedule-cost-check', 'marina-storage', 'reorder-list', 'property-round'],
  },
  {
    label: 'The rule that is yours',
    band: 'local',
    slugs: ['tip-out-sheet', 'crew-share', 'commission-check', 'chair-split'],
  },
  /* ITS OWN GROUP, because it is the first tool here that prices work BEFORE it
     happens. Every other one measures something already done — what poured, what
     was owed, what is due, what a statement paid. A quote is the same rate-card
     arithmetic pointed forwards, and grouping it with the backward-looking tools
     would hide the one thing a contractor is scanning the page for. */
  {
    label: 'What it comes to, before you do it',
    band: 'local',
    slugs: ['job-quote', 'event-day'],
  },
  {
    label: 'Who is due, and nobody is watching',
    band: 'local',
    slugs: ['recall-sheet'],
  },
  {
    label: 'Where it started',
    band: 'local',
    offShelf: true,
    slugs: ['review-autopilot'],
  },
  {
    label: 'When the clock is the constraint',
    band: 'local',
    slugs: ['storm-haul-out'],
  },
  /* ITS OWN GROUP, and the label is the shape rather than the trade. A total
     that foots correctly while the error hides underneath it is the same
     problem the Staging Triage Console solves on a factory floor, which is why
     this group's at-scale twin is obvious from the name alone. */
  {
    label: 'What the total is hiding',
    band: 'local',
    slugs: ['book-time'],
  },
  {
    label: 'Demand & planning',
    band: 'scale',
    slugs: ['production-plan-churn', 'order-confirmation-command-center', 'past-due-order-triage'],
  },
  {
    label: 'Inbound & inventory',
    band: 'scale',
    slugs: ['asn-update-radar', 'staging-triage-console'],
  },
  {
    label: 'Master data & parameters',
    band: 'scale',
    slugs: ['bom-explorer', 'parameter-audit-console'],
  },
];

/* The shelf, derived. D22 forbids stating a tool count in prose anywhere,
   off-site included, so every surface that wants one reads it from here rather
   than counting by hand. Adding a local group changes both of these for free. */
export const shelfSlugs = workGroups
  .filter((g) => g.band === 'local' && !g.offShelf)
  .flatMap((g) => g.slugs);
export const shelfCount = shelfSlugs.length;

/**
 * JSON-LD for a demo route — a SoftwareApplication node (free, browser-based,
 * authored by the operator / published by the org) plus a BreadcrumbList. Passed
 * to DemoLayout's `schema` prop, which merges it into the site-wide @graph.
 */
export function demoSchema(demo: Demo, origin: string): Record<string, unknown>[] {
  const url = `${origin}/work/${demo.slug}/`;
  return [
    {
      '@type': 'SoftwareApplication',
      '@id': `${url}#tool`,
      name: demo.name,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web browser',
      description: demo.blurb,
      url,
      image: `${origin}${versioned(`/shots/${demo.slug}.webp`)}`,
      screenshot: `${origin}${versioned(`/shots/${demo.slug}.webp`)}`,
      isAccessibleForFree: true,
      author: { '@id': `${origin}/#person` },
      publisher: { '@id': `${origin}/#organization` },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
        { '@type': 'ListItem', position: 2, name: 'Work', item: `${origin}/work/` },
        { '@type': 'ListItem', position: 3, name: demo.name },
      ],
    },
  ];
}

/**
 * JSON-LD for the home page — a WebPage node, the Service the page actually
 * offers, and an ItemList cataloguing the live tools (self-contained ListItems;
 * the full SoftwareApplication nodes live on each demo route). Passed to
 * MarketingLayout's `schema` prop.
 *
 * `areaServed: 'US'` here against /main-street/'s New Bern + Craven County is
 * what keeps the two pages from competing for the same Service intent (D29):
 * this page serves a small business anywhere, that one is the local surface.
 */
export function homeSchema(origin: string): Record<string, unknown>[] {
  return [
    {
      '@type': 'WebPage',
      '@id': `${origin}/#webpage`,
      url: `${origin}/`,
      name: 'AppliedIQ Solutions — Custom Software for Small Business',
      description:
        'Custom software for small local business, built by an operator who does this at industrial scale — live tools you can try right now, yours to own.',
      isPartOf: { '@id': `${origin}/#website` },
      about: { '@id': `${origin}/#organization` },
    },
    {
      '@type': 'Service',
      '@id': `${origin}/#service`,
      name: 'Custom software for small business',
      serviceType: 'Custom software development for small business',
      provider: { '@id': `${origin}/#organization` },
      areaServed: 'US',
      description:
        'Custom, owned software for small businesses — a real website you own, spreadsheets turned into a live tool, and custom tools built around how you actually work.',
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'What I build',
        itemListElement: [
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'A real website you own' } },
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Your spreadsheets, turned into a live tool' } },
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Any custom tool your business needs' } },
        ],
      },
    },
    {
      '@type': 'ItemList',
      '@id': `${origin}/#live-tools`,
      name: 'Live tools',
      description: 'Interactive operational tools running in the browser on synthetic data — no login.',
      numberOfItems: demos.length,
      itemListElement: demos.map((demo, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: demo.name,
        url: `${origin}/work/${demo.slug}/`,
      })),
    },
  ];
}
