import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import {
  NotoSerif_400Regular,
  NotoSerif_600SemiBold,
  NotoSerif_700Bold,
  NotoSerif_400Regular_Italic,
  NotoSerif_600SemiBold_Italic,
} from "@expo-google-fonts/noto-serif";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppProvider } from "@/contexts/AppContext";
import { useReducedMotion } from "@/hooks/useReducedMotion";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const reducedMotion = useReducedMotion();
  const slideAnimation = reducedMotion ? "fade" as const : "slide_from_right" as const;
  const modalAnimation = reducedMotion ? "fade" as const : "slide_from_bottom" as const;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="onboarding"
        options={{ animation: slideAnimation }}
      />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="country/[id]"
        options={{ animation: slideAnimation }}
      />
      <Stack.Screen
        name="recipe/[id]"
        options={{ animation: slideAnimation }}
      />
      <Stack.Screen
        name="cook-mode"
        options={{ animation: modalAnimation, presentation: "modal" }}
      />
      <Stack.Screen
        name="kitchen-scanner"
        options={{ animation: modalAnimation, presentation: "modal" }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    NotoSerif_400Regular,
    NotoSerif_600SemiBold,
    NotoSerif_700Bold,
    NotoSerif_400Regular_Italic,
    NotoSerif_600SemiBold_Italic,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AppProvider>
            <GestureHandlerRootView>
              <KeyboardProvider>
                <RootLayoutNav />
              </KeyboardProvider>
            </GestureHandlerRootView>
          </AppProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
