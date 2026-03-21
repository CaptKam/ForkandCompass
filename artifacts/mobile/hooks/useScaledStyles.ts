import { useMemo } from "react";
import { PixelRatio, TextStyle } from "react-native";

import typography, { TypeVariant } from "@/constants/typography";

type ScaledTypography = Record<TypeVariant, TextStyle>;

export function useScaledStyles(): ScaledTypography {
  const fontScale = PixelRatio.getFontScale();

  return useMemo(() => {
    const scaled = {} as ScaledTypography;
    for (const key of Object.keys(typography) as TypeVariant[]) {
      const base = typography[key];
      scaled[key] = {
        fontFamily: base.fontFamily,
        fontSize: Math.round(base.fontSize * fontScale),
        lineHeight: Math.round(base.lineHeight * fontScale),
        letterSpacing: base.letterSpacing,
        fontWeight: base.fontWeight,
      };
    }
    return scaled;
  }, [fontScale]);
}
