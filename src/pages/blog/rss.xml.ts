/**
 * /blog/rss.xml — the field-notes feed. Article items link to their own page;
 * syndicated items link straight to the original conversation. Uses the same
 * publishedFilter as the index + getStaticPaths so drafts can never leak.
 * (An extensioned endpoint — unaffected by trailingSlash: 'always'.)
 */
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';
import { publishedFilter, sortByPublished, hasDetailPage } from '../../data/blog';

export async function GET(context: APIContext) {
  const entries = (await getCollection('blog', publishedFilter)).sort(sortByPublished);
  return rss({
    // Browser-facing dress (public/rss.xsl): humans clicking the link get a
    // branded "this is a feed — copy it into your reader" page; feed readers
    // ignore the stylesheet and parse the XML as usual.
    stylesheet: '/rss.xsl',
    title: 'AppliedIQ Solutions — Field notes',
    description:
      'Posts, updates, and mentions of AppliedIQ Solutions — wherever they land, collected in one chronological stream.',
    site: context.site!,
    items: entries.map((e) => ({
      title: e.data.title,
      description: e.data.description,
      pubDate: e.data.publishedAt,
      link: hasDetailPage(e) ? `/blog/${e.id}/` : (e.data.sourceUrl ?? '/blog/'),
    })),
  });
}
