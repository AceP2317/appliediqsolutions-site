/* ============================================================================
   HOW MANY WEBSITE BUILDS CAN START — the rule held once, and the page derives.

   ── WHY THIS FILE EXISTS (D126, 2026-09-27) ──────────────────────────────────

   The operator asked for the open slots and the next start date on the site,
   so that a visitor sees the capacity is real and limited. That is only honest
   if every word of it comes from something true: the rule he actually keeps, and
   the builds he is actually running. This file holds both, and the page and the
   gate run the same functions over them.

   THE RULE IS REAL AND IT IS KEPT. At most BUILD_SLOTS builds run at once, and
   at most MONTHLY_STARTS start in any calendar month. A third start in a month
   is refused even when there is time for it, because the page says there are
   two, and a page that says two while the practice takes three is the page
   lying in the other direction.

   ── THE HONESTY LINE, AND IT IS NOT NEGOTIABLE ───────────────────────────────

   Same line as src/data/founding.ts. A build goes into BUILDS when it is
   genuinely booked, and never to make the page look busy. Scarcity a reader
   later discovers was staged costs the contract every other page rests on:
   that the figures here are true.

   ── WHY THE PAGE COMPUTES THIS IN THE VISITOR'S BROWSER ──────────────────────

   The site is static and rebuilds only on a push. A month name worked out at
   build time would say "October" all through November if nothing was pushed.
   So the page bakes in BUILDS and runs slotState() against the visitor's own
   today. Only starting or finishing a build needs a push.

   Plain ESM JavaScript, not TypeScript, so a .mjs gate imports the function the
   page runs rather than a copy of it.
   ============================================================================ */

/** Builds that run at once. */
export const BUILD_SLOTS = 2;

/** Builds that may START in any one calendar month. */
export const MONTHLY_STARTS = 2;

/** Days from kickoff to delivery on a paid website build. Kickoff is the day
 *  Consultant confirms in writing that the client has supplied everything the
 *  Scope asks for, so a late photograph moves the date rather than eating it.
 *
 *  THE OPERATOR CHOSE 30 OVER 45, KNOWING THE COST. With both slots full that is
 *  about 12 hours a week of building on the untimed 25-hour estimate for a
 *  three-page site, against 15 hours a week of evening call windows in
 *  src/lib/consult-hours.js. D126 records it as an accepted risk. The paid Scope
 *  states this number in words and scripts/check-paperwork.mjs holds it here. */
export const BUILD_DAYS = 30;

/** The zone every date here is read in. */
export const TIME_ZONE = 'America/New_York';

/* ── THE BUILDS, AND THE ONE LIST TO EDIT ──────────────────────────────────────
   One entry per booked build: `kickoff` as YYYY-MM-DD, and `delivered` as
   YYYY-MM-DD once it is handed over (null until then). NO CLIENT NAMES: this
   list ships inside the page's script, so anything written here is public.

   Add an entry the day a build is booked, with its kickoff date. Fill in
   `delivered` the day it is handed over. Leave delivered entries in place: a
   build that started this month counts against this month's starts even after
   it is finished. The founding build counts too once it kicks off — it takes
   the same evenings as a paid one. */
export const BUILDS = [];

/* ── CIVIL-DATE ARITHMETIC ─────────────────────────────────────────────────────
   Dates are YYYY-MM-DD strings compared as strings, and moved in UTC so a
   daylight-saving change can never shift one by a day. */
const DAY_MS = 86400000;
const toUTC = (d) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10));
const fromUTC = (ms) => new Date(ms).toISOString().slice(0, 10);

export const addDays = (d, n) => fromUTC(toUTC(d) + n * DAY_MS);
export const monthOf = (d) => d.slice(0, 7);
export const firstOfNextMonth = (d) => {
  const y = +d.slice(0, 4);
  const m = +d.slice(5, 7);
  return m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`;
};
export const lastOfMonth = (d) => addDays(firstOfNextMonth(d), -1);

/** Today's civil date in TIME_ZONE, from a real clock. The page calls this; the
 *  gate passes fixed dates instead. */
export function todayIn(zone = TIME_ZONE, now = new Date()) {
  // en-CA formats as YYYY-MM-DD, which is the only reason it is used here.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);
}

/** A month name for display, from a YYYY-MM-DD date. */
export const monthName = (d) =>
  new Date(toUTC(d)).toLocaleString('en-US', { month: 'long', timeZone: 'UTC' });

/** A short date for display: "November 1". */
export const shortDate = (d) =>
  new Date(toUTC(d)).toLocaleString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' });

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Every way the list can be wrong, as sentences. Empty means it is sound. The
 *  gate refuses a non-empty answer; the page renders nothing but the rule when
 *  it gets one, rather than a count computed from a broken list. */
export function problems(builds = BUILDS) {
  const out = [];
  const perMonth = {};
  for (const [i, b] of builds.entries()) {
    const at = `build ${i + 1}`;
    if (!b || !DATE_RE.test(b.kickoff ?? '')) { out.push(`${at} has no kickoff date in YYYY-MM-DD form`); continue; }
    if (b.delivered != null && !DATE_RE.test(b.delivered)) out.push(`${at} has a delivered date that is not YYYY-MM-DD`);
    if (b.delivered != null && b.delivered < b.kickoff) out.push(`${at} was delivered before it kicked off`);
    const m = monthOf(b.kickoff);
    perMonth[m] = (perMonth[m] ?? 0) + 1;
  }
  for (const [m, n] of Object.entries(perMonth)) {
    if (n > MONTHLY_STARTS) out.push(`${n} builds start in ${m}, and the rule allows ${MONTHLY_STARTS}`);
  }
  // At once: count builds occupying each kickoff day.
  for (const b of builds) {
    if (!DATE_RE.test(b?.kickoff ?? '')) continue;
    const day = b.kickoff;
    const busy = builds.filter((o) => DATE_RE.test(o?.kickoff ?? '')
      && o.kickoff <= day && (o.delivered == null ? addDays(o.kickoff, BUILD_DAYS) : o.delivered) > day).length;
    if (busy > BUILD_SLOTS) { out.push(`${busy} builds run at once on ${day}, and the rule allows ${BUILD_SLOTS}`); break; }
  }
  return out;
}

/** Builds booked but not yet delivered, whose due date is more than `graceDays`
 *  behind `today`. A delivered build left undelivered here shows a false "taken"
 *  slot on a public page, so the gate warns on every one. */
export function overdue(today, builds = BUILDS, graceDays = 14) {
  return builds.filter((b) => b.delivered == null
    && addDays(b.kickoff, BUILD_DAYS + graceDays) < today);
}

/**
 * The state of this month's start dates, for `today` (YYYY-MM-DD).
 *
 * A build occupies a slot from now until it is delivered. An undelivered build
 * is expected to end BUILD_DAYS after kickoff; one already past that date has an
 * unknown end, so its slot is treated as freeing on the first of next month —
 * the page must never name a date that has already gone.
 *
 * Returns:
 *   month        'YYYY-MM' of today
 *   startsLeft   MONTHLY_STARTS minus builds kicking off this month
 *   open         start dates still usable this month (0..MONTHLY_STARTS)
 *   nextStart    YYYY-MM-DD of the earliest possible start, never before today
 *   slots        MONTHLY_STARTS entries, { taken } — taken first, as a row fills
 */
export function slotState(today, builds = BUILDS) {
  const month = monthOf(today);
  const monthEnd = lastOfMonth(today);
  const nextMonth = firstOfNextMonth(today);

  const startedThisMonth = builds.filter((b) => monthOf(b.kickoff) === month).length;
  const startsLeft = Math.max(0, MONTHLY_STARTS - startedThisMonth);

  // The day each occupied slot frees, for every build not yet delivered.
  const frees = builds
    .filter((b) => b.delivered == null || b.delivered > today)
    .map((b) => {
      if (b.delivered != null) return b.delivered;
      const due = addDays(b.kickoff, BUILD_DAYS);
      return due > today ? due : nextMonth;
    })
    .sort();

  // Slot i is free from `today` if unoccupied, else from the day its build frees.
  const idle = Math.max(0, BUILD_SLOTS - frees.length);
  const freeDates = [
    ...Array.from({ length: idle }, () => today),
    ...frees.slice(0, BUILD_SLOTS - idle),
  ].sort();

  const usableThisMonth = freeDates.filter((d) => d <= monthEnd).length;
  const open = Math.min(startsLeft, usableThisMonth);

  // The earliest start: the first free slot, moved on a month at a time while
  // the month it lands in has no starts left.
  const startsIn = (m) => builds.filter((b) => monthOf(b.kickoff) === m).length;
  let nextStart = freeDates[0] ?? today;
  if (nextStart < today) nextStart = today;
  for (let guard = 0; guard < 24 && startsIn(monthOf(nextStart)) >= MONTHLY_STARTS; guard++) {
    nextStart = firstOfNextMonth(nextStart);
  }

  // Taken boxes first, as a row fills in real life.
  const slots = Array.from({ length: MONTHLY_STARTS }, (_, i) => ({
    n: i + 1,
    taken: i < MONTHLY_STARTS - open,
  }));

  return { month, startsLeft, open, nextStart, slots };
}
