// ============================================================================
// UNIT TURN AND VACANCY COST — Cutter Point Rentals (portfolio demo)
//
// WHY THIS IS THE LANDLORD'S TOOL AND NOT A PLATFORM'S. Property software has
// the invoice and it has the lease dates, and it never puts them in the same
// sentence — they arrive from two different places and nothing in between has
// an opinion about what they add up to.
//
// THE FIRST FINDING IS THAT THE INVOICE IS THE SMALLER HALF. A unit standing
// empty costs rent every day of it, and that rent is not billed by anybody,
// never appears on a statement and is reconciled against nothing. Nobody is
// hiding it; it simply has no document. The sample is built so the lost rent
// beats the make-ready on four of the five turns, because that is the ordinary
// case and it reads as a surprise the first time.
//
// THE SECOND FINDING IS THE REASON THE TOOL EXISTS. Days to ready is the work —
// scheduling, materials, whoever you called. Days on market is price and
// demand. They are the same currency and they are not the same question, and a
// single "days vacant" figure hides which is which. The lost rent is split
// between them per unit and in total. The sample has one of each: a kitchen
// that took twenty-seven days to make ready, and a unit that was ready in eight
// and has been sitting unlet ever since.
//
// Built by Ian Provencher · AppliedIQ Solutions
// Public demo — the agency, the units, the rents and every date are invented.
// No rent is suggested and no real agency is named.
// ============================================================================

import React, { useMemo, useState } from 'react';
import { computeUnitTurn } from '../../lib/unit-turn.js';
import { T, A, S, FONT_DATA, FONT_BODY, Panel, Btn, Cell, Field, ToolHeader, Problems, WontDo, useRemembered, toCents, cash, uid, wrap, th, thN, td, tdN, exportRows, pageFor, Readout } from '../kit/shelf.jsx';

const AGENCY = 'Cutter Point Rentals';

/* THE STATUS STRIP READS "remembers your <this>", SO THIS CANNOT OPEN WITH A
   DETERMINER. The first draft was "each unit, its rent and …" and the captured
   tile printed "remembers your each unit" in the header of the shipped page.
   smoke-tools carries a doubled-article arm and it refuses a leading "your"
   only, which is why nothing caught this and looking at the tile did. */
const REMEMBERS = 'units, their rents and the make-ready lines against every turn';

// ============================================================================
// THE SAMPLE SHEET — the same figures scripts/verify-tools.mjs works out by
// hand. Five turns, and each one is a different shape of the same answer:
//
//   PL-2261  an ordinary turn — eleven days of work, three weeks on the market
//   PL-2262  the fast one, where the two halves are nearly even
//   PL-2264  the slow make-ready — twenty-seven days waiting on a kitchen, and
//            more than twice as much rent lost to the work as to the market
//   PL-2267  ready in eight days and STILL EMPTY, which is the opposite shape
//            and the one no contractor can fix
//   PL-2270  a quick clean turn, where the invoice is finally the larger half
//
// `asOf` IS DATA AND NOT THE CLOCK. PL-2267 is still empty, so its age would
// otherwise grow by a day every night and no gate could assert anything about
// it except that it changed.
// ============================================================================
const SAMPLE = {
  asOf: '2026-08-31',
  turns: [
    { id: 't1', ref: 'PL-2261', unitName: '4 Bay Street · Upper', monthlyRentCents: 115000, movedOut: '2026-06-30', readyOn: '2026-07-11', reLetOn: '2026-08-01', work: [{ id: 'w1', note: 'Paint throughout', cents: 62000 }, { id: 'w2', note: 'Carpets cleaned', cents: 18500 }, { id: 'w3', note: 'Locks rekeyed', cents: 9500 }] },
    { id: 't2', ref: 'PL-2262', unitName: '4 Bay Street · Lower', monthlyRentCents: 99500, movedOut: '2026-07-05', readyOn: '2026-07-12', reLetOn: '2026-07-20', work: [{ id: 'w4', note: 'Make good and touch up', cents: 31000 }, { id: 'w5', note: 'Clean', cents: 12000 }] },
    { id: 't3', ref: 'PL-2264', unitName: '22 Ferry Lane', monthlyRentCents: 142500, movedOut: '2026-05-28', readyOn: '2026-06-24', reLetOn: '2026-07-06', work: [{ id: 'w6', note: 'Kitchen units replaced', cents: 89000 }, { id: 'w7', note: 'Floor relaid', cents: 45000 }] },
    { id: 't4', ref: 'PL-2267', unitName: '9 Middle Street', monthlyRentCents: 107500, movedOut: '2026-07-18', readyOn: '2026-07-26', reLetOn: null, work: [{ id: 'w8', note: 'Paint and patch', cents: 28000 }, { id: 'w9', note: 'Blinds replaced', cents: 13500 }] },
    { id: 't5', ref: 'PL-2270', unitName: '31 Hancock · Rear', monthlyRentCents: 86000, movedOut: '2026-08-01', readyOn: '2026-08-06', reLetOn: '2026-08-10', work: [{ id: 'w10', note: 'Clean and touch up', cents: 18000 }, { id: 'w11', note: 'Extractor fan', cents: 8800 }] },
  ],
};

/* THE KIT'S cash() WITH ONE THING ADDED, AND THE ADDITION IS THE HONESTY
   CONTRACT: a turn this cannot work out must not read as one that came to
   nothing. cash(null) is $0.00, which is a figure; an em dash is an absence.
   Written once here rather than as a ternary at each of the sixteen call sites
   below, which is where the previous tool's version of this drifted. */
const money = (c) => (c == null ? '—' : cash(c));
const dayCount = (n) => (n == null ? '—' : `${n}`);

export default function UnitTurn({ mode = 'demo' }) {
  const { state, patch, reset, status, restored, pack } = useRemembered('unit-turn', 1, SAMPLE, mode);
  const [busy, setBusy] = useState(false);
  const r = useMemo(() => computeUnitTurn(state), [state]);
  const t = r.totals;

  /* THE MAKE-READY LINES ARE EDITED FLAT AND STORED ON THE TURN. A line belongs
     to the turn it was spent on — that is what puts it against the right unit —
     but they are entered off a stack of invoices in whatever order they came,
     never unit by unit. So the list is flattened for typing and each row
     carries the two indices it writes back through. Built from `state` rather
     than from the computed rows, because those indices have to address the
     array that is actually being patched. */
  const lines = state.turns.flatMap((x, ti) =>
    (x.work || []).map((w, wi) => ({ ...w, ti, wi, turnId: x.id })));

  const doExport = async () => {
    setBusy(true);
    try {
      await exportRows('unit-turn.xlsx', 'Turns',
        r.turns.map((x) => ({
          Ref: x.ref,
          Unit: x.unitName,
          Rent_a_month: x.monthlyRent == null ? '' : Number((x.monthlyRent / 100).toFixed(2)),
          Rent_a_day: x.dailyRent == null ? '' : Number((x.dailyRent / 100).toFixed(2)),
          Moved_out: x.movedOut || '',
          Ready_on: x.readyOn || '',
          Re_let_on: x.reLetOn || (x.stillEmpty ? 'still empty' : ''),
          Days_to_ready: x.daysToReady == null ? '' : x.daysToReady,
          Days_on_market: x.daysOnMarket == null ? '' : x.daysOnMarket,
          Days_vacant: x.daysVacant == null ? '' : x.daysVacant,
          Make_ready: Number((x.makeReady / 100).toFixed(2)),
          Lost_to_the_work: x.lostToWork == null ? '' : Number((x.lostToWork / 100).toFixed(2)),
          Lost_to_the_market: x.lostToMarket == null ? '' : Number((x.lostToMarket / 100).toFixed(2)),
          Rent_lost: x.lostRent == null ? '' : Number((x.lostRent / 100).toFixed(2)),
          What_it_cost: x.trueCost == null ? '' : Number((x.trueCost / 100).toFixed(2)),
        })).concat([{}, {
          Ref: 'Make-ready invoiced',
          Make_ready: Number((t.makeReady / 100).toFixed(2)),
        }, {
          Ref: 'Rent lost while empty — nobody invoices this',
          Rent_lost: Number((t.lostRent / 100).toFixed(2)),
        }, {
          Ref: 'Of that, lost while the work was going on',
          Lost_to_the_work: Number((t.lostToWork / 100).toFixed(2)),
        }, {
          Ref: 'Of that, lost while it sat ready and unlet',
          Lost_to_the_market: Number((t.lostToMarket / 100).toFixed(2)),
        }, {
          Ref: t.growing ? 'What the turns cost — STILL GROWING, a unit is empty' : 'What the turns cost',
          What_it_cost: Number((t.trueCost / 100).toFixed(2)),
        }]),
        [10, 24, 13, 11, 11, 11, 12, 13, 14, 12, 12, 16, 18, 11, 14]);
    } finally { setBusy(false); }
  };

  const bigFigure = {
    margin: '3px 0 0', fontFamily: FONT_DATA, fontSize: 27, fontWeight: 700,
    lineHeight: 1.15, fontVariantNumeric: 'tabular-nums', color: T.text,
  };
  const bigLabel = {
    margin: 0, fontSize: 11, letterSpacing: 1.1, textTransform: 'uppercase',
    color: T.textMuted, fontFamily: FONT_BODY,
  };

  return (
    <div style={pageFor('unit-turn')} data-demo="unit-turn">
      <ToolHeader
        toolId="unit-turn" house={AGENCY} occasion="five turns, one still open" name="Unit Turn and Vacancy Cost"
        status={status} restored={restored} pack={pack}
        remembers={REMEMBERS}
      >
        What a turn between tenants actually cost, which is not what the contractor invoiced. The
        invoice is one half; the rent the unit did not earn while it stood empty is the other, and
        nobody bills you for that one. Both are here, and the empty days are split into the part the
        work took and the part the market took. Nothing you type leaves this page.
      </ToolHeader>

      {/* A RECEIPT FOOT, BECAUSE THAT IS WHAT THE FIRST FINDING IS. Two lines
          and a sum, where one of the two lines is the one everybody quotes and
          the other has no document anywhere. The foot's note is the only place
          on this page that can say the total is still growing, so it says it. */}
      <Readout items={[
        { label: 'Make-ready invoiced', value: money(t.makeReady),
          note: '— what the contractors billed' },
        { label: 'Rent lost while empty', value: money(t.lostRent),
          note: `— over ${t.daysVacant} vacant days, which nobody invoices` },
        { label: 'What those turns cost', value: money(t.trueCost),
          note: t.growing
            ? `${t.stillEmpty === 1 ? 'One unit is' : `${t.stillEmpty} units are`} still empty, so this is a running figure and not a final one.`
            : 'Every turn here is closed, so this figure is final.' },
      ]} />

      <div style={wrap}>
        <Problems heading="Read these before you read a single figure" items={r.problems} />

        {/* THE SECOND FINDING, FIRST ON THE PAGE, because it is the one the
            tool exists for and the one a single days-vacant figure destroys. */}
        <Panel
          title="One half of this is yours to fix"
          note="Days to ready is the work — scheduling, materials, whoever you called. Days on market is price and demand. They cost the same money and they have different answers behind them."
        >
          <div style={{
            display: 'grid', gap: 1, gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
            background: T.border, border: `${S.rule} solid ${T.border}`, borderRadius: S.radiusSm,
            overflow: 'hidden', marginBottom: 14,
          }}>
            <div style={{ background: T.surface, padding: '12px 14px' }}>
              <p style={bigLabel}>Lost while the work was going on</p>
              <p style={bigFigure}>{money(t.lostToWork)}</p>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: T.textMuted, fontFamily: FONT_BODY }}>
                {t.daysToReady} days, across {t.counted} turns
              </p>
            </div>
            <div style={{ background: T.surface, padding: '12px 14px' }}>
              <p style={bigLabel}>Lost while it sat ready and unlet</p>
              <p style={bigFigure}>{money(t.lostToMarket)}</p>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: T.textMuted, fontFamily: FONT_BODY }}>
                {t.daysOnMarket} days, across {t.counted} turns
              </p>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 880 }}>
              <thead>
                <tr>
                  <th style={th}>Unit</th>
                  <th style={thN}>Days to ready</th><th style={thN}>Lost to the work</th>
                  <th style={thN}>Days on market</th><th style={thN}>Lost to the market</th>
                  <th style={thN}>Days vacant</th><th style={thN}>Rent lost</th>
                </tr>
              </thead>
              <tbody>
                {r.turns.map((x) => (
                  <tr key={x.id} style={{ background: x.workable ? (x.stillEmpty ? A.warnTint : 'transparent') : A.badTint }}>
                    <td style={{ ...td, color: T.textSec }}>
                      {x.unitName || '—'}
                      <span style={{ display: 'block', fontSize: 10.5, color: T.textMuted, fontFamily: FONT_BODY }}>
                        {x.ref || 'no reference'}{x.stillEmpty ? ' · still empty' : ''}
                      </span>
                    </td>
                    <td style={tdN}>{dayCount(x.daysToReady)}</td>
                    <td style={{ ...tdN, fontWeight: 700 }}>{money(x.lostToWork)}</td>
                    <td style={tdN}>{dayCount(x.daysOnMarket)}</td>
                    <td style={{ ...tdN, fontWeight: 700 }}>{money(x.lostToMarket)}</td>
                    <td style={{ ...tdN, color: T.textMuted }}>{dayCount(x.daysVacant)}</td>
                    <td style={{ ...tdN, color: T.textSec }}>{money(x.lostRent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p style={{ margin: '12px 0 0', fontSize: 12.5, color: T.textMuted, lineHeight: 1.6 }}>
            A turn taken a week faster is money, and it is money you can go and get: it is a
            scheduling problem with a scheduling answer. A unit sitting ready and unlet is a
            different problem with a different answer, and no amount of chasing a contractor moves
            it. On this sheet {money(t.lostToWork)} of the lost rent went to the first
            and {money(t.lostToMarket)} to the second. Which of those you would rather have back is
            a decision, and it is yours — this page has no view on what a unit should rent for or
            how long a turn ought to take.
          </p>
        </Panel>

        {/* THE FIRST FINDING, PER UNIT. The two columns sit side by side so the
            comparison is read across rather than worked out, and the larger of
            the two is the one carrying weight on every row. */}
        <Panel
          title="What each turn actually cost"
          note="A day's rent is the monthly rent times twelve, divided by 365 — so the same unit is worth the same per day whichever month it happened to stand empty in, and a turn that straddles two months still has one answer."
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 840 }}>
              <thead>
                <tr>
                  <th style={th}>Unit</th>
                  <th style={thN}>Rent a month</th><th style={thN}>Rent a day</th>
                  <th style={thN}>Days vacant</th><th style={thN}>Make-ready invoiced</th>
                  <th style={thN}>Rent lost</th><th style={thN}>What it cost</th>
                </tr>
              </thead>
              <tbody>
                {r.turns.map((x) => {
                  const rentBigger = x.lostRent != null && x.lostRent > x.makeReady;
                  return (
                    <tr key={x.id} style={{ background: x.workable ? 'transparent' : A.badTint }}>
                      <td style={{ ...td, color: T.textSec }}>{x.unitName || '—'}</td>
                      <td style={{ ...tdN, color: T.textMuted }}>{money(x.monthlyRent)}</td>
                      <td style={{ ...tdN, color: T.textMuted }}>{money(x.dailyRent)}</td>
                      <td style={{ ...tdN, color: T.textMuted }}>{dayCount(x.daysVacant)}</td>
                      <td style={{ ...tdN, fontWeight: rentBigger ? 400 : 700 }}>{money(x.makeReady)}</td>
                      <td style={{ ...tdN, fontWeight: rentBigger ? 700 : 400 }}>{money(x.lostRent)}</td>
                      <td style={{ ...tdN, fontWeight: 700, color: x.trueCost == null ? T.textMuted : A.brass }}>
                        {money(x.trueCost)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p style={{ margin: '10px 0 0', fontSize: 12, color: T.textMuted, lineHeight: 1.6 }}>
            The heavier of the two middle figures on each row is the larger half of that turn. It is
            the rent on {r.turns.filter((x) => x.lostRent != null && x.lostRent > x.makeReady).length}{' '}
            of {t.counted}, which is the ordinary answer and the one nobody quotes, because the
            invoice is the only half of it that arrives as a piece of paper.
          </p>
        </Panel>

        <Panel
          title="Every turn on this sheet"
          note="Leave the re-let date empty while a unit is still standing — it is counted to the date on the right and named as a figure that is still growing, rather than being left out."
          right={<Btn small onClick={() => patch((s) => { s.turns.push({ id: uid('t'), ref: '', unitName: 'New unit', monthlyRentCents: 0, movedOut: s.asOf, readyOn: s.asOf, reLetOn: null, work: [] }); })}>Add a turn</Btn>}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1000 }}>
              <thead>
                <tr>
                  <th style={th}>Punch list</th><th style={th}>Unit</th>
                  <th style={thN}>Rent a month</th>
                  <th style={thN}>Moved out</th><th style={thN}>Ready on</th><th style={thN}>Re-let on</th>
                  <th style={thN}>Days vacant</th><th style={th} />
                </tr>
              </thead>
              <tbody>
                {r.turns.map((x, i) => (
                  <tr key={x.id} style={{ background: x.workable ? 'transparent' : A.badTint }}>
                    <td style={td}><Cell label={`reference for turn ${i + 1}`} mono={false} w={92} value={x.ref || ''} onChange={(v) => patch((n) => { n.turns[i].ref = v; })} /></td>
                    {/* 234, MEASURED AND NOT REASONED. Cell is border-box, so
                        its 14px of padding comes out of the width you set: at
                        186 a real address like "221 Chattawka Lane · Rear
                        Cottage" wanted 229px of the 184 it had and lost its
                        last four characters, with nothing anywhere erroring. */}
                    <td style={td}><Cell label={`unit on turn ${i + 1}`} mono={false} w={234} value={x.unitName || ''} onChange={(v) => patch((n) => { n.turns[i].unitName = v; })} /></td>
                    <td style={tdN}><Cell label={`monthly rent for ${x.unitName}`} w={96} value={x.monthlyRent == null ? '' : (x.monthlyRent / 100).toFixed(2)} onChange={(v) => patch((n) => { n.turns[i].monthlyRentCents = toCents(v); })} /></td>
                    <td style={tdN}><Cell label={`date ${x.unitName} was moved out of`} w={112} value={x.movedOut || ''} onChange={(v) => patch((n) => { n.turns[i].movedOut = v; })} /></td>
                    <td style={tdN}><Cell label={`date ${x.unitName} was ready`} w={112} value={x.readyOn || ''} onChange={(v) => patch((n) => { n.turns[i].readyOn = v; })} /></td>
                    {/* AN EMPTY BOX HERE IS A STATE AND NOT A BLANK, so it says
                        so where somebody typing would otherwise wonder whether
                        they had missed a field. */}
                    <td style={tdN}>
                      <Cell label={`date ${x.unitName} was re-let`} w={112} value={x.reLetOn || ''} onChange={(v) => patch((n) => { n.turns[i].reLetOn = v || null; })} />
                      {x.stillEmpty && (
                        <span style={{ display: 'block', fontSize: 10, color: A.warn, fontFamily: FONT_BODY, textAlign: 'right' }}>
                          still empty
                        </span>
                      )}
                    </td>
                    <td style={{ ...tdN, fontWeight: 700 }}>{dayCount(x.daysVacant)}</td>
                    <td style={{ ...td, textAlign: 'right' }}><Btn small onClick={() => patch((n) => { n.turns.splice(i, 1); })}>×</Btn></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="aiq-split" style={{ '--aiq-split': '1.5fr' }}>
          <Panel
            title="The make-ready lines"
            note="Entered off the stack of invoices in whatever order they arrived, and put against the turn they were spent on — which is what lands them on the right unit."
            right={<Btn small onClick={() => patch((s) => { if (s.turns[0]) s.turns[0].work.push({ id: uid('w'), note: 'New line', cents: 0 }); })}>Add a line</Btn>}
          >
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 540 }}>
                <thead>
                  <tr>
                    <th style={th}>On which turn</th><th style={th}>What it was</th>
                    <th style={thN}>Amount</th><th style={th} />
                  </tr>
                </thead>
                <tbody>
                  {lines.map((w) => (
                    <tr key={w.id}>
                      <td style={td}>
                        <select aria-label={`turn the line ${w.note} was spent on`} value={w.turnId}
                          onChange={(e) => patch((n) => {
                            const row = n.turns[w.ti].work.splice(w.wi, 1)[0];
                            const to = n.turns.findIndex((x) => x.id === e.target.value);
                            if (to >= 0) n.turns[to].work.push(row); else n.turns[w.ti].work.splice(w.wi, 0, row);
                          })}
                          style={{ background: T.bg, color: T.text, border: `${S.rule} solid ${T.border}`, borderRadius: S.radiusSm, padding: '5px 6px', fontSize: 12, fontFamily: FONT_BODY, maxWidth: 180 }}>
                          {state.turns.map((x) => <option key={x.id} value={x.id}>{x.unitName || x.ref || 'a turn'}</option>)}
                        </select>
                      </td>
                      {/* 252, measured the same way — "Kitchen units replaced
                          and floor relaid" is an ordinary make-ready line and
                          wanted 247px against the 212 a 214px cell gives. */}
                      <td style={td}><Cell label={`what was done on ${w.turnId}`} mono={false} w={252} value={w.note} onChange={(v) => patch((n) => { n.turns[w.ti].work[w.wi].note = v; })} /></td>
                      <td style={tdN}><Cell label={`amount of ${w.note}`} w={96} value={(w.cents / 100).toFixed(2)} onChange={(v) => patch((n) => { n.turns[w.ti].work[w.wi].cents = toCents(v); })} /></td>
                      <td style={{ ...td, textAlign: 'right' }}><Btn small onClick={() => patch((n) => { n.turns[w.ti].work.splice(w.wi, 1); })}>×</Btn></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <div>
            <Panel title="This sheet" right={
              <span style={{ display: 'flex', gap: 8 }}>
                <Btn small onClick={reset}>Reset</Btn>
                <Btn small primary onClick={doExport}>{busy ? 'Building…' : 'Export'}</Btn>
              </span>
            }>
              <p style={{ margin: 0, fontSize: 32, fontWeight: 700, fontFamily: FONT_DATA, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums', color: A.brass }}>
                {money(t.trueCost)}
              </p>
              <p style={{ margin: '6px 0 0', fontSize: 12.5, color: T.textSec, lineHeight: 1.6 }}>
                across {t.counted} of {t.turns} turns and {t.daysVacant} vacant days
                — {money(t.makeReady)} that was invoiced to you and {money(t.lostRent)} that was not
                invoiced by anybody.
              </p>
              <div style={{ marginTop: 12, paddingTop: 10, borderTop: `${S.rule} solid ${T.border}` }}>
                <Field label="Still-empty units counted to" w={128} value={state.asOf} onChange={(v) => patch((n) => { n.asOf = v; })} />
              </div>
              <p style={{ margin: '10px 0 0', fontSize: 12, color: T.textMuted, lineHeight: 1.6 }}>
                {t.growing
                  ? `${t.stillEmpty === 1 ? 'One unit is' : `${t.stillEmpty} units are`} still standing empty, so every figure on this page is a running one. Move that date forward and it grows.`
                  : 'Every turn on this sheet is closed, so nothing here is still growing.'}
              </p>
            </Panel>

            <WontDo items={[
              'It will not suggest a rent. What a unit lets for is your decision and your market.',
              'It will not tell you how long a turn should take. There is no target here and no standard to be measured against.',
              'It will not tell you whether to re-price a unit. It says how much the empty days cost and which half of them was the work.',
              'It will not compare your vacancy to a published market figure, an average, or the block down the road.',
              'It will not forecast when a unit will let. A unit that is still empty is counted to the date you set and named as still growing.',
            ]} />
          </div>
        </div>
      </div>
    </div>
  );
}
