import type { Review } from "./types";
import type { BusinessProfile } from "./drafting";
import { MOCK_REVIEWS } from "./reviews";
import {
  RESTAURANT_REVIEWS,
  SALON_REVIEWS,
  DENTAL_REVIEWS,
  HOME_REVIEWS,
} from "./vertical-reviews";

export type VerticalId = "auto" | "restaurant" | "salon" | "dental" | "home";

/**
 * Per-vertical "blueprint" — the structural identity on top of the color/font skin
 * in globals.css. `card`/`density`/`label` are written as data-* attributes on the
 * Dashboard wrapper and drive CSS tokens (zero component props); `metrics`/`header`
 * select a JSX composition branch. One dashboard, five genuinely different layouts.
 */
export type CardStyle = "panel" | "editorial" | "floating" | "clean" | "utility";
export type MetricsStyle = "cards" | "panel" | "inline";
export type HeaderStyle = "split" | "masthead" | "airy" | "utility";
export type LabelStyle = "upper" | "mono" | "caps" | "bold";
export type Density = "compact" | "regular" | "airy";

export interface VerticalTheme {
  card: CardStyle; // review-card + metric-tile chrome bundle (CSS)
  density: Density; // padding / gap scale (CSS)
  label: LabelStyle; // eyebrow / stat-label / reply-label treatment (CSS)
  metrics: MetricsStyle; // metrics arrangement (JSX branch in MetricsStrip)
  header: HeaderStyle; // header composition (JSX branch in Dashboard)
}

export interface VerticalConfig {
  id: VerticalId;
  label: string; // tab label
  businessName: string;
  tagline: string; // short subhead under the name
  profile: BusinessProfile; // feeds the AI reply prompt
  theme: VerticalTheme;
  reviews: Review[];
}

/**
 * One premium design system, five business personas. Switching the vertical swaps
 * the business identity, the accent (via [data-vertical] in globals.css), the AI
 * voice, and the review set — so a prospect sees their own kind of business.
 * The "auto" persona reuses the original Riverside Auto Care review set.
 */
export const VERTICALS: Record<VerticalId, VerticalConfig> = {
  auto: {
    id: "auto",
    label: "Auto Repair",
    businessName: "Riverside Auto Care",
    tagline: "Family-owned auto repair",
    profile: {
      name: "Riverside Auto Care",
      industry: "family-owned auto repair shop",
      voice:
        "warm, straightforward, and a little folksy — never corporate-sounding",
    },
    // Instrument cluster: tight bordered panels, mono technical labels, gauge metrics.
    theme: { card: "panel", density: "compact", label: "mono", metrics: "panel", header: "split" },
    reviews: MOCK_REVIEWS,
  },
  restaurant: {
    id: "restaurant",
    label: "Restaurant",
    businessName: "Amara Kitchen",
    tagline: "Neighborhood bistro",
    profile: {
      name: "Amara Kitchen",
      industry: "neighborhood bistro",
      voice:
        "warm, hospitable, and food-proud — like a chef greeting you at the table",
    },
    // Masthead: centered serif name over a hairline rule, editorial list-rows, inline stats.
    theme: { card: "editorial", density: "regular", label: "caps", metrics: "inline", header: "masthead" },
    reviews: RESTAURANT_REVIEWS,
  },
  salon: {
    id: "salon",
    label: "Salon & Spa",
    businessName: "Lumen Salon & Spa",
    tagline: "Hair studio & day spa",
    profile: {
      name: "Lumen Salon & Spa",
      industry: "hair salon and day spa",
      voice: "polished, personable, and upbeat — stylish without being fussy",
    },
    // Airy sheet: borderless floating cards on tint, oversized whitespace, small-caps labels.
    theme: { card: "floating", density: "airy", label: "caps", metrics: "cards", header: "airy" },
    reviews: SALON_REVIEWS,
  },
  dental: {
    id: "dental",
    label: "Dental",
    businessName: "Bright Harbor Dental",
    tagline: "Family & cosmetic dentistry",
    profile: {
      name: "Bright Harbor Dental",
      industry: "family dental practice",
      voice:
        "reassuring, professional, and caring — calm and never clinical-cold",
    },
    // Clean chart: crisp cool-bordered cards, soft pills, the calm reference the others deviate from.
    theme: { card: "clean", density: "regular", label: "upper", metrics: "cards", header: "split" },
    reviews: DENTAL_REVIEWS,
  },
  home: {
    id: "home",
    label: "Home Services",
    businessName: "Summit Comfort HVAC",
    tagline: "Heating, cooling & plumbing",
    profile: {
      name: "Summit Comfort HVAC",
      industry: "heating, cooling, and plumbing company",
      voice:
        "dependable, plainspoken, and no-nonsense — a straight-shooting tradesperson",
    },
    // Control panel: squared cards with a left accent stripe, heavy bordered gauge panel, bold labels.
    theme: { card: "utility", density: "compact", label: "bold", metrics: "panel", header: "utility" },
    reviews: HOME_REVIEWS,
  },
};

export const VERTICAL_ORDER: VerticalId[] = [
  "auto",
  "restaurant",
  "salon",
  "dental",
  "home",
];
