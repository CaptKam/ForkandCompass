import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useMemo } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import TabHeader from "@/components/TabHeader";
import Colors from "@/constants/colors";
import { getCountryById, getRecipeById } from "@/constants/data";
import { useApp } from "@/contexts/AppContext";
import { reloadDay, generateItinerary, type ItineraryDay } from "@/hooks/useItinerary";

function toISODate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function getWeekLabel(days: ItineraryDay[]): string {
  if (days.length === 0) return "";
  const first = new Date(days[0].date + "T12:00:00");
  const last = new Date(days[days.length - 1].date + "T12:00:00");
  const fmtDate = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `This Week · ${fmtDate(first)} – ${fmtDate(last)}`;
}

export default function ItineraryScreen() {
  const insets = useSafeAreaInsets();
  const {
    itineraryProfile,
    currentItinerary,
    setCurrentItinerary,
    selectedCountryIds,
    itineraryHistory,
    addToItineraryHistory,
    addToGrocery,
  } = useApp();

  const haptic = () => {
    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const today = toISODate(new Date());

  const todayDay = useMemo(
    () => currentItinerary.find((d) => d.date === today && d.status === "active"),
    [currentItinerary, today]
  );

  const totalIngredientCount = useMemo(() => {
    let count = 0;
    for (const day of currentItinerary) {
      if (day.status !== "active") continue;
      const recipeIds = day.mode === "quick" ? day.quickRecipeIds : day.fullRecipeIds;
      for (const rid of recipeIds) {
        const recipe = getRecipeById(rid);
        if (recipe) count += recipe.ingredients.length;
      }
    }
    return count;
  }, [currentItinerary]);

  const handleReloadDay = (day: ItineraryDay) => {
    haptic();
    const updated = reloadDay(day, currentItinerary, itineraryProfile!, selectedCountryIds);
    setCurrentItinerary(
      currentItinerary.map((d) => (d.id === day.id ? updated : d))
    );
  };

  const handleSkipDay = (day: ItineraryDay) => {
    haptic();
    setCurrentItinerary(
      currentItinerary.map((d) =>
        d.id === day.id ? { ...d, status: "skipped" as const } : d
      )
    );
  };

  const handleRestoreDay = (day: ItineraryDay) => {
    haptic();
    setCurrentItinerary(
      currentItinerary.map((d) =>
        d.id === day.id ? { ...d, status: "active" as const } : d
      )
    );
  };

  const handleToggleMode = (day: ItineraryDay) => {
    haptic();
    const newMode = day.mode === "quick" ? "full" : "quick";
    setCurrentItinerary(
      currentItinerary.map((d) =>
        d.id === day.id ? { ...d, mode: newMode as "quick" | "full" } : d
      )
    );
  };

  const handleGetAllIngredients = () => {
    haptic();
    for (const day of currentItinerary) {
      if (day.status !== "active") continue;
      const recipeIds = day.mode === "quick" ? day.quickRecipeIds : day.fullRecipeIds;
      for (const rid of recipeIds) {
        const recipe = getRecipeById(rid);
        if (recipe) addToGrocery(recipe);
      }
    }
  };

  const handleNewWeek = () => {
    haptic();
    if (currentItinerary.length > 0) {
      addToItineraryHistory(currentItinerary);
    }
    const itinerary = generateItinerary(
      itineraryProfile!,
      selectedCountryIds,
      itineraryHistory
    );
    setCurrentItinerary(itinerary);
  };

  // State A: No profile
  if (!itineraryProfile) {
    return (
      <View style={styles.container}>
        <TabHeader title="Culinary Itinerary" />
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="map-outline" size={48} color={Colors.light.outlineVariant} />
          </View>
          <Text style={styles.emptyTitle}>Plan your culinary week</Text>
          <Text style={styles.emptySubtitle}>
            One tap, your whole week of dinners planned.{"\n"}Each night is a new destination.
          </Text>
          <Pressable
            onPress={() => { haptic(); router.push("/itinerary-setup"); }}
            style={({ pressed }) => [styles.ctaButton, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.ctaText}>Plan My Week</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const allDone = currentItinerary.length > 0 && currentItinerary.every(
    (d) => d.status === "completed" || d.status === "skipped"
  );

  const weekAhead = currentItinerary.filter((d) => d.date !== today || d.status !== "active");

  return (
    <View style={styles.container}>
      <TabHeader
        title="Culinary Itinerary"
        rightExtra={
          <Pressable
            onPress={() => { haptic(); router.push("/itinerary-setup"); }}
            hitSlop={8}
          >
            <Text style={styles.editPrefText}>Edit</Text>
          </Pressable>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: Platform.OS === "web" ? 140 : insets.bottom + 140,
          paddingHorizontal: 20,
          paddingTop: 8,
        }}
      >
        {/* Week label */}
        <Text style={styles.weekLabel}>{getWeekLabel(currentItinerary)}</Text>

        {allDone ? (
          <View style={styles.allDoneContainer}>
            <Text style={styles.allDoneTitle}>Week complete!</Text>
            <Text style={styles.allDoneSubtitle}>Ready for your next culinary adventure?</Text>
            <Pressable
              onPress={handleNewWeek}
              style={({ pressed }) => [styles.ctaButton, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.ctaText}>Plan Next Week</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Tonight's Dinner Card */}
            {todayDay && (
              <TonightCard
                day={todayDay}
                onToggleMode={() => handleToggleMode(todayDay)}
              />
            )}

            {/* The Week Ahead */}
            <View style={styles.weekSection}>
              <Text style={styles.sectionLabel}>The Week Ahead</Text>
              <View style={styles.weekList}>
                {currentItinerary.map((day) => (
                  <DayCard
                    key={day.id}
                    day={day}
                    isToday={day.date === today}
                    onReload={() => handleReloadDay(day)}
                    onSkip={() => handleSkipDay(day)}
                    onRestore={() => handleRestoreDay(day)}
                    onToggleMode={() => handleToggleMode(day)}
                  />
                ))}
              </View>
            </View>

            {/* New week link */}
            <Pressable
              onPress={handleNewWeek}
              style={({ pressed }) => [styles.newWeekRow, pressed && { opacity: 0.6 }]}
            >
              <Ionicons name="refresh-outline" size={15} color={Colors.light.secondary} />
              <Text style={styles.newWeekText}>Generate new week</Text>
            </Pressable>
          </>
        )}
      </ScrollView>

      {/* Floating "Get All Ingredients" FAB */}
      {!allDone && (
        <View style={[styles.fabWrapper, { bottom: (Platform.OS === "web" ? 80 : insets.bottom + 80) }]}>
          <Pressable
            onPress={handleGetAllIngredients}
            style={({ pressed }) => [styles.fab, pressed && { opacity: 0.9 }]}
          >
            <View style={styles.fabLeft}>
              <Ionicons name="basket-outline" size={20} color="#FFFFFF" />
              <Text style={styles.fabText}>Get All Ingredients</Text>
            </View>
            <View style={styles.fabBadge}>
              <Text style={styles.fabBadgeText}>{totalIngredientCount}</Text>
            </View>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function TonightCard({ day, onToggleMode }: { day: ItineraryDay; onToggleMode: () => void }) {
  const country = getCountryById(day.countryId);
  const recipeIds = day.mode === "quick" ? day.quickRecipeIds : day.fullRecipeIds;
  const mainRecipe = getRecipeById(recipeIds[0]);
  const recipes = recipeIds.map(getRecipeById).filter(Boolean);

  if (!country || !mainRecipe) return null;

  const title = recipes.length > 1
    ? recipes.map((r) => r?.name).join(" + ")
    : mainRecipe.name;

  return (
    <Pressable
      onPress={() => router.push({ pathname: "/recipe/[id]", params: { id: mainRecipe.id } })}
      style={({ pressed }) => [styles.tonightCard, pressed && { opacity: 0.96 }]}
    >
      {/* Hero image */}
      <View style={styles.tonightImageWrapper}>
        <Image
          source={{ uri: mainRecipe.image }}
          style={styles.tonightImage}
          contentFit="cover"
        />
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.62)"]}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.tonightOverlayLabel}>
          <Text style={styles.tonightSelectionLabel}>TONIGHT'S SELECTION</Text>
        </View>
      </View>

      {/* Card body */}
      <View style={styles.tonightBody}>
        <Text style={styles.tonightTitle} numberOfLines={2}>{title}</Text>

        <View style={styles.tonightMeta}>
          <Pressable onPress={onToggleMode} style={styles.modeChip}>
            <Text style={styles.modeChipText}>
              {day.mode === "quick" ? "Quick Meal" : "Full Experience"}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push({ pathname: "/recipe/[id]", params: { id: mainRecipe.id } })}
            style={styles.viewLink}
          >
            <Text style={styles.viewLinkText}>View Full Experience</Text>
            <Ionicons name="arrow-forward" size={12} color={Colors.light.primary} />
          </Pressable>

          <Pressable
            onPress={() => router.push({ pathname: "/cook-mode", params: { id: mainRecipe.id } })}
            style={styles.startCookingBtn}
          >
            <Text style={styles.startCookingText}>Start Cooking</Text>
            <Ionicons name="arrow-forward" size={14} color="#fff" />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

function DayCard({
  day,
  isToday,
  onReload,
  onSkip,
  onRestore,
  onToggleMode,
}: {
  day: ItineraryDay;
  isToday: boolean;
  onReload: () => void;
  onSkip: () => void;
  onRestore: () => void;
  onToggleMode: () => void;
}) {
  const country = getCountryById(day.countryId);
  const recipeIds = day.mode === "quick" ? day.quickRecipeIds : day.fullRecipeIds;
  const recipes = recipeIds.map(getRecipeById).filter(Boolean);
  const isSkipped = day.status === "skipped";

  if (!country) return null;

  const recipeTitle = recipes.map((r) => r?.name).join(" + ");

  return (
    <Pressable
      onPress={() => {
        if (!isSkipped && recipes[0]) {
          router.push({ pathname: "/recipe/[id]", params: { id: recipes[0]!.id } });
        }
      }}
      style={({ pressed }) => [
        styles.dayCard,
        isToday && styles.dayCardToday,
        isSkipped && styles.dayCardSkipped,
        pressed && !isSkipped && { opacity: 0.9 },
      ]}
    >
      {/* Day label column */}
      <View style={[styles.dayLabelCol, isToday && styles.dayLabelColActive]}>
        <Text style={[styles.dayAbbrev, isToday && styles.dayAbbrevActive]}>
          {day.dayLabel.slice(0, 3).toUpperCase()}
        </Text>
      </View>

      {/* Content */}
      <View style={styles.dayContent}>
        <Text style={[styles.dayCountryLabel, isSkipped && { opacity: 0.4 }]}>
          {country.name.toUpperCase()}
        </Text>
        <Text style={[styles.dayRecipeTitle, isSkipped && { opacity: 0.4 }]} numberOfLines={2}>
          {isSkipped ? "Day skipped" : recipeTitle}
        </Text>

        {!isSkipped && (
          <View style={styles.dayActions}>
            <Pressable onPress={onReload} style={styles.actionBtn} hitSlop={8}>
              <Ionicons name="refresh" size={16} color={Colors.light.secondary} />
            </Pressable>
            <Pressable onPress={onSkip} style={styles.actionBtn} hitSlop={8}>
              <Ionicons name="close" size={16} color={Colors.light.secondary} />
            </Pressable>
          </View>
        )}
        {isSkipped && (
          <Pressable onPress={onRestore} style={styles.restoreBtn} hitSlop={8}>
            <Ionicons name="add" size={14} color={Colors.light.primary} />
            <Text style={styles.restoreText}>Restore</Text>
          </Pressable>
        )}
      </View>

      {/* Chevron */}
      {!isSkipped && (
        <Ionicons name="chevron-forward" size={18} color={Colors.light.outlineVariant} style={styles.chevron} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
  },
  editPrefText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    lineHeight: 18,
    color: Colors.light.primary,
    letterSpacing: 0.2,
  },
  weekLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.secondary,
    letterSpacing: 0.4,
    marginBottom: 16,
  },

  /* Empty State */
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 16,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.light.surfaceContainerLow,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 24,
    color: Colors.light.onSurface,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 17,
    color: Colors.light.secondary,
    textAlign: "center",
    lineHeight: 26,
  },

  /* CTA */
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.primary,
    borderRadius: 50,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
    width: "100%",
    marginTop: 8,
    minHeight: 52,
  },
  ctaText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },

  /* Tonight Card */
  tonightCard: {
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 28,
    backgroundColor: Colors.light.surfaceContainerHigh,
    shadowColor: "#1D1B18",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  tonightImageWrapper: {
    height: 190,
    width: "100%",
    position: "relative",
  },
  tonightImage: {
    width: "100%",
    height: 190,
  },
  tonightOverlayLabel: {
    position: "absolute",
    bottom: 14,
    left: 18,
  },
  tonightSelectionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(255,255,255,0.90)",
    letterSpacing: 2.2,
    textTransform: "uppercase",
  },
  tonightBody: {
    padding: 20,
    gap: 14,
  },
  tonightTitle: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 22,
    color: Colors.light.onSurface,
    letterSpacing: -0.3,
    lineHeight: 30,
  },
  tonightMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  modeChip: {
    backgroundColor: Colors.light.primaryContainer + "22",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: Colors.light.primary + "30",
    minHeight: 48,
    justifyContent: "center",
  },
  modeChipText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    lineHeight: 18,
    color: Colors.light.primary,
    letterSpacing: 0.3,
  },
  viewLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  viewLinkText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    lineHeight: 18,
    color: Colors.light.primary,
    textDecorationLine: "underline",
  },
  startCookingBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 50,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
    minHeight: 48,
  },
  startCookingText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    lineHeight: 18,
    color: "#FFFFFF",
  },

  /* Week Section */
  weekSection: {
    gap: 14,
  },
  sectionLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.secondary,
    letterSpacing: 1.8,
    textTransform: "uppercase",
  },
  weekList: {
    gap: 10,
  },

  /* Day Card */
  dayCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
  },
  dayCardToday: {
    borderWidth: 1.5,
    borderColor: Colors.light.primary + "50",
    backgroundColor: Colors.light.surfaceContainerLow,
  },
  dayCardSkipped: {
    opacity: 0.55,
    borderWidth: 1,
    borderColor: Colors.light.outlineVariant,
    borderStyle: "dashed",
  },
  dayLabelCol: {
    width: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingRight: 4,
    borderRightWidth: 1.5,
    borderRightColor: Colors.light.outlineVariant + "40",
  },
  dayLabelColActive: {
    borderRightColor: Colors.light.primary + "50",
  },
  dayAbbrev: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.secondary,
    letterSpacing: 1.2,
  },
  dayAbbrevActive: {
    color: Colors.light.primary,
  },
  dayContent: {
    flex: 1,
    gap: 8,
  },
  dayCountryLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.primary,
    letterSpacing: 1.5,
  },
  dayRecipeTitle: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 16,
    color: Colors.light.onSurface,
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  dayActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },
  actionBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.light.outlineVariant + "60",
    alignItems: "center",
    justifyContent: "center",
  },
  restoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  restoreText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.primary,
  },
  chevron: {
    marginLeft: 4,
  },

  /* New week link */
  newWeekRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 20,
    paddingVertical: 14,
  },
  newWeekText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    lineHeight: 18,
    color: Colors.light.secondary,
  },

  /* FAB */
  fabWrapper: {
    position: "absolute",
    left: 20,
    right: 20,
    zIndex: 40,
  },
  fab: {
    backgroundColor: Colors.light.primary,
    borderRadius: 50,
    paddingVertical: 16,
    paddingHorizontal: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#1D1B18",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 8,
  },
  fabLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  fabText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  fabBadge: {
    backgroundColor: "rgba(255,255,255,0.22)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 50,
  },
  fabBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    lineHeight: 20,
    color: "#FFFFFF",
  },

  /* All Done */
  allDoneContainer: {
    alignItems: "center",
    paddingTop: 60,
    gap: 12,
  },
  allDoneTitle: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 24,
    color: Colors.light.onSurface,
  },
  allDoneSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 17,
    lineHeight: 26,
    color: Colors.light.secondary,
    marginBottom: 8,
  },
});
