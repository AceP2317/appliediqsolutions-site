import type { Review } from "./types";
import { sentiment } from "./types";
import type { MetricsStyle } from "./verticals";

type Stat = { label: string; short: string; value: string; sub: string; accent?: boolean };

// ---- cards archetype (dental clean grid · salon borderless+airy via tokens) ----
function StatTile({ label, value, sub, accent }: Stat) {
  return (
    <div data-accent={accent ? "" : undefined} className="ms-card">
      <p className="ms-label text-[11px] text-ra-muted">{label}</p>
      <p
        className={`mt-1 font-ra-heading text-2xl font-semibold tabular-nums tracking-[var(--tracking-heading)] ${
          accent ? "text-ra-accent" : "text-ra-fg"
        }`}
      >
        {value}
      </p>
      <p className="mt-0.5 text-xs text-ra-muted">{sub}</p>
    </div>
  );
}

// ---- panel archetype (auto instrument cluster · home control panel) ----
function PanelCell({ label, value, accent }: Stat) {
  return (
    <div className="px-4 py-3">
      <p className="ms-label text-[10px] text-ra-muted">{label}</p>
      <p
        className={`mt-0.5 font-ra-heading text-xl font-semibold tabular-nums tracking-[var(--tracking-heading)] ${
          accent ? "text-ra-accent" : "text-ra-fg"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${swatch}`} aria-hidden="true" />
      {label}
    </span>
  );
}

function SentimentMix({
  counts,
  pct,
  bare,
}: {
  counts: { positive: number; neutral: number; negative: number };
  pct: (n: number) => number;
  bare?: boolean;
}) {
  const body = (
    <>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="ms-label text-[11px] text-ra-muted">Sentiment mix</p>
        <div className="flex items-center gap-3 text-xs text-ra-muted">
          <Legend swatch="bg-emerald-500" label={`Positive ${counts.positive}`} />
          <Legend swatch="bg-slate-400" label={`Neutral ${counts.neutral}`} />
          <Legend swatch="bg-rose-500" label={`Negative ${counts.negative}`} />
        </div>
      </div>
      <div className="flex h-2.5 overflow-hidden rounded-full bg-ra-sunken">
        <div className="bg-emerald-500" style={{ width: `${pct(counts.positive)}%` }} />
        <div className="bg-slate-400" style={{ width: `${pct(counts.neutral)}%` }} />
        <div className="bg-rose-500" style={{ width: `${pct(counts.negative)}%` }} />
      </div>
    </>
  );
  return bare ? <div>{body}</div> : <div className="ms-card">{body}</div>;
}

export default function MetricsStrip({
  reviews,
  metrics,
}: {
  reviews: Review[];
  metrics: MetricsStyle;
}) {
  const total = reviews.length;
  const responded = reviews.filter((r) => r.responded).length;
  const rate = total ? Math.round((responded / total) * 100) : 0;
  const avg = total ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;
  const awaiting = total - responded;
  const autoHandled = reviews.filter((r) => r.responded && r.autoPosted).length;

  const counts = { positive: 0, neutral: 0, negative: 0 };
  reviews.forEach((r) => (counts[sentiment(r)] += 1));
  const pct = (n: number) => (total ? (n / total) * 100 : 0);

  const stats: Stat[] = [
    { label: "Avg rating", short: "avg", value: avg.toFixed(1), sub: `across ${total} reviews` },
    { label: "Response rate", short: "replied", value: `${rate}%`, sub: `${responded} replied` },
    {
      label: "Awaiting reply",
      short: "awaiting",
      value: String(awaiting),
      sub: awaiting ? "needs a response" : "all caught up",
    },
    { label: "Auto-handled", short: "auto-handled", value: String(autoHandled), sub: "by Autopilot", accent: true },
  ];

  // PANEL — one divided instrument panel + a compact sentiment readout.
  if (metrics === "panel") {
    return (
      <section aria-label="Review metrics" className="space-y-3">
        <div className="ms-card" style={{ padding: 0 }}>
          <div className="grid grid-cols-2 divide-x divide-y divide-ra-line-strong sm:grid-cols-4 sm:divide-y-0">
            {stats.map((s) => (
              <PanelCell key={s.label} {...s} />
            ))}
          </div>
        </div>
        <SentimentMix counts={counts} pct={pct} bare />
      </section>
    );
  }

  // INLINE — editorial stat-line (serif figures, middot-separated, centered).
  if (metrics === "inline") {
    return (
      <section aria-label="Review metrics" className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-center gap-x-4 gap-y-1 [font-family:var(--font-body)]">
          {stats.map((s, i) => (
            <span key={s.label} className="inline-flex items-baseline gap-1.5">
              {i > 0 && <span className="mr-4 text-ra-faint" aria-hidden="true">·</span>}
              <span
                className={`font-ra-heading text-xl font-semibold tabular-nums ${
                  s.accent ? "text-ra-accent" : "text-ra-fg"
                }`}
              >
                {s.value}
              </span>
              <span className="ms-label text-[11px] text-ra-muted">{s.short}</span>
            </span>
          ))}
        </div>
        <SentimentMix counts={counts} pct={pct} bare />
      </section>
    );
  }

  // CARDS — the calm 4-tile grid (dental baseline; salon goes borderless+airy via tokens).
  return (
    <section aria-label="Review metrics" className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <StatTile key={s.label} {...s} />
        ))}
      </div>
      <SentimentMix counts={counts} pct={pct} />
    </section>
  );
}
