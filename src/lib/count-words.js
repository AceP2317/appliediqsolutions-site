/* ============================================================================
   A SMALL COUNT, SPELLED OUT — one list, read by everything that derives a
   number into prose.

   WHY THIS FILE EXISTS. By 2026-09-13 there were THREE copies of this array and
   three copies of the capitalize-and-fall-back-to-digits logic around it, in
   src/lib/career.js, src/lib/trades.js and src/data/founding.ts. The third one
   says so in its own comment — "the same shape as tradeCountWord() in
   src/lib/trades.js" — which is a copy announcing itself as a copy and doing
   nothing about it. The fourth caller was src/data/website-scope.js, and four is
   where this stops being a habit and becomes the thing D22 is about.

   THE THREE DIFFERED, WHICH IS THE ARGUMENT RATHER THAN THE TIDINESS. career.js
   spelled to twenty because it counts years; trades.js stopped at ten; founding
   .ts stopped at six and was typed `as const`, so it returned digits from seven
   upward while the other two kept spelling. Three ceilings nobody chose
   together, each invisible from the others. This goes to twenty, the widest of
   them, so no caller loses a word it used to have.

   IT FALLS BACK TO DIGITS RATHER THAN INVENTING A WORD. A wrong word is worse
   than a plain number, and by the time a list here passes twenty somebody will
   have read the sentence it lands in.

   PLAIN .js, NOT .ts, for the reason src/lib/trades.js and src/lib/pricing.js
   give: scripts/gen-og.mjs and the print renderers are plain Node and cannot
   import a TypeScript module at all. A count that only the Astro build can read
   is a count the printed client sheet has to type by hand.
   ============================================================================ */

const WORDS = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight',
  'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen',
  'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty',
];

/**
 * Spell a small count, optionally capitalized for the start of a sentence.
 *
 * @param {number} n
 * @param {{capital?: boolean}} [opts]
 * @returns {string}
 */
export const countWord = (n, opts) => {
  const w = WORDS[n] ?? String(n);
  return opts?.capital ? w.charAt(0).toUpperCase() + w.slice(1) : w;
};
