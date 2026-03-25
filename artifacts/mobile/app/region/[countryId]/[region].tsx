import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useCountry } from "@/hooks/useCountry";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { Recipe } from "@/constants/data";
import { getRecipesForRegion } from "@/constants/data";

function groupByCategory(recipes: Recipe[]): { category: string; recipes: Recipe[] }[] {
  const map = new Map<string, Recipe[]>();
  for (const r of recipes) {
    const key = r.category || "Other";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }
  return Array.from(map.entries()).map(([category, recipes]) => ({ category, recipes }));
}

export default function RegionMenuScreen() {
  const { countryId, region } = useLocalSearchParams<{ countryId: string; region: string }>();
  const insets = useSafeAreaInsets();
  const { country } = useCountry(countryId ?? "");
  const reducedMotion = useReducedMotion();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const haptic = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const toggleSelect = (id: string) => {
    haptic();
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const regionName = decodeURIComponent(region ?? "");
  const regionRecipes = country ? getRecipesForRegion(country.recipes, regionName) : [];
  const sections = groupByCategory(regionRecipes);
  const selectedCount = selected.size;

  if (!country) {
    return (
      <View style={[styles.container, { alignItems: "center", justifyContent: "center" }]}>
        <Ionicons name="earth-outline" size={48} color={Colors.light.outlineVariant} />
        <Text style={styles.notFoundText}>Region not found</Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Fixed header */}
      <View style={[styles.fixedHeader, { paddingTop: Platform.OS === "web" ? 16 : insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="chevron-back" size={22} color={Colors.light.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>{regionName}</Text>
        <Pressable
          style={styles.headerButton}
          onPress={() => { haptic(); Alert.alert("Coming soon", "Saving regions will be available in a future update."); }}
        >
          <Ionicons name="heart-outline" size={22} color={Colors.light.primary} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 140 : insets.bottom + 140 }}
      >
        {/* Hero header */}
        <View style={[styles.heroHeader, { paddingTop: Platform.OS === "web" ? 72 : insets.top + 56 }]}>
          <Text style={styles.regionLabel}>Region Selection</Text>
          <Text style={styles.heroTitle}>Build Your{"\n"}{regionName} Dinner</Text>
          <View style={styles.heroRule} />
        </View>

        {/* Recipe sections */}
        {sections.map(({ category, recipes }) => (
          <View key={category} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{category}</Text>
              {recipes.length > 1 && (
                <Text style={styles.scrollHint}>Scroll to explore</Text>
              )}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cardRow}
              snapToInterval={220 + 16}
              decelerationRate="fast"
            >
              {recipes.map((recipe) => {
                const isSelected = selected.has(recipe.id);
                return (
                  <Pressable
                    key={recipe.id}
                    style={({ pressed }) => [styles.card, pressed && { opacity: 0.88 }]}
                    onPress={() => {
                      haptic();
                      router.push({ pathname: "/recipe/[id]", params: { id: recipe.id } });
                    }}
                  >
                    <View style={[styles.cardImageWrap, isSelected && styles.cardImageSelected]}>
                      <Image
                        source={{ uri: recipe.image }}
                        style={StyleSheet.absoluteFill}
                        contentFit="cover"
                        transition={reducedMotion ? 0 : 300}
                        placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }}
                        onError={(e) => console.warn("[Image] Failed to load:", e.error)}
                      />
                      {/* Checkmark select button — always visible in top-right corner */}
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation?.();
                          toggleSelect(recipe.id);
                        }}
                        hitSlop={8}
                        style={[styles.checkBadge, isSelected && styles.checkBadgeSelected]}
                      >
                        {isSelected ? (
                          <Ionicons name="checkmark" size={14} color="#fff" />
                        ) : (
                          <Ionicons name="add" size={14} color={Colors.light.primary} />
                        )}
                      </Pressable>
                    </View>
                    <View style={styles.cardMeta}>
                      <Text style={styles.cardName} numberOfLines={2}>{recipe.name}</Text>
                      <View style={styles.cardBadges}>
                        <Text style={styles.badge}>{recipe.time}</Text>
                        <Text style={styles.badgeDot}>•</Text>
                        <Text style={styles.badge}>{recipe.difficulty}</Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ))}
      </ScrollView>

      {/* Sticky bottom CTA */}
      <LinearGradient
        colors={["transparent", Colors.light.surface, Colors.light.surface]}
        locations={[0, 0.4, 1]}
        style={[styles.stickyBottom, { paddingBottom: Platform.OS === "web" ? 24 : insets.bottom + 16 }]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.ctaButton,
            selectedCount === 0 && styles.ctaButtonDisabled,
            pressed && { opacity: 0.88 },
          ]}
          onPress={() => {
            if (selectedCount === 0) return;
            haptic();
            router.push({
              pathname: "/experience/[countryId]/[region]",
              params: {
                countryId: countryId ?? "",
                region: region ?? "",
                selected: Array.from(selected).join(","),
              },
            });
          }}
        >
          <Text style={styles.ctaText}>
            {selectedCount === 0
              ? "Select a dish to continue"
              : `Review Your Experience (${selectedCount})`}
          </Text>
          {selectedCount > 0 && <Ionicons name="arrow-forward" size={18} color="#fff" />}
        </Pressable>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
  },
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
    paddingBottom: 14,
    backgroundColor: "rgba(254,249,243,0.9)",
  },
  headerButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 20,
    color: Colors.light.onSurface,
    letterSpacing: -0.3,
  },
  heroHeader: {
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  regionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.light.primary,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  heroTitle: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 42,
    color: Colors.light.onSurface,
    lineHeight: 48,
    letterSpacing: -0.5,
    marginBottom: 32,
  },
  heroRule: {
    width: 64,
    height: 1,
    backgroundColor: "rgba(222,193,179,0.5)",
  },
  section: {
    marginBottom: 48,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: "NotoSerif_600SemiBold",
    fontStyle: "italic",
    fontSize: 22,
    color: Colors.light.onSurface,
  },
  scrollHint: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.light.secondary,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  cardRow: {
    paddingHorizontal: 24,
    gap: 16,
  },
  card: {
    width: 220,
  },
  cardImageWrap: {
    width: 220,
    height: 220,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: Colors.light.surfaceContainerHigh,
    borderWidth: 2,
    borderColor: "transparent",
  },
  cardImageSelected: {
    borderColor: Colors.light.primary,
  },
  checkBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(254,249,243,0.92)",
    borderWidth: 1.5,
    borderColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  checkBadgeSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  cardMeta: {
    marginTop: 14,
    gap: 8,
  },
  cardName: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 17,
    color: Colors.light.onSurface,
    lineHeight: 23,
  },
  cardBadges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badge: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.light.secondary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  badgeDot: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.light.outlineVariant,
  },
  stickyBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 56,
  },
  ctaButton: {
    backgroundColor: Colors.light.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 18,
    borderRadius: 28,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
  },
  ctaButtonDisabled: {
    backgroundColor: Colors.light.outlineVariant,
    shadowOpacity: 0,
    elevation: 0,
  },
  ctaText: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 17,
    color: "#FFFFFF",
  },
  notFoundText: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 20,
    color: Colors.light.onSurface,
    marginTop: 16,
    marginBottom: 8,
  },
  backBtn: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginTop: 16,
  },
  backBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#FFFFFF",
  },
});
