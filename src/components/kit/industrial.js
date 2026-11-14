/* PALETTE: northpoint */
/* THE INDUSTRIAL FACEPLATE — one identity for the seven supply-chain demos,
   in three band variants. Pure data + one resolver, no React, so a Node gate
   can import exactly what the browser renders.

   THE NAME ON THE FIRST LINE IS THE HOUSE'S RULE (tool-conventions § A,
   palettes.md): a tool names its palette where its tokens are defined, and one
   that names none has not decided. `northpoint` is this file's since 2026-09-23,
   when Ian brought the seven under the house conventions MD04 set that day and
   gave them a palette of their own, built from the look below. check-contrast.mjs
   refuses this file without the line.

   ONE PALETTE SINCE 2026-09-24. D42's dark-only faceplate (BASE, BANDS,
   industrialTheme) served the seven until each moved to NORTHPOINT in its own
   commit; it was deleted with the seventh. Its three dark grounds live on,
   unchanged, as northpoint's dark mode.
 *
 * WHY THREE AND NOT SEVEN. LEDGER L-205 fired three times on this repo: nine
 * shelf tools were given an accent hue each and the operator's read was "still
 * copies of one thing with the color changed". A hue is the lightest signal on
 * a page. So what varies here is GROUND LIGHTNESS, GROUND WARMTH, TYPE PAIRING,
 * DENSITY and RULE WEIGHT — all heavy — and the accent is deliberately SHARED,
 * because the seven are evidence of one practice, not seven things for sale.
 *
 * WHY THREE AND NOT ONE. The /work/ gallery already sorts these into three
 * named groups (demos.ts workGroups, band:'scale'). Each variant therefore
 * encodes a heading a visitor can already read above the tiles, rather than
 * being decoration.
 *
 * MEASURED 2026-08-27, not assumed: every color pair at the WCAG AA floor, worst
 * 3.33 (a dim-brass rule, whose floor is 3). The count is not written here —
 * check-contrast.mjs prints it; this line said "81" while the gate counted 114.
 * The checker was run three times on three real candidate palettes and
 * reported 12 failures, then 1, then 0 — so its zero is a real zero. Band
 * separation is measured in CIE L* and in red-minus-blue warmth, NOT in
 * contrast ratio, which compresses to nothing below L* 20 and would have
 * called three near-identical chassis "different". scripts/check-contrast.mjs
 * re-runs all of it out of this file on every build.
 */

/* THE COMPANY THESE SEVEN ARE SET IN is src/lib/northpoint.js, and this file
   deliberately does NOT re-export it. The house style is an attribute of
   Northpoint — that is what northpoint.js's HOUSE_STYLE records — but hanging
   the world off a resolved faceplate gave two ways to reach one fact, and the
   convenient one bites: three tools name the company at module top, ABOVE
   where the theme resolves, and a const is unreachable until its own line has
   run. Import the world where you need the world. */

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

/* ═══════════════════════════════════════════════════════════════════════════
   NORTHPOINT — the two-mode palette (Ian, 2026-09-23).

   WHAT HE DECIDED, and each line is a reversal or a keep of D42:
     - dark by default, with a switch to light that is remembered  (reverses D42 c)
     - the three band grounds stay exactly as they were             (keeps D42 a)
     - brass stays the ONE chrome color: the main button, the focus
       ring, the selected tab, a link                                (keeps D42 b's spirit)
     - warnings get their OWN amber, and brass leaves status         (reverses D42 b's alias)
     - IBM Plex Sans for words, Plex Mono for numbers and codes       (replaces the band faces)

   WHY THE WARN SPLIT DOES NOT REOPEN WHAT D42(b) FEARED. D42 aliased warn to
   brass so two close warm colors could never sit side by side as STATUS PEERS.
   The split keeps that promise from the other side: brass is no longer a status
   at all. It marks chrome; amber is the only warm status. The house rule it
   serves is that amber means "at or under the threshold" and a warning chip must
   not look like the main button. Measured apart, not assumed: CIE ΔE 24 between
   brass and amber on dark, 25 between their light-mode text shades.

   DARK VALUES ARE D42'S, UNCHANGED, except `warn` (split) and `change` (new —
   the house marks a change purple, never green, because green reads as good).
   LIGHT VALUES KEEP EACH BAND'S IDENTITY: warm paper for the planning board,
   warmer tan for the receiving terminal, cool paper for the data table. Cards
   sit LIGHTER than the page with a soft shadow in light mode and on borders only
   in dark (house rule, conflict A). Every pair is re-checked out of this object
   by check-contrast.mjs; nothing below was eyeballed.

   `control` IS THE ONE NEW STRUCTURAL TOKEN. `border` and `borderStrong` are
   decorative dividers and sit at 1.7 to 2.2:1 — right for a rule between rows,
   and below WCAG's 3:1 for the outline that tells you a box is an input. The
   house keeps the divider and the interactive outline as separate tokens, so an
   input, a select and a quiet button take `control`, measured at 3.1:1 or more
   against every ground of its band.

   `series` IS THE CHART SET, AND IT CARRIES NO STATUS. A category drawn in
   green reads as healthy and one in red as alarm (house rule: green and red
   mean status and nothing else) — which is how Staging's flow bar came to paint
   the line-side bucket green while a GROWING line-side share is the problem the
   tool exists to flag. So a chart takes brass for the one thing to look at and
   four steel steps for the rest, in order. Every step clears 3:1 against every
   ground of its mode (a graphic, not a word) and sits at least ΔE 10 from its
   neighbor; check-contrast.mjs holds both.

   FILLS ARE MODE-INVARIANT. The ramp strip, the status pills and the main
   button all paint a mid-tone fill and set accentInk on it; the same fill reads
   on a near-black ground and on paper, and one set means a pill never changes
   color when the mode flips — only its surroundings do. */
export const NORTHPOINT = {
  fills: {
    accent:    '#C99A46',   // brass — the main button, a selected chip
    good:      '#5CB47A',
    sevOlive:  '#9CB55E',
    warn:      '#E5BA2E',   // amber
    sevOrange: '#E2894F',
    bad:       '#EC7972',
    change:    '#B9A3E8',
    accentInk: '#141109',   // the one ink on every fill above — 7.36:1 on brass, the lowest
  },
  modes: {
    dark: {
      base: {
        text: '#F4F1EA', textSec: '#BDB6A8', textMuted: '#A39B8C',
        accentText: '#C99A46', accentDim: '#9C7A38',
        warn: '#E5BA2E', good: '#5CB47A', bad: '#EC7972', info: '#94ABC4', change: '#B9A3E8',
        sevOlive: '#9CB55E', sevOrange: '#E2894F',
        shadow: 'none', shade: 'rgba(0,0,0,0.55)',
        series: ['#C99A46', '#CBDFF3', '#ADC0D4', '#90A3B6', '#76889B'],
      },
      bands: {
        demand:     { bg: '#0B0A08', surface: '#15130E', surfaceAlt: '#1C1913', border: '#2E281E', borderStrong: '#463C2C', control: '#70675A' },
        inbound:    { bg: '#241E19', surface: '#2F2822', surfaceAlt: '#362E27', border: '#473D35', borderStrong: '#5C4F44', control: '#84796F' },
        masterData: { bg: '#13161B', surface: '#1B1F26', surfaceAlt: '#232830', border: '#39404C', borderStrong: '#4C5462', control: '#6E737D' },
      },
    },
    light: {
      base: {
        text: '#17150F', textSec: '#433D32', textMuted: '#5E574A',
        accentText: '#5E4A1F', accentDim: '#876727',
        warn: '#855800', good: '#1D6B41', bad: '#B3261E', info: '#3A5876', change: '#6B4FA0',
        sevOlive: '#4F6617', sevOrange: '#9A4410',
        shadow: '0 1px 2px rgba(23,21,15,0.06), 0 4px 14px rgba(23,21,15,0.07)', shade: 'rgba(23,21,15,0.18)',
        series: ['#8A6420', '#203242', '#394B5B', '#506374', '#697C8E'],
      },
      bands: {
        demand:     { bg: '#F4F2ED', surface: '#FDFCF9', surfaceAlt: '#E9E5DC', border: '#D6D0C3', borderStrong: '#B9B1A1', control: '#857F72' },
        inbound:    { bg: '#F0E7D9', surface: '#FBF6EE', surfaceAlt: '#EAE0D0', border: '#D3C4AD', borderStrong: '#B7A58A', control: '#897B66' },
        masterData: { bg: '#ECEFF3', surface: '#FAFBFC', surfaceAlt: '#DFE4EA', border: '#C9D0D9', borderStrong: '#A9B3BF', control: '#7A8087' },
      },
    },
  },
  /* ONE TYPE PAIR, TRAVELING WITH THE PALETTE (house rule, Ian 2026-09-23). The
     mono face is for numbers, codes and week labels, never for words. */
  faces: {
    sans: "'IBM Plex Sans','Segoe UI',system-ui,sans-serif",
    mono: "'IBM Plex Mono','SF Mono','Consolas',monospace",
  },
};

export const MODES = ['dark', 'light'];
export const DEFAULT_MODE = 'dark';

/* EVERY FACTORY DEMO, from the band map, so a tool added to TOOL_BAND is held
   to every rule on the day it is added. The gates, the manual route, the
   masters sync and the link cards all read this. It replaced MIGRATED, the
   list of tools that had moved to northpoint, when the seventh moved
   (2026-09-24). */
export const FACTORY = new Set(Object.keys(TOOL_BAND));

/* The CSS custom property each token is published under on a tool's root. */
const VAR = (k) => `--np-${k.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())}`;

/* THE HEX VALUES FOR ONE TOOL IN ONE MODE, flat. Gates and charts read this;
   a chart library that takes a color as an SVG attribute cannot resolve var(). */
export function northpointHex(slug, mode = DEFAULT_MODE) {
  const band = TOOL_BAND[slug];
  if (!band) throw new Error(`northpointHex: "${slug}" is not one of the seven. Add it to TOOL_BAND.`);
  const m = NORTHPOINT.modes[MODES.includes(mode) ? mode : DEFAULT_MODE];
  const f = NORTHPOINT.fills;
  const { series, ...base } = m.base;
  return {
    ...base, ...m.bands[band],
    ...Object.fromEntries(series.map((c, i) => [`series${i + 1}`, c])),
    accentFill: f.accent, accentInk: f.accentInk,
    goodFill: f.good, oliveFill: f.sevOlive, warnFill: f.warn, orangeFill: f.sevOrange,
    badFill: f.bad, changeFill: f.change,
    band, mode,
  };
}

/* THE CUSTOM PROPERTIES A TOOL'S ROOT CARRIES FOR ONE MODE. Switching mode is
   swapping this object; nothing inside the tool re-renders its own colors. */
export function northpointVars(slug, mode = DEFAULT_MODE) {
  const hex = northpointHex(slug, mode);
  const out = {};
  for (const [k, v] of Object.entries(hex)) {
    if (k === 'band' || k === 'mode') continue;
    out[VAR(k)] = v;
  }
  out['--np-font-sans'] = NORTHPOINT.faces.sans;
  out['--np-font-mono'] = NORTHPOINT.faces.mono;
  return out;
}

/* WHAT A TOOL RENDERS FROM: every color as a var() REFERENCE, so the module-level
   constants a tool builds from it (a severity map, a legend) stay valid in both
   modes. The values themselves arrive on the root through northpointVars(). */
export function northpointTokens(slug) {
  const hex = northpointHex(slug, DEFAULT_MODE);
  const T = {};
  for (const k of Object.keys(hex)) {
    if (k === 'band' || k === 'mode') continue;
    T[k] = `var(${VAR(k)})`;
  }
  /* The old names the seven already paint with, pointed at the new tokens, so a
     tool moves by changing its import rather than every line that reads T. */
  T.accent = T.accentText;
  return {
    ...T,
    band: hex.band,
    fontBody: NORTHPOINT.faces.sans,
    fontLabel: NORTHPOINT.faces.sans,
    fontData: NORTHPOINT.faces.mono,
    numeric: 'tabular-nums',
    radius: 4,
  };
}

/* A TOKEN AT PARTIAL OPACITY, without a second copy of the token.
   A wash and a hatch both want "the accent, but faint". Written by hand as
   `rgba(201,154,70,0.05)` that is the accent's value typed a second time, and
   the day the accent moves the wash stays where it was with nothing erroring —
   the drift class this repo keeps paying for. Take the color from T.

   A var() REFERENCE IS MIXED, NOT PARSED. A northpoint token is `var(--np-…)`,
   whose value is only known on the page, so the wash is left to the browser as
   a color-mix toward transparent — the same color, faded, in either mode. */
export function alpha(color, a) {
  if (color.startsWith('var(')) {
    return `color-mix(in srgb, ${color} ${Math.round(a * 1000) / 10}%, transparent)`;
  }
  const s = color.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16));
  return `rgba(${r},${g},${b},${a})`;
}
