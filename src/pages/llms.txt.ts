// /llms.txt — the standard AI-crawler index (llmstxt.org convention).
// Generated at build time from the same data the pages render (demos.ts), so it
// can never drift from the live site again — the previous hand-maintained
// public/llms.txt shipped "Three live tools" while seven were live.
// Full-detail companion: /llms-full.txt (llms-full.txt.ts).
import type { APIRoute } from 'astro';
import { demos } from '../data/demos';
import { flagship } from '../data/flagship';

export const GET: APIRoute = ({ site }) => {
  const origin = new URL(site!).origin;

  const tools = demos
    .map((d) => `- [${d.name}](${origin}/work/${d.slug}/): ${d.seoDescription}`)
    .join('\n');

  const body = `# AppliedIQ Solutions

> Custom supply-chain software and AI-built operational tools. A supply-chain operator (Ian Provencher) directs AI to ship the working software big ERP/MRP systems leave out — not slideware. ${demos.length} live tools run in the browser on this site, on synthetic data, no login.

AppliedIQ Solutions builds operational software for supply-chain and manufacturing teams: a single tool, a connected suite, a full custom system you own, or integration into the systems you already run. Deep domain (planning, MRP, BOM, logistics, production, inventory) paired with AI velocity — pain-point to deployed software fast. Engagements are quote-based and the software is yours to own, delivered in accounts set up in your name.

## Live tools (run in your browser, synthetic data, no login)
${tools}

## The flagship — a deployed service, NOT one of the browser tools above
- [${flagship.name}](${origin}/confirmation-outlook/): ${flagship.tagline} ${flagship.body} It runs as a hosted service at ${flagship.host} — one process serving a REST API, an MCP server, and the operator console. It is deliberately not counted among the ${demos.length} browser tools: those are client-side and open instantly with no login, while this is a rate-limited service on a server.

## Pages
- [Work](${origin}/work/): All ${demos.length} live tools, grouped as a supply-chain map — demand & planning, inbound & inventory, master data & parameters.
- [Confirmation Outlook](${origin}/confirmation-outlook/): The flagship — a full-stack supply-chain risk service built end to end. Every probability is a measured frequency over observed week-to-week transitions; no model is fitted and none is claimed.
- [Main Street](${origin}/main-street/): A current focus — custom, owned software for local small business, rooted in New Bern, NC. A real website you own, spreadsheets turned into a live tool, or any custom tool your shop runs on.
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
- [llms-full.txt](${origin}/llms-full.txt): the expanded brief — every tool's full description, the engagement model, pricing approach, and the complete FAQ.
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
