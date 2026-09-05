/* ============================================================================
   RECALL SHEET — the engine.

   Who is past the interval you set, sorted by how far past. That is the whole
   job, and it is deliberately the whole job.

   WHAT THIS WILL NOT DO, and the restraint is the point.
   It does not score anybody on how likely they are to book. It does not rank by
   value. It does not suggest a best time to call. Every one of those would be a
   guess about a person dressed up as arithmetic, and the moment a tool starts
   sorting people by predicted profitability it has become a different kind of
   thing than the one being sold here.

   THE FIELDS ARE A NAME, A WAY TO REACH THEM, AND A DATE. Nothing clinical,
   nothing diagnostic, nothing about why. A practice using this is keeping a call
   list, not a record, and the field list is what keeps it that way.

   Dates are plain ISO days. `today` is injected rather than read from the clock
   so a check can ask about any day it likes and get the same answer twice.
   ============================================================================ */

const DAY = 24 * 60 * 60 * 1000;

/** Whole days from a to b, both ISO date strings. Negative means b is earlier. */
export function daysBetween(a, b) {
  const x = Date.parse(a + 'T00:00:00Z');
  const y = Date.parse(b + 'T00:00:00Z');
  /* NULL rather than NaN. NaN compares false against everything, so a row with an
     unreadable date would have quietly sorted into "not yet" and never been
     called back — the worst outcome for a call list. */
  if (Number.isNaN(x) || Number.isNaN(y)) return null;
  return Math.round((y - x) / DAY);
}

/**
 * An ISO date `months` calendar months after `iso`, clamped to the month's end.
 * Returns NULL for anything it cannot read, and that is the important part.
 *
 * This threw `RangeError: Invalid time value` on any half-typed date. The field
 * is a text box, so somebody clearing it and typing "2" hands this "2" — and
 * toISOString() on an Invalid Date throws DURING RENDER, taking most of the tool
 * down with it. Measured: the page went from 4,101 characters to 1,960 on one
 * keystroke. A US-format date pasted from a practice system did the same.
 *
 * A function that formats a date has to survive being handed a non-date, because
 * the only way a person can type one is by passing through several.
 */
export function addMonths(iso, months) {
  const n = Number(months);
  if (!iso || !Number.isFinite(n)) return null;
  const d = new Date(iso + 'T00:00:00Z');
  if (Number.isNaN(d.getTime())) return null;
  const targetMonth = d.getUTCMonth() + Math.trunc(n);
  const out = new Date(Date.UTC(d.getUTCFullYear(), targetMonth, 1));
  /* A six-month recall from 31 August is not 31 February. Clamping to the last
     day of the landing month is the only answer that is never a wrong date. */
  const lastDay = new Date(Date.UTC(out.getUTCFullYear(), out.getUTCMonth() + 1, 0)).getUTCDate();
  out.setUTCDate(Math.min(d.getUTCDate(), lastDay));
  return out.toISOString().slice(0, 10);
}

export function computeRecall(input) {
  const { today, defaultInterval, people, soonWindow } = input;

  const rows = people.map((p) => {
    const interval = p.interval != null ? p.interval : defaultInterval;
    const due = addMonths(p.lastSeen, interval);
    const daysPast = due ? daysBetween(due, today) : null;
    /* An unreadable date is its own state, not "no date" — the difference
       matters, because one means nobody filled it in and the other means what is
       there cannot be read. Both get named below. */
    const unreadable = !!p.lastSeen && due === null;
    let state = unreadable ? 'bad date' : 'no date';
    if (daysPast != null) {
      if (daysPast > 0) state = 'overdue';
      else if (daysPast >= -soonWindow) state = 'due soon';
      else state = 'not yet';
    }
    return { ...p, interval, due, daysPast, state, unreadable };
  });

  /* Sorted by how far past, furthest first. That is the only ordering this tool
     applies, and it comes from a date rather than from a judgement about the
     person. */
  const overdue = rows.filter((r) => r.state === 'overdue').sort((a, b) => b.daysPast - a.daysPast);
  const soon = rows.filter((r) => r.state === 'due soon').sort((a, b) => b.daysPast - a.daysPast);
  const notYet = rows.filter((r) => r.state === 'not yet').sort((a, b) => b.daysPast - a.daysPast);
  const undated = rows.filter((r) => r.state === 'no date' || r.state === 'bad date');

  const problems = [];
  for (const r of undated) {
    problems.push(r.unreadable
      ? `${r.name}'s last-seen date reads "${r.lastSeen}", which is not a date this can use. It wants YYYY-MM-DD.`
      : `${r.name} has no last-seen date, so there is nothing to count from.`);
  }
  for (const r of rows.filter((x) => !x.contact)) {
    problems.push(`${r.name} has no phone or email on the list, so there is no way to call them back.`);
  }
  for (const r of rows.filter((x) => !x.unreadable && x.lastSeen && (daysBetween(today, x.lastSeen) ?? 0) > 0)) {
    problems.push(`${r.name} is down as last seen in the future, which cannot be right.`);
  }

  return {
    rows, overdue, soon, notYet, undated, today, soonWindow,
    counts: { overdue: overdue.length, soon: soon.length, notYet: notYet.length, undated: undated.length },
    problems,
  };
}
