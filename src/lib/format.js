/* ============================================================================
   NUMBER FORMATTING AND PARSING — one copy, importable everywhere.

   Plain ESM JavaScript rather than TypeScript, for the reason given in
   pricing.js: a .mjs gate script can import a .js module natively and cannot
   import a .ts one without a loader flag.

   money() reproduces exactly what src/components/CostCheck.jsx did before this
   module existed — en-US, USD, no fractional digits. The default MUST stay
   whole-dollar or the free check's rendered figures move, and scripts/
   verify-check.mjs asserts those strings literally.

   The cents option is not speculative. A tip split produces $43.75, and
   rounding that to a whole dollar is not a formatting preference, it is a wrong
   answer about somebody's money.

   This module grows only when a tool actually needs a helper. An unused export
   here is a guess about a tool that has not been built yet.
   ============================================================================ */

/**
 * Format a number as US currency.
 * @param {number} n
 * @param {{cents?: boolean}} [opts] cents:true keeps two decimal places.
 */
export const money = (n, opts) =>
  n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: opts?.cents ? 2 : 0,
    maximumFractionDigits: opts?.cents ? 2 : 0,
  });

/**
 * Coerce whatever a text input holds into a usable number.
 * Strips everything that is not a digit or a decimal point, so "$1,200" and
 * "1200 hrs" both land on 1200. Returns 0 rather than NaN, because NaN
 * propagates silently through arithmetic and 0 does not.
 * @param {unknown} v
 * @returns {number}
 */
export const num = (v) => {
  const n = Number(String(v).replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
};
