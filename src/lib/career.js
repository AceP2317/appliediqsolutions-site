/* ============================================================================
   THE OPERATIONS CAREER LENGTH — derived, never written as a literal.

   This is now the site's central claim (D33), so it appears on the home page,
   on the home share card, and in the off-site copy. A hardcoded "14" is wrong
   from one particular morning onward and nothing anywhere would error.

   Plain ESM JavaScript rather than TypeScript for the reason in pricing.js:
   scripts/gen-og.mjs is a Node script and can import a .js module natively.
   Before this file existed, gen-og.mjs held the words "Fourteen years running
   operations." as a literal, under a comment instructing whoever edits the home
   page to change it too. That is a checklist, and a checklist is the thing this
   module replaces — see LEDGER L-196.

   SOURCE: two of Ian's own resumes, both sent to external parties, which is the
   same test the off-repo sourcing ledger applies. The dates agree across both.
   June 2012 is the first supervisor role on a restaurant floor; the run to today
   is continuous across restaurant, banking, a clinic, an insurance desk, and the
   planning floor of a home-appliance plant.

   THE DIVISOR LAGS THE CALENDAR, deliberately and worth knowing. Dividing by
   365.25 days means fifteen calendar years from June 2012 measures 14.998, so
   the count rolls to 15 in AUGUST 2027 rather than on the June anniversary.
   That is a conservative direction — it under-claims for two months rather than
   over-claiming for any — which is why it is left alone.
   ============================================================================ */
import { countWord } from './count-words.js';

/** June 2012 — the first supervisor role on a restaurant floor. */
export const OPS_CAREER_START_MS = Date.UTC(2012, 5, 1);

const YEAR_MS = 365.25 * 24 * 60 * 60 * 1000;

/**
 * Whole years of continuous operations work, as of now.
 * @param {number} [now] epoch ms; injectable so a check can ask about a date.
 * @returns {number}
 */
export const opsYears = (now = Date.now()) =>
  Math.floor((now - OPS_CAREER_START_MS) / YEAR_MS);

/**
 * The same figure spelled out, for prose and for the share cards.
 *
 * THE WORD LIST MOVED OUT ON 2026-09-13, to src/lib/count-words.js. It was one
 * of three copies of the same array and the same capitalize-and-fall-back
 * logic, and the three had drifted to three different ceilings — twenty here,
 * ten in trades.js, six in founding.ts — none of them chosen against the others.
 * Behavior here is unchanged: the shared list carries this file's twenty,
 * because it was the widest.
 *
 * @param {{capital?: boolean, now?: number}} [opts]
 * @returns {string}
 */
export const opsYearsWord = (opts) => countWord(opsYears(opts?.now), opts);
