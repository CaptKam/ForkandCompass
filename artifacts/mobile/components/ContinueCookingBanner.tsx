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
  const hasTimer =
    activeCookSession.timerRunning &&
    activeCookSession.timerRemaining != null &&
    activeCookSession.timerRemaining > 0;

  const progress =
    activeCookSession.totalSteps > 0
      ? (activeCookSession.currentStep / activeCookSession.totalSteps) * 100
      : 0;

  const handleResume = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: "/cook-mode",
      params: {
        recipeId: activeCookSession.recipeId,
        resumeStep: String(activeCookSession.currentStep),
      },
    });
  };

  return (
    <Pressable
      onPress={handleResume}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.93 }]}
    >
      {/* Thumbnail — 56×56, no overlay */}
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
      </View>

      {/* Text block */}
      <View style={styles.textBlock}>
        <Text style={styles.recipeName} numberOfLines={1} ellipsizeMode="tail">
          {activeCookSession.recipeName}
        </Text>
        <View style={styles.stepRow}>
          <Text style={styles.stepText}>
            Step {activeCookSession.currentStep + 1} of {activeCookSession.totalSteps}
          </Text>
          {hasTimer ? (
            <Text style={[styles.stepText, styles.inProgressText]}>
              {formatSeconds(activeCookSession.timerRemaining!)}
            </Text>
          ) : (
            <Text style={[styles.stepText, styles.inProgressText]}>In Progress</Text>
          )}
        </View>
        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.max(progress, 3)}%` as any }]} />
        </View>
      </View>

      {/* Play button — 48×48 terracotta circle */}
      <View style={styles.playBtn}>
        <Ionicons name="play" size={20} color="#FFFFFF" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FEF9F3",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderColor: "rgba(222,193,179,0.2)",
    ...Platform.select({
      ios: {
        shadowColor: "#1D1B18",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
      },
      android: { elevation: 12 },
      web: { boxShadow: "0 12px 40px 0 rgba(29,27,24,0.12)" },
    }),
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: Colors.light.surfaceContainerHigh,
    flexShrink: 0,
  },
  textBlock: {
    flex: 1,
    gap: 4,
  },
  recipeName: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 14,
    color: "#1D1B18",
    letterSpacing: -0.2,
  },
  stepRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stepText: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    color: Colors.light.secondary,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  inProgressText: {
    color: Colors.light.primary,
    fontStyle: "italic",
  },
  progressTrack: {
    height: 4,
    backgroundColor: Colors.light.surfaceContainerHigh,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: 4,
    backgroundColor: Colors.light.primary,
    borderRadius: 2,
  },
  playBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    ...Platform.select({
      ios: {
        shadowColor: Colors.light.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: { elevation: 6 },
      web: { boxShadow: "0 4px 12px rgba(154,65,0,0.3)" },
    }),
  },
});
