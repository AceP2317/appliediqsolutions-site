# Demo islands

The live browser-tool demos. Each is a client-side React island rendered by a
**hand-written per-slug route** at `src/pages/work/<slug>.astro` (there is no
`[slug].astro`; the factory manuals share one route, `[slug]/manual.astro`)
with `client:only="react"`, and registered as a row in
`src/data/demos.ts` — the row is the single source for name/copy/OG, and every
"N live tools" count on the site derives from `demos.length` (DECISIONS D22 —
never hardcode it).

Three kinds live here:

- **The factory demos** — the de-identified **Northpoint** supply-chain tools,
  single-file islands, one `.jsx` per slug in `TOOL_BAND`. Never touch an
  existing `ENGINE` block.
  **Every one is on the house kit since D120 (moved 2026-09-23 and 24)** in
  `src/components/kit/house.jsx`, in the `northpoint` palette: each renders
  inside `HouseFrame`, takes its colors from `northpointTokens(slug)`, formats
  through `src/lib/format.js`, exports through `writeWorkbook()`, and exports a
  `MANUAL` object for `/work/<slug>/manual/`. `FACTORY` in `industrial.js` is
  every factory tool, and the browser gate, the alignment check and the fast
  guards hold all of them to the house rules. `docs/factory-house-move.md` is
  the procedure, with the worked examples it names.
- **The shelf tools** — the rest of the `.jsx` files here, one arithmetic engine
  each, for the invented town of **Marker Nine** (DECISIONS D36). Their shared
  chrome is `src/components/kit/shelf.jsx` and their engines are in `src/lib/`;
  `docs/shelf-build.md` is their recipe. `shelfSlugs` in `demos.ts` is the list.
- **`review-autopilot/` (folder)** — the Main Street lead offer (DECISIONS D25),
  a multi-file TSX island ported 2026-07-16 from the private `main-street` repo
  (`dev/Main Street/review-autopilot`, a Next 16 app). **This copy is CANONICAL**
  for the public demo — UI/data/copy edits happen here; the Next app is the
  downstream local PWA + live-AI harness. Drafting here is **sample-only**
  (`drafting.ts`; the Anthropic SDK path was deliberately dropped), and the
  sample-honesty labels are load-bearing. Its five skins are scoped CSS in
  `src/styles/review-autopilot.css` under `[data-demo="review-autopilot"]` with
  `ra-`prefixed Tailwind tokens — see that file's header before styling.

## If your tool READS a spreadsheet, declare it public

The operator's own pre-commit setup carries an internal-tool conventions guard
(`tool-conventions-guard.sh`, outside this repo). It fires on any `.jsx`/`.tsx`
over 400 lines that reads a spreadsheet or takes a file upload, and then asks
for a set of internal conventions — one of which mandates a corporate palette
that **DECISIONS D2 forbids on this public surface**. Obeying it here would
break a locked decision.

Put this line at the top of any demo that ingests a file:

```js
// PUBLIC-ARTIFACT — a demo on the public marketing site, not an internal work tool.
```

Exporting a spreadsheet does **not** trip that guard and needs no marker — that
was fixed 2026-08-25, when its detector was found to be matching `XLSX.utils`,
the namespace holding both directions, and describing seven export-only files
here as tools that "parse spreadsheets" (LEDGER L-197). Today only
`staging-triage-console.jsx` carries the marker, because it is the only one that
actually reads.

**Nothing in this directory may name the employer, in code or in a comment.**
D1 governs the whole public surface and the mirror's firewall scans SOURCE, not
just the built site — which is how it caught six occurrences of that name in an
earlier version of this very section. `npm run gate` did not, because a comment
never reaches the built folder.
