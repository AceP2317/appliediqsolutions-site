/* THE HOUSE FRAME FOR THE FACTORY DEMOS — the pieces every one of the seven
   shares, so the next change lands once rather than seven times.

   Ported from dev/login-starter/components/house/ on 2026-09-23, when Ian
   brought the seven under the house conventions MD04 set that day
   (tool-conventions references/house-look.md). What the template carries for a
   gated app and these public demos do not is left out on purpose: there is no
   sign-in, so no access page, no "signed in as", no sign-out, and nothing to
   install. Where the header's access controls would sit, a chip says what this
   is — a demo on invented data — which is the honest version of the same slot.

   WHAT A TOOL GETS FROM HERE
     HouseFrame      the root: palette properties for the mode in force, the
                     house CSS, the header, the footer, the help layer
     useNorthpoint   { mode, hex } for anything that needs a real color value
                     (a chart library draws SVG attributes, which cannot read var())
     NoticeBanner    the one way a screen reports something — never a pop-up
     ConfirmButton   ask first, in the page, naming the effect (two tiers)
     Help / HelpLayer  the "?" mark, shown on hover AND on keyboard focus
     AnswerCards / AnswerCard  a figure with one sentence saying what it means
     HowItWorks      folded, at the top, each point led by a bold sentence
     ExportPair      the full list (filled) and what is on screen, with counts
     Legend, Dot, Pill  status, where green and red mean status and nothing else
     pinColumns      keeps every column that names a row in view while the grid
                     scrolls sideways

   NOTHING HERE PAINTS A HEX VALUE. Every color is a --np-* property the root
   receives from northpointVars(); the mode switch swaps that one object. */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { northpointVars, northpointHex, MODES, DEFAULT_MODE } from "./industrial.js";
import { HOUSE_CSS } from "./house-css.js";
import { renderManual, manualDocument } from "./house-manual.js";
import { BYLINE } from "./house-export.js";

/* The build stamp, written in by astro.config.mjs at build time. A copy running
   anywhere else — a Drive master opened on its own — says "unstamped build",
   because a blank stamp would read like a current one. */
/* global __NP_BUILD_STAMP__ */
const BUILD_STAMP = typeof __NP_BUILD_STAMP__ !== "undefined" ? __NP_BUILD_STAMP__ : "unstamped build";

/* ONE KEY FOR ALL SEVEN, so a visitor who picks light on one demo finds the
   next one light too. Read through try/catch — storage throws in a private
   window — and MEMBERSHIP-TESTED, because a stored value naming a mode that no
   longer exists would otherwise resolve every token to nothing. */
const MODE_KEY = "np-mode";
function readMode() {
  try {
    const v = window.localStorage.getItem(MODE_KEY);
    return MODES.includes(v) ? v : DEFAULT_MODE;
  } catch {
    return DEFAULT_MODE;
  }
}
function writeMode(v) {
  try { window.localStorage.setItem(MODE_KEY, v); } catch { /* a private window keeps the choice for this page only */ }
}

const ModeCtx = createContext({ mode: DEFAULT_MODE, hex: null, setMode: () => {} });
/** The mode in force and its resolved hex values, for code that cannot use var(). */
export const useNorthpoint = () => useContext(ModeCtx);

/* ── Help: one explanation drawn in a fixed layer, so a scrolling grid can never
      clip it. Hover shows it and so does keyboard focus (house rule). ── */
const TipCtx = createContext(() => {});
export function HelpLayer({ children }) {
  const [tip, setTip] = useState(null);
  return (
    <TipCtx.Provider value={setTip}>
      {children}
      {tip && (
        <div className="np-tip" role="tooltip"
          style={{ left: Math.max(8, Math.min(tip.x, (typeof window !== "undefined" ? window.innerWidth : 1200) - 336)), top: tip.y }}>
          {tip.text}
        </div>
      )}
    </TipCtx.Provider>
  );
}
/** A "?" beside a term. `label` is the plain term a screen reader says: "What Line-side share means". */
export function Help({ label, text }) {
  const setTip = useContext(TipCtx);
  const show = useCallback((el) => {
    const r = el.getBoundingClientRect();
    setTip({ text, x: r.left, y: r.bottom + 6 });
  }, [setTip, text]);
  return (
    <button type="button" className="np-q" aria-label={`What ${label} means`}
      onMouseEnter={(e) => show(e.currentTarget)} onFocus={(e) => show(e.currentTarget)}
      onMouseLeave={() => setTip(null)} onBlur={() => setTip(null)}
      onClick={(e) => e.stopPropagation()}>?</button>
  );
}

/* ── A term in running text that explains itself: dotted underline, the same
      fixed tip layer as the "?" mark, on hover AND on keyboard focus. For
      jargon inside a sentence, where a "?" after every word would break it. ── */
export function Term({ text, children }) {
  const setTip = useContext(TipCtx);
  const show = (el) => { const r = el.getBoundingClientRect(); setTip({ text, x: r.left, y: r.bottom + 6 }); };
  return (
    <span tabIndex={0} className="np-term" onMouseEnter={(e) => show(e.currentTarget)} onFocus={(e) => show(e.currentTarget)}
      onMouseLeave={() => setTip(null)} onBlur={() => setTip(null)}>{children}</span>
  );
}
/* ── Any piece of the screen that carries its reasoning on hover and focus —
      the per-row reason behind a date, the figures behind a chip. ── */
export function Hint({ text, children }) {
  const setTip = useContext(TipCtx);
  const show = (el) => { const r = el.getBoundingClientRect(); setTip({ text, x: r.left, y: r.bottom + 6 }); };
  return (
    <span tabIndex={0} className="np-hint" onMouseEnter={(e) => show(e.currentTarget)} onFocus={(e) => show(e.currentTarget)}
      onMouseLeave={() => setTip(null)} onBlur={() => setTip(null)}>{children}</span>
  );
}

/* ── The mode switch: an icon, 28px like every other header button. ── */
function ModeSwitch({ mode, onMode }) {
  const next = mode === "dark" ? "light" : "dark";
  const label = `Switch to ${next} mode`;
  return (
    <button type="button" className="np-btn icon" aria-label={label} title={label} onClick={() => onMode(next)}>
      {mode === "dark" ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      )}
    </button>
  );
}

/* ── The header: one bar, name at the left; at the right, in this order and no
      other — byline · Instruction Manual (the one filled, bold button; new tab) ·
      the demo chip where a gated tool shows its access · the mode switch. ── */
export function HouseHeader({ name, manualHref, onManual, mode, onMode }) {
  return (
    <header className="np-head">
      <h1>{name}</h1>
      <div className="np-head-tools">
        <span className="np-by">{BYLINE}</span>
        <a className="np-btn primary" href={manualHref} target="_blank" rel="noopener"
          onClick={onManual}>Instruction Manual</a>
        <span className="np-chip-demo" title="Nothing here is real company data, and nothing you do here is sent anywhere.">
          Demo · invented Northpoint data
        </span>
        <ModeSwitch mode={mode} onMode={onMode} />
      </div>
    </header>
  );
}

/* ── The footer: name · byline, the scope line, and which build is running. ── */
export function HouseFooter({ name, scope }) {
  return (
    <footer className="np-foot">
      <span>{name} · {BYLINE}</span>
      <span>{scope}</span>
      <span className="np-stamp">{BUILD_STAMP}</span>
    </footer>
  );
}

/* ── The manual, as a panel inside the tool. The header's button opens the
      manual's own page in a new tab; this panel is for a copy with no server
      behind it, and its Save button writes the same page as a file. ── */
export function ManualPanel({ manual, slug, mode, onClose }) {
  const html = useMemo(() => renderManual(manual), [manual]);
  const save = () => {
    const doc = manualDocument(manual, northpointVars(slug, mode), HOUSE_CSS);
    const url = URL.createObjectURL(new Blob([doc], { type: "text/html" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug}-manual.html`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="np-manual-panel" role="dialog" aria-modal="true" aria-label={`${manual.tool} Instruction Manual`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="np-manual-sheet">
        <div className="np-manual-bar">
          <h2>Instruction Manual</h2>
          <button type="button" className="np-btn" onClick={save}>Save as a file</button>
          <button type="button" className="np-btn quiet" onClick={onClose}>Close</button>
        </div>
        {/* renderManual escapes every value it interpolates. */}
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
}

/**
 * The root every factory demo renders inside.
 * @param {{ slug: string, name: string, scope: string, manual?: object, children: any }} p
 *   manual — the tool's manual data; with it, a plain click on the header's
 *   button opens the in-tool panel only when the page has no server behind it
 *   (a file:// copy). On the site the button opens the manual's page in a new tab.
 */
export function HouseFrame({ slug, name, scope, manual, children }) {
  /* Read before the first paint, so a visitor who chose light never sees a
     dark flash. The islands render in the browser only, so window is there. */
  const [mode, setModeState] = useState(() => (typeof window !== "undefined" ? readMode() : DEFAULT_MODE));
  const [manualOpen, setManualOpen] = useState(false);
  const setMode = useCallback((m) => { setModeState(m); writeMode(m); }, []);
  const vars = useMemo(() => northpointVars(slug, mode), [slug, mode]);
  const hex = useMemo(() => northpointHex(slug, mode), [slug, mode]);
  const openManual = useCallback(() => setManualOpen(true), []);
  const ctx = useMemo(() => ({ mode, hex, setMode, openManual: manual ? openManual : null }), [mode, hex, setMode, manual, openManual]);
  const manualHref = `/work/${slug}/manual/`;
  const onManual = (e) => {
    if (manual && typeof window !== "undefined" && window.location.protocol === "file:") {
      e.preventDefault();
      setManualOpen(true);
    }
  };
  return (
    <ModeCtx.Provider value={ctx}>
      <div className="np-app" data-np-root={slug} data-np-band={hex.band} data-np-mode={mode}
        style={{ ...vars, colorScheme: mode, accentColor: hex.accentFill }}>
        <style>{HOUSE_CSS}</style>
        <HelpLayer>
          <HouseHeader name={name} manualHref={manualHref} onManual={onManual} mode={mode} onMode={setMode} />
          <div className="np-body">{children}</div>
          <HouseFooter name={name} scope={scope} />
          {manualOpen && manual && (
            <ManualPanel manual={manual} slug={slug} mode={mode} onClose={() => setManualOpen(false)} />
          )}
        </HelpLayer>
      </div>
    </ModeCtx.Provider>
  );
}

/* ── One banner per notice, led by a filled tag. role=alert for a failure so a
      screen reader announces it at once; role=status otherwise. ── */
export function NoticeBanner({ tag, tone = "ok", children, reasons, onDismiss }) {
  return (
    <div className="np-banner" role={tone === "bad" ? "alert" : "status"}>
      <span className={`np-pill ${tone}`}>{tag}</span>
      <div className="np-banner-body">
        <div>{children}</div>
        {reasons && reasons.length > 0 && (
          <ul className="np-reasons">{reasons.map((r) => <li key={r}>{r}</li>)}</ul>
        )}
      </div>
      {onDismiss && <button type="button" className="np-btn quiet" onClick={onDismiss}>Dismiss</button>}
    </div>
  );
}

/* ── Ask first, in the page, and say what will happen (Ian, two tiers).
      click mode: the first press opens a line naming the effect; a second press
      does it. typed mode: the confirm stays disabled until the item's name is
      typed back. NEVER window.confirm: it blocks every other event on the page,
      including the browser drive every build gets before it is called done. ── */
export function ConfirmButton({ label, effect, confirmLabel, onConfirm, typed, className = "np-btn", disabled, icon }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  if (!open) {
    return (
      <button type="button" className={className} disabled={disabled} onClick={() => setOpen(true)}>
        {icon}{label}
      </button>
    );
  }
  const ready = typed === undefined || text.trim() === typed;
  return (
    <span className="np-confirm" role="group" aria-label={label}>
      <span className="np-confirm-effect">{effect}</span>
      {typed !== undefined && (
        <input className="np-in" value={text} autoFocus onChange={(e) => setText(e.target.value)}
          placeholder={`Type ${typed} to confirm`} aria-label={`Type ${typed} to confirm`} />
      )}
      <button type="button" className={className} disabled={!ready}
        onClick={() => { onConfirm(); setOpen(false); setText(""); }}>{confirmLabel}</button>
      <button type="button" className="np-btn quiet" onClick={() => { setOpen(false); setText(""); }}>Cancel</button>
    </span>
  );
}

/* ── The live-number sentence every screen opens with. ── */
export function Intro({ children }) {
  return <p className="np-intro">{children}</p>;
}

/* ── How this works: folded, at the top, each point led by its claim in bold,
      so a reader who scans only the bold still gets the method. ── */
export function HowItWorks({ points, title = "How this works" }) {
  /* The manual's second home. The header's button opens its own page in a new
     tab; this line opens the same text inside the tool, where it can also be
     saved as a file for a copy with no internet behind it. */
  const { openManual } = useContext(ModeCtx);
  return (
    <details className="np-how">
      <summary>{title}</summary>
      <ul>{points.map((p) => <li key={p.lead}><b>{p.lead}</b> {p.text}</li>)}</ul>
      {openManual && (
        <p className="np-muted" style={{ marginTop: 6 }}>
          Every rule, threshold and limit is in the Instruction Manual.{" "}
          <button type="button" className="np-btn quiet" onClick={openManual}>Read it here</button>
        </p>
      )}
    </details>
  );
}

/* ── Answer cards: each is a label, a figure and ONE sentence saying what it
      means for the reader (Ian, 2026-09-23: answer cards everywhere). A card
      that filters the grid when pressed says so with aria-pressed. ── */
export function AnswerCards({ children }) {
  return <div className="np-cards">{children}</div>;
}
export function AnswerCard({ label, value, tone, help, children, onClick, pressed, title }) {
  const body = (
    <>
      <div className="lab">{label}{help && <Help label={label} text={help} />}</div>
      <div className={`val ${tone || ""}`}>{value}</div>
      <p>{children}</p>
    </>
  );
  if (onClick) {
    return (
      <button type="button" className="np-card is-button" aria-pressed={!!pressed} onClick={onClick} title={title}>
        {body}
      </button>
    );
  }
  return <div className="np-card" title={title}>{body}</div>;
}

/* ── Status: a filled pill or a dot, one ink on every fill. ── */
export const Dot = ({ tone, title }) => <span className={`np-dot ${tone}`} title={title} aria-hidden={title ? undefined : "true"} />;
export const Pill = ({ tone, children, title, icon }) => <span className={`np-pill ${tone}`} title={title}>{icon}{children}</span>;

/* ── The legend under a grid names every color the grid paints. ── */
export function Legend({ items, lead }) {
  return (
    <div className="np-legend">
      {lead && <span>{lead}</span>}
      {items.map((it) => (
        <span key={it.label} title={it.note}>
          {it.swatch ? <i style={{ background: it.swatch }} /> : <Dot tone={it.tone} />}
          {it.label}
        </span>
      ))}
    </div>
  );
}

/* ── The two downloads, side by side: the full list filled, what is on screen
      plain, both with their counts and the format. ── */
const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
  </svg>
);
export function ExportPair({ fullCount, filteredCount, onFull, onFiltered, noun = "rows" }) {
  return (
    <div className="np-exports">
      <button type="button" className="np-btn primary" onClick={onFull}
        title={`Every one of the ${fullCount} ${noun} the tool holds, whatever the filters show, as an Excel file with an About sheet.`}>
        <DownloadIcon />Export full list ({fullCount}) .xlsx
      </button>
      <button type="button" className="np-btn" onClick={onFiltered}
        title={`Exactly the ${filteredCount} ${noun} on screen, with the filters and sort in force, as an Excel file whose About sheet names them.`}>
        <DownloadIcon />Export filtered ({filteredCount}) .xlsx
      </button>
    </div>
  );
}

/* ── A number a person types. It holds the raw draft while the field has focus
      and commits on blur or Enter, clamped. A controlled input that re-derives
      its value from parsed state on every keystroke turns "clear it and type 40"
      into 14, because the empty field parses to the minimum first — the shelf
      paid for that as LEDGER L-199, and no fill()-based check can see it,
      because fill() delivers the whole string in one event. ── */
export function NumberField({ value, onCommit, min, max, label, suffix, width = "5.5em" }) {
  const [draft, setDraft] = useState(null);
  const commit = () => {
    if (draft === null) return;
    const n = Number(String(draft).replace(/[^0-9.\-−]/g, "").replace("−", "-"));
    if (Number.isFinite(n) && String(draft).trim() !== "") {
      onCommit(Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n)));
    }
    setDraft(null);
  };
  return (
    <label>
      {label}
      <input className="np-in num" inputMode="decimal" style={{ width }} aria-label={label}
        value={draft ?? String(value)} onFocus={(e) => { setDraft(String(value)); e.target.select(); }}
        onChange={(e) => setDraft(e.target.value)} onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); if (e.key === "Escape") { setDraft(null); e.currentTarget.blur(); } }} />
      {suffix}
    </label>
  );
}

/* ── Pin every column that names the row. CSS can pin a cell, but the offset of
      the second pinned column is the width of the first, which CSS cannot know;
      this measures the pinned header cells and gives every pinned cell below
      them the running offset. Mark the cells with class "pin". ── */
/* RE-PLACED WHENEVER A PINNED HEADER CELL CHANGES SIZE, not only when the caller
   asks. Measured 2026-09-24 on Production Plan Churn at 412px: the offsets were
   taken at mount, IBM Plex Sans arrived a moment later and widened the first
   column from 136.14px to 137.17px, and the second pin sat 1px inside it for
   the life of the page. With the font files blocked the two numbers matched.
   Anything that resizes a column after mount (a font, a wider row, a resize)
   is the same fault, so the observer watches the header cells themselves. */
const PIN_WATCHED = new WeakSet();
function placePins(table) {
  const head = table.tHead && table.tHead.rows[0];
  if (!head) return;
  const offsets = [];
  let x = 0;
  for (const cell of Array.from(head.cells)) {
    if (!cell.classList.contains("pin")) break;
    offsets.push(x);
    x += cell.getBoundingClientRect().width;
  }
  for (const row of Array.from(table.rows)) {
    offsets.forEach((left, k) => {
      const cell = row.cells[k];
      if (cell && cell.classList.contains("pin")) cell.style.left = left + "px";
    });
  }
}
export function pinColumns(table) {
  if (!table) return;
  placePins(table);
  if (typeof ResizeObserver === "undefined" || PIN_WATCHED.has(table)) return;
  const head = table.tHead && table.tHead.rows[0];
  if (!head) return;
  PIN_WATCHED.add(table);
  const ro = new ResizeObserver(() => placePins(table));
  for (const cell of Array.from(head.cells)) {
    if (!cell.classList.contains("pin")) break;
    ro.observe(cell);
  }
}
