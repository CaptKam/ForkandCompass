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
import type { Recipe } from "@/constants/data";
import { useCountry } from "@/hooks/useCountry";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useApp } from "@/contexts/AppContext";

export default function CountryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { country } = useCountry(id);
  const { isCountrySaved, toggleSavedCountry } = useApp();
  const reducedMotion = useReducedMotion();

  if (!country) {
    return (
      <View style={[styles.container, { alignItems: "center", justifyContent: "center", paddingHorizontal: 48 }]}>
        <Ionicons name="earth-outline" size={48} color={Colors.light.outlineVariant} />
        <Text style={{ fontFamily: "NotoSerif_600SemiBold", fontSize: 20, color: Colors.light.onSurface, marginTop: 16, marginBottom: 8 }}>Country not found</Text>
        <Pressable onPress={() => router.back()} style={{ backgroundColor: Colors.light.primary, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 20, marginTop: 16 }}>
          <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 15, color: "#FFFFFF" }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const saved = isCountrySaved(country.id);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Fixed header */}
      <View style={[styles.fixedHeader, { paddingTop: Platform.OS === "web" ? 67 : insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={22} color={Colors.light.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>The Culinary Editorial</Text>
        <Pressable
          onPress={() => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            toggleSavedCountry(country.id);
          }}
          style={styles.headerButton}
        >
          <Ionicons
            name={saved ? "heart" : "heart-outline"}
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
            source={{ uri: country.heroImage }}
            style={styles.heroImage}
            contentFit="cover"
            transition={reducedMotion ? 0 : 400}
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

          <Text style={styles.description}>{country.description}</Text>

          {/* Region heading */}
          <Text style={styles.regionHeading}>Choose a region</Text>

          {/* Recipe cards as "region" cards */}
          <View style={styles.recipeCards}>
            {country.recipes.map((recipe) => (
              <RecipeRegionCard key={recipe.id} recipe={recipe} reducedMotion={reducedMotion} />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function RecipeRegionCard({ recipe, reducedMotion }: { recipe: Recipe; reducedMotion: boolean }) {
  const { isSaved, toggleSaved } = useApp();
  const saved = isSaved(recipe.id);

  return (
    <Pressable
      onPress={() => {
        if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({ pathname: "/recipe/[id]", params: { id: recipe.id } });
      }}
      style={({ pressed }) => [
        styles.regionCard,
        pressed && !reducedMotion && { transform: [{ scale: 0.98 }] },
      ]}
    >
      <Image
        source={{ uri: recipe.image }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={reducedMotion ? 0 : 300}
      />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.6)"]}
        locations={[0.4, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Heart button */}
      <Pressable
        onPress={(e) => {
          e.stopPropagation?.();
          if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          toggleSaved(recipe.id);
        }}
        style={styles.regionHeartButton}
      >
        <Ionicons
          name={saved ? "heart" : "heart-outline"}
          size={18}
          color={saved ? Colors.light.primary : Colors.light.primary}
        />
      </Pressable>

      <View style={styles.regionCardContent}>
        <Text style={styles.regionCardTitle}>{recipe.name}</Text>
        {/* Carousel dots */}
        <View style={styles.regionDots}>
          <View style={[styles.regionDot, styles.regionDotActive]} />
          <View style={styles.regionDot} />
          <View style={styles.regionDot} />
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
    backgroundColor: "rgba(254,249,243,0.7)",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(222,193,179,0.15)",
  },
  headerButton: {
    width: 40,
    height: 40,
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
    marginBottom: 14,
  },
  countryTitle: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 24,
    color: Colors.light.onSurface,
    letterSpacing: -0.3,
  },
  description: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.light.secondary,
    lineHeight: 24,
    marginBottom: 32,
  },
  // Region heading
  regionHeading: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.light.primary,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 24,
  },
  // Recipe cards
  recipeCards: {
    gap: 28,
  },
  regionCard: {
    borderRadius: 14,
    overflow: "hidden",
    aspectRatio: 4 / 5,
    backgroundColor: Colors.light.surfaceContainerHigh,
  },
  regionHeartButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(254,249,243,0.7)",
    borderWidth: 1,
    borderColor: "rgba(222,193,179,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  regionCardContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
  },
  regionCardTitle: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 24,
    color: "#FFFFFF",
    marginBottom: 12,
  },
  regionDots: {
    flexDirection: "row",
    gap: 6,
  },
  regionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  regionDotActive: {
    width: 16,
    backgroundColor: "#FFFFFF",
  },
});
