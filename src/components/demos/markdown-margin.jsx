// ============================================================================
// MARKDOWN MARGIN — Tern Street Goods (portfolio demo)
//
// A markdown is decided standing in front of a rail, in whole dollars, off the
// sticker price. What it does to the margin is a different number in the
// owner's head every time, because the cost sits in a different system from the
// price and neither of them is in the till.
//
// WHAT THIS REFUSES IS THE HONEST HALF. The real cost of a markdown is the
// margin given up on units that would have sold anyway, LESS the margin gained
// on units that only sold because of the discount. The second half needs a
// counterfactual about a week that did not happen, and nothing a shop holds
// contains it. Every markdown calculator on the internet answers it anyway, by
// quietly assuming either that nothing extra sells or that everything does.
// This one says so on the page and shows the two figures it can stand behind.
//
// MARGIN IS ON THE PRICE. Markup is on the cost. People say them
// interchangeably and they are different numbers, so both are shown.
//
// Built by Ian Provencher · AppliedIQ Solutions
// Public demo — the shop, the rail and every price are invented.
// ============================================================================

import React, { useMemo, useState } from 'react';
import { computeMarkdown } from '../../lib/markdown-margin.js';
import { T, A, S, FONT_DATA, Panel, Btn, Cell, Field, ToolHeader, Problems, WontDo, useRemembered, toCents, toHundredths, toNumber, cash, uid, wrap, th, thN, td, tdN, exportRows, pageFor, Readout } from '../kit/shelf.jsx';

const SHOP = 'Tern Street Goods';

// ============================================================================
// THE SAMPLE RAIL — the same figures scripts/verify-tools.mjs works out by hand.
// A 35% floor, and two lines that go under it.
// ============================================================================
const SAMPLE = {
  floorHundredths: 3500,
  lines: [
    { id: 'm1', name: 'Deck jacket', costCents: 4200, priceCents: 9800, markdownCents: 2000, qty: 6 },
    { id: 'm2', name: 'Chart kit', costCents: 1850, priceCents: 2600, markdownCents: 600, qty: 12 },
    { id: 'm3', name: 'Rope, 50 ft', costCents: 2400, priceCents: 3900, markdownCents: 500, qty: 20 },
    { id: 'm4', name: 'Wool cap', costCents: 900, priceCents: 2200, markdownCents: 700, qty: 15 },
  ],
};

const pctText = (h) => (h == null ? '—' : `${(h / 100).toFixed(1)}%`);

export default function MarkdownMargin({ mode = 'demo' }) {
  const { state, patch, reset, status, restored, pack } = useRemembered('markdown-margin', 1, SAMPLE, mode);
  const [busy, setBusy] = useState(false);
  const r = useMemo(() => computeMarkdown(state), [state]);

  const doExport = async () => {
    setBusy(true);
    try {
      await exportRows('markdown-margin.xlsx', 'Rail',
        r.lines.map((l) => ({
          Item: l.name,
          Cost: Number((l.cost / 100).toFixed(2)),
          Was: Number((l.price / 100).toFixed(2)),
          Markdown: Number((l.cut / 100).toFixed(2)),
          Now: Number((l.newPrice / 100).toFixed(2)),
          Margin_was_pct: l.wasMargin == null ? '' : Number((l.wasMargin / 100).toFixed(2)),
          Margin_now_pct: l.nowMargin == null ? '' : Number((l.nowMargin / 100).toFixed(2)),
          Markup_now_pct: l.nowMarkup == null ? '' : Number((l.nowMarkup / 100).toFixed(2)),
          On_hand: l.qty,
          Makes_if_all_sells: Number((l.makesIfAllSells / 100).toFixed(2)),
        })).concat([{}, {
          Item: 'Retail before the markdown',
          Makes_if_all_sells: Number((r.totals.retailWas / 100).toFixed(2)),
        }, {
          Item: 'Retail after it',
          Makes_if_all_sells: Number((r.totals.retailNow / 100).toFixed(2)),
        }, {
          Item: 'The rail makes IF IT ALL SELLS',
          Makes_if_all_sells: Number((r.totals.makesIfAllSells / 100).toFixed(2)),
        }, {
          Item: 'NOT the cost of the markdown — see the page',
        }]),
        [20, 10, 10, 11, 10, 15, 15, 15, 9, 20]);
    } finally { setBusy(false); }
  };

  return (
    <div style={pageFor('markdown-margin')} data-demo="markdown-margin">
      <ToolHeader toolId="markdown-margin" house={SHOP} occasion="sample rail" name="Markdown Margin Check" status={status} restored={restored} pack={pack} remembers="margin floor and your rail">
        What a sale does to the margin on each line, against the floor you decided you will not go
        below. It will not tell you what the markdown COSTS you — that needs a counterfactual about a
        week that did not happen, and it says so rather than guessing. Nothing you type leaves this page.
      </ToolHeader>

      <Readout items={[
        { label: 'Margin after the markdown', value: pctText(r.totals.marginNow),
          tone: r.totals.floor != null && r.totals.marginNow != null && r.totals.marginNow < r.totals.floor ? 'bad' : 'good',
          note: `it was ${pctText(r.totals.marginWas)} before, across the whole rail` },
        { label: 'Under your floor', value: String(r.totals.underFloor),
          tone: r.totals.underFloor > 0 ? 'bad' : 'good',
          note: r.totals.floor == null ? 'no floor is set, so nothing can be under one' : `lines below ${pctText(r.totals.floor)}` },
        { label: 'The rail makes', value: cash(r.totals.makesIfAllSells),
          note: 'if every one of them sells — which is an if, not a forecast' },
        { label: 'Off the ticket', value: cash(r.totals.gaveUpIfAllSells),
          note: 'and this is NOT what the markdown costs you — see below' },
      ]} />

      <div style={wrap}>
        <Problems heading="Look at these before the stickers go on" items={r.problems} />

        <div className="aiq-split" style={{ '--aiq-split': '1.9fr' }}>
          <div>
            <Panel
              title="The rail"
              note="Margin is on the price. Markup is on the cost. Both are shown because people say them interchangeably and they are not the same number."
              right={<Btn small onClick={() => patch((s) => { s.lines.push({ id: uid('m'), name: 'New line', costCents: 0, priceCents: 0, markdownCents: 0, qty: 0 }); })}>Add a line</Btn>}
            >
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
                  <thead>
                    <tr>
                      <th style={th}>Item</th><th style={thN}>Cost</th><th style={thN}>Was</th>
                      <th style={thN}>Off</th><th style={thN}>Now</th><th style={thN}>Margin</th>
                      <th style={thN}>On hand</th><th style={thN}>Makes</th><th style={th} />
                    </tr>
                  </thead>
                  <tbody>
                    {r.lines.map((l, i) => (
                      <tr key={l.id} style={{ background: l.belowCost || l.wasBelowCost ? A.badTint : (l.underFloor ? A.warnTint : 'transparent') }}>
                        <td style={td}><Cell label={`name of line ${i + 1}`} mono={false} w={120} value={l.name} onChange={(v) => patch((n) => { n.lines[i].name = v; })} /></td>
                        <td style={tdN}><Cell label={`what ${l.name} cost you`} w={62} value={(l.cost / 100).toFixed(2)} onChange={(v) => patch((n) => { n.lines[i].costCents = toCents(v); })} /></td>
                        <td style={tdN}><Cell label={`ticket price of ${l.name}`} w={62} value={(l.price / 100).toFixed(2)} onChange={(v) => patch((n) => { n.lines[i].priceCents = toCents(v); })} /></td>
                        <td style={tdN}><Cell label={`markdown on ${l.name}`} w={62} value={(l.cut / 100).toFixed(2)} onChange={(v) => patch((n) => { n.lines[i].markdownCents = toCents(v); })} /></td>
                        <td style={{ ...tdN, fontWeight: 700 }}>{cash(l.newPrice)}</td>
                        <td style={{ ...tdN, color: l.underFloor ? A.bad : T.textSec }}>
                          {pctText(l.nowMargin)}
                          <span style={{ display: 'block', fontSize: 10, color: T.textMuted }}>
                            was {pctText(l.wasMargin)} · markup {pctText(l.nowMarkup)}
                          </span>
                        </td>
                        <td style={tdN}><Cell label={`how many ${l.name} on hand`} w={46} value={String(l.qty)} onChange={(v) => patch((n) => { n.lines[i].qty = Math.round(toNumber(v)); })} /></td>
                        <td style={{ ...tdN, fontWeight: 700, color: l.nowPerUnit < 0 ? A.bad : A.brass }}>{cash(l.makesIfAllSells)}</td>
                        <td style={{ ...td, textAlign: 'right' }}><Btn small onClick={() => patch((n) => { n.lines.splice(i, 1); })}>×</Btn></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>

          <div>
            <Panel title="Your floor" note="The margin this shop will not go under. It comes from your rent and your staff, and nothing here suggests one.">
              <Field label="Margin floor" suffix="%" w={92} value={r.totals.floor == null ? '' : (r.totals.floor / 100).toFixed(2)} onChange={(v) => patch((n) => { n.floorHundredths = toHundredths(v); })} />
              <p style={{ margin: '9px 0 0', fontSize: 11.5, color: T.textMuted, lineHeight: 1.55 }}>
                Two shops on the same street will not have the same floor, which is exactly why this
                is a box rather than a default.
              </p>
            </Panel>

            <Panel title="This rail" right={
              <span style={{ display: 'flex', gap: 8 }}>
                <Btn small onClick={reset}>Reset</Btn>
                <Btn small primary onClick={doExport}>{busy ? 'Building…' : 'Export'}</Btn>
              </span>
            }>
              <p style={{ margin: 0, fontSize: 34, fontWeight: 700, fontFamily: FONT_DATA, lineHeight: 1.1, color: A.brass }}>
                {cash(r.totals.makesIfAllSells)}
              </p>
              <p style={{ margin: '6px 0 0', fontSize: 12.5, color: T.textSec, lineHeight: 1.6 }}>
                on {r.totals.units} units, down from {cash(r.totals.retailWas)} of ticket
                to {cash(r.totals.retailNow)}.
              </p>
              <p style={{ margin: '12px 0 0', fontSize: 12, color: T.textMuted, lineHeight: 1.6, paddingTop: 10, borderTop: `${S.rule} solid ${T.border}` }}>
                <strong style={{ color: T.textSec }}>{cash(r.totals.gaveUpIfAllSells)} is off the ticket
                and it is NOT what the markdown cost you.</strong> The real cost is the margin given up
                on what would have sold anyway, less the margin gained on what only sold because of the
                sticker. The second half needs a week that did not happen, so this page does not have
                it and will not pretend to.
              </p>
            </Panel>

            <WontDo items={[
              'It will not tell you what a markdown cost you. That needs to know how many extra sold BECAUSE of it, which is a week that did not happen — and every calculator that answers it is quietly assuming either none or all of them.',
              'It will not suggest a markdown, or a margin floor. Those are the two decisions a shop is actually paid to make.',
              'It will not compare your margin to a published figure. Somebody else’s margin is somebody else’s rent.',
              'It will not tell you whether to mark down. A line that loses margin can still be the one that clears the rail for the season.',
              'It does not forecast demand or model an elasticity. Nothing here is fitted to anything.',
            ]} />
          </div>
        </div>
      </div>
    </div>
  );
}
