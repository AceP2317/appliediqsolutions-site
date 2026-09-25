export default function DraftEditor({
  text,
  source,
  onChange,
  onPost,
  onDiscard,
}: {
  text: string;
  source: "sample" | "live";
  onChange: (text: string) => void;
  onPost: () => void;
  onDiscard: () => void;
}) {
  const isSample = source === "sample";
  return (
    <div className="mt-3 rounded-ra-lg border border-ra-accent-ring bg-ra-accent-soft p-3">
      <div className="mb-1.5 flex items-center gap-2">
        <span className="ms-label text-[11px] text-ra-accent">
          {(isSample ? "Sample reply" : "AI draft") + " — review & post"}
        </span>
        {isSample && (
          <span
            className="rounded-full bg-ra-sunken px-2 py-0.5 text-[10px] font-medium text-ra-muted"
            title="Illustrative reply. In production, Autopilot generates this in your own voice."
          >
            sample
          </span>
        )}
      </div>
      <textarea
        value={text}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="w-full resize-y rounded-ra-md border border-ra-line bg-ra-raised p-2.5 text-sm leading-relaxed text-ra-fg outline-none transition focus:border-ra-accent focus:ring-2 focus:ring-ra-accent-ring"
      />
      <div className="mt-2 flex justify-end gap-2">
        <button
          type="button"
          onClick={onDiscard}
          className="rounded-ra-md px-3 py-1.5 text-sm font-medium text-ra-muted transition hover:bg-ra-sunken"
        >
          Discard
        </button>
        <button
          type="button"
          onClick={onPost}
          disabled={!text.trim()}
          className="inline-flex items-center gap-1.5 rounded-ra-md bg-ra-accent px-3.5 py-1.5 text-sm font-semibold text-ra-accent-fg shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Post reply
        </button>
      </div>
    </div>
  );
}
