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

   INSURANCE WAS ADDED LAST, 2026-09-13, and the gap it closed was not cosmetic.
   These beats are DOMAINS and they came from four employers — the plant gives
   two, the casino restaurant gives two. /bio/ counted EMPLOYERS instead and said
   "five trades", so the two lists were never the same set at two granularities:
   the licensed insurance practice was in the bio, in docs/career-record.md, and
   in no beat of the line every visitor reads first. Operator's call to add it,
   and to append rather than insert — the six above keep the order he settled on
   2026-08-26, so this is an addition and not a re-litigation.

   AND /bio/ NO LONGER PRINTS A COUNT AT ALL. Same call, same day. The home page
   said "Six domains" in its opening band while the navigation on that same page
   said "Five trades before the software", so a reader met both numbers without
   opening a second page. One list counts itself here; nothing else counts.
   scripts/check-dist.mjs refuses a spelled number typed beside "trades" or
   "domains" anywhere in src/, so this cannot come back as a checklist item.

   THE EMPLOYER IS NEVER NAMED (D1, D8). Nothing in this list goes near it.
   ============================================================================ */
import { countWord } from './count-words.js';

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
  'Insurance',
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

/**
 * How many domains there are, spelled out — so no sentence anywhere types a
 * count beside a list it cannot see.
 *
 * THE WORD LIST MOVED OUT ON 2026-09-13, to src/lib/count-words.js, which was
 * the third copy of it becoming a fourth. This one used to stop at ten; the
 * shared list spells to twenty, so nothing here loses a word.
 *
 * @param {{capital?: boolean}} [opts]
 */
export const tradeCountWord = (opts) => countWord(TRADES.length, opts);

/**
 * The beats that are the CURRENT work at the plant rather than history.
 *
 * NAMED HERE BECAUSE A SECOND PAGE DOES ARITHMETIC ON THIS LIST. /supply-chain/
 * says "before that in operations in N other industries", and that N is the
 * whole list minus the work he is doing now — which was typed as "five" and was
 * correct only by coincidence. Deriving it needed somebody to decide WHICH
 * beats are the present tense, and that decision belongs beside the list rather
 * than inside a sentence on one page.
 *
 * Both of these are the appliance plant. The list's own header records why
 * Manufacturing is here at all: he does supply chain AT a manufacturer, and the
 * beat was added on the operator's explicit call without claiming he runs
 * manufacturing.
 *
 * @type {readonly string[]}
 */
export const CURRENT_WORK = Object.freeze(['Global Supply Chain', 'Manufacturing']);

/* A list that names its members by string has to be checked against the list it
   names, or a rename leaves it pointing at nothing and the subtraction below
   silently returns the wrong number. */
const strays = CURRENT_WORK.filter((t) => !TRADES.includes(t));
if (strays.length) {
  throw new Error(`trades.js: CURRENT_WORK names ${strays.join(', ')}, which TRADES does not contain.`);
}

/**
 * How many domains predate the current work, spelled out — the count
 * /supply-chain/ needs, derived rather than typed.
 * @param {{capital?: boolean}} [opts]
 */
export const priorTradeCountWord = (opts) => countWord(TRADES.length - CURRENT_WORK.length, opts);

/**
 * The domains a New Bern reader passes on their own street.
 *
 * WHY THIS IS A LIST AND NOT THE NUMBER FOUR. Three sentences on this site say
 * "Four of those five are on a New Bern street", and the five was the old
 * employer grouping rather than the domains above. FOUR WAS NEVER WRONG — it is
 * the count of street-front trades and it does not move — but the denominator
 * did, and a fraction whose halves come from two different groupings is a
 * sentence nobody can check.
 *
 * OPERATOR'S CALL, 2026-09-13: the seven domains are the frame everywhere,
 * "regardless of local business, the domain depth transfers". So the fraction is
 * four of seven now, and both halves count the same list.
 *
 * WHAT IS DELIBERATELY ABSENT, because the omissions are the claim:
 *   · Casino Operations. North Carolina's only casinos are tribal, at Cherokee
 *     and Kings Mountain, both far west of Craven County. Checked 2026-09-13.
 *   · Global Supply Chain and Manufacturing. Both are the appliance plant —
 *     in town, and not a business anybody walks past on a street.
 *
 * @type {readonly string[]}
 */
export const STREET_FRONT = Object.freeze([
  'Bank Lending',
  'Service Industry',
  'Clinical Care',
  'Insurance',
]);

const notTrades = STREET_FRONT.filter((t) => !TRADES.includes(t));
if (notTrades.length) {
  throw new Error(`trades.js: STREET_FRONT names ${notTrades.join(', ')}, which TRADES does not contain.`);
}

/** How many domains a New Bern reader passes on their own street, spelled out. */
export const streetFrontCountWord = (opts) => countWord(STREET_FRONT.length, opts);

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
