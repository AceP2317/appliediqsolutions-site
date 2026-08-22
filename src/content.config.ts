// Content collections — one markdown file per entry.
//  - blog: /blog "Field notes" (authored articles + LinkedIn/Nextdoor/press);
//    only `kind: 'article'` entries get a detail page. Helpers: src/data/blog.ts.
//  - news: /ai-news "AI Signal", the autonomous daily desk. FRONTMATTER-ONLY
//    entries (body never rendered) — the LLM pipeline emits YAML block scalars
//    far more reliably than parseable markdown, the min/max caps below are hard
//    editorial rails, and cards never call render(). Helpers: src/data/news.ts.
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { BLOG_SOURCES, BLOG_KINDS } from './data/blog';
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
// An explicit `slug:` frontmatter field overrides (blog only).
const datePrefixId = ({ entry, data }: { entry: string; data: Record<string, unknown> }) =>
  (data.slug as string | undefined) ??
  entry.replace(/\.md$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, '');

const blog = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/blog',
    generateId: datePrefixId,
  }),
  schema: z
    .object({
      title: z.string().max(90),
      /** Excerpt + <meta> description. */
      description: z.string().max(180),
      publishedAt: isoOffsetDateTime,
      author: z.string().default('Ian Provencher'),
      source: z.enum(BLOG_SOURCES),
      kind: z.enum(BLOG_KINDS),
      /** Link to the original post/conversation — required for syndicated entries. */
      sourceUrl: z.string().url().optional(),
      tags: z.array(z.string()).default([]),
      draft: z.boolean().default(false),
      /** Optional URL slug override (otherwise derived from the filename). */
      slug: z
        .string()
        .regex(/^[a-z0-9-]+$/)
        .optional(),
    })
    .refine((d) => d.source === 'blog' || !!d.sourceUrl, {
      message: 'syndicated entries (source !== blog) must carry sourceUrl',
    }),
});

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

export const collections = { blog, news };
