import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { COUNTRIES, ONBOARDING_IMAGES } from "@/constants/data";
import { useApp } from "@/contexts/AppContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_GAP = 16;
const CARD_WIDTH = (SCREEN_WIDTH - 48 - CARD_GAP) / 2;

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { selectedCountryIds, toggleCountrySelection, setHasCompletedOnboarding } = useApp();

  const handleStart = () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setHasCompletedOnboarding(true);
    router.replace("/(tabs)");
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Platform.OS === "web" ? 67 + 40 : insets.top + 40 },
        ]}
      >
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Where do you{"\n"}want to go?</Text>
          <Text style={styles.subtitle}>Pick the countries on your bucket list</Text>
        </View>

        <View style={styles.grid}>
          {COUNTRIES.map((country) => {
            const isSelected = selectedCountryIds.includes(country.id);
            const onboardingImage = ONBOARDING_IMAGES[country.id] || country.image;
            return (
              <Pressable
                key={country.id}
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  toggleCountrySelection(country.id);
                }}
                style={({ pressed }) => [
                  styles.card,
                  isSelected && styles.cardSelected,
                  pressed && { transform: [{ scale: 0.95 }] },
                ]}
              >
                <Image
                  source={{ uri: onboardingImage }}
                  style={styles.cardImage}
                  contentFit="cover"
                  transition={300}
                />
                <LinearGradient
                  colors={["transparent", "rgba(0,0,0,0.6)"]}
                  style={styles.cardOverlay}
                />
                <View style={styles.cardContent}>
                  <Text style={styles.cardName}>
                    {country.name} {country.flag}
                  </Text>
                </View>
                {isSelected && (
                  <View style={styles.checkBadge}>
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
        <Pressable
          onPress={handleStart}
          style={({ pressed }) => [
            styles.startButton,
            pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
          ]}
        >
          <Text style={styles.startButtonText}>Start Exploring</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
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
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 28,
    color: Colors.light.onSurface,
    textAlign: "center",
    letterSpacing: -0.5,
    lineHeight: 36,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.light.secondary,
    marginTop: 8,
    textAlign: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: CARD_GAP,
  },
  card: {
    width: CARD_WIDTH,
    aspectRatio: 4 / 5,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: Colors.light.surfaceContainerHigh,
  },
  cardSelected: {
    borderWidth: 3,
    borderColor: Colors.light.primary,
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
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#FFFFFF",
  },
  checkBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.light.primary,
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
    backgroundColor: "rgba(254,249,243,0.8)",
    backdropFilter: "blur(20px)",
  },
  startButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  startButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    color: "#FFFFFF",
  },
});
