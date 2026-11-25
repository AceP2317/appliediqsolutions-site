/* ============================================================================
   HOW TO REACH THE PRACTICE — held once, read by pages, by structured data and
   now by a printed sheet.

   WHY IT MOVED OUT OF links.ts ON 2026-09-10, WHICH IS THE SECOND TIME THIS
   EXACT THING HAS HAPPENED. links.ts's own note records the first: the
   telephone lived inside BusinessCard.astro, so the two pages that draw a card
   carried it and nothing else did — including the ProfessionalService node in
   the structured data, where a telephone is one of the few things that
   distinguishes a local business from a page about one. Its closing sentence
   was "the only thing keeping it off the rest of the site was that no other
   file could see it."

   THAT SENTENCE CAME TRUE AGAIN ONE LAYER OUT. links.ts is TypeScript, and a
   scripts/*.mjs build script imports plain ESM natively and cannot import a .ts
   module without a loader flag. So the client comparison sheet — a document a
   prospect keeps in a drawer for six weeks — printed a domain and no way to
   reach anybody. Moving the values to plain ESM is the same fix src/lib/
   pricing.js exists to apply to the published figures.

   links.ts RE-EXPORTS ALL FOUR, so every consumer that reads them today is
   untouched and there is still exactly one definition of each.

   D65 SETTLED THE PRIVACY QUESTION and nothing here reopens it: the number
   below is a Google Voice line for the business, D21 published it on Nextdoor
   by choice, and npm run gate REFUSES a build whose /card/ page does not carry
   it. The number that is actually private is named in the public mirror's
   denylist and is not in this repo.
   ============================================================================ */

/** The address on the site's own contact form and in its structured data. */
export const siteEmail = 'contact@appliediqsolutions.com';

/** The address a person writes to. It goes on the business card and on any
 *  sheet a client keeps, because a shared inbox alias is not what somebody
 *  reaches for six weeks after a conversation. */
export const cardEmail = 'ian@appliediqsolutions.com';

/* Two shapes because two things read them: `tel:` wants the E.164 form, a human
   wants the spaced one, and writing either twice is how they drift. */
export const businessPhone = '+12523490620';
export const businessPhoneDisplay = '(252) 349-0620';

/** Where the practice is. Printed under the masthead of anything a client
 *  keeps, because a local business that does not say where it is asks its
 *  reader to take one more thing on trust. */
export const businessTown = 'New Bern, NC';

/** The name on the paperwork. house-terms.js holds the same string for the
 *  agreements; this one is the printed byline, and they are allowed to be two
 *  because one is a legal party and the other is a signature on a sheet. */
export const operatorName = 'Ian David Provencher';

/** Refuse a build that would print an empty contact line. A masthead with a
 *  blank where a telephone number should be reads as an unfinished document,
 *  which is worse than one that never promised a number at all. */
export function assertContactable(who) {
  const missing = Object.entries({
    cardEmail,
    businessPhoneDisplay,
    businessTown,
    operatorName,
  }).filter(([, v]) => !v || !String(v).trim());
  if (!missing.length) return;
  console.error(`${who}: ${missing.length} contact field(s) are empty: ${missing.map(([k]) => k).join(', ')}`);
  process.exit(2);
}
