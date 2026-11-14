/* ============================================================================
   THE REPLY PROMISE — one wording, one place.

   WHAT THIS REPLACES. Until 2026-09-03 the promise "I reply within one business
   day" was hand-typed in five files and eleven sentences with no shared source
   and nothing comparing them. They had already drifted: three said "one business
   day" flat and three said "about one business day", which is two different
   promises on one site depending which page you landed on.

   WHY THE WORDING CHANGED. The operator holds a full-time job on a plant's
   planning floor. One business day is a promise a bad week breaks, and a broken
   timing promise is the thing a buyer repeats to other people. The new shape has
   an inner half that reads fast and an OUTER half that binds -- a week is wide
   enough to survive a brutal stretch, so the sentence stays true instead of
   staying impressive.

   THE TWO HALVES TRAVEL TOGETHER, and that is the point of the module rather
   than a convention to remember. Showing "usually a day or two" without "always
   within a week" publishes the fast half as the commitment, which is the exact
   promise this change exists to stop making. Same enforcement pattern as
   FLOOR_QUALIFIER in ./pricing.js.

   Plain ESM JavaScript, not TypeScript, on purpose: a .mjs gate script imports a
   .js module natively on Node 22.12 and cannot import a .ts module without a
   loader flag. Keeping it importable by the gates is what stops a sixth copy
   appearing inside a check.

   NOT the same promise as docs/engagement/client-documents/support-and-incidents.md.
   That document's tiers are what a PAYING CLIENT is owed and they are deliberately
   tighter. This module is what a stranger who filled in a form is told.
   ============================================================================ */

/** The typical case. Never published without REPLY_OUTER beside it. */
export const REPLY_TYPICAL = 'usually within a day or two';

/** The half that binds. This is the promise; the one above is the expectation. */
export const REPLY_OUTER = 'always within a week';

/** The full sentence, for anywhere with room for a sentence. */
export const REPLY_LINE =
  'I read every message myself. Usually you will hear back within a day or two, and always within a week.';

/** The compact form, for a step label or a list item where a sentence will not fit. */
export const REPLY_SHORT = 'usually a day or two, always within a week';
