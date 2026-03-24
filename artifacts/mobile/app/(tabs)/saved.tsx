import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import TabHeader from "@/components/TabHeader";

import Colors from "@/constants/colors";
import { useApp } from "@/contexts/AppContext";
import { COUNTRIES, getAllRecipes, type Country, type Recipe } from "@/constants/data";

export default function SavedScreen() {
  const { savedRecipeIds, savedCountryIds, toggleSaved } = useApp();

  const savedRecipes = getAllRecipes().filter((r) => savedRecipeIds.includes(r.id));
  const savedCountries = COUNTRIES.filter((c) => savedCountryIds.includes(c.id));

  const hasSavedContent = savedCountries.length > 0 || savedRecipes.length > 0;

  return (
    <View style={styles.container}>
      <TabHeader title="Saved" />

      {!hasSavedContent ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="bookmark-outline" size={48} color={Colors.light.outlineVariant} />
          </View>
          <Text style={styles.emptyTitle}>Nothing saved yet</Text>
          <Text style={styles.emptySubtitle}>
            Tap the bookmark icon on any recipe or the heart on any country to save it here.
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Countries Section */}
          {savedCountries.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Countries ({savedCountries.length})</Text>
                <Ionicons name="chevron-forward" size={18} color="rgba(114,90,60,0.4)" />
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalScroll}
              >
                {savedCountries.map((country) => (
                  <CountryChip key={country.id} country={country} />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Recipes Section */}
          {savedRecipes.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recipes ({savedRecipes.length})</Text>
                <Text style={styles.sortLabel}>Sort By Date</Text>
              </View>
              {savedRecipes.map((recipe) => (
                <RecipeRow
                  key={recipe.id}
                  recipe={recipe}
                  onRemove={() => {
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    toggleSaved(recipe.id);
                  }}
                />
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function CountryChip({ country }: { country: Country }) {
  return (
    <Pressable
      onPress={() => {
        if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({ pathname: "/country/[id]", params: { id: country.id } });
      }}
      style={styles.countryChip}
    >
      <View style={styles.countryChipImage}>
        <Image
          source={{ uri: country.image }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
          transition={300}
        />
      </View>
      <Text style={styles.countryChipLabel}>
        {country.name} {country.flag}
      </Text>
    </Pressable>
  );
}

function RecipeRow({ recipe, onRemove }: { recipe: Recipe; onRemove: () => void }) {
  return (
    <Pressable
      onPress={() => {
        if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({ pathname: "/recipe/[id]", params: { id: recipe.id } });
      }}
      style={({ pressed }) => [
        styles.recipeRow,
        pressed && { backgroundColor: Colors.light.surfaceContainerHigh },
      ]}
    >
      <View style={styles.recipeImage}>
        <Image
          source={{ uri: recipe.image }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
          transition={300}
        />
      </View>
      <View style={styles.recipeInfo}>
        <Text style={styles.recipeName} numberOfLines={1}>{recipe.name}</Text>
        <Text style={styles.recipeCuisine}>{recipe.category}</Text>
      </View>
      <Pressable onPress={onRemove} hitSlop={8}>
        <Ionicons name="bookmark" size={20} color={Colors.light.primary} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
  },
  // Empty state
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 48,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.light.surfaceContainerLow,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 20,
    color: Colors.light.onSurface,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 17,
    color: Colors.light.secondary,
    textAlign: "center",
    lineHeight: 26,
  },
  // Sections
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 18,
    color: Colors.light.onSurface,
  },
  sortLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.light.primary,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    lineHeight: 20,
  },
  // Country chips
  horizontalScroll: {
    paddingHorizontal: 24,
    gap: 20,
  },
  countryChip: {
    alignItems: "center",
    gap: 10,
  },
  countryChipImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: Colors.light.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: "rgba(222,193,179,0.1)",
  },
  countryChipLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.light.secondary,
    letterSpacing: 1,
    textTransform: "uppercase",
    lineHeight: 18,
  },
  // Recipe rows
  recipeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: Colors.light.surfaceContainerLow,
    marginHorizontal: 24,
    marginBottom: 8,
    borderRadius: 14,
  },
  recipeImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: Colors.light.surfaceContainerHigh,
  },
  recipeInfo: {
    flex: 1,
    justifyContent: "center",
  },
  recipeName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.light.onSurface,
    marginBottom: 4,
  },
  recipeCuisine: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.light.secondary,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    lineHeight: 18,
  },
});
