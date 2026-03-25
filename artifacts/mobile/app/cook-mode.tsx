import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { useKeepAwake } from "expo-keep-awake";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  PanResponder,
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
import { getRecipeById, resolveImageUrl } from "@/constants/data";
import type { Ingredient } from "@/constants/data";
import {
  parseActionVerbs,
  getAdaptiveInstruction,
  levelToTier,
} from "@/constants/adaptive-language";
import { findTechniqueForStep } from "@/constants/techniques";
import { useApp } from "@/contexts/AppContext";
import type { CookSession, ActiveCookSession } from "@/contexts/AppContext";
import { convertAmount, convertTemperatureInText } from "@/constants/units";

const TERRACOTTA = "#9A4100";
const TEXT_SECONDARY = "#5C5549";
const BORDER = "#E8DFD2";
const CREAM = "#FEF9F3";

const FEEDBACK_OPTIONS = ["Too salty", "Perfect", "Bland", "Too spicy", "Undercooked"];

function parseDurationFromText(text: string): number | null {
  const h = text.match(/(\d+)\s*(hours?|hrs?|h)\b/i);
  const m = text.match(/(\d+)\s*(minutes?|mins?|m)\b/i);
  const s = text.match(/(\d+)\s*(seconds?|secs?|s)\b/i);
  let total = 0;
  if (h) total += parseInt(h[1], 10) * 3600;
  if (m) total += parseInt(m[1], 10) * 60;
  if (s) total += parseInt(s[1], 10);
  if (total > 0) return total;
  if (h) return parseInt(h[1], 10) * 3600;
  if (m) return parseInt(m[1], 10) * 60;
  if (s) return parseInt(s[1], 10);
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

function getPhase(title: string): "prep" | "cook" | "finish" {
  const t = title.toLowerCase();
  if (t.includes("finish") || t.includes("serve") || t.includes("plate") || t.includes("garnish")) return "finish";
  if (t.includes("cook") || t.includes("bake") || t.includes("fry") || t.includes("boil") || t.includes("simmer") || t.includes("roast") || t.includes("grill") || t.includes("sear") || t.includes("braise") || t.includes("steam")) return "cook";
  return "prep";
}

/** Extract doneness cues from instruction text — looks for "until" phrases */
function getDonenessCue(instruction: string): string | null {
  const match = instruction.match(/until\s+(.+?)(?:\.|,|$)/i);
  if (match && match[1].length > 10) {
    const cue = match[1].trim();
    return cue.charAt(0).toUpperCase() + cue.slice(1);
  }
  return null;
}

function generateTimerName(stepTitle: string, stepText: string, recipeName: string): string {
  const action = stepTitle.charAt(0).toUpperCase() + stepTitle.slice(1).toLowerCase();
  const ingredientMatch = stepText.match(/(?:the\s+)?(\w+(?:\s+\w+)?)\s+(?:for|until|over|in|on)/i);
  const primary = ingredientMatch ? ingredientMatch[1] : recipeName;
  return `${action} ${primary}`;
}

interface PrepWarning {
  type: "overnight" | "advance_prep";
  stepNumber: number;
  message: string;
  duration?: string;
}

function getAdvancePrepWarnings(steps: { title: string; instruction: string }[]): PrepWarning[] {
  const warnings: PrepWarning[] = [];
  for (let i = 0; i < steps.length; i++) {
    const text = steps[i].instruction.toLowerCase();
    if (text.includes("overnight") || text.includes("at least 4 hours") || text.includes("at least 6 hours") || text.includes("at least 8 hours")) {
      const summary = steps[i].instruction.split(".")[0];
      warnings.push({
        type: text.includes("overnight") ? "overnight" : "advance_prep",
        stepNumber: i + 1,
        message: summary.length > 80 ? summary.slice(0, 77) + "..." : summary,
        duration: text.includes("overnight") ? "overnight" : text.match(/(at least \d+ hours?)/i)?.[1],
      });
    }
  }
  return warnings;
}

const CONTEXTUAL_TIPS: Record<string, string> = {
  sear: "Don't overcrowd the pan when searing — work in batches for a better crust.",
  simmer: "A gentle simmer means small, occasional bubbles. If it's rolling, lower the heat.",
  boil: "Always salt your water generously before adding pasta or vegetables.",
  chop: "Keep your knife sharp — a dull blade is more dangerous than a sharp one.",
  dice: "For even cooking, try to keep your dice uniform in size.",
  mince: "Rock the knife blade in a curved motion for the finest mince.",
  saute: "Have all ingredients prepped and ready before you heat the pan.",
  sauté: "Have all ingredients prepped and ready before you heat the pan.",
  knead: "Dough is ready when it springs back slowly after you poke it.",
  fold: "Use a large spatula and gentle circular motions to keep the air in.",
  whisk: "Whisk in a figure-8 pattern for the most even incorporation.",
  roast: "Let the oven fully preheat before putting anything in.",
  bake: "Avoid opening the oven door too often — it drops the temperature significantly.",
  fry: "Test oil temperature by dropping in a tiny piece — it should sizzle immediately.",
  marinate: "Always marinate in a non-reactive container (glass or stainless steel).",
  blend: "Start blending on low speed, then gradually increase to avoid splashing.",
  strain: "Press gently with the back of a spoon to extract maximum flavor.",
  season: "Season in layers as you cook, not just at the end.",
  rest: "Letting meat rest allows the juices to redistribute — don't skip this step.",
  toast: "Watch closely when toasting — spices can go from fragrant to burnt in seconds.",
  grill: "Oil the food, not the grates, for the best non-stick results.",
  steam: "Don't lift the lid during steaming — you'll lose heat and moisture.",
  reduce: "Taste as you reduce — the flavor concentrates so seasoning may need adjusting.",
  caramelize: "Low heat and patience are the keys to deep, sweet caramelization.",
  temper: "Add the hot liquid to the cold mixture slowly, whisking constantly.",
  blanch: "Have an ice bath ready before you blanch — timing is everything.",
};

function getStepTips(instruction: string): string[] {
  const lower = instruction.toLowerCase();
  const tips: string[] = [];
  for (const [keyword, tip] of Object.entries(CONTEXTUAL_TIPS)) {
    const regex = new RegExp(`\\b${keyword}\\b`, "i");
    if (regex.test(lower) && tips.length < 2) {
      tips.push(tip);
    }
  }
  return tips;
}

export default function CookModeScreen() {
  useKeepAwake();

  const { recipeId, resumeStep } = useLocalSearchParams<{ recipeId: string; resumeStep?: string }>();
  const insets = useSafeAreaInsets();
  const recipe = getRecipeById(recipeId);
  const { completeCookSession, cookingProfile, cookingLevel, activeCookSession, setActiveCookSession, measurementSystem, temperatureUnit } = useApp();

  const initialStep = resumeStep ? parseInt(resumeStep, 10) : 0;
  const [currentStep, setCurrentStep] = useState(isNaN(initialStep) ? 0 : initialStep);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set());
  const [showHelpSheet, setShowHelpSheet] = useState(false);
  const [helpSegment, setHelpSegment] = useState<"troubleshooting" | "tips">("troubleshooting");
  const [finished, setFinished] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState<string[]>([]);
  const [showPrepWarning, setShowPrepWarning] = useState(false);
  const [prepWarningDismissed, setPrepWarningDismissed] = useState(false);

  const [timerTotal, setTimerTotal] = useState<number | null>(null);
  const [timerRemaining, setTimerRemaining] = useState<number>(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerName, setTimerName] = useState<string>("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<string>(new Date().toISOString());

  // PanResponder for swipe-to-dismiss on help sheet
  const helpSheetPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 10,
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 50) {
          setShowHelpSheet(false);
        }
      },
    })
  ).current;

  const prepWarnings = useMemo(() => {
    if (!recipe) return [];
    return getAdvancePrepWarnings(recipe.steps);
  }, [recipe]);

  useEffect(() => {
    if (prepWarnings.length > 0 && !resumeStep && !prepWarningDismissed) {
      setShowPrepWarning(true);
    }
  }, [prepWarnings.length, resumeStep, prepWarningDismissed]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

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
  const adaptiveText = convertTemperatureInText(getAdaptiveInstruction(step, tier), temperatureUnit);
  const stepDuration = parseDurationFromText(adaptiveText);
  const stepIngredients = getIngredientsForStep(adaptiveText, recipe.ingredients);
  const techniqueVideo = findTechniqueForStep(adaptiveText);
  const userLevel = cookingProfile.currentLevel;
  const showVideoHint = techniqueVideo && (userLevel <= 2 || (userLevel <= 4 && techniqueVideo.difficulty !== "Beginner"));
  // Parse action verbs for highlighting
  const instructionSegments = useMemo(() => parseActionVerbs(adaptiveText), [adaptiveText]);

  const donenessCue = getDonenessCue(adaptiveText);
  const stepTips = getStepTips(adaptiveText);

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
    setTimerRunning(false);
    setTimerTotal(null);
    setTimerRemaining(0);
    setTimerName("");
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
    setTimerName("");
    setCheckedIngredients(new Set());
    setDirection("back");
    setCurrentStep((s) => s - 1);
  };

  const startTimer = () => {
    if (!stepDuration) return;
    setTimerTotal(stepDuration);
    setTimerRemaining(stepDuration);
    setTimerRunning(true);
    setTimerName(generateTimerName(step.title, step.instruction, recipe.name));
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
    setActiveCookSession(null);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  const toggleFeedback = (option: string) => {
    setFeedback((prev) =>
      prev.includes(option) ? prev.filter((f) => f !== option) : [...prev, option]
    );
  };

  if (showPrepWarning && !prepWarningDismissed) {
    return (
      <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top, backgroundColor: Colors.light.surface }]}>
        <StatusBar style="dark" />
        <ScrollView contentContainerStyle={styles.prepWarningContent}>
          <Animated.View entering={FadeIn.duration(400)} style={styles.prepWarningInner}>
            <View style={styles.prepWarningBanner}>
              <Text style={styles.prepWarningLabel}>⏰ HEADS UP</Text>
              <Text style={styles.prepWarningDesc}>This recipe needs advance prep:</Text>
              {prepWarnings.map((w, i) => (
                <View key={i} style={styles.prepWarningBullet}>
                  <Text style={styles.prepWarningBulletText}>
                    • {w.message}
                  </Text>
                  <Text style={styles.prepWarningBulletMeta}>
                    Step {w.stepNumber} — {w.duration || "long wait"}
                  </Text>
                </View>
              ))}
              <Text style={styles.prepWarningFooter}>
                Make sure you've done these before starting Cook Mode.
              </Text>
              <Pressable
                style={({ pressed }) => [styles.prepWarningReadyBtn, pressed && { opacity: 0.88 }]}
                onPress={() => {
                  setPrepWarningDismissed(true);
                  setShowPrepWarning(false);
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }}
              >
                <Text style={styles.prepWarningReadyText}>I'm ready — Start Cooking</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.prepWarningPrepBtn, pressed && { opacity: 0.88 }]}
                onPress={() => {
                  setPrepWarningDismissed(true);
                  setShowPrepWarning(false);
                  if (prepWarnings[0]) setCurrentStep(prepWarnings[0].stepNumber - 1);
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={styles.prepWarningPrepText}>Start prep now</Text>
              </Pressable>
            </View>
            <Pressable
              onPress={() => {
                setPrepWarningDismissed(true);
                setShowPrepWarning(false);
                router.back();
              }}
              hitSlop={8}
            >
              <Text style={styles.prepWarningBackText}>← Go back</Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

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

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top, backgroundColor: phaseBg }]}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.topBar}>
        <View style={styles.headerLeft}>
          <Pressable onPress={handleClose} style={styles.headerButton}>
            <Ionicons name="close" size={24} color={Colors.light.onSurface} />
          </Pressable>
          <View style={styles.headerTitleCol}>
            <Text style={styles.stepLabel}>Step {currentStep + 1} of {recipe.steps.length}</Text>
            <Text style={styles.headerRecipeName} numberOfLines={1}>{recipe.name}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Pressable
            onPress={() => { setShowHelpSheet(true); if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            style={styles.headerButton}
          >
            <Ionicons name="help-circle-outline" size={22} color={Colors.light.secondary} />
          </Pressable>
          {stepDuration && !timerTotal ? (
            <Pressable onPress={startTimer} style={styles.timerPill}>
              <Ionicons name="timer-outline" size={16} color={TERRACOTTA} />
              <Text style={styles.timerPillText}>Start</Text>
            </Pressable>
          ) : timerTotal != null ? (
            <Pressable onPress={toggleTimer} style={[styles.timerPill, timerRemaining === 0 && styles.timerPillDone]}>
              <Ionicons name="timer-outline" size={16} color={timerRemaining === 0 ? "#2D7A4F" : TERRACOTTA} />
              <Text style={[styles.timerPillText, timerRemaining === 0 && { color: "#2D7A4F" }]}>
                {timerRemaining === 0 ? "Done!" : formatTimer(timerRemaining)}
              </Text>
            </Pressable>
          ) : null}
        </View>
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
          {/* Phase pill */}
          <View style={[styles.phasePill, phase === "finish" && styles.phasePillFinish]}>
            <Text style={[styles.phasePillText, phase === "finish" && styles.phasePillTextFinish]}>{phaseLabel}</Text>
          </View>

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

          {/* Timer controls (when active) */}
          {timerTotal != null && (
            <View style={styles.timerSection}>
              {timerName ? <Text style={styles.timerNameLabel}>{timerName}</Text> : null}
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

          {/* Bento grid: video + doneness cue side by side */}
          {(showVideoHint || donenessCue) && (
            <View style={styles.bentoGrid}>
              {showVideoHint && techniqueVideo && (
                <Pressable style={styles.videoCard}>
                  <Image
                    source={{ uri: techniqueVideo.thumbnailUrl }}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                  />
                  <View style={styles.videoGradient} />
                  <View style={styles.videoPlayCircle}>
                    <Ionicons name="play" size={24} color={TERRACOTTA} style={{ marginLeft: 2 }} />
                  </View>
                  <View style={styles.videoCardBottom}>
                    <Text style={styles.videoCardLabel}>Video Technique</Text>
                    <Text style={styles.videoCardTitle}>{techniqueVideo.title}</Text>
                  </View>
                </Pressable>
              )}
              {donenessCue && (
                <View style={[styles.donenessCueCard, showVideoHint ? styles.donenessCueCardHalf : styles.donenessCueCardFull]}>
                  <Ionicons name="alert-circle" size={28} color={TERRACOTTA} />
                  <Text style={styles.donenessCueLabel}>Doneness Cue</Text>
                  <Text style={styles.donenessCueText}>"{donenessCue}"</Text>
                </View>
              )}
            </View>
          )}

          {/* First-step chef note */}
          {currentStep === 0 && (
            <View style={styles.chefNoteCard}>
              <Ionicons name="bulb-outline" size={16} color={TERRACOTTA} style={{ marginTop: 2 }} />
              <Text style={styles.chefNoteText}>
                Read all the steps before you start — it helps you time everything and avoid surprises.
              </Text>
            </View>
          )}

          {/* Ingredients for this step */}
          {stepIngredients.length > 0 && (
            <View style={styles.ingredientsCard}>
              <Text style={styles.ingredientsLabel}>Ingredients for this step</Text>
              {stepIngredients.map((ing) => {
                const isChecked = checkedIngredients.has(ing.id);
                return (
                  <Pressable
                    key={ing.id}
                    style={styles.ingredientRow}
                    onPress={() => toggleIngredient(ing.id)}
                  >
                    <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                      {isChecked && <View style={styles.checkboxDot} />}
                    </View>
                    <Text style={[styles.ingredientText, isChecked && styles.ingredientChecked]}>
                      {ing.name} — {convertAmount(ing.amount, measurementSystem)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Equipment */}
          {step.materials.length > 0 && (
            <View style={styles.materialsCard}>
              <Text style={styles.ingredientsLabel}>Equipment</Text>
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
        {/* Progress dots — variable width */}
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

        <View style={styles.navRow}>
          {!isFirst ? (
            <Pressable
              onPress={goPrev}
              style={({ pressed }) => [styles.navBtnSecondary, pressed && { opacity: 0.7 }]}
            >
              <Ionicons name="arrow-back" size={16} color={Colors.light.onSurface} />
              <Text style={styles.navBtnSecondaryText}>Prev</Text>
            </Pressable>
          ) : (
            <View style={{ width: 100 }} />
          )}

          <Pressable
            onPress={goNext}
            style={({ pressed }) => [
              isLast ? styles.navBtnFinish : styles.navBtnPrimary,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={styles.navBtnPrimaryText}>
              {isLast ? "Finish" : "Next"}
            </Text>
            <Ionicons name={isLast ? "checkmark" : "arrow-forward"} size={16} color={CREAM} />
          </Pressable>
        </View>
      </View>

      {showHelpSheet && (
        <Pressable
          style={styles.helpOverlay}
          onPress={() => setShowHelpSheet(false)}
        >
          <Pressable style={styles.helpSheet} onPress={(e) => e.stopPropagation()}>
            <View {...helpSheetPanResponder.panHandlers} style={styles.helpHandle} />

            <View style={styles.segmentControl}>
              <Pressable
                style={[styles.segmentBtn, helpSegment === "troubleshooting" && styles.segmentBtnActive]}
                onPress={() => setHelpSegment("troubleshooting")}
              >
                <Text style={[styles.segmentText, helpSegment === "troubleshooting" && styles.segmentTextActive]}>
                  Troubleshooting
                </Text>
              </Pressable>
              <Pressable
                style={[styles.segmentBtn, helpSegment === "tips" && styles.segmentBtnActive]}
                onPress={() => setHelpSegment("tips")}
              >
                <Text style={[styles.segmentText, helpSegment === "tips" && styles.segmentTextActive]}>
                  Chef Tips
                </Text>
              </Pressable>
            </View>

            <ScrollView style={styles.helpScrollArea} showsVerticalScrollIndicator={false}>
              {helpSegment === "troubleshooting" ? (
                <>
                  <Text style={styles.helpTitle}>Something not right?</Text>
                  <View style={styles.helpItem}>
                    <Text style={styles.helpSymptom}>Dish tastes bland?</Text>
                    <Text style={styles.helpFix}>
                      Likely cause: Under-seasoned. Fix: Add salt in small increments, tasting between each addition. A squeeze of lemon can also brighten flavors.
                    </Text>
                  </View>
                  <View style={styles.helpItem}>
                    <Text style={styles.helpSymptom}>Ingredients burning?</Text>
                    <Text style={styles.helpFix}>
                      Likely cause: Heat is too high. Fix: Lower the heat immediately and add a splash of liquid (water, stock, or wine) to deglaze.
                    </Text>
                  </View>
                  <View style={styles.helpItem}>
                    <Text style={styles.helpSymptom}>Sauce too thin?</Text>
                    <Text style={styles.helpFix}>
                      Likely cause: Not enough reduction time. Fix: Continue simmering uncovered, stirring occasionally, until the sauce coats the back of a spoon.
                    </Text>
                  </View>
                  <View style={styles.helpItem}>
                    <Text style={styles.helpSymptom}>Texture is off?</Text>
                    <Text style={styles.helpFix}>
                      Likely cause: Overcooking or under-resting. Fix: Pull proteins slightly before done (carryover cooking will finish it). Let meat rest before cutting.
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.helpTitle}>Chef Tips</Text>
                  <View style={styles.chefTipItem}>
                    <View style={styles.chefTipBorder} />
                    <Text style={styles.chefTipText}>
                      Taste as you go — adjust seasoning throughout the cooking process, not just at the end. A pinch of salt can transform a dish.
                    </Text>
                  </View>
                  <View style={styles.chefTipItem}>
                    <View style={styles.chefTipBorder} />
                    <Text style={styles.chefTipText}>
                      Mise en place: Have all ingredients measured, chopped, and ready before you start. This reduces stress and prevents mistakes.
                    </Text>
                  </View>
                  <View style={styles.chefTipItem}>
                    <View style={styles.chefTipBorder} />
                    <Text style={styles.chefTipText}>
                      Let your pan get properly hot before adding food. A cold pan leads to sticking and uneven cooking.
                    </Text>
                  </View>
                  <View style={styles.chefTipItem}>
                    <View style={styles.chefTipBorder} />
                    <Text style={styles.chefTipText}>
                      Rest your proteins after cooking — it lets juices redistribute so every bite stays moist.
                    </Text>
                  </View>
                  {recipe.culturalNote && (
                    <>
                      <Text style={styles.helpSectionDivider}>History & Culture</Text>
                      <View style={styles.historyCard}>
                        <Text style={styles.historyText}>{recipe.culturalNote}</Text>
                      </View>
                    </>
                  )}
                </>
              )}
            </ScrollView>

            <Pressable
              style={({ pressed }) => [styles.helpCloseBtn, pressed && { opacity: 0.7 }]}
              onPress={() => setShowHelpSheet(false)}
            >
              <Text style={styles.helpCloseText}>Got it</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      )}
    </View>
  );
}

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

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  headerTitleCol: {
    flex: 1,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  stepLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    color: Colors.light.secondary,
    textTransform: "uppercase",
    letterSpacing: 2,
    lineHeight: 14,
  },
  headerRecipeName: {
    fontFamily: "NotoSerif_600SemiBold",
    fontStyle: "italic",
    fontSize: 18,
    color: TERRACOTTA,
    lineHeight: 24,
  },
  timerPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.light.surfaceContainerHigh,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 99,
  },
  timerPillDone: {
    backgroundColor: "#E0F5E8",
  },
  timerPillText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.light.onSurface,
  },

  stepContent: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 32,
    gap: 20,
  },
  phasePill: {
    alignSelf: "flex-start",
    backgroundColor: "#FBDAB3",
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 99,
  },
  phasePillFinish: {
    backgroundColor: "#E0F5E8",
  },
  phasePillText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: Colors.light.secondary,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  phasePillTextFinish: {
    color: "#2D7A4F",
  },
  stepInstruction: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 28,
    color: Colors.light.onSurface,
    lineHeight: 40,
    letterSpacing: -0.3,
  },
  actionVerb: {
    fontFamily: "Inter_700Bold",
    color: Colors.light.primary,
  },

  timerSection: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  timerNameLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: TEXT_SECONDARY,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  timerDigits: {
    fontFamily: "Inter_700Bold",
    fontSize: 36,
    color: TERRACOTTA,
  },
  timerComplete: {
    color: "#2D7A4F",
  },
  timerBarTrack: {
    width: "100%",
    height: 4,
    backgroundColor: BORDER,
    borderRadius: 2,
    overflow: "hidden",
  },
  timerBarFill: {
    height: "100%",
    backgroundColor: TERRACOTTA,
    borderRadius: 2,
  },
  timerControls: {
    flexDirection: "row",
    gap: 12,
  },
  timerControlBtn: {
    backgroundColor: TERRACOTTA,
    height: 44,
    paddingHorizontal: 28,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  timerControlText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#FFFFFF",
  },
  timerControlBtnSecondary: {
    backgroundColor: CREAM,
    height: 44,
    paddingHorizontal: 28,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  timerControlTextSecondary: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: TEXT_SECONDARY,
  },

  tipsContainer: {
    gap: 8,
  },
  tipCard: {
    backgroundColor: "#F5EDDF",
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  tipLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: "#9A7B00",
  },
  tipText: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: Colors.light.onSurface,
    lineHeight: 24,
  },

  chefNoteCard: {
    flexDirection: "row",
    gap: 10,
    paddingLeft: 12,
  },
  chefNoteText: {
    fontFamily: "NotoSerif_400Regular",
    fontStyle: "italic",
    fontSize: 16,
    color: TEXT_SECONDARY,
    lineHeight: 24,
    flex: 1,
  },

  bentoGrid: {
    flexDirection: "row",
    gap: 12,
  },
  videoCard: {
    flex: 1,
    aspectRatio: 4 / 5,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: Colors.light.surfaceContainerHigh,
    justifyContent: "center",
    alignItems: "center",
  },
  videoGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  videoPlayCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(254,249,243,0.75)",
    alignItems: "center",
    justifyContent: "center",
  },
  videoCardBottom: {
    position: "absolute",
    bottom: 14,
    left: 14,
    right: 14,
  },
  videoCardLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    color: "rgba(255,255,255,0.8)",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 4,
  },
  videoCardTitle: {
    fontFamily: "NotoSerif_600SemiBold",
    fontStyle: "italic",
    fontSize: 17,
    color: "#FFFFFF",
    lineHeight: 22,
  },
  donenessCueCard: {
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: 16,
    padding: 20,
    gap: 10,
    justifyContent: "center",
    borderWidth: 0.5,
    borderColor: "rgba(222,193,179,0.1)",
  },
  donenessCueCardHalf: {
    flex: 1,
  },
  donenessCueCardFull: {
    flex: 1,
  },
  donenessCueLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    color: Colors.light.secondary,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  donenessCueText: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 18,
    color: Colors.light.onSurface,
    lineHeight: 26,
  },

  ingredientsCard: {
    gap: 14,
  },
  ingredientsLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: Colors.light.secondary,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    minHeight: 40,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#DEC1B3",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    borderColor: TERRACOTTA,
  },
  checkboxDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: TERRACOTTA,
  },
  ingredientText: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: Colors.light.onSurface,
    lineHeight: 22,
    flex: 1,
  },
  ingredientChecked: {
    color: Colors.light.secondary,
    textDecorationLine: "line-through",
  },

  materialsCard: {
    gap: 14,
  },
  materialRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 36,
  },
  materialText: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: Colors.light.onSurface,
    lineHeight: 22,
  },

  bottomArea: {
    paddingHorizontal: 24,
    paddingTop: 14,
    backgroundColor: "rgba(254,249,243,0.8)",
    borderTopWidth: 0.5,
    borderTopColor: "rgba(222,193,179,0.2)",
  },
  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  navBtnPrimary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: TERRACOTTA,
    paddingHorizontal: 36,
    paddingVertical: 16,
    borderRadius: 99,
    shadowColor: TERRACOTTA,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  navBtnFinish: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#2D7A4F",
    paddingHorizontal: 36,
    paddingVertical: 16,
    borderRadius: 99,
    shadowColor: "#2D7A4F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  navBtnPrimaryText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: CREAM,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  navBtnSecondary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: "rgba(222,193,179,0.3)",
  },
  navBtnSecondaryText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.light.onSurface,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  navDots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginBottom: 14,
  },
  navDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.light.surfaceContainerHighest,
  },
  navDotCompleted: {
    width: 16,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.light.surfaceContainerHighest,
  },
  navDotActive: {
    width: 24,
    height: 4,
    borderRadius: 2,
    backgroundColor: TERRACOTTA,
  },

  helpOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  helpSheet: {
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    maxHeight: "75%",
  },
  helpHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.light.surfaceContainerHigh,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
    paddingVertical: 16,
  },
  segmentControl: {
    flexDirection: "row",
    backgroundColor: "#F0EBE3",
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
  },
  segmentBtn: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentBtnActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  segmentText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: TEXT_SECONDARY,
  },
  segmentTextActive: {
    color: Colors.light.onSurface,
  },
  helpScrollArea: {
    maxHeight: 320,
    marginBottom: 16,
  },
  helpTitle: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 22,
    color: Colors.light.onSurface,
    lineHeight: 28,
    marginBottom: 16,
  },
  helpItem: {
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: 12,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 12,
  },
  helpSymptom: {
    fontFamily: "Inter_500Medium",
    fontSize: 17,
    color: Colors.light.onSurface,
    lineHeight: 24,
  },
  helpFix: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: TEXT_SECONDARY,
    lineHeight: 24,
  },
  chefTipItem: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
    paddingVertical: 4,
  },
  chefTipBorder: {
    width: 3,
    backgroundColor: TERRACOTTA,
    borderRadius: 2,
  },
  chefTipText: {
    fontFamily: "NotoSerif_400Regular",
    fontStyle: "italic",
    fontSize: 16,
    color: Colors.light.onSurface,
    lineHeight: 24,
    flex: 1,
  },
  helpCloseBtn: {
    backgroundColor: Colors.light.primary,
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  helpCloseText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    color: "#FFFFFF",
  },
  helpSectionDivider: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: TERRACOTTA,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginTop: 8,
    marginBottom: 8,
  },
  historyCard: {
    backgroundColor: "#FEF0E6",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  historyText: {
    fontFamily: "NotoSerif_400Regular",
    fontStyle: "italic",
    fontSize: 15,
    color: Colors.light.onSurface,
    lineHeight: 24,
  },

  prepWarningContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  prepWarningInner: {
    alignItems: "center",
    gap: 24,
  },
  prepWarningBanner: {
    backgroundColor: "#FEF3E0",
    borderWidth: 1,
    borderColor: "#E8C868",
    borderRadius: 16,
    padding: 24,
    gap: 16,
    width: "100%",
  },
  prepWarningLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: "#9A7B00",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  prepWarningDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: Colors.light.onSurface,
    lineHeight: 24,
  },
  prepWarningBullet: {
    paddingLeft: 8,
    gap: 2,
  },
  prepWarningBulletText: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: Colors.light.onSurface,
    lineHeight: 24,
  },
  prepWarningBulletMeta: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: TEXT_SECONDARY,
    paddingLeft: 14,
    lineHeight: 20,
  },
  prepWarningFooter: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: TEXT_SECONDARY,
    lineHeight: 22,
  },
  prepWarningReadyBtn: {
    backgroundColor: TERRACOTTA,
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  prepWarningReadyText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    color: CREAM,
  },
  prepWarningPrepBtn: {
    backgroundColor: "transparent",
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: TERRACOTTA,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  prepWarningPrepText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    color: TERRACOTTA,
  },
  prepWarningBackText: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: TEXT_SECONDARY,
    lineHeight: 22,
  },

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
    color: TEXT_SECONDARY,
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
    borderColor: BORDER,
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
    borderColor: BORDER,
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
  storageHintCard: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#FEF0E6",
    borderRadius: 12,
    padding: 14,
    width: "100%",
    marginBottom: 8,
    alignItems: "flex-start",
  },
  storageHintText: {
    fontFamily: "NotoSerif_400Regular",
    fontStyle: "italic",
    fontSize: 15,
    color: Colors.light.onSurface,
    lineHeight: 22,
    flex: 1,
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
