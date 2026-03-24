import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { COUNTRIES, resolveImageUrl } from "@/constants/data";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useNinjaRecipes } from "@/hooks/useNinjaRecipes";
import TabHeader from "@/components/TabHeader";

const DIFFICULTY_ORDER = ["Easy", "Medium", "Hard"];

function getAllRecipesGrouped() {
  const byDifficulty: Record<string, { recipe: (typeof COUNTRIES)[0]["recipes"][0]; country: (typeof COUNTRIES)[0] }[]> = {
    Easy: [],
    Medium: [],
    Hard: [],
  };
  for (const country of COUNTRIES) {
    for (const recipe of country.recipes) {
      const key = recipe.difficulty ?? "Easy";
      if (!byDifficulty[key]) byDifficulty[key] = [];
      byDifficulty[key].push({ recipe: { ...recipe, image: resolveImageUrl(recipe.image) }, country });
    }
  }
  return byDifficulty;
}

export default function CookScreen() {
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const grouped = getAllRecipesGrouped();
  const [query, setQuery] = useState("");
  const { results, isLoading, error } = useNinjaRecipes(query);

  const haptic = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const featuredRecipe = COUNTRIES[0]?.recipes[0];
  const featuredCountry = COUNTRIES[0];
  const isSearching = query.trim().length > 0;

  return (
    <View style={styles.container}>
      <TabHeader title="Cook" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 120 : insets.bottom + 120 }}
        keyboardShouldPersistTaps="handled"
      >

        {/* Search bar */}
        <View style={styles.searchWrap}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color={Colors.light.secondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search any dish worldwide…"
              placeholderTextColor={Colors.light.secondary}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {query.length > 0 && (
              <Pressable onPress={() => { haptic(); setQuery(""); }} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={Colors.light.outlineVariant} />
              </Pressable>
            )}
          </View>
        </View>

        {/* ── Search results ────────────────────────────────────────── */}
        {isSearching && (
          <View style={styles.searchResults}>
            {isLoading && (
              <View style={styles.centeredState}>
                <ActivityIndicator color={Colors.light.primary} />
                <Text style={styles.stateText}>Finding recipes…</Text>
              </View>
            )}
            {!isLoading && error && (
              <View style={styles.centeredState}>
                <Ionicons name="alert-circle-outline" size={32} color={Colors.light.outlineVariant} />
                <Text style={styles.stateText}>{error}</Text>
              </View>
            )}
            {!isLoading && !error && results.length === 0 && (
              <View style={styles.centeredState}>
                <Ionicons name="restaurant-outline" size={32} color={Colors.light.outlineVariant} />
                <Text style={styles.stateText}>No recipes found for "{query}"</Text>
              </View>
            )}
            {!isLoading && results.map((recipe, idx) => (
              <View key={idx} style={[styles.ninjaCard, idx < results.length - 1 && styles.ninjaCardBorder]}>
                {/* Title + difficulty badge */}
                <View style={styles.ninjaCardHeader}>
                  <Text style={styles.ninjaTitle}>{recipe.title}</Text>
                  <View style={styles.ninjaBadgeRow}>
                    {recipe.difficulty ? (
                      <View style={[styles.servingsBadge, { backgroundColor: "rgba(154,65,0,0.1)" }]}>
                        <Text style={[styles.servingsBadgeText, { color: Colors.light.primary }]}>{recipe.difficulty}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>

                {/* Meta: cuisine · servings · time · calories */}
                <View style={styles.ninjaMetaRow}>
                  {recipe.cuisine ? <Text style={styles.ninjaMeta}>{recipe.cuisine}</Text> : null}
                  {recipe.servings && recipe.servings !== "–" ? <Text style={styles.ninjaMeta}>{recipe.servings}</Text> : null}
                  {recipe.active_time ? <Text style={styles.ninjaMeta}>⏱ {recipe.active_time}</Text> : null}
                  {recipe.total_time ? <Text style={styles.ninjaMeta}>Total {recipe.total_time}</Text> : null}
                  {recipe.calories ? <Text style={styles.ninjaMeta}>{Math.round(recipe.calories)} cal</Text> : null}
                </View>

                {/* Description */}
                {recipe.description ? (
                  <Text style={styles.ninjaInstructions} numberOfLines={2}>{recipe.description}</Text>
                ) : null}

                {/* Dietary flags */}
                {recipe.dietary_flags && recipe.dietary_flags.length > 0 ? (
                  <View style={styles.ninjaFlagRow}>
                    {recipe.dietary_flags.slice(0, 5).map((flag) => (
                      <View key={flag} style={styles.ninjaFlag}>
                        <Text style={styles.ninjaFlagText}>{flag}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        )}

        {/* ── Local recipe browser (shown when not searching) ────── */}
        {!isSearching && (
          <>
            {/* Featured Hero Recipe */}
            {featuredRecipe && (
              <Pressable
                style={({ pressed }) => [styles.featuredCard, pressed && { opacity: 0.92 }]}
                onPress={() => {
                  haptic();
                  router.push({ pathname: "/recipe/[id]", params: { id: featuredRecipe.id } });
                }}
              >
                <Image
                  source={{ uri: featuredRecipe.image }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  transition={reducedMotion ? 0 : 400}
                />
                <LinearGradient
                  colors={["transparent", "rgba(0,0,0,0.72)"]}
                  locations={[0.4, 1]}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.featuredBadge}>
                  <Text style={styles.featuredBadgeText}>Chef's Pick</Text>
                </View>
                <View style={styles.featuredContent}>
                  <Text style={styles.featuredFlag}>{featuredCountry.flag}</Text>
                  <Text style={styles.featuredName}>{featuredRecipe.name}</Text>
                  <View style={styles.featuredMeta}>
                    <Ionicons name="time-outline" size={13} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.featuredMetaText}>{featuredRecipe.time}</Text>
                    <View style={styles.featuredDot} />
                    <Text style={styles.featuredMetaText}>{featuredRecipe.difficulty}</Text>
                  </View>
                </View>
              </Pressable>
            )}

            {/* Recipes by difficulty */}
            {DIFFICULTY_ORDER.map((diff) => {
              const entries = grouped[diff] ?? [];
              if (entries.length === 0) return null;
              return (
                <View key={diff} style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{diff}</Text>
                    <Text style={styles.sectionCount}>{entries.length} recipes</Text>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.recipeRow}
                    snapToInterval={180 + 16}
                    decelerationRate="fast"
                  >
                    {entries.map(({ recipe, country }) => (
                      <Pressable
                        key={`${country.id}-${recipe.id}`}
                        style={({ pressed }) => [styles.recipeCard, pressed && { opacity: 0.88 }]}
                        onPress={() => {
                          haptic();
                          router.push({ pathname: "/recipe/[id]", params: { id: recipe.id } });
                        }}
                      >
                        <View style={styles.recipeImageWrap}>
                          <Image
                            source={{ uri: recipe.image }}
                            style={StyleSheet.absoluteFill}
                            contentFit="cover"
                            transition={reducedMotion ? 0 : 300}
                          />
                          <View style={styles.recipeFlag}>
                            <Text style={styles.recipeFlagText}>{country.flag}</Text>
                          </View>
                        </View>
                        <View style={styles.recipeMeta}>
                          <Text style={styles.recipeName} numberOfLines={2}>{recipe.name}</Text>
                          <Text style={styles.recipeTime}>{recipe.time}</Text>
                        </View>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
  },
  /* Search */
  searchWrap: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  searchIcon: {
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 17,
    color: Colors.light.onSurface,
    padding: 0,
    lineHeight: 26,
  },

  /* Ninja results */
  searchResults: {
    paddingHorizontal: 24,
  },
  centeredState: {
    alignItems: "center",
    paddingTop: 48,
    gap: 12,
  },
  stateText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.light.secondary,
    textAlign: "center",
  },
  ninjaCard: {
    paddingVertical: 20,
    gap: 10,
  },
  ninjaCardBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(222,193,179,0.3)",
  },
  ninjaCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  ninjaTitle: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 18,
    color: Colors.light.onSurface,
    flex: 1,
    lineHeight: 24,
  },
  servingsBadge: {
    backgroundColor: Colors.light.surfaceContainerLow,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    flexShrink: 0,
  },
  servingsBadgeText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.light.secondary,
    lineHeight: 18,
  },
  ninjaIngredients: {
    gap: 8,
  },
  ninjaIngredientsLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.light.primary,
    textTransform: "uppercase",
    letterSpacing: 1,
    lineHeight: 18,
  },
  ninjaIngredientsList: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.light.secondary,
    lineHeight: 19,
  },
  ninjaInstructions: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.light.onSurfaceVariant,
    lineHeight: 20,
  },
  ninjaBadgeRow: {
    flexDirection: "row",
    gap: 8,
    flexShrink: 0,
  },
  ninjaMetaRow: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  ninjaMeta: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.light.secondary,
    lineHeight: 20,
  },
  ninjaFlagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  ninjaFlag: {
    backgroundColor: "rgba(154,65,0,0.07)",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  ninjaFlagText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.light.primary,
    lineHeight: 18,
  },

  /* Featured */
  featuredCard: {
    marginHorizontal: 24,
    borderRadius: 20,
    overflow: "hidden",
    height: 260,
    backgroundColor: Colors.light.surfaceContainerHigh,
    marginBottom: 36,
    position: "relative",
  },
  featuredBadge: {
    position: "absolute",
    top: 16,
    left: 16,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  featuredBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: "#FFFFFF",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    lineHeight: 18,
  },
  featuredContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  featuredFlag: {
    fontSize: 20,
    marginBottom: 6,
  },
  featuredName: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 24,
    color: "#FFFFFF",
    lineHeight: 30,
    marginBottom: 8,
  },
  featuredMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  featuredMetaText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 20,
  },
  featuredDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "rgba(255,255,255,0.4)",
  },

  /* Sections */
  section: {
    marginBottom: 36,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: "NotoSerif_600SemiBold",
    fontStyle: "italic",
    fontSize: 20,
    color: Colors.light.onSurface,
  },
  sectionCount: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.light.secondary,
    lineHeight: 20,
  },
  recipeRow: {
    paddingHorizontal: 24,
    gap: 16,
  },
  recipeCard: {
    width: 180,
  },
  recipeImageWrap: {
    width: 180,
    height: 180,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: Colors.light.surfaceContainerHigh,
    position: "relative",
  },
  recipeFlag: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  recipeFlagText: {
    fontSize: 14,
  },
  recipeMeta: {
    marginTop: 12,
    gap: 8,
  },
  recipeName: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 16,
    color: Colors.light.onSurface,
    lineHeight: 21,
  },
  recipeTime: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.light.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    lineHeight: 20,
  },
});
