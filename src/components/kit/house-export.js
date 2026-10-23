/* THE ONE WAY A FACTORY DEMO WRITES AN EXCEL FILE (house rule, tool-conventions
   § J). Pure JavaScript, no React, so a Node gate can build the same About rows
   the browser writes.

   Before 2026-09-23 the seven wrote seven filename patterns with one to four
   sheets, one without column widths or a filter, and none with an About sheet.
   This replaces all seven:

     - every data sheet gets column widths and a filter over its full range;
     - the filename says which of the pair it is: <slug>-full-<date> or
       <slug>-filtered-<date>, the date in ET;
     - an About sheet goes LAST (Ian, 2026-09-23): the tool, the byline, when it
       was exported in ET, where the data came from, and every filter and switch
       that shaped it. The data sheets stay clean, because a byline row above the
       column names breaks every filter, pivot and import that reads row 1 as
       headers. Last, so anything that reads only the first sheet still gets the
       data.

   WHY NOT shelf.jsx's exportRows(). That one writes one sheet with no filter and
   no About sheet, and it is what the shelf's handover copies and verify-tools
   rely on; changing it would change the shelf, which this work leaves alone.

   Ported from dev/login-starter/lib/house/about-sheet.ts. */
import { stamp, todayEt } from '../../lib/format.js';

export const BYLINE = 'Built by Ian Provencher';

/**
 * The About sheet's rows.
 * @param {{ tool: string, what: string, source: string, shown?: string[], exportedAt?: Date }} o
 *   shown — every filter and switch in force, one line each. Empty means the file is everything.
 */
export function aboutSheetRows(o) {
  const rows = [
    [o.tool],
    [BYLINE],
    [],
    ['What this file holds', o.what],
    ['Exported', stamp(o.exportedAt ?? new Date())],
    ['From', o.source],
  ];
  if (o.shown && o.shown.length > 0) {
    rows.push(['Filters and switches', o.shown[0]]);
    for (const line of o.shown.slice(1)) rows.push(['', line]);
  } else {
    rows.push(['Filters and switches', 'None. Every row the tool holds is in this file.']);
  }
  return rows;
}

/** A width for each column, from its longest cell, clamped so one long note cannot take the sheet. */
function widths(aoa) {
  const w = [];
  for (const row of aoa) {
    row.forEach((cell, i) => {
      const len = cell === null || cell === undefined ? 0 : String(cell).length;
      w[i] = Math.max(w[i] || 8, Math.min(len + 2, 60));
    });
  }
  return w.map((wch) => ({ wch }));
}

/**
 * Write one workbook: the data sheets in order, then About.
 * @param {object} XLSX the SheetJS module, loaded lazily by the caller
 * @param {{ slug: string, which: 'full'|'filtered', tool: string, what: string, source: string,
 *           shown?: string[], sheets: { name: string, rows: any[][] }[] }} o
 *   rows — an array of arrays, the first row being the column names.
 * @returns {string} the filename written
 */
export function writeWorkbook(XLSX, o) {
  const wb = XLSX.utils.book_new();
  for (const s of o.sheets) {
    const ws = XLSX.utils.aoa_to_sheet(s.rows);
    ws['!cols'] = widths(s.rows);
    if (s.rows.length > 0 && s.rows[0].length > 0) {
      ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: s.rows.length - 1, c: s.rows[0].length - 1 } }) };
    }
    XLSX.utils.book_append_sheet(wb, ws, s.name.slice(0, 31));
  }
  const about = XLSX.utils.aoa_to_sheet(aboutSheetRows(o));
  about['!cols'] = [{ wch: 22 }, { wch: 90 }];
  XLSX.utils.book_append_sheet(wb, about, 'About');
  const filename = `${o.slug}-${o.which}-${todayEt()}.xlsx`;
  XLSX.writeFile(wb, filename);
  return filename;
}
