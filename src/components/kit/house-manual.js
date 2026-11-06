/* THE INSTRUCTION MANUAL, RENDERED ONCE (tool-conventions § N).

   Each factory demo exports its manual as DATA — built from its own rule
   constants, so a threshold change updates the manual whether or not anyone
   remembers to — and this one function turns that data into HTML. The same
   HTML is shown in two places, which is what Ian picked on 2026-09-23:

     - its own page at /work/<slug>/manual/, opened in a new tab so the manual
       is read beside the tool rather than instead of it;
     - a panel inside the tool, with a button that saves the page as a file,
       because a plant's copy of a tool runs with the internet off and the
       manual has to go with it.

   One renderer for both is the point: two renderers of one text drift.

   EVERY INTERPOLATED VALUE IS ESCAPED HERE, because live counts and part
   descriptions reach this string and the panel injects it.

   THE SEVEN SECTIONS ARE § N's MINIMUM, and renderManual() refuses a manual
   missing one — a manual without "what it cannot tell you" is the reduction
   § N was written against. The manual page builds from this at build time, so
   a missing section fails the build rather than shipping. */

export const SECTION_IDS = ['start', 'numbers', 'flags', 'derived', 'data', 'thresholds', 'limits'];

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

function block(b) {
  if (b.p !== undefined) return `<p>${b.lead ? `<b>${esc(b.lead)}</b> ` : ''}${esc(b.p)}</p>`;
  if (b.h3 !== undefined) return `<h3>${esc(b.h3)}</h3>`;
  if (b.list) {
    return `<ul>${b.list.map((li) => typeof li === 'string'
      ? `<li>${esc(li)}</li>`
      : `<li><b>${esc(li.lead)}</b> ${esc(li.text)}</li>`).join('')}</ul>`;
  }
  if (b.table) {
    const head = b.table.head.map((h) => `<th>${esc(h)}</th>`).join('');
    const rows = b.table.rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('');
    return `<div class="scroll"><table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>`;
  }
  throw new Error(`manual: unknown block ${JSON.stringify(Object.keys(b))}`);
}

/**
 * The manual's body as HTML, starting at its title.
 * @param {{ tool: string, purpose: string, sections: { id: string, title: string, blocks: object[] }[] }} m
 */
export function renderManual(m) {
  const missing = SECTION_IDS.filter((id) => !m.sections.some((s) => s.id === id));
  if (missing.length) throw new Error(`manual for ${m.tool} is missing section(s): ${missing.join(', ')}`);
  const secs = m.sections.map((s) =>
    `<section id="${esc(s.id)}"><h2>${esc(s.title)}</h2>${s.blocks.map(block).join('')}</section>`).join('');
  return `<article class="np-manual"><h1>${esc(m.tool)} — Instruction Manual</h1>`
    + `<span class="np-by">Built by Ian Provencher</span><p>${esc(m.purpose)}</p>${secs}</article>`;
}

/**
 * A whole standalone page, for the "save as a file" button. It carries the
 * house CSS and the mode's colors inline, so it opens anywhere, offline.
 * @param {object} m the manual data
 * @param {Record<string,string>} vars the --np-* properties for the mode in force
 * @param {string} css the house CSS
 */
export function manualDocument(m, vars, css) {
  const style = Object.entries(vars).map(([k, v]) => `${k}:${v}`).join(';');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">`
    + `<meta name="viewport" content="width=device-width, initial-scale=1">`
    + `<title>${esc(m.tool)} — Instruction Manual</title><style>${css}</style></head>`
    + `<body style="margin:0"><div class="np-app" style="${esc(style)}">${renderManual(m)}</div></body></html>`;
}
