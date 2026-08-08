// /llms-full.txt — the expanded AI-assistant brief (llmstxt.org convention).
// Everything an AI assistant needs to answer "who builds custom supply-chain /
// MRP tooling?" accurately: every tool's full prose, the engagement model, the
// ownership mechanics, and the complete FAQ. Generated at build time from the
// same data files the pages render (demos.ts, home.ts, services.ts) — zero
// hand-maintained copy, so it can never go stale. All content here is already
// public on the site.
import type { APIRoute } from 'astro';
import { demos } from '../data/demos';
import { flagship } from '../data/flagship';
import { opener, capabilities, offers, faq } from '../data/home';
import { builds, projectModel, pricingNotes } from '../data/services';

export const GET: APIRoute = ({ site }) => {
  const origin = new URL(site!).origin;

  const tools = demos
    .map(
      (d) => `### ${d.name}
URL: ${origin}/work/${d.slug}/
The problem: ${d.problem}
${d.about}`
    )
    .join('\n\n');

  // Replaced the old "two ways in" (small vs. established) block: the catalog's
  // spine is now problem SHAPE, not company size (D29). Each shape carries what
  // it looks like at a small business and, where one exists, the tool proving
  // the same shape at industrial scale.
  const shapes = capabilities
    .map((c) => {
      const proof = c.proofSlug ? demos.find((d) => d.slug === c.proofSlug) : undefined;
      const parts = [`- **${c.title}** — ${c.body}`];
      if (c.atShop) parts.push(`At a small business: ${c.atShop}`);
      if (proof) parts.push(`Proven live: ${proof.name} (${origin}/work/${proof.slug}/).`);
      if (c.atScale) parts.push(`Same shape at industrial scale: ${c.atScale.label} (${origin}${c.atScale.href}).`);
      return parts.join(' ');
    })
    .join('\n');
  const offerList = offers.map((o) => `- **${o.title}**: ${o.body}`).join('\n');
  const buildList = builds.map((b) => `- **${b.title}**: ${b.body}`).join('\n');
  const pricing = pricingNotes.map((n) => `- **${n.title}**: ${n.body}`).join('\n');
  const faqBlock = faq.map((f) => `Q: ${f.q}\nA: ${f.a}`).join('\n\n');

  const body = `# AppliedIQ Solutions — full brief

> ${opener.headline} ${opener.operatorLine}

AppliedIQ Solutions is the solo practice of Ian Provencher. The core product is custom software for small local business — a real website you own, your spreadsheets turned into a live tool, or any bespoke tool a business needs — owned outright, never rented. The proof is live: ${demos.length} working tools run in the browser on this site, synthetic data, no login, nothing to install. What ships for a client is the same shape: deployed software the client owns outright, not slideware. The first conversation is free.

The operator is current, not retired from the work — he works supply-chain problems day to day, at real scale, inside a major manufacturer. That depth (planning, MRP, BOM and material mechanics, procurement, logistics, warehousing, production, inventory, quality) is why the small-business tools hold up. It is NOT a second product line, and the supply-chain tools on this site are proof of caliber rather than something a small business is being sold. Work at mid-to-large scale is deferred, secondary, or a later venture as the practice grows.

## What he builds for a small business
${offerList}

## The problem shapes — the spine of the catalog
Organized by problem SHAPE, not company size. A one-person shop and a global manufacturer hit the same handful of problems; only the nouns change. This is why a tool built for a manufacturing floor transfers down, and why one built for a small business scales up with it.
${shapes}

## The live tools
${tools}

## Proof at scale — ${flagship.name} (a deployed service, NOT one of the ${demos.length} browser tools)
${origin}/confirmation-outlook/ — live at ${flagship.host}. ${flagship.tagline} ${flagship.body}

Why it is listed apart from the ${demos.length} tools above: those are client-side and open instantly in the browser with no login. This is a hosted Python service on a server — rate-limited, reached at its own host. ${flagship.arch.map((a) => `${a.title} ${a.body}`).join(' ')} Source: ${flagship.source.href}

Stated precisely, because the restraint is the selling point: the engine is a conditional probability table of measured frequencies over observed week-to-week transitions. No machine-learning model is fitted, none is claimed, and nothing is forecast — it reports what it measured, scored against a week it was never shown. ${flagship.honesty}.

## What he builds
${buildList}

## Main Street — the local surface (New Bern, NC)
${origin}/main-street/ — the same offer, in person. The market is a small local business ANYWHERE; New Bern and Craven County are home base and first market, not a limit. What that page adds is what only holds locally: he can stand in your shop and watch how the work actually runs, he already knows the town, and the person you talk to is the person writing the code. The owner does not need to know what to build or how: they describe where the business is and where they want it to be, and Ian builds it. The software is theirs to keep — no license, no subscription, no rent. Hosting and the domain are paid by the client directly to the providers, at cost.

## How engagements work
**${projectModel.title}** — ${projectModel.tagline}
${projectModel.includes.map((i) => `- ${i}`).join('\n')}

Ongoing arrangements run from a light monthly touch for a solo operator up to an embedded, strategic partnership at enterprise scale — all inclusion-defined and quote-based. Full ladder: ${origin}/services/

## How pricing works
${pricing}

## FAQ
${faqBlock}

## Living surfaces
- Blog — "Field notes": ${origin}/blog/ (RSS: ${origin}/blog/rss.xml)
- AI News — "AI Signal": ${origin}/ai-news/ — researched, written, gated, and published end-to-end by an autonomous AI pipeline the operator built and runs daily. The page is itself a working demonstration of the practice.
- Ask the tooling — a live AI assistant on the home page, ${origin}/work/, and ${origin}/faq/ answers questions about the tools and the work.

## Contact
${origin}/contact/ — request a quote, a consult, or send a question. Email: contact@appliediqsolutions.com. Ian reads every message himself and replies within about one business day.
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
