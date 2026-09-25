import type { Platform } from "./types";

const PLATFORM_STYLES: Record<Platform, { label: string; dot: string }> = {
  google: { label: "Google", dot: "bg-ra-google" },
  yelp: { label: "Yelp", dot: "bg-ra-yelp" },
  facebook: { label: "Facebook", dot: "bg-ra-facebook" },
};

export default function PlatformBadge({ platform }: { platform: Platform }) {
  const { label, dot } = PLATFORM_STYLES[platform];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-ra-raised px-2 py-0.5 text-[11px] font-medium text-ra-muted ring-1 ring-inset ring-ra-line">
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden="true" />
      {label}
    </span>
  );
}
