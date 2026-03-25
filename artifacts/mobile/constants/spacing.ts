import { A11Y } from "./typography";

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

// Standard bottom padding for ScrollViews above the tab bar.
// TAB_BAR_HEIGHT (56) + 44pt breathing room = 100pt minimum.
export const SCROLL_BOTTOM_INSET = A11Y.TAB_BAR_HEIGHT + 44;
