import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
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
import {
  getCountryLocations,
  getFeaturedRecipes,
  LANDMARK_IMAGES,
  type CountryLocation,
  type Recipe,
} from "@/constants/data";
import { useCountry } from "@/hooks/useCountry";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useApp } from "@/contexts/AppContext";
import RecipeContextMenu from "@/components/RecipeContextMenu";

export default function CountryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { country } = useCountry(id ?? "");
  const { isCountrySaved, toggleSavedCountry } = useApp();
  const reducedMotion = useReducedMotion();

  if (!country) {
    return (
      <View style={[styles.container, { alignItems: "center", justifyContent: "center", paddingHorizontal: 48 }]}>
        <Ionicons name="earth-outline" size={48} color={Colors.light.outlineVariant} />
        <Text style={{ fontFamily: "NotoSerif_600SemiBold", fontSize: 20, color: Colors.light.onSurface, marginTop: 16, marginBottom: 8 }}>Country not found</Text>
        <Pressable onPress={() => router.back()} style={{ backgroundColor: Colors.light.primary, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 20, marginTop: 16 }}>
          <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 16, color: "#FFFFFF" }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const saved = isCountrySaved(country.id);
  const locations = getCountryLocations(country);
  const featuredRecipes = getFeaturedRecipes(country);
  const totalRecipes = country.recipes.length;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Fixed header */}
      <View style={[styles.fixedHeader, { paddingTop: Platform.OS === "web" ? 67 : insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="chevron-back" size={22} color={Colors.light.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Fork & Compass</Text>
        <Pressable
          onPress={() => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            toggleSavedCountry(country.id);
          }}
          style={styles.headerButton}
        >
          <Ionicons
            name={saved ? "bookmark" : "bookmark-outline"}
            size={22}
            color={Colors.light.primary}
          />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 120 : insets.bottom + 100 }}
      >
        {/* Hero */}
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: LANDMARK_IMAGES[country.id] || country.heroImage }}
            style={styles.heroImage}
            contentFit="cover"
            transition={reducedMotion ? 0 : 400}
            placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }}
            onError={(e) => console.warn("[Image] Failed to load:", e.error)}
          />
          <LinearGradient
            colors={["transparent", Colors.light.surface]}
            locations={[0.5, 1]}
            style={StyleSheet.absoluteFill}
          />
        </View>

        {/* Content card overlapping hero */}
        <View style={styles.contentCard}>
          <View style={styles.titleRow}>
            <Text style={styles.countryTitle}>{country.flag} {country.name}</Text>
          </View>

          <Text style={styles.statsLine}>
            {locations.length} regions · {totalRecipes} recipes
          </Text>

          <Text style={styles.description}>{country.description}</Text>

          {/* Change 1: Popular recipes strip */}
          {featuredRecipes.length > 0 && (
            <View style={styles.featuredSection}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionLabel}>POPULAR IN {country.name.toUpperCase()}</Text>
                <Pressable
                  onPress={() => router.push({ pathname: "/country/[id]/recipes", params: { id: country.id } })}
                  style={styles.seeAllButton}
                  accessibilityRole="link"
                  accessibilityLabel={`See all ${totalRecipes} recipes from ${country.name}`}
                >
                  <Text style={styles.seeAllText}>See all</Text>
                </Pressable>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.featuredScroll}
                accessibilityRole="adjustable"
                accessibilityLabel={`Popular in ${country.name}, horizontal scroll, ${featuredRecipes.length} items`}
              >
                {featuredRecipes.map((recipe) => (
                  <CompactRecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    reducedMotion={reducedMotion}
                  />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Change 2 & 3: Region heading with "All recipes" link */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.regionHeading}>EXPLORE REGIONS</Text>
            <Pressable
              onPress={() => router.push({ pathname: "/country/[id]/recipes", params: { id: country.id } })}
              style={styles.seeAllButton}
              accessibilityRole="link"
              accessibilityLabel={`View all ${totalRecipes} ${country.name} recipes`}
            >
              <Text style={styles.seeAllText}>All {totalRecipes} recipes →</Text>
            </Pressable>
          </View>

          {/* Location region cards with recipe counts */}
          <View style={styles.regionCards}>
            {locations.map((loc, idx) => (
              <LocationRegionCard key={idx} location={loc} countryId={country.id} reducedMotion={reducedMotion} />
            ))}
          </View>

          {/* Change 3b: Bottom "View all" button */}
          <Pressable
            style={styles.viewAllButton}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push({ pathname: "/country/[id]/recipes", params: { id: country.id } });
            }}
            accessibilityRole="button"
            accessibilityLabel={`View all ${totalRecipes} ${country.name} recipes`}
          >
            <Text style={styles.viewAllButtonText}>
              View all {totalRecipes} {country.name} recipes →
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

/** Compact recipe card for the horizontal "Popular in" carousel */
function CompactRecipeCard({ recipe, reducedMotion }: { recipe: Recipe; reducedMotion: boolean }) {
  return (
    <RecipeContextMenu recipe={recipe}>
      <Pressable
        style={({ pressed }) => [styles.compactCard, pressed && { opacity: 0.9 }]}
        onPress={() => {
          if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push({ pathname: "/recipe/[id]", params: { id: recipe.id } });
        }}
        accessibilityRole="button"
        accessibilityLabel={`${recipe.name}, ${recipe.time}`}
      >
        <Image
          source={{ uri: recipe.image }}
          style={styles.compactCardImage}
          contentFit="cover"
          transition={reducedMotion ? 0 : 300}
          placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }}
          onError={(e) => console.warn("[Image] Failed to load:", e.error)}
        />
        <View style={styles.compactCardInfo}>
          <Text style={styles.compactCardName} ellipsizeMode="tail" numberOfLines={2}>{recipe.name}</Text>
          <Text style={styles.compactCardTime}>{recipe.time}</Text>
        </View>
      </Pressable>
    </RecipeContextMenu>
  );
}

/** Region card with food emoji + recipe count */
function LocationRegionCard({ location, countryId, reducedMotion }: { location: CountryLocation; countryId: string; reducedMotion: boolean }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.regionCard, pressed && { opacity: 0.9 }]}
      onPress={() => {
        if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({
          pathname: "/region/[countryId]/[region]",
          params: { countryId, region: encodeURIComponent(location.name) },
        });
      }}
    >
      <Image
        source={{ uri: location.image }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={reducedMotion ? 0 : 300}
        placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }}
        onError={(e) => console.warn("[Image] Failed to load:", e.error)}
      />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.65)"]}
        locations={[0.4, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.regionCardContent}>
        <Text style={styles.regionCardSubtitle}>{location.subtitle}</Text>
        <Text style={styles.regionCardTitle}>{location.name}</Text>
        {/* Change 2: recipe count with food emoji */}
        {location.recipeCount != null && location.recipeCount > 0 && (
          <Text style={styles.regionRecipeCount}>
            {location.emoji || "🍽️"} {location.recipeCount} recipes
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
  },
  // Fixed header
  fixedHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 12,
    backgroundColor: `${Colors.light.surface}B3`,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(222,193,179,0.15)",
  },
  headerButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "NotoSerif_600SemiBold",
    fontStyle: "italic",
    fontSize: 18,
    color: Colors.light.primary,
    letterSpacing: -0.3,
  },
  // Hero
  heroContainer: {
    height: 353,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  // Content card
  contentCard: {
    marginTop: -32,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: Colors.light.surface,
    paddingHorizontal: 24,
    paddingTop: 32,
    minHeight: 530,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },
  countryTitle: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 24,
    color: Colors.light.onSurface,
    letterSpacing: -0.3,
  },
  statsLine: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#8A8279",
    marginBottom: 14,
  },
  description: {
    fontFamily: "Inter_400Regular",
    fontSize: 17,
    color: Colors.light.secondary,
    lineHeight: 26,
    marginBottom: 32,
  },
  // Section header (shared between featured + regions)
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.light.primary,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  seeAllButton: {
    minWidth: 48,
    minHeight: 48,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  seeAllText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.light.primary,
  },
  // Featured recipe strip
  featuredSection: {
    marginBottom: 32,
  },
  featuredScroll: {
    gap: 12,
  },
  // Compact recipe card (140x190)
  compactCard: {
    width: 140,
    height: 190,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E8DFD2",
    backgroundColor: Colors.light.surface,
    overflow: "hidden",
  },
  compactCardImage: {
    width: 140,
    height: 100,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  compactCardInfo: {
    flex: 1,
    padding: 8,
    justifyContent: "space-between",
  },
  compactCardName: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 16,
    color: Colors.light.onSurface,
    lineHeight: 20,
  },
  compactCardTime: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.light.secondary,
  },
  // Region heading
  regionHeading: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.light.primary,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  // Region cards
  regionCards: {
    gap: 28,
  },
  regionCard: {
    borderRadius: 14,
    overflow: "hidden",
    aspectRatio: 4 / 5,
    backgroundColor: Colors.light.surfaceContainerHigh,
  },
  regionCardContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
  },
  regionCardSubtitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 6,
    lineHeight: 20,
  },
  regionCardTitle: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 24,
    color: "#FFFFFF",
  },
  regionRecipeCount: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    marginTop: 8,
    lineHeight: 20,
  },
  // View all button (bottom)
  viewAllButton: {
    marginTop: 32,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  viewAllButtonText: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: Colors.light.primary,
  },
});
