// ============================================================================
// TURN COST — Anchor Lane Rooms (portfolio demo)
//
// THE FINDING IS THE SECOND FIGURE. A turn costs what it costs whatever the
// length of the stay — the linens, the hour of housekeeping, the coffee and the
// soap are the same for two nights as for seven. So the cost PER STAY is fixed
// and the cost PER NIGHT is not, and it falls fast as the stay lengthens.
//
// ON THE SAMPLE, THE CHEAPEST TURN IS THE DEAREST PER NIGHT, because it turns
// twice as often. Almost nobody works that out, because the turn cost lives in
// one place and the length of stay lives in another.
//
// Both are printed and the page says which one moves. Showing only the per-stay
// figure hides the whole insight; showing only the per-night one invites the
// reader to think a turn got cheaper.
//
// WHAT IS RESTOCKED EVERY FEW STAYS IS AMORTIZED. A bottle that lasts six turns
// charged to one overstates that stay and understates five; left out entirely it
// is how a turn cost ends up a third light.
//
// Built by Ian Provencher · AppliedIQ Solutions
// Public demo — the house, the rooms and every rate are invented.
// ============================================================================

import React, { useMemo, useState } from 'react';
import { computeTurnCost } from '../../lib/turn-cost.js';
import { T, A, S, FONT_DATA, Panel, Btn, Cell, Field, ToolHeader, Problems, WontDo, useRemembered, toCents, toNumber, cash, uid, wrap, th, thN, td, tdN, exportRows, pageFor, Readout } from '../kit/shelf.jsx';

const HOUSE = 'Anchor Lane Rooms';

// ============================================================================
// THE SAMPLE MONTH — the same figures scripts/verify-tools.mjs works out by
// hand. Three room types, and the cheapest turn is the dearest per night.
// ============================================================================
const SAMPLE = {
  housekeepingCentsPerHour: 2600,
  rooms: [
    { id: 'r1', name: 'Harbour room', units: 3, turnMinutes: 55, linenCents: 420, consumableCents: 385, restockCents: 1800, restockEveryStays: 6, reserveCents: 200, staysThisMonth: 9, avgNights: 2 },
    { id: 'r2', name: 'Loft', units: 1, turnMinutes: 80, linenCents: 610, consumableCents: 540, restockCents: 2600, restockEveryStays: 5, reserveCents: 300, staysThisMonth: 6, avgNights: 3 },
    { id: 'r3', name: 'Garden cottage', units: 1, turnMinutes: 95, linenCents: 780, consumableCents: 620, restockCents: 3000, restockEveryStays: 4, reserveCents: 400, staysThisMonth: 5, avgNights: 4 },
  ],
};

const mins = (m) => `${m} min`;

export default function TurnCost({ mode = 'demo' }) {
  const { state, patch, reset, status, restored, pack } = useRemembered('turn-cost', 1, SAMPLE, mode);
  const [busy, setBusy] = useState(false);
  const r = useMemo(() => computeTurnCost(state), [state]);

  const doExport = async () => {
    setBusy(true);
    try {
      await exportRows('turn-cost.xlsx', 'Turns',
        r.rooms.map((q) => ({
          Room: q.name,
          Units: q.units,
          Turn_minutes: q.minutes,
          Housekeeping: Number((q.labor / 100).toFixed(2)),
          Linens: Number((q.linen / 100).toFixed(2)),
          Left_out: Number((q.consumable / 100).toFixed(2)),
          Restock_per_stay: Number((q.restockPerStay / 100).toFixed(2)),
          Reserve: Number((q.reserve / 100).toFixed(2)),
          Per_stay: Number((q.perStay / 100).toFixed(2)),
          Avg_nights: q.nights,
          Per_night: q.perNight == null ? '' : Number((q.perNight / 100).toFixed(2)),
          Stays: q.stays,
          This_month: Number((q.monthly / 100).toFixed(2)),
        })).concat([{}, {
          Room: 'Turns this month',
          This_month: Number((r.totals.monthly / 100).toFixed(2)),
        }, {
          Room: 'Per stay, weighted',
          Per_stay: r.totals.perStay == null ? '' : Number((r.totals.perStay / 100).toFixed(2)),
        }, {
          Room: 'Per night, weighted — MOVES with length of stay',
          Per_night: r.totals.perNight == null ? '' : Number((r.totals.perNight / 100).toFixed(2)),
        }]),
        [20, 7, 13, 13, 10, 10, 16, 10, 10, 11, 10, 8, 12]);
    } finally { setBusy(false); }
  };

  return (
    <div style={pageFor('turn-cost')} data-demo="turn-cost">
      <ToolHeader toolId="turn-cost" house={HOUSE} occasion="sample month" name="Room Turn Cost" status={status} restored={restored} pack={pack} remembers="housekeeping rate and what a turn includes">
        What it costs to make a room ready, on your own standard. A turn costs the same whatever the
        length of the stay, so the figure per stay holds still and the figure per night does not —
        both are here, and the page says which one moves. Nothing you type leaves this page.
      </ToolHeader>

      <Readout items={[
        { label: 'A turn, per stay', value: r.totals.perStay == null ? '—' : cash(r.totals.perStay),
          note: 'weighted across the month — this figure does not move with the length of a stay' },
        { label: 'And per night', value: r.totals.perNight == null ? '—' : cash(r.totals.perNight),
          note: 'this one does, and it is the one that decides what a night has to cover' },
        { label: 'Turns this month', value: cash(r.totals.monthly),
          note: `${r.totals.stays} stays across ${r.totals.units} units, ${r.totals.nights} nights let` },
        { label: 'Housekeeping in it', value: cash(r.totals.labor),
          note: `at ${cash(r.totals.rate)} an hour, which is what you pay` },
      ]} />

      <div style={wrap}>
        <Problems heading="Look at these before you price a night" items={r.problems} />

        {/* FULL WIDTH: ten columns, and the two-thirds grid clips the last of
            them — the same lesson claim-aging and consignment taught. */}
        <Panel
          title="What a turn is, in each room"
          note="Every column is a standard this house set. Restock is what does NOT get replaced every stay, spread across the stays it covers."
          right={<Btn small onClick={() => patch((s) => { s.rooms.push({ id: uid('r'), name: 'New room', units: 1, turnMinutes: 0, linenCents: 0, consumableCents: 0, restockCents: 0, restockEveryStays: 0, reserveCents: 0, staysThisMonth: 0, avgNights: 0 }); })}>Add a room</Btn>}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 880 }}>
              <thead>
                <tr>
                  <th style={th}>Room</th><th style={thN}>Units</th><th style={thN}>Turn</th>
                  <th style={thN}>Housekeeping</th><th style={thN}>Linens</th><th style={thN}>Left out</th>
                  <th style={thN}>Restock</th><th style={thN}>Every</th><th style={thN}>Reserve</th>
                  <th style={thN}>Per stay</th><th style={th} />
                </tr>
              </thead>
              <tbody>
                {r.rooms.map((q, i) => (
                  <tr key={q.id} style={{ background: q.noTurnTime || q.restockWithNoInterval ? A.badTint : 'transparent' }}>
                    <td style={td}><Cell label={`name of room ${i + 1}`} mono={false} w={124} value={q.name} onChange={(v) => patch((n) => { n.rooms[i].name = v; })} /></td>
                    <td style={tdN}><Cell label={`how many ${q.name}`} w={42} value={String(q.units)} onChange={(v) => patch((n) => { n.rooms[i].units = Math.round(toNumber(v)); })} /></td>
                    <td style={tdN}><Cell label={`minutes to turn ${q.name}`} w={46} value={String(q.minutes)} onChange={(v) => patch((n) => { n.rooms[i].turnMinutes = Math.round(toNumber(v)); })} /></td>
                    <td style={{ ...tdN, color: T.textSec }}>{cash(q.labor)}<span style={{ display: 'block', fontSize: 10, color: T.textMuted }}>{mins(q.minutes)}</span></td>
                    <td style={tdN}><Cell label={`linens for ${q.name}`} w={58} value={(q.linen / 100).toFixed(2)} onChange={(v) => patch((n) => { n.rooms[i].linenCents = toCents(v); })} /></td>
                    <td style={tdN}><Cell label={`what is left out in ${q.name}`} w={58} value={(q.consumable / 100).toFixed(2)} onChange={(v) => patch((n) => { n.rooms[i].consumableCents = toCents(v); })} /></td>
                    <td style={tdN}><Cell label={`restock cost for ${q.name}`} w={58} value={(q.restock / 100).toFixed(2)} onChange={(v) => patch((n) => { n.rooms[i].restockCents = toCents(v); })} /></td>
                    <td style={tdN}>
                      <Cell label={`restock every how many stays in ${q.name}`} w={42} value={String(q.every)} onChange={(v) => patch((n) => { n.rooms[i].restockEveryStays = Math.round(toNumber(v)); })} />
                      {q.restockPerStay > 0 && <span style={{ display: 'block', fontSize: 10, color: T.textMuted }}>{cash(q.restockPerStay)} ea</span>}
                    </td>
                    <td style={tdN}><Cell label={`deep-clean reserve for ${q.name}`} w={54} value={(q.reserve / 100).toFixed(2)} onChange={(v) => patch((n) => { n.rooms[i].reserveCents = toCents(v); })} /></td>
                    <td style={{ ...tdN, fontWeight: 700, color: A.brass }}>{cash(q.perStay)}</td>
                    <td style={{ ...td, textAlign: 'right' }}><Btn small onClick={() => patch((n) => { n.rooms.splice(i, 1); })}>×</Btn></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="aiq-split" style={{ '--aiq-split': '1.5fr' }}>
          <div>
            <Panel
              title="And what that comes to, against how long people stay"
              note="The per-stay column is the one above, unchanged. The per-night column is the same money divided by a different number of nights — which is the whole point."
            >
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
                  <thead>
                    <tr>
                      <th style={th}>Room</th><th style={thN}>Stays</th><th style={thN}>Nights each</th>
                      <th style={thN}>Per stay</th><th style={thN}>Per night</th><th style={thN}>This month</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.rooms.map((q, i) => (
                      <tr key={q.id} style={{ background: q.noLength && q.stays > 0 ? A.warnTint : 'transparent' }}>
                        <td style={{ ...td, color: T.textSec }}>{q.name}</td>
                        <td style={tdN}><Cell label={`stays this month in ${q.name}`} w={44} value={String(q.stays)} onChange={(v) => patch((n) => { n.rooms[i].staysThisMonth = Math.round(toNumber(v)); })} /></td>
                        <td style={tdN}><Cell label={`average nights in ${q.name}`} w={46} value={String(q.nights)} onChange={(v) => patch((n) => { n.rooms[i].avgNights = toNumber(v); })} /></td>
                        <td style={{ ...tdN, color: T.textSec }}>{cash(q.perStay)}</td>
                        <td style={{ ...tdN, fontWeight: 700, color: A.brass }}>{q.perNight == null ? '—' : cash(q.perNight)}</td>
                        <td style={{ ...tdN, color: T.textSec }}>{cash(q.monthly)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p style={{ margin: '10px 0 0', fontSize: 12, color: T.textMuted, lineHeight: 1.6 }}>
                Read the last two columns against each other. The room with the cheapest turn is not
                usually the cheapest room to run, because it turns more often — and nothing in a
                booking report ever puts those two numbers side by side.
              </p>
            </Panel>
          </div>

          <div>
            <Panel title="What you pay" note="One rate, and it is yours.">
              <Field label="Housekeeping, an hour" prefix="$" w={104} value={(state.housekeepingCentsPerHour / 100).toFixed(2)} onChange={(v) => patch((n) => { n.housekeepingCentsPerHour = toCents(v); })} />
              <p style={{ margin: '9px 0 0', fontSize: 11.5, color: T.textMuted, lineHeight: 1.55 }}>
                If you do the turns yourself, this is still a real number — it is what your hour is
                worth, and leaving it at zero makes every room look cheaper than it is.
              </p>
            </Panel>

            <Panel title="This month" right={
              <span style={{ display: 'flex', gap: 8 }}>
                <Btn small onClick={reset}>Reset</Btn>
                <Btn small primary onClick={doExport}>{busy ? 'Building…' : 'Export'}</Btn>
              </span>
            }>
              <p style={{ margin: 0, fontSize: 34, fontWeight: 700, fontFamily: FONT_DATA, lineHeight: 1.1, color: A.brass }}>
                {cash(r.totals.monthly)}
              </p>
              <p style={{ margin: '6px 0 0', fontSize: 12.5, color: T.textSec, lineHeight: 1.6 }}>
                across {r.totals.stays} turns — {cash(r.totals.labor)} of housekeeping,
                {' '}{cash(r.totals.linen)} of linen, {cash(r.totals.consumable)} left out
                and {cash(r.totals.reserve)} held back.
              </p>
              <p style={{ margin: '12px 0 0', fontSize: 12, color: T.textMuted, lineHeight: 1.6, paddingTop: 10, borderTop: `${S.rule} solid ${T.border}` }}>
                A longer average stay does not make a turn cheaper. It spreads the same turn over more
                nights, which is a different sentence and a much more useful one — it is the reason a
                minimum-stay rule is a cost decision before it is a marketing one.
              </p>
            </Panel>

            <WontDo items={[
              'It will not tell you how long a turn should take. That is your rooms, your standard and whoever does them.',
              'It will not suggest a housekeeping rate, or what to charge a guest for cleaning.',
              'It will not compare your turn to any published cleaning fee. Somebody else’s fee is somebody else’s house and somebody else’s labor market.',
              'It will not set a minimum stay. It shows you what one would be worth and stops there.',
              'It forecasts no occupancy. The stays and the nights are the ones you type in.',
            ]} />
          </div>
        </div>
      </div>
    </div>
  );
}
