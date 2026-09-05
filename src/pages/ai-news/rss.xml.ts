/**
 * /ai-news/rss.xml — the AI Signal feed. Mirrors blog/rss.xml.ts, with three
 * differences that come straight from how the news collection works:
 *
 *  1. THERE ARE NO PER-STORY PAGES. Items link to `/ai-news/#<id>`, the anchor
 *     NewsStory.astro puts on every card. @astrojs/rss uses `link` as the guid,
 *     so a shared `/ai-news/` link would collide on every item and readers would
 *     show one entry forever — the fragment is what keeps them distinct.
 *  2. ENTRIES EXPIRE (14d standard / 21d major, src/data/news.ts). Using the
 *     same `visibleFilter` as the page keeps feed and page in agreement; items
 *     dropping out is correct and harmless, since readers keep what they fetched.
 *  3. FRONTMATTER-ONLY, so there is no rendered body to syndicate. description
 *     is built from `summary` + `implications` as PLAIN TEXT — deliberately not
 *     `content` with HTML. The collection's whole stance is "no injection
 *     surface" for LLM-written text, and that stance should not be relaxed just
 *     because the destination is a feed reader.
 *
 * (An extensioned endpoint — unaffected by trailingSlash: 'always'.)
 */
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';
import { visibleFilter, sortByPublished } from '../../data/news';

export async function GET(context: APIContext) {
  const entries = (await getCollection('news', visibleFilter)).sort(sortByPublished);
  return rss({
    // Same browser-facing dress as the blog feed: humans clicking the link get
    // the branded "this is a feed" page, readers ignore it and parse the XML.
    stylesheet: '/rss.xsl',
    title: 'AppliedIQ Solutions — AI Signal',
    // The disclosure is the marketing, exactly as on the page itself. Anyone
    // subscribing in a reader never sees the page's AI-GENERATED badge, so the
    // channel description has to carry it.
    description:
      'The AI developments that matter, summarized with what they mean for operators, businesses, and people — researched, written, and published daily by an autonomous AI pipeline, with no human in the loop. Every story links to its sources.',
    site: context.site!,
    // MUST be false, and this is not cosmetic. The project runs
    // `trailingSlash: 'always'`, which @astrojs/rss honours by appending "/" to
    // every item link — AFTER the fragment. That yields
    // `/ai-news/#story-slug/`, whose fragment is `story-slug/`, which matches no
    // anchor on the page, so every feed item lands at the top of /ai-news/ and
    // silently fails to scroll. Caught only by diffing feed fragments against
    // the rendered `id`s; nothing errors. The page's own trailing slash is
    // already written into the link string above, so nothing is lost here.
    trailingSlash: false,
    items: entries.map((e) => ({
      title: e.data.title,
      pubDate: e.data.publishedAt,
      description: `${e.data.summary}\n\nWhy it matters: ${e.data.implications}`,
      link: `/ai-news/#${e.id}`,
      categories: e.data.tags,
    })),
  });
}
