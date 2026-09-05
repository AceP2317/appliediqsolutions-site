// ============================================================================
// CREW SHARE — the F/V Wrackline, Marker Nine (portfolio demo)
//
// A boat comes in, the catch sells, and the money splits. Trip costs off the top,
// then the boat's share of what is left, then the rest across the people who
// worked it by their lay. Every boat sets its own lay and its own boat share,
// and neither travels — which is why this has never been worth a platform's
// engineering budget and is still done on a legal pad at the dock.
//
// SAME ARITHMETIC AS THE TIP-OUT SHEET, wearing different clothes. Both split a
// pot across weights and both have to make the pennies add back up, so both use
// splitCents() from src/lib/tip-out.js rather than solving it twice.
//
// THE HONESTY CONTRACT. Every figure is the boat's own number through arithmetic
// printed beside it. No standard lay, no typical boat share, nothing compared
// against what other boats do.
//
// Built by Ian Provencher · AppliedIQ Solutions
// Public demo — the boat, the crew and the trip are invented.
// ============================================================================

import React, { useMemo, useState } from 'react';
import { computeCrewShare } from '../../lib/crew-share.js';
import { T, A, S, FONT_DATA, Panel, Btn, Cell, Field, ToolHeader, Problems, WontDo, useRemembered, toCents, toNumber, cash, uid, page, wrap, th, td, tdN, exportRows, pageFor, Readout } from '../kit/shelf.jsx';

const BOAT = 'F/V Wrackline';

// ============================================================================
// THE SAMPLE — one trip on a made-up boat out of a made-up town.
// ============================================================================
const SAMPLE = {
  trip: 'four-day trip',
  gross: 4180000,
  boatPercent: 40,
  expenses: [
    { id: 'e1', label: 'Fuel', amount: 612000 },
    { id: 'e2', label: 'Ice', amount: 84000 },
    { id: 'e3', label: 'Bait', amount: 196000 },
    { id: 'e4', label: 'Grub', amount: 43000 },
    { id: 'e5', label: 'Offload', amount: 125000 },
  ],
  crew: [
    { id: 'c1', name: 'Ned H.', role: 'Captain', lay: 1.5 },
    { id: 'c2', name: 'Sal V.', role: 'Mate', lay: 1.25 },
    { id: 'c3', name: 'Bo K.', role: 'Deckhand', lay: 1 },
    { id: 'c4', name: 'Rennie T.', role: 'Deckhand', lay: 1 },
    { id: 'c5', name: 'Gus P.', role: 'Greenhorn', lay: 0.75 },
  ],
};

export default function CrewShare({ mode = 'demo' }) {
  const { state, patch, reset, status, restored, pack } = useRemembered('crew-share', 1, SAMPLE, mode);
  const [busy, setBusy] = useState(false);
  const r = useMemo(() => computeCrewShare(state), [state]);

  const doExport = async () => {
    setBusy(true);
    try {
      await exportRows('crew-share.xlsx', 'Settlement',
        r.payouts.map((p) => ({
          Name: p.name, Role: p.role, Lay: p.lay,
          Share: Number((p.amount / 100).toFixed(2)),
        })).concat([
          {},
          { Name: 'Catch sold', Share: Number((state.gross / 100).toFixed(2)) },
          { Name: 'Trip costs', Share: Number((r.expenseTotal / 100).toFixed(2)) },
          { Name: 'Boat share', Share: Number((r.boatShare / 100).toFixed(2)) },
          { Name: 'To the crew', Share: Number((r.crewPot / 100).toFixed(2)) },
        ]),
        [16, 12, 8, 12]);
    } finally { setBusy(false); }
  };

  return (
    <div style={pageFor("crew-share")} data-demo="crew-share">
      <ToolHeader toolId="crew-share" house={BOAT} occasion="sample trip" name="Crew Share" status={status} restored={restored} pack={pack} remembers="crew list">
        Trip costs off the top, then the boat, then the rest by lay. Your lay, your boat share,
        your trip. Nothing here is a standard split and nothing is compared against what other
        boats do. Nothing you type leaves this page.
      </ToolHeader>

      <Readout items={[
        { label: 'After costs', value: cash(r.afterExpenses),
          note: cash(r.expenseTotal) + ' off the top' },
        { label: 'The boat', value: cash(r.boatShare), note: r.boatPercent + '% of what was left' },
        { label: 'The crew', value: cash(r.crewPot),
          note: r.payouts.length + ' aboard, ' + (r.layTotal || 0) + ' shares' },
        { label: 'Settles', value: r.balances ? 'to the penny' : 'not yet',
          tone: r.balances ? 'good' : 'bad',
          note: r.balances ? 'every dollar landed somewhere' : cash(Math.abs(r.unaccounted)) + ' unaccounted' },
      ]} />

      <div style={wrap}>
        <Problems heading="Do not settle up yet" items={r.problems} />

        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', alignItems: 'start' }}>
          <div>
            <Panel title="The trip" note="What the catch sold for, and what the boat takes of whatever is left after the trip's own costs.">
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <Field label="Catch sold for" prefix="$" w={130}
                  value={(state.gross / 100).toFixed(2)}
                  onChange={(v) => patch((s) => { s.gross = toCents(v); })} />
                <Field label="Boat share" suffix="%" w={70}
                  hint="of what is left, not of the gross"
                  value={String(state.boatPercent)}
                  onChange={(v) => patch((s) => { s.boatPercent = toNumber(v); })} />
              </div>
            </Panel>

            <Panel
              title="Off the top"
              note="The trip's own costs, in real money rather than percentages — fuel, ice, bait, grub, offload, whatever this boat counts."
              right={<Btn small onClick={() => patch((s) => { s.expenses.push({ id: uid('e'), label: 'New cost', amount: 0 }); })}>Add a cost</Btn>}
            >
              {state.expenses.length === 0 && (
                <p style={{ margin: 0, fontSize: 13, color: T.textMuted }}>No trip costs. Everything sold goes into the split.</p>
              )}
              {state.expenses.map((e, i) => (
                <div key={e.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 9, flexWrap: 'wrap' }}>
                  <Field label="What it was" w={140} value={e.label}
                    onChange={(v) => patch((n) => { n.expenses[i].label = v; })} />
                  <Field label="Cost" prefix="$" w={104} value={(e.amount / 100).toFixed(2)}
                    onChange={(v) => patch((n) => { n.expenses[i].amount = toCents(v); })} />
                  <Btn small onClick={() => patch((n) => { n.expenses.splice(i, 1); })}>Remove</Btn>
                </div>
              ))}
            </Panel>

            <Panel
              title="Who was aboard"
              note="Lay is the share weight this boat uses. A captain on a share and a half against a deckhand on one is 1.5 to 1."
              right={<Btn small onClick={() => patch((s) => { s.crew.push({ id: uid('c'), name: 'New name', role: 'Deckhand', lay: 1 }); })}>Add a hand</Btn>}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr><th style={th}>Name</th><th style={th}>Berth</th><th style={{ ...th, textAlign: 'right' }}>Lay</th><th style={th} /></tr></thead>
                <tbody>
                  {state.crew.map((p, i) => (
                    <tr key={p.id}>
                      <td style={td}><Cell label={`name for ${p.name}`} mono={false} w={120} value={p.name} onChange={(v) => patch((n) => { n.crew[i].name = v; })} /></td>
                      <td style={td}><Cell label={`role for ${p.name}`} mono={false} w={104} value={p.role} onChange={(v) => patch((n) => { n.crew[i].role = v; })} /></td>
                      <td style={tdN}><Cell label={`lay for ${p.name}`} value={String(p.lay)} onChange={(v) => patch((n) => { n.crew[i].lay = toNumber(v); })} /></td>
                      <td style={{ ...td, textAlign: 'right' }}><Btn small onClick={() => patch((n) => { n.crew.splice(i, 1); })}>×</Btn></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
          </div>

          <div>
            <Panel title="What everyone gets" right={
              <span style={{ display: 'flex', gap: 8 }}>
                <Btn small onClick={reset}>Reset</Btn>
                <Btn small primary onClick={doExport}>{busy ? 'Building…' : 'Export'}</Btn>
              </span>
            }>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr><th style={th}>Name</th><th style={{ ...th, textAlign: 'right' }}>Lay</th><th style={{ ...th, textAlign: 'right' }}>Gets</th></tr></thead>
                <tbody>
                  {r.payouts.map((p) => (
                    <tr key={p.id}>
                      <td style={td}>{p.name}<span style={{ display: 'block', fontSize: 11, color: T.textMuted }}>{p.role}</span></td>
                      <td style={tdN}>{p.lay}</td>
                      <td style={{ ...tdN, fontWeight: 700, color: A.brass, fontSize: 14.5 }}>{cash(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {r.pennies.length > 0 && (
                <p style={{ margin: '10px 0 0', fontSize: 12, color: T.textMuted, lineHeight: 1.55 }}>
                  The crew share did not divide evenly, so {r.pennies.length} spare
                  {r.pennies.length === 1 ? ' penny went' : ' pennies went'} to the biggest
                  {r.pennies.length === 1 ? ' lay' : ' lays'}. That is the only way the shares add
                  back up to the money that came in.
                </p>
              )}
            </Panel>

            <Panel title="How it got there" note="Every line is one of your numbers and the arithmetic that moved it.">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr><td style={td}>Catch sold</td><td style={tdN}>{cash(state.gross)}</td></tr>
                  {r.expenseRows.map((e) => (
                    <tr key={e.id}><td style={td}>− {e.label}</td><td style={tdN}>−{cash(e.amount)}</td></tr>
                  ))}
                  <tr><td style={{ ...td, fontWeight: 700 }}>After the trip's costs</td><td style={{ ...tdN, fontWeight: 700 }}>{cash(r.afterExpenses)}</td></tr>
                  <tr>
                    <td style={td}>− The boat<span style={{ display: 'block', fontSize: 11, color: T.textMuted }}>{r.boatPercent}% of {cash(r.afterExpenses)}</span></td>
                    <td style={tdN}>−{cash(r.boatShare)}</td>
                  </tr>
                  <tr>
                    <td style={{ ...td, fontWeight: 700 }}>
                      To the crew
                      <span style={{ display: 'block', fontSize: 11, color: T.textMuted, fontWeight: 400 }}>
                        {r.payouts.length} aboard, {r.layTotal} lay between them
                      </span>
                    </td>
                    <td style={{ ...tdN, fontWeight: 700, color: r.crewPot < 0 ? A.bad : A.brass, fontSize: 15 }}>{cash(r.crewPot)}</td>
                  </tr>
                </tbody>
              </table>
              <div style={{
                marginTop: 12, padding: '10px 12px', borderRadius: S.radius,
                background: r.balances ? A.goodTint : A.badTint,
                border: `1px solid ${r.balances ? A.good : A.bad}`, fontSize: 12.5, lineHeight: 1.55,
              }}>
                {r.balances ? (
                  <>
                    <strong style={{ color: A.good }}>The trip balances.</strong>{' '}
                    {cash(r.expenseTotal)} in costs, {cash(r.boatShare)} to the boat and{' '}
                    {cash(r.paidOut)} to the crew is exactly the {cash(state.gross)} the catch made.
                    Checked to the penny every time you change a number.
                  </>
                ) : (
                  <>
                    <strong style={{ color: A.bad }}>The trip does not balance.</strong>{' '}
                    {cash(Math.abs(r.unaccounted))} is unaccounted for. Do not settle this.
                  </>
                )}
              </div>
            </Panel>

            <WontDo items={[
              'It will not tell you what a lay should be, or what the boat should take. Those are the boat’s, argued out once and kept.',
              'It does not know what other boats do, and it will never compare you to them.',
              'It is not a settlement statement and it is not tax advice. It applies the split you enter.',
            ]} />
          </div>
        </div>
      </div>
    </div>
  );
}
