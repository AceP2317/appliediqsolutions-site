import type { VerticalConfig, VerticalId } from "./verticals";

export type SwitcherVariant = "pill" | "segmented" | "underline";

// Three switcher chromes so the tab control matches each blueprint: rounded pill
// (clinical), squared segmented control (technical/utility), or bare underline
// tabs (editorial/luxe). Active state always uses the vertical's accent.
const CONTAINER: Record<SwitcherVariant, string> = {
  pill: "gap-1 overflow-x-auto rounded-full border border-ra-line bg-ra-raised p-1 shadow-ra-card",
  segmented: "gap-0.5 overflow-x-auto rounded-ra-md border border-ra-line-strong bg-ra-raised p-0.5 shadow-ra-card",
  // no overflow-x-auto: the -mb-px underline tabs would trigger a stray scrollbar
  underline: "gap-4 border-b border-ra-line",
};

const TAB: Record<SwitcherVariant, { base: string; active: string; idle: string }> = {
  pill: {
    base: "rounded-full px-3.5 py-1.5",
    active: "bg-ra-accent text-ra-accent-fg shadow-sm",
    idle: "text-ra-muted hover:bg-ra-sunken hover:text-ra-fg",
  },
  segmented: {
    base: "rounded-[3px] px-3.5 py-1.5",
    active: "bg-ra-accent text-ra-accent-fg shadow-sm",
    idle: "text-ra-muted hover:bg-ra-sunken hover:text-ra-fg",
  },
  underline: {
    base: "-mb-px border-b-2 border-transparent px-1 py-1.5",
    active: "border-ra-accent text-ra-accent",
    idle: "text-ra-muted hover:text-ra-fg",
  },
};

export default function VerticalSwitcher({
  verticals,
  order,
  active,
  onSelect,
  variant = "pill",
}: {
  verticals: Record<VerticalId, VerticalConfig>;
  order: VerticalId[];
  active: VerticalId;
  onSelect: (id: VerticalId) => void;
  variant?: SwitcherVariant;
}) {
  const tab = TAB[variant];
  return (
    <div
      role="tablist"
      aria-label="Business type"
      /* `shrink-0` HERE MADE THE overflow-x-auto BESIDE IT DEAD CODE. It stops the
         strip shrinking below its content, so on a 390px phone the box itself was
         529px — 155px off the side of the page — and a container that never
         narrows never scrolls. html/body carry overflow-x: clip, so those tabs
         were simply cut off. `min-w-0 max-w-full` lets it narrow, which is what
         switches the scrolling on. The buttons keep their own shrink-0 so the
         labels do not squash. */
      className={`flex min-w-0 max-w-full ${CONTAINER[variant]}`}
    >
      {order.map((id) => {
        const isActive = id === active;
        return (
          <button
            key={id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(id)}
            className={`shrink-0 text-sm font-medium transition-colors ${tab.base} ${
              isActive ? tab.active : tab.idle
            }`}
          >
            {verticals[id].label}
          </button>
        );
      })}
    </div>
  );
}
