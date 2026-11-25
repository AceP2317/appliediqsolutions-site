// ============================================================================
// THE SHELF'S FACEPLATES — one per tool, and why they are JavaScript.
//
// THE PROBLEM THEY SOLVE. Nine tools shipped on one dark slate frame with one
// brass accent, and the operator's read was correct: side by side they looked
// slapped together next to Review Autopilot, which is light, carries the
// business's own name, and puts its headline numbers at the top. Nine identical
// dark boxes read as one thing rendered nine times rather than nine tools.
//
// LIGHT, TO MATCH THE SITE. The marketing surface went warm and light on
// 2026-08-24 and the tools stayed near-black, so a visitor met a designed page
// and then a hard cut to something that looked unfinished. The cut was
// deliberate — an industrial instrument should look like an instrument — but it
// was the wrong call for THESE nine, which are for a bar owner and a dentist
// rather than a planning floor. The seven supply-chain demos keep the dark
// look, and that is now the line: dark means industrial, light means yours.
//
// WHY THIS IS A .js MODULE AND NOT A STYLESHEET. The handover file — the copy a
// client keeps forever and opens from their own disk — carries no site CSS by
// design, because pulling global.css in would drag the whole marketing surface
// into their file. The islands style themselves inline. So a theme expressed as
// CSS custom properties would render correctly on the website and silently fall
// back to nothing in the delivered product, which is the copy that matters
// most. Values in a module travel with the code, and check-contrast.mjs can
// import this file directly and check every pair on every build.
//
// ── TWO ROUNDS OF THIS FAILED, AND THE SECOND FAILURE NAMES THE MECHANISM ────
//
// Round one gave each tool an accent and a business name. The operator: still
// copies of one thing with the color changed.
//
// Round two added five axes — display face, density, panel shape, masthead,
// readout — and he said it AGAIN. He was right both times, and the reason the
// second round did not land is worth writing down, because it is not obvious:
//
//   EVERY ONE OF THOSE FIVE AXES REACHES STRUCTURE. NOT ONE REACHES SURFACE.
//
// A person reads the surface first. Six of BASE's twelve colors were the
// marketing site's own tokens copied byte-for-byte — #faf7f2, #f4efe6, #e0d8ca
// and all three inks are literally global.css:15,16,18,23,24,25 — and pageFor
// wrote Inter and IBM Plex Mono as LITERALS, so every tool read in the same two
// voices however its palette moved. Strip the accent hue and nine tools were
// identical in ground, panel, rule, corner, prose face and figure face. That is
// also why they "blended into the website": they were painted in its palette.
//
// THE OLD FRAMING WAS THE CAUSE, so it is retired here rather than kept.
// It read: "one ground, one ink, one border color ... nine instruments from one
// workshop, not nine vendors." Aiming at one ground is what produced one tool
// nine times. The family bond is not the paint. It is the honesty furniture —
// the same Problems panel, the same WontDo panel, the same storage promise, the
// same printed arithmetic, the same refusal to model anything — and every
// engine in src/lib untouched. Those hold whatever the paper looks like.
//
// SO EACH FACEPLATE NOW CARRIES ITS OWN PAPER, in five groups:
//
//   STOCK    bg / surface / surfaceAlt / border / borderStrong and the three
//            inks — all eight were in BASE and are now overridable per tool
//   FIBER    texture / textureInk / textureAlpha / textureScale — what is
//            printed INTO the stock: rules, a grid, a hatch, speckle, grain
//   EDGE     radius / radiusSm / rule / ruleStrong / edgeBar — a receipt has
//            square corners at any density; a clinical list is soft at any
//   VOICE    face / body / data — the display face, the READING face and the
//            FIGURE face, three separate jobs that were one face and two
//            hardcoded literals
//   HEAD     how a panel title is drawn, which was one shape at 41 call sites
//
// ⚠️ KEEP THIS OBJECT FLAT. themeFor below and check-contrast.mjs both spread
// ONE level deep — { ...BASE, ...t }. A nested `paper: {...}` would REPLACE the
// base's paper wholesale instead of merging into it, so a faceplate setting only
// paper.bg would silently blank every sibling. That is the same shape as the
// `surface: 'card'` accident recorded below, and it is why every key here is
// top-level however much it wants grouping.
// ============================================================================

/* THE SHARED GROUND — now only what genuinely should not vary.
   These remain the site's own tokens by value, not by import: global.css is not
   reachable from the handover build, and a second copy that drifts is worse than
   a stated one. If the site's palette moves, move these and re-run
   `npm run contrast`, which reads BOTH.

   A FACEPLATE MAY OVERRIDE ANY OF THE PAPER COLORS. It may not override the
   three tone colors or their washes: the faceplate says which trade you are in,
   never how bad something is. */
export const BASE = {
  bg: '#faf7f2',          // oyster shell — the site's own page color
  surface: '#ffffff',     // panels lift off the ground rather than sinking into it
  surfaceAlt: '#f4efe6',  // table headers, sunken wells, the quiet rows
  border: '#e0d8ca',
  borderStrong: '#cdc2ae',
  text: '#17150f',        // wet cypress, never #000
  textSec: '#565045',
  textMuted: '#6f685b',

  /* THE THREE TONES, AND TWO OF THEM MOVED ON 2026-08-26.
     `good` was #2f7d4f and `warn` was #8a6a12. Measured against surfaceAlt
     #f4efe6 — the quiet row they are most often printed on — they scored
     4.40:1 and 4.42:1 against a 4.5:1 floor. Both were below AA, on all nine
     tools, for as long as the shelf has been light. Nothing reported it because
     the contrast gate checked five pairs per faceplate and not one of them was
     a tone color on a quiet row. They are 5.68 and 5.75 now, and the gate
     checks all three tones on four grounds each. */
  good: '#276a42',
  warn: '#75590d',
  bad:  '#b3261e',

  /* THE THREE WASHES, NAMED AT LAST. Eight tool files hand-rolled these as raw
     rgba() left over from the dark era — rgba(52,211,153,0.09) is a neon mint
     picked to GLOW on near-black, and on paper it is a smear. None was ever a
     token, so the contrast gate had never seen one. Shared across all nine on
     purpose, for the same reason as the tones above. */
  goodTint: '#eaf4ee',
  warnTint: '#faf1dc',
  badTint:  '#fdeceb',
};

/* THE FACES. All seven are already installed and declared dependencies —
   verified on disk 2026-08-26, so no new package is needed. Loading one costs a
   single import line in that tool's own .astro route.

   ⚠️ A face that fails to load FALLS BACK rather than vanishing, which is why
   every stack below ends in a real system family. The handover file embeds all
   three of a tool's faces as data URIs; see scripts/build-handover.mjs.

   SPACE GROTESK IS INSTALLED AND DELIBERATELY ABSENT. CLAUDE.md retired it from
   the marketing surface as a generated-design tell. Putting it back inside a
   tool would reintroduce the exact thing the site deleted, one route deeper
   where nobody would look. */
export const FACE = {
  serif:     "'Fraunces Variable','Fraunces',Georgia,'Times New Roman',serif",
  bookish:   "'Cormorant Garamond',Garamond,Georgia,'Times New Roman',serif",
  condensed: "'Oswald Variable','Oswald','Arial Narrow',system-ui,sans-serif",
  plain:     "'Rubik Variable','Rubik','Segoe UI',system-ui,sans-serif",
  geometric: "'Poppins','Century Gothic','Segoe UI',system-ui,sans-serif",
  sans:      "'Inter Variable','Inter','Segoe UI',system-ui,sans-serif",
  mono:      "'IBM Plex Mono','SF Mono','Consolas',monospace",
};

/* A FIGURE FACE MUST DRAW ITS DIGITS ON ONE SHARED WIDTH, or a column of money
   does not line up — and nothing anywhere renders an error when it does not.
   The column just drifts, and a tool whose numbers do not line up is a tool
   nobody trusts.

   MEASURED 2026-08-26, not assumed, by rendering 1111111111 against 8888888888
   at 40px in a real browser and comparing the two rendered widths:

     mono  (IBM Plex Mono)     same width with nothing switched on
     sans  (Inter)             drifts 84.8px — SAME WIDTH once tabular-nums is on
     plain (Rubik)             drifts 83.2px — SAME WIDTH once tabular-nums is on
     condensed (Oswald)        drifts 48.4px — AND tabular-nums DOES NOT FIX IT
     geometric (Poppins)       drifts 112.4px — tabular-nums does not fix it
     bookish (Cormorant)       same width with tabular-nums, but its figures are
                               old-style, hanging below the baseline, so it stays
                               a display face

   Oswald was going to be storm-haul-out's figure face on the strength of having
   been drawn for signage. It is not tabular and cannot be made so. That tool
   keeps Oswald for its one big hero number — a single figure, never a column —
   and takes Inter for everything that sits in a row.

   The three below are the only legal `data` values and check-contrast.mjs
   asserts it, because a rule that lives only in a comment gets missed. Anything
   taking `sans` or `plain` as its figure face NEEDS fontVariantNumeric:
   'tabular-nums' set in the kit — see shelf.jsx's tdN. */
export const DATA_FACES = new Set(['mono', 'sans', 'plain']);

/* DENSITY. Three steps, and the difference is legible at a glance: a bar count
   is a stock sheet you scan down, a recall sheet is a list you read aloud to
   somebody on the phone. Consumed as custom properties by the kit's chrome.
   `pagePad` is new — the page's own margin is part of how dense a sheet feels,
   and it was one hardcoded value for all nine. */
export const DENSITY = {
  tight:   { pad: 12, gap: 10, row: '5px 6px', label: 10,   body: 13,   lead: 1.45, pagePad: '16px 14px 56px' },
  regular: { pad: 16, gap: 14, row: '6px 6px', label: 10.5, body: 13.5, lead: 1.55, pagePad: '20px 18px 64px' },
  airy:    { pad: 20, gap: 18, row: '9px 8px', label: 11,   body: 14,   lead: 1.7,  pagePad: '28px 22px 72px' },
};

/**
 * One faceplate per tool. Every key is top-level — see the FLAT warning above.
 *
 *   STOCK   bg surface surfaceAlt border borderStrong text textSec textMuted
 *   ACCENT  accent accentInk tint ring
 *   FIBER   texture textureInk textureAlpha textureScale
 *   EDGE    radius radiusSm rule ruleStrong edgeBar
 *   VOICE   face (display) · body (reading) · data (figures, see DATA_FACES)
 *   SHAPE   density panel masthead readout head
 *   WORLD   business trade
 *
 * ⚠️ `panel` IS CALLED `panel` AND NOT `surface` FOR A MEASURED REASON: BASE
 * carries `surface` as the panel COLOR, and a per-tool `surface: 'card'`
 * silently overwrote it. `--aiq-surface: card` is not a color, so the browser
 * dropped the declaration and every panel lost its background — while the build,
 * the smoke test and the contrast gate all stayed green, because none of them
 * looks at a rendered pixel. Found by opening the page.
 *
 * THE PAPER IS PICKED FROM THE DOCUMENT THE TOOL REPLACES, never from a color
 * wheel. A tip-out is a check off a manila pad. A crew share is a settlement in
 * a ledger book. A marina bill is an invoice on watermarked bond. A storm plan
 * is a board on a wall. That is what stops this being a palette exercise, and it
 * is the one part of this file arithmetic cannot check.
 */
export const THEMES = {
  /* A SPIRAL DAY BOOK on goldenrod, which is the paper every festival vendor
     packet in the county is printed on and the most saturated ground here by a
     long way. Thirteen quiet stocks and one that is frankly a color.

     Its fiber is the binding — rings down one margin, the only hollow mark on
     the shelf — and its masthead is the only one with no rule and no fill in
     it, indented past those rings the way a hand starts past a spiral. Forest
     green ink on goldenrod, which no other faceplate goes near. */
  'event-day': {
    face: 'geometric', body: 'sans', data: 'sans',
    density: 'airy', panel: 'clean', masthead: 'daybook', readout: 'hero', head: 'caps',
    bg: '#f6e9c6', surface: '#fdf8ea', surfaceAlt: '#eddfb8',
    border: '#d8c894', borderStrong: '#b3a065',
    text: '#1a1508', textSec: '#57492a', textMuted: '#665a35',
    accent: '#1f4d2c', accentInk: '#ffffff', tint: '#eadfb4', ring: '#c9b878',
    texture: 'punch', textureInk: '#8a7434', textureAlpha: 0.16, textureScale: 26,
    radius: 4, radiusSm: 3, rule: 1, ruleStrong: 2, edgeBar: null,
    business: 'Slipway Smoke', trade: 'a barbecue truck',
  },

  /* A REPAIR ORDER on green security stock, printed in plum carbon — both of
     which are real and neither of which is on this shelf anywhere else.

     ITS FIBER IS THE ONLY CURVE HERE. Twelve papers made of straight lines,
     orthogonal or diagonal, and one guilloche wave — which reads as a different
     KIND of printing rather than a different arrangement of the same one. The
     ground is a cooler, darker green than the route sheet's olive, and the two
     sit far enough apart that neither has to be compared to be told.

     Mono display, which only the tip-out otherwise uses, because a repair order
     comes off an impact printer. */
  'book-time': {
    face: 'mono', body: 'sans', data: 'mono',
    density: 'tight', panel: 'board', masthead: 'repairorder', readout: 'hero', head: 'stamp',
    bg: '#e4ece6', surface: '#f4f8f5', surfaceAlt: '#d8e2da',
    border: '#b9c8be', borderStrong: '#93a69a',
    text: '#101812', textSec: '#425046', textMuted: '#4f5e54',
    accent: '#5f2a5c', accentInk: '#ffffff', tint: '#dbe8de', ring: '#b2a3b4',
    texture: 'wave', textureInk: '#3c5545', textureAlpha: 0.08, textureScale: 24,
    radius: 0, radiusSm: 0, rule: 1, ruleStrong: 3, edgeBar: null,
    business: 'Neuse Bend Auto', trade: 'a two-bay repair shop',
  },

  /* A ROUTE SHEET off a clipboard in a truck — olive field stock with a broken
     rule under every stop to tick down.

     THE ONLY FRANKLY YELLOW-GREEN GROUND. The schedule check is the nearest
     thing and it is a cool copier white with a green cast; this is a printed
     field sheet, several steps darker and warmer, and it is the only paper here
     that looks like it has been outside. Its accent is a surveyor's orange,
     which nothing else on the shelf goes near. */
  'property-round': {
    face: 'plain', body: 'sans', data: 'mono',
    density: 'regular', panel: 'card', masthead: 'clipboard', readout: 'compare', head: 'tab',
    bg: '#eff0df', surface: '#f9f9ef', surfaceAlt: '#e6e8d4',
    border: '#cdd0b6', borderStrong: '#a6ab8b',
    text: '#191a10', textSec: '#4d5040', textMuted: '#5d604e',
    accent: '#a33b12', accentInk: '#ffffff', tint: '#e7e9cf', ring: '#c2c79f',
    texture: 'dash', textureInk: '#5b5f3e', textureAlpha: 0.09, textureScale: 20,
    radius: 2, radiusSm: 1, rule: 1, ruleStrong: 2, edgeBar: null,
    business: 'Ninth Street Grounds', trade: 'a two-man lawn crew',
  },

  /* A SETTLEMENT CARD off the counter of a salon — warm card stock with a red
     cast, ruled into money columns before anything is written on it.

     THE ONLY GROUND HERE WITH A RED CAST. The warm papers on this shelf are all
     yellow-warm (kraft, ledger book, carbon pad); the cool ones are blue or
     gray. This one sits between them and belongs to neither, which is what makes
     it recognizable at a glance rather than after a comparison. It is also the
     only masthead drawn as a FILLED BAND instead of with rules. */
  'chair-split': {
    face: 'bookish', body: 'sans', data: 'sans',
    density: 'airy', panel: 'clean', masthead: 'cardstock', readout: 'strip', head: 'label',
    bg: '#f6eeea', surface: '#fdf9f7', surfaceAlt: '#efe4df',
    border: '#e0cec7', borderStrong: '#c4a99f',
    text: '#1e1614', textSec: '#5a4a45', textMuted: '#6b5a54',
    accent: '#7d2d2d', accentInk: '#ffffff', tint: '#f2e2dd', ring: '#d9b4a9',
    texture: 'columns', textureInk: '#7a5a52', textureAlpha: 0.07, textureScale: 26,
    radius: 3, radiusSm: 2, rule: 1, ruleStrong: 2, edgeBar: null,
    business: 'The Bight Chair', trade: 'a salon on the corner',
  },

  /* A DUPLICATE WORK ORDER off an estimate pad — the pale blue NCR form every
     trade in the county buys by the box, with a dashed perforation down the
     right of the writing area where the customer's copy tears off.

     THE STOCK IS THE DISTINCT PART, which is the whole lesson of L-205. Eight of
     the nine papers here are warm; the two that are not are a desaturated
     blue-gray. This one is the only frankly BLUE ground on the shelf and the
     darkest stock of the ten, so it reads as a heavier form before a single
     shape is compared. The fiber carries the only broken vertical line here.

     One ink, because a pre-printed form is printed in one. The color is spent
     entirely on the total, which is the one figure a customer reads. */
  'job-quote': {
    face: 'condensed', body: 'sans', data: 'mono',
    density: 'tight', panel: 'ruled', masthead: 'workorder', readout: 'total', head: 'caps',
    bg: '#eaeef3', surface: '#f7f9fb', surfaceAlt: '#e3e9f0',
    border: '#c3ccd8', borderStrong: '#9aa7b7',
    text: '#141a21', textSec: '#48525f', textMuted: '#565f6b',
    accent: '#1f4d7a', accentInk: '#ffffff', tint: '#dde7f2', ring: '#8fb0cf',
    texture: 'perf', textureInk: '#2b3a4d', textureAlpha: 0.07, textureScale: 22,
    radius: 0, radiusSm: 0, rule: 1, ruleStrong: 2, edgeBar: null,
    business: 'Bight Creek Mechanical', trade: 'a heating and air shop',
  },

  /* A REGISTER SLIP off a manila check pad. Square, mono end to end, speckled
     kraft stock. The only tool set in one single face throughout. */
  'tip-out-sheet': {
    face: 'mono', body: 'mono', data: 'mono',
    density: 'tight', panel: 'ruled', masthead: 'check', readout: 'total', head: 'dotted',
    bg: '#f4eee1', surface: '#fffdf7', surfaceAlt: '#f6f0e3',
    border: '#ddd2bb', borderStrong: '#c3b69b',
    text: '#1a1712', textSec: '#544c3d', textMuted: '#635b4b',
    accent: '#8a4e13', accentInk: '#fffdf7', tint: '#f9edd9', ring: '#d8b784',
    texture: 'kraft', textureInk: '#8a7550', textureAlpha: 0.10, textureScale: 9,
    radius: 0, radiusSm: 0, rule: 1, ruleStrong: 2, edgeBar: null,
    business: 'The Salt Line', trade: 'a bar on the waterfront',
  },

  /* THE CARBONLESS SECOND COPY off a count pad — pale yellow, ruled for the
     count, with a tabbed head like the ones printed on the form itself. */
  'bar-count-sheet': {
    face: 'sans', body: 'plain', data: 'mono',
    density: 'tight', panel: 'card', masthead: 'stocksheet', readout: 'strip', head: 'tab',
    bg: '#f7f2e0', surface: '#fffef6', surfaceAlt: '#f1ead4',
    border: '#ded5b7', borderStrong: '#c3b893',
    text: '#191510', textSec: '#544c3a', textMuted: '#635b48',
    accent: '#9c3a25', accentInk: '#fffef6', tint: '#faeae4', ring: '#dcae9d',
    texture: 'ledger', textureInk: '#a3986f', textureAlpha: 0.16, textureScale: 22,
    radius: 2, radiusSm: 2, rule: 1, ruleStrong: 2, edgeBar: null,
    business: 'The Salt Line', trade: 'the back bar, counted Sunday night',
  },

  /* A ROSTER OFF THE OFFICE COPIER — cool copier white on the quadrille grid a
     schedule form is ruled with. Keeps today's plain label head, so that shape
     does not vanish from the shelf entirely. */
  'schedule-cost-check': {
    face: 'sans', body: 'sans', data: 'sans',
    density: 'regular', panel: 'card', masthead: 'roster', readout: 'strip', head: 'label',
    bg: '#f1f4ee', surface: '#fbfdf9', surfaceAlt: '#e8ece2',
    border: '#d6dbcc', borderStrong: '#b8c0aa',
    text: '#15170f', textSec: '#4d5340', textMuted: '#5a6049',
    accent: '#57621f', accentInk: '#fbfdf9', tint: '#eef1e0', ring: '#bbc593',
    texture: 'grid', textureInk: '#8b9673', textureAlpha: 0.14, textureScale: 24,
    radius: 3, radiusSm: 3, rule: 1, ruleStrong: 2, edgeBar: null,
    business: 'The Salt Line', trade: 'next week, before it is posted',
  },

  /* AN AGED LEDGER BOOK. Cream stock, accounting rules, one vertical margin line
     near the spine, and the only serif reading face on the shelf. */
  'crew-share': {
    face: 'serif', body: 'serif', data: 'mono',
    density: 'regular', panel: 'ruled', masthead: 'ledger', readout: 'total', head: 'rule',
    bg: '#f6f1e4', surface: '#fdfaf0', surfaceAlt: '#eee8d8',
    border: '#d8cfb8', borderStrong: '#bcb191',
    text: '#141a17', textSec: '#48524c', textMuted: '#555f58',
    accent: '#1a6053', accentInk: '#fdfaf0', tint: '#e5f0ec', ring: '#93c2b7',
    texture: 'book', textureInk: '#1f6b5c', textureAlpha: 0.10, textureScale: 26,
    radius: 0, radiusSm: 2, rule: 1, ruleStrong: 3, edgeBar: null,
    business: 'F/V Wrackline', trade: 'a boat settling up after a trip',
  },

  /* AN INVOICE ON WATERMARKED BOND. Cool, hairlines only, nothing rounded, and
     the one tool whose panel titles carry no accent at all — an invoice's
     section headings are not colored. */
  'marina-storage': {
    face: 'plain', body: 'plain', data: 'sans',
    density: 'airy', panel: 'clean', masthead: 'letterhead', readout: 'strip', head: 'caps',
    bg: '#f1f5f6', surface: '#ffffff', surfaceAlt: '#e7edef',
    border: '#d0dade', borderStrong: '#adbcc2',
    text: '#101619', textSec: '#455055', textMuted: '#576269',
    accent: '#1a606d', accentInk: '#ffffff', tint: '#e4f0f2', ring: '#96c1c9',
    texture: 'laid', textureInk: '#6f8f97', textureAlpha: 0.07, textureScale: 4,
    radius: 0, radiusSm: 0, rule: 1, ruleStrong: 1, edgeBar: null,
    business: 'Marker Nine Boatyard', trade: 'storage billed by the foot',
  },

  /* AN OPERATIONS BOARD ON A WALL. The ONE tool with no texture at all, and that
     is what makes the other eight's fiber read as a choice rather than a
     default. Heaviest rules on the shelf, a signal-red bar down the left edge.

     ITS FIGURE FACE IS NOT OSWALD, and that is measured rather than chosen —
     see DATA_FACES above. Oswald draws the hero number, which is one figure and
     wants the signage look; Inter draws every column, because Oswald's digits
     drift 48px over ten characters and no OpenType feature fixes it. */
  'storm-haul-out': {
    face: 'condensed', body: 'sans', data: 'sans',
    density: 'tight', panel: 'board', masthead: 'board', readout: 'hero', head: 'fill',
    bg: '#edeff1', surface: '#ffffff', surfaceAlt: '#e1e5e8',
    border: '#c6cbd0', borderStrong: '#9fa7ae',
    text: '#111417', textSec: '#434a51', textMuted: '#545c63',
    accent: '#a83415', accentInk: '#ffffff', tint: '#fbe7e0', ring: '#e5a48a',
    texture: 'none', textureInk: '#000000', textureAlpha: 0, textureScale: 0,
    radius: 0, radiusSm: 0, rule: 2, ruleStrong: 4, edgeBar: '#a83415',
    business: 'Marker Nine Boatyard', trade: 'the yard, with a storm coming',
  },

  /* GREENBAR CONTINUOUS FORM off a line printer — the banded statement paper a
     carrier's remittance actually arrives on. The bands are the whole identity
     and no other tool has anything like them. */
  'commission-check': {
    face: 'geometric', body: 'sans', data: 'mono',
    density: 'regular', panel: 'card', masthead: 'statement', readout: 'compare', head: 'stamp',
    bg: '#f0f2f7', surface: '#ffffff', surfaceAlt: '#e7eaf3',
    border: '#d1d7e6', borderStrong: '#aeb7d0',
    text: '#111320', textSec: '#464b60', textMuted: '#565b70',
    accent: '#39438a', accentInk: '#ffffff', tint: '#e9ecf7', ring: '#a3acd6',
    texture: 'bands', textureInk: '#3f4a8f', textureAlpha: 0.05, textureScale: 22,
    radius: 2, radiusSm: 2, rule: 1, ruleStrong: 2, edgeBar: null,
    business: 'Wrackline & Co', trade: 'an agency checking a carrier statement',
  },

  /* THE ONE ROUND-CORNERED PAPER ON THE SHELF, deliberately. Eight square sheets
     and one soft card: a clinical list is calm, and this tool says so with its
     geometry rather than with its words.

     ⚠️ textureInk MUST STAY #000000 HERE. The `grain` recipe is an feTurbulence
     SVG and renders achromatic noise; a colored ink would make
     compositeGround() compute a lighter ground than the browser actually paints,
     and a gate reporting a nicer number than reality is worse than no gate.
     check-contrast.mjs refuses the build if this drifts. */
  'recall-sheet': {
    face: 'bookish', body: 'plain', data: 'sans',
    density: 'airy', panel: 'clean', masthead: 'clinical', readout: 'hero', head: 'rule',
    bg: '#f2f4f7', surface: '#ffffff', surfaceAlt: '#e9edf2',
    border: '#d3dae3', borderStrong: '#b0bbc9',
    text: '#12161c', textSec: '#454e5b', textMuted: '#555f6d',
    accent: '#34567e', accentInk: '#ffffff', tint: '#e9eff6', ring: '#9fb7d1',
    texture: 'grain', textureInk: '#000000', textureAlpha: 0.045, textureScale: 140,
    /* MEASURED 2026-08-26: on this tool `radius` currently paints on NOTHING, and
       that is not a defect. A `clean` panel draws no box, so the only elements
       carrying the large corner are the Problems panel and the strip readout,
       and this tool has neither on its sample data. The soft feel is delivered
       entirely by radiusSm across 51 inputs and buttons. Recorded so nobody
       "fixes" an unused value by flattening it — it is the corner the alarm
       panel takes the day this tool has something to refuse. */
    radius: 14, radiusSm: 10, rule: 1, ruleStrong: 1, edgeBar: null,
    business: 'Tidewater Family Dental', trade: 'who is past due for a visit',
  },

  /* A PRINTED APPOINTMENT DAY SHEET — the page a front desk runs off every
     morning and writes on all day.

     IT SITS NEXT TO recall-sheet ON PURPOSE, because they are the two clinical
     tools and the paper has to tell them apart at a glance. A recall list is a
     soft card somebody reads down while holding a phone: cool white, a 14px
     corner, grain, a blue accent. A day sheet is the opposite object — a laser
     printout with square corners, a ruled time grid, and a condensed form title
     that was set to fit rather than to look like anything.

     THE ONLY ACHROMATIC ACCENT ON THE SHELF, and that is the decision rather
     than a fallback. All fifteen others are saturated; a day sheet has no color
     on it at all until somebody marks it, so graphite is what the document
     actually looks like. Picking a hue here would have been the color-wheel
     move this file exists to refuse. */
  'no-show-cost': {
    face: 'condensed', body: 'plain', data: 'sans',
    density: 'tight', panel: 'ruled', masthead: 'daysheet', readout: 'strip', head: 'caps',
    bg: '#f3f3ef', surface: '#fbfbf8', surfaceAlt: '#e7e7e1',
    border: '#d5d5cc', borderStrong: '#a5a599',
    text: '#161613', textSec: '#4a4a44', textMuted: '#5a5a53',
    accent: '#39424a', accentInk: '#ffffff', tint: '#e8ebee', ring: '#a8b3bd',
    /* The vertical at 58px is the times column, and the `daysheet` masthead is
       indented to land against it. Change one and the other stops lining up. */
    texture: 'slots', textureInk: '#2b2b26', textureAlpha: 0.1, textureScale: 22,
    radius: 2, radiusSm: 2, rule: 1, ruleStrong: 2, edgeBar: null,
    business: 'Bight Street Physical Therapy', trade: 'the visits that did not happen',
  },

  /* A MONTH-END PRODUCTION REPORT off a line printer, on security stock.

     THREE CLINICAL TOOLS NOW SIT NEXT TO EACH OTHER AND ALL THREE HAD TO READ AS
     DIFFERENT DOCUMENTS. A recall list is a soft card read down while holding a
     phone. A day sheet is a laser printout with a time grid. This is the third
     thing entirely: a run off a line printer, where the title is set in the same
     mechanism as the columns below it and the stock carries a diagonal security
     tint so a photocopy is visibly a photocopy.

     `mono` IS THE DISPLAY FACE, NOT JUST THE FIGURE FACE, and that is what makes
     the `report` masthead's leader dots read as printed rather than styled. It
     also keeps check-handover.mjs:249 satisfied, which asserts the tool's h1
     computes to whatever this line declares. */
  'provider-split': {
    face: 'mono', body: 'plain', data: 'mono',
    density: 'regular', panel: 'card', masthead: 'report', readout: 'total', head: 'stamp',
    bg: '#f5f4f0', surface: '#fcfcf9', surfaceAlt: '#ebe9e2',
    border: '#d8d5ca', borderStrong: '#a8a598',
    text: '#17160f', textSec: '#4b483c', textMuted: '#5a5747',
    accent: '#6e2639', accentInk: '#ffffff', tint: '#f0e2e6', ring: '#c09aa4',
    /* The tint is GREEN and the accent is not, which is true of the document:
       the security print is a pale green wash and the only other color on a
       month-end report is whatever got stamped on the total. */
    texture: 'hatch', textureInk: '#2f5a3c', textureAlpha: 0.055, textureScale: 9,
    radius: 3, radiusSm: 2, rule: 1, ruleStrong: 2, edgeBar: null,
    business: 'Cutter Point Dental', trade: 'what each provider is owed',
  },

  /* A REMITTANCE ADVICE — what a payer sends WITH the money, on security stock.
     The fourth clinical document in a row, and the one that came from outside
     the practice rather than off its own printer, which is why it is the only
     one of the four with a color that is not the building's.

     PALE LILAC IS A REAL FORM STOCK and it is on this shelf nowhere else. Every
     other ground here is a cream, a gray, a green or a blue; a carbonless
     remittance copy is the one document that is routinely neither.

     `guilloche` AT A LOW ALPHA, NOT A HIGH ONE. The rosette on a real draft is
     nearly invisible until you copy it — that is the whole point of the print,
     and turning it up would make it decoration. */
  'claim-aging': {
    face: 'condensed', body: 'plain', data: 'mono',
    density: 'tight', panel: 'card', masthead: 'advice', readout: 'compare', head: 'tab',
    bg: '#f1eef5', surface: '#fbf9fd', surfaceAlt: '#e6e1ee',
    border: '#d6cfe0', borderStrong: '#a59bb9',
    text: '#171320', textSec: '#48415a', textMuted: '#575070',
    accent: '#4a2d75', accentInk: '#ffffff', tint: '#ebe4f5', ring: '#b4a3d1',
    /* 0.075, RAISED FROM 0.05 AFTER LOOKING AT IT. A rosette that is invisible
       on screen is not restraint, it is a texture doing nothing — the stock has
       to read as printed stock. Still low enough that it is a ground rather than
       a pattern, which is the line this recipe has to walk. */
    texture: 'guilloche', textureInk: '#4a2d75', textureAlpha: 0.075, textureScale: 7,
    radius: 2, radiusSm: 2, rule: 1, ruleStrong: 2, edgeBar: null,
    business: 'Harbourside Family Medicine', trade: 'what each payer still owes',
  },

  /* A CLASSROOM SIGN-IN SHEET on colored cardstock, filled in by twenty people
     over five days and folded once to fit in a bag.

     PALE ROSE, AND NOTHING ELSE ON THIS SHELF IS PINK. Eighteen faceplates in,
     the cream and gray and blue and green grounds are crowded, and reaching for
     a nineteenth shade of off-white would have been the point at which the
     paper stopped meaning anything. Bright cardstock is what a childcare center
     actually prints its weekly sheets on, precisely so a parent can find this
     week's from across the room.

     THE ONLY AIRY DENSITY WITH A `clean` PANEL, because a sheet somebody writes
     on by hand has rows sized for handwriting rather than for reading. */
  'tuition-sheet': {
    face: 'plain', body: 'sans', data: 'sans',
    density: 'airy', panel: 'clean', masthead: 'signin', readout: 'hero', head: 'label',
    bg: '#f9e9ec', surface: '#fefafb', surfaceAlt: '#f0dbdf',
    border: '#e3cbd1', borderStrong: '#b9959e',
    text: '#1c1216', textSec: '#54444a', textMuted: '#655259',
    /* A DARK CHOCOLATE INK rather than a hue picked to sit against the rose.
       What is written on one of these is whatever pen was on the clipboard, and
       it is never the color of the paper's own family. */
    accent: '#4a3324', accentInk: '#ffffff', tint: '#f1e4dd', ring: '#c4a894',
    texture: 'fold', textureInk: '#4a3324', textureAlpha: 0.07, textureScale: 26,
    radius: 6, radiusSm: 4, rule: 1, ruleStrong: 2, edgeBar: null,
    business: 'Cypress Landing Early Learning', trade: 'what each family owes this week',
  },

  /* A SHEET OF MARKDOWN STICKERS, apricot, of the kind that gets run off on a
     Friday and used up by Sunday.

     THE ONE GROUND ON THIS SHELF THAT IS NOT TRYING TO BE PAPER. Everything else
     here is a stock somebody chose for reading: creams, grays, a blue, a green,
     a lilac, a rose. A markdown label is chosen to be SEEN across a shop from
     the door, and pretending otherwise would have made it the twentieth
     off-white in a row.

     THE HEAVIEST `ruleStrong` ANYWHERE HERE, at 3. A sticker has a printed
     border thick enough to survive being peeled, and that weight is the
     difference between this and any other warm ground. */
  'markdown-margin': {
    face: 'condensed', body: 'plain', data: 'sans',
    density: 'tight', panel: 'card', masthead: 'stickers', readout: 'strip', head: 'fill',
    bg: '#fceada', surface: '#fffaf4', surfaceAlt: '#f4d9bd',
    border: '#e6c9a8', borderStrong: '#b9946c',
    text: '#1e1409', textSec: '#57452f', textMuted: '#67543b',
    accent: '#a3132b', accentInk: '#ffffff', tint: '#f7dcd9', ring: '#d99b96',
    /* ALPHA 0.10, NOT 0.16, AND THE GATE SET IT. At 0.16 the die-cut printed
       this ground down to #e9d3bb, and the site's semantic healthy green landed
       at 4.49:1 against a 4.5 floor — one hundredth under, on a pair nobody
       would have looked at, because it is a color this faceplate never chooses
       and only inherits. check-contrast.mjs reads the COMPOSITED ground rather
       than the declared one, which is the only reason it was visible at all. */
    texture: 'diecut', textureInk: '#8a6a45', textureAlpha: 0.1, textureScale: 24,
    radius: 3, radiusSm: 2, rule: 1, ruleStrong: 3, edgeBar: null,
    business: 'Tern Street Goods', trade: 'what the sale does to the margin',
  },

  /* A CONSIGNOR CONTRACT CARD — manila, filed in a box, pulled out by what is
     written in the top corner.

     A DEEPER MANILA THAN ANY OTHER WARM GROUND HERE, deliberately. The creams on
     this shelf are all papers you READ on; card stock is a paper you HANDLE, and
     it is heavier and grayer for exactly that reason. That weight is the
     difference, not the hue.

     `serif` DISPLAY WITH A SANS BODY, which no other faceplate pairs. A contract
     card's printed title is set in a serif because the form was typeset once and
     used for years; what gets written on it afterwards is not. */
  consignment: {
    face: 'serif', body: 'sans', data: 'mono',
    density: 'regular', panel: 'ruled', masthead: 'contractcard', readout: 'total', head: 'tab',
    bg: '#f7ecd4', surface: '#fdf8ec', surfaceAlt: '#ebdcbb',
    border: '#dbcaa4', borderStrong: '#a8946c',
    text: '#191408', textSec: '#4e442c', textMuted: '#5d5238',
    accent: '#2d4739', accentInk: '#ffffff', tint: '#e3e9e0', ring: '#9db3a3',
    /* A DEEPER MANILA WAS TRIED FIRST AND THE GATE REFUSED IT. `#eddfc0` at
       alpha 0.13 printed down to `#dcceaf`, and ALL THREE semantic figure
       colors — healthy, caution and alarm — landed between 4.18 and 4.23
       against a 4.5 floor.

       THAT IS A CEILING ON EVERY GROUND ON THIS SHELF, not a fact about manila.
       Those three are fixed site tokens a faceplate inherits and never chooses,
       so how dark a paper may PRINT is set by them rather than by taste. It is
       also why nineteen grounds here are all light: the constraint is real, and
       the room to differentiate is in hue and in fiber rather than in value. */
    texture: 'ruledcard', textureInk: '#6b5c3a', textureAlpha: 0.08, textureScale: 22,
    radius: 2, radiusSm: 2, rule: 1, ruleStrong: 2, edgeBar: null,
    business: 'Second Berth Consignment', trade: 'what each consignor is owed',
  },

  /* A TILL TAPE AND THE DEPOSIT SLIP IT GETS STAPLED TO. Thermal paper that has
     aged to a gray-green, ruled into the deposit slip's count-and-amount
     columns.

     THE ONLY FACEPLATE WHERE THE FIGURE FACE AND THE READING FACE ARE THE SAME
     MONOSPACE. Everything a till prints comes out of one mechanism at one
     width, prose and figures alike, and a receipt that set its words in a
     different face from its numbers would not be a receipt. `condensed` for the
     display keeps the headings tight the way a roll's own headers are. */
  'drawer-count': {
    face: 'condensed', body: 'mono', data: 'mono',
    density: 'tight', panel: 'ruled', masthead: 'tilltape', readout: 'strip', head: 'stamp',
    bg: '#eef0ea', surface: '#f9faf6', surfaceAlt: '#e0e3d9',
    border: '#d0d4c6', borderStrong: '#9aa08c',
    text: '#141610', textSec: '#454a3c', textMuted: '#545a4a',
    accent: '#3f5a2e', accentInk: '#ffffff', tint: '#e6ecdd', ring: '#a8b899',
    texture: 'denomrows', textureInk: '#4c5340', textureAlpha: 0.075, textureScale: 21,
    radius: 2, radiusSm: 2, rule: 1, ruleStrong: 2, edgeBar: null,
    business: 'Harbour Market', trade: 'what the till says against the drawer',
  },

  /* A HOUSEKEEPING CARD left on the bed — soft card stock, a column of empty
     squares, and the biggest corner radius on the shelf.

     THE HUE WHEEL IS EFFECTIVELY FULL AT THIS POINT and pretending otherwise
     would be the color-wheel move this file exists to refuse. So the identity
     here is carried by the FIBER and the EDGE rather than the ground: the
     tickbox is the only closed shape printed on any paper here, and a 12px
     corner on an airy grid is a card in a room rather than a form on a desk.

     `bookish` DISPLAY WITH A SANS BODY, which no other faceplate pairs. A small
     house prints its card in a serif because it is the same face as everything
     else it puts in a room; what a housekeeper writes on it is not. */
  'turn-cost': {
    face: 'bookish', body: 'sans', data: 'mono',
    density: 'airy', panel: 'clean', masthead: 'housecard', readout: 'hero', head: 'rule',
    bg: '#f2f6f4', surface: '#ffffff', surfaceAlt: '#e6ede9',
    border: '#d3ded8', borderStrong: '#a3b3ab',
    text: '#111815', textSec: '#42504a', textMuted: '#516059',
    accent: '#1d5b4a', accentInk: '#ffffff', tint: '#e2efe9', ring: '#9cc4b5',
    texture: 'tickboxes', textureInk: '#3a5a52', textureAlpha: 0.065, textureScale: 26,
    radius: 12, radiusSm: 8, rule: 1, ruleStrong: 1, edgeBar: null,
    business: 'Anchor Lane Rooms', trade: 'what a turn costs, and per night',
  },

  /* A GUEST FOLIO on orchid — the itemized bill slid under the door on the last
     morning, and specifically the GUEST'S copy of a duplicate set, which is
     always the tinted sheet. Orchid is a real carbonless stock name, and it is
     the only magenta ground here: the two nearest are a lilac remittance and a
     rose sign-in sheet, both a long way round the wheel and both barely tinted,
     so this one is held apart by CHROMA as much as by hue. Reaching for another
     off-white would have been the move the recipe says stops paper meaning
     anything.

     IT SITS BESIDE turn-cost AND MUST NOT LOOK LIKE IT. They are the two
     accommodation tools and one FEEDS the other — the turn cost this sheet
     subtracts is the figure that one produces — so meeting both in one session
     is the ordinary case rather than the rare one. That one is a soft mint
     housekeeping card, bookish, 12px corners, an airy grid, a hero readout.
     This is a square-cornered orchid bill in Fraunces at a regular rhythm with
     a four-cell strip. They share the trade and nothing else.

     PRINTED IN ONE NEAR-BLACK INK, because a duplicate set is. The color on
     this faceplate is spent on nothing at all, which is what a bill looks like.

     THE READOUT IS A STRIP AND NOT THE RECEIPT FOOT THE PAPER WOULD SUGGEST,
     and the argument is arithmetic rather than taste. A foot totals the lines
     above it. The two things this tool exists to say are not lines on that
     total: the cleaning gap is a COMPARISON between two figures, and the
     occupancy tax a platform remitted never enters the money at all. Setting
     them in a column that foots would state something false about both.

     MEASURED, not assumed: the printed ground composites to #ecd8e6 and the
     three tone figures land at 4.81, 4.87 and 4.83 against the 4.5 floor. The
     alpha is held at 0.07 for that reason — this stock has less headroom than a
     light ground looks like it has, which is the ceiling the recipe records
     being walked into twice.

     AND THE FIRST INK WAS TOO PALE TO CARRY THE FIBER. It was #7a4f6b, a muted
     plum a few steps off the ground itself, and the captured tile came back
     with the rules faintly visible and the leader dots gone entirely — an
     identity that clears every gate and is not on the page. The ink went darker
     rather than the alpha going up, because the alpha is what the contrast
     ceiling actually reads and the ink is what the dots are drawn in. The tones
     moved from 4.91/4.96/4.93 to the figures above to pay for it. */
  'night-net': {
    face: 'serif', body: 'plain', data: 'mono',
    density: 'regular', panel: 'ruled', masthead: 'folio', readout: 'strip', head: 'caps',
    bg: '#f7e4f1', surface: '#fdf7fb', surfaceAlt: '#efd6e7',
    border: '#e0c2d5', borderStrong: '#c39cb4',
    text: '#1a1016', textSec: '#54414c', textMuted: '#65505c',
    accent: '#2b3160', accentInk: '#ffffff', tint: '#f0dfea', ring: '#c9a4bd',
    texture: 'folio', textureInk: '#5f3552', textureAlpha: 0.07, textureScale: 22,
    radius: 2, radiusSm: 2, rule: 1, ruleStrong: 2, edgeBar: null,
    business: 'The Bight House', trade: 'what a night actually keeps',
  },

  /* A MONTHLY OWNER STATEMENT — what a managing agent posts to each owner with
     the money, and specifically the sheet the payment advice tears off the foot
     of.

     THE ONLY TEAL STOCK ON THE SHELF, and it is the one hue actually left. The
     creams, the grays, the blues, the greens, a lilac, a rose, an orchid and an
     apricot are all spoken for by now; measured across every ground here, the
     cyan quarter of the wheel is empty. The nearest neighbors are a
     watermarked bond at #f1f5f6 and a housekeeping card at #f2f6f4, and both
     are near-achromatic — five or six points of separation between their red and
     blue channels. This one runs twelve, so it is held apart by CHROMA rather
     than by a shade of pale, which is the move the recipe says stops paper
     meaning anything when you reach for a twentieth off-white instead.

     MEASURED BEFORE IT WAS WRITTEN, not after: the printed ground composites to
     #d4e3e2 and the three inherited tone figures land at 4.92, 4.98 and 4.94
     against the 4.5 floor. That is the pair the ceiling has bitten on twice, and
     it is why the fiber is held at 0.085 — the tear ticks get their weight from
     a darker ink at 2.2x rather than from a heavier alpha, because the alpha is
     what the gate actually reads.

     PRINTED IN ONE INK, and the accent spends itself on the one line an owner
     reads. #1f3348 is the darkest and least chromatic blue here by some way —
     the four saturated navies run 40 to 70 points of blue over red and this one
     reads as a blue-black, which is what a statement and the check stapled to
     it are actually printed in.

     GEOMETRIC DISPLAY OVER A RUBIK BODY, which no other faceplate pairs. A small
     letting agency's name is set in a geometric sans because that is what a
     printer put on its stationery; the statement under it is not. */
  'rent-roll': {
    face: 'geometric', body: 'plain', data: 'mono',
    density: 'regular', panel: 'card', masthead: 'ownerstatement', readout: 'total', head: 'rule',
    bg: '#e3f0ef', surface: '#f8fcfc', surfaceAlt: '#d5e6e5',
    border: '#bcd3d1', borderStrong: '#92adab',
    text: '#0f1816', textSec: '#3f5150', textMuted: '#4d605e',
    accent: '#1f3348', accentInk: '#ffffff', tint: '#dce8ee', ring: '#93b0bd',
    texture: 'tearoff', textureInk: '#2f5257', textureAlpha: 0.085, textureScale: 22,
    /* SQUARE, because a statement is laser-printed on the agency's own stock,
       folded twice and posted. The corner is shared vocabulary with five other
       forms here and does not try to be the identity — the stock, the tear and
       the field strip carry that. */
    radius: 0, radiusSm: 0, rule: 1, ruleStrong: 2, edgeBar: null,
    business: 'Neuse Bend Property', trade: 'what actually goes out to each owner',
  },

  /* A MAKE-READY PUNCH LIST — the card that hangs on the handle of an empty
     unit while it is being turned, and comes off it when the unit is let.

     THE ONLY FRANKLY GREEN CARD, and it is loud on purpose rather than for
     variety. A punch list is printed on the loudest stock in the box because a
     tech walking a corridor of identical doors has to see which units are open
     from the far end of it. Measured across every ground here, the wheel
     between 90° and 135° was empty and the two nearest neighbors are a gray
     copier white and a pale sage security stock at six and eight points of
     chroma; this one runs twenty-nine, so it is held apart by CHROMA rather
     than by another shade of pale — the same measurement the owner statement
     used to find the cyan quarter, redone rather than remembered.

     MEASURED BEFORE IT WAS WRITTEN, not after. The printed ground composites to
     #cde6c7 and the three inherited tone figures land at 4.88, 4.93 and 4.90
     against the 4.5 floor. That is the pair the ceiling has bitten on twice,
     and it is why the fiber is held at 0.075 — the corner marks get their
     weight from a darker ink at 2.4x rather than from a heavier alpha, because
     the alpha is what compositeGround() reads and compositeGround() is what the
     ceiling reads.

     A DEEP MAGENTA INK, which is the one quarter of the accent wheel this shelf
     had left: sorted by hue, twenty-four accents run 0–264 and then jump to
     303, and 330 sits in the gap. It is also very nearly opposite the stock, so
     the one figure that carries color on a green card is the one figure that
     cannot be missed.

     RUBIK AS THE FIGURE FACE, which no other faceplate does — mono and Inter
     are the only two the shelf has used for a column of money. It is tabular
     once tnum is on (measured, see DATA_FACES) and the kit sets it. Oswald over
     it because the one line on this card that has to be read from the corridor
     is the unit, and Oswald was drawn for signage. */
  'unit-turn': {
    face: 'condensed', body: 'sans', data: 'plain',
    density: 'regular', panel: 'card', masthead: 'doortag', readout: 'total', head: 'stamp',
    bg: '#d9f0d3', surface: '#f5fcf3', surfaceAlt: '#cbe5c4',
    border: '#b2ceaa', borderStrong: '#87a480',
    text: '#101a0d', textSec: '#3f4f3b', textMuted: '#4d5e49',
    accent: '#8a1550', accentInk: '#ffffff', tint: '#f2dfe9', ring: '#c48fac',
    texture: 'corners', textureInk: '#3f6a37', textureAlpha: 0.075, textureScale: 26,
    radius: 5, radiusSm: 3, rule: 1, ruleStrong: 2, edgeBar: null,
    business: 'Cutter Point Rentals', trade: 'what a turn between tenants cost',
  },

  /* A CARBON ORDER PAD. Warm pad stock, brass ink, and the only diagonal texture
     on the shelf — eight orthogonal grains and one hatch is most of why this one
     reads as its own thing standing next to them. */
  'reorder-list': {
    face: 'plain', body: 'sans', data: 'mono',
    density: 'regular', panel: 'ruled', masthead: 'orderpad', readout: 'hero', head: 'stamp',
    bg: '#f6f3e8', surface: '#fffdf4', surfaceAlt: '#efeade',
    border: '#dcd4bd', borderStrong: '#c0b695',
    text: '#191610', textSec: '#544d3b', textMuted: '#645d4a',
    accent: '#775a0a', accentInk: '#fffdf4', tint: '#f7f0dc', ring: '#d4bd76',
    texture: 'carbon', textureInk: '#a08f5e', textureAlpha: 0.08, textureScale: 9,
    radius: 4, radiusSm: 4, rule: 1, ruleStrong: 2, edgeBar: null,
    business: 'Marker Nine Chandlery', trade: 'what to order, and when',
  },

  /* A PAY APPLICATION, ON THE TINTED COPY OF THE SET. The form itself is a
     multi-part carbonless pad: the top sheet goes to the general contractor,
     and the copy the trade keeps in the job file is the tinted one, so that a
     stack of them can be found by color on a truck seat. Among tinted-copy
     stocks this shelf has not used the violet, and it is the one that reads as
     a copy rather than as an original — which is exactly what the applicant is
     left holding while somebody else has the sheet that moves the money.

     THE HUE WAS MEASURED OFF THE OTHER GROUNDS RATHER THAN PICKED. Sorted round
     the wheel, the widest empty stretch in themes.js on 2026-09-07 ran 53
     degrees between a lilac remittance at 266 and a rose sign-in sheet at 319.
     This sits at 287, 21 degrees off one and 32 off the other — and it carries
     19 points of chroma against the lilac's 7, so it is held apart by SATURATION
     as well as by hue rather than being a third shade of pale.

     THE SCREEN IS THE FIBER AND IT IS PRINT, NOT STOCK. The cells a pay
     application reserves for the certifier are shaded at the press so the
     applicant does not write in them; see the `screen` recipe in shelf.jsx for
     why a registered 45-degree lattice is a different object from kraft's
     speckle. Alpha 0.06 was chosen against the ceiling, not by eye: the printed
     ground composites to #e9d9ed and the three semantic tones land at 4.84,
     4.89 and 4.86 against a 4.5 floor, which is the whole margin this stock has.

     bookish + plain + mono. Cormorant is the face of a certificate, which is
     what this document is once the right-hand half is signed; Rubik reads the
     prose; Plex Mono foots the money. */
  retainage: {
    face: 'bookish', body: 'plain', data: 'mono',
    density: 'tight', panel: 'ruled', masthead: 'payapp', readout: 'hero', head: 'rule',
    bg: '#f2e3f6', surface: '#fdfaff', surfaceAlt: '#e7d8ec',
    border: '#d5c0dd', borderStrong: '#ac8db8',
    text: '#1a1120', textSec: '#4b3a53', textMuted: '#5b4864',
    accent: '#6d2178', accentInk: '#ffffff', tint: '#f7ecf9', ring: '#bb90c9',
    texture: 'screen', textureInk: '#5c4468', textureAlpha: 0.06, textureScale: 6,
    radius: 2, radiusSm: 2, rule: 1, ruleStrong: 2, edgeBar: null,
    business: 'Slack Tide Electric', trade: 'what the contract is still holding',
  },

  /* A DRAW REQUEST, ON THE LENDER'S OWN SAFETY STOCK. The form is supplied by
     the bank at closing, not by the builder, and it is printed on the tinted
     stock a lender puts under anything that authorizes money to move — the same
     reason a cashier's check is not on plain white.

     THE HUE WAS MEASURED OFF THE OTHER GROUNDS RATHER THAN PICKED. Sorted round
     the wheel on 2026-09-07, the widest empty stretch in themes.js ran 43
     degrees between a greenbar remittance at 223 and a lilac advice at 266.
     This sits at 243, twenty off one and twenty-three off the other — and both
     of those neighbors are NEAR-ACHROMATIC, seven points between their red and
     blue channels each, where this runs twenty. So it is held apart by CHROMA
     rather than by another shade of pale, which is the measurement the owner
     statement used to find the cyan quarter and the punch list redid to find the
     green. The nearest genuinely saturated ground is the pay application's
     violet at 287, a full 44 degrees away, and those two must not be confused:
     they are the shelf's two construction tools and they sit in the same group.

     THE ACCENT IS A BANK GREEN AND THAT WAS MEASURED TOO. Sorted by hue, the
     twenty-six accents here leave one clear stretch of forty degrees, between a
     deposit slip's olive at 97 and a day book's forest at 137. This sits at 117
     and is darker and less yellow than either. Green is what a lender prints its
     own forms and its own endorsement in, so the one hue with room on this shelf
     is also the right one for the document.

     MEASURED BEFORE IT WAS WRITTEN, not after: the printed ground composites to
     #dedcf2 and the three inherited tone figures land at 4.84, 4.90 and 4.86
     against the 4.5 floor. That is the pair the contrast ceiling has bitten on
     twice, and it is why the fiber is held at 0.06 — the ladder's rails get
     their weight from a darker ink at 2.2x rather than from a heavier alpha,
     because the alpha is what compositeGround() reads and compositeGround() is
     what the ceiling reads.

     RUBIK FOR EVERY WORD AND PLEX MONO FOR EVERY FIGURE, which no other
     faceplate pairs — the bond invoice is the only other tool set in one voice
     throughout and it foots its money in Inter. A forms printer typesets a
     lender's form once, in a single plain grotesque, headings and prose alike,
     because it is one type spec rather than a designed page; the money is
     monospaced because the columns have to add up down the sheet.

     SQUARE AT BOTH RADII, because the form is laser-printed on the bank's stock
     and filed flat. It also keeps the masthead's solid bar square, which is what
     holds it to a printed section rule rather than a web header. */
  'draw-schedule': {
    face: 'plain', body: 'plain', data: 'mono',
    density: 'regular', panel: 'ruled', masthead: 'drawform', readout: 'strip', head: 'caps',
    bg: '#e7e6fa', surface: '#fbfaff', surfaceAlt: '#dcdaf1',
    border: '#c6c3e0', borderStrong: '#9c98bd',
    text: '#14121f', textSec: '#454159', textMuted: '#545069',
    accent: '#245821', accentInk: '#ffffff', tint: '#e3ecdf', ring: '#a9b8a6',
    texture: 'ladder', textureInk: '#4a4570', textureAlpha: 0.06, textureScale: 22,
    radius: 0, radiusSm: 0, rule: 1, ruleStrong: 2, edgeBar: null,
    business: 'Bell Buoy Builders', trade: 'what the draws say against the work',
  },

  /* A TIME RECORD, ON THE ONE STOCK THIS SHELF PRINTS THAT NOBODY OUTSIDE THE
     PRACTICE EVER SEES. Every other document here is designed to be handed
     over — an invoice, a statement, a pay application, a draw request, a
     receipt. A timesheet is filled in by the person who did the work, for the
     person who bills it, and it goes no further. That is why the stock is
     tinted at all: not so a client can tell it apart, but so a timekeeper can
     find today's sheet in a stack of white paper without reading a word on it.

     THE HUE WAS MEASURED OFF THE OTHER GROUNDS RATHER THAN PICKED, AND IT IS
     HELD APART BY CHROMA RATHER THAN BY HUE. Sorted round the wheel on
     2026-09-07 the cool half of this shelf is gray: ten grounds sit between
     150 and 266 degrees and every one of them runs a chroma of four to
     thirteen — the two nearest neighbors here are a boatyard invoice at 192
     with a chroma of five and a yard board at 210 with a chroma of four. This
     sits at 203 with a chroma of twenty-four, four to six times either of
     them, so it is a real blue standing between two grays rather than a third
     shade of pale. The nearest saturated cool ground is the draw request's
     periwinkle at 243, forty degrees away and violet where this is not.

     MEASURED BEFORE IT WAS WRITTEN, NOT AFTER: the printed ground composites to
     #d0e0ea and the three inherited tone figures land at 4.81, 4.87 and 4.83
     against the 4.5 floor. That trio is the pair the contrast ceiling has
     bitten on twice, and it is the whole margin this stock has — which is why
     the fiber is held at 0.06 to 0.07 and the scale gets its weight from a
     darker ink at 2.2x instead, because compositeGround() reads the ALPHA and
     the ceiling reads compositeGround().

     THE ACCENT IS THE WIDEST EMPTY STRETCH ON THE ACCENT WHEEL and it is
     deliberately in the same cool family as the stock. Sorted by hue, the
     twenty-seven accents here leave one clear run of thirty-one degrees between
     a commission statement's indigo at 233 and a claim sheet's violet at 264;
     this sits at 246. It does not reach for a warm hue to separate itself from
     its own paper, and that is right for this document rather than a
     compromise: a time record is printed and written in one family of ink, so
     the separation it needs is in VALUE — a very dark mark on a very light
     sheet, at 8.5:1 against the printed ground — and this carries the highest
     chroma of the four deep blues on the shelf so it cannot be mistaken for
     one of them.

     INTER, INTER AND PLEX MONO, WHICH IS THE LAST UNUSED VOICE ON THIS SHELF
     THAT FOOTS ITS MONEY IN A MONOSPACE — and it is the right one rather than
     what was left. Every other faceplate reaches for a face that says something
     about the trade, because every other document is seen by somebody outside
     the business. This one is internal, so it is set in whatever the office
     already prints in and carries no house typography at all. The figures are
     monospaced because three money columns and an hours column have to add down
     the sheet. It is also the only route on the shelf that imports no font: all
     three faces come site-wide from BaseLayout, which is what that argument
     looks like in the build.

     SQUARE-ISH AT BOTH RADII, because the sheet is a pad on a desk rather than
     a card in a wallet, and the corner an open registration mark turns in the
     masthead has to be a corner. */
  'billable-hours': {
    face: 'sans', body: 'sans', data: 'mono',
    density: 'tight', panel: 'card', masthead: 'timesheet', readout: 'hero', head: 'rule',
    bg: '#dcebf4', surface: '#f8fbfd', surfaceAlt: '#cde0ec',
    border: '#b0c9da', borderStrong: '#8199ab',
    text: '#101820', textSec: '#3a4a56', textMuted: '#4a5a67',
    accent: '#342a86', accentInk: '#ffffff', tint: '#e2e1f2', ring: '#9fbacd',
    texture: 'tenths', textureInk: '#2c5468', textureAlpha: 0.07, textureScale: 20,
    radius: 2, radiusSm: 2, rule: 1, ruleStrong: 2, edgeBar: null,
    business: 'Beacon Row Law', trade: 'what the hours were worth, and what came in',
  },

  /* A SALMON LEDGER CARD — the running account a shop keeps per client, drawn
     down each period and filed in a tray with everybody else's. Account cards
     are color-coded stock precisely so one can be found without reading it,
     and salmon is the ordinary one for a client record.

     THE HUE WAS MEASURED RATHER THAN CHOSEN. Sorting every ground here by CIE
     Lab hue on 2026-09-07 left one gap of fifty degrees — from h*5 to h*55,
     the whole red-through-orange quarter — against a median gap of about nine.
     The two grounds nearest it are a pink at chroma 5.9 and an almost neutral
     warm white at 3.5, so this is held apart by CHROMA as well as by hue. It
     sits at ΔE 7.4 from its nearest neighbor where the shelf's median
     nearest-neighbor distance is 2.5, which makes it the second most distinct
     ground here after the mint.

     IT IS ALSO NOT AS DARK AS IT WANTED TO BE. The first draw was L*89.5, which
     would have been the darkest stock on the shelf, and the three semantic tone
     colors came out at 4.58–4.63 against a 4.5 floor. Lifting it to L*91.2
     bought back a third of a point and cost about two ΔE — the trade the
     recipe's contrast-ceiling note describes, taken deliberately.

     Its fiber is the close: rules at the entry pitch with a DOUBLE RULE every
     fifth one, which in bookkeeping means the account above it is finished. Its
     masthead is the index tab standing above the card's top edge. Petrol blue
     is the pre-printed ink, which is the complement of the stock and the one
     thing on the page that is not written in by hand.

     THE FIBER'S INK IS DARK RATHER THAN MID-TONE, AND THAT WAS MEASURED OFF THE
     TILE. The first draw used a warm brown at this same alpha and the rules
     were invisible in the capture — a mid-tone ink at six per cent moves the
     ruled pixels about eight levels, which is nothing. A dark oxide red at the
     same alpha moves them about eleven, and costs a tenth of a point on the
     three tone colors over the printed ground. Raising the ALPHA instead would
     have taken those to 4.62 against a 4.5 floor; this leaves them at 4.71,
     which is where most of the shelf sits. */
  'retainer-burn': {
    face: 'serif', body: 'plain', data: 'sans',
    density: 'tight', panel: 'card', masthead: 'ledgercard', readout: 'hero', head: 'rule',
    bg: '#fedfd9', surface: '#fff7f5', surfaceAlt: '#f9d2ca',
    border: '#e8b8ae', borderStrong: '#c28e80',
    text: '#1d100c', textSec: '#59392f', textMuted: '#6b4a3f',
    accent: '#144e63', accentInk: '#ffffff', tint: '#f7e5e0', ring: '#e0ab9e',
    texture: 'doublerule', textureInk: '#6d2f1c', textureAlpha: 0.06, textureScale: 22,
    radius: 2, radiusSm: 1, rule: 1, ruleStrong: 2, edgeBar: null,
    business: 'Ropewalk Studio', trade: 'a small agency on monthly retainers',
  },

  /* A KENNEL RUN CARD, on bright card stock. A card that has to be picked out
     from twenty identical run doors is not printed on white — every boarding
     kennel and every vet ward buys colored stock for exactly that job, and the
     color is the first thing that carries.

     THE HUE WAS MEASURED RATHER THAN CHOSEN. Sorting every `bg` in this file by
     where it sits on the wheel, the 120°–180° sector held three grounds and
     every one of them was near-achromatic — book-time at 8 points between its
     red and blue channels, turn-cost at 4, rent-roll at 13. So a real green at
     152° and 36 points is held apart from its immediate neighbors by CHROMA
     rather than by another shade of pale, and its nearest chromatic neighbors
     are unit-turn's yellow-green 44° away and billable-hours' blue 51° away.
     That is a measurement anybody can redo in a minute, and it beats an
     argument about whether two pale greens look alike.

     THE ACCENT WAS A LEATHER BROWN AND THE CAPTURED TILE REFUSED IT. It sat at
     22° on the wheel, which is nine points from `bad` and twenty-two from
     `warn` — and this tool spends its accent on the one column that carries its
     finding, the money the peak rule added. A reader meeting a brown figure in
     a money column on a page whose caution color is an olive-brown reads a
     warning, and the arithmetic there is not a warning about anything. The
     three tone colors are fixed site tokens a faceplate inherits and never
     chooses, so the accent is what has to move. Sorting every accent on this
     shelf with the three tones among them, the widest gap ran 264° to 292°, and
     this sits at its midpoint: far from all three tones, far from the stock, and
     unclaimed. Nothing about that is a story about paper — it is legibility,
     which is the one thing an accent is actually for.

     THE FIBER IS THE DAY STRIP — see `splitcells` in shelf.jsx. Every entry on
     a run card happens twice a day, so the cell is ruled corner to corner. */
  'boarding-rate': {
    face: 'geometric', body: 'plain', data: 'plain',
    density: 'regular', panel: 'card', masthead: 'runcard', readout: 'hero', head: 'stamp',
    bg: '#d1f5e4', surface: '#f2fdf8', surfaceAlt: '#c3eeda',
    border: '#a9d8c3', borderStrong: '#7fb69e',
    text: '#0f1f18', textSec: '#33473e', textMuted: '#4b6058',
    accent: '#642a86', accentInk: '#ffffff', tint: '#e9f8f0', ring: '#9ccdb7',
    texture: 'splitcells', textureInk: '#1c4a35', textureAlpha: 0.06, textureScale: 22,
    radius: 4, radiusSm: 2, rule: 1, ruleStrong: 2, edgeBar: null,
    business: 'Pelican Run Kennels', trade: 'a boarding kennel and grooming room',
  },
};

/* A TOOL WITH NO FACEPLATE STILL RENDERS, in the site's own accent on the site's
   own paper. A missing entry should be a PLAIN-looking tool, never a crash and
   never an invisible one — this file is exactly the sort of thing a new tool
   forgets to touch. It is checked by the contrast gate alongside the nine. */
export const FALLBACK = {
  face: 'sans', body: 'sans', data: 'mono',
  density: 'regular', panel: 'card', masthead: 'plain', readout: 'strip', head: 'label',
  accent: '#b0355e', accentInk: '#ffffff', tint: '#fbeef2', ring: '#e6b3c6',
  texture: 'none', textureInk: '#000000', textureAlpha: 0, textureScale: 0,
  radius: 12, radiusSm: 8, rule: 1, ruleStrong: 2, edgeBar: null,
  business: '', trade: '',
};

export const themeFor = (toolId) => {
  const f = { ...BASE, ...(THEMES[toolId] || FALLBACK) };
  return {
    ...f,
    fontDisplay: FACE[f.face] || FACE.sans,
    fontBody:    FACE[f.body] || FACE.sans,
    fontData:    FACE[f.data] || FACE.mono,
    scale:       DENSITY[f.density] || DENSITY.regular,
  };
};

/* THE PRINTED GROUND — the stock with its own fiber laid over it.
   This is the color a person's eye actually meets between the panels, and on
   the five tools whose panels have no background of their own (`ruled` x3,
   `clean` x2) it is what sits DIRECTLY behind the body text. Checking that text
   against the flat stock would report a number the visitor never sees.

   IT IS A WORST CASE, NOT A MEASUREMENT, and that is deliberate: it composites
   the texture ink at full alpha across the whole area, where the browser paints
   it on only a fraction of the pixels. That errs toward the darker answer, which
   is the safe direction for dark ink on light paper. Nothing in this repo reads
   a rendered pixel, so a safe approximation is the strongest honest option here.

   Exported because check-contrast.mjs has to check against THIS. */
export const compositeGround = (f) => {
  const a = f.textureAlpha || 0;
  if (!a || !f.texture || f.texture === 'none') return f.bg;
  const ink = (f.textureInk || '#000000').replace('#', '').match(/../g).map((x) => parseInt(x, 16));
  const bg  = f.bg.replace('#', '').match(/../g).map((x) => parseInt(x, 16));
  return '#' + ink.map((v, i) => Math.round(v * a + bg[i] * (1 - a)).toString(16).padStart(2, '0')).join('');
};
