import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { COUNTRIES, ONBOARDING_IMAGES } from "@/constants/data";
import { useApp } from "@/contexts/AppContext";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useScaledStyles } from "@/hooks/useScaledStyles";

const CARD_GAP = 16;

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { selectedCountryIds, toggleCountrySelection, setHasCompletedOnboarding } = useApp();
  const colors = useThemeColors();
  const type = useScaledStyles();
  const reducedMotion = useReducedMotion();
  const isDark = colors.background === Colors.dark.background;
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = (screenWidth - 48 - CARD_GAP) / 2;

  const handleStart = () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setHasCompletedOnboarding(true);
    router.replace("/(tabs)");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Platform.OS === "web" ? 67 + 40 : insets.top + 40 },
        ]}
      >
        <View style={styles.headerContainer}>
          <Text style={[type.headlineMedium, styles.title, { color: colors.onSurface }]}>
            Where do you{"\n"}want to go?
          </Text>
          <Text style={[type.bodyMedium, styles.subtitle, { color: colors.secondary }]}>
            Pick the countries on your bucket list
          </Text>
        </View>

        <View style={styles.grid}>
          {COUNTRIES.map((country) => {
            const isSelected = selectedCountryIds.includes(country.id);
            const onboardingImage = ONBOARDING_IMAGES[country.id] || country.image;
            return (
              <Pressable
                key={country.id}
                accessibilityRole="button"
                accessibilityLabel={`${country.name}, ${isSelected ? "selected" : "not selected"}`}
                accessibilityState={{ selected: isSelected }}
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  toggleCountrySelection(country.id);
                }}
                style={({ pressed }) => [
                  styles.card,
                  { backgroundColor: colors.surfaceContainerHigh, width: cardWidth },
                  isSelected && [styles.cardSelected, { borderColor: colors.primary }],
                  pressed && !reducedMotion && { transform: [{ scale: 0.95 }] },
                ]}
              >
                <Image
                  source={{ uri: onboardingImage }}
                  style={styles.cardImage}
                  contentFit="cover"
                  transition={reducedMotion ? 0 : 300}
                  placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }}
                  onError={(e) => console.warn("[Image] Failed to load:", e.error)}
                />
                <LinearGradient
                  colors={["transparent", "rgba(0,0,0,0.6)"]}
                  style={styles.cardOverlay}
                />
                <View style={styles.cardContent}>
                  <Text style={[type.titleSmall, styles.cardName]}>
                    {country.name} {country.flag}
                  </Text>
                </View>
                {isSelected && (
                  <View style={[styles.checkBadge, { backgroundColor: colors.primary }]}>
                    <Ionicons name="checkmark" size={14} color={colors.onPrimary} />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          {
            paddingBottom: Math.max(insets.bottom, 16) + 8,
            backgroundColor: isDark
              ? "rgba(18,17,16,0.8)"
              : "rgba(254,249,243,0.8)",
          },
        ]}
      >
        <Pressable
          onPress={handleStart}
          accessibilityRole="button"
          accessibilityLabel="Start exploring — complete onboarding"
          style={({ pressed }) => [
            styles.startButton,
            { backgroundColor: colors.primary },
            pressed && (reducedMotion ? { opacity: 0.9 } : { transform: [{ scale: 0.97 }], opacity: 0.9 }),
          ]}
        >
          <Text style={[type.titleMedium, { color: colors.onPrimary }]}>Start Exploring</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    textAlign: "center",
  },
  subtitle: {
    marginTop: 8,
    textAlign: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: CARD_GAP,
  },
  card: {
    aspectRatio: 4 / 5,
    borderRadius: 16,
    overflow: "hidden",
  },
  cardSelected: {
    borderWidth: 3,
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  cardContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  cardName: {
    color: Colors.light.onPrimary,
  },
  checkBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
  },
  startButton: {
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
});
