import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { RECIPE_REGION_MAP, type Recipe } from "@/constants/data";
import { useCountry } from "@/hooks/useCountry";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import RecipeContextMenu from "@/components/RecipeContextMenu";

type FilterCategory = "All" | "Mains" | "Appetizers" | "Desserts" | "Sides" | "Drinks";

const FILTER_CATEGORIES: FilterCategory[] = ["All", "Mains", "Appetizers", "Desserts", "Sides", "Drinks"];

/** Map recipe.category to a filter bucket */
function toFilterCategory(category: string): FilterCategory {
  const lower = category.toLowerCase();
  if (lower.includes("main") || lower.includes("entrée") || lower.includes("entree")) return "Mains";
  if (lower.includes("appetizer") || lower.includes("starter") || lower.includes("soup") || lower.includes("salad")) return "Appetizers";
  if (lower.includes("dessert") || lower.includes("sweet") || lower.includes("pastry") || lower.includes("cake")) return "Desserts";
  if (lower.includes("side") || lower.includes("condiment") || lower.includes("sauce") || lower.includes("chutney")) return "Sides";
  if (lower.includes("drink") || lower.includes("beverage") || lower.includes("cocktail") || lower.includes("tea") || lower.includes("sherbet")) return "Drinks";
  return "Mains"; // default
}

export default function CountryRecipesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { country } = useCountry(id ?? "");
  const reducedMotion = useReducedMotion();
  const [activeFilter, setActiveFilter] = useState<FilterCategory>("All");

  const recipes = useMemo(() => {
    if (!country) return [];
    if (activeFilter === "All") return country.recipes;
    return country.recipes.filter((r) => toFilterCategory(r.category) === activeFilter);
  }, [country, activeFilter]);

  if (!country) {
    return (
      <View style={[styles.container, { alignItems: "center", justifyContent: "center" }]}>
        <Ionicons name="earth-outline" size={48} color={Colors.light.outlineVariant} />
        <Text style={styles.emptyText}>Country not found</Text>
      </View>
    );
  }

  const renderRecipeRow = ({ item }: { item: Recipe }) => {
    const region = RECIPE_REGION_MAP[item.id] || item.region;
    const subtitle = [region, item.time, item.difficulty].filter(Boolean).join(" · ");

    return (
      <RecipeContextMenu recipe={item} style={styles.recipeRow}>
        <Pressable
          style={({ pressed }) => [styles.recipeRowInner, pressed && { opacity: 0.85 }]}
          onPress={() => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push({ pathname: "/recipe/[id]", params: { id: item.id } });
          }}
          accessibilityRole="button"
          accessibilityLabel={`${item.name}, ${subtitle}`}
        >
          <Image
            source={{ uri: item.image }}
            style={styles.recipeRowImage}
            contentFit="cover"
            transition={reducedMotion ? 0 : 200}
          />
          <View style={styles.recipeRowText}>
            <Text style={styles.recipeRowName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.recipeRowSubtitle} numberOfLines={1}>{subtitle}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.light.outlineVariant} />
        </Pressable>
      </RecipeContextMenu>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Platform.OS === "web" ? 67 : insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.headerBackButton}>
          <Ionicons name="chevron-back" size={22} color={Colors.light.primary} />
          <Text style={styles.headerBackText}>{country.name}</Text>
        </Pressable>
      </View>

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {FILTER_CATEGORIES.map((cat) => {
          const isActive = cat === activeFilter;
          return (
            <Pressable
              key={cat}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.selectionAsync();
                setActiveFilter(cat);
              }}
            >
              <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>{cat}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Recipe count */}
      <Text style={styles.recipeCount}>{recipes.length} recipes</Text>

      {/* Recipe list */}
      <FlatList
        data={recipes}
        keyExtractor={(item) => item.id}
        renderItem={renderRecipeRow}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
  },
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.outlineVariant,
  },
  headerBackButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 48,
    minWidth: 48,
  },
  headerBackText: {
    fontFamily: "Inter_500Medium",
    fontSize: 17,
    color: Colors.light.primary,
  },
  // Filter
  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.light.outlineVariant,
  },
  filterChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  filterChipText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.light.onSurface,
  },
  filterChipTextActive: {
    color: Colors.light.onPrimary,
  },
  // Recipe count
  recipeCount: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.light.secondary,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  // Recipe row
  recipeRow: {
    paddingHorizontal: 16,
  },
  recipeRowInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 10,
    minHeight: 80,
  },
  recipeRowImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: Colors.light.surfaceContainerHigh,
  },
  recipeRowText: {
    flex: 1,
    gap: 4,
  },
  recipeRowName: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 17,
    color: Colors.light.onSurface,
  },
  recipeRowSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#8A8279",
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.light.outlineVariant,
    marginLeft: 94, // 16 + 64 + 14 = past the image
  },
  emptyText: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 20,
    color: Colors.light.onSurface,
    marginTop: 16,
  },
});
