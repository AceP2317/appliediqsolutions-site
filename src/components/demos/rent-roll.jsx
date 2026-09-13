// ============================================================================
// RENT ROLL AND OWNER STATEMENT — Neuse Bend Property (portfolio demo)
//
// WHY THIS IS THE MANAGER'S TOOL AND NOT A PLATFORM'S. Property software
// collects the rent and records the repair perfectly well. What it cannot hold
// is the management agreement, because no two are written the same way and they
// are signed one owner at a time: the percentage, what the percentage is taken
// ON, and how much of a float this particular owner wants held back.
//
// THE FIRST FINDING IS THE FEE BASIS. A fee on rent CHARGED and a fee on rent
// COLLECTED are the same percentage and different money, and the gap is exactly
// whatever did not arrive. In a month where everybody pays they are identical to
// the cent — which is why nobody has looked at which their agreement says since
// the day they signed it. Both are printed here, per owner, with the difference
// named. The sample has real arrears on two owners so the gap is a live number.
//
// THE SECOND FINDING IS QUIETER. What is DISBURSED is not what the property
// earned: the reserve was held back, not spent, and it is still the owner's
// money sitting in the manager's account. Shown as one figure, a good month
// reads as a bad one. They are two figures here and the sheet says so.
//
// Built by Ian Provencher · AppliedIQ Solutions
// Public demo — the agency, the owners, the units and every term are invented.
// No real management fee is quoted and no real agency is named.
// ============================================================================

import React, { useMemo, useState } from 'react';
import { computeRentRoll } from '../../lib/rent-roll.js';
import { T, A, S, FONT_DATA, FONT_BODY, Panel, Btn, Cell, Field, ToolHeader, Problems, WontDo, useRemembered, toCents, toOptionalNumber, cash, uid, wrap, th, thN, td, tdN, exportRows, pageFor, Readout } from '../kit/shelf.jsx';

const AGENCY = 'Neuse Bend Property';

// ============================================================================
// THE SAMPLE ROLL — the same figures scripts/verify-tools.mjs works out by
// hand. Three owners on two different fee bases, seven units, and arrears on
// two of them, because a month where everybody pays makes both bases identical
// and the demo would have lost its argument. Nothing here trips a refusal: the
// arrears are PARTIAL, so the sheet opens clean and every problem below is
// reached by changing something.
// ============================================================================
const SAMPLE = {
  owners: [
    { id: 'o1', name: 'Delacroix Trust', feePctHundredths: 1000, feeBasis: 'charged', reserveTargetCents: 30000, reserveHeldCents: 12000 },
    { id: 'o2', name: 'M. Ordway', feePctHundredths: 800, feeBasis: 'collected', reserveTargetCents: 25000, reserveHeldCents: 10000 },
    { id: 'o3', name: 'Front Street Holdings', feePctHundredths: 1200, feeBasis: 'charged', reserveTargetCents: 40000, reserveHeldCents: 15000 },
  ],
  units: [
    { id: 'u1', ownerId: 'o1', ref: '12 Marsh St · A', rentChargedCents: 95000, rentCollectedCents: 95000, deductions: [{ id: 'd1', note: 'Water heater element', cents: 18500 }] },
    { id: 'u2', ownerId: 'o1', ref: '12 Marsh St · B', rentChargedCents: 95000, rentCollectedCents: 47500, deductions: [] },
    { id: 'u3', ownerId: 'o1', ref: '40 Craven Row', rentChargedCents: 132500, rentCollectedCents: 132500, deductions: [{ id: 'd2', note: 'Gutters cleared', cents: 12000 }, { id: 'd3', note: 'City water bill', cents: 6350 }] },
    { id: 'u4', ownerId: 'o2', ref: '7 Pollock Ct', rentChargedCents: 118000, rentCollectedCents: 118000, deductions: [{ id: 'd4', note: 'HVAC service call', cents: 21500 }] },
    { id: 'u5', ownerId: 'o2', ref: '9 Pollock Ct', rentChargedCents: 110000, rentCollectedCents: 88000, deductions: [] },
    { id: 'u6', ownerId: 'o3', ref: '301 Broad · Up', rentChargedCents: 87500, rentCollectedCents: 87500, deductions: [{ id: 'd5', note: 'Locks rekeyed', cents: 9500 }] },
    { id: 'u7', ownerId: 'o3', ref: '301 Broad · Down', rentChargedCents: 87500, rentCollectedCents: 87500, deductions: [] },
  ],
};

const pct = (h) => (h == null ? '—' : (h / 100).toFixed(2) + '%');
/* A SIGNED FIGURE, because the direction IS the finding. An unsigned gap reads
   as a size and says nothing about which way the money went. */
const signed = (c) => (c > 0 ? '+' : c < 0 ? '−' : '') + cash(Math.abs(c));

export default function RentRoll({ mode = 'demo' }) {
  const { state, patch, reset, status, restored, pack } = useRemembered('rent-roll', 1, SAMPLE, mode);
  const [busy, setBusy] = useState(false);
  const r = useMemo(() => computeRentRoll(state), [state]);

  /* THE DEDUCTIONS ARE EDITED FLAT AND STORED ON THE UNIT. A repair belongs to
     the unit it happened at — that is what puts it on the right owner's
     statement — but a manager enters them off a stack of invoices in whatever
     order they came, never unit by unit. So the list is flattened for typing and
     each row carries the two indices it writes back through. Built from `state`
     rather than from the computed rows, because those indices have to address
     the array that is actually being patched. */
  const spend = state.units.flatMap((u, ui) =>
    (u.deductions || []).map((d, di) => ({ ...d, ui, di, unitId: u.id })));

  const doExport = async () => {
    setBusy(true);
    try {
      await exportRows('rent-roll.xlsx', 'Owner statements',
        r.units.map((u) => ({
          Unit: u.ref,
          Owner: u.ownerName || '(not on your list)',
          Rent_charged: Number((u.charged / 100).toFixed(2)),
          Rent_collected: Number((u.collected / 100).toFixed(2)),
          In_arrears: Number((u.arrears / 100).toFixed(2)),
          Paid_out_for_them: Number((u.deductionTotal / 100).toFixed(2)),
          Fee_basis: u.feeBasis || '',
          Fee_on_charged: u.feeOnCharged == null ? '' : Number((u.feeOnCharged / 100).toFixed(2)),
          Fee_on_collected: u.feeOnCollected == null ? '' : Number((u.feeOnCollected / 100).toFixed(2)),
          Fee_taken: u.fee == null ? '' : Number((u.fee / 100).toFixed(2)),
        })).concat([{}]).concat(
          r.statements.map((s) => ({
            Unit: 'STATEMENT',
            Owner: s.name,
            Rent_charged: Number((s.charged / 100).toFixed(2)),
            Rent_collected: Number((s.collected / 100).toFixed(2)),
            In_arrears: Number((s.arrears / 100).toFixed(2)),
            Paid_out_for_them: Number((s.deductions / 100).toFixed(2)),
            Fee_basis: s.feeBasis,
            Fee_on_charged: s.feesOnCharged == null ? '' : Number((s.feesOnCharged / 100).toFixed(2)),
            Fee_on_collected: s.feesOnCollected == null ? '' : Number((s.feesOnCollected / 100).toFixed(2)),
            Fee_taken: s.fees == null ? '' : Number((s.fees / 100).toFixed(2)),
            Held_to_reserve: s.reserveTopUp == null ? '' : Number((s.reserveTopUp / 100).toFixed(2)),
            Paid_out_to_them: s.disbursed == null ? '' : Number((s.disbursed / 100).toFixed(2)),
          })),
        ).concat([{}, {
          Unit: 'The whole roll — rent collected',
          Rent_collected: Number((r.totals.collected / 100).toFixed(2)),
        }, {
          Unit: 'Fees, if every agreement said rent CHARGED',
          Fee_on_charged: Number((r.totals.feesOnCharged / 100).toFixed(2)),
        }, {
          Unit: 'Fees, if every agreement said rent COLLECTED',
          Fee_on_collected: Number((r.totals.feesOnCollected / 100).toFixed(2)),
        }, {
          Unit: 'Held back to reserve — still the owners’ money, not spent',
          Held_to_reserve: Number((r.totals.reserveTopUp / 100).toFixed(2)),
        }, {
          Unit: 'Paid out to the owners',
          Paid_out_to_them: Number((r.totals.disbursed / 100).toFixed(2)),
        }]),
        [30, 20, 13, 14, 11, 17, 11, 14, 16, 11, 16, 16]);
    } finally { setBusy(false); }
  };

  const t = r.totals;

  return (
    <div style={pageFor('rent-roll')} data-demo="rent-roll">
      <ToolHeader
        toolId="rent-roll" house={AGENCY} occasion="a month just closed" name="Rent Roll and Owner Statement"
        badge={cash(t.disbursed)}
        status={status} restored={restored} pack={pack}
        remembers="owners, the terms in their agreements and their reserves"
      >
        A month of units, per owner, down to the one figure an owner actually asks for — what is
        coming to me. Your fee on the basis their own agreement states, what you paid out on their
        behalf, and what you held back to their reserve, kept separate because the last of those is
        still their money. Nothing you type leaves this page.
      </ToolHeader>

      {/* A RECEIPT FOOT, WHICH IS WHAT THE DOCUMENT ACTUALLY IS. Every line below
          comes off the line above it and the last one is what leaves the account,
          so the shape says something true about the arithmetic rather than being
          a strip of unrelated figures. The reserve is a line in it and carries
          its own sentence, because it is the one deduction that is not a cost. */}
      <Readout items={[
        { label: 'Rent collected', value: cash(t.collected),
          note: `— of ${cash(t.charged)} billed` },
        { label: 'Less your management fees', value: cash(t.fees),
          note: '— each on its own basis' },
        { label: 'Less what you paid out for them', value: cash(t.deductions),
          note: '— repairs and bills' },
        { label: 'Less held back to reserve', value: cash(t.reserveTopUp),
          note: '— still their money' },
        { label: 'Paid out to the owners', value: cash(t.disbursed),
          note: 'The reserve above was held back, not spent. It is still theirs.' },
      ]} />

      <div style={wrap}>
        <Problems heading="Read these before you read a single figure" items={r.problems} />

        {/* THE ANSWER FIRST. Seven columns, full width, and the reserve has a
            column of its own rather than being netted into what goes out. */}
        <Panel
          title="What actually goes out to each owner"
          note="The last two columns are one month of their money in two places: what leaves your account for theirs, and what stays in yours with their name against it."
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 880 }}>
              <thead>
                <tr>
                  <th style={th}>Owner</th><th style={thN}>Units</th><th style={thN}>Collected</th>
                  <th style={thN}>Management fee</th><th style={thN}>Paid out for them</th>
                  <th style={thN}>Held to reserve</th><th style={thN}>Goes to them</th>
                </tr>
              </thead>
              <tbody>
                {r.statements.map((s) => (
                  <tr key={s.id} style={{ background: s.negative ? A.badTint : (s.unpriced ? A.warnTint : 'transparent') }}>
                    <td style={{ ...td, color: T.textSec }}>
                      {s.name}
                      <span style={{ display: 'block', fontSize: 10.5, color: T.textMuted, fontFamily: FONT_BODY }}>
                        {s.unpriced ? 'no fee entered' : `${pct(s.feePct)} of rent ${s.feeBasis}`}
                      </span>
                    </td>
                    <td style={tdN}>{s.units}</td>
                    <td style={{ ...tdN, color: T.textSec }}>{cash(s.collected)}</td>
                    <td style={{ ...tdN, color: T.textMuted }}>{s.fees == null ? '—' : cash(s.fees)}</td>
                    <td style={{ ...tdN, color: T.textMuted }}>{cash(s.deductions)}</td>
                    {/* SPELLED AS WHAT IT IS, not as a deduction. A top-up of
                        nothing because the target is met is a different sentence
                        from a reserve nobody set, and both print as $0.00. */}
                    <td style={{ ...tdN, color: T.textSec }}>
                      {s.reserveTopUp == null ? '—' : cash(s.reserveTopUp)}
                      <span style={{ display: 'block', fontSize: 10, color: T.textMuted, fontFamily: FONT_BODY }}>
                        {s.noReserve ? 'no reserve asked for' : (s.reserveMet ? 'target already met' : `${cash(s.reserveAfter)} held after`)}
                      </span>
                    </td>
                    <td style={{ ...tdN, fontWeight: 700, color: s.disbursed == null ? T.textMuted : (s.disbursed < 0 ? A.bad : A.brass) }}>
                      {s.disbursed == null ? '—' : cash(s.disbursed)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* THE FIRST FINDING, ON ITS OWN. It is a COMPARISON rather than a line
            in the foot above, so it gets a table where both figures sit side by
            side — the whole claim is that they are the same percentage and
            different money, and that is unreadable in a column that adds up. */}
        <Panel
          title="One percentage, and two different amounts"
          note="A fee on rent CHARGED is paid on rent that never arrived; a fee on rent COLLECTED is not. In a month where everybody pays, the two are identical to the cent — which is why almost nobody has read which their own agreement says."
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 940 }}>
              <thead>
                <tr>
                  <th style={th}>Owner</th><th style={th}>Their agreement</th>
                  <th style={thN}>In arrears</th><th style={thN}>Fee on charged</th>
                  <th style={thN}>Fee on collected</th><th style={thN}>They pay you</th>
                  <th style={thN}>The difference</th>
                </tr>
              </thead>
              <tbody>
                {r.statements.map((s) => (
                  <tr key={s.id} style={{ background: s.arrears > 0 && s.feeBasis === 'charged' ? A.warnTint : 'transparent' }}>
                    <td style={{ ...td, color: T.textSec }}>{s.name}</td>
                    <td style={{ ...td, color: T.textMuted, fontFamily: FONT_DATA, whiteSpace: 'nowrap' }}>
                      {s.unpriced ? '— not entered' : `${pct(s.feePct)} · ${s.feeBasis}`}
                    </td>
                    <td style={{ ...tdN, color: s.arrears > 0 ? A.warn : T.textMuted }}>{cash(s.arrears)}</td>
                    <td style={{ ...tdN, color: s.feeBasis === 'charged' ? T.text : T.textMuted, fontWeight: s.feeBasis === 'charged' ? 700 : 400 }}>
                      {s.feesOnCharged == null ? '—' : cash(s.feesOnCharged)}
                    </td>
                    <td style={{ ...tdN, color: s.feeBasis === 'collected' ? T.text : T.textMuted, fontWeight: s.feeBasis === 'collected' ? 700 : 400 }}>
                      {s.feesOnCollected == null ? '—' : cash(s.feesOnCollected)}
                    </td>
                    <td style={{ ...tdN, color: T.textSec }}>{s.fees == null ? '—' : cash(s.fees)}</td>
                    <td style={{ ...tdN, fontWeight: 700, color: s.feeDifference == null ? T.textMuted : (s.feeDifference > 0 ? A.warn : T.text) }}>
                      {s.feeDifference == null ? '—' : signed(s.feeDifference)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ margin: '10px 0 0', fontSize: 12, color: T.textMuted, lineHeight: 1.6 }}>
            A plus means their own basis pays you more than the other one would, and every cent of it
            is a fee on rent that did not arrive. A minus means the opposite, and that every dollar
            you recover from a late tenant is also a dollar of fee. Across the whole roll these
            agreements take {cash(t.feesOnCharged)} if they all say charged
            and {cash(t.feesOnCollected)} if they all say collected — the same percentages,
            and {cash(t.feeGap)} between them. Which is fairer is not a question this page has an
            answer to.
          </p>
        </Panel>

        <Panel
          title="Every unit this month"
          note="Arrears is reported and is never treated as income. Nothing below adds it to anything — it exists to be named, and it is what the difference between the two fee columns above is made of."
          right={<Btn small onClick={() => patch((s) => { s.units.push({ id: uid('u'), ref: 'New unit', ownerId: s.owners[0] ? s.owners[0].id : '', rentChargedCents: 0, rentCollectedCents: 0, deductions: [] }); })}>Add a unit</Btn>}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1000 }}>
              <thead>
                <tr>
                  <th style={th}>Unit</th><th style={th}>Owner</th>
                  <th style={thN}>Rent charged</th><th style={thN}>Rent collected</th>
                  <th style={thN}>In arrears</th><th style={thN}>Paid out for them</th>
                  <th style={thN}>Fee this month</th><th style={th} />
                </tr>
              </thead>
              <tbody>
                {r.units.map((u, i) => (
                  <tr key={u.id} style={{ background: u.noOwner || u.deductionsOverCollected ? A.badTint : (u.nothingCollected ? A.warnTint : 'transparent') }}>
                    <td style={td}><Cell label={`reference for unit ${i + 1}`} mono={false} w={140} value={u.ref} onChange={(v) => patch((n) => { n.units[i].ref = v; })} /></td>
                    <td style={td}>
                      <select aria-label={`owner of ${u.ref}`} value={u.ownerId}
                        onChange={(e) => patch((n) => { n.units[i].ownerId = e.target.value; })}
                        style={{ background: T.bg, color: T.text, border: `${S.rule} solid ${T.border}`, borderRadius: S.radiusSm, padding: '5px 6px', fontSize: 12, fontFamily: FONT_BODY, maxWidth: 176 }}>
                        {state.owners.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                        {u.noOwner && <option value={u.ownerId}>not on your list</option>}
                      </select>
                    </td>
                    <td style={tdN}><Cell label={`rent charged on ${u.ref}`} w={92} value={(u.charged / 100).toFixed(2)} onChange={(v) => patch((n) => { n.units[i].rentChargedCents = toCents(v); })} /></td>
                    <td style={tdN}><Cell label={`rent collected on ${u.ref}`} w={92} value={(u.collected / 100).toFixed(2)} onChange={(v) => patch((n) => { n.units[i].rentCollectedCents = toCents(v); })} /></td>
                    <td style={{ ...tdN, color: u.arrears > 0 ? A.warn : T.textMuted }}>{cash(u.arrears)}</td>
                    <td style={{ ...tdN, color: u.deductionsOverCollected ? A.bad : T.textMuted }}>{cash(u.deductionTotal)}</td>
                    <td style={{ ...tdN, fontWeight: 700, color: u.fee == null ? T.textMuted : T.text }}>
                      {u.fee == null ? '—' : cash(u.fee)}
                      <span style={{ display: 'block', fontSize: 10, color: T.textMuted, fontFamily: FONT_BODY, fontWeight: 400 }}>
                        {u.feeBasis ? `on rent ${u.feeBasis}` : 'no owner'}
                      </span>
                    </td>
                    <td style={{ ...td, textAlign: 'right' }}><Btn small onClick={() => patch((n) => { n.units.splice(i, 1); })}>×</Btn></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="aiq-split" style={{ '--aiq-split': '1.5fr' }}>
          <div>
            <Panel
              title="The management agreements"
              note="Every column here is negotiated per owner and comes off the agreement they signed. Leave the fee blank and nothing is worked out for that owner — an empty box is not a fee of nothing."
              right={<Btn small onClick={() => patch((s) => { s.owners.push({ id: uid('o'), name: 'New owner', feePctHundredths: null, feeBasis: 'collected', reserveTargetCents: 0, reserveHeldCents: 0 }); })}>Add an owner</Btn>}
            >
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620 }}>
                  <thead>
                    <tr>
                      <th style={th}>Owner</th><th style={thN}>Fee</th><th style={th}>Taken on</th>
                      <th style={thN}>Reserve target</th><th style={thN}>Held now</th><th style={th} />
                    </tr>
                  </thead>
                  <tbody>
                    {r.statements.map((s, i) => (
                      <tr key={s.id} style={{ background: s.unpriced ? A.warnTint : 'transparent' }}>
                        <td style={td}><Cell label={`name of owner ${i + 1}`} mono={false} w={158} value={s.name} onChange={(v) => patch((n) => { n.owners[i].name = v; })} /></td>
                        {/* toOptionalNumber, NOT toCents. A blank box has to come
                            back as null so "nobody has entered one" survives all
                            the way to the engine; toCents would make it a
                            confident 0.00% and the refusal would be unreachable
                            from this page. */}
                        <td style={tdN}><Cell label={`management fee for ${s.name}`} w={62} value={s.feePct == null ? '' : (s.feePct / 100).toFixed(2)} onChange={(v) => { const n2 = toOptionalNumber(v); patch((n) => { n.owners[i].feePctHundredths = n2 == null ? null : Math.round(n2 * 100); }); }} /></td>
                        <td style={td}>
                          <select aria-label={`what the fee is taken on for ${s.name}`} value={s.feeBasis}
                            onChange={(e) => patch((n) => { n.owners[i].feeBasis = e.target.value; })}
                            style={{ background: T.bg, color: T.text, border: `${S.rule} solid ${T.border}`, borderRadius: S.radiusSm, padding: '5px 6px', fontSize: 12, fontFamily: FONT_BODY, maxWidth: 150 }}>
                            <option value="charged">Rent charged</option>
                            <option value="collected">Rent collected</option>
                          </select>
                        </td>
                        <td style={tdN}><Cell label={`reserve target for ${s.name}`} w={84} value={(s.reserveTarget / 100).toFixed(2)} onChange={(v) => patch((n) => { n.owners[i].reserveTargetCents = toCents(v); })} /></td>
                        <td style={tdN}><Cell label={`reserve already held for ${s.name}`} w={84} value={(s.reserveHeld / 100).toFixed(2)} onChange={(v) => patch((n) => { n.owners[i].reserveHeldCents = toCents(v); })} /></td>
                        <td style={{ ...td, textAlign: 'right' }}><Btn small onClick={() => patch((n) => { n.owners.splice(i, 1); })}>×</Btn></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>

            <Panel
              title="What you paid out on their behalf"
              note="Entered off the stack of invoices in whatever order they arrived, and put against the unit it was spent at — which is what lands it on the right owner's statement."
              right={<Btn small onClick={() => patch((s) => { if (s.units[0]) s.units[0].deductions.push({ id: uid('d'), note: 'New line', cents: 0 }); })}>Add a line</Btn>}
            >
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
                  <thead>
                    <tr>
                      <th style={th}>At which unit</th><th style={th}>What it was</th>
                      <th style={thN}>Amount</th><th style={th} />
                    </tr>
                  </thead>
                  <tbody>
                    {spend.map((d) => (
                      <tr key={d.id}>
                        <td style={td}>
                          <select aria-label={`unit line ${d.note} was spent at`} value={d.unitId}
                            onChange={(e) => patch((n) => {
                              const row = n.units[d.ui].deductions.splice(d.di, 1)[0];
                              const to = n.units.findIndex((x) => x.id === e.target.value);
                              if (to >= 0) n.units[to].deductions.push(row); else n.units[d.ui].deductions.splice(d.di, 0, row);
                            })}
                            style={{ background: T.bg, color: T.text, border: `${S.rule} solid ${T.border}`, borderRadius: S.radiusSm, padding: '5px 6px', fontSize: 12, fontFamily: FONT_BODY, maxWidth: 170 }}>
                            {state.units.map((u) => <option key={u.id} value={u.id}>{u.ref}</option>)}
                          </select>
                        </td>
                        <td style={td}><Cell label={`what was paid for at ${d.unitId}`} mono={false} w={214} value={d.note} onChange={(v) => patch((n) => { n.units[d.ui].deductions[d.di].note = v; })} /></td>
                        <td style={tdN}><Cell label={`amount of ${d.note}`} w={88} value={(d.cents / 100).toFixed(2)} onChange={(v) => patch((n) => { n.units[d.ui].deductions[d.di].cents = toCents(v); })} /></td>
                        <td style={{ ...td, textAlign: 'right' }}><Btn small onClick={() => patch((n) => { n.units[d.ui].deductions.splice(d.di, 1); })}>×</Btn></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>

          <div>
            <Panel title="This roll" right={
              <span style={{ display: 'flex', gap: 8 }}>
                <Btn small onClick={reset}>Reset</Btn>
                <Btn small primary onClick={doExport}>{busy ? 'Building…' : 'Export'}</Btn>
              </span>
            }>
              <p style={{ margin: 0, fontSize: 34, fontWeight: 700, fontFamily: FONT_DATA, lineHeight: 1.1, color: A.brass }}>
                {cash(t.disbursed)}
              </p>
              <p style={{ margin: '6px 0 0', fontSize: 12.5, color: T.textSec, lineHeight: 1.6 }}>
                out to {t.pricedOwners} owners across {t.pricedUnits} units, from {cash(t.collected)} collected
                — {cash(t.fees)} of management fees, {cash(t.deductions)} you paid out on their behalf,
                and {cash(t.reserveTopUp)} held back.
              </p>
              <p style={{ margin: '12px 0 0', fontSize: 12, color: T.textMuted, lineHeight: 1.6, paddingTop: 10, borderTop: `${S.rule} solid ${T.border}` }}>
                That {cash(t.reserveTopUp)} is not a cost and it is not yours. It is sitting in your
                account with their name against it, and their reserves stand at {cash(t.reserveAfter)}{' '}
                once this month is posted. An owner shown one figure for the disbursement and the
                hold-back together reads a good month as a bad one and rings up to ask what happened.
              </p>
              <p style={{ margin: '12px 0 0', fontSize: 12, color: T.textMuted, lineHeight: 1.6, paddingTop: 10, borderTop: `${S.rule} solid ${T.border}` }}>
                {cash(t.arrears)} of the rent you billed did not arrive. It is reported above and it is
                nowhere in these figures, because money nobody has is not income.
              </p>
            </Panel>

            <WontDo items={[
              'It will not suggest a management fee. What you charge is between you and the owner who signed.',
              'It will not suggest a reserve, or a target for one. How much float a property needs is a judgment about that property.',
              'It takes no view on whether a fee on rent charged or a fee on rent collected is the fairer arrangement. It prints both figures and stops.',
              'It will not chase arrears, predict them, or tell you how likely a tenant is to pay. There is no model behind any of this.',
              'It will not compare your fee to a published management rate, a market average, or the agency down the street.',
              'It will not decide what a reserve should be spent on. It only ever says how much of it is there.',
            ]} />
          </div>
        </div>
      </div>
    </div>
  );
}
