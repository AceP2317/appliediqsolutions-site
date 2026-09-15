// ============================================================================
// NO-SHOW COST — Bight Street Physical Therapy (portfolio demo)
//
// A PT clinic books in series: an hour, twice a week, for six weeks. When
// somebody does not come, three things happen and a practice usually only sees
// the first. The visit is not billed. The room and the therapist sit there
// anyway. And a fee may or may not go on the account, depending on a rule the
// practice wrote and a decision somebody made at the desk that morning.
//
// THE TWO FIGURES ARE DELIBERATELY NEVER ADDED, and the page says so where a
// reader will actually meet it rather than in a footnote. Money not billed is
// money that did not arrive. The idle room cost is what that hour was already
// costing while nothing came in against it — the lease and the salary were paid
// either way. Summing them counts an hour of overhead twice and prints a bigger,
// more alarming number than anything that happened, which is precisely why a
// tool that did it would be the wrong tool.
//
// THERE IS NO NAME FIELD AND THERE WILL NOT BE ONE. A booking reference is as
// far as this goes, on the same reasoning as the Recall Due List: a practice
// using this is working out what a week cost, not keeping a record about a
// person. Nothing here scores anybody or predicts who will miss.
//
// Built by Ian Provencher · AppliedIQ Solutions
// Public demo — the clinic, the week and every reference are invented.
// ============================================================================

import React, { useMemo, useState } from 'react';
import { computeNoShowCost } from '../../lib/no-show-cost.js';
import { T, A, S, FONT_DATA, FONT_HEAD, Panel, Btn, Cell, Field, ToolHeader, Problems, WontDo, useRemembered, toCents, toNumber, cash, uid, wrap, th, thN, td, tdN, exportRows, pageFor, Readout } from '../kit/shelf.jsx';

const CLINIC = 'Bight Street Physical Therapy';

// ============================================================================
// THE SAMPLE WEEK — the same figures scripts/verify-tools.mjs works out by hand.
// A $40 fee, a 24-hour window that also catches late cancels, and a room the
// clinic reckons costs $68 an hour to keep open.
// ============================================================================
const SAMPLE = {
  feeCents: 4000,
  lateWindowHours: 24,
  chargeLateCancels: true,
  roomCostPerHourCents: 6800,
  rows: [
    { id: 'v1', ref: 'A-4412', kind: 'no-show', noticeHours: 0, minutes: 45, valueCents: 13500, refilled: false, refilledValueCents: 0, feeChargedCents: 4000 },
    { id: 'v2', ref: 'A-4418', kind: 'cancel', noticeHours: 3, minutes: 60, valueCents: 17000, refilled: true, refilledValueCents: 17000, feeChargedCents: 4000 },
    { id: 'v3', ref: 'A-4423', kind: 'cancel', noticeHours: 40, minutes: 45, valueCents: 13500, refilled: true, refilledValueCents: 9000, feeChargedCents: 0 },
    { id: 'v4', ref: 'A-4431', kind: 'no-show', noticeHours: 0, minutes: 30, valueCents: 9000, refilled: false, refilledValueCents: 0, feeChargedCents: 0 },
    { id: 'v5', ref: 'A-4437', kind: 'no-show', noticeHours: 0, minutes: 60, valueCents: 17000, refilled: false, refilledValueCents: 0, feeChargedCents: 4000 },
    { id: 'v6', ref: 'A-4440', kind: 'cancel', noticeHours: 12, minutes: 45, valueCents: 13500, refilled: false, refilledValueCents: 0, feeChargedCents: 4000 },
  ],
};

const hoursText = (mins) => {
  if (mins === 0) return 'none';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return [h ? `${h} h` : '', m ? `${m} min` : ''].filter(Boolean).join(' ');
};

export default function NoShowCost({ mode = 'demo' }) {
  const { state, patch, reset, status, restored, pack } = useRemembered('no-show-cost', 1, SAMPLE, mode);
  const [busy, setBusy] = useState(false);
  const r = useMemo(() => computeNoShowCost(state), [state]);

  const doExport = async () => {
    setBusy(true);
    try {
      await exportRows('no-show-cost.xlsx', 'Week',
        r.rows.map((v) => ({
          Reference: v.ref,
          Kind: v.kind === 'no-show' ? 'No-show' : (v.late ? 'Late cancel' : 'Cancel in time'),
          Notice_hours: v.notice,
          Minutes: v.minutes,
          Would_have_billed: Number((v.value / 100).toFixed(2)),
          Refilled: v.refilled ? 'yes' : 'no',
          Recovered: Number((v.recovered / 100).toFixed(2)),
          Not_billed: Number((v.notBilled / 100).toFixed(2)),
          Fee_due: Number((v.feeDue / 100).toFixed(2)),
          Fee_charged: Number((v.feeCharged / 100).toFixed(2)),
        })).concat([{}, {
          Reference: 'Not billed, after refills',
          Not_billed: Number((r.totals.notBilled / 100).toFixed(2)),
        }, {
          Reference: 'Fees collected',
          Fee_charged: Number((r.totals.feesCollected / 100).toFixed(2)),
        }, {
          Reference: 'The week is short',
          Not_billed: Number((r.totals.shortfall / 100).toFixed(2)),
        }, {
          Reference: 'Room time paid for and not used (NOT added to the above)',
          Minutes: r.totals.minutesIdle,
          Would_have_billed: Number((r.totals.idleCost / 100).toFixed(2)),
        }]),
        [30, 14, 13, 9, 18, 9, 11, 11, 9, 12]);
    } finally { setBusy(false); }
  };

  const kindLabel = (v) => (v.kind === 'no-show' ? 'No-show' : (v.late ? 'Late cancel' : 'In time'));

  return (
    <div style={pageFor('no-show-cost')} data-demo="no-show-cost">
      <ToolHeader toolId="no-show-cost" house={CLINIC} occasion="sample week" name="No-Show Cost Calculator" status={status} restored={restored} pack={pack} remembers="fee, your window and the room cost">
        What a week of missed visits actually cost, on your own policy rather than anybody else's.
        The money not billed and the room you paid for and did not use are kept apart, because
        adding them counts the same hour twice. Nothing you type leaves this page.
      </ToolHeader>

      <Readout items={[
        { label: 'The week is short', value: cash(r.totals.shortfall),
          tone: r.totals.shortfall > 0 ? 'bad' : 'good',
          note: 'visits not billed, less the fees you actually collected' },
        { label: 'Not billed', value: cash(r.totals.notBilled),
          note: r.totals.recovered > 0 ? `after ${cash(r.totals.recovered)} recovered by refilling` : 'nothing was recovered by refilling' },
        { label: 'Fees collected', value: cash(r.totals.feesCollected),
          note: r.totals.waived > 0 ? `${cash(r.totals.waived)} was due and not charged` : 'everything your policy made due' },
        { label: 'Room paid for, not used', value: hoursText(r.totals.minutesIdle),
          note: `${cash(r.totals.idleCost)} — reported beside the money, never added to it` },
      ]} />

      <div style={wrap}>
        <Problems heading="Look at these before you trust the week" items={r.problems} />

        <div className="aiq-split" style={{ '--aiq-split': '1.9fr' }}>
          <div>
            <Panel
              title="The visits that did not happen"
              note="A reference, how much notice came in, and what the visit would have billed. No names, and nothing about why."
              right={<Btn small onClick={() => patch((s) => { s.rows.push({ id: uid('v'), ref: '', kind: 'no-show', noticeHours: 0, minutes: 45, valueCents: 0, refilled: false, refilledValueCents: 0, feeChargedCents: 0 }); })}>Add a visit</Btn>}
            >
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
                  <thead>
                    <tr>
                      <th style={th}>Ref</th><th style={th}>Kind</th><th style={thN}>Notice</th>
                      <th style={thN}>Mins</th><th style={thN}>Would bill</th><th style={th}>Refilled</th>
                      <th style={thN}>Not billed</th><th style={thN}>Fee due</th><th style={thN}>Charged</th>
                      <th style={th} />
                    </tr>
                  </thead>
                  <tbody>
                    {r.rows.map((v, i) => (
                      <tr key={v.id} style={{ background: v.overCharged || v.refillUnknown ? A.badTint : (v.waived > 0 ? A.warnTint : 'transparent') }}>
                        <td style={td}><Cell label={`reference for row ${i + 1}`} w={72} value={v.ref} onChange={(x) => patch((n) => { n.rows[i].ref = x; })} /></td>
                        <td style={td}>
                          <Btn small onClick={() => patch((n) => { n.rows[i].kind = n.rows[i].kind === 'no-show' ? 'cancel' : 'no-show'; })}>{kindLabel(v)}</Btn>
                        </td>
                        <td style={tdN}>
                          {v.kind === 'no-show'
                            ? <span style={{ color: T.textMuted }}>—</span>
                            : <Cell label={`notice given on ${v.ref || `row ${i + 1}`}`} w={44} value={String(v.notice)} onChange={(x) => patch((n) => { n.rows[i].noticeHours = toNumber(x); })} />}
                        </td>
                        <td style={tdN}><Cell label={`minutes booked for ${v.ref || `row ${i + 1}`}`} w={44} value={String(v.minutes)} onChange={(x) => patch((n) => { n.rows[i].minutes = Math.round(toNumber(x)); })} /></td>
                        <td style={tdN}><Cell label={`what ${v.ref || `row ${i + 1}`} would have billed`} w={62} value={(v.value / 100).toFixed(2)} onChange={(x) => patch((n) => { n.rows[i].valueCents = toCents(x); })} /></td>
                        <td style={td}>
                          <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <Btn small onClick={() => patch((n) => { n.rows[i].refilled = !n.rows[i].refilled; })}>{v.refilled ? 'Refilled' : 'Empty'}</Btn>
                            {/* w=70, MEASURED. At 58 a four-figure amount clipped to
                                "170.0(" in the sample — which no gate can see, because
                                the value is correct and only the box is short. Caught by
                                looking at the captured tile. */}
                            {v.refilled && (
                              <Cell label={`what the replacement for ${v.ref || `row ${i + 1}`} billed`} w={70} value={(v.refillValue == null ? 0 : v.refillValue / 100).toFixed(2)} onChange={(x) => patch((n) => { n.rows[i].refilledValueCents = toCents(x); })} />
                            )}
                          </span>
                        </td>
                        <td style={{ ...tdN, fontWeight: 700, color: v.notBilled > 0 ? A.bad : T.textMuted }}>{cash(v.notBilled)}</td>
                        <td style={{ ...tdN, color: T.textSec }}>{v.feeDue === 0 ? '—' : cash(v.feeDue)}</td>
                        <td style={tdN}><Cell label={`fee charged on ${v.ref || `row ${i + 1}`}`} w={54} value={(v.feeCharged / 100).toFixed(2)} onChange={(x) => patch((n) => { n.rows[i].feeChargedCents = toCents(x); })} /></td>
                        <td style={{ ...td, textAlign: 'right' }}><Btn small onClick={() => patch((n) => { n.rows.splice(i, 1); })}>×</Btn></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p style={{ margin: '10px 0 0', fontSize: 11.5, color: T.textMuted, lineHeight: 1.55 }}>
                A no-show gives no notice at all, so it is always inside your window. A cancel is late
                only if it came in under the hours you set — and whether that is charged is your rule,
                not this page's.
              </p>
            </Panel>
          </div>

          <div>
            <Panel title="Your policy" note="Three decisions that belong to this practice and to nobody else.">
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <Field label="Your fee" prefix="$" w={84} value={(state.feeCents / 100).toFixed(2)} onChange={(v) => patch((n) => { n.feeCents = toCents(v); })} />
                <Field label="Late under" suffix="h" w={70} value={String(state.lateWindowHours)} onChange={(v) => patch((n) => { n.lateWindowHours = toNumber(v); })} />
                <Field label="Room, per hour" prefix="$" w={92} value={(state.roomCostPerHourCents / 100).toFixed(2)} onChange={(v) => patch((n) => { n.roomCostPerHourCents = toCents(v); })} />
              </div>
              <div style={{ marginTop: 11 }}>
                <Btn small onClick={() => patch((n) => { n.chargeLateCancels = !n.chargeLateCancels; })}>
                  {state.chargeLateCancels ? 'Late cancels are charged' : 'Late cancels are not charged'}
                </Btn>
              </div>
              <p style={{ margin: '9px 0 0', fontSize: 11.5, color: T.textMuted, lineHeight: 1.55 }}>
                The room figure is what an hour costs you to keep open — the lease, the therapist, the
                equipment. It is your number; nothing here suggests one.
              </p>
            </Panel>

            <Panel title="This week" right={
              <span style={{ display: 'flex', gap: 8 }}>
                <Btn small onClick={reset}>Reset</Btn>
                <Btn small primary onClick={doExport}>{busy ? 'Building…' : 'Export'}</Btn>
              </span>
            }>
              <p style={{ margin: 0, fontSize: 34, fontWeight: 700, fontFamily: FONT_DATA, lineHeight: 1.1, color: r.totals.shortfall > 0 ? A.bad : A.brass }}>
                {cash(r.totals.shortfall)}
              </p>
              <p style={{ margin: '6px 0 0', fontSize: 12.5, color: T.textSec, lineHeight: 1.6 }}>
                across {r.totals.visits} missed {r.totals.visits === 1 ? 'visit' : 'visits'} — {r.totals.noShows} did
                not come, {r.totals.lateCancels} canceled inside your window
                and {r.totals.inTimeCancels} canceled in time.
              </p>
              <p style={{ margin: '12px 0 0', fontSize: 12, color: T.textMuted, lineHeight: 1.6, paddingTop: 10, borderTop: `${S.rule} solid ${T.border}` }}>
                <strong style={{ color: T.textSec }}>{hoursText(r.totals.minutesIdle)}</strong> of room
                time was paid for and not used, which comes to {cash(r.totals.idleCost)}. That figure is
                <strong style={{ color: T.textSec }}> not added</strong> to the number above. The lease and
                the salary were paid whether or not the hour was used, so adding them would count the
                same hour twice and print something larger than what happened.
              </p>
            </Panel>

            <WontDo items={[
              'It will not tell you what to charge. A no-show fee is a decision about the kind of practice you want to run, and there is no arithmetic in it.',
              'It will not say who is likely to miss. Scoring a person on their history is a guess about somebody dressed up as a calculation, and it is not what this is.',
              'It will not compare your week to any published no-show rate. Yours depends on your town, your hours and who you take, and a benchmark would only ever be somebody else’s.',
              'It will not add the empty room to the missed billing. That hour was already paid for, and summing the two would count it twice.',
              'It holds no names and nothing clinical — a booking reference is as far as it goes.',
            ]} />
          </div>
        </div>
      </div>
    </div>
  );
}
