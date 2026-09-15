import { useState } from 'react';

/* ============================================================================
   AdminConsole — the private paste-to-publish console (mounted on /admin).
   Two tabs:
     • News  → POST /api/admin/news/analyze        (AI drafts from a URL/text)
              → POST /api/admin/news/publish       (after you review/edit)
     • Meet  → POST /api/meet/create               (a room, plus its invite text)
   THE BLOG TAB AND ITS TWO ROUTES WERE REMOVED 2026-08-24 with the blog. This
   comment said "Blog + News" until 2026-09-03, which is a stale map sitting at
   the top of the file it describes.
   Same-origin fetches, so Cloudflare Access's CF_Authorization cookie rides
   along automatically — the client never handles a token. The Worker validates,
   firewall-scans, and commits to the repo; CI + the gate do the rest.
   ============================================================================ */

const inputCls =
  'w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-line-2 focus:outline-none focus:ring-2 focus:ring-accent/40';

const BLOG_KINDS = ['article', 'post', 'comment', 'reply', 'mention', 'review', 'news'];
const BLOG_SOURCES = ['blog', 'linkedin', 'nextdoor', 'press'];

// POST JSON and normalize the outcome. An expired Access session answers a fetch
// with the login HTML instead of our JSON — detect that and ask for a reload.
async function postJson(endpoint, payload) {
  let res;
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    return { networkError: true };
  }
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    // Access login page / redirect, or an unexpected non-JSON error.
    return { sessionExpired: res.status === 200 || res.redirected, status: res.status };
  }
  let data = {};
  try { data = await res.json(); } catch { /* ignore */ }
  return { ok: res.ok, status: res.status, data };
}

function Field({ label, hint, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="mono-label">
        {label}
        {hint && <span className="ml-1.5 normal-case tracking-normal text-ink-faint">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

function Counter({ value, min, max }) {
  const n = (value || '').length;
  const ok = n >= (min || 0) && n <= max;
  return (
    <span className={`text-xs ${ok ? 'text-ink-faint' : 'text-down'}`}>
      {n}
      {min ? `/${min}–${max}` : `/${max}`}
    </span>
  );
}

function Result({ result, onReset }) {
  if (result.sessionExpired) {
    return (
      <div className="panel p-6" role="alert">
        <p className="mono-label text-down">Session expired</p>
        <p className="mt-2 text-sm text-ink-muted">
          Your Cloudflare Access session timed out.{' '}
          <button onClick={() => window.location.reload()} className="font-medium text-cyan-deep underline">
            Reload to sign in
          </button>{' '}
          and try again.
        </p>
      </div>
    );
  }
  if (result.ok) {
    return (
      <div className="panel flex flex-col items-start gap-3 p-6" role="status" aria-live="polite">
        <span className="mono-label text-up">Committed</span>
        <p className="text-sm text-ink-muted">
          <strong className="text-ink">{result.data.deployNote}</strong>{' '}
          {result.data.draft ? '(saved as a draft — hidden in production until you unset draft.) ' : ''}
          <code className="text-xs text-ink-faint">{result.data.path}</code>
        </p>
        {result.data.commitUrl && (
          <a href={result.data.commitUrl} target="_blank" rel="noopener" className="text-sm font-medium text-cyan-deep">
            View commit → watch the deploy
          </a>
        )}
        <button onClick={onReset} className="btn btn-secondary mt-1">Publish another</button>
      </div>
    );
  }
  return (
    <div className="panel p-6" role="alert">
      <p className="mono-label text-down">Not published</p>
      <p className="mt-2 text-sm text-ink-muted">
        {result.networkError ? 'Network error — try again.' : result.data?.error || `Something went wrong (${result.status}).`}
      </p>
      <button onClick={onReset} className="btn btn-secondary mt-3">Back</button>
    </div>
  );
}

/* THE BLOG TAB WAS REMOVED 2026-08-24 with the blog itself.
   Left in place it would have accepted a post and committed markdown into a
   deleted directory: the build ignores it, nothing errors, and the only
   symptom is a post that never appears anywhere.

   The first attempt at this removal used a blanket find-and-replace on the
   string 'blog', which also ate `source: 'blog',` out of two object literals
   and left a file that would not parse. A component comes out by brace
   counting, never by deleting a word wherever it appears. */

/* ── News tab ───────────────────────────────────────────────────────────────*/
function emptyDraft() {
  return { title: '', summary: '', implications: '', angle: '', tier: 'standard', spotlight: false, tags: '', sources: [{ name: '', url: '' }], publishedAt: '' };
}
function NewsTab() {
  const [phase, setPhase] = useState('input'); // input | analyzing | draft | publishing | done
  const [src, setSrc] = useState({ url: '', text: '' });
  const [draft, setDraft] = useState(emptyDraft());
  const [warnings, setWarnings] = useState([]);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const setD = (k) => (e) => setDraft((s) => ({ ...s, [k]: e.target?.type === 'checkbox' ? e.target.checked : e.target.value }));

  const analyze = async () => {
    setError('');
    if (!src.url.trim() && !src.text.trim()) { setError('Paste a URL or the article text.'); return; }
    setPhase('analyzing');
    const r = await postJson('/api/admin/news/analyze', { url: src.url.trim(), text: src.text.trim() });
    if (r.sessionExpired) { setResult(r); setPhase('done'); return; }
    if (!r.ok) { setError(r.data?.error || 'Analysis failed.'); setPhase('input'); return; }
    const d = r.data.draft;
    setDraft({
      title: d.title || '', summary: d.summary || '', implications: d.implications || '', angle: d.angle || '',
      tier: d.tier || 'standard', spotlight: false, tags: (d.tags || []).join(', '),
      sources: d.sources?.length ? d.sources : [{ name: '', url: '' }], publishedAt: '',
    });
    setWarnings(r.data.warnings || []);
    setPhase('draft');
  };

  const setSource = (i, k) => (e) => setDraft((s) => {
    const sources = s.sources.map((row, idx) => (idx === i ? { ...row, [k]: e.target.value } : row));
    return { ...s, sources };
  });
  const addSource = () => setDraft((s) => ({ ...s, sources: [...s.sources, { name: '', url: '' }] }));
  const removeSource = (i) => setDraft((s) => ({ ...s, sources: s.sources.filter((_, idx) => idx !== i) }));

  const publish = async () => {
    setError('');
    setPhase('publishing');
    const payload = {
      ...draft,
      tags: draft.tags.split(',').map((t) => t.trim()).filter(Boolean),
      sources: draft.sources.filter((s) => s.name.trim() || s.url.trim()),
    };
    const r = await postJson('/api/admin/news/publish', payload);
    // Success or an expired session → the terminal Result screen. A recoverable
    // failure (422 firewall/validation, 409 slug, 413, 502, network) keeps the
    // draft so the operator can fix and retry — surface the reason inline.
    if (r.ok || r.sessionExpired) { setResult(r); setPhase('done'); return; }
    setError(r.data?.error || (r.networkError ? 'Network error — try again.' : `Publish failed${r.status ? ` (${r.status})` : ''}.`));
    setPhase('draft');
  };

  if (phase === 'done') return <Result result={result} onReset={() => { setPhase('input'); setSrc({ url: '', text: '' }); setDraft(emptyDraft()); setWarnings([]); setResult(null); }} />;

  if (phase === 'input' || phase === 'analyzing') {
    return (
      <div className="flex flex-col gap-6">
        <p className="text-sm leading-relaxed text-ink-muted">
          Paste a link to an article you found. It gets fetched and analyzed into a draft — the same
          write-up the daily pipeline produces — for you to review and edit before it publishes.
        </p>
        <Field label="Article URL">
          <input value={src.url} onChange={(e) => setSrc((s) => ({ ...s, url: e.target.value }))} placeholder="https://…" className={inputCls} />
        </Field>
        <Field label="Or paste the article text" hint="(fallback for paywalled / bot-walled pages)">
          <textarea rows={6} value={src.text} onChange={(e) => setSrc((s) => ({ ...s, text: e.target.value }))} className={inputCls} />
        </Field>
        {error && <p className="text-sm text-down" role="alert">{error}</p>}
        <div>
          <button onClick={analyze} disabled={phase === 'analyzing'} className="btn btn-primary disabled:opacity-60">
            {phase === 'analyzing' ? 'Analyzing…' : 'Analyze'}
          </button>
        </div>
      </div>
    );
  }

  // draft | publishing
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="mono-label text-up">Review the draft</p>
        <button onClick={() => setPhase('input')} className="text-xs text-cyan-deep">← start over</button>
      </div>

      {warnings.length > 0 && (
        <ul className="rounded-lg border border-down/40 bg-down/5 p-3 text-xs text-down">
          {warnings.map((w, i) => <li key={i}>• {w}</li>)}
        </ul>
      )}

      <Field label={<>Title <Counter value={draft.title} min={10} max={90} /></>}>
        <input value={draft.title} onChange={setD('title')} className={inputCls} />
      </Field>
      <Field label={<>Summary <Counter value={draft.summary} min={120} max={700} /></>}>
        <textarea rows={4} value={draft.summary} onChange={setD('summary')} className={inputCls} />
      </Field>
      <Field label={<>Why it matters <Counter value={draft.implications} min={60} max={500} /></>}>
        <textarea rows={3} value={draft.implications} onChange={setD('implications')} className={inputCls} />
      </Field>
      <Field label={<>The AppliedIQ angle <span className="ml-1.5 normal-case tracking-normal text-ink-faint">(optional — clear it if not genuinely earned)</span> {draft.angle && <Counter value={draft.angle} min={40} max={400} />}</>}>
        <textarea rows={3} value={draft.angle} onChange={setD('angle')} className={inputCls} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Tier">
          <select value={draft.tier} onChange={setD('tier')} className={inputCls}>
            <option value="standard">standard — lives 14 days</option>
            <option value="major">major — lives 21 days, gets a chip</option>
          </select>
        </Field>
        <Field label="Tags" hint="(comma-separated)">
          <input value={draft.tags} onChange={setD('tags')} className={inputCls} />
        </Field>
      </div>

      <div>
        <span className="mono-label">Sources <span className="ml-1.5 normal-case tracking-normal text-ink-faint">(1–4)</span></span>
        <div className="mt-2 flex flex-col gap-2">
          {draft.sources.map((s, i) => (
            <div key={i} className="flex gap-2">
              <input value={s.name} onChange={setSource(i, 'name')} placeholder="Publisher" className={`${inputCls} sm:max-w-[12rem]`} />
              <input value={s.url} onChange={setSource(i, 'url')} placeholder="https://…" className={inputCls} />
              {draft.sources.length > 1 && (
                <button type="button" onClick={() => removeSource(i)} className="shrink-0 px-2 text-ink-faint hover:text-down" aria-label="Remove source">✕</button>
              )}
            </div>
          ))}
          {draft.sources.length < 4 && (
            <button type="button" onClick={addSource} className="self-start text-xs text-cyan-deep">+ add source</button>
          )}
        </div>
      </div>

      <label className="flex items-center gap-2.5 text-sm text-ink-muted">
        <input type="checkbox" checked={draft.spotlight} onChange={setD('spotlight')} className="h-4 w-4 rounded border-line" />
        Spotlight this story (the newest spotlight wins on the page)
      </label>

      {error && <p className="text-sm text-down" role="alert">{error}</p>}

      <div className="flex items-center gap-4">
        <button onClick={publish} disabled={phase === 'publishing'} className="btn btn-primary disabled:opacity-60">
          {phase === 'publishing' ? 'Publishing…' : 'Publish story'}
        </button>
        <span className="text-xs text-ink-faint">Firewall-checked, then committed. Live ~1 min after.</span>
      </div>
    </div>
  );
}

/* ── Meeting room tab ───────────────────────────────────────────────────────
   One button. It POSTs to /api/meet/create, which is the ONLY caller of
   createMeetingRoom() today; the booking flow will be the second and a
   permanent drop-in room the third. Nothing about the room is configurable
   here on purpose — a scoping call does not need options, and every knob
   added now is a knob the booking flow would have to reproduce. */
function MeetingTab() {
  const [state, setState] = useState('idle'); // idle | working | done | error
  const [room, setRoom] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  async function create() {
    setState('working');
    setError('');
    setCopied(false);
    const r = await postJson('/api/meet/create', {});
    if (r.networkError) { setError('Network error — try again.'); setState('error'); return; }
    if (r.sessionExpired) { setError('Your Cloudflare Access session timed out. Reload to sign in.'); setState('error'); return; }
    if (!r.ok) { setError(r.data?.error || `Something went wrong (${r.status}).`); setState('error'); return; }
    setRoom(r.data);
    setState('done');
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(room.guestUrl);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="max-w-2xl text-sm leading-relaxed text-ink-muted">
        Makes one private room and a link to paste into your reply. The client waits on a holding
        screen until you admit them; you walk straight in, because your Access session gets you an
        owner pass. The link stops working after 14 days.
      </p>

      <div>
        <button onClick={create} disabled={state === 'working'} className="btn btn-primary">
          {state === 'working' ? 'Creating…' : 'New client room'}
        </button>
      </div>

      {state === 'error' && (
        <div className="panel p-6" role="alert">
          <p className="mono-label text-down">Not created</p>
          <p className="mt-2 text-sm text-ink-muted">{error}</p>
        </div>
      )}

      {state === 'done' && room && (
        <div className="panel flex flex-col items-start gap-3 p-6" role="status" aria-live="polite">
          <span className="mono-label text-up">Room ready · {room.room}</span>
          <code className="w-full break-all rounded-lg border border-line bg-surface px-3 py-2 text-xs text-ink">
            {room.guestUrl}
          </code>
          <div className="flex flex-wrap gap-2">
            <button onClick={copy} className="btn btn-secondary">
              {copied ? 'Copied' : 'Copy link'}
            </button>
            <a href={room.guestUrl} target="_blank" rel="noopener" className="btn btn-secondary">
              Open it myself
            </a>
          </div>
          {room.expiresAt && (
            <p className="text-xs text-ink-faint">
              Expires {new Date(room.expiresAt).toLocaleString()} — after that the link is dead, so an
              old one in someone&rsquo;s inbox cannot be reused.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminConsole() {
  const [tab, setTab] = useState('news');
  return (
    <div>
      <div className="mb-6 flex gap-2" role="tablist">
        {[['news', 'News story'], ['meet', 'Meeting room']].map(([k, label]) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              tab === k ? 'border-accent bg-accent/10 text-ink' : 'border-line bg-surface text-ink-muted hover:border-line-2'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {/* THE TAB STATE WAS DEAD UNTIL NOW. With one tab, <NewsTab /> rendered
          unconditionally and `tab` changed nothing — harmless with a single
          entry, and a silent bug the moment a second one arrived. */}
      {tab === 'news' ? <NewsTab /> : <MeetingTab />}
    </div>
  );
}
