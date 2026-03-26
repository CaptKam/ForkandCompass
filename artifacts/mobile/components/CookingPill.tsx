import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import * as Haptics from "expo-haptics";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useApp } from "@/contexts/AppContext";
import { getRecipeById } from "@/constants/data";
import { formatSeconds } from "@/lib/utils";

const TAB_BAR_INNER_HEIGHT = 49;

export default function CookingPill() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { activeCookSession } = useApp();

  if (pathname.includes("cook-mode")) return null;
  if (!activeCookSession) return null;

  const recipe = getRecipeById(activeCookSession.recipeId);
  if (!recipe) return null;

  const tabBarHeight = TAB_BAR_INNER_HEIGHT + insets.bottom;

  const totalSteps = activeCookSession.totalSteps;
  const currentStep = activeCookSession.currentStep;
  const progress = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;

  const hasTimer =
    activeCookSession.timerRunning &&
    activeCookSession.timerRemaining != null &&
    activeCookSession.timerRemaining > 0;

  const handlePress = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: "/cook-mode",
      params: { recipeId: activeCookSession.recipeId, resumeStep: String(currentStep) },
    });
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        { bottom: tabBarHeight },
        pressed && { opacity: 0.93 },
      ]}
      accessibilityLabel={`Continue cooking ${recipe.name}, step ${currentStep + 1} of ${totalSteps}`}
      accessibilityRole="button"
    >
      {/* Progress bar flush to top */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.max(progress, 1)}%` as any }]} />
      </View>

      <View style={styles.inner}>
        {/* Thumbnail */}
        <View style={styles.thumb}>
          {recipe.image ? (
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
            {recipe.name}
          </Text>
          <Text style={styles.stepText}>
            Step {currentStep + 1} of {totalSteps}
          </Text>
        </View>

        {/* Status badge */}
        <Text style={styles.inProgressText} numberOfLines={1}>
          {hasTimer ? formatSeconds(activeCookSession.timerRemaining!) : "In Progress"}
        </Text>

        {/* Play button */}
        <View style={styles.playBtn}>
          <Ionicons name="play" size={18} color="#FFFFFF" />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "rgba(222,193,179,0.35)",
    zIndex: 999,
    ...Platform.select({
      ios: {
        shadowColor: "#1D1B18",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: { elevation: 12 },
      web: { boxShadow: "0 -4px 20px 0 rgba(29,27,24,0.08)" },
    }),
  },
  progressTrack: {
    height: 3,
    backgroundColor: Colors.light.surfaceContainerHigh,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    overflow: "hidden",
  },
  progressFill: {
    height: 3,
    backgroundColor: Colors.light.primary,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: Colors.light.surfaceContainerHigh,
    flexShrink: 0,
  },
  textBlock: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  recipeName: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 13,
    color: "#1D1B18",
    letterSpacing: -0.2,
  },
  stepText: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    color: Colors.light.secondary,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  inProgressText: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    color: Colors.light.primary,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    fontStyle: "italic",
    flexShrink: 0,
  },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    ...Platform.select({
      ios: {
        shadowColor: Colors.light.primary,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: { elevation: 6 },
      web: { boxShadow: "0 3px 10px rgba(154,65,0,0.3)" },
    }),
  },
});
