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

/* ============================================================================
   THE HOUSE FORMATS — how a factory demo writes numbers, dates and times.

   Ported from dev/login-starter/lib/house/format.ts on 2026-09-23, when Ian
   brought the seven factory demos under the house conventions MD04 set that
   day. One copy, so two screens can never disagree; a factory demo that formats
   a date on its own is refused by scripts/guards/fast/a-factory-demo-formats-a-
   date-itself.sh.

   The house rules, each Ian's call (tool-conventions references/house-look.md):
     - Dates read "22 Sep 2026": the month is spelled, so nobody confuses the US
       and European orders.
     - Times are 12-hour and a moment in time says ET.
     - A negative number carries a real minus sign (U+2212), and a change
       carries + when it is up. The hyphen is shorter and narrower than a digit,
       so a column of mixed signs stops lining up.
     - A blank means nothing is there; 0 means a genuine zero. The caller says
       which it means.
     - Identifiers (material numbers, plant codes) are never grouped.

   THE NAME IS `figure`, NOT `num`, because `num` above already PARSES a number
   out of a text input and nine shelf files call it. Two exports with one name
   and opposite directions would be a trap for the next caller.
   ============================================================================ */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const MINUS = '\u2212';
const ZONE = 'America/New_York';

/**
 * 15725 → "15,725"; −233 → "−233"; with sign: 12 → "+12".
 * Zero is blank unless the caller says a zero is an answer.
 * @param {number|null|undefined} n
 * @param {{zeroMeans?: 'nothing'|'zero', sign?: boolean, digits?: number, empty?: string}} [opts]
 *   empty is what a missing value prints (default blank).
 */
export function figure(n, opts = {}) {
  const { zeroMeans = 'nothing', sign = false, digits = 0, empty = '' } = opts;
  if (n === null || n === undefined || Number.isNaN(n)) return empty;
  const rounded = Number(n.toFixed(digits));
  if (rounded === 0) return zeroMeans === 'zero' ? (0).toFixed(digits) : empty;
  const body = Math.abs(rounded).toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  if (rounded < 0) return MINUS + body;
  return (sign ? '+' : '') + body;
}

/**
 * A share as a percentage: 0.337 → "33.7%". Same sign and zero rules as figure().
 * @param {number|null|undefined} share a fraction, not a percentage
 * @param {{digits?: number, sign?: boolean, zeroMeans?: 'nothing'|'zero', empty?: string}} [opts]
 */
export function percent(share, opts = {}) {
  const { digits = 1, ...rest } = opts;
  if (share === null || share === undefined || Number.isNaN(share)) return rest.empty ?? '';
  const s = figure(share * 100, { digits, zeroMeans: 'zero', ...rest });
  return s === '' ? s : s + '%';
}

/**
 * Whole dollars with the house minus: −1234 → "−$1,234". money() above keeps
 * the hyphen because verify-check.mjs asserts its strings literally.
 * @param {number|null|undefined} n
 * @param {{zeroMeans?: 'nothing'|'zero', sign?: boolean, empty?: string}} [opts]
 */
export function dollars(n, opts = {}) {
  /* Built on money(), not beside it: a dollar sign glued on by hand is the
     L-379 mistake scripts/guards/fast/a-shared-helper-exists-… refuses. money()
     writes the magnitude; only the sign is the house's. */
  const { zeroMeans = 'zero', sign = false, empty = '' } = opts;
  if (n === null || n === undefined || Number.isNaN(n)) return empty;
  const r = Math.round(n);
  if (r === 0 && zeroMeans !== 'zero') return empty;
  const body = money(Math.abs(r));
  if (r < 0) return MINUS + body;
  return (sign && r > 0 ? '+' : '') + body;
}

/** A code that only looks like a number — never grouped. 1710 → "1710". */
export function ident(code) {
  return code === null || code === undefined ? '' : String(code);
}

function parts(value) {
  /* A bare calendar date ("2026-11-04") is a day, not a moment, so it is read
     as written and never shifted through a zone. */
  if (typeof value === 'string') {
    const bare = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (bare) return { y: +bare[1], m: +bare[2], d: +bare[3] };
  }
  const when = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(when.getTime())) return null;
  const bits = new Intl.DateTimeFormat('en-US', {
    timeZone: ZONE, year: 'numeric', month: 'numeric', day: 'numeric',
  }).formatToParts(when);
  const pick = (t) => Number(bits.find((b) => b.type === t)?.value);
  return { y: pick('year'), m: pick('month'), d: pick('day') };
}

/** "2026-11-04" or a timestamp → "4 Nov 2026". A missing value is an empty string. */
export function date(value) {
  if (value === null || value === undefined || value === '') return '';
  const p = parts(value);
  return p ? `${p.d} ${MONTHS[p.m - 1]} ${p.y}` : '';
}

/** "2026-11-04" → "4 Nov", for tight columns and chart axes. */
export function dateShort(value) {
  if (value === null || value === undefined || value === '') return '';
  const p = parts(value);
  return p ? `${p.d} ${MONTHS[p.m - 1]}` : '';
}

/** A moment → "11:29 AM ET". */
export function time(value) {
  if (value === null || value === undefined || value === '') return '';
  const when = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(when.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', { timeZone: ZONE, hour: 'numeric', minute: '2-digit' }).format(when) + ' ET';
}

/** A moment → "23 Sep 2026, 11:29 AM ET". */
export function stamp(value) {
  const d = date(value);
  return d ? `${d}, ${time(value)}` : '';
}

/** Today in Eastern Time as YYYY-MM-DD, for a filename. */
export function todayEt() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: ZONE }).format(new Date());
}

/**
 * A count with its noun, in a sentence: count(1, 'decision') → "1 decision",
 * count(3, 'decision') → "3 decisions", count(2, 'item', 'items on screen').
 * Never "decision(s)": a sentence that hedges its own grammar reads as unfinished.
 * @param {number} n
 * @param {string} one the singular
 * @param {string} [many] the plural, when adding an s is wrong
 */
export function count(n, one, many) {
  return `${figure(n, { zeroMeans: 'zero' })} ${n === 1 ? one : (many ?? one + 's')}`;
}
