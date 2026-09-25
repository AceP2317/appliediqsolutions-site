/* ============================================================================
   READING A SPREADSHEET SOMEBODY DROPS ON THE PAGE.

   EXTRACTED, NOT WRITTEN. src/components/demos/staging-triage-console.jsx has
   carried this path since it was built: hidden file input, FileReader as an
   array buffer, a lazy xlsx import, read, sheet_to_json. That is the right
   shape and it is proven in production, so this is the same path with two
   things it lacked.

   ONE: IT REPORTS WHAT IT MATCHED. The original caught every failure into a
   single generic message and told nobody which columns it found. When an owner
   drops their own export and the answer looks wrong, "which column did you read
   as on-hand" is the only question worth asking, and the tool must be able to
   answer it.

   TWO: THE OWNER MAPS THE COLUMNS. Their headers will never match yours. A
   header-alias list works until it does not, and when it does not the tool
   either errors or — far worse — matches the wrong column and does confident
   arithmetic on it. Guessing is fine; guessing silently is not. So this guesses,
   shows the guess, and lets it be changed.

   NOTHING IS UPLOADED. The file is read by the page itself, in the browser. That
   is not a policy, it is how FileReader works, and it is why the whole shelf can
   promise nothing leaves the page.
   ============================================================================ */

/** Read a dropped file into rows of plain objects, keyed by its own headers. */
export async function readSheet(file) {
  const buf = await file.arrayBuffer();
  /* Lazy so the ~480 KB parser chunk stays off first paint. Nobody drops a file
     on arrival, so nobody should pay for the parser on arrival.

     ponytail: a single-file handover build cannot keep this lazy, because
     inlining collapses every dynamic import into one script. That copy will
     carry the parser always and be several megabytes.
     Upgrade path: if that size ever bites, add a CSV-only fast path behind the
     same readSheet() signature and let the full parser load only for a real .xlsx.
     Never split the CALLERS — the whole point of this module is one path. */
  const XLSX = await import('xlsx');
  const wb = XLSX.read(buf, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const raw = XLSX.utils.sheet_to_json(ws, { defval: '' });

  const headers = raw.length ? Object.keys(raw[0]) : [];
  return { sheetNames: wb.SheetNames, sheetName, headers, rows: raw, fileName: file.name };
}

/**
 * Guess which of the owner's headers means what, and SHOW the guess.
 * @param {string[]} headers the owner's own column names
 * @param {Record<string, string[]>} wanted field -> words that suggest it
 */
export function guessColumns(headers, wanted) {
  const norm = (h) => String(h).toLowerCase().replace(/[^a-z0-9]/g, '');
  const out = {};
  const taken = new Set();
  for (const [field, hints] of Object.entries(wanted)) {
    let best = null;
    for (const h of headers) {
      if (taken.has(h)) continue;
      const n = norm(h);
      /* An exact match beats a contains-match, so a column literally called
         "On hand" wins over one called "On hand last month". */
      const exact = hints.some((k) => n === norm(k));
      const loose = hints.some((k) => n.includes(norm(k)));
      if (exact) { best = h; break; }
      if (loose && !best) best = h;
    }
    if (best) { out[field] = best; taken.add(best); }
    else out[field] = null;
  }
  return out;
}

/** Turn the owner's rows into the shape a tool's engine expects. */
export function mapColumns(rows, mapping, coerce) {
  return rows.map((r, i) => {
    const out = { id: 'row_' + i };
    for (const [field, header] of Object.entries(mapping)) {
      const raw = header == null ? '' : r[header];
      out[field] = coerce[field] ? coerce[field](raw) : String(raw ?? '').trim();
    }
    return out;
  });
}

/**
 * A number out of whatever a spreadsheet cell happens to hold, or NULL when the
 * cell cannot honestly be read as one.
 *
 * IT USED TO RETURN 0 ON FAILURE, and that is the worst possible answer. Zero is
 * a legitimate quantity — zero on hand is a stockout, zero usage is a dead line —
 * so an unreadable cell arrived downstream as a real, actionable, wrong number
 * with nothing reported anywhere. Returning null forces the caller to say so.
 *
 * The old strip-everything-but-digits rule also got three ordinary exports
 * wrong, silently:
 *
 *   (1,234.00)   accounting negative. The parens ARE the minus sign; stripping
 *                them turned money owed into money held. Every accounting
 *                package on earth exports this shape.
 *   1234-        trailing minus. Mainframe and some SAP exports put it there.
 *   2026-08-25   a date. The old class kept the hyphens, so Number() saw
 *                "2026-08-25", returned NaN, and the fallback turned it into a
 *                clean, plausible, actionable ZERO. Measured, not assumed — the
 *                first guess written here was that it produced 20260825, and
 *                running the old function against it said otherwise. A nonsense
 *                number at least looks like one; a zero does not.
 *
 * WHAT IT DELIBERATELY DOES NOT DO: guess at a percent. "7.5%" reads as 7.5,
 * the number a person typed, because SheetJS hands a percent-FORMATTED cell to
 * us as 0.075 already and there is no way to tell the two apart after the fact.
 * Doubling that guess into a silent multiply-by-100 is exactly the class of
 * invention this whole shelf refuses.
 */
export const cellNumber = (v) => {
  if (v == null) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  /* A real Date is a point in time, never a quantity. SheetJS returns one for
     any date-formatted cell when cellDates is on. */
  if (v instanceof Date) return null;
  if (typeof v === 'boolean') return null;

  let t = String(v).trim();
  if (!t) return null;

  /* Anything that reads as a date is refused rather than mangled: y-m-d, m/d/y,
     and the same with dots, which is how much of Europe writes it. */
  if (/^\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}([ T]|$)/.test(t)) return null;

  let negative = false;
  if (/^\(.*\)$/.test(t)) { negative = true; t = t.slice(1, -1); }   // (1,234.00)
  if (/-\s*$/.test(t)) { negative = true; t = t.replace(/-\s*$/, ''); } // 1234-
  if (/^\s*-/.test(t)) { negative = true; t = t.replace(/^\s*-/, ''); }

  /* A TRAILING UNIT, but only when a space separates it. "10 days", "5 kg" and
     "12 ea" are how people actually write a quantity column, and refusing them
     broke a case already in the gate. "12abc" is refused, because with nothing
     between the digits and the letters there is no way to tell a unit from a
     typo — and on this shelf the tool NAMES what it cannot read rather than
     picking the likelier of two readings.

     The [A-Za-z] requirement is what keeps "1 234.00" safe, where the space is
     a thousands separator rather than a unit. */
  t = t.replace(/\s+[A-Za-z][A-Za-z.]*\s*$/, '');

  /* Currency symbols, thousands separators, ordinary and non-breaking spaces,
     and a trailing percent sign. Nothing else survives. */
  t = t.replace(/%\s*$/, '').replace(/[\s  ,'’]/g, '').replace(/^[^\d.]+/, '');

  /* One number and nothing else. "1.2.3" and "12abc" are not numbers, and the
     old rule turned both into something confident. */
  if (!/^\d*\.?\d+$/.test(t) && !/^\d+\.$/.test(t)) return null;

  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  return negative ? -n : n;
};
