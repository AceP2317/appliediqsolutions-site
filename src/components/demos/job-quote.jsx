// ============================================================================
// JOB QUOTE — Bight Creek Mechanical (portfolio demo)
//
// A trade quotes a job standing in a driveway. Labour is hours against a rate.
// Parts are what the supply house charged plus the markup that shop settled on
// once and kept. A call-out minimum means a fifteen-minute visit still pays for
// the truck being there. A travel charge belongs to a particular line rather
// than floating at the bottom of the page.
//
// THE FIRST TOOL HERE THAT PRICES WORK BEFORE IT HAPPENS. Every other one on
// the shelf measures something already done — what poured, what was owed, what
// is due, what a statement actually paid. This is the same rate-card arithmetic
// pointed forwards, which is why it earns its own group on /work/.
//
// SAME ENGINE AS THE MARINA BILL AND THE COMMISSION CHECK, which is why
// src/lib/rate-card.js grew a per-rate `basis` rather than this becoming a
// fourth copy of the same reduce. A quote is the one card that has to price two
// ways at once: hours on the labour lines, cost-plus on the parts.
//
// THE HONESTY CONTRACT. Every rate and every markup is the shop's own. There is
// no suggested rate, no usual markup, no comparison against anybody else in the
// county, and a line whose kind is not on the card is reported rather than
// quietly priced at something plausible.
//
// Built by Ian Provencher · AppliedIQ Solutions
// Public demo — the shop, the job and the rate card are invented.
// ============================================================================

import React, { useMemo, useState } from 'react';
import { computeRateCard } from '../../lib/rate-card.js';
import { T, A, S, FONT_DATA, FONT_HEAD, Panel, Btn, Cell, Field, ToolHeader, Problems, WontDo, useRemembered, toCents, toHundredths, cash, plain, uid, wrap, th, thN, td, tdN, exportRows, pageFor, Readout } from '../kit/shelf.jsx';

const SHOP = 'Bight Creek Mechanical';

// ============================================================================
// THE SAMPLE — one job at a made-up shop in a made-up town.
//
// The same numbers are worked out by hand in scripts/verify-tools.mjs, so the
// gate and the page are checking one arithmetic rather than two that agree by
// luck. Labour quantities are hundredths of an hour; parts quantities are what
// the supply house charged, in cents.
// ============================================================================
const SAMPLE = {
  number: '4417',
  rates: [
    { id: 'q1', key: 'Labour', basis: 'per-unit', perUnit: 9500, minimum: 14250 },
    { id: 'q2', key: 'Parts', basis: 'cost-plus', perUnit: 3500, minimum: null },
    { id: 'q3', key: 'Shop supply', basis: 'cost-plus', perUnit: 1000, minimum: 2500 },
  ],
  items: [
    { id: 'j1', label: 'Diagnose the return line', key: 'Labour', qty: 325, extra: 3500, actual: null },
    { id: 'j2', label: 'Swap the expansion valve', key: 'Labour', qty: 75, extra: 0, actual: null },
    { id: 'j3', label: 'Expansion valve', key: 'Parts', qty: 21460, extra: 0, actual: null },
    { id: 'j4', label: 'Line set fittings', key: 'Parts', qty: 999, extra: 0, actual: null },
    { id: 'j5', label: 'Shop supplies', key: 'Shop supply', qty: 1200, extra: 0, actual: null },
  ],
};

/* The two bases a quote actually uses, named the way a person in the trade
   would say them rather than the way the engine spells them. 'percent' is
   deliberately absent: it belongs to the commission tool, and offering it here
   would let somebody build a card that prices a part at its markup alone. */
const BASES = [
  { value: 'per-unit', label: 'Hours × rate', unit: 'hours', help: 'An hourly rate. The quantity on the line is hours.' },
  { value: 'cost-plus', label: 'Cost + markup', unit: 'cost', help: 'What you paid, plus your markup. The quantity on the line is what it cost you.' },
];

const isCost = (basis) => basis === 'cost-plus';

export default function JobQuote({ mode = 'demo' }) {
  const { state, patch, reset, status, restored, pack } = useRemembered('job-quote', 1, SAMPLE, mode);
  const [busy, setBusy] = useState(false);
  /* mode is the FALLBACK only — every rate in this tool carries its own basis,
     because a quote prices two ways on one card. */
  const r = useMemo(
    () => computeRateCard({ rates: state.rates, items: state.items, mode: 'rate-times-quantity' }),
    [state],
  );

  const doExport = async () => {
    setBusy(true);
    try {
      await exportRows('job-quote.xlsx', 'Quote',
        r.rows.map((l) => ({
          Line: l.label,
          Kind: l.key,
          Hours_or_cost: l.unpriced ? '' : (isCost(l.basis) ? Number((l.qty / 100).toFixed(2)) : l.qty / 100),
          Rate_or_markup: l.rate ? (isCost(l.basis) ? `${(l.rate.perUnit / 100).toFixed(2)}%` : Number((l.rate.perUnit / 100).toFixed(2))) : '',
          Before_travel: l.base == null ? 'no rate' : Number((l.base / 100).toFixed(2)),
          Travel: Number((l.extra / 100).toFixed(2)),
          Line_total: l.expected == null ? 'no rate' : Number((l.expected / 100).toFixed(2)),
        })).concat([{}, { Line: 'Quote total', Line_total: Number((r.totalExpected / 100).toFixed(2)) }]),
        [30, 13, 15, 15, 13, 9, 11]);
    } finally { setBusy(false); }
  };

  return (
    <div style={pageFor('job-quote')} data-demo="job-quote">
      <ToolHeader toolId="job-quote" house={SHOP} occasion="sample job" name="Job Quote" badge={state.number} status={status} restored={restored} pack={pack} remembers="rate card">
        Your hours, your parts, your markup. A call-out minimum that holds, and a travel charge that
        rides on the line it belongs to. Nothing here suggests a rate or a markup, and nothing is
        compared against what anybody else in the county charges. Nothing you type leaves this page.
      </ToolHeader>

      <Readout items={[
        { label: 'The quote', value: cash(r.totalExpected),
          note: r.priced.length + ' ' + (r.priced.length === 1 ? 'line' : 'lines') + ' priced' },
        { label: 'At your minimum', value: r.rows.filter((x) => x.atMinimum).length,
          note: 'short jobs billed at your floor' },
        { label: 'Rates on your card', value: r.byRate.length },
        { label: 'Not priced', value: r.unpricedCount,
          tone: r.unpricedCount ? 'warn' : undefined,
          note: r.unpricedCount ? 'no rate matches — not in the total' : 'every line has a rate' },
      ]} />

      <div style={wrap}>
        <Problems heading="Look at these before you hand this over" items={r.problems} />

        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'minmax(0, 1.8fr) minmax(300px, 1fr)', alignItems: 'start' }}>
          <div>
            <Panel
              title="The job"
              note="On a labour line the quantity is hours. On a cost-plus line it is what the part cost you — the markup is added on top of it, not instead of it."
              right={<Btn small onClick={() => patch((s) => { s.items.push({ id: uid('j'), label: 'New line', key: s.rates[0]?.key ?? '', qty: 0, extra: 0, actual: null }); })}>Add a line</Btn>}
            >
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 660 }}>
                  <thead>
                    <tr>
                      <th style={th}>Line</th><th style={th}>Kind</th><th style={thN}>Hours / cost</th>
                      <th style={thN}>Rate</th><th style={thN}>Before travel</th><th style={thN}>Travel</th>
                      <th style={thN}>Line</th><th style={th} />
                    </tr>
                  </thead>
                  <tbody>
                    {r.rows.map((l, i) => {
                      const cost = isCost(l.basis);
                      return (
                        <tr key={l.id} style={{ background: l.unpriced ? A.badTint : 'transparent' }}>
                          <td style={td}><Cell label={`what ${l.label} is`} mono={false} w={150} value={l.label} onChange={(v) => patch((n) => { n.items[i].label = v; })} /></td>
                          <td style={td}>
                            <select aria-label={`kind of line for ${l.label}`} value={l.key} onChange={(e) => patch((n) => { n.items[i].key = e.target.value; })}
                              style={{ background: T.bg, color: T.text, border: `${S.rule} solid ${T.border}`, borderRadius: S.radiusSm, padding: '5px 6px', fontSize: 12.5 }}>
                              {state.rates.map((rt) => <option key={rt.id} value={rt.key}>{rt.key}</option>)}
                              {l.unpriced && <option value={l.key}>{l.key}</option>}
                            </select>
                          </td>
                          {/* THE UNIT FOLLOWS THE RATE, and the label says which it is. The
                              same column holds hours on one row and dollars on the next, so a
                              row that did not say so would be read wrong by the person who
                              wrote it. */}
                          <td style={tdN}>
                            <Cell
                              label={cost ? `what ${l.label} cost you` : `hours on ${l.label}`}
                              w={70}
                              value={cost ? (l.qty / 100).toFixed(2) : plain(l.qty)}
                              onChange={(v) => patch((n) => { n.items[i].qty = cost ? toCents(v) : toHundredths(v); })}
                            />
                            <span style={{ display: 'block', fontSize: 10, color: T.textMuted }}>{cost ? 'cost' : 'hours'}</span>
                          </td>
                          <td style={{ ...tdN, color: T.textMuted }}>
                            {!l.rate ? '—' : cost ? `+${(l.rate.perUnit / 100).toFixed(2)}%` : cash(l.rate.perUnit)}
                          </td>
                          <td style={{ ...tdN, color: l.atMinimum ? A.warn : T.text }}>
                            {l.base == null ? '—' : cash(l.base)}
                            {l.atMinimum && <span style={{ display: 'block', fontSize: 10, color: A.warn }}>at your minimum</span>}
                          </td>
                          <td style={tdN}><Cell label={`travel on ${l.label}`} w={62} value={(l.extra / 100).toFixed(2)} onChange={(v) => patch((n) => { n.items[i].extra = toCents(v); })} /></td>
                          <td style={{ ...tdN, fontWeight: 700, color: l.expected == null ? A.bad : T.text }}>{l.expected == null ? 'no rate' : cash(l.expected)}</td>
                          <td style={{ ...td, textAlign: 'right' }}><Btn small onClick={() => patch((n) => { n.items.splice(i, 1); })}>×</Btn></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Panel>

            {/* THE CUSTOMER'S COPY — the half of this tool that is not arithmetic.
                Every other tool on the shelf ends at a figure the owner reads. A quote
                ends at a piece of paper somebody else reads, and what that person
                should see is the line and the price, never the markup. So the working
                above and the copy below are deliberately different documents, and the
                markup appears in exactly one of them. */}
            <Panel
              title="The customer’s copy"
              note="What they see. Your rates and your markup are not on it — this is the line and the price."
            >
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {r.priced.map((l) => (
                    <tr key={l.id}>
                      <td style={td}>{l.label}{l.extra > 0 && <span style={{ display: 'block', fontSize: 11, color: T.textMuted }}>includes travel</span>}</td>
                      <td style={{ ...tdN, fontFamily: FONT_DATA }}>{cash(l.expected)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td style={{ ...td, borderTop: `${S.ruleStrong} solid ${T.text}`, fontFamily: FONT_HEAD, textTransform: 'uppercase', letterSpacing: 1.1, fontSize: 12 }}>Total</td>
                    <td style={{ ...tdN, borderTop: `${S.ruleStrong} solid ${T.text}`, fontFamily: FONT_DATA, fontWeight: 700, fontSize: 17, color: A.brass }}>{cash(r.totalExpected)}</td>
                  </tr>
                </tbody>
              </table>
              {r.unpricedCount > 0 && (
                <p style={{ margin: '10px 0 0', fontSize: 12, color: A.warn, lineHeight: 1.55 }}>
                  {r.unpricedCount} {r.unpricedCount === 1 ? 'line is' : 'lines are'} missing from this copy, because
                  no rate on your card matches {r.unpricedCount === 1 ? 'it' : 'them'}. Do not send it until that is fixed.
                </p>
              )}
            </Panel>
          </div>

          <div>
            <Panel
              title="Your rate card"
              note="A rate is either an hourly one or a markup on what something cost you. Which it is belongs to the rate, so one card can price both."
              right={<Btn small onClick={() => patch((s) => { s.rates.push({ id: uid('q'), key: 'New kind', basis: 'per-unit', perUnit: 0, minimum: null }); })}>Add a kind</Btn>}
            >
              {state.rates.map((rt, i) => {
                const cost = isCost(rt.basis);
                return (
                  <div key={rt.id} style={{ marginBottom: 12, paddingBottom: 10, borderBottom: `${S.rule} solid ${T.border}` }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                      <Field label="Kind" w={104} value={rt.key} onChange={(v) => patch((n) => { n.rates[i].key = v; })} />
                      <label style={{ display: 'block' }}>
                        <span style={{ display: 'block', fontFamily: FONT_HEAD, fontSize: S.label, letterSpacing: 0.8, textTransform: 'uppercase', color: T.textMuted, marginBottom: 3 }}>How it prices</span>
                        <select aria-label={`how ${rt.key} prices`} value={rt.basis || 'per-unit'} onChange={(e) => patch((n) => { n.rates[i].basis = e.target.value; })}
                          style={{ background: T.bg, color: T.text, border: `${S.rule} solid ${T.border}`, borderRadius: S.radiusSm, padding: '5px 6px', fontSize: 12.5 }}>
                          {BASES.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
                        </select>
                      </label>
                      <Btn small onClick={() => patch((n) => { n.rates.splice(i, 1); })}>×</Btn>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap', marginTop: 8 }}>
                      <Field
                        label={cost ? 'Markup' : 'Per hour'}
                        prefix={cost ? undefined : '$'}
                        suffix={cost ? '%' : undefined}
                        w={80}
                        value={(rt.perUnit / 100).toFixed(2)}
                        onChange={(v) => patch((n) => { n.rates[i].perUnit = toCents(v); })}
                      />
                      <Field label="Minimum" prefix="$" w={80} value={((rt.minimum ?? 0) / 100).toFixed(2)} onChange={(v) => patch((n) => { n.rates[i].minimum = toCents(v); })} />
                    </div>
                    <p style={{ margin: '6px 0 0', fontSize: 11.5, color: T.textMuted, lineHeight: 1.5 }}>
                      {BASES.find((b) => b.value === (rt.basis || 'per-unit'))?.help}
                    </p>
                  </div>
                );
              })}
            </Panel>

            <Panel title="This quote" right={
              <span style={{ display: 'flex', gap: 8 }}>
                <Btn small onClick={reset}>Reset</Btn>
                <Btn small primary onClick={doExport}>{busy ? 'Building…' : 'Export'}</Btn>
              </span>
            }>
              <p style={{ margin: 0, fontSize: 34, fontWeight: 700, fontFamily: FONT_DATA, color: A.brass, lineHeight: 1.1 }}>
                {cash(r.totalExpected)}
              </p>
              <p style={{ margin: '6px 0 0', fontSize: 12.5, color: T.textSec, lineHeight: 1.6 }}>
                across {r.priced.length} {r.priced.length === 1 ? 'line' : 'lines'}
                {r.unpricedCount > 0 && <>, with {r.unpricedCount} not priced because no rate matched</>}.
              </p>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
                <tbody>
                  {r.byRate.map((g) => (
                    <tr key={g.key}>
                      <td style={td}>{g.key}<span style={{ display: 'block', fontSize: 11, color: T.textMuted }}>{g.lines} {g.lines === 1 ? 'line' : 'lines'}</span></td>
                      <td style={tdN}>{cash(g.expected)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>

            <WontDo items={[
              'It will not tell you what to charge an hour, or what to mark parts up by. Those are the two decisions your shop is actually paid to make.',
              'It does not know what anybody else in the county charges, and it will never compare you to them.',
              'It will not price a line whose kind is not on your card. It says so and leaves the line out of the total, because a plausible guess is the number you end up arguing about in a driveway.',
              'It cannot tell hours from dollars. If a cost goes in an hours line the arithmetic is perfectly happy — the column says which unit each row is in, and that is the whole of the protection.',
            ]} />
          </div>
        </div>
      </div>
    </div>
  );
}
