import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
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
import { SCROLL_BOTTOM_INSET } from "@/constants/spacing";
import { getRecipeById, getCountryById, type GroceryItem } from "@/constants/data";
import type { Recipe } from "@/constants/data";
import { useApp } from "@/contexts/AppContext";
import { parseTimeMinutes } from "@/hooks/useItinerary";
import ProfileSheet from "@/components/ProfileSheet";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const haptic = (style: "light" | "medium" = "light") => {
  if (Platform.OS !== "web") {
    Haptics.impactAsync(style === "medium" ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
  }
};

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function CookScreen() {
  const insets = useSafeAreaInsets();
  const {
    currentItinerary,
    activeCookSession,
    groceryItems,
  } = useApp();

  const [showProfile, setShowProfile] = useState(false);

  const today = toISODate(new Date());

  const todayDay = useMemo(() => {
    if (!currentItinerary || currentItinerary.length === 0) return null;
    return currentItinerary.find((d) => d.date === today) ?? null;
  }, [currentItinerary, today]);

  const isCompleted = todayDay?.status === "completed";
  const isActive = todayDay?.status === "active";

  const recipeIds = useMemo(() => {
    if (!todayDay || todayDay.status === "skipped") return [];
    return todayDay.mode === "quick" ? todayDay.quickRecipeIds : todayDay.fullRecipeIds;
  }, [todayDay]);

  const extraIds = todayDay?.extraRecipeIds ?? [];
  const allRecipeIds = useMemo(() => [...recipeIds, ...extraIds], [recipeIds, extraIds]);

  const recipes = useMemo(() => allRecipeIds.map(getRecipeById).filter((r): r is Recipe => r != null), [allRecipeIds]);

  const heroRecipe = useMemo(() => recipes.find((r) => r.category === "Main Course") ?? recipes[0] ?? null, [recipes]);

  const country = todayDay ? getCountryById(todayDay.countryId) : null;

  const activeRecipe = activeCookSession ? getRecipeById(activeCookSession.recipeId) : null;

  const handleStartCooking = useCallback(() => {
    if (!allRecipeIds.length) return;
    haptic("medium");
    const sorted = [...allRecipeIds].sort((a, b) => {
      const ra = getRecipeById(a);
      const rb = getRecipeById(b);
      const ta = parseTimeMinutes(ra?.time ?? "0");
      const tb = parseTimeMinutes(rb?.time ?? "0");
      return tb - ta;
    });
    router.push({
      pathname: "/cook-mode",
      params: {
        recipeId: sorted[0],
        recipeIds: sorted.join(","),
      },
    });
  }, [allRecipeIds]);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Platform.OS === "web" ? 56 : insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Cook</Text>
        <Pressable
          onPress={() => { haptic(); setShowProfile(true); }}
          style={styles.avatarBtn}
          accessibilityLabel="Open profile"
        >
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={14} color={Colors.light.outline} />
          </View>
        </Pressable>
      </View>

      {showProfile && <ProfileSheet onClose={() => setShowProfile(false)} />}

      {/* STATE 1 — Active session in progress */}
      {activeCookSession != null && activeRecipe != null ? (
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 120 : insets.bottom + SCROLL_BOTTOM_INSET }}
        >
          <View style={styles.activeCard}>
            <Text style={styles.activeEyebrow}>IN THE KITCHEN</Text>
            <Image
              source={{ uri: activeRecipe.image }}
              style={styles.activeHero}
              contentFit="cover"
              placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }}
              onError={(e) => console.warn("[Image]", e.error)}
            />
            <View style={styles.activeBody}>
              <Text style={styles.activeName} numberOfLines={2} ellipsizeMode="tail">
                {activeRecipe.name}
              </Text>
              <Text style={styles.activeMeta}>
                Step {activeCookSession.currentStep + 1} of {activeRecipe.steps?.length ?? activeCookSession.totalSteps}
              </Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, {
                  width: `${Math.round(((activeCookSession.currentStep + 1) / (activeRecipe.steps?.length ?? activeCookSession.totalSteps)) * 100)}%` as `${number}%`,
                }]} />
              </View>
            </View>
            <Pressable
              onPress={() => router.push({
                pathname: "/cook-mode",
                params: { recipeId: activeCookSession.recipeId, resumeStep: String(activeCookSession.currentStep) },
              })}
              style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.88 }]}
              accessibilityLabel="Resume cooking"
              accessibilityRole="button"
            >
              <Ionicons name="flame" size={20} color={Colors.light.onPrimary} />
              <Text style={styles.primaryBtnText}>Resume Cooking →</Text>
            </Pressable>
          </View>
        </ScrollView>

      /* STATE 4 — Meal completed today */
      ) : isCompleted ? (
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 56 }}>🎉</Text>
          <Text style={styles.emptyTitle}>Great cook tonight!</Text>
          <Text style={styles.emptyBody}>
            You made {heroRecipe?.name ?? "dinner"}. See what's planned for the rest of your week.
          </Text>
          <Pressable
            onPress={() => { haptic(); router.push("/(tabs)/plan"); }}
            style={styles.emptyPrimaryBtn}
            accessibilityLabel="See weekly plan"
            accessibilityRole="button"
          >
            <Text style={styles.emptyPrimaryText}>See This Week's Plan →</Text>
          </Pressable>
        </View>

      /* STATE 2 — Meal planned, not yet cooking */
      ) : isActive && heroRecipe ? (
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 120 : insets.bottom + SCROLL_BOTTOM_INSET }}
        >
          <View style={styles.heroWrap}>
            <Image
              source={{ uri: heroRecipe.image }}
              style={styles.heroImage}
              contentFit="cover"
              placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }}
              onError={(e) => console.warn("[Image]", e.error)}
            />
            <LinearGradient colors={["transparent", "rgba(0,0,0,0.65)"]} style={StyleSheet.absoluteFill} />
            <View style={styles.heroOverlay}>
              <Text style={styles.heroFlag}>{country?.flag}</Text>
              <Text style={styles.heroCountry}>{country?.name}</Text>
            </View>
          </View>

          <View style={styles.recipeSection}>
            <Text style={styles.recipeName} numberOfLines={2} ellipsizeMode="tail">
              {heroRecipe.name}
            </Text>
            <Text style={styles.recipeMeta}>
              {heroRecipe.time}{allRecipeIds.length > 1 ? ` · ${allRecipeIds.length} courses` : ""}
            </Text>
          </View>

          <TimeAwarenessCard recipe={heroRecipe} />
          <GroceryStatusCard recipeNames={recipes.map((r) => r.name)} groceryItems={groceryItems} />
          <CookCTA recipeNames={recipes.map((r) => r.name)} groceryItems={groceryItems} onStartCooking={handleStartCooking} />
        </ScrollView>

      /* STATE 3 — No meal planned tonight */
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="flame-outline" size={44} color={Colors.light.primary} />
          </View>
          <Text style={styles.emptyTitle}>Nothing planned for tonight</Text>
          <Text style={styles.emptyBody}>
            Head to Plan to set up tonight's dinner, or search for something to make.
          </Text>
          <Pressable
            onPress={() => { haptic(); router.push("/(tabs)/plan"); }}
            style={styles.emptyPrimaryBtn}
            accessibilityLabel="Go to plan"
            accessibilityRole="button"
          >
            <Text style={styles.emptyPrimaryText}>Plan Tonight →</Text>
          </Pressable>
          <Pressable
            onPress={() => { haptic(); router.push("/(tabs)/search"); }}
            style={styles.emptySecondaryBtn}
            accessibilityLabel="Browse recipes"
            accessibilityRole="button"
          >
            <Text style={styles.emptySecondaryText}>Browse Recipes</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

// ─── TimeAwarenessCard ───────────────────────────────────────────────────────

function TimeAwarenessCard({ recipe }: { recipe: Recipe }) {
  const now = new Date();
  const hour = now.getHours();
  const minutes = now.getMinutes();
  const cookMins = parseTimeMinutes(recipe.time ?? "0");
  const dinnerHour = 19;
  const minutesUntilDinner = (dinnerHour * 60) - (hour * 60 + minutes);
  const startByTotal = dinnerHour * 60 - cookMins;
  const startByHour = Math.floor(startByTotal / 60);
  const startByMin = startByTotal % 60;
  const startByStr = `${startByHour > 12 ? startByHour - 12 : startByHour}:${String(startByMin).padStart(2, "0")} ${startByHour >= 12 ? "PM" : "AM"}`;
  const isLate = minutesUntilDinner < cookMins;
  const isUrgent = minutesUntilDinner < cookMins + 30 && !isLate;

  if (hour >= dinnerHour + 2) return null;

  if (isLate) {
    return (
      <View style={[styles.timeCard, { borderColor: "rgba(255,149,0,0.25)", backgroundColor: "rgba(255,149,0,0.08)" }]}>
        <Ionicons name="warning-outline" size={18} color="#FF9500" />
        <View style={{ flex: 1 }}>
          <Text style={styles.timeCardTitle}>Running late for tonight</Text>
          <Text style={styles.timeCardSub}>{recipe.name} takes {recipe.time}. Consider a faster recipe.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.timeCard, isUrgent && { borderColor: "rgba(138,56,0,0.2)", backgroundColor: "rgba(138,56,0,0.06)" }]}>
      <Ionicons
        name={isUrgent ? "time-outline" : "checkmark-circle-outline"}
        size={18}
        color={isUrgent ? Colors.light.primary : "#34c759"}
      />
      <View style={{ flex: 1 }}>
        <Text style={styles.timeCardTitle}>{isUrgent ? "Start cooking soon" : "Good timing"}</Text>
        <Text style={styles.timeCardSub}>Start by {startByStr} for dinner at 7 PM.</Text>
      </View>
    </View>
  );
}

// ─── GroceryStatusCard ───────────────────────────────────────────────────────

function GroceryStatusCard({ recipeNames, groceryItems }: { recipeNames: string[]; groceryItems: GroceryItem[] }) {
  const nameSet = useMemo(() => new Set(recipeNames), [recipeNames]);
  const tonightItems = groceryItems.filter(
    (item) =>
      !item.excluded &&
      (nameSet.has(item.recipeName) ||
        (item.recipeNames && item.recipeNames.some((n) => nameSet.has(n))))
  );
  const checkedCount = tonightItems.filter((i) => i.checked).length;
  const total = tonightItems.length;

  if (total === 0) return null;

  const allConfirmed = checkedCount === total;
  const progress = checkedCount / total;

  return (
    <View style={styles.groceryCard}>
      <View style={styles.groceryCardRow}>
        <Text style={styles.groceryCardTitle}>Ingredients</Text>
        <Pressable
          onPress={() => router.push("/(tabs)/grocery")}
          accessibilityLabel="View grocery list"
          accessibilityRole="button"
        >
          <Text style={styles.groceryCardLink}>View list →</Text>
        </Pressable>
      </View>
      {allConfirmed ? (
        <View style={styles.groceryConfirmed}>
          <Ionicons name="checkmark-circle" size={16} color="#34c759" />
          <Text style={styles.groceryConfirmedText}>All {total} ingredients confirmed</Text>
        </View>
      ) : (
        <>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` as `${number}%` }]} />
          </View>
          <Text style={styles.groceryProgressLabel}>{checkedCount} of {total} confirmed</Text>
        </>
      )}
    </View>
  );
}

// ─── CookCTA ─────────────────────────────────────────────────────────────────

function CookCTA({ recipeNames, groceryItems, onStartCooking }: { recipeNames: string[]; groceryItems: GroceryItem[]; onStartCooking: () => void }) {
  const nameSet = useMemo(() => new Set(recipeNames), [recipeNames]);
  const tonightItems = groceryItems.filter(
    (item) =>
      !item.excluded &&
      (nameSet.has(item.recipeName) ||
        (item.recipeNames && item.recipeNames.some((n) => nameSet.has(n))))
  );
  const allConfirmed = tonightItems.length === 0 || tonightItems.every((i) => i.checked);

  if (allConfirmed) {
    return (
      <Pressable
        onPress={onStartCooking}
        style={({ pressed }) => [styles.primaryBtn, styles.primaryBtnLarge, pressed && { opacity: 0.88 }]}
        accessibilityLabel="Start cooking"
        accessibilityRole="button"
      >
        <Ionicons name="flame" size={22} color={Colors.light.onPrimary} />
        <Text style={styles.primaryBtnText}>Start Cooking →</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.ctaStack}>
      <Pressable
        onPress={() => router.push("/(tabs)/grocery")}
        style={styles.secondaryBtn}
        accessibilityLabel="Order missing ingredients"
        accessibilityRole="button"
      >
        <Ionicons name="cart-outline" size={18} color={Colors.light.primary} />
        <Text style={styles.secondaryBtnText}>Order with Instacart</Text>
      </Pressable>
      <Pressable
        onPress={onStartCooking}
        style={({ pressed }) => [styles.ghostBtn, pressed && { opacity: 0.88 }]}
        accessibilityLabel="Start cooking anyway"
        accessibilityRole="button"
      >
        <Text style={styles.ghostBtnText}>Start Cooking Anyway →</Text>
      </Pressable>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: Colors.light.surface,
  },
  headerTitle: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 24,
    color: Colors.light.onSurface,
  },
  avatarBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.light.surfaceContainerLow,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.light.outlineVariant,
  },

  // Hero (State 2)
  heroWrap: {
    height: 240,
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroOverlay: {
    position: "absolute",
    bottom: 14,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroFlag: { fontSize: 22 },
  heroCountry: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#FFFFFF",
  },

  // Recipe info (State 2)
  recipeSection: {
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  recipeName: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 22,
    color: Colors.light.onSurface,
    marginBottom: 4,
    lineHeight: 28,
  },
  recipeMeta: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.light.secondary,
  },

  // Time awareness card
  timeCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginHorizontal: 20,
    padding: 14,
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.outlineVariant,
  },
  timeCardTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.light.onSurface,
    marginBottom: 2,
  },
  timeCardSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.light.secondary,
    lineHeight: 18,
  },

  // Grocery status card
  groceryCard: {
    marginHorizontal: 20,
    padding: 14,
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.outlineVariant,
  },
  groceryCardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  groceryCardTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.light.onSurface,
  },
  groceryCardLink: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.light.primary,
  },
  groceryConfirmed: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  groceryConfirmedText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: "#34c759",
  },
  groceryProgressLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.light.secondary,
  },

  // Shared progress track
  progressTrack: {
    height: 4,
    backgroundColor: Colors.light.surfaceContainerHigh,
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 6,
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.light.primary,
    borderRadius: 2,
  },

  // Primary CTA button
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.light.primary,
    borderRadius: 14,
    height: 52,
    marginHorizontal: 20,
    marginBottom: 10,
  },
  primaryBtnLarge: {
    height: 58,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryBtnText: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 17,
    color: Colors.light.onPrimary,
  },

  // CTA stack (not all confirmed)
  ctaStack: {
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 10,
  },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: Colors.light.primary,
    borderRadius: 14,
    height: 52,
  },
  secondaryBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.light.primary,
  },
  ghostBtn: {
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.light.outlineVariant,
  },
  ghostBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.light.secondary,
  },

  // Empty state (State 3 & 4)
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.surfaceContainerLow,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 22,
    color: Colors.light.onSurface,
    textAlign: "center",
  },
  emptyBody: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.light.secondary,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 280,
  },
  emptyPrimaryBtn: {
    backgroundColor: Colors.light.primary,
    borderRadius: 14,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginTop: 8,
  },
  emptyPrimaryText: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 16,
    color: Colors.light.onPrimary,
  },
  emptySecondaryBtn: {
    borderWidth: 1,
    borderColor: Colors.light.outlineVariant,
    borderRadius: 14,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  emptySecondaryText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.light.secondary,
  },

  // Active session card (State 1)
  activeCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: Colors.light.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.light.outlineVariant,
    marginBottom: 16,
  },
  activeEyebrow: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: Colors.light.primary,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  activeHero: {
    width: "100%",
    height: 160,
  },
  activeBody: {
    padding: 16,
  },
  activeName: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 18,
    color: Colors.light.onSurface,
    marginBottom: 6,
    lineHeight: 24,
  },
  activeMeta: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.light.secondary,
    marginBottom: 8,
  },
});
