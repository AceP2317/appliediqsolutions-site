// ============================================================================
// COMMISSION CHECK — Wrackline & Co, Marker Nine (portfolio demo)
//
// A carrier sends a statement. The agency's own book says what each policy
// should have paid at the rate agreed for that carrier and that product. The
// two get reconciled by eye, line by line, or more often not at all.
//
// A NOTE ON THE EVIDENCE, because it matters and the page should not pretend
// otherwise. The market research behind this shelf found no outside evidence of
// this pain — no survey, no forum thread, no vendor selling against it. It sits
// here on the strength of having held a licensed insurance desk in this town,
// which is a weaker footing than the tools built on published complaint, and
// saying so is cheaper than discovering it on a sales call.
//
// SAME ENGINE AS THE MARINA BILLING, deliberately. Both take a line item, find
// the rate that applies, and work out what it comes to — the only difference is
// that this one also has an amount somebody actually paid to compare against.
//
// THE HONESTY CONTRACT. Every rate is the agency's own, from its own contracts.
// No typical commission, nothing compared against what other agencies get, and a
// policy whose carrier and product have no rate on file is reported rather than
// quietly priced.
//
// Built by Ian Provencher · AppliedIQ Solutions
// Public demo — the agency, the carriers and the policies are invented.
// ============================================================================

import React, { useMemo, useState } from 'react';
import { computeRateCard } from '../../lib/rate-card.js';
import { T, A, S, FONT_DATA, Panel, Btn, Cell, Field, ToolHeader, Problems, WontDo, useRemembered, toCents, toNumber, cash, uid, page, wrap, th, thN, td, tdN, exportRows, pageFor, Readout } from '../kit/shelf.jsx';

const AGENCY = 'Wrackline & Co';

// ============================================================================
// THE SAMPLE — one statement at a made-up agency in a made-up town.
// Premiums are cents. Rates are hundredths of a percent, so 1250 is 12.5%.
// ============================================================================
const SAMPLE = {
  statement: 'sample statement',
  rates: [
    { id: 'r1', key: 'Tidewater Mutual · Homeowners', perUnit: 1250 },
    { id: 'r2', key: 'Tidewater Mutual · Auto', perUnit: 1000 },
    { id: 'r3', key: 'Neuse Casualty · Commercial', perUnit: 1500 },
    { id: 'r4', key: 'Neuse Casualty · Marine', perUnit: 1750 },
  ],
  items: [
    { id: 'p1', label: 'HO-4471 · Beaufort', key: 'Tidewater Mutual · Homeowners', qty: 218400, extra: 0, actual: 27300 },
    { id: 'p2', label: 'HO-4488 · Kittrell', key: 'Tidewater Mutual · Homeowners', qty: 164000, extra: 0, actual: 20500 },
    { id: 'p3', label: 'AU-9912 · Beaufort', key: 'Tidewater Mutual · Auto', qty: 142000, extra: 0, actual: 14200 },
    { id: 'p4', label: 'AU-9930 · Sowell', key: 'Tidewater Mutual · Auto', qty: 96000, extra: 0, actual: 8640 },
    { id: 'p5', label: 'CP-2210 · Salt Line', key: 'Neuse Casualty · Commercial', qty: 486000, extra: 0, actual: 72900 },
    { id: 'p6', label: 'MR-7781 · Boatyard', key: 'Neuse Casualty · Marine', qty: 322000, extra: 0, actual: 56350 },
    { id: 'p7', label: 'MR-7790 · Wrackline', key: 'Neuse Casualty · Marine', qty: 118000, extra: 0, actual: 20650 },
  ],
};

export default function CommissionCheck({ mode = 'demo' }) {
  const { state, patch, reset, status, restored, pack } = useRemembered('commission-check', 1, SAMPLE, mode);
  const [busy, setBusy] = useState(false);
  const r = useMemo(
    () => computeRateCard({ rates: state.rates, items: state.items, mode: 'percent-of-quantity' }),
    [state],
  );

  const doExport = async () => {
    setBusy(true);
    try {
      await exportRows('commission-check.xlsx', 'Statement',
        r.rows.map((p) => ({
          Policy: p.label, Carrier_product: p.key,
          Premium: Number((p.qty / 100).toFixed(2)),
          Rate_pct: p.rate ? p.rate.perUnit / 100 : '',
          Should_be: p.expected == null ? 'no rate' : Number((p.expected / 100).toFixed(2)),
          Paid: p.actual == null ? '' : Number((p.actual / 100).toFixed(2)),
          Difference: p.variance == null ? '' : Number((p.variance / 100).toFixed(2)),
        })).concat([{}, { Policy: 'Difference on the statement', Difference: Number((r.totalVariance / 100).toFixed(2)) }]),
        [22, 30, 11, 9, 11, 11, 11]);
    } finally { setBusy(false); }
  };

  const short = r.rows.filter((p) => p.variance != null && p.variance < 0);

  return (
    <div style={pageFor("commission-check")} data-demo="commission-check">
      <ToolHeader toolId="commission-check" house={AGENCY} occasion="sample statement" name="Commission Check" status={status} restored={restored} pack={pack} remembers="rate schedule">
        Your rate schedule against what the carrier actually paid, line by line. Nothing here is a
        typical commission and nothing is compared against what other agencies get — the rates are
        the ones in your own contracts. Nothing you type leaves this page.
      </ToolHeader>

      <Readout items={[
        { label: 'You are owed', value: cash(r.expectedOnChecked),
          note: 'on the ' + r.checked + ' ' + (r.checked === 1 ? 'line' : 'lines') + ' you checked' },
        { label: 'They paid', value: cash(r.totalActual) },
        { label: r.totalVariance < 0 ? 'Short by' : 'Difference',
          value: cash(Math.abs(r.totalVariance)),
          tone: r.totalVariance < 0 ? 'bad' : (r.totalVariance > 0 ? 'warn' : 'good'),
          note: r.totalVariance === 0 ? 'the statement matches your card' : 'against your own rate card' },
        { label: 'Not checked yet', value: r.uncheckedCount,
          note: r.uncheckedCount ? 'no amount entered against these' : 'every line has an amount' },
      ]} />

      <div style={wrap}>
        <Problems heading="Query these before you file the statement" items={r.problems} />

        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'minmax(0, 1.9fr) minmax(290px, 1fr)', alignItems: 'start' }}>
          <div>
            <Panel
              title="The statement"
              note="Premium as written on the policy, and what the carrier actually paid you on it."
              right={<Btn small onClick={() => patch((s) => { s.items.push({ id: uid('p'), label: 'New policy', key: s.rates[0]?.key ?? '', qty: 0, extra: 0, actual: 0 }); })}>Add a line</Btn>}
            >
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 660 }}>
                  <thead>
                    <tr><th style={th}>Policy</th><th style={th}>Carrier · product</th><th style={thN}>Premium</th><th style={thN}>Rate</th><th style={thN}>Should be</th><th style={thN}>Paid</th><th style={thN}>Difference</th><th style={th} /></tr>
                  </thead>
                  <tbody>
                    {r.rows.map((p, i) => (
                      <tr key={p.id} style={{ background: p.unpriced ? A.badTint : (p.variance != null && p.variance < 0 ? A.warnTint : 'transparent') }}>
                        <td style={td}><Cell label={`name for ${p.label}`} mono={false} w={130} value={p.label} onChange={(v) => patch((n) => { n.items[i].label = v; })} /></td>
                        <td style={td}>
                          <select aria-label={`carrier and product for ${p.label}`} value={p.key} onChange={(e) => patch((n) => { n.items[i].key = e.target.value; })}
                            style={{ background: T.bg, color: T.text, border: `${S.rule} solid ${T.border}`, borderRadius: S.radiusSm, padding: '5px 6px', fontSize: 12, maxWidth: 190 }}>
                            {state.rates.map((rt) => <option key={rt.id} value={rt.key}>{rt.key}</option>)}
                            {p.unpriced && <option value={p.key}>{p.key}</option>}
                          </select>
                        </td>
                        <td style={tdN}><Cell label={`length in feet for ${p.label}`} w={72} value={(p.qty / 100).toFixed(2)} onChange={(v) => patch((n) => { n.items[i].qty = toCents(v); })} /></td>
                        <td style={{ ...tdN, color: T.textMuted }}>{p.rate ? (p.rate.perUnit / 100).toFixed(2) + '%' : '—'}</td>
                        <td style={{ ...tdN, color: A.brass }}>{p.expected == null ? '—' : cash(p.expected)}</td>
                        <td style={tdN}><Cell label={`amount paid for ${p.label}`} w={68} value={p.actual == null ? '' : (p.actual / 100).toFixed(2)} onChange={(v) => patch((n) => { n.items[i].actual = v.trim() === '' ? null : toCents(v); })} /></td>
                        <td style={{ ...tdN, fontWeight: 700, color: p.variance == null ? T.textMuted : (p.variance < 0 ? A.bad : (p.variance > 0 ? A.good : T.textSec)) }}>
                          {p.variance == null ? '—' : (p.variance === 0 ? 'right' : (p.variance > 0 ? '+' : '') + cash(p.variance))}
                        </td>
                        <td style={{ ...td, textAlign: 'right' }}><Btn small onClick={() => patch((n) => { n.items.splice(i, 1); })}>×</Btn></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>

          <div>
            <Panel title="What the statement comes to" right={
              <span style={{ display: 'flex', gap: 8 }}>
                <Btn small onClick={reset}>Reset</Btn>
                <Btn small primary onClick={doExport}>{busy ? 'Building…' : 'Export'}</Btn>
              </span>
            }>
              <p style={{ margin: 0, fontSize: 32, fontWeight: 700, fontFamily: FONT_DATA, lineHeight: 1.1, color: r.totalVariance < 0 ? A.bad : (r.totalVariance > 0 ? A.good : A.brass) }}>
                {r.totalVariance === 0 ? 'It agrees' : (r.totalVariance > 0 ? '+' : '') + cash(r.totalVariance)}
              </p>
              <p style={{ margin: '6px 0 0', fontSize: 12.5, color: T.textSec, lineHeight: 1.6 }}>
                {cash(r.totalActual)} paid against {cash(r.expectedOnChecked)} owed at your rates,
                across {r.checked} {r.checked === 1 ? 'line' : 'lines'} checked.
                {r.uncheckedCount > 0 && (
                  <>{' '}Another {r.uncheckedCount}{' '}
                  {r.uncheckedCount === 1 ? 'line has' : 'lines have'} no paid amount entered yet, worth{' '}
                  {cash(r.totalExpected - r.expectedOnChecked)} — those are not in the difference above.</>
                )}
              </p>
              {short.length > 0 && (
                <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: S.radiusSm, background: A.badTint, border: `${S.rule} solid ${A.bad}`, fontSize: 12.5, lineHeight: 1.6 }}>
                  <strong style={{ color: A.bad }}>{short.length} {short.length === 1 ? 'line is' : 'lines are'} short.</strong>{' '}
                  A total that nets to nothing can still hide an underpayment cancelled out by an
                  overpayment, so they are listed per line above rather than summed away.
                </div>
              )}
            </Panel>

            <Panel
              title="Your rate schedule"
              note="Carrier and product together, at the rate in your own contract."
              right={<Btn small onClick={() => patch((s) => { s.rates.push({ id: uid('r'), key: 'New carrier · product', perUnit: 0 }); })}>Add a rate</Btn>}
            >
              {state.rates.map((rt, i) => (
                <div key={rt.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 9, flexWrap: 'wrap' }}>
                  <Field label="Carrier · product" w={182} value={rt.key} onChange={(v) => patch((n) => { n.rates[i].key = v; })} />
                  <Field label="Rate" suffix="%" w={58} value={(rt.perUnit / 100).toFixed(2)} onChange={(v) => patch((n) => { n.rates[i].perUnit = Math.round(toNumber(v) * 100); })} />
                  <Btn small onClick={() => patch((n) => { n.rates.splice(i, 1); })}>×</Btn>
                </div>
              ))}
            </Panel>

            <WontDo items={[
              'It will not tell you what a commission rate should be. Those are in your contracts, and this only applies what you enter.',
              'It does not know what other agencies are paid, and it will never compare you to them.',
              'It will not price a policy whose carrier and product are not on your schedule. It says so and leaves the line blank.',
              'It is not a dispute. It shows you the difference; what you do about it is a phone call.',
            ]} />
          </div>
        </div>
      </div>
    </div>
  );
}
