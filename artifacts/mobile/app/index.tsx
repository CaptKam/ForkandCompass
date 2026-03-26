import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/contexts/AppContext";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useScaledStyles } from "@/hooks/useScaledStyles";
import { WELCOME_HERO_IMAGE } from "@/constants/data";
import Colors from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function WelcomeScreen() {
  const { hasSeenWelcome, hasCompletedOnboarding, setHasSeenWelcome } = useApp();
  const colors = useThemeColors();
  const type = useScaledStyles();
  const insets = useSafeAreaInsets();

  React.useEffect(() => {
    if (hasCompletedOnboarding) {
      router.replace("/(tabs)");
    } else if (hasSeenWelcome) {
      router.replace("/onboarding");
    }
  }, [hasSeenWelcome, hasCompletedOnboarding]);

  if (hasSeenWelcome || hasCompletedOnboarding) return null;

  const handleStart = () => {
    setHasSeenWelcome(true);
    router.replace("/onboarding");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.onSurface }]}>
      <StatusBar style="light" />
      <Image
        source={{ uri: WELCOME_HERO_IMAGE }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={600}
        placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }}
        onError={(e) => console.warn("[Image] Failed to load:", e.error)}
      />
      <LinearGradient
        colors={["transparent", "rgba(29,27,24,0.5)", "rgba(29,27,24,0.85)"]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          styles.content,
          {
            paddingBottom: Math.max(insets.bottom, 24) + 24,
            paddingTop: Platform.OS === "web" ? 67 : insets.top,
          },
        ]}
      >
        <View style={styles.textContainer}>
          <Text style={[type.displayLarge, styles.title]}>
            Your kitchen.{"\n"}A different country{"\n"}every night.
          </Text>
          <Pressable
            onPress={handleStart}
            accessibilityRole="button"
            accessibilityLabel="Start your journey — begin onboarding"
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: colors.primary },
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={[type.titleMedium, { color: colors.onPrimary }]}>Start Your Journey</Text>
            <Ionicons name="arrow-forward" size={20} color={colors.onPrimary} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 20,
  },
  textContainer: {
    maxWidth: 400,
  },
  title: {
    color: Colors.light.onPrimary,
    marginBottom: 12,
  },
  subtitle: {
    color: "rgba(255,255,255,0.8)",
    marginBottom: 32,
    maxWidth: 320,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buttonPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
});
