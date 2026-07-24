import { useState } from 'react';

/* ============================================================================
   AdminConsole — the private paste-to-publish console (mounted on /admin).
   Two tabs:
     • Blog  → POST /api/admin/blog                (your own posts/articles)
     • News  → POST /api/admin/news/analyze        (AI drafts from a URL/text)
              → POST /api/admin/news/publish       (after you review/edit)
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

/* ── Blog tab ───────────────────────────────────────────────────────────────
   Two-mode intake mirroring the News tab: paste a URL (or text) → AI drafts an
   editable post → review → publish. "From a link" drafts an ORIGINAL post that
   cites the source; "My own words" keeps your body verbatim and only fills the
   metadata. Both publish via POST /api/admin/blog. */
function emptyPost() {
  return { title: '', description: '', bodyText: '', kind: 'article', source: 'blog', sourceUrl: '', tags: '', draft: false, publishedAt: '' };
}
function BlogTab() {
  const [phase, setPhase] = useState('input'); // input | analyzing | draft | publishing | done
  const [mode, setMode] = useState('source');  // source | own
  const [src, setSrc] = useState({ url: '', text: '' });
  const [draft, setDraft] = useState(emptyPost());
  const [warnings, setWarnings] = useState([]);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const setD = (k) => (e) => setDraft((s) => ({ ...s, [k]: e.target?.type === 'checkbox' ? e.target.checked : e.target.value }));

  const analyze = async () => {
    setError('');
    if (mode === 'source' && !src.url.trim() && !src.text.trim()) { setError('Paste a URL to draft from, or paste the source text.'); return; }
    if (mode === 'own' && !src.text.trim()) { setError('Paste your post text.'); return; }
    setPhase('analyzing');
    const r = await postJson('/api/admin/blog/analyze', { url: src.url.trim(), text: src.text.trim(), mode });
    if (r.sessionExpired) { setResult(r); setPhase('done'); return; }
    if (!r.ok) { setError(r.data?.error || 'Drafting failed.'); setPhase('input'); return; }
    const d = r.data.draft;
    setDraft({
      title: d.title || '', description: d.description || '', bodyText: d.bodyText || '',
      kind: d.kind || 'article', source: d.source || 'blog', sourceUrl: d.sourceUrl || '',
      tags: (d.tags || []).join(', '), draft: false, publishedAt: '',
    });
    setWarnings(r.data.warnings || []);
    setPhase('draft');
  };

  const startManual = () => {
    setError('');
    setDraft({ ...emptyPost(), sourceUrl: src.url.trim(), bodyText: src.text.trim() });
    setWarnings([]);
    setPhase('draft');
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file || !/\.(md|markdown|txt)$/i.test(file.name)) return;
    const reader = new FileReader();
    reader.onload = () => setDraft((s) => ({ ...s, bodyText: String(reader.result || '') }));
    reader.readAsText(file);
  };

  const publish = async () => {
    setError('');
    setPhase('publishing');
    const payload = {
      title: draft.title, description: draft.description, bodyText: draft.bodyText,
      kind: draft.kind, source: draft.source, sourceUrl: draft.sourceUrl.trim(),
      tags: draft.tags.split(',').map((t) => t.trim()).filter(Boolean),
      draft: draft.draft, publishedAt: draft.publishedAt.trim(),
    };
    const r = await postJson('/api/admin/blog', payload);
    // Success or an expired session → the terminal Result screen. A recoverable
    // failure (422 firewall/validation, 409 slug, 413, 502, network) keeps the
    // draft so the operator can fix and retry — surface the reason inline.
    if (r.ok || r.sessionExpired) { setResult(r); setPhase('done'); return; }
    setError(r.data?.error || (r.networkError ? 'Network error — try again.' : `Publish failed${r.status ? ` (${r.status})` : ''}.`));
    setPhase('draft');
  };

  const reset = () => { setPhase('input'); setMode('source'); setSrc({ url: '', text: '' }); setDraft(emptyPost()); setWarnings([]); setError(''); setResult(null); };

  if (phase === 'done') return <Result result={result} onReset={reset} />;

  if (phase === 'input' || phase === 'analyzing') {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex gap-2" role="tablist" aria-label="Draft mode">
          {[['source', 'From a link'], ['own', 'My own words']].map(([k, label]) => (
            <button
              key={k}
              role="tab"
              aria-selected={mode === k}
              onClick={() => setMode(k)}
              className={`rounded-lg border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                mode === k ? 'border-accent bg-accent/10 text-ink' : 'border-line bg-surface text-ink-muted hover:border-line-2'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <p className="text-sm leading-relaxed text-ink-muted">
          {mode === 'source'
            ? 'Paste a link to something you found. It gets fetched and drafted into an original post in your voice — citing the source, never copying it — for you to edit before it publishes.'
            : 'Paste your own post (a LinkedIn or Nextdoor note). Your words stay verbatim; the AI just fills in a title, excerpt, and tags. Add the original URL to link the card out to it.'}
        </p>

        <Field label={mode === 'source' ? 'Source URL' : 'Original URL'} hint={mode === 'own' ? '(optional — the post you’re linking out to)' : undefined}>
          <input value={src.url} onChange={(e) => setSrc((s) => ({ ...s, url: e.target.value }))} placeholder="https://…" className={inputCls} />
        </Field>
        <Field
          label={mode === 'source' ? 'Or paste the source text' : 'Your post text'}
          hint={mode === 'source' ? '(fallback for paywalled / bot-walled pages)' : undefined}
        >
          <textarea rows={6} value={src.text} onChange={(e) => setSrc((s) => ({ ...s, text: e.target.value }))} className={inputCls} />
        </Field>

        {error && <p className="text-sm text-down" role="alert">{error}</p>}

        <div className="flex items-center gap-4">
          <button onClick={analyze} disabled={phase === 'analyzing'} className="btn btn-primary disabled:opacity-60">
            {phase === 'analyzing' ? 'Working…' : mode === 'source' ? 'Draft with AI' : 'Generate fields'}
          </button>
          <button type="button" onClick={startManual} className="text-xs text-cyan-deep">or fill it in manually →</button>
        </div>
      </div>
    );
  }

  // draft | publishing
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="mono-label text-up">Review the post</p>
        <button onClick={() => setPhase('input')} className="text-xs text-cyan-deep">← start over</button>
      </div>

      {warnings.length > 0 && (
        <ul className="rounded-lg border border-down/40 bg-down/5 p-3 text-xs text-down">
          {warnings.map((w, i) => <li key={i}>• {w}</li>)}
        </ul>
      )}

      <Field label={<>Title <Counter value={draft.title} max={90} /></>}>
        <input value={draft.title} onChange={setD('title')} className={inputCls} />
      </Field>

      <Field label={<>Excerpt / meta description <Counter value={draft.description} max={180} /></>}>
        <textarea rows={2} value={draft.description} onChange={setD('description')} className={inputCls} />
      </Field>

      <Field label="Body" hint="(markdown — drag a .md/.txt file onto the box to replace)">
        <textarea
          rows={12}
          value={draft.bodyText}
          onChange={setD('bodyText')}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`${inputCls} font-mono ${dragOver ? 'ring-2 ring-accent/60' : ''}`}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Kind">
          <select value={draft.kind} onChange={setD('kind')} className={inputCls}>
            {BLOG_KINDS.map((k) => (
              <option key={k} value={k}>{k}{k === 'article' ? ' — gets its own /blog/… page' : ' — stream card, links out'}</option>
            ))}
          </select>
        </Field>
        <Field label="Source">
          <select value={draft.source} onChange={setD('source')} className={inputCls}>
            {BLOG_SOURCES.map((s) => (
              <option key={s} value={s}>{s}{s === 'blog' ? ' — authored here' : ' — syndicated, needs a URL'}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Original URL" hint="(the link-out — required for a non-blog source)">
        <input value={draft.sourceUrl} onChange={setD('sourceUrl')} placeholder="https://www.linkedin.com/posts/…" className={inputCls} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Tags" hint="(comma-separated)">
          <input value={draft.tags} onChange={setD('tags')} placeholder="mrp, building-in-public" className={inputCls} />
        </Field>
        <Field label="Published at" hint="(optional — defaults to now, ET)">
          <input value={draft.publishedAt} onChange={setD('publishedAt')} placeholder="2026-07-07T14:32:00-04:00" className={inputCls} />
        </Field>
      </div>

      <label className="flex items-center gap-2.5 text-sm text-ink-muted">
        <input type="checkbox" checked={draft.draft} onChange={setD('draft')} className="h-4 w-4 rounded border-line" />
        Save as draft (commits, but hidden in production until you unset it)
      </label>

      {error && <p className="text-sm text-down" role="alert">{error}</p>}

      <div className="flex items-center gap-4">
        <button onClick={publish} disabled={phase === 'publishing'} className="btn btn-primary disabled:opacity-60">
          {phase === 'publishing' ? 'Publishing…' : 'Publish post'}
        </button>
        <span className="text-xs text-ink-faint">Firewall-checked, then committed. Live ~1 min after.</span>
      </div>
    </div>
  );
}

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

export default function AdminConsole() {
  const [tab, setTab] = useState('blog');
  return (
    <div>
      <div className="mb-6 flex gap-2" role="tablist">
        {[['blog', 'Blog post'], ['news', 'News story']].map(([k, label]) => (
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
      {tab === 'blog' ? <BlogTab /> : <NewsTab />}
    </div>
  );
}
