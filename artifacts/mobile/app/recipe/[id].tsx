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
import { getRecipeById } from "@/constants/data";
import { useApp } from "@/contexts/AppContext";

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const recipe = getRecipeById(id);
  const { isSaved, toggleSaved, addToGrocery } = useApp();

  if (!recipe) {
    return (
      <View style={[styles.container, { alignItems: "center", justifyContent: "center", paddingHorizontal: 48 }]}>
        <Ionicons name="restaurant-outline" size={48} color={Colors.light.outlineVariant} />
        <Text style={{ fontFamily: "NotoSerif_600SemiBold", fontSize: 20, color: Colors.light.onSurface, marginTop: 16, marginBottom: 8 }}>Recipe not found</Text>
        <Pressable onPress={() => router.back()} style={{ backgroundColor: Colors.light.primary, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 20, marginTop: 16 }}>
          <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 15, color: "#FFFFFF" }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const saved = isSaved(recipe.id);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: recipe.image }}
            style={styles.heroImage}
            contentFit="cover"
            transition={400}
          />
          <LinearGradient
            colors={[
              "rgba(29,27,24,0.3)",
              "transparent",
              "rgba(29,27,24,0.85)",
            ]}
            locations={[0, 0.3, 1]}
            style={StyleSheet.absoluteFill}
          />

          <View style={[styles.topBar, { top: Platform.OS === "web" ? 67 : insets.top + 8 }]}>
            <Pressable onPress={() => router.back()} style={styles.iconButton}>
              <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
            </Pressable>
            <Pressable
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                toggleSaved(recipe.id);
              }}
              style={styles.iconButton}
            >
              <Ionicons
                name={saved ? "bookmark" : "bookmark-outline"}
                size={22}
                color="#FFFFFF"
              />
            </Pressable>
          </View>

          <View style={styles.heroTextContainer}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>{recipe.category}</Text>
            </View>
            <Text style={styles.heroTitle}>{recipe.name}</Text>
            <View style={styles.heroMeta}>
              <Text style={styles.heroMetaText}>
                {recipe.countryFlag} {recipe.countryName}
              </Text>
              <View style={styles.heroDot} />
              <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.8)" />
              <Text style={styles.heroMetaText}>{recipe.time}</Text>
              <View style={styles.heroDot} />
              <Text style={styles.heroMetaText}>{recipe.difficulty}</Text>
            </View>
          </View>
        </View>

        <View style={styles.descriptionSection}>
          <Text style={styles.descriptionText}>{recipe.description}</Text>
        </View>

        {recipe.culturalNote && (
          <View style={styles.culturalNoteSection}>
            <View style={styles.culturalNoteIcon}>
              <Ionicons name="sparkles" size={18} color={Colors.light.primary} />
            </View>
            <View style={styles.culturalNoteContent}>
              <Text style={styles.culturalNoteLabel}>Cultural Note</Text>
              <Text style={styles.culturalNoteText}>{recipe.culturalNote}</Text>
            </View>
          </View>
        )}

        <View style={styles.ingredientsSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            <Pressable
              onPress={() => {
                if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                addToGrocery(recipe);
              }}
              style={styles.addAllButton}
            >
              <Ionicons name="basket-outline" size={16} color={Colors.light.primary} />
              <Text style={styles.addAllText}>Add to list</Text>
            </Pressable>
          </View>
          {recipe.ingredients.map((ing) => (
            <View key={ing.id} style={styles.ingredientRow}>
              <View style={styles.ingredientDot} />
              <Text style={styles.ingredientName}>{ing.name}</Text>
              <Text style={styles.ingredientAmount}>{ing.amount}</Text>
            </View>
          ))}
        </View>

        <View style={styles.stepsSection}>
          <Text style={styles.sectionTitle}>Preparation</Text>
          {recipe.steps.map((step, index) => (
            <View key={step.id} style={styles.stepCard}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepInstruction}>{step.instruction}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
        <Pressable
          onPress={() => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push({
              pathname: "/cook-mode",
              params: { recipeId: recipe.id },
            });
          }}
          style={({ pressed }) => [
            styles.cookButton,
            pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
          ]}
        >
          <Ionicons name="flame" size={20} color="#FFFFFF" />
          <Text style={styles.cookButtonText}>Enter Cook Mode</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
  },
  heroContainer: {
    height: 380,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  topBar: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  iconButton: {
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
  heroBadge: {
    backgroundColor: "rgba(154,65,0,0.85)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  heroBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: "#FFFFFF",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  heroTitle: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 30,
    color: "#FFFFFF",
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  heroMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroMetaText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },
  heroDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  descriptionSection: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    backgroundColor: Colors.light.surfaceContainerLow,
  },
  descriptionText: {
    fontFamily: "NotoSerif_400Regular_Italic",
    fontSize: 16,
    color: Colors.light.onSurfaceVariant,
    lineHeight: 26,
  },
  culturalNoteSection: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 14,
  },
  culturalNoteIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.surfaceContainerLow,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  culturalNoteContent: {
    flex: 1,
  },
  culturalNoteLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.light.primary,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  culturalNoteText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.light.secondary,
    lineHeight: 22,
  },
  ingredientsSection: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    backgroundColor: Colors.light.surfaceContainerLow,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 22,
    color: Colors.light.onSurface,
    letterSpacing: -0.3,
  },
  addAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: Colors.light.surface,
  },
  addAllText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.light.primary,
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 12,
  },
  ingredientDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.primary,
  },
  ingredientName: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.light.onSurface,
  },
  ingredientAmount: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.light.secondary,
  },
  stepsSection: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 16,
  },
  stepCard: {
    flexDirection: "row",
    marginTop: 20,
    gap: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: "#FFFFFF",
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 17,
    color: Colors.light.onSurface,
    marginBottom: 6,
  },
  stepInstruction: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.light.secondary,
    lineHeight: 24,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: "rgba(254,249,243,0.95)",
  },
  cookButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 16,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  cookButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    color: "#FFFFFF",
  },
});
