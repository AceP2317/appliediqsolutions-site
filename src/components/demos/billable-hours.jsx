// ============================================================================
// BILLABLE HOURS REALIZATION — Beacon Row Law (small practice demo)
//
// WHY THIS IS THE PRACTICE'S TOOL AND NOT A PLATFORM'S. Realization is what is
// left of an hour by the time the money arrives, and half of what goes missing
// went missing because somebody DECIDED it should — a partner took time off a
// bill because the matter ran long, because the client was new, because it was
// not chargeable. That decision is a write-off policy and it lives nowhere but
// in the owner's head. Practice-management software knows what was billed,
// accounting software knows what came in, and the judgment that separates the
// two was never keyed anywhere.
//
// THE FIRST FINDING IS THAT THE LEAK HAS TWO HALVES. Money lost at BILLING and
// money lost at COLLECTION arrive as one shortfall on any summary anybody has,
// and they need different conversations — one with whoever wrote the time off,
// one with the client who has not paid. The billing half is also the invisible
// one: an unpaid invoice is a row on an aging report, and work nobody invoiced
// has no row anywhere at all, because a row is created by invoicing.
//
// THE SECOND IS THE ACTIONABLE ONE. Matters carrying logged hours, no invoice
// and no write-off reason, sorted by how long since anybody touched them. The
// sample carries two at very different ages — 166 days and 34 — one matter
// written down in full WITH a reason recorded, which is a decision somebody
// already took and is deliberately not on the list, and one live matter with no
// last-activity date at all, which is not a fault.
//
// Built by Ian Provencher · AppliedIQ Solutions
// Public demo — the practice, the matters, the timekeepers and every date are
// invented. No rate is suggested and no real business is named.
// ============================================================================

import React, { useMemo, useState } from 'react';
import { computeBillableHours } from '../../lib/billable-hours.js';
import { T, A, S, FONT_DATA, FONT_BODY, Panel, Btn, Cell, Field, ToolHeader, Problems, WontDo, useRemembered, toCents, toOptionalNumber, cash, uid, wrap, th, thN, td, tdN, exportRows, pageFor, Readout } from '../kit/shelf.jsx';

const HOUSE = 'Beacon Row Law';

/* THE STATUS STRIP READS "remembers your <this>", so this cannot open with a
   determiner of its own — smoke-tools carries an arm for exactly that, added
   after the eleventh tool shipped "remembers your each unit". */
const REMEMBERS = 'matters, the hours logged against each one, and what was invoiced and collected';

// ============================================================================
// THE SAMPLE SHEET — the same figures scripts/verify-tools.mjs works out by
// hand. One small practice, seven matters, four timekeepers, and each matter is
// a different shape of the same answer:
//
//   Hollis estate            18.40 hours at $300, all billed, all collected.
//                            THE CASE THAT WORKED — 100% on every ratio, and it
//                            is deliberately not a finding anywhere.
//   Ferry Point rezoning     26.50 worked, 22.00 billed, "over budget" written
//                            against it. $1,350.00 LOST AT BILLING, with a
//                            reason — a decision somebody took, so it is not on
//                            the unbilled list.
//   Boatyard lease dispute   41.20 hours billed in full at $250 and $4,120.00 of
//                            the invoice never paid. LOST AT COLLECTION, which
//                            is the half a receivables report can already see.
//   Tern Street Goods        8.60 hours at $175, never invoiced, no reason, and
//                            nothing done on it for 166 days. THE HEADLINE.
//   Slack Tide Electric      3.40 hours, never invoiced, quiet 34 days. Past by
//                            a very different amount from the first, which is
//                            the whole argument for sorting by it.
//   Harbour Market           billed in full, $1,125.00 still outstanding, and NO
//                            LAST-ACTIVITY DATE — a live file nobody has dated,
//                            which is not an error and sorts to the end.
//   Slipway Smoke            paralegal time at $120, 3.60 hours off the bill as
//                            a courtesy. A write-down with a reason.
//
// `asOf` IS DATA AND NOT THE CLOCK. Every age here would otherwise grow by a day
// every night, and no gate could assert anything about one except that it had
// changed.
// ============================================================================
const SAMPLE = {
  asOf: '2026-08-31',
  matters: [
    { id: 'm1', ref: 'Hollis estate administration', timekeeper: 'A. Rowe', hoursWorkedHundredths: 1840, hoursBilledHundredths: 1840, standardRateCents: 30000, billedCents: 552000, collectedCents: 552000, writeOffReason: '', lastActivityOn: '2026-08-24' },
    { id: 'm2', ref: 'Ferry Point rezoning', timekeeper: 'A. Rowe', hoursWorkedHundredths: 2650, hoursBilledHundredths: 2200, standardRateCents: 30000, billedCents: 660000, collectedCents: 660000, writeOffReason: 'over budget', lastActivityOn: '2026-08-19' },
    { id: 'm3', ref: 'Marker Nine Boatyard lease dispute', timekeeper: 'D. Vance', hoursWorkedHundredths: 4120, hoursBilledHundredths: 4120, standardRateCents: 25000, billedCents: 1030000, collectedCents: 618000, writeOffReason: '', lastActivityOn: '2026-05-06' },
    { id: 'm4', ref: 'Tern Street Goods incorporation', timekeeper: 'M. Keel', hoursWorkedHundredths: 860, hoursBilledHundredths: 0, standardRateCents: 17500, billedCents: 0, collectedCents: 0, writeOffReason: '', lastActivityOn: '2026-03-18' },
    { id: 'm5', ref: 'Slack Tide Electric contract review', timekeeper: 'M. Keel', hoursWorkedHundredths: 340, hoursBilledHundredths: 0, standardRateCents: 17500, billedCents: 0, collectedCents: 0, writeOffReason: '', lastActivityOn: '2026-07-28' },
    { id: 'm6', ref: 'Harbour Market lease renewal', timekeeper: 'D. Vance', hoursWorkedHundredths: 1250, hoursBilledHundredths: 1250, standardRateCents: 25000, billedCents: 312500, collectedCents: 200000, writeOffReason: '', lastActivityOn: null },
    { id: 'm7', ref: 'Slipway Smoke trademark filing', timekeeper: 'S. Pell', hoursWorkedHundredths: 1560, hoursBilledHundredths: 1200, standardRateCents: 12000, billedCents: 144000, collectedCents: 144000, writeOffReason: 'courtesy', lastActivityOn: '2026-08-11' },
  ],
};

/* THE KIT'S cash() WITH ONE THING ADDED, AND THE ADDITION IS THE HONESTY
   CONTRACT: a matter this cannot work out must not read as one worth nothing.
   cash(null) is $0.00, which is a figure; an em dash is an absence. */
const money = (c) => (c == null ? '—' : cash(c));
const count = (n) => (n == null ? '—' : `${n}`);
/* HOURS OUT OF HUNDREDTHS OF AN HOUR, and null stays null. A time record is
   kept in tenths, so two decimal places is how a timekeeper reads one back. */
const hrs = (h) => (h == null ? '—' : (h / 100).toFixed(2));
/* A REALIZATION OUT OF HUNDREDTHS OF A PER CENT. Null is an undefined ratio —
   nothing to take a share of — which is not the same claim as nothing
   realized, and the two must never print the same character. */
const pct = (h) => (h == null ? '—' : `${(h / 100).toFixed(2)}%`);

export default function BillableHours({ mode = 'demo' }) {
  const { state, patch, reset, status, restored, pack } = useRemembered('billable-hours', 1, SAMPLE, mode);
  const [busy, setBusy] = useState(false);
  const r = useMemo(() => computeBillableHours(state), [state]);
  const t = r.totals;

  /* THE EDIT TABLES ARE DRIVEN OFF `state` AND NOT OFF THE COMPUTED ROWS,
     because the computed rows are SORTED by days since last activity — so an
     index taken from them would write a keystroke into whichever matter
     happened to be that far down the list. The read-only tables above them use
     the sorted rows, which is the whole point of them; these address the array
     being patched. */
  const editable = state.matters || [];

  const doExport = async () => {
    setBusy(true);
    try {
      await exportRows('billable-hours.xlsx', 'Realization',
        r.rows.map((x) => ({
          Matter: x.ref,
          Timekeeper: x.timekeeper || '',
          Hours_worked: Number((x.worked / 100).toFixed(2)),
          Hours_billed: Number((x.billedHours / 100).toFixed(2)),
          Hours_not_billed: Number((x.hoursNotBilled / 100).toFixed(2)),
          Standard_rate: x.rate == null ? '' : Number((x.rate / 100).toFixed(2)),
          Worth_at_standard: x.worth == null ? '' : Number((x.worth / 100).toFixed(2)),
          Invoiced: Number((x.billed / 100).toFixed(2)),
          Written_down: x.writtenDown == null || x.writtenDown === 0 ? '' : Number((x.writtenDown / 100).toFixed(2)),
          Billed_over_standard: x.overStandard == null || x.overStandard === 0 ? '' : Number((x.overStandard / 100).toFixed(2)),
          Collected: Number((x.collected / 100).toFixed(2)),
          Not_collected: x.notCollected === 0 ? '' : Number((x.notCollected / 100).toFixed(2)),
          Why_time_came_off: x.writeOffReason || '',
          Billing_realization: x.billingRealizationHundredths == null ? '' : Number((x.billingRealizationHundredths / 100).toFixed(2)),
          Collection_realization: x.collectionRealizationHundredths == null ? '' : Number((x.collectionRealizationHundredths / 100).toFixed(2)),
          Overall_realization: x.overallRealizationHundredths == null ? '' : Number((x.overallRealizationHundredths / 100).toFixed(2)),
          Last_activity: x.lastActivityOn || (x.live ? 'still live' : ''),
          Days_quiet: x.daysSinceActivity == null ? '' : x.daysSinceActivity,
        })).concat([{}, {
          Matter: 'Worth at the standard rate',
          Worth_at_standard: Number((t.worth / 100).toFixed(2)),
        }, {
          Matter: 'Lost at billing — never reached an invoice',
          Written_down: Number((t.writtenDown / 100).toFixed(2)),
        }, {
          Matter: 'Lost at collection — invoiced and not paid',
          Not_collected: Number((t.notCollected / 100).toFixed(2)),
        }, {
          Matter: 'Collected',
          Collected: Number((t.collected / 100).toFixed(2)),
        }, {
          Matter: `Worked, never invoiced, no reason — on ${t.unbilled} matter${t.unbilled === 1 ? '' : 's'}`,
          Worth_at_standard: Number((t.unbilledCents / 100).toFixed(2)),
        }]),
        [36, 13, 13, 13, 16, 14, 17, 13, 13, 20, 13, 14, 22, 19, 22, 19, 14, 11]);
    } finally { setBusy(false); }
  };

  return (
    <div style={pageFor('billable-hours')} data-demo="billable-hours">
      <ToolHeader
        toolId="billable-hours" house={HOUSE} occasion="seven matters, two with hours nobody has invoiced" name="Billable Hours Realization"
        status={status} restored={restored} pack={pack}
        remembers={REMEMBERS}
      >
        An hour worked and a dollar collected differ for two unrelated reasons. Some of it came off
        before an invoice was ever raised, because somebody decided it should; the rest was invoiced
        and never paid. Those are different problems and every summary you have shows them as one
        number — and the first half shows up on no receivables report anywhere, because a report has
        a row for every invoice and none at all for the work nobody billed. Here is each half in
        dollars, against the rate you already set, and every matter carrying hours nobody has
        invoiced. Nothing you type leaves this page.
      </ToolHeader>

      <Readout items={[
        /* THE LEAD IS THE ONE FIGURE SOMEBODY CAN ACT ON THIS MORNING, and it
           is the only toned item on this strip. A warning everything wears is a
           warning nothing wears — the twelfth tool on this shelf came back with
           three of four figures in the caution color, which reads as
           decoration. The two halves below are the anatomy of the leak and the
           realization figures are ratios; none of them is a thing to do today. */
        { label: 'Worked, never invoiced, and going quiet', value: money(t.unbilledCents),
          tone: t.unbilled > 0 ? 'warn' : undefined,
          note: t.oldestUnbilledDays == null
            ? `on ${t.unbilled} of ${t.matters} matters`
            : `on ${t.unbilled} of ${t.matters} matters, the oldest quiet ${t.oldestUnbilledDays} days` },
        { label: 'Lost at billing', value: money(t.writtenDown),
          note: 'never reached an invoice' },
        { label: 'Lost at collection', value: money(t.notCollected),
          note: 'invoiced, and not paid' },
        { label: 'Overall realization', value: pct(t.overallRealizationHundredths),
          note: `${money(t.collected)} in against ${money(t.worth)} worked` },
        { label: 'Hours worked and not billed', value: hrs(t.hoursNotBilledHundredths),
          note: `of ${hrs(t.hoursWorkedHundredths)} hours worked` },
      ]} />

      <div style={wrap}>
        <Problems heading="Read these before you read a single figure" items={r.problems} />

        {/* THE SECOND FINDING, FIRST ON THE PAGE, because it is the one
            somebody can act on and the one no report anywhere can produce.
            Every matter is listed, in the engine's own order — longest quiet
            first, and anything with no last-activity date at the end rather
            than at either extreme. */}
        <Panel
          title="Which matters carry hours nobody has invoiced"
          note="Sorted by how long since anybody touched the matter, furthest first. A matter with a write-off reason recorded against it is not on this list — that is a decision somebody already took. A live matter nobody has dated sits at the bottom rather than being left out, because a list that hides rows is a list nobody trusts."
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1000 }}>
              <thead>
                <tr>
                  <th style={th}>Matter</th>
                  <th style={th}>Timekeeper</th>
                  <th style={thN}>Last activity</th>
                  <th style={thN}>Days quiet</th>
                  <th style={thN}>Hours worked</th>
                  <th style={thN}>Hours not billed</th>
                  <th style={thN}>Worth at standard</th>
                  <th style={thN}>Never invoiced</th>
                  <th style={th}>Where it stands</th>
                </tr>
              </thead>
              <tbody>
                {r.rows.map((x) => (
                  <tr key={x.id} style={{ background: x.unbilled ? A.warnTint : 'transparent' }}>
                    <td style={{ ...td, color: T.textSec }}>{x.ref || '—'}</td>
                    <td style={{ ...td, color: T.textMuted }}>{x.timekeeper || 'nobody named'}</td>
                    <td style={{ ...tdN, color: T.textMuted }}>{x.lastActivityOn || '—'}</td>
                    {/* DAYS QUIET IS BOLD AND IT IS NOT TONED. It is a
                        DURATION, and the recipe's rule is that a duration, a
                        count or a denominator stays in plain ink while the tone
                        goes on the sum somebody can act on. The first draw of
                        this page had it in the caution color on the same rows
                        the accent already marks and the row tint already marks,
                        which is three signals saying one thing — and it made
                        the money in the last column compete with a number of
                        days for the same attention. The weight still says this
                        is the column the list is sorted on. */}
                    <td style={{ ...tdN, fontWeight: 700, color: x.unbilled ? T.text : T.textMuted }}>
                      {count(x.daysSinceActivity)}
                    </td>
                    <td style={{ ...tdN, color: T.textMuted }}>{hrs(x.worked)}</td>
                    <td style={{ ...tdN, color: T.textMuted }}>{x.hoursNotBilled ? hrs(x.hoursNotBilled) : '—'}</td>
                    <td style={{ ...tdN, color: T.textMuted }}>{money(x.worth)}</td>
                    {/* THE ACCENT SITS ON THE FIGURE THIS TOOL IS ABOUT, AND ON
                        THE ROWS WHERE IT MEANS SOMETHING. The thirteenth tool on
                        this shelf came back with every figure of an intermediate
                        column in the accent and the answer beside it in plain
                        ink — a color every cell carries distinguishes no cell.
                        Worth at standard is what a reader passes THROUGH; the
                        money nobody has invoiced is what they came for. */}
                    <td style={{ ...tdN, fontWeight: x.unbilled ? 700 : 400, color: x.unbilled ? A.brass : T.textMuted }}>
                      {x.unbilled ? money(x.worth) : '—'}
                    </td>
                    <td style={{ ...td, fontSize: 12, color: T.textMuted }}>
                      {/* A ROW WITH NO HOURS AND NO INVOICE IS NOT A WRITE-OFF,
                          and the first draft of this said it was. `unbilled` is
                          false on it because no hours were worked, so it fell
                          through to the write-off branch and read "written off
                          in full — no reason recorded" on a matter nobody has
                          typed anything into yet. Not-set and zero again. */}
                      {x.unbilled
                        ? (x.daysSinceActivity == null ? 'worked, never invoiced, undated' : 'worked, and never invoiced')
                        : (x.worked === 0 && x.billed === 0
                            ? 'nothing recorded on it yet'
                            : (x.billed === 0
                                ? `written off in full — ${x.writeOffReason || 'no reason recorded'}`
                                : (x.notCollected > 0 ? 'invoiced, and not paid in full' : 'invoiced and collected')))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ margin: '12px 0 0', fontSize: 12.5, color: T.textMuted, lineHeight: 1.6 }}>
            {t.unbilled > 0
              ? `${money(t.unbilledCents)} of work has never reached an invoice with no reason recorded against it, across ${hrs(t.unbilledHoursHundredths)} hours.`
              : 'Every matter here has either been invoiced or has a reason recorded against it.'}{' '}
            That is the comparison nothing else you have can make: a receivables report has a row for
            every invoice you raised and none at all for the one nobody raised, so this work exists
            only as hours on a time record. This page has no view on whether any of it should be
            billed, when to raise the invoice, or what a reasonable write-off looks like. It compares
            the hours you recorded against the rate you already set.
          </p>
        </Panel>

        {/* THE FIRST FINDING. It is about the SHEET rather than about a line,
            which is why it gets its own panel rather than a column: the two
            halves foot to one shortfall and no single row is where that
            shortfall lives. */}
        <Panel
          title="The gap has two halves, and they need different conversations"
          note="What came off before an invoice was raised, and what was invoiced and never paid. Any summary you have adds these together, and one of them is a decision somebody in this office made while the other is a client who has not paid."
        >
          <div style={{ display: 'grid', gap: 1, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', background: T.border, border: `${S.rule} solid ${T.border}`, borderRadius: S.radiusSm, overflow: 'hidden' }}>
            {[
              ['Worth at the standard rate', money(t.worth), `${hrs(t.hoursWorkedHundredths)} hours across ${t.rated} of ${t.matters} matters`],
              ['Lost at billing', money(t.writtenDown), 'taken off before an invoice was raised'],
              ['Lost at collection', money(t.notCollected), 'invoiced, and never paid'],
              ['Collected', money(t.collected), `${pct(t.overallRealizationHundredths)} of what was worked`],
            ].map(([k, v, sub]) => (
              <div key={k} style={{ background: T.surface, padding: '12px 14px' }}>
                <p style={{ margin: 0, fontSize: 11, letterSpacing: 1.1, textTransform: 'uppercase', color: T.textMuted, fontFamily: FONT_BODY }}>{k}</p>
                <p style={{ margin: '3px 0 0', fontFamily: FONT_DATA, fontSize: 22, fontWeight: 700, lineHeight: 1.15, fontVariantNumeric: 'tabular-nums', color: T.text }}>{v}</p>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: T.textMuted, fontFamily: FONT_BODY }}>{sub}</p>
              </div>
            ))}
          </div>
          <p style={{ margin: '12px 0 0', fontSize: 12.5, color: T.textMuted, lineHeight: 1.6 }}>
            Billing realization is {pct(t.billingRealizationHundredths)} — what reached an invoice as
            a share of what the hours were worth. Collection realization is{' '}
            {pct(t.collectionRealizationHundredths)} — what came in as a share of what was invoiced.
            Multiply them and you get the {pct(t.overallRealizationHundredths)} overall. Nothing in
            that row is a target: this page has no view on what any of those three figures ought to
            be, does not know what other practices run at, and would be guessing if it said.
          </p>
        </Panel>

        {/* WHERE EACH MATTER LOST IT, PER MATTER. Read across rather than worked
            out, so a reader can see where a realization figure came from without
            trusting a total. */}
        <Panel
          title="Where each matter went, from worked to collected"
          note="Worth at standard is the hours on your time record at the rate on your rate card, and nothing else. Written down is what never reached the invoice; not collected is what the invoice never brought in. A blank realization is a ratio with nothing to divide by, which is not the same as a realization of nothing."
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1020 }}>
              <thead>
                <tr>
                  <th style={th}>Matter</th>
                  <th style={thN}>Worth at standard</th>
                  <th style={thN}>Invoiced</th>
                  <th style={thN}>Written down</th>
                  <th style={thN}>Collected</th>
                  <th style={thN}>Not collected</th>
                  <th style={thN}>Billing</th>
                  <th style={thN}>Collection</th>
                  <th style={thN}>Overall</th>
                </tr>
              </thead>
              <tbody>
                {r.rows.map((x) => (
                  <tr key={x.id} style={{ background: x.collectedOverBilled || x.billedOverWorked ? A.badTint : 'transparent' }}>
                    <td style={{ ...td, color: T.textSec }}>{x.ref || '—'}</td>
                    <td style={{ ...tdN, color: T.textMuted }}>{money(x.worth)}</td>
                    <td style={{ ...tdN, color: T.textMuted }}>{money(x.billed)}</td>
                    {/* THE SIGN IS SPELLED OUT UNDER THE FIGURE RATHER THAN LEFT
                        AS A MINUS. Written down and billed above the rate card
                        are opposite things, and a reader should never have to
                        read a sign to tell them apart. Neither is toned: this
                        page says out loud that it takes no view on a write-off,
                        and coloring one would be taking that view in a column. */}
                    <td style={tdN}>
                      {x.writtenDownNet == null ? '—' : (
                        <>
                          <span style={{ fontWeight: x.writtenDownNet !== 0 ? 700 : 400, color: T.text }}>
                            {money(Math.abs(x.writtenDownNet))}
                          </span>
                          <span style={{ display: 'block', fontSize: 10.5, color: T.textMuted, fontFamily: FONT_BODY }}>
                            {x.writtenDownNet === 0 ? 'billed at standard' : (x.writtenDownNet > 0 ? 'written down' : 'above standard')}
                          </span>
                        </>
                      )}
                    </td>
                    <td style={{ ...tdN, color: T.textMuted }}>{money(x.collected)}</td>
                    <td style={{ ...tdN, fontWeight: x.notCollected ? 700 : 400 }}>
                      {x.notCollected ? money(x.notCollected) : '—'}
                    </td>
                    <td style={{ ...tdN, color: T.textMuted }}>{pct(x.billingRealizationHundredths)}</td>
                    <td style={{ ...tdN, color: T.textMuted }}>{pct(x.collectionRealizationHundredths)}</td>
                    <td style={tdN}>{pct(x.overallRealizationHundredths)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ margin: '10px 0 0', fontSize: 12, color: T.textMuted, lineHeight: 1.6 }}>
            Two denominators, because the two halves need different things to be true. What the HOURS
            come to needs a time record and nothing else, so it foots across all {t.matters} matters.
            What the work was WORTH needs a rate as well, so it foots across {t.rated}.
          </p>
        </Panel>

        {/* ENTRY IS TWO TABLES AND THE SEAM IS THE DOCUMENT'S OWN. A practice
            keeps two records and they are filled in by two different people at
            two different times: the timekeeper writes the hours as the work
            happens, and whoever does the billing writes what went out and what
            came back. One table of nine columns would have been the
            wider-than-its-panel failure the recipe records, and the recipe's own
            answer is to cut a wide table where the document is already cut
            rather than to narrow the cells. Every width below was MEASURED
            against the longest value a real sheet carries, with an absurd value
            proving the measurement could report a clip at all. */}
        <Panel
          title="What the time record says"
          note="The matter, who worked it, and the hours. Hours are in decimals the way a time record keeps them, so six minutes is 0.10. Leave the rate empty rather than typing a nought — an empty rate is one nobody entered, and a rate of nothing is a matter taken on at no charge."
          right={<Btn small onClick={() => patch((s) => { s.matters.push({ id: uid('m'), ref: 'New matter', timekeeper: '', hoursWorkedHundredths: 0, hoursBilledHundredths: 0, standardRateCents: null, billedCents: 0, collectedCents: 0, writeOffReason: '', lastActivityOn: null }); })}>Add a matter</Btn>}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
              <thead>
                <tr>
                  <th style={th}>Matter</th>
                  <th style={th}>Timekeeper</th>
                  <th style={thN}>Hours worked</th>
                  <th style={thN}>Hours billed</th>
                  <th style={thN}>Standard rate</th>
                  <th style={th} />
                </tr>
              </thead>
              <tbody>
                {editable.map((x, i) => (
                  <tr key={x.id}>
                    {/* 288, MEASURED. "Marker Nine Boatyard lease dispute" is an
                        ordinary way to write one of these and is the longest
                        value on the sample sheet. */}
                    <td style={td}><Cell label={`matter on row ${i + 1}`} mono={false} w={288} value={x.ref || ''} onChange={(v) => patch((n) => { n.matters[i].ref = v; })} /></td>
                    <td style={td}><Cell label={`who worked ${x.ref}`} mono={false} w={132} value={x.timekeeper || ''} onChange={(v) => patch((n) => { n.matters[i].timekeeper = v; })} /></td>
                    {/* HOURS ARE HUNDREDTHS OF AN HOUR, NOT OF A PER CENT — see
                        the units note in src/lib/billable-hours.js. Both kinds
                        live in that engine and the suffix cannot tell them
                        apart, so the noun does. */}
                    <td style={tdN}><Cell label={`hours worked on ${x.ref}`} w={84} value={((x.hoursWorkedHundredths || 0) / 100).toFixed(2)} onChange={(v) => patch((n) => { n.matters[i].hoursWorkedHundredths = toCents(v); })} /></td>
                    <td style={tdN}><Cell label={`hours billed on ${x.ref}`} w={84} value={((x.hoursBilledHundredths || 0) / 100).toFixed(2)} onChange={(v) => patch((n) => { n.matters[i].hoursBilledHundredths = toCents(v); })} /></td>
                    {/* AN EMPTY RATE BOX STAYS EMPTY. toOptionalNumber returns
                        null for a blank, and reading it as zero would print a
                        confident matter worth $0.00 beside a column of real
                        money — and would say the work is worthless when what
                        actually happened is that nobody typed a rate. */}
                    <td style={tdN}><Cell label={`standard rate on ${x.ref}`} w={92} value={x.standardRateCents == null ? '' : (x.standardRateCents / 100).toFixed(2)} onChange={(v) => patch((n) => { const p = toOptionalNumber(v); n.matters[i].standardRateCents = p == null ? null : Math.round(p * 100); })} /></td>
                    <td style={{ ...td, textAlign: 'right' }}><Btn small onClick={() => patch((n) => { n.matters.splice(i, 1); })}>×</Btn></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel
          title="What went out, what came back, and why anything came off"
          note="Leave the last-activity date empty while a matter is live and nobody has dated it. It counts as a matter with no age rather than one touched today, and the table above says which."
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 880 }}>
              <thead>
                <tr>
                  <th style={th}>Matter</th>
                  <th style={thN}>Invoiced</th>
                  <th style={thN}>Collected</th>
                  <th style={th}>Why time came off</th>
                  <th style={thN}>Last activity</th>
                </tr>
              </thead>
              <tbody>
                {editable.map((x, i) => (
                  <tr key={x.id}>
                    <td style={{ ...td, color: T.textSec }}>{x.ref || '—'}</td>
                    <td style={tdN}><Cell label={`invoiced on ${x.ref}`} w={104} value={((x.billedCents || 0) / 100).toFixed(2)} onChange={(v) => patch((n) => { n.matters[i].billedCents = toCents(v); })} /></td>
                    <td style={tdN}><Cell label={`collected on ${x.ref}`} w={104} value={((x.collectedCents || 0) / 100).toFixed(2)} onChange={(v) => patch((n) => { n.matters[i].collectedCents = toCents(v); })} /></td>
                    {/* 210, measured. "not chargeable to the client" is an
                        ordinary way to write one of these; this carries about
                        thirty characters, which covers every reason on the
                        sample sheet with room to spare. */}
                    <td style={td}><Cell label={`why time came off ${x.ref}`} mono={false} w={210} value={x.writeOffReason || ''} onChange={(v) => patch((n) => { n.matters[i].writeOffReason = v; })} /></td>
                    <td style={tdN}>
                      <Cell label={`date ${x.ref} was last worked`} w={116} value={x.lastActivityOn || ''} onChange={(v) => patch((n) => { n.matters[i].lastActivityOn = v || null; })} />
                      {!x.lastActivityOn && (
                        <span style={{ display: 'block', fontSize: 10, color: T.textMuted, fontFamily: FONT_BODY, textAlign: 'right' }}>
                          still live
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* THE REFUSALS ON THE LEFT AND THE SHEET ON THE RIGHT, on retainage's
            pattern: with a short panel on the left this row would otherwise
            leave about 450px of bare ground beside a tall stack. */}
        <div className="aiq-split" style={{ '--aiq-split': '1.4fr' }}>
          <WontDo items={[
            'It will not suggest a billing rate. What you charge an hour is your own decision and your market’s, and there is no rate printed here to be measured against.',
            'It will not propose a target realization figure. A number to aim at would be a claim about what other practices achieve, which this page has no way of knowing and would be guessing at.',
            'It will not tell you which hours to write off. That is the judgment this whole sheet exists to make visible, and handing it back as an instruction would be the one thing that makes the tool worth less than the time record.',
            'It will not compare any of this to a published firm average, a bar association survey, or what another practice in town runs at.',
            'It will not say what a matter should have been worth. It multiplies the hours you recorded by the rate you already set, and stops.',
            'It will not decide whether an invoice is collectable, chase anybody, or take a view on which client to call. It says how long a matter has been quiet; what to do about that is a call about the client and about the relationship.',
          ]} />

          <div>
            <Panel title="This sheet" right={
              <span style={{ display: 'flex', gap: 8 }}>
                <Btn small onClick={reset}>Reset</Btn>
                <Btn small primary onClick={doExport}>{busy ? 'Building…' : 'Export'}</Btn>
              </span>
            }>
              <p style={{ margin: 0, fontSize: 32, fontWeight: 700, fontFamily: FONT_DATA, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums', color: A.brass }}>
                {money(t.unbilledCents)}
              </p>
              <p style={{ margin: '6px 0 0', fontSize: 12.5, color: T.textSec, lineHeight: 1.6 }}>
                worked and never invoiced across {t.unbilled} of {t.matters} matters, against{' '}
                {money(t.writtenDown)} written off with a reason and {money(t.notCollected)} invoiced
                and unpaid. {t.live} of them {t.live === 1 ? 'is' : 'are'} live with no last-activity
                date, so {t.live === 1 ? 'it has' : 'they have'} no age here.
              </p>
              <div style={{ marginTop: 12, paddingTop: 10, borderTop: `${S.rule} solid ${T.border}`, display: 'grid', gap: 10 }}>
                <Field label="Counted to" w={140} value={state.asOf} onChange={(v) => patch((n) => { n.asOf = v; })} />
              </div>
              <p style={{ margin: '10px 0 0', fontSize: 12, color: T.textMuted, lineHeight: 1.6 }}>
                Move that date forward and every matter on this page has been quiet for longer, and
                not one dollar moves. It is data rather than today’s date on purpose, so the same
                sheet gives the same answer twice.
              </p>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}
