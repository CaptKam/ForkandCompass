import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import * as Haptics from "expo-haptics";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import Colors from "@/constants/colors";
import { useApp } from "@/contexts/AppContext";
import { getRecipeById } from "@/constants/data";

// Must match the actual tab bar height in (tabs)/_layout.tsx
const TAB_BAR_HEIGHT = 83;

export default function CookingPill() {
  const pathname = usePathname();
  if (pathname.includes("cook-mode")) return null;

  const { activeCookSession } = useApp();
  if (!activeCookSession) return null;

  const recipe = getRecipeById(activeCookSession.recipeId);
  if (!recipe) return null;

  const totalSteps = recipe.steps?.length ?? 0;
  const currentStep = activeCookSession.currentStep;
  const progress = totalSteps > 0 ? currentStep / totalSteps : 0;

  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push({
      pathname: "/cook-mode",
      params: { recipeId: activeCookSession.recipeId },
    });
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.pill,
        { bottom: TAB_BAR_HEIGHT + 8 },
        pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
      ]}
      accessibilityLabel={`Continue cooking ${recipe.name}, step ${currentStep + 1} of ${totalSteps}`}
      accessibilityRole="button"
    >
      {/* Flame icon */}
      <View style={styles.iconWrap}>
        <Text style={styles.iconText}>🔥</Text>
      </View>

      {/* Text + progress */}
      <View style={styles.textWrap}>
        <Text style={styles.recipeName} ellipsizeMode="tail" numberOfLines={1}>
          {recipe.name}
        </Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.stepLabel}>
          Step {currentStep + 1} of {totalSteps} · tap to resume
        </Text>
      </View>

      {/* Chevron */}
      <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.6)" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    position: "absolute",
    left: 12,
    right: 12,
    backgroundColor: Colors.light.primary,
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    zIndex: 999,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  iconText: {
    fontSize: 15,
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
  },
  recipeName: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 14,
    color: Colors.light.onPrimary,
    marginBottom: 4,
  },
  progressTrack: {
    height: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 1,
    overflow: "hidden",
    marginBottom: 3,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 1,
  },
  stepLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: "rgba(255,255,255,0.65)",
  },
});
