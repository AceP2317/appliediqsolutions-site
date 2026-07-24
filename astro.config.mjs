// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
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
    // number) and /admin is the private content console — keep both out of the
    // sitemap. lastmod is stamped ONLY on the two pages that genuinely change
    // daily (/blog/, /ai-news/) — a build-time lastmod on every URL trains
    // crawlers to distrust the signal.
    sitemap({
      changefreq: 'monthly',
      priority: 0.7,
      filter: (page) => !page.includes('/ian-card') && !page.includes('/admin'),
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
    plugins: [tailwindcss()]
  }
});