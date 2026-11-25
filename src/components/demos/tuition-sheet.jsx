// ============================================================================
// TUITION SHEET — Cypress Landing Early Learning (portfolio demo)
//
// THE OBVIOUS TOOL FOR A CHILDCARE CENTER IS A RATIO CALCULATOR, AND IT IS THE
// WRONG TOOL TWICE. Ratios are set by state rule, so they are identical for
// every center in North Carolina — a rule belonging to the trade rather than to
// the owner, which is D36's test failed outright. And a page telling an owner
// their staffing was fine would be making a compliance claim about a licensed
// operation from numbers typed into a browser. That is refused out loud in the
// list below rather than quietly left out.
//
// WHAT IS ACTUALLY THE OWNER'S is the money: a rate card with a day rate that is
// never the weekly rate over five, a sibling percentage AND which enrollment it
// comes off, whether a subsidy gap gets billed to the family or absorbed, and a
// late-pickup rate per minute.
//
// THE SIBLING DISCOUNT COMES OFF ONE ENROLLMENT, NOT OFF THE FAMILY. Off the
// cheapest place and off the dearest are both common rules and they are
// different money — on the sample, $11.00 against $25.50 for the same family.
//
// Built by Ian Provencher · AppliedIQ Solutions
// Public demo — the center, the families and every child are invented.
// ============================================================================

import React, { useMemo, useState } from 'react';
import { computeTuition } from '../../lib/tuition-sheet.js';
import { T, A, S, FONT_DATA, Panel, Btn, Cell, Field, ToolHeader, Problems, WontDo, useRemembered, toCents, toHundredths, toNumber, cash, uid, wrap, th, thN, td, tdN, exportRows, pageFor, Readout } from '../kit/shelf.jsx';

const CENTER = 'Cypress Landing Early Learning';

// ============================================================================
// THE SAMPLE WEEK — the same figures scripts/verify-tools.mjs works out by hand.
// Three families, three rooms, one voucher and one late pickup.
// ============================================================================
const SAMPLE = {
  rooms: [
    { id: 'r1', name: 'Infants', weeklyCents: 29500, dayCents: 7000 },
    { id: 'r2', name: 'Toddlers', weeklyCents: 25500, dayCents: 6200 },
    { id: 'r3', name: 'Preschool', weeklyCents: 22500, dayCents: 5500 },
  ],
  siblingPctHundredths: 1000,
  siblingApplies: 'cheapest',
  lateCentsPerMinute: 125,
  billSubsidyGap: true,
  families: [
    { id: 'f1', name: 'Alvarez', subsidyCents: 0, lateMinutes: 0, children: [
      { id: 'k1', name: 'Mara', roomId: 'r1', fullTime: true, days: 0 },
      { id: 'k2', name: 'Tobin', roomId: 'r3', fullTime: true, days: 0 },
    ] },
    { id: 'f2', name: 'Boone', subsidyCents: 12000, lateMinutes: 0, children: [
      { id: 'k3', name: 'Wren', roomId: 'r2', fullTime: false, days: 3 },
    ] },
    { id: 'f3', name: 'Chen', subsidyCents: 0, lateMinutes: 22, children: [
      { id: 'k4', name: 'Rue', roomId: 'r2', fullTime: true, days: 0 },
      { id: 'k5', name: 'Nel', roomId: 'r3', fullTime: true, days: 0 },
      { id: 'k6', name: 'Ovid', roomId: 'r3', fullTime: false, days: 2 },
    ] },
  ],
};

export default function TuitionSheet({ mode = 'demo' }) {
  const { state, patch, reset, status, restored, pack } = useRemembered('tuition-sheet', 1, SAMPLE, mode);
  const [busy, setBusy] = useState(false);
  const r = useMemo(() => computeTuition(state), [state]);

  /* ONE FLAT LIST OF ENROLLMENTS, carrying the two indices back into state. The
     children live nested under their family, and a nested table would need a
     header row per household — which is not how a sign-in sheet is read. */
  const enrollments = state.families.flatMap((f, fi) => f.children.map((c, ci) => ({ f, fi, c, ci })));
  const computed = (fi, ci) => r.families[fi]?.children[ci] || {};

  const cycle = (list, id) => {
    const ids = list.map((x) => x.id);
    return ids[(ids.indexOf(id) + 1) % Math.max(1, ids.length)];
  };

  const doExport = async () => {
    setBusy(true);
    try {
      await exportRows('tuition-sheet.xlsx', 'Week',
        r.families.map((f) => ({
          Family: f.name,
          Children: f.children.length,
          Places: Number((f.gross / 100).toFixed(2)),
          Sibling_discount: Number((f.discount / 100).toFixed(2)),
          Discount_came_off: f.discountOnName || '',
          Subsidy: Number((f.subsidyApplied / 100).toFixed(2)),
          Late: Number((f.late / 100).toFixed(2)),
          Family_pays: Number((f.familyPays / 100).toFixed(2)),
        })).concat([{}, {
          Family: 'Places at your rate card',
          Places: Number((r.totals.gross / 100).toFixed(2)),
        }, {
          Family: 'Sibling discounts given',
          Sibling_discount: Number((r.totals.discounts / 100).toFixed(2)),
        }, {
          Family: 'Covered by voucher',
          Subsidy: Number((r.totals.subsidy / 100).toFixed(2)),
        }, {
          Family: 'The center collects',
          Family_pays: Number((r.totals.centerCollects / 100).toFixed(2)),
        }]),
        [22, 10, 12, 17, 20, 11, 10, 13]);
    } finally { setBusy(false); }
  };

  return (
    <div style={pageFor('tuition-sheet')} data-demo="tuition-sheet">
      <ToolHeader toolId="tuition-sheet" house={CENTER} occasion="sample week" name="Childcare Tuition Sheet" status={status} restored={restored} pack={pack} remembers="rate card, your sibling rule and your late rate">
        What each family owes this week on your own rate card, your own sibling rule and your own
        late rate. It works out money and nothing else — it will not compute a ratio or tell you
        anything about staffing. Nothing you type leaves this page.
      </ToolHeader>

      <Readout items={[
        { label: 'The center collects', value: cash(r.totals.centerCollects),
          note: `${cash(r.totals.familiesPay)} from families, ${cash(r.totals.subsidy)} from vouchers` },
        { label: 'Places at your rate card', value: cash(r.totals.gross),
          note: `${r.totals.children} children across ${r.totals.families} families` },
        { label: 'Sibling discounts given', value: cash(r.totals.discounts),
          note: `off the ${state.siblingApplies} place in each family, at ${(state.siblingPctHundredths / 100).toFixed(2)}%` },
        { label: 'Late pickup', value: cash(r.totals.late),
          note: `at ${cash(state.lateCentsPerMinute)} a minute, which is yours` },
      ]} />

      <div style={wrap}>
        <Problems heading="Look at these before the invoices go out" items={r.problems} />

        <div className="aiq-split" style={{ '--aiq-split': '1.9fr' }}>
          <div>
            <Panel
              title="This week, by family"
              note="The discount comes off ONE place, never off the whole bill — which is what a center's rule actually says."
              right={<Btn small onClick={() => patch((s) => { s.families.push({ id: uid('f'), name: 'New family', subsidyCents: 0, lateMinutes: 0, children: [] }); })}>Add a family</Btn>}
            >
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
                  <thead>
                    <tr>
                      <th style={th}>Family</th><th style={thN}>Places</th><th style={thN}>Sibling</th>
                      <th style={thN}>Voucher</th><th style={thN}>Late mins</th><th style={thN}>Late</th>
                      <th style={thN}>They pay</th><th style={th} />
                    </tr>
                  </thead>
                  <tbody>
                    {r.families.map((f, i) => (
                      <tr key={f.id} style={{ background: f.subsidyOverPlace || f.children.length === 0 ? A.badTint : 'transparent' }}>
                        <td style={td}>
                          <Cell label={`name of family ${i + 1}`} mono={false} w={112} value={f.name} onChange={(v) => patch((n) => { n.families[i].name = v; })} />
                          <span style={{ display: 'block', fontSize: 10, color: T.textMuted, marginTop: 2 }}>
                            {f.children.length} {f.children.length === 1 ? 'child' : 'children'}
                          </span>
                        </td>
                        <td style={{ ...tdN, color: T.textSec }}>{cash(f.gross)}</td>
                        <td style={{ ...tdN, color: f.discount > 0 ? A.brass : T.textMuted }}>
                          {f.discount === 0 ? '—' : `−${cash(f.discount)}`}
                          {f.discountOnName && <span style={{ display: 'block', fontSize: 10, color: T.textMuted }}>off {f.discountOnName}</span>}
                        </td>
                        <td style={tdN}><Cell label={`voucher for ${f.name}`} w={66} value={(f.subsidy / 100).toFixed(2)} onChange={(v) => patch((n) => { n.families[i].subsidyCents = toCents(v); })} /></td>
                        <td style={tdN}><Cell label={`minutes late for ${f.name}`} w={48} value={String(f.lateMinutes)} onChange={(v) => patch((n) => { n.families[i].lateMinutes = Math.round(toNumber(v)); })} /></td>
                        <td style={{ ...tdN, color: f.late > 0 ? A.bad : T.textMuted }}>{f.late === 0 ? '—' : cash(f.late)}</td>
                        <td style={{ ...tdN, fontWeight: 700, color: A.brass }}>{cash(f.familyPays)}</td>
                        <td style={{ ...td, textAlign: 'right' }}><Btn small onClick={() => patch((n) => { n.families.splice(i, 1); })}>×</Btn></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>

            <Panel
              title="Who is in which room"
              note="A part-time day is priced off the day rate, never the weekly rate divided by five — a part-time place still holds a space."
              right={<Btn small onClick={() => patch((s) => { if (s.families[0]) s.families[0].children.push({ id: uid('k'), name: 'New child', roomId: s.rooms[0]?.id || '', fullTime: true, days: 0 }); })}>Add a child</Btn>}
            >
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 660 }}>
                  <thead>
                    <tr>
                      <th style={th}>Child</th><th style={th}>Family</th><th style={th}>Room</th>
                      <th style={th}>Schedule</th><th style={thN}>Days</th><th style={thN}>This week</th><th style={th} />
                    </tr>
                  </thead>
                  <tbody>
                    {enrollments.map(({ f, fi, c, ci }) => {
                      const k = computed(fi, ci);
                      return (
                        <tr key={c.id} style={{ background: k.noRoom || k.daysOverWeek ? A.badTint : 'transparent' }}>
                          <td style={td}><Cell label={`name of child ${ci + 1} in ${f.name}`} mono={false} w={100} value={c.name} onChange={(v) => patch((n) => { n.families[fi].children[ci].name = v; })} /></td>
                          <td style={td}><Btn small onClick={() => patch((n) => {
                            const moved = n.families[fi].children.splice(ci, 1)[0];
                            const to = n.families.findIndex((x) => x.id === cycle(n.families, f.id));
                            n.families[to].children.push(moved);
                          })}>{f.name}</Btn></td>
                          <td style={td}><Btn small onClick={() => patch((n) => { n.families[fi].children[ci].roomId = cycle(n.rooms, c.roomId); })}>{k.roomName || 'no room'}</Btn></td>
                          <td style={td}><Btn small onClick={() => patch((n) => { n.families[fi].children[ci].fullTime = !n.families[fi].children[ci].fullTime; })}>{k.fullTime ? 'Full time' : 'Part time'}</Btn></td>
                          <td style={tdN}>
                            {k.fullTime ? <span style={{ color: T.textMuted }}>—</span>
                              : <Cell label={`days a week for ${c.name}`} w={44} value={String(k.days ?? 0)} onChange={(v) => patch((n) => { n.families[fi].children[ci].days = Math.round(toNumber(v)); })} />}
                          </td>
                          <td style={{ ...tdN, fontWeight: 700, color: k.gross > 0 ? T.text : A.bad }}>{cash(k.gross || 0)}</td>
                          <td style={{ ...td, textAlign: 'right' }}><Btn small onClick={() => patch((n) => { n.families[fi].children.splice(ci, 1); })}>×</Btn></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>

          <div>
            <Panel title="Your rate card" note="A weekly rate and a day rate per room. Both are yours; nothing here suggests either.">
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr><th style={th}>Room</th><th style={thN}>Week</th><th style={thN}>Day</th></tr>
                  </thead>
                  <tbody>
                    {state.rooms.map((room, i) => (
                      <tr key={room.id}>
                        <td style={td}><Cell label={`name of room ${i + 1}`} mono={false} w={92} value={room.name} onChange={(v) => patch((n) => { n.rooms[i].name = v; })} /></td>
                        <td style={tdN}><Cell label={`weekly rate for ${room.name}`} w={64} value={((room.weeklyCents || 0) / 100).toFixed(2)} onChange={(v) => patch((n) => { n.rooms[i].weeklyCents = toCents(v); })} /></td>
                        <td style={tdN}><Cell label={`day rate for ${room.name}`} w={58} value={((room.dayCents || 0) / 100).toFixed(2)} onChange={(v) => patch((n) => { n.rooms[i].dayCents = toCents(v); })} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>

            <Panel title="Your rules" note="Four decisions this center made once and kept.">
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <Field label="Sibling" suffix="%" w={74} value={(state.siblingPctHundredths / 100).toFixed(2)} onChange={(v) => patch((n) => { n.siblingPctHundredths = toHundredths(v); })} />
                <Field label="Late, a minute" prefix="$" w={82} value={(state.lateCentsPerMinute / 100).toFixed(2)} onChange={(v) => patch((n) => { n.lateCentsPerMinute = toCents(v); })} />
              </div>
              <div style={{ marginTop: 11, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Btn small onClick={() => patch((n) => { n.siblingApplies = n.siblingApplies === 'dearest' ? 'cheapest' : 'dearest'; })}>
                  {state.siblingApplies === 'dearest' ? 'Off the dearest place' : 'Off the cheapest place'}
                </Btn>
                <Btn small onClick={() => patch((n) => { n.billSubsidyGap = n.billSubsidyGap === false; })}>
                  {state.billSubsidyGap === false ? 'Gap absorbed' : 'Gap billed to the family'}
                </Btn>
              </div>
              <p style={{ margin: '9px 0 0', fontSize: 11.5, color: T.textMuted, lineHeight: 1.55 }}>
                Which place the sibling discount comes off is real money, not a detail: on this week
                it is the difference between {cash(r.totals.discounts)} and what the other rule would
                give. Both are ordinary and this takes no view.
              </p>
            </Panel>

            <Panel title="This week" right={
              <span style={{ display: 'flex', gap: 8 }}>
                <Btn small onClick={reset}>Reset</Btn>
                <Btn small primary onClick={doExport}>{busy ? 'Building…' : 'Export'}</Btn>
              </span>
            }>
              <p style={{ margin: 0, fontSize: 34, fontWeight: 700, fontFamily: FONT_DATA, lineHeight: 1.1, color: A.brass }}>
                {cash(r.totals.centerCollects)}
              </p>
              <p style={{ margin: '6px 0 0', fontSize: 12.5, color: T.textSec, lineHeight: 1.6 }}>
                across {r.totals.families} families and {r.totals.children} children, after
                {' '}{cash(r.totals.discounts)} of sibling discount.
              </p>
              <p style={{ margin: '12px 0 0', fontSize: 12, color: T.textMuted, lineHeight: 1.6, paddingTop: 10, borderTop: `${S.rule} solid ${T.border}` }}>
                A voucher covers a place up to what the place costs and never more. What it leaves is
                either billed to the family or carried by you, and that is a decision rather than an
                accident — so it is a switch here rather than an assumption.
              </p>
            </Panel>

            <WontDo items={[
              'It will not compute a staffing ratio, or tell you anything about whether your rooms are covered. Those are set by state rule and are the same for every center, and a page implying your licensed operation was compliant would be doing real harm.',
              'It will not suggest a rate, a sibling percentage or a late fee. Those are the decisions a center is actually paid to make.',
              'It will not compare your rates to anybody else’s. A published average is somebody else’s town, somebody else’s rooms and somebody else’s costs.',
              'It takes no view on whether the subsidy gap should be billed. Both are ordinary, and it only shows you what each one costs.',
              'It holds no dates of birth and nothing about any child beyond a name and a room.',
            ]} />
          </div>
        </div>
      </div>
    </div>
  );
}
