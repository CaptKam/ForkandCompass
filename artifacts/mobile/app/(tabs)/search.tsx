import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { COUNTRIES, getAllRecipes } from "@/constants/data";
import type { Country, Recipe } from "@/constants/data";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useScaledStyles } from "@/hooks/useScaledStyles";

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

function keyExtractor(item: SearchResult) {
  return `${item.type}-${item.item.id}`;
}

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const type = useScaledStyles();
  const [query, setQuery] = useState("");

  const results = useMemo(() => searchItems(query), [query]);

  const renderItem = ({ item }: { item: SearchResult }) => {
    if (item.type === "country") {
      const country = item.item;
      return (
        <Pressable
          style={[styles.resultRow, { backgroundColor: colors.surfaceContainer }]}
          accessibilityRole="button"
          accessibilityLabel={`${country.name} cuisine`}
          onPress={() => router.push(`/country/${country.id}`)}
        >
          <Image
            source={{ uri: country.image }}
            style={styles.resultImage}
            contentFit="cover"
          />
          <View style={styles.resultInfo}>
            <Text style={[type.titleSmall, { color: colors.onSurface }]}>
              {country.flag} {country.name}
            </Text>
            <Text
              style={[type.bodySmall, { color: colors.onSurfaceVariant }]}
              numberOfLines={1}
            >
              {country.tagline}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.outline} />
        </Pressable>
      );
    }

    const recipe = item.item;
    return (
      <Pressable
        style={[styles.resultRow, { backgroundColor: colors.surfaceContainer }]}
        accessibilityRole="button"
        accessibilityLabel={`${recipe.name} from ${recipe.countryName}`}
        onPress={() => router.push(`/recipe/${recipe.id}`)}
      >
        <Image
          source={{ uri: recipe.image }}
          style={styles.resultImage}
          contentFit="cover"
        />
        <View style={styles.resultInfo}>
          <Text style={[type.titleSmall, { color: colors.onSurface }]}>
            {recipe.name}
          </Text>
          <Text
            style={[type.bodySmall, { color: colors.onSurfaceVariant }]}
            numberOfLines={1}
          >
            {recipe.countryFlag} {recipe.countryName} · {recipe.category} · {recipe.time}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.outline} />
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View
        style={[
          styles.searchBarContainer,
          {
            paddingTop: Platform.OS === "web" ? 67 + 12 : insets.top + 12,
            backgroundColor: colors.surface,
          },
        ]}
      >
        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.surfaceContainerHigh },
          ]}
        >
          <Ionicons
            name="search"
            size={20}
            color={colors.onSurfaceVariant}
            style={styles.searchIcon}
          />
          <TextInput
            style={[type.bodyLarge, styles.searchInput, { color: colors.onSurface }]}
            placeholder="Search recipes and cuisines"
            placeholderTextColor={colors.outline}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            accessibilityLabel="Search recipes and cuisines"
          />
          {query.length > 0 && (
            <Pressable
              onPress={() => setQuery("")}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <Ionicons name="close-circle" size={20} color={colors.outline} />
            </Pressable>
          )}
        </View>
      </View>

      {query.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons
            name="search-outline"
            size={64}
            color={colors.outlineVariant}
          />
          <Text style={[type.bodyLarge, { color: colors.onSurfaceVariant, marginTop: 16 }]}>
            Search recipes and cuisines
          </Text>
          <Text style={[type.bodyMedium, { color: colors.outline, marginTop: 4 }]}>
            Find dishes by name, ingredient, or country
          </Text>
        </View>
      ) : results.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons
            name="restaurant-outline"
            size={48}
            color={colors.outlineVariant}
          />
          <Text style={[type.bodyLarge, { color: colors.onSurfaceVariant, marginTop: 16 }]}>
            No results for "{query}"
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          keyboardDismissMode="on-drag"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBarContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 80,
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 10,
    gap: 12,
  },
  resultImage: {
    width: 52,
    height: 52,
    borderRadius: 10,
  },
  resultInfo: {
    flex: 1,
    gap: 2,
  },
});
