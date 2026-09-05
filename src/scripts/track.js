/**
 * track.js — the site's conversion instrument.
 *
 * WHY THIS EXISTS. Until 2026-08-24 the only measurement on this site was
 * Cloudflare Web Analytics (BaseLayout.astro), which reports views, referrers and
 * Core Web Vitals and NOTHING about behaviour: no CTA click, no form submission,
 * no demo opening was recorded anywhere. That made every copy or layout change
 * unfalsifiable — you could rebuild the whole site and still not know what moved.
 *
 * WHAT IT DOES. Posts a small named event to `POST /api/event` on the Worker,
 * which logs one structured line. Worker observability is enabled in
 * wrangler.jsonc, so those lines are retained and queryable in the Cloudflare
 * dashboard without any new binding, namespace, or third-party script.
 *
 * ponytail: console logs are the storage layer, so events live only as long as
 * Cloudflare's Workers-observability retention window and cannot be aggregated —
 * counting a week of clicks means reading the log by hand in the dashboard.
 * That is deliberate: it costs nothing and needs no infrastructure created by
 * hand, which is why measurement could ship the same day it was decided on.
 * Upgrade path: bind a KV namespace or a D1 table in wrangler.jsonc and write
 * the same line in handleEvent(). Do it when a count is wanted often enough that
 * reading the dashboard by hand is the thing stopping it.
 *
 * THREE RULES THIS FILE KEEPS.
 *   1. It never throws into the page. Every path is wrapped; a dead endpoint,
 *      a blocked beacon, or a missing global leaves the site exactly as it was.
 *   2. It never blocks a navigation. `sendBeacon` hands the request to the
 *      browser to deliver after the page is gone; the `keepalive` fetch is the
 *      fallback for the same reason. A CTA click must not wait on us.
 *   3. It carries no personal data. A name, an email, and free text stay out of
 *      the payload by construction — see the allowlist in `clean()`.
 */

const ENDPOINT = '/api/event';

/* One session id per tab, so a click and the submission it led to can be tied
   together without a cookie and without identifying anybody. It dies with the
   tab: sessionStorage is per-tab and is cleared when the tab closes. */
function sessionId() {
  try {
    const KEY = 'aiq.sid';
    let id = sessionStorage.getItem(KEY);
    if (!id) {
      id = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
      sessionStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    /* Private mode, or storage blocked entirely. An event with no session id is
       still a countable event, so degrade rather than drop it. */
    return 'nosid';
  }
}

/* The allowlist IS the privacy guarantee. Anything not named here never leaves
   the browser, so a future caller cannot accidentally post a visitor's message
   by spreading a form object into the detail argument. */
const ALLOWED_DETAIL = new Set(['label', 'to', 'slug', 'intent', 'reason', 'value']);

function clean(detail) {
  const out = {};
  if (!detail || typeof detail !== 'object') return out;
  for (const key of Object.keys(detail)) {
    if (!ALLOWED_DETAIL.has(key)) continue;
    const v = detail[key];
    if (v === null || v === undefined) continue;
    out[key] = typeof v === 'number' ? v : String(v).slice(0, 120);
  }
  return out;
}

/**
 * Fire one event. Returns true if the browser accepted it for delivery, false
 * if it could not be handed off at all — the return value is what the local
 * verification harness counts, so it must reflect reality rather than intent.
 */
export function track(name, detail) {
  if (!name) return false;
  let body;
  try {
    body = JSON.stringify({
      name: String(name).slice(0, 60),
      path: location.pathname,
      sid: sessionId(),
      t: Date.now(),
      detail: clean(detail),
    });
  } catch {
    return false;
  }

  /* sendBeacon survives the page unloading, which is exactly the case that
     matters: a click on a link fires the event and then navigates away. A plain
     fetch would be cancelled mid-flight and the click would go uncounted. */
  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      if (navigator.sendBeacon(ENDPOINT, blob)) return true;
    }
  } catch {
    /* fall through to fetch */
  }

  try {
    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {});
    return true;
  } catch {
    return false;
  }
}

/**
 * Classify a link click by where it GOES, not by a hand-added attribute.
 *
 * WHY. There are nineteen separate links to /contact/ across the pages and
 * components, and eight demo routes reached from several places. Tagging each by
 * hand would mean nineteen edits that silently stop being complete the first time
 * someone adds a twentieth CTA — the count would quietly undercount and nothing
 * would error. Destination is the one thing every one of them already has in
 * common, so the rule lives here once and new links are counted for free.
 *
 * Returns null for a link that is not a conversion action.
 */
function classify(href) {
  if (!href) return null;
  let path;
  try {
    /* Resolve against the current page so a relative href, an absolute path, and
       a full URL all reduce to the same thing. An off-site link resolves to a
       different origin and is dropped by the check below. */
    const u = new URL(href, location.href);
    if (u.origin !== location.origin) return null;
    path = u.pathname;
  } catch {
    return null;
  }

  if (path.startsWith('/contact')) return { name: 'cta_click', detail: {} };

  /* /work/ is the gallery; /work/<slug>/ is an actual tool. Only the second is
     a demo opening, so the empty-segment check is what separates them. */
  if (path.startsWith('/work/')) {
    const slug = path.slice('/work/'.length).replace(/[/]$/, '');
    if (slug) return { name: 'demo_open', detail: { slug } };
  }

  if (path === '/check' || path === '/check/') return { name: 'check_start', detail: {} };

  /* The paid assessment, 2026-09-03. It is counted separately from a contact
     click because the two mean different things: reaching /contact/ is somebody
     ready to talk, while reaching /ai-fit/ is somebody weighing a price. Folding
     it into cta_click would hide whichever of the two is actually working. */
  if (path === '/ai-fit' || path === '/ai-fit/') return { name: 'assessment_view', detail: {} };

  return null;
}

/**
 * Install the delegated click listener. One listener on the document handles
 * every link on the page, including ones an island adds later — which is why
 * this is delegation and not a listener attached per button.
 *
 * An explicit `data-track` attribute always wins, so a control that is not a
 * link (a button inside the free check, say) can still name its own event.
 */
export function installClickTracking() {
  try {
    document.addEventListener(
      'click',
      (e) => {
        const t = e.target;
        if (!t || !t.closest) return;

        const tagged = t.closest('[data-track]');
        if (tagged) {
          track(tagged.getAttribute('data-track'), {
            label: (tagged.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80),
            to: tagged.getAttribute('href') || undefined,
          });
          return;
        }

        const link = t.closest('a[href]');
        if (!link) return;
        const hit = classify(link.getAttribute('href'));
        if (!hit) return;

        track(hit.name, {
          ...hit.detail,
          label: (link.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80),
          to: link.getAttribute('href'),
        });
      },
      /* Capture phase, so the event is recorded even if something downstream
         calls stopPropagation() on the click before it reaches the document. */
      true,
    );
  } catch {
    /* No document, or listeners refused. The site is unaffected. */
  }
}

/* Auto-install when loaded as a module in a browser.
 *
 * THE GUARD IS NOT OPTIONAL, and the reason is easy to miss. The layout loads
 * this module in its own bundle, and every React island that imports `track`
 * gets a SECOND copy in the island bundle — Astro compiles those separately, so
 * module-level "runs once" is only true per bundle. Without the flag below, a
 * page carrying an island installs two document listeners and every single
 * click is counted twice. Nothing errors. The numbers are simply double, and
 * they look entirely plausible.
 *
 * The flag lives on `window` rather than in module scope precisely because
 * module scope is the thing that is not shared.
 */
const INSTALL_FLAG = '__aiqTrackInstalled';
if (typeof document !== 'undefined' && typeof window !== 'undefined' && !window[INSTALL_FLAG]) {
  window[INSTALL_FLAG] = true;
  installClickTracking();
}
