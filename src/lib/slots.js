/* ============================================================================
   THE SLOTS A VISITOR MAY ASK FOR.

   THEY ARE REQUESTS, NOT BOOKINGS, and that is a design decision rather than a
   limitation being apologised for. D52 refused a booking flow because the
   operator will not give a page authority over his calendar, and the whole
   reason was that rather than anything technical. A visitor naming two windows
   he then confirms by hand takes no authority from him: the two clicks that
   stay human -- confirm the slot, press Send -- stay human.

   IT FOLLOWS THAT NOTHING HERE IS RESERVED. The Worker has exactly one binding,
   static assets, so there is no store and two visitors can ask for the same
   Tuesday. That is only a defect if the page calls them bookings. It does not.

   ── THE PART THAT IS ACTUALLY HARD ────────────────────────────────────────
   Turning "5:00 PM Eastern on the 9th" into a moment in time needs the offset
   IN FORCE ON THAT DATE, which is -5 for most of the year and -4 for most of the
   summer. Assuming either one is wrong for months at a time, and wrong by
   exactly one hour -- which is the least visible size an error can be, because
   every slot still looks like a plausible slot.

   So the offset is READ OUT of the platform's own zone database rather than
   assumed: format a candidate instant in the zone, see what wall clock it shows,
   and subtract the difference. That needs a second pass, because the first
   correction can itself land on the other side of a transition.

   HOURS ARE ADDED TO A WALL CLOCK, NEVER TO AN INSTANT. Adding 24 hours to a
   moment crosses a daylight-saving change and arrives an hour off; adding one
   calendar day to a date does not. Every step below walks civil dates.

   scripts/verify-slots.mjs drives this across both 2026 transitions. A slot
   engine that is right in November and wrong in April is the ordinary outcome
   of writing one of these without that check.
   ============================================================================ */

import { CONSULT_HOURS, TIME_ZONE, hoursForDay, toMinutes } from './consult-hours.js';

/** What wall clock does `instant` show in `timeZone`, minus what it shows in
 *  UTC. The zone database answers this; nothing here hardcodes an offset. */
function offsetMs(instant, timeZone) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const p = {};
  for (const part of dtf.formatToParts(instant)) p[part.type] = part.value;
  /* `hour` comes back as "24" for midnight from some ICU builds under
     hour12:false. The modulo is not defensive padding -- without it, midnight
     resolves a full day out. */
  const asIfUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second);
  return asIfUTC - instant.getTime();
}

/**
 * A civil date and wall time in a zone -> the instant it names.
 *
 * Two passes, and the second is not belt-and-braces. The first guess uses the
 * offset in force at the NAIVE instant, which on a transition weekend can be the
 * wrong side of the change; re-reading the offset at the corrected instant
 * settles it. On the one ambiguous hour a year this lands on a real moment
 * rather than throwing, which is right here: the ambiguous hour is 2am on a
 * Sunday and no window reaches it. THIS SAID "and Sunday is closed" UNTIL
 * 2026-09-03, when Sunday opened. The conclusion survives and its reason did
 * not -- Sunday now opens at 08:00, which is six hours clear of the fold, so
 * what protects this is the WINDOW rather than the day being shut.
 */
export function zonedToInstant(year, month, day, minutesOfDay, timeZone = TIME_ZONE) {
  const naive = Date.UTC(year, month - 1, day, Math.floor(minutesOfDay / 60), minutesOfDay % 60);
  let ts = naive - offsetMs(new Date(naive), timeZone);
  ts = naive - offsetMs(new Date(ts), timeZone);
  return new Date(ts);
}

/** The civil date `instant` falls on inside `timeZone`. Needed because "which
 *  day is it" is a different question in Raleigh and in London, and the walk
 *  below has to start on the operator's day, not the visitor's. */
export function zonedDate(instant, timeZone = TIME_ZONE) {
  const dtf = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const [year, month, day] = dtf.format(instant).split('-').map(Number);
  return { year, month, day };
}

/** Weekday of a civil date, 0 = Sunday. Zone-free on purpose: a calendar date's
 *  weekday is the same everywhere, so building it in UTC introduces no offset. */
function weekdayOf({ year, month, day }) {
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

/** One civil day later, with month and year rollover handled by Date itself
 *  rather than by arithmetic somebody has to get right in February. */
function nextDay({ year, month, day }) {
  const d = new Date(Date.UTC(year, month - 1, day + 1));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

/**
 * The next `count` slots a visitor may ask for.
 *
 * `now` is a parameter and not `new Date()` inside the function, which is what
 * makes this checkable: a gate can ask it about a Friday in March and a Thursday
 * in October and get an answer it can work out by hand.
 *
 * Returns [{ iso, year, month, day, minutesOfDay }], earliest first. Formatting
 * is deliberately absent — a label depends on the reader's own zone, which is a
 * browser question, and putting it here would make this module unusable from a
 * Node gate for no gain.
 */
export function availableSlots({
  now = new Date(),
  hours = CONSULT_HOURS,
  timeZone = TIME_ZONE,
  minutes = 30,
  leadHours = 24,
  horizonDays = 10,
  count = 6,
  /* AT MOST THIS MANY FROM ANY ONE DAY, and it is the difference between a
     choice and no choice. Taking the first six in order filled the whole grid
     with a single evening, so a visitor who could not do that one day was shown
     six options and had none. Caught by looking at the rendered page; every
     functional check passed on it, because every slot in it was a perfectly
     correct slot.

     The clock times that used to be quoted here came out on 2026-09-03 when the
     windows moved. The lesson does not depend on them and a stale example beside
     a live rule is worse than no example. */
  perDay = 2,
} = {}) {
  const earliest = now.getTime() + leadHours * 3600 * 1000;
  const out = [];

  let date = zonedDate(new Date(earliest), timeZone);
  for (let i = 0; i < horizonDays && out.length < count; i += 1) {
    const row = hoursForDay(weekdayOf(date), hours);
    if (row) {
      const open = toMinutes(row.open);
      const close = toMinutes(row.close);
      const day = [];
      /* `+ minutes <= close` and not `< close`: a slot has to FINISH inside the
         window. Without it the last slot of every evening runs past closing,
         which is the one slot most likely to be picked by somebody coming
         straight from their own working day. */
      for (let m = open; m + minutes <= close; m += minutes) {
        const instant = zonedToInstant(date.year, date.month, date.day, m, timeZone);
        if (instant.getTime() < earliest) continue;
        day.push({
          iso: instant.toISOString(),
          year: date.year,
          month: date.month,
          day: date.day,
          minutesOfDay: m,
        });
      }
      /* SPREAD ACROSS THE DAY, NOT THE FIRST FEW OF IT. The earliest and the
         latest, with the rest evenly between, so a Saturday offers a morning and
         an afternoon rather than two slots half an hour apart. Somebody who
         cannot do 9am can usually do 2pm; two consecutive 9s help nobody. */
      for (const s of spread(day, perDay)) {
        if (out.length >= count) break;
        out.push(s);
      }
    }
    date = nextDay(date);
  }

  return out;
}

/** `take` items from `list`, evenly spaced, always including the first and last
 *  when there is room for both. */
function spread(list, take) {
  if (list.length <= take) return list;
  if (take <= 1) return list.slice(0, take);
  const out = [];
  for (let i = 0; i < take; i += 1) {
    out.push(list[Math.round((i * (list.length - 1)) / (take - 1))]);
  }
  return out;
}

/**
 * A slot, as a person reads it. Browser-side: `viewerZone` defaults to whatever
 * the reader's own machine says, which is undefined in Node and there falls back
 * to the operator's zone.
 *
 * BOTH ZONES APPEAR WHEN THEY DIFFER, because D29 makes the market a small local
 * business ANYWHERE and New Bern is not a fence. A visitor in Denver reading a
 * bare "5:30 PM" has been handed a wrong answer that looks right.
 */
export function slotLabel(slot, timeZone = TIME_ZONE, viewerZone) {
  const instant = new Date(slot.iso);
  const fmt = (zone) =>
    new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(instant);

  const here = fmt(timeZone);
  let viewer = null;
  try {
    const z = viewerZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (z && z !== timeZone) viewer = fmt(z);
  } catch {
    /* A browser that will not report its zone gets the operator's time with its
       zone named beside it, which is still a correct answer rather than a
       silently wrong one. */
  }
  return { here, viewer };
}
