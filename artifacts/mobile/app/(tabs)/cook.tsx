import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
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
import { SCROLL_BOTTOM_INSET } from "@/constants/spacing";
import { getRecipeById, getCountryById, type GroceryItem } from "@/constants/data";
import type { Recipe } from "@/constants/data";
import { useApp } from "@/contexts/AppContext";
import { parseTimeMinutes } from "@/hooks/useItinerary";
import ProfileSheet from "@/components/ProfileSheet";

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

function TimeAwarenessCard({ recipe }: { recipe: Recipe }) {
  const now = new Date();
  const hour = now.getHours();
  const cookMinutes = parseTimeMinutes(recipe.time ?? "0");
  const dinnerHour = 19;
  const minutesUntilDinner = (dinnerHour * 60) - (hour * 60 + now.getMinutes());
  const startBy = dinnerHour - Math.ceil(cookMinutes / 60);
  const isLate = minutesUntilDinner < cookMinutes;
  const isUrgent = minutesUntilDinner < cookMinutes + 30;

  if (hour >= dinnerHour + 2) return null;

  if (isLate) {
    return (
      <View style={[styles.timeCard, styles.timeCardWarning]}>
        <Ionicons name="warning-outline" size={18} color="#FF9500" />
        <View style={styles.timeCardBody}>
          <Text style={styles.timeCardTitle}>Running late for tonight</Text>
          <Text style={styles.timeCardSub}>{recipe.name} takes {recipe.time}. Consider a faster recipe.</Text>
        </View>
      </View>
    );
  }

  if (isUrgent) {
    return (
      <View style={[styles.timeCard, styles.timeCardUrgent]}>
        <Ionicons name="time-outline" size={18} color={Colors.light.primary} />
        <View style={styles.timeCardBody}>
          <Text style={styles.timeCardTitle}>Start cooking soon</Text>
          <Text style={styles.timeCardSub}>Begin by {startBy > 12 ? startBy - 12 : startBy}:00 {startBy >= 12 ? "PM" : "AM"} for dinner at 7 PM.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.timeCard}>
      <Ionicons name="checkmark-circle-outline" size={18} color="#34c759" />
      <View style={styles.timeCardBody}>
        <Text style={styles.timeCardTitle}>Good timing</Text>
        <Text style={styles.timeCardSub}>Start by {startBy > 12 ? startBy - 12 : startBy}:00 {startBy >= 12 ? "PM" : "AM"} for dinner at 7 PM.</Text>
      </View>
    </View>
  );
}

function GroceryStatusCard({ recipeNames, groceryItems }: { recipeNames: Set<string>; groceryItems: GroceryItem[] }) {
  const tonightItems = groceryItems.filter(
    (item) =>
      !item.excluded &&
      (recipeNames.has(item.recipeName) ||
        (item.recipeNames && item.recipeNames.some((n) => recipeNames.has(n))))
  );
  const checkedCount = tonightItems.filter((i) => i.checked).length;
  const total = tonightItems.length;
  const allConfirmed = total > 0 && checkedCount === total;

  if (total === 0) return null;

  return (
    <View style={styles.groceryCard}>
      <View style={styles.groceryCardHeader}>
        <Text style={styles.groceryCardTitle}>Ingredients</Text>
        <Pressable onPress={() => router.push("/(tabs)/grocery")} accessibilityLabel="View grocery list">
          <Text style={styles.groceryCardLink}>View list →</Text>
        </Pressable>
      </View>
      {allConfirmed ? (
        <View style={styles.groceryConfirmed}>
          <Ionicons name="checkmark-circle" size={18} color="#34c759" />
          <Text style={styles.groceryConfirmedText}>All {total} ingredients confirmed</Text>
        </View>
      ) : (
        <>
          <View style={styles.groceryProgressTrack}>
            <View style={[styles.groceryProgressFill, { width: `${(checkedCount / total) * 100}%` as `${number}%` }]} />
          </View>
          <Text style={styles.groceryProgressLabel}>{checkedCount} of {total} confirmed</Text>
        </>
      )}
    </View>
  );
}

function CookCTA({
  allConfirmed,
  onStartCooking,
}: {
  allConfirmed: boolean;
  onStartCooking: () => void;
}) {
  if (allConfirmed) {
    return (
      <Pressable
        onPress={onStartCooking}
        style={({ pressed }) => [styles.startBtn, pressed && { opacity: 0.88 }]}
        accessibilityLabel="Start cooking"
      >
        <Ionicons name="flame" size={22} color={Colors.light.onPrimary} />
        <Text style={styles.startBtnText}>Start Cooking →</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.ctaRow}>
      <Pressable
        onPress={() => router.push("/(tabs)/grocery")}
        style={styles.instacartBtn}
        accessibilityLabel="Order with Instacart"
      >
        <Ionicons name="cart-outline" size={18} color={Colors.light.primary} />
        <Text style={styles.instacartBtnText}>Order with Instacart</Text>
      </Pressable>
      <Pressable
        onPress={onStartCooking}
        style={({ pressed }) => [styles.cookAnywayBtn, pressed && { opacity: 0.88 }]}
        accessibilityLabel="Start cooking anyway"
      >
        <Text style={styles.cookAnywayText}>Start Cooking Anyway →</Text>
      </Pressable>
    </View>
  );
}

export default function CookScreen() {
  const insets = useSafeAreaInsets();
  const {
    currentItinerary,
    activeCookSession,
    setActiveCookSession,
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
    const ids = todayDay.mode === "quick" ? todayDay.quickRecipeIds : todayDay.fullRecipeIds;
    return [...ids, ...(todayDay.extraRecipeIds ?? [])];
  }, [todayDay]);

  const recipes = useMemo(() => recipeIds.map(getRecipeById).filter((r): r is Recipe => r != null), [recipeIds]);

  const heroRecipe = useMemo(() => recipes.find((r) => r.category === "Main Course") ?? recipes[0] ?? null, [recipes]);

  const recipeNames = useMemo(() => {
    const names = new Set<string>();
    for (const r of recipes) names.add(r.name);
    return names;
  }, [recipes]);

  const tonightGroceryStatus = useMemo(() => {
    if (recipeNames.size === 0) return { allConfirmed: false, hasItems: false };
    const tonightItems = groceryItems.filter(
      (item) =>
        !item.excluded &&
        (recipeNames.has(item.recipeName) ||
          (item.recipeNames && item.recipeNames.some((n) => recipeNames.has(n))))
    );
    const total = tonightItems.length;
    const checkedCount = tonightItems.filter((i) => i.checked).length;
    return { allConfirmed: total > 0 && checkedCount === total, hasItems: total > 0 };
  }, [recipeNames, groceryItems]);

  const activeRecipe = activeCookSession ? getRecipeById(activeCookSession.recipeId) : null;
  const hasActiveSession = activeCookSession != null && activeRecipe != null;

  const handleStartCooking = useCallback(() => {
    if (!heroRecipe) return;
    haptic("medium");
    router.push({ pathname: "/cook-mode", params: { recipeId: heroRecipe.id } });
  }, [heroRecipe]);

  const handleAbandonSession = useCallback(() => {
    if (Platform.OS === "web") {
      setActiveCookSession(null);
      return;
    }
    Alert.alert(
      `Stop cooking ${activeCookSession?.recipeName}?`,
      "Your progress won\u2019t be saved.",
      [
        { text: "Keep Cooking", style: "cancel" },
        { text: "Abandon", style: "destructive", onPress: () => setActiveCookSession(null) },
      ]
    );
  }, [activeCookSession, setActiveCookSession]);

  const country = todayDay ? getCountryById(todayDay.countryId) : null;

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
            <Ionicons name="person" size={18} color={Colors.light.primary} />
          </View>
        </Pressable>
      </View>

      {showProfile && <ProfileSheet onClose={() => setShowProfile(false)} />}

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 120 : insets.bottom + SCROLL_BOTTOM_INSET }}
      >
        {hasActiveSession && activeCookSession && activeRecipe ? (
          <View style={styles.activeSession}>
            <Text style={styles.activeLabel}>IN THE KITCHEN</Text>
            <View style={styles.activeHeroWrap}>
              <Image
                source={{ uri: activeRecipe.image }}
                style={styles.activeHeroImage}
                contentFit="cover"
                placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }}
                onError={(e) => console.warn("[Image]", e.error)}
              />
            </View>
            <View style={styles.activeBody}>
              <Text style={styles.activeName}>{activeRecipe.name}</Text>
              <Text style={styles.activeStep}>
                Step {activeCookSession.currentStep + 1} of {activeRecipe.steps?.length ?? activeCookSession.totalSteps}
              </Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${((activeCookSession.currentStep + 1) / (activeRecipe.steps?.length ?? activeCookSession.totalSteps)) * 100}%` as `${number}%` }]} />
              </View>
            </View>
            <Pressable
              onPress={() => router.push({ pathname: "/cook-mode", params: { recipeId: activeCookSession.recipeId, resumeStep: String(activeCookSession.currentStep) } })}
              style={({ pressed }) => [styles.resumeBtn, pressed && { opacity: 0.88 }]}
              accessibilityLabel="Resume cooking"
            >
              <Ionicons name="flame" size={20} color={Colors.light.onPrimary} />
              <Text style={styles.resumeBtnText}>Resume Cooking →</Text>
            </Pressable>
            <Pressable onPress={handleAbandonSession} style={{ alignItems: "center", paddingVertical: 12 }}>
              <Text style={styles.abandonLink}>Abandon session</Text>
            </Pressable>
          </View>
        ) : isCompleted && heroRecipe ? (
          <View style={styles.completedState}>
            <Text style={styles.completedEmoji}>🎉</Text>
            <Text style={styles.completedTitle}>Great cook tonight!</Text>
            <Text style={styles.completedBody}>You made {heroRecipe.name}.</Text>
            <Pressable
              onPress={() => { haptic(); router.push("/(tabs)/plan"); }}
              style={styles.emptyPrimaryBtn}
            >
              <Text style={styles.emptyPrimaryText}>See Tomorrow's Plan →</Text>
            </Pressable>
          </View>
        ) : isActive && heroRecipe ? (
          <View style={styles.readyState}>
            <View style={styles.heroWrap}>
              <Image
                source={{ uri: heroRecipe.image }}
                style={styles.heroImage}
                contentFit="cover"
                placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }}
                onError={(e) => console.warn("[Image]", e.error)}
              />
              <LinearGradient colors={["transparent", "rgba(0,0,0,0.6)"]} style={StyleSheet.absoluteFill} />
              <View style={styles.heroOverlay}>
                <Text style={styles.heroFlag}>{country?.flag}</Text>
                <Text style={styles.heroCountry}>{country?.name}</Text>
              </View>
            </View>

            <View style={styles.recipeInfo}>
              <Text style={styles.recipeName}>{heroRecipe.name}</Text>
              <Text style={styles.recipeMeta}>
                {heroRecipe.time}{recipes.length > 1 ? ` · ${recipes.length} courses` : ""}
              </Text>
            </View>

            <View style={styles.cardsSection}>
              <TimeAwarenessCard recipe={heroRecipe} />
              <GroceryStatusCard recipeNames={recipeNames} groceryItems={groceryItems} />
              <CookCTA
                allConfirmed={tonightGroceryStatus.allConfirmed || !tonightGroceryStatus.hasItems}
                onStartCooking={handleStartCooking}
              />
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="flame-outline" size={48} color={Colors.light.primary} />
            </View>
            <Text style={styles.emptyTitle}>Nothing planned for tonight</Text>
            <Text style={styles.emptyBody}>Head to Plan to set up tonight's dinner, or browse recipes for inspiration.</Text>
            <View style={styles.emptyActions}>
              <Pressable
                onPress={() => { haptic(); router.push("/(tabs)/plan"); }}
                style={styles.emptyPrimaryBtn}
                accessibilityLabel="Go to plan"
              >
                <Text style={styles.emptyPrimaryText}>Plan Tonight →</Text>
              </Pressable>
              <Pressable
                onPress={() => { haptic(); router.push("/(tabs)/search"); }}
                style={styles.emptySecondaryBtn}
                accessibilityLabel="Browse recipes"
              >
                <Text style={styles.emptySecondaryText}>Browse Recipes</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  headerTitle: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 28,
    color: Colors.light.onSurface,
  },
  avatarBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.surfaceContainerLow,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.light.outlineVariant,
  },

  activeSession: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  activeLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    letterSpacing: 2,
    color: Colors.light.primary,
    marginBottom: 16,
  },
  activeHeroWrap: {
    height: 220,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: Colors.light.surfaceContainerHigh,
  },
  activeHeroImage: {
    width: "100%",
    height: "100%",
  },
  activeBody: {
    paddingTop: 16,
    gap: 6,
  },
  activeName: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 22,
    color: Colors.light.onSurface,
    lineHeight: 28,
  },
  activeStep: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.light.secondary,
  },
  progressTrack: {
    width: "100%",
    height: 6,
    backgroundColor: "rgba(222,193,179,0.2)",
    borderRadius: 3,
    overflow: "hidden",
    marginTop: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.light.primary,
    borderRadius: 3,
  },
  resumeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.light.primary,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 20,
  },
  resumeBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.light.onPrimary,
  },
  abandonLink: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.light.secondary,
    textDecorationLine: "underline",
  },

  completedState: {
    alignItems: "center",
    paddingHorizontal: 40,
    paddingTop: 80,
    gap: 12,
  },
  completedEmoji: {
    fontSize: 56,
    marginBottom: 8,
  },
  completedTitle: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 24,
    color: Colors.light.onSurface,
    textAlign: "center",
  },
  completedBody: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.light.secondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 12,
  },

  readyState: {
    paddingBottom: 24,
  },
  heroWrap: {
    height: 220,
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: Colors.light.surfaceContainerHigh,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroOverlay: {
    position: "absolute",
    bottom: 16,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroFlag: {
    fontSize: 20,
  },
  heroCountry: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  recipeInfo: {
    paddingHorizontal: 24,
    paddingTop: 20,
    gap: 4,
  },
  recipeName: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 24,
    color: Colors.light.onSurface,
    lineHeight: 30,
  },
  recipeMeta: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.light.secondary,
  },

  cardsSection: {
    paddingHorizontal: 24,
    paddingTop: 20,
    gap: 16,
  },

  timeCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: 12,
    padding: 16,
  },
  timeCardWarning: {
    backgroundColor: "rgba(255,149,0,0.08)",
  },
  timeCardUrgent: {
    backgroundColor: "rgba(154,65,0,0.06)",
  },
  timeCardBody: {
    flex: 1,
    gap: 4,
  },
  timeCardTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.light.onSurface,
  },
  timeCardSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.light.secondary,
    lineHeight: 18,
  },

  groceryCard: {
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  groceryCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  groceryCardTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.light.onSurface,
  },
  groceryCardLink: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.light.primary,
  },
  groceryConfirmed: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  groceryConfirmedText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: "#34c759",
  },
  groceryProgressTrack: {
    width: "100%",
    height: 5,
    backgroundColor: "rgba(222,193,179,0.2)",
    borderRadius: 3,
    overflow: "hidden",
  },
  groceryProgressFill: {
    height: "100%",
    backgroundColor: Colors.light.primary,
    borderRadius: 3,
  },
  groceryProgressLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.light.secondary,
  },

  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.light.primary,
    paddingVertical: 18,
    borderRadius: 16,
  },
  startBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: Colors.light.onPrimary,
  },
  ctaRow: {
    gap: 12,
  },
  instacartBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.light.primary,
    backgroundColor: "rgba(154,65,0,0.04)",
  },
  instacartBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.light.primary,
  },
  cookAnywayBtn: {
    alignItems: "center",
    paddingVertical: 14,
  },
  cookAnywayText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.light.primary,
  },

  emptyState: {
    alignItems: "center",
    paddingHorizontal: 40,
    paddingTop: 80,
    gap: 12,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(154,65,0,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
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
    marginBottom: 8,
  },
  emptyActions: {
    width: "100%",
    gap: 12,
    marginTop: 8,
  },
  emptyPrimaryBtn: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    width: "100%",
  },
  emptyPrimaryText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.light.onPrimary,
  },
  emptySecondaryBtn: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: Colors.light.outlineVariant,
  },
  emptySecondaryText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.light.secondary,
  },
});
