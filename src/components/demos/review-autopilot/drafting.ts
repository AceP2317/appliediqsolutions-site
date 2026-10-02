import { sentiment, type Review } from "./types";

export type BusinessProfile = { name: string; industry: string; voice: string };
// Keep the "sample" | "live" union — DraftEditor's sample-chip logic keys off it.
export type DraftResult = { draft: string; source: "sample" | "live" };

// This port drafts from pre-written, on-brand SAMPLE replies only — no API key,
// no per-visitor spend, always works. The source app's live-AI path (a server
// action behind ENABLE_LIVE_AI) was deliberately dropped for the public site; if
// live drafting is ever wanted here, it routes through the Worker like /api/ask.
// The UI labels every draft as a sample — that honesty note is load-bearing.

// A short pause keeps the "Drafting a reply…" spinner legible now that there is
// no network hop behind it.
const DELAY_MS = 450;

// The sample draft: prefer each review's hand-written, on-brand sampleReply;
// fall back to a sentiment-shaped template if a review has none, so drafting
// always returns something sensible. Always surfaced as "sample" in the UI.
function sampleDraft(r: Review, p: BusinessProfile): string {
  if (r.sampleReply) return r.sampleReply;
  const name = r.author.split(/\s+/)[0] || "there";
  switch (sentiment(r)) {
    case "positive":
      return `Thank you so much, ${name} — a review like this makes everyone at ${p.name} smile. We're thrilled you had a great experience, and we can't wait to welcome you back.`;
    case "neutral":
      return `Thanks for the honest feedback, ${name}. We're glad we could help, and we hear you on where we fell short — that's exactly the kind of note that helps us do better. We hope to earn a five-star visit next time.`;
    case "negative":
      return `${name}, we're sorry this fell short of the standard we hold ourselves to at ${p.name} — that's not the experience we want anyone to have. Please reach out to us directly so we can understand what happened and make it right.`;
  }
}

const wait = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));

/** Single draft — used by the response modal. Always resolves to a draft. */
export async function draftReviewResponse(
  review: Review,
  profile: BusinessProfile
): Promise<DraftResult> {
  await wait(DELAY_MS);
  return { draft: sampleDraft(review, profile), source: "sample" };
}

/** Batch draft — used by "Draft all" and Autopilot. */
export async function draftReviewResponses(
  reviews: Review[],
  profile: BusinessProfile
): Promise<Array<{ id: string } & DraftResult>> {
  await wait(DELAY_MS);
  return reviews.map((r) => ({
    id: r.id,
    draft: sampleDraft(r, profile),
    source: "sample" as const,
  }));
}
