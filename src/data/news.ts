/**
 * AI-news helpers — the derived layer over the src/content/news collection
 * (the /ai-news "AI Signal" autonomous desk). Mirrors blog.ts; blog.ts is the
 * shared date lib (formatEntryDate / isoDate imported from there).
 *
 * Retention: visibility is re-evaluated at BUILD time, and the daily pipeline
 * pushes daily — so expiry effectively evaluates daily. If runs stop, expired
 * entries linger up to the gap; the page's "Updated:" readout (build
 * timestamp) self-discloses the staleness, and the next successful run prunes.
 */
import type { CollectionEntry } from 'astro:content';

/** Story tiers. Shared with content.config.ts (z.enum). */
export const NEWS_TIERS = ['major', 'standard'] as const;
export type NewsTier = (typeof NEWS_TIERS)[number];

/** Rolling visibility window per tier, in days. */
export const RETENTION_DAYS: Record<NewsTier, number> = {
  standard: 14,
  major: 21,
};

type Entry = CollectionEntry<'news'>;

export const TIER_META: Record<NewsTier, { label: string } | null> = {
  major: { label: 'Major' }, // warn-styled chip on the card
  standard: null, // no chip — standard is the default voice
};

/**
 * The one visibility filter — used by the page AND anything else that reads
 * the collection. PROD hides entries past their tier's retention window;
 * dev shows everything (the review surface). Date.now() lives INSIDE the
 * predicate so a long-lived `astro dev` process never pins a stale "now".
 */
export const visibleFilter = ({ data }: Entry): boolean => {
  if (!import.meta.env.PROD) return true;
  const ageMs = Date.now() - data.publishedAt.getTime();
  return ageMs <= RETENTION_DAYS[data.tier] * 86_400_000;
};

/** Newest first. */
export const sortByPublished = (a: Entry, b: Entry): number =>
  b.data.publishedAt.getTime() - a.data.publishedAt.getTime();

/**
 * Exactly one spotlight renders: the newest visible entry flagged spotlight.
 * The pipeline clears old flags when setting a new one (belt); rendering
 * picks one regardless (suspenders). Null → the panel simply doesn't render.
 */
export const currentSpotlight = (sorted: Entry[]): Entry | null =>
  sorted.find((e) => e.data.spotlight) ?? null;

/** JSON-LD for /ai-news — CollectionPage + BreadcrumbList, kept light
 *  (stories expire and link out; an ItemList would churn daily for no gain). */
export function newsSchema(origin: string): Record<string, unknown>[] {
  const url = `${origin}/ai-news/`;
  return [
    {
      '@type': 'CollectionPage',
      '@id': `${url}#page`,
      name: 'AI Signal — autonomous AI news desk',
      url,
      description:
        'The AI developments that matter, summarized with implications — researched, written, and published daily by an autonomous AI pipeline. Every story links to its sources.',
      isPartOf: { '@id': `${origin}/#website` },
      author: { '@id': `${origin}/#person` },
      publisher: { '@id': `${origin}/#organization` },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
        { '@type': 'ListItem', position: 2, name: 'AI News' },
      ],
    },
  ];
}
