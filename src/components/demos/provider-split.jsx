// ============================================================================
// PROVIDER SPLIT — Cutter Point Dental (portfolio demo)
//
// An associate is paid a share of what they brought in. That sentence hides
// four decisions and every one of them is in a signed agreement in a drawer:
// a share of production or of collection, at what percentage, with lab off the
// top or not, and who carries the insurance write-off.
//
// PRACTICE MANAGEMENT SOFTWARE COMPUTES BOTH NUMBERS PERFECTLY AND THEN STOPS,
// because the split is not in it — and it differs per provider inside the same
// practice. One associate on 30% of production gross, another on 32.5% of
// collection net of lab, because that is what each of them signed.
//
// PRODUCTION AND COLLECTION ARE NOT A RATIO. Money arrives in a month against
// work done in an earlier one, so collection can exceed production and that is
// ordinary. The gap is reported as a fact and never divided into a rate, which
// over one period would mean nothing.
//
// Built by Ian Provencher · AppliedIQ Solutions
// Public demo — the practice, the providers and the month are invented.
// ============================================================================

import React, { useMemo, useState } from 'react';
import { computeProviderSplit } from '../../lib/provider-split.js';
import { T, A, S, FONT_DATA, Panel, Btn, Cell, ToolHeader, Problems, WontDo, useRemembered, toCents, toHundredths, cash, uid, wrap, th, thN, td, tdN, exportRows, pageFor, Readout } from '../kit/shelf.jsx';

const PRACTICE = 'Cutter Point Dental';

// ============================================================================
// THE SAMPLE MONTH — the same figures scripts/verify-tools.mjs works out by
// hand. Three providers on three different agreements, which is the point:
// nothing here is a house rate.
// ============================================================================
const SAMPLE = {
  providers: [
    { id: 'p1', name: 'Dr. Alvarez', pctHundredths: 3250, basis: 'collection', labOffTop: true },
    { id: 'p2', name: 'Dr. Boone', pctHundredths: 3000, basis: 'production', labOffTop: false },
    { id: 'p3', name: 'R. Chen, RDH', pctHundredths: 2200, basis: 'production', labOffTop: false },
  ],
  rows: [
    { id: 'r1', providerId: 'p1', production: 720000, collection: 680000, lab: 85000, adjustments: 110000 },
    { id: 'r2', providerId: 'p1', production: 690000, collection: 640000, lab: 78000, adjustments: 96000 },
    { id: 'r3', providerId: 'p2', production: 610000, collection: 520000, lab: 92000, adjustments: 88000 },
    { id: 'r4', providerId: 'p2', production: 580000, collection: 610000, lab: 74000, adjustments: 79000 },
    { id: 'r5', providerId: 'p3', production: 310000, collection: 295000, lab: 0, adjustments: 42000 },
    { id: 'r6', providerId: 'p3', production: 288000, collection: 301000, lab: 0, adjustments: 38000 },
  ],
};

const signed = (c) => (c < 0 ? '−' : '') + cash(Math.abs(c));

export default function ProviderSplit({ mode = 'demo' }) {
  const { state, patch, reset, status, restored, pack } = useRemembered('provider-split', 1, SAMPLE, mode);
  const [busy, setBusy] = useState(false);
  const r = useMemo(() => computeProviderSplit(state), [state]);

  const nameOf = (id) => state.providers.find((p) => p.id === id)?.name || 'not on the list';
  /* CYCLES RATHER THAN OPENS A MENU, because the list is three people rather
     than thirty and a button is one fewer thing to hit on a phone.

     THE ORIGINAL VERSION OF THIS COMMENT WAS FALSE AND SAID SO CONFIDENTLY. It
     claimed a <select> would be "a second kind of focusable control in a table
     the kit's other tools drive entirely with Cell and Btn". Four shelf tools
     were already using one when that was written — chair-split,
     commission-check, job-quote and marina-storage — so the rule it asserted
     had never held. Corrected 2026-09-07, after it nearly caused a correct
     <select> in a NEW tool to be reverted on the strength of it.

     BOTH SHAPES ARE HOUSE STYLE. Cycle a short fixed list; open a menu for one
     that grows. Nothing gates this, and a comment claiming otherwise is worse
     than no comment, because prose is the one thing here no check can read. */
  const cycleProvider = (i) => patch((n) => {
    const ids = n.providers.map((p) => p.id);
    const at = ids.indexOf(n.rows[i].providerId);
    n.rows[i].providerId = ids[(at + 1) % Math.max(1, ids.length)];
  });

  const doExport = async () => {
    setBusy(true);
    try {
      await exportRows('provider-split.xlsx', 'Month',
        r.providers.map((p) => ({
          Provider: p.name,
          Percentage: Number((p.pct / 100).toFixed(2)),
          Basis: p.basis,
          Lab_off_the_top: p.labOffTop ? 'yes' : 'no',
          Production: Number((p.production / 100).toFixed(2)),
          Collection: Number((p.collection / 100).toFixed(2)),
          Lab: Number((p.lab / 100).toFixed(2)),
          Splits_on: Number((p.splitOn / 100).toFixed(2)),
          Owed: Number((p.pay / 100).toFixed(2)),
        })).concat([{}, {
          Provider: 'Owed to providers',
          Owed: Number((r.totals.pay / 100).toFixed(2)),
        }, {
          Provider: 'The practice keeps, of what was collected',
          Owed: Number((r.totals.practiceKeeps / 100).toFixed(2)),
        }]),
        [22, 11, 12, 16, 13, 13, 11, 12, 12]);
    } finally { setBusy(false); }
  };

  return (
    <div style={pageFor('provider-split')} data-demo="provider-split">
      <ToolHeader toolId="provider-split" house={PRACTICE} occasion="sample month" name="Provider Production Split" status={status} restored={restored} pack={pack} remembers="provider percentages, bases and lab rules">
        What each provider is owed under the agreement they actually signed — a share of production
        or of collection, at their own percentage, with lab off the top or not. It suggests no
        percentage and takes no view on which basis is fairer. Nothing you type leaves this page.
      </ToolHeader>

      {/* ORDER MATTERS HERE: the `total` readout shape draws the LAST item as the
          hero and the ones above it as rows, so the answer has to come last. A
          first draft ended on Collection and made a supporting figure the biggest
          thing on the page.

          AND EACH NOTE READS ON FROM ITS LABEL, because this shape sets the two
          inline rather than stacking them — "Production what was done this
          period" is what happens when a note is written to sit underneath. */}
      <Readout items={[
        { label: 'Production', value: cash(r.totals.production), note: '— what was done this period' },
        { label: 'Collection', value: cash(r.totals.collection), note: '— what actually arrived, against an earlier month’s work' },
        { label: 'The practice keeps', value: cash(r.totals.practiceKeeps),
          tone: r.totals.practiceKeeps < 0 ? 'bad' : 'good',
          note: 'of what was collected, after the splits and the lab it carried' },
        { label: 'Owed to providers', value: cash(r.totals.pay),
          note: `across ${r.totals.providers} ${r.totals.providers === 1 ? 'agreement' : 'agreements'}, no two the same` },
      ]} />

      <div style={wrap}>
        <Problems heading="Look at these before anybody is paid" items={r.problems} />

        {/* 2.4fr, MEASURED AND NOT CHOSEN. At 1.9fr this column gave the panel
            769px of inside and the agreements table wanted 804 — so the one
            table on the shelf that carries pressable Btn cells scrolled
            sideways inside its own panel, on the shipped page, with every gate
            green. The table's own minWidth of 780 was never the binding figure:
            the Btn labels and the money columns set the natural width, and a
            declared floor below it does nothing. Found 2026-09-07 by sweeping
            all 26 shelf tools for a table wider than the box holding it, which
            npm run smoke now refuses. LEDGER L-380. */}
        <div className="aiq-split" style={{ '--aiq-split': '2.4fr' }}>
          <div>
            <Panel
              title="The agreements, and what each one comes to"
              note="Every column here is from a signed agreement. Nothing on this page is a house rate."
              right={<Btn small onClick={() => patch((s) => { s.providers.push({ id: uid('p'), name: 'New provider', pctHundredths: 0, basis: 'production', labOffTop: false }); })}>Add a provider</Btn>}
            >
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 804 }}>
                  <thead>
                    <tr>
                      <th style={th}>Provider</th><th style={thN}>%</th><th style={th}>Paid on</th>
                      <th style={th}>Lab</th><th style={thN}>Production</th><th style={thN}>Collection</th>
                      <th style={thN}>Splits on</th><th style={thN}>Owed</th><th style={th} />
                    </tr>
                  </thead>
                  <tbody>
                    {r.providers.map((p, i) => (
                      <tr key={p.id} style={{ background: p.labOverBasis || p.pct === 0 ? A.badTint : 'transparent' }}>
                        <td style={td}><Cell label={`name of provider ${i + 1}`} mono={false} w={128} value={p.name} onChange={(v) => patch((n) => { n.providers[i].name = v; })} /></td>
                        <td style={tdN}><Cell label={`percentage for ${p.name}`} w={54} value={(p.pct / 100).toFixed(2)} onChange={(v) => patch((n) => { n.providers[i].pctHundredths = toHundredths(v); })} /></td>
                        <td style={td}>
                          <Btn small onClick={() => patch((n) => { n.providers[i].basis = n.providers[i].basis === 'collection' ? 'production' : 'collection'; })}>
                            {p.basis === 'collection' ? 'Collection' : 'Production'}
                          </Btn>
                        </td>
                        <td style={td}>
                          <Btn small onClick={() => patch((n) => { n.providers[i].labOffTop = !n.providers[i].labOffTop; })}>
                            {p.labOffTop ? 'Off the top' : 'Practice pays'}
                          </Btn>
                        </td>
                        <td style={{ ...tdN, color: T.textSec }}>{cash(p.production)}</td>
                        <td style={{ ...tdN, color: T.textSec }}>{cash(p.collection)}</td>
                        <td style={{ ...tdN, color: T.textMuted }}>
                          {cash(p.splitOn)}
                          {p.labOffTop && p.lab > 0 && <span style={{ display: 'block', fontSize: 10 }}>less {cash(p.lab)} lab</span>}
                        </td>
                        <td style={{ ...tdN, fontWeight: 700, color: A.brass }}>{cash(p.pay)}</td>
                        <td style={{ ...td, textAlign: 'right' }}><Btn small onClick={() => patch((n) => { n.providers.splice(i, 1); })}>×</Btn></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p style={{ margin: '10px 0 0', fontSize: 11.5, color: T.textMuted, lineHeight: 1.55 }}>
                Whether lab comes off before the split is the single most argued line in an associate
                agreement. Both ways are ordinary terms and this takes no view on which yours should be.
              </p>
            </Panel>

            <Panel
              title="The month, line by line"
              note="Production is what was done. Collection is what arrived, which is often against an earlier month."
              right={<Btn small onClick={() => patch((s) => { s.rows.push({ id: uid('r'), providerId: s.providers[0]?.id || '', production: 0, collection: 0, lab: 0, adjustments: 0 }); })}>Add a line</Btn>}
            >
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620 }}>
                  <thead>
                    <tr>
                      <th style={th}>Against</th><th style={thN}>Production</th><th style={thN}>Collection</th>
                      <th style={thN}>Lab</th><th style={thN}>Write-off</th><th style={th} />
                    </tr>
                  </thead>
                  <tbody>
                    {state.rows.map((row, i) => (
                      <tr key={row.id}>
                        <td style={td}><Btn small onClick={() => cycleProvider(i)}>{nameOf(row.providerId)}</Btn></td>
                        <td style={tdN}><Cell label={`production on line ${i + 1}`} w={72} value={((row.production || 0) / 100).toFixed(2)} onChange={(v) => patch((n) => { n.rows[i].production = toCents(v); })} /></td>
                        <td style={tdN}><Cell label={`collection on line ${i + 1}`} w={72} value={((row.collection || 0) / 100).toFixed(2)} onChange={(v) => patch((n) => { n.rows[i].collection = toCents(v); })} /></td>
                        <td style={tdN}><Cell label={`lab on line ${i + 1}`} w={64} value={((row.lab || 0) / 100).toFixed(2)} onChange={(v) => patch((n) => { n.rows[i].lab = toCents(v); })} /></td>
                        <td style={tdN}><Cell label={`write-off on line ${i + 1}`} w={64} value={((row.adjustments || 0) / 100).toFixed(2)} onChange={(v) => patch((n) => { n.rows[i].adjustments = toCents(v); })} /></td>
                        <td style={{ ...td, textAlign: 'right' }}><Btn small onClick={() => patch((n) => { n.rows.splice(i, 1); })}>×</Btn></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>

          <div>
            <Panel title="This month" right={
              <span style={{ display: 'flex', gap: 8 }}>
                <Btn small onClick={reset}>Reset</Btn>
                <Btn small primary onClick={doExport}>{busy ? 'Building…' : 'Export'}</Btn>
              </span>
            }>
              <p style={{ margin: 0, fontSize: 34, fontWeight: 700, fontFamily: FONT_DATA, lineHeight: 1.1, color: A.brass }}>
                {cash(r.totals.pay)}
              </p>
              <p style={{ margin: '6px 0 0', fontSize: 12.5, color: T.textSec, lineHeight: 1.6 }}>
                owed across {r.totals.providers} {r.totals.providers === 1 ? 'provider' : 'providers'},
                against {cash(r.totals.collection)} collected and {cash(r.totals.lab)} of lab.
              </p>
              <p style={{ margin: '12px 0 0', fontSize: 12, color: T.textMuted, lineHeight: 1.6, paddingTop: 10, borderTop: `${S.rule} solid ${T.border}` }}>
                Collection this period was {signed(r.totals.collection - r.totals.production)} against
                production. Money arrives against work done earlier, so that gap is ordinary — and it
                is why nothing here divides one by the other. A collection rate over a single month
                measures when the post came rather than how the practice is doing.
              </p>
            </Panel>

            <WontDo items={[
              'It will not suggest a percentage. That is negotiated, per person, and it is the one number an agreement exists to record.',
              'It takes no view on whether production or collection is the fairer basis, or on who should carry the lab. Both ways are ordinary terms.',
              'It will not compare any of this to what associates are paid elsewhere. Yours is what yours signed.',
              'It computes no tax and no withholding. That is payroll, and this is not payroll.',
              'It will not divide collection by production and call it a rate. Over one period that measures when the post arrived.',
            ]} />
          </div>
        </div>
      </div>
    </div>
  );
}
