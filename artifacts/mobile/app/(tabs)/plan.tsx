import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import ProfileSheet from "@/components/ProfileSheet";

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

function formatTotalTime(minutes: number): string {
  if (minutes <= 0) return "0m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

function getOrdinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) return "th";
  switch (day % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}

function formatShortDate(isoDate: string): string {
  const d = new Date(isoDate + "T12:00:00");
  const day = d.getDate();
  const month = d.toLocaleDateString("en-US", { month: "short" });
  return `${day}${getOrdinalSuffix(day)} ${month}`;
}

function getWeekRange(dates: string[]): string {
  if (dates.length === 0) return "";
  const sorted = [...dates].sort();
  const first = new Date(sorted[0] + "T12:00:00");
  const last = new Date(sorted[sorted.length - 1] + "T12:00:00");
  const fMonth = first.toLocaleDateString("en-US", { month: "short" });
  const lMonth = last.toLocaleDateString("en-US", { month: "short" });
  return `${fMonth} ${first.getDate()} — ${lMonth} ${last.getDate()}`;
}

const DAY_LABELS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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
    groceryItems,
  } = useApp();

  const [toast, setToast] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [swapDay, setSwapDay] = useState<ItineraryDay | null>(null);
  const [editDay, setEditDay] = useState<ItineraryDay | null>(null);
  const [addCourseDay, setAddCourseDay] = useState<ItineraryDay | null>(null);
  const [moveDay, setMoveDay] = useState<ItineraryDay | null>(null);
  const [addExtraDay, setAddExtraDay] = useState<ItineraryDay | null>(null);

  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const haptic = useCallback(() => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  useEffect(() => {
    return () => { if (toastTimeout.current) clearTimeout(toastTimeout.current); };
  }, []);

  const showToast = useCallback((msg: string) => {
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    setToast(msg);
    toastTimeout.current = setTimeout(() => setToast(null), 2400);
  }, []);

  const today = toISODate(new Date());

  const isItineraryStale = useMemo(() => {
    if (currentItinerary.length === 0) return false;
    const mondayStr = toISODate(getThisWeeksMonday());
    return currentItinerary.every((entry) => entry.date < mondayStr);
  }, [currentItinerary]);

  const fullWeek = useMemo(() => {
    if (currentItinerary.length === 0) return [];

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

    const result: (ItineraryDay | { id: string; date: string; dayLabel: string; isEmpty: true; isPast?: boolean })[] = [];
    for (let i = 0; i < 7; i++) {
      const dateObj = new Date(monday);
      dateObj.setDate(monday.getDate() + i);
      const dateStr = toISODate(dateObj);
      const existing = currentItinerary.find((dd) => dd.date === dateStr);
      if (existing) {
        result.push(existing);
      } else {
        result.push({ id: `empty-${dateStr}`, date: dateStr, dayLabel: DAY_LABELS_SHORT[i], isEmpty: true, isPast: dateStr < today });
      }
    }
    return result;
  }, [currentItinerary, today]);

  const weekDates = useMemo(() => fullWeek.map(d => d.date), [fullWeek]);

  const allDone = currentItinerary.length > 0 &&
    currentItinerary.every((d) => d.status === "completed" || d.status === "skipped");

  const uncheckedGroceryCount = useMemo(() => {
    if (!groceryItems || groceryItems.length === 0) return 0;
    return groceryItems.filter((g) => !g.checked).length;
  }, [groceryItems]);

  const handleReloadDay = (day: ItineraryDay) => {
    haptic();
    const updated = reloadDay(day, currentItinerary, itineraryProfile!, selectedCountryIds);
    setCurrentItinerary((prev) => prev.map((d) => (d.id === day.id ? updated : d)));
    const oldIds = day.mode === "quick" ? day.quickRecipeIds : day.fullRecipeIds;
    const newIds = updated.mode === "quick" ? updated.quickRecipeIds : updated.fullRecipeIds;
    for (const rid of oldIds) { const r = getRecipeById(rid); if (r) removeFromGrocery(r); }
    for (const rid of newIds) { const r = getRecipeById(rid); if (r) addToGrocery(r); }
  };

  const handleSkipDay = (day: ItineraryDay) => {
    haptic();
    setCurrentItinerary((prev) => prev.map((d) => d.id === day.id ? { ...d, status: "skipped" as const } : d));
    const ids = day.mode === "quick" ? day.quickRecipeIds : day.fullRecipeIds;
    const allIds = [...ids, ...(day.extraRecipeIds ?? [])];
    for (const rid of allIds) { const r = getRecipeById(rid); if (r) removeFromGrocery(r); }
  };

  const handleRestoreDay = (day: ItineraryDay) => {
    haptic();
    setCurrentItinerary((prev) => prev.map((d) => d.id === day.id ? { ...d, status: "active" as const } : d));
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
      const mergedQuick = [...new Set([...targetDay.quickRecipeIds, ...fromDay.quickRecipeIds])];
      const mergedFull  = [...new Set([...targetDay.fullRecipeIds,  ...fromDay.fullRecipeIds])];
      updated = currentItinerary
        .filter((d) => d.id !== fromDay.id)
        .map((d) => d.id === targetDay.id ? { ...d, quickRecipeIds: mergedQuick, fullRecipeIds: mergedFull } : d)
        .sort((a, b) => a.date.localeCompare(b.date));
    } else {
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
    addCourseToDay(day.date, recipe.id);
    addToGrocery(recipe);
    setAddExtraDay(null);
    showToast(`Added ${recipe.name}`);
  }, [addCourseToDay, addToGrocery, showToast]);

  const handleNewWeek = () => {
    haptic();
    if (currentItinerary.length > 0) addToItineraryHistory(currentItinerary);
    const nextMonday = getThisWeeksMonday();
    nextMonday.setDate(nextMonday.getDate() + 7);
    const newItinerary = generateItinerary(itineraryProfile!, selectedCountryIds, itineraryHistory, undefined, nextMonday);
    setCurrentItinerary(newItinerary);
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

  return (
    <View style={styles.container}>

      <View style={[styles.headerBar, { paddingTop: Platform.OS === "web" ? 16 : insets.top + 4 }]}>
        <View style={{ width: 32 }} />
        <Text style={styles.headerBrandName}>The Culinary Editorial</Text>
        <Pressable
          onPress={() => { haptic(); setShowProfile(true); }}
          style={styles.avatarBtn}
          accessibilityLabel="Profile"
        >
          <Ionicons name="person" size={14} color={Colors.light.outline} />
        </Pressable>
      </View>

      {showProfile && <ProfileSheet onClose={() => setShowProfile(false)} />}

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
            <Text style={styles.ctaText}>Plan My Week</Text>
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
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Platform.OS === "web" ? 140 : insets.bottom + SCROLL_BOTTOM_INSET }]}
        >
          {uncheckedGroceryCount > 0 && (
            <View style={styles.groceryBanner}>
              <View style={styles.groceryBannerContent}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.groceryBannerEyebrow}>Grocery Status</Text>
                  <Text style={styles.groceryBannerTitle}>{uncheckedGroceryCount} items remaining</Text>
                </View>
                <View style={styles.groceryBannerIcon}>
                  <Ionicons name="cart" size={22} color={Colors.light.primary} />
                </View>
              </View>
              <View style={styles.groceryBannerActions}>
                <Pressable
                  onPress={() => { haptic(); router.push("/(tabs)/grocery"); }}
                  style={({ pressed }) => [styles.groceryBannerBtn, styles.groceryBannerBtnPrimary, pressed && { opacity: 0.88 }]}
                >
                  <Text style={styles.groceryBannerBtnPrimaryText}>View List</Text>
                </Pressable>
              </View>
            </View>
          )}

          <View style={styles.weekHeader}>
            <Text style={styles.weekTitle}>The Weekly Plan</Text>
            <Text style={styles.weekRange}>{getWeekRange(weekDates)}</Text>
          </View>

          <View style={styles.weekList}>
            {fullWeek.map((entry, index) => {
              const isToday = entry.date === today;

              if ("isEmpty" in entry) {
                const isPastEmpty = !!entry.isPast;
                return (
                  <EmptyDayRow
                    key={`${entry.id}-${index}`}
                    date={entry.date}
                    dayLabel={entry.dayLabel}
                    isPast={isPastEmpty}
                    isToday={isToday}
                    onAdd={isPastEmpty ? undefined : () => handleAddMealToDay(entry.date, entry.dayLabel)}
                  />
                );
              }
              return (
                <DayRow
                  key={`${entry.id}-${index}`}
                  day={entry}
                  isToday={isToday}
                  isPast={entry.date < today}
                  onEdit={() => { haptic(); setEditDay(entry); }}
                  onSkip={() => handleSkipDay(entry)}
                  onRestore={() => handleRestoreDay(entry)}
                  onAddCourse={() => { haptic(); setAddCourseDay(entry); }}
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

          {currentItinerary.some(d => d.date === today && d.status === "active") && (
            <Pressable
              onPress={() => router.push("/(tabs)/cook")}
              style={({ pressed }) => [styles.readyToCookBtn, pressed && { opacity: 0.88 }]}
              accessibilityLabel="Ready to cook tonight"
            >
              <Ionicons name="flame" size={18} color={Colors.light.onPrimary} />
              <Text style={styles.readyToCookText}>Ready to Cook Tonight</Text>
            </Pressable>
          )}
        </ScrollView>
      )}

      </View>

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
                  onPress={() => { const d = editDay; setEditDay(null); setTimeout(() => setAddExtraDay(d), 200); }}
                >
                  <View style={editMenuStyles.menuIconCircle}>
                    <Ionicons name="search-outline" size={18} color={Colors.light.primary} />
                  </View>
                  <View>
                    <Text style={editMenuStyles.menuItemTitle}>Browse & add recipe</Text>
                    <Text style={editMenuStyles.menuItemSub}>Search saved recipes or get a surprise</Text>
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

      <Modal visible={!!swapDay} transparent animationType="slide" onRequestClose={() => setSwapDay(null)}>
        {swapDay && (
          <SwapSheet
            day={swapDay}
            onSelectRecipe={(recipe) => {
              const updated: ItineraryDay = {
                ...swapDay,
                countryId: recipe.countryId,
                regionId: recipe.region ?? "",
                quickRecipeIds: [recipe.id],
                fullRecipeIds: [recipe.id],
                extraRecipeIds: swapDay.extraRecipeIds,
                status: "active",
              };
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
                {fullWeek
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

      {toast && (
        <View style={[styles.toast, { bottom: (Platform.OS === "web" ? 150 : insets.bottom + SCROLL_BOTTOM_INSET) }]}>
          <Ionicons name="checkmark-circle" size={16} color={Colors.light.surface} />
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}

    </View>
  );
}

function DayRow({ day, isToday, isPast, onEdit, onSkip, onRestore, onAddCourse }: {
  day: ItineraryDay;
  isToday: boolean;
  isPast: boolean;
  onEdit: () => void;
  onSkip: () => void;
  onRestore: () => void;
  onAddCourse: () => void;
}) {
  const country = getCountryById(day.countryId);
  const recipeIds = day.mode === "quick" ? day.quickRecipeIds : day.fullRecipeIds;
  const recipes = recipeIds.map(getRecipeById).filter((r): r is Recipe => !!r);
  const extraRecipes = (day.extraRecipeIds ?? []).map(getRecipeById).filter((r): r is Recipe => !!r);
  const isSkipped = day.status === "skipped";
  const isCompleted = day.status === "completed";
  const haptic = () => { if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); };

  const mainRecipe = recipes[0];

  const totalMinutes = useMemo(() => {
    let total = 0;
    const ids = [...recipeIds, ...(day.extraRecipeIds ?? [])];
    for (const rid of ids) {
      const r = getRecipeById(rid);
      if (r) total += parseTimeMinutes(r.time);
    }
    return total;
  }, [recipeIds, day.extraRecipeIds]);

  const d = new Date(day.date + "T12:00:00");
  const dayShort = d.toLocaleDateString("en-US", { weekday: "short" });
  const dateFormatted = formatShortDate(day.date);

  if (!country) return null;

  return (
    <View style={[
      styles.dayContainer,
      isToday && styles.dayContainerToday,
      isPast && !isToday && { opacity: 0.45 },
    ]}>
      <View style={styles.dayInner}>
        <View style={styles.dayLeftCol}>
          <Text style={[styles.dayName, isToday && styles.dayNameToday]}>
            {dayShort}
          </Text>
          <Text style={[styles.dayDate, isToday && styles.dayDateToday]}>
            {isToday ? `Today` : dateFormatted}
          </Text>
        </View>

        <View style={styles.dayRightCol}>
          {isSkipped ? (
            <View style={styles.skippedCard}>
              <Text style={styles.skippedText}>Skipped</Text>
              <Pressable onPress={onRestore} hitSlop={8}>
                <Text style={styles.restoreLink}>Restore</Text>
              </Pressable>
            </View>
          ) : mainRecipe ? (
            <View style={styles.recipeCardCol}>
              <Pressable
                onPress={() => { haptic(); router.push({ pathname: "/recipe/[id]", params: { id: mainRecipe.id } }); }}
                style={({ pressed }) => [
                  styles.recipeCard,
                  isToday && styles.recipeCardToday,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <View style={styles.recipeThumbWrap}>
                  <Image
                    source={{ uri: mainRecipe.image }}
                    style={styles.recipeThumb}
                    contentFit="cover"
                    onError={(e) => console.warn("[Image] Failed to load:", e.error)}
                  />
                </View>
                <View style={styles.recipeInfo}>
                  <Text style={styles.recipeName} numberOfLines={1} ellipsizeMode="tail">
                    {recipes.length > 1 ? recipes.map(r => r.name).join(" + ") : mainRecipe.name}
                  </Text>
                  <Text style={styles.recipeSub} numberOfLines={1}>
                    {mainRecipe.region && mainRecipe.region !== country.name
                      ? `${mainRecipe.region}, ${country.name}`
                      : country.name}
                  </Text>
                  <View style={styles.recipeBadges}>
                    <View style={styles.recipeBadge}>
                      <Ionicons name="speedometer-outline" size={12} color="rgba(87,66,56,0.6)" />
                      <Text style={styles.recipeBadgeText}>{mainRecipe.difficulty ?? "Easy"}</Text>
                    </View>
                    <View style={styles.recipeBadge}>
                      <Ionicons name="time-outline" size={12} color="rgba(87,66,56,0.6)" />
                      <Text style={styles.recipeBadgeText}>{mainRecipe.time}</Text>
                    </View>
                  </View>
                </View>
                {!isPast && (
                  <Pressable
                    onPress={(e) => { e.stopPropagation(); onEdit(); }}
                    style={styles.editDot}
                    hitSlop={10}
                  >
                    <Ionicons name="ellipsis-vertical" size={16} color={Colors.light.secondary} />
                  </Pressable>
                )}
              </Pressable>

              {!isSkipped && !isPast && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.coursePillRow}
                >
                  {extraRecipes.map((r) => (
                    <View key={r.id} style={styles.coursePillAdded}>
                      <Ionicons name="checkmark" size={12} color={Colors.light.primary} />
                      <Text style={styles.coursePillAddedText} numberOfLines={1}>{r.name}</Text>
                      {r.time ? (
                        <Text style={styles.coursePillTime}>{r.time}</Text>
                      ) : null}
                    </View>
                  ))}
                  <Pressable
                    onPress={onAddCourse}
                    style={({ pressed }) => [styles.coursePill, pressed && { opacity: 0.7 }]}
                  >
                    <Ionicons name="add" size={14} color={Colors.light.secondary} />
                    <Text style={styles.coursePillText}>Course</Text>
                  </Pressable>
                </ScrollView>
              )}
            </View>
          ) : null}
        </View>
      </View>

      {!isSkipped && totalMinutes > 0 && (
        <View style={styles.totalTimeRow}>
          <Text style={[styles.totalTimeText, isToday && { color: "rgba(154,65,0,0.7)" }]}>
            Total Time: {formatTotalTime(totalMinutes)}
          </Text>
        </View>
      )}

      {isCompleted && (
        <View style={styles.completedBadge}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.light.success }} />
          <Text style={styles.completedText}>Cooked</Text>
        </View>
      )}
    </View>
  );
}

function EmptyDayRow({ date, dayLabel, isPast, isToday, onAdd }: {
  date: string;
  dayLabel: string;
  isPast: boolean;
  isToday: boolean;
  onAdd?: () => void;
}) {
  const d = new Date(date + "T12:00:00");
  const dayShort = d.toLocaleDateString("en-US", { weekday: "short" });
  const dateFormatted = formatShortDate(date);

  return (
    <View style={[styles.dayContainer, isPast && { opacity: 0.45 }]}>
      <View style={styles.dayInner}>
        <View style={styles.dayLeftCol}>
          <Text style={styles.dayName}>{dayShort}</Text>
          <Text style={styles.dayDate}>{dateFormatted}</Text>
        </View>
        <View style={styles.dayRightCol}>
          {isPast ? (
            <View style={styles.emptyPastCard}>
              <Text style={styles.emptyPastText}>No meal planned</Text>
            </View>
          ) : (
            <Pressable
              onPress={onAdd}
              style={({ pressed }) => [
                styles.emptyDayCard,
                pressed && { backgroundColor: Colors.light.surfaceContainerLow, borderColor: "rgba(154,65,0,0.3)" },
              ]}
            >
              <Ionicons name="add-circle" size={28} color={Colors.light.primary} />
              <Text style={styles.emptyDayTitle}>Schedule Meal</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

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

        <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
          {filteredRecipes.map(recipe => {
            const alreadyAdded = existingIds.has(recipe.id);
            return (
              <Pressable
                key={recipe.id}
                onPress={() => { if (!alreadyAdded) { onAdd(recipe.id); onClose(); } }}
                style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.light.outlineVariant, opacity: alreadyAdded ? 0.4 : 1 }}
              >
                <Image source={{ uri: recipe.image }} style={{ width: 44, height: 44, borderRadius: 8 }} contentFit="cover" onError={(e) => console.warn("[Image] Failed to load:", e.error)} />
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

  const suggestions = useMemo(() => {
    const currentDifficulty = currentRecipes[0]?.difficulty ?? "Easy";
    const resolved = getAllRecipes().filter(
      (recipe) => !currentRecipeIds.includes(recipe.id) && recipe.difficulty === currentDifficulty
    );
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.surface },

  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: Colors.light.surface,
  },
  headerBrandName: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 18,
    color: Colors.light.primary,
    letterSpacing: -0.3,
  },
  avatarBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.surfaceContainerHigh,
    alignItems: "center",
    justifyContent: "center",
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 0,
  },

  groceryBanner: {
    backgroundColor: "rgba(154,65,0,0.05)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(154,65,0,0.1)",
  },
  groceryBannerContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  groceryBannerEyebrow: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "rgba(154,65,0,0.7)",
    marginBottom: 4,
  },
  groceryBannerTitle: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 17,
    color: Colors.light.primary,
    lineHeight: 22,
  },
  groceryBannerIcon: {
    backgroundColor: "rgba(154,65,0,0.1)",
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  groceryBannerActions: {
    flexDirection: "row",
    gap: 10,
  },
  groceryBannerBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  groceryBannerBtnPrimary: {
    backgroundColor: Colors.light.primary,
  },
  groceryBannerBtnPrimaryText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.light.onPrimary,
  },

  weekHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  weekTitle: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 26,
    color: Colors.light.onSurface,
    letterSpacing: -0.5,
  },
  weekRange: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.light.secondary,
  },

  weekList: {
    gap: 28,
  },

  dayContainer: {
    gap: 0,
  },
  dayContainerToday: {
    backgroundColor: "rgba(154,65,0,0.04)",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(154,65,0,0.08)",
  },
  dayInner: {
    flexDirection: "row",
    gap: 16,
    alignItems: "flex-start",
  },
  dayLeftCol: {
    width: 56,
    paddingTop: 2,
  },
  dayName: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 18,
    color: Colors.light.primary,
    lineHeight: 24,
  },
  dayNameToday: {
    fontSize: 22,
    color: Colors.light.primary,
  },
  dayDate: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    color: Colors.light.secondary,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    lineHeight: 16,
  },
  dayDateToday: {
    color: "rgba(154,65,0,0.6)",
    letterSpacing: 1,
  },
  dayRightCol: {
    flex: 1,
  },

  recipeCardCol: {
    gap: 8,
  },
  recipeCard: {
    flexDirection: "row",
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: 16,
    padding: 12,
    gap: 12,
    alignItems: "center",
  },
  recipeCardToday: {
    backgroundColor: Colors.light.surfaceContainerLow,
    borderWidth: 1,
    borderColor: "rgba(154,65,0,0.1)",
  },
  recipeThumbWrap: {
    width: 72,
    height: 72,
    borderRadius: 12,
    overflow: "hidden",
  },
  recipeThumb: {
    width: "100%",
    height: "100%",
  },
  recipeInfo: {
    flex: 1,
    gap: 3,
    justifyContent: "center",
  },
  recipeName: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 16,
    color: Colors.light.onSurface,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  recipeSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.light.secondary,
    lineHeight: 18,
  },
  recipeBadges: {
    flexDirection: "row",
    gap: 10,
    marginTop: 2,
  },
  recipeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  recipeBadgeText: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: "rgba(87,66,56,0.6)",
  },
  editDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  coursePillRow: {
    gap: 8,
    paddingBottom: 2,
  },
  coursePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(222,193,179,0.3)",
    borderRadius: 12,
    backgroundColor: "transparent",
  },
  coursePillText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.light.secondary,
  },
  coursePillAdded: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.light.surfaceContainerHighest,
    borderRadius: 12,
  },
  coursePillAddedText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.light.primary,
    maxWidth: 100,
  },
  coursePillTime: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: "rgba(154,65,0,0.5)",
    marginLeft: 2,
  },

  totalTimeRow: {
    alignItems: "flex-end",
    marginTop: 8,
  },
  totalTimeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: "rgba(102,102,102,0.7)",
    letterSpacing: 2,
    textTransform: "uppercase",
  },

  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-end",
    marginTop: 4,
  },
  completedText: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    color: Colors.light.success,
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  skippedCard: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "rgba(138,114,102,0.15)",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  skippedText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.light.secondary,
  },
  restoreLink: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.light.primary,
  },

  emptyDayCard: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "rgba(222,193,179,0.3)",
    borderRadius: 16,
    paddingVertical: 22,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  emptyDayTitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.light.secondary,
  },
  emptyPastCard: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "rgba(138,114,102,0.1)",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyPastText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.light.secondary,
  },

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

  readyToCookBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.light.primary,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  readyToCookText: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 16,
    color: Colors.light.surface,
  },
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
