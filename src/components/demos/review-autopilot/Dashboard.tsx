import { useMemo, useState } from "react";
import type { Review } from "./types";
import { autoAction, isUrgent } from "./types";
import { draftReviewResponse, draftReviewResponses } from "./drafting";
import {
  VERTICALS,
  VERTICAL_ORDER,
  type VerticalId,
  type CardStyle,
} from "./verticals";
import ReviewFilters, { type FilterState } from "./ReviewFilters";
import ReviewList from "./ReviewList";
import VerticalSwitcher, { type SwitcherVariant } from "./VerticalSwitcher";
import DashboardHeader from "./DashboardHeader";
import AutopilotToggle from "./AutopilotToggle";
import MetricsStrip from "./MetricsStrip";
import Spinner from "./Spinner";

type Draft = { text: string; source: "sample" | "live" };

const today = () => new Date().toISOString().slice(0, 10);

// Honor reduced-motion: posting commits instantly instead of animating.
const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;

// The switcher chrome follows the card blueprint: technical/utility → squared
// segmented control, clinical → pill, editorial/luxe → bare underline tabs.
const SWITCHER_VARIANT: Record<CardStyle, SwitcherVariant> = {
  panel: "segmented",
  clean: "pill",
  floating: "underline",
  editorial: "underline",
  utility: "segmented",
};

export default function Dashboard() {
  const [verticalId, setVerticalId] = useState<VerticalId>("auto");
  // Reviews are keyed by vertical so switching tabs preserves each persona's
  // in-session state (posted replies, autopilot runs) instead of resetting it.
  const [byVertical, setByVertical] = useState<Record<VerticalId, Review[]>>(
    () =>
      Object.fromEntries(
        VERTICAL_ORDER.map((id) => [id, VERTICALS[id].reviews])
      ) as Record<VerticalId, Review[]>
  );
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [posting, setPosting] = useState<Record<string, boolean>>({});
  const [autopilot, setAutopilot] = useState(false);
  const [busy, setBusy] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    platform: "all",
    sentiment: "all",
    responded: "all",
    sort: "newest",
  });

  const vertical = VERTICALS[verticalId];
  const profile = vertical.profile;
  const theme = vertical.theme;
  const reviews = byVertical[verticalId];

  // Each vertical is its own demo scenario. Switching personas resets Autopilot
  // to off and clears any in-progress drafts/spinners so the toggle never reads
  // "On" over another business's numbers and no draft carries across personas.
  function selectVertical(id: VerticalId) {
    setVerticalId(id);
    setAutopilot(false);
    setDrafts({});
    setPending({});
    setPosting({});
  }

  function setReviews(updater: (prev: Review[]) => Review[]) {
    setByVertical((prev) => ({ ...prev, [verticalId]: updater(prev[verticalId]) }));
  }

  const urgentCount = useMemo(() => reviews.filter(isUrgent).length, [reviews]);
  const autoHandled = useMemo(
    () => reviews.filter((r) => r.responded && r.autoPosted).length,
    [reviews]
  );

  const visibleReviews = useMemo(() => {
    const list = reviews.filter((r) => {
      if (filters.platform !== "all" && r.platform !== filters.platform) return false;
      if (filters.sentiment !== "all") {
        const s = r.rating >= 4 ? "positive" : r.rating === 3 ? "neutral" : "negative";
        if (s !== filters.sentiment) return false;
      }
      if (filters.responded === "responded" && !r.responded) return false;
      if (filters.responded === "unresponded" && r.responded) return false;
      return true;
    });

    return [...list].sort((a, b) => {
      switch (filters.sort) {
        case "oldest":
          return a.date.localeCompare(b.date);
        case "rating-asc":
          return a.rating - b.rating;
        case "rating-desc":
          return b.rating - a.rating;
        default:
          return b.date.localeCompare(a.date);
      }
    });
  }, [reviews, filters]);

  const unanswered = reviews.filter((r) => !r.responded);
  const awaitingCount = unanswered.length;
  // Reviews with a ready draft that isn't already posting — the "Post all" target.
  const postableCount = reviews.filter(
    (r) => !r.responded && drafts[r.id] && !posting[r.id]
  ).length;

  // --- single draft (one card's "Draft reply") -------------------------------
  async function handleDraft(review: Review) {
    setPending((p) => ({ ...p, [review.id]: true }));
    try {
      const res = await draftReviewResponse(review, profile);
      setDrafts((d) => ({ ...d, [review.id]: { text: res.draft, source: res.source } }));
    } finally {
      // Release the spinner even if the server action throws at the transport
      // layer (network drop, RSC error) — draftOne handles model errors itself.
      setPending((p) => ({ ...p, [review.id]: false }));
    }
  }

  function editDraft(id: string, text: string) {
    setDrafts((d) => (d[id] ? { ...d, [id]: { ...d[id], text } } : d));
  }

  function discardDraft(id: string) {
    setDrafts((d) => {
      const next = { ...d };
      delete next[id];
      return next;
    });
  }

  // --- posting (with a brief "Posting to …" transition) ----------------------
  function clearPosting(id: string) {
    setPosting((p) => {
      const next = { ...p };
      delete next[id];
      return next;
    });
  }

  // The actual commit. Functional updates throughout so it's safe to fire from a
  // setTimeout even if the user has moved on.
  function commitPost(id: string, text: string, auto: boolean) {
    setReviews((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, responded: true, responseText: text, respondedAt: today(), autoPosted: auto }
          : r
      )
    );
    discardDraft(id);
    clearPosting(id);
  }

  // Post a batch with a staggered "posting…" animation (Post all + Autopilot).
  function postBatch(items: Array<{ id: string; text: string }>, auto: boolean) {
    if (!items.length) return;
    if (prefersReducedMotion()) {
      items.forEach((it) => commitPost(it.id, it.text, auto));
      return;
    }
    setPosting((p) => {
      const next = { ...p };
      items.forEach((it) => (next[it.id] = true));
      return next;
    });
    items.forEach((it, i) =>
      setTimeout(() => commitPost(it.id, it.text, auto), 350 + i * 160)
    );
  }

  function postReply(id: string, text: string, auto = false) {
    if (posting[id]) return;
    if (prefersReducedMotion()) {
      commitPost(id, text, auto);
      return;
    }
    setPosting((p) => ({ ...p, [id]: true }));
    setTimeout(() => commitPost(id, text, auto), 800);
  }

  // --- bulk "Post all" (posts every drafted reply, staggered) ----------------
  function postAll() {
    const items = reviews
      .filter((r) => !r.responded && drafts[r.id] && !posting[r.id])
      .map((r) => ({ id: r.id, text: drafts[r.id].text }));
    postBatch(items, false);
  }

  // --- bulk "Draft all" ------------------------------------------------------
  async function draftAll() {
    // Skip reviews that already have a draft so a bulk run never clobbers an edit
    // the owner is in the middle of making.
    const queue = unanswered.filter((r) => !drafts[r.id]);
    if (!queue.length || busy) return;
    setBusy(true);
    setPending((p) => {
      const next = { ...p };
      queue.forEach((r) => (next[r.id] = true));
      return next;
    });
    try {
      const results = await draftReviewResponses(queue, profile);
      setDrafts((d) => {
        const next = { ...d };
        results.forEach((r) => (next[r.id] = { text: r.draft, source: r.source }));
        return next;
      });
    } finally {
      setPending((p) => {
        const next = { ...p };
        queue.forEach((r) => (next[r.id] = false));
        return next;
      });
      setBusy(false);
    }
  }

  // --- Autopilot: draft everything, then apply the rules ---------------------
  // positive (4-5★) → auto-post · neutral (3★) → draft & hold · negative (1-2★) → flag & hold.
  // Negative reviews are never auto-posted — that restraint is the trust story.
  async function toggleAutopilot() {
    const turningOn = !autopilot;
    setAutopilot(turningOn);
    if (!turningOn || busy) return;

    // Skip reviews already answered or already carrying a draft (don't clobber edits).
    const queue = reviews.filter((r) => !r.responded && !drafts[r.id]);
    if (!queue.length) return;

    setBusy(true);
    setPending((p) => {
      const next = { ...p };
      queue.forEach((r) => (next[r.id] = true));
      return next;
    });

    try {
      const results = await draftReviewResponses(queue, profile);
      const draftById = new Map(results.map((r) => [r.id, r]));

      // Hold neutrals & negatives as editable drafts...
      setDrafts((d) => {
        const next = { ...d };
        queue.forEach((r) => {
          const res = draftById.get(r.id);
          if (res && autoAction(r) !== "auto-post") {
            next[r.id] = { text: res.draft, source: res.source };
          }
        });
        return next;
      });
      // ...and auto-post the positives through the same staggered posting animation.
      const toPost = queue.flatMap((r) => {
        const res = draftById.get(r.id);
        return res && autoAction(r) === "auto-post"
          ? [{ id: r.id, text: res.draft }]
          : [];
      });
      postBatch(toPost, true);
    } finally {
      setPending((p) => {
        const next = { ...p };
        queue.forEach((r) => (next[r.id] = false));
        return next;
      });
      setBusy(false);
    }
  }

  return (
    // Outer full-bleed layer carries the skin (data-vertical) + blueprint
    // (data-card/density/label) so the whole page re-skins AND restructures per
    // business; inner column holds content.
    <div
      data-demo="review-autopilot"
      data-vertical={verticalId}
      data-card={theme.card}
      data-density={theme.density}
      data-label={theme.label}
      className="min-h-screen bg-ra-surface"
    >
      <div className="mx-auto max-w-3xl animate-ra-rise px-4 py-8">
      <header className="mb-5 space-y-4">
        <DashboardHeader
          header={theme.header}
          businessName={vertical.businessName}
          tagline={vertical.tagline}
          reviewCount={reviews.length}
          urgentCount={urgentCount}
          mono={theme.label === "mono"}
          switcher={
            <VerticalSwitcher
              verticals={VERTICALS}
              order={VERTICAL_ORDER}
              active={verticalId}
              onSelect={selectVertical}
              variant={SWITCHER_VARIANT[theme.card]}
            />
          }
        />

        <MetricsStrip reviews={reviews} metrics={theme.metrics} />

        <AutopilotToggle
          on={autopilot}
          busy={busy}
          autoHandled={autoHandled}
          awaiting={awaitingCount}
          onToggle={toggleAutopilot}
        />

        <p className="text-xs leading-relaxed text-ra-muted">
          <span className="font-medium text-ra-accent">✨ Replies shown are samples.</span>{" "}
          In production, Autopilot drafts from a voice profile built around how you actually talk
          to customers — so every reply reads like you wrote it yourself.
        </p>
      </header>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <ReviewFilters filters={filters} onChange={setFilters} />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={draftAll}
            disabled={busy || awaitingCount === 0}
            className="inline-flex items-center gap-1.5 rounded-ra-lg border border-ra-accent-ring bg-ra-accent-soft px-3.5 py-1.5 text-sm font-semibold text-ra-accent shadow-ra-card transition hover:brightness-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy && <Spinner className="h-3.5 w-3.5" />}
            Draft all {awaitingCount > 0 ? `(${awaitingCount})` : ""}
          </button>
          {postableCount > 0 && (
            <button
              type="button"
              onClick={postAll}
              className="inline-flex items-center gap-1.5 rounded-ra-lg bg-ra-accent px-3.5 py-1.5 text-sm font-semibold text-ra-accent-fg shadow-sm transition hover:brightness-95"
            >
              Post all ({postableCount})
            </button>
          )}
        </div>
      </div>

      <ReviewList
        reviews={visibleReviews}
        drafts={drafts}
        pending={pending}
        posting={posting}
        onDraft={handleDraft}
        onPostDraft={(id, text) => postReply(id, text, false)}
        onDiscardDraft={discardDraft}
        onEditDraft={editDraft}
      />
      </div>
    </div>
  );
}
