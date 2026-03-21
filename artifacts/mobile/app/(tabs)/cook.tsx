import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { COUNTRIES } from "@/constants/data";
import { useReducedMotion } from "@/hooks/useReducedMotion";

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
      byDifficulty[key].push({ recipe, country });
    }
  }
  return byDifficulty;
}

export default function CookScreen() {
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const grouped = getAllRecipesGrouped();

  const haptic = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const featuredRecipe = COUNTRIES[0]?.recipes[0];
  const featuredCountry = COUNTRIES[0];

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 120 : insets.bottom + 120 }}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: Platform.OS === "web" ? 60 : insets.top + 16 }]}>
          <View>
            <Text style={styles.headerEyebrow}>Tonight's Menu</Text>
            <Text style={styles.headerTitle}>What will you cook?</Text>
          </View>
          <Pressable onPress={haptic} style={styles.headerAction}>
            <Ionicons name="options-outline" size={22} color={Colors.light.primary} />
          </Pressable>
        </View>

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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  headerEyebrow: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.light.primary,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  headerTitle: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 28,
    color: Colors.light.onSurface,
    letterSpacing: -0.5,
  },
  headerAction: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: 20,
  },
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
    fontSize: 11,
    color: "#FFFFFF",
    letterSpacing: 0.5,
    textTransform: "uppercase",
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
    gap: 6,
  },
  featuredMetaText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
  },
  featuredDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
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
    fontSize: 12,
    color: Colors.light.secondary,
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
    gap: 4,
  },
  recipeName: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 15,
    color: Colors.light.onSurface,
    lineHeight: 21,
  },
  recipeTime: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.light.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
