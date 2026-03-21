import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeInRight,
  FadeOutLeft,
  FadeInLeft,
  FadeOutRight,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { getRecipeById } from "@/constants/data";

export default function CookModeScreen() {
  const { recipeId } = useLocalSearchParams<{ recipeId: string }>();
  const insets = useSafeAreaInsets();
  const recipe = getRecipeById(recipeId);
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");

  if (!recipe) {
    return (
      <View style={[styles.container, { alignItems: "center", justifyContent: "center", paddingHorizontal: 48 }]}>
        <Ionicons name="flame-outline" size={48} color={Colors.light.outlineVariant} />
        <Text style={{ fontFamily: "NotoSerif_600SemiBold", fontSize: 20, color: Colors.light.onSurface, marginTop: 16, marginBottom: 8 }}>Recipe not found</Text>
        <Pressable onPress={() => router.back()} style={{ backgroundColor: Colors.light.primary, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 20, marginTop: 16 }}>
          <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 15, color: "#FFFFFF" }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const step = recipe.steps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === recipe.steps.length - 1;

  const goNext = () => {
    if (isLast) {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
      return;
    }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDirection("forward");
    setCurrentStep((s) => s + 1);
  };

  const goPrev = () => {
    if (isFirst) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDirection("back");
    setCurrentStep((s) => s - 1);
  };

  // Extract time from instruction if it mentions seconds/minutes
  const timeMatch = step.instruction.match(/(\d+)\s*(seconds?|minutes?|min|sec|s)\b/i);
  const timerLabel = timeMatch
    ? `Start ${timeMatch[1]}${timeMatch[2].startsWith("s") ? "s" : "m"} Timer`
    : null;

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.topBar}>
        <Text style={styles.stepLabel}>Step {currentStep + 1} of {recipe.steps.length}</Text>
        <Pressable onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={Colors.light.onSurface} />
        </Pressable>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBarFill,
            { width: `${((currentStep + 1) / recipe.steps.length) * 100}%` },
          ]}
        />
      </View>

      {/* Step content */}
      <Animated.View
        key={`step-${currentStep}`}
        entering={direction === "forward" ? FadeInRight.duration(250) : FadeInLeft.duration(250)}
        exiting={direction === "forward" ? FadeOutLeft.duration(200) : FadeOutRight.duration(200)}
        style={styles.stepContent}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Ingredients highlight box */}
          {step.materials.length > 0 && (
            <View style={styles.ingredientsBox}>
              <Text style={styles.ingredientsBoxLabel}>You'll need:</Text>
              {step.materials.map((mat, i) => (
                <View key={i} style={styles.ingredientItem}>
                  <View style={styles.ingredientCheck}>
                    <View style={styles.ingredientCheckInner} />
                  </View>
                  <Text style={styles.ingredientItemText}>{mat}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Step title + instruction */}
          <View style={styles.instructionSection}>
            <Text style={styles.stepSubtitle}>{step.title}</Text>
            <Text style={styles.stepInstruction}>{step.instruction}</Text>
          </View>
        </ScrollView>
      </Animated.View>

      {/* Bottom area */}
      <View style={[styles.bottomArea, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
        {/* Timer button (if applicable) */}
        {timerLabel && (
          <Pressable
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }}
            style={({ pressed }) => [
              styles.timerButton,
              pressed && { transform: [{ scale: 0.95 }] },
            ]}
          >
            <Ionicons name="timer-outline" size={20} color="#FFFFFF" />
            <Text style={styles.timerButtonText}>{timerLabel}</Text>
          </Pressable>
        )}

        {/* Navigation arrows + dots */}
        <View style={styles.navRow}>
          <Pressable onPress={goPrev} disabled={isFirst} style={{ opacity: isFirst ? 0.3 : 0.5 }}>
            <Ionicons name="chevron-back" size={28} color={Colors.light.onSurface} />
          </Pressable>

          <View style={styles.navDots}>
            {recipe.steps.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.navDot,
                  i === currentStep && styles.navDotActive,
                ]}
              />
            ))}
          </View>

          <Pressable onPress={goNext} style={{ opacity: 0.5 }}>
            <Ionicons name="chevron-forward" size={28} color={Colors.light.onSurface} />
          </Pressable>
        </View>

        <Text style={styles.swipeHint}>Swipe for Next Step</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
  },
  // Top bar
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  stepLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.light.secondary,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  // Progress bar
  progressBarContainer: {
    height: 3,
    backgroundColor: Colors.light.surfaceContainerHigh,
    borderRadius: 2,
    marginHorizontal: 24,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: Colors.light.primary,
    borderRadius: 2,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  // Step content
  stepContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  // Ingredients highlight box
  ingredientsBox: {
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: 18,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: "rgba(222,193,179,0.1)",
  },
  ingredientsBoxLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    color: Colors.light.secondary,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 14,
  },
  ingredientItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 6,
  },
  ingredientCheck: {
    marginTop: 3,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "rgba(154,65,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  ingredientCheckInner: {
    width: 0,
    height: 0,
  },
  ingredientItemText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.light.onSurfaceVariant,
    lineHeight: 22,
  },
  // Instruction
  instructionSection: {
    alignItems: "center",
  },
  stepSubtitle: {
    fontFamily: "NotoSerif_600SemiBold",
    fontStyle: "italic",
    fontSize: 18,
    color: "rgba(154,65,0,0.8)",
    marginBottom: 14,
  },
  stepInstruction: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 26,
    color: Colors.light.onSurface,
    lineHeight: 38,
    letterSpacing: -0.3,
    textAlign: "center",
  },
  // Bottom area
  bottomArea: {
    paddingHorizontal: 24,
    paddingTop: 16,
    alignItems: "center",
    gap: 16,
  },
  // Timer
  timerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  timerButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#FFFFFF",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  // Navigation
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  navDots: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  navDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(29,27,24,0.2)",
  },
  navDotActive: {
    width: 16,
    backgroundColor: Colors.light.primary,
  },
  swipeHint: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    color: Colors.light.secondary,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
});
