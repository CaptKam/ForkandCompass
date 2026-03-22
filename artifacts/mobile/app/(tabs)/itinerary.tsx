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
import { COUNTRIES, getCountryById, getRecipeById } from "@/constants/data";
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
        <TabHeader title="Itinerary" />
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="map-outline" size={48} color={Colors.light.outlineVariant} />
          </View>
          <Text style={styles.emptyTitle}>Plan your culinary week</Text>
          <Text style={styles.emptySubtitle}>
            One tap, your whole week of dinners planned.{"\n"}Each night is a new destination.
          </Text>
          <Pressable
            onPress={() => {
              haptic();
              router.push("/itinerary-setup");
            }}
            style={({ pressed }) => [styles.ctaButton, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.ctaText}>Plan My Week</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // State C: All past/completed
  const allDone = currentItinerary.length > 0 && currentItinerary.every(
    (d) => d.status === "completed" || d.status === "skipped"
  );

  return (
    <View style={styles.container}>
      <TabHeader
        title="Itinerary"
        rightExtra={
          <Pressable
            onPress={() => {
              haptic();
              router.push("/itinerary-setup");
            }}
            hitSlop={8}
          >
            <Text style={styles.editPrefText}>Edit preferences</Text>
          </Pressable>
        }
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: Platform.OS === "web" ? 120 : insets.bottom + 120,
          paddingHorizontal: 20,
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
            {todayDay && <TonightCard day={todayDay} />}

            {/* Week View */}
            <View style={styles.weekSection}>
              <Text style={styles.sectionLabel}>YOUR WEEK</Text>
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

            {/* Bottom Actions */}
            <View style={styles.bottomActions}>
              <Pressable
                onPress={handleGetAllIngredients}
                style={({ pressed }) => [styles.ctaButton, pressed && { opacity: 0.85 }]}
              >
                <Ionicons name="cart-outline" size={20} color="#FFFFFF" />
                <Text style={styles.ctaText}>
                  Get All Ingredients ({totalIngredientCount})
                </Text>
              </Pressable>
              <Pressable
                onPress={handleNewWeek}
                style={({ pressed }) => [styles.secondaryButton, pressed && { opacity: 0.7 }]}
              >
                <Ionicons name="refresh-outline" size={18} color={Colors.light.primary} />
                <Text style={styles.secondaryButtonText}>New Week</Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function TonightCard({ day }: { day: ItineraryDay }) {
  const country = getCountryById(day.countryId);
  const recipeIds = day.mode === "quick" ? day.quickRecipeIds : day.fullRecipeIds;
  const mainRecipe = getRecipeById(recipeIds[0]);
  const recipes = recipeIds.map(getRecipeById).filter(Boolean);
  const totalTime = recipes.reduce((sum, r) => {
    if (!r) return sum;
    const match = r.time.match(/(\d+)/);
    return sum + (match ? parseInt(match[1], 10) : 0);
  }, 0);

  if (!country || !mainRecipe) return null;

  return (
    <Pressable
      onPress={() => router.push({ pathname: "/recipe/[id]", params: { id: mainRecipe.id } })}
      style={({ pressed }) => [styles.tonightCard, pressed && { opacity: 0.95 }]}
    >
      <Image
        source={{ uri: mainRecipe.image }}
        style={styles.tonightImage}
        contentFit="cover"
      />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.65)"]}
        style={styles.tonightGradient}
      />
      <View style={styles.tonightContent}>
        <Text style={styles.tonightLabel}>TONIGHT'S DINNER</Text>
        <Text style={styles.tonightCountry}>
          {country.flag} {country.name}
        </Text>
        <Text style={styles.tonightRecipes} numberOfLines={2}>
          {recipes.map((r) => r?.name).join(" · ")}
        </Text>
        <View style={styles.tonightBottom}>
          <View style={styles.timeChip}>
            <Ionicons name="time-outline" size={14} color={Colors.light.secondary} />
            <Text style={styles.timeChipText}>{totalTime} min</Text>
          </View>
          <View style={styles.startCookingButton}>
            <Text style={styles.startCookingText}>Start Cooking</Text>
          </View>
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
  const totalTime = recipes.reduce((sum, r) => {
    if (!r) return sum;
    const match = r.time.match(/(\d+)/);
    return sum + (match ? parseInt(match[1], 10) : 0);
  }, 0);
  const isSkipped = day.status === "skipped";

  if (!country) return null;

  return (
    <View
      style={[
        styles.dayCard,
        isToday && styles.dayCardToday,
        isSkipped && styles.dayCardSkipped,
      ]}
    >
      <View style={styles.dayCardHeader}>
        <View style={styles.dayCardLeft}>
          <View style={styles.dayLabelRow}>
            <Text style={[styles.dayLabel, isSkipped && styles.textSkipped]}>
              {day.dayLabel.toUpperCase()}
            </Text>
            {isToday && (
              <View style={styles.todayBadge}>
                <Text style={styles.todayBadgeText}>Today</Text>
              </View>
            )}
            {isSkipped && (
              <View style={styles.skippedBadge}>
                <Text style={styles.skippedBadgeText}>Skipped</Text>
              </View>
            )}
          </View>
          <Text style={[styles.dayCountry, isSkipped && styles.textSkipped]}>
            {country.flag} {country.name}
          </Text>
          <Text style={[styles.dayRegion, isSkipped && styles.textSkipped]}>
            {country.region}
          </Text>
        </View>

        <View style={styles.dayCardActions}>
          {isSkipped ? (
            <Pressable onPress={onRestore} style={styles.restoreButton}>
              <Ionicons name="add" size={20} color={Colors.light.primary} />
            </Pressable>
          ) : (
            <>
              <Pressable onPress={onReload} style={styles.actionButton} hitSlop={8}>
                <Ionicons name="refresh" size={18} color={Colors.light.secondary} />
              </Pressable>
              <Pressable onPress={onSkip} style={styles.actionButton} hitSlop={8}>
                <Ionicons name="close" size={18} color={Colors.light.secondary} />
              </Pressable>
            </>
          )}
        </View>
      </View>

      {!isSkipped && (
        <>
          <Text style={styles.dayRecipes} numberOfLines={2}>
            {recipes.map((r) => r?.name).join(" · ")}
          </Text>
          <View style={styles.dayCardFooter}>
            <View style={styles.timeChip}>
              <Ionicons name="time-outline" size={12} color={Colors.light.secondary} />
              <Text style={styles.timeChipTextSmall}>{totalTime} min</Text>
            </View>
            <Pressable onPress={onToggleMode} style={styles.modePill}>
              <Text style={[
                styles.modePillText,
                day.mode === "full" && styles.modePillTextActive,
              ]}>
                {day.mode === "quick" ? "Quick Meal" : "Full Experience"}
              </Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
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
    color: Colors.light.primary,
    letterSpacing: 0.2,
  },
  weekLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.light.secondary,
    letterSpacing: 0.3,
    marginBottom: 20,
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
    fontSize: 15,
    color: Colors.light.secondary,
    textAlign: "center",
    lineHeight: 22,
  },

  /* CTA */
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
    width: "100%",
    marginTop: 8,
  },
  ctaText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: Colors.light.primary,
    gap: 6,
    width: "100%",
  },
  secondaryButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.light.primary,
  },

  /* Tonight's Dinner */
  tonightCard: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 24,
    backgroundColor: Colors.light.surfaceContainerLow,
  },
  tonightImage: {
    width: "100%",
    height: 180,
  },
  tonightGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 180,
  },
  tonightContent: {
    padding: 16,
    gap: 6,
  },
  tonightLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    color: Colors.light.primary,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  tonightCountry: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 20,
    color: Colors.light.onSurface,
    letterSpacing: -0.3,
  },
  tonightRecipes: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.light.secondary,
    lineHeight: 20,
  },
  tonightBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  timeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.light.surfaceContainerHigh,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  timeChipText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.light.secondary,
  },
  timeChipTextSmall: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.light.secondary,
  },
  startCookingButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  startCookingText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: "#FFFFFF",
  },

  /* Week Section */
  weekSection: {
    gap: 12,
  },
  sectionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.light.secondary,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },

  /* Day Card */
  dayCard: {
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: 18,
    padding: 16,
    gap: 8,
  },
  dayCardToday: {
    borderWidth: 1.5,
    borderColor: Colors.light.primary,
  },
  dayCardSkipped: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: Colors.light.outlineVariant,
    opacity: 0.6,
  },
  dayCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  dayCardLeft: {
    flex: 1,
    gap: 2,
  },
  dayLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dayLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    color: Colors.light.secondary,
    letterSpacing: 1,
  },
  todayBadge: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  todayBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: "#FFFFFF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  skippedBadge: {
    backgroundColor: Colors.light.surfaceContainerHigh,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  skippedBadgeText: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    color: Colors.light.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dayCountry: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 16,
    color: Colors.light.onSurface,
    marginTop: 4,
  },
  dayRegion: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.light.secondary,
  },
  dayRecipes: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.light.secondary,
    lineHeight: 19,
  },
  dayCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  dayCardActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.outlineVariant,
    alignItems: "center",
    justifyContent: "center",
  },
  restoreButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  modePill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: Colors.light.surfaceContainerHigh,
  },
  modePillText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.light.secondary,
  },
  modePillTextActive: {
    color: Colors.light.primary,
  },
  textSkipped: {
    opacity: 0.5,
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
    fontSize: 15,
    color: Colors.light.secondary,
    marginBottom: 8,
  },

  /* Bottom Actions */
  bottomActions: {
    marginTop: 28,
    gap: 12,
  },
});
