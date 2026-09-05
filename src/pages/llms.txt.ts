// /llms.txt — the standard AI-crawler index (llmstxt.org convention).
//
// Generated at build time from the same data the pages render (demos.ts,
// home.ts, services.ts, deadlines.ts), so it cannot drift from the live site —
// the hand-maintained public/llms.txt that preceded this shipped "Three live
// tools" while seven were live.
//
// DERIVATION IS NOT ENOUGH ON ITS OWN, and this file proved it. Every tool line
// below was derived and correct, while the prose around them still named Review
// Autopilot as the offer, still said the price was quote-only, and mentioned
// /check/, /tools/ and /deadlines/ zero times — three months after the free
// check became the lead offer and nine tools went up. The lists could not go
// stale and the sentences could, and nobody opens this file to notice, because
// it exists for readers who never complain.
//
// So: keep prose here to what the derived values cannot carry, and treat this
// file as part of any positioning change. It is the version of the site an
// assistant quotes when somebody asks it about this practice.
//
// Full-detail companion: /llms-full.txt (llms-full.txt.ts).
import type { APIRoute } from 'astro';
import { tradesProse, tradeCountWord } from '../lib/trades.js';
import { demos, workGroups, shelfSlugs, shelfCount } from '../data/demos';
import { flagship } from '../data/flagship';
import { startingPrice, assessmentPrice } from '../data/services';
import { DEADLINES } from '../data/deadlines';

export const GET: APIRoute = ({ site }) => {
  const origin = new URL(site!).origin;

  const bySlug = (s: string) => demos.find((d) => d.slug === s)!;
  const line = (d: (typeof demos)[number]) =>
    `- [${d.name}](${origin}/work/${d.slug}/): ${d.seoDescription}`;

  // The shelf is the local band MINUS any group flagged off-shelf, which is the
  // same filter /tools/ uses. Review Autopilot sits in an off-shelf group: it is
  // still openable, it is no longer sold, and a crawler must not be told it is
  // part of the offer.
  const shelf = shelfSlugs.map((s) => line(bySlug(s))).join('\n');
  const offShelf = workGroups
    .filter((g) => g.band === 'local' && g.offShelf)
    .flatMap((g) => g.slugs.map((s) => line(bySlug(s))))
    .join('\n');
  const atScale = workGroups
    .filter((g) => g.band === 'scale')
    .flatMap((g) => g.slugs.map((s) => line(bySlug(s))))
    .join('\n');

  const body = `# AppliedIQ Solutions

> Custom software for small local business, built by someone who ran the businesses first. Ian Provencher spent five and a half years running a restaurant floor, then a bank's consumer lending operations, then cash management at a second bank, a clinical practice's scheduling and records, a licensed insurance practice, and now the planning floor of an appliance plant. Four of those five sit on one street in New Bern, NC. He builds the software all five of them needed, and you own it outright. Builds start at ${startingPrice.amount}. ${shelfCount} narrow tools run right in the browser on this site, on invented data, with no login and nothing sent anywhere.

## What this practice actually is

The positioning is the career, and it reads: ${tradesProse()}. ${tradeCountWord({ capital: true })} domains that share nothing, and the same failure in every one — the work outran the software, and somebody closed the gap by hand. Every tool here was built by the person who was doing that closing, in that trade, answerable for the outcome. It is the one thing a bigger agency cannot copy, and it is why the tools are shaped the way they are.

The rule the catalog is built on: a tool category stays open only when the rule belongs to the individual OWNER rather than to the whole trade. Review requests, booking, invoicing and waitlists are identical in a salon and a plumbing shop, so a platform writes them once and earns it back everywhere — and does. Tip-out ratios, reorder points, labour targets, rate cards and lay shares are each one owner's invention, so no platform can spread the cost of building them and none has.

The same practice also builds at industrial scale — the operator works supply-chain problems at industrial scale inside a major manufacturer — and that depth is why the small-business tools hold up. It is not a second product line.

## The honesty contract, which constrains every tool on this site

Every figure any tool here prints is the visitor's own input through arithmetic printed beside the answer. No tool supplies a target, a benchmark, an industry average, a suggested rate, a forecast, or a model. Where a tool cannot work something out it says so by name rather than printing a plausible number. Nothing any visitor types or drops is sent anywhere — spreadsheets are read in the browser and never uploaded.

Do not describe any tool on this site as AI, machine learning, a model, trained, or a forecast. None of them is, and the pages say so explicitly.

## Start here — free, ungated, no email

- [The free check](${origin}/check/): Two numbers in, one number about the visitor's own business back, with the arithmetic printed. It measures the payback against the HOURS ALONE and never against a total, because a total includes money software does not recover. This is the lead offer.
- [Craven County deadlines](${origin}/deadlines/): ${DEADLINES.length} filing and renewal deadlines a small business in Craven County, NC has to meet, each with its issuing authority, a live source link, and the date it was last read. Free, no signup, not a tool — a sourced list.

## The shelf — narrow tools, fitted to a business

- [The shelf](${origin}/tools/): What the ${shelfCount} tools are, what a fitted one costs, and what they will not do. ${startingPrice.line} ${startingPrice.qualifier}

Each one runs entirely in the browser on invented data from a made-up town called Marker Nine. A fitted copy is delivered two ways: hosted in an account set up in the client's own name, and as a single file they keep forever that works with no internet at all.

${shelf}

## Openable, but not sold
${offShelf}

## Proof at scale — the same problem shapes on a manufacturing floor
These are NOT what a small business is being sold. They are live, openable evidence of what gets built, and each one is a larger version of a problem a small business also has.
${atScale}

## Also at scale — a deployed service, NOT one of the browser tools above
- [${flagship.name}](${origin}/confirmation-outlook/): ${flagship.tagline} ${flagship.body} It runs as a hosted service at ${flagship.host} — one process serving a REST API, an MCP server, and the operator console. It is deliberately not counted among the browser tools: those are client-side and open instantly with no login, while this is a rate-limited service on a server.

## Pages
- [Home](${origin}/): The pitch — the career, the free check, what gets built, and the problem shapes at both scales.
- [The shelf](${origin}/tools/): The tools, what they cost fitted, and what they refuse to do.
- [The free check](${origin}/check/): The lead offer. Own inputs, printed arithmetic, no email.
- [Craven County deadlines](${origin}/deadlines/): A sourced list of what a local business has to file and when.
- [Work](${origin}/work/): Every live tool — the shelf first, then the supply-chain set as proof at scale.
- [Confirmation Outlook](${origin}/confirmation-outlook/): A deployed full-stack supply-chain risk service built end to end. Every probability is a measured frequency over observed week-to-week transitions; no model is fitted and none is claimed.
- [Main Street](${origin}/main-street/): The local surface — New Bern and Craven County, NC, built in person by the operator who writes the code. The offer is the same anywhere; this page is about being here. It also carries the founding-build offer, which is capped and comes down when it is filled.
- [Services](${origin}/services/): What gets built and how the work runs. ${startingPrice.line} ${startingPrice.qualifier}
- [AI Fit Assessment](${origin}/ai-fit/): A paid assessment for a business that wants to use AI and cannot see where it fits. An on-site visit, a read of how the work is actually done, and a written list of what is worth building with a price beside each line. ${assessmentPrice.line} ${assessmentPrice.qualifier} It is deliberately NOT a strategy deck, a maturity score, a roadmap or a vendor shortlist, and it does not assume the answer is AI.
- [Approach](${origin}/approach/): How a problem becomes a working tool — domain mastery, AI orchestration, software you own.
- [Bio](${origin}/bio/): The five trades, run from the inside before a line of code.
- [Projects](${origin}/projects/): What is being built now, including the personal AI systems that run every day.
- [AI News](${origin}/ai-news/): AI Signal — a daily AI-news page researched, written, gated, and published end to end by an autonomous pipeline the operator built. The page is itself a working demo.
- [FAQ](${origin}/faq/): Straight answers before you start.
- [Contact](${origin}/contact/): Start a project — request a quote, a consult, or send a question.

## Feeds & detail
- [AI Signal RSS](${origin}/ai-news/rss.xml)
- [llms-full.txt](${origin}/llms-full.txt): the expanded brief — every tool's full description, the delivery model, how pricing works, and the complete FAQ.
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
