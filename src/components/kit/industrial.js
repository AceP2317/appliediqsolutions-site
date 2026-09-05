/* THE INDUSTRIAL FACEPLATE — one identity for the seven supply-chain demos,
   in three band variants. Pure data + one resolver, no React, so a Node gate
   can import exactly what the browser renders.
 *
 * WHY THREE AND NOT SEVEN. LEDGER L-205 fired three times on this repo: nine
 * shelf tools were given an accent hue each and the operator's read was "still
 * copies of one thing with the colour changed". A hue is the lightest signal on
 * a page. So what varies here is GROUND LIGHTNESS, GROUND WARMTH, TYPE PAIRING,
 * DENSITY and RULE WEIGHT — all heavy — and the accent is deliberately SHARED,
 * because the seven are evidence of one practice, not seven things for sale.
 *
 * WHY THREE AND NOT ONE. The /work/ gallery already sorts these into three
 * named groups (demos.ts workGroups, band:'scale'). Each variant therefore
 * encodes a heading a visitor can already read above the tiles, rather than
 * being decoration.
 *
 * KEEP BANDS FLAT. industrialTheme() spreads one level deep, exactly like
 * themeFor() in themes.js. A nested object inside a band would blank its
 * siblings — themes.js:186-192 records what that cost last time.
 *
 * MEASURED 2026-08-27, not assumed: 81 colour pairs at the WCAG AA floor, worst
 * 3.33. The checker was run three times on three real candidate palettes and
 * reported 12 failures, then 1, then 0 — so its zero is a real zero. Band
 * separation is measured in CIE L* and in red-minus-blue warmth, NOT in
 * contrast ratio, which compresses to nothing below L* 20 and would have
 * called three near-identical chassis "different". scripts/check-contrast.mjs
 * re-runs all of it out of this file on every build.
 */

import { FACE, DATA_FACES, DENSITY } from './themes.js';
/* THE COMPANY THESE SEVEN ARE SET IN is src/lib/northpoint.js, and this file
   deliberately does NOT re-export it. The house style is an attribute of
   Northpoint — that is what northpoint.js's HOUSE_STYLE records — but hanging
   the world off a resolved faceplate gave two ways to reach one fact, and the
   convenient one bites: three tools name the company at module top, ABOVE
   where the theme resolves, and a const is unreachable until its own line has
   run. Import the world where you need the world. */

/* SHARED — the family. Warm neutrals carrying one saturated warm accent, which
   is the site's own rule (CLAUDE.md: "the warmth lives in the NEUTRALS")
   applied to the dark side of the cut. */
export const BASE = {
  text:      '#F4F1EA',  // warm off-white
  textSec:   '#BDB6A8',
  textMuted: '#A39B8C',  // the tightest text tier — 4.42 was too low, this is the lift

  /* ONE WARM COLOUR, AND `warn` IS AN ALIAS OF IT ON PURPOSE. A separate amber
     for caution beside a brass for chrome puts two close warm colours on screen
     as status peers, and no rule written in a comment survives that. In an
     instrument the lit thing IS the thing you look at, so brass carries both. */
  accent:    '#C99A46',  // the site's #a8720c, lifted to clear a near-black ground
  warn:      '#C99A46',
  accentDim: '#9C7A38',  // rules, dim states, inactive chrome
  accentInk: '#141109',  // text sitting ON brass — 7.36:1

  good:      '#5CB47A',
  bad:       '#EC7972',
  info:      '#94ABC4',  // steel. Deliberately NOT a cyan — the retired identity
                         // was cyan and a visitor must not recognise it here.

  /* THE SEVERITY RAMP. Several tools age something — an order, an inbound
     shipment, a parameter last reviewed — and an age is real information, so
     it keeps its steps rather than being collapsed into three statuses.

     ONLY TWO TONES ARE NEW; the other three are `good`, `accent` and `bad`
     doing double duty, which is what stops a ramp becoming a private palette.
     The SIXTH step is not a sixth hue: six greens-to-reds are not tellable
     apart on a dark ground, and the pair beyond `bad` would have to go LIGHTER
     to stay legible, which reads as calmer rather than worse. So the worst
     step is `bad` as a FILL with accentInk on it — how a console marks its
     alarm state, and a stronger signal than any hue step. */
  sevOlive:  '#9CB55E',  // step 2 — greening off
  sevOrange: '#E2894F',  // step 4 — past caution, not yet alarm

  /* NO STATUS TINTS, and that is a finding rather than an omission. A shared
     row-highlight fill was measured against all three grounds and came out
     within ΔL* 2 of the inbound band's — invisible on one of the three.

     NO COLOURED LEFT EDGE EITHER, which replaced the tints for about an hour.
     Every card in a list had one, so its PRESENCE said nothing and only its
     hue spoke — which the label beside it already said. It is also the single
     most recognisable tell of a generated interface, which is the opposite of
     the brief. Status is carried by the figure, the label and, at the worst
     step, a solid fill. */
};

/* THE THREE BANDS. Grounds spread on BOTH axes: lightness (ΔL* 4.4 to 9.0) and
   warmth (Δ 8 to 19 on red-minus-blue), so they read apart even where the
   lightness gap is smallest. Panels lift by a different amount per band, which
   is the rule-weight axis: demand is flat and deep, inbound is layered,
   masterData is boxed. */
export const BANDS = {
  /* Demand & planning — production-plan-churn, order-confirmation-command-center,
     past-due-order-triage. A planning board: deepest ground, most room, and a
     condensed face for labels the way a schedule board is lettered. */
  demand: {
    bg: '#0B0A08', surface: '#15130E', surfaceAlt: '#1C1913',
    border: '#2E281E', borderStrong: '#463C2C',
    faceLabel: 'condensed', faceBody: 'sans', faceData: 'sans',
    rowPad: '9px 12px',  // a planning board has room between rows
    density: 'airy', rule: 1, radius: 4,
  },

  /* Inbound & inventory — asn-update-radar, staging-triage-console. A receiving
     terminal: warmest and lightest chassis, hairline rules, tightest rows,
     because this is a queue you scan down rather than a page you read. */
  inbound: {
    bg: '#241E19', surface: '#2F2822', surfaceAlt: '#362E27',
    border: '#473D35', borderStrong: '#5C4F44',
    faceLabel: 'plain', faceBody: 'plain', faceData: 'plain',
    rowPad: '5px 9px',  // a receiving queue is scanned, so it packs
    density: 'tight', rule: 1, radius: 2,
  },

  /* Master data & parameters — bom-explorer, parameter-audit-console. A data
     table: the one cool chassis, square corners, heaviest rules and a
     monospaced label face, so a column of parameters reads as a printout. */
  masterData: {
    bg: '#13161B', surface: '#1B1F26', surfaceAlt: '#232830',
    border: '#39404C', borderStrong: '#4C5462',
    faceLabel: 'mono', faceBody: 'sans', faceData: 'mono',
    rowPad: '7px 10px',  // a parameter table sits between the two
    density: 'regular', rule: 1.5, radius: 0,
  },
};

/* SLUG → BAND. This is a SECOND copy of a grouping that already lives in
   demos.ts workGroups, and it exists because a browser island cannot parse a
   TypeScript data file. It is not left on trust: check-contrast.mjs reads the
   band:'scale' groups through scripts/shelf-list.mjs and refuses a build where
   the two disagree, so the duplicate is asserted rather than remembered. */
export const TOOL_BAND = {
  'production-plan-churn': 'demand',
  'order-confirmation-command-center': 'demand',
  'past-due-order-triage': 'demand',
  'asn-update-radar': 'inbound',
  'staging-triage-console': 'inbound',
  'bom-explorer': 'masterData',
  'parameter-audit-console': 'masterData',
};

/* Resolve a slug into the flat object a tool renders from. Density is flattened
   with a Px/Pad suffix rather than nested, because DENSITY carries `label` and
   `body` as SIZES and a band carries faces — spreading both raw would put a
   number where a font stack belongs. */
export function industrialTheme(slug) {
  const band = TOOL_BAND[slug];
  if (!band) throw new Error(`industrialTheme: "${slug}" is not one of the seven. Add it to TOOL_BAND.`);
  const b = BANDS[band];
  const d = DENSITY[b.density];
  return {
    ...BASE, ...b,
    band,
    fontLabel: FACE[b.faceLabel],
    fontBody:  FACE[b.faceBody],
    fontData:  FACE[b.faceData],
    /* Harmless on a monospace, load-bearing on Inter and Rubik: both drift by
       more than 80px across ten digits without it. Measured in themes.js. */
    numeric: 'tabular-nums',
    /* ROW RHYTHM IS THE BAND'S OWN, and DENSITY's is the fallback. The shelf's
       three steps were measured for one-page tools where the widest thing is a
       money column; these tools run eleven columns of part numbers, and the
       shelf's airy step is NARROWER horizontally than what they already had.
       Borrowing it would have cramped the columns while claiming to loosen
       them. Everything else here still comes from the shared steps. */
    padPx: d.pad, gapPx: d.gap, rowPad: b.rowPad || d.row,
    labelPx: d.label, bodyPx: d.body, lead: d.lead, pagePad: d.pagePad,
  };
}

/* A TOKEN AT PARTIAL OPACITY, without a second copy of the token.
   A wash and a hatch both want "the accent, but faint". Written by hand as
   `rgba(201,154,70,0.05)` that is the accent's value typed a second time, and
   the day the accent moves the wash stays where it was with nothing erroring —
   the drift class this repo keeps paying for. Take the colour from T. */
export function alpha(hex, a) {
  const s = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16));
  return `rgba(${r},${g},${b},${a})`;
}

/* Exported for the gate, so the legal-figure-face rule is asserted against the
   same set the shelf is held to rather than a second copy of it. */
export { DATA_FACES };
