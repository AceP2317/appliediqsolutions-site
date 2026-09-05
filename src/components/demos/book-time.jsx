// ============================================================================
// BOOK TIME — Neuse Bend Auto (portfolio demo)
//
// A shop quotes labour out of a flat-rate book: a job is "2.4 hours" whatever
// it actually takes, and the customer is billed those hours at the door rate.
// The tech then takes however long they take. Both numbers are on the same
// repair order and nothing in the world puts them side by side.
//
// TWO QUESTIONS, AND ONLY ONE IS ON THE INVOICE. Did it bill what book says —
// that is money, and every accounting package answers it. Did it TAKE what book
// says — that is the clock, and no financial report has ever printed it. A shop
// can bill exactly to book all month and still lose, because the clock ran long
// on every ticket.
//
// THE SAME SHAPE AS THE STAGING TRIAGE CONSOLE, which is the industrial tool
// three floors up: a total that looks right with the error hiding underneath
// it. That is the hidden-error problem at two very different sizes.
//
// THE MONEY HALF IS NOT REWRITTEN. It is computeRateCard out of src/lib/, the
// same engine behind the marina bill, the commission check and the job quote —
// book hours are the quantity, the door rate is the rate, and what went on the
// ticket is the actual. This tool adds only the half that engine has no concept
// of, which is the clock.
//
// THE HONESTY CONTRACT. The door rate, which book the shop quotes from, and
// what counts as a comeback are the shop's own. There is no target efficiency,
// no industry figure, and nothing compared against what any other shop runs.
// Efficiency is two numbers divided, printed with no opinion about it.
//
// Built by Ian Provencher · AppliedIQ Solutions
// Public demo — the shop, the tickets and the week are invented.
// ============================================================================

import React, { useMemo, useState } from 'react';
import { computeBookTime } from '../../lib/book-time.js';
import { T, A, S, FONT_DATA, Panel, Btn, Cell, Field, ToolHeader, Problems, WontDo, useRemembered, toCents, toHundredths, plain, cash, uid, wrap, th, thN, td, tdN, exportRows, pageFor, Readout } from '../kit/shelf.jsx';

const SHOP = 'Neuse Bend Auto';

// ============================================================================
// THE SAMPLE WEEK — the same figures scripts/verify-tools.mjs works out by
// hand. Hours are hundredths, so 2.4 hours is 240.
//
// THE MONEY IS ALMOST EXACTLY RIGHT AND THE TIME IS NOT, deliberately. The week
// bills $44.00 under book — one discount — while the clock ran an hour and a
// half past it. That combination is the whole reason the tool exists.
// ============================================================================
const SAMPLE = {
  labourRate: 14500,
  jobs: [
    { id: 'j1', ticket: 'RO-2214', vehicle: 'F-150', bookHours: 240, clockHours: 195, billed: 34800, comeback: false },
    { id: 'j2', ticket: 'RO-2215', vehicle: 'Silverado', bookHours: 180, clockHours: 260, billed: 26100, comeback: false },
    { id: 'j3', ticket: 'RO-2216', vehicle: 'Odyssey', bookHours: 320, clockHours: 310, billed: 42000, comeback: false },
    { id: 'j4', ticket: 'RO-2217', vehicle: 'Silverado', bookHours: 0, clockHours: 145, billed: 0, comeback: true },
    { id: 'j5', ticket: 'RO-2218', vehicle: 'Wrangler', bookHours: 110, clockHours: 90, billed: 15950, comeback: false },
  ],
};

/** Hundredths of a percent to something a person reads. */
const pct = (h) => (h == null ? '—' : `${(h / 100).toFixed(2)}%`);
/** Hundredths of an hour to hours, without a trailing .00. */
const hours = (h) => `${(h / 100).toFixed(2).replace(/\.00$/, '')}h`;

export default function BookTime({ mode = 'demo' }) {
  const { state, patch, reset, status, restored, pack } = useRemembered('book-time', 1, SAMPLE, mode);
  const [busy, setBusy] = useState(false);
  const r = useMemo(
    () => computeBookTime({ labourRate: state.labourRate, jobs: state.jobs }),
    [state],
  );

  const doExport = async () => {
    setBusy(true);
    try {
      await exportRows('book-time.xlsx', 'Week',
        r.rows.map((j) => ({
          Ticket: j.ticket,
          Vehicle: j.vehicle,
          Book_hours: j.book / 100,
          Clock_hours: j.clock / 100,
          Should_bill: Number(((j.expected || 0) / 100).toFixed(2)),
          Billed: j.billed == null ? '' : Number((j.billed / 100).toFixed(2)),
          Variance: j.variance == null ? '' : Number((j.variance / 100).toFixed(2)),
          Efficiency: j.efficiency == null ? 'no clock time' : Number((j.efficiency / 100).toFixed(2)),
          Comeback: j.comeback ? 'yes' : '',
        })).concat([{}, {
          Ticket: 'The week',
          Book_hours: r.totals.book / 100,
          Clock_hours: r.totals.clock / 100,
          Should_bill: Number((r.totals.expected / 100).toFixed(2)),
          Billed: Number((r.totals.billed / 100).toFixed(2)),
          Variance: Number((r.totals.variance / 100).toFixed(2)),
          Efficiency: r.totals.efficiency == null ? '' : Number((r.totals.efficiency / 100).toFixed(2)),
        }]),
        [11, 13, 11, 12, 12, 11, 10, 11, 10]);
    } finally { setBusy(false); }
  };

  return (
    <div style={pageFor('book-time')} data-demo="book-time">
      <ToolHeader toolId="book-time" house={SHOP} occasion="sample week" name="Book Time" status={status} restored={restored} pack={pack} remembers="door rate and tickets">
        What the book said the job takes, against what the clock said it took — and what went on the
        ticket, against what book says it should have. The money half is on every accounting package
        you own. The time half is on none of them. Nothing here sets a target you should be hitting,
        and nothing you type leaves this page.
      </ToolHeader>

      <Readout items={[
        { label: 'The shop, against book', value: pct(r.totals.efficiency),
          tone: r.totals.efficiency != null && r.totals.efficiency < 10000 ? 'bad' : 'good',
          note: hours(r.totals.book) + ' booked against ' + hours(r.totals.clock) + ' on the clock' },
        { label: 'Hours past book', value: hours(r.totals.hoursLost),
          note: cash(r.totals.hoursLostAtRate) + ' at your door rate' },
        { label: 'Money against book', value: (r.totals.variance < 0 ? '−' : '') + cash(Math.abs(r.totals.variance)),
          tone: r.totals.variance < 0 ? 'warn' : undefined,
          note: 'billed ' + cash(r.totals.billed) + ' of ' + cash(r.totals.expected) },
        { label: 'Comebacks', value: r.totals.comebacks,
          tone: r.totals.comebacks ? 'warn' : undefined,
          note: r.totals.comebacks ? hours(r.totals.comebackClock) + ' the shop ate' : 'none this week' },
      ]} />

      <div style={wrap}>
        <Problems heading="Look at these before you close the week" items={r.problems} />

        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'minmax(0, 2fr) minmax(270px, 1fr)', alignItems: 'start' }}>
          <div>
            <Panel
              title="The tickets"
              note="Book is what you quoted from. Clock is what the tech actually took. A comeback bills nothing and still eats the clock."
              right={<Btn small onClick={() => patch((s) => { s.jobs.push({ id: uid('j'), ticket: 'RO-0000', vehicle: 'Vehicle', bookHours: 100, clockHours: 100, billed: 0, comeback: false }); })}>Add a ticket</Btn>}
            >
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680 }}>
                  <thead>
                    <tr>
                      <th style={th}>Ticket</th><th style={thN}>Book</th><th style={thN}>Clock</th>
                      <th style={thN}>Against book</th><th style={thN}>Should bill</th>
                      <th style={thN}>Billed</th><th style={thN}>Off by</th><th style={th} />
                    </tr>
                  </thead>
                  <tbody>
                    {r.rows.map((j, i) => (
                      <tr key={j.id} style={{ background: j.comeback ? A.warnTint : (j.short ? A.badTint : 'transparent') }}>
                        <td style={td}>
                          <Cell label={`ticket number for ${j.ticket}`} mono w={82} value={j.ticket} onChange={(v) => patch((n) => { n.jobs[i].ticket = v; })} />
                          <span style={{ display: 'block', fontSize: 10, color: T.textMuted, marginTop: 2 }}>
                            {j.vehicle}{j.comeback && ' · comeback'}
                          </span>
                        </td>
                        <td style={tdN}><Cell label={`book hours on ${j.ticket}`} w={50} value={plain(j.book)} onChange={(v) => patch((n) => { n.jobs[i].bookHours = toHundredths(v); })} /></td>
                        <td style={tdN}><Cell label={`clock hours on ${j.ticket}`} w={50} value={plain(j.clock)} onChange={(v) => patch((n) => { n.jobs[i].clockHours = toHundredths(v); })} /></td>
                        {/* THE COLUMN NO ACCOUNTING PACKAGE HAS. Over 100% means the
                            tech beat the book; under it means the shop paid for time it
                            could not bill. No target is printed beside it — what a good
                            number looks like is the shop's own business. */}
                        <td style={{ ...tdN, fontWeight: 700, color: j.efficiency == null ? T.textMuted : (j.efficiency < 10000 ? A.bad : A.good) }}>
                          {pct(j.efficiency)}
                          {j.efficiency != null && (
                            <span style={{ display: 'block', fontSize: 10, fontWeight: 400, color: T.textMuted }}>
                              {j.hoursLost > 0 ? `${hours(j.hoursLost)} over` : j.hoursLost < 0 ? `${hours(-j.hoursLost)} under` : 'on book'}
                            </span>
                          )}
                        </td>
                        <td style={{ ...tdN, color: T.textMuted }}>{cash(j.expected || 0)}</td>
                        <td style={tdN}><Cell label={`billed on ${j.ticket}`} w={68} value={((j.billed || 0) / 100).toFixed(2)} onChange={(v) => patch((n) => { n.jobs[i].billed = toCents(v); })} /></td>
                        <td style={{ ...tdN, color: j.short ? A.bad : T.textMuted }}>
                          {j.variance == null || j.variance === 0 ? '—' : (j.variance < 0 ? '−' : '+') + cash(Math.abs(j.variance))}
                        </td>
                        <td style={{ ...td, textAlign: 'right' }}>
                          <Btn small onClick={() => patch((n) => { n.jobs[i].comeback = !n.jobs[i].comeback; })}>{j.comeback ? '↩' : 'cb'}</Btn>
                          <Btn small onClick={() => patch((n) => { n.jobs.splice(i, 1); })}>×</Btn>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>

          <div>
            <Panel title="Your door rate" note="One rate, yours. Which flat-rate book you quote from is yours too — this only reads the hours you put in it.">
              <Field label="Per hour" prefix="$" w={96} value={(state.labourRate / 100).toFixed(2)} onChange={(v) => patch((n) => { n.labourRate = toCents(v); })} />
            </Panel>

            <Panel title="This week" right={
              <span style={{ display: 'flex', gap: 8 }}>
                <Btn small onClick={reset}>Reset</Btn>
                <Btn small primary onClick={doExport}>{busy ? 'Building…' : 'Export'}</Btn>
              </span>
            }>
              <p style={{ margin: 0, fontSize: 34, fontWeight: 700, fontFamily: FONT_DATA, lineHeight: 1.1, color: r.totals.efficiency != null && r.totals.efficiency < 10000 ? A.bad : A.good }}>
                {pct(r.totals.efficiency)}
              </p>
              <p style={{ margin: '6px 0 0', fontSize: 12.5, color: T.textSec, lineHeight: 1.6 }}>
                {hours(r.totals.book)} of book against {hours(r.totals.clock)} on the clock, across {r.totals.tickets} {r.totals.tickets === 1 ? 'ticket' : 'tickets'}.
              </p>
              {/* THE TWO HALVES SET AGAINST EACH OTHER IN ONE SENTENCE, which is the
                  finding this tool exists to produce. Read separately they both look
                  fine; the point is that they disagree. */}
              <p style={{ margin: '12px 0 0', fontSize: 12.5, color: T.textSec, lineHeight: 1.6, paddingTop: 10, borderTop: `${S.rule} solid ${T.border}` }}>
                The money is {r.totals.variance === 0 ? 'exactly on book' : `${cash(Math.abs(r.totals.variance))} ${r.totals.variance < 0 ? 'under' : 'over'} book`}.
                {' '}The clock is {r.totals.hoursLost === 0 ? 'exactly on book too' : `${hours(Math.abs(r.totals.hoursLost))} ${r.totals.hoursLost > 0 ? 'past' : 'inside'} it`}
                {r.totals.hoursLost > 0 && <>, which is {cash(r.totals.hoursLostAtRate)} at your door rate on time you have already paid wages for</>}.
              </p>
            </Panel>

            <WontDo items={[
              'It will not tell you what efficiency you should be running. That number is different in every shop and anybody who quotes you one is selling something.',
              'It does not know what any other shop in the county runs, and it will never compare you to them.',
              'It will not tell you which flat-rate book to quote from, or argue with the one you use. It reads the hours you put in it.',
              'It cannot tell whether the clock time is honest. If the hours are not recorded properly the efficiency is wrong, and there is nothing here that can see that.',
            ]} />
          </div>
        </div>
      </div>
    </div>
  );
}
