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
/* THE GROUPS ARE THE THREE DOORS, SINCE 2026-09-20 (D118). The split by
   commitment above described a site selling twelve things; the site now sells
   three, and a reader deciding where to go cares first which door is theirs.
   A `retiring` group held every page the cut took down until its phase deleted
   it, so that the nav coverage gate kept every page reachable up to the commit
   that removed it; the last of those rows left with advisory and visibility. */
export const GROUPS = [
  { id: 'home', title: null },
  { id: 'websites', title: 'A website you own' },
  /* THE THREE GUIDES GET THEIR OWN HEADING, 2026-09-20, AND IT IS A SUBSECTION
     IN THE ONLY SENSE THIS MENU HAS ONE. The operator expected the three
     comparison sheets to sit together under Websites rather than as three flat
     rows beside the Websites page, which is how they first went back. Groups
     here do not nest — the menu renders a flat heading plus its rows in CSS
     columns — so "together, under Websites" means a group of their own placed
     immediately after the websites group, which is what this is.

     SEVEN GROUPS AGAIN, AND THAT IS NOT THE SEVEN D118 CUT. The seventh it
     removed was `retiring`, a holding pen for pages on their way out. This one
     is the free reference shelf the retired Resources seat used to be, and the
     operator asked for it back by name. */
  { id: 'guides', title: 'Before you decide — free to read' },
  { id: 'local', title: 'Main Street — local small business' },
  { id: 'industrial', title: 'For manufacturers' },
  { id: 'proof', title: 'Everything built' },
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

  { href: '/websites/', group: 'websites', icon: 'Globe', label: 'Websites', note: 'A site you own, and what it costs' },

  /* THE THREE GUIDES, TOGETHER, UNDER THEIR OWN HEADING — 2026-09-20.

     THE FIRST ATTEMPT PUT THEM AS FLAT ROWS BESIDE THE WEBSITES PAGE and the
     operator said plainly that he had expected all three in a subsection. He is
     right and the first shape was wrong: with four rows under "A website you
     own", the page you buy and the three things you read while deciding sat at
     one level, so nothing told a reader which of the four sells something. The
     heading above now carries the Websites page alone, and these three carry a
     heading that says what they are.

     ALL THREE ANSWER THE SAME FIVE QUESTIONS ABOUT A DIFFERENT DECISION, which
     is what makes them one shelf rather than three pages that happen to be
     comparisons: where a website lives, how the money reaches the bank, and
     where to sell online. Each names where every competitor beats us, none of
     them sells anything, and all three carry the date every figure was read.

     THE LABELS AND NOTES ARE THE ONES THEY CARRIED BEFORE D118 CUT THEM, recovered
     verbatim. A restored page that renames itself breaks every printed link and
     every bookmark twice over. */
  { href: '/websites/compare/', group: 'guides', icon: 'Scale', label: 'Where a website lives', note: 'Wix, Squarespace, WordPress and the rest' },
  { href: '/websites/getting-paid/', group: 'guides', icon: 'CreditCard', label: 'What it costs to be paid', note: 'Stripe, Square, PayPal, Clover, Venmo' },
  { href: '/websites/selling-online/', group: 'guides', icon: 'ShoppingBag', label: 'Where to sell online', note: 'Shopify, Etsy, WooCommerce, Instagram' },

  { href: '/main-street/', group: 'local', icon: 'Store', label: 'Main Street', note: 'New Bern, NC — in person' },
  { href: '/tools/', group: 'local', icon: 'Wrench', label: 'Tools you can buy', note: 'Built already — open one now' },
  { href: '/check/', group: 'local', icon: 'Calculator', label: 'Free check', note: 'Two numbers in, one about your business back' },
  { href: '/deadlines/', group: 'local', icon: 'CalendarClock', label: 'What is due', note: 'Craven County dates, free' },
  { href: '/ai-fit/', group: 'local', icon: 'Compass', label: 'AI Fit Assessment', note: 'Where AI fits, in writing' },
  { href: '/rescue/', group: 'local', icon: 'ClipboardCheck', label: 'Rescue audit', note: 'Software you already have, read' },

  { href: '/supply-chain/', group: 'industrial', icon: 'Boxes', label: 'For manufacturers', note: 'Factory tools to own, or the answer once' },
  { href: '/confirmation-outlook/', group: 'industrial', icon: 'Radar', label: 'Confirmation Outlook', note: 'A deployed service, at scale' },

  { href: '/work/', group: 'proof', icon: 'LayoutGrid', label: 'Everything I’ve built', note: 'The industrial work as well' },

  /* NO COUNT HERE, 2026-09-13. This note renders in the header and the phone
     sheet on EVERY page, so "Five trades before the software" sat in the home
     page's own navigation while its opening band said "Six domains that share
     nothing". A reader met both numbers without opening a second page. The list
     in src/lib/trades.js counts itself; nothing else counts. */
  { href: '/bio/', group: 'about', icon: 'User', label: 'Bio', note: 'The trades before the software' },
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
  websites: { label: 'Get a price', intent: 'quote' },
  /* THE GUIDES ASK FOR A CONVERSATION, NOT A PRICE, and that is the whole point
     of the group. A reader on one of these three is working out what their
     options cost, which is the moment before they know what they want built —
     "Get a price" there asks them to price something they have not chosen yet.
     `consult` is the free first conversation, which is what the pages themselves
     offer and the only honest next step from a sheet that sells nothing. */
  guides: { label: 'Talk it through', intent: 'consult' },
  local: { label: 'Start a project', intent: 'quote' },
  industrial: { label: 'Ask about your plant', intent: 'quote' },
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
  'work/': '/work/ is the index of every demo route and renders a card for each one. A menu row per tool would be thirty rows pointing into one page. A factory demo\'s manual, /work/<slug>/manual/, is reached from the Instruction Manual button in that tool\'s own header (D120).',
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

  /* 15 UNTIL 2026-09-20. D118 took the site from twenty-five destinations to fourteen, and a
     floor is a guard against an emptied list, never a policy on how many pages the site has. */
  if (DESTINATIONS.length < 10) {
    problems.push(`only ${DESTINATIONS.length} destinations; expected at least 10`);
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
