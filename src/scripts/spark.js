/**
 * spark.js — the site's only decorative client script.
 *
 * Everything here is progressive enhancement. With JS off, or under
 * `prefers-reduced-motion: reduce`, every effect is simply absent and the site is
 * unchanged and fully functional. Nothing below is load-bearing: no content, no
 * navigation, and no interaction depends on it.
 *
 * Five things, each as the operator picked it on the polish-pass alignment page,
 * 2026-09-24:
 *   1. Card spotlight   — a soft highlight tracks the cursor across a .spotlight card (matured).
 *   2. Tap ripple       — a small ring where a finger lands (matured).
 *   3. Stat count-up    — a readout settles onto its figure when scrolled into view (matured).
 *   4. The wordmark     — click the tittle on the `i` and the river lines brighten (matured).
 *   5. Konami + console — for the people who go looking (matured).
 *
 * CUT the same day: the cursor trail ("the comet"), and the cursor-reactive background,
 * whose target was the ambient neural net deleted on 2026-08-25, so nothing ran it.
 *
 * Pointer effects are gated on `pointer: fine`, so a phone never pays for a
 * mousemove handler it can't trigger.
 */

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = window.matchMedia('(pointer: fine)').matches;

/* ── 1. Card spotlight ────────────────────────────────────────────────────────
   Per-card, so each needs the cursor in ITS local box. Only the card under the
   cursor is written to — hit-testing every card each frame would be the expensive
   way to do this. rAF-throttled, and it only writes while over a card. */
if (fine && !reduced) {
  let queued = false;
  let cx = 0, cy = 0;

  const paint = () => {
    queued = false;
    const el = document.elementFromPoint(cx, cy);
    const card = el && el.closest ? el.closest('.spotlight') : null;
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${((cx - r.left) / r.width) * 100}%`);
    card.style.setProperty('--my', `${((cy - r.top) / r.height) * 100}%`);
  };

  window.addEventListener(
    'mousemove',
    (e) => {
      cx = e.clientX;
      cy = e.clientY;
      if (!queued) {
        queued = true;
        requestAnimationFrame(paint);
      }
    },
    { passive: true },
  );
}

/* ── 2. Tap ripple (touch) ────────────────────────────────────────────────────
   A finger landing gets a small, quick ring (8rem, 480ms, in global.css).

   `pointerdown` (not `click`) so it fires the instant the finger lands — a ripple
   that waits for click feels laggy and disconnected from the touch. Passive, so it
   never delays scrolling, and the element is pointer-events:none so it can never
   swallow the tap it is responding to. Self-removes on animationend. */
if (!fine && !reduced) {
  window.addEventListener(
    'pointerdown',
    (e) => {
      if (e.pointerType === 'mouse') return;
      const r = document.createElement('span');
      r.className = 'tap-ripple';
      r.setAttribute('aria-hidden', 'true');
      r.style.left = `${e.clientX}px`;
      r.style.top = `${e.clientY}px`;
      r.addEventListener('animationend', () => r.remove(), { once: true });
      document.body.appendChild(r);
    },
    { passive: true },
  );
}

/* ── 3. Stat count-up, MATURED 2026-09-24 ─────────────────────────────────────
   From 80% of the figure to the exact figure in 0.6s, once, when it scrolls into view
   (was from zero over 0.9s). Its own IntersectionObserver, so a bug here can never hide
   content.

   A BACKGROUND TAB GETS THE TRUE FIGURE AT ONCE. requestAnimationFrame does not run in a
   hidden tab, so a count started there, or interrupted by a tab switch, would sit part-way
   and present a wrong number as fact. It never starts in a hidden tab, and a
   `visibilitychange` flushes any count in flight to its exact authored string.

   Only numeric readouts animate. "End-to-end" and "Hours" are phrases and are left
   exactly as they are — counting up a word would be nonsense. */
if (!reduced && 'IntersectionObserver' in window) {
  // Matches "7", "100%", "2,400", "53k", "89.8%" — a number with optional
  // thousands separators, decimals, and a trailing unit we must preserve.
  const NUM = /^(\d[\d,]*\.?\d*)(.*)$/;
  const inFlight = new Map(); // element -> its exact authored string

  const stats = [...document.querySelectorAll('.stat-value')].filter((el) =>
    NUM.test(el.textContent.trim()),
  );

  const tick = (el) => {
    const [, rawNum, suffix] = el.textContent.trim().match(NUM);
    const exact = rawNum + suffix;
    const target = parseFloat(rawNum.replace(/,/g, ''));
    if (!isFinite(target) || document.hidden) return; // hidden: leave the true figure showing

    const decimals = (rawNum.split('.')[1] || '').length;
    const grouped = rawNum.includes(',');
    const DURATION = 600;
    const FROM = 0.8;
    const start = performance.now();
    inFlight.set(el, exact);

    const frame = (now) => {
      if (!inFlight.has(el)) return; // flushed by visibilitychange
      const t = Math.min(1, (now - start) / DURATION);
      // Ease-out cubic — fast then settling, like a gauge coming to rest.
      const v = target * (FROM + (1 - FROM) * (1 - Math.pow(1 - t, 3)));
      const shown = v.toFixed(decimals);
      el.textContent =
        (grouped ? Number(shown).toLocaleString('en-US', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }) : shown) + suffix;
      if (t < 1) requestAnimationFrame(frame);
      else { el.textContent = exact; inFlight.delete(el); } // land on the EXACT authored string
    };
    requestAnimationFrame(frame);
  };

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) return;
    for (const [el, exact] of inFlight) el.textContent = exact;
    inFlight.clear();
  });

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        tick(e.target);
      });
    },
    { threshold: 0.6 },
  );
  stats.forEach((el) => io.observe(el));
}

/* ── The currents brighten ────────────────────────────────────────────────────
   Shared by the wordmark click and the Konami code. Re-entrant: a second trigger
   restarts the timer rather than stacking. MATURED 2026-09-24: 1.2s, and the lines
   brighten in their own color (global.css) rather than flashing to the accent.

   THE CLASS NAME IS `net-fire` AND THE EFFECT IS NOT A NEURAL ONE. It drove the
   retired firing-net backdrop originally; today its only live consumers are the
   two `.confluence` rules in global.css. The name is kept because renaming it means
   touching the stylesheet, the markup and this file at once for no behavior change. */
let fireTimer = null;
function fireNetwork(ms = 1200) {
  const de = document.documentElement;
  de.classList.add('net-fire');
  clearTimeout(fireTimer);
  fireTimer = setTimeout(() => de.classList.remove('net-fire'), ms);
}

/* ── 4. The wordmark tittle ───────────────────────────────────────────────────
   The dot on the lowercase `i` is the mark's one live detail, so clicking it
   brightens the backdrop's currents. The <a> around the wordmark still
   navigates; we stop the click from reaching it, and only for this one node. */
document.querySelectorAll('.aiq-tittle').forEach((node) => {
  node.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    fireNetwork();
  });
});

/* ── 5a. Konami ───────────────────────────────────────────────────────────────
   ↑↑↓↓←→←→BA. The same matured pulse as the tittle, and a readout. */
{
  const CODE = [
    'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
    'b', 'a',
  ];
  let i = 0;

  window.addEventListener('keydown', (e) => {
    // Never swallow keys while someone is actually typing.
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;

    const want = CODE[i];
    const got = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    i = got === want ? i + 1 : (got === CODE[0] ? 1 : 0);
    if (i < CODE.length) return;

    i = 0;
    fireNetwork();

    document.querySelector('.net-readout')?.remove();
    const el = document.createElement('div');
    el.className = 'net-readout';
    el.setAttribute('role', 'status');
    el.textContent = 'confluence · both currents running';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2600);
  });
}

/* ── 5b. Console signature, MATURED 2026-09-24 ────────────────────────────────
   For whoever opens devtools. They are, reliably, the exact audience worth talking
   to — so this is a real invitation, not a joke. Styled against DEVTOOLS, which is
   usually dark, so it keeps a dark ground and uses the site's palette LIGHTENED for
   that ground: oyster ink, a lighter crape myrtle and a lighter river teal. Until this
   date the lines were in the retired slate grays #a4abbd and #838b9e, and the last one
   opened with "Hiring", which framed the operator as someone looking for a job. */
console.log(
  '%c  Applied%ciQ%c  ',
  'background:#17150f;color:#faf7f2;font:600 20px/2.2 Fraunces,Georgia,serif',
  'background:#17150f;color:#e07a9b;font:600 20px/2.2 Fraunces,Georgia,serif',
  'background:#17150f',
);
console.log(
  "%cYou opened the console. That's the kind of person I build for.\n" +
    '%cEvery tool on this site runs in your browser. Open the Network tab and watch it not phone home.\n' +
    '%cWant one of these for your operation?  contact@appliediqsolutions.com',
  'color:#e6ddcf;font:13px/1.6 ui-sans-serif,system-ui',
  'color:#b9ad99;font:12px/1.6 ui-monospace,monospace',
  'color:#7fc1ba;font:13px/1.6 ui-sans-serif,system-ui',
);
