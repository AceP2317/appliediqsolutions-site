/**
 * Blog helpers — the derived layer over the src/content/blog collection.
 * Single source for source badges, kind labels, the draft filter, date
 * formatting (always America/New_York), and the JSON-LD builders
 * (mirrors demoSchema() in demos.ts).
 */
import type { CollectionEntry } from 'astro:content';

/** Where an entry originated. Shared with content.config.ts (z.enum). */
export const BLOG_SOURCES = ['blog', 'linkedin', 'nextdoor', 'press'] as const;
export type BlogSource = (typeof BLOG_SOURCES)[number];

/** What an entry is. `article` = authored here, gets its own detail page. */
export const BLOG_KINDS = [
  'article',
  'post',
  'comment',
  'reply',
  'mention',
  'review',
  'news',
] as const;
export type BlogKind = (typeof BLOG_KINDS)[number];

type Entry = CollectionEntry<'blog'>;

/** Badge chip per source — label + status-dot color (instrument palette). */
export const SOURCE_META: Record<BlogSource, { label: string; dot: string }> = {
  blog: { label: 'Blog', dot: '#6366f1' }, // accent indigo — authored here
  linkedin: { label: 'LinkedIn', dot: '#22d3ee' }, // cyan
  nextdoor: { label: 'Nextdoor', dot: '#34d399' }, // up-green
  press: { label: 'Press', dot: '#c7a978' }, // amber label
};

export const KIND_LABELS: Record<BlogKind, string> = {
  article: 'Article',
  post: 'Post',
  comment: 'Comment',
  reply: 'Reply',
  mention: 'Mention',
  review: 'Review',
  news: 'News',
};

/**
 * The one draft filter — used by the index, getStaticPaths, AND the RSS
 * endpoint so draft-leak can't drift between consumers. Dev builds show
 * drafts (with a DRAFT chip — that's the review surface); PROD excludes them.
 */
export const publishedFilter = ({ data }: Entry): boolean =>
  import.meta.env.PROD ? !data.draft : true;

/** Newest first. */
export const sortByPublished = (a: Entry, b: Entry): number =>
  b.data.publishedAt.getTime() - a.data.publishedAt.getTime();

/** Only authored articles get their own /blog/<slug>/ page. */
export const hasDetailPage = (entry: Entry): boolean => entry.data.kind === 'article';

/** `2026-07-06 · 14:32 ET` — always rendered in America/New_York. */
export function formatEntryDate(d: Date): string {
  const day = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
  const time = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
  return `${day} · ${time} ET`;
}

/** Machine-readable ISO string for <time datetime> and JSON-LD. */
export const isoDate = (d: Date): string => d.toISOString();

/** JSON-LD for the /blog/ index — Blog node + BreadcrumbList. */
export function blogSchema(origin: string, articles: Entry[]): Record<string, unknown>[] {
  const url = `${origin}/blog/`;
  return [
    {
      '@type': 'Blog',
      '@id': `${url}#blog`,
      name: 'AppliedIQ Solutions — Field notes',
      url,
      description:
        'The build, in public — posts, updates, and mentions of AppliedIQ Solutions, wherever they land, collected in one chronological stream.',
      author: { '@id': `${origin}/#person` },
      publisher: { '@id': `${origin}/#organization` },
      blogPost: articles.map((a) => ({ '@id': `${origin}/blog/${a.id}/#post` })),
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
        { '@type': 'ListItem', position: 2, name: 'Blog' },
      ],
    },
  ];
}

/** JSON-LD for an article page — BlogPosting + BreadcrumbList. */
export function postSchema(entry: Entry, origin: string): Record<string, unknown>[] {
  const url = `${origin}/blog/${entry.id}/`;
  return [
    {
      '@type': 'BlogPosting',
      '@id': `${url}#post`,
      headline: entry.data.title,
      description: entry.data.description,
      datePublished: isoDate(entry.data.publishedAt),
      url,
      mainEntityOfPage: url,
      isPartOf: { '@id': `${origin}/blog/#blog` },
      author: { '@id': `${origin}/#person` },
      publisher: { '@id': `${origin}/#organization` },
      ...(entry.data.tags.length ? { keywords: entry.data.tags.join(', ') } : {}),
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${origin}/blog/` },
        { '@type': 'ListItem', position: 3, name: entry.data.title },
      ],
    },
  ];
}
