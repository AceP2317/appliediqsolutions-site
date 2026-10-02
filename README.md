# AppliedIQ Solutions — website

The public site for **AppliedIQ Solutions** — custom software for small local business: a website
they own outright, their spreadsheets turned into a live tool, and whatever bespoke tool the business
actually needs. New Bern, North Carolina is home base and first market.

**Live:** https://appliediqsolutions.com

## What's here

A fast, design-forward [Astro](https://astro.build) site. Every tool on it is a real, working app you
can open and use in the browser — no sign-up, no demo video, nothing uploaded anywhere.

- **A shelf of narrow tools**, one arithmetic engine each, built for a single trade's single
  recurring job. Each runs on an invented town called Marker Nine.
- **A free check**, ungated, that takes two numbers about your own business and prints the
  arithmetic it used.
- **A set of larger supply-chain consoles**, set in a fictional "Northpoint Manufacturing", included
  as evidence of caliber rather than as the thing for sale.

Every figure any tool prints is your own input through printed arithmetic. No model, no forecast, no
benchmark, no industry average. Where a tool cannot work something out, it names the shape it cannot
handle instead of printing a plausible number.

```
src/pages/       routes — the marketing pages, a full-bleed route per tool, and the legal pair
src/components/  shared chrome, the tool kit, and demos/ (the interactive islands)
src/lib/         pure ESM arithmetic engines, no React, one per tool
src/data/        typed single-source content and config
src/styles/      the design-token system (Tailwind v4 @theme)
```

## Stack

Astro 6 · React 19 islands · Tailwind v4 · TypeScript (strict). Self-hosted fonts via Fontsource;
build-time inline SVG icons via Lucide.

## Develop

```sh
npm install
npm run dev      # http://localhost:4301
npm run build    # static output to dist/
```

## Notes

This repository is a **published mirror** of a private working repo, assembled automatically by an
allowlist-first, fail-closed pipeline: only the front end (`src/`, `public/`, and build config)
ships, and a whole-tree scan aborts the publish on any private detail. The site's dynamic features —
the contact form, the meeting rooms, the content admin — are served by a private Cloudflare Worker
that is **not** part of this repo.

---

Built by [Ian Provencher](https://github.com/AceP2317).
