import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { SCROLL_BOTTOM_INSET } from "@/constants/spacing";
import { getRecipeById, getAllRecipes as getAllRecipesResolved } from "@/constants/data";
import type { Recipe } from "@/constants/data";
import { TECHNIQUE_VIDEOS } from "@/constants/techniques";
import { useApp } from "@/contexts/AppContext";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useThemeColors } from "@/hooks/useThemeColors";


const haptic = (style: "light" | "medium" = "light") => {
  if (Platform.OS !== "web") {
    Haptics.impactAsync(style === "medium" ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
  }
};

const getAllRecipes = getAllRecipesResolved;

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} Days Ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatSeconds(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

const BEGINNER_RECIPE_IDS = [
  "pasta-aglio-olio",
  "pad-thai",
  "guacamole",
  "cacio-e-pepe",
  "miso-soup",
  "chicken-tikka-masala",
];

export default function CookScreen() {
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const colors = useThemeColors();
  const {
    cookingProfile,
    currentItinerary,
    recentCookSessions,
    activeCookSession,
    setActiveCookSession,
    itineraryProfile,
  } = useApp();

  const [techniquesExpanded, setTechniquesExpanded] = useState(false);

  const allRecipes = useMemo(() => getAllRecipes(), []);

  const tonightsRecipe = useMemo(() => {
    if (!currentItinerary || currentItinerary.length === 0) return null;
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const todayEntry = currentItinerary.find((d) => d.date === today && d.status === "active");
    if (!todayEntry) return null;
    const recipeIds = todayEntry.mode === "quick" ? todayEntry.quickRecipeIds : todayEntry.fullRecipeIds;
    if (!recipeIds || recipeIds.length === 0) return null;
    return getRecipeById(recipeIds[0]);
  }, [currentItinerary]);

  const recentRecipes = useMemo(() => {
    return recentCookSessions
      .filter((s) => s.completedAt)
      .slice(0, 5)
      .map((s) => ({ session: s, recipe: getRecipeById(s.recipeId) }))
      .filter((r) => r.recipe != null) as { session: typeof recentCookSessions[0]; recipe: Recipe }[];
  }, [recentCookSessions]);

  const beginnerRecipes = useMemo(() => {
    if (cookingProfile.recipesCompleted.length >= 3) return [];
    const recipes: Recipe[] = [];
    for (const id of BEGINNER_RECIPE_IDS) {
      const r = getRecipeById(id);
      if (r) recipes.push(r);
    }
    if (recipes.length < 3) {
      for (const recipe of allRecipes) {
        if (recipe.difficulty === "Easy" && !recipes.find((r) => r.id === recipe.id)) {
          recipes.push(recipe);
          if (recipes.length >= 3) break;
        }
      }
    }
    return recipes.slice(0, 3);
  }, [cookingProfile.recipesCompleted.length, allRecipes]);

  const handleStartCooking = useCallback((recipeId: string) => {
    haptic("medium");
    router.push({ pathname: "/cook-mode", params: { recipeId } });
  }, []);

  const handleRandomRecipe = useCallback(() => {
    haptic("medium");
    const level = cookingProfile.currentLevel;
    let pool = allRecipes;
    if (level <= 2) pool = allRecipes.filter((r) => r.difficulty === "Easy");
    else if (level <= 4) pool = allRecipes.filter((r) => r.difficulty !== "Hard");
    if (pool.length === 0) pool = allRecipes;
    const random = pool[Math.floor(Math.random() * pool.length)];
    if (random) router.push({ pathname: "/cook-mode", params: { recipeId: random.id } });
  }, [allRecipes, cookingProfile.currentLevel]);

  const handleAbandonSession = useCallback(() => {
    if (Platform.OS === "web") {
      setActiveCookSession(null);
      return;
    }
    Alert.alert(
      `Stop cooking ${activeCookSession?.recipeName}?`,
      "Your progress won\u2019t be saved.",
      [
        { text: "Keep Cooking", style: "cancel" },
        { text: "Abandon", style: "destructive", onPress: () => setActiveCookSession(null) },
      ]
    );
  }, [activeCookSession, setActiveCookSession]);

  const activeRecipe = activeCookSession ? getRecipeById(activeCookSession.recipeId) : null;
  const hasActiveSession = activeCookSession != null;
  const hasTonightsRecipe = !hasActiveSession && tonightsRecipe != null;
  const showWhatToCook = !hasActiveSession && !hasTonightsRecipe;

  const xpCurrent = Math.round(cookingProfile.progressToNext * 500);
  const xpTotal = 500;
  const progressPct = Math.max(cookingProfile.progressToNext * 100, 4);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: Platform.OS === "web" ? 120 : insets.bottom + SCROLL_BOTTOM_INSET }}
      >
        {/* ── PRIORITY 1: Tonight's Recipe ─────────────────────────── */}
        {hasTonightsRecipe && tonightsRecipe && (
          <View style={styles.section}>
            <View style={styles.sectionLabelRow}>
              <Text style={styles.sectionLabelEditorial}>In Progress</Text>
              <Text style={styles.sessionActiveBadge}>Session Active</Text>
            </View>
            <View style={styles.activeCard}>
              <View style={styles.activeGrid}>
                <View style={styles.activeImageWrap}>
                  {activeRecipe?.image ? (
                    <Image
                      source={{ uri: activeRecipe.image }}
                      style={StyleSheet.absoluteFill}
                      contentFit="cover"
                      transition={reducedMotion ? 0 : 400}
                      placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }}
                      onError={(e) => console.warn("[Image] Failed to load:", e.error)}
                    />
                  ) : (
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.light.surfaceContainerHigh }]} />
                  )}
                  <LinearGradient colors={["transparent", "rgba(0,0,0,0.5)"]} style={StyleSheet.absoluteFill} />
                  {activeCookSession.timerRemaining != null && activeCookSession.timerRemaining > 0 && (
                    <View style={styles.timerOverlay}>
                      <View style={styles.timerPill}>
                        <Ionicons name="timer-outline" size={14} color="#FFFFFF" />
                        <Text style={styles.timerText}>{formatSeconds(activeCookSession.timerRemaining)}</Text>
                      </View>
                    </View>
                  )}
                </View>
                <View style={styles.activeDetails}>
                  <View>
                    <View style={styles.stepIndicator}>
                      <Text style={styles.stepLabel}>Step {activeCookSession.currentStep + 1} of {activeCookSession.totalSteps}</Text>
                      <View style={styles.stepDivider} />
                    </View>
                    <Text style={styles.activeRecipeName} numberOfLines={2} ellipsizeMode="tail">{activeCookSession.recipeName}</Text>
                    {activeRecipe && (
                      <Text style={styles.activeRecipeDesc} numberOfLines={2} ellipsizeMode="tail">
                        {activeRecipe.steps?.[activeCookSession.currentStep]?.text
                          ? activeRecipe.steps[activeCookSession.currentStep].text.slice(0, 100)
                          : activeRecipe.description}
                      </Text>
                    )}
                  </View>
                  <View style={styles.activeActions}>
                    <Pressable
                      onPress={() => {
                        haptic("medium");
                        router.push({
                          pathname: "/cook-mode",
                          params: {
                            recipeId: activeCookSession.recipeId,
                            resumeStep: String(activeCookSession.currentStep),
                          },
                        });
                      }}
                      style={({ pressed }) => [styles.continueCookBtn, pressed && { opacity: 0.88 }]}
                    >
                      <Text style={styles.continueCookBtnText}>Continue Cooking</Text>
                    </Pressable>
                    <Pressable onPress={handleAbandonSession} style={{ alignItems: "center", paddingVertical: 8 }}>
                      <Text style={styles.abandonLink}>Abandon session</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ── Tonight's Recipe (no active session) ───────────────── */}
        {hasTonightsRecipe && tonightsRecipe && (
          <View style={styles.section}>
            <View style={styles.sectionLabelRow}>
              <Text style={styles.sectionLabelEditorial}>Tonight</Text>
            </View>
            <View style={styles.activeCard}>
              <View style={styles.activeGrid}>
                <Pressable
                  style={styles.activeImageWrap}
                  onPress={() => { haptic(); router.push({ pathname: "/recipe/[id]", params: { id: tonightsRecipe.id } }); }}
                >
                  <Image
                    source={{ uri: tonightsRecipe.image }}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                    transition={reducedMotion ? 0 : 400}
                    placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }}
                    onError={(e) => console.warn("[Image] Failed to load:", e.error)}
                  />
                  <LinearGradient colors={["transparent", "rgba(0,0,0,0.3)"]} style={StyleSheet.absoluteFill} />
                </Pressable>
                <View style={styles.activeDetails}>
                  <View>
                    <Text style={styles.activeRecipeName} numberOfLines={2} ellipsizeMode="tail">{tonightsRecipe.name}</Text>
                    <Text style={styles.activeRecipeDesc} numberOfLines={2} ellipsizeMode="tail">
                      {tonightsRecipe.region ?? tonightsRecipe.countryName} {"\u2022"} {tonightsRecipe.time}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => handleStartCooking(tonightsRecipe.id)}
                    style={({ pressed }) => [styles.continueCookBtn, pressed && { opacity: 0.88 }]}
                  >
                    <Text style={styles.continueCookBtnText}>Start Cooking</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ── What to Cook (empty state) ─────────────────────────── */}
        {showWhatToCook && (
          <View style={styles.section}>
            <View style={styles.whatToCookCard}>
              <Ionicons name="restaurant-outline" size={32} color={Colors.light.primary} style={{ marginBottom: 4 }} />
              <Text style={styles.whatToCookTitle}>What should we cook?</Text>
              <View style={styles.whatToCookRow}>
                <Pressable
                  style={({ pressed }) => [styles.whatToCookBtn, pressed && { opacity: 0.88 }]}
                  onPress={handleRandomRecipe}
                >
                  <Ionicons name="shuffle-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.whatToCookBtnText}>Surprise me</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.whatToCookBtnOutline, pressed && { opacity: 0.88 }]}
                  onPress={() => { haptic(); router.push("/(tabs)"); }}
                >
                  <Text style={styles.whatToCookBtnOutlineText}>Browse</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}

        {/* ── Progress / XP Card ─────────────────────────────────── */}
        <View style={[styles.section, { paddingHorizontal: 20 }]}>
          <View style={styles.progressCard}>
            <View style={styles.progressTop}>
              <View style={styles.progressLeft}>
                <View style={styles.progressIconCircle}>
                  <Ionicons name="trophy-outline" size={22} color={Colors.light.onSecondaryContainer} />
                </View>
                <View>
                  <Text style={styles.progressLevelName}>{cookingProfile.currentLevelName} {"\u2022"} Level {cookingProfile.currentLevel}</Text>
                  <Text style={styles.progressXp}>{xpCurrent} / {xpTotal} XP to next level</Text>
                </View>
              </View>
              <Text style={styles.progressPct}>{Math.round(progressPct)}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
            </View>
          </View>
        </View>

        {/* ── Recently Cooked (Portrait Scroll) ──────────────────── */}
        {recentRecipes.length > 0 && (
          <View style={styles.sectionNoHPad}>
            <View style={[styles.sectionLabelRow, { paddingHorizontal: 20 }]}>
              <Text style={styles.sectionTitle}>Recently Cooked</Text>
              <Pressable onPress={() => { haptic(); router.push("/(tabs)/profile" as any); }}>
                <Text style={styles.viewAllLink}>View All</Text>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentScroll}
            >
              {recentRecipes.map(({ session, recipe }) => (
                <Pressable
                  key={session.id}
                  style={({ pressed }) => [styles.recentCard, pressed && { opacity: 0.88 }]}
                  onPress={() => { haptic(); router.push({ pathname: "/recipe/[id]", params: { id: recipe.id } }); }}
                >
                  <View style={styles.recentImageWrap}>
                    <Image
                      source={{ uri: recipe.image }}
                      style={StyleSheet.absoluteFill}
                      contentFit="cover"
                      transition={reducedMotion ? 0 : 200}
                      placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }}
                      onError={(e) => console.warn("[Image] Failed to load:", e.error)}
                    />
                  </View>
                  <View style={styles.recentMeta}>
                    <Text style={styles.recentTime}>{timeAgo(session.completedAt!)}</Text>
                    <Text style={styles.recentName} numberOfLines={2} ellipsizeMode="tail">{recipe.name}</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Start With These (beginners) ───────────────────────── */}
        {beginnerRecipes.length > 0 && recentRecipes.length === 0 && (
          <View style={[styles.section, { paddingHorizontal: 20 }]}>
            <Text style={styles.sectionTitle}>Start With These</Text>
            <View style={styles.beginnerList}>
              {beginnerRecipes.map((recipe, idx) => (
                <Pressable
                  key={recipe.id}
                  style={({ pressed }) => [
                    styles.beginnerRow,
                    idx < beginnerRecipes.length - 1 && styles.beginnerRowBorder,
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={() => { haptic(); router.push({ pathname: "/recipe/[id]", params: { id: recipe.id } }); }}
                >
                  <Image
                    source={{ uri: recipe.image }}
                    style={styles.beginnerImage}
                    contentFit="cover"
                    placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }}
                    onError={(e) => console.warn("[Image] Failed to load:", e.error)}
                  />
                  <View style={styles.beginnerInfo}>
                    <Text style={styles.beginnerName} numberOfLines={1} ellipsizeMode="tail">{recipe.name}</Text>
                    <Text style={styles.beginnerMeta}>
                      {recipe.countryName} {"\u2022"} {recipe.time} {"\u2022"} {recipe.difficulty}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* ── Mastering Techniques (Accordion) ───────────────────── */}
        <View style={[styles.section, { paddingHorizontal: 20, borderTopWidth: 1, borderTopColor: "rgba(222,193,179,0.2)", paddingTop: 32 }]}>
          <Pressable
            onPress={() => { haptic(); setTechniquesExpanded((v) => !v); }}
            style={({ pressed }) => [styles.techniquesAccordion, pressed && { backgroundColor: Colors.light.surfaceContainer }]}
          >
            <View style={styles.techniquesLeft}>
              <View style={styles.techniquesIconCircle}>
                <Ionicons name="bulb-outline" size={18} color={Colors.light.onSurfaceVariant} />
              </View>
              <View>
                <Text style={styles.techniquesTitle}>Mastering Techniques</Text>
                <Text style={styles.techniquesSub}>Expand your culinary repertoire with {TECHNIQUE_VIDEOS.length} lessons</Text>
              </View>
            </View>
            <Ionicons
              name={techniquesExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              color={Colors.light.secondary}
            />
          </Pressable>

          {techniquesExpanded && (
            <View style={styles.techniqueList}>
              {TECHNIQUE_VIDEOS.map((video) => (
                <Pressable
                  key={video.id}
                  style={({ pressed }) => [styles.techniqueRow, pressed && { opacity: 0.7 }]}
                  onPress={() => haptic()}
                >
                  <View style={styles.techniqueThumbnailWrap}>
                    <Image
                      source={{ uri: video.thumbnailUrl }}
                      style={styles.techniqueThumbnail}
                      contentFit="cover"
                      transition={reducedMotion ? 0 : 200}
                      placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }}
                      onError={(e) => console.warn("[Image] Failed to load:", e.error)}
                    />
                    <View style={styles.playOverlay}>
                      <Ionicons name="play-circle" size={20} color="rgba(255,255,255,0.8)" />
                    </View>
                  </View>
                  <View style={styles.techniqueInfo}>
                    <Text style={styles.techniqueTitle} numberOfLines={1} ellipsizeMode="tail">{video.title}</Text>
                    <Text style={styles.techniqueSubtitle} numberOfLines={1} ellipsizeMode="tail">{video.subtitle}</Text>
                  </View>
                  <Text style={styles.techniqueDuration}>{video.duration}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
  },

  section: {
    marginBottom: 24,
  },
  sectionNoHPad: {
    marginBottom: 24,
  },
  sectionLabelRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 12,
  },

  /* ── Tonight's Recipe ────────────────────────────────────────── */
  tonightCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(154,65,0,0.3)",
    padding: 20,
    gap: 12,
  },
  sectionLabelEditorial: {
    fontFamily: "NotoSerif_600SemiBold",
    fontStyle: "italic",
    fontSize: 18,
    color: Colors.light.primary,
  },
  sessionActiveBadge: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    color: Colors.light.secondary,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  sectionTitle: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 20,
    color: Colors.light.onSurface,
  },
  viewAllLink: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.light.primary,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },

  /* ── Active Session Hero Card ─────────────────────────────────── */
  activeCard: {
    marginHorizontal: 24,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: Colors.light.surfaceContainerHigh,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 16 },
      android: { elevation: 8 },
      web: { boxShadow: "0 8px 32px rgba(0,0,0,0.12)" },
    }),
  },
  activeGrid: {
    ...Platform.select({
      web: { flexDirection: "row" as const },
      default: {},
    }),
  },
  activeImageWrap: {
    height: 240,
    ...Platform.select({
      web: { flex: 1, height: "auto" as any, minHeight: 280 },
      default: {},
    }),
    overflow: "hidden",
    backgroundColor: Colors.light.surfaceContainerHigh,
  },
  timerOverlay: {
    position: "absolute",
    bottom: 16,
    left: 16,
  },
  timerPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  timerText: {
    fontFamily: "Inter_500Medium",
    fontSize: 18,
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  activeDetails: {
    padding: 24,
    gap: 24,
    justifyContent: "space-between",
    ...Platform.select({
      web: { flex: 1 },
      default: {},
    }),
  },
  stepIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  stepLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.light.primaryContainer,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  stepDivider: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(222,193,179,0.2)",
  },
  activeRecipeName: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 26,
    color: Colors.light.onSurface,
    letterSpacing: -0.3,
    lineHeight: 34,
    marginBottom: 8,
  },
  activeRecipeDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.light.onSurfaceVariant,
    lineHeight: 22,
  },
  activeActions: {
    gap: 4,
  },
  continueCookBtn: {
    backgroundColor: Colors.light.primary,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: { shadowColor: Colors.light.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 4 },
      web: { boxShadow: "0 4px 12px rgba(154,65,0,0.3)" },
    }),
  },
  continueCookBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#FFFFFF",
  },
  abandonLink: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.light.secondary,
    textDecorationLine: "underline",
    textDecorationColor: "rgba(114,90,60,0.3)",
  },

  /* ── What to Cook (empty state) ──────────────────────────────── */
  whatToCookCard: {
    backgroundColor: Colors.light.surfaceWarmAlt,
    borderRadius: 12,
    padding: 24,
    marginHorizontal: 24,
    backgroundColor: "#F5EDDF",
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    gap: 16,
  },
  whatToCookTitle: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 22,
    color: Colors.light.onSurface,
    textAlign: "center",
  },
  whatToCookRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  whatToCookBtn: {
    flex: 1,
    height: 48,
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  whatToCookBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#FFFFFF",
  },
  whatToCookBtnOutline: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.surface,
  },
  whatToCookBtnOutlineText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.light.primary,
  },

  /* ── Progress / XP Card ──────────────────────────────────────── */
  progressCard: {
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: 12,
    padding: 20,
    gap: 16,
  },
  progressTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  progressIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.secondaryContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  progressLevelName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.light.onSurface,
    marginBottom: 2,
  },
  progressXp: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: Colors.light.secondary,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  progressPct: {
    fontFamily: "NotoSerif_600SemiBold",
    fontStyle: "italic",
    fontSize: 22,
    color: Colors.light.primary,
  },
  progressTrack: {
    width: "100%",
    height: 5,
    backgroundColor: "rgba(222,193,179,0.15)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.light.primary,
    borderRadius: 3,
  },

  /* ── Recently Cooked (Portrait Cards) ────────────────────────── */
  recentScroll: {
    paddingHorizontal: 20,
    gap: 16,
    paddingBottom: 8,
  },
  recentCard: {
    width: 200,
    gap: 10,
  },
  recentImageWrap: {
    width: "100%",
    aspectRatio: 4 / 5,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: Colors.light.surfaceContainerHigh,
  },
  recentMeta: {
    gap: 4,
  },
  recentTime: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    color: Colors.light.secondary,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  recentName: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 17,
    color: Colors.light.onSurface,
    lineHeight: 24,
  },

  /* ── Beginner Recipes ────────────────────────────────────────── */
  beginnerList: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.light.outlineVariant,
    backgroundColor: Colors.light.surface,
    marginTop: 12,
  },
  beginnerRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  beginnerRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.outlineVariant,
  },
  beginnerImage: {
    width: 56,
    height: 48,
    borderRadius: 8,
    backgroundColor: Colors.light.surfaceWarmAlt,
    borderRadius: 10,
    backgroundColor: Colors.light.surfaceContainerHigh,
  },
  beginnerInfo: {
    flex: 1,
    gap: 4,
  },
  beginnerName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.light.onSurface,
  },
  beginnerMeta: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.light.secondary,
  },

  /* ── Techniques Accordion ────────────────────────────────────── */
  techniquesAccordion: {
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  techniquesLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  techniquesIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(222,193,179,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  techniquesTitle: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 17,
    color: Colors.light.onSurface,
    marginBottom: 2,
  },
  techniquesSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.light.onSurfaceVariant,
    lineHeight: 18,
  },
  techniqueList: {
    gap: 8,
    paddingTop: 16,
  },
  techniqueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  techniqueThumbnailWrap: {
    width: 64,
    height: 48,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
    backgroundColor: Colors.light.surfaceContainerHigh,
  },
  techniqueThumbnail: {
    width: "100%",
    height: "100%",
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  techniqueInfo: {
    flex: 1,
    gap: 2,
  },
  techniqueTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.light.onSurface,
  },
  techniqueSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.light.onSurfaceVariant,
  },
  techniqueDuration: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.light.secondary,
    letterSpacing: 0.5,
  },
});
