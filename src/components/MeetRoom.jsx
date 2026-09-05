// ============================================================================
// MEET ROOM — the client-facing video call island (mounted on /meet/).
//
// A client opens /meet/?r=aiq-3f9c2a from a link in Ian's reply. This island
// asks the Worker for the room URL, mounts Daily Prebuilt into the panel below,
// and gets out of the way. Nothing about the call is rebuilt here — the whole
// point is that the media layer is someone else's problem.
//
// WHY NOT BUILD THE CALL ITSELF. Two browsers usually cannot reach each other
// directly, so a video call falls back to a relay server that forwards every
// packet. That fallback fires for 15-20% of consumer connections but 40-70% of
// corporate ones. This site's visitors are corporate, so a hand-built call
// would work on the operator's machine and fail for about half the people it
// exists to meet — the worst shape a bug can take, because the person who built
// it never sees it.
//
// WHO GETS IN. The room is private with knocking on. A guest joins with no
// token and waits on a knock screen. Ian's browser carries the Cloudflare
// Access cookie, so /api/meet/join hands HIM an owner token and he walks
// straight in — and is the one who admits the guest.
//
// Built by Ian Provencher · AppliedIQ Solutions
// ============================================================================

import React, { useEffect, useRef, useState } from 'react';
import DailyIframe from '@daily-co/daily-js';

const CONTACT = 'contact@appliediqsolutions.com';

// Mirrors ROOM_RE in worker/index.js. Checked here too so a bad link shows a
// sentence instead of a network round trip — the Worker stays authoritative.
const ROOM_RE = /^[a-z0-9-]{3,64}$/;

/* WHAT A FAILED CALL ACTUALLY SAYS TO THE VISITOR. Daily rejects with an object
   carrying `errorMsg`, not the `message` a thrown Error has, so the obvious
   String(err.message || err) renders the literal text "[object Object]" on a
   client's screen. Seen on 2026-08-29 against a room that did not exist — the
   page looked handled and told the person nothing. */
function errText(err) {
  if (!err) return 'Unknown error.';
  if (typeof err === 'string') return err;
  return (
    err.message ||
    err.errorMsg ||
    err.msg ||
    (err.error && (err.error.msg || err.error.localizedMsg || err.error.type)) ||
    JSON.stringify(err).slice(0, 200)
  );
}

function readRoom() {
  try {
    const r = new URLSearchParams(window.location.search).get('r');
    return (r || '').trim().toLowerCase();
  } catch {
    return '';
  }
}

function Notice({ title, children }) {
  return (
    <div className="panel p-8 sm:p-10">
      <p className="mono-label">AppliedIQ · meeting room</p>
      <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink">{title}</h2>
      <div className="mt-3 max-w-xl text-sm leading-relaxed text-ink-muted">{children}</div>
      <a
        className="mt-6 inline-block text-sm font-medium text-accent underline underline-offset-4"
        href={`mailto:${CONTACT}?subject=Meeting%20link`}
      >
        Email me and I&rsquo;ll send a new link
      </a>
    </div>
  );
}

export default function MeetRoom() {
  const hostRef = useRef(null);
  const frameRef = useRef(null);
  const [phase, setPhase] = useState('loading'); // loading | live | badlink | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const room = readRoom();
    if (!ROOM_RE.test(room)) {
      setPhase('badlink');
      return;
    }

    // React runs effects twice in development, and Daily throws on a second
    // frame ("Duplicate DailyIframe instances"). `cancelled` stops the first
    // run's async tail from mounting into a container the second run owns.
    let cancelled = false;

    (async () => {
      let payload;
      try {
        const res = await fetch('/api/meet/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ room }),
        });
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) throw new Error('non-JSON response');
        payload = await res.json();
        if (!res.ok) throw new Error(payload.error || `HTTP ${res.status}`);
      } catch (err) {
        if (cancelled) return;
        setMessage(errText(err));
        setPhase('error');
        return;
      }

      if (cancelled || !hostRef.current) return;

      try {
        // Belt and braces: an instance can survive a hot reload even when this
        // component's own ref did not.
        const stale = DailyIframe.getCallInstance();
        if (stale) await stale.destroy();

        const frame = DailyIframe.createFrame(hostRef.current, {
          showLeaveButton: true,
          showFullscreenButton: true,
          iframeStyle: { width: '100%', height: '100%', border: '0', borderRadius: '12px' },
        });
        frameRef.current = frame;
        await frame.join(payload.token ? { url: payload.url, token: payload.token } : { url: payload.url });
        if (cancelled) return;
        setPhase('live');
      } catch (err) {
        if (cancelled) return;
        setMessage(errText(err));
        setPhase('error');
      }
    })();

    return () => {
      cancelled = true;
      const frame = frameRef.current;
      frameRef.current = null;
      if (frame) frame.destroy().catch(() => {});
    };
  }, []);

  if (phase === 'badlink') {
    return (
      <Notice title="This meeting link has expired">
        <p>
          Meeting links stop working after two weeks, so an old one sitting in an inbox cannot be
          reused by anyone else. That is deliberate rather than a fault.
        </p>
      </Notice>
    );
  }

  if (phase === 'error') {
    return (
      <Notice title="I could not open the room">
        <p>
          Something went wrong reaching the video service. If you have a moment, the fastest fix is
          usually a fresh link.
        </p>
        <p className="mt-3 font-mono text-xs text-ink-faint">{message}</p>
      </Notice>
    );
  }

  return (
    <div>
      {phase === 'loading' && (
        <p className="mono-label mb-3">
          <span className="status-dot"></span> Opening the room — allow camera and microphone when asked
        </p>
      )}
      <div
        ref={hostRef}
        className="h-[min(78vh,720px)] w-full overflow-hidden rounded-xl border border-line bg-surface"
      />
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-muted">
        You will wait on a holding screen until I let you in. Either of us can share a screen once
        we are connected. If I record, you will see a recording indicator and I will ask you first.
      </p>
    </div>
  );
}
