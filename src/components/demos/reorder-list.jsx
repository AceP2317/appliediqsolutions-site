// ============================================================================
// REORDER LIST — Marker Nine Chandlery (portfolio demo)
//
// Days of cover, and what to order. Drop the stock export you already get out of
// whatever you run, tell it which column means what, and it works out how long
// each line lasts at the usage you gave it and when the order has to go.
//
// THE FILE IS READ BY THIS PAGE. It is not uploaded, not sent, not stored. That
// is not a policy, it is how a browser reads a file you drop on it, and it is
// why this whole shelf can promise nothing leaves the page.
//
// THE HONESTY CONTRACT, and this tool tests it harder than any other here,
// because days of cover is inherently forward-looking and reads as a prediction
// even when it is one division.
//
// It forecasts nothing. Usage is a figure from the owner's own history — no
// curve fitted, nothing smoothed, recent weeks weighted no more heavily than
// old ones. There is no invented safety stock: the buffer is an input and it
// starts at ZERO, because a margin nobody chose is a number this page made up.
// And it never states a run-out date as fact. "At the usage you entered, this
// lasts eleven days" is arithmetic; "you run out on the 4th" is a promise about
// the future, and this makes none.
//
// Built by Ian Provencher · AppliedIQ Solutions
// Public demo — the business and the stock list are invented.
// ============================================================================

import React, { useMemo, useRef, useState } from 'react';
import { computeReorder } from '../../lib/reorder.js';
import { readSheet, guessColumns, mapColumns, cellNumber } from '../../lib/sheet-read.js';
import { T, A, S, FONT_DATA, FONT_BODY, Panel, Btn, Cell, Field, ToolHeader, Problems, WontDo, useRemembered, toNumber, uid, page, wrap, th, thN, td, tdN, exportRows, pageFor, Readout } from '../kit/shelf.jsx';

const SHOP = 'Marker Nine Chandlery';

// The words that suggest each field in somebody else's export. A guess, shown.
const HINTS = {
  name: ['item', 'product', 'description', 'sku', 'part'],
  onHand: ['onhand', 'on hand', 'qty', 'quantity', 'stock', 'available'],
  usage: ['usage', 'sold', 'used', 'issued', 'consumption'],
  leadDays: ['lead', 'leadtime', 'lead days', 'days out'],
};

// ============================================================================
// THE SAMPLE — one stock list at a made-up chandlery in a made-up town.
// ============================================================================
const SAMPLE = {
  periodDays: 30,
  bufferDays: 0,
  horizonDays: 30,
  items: [
    { id: 'i1', name: 'Dock line, 5/8in × 25ft', onHand: 14, usage: 42, periodDays: 30, leadDays: 10 },
    { id: 'i2', name: 'Zinc anode, shaft 1in', onHand: 6, usage: 18, periodDays: 30, leadDays: 21 },
    { id: 'i3', name: 'Impeller, raw water', onHand: 22, usage: 15, periodDays: 30, leadDays: 14 },
    { id: 'i4', name: 'Fuel filter element', onHand: 48, usage: 36, periodDays: 30, leadDays: 7 },
    { id: 'i5', name: 'Bilge pump, 1100 gph', onHand: 3, usage: 4, periodDays: 30, leadDays: 18 },
    { id: 'i6', name: 'Stainless shackle, 3/8in', onHand: 130, usage: 25, periodDays: 30, leadDays: 5 },
    { id: 'i7', name: 'VHF antenna, 4ft', onHand: 5, usage: 3, periodDays: 30, leadDays: 28 },
    { id: 'i8', name: 'Marine sealant, black', onHand: 31, usage: 44, periodDays: 30, leadDays: 6 },
    { id: 'i9', name: 'Nav bulb, bayonet', onHand: 90, usage: 12, periodDays: 30, leadDays: 9 },
  ],
};

const STATE = {
  'order now': { label: 'order now', color: A.bad },
  'order this week': { label: 'this week', color: A.warn },
  ok: { label: 'fine', color: T.textMuted },
  'no usage': { label: 'no usage', color: A.bad },
  /* WITHOUT THIS ROW THE PAGE CRASHES rather than reporting. STATE[i.state] is
     read straight into `.label`, so a state the engine can return and this map
     does not carry is a TypeError mid-render — a blank screen where the whole
     point was to say something could not be read. */
  unreadable: { label: 'could not read', color: A.bad },
};

export default function ReorderList({ mode = 'demo' }) {
  const { state, patch, setState, reset, status, restored, pack } = useRemembered('reorder-list', 1, SAMPLE, mode);
  const [busy, setBusy] = useState(false);
  const [dropped, setDropped] = useState(null);   // {fileName, headers, rows, mapping}
  const [readError, setReadError] = useState(null);
  const fileRef = useRef(null);

  const r = useMemo(() => computeReorder(state), [state]);

  const takeFile = async (file) => {
    if (!file) return;
    setReadError(null);
    try {
      const sheet = await readSheet(file);
      if (!sheet.rows.length) { setReadError('That sheet has no rows in it.'); return; }
      const mapping = guessColumns(sheet.headers, HINTS);
      setDropped({ ...sheet, mapping });
    } catch (e) {
      setReadError('That file could not be read as a spreadsheet. ' + (e?.message ?? ''));
    }
  };

  const applyMapping = () => {
    const mapped = mapColumns(dropped.rows, dropped.mapping, {
      onHand: cellNumber, usage: cellNumber, leadDays: cellNumber,
    }).filter((row) => row.name);
    setState((s) => ({
      ...s,
      items: mapped.map((m) => ({ ...m, periodDays: s.periodDays })),
    }));
    setDropped(null);
  };

  const doExport = async () => {
    setBusy(true);
    try {
      await exportRows('reorder-list.xlsx', 'Reorder',
        r.order.map((i) => ({
          Item: i.name, On_hand: i.onHand,
          Used_per_day: Number(i.daily.toFixed(3)),
          Days_of_cover: i.cover == null ? '' : Number(i.cover.toFixed(1)),
          Lead_days: i.leadDays,
          Order_in_days: i.orderInDays == null ? '' : Number(i.orderInDays.toFixed(1)),
          Order_qty: i.qty,
        })),
        [30, 9, 13, 14, 10, 14, 10]);
    } finally { setBusy(false); }
  };

  return (
    <div style={pageFor("reorder-list")} data-demo="reorder-list">
      <ToolHeader toolId="reorder-list" house={SHOP} occasion="sample stock list" name="Reorder List" status={status} restored={restored} pack={pack} remembers="stock list">
        How long each line lasts at the usage you give it, and when the order has to go to beat the
        lead time. Drop your own stock export and tell it which column means what. The file is read
        by this page and never uploaded — nothing you drop or type leaves your browser.
      </ToolHeader>

      <Readout items={[
        { label: 'Order today', value: r.counts.now,
          tone: r.counts.now ? 'bad' : 'good',
          note: 'cover is already inside the lead time' },
        { label: 'Order this week', value: r.counts.week,
          tone: r.counts.week ? 'warn' : undefined },
        { label: 'Fine for now', value: r.counts.ok },
        { label: 'Cannot be worked out', value: r.counts.unknown + r.counts.unreadable,
          tone: (r.counts.unknown + r.counts.unreadable) ? 'warn' : undefined,
          note: 'no usage, or a cell that could not be read' },
      ]} />

      <div style={wrap}>
        <Problems heading="Check these before you send the order" items={r.problems} />

        {/* Local on purpose: this reports a file that could not be READ, which is
            not one of the engine's problems. It was on the dark era's near-black
            ground; it is on the shared wash now, at this paper's own corner. */}
        {readError && (
          <div role="alert" style={{ background: A.badTint, border: `${S.rule} solid ${A.bad}`, borderRadius: S.radius, padding: '12px 14px', marginBottom: 14, fontSize: 13 }}>
            {readError}
          </div>
        )}

        {dropped && (
          <Panel
            title={`Which column is which — ${dropped.fileName}`}
            note="These are guesses from your own headers, shown so you can correct them. A tool that matched the wrong column silently would do confident arithmetic on the wrong number."
            right={<span style={{ display: 'flex', gap: 8 }}><Btn small onClick={() => setDropped(null)}>Cancel</Btn><Btn small primary onClick={applyMapping}>Use these columns</Btn></span>}
          >
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              {Object.keys(HINTS).map((field) => (
                <label key={field} style={{ display: 'block' }}>
                  <span style={{ display: 'block', fontSize: 11, color: T.textSec, marginBottom: 4 }}>
                    {{ name: 'Item name', onHand: 'On hand', usage: 'Used in the period', leadDays: 'Lead time in days' }[field]}
                  </span>
                  <select
                    value={dropped.mapping[field] ?? ''}
                    onChange={(e) => setDropped((d) => ({ ...d, mapping: { ...d.mapping, [field]: e.target.value || null } }))}
                    style={{ background: T.bg, color: dropped.mapping[field] ? T.text : A.warn, border: `${S.rule} solid ${T.border}`, borderRadius: S.radiusSm, padding: '7px 9px', fontSize: 13, fontFamily: FONT_BODY, maxWidth: 220 }}
                  >
                    <option value="">— not in this file —</option>
                    {dropped.headers.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </label>
              ))}
            </div>
            <p style={{ margin: '10px 0 0', fontSize: 12, color: T.textMuted }}>
              {dropped.rows.length} rows on sheet “{dropped.sheetName}”. Anything left as “not in
              this file” comes in as zero, and the lines it affects are named above once loaded.
            </p>
          </Panel>
        )}

        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'minmax(0, 2fr) minmax(290px, 1fr)', alignItems: 'start' }}>
          <div>
            <Panel
              title={`Order now or this week — ${r.counts.now + r.counts.week}`}
              note="Soonest first. Order-in-days is your cover, less the lead time, less whatever buffer you asked for."
              right={<Btn small primary onClick={doExport}>{busy ? 'Building…' : 'Export the order'}</Btn>}
            >
              {r.order.length === 0 ? (
                <p style={{ margin: 0, fontSize: 13, color: T.textMuted }}>Nothing needs ordering at the cover you have set.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
                    <thead><tr><th style={th}>Item</th><th style={thN}>On hand</th><th style={thN}>A day</th><th style={thN}>Lasts</th><th style={thN}>Lead</th><th style={thN}>Order in</th><th style={thN}>Bring in</th></tr></thead>
                    <tbody>
                      {r.order.map((i) => (
                        <tr key={i.id} style={{ background: i.state === 'order now' ? A.badTint : 'transparent' }}>
                          <td style={td}>{i.name}</td>
                          <td style={tdN}>{i.onHand}</td>
                          <td style={{ ...tdN, color: T.textMuted }}>{i.daily.toFixed(2)}</td>
                          <td style={tdN}>{i.cover == null ? '—' : i.cover.toFixed(1) + ' days'}</td>
                          <td style={{ ...tdN, color: T.textMuted }}>{i.leadDays}</td>
                          <td style={{ ...tdN, fontWeight: 700, color: STATE[i.state].color }}>
                            {i.orderInDays <= 0 ? 'now' : i.orderInDays.toFixed(1) + ' days'}
                          </td>
                          <td style={{ ...tdN, fontWeight: 700, color: A.brass }}>{i.qty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>

            <Panel
              title="The whole list"
              note="Used in the period divided by the days in it gives a day's usage. On hand divided by that is how long it lasts. That is the entire calculation."
              right={<Btn small onClick={() => patch((s) => { s.items.push({ id: uid('i'), name: 'New item', onHand: 0, usage: 0, periodDays: s.periodDays, leadDays: 0 }); })}>Add an item</Btn>}
            >
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620 }}>
                  <thead><tr><th style={th}>Item</th><th style={thN}>On hand</th><th style={thN}>Used</th><th style={thN}>Lead days</th><th style={thN}>Lasts</th><th style={th}>State</th><th style={th} /></tr></thead>
                  <tbody>
                    {r.rows.map((i, ix) => (
                      <tr key={i.id}>
                        <td style={td}><Cell label={`name for ${i.name}`} mono={false} w={168} value={i.name} onChange={(v) => patch((n) => { n.items[ix].name = v; })} /></td>
                        <td style={tdN}><Cell label={`on hand for ${i.name}`} w={56} value={i.onHand == null ? '' : String(i.onHand)} onChange={(v) => patch((n) => { n.items[ix].onHand = toNumber(v); })} /></td>
                        <td style={tdN}><Cell label={`used in the period for ${i.name}`} w={56} value={i.usage == null ? '' : String(i.usage)} onChange={(v) => patch((n) => { n.items[ix].usage = toNumber(v); })} /></td>
                        <td style={tdN}><Cell label={`lead days for ${i.name}`} w={52} value={i.leadDays == null ? '' : String(i.leadDays)} onChange={(v) => patch((n) => { n.items[ix].leadDays = toNumber(v); })} /></td>
                        <td style={{ ...tdN, color: T.textMuted }}>{i.cover == null ? '—' : i.cover.toFixed(1)}</td>
                        <td style={{ ...td, color: STATE[i.state].color, fontWeight: 700, whiteSpace: 'nowrap' }}>{STATE[i.state].label}</td>
                        <td style={{ ...td, textAlign: 'right' }}><Btn small onClick={() => patch((n) => { n.items.splice(ix, 1); })}>×</Btn></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>

          <div>
            <Panel title="Bring your own list" note="Whatever your system exports. The page reads it here — it is not uploaded, and there is nowhere for it to go.">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); takeFile(e.dataTransfer.files?.[0]); }}
                onClick={() => fileRef.current?.click()}
                style={{
                  border: `${S.rule} dashed ${T.border}`, borderRadius: S.radius, padding: '22px 14px',
                  textAlign: 'center', cursor: 'pointer', color: T.textSec, fontSize: 13, lineHeight: 1.6,
                }}
              >
                Drop a spreadsheet here, or click to pick one.
                <span style={{ display: 'block', fontSize: 11.5, color: T.textMuted, marginTop: 6 }}>
                  .xlsx, .xls or .csv — it is read in your browser
                </span>
              </div>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }}
                onChange={(e) => takeFile(e.target.files?.[0])} />
            </Panel>

            <Panel title="Your rules" note="All three are yours, and the buffer starts at nothing on purpose.">
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Field label="Usage covers" suffix="days" w={54} value={String(state.periodDays)}
                  onChange={(v) => patch((s) => { const d = toNumber(v); s.periodDays = d; s.items.forEach((i) => { i.periodDays = d; }); })} />
                <Field label="Buffer" suffix="days" w={54} value={String(state.bufferDays)}
                  hint="zero unless you set it"
                  onChange={(v) => patch((s) => { s.bufferDays = toNumber(v); })} />
                <Field label="Order enough for" suffix="days" w={54} value={String(state.horizonDays)}
                  onChange={(v) => patch((s) => { s.horizonDays = toNumber(v); })} />
              </div>
              <div style={{ marginTop: 12 }}><Btn small onClick={reset}>Reset to the sample</Btn></div>
            </Panel>

            <Panel title="Where the list stands">
              <p style={{ margin: 0, fontSize: 38, fontWeight: 700, fontFamily: FONT_DATA, color: r.counts.now > 0 ? A.bad : A.good, lineHeight: 1.1 }}>
                {r.counts.now}
              </p>
              <p style={{ margin: '6px 0 0', fontSize: 12.5, color: T.textSec, lineHeight: 1.6 }}>
                need ordering today, with {r.counts.week} due inside a week, {r.counts.ok} fine for
                now and {r.counts.unknown} with no usage to divide by.
                {r.counts.unreadable > 0 && ` ${r.counts.unreadable} could not be read at all and ${r.counts.unreadable === 1 ? 'is' : 'are'} left out of every figure above.`}
              </p>
            </Panel>

            <WontDo items={[
              'It forecasts nothing. Usage is your figure from your own history — nothing is fitted, smoothed, or weighted toward recent weeks.',
              'It invents no safety stock. The buffer starts at zero and stays there unless you set it, because a margin nobody chose is a number this page made up.',
              'It will not tell you the date you run out. “At the usage you entered this lasts eleven days” is division; “you run out on the 4th” is a promise about the future.',
              'Your file is read here in the browser. It is not uploaded, not stored, and there is nowhere for it to go.',
            ]} />
          </div>
        </div>
      </div>
    </div>
  );
}
