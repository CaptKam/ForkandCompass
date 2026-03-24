import { TextStyle } from "react-native";

export interface TypeStyle {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  fontWeight: TextStyle["fontWeight"];
}

const typography = {
  displayLarge: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 44,
    lineHeight: 52,
    letterSpacing: -0.5,
    fontWeight: "600" as const,
  },
  displayMedium: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 36,
    lineHeight: 44,
    letterSpacing: -0.5,
    fontWeight: "600" as const,
  },
  // Display — screen titles, country hero names
  display: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.25,
    fontWeight: "700" as const,
  },
  headlineLarge: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.25,
    fontWeight: "600" as const,
  },
  headlineMedium: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.5,
    fontWeight: "600" as const,
  },
  // Headline — section headers, recipe titles on cards
  headline: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: 0,
    fontWeight: "700" as const,
  },
  titleLarge: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: 0,
    fontWeight: "600" as const,
  },
  // Title — recipe name in list rows, region names
  title: {
    fontFamily: "NotoSerif_500Medium",
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: 0,
    fontWeight: "500" as const,
  },
  titleMedium: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    lineHeight: 24,
    letterSpacing: 0.15,
    fontWeight: "600" as const,
  },
  titleSmall: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0.1,
    fontWeight: "600" as const,
  },
  // Body — descriptions, instructions, paragraph text
  body: {
    fontFamily: "Inter_400Regular",
    fontSize: 17,
    lineHeight: 26,
    letterSpacing: 0,
    fontWeight: "400" as const,
  },
  // Body emphasis — ingredient names, day labels, button text
  bodyEmphasis: {
    fontFamily: "Inter_500Medium",
    fontSize: 17,
    lineHeight: 26,
    letterSpacing: 0,
    fontWeight: "500" as const,
  },
  bodyLarge: {
    fontFamily: "Inter_400Regular",
    fontSize: 18,
    lineHeight: 26,
    letterSpacing: 0,
    fontWeight: "400" as const,
  },
  bodyMedium: {
    fontFamily: "Inter_400Regular",
    fontSize: 17,
    lineHeight: 26,
    letterSpacing: 0.25,
    fontWeight: "400" as const,
  },
  bodySmall: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.4,
    fontWeight: "400" as const,
  },
  // Callout — subtitles, recipe metadata
  callout: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0,
    fontWeight: "400" as const,
  },
  // Caption — section labels, timestamps
  caption: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.1,
    fontWeight: "500" as const,
  },
  labelLarge: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.1,
    fontWeight: "500" as const,
  },
  // Small — badges, chip text, tab bar labels (13pt minimum)
  small: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.5,
    fontWeight: "500" as const,
  },
  labelMedium: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.5,
    fontWeight: "500" as const,
  },
  labelSmall: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.5,
    fontWeight: "500" as const,
  },
} satisfies Record<string, TypeStyle>;

export type TypeVariant = keyof typeof typography;

/**
 * Accessibility sizing constants
 * Per Typography & Sizing Accessibility Spec for users aged 65-75+
 */
export const A11Y = {
  /** Absolute minimum font size — nothing renders below this */
  MIN_FONT_SIZE: 13,
  /** Minimum tap target size */
  MIN_TAP_TARGET: 48,
  /** Primary button height */
  PRIMARY_BUTTON_HEIGHT: 52,
  /** Minimum list row height */
  MIN_ROW_HEIGHT: 56,
  /** Minimum gap between interactive elements */
  MIN_INTERACTIVE_GAP: 8,
  /** Default maxFontSizeMultiplier */
  MAX_FONT_SCALE: 1.5,
  /** Cook mode maxFontSizeMultiplier */
  COOK_MODE_MAX_FONT_SCALE: 2.0,
  /** Tab bar minimum height */
  TAB_BAR_HEIGHT: 56,
} as const;

export default typography;
