// Content collections — one markdown file per entry.
//  - news: /ai-news "AI Signal", the autonomous daily desk. FRONTMATTER-ONLY
//    entries (body never rendered) — the LLM pipeline emits YAML block scalars
//    far more reliably than parseable markdown, the min/max caps below are hard
//    editorial rails, and cards never call render(). Helpers: src/data/news.ts.
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { NEWS_TIERS } from './data/news';

// Full ISO-8601 WITH a UTC offset, enforced — a bare date parses as UTC
// midnight and mis-orders/mis-renders as the previous evening in ET.
const isoOffsetDateTime = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?[+-]\d{2}:\d{2}$/,
    'publishedAt must be ISO-8601 with a UTC offset, e.g. 2026-07-06T14:32:00-04:00',
  )
  .transform((s) => new Date(s));

// Filenames carry a sortable YYYY-MM-DD- prefix; URLs/ids stay clean.
// An explicit `slug:` frontmatter field overrides.
const datePrefixId = ({ entry, data }: { entry: string; data: Record<string, unknown> }) =>
  (data.slug as string | undefined) ??
  entry.replace(/\.md$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, '');

/* THE BLOG COLLECTION WAS DELETED 2026-08-24 — operator decision. One post
   from July under a heading promising "the build, in public" read worse than
   having no blog at all. /blog/ and /blog/rss.xml now redirect (see
   astro.config.mjs) so nothing that linked to them breaks. The post and this
   schema are both in git if they are ever wanted back. */

const news = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/news',
    generateId: datePrefixId,
  }),
  schema: z.object({
    /** OUR headline — never the source's verbatim. */
    title: z.string().min(10).max(90),
    publishedAt: isoOffsetDateTime,
    tier: z.enum(NEWS_TIERS).default('standard'),
    spotlight: z.boolean().default(false),
    /** 2–4 sentence brief, grounded ONLY in fetched source text. */
    summary: z.string().min(120).max(700),
    /** "Why it matters" — for operators, businesses, people. Always present. */
    implications: z.string().min(60).max(500),
    /** The earned AppliedIQ tie-in. OPTIONAL — absent by default; a forced
     *  angle is editorial drift. */
    angle: z.string().min(40).max(400).optional(),
    sources: z
      .array(
        z.object({
          name: z.string().min(2).max(40),
          url: z.string().url(),
        }),
      )
      .min(1)
      .max(4),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { news };
