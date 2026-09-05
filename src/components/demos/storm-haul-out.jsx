// ============================================================================
// STORM HAUL-OUT PLAN — Marker Nine Boatyard (portfolio demo)
//
// A named storm is coming and the yard has to get boats out of the water. Two
// things run out: the clock and the ground. This counts both, in the yard's own
// numbers, and says plainly which boats do not make it.
//
// IT PREDICTS NOTHING ABOUT THE STORM. Not the track, not the surge, not the
// timing. The hours remaining is a figure the yard types in from whatever they
// are watching, and every answer moves with it. A tool that forecast a storm
// would be the single most dangerous thing on this shelf.
//
// IT ALSO DOES NOT DECIDE. It counts lifts against a clock and footprints
// against a yard, in the order the yard put the boats in. Which boat goes first
// is a decision about contracts, relationships and judgement, and no arithmetic
// owns it. THE TOOL COUNTS AND THE YARD DECIDES — that line is on the page.
//
// Why this one exists at all: it is the narrowest thing on the shelf and the
// clearest proof of how narrow a useful tool is allowed to be. There is no
// market for it. There is a yard, twice a year, at four in the morning, with a
// legal pad.
//
// Built by Ian Provencher · AppliedIQ Solutions
// Public demo — the yard, the boats and the storm are invented.
// ============================================================================

import React, { useMemo, useState } from 'react';
import { computeHaulOut } from '../../lib/haul-out.js';
import { T, A, S, FONT_DATA, Panel, Btn, Cell, Field, ToolHeader, Problems, WontDo, useRemembered, toNumber, plain, uid, page, wrap, th, thN, td, tdN, exportRows, pageFor, Readout } from '../kit/shelf.jsx';

const YARD = 'Marker Nine Boatyard';

// ============================================================================
// THE SAMPLE — one yard, one bad forecast. Lengths and beams are tenths of a
// foot: 315 is thirty-one and a half.
// ============================================================================
const SAMPLE = {
  storm: 'sample haul-out',
  minutesLeft: 260,
  cycleMinutes: 40,
  lifts: 1,
  yardSqFt: 4200,
  padFt: 4,
  boats: [
    { id: 'h1', name: 'Cross Current', lengthFt: 420, beamFt: 132 },
    { id: 'h2', name: 'Sundog', lengthFt: 315, beamFt: 110 },
    { id: 'h3', name: 'Wrackline', lengthFt: 540, beamFt: 168 },
    { id: 'h4', name: 'Second Wind', lengthFt: 240, beamFt: 88 },
    { id: 'h5', name: 'Marsh Hen', lengthFt: 190, beamFt: 76 },
    { id: 'h6', name: 'Osprey', lengthFt: 360, beamFt: 122 },
    { id: 'h7', name: 'Bittern', lengthFt: 185, beamFt: 74 },
    { id: 'h8', name: 'Little Gull', lengthFt: 160, beamFt: 68 },
    { id: 'h9', name: 'Tern', lengthFt: 280, beamFt: 96 },
    { id: 'h10', name: 'Whimbrel', lengthFt: 330, beamFt: 118 },
    { id: 'h11', name: 'Rail', lengthFt: 220, beamFt: 84 },
    { id: 'h12', name: 'Skimmer', lengthFt: 265, beamFt: 92 },
  ],
};

const REASON = {
  time: 'no clock left',
  space: 'no ground left',
  both: 'no clock and no ground',
};

export default function StormHaulOut({ mode = 'demo' }) {
  const { state, patch, reset, status, restored, pack } = useRemembered('storm-haul-out', 1, SAMPLE, mode);
  const [busy, setBusy] = useState(false);
  const r = useMemo(() => computeHaulOut(state), [state]);

  const doExport = async () => {
    setBusy(true);
    try {
      await exportRows('haul-out-plan.xlsx', 'Haul-out',
        r.planned.map((b) => ({
          Order: state.boats.findIndex((x) => x.id === b.id) + 1,
          Boat: b.name, Length_ft: b.lengthFt / 10, Beam_ft: b.beamFt / 10,
          Blocked_sq_ft: b.footprint,
          Comes_out: b.hauled ? 'yes' : 'no',
          Lift_number: b.lift ?? '',
          Why_not: b.hauled ? '' : REASON[b.reason],
        })),
        [7, 18, 11, 10, 15, 11, 12, 22]);
    } finally { setBusy(false); }
  };

  const move = (i, d) => patch((s) => {
    const j = i + d;
    if (j < 0 || j >= s.boats.length) return;
    [s.boats[i], s.boats[j]] = [s.boats[j], s.boats[i]];
  });

  const hoursLeft = (state.minutesLeft / 60).toFixed(1).replace(/\.0$/, '');

  return (
    <div style={pageFor("storm-haul-out")} data-demo="storm-haul-out">
      <ToolHeader toolId="storm-haul-out" house={YARD} occasion="sample haul-out" name="Storm Haul-Out Plan" status={status} restored={restored} pack={pack} remembers="boat list">
        You have this long, this many machines, this much ground. Here is how many hulls come out
        and which ones do not. It knows nothing about the storm — the hours are yours, from
        whatever you are watching, and every answer moves with them. Nothing you type leaves
        this page.
      </ToolHeader>

      <Readout items={[
        { label: 'Comes out', value: r.hauled.length,
          tone: 'good',
          note: 'of ' + r.planned.length + ' on the list' },
        { label: 'Stays in the water', value: r.staying.length,
          tone: r.staying.length ? 'bad' : 'good',
          note: r.staying.length ? 'the clock or the ground runs out' : 'the whole yard fits' },
        { label: 'Time needed', value: r.minutesNeeded == null ? null : r.minutesNeeded + ' min',
          tone: r.minutesNeeded != null && r.minutesNeeded > r.minutesLeft ? 'bad' : 'good',
          note: r.minutesLeft + ' min before the cut-off' },
        { label: 'Ground needed', value: Math.round(r.sqFtNeeded).toLocaleString() + ' sq ft',
          tone: r.sqFtNeeded > r.yardSqFt ? 'bad' : 'good',
          note: Math.round(r.yardSqFt).toLocaleString() + ' sq ft in the yard' },
      ]} />

      <div style={wrap}>
        {/* A QUIET INSET, NOT A WARNING, and the distinction is the point. This
            carried a faint brass wash from the dark era. Re-tokenising it to the
            faceplate's own tint put it on THIS tool's tint — which is pale red,
            because this tool's accent is signal red — with a red border, sitting
            directly above the real Problems panel. Two red boxes in a row, and
            the top one is a neutral note about what the tool does not decide.
            A quiet row and a plain border say "read this"; red says "something
            is wrong", and nothing here is wrong. */}
        <div style={{
          background: T.surfaceAlt, border: `${S.rule} solid ${T.borderStrong}`, borderRadius: S.radius,
          padding: '12px 14px', marginBottom: 14, fontSize: 13, lineHeight: 1.6, color: T.text,
        }}>
          <strong style={{ color: A.brass }}>The tool counts. The yard decides.</strong>{' '}
          This works out how many hulls fit through your machines in the time you have and onto the
          ground you have. It has no view on which boat should go first — that is contracts,
          relationships and judgement, and no arithmetic owns it. Change the order and it recounts.
        </div>

        <Problems heading="What will not make it" items={r.problems} />

        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'minmax(0, 1.9fr) minmax(290px, 1fr)', alignItems: 'start' }}>
          <div>
            <Panel
              title="The order you would work them"
              note="Top of the list comes out first. Blocked square feet is the hull plus the room you need around it — a yard that plans on hull dimensions runs out of ground before it runs out of list."
              right={<Btn small onClick={() => patch((s) => { s.boats.push({ id: uid('h'), name: 'New boat', lengthFt: 300, beamFt: 100 }); })}>Add a boat</Btn>}
            >
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
                  <thead>
                    <tr><th style={th}>#</th><th style={th}>Boat</th><th style={thN}>Length</th><th style={thN}>Beam</th><th style={thN}>Blocked</th><th style={th}>Out?</th><th style={th} /></tr>
                  </thead>
                  <tbody>
                    {r.planned.map((b, i) => (
                      <tr key={b.id} style={{ background: b.hauled ? 'transparent' : A.badTint }}>
                        <td style={{ ...td, color: T.textMuted, fontFamily: FONT_DATA }}>{i + 1}</td>
                        <td style={td}><Cell label={`name for ${b.name}`} mono={false} w={124} value={b.name} onChange={(v) => patch((n) => { n.boats[i].name = v; })} /></td>
                        <td style={tdN}><Cell label={`length for ${b.name}`} w={54} value={plain(b.lengthFt * 10)} onChange={(v) => patch((n) => { n.boats[i].lengthFt = Math.round(toNumber(v) * 10); })} /></td>
                        <td style={tdN}><Cell label={`beam for ${b.name}`} w={54} value={plain(b.beamFt * 10)} onChange={(v) => patch((n) => { n.boats[i].beamFt = Math.round(toNumber(v) * 10); })} /></td>
                        <td style={{ ...tdN, color: T.textMuted }}>{b.footprint.toLocaleString()}</td>
                        <td style={{ ...td, fontWeight: 700, color: b.hauled ? A.good : A.bad, whiteSpace: 'nowrap' }}>
                          {b.hauled ? `lift ${b.lift}` : REASON[b.reason]}
                        </td>
                        <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <Btn small onClick={() => move(i, -1)}>↑</Btn>{' '}
                          <Btn small onClick={() => move(i, 1)}>↓</Btn>{' '}
                          <Btn small onClick={() => patch((n) => { n.boats.splice(i, 1); })}>×</Btn>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>

          <div>
            <Panel title="Your numbers" note="Every one of these is yours. The hours especially — this page knows nothing about the weather.">
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Field label="Minutes of lifting left" w={72} value={String(state.minutesLeft)}
                  hint={hoursLeft + ' hours'}
                  onChange={(v) => patch((s) => { s.minutesLeft = toNumber(v); })} />
                <Field label="Minutes per boat" w={62} value={String(state.cycleMinutes)}
                  onChange={(v) => patch((s) => { s.cycleMinutes = toNumber(v); })} />
                <Field label="Machines running" w={54} value={String(state.lifts)}
                  onChange={(v) => patch((s) => { s.lifts = toNumber(v); })} />
                <Field label="Ground you can block on" suffix="sq ft" w={78} value={String(state.yardSqFt)}
                  onChange={(v) => patch((s) => { s.yardSqFt = toNumber(v); })} />
                <Field label="Room around each hull" suffix="ft" w={54} value={String(state.padFt)}
                  hint="added to length and beam"
                  onChange={(v) => patch((s) => { s.padFt = toNumber(v); })} />
              </div>
              <div style={{ marginTop: 12 }}><Btn small onClick={reset}>Reset to the sample</Btn>{' '}<Btn small primary onClick={doExport}>{busy ? 'Building…' : 'Export the plan'}</Btn></div>
            </Panel>

            {r.staying.length > 0 && (
              <Panel title={`Staying in the water — ${r.staying.length}`} note="Named individually, because a count is not a phone call.">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {r.staying.map((b) => (
                      <tr key={b.id}>
                        <td style={td}>{b.name}<span style={{ display: 'block', fontSize: 11, color: T.textMuted }}>{(b.lengthFt / 10)}ft × {(b.beamFt / 10)}ft</span></td>
                        <td style={{ ...tdN, color: A.bad, fontWeight: 700 }}>{REASON[b.reason]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p style={{ margin: '12px 0 0', fontSize: 12.5, color: T.textSec, lineHeight: 1.6 }}>
                  {r.liftsShort > 0 && <>You are {r.liftsShort} {r.liftsShort === 1 ? 'lift' : 'lifts'} short of the whole list. </>}
                  {r.sqFtShort > 0 && <>You are {r.sqFtShort.toLocaleString()} square feet short of blocking them all. </>}
                  Another machine, an earlier start, or somewhere else to put them are the only
                  three answers, and this page has no view on which.
                </p>
              </Panel>
            )}

            <WontDo items={[
              'It knows nothing about the storm. Not the track, not the surge, not when the water comes up. The hours are yours from whatever you are watching.',
              'It will not tell you which boat should go first. That is contracts, relationships and judgement, and no arithmetic owns it.',
              'It counts hulls, cycles and square feet. It is not a lift plan, a rigging plan, or advice about whether to haul at all.',
            ]} />
          </div>
        </div>
      </div>
    </div>
  );
}
