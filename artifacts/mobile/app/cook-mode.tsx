import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  Dimensions,
  Platform,
  Pressable,
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

const { width: SCREEN_WIDTH } = Dimensions.get("window");

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

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <StatusBar style="dark" />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={Colors.light.onSurface} />
        </Pressable>
        <View style={styles.stepIndicator}>
          <Text style={styles.stepIndicatorText}>
            Step {currentStep + 1} of {recipe.steps.length}
          </Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.progressContainer}>
        {recipe.steps.map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              index <= currentStep && styles.progressDotActive,
            ]}
          />
        ))}
      </View>

      <Animated.View
        key={`step-${currentStep}`}
        entering={direction === "forward" ? FadeInRight.duration(250) : FadeInLeft.duration(250)}
        exiting={direction === "forward" ? FadeOutLeft.duration(200) : FadeOutRight.duration(200)}
        style={styles.stepContainer}
      >
        <View style={styles.stepNumberBadge}>
          <Text style={styles.stepNumberText}>{currentStep + 1}</Text>
        </View>
        <Text style={styles.stepTitle}>{step.title}</Text>
        <Text style={styles.stepInstruction}>{step.instruction}</Text>

        {step.materials.length > 0 && (
          <View style={styles.materialsContainer}>
            <Text style={styles.materialsLabel}>You will need</Text>
            {step.materials.map((mat, i) => (
              <View key={i} style={styles.materialRow}>
                <View style={styles.materialDot} />
                <Text style={styles.materialText}>{mat}</Text>
              </View>
            ))}
          </View>
        )}
      </Animated.View>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
        <Pressable
          onPress={goPrev}
          disabled={isFirst}
          style={({ pressed }) => [
            styles.navButton,
            styles.prevButton,
            isFirst && styles.navButtonDisabled,
            pressed && !isFirst && { opacity: 0.7 },
          ]}
        >
          <Ionicons
            name="arrow-back"
            size={20}
            color={isFirst ? Colors.light.outlineVariant : Colors.light.onSurface}
          />
          <Text
            style={[
              styles.navButtonText,
              isFirst && styles.navButtonTextDisabled,
            ]}
          >
            Previous
          </Text>
        </Pressable>

        <Pressable
          onPress={goNext}
          style={({ pressed }) => [
            styles.navButton,
            styles.nextButton,
            pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
          ]}
        >
          <Text style={styles.nextButtonText}>
            {isLast ? "Done" : "Next"}
          </Text>
          <Ionicons
            name={isLast ? "checkmark" : "arrow-forward"}
            size={20}
            color="#FFFFFF"
          />
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
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.surfaceContainerLow,
    alignItems: "center",
    justifyContent: "center",
  },
  stepIndicator: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: Colors.light.surfaceContainerLow,
  },
  stepIndicatorText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.light.secondary,
  },
  progressContainer: {
    flexDirection: "row",
    paddingHorizontal: 24,
    gap: 6,
    marginBottom: 32,
  },
  progressDot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.light.surfaceContainerHigh,
  },
  progressDotActive: {
    backgroundColor: Colors.light.primary,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  stepNumberBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  stepNumberText: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: "#FFFFFF",
  },
  stepTitle: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 28,
    color: Colors.light.onSurface,
    letterSpacing: -0.3,
    marginBottom: 16,
  },
  stepInstruction: {
    fontFamily: "Inter_400Regular",
    fontSize: 17,
    color: Colors.light.secondary,
    lineHeight: 28,
    marginBottom: 32,
  },
  materialsContainer: {
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: 18,
    padding: 20,
  },
  materialsLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.light.primary,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  materialRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
  },
  materialDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.light.secondary,
  },
  materialText: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.light.onSurface,
  },
  bottomBar: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 12,
  },
  navButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 24,
  },
  prevButton: {
    backgroundColor: Colors.light.surfaceContainerLow,
  },
  nextButton: {
    backgroundColor: Colors.light.primary,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.light.onSurface,
  },
  navButtonTextDisabled: {
    color: Colors.light.outlineVariant,
  },
  nextButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#FFFFFF",
  },
});
