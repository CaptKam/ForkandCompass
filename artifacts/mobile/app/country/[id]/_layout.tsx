import { Stack } from "expo-router";
import React from "react";

import { useReducedMotion } from "@/hooks/useReducedMotion";

export default function CountryLayout() {
  const reducedMotion = useReducedMotion();
  const slideAnimation = reducedMotion ? "fade" as const : "slide_from_right" as const;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="recipes" options={{ animation: slideAnimation }} />
    </Stack>
  );
}
