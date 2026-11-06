// ============================================================================
// THE SHELF KIT — the parts every local-business tool needs, written once.
//
// EXTRACTED, NOT DESIGNED UP FRONT. The Tip Out Calculator and the Bar Inventory Count Sheet
// were built standalone first, on deliberately different arithmetic, and this
// file is what they turned out to actually share. A kit designed before two real
// tools existed would have been designed against a guess.
//
// What is here is the plumbing — remembering, chrome, inputs, the honesty
// furniture. What is NOT here is arithmetic: every tool's engine stays in its
// own src/lib/<tool>.js, pure and separately testable, because that is the part
// that differs and the part that must be checked exactly.
//
// Built by Ian Provencher · AppliedIQ Solutions
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { buildPackage } from '../../lib/state-package.js';
import { themeFor } from './themes.js';

// ============================================================================
// THEME — EVERY VALUE IS A CSS VARIABLE WITH A LITERAL FALLBACK, and that one
// decision is what let nine tools be re-themed by touching two files.
//
// WHAT THIS REPLACED. One near-black slate ground with one brass accent, shared
// by all nine, while the site around them went warm and light on 2026-08-24.
// The operator's read was right: they looked slapped together, and nine
// identical dark boxes read as one thing rendered nine times.
//
// WHY VARIABLES RATHER THAN A REFACTOR. Every one of these tools styles itself
// inline, and `T.surface` appears hundreds of times across nine files. Passing a
// theme object down would have meant editing every one of those call sites, in
// nine islands, by hand — a large diff with no test that can see a color.
// Making the VALUE a `var()` means every existing call site resolves through the
// frame instead, and not one of them had to change.
//
// WHY NOT A STYLESHEET. The handover file a client keeps forever carries no site
// CSS by design. A theme in a stylesheet would render on the website and fall
// back to nothing in the delivered copy — the copy that matters most, and the
// one nobody can debug later. Inline custom properties travel with the markup.
//
// THE FALLBACK IN EVERY var() IS LOAD-BEARING. It is what any tool rendered
// outside a ToolFrame falls back to, and it is why a tool with no faceplate in
// themes.js looks plain rather than invisible.
//
// Values mirror src/components/kit/themes.js BASE. `npm run contrast` reads that
// module directly and checks all fifty pairs, so the two cannot drift silently.
// ============================================================================
export const T = {
  bg: 'var(--aiq-bg, #faf7f2)',
  surface: 'var(--aiq-surface, #ffffff)',
  surfaceAlt: 'var(--aiq-surface-alt, #f4efe6)',
  border: 'var(--aiq-border, #e0d8ca)',
  borderStrong: 'var(--aiq-border-strong, #cdc2ae)',
  text: 'var(--aiq-text, #17150f)',
  textSec: 'var(--aiq-text-sec, #565045)',
  textMuted: 'var(--aiq-text-muted, #6f685b)',
};
/* `brass` KEEPS ITS NAME though it is no longer brass, and deliberately: it is
   the accent slot, it is referenced by that name across nine tools, and renaming
   it would be a nine-file diff for zero behavior change. The comment is the
   honest part. */
export const A = {
  brass: 'var(--aiq-accent, #b0355e)',
  accentInk: 'var(--aiq-accent-ink, #ffffff)',
  tint: 'var(--aiq-tint, #fbeef2)',
  ring: 'var(--aiq-ring, #e6b3c6)',
  /* THE TONES MOVED ON 2026-08-26. `good` was #2f7d4f and `warn` was #8a6a12,
     and both were below AA on a quiet row — 4.40:1 and 4.42:1 against a 4.5
     floor — on all nine tools, for as long as the shelf has been light. The
     contrast gate checked five pairs per faceplate and not one of them was a
     tone on a quiet row, so nothing ever reported it. It checks all three on
     four grounds each now. */
  good: 'var(--aiq-good, #276a42)',
  warn: 'var(--aiq-warn, #75590d)',
  bad: 'var(--aiq-bad, #b3261e)',
  /* THE THREE WASHES, NAMED. Eight of the nine tool files hand-rolled these as
     raw rgba() left over from the dark era — rgba(52,211,153,0.09) is a neon
     mint chosen to GLOW on near-black, and on paper it is a smear. None was ever
     a token, so the contrast gate had never seen one. Now it sees all six pairs
     they take part in. */
  goodTint: 'var(--aiq-good-tint, #eaf4ee)',
  warnTint: 'var(--aiq-warn-tint, #faf1dc)',
  badTint: 'var(--aiq-bad-tint, #fdeceb)',
};
/* THE AXIS THE COLOR MECHANISM COULD NOT REACH. These were plain string
   literals while every color above them was a var(), so pageFor could re-theme
   a tool's palette and not its type. Converting them costs three lines here and
   every one of the 34 existing FONT_* call sites across nine islands inherits it
   untouched — the same trick, applied to the axis that was left out.

   ⚠️ AND THE FALLBACK WAS ONLY HALF THE FIX. Until 2026-08-26 pageFor wrote
   --aiq-font-body and --aiq-font-data as LITERAL Inter and IBM Plex Mono
   strings, so these var()s resolved to the same two faces on every tool however
   its palette moved. Nine tools reading in one voice is most of why the second
   identity pass did not land. They are faceplate values now.

   THREE SEPARATE JOBS, and the old comment here argued they were two. It said
   body should stay a sans everywhere because "a serif at 13px inside a dense
   table is a legibility cost with no identity gain." That reasoning is correct
   about the TABLE and it is honored: td and tdN below take FONT_DATA, and Cell
   and Field keep a fixed pixel size. FONT_BODY reaches prose, labels and buttons
   only, which is where a reading voice belongs.

   FONT_HEAD is the fourth, and it is DERIVED rather than carried — headFace()
   at the bottom picks it from the head SHAPE, so no faceplate can name a
   combination that makes no sense and there is one fewer field to keep in step. */
export const FONT_BODY = "var(--aiq-font-body, 'Inter Variable','Inter','Segoe UI',system-ui,sans-serif)";
export const FONT_DATA = "var(--aiq-font-data, 'IBM Plex Mono','SF Mono','Consolas',monospace)";
export const FONT_DISPLAY = "var(--aiq-font-display, 'Inter Variable','Inter','Segoe UI',system-ui,sans-serif)";
export const FONT_HEAD = "var(--aiq-font-head, 'IBM Plex Mono','SF Mono','Consolas',monospace)";

/* THE DENSITY SCALE, read the same way. A tool that is meant to be scanned and
   a tool that is meant to be read aloud should not have the same row height.

   THE LAST FIVE ARE THE EDGE, AND THE EDGE IS A PAPER AXIS RATHER THAN A DENSITY
   ONE. A receipt has square corners at any density; a clinical list is soft at
   any density. They were literals — borderRadius: 12, borderRadius: 8, 1px, 2px
   — repeated across every panel, button, input and readout in the kit, which is
   why nine tools had one silhouette however their colors moved. */
export const S = {
  pad: 'var(--aiq-pad, 16px)',
  gap: 'var(--aiq-gap, 14px)',
  row: 'var(--aiq-row, 6px 6px)',
  label: 'var(--aiq-label-size, 10.5px)',
  body: 'var(--aiq-body-size, 13.5px)',
  lead: 'var(--aiq-lead, 1.55)',
  radius: 'var(--aiq-radius, 12px)',
  radiusSm: 'var(--aiq-radius-sm, 8px)',
  rule: 'var(--aiq-rule, 1px)',
  ruleStrong: 'var(--aiq-rule-strong, 2px)',
  pagePad: 'var(--aiq-page-pad, 20px 18px 64px)',
};

export const TOWN = 'Marker Nine';

/* ============================================================================
   THE ONE STYLESHEET ON THE SHELF, AND IT EXISTS FOR ONE REASON: A REACT INLINE
   STYLE CANNOT CARRY A MEDIA QUERY.

   Every tool here is styled with inline style objects, which is what lets a
   faceplate resolve per tool with no class names to keep in step. The cost is
   that nothing in a tool can say "and at 390px, differently". So nothing did,
   and every shelf tool opened with the same two-track grid at every width:

       gridTemplateColumns: 'minmax(0, 1.4fr) minmax(300px, 1fr)'

   A GRID WITH TWO DECLARED TRACKS STAYS TWO TRACKS. It does not wrap. On a
   390px phone the page padding leaves about 354px, the right-hand rail claims
   its 300px minimum, and the working column is squeezed to roughly 40. It does
   not overflow — it COLLAPSES — and then a 120px input inside it hangs 80px off
   the side of the page.

   AND THE PAGE DOES NOT SCROLL SIDEWAYS TO REACH IT. global.css puts
   `overflow-x: clip` on html and body, deliberately, to stop decorative artwork
   dragging the marketing pages under a thumb. On a tool page the same rule cuts
   the overflowing content off with no scrollbar, so the reader does not get a
   squeezed column — they get a column that is not there.

   WHY A CLASS AND NOT A CLEVERER TRACK LIST. `repeat(auto-fit, minmax(min(100%,
   300px), 1fr))` wraps with no media query and was the first thing tried. It
   also throws away the ratio: every tool's working column and summary rail
   become equal on a desktop, which is a redesign nobody asked for. Keeping the
   ratio in a custom property and collapsing it in a media query leaves the
   desktop rendering byte-identical.

   IT MOUNTS IN ToolHeader, NOT IN DemoLayout, and that is load-bearing.
   `npm run handover` packs each tool into a single offline file through
   vite.handover.config.mjs, and that build never renders the Astro layout — a
   stylesheet there would reach the public page and not the copy a client keeps.
   All thirty shelf tools mount ToolHeader; the seven industrial demos do not,
   and they carry their own layouts.
   ============================================================================ */
export function PhoneRules() {
  return (
    <style dangerouslySetInnerHTML={{ __html: `
.aiq-split{display:grid;gap:14px;align-items:start;
  grid-template-columns:minmax(0,var(--aiq-split,1.5fr)) minmax(300px,1fr)}
.aiq-scroll{overflow-x:auto;max-width:100%}
.aiq-hero{display:grid;gap:var(--aiq-gap,14px);
  grid-template-columns:auto minmax(0,1fr);align-items:center}
@media (max-width:760px){
  .aiq-split{grid-template-columns:minmax(0,1fr)}
  .aiq-hero{grid-template-columns:minmax(0,1fr)}
  /* The rule between the headline figure and the cells beside it becomes the
     rule under it, because the two are now stacked rather than side by side. */
  .aiq-hero-lead{padding-right:0!important;border-right:0!important;
    padding-bottom:10px;border-bottom:var(--aiq-rule,1px) solid var(--aiq-border,#0000)}
  /* A column of numbers is worth a sideways drag; a heading is not, and at this
     width the heading is what pushes a table past the edge. */
  [data-demo] th{white-space:normal}
  /* Nothing inside a tool may be wider than the page it sits on. Anything that
     genuinely needs the room asks for it with .aiq-scroll. */
  [data-demo] table{max-width:100%}
}
` }} />
  );
}

// ============================================================================
// REMEMBERING — the owner's own setup, on their own machine and nowhere else.
//
// DETECTED BY USE, NEVER BY PRESENCE. A private window can expose the storage
// object and then throw the moment you write to it, so checking the object
// exists proves nothing. Write a sentinel, read it back, delete it.
//
// WHEN IT DOES NOT WORK THE TOOL KEEPS RUNNING AND SAYS SO. A silent no-op
// would let somebody build their roster or their shelf, close the laptop, and
// lose it having never been told it was not being kept.
//
// EVERY KEY IS NAMESPACED aiq:<tool>:v<n>. Measured on this machine: a page
// opened from a local disk shares ONE storage area with every other local page
// regardless of folder, so two delivered tools on one laptop would otherwise
// overwrite each other.
// ============================================================================
/**
 * @param {'demo'|'owner'} mode
 *
 * ONE CODE PATH, TWO SEEDS, AND THE MODE IS DATA RATHER THAN A BRANCH.
 *
 * 'demo' NEVER TOUCHES STORAGE, and that is not tidiness. The public page must
 * not keep a stranger's fiddling, and it must not show one visitor's numbers to
 * the next person on a library or café machine — which stops being theoretical
 * the moment a handover file and a downloaded demo sit on the same desktop,
 * because a page opened from a local disk shares one storage area with every
 * other local page regardless of folder. Measured, not assumed.
 *
 * 'owner' FALLS BACK TO THE SAMPLE on first open, deliberately. An empty tool is
 * where a non-technical owner decides it is broken. It also means the demo path
 * is exercised on every single delivery, so it cannot rot unnoticed.
 */
export function useRemembered(toolId, version, sample, mode = 'demo') {
  const [state, setState] = useState(sample);
  const [status, setStatus] = useState('session-only');
  const [restored, setRestored] = useState(false);
  const key = `aiq:${toolId}:v${version}`;

  useEffect(() => {
    if (mode !== 'owner') { setStatus('demo'); return; }
    let ok = 'session-only';
    try {
      const probe = `${key}:probe`;
      window.localStorage.setItem(probe, '1');
      ok = window.localStorage.getItem(probe) === '1' ? 'remembering' : 'session-only';
      window.localStorage.removeItem(probe);
    } catch {
      ok = 'session-only';
    }
    setStatus(ok);
    if (ok !== 'remembering') return;
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return;
      const saved = JSON.parse(raw);
      /* A VERSION MISMATCH DISCARDS RATHER THAN MERGING. Folding a stale shape
         into a new one is how a tool starts producing confident wrong answers
         about somebody's money. */
      if (saved && saved.v === version && saved.data) {
        setState(saved.data);
        setRestored(true);
      }
    } catch { /* unreadable is the same as absent */ }
  }, [key, version, mode]);

  useEffect(() => {
    if (mode !== 'owner' || status !== 'remembering') return;
    try {
      window.localStorage.setItem(key, JSON.stringify({ v: version, data: state }));
    } catch { /* quota, or a window that lied — the strip already says it may not stick */ }
  }, [state, status, key, version, mode]);

  /* structuredClone so a caller can mutate freely inside the callback without
     writing a spread for every nested field. */
  const patch = useCallback((fn) => {
    setState((s) => { const next = structuredClone(s); fn(next); return next; });
  }, []);

  const reset = useCallback(() => { setState(sample); setRestored(false); }, [sample]);

  /* WHAT IS ON THE SCREEN, AS DATA. Every engine under src/lib/ is a pure
     function of `state` — the clock included, because the two tools that need a
     date take `today` as an INPUT rather than calling new Date(). So `state`
     alone reproduces every figure the client is looking at, and this does not
     have to capture a seed, a timestamp or a computation context to be
     replayable. It is the storage envelope above with a lid on it. */
  const pack = useCallback(
    () => ({ tool: toolId, stateVersion: version, mode, state }),
    [toolId, version, mode, state],
  );

  return { state, setState, patch, reset, status, restored, pack };
}

// ============================================================================
// THE STATE PACKAGE — what the client is looking at, in a file they choose to
// send. It replaces "take a photo of the screen", which shows the problem but
// cannot be worked with.
//
// THE ARITHMETIC HALF LIVES IN src/lib/state-package.js and is re-exported here
// so a tool imports one place. That split is not tidiness: this file imports
// React, so a Node gate cannot load it, and the whole point of the pure module
// is that `npm run verify` checks the very function the page runs rather than a
// second copy that happens to agree.
//
// IT NEVER SENDS ANYTHING. The client presses a button, a file lands in their
// downloads, and they attach it to the email they were already writing. WontDo
// hardcodes "nothing you type is sent anywhere" and two gates assert it against
// the rendered page, so a network path here would make that promise false.
// ============================================================================
export { buildPackage, readPackage, storageKey, PACKAGE_FORMAT, PACKAGE_KIND } from '../../lib/state-package.js';

export function SaveState({ toolId, pack }) {
  const save = useCallback(() => {
    if (typeof window === 'undefined' || typeof pack !== 'function') return;
    const parts = pack();
    let shown = '';
    try {
      const host = document.querySelector('[data-demo="' + toolId + '"]');
      shown = (host && host.innerText) || '';
    } catch { /* the capture is a convenience; the state is the product */ }
    let agent = {};
    try {
      agent = {
        ua: window.navigator && window.navigator.userAgent,
        w: window.innerWidth,
        h: window.innerHeight,
        dpr: window.devicePixelRatio,
        lang: window.navigator && window.navigator.language,
        tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
    } catch { /* any of these can be absent; none of them is required */ }

    const pkg = buildPackage({ ...parts, shown, agent });
    const stamp = new Date().toISOString().slice(0, 10);
    const blob = new Blob([JSON.stringify(pkg, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = toolId + '-' + stamp + '.aiq.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [toolId, pack]);

  return (
    <Btn onClick={save} small title="Saves a small text file of what you have typed in, so it can be looked at exactly as you see it.">
      Save what is on this screen
    </Btn>
  );
}

// ============================================================================
// PARSING — text in a box back to a usable number.
// Everything returns 0 or null rather than NaN, because NaN travels silently
// through arithmetic and produces a blank where a wrong answer would at least
// have been noticed.
// ============================================================================
export const toCents = (s) => {
  const n = Number(String(s).replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
};
export const toHundredths = toCents;
export const toNumber = (s) => {
  const n = Number(String(s).replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
};
/** Null when blank, so "they have not set one" stays different from "they set zero". */
export const toOptionalNumber = (s) => {
  const t = String(s).replace(/[^0-9.]/g, '');
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};

export const cash = (cents) =>
  (cents / 100).toLocaleString('en-US', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2,
  });
export const plain = (h) => (h / 100).toFixed(2).replace(/\.00$/, '');

/**
 * An id for a row somebody just added.
 *
 * THE COUNTER USED TO RESTART AT ONE ON EVERY PAGE LOAD. In owner mode the rows
 * are restored from storage, so a second session handing out p_1 again collides
 * with a p_1 already on screen — and every list renders key={row.id}, so React
 * then has two children with the same key and an edit or a delete can land on
 * the wrong row. Only restored USER-ADDED rows collide; the sample ids never do,
 * which is exactly why it survived a day of testing on the sample.
 *
 * The random suffix makes a collision across sessions effectively impossible
 * without needing to know what is already in storage.
 */
export const uid = (() => {
  let n = 0;
  return (p) => `${p}_${(n += 1)}_${Math.random().toString(36).slice(2, 8)}`;
})();

// ============================================================================
// CHROME
// ============================================================================
/**
 * A PANEL, drawn four ways.
 *
 * All 41 call sites across the nine tools pass only title/note/right/children,
 * which is what made this reachable at all: the treatment is read from the
 * tool's faceplate at render time and not one call site had to change.
 *
 *   card   a bordered card on the page      — the default, and what it was
 *   ruled  a rule above, no box             — a worksheet, a ledger, an order pad
 *   board  heavy border, tinted head strip  — something you read across a room
 *   clean  no border at all, space instead  — calm, for a list read to a person
 *
 * `surface` is a prop only so a tool can override one panel; every tool sets it
 * once via ToolSurface below rather than at 41 call sites.
 */
/* A PANEL TITLE, DRAWN SEVEN WAYS.
   Every panel title on the shelf used to be a mono uppercase 1.2-tracked accent
   label — in all four panel variants, in all nine tools, at all 41 call sites.
   One shape, 41 times. A title is the second thing a person reads after the
   paper itself, so one title style makes nine tools read as one tool however
   much the stock underneath them varies. The shape is read from the faceplate
   and not one of the 41 call sites changes.

   ⚠️ NO SHAPE MAY RENDER A FOCUSABLE CONTROL. verify-tools.mjs targets inputs by
   POSITION — `[data-demo="tip-out-sheet"] input` at .nth(2), and again inside
   the first table row. A control added above them retargets those checks
   silently: they would still PASS, against the wrong field. */
function PanelHead({ title, right, shape }) {
  const row = (inner) => (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
      {inner}{right}
    </div>
  );
  const mono = { margin: 0, fontSize: S.label, letterSpacing: 1.2, textTransform: 'uppercase', fontFamily: FONT_HEAD };

  /* A CHECK PAD'S DOTTED LEADER — the line of dots running out to the figure. */
  if (shape === 'dotted') return row(
    <h2 style={{ ...mono, color: A.brass, flex: '1 1 auto', display: 'flex', alignItems: 'baseline', gap: 8 }}>
      <span>{title}</span>
      <span aria-hidden="true" style={{ flex: '1 1 auto', borderBottom: `1px dotted ${T.border}`, transform: 'translateY(-3px)' }} />
    </h2>
  );
  /* AN INVOICE'S SECTION HEADING, which is not colored and never was. */
  if (shape === 'caps') return row(
    <h2 style={{
      margin: 0, fontFamily: FONT_BODY, fontSize: `calc(${S.body} + 0.5px)`,
      fontVariant: 'small-caps', letterSpacing: 0.6, fontWeight: 600, color: T.textSec,
    }}>{title}</h2>
  );
  /* THE PRINTED TAB on a carbonless form. Pulls up and left out of the panel's
     own padding, so it only sits right on a `card` panel — which is the one
     faceplate that asks for it. */
  if (shape === 'tab') return row(
    <h2 style={{
      ...mono, color: A.accentInk, background: A.brass, padding: '3px 9px',
      borderRadius: `${S.radiusSm} ${S.radiusSm} 0 0`,
      marginTop: `calc(-1 * ${S.pad})`, marginLeft: `calc(-1 * ${S.pad})`, display: 'inline-block',
    }}>{title}</h2>
  );
  /* A BOARD'S FILLED HEADER STRIP, edge to edge. Assumes a `board` panel. */
  if (shape === 'fill') return (
    <div style={{
      background: A.brass, margin: `calc(-1 * ${S.pad}) calc(-1 * ${S.pad}) 0`, padding: `6px ${S.pad}`,
      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
    }}>
      <h2 style={{
        margin: 0, fontFamily: FONT_HEAD, fontSize: `calc(${S.label} + 1px)`, letterSpacing: 1.4,
        textTransform: 'uppercase', fontWeight: 600, color: A.accentInk,
      }}>{title}</h2>
      {right}
    </div>
  );
  /* A LEDGER COLUMN HEAD — set in the display face, with a rule under it. */
  if (shape === 'rule') return (
    <>
      {row(<h2 style={{
        margin: 0, fontFamily: FONT_DISPLAY, fontSize: `calc(${S.body} + 2px)`,
        fontWeight: 600, letterSpacing: -0.1, color: T.text,
      }}>{title}</h2>)}
      <div aria-hidden="true" style={{ borderBottom: `${S.rule} solid ${T.border}`, marginTop: 6 }} />
    </>
  );
  /* A RUBBER STAMP on an order pad or a statement. */
  if (shape === 'stamp') return row(
    <h2 style={{
      ...mono, color: A.brass, border: `${S.rule} solid ${A.brass}`,
      borderRadius: S.radiusSm, padding: '3px 8px', display: 'inline-block',
    }}>{title}</h2>
  );
  /* 'label' — what all nine used to be. Kept, and one tool still asks for it, so
     the shape does not vanish from the shelf entirely. */
  return row(<h2 style={{ ...mono, color: A.brass }}>{title}</h2>);
}

export function Panel({ title, note, children, right, surface }) {
  const f = FACE_CTX.current || {};
  const v = surface || f.panel || 'card';
  const head = <PanelHead title={title} right={right} shape={f.head || 'label'} />;
  const body = (
    <>
      {note && <p style={{ margin: `8px 0 0`, fontSize: S.body, lineHeight: S.lead, color: T.textMuted }}>{note}</p>}
      <div style={{ marginTop: 12 }}>{children}</div>
    </>
  );

  if (v === 'ruled') {
    return (
      <section style={{ borderTop: `${S.ruleStrong} solid ${T.text}`, paddingTop: 10, marginBottom: `calc(${S.gap} + 6px)` }}>
        {head}{body}
      </section>
    );
  }
  if (v === 'board') {
    return (
      <section style={{
        background: T.surface, border: `${S.ruleStrong} solid ${T.borderStrong}`, borderRadius: S.radiusSm,
        marginBottom: S.gap, overflow: 'hidden',
      }}>
        <div style={{ padding: S.pad, paddingTop: 0 }}>
          {head}
          <div style={{ marginTop: S.pad }}>{body}</div>
        </div>
      </section>
    );
  }
  if (v === 'clean') {
    return (
      <section style={{ marginBottom: `calc(${S.gap} + 10px)`, padding: `0 2px` }}>
        {head}{body}
      </section>
    );
  }
  return (
    <section style={{
      background: T.surface, border: `${S.rule} solid ${T.border}`, borderRadius: S.radius,
      padding: S.pad, marginBottom: S.gap,
    }}>
      {head}{body}
    </section>
  );
}

/* HOW A TOOL SETS ITS WHOLE FACEPLATE ONCE. Deliberately a module-scoped current
   value rather than React context: these islands render synchronously in one
   tree per page, `pageFor` is called at the top of that tree, and a context
   provider would mean wrapping every tool's JSX — nine more edits for the same
   result.

   THIS REPLACED SURFACE_CTX AND READOUT_CTX, and it is one value rather than
   three on purpose. The head shape needed a context of its own, which would have
   made three module values sharing one lifetime rule between them. Folding them
   into one means the NEXT axis is free and there is exactly one thing to reason
   about. Nothing outside this file imported either old name.

   ⚠️ THE CONSTRAINT IS UNCHANGED AND STILL LOAD-BEARING: it is set by pageFor
   and read during the same render pass, which is safe only because exactly one
   island renders per page. The demo routes are one island each by construction,
   and the handover entry mounts a single <Tool />. Two tools in one tree would
   give the second one the first one's paper. */
export const FACE_CTX = { current: null };

export function Btn({ children, onClick, primary, small, title }) {
  return (
    <button type="button" onClick={onClick} title={title} style={{
      background: primary ? A.brass : T.surfaceAlt,
      color: primary ? A.accentInk : T.text,
      border: `${S.rule} solid ${primary ? A.brass : T.border}`,
      borderRadius: S.radiusSm, padding: small ? '5px 9px' : '8px 13px',
      /* SIZE AND WEIGHT STAY LITERAL. The faceplate varies the FACE, which is
         where the identity is; letting the size float with density would move a
         button under a hand-tuned column width for no gain. */
      fontSize: small ? 12 : 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONT_BODY,
    }}>{children}</button>
  );
}

/**
 * A cell in a table, which is where most of the typing on this shelf happens.
 *
 * `label` IS NOT OPTIONAL IN PRACTICE, and the reason is worth stating. A table
 * of bare inputs reads perfectly to somebody looking at it, because the column
 * heading and the row name carry the meaning. A screen reader announces each one
 * as "edit text, blank" and carries neither — sixty-three times on the count
 * sheet. Measured on 2026-08-25: 300 of 356 form controls across the nine tools
 * had no accessible name at all.
 *
 * So every call site passes what the cell IS, in the row it belongs to, and it
 * becomes the input's aria-label. `npm run smoke` fails if any tool ships a
 * control without one.
 */
/**
 * WHAT THE PERSON TYPED, kept intact while they are typing it.
 *
 * THIS IS THE MOST IMPORTANT TWENTY LINES ON THE SHELF, and their absence made
 * every tool unusable while every gate stayed green.
 *
 * Each numeric field is a controlled input whose `value` was re-derived from
 * parsed state on every keystroke — `value={(cents / 100).toFixed(2)}`. So
 * typing 5000 into a money field went: "5" -> 500 cents -> redisplayed "5.00",
 * caret at the end -> "5.000" -> 500 cents -> "5.00". MEASURED: typing 5000
 * produced 5.00. And a decimal point could not be typed at all anywhere, because
 * Number("7.") is 7 and String(7) is "7", so the dot was swallowed and the next
 * digit became a units digit — 7.5 became 75.
 *
 * WHY EVERY GATE MISSED IT. verify-tools.mjs and every check written today set
 * values with Playwright's fill(), which delivers the whole string in ONE input
 * event and never round-trips a partial value. fill() is not typing. The engines
 * were right, the render was right, and the one path a human actually uses was
 * never exercised.
 *
 * THE FIX keeps a draft of the raw keystrokes while the field has focus, and
 * hands it back to the canonical formatted value on blur. State still updates on
 * every keystroke, so every answer on the page still moves live — the only thing
 * that changes is that the box shows what was typed rather than what the parser
 * made of it a moment ago.
 */
function useTyped(value, onChange) {
  const [draft, setDraft] = useState(null);
  return {
    value: draft ?? value,
    onChange: (raw) => { setDraft(raw); onChange(raw); },
    /* Dropping the draft on blur is what lets the field tidy itself up: "5000"
       becomes "5000.00" once the person leaves it, never while they are in it. */
    onBlur: () => setDraft(null),
  };
}

export function Cell({ value, onChange, w = 56, mono = true, placeholder, label }) {
  const typed = useTyped(value, onChange);
  return (
    <input
      value={typed.value}
      aria-label={label}
      placeholder={placeholder}
      inputMode={mono ? 'decimal' : undefined}
      onChange={(e) => typed.onChange(e.target.value)}
      onBlur={typed.onBlur}
      style={{
        /* ⚠️ fontSize STAYS A LITERAL, and so does Field's below. All nine tools
           pass hand-tuned pixel widths — w={54}, w={62}, w={72}, w={124} — sized
           against exactly these numbers. Letting the size float with density
           would put 14px inside a 54px box on the airy tools and clip the last
           digit of a four-figure number, with nothing anywhere erroring. The
           FACE varies, which is where the identity is; the SIZE does not. */
        width: w, textAlign: mono ? 'right' : 'left', background: T.bg, color: T.text,
        border: `${S.rule} solid ${T.border}`, borderRadius: S.radiusSm, padding: '5px 7px',
        fontSize: 13, fontFamily: mono ? FONT_DATA : FONT_BODY,
        fontVariantNumeric: mono ? 'tabular-nums' : undefined,
      }}
    />
  );
}

export function Field({ label, value, onChange, hint, w = 120, prefix, suffix }) {
  const id = React.useId();
  const typed = useTyped(value, onChange);
  return (
    <label htmlFor={id} style={{ display: 'block' }}>
      <span style={{ display: 'block', fontSize: 11, color: T.textSec, marginBottom: 4, fontFamily: FONT_BODY }}>{label}</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {prefix && <span style={{ color: T.textMuted, fontFamily: FONT_DATA, fontSize: 13 }}>{prefix}</span>}
        <input id={id} value={typed.value} inputMode="decimal"
          onChange={(e) => typed.onChange(e.target.value)} onBlur={typed.onBlur}
          style={{
            width: w, background: T.bg, color: T.text, border: `${S.rule} solid ${T.border}`,
            borderRadius: S.radiusSm, padding: '7px 9px', fontSize: 13.5, fontFamily: FONT_DATA,
            fontVariantNumeric: 'tabular-nums',
          }} />
        {suffix && <span style={{ color: T.textMuted, fontFamily: FONT_DATA, fontSize: 13 }}>{suffix}</span>}
      </span>
      {hint && <span style={{ display: 'block', fontSize: 11, color: T.textMuted, marginTop: 3 }}>{hint}</span>}
    </label>
  );
}

/**
 * The tool's opening block — who it is for, what it does, and an HONEST line
 * about whether this browser will keep their setup.
 *
 * The storage line is not decoration. A tool that quietly forgets is a tool
 * somebody rebuilds from scratch on a Friday night without knowing why.
 */
/**
 * THE MASTHEAD — nine shapes, one per trade, and this is where most of the
 * identity actually lives.
 *
 * WHY IT IS SHAPED AND NOT JUST COLORED. Nine tools sharing one header read as
 * one tool nine times however the accent is set. A bar tab, a boat's settlement
 * sheet and a yard's storm board are three different KINDS of document before
 * they are three different colors, and a person recognizes the kind first.
 *
 * The variant is read from the tool's faceplate, so all nine call sites stayed
 * exactly as they were.
 *
 * THE SHAPES ARE THE `if (v === …)` BRANCHES BELOW AND ARE NOT LISTED HERE.
 * They were, as nine lines describing nine of them, and by 2026-09-07 there
 * were twenty-five — so the list was not merely stale, it was describing about
 * a third of the file while sitting where a reader meets it first. Each branch
 * carries its own note, and `node scripts/sweep-shared-faceplate.mjs` prints
 * which faceplate takes each one, read live out of themes.js. A name here that
 * no branch implements is refused by `npm run contrast`.
 *
 * `house` is the fictional Marker Nine business; `occasion` is the sample
 * ("sample night", "sample trip"). Both already existed in every tool.
 */
export function ToolHeader({ house, occasion, name, children, status, restored, remembers, toolId, badge, pack }) {
  const f = themeFor(toolId || '');
  const v = f.masthead || 'plain';

  const eyebrow = (extra = {}) => (
    <p style={{
      margin: 0, fontFamily: FONT_HEAD, fontSize: 11, letterSpacing: 1.4,
      color: A.brass, textTransform: 'uppercase', ...extra,
    }}>{house} · {TOWN} · {occasion}</p>
  );
  const title = (extra = {}) => (
    <h1 style={{
      margin: '6px 0 0', fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 650,
      letterSpacing: -0.3, lineHeight: 1.15, color: T.text, ...extra,
    }}>{name}</h1>
  );
  /* fontFamily IS STATED rather than inherited. It resolves correctly today
     because the page root sets it, and stating it means a future wrapper cannot
     silently reset the one voice this block is read in. */
  const lede = (extra = {}) => (
    /* data-tool-lede IS A TEST HOOK AND IT EARNS ITS PLACE. check-handover.mjs
       asserts the delivered file actually SETS the tool's reading face on
       something, which is a different question from whether the font arrived.
       It used to sample "the first <p> in the tool" — which is the masthead
       EYEBROW, correctly set in the head face — so it failed on the five tools
       whose reading and head faces differ. This is the paragraph that is prose. */
    <p data-tool-lede style={{
      margin: '8px 0 0', maxWidth: 780, fontSize: S.body, lineHeight: S.lead,
      fontFamily: FONT_BODY, color: T.textSec, ...extra,
    }}>{children}</p>
  );

  /* THREE STATES, NOT TWO. The demo says so out loud rather than implying it
     will keep anything, because a visitor who types their real roster into a
     public page and comes back to find it gone has been misled by silence. */
  /* borderRadius: 999 IS DELIBERATELY NOT A FACEPLATE VALUE. Every other edge on
     the shelf now varies by paper; this one does not, because it is the single
     element that carries the same promise in all nine tools and should be
     recognizably the same object wherever a visitor meets it. */
  const strip = (
    <div style={{
      marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
      background: T.surface, border: `${S.rule} solid ${T.border}`, borderRadius: 999,
      padding: '6px 12px', fontSize: 12, color: T.textSec, fontFamily: FONT_BODY,
    }}>
      <span style={{
        width: 8, height: 8, borderRadius: '50%',
        background: status === 'remembering' ? A.good : (status === 'demo' ? A.brass : A.warn),
      }} />
      {status === 'demo'
        ? `This is the demo, so nothing is kept — reload and it is back to the sample. Your own copy remembers your ${remembers}.`
        : status === 'remembering'
          ? (restored
              ? `Your ${remembers} was remembered on this computer, and it loaded.`
              : `Your ${remembers} will be remembered on this computer.`)
          : `This browser will not keep your ${remembers}, so it starts fresh every time.`}
    </div>
  );

  /* THE SAVE BUTTON SITS BESIDE THE STATUS STRIP because the strip is already
     the place this header talks about what is kept and what is not, and the
     button is the answer to the same question. An absent `pack` renders exactly
     as before, which is what lets the tool files adopt it one at a time. */
  const saver = pack ? <SaveState toolId={toolId} pack={pack} /> : null;

  /* inline-flex, NOT flex. Four of the eleven mastheads pass textAlign:'center'
     through `extra`, and a block-level row would ignore it and sit left while
     everything above it stayed centered. An inline-level box still obeys the
     parent's text alignment. */
  const footer = (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      {strip}{saver}
    </span>
  );

  const shell = (inner, extra = {}) => (
    <header style={{ maxWidth: 1240, margin: '0 auto 16px', ...extra }}>
      <PhoneRules />{inner}{footer}
    </header>
  );

  if (v === 'check') {
    return shell(
      <div style={{
        textAlign: 'center', borderTop: `${S.ruleStrong} solid ${T.text}`, borderBottom: `${S.ruleStrong} solid ${T.text}`,
        padding: '12px 0', maxWidth: 560, margin: '0 auto',
      }}>
        {title({ fontSize: 21, letterSpacing: 2, textTransform: 'uppercase', margin: 0 })}
        {eyebrow({ marginTop: 6, letterSpacing: 1.8 })}
        {lede({ margin: '10px auto 0', maxWidth: 520, fontSize: 12.5 })}
      </div>,
      { textAlign: 'center' },
    );
  }

  /* A DAY BOOK. Somebody writing in a spiral book starts past the binding, so
     this block is indented past the punch holes and that indent is the whole of
     its structure — it is the ONLY masthead here with no rule and no fill in it
     at all. Nine of the others are built out of lines and one out of a block of
     color; this one is built out of where it sits. */
  if (v === 'daybook') {
    return shell(
      <div style={{ paddingLeft: 34 }}>
        {title({ margin: 0, fontSize: 27 })}
        {eyebrow({ marginTop: 5 })}
        {lede({ marginTop: 9 })}
      </div>,
    );
  }

  /* A REPAIR ORDER. The head of one of these is a single ruled band with the
     shop on the left and the job on the right, sitting on ONE line and closed
     underneath by a double rule — the pair of lines being the tell, because a
     form printed on security stock never uses a single one. Every other
     masthead here stacks its parts; this is the only one that sets the title
     and the eyebrow side by side on the same baseline. */
  if (v === 'repairorder') {
    return shell(
      <div>
        <div style={{
          display: 'flex', gap: 14, alignItems: 'baseline', justifyContent: 'space-between',
          flexWrap: 'wrap', paddingBottom: 6,
          borderBottom: `${S.ruleStrong} solid ${T.text}`,
        }}>
          {title({ margin: 0, fontSize: 21, letterSpacing: 1.2, textTransform: 'uppercase' })}
          {eyebrow({ textAlign: 'right' })}
        </div>
        <div style={{ borderTop: `${S.rule} solid ${T.borderStrong}`, marginTop: 2 }} />
        {lede({ marginTop: 10 })}
      </div>,
    );
  }

  /* A CLIPBOARD. A route sheet is printed with the day across the top under a
     heavy rule and nothing else competing with it, because the only thing that
     matters at seven in the morning is which day's list this is. So the eyebrow
     goes FIRST and large, the name of the sheet sits under it smaller, and the
     two are separated by the rule rather than by space — the only masthead here
     that puts the occasion above the title. */
  if (v === 'clipboard') {
    return shell(
      <div>
        {eyebrow({ fontSize: 12.5, letterSpacing: 1.8, color: T.textSec })}
        <div style={{ borderTop: `${S.ruleStrong} solid ${T.text}`, marginTop: 7, paddingTop: 8 }}>
          {title({ margin: 0, fontSize: 20, letterSpacing: 0.2 })}
          {lede({ marginTop: 7 })}
        </div>
      </div>,
    );
  }

  /* AN APPOINTMENT CARD. The thing a salon hands across a counter is a small
     printed card with the shop's name sitting inside a filled band across the
     top, and everything else below it in the clear. That filled band is what
     makes this distinct: every other masthead here is drawn with RULES, and
     this is the only one where the shop's name sits on a block of color.
     Deliberately quiet color — the faceplate's tint, not its accent. */
  if (v === 'cardstock') {
    return shell(
      <div>
        <div style={{
          background: A.tint, border: `${S.rule} solid ${T.border}`, borderRadius: S.radiusSm,
          padding: '11px 14px 12px',
        }}>
          {eyebrow()}
          {title({ marginTop: 4, fontSize: 25 })}
        </div>
        {lede({ marginTop: 10 })}
      </div>,
    );
  }

  /* A DUPLICATE WORK ORDER. Every estimate pad a trade buys has the same two
     things printed on it before anybody writes a word: the shop's name across
     the top, and a boxed number block over on the right that the pad is
     sequentially numbered into. So the head is TWO COLUMNS with a ruled box on
     the right, which no other masthead here is — the other nine are all a
     single stacked column, centered or left.

     No accent anywhere in it. A pre-printed form is printed in one ink, and the
     color on this faceplate is spent on the one thing that matters on a quote,
     which is the total. */
  if (v === 'workorder') {
    return shell(
      <div style={{
        display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap',
        borderTop: `${S.ruleStrong} solid ${T.text}`,
        borderBottom: `${S.rule} solid ${T.borderStrong}`,
        padding: '10px 0 12px',
      }}>
        <div style={{ flex: '1 1 320px', minWidth: 0 }}>
          {title({ fontSize: 22, letterSpacing: 0.6, textTransform: 'uppercase', margin: 0 })}
          {eyebrow({ marginTop: 5 })}
          {lede({ marginTop: 9 })}
        </div>
        <div style={{
          flex: '0 0 auto', border: `${S.rule} solid ${T.borderStrong}`,
          padding: '7px 12px 8px', minWidth: 132,
        }}>
          <p style={{
            margin: 0, fontFamily: FONT_HEAD, fontSize: 9.5, letterSpacing: 1.3,
            textTransform: 'uppercase', color: T.textMuted,
          }}>Estimate no.</p>
          <p style={{
            margin: '3px 0 0', fontFamily: FONT_DATA, fontSize: 17, color: T.text, lineHeight: 1.2,
          }}>{badge || '—'}</p>
        </div>
      </div>,
    );
  }

  /* A YARD BOARD. It used to carry `borderLeft: 10px solid accent` — a thick
     colored bar down one side of a card, which is the single most recognizable
     tell of a generated interface, and this site already retired a typeface for
     being one. It is an EVEN HEAVY FRAME now, which is what a real board on a
     wall actually has, and the accent it lost here it gains at full page height:
     this faceplate is the one carrying `edgeBar`, so the color still runs down
     the left of the page as structure rather than as an ornament on a box.

     A.accent does not exist — the accent slot is A.brass, and a `||` fallback
     would have silently drawn the wrong color. A.ring is the faceplate's own
     edge tone. */
  if (v === 'board') {
    return shell(
      <div style={{
        background: A.tint, border: `${S.ruleStrong} solid ${A.ring}`,
        borderRadius: S.radiusSm, padding: '12px 16px',
      }}>
        {eyebrow({ color: T.textSec })}
        {title({ fontSize: 30, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' })}
        {lede({ maxWidth: 900 })}
      </div>,
    );
  }

  if (v === 'letterhead') {
    return shell(
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        gap: 20, flexWrap: 'wrap', borderBottom: `${S.rule} solid ${T.border}`, paddingBottom: 12,
      }}>
        <div>{title({ margin: 0 })}{lede({ maxWidth: 620 })}</div>
        <div style={{ textAlign: 'right', minWidth: 190 }}>{eyebrow({ letterSpacing: 1.1 })}</div>
      </div>,
    );
  }

  if (v === 'statement') {
    return shell(
      <div style={{
        display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 18, alignItems: 'end',
        borderBottom: `${S.ruleStrong} solid ${T.borderStrong}`, paddingBottom: 10,
      }}>
        <div>{eyebrow()}{title()}</div>
        <p style={{
          margin: 0, fontFamily: FONT_HEAD, fontSize: 11, letterSpacing: 1,
          textTransform: 'uppercase', color: T.textMuted, textAlign: 'right',
        }}>against your own rate card</p>
        <div style={{ gridColumn: '1 / -1' }}>{lede()}</div>
      </div>,
    );
  }

  if (v === 'ledger') {
    return shell(
      <div style={{ borderTop: `3px double ${T.text}`, paddingTop: 12 }}>
        {title({ fontSize: 28, margin: 0 })}
        {eyebrow({ marginTop: 4 })}
        {lede()}
      </div>,
    );
  }

  if (v === 'clinical') {
    return shell(
      <div style={{ paddingLeft: 2 }}>
        {eyebrow({ color: T.textMuted, letterSpacing: 1.1 })}
        {title({ fontSize: 27, fontWeight: 500, marginTop: 10 })}
        {lede({ marginTop: 12, maxWidth: 700 })}
      </div>,
    );
  }

  if (v === 'orderpad' || v === 'stocksheet') {
    const heavy = v === 'stocksheet';
    return shell(
      <div style={{ borderBottom: heavy ? `calc(${S.ruleStrong} + 1px) solid ${A.brass}` : `${S.rule} dashed ${T.borderStrong}`, paddingBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
          {title({ margin: 0 })}
          {badge != null && (
            <span style={{
              fontFamily: FONT_HEAD, fontSize: 12, color: A.accentInk, background: A.brass,
              borderRadius: S.radiusSm, padding: '2px 8px', whiteSpace: 'nowrap',
            }}>{badge}</span>
          )}
        </div>
        {eyebrow({ marginTop: 5 })}
        {lede()}
      </div>,
    );
  }

  if (v === 'roster') {
    return shell(
      <div>
        {eyebrow()}
        {title()}
        {lede()}
      </div>,
    );
  }

  /* A HOUSEKEEPING CARD. The room and the day are printed INTO the rule rather
     than above or below it — a form divider with its label sitting in a gap in
     the line, which is how a card that has to be read at arm's length in a
     doorway is set.

     THE EYEBROW IS INSIDE THE RULE, and nothing else here does that. One writes
     ON a rule, one files it in a box above one, one runs dots across to the
     edge. Interrupting the line is the fourth answer and the only one that
     makes the label part of the divider rather than something near it. */
  if (v === 'housecard') {
    return shell(
      <div>
        {title({ margin: 0, fontSize: 28 })}
        <div style={{ marginTop: 11, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 28, borderTop: `${S.rule} solid ${T.borderStrong}` }} />
          {eyebrow({ margin: 0 })}
          <span style={{ flex: 1, borderTop: `${S.rule} solid ${T.borderStrong}` }} />
        </div>
        {lede({ marginTop: 11 })}
      </div>,
    );
  }

  /* A GUEST FOLIO. The itemized bill slid under the door on the last morning,
     and the one thing anybody looks at on it is the number in the top right —
     so that is what is set largest here, with the document's own name smaller
     to its left.

     IT IS THE ONLY MASTHEAD HERE WHERE THE TITLE IS NOT THE BIGGEST THING IN
     IT. The nearest shape is `statement`, which also sets something right of
     the title over a rule — but there the right-hand item is a small caps note
     and the h1 still dominates, because a reconciliation is read from its
     subject down. A folio inverts that: the guest already knows what the
     document is and is looking for the total, so the hierarchy follows the eye
     rather than the filing.

     ⚠️ THE FIGURE IS THE `badge`, NOT THE HEADING, and that is forced rather
     than chosen. check-handover.mjs asserts the tool's own h1 computes to its
     declared display face; setting the figure face on the h1 to get this look
     would pass everything on the site and fail the delivered copy — the same
     trap `report` records below. */
  if (v === 'folio') {
    return shell(
      <div>
        <div style={{
          display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 18, alignItems: 'end',
          borderBottom: `${S.ruleStrong} solid ${T.text}`, paddingBottom: 9,
        }}>
          <div>
            {title({ margin: 0, fontSize: 19, letterSpacing: 0.3 })}
            {eyebrow({ marginTop: 5 })}
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{
              margin: 0, fontFamily: FONT_HEAD, fontSize: 9.5, letterSpacing: 1.3,
              textTransform: 'uppercase', color: T.textMuted,
            }}>Account total</p>
            <p style={{
              margin: '2px 0 0', fontFamily: FONT_DATA, fontSize: 36, fontWeight: 600,
              lineHeight: 1, letterSpacing: -1, color: T.text,
            }}>{badge || '—'}</p>
          </div>
        </div>
        {lede({ marginTop: 10 })}
      </div>,
    );
  }

  /* A TILL TAPE. The head of a roll ends where somebody tore it off, so this
     block closes on a ragged edge rather than a rule.

     IT IS THE ONLY MASTHEAD HERE THAT IS NOT A STRAIGHT LINE. Eleven close on
     rules, ticks, dots or a box, and every one of those is something a press
     printed. A tear is the only mark on this shelf made by a hand pulling, and
     it belongs to the one document that arrives by the yard. */
  if (v === 'tilltape') {
    return shell(
      <div>
        {eyebrow({ margin: 0 })}
        {title({ margin: '5px 0 0', fontSize: 25 })}
        <div style={{
          marginTop: 10, height: 9,
          backgroundImage: `linear-gradient(135deg, ${T.borderStrong} 25%, transparent 25%), linear-gradient(225deg, ${T.borderStrong} 25%, transparent 25%)`,
          backgroundSize: '9px 9px',
          backgroundPosition: '0 0',
        }} />
        {lede({ marginTop: 10 })}
      </div>,
    );
  }

  /* A CONSIGNOR CONTRACT CARD. The reference and the date are filed at the top
     right, above a rule, and the agreement's name sits under it on the left —
     because the card gets pulled from a box by what is written in that corner,
     not by its title.

     IT IS THE ONLY MASTHEAD HERE THAT PUTS THE EYEBROW ABOVE THE TITLE AND
     RIGHT-ALIGNED. Two others lead with the eyebrow, both flush left and both
     reading as a running head. Filed in a corner is a different gesture, and it
     is the one a card in a box actually needs. */
  if (v === 'contractcard') {
    return shell(
      <div>
        {eyebrow({ margin: 0, textAlign: 'right' })}
        <div style={{ marginTop: 6, borderTop: `${S.ruleStrong} solid ${T.borderStrong}` }} />
        {title({ margin: '10px 0 0', fontSize: 27 })}
        {lede({ marginTop: 9 })}
      </div>,
    );
  }

  /* A SHEET OF PRICE STICKERS. Under the title runs the tear line between the
     top row of labels and the next — a row of short vertical ticks rather than
     a rule.

     NO OTHER MASTHEAD HERE IS BUILT FROM VERTICAL MARKS. Ten are horizontal
     rules, one is an indent, one is leader dots, one is a box, one writes on a
     line. A perforation between two rows of stickers runs the other way, and
     that ninety degrees is the whole identity. */
  if (v === 'stickers') {
    return shell(
      <div>
        {title({ margin: 0, fontSize: 26 })}
        <div style={{
          marginTop: 11, height: 7,
          backgroundImage: `repeating-linear-gradient(to right, ${T.borderStrong} 0, ${T.borderStrong} 1px, transparent 1px, transparent 7px)`,
        }} />
        {eyebrow({ marginTop: 9 })}
        {lede({ marginTop: 9 })}
      </div>,
    );
  }

  /* A SIGN-IN SHEET. The head of one is a title and then a long blank rule with
     the day and the room written ON it in somebody's hand — so the eyebrow here
     sits on the line at the right rather than under the title.

     THREE MASTHEADS NOW PUT SOMETHING TO THE RIGHT OF A TITLE and they are not
     interchangeable. The report runs dotted leaders ACROSS to the edge. The
     remittance boxes its sender BESIDE the title. This one writes on a solid
     rule that runs UNDER the whole width, which is a blank waiting to be filled
     rather than a field already printed. */
  if (v === 'signin') {
    return shell(
      <div>
        {title({ margin: 0, fontSize: 27 })}
        <div style={{ marginTop: 10, paddingBottom: 4, borderBottom: `${S.ruleStrong} solid ${T.text}`, display: 'flex', justifyContent: 'flex-end' }}>
          {eyebrow({ margin: 0 })}
        </div>
        {lede({ marginTop: 11 })}
      </div>,
    );
  }

  /* A REMITTANCE ADVICE. What arrives with the money, and its head is always the
     same two things side by side: what the document is, on the left, and a ruled
     box on the right carrying who sent it and against what.

     IT IS THE ONLY MASTHEAD HERE THAT PUTS ANYTHING IN A BOX. Ten are built out
     of rules, one out of an indent, one out of leader dots. A form that has to
     be read by a person and keyed by another one boxes the fields that get
     keyed, and nothing else on this shelf is that kind of document. */
  if (v === 'advice') {
    return shell(
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          {title({ margin: 0, fontSize: 26 })}
          <div style={{ border: `${S.ruleStrong} solid ${T.borderStrong}`, padding: '7px 11px', background: T.surface }}>
            {eyebrow({ margin: 0, fontSize: 10, letterSpacing: 1.2 })}
          </div>
        </div>
        {lede({ marginTop: 11 })}
      </div>,
    );
  }

  /* A MONTH-END REPORT off a line printer. The tell is the leader dots: a form
     title, then a run of dots carrying the eye across to whatever sat at the
     right edge, because the header was set on the same grid as the columns under
     it and nothing on that grid could be centered.

     NOTHING ELSE HERE RUNS A HORIZONTAL LEAD. Ten of the mastheads are built out
     of rules, one out of an indent, one out of a block of color — this is the
     only one whose structure is a line of dots, and it only reads as a report
     because the faceplate also declares `mono` as the DISPLAY face, so the title
     comes out of the same mechanism as the figures below it.

     ⚠️ THE TITLE'S FACE IS NOT OVERRIDDEN HERE, and that is deliberate rather
     than an omission. check-handover.mjs:249 asserts the tool's own h1 computes
     to its declared display face; setting the figure face on this one heading
     would fail the delivered file while looking correct on the site. */
  if (v === 'report') {
    return shell(
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          {title({ margin: 0, fontSize: 20, letterSpacing: 1.6, textTransform: 'uppercase', whiteSpace: 'nowrap' })}
          <span style={{ flex: 1, borderBottom: `2px dotted ${T.borderStrong}`, transform: 'translateY(-5px)' }} />
        </div>
        {eyebrow({ marginTop: 8 })}
        {lede({ marginTop: 10 })}
      </div>,
    );
  }

  /* A MONTHLY OWNER STATEMENT. What a managing agent posts with the money, and
     the head of one is a FIELD STRIP: a band ruled across the sheet, divided
     into compartments, each carrying a small printed label with its value
     underneath — because the form is printed once and filled in per owner, so
     every part of the header has to name itself.

     IT IS THE ONLY MASTHEAD HERE WITH A RULE INSIDE IT. `advice` boxes one value
     on the right and `workorder` boxes one on the right; both are single
     compartments with a caption beside a title. This is one band SPLIT into
     fields, and the divider between them is the structure — the difference
     between a header with something attached to it and a header that is a form.

     THE TOTAL IS THE `badge`, NOT THE HEADING. check-handover.mjs asserts the
     tool's own h1 computes to its declared display face, so setting the figure
     face on the heading to get this look would pass everything on the site and
     fail the delivered copy — the same trap `report` and `folio` both record. */
  if (v === 'ownerstatement') {
    const fieldLabel = {
      margin: 0, fontFamily: FONT_HEAD, fontSize: 9.5, letterSpacing: 1.3,
      textTransform: 'uppercase', color: T.textMuted,
    };
    return shell(
      <div>
        {title({ margin: 0, fontSize: 23, letterSpacing: 0.2 })}
        <div style={{
          marginTop: 10, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto',
          borderTop: `${S.ruleStrong} solid ${T.text}`,
          borderBottom: `${S.rule} solid ${T.borderStrong}`,
        }}>
          {/* THE FIRST FIELD CARRIES NO LEFT RULE. A printed strip is closed by
              its own top and bottom lines, and the divider only ever belongs
              BETWEEN two compartments. */}
          <div style={{ padding: '7px 14px 8px 0' }}>
            <p style={fieldLabel}>Managing agent</p>
            {eyebrow({
              margin: '3px 0 0', fontSize: 12.5, letterSpacing: 0.6,
              textTransform: 'none', color: T.text,
            })}
          </div>
          <div style={{ padding: '7px 0 8px 14px', borderLeft: `${S.rule} solid ${T.borderStrong}` }}>
            <p style={fieldLabel}>Paid out to the owners</p>
            <p style={{
              margin: '2px 0 0', fontFamily: FONT_DATA, fontSize: 21, fontWeight: 600,
              lineHeight: 1.15, letterSpacing: -0.4, color: T.text, whiteSpace: 'nowrap',
            }}>{badge || '—'}</p>
          </div>
        </div>
        {lede({ marginTop: 11 })}
      </div>,
    );
  }

  /* A DOOR TAG. The punch list that hangs on the handle of an empty unit, and
     the thing that makes one recognizable at ten paces is not anything printed
     on it — it is the HOLE, with the slot running from it to the top edge so
     the card slides over the handle. Everything else on the tag sits below and
     to the right of that.

     IT IS THE ONLY MASTHEAD HERE THAT DRAWS A SHAPE. Twenty-three of the others
     are built out of rules; one is a block of color, and one is built out of
     where it sits. A ring is an object rather than a line, and it is the single
     mark that says this sheet was hung on something rather than filed in
     something.

     THE HOLE AND THE SLOT ARE PAINTED IN THE PAGE'S OWN GROUND rather than left
     transparent, because the tag has a border and a background of its own: a
     transparent hole would show the card, not the door. T.bg and not the
     printed ground, for the same reason a punched hole carries no print. */
  if (v === 'doortag') {
    return shell(
      <div style={{
        position: 'relative',
        border: `${S.rule} solid ${T.borderStrong}`,
        borderTop: `${S.ruleStrong} solid ${T.text}`,
        borderRadius: S.radius,
        padding: '20px 16px 14px',
      }}>
        {/* THE SLOT — a gap punched clean through the top rule. It is drawn
            three pixels above the border and six tall so it covers a 1px or a
            2px rule either way; a height tuned to one of them would leave a
            hairline of print across the slot on the other. */}
        <span aria-hidden="true" style={{
          position: 'absolute', left: 28, top: -3, width: 14, height: 6, background: T.bg,
        }} />
        {/* THE HOLE. box-sizing is stated because the border is part of the
            circle here — without it the ring draws 4px wider than the slot is
            centered for, and the two stop lining up. */}
        <span aria-hidden="true" style={{
          position: 'absolute', left: 22, top: 2, width: 26, height: 26, boxSizing: 'border-box',
          borderRadius: '50%', border: `${S.ruleStrong} solid ${T.borderStrong}`, background: T.bg,
        }} />
        <div style={{ paddingLeft: 60 }}>
          {eyebrow()}
          {title({ marginTop: 4, fontSize: 26, letterSpacing: 0.5, textTransform: 'uppercase' })}
        </div>
        {lede({ marginTop: 11 })}
      </div>,
    );
  }

  /* A DAY SHEET. Every printed day sheet has one column down the left where the
     times print, and everything else on the page hangs to the right of it. So
     this head does not fill the width — it sits against that column, indented
     past a hairline, and closes on a short heavy rule that stops well before the
     right edge the way a printed form's does.

     IT IS THE ONLY MASTHEAD HERE WHOSE GEOMETRY COMES FROM ITS OWN PAPER. The
     `slots` texture rules a vertical at 58px and this indent lands against it,
     so the head reads as printed ON the sheet rather than laid over it. Every
     other masthead is built out of its own lines and would look the same on any
     stock. */
  if (v === 'daysheet') {
    return shell(
      <div style={{ marginLeft: 40, paddingLeft: 18, borderLeft: `${S.rule} solid ${T.border}` }}>
        {eyebrow({ margin: 0, letterSpacing: 1.6 })}
        {title({ margin: '5px 0 0', fontSize: 25 })}
        <div style={{ height: S.ruleStrong, background: T.borderStrong, margin: '10px 0 0', maxWidth: 440 }} />
        {lede({ marginTop: 10 })}
      </div>,
    );
  }

  /* A PAY APPLICATION. The form a trade submits to bill a progress payment, and
     what makes one different from every other document on this shelf is that
     HALF OF IT IS NOT THE APPLICANT'S TO FILL IN. The trade applies on the left;
     the general contractor and the architect certify on the right, and no money
     moves until that half carries a signature. So the head is split by a rule
     running its full height, and the right half is a captioned blank.

     IT IS THE ONLY MASTHEAD HERE THAT LEAVES A FIELD EMPTY ON PURPOSE. Four
     others set something to the right of a title and every one of them FILLS
     it: `workorder` prints a pad number, `folio` an account total, `advice` who
     sent the money, `ownerstatement` what was paid out. A blank waiting for a
     hand that is not the reader's is a different object, and on this document it
     is the whole reason the tool exists — the release trigger is somebody
     else's signature.

     THE CAPTION SITS UNDER THE RULE RATHER THAN ON IT. `signin` writes its
     eyebrow ON a solid line, which is a blank the reader fills themselves.
     Printing the label beneath the line is how a form says the line belongs to
     somebody who is not holding the pen.

     THE LEDE DROPS BELOW THE SPLIT, on `statement`'s pattern, because the
     signature column holds a fixed width and a paragraph sharing the row with
     it would be reading at about 170px on a phone. */
  if (v === 'payapp') {
    const rule = { marginTop: 24, borderTop: `${S.rule} solid ${T.text}` };
    const caption = {
      margin: '5px 0 0', fontFamily: FONT_HEAD, fontSize: 9.5, letterSpacing: 1.3,
      textTransform: 'uppercase', color: T.textMuted,
    };
    return shell(
      <div>
        <div style={{
          display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 18,
          borderTop: `${S.ruleStrong} solid ${T.text}`,
          borderBottom: `${S.rule} solid ${T.borderStrong}`,
          padding: '11px 0 12px',
        }}>
          <div style={{ minWidth: 0 }}>
            {eyebrow()}
            {title({ marginTop: 4, fontSize: 27, letterSpacing: 0.2 })}
          </div>
          <div style={{
            paddingLeft: 18, borderLeft: `${S.rule} solid ${T.borderStrong}`, minWidth: 172,
          }}>
            <p style={{
              margin: 0, fontFamily: FONT_HEAD, fontSize: 9.5, letterSpacing: 1.3,
              textTransform: 'uppercase', color: T.textMuted,
            }}>Certified for release by</p>
            <div style={rule} />
            <p style={caption}>Contractor · date</p>
            <div style={rule} />
            <p style={caption}>Architect · date</p>
          </div>
        </div>
        {lede({ marginTop: 11 })}
      </div>,
    );
  }

  /* A DRAW REQUEST. The form a builder sends to a lender to release the next
     stage payment, and the thing that separates it from every other document on
     this shelf is that the bank supplies it. A lender's form is set by a forms
     printer, and a forms printer heads each section with a SOLID BAR carrying
     the section name reversed out of it, so a borrower cannot mistake which part
     of the sheet is his.

     IT IS THE ONLY MASTHEAD HERE WHOSE TITLE IS PRINTED IN THE PAPER'S OWN INK
     KNOCKED OUT OF A SOLID. Two others are built on a block of color and
     neither reverses anything: `cardstock` fills a rounded box with the
     faceplate's quiet TINT and prints the shop's name into it in the ordinary
     text color, and `board` does the same behind a heavy frame. Every other
     shape here is rules, dots, an indent, a hole or a tear. Reversed type is the
     one device on this shelf that can only have come off a press.

     THE BAR SHRINK-WRAPS TO THE TITLE AND THE CORNERS ARE THE PAPER'S. A solid
     band running the full width with a soft corner is a web header, which is the
     tell this site retired a typeface over — so it is inline-block, it takes the
     faceplate's radius, and the faceplate that uses it is square. What runs the
     full width underneath is a hairline, which is what closes a printed block.

     IT MUST NOT LOOK LIKE `payapp`, AND THAT IS A CONSTRAINT RATHER THAN A
     PREFERENCE. These are the shelf's two construction documents and they sit in
     one gallery group, so meeting both in a session is the ordinary case. That
     one is split down its full height by a rule with a signature blank on the
     right, because half of a pay application is not the applicant's to fill in.
     This one has no split, no blank and no right-hand column at all: a draw
     request is entirely the builder's to complete, and what it waits on is a
     decision made somewhere else rather than a signature on the same sheet.

     THE TITLE'S FACE IS NOT OVERRIDDEN, only its color and its setting.
     check-handover.mjs asserts the tool's own h1 computes to its declared
     display face, and a masthead that reaches for a different one passes
     everything on the site and fails the delivered copy — the trap `report`,
     `folio` and `ownerstatement` each record. */
  if (v === 'drawform') {
    return shell(
      <div>
        <div style={{
          display: 'inline-block', background: A.brass, borderRadius: S.radiusSm,
          padding: '7px 15px 8px',
        }}>
          {title({
            margin: 0, fontSize: 20, letterSpacing: 1.6,
            textTransform: 'uppercase', color: A.accentInk,
          })}
        </div>
        {eyebrow({ marginTop: 10 })}
        <div style={{ marginTop: 9, borderTop: `${S.rule} solid ${T.borderStrong}` }} />
        {lede({ marginTop: 11 })}
      </div>,
    );
  }

  /* A TIME RECORD. The sheet is registered from its top-left corner — the week,
     the timekeeper and the rate all print against that corner, and the grid
     below hangs off it — so the head is an OPEN CORNER: one heavy rule across
     the top and one down the left, meeting, and stopping.

     IT IS THE ONLY MASTHEAD HERE BUILT FROM TWO RULES THAT MEET. Twenty-three
     of the others are free-standing horizontals or stacks of them; `payapp` and
     `ownerstatement` each run one vertical that divides a horizontal band
     without turning a corner; `tilltape` closes on a tear and `stickers` on a
     row of vertical ticks. The two that do turn corners CLOSE — `doortag` and
     `board` both draw a full border, which makes each of them a card. An open
     corner is not a container: it says where the sheet starts and leaves the
     rest of the block unbounded, which is exactly what a registration mark on a
     pre-printed form does and exactly what a card does not.

     THE LEDE DROPS OUTSIDE THE CORNER, flush left with the rule above it rather
     than indented with the title. What sits inside the corner is what the form
     prints; the paragraph under it is this page talking, and putting it inside
     would make the mark read as a frame around everything. */
  if (v === 'timesheet') {
    return shell(
      <div>
        <div style={{
          borderTop: `${S.ruleStrong} solid ${T.text}`,
          borderLeft: `${S.ruleStrong} solid ${T.text}`,
          padding: '10px 0 4px 16px',
        }}>
          {eyebrow()}
          {title({ marginTop: 4, fontSize: 25, letterSpacing: 0.2 })}
        </div>
        {lede({ marginTop: 11 })}
      </div>,
    );
  }

  /* A LEDGER CARD. The running account a shop keeps for one client, filed in a
     tray with every other client's — and the thing that makes one recognizable
     before a word on it is read is the INDEX TAB standing above its top edge,
     because a card in a set has to say which of the set it is.

     IT IS THE ONLY MASTHEAD HERE WHOSE SHAPE IS OPEN ONTO ANOTHER ELEMENT.
     Four others enclose something and every one of them closes: `advice` and
     `workorder` box a value on the right, `board` and `doortag` draw a full
     border and are therefore cards. This is three sides, and the missing fourth
     is the rule running unbroken underneath — the tab has no bottom because the
     card's top edge IS its bottom.

     AND IT IS NOT `housecard`, WHICH IS THE OTHER LABELED RULE HERE. That one
     writes its eyebrow INTO a gap in the divider, so the line breaks and the
     label belongs to the line. This line does not break: the tab sits on top of
     a rule that runs the full width behind it, so the label belongs to the
     SHEET rather than to the divider. A gap in a rule says "here is what this
     section is called"; a tab says "here is which one of these you are holding",
     which on a per-client account page is the whole of what the head has to do.

     THE TAB IS INSET FROM THE LEFT RATHER THAN FLUSH. A tab flush to the corner
     reads as a folder rather than as a card in a tray, and the inset is what
     leaves room for the next client's tab to sit further along. */
  if (v === 'ledgercard') {
    return shell(
      <div>
        <div style={{ display: 'flex', borderBottom: `${S.ruleStrong} solid ${T.text}` }}>
          <span aria-hidden="true" style={{ flex: '0 0 22px' }} />
          <span style={{
            minWidth: 0,
            background: T.surface,
            border: `${S.rule} solid ${T.borderStrong}`, borderBottom: 'none',
            borderTopLeftRadius: S.radiusSm, borderTopRightRadius: S.radiusSm,
            padding: '5px 13px 7px',
          }}>
            {eyebrow({ margin: 0 })}
          </span>
        </div>
        {title({ marginTop: 12, fontSize: 26 })}
        {lede({ marginTop: 10 })}
      </div>,
    );
  }

  /* A KENNEL RUN CARD. The card clipped to the door of the run, carrying the
     animal, the owner, the dates, the feeding and the meds — and the first
     thing printed on one is a square for a PHOTOGRAPH, because the person
     walking the row matches the animal to the card by face before a word on it
     is read.

     IT IS THE ONLY MASTHEAD HERE THAT RESERVES A FIELD FOR SOMETHING THAT IS
     NOT TEXT. Four others set a field beside the title and every one of them is
     filled with a value: `workorder` prints a pad number, `folio` an account
     total, `advice` who sent the money, `ownerstatement` what was paid out.
     `payapp` is the nearest, because its right-hand half is deliberately EMPTY
     — but a ruled line waiting for a countersignature is still a place where
     somebody writes, and this is a place where nobody writes at all.

     AND IT IS THE ONLY ONE WHERE THE RESERVED FIELD LEADS ON THE LEFT. Every
     one of those five hangs its field off the right-hand end of the head, which
     is where a form puts what gets keyed afterwards. A run card is matched
     before it is read, so the identifying block comes first — reading order is
     the argument, not the geometry.

     THE SQUARE IS LABELED RATHER THAN LEFT BLANK. An empty outline in a web
     page reads as an image that failed to load, which is the one thing this
     shape must not say; a form prints the word in the box for exactly the same
     reason. The label is set in the head face and stays small — it is print on
     the form, never a heading. */
  if (v === 'runcard') {
    return shell(
      <div>
        <div style={{
          display: 'flex', gap: 16, alignItems: 'flex-start',
          borderBottom: `${S.ruleStrong} solid ${T.text}`, paddingBottom: 12,
        }}>
          <span aria-hidden="true" style={{
            flex: '0 0 auto', width: 54, height: 54, boxSizing: 'border-box',
            border: `${S.rule} solid ${T.borderStrong}`, borderRadius: S.radiusSm,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: FONT_HEAD, fontSize: 8.5, letterSpacing: 1.2,
            textTransform: 'uppercase', color: T.textMuted,
          }}>Photo</span>
          <div style={{ minWidth: 0, flex: '1 1 240px' }}>
            {eyebrow({ margin: 0 })}
            {title({ marginTop: 4, fontSize: 27, letterSpacing: 0.2 })}
          </div>
        </div>
        {lede({ marginTop: 11 })}
      </div>,
    );
  }

  return shell(<div>{eyebrow()}{title()}{lede()}</div>);
}

/**
 * Problems, surfaced rather than absorbed.
 *
 * Every tool on this shelf produces a plausible-looking number from bad input if
 * nobody stops it, and a plausible wrong number is worse than an error. The
 * banner is red and it is above the answer on purpose.
 */
export function Problems({ heading, items }) {
  if (!items || items.length === 0) return null;
  return (
    <div role="alert" style={{
      background: A.badTint, border: `${S.rule} solid ${A.bad}`, borderRadius: S.radius,
      padding: '12px 14px', marginBottom: 14,
    }}>
      <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: A.bad, letterSpacing: 0.6, textTransform: 'uppercase', fontFamily: FONT_HEAD }}>
        {heading}
      </p>
      <ul style={{ margin: '7px 0 0', paddingLeft: 18, fontSize: 13, lineHeight: 1.6, fontFamily: FONT_BODY }}>
        {/* Indexed, not keyed by the text. Two people with the same name and no
            hours produce two identical sentences, and two blank rows do it
            immediately — duplicate keys in a list React re-renders on every
            keystroke. */}
        {items.map((t, i) => <li key={i}>{t}</li>)}
      </ul>
    </div>
  );
}

/**
 * WHAT THIS WILL NOT DO — a required panel, not an optional one.
 *
 * The last item is fixed and cannot be overridden by a caller, because "nothing
 * you type leaves this page" is the promise the whole shelf rests on and a tool
 * that forgot to say it would still be relying on it.
 */
export function WontDo({ items }) {
  return (
    <Panel title="What this will not do">
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.65, color: T.textSec }}>
        {items.map((t, i) => <li key={i}>{t}</li>)}
        <li>
          Nothing you type is sent anywhere, stored by anyone, or seen by me. It is arithmetic
          in your own browser.
        </li>
      </ul>
    </Panel>
  );
}

/* ============================================================================
   THE PRINTED GRAIN — pure inline CSS, every value a literal, computed here.

   NOT color-mix(). Chromium, Firefox and WebKit all support it today, so
   check-handover.mjs would drive all three and report clean — and the delivered
   file is opened YEARS later on a machine nobody can see. A browser that does
   not know color-mix drops the whole declaration, so the grain would simply not
   be there, with nothing anywhere to report it.

   NOT background-attachment: fixed. On iOS Safari a fixed-attachment background
   on a full-height element is broken and expensive, and the texture has no
   reason to be parallaxed.

   ⚠️ THE # IN AN SVG DATA URI MUST STAY %23. `url(#n)` inside a data: URI is
   read as a fragment, truncating it, and the whole background silently resolves
   to nothing. global.css already escapes it that way; a hand-copy that "tidies"
   the escape breaks it. check-handover.mjs's url() scan does NOT catch this — it
   only rejects urls that are not data:.
   ============================================================================ */
const rgba = (hex, a) => {
  const [r, g, b] = hex.replace('#', '').match(/../g).map((x) => parseInt(x, 16));
  return `rgba(${r},${g},${b},${a})`;
};

export function textureCss(f) {
  const a = f.textureAlpha || 0;
  if (!a || !f.texture || f.texture === 'none') return {};
  const ink = rgba(f.textureInk || '#000000', a);
  const s = f.textureScale || 24;

  switch (f.texture) {
    /* KRAFT — two speckle layers at incommensurate sizes, so no repeat is
       visible at any zoom. What a check pad looks like up close. */
    case 'kraft': return {
      backgroundImage:
        `radial-gradient(${ink} 0.5px, transparent 0.6px),`
        + `radial-gradient(${ink} 0.5px, transparent 0.6px)`,
      backgroundSize: `${s}px ${s}px, ${Math.round(s * 1.7)}px ${Math.round(s * 1.7)}px`,
      backgroundPosition: `0 0, ${Math.round(s * 0.6)}px ${Math.round(s * 0.8)}px`,
    };

    /* LEDGER — one horizontal rule per row, like an accounting pad. */
    case 'ledger': return {
      backgroundImage:
        `repeating-linear-gradient(to bottom, transparent 0, transparent ${s - 1}px, ${ink} ${s - 1}px, ${ink} ${s}px)`,
    };

    /* BOOK — the ledger rules plus one vertical margin line near the spine. The
       vertical is drawn first so the horizontals cross over it, which is the
       right order on real stock. */
    case 'book': return {
      backgroundImage:
        `linear-gradient(to right, transparent 0, transparent 45px, ${ink} 45px, ${ink} 46px, transparent 46px),`
        + `repeating-linear-gradient(to bottom, transparent 0, transparent ${s - 1}px, ${ink} ${s - 1}px, ${ink} ${s}px)`,
      backgroundRepeat: 'repeat-y, repeat',
      backgroundSize: '100% 100%, auto auto',
    };

    /* GRID — global.css's own .bg-grid recipe, ported inline with literal rgba
       rather than color-mix, for the reason at the top of this block. */
    case 'grid': return {
      backgroundImage:
        `linear-gradient(to right, ${ink} 1px, transparent 1px),`
        + `linear-gradient(to bottom, ${ink} 1px, transparent 1px)`,
      backgroundSize: `${s}px ${s}px`,
    };

    /* BANDS — greenbar continuous-form paper: two rows printed, two rows clear. */
    case 'bands': return {
      backgroundImage:
        `repeating-linear-gradient(to bottom, ${ink} 0, ${ink} ${s * 2}px, transparent ${s * 2}px, transparent ${s * 4}px)`,
    };

    /* LAID — vellum: fine chain lines across, coarser laid lines down. */
    case 'laid': return {
      backgroundImage:
        `repeating-linear-gradient(to bottom, ${ink} 0, ${ink} 1px, transparent 1px, transparent ${s}px),`
        + `repeating-linear-gradient(to right, ${ink} 0, ${ink} 1px, transparent 1px, transparent 27px)`,
    };

    /* CARBON — the diagonal smudge hatch of a carbonless order pad, and the only
       non-orthogonal texture on the shelf. That is most of why it reads as its
       own thing standing next to eight horizontal and vertical ones. */
    case 'carbon': return {
      backgroundImage:
        `repeating-linear-gradient(135deg, ${ink} 0, ${ink} 1px, transparent 1px, transparent ${s}px)`,
    };

    /* PUNCH — the binding holes down the margin of a spiral day book, which is
       what a market vendor's takings actually live in. THE ONLY RINGS ON THE
       SHELF: kraft and perf both use dots, but theirs are filled and under a
       pixel across, so a hollow ring at eight or nine pixels is a different
       mark rather than the same one bigger. It runs down ONE column at a fixed
       offset rather than tiling across, which nothing else here does either. */
    case 'punch': return {
      backgroundImage:
        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='" + s + "' height='" + s + "'%3E"
        + "%3Ccircle cx='" + Math.round(s / 2) + "' cy='" + Math.round(s / 2) + "' r='" + Math.round(s / 3)
        + "' fill='none' stroke='" + encodeURIComponent(ink) + "' stroke-width='1.5'/%3E%3C/svg%3E\")",
      backgroundRepeat: 'repeat-y',
      backgroundPosition: `${Math.round(s * 0.6)}px 0`,
      backgroundSize: `${s}px ${s}px`,
    };

    /* WAVE — the guilloche line printed across security stock, which is what a
       repair order is on in most shops. THE ONLY CURVE ON THE SHELF: every
       other fiber here is made of straight lines, orthogonal or diagonal, so a
       curve reads as a different KIND of printing rather than a different
       arrangement of the same one. An SVG tile for the same reason `dash` is —
       a gradient cannot bend. */
    case 'wave': return {
      backgroundImage:
        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='"
        + (s * 2) + "' height='" + s + "'%3E%3Cpath d='M0 " + Math.round(s / 2)
        + " q " + Math.round(s / 2) + " -" + Math.round(s / 3) + " " + s + " 0 t " + s + " 0'"
        + " fill='none' stroke='" + encodeURIComponent(ink) + "' stroke-width='1'/%3E%3C/svg%3E\")",
      backgroundSize: `${s * 2}px ${s}px`,
    };

    /* DASH — a route sheet on a clipboard, with a broken rule under every stop
       to tick down. ledger and book both rule solid across the page and perf's
       broken line runs the other way, so this is the only BROKEN HORIZONTAL
       here.

       DRAWN AS AN SVG TILE rather than a gradient, and that is forced rather
       than chosen: a CSS gradient varies along one axis only, so a dash needs
       the line to stop in x while the row spacing lives in y, and no single
       gradient can do both. `grain` already takes this route for its own
       reason. The rgba string is encoded because it carries commas. */
    case 'dash': return {
      backgroundImage:
        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='9' height='"
        + s + "'%3E%3Crect x='0' y='" + (s - 1) + "' width='4' height='1' fill='"
        + encodeURIComponent(ink) + "'/%3E%3C/svg%3E\")",
      backgroundSize: `9px ${s}px`,
    };

    /* COLUMNS — a settlement card ruled into money columns before anything is
       written on it, with the cells running tall. Vertical rules are the one
       direction nothing else here fills: laid runs its verticals fine and its
       horizontals finer, book runs a single margin line, grid runs square cells
       of equal weight, and bands is this idea lying down. */
    case 'columns': return {
      backgroundImage:
        `repeating-linear-gradient(to right, ${ink} 0, ${ink} 1.5px, transparent 1.5px, transparent ${s}px),`
        + `repeating-linear-gradient(to bottom, ${ink} 0, ${ink} 1px, transparent 1px, transparent ${Math.round(s * 3)}px)`,
    };

    /* PERF — a duplicate work-order form. The mark that makes one of these
       recognizable across a room is the vertical DASHED perforation you tear the
       customer's copy off along, and nothing else on the shelf runs a broken
       line down the page: book and laid both run solid verticals, grid runs a
       continuous one. The sparse pin-dots behind it are what a pad picks up
       going through a press. */
    case 'perf': return {
      backgroundImage:
        `repeating-linear-gradient(to bottom, ${ink} 0, ${ink} 3px, transparent 3px, transparent 8px),`
        + `radial-gradient(${ink} 0.6px, transparent 0.7px)`,
      backgroundRepeat: 'repeat-y, repeat',
      backgroundPosition: `${Math.round(s * 2.4)}px 0, 0 0`,
      backgroundSize: `1px 100%, ${s}px ${s}px`,
    };

    /* FOLIO — a guest bill. Its tell is the leader dots: a run of them carrying
       the eye from a line item across to the amount it cost, with a hairline
       ruled at the row pitch between one item and the next.

       NOTHING ELSE HERE RUNS DOTS ON A RHYTHM. `kraft` and `perf` both scatter
       dots and both tile SQUARE — the same pitch in x as in y — so they read as
       speckle in the stock rather than as marks somebody printed. This tile is
       narrow and tall, so the dots line up into a run across the page and
       appear once per row instead of filling it. `dash` is the other broken
       horizontal, and it is a RULE with gaps in it; a leader is round marks
       with nothing between them, which is a different object at any spacing.

       THE DOTS ALREADY SIT HALFWAY BETWEEN THE RULES and must not be nudged. A
       radial gradient centers its dot in its own tile, so a tile `s` tall puts
       the run at s/2 — exactly between the rule at 0 and the rule at s. Adding
       a backgroundPosition offset of s/2 to "center" it walks the whole run
       onto the rule, where it disappears with nothing anywhere reporting it. */
    case 'folio': {
      const rule = rgba(f.textureInk || '#000000', Math.min(1, a * 1.4));
      return {
        backgroundImage:
          /* 0.75px, NOT the 0.6px kraft and perf use. Those two are speckle in
             the stock and are meant to be felt rather than seen; a leader is a
             printed mark and has to READ. The first pass at 0.6 vanished
             entirely in the captured tile. */
          `radial-gradient(${ink} 0.75px, transparent 0.85px),`
          + `repeating-linear-gradient(to bottom, transparent 0, transparent ${s - 1}px, ${rule} ${s - 1}px, ${rule} ${s}px)`,
        backgroundSize: `7px ${s}px, auto auto`,
      };
    }

    /* TICKBOXES — a housekeeping card: a column of small empty squares down the
       left with a ruled row beside each one, waiting for a pencil.

       IT IS THE ONLY FIBER HERE THAT DRAWS A CLOSED SHAPE. Everything else is
       lines, dots, rings, a crease or a die-cut outline that never closes. A
       square that is meant to be filled is a different kind of mark — the paper
       is asking for something rather than recording it. */
    case 'tickboxes': {
      const box = rgba(f.textureInk || '#000000', Math.min(1, a * 1.7));
      /* THE TILE IS TWICE AS WIDE AS IT IS TALL, so the squares sit one per row
         rather than in a field of them. A first pass used a square tile and the
         page came back covered in boxes — a PATTERN rather than a ground, which
         is the line every recipe in this file has to walk and the one this shape
         crosses most easily, because a closed form reads far louder than a rule
         at the same alpha. Caught by looking at the captured tile. */
      return {
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='24'%3E"
          + `%3Crect x='4.5' y='7.5' width='9' height='9' fill='none' stroke='${box}' stroke-width='1'/%3E`
          + "%3C/svg%3E\"),"
          + `repeating-linear-gradient(to bottom, transparent 0, transparent ${s - 1}px, ${ink} ${s - 1}px, ${ink} ${s}px)`,
        backgroundSize: `${s * 2}px ${s}px, auto auto`,
      };
    }

    /* DENOMROWS — a bank deposit slip. Ruled rows for the denominations, and two
       verticals near the left splitting the COUNT column from the AMOUNT one.

       TWO VERTICALS, WHICH NOTHING ELSE HERE HAS. `book` runs one, at a margin.
       `perf` runs one, as a tear. A deposit slip's pair is not a margin and not
       a tear — it is a column boundary, and it sits where it does because the
       form was designed to be added up down a column rather than read across. */
    case 'denomrows': {
      const rule = rgba(f.textureInk || '#000000', Math.min(1, a * 1.9));
      return {
        backgroundImage:
          `linear-gradient(to right, transparent 0, transparent 74px, ${rule} 74px, ${rule} 75px, transparent 75px, transparent 128px, ${rule} 128px, ${rule} 129px, transparent 129px),`
          + `repeating-linear-gradient(to bottom, transparent 0, transparent ${s - 1}px, ${ink} ${s - 1}px, ${ink} ${s}px)`,
        backgroundRepeat: 'repeat-y, repeat',
        backgroundSize: '100% 100%, auto auto',
      };
    }

    /* RULEDCARD — a consignor contract card: the pale rules of an index card,
       and one heavier line near the top where the header is printed.

       `ledger` RULES EVERY ROW IDENTICALLY and this does not, which is the
       whole difference. A card is read from its header down, so the print puts
       one line where the header sits and treats everything below it as the
       same. Take that line away and you have lined paper. */
    case 'ruledcard': {
      const header = rgba(f.textureInk || '#000000', Math.min(1, a * 2.8));
      return {
        backgroundImage:
          `linear-gradient(to bottom, transparent 0, transparent 33px, ${header} 33px, ${header} 35px, transparent 35px),`
          + `repeating-linear-gradient(to bottom, transparent 0, transparent ${s - 1}px, ${ink} ${s - 1}px, ${ink} ${s}px)`,
        backgroundRepeat: 'repeat-x, repeat',
        backgroundSize: '100% 100%, auto auto',
      };
    }

    /* DIECUT — a sheet of peel-off price stickers, seen from the backing side:
       a grid of rounded cells with a dashed cut around each one and a gutter
       between them.

       IT IS THE ONLY FIBER HERE WITH A GAP IN IT. Every other recipe covers the
       whole sheet — rules, dots, noise, a crease. A label sheet is mostly
       untouched paper with an outline where each sticker will come away, and
       that negative space is what makes it recognizable rather than the line. */
    case 'diecut': return {
      backgroundImage:
        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='52'%3E"
        + `%3Crect x='3.5' y='3.5' width='89' height='45' rx='7' fill='none' stroke='${ink}' stroke-width='1' stroke-dasharray='4 3'/%3E`
        + "%3C/svg%3E\")",
      backgroundSize: `${s * 4}px ${Math.round(s * 2.2)}px`,
    };

    /* CORNERS — a make-ready punch list. The form is a run of BLOCKS, one per
       room, and the press marks each block by its four corners so that the part
       somebody has to write in stays clear of print.

       IT IS THE ONLY MARK HERE THAT DEFINES A REGION WITHOUT DRAWING ITS EDGE.
       `tickboxes` and `diecut` both CLOSE their outlines — a square and a
       rounded rect — and `grid` runs its lines edge to edge so every cell is
       bounded on all four sides by a continuous rule. These are four
       disconnected L-strokes with nothing between them and nothing joining
       them, which is a different object at any spacing: the eye assembles the
       block out of its corners rather than reading one that was printed.

       AN SVG TILE, FOR THE REASON `dash` AND `tearoff` ARE ONES. A CSS gradient
       varies along one axis, and an L needs to stop in both. The rgba string is
       encoded because it carries commas.

       THE MARK CARRIES ITS OWN INK AT 2.4x AND THE ALPHA STAYS LOW. Corner
       marks cover a couple of per cent of the sheet, so at the base alpha they
       would be invisible — that is the failure the orchid folio's leader dots
       recorded, an identity that clears every gate and is not on the page. The
       weight comes from the ink because compositeGround() reads the ALPHA, and
       the contrast ceiling reads compositeGround(). */
    case 'corners': {
      const mark = rgba(f.textureInk || '#000000', Math.min(1, a * 1.8));
      /* THE TILE IS A BLOCK, NOT A CELL — five across the page and rather wider
         than it is tall, so the corners land as a handful of marks per screen
         rather than as a field of them. A square tile at this scale reads as a
         pattern, which is the line `tickboxes` records crossing on its first
         pass and the one a closed-ish form crosses most easily.

         ⚠️ THE INSET IS THE WHOLE RECIPE AND IT IS NOT COSMETIC. At an inset of
         4px the first version put four L-marks — one from each of four
         neighboring tiles — within eight pixels of a shared tile corner, and
         they assembled into a four-armed pinwheel. The page came back covered
         in small crosses: a decorative confetti rather than a form, and the
         opposite of what an open corner is supposed to say. At 0.7 of the scale
         the marks of adjacent blocks sit a full tile-inset apart and read as
         what they are. Caught by looking at the captured tile; nothing about it
         is visible in the source, and every gate was green. */
      const w = s * 5;
      const h = Math.round(s * 3);
      const arm = Math.round(s * 0.42);
      const p = Math.round(s * 0.7);
      const x1 = w - p;
      const y1 = h - p;
      const d = `M${p} ${p + arm}V${p}H${p + arm}`
        + `M${x1 - arm} ${p}H${x1}V${p + arm}`
        + `M${x1} ${y1 - arm}V${y1}H${x1 - arm}`
        + `M${p + arm} ${y1}H${p}V${y1 - arm}`;
      return {
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='" + w
          + "' height='" + h + "'%3E%3Cpath d='" + d + "' fill='none' stroke='"
          + encodeURIComponent(mark) + "' stroke-width='1.5'/%3E%3C/svg%3E\")",
        backgroundSize: `${w}px ${h}px`,
      };
    }

    /* FOLD — a sign-in sheet after a week on a clipboard: ruled rows, and one
       crease straight down the middle where it was folded to fit in a bag.

       IT IS THE ONLY FIBER HERE THAT IS NOT PRINT. Every other recipe on this
       shelf is something the mill or the press put on the paper. This is what
       HANDLING does to it, which is the right identity for the one document
       that is filled in by twenty different people over five days.

       The crease is a soft band with a hard line inside it, because a fold
       catches light on both sides of the line and not only on it. */
    case 'fold': {
      const crease = rgba(f.textureInk || '#000000', Math.min(1, a * 2.6));
      return {
        backgroundImage:
          `linear-gradient(to right, transparent 46%, ${ink} 49.5%, ${crease} 50%, ${ink} 50.5%, transparent 54%),`
          + `repeating-linear-gradient(to bottom, transparent 0, transparent ${s - 1}px, ${ink} ${s - 1}px, ${ink} ${s}px)`,
        backgroundRepeat: 'repeat-y, repeat',
        backgroundSize: '100% 100%, auto auto',
      };
    }

    /* GUILLOCHE — the interference rosette printed onto a remittance advice and
       the draft attached to it. Two families of rings struck from different
       centers at incommensurate spacings; where they cross, the moiré is the
       pattern. It is the oldest anti-copying print there is and it exists for
       exactly one reason: it does not survive a photocopier.

       THE ONLY CURVED FIBER HERE. Every other recipe on this shelf is straight
       lines, dots or noise. A document whose whole job is to be hard to fake is
       the one that earns a curve. */
    case 'guilloche': {
      const wide = Math.round(s * 1.45);
      return {
        backgroundImage:
          `repeating-radial-gradient(circle at 22% 32%, transparent 0, transparent ${s - 1}px, ${ink} ${s - 1}px, ${ink} ${s}px),`
          + `repeating-radial-gradient(circle at 76% 70%, transparent 0, transparent ${wide - 1}px, ${ink} ${wide - 1}px, ${ink} ${wide}px)`,
        backgroundSize: `${s * 14}px ${s * 14}px`,
      };
    }

    /* HATCH — the fine diagonal security tint printed onto payroll and month-end
       report stock, so that a photocopy of one is visibly a photocopy. Two
       passes at opposing angles and incommensurate spacings, which is what stops
       it reading as one set of stripes.

       THE ONLY DIAGONAL FIBER ON THE SHELF. Everything else rules horizontally,
       vertically or both. A report that has to be recognizable as an original is
       the one document where the print deliberately runs off-axis, so the angle
       is the identity rather than decoration. */
    case 'hatch': return {
      backgroundImage:
        `repeating-linear-gradient(45deg, ${ink} 0, ${ink} 1px, transparent 1px, transparent ${s}px),`
        + `repeating-linear-gradient(-45deg, ${ink} 0, ${ink} 1px, transparent 1px, transparent ${Math.round(s * 1.6)}px)`,
    };

    /* SLOTS — a printed appointment day sheet. A light rule at every slot, a
       heavier one on the hour, and one vertical column rule where the times
       print down the left.

       THE HOUR RULE IS WHAT SEPARATES IT FROM `ledger`, which rules every row
       identically. A day sheet is not read top to bottom — it is read by finding
       the hour first and the quarter second, and the paper has to carry that or
       it is just lined paper. */
    case 'slots': {
      const hour = rgba(f.textureInk || '#000000', Math.min(1, a * 2.4));
      return {
        backgroundImage:
          `linear-gradient(to right, transparent 0, transparent 58px, ${hour} 58px, ${hour} 59px, transparent 59px),`
          + `repeating-linear-gradient(to bottom, ${hour} 0, ${hour} 1px, transparent 1px, transparent ${s * 4}px),`
          + `repeating-linear-gradient(to bottom, transparent 0, transparent ${s - 1}px, ${ink} ${s - 1}px, ${ink} ${s}px)`,
        backgroundRepeat: 'repeat-y, repeat, repeat',
        backgroundSize: '100% 100%, auto auto, auto auto',
      };
    }

    /* TEAROFF — a monthly owner statement with the payment advice at its foot.
       The body is ruled at the row pitch, and every seventh rule carries a comb
       of short VERTICAL ticks along it: the detach line where the advice comes
       away from the statement and goes back with the paying-in slip.

       NOTHING ELSE HERE BREAKS ACROSS THE PAGE. `perf` tears DOWN it, so its
       broken line runs the other way entirely. `dash` is the other broken
       horizontal, and it is a RULE WITH GAPS IN IT on every single row; this is
       a row of marks at ninety degrees to the tear, appearing once every seven
       rows, so the eye reads a boundary between two parts of one sheet rather
       than a texture covering it. `fold` is the only other page-scale
       interruption and it is vertical, continuous, and made by handling rather
       than by a press.

       AN SVG TILE FOR THE SAME REASON `dash` IS ONE. A CSS gradient varies along
       one axis, and this needs the tick to stop in x while its interval lives in
       y. The rgba string is encoded because it carries commas.

       THE TICK CARRIES ITS OWN INK AT 2.2x. A perforation is a printed mark that
       has to READ, where the body rules are stock that should only be felt — and
       the multiplier is where that weight comes from rather than the alpha,
       because compositeGround() reads the alpha and the contrast ceiling reads
       compositeGround(). */
    case 'tearoff': {
      const tick = rgba(f.textureInk || '#000000', Math.min(1, a * 2.2));
      /* SEVEN ROWS, so the tile is 7s tall and the tick lands just above the
         rule that closes the block — a comb sitting on a line, which is how a
         detach edge is actually printed. The tick is drawn at block-6 rather
         than block-1 so it cannot clip off the bottom of its own tile. */
      const block = s * 7;
      return {
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='7' height='"
          + block + "'%3E%3Crect x='3' y='" + (block - 6) + "' width='1' height='5' fill='"
          + encodeURIComponent(tick) + "'/%3E%3C/svg%3E\"),"
          + `repeating-linear-gradient(to bottom, transparent 0, transparent ${s - 1}px, ${ink} ${s - 1}px, ${ink} ${s}px)`,
        backgroundSize: `7px ${block}px, auto auto`,
      };
    }

    /* SCREEN — the halftone tint printed into the cells of a pay application
       that somebody else fills in. The trade applies for payment in one set of
       columns; the general contractor and the architect certify in another, and
       the certifying half is screened gray at the press so nobody writes in it.

       THE NEAREST RECIPES ARE `kraft` AND `perf`, AND BOTH ARE SPECKLE RATHER
       THAN PRINT. kraft lays two dot lattices at INCOMMENSURATE sizes precisely
       so they never register and no repeat is visible at any zoom; perf
       scatters sub-pixel pin-dots a pad picks up going through a press. Both are
       stock, and both are meant to be felt rather than seen. A halftone screen
       is the opposite of both: two lattices at the SAME pitch, offset by exactly
       half a tile in each axis, so they register into one rosette running at
       45 degrees — the angle a single-color screen is always struck at, because
       that is where the eye is least able to resolve its rows. And the dots are
       wide enough to close into a gray, which is the whole job: a screen is not
       texture in the paper, it is a cell somebody has shaded.

       THE MARKS COMPOSE ACROSS THE TILE BOUNDARY ON PURPOSE, and this is the
       one recipe here where that is true. `corners` had to be held a full inset
       off its own edges because the L-strokes of four neighboring tiles
       assembled into a pinwheel nobody drew. Here the assembly IS the drawing —
       a dot sits at the center of its tile and the offset layer's dot sits on
       the corner four tiles share — so the lattice a reader sees is the lattice
       this computes, and no second figure emerges at any scale.

       THE DOT CARRIES ITS OWN INK AT 2.4x AND THE ALPHA STAYS LOW. Dots at this
       pitch cover about a sixth of the sheet, so at the base alpha the screen
       would be a rumour: the orchid folio's leader-dot failure, an identity that
       clears every gate and is not on the page. The weight comes from the ink
       because compositeGround() reads the ALPHA, and the contrast ceiling reads
       compositeGround().

       ⚠️ THE DOT MUST STAY SMALL AGAINST ITS PITCH, and this is the whole
       difference between a screen and spotted wallpaper. A first pass drew
       1.3px dots on a 9px lattice and the captured tile came back covered in
       resolvable dots — a PATTERN rather than a tint, which is the line
       `tickboxes` records crossing and the one a repeating round mark crosses
       most easily. At 1px on a 6px lattice the marks sit close enough to fuse
       into a tone at reading distance and separate into a screen up close,
       which is what a screened cell does on paper. Caught by looking at the
       tile; every gate was green either way, because coverage barely moved and
       compositeGround() reads the alpha rather than the geometry. */
    case 'screen': {
      const dot = rgba(f.textureInk || '#000000', Math.min(1, a * 2.4));
      const half = Math.round(s / 2);
      return {
        backgroundImage:
          `radial-gradient(${dot} 1px, transparent 1.2px),`
          + `radial-gradient(${dot} 1px, transparent 1.2px)`,
        backgroundSize: `${s}px ${s}px, ${s}px ${s}px`,
        backgroundPosition: `0 0, ${half}px ${half}px`,
      };
    }

    /* LADDER — a draw request's schedule of values. Every one of these forms is
       printed with a narrow numbered column boxed off down the left, because the
       lender's inspector works the sheet stage by stage and initials against the
       line number rather than against the description. Two rails and a rung per
       row, and the whole of the rest of the sheet left clear for what somebody
       writes on it.

       IT IS THE ONLY FIBER HERE THAT LEAVES THE PAGE EMPTY. Every other recipe
       covers the sheet — rules, dots, noise, a hatch, a crease, a field of
       outlines. `diecut` is the nearest to an exception and it still tiles its
       cells across the whole width; the gap in it is between one sticker and the
       next, not between a printed column and the rest of the paper. Here about
       one twentieth of the sheet carries print and the remaining nineteen
       twentieths carry none, which is what a form ruled for a clerk actually
       looks like.

       IT IS ALSO NOT `punch` AND NOT `book`, the other two marks that run down
       one margin. `punch` draws hollow rings with nothing bounding them and no
       cross-marks at all — a binding rather than a field. `book` runs a single
       bare vertical and then rules the FULL width across it, so its margin line
       is a boundary inside a ruled page rather than the edge of a column. This
       is the only one where the rules stop AT the second rail, which is what
       makes the two verticals read as a column somebody writes numbers in.

       AN SVG TILE, FOR THE REASON `dash`, `tearoff` AND `corners` ARE ONES. A
       CSS gradient varies along one axis, and a rung has to stop in x while its
       interval lives in y. The rgba strings are encoded because they carry
       commas.

       THE RAILS CARRY THEIR OWN INK AT 2.2x. A column boundary is printed
       heavier than the line separators inside it on any real form, and that
       weight has to come from the ink rather than from the alpha, because
       compositeGround() reads the alpha and the contrast ceiling reads
       compositeGround() — the orchid folio's leader dots record what happens
       when a mark is left at the base alpha and quietly is not on the page.

       NOTHING COMPOSES ACROSS THE TILE BOUNDARY HERE and that is checked rather
       than assumed. The tile repeats in y ONLY, so the rails run continuously
       down the page as drawn and the rungs stack at exactly the row pitch. There
       is no second tile to the left or right for a mark to meet, which is the
       failure `corners` records — four neighboring tiles assembling into a
       pinwheel nobody drew. */
    case 'ladder': {
      const rail = rgba(f.textureInk || '#000000', Math.min(1, a * 2.2));
      const w = 76;
      const left = 19;
      const right = 63;
      return {
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='" + w
          + "' height='" + s + "'%3E"
          + "%3Crect x='" + left + "' y='0' width='1' height='" + s + "' fill='"
          + encodeURIComponent(rail) + "'/%3E"
          + "%3Crect x='" + right + "' y='0' width='1' height='" + s + "' fill='"
          + encodeURIComponent(rail) + "'/%3E"
          + "%3Crect x='" + left + "' y='" + (s - 1) + "' width='" + (right - left + 1)
          + "' height='1' fill='" + encodeURIComponent(ink) + "'/%3E"
          + "%3C/svg%3E\")",
        backgroundRepeat: 'repeat-y',
        backgroundSize: `${w}px ${s}px`,
      };
    }

    /* TENTHS — a time record ruled in six-minute increments. The body is ruled
       at the entry pitch, and every fifth rule carries the tenth-hour
       gradation the sheet is measured against: a run of short ticks with a
       longer one at each half hour.

       IT IS THE ONLY FIBER HERE THAT REPEATS ONE MARK AT TWO DIFFERENT
       LENGTHS, and that is the difference between a scale and a form. Six of
       these recipes vary a mark's WEIGHT — `slots` rules a heavier line on the
       hour, `ruledcard` prints one heavy line where the header sits, `columns`
       runs its verticals thicker than its horizontals — and weight is how a
       printed form shows HIERARCHY: this line matters more than that one. A
       measuring scale cannot use weight, because every graduation on it matters
       equally; it shows MAGNITUDE by length instead, which is why a ruler's
       marks are unequal and a ledger's rules are not. A timesheet is the one
       document on this shelf that records a continuous quantity read off a
       scale rather than a thing that happened, so it is the one that earns the
       graduation.

       IT IS NOT `tearoff`, WHICH IS THE OTHER COMB HERE. That one runs a row of
       ticks at ninety degrees to a full-width rule once every seven rows, and
       every tick on it is identical — because a perforation is uniform by
       definition, being a line somebody tears along. Nothing about it says how
       much of anything. Take the long marks out of this and it becomes that.

       AN SVG TILE, FOR THE REASON `dash`, `tearoff`, `corners` AND `ladder` ARE
       ONES. A CSS gradient varies along one axis, and a graduation has to stop
       in x while its interval lives in y — and the two tick lengths have to sit
       in one tile so the fifth mark cannot drift out of step with the other
       four. The rgba strings are encoded because they carry commas.

       THE TICKS CARRY THEIR OWN INK AT 2.2x AND THE ALPHA STAYS LOW. A
       graduation is a printed mark that has to READ where the body rules are
       stock that should only be felt, and the weight comes from the ink rather
       than the alpha because compositeGround() reads the alpha and the contrast
       ceiling reads compositeGround() — the orchid folio's leader dots record
       what happens to a mark left at the base alpha.

       NOTHING ASSEMBLES ACROSS THE TILE BOUNDARY, and it is checked rather than
       assumed. Each tick is a 1px vertical inside its own tile; the mark at
       x = 4 * step has its neighbor at the next tile's x = 0, exactly one step
       away, so the run reads at a single even pitch straight across the page
       with no closer pair anywhere. That is the failure `corners` records —
       four neighboring tiles assembling into a pinwheel nobody drew. */
    case 'tenths': {
      const grad = rgba(f.textureInk || '#000000', Math.min(1, a * 2.2));
      /* FIVE TENTHS TO THE TILE — half an hour — so the long mark lands once
         per tile and the short ones four times. The comb prints on every fifth
         rule rather than on all of them: a scale on a form is a reference
         printed at the block, not a ruler under every line, and a comb on every
         row at this pitch is wallpaper. That is the line `tickboxes` and
         `screen` both record crossing on their first pass. */
      const step = 8;
      const w = step * 5;
      const block = s * 5;
      const tick = (x, len) => `%3Crect x='${x}' y='${block - len - 1}' width='1' height='${len}' fill='${encodeURIComponent(grad)}'/%3E`;
      return {
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='" + w
          + "' height='" + block + "'%3E"
          + tick(0, 4) + tick(step, 4) + tick(step * 2, 4) + tick(step * 3, 4)
          + tick(step * 4, 9)
          + "%3C/svg%3E\"),"
          + `repeating-linear-gradient(to bottom, transparent 0, transparent ${s - 1}px, ${ink} ${s - 1}px, ${ink} ${s}px)`,
        backgroundSize: `${w}px ${block}px, auto auto`,
      };
    }

    /* DOUBLERULE — a running-account page. Body rules at the entry pitch, and
       every fifth one closed by a DOUBLE RULE: the same hairline drawn twice,
       three pixels apart.

       IT IS THE ONLY MARK HERE THAT REPEATS ITSELF RATHER THAN CHANGING, and
       that is the whole difference between this and `ledger`, which rules one
       identical line per row and says nothing about any of them. Six recipes on
       this shelf vary a mark's WEIGHT to show hierarchy — `slots` rules a
       heavier line on the hour, `ruledcard` prints one heavy line where the
       header sits — and `tenths` varies a mark's LENGTH to show magnitude.
       Neither is what a double rule does. In bookkeeping a doubled line is not
       a more important line: it means the account above it is CLOSED and
       nothing more goes under it. A thicker rule would say "read this one
       first" and would be a different statement entirely, which is why the two
       lines here carry the same ink at the same weight as every other rule on
       the page. Take one of them away and this becomes `ledger`.

       IT IS THE DOCUMENT'S OWN SUBJECT DRAWN INTO ITS STOCK. This tool is about
       what happens to unused hours when a period closes, and the close is the
       one mark a retainer ledger prints that a time sheet never does.

       PURE CSS RATHER THAN AN SVG TILE, and the reason is the one `tenths`
       gives from the other side. `dash`, `tearoff`, `corners`, `ladder` and
       `tenths` are SVGs because each varies along BOTH axes — a mark that has
       to stop in x while its interval lives in y. Nothing here varies in x at
       all: two gradients repeating down the page, the second at five times the
       first's period, and five is an exact multiple so the pair cannot drift
       out of phase with the rules it closes.

       NOTHING ASSEMBLES ACROSS A TILE BOUNDARY, because in y there is no
       boundary to assemble across: both layers repeat continuously from the top
       of the page. The nearest line above the pair sits a full row pitch away
       and the nearest below it a full row pitch away, so the only close pair
       anywhere is the one that was drawn. That is the failure `corners`
       records — four neighboring tiles making a pinwheel nobody drew. */
    case 'doublerule': {
      const block = s * 5;
      return {
        backgroundImage:
          `repeating-linear-gradient(to bottom, transparent 0, transparent ${block - 4}px, ${ink} ${block - 4}px, ${ink} ${block - 3}px, transparent ${block - 3}px, transparent ${block}px),`
          + `repeating-linear-gradient(to bottom, transparent 0, transparent ${s - 1}px, ${ink} ${s - 1}px, ${ink} ${s}px)`,
      };
    }

    /* SPLITCELLS — a kennel run card. The strip of day cells printed across it,
       each square ruled corner to corner so the morning goes in one triangle
       and the evening in the other, because everything on this document
       happens twice a day: fed, walked, medicated, checked.

       IT IS THE ONLY MARK HERE THAT SUBDIVIDES A CELL. `tickboxes` is the
       nearest recipe on the shelf and is a genuinely different object: an empty
       square is a form asking for ONE answer, and it repeats down a margin, one
       per ruled row, the way a housekeeping card asks whether a room was done.
       A square with a rule through it asks for TWO answers about one thing at
       one place, which is a different question and not the same question drawn
       smaller — take the diagonal out and this becomes that. `diecut` and
       `grid` are the other two closed shapes here: diecut's rounded rects are
       cut lines with gutters between them and nothing inside, and grid's cells
       are bounded by continuous rules running edge to edge rather than by an
       outline of their own.

       THE CELLS RUN ACROSS AND NOT DOWN, once per band of rules rather than
       once per row. A run card carries one cell per DAY of the stay, so the
       strip reads left to right the way the stay does — which is also what
       keeps a closed shape from becoming a field of them, the line `tickboxes`
       records crossing on its first pass and the one a closed form crosses most
       easily.

       AN SVG TILE, FOR THE REASON `dash`, `tearoff`, `corners`, `ladder` AND
       `tenths` ARE ONES. A CSS gradient varies along one axis, and both the box
       and the rule inside it have to stop in x and in y. The rgba string is
       encoded because it carries commas.

       THE CELL CARRIES ITS OWN INK AT 1.9x AND THE ALPHA STAYS LOW. A printed
       day cell is a mark that has to READ where the body rules are stock that
       should only be felt, and the weight comes from the ink rather than the
       alpha because compositeGround() reads the alpha and the contrast ceiling
       reads compositeGround() — the orchid folio's leader dots record what
       happens to a mark left at the base alpha.

       NOTHING ASSEMBLES ACROSS THE TILE BOUNDARY, and it is arithmetic rather
       than a hope. The tile is twice the scale wide and four times it tall; the
       cell is 12px on a side sitting a third of the way in, so the nearest cell
       to the left or right is a clear tile-width-less-a-cell away and the
       nearest above or below is three whole row pitches away. There is no pair
       of marks anywhere closer together than the pair that was drawn, which is
       the failure `corners` records — four neighboring tiles assembling into a
       pinwheel nobody drew. */
    case 'splitcells': {
      const cell = rgba(f.textureInk || '#000000', Math.min(1, a * 1.9));
      const w = s * 2;
      const band = s * 4;
      const size = 12;
      /* THE CELL SITS BETWEEN THE LAST TWO RULES OF ITS BAND rather than on
         one. A day cell on a real card is printed inside a row, not across its
         boundary, and a box straddling a rule reads as a defect in the rule. */
      const x = Math.round(s * 0.7);
      const y = band - s + Math.round((s - size) / 2);
      return {
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='" + w
          + "' height='" + band + "'%3E"
          + "%3Crect x='" + (x + 0.5) + "' y='" + (y + 0.5) + "' width='" + size + "' height='" + size
          + "' fill='none' stroke='" + encodeURIComponent(cell) + "' stroke-width='1'/%3E"
          + "%3Cpath d='M" + (x + 0.5) + " " + (y + size + 0.5) + "L" + (x + size + 0.5) + " " + (y + 0.5)
          + "' stroke='" + encodeURIComponent(cell) + "' stroke-width='1'/%3E"
          + "%3C/svg%3E\"),"
          + `repeating-linear-gradient(to bottom, transparent 0, transparent ${s - 1}px, ${ink} ${s - 1}px, ${ink} ${s}px)`,
        backgroundSize: `${w}px ${band}px, auto auto`,
      };
    }

    /* GRAIN — the site's own feTurbulence noise, which is ACHROMATIC by
       construction. textureInk is ignored here, and that is exactly why
       themes.js requires it to be #000000 for this recipe: compositeGround()
       would otherwise compute a lighter ground than the browser paints, and a
       gate reporting a nicer number than reality is worse than no gate. */
    case 'grain': return {
      backgroundImage:
        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E"
        + "%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='3' "
        + "stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' "
        + `opacity='${a}'/%3E%3C/svg%3E")`,
      backgroundSize: '140px 140px',
    };

    default: return {};
  }
}

/* THE HEAD'S FACE IS DERIVED FROM ITS SHAPE, never carried as its own key. A
   stamped or leadered label is a data-face job; a filled bar or a ruled title is
   a display-face job; small caps belong to the reading face. One fewer field to
   keep in step, and no faceplate can name a combination that makes no sense. */
const headFace = (f) =>
  ({ caps: f.fontBody, tab: f.fontDisplay, fill: f.fontDisplay, rule: f.fontDisplay })[f.head] || f.fontData;

export const page = {
  /* backgroundColor, NEVER THE `background` SHORTHAND, and this is load-bearing.
     pageFor spreads this object and then adds backgroundImage for the tool's own
     grain. React writes style keys in insertion order, so a shorthand
     `background` appearing after backgroundImage resets it to none — silently,
     with a green build, a green gate and a green smoke test, because nothing in
     this repo reads a rendered pixel. Removing the shorthand removes the hazard
     rather than documenting it. */
  backgroundColor: T.bg, color: T.text, minHeight: '100vh',
  fontFamily: FONT_BODY, fontSize: 14, padding: S.pagePad,
};

/**
 * THE FACEPLATE, applied. Spread this into a tool's root element and every
 * `T.*`, `A.*`, `S.*` and `FONT_*` beneath it resolves to that tool's own paper.
 *
 *   <div style={pageFor('crew-share')} data-demo="crew-share">
 *
 * One line per tool, and nothing else in nine islands had to change.
 */
export function pageFor(toolId, extra) {
  const f = themeFor(toolId);
  FACE_CTX.current = f;
  return {
    ...page,
    /* AFTER the spread — see the shorthand note on `page` above. */
    ...textureCss(f),
    /* THE BOARD'S FRAME, and only one faceplate carries it. At full page height
       it reads as the edge of a board on a wall; the same color as a 10px bar
       on a header box would have read as the generic accent tab this site
       already retired a typeface for resembling. */
    ...(f.edgeBar ? { borderLeft: `6px solid ${f.edgeBar}` } : {}),
    '--aiq-bg': f.bg,
    '--aiq-surface': f.surface,
    '--aiq-surface-alt': f.surfaceAlt,
    '--aiq-border': f.border,
    '--aiq-border-strong': f.borderStrong,
    '--aiq-text': f.text,
    '--aiq-text-sec': f.textSec,
    '--aiq-text-muted': f.textMuted,
    '--aiq-accent': f.accent,
    '--aiq-accent-ink': f.accentInk,
    '--aiq-tint': f.tint,
    '--aiq-ring': f.ring,
    '--aiq-good': f.good,
    '--aiq-warn': f.warn,
    '--aiq-bad': f.bad,
    /* THE THREE WASHES STAY SHARED ACROSS ALL NINE, which is the rule this file
       already stated and is worth keeping: a problem should look the same urgent
       red in every tool, because the faceplate says which trade you are in and
       never how bad something is. They come from BASE rather than a literal
       here, so the contrast gate can see them. */
    '--aiq-good-tint': f.goodTint,
    '--aiq-warn-tint': f.warnTint,
    '--aiq-bad-tint': f.badTint,
    /* TYPE. --aiq-font-body and --aiq-font-data were LITERAL Inter and Plex Mono
       strings here, which is why nine tools read in the same two voices however
       their palettes moved. They are the faceplate's now, and --aiq-font-head is
       derived from the head shape rather than carried. */
    '--aiq-font-display': f.fontDisplay,
    '--aiq-font-body': f.fontBody,
    '--aiq-font-data': f.fontData,
    '--aiq-font-head': headFace(f),
    '--aiq-pad': f.scale.pad + 'px',
    '--aiq-gap': f.scale.gap + 'px',
    '--aiq-row': f.scale.row,
    '--aiq-label-size': f.scale.label + 'px',
    '--aiq-body-size': f.scale.body + 'px',
    '--aiq-lead': String(f.scale.lead),
    '--aiq-page-pad': f.scale.pagePad,
    /* THE EDGE. Every one of these was a literal repeated across the kit. */
    '--aiq-radius': f.radius + 'px',
    '--aiq-radius-sm': f.radiusSm + 'px',
    '--aiq-rule': f.rule + 'px',
    '--aiq-rule-strong': f.ruleStrong + 'px',
    ...extra,
  };
}

/**
 * THE HEADLINE READOUT — the one thing a tool exists to tell you, at the top.
 *
 * WHY IT WAS ADDED. Every answer on this shelf was reachable only by reading
 * down a panel, so nine tools opened on a wall of inputs and a visitor had to
 * work out what the tool was FOR. Review Autopilot opens on a strip of figures
 * and reads as a product because of it. This is that strip.
 *
 * Each item is `{ label, value, note?, tone? }`. `tone` is 'good' | 'warn' |
 * 'bad' and is the ONLY thing here allowed to color a number, because a figure
 * tinted by its own faceplate would be decoration reading as judgment.
 *
 * A null or undefined `value` renders an em dash rather than a zero. That is the
 * honesty contract in the furniture: a figure the tool cannot work out must not
 * look like a figure that came out at nothing.
 */
/**
 * THE HEADLINE READOUT — four shapes, because four different questions.
 *
 * Every tool passes the same `{ label, value, note?, tone? }` array; the SHAPE
 * is read from the faceplate, so all nine call sites stayed as they were.
 *
 *   strip    four equal cells       — when the answer is a set of figures
 *   total    a receipt foot          — when the answer is one sum that must
 *                                      balance, with the working above it
 *   hero     one number, very large  — when the answer is a count you act on
 *   compare  owed beside paid        — when the answer is a difference, and
 *                                      the two sides must be seen together
 *
 * `tone` ('good' | 'warn' | 'bad') is the ONLY thing allowed to color a figure.
 * A number tinted by its own faceplate would be decoration reading as judgment.
 *
 * A null value renders an em dash, never a zero. That is the honesty contract in
 * the furniture: a figure the tool cannot work out must not look like a figure
 * that came out at nothing.
 */
export function Readout({ items, shape }) {
  if (!items || items.length === 0) return null;
  const v = shape || (FACE_CTX.current && FACE_CTX.current.readout) || 'strip';
  const tones = { good: A.good, warn: A.warn, bad: A.bad };
  const colorFor = (it) => (it.tone ? tones[it.tone] : T.text);
  const label = (extra = {}) => ({
    margin: 0, fontFamily: FONT_HEAD, fontSize: 10, letterSpacing: 1.1,
    textTransform: 'uppercase', color: T.textMuted, ...extra,
  });
  const dash = (it) => (it.value == null ? '\u2014' : it.value);

  if (v === 'hero') {
    const [lead, ...rest] = items;
    /* THE `auto` TRACK IS WHY THIS BROKE ON A PHONE. It sizes to its content,
       and its content is a 58px figure — so at 390px it took 328 of the 346
       available and the second track resolved to ZERO. The 120px cells inside
       that track then hung off the side of the page, where overflow-x: clip cut
       them off rather than letting anybody scroll to them. Six tools showed it.
       The class collapses both tracks to one below 760px; above that the
       rendering is unchanged. */
    return (
      <div className="aiq-hero" style={{
        marginBottom: S.gap, paddingBottom: 12,
        borderBottom: `${S.rule} solid ${T.border}`,
      }}>
        <div className="aiq-hero-lead" style={{ paddingRight: 20, borderRight: `${S.rule} solid ${T.border}` }}>
          <p style={label()}>{lead.label}</p>
          <p style={{
            margin: '2px 0 0', fontFamily: FONT_DISPLAY, fontSize: 58, fontWeight: 600,
            lineHeight: 1, letterSpacing: -2, color: colorFor(lead),
          }}>{dash(lead)}</p>
          {lead.note && <p style={{ margin: '4px 0 0', fontSize: 12, color: T.textMuted }}>{lead.note}</p>}
        </div>
        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}>
          {rest.map((it, i) => (
            <div key={i}>
              <p style={label({ fontSize: 9.5 })}>{it.label}</p>
              <p style={{
                margin: '2px 0 0', fontFamily: FONT_DATA, fontSize: 18, fontWeight: 600,
                color: colorFor(it),
              }}>{dash(it)}</p>
              {it.note && <p style={{ margin: '2px 0 0', fontSize: 11, color: T.textMuted, lineHeight: 1.4 }}>{it.note}</p>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (v === 'total') {
    const foot = items[items.length - 1];
    const above = items.slice(0, -1);
    return (
      <div style={{ maxWidth: 560, margin: `0 auto ${S.gap}`, fontFamily: FONT_DATA }}>
        {above.map((it, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between', gap: 14,
            padding: '5px 0', borderBottom: `1px dotted ${T.border}`,
          }}>
            <span style={{ fontSize: 12, color: T.textSec }}>
              {it.label}
              {it.note && <span style={{ color: T.textMuted }}>{'  '}{it.note}</span>}
            </span>
            <strong style={{ fontSize: 14, color: colorFor(it) }}>{dash(it)}</strong>
          </div>
        ))}
        <div style={{
          display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'baseline',
          borderTop: `${S.ruleStrong} solid ${T.text}`, borderBottom: `${S.ruleStrong} solid ${T.text}`,
          marginTop: 6, padding: '8px 0',
        }}>
          <span style={label({ letterSpacing: 1.6 })}>{foot.label}</span>
          <strong style={{ fontSize: 20, color: colorFor(foot) }}>{dash(foot)}</strong>
        </div>
        {foot.note && (
          <p style={{ margin: '6px 0 0', fontSize: 11.5, color: T.textMuted, textAlign: 'right' }}>{foot.note}</p>
        )}
      </div>
    );
  }

  if (v === 'compare') {
    const [owed, paid, diff, ...rest] = items;
    return (
      <div style={{ marginBottom: S.gap }}>
        <div style={{
          display: 'grid', gap: 1, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          background: T.borderStrong, border: `${S.ruleStrong} solid ${T.borderStrong}`, borderRadius: S.radiusSm, overflow: 'hidden',
        }}>
          {[owed, paid].filter(Boolean).map((it, i) => (
            <div key={i} style={{ background: T.surface, padding: `12px ${S.pad}` }}>
              <p style={label()}>{it.label}</p>
              <p style={{ margin: '3px 0 0', fontFamily: FONT_DATA, fontSize: 26, fontWeight: 600, color: colorFor(it) }}>{dash(it)}</p>
              {it.note && <p style={{ margin: '3px 0 0', fontSize: 11.5, color: T.textMuted }}>{it.note}</p>}
            </div>
          ))}
          {diff && (
            <div style={{ background: A.tint, padding: `12px ${S.pad}` }}>
              <p style={label()}>{diff.label}</p>
              <p style={{ margin: '3px 0 0', fontFamily: FONT_DATA, fontSize: 26, fontWeight: 700, color: colorFor(diff) }}>{dash(diff)}</p>
              {diff.note && <p style={{ margin: '3px 0 0', fontSize: 11.5, color: T.textMuted }}>{diff.note}</p>}
            </div>
          )}
        </div>
        {rest.length > 0 && (
          <p style={{ margin: '7px 0 0', fontSize: 12, color: T.textMuted }}>
            {rest.map((it) => `${it.label}: ${it.value == null ? '\u2014' : it.value}`).join('  ·  ')}
          </p>
        )}
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid', gap: 1, gridTemplateColumns: 'repeat(auto-fit, minmax(158px, 1fr))',
      background: T.border, border: `${S.rule} solid ${T.border}`, borderRadius: S.radius,
      overflow: 'hidden', marginBottom: S.gap,
    }}>
      {items.map((it, i) => (
        <div key={i} style={{ background: T.surface, padding: `11px ${S.pad}` }}>
          <p style={label()}>{it.label}</p>
          <p style={{
            margin: '4px 0 0', fontFamily: FONT_DATA, fontSize: 21, fontWeight: 600,
            letterSpacing: -0.4, lineHeight: 1.15, color: colorFor(it),
          }}>{dash(it)}</p>
          {it.note && <p style={{ margin: '3px 0 0', fontSize: 11.5, lineHeight: 1.45, color: T.textMuted }}>{it.note}</p>}
        </div>
      ))}
    </div>
  );
}

/* `Identity` LIVED HERE AND WAS RENDERED BY NOTHING. All nine tools imported it;
   not one placed it. ToolHeader's eyebrow already prints house · town · occasion,
   which is the whole of what it drew. Deleted 2026-08-26 along with the nine
   dead import entries — dead code that every file references reads as a
   component somebody forgot to use, and costs a search every time. */
export const wrap = { maxWidth: 1240, margin: '0 auto' };
/* THE TABLE, AND THE DENSITY AXIS THAT NEVER REACHED IT. `padding` was the
   literal '7px 6px' / '6px 6px' here while pageFor wrote --aiq-row from the
   faceplate and NOTHING read it. So a `tight` tool and an `airy` tool had
   identical row heights, which is most of why the density axis was invisible.

   fontVariantNumeric: 'tabular-nums' IS REQUIRED, not decorative. Measured
   2026-08-26: Inter's digits drift 84.8px over ten characters and Rubik's 83.2px
   until that feature is switched on. Plex Mono ignores it harmlessly. Without
   it, any tool whose figure face is not mono has a money column that does not
   line up — and nothing anywhere renders an error when that happens. */
export const th = { textAlign: 'left', padding: S.row, fontSize: S.label, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: T.textSec, fontFamily: FONT_HEAD, borderBottom: `${S.rule} solid ${T.border}`, whiteSpace: 'nowrap' };
export const thN = { ...th, textAlign: 'right' };
export const td = { padding: S.row, borderBottom: `${S.rule} solid ${T.border}`, fontSize: S.body };
export const tdN = { ...td, textAlign: 'right', fontFamily: FONT_DATA, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' };

/** The xlsx export path, lazily imported so its chunk stays off first paint. */
export async function exportRows(filename, sheetName, rows, widths) {
  const XLSX = await import('xlsx');
  const ws = XLSX.utils.json_to_sheet(rows);
  if (widths) ws['!cols'] = widths.map((wch) => ({ wch }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}
