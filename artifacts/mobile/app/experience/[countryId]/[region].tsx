import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
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
import { getCountryLocations } from "@/constants/data";
import { useCountry } from "@/hooks/useCountry";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const COURSE_LABELS = ["Start Here", "The Main Event", "Course III", "Course IV", "Course V", "Course VI"];
const ROMAN = ["I", "II", "III", "IV", "V", "VI"];

export default function ExperienceScreen() {
  const { countryId, region, selected } = useLocalSearchParams<{
    countryId: string;
    region: string;
    selected: string;
  }>();
  const insets = useSafeAreaInsets();
  const { country } = useCountry(countryId ?? "");
  const reducedMotion = useReducedMotion();
  const [etiquetteOpen, setEtiquetteOpen] = useState(false);

  const haptic = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const regionName = decodeURIComponent(region ?? "");
  const selectedIds = new Set((selected ?? "").split(",").filter(Boolean));

  if (!country) {
    return (
      <View style={[styles.container, { alignItems: "center", justifyContent: "center" }]}>
        <Ionicons name="earth-outline" size={48} color={Colors.light.outlineVariant} />
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const selectedRecipes = country.recipes.filter((r) => selectedIds.has(r.id));
  const totalIngredients = selectedRecipes.reduce((sum, r) => sum + (r.ingredients?.length ?? 0), 0);
  const regionHero = getCountryLocations(country).find((l) => l.name === regionName);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Fixed header */}
      <View style={[styles.fixedHeader, { paddingTop: Platform.OS === "web" ? 16 : insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={22} color={Colors.light.primary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerFlag}>{country.flag}</Text>
          <Text style={styles.headerTitle}>{regionName}</Text>
        </View>
        <Pressable style={styles.headerButton} onPress={haptic}>
          <Ionicons name="heart-outline" size={22} color={Colors.light.primary} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 160 : insets.bottom + 160 }}
      >
        {/* Hero image */}
        <View style={[styles.heroWrap, { marginTop: Platform.OS === "web" ? 56 : insets.top + 48 }]}>
          <Image
            source={{ uri: regionHero?.image ?? country.heroImage }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={reducedMotion ? 0 : 400}
          />
          <LinearGradient
            colors={["transparent", Colors.light.surface]}
            locations={[0.55, 1]}
            style={StyleSheet.absoluteFill}
          />
        </View>

        <View style={styles.content}>
          {/* Quote card */}
          <View style={styles.quoteCard}>
            <Text style={styles.quoteText}>
              {`"${country.description}"`}
            </Text>
          </View>

          {/* How They Eat */}
          <Pressable
            style={styles.etiquetteRow}
            onPress={() => { haptic(); setEtiquetteOpen((v) => !v); }}
          >
            <View style={styles.etiquetteLeft}>
              <Text style={styles.etiquetteEmoji}>🍽️</Text>
              <Text style={styles.etiquetteTitle}>How They Eat in {country.name}</Text>
            </View>
            <Ionicons
              name={etiquetteOpen ? "chevron-up" : "chevron-down"}
              size={20}
              color={Colors.light.secondary}
            />
          </Pressable>
          {etiquetteOpen && (
            <View style={styles.etiquetteBody}>
              <Text style={styles.etiquetteText}>{country.tagline}</Text>
            </View>
          )}

          {/* Course sequence */}
          <View style={styles.courses}>
            {selectedRecipes.map((recipe, idx) => (
              <View key={recipe.id} style={styles.courseArticle}>
                {/* Course label */}
                <Text style={styles.courseLabel}>{COURSE_LABELS[idx] ?? `Course ${idx + 1}`}</Text>

                {/* Image */}
                <View style={styles.courseImageWrap}>
                  <Image
                    source={{ uri: recipe.image }}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                    transition={reducedMotion ? 0 : 300}
                  />
                </View>

                {/* Info */}
                <View style={styles.courseInfo}>
                  <View style={styles.courseTitleRow}>
                    <Text style={styles.courseName}>{recipe.name}</Text>
                    <Text style={styles.courseRoman}>{ROMAN[idx] ?? ""}</Text>
                  </View>
                  <View style={styles.courseBadges}>
                    <Text style={styles.courseBadge}>{recipe.time}</Text>
                    <Text style={styles.courseBadgeDot}>•</Text>
                    <Text style={styles.courseBadge}>{recipe.difficulty}</Text>
                  </View>
                  <Text style={styles.courseDesc}>{recipe.description}</Text>
                  {recipe.culturalNote ? (
                    <View style={styles.didYouKnow}>
                      <Text style={styles.didYouKnowLabel}>Did You Know?</Text>
                      <Text style={styles.didYouKnowText}>{recipe.culturalNote}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Divider */}
                {idx < selectedRecipes.length - 1 && <View style={styles.courseDivider} />}
              </View>
            ))}
          </View>

          {/* Next Journey */}
          <View style={styles.nextJourney}>
            <Text style={styles.nextJourneyLabel}>Next Journey</Text>
            <Text style={styles.nextJourneyText}>
              If you loved {regionName}, explore {country.name} further →
            </Text>
            <View style={styles.nextJourneyRule} />
          </View>
        </View>
      </ScrollView>

      {/* Sticky bottom */}
      <LinearGradient
        colors={["transparent", Colors.light.surface, Colors.light.surface]}
        locations={[0, 0.35, 1]}
        style={[styles.stickyBottom, { paddingBottom: Platform.OS === "web" ? 24 : insets.bottom + 16 }]}
      >
        <Pressable
          style={({ pressed }) => [styles.ctaButton, pressed && { opacity: 0.88 }]}
          onPress={() => {
            haptic();
            router.push({ pathname: "/(tabs)/plan" });
          }}
        >
          <Ionicons name="basket-outline" size={20} color="#fff" />
          <Text style={styles.ctaText}>
            Get the Ingredients ({totalIngredients} items)
          </Text>
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
    backgroundColor: Colors.light.surface,
  },
  headerButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerFlag: {
    fontSize: 18,
  },
  headerTitle: {
    fontFamily: "NotoSerif_600SemiBold",
    fontStyle: "italic",
    fontSize: 18,
    color: Colors.light.primary,
    letterSpacing: -0.3,
  },
  heroWrap: {
    height: 280,
    position: "relative",
  },
  content: {
    paddingHorizontal: 24,
    marginTop: -24,
  },
  quoteCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.primary,
    paddingLeft: 16,
    paddingVertical: 16,
    paddingRight: 12,
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: 12,
    marginBottom: 24,
  },
  quoteText: {
    fontFamily: "NotoSerif_400Regular",
    fontStyle: "italic",
    fontSize: 16,
    color: Colors.light.onSurfaceVariant,
    lineHeight: 26,
  },
  etiquetteRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.light.surfaceContainerHigh,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  etiquetteLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  etiquetteEmoji: {
    fontSize: 22,
  },
  etiquetteTitle: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 16,
    color: Colors.light.onSurface,
  },
  etiquetteBody: {
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  etiquetteText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.light.onSurfaceVariant,
    lineHeight: 22,
  },
  courses: {
    marginTop: 32,
    gap: 0,
  },
  courseArticle: {
    marginBottom: 48,
  },
  courseLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.light.primary,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 16,
  },
  courseImageWrap: {
    width: "100%",
    aspectRatio: 4 / 5,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: Colors.light.surfaceContainerHigh,
    marginBottom: 20,
  },
  courseInfo: {
    gap: 8,
  },
  courseTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  courseName: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 24,
    color: Colors.light.onSurface,
    flex: 1,
    lineHeight: 30,
  },
  courseRoman: {
    fontFamily: "NotoSerif_600SemiBold",
    fontStyle: "italic",
    fontSize: 18,
    color: Colors.light.primary,
    marginLeft: 12,
    marginTop: 2,
  },
  courseBadges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  courseBadge: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.light.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  courseBadgeDot: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.light.outlineVariant,
  },
  courseDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.light.onSurfaceVariant,
    lineHeight: 22,
    marginTop: 4,
  },
  didYouKnow: {
    marginTop: 12,
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(222,193,179,0.2)",
  },
  didYouKnowLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.light.primary,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  didYouKnowText: {
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
    fontSize: 13,
    color: Colors.light.secondary,
    lineHeight: 20,
  },
  courseDivider: {
    height: 1,
    backgroundColor: "rgba(222,193,179,0.25)",
    marginTop: 48,
    marginBottom: -24,
  },
  nextJourney: {
    marginTop: 8,
    padding: 32,
    backgroundColor: Colors.light.surfaceContainerHigh,
    borderRadius: 20,
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  nextJourneyLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.light.secondary,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  nextJourneyText: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 18,
    color: Colors.light.onSurface,
    textAlign: "center",
    lineHeight: 26,
  },
  nextJourneyRule: {
    width: 48,
    height: 1,
    backgroundColor: "rgba(222,193,179,0.4)",
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
    gap: 10,
    paddingVertical: 18,
    borderRadius: 28,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  ctaText: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 17,
    color: "#FFFFFF",
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
