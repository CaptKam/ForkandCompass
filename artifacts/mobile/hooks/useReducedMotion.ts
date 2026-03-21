import { useEffect, useState } from "react";
import { AccessibilityInfo, Platform } from "react-native";

/**
 * Returns true when the user has enabled "Reduce Motion" in system settings.
 * Uses AccessibilityInfo for reactive updates on iOS/Android.
 * On web, checks the prefers-reduced-motion media query.
 */
export function useReducedMotion(): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.matchMedia) {
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        setEnabled(mq.matches);
        const handler = (e: MediaQueryListEvent) => setEnabled(e.matches);
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
      }
      return;
    }

    AccessibilityInfo.isReduceMotionEnabled().then(setEnabled);
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setEnabled,
    );
    return () => subscription.remove();
  }, []);

  return enabled;
}
