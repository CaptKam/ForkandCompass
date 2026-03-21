import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useMemo, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { COUNTRIES, ONBOARDING_IMAGES, getAllRecipes } from "@/constants/data";
import type { Country, Recipe } from "@/constants/data";
import Colors from "@/constants/colors";

// ─── Search logic ─────────────────────────────────────────────────────────────

type SearchResult =
  | { type: "country"; item: Country }
  | { type: "recipe"; item: Recipe };

const ALL_RECIPES = getAllRecipes();

function searchItems(query: string): SearchResult[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const results: SearchResult[] = [];
  for (const country of COUNTRIES) {
    if (
      country.name.toLowerCase().includes(q) ||
      country.description.toLowerCase().includes(q) ||
      country.region.toLowerCase().includes(q)
    ) {
      results.push({ type: "country", item: country });
    }
  }
  for (const recipe of ALL_RECIPES) {
    if (
      recipe.name.toLowerCase().includes(q) ||
      recipe.description.toLowerCase().includes(q) ||
      recipe.category.toLowerCase().includes(q) ||
      recipe.ingredients.some((ing) => ing.name.toLowerCase().includes(q))
    ) {
      results.push({ type: "recipe", item: recipe });
    }
  }
  return results;
}

// ─── Static editorial data ────────────────────────────────────────────────────

const DIET_FILTERS = ["Vegan", "Gluten-Free", "Dairy-Free", "Keto"];
const RECENT_SEARCHES = ["Summer Truffle Pasta", "Artisanal Sourdough", "Kyoto Matcha Bar"];

const CUISINE_CATEGORIES = [
  { label: "Mediterranean", count: "124 Recipes", desc: "The essence of sun-drenched ingredients and coastal traditions.", image: ONBOARDING_IMAGES.italy, large: true },
  { label: "Pan-Asian", count: "86 Recipes", image: ONBOARDING_IMAGES.japan, large: false },
  { label: "Plant-Based", count: "52 Recipes", image: ONBOARDING_IMAGES.india, large: false },
  { label: "Nordic", count: "38 Recipes", image: ONBOARDING_IMAGES.thailand, large: false },
];

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const results = useMemo(() => searchItems(query), [query]);
  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const haptic = () => { if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); };

  const toggleFilter = (f: string) => {
    haptic();
    setActiveFilters((prev) => prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]);
  };

  const handleRecentSearch = (term: string) => {
    haptic();
    setQuery(term);
    inputRef.current?.focus();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* ── Sticky Top Bar + Search ─────────────────────────────── */}
      <View style={[styles.topBar, { paddingTop: topPadding + 8 }]}>
        {/* Header row */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Pressable onPress={haptic} hitSlop={12}>
              <Ionicons name="menu" size={24} color={Colors.light.primary} />
            </Pressable>
            <Text style={styles.headerTitle}>The Culinary Editorial</Text>
          </View>
          <View style={styles.headerAvatar}>
            <Ionicons name="person" size={14} color={Colors.light.outline} />
          </View>
        </View>

        {/* Search bar */}
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={Colors.light.secondary} style={styles.searchIcon} />
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              placeholder="Search recipes, chefs, or ingredients..."
              placeholderTextColor="rgba(114,90,60,0.6)"
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery("")} hitSlop={8}>
                <Ionicons name="close-circle" size={20} color={Colors.light.outline} />
              </Pressable>
            )}
          </View>
          <Pressable
            onPress={haptic}
            style={styles.filtersButton}
          >
            <Ionicons name="options" size={14} color="#FFFFFF" />
            <Text style={styles.filtersText}>Filters</Text>
          </Pressable>
        </View>

        {/* Diet filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
          {DIET_FILTERS.map((f) => {
            const active = activeFilters.includes(f);
            return (
              <Pressable
                key={f}
                onPress={() => toggleFilter(f)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{f}</Text>
                {active && <Ionicons name="close" size={12} color={Colors.light.onSecondaryContainer} style={{ marginLeft: 2 }} />}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Content ─────────────────────────────────────────────── */}
      {query.length > 0 ? (
        /* Search results */
        <ScrollView
          keyboardDismissMode="on-drag"
          contentContainerStyle={[styles.resultsContent, { paddingBottom: Platform.OS === "web" ? 120 : insets.bottom + 100 }]}
        >
          {results.length === 0 ? (
            <View style={styles.noResults}>
              <Ionicons name="restaurant-outline" size={48} color={Colors.light.outlineVariant} />
              <Text style={styles.noResultsText}>No results for "{query}"</Text>
              <Text style={styles.noResultsSub}>Try a different ingredient or cuisine</Text>
            </View>
          ) : (
            results.map((result) => {
              if (result.type === "country") {
                const country = result.item;
                return (
                  <Pressable
                    key={`country-${country.id}`}
                    style={({ pressed }) => [styles.resultRow, pressed && { opacity: 0.8 }]}
                    onPress={() => { haptic(); router.push(`/country/${country.id}`); }}
                  >
                    <Image source={{ uri: country.image }} style={styles.resultThumb} contentFit="cover" />
                    <View style={styles.resultInfo}>
                      <Text style={styles.resultTitle}>{country.flag} {country.name}</Text>
                      <Text style={styles.resultSub} numberOfLines={1}>{country.tagline}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={Colors.light.outline} />
                  </Pressable>
                );
              }
              const recipe = result.item;
              return (
                <Pressable
                  key={`recipe-${recipe.id}`}
                  style={({ pressed }) => [styles.resultRow, pressed && { opacity: 0.8 }]}
                  onPress={() => { haptic(); router.push(`/recipe/${recipe.id}`); }}
                >
                  <Image source={{ uri: recipe.image }} style={styles.resultThumb} contentFit="cover" />
                  <View style={styles.resultInfo}>
                    <Text style={styles.resultTitle}>{recipe.name}</Text>
                    <Text style={styles.resultSub} numberOfLines={1}>
                      {recipe.countryFlag} {recipe.countryName} · {recipe.category} · {recipe.time}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={Colors.light.outline} />
                </Pressable>
              );
            })
          )}
        </ScrollView>
      ) : (
        /* Editorial home */
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 120 : insets.bottom + 100 }}
        >

          {/* ── Recent Searches ──────────────────────────────────── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Searches</Text>
              <Pressable onPress={haptic}>
                <Text style={styles.clearAll}>Clear All</Text>
              </Pressable>
            </View>
            <View style={styles.recentList}>
              {RECENT_SEARCHES.map((term) => (
                <Pressable
                  key={term}
                  onPress={() => handleRecentSearch(term)}
                  style={({ pressed }) => [styles.recentChip, pressed && { opacity: 0.8 }]}
                >
                  <Ionicons name="time-outline" size={18} color={Colors.light.secondary} />
                  <Text style={styles.recentText}>{term}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* ── Explore Cuisines Bento Grid ──────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.bigTitle}>Explore Cuisines</Text>

            {/* Large: Mediterranean */}
            <Pressable
              style={({ pressed }) => [styles.bentoLarge, pressed && { opacity: 0.92 }]}
              onPress={() => { haptic(); router.push("/country/italy"); }}
            >
              <Image source={{ uri: CUISINE_CATEGORIES[0].image }} style={StyleSheet.absoluteFill} contentFit="cover" />
              <LinearGradient colors={["transparent", "rgba(0,0,0,0.65)"]} start={{ x: 0, y: 0.35 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
              <View style={styles.bentoInfo}>
                <Text style={styles.bentoCount}>{CUISINE_CATEGORIES[0].count}</Text>
                <Text style={styles.bentoLargeLabel}>{CUISINE_CATEGORIES[0].label}</Text>
                <Text style={styles.bentoDesc} numberOfLines={2}>{CUISINE_CATEGORIES[0].desc}</Text>
              </View>
            </Pressable>

            {/* Medium: Pan-Asian */}
            <Pressable
              style={({ pressed }) => [styles.bentoMedium, pressed && { opacity: 0.92 }]}
              onPress={() => { haptic(); router.push("/country/japan"); }}
            >
              <Image source={{ uri: CUISINE_CATEGORIES[1].image }} style={StyleSheet.absoluteFill} contentFit="cover" />
              <LinearGradient colors={["transparent", "rgba(0,0,0,0.6)"]} style={StyleSheet.absoluteFill} />
              <View style={styles.bentoInfo}>
                <Text style={styles.bentoMediumLabel}>{CUISINE_CATEGORIES[1].label}</Text>
                <Text style={styles.bentoCount}>{CUISINE_CATEGORIES[1].count}</Text>
              </View>
            </Pressable>

            {/* Small row: Plant-Based + Nordic */}
            <View style={styles.bentoSmallRow}>
              {[CUISINE_CATEGORIES[2], CUISINE_CATEGORIES[3]].map((cat, idx) => (
                <Pressable
                  key={cat.label}
                  style={({ pressed }) => [styles.bentoSmall, pressed && { opacity: 0.92 }]}
                  onPress={haptic}
                >
                  <Image source={{ uri: cat.image }} style={StyleSheet.absoluteFill} contentFit="cover" />
                  <LinearGradient colors={["transparent", "rgba(0,0,0,0.6)"]} style={StyleSheet.absoluteFill} />
                  <View style={styles.bentoInfo}>
                    <Text style={styles.bentoSmallLabel}>{cat.label}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>

          {/* ── Curated Discovery CTA ────────────────────────────── */}
          <View style={[styles.section, styles.ctaSection]}>
            <View style={styles.ctaCard}>
              <View style={styles.ctaBody}>
                <View style={styles.editorsBadge}>
                  <Text style={styles.editorsBadgeText}>Editor's Pick</Text>
                </View>
                <Text style={styles.ctaHeadline}>
                  Can't decide? Let us curate your culinary journey.
                </Text>
                <Text style={styles.ctaDesc}>
                  Our passport algorithm finds recipes based on your mood, the current season, and your pantry's contents.
                </Text>
                <Pressable
                  style={({ pressed }) => [styles.ctaButton, pressed && { transform: [{ scale: 0.97 }] }]}
                  onPress={haptic}
                >
                  <Text style={styles.ctaButtonText}>Launch Curated Search</Text>
                  <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                </Pressable>
              </View>
              <View style={styles.ctaImageWrap}>
                <Image
                  source={{ uri: ONBOARDING_IMAGES.morocco }}
                  style={styles.ctaImage}
                  contentFit="cover"
                />
              </View>
            </View>
          </View>

        </ScrollView>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
  },

  // Top bar
  topBar: {
    backgroundColor: Colors.light.surface,
    paddingHorizontal: 24,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(222,193,179,0.25)",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  headerTitle: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 20,
    color: Colors.light.primary,
    letterSpacing: -0.3,
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: "rgba(222,193,179,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Search bar
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.light.onSurface,
    padding: 0,
  },
  filtersButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 28,
  },
  filtersText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: "#FFFFFF",
  },

  // Chips
  chipsScroll: {
    gap: 8,
    paddingBottom: 2,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.light.surfaceContainerHigh,
  },
  chipActive: {
    backgroundColor: Colors.light.secondaryContainer,
  },
  chipText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.light.secondary,
  },
  chipTextActive: {
    color: Colors.light.onSecondaryContainer,
  },

  // Section wrapper
  section: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 20,
    color: Colors.light.onSurface,
  },
  clearAll: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: Colors.light.primary,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },

  // Recent searches
  recentList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  recentChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: Colors.light.surfaceContainer,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(222,193,179,0.1)",
  },
  recentText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.light.onSurface,
  },

  // Bento grid
  bigTitle: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 28,
    color: Colors.light.onSurface,
    marginBottom: 20,
  },
  bentoLarge: {
    width: "100%",
    height: 240,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: Colors.light.surfaceContainerHigh,
    marginBottom: 12,
  },
  bentoMedium: {
    width: "100%",
    height: 160,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: Colors.light.surfaceContainerHigh,
    marginBottom: 12,
  },
  bentoSmallRow: {
    flexDirection: "row",
    gap: 12,
  },
  bentoSmall: {
    flex: 1,
    height: 152,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: Colors.light.surfaceContainerHigh,
  },
  bentoInfo: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  bentoCount: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: "rgba(255,255,255,0.8)",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  bentoLargeLabel: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 30,
    color: "#FFFFFF",
    lineHeight: 34,
    marginBottom: 6,
  },
  bentoMediumLabel: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 22,
    color: "#FFFFFF",
    marginBottom: 2,
  },
  bentoSmallLabel: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 18,
    color: "#FFFFFF",
  },
  bentoDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    lineHeight: 17,
    maxWidth: 220,
  },

  // Curated CTA
  ctaSection: {
    paddingBottom: 24,
  },
  ctaCard: {
    backgroundColor: Colors.light.surfaceContainerHigh,
    borderRadius: 32,
    padding: 28,
    borderWidth: 1,
    borderColor: "rgba(222,193,179,0.1)",
    gap: 24,
  },
  ctaBody: {
    gap: 14,
  },
  editorsBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(154,65,0,0.1)",
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
  },
  editorsBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: Colors.light.primary,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  ctaHeadline: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 24,
    color: Colors.light.onSurface,
    lineHeight: 32,
  },
  ctaDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.light.secondary,
    lineHeight: 21,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    alignSelf: "flex-start",
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
    marginTop: 4,
  },
  ctaButtonText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: "#FFFFFF",
  },
  ctaImageWrap: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: Colors.light.surfaceContainerHigh,
  },
  ctaImage: {
    width: "100%",
    height: "100%",
  },

  // Search results
  resultsContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.surfaceContainer,
    borderRadius: 12,
    padding: 10,
    gap: 12,
  },
  resultThumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: Colors.light.surfaceContainerHigh,
  },
  resultInfo: {
    flex: 1,
    gap: 2,
  },
  resultTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.light.onSurface,
  },
  resultSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.light.onSurfaceVariant,
  },

  // No results
  noResults: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    gap: 8,
  },
  noResultsText: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: Colors.light.onSurfaceVariant,
    marginTop: 8,
  },
  noResultsSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.light.outline,
  },
});
