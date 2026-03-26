import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import Colors from "@/constants/colors";
import { getRecipeById } from "@/constants/data";
import { useApp } from "@/contexts/AppContext";

function formatSeconds(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function ContinueCookingBanner() {
  const { activeCookSession } = useApp();
  const pathname = usePathname();

  if (!activeCookSession) return null;
  if (pathname === "/cook-mode") return null;
  if (pathname === "/cook" || pathname === "/(tabs)/cook") return null;

  const recipe = getRecipeById(activeCookSession.recipeId);
  const hasTimer = activeCookSession.timerRunning && activeCookSession.timerRemaining != null && activeCookSession.timerRemaining > 0;

  const handleResume = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: "/cook-mode",
      params: {
        recipeId: activeCookSession.recipeId,
        resumeStep: String(activeCookSession.currentStep),
      },
    });
  };

  const Inner = (
    <Pressable onPress={handleResume} style={({ pressed }) => [styles.row, pressed && { opacity: 0.92 }]}>
      {/* Thumbnail */}
      <View style={styles.thumb}>
        {recipe?.image ? (
          <Image
            source={{ uri: recipe.image }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.light.surfaceContainerHigh }]} />
        )}
        {/* Step overlay on thumbnail */}
        <View style={styles.thumbOverlay}>
          <Text style={styles.thumbStep}>{activeCookSession.currentStep + 1}/{activeCookSession.totalSteps}</Text>
        </View>
      </View>

      {/* Text block */}
      <View style={styles.textBlock}>
        <Text style={styles.recipeName} numberOfLines={1} ellipsizeMode="tail">
          {activeCookSession.recipeName}
        </Text>
        <View style={styles.statusRow}>
          {hasTimer ? (
            <>
              <Ionicons name="timer-outline" size={12} color={Colors.light.primary} />
              <Text style={[styles.statusText, { color: Colors.light.primary }]}>
                {formatSeconds(activeCookSession.timerRemaining!)} remaining
              </Text>
              <Text style={styles.statusDot}>·</Text>
            </>
          ) : null}
          <Text style={styles.statusText}>
            Step {activeCookSession.currentStep + 1} · In Progress
          </Text>
        </View>
      </View>

      {/* Play button */}
      <Pressable onPress={handleResume} style={styles.playBtn} hitSlop={8}>
        <Ionicons name="play" size={16} color="#FFFFFF" />
      </Pressable>
    </Pressable>
  );

  if (Platform.OS === "ios") {
    return (
      <View style={[styles.container, { backgroundColor: "#FEF9F3" }]}>
        <BlurView intensity={70} tint="light" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(254,249,243,0.75)" }]} />
        {Inner}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: "#FEF9F3" }]}>
      {Inner}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 72,
    borderTopWidth: 1,
    borderTopColor: "#E8DFD2",
    overflow: "hidden",
    ...Platform.select({
      ios: { shadowColor: "#1C1A17", shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.08, shadowRadius: 24 },
      android: { elevation: 12 },
      web: { boxShadow: "0 -8px 24px rgba(28,26,23,0.08)" },
    }),
  },
  row: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 12,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: Colors.light.surfaceContainerHigh,
    flexShrink: 0,
  },
  thumbOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingVertical: 2,
    alignItems: "center",
  },
  thumbStep: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 9,
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  textBlock: {
    flex: 1,
    gap: 3,
  },
  recipeName: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 15,
    color: "#1C1A17",
    lineHeight: 20,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
  },
  statusText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#8A8279",
    lineHeight: 16,
  },
  statusDot: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#8A8279",
  },
  playBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.primary,
    borderWidth: 1,
    borderColor: "#7A6347",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    ...Platform.select({
      ios: { shadowColor: Colors.light.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.35, shadowRadius: 6 },
      android: { elevation: 4 },
      web: { boxShadow: "0 2px 8px rgba(154,65,0,0.35)" },
    }),
  },
});
