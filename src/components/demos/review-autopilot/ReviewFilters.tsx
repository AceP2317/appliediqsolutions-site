import type { Platform, Sentiment } from "./types";

export type ResponseFilter = "all" | "responded" | "unresponded";
export type SortOrder = "newest" | "oldest" | "rating-asc" | "rating-desc";

export interface FilterState {
  platform: Platform | "all";
  sentiment: Sentiment | "all";
  responded: ResponseFilter;
  sort: SortOrder;
}

const SELECT =
  "rounded-ra-lg border border-ra-line bg-ra-raised px-2.5 py-1.5 text-sm text-ra-fg shadow-ra-card outline-none transition focus:border-ra-accent focus:ring-2 focus:ring-ra-accent-ring";

export default function ReviewFilters({
  filters,
  onChange,
}: {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        aria-label="Filter by platform"
        value={filters.platform}
        onChange={(e) =>
          onChange({ ...filters, platform: e.target.value as FilterState["platform"] })
        }
        className={SELECT}
      >
        <option value="all">All platforms</option>
        <option value="google">Google</option>
        <option value="yelp">Yelp</option>
        <option value="facebook">Facebook</option>
      </select>

      <select
        aria-label="Filter by sentiment"
        value={filters.sentiment}
        onChange={(e) =>
          onChange({ ...filters, sentiment: e.target.value as FilterState["sentiment"] })
        }
        className={SELECT}
      >
        <option value="all">All sentiment</option>
        <option value="positive">Positive</option>
        <option value="neutral">Neutral</option>
        <option value="negative">Negative</option>
      </select>

      <select
        aria-label="Filter by response status"
        value={filters.responded}
        onChange={(e) => onChange({ ...filters, responded: e.target.value as ResponseFilter })}
        className={SELECT}
      >
        <option value="all">All reviews</option>
        <option value="unresponded">Awaiting reply</option>
        <option value="responded">Replied</option>
      </select>

      <select
        aria-label="Sort reviews"
        value={filters.sort}
        onChange={(e) => onChange({ ...filters, sort: e.target.value as SortOrder })}
        className={SELECT}
      >
        <option value="newest">Newest first</option>
        <option value="oldest">Oldest first</option>
        <option value="rating-asc">Lowest rating</option>
        <option value="rating-desc">Highest rating</option>
      </select>
    </div>
  );
}
