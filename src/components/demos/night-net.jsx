// ============================================================================
// NET PER NIGHT — The Bight House (portfolio demo)
//
// WHY THIS IS THE HOST'S TOOL AND NOT THE PLATFORM'S. The commission is
// trade-wide: every host on that platform pays the same percentage and the
// platform prints it on the payout. The two figures that are NOT trade-wide are
// the ones this rests on — what a turn costs THIS house, and whether the
// occupancy tax was collected by the platform or by the host. Neither appears on
// any statement, and between them they are most of the difference.
//
// THE FINDING IS THE CLEANING FEE AGAINST THE TURN. A fee is set once, in a
// listing, usually by copying the place down the road. A turn cost is worked out
// never. So the two numbers have no relationship — and the gap runs both ways.
// Charge over the turn and the surplus is quietly subsidizing the nightly rate;
// charge under it and the house is absorbing part of every turn forever, with
// no line item anywhere saying so. Both directions are printed per booking.
//
// THE SECOND FINDING IS QUIETER AND BIGGER. Occupancy tax a platform collects on
// top and remits is not income, and hosts count it as revenue constantly. It
// never enters gross here and it never enters what they keep. Where the platform
// does NOT remit, the house collected it and owes it, so it comes off.
//
// Built by Ian Provencher · AppliedIQ Solutions
// Public demo — the house, the bookings, the platforms and every rate are
// invented. No real platform is named and no real commission is quoted.
// ============================================================================

import React, { useMemo, useState } from 'react';
import { computeNetPerNight } from '../../lib/night-net.js';
import { T, A, S, FONT_DATA, FONT_BODY, Panel, Btn, Cell, Field, ToolHeader, Problems, WontDo, useRemembered, toCents, toNumber, cash, uid, wrap, th, thN, td, tdN, exportRows, pageFor, Readout } from '../kit/shelf.jsx';

const HOUSE = 'The Bight House';

// ============================================================================
// THE SAMPLE SHEET — the same figures scripts/verify-tools.mjs works out by
// hand. Three platforms with three different tax answers, and five bookings
// whose cleaning fee runs OVER the turn on three, close to it on one, and UNDER
// it on the last. That spread is the demo's argument and it is asserted.
// ============================================================================
const SAMPLE = {
  occupancyTaxPctHundredths: 600,
  turnCostCents: 4200,
  platforms: [
    { id: 'p1', name: 'Harbour Stays', commissionPctHundredths: 1500, processingPctHundredths: 0, remitsTax: true },
    { id: 'p2', name: 'Cottage Register', commissionPctHundredths: 300, processingPctHundredths: 290, remitsTax: false },
    { id: 'p3', name: 'The house page', commissionPctHundredths: 0, processingPctHundredths: 290, remitsTax: false },
  ],
  bookings: [
    { id: 'b1', ref: 'Dock room · 2291', nights: 4, nightlyRateCents: 18500, cleaningFeeChargedCents: 9500, bookingPlatformId: 'p1' },
    { id: 'b2', ref: 'Dock room · 2294', nights: 2, nightlyRateCents: 21000, cleaningFeeChargedCents: 9500, bookingPlatformId: 'p1' },
    { id: 'b3', ref: 'Carriage house · 2297', nights: 6, nightlyRateCents: 16500, cleaningFeeChargedCents: 9500, bookingPlatformId: 'p2' },
    { id: 'b4', ref: 'Front room · 2301', nights: 3, nightlyRateCents: 19500, cleaningFeeChargedCents: 6000, bookingPlatformId: 'p3' },
    { id: 'b5', ref: 'Carriage house · 2304', nights: 7, nightlyRateCents: 15500, cleaningFeeChargedCents: 3500, bookingPlatformId: 'p3' },
  ],
};

const pct = (h) => (h / 100).toFixed(2) + '%';
/* A SIGNED FIGURE, because the direction IS the finding. An unsigned gap reads
   as a size and says nothing about who is paying it. */
const signed = (c) => (c > 0 ? '+' : c < 0 ? '−' : '') + cash(Math.abs(c));

export default function NightNet({ mode = 'demo' }) {
  const { state, patch, reset, status, restored, pack } = useRemembered('night-net', 1, SAMPLE, mode);
  const [busy, setBusy] = useState(false);
  const r = useMemo(() => computeNetPerNight(state), [state]);

  const doExport = async () => {
    setBusy(true);
    try {
      await exportRows('net-per-night.xlsx', 'Nights',
        r.rows.map((q) => ({
          Booking: q.ref,
          Platform: q.platformName || '(not on your list)',
          Nights: q.nights,
          A_night: Number((q.rate / 100).toFixed(2)),
          Cleaning_fee: Number((q.cleaning / 100).toFixed(2)),
          Guest_paid: Number((q.gross / 100).toFixed(2)),
          Commission: q.commission == null ? '' : Number((q.commission / 100).toFixed(2)),
          Card: q.processing == null ? '' : Number((q.processing / 100).toFixed(2)),
          Tax_you_owe: Number((q.taxOwed / 100).toFixed(2)),
          Tax_they_remitted: Number((q.taxRemitted / 100).toFixed(2)),
          The_turn: Number((r.totals.turnCost / 100).toFixed(2)),
          You_keep: q.net == null ? '' : Number((q.net / 100).toFixed(2)),
          A_night_kept: q.perNight == null ? '' : Number((q.perNight / 100).toFixed(2)),
          Fee_against_turn: Number((q.cleaningGap / 100).toFixed(2)),
        })).concat([{}, {
          Booking: 'What the guests paid',
          Guest_paid: Number((r.totals.gross / 100).toFixed(2)),
        }, {
          Booking: 'What the house keeps',
          You_keep: Number((r.totals.net / 100).toFixed(2)),
        }, {
          Booking: 'A night, weighted across every night on the sheet',
          A_night_kept: r.totals.perNight == null ? '' : Number((r.totals.perNight / 100).toFixed(2)),
        }, {
          Booking: 'Cleaning fee charged over and above the turns',
          Fee_against_turn: Number((r.totals.cleaningGap / 100).toFixed(2)),
        }, {
          Booking: 'Occupancy tax a platform remitted — NOT your money, in none of the above',
          Tax_they_remitted: Number((r.totals.taxRemitted / 100).toFixed(2)),
        }]),
        [22, 17, 7, 9, 13, 11, 11, 9, 12, 18, 9, 10, 13, 17]);
    } finally { setBusy(false); }
  };

  const gap = r.totals.cleaningGap;

  return (
    <div style={pageFor('night-net')} data-demo="night-net">
      <ToolHeader
        toolId="night-net" house={HOUSE} occasion="sample sheet" name="Net Per Night"
        badge={cash(r.totals.gross)}
        status={status} restored={restored} pack={pack}
        remembers="platforms, your turn cost and your tax rate"
      >
        What is actually left of a booking once the platform, the card, the county and the turn have
        all had their piece — and what that is a night. The commission is the same for every host on
        that platform; the turn and the tax handling are yours, and they are where the money moves.
        Nothing you type leaves this page.
      </ToolHeader>

      {/* FOUR CELLS, AND TWO OF THEM ARE THE FINDINGS RATHER THAN SUB-TOTALS.
          A receipt foot would have to fold both into a column that adds up, and
          neither one does: the gap is a comparison and the remitted tax is money
          that never enters the total at all. */}
      <Readout items={[
        { label: 'A night, kept', value: r.totals.perNight == null ? null : cash(r.totals.perNight),
          note: `weighted across all ${r.totals.nights} nights, not the average of the rows` },
        { label: 'The house keeps', value: cash(r.totals.net),
          note: `of the ${cash(r.totals.gross)} the guests paid` },
        { label: 'Cleaning fee against the turns', value: signed(gap),
          tone: gap < 0 ? 'bad' : undefined,
          note: gap > 0
            ? 'charged over what the turns cost, so the fee is subsidizing the nightly rate'
            : gap < 0
              ? 'charged UNDER what the turns cost, so you are absorbing part of every turn'
              : 'the fee and the turns come to exactly the same thing' },
        { label: 'Tax a platform remitted', value: cash(r.totals.taxRemitted),
          note: 'paid to the county direct — never yours, and in none of the figures here' },
      ]} />

      <div style={wrap}>
        <Problems heading="Look at these before you read a single figure" items={r.problems} />

        {/* FULL WIDTH: eleven columns. The turn is deliberately NOT one of them —
            it is the same figure on every row, so a column of it would be eleven
            repetitions of one number squeezing the ten that vary. It is named in
            the note and it is a field of its own on the right. */}
        <Panel
          title="Every booking, and what came off it"
          note={`One turn at ${cash(r.totals.turnCost)} comes off every booking below, once — not once a night. Occupancy tax is worked out on the room only, which is the common shape; if your county taxes the cleaning fee too, that is not what this does.`}
          right={<Btn small onClick={() => patch((s) => { s.bookings.push({ id: uid('b'), ref: 'New booking', nights: 1, nightlyRateCents: 0, cleaningFeeChargedCents: 0, bookingPlatformId: s.platforms[0] ? s.platforms[0].id : '' }); })}>Add a booking</Btn>}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1080 }}>
              <thead>
                <tr>
                  <th style={th}>Booking</th><th style={th}>Booked through</th>
                  <th style={thN}>Nights</th><th style={thN}>A night</th><th style={thN}>Cleaning</th>
                  <th style={thN}>Guest paid</th><th style={thN}>Commission</th><th style={thN}>Card</th>
                  <th style={thN}>Occupancy tax</th><th style={thN}>You keep</th><th style={th} />
                </tr>
              </thead>
              <tbody>
                {r.rows.map((q, i) => (
                  <tr key={q.id} style={{ background: q.noPlatform || q.negative ? A.badTint : (q.noNights ? A.warnTint : 'transparent') }}>
                    <td style={td}><Cell label={`reference for booking ${i + 1}`} mono={false} w={152} value={q.ref} onChange={(v) => patch((n) => { n.bookings[i].ref = v; })} /></td>
                    <td style={td}>
                      <select aria-label={`platform for ${q.ref}`} value={q.bookingPlatformId}
                        onChange={(e) => patch((n) => { n.bookings[i].bookingPlatformId = e.target.value; })}
                        style={{ background: T.bg, color: T.text, border: `${S.rule} solid ${T.border}`, borderRadius: S.radiusSm, padding: '5px 6px', fontSize: 12, fontFamily: FONT_BODY, maxWidth: 170 }}>
                        {state.platforms.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        {q.noPlatform && <option value={q.bookingPlatformId}>not on your list</option>}
                      </select>
                    </td>
                    <td style={tdN}><Cell label={`nights on ${q.ref}`} w={42} value={String(q.nights)} onChange={(v) => patch((n) => { n.bookings[i].nights = Math.round(toNumber(v)); })} /></td>
                    <td style={tdN}><Cell label={`nightly rate on ${q.ref}`} w={62} value={(q.rate / 100).toFixed(2)} onChange={(v) => patch((n) => { n.bookings[i].nightlyRateCents = toCents(v); })} /></td>
                    <td style={tdN}><Cell label={`cleaning fee charged on ${q.ref}`} w={62} value={(q.cleaning / 100).toFixed(2)} onChange={(v) => patch((n) => { n.bookings[i].cleaningFeeChargedCents = toCents(v); })} /></td>
                    <td style={{ ...tdN, color: T.textSec }}>{cash(q.gross)}</td>
                    <td style={{ ...tdN, color: T.textMuted }}>{q.commission == null ? '—' : cash(q.commission)}</td>
                    <td style={{ ...tdN, color: T.textMuted }}>{q.processing == null ? '—' : cash(q.processing)}</td>
                    {/* ONE COLUMN, TWO STATES, SPELLED DIFFERENTLY. A remitted tax
                        shown as a plain deduction would be the exact mistake this
                        tool exists to correct. */}
                    <td style={{ ...tdN, color: q.taxOwed > 0 ? T.textSec : T.textMuted }}>
                      {q.taxOwed > 0 ? cash(q.taxOwed) : (q.taxRemitted > 0 ? cash(q.taxRemitted) : cash(0))}
                      <span style={{ display: 'block', fontSize: 10, color: T.textMuted, fontFamily: FONT_BODY }}>
                        {q.taxOwed > 0 ? 'you owe it' : (q.taxRemitted > 0 ? 'they remitted it' : 'none')}
                      </span>
                    </td>
                    <td style={{ ...tdN, fontWeight: 700, color: q.net == null ? T.textMuted : (q.net < 0 ? A.bad : A.brass) }}>
                      {q.net == null ? '—' : cash(q.net)}
                    </td>
                    <td style={{ ...td, textAlign: 'right' }}><Btn small onClick={() => patch((n) => { n.bookings.splice(i, 1); })}>×</Btn></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="aiq-split" style={{ '--aiq-split': '1.55fr' }}>
          <div>
            <Panel
              title="What a night keeps, and what the cleaning fee is doing"
              note="The last two columns are the point. A cleaning fee is set once in a listing; a turn cost is worked out never — so nothing anywhere has ever put these two numbers side by side."
            >
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
                  <thead>
                    <tr>
                      <th style={th}>Booking</th><th style={thN}>Nights</th><th style={thN}>You keep</th>
                      <th style={thN}>A night</th><th style={thN}>Fee charged</th><th style={thN}>A turn costs</th>
                      <th style={thN}>The gap</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.rows.map((q) => (
                      <tr key={q.id} style={{ background: q.cleaningGap < 0 ? A.warnTint : 'transparent' }}>
                        <td style={{ ...td, color: T.textSec }}>{q.ref}</td>
                        <td style={tdN}>{q.nights}</td>
                        <td style={{ ...tdN, color: T.textSec }}>{q.net == null ? '—' : cash(q.net)}</td>
                        <td style={{ ...tdN, fontWeight: 700, color: A.brass }}>{q.perNight == null ? '—' : cash(q.perNight)}</td>
                        <td style={{ ...tdN, color: T.textSec }}>{cash(q.cleaning)}</td>
                        <td style={{ ...tdN, color: T.textMuted }}>{cash(r.totals.turnCost)}</td>
                        <td style={{ ...tdN, fontWeight: 700, color: q.cleaningGap < 0 ? A.bad : T.text }}>{signed(q.cleaningGap)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p style={{ margin: '10px 0 0', fontSize: 12, color: T.textMuted, lineHeight: 1.6 }}>
                A plus means the guest paid more for cleaning than the turn cost, and the surplus is
                quietly holding the nightly rate down — the room looks cheaper than it is. A minus
                means you are paying for part of every turn out of the room rate, on every booking,
                for as long as the listing says what it says.
              </p>
            </Panel>

            <Panel
              title="Your platforms"
              note="Commission is the same for every host on a platform, so it is the one number here that is not yours. The tax column is: does the platform collect occupancy tax on top and pay the county, or do you?"
              right={<Btn small onClick={() => patch((s) => { s.platforms.push({ id: uid('p'), name: 'New platform', commissionPctHundredths: 0, processingPctHundredths: 0, remitsTax: false }); })}>Add a platform</Btn>}
            >
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
                  <thead>
                    <tr>
                      <th style={th}>Platform</th><th style={thN}>Commission</th><th style={thN}>Card</th>
                      <th style={thN}>Takes in all</th><th style={th}>Occupancy tax</th><th style={th} />
                    </tr>
                  </thead>
                  <tbody>
                    {r.platforms.map((p, i) => (
                      <tr key={p.id} style={{ background: p.takesEverything ? A.badTint : 'transparent' }}>
                        <td style={td}><Cell label={`name of platform ${i + 1}`} mono={false} w={150} value={p.name} onChange={(v) => patch((n) => { n.platforms[i].name = v; })} /></td>
                        <td style={tdN}><Cell label={`commission on ${p.name}`} w={56} value={(p.commission / 100).toFixed(2)} onChange={(v) => patch((n) => { n.platforms[i].commissionPctHundredths = toCents(v); })} /></td>
                        <td style={tdN}><Cell label={`card processing on ${p.name}`} w={56} value={(p.processing / 100).toFixed(2)} onChange={(v) => patch((n) => { n.platforms[i].processingPctHundredths = toCents(v); })} /></td>
                        <td style={{ ...tdN, color: p.takesEverything ? A.bad : T.textSec }}>{pct(p.commission + p.processing)}</td>
                        <td style={td}>
                          <select aria-label={`who remits occupancy tax on ${p.name}`} value={p.remitsTax ? 'them' : 'you'}
                            onChange={(e) => patch((n) => { n.platforms[i].remitsTax = e.target.value === 'them'; })}
                            style={{ background: T.bg, color: T.text, border: `${S.rule} solid ${T.border}`, borderRadius: S.radiusSm, padding: '5px 6px', fontSize: 12, fontFamily: FONT_BODY, maxWidth: 190 }}>
                            <option value="them">They collect and remit it</option>
                            <option value="you">You collect and owe it</option>
                          </select>
                        </td>
                        <td style={{ ...td, textAlign: 'right' }}><Btn small onClick={() => patch((n) => { n.platforms.splice(i, 1); })}>×</Btn></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>

          <div>
            <Panel title="The two numbers that are yours" note="Neither of these is on any statement you will ever be sent.">
              <Field
                label="What one turn costs you" prefix="$" w={104}
                value={(state.turnCostCents / 100).toFixed(2)}
                onChange={(v) => patch((n) => { n.turnCostCents = toCents(v); })}
                hint="Housekeeping, linens, what you leave out — the figure the Room Turn Cost sheet works out."
              />
              <div style={{ height: 12 }} />
              <Field
                label="Occupancy tax rate" suffix="%" w={84}
                value={(r.totals.taxPct / 100).toFixed(2)}
                onChange={(v) => patch((n) => { n.occupancyTaxPctHundredths = toCents(v); })}
                hint="Worked out on the room only, not on the cleaning fee. If your county does it differently, set this to zero and handle it outside this sheet."
              />
            </Panel>

            <Panel title="This sheet" right={
              <span style={{ display: 'flex', gap: 8 }}>
                <Btn small onClick={reset}>Reset</Btn>
                <Btn small primary onClick={doExport}>{busy ? 'Building…' : 'Export'}</Btn>
              </span>
            }>
              <p style={{ margin: 0, fontSize: 34, fontWeight: 700, fontFamily: FONT_DATA, lineHeight: 1.1, color: A.brass }}>
                {cash(r.totals.net)}
              </p>
              <p style={{ margin: '6px 0 0', fontSize: 12.5, color: T.textSec, lineHeight: 1.6 }}>
                from {cash(r.totals.gross)} across {r.totals.priced} bookings — {cash(r.totals.commission)} of
                commission, {cash(r.totals.processing)} of card fees, {cash(r.totals.taxOwed)} of occupancy tax
                you owe and {cash(r.totals.turns)} of turns.
              </p>
              <p style={{ margin: '12px 0 0', fontSize: 12, color: T.textMuted, lineHeight: 1.6, paddingTop: 10, borderTop: `${S.rule} solid ${T.border}` }}>
                A further {cash(r.totals.taxRemitted)} of occupancy tax was collected on top by a platform and
                paid to the county direct. It is in none of the figures above, because it was never yours —
                and counting it as revenue is the most common way this arithmetic goes wrong.
              </p>
            </Panel>

            <WontDo items={[
              'It will not suggest a nightly rate. What a room is worth is your market, your season and your house.',
              'It will not suggest a cleaning fee. It shows you what yours is doing against your own turn cost and stops there.',
              'It forecasts no occupancy. The bookings are the ones you type in, and there is no model behind any of this.',
              'It will not compare anything here to a published market rate, an occupancy benchmark or the place down the road.',
              'It will not tell you whether a platform’s commission is worth paying. That is a judgment about where your bookings come from, and no arithmetic on this page can see it.',
              'It will not work out your occupancy tax liability. It applies the rate you type to the room charge, which is the common shape and not a ruling about your county.',
            ]} />
          </div>
        </div>
      </div>
    </div>
  );
}
