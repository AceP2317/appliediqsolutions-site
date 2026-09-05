// ============================================================================
// EVENT DAY — Slipway Smoke (portfolio demo)
//
// Somebody rings up in July and offers a pitch at a festival for $450. The
// question is never whether $450 is a lot. It is how many plates have to go out
// of the window before the day has paid for itself — and that is almost never
// worked out, because working it out means knowing what a plate actually
// contributes after what went into it.
//
// THE ONLY TOOL ON THIS SHELF THAT DRAWS ITS ANSWER, and the drawing is hand
// cut rather than pulled from a charting library. Two reasons, and neither is
// taste. The line is straight because the arithmetic is linear, and a chart
// library would invite a curve, a smoothing or an axis nobody asked for — the
// honesty contract is easier to keep with a path element than with a component
// that has opinions. And every tool here also ships as a single keep-forever
// file that works offline, so a charting bundle would be carried by a picture
// that is one line and one rule.
//
// THE MIX IS AN ASSUMPTION AND IT IS SAID SO ON THE PAGE. With more than one
// thing on the menu, "a unit" means one unit at the mix being expected. Sell a
// different mix and the number moves.
//
// THE HONESTY CONTRACT. Every price, every cost, every expected quantity is the
// vendor's own. Nothing here forecasts a crowd, suggests a price, or knows what
// a festival is worth. Whether the day is worth doing has weather and a queue
// and a Saturday in it, and none of those are in this file.
//
// Built by Ian Provencher · AppliedIQ Solutions
// Public demo — the truck, the menu and the festival are invented.
// ============================================================================

import React, { useMemo, useState } from 'react';
import { computeEventDay } from '../../lib/event-day.js';
import { T, A, S, FONT_DATA, FONT_HEAD, Panel, Btn, Cell, Field, ToolHeader, Problems, WontDo, useRemembered, toCents, toNumber, cash, uid, wrap, th, thN, td, tdN, exportRows, pageFor, Readout } from '../kit/shelf.jsx';

const TRUCK = 'Slipway Smoke';

// ============================================================================
// THE SAMPLE DAY — the same figures scripts/verify-tools.mjs works out by hand.
// $450 pitch plus $315 of fuel, propane, ice and an extra pair of hands.
// ============================================================================
const SAMPLE = {
  feeCents: 45000,
  otherFixedCents: 31500,
  items: [
    { id: 'e1', name: 'Pulled pork plate', priceCents: 1400, unitCostCents: 480, expectedSold: 120, prepped: 140 },
    { id: 'e2', name: 'Brisket sandwich', priceCents: 1200, unitCostCents: 520, expectedSold: 90, prepped: 100 },
    { id: 'e3', name: 'Sides', priceCents: 400, unitCostCents: 95, expectedSold: 160, prepped: 180 },
    { id: 'e4', name: 'Sweet tea', priceCents: 300, unitCostCents: 42, expectedSold: 200, prepped: 220 },
  ],
};

/* ────────────────────────────────────────────────────────────────────────────
   THE PICTURE. Units sold along the bottom, money up the side, one straight
   line from minus-the-fixed-cost rising at what a unit contributes, and a rule
   where it crosses nothing.

   IT IS A STRAIGHT LINE BECAUSE THE ARITHMETIC IS. Nothing here is fitted,
   smoothed or projected: every point on it is the fixed cost subtracted from a
   number of units times the contribution the vendor typed in. Drawing it by
   hand is what keeps that true — the moment this is a chart component, the
   first thing somebody reaches for is a curve.
   ──────────────────────────────────────────────────────────────────────────── */
function BreakEvenLine({ fixed, perUnit, breakEven, expected }) {
  const W = 520, H = 190, PAD_L = 8, PAD_R = 8, PAD_T = 12, PAD_B = 26;
  if (perUnit == null || perUnit <= 0 || breakEven == null) {
    return (
      <p style={{ margin: 0, fontSize: 12.5, color: T.textMuted, lineHeight: 1.6 }}>
        There is nothing to draw: at the mix you are expecting, a unit contributes nothing, so the
        line never climbs and never crosses.
      </p>
    );
  }

  /* The x axis runs a little past whichever is further out — the break-even or
     the day being expected — so neither ever sits on the edge. */
  const maxUnits = Math.max(breakEven, expected, 1) * 1.15;
  const topMoney = Math.max(perUnit * maxUnits - fixed, 1);
  const x = (u) => PAD_L + (u / maxUnits) * (W - PAD_L - PAD_R);
  /* Zero sits proportionally, so the loss below the rule is drawn to the same
     scale as the profit above it rather than being squashed to fit. */
  const y = (m) => PAD_T + ((topMoney - m) / (topMoney + fixed)) * (H - PAD_T - PAD_B);

  const y0 = y(0);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img"
      aria-label={`The day crosses from a loss into a profit at ${breakEven} units sold, and you expect ${expected}.`}>
      {/* Below the rule is the part of the day that has not paid for the pitch. */}
      <rect x={PAD_L} y={y0} width={W - PAD_L - PAD_R} height={Math.max(0, H - PAD_B - y0)} fill={A.badTint} />
      <line x1={PAD_L} y1={y0} x2={W - PAD_R} y2={y0} stroke={T.borderStrong} strokeWidth="1" />
      <line x1={x(breakEven)} y1={PAD_T} x2={x(breakEven)} y2={H - PAD_B} stroke={A.brass} strokeWidth="1" strokeDasharray="3 3" />
      <line x1={PAD_L} y1={y(-fixed)} x2={x(maxUnits)} y2={y(perUnit * maxUnits - fixed)} stroke={A.brass} strokeWidth="2.5" />
      <circle cx={x(breakEven)} cy={y0} r="4" fill={A.brass} />
      {expected > 0 && expected <= maxUnits && (
        <>
          <circle cx={x(expected)} cy={y(perUnit * expected - fixed)} r="4" fill={T.text} />
          <text x={x(expected)} y={y(perUnit * expected - fixed) - 9} textAnchor="middle"
            fontFamily={FONT_HEAD} fontSize="10.5" fill={T.text}>the day you expect</text>
        </>
      )}
      <text x={x(breakEven)} y={H - 9} textAnchor="middle" fontFamily={FONT_HEAD} fontSize="10.5" fill={A.brass}>
        {breakEven} sold
      </text>
      <text x={PAD_L + 2} y={H - 9} fontFamily={FONT_HEAD} fontSize="10.5" fill={T.textMuted}>0</text>
    </svg>
  );
}

export default function EventDay({ mode = 'demo' }) {
  const { state, patch, reset, status, restored, pack } = useRemembered('event-day', 1, SAMPLE, mode);
  const [busy, setBusy] = useState(false);
  const r = useMemo(
    () => computeEventDay({ feeCents: state.feeCents, otherFixedCents: state.otherFixedCents, items: state.items }),
    [state],
  );

  const doExport = async () => {
    setBusy(true);
    try {
      await exportRows('event-day.xlsx', 'Day',
        r.rows.map((it) => ({
          Item: it.name,
          Price: Number((it.price / 100).toFixed(2)),
          Unit_cost: Number((it.cost / 100).toFixed(2)),
          Contributes: Number((it.contribution / 100).toFixed(2)),
          Expect_to_sell: it.expected,
          Prepped: it.prepped,
          Contribution: Number((it.contributed / 100).toFixed(2)),
          Waste_cost: Number((it.wasteCost / 100).toFixed(2)),
        })).concat([{}, {
          Item: 'Fixed cost of the day',
          Contribution: Number((-r.totals.fixed / 100).toFixed(2)),
        }, {
          Item: 'Break-even, at this mix',
          Expect_to_sell: r.totals.breakEvenUnits == null ? 'never' : r.totals.breakEvenUnits,
        }, {
          Item: 'The day clears',
          Contribution: Number((r.totals.profit / 100).toFixed(2)),
        }]),
        [22, 10, 11, 12, 15, 10, 13, 11]);
    } finally { setBusy(false); }
  };

  return (
    <div style={pageFor('event-day')} data-demo="event-day">
      <ToolHeader toolId="event-day" house={TRUCK} occasion="sample festival" name="Event Day" status={status} restored={restored} pack={pack} remembers="menu and fixed costs">
        Somebody offers you a pitch. This says how many have to go out of the window before the day
        has paid for itself, and draws where that sits against the day you are expecting. It forecasts
        no crowd and suggests no price — it divides what you type in. Nothing you type leaves this page.
      </ToolHeader>

      <Readout items={[
        { label: 'Break even at', value: r.totals.breakEvenUnits == null ? 'never' : `${r.totals.breakEvenUnits} sold`,
          tone: r.totals.breakEvenUnits == null ? 'bad' : undefined,
          note: r.totals.breakEvenUnits == null ? 'no number of sales pays for this day' : 'at the mix you are expecting' },
        { label: 'Fixed cost of the day', value: cash(r.totals.fixed),
          note: cash(r.totals.fee) + ' pitch, ' + cash(r.totals.otherFixed) + ' everything else' },
        { label: 'A unit contributes', value: r.totals.perUnit == null ? '—' : cash(r.totals.perUnit),
          note: 'averaged across the mix, not the menu' },
        { label: 'The day clears', value: (r.totals.profit < 0 ? '−' : '') + cash(Math.abs(r.totals.profit)),
          tone: r.totals.profit < 0 ? 'bad' : 'good',
          note: 'after ' + cash(r.totals.wasteCost) + ' of prep that does not sell' },
      ]} />

      <div style={wrap}>
        <Problems heading="Look at these before you say yes" items={r.problems} />

        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'minmax(0, 1.75fr) minmax(300px, 1fr)', alignItems: 'start' }}>
          <div>
            <Panel
              title="The menu"
              note="What it sells for, what that one costs you to make, and how many you expect to move. Prepped is what goes on before the gates open."
              right={<Btn small onClick={() => patch((s) => { s.items.push({ id: uid('e'), name: 'New item', priceCents: 0, unitCostCents: 0, expectedSold: 0, prepped: 0 }); })}>Add an item</Btn>}
            >
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                  <thead>
                    <tr>
                      <th style={th}>Item</th><th style={thN}>Price</th><th style={thN}>Costs</th>
                      <th style={thN}>Contributes</th><th style={thN}>Expect</th><th style={thN}>Prepped</th>
                      <th style={thN}>Waste</th><th style={th} />
                    </tr>
                  </thead>
                  <tbody>
                    {r.rows.map((it, i) => (
                      <tr key={it.id} style={{ background: it.belowCost ? A.badTint : (it.willRunOut ? A.warnTint : 'transparent') }}>
                        <td style={td}><Cell label={`name of ${it.name}`} mono={false} w={140} value={it.name} onChange={(v) => patch((n) => { n.items[i].name = v; })} /></td>
                        <td style={tdN}><Cell label={`price of ${it.name}`} w={58} value={(it.price / 100).toFixed(2)} onChange={(v) => patch((n) => { n.items[i].priceCents = toCents(v); })} /></td>
                        <td style={tdN}><Cell label={`what one ${it.name} costs you`} w={58} value={(it.cost / 100).toFixed(2)} onChange={(v) => patch((n) => { n.items[i].unitCostCents = toCents(v); })} /></td>
                        <td style={{ ...tdN, fontWeight: 700, color: it.belowCost ? A.bad : A.brass }}>{cash(it.contribution)}</td>
                        <td style={tdN}><Cell label={`how many ${it.name} you expect to sell`} w={50} value={String(it.expected)} onChange={(v) => patch((n) => { n.items[i].expectedSold = Math.round(toNumber(v)); })} /></td>
                        <td style={tdN}><Cell label={`how many ${it.name} you prep`} w={50} value={String(it.prepped)} onChange={(v) => patch((n) => { n.items[i].prepped = Math.round(toNumber(v)); })} /></td>
                        <td style={{ ...tdN, color: T.textMuted }}>
                          {it.wasteUnits === 0 ? '—' : cash(it.wasteCost)}
                          {it.wasteUnits > 0 && <span style={{ display: 'block', fontSize: 10 }}>{it.wasteUnits} left</span>}
                        </td>
                        <td style={{ ...td, textAlign: 'right' }}><Btn small onClick={() => patch((n) => { n.items.splice(i, 1); })}>×</Btn></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>

            <Panel
              title="Where the day crosses"
              note="Units out of the window along the bottom, money up the side. The line is straight because the arithmetic is — nothing here is fitted, smoothed or projected."
            >
              <BreakEvenLine
                fixed={r.totals.fixed}
                perUnit={r.totals.perUnit}
                breakEven={r.totals.breakEvenUnits}
                expected={r.totals.expectedUnits}
              />
              {r.totals.breakEvenUnits != null && (
                <p style={{ margin: '8px 0 0', fontSize: 12.5, color: T.textSec, lineHeight: 1.6 }}>
                  Everything below the rule is the part of the day that has not paid for the pitch yet.
                  You expect {r.totals.expectedUnits}, which is {r.totals.unitsPastBreakEven >= 0
                    ? <><strong>{r.totals.unitsPastBreakEven} past</strong> the crossing</>
                    : <><strong>{-r.totals.unitsPastBreakEven} short</strong> of it</>}.
                </p>
              )}
            </Panel>
          </div>

          <div>
            <Panel title="What the day costs before you sell anything" note="The part that does not move whether you serve four hundred or none.">
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <Field label="Pitch fee" prefix="$" w={92} value={(state.feeCents / 100).toFixed(2)} onChange={(v) => patch((n) => { n.feeCents = toCents(v); })} />
                <Field label="Everything else" prefix="$" w={98} value={(state.otherFixedCents / 100).toFixed(2)} onChange={(v) => patch((n) => { n.otherFixedCents = toCents(v); })} />
              </div>
              <p style={{ margin: '9px 0 0', fontSize: 11.5, color: T.textMuted, lineHeight: 1.55 }}>
                Fuel, propane, ice, an extra pair of hands — whatever you spend to be there rather than
                per plate. Anything that scales with what you sell belongs in the item cost instead.
              </p>
            </Panel>

            <Panel title="This day" right={
              <span style={{ display: 'flex', gap: 8 }}>
                <Btn small onClick={reset}>Reset</Btn>
                <Btn small primary onClick={doExport}>{busy ? 'Building…' : 'Export'}</Btn>
              </span>
            }>
              <p style={{ margin: 0, fontSize: 34, fontWeight: 700, fontFamily: FONT_DATA, lineHeight: 1.1, color: r.totals.profit < 0 ? A.bad : A.brass }}>
                {r.totals.profit < 0 ? '−' : ''}{cash(Math.abs(r.totals.profit))}
              </p>
              <p style={{ margin: '6px 0 0', fontSize: 12.5, color: T.textSec, lineHeight: 1.6 }}>
                on {cash(r.totals.revenue)} of takings, after {cash(r.totals.fixed)} to be there
                and {cash(r.totals.wasteCost)} of prep that does not sell.
              </p>
              <p style={{ margin: '12px 0 0', fontSize: 12, color: T.textMuted, lineHeight: 1.6, paddingTop: 10, borderTop: `${S.rule} solid ${T.border}` }}>
                Every figure here rests on the mix you typed in. Sell more tea and fewer plates and the
                crossing moves, because a unit stops meaning the same thing.
              </p>
            </Panel>

            <WontDo items={[
              'It will not guess how many people turn up. That is weather, a Saturday and whoever else is on the field, and none of it is arithmetic.',
              'It will not tell you what to charge for a plate, or what a pitch is worth paying.',
              'It costs what you prepped and did not sell at what it cost you, never at what it would have sold for — that money was never anybody’s.',
              'It will not tell you whether to take the booking. A day that barely clears can still be the one that gets you the next four.',
            ]} />
          </div>
        </div>
      </div>
    </div>
  );
}
