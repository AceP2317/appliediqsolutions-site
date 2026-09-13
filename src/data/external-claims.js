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
//      tell them rather than fix it." Also wrong — the organization had MOVED
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
//   assisted  NOBODY HAS TO GO AND LOOK — CLAUDE CAN, by driving the operator's
//          already-signed-in browser. Search Console, the Cloudflare dashboard,
//          a vendor screen behind a login. It ages and reports EXACTLY like
//          `human` and never passes on its own, and that is deliberate: this
//          file is imported by check-external.mjs, which runs in CI and on
//          every full verify where no signed-in browser exists. A browser probe
//          wired in here would pass by not running, which is the permissive
//          failure this whole registry was built against. The only thing the
//          kind changes is WHO the overdue line is addressed to.
// ============================================================================

/* ── EVERY CLAIM CARRIES ITS OWN EXPIRY, and the single one it replaced had
      NEVER FIRED IN THE REGISTRY'S LIFE ────────────────────────────────────

   One threshold governed all forty-two human claims: 120 days. Measured
   2026-09-09, the OLDEST claim in the file was 49 days. So the warning could
   not fire, had never fired, and `0 of those overdue` was not a measurement —
   it was the only answer the check could give.

   THAT IS NOT A CALIBRATION MISS, IT IS A CATEGORY ERROR. A crawl-queue
   position moves in days. A trademark register search is good for a year. They
   cannot share a number, and picking any single one makes the check useless for
   one end of the range: too tight and it cries wolf on the register, too loose
   and it sleeps through the queue. It was set loose.

   WHAT IT COST. On 2026-09-09 `search-index-health` was quoted in conversation
   as the current state of Google's index. It was thirteen days old and wrong —
   the queue it described had cleared — and this check had reported it healthy
   that morning.

   THE DEFAULT DOES NOT MOVE. Claims stay at 120 unless a tighter number is
   argued FOR that claim, so nothing silently tightens and every short expiry
   below carries its reason in a comment. */

/** Default when a claim names no `maxAgeDays` of its own. */
export const HUMAN_MAX_AGE_DAYS = 120;

/** How old a claim may get before it is overdue. Its own value, or the default. */
export function maxAgeFor(claim) {
  return typeof claim.maxAgeDays === 'number' ? claim.maxAgeDays : HUMAN_MAX_AGE_DAYS;
}

/** Ages and warns rather than passing — the kinds a machine cannot settle. */
export const AGEING_KINDS = ['human', 'assisted'];

/* ============================================================================
   THE ONLY HOSTS THIS REPO MAY CONTACT AUTOMATICALLY.

   Everything here is either a system we operate or a platform whose whole
   business is answering machines. NOTHING ELSE MAY BE FETCHED ON A SCHEDULE,
   and the two rules below are what a person could otherwise only remember:

     · A local business, nonprofit, prospect, client or competitor is NEVER
       contacted by anything automated. Not once a day, not once a week. New
       Bern is small, the work depends on how AppliedIQ is regarded in it, and
       a scheduled request from a company to a neighbor it is about to
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
  // a datacenter, identifying itself as AppliedIQ in the User-Agent. The volume
  // was trivial. That was never the point: Swiss Bear is the organization being
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
    verified: '2026-09-09',
    source: 'https://www.linkedin.com/in/ian-provencher/',
    note: 'LinkedIn returns HTTP 999 to any non-browser. Open it in a browser; a machine cannot tell a live profile from a deleted one here. Opened signed-in 2026-09-09: the profile is live, and its own Public profile & URL panel reads www.linkedin.com/in/ian-provencher. This entry carried the address WITHOUT the hyphen until then, disagreeing with links.ts — and no probe could ever have caught it, because 999 is what both a real address and a wrong one return.',
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

  // ─── Own-domain canonicalization, claimed in CLAUDE.md ────────────────────
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
    claim: 'LinkedIn headline cap 220 · About cap 2,600 · Services description cap 500',
    verified: '2026-09-09',
    maxAgeDays: 90,
    note: 'ALL THREE MEASURED ON THE LIVE FORMS 2026-09-09, and the third was wrong here for fifteen days. '
      + 'The Services cap is 500, not unknown — this file staged a 1,265-character block for it, two and a '
      + 'half times over, which would have truncated mid-sentence on the first paste. Only the Services form '
      + 'shows a counter; the About form shows none and enforces 2,600 ON SAVE, SILENTLY: a 2,907-character '
      + 'draft was accepted by the field with an enabled Save button and discarded with no message. So a cap '
      + 'here can only be trusted if somebody typed past it and watched what happened. check:offrepo measures '
      + 'the COUNTS; these CAPS are asserted by nothing but that reading.',
  },
  {
    /* MEASURED, not surveyed — read straight off the live fields on 2026-08-27 while
       pasting. Kept as `human` anyway, because a platform can change a cap without
       telling anyone and no probe here can see it. The value of writing them down is
       that the next draft starts from a real number instead of an empty one: the first
       Nextdoor overview drafted this session was 1101 characters against a 500 cap, and
       only the composer caught it. */
    id: 'platform-caps-measured', kind: 'human',
    maxAgeDays: 90, // measured off live forms, and forms change
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
    maxAgeDays: 90, // a platform behavior
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
    id: 'search-index-health', kind: 'assisted',
    maxAgeDays: 14, // a crawl position moves in days; this one went stale in 13 and was quoted as current
    where: 'PICKUP.md item 3b',
    claim: 'Search Console read 2026-09-09: sitemap-0.xml 57 discovered pages, last read that same day; 36 indexed, 18 not. /check/ and /work/ both report "URL is on Google — page is indexed".',
    verified: '2026-09-09',
    note:
      'THE QUEUE CLEARED. The previous entry recorded 39 discovered with /check/ and /tools/ unindexed, and it was thirteen days stale when re-read. The 18 not-indexed are almost all correct: 6 redirects, 1 deliberate noindex (/ian-card/), 1 canonical alternate, 4 queued but never crawled. Two REAL items remain, both tracked separately below. Re-read this before quoting it — a crawl position moves on its own and a number here goes stale in exactly the way the last one did.',
  },
  {
    /* THE ONLY SEARCH FINDING WITH SOMETHING TO BUILD. Google crawled two
       industrial demo pages and declined to index them, and they are exactly
       the two with no written body. Measured 2026-09-09 with a control on both
       sides: tip-out-sheet and job-quote carry a `data-tool-body` marker in
       dist and bom-explorer and past-due-order-triage carry none.

       That is a correlation rather than a proof, but it is the same reasoning
       the shelf bodies were written from on 2026-09-07: /work/<slug>/ renders a
       client:only island, so a crawler sees NONE of the tool and the prose is
       the page's whole body. The `tools` content collection holds one file per
       SHELF slug; the seven industrial demos were never in scope. */
    id: 'industrial-demos-not-indexed', kind: 'assisted',
    maxAgeDays: 14, // same queue, same speed
    where: 'src/content/tools/ — one body per shelf slug, none for the industrial seven',
    claim: 'Google has crawled /work/bom-explorer/ and /work/past-due-order-triage/ and left both "Crawled - currently not indexed"; neither page has a written body, while every shelf tool does',
    verified: '2026-09-09',
    note: 'The other five industrial demos are not in the report at all, so this is two of seven measured rather than a class confirmed. Check the rest before deciding whether to write bodies for them; the fix, if taken, is the same one the shelf got.',
  },
  {
    /* WORKING TODAY, and the record Google holds is from before it was. */
    id: 'bare-url-redirect-error', kind: 'assisted',
    maxAgeDays: 30, // closed, but it rests on a redirect and an index state that can both move
    where: 'CLAUDE.md — "the CF assets layer 307-redirects the bare form"',
    claim: 'Search Console lists /bio and /work (slash-less) under "Redirect error", last crawled 2026-06-30, with a validation started 2026-07-04 still showing "Started"; both return a single 307 to the slashed form and then 200 when tested 2026-09-09',
    verified: '2026-09-09',
    note:
      'CLOSED ON EVIDENCE 2026-09-09, do not reopen it without new evidence. An earlier version of this note called the fix "a Cloudflare rule rather than a code edit", which was written without looking. Looked: the zone has NO redirect rules configured at all and wrangler.jsonc sets no html_handling, so the 307 is the static-assets layer\'s default normalization and there is no setting to flip — a 301 would mean CREATING a rule, in the dashboard or in code. It is not worth creating. A permanent redirect matters when the redirect is the only thing telling a search engine which URL is authoritative; here it is the third of three. Both pages carry a canonical pointing at the slashed form, the sitemap lists the slashed form, and both slashed forms are indexed. And a 301 is the one redirect that is expensive to get wrong, because browsers and crawlers cache it hard. Do not treat the stuck validation as evidence of a live fault; both URLs were measured working.',
  },
  {
    id: 'nextdoor-post-cap', kind: 'human',
    maxAgeDays: 90, // a platform limit with no source
    where: 'DECISIONS.md D21',
    claim: 'Free Nextdoor business posts are capped at ~2/month to the 2-mile neighborhood',
    verified: '2026-08-25',
    note: 'A load-bearing platform limit under a locked decision, with no source.',
  },
  {
    id: 'anthropic-pricing', kind: 'human',
    maxAgeDays: 30, // its own note says it expires within days of being written
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
    maxAgeDays: 30, // a trial expiry is time-bound by nature
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

  /* ── THE PLATFORM CLAIMS, added 2026-09-03 and widened 2026-09-10 ───────────
     Each one is a fact about a national platform, read off that company's own
     help or pricing pages, and printed on a page that names the company. They
     never probe: REACHABLE_HOSTS defaults to no, and a green tick beside a
     competitor's terms would be the same failure wearing a check mark.

     WHAT MAKES THESE MORE FRAGILE THAN THE REST OF THE REGISTRY. Every other
     human claim here ages against something slow -- a nonprofit's filings, a
     survey, a meeting time. These age against a product team, and a platform
     shipping an export tool would make a sentence on a live sales page false the
     day it shipped. That is why the page carries its own read date in visible
     copy rather than only here.

     AND ON 2026-09-10 EXACTLY THAT HAPPENED, WHICH IS WHY THE EXPIRIES BELOW
     ARE NOW 90 DAYS RATHER THAN THE 120-DAY DEFAULT. The paragraph above had
     described this failure since the day the claims were written, and the three
     claims it describes were left on the default clock anyway -- so the warning
     that would have caught it could not fire until January. `godaddy-no-app-
     market` had gone false: GoDaddy retired Websites + Marketing in place of an
     AI builder whose own page advertises code export, and the claim was the one
     sourced from a review site rather than the vendor. Its own note said to
     confirm against GoDaddy's own pages before leaning harder on it. Nobody did,
     and the line shipped on /websites/ for a week.

     THE LESSON IS THE SOURCE, NOT THE CLOCK. Four review sites agreeing is one
     source, and it is the company's own source repeated back. Every claim added
     on 2026-09-10 was read in a browser on the vendor's own pricing page,
     because four of these hosts refuse a plain fetch and two render their
     figures in JavaScript -- so a scripted read would have reported nothing and
     a review site would have reported last year's plan names.

     `assisted` ON THE NEW ONES, `human` ON THE OLD. Both age identically and
     neither ever passes. The difference is who can refresh it: an assisted claim
     is one Claude can re-read by driving the browser, which is what turns a
     quarterly chore into a command. */
  {
    id: 'wix-no-site-export', kind: 'human',
    where: 'src/data/home.ts websiteComparison · src/pages/websites.astro · src/data/platform-comparison.js',
    claim: 'Wix offers no export of a site’s design, layout or pages; leaving requires a rebuild',
    verified: '2026-09-03',
    maxAgeDays: 90, // ages against a product team, not a filing cabinet — see the block note
    source: 'https://support.wix.com/en/article/exporting-content-from-your-wix-site',
    note: 'Partial DATA export exists (blog, store, contacts) and the claim is deliberately about the design, not the data. If Wix ever ships a layout export this line comes off the page the same day.',
  },
  {
    id: 'squarespace-lapse-window', kind: 'human',
    where: 'src/data/home.ts websiteComparison · src/pages/websites.astro · src/data/platform-comparison.js',
    claim: 'A Squarespace site expires 15 days after payment is due, and content may be permanently deleted 30 days after that',
    verified: '2026-09-03',
    maxAgeDays: 90, // ages against a product team, not a filing cabinet — see the block note
    source: 'https://support.squarespace.com/hc/en-us/articles/207849197-My-site-is-past-due',
    note: 'The strongest line in the comparison because it comes from the vendor’s own help center rather than a review site. Both numbers are theirs; do not round either.',
  },
  /* `godaddy-no-app-market` STOOD HERE UNTIL 2026-09-10 AND IT HAD GONE FALSE.
     It asserted that Websites + Marketing has no app market. That product has
     been replaced by GoDaddy Website Builder, an AI builder whose own page
     advertises code export and manual code editing, so the sentence names a
     thing that is no longer sold. It is replaced rather than repaired, because
     the repair would assert an export result nobody here has produced. The
     line it fed on /websites/ is replaced too. */
  {
    id: 'godaddy-ai-credits', kind: 'assisted',
    where: 'src/data/home.ts websiteComparison · src/pages/websites.astro · src/data/platform-comparison.js',
    claim: 'GoDaddy Website Builder meters editing in monthly AI credits on every plan — 50 free, 150 on Starter, 300 on Professional, 750 on Ultimate',
    verified: '2026-09-10',
    maxAgeDays: 90,
    source: 'https://www.godaddy.com/websites/website-builder (plans panel, behind "See Plans and Prices")',
    note: 'READ IN A BROWSER, because the plans panel loads behind a click and a plain fetch of that URL returns 403. This replaces the app-market claim as the row that earns the price, and it is a stronger one: it is a limit on editing the site you already pay for, off GoDaddy’s own plans table rather than a review site.',
  },
  {
    id: 'wix-price-light', kind: 'assisted',
    where: 'src/data/platform-comparison.js · src/pages/websites/compare.astro',
    claim: 'Wix Light, the cheapest plan that removes Wix branding and carries a custom domain, is $17.77/month billed annually',
    verified: '2026-09-10',
    maxAgeDays: 90,
    source: 'https://www.wix.com/plans',
    note: 'Core $29.77, Business $39.77, Business Elite $159.77, all annual. Wix quotes these as yearly subscriptions paid in full; the monthly figure is theirs, divided by twelve on their own page.',
  },
  {
    id: 'squarespace-price-basic', kind: 'assisted',
    where: 'src/data/platform-comparison.js · src/pages/websites/compare.astro',
    claim: 'Squarespace plans are Basic $19, Core $29, Plus $49 and Advanced $99 per month billed annually',
    verified: '2026-09-10',
    maxAgeDays: 90,
    source: 'https://www.squarespace.com/pricing',
    note: 'THE PLAN NAMES CHANGED AND EVERY REVIEW SITE STILL SAYS PERSONAL AND BUSINESS. That is the whole argument for reading the vendor: a secondary source here would have published last year’s tiers under this year’s date. Figures render in JavaScript, so this needs a browser.',
  },
  {
    id: 'godaddy-price-starter', kind: 'assisted',
    where: 'src/data/platform-comparison.js · src/pages/websites/compare.astro',
    claim: 'GoDaddy Website Builder is Free, Starter $9.99, Professional $24.99 and Ultimate $99.99 per month billed annually',
    verified: '2026-09-10',
    maxAgeDays: 90,
    source: 'https://www.godaddy.com/websites/website-builder (plans panel, behind "See Plans and Prices")',
    note: 'Behind a click and a 403 to a plain fetch. Starter is the cheapest paid plan on the comparison page.',
  },
  {
    id: 'square-free-online-site', kind: 'assisted',
    where: 'src/data/platform-comparison.js · src/pages/websites/compare.astro',
    claim: 'Square Free costs $0/month per location and lists an online site among what it includes',
    verified: '2026-09-10',
    maxAgeDays: 90,
    source: 'https://squareup.com/us/en/pricing',
    note: 'THIS IS THE ENTRY THAT BREAKS THE OBVIOUS ARGUMENT. "You rent it and the rent never stops" does not reach a business already taking cards through Square, which has a website it may not know about. Square Plus is $49 and Premium $149, both per location.',
  },
  {
    id: 'square-online-card-rate', kind: 'assisted',
    where: 'src/data/platform-comparison.js · src/pages/websites/compare.astro',
    claim: 'Square charges 3.3% + 30c on an online payment on the free plan against 2.9% + 30c on Square Plus',
    verified: '2026-09-10',
    maxAgeDays: 90,
    source: 'https://squareup.com/us/en/pricing',
    note: 'What the free site actually costs, and the only honest way to compare a $0 product against a priced one. In person the same split is 2.6% + 15c against 2.5% + 15c. Do not present this as a fee for the website — it is the plan’s rate, and the site rides along with it.',
  },
  {
    id: 'shopify-price-basic', kind: 'assisted',
    where: 'src/data/platform-comparison.js · src/pages/websites/compare.astro',
    claim: 'Shopify Basic is $29/month billed annually or $39 billed monthly, with online card fees of 2.9% + 30c and 2% on a third-party gateway',
    verified: '2026-09-10',
    maxAgeDays: 90,
    source: 'https://www.shopify.com/pricing',
    note: 'Grow $79 annual, Advanced $299 annual, Plus from $2,300. The third-party gateway fee is the one a business never sees coming.',
  },
  {
    id: 'wordpress-price-business', kind: 'assisted',
    where: 'src/data/platform-comparison.js · src/pages/websites/compare.astro',
    claim: 'WordPress.com Business, the tier a business needs for plugins, displays at $17.50/month',
    verified: '2026-09-10',
    maxAgeDays: 90,
    source: 'https://wordpress.com/pricing/',
    note: 'THE WEAKEST FIGURE ON THIS PAGE, AND IT SAYS SO. The cheaper tiers display as ranges ($2.75-$3.25), which is the shape of a promotional first-term rate, so the renewal price is not visible without going to checkout. Self-hosted WordPress has no monthly price at all — it is hosting plus your own time. Confirm at checkout before quoting the renewal.',
  },
  {
    id: 'lovable-price-pro', kind: 'assisted',
    where: 'src/data/platform-comparison.js · src/pages/websites/compare.astro',
    claim: 'Lovable is Free, Pro $25/month and Business $50/month',
    verified: '2026-09-10',
    maxAgeDays: 90,
    source: 'https://lovable.dev/pricing',
    note: 'Figures render in JavaScript; a plain fetch returns the shell with no prices in it.',
  },
  {
    id: 'lovable-github-sync', kind: 'assisted',
    where: 'src/data/platform-comparison.js · src/pages/websites/compare.astro',
    claim: 'Lovable states that you own the code it generates and syncs it to a GitHub repository you control',
    verified: '2026-09-10',
    maxAgeDays: 90,
    source: 'https://lovable.dev/pricing · https://docs.lovable.dev/introduction/plans-and-credits',
    note: 'THE CLAIM THAT BLUNTS THIS SITE’S STRONGEST LINE, which is why it is registered rather than argued around. "The files are yours" no longer separates a build here from a $25/month product. What still separates them is who can read those files at eleven at night, and that is an argument about maintenance rather than ownership. Never soften this one to protect the pitch.',
  },
  {
    id: 'framer-price-basic', kind: 'assisted',
    where: 'src/data/platform-comparison.js · src/pages/websites/compare.astro',
    claim: 'Framer site plans are Basic $10/month and Pro $30/month',
    verified: '2026-09-10',
    maxAgeDays: 90,
    source: 'https://www.framer.com/pricing/',
    note: 'The cheapest of the AI builders, and the design-first one. Enterprise is quoted rather than listed.',
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
     datacenter request differently from a person's browser, so a green tick here
     would be worth less than the read date. */
  {
    id: 'stripe-fees-us', kind: 'assisted',
    maxAgeDays: 90, // re-read 2026-09-11 for /getting-paid/ and moved onto the platform clock
    where: 'src/lib/payments.js · docs/engagement/client-documents/invoice.md · src/data/getting-paid.js',
    claim: 'Stripe US: online card 2.9% + 30 cents, plus 0.5% manually entered, plus 1.5% international, plus 1% where currency conversion is required; ACH bank transfer 0.8% capped at $5; invoicing 0.4% per paid invoice and 0.4% capped at $2 on a post-payment invoice; subscriptions 0.7% of billing volume; in-person 2.7% + 5 cents plus 10 cents per authorization for Tap to Pay; disputes $15 received and $15 countered, the second refunded on a win',
    verified: '2026-09-11',
    source: 'https://stripe.com/pricing',
    note: 'The one that decides a design rather than a sentence is the ACH cap. At $5 flat, a $4,500 build billed in two halves costs about $14 to collect against about $135 on card — which is why the invoice document asks for a transfer on anything sizeable and the assessment can reasonably be a card link. If the cap ever moves, re-read that recommendation and not only the number. RE-READ 2026-09-11 IN A BROWSER: every figure above was still current, and the international and conversion surcharges were added because /getting-paid/ serves businesses selling across a border. Kind moved from human to assisted at the same time — a signed-in browser is not needed for this page, so Claude can refresh it.',
  },
  {
    id: 'stripe-managed-payments-mor', kind: 'assisted',
    where: 'src/data/getting-paid.js merchant-of-record card',
    claim: 'Stripe sells a merchant-of-record product, Managed Payments, at 3.5% per transaction in addition to ordinary Payments fees, covering indirect tax compliance and remittance in more than 75 countries plus fraud, disputes, invoicing and customer support',
    verified: '2026-09-11',
    maxAgeDays: 90,
    source: 'https://stripe.com/pricing',
    note: 'THIS IS WHY THE MERCHANT-OF-RECORD CARD IS NOT A NICHE TWO COMPANIES OCCUPY. Stacked on 2.9% + 30c it comes to about 6.4% + 30c, which is DEARER than Paddle or Lemon Squeezy at 5% + 50c on any sale above roughly $12 — the arithmetic on the page says so rather than the copy. Do not describe Stripe as the cheap option on that card.',
  },
  {
    id: 'square-fee-table-2026', kind: 'assisted',
    where: 'src/data/getting-paid.js square card',
    claim: 'Square US processing by plan (Free / Plus / Premium): tap, dip or swipe 2.6% + 15c, 2.5% + 15c, 2.4% + 15c; online 3.3% + 30c, 2.9% + 30c, 2.9% + 30c; online API 2.9% + 30c on all three; ACH by invoice 1% with a $1 minimum and NO fee cap on Free against a $10 cap on Plus and Premium; ACH by API 1%, $1 minimum, $5 cap on all three; manual entry or card on file 3.5% + 15c on all three; cash or check free; next-day transfers included on every plan',
    verified: '2026-09-11',
    maxAgeDays: 90,
    source: 'https://squareup.com/us/en/pricing (fees table, behind the "Fees" accordion at the foot of the plan comparison)',
    note: 'READ IN A BROWSER, because the fee table is collapsed behind a click and does not appear in the page text until it is opened. THE LINE WORTH THE WHOLE CLAIM IS THE ACH CAP: on the free plan an invoice paid by bank transfer is 1% with no ceiling, so a $10,000 invoice costs $100 where Plus caps it at $10. Nothing on the plan card says so, and it is the opposite of the usual free-tier trade — here the free plan is uncapped and the paid one protects you.',
  },
  {
    id: 'paypal-merchant-fees-us', kind: 'assisted',
    where: 'src/data/getting-paid.js paypal card',
    claim: 'PayPal US merchant rates: PayPal Checkout and Guest Checkout 3.49% + $0.49; standard credit and debit 2.99% + $0.49; QR code 2.29% + $0.09; Pay with Venmo 3.49% + $0.49; Pay Later 4.99% + fixed; international commercial transactions add 1.50%; invoicing paid by bank 1% capped at $10; PayPal Point of Sale card-present 2.29% + $0.09 and manual entry 3.49% + $0.09; chargeback $20; standard dispute $15 and high-volume dispute $30; currency conversion spread 3.00%, or 4.00% on some transaction types',
    verified: '2026-09-11',
    maxAgeDays: 90,
    source: 'https://www.paypal.com/us/business/paypal-business-fees (page stamped "Last Updated: September 1, 2026")',
    note: 'THE CONVERSION SPREAD IS THE FIGURE THAT DECIDES A RECOMMENDATION RATHER THAN A SENTENCE. At 3% to 4% it is the widest on the sheet, against Stripe at +1% and Squarespace at +1%, so a business selling abroad pays two or three points more here before anything else is counted. PayPal also publishes an Interchange Plus Plus option at interchange + 0.49% + fixed with NO international surcharge, which is the escape hatch a cross-border seller should ask about.',
  },
  {
    id: 'paypal-risk-rate-increase', kind: 'assisted',
    where: 'src/data/getting-paid.js paypal card, whenMoneyArrives row',
    claim: 'PayPal publishes a term reserving the right to increase the percentage component of a merchant’s transaction fees by up to 5.00% per transaction, after 30 days prior notice, where it determines the account is likely to receive a disproportionately higher number of complaints, reversals, chargebacks or claims',
    verified: '2026-09-11',
    maxAgeDays: 90,
    source: 'https://www.paypal.com/us/business/paypal-business-fees ("Additional Risk Factors", under Other fees for using PayPal Online Payment Services)',
    note: 'NO OTHER COMPANY ON THE SHEET PUBLISHES A TERM LIKE THIS, which is why it is registered separately from the rate table rather than folded into it. It is a published term rather than an anecdote about frozen accounts, and that distinction is the whole reason it can go on a page — the freeze stories are everywhere and none of them is a source.',
  },
  {
    id: 'venmo-business-profile-fees', kind: 'assisted',
    where: 'src/data/getting-paid.js p2p-apps card',
    claim: 'Venmo charges 1.9% + $0.10 on a payment received to a business profile, 2.29% + $0.09 where that payment comes through Tap to Pay, 1.9% + $0.10 to a charity profile, and 2.99% on a payment received into a PERSONAL account that the sender identified as for goods and services; personal payments between users are free; the currency conversion spread is 4.00%',
    verified: '2026-09-11',
    maxAgeDays: 90,
    source: 'https://venmo.com/resources/our-fees/ (under "Adding money to your account and receiving payments", behind an accordion)',
    note: 'THE CHEAPEST HEADLINE RATE ON THE WHOLE SHEET, and it goes on the page for that reason rather than in spite of it — 1.9% + 10c beats every card processor here. The 2.99% personal-account line is the other half and is the expensive mistake a small business actually makes: taking business money on a personal profile, where the sender can flag it as goods and services and you are charged more than the business rate on a payment you thought was free. Read in a browser; the fee table is collapsed and does not appear in the page text until opened.',
  },
  {
    id: 'cashapp-business-fees', kind: 'assisted',
    where: 'src/data/getting-paid.js p2p-apps card',
    claim: 'Cash App Business accounts are free to create and need no additional hardware; Cash App deducts 2.6% + $0.15 on each payment received from a customer’s Cash App account and 3% on each payment accepted via Tap to Pay',
    verified: '2026-09-11',
    maxAgeDays: 90,
    source: 'https://cash.app/help/us/en-us/6521-cash-app-business-fees',
    note: 'The obvious URLs for this are all wrong — cash.app/business redirects to the consumer homepage and the fee help article numbered 6485 is a getting-started page. This id is the one that carries the rate. Dearer than a Venmo business profile at the same job, which is worth knowing before recommending either.',
  },
  {
    id: 'zelle-business-no-fee', kind: 'assisted',
    where: 'src/data/getting-paid.js p2p-apps card',
    claim: 'Zelle publishes no fee of its own for small business use and states that eligibility runs through the bank — "Contact your bank or credit union to see if they offer Zelle to eligible small businesses"; its own guidance is to treat Zelle like cash and only send money to those you trust',
    verified: '2026-09-11',
    maxAgeDays: 90,
    source: 'https://www.zelle.com/business · https://www.zelle.com/digital-payment-education',
    note: 'ZELLE IS NOT A PROCESSOR AND THE CARD MUST NOT CALL IT ONE. It moves money between bank accounts, the bank decides whether a business may use it, and there is no card network behind it — so there is no chargeback, no dispute process and no seller protection. "Treat it like cash" is Zelle’s own phrase and is quoted rather than characterized.',
  },
  {
    id: 'clover-retail-rates', kind: 'assisted',
    where: 'src/data/getting-paid.js terminals card',
    claim: 'Clover retail systems bought online: card tapped, swiped or inserted 2.6% + 10c on Basic and 2.3% + 10c on Standard and Advanced; card information typed in 3.5% + 10c on all three; Rapid Deposit 1.75%; hardware $349 or $16/mo over 36 months on Basic, $1,899+ or $180/mo plus $84.95/mo software on Standard, $2,648+ or $240/mo plus $104.90/mo on Advanced; the page states "Prices shown are only available online"',
    verified: '2026-09-11',
    maxAgeDays: 90,
    source: 'https://www.clover.com/pricing/retail',
    note: 'THE QUALIFIER IS THE CLAIM. Clover’s own page says these prices exist only for a direct online purchase, and a Clover sold by a bank or an independent reseller carries a different rate on a different contract — which is the ordinary way a local business gets one. Never quote these figures to somebody who was sold a Clover by their bank. clover.com/pos-systems/pricing is a 404 that renders a category list rather than erroring; the rate pages are segmented by trade under /pricing/<trade>.',
  },
  {
    id: 'toast-no-published-rate', kind: 'assisted',
    where: 'src/data/getting-paid.js terminals card · src/lib/payment-cost.js header',
    claim: 'Toast publishes no card processing rate on its pricing page — the plans read "Custom pricing" and "Simple, flat rate" with no figure anywhere on the page, software starts at $0/month for a starter kit and $69/month for Point of Sale, and Toast states it "is not a payment card processor, but it is a payment facilitator that partners with processors"',
    verified: '2026-09-11',
    maxAgeDays: 90,
    source: 'https://pos.toasttab.com/pricing',
    note: 'A NEGATIVE FINDING, AND IT IS LOAD-BEARING RATHER THAN A GAP IN THE READING. It is the reason payment-cost.js refuses to price the terminals card at all, and the reason that refusal prints a sentence instead of a blank. If Toast ever publishes a rate this claim goes false in the useful direction and the card gains a number — re-read the page rather than softening the sentence.',
  },
  {
    id: 'quickbooks-payment-rates', kind: 'assisted',
    where: 'src/data/getting-paid.js bundled card',
    claim: 'QuickBooks Payments US: cards and digital wallets on invoices, recurring payments or quick requests 2.99%; ACH bank payments 1%; in-person 2.5%; keyed-in cards 3.5%; buy now pay later 2.99%; no monthly fee or minimum, and merchants processing over $2,500 a month are invited to call about up to 25% off standard rates',
    verified: '2026-09-11',
    maxAgeDays: 90,
    source: 'https://quickbooks.intuit.com/payments/payment-rates/',
    note: 'THE PAGE CARRIES INTUIT’S OWN COMPARISON AGAINST STRIPE AND SQUARE AND IT IS STALE — see quickbooks-competitor-table-stale. Intuit’s own rates above are taken as read because they are its own prices; the competitor column beside them is not. quickbooks.intuit.com/payments/pricing/ redirects to a plans page with no rates on it, and the rate table sits behind this URL instead.',
  },
  {
    id: 'quickbooks-competitor-table-stale', kind: 'assisted',
    where: 'src/data/getting-paid.js header · /getting-paid/ page copy',
    claim: 'Intuit publishes a rate comparison against Square and Stripe stamped "Rates are accurate as of 04/30/2026", and two of its competitor figures disagree with those vendors’ own pages read on 2026-09-11: it shows Stripe ACH at 1.2% where Stripe publishes 0.8% capped at $5, and Square in person at 2.6% + 10c where Square publishes 2.6% + 15c',
    verified: '2026-09-11',
    maxAgeDays: 90,
    source: 'https://quickbooks.intuit.com/payments/payment-rates/ · https://stripe.com/pricing · https://squareup.com/us/en/pricing',
    note: 'THE SINGLE BEST ARGUMENT FOR /getting-paid/ EXISTING, and it must be stated fairly or not at all. Intuit dates its own table and says it shows "only most comparable plan by feature", so this is staleness rather than deceit, and the page says staleness. All three figures were read the same day, which is what makes the comparison legitimate — a claim that one vendor misstates another is worth nothing unless both sides were read together. Re-read ALL THREE before repeating it, never just the Intuit page.',
  },
  {
    id: 'wix-payments-fees-us', kind: 'assisted',
    where: 'src/data/getting-paid.js bundled card',
    claim: 'Wix Payments US service fees: credit and debit cards excluding American Express 2.9% + $0.30, the same for Apple Pay and Google Pay; American Express including through those wallets 3.7% + $0.30; PayPal 3.49% + $0.49; Pay Later 4.99% + $0.49; Venmo 3.49%',
    verified: '2026-09-11',
    maxAgeDays: 90,
    source: 'https://support.wix.com/en/article/wix-payments-service-fees',
    note: 'THE AMERICAN EXPRESS LINE IS THE ONE WORTH CARRYING. At 3.7% against 2.9% it is nearly a point dearer on a card plenty of customers hand over without thinking, and no other option on the sheet publishes an Amex surcharge. wix.com/payments/pricing is a 404; the fees live in the support article and are selected by country on the page.',
  },
  {
    id: 'squarespace-payment-rates', kind: 'assisted',
    where: 'src/data/getting-paid.js bundled card',
    claim: 'Squarespace Payments US rates move with the website plan: standard cards 2.9% + $0.30 on Basic and Core, 2.7% + $0.30 on Plus, 2.5% + $0.30 on Advanced; international cards add 1.5% and currency conversion adds 1% on every plan; ACH Direct Debit 1.5% on Basic and 1% on the rest with a $10 maximum fee; premium cards 3.2% + $0.30; Klarna 5.45% + $0.30; Afterpay 6% + $0.30',
    verified: '2026-09-11',
    maxAgeDays: 90,
    source: 'https://support.squarespace.com/hc/en-us/articles/27853679334157-Transaction-fees-and-payment-processing-rates (page last updated August 3, 2026)',
    note: 'THIS IS THE CLAIM THAT PROVES THE BUNDLED CARD’S THESIS. The same sale costs different money depending on which website plan you bought, so the payment rate was decided by a website decision nobody framed as one. The premium-card line at 3.2% is the second half: a customer paying with a rewards card costs more and nothing on the plan page says so.',
  },
  {
    id: 'paddle-pricing', kind: 'assisted',
    where: 'src/data/getting-paid.js merchant-of-record card',
    claim: 'Paddle charges 5% + 50c per checkout transaction with no monthly, migration or hidden fees, covering payments, billing, cross-border sales tax compliance and protection against fraud and chargebacks; products under $10 or requiring invoicing need custom pricing',
    verified: '2026-09-11',
    maxAgeDays: 90,
    source: 'https://www.paddle.com/pricing',
    note: 'Identical headline to Lemon Squeezy, which is why the card states one rate for the category rather than two. The under-$10 exclusion matters for anyone selling a cheap digital item and is the first thing to check before recommending it.',
  },
  {
    id: 'lemonsqueezy-pricing', kind: 'assisted',
    where: 'src/data/getting-paid.js merchant-of-record card',
    claim: 'Lemon Squeezy charges 5% + 50c per transaction for ecommerce with no monthly charges, including global payment acceptance, fully automated sales tax compliance and fraud protection; some payments may be subject to additional fees and volume pricing is by request',
    verified: '2026-09-11',
    maxAgeDays: 90,
    source: 'https://www.lemonsqueezy.com/pricing',
    note: 'Matches Paddle to the cent, which is what lets the merchant-of-record card quote a single figure honestly. Their own page carries a "some payments may be subject to additional fees" asterisk with no detail behind it — do not present 5% + 50c as a ceiling.',
  },

  /* ── THE STORE-PLATFORM AUDIT, 2026-09-11 ─────────────────────────────────
     WHAT THIS BLOCK ANSWERS THAT NO PUBLISHED COMPARISON DOES. Every store
     comparison on the internet answers "which platform should I sell on". These
     claims answer a second question that decides what THIS PRACTICE CAN SELL:
     can a page we build read the merchant's own catalog and hand a configured
     item to that platform's cart, and what credential does that need?

     The answer splits the field and the split is commercially load-bearing. Four
     platforms permit it with a credential that is safe in a browser. Six require
     a secret, which would mean running a server holding a token that can read a
     client's orders — the thing D96 says we do not hold. Two have no checkout to
     build against at all.

     EVERY ONE WAS READ IN A BROWSER ON THE VENDOR'S OWN DEVELOPER DOCUMENTATION
     on 2026-09-11, not from a summary and not from a review site. That matters
     more here than anywhere else in this file: a wrong answer in the permissive
     direction would have us promising a client something the platform forbids.

     THEY ARE `assisted` AT 90 DAYS. Developer documentation moves with a product
     team, exactly like a pricing page, and BigCommerce already publishes a
     deprecation date inside this window. One is `human`: TikTok Shop's fee
     schedule sits behind a seller login that returned 401, so no browser of
     Claude's can reach it and a person with an account must. */
  {
    id: 'shopify-storefront-public-token', kind: 'assisted',
    where: 'the store-platform comparison · the configurator offer',
    claim: 'Shopify\u2019s GraphQL Storefront API lets an outside page view products and collections, add products to a cart and check out from any platform including the web; creating a headless storefront issues both a public and a private access token, the public one delegating unauthenticated access scopes; the Cart object exposes checkoutUrl to send buyers to Shopify\u2019s own web checkout; and ProductVariant exposes price, availableForSale, quantityAvailable and selectedOptions',
    verified: '2026-09-11',
    maxAgeDays: 90,
    source: 'https://shopify.dev/docs/api/storefront/latest \u00b7 https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/getting-started \u00b7 https://shopify.dev/docs/api/storefront/latest/objects/Cart \u00b7 https://shopify.dev/docs/api/storefront/latest/objects/ProductVariant \u00b7 https://shopify.dev/docs/api/admin-rest/latest/resources/storefrontaccesstoken',
    note: 'THIS IS THE CLAIM THE CONFIGURATOR OFFER RESTS ON, so re-read all five pages rather than one before leaning on it. The four fields at the end each answer an objection raised and withdrawn on 2026-09-11: prices drift, stock is invisible, and variant identifiers multiply. They do not drift because the page reads them live from the merchant\u2019s own store. The public token is not a secret and belongs in a browser; the PRIVATE token from the same screen is a secret and must never go near one.',
  },
  {
    id: 'woocommerce-store-api-unauthenticated', kind: 'assisted',
    where: 'the store-platform comparison',
    claim: 'The WooCommerce Store API provides public REST endpoints for customer-facing cart, checkout and product functionality, is explicitly unauthenticated and requires no API keys or tokens, and exposes cart add-item, remove-item, update-item, coupon, shipping-rate and checkout endpoints under /wp-json/wc/store/v1',
    verified: '2026-09-11',
    maxAgeDays: 90,
    source: 'https://developer.woocommerce.com/docs/apis/store-api/',
    note: 'THE MOST OPEN OF THE TWELVE AND THE LEAST PROVEN IN PRACTICE. Its own page states that customer sessions are cookie-based and that write endpoints require a nonce token, which is straightforward on the same site and UNTESTED from a different origin. Do not promise a cross-origin cart on WooCommerce until somebody has built one against a real store. That is a build task, not a reading task, and PICKUP carries it.',
  },
  {
    id: 'bigcommerce-storefront-token-browser', kind: 'assisted',
    where: 'the store-platform comparison',
    claim: 'BigCommerce storefront tokens for the GraphQL Storefront API are described by BigCommerce as not sensitive and safe to expose in web browsers, can only expose information and actions a shopper can access while browsing, and are scoped to CORS origins with up to two origins per token; private tokens are for server-to-server use and should never be exposed in a browser',
    verified: '2026-09-11',
    maxAgeDays: 90,
    source: 'https://docs.bigcommerce.com/developer/docs/storefront/guides/graphql-storefront-api/authentication',
    note: 'The two-origin cap per token is the practical limit: a client on a staging address and a live address uses both. See bigcommerce-storefront-token-deprecation for the clock running on this.',
  },
  {
    id: 'bigcommerce-storefront-token-deprecation', kind: 'assisted',
    where: 'the store-platform comparison',
    claim: 'BigCommerce has published a deprecation timeline for storefront tokens: from 30 June 2026 storefront tokens can no longer be created without allowed_cors_origins, and from 31 March 2027 storefront tokens without allowed_cors_origins will no longer be accepted for API requests',
    verified: '2026-09-11',
    maxAgeDays: 90,
    source: 'https://docs.bigcommerce.com/developer/docs/storefront/guides/graphql-storefront-api/authentication',
    note: 'REGISTERED SEPARATELY FROM THE CAPABILITY BECAUSE IT IS A DATED FUTURE EVENT rather than a present fact, and the second date is more than a year out. A token minted for a client today without an origin keeps working until March 2027 and then stops, which is the shape of failure nobody is watching for. Anything built on BigCommerce sets the origin from the first day.',
  },
  {
    id: 'wix-headless-client-id-only', kind: 'assisted',
    where: 'the store-platform comparison',
    claim: 'Wix Headless OAuth requires only a client ID and does not require a client secret; anonymous visitor authentication is handled automatically by the OAuthStrategy, and the client ID is found in a project\u2019s Headless Settings',
    verified: '2026-09-11',
    maxAgeDays: 90,
    source: 'https://dev.wix.com/docs/sdk/core-modules/sdk/oauth-strategy',
    note: 'A client secret IS required for admin operations through the client_credentials flow, so the safe half is visitor and member access only. Wix also has a Products V3 catalog API and an eCommerce cart; those were seen in the navigation but not read endpoint by endpoint, so confirm the cart shape before building rather than assuming it matches Shopify\u2019s.',
  },
  {
    id: 'ecwid-public-storefront-token', kind: 'assisted',
    where: 'the store-platform comparison',
    claim: 'Ecwid exposes Ecwid.getAppPublicToken(client_id) in its storefront JS API and states that public tokens are safe to use on the storefront because they cannot reveal any private store data',
    verified: '2026-09-11',
    maxAgeDays: 90,
    source: 'https://docs.ecwid.com/storefronts/get-storefront-details/get-public-app-details',
    note: 'A QUALIFIED YES AND THE QUALIFICATION IS THE WHOLE ENTRY. Ecwid\u2019s model is that you embed THEIR storefront widget into your page and customize it, not that you build your own catalog against their data. That is a different product from the Shopify pattern and should not be presented as the same thing. api-docs.ecwid.com refuses page reads; docs.ecwid.com serves.',
  },
  {
    id: 'square-tokens-server-side-only', kind: 'assisted',
    where: 'the store-platform comparison · src/data/getting-paid.js square card',
    claim: 'Square instructs that access tokens must not be exposed in client-side code or version control systems, and its Payment Links API requires an Authorization bearer access token',
    verified: '2026-09-11',
    maxAgeDays: 90,
    source: 'https://developer.squareup.com/docs/build-basics/access-tokens',
    note: 'THIS IS WHY A CONFIGURATOR CANNOT BE BUILT AGAINST SQUARE THE CLEAN WAY. Doing it would mean running a server holding a token that can read the client\u2019s orders, which is customer data D96 says this practice does not hold. NOT SETTLED EITHER WAY: whether Square Online exposes an unauthenticated add-to-cart URL. Community posts suggest a /s/cart path exists; those are not Square\u2019s own documentation and are not treated as a source here.',
  },
  {
    id: 'squarespace-no-cart-api', kind: 'assisted',
    where: 'the store-platform comparison',
    claim: 'Squarespace Commerce APIs cover Analytics, Contacts, Discounts, Inventory, Orders, Products, Profiles and Transactions, authenticate with an API key or an OAuth access token, and include no cart or checkout endpoint; the generated API key is shown once and only at creation',
    verified: '2026-09-11',
    maxAgeDays: 90,
    source: 'https://developers.squarespace.com/commerce-apis/overview \u00b7 https://developers.squarespace.com/commerce-apis/authentication-and-permissions',
    note: 'A HARDER NO THAN SQUARE\u2019S, AND FOR A DIFFERENT REASON. Square has a cart and forbids reaching it from a browser. Squarespace has no cart API at all — its Commerce APIs manage a merchant\u2019s own data rather than letting anybody sell. Even with a server there is nothing to hand a configured item to.',
  },
  {
    id: 'etsy-api-key-carries-secret', kind: 'assisted',
    where: 'the store-platform comparison',
    claim: 'The Etsy Open API v3 requires an x-api-key header containing the keystring and shared secret separated by a colon on every request regardless of endpoint, with OAuth 2.0 additionally required for private data and writes',
    verified: '2026-09-11',
    maxAgeDays: 90,
    source: 'https://developers.etsy.com/documentation/essentials/authentication',
    note: 'The shared secret traveling on EVERY request is what rules a browser out, before any question about carts. Etsy also has cart_r and cart_w scopes, but they read a member\u2019s own Etsy cart after that member authorizes the app — not a checkout an outside site can send somebody to. Etsy is a marketplace and the buyer buys on Etsy.',
  },
  {
    id: 'bigcartel-carts-abandoned-only', kind: 'assisted',
    where: 'the store-platform comparison',
    claim: 'The Big Cartel v1 API authenticates by OAuth with a client_id and client_secret, its Carts endpoint returns only ABANDONED carts from the last seven days and is limited to shops on the Diamond plan, and app access requires approval — Big Cartel approves a select number of partners and developers',
    verified: '2026-09-11',
    maxAgeDays: 90,
    source: 'https://developers.bigcartel.com/api/v1',
    note: 'THREE SEPARATE BLOCKS, ANY ONE OF WHICH IS ENOUGH: a secret, a carts endpoint that reports rather than builds, and a gate on who may have an app at all. Big Cartel also keeps an older read-only API for a few public details about a shop and its products, so reading a catalog may be possible even though building a cart is not. That older API was not read.',
  },
  {
    id: 'shift4shop-private-key-required', kind: 'assisted',
    where: 'the store-platform comparison',
    claim: 'The Shift4Shop REST API (3dcart) issues a public/private key pair and requires the private key in the PrivateKey request header on every call, together with a per-merchant token in the Token header',
    verified: '2026-09-11',
    maxAgeDays: 90,
    source: 'https://apirest.3dcart.com/v2/getting-started/index.html',
    note: 'Their public key is not a browser credential — it is what a merchant uses to subscribe to your application. The private key is the one that authenticates requests, so this is server-side only. Shift4Shop is a long-tail platform here and is on the sheet for completeness rather than because a New Bern business is likely to be on it.',
  },
  {
    id: 'meta-shops-checkout-retired', kind: 'assisted',
    where: 'the store-platform comparison \u00b7 the websites comparison',
    claim: 'Meta states that as of September 2025 Shops on Facebook and Instagram use website checkout, that customers are now directed to the seller\u2019s own website to complete a purchase, that management of the post-purchase experience in Commerce Manager has been discontinued, and that a shop not yet updated needs a checkout URL created',
    verified: '2026-09-11',
    maxAgeDays: 90,
    source: 'https://www.facebook.com/business/help/1314349509894768 \u00b7 https://www.facebook.com/business/help/582645198813984',
    note: 'THE SINGLE MOST USEFUL FACT IN THIS BLOCK AND THE ONE MOST LIKELY TO BE WRONG ELSEWHERE. Every business selling through Instagram now needs a website to send buyers to, which is a direct argument for what this practice sells, and it happened four months ago — most comparisons still describe Instagram Checkout as a live feature. Instagram product tags now direct customers to purchase from the seller\u2019s website. Do not write this as a prediction; it has already happened.',
  },
  {
    id: 'tiktok-shop-checkout-in-app', kind: 'assisted',
    where: 'the store-platform comparison',
    claim: 'TikTok Shop completes purchases inside the TikTok app and exposes no documented way for an outside page to build a cart against it',
    verified: '2026-09-11',
    maxAgeDays: 90,
    source: 'https://seller-us.tiktok.com/ (seller documentation is behind a login)',
    note: 'REGISTERED WITH A WEAKER BASIS THAN ITS NEIGHBORS AND THE ENTRY SAYS SO. TikTok Shop Academy returned 401 Permission is required, so this rests on the absence of any public developer documentation rather than on a statement by TikTok. If this ever becomes load-bearing, read it from inside a seller account. See tiktok-shop-referral-fee for the same limit on the fee.',
  },
  {
    id: 'tiktok-shop-referral-fee', kind: 'human',
    where: 'the store-platform comparison',
    claim: 'TikTok Shop US charges a referral fee on each order, understood to be about 6% with lower rates in some categories, and no setup fee',
    verified: '2026-09-11',
    maxAgeDays: 90,
    source: 'https://seller-us.tiktok.com/university/essay?knowledge_id=6837873164977921 (returns 401 without a seller login)',
    note: 'THE ONLY FIGURE IN THIS BLOCK NOT READ OFF THE VENDOR\u2019S OWN PAGE, AND IT IS `human` FOR THAT REASON. The fee page requires a TikTok Shop seller login, which Claude cannot pass. The number above came from search results summarizing those pages and is NOT treated as verified. Either the operator reads it from inside an account, or the card prints that the fee is not publicly readable — which is true, useful, and better than a figure nobody checked.',
  },
  {
    id: 'woocommerce-cost-model', kind: 'assisted',
    where: 'the store-platform comparison',
    claim: 'WooCommerce states its core platform is free with no monthly subscription and a 0% revenue share, that payments cost only the chosen processor\u2019s own fees, that hosting runs $25 to $350 a month for most stores, and that extensions are $29 to $299 a year each',
    verified: '2026-09-11',
    maxAgeDays: 90,
    source: 'https://woocommerce.com/pricing/',
    note: 'The hosting range is WooCommerce\u2019s own published figure rather than an estimate of ours, which is what makes it quotable. The honest reading of this card is that the platform is free and the cost moved somewhere else — to hosting, to extensions, and to whoever maintains it.',
  },
  {
    id: 'bigcommerce-plan-prices', kind: 'assisted',
    where: 'the store-platform comparison',
    claim: 'BigCommerce plans are Core $39/month, Growth $105/month, Scale $399/month and Performance from $1,499/month billed annually, with 25% off for annual billing; plans auto-upgrade as trailing twelve-month GMV passes each tier, a 0.9% overage applies on GMV above the Scale cap of $33,333 a month, card processing begins at 2.89% and American Express is 3.50% with no fixed fee',
    verified: '2026-09-11',
    maxAgeDays: 90,
    source: 'https://www.bigcommerce.com/pricing/',
    note: 'THE AUTO-UPGRADE IS THE LINE THAT MATTERS AND IT IS NOT A FEE. A business that has a good year moves up a tier without choosing to, and BigCommerce computes the threshold on gross order value minus ten per cent. Nobody reading the headline price is expecting that, and it is the sort of thing this practice exists to point out.',
  },
  {
    id: 'ecwid-plan-prices', kind: 'assisted',
    where: 'the store-platform comparison',
    claim: 'Ecwid plans are Starter $5/month for up to 10 products, Venture $29/month for up to 100, Business $49/month for up to 2,500 and Unlimited $119/month, with annual billing saving 16%',
    verified: '2026-09-11',
    maxAgeDays: 90,
    source: 'https://www.ecwid.com/pricing',
    note: 'Priced by PRODUCT COUNT rather than by sales volume, which is unusual on this sheet and makes it the cheapest entry for a maker with a short catalog. Selling on Instagram and Facebook starts at Venture; in-person selling needs Unlimited.',
  },
  {
    id: 'bigcartel-plan-prices', kind: 'assisted',
    where: 'the store-platform comparison',
    claim: 'Big Cartel plans are a free limited Gold plan, Platinum $15/month after a 7-day trial, and Diamond $30/month; abandoned-cart recovery is a Diamond feature',
    verified: '2026-09-11',
    maxAgeDays: 90,
    source: 'https://www.bigcartel.com/product/pricing',
    note: 'Aimed at artists and independent makers, which is exactly the kind of client this practice meets. Cheap and genuinely fine for a small catalog — and the API limits under bigcartel-carts-abandoned-only are what rule out building anything against it.',
  },
  {
    id: 'shift4shop-price', kind: 'assisted',
    where: 'the store-platform comparison',
    claim: 'Shift4Shop advertises an unlimited enterprise-grade plan at $41 a month, describing it as a $229/month value',
    verified: '2026-09-11',
    maxAgeDays: 90,
    source: 'https://www.shift4shop.com/ (their /pricing/ path returns a 404 page)',
    note: 'THE PRICING PAGE IS A 404 AND THE FIGURE IS ON THE HOMEPAGE, which is worth knowing before quoting it and is itself a small signal about the product. Shift4Shop historically offered a free plan to merchants using Shift4 Payments; no such offer was visible on 2026-09-11 and none is claimed here.',
  },
  {
    id: 'etsy-seller-fees', kind: 'assisted',
    where: 'the store-platform comparison',
    claim: 'Etsy charges a $0.20 listing fee for each item listed, charged whether or not the item sells and again on every automatic renewal, a transaction fee of 6.5% of the displayed price plus the amount charged for shipping and gift wrapping, payment processing fees on top that vary by the location of the seller\u2019s bank account, and an optional Etsy Plus subscription at $10 a month',
    verified: '2026-09-11',
    maxAgeDays: 90,
    source: 'https://www.etsy.com/legal/fees/',
    note: 'THE 6.5% APPLIES TO THE SHIPPING THE SELLER CHARGED, not only to the price of the item, and that is the half sellers do not expect. Combined with processing on top, Etsy is the dearest per-sale option on the sheet — which is the fair trade for a marketplace that brings its own buyers, and the card should say both halves.',
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
    id: 'cloudflare-invite-flow-labels', kind: 'assisted',
    maxAgeDays: 60, // Cloudflare rebuilt this screen once already and its own docs lagged months behind
    where: 'docs/engagement/client-documents/account-access.md · docs/client-accounts.md · docs/ownership-delivery.md',
    claim: 'Cloudflare members page reached by https://dash.cloudflare.com/?to=/:account/members or by sidebar group "Manage account" then "Members"; the invite form is "Invite members" and asks for Add email addresses, Define scope (default "Entire account") and Assign roles with a "Search by role name" box over 151 tickboxes, submitting on "Create policy" then "Invite members" with no summary step',
    verified: '2026-09-04',
    source: 'https://developers.cloudflare.com/fundamentals/manage-members/manage/',
    note: 'Walked in a signed-in browser, not read off the source above — and the source above is the reason to re-walk rather than re-read. It still lists a "Continue to summary" step that the form has not had since Cloudflare rebuilt it on 2025-10-30. VERIFIED LIVE: the redirect, the sidebar group, every field and button named in the claim, and that both submit buttons start disabled. NOT VERIFIED LIVE, because a one-member account cannot show them: the "Invite Pending" status value, the resend control label, and the wording on the removal confirmation shown for a second member. Re-walk before this document goes to a client and fix the labels rather than softening the sentences.',
  },
  {
    id: 'cloudflare-administrator-role-scope', kind: 'assisted',
    maxAgeDays: 60, // same console, same vendor, same demonstrated drift
    where: 'docs/engagement/client-documents/account-access.md · docs/client-accounts.md · docs/ownership-delivery.md · docs/engagement/client-documents/data-handling.md',
    claim: 'Cloudflare "Administrator" can access the full account and edit subscriptions but cannot manage members nor the billing profile; "Super Administrator - All Privileges" and "Administrator Read Only" sit beside it in the same list, and all three were selectable on a small account',
    verified: '2026-09-04',
    source: 'https://developers.cloudflare.com/billing/understand/billing-permissions/',
    note: 'The half that matters to a client is that Administrator CAN change or cancel a subscription while it CANNOT touch the payment method, billing address or billing email — "Administrator cannot do billing" is the intuitive summary and it is wrong. That it cannot manage members is what makes the promise in data-handling.md true: an invited Administrator cannot lock the owner out. A 2021 community post claiming free plans offer only Administrator was refuted on the live form, on ONE account — if a client ever cannot see the role, that is the thing to re-check rather than this sentence.',
  },
  {
    id: 'cloudflare-invite-requires-verified-email', kind: 'assisted',
    maxAgeDays: 60, // same console
    where: 'docs/engagement/client-documents/account-access.md · docs/client-accounts.md',
    claim: 'Inviting a Cloudflare member requires a Super Administrator with a verified email address; an unverified address fails with "you must verify your email address before you can invite members. (Code: 1001)", and free accounts have no ticket support path',
    verified: '2026-09-04',
    source: 'https://developers.cloudflare.com/fundamentals/user-profiles/verify-email-address/',
    note: 'This is the first thing the client document checks, because it is the documented blocker with the least self-explanatory message and the only one with no vendor to escalate to. https://dash.cloudflare.com/profile resolves and shows the section headed "Email" with a "Verified" tag — note that the Cloudflare page above calls that field "Email Address" and the badge "(verified)", and neither matched the live screen. The control offered when an address is NOT verified could not be seen from a verified account, so the document describes it rather than naming it.',
  },
  {
    id: 'github-collaborator-removal-path', kind: 'assisted',
    maxAgeDays: 90, // a vendor menu path behind a login
    where: 'docs/engagement/client-documents/owner-runbook.md §8 · docs/client-accounts.md',
    claim: 'A GitHub repository collaborator is removed at https://github.com/<owner>/<repo>/settings/access, reached in the interface by the repo then Settings then the sidebar item "Collaborators" under the "Access" group, landing on a page titled "Manage access"',
    verified: '2026-09-04',
    source: 'https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-personal-account-on-github/managing-access-to-your-personal-repositories/removing-a-collaborator-from-a-repository-in-your-personal-account',
    note: 'Walked signed in on 2026-09-04 and the path in owner-runbook was already correct, which is the useful half: this class does not mean every third-party path is wrong, it means none of them is watched. VERIFIED LIVE: the direct address, the sidebar label, the page title. NOT VERIFIED, because the repository has no collaborators: the wording of the control that actually removes one. The same gap exists on the Cloudflare side for the same reason — see cloudflare-invite-flow-labels. Both close the first time a real collaborator exists, so re-walk at the first kickoff rather than scheduling it.',
  },
  {
    id: 'github-owner-only-actions', kind: 'assisted',
    maxAgeDays: 90, // a vendor policy page
    where: 'docs/engagement/client-documents/account-access.md · docs/client-accounts.md §3',
    claim: 'All four GitHub steps a client must take are reserved to the account holder: creating the account (terms require the holder to accept them), creating the repository (a collaborator seat is per-repository and granted only after one exists, and a personal account cannot delegate creation), adding a collaborator, and installing the "Cloudflare Workers and Pages" app — GitHub states "Anyone can install GitHub Apps on their personal account" and lists no such right for collaborators',
    verified: '2026-09-04',
    source: 'https://docs.github.com/en/apps/using-github-apps/installing-a-github-app-from-a-third-party',
    note: 'The operational point is that NONE of the four can be lifted off the client, so a document promising less would be promising something the operator cannot deliver. Screens walked signed in the same day: https://github.com/new is headed "Create a new repository" and its visibility control OPENS ON PUBLIC, which is the one real trap in the sequence and is why the client document calls it out rather than listing it; the collaborator flow is Settings, then Collaborators under an "Access" heading, then "Add people", then "Add to repository"; the app appears in an installed list as exactly "Cloudflare Workers and Pages". NOT VERIFIED: the wording on the Install and Authorize screen, which cannot be seen without triggering an install on an account that already has one. Re-walk the visibility default first if this is ever re-read — a changed default would make the loudest warning in the document wrong.',
  },
  /* THE REGISTRAR FACTS WERE UNREGISTERED FOR THE WHOLE DAY THEY WERE PUBLISHED. The web address
     steps landed in account-access.md on 2026-09-08 inside a commit about spelling, and none of
     what they assert reached this file. So five neighboring claims about the same two vendors'
     screens aged and warned while the newest ones -- the ones a client would follow first, with
     their own card out -- did neither. All three below are human: a signed-in browser is the only
     thing that can see any of these screens. */
  {
    id: 'cloudflare-registrar-buy-flow', kind: 'assisted',
    maxAgeDays: 60, // nine of its eleven steps were wrong when last walked
    where: 'docs/engagement/client-documents/account-access.md part one · docs/client-accounts.md',
    claim: 'Cloudflare Registrar sells NEW registrations directly, at cost; the path is Domains > Overview > "Buy domain", which lands on /domains/registrations/purchase headed "Register domain" with one box reading "Search for a domain name" and NO Search button (results appear as you type); each result shows a first-year price and a different renewal price; clicking a result goes to ONE page headed "Complete your registration" carrying pre-filled registrant fields, a minus/plus year stepper, automatic renewal ON by default, and a blue "Continue to pay for <domain>" button with NO terms tick box; the card is asked for after that button, and the page states the domain will automatically use Cloudflare nameservers',
    verified: '2026-09-08',
    source: 'Walked in the operator’s own signed-in Cloudflare dashboard on 2026-09-08, as far as the last screen before payment.',
    note: 'WALKED 2026-09-08, and nine of the eleven steps the document carried were wrong. It had been written off Cloudflare’s own registrar documentation, and the documentation is not what the dashboard does. The shortcut ?to=/:account/domains/register lands on REGISTRATIONS -- the list of addresses you already own -- whose only box searches what you own rather than what is available, so a client following it would type their chosen name into a box that could never find it. The sidebar has no "Domain Registration" group and no "Register domains" item; it is Domains > Overview / Registrations / Transfers. There is no Search button, no Purchase button, no sequence of screens, no card step before payment and no terms tick box. WHAT WAS RIGHT: the card is asked for at purchase rather than before, and the page does state the address will use Cloudflare nameservers automatically. STILL NOT VERIFIED, because it needs a real payment: everything after "Continue to pay", the confirmation email, and the thirty-second figure. Two domains are already registered on this account, so somebody may have been through the payment half before -- unconfirmed, and worth asking rather than assuming.',
  },
  {
    id: 'cloudflare-signup-password-trap', kind: 'assisted',
    maxAgeDays: 60, // a signup flow, and the trap is a UI detail
    where: 'docs/engagement/client-documents/account-access.md part one step one · docs/client-accounts.md section 1',
    claim: 'A Cloudflare account is opened at https://dash.cloudflare.com/sign-up by entering Email and Password then "Create Account"; an account opened through a Google or Apple sign-in button has no password, and Cloudflare\u2019s two-factor setup asks for one, so such an account cannot finish that setup until a password is set through the forgotten-password route',
    verified: '2026-09-08',
    source: 'https://developers.cloudflare.com/fundamentals/account/create-account/',
    note: 'The URL and the two field names come from Cloudflare\u2019s own documentation, which describes email and password only and mentions no Google or Apple button -- so the existence of those buttons is the operator\u2019s observation from the sign-in screen rather than anything a vendor page states, and it is the half most likely to be wrong. The trap itself has been in docs/client-accounts.md since before this entry and moved into the client document on 2026-09-08, which is why it is registered now: a document a client follows alone is a worse place for an unwatched claim than a runbook the operator reads. NOT VERIFIED: the label on the forgotten-password control, and where two-factor actually sits on the profile page. The document describes both rather than naming them.',
  },
  {
    id: 'cloudflare-app-preinstall-unproven', kind: 'assisted',
    maxAgeDays: 60, // unproven by its own name, and it is a vendor screen
    where: 'docs/engagement/client-documents/account-access.md, the closing section',
    claim: 'UNPROVEN: whether a client installing the "Cloudflare Workers and Pages" app directly from https://github.com/apps/cloudflare-workers-and-pages, ahead of any request, produces a connection bound to their own Cloudflare account -- or merely an app installed on GitHub that does nothing until the operator connects from the hosting side',
    verified: '2026-09-08',
    source: 'https://developers.cloudflare.com/pages/configuration/git-integration/github-integration/',
    note: 'REGISTERED BECAUSE IT SHIPPED UNPROVEN, on the operator\u2019s explicit instruction, and the document says so in those words: it offers the shortcut as worth a try rather than a step, and promises the operator\u2019s link either way. What is known: the app page exists, and Cloudflare documents the flow as starting from ITS side with "+ Add account" then "Install & Authorize", which is why the standalone direction is doubtful. What is not known cannot be settled by reading -- it needs an account. This is the exact shape of the failure data-handling.md v1.1 already made, where a promise about a third party\u2019s software reached a client document before anyone ran it once; the difference is that this one is labeled inside the document and watched here. SETTLE IT AT SLOT 2\u2019S KICKOFF and rewrite the paragraph from what actually happened.',
  },
];
