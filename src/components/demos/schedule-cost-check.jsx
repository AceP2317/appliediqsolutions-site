// ============================================================================
// SCHEDULE COST CHECK — The Salt Line, Marker Nine (portfolio demo)
//
// What you have written on next week's schedule, costed at your own wage rates,
// against the sales you expect and the labour share you have decided you want.
//
// The entry-level shift apps put this behind a paid tier and the free ones leave
// it out, and the reason it survives as a gap is that the rule is the owner's:
// their target, their roles, their rates, their read on next week.
//
// THE HONESTY CONTRACT, and this tool tests it harder than the others.
// It does not forecast sales — the expected figure is the owner's estimate, it
// starts blank, and the page says every answer moves with it. It carries no
// labour-target benchmark, because what share of sales your payroll should be is
// a decision about your business rather than a number from a survey. And it
// computes nobody's take-home: tips, taxes, overtime and tip credit are real and
// specific, and a figure this tool cannot show the working for is one it will
// not print.
//
// Built by Ian Provencher · AppliedIQ Solutions
// Public demo — the business, the roster and the week are invented.
// ============================================================================

import React, { useMemo, useState } from 'react';
import { computeSchedule } from '../../lib/schedule-cost.js';
import { T, A, S, FONT_DATA, Panel, Btn, Cell, Field, ToolHeader, Problems, WontDo, useRemembered, toCents, toHundredths, toOptionalNumber, cash, plain, uid, page, wrap, th, thN, td, tdN, exportRows, pageFor, Readout } from '../kit/shelf.jsx';

const HOUSE = 'The Salt Line';

// ============================================================================
// THE SAMPLE — next week's schedule at a made-up bar in a made-up town.
// Hours are hundredths: 750 is seven and a half. Rates are cents per hour.
// ============================================================================
const SAMPLE = {
  week: 'next week',
  expectedSales: 1850000,
  targetPercent: null,
  shifts: [
    { id: 's1', name: 'Dani R.', role: 'Server', hours: 3200, rate: 900 },
    { id: 's2', name: 'Ellis M.', role: 'Server', hours: 2800, rate: 900 },
    { id: 's3', name: 'Ruthie K.', role: 'Server', hours: 2000, rate: 900 },
    { id: 's4', name: 'Marcus T.', role: 'Bar', hours: 3600, rate: 1400 },
    { id: 's5', name: 'Joslin A.', role: 'Bar', hours: 2400, rate: 1400 },
    { id: 's6', name: 'Wren P.', role: 'Busser', hours: 2400, rate: 1200 },
    { id: 's7', name: 'Cal D.', role: 'Kitchen', hours: 4000, rate: 1900 },
    { id: 's8', name: 'Tam O.', role: 'Kitchen', hours: 3800, rate: 1650 },
    { id: 's9', name: 'Priya N.', role: 'Manager', hours: 4500, rate: 2600 },
  ],
};

export default function ScheduleCostCheck({ mode = 'demo' }) {
  const { state, patch, reset, status, restored, pack } = useRemembered('schedule-cost-check', 1, SAMPLE, mode);
  const [busy, setBusy] = useState(false);
  const r = useMemo(() => computeSchedule(state), [state]);

  const doExport = async () => {
    setBusy(true);
    try {
      await exportRows('schedule-cost.xlsx', 'Schedule',
        r.rows.map((s) => ({
          Name: s.name, Role: s.role,
          Hours: s.hours / 100,
          Rate: Number((s.rate / 100).toFixed(2)),
          Cost: Number((s.cost / 100).toFixed(2)),
        })).concat([
          {},
          { Name: 'Scheduled hours', Hours: r.totalHours / 100 },
          { Name: 'Payroll', Cost: Number((r.totalCost / 100).toFixed(2)) },
        ]),
        [16, 12, 8, 9, 11]);
    } finally { setBusy(false); }
  };

  return (
    <div style={pageFor("schedule-cost-check")} data-demo="schedule-cost-check">
      <ToolHeader toolId="schedule-cost-check" house={HOUSE} occasion="sample week" name="Schedule Cost Check" status={status} restored={restored} pack={pack} remembers="roster">
        What you have scheduled, at your rates, against the sales you expect and the share you
        want. The expected figure is yours and starts blank — this page will never guess next
        week for you, and every answer below moves with whatever you put there. Nothing you
        type leaves this page.
      </ToolHeader>

      <Readout items={[
        { label: 'The week costs', value: cash(r.totalCost),
          note: (r.totalHours / 100).toFixed(1) + ' hours scheduled' },
        { label: 'Share of sales', value: r.laborPercent == null ? null : r.laborPercent.toFixed(1) + '%',
          note: r.expectedSales ? 'on the sales you expect' : 'no expected sales entered',
          tone: r.vsTarget == null ? undefined : (r.vsTarget <= 0 ? 'good' : 'warn') },
        { label: 'Your budget', value: r.budget == null ? null : cash(r.budget),
          note: r.targetPercent == null ? 'set a target to see it' : 'at ' + r.targetPercent + '% of sales' },
        { label: r.overBy != null && r.overBy > 0 ? 'Over by' : 'Under by',
          value: r.overBy == null ? null : cash(Math.abs(r.overBy)),
          tone: r.overBy == null ? undefined : (r.overBy > 0 ? 'warn' : 'good') },
      ]} />

      <div style={wrap}>
        <Problems heading="Read this before you post the schedule" items={r.problems} />

        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'minmax(0, 1.7fr) minmax(300px, 1fr)', alignItems: 'start' }}>
          <div>
            <Panel
              title="The schedule"
              note="Hours as written, at the wage you actually pay. Hours can be half-hours — 7.5 is seven and a half."
              right={<Btn small onClick={() => patch((s) => { s.shifts.push({ id: uid('s'), name: 'New name', role: 'Server', hours: 0, rate: 0 }); })}>Add a shift</Btn>}
            >
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
                  <thead>
                    <tr><th style={th}>Name</th><th style={th}>Role</th><th style={thN}>Hours</th><th style={thN}>Rate</th><th style={thN}>Costs</th><th style={th} /></tr>
                  </thead>
                  <tbody>
                    {r.rows.map((s, i) => (
                      <tr key={s.id}>
                        <td style={td}><Cell label={`name for ${s.name}`} mono={false} w={122} value={s.name} onChange={(v) => patch((n) => { n.shifts[i].name = v; })} /></td>
                        <td style={td}><Cell label={`role for ${s.name}`} mono={false} w={98} value={s.role} onChange={(v) => patch((n) => { n.shifts[i].role = v; })} /></td>
                        <td style={tdN}><Cell label={`hours for ${s.name}`} w={58} value={plain(s.hours)} onChange={(v) => patch((n) => { n.shifts[i].hours = toHundredths(v); })} /></td>
                        <td style={tdN}><Cell label={`hourly rate for ${s.name}`} w={62} value={(s.rate / 100).toFixed(2)} onChange={(v) => patch((n) => { n.shifts[i].rate = toCents(v); })} /></td>
                        <td style={{ ...tdN, fontWeight: 700, color: A.brass }}>{cash(s.cost)}</td>
                        <td style={{ ...td, textAlign: 'right' }}><Btn small onClick={() => patch((n) => { n.shifts.splice(i, 1); })}>×</Btn></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>

            <Panel title="By role" note="Where the payroll actually sits. One blended figure hides whichever role moved.">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr><th style={th}>Role</th><th style={thN}>People</th><th style={thN}>Hours</th><th style={thN}>Costs</th><th style={thN}>Share of payroll</th></tr></thead>
                <tbody>
                  {r.byRole.map((g) => (
                    <tr key={g.role}>
                      <td style={td}>{g.role}</td>
                      <td style={tdN}>{g.people}</td>
                      <td style={tdN}>{plain(g.hours)}</td>
                      <td style={tdN}>{cash(g.cost)}</td>
                      <td style={{ ...tdN, color: A.brass }}>{r.totalCost > 0 ? ((g.cost / r.totalCost) * 100).toFixed(1) + '%' : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
          </div>

          <div>
            <Panel title="Your two numbers" note="Both are yours. Neither is filled in from anywhere else, and the answer below is only as good as they are.">
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <Field label="Sales you expect" prefix="$" w={124}
                  hint="your estimate, not a forecast"
                  value={state.expectedSales == null ? '' : (state.expectedSales / 100).toFixed(2)}
                  onChange={(v) => patch((s) => { s.expectedSales = v.trim() === '' ? null : toCents(v); })} />
                <Field label="Target share" suffix="%" w={62}
                  hint="blank on purpose"
                  value={state.targetPercent == null ? '' : String(state.targetPercent)}
                  onChange={(v) => patch((s) => { s.targetPercent = toOptionalNumber(v); })} />
              </div>
              <p style={{ margin: '10px 0 0', fontSize: 11.5, color: T.textMuted, lineHeight: 1.5 }}>
                Whatever share of sales a restaurant down the road runs on payroll is not your
                target, and this page will never fill it in for you.
              </p>
            </Panel>

            <Panel title="What the week costs" right={
              <span style={{ display: 'flex', gap: 8 }}>
                <Btn small onClick={reset}>Reset</Btn>
                <Btn small primary onClick={doExport}>{busy ? 'Building…' : 'Export'}</Btn>
              </span>
            }>
              <p style={{ margin: 0, fontSize: 34, fontWeight: 700, fontFamily: FONT_DATA, color: A.brass, lineHeight: 1.1 }}>
                {cash(r.totalCost)}
              </p>
              <p style={{ margin: '6px 0 0', fontSize: 12.5, color: T.textSec, lineHeight: 1.6 }}>
                {plain(r.totalHours)} hours scheduled across {r.rows.length} shifts.
              </p>

              <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
                <p style={{ margin: 0, fontSize: 30, fontWeight: 700, fontFamily: FONT_DATA, color: r.laborPercent == null ? T.textMuted : A.brass, lineHeight: 1.1 }}>
                  {r.laborPercent == null ? '—' : r.laborPercent.toFixed(1) + '%'}
                </p>
                <p style={{ margin: '6px 0 0', fontSize: 12.5, color: T.textSec, lineHeight: 1.6 }}>
                  {r.laborPercent == null
                    ? 'Enter the sales you expect and this works itself out.'
                    : <>{cash(r.totalCost)} of payroll ÷ the {cash(r.expectedSales)} you expect.</>}
                </p>
              </div>

              {r.vsTarget != null && (
                <div style={{
                  marginTop: 12, padding: '10px 12px', borderRadius: S.radius,
                  background: r.vsTarget > 0 ? A.badTint : A.goodTint,
                  border: `1px solid ${r.vsTarget > 0 ? A.bad : A.good}`, fontSize: 12.5, lineHeight: 1.6,
                }}>
                  {r.vsTarget > 0 ? (
                    <>
                      <strong style={{ color: A.bad }}>{r.vsTarget.toFixed(1)} points over</strong> the
                      {' '}{r.targetPercent}% you set. At that target the week affords{' '}
                      {cash(r.budget)}, so the schedule is {cash(r.overBy)} above it.
                    </>
                  ) : (
                    <>
                      <strong style={{ color: A.good }}>{Math.abs(r.vsTarget).toFixed(1)} points under</strong> the
                      {' '}{r.targetPercent}% you set. At that target the week affords{' '}
                      {cash(r.budget)}, leaving {cash(Math.abs(r.overBy))} of room.
                    </>
                  )}
                </div>
              )}
            </Panel>

            <WontDo items={[
              'It will not guess next week’s sales. That figure is yours, it starts blank, and every answer here moves with it.',
              'It carries no target of its own. What share of sales your payroll should be is a decision about your business.',
              'It does not work out anybody’s take-home. Tips, taxes, overtime and tip credit are all specific to you, and it will not print a figure it cannot show the working for.',
            ]} />
          </div>
        </div>
      </div>
    </div>
  );
}
