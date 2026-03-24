import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
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
  FadeIn,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { getRecipeById } from "@/constants/data";
import type { Ingredient } from "@/constants/data";
import {
  parseActionVerbs,
  getAdaptiveInstruction,
  levelToTier,
} from "@/constants/adaptive-language";
import { findTechniqueForStep } from "@/constants/techniques";
import { useApp } from "@/contexts/AppContext";
import type { CookSession, ActiveCookSession } from "@/contexts/AppContext";

/* ── Helpers ───────────────────────────────────────────────────── */

function parseDurationFromText(text: string): number | null {
  const m = text.match(/(\d+)\s*(minutes?|mins?|m)\b/i);
  if (m) return parseInt(m[1], 10) * 60;
  const s = text.match(/(\d+)\s*(seconds?|secs?|s)\b/i);
  if (s) return parseInt(s[1], 10);
  const h = text.match(/(\d+)\s*(hours?|hrs?|h)\b/i);
  if (h) return parseInt(h[1], 10) * 3600;
  return null;
}

function formatTimer(totalSeconds: number): string {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  const mm = String(mins).padStart(2, "0");
  const ss = String(secs).padStart(2, "0");
  if (hrs > 0) return `${hrs}:${mm}:${ss}`;
  return `${mm}:${ss}`;
}

function getIngredientsForStep(
  stepText: string,
  ingredients: Ingredient[]
): Ingredient[] {
  const lower = stepText.toLowerCase();
  return ingredients.filter((item) =>
    lower.includes(item.name.toLowerCase())
  );
}

/** Map step title to phase */
function getPhase(title: string): "prep" | "cook" | "finish" {
  const t = title.toLowerCase();
  if (t.includes("finish") || t.includes("serve") || t.includes("plate")) return "finish";
  if (t.includes("cook") || t.includes("bake") || t.includes("fry") || t.includes("boil") || t.includes("simmer") || t.includes("roast") || t.includes("grill") || t.includes("sear")) return "cook";
  return "prep";
}

const TERRACOTTA = "#8A3800";
const TEXT_SECONDARY = "#5C5549";

const FEEDBACK_OPTIONS = ["Too salty", "Perfect", "Bland", "Too spicy", "Undercooked"];

/** Extract doneness cues from instruction text — looks for "until" phrases */
function getDonenessCue(instruction: string): string | null {
  const match = instruction.match(/until\s+(.+?)(?:\.|,|$)/i);
  if (match && match[1].length > 10) {
    // Capitalize first letter
    const cue = match[1].trim();
    return cue.charAt(0).toUpperCase() + cue.slice(1);
  }
  return null;
}

/* ── Component ─────────────────────────────────────────────────── */

export default function CookModeScreen() {
  const { recipeId, resumeStep } = useLocalSearchParams<{ recipeId: string; resumeStep?: string }>();
  const insets = useSafeAreaInsets();
  const recipe = getRecipeById(recipeId);
  const { completeCookSession, cookingProfile, cookingLevel, activeCookSession, setActiveCookSession } = useApp();

  const initialStep = resumeStep ? parseInt(resumeStep, 10) : 0;
  const [currentStep, setCurrentStep] = useState(isNaN(initialStep) ? 0 : initialStep);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set());
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);
  const [finished, setFinished] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState<string[]>([]);

  // Timer state
  const [timerTotal, setTimerTotal] = useState<number | null>(null);
  const [timerRemaining, setTimerRemaining] = useState<number>(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<string>(new Date().toISOString());

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Timer tick
  useEffect(() => {
    if (timerRunning && timerRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimerRemaining((prev) => {
          if (prev <= 1) {
            setTimerRunning(false);
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [timerRunning, timerRemaining]);

  // Persist active cook session on step/timer changes
  useEffect(() => {
    if (!recipe || finished) return;
    const session: ActiveCookSession = {
      recipeId: recipe.id,
      recipeName: recipe.name,
      currentStep,
      totalSteps: recipe.steps.length,
      timerRemaining: timerRunning ? timerRemaining : null,
      timerRunning,
      startedAt: startTimeRef.current,
      servings: 4,
    };
    setActiveCookSession(session);
  }, [currentStep, timerRemaining, timerRunning, finished]);

  if (!recipe) {
    return (
      <View style={[styles.container, { alignItems: "center", justifyContent: "center", paddingHorizontal: 48 }]}>
        <Ionicons name="flame-outline" size={48} color={Colors.light.outlineVariant} />
        <Text style={styles.notFoundTitle}>Recipe not found</Text>
        <Pressable onPress={() => router.back()} style={styles.notFoundButton}>
          <Text style={styles.notFoundButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const step = recipe.steps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === recipe.steps.length - 1;
  const phase = getPhase(step.title);
  const tier = levelToTier(cookingLevel);
  const adaptiveText = getAdaptiveInstruction(step, tier);
  const stepDuration = parseDurationFromText(adaptiveText);
  const stepIngredients = getIngredientsForStep(adaptiveText, recipe.ingredients);
  const techniqueVideo = findTechniqueForStep(adaptiveText);
  const userLevel = cookingProfile.currentLevel;
  // Show technique hints for beginners always, intermediate for complex actions only
  const showVideoHint = techniqueVideo && (userLevel <= 2 || (userLevel <= 4 && techniqueVideo.difficulty !== "Beginner"));
  // Parse action verbs for highlighting
  const instructionSegments = useMemo(() => parseActionVerbs(adaptiveText), [adaptiveText]);

  const phaseLabel = phase.toUpperCase();
  const phaseColor = phase === "finish" ? "#2D7A4F" : Colors.light.primary;
  const phaseBg = phase === "cook" ? "#FEF0E6" : phase === "finish" ? "#EEFAF2" : Colors.light.surface;

  const handleClose = () => {
    if (currentStep > 0 && !finished) {
      Alert.alert(
        "Exit cooking?",
        "Your progress will be saved.",
        [
          { text: "Keep Cooking", style: "cancel" },
          {
            text: "Exit",
            style: "destructive",
            onPress: () => {
              // Save partial session
              const session: CookSession = {
                id: `${Date.now()}-${recipeId}`,
                recipeId: recipe.id,
                recipeName: recipe.name,
                cuisine: recipe.countryName,
                difficulty: recipe.difficulty,
                startedAt: startTimeRef.current,
                completedAt: null,
                totalTime: Math.round((Date.now() - new Date(startTimeRef.current).getTime()) / 60000),
                rating: null,
                feedback: [],
                stepsCompleted: currentStep,
                totalSteps: recipe.steps.length,
              };
              completeCookSession(session);
              router.back();
            },
          },
        ]
      );
    } else {
      router.back();
    }
  };

  const goNext = () => {
    if (isLast) {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setFinished(true);
      return;
    }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Reset timer for next step
    setTimerRunning(false);
    setTimerTotal(null);
    setTimerRemaining(0);
    setCheckedIngredients(new Set());
    setDirection("forward");
    setCurrentStep((s) => s + 1);
  };

  const goPrev = () => {
    if (isFirst) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimerRunning(false);
    setTimerTotal(null);
    setTimerRemaining(0);
    setCheckedIngredients(new Set());
    setDirection("back");
    setCurrentStep((s) => s - 1);
  };

  const startTimer = () => {
    if (!stepDuration) return;
    setTimerTotal(stepDuration);
    setTimerRemaining(stepDuration);
    setTimerRunning(true);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const toggleTimer = () => {
    setTimerRunning((prev) => !prev);
  };

  const resetTimer = () => {
    setTimerRunning(false);
    if (timerTotal) setTimerRemaining(timerTotal);
  };

  const toggleIngredient = (id: string) => {
    setCheckedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleFinishDone = () => {
    const session: CookSession = {
      id: `${Date.now()}-${recipeId}`,
      recipeId: recipe.id,
      recipeName: recipe.name,
      cuisine: recipe.countryName,
      difficulty: recipe.difficulty,
      startedAt: startTimeRef.current,
      completedAt: new Date().toISOString(),
      totalTime: Math.round((Date.now() - new Date(startTimeRef.current).getTime()) / 60000),
      rating: rating || null,
      feedback,
      stepsCompleted: recipe.steps.length,
      totalSteps: recipe.steps.length,
    };
    completeCookSession(session);
    setActiveCookSession(null); // Clear active session on completion
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  const toggleFeedback = (option: string) => {
    setFeedback((prev) =>
      prev.includes(option) ? prev.filter((f) => f !== option) : [...prev, option]
    );
  };

  /* ── Finish Screen ─────────────────────────────────────────── */
  if (finished) {
    return (
      <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top, backgroundColor: Colors.light.surface }]}>
        <StatusBar style="dark" />
        <ScrollView contentContainerStyle={styles.finishContent}>
          <Animated.View entering={FadeIn.duration(400)} style={styles.finishInner}>
            <Text style={styles.finishHeadline}>Well done.</Text>
            <Text style={styles.finishRecipeName}>{recipe.name}</Text>
            <Text style={styles.finishRecipeOrigin}>{recipe.countryName}</Text>
            <Text style={styles.finishRecipeMeta}>
              {recipe.time} · {recipe.difficulty}
              {!cookingProfile.cuisinesExplored.includes(recipe.countryName)
                ? ` · Cuisine #${cookingProfile.cuisinesExplored.length + 1} explored`
                : ""}
            </Text>

            {/* Star rating */}
            <View style={styles.finishCard}>
              <Text style={styles.finishCardLabel}>Rate this recipe</Text>
              <View style={styles.starRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Pressable
                    key={star}
                    onPress={() => { setRating(star); if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                    style={styles.starTarget}
                  >
                    <Ionicons
                      name={star <= rating ? "star" : "star-outline"}
                      size={32}
                      color={star <= rating ? Colors.light.primary : Colors.light.outlineVariant}
                    />
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Feedback chips */}
            <View style={styles.finishCard}>
              <Text style={styles.finishCardLabel}>How did it turn out?</Text>
              <View style={styles.feedbackRow}>
                {FEEDBACK_OPTIONS.map((option) => (
                  <Pressable
                    key={option}
                    onPress={() => toggleFeedback(option)}
                    style={[
                      styles.feedbackChip,
                      feedback.includes(option) && styles.feedbackChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.feedbackChipText,
                        feedback.includes(option) && styles.feedbackChipTextActive,
                      ]}
                    >
                      {option}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Done button */}
            <Pressable
              style={({ pressed }) => [styles.doneButton, pressed && { opacity: 0.85 }]}
              onPress={handleFinishDone}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  /* ── Active Cook Mode ──────────────────────────────────────── */
  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top, backgroundColor: phaseBg }]}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.topBar}>
        <Pressable onPress={handleClose} style={styles.headerButton}>
          <Ionicons name="close" size={24} color={Colors.light.onSurface} />
        </Pressable>
        <Text style={styles.stepLabel}>Step {currentStep + 1} of {recipe.steps.length}</Text>
        <View style={styles.headerRight}>
          <Pressable
            onPress={() => { setShowTroubleshooting(true); if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            style={styles.headerButton}
          >
            <Ionicons name="help-circle-outline" size={24} color={Colors.light.secondary} />
          </Pressable>
          {stepDuration && !timerTotal && (
            <Pressable onPress={startTimer} style={styles.headerButton}>
              <Ionicons name="timer-outline" size={24} color={Colors.light.primary} />
            </Pressable>
          )}
        </View>
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
          {/* Phase label */}
          <Text style={[styles.phaseLabel, { color: phaseColor }]}>{phaseLabel}</Text>

          {/* Step instruction with action verb highlighting */}
          <Text style={styles.stepInstruction} maxFontSizeMultiplier={2.0}>
            {instructionSegments.map((seg, i) =>
              seg.type === "action" ? (
                <Text key={i} style={styles.actionVerb}>{seg.value}</Text>
              ) : (
                seg.value
              )
            )}
          </Text>

          {/* Timer display */}
          {timerTotal != null && (
            <View style={styles.timerSection}>
              <Text style={[styles.timerDigits, timerRemaining === 0 && styles.timerComplete]}>
                {timerRemaining === 0 ? "Time's up!" : formatTimer(timerRemaining)}
              </Text>
              <View style={styles.timerBarTrack}>
                <View
                  style={[
                    styles.timerBarFill,
                    {
                      width: timerTotal > 0
                        ? `${((timerTotal - timerRemaining) / timerTotal) * 100}%`
                        : "100%",
                    },
                  ]}
                />
              </View>
              <View style={styles.timerControls}>
                <Pressable
                  onPress={toggleTimer}
                  style={({ pressed }) => [styles.timerControlBtn, pressed && { opacity: 0.7 }]}
                >
                  <Text style={styles.timerControlText}>
                    {timerRunning ? "Pause" : "Start"}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={resetTimer}
                  style={({ pressed }) => [styles.timerControlBtnSecondary, pressed && { opacity: 0.7 }]}
                >
                  <Text style={styles.timerControlTextSecondary}>Reset</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Chef note banner (first step only) */}
          {currentStep === 0 && recipe.culturalNote && (
            <View style={styles.chefNoteCard}>
              <Ionicons name="chatbubble-ellipses-outline" size={16} color={TEXT_SECONDARY} style={{ marginTop: 2 }} />
              <Text style={styles.chefNoteText}>{recipe.culturalNote}</Text>
            </View>
          )}

          {/* Doneness cue card — parse from instruction text */}
          {getDonenessCue(adaptiveText) && (
            <View style={styles.donenessCueCard}>
              <Text style={styles.donenessCueLabel}>DONENESS CUE</Text>
              <View style={styles.donenessCueRow}>
                <Ionicons name="eye-outline" size={16} color={TERRACOTTA} style={{ marginTop: 2 }} />
                <Text style={styles.donenessCueText}>{getDonenessCue(adaptiveText)}</Text>
              </View>
            </View>
          )}

          {/* Video hint card */}
          {showVideoHint && techniqueVideo && (
            <View style={styles.videoHintCard}>
              <Ionicons name="play-circle" size={24} color={Colors.light.primary} />
              <View style={styles.videoHintInfo}>
                <Text style={styles.videoHintTitle}>Watch: {techniqueVideo.title}</Text>
                <Text style={styles.videoHintSubtitle}>{techniqueVideo.subtitle}</Text>
              </View>
              <Text style={styles.videoHintDuration}>{techniqueVideo.duration}</Text>
            </View>
          )}

          {/* Ingredients for this step */}
          {stepIngredients.length > 0 && (
            <View style={styles.ingredientsCard}>
              <Text style={styles.ingredientsLabel}>INGREDIENTS FOR THIS STEP</Text>
              {stepIngredients.map((ing) => {
                const isChecked = checkedIngredients.has(ing.id);
                return (
                  <Pressable
                    key={ing.id}
                    style={styles.ingredientRow}
                    onPress={() => toggleIngredient(ing.id)}
                  >
                    <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                      {isChecked && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                    </View>
                    <Text style={[styles.ingredientText, isChecked && styles.ingredientChecked]}>
                      {ing.name} — {ing.amount}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Equipment / materials */}
          {step.materials.length > 0 && (
            <View style={styles.materialsCard}>
              <Text style={styles.ingredientsLabel}>EQUIPMENT</Text>
              {step.materials.map((mat, i) => (
                <View key={i} style={styles.materialRow}>
                  <Ionicons name="construct-outline" size={16} color={Colors.light.secondary} />
                  <Text style={styles.materialText}>{mat}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </Animated.View>

      {/* Bottom navigation */}
      <View style={[styles.bottomArea, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
        <View style={styles.navRow}>
          {!isFirst ? (
            <Pressable
              onPress={goPrev}
              style={({ pressed }) => [styles.navBtnSecondary, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.navBtnSecondaryText}>← Prev</Text>
            </Pressable>
          ) : (
            <View style={{ width: 140 }} />
          )}

          <Pressable
            onPress={goNext}
            style={({ pressed }) => [
              isLast ? styles.navBtnFinish : styles.navBtnPrimary,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={styles.navBtnPrimaryText}>
              {isLast ? "Finish Cooking ✓" : "Next →"}
            </Text>
          </Pressable>
        </View>

        {/* Step dots */}
        <View style={styles.navDots}>
          {recipe.steps.map((_, i) => (
            <View
              key={i}
              style={[
                styles.navDot,
                i < currentStep && styles.navDotCompleted,
                i === currentStep && styles.navDotActive,
              ]}
            />
          ))}
        </View>
      </View>

      {/* Troubleshooting overlay */}
      {showTroubleshooting && (
        <Pressable
          style={styles.troubleshootOverlay}
          onPress={() => setShowTroubleshooting(false)}
        >
          <Pressable style={styles.troubleshootSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.troubleshootHandle} />
            <Text style={styles.troubleshootTitle}>Something not right?</Text>
            <Text style={styles.troubleshootHint}>
              Common issues and tips for {recipe.name}:
            </Text>
            <View style={styles.troubleshootItem}>
              <Text style={styles.troubleshootSymptom}>Dish tastes bland?</Text>
              <Text style={styles.troubleshootFix}>
                Likely cause: Under-seasoned. Fix: Add salt in small increments, tasting between each addition. A squeeze of lemon can also brighten flavors.
              </Text>
            </View>
            <View style={styles.troubleshootItem}>
              <Text style={styles.troubleshootSymptom}>Ingredients burning?</Text>
              <Text style={styles.troubleshootFix}>
                Likely cause: Heat is too high. Fix: Lower the heat immediately and add a splash of liquid (water, stock, or wine) to deglaze.
              </Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.troubleshootClose, pressed && { opacity: 0.7 }]}
              onPress={() => setShowTroubleshooting(false)}
            >
              <Text style={styles.troubleshootCloseText}>Got it</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      )}
    </View>
  );
}

/* ── Styles ────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
  },
  notFoundTitle: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 20,
    color: Colors.light.onSurface,
    marginTop: 16,
    marginBottom: 8,
  },
  notFoundButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginTop: 16,
  },
  notFoundButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#FFFFFF",
  },

  /* ── Header ──────────────────────────────────────────────────── */
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  headerRight: {
    flexDirection: "row",
  },
  stepLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: Colors.light.secondary,
    letterSpacing: 0.5,
  },

  /* ── Progress ────────────────────────────────────────────────── */
  progressBarContainer: {
    height: 4,
    backgroundColor: Colors.light.surfaceContainerHigh,
    borderRadius: 2,
    marginHorizontal: 24,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: Colors.light.primary,
    borderRadius: 2,
  },

  /* ── Step Content ────────────────────────────────────────────── */
  stepContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  scrollContent: {
    paddingBottom: 20,
    gap: 20,
  },
  phaseLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.light.primary,
    textTransform: "uppercase",
    letterSpacing: 2,
    lineHeight: 20,
  },
  stepInstruction: {
    fontFamily: "Inter_400Regular",
    fontSize: 20,
    color: Colors.light.onSurface,
    lineHeight: 30,
  },
  actionVerb: {
    fontFamily: "Inter_700Bold",
    color: Colors.light.primary,
  },

  /* ── Timer ───────────────────────────────────────────────────── */
  timerSection: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  timerDigits: {
    fontFamily: "Inter_700Bold",
    fontSize: 36,
    color: Colors.light.primary,
    textAlign: "center",
  },
  timerComplete: {
    color: "#2D7A4F",
  },
  timerBarTrack: {
    height: 4,
    width: "100%",
    backgroundColor: "#E8DFD2",
    borderRadius: 2,
    overflow: "hidden",
  },
  timerBarFill: {
    height: "100%",
    backgroundColor: Colors.light.primary,
    borderRadius: 2,
  },
  timerControls: {
    flexDirection: "row",
    gap: 12,
  },
  timerControlBtn: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 24,
    height: 52,
    minWidth: 120,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  timerControlText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    color: "#FFFFFF",
  },
  timerControlBtnSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: Colors.light.primary,
    paddingHorizontal: 24,
    height: 52,
    minWidth: 120,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  timerControlTextSecondary: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    color: Colors.light.primary,
  },

  /* ── Chef Note ──────────────────────────────────────────────── */
  chefNoteCard: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E8DFD2",
  },
  chefNoteText: {
    flex: 1,
    fontFamily: "NotoSerif_400Regular_Italic",
    fontSize: 16,
    color: "#5C5549",
    lineHeight: 24,
    fontStyle: "italic",
  },

  /* ── Doneness Cue ──────────────────────────────────────────── */
  donenessCueCard: {
    backgroundColor: "#FEF0E6",
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  donenessCueLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.light.primary,
    letterSpacing: 1.5,
    lineHeight: 18,
  },
  donenessCueRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  donenessCueText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 17,
    color: Colors.light.onSurface,
    lineHeight: 24,
  },

  /* ── Video Hint ──────────────────────────────────────────────── */
  videoHintCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5EDDF",
    borderWidth: 1,
    borderColor: "#E8DFD2",
    borderRadius: 12,
    padding: 14,
    gap: 12,
    minHeight: 56,
  },
  videoHintInfo: {
    flex: 1,
    gap: 2,
  },
  videoHintTitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: Colors.light.onSurface,
    lineHeight: 22,
  },
  videoHintSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#5C5549",
    lineHeight: 20,
  },
  videoHintDuration: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: "#5C5549",
    lineHeight: 18,
    flexShrink: 0,
  },

  /* ── Ingredients Card ────────────────────────────────────────── */
  ingredientsCard: {
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "#E8DFD2",
  },
  ingredientsLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: "#5C5549",
    letterSpacing: 1.5,
    lineHeight: 20,
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    minHeight: 48,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.light.outlineVariant,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  ingredientText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 17,
    color: Colors.light.onSurface,
    lineHeight: 24,
  },
  ingredientChecked: {
    opacity: 0.5,
    textDecorationLine: "line-through",
  },

  /* ── Materials Card ──────────────────────────────────────────── */
  materialsCard: {
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "#E8DFD2",
  },
  materialRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 32,
  },
  materialText: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: Colors.light.onSurfaceVariant,
    lineHeight: 22,
  },

  /* ── Bottom Navigation ───────────────────────────────────────── */
  bottomArea: {
    paddingHorizontal: 24,
    paddingTop: 12,
    alignItems: "center",
    gap: 16,
  },
  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: 16,
  },
  navBtnPrimary: {
    backgroundColor: Colors.light.primary,
    height: 52,
    minWidth: 140,
    flex: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  navBtnFinish: {
    backgroundColor: "#2D7A4F",
    height: 52,
    minWidth: 140,
    flex: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  navBtnPrimaryText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  navBtnSecondary: {
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.primary,
    height: 52,
    minWidth: 140,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  navBtnSecondaryText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    color: Colors.light.primary,
    letterSpacing: 0.3,
  },
  navDots: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  navDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(29,27,24,0.15)",
  },
  navDotActive: {
    width: 16,
    backgroundColor: Colors.light.primary,
  },
  navDotCompleted: {
    backgroundColor: Colors.light.primary,
  },

  /* ── Troubleshooting ─────────────────────────────────────────── */
  troubleshootOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
    zIndex: 100,
  },
  troubleshootSheet: {
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    gap: 16,
  },
  troubleshootHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.light.surfaceContainerHigh,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 8,
  },
  troubleshootTitle: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 22,
    color: Colors.light.onSurface,
    lineHeight: 28,
  },
  troubleshootHint: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.light.secondary,
    lineHeight: 20,
  },
  troubleshootItem: {
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: 12,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: "#E8DFD2",
  },
  troubleshootSymptom: {
    fontFamily: "Inter_500Medium",
    fontSize: 17,
    color: Colors.light.onSurface,
    lineHeight: 24,
  },
  troubleshootFix: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: "#5C5549",
    lineHeight: 24,
  },
  troubleshootClose: {
    backgroundColor: Colors.light.primary,
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  troubleshootCloseText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    color: "#FFFFFF",
  },

  /* ── Finish Screen ───────────────────────────────────────────── */
  finishContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  finishInner: {
    alignItems: "center",
    gap: 8,
  },
  finishHeadline: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 28,
    color: Colors.light.onSurface,
    textAlign: "center",
    marginBottom: 16,
  },
  finishRecipeName: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 22,
    color: Colors.light.onSurface,
    textAlign: "center",
    lineHeight: 28,
  },
  finishRecipeOrigin: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: Colors.light.secondary,
    textAlign: "center",
    lineHeight: 22,
  },
  finishRecipeMeta: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: "#5C5549",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },

  finishCard: {
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: 16,
    padding: 20,
    gap: 16,
    width: "100%",
    borderWidth: 1,
    borderColor: "#E8DFD2",
    marginBottom: 16,
  },
  finishCardLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: Colors.light.onSurface,
    lineHeight: 22,
  },
  starRow: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
  },
  starTarget: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  feedbackRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  feedbackChip: {
    borderWidth: 1,
    borderColor: "#E8DFD2",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.light.surface,
  },
  feedbackChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  feedbackChipText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.light.onSurface,
    lineHeight: 20,
  },
  feedbackChipTextActive: {
    color: "#FFFFFF",
  },
  doneButton: {
    backgroundColor: Colors.light.primary,
    height: 52,
    width: "100%",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  doneButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    color: "#FFFFFF",
  },
});
