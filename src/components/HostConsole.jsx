// ============================================================================
// HOST CONSOLE — one tap to a room, one tap to the invite. Mounted on /host/.
//
// WHY THIS EXISTS RATHER THAN A LINK TO /admin. The operator's objection was not
// distance. It was that making a client meeting room meant remembering an
// unlisted address, landing on a page built for writing news stories, and then
// switching tabs — which reads as rudimentary for a company that sells finished
// software. So this route does ONE job and installs as its own app.
//
// THE CALENDAR HALF, and why it stops where it does. A room link alone is not a
// meeting: nothing is on either calendar, no length is agreed, and the link ends
// up buried in an email thread the client has to go hunting for at five to the
// hour. The first answer to that was a nine-step checklist, which is the wrong
// shape for this business. Google Calendar accepts a PRE-FILLED composer URL, so
// the console builds one carrying the title, the slot, the length, the guest and
// the room link in both the description and the location field.
//
// DELIBERATELY NOT THE CALENDAR API. Creating the event silently would need an
// OAuth app, a stored refresh token that expires, and an invitation reaching a
// client with nobody having looked at it. That is a lot of machinery, and a new
// way to fail quietly, to save one click. The two clicks left — confirm the slot,
// press Send — are the two that should stay human.
//
// WHY LOCATION AND DESCRIPTION BOTH CARRY THE LINK. Google renders `location` on
// the calendar tile and on the phone reminder; `details` is only visible once the
// event is opened. One field alone means either a link nobody can reach in one
// tap, or a link that vanishes from the reminder.
//
// Built by Ian Provencher · AppliedIQ Solutions
// ============================================================================

import React, { useState } from 'react';

const DURATIONS = [
  { key: 20, label: '20 min' },
  { key: 30, label: '30 min' },
  { key: 45, label: '45 min' },
  { key: 60, label: '60 min' },
];

// An expired Access session answers a fetch with login HTML rather than our
// JSON. Detect that and ask for a reload instead of printing a parse error.
async function createRoom() {
  let res;
  try {
    res = await fetch('/api/meet/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
  } catch {
    return { error: 'No connection. Check your network and try again.' };
  }
  if (!(res.headers.get('content-type') || '').includes('application/json')) {
    return { error: 'Your sign-in expired. Reload this page to sign in again.' };
  }
  let data = {};
  try { data = await res.json(); } catch { /* fall through to the status */ }
  if (!res.ok) return { error: data.error || `Something went wrong (${res.status}).` };
  return { data };
}

/* GOOGLE WANTS UTC IN ITS OWN COMPACT SHAPE: 20260830T143000Z, start/end.
   The <input type="datetime-local"> value is LOCAL WALL TIME with no zone
   ("2026-08-30T14:30"), and `new Date()` reads exactly that as local — which is
   what makes the round trip correct rather than lucky. Formatting the local
   string directly would send the operator's 2:30pm to Google as 2:30pm UTC and
   silently move every invite by the offset. */
function gcalStamp(d) {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function inviteUrl({ startLocal, minutes, email, room, url }) {
  const start = new Date(startLocal);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start.getTime() + minutes * 60000);
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: 'AppliedIQ — scoping call',
    dates: `${gcalStamp(start)}/${gcalStamp(end)}`,
    location: url,
    details: [
      `Join here: ${url}`,
      '',
      'Nothing to download and no account needed — it opens in your browser.',
      'You can turn your camera off before joining if you would rather.',
      '',
      'You will wait on a short holding screen until I let you in.',
      `Room: ${room}`,
    ].join('\n'),
  });
  // `add` is Google's guest parameter and it is repeatable. Omitted entirely
  // when blank — an empty one makes the composer open with a nameless guest row.
  if (email.trim()) p.append('add', email.trim());
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

// Rounds up to the next half hour, then a day ahead — a sane default that is
// almost never the right answer but is always a legal one, so the field is never
// empty and never in the past.
function defaultStart() {
  const d = new Date(Date.now() + 24 * 3600 * 1000);
  d.setMinutes(d.getMinutes() > 30 ? 60 : 30, 0, 0);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function dies(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
}

export default function HostConsole() {
  const [state, setState] = useState('idle'); // idle | working | ready | error
  const [room, setRoom] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const [email, setEmail] = useState('');
  const [startLocal, setStartLocal] = useState(defaultStart);
  const [minutes, setMinutes] = useState(30);

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  async function make() {
    setState('working');
    setError('');
    setCopied(false);
    const r = await createRoom();
    if (r.error) { setError(r.error); setState('error'); return; }
    setRoom(r.data);
    setState('ready');
    copy(r.data.guestUrl);
  }

  const invite = room
    ? inviteUrl({ startLocal, minutes, email, room: room.room, url: room.guestUrl })
    : null;

  const inputCls =
    'w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-line-2 focus:outline-none focus:ring-2 focus:ring-accent/40';

  return (
    <div className="flex w-full flex-col gap-8">
      <button
        onClick={make}
        disabled={state === 'working'}
        className="group w-full rounded-2xl border border-line bg-surface px-8 py-10 text-left transition-colors hover:border-line-2 disabled:opacity-60 sm:py-12"
      >
        <span className="mono-label">{state === 'working' ? 'Creating' : 'One tap'}</span>
        <span className="mt-2 block font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          {state === 'working' ? 'Making your room…' : 'New client room'}
        </span>
        <span className="mt-2 block max-w-md text-sm leading-relaxed text-ink-muted">
          Creates a private room and copies the link, ready to paste into your reply.
        </span>
      </button>

      {state === 'error' && (
        <div className="panel p-6" role="alert">
          <p className="mono-label text-down">Not created</p>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">{error}</p>
        </div>
      )}

      {state === 'ready' && room && (
        <div className="panel flex flex-col gap-6 p-6 sm:p-8" role="status" aria-live="polite">
          <div className="flex flex-col gap-3">
            <p className="mono-label text-up">
              {copied ? 'Copied — ready to paste' : 'Room ready'} · {room.room}
            </p>
            <code className="w-full break-all rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink">
              {room.guestUrl}
            </code>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => copy(room.guestUrl)} className="btn btn-secondary">
                {copied ? 'Copy again' : 'Copy link'}
              </button>
              <a href={room.guestUrl} target="_blank" rel="noopener" className="btn btn-secondary">
                Join as host
              </a>
            </div>
          </div>

          <div className="flex flex-col gap-4 border-t border-line pt-6">
            <p className="mono-label">Put it on both calendars</p>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-ink-muted">Client email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="them@theircompany.com"
                className={inputCls}
                autoComplete="off"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-ink-muted">Starts</span>
                <input
                  type="datetime-local"
                  value={startLocal}
                  onChange={(e) => setStartLocal(e.target.value)}
                  className={inputCls}
                />
              </label>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-ink-muted">Length</span>
                <div className="flex gap-2">
                  {DURATIONS.map((d) => (
                    <button
                      key={d.key}
                      type="button"
                      onClick={() => setMinutes(d.key)}
                      aria-pressed={minutes === d.key}
                      className={`flex-1 rounded-lg border px-2 py-2.5 text-xs font-medium transition-colors ${
                        minutes === d.key
                          ? 'border-accent bg-accent/10 text-ink'
                          : 'border-line bg-surface text-ink-muted hover:border-line-2'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {invite ? (
              <a href={invite} target="_blank" rel="noopener" className="btn btn-primary self-start">
                Open the invite in Google Calendar →
              </a>
            ) : (
              <p className="text-sm text-down">That start time is not valid — pick one from the field above.</p>
            )}

            <p className="text-xs leading-relaxed text-ink-faint">
              Opens already filled in — the slot, the length, the room link in both the location and
              the description, and the client as a guest. Check it, then Save and Send.
              {dies(room.expiresAt) ? ` The link itself stops working on ${dies(room.expiresAt)}.` : ''}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
