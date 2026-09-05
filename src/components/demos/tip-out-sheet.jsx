// ============================================================================
// TIP-OUT SHEET — The Salt Line, Marker Nine (portfolio demo)
//
// At close, a house has to split the night's tips. Every house does it
// differently: which roles get paid off the top, off WHICH sales figure, at
// what rate, and whether what is left splits by hours or by points. Those
// numbers are not an industry standard. They are one owner's decision, argued
// about once and then kept — which is exactly why no platform has taken this
// job. A rule identical across a trade pays a platform back; a rule belonging
// to one house never does. Toast sells it as a separate paid module and still
// publishes a spreadsheet for it.
//
// THE HONESTY CONTRACT, and it is not negotiable.
// Every figure on this page is the house's own input run through arithmetic
// printed beside the answer. There is no suggested split, no "standard" rate,
// no industry average, and no pre-filled percentage. The sample numbers belong
// to a made-up bar and are labelled as that bar's own rules, never as a
// recommendation. A tool that suggested a tip-out rate would be inventing the
// one thing the house is actually paid to decide.
//
// MONEY IS COUNTED IN WHOLE CENTS, NEVER IN DECIMAL DOLLARS.
// 0.1 + 0.2 is not 0.3 in binary floating point, and a tip sheet that drifts a
// penny is a tip sheet somebody stops trusting. Every amount below is an
// integer number of cents from the first line to the last, and the only
// division happens inside splitCents(), which is exact by construction.
//
// Built by Ian Provencher · AppliedIQ Solutions
// Public demo — the business, the staff and the shift are invented.
// ============================================================================

import React, { useMemo, useState } from 'react';
import { computeTipOut } from '../../lib/tip-out.js';
import { T, A, S, TOWN, FONT_BODY, FONT_DATA, ToolHeader, Panel, Btn, Cell, Field, Problems, WontDo, useRemembered, toCents, toHundredths, toNumber, toOptionalNumber, cash, plain, uid, page, wrap, th, thN, td, tdN, exportRows, pageFor, Readout } from '../kit/shelf.jsx';
// xlsx is imported lazily inside exportSheet() so its chunk stays off first
// paint. Export is a secondary action nobody takes on arrival.

// ============================================================================
// THE SAMPLE — one Saturday at a made-up bar in a made-up town.
// Marker Nine is a channel marker, and it is the town every tool on this shelf
// is set in. Nothing here is a real business, a real person, or a real night.
// ============================================================================
const HOUSE = 'The Salt Line';

const SAMPLE = {
  shift: 'Saturday dinner',
  sales: { food: 482000, bar: 314000 },
  tips: { card: 141250, cash: 26800 },
  deductions: [],
  support: [
    { id: 's1', role: 'Bar', basis: 'bar', percent: 5 },
    { id: 's2', role: 'Busser', basis: 'total', percent: 1.5 },
    { id: 's3', role: 'Food runner', basis: 'food', percent: 1 },
  ],
  poolBasis: 'hours',
  staff: [
    { id: 'p1', name: 'Dani R.', role: 'Server', hours: 7.5, points: 1 },
    { id: 'p2', name: 'Ellis M.', role: 'Server', hours: 7.5, points: 1 },
    { id: 'p3', name: 'Ruthie K.', role: 'Server', hours: 5, points: 1 },
    { id: 'p4', name: 'Nate B.', role: 'Server', hours: 4, points: 0.75 },
    { id: 'p5', name: 'Marcus T.', role: 'Bar', hours: 8, points: 1 },
    { id: 'p6', name: 'Joslin A.', role: 'Bar', hours: 4, points: 1 },
    { id: 'p7', name: 'Wren P.', role: 'Busser', hours: 6, points: 1 },
    { id: 'p8', name: 'Cal D.', role: 'Food runner', hours: 6, points: 1 },
  ],
};


// ============================================================================
// THEME — read from this tool's faceplate in kit/themes.js: a kraft check pad,
// accent instead of cyan. A bar is not a factory floor, and the shelf built for
// local business should not look like the one built for a plant.
// ============================================================================
/* THE THEME, THE CHROME, THE PARSING AND THE STORAGE ALL LIVE IN
   ../kit/shelf.jsx as of 2026-08-25. They were written here first, copied into
   the second tool, and only then extracted — which is the right order, because
   two tools built on deliberately different arithmetic are what showed which
   parts were genuinely shared rather than merely looked it.

   What stays in this file is this tool's own markup and its own sample. What
   left was every part that had nothing to do with the job it does. */


export default function TipOutSheet({ mode = 'demo' }) {
  const { state, patch, reset, status, restored, pack } = useRemembered('tip-out-sheet', 1, SAMPLE, mode);
  const [busy, setBusy] = useState(false);

  const r = useMemo(() => computeTipOut(state), [state]);

  const exportSheet = async () => {
    setBusy(true);
    try {
      const XLSX = await import('xlsx');
      const rows = r.payouts.map((p) => ({
        Name: p.name, Role: p.role, Paid_from: p.pot,
        Hours: p.hours, Points: p.points,
        Amount: Number((p.amount / 100).toFixed(2)),
        Worked_out: p.basis,
      }));
      rows.push({});
      rows.push({ Name: 'Tips collected', Amount: Number((r.grossTips / 100).toFixed(2)) });
      rows.push({ Name: 'Taken off the top', Amount: Number((r.deductionTotal / 100).toFixed(2)) });
      rows.push({ Name: 'Paid out', Amount: Number((r.paidOut / 100).toFixed(2)) });
      const ws = XLSX.utils.json_to_sheet(rows);
      ws['!cols'] = [{ wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 8 }, { wch: 8 }, { wch: 11 }, { wch: 34 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Tip-out');
      XLSX.writeFile(wb, 'tip-out-' + state.shift.toLowerCase().replace(/\s+/g, '-') + '.xlsx');
    } finally {
      setBusy(false);
    }
  };

  /* THE LOCAL COPIES ARE GONE. This file predates the shared kit and carried
     its own `th`/`td`/`tdN` plus a `wrap` that held a PAGE object under the
     kit's CENTERING name — a local const shadows an import silently, so any
     change to the kit stopped at this file with nothing erroring. */
  const grid = { display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', alignItems: 'start' };

  return (
    <div style={pageFor("tip-out-sheet")} data-demo="tip-out-sheet">
      <ToolHeader
        toolId="tip-out-sheet" house={HOUSE} occasion="sample night" name="Tip-Out Sheet"
        status={status} restored={restored} pack={pack} remembers="roster"
      >
        Your rules, your roster, your night. Nothing here is a suggested rate and nothing is
        compared against what other houses do — the percentages below belong to a made-up bar and
        are the only reason there are any numbers at all. Nothing you type leaves this page.
      </ToolHeader>

      <Readout items={[
        { label: 'Tips to split', value: cash(r.grossTips) },
        { label: 'Off the top', value: r.supportTotal ? '−' + cash(r.supportTotal) : cash(0),
          note: r.supportRows.length + ' support ' + (r.supportRows.length === 1 ? 'role' : 'roles') },
        { label: 'Left for the pool', value: cash(r.poolAmount),
          note: r.poolPeople.length + ' sharing, by ' + r.poolBasis },
        { label: 'Balances', value: r.balances ? 'to the penny' : 'not yet',
          tone: r.balances ? 'good' : 'bad',
          note: r.balances ? 'every dollar landed somewhere' : 'something is unaccounted for' },
      ]} />

      {/* WAS A HAND-ROLLED COPY of the kit's own Problems panel, painting
          #2A1417 — a near-black maroon from the dark era — behind red text on
          oyster paper. Same heading, same items, the shared component now, so
          the next change to the honesty furniture reaches this tool too. The
          local maxWidth: 1180 went with it; `wrap` is 1240 like the other eight. */}
      <div style={wrap}>
        <Problems heading="Do not pay this out yet" items={r.problems} />

        <div style={grid}>
          <div>
            <Panel title="The night" note="Net sales and the tips that came in. Everything below is worked out from these four numbers.">
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <Field label="Food sales" prefix="$" value={(state.sales.food / 100).toFixed(2)}
                  onChange={(v) => patch((s) => { s.sales.food = toCents(v); })} />
                <Field label="Bar sales" prefix="$" value={(state.sales.bar / 100).toFixed(2)}
                  onChange={(v) => patch((s) => { s.sales.bar = toCents(v); })} />
                <Field label="Card tips" prefix="$" value={(state.tips.card / 100).toFixed(2)}
                  onChange={(v) => patch((s) => { s.tips.card = toCents(v); })} />
                <Field label="Cash tips" prefix="$" value={(state.tips.cash / 100).toFixed(2)}
                  onChange={(v) => patch((s) => { s.tips.cash = toCents(v); })} />
              </div>
            </Panel>

            <Panel
              title="Off the top"
              note="What each support role is owed, as a percentage of a sales figure you choose. These are the house's rules, not anyone else's — set them to whatever you actually do."
              right={<Btn small onClick={() => patch((s) => { s.support.push({ id: uid('s'), role: 'New role', basis: 'total', percent: 0 }); })}>Add a role</Btn>}
            >
              {state.support.length === 0 && (
                <p style={{ margin: 0, fontSize: 13, color: T.textMuted }}>Nothing comes off the top. Every dollar goes to the pool.</p>
              )}
              {state.support.map((s, i) => (
                <div key={s.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 10 }}>
                  <Field label="Role" w={120} value={s.role}
                    onChange={(v) => patch((n) => { n.support[i].role = v; })} />
                  <Field label="Percent" w={72} value={String(s.percent)}
                    onChange={(v) => patch((n) => { n.support[i].percent = toNumber(v); })} />
                  <label style={{ display: 'block' }}>
                    <span style={{ display: 'block', fontSize: 11, color: T.textSec, marginBottom: 4 }}>of</span>
                    <select
                      value={s.basis}
                      onChange={(e) => patch((n) => { n.support[i].basis = e.target.value; })}
                      style={{ background: T.bg, color: T.text, border: `${S.rule} solid ${T.border}`, borderRadius: S.radiusSm, padding: '7px 9px', fontSize: 13, fontFamily: FONT_BODY }}
                    >
                      <option value="total">total sales</option>
                      <option value="food">food sales</option>
                      <option value="bar">bar sales</option>
                    </select>
                  </label>
                  <Btn small onClick={() => patch((n) => { n.support.splice(i, 1); })} title="Remove this role">Remove</Btn>
                </div>
              ))}
            </Panel>

            <Panel
              title="Taken out before anything is split"
              note="Some houses take something off the tips before the split — a card processing charge, a breakage line, whatever it is. This applies exactly what you enter and takes no view on whether you may."
              right={<Btn small onClick={() => patch((s) => { s.deductions.push({ id: uid('d'), label: 'New line', basis: 'tips', value: 0 }); })}>Add a line</Btn>}
            >
              {state.deductions.length === 0 && (
                <p style={{ margin: 0, fontSize: 13, color: T.textMuted }}>Nothing is taken out. All {cash(r.grossTips)} goes into the split.</p>
              )}
              {state.deductions.map((d, i) => (
                <div key={d.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 10 }}>
                  <Field label="What it is" w={130} value={d.label}
                    onChange={(v) => patch((n) => { n.deductions[i].label = v; })} />
                  <Field label="Amount" w={72} value={String(d.value)}
                    onChange={(v) => patch((n) => { n.deductions[i].value = toNumber(v); })} />
                  <label style={{ display: 'block' }}>
                    <span style={{ display: 'block', fontSize: 11, color: T.textSec, marginBottom: 4 }}>as</span>
                    <select
                      value={d.basis}
                      onChange={(e) => patch((n) => { n.deductions[i].basis = e.target.value; })}
                      style={{ background: T.bg, color: T.text, border: `${S.rule} solid ${T.border}`, borderRadius: S.radiusSm, padding: '7px 9px', fontSize: 13, fontFamily: FONT_BODY }}
                    >
                      <option value="tips">% of all tips</option>
                      <option value="card">% of card tips</option>
                      <option value="flat">a flat dollar amount</option>
                    </select>
                  </label>
                  <Btn small onClick={() => patch((n) => { n.deductions.splice(i, 1); })}>Remove</Btn>
                </div>
              ))}
            </Panel>

            <Panel
              title="Who worked"
              note="Anyone whose role matches a role above is paid from that role's pot. Everyone else shares what is left."
              right={<Btn small onClick={() => patch((s) => { s.staff.push({ id: uid('p'), name: 'New name', role: 'Server', hours: 0, points: 1 }); })}>Add a person</Btn>}
            >
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: T.textSec }}>Split what is left by</span>
                {['hours', 'points'].map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => patch((s) => { s.poolBasis = b; })}
                    style={{
                      background: state.poolBasis === b ? A.brass : T.surfaceAlt,
                      color: state.poolBasis === b ? A.accentInk : T.textSec,
                      border: '1px solid ' + (state.poolBasis === b ? A.brass : T.border),
                      borderRadius: S.radiusSm, padding: '5px 11px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    {b}
                  </button>
                ))}
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 420 }}>
                  <thead>
                    <tr><th style={th}>Name</th><th style={th}>Role</th><th style={{ ...th, textAlign: 'right' }}>Hours</th><th style={{ ...th, textAlign: 'right' }}>Points</th><th style={th} /></tr>
                  </thead>
                  <tbody>
                    {state.staff.map((p, i) => (
                      <tr key={p.id}>
                        {/* THESE WERE RAW <input> ELEMENTS until 2026-08-25, and that is
                            exactly why they kept the typing bug after the kit was fixed:
                            they never went through Cell, so they never got the draft that
                            preserves keystrokes. Typing 7.5 hours produced 75. A shared
                            component only helps the call sites that actually use it. */}
                        <td style={td}>
                          <Cell mono={false} w={120} label={`name for ${p.name}`} value={p.name}
                            onChange={(v) => patch((n) => { n.staff[i].name = v; })} />
                        </td>
                        <td style={td}>
                          <Cell mono={false} w={110} label={`role for ${p.name}`} value={p.role}
                            onChange={(v) => patch((n) => { n.staff[i].role = v; })} />
                        </td>
                        <td style={tdN}>
                          <Cell w={54} label={`hours for ${p.name}`} value={String(p.hours)}
                            onChange={(v) => patch((n) => { n.staff[i].hours = toNumber(v); })} />
                        </td>
                        <td style={tdN}>
                          <Cell w={54} label={`points for ${p.name}`} value={String(p.points)}
                            onChange={(v) => patch((n) => { n.staff[i].points = toNumber(v); })} />
                        </td>
                        <td style={{ ...td, textAlign: 'right' }}>
                          <Btn small onClick={() => patch((n) => { n.staff.splice(i, 1); })}>Remove</Btn>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>

          <div>
            <Panel
              title="What everyone gets"
              right={
                <span style={{ display: 'flex', gap: 8 }}>
                  <Btn small onClick={reset}>Reset to the sample</Btn>
                  <Btn small primary onClick={exportSheet}>{busy ? 'Building…' : 'Export'}</Btn>
                </span>
              }
            >
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 380 }}>
                  <thead>
                    <tr>
                      <th style={th}>Name</th><th style={th}>Paid from</th>
                      <th style={{ ...th, textAlign: 'right' }}>{state.poolBasis === 'points' ? 'Points' : 'Hours'}</th>
                      <th style={{ ...th, textAlign: 'right' }}>Gets</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.payouts.map((p) => (
                      <tr key={p.id}>
                        <td style={td}>{p.name}<span style={{ display: 'block', fontSize: 11, color: T.textMuted }}>{p.role}</span></td>
                        <td style={{ ...td, fontSize: 12, color: T.textSec }}>{p.pot}<span style={{ display: 'block', fontSize: 11, color: T.textMuted }}>{p.basis}</span></td>
                        <td style={tdN}>{state.poolBasis === 'points' ? p.points : p.hours}</td>
                        <td style={{ ...tdN, fontWeight: 700, color: A.brass, fontSize: 14.5 }}>{cash(p.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {r.poolPennies.length > 0 && (
                <p style={{ margin: '10px 0 0', fontSize: 12, color: T.textMuted, lineHeight: 1.55 }}>
                  The pool did not divide evenly, so {r.poolPennies.length} spare
                  {r.poolPennies.length === 1 ? ' penny went' : ' pennies went'} to the largest
                  {r.poolPennies.length === 1 ? ' share' : ' shares'}. That is the only way the
                  shares add back up to the money that came in.
                </p>
              )}
            </Panel>

            <Panel title="How it got there" note="Every line is one of your numbers and the arithmetic that moved it.">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr><td style={td}>Tips collected<span style={{ display: 'block', fontSize: 11, color: T.textMuted }}>{cash(state.tips.card)} on cards + {cash(state.tips.cash)} cash</span></td><td style={tdN}>{cash(r.grossTips)}</td></tr>
                  {r.deductionRows.map((d) => (
                    <tr key={d.id}><td style={td}>− {d.label}<span style={{ display: 'block', fontSize: 11, color: T.textMuted }}>{d.how}</span></td><td style={tdN}>−{cash(d.amount)}</td></tr>
                  ))}
                  {r.supportRows.map((s) => (
                    <tr key={s.id}>
                      <td style={td}>− {s.role}<span style={{ display: 'block', fontSize: 11, color: T.textMuted }}>{s.how} — {cash(s.base)} × {s.percent}%</span></td>
                      <td style={tdN}>−{cash(s.amount)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td style={{ ...td, fontWeight: 700 }}>
                      Left for the pool
                      <span style={{ display: 'block', fontSize: 11, color: T.textMuted, fontWeight: 400 }}>
                        shared across {r.poolPeople.length} {r.poolPeople.length === 1 ? 'person' : 'people'}, {r.poolWeightTotal} {state.poolBasis} between them
                      </span>
                    </td>
                    <td style={{ ...tdN, fontWeight: 700, color: r.poolAmount < 0 ? A.bad : A.brass, fontSize: 15 }}>{cash(r.poolAmount)}</td>
                  </tr>
                </tbody>
              </table>

              <div
                style={{
                  marginTop: 12, padding: '10px 12px', borderRadius: S.radius,
                  background: r.balances ? A.goodTint : A.badTint,
                  border: '1px solid ' + (r.balances ? A.good : A.bad),
                  fontSize: 12.5, lineHeight: 1.55,
                }}
              >
                {r.balances ? (
                  <>
                    <strong style={{ color: A.good }}>The night balances.</strong>{' '}
                    {cash(r.paidOut)} handed out plus {cash(r.deductionTotal)} taken off the top is
                    exactly the {cash(r.grossTips)} that came in. Checked to the penny, every time
                    you change a number.
                  </>
                ) : (
                  <>
                    <strong style={{ color: A.bad }}>The night does not balance.</strong>{' '}
                    {cash(Math.abs(r.shortfall))} is unaccounted for. Do not pay this out.
                  </>
                )}
              </div>
            </Panel>

            <Panel title="What this will not do">
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.65, color: T.textSec }}>
                <li>It will not tell you what to tip out. Those percentages are yours, and a tool that suggested them would be inventing the one thing you are paid to decide.</li>
                <li>It does not know what other houses do, and it will never compare you to them.</li>
                <li>It is not tax or wage-law advice. It applies the rule you type and takes no view on whether you may.</li>
                <li>Nothing you type is sent anywhere, stored by anyone, or seen by me. It is arithmetic in your own browser.</li>
              </ul>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}
