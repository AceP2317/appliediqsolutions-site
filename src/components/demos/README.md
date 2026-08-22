# Demo islands

The live browser-tool demos. Each is a client-side React island rendered by a
**hand-written per-slug route** at `src/pages/work/<slug>.astro` (there is no
`[slug].astro`) with `client:only="react"`, and registered as a row in
`src/data/demos.ts` — the row is the single source for name/copy/OG, and every
"N live tools" count on the site derives from `demos.length` (DECISIONS D22 —
never hardcode it).

Two kinds live here:

- **`*.jsx` (seven)** — the de-identified **Northpoint** supply-chain tools,
  single-file islands. Never touch a `// === ENGINE ===` block.
- **`review-autopilot/` (folder)** — the Main Street lead offer (DECISIONS D25),
  a multi-file TSX island ported 2026-07-16 from the private `main-street` repo
  (`dev/Main Street/review-autopilot`, a Next 16 app). **This copy is CANONICAL**
  for the public demo — UI/data/copy edits happen here; the Next app is the
  downstream local PWA + live-AI harness. Drafting here is **sample-only**
  (`drafting.ts`; the Anthropic SDK path was deliberately dropped), and the
  sample-honesty labels are load-bearing. Its five skins are scoped CSS in
  `src/styles/review-autopilot.css` under `[data-demo="review-autopilot"]` with
  `ra-`prefixed Tailwind tokens — see that file's header before styling.
