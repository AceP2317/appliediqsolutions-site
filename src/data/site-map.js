// ============================================================================
// EVERY DESTINATION ON THIS SITE, IN ONE LIST.
//
// WHY THIS FILE EXISTS. The site carried TWO hand-kept navigation lists — the
// seats in SiteHeader.astro and the sheet in MobileTabBar.astro — and four
// separate comments in the second one say a row's wording is "matched to the
// header's copy so the two do not drift". Matching by hand is the thing that
// failed, and the same file records it failing three times:
//
//   1. /deadlines/ — the free deadline list, which had one inbound link
//      anywhere on the site and no menu row at all.
//   2. The three comparison sheets, which got a desktop seat on 2026-09-11 and
//      no phone row on the same day.
//   3. /advisory/ and /rescue/ — two PAID products, reachable from one body
//      link on /services/ and from nothing in any menu, desktop or phone.
//
// MobileTabBar's own comment names the mechanism: "a flat list gives no hint
// that anything is absent, which is why this keeps happening." A list you have
// to remember to add to is a list that reads as complete while being short.
//
// SO THE LABEL, THE NOTE AND THE ICON LIVE HERE AND NOWHERE ELSE. Each surface
// still chooses its OWN arrangement — the header groups by seat, the phone
// sheet is flat, the desktop menu groups by the headings below — but all three
// name a destination by its href and read its words from here. Two surfaces can
// disagree about where a page belongs. They can no longer disagree about what
// it is called.
//
// THE CHECK IS WHAT MAKES THIS WORTH ANYTHING, not the file. A guard walks
// src/pages/ and refuses a build where a page exists that this list has never
// heard of. Without that guard this is a fourth hand-kept list.
//
// ICONS ARE NAMES, NOT COMPONENTS. Lucide is imported component-side, so a
// component here would drag an Astro import into a file that Node gates read.
// src/components/NavIcon.astro is the one place a name becomes an icon.
// ============================================================================

/**
 * The menu's groups, in render order. A group with `title: null` renders its
 * rows with NO heading above them, which is how Home leads the list without
 * sitting under a heading that would be wrong for it whichever one it got.
 *
 * THE SPLIT IS BY COMMITMENT, extending the three headings the Services
 * dropdown already uses: what ends, what recurs every month, and what is only
 * evidence. A reader deciding whether to start something cares first whether it
 * stops. The three added here are the ones that split cannot express — free
 * things needing no decision, comparisons read BEFORE deciding, and the person.
 */
export const GROUPS = [
  { id: 'home', title: null },
  { id: 'build', title: 'Work that ends' },
  { id: 'monthly', title: 'Month after month' },
  { id: 'free', title: 'Free, open it now' },
  { id: 'compare', title: 'Before you decide' },
  { id: 'proof', title: 'Proof, not for sale' },
  { id: 'about', title: 'Who I am, and how to reach me' },
];

/**
 * Every destination, in menu order within its group.
 *
 * THREE NOTES CHANGED WHEN THE TWO LISTS MERGED, 2026-09-12, and they are
 * recorded here because a copy change should never arrive silently. The header
 * and the phone sheet each carried their own wording for /bio/, /approach/ and
 * /projects/ — "Five trades before the software" against "The operator", "How a
 * problem becomes software" against "How I work", "What's building now" against
 * "Building now". The header's wording won all three: it says what the page
 * gives rather than what it is about, and the phone row is a full-width panel
 * with room for it.
 *
 * TWO NOTES ARE NEW, for pages that held a top-level seat and therefore never
 * needed one: /check/ and /main-street/. Both are built from words the repo
 * already uses about those pages rather than written fresh.
 */
export const DESTINATIONS = [
  { href: '/', group: 'home', icon: 'House', label: 'Home', note: 'What I build for your business' },

  { href: '/services/', group: 'build', icon: 'Layers', label: 'What I build', note: 'Tools, systems, and what they cost' },
  { href: '/websites/', group: 'build', icon: 'Globe', label: 'Websites', note: 'A site you own, and what it costs' },
  { href: '/tools/', group: 'build', icon: 'Wrench', label: 'Tools you can buy', note: 'Built already — open one now' },
  { href: '/ai-fit/', group: 'build', icon: 'Compass', label: 'AI Fit Assessment', note: 'Where AI fits, in writing' },
  { href: '/supply-chain/', group: 'build', icon: 'Boxes', label: 'For manufacturers', note: 'Fixed-price audits, never a day rate' },
  { href: '/rescue/', group: 'build', icon: 'ClipboardCheck', label: 'Rescue audit', note: 'Software you already have, read' },
  { href: '/quoted/', group: 'build', icon: 'FileText', label: 'Quoted before it starts', note: 'Work with its own price, named up front' },

  { href: '/advisory/', group: 'monthly', icon: 'MessagesSquare', label: 'Monthly advisory', note: 'A direction, not a build' },
  { href: '/upkeep/', group: 'monthly', icon: 'Timer', label: 'Upkeep', note: 'Small changes, with a stated limit' },
  { href: '/visibility/', group: 'monthly', icon: 'Search', label: 'Does AI name you', note: 'Measured monthly, method published' },

  { href: '/check/', group: 'free', icon: 'Calculator', label: 'Free check', note: 'Two numbers in, one about your business back' },
  { href: '/deadlines/', group: 'free', icon: 'CalendarClock', label: 'What is due', note: 'Craven County dates, free' },

  { href: '/websites/compare/', group: 'compare', icon: 'Scale', label: 'Where a website lives', note: 'Wix, Squarespace, WordPress and the rest' },
  { href: '/getting-paid/', group: 'compare', icon: 'CreditCard', label: 'What it costs to be paid', note: 'Stripe, Square, PayPal, Clover, Venmo' },
  { href: '/stores/', group: 'compare', icon: 'ShoppingBag', label: 'Where to sell online', note: 'Shopify, Etsy, WooCommerce, Instagram' },
  /* FAQ MOVED OUT OF THE PERSON GROUP ON 2026-09-12. It is not a page about the
     operator; it is a page a reader opens while deciding, which is what this
     group is. The header's Resources seat makes the same move. */
  { href: '/faq/', group: 'compare', icon: 'HelpCircle', label: 'FAQ', note: 'Straight answers, no hedging' },

  { href: '/work/', group: 'proof', icon: 'LayoutGrid', label: 'Everything I’ve built', note: 'The industrial work as well' },
  { href: '/confirmation-outlook/', group: 'proof', icon: 'Radar', label: 'Confirmation Outlook', note: 'A deployed service, at scale' },
  { href: '/projects/', group: 'proof', icon: 'Hammer', label: 'Projects', note: 'What’s building now' },

  { href: '/main-street/', group: 'about', icon: 'Store', label: 'Main Street', note: 'New Bern, NC — in person' },
  { href: '/bio/', group: 'about', icon: 'User', label: 'Bio', note: 'Five trades before the software' },
  { href: '/approach/', group: 'about', icon: 'Route', label: 'Approach', note: 'How a problem becomes software' },
  { href: '/ai-news/', group: 'about', icon: 'Newspaper', label: 'AI News', note: 'A daily autonomous desk' },
  { href: '/contact/', group: 'about', icon: 'Mail', label: 'Contact', note: 'Start a project' },
];

/**
 * Pages that exist on disk and are deliberately NOT menu destinations. The
 * guard reads this rather than carrying its own copy, so adding an exclusion is
 * a decision recorded HERE with its reason beside it, never a quiet edit to a
 * check. Every entry needs a why — if you cannot write one, the page belongs in
 * DESTINATIONS.
 */
export const NOT_DESTINATIONS = Object.freeze({
  '404': 'An error page. Nobody navigates to it on purpose.',
  admin: 'The operator’s own console, not a visitor surface.',
  card: 'A digital business card handed out by link, deliberately not in any menu.',
  'ian-card': 'The second digital card, same reason.',
  host: 'A redirect target for a printed short link.',
  meet: 'A booking hand-off reached from /contact/, never browsed to.',
  privacy: 'Footer-only by convention, like every policy page.',
  terms: 'Footer-only by convention, like every policy page.',
});

/* ── WHAT THE HEADER BUTTON ASKS FOR, PER PAGE ─────────────────────────────
   Until 2026-09-12 the header button said "Start a project" on every page and
   pointed at a bare /contact/ with no intent. That asked the same thing of a
   reader on /bio/, who is still deciding whether the operator is a real person,
   as of a reader on /quoted/, who is pricing work — and every header click
   landed in one undifferentiated bucket while the body buttons arrived carrying
   ?intent=quote and ?intent=consult.

   THE INTENT IS THE HALF THAT DOES REAL WORK. ContactForm.jsx reads it out of
   the query string and pre-selects that row, so a visitor arrives on the form
   already on the right question rather than choosing from five. The five keys
   are `quote`, `consult`, `assessment`, `founding` and `inquiry`, and nothing
   here may invent a sixth — an unknown key is ignored by the form and the
   visitor silently gets the default.

   THE LABEL COSTS NOTHING TO MEASURE, which is why it varies too. track.js
   already sends a clicked link's own text as `label` and its href as `to`, so
   these separate in the log with no change to the instrument.

   BY GROUP, WITH OVERRIDES, rather than a field on all twenty-five rows. A
   per-row field would be twenty-five places to keep in step for a decision that
   really only has five shapes in it. */
const CTA_BY_GROUP = {
  home: { label: 'Start a project', intent: 'quote' },
  build: { label: 'Get a price', intent: 'quote' },
  monthly: { label: 'Ask about it', intent: 'consult' },
  free: { label: 'Start a project', intent: 'quote' },
  compare: { label: 'Ask me something', intent: 'inquiry' },
  proof: { label: 'Start a project', intent: 'quote' },
  about: { label: 'Ask me something', intent: 'inquiry' },
};

/* One page at a time, where the group's answer is wrong for it. Each needs a
   reason beside it, because an override with no reason is indistinguishable
   from a group rule somebody forgot to update. */
const CTA_OVERRIDES = {
  // It IS the assessment. "Get a price" would ask for a quote on a product
  // whose price is already published in two forms on that page.
  '/ai-fit/': { label: 'Book the assessment', intent: 'assessment' },
  /* The local sales page, sitting in the person group because that is where it
     belongs in the MENU. "Ask me something" is wrong for it: a New Bern reader
     here is closer to buying than a reader of the bio.

     AND IT DELIBERATELY DOES NOT USE THE `founding` INTENT, which would
     otherwise be the obvious choice. That row only renders in the form while a
     free build remains (`foundingOnly` in ContactForm.jsx, against CLAIMED in
     founding.ts), so the day the last one goes the button would keep promising
     it and the form would silently drop back to its default. Nothing here can
     see that state — founding.ts is TypeScript and this file is imported by
     Node gates — so the intent that cannot go stale is the right one. The
     founding band on that page carries its own claim button and knows when to
     retire itself. */
  '/main-street/': { label: 'Start a project', intent: 'quote' },
  // A reader here is deciding whether this practice is real, not pricing work.
  // The button is the weakest instrument on this page either way: what converts
  // somebody reading the bio is the next paragraph, not a control.
  '/bio/': { label: 'Ask me something', intent: 'inquiry' },
  // Already on the contact page. A button back to it would be furniture.
  '/contact/': null,
};

/**
 * What the header button should say on a given page, and where it should go.
 * Returns null where the page should render no button at all.
 */
export function cta(href) {
  if (href in CTA_OVERRIDES) return CTA_OVERRIDES[href];
  const d = BY_HREF.get(href);
  const base = CTA_BY_GROUP[d?.group] ?? CTA_BY_GROUP.home;
  return base;
}

/** The href a CTA points at, intent included. */
export function ctaHref(c) {
  return c?.intent ? `/contact/?intent=${c.intent}` : '/contact/';
}

/**
 * Whole FOLDERS of pages that one destination already covers, each with the
 * reason it is covered rather than missing. Kept apart from NOT_DESTINATIONS
 * because the claim is different: those pages are not destinations at all,
 * while these have an index that IS one and lists every page under it.
 */
export const COVERED_BY = Object.freeze({
  'work/': '/work/ is the index of every demo route and renders a card for each one. A menu row per tool would be thirty rows pointing into one page.',
});

/**
 * THE COUNT IS DERIVED AND IS NEVER TYPED ANYWHERE (D22). Every count this repo
 * has written beside a list has gone stale on the day the list changed.
 */
export const destinationCount = DESTINATIONS.length;

const BY_HREF = new Map(DESTINATIONS.map((d) => [d.href, d]));

/**
 * Read one destination's words by its address.
 *
 * IT THROWS RATHER THAN RETURNING UNDEFINED, and that is the whole point. A
 * surface asking for a page this list has never heard of is the drift this file
 * exists to end, and an undefined slipping into a template renders as an empty
 * menu row that looks like a styling bug for a week.
 */
export function dest(href) {
  const found = BY_HREF.get(href);
  if (!found) {
    throw new Error(
      `site-map: no destination for "${href}". Add it to DESTINATIONS, or fix the href. ` +
        'A menu may only name a page this list knows about.',
    );
  }
  return found;
}

/** Every destination in one group, in declared order. */
export function inGroup(id) {
  return DESTINATIONS.filter((d) => d.group === id);
}

/**
 * The menu, ready to render: each group with its heading and its rows, and any
 * group that turned out empty dropped rather than rendering a bare heading.
 */
export function menu() {
  return GROUPS.map((g) => ({ ...g, items: inGroup(g.id) })).filter((g) => g.items.length > 0);
}

/**
 * ASSERTED AT BUILD TIME, not remembered. Every consumer calls this, so a
 * malformed list stops the build on the first page that renders rather than
 * shipping a menu with a blank row in it.
 *
 * The floors are deliberately low. They are here to catch a list emptied or
 * half-written by an edit, not to police how many pages the site has.
 */
export function assertSiteMap(who = 'site-map') {
  const problems = [];
  const groupIds = new Set(GROUPS.map((g) => g.id));

  if (DESTINATIONS.length < 15) {
    problems.push(`only ${DESTINATIONS.length} destinations; expected at least 15`);
  }

  const seen = new Set();
  for (const d of DESTINATIONS) {
    if (!d.href || !d.href.startsWith('/')) problems.push(`bad href: ${JSON.stringify(d.href)}`);
    // Internal links always use the trailing-slash form. A missed slash 404s in
    // dev because of trailingSlash:'always', and a 404 behind a menu row is
    // silent until somebody clicks it.
    if (d.href !== '/' && !d.href.endsWith('/')) problems.push(`${d.href} is missing its trailing slash`);
    if (seen.has(d.href)) problems.push(`${d.href} appears twice`);
    seen.add(d.href);
    if (!d.label) problems.push(`${d.href} has no label`);
    if (!d.note) problems.push(`${d.href} has no note`);
    if (!d.icon) problems.push(`${d.href} has no icon`);
    if (!groupIds.has(d.group)) problems.push(`${d.href} is in unknown group "${d.group}"`);
  }

  for (const [page, why] of Object.entries(NOT_DESTINATIONS)) {
    if (!why || why.length < 10) problems.push(`exclusion "${page}" has no reason written beside it`);
  }

  /* EVERY BUTTON MUST ASK FOR SOMETHING THE FORM UNDERSTANDS. ContactForm.jsx
     ignores an unknown intent and silently falls back to its default, so an
     invented key produces a button that works, navigates, and quietly does the
     opposite of what it promised. That is the failure this catches, and it is
     invisible from the outside. The five keys are ALL_INTENTS in that file. */
  const KNOWN_INTENTS = new Set(['quote', 'consult', 'assessment', 'founding', 'inquiry']);
  for (const [group, c] of Object.entries(CTA_BY_GROUP)) {
    if (!groupIds.has(group)) problems.push(`CTA declared for unknown group "${group}"`);
    if (!c.label) problems.push(`the CTA for group "${group}" has no label`);
    if (!KNOWN_INTENTS.has(c.intent)) problems.push(`the CTA for group "${group}" asks for unknown intent "${c.intent}"`);
  }
  for (const [href, c] of Object.entries(CTA_OVERRIDES)) {
    if (!BY_HREF.has(href)) problems.push(`CTA override for "${href}", which is not a destination`);
    if (c === null) continue;
    if (!c.label) problems.push(`the CTA override for "${href}" has no label`);
    if (!KNOWN_INTENTS.has(c.intent)) problems.push(`the CTA override for "${href}" asks for unknown intent "${c.intent}"`);
  }
  for (const g of GROUPS) {
    if (!(g.id in CTA_BY_GROUP)) problems.push(`group "${g.id}" has no CTA declared`);
  }

  if (problems.length) {
    throw new Error(`${who}: site-map is malformed\n  - ${problems.join('\n  - ')}`);
  }
  return true;
}
