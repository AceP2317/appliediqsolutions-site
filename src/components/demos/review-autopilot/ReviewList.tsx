import type { Review } from "./types";
import ReviewCard from "./ReviewCard";

type Draft = { text: string; source: "sample" | "live" };

export default function ReviewList({
  reviews,
  drafts,
  pending,
  posting,
  onDraft,
  onPostDraft,
  onDiscardDraft,
  onEditDraft,
}: {
  reviews: Review[];
  drafts: Record<string, Draft>;
  pending: Record<string, boolean>;
  posting: Record<string, boolean>;
  onDraft: (review: Review) => void;
  onPostDraft: (id: string, text: string) => void;
  onDiscardDraft: (id: string) => void;
  onEditDraft: (id: string, text: string) => void;
}) {
  if (reviews.length === 0) {
    return (
      <p className="rounded-ra-xl border border-dashed border-ra-line-strong p-8 text-center text-sm text-ra-muted">
        No reviews match these filters.
      </p>
    );
  }

  return (
    // ms-reviews + token gap: editorial blueprint zeroes the gap and draws
    // hairline rules between rows (see globals.css); others use a real gap.
    <div className="ms-reviews flex flex-col [gap:var(--list-gap)]">
      {reviews.map((review) => (
        <ReviewCard
          key={review.id}
          review={review}
          draft={drafts[review.id]}
          pending={pending[review.id]}
          posting={posting[review.id]}
          onDraft={onDraft}
          onPostDraft={onPostDraft}
          onDiscardDraft={onDiscardDraft}
          onEditDraft={onEditDraft}
        />
      ))}
    </div>
  );
}
