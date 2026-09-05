import { useEffect, useMemo, useRef, useState } from 'react';
import { track } from '../scripts/track.js';
import { isOpen as foundingOpen } from '../data/founding';
import { REPLY_LINE } from '../lib/reply-window.js';
import { availableSlots, slotLabel } from '../lib/slots.js';
import { TIME_ZONE, TIME_ZONE_LABEL } from '../lib/consult-hours.js';

/* ============================================================================
   ContactForm — the engagement hub's intent-routed intake.
   Pick an intent; the fields adapt. The centrepiece is four narrow questions
   about the job: what kind of business it is, what takes too long and how it is
   done today, how often, and what has already been tried.

   IT USED TO BE ONE WIDE QUESTION and that is why the enquiries were useless.
   See the comment on the form state below for the whole diagnosis; the short
   version is that a question written in vocabulary the reader does not have
   gets a two-word answer, honestly given.

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

/* THE FOURTH INTENT EXISTS SO A CLAIM CAN BE COUNTED, and that is the whole
   reason for it. The founding-build button on /main-street/ used to point at
   `?intent=consult`, so a visitor who clicked "take one of the three" arrived at
   a form headed "Request a consult" that never mentioned the offer — the
   strongest call to action on the local page quietly renaming what they clicked.
   Worse for the operator: nothing in the resulting email distinguished a claim
   from an ordinary consult, so the count in src/data/founding.ts had nothing to
   move on except memory.

   IT IS HIDDEN ONCE THE SLOTS ARE GONE. `isOpen` comes from the same module the
   band reads, so the form stops offering a thing that is no longer available at
   the same moment the band stops advertising it. Two places going quiet on one
   number, rather than two places somebody has to remember. */
/* THE FIFTH INTENT NAMES THE VAGUE STATE ON PURPOSE, added 2026-09-03 with
   /ai-fit/. "I want to use AI and cannot see where it fits" was arriving as a
   two-word message in the general-inquiry box and reading as a lead nobody could
   act on. It is not that. It is the AI Fit Assessment's buyer describing
   themselves accurately, and the only thing missing was somewhere to put it.

   Its blurb has to state the vagueness rather than ask them to resolve it. A
   button reading "tell me your AI strategy" sends exactly the person this is for
   back to the general box. */
const ALL_INTENTS = [
  { key: 'quote', label: 'Request a quote', blurb: 'A defined build — scope, timeline, a number.' },
  { key: 'consult', label: 'Request a consult', blurb: 'A working session to pressure-test it. The first one is free.' },
  { key: 'assessment', label: 'Where does AI fit?', blurb: 'You want to use it and cannot see where. I come and look, then write it down.' },
  { key: 'founding', label: 'Claim a founding build', blurb: 'One of the free builds for a New Bern business. No invoice at the end of it.', foundingOnly: true },
  { key: 'inquiry', label: 'General inquiry', blurb: 'Anything else — open-ended.' },
];

/* HOW THE CONSULT ACTUALLY HAPPENS, written once. The buttons render from this
   and the lead summary reads its labels from it, so the wording a visitor picked
   and the wording that lands in the inbox cannot drift apart — which is exactly
   how a choice turns into a different choice by the time it is read.

   ALL THREE COST NOTHING AND WORK TODAY. Video and camera-off are the SAME room:
   every room is created with a pre-join screen, so the camera is turned off
   before anyone is seen rather than after. Phone is Ian ringing them and needs
   no room. Dial-IN to a room is a separate paid service and is deliberately
   absent, because nothing here would deliver it. */
const MEET_OPTIONS = [
  { key: 'video', label: 'Video', blurb: 'A private room on this site. Nothing to install.' },
  { key: 'audio', label: 'Camera off', blurb: 'Same room, voice only. You choose before joining.' },
  { key: 'phone', label: 'Phone call', blurb: 'I ring you. No link, no browser.' },
];
const MEET_PREF_LABEL = Object.fromEntries(MEET_OPTIONS.map((o) => [o.key, o.label]));

/* THE TWO INTENTS THAT END IN A MEETING. A quote and a general question do not,
   and a founding claim is a claim rather than a request for a time. Kept as a
   set rather than an `||` chain so a sixth intent joins it in one place instead
   of in each of the three spots below that ask the question. */
const WANTS_A_TIME = new Set(['consult', 'assessment']);

/* THE SHORTEST ANSWER THAT IS STILL AN ANSWER, in characters.

   "AI help" is seven and passed the old check, which only required the field to
   be non-empty. Forty is roughly a short sentence — enough to name a job and how
   it is done today, which is what the question asks for. It is a floor on
   EFFORT, not a quality judgement: the message it produces says what is missing
   rather than that something is wrong, because a form that scolds is a form
   people leave. */
const MIN_JOB_CHARS = 40;

/** Both halves of a slot in one line: words for the operator, the machine form
 *  in brackets for the calendar composer he pastes it into. */
function summariseSlot(iso) {
  try {
    const { here } = slotLabel({ iso }, TIME_ZONE, TIME_ZONE);
    return `${here} ${TIME_ZONE_LABEL}  [${iso}]`;
  } catch {
    return iso;
  }
}

const INTENTS = ALL_INTENTS.filter((i) => !i.foundingOnly || foundingOpen);

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
    /* FOUR NARROW QUESTIONS REPLACED ONE WIDE ONE, 2026-09-03.

       WHAT WAS WRONG. The single required field was a textarea labelled "The
       problem your software never solved", placeholder "The gap your ERP left".
       A salon owner has no ERP and does not think of herself as having software,
       so the honest answer to that question is a short one — and the enquiries
       arriving were "I need a website" and "interested in AI". The prompt was
       written for the supply-chain reader this site had before D29 and D33 moved
       it to small local business, and everything that would have made a lead
       actionable sat beside it marked optional.

       WHY FOUR RATHER THAN A BETTER ONE. Nobody writes a vague answer to a
       narrow question; they write one to a wide question. The pattern is already
       in this practice's own paperwork — support-and-incidents.md tells a client
       "Three lines. That is all" and then asks three narrow things. This is the
       one place it had not been applied.

       `trade` IS NOT `company`. One is what the business is, the other is what it
       is called, and the first is the fact that changes how every other answer
       reads. Knowing "two-chair salon" or "marine contractor" is worth more than
       knowing the name above the door. */
    trade: '',
    job: '',
    frequency: '',
    tried: '',
    scope: '',
    timeline: '',
    slot1: '',
    slot2: '',
    /* THE WAY OUT, and it is not an afterthought. Six slots inside ten days will
       genuinely suit nobody some of the time, and a picker with no escape turns
       that person away at the last step rather than at the first. */
    timesOther: '',
    /* DEFAULTS TO VIDEO BECAUSE THAT IS THE OFFER, NOT TO PUSH ANYONE INTO IT.
       All three choices sit side by side and the field is optional, so the
       default is a starting point rather than a hurdle. Forcing camera-on costs
       consults: plenty of people are driving, on a phone, or simply do not want
       to be on camera with a stranger, and a form that assumes otherwise reads
       as one. */
    meetPref: 'video',
    website: '', // honeypot — real people leave this empty
  });

  // Deep-link support: /contact?intent=<key> pre-selects the intent (e.g. the
  // Services page "Request a quote" CTA, or /ai-fit/'s "assessment"). The keys
  // are ALL_INTENTS above and are deliberately NOT relisted here — this comment
  // named three of them for two months after there were five.
  // Client-only — window is unset in SSR.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('intent');
    if (q && INTENTS.some((i) => i.key === q)) setIntent(q);
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const intentLabel = INTENTS.find((i) => i.key === intent).label;

  /* COMPUTED ONCE PER MOUNT, not per render. availableSlots() reads the clock,
     so recomputing it on every keystroke would let a slot vanish out from under
     a half-filled form the moment the lead time rolled past it. */
  const slots = useMemo(() => availableSlots({ count: 6 }), []);

  /* ONE GRID, TWO PICKS, and clicking is the only verb. A first-choice grid
     stacked on a second-choice grid is twelve controls asking one question
     twice, which on a phone is most of a screen. Clicking an unpicked slot
     fills the first empty rank; clicking a picked one gives it back, and
     promotes the second choice so there is never a second without a first. */
  const pickSlot = (iso) =>
    setForm((f) => {
      if (f.slot1 === iso) return { ...f, slot1: f.slot2, slot2: '' };
      if (f.slot2 === iso) return { ...f, slot2: '' };
      if (!f.slot1) return { ...f, slot1: iso };
      return { ...f, slot2: iso };
    });

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
    L.push(`Kind of business: ${form.trade}`);
    L.push('', 'What takes too long, and how it is done today:', form.job);
    if (form.frequency) L.push('', `How often, and how long: ${form.frequency}`);
    if (form.tried) L.push('', `Already tried: ${form.tried}`);
    /* TWO FIELDS WERE CUT 2026-08-24: "Budget range" and "System that leaves
       the gap".

       BUDGET went because the site now publishes a floor. Asking somebody their
       budget immediately after telling them the price is asking them to bid
       against a number you already gave them, and it is the field people most
       resent — a phone number and a budget question are the two highest-drop
       fields measured on B2B forms.

       SYSTEM went because it asked a shop owner to name their ERP. The placeholder
       literally read "ERP, MRP, WMS…", which for most of the people this site now
       sells to is a question about something they do not have.

       Six fields on the quote intent, down from eight. Field COUNT is a proxy —
       what actually moves completion is whether each field looks justified by the
       offer — but neither of those two was justified any more. */
    if (intent === 'quote') {
      L.push('');
      if (form.scope) L.push(`Rough scope: ${form.scope}`);
      if (form.timeline) L.push(`Timeline: ${form.timeline}`);
    }
    if (WANTS_A_TIME.has(intent)) {
      /* BOTH PICKS, SPELLED OUT IN WORDS AND IN THE OPERATOR'S OWN ZONE. An ISO
         timestamp in an email is a thing he would have to convert by hand at the
         moment he is deciding, which is exactly when a conversion gets done
         wrong. The ISO string travels too, in brackets, because that is what he
         pastes into the calendar composer on /host/. */
      if (form.slot1) L.push('', `First choice: ${summariseSlot(form.slot1)}`);
      if (form.slot2) L.push(`Second choice: ${summariseSlot(form.slot2)}`);
      if (form.slot1 || form.slot2) {
        L.push('(Requested, not booked — nothing on this site holds a time.)');
      }
      if (form.timesOther) L.push('', `None of those suit — they said: ${form.timesOther}`);
      /* NOT GUARDED ON TRUTHINESS like the fields above it, and that is the
         point: meetPref always has a value, and "Video" is as much a decision as
         the other two. Wrapping it in `if` would silently drop the default and
         leave the most common answer invisible in the lead mail. */
      L.push(`How they want to meet: ${MEET_PREF_LABEL[form.meetPref] || form.meetPref}`);
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
    /* THE ORDER OF THESE IS THE MESSAGE. Naming one missing thing at a time is
       what lets the text say what to do next; a single "fill in the required
       fields" sends somebody hunting. The honeypot short-circuit above stays
       ABOVE all of them, or a bot gets told exactly what to fix. */
    if (!form.name.trim() || !form.email.trim()) {
      setError('I need a name and an email to reply to.');
      return;
    }
    if (!form.trade.trim()) {
      setError('What kind of business is it? A word or two is plenty — “salon”, “marina”, “HVAC”.');
      return;
    }
    /* A FLOOR ON THE ANSWER, NOT ONLY ON WHETHER THERE IS ONE. The old check
       accepted any non-empty string, so "AI help" submitted and arrived as a
       lead nobody could act on. This says what is missing rather than that
       something is wrong. */
    if (form.job.trim().length < MIN_JOB_CHARS) {
      setError(
        'Tell me a bit more about the job itself — what it is, and how it gets done today. A couple of sentences is enough.',
      );
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
      if (!res.ok) throw new Error(`http ${res.status}`);
      // The ONLY place a real submission is confirmed delivered. Everything
      // below this line in the catch is the mail-app fallback, which is a
      // different outcome and is counted as one.
      track('form_submit_ok', { intent });
      setMethod('posted');
      setStatus('success');
    } catch (err) {
      // Counted separately from a real send, because the visitor still has to
      // press send in their own mail app. Treating these as successes would
      // inflate the only number that matters.
      track('form_submit_mailto', { intent, reason: String(err && err.message || 'unknown') });
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
            ? `I just opened it in your mail client — hit send and it comes straight to me. ${REPLY_LINE}`
            : `It comes straight to me — no sales team in between. ${REPLY_LINE}`}
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
        {/* WRAPPING ROW, NOT A FIXED THREE-COLUMN GRID, and the reason is that
            the count is not fixed. INTENTS is four or five depending on whether
            founding builds are open, and the assessment made it five or six — so
            a three-column grid leaves a ragged 3+1 or 3+2 depending on a number
            nobody editing this file is thinking about. `flex-1` with a basis lets
            each row divide itself evenly at whatever count it is handed. */}
        <div className="mt-3 flex flex-wrap gap-2.5">
          {INTENTS.map((i) => {
            const active = intent === i.key;
            return (
              <button
                type="button"
                key={i.key}
                onClick={() => setIntent(i.key)}
                aria-pressed={active}
                className={`flex flex-1 basis-56 flex-col gap-1 rounded-lg border p-3.5 text-left transition-colors ${
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

      {/* ── THE CENTREPIECE, now four narrow questions ─────────────────────
          Each one is answerable by somebody who has never bought software. The
          old single prompt asked about the gap an ERP left, which for most of
          the people this site sells to is a question about something they do
          not have — so it was answered in two words, honestly. */}
      <div className="flex flex-col gap-5 rounded-xl border border-line bg-surface/40 p-5">
        <Field id="trade" label="What kind of business is it?">
          <input
            id="trade"
            required
            value={form.trade}
            onChange={set('trade')}
            placeholder="Salon, marina, HVAC, dental office, food truck…"
            className={inputCls}
          />
        </Field>

        <Field id="job" label="What takes too long right now — and how do you do it today?">
          <textarea
            id="job"
            required
            rows={4}
            value={form.job}
            onChange={set('job')}
            placeholder="The spreadsheet somebody rebuilt, the thing that gets typed into two systems, the job only one person knows how to do…"
            className={inputCls}
          />
          <span className="mt-1 text-xs leading-snug text-ink-faint">
            How it is done today is the half that helps most — that is where the fix has to fit.
          </span>
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="frequency" label="How often, and roughly how long?" optional>
            <input
              id="frequency"
              value={form.frequency}
              onChange={set('frequency')}
              placeholder="Every Monday, about two hours"
              className={inputCls}
            />
          </Field>
          <Field id="tried" label="What have you already tried?" optional>
            <input
              id="tried"
              value={form.tried}
              onChange={set('tried')}
              placeholder="An app, a spreadsheet, hiring someone — or nothing yet"
              className={inputCls}
            />
          </Field>
        </div>
      </div>

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
          <Field id="timeline" label="Timeline" optional>
            <input id="timeline" value={form.timeline} onChange={set('timeline')} placeholder="When do you need it?" className={inputCls} />
          </Field>
          <Field id="scope" label="Rough scope" optional>
            <input id="scope" value={form.scope} onChange={set('scope')} placeholder="One tool? A few? Not sure?" className={inputCls} />
          </Field>
        </div>
      )}

      {/* Consult and assessment — the two intents that end in a meeting */}
      {WANTS_A_TIME.has(intent) && (
        <div className="flex flex-col gap-5 rounded-xl border border-line bg-surface/40 p-5">
          {/* ── REQUESTED TIMES, NOT BOOKED ONES ────────────────────────────
              This replaced a free-text box asking for "a couple of windows that
              work for you (with your time zone)". People answered it with times
              the operator does not work, and the exchange then cost two more
              emails — which is the same broken promise as a listing saying you
              are always open, wearing a nicer interface.

              THE PAGE SAYS "REQUESTS" BECAUSE THAT IS WHAT THEY ARE. The Worker
              has one binding, static assets, so nothing is stored and two people
              can ask for the same Tuesday without either being told. That is a
              defect only if the page calls them bookings. D52 refused a booking
              flow on the grounds that no page gets authority over this
              calendar — the two clicks that stay human, confirm and send, stay
              human. */}
          <fieldset>
            <legend className="mono-label">Pick a first and second choice</legend>
            <p className="mt-2 text-xs leading-relaxed text-ink-muted">
              These are requests, not bookings — I confirm one by reply. Times are{' '}
              {TIME_ZONE_LABEL}
              {slots[0] && slotLabel(slots[0]).viewer ? ', with yours beside them' : ''}.
            </p>
            <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
              {slots.map((s) => {
                const { here, viewer } = slotLabel(s);
                const rank = form.slot1 === s.iso ? '1st' : form.slot2 === s.iso ? '2nd' : null;
                return (
                  <button
                    type="button"
                    key={s.iso}
                    onClick={() => pickSlot(s.iso)}
                    aria-pressed={Boolean(rank)}
                    className={`flex flex-col gap-0.5 rounded-lg border p-3 text-left transition-colors ${
                      rank ? 'border-accent bg-accent/10' : 'border-line bg-surface hover:border-line-2'
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-ink">{here}</span>
                      {rank && <span className="mono-label text-accent">{rank}</span>}
                    </span>
                    {viewer && <span className="text-xs text-ink-faint">your time: {viewer}</span>}
                  </button>
                );
              })}
            </div>
            {slots.length === 0 && (
              /* NEVER A SILENT EMPTY GRID. If the horizon holds no open day the
                 visitor gets a sentence and the free-text field below, rather
                 than a blank space they read as a broken page. */
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                Nothing is open in the next week and a half. Say below when suits you and I will work
                round it.
              </p>
            )}
          </fieldset>

          <Field id="timesOther" label="None of those work? Say when does" optional>
            <input
              id="timesOther"
              value={form.timesOther}
              onChange={set('timesOther')}
              placeholder="Early mornings, or after 8pm on a weekday…"
              className={inputCls}
            />
          </Field>

          {/* THE FORM ASKED FOR SOMEONE'S AVAILABILITY WITHOUT EVER SAYING WHAT
              THEY WERE AGREEING TO, which is a hesitation at the exact moment
              they decide whether to send. It now names the thing and lets them
              pick the shape of it.

              ALL THREE ARE FREE AND WORK TODAY. Video and camera-off are the
              same room — every room is created with a pre-join screen, so
              turning the camera off happens before anyone sees anything, not
              after. Phone is Ian ringing them, which needs no room at all.
              Dial-IN to a room is a separate paid service and is deliberately
              not offered, because nothing here would deliver it. */}
          <fieldset>
            <legend className="mono-label">How would you like to meet?</legend>
            <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
              {MEET_OPTIONS.map((o) => {
                const active = form.meetPref === o.key;
                return (
                  <button
                    type="button"
                    key={o.key}
                    onClick={() => setForm((f) => ({ ...f, meetPref: o.key }))}
                    aria-pressed={active}
                    className={`flex flex-col gap-1 rounded-lg border p-3.5 text-left transition-colors ${
                      active ? 'border-accent bg-accent/10' : 'border-line bg-surface hover:border-line-2'
                    }`}
                  >
                    <span className="text-sm font-semibold text-ink">{o.label}</span>
                    <span className="text-xs leading-snug text-ink-muted">{o.blurb}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>
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
