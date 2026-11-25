// ============================================================================
// CLAIM AGING — Harbourside Family Medicine (portfolio demo)
//
// Every practice system ages receivables into thirty, sixty and ninety day
// buckets. Those buckets are the same everywhere, which is exactly why a
// platform can draw them and why they answer nothing: a claim at forty days
// with a payer who always settles at fifty is fine, and a claim at forty days
// with a payer who settles at twenty is a phone call that should have happened
// a fortnight ago.
//
// SO THERE ARE NO 30/60/90 BUCKETS HERE, deliberately. The interval is the
// practice's own, per payer, learned from what that payer actually does. Adding
// the universal buckets beside it would quietly teach the reader that the
// universal one is the real measure.
//
// IT IS THE RECALL DUE LIST POINTED AT MONEY, and it reuses that tool's date
// arithmetic rather than carrying a second copy — same question, different
// trade, one piece of code.
//
// A DENIAL IS STILL OUTSTANDING. Denied money has not arrived and has not been
// written off, so it stays in the total and is flagged. A denial netted quietly
// away is how a practice finds out a year later that nobody appealed anything.
//
// Built by Ian Provencher · AppliedIQ Solutions
// Public demo — the practice, the payers and every claim are invented.
// ============================================================================

import React, { useMemo, useState } from 'react';
import { computeClaimAging } from '../../lib/claim-aging.js';
import { T, A, S, FONT_DATA, Panel, Btn, Cell, Field, ToolHeader, Problems, WontDo, useRemembered, toCents, toNumber, cash, uid, wrap, th, thN, td, tdN, exportRows, pageFor, Readout } from '../kit/shelf.jsx';

const PRACTICE = 'Harbourside Family Medicine';

// ============================================================================
// THE SAMPLE LEDGER — the same figures scripts/verify-tools.mjs works out by
// hand. THE AS-OF DATE IS FIXED rather than today's, so the ages never drift:
// a sample whose answers change overnight cannot be checked by anything.
// ============================================================================
const SAMPLE = {
  asOf: '2026-09-07',
  payers: [
    { id: 'y1', name: 'Coastal Health Plan', followUpDays: 30 },
    { id: 'y2', name: 'Tidewater Mutual', followUpDays: 45 },
    { id: 'y3', name: 'State Program', followUpDays: 60 },
  ],
  claims: [
    { id: 'c1', ref: 'CL-2041', payerId: 'y1', submitted: '2026-07-14', billedCents: 48000, paidCents: 0, writtenOffCents: 0, denied: false },
    { id: 'c2', ref: 'CL-2055', payerId: 'y1', submitted: '2026-08-20', billedCents: 32000, paidCents: 32000, writtenOffCents: 0, denied: false },
    { id: 'c3', ref: 'CL-2061', payerId: 'y2', submitted: '2026-07-02', billedCents: 91500, paidCents: 40000, writtenOffCents: 0, denied: false },
    { id: 'c4', ref: 'CL-2073', payerId: 'y2', submitted: '2026-08-28', billedCents: 26000, paidCents: 0, writtenOffCents: 0, denied: false },
    { id: 'c5', ref: 'CL-2080', payerId: 'y3', submitted: '2026-05-11', billedCents: 64000, paidCents: 0, writtenOffCents: 0, denied: true },
    { id: 'c6', ref: 'CL-2094', payerId: 'y3', submitted: '2026-08-01', billedCents: 18000, paidCents: 12000, writtenOffCents: 6000, denied: false },
  ],
};

const days = (n) => (n == null ? '—' : `${n} d`);

export default function ClaimAging({ mode = 'demo' }) {
  const { state, patch, reset, status, restored, pack } = useRemembered('claim-aging', 1, SAMPLE, mode);
  const [busy, setBusy] = useState(false);
  const r = useMemo(() => computeClaimAging(state), [state]);

  const indexOfClaim = (id) => state.claims.findIndex((c) => c.id === id);
  const nameOf = (id) => state.payers.find((p) => p.id === id)?.name || 'not on the list';
  const cyclePayer = (id) => patch((n) => {
    const i = n.claims.findIndex((c) => c.id === id);
    const ids = n.payers.map((p) => p.id);
    const at = ids.indexOf(n.claims[i].payerId);
    n.claims[i].payerId = ids[(at + 1) % Math.max(1, ids.length)];
  });

  const doExport = async () => {
    setBusy(true);
    try {
      await exportRows('claim-aging.xlsx', 'Aging',
        r.rows.map((c) => ({
          Claim: c.ref,
          Payer: c.payerName || 'not on the list',
          Submitted: c.submitted,
          Age_days: c.age,
          Your_interval: c.interval,
          Past_by_days: c.daysPast,
          Billed: Number((c.billed / 100).toFixed(2)),
          Paid: Number((c.paid / 100).toFixed(2)),
          Written_off: Number((c.writtenOff / 100).toFixed(2)),
          Outstanding: Number((c.outstanding / 100).toFixed(2)),
          Denied: c.denied ? 'yes' : '',
        })).concat([{}, {
          Claim: 'Outstanding',
          Outstanding: Number((r.totals.outstanding / 100).toFixed(2)),
        }, {
          Claim: 'Past your own follow-up interval',
          Outstanding: Number((r.totals.pastFollowUpValue / 100).toFixed(2)),
        }, {
          Claim: 'Denied and still owed',
          Outstanding: Number((r.totals.deniedValue / 100).toFixed(2)),
        }]),
        [12, 22, 12, 10, 14, 13, 11, 11, 12, 12, 8]);
    } finally { setBusy(false); }
  };

  return (
    <div style={pageFor('claim-aging')} data-demo="claim-aging">
      <ToolHeader toolId="claim-aging" house={PRACTICE} occasion="sample ledger" name="Claim Aging by Payer" status={status} restored={restored} pack={pack} remembers="payers and the interval you chase each of them on">
        Which claims are past the interval <em>you</em> set for <em>that</em> payer, and how far past.
        No thirty, sixty and ninety day buckets — those are the same everywhere, which is why they
        answer nothing about a payer you know settles at fifty. Nothing you type leaves this page.
      </ToolHeader>

      {/* THREE ITEMS, NOT FOUR. The `compare` readout draws three and drops the
          rest below as plain running text — a first draft put the denial fourth
          and it came out as the smallest line on the page, which is the opposite
          of what this tool claims about itself. The oldest-claim age moved into
          a note to make room for it. */}
      <Readout items={[
        { label: 'Past your follow-up', value: cash(r.totals.pastFollowUpValue),
          tone: r.totals.pastFollowUpValue > 0 ? 'bad' : 'good',
          note: `${r.totals.pastFollowUp} of ${r.totals.openClaims} open claims, on your own intervals` },
        { label: 'Outstanding', value: cash(r.totals.outstanding),
          note: `oldest is ${days(r.totals.oldestOpen)} old · billed ${cash(r.totals.billed)}, paid ${cash(r.totals.paid)}` },
        { label: 'Denied and still owed', value: cash(r.totals.deniedValue),
          tone: r.totals.deniedValue > 0 ? 'bad' : undefined,
          note: 'still inside the outstanding figure — a denial is not a write-off' },
      ]} />

      <div style={wrap}>
        <Problems heading="Read these before you work the list" items={r.problems} />

        {/* THE WORKLIST TAKES THE WHOLE WIDTH, and every other tool on this shelf
            puts its main table in a two-column grid. This one cannot: ten columns
            in two thirds of the page clipped the Outstanding figure clean off the
            right edge, and narrowing the cells to fit clipped the money inside
            them instead. Seen in the captured tile, twice — the arithmetic was
            right in both, which is exactly why no gate could say anything. */}
        <Panel
              title="The list, furthest past your interval first"
              note="Ordered on how far past YOUR interval each one is, never on age alone. A row whose date cannot be read sorts to the end rather than to either extreme."
              right={<Btn small onClick={() => patch((s) => { s.claims.push({ id: uid('c'), ref: '', payerId: s.payers[0]?.id || '', submitted: s.asOf, billedCents: 0, paidCents: 0, writtenOffCents: 0, denied: false }); })}>Add a claim</Btn>}
            >
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 880 }}>
                  <thead>
                    <tr>
                      {/* DENIED SITS BESIDE THE PAYER, not out at the right-hand
                          end. It is a status of the claim rather than a figure,
                          and at the end it was the first thing a narrow screen
                          cut off — on the one tool whose whole argument is that
                          a denial must stay visible. */}
                      <th style={th}>Claim</th><th style={th}>Payer</th><th style={th}>Status</th>
                      <th style={th}>Submitted</th><th style={thN}>Past by</th><th style={thN}>Billed</th>
                      <th style={thN}>Paid</th><th style={thN}>Written off</th>
                      <th style={thN}>Outstanding</th><th style={th} />
                    </tr>
                  </thead>
                  <tbody>
                    {r.rows.map((c) => {
                      const i = indexOfClaim(c.id);
                      return (
                        <tr key={c.id} style={{ background: c.orphan || c.overApplied || c.unreadableDate ? A.badTint : (c.pastFollowUp ? A.warnTint : 'transparent') }}>
                          <td style={td}><Cell label={`reference for claim ${i + 1}`} w={78} value={c.ref} onChange={(v) => patch((n) => { n.claims[i].ref = v; })} /></td>
                          <td style={td}><Btn small onClick={() => cyclePayer(c.id)}>{c.payerName || 'not on the list'}</Btn></td>
                          <td style={td}><Btn small onClick={() => patch((n) => { n.claims[i].denied = !n.claims[i].denied; })}>{c.denied ? 'Denied' : 'Open'}</Btn></td>
                          {/* w=104, MEASURED. At 92 an ISO date clipped its last
                              digit — "2026-08-2(" — which is correct data in a
                              short box and invisible to every gate here. */}
                          <td style={td}><Cell label={`date ${c.ref || `claim ${i + 1}`} was submitted`} w={104} value={c.submitted || ''} onChange={(v) => patch((n) => { n.claims[i].submitted = v; })} /></td>
                          {/* THE ROW TINT ALREADY SAYS THIS, so the duration is not toned
                              as well — the tone belongs to the sum somebody can act on, and
                              a number of days is not one. LEDGER L-382. */}
                          <td style={{ ...tdN, fontWeight: c.pastFollowUp ? 700 : 400, color: c.pastFollowUp ? T.text : T.textMuted }}>
                            {c.daysPast == null ? '—' : (c.daysPast > 0 ? `${c.daysPast} d` : 'not yet')}
                            {c.age != null && <span style={{ display: 'block', fontSize: 10, fontWeight: 400, color: T.textMuted }}>{c.age} d old</span>}
                          </td>
                          <td style={tdN}><Cell label={`billed on ${c.ref || `claim ${i + 1}`}`} w={64} value={(c.billed / 100).toFixed(2)} onChange={(v) => patch((n) => { n.claims[i].billedCents = toCents(v); })} /></td>
                          <td style={tdN}><Cell label={`paid on ${c.ref || `claim ${i + 1}`}`} w={64} value={(c.paid / 100).toFixed(2)} onChange={(v) => patch((n) => { n.claims[i].paidCents = toCents(v); })} /></td>
                          <td style={tdN}><Cell label={`written off on ${c.ref || `claim ${i + 1}`}`} w={64} value={(c.writtenOff / 100).toFixed(2)} onChange={(v) => patch((n) => { n.claims[i].writtenOffCents = toCents(v); })} /></td>
                          <td style={{ ...tdN, fontWeight: 700, color: c.outstanding > 0 ? A.bad : T.textMuted }}>{cash(c.outstanding)}</td>
                          <td style={{ ...td, textAlign: 'right' }}><Btn small onClick={() => patch((n) => { n.claims.splice(i, 1); })}>×</Btn></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
        </Panel>

        <div className="aiq-split" style={{ '--aiq-split': '1.6fr' }}>
          <div>
            <Panel
              title="Your payers, and how long you give each of them"
              note="The interval is what THAT payer actually takes, which you learned by watching them. Nothing here suggests one."
              right={<Btn small onClick={() => patch((s) => { s.payers.push({ id: uid('y'), name: 'New payer', followUpDays: 30 }); })}>Add a payer</Btn>}
            >
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
                  <thead>
                    <tr>
                      <th style={th}>Payer</th><th style={thN}>Chase after</th><th style={thN}>Open</th>
                      <th style={thN}>Outstanding</th><th style={thN}>Past</th><th style={thN}>Oldest</th><th style={th} />
                    </tr>
                  </thead>
                  <tbody>
                    {r.byPayer.map((p, i) => (
                      <tr key={p.id} style={{ background: !p.followUpDays && p.openClaims > 0 ? A.badTint : 'transparent' }}>
                        <td style={td}><Cell label={`name of payer ${i + 1}`} mono={false} w={150} value={p.name} onChange={(v) => patch((n) => { n.payers[i].name = v; })} /></td>
                        <td style={tdN}><Cell label={`days before you chase ${p.name}`} w={48} value={String(p.followUpDays ?? '')} onChange={(v) => patch((n) => { n.payers[i].followUpDays = Math.round(toNumber(v)); })} /></td>
                        <td style={{ ...tdN, color: T.textSec }}>{p.openClaims}</td>
                        <td style={{ ...tdN, color: T.textSec }}>{cash(p.outstanding)}</td>
                        <td style={{ ...tdN, fontWeight: p.pastFollowUp ? 700 : 400, color: p.pastFollowUp ? A.bad : T.textMuted }}>
                          {p.pastFollowUp === 0 ? '—' : `${p.pastFollowUp} · ${cash(p.pastFollowUpValue)}`}
                        </td>
                        <td style={{ ...tdN, color: T.textMuted }}>{days(p.oldest)}</td>
                        <td style={{ ...td, textAlign: 'right' }}><Btn small onClick={() => patch((n) => { n.payers.splice(i, 1); })}>×</Btn></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>

          <div>
            <Panel title="Aging to" note="Fix this to the day you are working the list, so the answers do not move under you.">
              <Field label="As of" w={124} value={state.asOf} onChange={(v) => patch((n) => { n.asOf = v; })} />
              <p style={{ margin: '9px 0 0', fontSize: 11.5, color: T.textMuted, lineHeight: 1.55 }}>
                An age is counted from the day a claim was submitted, never from the day anybody last
                looked at it. Those two drift apart precisely on the claims nobody is looking at.
              </p>
            </Panel>

            <Panel title="This ledger" right={
              <span style={{ display: 'flex', gap: 8 }}>
                <Btn small onClick={reset}>Reset</Btn>
                <Btn small primary onClick={doExport}>{busy ? 'Building…' : 'Export'}</Btn>
              </span>
            }>
              <p style={{ margin: 0, fontSize: 34, fontWeight: 700, fontFamily: FONT_DATA, lineHeight: 1.1, color: r.totals.pastFollowUpValue > 0 ? A.bad : A.brass }}>
                {cash(r.totals.pastFollowUpValue)}
              </p>
              <p style={{ margin: '6px 0 0', fontSize: 12.5, color: T.textSec, lineHeight: 1.6 }}>
                sitting past the interval you set, across {r.totals.pastFollowUp} of
                the {r.totals.openClaims} claims still open.
              </p>
              <p style={{ margin: '12px 0 0', fontSize: 12, color: T.textMuted, lineHeight: 1.6, paddingTop: 10, borderTop: `${S.rule} solid ${T.border}` }}>
                There are no thirty, sixty and ninety day buckets on this page. Every practice system
                draws them and they are the same everywhere, which is why they cannot tell a claim at
                forty days with a payer who settles at fifty from one with a payer who settles at
                twenty. One of those is fine and the other is a fortnight late.
              </p>
            </Panel>

            <WontDo items={[
              'It will not predict whether a payer will pay, or when. That is a guess about somebody else’s office dressed up as a calculation.',
              'It will not score or rank your payers. It reports what each one has actually done and leaves the judgment with you.',
              'It will not suggest a follow-up interval. Yours came from watching that payer, and nothing here has watched anything.',
              'It will not compare you to any published days-in-accounts-receivable figure. That number is somebody else’s payer mix.',
              'It will never decide to write something off, and it does not net a denial away. Denied money is still owed until you say otherwise.',
            ]} />
          </div>
        </div>
      </div>
    </div>
  );
}
