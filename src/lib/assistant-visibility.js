/* ============================================================================
   WHETHER AN AI ASSISTANT NAMES A BUSINESS, AND WHAT CHANGED SINCE LAST MONTH.

   ── THIS ENGINE REACHES NOTHING, AND THAT IS THE DESIGN RATHER THAN A LIMIT ───

   It takes READINGS that a person already took and computes what moved. No fetch,
   no API key, no host to allowlist. The operator asks each assistant the questions
   himself — the same way every `assisted` claim in src/data/external-claims.js is
   refreshed, by driving a signed-in browser — and records what came back.

   THAT WAS CHECKED RATHER THAN ASSUMED, ON 2026-09-11. The approved plan carried a
   stop condition: if the measuring could not query an assistant without breaking
   the five-host allowlist or fetching a client's own site, the product waited. The
   stop condition does not fire, and the reason is that the question was aimed at
   the wrong rule. REACHABLE_HOSTS governs automated CLAIM PROBES in
   check-external.mjs; it has nothing to say about a product's runtime. And the
   product does not need a runtime that reaches anything, because the plan's own
   economics are an hour of the operator's time a month, which is a person asking.

   D49 AND L-248 STILL BIND AND ARE EASY TO BREAK HERE. Nothing in this file may
   ever fetch a client's own website to see whether an assistant cited it. A client
   host never goes on REACHABLE_HOSTS, permanently, and the moment this engine grows
   a network call it becomes the thing that rule exists to refuse. If a later
   version needs one, that is a decision and not a refactor.

   ── WHAT IT REFUSES TO DO, WHICH IS THE PRODUCT ──────────────────────────────

   IT NEVER CLAIMS CAUSATION. No vendor selling this demonstrates that anything
   they did caused anything an assistant says, and the honest version says so out
   loud rather than implying a link by putting an action and a result on one page.
   This computes what CHANGED between two dated readings and nothing else. Where a
   reader could mistake a change for a result, `problems` says the quiet part.

   IT INVENTS NO BENCHMARK, NO TARGET AND NO SCORE. A "visibility score" is a
   number with no unit that reads like a measurement, and there is nothing to
   compare one against. What comes back is counts of readings, which are facts.

   IT REFUSES A COMPARISON IT CANNOT MAKE. Two readings taken on different question
   sets are not comparable, and a month with one reading has no trend. Both return a
   named refusal rather than a plausible figure — the same contract every engine on
   the shelf keeps.

   Plain ESM JavaScript, no React, so a Node gate imports and checks the same
   function a page runs.
   ============================================================================ */

/** One assistant's answer to one question on one date.
 *
 *  `named` is the only judgment in the whole input and a PERSON makes it: did the
 *  answer name this business. Everything downstream is counting.
 *
 *  @typedef {object} Reading
 *  @property {string} date      ISO date the question was asked.
 *  @property {string} assistant Which assistant answered.
 *  @property {string} question  The question as asked, verbatim.
 *  @property {boolean} named    Whether the answer named the business.
 *  @property {string} [cited]   A source the answer credited, if it credited one.
 */

/** Normalize a question for comparison. Trailing punctuation and case are not
 *  differences worth splitting a question set over; wording is. */
const key = (q) => String(q ?? '').trim().toLowerCase().replace(/[?.!]+$/, '');

/** The distinct questions in a set of readings, as a sorted array. */
function questionSet(readings) {
  return [...new Set(readings.map((r) => key(r.question)))].sort();
}

/** Are two reading sets asking the same thing? Compared as sets rather than
 *  counts, because two months that each asked six questions can still have asked
 *  six DIFFERENT ones, and a count would call that comparable. */
function sameQuestions(a, b) {
  const qa = questionSet(a);
  const qb = questionSet(b);
  return qa.length === qb.length && qa.every((q, i) => q === qb[i]);
}

/**
 * Count one month of readings, and say what changed against the month before it.
 *
 * @param {Reading[]} current  This month's readings.
 * @param {Reading[]} previous Last month's. Pass an empty array for a first month.
 * @returns {{
 *   named: number, asked: number, assistants: string[], questions: string[],
 *   cited: string[], change: null | {named: number, asked: number},
 *   problems: string[],
 * }}
 */
export function readVisibility(current = [], previous = []) {
  const problems = [];
  const rows = Array.isArray(current) ? current : [];
  const prior = Array.isArray(previous) ? previous : [];

  const asked = rows.length;
  const named = rows.filter((r) => r.named === true).length;
  const assistants = [...new Set(rows.map((r) => String(r.assistant ?? '').trim()).filter(Boolean))].sort();
  const questions = questionSet(rows);
  const cited = [...new Set(rows.map((r) => String(r.cited ?? '').trim()).filter(Boolean))].sort();

  /* ── what the input cannot support ─────────────────────────────────────── */

  if (asked === 0) {
    problems.push('No readings were recorded this month, so there is nothing to report. An empty month is not a month with no mentions — it is a month nobody asked.');
  }

  for (const r of rows) {
    if (typeof r.named !== 'boolean') {
      problems.push(`"${r.question ?? 'a question with no text'}" has no yes-or-no recorded for whether the answer named you, so it is counted as not naming you. That is a missing reading rather than a negative one.`);
    }
    if (!String(r.assistant ?? '').trim()) {
      problems.push(`A reading dated ${r.date ?? 'with no date'} does not say which assistant answered, so it cannot be told apart from any other.`);
    }
    if (!String(r.date ?? '').trim()) {
      problems.push(`A reading for "${r.question ?? 'an untitled question'}" has no date, so nothing can place it in a month.`);
    }
  }

  const seen = new Set();
  for (const r of rows) {
    const id = `${r.date}|${r.assistant}|${key(r.question)}`;
    if (seen.has(id)) {
      problems.push(`The same question was recorded twice for ${r.assistant} on ${r.date}, so one answer is counted as two readings.`);
    }
    seen.add(id);
  }

  /* ── the comparison, and the two shapes it refuses ────────────────────── */

  let change = null;
  if (prior.length === 0) {
    problems.push('There is no previous month to compare against, so nothing here is a change. A first month is a starting point and reads as one.');
  } else if (!sameQuestions(rows, prior)) {
    problems.push('This month asked a different set of questions than last month, so the two cannot be compared. A count that moved because the questions moved is not a change in how often you are named.');
  } else if (asked === 0) {
    // already reported above; no second complaint for the same fact
  } else {
    change = { named: named - prior.filter((r) => r.named === true).length, asked: asked - prior.length };
  }

  /* ── the refusal that is the whole product ────────────────────────────── */

  if (change && change.named !== 0) {
    problems.push('This moved, and nothing here says why. No part of this report claims that anything done to your website caused it — assistants change their own answers, and nobody selling this can show otherwise.');
  }

  return { named, asked, assistants, questions, cited, change, problems };
}

/** The sentence that travels with every report, in the engine rather than on a
 *  page, so no surface can print the figures without it. */
export const CAUSATION_REFUSAL =
  'This report says what changed. It does not say what caused it, and it never will: no method exists that shows a change to your website moved an assistant’s answer, and anyone selling you one is guessing.';
