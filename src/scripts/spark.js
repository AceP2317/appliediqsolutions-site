/**
 * spark.js — the site's only decorative client script.
 *
 * Everything here is progressive enhancement. With JS off, or under
 * `prefers-reduced-motion: reduce`, every effect is simply absent and the site is
 * unchanged and fully functional. Nothing below is load-bearing: no content, no
 * navigation, and no interaction depends on it.
 *
 * Five things:
 *   1. Cursor wake      — the ambient neural net lights up around the pointer.
 *   2. Card spotlight   — a soft highlight tracks the cursor across .spotlight panels.
 *   3. Stat count-up    — big readouts tick up from zero when scrolled into view.
 *   4. The wordmark     — click the glowing tittle on the `i` and the network fires.
 *   5. Konami + console — for the people who go looking.
 *
 * Pointer effects are gated on `pointer: fine`, so a phone never pays for a
 * mousemove handler it can't trigger.
 */

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = window.matchMedia('(pointer: fine)').matches;

/* ── 1. The comet ─────────────────────────────────────────────────────────────
   A chain of dots. The head eases toward the cursor; each following dot eases
   toward the one in front of it. That single rule produces all the behaviour:

     · moving   → the chain stretches out behind the cursor (each dot is chasing a
                  target that keeps running away) = the tail
     · stopping → the targets stop running, so every dot keeps easing until it
                  collapses into the head = the "catch up"
     · at rest  → speed is 0, so opacity is 0 = invisible until you move

   Opacity is driven by pointer SPEED, not by presence. It swells as you move and
   dissolves when you stop.

   Only `translate` and `opacity` are ever written — both are compositor properties,
   so this costs no layout and no repaint. The rAF loop also PARKS itself when the
   comet is fully faded and the pointer is still, so an idle tab burns nothing. */
if (fine && !reduced) {
  const COUNT = 7;
  const layer = document.createElement('div');
  layer.className = 'comet-layer';
  layer.setAttribute('aria-hidden', 'true');

  const dots = Array.from({ length: COUNT }, (_, i) => {
    const t = i / (COUNT - 1);               // 0 = head, 1 = tail tip
    const d = document.createElement('span');
    d.className = 'comet-dot';
    const size = 26 - t * 18;                // head is biggest, tail tapers
    d.style.width = `${size}px`;
    d.style.height = `${size}px`;
    d.style.marginLeft = `${-size / 2}px`;   // centre on the point
    d.style.marginTop = `${-size / 2}px`;
    layer.appendChild(d);
    return { el: d, x: 0, y: 0, ease: 0.34 - t * 0.2, alpha: 0.5 - t * 0.42 };
  });
  document.body.appendChild(layer);

  let px = -200, py = -200;   // pointer
  let speed = 0;              // smoothed pointer speed
  let lastX = -200, lastY = -200;
  let running = false;

  const frame = () => {
    // Decay the speed every frame — this is what makes the comet FADE when the
    // pointer stops rather than hanging there.
    speed *= 0.9;

    let lead = { x: px, y: py };
    let visible = speed > 0.01;

    for (const d of dots) {
      d.x += (lead.x - d.x) * d.ease;
      d.y += (lead.y - d.y) * d.ease;
      d.el.style.transform = `translate3d(${d.x}px, ${d.y}px, 0)`;
      d.el.style.opacity = `${Math.min(1, speed) * d.alpha}`;
      lead = d;                              // the next dot chases THIS one
      if (Math.abs(d.x - px) > 0.5 || Math.abs(d.y - py) > 0.5) visible = true;
    }

    // Park the loop once the tail has caught up and faded. It restarts on the next
    // move. An idle cursor should cost zero frames.
    if (visible) requestAnimationFrame(frame);
    else running = false;
  };

  window.addEventListener(
    'mousemove',
    (e) => {
      px = e.clientX;
      py = e.clientY;

      const dx = px - lastX;
      const dy = py - lastY;
      lastX = px;
      lastY = py;
      // Normalised so a brisk flick reaches ~1 and a slow drift stays dim.
      speed = Math.min(1, speed + Math.hypot(dx, dy) / 42);

      if (!running) {
        running = true;
        requestAnimationFrame(frame);
      }
    },
    { passive: true },
  );
}

/* ── 2. Card spotlight ────────────────────────────────────────────────────────
   Per-card, so each needs the cursor in ITS local box. Only the card under the
   cursor is written to — hit-testing every card each frame would be the expensive
   way to do this. Separate listener from the comet because it is rAF-throttled on
   its own schedule and only fires while over a card. */
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

/* ── 2b. Tap ripple (touch) ───────────────────────────────────────────────────
   A phone has no pointer, so the comet can never fire there. Touch gets its own
   acknowledgement instead: a soft depression with a ring travelling outward.

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

/* ── 3. Stat count-up ─────────────────────────────────────────────────────────
   Deliberately its OWN IntersectionObserver rather than hooking the reveal gate in
   BaseLayout. That gate is what controls whether content is VISIBLE at all; a bug
   introduced there hides the page. A decorative counter is not worth touching it.

   Only numeric readouts animate. "End-to-end" and "Hours" are phrases and are left
   exactly as they are — counting up a word would be nonsense. */
if (!reduced && 'IntersectionObserver' in window) {
  // Matches "7", "100%", "2,400", "53k", "89.8%" — a number with optional
  // thousands separators, decimals, and a trailing unit we must preserve.
  const NUM = /^(\d[\d,]*\.?\d*)(.*)$/;

  const stats = [...document.querySelectorAll('.stat-value')].filter((el) =>
    NUM.test(el.textContent.trim()),
  );

  const tick = (el) => {
    const [, rawNum, suffix] = el.textContent.trim().match(NUM);
    const target = parseFloat(rawNum.replace(/,/g, ''));
    if (!isFinite(target)) return;

    const decimals = (rawNum.split('.')[1] || '').length;
    const grouped = rawNum.includes(',');
    const DURATION = 900;
    const start = performance.now();

    const frame = (now) => {
      const t = Math.min(1, (now - start) / DURATION);
      // Ease-out cubic — fast then settling, like a gauge coming to rest.
      const v = target * (1 - Math.pow(1 - t, 3));
      const shown = v.toFixed(decimals);
      el.textContent =
        (grouped ? Number(shown).toLocaleString('en-US', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }) : shown) + suffix;
      if (t < 1) requestAnimationFrame(frame);
      else el.textContent = rawNum + suffix; // land on the EXACT authored string
    };
    requestAnimationFrame(frame);
  };

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

/* ── The network fires ────────────────────────────────────────────────────────
   Shared by the wordmark click and the Konami code. Re-entrant: a second trigger
   restarts the timer rather than stacking. */
let fireTimer = null;
function fireNetwork(ms = 2200) {
  const de = document.documentElement;
  de.classList.add('net-fire');
  clearTimeout(fireTimer);
  fireTimer = setTimeout(() => de.classList.remove('net-fire'), ms);
}

/* ── 4. The wordmark tittle ───────────────────────────────────────────────────
   The mark's whole idea is a firing synapse — the glowing cyan dot on the lowercase
   `i`. So clicking it fires the network. The <a> around the wordmark still
   navigates; we stop the click from reaching it, and only for this one node. */
document.querySelectorAll('.aiq-tittle').forEach((node) => {
  node.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    fireNetwork();
  });
});

/* ── 5a. Konami ───────────────────────────────────────────────────────────────
   ↑↑↓↓←→←→BA. Fires everything at once and prints a readout. */
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
    fireNetwork(4200);

    document.querySelector('.net-readout')?.remove();
    const el = document.createElement('div');
    el.className = 'net-readout';
    el.setAttribute('role', 'status');
    el.textContent = 'network · all synapses firing';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2600);
  });
}

/* ── 5b. Console signature ────────────────────────────────────────────────────
   For whoever opens devtools. They are, reliably, the exact audience worth talking
   to — so this is a real invitation, not a joke. */
console.log(
  '%c  Applied%ciQ%c  ',
  'background:#0f1117;color:#e8eaf0;font:600 20px/2.2 "Space Grotesk",sans-serif',
  'background:#0f1117;color:#22d3ee;font:600 20px/2.2 "Space Grotesk",sans-serif',
  'background:#0f1117',
);
console.log(
  "%cYou opened the console. That's the kind of person I build for.\n" +
    '%cEvery tool on this site runs locally in your browser — open the Network tab and watch it not phone home.\n' +
    '%cHiring, or want one of these for your operation?  contact@appliediqsolutions.com',
  'color:#a4abbd;font:13px/1.6 ui-sans-serif,system-ui',
  'color:#838b9e;font:12px/1.6 ui-monospace,monospace',
  'color:#06b6d4;font:13px/1.6 ui-sans-serif,system-ui',
);
