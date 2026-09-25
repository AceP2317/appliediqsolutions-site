// ============================================================================
// DEADLINE FINDER — nine questions, and your own list of what is due when.
//
// NOT A TOOL ON THE SHELF, and the difference matters. Every tool at /work/
// computes from the visitor's own numbers and so cannot be wrong about the
// world. This one makes claims about the world, which rot on a calendar rather
// than on a code change, so every row it shows carries who published it, a live
// link, and when it was last read. See src/data/deadlines.ts.
//
// It is free, ungated, and there is no form. Same as the check.
//
// Built by Ian Provencher · AppliedIQ Solutions
// ============================================================================

import React, { useMemo, useState } from 'react';
import { QUESTIONS, DEADLINES, HELD } from '../data/deadlines';

export default function DeadlineFinder() {
  const [answers, setAnswers] = useState({});
  const [started, setStarted] = useState(false);

  const shown = useMemo(
    () => DEADLINES.filter((d) => d.appliesTo.some((k) => answers[k])),
    [answers],
  );
  const answered = Object.values(answers).filter(Boolean).length;

  const toggle = (id) => {
    setStarted(true);
    setAnswers((a) => ({ ...a, [id]: !a[id] }));
  };

  return (
    <div>
      <div class="panel" style={{ padding: '1.25rem' }}>
        <p class="mono-label">Nine questions</p>
        <p style={{ margin: '0.5rem 0 1rem', fontSize: '0.95rem', lineHeight: 1.6 }}>
          Tick whatever is true of your business. Nothing is sent anywhere and there is no form —
          the list below is built in your own browser as you answer.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {QUESTIONS.map((q) => (
            <button
              key={q.id}
              type="button"
              onClick={() => toggle(q.id)}
              aria-pressed={!!answers[q.id]}
              class={answers[q.id] ? 'btn btn-primary' : 'btn btn-secondary'}
              style={{ fontSize: '0.85rem', padding: '0.5rem 0.85rem' }}
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {started && (
        <div style={{ marginTop: '1.5rem' }}>
          <p class="mono-label">
            {shown.length === 0
              ? 'Nothing on this list applies yet'
              : `${shown.length} ${shown.length === 1 ? 'thing' : 'things'} on your list`}
          </p>

          {shown.length === 0 && answered > 0 && (
            <p style={{ marginTop: '0.75rem', fontSize: '0.95rem', lineHeight: 1.7 }}>
              Nothing here is triggered by what you have ticked. That is not the same as nothing
              being due — this page only carries the dates I could find a primary source for, and
              the two below are deliberately missing.
            </p>
          )}

          {shown.map((d) => (
            <article key={d.id} class="panel" style={{ marginTop: '0.85rem', padding: '1.1rem 1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>{d.what}</h3>
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.95rem', lineHeight: 1.65 }}>{d.when}</p>
              {d.teeth && (
                <p style={{ margin: '0.6rem 0 0', fontSize: '0.9rem', lineHeight: 1.6, fontWeight: 600 }}>
                  {d.teeth}
                </p>
              )}
              <p style={{ margin: '0.7rem 0 0', fontSize: '0.8rem', lineHeight: 1.6, opacity: 0.75 }}>
                {d.authority} ·{' '}
                <a href={d.source} target="_blank" rel="noopener noreferrer">read it there</a>{' '}
                · last checked {d.verified}
              </p>
            </article>
          ))}
        </div>
      )}

      <div class="panel" style={{ marginTop: '1.5rem', padding: '1.1rem 1.25rem' }}>
        <p class="mono-label">What is deliberately missing</p>
        <ul style={{ margin: '0.6rem 0 0', paddingLeft: '1.1rem', fontSize: '0.9rem', lineHeight: 1.7 }}>
          {HELD.map((h) => (
            <li key={h.what} style={{ marginBottom: '0.5rem' }}>
              <strong>{h.what}.</strong> {h.why}
            </li>
          ))}
        </ul>
        <p style={{ margin: '0.85rem 0 0', fontSize: '0.9rem', lineHeight: 1.7 }}>
          This is a list of published dates with links to whoever published them. It is not legal or
          tax advice, it is not complete, and which of these actually applies to your business is a
          conversation with your accountant rather than a page on my website.
        </p>
      </div>
    </div>
  );
}
