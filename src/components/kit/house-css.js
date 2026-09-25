/* THE HOUSE LAYER FOR THE FACTORY DEMOS — what every one of the seven looks
   like, whichever band it sits in.

   Ported from dev/login-starter/app/house.css on 2026-09-23, the day Ian made
   MD04's look the house standard and brought these seven under it
   (tool-conventions references/house-look.md carries every rule and its source).
   NOTHING HERE CARRIES A COLOR VALUE: every color is a --np-* property the
   tool's root receives from northpointVars() in industrial.js, so a mode switch
   or a palette change never touches this file.

   WHY A STRING IN A .js FILE AND NOT A .css FILE. The seven are also written out
   as single-file "masters" on Ian's Drive (scripts/sync-masters.mjs), and a
   single file cannot carry a stylesheet import. A string rendered into a
   <style> tag by HouseFrame travels with the code wherever it is copied.

   EVERY SELECTOR SITS UNDER .np-app, because the island is mounted inside a
   marketing page whose own classes (.pill, .panel, .dot) would otherwise
   collide in both directions.

   What it fixes for every tool:
   - IBM Plex Sans for words; Plex Mono with lined-up digits for numbers, codes
     and week labels, never for words.
   - Compact sizes: 14.5px body, 11px capital labels over cards and tables.
   - Flat bordered panels with 4px corners; in light mode cards also lift with a
     soft shadow (the shadow token is 'none' in dark).
   - A 2px accent outline on whatever has keyboard focus.
   - Motion is feedback only, 150ms, and all of it stops for reduced motion.
   - Every screen works at 375, 390 and 412px: the page never scrolls sideways,
     the grid scrolls inside its own window. */
export const HOUSE_CSS = `
.np-app { background: var(--np-bg); color: var(--np-text-sec); font-family: var(--np-font-sans); font-size: 14.5px; line-height: 1.5; min-height: 100vh; display: flex; flex-direction: column; --np-rad: 4px; --np-pad: 16px; font-variant-numeric: tabular-nums; }
.np-app *, .np-app *::before, .np-app *::after { box-sizing: border-box; }
.np-app > .np-body { flex: 1; width: 100%; max-width: 1280px; margin: 0 auto; padding: 0 0 24px; min-width: 0; }
.np-app h1, .np-app h2, .np-app h3, .np-app h4 { color: var(--np-text); letter-spacing: -.01em; text-wrap: balance; margin: 0; font-weight: 600; }
.np-app p { margin: 0; }
/* A list inside the frame is a list: the site's base styles strip the markers,
   and Order Confirmation's numbered actions lost their numbers to it. */
.np-app ol { list-style: decimal; } .np-app ul { list-style: disc; }
.np-app a { color: var(--np-accent-text); }
.np-app .np-num { font-family: var(--np-font-mono); font-variant-numeric: tabular-nums; }
.np-app .np-muted { color: var(--np-text-muted); font-size: 13px; }
:where(.np-app) button, :where(.np-app) input, :where(.np-app) select { font: inherit; color: inherit; }
.np-app :focus-visible { outline: 2px solid var(--np-accent-text); outline-offset: 2px; }

/* The header: one bar, the name at the left, the house controls at the right,
   in this order and no other — byline, manual, demo chip, mode switch. */
/* The bar runs the full width; its CONTENTS line up with the 1280px column the
   tool sits in, so the name starts where the tool does. --np-gutter is that
   column's side margin, never less than the page padding. */
.np-app { --np-gutter: max(var(--np-pad), calc((100% - 1280px) / 2 + var(--np-pad))); }
.np-head { display: flex; flex-wrap: wrap; gap: 6px 14px; align-items: center; padding: 10px var(--np-gutter); border-bottom: 1px solid var(--np-border); background: var(--np-surface); }
.np-head h1 { font-size: 16px; font-weight: 600; color: var(--np-text); margin: 0 auto 0 0; }
.np-head-tools { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; justify-content: flex-end; }
.np-by { font-size: 12.5px; color: var(--np-text-muted); margin-right: 4px; }
.np-chip-demo { font-size: 12.5px; color: var(--np-text-sec); border: 1px solid var(--np-border); border-radius: var(--np-rad); padding: 3px 8px; white-space: nowrap; }

/* Buttons and chips. One height, 28px, for every button in a bar. Only the
   filled main button is bold (house rule). */
.np-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: 28px; background: var(--np-surface-alt); border: 1px solid var(--np-control); border-radius: var(--np-rad); padding: 3px 10px; font-size: 13px; color: var(--np-text); cursor: pointer; white-space: nowrap; text-decoration: none; line-height: 1.4; font-weight: 400; transition: border-color 150ms, filter 150ms, background-color 150ms; }
.np-btn:hover { border-color: var(--np-accent-text); }
.np-btn:active { filter: brightness(.94); }
.np-btn[disabled] { opacity: .55; cursor: not-allowed; color: var(--np-text-muted); }
.np-btn.primary { background: var(--np-accent-fill); border-color: var(--np-accent-fill); color: var(--np-accent-ink); font-weight: 600; }
.np-btn.primary:hover { filter: brightness(1.08); }
.np-btn.quiet { background: transparent; color: var(--np-text-sec); }
.np-btn.icon { width: 28px; padding: 0; }
.np-btn svg { width: 15px; height: 15px; flex: none; }
.np-chip { display: inline-flex; align-items: center; gap: 5px; background: var(--np-surface-alt); border: 1px solid var(--np-control); border-radius: var(--np-rad); padding: 3px 9px; font-size: 12.5px; color: var(--np-text-sec); cursor: pointer; white-space: nowrap; transition: border-color 150ms, background-color 150ms; }
.np-chip:hover { border-color: var(--np-accent-text); }
.np-chip[aria-pressed="true"] { background: var(--np-accent-fill); border-color: var(--np-accent-fill); color: var(--np-accent-ink); }
.np-chip .n { font-family: var(--np-font-mono); font-variant-numeric: tabular-nums; }
.np-in { background: var(--np-bg); border: 1px solid var(--np-control); border-radius: var(--np-rad); padding: 3px 7px; font-size: 13px; color: var(--np-text); min-width: 0; min-height: 28px; }
.np-in.num { width: 5.5em; font-family: var(--np-font-mono); text-align: right; }
.np-row { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }

/* Where the data came from: the block under the header (MD04's shape). */
.np-part { display: flex; flex-wrap: wrap; gap: 10px 16px; align-items: flex-start; padding: 12px var(--np-pad); border-bottom: 1px solid var(--np-border); background: var(--np-surface); }
.np-ident { margin-right: auto; min-width: 0; }
.np-ident h2 { font-size: 15px; }
.np-ident p { font-size: 12.5px; color: var(--np-text-muted); }
.np-ident p b { color: var(--np-text-sec); font-weight: 500; }
.np-bar { display: flex; flex-wrap: wrap; gap: 8px 12px; align-items: center; padding: 8px var(--np-pad); border-bottom: 1px solid var(--np-border); }
.np-bar label { font-size: 12.5px; color: var(--np-text-muted); display: inline-flex; gap: 6px; align-items: center; }

/* The live-number sentence every screen opens with, and How this works, folded. */
.np-intro { padding: 12px var(--np-pad) 4px; font-size: 14px; color: var(--np-text-sec); max-width: 110ch; }
.np-intro b { color: var(--np-text); font-weight: 600; }
.np-how { padding: 2px var(--np-pad) 10px; font-size: 13px; }
.np-how summary { cursor: pointer; color: var(--np-accent-text); padding: 6px 0; width: max-content; max-width: 100%; }
.np-how ul { margin: 4px 0 0; padding-left: 18px; list-style: disc; }
.np-how li { margin: 5px 0; max-width: 95ch; }
.np-how li > b:first-child { color: var(--np-text); font-weight: 600; }

/* Notices: one banner each, led by a filled tag. Never a pop-up. */
.np-banner { margin: 8px var(--np-pad) 0; padding: 8px 12px; border-radius: var(--np-rad); border: 1px solid var(--np-control); background: var(--np-surface); box-shadow: var(--np-shadow); font-size: 13px; color: var(--np-text); display: flex; gap: 10px; align-items: baseline; }
.np-banner-body { flex: 1; min-width: 0; }
.np-reasons { margin: 4px 0 0; padding-left: 18px; list-style: disc; color: var(--np-text-sec); }

/* Answer cards: a label, a figure, and one sentence saying what it means. */
.np-cards { display: grid; gap: 8px; padding: 8px var(--np-pad); grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }
.np-card { background: var(--np-surface); border: 1px solid var(--np-border); border-radius: var(--np-rad); box-shadow: var(--np-shadow); padding: 10px 12px; min-width: 0; }
.np-card .lab { display: flex; align-items: center; gap: 6px; font-size: 11px; letter-spacing: .07em; text-transform: uppercase; color: var(--np-text-muted); font-weight: 600; }
.np-card .val { color: var(--np-text); font-size: 20px; font-weight: 600; margin: 4px 0 3px; font-family: var(--np-font-mono); font-variant-numeric: tabular-nums; line-height: 1.2; }
.np-card p { font-size: 12.5px; color: var(--np-text-sec); line-height: 1.45; }
.np-card .val.good { color: var(--np-good); } .np-card .val.warn { color: var(--np-warn); } .np-card .val.bad { color: var(--np-bad); } .np-card .val.info { color: var(--np-info); }
/* A pressable card is a <button>, and a browser centers a button's contents
   vertically — so its label sat lower than a plain card's beside it. A column
   from the top puts every card's label on one line. */
.np-card.is-button { cursor: pointer; text-align: left; font: inherit; width: 100%; transition: border-color 150ms; display: flex; flex-direction: column; justify-content: flex-start; align-items: stretch; }
.np-card.is-button:hover { border-color: var(--np-accent-text); }
.np-card.is-button[aria-pressed="true"] { border-color: var(--np-accent-fill); box-shadow: inset 0 0 0 1px var(--np-accent-fill), var(--np-shadow); }

/* Status: filled pills with the one ink, and dots. Green and red mean status
   and nothing else; amber is "at or under the threshold". */
.np-pill { display: inline-flex; align-items: center; gap: 4px; border-radius: 999px; padding: 1px 8px; font-size: 11px; font-weight: 700; letter-spacing: .03em; color: var(--np-accent-ink); white-space: nowrap; }
.np-pill.ok { background: var(--np-good-fill); } .np-pill.warn { background: var(--np-warn-fill); } .np-pill.bad { background: var(--np-bad-fill); }
.np-pill.olive { background: var(--np-olive-fill); } .np-pill.orange { background: var(--np-orange-fill); } .np-pill.change { background: var(--np-change-fill); }
/* The outline is drawn inside the pill, not as a border: a border made the quiet
   pill 2px taller than a filled one, and a grid row holding one stood 1px taller
   than its neighbors (Churn, 2026-09-24). */
.np-pill.quiet { background: transparent; color: var(--np-text-sec); box-shadow: inset 0 0 0 1px var(--np-control); font-weight: 500; }
.np-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; flex: none; vertical-align: 1px; }
.np-dot.ok { background: var(--np-good-fill); } .np-dot.warn { background: var(--np-warn-fill); } .np-dot.bad { background: var(--np-bad-fill); }
.np-dot.olive { background: var(--np-olive-fill); } .np-dot.orange { background: var(--np-orange-fill); } .np-dot.info { background: var(--np-info); } .np-dot.quiet { background: var(--np-text-muted); }

/* A panel for anything that is not the grid — a chart, a detail, a list. */
.np-panel { margin: 8px var(--np-pad) 0; background: var(--np-surface); border: 1px solid var(--np-border); border-radius: var(--np-rad); box-shadow: var(--np-shadow); min-width: 0; }
.np-panel > h3, .np-panel-head { font-size: 13px; padding: 10px 12px 0; }
.np-panel-body { padding: 10px 12px 12px; }

/* The grid: its own scrolling window, header row pinned, and every column that
   names the row pinned too (Ian: the whole identity block, not only the first
   column). A pinned cell carries its own background or rows show through it;
   the corner sits above both planes. pinColumns() sets each offset. */
.np-gridwrap { margin: 8px var(--np-pad) 0; border: 1px solid var(--np-border); border-radius: var(--np-rad); background: var(--np-surface); box-shadow: var(--np-shadow); min-width: 0; }
.np-gridhead { display: flex; flex-wrap: wrap; gap: 6px 12px; align-items: center; padding: 8px 10px; border-bottom: 1px solid var(--np-border); font-size: 12.5px; color: var(--np-text-muted); }
.np-scroll { max-height: min(64vh, 620px); overflow: auto; }
.np-grid { border-collapse: separate; border-spacing: 0; width: 100%; font-size: 13px; }
.np-grid th { text-align: left; color: var(--np-text-muted); font-weight: 600; font-size: 11px; letter-spacing: .06em; text-transform: uppercase; padding: 7px 10px; border-bottom: 1px solid var(--np-border); position: sticky; top: 0; background: var(--np-surface); z-index: 2; white-space: nowrap; }
.np-grid th button { background: none; border: 0; padding: 0; color: inherit; font: inherit; letter-spacing: inherit; text-transform: inherit; cursor: pointer; display: inline-flex; align-items: center; gap: 2px; }
.np-grid th button:hover { color: var(--np-text); }
.np-grid th.r, .np-grid td.r { text-align: right; }
.np-grid th.c, .np-grid td.c { text-align: center; }
.np-grid td { padding: 6px 10px; border-bottom: 1px solid var(--np-border); color: var(--np-text-sec); background: var(--np-surface); vertical-align: middle; }
.np-grid tbody tr.is-row { cursor: pointer; }
.np-grid tbody tr.is-row:hover td { background: var(--np-surface-alt); }
.np-grid tr[aria-expanded="true"] td { background: var(--np-surface-alt); color: var(--np-text); }
/* A handled row steps down a TEXT TIER, never an opacity: fading by opacity
   drops contrast below the floor where no computed color can show it, and the
   house rule is to de-emphasize by tier, not by contrast. */
.np-grid tr.is-done td, .np-grid tr.is-done .code, .np-grid tr.is-done .num { color: var(--np-text-muted); }
.np-grid .pin { position: sticky; left: 0; z-index: 1; }
.np-grid th.pin { z-index: 3; }
/* A code or a figure never breaks: "INB-18030001" wrapped at its hyphen and
   made its row three lines tall. */
.np-grid .code { font-family: var(--np-font-mono); font-size: 12.5px; color: var(--np-text); white-space: nowrap; }
.np-grid .num { font-family: var(--np-font-mono); font-variant-numeric: tabular-nums; color: var(--np-text); white-space: nowrap; }
.np-grid .sub { display: block; font-size: 12px; color: var(--np-text-muted); white-space: nowrap; }
/* A pinned text column (a description) keeps its pin on a phone but gives up
   width: it is clipped with its full text on hover, so every row stays one
   height and the figures keep the screen. */
.np-grid .pin.clip { max-width: 22em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.np-grid td.neg, .np-grid .neg { color: var(--np-bad); }
.np-grid .detail td { background: var(--np-bg); cursor: default; white-space: normal; }
/* An opened row's detail spans the whole grid, which is wider than a phone; this
   keeps its text in the visible part of the window instead of off to the right. */
.np-detail { position: sticky; left: 0; max-width: min(1100px, calc(100vw - 2 * var(--np-pad) - 28px)); }
.np-legend { display: flex; flex-wrap: wrap; gap: 6px 16px; padding: 8px 10px; font-size: 12px; color: var(--np-text-muted); border-top: 1px solid var(--np-border); }
.np-legend span { display: inline-flex; align-items: center; gap: 6px; }
.np-legend i { display: inline-block; width: 10px; height: 10px; border-radius: 2px; }
.np-empty { padding: 22px; text-align: center; color: var(--np-text-muted); font-size: 13px; }
.np-exports { display: flex; flex-wrap: wrap; gap: 6px; }

/* Ask first, in the page (two tiers). */
.np-confirm { display: inline-flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.np-confirm-effect { font-size: 12.5px; color: var(--np-text); max-width: 46ch; }

/* The footer: name · byline, the scope line, and which build is running. */
.np-foot { padding: 14px var(--np-gutter); font-size: 12px; color: var(--np-text-muted); border-top: 1px solid var(--np-border); display: flex; flex-wrap: wrap; gap: 6px 16px; background: var(--np-surface); }
.np-foot .np-stamp { margin-left: auto; font-family: var(--np-font-mono); }

/* Help marks: fixed so a scrolling grid cannot clip the explanation. */
.np-q { display: inline-flex; align-items: center; justify-content: center; width: 15px; height: 15px; margin-left: 4px; border-radius: 50%; border: 1px solid var(--np-control); font-size: 10px; color: var(--np-text-muted); cursor: help; background: transparent; padding: 0; vertical-align: 1px; text-transform: none; letter-spacing: 0; font-weight: 600; line-height: 1; }
.np-tip { position: fixed; z-index: 60; max-width: min(320px, calc(100vw - 16px)); background: var(--np-surface-alt); color: var(--np-text); border: 1px solid var(--np-control); border-radius: var(--np-rad); padding: 8px 10px; font-size: 12.5px; line-height: 1.45; box-shadow: 0 8px 24px var(--np-shade); pointer-events: none; text-transform: none; letter-spacing: 0; font-weight: 400; white-space: normal; }

.np-term { border-bottom: 1px dotted var(--np-text-muted); cursor: help; }
.np-hint { cursor: help; }

/* The Instruction Manual, as a panel inside the tool and as its own page. */
.np-manual-panel { position: fixed; inset: 0; z-index: 70; background: var(--np-shade); display: flex; justify-content: flex-end; }
.np-manual-sheet { width: min(900px, 100%); height: 100%; overflow: auto; background: var(--np-bg); border-left: 1px solid var(--np-border); }
.np-manual-bar { position: sticky; top: 0; display: flex; gap: 8px; align-items: center; padding: 10px var(--np-pad); background: var(--np-surface); border-bottom: 1px solid var(--np-border); z-index: 1; }
.np-manual-bar h2 { font-size: 15px; margin-right: auto; }
.np-manual { max-width: 980px; margin: 0 auto; padding: 20px var(--np-pad) 56px; color: var(--np-text-sec); }
.np-manual h1 { font-size: 24px; margin-bottom: 4px; }
.np-manual section { margin-top: 26px; }
.np-manual h2 { font-size: 18px; margin-bottom: 8px; }
.np-manual h3 { font-size: 15px; margin: 14px 0 4px; }
.np-manual p, .np-manual li { max-width: 75ch; }
.np-manual p + p { margin-top: 8px; }
.np-manual p b, .np-manual li b { color: var(--np-text); font-weight: 600; }
.np-manual ul { padding-left: 20px; list-style: disc; margin: 6px 0; }
.np-manual li { margin: 3px 0; }
.np-manual .scroll { overflow-x: auto; }
.np-manual table { border-collapse: collapse; width: 100%; font-size: 13.5px; margin-top: 8px; }
.np-manual th, .np-manual td { text-align: left; vertical-align: top; padding: 7px 10px; border-bottom: 1px solid var(--np-border); }
.np-manual th { color: var(--np-text-muted); font-size: 11.5px; text-transform: uppercase; letter-spacing: .06em; }
.np-manual td:first-child { color: var(--np-text); font-weight: 600; }
.np-manual .np-by { display: block; margin: 0 0 12px; }

/* Phones. Every screen is designed at 375–412px, not merely allowed to shrink. */
@media (max-width: 640px) {
  .np-app { --np-pad: 12px; }
  .np-head h1 { font-size: 15px; flex: 1 1 100%; }
  .np-head-tools { width: 100%; justify-content: flex-start; }
  .np-head .np-by { order: -2; flex: 1 1 100%; margin-right: 0; }
  .np-part { flex-direction: column; }
  .np-banner { flex-wrap: wrap; }
  .np-cards { grid-template-columns: 1fr 1fr; }
  .np-card .val { font-size: 17px; }
  .np-scroll { max-height: 70vh; }
  .np-grid .pin.clip { max-width: 7.5em; }
  .np-foot .np-stamp { margin-left: 0; }
  .np-manual h1 { font-size: 20px; }
}
@media (max-width: 400px) { .np-cards { grid-template-columns: 1fr; } }
@media (prefers-reduced-motion: reduce) { .np-app *, .np-app *::before, .np-app *::after { transition: none !important; animation: none !important; } }
`;
