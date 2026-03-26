import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, usePathname } from "expo-router";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import Colors from "@/constants/colors";
import { useApp } from "@/contexts/AppContext";

const haptic = () => {
  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
};

export default function ContinueCookingBanner() {
  const { activeCookSession } = useApp();
  const pathname = usePathname();

  if (!activeCookSession) return null;
  if (pathname === "/cook-mode") return null;
  if (pathname === "/cook" || pathname === "/(tabs)/cook") return null;

  return (
    <Pressable
      onPress={() => {
        haptic();
        router.push({
          pathname: "/cook-mode",
          params: {
            recipeId: activeCookSession.recipeId,
            resumeStep: String(activeCookSession.currentStep),
          },
        });
      }}
      style={({ pressed }) => [styles.banner, pressed && { opacity: 0.92 }]}
    >
      <View style={styles.iconCircle}>
        <Ionicons name="flame" size={18} color="#FFFFFF" />
      </View>
      <View style={styles.bannerText}>
        <Text style={styles.bannerTitle}>Continue Cooking</Text>
        <Text style={styles.bannerSub} numberOfLines={1} ellipsizeMode="tail">
          {activeCookSession.recipeName} {"\u2022"} Step {activeCookSession.currentStep + 1} of {activeCookSession.totalSteps}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: Colors.light.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  bannerText: {
    flex: 1,
    gap: 2,
  },
  bannerTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: "#FFFFFF",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  bannerSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
  },
});
