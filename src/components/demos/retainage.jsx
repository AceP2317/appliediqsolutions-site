// ============================================================================
// RETAINAGE HELD — Slack Tide Electric (electrical subcontractor demo)
//
// WHY THIS IS THE TRADE'S TOOL AND NOT A PLATFORM'S. Accounting software knows
// what was invoiced and what came in. It does not know why the two disagree,
// because the reason is a clause nobody keyed anywhere: a percentage the general
// contractor holds back off every pay application, released when one named
// condition is satisfied. Both the percentage and the condition were negotiated
// one job at a time, so there is no industry default to hold them against.
//
// THE FIRST FINDING IS THAT THIS IS EARNED MONEY WITH NO DOCUMENT. Work done,
// inspected, approved and billed, withheld on purpose, sitting in somebody
// else's bank account — and invisible on every report either side of the gap,
// where it reads as a customer who pays slowly. The held figure is the headline
// and the page says in words what it is.
//
// THE SECOND FINDING IS THE REASON THE TOOL EXISTS. The release trigger is per
// contract, and money sits past it. A ledger sorts by invoice date, and every
// contract's condition fell on a different day for a different reason, so
// nothing anywhere puts the four-month-old hold-back at the top of a list. The
// sample carries two past their condition by very different amounts — 136 days
// and 34 — one released in full at 93 days, which is the case that worked, and
// two still running, which is not a fault.
//
// Built by Ian Provencher · AppliedIQ Solutions
// Public demo — the contractor, the customers, the contracts and every date are
// invented. No percentage is suggested and no real business is named.
// ============================================================================

import React, { useMemo, useState } from 'react';
import { computeRetainage } from '../../lib/retainage.js';
import { T, A, S, FONT_DATA, FONT_BODY, Panel, Btn, Cell, Field, ToolHeader, Problems, WontDo, useRemembered, toCents, toOptionalNumber, cash, uid, wrap, th, thN, td, tdN, exportRows, pageFor, Readout } from '../kit/shelf.jsx';

const HOUSE = 'Slack Tide Electric';

/* THE STATUS STRIP READS "remembers your <this>", so this cannot open with a
   determiner of its own — smoke-tools carries an arm for exactly that, added
   after the eleventh tool shipped "remembers your each unit". */
const REMEMBERS = 'contracts, their hold-back percentages and the release condition written into each one';

// ============================================================================
// THE SAMPLE SHEET — the same figures scripts/verify-tools.mjs works out by
// hand. Five contracts, and each is a different shape of the same answer:
//
//   PA-108  substantial completion four and a half months ago, $18,600 still
//           held. The headline finding, and the top of the sorted list.
//   PA-114  seventy per cent complete and still running. No condition met, no
//           fault, and nothing to chase.
//   PA-121  punch list signed a month ago, $4,625 still held. Past its
//           condition by a very different amount from PA-108, which is the
//           whole argument for sorting by it.
//   PA-126  running, and OVER-HELD: 7.5% is being withheld against a contract
//           written at 5%. A real dispute, named rather than judged.
//   PA-131  the one that worked — condition met at 93 days and released in
//           full, so it is NOT on the list of phone calls despite being the
//           second-oldest condition on the sheet.
//
// `asOf` IS DATA AND NOT THE CLOCK. Every age here would otherwise grow by a
// day every night, and no gate could assert anything about one except that it
// had changed.
// ============================================================================
const SAMPLE = {
  asOf: '2026-08-31',
  contracts: [
    { id: 'c1', ref: 'PA-108', customer: 'Harbourgate Builders', contractValueCents: 18600000, billedToDateCents: 18600000, retainagePctHundredths: 1000, retainedToDateCents: 1860000, releasedToDateCents: 0, percentComplete: 100, triggerMet: '2026-04-17', triggerName: 'substantial completion' },
    { id: 'c2', ref: 'PA-114', customer: 'Broad Reach Partners', contractValueCents: 24000000, billedToDateCents: 16800000, retainagePctHundredths: 1000, retainedToDateCents: 1680000, releasedToDateCents: 0, percentComplete: 70, triggerMet: null, triggerName: '' },
    { id: 'c3', ref: 'PA-121', customer: 'Longwharf Retail Group', contractValueCents: 9250000, billedToDateCents: 9250000, retainagePctHundredths: 500, retainedToDateCents: 462500, releasedToDateCents: 0, percentComplete: 100, triggerMet: '2026-07-28', triggerName: 'punch list signed' },
    { id: 'c4', ref: 'PA-126', customer: 'Fiddler Creek Terminal', contractValueCents: 5800000, billedToDateCents: 4640000, retainagePctHundredths: 500, retainedToDateCents: 348000, releasedToDateCents: 0, percentComplete: 80, triggerMet: null, triggerName: '' },
    { id: 'c5', ref: 'PA-131', customer: 'Oyster Row Housing Trust', contractValueCents: 12400000, billedToDateCents: 12400000, retainagePctHundredths: 1000, retainedToDateCents: 1240000, releasedToDateCents: 1240000, percentComplete: 100, triggerMet: '2026-05-30', triggerName: 'final lien waiver' },
  ],
};

/* THE KIT'S cash() WITH ONE THING ADDED, AND THE ADDITION IS THE HONESTY
   CONTRACT: a contract this cannot work out must not read as one holding
   nothing. cash(null) is $0.00, which is a figure; an em dash is an absence. */
const money = (c) => (c == null ? '—' : cash(c));
const count = (n) => (n == null ? '—' : `${n}`);
/* A RATE IN HUNDREDTHS BACK TO SOMETHING A PERSON READS, and null stays null.
   An empty percentage box is a contract nobody keyed a rate for, which is not
   the same claim as a contract that holds nothing back. */
const rate = (h) => (h == null ? '—' : `${(h / 100).toFixed(2)}%`);

export default function Retainage({ mode = 'demo' }) {
  const { state, patch, reset, status, restored, pack } = useRemembered('retainage', 1, SAMPLE, mode);
  const [busy, setBusy] = useState(false);
  const r = useMemo(() => computeRetainage(state), [state]);
  const t = r.totals;

  /* THE EDIT TABLE IS DRIVEN OFF `state` AND NOT OFF THE COMPUTED ROWS, because
     the computed rows are SORTED by days past the condition — so an index taken
     from them would write a keystroke into whichever contract happened to be
     that far down the list. The two tables above it read the sorted rows, which
     is the whole point of them; this one addresses the array being patched. */
  const editable = state.contracts || [];

  const doExport = async () => {
    setBusy(true);
    try {
      await exportRows('retainage-held.xlsx', 'Retainage',
        r.rows.map((x) => ({
          Pay_app: x.ref,
          Customer: x.customer,
          Contract: Number((x.contractValue / 100).toFixed(2)),
          Billed_to_date: Number((x.billed / 100).toFixed(2)),
          Retainage_rate: x.pct == null ? '' : Number((x.pct / 100).toFixed(2)),
          Should_be_held: x.shouldBeRetained == null ? '' : Number((x.shouldBeRetained / 100).toFixed(2)),
          Held_to_date: Number((x.retained / 100).toFixed(2)),
          Released_to_date: Number((x.released / 100).toFixed(2)),
          Held_now: x.heldNow == null ? '' : Number((x.heldNow / 100).toFixed(2)),
          Beyond_the_contract: x.overHeld == null || x.overHeld <= 0 ? '' : Number((x.overHeld / 100).toFixed(2)),
          Percent_complete: x.complete == null ? '' : x.complete,
          Release_condition: x.triggerName || '',
          Condition_met: x.triggerMet || (x.running ? 'still running' : ''),
          Days_since: x.daysSinceTrigger == null ? '' : x.daysSinceTrigger,
        })).concat([{}, {
          Pay_app: 'Held to date',
          Held_to_date: Number((t.retained / 100).toFixed(2)),
        }, {
          Pay_app: 'Released back to you',
          Released_to_date: Number((t.released / 100).toFixed(2)),
        }, {
          Pay_app: 'Held now — earned, billed and not paid',
          Held_now: Number((t.heldNow / 100).toFixed(2)),
        }, {
          Pay_app: `Of that, past its release condition on ${t.pastTrigger} contract${t.pastTrigger === 1 ? '' : 's'}`,
          Held_now: Number((t.heldPastTrigger / 100).toFixed(2)),
        }]),
        [10, 26, 13, 15, 14, 15, 13, 17, 12, 19, 16, 22, 14, 11]);
    } finally { setBusy(false); }
  };

  return (
    <div style={pageFor('retainage')} data-demo="retainage">
      <ToolHeader
        toolId="retainage" house={HOUSE} occasion="five contracts, two past their release" name="Retainage Held"
        status={status} restored={restored} pack={pack}
        remembers={REMEMBERS}
      >
        Retainage is money you have already earned. It was billed on a pay application, approved,
        and then held back on purpose — so it leaves your books as invoiced and never arrives as
        paid, and in between it reads as a customer who is slow. Here is what is held against every
        contract, what the contract itself says should be held, and which jobs are already past
        their own release condition. Nothing you type leaves this page.
      </ToolHeader>

      <Readout items={[
        { label: 'Held right now', value: money(t.heldNow),
          note: 'Earned, billed, approved, and in somebody else’s account.' },
        { label: 'Past its release condition', value: money(t.heldPastTrigger),
          tone: t.pastTrigger > 0 ? 'warn' : undefined,
          note: `on ${t.pastTrigger} of ${t.contracts} contracts` },
        /* NO TONE ON THIS ONE, DELIBERATELY. The captured tile came back with
           three of the four figures in the caution color, and a warning
           everything wears is a warning nothing wears. The two that keep it are
           sums a trade can act on; this is how long, which is a fact rather
           than a fault. */
        { label: 'Longest wait since a condition was met',
          value: t.longestPastTrigger == null ? null : `${t.longestPastTrigger} days`,
          note: 'nothing on this page says when to chase it' },
        { label: 'Withheld beyond the contract', value: money(t.overHeld),
          tone: t.overHeld > 0 ? 'warn' : undefined,
          note: `checked against ${t.rated} of ${t.contracts} rates` },
      ]} />

      <div style={wrap}>
        <Problems heading="Read these before you read a single figure" items={r.problems} />

        {/* THE SECOND FINDING, FIRST ON THE PAGE, because it is the one the tool
            exists for and the one no ledger anywhere can sort by. Every contract
            is listed, in the engine's own order — furthest past its condition
            first, and anything with no condition met at the end rather than at
            either extreme. */}
        <Panel
          title="Which of these are already past their own release condition"
          note="Sorted by how far past, furthest first. A job with no condition met yet is still running and is not a fault — it sits at the bottom rather than being left out, because a list that hides them is a list nobody trusts."
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
              <thead>
                <tr>
                  <th style={th}>Contract</th>
                  <th style={th}>What releases it</th>
                  <th style={thN}>Satisfied on</th>
                  <th style={thN}>Days since</th>
                  <th style={thN}>Still held</th>
                  <th style={th}>Where it stands</th>
                </tr>
              </thead>
              <tbody>
                {r.rows.map((x) => (
                  <tr key={x.id} style={{ background: x.overReleased ? A.badTint : (x.pastTrigger ? A.warnTint : 'transparent') }}>
                    <td style={{ ...td, color: T.textSec }}>
                      {x.customer || '—'}
                      <span style={{ display: 'block', fontSize: 10.5, color: T.textMuted, fontFamily: FONT_BODY }}>
                        {x.ref || 'no reference'}
                      </span>
                    </td>
                    <td style={{ ...td, color: T.textSec }}>
                      {x.triggerName || (x.running ? 'not met yet' : 'not written down')}
                    </td>
                    <td style={{ ...tdN, color: T.textMuted }}>{x.triggerMet || '—'}</td>
                    {/* THE ROW TINT ALREADY SAYS THIS, so the duration is not
                        toned as well — the tone belongs to the sum somebody can
                        act on, and a number of days is not one. Swept out of
                        three tools at once; LEDGER L-382. */}
                    <td style={{ ...tdN, fontWeight: 700, color: x.pastTrigger ? T.text : T.textMuted }}>
                      {count(x.daysSinceTrigger)}
                    </td>
                    <td style={{ ...tdN, fontWeight: x.pastTrigger ? 700 : 400 }}>{money(x.heldNow)}</td>
                    <td style={{ ...td, fontSize: 12, color: T.textMuted }}>
                      {x.pastTrigger
                        ? 'past its condition, still held'
                        : (x.running
                            ? `still running at ${count(x.complete)}%`
                            : (x.heldNow === 0 ? 'released in full' : 'condition met, nothing held'))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ margin: '12px 0 0', fontSize: 12.5, color: T.textMuted, lineHeight: 1.6 }}>
            {t.pastTrigger > 0
              ? `${money(t.heldPastTrigger)} of what is held has already satisfied the condition written into its own contract, the oldest of it ${t.longestPastTrigger} days ago.`
              : 'Nothing here has satisfied its release condition and is still being held.'}{' '}
            That is the one comparison a ledger cannot make for you: it sorts by invoice date, and
            every one of these conditions fell on a different day for a different reason. This page
            has no view on when a call is due, what a reasonable wait looks like, or whether a
            hold-back is valid — it ages what your own contracts already say.
          </p>
        </Panel>

        {/* THE FIRST FINDING, PER CONTRACT. What the contract says should be
            held, beside what actually is — read across rather than worked out. */}
        <Panel
          title="What is held against each contract"
          note="The should-be figure is the contract’s own rate on what has been billed to date. It is a comparison and not a judgment: where the two disagree the difference is printed, and who is right is a conversation with the general contractor."
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 960 }}>
              <thead>
                <tr>
                  <th style={th}>Contract</th>
                  <th style={thN}>Billed to date</th><th style={thN}>Rate</th>
                  <th style={thN}>Should be held</th><th style={thN}>Held to date</th>
                  <th style={thN}>Released</th><th style={thN}>Beyond the contract</th>
                  <th style={thN}>Held now</th>
                </tr>
              </thead>
              <tbody>
                {r.rows.map((x) => (
                  <tr key={x.id} style={{ background: x.overReleased ? A.badTint : 'transparent' }}>
                    <td style={{ ...td, color: T.textSec }}>{x.customer || x.ref || '—'}</td>
                    <td style={{ ...tdN, color: T.textMuted }}>{money(x.billed)}</td>
                    <td style={{ ...tdN, color: T.textMuted }}>{rate(x.pct)}</td>
                    <td style={{ ...tdN, color: T.textMuted }}>{money(x.shouldBeRetained)}</td>
                    <td style={tdN}>{money(x.retained)}</td>
                    <td style={{ ...tdN, color: T.textMuted }}>{money(x.released)}</td>
                    <td style={{ ...tdN, color: x.overHeld != null && x.overHeld > 0 ? A.warn : T.textMuted, fontWeight: x.overHeld != null && x.overHeld > 0 ? 700 : 400 }}>
                      {x.overHeld != null && x.overHeld > 0 ? money(x.overHeld) : '—'}
                    </td>
                    <td style={{ ...tdN, fontWeight: 700, color: x.heldNow == null ? T.textMuted : A.brass }}>
                      {money(x.heldNow)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ margin: '10px 0 0', fontSize: 12, color: T.textMuted, lineHeight: 1.6 }}>
            Two denominators, because the two halves need different things to be true. What is held
            is two figures you typed and needs no rate at all, so it foots across {t.counted}{' '}
            of {t.contracts} contracts. The comparison against the contract cannot be made without a
            rate, so it foots across {t.rated}.
          </p>
        </Panel>

        {/* ENTRY IS TWO TABLES AND THE SEAM IS THE DOCUMENT'S OWN. A pay
            application is printed in two blocks: what the contract says, and
            what has happened against it. One table of eleven columns measured
            1440px inside a panel capped at 1240, which would have made this the
            only tool on the shelf whose entry table cannot be seen at once —
            and the recipe's own rule is that a wide table needs the full width
            rather than narrower cells, so the answer was to cut it where the
            form is already cut. Every width below was MEASURED against the
            longest value a real sheet carries, with an absurd value proving the
            measurement could report a clip at all. */}
        <Panel
          title="What each contract says"
          note="The reference, who it is with, what it is worth, and the hold-back percentage written into it. The percentage is the contract’s own — nothing here suggests one, and an empty box stays empty rather than becoming a rate of nothing."
          right={<Btn small onClick={() => patch((s) => { s.contracts.push({ id: uid('c'), ref: '', customer: 'New customer', contractValueCents: 0, billedToDateCents: 0, retainagePctHundredths: 1000, retainedToDateCents: 0, releasedToDateCents: 0, percentComplete: 0, triggerMet: null, triggerName: '' }); })}>Add a contract</Btn>}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 820 }}>
              <thead>
                <tr>
                  <th style={th}>Pay app</th><th style={th}>Customer</th>
                  <th style={thN}>Contract</th><th style={thN}>Billed to date</th>
                  <th style={thN}>Retainage %</th><th style={thN}>% complete</th>
                  <th style={th} />
                </tr>
              </thead>
              <tbody>
                {editable.map((x, i) => (
                  <tr key={x.id}>
                    {/* 96, MEASURED. At 88 a reference as ordinary as
                        "PA-1084-R2" wanted 89px of the 86 it had and lost its
                        last character, with nothing anywhere erroring. */}
                    <td style={td}><Cell label={`pay application number on row ${i + 1}`} mono={false} w={96} value={x.ref || ''} onChange={(v) => patch((n) => { n.contracts[i].ref = v; })} /></td>
                    {/* 248, measured the same way. General contractors have long
                        names — "Carolina Coastal Construction Group" wanted
                        234px against the 194 a 196px cell gives. */}
                    <td style={td}><Cell label={`customer on row ${i + 1}`} mono={false} w={248} value={x.customer || ''} onChange={(v) => patch((n) => { n.contracts[i].customer = v; })} /></td>
                    <td style={tdN}><Cell label={`contract value for ${x.customer}`} w={104} value={((x.contractValueCents || 0) / 100).toFixed(2)} onChange={(v) => patch((n) => { n.contracts[i].contractValueCents = toCents(v); })} /></td>
                    <td style={tdN}><Cell label={`billed to date on ${x.customer}`} w={104} value={((x.billedToDateCents || 0) / 100).toFixed(2)} onChange={(v) => patch((n) => { n.contracts[i].billedToDateCents = toCents(v); })} /></td>
                    {/* AN EMPTY RATE BOX STAYS EMPTY. toOptionalNumber returns
                        null for a blank, and reading it as zero would print a
                        confident "should be $0.00 held" beside a column showing
                        thousands — a dispute the tool invented. */}
                    <td style={tdN}><Cell label={`retainage percentage on ${x.customer}`} w={72} value={x.retainagePctHundredths == null ? '' : (x.retainagePctHundredths / 100).toFixed(2)} onChange={(v) => patch((n) => { const p = toOptionalNumber(v); n.contracts[i].retainagePctHundredths = p == null ? null : Math.round(p * 100); })} /></td>
                    {/* A WHOLE PER CENT, NOT HUNDREDTHS — see the units note in
                        src/lib/retainage.js. It is read off the pay application
                        as printed and never multiplies anything. */}
                    <td style={tdN}><Cell label={`percent complete on ${x.customer}`} w={64} value={x.percentComplete == null ? '' : String(x.percentComplete)} onChange={(v) => patch((n) => { n.contracts[i].percentComplete = toOptionalNumber(v); })} /></td>
                    <td style={{ ...td, textAlign: 'right' }}><Btn small onClick={() => patch((n) => { n.contracts.splice(i, 1); })}>×</Btn></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel
          title="What has been held, and what releases it"
          note="Leave the satisfied-on date empty while a job is still running. It is counted as nothing to chase rather than as a condition overdue, and the row says which."
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 880 }}>
              <thead>
                <tr>
                  <th style={th}>Contract</th>
                  <th style={thN}>Held to date</th><th style={thN}>Released</th>
                  <th style={thN}>Satisfied on</th><th style={th}>What was satisfied</th>
                </tr>
              </thead>
              <tbody>
                {editable.map((x, i) => (
                  <tr key={x.id}>
                    <td style={{ ...td, color: T.textSec }}>
                      {x.customer || '—'}
                      <span style={{ display: 'block', fontSize: 10.5, color: T.textMuted, fontFamily: FONT_BODY }}>
                        {x.ref || 'no reference'}
                      </span>
                    </td>
                    <td style={tdN}><Cell label={`retainage held to date on ${x.customer}`} w={104} value={((x.retainedToDateCents || 0) / 100).toFixed(2)} onChange={(v) => patch((n) => { n.contracts[i].retainedToDateCents = toCents(v); })} /></td>
                    <td style={tdN}><Cell label={`retainage released on ${x.customer}`} w={104} value={((x.releasedToDateCents || 0) / 100).toFixed(2)} onChange={(v) => patch((n) => { n.contracts[i].releasedToDateCents = toCents(v); })} /></td>
                    <td style={tdN}>
                      <Cell label={`date the release condition was satisfied on ${x.customer}`} w={112} value={x.triggerMet || ''} onChange={(v) => patch((n) => { n.contracts[i].triggerMet = v || null; })} />
                      {!x.triggerMet && (
                        <span style={{ display: 'block', fontSize: 10, color: T.textMuted, fontFamily: FONT_BODY, textAlign: 'right' }}>
                          still running
                        </span>
                      )}
                    </td>
                    {/* 260, measured. "certificate of substantial completion" is
                        an ordinary way to write one of these and wanted 232px
                        against the 186 a 188px cell gives; this carries forty
                        characters, which covers "final lien waiver received and
                        recorded" as well. */}
                    <td style={td}><Cell label={`what the release condition is on ${x.customer}`} mono={false} w={260} value={x.triggerName || ''} onChange={(v) => patch((n) => { n.contracts[i].triggerName = v; })} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* FOUR TILES ACROSS THE FULL WIDTH, NOT INSIDE A COLUMN. In a 1.5fr
            column the auto-fit grid took three and wrapped the fourth onto a
            row of its own beside an empty cell — and the empty cell was the
            answer, which is the one figure on this page that matters. At the
            full 1240 all four sit on one line and the sum reads across as a
            sentence. Caught by looking at the captured tile. */}
        <Panel
          title="What the money did"
          note="Held to date is everything ever withheld across these contracts. Released is what has come back. The difference is what a bank statement will never show you as anything at all."
        >
          <div style={{ display: 'grid', gap: 1, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', background: T.border, border: `${S.rule} solid ${T.border}`, borderRadius: S.radiusSm, overflow: 'hidden' }}>
            {[
              ['Billed to date', money(t.billed), 'across every contract here'],
              ['Held to date', money(t.retained), 'withheld off those applications'],
              ['Released back to you', money(t.released), 'once a condition was satisfied'],
              ['Still held', money(t.heldNow), 'earned, and not in your account'],
            ].map(([k, v, sub]) => (
              <div key={k} style={{ background: T.surface, padding: '12px 14px' }}>
                <p style={{ margin: 0, fontSize: 11, letterSpacing: 1.1, textTransform: 'uppercase', color: T.textMuted, fontFamily: FONT_BODY }}>{k}</p>
                <p style={{ margin: '3px 0 0', fontFamily: FONT_DATA, fontSize: 22, fontWeight: 700, lineHeight: 1.15, fontVariantNumeric: 'tabular-nums', color: T.text }}>{v}</p>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: T.textMuted, fontFamily: FONT_BODY }}>{sub}</p>
              </div>
            ))}
          </div>
          <p style={{ margin: '12px 0 0', fontSize: 12.5, color: T.textMuted, lineHeight: 1.6 }}>
            Nothing in that row is a forecast and nothing in it is a rate anybody suggested. Every
            figure is a number you typed off your own pay applications, put through the percentage
            your own contract states, and aged against the date your own contract names.
          </p>
        </Panel>

        {/* THE REFUSALS ON THE LEFT AND THE SHEET ON THE RIGHT, which is the
            other half of the same repair. With a short panel on the left this
            row left about 450px of bare ground beside a tall stack — and the
            two panels below are within fifty pixels of each other, so the row
            closes level. */}
        <div className="aiq-split" style={{ '--aiq-split': '1.4fr' }}>
          <WontDo items={[
            'It will not suggest a retainage percentage. What your contract holds back is what you signed, and there is no standard rate printed here to be measured against.',
            'It will not tell you when to chase anybody. It says how long ago a condition was satisfied; what to do about that is a relationship you have and this page does not.',
            'It will not tell you whether a hold-back is contractually valid. Where what is held and what the contract says disagree, it prints both figures and the difference, and stops.',
            'It will not compare any of this to a published industry figure, a state average, or what another trade is putting up with.',
            'It will not compute interest on money held. What that money would have earned is a claim about a contract, and in some places about a statute, neither of which is arithmetic.',
          ]} />

          <div>
            <Panel title="This sheet" right={
              <span style={{ display: 'flex', gap: 8 }}>
                <Btn small onClick={reset}>Reset</Btn>
                <Btn small primary onClick={doExport}>{busy ? 'Building…' : 'Export'}</Btn>
              </span>
            }>
              <p style={{ margin: 0, fontSize: 32, fontWeight: 700, fontFamily: FONT_DATA, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums', color: A.brass }}>
                {money(t.heldNow)}
              </p>
              <p style={{ margin: '6px 0 0', fontSize: 12.5, color: T.textSec, lineHeight: 1.6 }}>
                held across {t.counted} of {t.contracts} contracts, of
                which {money(t.heldPastTrigger)} has already met the condition its own contract
                names. {t.running} of them {t.running === 1 ? 'is' : 'are'} still running, with
                nothing to chase.
              </p>
              <div style={{ marginTop: 12, paddingTop: 10, borderTop: `${S.rule} solid ${T.border}` }}>
                <Field label="Aged to" w={128} value={state.asOf} onChange={(v) => patch((n) => { n.asOf = v; })} />
              </div>
              <p style={{ margin: '10px 0 0', fontSize: 12, color: T.textMuted, lineHeight: 1.6 }}>
                Move that date forward and every wait on this page gets longer. It is data rather
                than today’s date on purpose, so the same sheet gives the same answer twice.
              </p>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}
