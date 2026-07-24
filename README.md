# AppliedIQ Solutions — website

The public site for **AppliedIQ Solutions** — a consulting practice built around live, interactive supply-chain tools you can use in the browser, not slideware.

**Live:** https://appliediqsolutions.com

## What's here

A fast, design-forward [Astro](https://astro.build) site. The centerpiece is a set of interactive supply-chain tool demos that render as React islands — each a full, standalone app on its own route.

- `src/pages/` — Home, Work (+ a route per demo), Approach, Bio, Services, Projects, FAQ, Blog, Contact
- `src/components/` — shared chrome + `demos/` (the interactive tool islands)
- `src/data/` — typed single-source content and config
- `src/styles/` — the design-token system (Tailwind v4 `@theme`)

## Stack

Astro 6 · React 19 islands · Tailwind v4 · TypeScript (strict). Self-hosted fonts via Fontsource; icons via Lucide.

## Develop

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # static output to dist/
```

## Notes

This repository is a **published mirror** of a private working repo, assembled automatically by an allowlist-first, fail-closed pipeline: only the front-end (`src/`, `public/`, and build config) ships, and a whole-tree scan aborts the publish on any private detail. The site's dynamic features (the contact form, the live assistant, the content admin) are served by a private Cloudflare Worker that is **not** part of this repo. The interactive demos run on fictional "Northpoint Manufacturing" data.

---

Built by [Ian Provencher](https://github.com/AceP2317).
