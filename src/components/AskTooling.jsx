import { useEffect, useRef, useState } from 'react';

/* ============================================================================
   AskTooling — the "put a real question to the tooling, live" chat island.
   Posts the running conversation to the Cloudflare Worker (POST /api/ask),
   which streams a reply from the Anthropic API in Ian's locked v0.3 voice.
   The response is a plain-text stream (the Worker parses Anthropic's SSE and
   relays only text), so the client just reads chunks and appends them.

   Browser-first: mounted client:only. No lead is ever lost — on any failure the
   assistant bubble points to Contact.
   ============================================================================ */

const ENDPOINT = import.meta.env.PUBLIC_ASK_ENDPOINT || '/api/ask';
const MAX_CHARS = 2000; // per message (client-side; the Worker caps at 4000)
const MAX_TURNS = 18; // stop the visitor a little before the Worker's tail cap
const STORE_KEY = 'aiq-ask-transcript'; // sessionStorage — per-tab, dies with the tab

const INTRO =
  'Ask about the tools, how Ian builds, or the operational problem your software never solved. I qualify and orient — Ian closes.';

const SUGGESTIONS = [
  'Is this real, or just a demo?',
  'What can you build for my operation?',
  'What does it cost?',
];

// ── Minimal markdown for the assistant's light formatting ────────────────────
// Handles **bold**, [text](url) links, bare URLs/emails, and - / * bullets +
// numbered lines. Renders to React nodes (never dangerouslySetInnerHTML), so all
// text is escaped by React; hrefs are scheme-allowlisted. Kept tiny + dependency
// -free — the v0.3 voice is prose-default, so this only dresses the occasional
// list or bolded term.
function inlineNodes(text, keyBase) {
  const out = [];
  const re =
    /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)|(https?:\/\/[^\s<]+)|([^\s@]+@[^\s@]+\.[^\s@]+)/g;
  const safeHref = (h) => (/^(https?:|mailto:|\/|#)/i.test(h) ? h : '#');
  const link = (label, href, key) => {
    const external = /^https?:/i.test(href);
    return (
      <a
        key={key}
        href={safeHref(href)}
        className="text-cyan-deep underline-offset-4 hover:underline"
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {label}
      </a>
    );
  };
  let last = 0;
  let i = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1] !== undefined) {
      out.push(<strong key={`${keyBase}-b${i}`}>{m[1]}</strong>);
    } else if (m[2] !== undefined) {
      out.push(link(m[2], m[3], `${keyBase}-l${i}`));
    } else {
      // bare URL (m[4]) or email (m[5]) — don't swallow trailing sentence punctuation
      let val = m[4] ?? m[5];
      let trail = '';
      const tm = /[.,;:!?)]+$/.exec(val);
      if (tm) {
        trail = tm[0];
        val = val.slice(0, -trail.length);
      }
      out.push(link(val, m[4] ? val : `mailto:${val}`, `${keyBase}-x${i}`));
      if (trail) out.push(trail);
    }
    last = re.lastIndex;
    i++;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function Markdown({ text }) {
  const blocks = [];
  let para = [];
  let items = null;
  const flushPara = () => {
    if (para.length) blocks.push({ t: 'p', text: para.join(' ') });
    para = [];
  };
  const flushList = () => {
    if (items) blocks.push({ t: 'ul', items });
    items = null;
  };
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    const bullet = /^[-*]\s+(.*)$/.exec(line);
    if (bullet) {
      flushPara();
      if (!items) items = [];
      items.push(bullet[1]);
    } else if (line === '') {
      flushPara();
      flushList();
    } else if (/^\d+\.\s+/.test(line)) {
      // numbered line → its own paragraph so the number is preserved
      flushPara();
      flushList();
      blocks.push({ t: 'p', text: line });
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara();
  flushList();

  return (
    <>
      {blocks.map((b, i) =>
        b.t === 'ul' ? (
          <ul key={i} className={`ml-4 flex list-disc flex-col gap-1 ${i > 0 ? 'mt-2' : ''}`}>
            {b.items.map((it, j) => (
              <li key={j}>{inlineNodes(it, `${i}-${j}`)}</li>
            ))}
          </ul>
        ) : (
          <p key={i} className={i > 0 ? 'mt-2' : ''}>
            {inlineNodes(b.text, `p${i}`)}
          </p>
        )
      )}
    </>
  );
}

export default function AskTooling() {
  // { role: 'user' | 'assistant', content, error? } — restored from the per-tab
  // sessionStorage transcript (privacy-clean: no cookie, dies with the tab), so
  // a reload or a hop between pages doesn't hard-reset the conversation. A
  // trailing turn left dangling by an interrupted stream is dropped.
  const [turns, setTurns] = useState(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORE_KEY) || '[]');
      if (!Array.isArray(saved)) return [];
      const valid = saved.filter(
        (t) => t && (t.role === 'user' || t.role === 'assistant') && typeof t.content === 'string'
      );
      // Drop failed exchanges wholesale (the error bubble AND the question that
      // caused it) so a restored transcript never replays fallback text into
      // the model's context or breaks user/assistant alternation.
      const clean = [];
      for (const t of valid) {
        if (t.error) {
          if (clean.length && clean[clean.length - 1].role === 'user') clean.pop();
          continue;
        }
        clean.push(t);
      }
      while (
        clean.length &&
        ((clean[clean.length - 1].role === 'assistant' && !clean[clean.length - 1].content) ||
          clean[clean.length - 1].role === 'user')
      ) {
        clean.pop();
      }
      return clean;
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const rootRef = useRef(null);

  // Keep the newest message in view as it streams.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns, streaming]);

  // Persist settled transcripts only (never a mid-stream stub).
  useEffect(() => {
    if (streaming) return;
    try {
      sessionStorage.setItem(STORE_KEY, JSON.stringify(turns));
    } catch {
      /* storage unavailable (private mode etc.) — the chat still works */
    }
  }, [turns, streaming]);

  // ?ask= deep link (the per-tool "Ask about this" chips) — pre-seeds the input
  // and NEVER auto-sends: the visitor stays in control of every request.
  // Chrome races the initial #ask fragment scroll against smooth-scroll CSS and
  // island hydration and can land at the top of the page (observed on prod) —
  // so when a prefill fires, the widget brings itself into view.
  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search).get('ask');
      if (q) {
        setInput(q.trim().slice(0, 300));
        // behavior:'instant' so the site's smooth-scroll CSS can't leave the
        // jump interruptible, and two settled retries because Chrome's own
        // load-time fragment handling can reset the scroll after a single
        // early attempt (observed on production).
        const bring = () => rootRef.current?.scrollIntoView({ block: 'center', behavior: 'instant' });
        requestAnimationFrame(bring);
        const t1 = setTimeout(bring, 350);
        const t2 = setTimeout(bring, 1000);
        return () => {
          clearTimeout(t1);
          clearTimeout(t2);
        };
      }
    } catch {
      /* no-op */
    }
  }, []);

  const send = async (text) => {
    const q = (text || '').trim();
    if (!q || streaming) return;

    const base = [...turns, { role: 'user', content: q.slice(0, MAX_CHARS) }];
    setTurns([...base, { role: 'assistant', content: '' }]);
    setInput('');
    setStreaming(true);

    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: base }),
      });
      if (!res.ok || !res.body) throw new Error('bad response');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setTurns([...base, { role: 'assistant', content: acc }]);
      }
      if (!acc.trim()) throw new Error('empty');
    } catch {
      setTurns([
        ...base,
        {
          role: 'assistant',
          error: true,
          content:
            'The live assistant is having a moment. Email contact@appliediqsolutions.com — Ian reads every message himself and replies within about a business day.',
        },
      ]);
    } finally {
      setStreaming(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    send(input);
  };

  const empty = turns.length === 0;
  const atLimit = turns.filter((t) => t.role === 'user').length >= MAX_TURNS;

  return (
    <div ref={rootRef} className="panel mt-10 flex flex-col overflow-hidden">
      {/* Header — reads like the live-tool badge */}
      <div className="border-b border-line bg-surface-2 px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <span className="status-dot"></span>
          <span className="mono-label">Ask the tooling · live</span>
        </div>
        <p className="mono-label text-ink-faint mt-1.5 leading-relaxed">
          AI Sonnet 5 · effort low · adaptive thinking off · prompt caching on
        </p>
      </div>

      {/* Transcript */}
      <div
        ref={scrollRef}
        className="flex max-h-[26rem] min-h-[15rem] flex-col gap-4 overflow-y-auto p-5"
        aria-live="polite"
      >
        <div className="flex flex-col gap-1.5">
          <span className="mono-label text-cyan-deep">Assistant</span>
          <p className="leading-relaxed text-ink-muted">{INTRO}</p>
        </div>

        {turns.map((t, i) => {
          const isUser = t.role === 'user';
          const isLast = i === turns.length - 1;
          return (
            <div key={i} className="flex flex-col gap-1.5">
              <span className={`mono-label ${isUser ? 'text-ink-faint' : 'text-cyan-deep'}`}>
                {isUser ? 'You' : 'Assistant'}
              </span>
              <div className={`leading-relaxed ${t.error ? 'text-down' : 'text-ink'}`}>
                {isUser || t.error ? (
                  <p className="whitespace-pre-wrap">{t.content}</p>
                ) : t.content ? (
                  <Markdown text={t.content} />
                ) : (
                  streaming && isLast && <span className="text-ink-faint">…</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Suggestion chips — only before the first question */}
      {empty && (
        <div className="flex flex-wrap gap-2 px-5 pb-4">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs text-ink-muted transition-colors hover:border-accent/50 hover:text-ink"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input + disclaimer */}
      <div className="border-t border-line bg-surface-2 p-3">
        <form onSubmit={onSubmit} className="flex items-center gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={MAX_CHARS}
            disabled={streaming || atLimit}
            placeholder={
              atLimit
                ? 'Take it to Contact — Ian reads every message himself.'
                : 'Ask about the tools, the work, or your problem…'
            }
            aria-label="Ask the live assistant a question"
            className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-line-2 focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={streaming || atLimit || !input.trim()}
            className="btn btn-primary shrink-0 disabled:opacity-50"
          >
            {streaming ? 'Thinking…' : 'Ask'}
          </button>
        </form>
        <p className="mt-2.5 px-1 text-xs text-ink-faint">
          An AI in Ian’s voice — it can be wrong, and it doesn’t set price or scope. For a real
          quote or a commitment,{' '}
          <a href="/contact/" className="text-cyan-deep">
            reach Ian directly
          </a>
          .
        </p>
      </div>
    </div>
  );
}
