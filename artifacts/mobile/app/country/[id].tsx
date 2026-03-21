import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
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
import { getCountryById, type Recipe } from "@/constants/data";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function CountryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const country = getCountryById(id);

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

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: country.heroImage }}
            style={styles.heroImage}
            contentFit="cover"
            transition={400}
          />
          <LinearGradient
            colors={[
              "rgba(29,27,24,0.3)",
              "transparent",
              "rgba(29,27,24,0.8)",
            ]}
            locations={[0, 0.3, 1]}
            style={StyleSheet.absoluteFill}
          />

          <Pressable
            onPress={() => router.back()}
            style={[styles.backButton, { top: Platform.OS === "web" ? 67 : insets.top + 8 }]}
          >
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </Pressable>

          <View style={styles.heroTextContainer}>
            <Text style={styles.heroFlag}>{country.flag}</Text>
            <Text style={styles.heroTitle}>{country.name}</Text>
            <Text style={styles.heroRegion}>{country.region} Region</Text>
          </View>
        </View>

        <View style={styles.descriptionSection}>
          <Text style={styles.descriptionText}>{country.description}</Text>
        </View>

        <View style={styles.recipesSection}>
          <Text style={styles.sectionTitle}>
            Recipes from {country.name}
          </Text>
          <Text style={styles.sectionSubtitle}>
            {country.recipes.length} authentic dishes to explore
          </Text>

          {country.recipes.map((recipe) => (
            <CountryRecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function CountryRecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <Pressable
      onPress={() => {
        if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({ pathname: "/recipe/[id]", params: { id: recipe.id } });
      }}
      style={({ pressed }) => [
        styles.recipeCard,
        pressed && { transform: [{ scale: 0.98 }] },
      ]}
    >
      <Image
        source={{ uri: recipe.image }}
        style={styles.recipeImage}
        contentFit="cover"
        transition={300}
      />
      <LinearGradient
        colors={["transparent", "rgba(29,27,24,0.7)"]}
        style={styles.recipeOverlay}
      />
      <View style={styles.recipeContent}>
        <View style={styles.recipeBadge}>
          <Text style={styles.recipeBadgeText}>{recipe.category}</Text>
        </View>
        <Text style={styles.recipeName}>{recipe.name}</Text>
        <View style={styles.recipeMeta}>
          <View style={styles.recipeMetaItem}>
            <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.8)" />
            <Text style={styles.recipeMetaText}>{recipe.time}</Text>
          </View>
          <View style={styles.recipeMetaItem}>
            <Ionicons name="flame-outline" size={14} color="rgba(255,255,255,0.8)" />
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
  heroContainer: {
    height: 360,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  backButton: {
    position: "absolute",
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(29,27,24,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroTextContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
  },
  heroFlag: {
    fontSize: 28,
    marginBottom: 8,
  },
  heroTitle: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 38,
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  heroRegion: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
    letterSpacing: 0.5,
  },
  descriptionSection: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    backgroundColor: Colors.light.surfaceContainerLow,
  },
  descriptionText: {
    fontFamily: "NotoSerif_400Regular_Italic",
    fontSize: 17,
    color: Colors.light.onSurfaceVariant,
    lineHeight: 28,
  },
  recipesSection: {
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  sectionTitle: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 24,
    color: Colors.light.onSurface,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.light.secondary,
    marginBottom: 20,
  },
  recipeCard: {
    borderRadius: 20,
    overflow: "hidden",
    height: 200,
    marginBottom: 16,
    backgroundColor: Colors.light.surfaceContainerLow,
  },
  recipeImage: {
    width: "100%",
    height: "100%",
  },
  recipeOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  recipeContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 18,
  },
  recipeBadge: {
    backgroundColor: "rgba(154,65,0,0.85)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  recipeBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: "#FFFFFF",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  recipeName: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 22,
    color: "#FFFFFF",
    marginBottom: 8,
  },
  recipeMeta: {
    flexDirection: "row",
    gap: 16,
  },
  recipeMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  recipeMetaText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
  },
});
