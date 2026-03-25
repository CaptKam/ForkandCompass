import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useRef, useState } from "react";
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

import { COUNTRIES, getAllRecipes, LANDMARK_IMAGES } from "@/constants/data";
import Colors from "@/constants/colors";
import { useSearch } from "@/hooks/useSearch";

// ─── Static editorial data ────────────────────────────────────────────────────

const RECENT_SEARCHES = ["Truffle Pasta", "Miso Glazed", "Tagine", "Mole Negro", "Shakshuka"];

const FEATURED_COUNTRIES = COUNTRIES.slice(0, 6);

const TOP_CUISINES = [
  { label: "Italian", flag: "🇮🇹", id: "italy" },
  { label: "Japanese", flag: "🇯🇵", id: "japan" },
  { label: "Moroccan", flag: "🇲🇦", id: "morocco" },
  { label: "Mexican", flag: "🇲🇽", id: "mexico" },
  { label: "Indian", flag: "🇮🇳", id: "india" },
  { label: "Thai", flag: "🇹🇭", id: "thailand" },
  { label: "Spanish", flag: "🇪🇸", id: "spain" },
  { label: "French", flag: "🇫🇷", id: "france" },
];

const MOOD_CHIPS = [
  { label: "Quick Meals", emoji: "⚡" },
  { label: "Weekend Projects", emoji: "🧑‍🍳" },
  { label: "Vegetarian", emoji: "🥗" },
  { label: "Street Food", emoji: "🛵" },
  { label: "Desserts", emoji: "🍮" },
  { label: "One-Pot", emoji: "🫕" },
];

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState(RECENT_SEARCHES);

  const { results } = useSearch(query);

  const haptic = () => { if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); };

  const handleRecentSearch = (term: string) => {
    haptic();
    setQuery(term);
  };

  const clearRecents = () => {
    haptic();
    setRecentSearches([]);
  };

  const handleSubmitSearch = (term: string) => {
    if (!term.trim()) return;
    if (!recentSearches.includes(term)) {
      setRecentSearches((prev) => [term, ...prev].slice(0, 8));
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* ── Search bar (no header — flush to safe area) ───────────────── */}
      <View style={[styles.searchBarWrap, { paddingTop: insets.top + 10 }]}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.light.secondary} style={styles.searchIcon} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Recipes, countries, ingredients…"
            placeholderTextColor="rgba(114,90,60,0.55)"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={() => handleSubmitSearch(query)}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")} style={{ minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="close-circle" size={20} color={Colors.light.outline} />
            </Pressable>
          )}
        </View>
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
                    <Image source={{ uri: LANDMARK_IMAGES[country.id] || country.image }} style={styles.resultThumb} contentFit="cover" />
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
        /* Idle home */
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 120 : insets.bottom + 100 }}
        >

          {/* ── Recent Searches ──────────────────────────────────── */}
          {recentSearches.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent searches</Text>
                <Pressable onPress={clearRecents} style={{ minHeight: 44, paddingVertical: 10, justifyContent: "center" }}>
                  <Text style={styles.clearAll}>Clear all</Text>
                </Pressable>
              </View>
              <View style={styles.recentWrap}>
                {recentSearches.map((term) => (
                  <Pressable
                    key={term}
                    onPress={() => handleRecentSearch(term)}
                    style={({ pressed }) => [styles.recentChip, pressed && { opacity: 0.75 }]}
                  >
                    <Ionicons name="time-outline" size={14} color={Colors.light.secondary} />
                    <Text style={styles.recentText}>{term}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* ── Featured Countries ────────────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Explore countries</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.countryScroll}
              style={{ marginTop: 16 }}
            >
              {FEATURED_COUNTRIES.map((country) => (
                <Pressable
                  key={country.id}
                  onPress={() => { haptic(); router.push(`/country/${country.id}`); }}
                  style={styles.countryChip}
                >
                  <View style={styles.countryThumb}>
                    <Image source={{ uri: LANDMARK_IMAGES[country.id] || country.image }} style={{ width: "100%", height: "100%" }} contentFit="cover" transition={300} />
                    <LinearGradient
                      colors={["transparent", "rgba(0,0,0,0.45)"]}
                      style={StyleSheet.absoluteFill}
                    />
                    <Text style={styles.countryFlag}>{country.flag}</Text>
                  </View>
                  <Text style={styles.countryLabel} numberOfLines={1}>{country.name}</Text>
                  <Text style={styles.countryCount}>{country.recipes.length} recipes</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* ── Explore by Mood ───────────────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Explore by mood</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.moodScroll}
              style={{ marginTop: 14 }}
            >
              {MOOD_CHIPS.map((mood) => (
                <Pressable
                  key={mood.label}
                  onPress={haptic}
                  style={({ pressed }) => [styles.moodChip, pressed && { opacity: 0.8 }]}
                >
                  <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                  <Text style={styles.moodLabel}>{mood.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* ── Top Cuisines ──────────────────────────────────────── */}
          <View style={[styles.section, { paddingBottom: 0 }]}>
            <Text style={styles.sectionTitle}>Top cuisines</Text>
            <View style={styles.cuisineList}>
              {TOP_CUISINES.map((cuisine, index) => (
                <Pressable
                  key={cuisine.id}
                  onPress={() => { haptic(); router.push(`/country/${cuisine.id}`); }}
                  style={({ pressed }) => [
                    styles.cuisineRow,
                    index < TOP_CUISINES.length - 1 && styles.cuisineRowBorder,
                    pressed && { backgroundColor: Colors.light.surfaceContainerLow },
                  ]}
                >
                  <Text style={styles.cuisineFlag}>{cuisine.flag}</Text>
                  <Text style={styles.cuisineLabel}>{cuisine.label}</Text>
                  <Ionicons name="chevron-forward" size={16} color={Colors.light.outlineVariant} />
                </Pressable>
              ))}
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

  // Search bar (replaces TabHeader + topBar)
  searchBarWrap: {
    backgroundColor: Colors.light.surface,
    paddingHorizontal: 24,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(222,193,179,0.3)",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingVertical: 13,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 17,
    color: Colors.light.onSurface,
    padding: 0,
    lineHeight: 26,
  },

  // Section
  section: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 18,
    color: Colors.light.onSurface,
  },
  clearAll: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: Colors.light.primary,
    lineHeight: 22,
  },

  // Recent searches
  recentWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },
  recentChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: Colors.light.surfaceContainerHigh,
    borderRadius: 20,
  },
  recentText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.light.onSurface,
    lineHeight: 20,
  },

  // Featured countries horizontal scroll
  countryScroll: {
    gap: 14,
    paddingBottom: 4,
  },
  countryChip: {
    alignItems: "center",
    gap: 8,
    width: 84,
  },
  countryThumb: {
    width: 84,
    height: 84,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: Colors.light.surfaceContainerHigh,
    justifyContent: "flex-end",
    alignItems: "flex-start",
  },
  countryFlag: {
    fontSize: 18,
    margin: 6,
  },
  countryLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.light.onSurface,
    textAlign: "center",
    lineHeight: 22,
  },
  countryCount: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.light.secondary,
    textAlign: "center",
    lineHeight: 20,
  },

  // Mood chips
  moodScroll: {
    gap: 10,
    paddingBottom: 4,
  },
  moodChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    minHeight: 48,
    backgroundColor: Colors.light.surfaceContainerHigh,
    borderRadius: 24,
  },
  moodEmoji: {
    fontSize: 16,
  },
  moodLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.light.onSurface,
    lineHeight: 20,
  },

  // Top cuisines vertical list
  cuisineList: {
    marginTop: 16,
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(222,193,179,0.3)",
    overflow: "hidden",
  },
  cuisineRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 14,
  },
  cuisineRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(222,193,179,0.3)",
  },
  cuisineFlag: {
    fontSize: 28,
    lineHeight: 34,
    width: 38,
    textAlign: "center",
  },
  cuisineLabel: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 17,
    color: Colors.light.onSurface,
  },

  // Search results
  resultsContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 12,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.surfaceContainer,
    borderRadius: 12,
    padding: 14,
    gap: 14,
    minHeight: 56,
  },
  resultThumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: Colors.light.surfaceContainerHigh,
  },
  resultInfo: {
    flex: 1,
    gap: 8,
  },
  resultTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    color: Colors.light.onSurface,
  },
  resultSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: Colors.light.onSurfaceVariant,
    lineHeight: 22,
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
    fontSize: 14,
    color: Colors.light.outline,
    lineHeight: 20,
  },
});
