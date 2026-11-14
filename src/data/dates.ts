// Date formatting shared by the content surfaces.
//
// WHY THIS FILE EXISTS. These two helpers lived in `data/blog.ts` and were used
// by the /ai-news/ pages as well. Deleting the blog on 2026-08-24 would have
// taken the news desk's date rendering with it, so they moved somewhere neutral
// first. Nothing here knows anything about a blog.

/**
 * `2026-07-06 · 14:32 ET` — ALWAYS rendered in America/New_York.
 *
 * The timezone is pinned rather than left to the machine on purpose. These
 * timestamps are published, so a build running on a server in another zone
 * would silently print a different time for the same story, and the page would
 * be wrong in a way nothing errors on. Eastern is where the desk is.
 */
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

/** Machine-readable ISO string for `<time datetime>` and JSON-LD. */
export const isoDate = (d: Date): string => d.toISOString();
