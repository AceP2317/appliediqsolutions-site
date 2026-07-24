// Single source of truth for the seven Northpoint tool demos.
// The Work index and each /work/<slug> route read from here, so titles,
// taglines, and OpenGraph meta stay in sync. When porting a demo, point its
// `component` at the imported .jsx island in src/pages/work/[slug].astro.

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
  /** The Home-page hero tool. */
  hero?: boolean;
}

export const demos: Demo[] = [
  {
    slug: 'staging-triage-console',
    name: 'Staging Triage Console',
    tagline: 'Catch the count errors a total-only view hides.',
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
    blurb:
      'A week-over-week volatility tracker for the production plan: it separates real reschedules from MRP renumbering noise, attributes each change to planner or system, and pinpoints the materials and weeks taking the most whiplash.',
    seoDescription:
      'A week-over-week volatility tracker for the production plan: real reschedules vs MRP renumbering noise, attributed to planner or system.',
    problem:
      'The production plan changes constantly, but you can’t tell real reschedules from MRP renumbering noise — or whether a planner or the system moved it.',
    about:
      'Every week, MRP regenerates the production plan and thousands of order lines shift. Most of that movement isn’t a real schedule change — it’s renumbering: orders dropping and re-creating with new identities while the actual dates barely move. The few genuine reschedules a planner needs to act on get buried in that churn. Production Plan Churn diffs the plan week-over-week, separates real date moves from renumbering noise, and attributes each change to a planner decision or a system action — so you can see how volatile the plan really is, and where the whiplash concentrates by material and by week. It’s the plan-stability question MRP exception reports were never built to answer.',
    ask: 'How does Production Plan Churn tell a real reschedule from MRP renumbering noise?',
    hero: true,
  },
  {
    slug: 'order-confirmation-command-center',
    name: 'Order Confirmation Command Center',
    tagline: 'See why orders miss their date — and where to act first.',
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

export const heroDemo: Demo = demos.find((d) => d.hero) ?? demos[0];

/**
 * Domain grouping for the /work catalog — reads as a supply-chain map rather
 * than a flat list, ordered by operational flow. Each `slugs` entry must match
 * a Demo above; the Work index renders one section per group.
 */
export interface WorkGroup {
  label: string;
  slugs: string[];
}
export const workGroups: WorkGroup[] = [
  {
    label: 'Demand & planning',
    slugs: ['production-plan-churn', 'order-confirmation-command-center', 'past-due-order-triage'],
  },
  {
    label: 'Inbound & inventory',
    slugs: ['asn-update-radar', 'staging-triage-console'],
  },
  {
    label: 'Master data & parameters',
    slugs: ['bom-explorer', 'parameter-audit-console'],
  },
  {
    label: 'Main Street · local business',
    slugs: ['review-autopilot'],
  },
];

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
      image: `${origin}/shots/${demo.slug}.webp`,
      screenshot: `${origin}/shots/${demo.slug}.webp`,
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
 * JSON-LD for the home page — a WebPage node plus an ItemList cataloguing the
 * live tools (self-contained ListItems; the full SoftwareApplication nodes live
 * on each demo route). Passed to MarketingLayout's `schema` prop.
 */
export function homeSchema(origin: string): Record<string, unknown>[] {
  return [
    {
      '@type': 'WebPage',
      '@id': `${origin}/#webpage`,
      url: `${origin}/`,
      name: 'AppliedIQ Solutions — Custom Supply-Chain Software & AI Tools',
      description:
        'Custom supply-chain software built by an operator — live operational tools you can use right now, yours to own.',
      isPartOf: { '@id': `${origin}/#website` },
      about: { '@id': `${origin}/#organization` },
    },
    {
      '@type': 'ItemList',
      '@id': `${origin}/#live-tools`,
      name: 'Live supply-chain tools',
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
