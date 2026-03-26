import { A11Y } from "./typography";

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  /** Standard horizontal page margin per design spec */
  pageMargin: 20,
} as const;

// Standard bottom padding for ScrollViews above the tab bar.
// TAB_BAR_HEIGHT (56) + 44pt breathing room + 68pt for CookingPill
// (56px pill + 12px gap) when a cooking session is active.
// Always-on padding — slightly generous when no pill, but prevents
// content from being clipped when the pill appears.
export const SCROLL_BOTTOM_INSET = A11Y.TAB_BAR_HEIGHT + 44 + 68;
