// ============================================================================
// PROPERTY ROUND — Ninth Street Grounds (portfolio demo)
//
// A lawn crew or a cleaner quotes a property once, standing in the driveway,
// and then goes back to it every week for years. The price never moves. What
// moves is how long the property actually takes and how far it is from the last
// stop — and neither of those appears anywhere on an invoice.
//
// SO THE QUESTION IS NOT WHAT WAS BILLED. It is which customers are worth the
// truck being there, and answering it needs the drive counted: a twenty-minute
// drive to a thirty-minute job is a fifty-minute job whatever the invoice says.
// That is the whole tool, and it is why a round can bill well and still lose.
//
// THE DUE ARITHMETIC IS BORROWED. daysBetween comes out of src/lib/recall.js —
// the same "how far past the interval" question the Recall Sheet asks about a
// patient, asked here about a lawn. Two trades, one piece of date arithmetic.
//
// THE HONESTY CONTRACT. The price, the interval, the crew's cost and how long a
// property really takes are all his, measured or decided by him. This divides.
// It suggests no price, no interval and no target rate per hour, and it will
// not tell him to drop a customer — that is a decision about a relationship and
// there is more in it than a number.
//
// Built by Ian Provencher · AppliedIQ Solutions
// Public demo — the crew, the properties and the round are invented.
// ============================================================================

import React, { useMemo, useState } from 'react';
import { computeRound } from '../../lib/property-round.js';
import { T, A, S, FONT_DATA, Panel, Btn, Cell, Field, ToolHeader, Problems, WontDo, useRemembered, toCents, toNumber, cash, uid, wrap, th, thN, td, tdN, exportRows, pageFor, Readout } from '../kit/shelf.jsx';

const CREW = 'Ninth Street Grounds';

// ============================================================================
// THE SAMPLE ROUND — the same figures scripts/verify-tools.mjs works out by
// hand, so the gate and the page check one arithmetic rather than two that
// happen to agree.
//
// IT COMES OUT UNDERWATER ON PURPOSE. A sample that billed comfortably ahead
// would never show what this is for, which is finding the far customer
// everybody keeps out of loyalty. Three of these five pay; two sink the round.
// ============================================================================
const SAMPLE = {
  today: '2026-08-26',
  crewCostPerHour: 6800,
  properties: [
    { id: 'p1', name: 'Harkers Row', priceCents: 5500, minutesOnSite: 35, minutesDrive: 12, intervalDays: 7, lastVisit: '2026-08-18' },
    { id: 'p2', name: 'Pollock Street', priceCents: 4000, minutesOnSite: 25, minutesDrive: 8, intervalDays: 7, lastVisit: '2026-08-20' },
    { id: 'p3', name: 'Union Point', priceCents: 12500, minutesOnSite: 95, minutesDrive: 15, intervalDays: 14, lastVisit: '2026-08-10' },
    { id: 'p4', name: 'Trent Woods', priceCents: 6500, minutesOnSite: 40, minutesDrive: 28, intervalDays: 14, lastVisit: '2026-08-14' },
    { id: 'p5', name: 'Ghent Alley', priceCents: 3000, minutesOnSite: 20, minutesDrive: 22, intervalDays: 7, lastVisit: '2026-08-21' },
  ],
};

const hrs = (mins) => `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, '0')}m`;

export default function PropertyRound({ mode = 'demo' }) {
  const { state, patch, reset, status, restored, pack } = useRemembered('property-round', 1, SAMPLE, mode);
  const [busy, setBusy] = useState(false);
  const r = useMemo(
    () => computeRound({ today: state.today, crewCostPerHour: state.crewCostPerHour, properties: state.properties }),
    [state],
  );

  const doExport = async () => {
    setBusy(true);
    try {
      await exportRows('property-round.xlsx', 'Round',
        r.rows.map((p) => ({
          Property: p.name,
          Price: Number((p.price / 100).toFixed(2)),
          On_site_min: p.onSite,
          Drive_min: p.drive,
          Crew_min: p.minutes,
          Crew_cost: Number((p.cost / 100).toFixed(2)),
          Margin: Number((p.margin / 100).toFixed(2)),
          Per_crew_hour: p.perHour == null ? 'no time on it' : Number((p.perHour / 100).toFixed(2)),
          Every_days: p.intervalDays,
          Days_over: p.daysOver == null ? '' : p.daysOver,
        })).concat([{}, {
          Property: 'The round',
          Price: Number((r.totals.price / 100).toFixed(2)),
          Crew_min: r.totals.minutes,
          Crew_cost: Number((r.totals.cost / 100).toFixed(2)),
          Margin: Number((r.totals.margin / 100).toFixed(2)),
          Per_crew_hour: r.totals.perHour == null ? '' : Number((r.totals.perHour / 100).toFixed(2)),
        }]),
        [18, 10, 12, 10, 10, 11, 10, 14, 11, 10]);
    } finally { setBusy(false); }
  };

  return (
    <div style={pageFor('property-round')} data-demo="property-round">
      <ToolHeader toolId="property-round" house={CREW} occasion="sample round" name="Property Round" status={status} restored={restored} pack={pack} remembers="properties and crew cost">
        What each property pays per hour of crew time, with the drive counted — because a twenty-minute
        drive to a thirty-minute job is a fifty-minute job whatever the invoice says. Nothing here
        suggests a price, an interval or a rate you should be hitting. Nothing you type leaves this page.
      </ToolHeader>

      <Readout items={[
        { label: 'The round bills', value: cash(r.totals.price),
          note: r.rows.length + ' ' + (r.rows.length === 1 ? 'property' : 'properties') },
        { label: 'The crew time costs', value: cash(r.totals.cost),
          note: hrs(r.totals.minutes) + ', of which ' + hrs(r.totals.drive) + ' is driving' },
        /* THREE, NOT FOUR. This faceplate's readout is the comparison shape —
           two figures set against each other and the difference in a tinted
           third — and anything past the third drops into a small footnote
           line. A fourth tile went in as "Due today" and rendered as a stray
           fragment under the row with its value stripped off. The due count
           now lives in the round panel, where it has room to say what the
           work is worth. Caught by looking at the rendered page. */
        { label: 'Per crew hour', value: r.totals.perHour == null ? '—' : cash(r.totals.perHour),
          tone: r.totals.perHour != null && r.totals.perHour < state.crewCostPerHour ? 'bad' : undefined,
          note: 'against a crew costing ' + cash(state.crewCostPerHour) },
      ]} />

      <div style={wrap}>
        <Problems heading="Look at these before you plan the week" items={r.problems} />

        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'minmax(0, 2fr) minmax(280px, 1fr)', alignItems: 'start' }}>
          <div>
            <Panel
              title="The book"
              note="On-site and drive are minutes. The drive is the leg to get there — the part of the day nobody invoices for and everybody spends."
              right={<Btn small onClick={() => patch((s) => { s.properties.push({ id: uid('p'), name: 'New property', priceCents: 0, minutesOnSite: 30, minutesDrive: 10, intervalDays: 7, lastVisit: s.today }); })}>Add a property</Btn>}
            >
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 660 }}>
                  <thead>
                    <tr>
                      <th style={th}>Property</th><th style={thN}>Price</th><th style={thN}>On site</th>
                      <th style={thN}>Drive</th><th style={thN}>Crew cost</th><th style={thN}>Per hour</th>
                      <th style={thN}>Every</th><th style={thN}>Due</th><th style={th} />
                    </tr>
                  </thead>
                  <tbody>
                    {r.rows.map((p, i) => (
                      <tr key={p.id} style={{ background: p.losing ? A.badTint : 'transparent' }}>
                        <td style={td}>
                          <Cell label={`name of ${p.name}`} mono={false} w={124} value={p.name} onChange={(v) => patch((n) => { n.properties[i].name = v; })} />
                          <span style={{ display: 'block', fontSize: 10, color: T.textMuted, marginTop: 2 }}>last done {p.lastVisit || 'never'}</span>
                        </td>
                        <td style={tdN}><Cell label={`price for ${p.name}`} w={62} value={(p.price / 100).toFixed(2)} onChange={(v) => patch((n) => { n.properties[i].priceCents = toCents(v); })} /></td>
                        <td style={tdN}><Cell label={`minutes on site at ${p.name}`} w={48} value={String(p.onSite)} onChange={(v) => patch((n) => { n.properties[i].minutesOnSite = Math.round(toNumber(v)); })} /></td>
                        <td style={tdN}><Cell label={`minutes driving to ${p.name}`} w={48} value={String(p.drive)} onChange={(v) => patch((n) => { n.properties[i].minutesDrive = Math.round(toNumber(v)); })} /></td>
                        <td style={{ ...tdN, color: T.textMuted }}>
                          {cash(p.cost)}
                          <span style={{ display: 'block', fontSize: 10 }}>{p.minutes} min</span>
                        </td>
                        {/* THE ANSWER COLUMN. What this property pays for an hour of
                            the crew's day, drive included, against what an hour of the
                            crew costs. No target is printed beside it — that number is
                            his, and a page that invented one would be inventing the
                            only thing this tool exists to leave alone. */}
                        <td style={{ ...tdN, fontWeight: 700, color: p.losing ? A.bad : A.brass }}>
                          {p.perHour == null ? 'no time on it' : cash(p.perHour)}
                          {p.losing && <span style={{ display: 'block', fontSize: 10, color: A.bad, fontWeight: 400 }}>{cash(Math.abs(p.margin))} short</span>}
                        </td>
                        <td style={tdN}><Cell label={`interval in days for ${p.name}`} w={44} value={String(p.intervalDays)} onChange={(v) => patch((n) => { n.properties[i].intervalDays = Math.round(toNumber(v)); })} /></td>
                        <td style={{ ...tdN, color: p.due ? A.brass : T.textMuted, fontWeight: p.due ? 700 : 400 }}>
                          {p.daysOver == null ? '—' : p.due ? `${p.daysOver}d over` : `in ${-p.daysOver}d`}
                        </td>
                        <td style={{ ...td, textAlign: 'right' }}><Btn small onClick={() => patch((n) => { n.properties.splice(i, 1); })}>×</Btn></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>

          <div>
            <Panel title="The crew" note="One loaded hourly cost for the whole crew — wages, the truck, the fuel, whatever you put in it.">
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <Field label="Crew, per hour" prefix="$" w={92} value={(state.crewCostPerHour / 100).toFixed(2)} onChange={(v) => patch((n) => { n.crewCostPerHour = toCents(v); })} />
                <Field label="Today" w={104} value={state.today} onChange={(v) => patch((n) => { n.today = v; })} />
              </div>
            </Panel>

            <Panel title="This round" right={
              <span style={{ display: 'flex', gap: 8 }}>
                <Btn small onClick={reset}>Reset</Btn>
                <Btn small primary onClick={doExport}>{busy ? 'Building…' : 'Export'}</Btn>
              </span>
            }>
              <p style={{ margin: 0, fontSize: 32, fontWeight: 700, fontFamily: FONT_DATA, lineHeight: 1.1, color: r.totals.margin < 0 ? A.bad : A.brass }}>
                {r.totals.margin < 0 ? `−${cash(Math.abs(r.totals.margin))}` : cash(r.totals.margin)}
              </p>
              <p style={{ margin: '6px 0 0', fontSize: 12.5, color: T.textSec, lineHeight: 1.6 }}>
                {r.totals.margin < 0
                  ? <>left over after the crew time — this round costs more than it bills.</>
                  : <>left over after the crew time.</>} It bills {cash(r.totals.price)} for {hrs(r.totals.minutes)} of
                crew, {hrs(r.totals.drive)} of it driving.
              </p>
              <p style={{ margin: '10px 0 0', fontSize: 12.5, color: T.textSec, lineHeight: 1.6 }}>
                {r.due.length === 0
                  ? <>Nothing is past its interval today.</>
                  : <><strong style={{ color: A.brass }}>{r.due.length}</strong> past {r.due.length === 1 ? 'its' : 'their'} interval
                    today, worth {cash(r.totals.duePrice)} and {hrs(r.totals.dueMinutes)} of crew time.</>}
              </p>
              {r.rows.some((x) => x.losing) && (
                <p style={{ margin: '10px 0 0', fontSize: 12, color: A.bad, lineHeight: 1.55 }}>
                  {r.rows.filter((x) => x.losing).length} of these do not cover the crew time they take.
                  What you do about that is yours — this only shows you which.
                </p>
              )}
            </Panel>

            <WontDo items={[
              'It will not tell you what to charge, how often to go, or what an hour of your crew should earn. Those three are the whole of your pricing.',
              'It does not know what any other crew in the county charges, and it will never compare you to them.',
              'It will not tell you to drop a customer. A property that loses money can still be the reason you got the street, and a page cannot see that.',
              'It will not guess how long a property takes. If the minutes are wrong the rate is wrong, and there is nothing here that can tell.',
            ]} />
          </div>
        </div>
      </div>
    </div>
  );
}
