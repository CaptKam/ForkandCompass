import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import RecipeContextMenu from "@/components/RecipeContextMenu";
import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
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

export default function CookScreen() {
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const {
    cookingProfile,
    currentItinerary,
    recentCookSessions,
    savedRecipeIds,
  } = useApp();

  const [recentSheetOpen, setRecentSheetOpen] = useState(false);
  const [savedSheetOpen, setSavedSheetOpen] = useState(false);

  const allRecipes = useMemo(() => getAllRecipes(), []);

  // Tonight's recipe: find today's itinerary entry
  const tonightsRecipe = useMemo(() => {
    if (!currentItinerary || currentItinerary.length === 0) return null;
    const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
    const todayEntry = currentItinerary.find(
      (d) => d.dayLabel.toLowerCase() === today.toLowerCase()
    );
    if (!todayEntry) return null;
    const recipeIds = todayEntry.mode === "quick" ? todayEntry.quickRecipeIds : todayEntry.fullRecipeIds;
    if (!recipeIds || recipeIds.length === 0) return null;
    return getRecipeById(recipeIds[0]);
  }, [currentItinerary]);

  // Recent recipes from cook sessions
  const recentRecipes = useMemo(() => {
    return recentCookSessions
      .map((s) => getRecipeById(s.recipeId))
      .filter(Boolean) as Recipe[];
  }, [recentCookSessions]);

  // Saved recipes
  const savedRecipes = useMemo(() => {
    return savedRecipeIds
      .map((id) => getRecipeById(id))
      .filter(Boolean) as Recipe[];
  }, [savedRecipeIds]);

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

  const handleRecipePress = useCallback((id: string) => {
    haptic();
    router.push({ pathname: "/recipe/[id]", params: { id } });
  }, []);

  return (
    <View style={styles.container}>
      <TabHeader title="Cook" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 120 : insets.bottom + 120 }}
      >
        {/* ── Cooking Level Card ──────────────────────────────────── */}
        <View style={styles.levelCard}>
          <Text style={styles.levelLabel}>YOUR COOKING LEVEL</Text>
          <Text style={styles.levelName}>{cookingProfile.currentLevelName}</Text>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.max(cookingProfile.progressToNext * 100, 4)}%` },
              ]}
            />
          </View>
          <Text style={styles.levelMeta}>Level {cookingProfile.currentLevel}</Text>
          <Text style={styles.levelStats}>
            {cookingProfile.recipesCompleted.length} recipes cooked{" "}
            {cookingProfile.cuisinesExplored.length > 0
              ? `\u00b7 ${cookingProfile.cuisinesExplored.length} cuisines`
              : ""}
          </Text>
        </View>

        {/* ── Tonight's Recipe ────────────────────────────────────── */}
        {tonightsRecipe && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>TONIGHT'S RECIPE</Text>
            <Pressable
              style={({ pressed }) => [styles.tonightCard, pressed && { opacity: 0.92 }]}
              onPress={() => handleRecipePress(tonightsRecipe.id)}
            >
              <Image
                source={{ uri: resolveImageUrl(tonightsRecipe.image) }}
                style={styles.tonightImage}
                contentFit="cover"
                transition={reducedMotion ? 0 : 400}
              />
              <View style={styles.tonightContent}>
                <Text style={styles.tonightName}>{tonightsRecipe.name}</Text>
                <Text style={styles.tonightMeta}>
                  {tonightsRecipe.region ?? tonightsRecipe.countryName} · {tonightsRecipe.time} · {tonightsRecipe.difficulty}
                </Text>
                <Pressable
                  style={({ pressed }) => [styles.startButton, pressed && { opacity: 0.85 }]}
                  onPress={() => handleStartCooking(tonightsRecipe.id)}
                >
                  <Text style={styles.startButtonText}>Start Cooking</Text>
                </Pressable>
              </View>
            </Pressable>
          </View>
        )}

        {/* ── Quick Start ─────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>QUICK START</Text>
          <View style={styles.quickStartRow}>
            <Pressable
              style={({ pressed }) => [styles.quickPill, pressed && { opacity: 0.8 }]}
              onPress={() => {
                haptic();
                setRecentSheetOpen(!recentSheetOpen);
                setSavedSheetOpen(false);
              }}
            >
              <Ionicons name="time-outline" size={18} color={Colors.light.onSurface} />
              <Text style={styles.quickPillText}>Recent</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.quickPill, pressed && { opacity: 0.8 }]}
              onPress={() => {
                haptic();
                setSavedSheetOpen(!savedSheetOpen);
                setRecentSheetOpen(false);
              }}
            >
              <Ionicons name="bookmark-outline" size={18} color={Colors.light.onSurface} />
              <Text style={styles.quickPillText}>Saved</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.quickPill, pressed && { opacity: 0.8 }]}
              onPress={handleRandomRecipe}
            >
              <Ionicons name="shuffle-outline" size={18} color={Colors.light.onSurface} />
              <Text style={styles.quickPillText}>Random</Text>
            </Pressable>
          </View>

          {/* Recent recipes inline list */}
          {recentSheetOpen && (
            <View style={styles.inlineSheet}>
              {recentRecipes.length === 0 ? (
                <Text style={styles.inlineSheetEmpty}>No recent cook sessions yet. Start cooking!</Text>
              ) : (
                recentRecipes.map((r) => (
                  <RecipeContextMenu key={r.id} recipe={r}>
                    <Pressable
                      style={({ pressed }) => [styles.inlineRecipeRow, pressed && { opacity: 0.7 }]}
                      onPress={() => handleStartCooking(r.id)}
                    >
                      <Image
                        source={{ uri: resolveImageUrl(r.image) }}
                        style={styles.inlineRecipeImage}
                        contentFit="cover"
                      />
                      <View style={styles.inlineRecipeInfo}>
                        <Text style={styles.inlineRecipeName} numberOfLines={1}>{r.name}</Text>
                        <Text style={styles.inlineRecipeMeta}>{r.countryName} · {r.time}</Text>
                      </View>
                      <Ionicons name="play-circle" size={28} color={Colors.light.primary} />
                    </Pressable>
                  </RecipeContextMenu>
                ))
              )}
            </View>
          )}

          {/* Saved recipes inline list */}
          {savedSheetOpen && (
            <View style={styles.inlineSheet}>
              {savedRecipes.length === 0 ? (
                <Text style={styles.inlineSheetEmpty}>No saved recipes yet. Bookmark recipes to see them here.</Text>
              ) : (
                savedRecipes.slice(0, 5).map((r) => (
                  <RecipeContextMenu key={r.id} recipe={r}>
                    <Pressable
                      style={({ pressed }) => [styles.inlineRecipeRow, pressed && { opacity: 0.7 }]}
                      onPress={() => handleStartCooking(r.id)}
                    >
                      <Image
                        source={{ uri: resolveImageUrl(r.image) }}
                        style={styles.inlineRecipeImage}
                        contentFit="cover"
                      />
                      <View style={styles.inlineRecipeInfo}>
                        <Text style={styles.inlineRecipeName} numberOfLines={1}>{r.name}</Text>
                        <Text style={styles.inlineRecipeMeta}>{r.countryName} · {r.time}</Text>
                      </View>
                      <Ionicons name="play-circle" size={28} color={Colors.light.primary} />
                    </Pressable>
                  </RecipeContextMenu>
                ))
              )}
            </View>
          )}
        </View>

        {/* ── Level Up Your Skills ────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>LEVEL UP YOUR SKILLS</Text>
          <View style={styles.techniqueList}>
            {TECHNIQUE_VIDEOS.map((video) => (
              <Pressable
                key={video.id}
                style={({ pressed }) => [styles.techniqueRow, pressed && { opacity: 0.7 }]}
                onPress={() => {
                  haptic();
                  // In v1 this would open a video player; for now navigate to the technique
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
                    <Ionicons name="play" size={16} color="#FFFFFF" />
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

  /* ── Level Card ──────────────────────────────────────────────── */
  levelCard: {
    marginHorizontal: 24,
    marginBottom: 28,
    backgroundColor: "#F5EDDF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E8DFD2",
    padding: 20,
    gap: 8,
  },
  levelLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.light.primary,
    textTransform: "uppercase",
    letterSpacing: 2,
    lineHeight: 18,
  },
  levelName: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 22,
    color: Colors.light.onSurface,
    lineHeight: 28,
  },
  progressTrack: {
    height: 6,
    backgroundColor: "#E8DFD2",
    borderRadius: 4,
    overflow: "hidden",
    marginTop: 4,
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.light.primary,
    borderRadius: 4,
  },
  levelMeta: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.light.secondary,
    lineHeight: 20,
    marginTop: 2,
  },
  levelStats: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: "#8A8279",
    lineHeight: 20,
  },

  /* ── Sections ────────────────────────────────────────────────── */
  section: {
    marginBottom: 28,
    paddingHorizontal: 24,
  },
  sectionLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.light.primary,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 16,
    lineHeight: 20,
  },

  /* ── Tonight's Recipe ────────────────────────────────────────── */
  tonightCard: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: Colors.light.surfaceContainerLow,
    borderWidth: 1,
    borderColor: "#E8DFD2",
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
    fontSize: 18,
    color: Colors.light.onSurface,
    lineHeight: 24,
  },
  tonightMeta: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: "#8A8279",
    lineHeight: 22,
  },
  startButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  startButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },

  /* ── Quick Start ─────────────────────────────────────────────── */
  quickStartRow: {
    flexDirection: "row",
    gap: 12,
  },
  quickPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F5EDDF",
    borderWidth: 1,
    borderColor: "#E8DFD2",
    borderRadius: 24,
    paddingHorizontal: 20,
    height: 48,
    minWidth: 100,
  },
  quickPillText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.light.onSurface,
    lineHeight: 20,
  },

  /* ── Inline Sheet (Recent / Saved) ───────────────────────────── */
  inlineSheet: {
    marginTop: 16,
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E8DFD2",
    overflow: "hidden",
  },
  inlineSheetEmpty: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.light.secondary,
    textAlign: "center",
    padding: 24,
    lineHeight: 20,
  },
  inlineRecipeRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E8DFD2",
  },
  inlineRecipeImage: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: Colors.light.surfaceContainerHigh,
  },
  inlineRecipeInfo: {
    flex: 1,
    gap: 2,
  },
  inlineRecipeName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.light.onSurface,
    lineHeight: 22,
  },
  inlineRecipeMeta: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.light.secondary,
    lineHeight: 20,
  },

  /* ── Technique Library ───────────────────────────────────────── */
  techniqueList: {
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E8DFD2",
    overflow: "hidden",
  },
  techniqueRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 14,
    minHeight: 72,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E8DFD2",
  },
  techniqueThumbnailWrap: {
    width: 56,
    height: 56,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
    backgroundColor: Colors.light.surfaceContainerHigh,
  },
  techniqueThumbnail: {
    width: 56,
    height: 56,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  techniqueInfo: {
    flex: 1,
    gap: 2,
  },
  techniqueTitle: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 16,
    color: Colors.light.onSurface,
    lineHeight: 22,
  },
  techniqueSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#8A8279",
    lineHeight: 20,
  },
  techniqueDuration: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: "#8A8279",
    lineHeight: 18,
    flexShrink: 0,
  },
});
