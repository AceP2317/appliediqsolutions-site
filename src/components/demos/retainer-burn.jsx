// ============================================================================
// RETAINER BURN — Ropewalk Studio (small agency demo)
//
// WHY THIS IS THE SHOP'S TOOL AND NOT A PLATFORM'S. A retainer is a price and a
// RULE. The price is this much a month; the rule says what happens to the hours
// the price bought and nobody used — carried forward in full, carried up to a
// cap, or gone at the close. That rule is the owner's own invention, written
// once into an engagement letter, and it was never keyed anywhere: time
// tracking holds the hours, accounting holds the fee, and neither of them knows
// which hours survive the end of the month.
//
// THE FIRST FINDING IS THE ACTIONABLE ONE. Hours the client already paid for
// that disappear at the close, sorted by how many days the period has left. The
// sample carries two at very different distances — one closing today with 6.60
// hours on it and one thirty days out with 6.00 — one client on a full-rollover
// rule where nothing expires at all, one that is over its hours with an overage
// rate, one that is over with none, and one period that CLOSED a month ago with
// hours still unused, which is named as gone rather than going.
//
// THE SECOND IS ABOUT THE PRICE AND IS DELIBERATELY NOT A JUDGMENT ON IT. One
// fixed fee is a different hourly rate every period. Every retainer on this
// sheet was bought at the same rate and they came to between $130.12 and
// $306.38. That is arithmetic on the shop's own numbers, and this page takes no
// view on whether any of it is the right price.
//
// ⚠ AND THE RATE THIS LEDGER IS PRICED AT IS NOT ONE OF THE THREE IN
// src/lib/engagement-rates.js. The practice's own hourly, its monthly upkeep
// and its extra-page figure are never published, and `npm run gate` refuses any
// of them within eighty characters of the words "an hour", "a month" or
// "retainer" — which is nearly every sentence on this page. The first draft of
// this sample happened to land on the upkeep figure and the gate caught it in
// SOURCE, which is the only place it could have been caught: this island is
// client-only, so not one of its figures exists in dist/ for the same scan to
// find. Before changing a figure here, read that module rather than this note.
//
// Built by Ian Provencher · AppliedIQ Solutions
// Public demo — the studio, the clients, the fees and every date are invented.
// No fee is suggested, no rollover rule is proposed, and no real business is
// named.
// ============================================================================

import React, { useMemo, useState } from 'react';
import { computeRetainerBurn, ROLLOVER_POLICIES } from '../../lib/retainer-burn.js';
import { T, A, S, FONT_DATA, FONT_BODY, Panel, Btn, Cell, Field, ToolHeader, Problems, WontDo, useRemembered, toCents, toOptionalNumber, cash, uid, wrap, th, thN, td, tdN, exportRows, pageFor, Readout } from '../kit/shelf.jsx';

const HOUSE = 'Ropewalk Studio';

/* THE STATUS STRIP READS "remembers your <this>", so this cannot open with a
   determiner of its own — smoke-tools carries an arm for exactly that, added
   after the eleventh tool shipped "remembers your each unit". */
const REMEMBERS = 'retainers, what each period bought, and the rollover rule you wrote';

// ============================================================================
// THE SAMPLE LEDGER — the same figures scripts/verify-tools.mjs works out by
// hand. One small agency, six client retainers, and each is a different shape
// of the same question:
//
//   Marker Nine Boatyard   16.00 bought, 9.40 used, no rollover, closing TODAY.
//                          6.60 hours worth $1,188.00 gone tonight. THE HEADLINE.
//   Tern Street Goods      a quarter, 30.00 bought and 2.50 carried in, 21.50
//                          used, capped at 5.00. 6.00 hours expire in 30 days —
//                          past by a very different amount from the first,
//                          which is the whole argument for sorting by it.
//   Harbour Market         full rollover. 4.50 hours unused and NOT ONE OF THEM
//                          EXPIRES, which is the case that works and is
//                          deliberately not a finding anywhere.
//   Bell Buoy Builders     6.80 hours OVER, with an overage rate — $1,428.00
//                          billable, and a period bought at $180.00 an hour
//                          that came to $134.33.
//   Slack Tide Electric    2.30 hours over with NO overage rate. Delivered and
//                          unbillable, and there is no line for it anywhere.
//   Cutter Point Rentals   a period that CLOSED on 31 July with 4.80 hours
//                          unused. $864.00 the client paid for and did not get.
//
// `asOf` IS DATA AND NOT THE CLOCK. Every days-left figure here would otherwise
// fall by one every night, and no gate could assert anything about one except
// that it had changed.
// ============================================================================
const SAMPLE = {
  asOf: '2026-08-31',
  retainers: [
    { id: 'r1', ref: 'Marker Nine Boatyard', periodStart: '2026-08-01', periodEnd: '2026-08-31', retainerFeeCents: 288000, hoursIncludedHundredths: 1600, hoursUsedHundredths: 940, carriedInHundredths: 0, rolloverPolicy: 'none', rolloverCapHundredths: null, overageRateCents: 18000 },
    { id: 'r2', ref: 'Tern Street Goods', periodStart: '2026-07-01', periodEnd: '2026-09-30', retainerFeeCents: 540000, hoursIncludedHundredths: 3000, hoursUsedHundredths: 2150, carriedInHundredths: 250, rolloverPolicy: 'capped', rolloverCapHundredths: 500, overageRateCents: 19000 },
    { id: 'r3', ref: 'Harbour Market', periodStart: '2026-08-16', periodEnd: '2026-09-15', retainerFeeCents: 144000, hoursIncludedHundredths: 800, hoursUsedHundredths: 525, carriedInHundredths: 175, rolloverPolicy: 'full', rolloverCapHundredths: null, overageRateCents: 17000 },
    { id: 'r4', ref: 'Bell Buoy Builders', periodStart: '2026-08-01', periodEnd: '2026-10-31', retainerFeeCents: 360000, hoursIncludedHundredths: 2000, hoursUsedHundredths: 2680, carriedInHundredths: 0, rolloverPolicy: 'none', rolloverCapHundredths: null, overageRateCents: 21000 },
    { id: 'r5', ref: 'Slack Tide Electric', periodStart: '2026-08-10', periodEnd: '2026-09-09', retainerFeeCents: 108000, hoursIncludedHundredths: 600, hoursUsedHundredths: 830, carriedInHundredths: 0, rolloverPolicy: 'none', rolloverCapHundredths: null, overageRateCents: null },
    { id: 'r6', ref: 'Cutter Point Rentals', periodStart: '2026-06-01', periodEnd: '2026-07-31', retainerFeeCents: 216000, hoursIncludedHundredths: 1200, hoursUsedHundredths: 720, carriedInHundredths: 0, rolloverPolicy: 'none', rolloverCapHundredths: null, overageRateCents: 18000 },
  ],
};

/* THE KIT'S cash() WITH ONE THING ADDED, AND THE ADDITION IS THE HONESTY
   CONTRACT: a line this cannot work out must not read as one worth nothing.
   cash(null) is $0.00, which is a figure; an em dash is an absence. */
const money = (c) => (c == null ? '—' : cash(c));
/* HOURS OUT OF HUNDREDTHS OF AN HOUR, and null stays null. A retainer is
   written in hours and a time record is kept in tenths, so two decimal places
   is how either one reads back. */
const hrs = (h) => (h == null ? '—' : (h / 100).toFixed(2));
const count = (n) => (n == null ? '—' : `${n}`);

/* HOW MANY DAYS ARE LEFT, IN WORDS, because the row's own number is a signed
   integer and "minus thirty-one days left" is not something anybody says. */
const whenClosing = (d) => {
  if (d == null) return 'no date this can read';
  if (d < 0) return `closed ${Math.abs(d)} ${Math.abs(d) === 1 ? 'day' : 'days'} ago`;
  if (d === 0) return 'closes today';
  return `closes in ${d} ${d === 1 ? 'day' : 'days'}`;
};

const POLICY_LABEL = { none: 'nothing', full: 'in full', capped: 'to a cap' };

export default function RetainerBurn({ mode = 'demo' }) {
  const { state, patch, reset, status, restored, pack } = useRemembered('retainer-burn', 1, SAMPLE, mode);
  const [busy, setBusy] = useState(false);
  const r = useMemo(() => computeRetainerBurn(state), [state]);
  const t = r.totals;

  /* THE EDIT TABLES ARE DRIVEN OFF `state` AND NOT OFF THE COMPUTED ROWS,
     because the computed rows are SORTED by days left — so an index taken from
     them would write a keystroke into whichever retainer happened to be that
     far down the list. The read-only tables above them use the sorted rows,
     which is the whole point of them; these address the array being patched. */
  const editable = state.retainers || [];

  /* THE ROLLOVER RULE CYCLES THROUGH THE THREE THE ENGINE KNOWS, on
     provider-split's pattern. A text box here would let somebody type a fourth
     rule the engine would then have to refuse — it does refuse it, and being
     able to reach that state by typing is not a feature. */
  const cyclePolicy = (i) => patch((n) => {
    const at = ROLLOVER_POLICIES.indexOf(n.retainers[i].rolloverPolicy);
    n.retainers[i].rolloverPolicy = ROLLOVER_POLICIES[(at + 1) % ROLLOVER_POLICIES.length];
  });

  const doExport = async () => {
    setBusy(true);
    try {
      await exportRows('retainer-burn.xlsx', 'Retainers',
        r.rows.map((x) => ({
          Client: x.ref,
          Period_start: x.periodStart || '',
          Period_end: x.periodEnd || '',
          Days_left: x.daysLeft == null ? '' : x.daysLeft,
          Fee: x.fee == null ? '' : Number((x.fee / 100).toFixed(2)),
          Hours_included: x.included == null ? '' : Number((x.included / 100).toFixed(2)),
          Carried_in: Number((x.carriedIn / 100).toFixed(2)),
          Hours_available: Number((x.available / 100).toFixed(2)),
          Hours_used: Number((x.used / 100).toFixed(2)),
          Hours_unused: Number((x.unused / 100).toFixed(2)),
          Rollover_rule: x.policy || '',
          Rollover_cap: x.cap == null ? '' : Number((x.cap / 100).toFixed(2)),
          Carried_forward: x.carryForward == null ? '' : Number((x.carryForward / 100).toFixed(2)),
          Hours_expiring: x.expiring == null ? '' : Number((x.expiring / 100).toFixed(2)),
          Value_expiring: x.expiringValue == null ? '' : Number((x.expiringValue / 100).toFixed(2)),
          Bought_at_per_hour: x.includedRate == null ? '' : Number((x.includedRate / 100).toFixed(2)),
          Came_to_per_hour: x.effectiveRate == null ? '' : Number((x.effectiveRate / 100).toFixed(2)),
          Hours_over: Number((x.over / 100).toFixed(2)),
          Overage_rate: x.overageRate == null ? '' : Number((x.overageRate / 100).toFixed(2)),
          Overage_due: x.overageDue == null ? '' : Number((x.overageDue / 100).toFixed(2)),
        })).concat([{}, {
          Client: 'Bought, in hours',
          Hours_available: Number((t.hoursAvailableHundredths / 100).toFixed(2)),
        }, {
          Client: 'Used',
          Hours_used: Number((t.hoursUsedHundredths / 100).toFixed(2)),
        }, {
          Client: `Expiring at the close — on ${t.expiringOn} retainer${t.expiringOn === 1 ? '' : 's'}`,
          Hours_expiring: Number((t.expiringHundredths / 100).toFixed(2)),
          Value_expiring: Number((t.expiringValueCents / 100).toFixed(2)),
        }, {
          Client: 'Already gone — periods that have closed',
          Hours_expiring: Number((t.expiredHundredths / 100).toFixed(2)),
          Value_expiring: Number((t.expiredValueCents / 100).toFixed(2)),
        }, {
          Client: 'The fee bought hours at',
          Bought_at_per_hour: t.includedRateCents == null ? '' : Number((t.includedRateCents / 100).toFixed(2)),
          Came_to_per_hour: t.effectiveRateCents == null ? '' : Number((t.effectiveRateCents / 100).toFixed(2)),
        }, {
          Client: 'Billable overage',
          Overage_due: Number((t.overageDueCents / 100).toFixed(2)),
        }]),
        [24, 13, 13, 11, 12, 15, 12, 16, 12, 14, 14, 13, 16, 15, 15, 19, 18, 11, 13, 12]);
    } finally { setBusy(false); }
  };

  return (
    <div style={pageFor('retainer-burn')} data-demo="retainer-burn">
      <ToolHeader
        toolId="retainer-burn" house={HOUSE} occasion="six client retainers, one closing tonight" name="Retainer Burn"
        status={status} restored={restored} pack={pack}
        remembers={REMEMBERS}
      >
        A retainer is a price and a rule. The price is on the invoice; the rule is the paragraph in
        your engagement letter that says what happens to the hours nobody used — carried forward in
        full, carried up to a cap, or gone at the close. Nothing you own applies that rule, so the
        hours a client already paid for disappear quietly and nobody looks until after the period
        has ended. Here is what expires and when, with the money beside it, and what a fixed fee
        actually came to an hour once the work was done. Nothing you type leaves this page.
      </ToolHeader>

      <Readout items={[
        /* THE LEAD IS THE ONE FIGURE SOMEBODY CAN ACT ON THIS WEEK, and it is
           the only toned item on this strip. A warning everything wears is a
           warning nothing wears — the twelfth tool on this shelf came back with
           three of four figures in the caution color, which reads as
           decoration. What has already gone cannot be acted on, the two rates
           are arithmetic rather than a verdict, and the overage figure is a
           quantity of hours. None of them is a thing to do today. */
        { label: 'Paid for, unused, and gone at the close', value: money(t.expiringValueCents),
          tone: t.expiringHundredths > 0 ? 'warn' : undefined,
          note: t.expiringOn === 0
            ? `nothing is due to expire on any of the ${t.retainers} retainers`
            : `${hrs(t.expiringHundredths)} hours on ${t.expiringOn} of ${t.retainers} retainers, the soonest ${whenClosing(t.soonestDaysLeft)}` },
        { label: 'Already gone', value: money(t.expiredValueCents),
          note: `on ${t.expiredOn} period${t.expiredOn === 1 ? '' : 's'} that has closed` },
        { label: 'The fee bought hours at', value: money(t.includedRateCents),
          note: `an hour, across ${t.priced} of ${t.retainers} retainers` },
        { label: 'They came to', value: money(t.effectiveRateCents),
          note: `${hrs(t.hoursUsedHundredths)} hours used of ${hrs(t.hoursAvailableHundredths)} available` },
        { label: 'Hours over the retainer', value: hrs(t.hoursOverHundredths),
          note: `${hrs(t.unbillableOverHundredths)} of them with no overage rate` },
      ]} />

      <div style={wrap}>
        <Problems heading="Read these before you read a single figure" items={r.problems} />

        {/* THE FIRST FINDING, FIRST ON THE PAGE, because it is the one somebody
            can act on and the one nothing else produces. Every retainer is
            listed, in the engine's own order — fewest days left first, so a
            period that closed a month ago sits above one closing tonight, and
            anything with no readable end date sits at the bottom rather than at
            either extreme. */}
        <Panel
          title="Which retainers have hours about to disappear"
          note="Sorted by how many days the period has left, fewest first. A closed period sorts above an open one because it has fewer days left than none, and its hours are gone rather than going. A retainer that carries everything forward is still listed, showing nothing expiring — a list that hides rows is a list nobody trusts."
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1000 }}>
              <thead>
                <tr>
                  <th style={th}>Client</th>
                  <th style={thN}>Period ends</th>
                  <th style={thN}>Days left</th>
                  <th style={thN}>Available</th>
                  <th style={thN}>Used</th>
                  <th style={thN}>Unused</th>
                  <th style={th}>Rolls over</th>
                  <th style={thN}>Carried forward</th>
                  <th style={thN}>Expiring</th>
                  <th style={thN}>Value expiring</th>
                </tr>
              </thead>
              <tbody>
                {r.rows.map((x) => {
                  const losing = x.expiring != null && x.expiring > 0;
                  const going = losing && x.periodClosed === false;
                  const gone = losing && x.periodClosed === true;
                  return (
                    <tr key={x.id} style={{ background: gone ? A.badTint : (going ? A.warnTint : 'transparent') }}>
                      <td style={{ ...td, color: T.textSec }}>
                        {x.ref || '—'}
                        <span style={{ display: 'block', fontSize: 10.5, color: T.textMuted, fontFamily: FONT_BODY }}>
                          {gone
                            ? 'those hours are gone, not going'
                            : (going
                                ? 'unused hours end with the period'
                                : (x.expiring == null
                                    ? 'the rollover rule cannot be read'
                                    : (x.over > 0 ? 'over the retainer' : 'nothing expires here')))}
                        </span>
                      </td>
                      <td style={{ ...tdN, color: T.textMuted }}>{x.periodEnd || '—'}</td>
                      {/* DAYS LEFT IS BOLD AND IT IS NOT TONED. It is a
                          DURATION, and the recipe's rule is that a duration, a
                          count or a denominator stays in plain ink while the
                          tone goes on the sum somebody can act on. Toning it
                          would put a third signal on a row the tint and the
                          accent already mark, and would make a number of days
                          compete with the money for the same attention. The
                          weight still says this is the column the list is
                          sorted on. */}
                      <td style={{ ...tdN, fontWeight: 700, color: losing ? T.text : T.textMuted }}>
                        {count(x.daysLeft)}
                      </td>
                      <td style={{ ...tdN, color: T.textMuted }}>{hrs(x.available)}</td>
                      <td style={{ ...tdN, color: T.textMuted }}>{hrs(x.used)}</td>
                      <td style={{ ...tdN, color: T.textMuted }}>{x.unused ? hrs(x.unused) : '—'}</td>
                      <td style={{ ...td, fontSize: 12, color: T.textMuted }}>
                        {x.policy ? POLICY_LABEL[x.policy] : 'not a rule this knows'}
                        {x.policy === 'capped' && x.capSet ? ` of ${hrs(x.cap)}` : ''}
                      </td>
                      <td style={{ ...tdN, color: T.textMuted }}>
                        {x.carryForward == null ? '—' : (x.carryForward ? hrs(x.carryForward) : '—')}
                      </td>
                      <td style={{ ...tdN, color: T.textMuted }}>{losing ? hrs(x.expiring) : '—'}</td>
                      {/* THE ACCENT SITS ON THE FIGURE THIS TOOL IS ABOUT, AND
                          ONLY WHERE IT MEANS SOMETHING. The thirteenth tool on
                          this shelf came back with every figure of an
                          intermediate column in the accent and the answer beside
                          it in plain ink — a color every cell carries
                          distinguishes no cell. It goes on the rows still to
                          lose the money and NOT on the row that already lost it,
                          because the accent says "act on this" and there is
                          nothing left to do about a period that closed. */}
                      <td style={{ ...tdN, fontWeight: losing ? 700 : 400, color: going ? A.brass : T.textMuted }}>
                        {losing ? money(x.expiringValue) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p style={{ margin: '12px 0 0', fontSize: 12.5, color: T.textMuted, lineHeight: 1.6 }}>
            {t.expiringHundredths > 0
              ? `${money(t.expiringValueCents)} of work is due to disappear when these periods close, across ${hrs(t.expiringHundredths)} hours your clients have already paid for.`
              : 'Nothing on this ledger is due to expire at the close of its period.'}{' '}
            That is your own rollover rule applied to your own hours, and nothing else you have
            applies it: time tracking knows the hours and your accounting knows the fee, and neither
            one has ever read the paragraph that says which hours survive the month. This page has
            no view on whether the rule is a good one, whether to warn the client, or what to do with
            the time before it goes.
          </p>
        </Panel>

        {/* THE SECOND FINDING. It is about the PRICE rather than about the
            hours, which is why it gets its own panel: the fee never moves and
            the rate under it moves every period, and no statement anywhere puts
            those two figures next to each other. */}
        <Panel
          title="The fee is fixed and the hourly rate is not"
          note="Bought at is the fee divided by the hours it includes. Came to is the same fee divided by the hours actually used. Nothing here is a target and nothing here is a verdict: it is your own fee against your own time record, and the two figures differ because the hours moved and the invoice did not."
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 940 }}>
              <thead>
                <tr>
                  <th style={th}>Client</th>
                  <th style={thN}>Fee for the period</th>
                  <th style={thN}>Hours it buys</th>
                  <th style={thN}>Bought at</th>
                  <th style={thN}>Hours used</th>
                  <th style={thN}>Came to</th>
                  <th style={thN}>Hours over</th>
                  <th style={thN}>Overage due</th>
                </tr>
              </thead>
              <tbody>
                {r.rows.map((x) => (
                  <tr key={x.id} style={{ background: x.unbillableOver ? A.badTint : 'transparent' }}>
                    <td style={{ ...td, color: T.textSec }}>{x.ref || '—'}</td>
                    <td style={{ ...tdN, color: T.textMuted }}>{money(x.fee)}</td>
                    <td style={{ ...tdN, color: T.textMuted }}>{hrs(x.included)}</td>
                    <td style={{ ...tdN, color: T.textMuted }}>{money(x.includedRate)}</td>
                    <td style={{ ...tdN, color: T.textMuted }}>{hrs(x.used)}</td>
                    {/* THE FIGURE THIS PANEL EXISTS TO SHOW, IN WEIGHT AND NOT
                        IN COLOR. Every rate here differs from the one above it
                        and that is the point, so a tone on the ones that differ
                        would be a tone on all of them — and a color every cell
                        carries distinguishes no cell. It is also the wrong
                        signal: a rate above the one you sold and a rate below it
                        are opposite outcomes, and this page says out loud that
                        it takes no view on either. */}
                    <td style={{ ...tdN, fontWeight: 700, color: T.text }}>{money(x.effectiveRate)}</td>
                    <td style={{ ...tdN, fontWeight: x.over ? 700 : 400, color: T.textMuted }}>
                      {x.over ? hrs(x.over) : '—'}
                    </td>
                    <td style={tdN}>
                      {x.overageDue == null ? (
                        <>
                          <span style={{ color: T.textMuted }}>—</span>
                          <span style={{ display: 'block', fontSize: 10.5, color: T.textMuted, fontFamily: FONT_BODY }}>
                            not charged
                          </span>
                        </>
                      ) : (
                        /* A DASH RATHER THAN $0.00 WHERE NOTHING IS OVER, and
                           the tile is why. Four of the six rows here have an
                           overage rate and no overage, so the column came back
                           as a run of $0.00 saying nothing while the two
                           figures that matter sat in it. The hours-over cell
                           beside it already reads as a dash on exactly those
                           rows, so this is the same claim in the same place
                           rather than a figure the reader has to discount. */
                        <span style={{ color: T.textMuted }}>{x.over ? money(x.overageDue) : '—'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ margin: '10px 0 0', fontSize: 12.5, color: T.textMuted, lineHeight: 1.6 }}>
            Across the whole ledger the fee bought hours at {money(t.includedRateCents)} and the work
            came to {money(t.effectiveRateCents)} an hour, on {hrs(t.hoursUsedHundredths)} hours used
            against {hrs(t.hoursAvailableHundredths)} available. Neither figure is a rate you should
            charge. A retainer that runs light reads high here and one that overruns reads low, and
            which of those is a problem is a question about the client and the agreement rather than
            about the arithmetic.
          </p>
        </Panel>

        {/* ENTRY IS TWO TABLES AND THE SEAM IS THE DOCUMENT'S OWN. A retainer
            ledger is opened twice by two different people: what the client
            bought is copied off the engagement letter once and barely touched
            again, and what they used is written up every period. One table of
            eleven columns would have been the wider-than-its-panel failure the
            recipe records, and its answer is to cut a wide table where the
            document is already cut rather than to narrow the cells. Every width
            below was MEASURED against the longest value a real ledger carries,
            with an absurd value proving the measurement could report a clip. */}
        <Panel
          title="What the client bought"
          note="The period, the fee, and the hours the fee includes. Hours are in decimals the way a time record keeps them, so six minutes is 0.10. Leave a fee or an hours-included box empty rather than typing a nought — an empty box is a figure nobody entered, and a nought is a real arrangement that says otherwise."
          right={<Btn small onClick={() => patch((s) => { s.retainers.push({ id: uid('r'), ref: 'New client', periodStart: '', periodEnd: '', retainerFeeCents: null, hoursIncludedHundredths: null, hoursUsedHundredths: 0, carriedInHundredths: 0, rolloverPolicy: 'none', rolloverCapHundredths: null, overageRateCents: null }); })}>Add a retainer</Btn>}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 880 }}>
              <thead>
                <tr>
                  <th style={th}>Client</th>
                  <th style={thN}>Period starts</th>
                  <th style={thN}>Period ends</th>
                  <th style={thN}>Fee</th>
                  <th style={thN}>Hours included</th>
                  <th style={thN}>Carried in</th>
                  <th style={th} />
                </tr>
              </thead>
              <tbody>
                {editable.map((x, i) => (
                  <tr key={x.id}>
                    {/* 250, MEASURED RATHER THAN GUESSED. The first draw was
                        196 and clipped at about twenty-eight ordinary
                        characters — "Cypress Landing Early Learning" is thirty
                        and is an entirely ordinary way to write a client on an
                        agency's ledger. This holds about thirty-eight, and the
                        table has the room because it is stretched to the panel
                        and its declared widths come to well under that. */}
                    <td style={td}><Cell label={`client on row ${i + 1}`} mono={false} w={250} value={x.ref || ''} onChange={(v) => patch((n) => { n.retainers[i].ref = v; })} /></td>
                    <td style={tdN}><Cell label={`period start for ${x.ref}`} w={116} value={x.periodStart || ''} onChange={(v) => patch((n) => { n.retainers[i].periodStart = v; })} /></td>
                    <td style={tdN}><Cell label={`period end for ${x.ref}`} w={116} value={x.periodEnd || ''} onChange={(v) => patch((n) => { n.retainers[i].periodEnd = v; })} /></td>
                    {/* AN EMPTY FEE BOX STAYS EMPTY. toOptionalNumber returns
                        null for a blank, and reading it as zero would say the
                        client pays nothing for the period — a claim about the
                        agreement — when what actually happened is that nobody
                        typed the figure. */}
                    <td style={tdN}><Cell label={`fee for ${x.ref}`} w={104} value={x.retainerFeeCents == null ? '' : (x.retainerFeeCents / 100).toFixed(2)} onChange={(v) => patch((n) => { const p = toOptionalNumber(v); n.retainers[i].retainerFeeCents = p == null ? null : Math.round(p * 100); })} /></td>
                    {/* HOURS ARE HUNDREDTHS OF AN HOUR AND NOTHING IN THIS
                        ENGINE IS HUNDREDTHS OF A PER CENT — see the units note
                        in src/lib/retainer-burn.js. Every rate here divides by a
                        hundred. */}
                    <td style={tdN}><Cell label={`hours included for ${x.ref}`} w={92} value={x.hoursIncludedHundredths == null ? '' : (x.hoursIncludedHundredths / 100).toFixed(2)} onChange={(v) => patch((n) => { const p = toOptionalNumber(v); n.retainers[i].hoursIncludedHundredths = p == null ? null : Math.round(p * 100); })} /></td>
                    <td style={tdN}><Cell label={`hours carried in for ${x.ref}`} w={92} value={((x.carriedInHundredths || 0) / 100).toFixed(2)} onChange={(v) => patch((n) => { n.retainers[i].carriedInHundredths = toCents(v); })} /></td>
                    <td style={{ ...td, textAlign: 'right' }}><Btn small onClick={() => patch((n) => { n.retainers.splice(i, 1); })}>×</Btn></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel
          title="What they used, and your own rollover rule"
          note="The rule is yours and this applies it rather than proposing one. Press the rule to move it between carrying nothing, carrying everything, and carrying up to a cap. A cap only means something under the capped rule; leave the overage rate empty where you do not charge for hours beyond the retainer."
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 780 }}>
              <thead>
                <tr>
                  <th style={th}>Client</th>
                  <th style={thN}>Hours used</th>
                  <th style={th}>Unused hours carry</th>
                  <th style={thN}>Rollover cap</th>
                  <th style={thN}>Overage rate</th>
                </tr>
              </thead>
              <tbody>
                {editable.map((x, i) => (
                  <tr key={x.id}>
                    <td style={{ ...td, color: T.textSec }}>{x.ref || '—'}</td>
                    <td style={tdN}><Cell label={`hours used on ${x.ref}`} w={92} value={((x.hoursUsedHundredths || 0) / 100).toFixed(2)} onChange={(v) => patch((n) => { n.retainers[i].hoursUsedHundredths = toCents(v); })} /></td>
                    <td style={td}>
                      <Btn small onClick={() => cyclePolicy(i)}>
                        {POLICY_LABEL[x.rolloverPolicy] || 'not a rule this knows'}
                      </Btn>
                    </td>
                    {/* AN EMPTY CAP STAYS EMPTY, and on a capped rule that is a
                        refusal rather than a cap of nothing. A cap of nought is
                        the same arithmetic as carrying nothing, and printing it
                        for a blank would silently turn the strictest rule on for
                        a client whose rule nobody finished writing. */}
                    <td style={tdN}><Cell label={`rollover cap for ${x.ref}`} w={92} value={x.rolloverCapHundredths == null ? '' : (x.rolloverCapHundredths / 100).toFixed(2)} onChange={(v) => patch((n) => { const p = toOptionalNumber(v); n.retainers[i].rolloverCapHundredths = p == null ? null : Math.round(p * 100); })} /></td>
                    <td style={tdN}><Cell label={`overage rate for ${x.ref}`} w={104} value={x.overageRateCents == null ? '' : (x.overageRateCents / 100).toFixed(2)} onChange={(v) => patch((n) => { const p = toOptionalNumber(v); n.retainers[i].overageRateCents = p == null ? null : Math.round(p * 100); })} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* THE REFUSALS ON THE LEFT AND THE LEDGER ON THE RIGHT, on retainage's
            pattern: with a short panel on the left this row would otherwise
            leave about 450px of bare ground beside a tall stack. */}
        <div className="aiq-split" style={{ '--aiq-split': '1.4fr' }}>
          <WontDo items={[
            'It will not suggest a retainer fee. What a month of your attention is worth is your own decision and your market’s, and there is no figure printed here to be measured against.',
            'It will not propose a rollover policy. Whether unused hours survive the month is the term you negotiated, and handing it back as a recommendation would be the one thing that makes this worth less than the engagement letter.',
            'It will not set an overage rate. It applies the one you already agreed, and where you agreed none it says the work is unbillable rather than pricing it for you.',
            'It will not say whether a client is worth keeping. A retainer that runs light and one that overruns both show up here, and which of them is a problem is a question about the relationship.',
            'It will not compare any of this to a published agency figure, a utilization benchmark, or what another shop in town charges.',
            'It will not forecast next period’s usage. It reports the hours already logged against the period already bought, and stops.',
          ]} />

          <div>
            <Panel title="This ledger" right={
              <span style={{ display: 'flex', gap: 8 }}>
                <Btn small onClick={reset}>Reset</Btn>
                <Btn small primary onClick={doExport}>{busy ? 'Building…' : 'Export'}</Btn>
              </span>
            }>
              <p style={{ margin: 0, fontSize: 32, fontWeight: 700, fontFamily: FONT_DATA, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums', color: A.brass }}>
                {money(t.expiringValueCents)}
              </p>
              <p style={{ margin: '6px 0 0', fontSize: 12.5, color: T.textSec, lineHeight: 1.6 }}>
                due to expire across {hrs(t.expiringHundredths)} hours on {t.expiringOn} of{' '}
                {t.retainers} retainers, against {money(t.expiredValueCents)} already gone on{' '}
                {t.expiredOn} closed {t.expiredOn === 1 ? 'period' : 'periods'} and{' '}
                {money(t.overageDueCents)} of billable overage. {hrs(t.carryForwardHundredths)} hours
                survive the close under the rules you wrote.
              </p>
              <div style={{ marginTop: 12, paddingTop: 10, borderTop: `${S.rule} solid ${T.border}`, display: 'grid', gap: 10 }}>
                <Field label="Counted to" w={140} value={state.asOf} onChange={(v) => patch((n) => { n.asOf = v; })} />
              </div>
              <p style={{ margin: '10px 0 0', fontSize: 12, color: T.textMuted, lineHeight: 1.6 }}>
                Move that date forward and every period on this page has fewer days left, and not one
                hour moves between bought, used and expiring. It is data rather than today’s date on
                purpose, so the same ledger gives the same answer twice.
              </p>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}
