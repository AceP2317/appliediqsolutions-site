// ============================================================================
// BOARDING AND GROOMING DAY RATE — Pelican Run Kennels (boarding demo)
//
// WHY THIS IS THE KENNEL'S TOOL AND NOT A PLATFORM'S. Two rules set the price
// of a stay and both were invented by whoever runs the place. Which nights are
// PEAK is a list somebody wrote on the office wall — the four nights around
// Thanksgiving here, the whole week of it two towns over, every summer Friday
// somewhere else. What a SHARED RUN is worth is a second one. Booking software
// holds a calendar; it does not hold the reason a Wednesday in November is
// worth more in this building than a Wednesday in February.
//
// THE FIRST FINDING IS THE ONE THE CALENDAR HIDES. Six nights is six nights on
// a booking sheet, and six nights across a holiday weekend is a different
// price. The sample carries two stays straddling the declared peak dates by
// very different amounts — one with four of its six nights on the list and one
// with two of two — one that runs long enough to cross the peak block with an
// ordinary night on either side of it, and two that sit entirely outside the
// list and are priced as though it did not exist. The gap between what the
// board came to and what the same nights would have come to at the base rate is
// the peak rule in dollars, and nothing else prints it.
//
// THE SECOND IS ABOUT THE ADD-ONS AND IS DELIBERATELY NOT A JUDGMENT ON THEM.
// Baths, nail trims, medication and extra walks are quoted per item, invoiced
// per item, and never totaled against board — so nobody knows what share of
// the week they are. On this sheet they come to just under a fifth of board and
// add-ons together, which is arithmetic on bookings that already happened and
// not a view on whether any of it is priced right.
//
// ⚠ AND NONE OF THE RATES ON THIS SHEET IS ONE OF THE THREE IN
// src/lib/engagement-rates.js. The practice's own hourly, its monthly upkeep
// and its extra-page figure are never published, and `npm run gate` refuses any
// of them near the words this tool's copy is full of. It was checked BEFORE the
// sample was written rather than after, because a rate here runs through the
// island, the hand-worked block in scripts/verify-tools.mjs and every assertion
// in it — moving one is an hour rather than a keystroke. Read that module
// before changing a figure here.
//
// Built by Ian Provencher · AppliedIQ Solutions
// Public demo — the kennel, the animals, the owners, the rates and every date
// are invented. No rate is suggested, no day is named peak, and no real
// business is named.
// ============================================================================

import React, { useMemo, useState } from 'react';
import { computeBoardingRate } from '../../lib/boarding-rate.js';
import { T, A, S, FONT_DATA, FONT_BODY, Panel, Btn, Cell, Field, ToolHeader, Problems, WontDo, useRemembered, toCents, toOptionalNumber, cash, uid, wrap, th, thN, td, tdN, exportRows, pageFor, Readout } from '../kit/shelf.jsx';

const HOUSE = 'Pelican Run Kennels';

/* THE STATUS STRIP READS "remembers your <this>", so this cannot open with a
   determiner of its own — smoke-tools carries an arm for exactly that, added
   after the eleventh tool shipped "remembers your each unit". */
const REMEMBERS = 'bookings, the dates you call peak, and what was added to each stay';

// ============================================================================
// THE SAMPLE SHEET — the same figures scripts/verify-tools.mjs works out by
// hand. One kennel, six cards, and each is a different shape of the same
// question:
//
//   Biscuit + Marlow   two dogs from one house in one run, 24 to 30 November.
//                      Six nights each, FOUR of them on the peak list, with an
//                      ordinary night either side — the stay that crosses the
//                      block in the middle. Ten per cent off the board on both
//                      cards, and the two name each other.
//   Juniper            26 to 28 November. Two nights and BOTH are peak, which
//                      is a completely different proportion from the first two
//                      and the whole argument for splitting the count.
//   Pepper             4 to 6 December. The same two nights a week later, ENTIRELY
//                      OUTSIDE the list, at the base rate — the case the first
//                      finding exists to sit beside.
//   Cinder             21 to 24 November, no peak nights, and a deposit LARGER
//                      than the stay. That card is in credit, which is named
//                      and not judged.
//   Tussock            25 to 29 November. Four peak nights and NO PEAK RATE
//                      entered, so all four fall to the base rate — said out
//                      loud rather than applied quietly.
//
// `asOf` IS DATA AND NOT THE CLOCK. It decides only which stays have already
// gone home, and every figure it touches would otherwise change overnight with
// no gate able to assert anything about one except that it had moved.
// ============================================================================
const SAMPLE = {
  asOf: '2026-12-01',
  /* THE OWNER'S OWN RULE. Four nights around a holiday, written down once. */
  peakDates: ['2026-11-25', '2026-11-26', '2026-11-27', '2026-11-28'],
  bookings: [
    { id: 'b1', ref: 'Biscuit', owner: 'Dana Vestal', checkIn: '2026-11-24', checkOut: '2026-11-30', baseRateCents: 4200, peakRateCents: 6500, sharedWithRef: 'Marlow', siblingDiscountHundredths: 1000, addOns: [{ id: 'a1', name: 'Bath', unitCents: 4500, qty: 1 }, { id: 'a2', name: 'Nail trim', unitCents: 1800, qty: 1 }], depositPaidCents: 10000 },
    { id: 'b2', ref: 'Marlow', owner: 'Dana Vestal', checkIn: '2026-11-24', checkOut: '2026-11-30', baseRateCents: 3400, peakRateCents: 5200, sharedWithRef: 'Biscuit', siblingDiscountHundredths: 1000, addOns: [{ id: 'a3', name: 'Nail trim', unitCents: 1800, qty: 1 }], depositPaidCents: 10000 },
    { id: 'b3', ref: 'Juniper', owner: 'Rob Callis', checkIn: '2026-11-26', checkOut: '2026-11-28', baseRateCents: 4200, peakRateCents: 6500, sharedWithRef: null, siblingDiscountHundredths: null, addOns: [{ id: 'a4', name: 'Medication', unitCents: 1200, qty: 4 }], depositPaidCents: 6500 },
    { id: 'b4', ref: 'Pepper', owner: 'Alma Reyes', checkIn: '2026-12-04', checkOut: '2026-12-06', baseRateCents: 4200, peakRateCents: 6500, sharedWithRef: null, siblingDiscountHundredths: null, addOns: [{ id: 'a5', name: 'Extra walk', unitCents: 1500, qty: 2 }], depositPaidCents: 4000 },
    { id: 'b5', ref: 'Cinder', owner: 'Ward Teague', checkIn: '2026-11-21', checkOut: '2026-11-24', baseRateCents: 3800, peakRateCents: 5800, sharedWithRef: null, siblingDiscountHundredths: null, addOns: [{ id: 'a6', name: 'Bath', unitCents: 4500, qty: 1 }], depositPaidCents: 18000 },
    { id: 'b6', ref: 'Tussock', owner: 'Halsey Bragg', checkIn: '2026-11-25', checkOut: '2026-11-29', baseRateCents: 4600, peakRateCents: null, sharedWithRef: null, siblingDiscountHundredths: null, addOns: [{ id: 'a7', name: 'Extra walk', unitCents: 1500, qty: 4 }], depositPaidCents: 8000 },
  ],
};

/* THE KIT'S cash() WITH ONE THING ADDED, AND THE ADDITION IS THE HONESTY
   CONTRACT: a line this cannot work out must not read as one worth nothing.
   cash(null) is $0.00, which is a figure; an em dash is an absence. */
const money = (c) => (c == null ? '—' : cash(c));
/* A PERCENTAGE OUT OF HUNDREDTHS OF A PER CENT — see the units note in
   src/lib/boarding-rate.js, where the only division by ten thousand lives. */
const pct = (h) => (h == null ? '—' : `${(h / 100).toFixed(2)}%`);
const count = (n) => (n == null ? '—' : `${n}`);
const nightWord = (n) => `${n} ${n === 1 ? 'night' : 'nights'}`;

export default function BoardingRate({ mode = 'demo' }) {
  const { state, patch, reset, status, restored, pack } = useRemembered('boarding-rate', 1, SAMPLE, mode);
  const [busy, setBusy] = useState(false);
  const r = useMemo(() => computeBoardingRate(state), [state]);
  const t = r.totals;

  /* THE EDIT TABLES ARE DRIVEN OFF `state` AND NOT OFF THE COMPUTED ROWS,
     because the computed rows are SORTED by check-out — so an index taken from
     them would write a keystroke into whichever card happened to be that far
     down the rack. The read-only tables above them use the sorted rows, which
     is the whole point of them; these address the array being patched. */
  const editable = state.bookings || [];
  const peakDates = state.peakDates || [];

  /* THE ADD-ONS ARE EDITED AS ONE FLAT LIST AND STORED PER CARD, because that
     is where they belong: a bath is written on the animal's own card. Flattening
     is what lets them be read as a business rather than as six separate
     afterthoughts, which is the second finding. */
  const addOnRows = editable.flatMap((b, bi) =>
    (b.addOns || []).map((a, ai) => ({ b, bi, a, ai })));

  /* MOVING AN ADD-ON TO THE NEXT CARD, on retainer-burn's cycling pattern. A
     text box here would let somebody name a card that is not on the sheet, and
     an add-on belonging to nobody is a shape the engine has no sentence for —
     unlike a shared run, which is named on the card in somebody's handwriting
     and is refused out loud when the other animal is not here. */
  const cycleBooking = (bi, ai) => patch((n) => {
    const [moved] = n.bookings[bi].addOns.splice(ai, 1);
    const to = (bi + 1) % n.bookings.length;
    if (!Array.isArray(n.bookings[to].addOns)) n.bookings[to].addOns = [];
    n.bookings[to].addOns.push(moved);
  });

  const doExport = async () => {
    setBusy(true);
    try {
      await exportRows('boarding-rate.xlsx', 'Bookings',
        r.rows.map((x) => ({
          Booking: x.ref,
          Owner: x.owner || '',
          Check_in: x.checkIn || '',
          Check_out: x.checkOut || '',
          Nights: x.nights == null ? '' : x.nights,
          Peak_nights: x.peakNights,
          Standard_nights: x.standardNights,
          Base_rate: x.base == null ? '' : Number((x.base / 100).toFixed(2)),
          Peak_rate: x.peakRate == null ? '' : Number((x.peakRate / 100).toFixed(2)),
          Peak_board: Number((x.peakBoardCents / 100).toFixed(2)),
          Standard_board: Number((x.standardBoardCents / 100).toFixed(2)),
          Board: Number((x.boardCents / 100).toFixed(2)),
          Board_at_base_rate: Number((x.boardAtBaseCents / 100).toFixed(2)),
          Added_by_the_peak_rule: Number((x.peakUpliftCents / 100).toFixed(2)),
          Add_ons: Number((x.addOnsCents / 100).toFixed(2)),
          Add_on_share_pct: x.addOnShareHundredths == null ? '' : Number((x.addOnShareHundredths / 100).toFixed(2)),
          Shares_run_with: x.sharedWith || '',
          Sibling_discount_pct: x.discountHundredths == null ? '' : Number((x.discountHundredths / 100).toFixed(2)),
          Sibling_discount: Number((x.siblingDiscountCents / 100).toFixed(2)),
          Stay_total: Number((x.stayTotalCents / 100).toFixed(2)),
          Deposit_paid: Number((x.depositPaidCents / 100).toFixed(2)),
          Balance_due: Number((x.balanceDueCents / 100).toFixed(2)),
        })).concat([{}, {
          Booking: 'Nights boarded',
          Nights: t.nights,
          Peak_nights: t.peakNights,
          Standard_nights: t.standardNights,
        }, {
          Booking: 'Board',
          Peak_board: Number((t.peakBoardCents / 100).toFixed(2)),
          Standard_board: Number((t.standardBoardCents / 100).toFixed(2)),
          Board: Number((t.boardCents / 100).toFixed(2)),
        }, {
          Booking: 'What the peak rule added, against your own base rates',
          Board_at_base_rate: Number((t.boardAtBaseCents / 100).toFixed(2)),
          Added_by_the_peak_rule: Number((t.peakUpliftCents / 100).toFixed(2)),
        }, {
          Booking: 'Baths, trims, medication and walks',
          Add_ons: Number((t.addOnsCents / 100).toFixed(2)),
          Add_on_share_pct: t.addOnShareHundredths == null ? '' : Number((t.addOnShareHundredths / 100).toFixed(2)),
        }, {
          Booking: 'What these bookings come to',
          Sibling_discount: Number((t.siblingDiscountCents / 100).toFixed(2)),
          Stay_total: Number((t.stayTotalCents / 100).toFixed(2)),
          Deposit_paid: Number((t.depositPaidCents / 100).toFixed(2)),
          Balance_due: Number((t.balanceDueCents / 100).toFixed(2)),
        }, {
          Booking: `Still owed on ${t.goneHome} animals that have gone home`,
          Balance_due: Number((t.balanceDueGoneCents / 100).toFixed(2)),
        }]),
        [22, 20, 12, 12, 8, 12, 16, 11, 11, 12, 15, 11, 19, 22, 10, 17, 16, 20, 16, 11, 12, 12]);
    } finally { setBusy(false); }
  };

  return (
    <div style={pageFor('boarding-rate')} data-demo="boarding-rate">
      <ToolHeader
        toolId="boarding-rate" house={HOUSE} occasion="six cards over a holiday week" name="Boarding and Grooming Day Rate"
        status={status} restored={restored} pack={pack}
        remembers={REMEMBERS}
      >
        A stay is not priced by its length. It is priced by which of its nights land on the dates you
        decided are peak, and a booking sheet showing dates cannot show you that — six nights over a
        holiday weekend and six nights a fortnight later look identical on a calendar. Here is every
        stay split into peak nights and standard nights with the money each side carries, what the
        peak rule added against your own base rates, and what the baths and trims and medication come
        to beside the board. Nothing you type leaves this page.
      </ToolHeader>

      <Readout items={[
        /* THE LEAD IS THE ANSWER THIS SHEET EXISTS FOR, and it carries no tone.
           THE ONE TONED ITEM IS THE MONEY SOMEBODY HAS TO GO AND GET — a
           warning everything wears is a warning nothing wears, and the twelfth
           tool on this shelf came back with three of four figures in the
           caution color, which reads as decoration. What the peak rule added
           and what the add-ons came to are findings rather than errands, and a
           count of nights is a denominator. None of them is a thing to do
           today. */
        { label: 'What these bookings come to', value: money(t.stayTotalCents),
          note: `${nightWord(t.nights)} across ${t.bookings} cards, before deposits` },
        { label: 'Still owed', value: money(t.balanceDueCents),
          note: `against ${money(t.depositPaidCents)} already taken` },
        { label: 'Owed on animals gone home', value: money(t.balanceDueGoneCents),
          tone: t.balanceDueGoneCents > 0 ? 'warn' : undefined,
          note: `${t.goneHome} of ${t.bookings} have checked out` },
        { label: 'What the peak rule added', value: money(t.peakUpliftCents),
          note: `over ${t.peakNights} of ${t.nights} nights, against your own base rates` },
        { label: 'Baths, trims and medication', value: money(t.addOnsCents),
          note: `${pct(t.addOnShareHundredths)} of board and add-ons together` },
      ]} />

      <div style={wrap}>
        <Problems heading="Read these before you read a single figure" items={r.problems} />

        {/* THE OWNER'S RULE, ABOVE THE PANEL THAT APPLIES IT. It is a short list
            and it governs every figure on this page, so it goes where a reader
            meets it before its effect rather than at the bottom with the rest
            of the entry. */}
        <Panel
          title="The nights you call peak"
          note="Your list, applied exactly as written. A night is counted by the date it starts on, so a stay checking out on a peak morning did not board on that night. Nothing here proposes a date, and nothing removes one that no booking has landed on yet — a peak date with no stay against it is named below rather than tidied away."
          right={<Btn small onClick={() => patch((s) => { if (!Array.isArray(s.peakDates)) s.peakDates = []; s.peakDates.push(''); })}>Add a peak date</Btn>}
        >
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {peakDates.length === 0 && (
              <span style={{ fontSize: 12.5, color: T.textMuted }}>
                No dates are on the list, so every night on this sheet is charged at its base rate.
              </span>
            )}
            {peakDates.map((d, i) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Cell label={`peak date ${i + 1}`} w={116} value={d || ''} onChange={(v) => patch((n) => { n.peakDates[i] = v; })} />
                <Btn small onClick={() => patch((n) => { n.peakDates.splice(i, 1); })}>×</Btn>
              </span>
            ))}
          </div>
        </Panel>

        {/* THE FIRST FINDING, FIRST ON THE PAGE, because it is the one nothing
            else produces. Every card is listed, in the engine's own order —
            soonest check-out first, which is the order a rack is worked in,
            with anything carrying no readable check-out at the bottom rather
            than at either extreme. */}
        <Panel
          title="Which nights are peak, and what they carry"
          note="Sorted by check-out, soonest first, because a bill is made up when the animal goes home. Every card is listed whether or not any of its nights are peak — a list that hides rows is a list nobody trusts, and a stay entirely outside your peak dates is exactly what the ones inside them are being read against."
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 980 }}>
              <thead>
                <tr>
                  <th style={th}>Booking</th>
                  <th style={thN}>In</th>
                  <th style={thN}>Out</th>
                  <th style={thN}>Nights</th>
                  <th style={thN}>Peak</th>
                  <th style={thN}>Standard</th>
                  <th style={thN}>Peak board</th>
                  <th style={thN}>Standard board</th>
                  <th style={thN}>The peak rule added</th>
                </tr>
              </thead>
              <tbody>
                {r.rows.map((x) => {
                  const lifted = x.peakUpliftCents > 0;
                  return (
                    <tr key={x.id} style={{ background: x.peakFellToBase ? A.warnTint : 'transparent' }}>
                      <td style={{ ...td, color: T.textSec }}>
                        {x.ref || '—'}
                        <span style={{ display: 'block', fontSize: 10.5, color: T.textMuted, fontFamily: FONT_BODY }}>
                          {x.peakFellToBase
                            ? 'peak nights, no peak rate entered'
                            : (x.peakNights === 0
                                ? 'no night on your peak list'
                                : (x.peakNights === x.nightsCharged
                                    ? 'every night on your peak list'
                                    : 'part of the stay is peak'))}
                        </span>
                      </td>
                      <td style={{ ...tdN, color: T.textMuted }}>{x.checkIn || '—'}</td>
                      <td style={{ ...tdN, color: T.textMuted }}>{x.checkOut || '—'}</td>
                      {/* NIGHTS IS BOLD AND IT IS NOT TONED. It is a COUNT, and
                          the recipe's rule is that a duration, a count or a
                          denominator stays in plain ink while the tone goes on
                          the sum somebody can act on. The weight still says this
                          is the figure the whole split is taken out of. */}
                      <td style={{ ...tdN, fontWeight: 700, color: T.text }}>{count(x.nights)}</td>
                      <td style={{ ...tdN, color: T.textMuted }}>{x.peakNights || '—'}</td>
                      <td style={{ ...tdN, color: T.textMuted }}>{x.standardNights || '—'}</td>
                      <td style={{ ...tdN, color: T.textMuted }}>
                        {x.peakNights ? money(x.peakBoardCents) : '—'}
                      </td>
                      <td style={{ ...tdN, color: T.textMuted }}>
                        {x.standardNights ? money(x.standardBoardCents) : '—'}
                      </td>
                      {/* THE ACCENT SITS ON THE FIGURE THIS TOOL IS ABOUT, AND
                          ONLY WHERE IT MEANS SOMETHING. A color every cell
                          carries distinguishes no cell — the thirteenth tool on
                          this shelf came back with a whole intermediate column
                          in the accent and its answer beside it in plain ink.

                          AND THE DASH IS NOT THE SAME CLAIM AS THE NOUGHT. A
                          card with no peak night has nothing for the rule to
                          add, and the Peak column beside it already says so, so
                          the dash is the honest mark. A card WITH peak nights
                          and a nought here is the far more interesting answer —
                          the peak rate box was left empty — and printing it as
                          a figure is the only way that row says anything. */}
                      <td style={{ ...tdN, fontWeight: lifted ? 700 : 400, color: lifted ? A.brass : T.textMuted }}>
                        {x.peakNights ? money(x.peakUpliftCents) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p style={{ margin: '12px 0 0', fontSize: 12.5, color: T.textMuted, lineHeight: 1.6 }}>
            {t.peakNights > 0
              ? `${money(t.peakUpliftCents)} of the board on this sheet is your peak rule and nothing else: ${nightWord(t.peakNights)} of ${t.nights} came to ${money(t.peakBoardCents)} where the same nights at your base rates would have come to ${money(t.peakBoardAtBaseCents)}.`
              : 'Not one night on this sheet falls on a date you have called peak, so every one of them is charged at its base rate.'}{' '}
            That is your own list applied to your own dates. This page has no view on which days should
            be on it, on what a peak night is worth, or on whether the stay was priced correctly — it
            reads the rates you already set against the dates the animals were actually here.
          </p>
        </Panel>

        {/* THE SECOND FINDING SHARES A TABLE WITH THE BILL, because that is
            where an add-on has always been invisible: sitting on the same
            invoice as the board and never totaled against it. Putting the two
            columns side by side with the share between them is the whole
            finding, and it needs no panel of its own to make it. */}
        <Panel
          title="What each stay comes to"
          note="Board, then the add-ons beside it with the share they come to, then the sibling discount off a shared run, then the deposit. A stay whose deposit is larger than its total is in credit rather than short, and the balance on that line is below nought because of it."
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1000 }}>
              <thead>
                <tr>
                  <th style={th}>Booking</th>
                  <th style={th}>Owner</th>
                  <th style={thN}>Board</th>
                  <th style={thN}>Add-ons</th>
                  <th style={thN}>Add-on share</th>
                  <th style={thN}>Sibling discount</th>
                  <th style={thN}>Stay total</th>
                  <th style={thN}>Deposit</th>
                  <th style={thN}>Balance</th>
                </tr>
              </thead>
              <tbody>
                {r.rows.map((x) => (
                  <tr key={x.id}>
                    <td style={{ ...td, color: T.textSec }}>{x.ref || '—'}</td>
                    <td style={{ ...td, fontSize: 12, color: T.textMuted }}>{x.owner || '—'}</td>
                    <td style={{ ...tdN, color: T.textMuted }}>{money(x.boardCents)}</td>
                    <td style={{ ...tdN, color: T.textMuted }}>{x.addOnsCents ? money(x.addOnsCents) : '—'}</td>
                    <td style={{ ...tdN, color: T.textMuted }}>{x.addOnsCents ? pct(x.addOnShareHundredths) : '—'}</td>
                    <td style={{ ...tdN, color: T.textMuted }}>
                      {x.siblingDiscountCents ? `−${money(x.siblingDiscountCents)}` : '—'}
                      {x.sharedWith && (
                        <span style={{ display: 'block', fontSize: 10.5, color: T.textMuted, fontFamily: FONT_BODY }}>
                          shares a run with {x.sharedWith}
                        </span>
                      )}
                    </td>
                    {/* THE ANSWER COLUMN, IN WEIGHT AND NOT IN COLOR. Every
                        row has a total and that is the point, so a tone on all
                        of them would distinguish none of them. The accent on
                        this page is spent on the peak rule, which is the thing
                        no other sheet prints. */}
                    <td style={{ ...tdN, fontWeight: 700, color: T.text }}>{money(x.stayTotalCents)}</td>
                    <td style={{ ...tdN, color: T.textMuted }}>{x.depositPaidCents ? money(x.depositPaidCents) : '—'}</td>
                    <td style={tdN}>
                      {/* ⚠️ THE ABSOLUTE VALUE, AND THE MINUS SIGN IS WRITTEN
                          ONCE. cash() formats a negative as -$21.00 already, so
                          prefixing the sign onto it printed −-$21.00 on the one
                          card in credit. Nothing errored; the arithmetic was
                          right; the tile is the only thing that saw it. */}
                      <span style={{ color: T.textMuted }}>
                        {x.inCredit ? `−${money(Math.abs(x.balanceDueCents))}` : money(x.balanceDueCents)}
                      </span>
                      <span style={{ display: 'block', fontSize: 10.5, color: T.textMuted, fontFamily: FONT_BODY }}>
                        {x.inCredit
                          ? 'in credit'
                          : (x.goneHome === true
                              ? 'gone home'
                              : (x.goneHome === false ? 'still with you' : 'no date this can read'))}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ margin: '12px 0 0', fontSize: 12.5, color: T.textMuted, lineHeight: 1.6 }}>
            {t.addOnsCents > 0
              ? `Baths, trims, medication and walks came to ${money(t.addOnsCents)} against ${money(t.boardCents)} of board — ${pct(t.addOnShareHundredths)} of the two together.`
              : 'Nothing has been added to any stay on this sheet.'}{' '}
            They are quoted one at a time and invoiced one at a time, which is how a second line of
            work stays invisible inside the one it was bolted onto. This is what they add up to, and
            it is not a suggestion about what any of them should cost.
          </p>
        </Panel>

        {/* ENTRY IS THREE TABLES AND EVERY SEAM IS THE CARD'S OWN. The top of a
            run card is who the animal is and when it is here; the middle is the
            run and the money taken at the door; the bottom is what was done for
            it while it was here, written up as it happens. One table of
            fourteen columns would have been the wider-than-its-panel failure
            the recipe records, whose answer is to cut a wide table where the
            document is already cut rather than to narrow the cells. Every width
            below was MEASURED against the longest value a real sheet carries,
            with an absurd value proving the measurement could report a clip. */}
        <Panel
          title="The stay"
          note="The animal, the owner, the dates and your two nightly rates. Leave the peak rate empty where you do not charge one — an empty box means those nights fall to the base rate, and this says so out loud on the row rather than quietly pricing them."
          right={<Btn small onClick={() => patch((s) => { s.bookings.push({ id: uid('b'), ref: 'New booking', owner: '', checkIn: '', checkOut: '', baseRateCents: null, peakRateCents: null, sharedWithRef: null, siblingDiscountHundredths: null, addOns: [], depositPaidCents: 0 }); })}>Add a booking</Btn>}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
              <thead>
                <tr>
                  <th style={th}>Booking</th>
                  <th style={th}>Owner</th>
                  <th style={thN}>Checks in</th>
                  <th style={thN}>Checks out</th>
                  <th style={thN}>Base rate</th>
                  <th style={thN}>Peak rate</th>
                  <th style={th} />
                </tr>
              </thead>
              <tbody>
                {editable.map((x, i) => (
                  <tr key={x.id}>
                    <td style={td}><Cell label={`booking on row ${i + 1}`} mono={false} w={150} value={x.ref || ''} onChange={(v) => patch((n) => { n.bookings[i].ref = v; })} /></td>
                    <td style={td}><Cell label={`owner of ${x.ref}`} mono={false} w={190} value={x.owner || ''} onChange={(v) => patch((n) => { n.bookings[i].owner = v; })} /></td>
                    <td style={tdN}><Cell label={`check-in for ${x.ref}`} w={116} value={x.checkIn || ''} onChange={(v) => patch((n) => { n.bookings[i].checkIn = v; })} /></td>
                    <td style={tdN}><Cell label={`check-out for ${x.ref}`} w={116} value={x.checkOut || ''} onChange={(v) => patch((n) => { n.bookings[i].checkOut = v; })} /></td>
                    {/* AN EMPTY RATE BOX STAYS EMPTY. toOptionalNumber returns
                        null for a blank, and reading it as zero would say the
                        stay was given away — a claim about the arrangement —
                        when what actually happened is that nobody typed it. */}
                    <td style={tdN}><Cell label={`base nightly rate for ${x.ref}`} w={92} value={x.baseRateCents == null ? '' : (x.baseRateCents / 100).toFixed(2)} onChange={(v) => patch((n) => { const p = toOptionalNumber(v); n.bookings[i].baseRateCents = p == null ? null : Math.round(p * 100); })} /></td>
                    <td style={tdN}><Cell label={`peak nightly rate for ${x.ref}`} w={92} value={x.peakRateCents == null ? '' : (x.peakRateCents / 100).toFixed(2)} onChange={(v) => patch((n) => { const p = toOptionalNumber(v); n.bookings[i].peakRateCents = p == null ? null : Math.round(p * 100); })} /></td>
                    <td style={{ ...td, textAlign: 'right' }}><Btn small onClick={() => patch((n) => { n.bookings.splice(i, 1); })}>×</Btn></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel
          title="The run they share, and what was taken at the door"
          note="Type the other animal's name exactly as it appears above — this matches on the name and never on a near miss, because a discount taken off the wrong bill is worse than one nobody applied. A percentage with no name beside it is named below rather than applied to a run of one."
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
              <thead>
                <tr>
                  <th style={th}>Booking</th>
                  {/* THE OWNER SITS BESIDE THE RUN MATE because that is the
                      thing a person checks when they read this row — two
                      animals in one run are almost always one household, and a
                      run mate under a different owner's name is worth seeing.
                      Four columns also left about four hundred pixels of dead
                      panel between the name and the money, which the captured
                      page showed and no gate can. */}
                  <th style={th}>Owner</th>
                  <th style={th}>Shares a run with</th>
                  <th style={thN}>Sibling discount %</th>
                  <th style={thN}>Deposit paid</th>
                </tr>
              </thead>
              <tbody>
                {editable.map((x, i) => (
                  <tr key={x.id}>
                    <td style={{ ...td, color: T.textSec }}>{x.ref || '—'}</td>
                    <td style={{ ...td, fontSize: 12, color: T.textMuted }}>{x.owner || '—'}</td>
                    <td style={td}><Cell label={`run mate for ${x.ref}`} mono={false} w={150} value={x.sharedWithRef || ''} onChange={(v) => patch((n) => { n.bookings[i].sharedWithRef = v === '' ? null : v; })} /></td>
                    {/* AN EMPTY DISCOUNT STAYS EMPTY, and that is not the same
                        claim as nought per cent. Nought is a run shared at full
                        price, which is a real arrangement; a blank is a box
                        nobody filled in. */}
                    <td style={tdN}><Cell label={`sibling discount for ${x.ref}`} w={84} value={x.siblingDiscountHundredths == null ? '' : (x.siblingDiscountHundredths / 100).toFixed(2)} onChange={(v) => patch((n) => { const p = toOptionalNumber(v); n.bookings[i].siblingDiscountHundredths = p == null ? null : Math.round(p * 100); })} /></td>
                    <td style={tdN}><Cell label={`deposit paid on ${x.ref}`} w={104} value={((x.depositPaidCents || 0) / 100).toFixed(2)} onChange={(v) => patch((n) => { n.bookings[i].depositPaidCents = toCents(v); })} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel
          title="What was added"
          note="One line per thing done, priced and counted. Press the booking to move a line to the next card. A price with no count and a count with no price both add nothing and are named below — nothing here is assumed to be one of them."
          right={<Btn small onClick={() => patch((s) => {
            if (!s.bookings.length) return;
            if (!Array.isArray(s.bookings[0].addOns)) s.bookings[0].addOns = [];
            s.bookings[0].addOns.push({ id: uid('a'), name: 'New item', unitCents: null, qty: null });
          })}>Add a line</Btn>}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
              <thead>
                <tr>
                  <th style={th}>Booking</th>
                  <th style={th}>What was done</th>
                  <th style={thN}>Unit price</th>
                  <th style={thN}>How many</th>
                  <th style={thN}>Comes to</th>
                  <th style={th} />
                </tr>
              </thead>
              <tbody>
                {addOnRows.length === 0 && (
                  <tr>
                    <td style={{ ...td, color: T.textMuted }} colSpan={6}>
                      Nothing has been added to any stay on this sheet.
                    </td>
                  </tr>
                )}
                {addOnRows.map(({ b, bi, a, ai }) => (
                  <tr key={a.id || `${bi}-${ai}`}>
                    <td style={td}><Btn small onClick={() => cycleBooking(bi, ai)}>{b.ref || '—'}</Btn></td>
                    <td style={td}><Cell label={`what was added to ${b.ref} on line ${ai + 1}`} mono={false} w={170} value={a.name || ''} onChange={(v) => patch((n) => { n.bookings[bi].addOns[ai].name = v; })} /></td>
                    <td style={tdN}><Cell label={`unit price of ${a.name} on ${b.ref}`} w={92} value={a.unitCents == null ? '' : (a.unitCents / 100).toFixed(2)} onChange={(v) => patch((n) => { const p = toOptionalNumber(v); n.bookings[bi].addOns[ai].unitCents = p == null ? null : Math.round(p * 100); })} /></td>
                    <td style={tdN}><Cell label={`how many of ${a.name} on ${b.ref}`} w={72} value={a.qty == null ? '' : `${a.qty}`} onChange={(v) => patch((n) => { const p = toOptionalNumber(v); n.bookings[bi].addOns[ai].qty = p == null ? null : Math.round(p); })} /></td>
                    <td style={{ ...tdN, color: T.textMuted }}>
                      {a.unitCents != null && a.qty != null ? money(a.unitCents * a.qty) : '—'}
                    </td>
                    <td style={{ ...td, textAlign: 'right' }}><Btn small onClick={() => patch((n) => { n.bookings[bi].addOns.splice(ai, 1); })}>×</Btn></td>
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
            'It will not suggest a nightly rate. What a night in your building is worth is your own decision and your market’s, and there is no figure printed here to be measured against.',
            'It will not tell you which days are peak. That list is the one thing on this page nobody else could have written, and handing it back as a recommendation would make this worth less than the note on your office wall.',
            'It will not propose a sibling discount. It takes off the percentage you already agreed, and where you have agreed none it takes off nothing rather than picking a figure.',
            'It will not price an add-on. A bath costs what you charge for a bath, and this only ever multiplies your price by your count.',
            'It will not compare any of this to a published kennel figure, a regional day rate, or what the place on the highway charges.',
            'It will not say whether you are full. It reads the cards you entered and stops — how many runs you have and what is free next weekend is not on this page.',
          ]} />

          <div>
            <Panel title="This sheet" right={
              <span style={{ display: 'flex', gap: 8 }}>
                <Btn small onClick={reset}>Reset</Btn>
                <Btn small primary onClick={doExport}>{busy ? 'Building…' : 'Export'}</Btn>
              </span>
            }>
              <p style={{ margin: 0, fontSize: 32, fontWeight: 700, fontFamily: FONT_DATA, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums', color: A.brass }}>
                {money(t.peakUpliftCents)}
              </p>
              <p style={{ margin: '6px 0 0', fontSize: 12.5, color: T.textSec, lineHeight: 1.6 }}>
                added by your peak rule across {nightWord(t.peakNights)} of {t.nights}, inside{' '}
                {money(t.stayTotalCents)} of bookings on {t.bookings} cards.{' '}
                {money(t.balanceDueCents)} of it is still owed, {money(t.balanceDueGoneCents)} of that
                on {t.goneHome} {t.goneHome === 1 ? 'animal' : 'animals'} already gone home.
              </p>
              <div style={{ marginTop: 12, paddingTop: 10, borderTop: `${S.rule} solid ${T.border}`, display: 'grid', gap: 10 }}>
                <Field label="Counted to" w={140} value={state.asOf} onChange={(v) => patch((n) => { n.asOf = v; })} />
              </div>
              <p style={{ margin: '10px 0 0', fontSize: 12, color: T.textMuted, lineHeight: 1.6 }}>
                Move that date and the only thing that changes is which stays count as gone home. Not
                one night, rate or total moves with it. It is data rather than today’s date on
                purpose, so the same sheet gives the same answer twice.
              </p>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}
