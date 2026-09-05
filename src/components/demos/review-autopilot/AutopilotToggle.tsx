export default function AutopilotToggle({
  on,
  busy,
  autoHandled,
  awaiting,
  onToggle,
}: {
  on: boolean;
  busy: boolean;
  autoHandled: number;
  awaiting: number;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-ra-xl border border-ra-line bg-ra-raised p-4 shadow-ra-card">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-ra-fg">Autopilot</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              on ? "bg-ra-accent-soft text-ra-accent" : "bg-ra-sunken text-ra-muted"
            }`}
          >
            {on ? "On" : "Off"}
          </span>
        </div>
        <p className="mt-1 max-w-md text-xs leading-relaxed text-ra-muted">
          {on ? (
            <>
              Auto-posted <strong className="font-semibold text-ra-fg">{autoHandled}</strong>{" "}
              {autoHandled === 1 ? "reply" : "replies"} to happy customers ·{" "}
              <strong className="font-semibold text-ra-fg">{awaiting}</strong> held for your review.
            </>
          ) : (
            <>
              Turn on to auto-post replies to 4–5★ reviews, draft 3★ for approval, and flag 1–2★
              for you. Negative reviews are never posted automatically.
            </>
          )}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label="Toggle Autopilot"
        disabled={busy}
        onClick={onToggle}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
          on ? "bg-ra-accent" : "bg-ra-line-strong"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform motion-reduce:transition-none ${
            on ? "translate-x-5" : ""
          }`}
        />
      </button>
    </div>
  );
}
