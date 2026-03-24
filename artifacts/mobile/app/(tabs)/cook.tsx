import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
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
import { COUNTRIES, getRecipeById, resolveImageUrl } from "@/constants/data";
import type { Recipe } from "@/constants/data";
import { TECHNIQUE_VIDEOS } from "@/constants/techniques";
import { useApp } from "@/contexts/AppContext";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import TabHeader from "@/components/TabHeader";

const TERRACOTTA = "#9A4100";
const CREAM = "#FEF9F3";
const BORDER = "#E8DFD2";
const TEXT_PRIMARY = "#1C1A17";
const TEXT_SECONDARY = "#5C5549";

const haptic = () => {
  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

function getAllRecipes(): Recipe[] {
  const recipes: Recipe[] = [];
  for (const country of COUNTRIES) {
    for (const recipe of country.recipes) {
      recipes.push({ ...recipe, image: resolveImageUrl(recipe.image) });
    }
  }
  return recipes;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

// Beginner-friendly curated recipes
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

  // Tonight's recipe from itinerary
  const tonightsRecipe = useMemo(() => {
    if (!currentItinerary || currentItinerary.length === 0) return null;
    const today = new Date().toISOString().split("T")[0];
    const todayEntry = currentItinerary.find(
      (d) => d.date === today && d.status === "active"
    );
    if (!todayEntry) return null;
    const recipeIds = todayEntry.mode === "quick" ? todayEntry.quickRecipeIds : todayEntry.fullRecipeIds;
    if (!recipeIds || recipeIds.length === 0) return null;
    return getRecipeById(recipeIds[0]);
  }, [currentItinerary]);

  // Recent completed recipes
  const recentRecipes = useMemo(() => {
    return recentCookSessions
      .filter((s) => s.completedAt)
      .slice(0, 5)
      .map((s) => ({ session: s, recipe: getRecipeById(s.recipeId) }))
      .filter((r) => r.recipe != null) as { session: typeof recentCookSessions[0]; recipe: Recipe }[];
  }, [recentCookSessions]);

  // Beginner recipes for new users
  const beginnerRecipes = useMemo(() => {
    if (cookingProfile.recipesCompleted.length >= 3) return [];
    const recipes: Recipe[] = [];
    for (const id of BEGINNER_RECIPE_IDS) {
      const r = getRecipeById(id);
      if (r) recipes.push(r);
    }
    // Fallback: grab easy recipes if curated IDs don't match
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
    haptic();
    router.push({ pathname: "/cook-mode", params: { recipeId } });
  }, []);

  const handleRandomRecipe = useCallback(() => {
    haptic();
    const level = cookingProfile.currentLevel;
    let pool = allRecipes;
    if (level <= 2) {
      pool = allRecipes.filter((r) => r.difficulty === "Easy");
    } else if (level <= 4) {
      pool = allRecipes.filter((r) => r.difficulty !== "Hard");
    }
    if (pool.length === 0) pool = allRecipes;
    const random = pool[Math.floor(Math.random() * pool.length)];
    if (random) {
      router.push({ pathname: "/cook-mode", params: { recipeId: random.id } });
    }
  }, [allRecipes, cookingProfile.currentLevel]);

  const handleAbandonSession = useCallback(() => {
    if (Platform.OS === "web") {
      setActiveCookSession(null);
      return;
    }
    Alert.alert(
      `Stop cooking ${activeCookSession?.recipeName}?`,
      "Your progress won't be saved.",
      [
        { text: "Keep Cooking", style: "cancel" },
        {
          text: "Abandon",
          style: "destructive",
          onPress: () => setActiveCookSession(null),
        },
      ]
    );
  }, [activeCookSession, setActiveCookSession]);

  const servings = itineraryProfile?.defaultServings ?? 4;

  // Determine which priority card to show
  const hasActiveSession = activeCookSession != null;
  const hasTonightsRecipe = !hasActiveSession && tonightsRecipe != null;
  const showWhatToCook = !hasActiveSession && !hasTonightsRecipe;

  return (
    <View style={styles.container}>
      <TabHeader title="Cook" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 120 : insets.bottom + 120 }}
      >
        {/* ── PRIORITY 1: Active Cook Session ──────────────────────── */}
        {hasActiveSession && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>IN PROGRESS</Text>
            <View style={styles.continueCard}>
              <Text style={styles.continueRecipeName}>{activeCookSession.recipeName}</Text>
              <Text style={styles.continueProgress}>
                Step {activeCookSession.currentStep + 1} of {activeCookSession.totalSteps}
                {activeCookSession.timerRemaining != null && activeCookSession.timerRemaining > 0
                  ? ` · Timer: ${formatSeconds(activeCookSession.timerRemaining)}`
                  : ""}
              </Text>
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
                style={({ pressed }) => [styles.continueBtn, pressed && { opacity: 0.88 }]}
              >
                <Text style={styles.continueBtnText}>Continue Cooking →</Text>
              </Pressable>
              <Pressable onPress={handleAbandonSession} hitSlop={8}>
                <Text style={styles.abandonText}>Abandon this session</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* ── PRIORITY 1: Tonight's Recipe ─────────────────────────── */}
        {hasTonightsRecipe && tonightsRecipe && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>TONIGHT</Text>
            <View style={styles.tonightCard}>
              <Pressable
                onPress={() => {
                  haptic();
                  router.push({ pathname: "/recipe/[id]", params: { id: tonightsRecipe.id } });
                }}
              >
                <Image
                  source={{ uri: resolveImageUrl(tonightsRecipe.image) }}
                  style={styles.tonightImage}
                  contentFit="cover"
                  transition={reducedMotion ? 0 : 400}
                />
              </Pressable>
              <View style={styles.tonightContent}>
                <Pressable
                  onPress={() => {
                    haptic();
                    router.push({ pathname: "/recipe/[id]", params: { id: tonightsRecipe.id } });
                  }}
                >
                  <Text style={styles.tonightName}>{tonightsRecipe.name}</Text>
                </Pressable>
                <Text style={styles.tonightMeta}>
                  {tonightsRecipe.region ?? tonightsRecipe.countryName}, {tonightsRecipe.countryName} · {tonightsRecipe.time}
                </Text>
                <Text style={styles.tonightServing}>Serving {servings}</Text>
                <Pressable
                  style={({ pressed }) => [styles.startButton, pressed && { opacity: 0.88 }]}
                  onPress={() => handleStartCooking(tonightsRecipe.id)}
                >
                  <Text style={styles.startButtonText}>Start Cooking →</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}

        {/* ── PRIORITY 1: What should we cook? ─────────────────────── */}
        {showWhatToCook && (
          <View style={styles.section}>
            <View style={styles.whatToCookCard}>
              <Text style={styles.whatToCookTitle}>What should we cook?</Text>
              <View style={styles.whatToCookRow}>
                <Pressable
                  style={({ pressed }) => [styles.whatToCookBtn, pressed && { opacity: 0.88 }]}
                  onPress={handleRandomRecipe}
                >
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

        {/* ── PRIORITY 2: Your Level (compact inline) ──────────────── */}
        <View style={styles.levelRow}>
          <Text style={styles.levelName}>
            {cookingProfile.currentLevelName} · Level {cookingProfile.currentLevel}
          </Text>
          <View style={styles.levelTrack}>
            <View
              style={[
                styles.levelFill,
                { width: `${Math.max(cookingProfile.progressToNext * 100, 4)}%` },
              ]}
            />
          </View>
          <Text style={styles.levelStats}>
            {cookingProfile.recipesCompleted.length} cooked
            {cookingProfile.cuisinesExplored.length > 0
              ? ` · ${cookingProfile.cuisinesExplored.length} cuisines`
              : ""}
          </Text>
        </View>

        {/* ── PRIORITY 3: Recently Cooked (horizontal scroll) ──────── */}
        {recentRecipes.length > 0 && (
          <View style={styles.sectionNoHPad}>
            <Text style={[styles.sectionLabel, { paddingHorizontal: 24 }]}>RECENTLY COOKED</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentScroll}
            >
              {recentRecipes.map(({ session, recipe }) => (
                <Pressable
                  key={session.id}
                  style={({ pressed }) => [styles.recentCard, pressed && { opacity: 0.88 }]}
                  onPress={() => {
                    haptic();
                    router.push({ pathname: "/recipe/[id]", params: { id: recipe.id } });
                  }}
                >
                  <Image
                    source={{ uri: resolveImageUrl(recipe.image) }}
                    style={styles.recentImage}
                    contentFit="cover"
                    transition={reducedMotion ? 0 : 200}
                  />
                  <Text style={styles.recentName} numberOfLines={1}>{recipe.name}</Text>
                  <Text style={styles.recentTime}>{timeAgo(session.completedAt!)}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── START WITH THESE (new users, < 3 recipes cooked) ─────── */}
        {beginnerRecipes.length > 0 && recentRecipes.length === 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>START WITH THESE</Text>
            <View style={styles.beginnerList}>
              {beginnerRecipes.map((recipe, idx) => (
                <Pressable
                  key={recipe.id}
                  style={({ pressed }) => [
                    styles.beginnerRow,
                    idx < beginnerRecipes.length - 1 && styles.beginnerRowBorder,
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={() => {
                    haptic();
                    router.push({ pathname: "/recipe/[id]", params: { id: recipe.id } });
                  }}
                >
                  <Image
                    source={{ uri: resolveImageUrl(recipe.image) }}
                    style={styles.beginnerImage}
                    contentFit="cover"
                  />
                  <View style={styles.beginnerInfo}>
                    <Text style={styles.beginnerName} numberOfLines={1}>{recipe.name}</Text>
                    <Text style={styles.beginnerMeta}>
                      {recipe.countryName} · {recipe.time} · {recipe.difficulty}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* ── PRIORITY 4: Techniques (collapsed) ──────────────────── */}
        <View style={styles.section}>
          <Pressable
            onPress={() => { haptic(); setTechniquesExpanded((v) => !v); }}
            style={styles.techniquesHeader}
          >
            <Ionicons
              name={techniquesExpanded ? "chevron-down" : "chevron-forward"}
              size={18}
              color={TEXT_PRIMARY}
            />
            <Text style={styles.techniquesHeaderText}>
              Techniques ({TECHNIQUE_VIDEOS.length} videos)
            </Text>
          </Pressable>

          {techniquesExpanded && (
            <View style={styles.techniqueList}>
              {TECHNIQUE_VIDEOS.map((video) => (
                <Pressable
                  key={video.id}
                  style={({ pressed }) => [styles.techniqueRow, pressed && { opacity: 0.7 }]}
                  onPress={() => {
                    haptic();
                    // v1: placeholder — would open video player
                  }}
                >
                  <View style={styles.techniqueThumbnailWrap}>
                    <Image
                      source={{ uri: video.thumbnailUrl }}
                      style={styles.techniqueThumbnail}
                      contentFit="cover"
                      transition={reducedMotion ? 0 : 200}
                    />
                    <View style={styles.playOverlay}>
                      <Ionicons name="play-circle" size={20} color="rgba(255,255,255,0.8)" />
                    </View>
                  </View>
                  <View style={styles.techniqueInfo}>
                    <Text style={styles.techniqueTitle} numberOfLines={1}>{video.title}</Text>
                    <Text style={styles.techniqueSubtitle} numberOfLines={1}>{video.subtitle}</Text>
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

function formatSeconds(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CREAM,
  },

  /* ── Sections ────────────────────────────────────────────────── */
  section: {
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  sectionNoHPad: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: TERRACOTTA,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 12,
    lineHeight: 20,
  },

  /* ── Continue Cooking Card (Active Session) ──────────────────── */
  continueCard: {
    backgroundColor: "#FEF0E6",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(154,65,0,0.3)",
    padding: 20,
    gap: 12,
  },
  continueRecipeName: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 20,
    color: TEXT_PRIMARY,
    lineHeight: 28,
  },
  continueProgress: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: TEXT_SECONDARY,
    lineHeight: 22,
  },
  continueBtn: {
    backgroundColor: TERRACOTTA,
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  continueBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    color: CREAM,
  },
  abandonText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: TEXT_SECONDARY,
    textAlign: "center",
    lineHeight: 20,
  },

  /* ── Tonight's Recipe ────────────────────────────────────────── */
  tonightCard: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: CREAM,
    borderWidth: 1,
    borderColor: BORDER,
  },
  tonightImage: {
    width: "100%",
    height: 180,
  },
  tonightContent: {
    padding: 16,
    gap: 8,
  },
  tonightName: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 20,
    color: TEXT_PRIMARY,
    lineHeight: 28,
  },
  tonightMeta: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: TEXT_SECONDARY,
    lineHeight: 22,
  },
  tonightServing: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: TEXT_SECONDARY,
    lineHeight: 20,
  },
  startButton: {
    backgroundColor: TERRACOTTA,
    borderRadius: 12,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  startButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    color: CREAM,
  },

  /* ── What should we cook? ────────────────────────────────────── */
  whatToCookCard: {
    backgroundColor: "#F5EDDF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: 20,
  },
  whatToCookTitle: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 22,
    color: TEXT_PRIMARY,
    textAlign: "center",
  },
  whatToCookRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  whatToCookBtn: {
    flex: 1,
    height: 52,
    backgroundColor: TERRACOTTA,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  whatToCookBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: CREAM,
  },
  whatToCookBtnOutline: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: TERRACOTTA,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: CREAM,
  },
  whatToCookBtnOutlineText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: TERRACOTTA,
  },

  /* ── Your Level (compact inline) ─────────────────────────────── */
  levelRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: BORDER,
    marginBottom: 24,
    gap: 10,
    flexWrap: "wrap",
  },
  levelName: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 16,
    color: TEXT_PRIMARY,
    lineHeight: 22,
  },
  levelTrack: {
    width: 100,
    height: 4,
    backgroundColor: BORDER,
    borderRadius: 2,
    overflow: "hidden",
  },
  levelFill: {
    height: "100%",
    backgroundColor: TERRACOTTA,
    borderRadius: 2,
  },
  levelStats: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: TEXT_SECONDARY,
    lineHeight: 18,
  },

  /* ── Recently Cooked ─────────────────────────────────────────── */
  recentScroll: {
    paddingHorizontal: 24,
    gap: 12,
  },
  recentCard: {
    width: 100,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
    backgroundColor: CREAM,
  },
  recentImage: {
    width: 100,
    height: 80,
  },
  recentName: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: TEXT_PRIMARY,
    lineHeight: 20,
    paddingHorizontal: 8,
    paddingTop: 6,
  },
  recentTime: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: TEXT_SECONDARY,
    lineHeight: 18,
    paddingHorizontal: 8,
    paddingBottom: 8,
  },

  /* ── Start With These (Beginner) ─────────────────────────────── */
  beginnerList: {
    backgroundColor: CREAM,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
  },
  beginnerRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 14,
    minHeight: 72,
  },
  beginnerRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
  },
  beginnerImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: "#F5EDDF",
  },
  beginnerInfo: {
    flex: 1,
    gap: 2,
  },
  beginnerName: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 17,
    color: TEXT_PRIMARY,
    lineHeight: 24,
  },
  beginnerMeta: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: TEXT_SECONDARY,
    lineHeight: 20,
  },

  /* ── Techniques (collapsed) ──────────────────────────────────── */
  techniquesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  techniquesHeaderText: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: TEXT_PRIMARY,
    lineHeight: 22,
  },
  techniqueList: {
    backgroundColor: CREAM,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
    marginTop: 12,
  },
  techniqueRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 14,
    minHeight: 72,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
  },
  techniqueThumbnailWrap: {
    width: 56,
    height: 56,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#F5EDDF",
  },
  techniqueThumbnail: {
    width: 56,
    height: 56,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  techniqueInfo: {
    flex: 1,
    gap: 2,
  },
  techniqueTitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: TEXT_PRIMARY,
    lineHeight: 22,
  },
  techniqueSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: TEXT_SECONDARY,
    lineHeight: 20,
  },
  techniqueDuration: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: TEXT_SECONDARY,
    lineHeight: 18,
    flexShrink: 0,
  },
});
