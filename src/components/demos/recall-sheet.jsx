// ============================================================================
// RECALL SHEET — Tidewater Family Dental, Marker Nine (portfolio demo)
//
// Who is past the interval you set, sorted by how far past. That is the whole
// job, and it is deliberately the whole job.
//
// One dental system charges $75 a month per location for this on top of a
// support fee, so a small practice on bare support is working a printed list by
// hand. The interval is the practice's own — six months for one patient, three
// for another, whatever they decided — which is the part that does not travel.
//
// THE FIELDS ARE A NAME, A WAY TO REACH THEM, AND A DATE. Nothing clinical,
// nothing diagnostic, nothing about why. A practice using this is keeping a call
// list rather than a record, and the field list is what keeps it that way. That
// is a design decision, not an oversight.
//
// IT SCORES NOBODY. No likelihood of booking, no ranking by value, no best time
// to call. Each of those is a guess about a person dressed as arithmetic, and a
// tool that sorts people by predicted profitability has become a different kind
// of thing than the one being sold here.
//
// Built by Ian Provencher · AppliedIQ Solutions
// Public demo — the practice and every person on the list are invented.
// ============================================================================

import React, { useMemo, useState } from 'react';
import { computeRecall } from '../../lib/recall.js';
import { T, A, FONT_DATA, Panel, Btn, Cell, Field, ToolHeader, Problems, WontDo, useRemembered, toNumber, uid, page, wrap, th, thN, td, tdN, exportRows, pageFor, Readout } from '../kit/shelf.jsx';

const PRACTICE = 'Tidewater Family Dental';

// ============================================================================
// THE SAMPLE — one call list at a made-up practice in a made-up town.
// The date is fixed rather than read from the clock, so the demo says the same
// thing today as it does next March.
// ============================================================================
const SAMPLE = {
  today: '2026-08-25',
  defaultInterval: 6,
  soonWindow: 30,
  people: [
    { id: 'q1', name: 'Ada Kittrell', contact: '252-555-0139', lastSeen: '2025-04-02', interval: null },
    { id: 'q2', name: 'Roy Beaufort', contact: '252-555-0177', lastSeen: '2025-06-18', interval: null },
    { id: 'q3', name: 'Neve Sowell', contact: 'neve@example.com', lastSeen: '2025-09-11', interval: null },
    { id: 'q4', name: 'Hal Duckworth', contact: '252-555-0104', lastSeen: '2025-11-30', interval: 3 },
    { id: 'q5', name: 'Marisol Vance', contact: '252-555-0192', lastSeen: '2026-01-14', interval: null },
    { id: 'q6', name: 'Trace Ellery', contact: 'trace@example.com', lastSeen: '2026-02-27', interval: null },
    { id: 'q7', name: 'Junie Mabry', contact: '252-555-0158', lastSeen: '2026-03-09', interval: null },
    { id: 'q8', name: 'Ott Bellamy', contact: '252-555-0121', lastSeen: '2026-05-21', interval: null },
    { id: 'q9', name: 'Lark Presnell', contact: '252-555-0166', lastSeen: '2026-07-02', interval: null },
  ],
};

const STATE_COLOR = { overdue: A.bad, 'due soon': A.warn, 'not yet': T.textMuted, 'no date': A.bad };

export default function RecallSheet({ mode = 'demo' }) {
  const { state, patch, reset, status, restored, pack } = useRemembered('recall-sheet', 1, SAMPLE, mode);
  const [busy, setBusy] = useState(false);
  const r = useMemo(() => computeRecall(state), [state]);

  const doExport = async () => {
    setBusy(true);
    try {
      await exportRows('recall-list.xlsx', 'Call list',
        [...r.overdue, ...r.soon].map((p) => ({
          Name: p.name, Contact: p.contact,
          Last_seen: p.lastSeen, Interval_months: p.interval,
          Due: p.due, Days_past: p.daysPast,
        })),
        [20, 22, 12, 16, 12, 11]);
    } finally { setBusy(false); }
  };

  const Row = ({ p }) => (
    <tr>
      <td style={td}>{p.name}<span style={{ display: 'block', fontSize: 11, color: T.textMuted }}>{p.contact || 'no contact on file'}</span></td>
      <td style={{ ...tdN, color: T.textMuted }}>{p.lastSeen || '—'}</td>
      <td style={tdN}>{p.interval}</td>
      <td style={{ ...tdN, color: T.textMuted }}>{p.due || '—'}</td>
      <td style={{ ...tdN, fontWeight: 700, color: STATE_COLOR[p.state] }}>
        {p.daysPast == null ? '—' : (p.daysPast > 0 ? p.daysPast + ' days past' : Math.abs(p.daysPast) + ' days to go')}
      </td>
    </tr>
  );

  return (
    <div style={pageFor("recall-sheet")} data-demo="recall-sheet">
      <ToolHeader toolId="recall-sheet" house={PRACTICE} occasion="sample list" name="Recall Sheet" status={status} restored={restored} pack={pack} remembers="call list">
        Who is past the interval you set, sorted by how far past. It holds a name, a way to reach
        them and a date, and nothing else — no notes, no reasons, no scoring. Nothing you type
        leaves this page.
      </ToolHeader>

      <Readout items={[
        { label: 'Past due', value: r.counts.overdue,
          tone: r.counts.overdue ? 'bad' : 'good',
          note: 'past the interval you set' },
        { label: 'Due soon', value: r.counts.soon,
          tone: r.counts.soon ? 'warn' : undefined,
          note: 'inside the next ' + r.soonWindow + ' days' },
        { label: 'Not yet', value: r.counts.notYet },
        { label: 'No date on file', value: r.counts.undated,
          tone: r.counts.undated ? 'warn' : undefined,
          note: r.counts.undated ? 'cannot be worked out' : 'everyone has a last visit' },
      ]} />

      <div style={wrap}>
        <Problems heading="Fix these before you work the list" items={r.problems} />

        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'minmax(0, 2fr) minmax(280px, 1fr)', alignItems: 'start' }}>
          <div>
            <Panel
              title={`Past due — ${r.counts.overdue}`}
              note="Furthest past first. The only ordering this applies comes from a date, never from a judgement about the person."
              right={<Btn small primary onClick={doExport}>{busy ? 'Building…' : 'Export the list'}</Btn>}
            >
              {r.overdue.length === 0 ? (
                <p style={{ margin: 0, fontSize: 13, color: T.textMuted }}>Nobody is past due. Nothing to work.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr><th style={th}>Name</th><th style={thN}>Last seen</th><th style={thN}>Every</th><th style={thN}>Was due</th><th style={thN}>How far</th></tr></thead>
                  <tbody>{r.overdue.map((p) => <Row key={p.id} p={p} />)}</tbody>
                </table>
              )}
            </Panel>

            <Panel title={`Coming up in the next ${state.soonWindow} days — ${r.counts.soon}`}>
              {r.soon.length === 0 ? (
                <p style={{ margin: 0, fontSize: 13, color: T.textMuted }}>Nobody falls due in that window.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr><th style={th}>Name</th><th style={thN}>Last seen</th><th style={thN}>Every</th><th style={thN}>Due</th><th style={thN}>How far</th></tr></thead>
                  <tbody>{r.soon.map((p) => <Row key={p.id} p={p} />)}</tbody>
                </table>
              )}
            </Panel>

            <Panel
              title="Everyone on the list"
              note="A blank interval uses the practice default. Put a number in to give one person their own."
              right={<Btn small onClick={() => patch((s) => { s.people.push({ id: uid('q'), name: 'New name', contact: '', lastSeen: '', interval: null }); })}>Add a person</Btn>}
            >
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
                  <thead><tr><th style={th}>Name</th><th style={th}>Phone or email</th><th style={th}>Last seen</th><th style={thN}>Every</th><th style={th} /></tr></thead>
                  <tbody>
                    {state.people.map((p, i) => (
                      <tr key={p.id}>
                        <td style={td}><Cell label={`name for ${p.name}`} mono={false} w={132} value={p.name} onChange={(v) => patch((n) => { n.people[i].name = v; })} /></td>
                        <td style={td}><Cell label={`phone or email for ${p.name}`} mono={false} w={150} value={p.contact} onChange={(v) => patch((n) => { n.people[i].contact = v; })} /></td>
                        <td style={td}><Cell label={`last seen for ${p.name}`} mono={false} w={100} placeholder="YYYY-MM-DD" value={p.lastSeen} onChange={(v) => patch((n) => { n.people[i].lastSeen = v; })} /></td>
                        <td style={tdN}><Cell label={`recall interval for ${p.name}`} w={48} placeholder="—" value={p.interval == null ? '' : String(p.interval)} onChange={(v) => patch((n) => { n.people[i].interval = v.trim() === '' ? null : toNumber(v); })} /></td>
                        <td style={{ ...td, textAlign: 'right' }}><Btn small onClick={() => patch((n) => { n.people.splice(i, 1); })}>×</Btn></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>

          <div>
            <Panel title="Where the list stands">
              <p style={{ margin: 0, fontSize: 40, fontWeight: 700, fontFamily: FONT_DATA, color: r.counts.overdue > 0 ? A.bad : A.good, lineHeight: 1.1 }}>
                {r.counts.overdue}
              </p>
              <p style={{ margin: '6px 0 0', fontSize: 12.5, color: T.textSec, lineHeight: 1.6 }}>
                past due as of {state.today}, with {r.counts.soon} falling due inside{' '}
                {state.soonWindow} days and {r.counts.notYet} not yet.
              </p>
            </Panel>

            <Panel title="Your rules" note="Both are the practice's own. Nothing here is filled in from anywhere else.">
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <Field label="Recall every" suffix="months" w={54}
                  value={String(state.defaultInterval)}
                  onChange={(v) => patch((s) => { s.defaultInterval = toNumber(v); })} />
                <Field label="Count as due soon within" suffix="days" w={54}
                  value={String(state.soonWindow)}
                  onChange={(v) => patch((s) => { s.soonWindow = toNumber(v); })} />
              </div>
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
                <Field label="Working the list on" w={124} value={state.today}
                  hint="fixed here so the sample reads the same every day"
                  onChange={(v) => patch((s) => { s.today = v; })} />
              </div>
              <Btn small onClick={reset}>Reset to the sample</Btn>
            </Panel>

            <WontDo items={[
              'It will not score anybody on how likely they are to book, or rank them by what they are worth. It sorts by a date and nothing else.',
              'It will not suggest a best time to call. That is a guess about a person wearing arithmetic.',
              'It holds a name, a contact and a date. No notes, no reasons, nothing clinical — this is a call list, not a record, and the fields are what keep it one.',
            ]} />
          </div>
        </div>
      </div>
    </div>
  );
}
