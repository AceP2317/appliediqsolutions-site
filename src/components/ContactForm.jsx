import { useEffect, useRef, useState } from 'react';

/* ============================================================================
   ContactForm — the engagement hub's intent-routed intake.
   Pick an intent (quote / consult / inquiry); the fields adapt. The centerpiece
   is always the operator's diagnostic prompt: the problem your software never
   solved.

   Backend: posts JSON to import.meta.env.PUBLIC_CONTACT_ENDPOINT when set
   (e.g. a Cloudflare Worker). With no endpoint configured it composes a
   structured mailto: so the form works today with zero backend, and upgrades
   to a real POST by setting one env var — no code change.
   ============================================================================ */

const EMAIL = 'contact@appliediqsolutions.com';
// Posts to the Cloudflare Worker by default; override at build time if needed.
const ENDPOINT = import.meta.env.PUBLIC_CONTACT_ENDPOINT || '/api/contact';
// Optional Cloudflare Turnstile — the widget only renders when a site key is set.
const TURNSTILE_SITEKEY = import.meta.env.PUBLIC_TURNSTILE_SITEKEY || '';

const INTENTS = [
  { key: 'quote', label: 'Request a quote', blurb: 'A defined build — scope, timeline, a number.' },
  { key: 'consult', label: 'Request a consult', blurb: 'A working session to pressure-test it. The first one is free.' },
  { key: 'inquiry', label: 'General inquiry', blurb: 'Anything else — open-ended.' },
];

const inputCls =
  'w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-line-2 focus:outline-none focus:ring-2 focus:ring-accent/40';

function Field({ id, label, children, optional }) {
  return (
    <label htmlFor={id} className="flex flex-col gap-1.5">
      <span className="mono-label">
        {label}
        {optional && <span className="ml-1.5 normal-case tracking-normal text-ink-faint">(optional)</span>}
      </span>
      {children}
    </label>
  );
}

export default function ContactForm() {
  const [intent, setIntent] = useState('quote');
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error
  const [method, setMethod] = useState('posted'); // posted | mailto
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    problem: '',
    system: '',
    scope: '',
    timeline: '',
    budget: '',
    times: '',
    website: '', // honeypot — real people leave this empty
  });

  // Deep-link support: /contact?intent=quote|consult|inquiry pre-selects the intent
  // (e.g. the Services page "Request a quote" CTA). Client-only — window is unset in SSR.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('intent');
    if (q && INTENTS.some((i) => i.key === q)) setIntent(q);
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const intentLabel = INTENTS.find((i) => i.key === intent).label;

  // Render the Turnstile widget (only when a site key is configured).
  const [tsToken, setTsToken] = useState('');
  const tsRef = useRef(null);
  useEffect(() => {
    if (!TURNSTILE_SITEKEY) return;
    const SCRIPT_ID = 'cf-turnstile-script';
    const render = () => {
      const el = tsRef.current;
      if (window.turnstile && el && !el.dataset.rendered) {
        window.turnstile.render(el, {
          sitekey: TURNSTILE_SITEKEY,
          callback: (t) => setTsToken(t),
          'error-callback': () => setTsToken(''),
          'expired-callback': () => setTsToken(''),
        });
        el.dataset.rendered = '1';
      }
    };
    if (document.getElementById(SCRIPT_ID)) {
      render();
      return;
    }
    const s = document.createElement('script');
    s.id = SCRIPT_ID;
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    s.async = true;
    s.defer = true;
    s.onload = render;
    document.head.appendChild(s);
  }, []);

  const buildSummary = () => {
    const L = [];
    L.push(`Intent: ${intentLabel}`);
    L.push(`Name: ${form.name}`);
    L.push(`Email: ${form.email}`);
    if (form.company) L.push(`Company: ${form.company}`);
    L.push('', 'The problem your software never solved:', form.problem);
    if (intent === 'quote') {
      L.push('');
      if (form.system) L.push(`System that leaves the gap: ${form.system}`);
      if (form.scope) L.push(`Rough scope: ${form.scope}`);
      if (form.timeline) L.push(`Timeline: ${form.timeline}`);
      if (form.budget) L.push(`Budget range: ${form.budget}`);
    }
    if (intent === 'consult' && form.times) {
      L.push('', `Preferred times: ${form.times}`);
    }
    return L.join('\n');
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.website) {
      setStatus('success'); // honeypot tripped — pretend success, send nothing
      return;
    }
    if (!form.name.trim() || !form.email.trim() || !form.problem.trim()) {
      setError('Add your name, email, and a line on the problem and I’ll take it from there.');
      return;
    }

    setStatus('submitting');
    const { website, ...rest } = form;
    const payload = { intent, intentLabel, ...rest, turnstileToken: tsToken, summary: buildSummary() };

    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('bad response');
      setMethod('posted');
      setStatus('success');
    } catch {
      // Never lose a lead: if the backend isn't reachable (or isn't configured
      // yet), hand the message off to the visitor's mail client.
      const subject = `AppliedIQ — ${intentLabel}`;
      window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(buildSummary())}`;
      setMethod('mailto');
      setStatus('success');
    }
  };

  if (status === 'success') {
    return (
      <div className="panel flex flex-col items-start gap-3 p-8" role="status" aria-live="polite">
        <span className="mono-label text-up">Message ready</span>
        <h2 className="font-display text-2xl font-semibold text-ink">
          {method === 'mailto' ? 'Your message is queued in your email app.' : 'Got it — thank you.'}
        </h2>
        <p className="max-w-md leading-relaxed text-ink-muted">
          {method === 'mailto'
            ? 'I just opened it in your mail client — hit send and it comes straight to me. I read every message myself and reply within one business day.'
            : 'It comes straight to me — no sales team in between. I read every message myself and reply within one business day.'}
        </p>
        <a href={`mailto:${EMAIL}`} className="mt-1 inline-flex items-center gap-2 text-sm font-medium text-cyan-deep">
          {EMAIL} <span aria-hidden="true">→</span>
        </a>
      </div>
    );
  }

  const submitting = status === 'submitting';

  return (
    <form onSubmit={submit} className="flex flex-col gap-7" noValidate>
      {/* Intent selector */}
      <fieldset>
        <legend className="mono-label">How would you like to start?</legend>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
          {INTENTS.map((i) => {
            const active = intent === i.key;
            return (
              <button
                type="button"
                key={i.key}
                onClick={() => setIntent(i.key)}
                aria-pressed={active}
                className={`flex flex-col gap-1 rounded-lg border p-3.5 text-left transition-colors ${
                  active
                    ? 'border-accent bg-accent/10'
                    : 'border-line bg-surface hover:border-line-2'
                }`}
              >
                <span className={`text-sm font-semibold ${active ? 'text-ink' : 'text-ink'}`}>{i.label}</span>
                <span className="text-xs leading-snug text-ink-muted">{i.blurb}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Centerpiece + identity */}
      <Field id="problem" label="The problem your software never solved">
        <textarea
          id="problem"
          required
          rows={4}
          value={form.problem}
          onChange={set('problem')}
          placeholder="The gap your ERP left, the manual workaround you’re stuck with, the tool no vendor will build…"
          className={inputCls}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="name" label="Name">
          <input id="name" required value={form.name} onChange={set('name')} className={inputCls} autoComplete="name" />
        </Field>
        <Field id="email" label="Work email">
          <input id="email" type="email" required value={form.email} onChange={set('email')} className={inputCls} autoComplete="email" />
        </Field>
      </div>

      <Field id="company" label="Company" optional>
        <input id="company" value={form.company} onChange={set('company')} className={inputCls} autoComplete="organization" />
      </Field>

      {/* Quote-specific */}
      {intent === 'quote' && (
        <div className="grid gap-5 rounded-xl border border-line bg-surface/40 p-5 sm:grid-cols-2">
          <Field id="system" label="System that leaves the gap" optional>
            <input id="system" value={form.system} onChange={set('system')} placeholder="ERP, MRP, WMS…" className={inputCls} />
          </Field>
          <Field id="timeline" label="Timeline" optional>
            <input id="timeline" value={form.timeline} onChange={set('timeline')} placeholder="When do you need it?" className={inputCls} />
          </Field>
          <Field id="scope" label="Rough scope" optional>
            <input id="scope" value={form.scope} onChange={set('scope')} placeholder="One tool? A few? Not sure?" className={inputCls} />
          </Field>
          <Field id="budget" label="Budget range" optional>
            <input id="budget" value={form.budget} onChange={set('budget')} placeholder="A range is fine" className={inputCls} />
          </Field>
        </div>
      )}

      {/* Consult-specific */}
      {intent === 'consult' && (
        <Field id="times" label="Preferred times" optional>
          <textarea id="times" rows={2} value={form.times} onChange={set('times')} placeholder="A couple of windows that work for you (with your time zone)" className={inputCls} />
        </Field>
      )}

      {/* Honeypot — visually hidden, off-screen, ignored by real users */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} />
      </div>

      {error && (
        <p className="text-sm text-down" role="alert" aria-live="assertive">
          {error}
        </p>
      )}

      {TURNSTILE_SITEKEY && <div ref={tsRef} className="min-h-[65px]" />}

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={submitting} className="btn btn-primary group disabled:opacity-60">
          {submitting ? 'Sending…' : 'Send it'}
          {!submitting && (
            <span className="inline-block transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
          )}
        </button>
        <span className="text-xs text-ink-faint">No spam. No sales team. I read every message myself.</span>
      </div>
    </form>
  );
}
