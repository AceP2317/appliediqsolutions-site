// ============================================================================
// DRAW SCHEDULE TRACKER — Bell Buoy Builders (general contractor demo)
//
// WHY THIS IS THE BUILDER'S TOOL AND NOT A PLATFORM'S. A draw schedule is a
// list of stages with a share of the contract against each one, argued out with
// one lender for one job. There is no industry schedule to default to: a builder
// who frames his own splits the money differently from one who subs it, and a
// lender that inspects four times writes four stages where another writes eight.
// Job-costing software knows what was spent and accounting software knows what
// came in; neither has ever seen the page stapled to the contract.
//
// THE FIRST FINDING IS THE ACTIONABLE ONE. On a financed job the draw is
// REQUESTED, not paid — nothing arrives because a stage was finished, it arrives
// because somebody filled in a form. So a stage finished, signed off and never
// drawn is earned money sitting in the loan, and it shows on no report anywhere,
// because a row is created by requesting a draw and nobody requested one. The
// missing line is the whole problem. The sample carries two of them at very
// different ages — 151 days and 47 — one finished OLDER than both and drawn in
// full, which is the case that worked and is deliberately not on the list, and
// three stages still open, which is not a fault.
//
// THE SECOND FINDING IS THE SHEET ITSELF. Six stages typed as percentages that
// foot to 97%, leaving $12,360 of a $412,000 contract with no stage to draw it
// against. Wrong on no single line, and only visible in the column total.
//
// Built by Ian Provencher · AppliedIQ Solutions
// Public demo — the builder, the job, the stages and every date are invented.
// No schedule is suggested and no real business is named.
// ============================================================================

import React, { useMemo, useState } from 'react';
import { computeDrawSchedule } from '../../lib/draw-schedule.js';
import { T, A, S, FONT_DATA, FONT_BODY, Panel, Btn, Cell, Field, ToolHeader, Problems, WontDo, useRemembered, toCents, toOptionalNumber, cash, uid, wrap, th, thN, td, tdN, exportRows, pageFor, Readout } from '../kit/shelf.jsx';

const HOUSE = 'Bell Buoy Builders';

/* THE STATUS STRIP READS "remembers your <this>", so this cannot open with a
   determiner of its own — smoke-tools carries an arm for exactly that, added
   after the eleventh tool shipped "remembers your each unit". */
const REMEMBERS = 'stages, what the schedule writes against each one, and what has been drawn';

// ============================================================================
// THE SAMPLE SHEET — the same figures scripts/verify-tools.mjs works out by
// hand. One $412,000 house on a construction loan, six stages, and each stage is
// a different shape of the same answer:
//
//   Permits and site       finished 178 days ago and DRAWN IN FULL. The oldest
//                          date on the sheet and the top of the sorted list, and
//                          it is NOT a finding — which is what proves the flag
//                          is "finished and under-drawn" rather than "finished".
//   Footings and foundation finished 151 days ago with $25,440 never drawn. The
//                          headline, and the phone call that should already have
//                          happened.
//   Framing and dry-in     finished 47 days ago with $10,640 never drawn. Past
//                          by a very different amount from the footings, which is
//                          the whole argument for sorting by it.
//   Rough-in               65% done and still open. Under-drawn by $8,204, which
//                          is work in progress rather than a missed draw, so it
//                          is in the money and not in the finding.
//   Drywall and interior   nothing done and $12,000 drawn against it. A real
//                          dispute, printed and not judged.
//   Final and certificate  nothing done, nothing drawn. The rest of the job.
//     of occupancy
//
// AND THE SIX SHARES FOOT TO 97%, not 100%. $12,360 of the contract has no stage
// to draw it against, and no single line of the schedule is wrong.
//
// `asOf` IS DATA AND NOT THE CLOCK. Every age here would otherwise grow by a day
// every night, and no gate could assert anything about one except that it had
// changed.
// ============================================================================
const SAMPLE = {
  asOf: '2026-08-31',
  contractValueCents: 41200000,
  stages: [
    { id: 's1', ref: 'Permits and site', stagePctHundredths: 800, stageAmountCents: null, percentCompleteHundredths: 10000, drawnCents: 3296000, completedOn: '2026-03-06', inspectionName: '' },
    { id: 's2', ref: 'Footings and foundation', stagePctHundredths: 1200, stageAmountCents: null, percentCompleteHundredths: 10000, drawnCents: 2400000, completedOn: '2026-04-02', inspectionName: 'footing inspection' },
    { id: 's3', ref: 'Framing and dry-in', stagePctHundredths: 2200, stageAmountCents: null, percentCompleteHundredths: 10000, drawnCents: 8000000, completedOn: '2026-07-15', inspectionName: 'framing inspection' },
    { id: 's4', ref: 'Rough-in', stagePctHundredths: 1800, stageAmountCents: null, percentCompleteHundredths: 6500, drawnCents: 4000000, completedOn: null, inspectionName: 'rough-in inspection' },
    { id: 's5', ref: 'Drywall and interior', stagePctHundredths: 2000, stageAmountCents: null, percentCompleteHundredths: 0, drawnCents: 1200000, completedOn: null, inspectionName: 'owner walk-through' },
    { id: 's6', ref: 'Final and certificate of occupancy', stagePctHundredths: 1700, stageAmountCents: null, percentCompleteHundredths: 0, drawnCents: 0, completedOn: null, inspectionName: 'certificate of occupancy' },
  ],
};

/* THE KIT'S cash() WITH ONE THING ADDED, AND THE ADDITION IS THE HONESTY
   CONTRACT: a stage this cannot work out must not read as one worth nothing.
   cash(null) is $0.00, which is a figure; an em dash is an absence. */
const money = (c) => (c == null ? '—' : cash(c));
const count = (n) => (n == null ? '—' : `${n}`);
/* A PERCENTAGE IN HUNDREDTHS BACK TO SOMETHING A PERSON READS, and null stays
   null. An empty percent-complete box is a stage nobody has recorded progress
   against, which is not the same claim as a stage nobody has started. */
const pct = (h) => (h == null ? '—' : `${(h / 100).toFixed(2)}%`);

export default function DrawSchedule({ mode = 'demo' }) {
  const { state, patch, reset, status, restored, pack } = useRemembered('draw-schedule', 1, SAMPLE, mode);
  const [busy, setBusy] = useState(false);
  const r = useMemo(() => computeDrawSchedule(state), [state]);
  const t = r.totals;

  /* THE EDIT TABLES ARE DRIVEN OFF `state` AND NOT OFF THE COMPUTED ROWS,
     because the computed rows are SORTED by days since a stage was finished — so
     an index taken from them would write a keystroke into whichever stage
     happened to be that far down the list. The read-only tables above them use
     the sorted rows, which is the whole point of them; these address the array
     being patched. */
  const editable = state.stages || [];

  /* THE DIRECTION IS SAID IN WORDS, NEVER LEFT IN A MINUS SIGN. Short and over
     are different problems — one means part of the contract has no stage to draw
     it against, the other means the stages promise more than the job pays — and
     a reader should not have to work that out from the sign of a number. */
  const gapWord = t.scheduleGap > 0 ? 'with no stage against it'
    : t.scheduleGap < 0 ? 'promised beyond the contract'
      : 'the stages foot exactly';

  const doExport = async () => {
    setBusy(true);
    try {
      await exportRows('draw-schedule.xlsx', 'Draw schedule',
        r.rows.map((x) => ({
          Stage: x.ref,
          Share_of_contract: x.pct == null ? '' : Number((x.pct / 100).toFixed(2)),
          Stage_amount: x.amount == null ? '' : Number((x.amount / 100).toFixed(2)),
          Stage_value: x.stageValue == null ? '' : Number((x.stageValue / 100).toFixed(2)),
          Percent_complete: x.complete == null ? '' : Number((x.complete / 100).toFixed(2)),
          Earned: x.earned == null ? '' : Number((x.earned / 100).toFixed(2)),
          Drawn: Number((x.drawn / 100).toFixed(2)),
          Not_yet_drawn: x.notDrawn == null || x.notDrawn === 0 ? '' : Number((x.notDrawn / 100).toFixed(2)),
          Drawn_ahead: x.drawnAhead == null || x.drawnAhead === 0 ? '' : Number((x.drawnAhead / 100).toFixed(2)),
          Signed_off_by: x.inspectionName || '',
          Finished_on: x.completedOn || (x.open ? 'still open' : ''),
          Days_since: x.daysSinceComplete == null ? '' : x.daysSinceComplete,
        })).concat([{}, {
          Stage: 'Contract',
          Stage_value: Number((t.contractValue / 100).toFixed(2)),
        }, {
          Stage: 'The stages add up to',
          Stage_value: Number((t.scheduleSum / 100).toFixed(2)),
        }, {
          Stage: `Difference — ${gapWord}`,
          Stage_value: Number((Math.abs(t.scheduleGap) / 100).toFixed(2)),
        }, {
          Stage: 'Earned across the job',
          Earned: Number((t.earned / 100).toFixed(2)),
        }, {
          Stage: 'Drawn to date',
          Drawn: Number((t.drawn / 100).toFixed(2)),
        }, {
          Stage: `Finished and never drawn, on ${t.finishedNotDrawn} stage${t.finishedNotDrawn === 1 ? '' : 's'}`,
          Not_yet_drawn: Number((t.finishedNotDrawnCents / 100).toFixed(2)),
        }]),
        [36, 17, 14, 13, 16, 14, 13, 14, 13, 26, 13, 11]);
    } finally { setBusy(false); }
  };

  return (
    <div style={pageFor('draw-schedule')} data-demo="draw-schedule">
      <ToolHeader
        toolId="draw-schedule" house={HOUSE} occasion="six stages, two finished and never drawn" name="Draw Schedule Tracker"
        status={status} restored={restored} pack={pack}
        remembers={REMEMBERS}
      >
        On a financed job the money does not arrive because a stage was finished. It arrives because
        somebody filled in a draw request and sent it. So a stage that was finished, signed off and
        never drawn against is money you have already earned, sitting in the loan — and it appears on
        no report you have, because a report has a line for every draw that was made and none at all
        for the one nobody asked for. Here is every stage against the work actually done, and the
        schedule added up against the contract. Nothing you type leaves this page.
      </ToolHeader>

      <Readout items={[
        { label: 'Finished and never drawn', value: money(t.finishedNotDrawnCents),
          tone: t.finishedNotDrawn > 0 ? 'warn' : undefined,
          note: `on ${t.finishedNotDrawn} of ${t.stages} stages` },
        /* NO TONE ON THIS ONE, DELIBERATELY. A warning everything wears is a
           warning nothing wears — the twelfth tool on this shelf came back with
           three of four figures in the caution color, which reads as decoration.
           This is how long, which is a fact rather than a fault. */
        { label: 'Longest a finished stage has waited',
          value: t.longestNotDrawn == null ? null : `${t.longestNotDrawn} days`,
          note: 'nothing here says when to submit one' },
        /* AND NO TONE ON THIS ONE EITHER, FOR A REASON RATHER THAN FOR BALANCE.
           The panel below says out loud that this page takes no view on whether
           a draw ahead of the work should have happened. Coloring it as a
           caution would be taking that view in the one place a reader looks
           first. */
        { label: 'Drawn ahead of the work', value: money(t.drawnAhead),
          note: 'printed, and not judged' },
        { label: 'The schedule against the contract', value: money(Math.abs(t.scheduleGap)),
          tone: t.scheduleGap !== 0 ? 'warn' : undefined,
          note: t.scheduleShareHundredths == null
            ? 'no contract value to measure against'
            : `${gapWord} — the stages foot to ${pct(t.scheduleShareHundredths)}` },
        { label: 'Earned across the whole job', value: money(t.earned),
          note: `against ${money(t.drawn)} drawn` },
      ]} />

      <div style={wrap}>
        <Problems heading="Read these before you read a single figure" items={r.problems} />

        {/* THE FIRST FINDING, FIRST ON THE PAGE, because it is the one the tool
            exists for and the one no report anywhere can produce. Every stage is
            listed, in the engine's own order — longest since finished first, and
            anything still open at the end rather than at either extreme. */}
        <Panel
          title="Which finished stages nobody has drawn against"
          note="Sorted by how long since the stage was finished, furthest first. A stage still open has nothing to draw against yet and is not a fault — it sits at the bottom rather than being left out, because a list that hides rows is a list nobody trusts."
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 940 }}>
              <thead>
                <tr>
                  <th style={th}>Stage</th>
                  <th style={th}>What signs it off</th>
                  <th style={thN}>Finished on</th>
                  <th style={thN}>Days since</th>
                  <th style={thN}>Earned</th>
                  <th style={thN}>Drawn</th>
                  <th style={thN}>Never drawn</th>
                  <th style={th}>Where it stands</th>
                </tr>
              </thead>
              <tbody>
                {r.rows.map((x) => (
                  <tr key={x.id} style={{ background: x.overDrawn ? A.badTint : (x.finishedNotDrawn ? A.warnTint : 'transparent') }}>
                    <td style={{ ...td, color: T.textSec }}>{x.ref || '—'}</td>
                    <td style={{ ...td, color: T.textMuted }}>
                      {x.inspectionName || 'nothing recorded'}
                    </td>
                    <td style={{ ...tdN, color: T.textMuted }}>{x.completedOn || '—'}</td>
                    {/* THE ROW TINT ALREADY SAYS THIS, so the duration is not
                        toned as well — the tone belongs to the sum somebody can
                        act on, and a number of days is not one. Swept out of
                        three tools at once; LEDGER L-382. */}
                    <td style={{ ...tdN, fontWeight: 700, color: x.finishedNotDrawn ? T.text : T.textMuted }}>
                      {count(x.daysSinceComplete)}
                    </td>
                    <td style={{ ...tdN, color: T.textMuted }}>{money(x.earned)}</td>
                    <td style={{ ...tdN, color: T.textMuted }}>{money(x.drawn)}</td>
                    <td style={{ ...tdN, fontWeight: x.finishedNotDrawn ? 700 : 400 }}>
                      {x.notDrawn ? money(x.notDrawn) : '—'}
                    </td>
                    <td style={{ ...td, fontSize: 12, color: T.textMuted }}>
                      {x.finishedNotDrawn
                        ? 'finished, and never drawn'
                        : (x.open
                            ? `still open at ${pct(x.complete)}`
                            : (x.notDrawn === 0 ? 'finished and drawn in full' : 'finished'))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ margin: '12px 0 0', fontSize: 12.5, color: T.textMuted, lineHeight: 1.6 }}>
            {t.finishedNotDrawn > 0
              ? `${money(t.finishedNotDrawnCents)} of finished work has never been drawn against, the oldest of it ${t.longestNotDrawn} days ago.`
              : 'Every finished stage here has been drawn against.'}{' '}
            That is the comparison nothing else you have can make: a draw is requested rather than
            paid, so a stage nobody drew against leaves no line anywhere — not on the loan statement,
            not in the job cost, not on the schedule of values. This page has no view on when a draw
            is due, whether the lender would approve one, or what a reasonable wait looks like. It
            compares the stages your own schedule names against the work you have already recorded.
          </p>
        </Panel>

        {/* THE SECOND FINDING. It is about the SHEET rather than about a line,
            which is why it gets its own panel rather than a column: no row on
            the table above is wrong when this is wrong. */}
        <Panel
          title="The schedule against the contract"
          note="A draw schedule typed as shares that foot to 97, or as amounts that miss the contract, is wrong on no single line. Reading down it cannot find that; adding it up is the only thing that can."
        >
          <div style={{ display: 'grid', gap: 1, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', background: T.border, border: `${S.rule} solid ${T.border}`, borderRadius: S.radiusSm, overflow: 'hidden' }}>
            {[
              ['Contract', money(t.contractValue), 'what the job is written at'],
              ['The stages add up to', money(t.scheduleSum), `${t.valued} of ${t.stages} stages carry a figure`],
              ['Which is', pct(t.scheduleShareHundredths), 'of the contract value'],
              ['Difference', money(Math.abs(t.scheduleGap)), gapWord],
            ].map(([k, v, sub]) => (
              <div key={k} style={{ background: T.surface, padding: '12px 14px' }}>
                <p style={{ margin: 0, fontSize: 11, letterSpacing: 1.1, textTransform: 'uppercase', color: T.textMuted, fontFamily: FONT_BODY }}>{k}</p>
                <p style={{ margin: '3px 0 0', fontFamily: FONT_DATA, fontSize: 22, fontWeight: 700, lineHeight: 1.15, fontVariantNumeric: 'tabular-nums', color: T.text }}>{v}</p>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: T.textMuted, fontFamily: FONT_BODY }}>{sub}</p>
              </div>
            ))}
          </div>
          <p style={{ margin: '12px 0 0', fontSize: 12.5, color: T.textMuted, lineHeight: 1.6 }}>
            Nothing in that row is a suggestion. This page does not propose a schedule, does not say
            what a stage should be worth, and has no view on how a contract ought to be split — it
            adds up the figures already written on yours and prints what they come to.
          </p>
        </Panel>

        {/* WHAT EACH STAGE IS WORTH, PER STAGE. Read across rather than worked
            out, so a builder can see where an earned figure came from without
            trusting a total. */}
        <Panel
          title="What each stage is worth, and what it has earned"
          note="Earned is the stage value at the percent complete you recorded, and nothing else. Where a stage is written both as a share and as an amount, this uses the amount and says so above — a figure typed against the line is more specific than a share of a total that may have moved since."
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
              <thead>
                <tr>
                  <th style={th}>Stage</th>
                  <th style={thN}>Share</th><th style={thN}>Amount</th>
                  <th style={thN}>Stage value</th><th style={thN}>Complete</th>
                  <th style={thN}>Earned</th><th style={thN}>Drawn</th>
                  <th style={thN}>Where it stands</th>
                </tr>
              </thead>
              <tbody>
                {r.rows.map((x) => (
                  <tr key={x.id} style={{ background: x.overDrawn ? A.badTint : 'transparent' }}>
                    <td style={{ ...td, color: T.textSec }}>{x.ref || '—'}</td>
                    <td style={{ ...tdN, color: T.textMuted }}>{pct(x.pct)}</td>
                    <td style={{ ...tdN, color: T.textMuted }}>{x.amount == null ? '—' : money(x.amount)}</td>
                    <td style={tdN}>{money(x.stageValue)}</td>
                    <td style={{ ...tdN, color: T.textMuted }}>{pct(x.complete)}</td>
                    {/* EARNED IS NOT THE COLORED COLUMN, AND THE FIRST DRAW OF
                        THIS PAGE HAD IT THE OTHER WAY ROUND. The captured tile
                        came back with all six earned figures in the accent and
                        the answer beside them in plain ink — which is the
                        "warning everything wears" failure wearing an accent
                        instead of a caution: earned is an intermediate a reader
                        passes through, and the money this tool exists to find is
                        the one in the last column. */}
                    <td style={{ ...tdN, fontWeight: 700 }}>{money(x.earned)}</td>
                    <td style={{ ...tdN, color: T.textMuted }}>{money(x.drawn)}</td>
                    {/* THE SIGN IS SPELLED OUT UNDER THE FIGURE RATHER THAN LEFT
                        AS A MINUS. Behind and ahead are opposite problems on a
                        financed job — one is a draw nobody requested, the other
                        is money out against work not done — and a reader should
                        never have to read a sign to tell them apart.

                        THE ACCENT IS ON ONE DIRECTION ONLY. Work done and not
                        drawn is the money; drawn ahead is a figure this page
                        prints and refuses to judge, and coloring both would say
                        they are the same kind of thing. */}
                    <td style={tdN}>
                      {x.ahead == null ? '—' : (
                        <>
                          <span style={{ fontWeight: x.ahead < 0 ? 700 : 400, color: x.ahead < 0 ? A.brass : T.textMuted }}>
                            {money(Math.abs(x.ahead))}
                          </span>
                          <span style={{ display: 'block', fontSize: 10.5, color: T.textMuted, fontFamily: FONT_BODY }}>
                            {x.ahead === 0 ? 'drawn level' : (x.ahead > 0 ? 'drawn ahead' : 'not yet drawn')}
                          </span>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ margin: '10px 0 0', fontSize: 12, color: T.textMuted, lineHeight: 1.6 }}>
            Two denominators, because the two halves need different things to be true. What the
            SCHEDULE is worth needs a share or an amount against each line and nothing else, so it
            foots across {t.valued} of {t.stages} stages. What has been EARNED needs a percent
            complete as well, so it foots across {t.counted}.
          </p>
        </Panel>

        {/* ENTRY IS TWO TABLES AND THE SEAM IS THE DOCUMENT'S OWN. A draw
            request is printed in two blocks: the schedule of values as the
            contract writes it, and the progress claimed against it this time
            round. One table of nine columns would have been the wider-than-its
            -panel failure the recipe records, and the recipe's own answer is to
            cut a wide table where the form is already cut rather than to narrow
            the cells. Every width below was MEASURED against the longest value a
            real sheet carries, with an absurd value proving the measurement
            could report a clip at all. */}
        <Panel
          title="What the draw schedule says"
          note="The stage, what the contract writes against it, and how far along it is. A stage may be written as a share of the contract or as an amount; leave the other box empty rather than filling it in with something that agrees."
          right={<Btn small onClick={() => patch((s) => { s.stages.push({ id: uid('s'), ref: 'New stage', stagePctHundredths: null, stageAmountCents: null, percentCompleteHundredths: 0, drawnCents: 0, completedOn: null, inspectionName: '' }); })}>Add a stage</Btn>}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
              <thead>
                <tr>
                  <th style={th}>Stage</th>
                  <th style={thN}>Share of contract</th>
                  <th style={thN}>Or an amount</th>
                  <th style={thN}>Percent complete</th>
                  <th style={th} />
                </tr>
              </thead>
              <tbody>
                {editable.map((x, i) => (
                  <tr key={x.id}>
                    {/* 288, MEASURED. "Final and certificate of occupancy" is an
                        ordinary way to write one of these and wanted 262px
                        against the 246 a 274px cell gives. */}
                    <td style={td}><Cell label={`stage name on row ${i + 1}`} mono={false} w={288} value={x.ref || ''} onChange={(v) => patch((n) => { n.stages[i].ref = v; })} /></td>
                    {/* AN EMPTY SHARE BOX STAYS EMPTY, and so does an empty
                        amount. toOptionalNumber returns null for a blank, and
                        reading either as zero would print a confident stage worth
                        $0.00 beside a column of real money — and would put a
                        schedule that foots correctly into the gap panel as
                        though it were short. */}
                    <td style={tdN}><Cell label={`share of the contract on ${x.ref}`} w={84} value={x.stagePctHundredths == null ? '' : (x.stagePctHundredths / 100).toFixed(2)} onChange={(v) => patch((n) => { const p = toOptionalNumber(v); n.stages[i].stagePctHundredths = p == null ? null : Math.round(p * 100); })} /></td>
                    <td style={tdN}><Cell label={`stage amount on ${x.ref}`} w={112} value={x.stageAmountCents == null ? '' : (x.stageAmountCents / 100).toFixed(2)} onChange={(v) => patch((n) => { const p = toOptionalNumber(v); n.stages[i].stageAmountCents = p == null ? null : Math.round(p * 100); })} /></td>
                    {/* HUNDREDTHS OF A PER CENT, NOT A WHOLE ONE — see the units
                        note in src/lib/draw-schedule.js. retainage.js has a
                        field of nearly this name that IS a whole per cent, and
                        the suffix on this one is the only thing standing between
                        the two. */}
                    <td style={tdN}><Cell label={`percent complete on ${x.ref}`} w={84} value={x.percentCompleteHundredths == null ? '' : (x.percentCompleteHundredths / 100).toFixed(2)} onChange={(v) => patch((n) => { const p = toOptionalNumber(v); n.stages[i].percentCompleteHundredths = p == null ? null : Math.round(p * 100); })} /></td>
                    <td style={{ ...td, textAlign: 'right' }}><Btn small onClick={() => patch((n) => { n.stages.splice(i, 1); })}>×</Btn></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel
          title="What has been drawn, and what signs each stage off"
          note="Leave the finished date empty while a stage is still running. It counts as nothing to draw against yet rather than as a draw overdue, and the table above says which."
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
              <thead>
                <tr>
                  <th style={th}>Stage</th>
                  <th style={thN}>Drawn to date</th>
                  <th style={thN}>Finished on</th>
                  <th style={th}>What signs it off</th>
                </tr>
              </thead>
              <tbody>
                {editable.map((x, i) => (
                  <tr key={x.id}>
                    <td style={{ ...td, color: T.textSec }}>{x.ref || '—'}</td>
                    <td style={tdN}><Cell label={`drawn to date against ${x.ref}`} w={112} value={((x.drawnCents || 0) / 100).toFixed(2)} onChange={(v) => patch((n) => { n.stages[i].drawnCents = toCents(v); })} /></td>
                    <td style={tdN}>
                      <Cell label={`date ${x.ref} was finished`} w={116} value={x.completedOn || ''} onChange={(v) => patch((n) => { n.stages[i].completedOn = v || null; })} />
                      {!x.completedOn && (
                        <span style={{ display: 'block', fontSize: 10, color: T.textMuted, fontFamily: FONT_BODY, textAlign: 'right' }}>
                          still open
                        </span>
                      )}
                    </td>
                    {/* 268, measured. "certificate of occupancy issued" is an
                        ordinary way to write one of these and wanted 232px
                        against the 226 a 254px cell gives; this carries forty
                        characters, which covers "final inspection and owner
                        walk-through" as well. */}
                    <td style={td}><Cell label={`what signs off ${x.ref}`} mono={false} w={268} value={x.inspectionName || ''} onChange={(v) => patch((n) => { n.stages[i].inspectionName = v; })} /></td>
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
            'It will not suggest a draw schedule. How a contract is split into stages is what you and your lender agreed, and there is no standard split printed here to be measured against.',
            'It will not propose stage percentages. The shares on your schedule are the ones you signed; this adds them up and says what they come to, and stops.',
            'It will not tell you when to submit a draw. It says how long ago a stage was finished; whether to request against it today is a call about the job and about the relationship, and this page has neither.',
            'It will not tell you whether a draw is contractually due. That is a reading of your loan documents and your contract, which are not on this page and would be a legal opinion if they were.',
            'It will not compare any of this to a published industry draw schedule, a lender’s model schedule, or what another builder is working to.',
            'It will not compute financing cost or interest on money you have not drawn. What an undrawn balance is costing you is a claim about a loan agreement, not arithmetic.',
          ]} />

          <div>
            <Panel title="This sheet" right={
              <span style={{ display: 'flex', gap: 8 }}>
                <Btn small onClick={reset}>Reset</Btn>
                <Btn small primary onClick={doExport}>{busy ? 'Building…' : 'Export'}</Btn>
              </span>
            }>
              <p style={{ margin: 0, fontSize: 32, fontWeight: 700, fontFamily: FONT_DATA, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums', color: A.brass }}>
                {money(t.finishedNotDrawnCents)}
              </p>
              <p style={{ margin: '6px 0 0', fontSize: 12.5, color: T.textSec, lineHeight: 1.6 }}>
                finished and never drawn across {t.finishedNotDrawn} of {t.stages} stages,
                against {money(t.earned)} earned and {money(t.drawn)} drawn
                overall. {t.open} of them {t.open === 1 ? 'is' : 'are'} still open, with nothing to
                draw against yet.
              </p>
              <div style={{ marginTop: 12, paddingTop: 10, borderTop: `${S.rule} solid ${T.border}`, display: 'grid', gap: 10 }}>
                <Field label="Contract value" w={140} prefix="$" value={((state.contractValueCents || 0) / 100).toFixed(2)} onChange={(v) => patch((n) => { n.contractValueCents = toCents(v); })} />
                <Field label="Counted to" w={140} value={state.asOf} onChange={(v) => patch((n) => { n.asOf = v; })} />
              </div>
              <p style={{ margin: '10px 0 0', fontSize: 12, color: T.textMuted, lineHeight: 1.6 }}>
                Move that date forward and every wait on this page gets longer, and not one dollar
                moves. It is data rather than today’s date on purpose, so the same sheet gives the
                same answer twice.
              </p>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}
