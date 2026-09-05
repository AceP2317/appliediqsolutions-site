import type { ReactNode } from "react";
import type { HeaderStyle } from "./verticals";

// Four header compositions — the strongest first-impression signal that each
// vertical is its own blueprint. `split` (auto/dental) and the eyebrow/tagline
// treatments still re-skin via tokens; masthead/airy/utility change the actual
// silhouette. The switcher is passed in so this stays presentation-only.
export default function DashboardHeader({
  header,
  businessName,
  tagline,
  reviewCount,
  urgentCount,
  mono,
  switcher,
}: {
  header: HeaderStyle;
  businessName: string;
  tagline: string;
  reviewCount: number;
  urgentCount: number;
  mono: boolean; // auto: render a technical mono spec-strip instead of the prose tagline
  switcher: ReactNode;
}) {
  const eyebrow = <p className="ms-label text-[11px] text-ra-accent">Review Autopilot</p>;

  // Prose tagline (most verticals) vs. a mono uppercase spec-strip (auto).
  const taglineNode = mono ? (
    <p className="mt-1 text-xs uppercase tracking-[0.12em] text-ra-muted [font-family:var(--meta-font)]">
      {reviewCount} reviews · 3 platforms
      {urgentCount > 0 && ` · ${urgentCount} urgent`}
    </p>
  ) : (
    <p className="mt-0.5 text-sm text-ra-muted">
      {tagline} ·{" "}
      <span className="text-ra-faint">
        {`${reviewCount} reviews across Google, Yelp & Facebook`}
      </span>
      {urgentCount > 0 && (
        <span className="ml-1 font-medium text-ra-urgent"> · {urgentCount} urgent</span>
      )}
    </p>
  );

  // MASTHEAD (restaurant) — centered serif name over a hairline rule, switcher
  // on its own centered row, an italic-serif dek below the rule.
  if (header === "masthead") {
    return (
      <div className="space-y-3">
        <div className="flex justify-center">{switcher}</div>
        <div className="text-center">
          {eyebrow}
          <h1 className="mt-1 font-ra-heading text-3xl font-semibold tracking-[var(--tracking-heading)] text-ra-fg">
            {businessName}
          </h1>
          <hr className="mx-auto mt-2.5 w-full max-w-sm border-0 border-t border-ra-line-strong" />
          <p className="mt-2.5 text-sm italic text-ra-muted [font-family:var(--font-body)]">
            {tagline} · {reviewCount} reviews
            {urgentCount > 0 && (
              <span className="font-medium text-ra-urgent not-italic"> · {urgentCount} urgent</span>
            )}
          </p>
        </div>
      </div>
    );
  }

  // AIRY (salon) — left, oversized whitespace, large light name, no rule; the
  // switcher recedes to the right.
  if (header === "airy") {
    return (
      <div className="flex flex-wrap items-start justify-between gap-4 pt-3">
        <div className="space-y-2">
          {eyebrow}
          <h1 className="font-ra-heading text-3xl font-medium tracking-[var(--tracking-heading)] text-ra-fg">
            {businessName}
          </h1>
          {taglineNode}
        </div>
        {switcher}
      </div>
    );
  }

  // UTILITY (home) — split, with a solid accent bar flanking the name stack.
  if (header === "utility") {
    return (
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-stretch gap-3">
          <div className="w-1 shrink-0 rounded-full bg-ra-accent" aria-hidden="true" />
          <div>
            {eyebrow}
            <h1 className="mt-1 font-ra-heading text-2xl font-semibold tracking-[var(--tracking-heading)] text-ra-fg">
              {businessName}
            </h1>
            {taglineNode}
          </div>
        </div>
        {switcher}
      </div>
    );
  }

  // SPLIT (auto, dental) — name left, switcher right. Eyebrow/tagline/switcher
  // treatments differ purely by token + variant.
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        {eyebrow}
        <h1 className="mt-1 font-ra-heading text-2xl font-semibold tracking-[var(--tracking-heading)] text-ra-fg">
          {businessName}
        </h1>
        {taglineNode}
      </div>
      {switcher}
    </div>
  );
}
