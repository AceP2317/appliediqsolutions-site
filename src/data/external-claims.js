// ============================================================================
// EVERY CLAIM THIS REPO MAKES ABOUT A SYSTEM IT DOES NOT CONTROL.
//
// WHY THIS FILE EXISTS. On 2026-08-25, three worklist items in a row asserted
// something about an outside system that had stopped being true, and acting on
// each would have done real damage:
//
//   1. "Suspend the Render service — it still serves a stale public copy."
//      It had ALREADY been suspended. Nobody recorded it.
//   2. "shopdowntownnewbern.com serves the wrong certificate; fixing it is a
//      free afternoon and a way in." There was no site behind the certificate.
//   3. The correction to (2): "there is no site, and a competitor hosts it, so
//      tell them rather than fix it." Also wrong — the organisation had MOVED
//      the directory and retired the domain deliberately. An email would have
//      told a stranger about something they chose.
//
// An audit then found ~108 external claims across the docs. Seventeen carried a
// source URL. Twenty carried a read date. TEN carried both, and all ten were
// deadlines.ts rows — the only ones already gated.
//
// THE RULE, which the repo already stated twice in prose that nothing read
// (PICKUP.md and src/lib/reorder.js): a claim about somebody else's system is a
// claim about the world, and the world moves without telling us. So it is a
// measurement, and a measurement with no expiry date is a guess wearing a fact's
// clothes.
//
// WHY A REGISTRY AND NOT A SCRAPE. A `https?://` regex misses every claim that
// actually burned us — `shopdowntownnewbern.com`, `swissbear.org` and
// `ian-provencher.com/podcast/rss.xml` are all written bare, with no scheme. A
// gate built on scheme-matching would have reported clean over precisely the
// failure class it was built for. Entries here are explicit and hand-added.
//
// WHY .js AND NOT .ts. scripts/check-external.mjs imports this directly. Same
// reason src/components/kit/themes.js is .js — a plain Node gate cannot import a
// TypeScript module without a loader flag, and parsing the source instead (as
// check-dist.mjs does for deadlines.ts) is strictly worse when the file can just
// be an ES module.
//
// KINDS
//   http   fetch a URL and assert something about the response
//   tls    inspect the certificate a host presents
//   dns    resolve a name and assert the answer
//   repo   ask GitHub about a repository
//   human  A PERSON MUST CHECK THIS. Neither pass nor fail. It ages against
//          `verified` and warns past the threshold. Roughly half of the claims
//          in this repo are this kind — survey percentages, platform character
//          caps, a competitor's pricing, meeting times at a restaurant. Marking
//          them checkable would be the same failure in a new coat.
// ============================================================================

/** Warn on a `human` claim older than this. Not a failure — a person's job. */
export const HUMAN_MAX_AGE_DAYS = 120;

/* ============================================================================
   THE ONLY HOSTS THIS REPO MAY CONTACT AUTOMATICALLY.

   Everything here is either a system we operate or a platform whose whole
   business is answering machines. NOTHING ELSE MAY BE FETCHED ON A SCHEDULE,
   and the two rules below are what a person could otherwise only remember:

     · A local business, nonprofit, prospect, client or competitor is NEVER
       contacted by anything automated. Not once a day, not once a week. New
       Bern is small, the work depends on how AppliedIQ is regarded in it, and
       a scheduled request from a company to a neighbour it is about to
       approach is not something worth having to explain. Volume is irrelevant
       to this rule — six requests and six hundred are the same answer.

     · A claim about one of them is a `human` claim. It keeps its url so
       checking is a click, it ages, it warns, and it never passes.

   THIS IS ENFORCED, NOT TRUSTED. check-external.mjs refuses to start when any
   fetched claim names a host absent from this list, and its fetch and TLS
   helpers refuse a stray call on top of that. npm run gate fails the build for
   the same reason, so a bad claim cannot even reach CI. Adding a host here is
   therefore a deliberate act with a name beside it, which is the point.

   Precedent: on 2026-08-28 six claims here probed Swiss Bear's websites on
   every push. See LEDGER L-248.
   ============================================================================ */
export const REACHABLE_HOSTS = new Map([
  ['appliediqsolutions.com', 'ours — the production site'],
  ['demo.appliediqsolutions.com', 'ours — the flagship demo host'],
  ['ian-provencher.com', 'ours — the second site and the podcast feed'],
  ['confirmation-outlook.onrender.com', 'ours — our own Render service'],
  ['github.com', 'platform — a code host whose API exists to be called'],
]);

/** The host of a url or bare hostname, lowercased, with any www. removed. */
export function hostOf(target) {
  const raw = String(target || '').trim();
  if (!raw) return '';
  const withScheme = raw.includes('://') ? raw : 'https://' + raw;
  try {
    const h = new URL(withScheme).hostname.toLowerCase();
    return h.startsWith('www.') ? h.slice(4) : h;
  } catch {
    return '';
  }
}

/** May anything automated in this repo contact this host? Default: NO. */
export const mayContact = (target) => REACHABLE_HOSTS.has(hostOf(target));

export const CLAIMS = [
  // ─── The Swiss Bear cluster — NEVER FETCHED. A person checks these. ───────
  //
  // These six were `http` and `tls` claims until 2026-08-28, which meant every
  // push to main sent about six requests to a local nonprofit's web server from
  // a datacentre, identifying itself as AppliedIQ in the User-Agent. The volume
  // was trivial. That was never the point: Swiss Bear is the organisation being
  // approached for the founding builds, this is a town where impressions carry,
  // and there is no version of an automated schedule hitting a prospect's site
  // that is worth defending if anyone ever asks about it.
  //
  // They are `human` now. The facts still matter — they are the whole basis of
  // the approach — so nothing was deleted. The url stays on each one so checking
  // is a click, and each ages and warns like every other human claim.
  //
  // The rule this rests on is REACHABLE_HOSTS above, and it is enforced rather
  // than remembered: the prober refuses to start if any fetched claim names a
  // host that is not on it, so flipping one of these back to `http` fails the
  // run instead of quietly resuming the requests.
  {
    id: 'swissbear-shop-live',
    kind: 'human',
    where: 'PICKUP.md · docs/first-three.md',
    claim: "Swiss Bear's merchant directory is alive at downtownnewbern.com/shop/",
    url: 'https://downtownnewbern.com/shop/',
    verified: '2026-08-28',
  },
  {
    id: 'swissbear-redirect',
    kind: 'human',
    where: 'PICKUP.md',
    claim: 'swissbear.org redirects to downtownnewbern.com',
    url: 'https://swissbear.org/',
    verified: '2026-08-28',
  },
  {
    id: 'shopdowntown-retired',
    kind: 'human',
    where: 'PICKUP.md',
    claim: 'shopdowntownnewbern.com is a retired domain serving a hosting placeholder',
    url: 'http://shopdowntownnewbern.com/',
    verified: '2026-08-28',
  },
  {
    id: 'shopdowntown-cert-mismatch',
    kind: 'human',
    where: 'PICKUP.md',
    claim: "shopdowntownnewbern.com presents another tenant’s certificate",
    url: 'https://shopdowntownnewbern.com/',
    verified: '2026-08-28',
  },
  {
    id: 'shopdowntown-unlinked',
    kind: 'human',
    where: 'PICKUP.md',
    claim: 'The working Swiss Bear site never links the retired domain',
    url: 'https://downtownnewbern.com/shop/',
    verified: '2026-08-28',
  },
  {
    id: 'swissbear-volunteer-invite',
    kind: 'human',
    where: 'PICKUP.md item 4 · docs/first-three.md',
    claim: 'Swiss Bear publicly invites committee volunteers — the entire basis of the approach',
    url: 'https://downtownnewbern.com/volunteer/',
    verified: '2026-08-28',
  },

  // ─── The Render cluster — the one that looked like it would break prod ────
  {
    id: 'render-suspended',
    kind: 'http',
    where: 'PICKUP.md item 6',
    claim: 'The Render service is suspended (the item said to suspend it; it was already done)',
    url: 'https://confirmation-outlook.onrender.com/',
    expect: { status: 503, bodyIncludes: 'suspended by its owner' },
    verified: '2026-08-25',
  },
  {
    id: 'flagship-live',
    kind: 'http',
    where: 'src/data/flagship.ts · CLAUDE.md',
    claim: 'The flagship is up and serving — WHERE it runs is deliberately not recorded (OSINT)',
    url: 'https://demo.appliediqsolutions.com/api/health',
    expect: { status: 200, bodyIncludes: '"status":"ok"' },
    verified: '2026-08-25',
  },
  {
    id: 'flagship-source-public',
    kind: 'http',
    where: 'src/data/flagship.ts:49',
    claim: 'The "Read the source" link resolves for a visitor (a private repo 404s)',
    url: 'https://github.com/AceP2317/confirmation-outlook',
    expect: { status: 200 },
    verified: '2026-08-25',
  },

  // ─── Links shipped to visitors ────────────────────────────────────────────
  {
    /* DOWNGRADED FROM http TO human, 2026-08-25, and the reason matters more
       than the entry. LinkedIn answers a non-browser request with HTTP 999 — an
       anti-bot code, not an error. The honest reading is that this prober
       CANNOT SEE the page: 999 proves DNS resolved and TLS completed and
       nothing else. Widening the probe to accept 999 would have turned a check
       that sees nothing into a check that reports green, which is the exact
       failure this whole file was built to stop. Same for Shopify below. */
    id: 'links-linkedin', kind: 'human', where: 'src/data/links.ts',
    claim: 'The LinkedIn profile link in the footer and JSON-LD still resolves to a live profile',
    verified: '2026-08-25',
    source: 'https://www.linkedin.com/in/ianprovencher/',
    note: 'LinkedIn returns HTTP 999 to any non-browser. Open it in a browser; a machine cannot tell a live profile from a deleted one here.',
  },
  {
    id: 'links-github', kind: 'http', where: 'src/data/links.ts',
    claim: 'The GitHub profile link resolves',
    url: 'https://github.com/AceP2317',
    expect: { status: 200 }, verified: '2026-08-25',
  },
  {
    id: 'podcast-feed', kind: 'http', where: 'PICKUP.md item 9',
    claim: 'The podcast feed is reachable and has at least one episode',
    url: 'https://ian-provencher.com/podcast/rss.xml',
    expect: { status: 200, bodyIncludes: '<item' }, verified: '2026-08-25',
  },

  // ─── Own-domain canonicalisation, claimed in CLAUDE.md ────────────────────
  {
    id: 'sitemap-index', kind: 'http', where: 'CLAUDE.md',
    claim: 'sitemap-index.xml is the submitted sitemap and answers',
    url: 'https://appliediqsolutions.com/sitemap-index.xml',
    expect: { status: 200 }, verified: '2026-08-25',
  },
  {
    id: 'sitemap-bare-404', kind: 'http', where: 'CLAUDE.md',
    claim: 'sitemap.xml 404s — which is why the index form was submitted',
    url: 'https://appliediqsolutions.com/sitemap.xml',
    expect: { status: 404 }, verified: '2026-08-25',
  },
  {
    /* THE FIRST VERSION OF THIS ASSERTED `statusNot: 200` AND WENT RED ON A
       CORRECTLY GATED PAGE. Cloudflare Access answers a stranger by REDIRECTING
       to its own sign-in, and that sign-in page is itself a healthy 200 — so
       following the redirect and reading the final status measures Cloudflare's
       login screen rather than this site's protection.

       The claim was never about a status code. It is about WHERE an
       unauthenticated request ends up, so that is what is asserted. Checked by
       hand at the same time: the returned page is titled "Sign in ・ Cloudflare
       Access" and contains zero occurrences of AdminConsole, the publish route
       names, or any token name. */
    id: 'admin-access-gated', kind: 'http', where: 'docs/admin-console.md:76',
    claim: '/admin/ sends an unauthenticated visitor to the Cloudflare Access sign-in',
    url: 'https://appliediqsolutions.com/admin/',
    expect: { landsOnHostContaining: 'cloudflareaccess.com', bodyExcludes: 'AdminConsole' },
    verified: '2026-08-25',
  },

  // ─── A dated claim about another company, on a public page ────────────────
  {
    id: 'stocky-retired',
    kind: 'human',
    where: 'src/data/demos.ts:264 · src/lib/reorder.js:4',
    claim: 'Shopify published that Stocky would stop working after 31 August 2026',
    verified: '2026-08-25',
    source: 'https://help.shopify.com/en/manual/products/inventory/stocky',
    note: 'Shopify returns HTTP 403 to a non-browser, so this prober cannot read the page — downgraded from http to human 2026-08-25 rather than loosened until it passed. The sentence was read in a browser on 2026-08-25: "The Stocky app will no longer be available after August 31st, 2026." Re-read it there.',
  },

  // ─── HUMAN — nobody can automate these, and pretending otherwise is the bug ─
  {
    id: 'survey-review-percentages', kind: 'human',
    where: 'docs/first-three.md · PICKUP.md · docs/off-repo-copy.md',
    claim: '47% will not consider a business under 20 reviews · 64% distrust a web pro with none · 73% arrive by recommendation · 74% weight the last 3 months (BrightLocal 2026)',
    verified: '2026-08-25',
    note: 'Restated in 15 places across 3 files and only ONE names a source. Canonical home should be docs/first-three.md; everything else should cite it.',
  },
  {
    id: 'gbp-ranking-factors', kind: 'human',
    where: 'docs/off-repo-copy.md §1 · PICKUP.md item 3',
    claim: 'Eight of the top ten local-pack factors come from the profile; proximity #2 and #4; services #81→#22; eleven photos median; hours a new top-five factor',
    verified: '2026-08-25',
    note: 'Six ranked claims about an unnamed ranking study, no URL anywhere.',
  },
  {
    id: 'linkedin-caps', kind: 'human',
    where: 'docs/off-repo-copy.md',
    claim: 'LinkedIn headline cap 220 · About cap 2,600 · Services cap UNKNOWN and stated as such',
    verified: '2026-08-25',
    note: 'check:offrepo measures the COUNTS. The CAPS themselves are asserted by nothing. Check the field counter before pasting.',
  },
  {
    /* MEASURED, not surveyed — read straight off the live fields on 2026-08-27 while
       pasting. Kept as `human` anyway, because a platform can change a cap without
       telling anyone and no probe here can see it. The value of writing them down is
       that the next draft starts from a real number instead of an empty one: the first
       Nextdoor overview drafted this session was 1101 characters against a 500 cap, and
       only the composer caught it. */
    id: 'platform-caps-measured', kind: 'human',
    where: 'docs/off-repo-copy.md §1, §1.1, §2',
    claim: 'Google description 750 (field counter read 746/750) · Google service NAME 120 · Google service DESCRIPTION 300 · Nextdoor page overview 500 (maxLength) · Google post 1,500',
    verified: '2026-08-27',
    note: 'Read off the live forms while pasting, not from documentation. Re-read before trusting.',
  },
  {
    /* CORRECTED 2026-08-27. This used to sit under a claim that editing a Nextdoor
       business page costs a re-approval. Pressing Save published the new overview
       instantly, with no queue. The old claim had never been tested and it is why the
       overview went unwritten for months — a plausible-sounding cost nobody checked. */
    id: 'nextdoor-edit-publishes-instantly', kind: 'human',
    where: 'docs/off-repo-copy.md §2',
    claim: 'Editing the Nextdoor business page overview publishes immediately, with no review queue',
    verified: '2026-08-27',
    note: 'Observed once, on one page, by one operator. One observation is not a policy.',
  },
  {
    /* A CLAIM ABOUT GOOGLE'S STORED STATE, WHICH NO GATE HERE CAN SEE. The repo was
       correct throughout — sitemap on disk right, live index right, deploy current —
       and the site was still effectively unindexed because of what Google had cached.
       Re-read it in Search Console; nothing in this repo can. */
    id: 'search-index-health', kind: 'human',
    where: 'PICKUP.md item 3b',
    claim: 'sitemap-0.xml submitted 2026-08-27 and reported 39 discovered pages; /check/ and /tools/ were NOT indexed and are queued',
    verified: '2026-08-27',
    note: 'A crawl request is a queue position, not an outcome. Watch Discovered pages on the sitemap-0.xml row and whether /check/ becomes indexed.',
  },
  {
    id: 'nextdoor-post-cap', kind: 'human',
    where: 'DECISIONS.md D21',
    claim: 'Free Nextdoor business posts are capped at ~2/month to the 2-mile neighborhood',
    verified: '2026-08-25',
    note: 'A load-bearing platform limit under a locked decision, with no source.',
  },
  {
    id: 'anthropic-pricing', kind: 'human',
    where: 'docs/live-assistant.md',
    claim: 'Intro $2/$10 per MTok through 2026-08-31, $3/$15 after',
    verified: '2026-07-22',
    note: 'EXPIRES within days of this entry, in a runbook now marked retired. Kept so it ages loudly rather than reading as current.',
  },
  {
    id: 'meeting-times', kind: 'human',
    where: 'docs/first-three.md · PICKUP.md item 1',
    claim: 'Rotary Tue 1pm The Chelsea · Breakfast Rotary Thu 7:30am DoubleTree · Kiwanis Tue 12:30pm Golden Corral · Farmers Market Sat 8am–2pm South Front',
    verified: '2026-08-25',
    note: 'Called "the real asset" in PICKUP. Five meeting times and four addresses, no source, and the thing most likely to send somebody to an empty room.',
  },
  {
    id: 'competitor-sweep', kind: 'human',
    where: 'DECISIONS.md D33',
    claim: 'Every previous differentiator was already published by a named competitor inside these counties',
    verified: '2026-08-24',
    note: 'The single most load-bearing market claim in the repo — the entire positioning rests on it — and the competitors are named nowhere in tracked files.',
  },
  {
    id: 'swissbear-capacity', kind: 'human',
    where: 'PICKUP.md item 4',
    claim: 'Two staff, ~$390k budget, FY2023 −$45,854 and FY2022 −$47,799 (IRS 990, EIN 56-1255578)',
    verified: '2026-08-25',
    source: 'https://projects.propublica.org/nonprofits/organizations/561255578',
    note: 'FY2024 exists but ProPublica has no extracted data. Re-read before leaning on the deficit.',
  },
  {
    id: 'mumfest-date', kind: 'human',
    where: 'PICKUP.md item 4',
    claim: 'MumFest is 10–11 October 2026; the vendor waitlist is at capacity; volunteer signup is open',
    verified: '2026-08-25',
    source: 'https://mumfest.com/',
    note: 'Their own /event/mumfest/ page still carries the 2025 date and is indexable. Trust /events/, not /event/.',
  },

  // ─── The trademark cluster, measured 2026-08-27 against the federal register ───
  // Run in the USPTO's own search, field-tag mode, with a positive control each time:
  // CM:"happy birthday" returned 142 and `salesforce` returned 79, so a zero here is a real
  // zero rather than a broken query. THE SEARCH SYNTAX MATTERS — the plain Wordmark mode ORs
  // multi-word queries and returned 6,342 hits for everything containing "applied".
  {
    id: 'trademark-appliediq-clear', kind: 'human',
    where: 'DECISIONS.md D47 · docs/trademark.md',
    claim: 'No federal trademark, live or dead, contains APPLIEDIQ or the phrase APPLIED IQ',
    verified: '2026-08-27',
    source: 'https://tmsearch.uspto.gov/',
    note: 'Queries CM:appliediq and CM:"applied iq", all statuses, zero results. A FIRST-LOOK SCREEN, NOT A CLEARANCE SEARCH: it does not cover sound-alike spellings, state registers, design-only marks, or unregistered users. Re-run before filing anything federal.',
  },
  {
    id: 'trademark-aiq-crowded', kind: 'human',
    where: 'DECISIONS.md D47',
    claim: 'AIQ carries 50 live federal marks, 29 of them live in Class 042, at least one registered',
    verified: '2026-08-27',
    source: 'https://tmsearch.uspto.gov/',
    note: 'CM:aiq AND LD:true AND IC:042 returned 29. Registered example: AIQ, EQUITAS Life Sciences LLC, serial 90980843, online non-downloadable software. AIQ and AIQS sit on the assumed-name certificate and must NOT be used as a standalone brand.',
  },
  {
    id: 'trademark-other-users', kind: 'human',
    where: 'DECISIONS.md D47',
    claim: 'At least three businesses trade as AppliedIQ, and none holds a federal registration',
    verified: '2026-08-27',
    source: 'https://appliediq.ai/',
    note: 'appliediq.ai (sales-intelligence software), appliediq.com, aiq-power.com (energy). OW:"applied iq" returned zero owners. Unregistered use still creates common-law rights in the market where the user trades, so an empty register does not mean an empty field. None appears to trade in NC, which is an inference from a web search and not a verified fact.',
  },

  /* REMOTE SUPPORT. Both rows exist because this repo already stated one of them
     wrongly. `docs/remote-support.md` v1 named Zoho Assist's free tier as the
     chosen tool, on three of Zoho's own pages plus a review site all agreeing a
     free plan existed. Signing up produced a 15-day trial. Four sources
     repeating one company's marketing copy is ONE source, and none of them was a
     measurement of what the signup flow does. */
  {
    id: 'zoho-assist-trial-expiry', kind: 'human',
    where: 'docs/remote-support.md · DECISIONS.md D58',
    claim: 'The Zoho Assist account created 2026-08-31 is a 15-day trial, and what it becomes on expiry is UNKNOWN',
    verified: '2026-08-31',
    source: 'https://assist.zoho.com/',
    note: 'Trial started 2026-08-31, so it lapses around 2026-09-15. Zoho\'s pricing page still advertises a FREE PLAN below the paid tiers, but that plan is not reachable from a signup — which is exactly the claim this repo already got wrong once. Do NOT record a reversion to a free edition until somebody has logged in after expiry and seen it. Portal: ian42086. Standard is $10/tech/month billed annually if it is ever worth paying for.',
  },
  {
    id: 'chrome-remote-desktop-commercial', kind: 'human',
    where: 'docs/remote-support.md',
    claim: 'Google does not state whether Chrome Remote Desktop may be used for paid client support work',
    verified: '2026-08-31',
    source: 'https://support.google.com/chrome/answer/1649523',
    note: 'The help pages cover the mechanics and say nothing about commercial use. Community threads lean toward it being intended as a personal tool, which is opinion rather than terms. This is an UNKNOWN carried deliberately, not a clearance — the tool is in use on that basis. Re-read if Google publishes terms, or if a client relationship makes the exposure worth resolving properly.',
  },

  /* ── THE THREE CLAIMS /websites/ ARGUES FROM, added 2026-09-03 ──────────────
     Each one is a fact about a national platform, read off that company's own
     help or pricing pages, and printed on a page that names the company. They
     are `human` for the reason the kind exists: REACHABLE_HOSTS defaults to no,
     nothing here may probe them, and a green tick beside a competitor's terms
     would be the same failure wearing a check mark. A person re-reads them.

     WHAT MAKES THESE MORE FRAGILE THAN THE REST OF THE REGISTRY. Every other
     human claim here ages against something slow -- a nonprofit's filings, a
     survey, a meeting time. These age against a product team, and a platform
     shipping an export tool would make a sentence on a live sales page false the
     day it shipped. That is why the page carries its own read date in visible
     copy rather than only here. */
  {
    id: 'wix-no-site-export', kind: 'human',
    where: 'src/data/home.ts websiteComparison · src/pages/websites.astro',
    claim: 'Wix offers no export of a site’s design, layout or pages; leaving requires a rebuild',
    verified: '2026-09-03',
    source: 'https://support.wix.com/en/article/exporting-content-from-your-wix-site',
    note: 'Partial DATA export exists (blog, store, contacts) and the claim is deliberately about the design, not the data. If Wix ever ships a layout export this line comes off the page the same day.',
  },
  {
    id: 'squarespace-lapse-window', kind: 'human',
    where: 'src/data/home.ts websiteComparison · src/pages/websites.astro',
    claim: 'A Squarespace site expires 15 days after payment is due, and content may be permanently deleted 30 days after that',
    verified: '2026-09-03',
    source: 'https://support.squarespace.com/hc/en-us/articles/207849197-My-site-is-past-due',
    note: 'The strongest line in the comparison because it comes from the vendor’s own help centre rather than a review site. Both numbers are theirs; do not round either.',
  },
  {
    id: 'godaddy-no-app-market', kind: 'human',
    where: 'src/data/home.ts websiteComparison · src/pages/websites.astro',
    claim: 'GoDaddy Websites + Marketing has no app market, so a third-party or custom tool cannot be added to a site',
    verified: '2026-09-03',
    source: 'https://www.websitebuilderexpert.com/website-builders/godaddy-review/',
    note: 'This is the row that earns the price, because it is the one thing the shelf makes true and no builder matches. Read from a review rather than GoDaddy itself, so it is the weakest-sourced of the three -- confirm against GoDaddy’s own feature list before leaning harder on it.',
  },

  /* ── The law the legal pair rests on ──────────────────────────────────────
     THE SITE HAD PUBLISHED /privacy/ AND /terms/ SINCE 2026-08-27 ON AN
     UNREGISTERED CLAIM. The reason was written into privacy.astro's own header
     comment and nowhere else, so nothing aged it and nothing could re-check it.
     A page whose entire value is being accurate rested on a statement about
     somebody else's system that this file exists to refuse.

     BOTH DIRECTIONS ARE REGISTERED, deliberately. The first says a law reaches
     this business, and if it stopped being true the page would merely be
     unnecessary. The second says a law does NOT reach it, and if THAT stopped
     being true the site would be out of compliance while looking fine — which
     is the one worth a warning. A negative finding ages exactly like a
     positive one, and this file has never held one before. */
  {
    id: 'caloppa-applies-no-threshold', kind: 'human',
    where: 'src/pages/privacy.astro · src/components/SiteFooter.astro · DECISIONS.md D43 · src/pages/websites.astro',
    claim: 'Cal. Bus. & Prof. Code § 22575 requires any commercial site collecting personal information from California residents to conspicuously post a privacy policy, with no revenue or size threshold, and reaches operators outside California',
    verified: '2026-09-03',
    source: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=BPC&sectionNum=22575',
    note: 'Read from the statute itself on 2026-09-03, not from a summary. Subsection (b) lists SIX things a policy must do and the page was checked clause by clause: (b)(5) do-not-track and (b)(6) cross-site collection were missing and were added that day. If this is ever re-read, re-read (b) rather than only confirming the section still exists.',
  },
  {
    id: 'ccpa-thresholds-not-met', kind: 'human',
    where: 'src/pages/privacy.astro header comment',
    claim: 'The CCPA/CPRA reaches a for-profit business only at roughly $26.6M annual revenue, 100,000 California residents\' data a year, or half of revenue from selling or sharing personal information — none of which this business approaches',
    verified: '2026-09-03',
    source: 'https://www.clym.io/blog/ccpa-applicability-guide',
    note: 'THIS IS WHY /privacy/ CARRIES NO "Do Not Sell or Share" LINK, and the absence is a decision rather than an oversight. The revenue figure is CPI-adjusted annually, so it moves every January. Re-read before adding or refusing any California rights section. Secondary source: the statutory text is Cal. Civ. Code § 1798.140(d) and should be read directly if this ever becomes load-bearing.',
  },
  {
    id: 'ca-auto-renewal-law', kind: 'human',
    where: 'docs/engagement/agreements/retainer-agreement.md',
    claim: "California's automatic renewal law (AB 2863, in force 2025-07-01) requires express affirmative consent to auto-renewal terms, cancellation by the same route used to subscribe, and annual reminders",
    verified: '2026-09-03',
    source: 'https://www.dwt.com/insights/2024/10/ab-2863-updates-california-automatic-renewal-law',
    note: 'Only bites if a recurring charge is ever offered to a California consumer, which is not today\'s client base. Registered anyway because the monthly upkeep is billed automatically, and the cheapest moment to satisfy a rule like this is while writing the terms rather than after a dispute. Stripe\'s customer portal is what makes same-route cancellation true.',
  },

  /* ── What it costs to be paid ─────────────────────────────────────────────
     THESE ARE A VENDOR'S PRICES, WHICH IS THE PUREST FORM OF A CLAIM ABOUT
     SOMEBODY ELSE'S SYSTEM. They are quoted in src/lib/payments.js to justify
     asking for a bank transfer on a build, and in nothing a client reads, so a
     drift costs an argument rather than a client. They still age.

     THEY CANNOT BE PROBED, and that is deliberate rather than a gap. Stripe is
     not on REACHABLE_HOSTS, and adding a host is an act with a name beside it.
     A vendor pricing page is also exactly the kind of page that answers a
     datacentre request differently from a person's browser, so a green tick here
     would be worth less than the read date. */
  {
    id: 'stripe-fees-us', kind: 'human',
    where: 'src/lib/payments.js · docs/engagement/client-documents/invoice.md',
    claim: 'Stripe US: online card 2.9% + 30 cents; ACH bank transfer 0.8% capped at $5; invoicing 0.4% capped at $2; subscriptions 0.7% of billing volume; in-person tap-to-pay 2.7% + 5 cents plus 10 cents per authorization; disputes $15',
    verified: '2026-09-03',
    source: 'https://stripe.com/pricing',
    note: 'The one that decides a design rather than a sentence is the ACH cap. At $5 flat, a $4,500 build billed in two halves costs about $14 to collect against about $135 on card — which is why the invoice document asks for a transfer on anything sizeable and the assessment can reasonably be a card link. If the cap ever moves, re-read that recommendation and not only the number.',
  },

  /* ── Cloudflare's own dashboard ───────────────────────────────────────────
     A CLIENT FOLLOWS THESE LABELS ALONE, WITH NOBODY BESIDE THEM, so a renamed
     button is not a cosmetic drift here — it is the point at which a
     non-technical owner stops and the build does not start. All three were read
     off the live dashboard on 2026-09-04, NOT off Cloudflare's documentation,
     because the documentation was measurably wrong on the same day: it still
     describes a "Continue to summary" step the rebuilt form does not have.

     dash.cloudflare.com is NOT on REACHABLE_HOSTS and must not be added. These
     are human claims: a signed-in browser is the only thing that can see any of
     these screens, so an automated probe could only ever confirm a login page. */
  {
    id: 'cloudflare-invite-flow-labels', kind: 'human',
    where: 'docs/engagement/client-documents/account-access.md · docs/client-accounts.md · docs/ownership-delivery.md',
    claim: 'Cloudflare members page reached by https://dash.cloudflare.com/?to=/:account/members or by sidebar group "Manage account" then "Members"; the invite form is "Invite members" and asks for Add email addresses, Define scope (default "Entire account") and Assign roles with a "Search by role name" box over 151 tickboxes, submitting on "Create policy" then "Invite members" with no summary step',
    verified: '2026-09-04',
    source: 'https://developers.cloudflare.com/fundamentals/manage-members/manage/',
    note: 'Walked in a signed-in browser, not read off the source above — and the source above is the reason to re-walk rather than re-read. It still lists a "Continue to summary" step that the form has not had since Cloudflare rebuilt it on 2025-10-30. VERIFIED LIVE: the redirect, the sidebar group, every field and button named in the claim, and that both submit buttons start disabled. NOT VERIFIED LIVE, because a one-member account cannot show them: the "Invite Pending" status value, the resend control label, and the wording on the removal confirmation shown for a second member. Re-walk before this document goes to a client and fix the labels rather than softening the sentences.',
  },
  {
    id: 'cloudflare-administrator-role-scope', kind: 'human',
    where: 'docs/engagement/client-documents/account-access.md · docs/client-accounts.md · docs/ownership-delivery.md · docs/engagement/client-documents/data-handling.md',
    claim: 'Cloudflare "Administrator" can access the full account and edit subscriptions but cannot manage members nor the billing profile; "Super Administrator - All Privileges" and "Administrator Read Only" sit beside it in the same list, and all three were selectable on a small account',
    verified: '2026-09-04',
    source: 'https://developers.cloudflare.com/billing/understand/billing-permissions/',
    note: 'The half that matters to a client is that Administrator CAN change or cancel a subscription while it CANNOT touch the payment method, billing address or billing email — "Administrator cannot do billing" is the intuitive summary and it is wrong. That it cannot manage members is what makes the promise in data-handling.md true: an invited Administrator cannot lock the owner out. A 2021 community post claiming free plans offer only Administrator was refuted on the live form, on ONE account — if a client ever cannot see the role, that is the thing to re-check rather than this sentence.',
  },
  {
    id: 'cloudflare-invite-requires-verified-email', kind: 'human',
    where: 'docs/engagement/client-documents/account-access.md · docs/client-accounts.md',
    claim: 'Inviting a Cloudflare member requires a Super Administrator with a verified email address; an unverified address fails with "you must verify your email address before you can invite members. (Code: 1001)", and free accounts have no ticket support path',
    verified: '2026-09-04',
    source: 'https://developers.cloudflare.com/fundamentals/user-profiles/verify-email-address/',
    note: 'This is the first thing the client document checks, because it is the documented blocker with the least self-explanatory message and the only one with no vendor to escalate to. https://dash.cloudflare.com/profile resolves and shows the section headed "Email" with a "Verified" tag — note that the Cloudflare page above calls that field "Email Address" and the badge "(verified)", and neither matched the live screen. The control offered when an address is NOT verified could not be seen from a verified account, so the document describes it rather than naming it.',
  },
  {
    id: 'github-collaborator-removal-path', kind: 'human',
    where: 'docs/engagement/client-documents/owner-runbook.md §8 · docs/client-accounts.md',
    claim: 'A GitHub repository collaborator is removed at https://github.com/<owner>/<repo>/settings/access, reached in the interface by the repo then Settings then the sidebar item "Collaborators" under the "Access" group, landing on a page titled "Manage access"',
    verified: '2026-09-04',
    source: 'https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-personal-account-on-github/managing-access-to-your-personal-repositories/removing-a-collaborator-from-a-repository-in-your-personal-account',
    note: 'Walked signed in on 2026-09-04 and the path in owner-runbook was already correct, which is the useful half: this class does not mean every third-party path is wrong, it means none of them is watched. VERIFIED LIVE: the direct address, the sidebar label, the page title. NOT VERIFIED, because the repository has no collaborators: the wording of the control that actually removes one. The same gap exists on the Cloudflare side for the same reason — see cloudflare-invite-flow-labels. Both close the first time a real collaborator exists, so re-walk at the first kickoff rather than scheduling it.',
  },
  {
    id: 'github-owner-only-actions', kind: 'human',
    where: 'docs/engagement/client-documents/account-access.md · docs/client-accounts.md §3',
    claim: 'All four GitHub steps a client must take are reserved to the account holder: creating the account (terms require the holder to accept them), creating the repository (a collaborator seat is per-repository and granted only after one exists, and a personal account cannot delegate creation), adding a collaborator, and installing the "Cloudflare Workers and Pages" app — GitHub states "Anyone can install GitHub Apps on their personal account" and lists no such right for collaborators',
    verified: '2026-09-04',
    source: 'https://docs.github.com/en/apps/using-github-apps/installing-a-github-app-from-a-third-party',
    note: 'The operational point is that NONE of the four can be lifted off the client, so a document promising less would be promising something the operator cannot deliver. Screens walked signed in the same day: https://github.com/new is headed "Create a new repository" and its visibility control OPENS ON PUBLIC, which is the one real trap in the sequence and is why the client document calls it out rather than listing it; the collaborator flow is Settings, then Collaborators under an "Access" heading, then "Add people", then "Add to repository"; the app appears in an installed list as exactly "Cloudflare Workers and Pages". NOT VERIFIED: the wording on the Install and Authorize screen, which cannot be seen without triggering an install on an account that already has one. Re-walk the visibility default first if this is ever re-read — a changed default would make the loudest warning in the document wrong.',
  },
];
