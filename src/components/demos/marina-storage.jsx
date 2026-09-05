// ============================================================================
// MARINA STORAGE BILLING — Marker Nine Boatyard (portfolio demo)
//
// Marinas bill by the foot, at a different rate for a wet slip, a dry stack and
// a boat sitting on the hard, with a minimum for the small ones and a surcharge
// for anybody living aboard. Every yard's rate card is its own invention, which
// is why this is still done in a spreadsheet on the first of the month.
//
// SAME ENGINE AS THE COMMISSION CHECK, deliberately. Both take a line item, find
// the rate that applies, and work out what it comes to — so both use
// src/lib/rate-card.js rather than being two copies that drift apart.
//
// THE HONESTY CONTRACT. Every rate is the yard's own. There is no suggested rate
// per foot, nothing compared against what other marinas charge, and a boat down
// as a kind with no rate on the card is reported rather than quietly priced at
// something plausible.
//
// Built by Ian Provencher · AppliedIQ Solutions
// Public demo — the yard, the boats and the rate card are invented.
// ============================================================================

import React, { useMemo, useState } from 'react';
import { computeRateCard } from '../../lib/rate-card.js';
import { T, A, S, FONT_DATA, Panel, Btn, Cell, Field, ToolHeader, Problems, WontDo, useRemembered, toCents, toHundredths, cash, plain, uid, page, wrap, th, thN, td, tdN, exportRows, pageFor, Readout } from '../kit/shelf.jsx';

const YARD = 'Marker Nine Boatyard';

// ============================================================================
// THE SAMPLE — one month at a made-up yard in a made-up town.
// Lengths are hundredths of a foot: 3150 is thirty-one and a half feet.
// Rates are cents per foot per month.
// ============================================================================
const SAMPLE = {
  month: 'sample month',
  rates: [
    { id: 'r1', key: 'Wet slip', perUnit: 1450, minimum: 32500 },
    { id: 'r2', key: 'Dry stack', perUnit: 1875, minimum: 40000 },
    { id: 'r3', key: 'On the hard', perUnit: 950, minimum: 18000 },
  ],
  items: [
    { id: 'b1', label: 'Sundog', key: 'Wet slip', qty: 3150, extra: 0, actual: null },
    { id: 'b2', label: 'Cross Current', key: 'Wet slip', qty: 4200, extra: 12500, actual: null },
    { id: 'b3', label: 'Marsh Hen', key: 'Wet slip', qty: 1900, extra: 0, actual: null },
    { id: 'b4', label: 'Second Wind', key: 'Dry stack', qty: 2400, extra: 0, actual: null },
    { id: 'b5', label: 'Bittern', key: 'Dry stack', qty: 1850, extra: 0, actual: null },
    { id: 'b6', label: 'Osprey', key: 'On the hard', qty: 3600, extra: 0, actual: null },
    { id: 'b7', label: 'Little Gull', key: 'On the hard', qty: 1600, extra: 0, actual: null },
    { id: 'b8', label: 'Wrackline', key: 'Wet slip', qty: 5400, extra: 12500, actual: null },
  ],
};

export default function MarinaStorage({ mode = 'demo' }) {
  const { state, patch, reset, status, restored, pack } = useRemembered('marina-storage', 1, SAMPLE, mode);
  const [busy, setBusy] = useState(false);
  const r = useMemo(
    () => computeRateCard({ rates: state.rates, items: state.items, mode: 'rate-times-quantity' }),
    [state],
  );

  const doExport = async () => {
    setBusy(true);
    try {
      await exportRows('marina-billing.xlsx', 'Billing',
        r.rows.map((b) => ({
          Boat: b.label, Kind: b.key, Feet: b.qty / 100,
          Rate_per_foot: b.rate ? Number((b.rate.perUnit / 100).toFixed(2)) : '',
          Base: b.base == null ? 'no rate' : Number((b.base / 100).toFixed(2)),
          Extra: Number((b.extra / 100).toFixed(2)),
          Bill: b.expected == null ? 'no rate' : Number((b.expected / 100).toFixed(2)),
        })).concat([{}, { Boat: 'Month total', Bill: Number((r.totalExpected / 100).toFixed(2)) }]),
        [18, 13, 8, 14, 11, 9, 11]);
    } finally { setBusy(false); }
  };

  return (
    <div style={pageFor("marina-storage")} data-demo="marina-storage">
      <ToolHeader toolId="marina-storage" house={YARD} occasion="sample month" name="Marina Storage Billing" status={status} restored={restored} pack={pack} remembers="rate card">
        Your rate card, your boats, this month's bill. Different rates by kind, a minimum for the
        small ones, and a surcharge line for anybody living aboard. Nothing here is a suggested
        rate and nothing is compared against what other yards charge. Nothing you type leaves
        this page.
      </ToolHeader>

      <Readout items={[
        { label: 'Billed this month', value: cash(r.totalExpected),
          note: r.priced.length + ' ' + (r.priced.length === 1 ? 'boat' : 'boats') + ' on the card' },
        { label: 'Rates in the book', value: r.byRate.length },
        { label: 'At your minimum', value: r.rows.filter((x) => x.atMinimum).length,
          note: 'short boats billed at the floor' },
        { label: 'Not priced', value: r.unpricedCount,
          tone: r.unpricedCount ? 'warn' : undefined,
          note: r.unpricedCount ? 'no rate matches — not billed' : 'every line has a rate' },
      ]} />

      <div style={wrap}>
        <Problems heading="Look at these before you send the bills" items={r.problems} />

        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'minmax(0, 1.8fr) minmax(300px, 1fr)', alignItems: 'start' }}>
          <div>
            <Panel
              title="The boats"
              note="Length in feet — 31.5 is thirty-one and a half. The extra column is for anything flat on top of the footage, a liveaboard fee most often."
              right={<Btn small onClick={() => patch((s) => { s.items.push({ id: uid('b'), label: 'New boat', key: s.rates[0]?.key ?? '', qty: 0, extra: 0, actual: null }); })}>Add a boat</Btn>}
            >
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620 }}>
                  <thead>
                    <tr><th style={th}>Boat</th><th style={th}>Kind</th><th style={thN}>Feet</th><th style={thN}>Rate</th><th style={thN}>Footage</th><th style={thN}>Extra</th><th style={thN}>Bill</th><th style={th} /></tr>
                  </thead>
                  <tbody>
                    {r.rows.map((b, i) => (
                      <tr key={b.id} style={{ background: b.unpriced ? A.badTint : 'transparent' }}>
                        <td style={td}><Cell label={`name for ${b.label}`} mono={false} w={120} value={b.label} onChange={(v) => patch((n) => { n.items[i].label = v; })} /></td>
                        <td style={td}>
                          <select aria-label={`kind of berth for ${b.label}`} value={b.key} onChange={(e) => patch((n) => { n.items[i].key = e.target.value; })}
                            style={{ background: T.bg, color: T.text, border: `${S.rule} solid ${T.border}`, borderRadius: S.radiusSm, padding: '5px 6px', fontSize: 12.5 }}>
                            {state.rates.map((rt) => <option key={rt.id} value={rt.key}>{rt.key}</option>)}
                            {b.unpriced && <option value={b.key}>{b.key}</option>}
                          </select>
                        </td>
                        <td style={tdN}><Cell label={`length in feet for ${b.label}`} w={58} value={plain(b.qty)} onChange={(v) => patch((n) => { n.items[i].qty = toHundredths(v); })} /></td>
                        <td style={{ ...tdN, color: T.textMuted }}>{b.rate ? cash(b.rate.perUnit) : '—'}</td>
                        <td style={{ ...tdN, color: b.atMinimum ? A.warn : T.text }}>
                          {b.base == null ? '—' : cash(b.base)}
                          {b.atMinimum && <span style={{ display: 'block', fontSize: 10, color: A.warn }}>at minimum</span>}
                        </td>
                        <td style={tdN}><Cell label={`extra charge for ${b.label}`} w={62} value={(b.extra / 100).toFixed(2)} onChange={(v) => patch((n) => { n.items[i].extra = toCents(v); })} /></td>
                        <td style={{ ...tdN, fontWeight: 700, color: b.expected == null ? A.bad : A.brass }}>{b.expected == null ? 'no rate' : cash(b.expected)}</td>
                        <td style={{ ...td, textAlign: 'right' }}><Btn small onClick={() => patch((n) => { n.items.splice(i, 1); })}>×</Btn></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>

          <div>
            <Panel
              title="Your rate card"
              note="Per foot per month, with the smallest bill you are willing to send for that kind."
              right={<Btn small onClick={() => patch((s) => { s.rates.push({ id: uid('r'), key: 'New kind', perUnit: 0, minimum: 0 }); })}>Add a kind</Btn>}
            >
              {state.rates.map((rt, i) => (
                <div key={rt.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 9, flexWrap: 'wrap' }}>
                  <Field label="Kind" w={104} value={rt.key} onChange={(v) => patch((n) => { n.rates[i].key = v; })} />
                  <Field label="Per foot" prefix="$" w={70} value={(rt.perUnit / 100).toFixed(2)} onChange={(v) => patch((n) => { n.rates[i].perUnit = toCents(v); })} />
                  <Field label="Minimum" prefix="$" w={78} value={(rt.minimum / 100).toFixed(2)} onChange={(v) => patch((n) => { n.rates[i].minimum = toCents(v); })} />
                  <Btn small onClick={() => patch((n) => { n.rates.splice(i, 1); })}>×</Btn>
                </div>
              ))}
            </Panel>

            <Panel title="The month" right={
              <span style={{ display: 'flex', gap: 8 }}>
                <Btn small onClick={reset}>Reset</Btn>
                <Btn small primary onClick={doExport}>{busy ? 'Building…' : 'Export'}</Btn>
              </span>
            }>
              <p style={{ margin: 0, fontSize: 34, fontWeight: 700, fontFamily: FONT_DATA, color: A.brass, lineHeight: 1.1 }}>
                {cash(r.totalExpected)}
              </p>
              <p style={{ margin: '6px 0 0', fontSize: 12.5, color: T.textSec, lineHeight: 1.6 }}>
                across {r.priced.length} {r.priced.length === 1 ? 'boat' : 'boats'}
                {r.unpricedCount > 0 && <>, with {r.unpricedCount} not priced because no rate matched</>}.
              </p>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
                <tbody>
                  {r.byRate.map((g) => (
                    <tr key={g.key}>
                      <td style={td}>{g.key}<span style={{ display: 'block', fontSize: 11, color: T.textMuted }}>{g.lines} {g.lines === 1 ? 'boat' : 'boats'}</span></td>
                      <td style={tdN}>{cash(g.expected)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>

            <WontDo items={[
              'It will not tell you what to charge per foot, or what your minimum should be. That is your rate card and nobody else’s.',
              'It does not know what other yards charge, and it will never compare you to them.',
              'It will not price a boat whose kind is not on your card. It says so and leaves the line blank, because a plausible guess is the kind of number a customer rings up about.',
            ]} />
          </div>
        </div>
      </div>
    </div>
  );
}
