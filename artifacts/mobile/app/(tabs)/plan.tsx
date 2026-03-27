import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { COUNTRIES, getAllRecipes, getCountryById, getRecipeById, type Recipe } from "@/constants/data";
import { SCROLL_BOTTOM_INSET } from "@/constants/spacing";
import { useApp } from "@/contexts/AppContext";
import { reloadDay, generateItinerary, parseTimeMinutes, type ItineraryDay } from "@/hooks/useItinerary";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getThisWeeksMonday(): Date {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function formatDayDate(isoDate: string): string {
  const d = new Date(isoDate + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function PlanScreen() {
  const insets = useSafeAreaInsets();
  const {
    itineraryProfile,
    currentItinerary,
    setCurrentItinerary,
    selectedCountryIds,
    itineraryHistory,
    addToItineraryHistory,
    addToGrocery,
    removeFromGrocery,
    clearGrocery,
    savedRecipeIds,
    addCourseToDay,
  } = useApp();

  const [toast, setToast] = useState<string | null>(null);
  const [swapDay, setSwapDay] = useState<ItineraryDay | null>(null);
  const [editDay, setEditDay] = useState<ItineraryDay | null>(null);
  const [addCourseDay, setAddCourseDay] = useState<ItineraryDay | null>(null);
  const [moveDay, setMoveDay] = useState<ItineraryDay | null>(null);
  const [addExtraDay, setAddExtraDay] = useState<ItineraryDay | null>(null);

  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const haptic = useCallback(() => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const showToast = useCallback((msg: string) => {
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    setToast(msg);
    toastTimeout.current = setTimeout(() => setToast(null), 2400);
  }, []);

  const today = toISODate(new Date());

  // Detect stale itinerary — all dates are before this week's Monday
  const isItineraryStale = useMemo(() => {
    if (currentItinerary.length === 0) return false;
    const mondayStr = toISODate(getThisWeeksMonday());
    return currentItinerary.every((entry) => entry.date < mondayStr);
  }, [currentItinerary]);

  const todayDay = useMemo(
    () => currentItinerary.find((d) => d.date === today && d.status === "active"),
    [currentItinerary, today]
  );

  const DAY_LABELS_FULL = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const fullWeek = useMemo(() => {
    if (currentItinerary.length === 0) return [];

    // Derive the week's Monday from the itinerary's earliest date, not from
    // today — this lets next-week plans render correctly after "Generate new week"
    const earliestDate = currentItinerary.reduce(
      (min, d) => (d.date < min ? d.date : min),
      currentItinerary[0].date
    );
    const earliestObj = new Date(earliestDate + "T12:00:00");
    const dow = earliestObj.getDay();
    const diff = dow === 0 ? -6 : 1 - dow;
    const monday = new Date(earliestObj);
    monday.setDate(earliestObj.getDate() + diff);
    monday.setHours(0, 0, 0, 0);

    const result: (ItineraryDay | { id: string; date: string; dayLabel: string; isEmpty: true })[] = [];
    for (let i = 0; i < 7; i++) {
      const dateObj = new Date(monday);
      dateObj.setDate(monday.getDate() + i);
      const dateStr = toISODate(dateObj);
      // Skip days before today — only show today and upcoming
      if (dateStr < today) continue;
      const existing = currentItinerary.find((dd) => dd.date === dateStr);
      if (existing) {
        // Skip today's active entry — it's shown separately in the TONIGHT header
        if (dateStr === today && existing.status === "active") continue;
        result.push(existing);
      } else {
        result.push({ id: `empty-${dateStr}`, date: dateStr, dayLabel: DAY_LABELS_FULL[i], isEmpty: true });
      }
    }
    return result;
  }, [currentItinerary, today]);

  const allDone = currentItinerary.length > 0 &&
    currentItinerary.every((d) => d.status === "completed" || d.status === "skipped");

  // ─── Itinerary actions ──────────────────────────────────────────────────────

  const handleReloadDay = (day: ItineraryDay) => {
    haptic();
    const updated = reloadDay(day, currentItinerary, itineraryProfile!, selectedCountryIds);
    setCurrentItinerary((prev) => prev.map((d) => (d.id === day.id ? updated : d)));
    // Swap grocery: remove old recipes, add new ones
    const oldIds = day.mode === "quick" ? day.quickRecipeIds : day.fullRecipeIds;
    const newIds = updated.mode === "quick" ? updated.quickRecipeIds : updated.fullRecipeIds;
    for (const rid of oldIds) { const r = getRecipeById(rid); if (r) removeFromGrocery(r); }
    for (const rid of newIds) { const r = getRecipeById(rid); if (r) addToGrocery(r); }
  };

  const handleSkipDay = (day: ItineraryDay) => {
    haptic();
    setCurrentItinerary((prev) => prev.map((d) => d.id === day.id ? { ...d, status: "skipped" as const } : d));
    // Remove ALL of this day's recipes from grocery (main + extra courses)
    const ids = day.mode === "quick" ? day.quickRecipeIds : day.fullRecipeIds;
    const allIds = [...ids, ...(day.extraRecipeIds ?? [])];
    for (const rid of allIds) { const r = getRecipeById(rid); if (r) removeFromGrocery(r); }
  };

  const handleRestoreDay = (day: ItineraryDay) => {
    haptic();
    setCurrentItinerary((prev) => prev.map((d) => d.id === day.id ? { ...d, status: "active" as const } : d));
    // Restore ALL recipes to grocery (main + extra courses)
    const ids = day.mode === "quick" ? day.quickRecipeIds : day.fullRecipeIds;
    const allIds = [...ids, ...(day.extraRecipeIds ?? [])];
    for (const rid of allIds) { const r = getRecipeById(rid); if (r) addToGrocery(r); }
  };

  const handleAddMealToDay = (dateStr: string, dayLabel: string) => {
    haptic();
    if (!itineraryProfile) return;
    const pool = selectedCountryIds.length > 0
      ? COUNTRIES.filter((c) => selectedCountryIds.includes(c.id))
      : [...COUNTRIES];
    const country = pool[Math.floor(Math.random() * pool.length)];
    if (!country) return;
    const recipes = country.recipes;
    const quick = recipes.filter((r) => {
      const mins = parseInt(r.time, 10);
      return !isNaN(mins) && mins <= 30;
    });
    const full = recipes.length > 0 ? recipes : [];
    const quickIds = (quick.length > 0 ? quick : full).slice(0, 2).map((r) => r.id);
    const fullIds = full.slice(0, 2).map((r) => r.id);

    const newDay: ItineraryDay = {
      id: `${dateStr}-${country.id}`,
      date: dateStr,
      dayLabel,
      countryId: country.id,
      regionId: country.region.toLowerCase().replace(/\s+/g, "-"),
      quickRecipeIds: quickIds,
      fullRecipeIds: fullIds,
      mode: "quick",
      status: "active",
    };
    setCurrentItinerary([...currentItinerary, newDay].sort((a, b) => a.date.localeCompare(b.date)));
    for (const rid of quickIds) { const r = getRecipeById(rid); if (r) addToGrocery(r); }
  };

  const handleMoveToDay = useCallback((fromDay: ItineraryDay, toDateStr: string) => {
    haptic();
    const targetDay = currentItinerary.find((d) => d.date === toDateStr);
    const toDateObj = new Date(toDateStr + "T12:00:00");
    const toLabel = toDateObj.toLocaleDateString("en-US", { weekday: "long" });
    let updated: ItineraryDay[];
    if (targetDay) {
      // Drop into an existing day — merge recipe IDs, remove the source day
      const mergedQuick = [...new Set([...targetDay.quickRecipeIds, ...fromDay.quickRecipeIds])];
      const mergedFull  = [...new Set([...targetDay.fullRecipeIds,  ...fromDay.fullRecipeIds])];
      updated = currentItinerary
        .filter((d) => d.id !== fromDay.id)
        .map((d) => d.id === targetDay.id ? { ...d, quickRecipeIds: mergedQuick, fullRecipeIds: mergedFull } : d)
        .sort((a, b) => a.date.localeCompare(b.date));
    } else {
      // Drop into an empty slot — just change the date of the source day
      updated = currentItinerary
        .map((d) => d.id === fromDay.id ? { ...d, date: toDateStr, dayLabel: toLabel } : d)
        .sort((a, b) => a.date.localeCompare(b.date));
    }
    setCurrentItinerary(updated);
    setMoveDay(null);
    showToast(`Moved to ${toLabel}`);
  }, [haptic, currentItinerary, setCurrentItinerary, showToast]);

  const handleAddExtraToDay = useCallback((day: ItineraryDay, recipe: Recipe) => {
    const allIds = [...day.quickRecipeIds, ...day.fullRecipeIds, ...(day.extraRecipeIds ?? [])];
    if (allIds.includes(recipe.id)) { setAddExtraDay(null); return; }
    // Use addCourseToDay which writes to extraRecipeIds (functional updater, no stale closure)
    addCourseToDay(day.date, recipe.id);
    addToGrocery(recipe);
    setAddExtraDay(null);
    showToast(`Added ${recipe.name}`);
  }, [addCourseToDay, addToGrocery, showToast]);

  const handleNewWeek = () => {
    haptic();
    if (currentItinerary.length > 0) addToItineraryHistory(currentItinerary);
    // Always schedule for next week — add 7 days to this week's Monday
    const nextMonday = getThisWeeksMonday();
    nextMonday.setDate(nextMonday.getDate() + 7);
    const newItinerary = generateItinerary(itineraryProfile!, selectedCountryIds, itineraryHistory, undefined, nextMonday);
    setCurrentItinerary(newItinerary);
    // Auto-populate grocery with the new week's recipes
    clearGrocery();
    for (const day of newItinerary) {
      if (day.status !== "active") continue;
      const ids = day.mode === "quick" ? day.quickRecipeIds : day.fullRecipeIds;
      for (const rid of ids) {
        const recipe = getRecipeById(rid);
        if (recipe) addToGrocery(recipe);
      }
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>

      {/* ── Header ──────────────────────────── */}
      <View style={[styles.headerSection, { paddingTop: Platform.OS === "web" ? 28 : insets.top + 16 }]}>
        <View style={styles.headerTitleBlock}>
          <View style={styles.headerEyebrow}>
            <View style={styles.headerEyebrowLine} />
            <Text style={styles.headerEyebrowLabel}>This Week</Text>
            <View style={styles.headerEyebrowLine} />
          </View>
          <Text style={styles.headerTitle}>Weekly Table</Text>
          <Text style={styles.headerSubtitle}>
            Curating your seasonal menu, week by week.
          </Text>
        </View>
      </View>

      {/* Content area — must flex to fill remaining space */}
      <View style={{ flex: 1 }}>

      {(!itineraryProfile || currentItinerary.length === 0 || isItineraryStale) ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="compass-outline" size={48} color={Colors.light.primary} />
          </View>
          <Text style={styles.emptyTitle}>Plan your week of cooking</Text>
          <Text style={styles.emptyBody}>
            Choose how many nights to cook, pick your cuisines, and we'll build your dinner schedule.
          </Text>
          <Pressable
            onPress={() => { haptic(); router.push("/itinerary-setup"); }}
            style={({ pressed }) => [styles.ctaButton, pressed && { opacity: 0.88 }]}
          >
            <Text style={styles.ctaText}>Plan My Week →</Text>
          </Pressable>
        </View>
      ) : allDone ? (
        <View style={styles.emptyState}>
          <Text style={styles.allDoneTitle}>Great week!</Text>
          <Text style={styles.allDoneSub}>
            You cooked {currentItinerary.filter((d) => d.status === "completed").length} meals from{" "}
            {new Set(currentItinerary.filter((d) => d.status === "completed").map((d) => d.countryId)).size} countries
          </Text>
          <Pressable
            onPress={handleNewWeek}
            style={({ pressed }) => [styles.ctaButton, pressed && { opacity: 0.88 }]}
          >
            <Text style={styles.ctaText}>Plan Next Week</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.weekScrollContent, { paddingBottom: Platform.OS === "web" ? 140 : insets.bottom + SCROLL_BOTTOM_INSET }]}
        >
          {todayDay && (
            <View>
              <Text style={styles.sectionLabel}>TONIGHT</Text>
              <TonightCard day={todayDay} servings={itineraryProfile?.defaultServings ?? 4} />
            </View>
          )}
          <View style={{ marginBottom: 24, gap: 20 }}>
            {fullWeek.map((entry, index) => {
              if ("isEmpty" in entry) {
                return (
                  <EmptyDayRow
                    key={`${entry.id}-${index}`}
                    date={entry.date}
                    dayLabel={entry.dayLabel}
                    isLast={index === fullWeek.length - 1}
                    onAdd={() => handleAddMealToDay(entry.date, entry.dayLabel)}
                  />
                );
              }
              return (
                <WeekRow
                  key={`${entry.id}-${index}`}
                  day={entry}
                  isLast={index === fullWeek.length - 1}
                  isToday={entry.date === today}
                  isPast={entry.date < today}
                  onReload={() => { haptic(); setSwapDay(entry); }}
                  onSkip={() => handleSkipDay(entry)}
                  onRestore={() => handleRestoreDay(entry)}
                  onEdit={() => { haptic(); setEditDay(entry); }}
                  onAdd={() => { haptic(); setAddExtraDay(entry); }}
                />
              );
            })}
          </View>
          <Pressable
            onPress={handleNewWeek}
            style={({ pressed }) => [styles.newWeekLink, pressed && { opacity: 0.6 }]}
          >
            <Text style={styles.newWeekText}>Generate new week</Text>
          </Pressable>
          {todayDay && (
            <Pressable
              onPress={() => router.push("/(tabs)/cook")}
              style={styles.readyToCookBtn}
              accessibilityLabel="Ready to cook tonight"
            >
              <Ionicons name="flame" size={18} color={Colors.light.onPrimary} />
              <Text style={styles.readyToCookText}>
                Ready to Cook Tonight →
              </Text>
            </Pressable>
          )}
        </ScrollView>
      )}

      </View>{/* end content area flex wrapper */}

      {/* ── Edit Menu ──────────────────────────────────────────── */}
      <Modal visible={!!editDay} transparent animationType="fade" onRequestClose={() => setEditDay(null)}>
        <Pressable style={editMenuStyles.overlay} onPress={() => setEditDay(null)}>
          <View style={editMenuStyles.sheet}>
            <View style={editMenuStyles.handle} />
            {editDay && (
              <>
                <Text style={editMenuStyles.title}>{editDay.dayLabel}</Text>
                <Pressable
                  style={({ pressed }) => [editMenuStyles.menuItem, pressed && { backgroundColor: Colors.light.surfaceContainerLow }]}
                  onPress={() => { setEditDay(null); setTimeout(() => setSwapDay(editDay), 200); }}
                >
                  <View style={editMenuStyles.menuIconCircle}>
                    <Ionicons name="swap-horizontal" size={18} color={Colors.light.primary} />
                  </View>
                  <View>
                    <Text style={editMenuStyles.menuItemTitle}>Swap recipe</Text>
                    <Text style={editMenuStyles.menuItemSub}>Replace with a different dish</Text>
                  </View>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [editMenuStyles.menuItem, pressed && { backgroundColor: Colors.light.surfaceContainerLow }]}
                  onPress={() => { const d = editDay; setEditDay(null); setTimeout(() => setMoveDay(d), 200); }}
                >
                  <View style={editMenuStyles.menuIconCircle}>
                    <Ionicons name="calendar-outline" size={18} color={Colors.light.primary} />
                  </View>
                  <View>
                    <Text style={editMenuStyles.menuItemTitle}>Move to another day</Text>
                    <Text style={editMenuStyles.menuItemSub}>Pick a different day this week</Text>
                  </View>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [editMenuStyles.menuItem, pressed && { backgroundColor: Colors.light.surfaceContainerLow }]}
                  onPress={() => { const d = editDay; setEditDay(null); setTimeout(() => setAddCourseDay(d), 200); }}
                >
                  <View style={editMenuStyles.menuIconCircle}>
                    <Ionicons name="add-circle-outline" size={18} color={Colors.light.primary} />
                  </View>
                  <View>
                    <Text style={editMenuStyles.menuItemTitle}>Add a course</Text>
                    <Text style={editMenuStyles.menuItemSub}>Appetizer, dessert or drink</Text>
                  </View>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [editMenuStyles.menuItem, pressed && { backgroundColor: Colors.light.surfaceContainerLow }]}
                  onPress={() => { handleSkipDay(editDay); setEditDay(null); }}
                >
                  <View style={[editMenuStyles.menuIconCircle, { backgroundColor: Colors.light.surfaceContainerHighest }]}>
                    <Ionicons name="close" size={18} color={Colors.light.onSurfaceVariant} />
                  </View>
                  <View>
                    <Text style={editMenuStyles.menuItemTitle}>Skip this day</Text>
                    <Text style={editMenuStyles.menuItemSub}>Remove from this week's plan</Text>
                  </View>
                </Pressable>
              </>
            )}
          </View>
        </Pressable>
      </Modal>

      {/* ── Swap Sheet ─────────────────────────────────────────── */}
      <Modal visible={!!swapDay} transparent animationType="slide" onRequestClose={() => setSwapDay(null)}>
        {swapDay && (
          <SwapSheet
            day={swapDay}
            onSelectRecipe={(recipe) => {
              // Replace the day's main recipe but keep extra courses
              const updated: ItineraryDay = {
                ...swapDay,
                countryId: recipe.countryId,
                regionId: recipe.region ?? "",
                quickRecipeIds: [recipe.id],
                fullRecipeIds: [recipe.id],
                extraRecipeIds: swapDay.extraRecipeIds,
                status: "active",
              };
              // Sync grocery: remove old main recipe ingredients, add new
              const oldIds = swapDay.mode === "quick" ? swapDay.quickRecipeIds : swapDay.fullRecipeIds;
              for (const rid of oldIds) { const r = getRecipeById(rid); if (r) removeFromGrocery(r); }
              addToGrocery(recipe);
              setCurrentItinerary((prev) => prev.map((d) => (d.id === swapDay.id ? updated : d)));
              setSwapDay(null);
              showToast(`Swapped to ${recipe.name}`);
            }}
            onSurprise={() => {
              handleReloadDay(swapDay);
              setSwapDay(null);
            }}
            onClose={() => setSwapDay(null)}
            savedRecipeIds={savedRecipeIds}
          />
        )}
      </Modal>

      {/* ── Move Day Modal ─────────────────────────────────────── */}
      <Modal visible={!!moveDay} transparent animationType="fade" onRequestClose={() => setMoveDay(null)}>
        <Pressable style={editMenuStyles.overlay} onPress={() => setMoveDay(null)}>
          <View style={editMenuStyles.sheet}>
            <View style={editMenuStyles.handle} />
            {moveDay && (
              <>
                <Text style={editMenuStyles.title}>Move {moveDay.dayLabel}</Text>
                <Text style={[editMenuStyles.menuItemSub, { marginBottom: 16, color: Colors.light.secondary }]}>
                  Choose the day to move this meal to
                </Text>
                {[...(todayDay && todayDay.date !== moveDay.date ? [todayDay] : []), ...fullWeek]
                  .filter((d) => !("isEmpty" in d) ? d.date !== moveDay.date : true)
                  .map((entry) => {
                    const dateObj = new Date(entry.date + "T12:00:00");
                    const dayName = dateObj.toLocaleDateString("en-US", { weekday: "long" });
                    const dateLabel = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                    const isEmpty = "isEmpty" in entry;
                    return (
                      <Pressable
                        key={entry.date}
                        style={({ pressed }) => [editMenuStyles.menuItem, pressed && { backgroundColor: Colors.light.surfaceContainerLow }]}
                        onPress={() => handleMoveToDay(moveDay, entry.date)}
                      >
                        <View style={[editMenuStyles.menuIconCircle, isEmpty && { backgroundColor: Colors.light.surfaceContainerHighest }]}>
                          <Ionicons
                            name={isEmpty ? "add" : "swap-horizontal"}
                            size={18}
                            color={isEmpty ? Colors.light.onSurfaceVariant : Colors.light.primary}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={editMenuStyles.menuItemTitle}>{dayName}</Text>
                          <Text style={editMenuStyles.menuItemSub}>
                            {dateLabel} · {isEmpty ? "Move here" : "Add alongside existing meal"}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
              </>
            )}
          </View>
        </Pressable>
      </Modal>

      {/* ── Add Extra Sheet ─────────────────────────────────────── */}
      <Modal visible={!!addExtraDay} transparent animationType="slide" onRequestClose={() => setAddExtraDay(null)}>
        {addExtraDay && (
          <SwapSheet
            day={addExtraDay}
            addMode
            onSelectRecipe={(recipe) => handleAddExtraToDay(addExtraDay, recipe)}
            onSurprise={() => {
              const pool = getAllRecipes().filter((r) => !(addExtraDay.mode === "quick" ? addExtraDay.quickRecipeIds : addExtraDay.fullRecipeIds).includes(r.id));
              const pick = pool[Math.floor(Math.random() * pool.length)];
              if (pick) handleAddExtraToDay(addExtraDay, pick);
            }}
            onClose={() => setAddExtraDay(null)}
            savedRecipeIds={savedRecipeIds}
          />
        )}
      </Modal>

      {/* ── Add Course Sheet ─────────────────────────────────────── */}
      {addCourseDay && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setAddCourseDay(null)}>
          <AddCourseSheet
            day={addCourseDay}
            onAdd={(recipeId) => {
              addCourseToDay(addCourseDay.date, recipeId);
              const r = getRecipeById(recipeId);
              if (r) addToGrocery(r);
              if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              showToast(`Added ${r?.name ?? "course"}`);
            }}
            onClose={() => setAddCourseDay(null)}
          />
        </Modal>
      )}

      {/* ── Toast ────────────────────────────────────────────────── */}
      {toast && (
        <View style={[styles.toast, { bottom: (Platform.OS === "web" ? 150 : insets.bottom + SCROLL_BOTTOM_INSET) }]}>
          <Ionicons name="checkmark-circle" size={16} color={Colors.light.surface} />
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}

    </View>
  );
}

// ─── TonightCard ──────────────────────────────────────────────────────────────

function TonightCard({ day, servings }: { day: ItineraryDay; servings: number }) {
  const country = getCountryById(day.countryId);
  const recipeIds = day.mode === "quick" ? day.quickRecipeIds : day.fullRecipeIds;
  const recipes = recipeIds.map(getRecipeById).filter(Boolean);
  const heroRecipe = recipes.find((r) => r?.category === "Main Course") || recipes[0];
  const haptic = () => { if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); };
  const [localServings, setLocalServings] = useState(servings);

  if (!country || !heroRecipe) return null;

  const title = recipes.length > 1 ? recipes.map((r) => r?.name).join(" + ") : heroRecipe.name;
  const region = heroRecipe.region && heroRecipe.region !== country.name
    ? heroRecipe.region
    : null;

  return (
    <View style={styles.tonightCard}>
      <View style={styles.tonightHeader}>
        <View style={styles.tonightHeaderLeft}>
          <View style={styles.pulseDot}>
            <View style={styles.pulseDotInner} />
          </View>
          <Text style={styles.tonightHeaderLabel}>Active Itinerary · Tonight</Text>
        </View>
        <View style={styles.tonightHeaderActions}>
          <Pressable
            onPress={() => { haptic(); router.push("/itinerary-setup"); }}
            hitSlop={8}
          >
            <Ionicons name="refresh" size={16} color={Colors.light.secondary} />
          </Pressable>
        </View>
      </View>

      <Pressable
        onPress={() => { haptic(); router.push({ pathname: "/recipe/[id]", params: { id: heroRecipe.id } }); }}
        style={styles.tonightContent}
      >
        <View style={styles.tonightImageWrap}>
          <Image source={{ uri: heroRecipe.image }} style={styles.tonightImage} contentFit="cover" placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }} onError={(e) => console.warn("[Image] Failed to load:", e.error)} />
        </View>
        <View style={styles.tonightBody}>
          <View style={styles.supperBadge}>
            <Text style={styles.supperBadgeText}>Supper Choice</Text>
          </View>
          <Text style={styles.tonightTitle} ellipsizeMode="tail" numberOfLines={2}>{title}</Text>
        <Text style={styles.tonightSubtitle}>
          {region ? `${region}, ` : ""}{country.name} · {heroRecipe.time}
        </Text>
        {/* Servings stepper */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 4 }}>
          <Pressable
            onPress={() => { if (localServings > 1) { setLocalServings(s => s - 1); if (Platform.OS !== "web") Haptics.selectionAsync(); } }}
            style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: Colors.light.outlineVariant, alignItems: "center", justifyContent: "center" }}
          >
            <Text style={{ fontSize: 18, color: Colors.light.primary }}>−</Text>
          </Pressable>
          <Text style={{ fontFamily: "NotoSerif_700Bold", fontSize: 15, color: Colors.light.onSurface, minWidth: 60, textAlign: "center" }}>
            {localServings} {localServings === 1 ? "serving" : "servings"}
          </Text>
          <Pressable
            onPress={() => { if (localServings < 20) { setLocalServings(s => s + 1); if (Platform.OS !== "web") Haptics.selectionAsync(); } }}
            style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: Colors.light.outlineVariant, alignItems: "center", justifyContent: "center" }}
          >
            <Text style={{ fontSize: 18, color: Colors.light.primary }}>+</Text>
          </Pressable>
        </View>

        {/* Start Cooking → passes all recipes sorted by longest cook time first */}
        <Pressable
          onPress={() => {
            haptic();
            const ids = day.mode === "quick" ? day.quickRecipeIds : day.fullRecipeIds;
            const extras = day.extraRecipeIds ?? [];
            const combined = [...ids, ...extras];
            const sorted = combined.sort((a, b) => {
              const ta = parseTimeMinutes(getRecipeById(a)?.time ?? "0");
              const tb = parseTimeMinutes(getRecipeById(b)?.time ?? "0");
              return tb - ta;
            });
            router.push({
              pathname: "/cook-mode",
              params: { recipeId: sorted[0], recipeIds: sorted.join(","), servings: String(localServings) },
            });
          }}
          style={({ pressed }) => [styles.startCookingBtn, pressed && { opacity: 0.88 }]}
        >
          <Text style={styles.startCookingText}>Start Cooking →</Text>
        </Pressable>
          <Text style={styles.tonightDesc} numberOfLines={2}>
            A {region} staple elevated by premium ingredients and careful preparation.
          </Text>
          <View style={styles.tonightMeta}>
            <View style={styles.tonightMetaItem}>
              <Ionicons name="time-outline" size={14} color={Colors.light.secondary} />
              <Text style={styles.tonightMetaText}>{heroRecipe.time}</Text>
            </View>
            <View style={styles.tonightMetaItem}>
              <Ionicons name="flash-outline" size={14} color={Colors.light.secondary} />
              <Text style={styles.tonightMetaText}>Chef's Choice</Text>
            </View>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

// ─── AddCourseSheet ──────────────────────────────────────────────────────────

const ADD_COURSE_TYPES = ["Appetizer", "Dessert", "Side Dish", "Beverage", "Any"];

function AddCourseSheet({ day, onAdd, onClose }: { day: ItineraryDay; onAdd: (recipeId: string) => void; onClose: () => void }) {
  const [selectedType, setSelectedType] = useState<string>("Appetizer");
  const country = getCountryById(day.countryId);

  const filteredRecipes = useMemo(() => {
    const all = getAllRecipes();
    const filtered = selectedType === "Any" ? all : all.filter(r => r.category === selectedType);
    const sameCountry = filtered.filter(r => r.countryId === day.countryId);
    const others = filtered.filter(r => r.countryId !== day.countryId);
    return [...sameCountry, ...others].slice(0, 20);
  }, [selectedType, day.countryId]);

  const existingIds = new Set([
    ...(day.quickRecipeIds ?? []),
    ...(day.fullRecipeIds ?? []),
    ...(day.extraRecipeIds ?? []),
  ]);

  return (
    <Pressable style={editMenuStyles.overlay} onPress={onClose}>
      <Pressable style={editMenuStyles.sheet} onPress={e => e.stopPropagation()}>
        <View style={editMenuStyles.handle} />
        <Text style={editMenuStyles.title}>Add a Course</Text>
        <Text style={{ fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.light.secondary, marginBottom: 16, marginTop: -8 }}>
          Adding to {country?.name ?? "your"} dinner
        </Text>

        {/* Course type pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 16 }}>
          {ADD_COURSE_TYPES.map(type => (
            <Pressable
              key={type}
              onPress={() => setSelectedType(type)}
              style={{
                paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
                backgroundColor: selectedType === type ? Colors.light.primary : Colors.light.surfaceContainerLow,
                borderWidth: 1,
                borderColor: selectedType === type ? Colors.light.primary : Colors.light.outlineVariant,
              }}
            >
              <Text style={{
                fontFamily: "Inter_600SemiBold", fontSize: 13,
                color: selectedType === type ? Colors.light.onPrimary : Colors.light.onSurface,
              }}>{type}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Recipe list */}
        <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
          {filteredRecipes.map(recipe => {
            const alreadyAdded = existingIds.has(recipe.id);
            return (
              <Pressable
                key={recipe.id}
                onPress={() => { if (!alreadyAdded) { onAdd(recipe.id); onClose(); } }}
                style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.light.outlineVariant, opacity: alreadyAdded ? 0.4 : 1 }}
              >
                <Image source={{ uri: recipe.image }} style={{ width: 44, height: 44, borderRadius: 8 }} contentFit="cover" placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }} onError={(e) => console.warn("[Image] Failed to load:", e.error)} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontFamily: "NotoSerif_700Bold", fontSize: 14, color: Colors.light.onSurface }} ellipsizeMode="tail" numberOfLines={1}>{recipe.name}</Text>
                  <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.light.secondary }}>{recipe.countryName} · {recipe.time}</Text>
                </View>
                {alreadyAdded ? (
                  <Text style={{ fontSize: 11, color: Colors.light.secondary }}>Added</Text>
                ) : (
                  <Ionicons name="add-circle" size={24} color={Colors.light.primary} />
                )}
              </Pressable>
            );
          })}
          {filteredRecipes.length === 0 && (
            <Text style={{ fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.light.secondary, textAlign: "center", paddingVertical: 32 }}>No {selectedType.toLowerCase()} recipes found</Text>
          )}
        </ScrollView>
      </Pressable>
    </Pressable>
  );
}

// ─── SwapSheet ────────────────────────────────────────────────────────────────

function SwapSheet({ day, onSelectRecipe, onSurprise, onClose, savedRecipeIds, addMode }: {
  day: ItineraryDay;
  onSelectRecipe: (recipe: Recipe) => void;
  onSurprise: () => void;
  onClose: () => void;
  savedRecipeIds: string[];
  addMode?: boolean;
}) {
  const [showSaved, setShowSaved] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const currentRecipeIds = day.mode === "quick" ? day.quickRecipeIds : day.fullRecipeIds;
  const currentRecipes = currentRecipeIds.map(getRecipeById).filter(Boolean);
  const currentName = currentRecipes.map((r) => r?.name).join(", ");

  // Suggestions: 3 recipes from different cuisines, same difficulty
  const suggestions = useMemo(() => {
    const currentDifficulty = currentRecipes[0]?.difficulty ?? "Easy";
    const resolved = getAllRecipes().filter(
      (recipe) => !currentRecipeIds.includes(recipe.id) && recipe.difficulty === currentDifficulty
    );
    // Shuffle and take 3
    const shuffled = [...resolved].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }, [currentRecipeIds, currentRecipes]);

  const savedRecipes = useMemo(() => {
    return savedRecipeIds.map(getRecipeById).filter(Boolean) as Recipe[];
  }, [savedRecipeIds]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return getAllRecipes()
      .filter((recipe) => recipe.name.toLowerCase().includes(q))
      .slice(0, 5);
  }, [searchQuery]);

  const haptic = () => { if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); };

  return (
    <Pressable style={swapStyles.overlay} onPress={onClose}>
      <Pressable style={swapStyles.sheet} onPress={(e) => e.stopPropagation()}>
        <View style={swapStyles.handle} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={swapStyles.title}>{addMode ? `Add to ${day.dayLabel}` : `Replace ${day.dayLabel}'s meal`}</Text>
          <Text style={swapStyles.subtitle}>{addMode ? "Add an appetizer, dessert, or extra dish" : `Currently: ${currentName || "Empty"}`}</Text>

          {/* Suggestions */}
          <Text style={swapStyles.sectionLabel}>SUGGESTIONS</Text>
          <View style={swapStyles.suggestionsCard}>
            {suggestions.map((recipe) => (
              <Pressable
                key={recipe.id}
                style={({ pressed }) => [swapStyles.suggestionRow, pressed && { opacity: 0.7 }]}
                onPress={() => { haptic(); onSelectRecipe(recipe); }}
              >
                <View style={swapStyles.suggestionInfo}>
                  <Text style={swapStyles.suggestionName} ellipsizeMode="tail" numberOfLines={1}>{recipe.name}</Text>
                  <Text style={swapStyles.suggestionMeta}>{recipe.countryName} · {recipe.time}</Text>
                </View>
                <Ionicons name="add-circle-outline" size={24} color={Colors.light.primary} />
              </Pressable>
            ))}
          </View>

          {/* Pick from saved */}
          <Pressable
            style={({ pressed }) => [swapStyles.optionBtn, pressed && { opacity: 0.7 }]}
            onPress={() => { haptic(); setShowSaved(!showSaved); setShowSearch(false); }}
          >
            <Ionicons name="bookmark-outline" size={20} color={Colors.light.onSurface} />
            <Text style={swapStyles.optionBtnText}>Pick from saved recipes</Text>
            <Ionicons name={showSaved ? "chevron-up" : "chevron-down"} size={18} color={Colors.light.secondary} />
          </Pressable>
          {showSaved && (
            <View style={swapStyles.suggestionsCard}>
              {savedRecipes.length === 0 ? (
                <Text style={swapStyles.emptyText}>No saved recipes yet</Text>
              ) : (
                savedRecipes.slice(0, 5).map((recipe) => (
                  <Pressable
                    key={recipe.id}
                    style={({ pressed }) => [swapStyles.suggestionRow, pressed && { opacity: 0.7 }]}
                    onPress={() => { haptic(); onSelectRecipe(recipe); }}
                  >
                    <View style={swapStyles.suggestionInfo}>
                      <Text style={swapStyles.suggestionName} ellipsizeMode="tail" numberOfLines={1}>{recipe.name}</Text>
                      <Text style={swapStyles.suggestionMeta}>{recipe.countryName} · {recipe.time}</Text>
                    </View>
                    <Ionicons name="add-circle-outline" size={24} color={Colors.light.primary} />
                  </Pressable>
                ))
              )}
            </View>
          )}

          {/* Search */}
          <Pressable
            style={({ pressed }) => [swapStyles.optionBtn, pressed && { opacity: 0.7 }]}
            onPress={() => { haptic(); setShowSearch(!showSearch); setShowSaved(false); }}
          >
            <Ionicons name="search-outline" size={20} color={Colors.light.onSurface} />
            <Text style={swapStyles.optionBtnText}>Search for a recipe</Text>
            <Ionicons name={showSearch ? "chevron-up" : "chevron-down"} size={18} color={Colors.light.secondary} />
          </Pressable>
          {showSearch && (
            <View style={swapStyles.searchArea}>
              <TextInput
                style={swapStyles.searchInput}
                placeholder="Search recipes…"
                placeholderTextColor={Colors.light.secondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {searchResults.map((recipe) => (
                <Pressable
                  key={recipe.id}
                  style={({ pressed }) => [swapStyles.suggestionRow, pressed && { opacity: 0.7 }]}
                  onPress={() => { haptic(); onSelectRecipe(recipe); }}
                >
                  <View style={swapStyles.suggestionInfo}>
                    <Text style={swapStyles.suggestionName} ellipsizeMode="tail" numberOfLines={1}>{recipe.name}</Text>
                    <Text style={swapStyles.suggestionMeta}>{recipe.countryName} · {recipe.time}</Text>
                  </View>
                  <Ionicons name="add-circle-outline" size={24} color={Colors.light.primary} />
                </Pressable>
              ))}
            </View>
          )}

          {/* Surprise me */}
          <Pressable
            style={({ pressed }) => [swapStyles.optionBtn, pressed && { opacity: 0.7 }]}
            onPress={() => { haptic(); onSurprise(); }}
          >
            <Ionicons name="shuffle-outline" size={20} color={Colors.light.onSurface} />
            <Text style={swapStyles.optionBtnText}>Surprise me</Text>
          </Pressable>
        </ScrollView>
      </Pressable>
    </Pressable>
  );
}

const swapStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.light.surfaceContainerHigh,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 16,
  },
  title: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 22,
    color: Colors.light.onSurface,
    lineHeight: 28,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: Colors.light.secondary,
    lineHeight: 22,
    marginBottom: 24,
  },
  sectionLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.light.primary,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 12,
    lineHeight: 18,
  },
  suggestionsCard: {
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.outlineVariant,
    overflow: "hidden",
    marginBottom: 16,
  },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.outlineVariant,
    minHeight: 56,
  },
  suggestionInfo: {
    flex: 1,
    gap: 2,
  },
  suggestionName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.light.onSurface,
    lineHeight: 22,
  },
  suggestionMeta: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.light.secondary,
    lineHeight: 20,
  },
  optionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.outlineVariant,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 12,
    minHeight: 56,
  },
  optionBtnText: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: Colors.light.onSurface,
    lineHeight: 22,
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.light.secondary,
    textAlign: "center",
    padding: 20,
    lineHeight: 20,
  },
  searchArea: {
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.outlineVariant,
    overflow: "hidden",
    marginBottom: 16,
  },
  searchInput: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: Colors.light.onSurface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.outlineVariant,
  },
});

// ─── WeekRow ──────────────────────────────────────────────────────────────────

function WeekRow({ day, isLast, isToday, isPast, onReload, onSkip, onRestore, onEdit, onAdd }: {
  day: ItineraryDay;
  isLast: boolean;
  isToday?: boolean;
  isPast?: boolean;
  onReload: () => void;
  onSkip: () => void;
  onRestore: () => void;
  onEdit: () => void;
  onAdd?: () => void;
}) {
  const country = getCountryById(day.countryId);
  const { savedRecipeIds: savedIds } = useApp();
  const recipeIds = day.mode === "quick" ? day.quickRecipeIds : day.fullRecipeIds;
  const recipes = recipeIds.map(getRecipeById).filter(Boolean);
  const isSkipped = day.status === "skipped";
  const haptic = () => { if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); };

  if (!country) return null;

  const recipeTitle = recipes.map((r) => r?.name).join(" + ");
  const mainRecipe = recipes[0];
  const d = new Date(day.date + "T12:00:00");
  const dayName = d.toLocaleDateString("en-US", { weekday: "long" });
  const dateLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <View style={[styles.daySection, isPast && { opacity: 0.38 }]}>
      <View style={[styles.dayDateRow, { justifyContent: "space-between" }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={[styles.dayDateLabel, isToday && { color: Colors.light.primary }]}>
            {dayName} · {dateLabel}
          </Text>
          {isToday && (
            <View style={styles.todayBadge}>
              <Text style={styles.todayBadgeText}>Tonight</Text>
            </View>
          )}
          {day.status === "completed" && (
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.light.success, marginLeft: 2 }} />
          )}
        </View>
        {!isSkipped && !isPast && onAdd && (
          <Pressable onPress={onAdd} hitSlop={8} style={styles.dayHeaderAddBtn}>
            <Ionicons name="add-circle" size={20} color={Colors.light.primary} />
          </Pressable>
        )}
      </View>
      <View style={styles.dayCard}>
        <Pressable
          onPress={() => { if (!isSkipped && mainRecipe) { haptic(); router.push({ pathname: "/recipe/[id]", params: { id: mainRecipe.id } }); } }}
          style={({ pressed }) => [
            styles.dayCardInner,
            isSkipped && { opacity: 0.5 },
            pressed && !isSkipped && { backgroundColor: Colors.light.surfaceContainerHigh },
          ]}
        >
          {mainRecipe?.image && !isSkipped && (
            <View style={styles.dayCardThumb}>
              <Image
                source={{ uri: mainRecipe.image }}
                style={styles.dayCardThumbImage}
                contentFit="cover"
                onError={(e) => console.warn("[Image] Failed to load:", e.error)}
              />
            </View>
          )}
          <View style={styles.dayCardInfo}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={[styles.dayCardRecipe, { flex: 1 }]} ellipsizeMode="tail" numberOfLines={1}>
                {isSkipped ? "Skipped" : recipeTitle}
              </Text>
              {!isSkipped && mainRecipe && savedIds.includes(mainRecipe.id) && (
                <Ionicons name="bookmark" size={11} color={Colors.light.primary} style={{ marginLeft: 4 }} />
              )}
            </View>
            {!isSkipped && mainRecipe && (
              <Text style={styles.dayCardSub} ellipsizeMode="tail" numberOfLines={1}>
                Dinner · {country.name}
              </Text>
            )}
            {isSkipped && (
              <Pressable onPress={onRestore} hitSlop={8}>
                <Text style={styles.restoreText}>Restore</Text>
              </Pressable>
            )}
            {!isSkipped && (day.extraRecipeIds?.length ?? 0) > 0 && (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                {day.extraRecipeIds!.map(id => {
                  const r = getRecipeById(id);
                  if (!r) return null;
                  return (
                    <View key={id} style={{ backgroundColor: Colors.light.surfaceContainerLow, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: Colors.light.outlineVariant, flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Text style={{ fontSize: 10 }}>
                        {r.category === "Dessert" ? "🍮" : r.category === "Appetizer" ? "🥗" : r.category === "Beverage" ? "🍷" : "🍽️"}
                      </Text>
                      <Text style={{ fontFamily: "Inter_500Medium", fontSize: 11, color: Colors.light.secondary }} ellipsizeMode="tail" numberOfLines={1}>{r.name}</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </Pressable>
        {!isSkipped && !isPast && (
          <View style={styles.dayCardActions}>
            <Pressable
              onPress={(e) => { e.stopPropagation(); haptic(); onEdit(); }}
              style={styles.dayCardEditBtn}
              hitSlop={8}
            >
              <Ionicons name="pencil" size={14} color={Colors.light.primary} />
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── EmptyDayRow ─────────────────────────────────────────────────────────────

function EmptyDayRow({ date, dayLabel, isLast, onAdd }: {
  date: string;
  dayLabel: string;
  isLast: boolean;
  onAdd: () => void;
}) {
  const d = new Date(date + "T12:00:00");
  const dayName = d.toLocaleDateString("en-US", { weekday: "long" });
  const dateLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <View style={styles.daySection}>
      <Text style={styles.dayDateLabel}>{dayName} · {dateLabel}</Text>
      <Pressable
        onPress={onAdd}
        style={({ pressed }) => [
          styles.emptyDayCard,
          pressed && { backgroundColor: Colors.light.surfaceContainerLow },
        ]}
      >
        <View style={styles.emptyDayIconCircle}>
          <Ionicons name="add" size={22} color={Colors.light.primary} />
        </View>
        <Text style={styles.emptyDayTitle}>Add Meal</Text>
        <Text style={styles.emptyDayHint}>Browse Inspiration</Text>
      </Pressable>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.surface },

  headerSection: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: Colors.light.surface,
  },
  headerTitleBlock: {
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 4,
    gap: 4,
  },
  headerEyebrow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
    width: "100%",
  },
  headerEyebrowLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(222,193,179,0.4)",
  },
  headerEyebrowLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: Colors.light.secondary,
  },
  headerTitle: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 30,
    color: Colors.light.onSurface,
    letterSpacing: -0.5,
    textAlign: "center",
  },
  headerSubtitle: {
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
    fontSize: 13,
    lineHeight: 20,
    color: Colors.light.secondary,
    textAlign: "center",
  },

  readyToCookBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.light.primary,
    borderRadius: 14,
    paddingVertical: 16,
    marginHorizontal: 0,
    marginTop: 16,
    marginBottom: 8,
  },
  readyToCookText: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 16,
    color: Colors.light.surface,
  },
  // Shared empty state
  emptyState: {
    flex: 1,
    minHeight: 300,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 14,
  },
  emptyIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#F0E8DE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 22,
    color: Colors.light.onSurface,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  emptyBody: {
    fontFamily: "Inter_400Regular",
    fontSize: 17,
    color: Colors.light.secondary,
    textAlign: "center",
    lineHeight: 26,
    maxWidth: 280,
  },
  ctaButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 32,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
    marginTop: 4,
  },
  ctaText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.light.surface,
  },
  allDoneTitle: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 24,
    color: Colors.light.onSurface,
    textAlign: "center",
  },
  allDoneSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.secondary,
    textAlign: "center",
  },

  // This Week scroll
  weekScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 8,
  },
  sectionLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.primary,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 12,
  },

  tonightCard: {
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: Colors.light.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: "rgba(154,65,0,0.1)",
    marginBottom: 28,
  },
  tonightHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(138,114,102,0.2)",
  },
  tonightHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.primary,
  },
  pulseDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.primary,
  },
  tonightHeaderLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    color: Colors.light.primary,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  tonightHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  tonightContent: {
    flexDirection: "row",
  },
  tonightImageWrap: {
    width: "45%",
    aspectRatio: 4 / 3,
  },
  tonightImage: {
    width: "100%",
    height: "100%",
  },
  tonightBody: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
    gap: 6,
  },
  supperBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#FFDBCB",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 2,
  },
  supperBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: Colors.light.primary,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  tonightTitle: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 17,
    color: Colors.light.onSurface,
    letterSpacing: -0.3,
    lineHeight: 23,
  },
  tonightSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.light.secondary,
    lineHeight: 20,
  },
  startCookingBtn: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  startCookingText: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 15,
    color: Colors.light.onPrimary,
  },
  tonightDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 18,
    color: Colors.light.onSurfaceVariant,
  },
  tonightMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
  },
  tonightMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  tonightMetaText: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.light.secondary,
  },

  daySection: {
    gap: 8,
  },
  dayDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dayDateLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.light.secondary,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  todayBadge: {
    backgroundColor: "#FFDBCB",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  todayBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: Colors.light.primary,
    letterSpacing: 0.5,
  },
  dayCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(138,114,102,0.1)",
  },
  dayCardInner: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 8,
    paddingVertical: 2,
  },
  dayCardActions: {
    gap: 6,
    alignItems: "center",
  },
  dayHeaderAddBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCardEditBtn: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: "#FFDBCB",
    alignItems: "center",
    justifyContent: "center",
  },
  dayCardCancelBtn: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: Colors.light.surfaceContainerHighest,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCardThumb: {
    width: 56,
    height: 48,
    borderRadius: 10,
    overflow: "hidden",
  },
  dayCardThumbImage: {
    width: "100%",
    height: "100%",
  },
  dayCardInfo: {
    flex: 1,
    gap: 2,
  },
  dayCardRecipe: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 16,
    color: Colors.light.onSurface,
    letterSpacing: -0.2,
  },
  dayCardSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.light.secondary,
  },
  restoreText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.primary,
    marginTop: 2,
  },
  emptyDayCard: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "rgba(138,114,102,0.2)",
    borderRadius: 12,
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  emptyDayIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: "rgba(154,65,0,0.05)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  emptyDayTitle: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 15,
    color: Colors.light.onSurface,
  },
  emptyDayHint: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: Colors.light.secondary,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },

  // Generate new week
  newWeekLink: {
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 6,
  },
  newWeekText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
    color: Colors.light.primary,
  },

  // Toast
  toast: {
    position: "absolute",
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.light.onSurface,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 8,
  },
  toastText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.light.surface,
  },
});

const editMenuStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 10,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.light.outlineVariant,
    alignSelf: "center",
    marginBottom: 16,
  },
  title: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.light.onSurface,
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderRadius: 12,
  },
  menuIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFDBCB",
    alignItems: "center",
    justifyContent: "center",
  },
  menuItemTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.light.onSurface,
  },
  menuItemSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.light.onSurfaceVariant,
    marginTop: 1,
  },
});
