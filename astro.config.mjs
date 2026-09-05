// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  /* THE BLOG IS DELETED, SO ITS ADDRESSES REDIRECT rather than 404.
     A bookmark, an indexed search result and a feed reader all still land
     somewhere real. This is the whole reason deleting was safe: without these
     three lines the delete quietly breaks every link that ever pointed here,
     and nobody would report it. */
  /* ONE ENTRY PER ADDRESS, NOT TWO. trailingSlash: 'always' means Astro treats
     '/blog' and '/blog/' as the SAME route, so declaring both is a collision it
     warns about today and will hard-error on later. The slashed form is the
     canonical one this site uses everywhere. */
  /* NO ASTRO REDIRECTS AT ALL, and the reason is a mechanism worth knowing.
     Both blog redirects live in worker/index.js as real HTTP 301s.

     '/blog/': '/' was here until 2026-08-25 and it did nothing in production,
     even after the Worker rule was added. A Worker with Static Assets serves
     ASSETS FIRST: the script only runs when no file matches the path. Astro's
     redirect emits a real dist/blog/index.html — an HTML page with a meta
     refresh — so the assets layer answered every /blog/ request with HTTP 200
     and the Worker never saw it. A person's browser follows the refresh, which
     is exactly why it survived: the half that works is the half you see.

     Deleting the entry deletes the file, nothing matches, and the request
     reaches the Worker. The rule now lives in exactly one place.

     THE TRAP GENERALISES: any Worker route whose path also exists as a built
     file is dead code, silently. scripts/check-delisted.mjs asserts both halves
     — that the Worker redirects, AND that no asset shadows it — because a gate
     that calls worker.fetch() directly is testing a layer production reaches
     second. */
  redirects: {},
  site: 'https://appliediqsolutions.com',
  // Canonical URL form is trailing-slash (matches sitemap, canonicals, and the
  // Cloudflare assets layer, which 307s the slash-less form). 'always' makes the
  // dev server 404 slash-less internal links so a missed slash surfaces in dev
  // instead of costing crawlers/visitors a redirect hop in production.
  trailingSlash: 'always',
  // Pinned static dev/preview port (workspace port convention — see dev\PORTS.md).
  server: { port: 4301 },
  // Prefetch linked pages' HTML on hover — instant-feel navigation for $0.
  // HTML only (never island JS); hover-gated so mobile pays nothing extra.
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  integrations: [
    react(),
    // Crawl hints. /ian-card is a share-only business card (carries a personal
    // number), /admin is the private content console, and /meet is a client
    // meeting room reached only by a link Ian sends — keep all three out of the
    // sitemap. lastmod is stamped ONLY on the two pages that genuinely change
    // daily (/blog/, /ai-news/) — a build-time lastmod on every URL trains
    // crawlers to distrust the signal.
    sitemap({
      changefreq: 'monthly',
      priority: 0.7,
      filter: (page) =>
        !page.includes('/ian-card') &&
        !page.includes('/admin') &&
        !page.includes('/meet') &&
        !page.includes('/host'),
      serialize: (item) => {
        const path = new URL(item.url).pathname;
        if (path === '/blog/' || path === '/ai-news/') {
          return { ...item, lastmod: new Date().toISOString(), changefreq: 'daily' };
        }
        return item;
      },
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
    // Refuse to drift off the pinned port. Vite's default is to auto-increment
    // when 4301 is taken, which silently parks this site on a port belonging to
    // another app and breaks both PWA identities (a PWA's identity is its
    // localhost:PORT origin). Fail loudly: a clash means a stale server is up.
    server: { strictPort: true }
  }
});