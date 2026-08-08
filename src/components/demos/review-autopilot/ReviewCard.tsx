import type { Platform, Review } from "./types";
import { isUrgent } from "./types";
import PlatformBadge from "./PlatformBadge";
import StarRating from "./StarRating";
import DraftEditor from "./DraftEditor";
import Spinner from "./Spinner";

type Draft = { text: string; source: "sample" | "live" };

// Fictional businesses, so these are illustrative source links — they open the
// platform, not a specific live review. Labelled "View on {Platform}".
const PLATFORM: Record<Platform, { label: string; url: string }> = {
  google: { label: "Google", url: "https://www.google.com/maps" },
  yelp: { label: "Yelp", url: "https://www.yelp.com" },
  facebook: { label: "Facebook", url: "https://www.facebook.com" },
};

export default function ReviewCard({
  review,
  draft,
  pending,
  posting,
  onDraft,
  onPostDraft,
  onDiscardDraft,
  onEditDraft,
}: {
  review: Review;
  draft?: Draft;
  pending?: boolean;
  posting?: boolean;
  onDraft: (review: Review) => void;
  onPostDraft: (id: string, text: string) => void;
  onDiscardDraft: (id: string) => void;
  onEditDraft: (id: string, text: string) => void;
}) {
  const urgent = isUrgent(review);
  const platform = PLATFORM[review.platform];

  return (
    <article
      data-urgent={urgent ? "" : undefined}
      className="ms-card transition-shadow hover:shadow-ra-lift"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <PlatformBadge platform={review.platform} />
          <StarRating rating={review.rating} />
          {urgent && (
            <span className="inline-flex items-center gap-1 rounded-full bg-ra-urgent-soft px-2 py-0.5 text-xs font-semibold text-ra-urgent ring-1 ring-inset ring-ra-urgent-ring">
              Needs your attention
            </span>
          )}
          {review.responded && review.autoPosted && (
            <span className="inline-flex items-center gap-1 rounded-full bg-ra-accent-soft px-2 py-0.5 text-xs font-semibold text-ra-accent ring-1 ring-inset ring-ra-accent-ring">
              ✨ Autopilot
            </span>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-0.5">
          <span className="text-xs text-ra-faint [font-family:var(--meta-font)]">
            {review.date}
          </span>
          <a
            href={platform.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-ra-muted underline-offset-2 transition hover:text-ra-accent hover:underline"
          >
            View on {platform.label} ↗
          </a>
        </div>
      </div>

      {/* Author + copy inherit --font-body (Fraunces serif for the editorial
          restaurant blueprint; Geist sans everywhere else). */}
      <p className="mt-2.5 text-sm font-semibold text-ra-fg [font-family:var(--font-body)]">
        {review.author}
      </p>
      <p className="mt-1 text-sm leading-relaxed text-ra-muted [font-family:var(--font-body)]">
        {review.text}
      </p>

      {review.topics && review.topics.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {review.topics.map((t) => (
            <span
              key={t}
              className="ms-tag px-2 py-0.5 text-[11px] font-medium text-ra-muted"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {posting ? (
        <div className="mt-3 flex items-center gap-2 text-sm text-ra-muted">
          <Spinner /> Posting to {platform.label}…
        </div>
      ) : review.responded && review.responseText ? (
        <div className="mt-3 rounded-ra-lg border border-ra-line bg-ra-sunken p-3 text-sm text-ra-fg">
          <p className="ms-label mb-1 text-[11px] text-ra-muted">
            {review.autoPosted ? "Auto-posted reply" : "Your reply"}
          </p>
          <p className="leading-relaxed">{review.responseText}</p>
        </div>
      ) : draft ? (
        <DraftEditor
          text={draft.text}
          source={draft.source}
          onChange={(t) => onEditDraft(review.id, t)}
          onPost={() => onPostDraft(review.id, draft.text)}
          onDiscard={() => onDiscardDraft(review.id)}
        />
      ) : pending ? (
        <div className="mt-3 flex items-center gap-2 text-sm text-ra-muted">
          <Spinner /> Drafting a reply…
        </div>
      ) : (
        <button
          type="button"
          onClick={() => onDraft(review)}
          className="mt-3 inline-flex items-center gap-1.5 rounded-ra-lg bg-ra-accent px-3.5 py-1.5 text-sm font-semibold text-ra-accent-fg shadow-sm transition hover:brightness-95 active:brightness-90"
        >
          Draft reply
        </button>
      )}
    </article>
  );
}
