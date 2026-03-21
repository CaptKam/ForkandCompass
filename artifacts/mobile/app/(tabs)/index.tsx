import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { COUNTRIES, type Country, type Recipe } from "@/constants/data";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_MARGIN = 10;
const GRID_CARD_WIDTH = (SCREEN_WIDTH - 48 - CARD_MARGIN) / 2;

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const featured = COUNTRIES[0];
  const allRecipes = COUNTRIES.flatMap((c) => c.recipes).slice(0, 4);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View style={[styles.header, { paddingTop: Platform.OS === "web" ? 67 : insets.top + 8 }]}>
          <View>
            <Text style={styles.headerLabel}>The Culinary</Text>
            <Text style={styles.headerTitle}>Editorial</Text>
          </View>
          <Pressable style={styles.searchButton}>
            <Ionicons name="search" size={20} color={Colors.light.onSurface} />
          </Pressable>
        </View>

        <View style={styles.heroSection}>
          <Pressable
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push({ pathname: "/country/[id]", params: { id: featured.id } });
            }}
          >
            <View style={styles.heroCard}>
              <Image
                source={{ uri: featured.heroImage }}
                style={styles.heroImage}
                contentFit="cover"
                transition={400}
              />
              <LinearGradient
                colors={["transparent", "rgba(29,27,24,0.75)"]}
                style={styles.heroOverlay}
              />
              <View style={styles.heroContent}>
                <View style={styles.heroTag}>
                  <Text style={styles.heroTagText}>Featured Destination</Text>
                </View>
                <Text style={styles.heroTitle}>{featured.name}</Text>
                <Text style={styles.heroSubtitle}>{featured.tagline}</Text>
              </View>
            </View>
          </Pressable>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Explore Countries</Text>
          <Pressable>
            <Text style={styles.seeAllText}>See all</Text>
          </Pressable>
        </View>

        <View style={styles.gridContainer}>
          {COUNTRIES.map((country) => (
            <CountryCard key={country.id} country={country} />
          ))}
        </View>

        <View style={[styles.sectionHeader, { marginTop: 8 }]}>
          <Text style={styles.sectionTitle}>Trending Recipes</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.recipesScroll}
        >
          {allRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </ScrollView>
      </ScrollView>
    </View>
  );
}

function CountryCard({ country }: { country: Country }) {
  return (
    <Pressable
      onPress={() => {
        if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({ pathname: "/country/[id]", params: { id: country.id } });
      }}
      style={({ pressed }) => [
        styles.countryCard,
        pressed && { transform: [{ scale: 0.97 }] },
      ]}
    >
      <Image
        source={{ uri: country.image }}
        style={styles.countryImage}
        contentFit="cover"
        transition={300}
      />
      <LinearGradient
        colors={["transparent", "rgba(29,27,24,0.7)"]}
        style={styles.countryOverlay}
      />
      <View style={styles.countryContent}>
        <Text style={styles.countryFlag}>{country.flag}</Text>
        <Text style={styles.countryName}>{country.name}</Text>
        <Text style={styles.countryRegion}>{country.region}</Text>
      </View>
    </Pressable>
  );
}

function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <Pressable
      onPress={() => {
        if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({ pathname: "/recipe/[id]", params: { id: recipe.id } });
      }}
      style={({ pressed }) => [
        styles.recipeCard,
        pressed && { transform: [{ scale: 0.97 }] },
      ]}
    >
      <Image
        source={{ uri: recipe.image }}
        style={styles.recipeImage}
        contentFit="cover"
        transition={300}
      />
      <View style={styles.recipeCardContent}>
        <Text style={styles.recipeCategory}>{recipe.category}</Text>
        <Text style={styles.recipeName} numberOfLines={2}>
          {recipe.name}
        </Text>
        <View style={styles.recipeMetaRow}>
          <View style={styles.recipeMeta}>
            <Ionicons name="time-outline" size={13} color={Colors.light.secondary} />
            <Text style={styles.recipeMetaText}>{recipe.time}</Text>
          </View>
          <View style={styles.recipeMeta}>
            <Ionicons name="flame-outline" size={13} color={Colors.light.secondary} />
            <Text style={styles.recipeMetaText}>{recipe.difficulty}</Text>
          </View>
        </View>
      </View>
    </Pressable>
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
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  headerLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.light.primary,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  headerTitle: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 28,
    color: Colors.light.onSurface,
    letterSpacing: -0.5,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.surfaceContainerLow,
    alignItems: "center",
    justifyContent: "center",
  },
  heroSection: {
    paddingHorizontal: 24,
    marginBottom: 28,
  },
  heroCard: {
    borderRadius: 24,
    overflow: "hidden",
    height: 280,
    backgroundColor: Colors.light.surfaceContainerLow,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
  },
  heroContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  heroTag: {
    backgroundColor: "rgba(154,65,0,0.85)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  heroTagText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: "#FFFFFF",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  heroTitle: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 32,
    color: "#FFFFFF",
    marginBottom: 4,
  },
  heroSubtitle: {
    fontFamily: "NotoSerif_400Regular_Italic",
    fontSize: 15,
    color: "rgba(255,255,255,0.8)",
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
    fontSize: 22,
    color: Colors.light.onSurface,
    letterSpacing: -0.3,
  },
  seeAllText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.light.primary,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 24,
    gap: CARD_MARGIN,
    marginBottom: 28,
  },
  countryCard: {
    width: GRID_CARD_WIDTH,
    height: GRID_CARD_WIDTH * 1.3,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: Colors.light.surfaceContainerLow,
  },
  countryImage: {
    width: "100%",
    height: "100%",
  },
  countryOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  countryContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
  },
  countryFlag: {
    fontSize: 20,
    marginBottom: 4,
  },
  countryName: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 18,
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
  countryRegion: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
  },
  recipesScroll: {
    paddingHorizontal: 24,
    gap: 14,
    paddingBottom: 8,
  },
  recipeCard: {
    width: 200,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: Colors.light.surfaceContainerLow,
  },
  recipeImage: {
    width: "100%",
    height: 130,
  },
  recipeCardContent: {
    padding: 12,
  },
  recipeCategory: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: Colors.light.primary,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  recipeName: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 15,
    color: Colors.light.onSurface,
    lineHeight: 20,
    marginBottom: 8,
  },
  recipeMetaRow: {
    flexDirection: "row",
    gap: 12,
  },
  recipeMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  recipeMetaText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.light.secondary,
  },
});
