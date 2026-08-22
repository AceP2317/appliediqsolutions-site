// /llms.txt — the standard AI-crawler index (llmstxt.org convention).
// Generated at build time from the same data the pages render (demos.ts), so it
// can never drift from the live site again — the previous hand-maintained
// public/llms.txt shipped "Three live tools" while seven were live.
// Full-detail companion: /llms-full.txt (llms-full.txt.ts).
import type { APIRoute } from 'astro';
import { demos, workGroups } from '../data/demos';
import { flagship } from '../data/flagship';

export const GET: APIRoute = ({ site }) => {
  const origin = new URL(site!).origin;

  // Split on the same `band` field the /work/ gallery uses, so the crawler
  // index reads in the same order a visitor does: the offer, then the proof.
  const bySlug = (s: string) => demos.find((d) => d.slug === s)!;
  const line = (d: (typeof demos)[number]) =>
    `- [${d.name}](${origin}/work/${d.slug}/): ${d.seoDescription}`;
  const inBand = (band: 'local' | 'scale') =>
    workGroups
      .filter((g) => g.band === band)
      .flatMap((g) => g.slugs.map((s) => line(bySlug(s))))
      .join('\n');

  const body = `# AppliedIQ Solutions

> Custom software for small local business, built by a supply-chain operator (Ian Provencher) who directs AI to ship working software rather than slideware. A real website you own, your spreadsheets turned into a live tool, or any custom tool your business needs — owned outright, never rented. ${demos.length} live tools run in the browser on this site, on synthetic data, no login.

AppliedIQ Solutions builds custom software for small businesses: a real website you own, spreadsheets turned into a live tool, and bespoke tools built around how a business actually works. The same practice also builds at industrial scale — the operator works supply-chain problems day to day inside a major manufacturer — and that depth is why the small-business tools hold up, not a second product line. The catalog is organized by problem SHAPE rather than company size: a one-person shop and a global manufacturer hit the same handful of problems, and only the nouns change. Engagements are quote-based, the first conversation is free, and the software is yours to own, delivered in accounts set up in your name.

## The lead offer — built for a local business
${inBand('local')}

## Proof at scale — the same problem shapes on a manufacturing floor
These are NOT what a small business is being sold. They are live, openable evidence of what gets built, and each one is a larger version of a problem a small business also has.
${inBand('scale')}

## Also at scale — a deployed service, NOT one of the browser tools above
- [${flagship.name}](${origin}/confirmation-outlook/): ${flagship.tagline} ${flagship.body} It runs as a hosted service at ${flagship.host} — one process serving a REST API, an MCP server, and the operator console. It is deliberately not counted among the ${demos.length} browser tools: those are client-side and open instantly with no login, while this is a rate-limited service on a server.

## Pages
- [Home](${origin}/): The offer — what gets built for a small business, the Review Autopilot demo, and the problem shapes at both scales.
- [Work](${origin}/work/): All ${demos.length} live tools — the one built for a local business first, then the supply-chain set as proof at scale.
- [Confirmation Outlook](${origin}/confirmation-outlook/): A deployed full-stack supply-chain risk service built end to end. Every probability is a measured frequency over observed week-to-week transitions; no model is fitted and none is claimed.
- [Main Street](${origin}/main-street/): The local surface — custom, owned software for small businesses in New Bern and Craven County, NC, built in person by the operator who writes the code. The offer itself is the same anywhere; this page is about being here.
- [Services](${origin}/services/): What I build and how we work together — from a single tool to a full system you own. Quote-based.
- [Approach](${origin}/approach/): How a problem becomes a working tool — domain mastery, AI orchestration, software you own.
- [Bio](${origin}/bio/): The operator behind the tools.
- [Projects](${origin}/projects/): What I'm building now — including the personal AI systems that run every day.
- [Blog](${origin}/blog/): Field notes — posts and syndicated writing, in one stream.
- [AI News](${origin}/ai-news/): AI Signal — a daily AI-news page researched, written, gated, and published end-to-end by an autonomous AI pipeline the operator built. The page is itself a working demo.
- [FAQ](${origin}/faq/): Straight answers before you start.
- [Contact](${origin}/contact/): Start a project — request a quote, a consult, or send a question.

## Feeds & detail
- [Field notes RSS](${origin}/blog/rss.xml)
- [AI Signal RSS](${origin}/ai-news/rss.xml)
- [llms-full.txt](${origin}/llms-full.txt): the expanded brief — every tool's full description, the engagement model, pricing approach, and the complete FAQ.
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
