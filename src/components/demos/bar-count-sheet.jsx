// ============================================================================
// BAR COUNT SHEET — The Salt Line, Marker Nine (portfolio demo)
//
// The Sunday-night count. What was on the shelf, what came in, what is left —
// and therefore what poured, what it cost, and what to order back up to par.
//
// The rule here is the bar's own from end to end: its product list, its unit
// costs, its par levels, and its own target if it has one. No platform has taken
// this job because none of those travel. The card reader knows what was sold; it
// does not know that the well vodka is a 1.75 and the call is a 750, or that this
// house keeps four back-ups of one gin and one of another.
//
// THE HONESTY CONTRACT, and it is not negotiable.
// Every figure is the bar's own count and the bar's own cost, run through
// arithmetic printed beside the answer. No suggested par, no industry pour cost,
// nothing compared against what other bars run. A target is an input and starts
// blank. And it never compares what was used against what SHOULD have been used:
// that needs a recipe for every drink and a pour size for every pour, and
// inventing them would print a confident variance with nothing under it.
//
// COUNTS ARE INTEGER HUNDREDTHS OF A UNIT AND MONEY IS INTEGER CENTS. A bar
// counts half a bottle, and a hundred lines of decimals drift in binary floating
// point. See src/lib/bar-count.js.
//
// Built by Ian Provencher · AppliedIQ Solutions
// Public demo — the business, the shelf and the week are invented.
// ============================================================================

import React, { useMemo, useState } from 'react';
import { computeCount } from '../../lib/bar-count.js';
import { T, A, S, TOWN, FONT_BODY, FONT_DATA, ToolHeader, Panel, Btn, Cell, Field, Problems, WontDo, useRemembered, toCents, toHundredths, toNumber, toOptionalNumber, cash, plain, uid, page, wrap, th, thN, td, tdN, exportRows, pageFor, Readout } from '../kit/shelf.jsx';

const HOUSE = 'The Salt Line';

// ============================================================================
// THE SAMPLE — one week on a made-up back bar in a made-up town.
// Counts are hundredths of a unit: 250 is two and a half bottles.
// ============================================================================
const SAMPLE = {
  week: 'Week ending Sunday',
  sales: { Liquor: 380000, Beer: 498000, Wine: 146000 },
  target: null,
  products: [
    { id: 'a1', name: 'Well vodka 1.75L', category: 'Liquor', unitCost: 2200, opening: 800, received: 1200, closing: 600, par: 900 },
    { id: 'a2', name: 'Call gin 750ml', category: 'Liquor', unitCost: 2650, opening: 400, received: 400, closing: 200, par: 500 },
    { id: 'a3', name: 'Rye 750ml', category: 'Liquor', unitCost: 3100, opening: 300, received: 300, closing: 200, par: 400 },
    { id: 'a4', name: 'Blanco tequila 750ml', category: 'Liquor', unitCost: 2875, opening: 250, received: 500, closing: 250, par: 400 },
    { id: 'b1', name: 'House lager 1/2 bbl', category: 'Beer', unitCost: 14500, opening: 200, received: 400, closing: 300, par: 400 },
    { id: 'b2', name: 'Local IPA 1/6 bbl', category: 'Beer', unitCost: 8900, opening: 400, received: 600, closing: 500, par: 600 },
    { id: 'b3', name: 'Bottled domestic, case', category: 'Beer', unitCost: 2400, opening: 600, received: 900, closing: 600, par: 800 },
    { id: 'w1', name: 'House red 750ml', category: 'Wine', unitCost: 1150, opening: 1200, received: 1800, closing: 1200, par: 1500 },
    { id: 'w2', name: 'House white 750ml', category: 'Wine', unitCost: 1150, opening: 1000, received: 1500, closing: 1000, par: 1500 },
  ],
};

// ============================================================================
// THEME — the shelf's shared instrument look. Slate base, brass accent.
// ============================================================================
/* THE THEME, THE CHROME, THE PARSING AND THE STORAGE ALL LIVE IN
   ../kit/shelf.jsx as of 2026-08-25. They were written here first, copied into
   the second tool, and only then extracted — which is the right order, because
   two tools built on deliberately different arithmetic are what showed which
   parts were genuinely shared rather than merely looked it.

   What stays in this file is this tool's own markup and its own sample. What
   left was every part that had nothing to do with the job it does. */


export default function BarCountSheet({ mode = 'demo' }) {
  const { state, patch, reset, status, restored, pack } = useRemembered('bar-count-sheet', 1, SAMPLE, mode);
  const [busy, setBusy] = useState(false);

  const r = useMemo(() => computeCount(state), [state]);
  const exportSheet = async () => {
    setBusy(true);
    try {
      const XLSX = await import('xlsx');
      const rows = r.rows.map((p) => ({
        Product: p.name, Category: p.category,
        Opening: p.opening / 100, Received: p.received / 100, Closing: p.closing / 100,
        Used: p.used / 100,
        Unit_cost: Number((p.unitCost / 100).toFixed(2)),
        Cost_used: Number((p.cost / 100).toFixed(2)),
        Par: p.par / 100, Order: p.toOrder,
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      ws['!cols'] = [{ wch: 26 }, { wch: 10 }, { wch: 9 }, { wch: 9 }, { wch: 9 }, { wch: 8 }, { wch: 10 }, { wch: 11 }, { wch: 7 }, { wch: 7 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Count');
      XLSX.writeFile(wb, 'bar-count.xlsx');
    } finally { setBusy(false); }
  };

  /* Local table-style copies removed 2026-08-26 — they shadowed the kit and
     silently pinned this file to the old geometry. */

  return (
    <div style={pageFor("bar-count-sheet")} data-demo="bar-count-sheet">
      <ToolHeader
        toolId="bar-count-sheet" house={HOUSE} occasion="Sunday count" name="Bar Count Sheet"
        status={status} restored={restored} pack={pack} remembers="shelf"
      >
        What poured, what it cost, and what to order back to par. Every figure is your own count
        and your own till. Nothing here is a benchmark and nothing is compared against what other
        bars run. Nothing you type leaves this page.
      </ToolHeader>

      <Readout items={[
        { label: 'Poured', value: cash(r.totalCost), note: 'at what it cost you' },
        { label: 'Rang through', value: cash(r.totalRevenue) },
        { label: 'Pour cost', value: r.totalPourCost == null ? null : r.totalPourCost.toFixed(1) + '%',
          note: r.target == null ? 'your target is blank on purpose' : 'against your own ' + r.target + '%',
          tone: r.vsTarget == null ? undefined : (r.vsTarget <= 0 ? 'good' : 'warn') },
        { label: 'To order back to par', value: r.orderList.length,
          note: r.orderList.length === 1 ? 'line below par' : 'lines below par' },
      ]} />

      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        {/* Was a hand-rolled copy of the kit's Problems panel on a dark-era
            near-black ground. Same heading, same items, shared component. */}
        <Problems heading="Check the count before you trust these numbers" items={r.problems} />

        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', alignItems: 'start', marginBottom: 14 }}>
          {r.byCategory.map((c) => (
            <div key={c.category} style={{ background: T.surface, border: `${S.rule} solid ${T.border}`, borderRadius: S.radius, padding: 14 }}>
              <p style={{ margin: 0, fontFamily: FONT_DATA, fontSize: 11, letterSpacing: 1, color: T.textSec, textTransform: 'uppercase' }}>{c.category}</p>
              <p style={{ margin: '6px 0 0', fontSize: 26, fontWeight: 700, color: c.pourCost == null ? T.textMuted : A.brass, fontFamily: FONT_DATA }}>
                {c.pourCost == null ? '—' : c.pourCost.toFixed(1) + '%'}
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: T.textMuted, lineHeight: 1.5 }}>
                {c.pourCost == null
                  ? 'No ' + c.category.toLowerCase() + ' sales entered, so this cannot be worked out.'
                  : <>{cash(c.cost)} poured ÷ {cash(c.revenue)} sold</>}
              </p>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'minmax(0, 2.1fr) minmax(280px, 1fr)', alignItems: 'start' }}>
          <div>
            <Panel
              title="The shelf"
              note="Counts are in units and half-units — 2.5 is two and a half. Used is what you started with, plus what came in, minus what is left."
              right={<Btn small onClick={() => patch((s) => { s.products.push({ id: uid('p'), name: 'New product', category: 'Liquor', unitCost: 0, opening: 0, received: 0, closing: 0, par: 0 }); })}>Add a product</Btn>}
            >
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                  <thead>
                    <tr>
                      <th style={th}>Product</th><th style={th}>Kind</th>
                      <th style={thN}>Open</th><th style={thN}>In</th><th style={thN}>Close</th>
                      <th style={thN}>Used</th><th style={thN}>Each</th><th style={thN}>Cost</th>
                      <th style={thN}>Par</th><th style={thN}>Order</th><th style={th} />
                    </tr>
                  </thead>
                  <tbody>
                    {r.rows.map((p, i) => (
                      <tr key={p.id} style={{ background: p.used < 0 ? A.badTint : 'transparent' }}>
                        <td style={td}>
                          <Cell label={`name for ${p.name}`} mono={false} w={128} value={p.name} onChange={(v) => patch((n) => { n.products[i].name = v; })} />
                        </td>
                        <td style={td}>
                          <Cell label={`kind for ${p.name}`} mono={false} w={66} value={p.category} onChange={(v) => patch((n) => { n.products[i].category = v; })} />
                        </td>
                        <td style={tdN}><Cell label={`opening count for ${p.name}`} value={plain(p.opening)} onChange={(v) => patch((n) => { n.products[i].opening = toHundredths(v); })} /></td>
                        <td style={tdN}><Cell label={`received for ${p.name}`} value={plain(p.received)} onChange={(v) => patch((n) => { n.products[i].received = toHundredths(v); })} /></td>
                        <td style={tdN}><Cell label={`closing count for ${p.name}`} value={plain(p.closing)} onChange={(v) => patch((n) => { n.products[i].closing = toHundredths(v); })} /></td>
                        <td style={{ ...tdN, fontWeight: 700, color: p.used < 0 ? A.bad : T.text }}>{plain(p.used)}</td>
                        <td style={tdN}><Cell label={`cost each for ${p.name}`} w={64} value={(p.unitCost / 100).toFixed(2)} onChange={(v) => patch((n) => { n.products[i].unitCost = toCents(v); })} /></td>
                        <td style={{ ...tdN, color: A.brass, fontWeight: 700 }}>{cash(p.cost)}</td>
                        <td style={tdN}><Cell label={`par level for ${p.name}`} value={plain(p.par)} onChange={(v) => patch((n) => { n.products[i].par = toHundredths(v); })} /></td>
                        <td style={{ ...tdN, fontWeight: 700, color: p.toOrder > 0 ? A.good : T.textMuted }}>{p.toOrder || '—'}</td>
                        <td style={{ ...td, textAlign: 'right' }}>
                          <Btn small onClick={() => patch((n) => { n.products.splice(i, 1); })}>×</Btn>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>

          <div>
            <Panel title="The week" note="What each kind sold, from your own till. These are the only numbers the pour cost is divided by.">
              {r.categories.map((c) => (
                <label key={c} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: T.textSec }}>{c} sales</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ color: T.textMuted, fontFamily: FONT_DATA, fontSize: 13 }}>$</span>
                    <Cell w={96} value={((state.sales[c] ?? 0) / 100).toFixed(2)} onChange={(v) => patch((n) => { n.sales[c] = toCents(v); })} />
                  </span>
                </label>
              ))}
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 14, paddingTop: 12, borderTop: '1px solid ' + T.border }}>
                <span style={{ fontSize: 13, color: T.textSec }}>Your target, if you have one</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Cell w={56} value={state.target == null ? '' : String(state.target)} onChange={(v) => patch((n) => { n.target = toOptionalNumber(v); })} />
                  <span style={{ color: T.textMuted, fontFamily: FONT_DATA, fontSize: 13 }}>%</span>
                </span>
              </label>
              <p style={{ margin: '6px 0 0', fontSize: 11.5, color: T.textMuted, lineHeight: 1.5 }}>
                Blank on purpose. Whatever a bar down the road runs is not your target, and this page
                will never fill it in for you.
              </p>
            </Panel>

            <Panel title="The week's number" right={
              <span style={{ display: 'flex', gap: 8 }}>
                <Btn small onClick={reset}>Reset</Btn>
                <Btn small primary onClick={exportSheet}>{busy ? 'Building…' : 'Export'}</Btn>
              </span>
            }>
              <p style={{ margin: 0, fontSize: 40, fontWeight: 700, fontFamily: FONT_DATA, color: r.totalPourCost == null ? T.textMuted : A.brass, lineHeight: 1.1 }}>
                {r.totalPourCost == null ? '—' : r.totalPourCost.toFixed(1) + '%'}
              </p>
              <p style={{ margin: '6px 0 0', fontSize: 12.5, color: T.textSec, lineHeight: 1.6 }}>
                {r.totalPourCost == null
                  ? 'Enter what each kind sold and this works itself out.'
                  : <>{cash(r.totalCost)} came off the shelf ÷ {cash(r.totalRevenue)} rang through the till.</>}
              </p>
              {r.vsTarget != null && (
                <p style={{ margin: '10px 0 0', fontSize: 13, lineHeight: 1.55, color: r.vsTarget > 0 ? A.bad : A.good }}>
                  {r.vsTarget > 0
                    ? <><strong>{r.vsTarget.toFixed(1)} points over</strong> the {r.target}% you set.</>
                    : <><strong>{Math.abs(r.vsTarget).toFixed(1)} points under</strong> the {r.target}% you set.</>}
                </p>
              )}
            </Panel>

            <Panel title="What to order" note="Par minus what is left, rounded up — you cannot order part of a bottle.">
              {r.orderList.length === 0 ? (
                <p style={{ margin: 0, fontSize: 13, color: T.textMuted }}>Nothing is below par. Nothing to order.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {r.orderList.map((p) => (
                      <tr key={p.id}>
                        <td style={td}>{p.name}<span style={{ display: 'block', fontSize: 11, color: T.textMuted }}>{plain(p.closing)} left, par {plain(p.par)}</span></td>
                        <td style={{ ...tdN, fontWeight: 700, color: A.good, fontSize: 16 }}>{p.toOrder}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Panel>

            <Panel title="What this will not do">
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.65, color: T.textSec }}>
                <li>It will not tell you what your pour cost should be, or what to set a par at. Those are yours.</li>
                <li>It does not know what other bars run, and it will never compare you to them.</li>
                <li>It will not tell you what you <em>should</em> have poured. That needs a recipe and a pour size for every drink you make, and guessing them would print a confident number with nothing under it.</li>
                <li>Nothing you type is sent anywhere, stored by anyone, or seen by me. It is arithmetic in your own browser.</li>
              </ul>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}
