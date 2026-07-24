export type Platform = "google" | "yelp" | "facebook";

export type Sentiment = "positive" | "neutral" | "negative";

export interface Review {
  id: string;
  platform: Platform;
  author: string;
  rating: 1 | 2 | 3 | 4 | 5;
  text: string;
  date: string; // ISO 8601 (YYYY-MM-DD)
  topics?: string[];
  responded: boolean;
  responseText?: string;
  respondedAt?: string; // ISO 8601
  autoPosted?: boolean; // true when Autopilot posted the reply, false/undefined when a human did
  // Pre-written, on-brand sample reply shown when drafting in the demo (no API
  // call). Present on unanswered reviews; the answered ones already carry
  // responseText. See actions.ts (source: "sample").
  sampleReply?: string;
}

export function sentiment(review: Review): Sentiment {
  if (review.rating >= 4) return "positive";
  if (review.rating === 3) return "neutral";
  return "negative";
}

export function isUrgent(review: Review): boolean {
  return review.rating <= 2 && !review.responded;
}

/**
 * The rule Autopilot follows. Deriving it here keeps the "what does Autopilot do
 * to this review" decision in one testable place, shared by the dashboard and any
 * future rule editor.
 *   positive (4-5★)  → auto-post the drafted reply (safe, high-volume)
 *   neutral  (3★)    → draft it, but hold for one-click human approval
 *   negative (1-2★)  → flag for the owner + draft ready, ALWAYS held (never auto-posted)
 */
export type AutoAction = "auto-post" | "draft-hold" | "flag-hold";

export function autoAction(review: Review): AutoAction {
  const s = sentiment(review);
  if (s === "positive") return "auto-post";
  if (s === "neutral") return "draft-hold";
  return "flag-hold";
}
