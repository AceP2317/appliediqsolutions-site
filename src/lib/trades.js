/* ============================================================================
   THE RUN OF TRADES — the site's opening line, held ONCE and derived everywhere.

   WHY THIS FILE EXISTS, and it is the same reason src/lib/career.js exists.
   The home headline was a single string in src/data/home.ts, and gen-og.mjs
   carried a second copy of it split into three hand-measured lines, under a
   comment reading "If the headline changes again, change it here and re-run
   npm run og." That is a checklist. A checklist is a thing a person is asked to
   remember, and it had already failed once: the share card kept selling the
   pre-D33 positioning for weeks after the page had moved on, because nothing
   connected the two and nothing could. See LEDGER L-196.

   gen-og.mjs is a plain Node script and cannot import a TypeScript module, which
   is why this is .js and not .ts — the same constraint that shaped career.js and
   pricing.js.

   AN ARRAY, NOT A SENTENCE, and that is load-bearing. The line beneath the
   headline used to open "Four industries that share nothing" — a hand-typed
   count of a hand-typed string, with nothing able to notice when the two stopped
   agreeing. They stopped agreeing the moment this went from four beats to six.
   A count taken from .length cannot drift. D22 already forbids typing the tool
   count anywhere; this is the same rule applied to a second countable.

   ── WHAT IS IN THE LIST, AND WHAT IS DELIBERATELY NOT ────────────────────────

   Operator's call, 2026-08-26, replacing the four-beat line written on 08-25.
   Every one is a domain he has actually worked inside; sourcing for all of them
   is docs/career-record.md, which rests on two resumes he has sent externally.

   MANUFACTURING was deliberately ABSENT from the four-beat version, on the
   grounds that he does supply chain AT a manufacturer rather than running
   manufacturing. Put back on his explicit call, and the distinction still holds:
   these are the domains a career has been spent inside, never a claim about what
   any one of them was run by him. The list makes no verb.

   "CORPORATE BANKING" IS STILL NOT USED and that has not changed. It means
   banking FOR corporations; he worked in a bank's corporate OFFICE, which is a
   different thing. Hence "Bank Lending".

   THE EMPLOYER IS NEVER NAMED (D1, D8). Nothing in this list goes near it.
   ============================================================================ */

/**
 * The domains, in the order they are read. First is the heaviest credential and
 * the current work; the rest run back through the career.
 * @type {readonly string[]}
 */
export const TRADES = Object.freeze([
  'Global Supply Chain',
  'Manufacturing',
  'Bank Lending',
  'Casino Operations',
  'Service Industry',
  'Clinical Care',
]);

/** The headline as one sentence: every domain, each closed with a full stop. */
export const tradesLine = () => TRADES.map((t) => `${t}.`).join(' ');

/**
 * The same list in running prose, lower-cased and comma-separated with a final
 * "and" — for the plain-text pages written for machines, where a run of
 * full stops reads as six fragments rather than one sentence.
 */
export const tradesProse = () => {
  const lower = TRADES.map((t) => t.toLowerCase());
  return `${lower.slice(0, -1).join(', ')}, and ${lower[lower.length - 1]}`;
};

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

/**
 * How many domains there are, spelled out — so no sentence anywhere types a
 * count beside a list it cannot see. Falls back to digits past ten rather than
 * inventing a word.
 * @param {{capital?: boolean}} [opts]
 */
export const tradeCountWord = (opts) => {
  const w = WORDS[TRADES.length] ?? String(TRADES.length);
  return opts?.capital ? w.charAt(0).toUpperCase() + w.slice(1) : w;
};

/**
 * Pack the domains into display lines of at most `perLine` beats.
 *
 * THE SHARE CARD HAS NO WRAPPING. gen-og.mjs draws SVG text at a fixed x with a
 * fixed size, so a line that is too long runs under the panel beside it and
 * nothing errors — it just renders wrong, in the one image every share of the
 * home page shows. Packing here rather than by hand means adding or cutting a
 * domain re-flows the card instead of silently overflowing it.
 *
 * @param {number} perLine how many domains fit on one line at the chosen size
 * @returns {string[]} each line, its beats joined and full-stopped
 */
export const tradeLines = (perLine) => {
  const out = [];
  for (let i = 0; i < TRADES.length; i += perLine) {
    out.push(TRADES.slice(i, i + perLine).map((t) => `${t}.`).join(' '));
  }
  return out;
};
