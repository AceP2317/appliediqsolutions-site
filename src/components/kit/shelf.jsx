// ============================================================================
// THE SHELF KIT — the parts every local-business tool needs, written once.
//
// EXTRACTED, NOT DESIGNED UP FRONT. The Tip-Out Sheet and the Bar Count Sheet
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
// nine islands, by hand — a large diff with no test that can see a colour.
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
   it would be a nine-file diff for zero behaviour change. The comment is the
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
/* THE AXIS THE COLOUR MECHANISM COULD NOT REACH. These were plain string
   literals while every colour above them was a var(), so pageFor could re-theme
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
   about the TABLE and it is honoured: td and tdN below take FONT_DATA, and Cell
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
   why nine tools had one silhouette however their colours moved. */
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
  /* AN INVOICE'S SECTION HEADING, which is not coloured and never was. */
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
 * WHY IT IS SHAPED AND NOT JUST COLOURED. Nine tools sharing one header read as
 * one tool nine times however the accent is set. A bar tab, a boat's settlement
 * sheet and a yard's storm board are three different KINDS of document before
 * they are three different colours, and a person recognises the kind first.
 *
 * The variant is read from the tool's faceplate, so all nine call sites stayed
 * exactly as they were.
 *
 *   check       a register slip — centred, ruled top and bottom, mono
 *   stocksheet  a count sheet — name left, heavy rule under, tight
 *   roster      a week's board — name left, the week's dates as an eyebrow
 *   ledger      a settlement — heavy top rule, the boat's name set large
 *   letterhead  an invoice — business left, meta right-aligned, formal
 *   board       an operations banner — full width, tinted, high contrast
 *   statement   a reconciliation — two columns, "against your own card"
 *   clinical    a practice's list — calm, generous, nothing shouting
 *   orderpad    a supplier pad — name left with a live count beside it
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
     recognisably the same object wherever a visitor meets it. */
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
     everything above it stayed centred. An inline-level box still obeys the
     parent's text alignment. */
  const footer = (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      {strip}{saver}
    </span>
  );

  const shell = (inner, extra = {}) => (
    <header style={{ maxWidth: 1240, margin: '0 auto 16px', ...extra }}>{inner}{footer}</header>
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
     colour; this one is built out of where it sits. */
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
     this is the only one where the shop's name sits on a block of colour.
     Deliberately quiet colour — the faceplate's tint, not its accent. */
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
     single stacked column, centred or left.

     No accent anywhere in it. A pre-printed form is printed in one ink, and the
     colour on this faceplate is spent on the one thing that matters on a quote,
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
     coloured bar down one side of a card, which is the single most recognisable
     tell of a generated interface, and this site already retired a typeface for
     being one. It is an EVEN HEAVY FRAME now, which is what a real board on a
     wall actually has, and the accent it lost here it gains at full page height:
     this faceplate is the one carrying `edgeBar`, so the colour still runs down
     the left of the page as structure rather than as an ornament on a box.

     A.accent does not exist — the accent slot is A.brass, and a `||` fallback
     would have silently drawn the wrong colour. A.ring is the faceplate's own
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
       other fibre here is made of straight lines, orthogonal or diagonal, so a
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
       recognisable across a room is the vertical DASHED perforation you tear the
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
       it reads as the edge of a board on a wall; the same colour as a 10px bar
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
 * 'bad' and is the ONLY thing here allowed to colour a number, because a figure
 * tinted by its own faceplate would be decoration reading as judgement.
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
 * `tone` ('good' | 'warn' | 'bad') is the ONLY thing allowed to colour a figure.
 * A number tinted by its own faceplate would be decoration reading as judgement.
 *
 * A null value renders an em dash, never a zero. That is the honesty contract in
 * the furniture: a figure the tool cannot work out must not look like a figure
 * that came out at nothing.
 */
export function Readout({ items, shape }) {
  if (!items || items.length === 0) return null;
  const v = shape || (FACE_CTX.current && FACE_CTX.current.readout) || 'strip';
  const tones = { good: A.good, warn: A.warn, bad: A.bad };
  const colourFor = (it) => (it.tone ? tones[it.tone] : T.text);
  const label = (extra = {}) => ({
    margin: 0, fontFamily: FONT_HEAD, fontSize: 10, letterSpacing: 1.1,
    textTransform: 'uppercase', color: T.textMuted, ...extra,
  });
  const dash = (it) => (it.value == null ? '\u2014' : it.value);

  if (v === 'hero') {
    const [lead, ...rest] = items;
    return (
      <div style={{
        display: 'grid', gap: S.gap, gridTemplateColumns: 'auto minmax(0, 1fr)',
        alignItems: 'center', marginBottom: S.gap, paddingBottom: 12,
        borderBottom: `${S.rule} solid ${T.border}`,
      }}>
        <div style={{ paddingRight: 20, borderRight: `${S.rule} solid ${T.border}` }}>
          <p style={label()}>{lead.label}</p>
          <p style={{
            margin: '2px 0 0', fontFamily: FONT_DISPLAY, fontSize: 58, fontWeight: 600,
            lineHeight: 1, letterSpacing: -2, color: colourFor(lead),
          }}>{dash(lead)}</p>
          {lead.note && <p style={{ margin: '4px 0 0', fontSize: 12, color: T.textMuted }}>{lead.note}</p>}
        </div>
        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}>
          {rest.map((it, i) => (
            <div key={i}>
              <p style={label({ fontSize: 9.5 })}>{it.label}</p>
              <p style={{
                margin: '2px 0 0', fontFamily: FONT_DATA, fontSize: 18, fontWeight: 600,
                color: colourFor(it),
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
            <strong style={{ fontSize: 14, color: colourFor(it) }}>{dash(it)}</strong>
          </div>
        ))}
        <div style={{
          display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'baseline',
          borderTop: `${S.ruleStrong} solid ${T.text}`, borderBottom: `${S.ruleStrong} solid ${T.text}`,
          marginTop: 6, padding: '8px 0',
        }}>
          <span style={label({ letterSpacing: 1.6 })}>{foot.label}</span>
          <strong style={{ fontSize: 20, color: colourFor(foot) }}>{dash(foot)}</strong>
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
              <p style={{ margin: '3px 0 0', fontFamily: FONT_DATA, fontSize: 26, fontWeight: 600, color: colourFor(it) }}>{dash(it)}</p>
              {it.note && <p style={{ margin: '3px 0 0', fontSize: 11.5, color: T.textMuted }}>{it.note}</p>}
            </div>
          ))}
          {diff && (
            <div style={{ background: A.tint, padding: `12px ${S.pad}` }}>
              <p style={label()}>{diff.label}</p>
              <p style={{ margin: '3px 0 0', fontFamily: FONT_DATA, fontSize: 26, fontWeight: 700, color: colourFor(diff) }}>{dash(diff)}</p>
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
            letterSpacing: -0.4, lineHeight: 1.15, color: colourFor(it),
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
