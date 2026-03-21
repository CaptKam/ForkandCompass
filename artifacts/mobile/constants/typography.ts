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
  titleLarge: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: 0,
    fontWeight: "600" as const,
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
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.1,
    fontWeight: "600" as const,
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
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.25,
    fontWeight: "400" as const,
  },
  bodySmall: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.4,
    fontWeight: "400" as const,
  },
  labelLarge: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.1,
    fontWeight: "500" as const,
  },
  labelMedium: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.5,
    fontWeight: "500" as const,
  },
  labelSmall: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.5,
    fontWeight: "500" as const,
  },
} satisfies Record<string, TypeStyle>;

export type TypeVariant = keyof typeof typography;

export default typography;
