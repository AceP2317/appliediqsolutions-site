/* ============================================================================
   WHEN THE OPERATOR WILL SIT DOWN FOR A BOOKED HALF HOUR — written down once.

   THIS FILE WAS src/lib/hours.js UNTIL 2026-09-03 AND THE RENAME IS THE POINT.
   These are NOT the hours on the Google Business Profile and they are no longer
   meant to be. A listing says when somebody could reach him. This says when he
   will sit down, uninterrupted, for a scheduled call — a narrower thing, and
   deliberately so. Anything named `hours.js` is what the next session greps for
   when asked "what are his hours", and it would re-sync the two. A name is a
   guard; a comment asking nicely is not.

   THE TWO ARE ALLOWED TO DISAGREE AND THE DISAGREEMENT IS THE DECISION. The
   listing stays wider because "open at the time of search" is a top-five local
   ranking factor, and narrowing it to match a consult grid would cost real
   visibility for nothing gained. Operator's call, 2026-09-03.

   WHERE THIS LIVED BEFORE. Nowhere the site could read. The real availability
   existed as prose in DECISIONS.md and as opening hours on the Google Business
   Profile, and a search of src/data/, the contact page and the off-repo copy
   file for opening-hours data found nothing at all. So a page could not have
   offered a correct time even if somebody had wanted it to.

   WHY IT MATTERS MORE THAN A TIDY-UP. That same decision rejected Google's
   `Open 24 hours` default, which always satisfies the open-at-time-of-search
   ranking signal, on the grounds that "a listing is a promise, and an unanswered
   call is worse than a closed sign." A slot grid offering a time he will not
   take is that same broken promise wearing a nicer interface.

   THE WINDOWS ARE HIS SECOND SHIFT, WHICH IS WHY THEY LOOK LIKE THIS. He holds a
   full-time job on a plant's planning floor, so the weekday window opens after
   it and the long clear stretches are weekend mornings. Do not "round" these to
   business hours. THIS PARAGRAPH SAID "Saturday is the long day" UNTIL
   2026-09-03, when Saturday afternoon came out and Sunday morning went in.

   A NARROW WINDOW IS NOT A FREE CHOICE, and the constraint is arithmetic rather
   than taste. src/lib/slots.js offers the FIRST and LAST start that fits a day,
   so a window of W minutes carrying a slot of L minutes puts those two W − L
   apart. At 30-minute slots a two-hour window offers 6:00 and 7:30, which is 90
   minutes of daylight between them. Go much narrower and the two offers stop
   being a real choice, which is what scripts/verify-slots.mjs checks.

   THE GOOGLE LISTING IS PASTED BY HAND AND THIS MODULE CANNOT REACH IT. Nothing
   here can read it, no gate can see it, and no claim in
   src/data/external-claims.js ages it. Since 2026-09-03 the two are meant to
   differ, so a difference is no longer evidence of a mistake — which removes the
   only signal there was. If the listing ever needs to move, a person moves it.

   Plain ESM JavaScript, not TypeScript: a .mjs gate imports a .js module
   natively on Node 22.12 and cannot import a .ts one without a loader flag.
   ============================================================================ */

/** The zone the hours below are written in. Everything the visitor is shown is
 *  converted out of this, never assumed to match their own clock. */
export const TIME_ZONE = 'America/New_York';

/** Shown beside a time so a visitor in another zone knows what they are reading.
 *  Deliberately the plain name rather than an abbreviation: EST and EDT are the
 *  same place and swapping between them twice a year confuses more than it
 *  clarifies for someone who does not already know the difference. */
export const TIME_ZONE_LABEL = 'Eastern time';

/* `day` is JavaScript's own weekday numbering, 0 = Sunday through 6 = Saturday,
   so it can be compared straight against getUTCDay() on a civil date without a
   translation table nobody would remember to keep in step. A closed day is an
   ABSENT row rather than a present-and-empty one: an absent row is closed, and
   there is exactly one way to say that.

   NO DAY IS ABSENT AS OF 2026-09-03, and that is worth knowing before reading
   the gate. Sunday used to be, and scripts/verify-slots.mjs asserted directly
   that no slot ever landed on one — a check that read as a rule and was really a
   restatement of this array. It now injects its own closed day to test the rule,
   because a suite with no closed day left cannot prove it honours one. */
export const CONSULT_HOURS = [
  { day: 0, open: '08:00', close: '10:30' }, // Sunday
  { day: 1, open: '18:00', close: '20:00' }, // Monday
  { day: 2, open: '18:00', close: '20:00' }, // Tuesday
  { day: 3, open: '18:00', close: '20:00' }, // Wednesday
  { day: 4, open: '18:00', close: '20:00' }, // Thursday
  { day: 5, open: '18:00', close: '20:00' }, // Friday
  { day: 6, open: '08:00', close: '10:30' }, // Saturday
];

/** A minutes-past-midnight pair for one day, or null when that day is closed. */
export function hoursForDay(weekday, hours = CONSULT_HOURS) {
  return hours.find((h) => h.day === weekday) || null;
}

/** '18:00' -> 1080. Minutes past local midnight, which is the only arithmetic
 *  that stays correct across a daylight-saving change: adding to a WALL CLOCK is
 *  well defined, adding to an instant is not. */
export function toMinutes(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number);
  return h * 60 + m;
}
