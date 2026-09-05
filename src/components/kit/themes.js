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
// copies of one thing with the colour changed.
//
// Round two added five axes — display face, density, panel shape, masthead,
// readout — and he said it AGAIN. He was right both times, and the reason the
// second round did not land is worth writing down, because it is not obvious:
//
//   EVERY ONE OF THOSE FIVE AXES REACHES STRUCTURE. NOT ONE REACHES SURFACE.
//
// A person reads the surface first. Six of BASE's twelve colours were the
// marketing site's own tokens copied byte-for-byte — #faf7f2, #f4efe6, #e0d8ca
// and all three inks are literally global.css:15,16,18,23,24,25 — and pageFor
// wrote Inter and IBM Plex Mono as LITERALS, so every tool read in the same two
// voices however its palette moved. Strip the accent hue and nine tools were
// identical in ground, panel, rule, corner, prose face and figure face. That is
// also why they "blended into the website": they were painted in its palette.
//
// THE OLD FRAMING WAS THE CAUSE, so it is retired here rather than kept.
// It read: "one ground, one ink, one border colour ... nine instruments from one
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
//   FIBRE    texture / textureInk / textureAlpha / textureScale — what is
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

   A FACEPLATE MAY OVERRIDE ANY OF THE PAPER COLOURS. It may not override the
   three tone colours or their washes: the faceplate says which trade you are in,
   never how bad something is. */
export const BASE = {
  bg: '#faf7f2',          // oyster shell — the site's own page colour
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
     a tone colour on a quiet row. They are 5.68 and 5.75 now, and the gate
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
 *   FIBRE   texture textureInk textureAlpha textureScale
 *   EDGE    radius radiusSm rule ruleStrong edgeBar
 *   VOICE   face (display) · body (reading) · data (figures, see DATA_FACES)
 *   SHAPE   density panel masthead readout head
 *   WORLD   business trade
 *
 * ⚠️ `panel` IS CALLED `panel` AND NOT `surface` FOR A MEASURED REASON: BASE
 * carries `surface` as the panel COLOUR, and a per-tool `surface: 'card'`
 * silently overwrote it. `--aiq-surface: card` is not a colour, so the browser
 * dropped the declaration and every panel lost its background — while the build,
 * the smoke test and the contrast gate all stayed green, because none of them
 * looks at a rendered pixel. Found by opening the page.
 *
 * THE PAPER IS PICKED FROM THE DOCUMENT THE TOOL REPLACES, never from a colour
 * wheel. A tip-out is a check off a manila pad. A crew share is a settlement in
 * a ledger book. A marina bill is an invoice on watermarked bond. A storm plan
 * is a board on a wall. That is what stops this being a palette exercise, and it
 * is the one part of this file arithmetic cannot check.
 */
export const THEMES = {
  /* A SPIRAL DAY BOOK on goldenrod, which is the paper every festival vendor
     packet in the county is printed on and the most saturated ground here by a
     long way. Thirteen quiet stocks and one that is frankly a colour.

     Its fibre is the binding — rings down one margin, the only hollow mark on
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

     ITS FIBRE IS THE ONLY CURVE HERE. Twelve papers made of straight lines,
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
     grey. This one sits between them and belongs to neither, which is what makes
     it recognisable at a glance rather than after a comparison. It is also the
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
     blue-grey. This one is the only frankly BLUE ground on the shelf and the
     darkest stock of the ten, so it reads as a heavier form before a single
     shape is compared. The fibre carries the only broken vertical line here.

     One ink, because a pre-printed form is printed in one. The colour is spent
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
     section headings are not coloured. */
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
     is what makes the other eight's fibre read as a choice rather than a
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
     SVG and renders achromatic noise; a coloured ink would make
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

/* THE PRINTED GROUND — the stock with its own fibre laid over it.
   This is the colour a person's eye actually meets between the panels, and on
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
