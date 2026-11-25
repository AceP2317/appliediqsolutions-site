// Content collections — one markdown file per entry.
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

/* THE BLOG COLLECTION WAS DELETED 2026-08-24 — operator decision. One post
   from July under a heading promising "the build, in public" read worse than
   having no blog at all. /blog/ and /blog/rss.xml answer from the Worker so
   nothing that linked to them breaks. The post and this schema are both in
   git if they are ever wanted back.

   THE NEWS COLLECTION WAS DELETED 2026-09-20 (D118), with the /ai-news/ page,
   its feed, the admin console that fed it and the daily cloud routine that
   wrote it. Its schema, its date-prefixed ids and its offset-enforced datetime
   are all in git; nothing else in this repo used them. */

/* ── tools: the written body under each shelf tool's live island ──────────────
   ONE FILE PER SHELF SLUG, and the FILENAME IS THE SLUG. There is deliberately
   no `slug:` frontmatter field: a second copy of the slug is a second thing to
   keep in step, and `src/data/demos.ts` is already the one place a slug is
   written down.

   THERE IS NO FRONTMATTER AT ALL, AND THAT IS THE POINT. Every fact a body
   might have carried in frontmatter — the tool's name, who it is for, what
   instrument it replaces, its price — already lives in `demos.ts` or
   `src/lib/pricing.js`, and `DemoAbout.astro` reads them from there. A `title:`
   here would be a fourth copy of the name; `check-tool-names.mjs` exists
   because three copies had already drifted.

   WHY THIS COLLECTION EXISTS. `/work/<slug>/` renders a `client:only` island,
   so a crawler sees no part of the tool itself — the prose in DemoAbout IS the
   page's body text, and it was one paragraph. These are the pages a stranger
   arrives on from a search or a shared link, so they are the ones that most
   need something to arrive at.

   THE BODY IS RENDERED, so it is real markdown rather than the news
   collection's frontmatter-only shape. Headings, lists and emphasis all work.
   Keep to h3 (`###`) and below — DemoAbout already owns the h2. */
const tools = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/tools',
  }),
  schema: z.object({}),
});

export const collections = { tools };
