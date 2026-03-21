import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState, useCallback } from "react";
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
import { getRecipeById, getAllRecipes } from "@/constants/data";
import { useApp } from "@/contexts/AppContext";

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const recipe = getRecipeById(id);
  const { isSaved, toggleSaved, addToGrocery } = useApp();
  const [servings, setServings] = useState(4);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set());

  const toggleIngredient = useCallback((ingredientId: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCheckedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(ingredientId)) {
        next.delete(ingredientId);
      } else {
        next.add(ingredientId);
      }
      return next;
    });
  }, []);

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

  // Find a "next" recipe for the "Next Journey" card
  const allRecipes = getAllRecipes();
  const currentIndex = allRecipes.findIndex((r) => r.id === recipe.id);
  const nextRecipe = allRecipes[(currentIndex + 1) % allRecipes.length];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 120 : insets.bottom + 100 }}
      >
        {/* Hero */}
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: recipe.image }}
            style={styles.heroImage}
            contentFit="cover"
            transition={400}
          />
          <LinearGradient
            colors={["rgba(0,0,0,0.4)", "transparent", "transparent"]}
            locations={[0, 0.4, 1]}
            style={StyleSheet.absoluteFill}
          />

          <View style={[styles.topBar, { top: Platform.OS === "web" ? 67 : insets.top + 8 }]}>
            <Pressable onPress={() => router.back()} style={styles.iconButton}>
              <Ionicons name="arrow-back" size={22} color={Colors.light.onSurface} />
            </Pressable>
            <Pressable
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                toggleSaved(recipe.id);
              }}
              style={styles.iconButton}
            >
              <Ionicons
                name={saved ? "heart" : "heart-outline"}
                size={22}
                color={Colors.light.primary}
              />
            </Pressable>
          </View>
        </View>

        {/* Content card overlapping hero */}
        <View style={styles.contentCard}>
          {/* Title */}
          <Text style={styles.recipeTitle}>{recipe.name}</Text>
          <Text style={styles.recipeSubtitle}>{recipe.category} · {recipe.countryName} {recipe.countryFlag}</Text>

          {/* Metadata chips */}
          <View style={styles.metaRow}>
            <View style={styles.metaChip}>
              <Ionicons name="time-outline" size={16} color={Colors.light.primary} />
              <Text style={styles.metaText}>{recipe.time}</Text>
            </View>
            <View style={styles.metaChip}>
              <Ionicons name="flame-outline" size={16} color={Colors.light.primary} />
              <Text style={styles.metaText}>{recipe.difficulty}</Text>
            </View>
          </View>

          {/* Servings adjuster */}
          <View style={styles.servingsContainer}>
            <Text style={styles.servingsLabel}>Servings</Text>
            <View style={styles.servingsStepper}>
              <Pressable
                onPress={() => {
                  if (servings > 1) {
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setServings((s) => s - 1);
                  }
                }}
                style={styles.stepperButton}
              >
                <Ionicons name="remove" size={20} color={Colors.light.primary} />
              </Pressable>
              <Text style={styles.servingsValue}>{servings} servings</Text>
              <Pressable
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setServings((s) => s + 1);
                }}
                style={styles.stepperButton}
              >
                <Ionicons name="add" size={20} color={Colors.light.primary} />
              </Pressable>
            </View>
          </View>

          {/* Ingredients */}
          <Text style={styles.sectionTitle}>Ingredients</Text>
          <View style={styles.ingredientsList}>
            {recipe.ingredients.map((ing) => {
              const isChecked = checkedIngredients.has(ing.id);
              return (
                <Pressable
                  key={ing.id}
                  onPress={() => toggleIngredient(ing.id)}
                  style={styles.ingredientRow}
                >
                  <View style={[styles.ingredientCircle, isChecked && styles.ingredientCircleChecked]}>
                    {isChecked && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                  </View>
                  <Text style={[styles.ingredientText, isChecked && styles.ingredientTextChecked]}>
                    {ing.name}
                    <Text style={styles.ingredientAmount}>{" \u2014 "}{ing.amount}</Text>
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Add to Grocery CTA */}
          <Pressable
            onPress={() => {
              if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              addToGrocery(recipe);
            }}
            style={({ pressed }) => [
              styles.groceryCta,
              pressed && { transform: [{ scale: 0.98 }] },
            ]}
          >
            <LinearGradient
              colors={["#C75B12", "#9A4100"]}
              style={styles.groceryCtaGradient}
            >
              <Ionicons name="basket-outline" size={20} color="#FFFFFF" />
              <Text style={styles.groceryCtaText}>Add to Grocery List</Text>
            </LinearGradient>
          </Pressable>

          {/* Instructions */}
          <Text style={[styles.sectionTitle, { marginTop: 32 }]}>Instructions</Text>
          {recipe.steps.map((step, index) => (
            <View key={step.id} style={styles.stepCard}>
              <View style={styles.stepHeader}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.stepTitle}>{step.title}</Text>
              </View>
              <Text style={styles.stepInstruction}>{step.instruction}</Text>
              {step.materials.length > 0 && (
                <View style={styles.stepMaterials}>
                  <Text style={styles.stepMaterialsLabel}>You'll need:</Text>
                  <Text style={styles.stepMaterialsText}>{step.materials.join(", ")}</Text>
                </View>
              )}
            </View>
          ))}

          {/* Cultural Note / "Did You Know?" */}
          {recipe.culturalNote && (
            <View style={styles.didYouKnow}>
              <Text style={styles.didYouKnowLabel}>Did You Know?</Text>
              <Text style={styles.didYouKnowText}>{recipe.culturalNote}</Text>
            </View>
          )}

          {/* Enter Cook Mode */}
          <Pressable
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push({
                pathname: "/cook-mode",
                params: { recipeId: recipe.id },
              });
            }}
            style={({ pressed }) => [
              styles.cookModeButton,
              pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
            ]}
          >
            <View style={styles.cookModeLeft}>
              <Ionicons name="restaurant" size={20} color={Colors.light.primaryFixedDim} />
              <Text style={styles.cookModeText}>Enter Cook Mode</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </Pressable>

          {/* Quote */}
          <View style={styles.quoteContainer}>
            <Ionicons name="chatbox-ellipses-outline" size={28} color="rgba(154,65,0,0.15)" style={{ position: "absolute", top: 12, left: 16 }} />
            <Text style={styles.quoteText}>
              "This simple dish is the soul of Tuscan summer\u2014it requires nothing but the best ingredients and a patient hand."
            </Text>
          </View>

          {/* Next Journey */}
          {nextRecipe && (
            <View style={styles.nextJourneySection}>
              <Text style={styles.nextJourneyLabel}>The Next Journey</Text>
              <Pressable
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push({ pathname: "/recipe/[id]", params: { id: nextRecipe.id } });
                }}
                style={styles.nextJourneyCard}
              >
                <Image
                  source={{ uri: nextRecipe.image }}
                  style={styles.nextJourneyImage}
                  contentFit="cover"
                  transition={300}
                />
                <LinearGradient
                  colors={["transparent", "rgba(0,0,0,0.8)"]}
                  style={styles.nextJourneyOverlay}
                />
                <View style={styles.nextJourneyContent}>
                  <Text style={styles.nextJourneyTitle}>{nextRecipe.name}</Text>
                  <Text style={styles.nextJourneySubtitle}>{nextRecipe.category}</Text>
                </View>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
  },
  // Hero
  heroContainer: {
    height: 397,
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
    paddingHorizontal: 24,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(254,249,243,0.7)",
    borderWidth: 1,
    borderColor: "rgba(222,193,179,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  // Content card
  contentCard: {
    marginTop: -32,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: Colors.light.surface,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  recipeTitle: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 32,
    color: Colors.light.onSurface,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  recipeSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.light.secondary,
    letterSpacing: 0.3,
    marginBottom: 20,
  },
  // Meta chips
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.light.surfaceContainerHigh,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(222,193,179,0.1)",
  },
  metaText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.light.onSurface,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  // Servings
  servingsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.light.surfaceContainerHigh,
    borderRadius: 14,
    padding: 16,
    marginBottom: 28,
  },
  servingsLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.light.onSurface,
  },
  servingsStepper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 4,
    borderWidth: 1,
    borderColor: "rgba(222,193,179,0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  stepperButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  servingsValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: Colors.light.onSurface,
    paddingHorizontal: 12,
  },
  // Section title
  sectionTitle: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 22,
    color: Colors.light.onSurface,
    marginBottom: 16,
  },
  // Ingredients
  ingredientsList: {
    marginBottom: 20,
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    paddingVertical: 10,
  },
  ingredientCircle: {
    marginTop: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(222,193,179,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  ingredientCircleChecked: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  ingredientText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.light.onSurface,
    lineHeight: 22,
  },
  ingredientTextChecked: {
    color: Colors.light.onSurfaceVariant,
    textDecorationLine: "line-through",
    opacity: 0.6,
  },
  ingredientAmount: {
    color: Colors.light.secondary,
  },
  // Grocery CTA
  groceryCta: {
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 8,
  },
  groceryCtaGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 56,
    borderRadius: 14,
  },
  groceryCtaText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#FFFFFF",
  },
  // Steps
  stepCard: {
    marginBottom: 28,
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 10,
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
  stepTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    color: Colors.light.onSurface,
  },
  stepInstruction: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.light.onSurfaceVariant,
    lineHeight: 24,
    marginBottom: 10,
  },
  stepMaterials: {
    padding: 14,
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: "rgba(154,65,0,0.3)",
  },
  stepMaterialsLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    color: Colors.light.secondary,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  stepMaterialsText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.light.onSurface,
  },
  // Did You Know
  didYouKnow: {
    padding: 16,
    backgroundColor: "rgba(248,243,237,0.5)",
    borderRadius: 14,
    borderLeftWidth: 4,
    borderLeftColor: "rgba(154,65,0,0.3)",
    marginBottom: 28,
  },
  didYouKnowLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.light.primary,
    marginBottom: 6,
  },
  didYouKnowText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.light.secondary,
    fontStyle: "italic",
    lineHeight: 22,
  },
  // Cook Mode button
  cookModeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1A1A2E",
    borderRadius: 14,
    paddingHorizontal: 24,
    height: 64,
    marginBottom: 32,
  },
  cookModeLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cookModeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  // Quote
  quoteContainer: {
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    marginBottom: 32,
    overflow: "hidden",
  },
  quoteText: {
    fontFamily: "NotoSerif_600SemiBold",
    fontStyle: "italic",
    fontSize: 17,
    color: Colors.light.primary,
    textAlign: "center",
    lineHeight: 28,
  },
  // Next Journey
  nextJourneySection: {
    marginBottom: 24,
  },
  nextJourneyLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: Colors.light.secondary,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  nextJourneyCard: {
    borderRadius: 20,
    overflow: "hidden",
    height: 200,
    backgroundColor: Colors.light.surfaceContainerHigh,
  },
  nextJourneyImage: {
    width: "100%",
    height: "100%",
  },
  nextJourneyOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  nextJourneyContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  nextJourneyTitle: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 22,
    color: "#FFFFFF",
    marginBottom: 4,
  },
  nextJourneySubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
  },
});
