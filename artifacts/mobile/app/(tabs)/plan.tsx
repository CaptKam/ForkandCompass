import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from "react-native-draggable-flatlist";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  FlatList,
  Linking,
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
import { COUNTRIES, getAllRecipes, getCountryById, getRecipeById, type GroceryItem, type Recipe } from "@/constants/data";
import { type PantryStaple } from "@/constants/pantry";
import { PARTNER_CONFIG } from "@/constants/partners";
import { SCROLL_BOTTOM_INSET } from "@/constants/spacing";
import { useApp } from "@/contexts/AppContext";
import { convertAmount } from "@/constants/units";
import { reloadDay, generateItinerary, type ItineraryDay } from "@/hooks/useItinerary";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDayDate(isoDate: string): string {
  const d = new Date(isoDate + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Grocery categorisation ───────────────────────────────────────────────────

const CATEGORY_RULES: { key: string; emoji: string; label: string; keywords: string[] }[] = [
  { key: "produce", emoji: "🥬", label: "Produce", keywords: ["tomato", "basil", "garlic", "onion", "pepper", "lemon", "lime", "cilantro", "chili", "ginger", "scallion", "lettuce", "avocado", "jalape", "serrano", "mint", "lemongrass", "galangal", "shallot", "kaffir", "coriander root", "bean sprout", "vegetable", "herb", "leaves"] },
  { key: "protein", emoji: "🥩", label: "Protein", keywords: ["chicken", "pork", "beef", "lamb", "fish", "shrimp", "prawn", "egg", "tofu", "meat", "rib", "thigh", "breast", "salmon", "tuna", "prosciutto"] },
  { key: "dairy", emoji: "🧈", label: "Dairy", keywords: ["cheese", "cream", "milk", "butter", "yogurt", "mozzarella", "pecorino", "parmesan", "ghee", "paneer"] },
  { key: "pantry", emoji: "🫙", label: "Pantry", keywords: ["oil", "vinegar", "salt", "sugar", "flour", "rice", "noodle", "pasta", "soy sauce", "fish sauce", "spice", "cumin", "turmeric", "paprika", "cinnamon", "sauce", "stock", "broth", "wine", "miso", "dashi", "coconut", "curry", "paste", "sesame", "peanut", "bread", "tortilla", "wrap"] },
];

function categorizeItem(name: string): { emoji: string; label: string } {
  const lower = name.toLowerCase();
  for (const cat of CATEGORY_RULES) {
    if (cat.keywords.some((kw) => lower.includes(kw))) {
      return { emoji: cat.emoji, label: cat.label };
    }
  }
  return { emoji: "🫙", label: "Pantry" };
}

interface CategoryGroup {
  emoji: string;
  label: string;
  items: GroceryItem[];
}

type PlanSegment = "week" | "grocery";

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
    groceryItems,
    toggleGroceryItem,
    removeGroceryItem,
    clearGrocery,
    unexcludeGroceryItem,
    quickAddStaple,
    pantryStaples,
    togglePantryStaple,
    groceryPartner,
    setGroceryPartner,
    savedRecipeIds,
    measurementSystem,
  } = useApp();

  const [segment, setSegment] = useState<PlanSegment>("week");
  const [toast, setToast] = useState<string | null>(null);
  const [kitchenExpanded, setKitchenExpanded] = useState(false);
  const [swapDay, setSwapDay] = useState<ItineraryDay | null>(null);
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const segmentAnim = useRef(new Animated.Value(0)).current;

  const haptic = useCallback(() => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const showToast = useCallback((msg: string) => {
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    setToast(msg);
    toastTimeout.current = setTimeout(() => setToast(null), 2400);
  }, []);

  const switchSegment = useCallback((seg: PlanSegment) => {
    haptic();
    setSegment(seg);
    Animated.timing(segmentAnim, {
      toValue: seg === "week" ? 0 : 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [haptic, segmentAnim]);

  const today = toISODate(new Date());

  const todayDay = useMemo(
    () => currentItinerary.find((d) => d.date === today && d.status === "active"),
    [currentItinerary, today]
  );

  const DAY_LABELS_FULL = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const fullWeek = useMemo(() => {
    if (currentItinerary.length === 0) return [];
    const d = new Date();
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(d);
    monday.setDate(d.getDate() + diff);
    monday.setHours(0, 0, 0, 0);

    const result: (ItineraryDay | { id: string; date: string; dayLabel: string; isEmpty: true })[] = [];
    for (let i = 0; i < 7; i++) {
      const dateObj = new Date(monday);
      dateObj.setDate(monday.getDate() + i);
      const dateStr = toISODate(dateObj);
      const existing = currentItinerary.find((dd) => dd.date === dateStr);
      if (existing) {
        result.push(existing);
      } else {
        result.push({ id: `empty-${dateStr}`, date: dateStr, dayLabel: DAY_LABELS_FULL[i], isEmpty: true });
      }
    }
    return result;
  }, [currentItinerary, today]);

  const allDone = currentItinerary.length > 0 &&
    currentItinerary.every((d) => d.status === "completed" || d.status === "skipped");

  const activeGroceryItems = useMemo(
    () => groceryItems.filter((i) => !i.excluded),
    [groceryItems]
  );

  const excludedGroceryItems = useMemo(
    () => groceryItems.filter((i) => i.excluded),
    [groceryItems]
  );

  const uncheckedGroceryCount = useMemo(
    () => activeGroceryItems.filter((i) => !i.checked).length,
    [activeGroceryItems]
  );

  const categoryGroups = useMemo(() => {
    const groups: Record<string, CategoryGroup> = {};
    for (const item of activeGroceryItems) {
      const { emoji, label } = categorizeItem(item.name);
      if (!groups[label]) groups[label] = { emoji, label, items: [] };
      groups[label].items.push(item);
    }
    const order = CATEGORY_RULES.map((c) => c.label);
    return Object.values(groups).sort((a, b) => order.indexOf(a.label) - order.indexOf(b.label));
  }, [activeGroceryItems]);

  const pantryNeedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const staple of pantryStaples) {
      if (!staple.inKitchen) continue;
      const inGrocery = activeGroceryItems.some((gi) =>
        staple.keywords.some((kw) => gi.name.toLowerCase().includes(kw.toLowerCase()))
      );
      if (inGrocery) ids.add(staple.id);
    }
    return ids;
  }, [pantryStaples, activeGroceryItems]);

  const handlePantryTap = useCallback((staple: typeof pantryStaples[0]) => {
    haptic();
    if (!staple.inKitchen) {
      togglePantryStaple(staple.id);
      return;
    }
    if (pantryNeedIds.has(staple.id)) {
      const match = activeGroceryItems.find((gi) =>
        staple.keywords.some((kw) => gi.name.toLowerCase().includes(kw.toLowerCase()))
      );
      if (match) removeGroceryItem(match.id);
    } else {
      quickAddStaple(staple);
    }
  }, [pantryNeedIds, activeGroceryItems, togglePantryStaple, quickAddStaple, removeGroceryItem]);

  // ─── Itinerary actions ──────────────────────────────────────────────────────

  const handleReloadDay = (day: ItineraryDay) => {
    haptic();
    const updated = reloadDay(day, currentItinerary, itineraryProfile!, selectedCountryIds);
    setCurrentItinerary(currentItinerary.map((d) => (d.id === day.id ? updated : d)));
    // Swap grocery: remove old recipes, add new ones
    const oldIds = day.mode === "quick" ? day.quickRecipeIds : day.fullRecipeIds;
    const newIds = updated.mode === "quick" ? updated.quickRecipeIds : updated.fullRecipeIds;
    for (const rid of oldIds) { const r = getRecipeById(rid); if (r) removeFromGrocery(r); }
    for (const rid of newIds) { const r = getRecipeById(rid); if (r) addToGrocery(r); }
  };

  const handleSkipDay = (day: ItineraryDay) => {
    haptic();
    setCurrentItinerary(currentItinerary.map((d) => d.id === day.id ? { ...d, status: "skipped" as const } : d));
    // Remove this day's recipes from grocery
    const ids = day.mode === "quick" ? day.quickRecipeIds : day.fullRecipeIds;
    for (const rid of ids) { const r = getRecipeById(rid); if (r) removeFromGrocery(r); }
  };

  const handleRestoreDay = (day: ItineraryDay) => {
    haptic();
    setCurrentItinerary(currentItinerary.map((d) => d.id === day.id ? { ...d, status: "active" as const } : d));
    const ids = day.mode === "quick" ? day.quickRecipeIds : day.fullRecipeIds;
    for (const rid of ids) { const r = getRecipeById(rid); if (r) addToGrocery(r); }
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

  const handleNewWeek = () => {
    haptic();
    if (currentItinerary.length > 0) addToItineraryHistory(currentItinerary);
    const newItinerary = generateItinerary(itineraryProfile!, selectedCountryIds, itineraryHistory);
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

  // ─── Drag reorder ────────────────────────────────────────────────────────────

  const handleDragEnd = useCallback(
    ({ data: newOrder }: { data: typeof fullWeek }) => {
      haptic();
      const originalDates = fullWeek.map((item) => item.date);
      const dateChanges = new Map<string, string>();
      newOrder.forEach((item, index) => {
        const newDate = originalDates[index];
        if (!("isEmpty" in item) && item.date !== newDate) {
          dateChanges.set(item.id, newDate);
        }
      });
      if (dateChanges.size === 0) return;
      const updated = currentItinerary.map((day) => {
        if (!dateChanges.has(day.id)) return day;
        const newDate = dateChanges.get(day.id)!;
        const d = new Date(newDate + "T12:00:00");
        const newDayLabel = d.toLocaleDateString("en-US", { weekday: "long" });
        return { ...day, date: newDate, dayLabel: newDayLabel };
      }).sort((a, b) => a.date.localeCompare(b.date));
      setCurrentItinerary(updated);
    },
    [fullWeek, currentItinerary, setCurrentItinerary]
  );

  // ─── Grocery actions ─────────────────────────────────────────────────────────

  const handleClearCompleted = () => {
    if (Platform.OS === "web") {
      activeGroceryItems.filter((i) => i.checked).forEach((i) => removeGroceryItem(i.id));
      return;
    }
    Alert.alert("Clear Completed", "Remove all checked items?", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", onPress: () => activeGroceryItems.filter((i) => i.checked).forEach((i) => removeGroceryItem(i.id)) },
    ]);
  };

  const handleCheckoutFab = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!groceryPartner || groceryPartner === "skip") return;
    const itemsToOrder = activeGroceryItems.filter((i) => !i.checked);
    if (groceryPartner === "instacart") {
      try {
        const response = await fetch("/api/instacart/shopping-list", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "My Fork & Compass List",
            items: itemsToOrder.map((i) => ({ name: i.name, amount: i.amount, recipeName: i.recipeName })),
          }),
        });
        const data = await response.json() as { url?: string; error?: string };
        if (!response.ok || !data.url) throw new Error(data.error ?? "Could not create shopping list");
        await Linking.openURL(data.url);
      } catch (err: unknown) {
        Alert.alert("Instacart Error", err instanceof Error ? err.message : "Something went wrong");
      }
    } else if (groceryPartner === "kroger") {
      await Linking.openURL("https://www.kroger.com/stores/details/700/00100");
    } else if (groceryPartner === "walmart") {
      await Linking.openURL("https://www.walmart.com/grocery");
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>

      {/* ── Header with Segment Control ──────────────────────────── */}
      <View style={[styles.headerSection, { paddingTop: Platform.OS === "web" ? 28 : insets.top + 16 }]}>
        {/* Full-width segmented control */}
        <View style={styles.segmentControl}>
          <Pressable
            style={[styles.segmentBtn, segment === "week" && styles.segmentBtnActive]}
            onPress={() => switchSegment("week")}
          >
            <Text style={[styles.segmentText, segment === "week" && styles.segmentTextActive]}>
              This Week
            </Text>
          </Pressable>
          <Pressable
            style={[styles.segmentBtn, segment === "grocery" && styles.segmentBtnActive]}
            onPress={() => switchSegment("grocery")}
          >
            <Text style={[styles.segmentText, segment === "grocery" && styles.segmentTextActive]}>
              Grocery
            </Text>
            {uncheckedGroceryCount > 0 && (
              <View style={[styles.segmentBadge, segment === "grocery" && styles.segmentBadgeActive]}>
                <Text style={[styles.segmentBadgeText, segment === "grocery" && styles.segmentBadgeTextActive]}>
                  {uncheckedGroceryCount}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Title block below control */}
        <View style={styles.headerTitleBlock}>
          <View style={styles.headerEyebrow}>
            <View style={styles.headerEyebrowLine} />
            <Text style={styles.headerEyebrowLabel}>
              {segment === "week" ? "This Week" : "Curated List"}
            </Text>
            <View style={styles.headerEyebrowLine} />
          </View>
          <Text style={styles.headerTitle}>
            {segment === "week" ? "Weekly Table" : "Grocery List"}
          </Text>
          <Text style={styles.headerSubtitle}>
            {segment === "week"
              ? "Curating your seasonal menu, week by week."
              : "Sourced from your weekly meal planning."}
          </Text>
        </View>
      </View>

      {/* ── This Week ─────────────────────────────────────────────── */}
      {segment === "week" && (
        !itineraryProfile ? (
          /* Empty state */
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
          /* All Done */
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
          /* Active itinerary */
          Platform.OS === "web" ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.weekScrollContent, { paddingBottom: 140 }]}
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
                      key={entry.id}
                      date={entry.date}
                      dayLabel={entry.dayLabel}
                      isLast={index === fullWeek.length - 1}
                      onAdd={() => handleAddMealToDay(entry.date, entry.dayLabel)}
                    />
                  );
                }
                return (
                  <WeekRow
                    key={entry.id}
                    day={entry}
                    isLast={index === fullWeek.length - 1}
                    isToday={entry.date === today}
                    isPast={entry.date < today}
                    onReload={() => { haptic(); setSwapDay(entry); }}
                    onSkip={() => handleSkipDay(entry)}
                    onRestore={() => handleRestoreDay(entry)}
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
          </ScrollView>
          ) : (
          <DraggableFlatList
            data={fullWeek}
            keyExtractor={(item) => item.id}
            onDragEnd={handleDragEnd}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.weekScrollContent, { paddingBottom: insets.bottom + SCROLL_BOTTOM_INSET }]}
            ListHeaderComponent={
              todayDay ? (
                <View>
                  <Text style={styles.sectionLabel}>TONIGHT</Text>
                  <TonightCard day={todayDay} servings={itineraryProfile?.defaultServings ?? 4} />
                </View>
              ) : null
            }
            ListFooterComponent={
              <Pressable
                onPress={handleNewWeek}
                style={({ pressed }) => [styles.newWeekLink, pressed && { opacity: 0.6 }]}
              >
                <Text style={styles.newWeekText}>Generate new week</Text>
              </Pressable>
            }
            renderItem={({ item: entry, drag, isActive, getIndex }) => {
              const index = getIndex() ?? 0;
              if ("isEmpty" in entry) {
                return (
                  <EmptyDayRow
                    date={entry.date}
                    dayLabel={entry.dayLabel}
                    isLast={index === fullWeek.length - 1}
                    onAdd={() => handleAddMealToDay(entry.date, entry.dayLabel)}
                  />
                );
              }
              return (
                <ScaleDecorator activeScale={1.02}>
                  <WeekRow
                    day={entry}
                    isLast={index === fullWeek.length - 1}
                    isToday={entry.date === today}
                    isPast={entry.date < today}
                    onReload={() => { haptic(); setSwapDay(entry); }}
                    onSkip={() => handleSkipDay(entry)}
                    onRestore={() => handleRestoreDay(entry)}
                    drag={drag}
                    isActive={isActive}
                  />
                </ScaleDecorator>
              );
            }}
          />
          )
        )
      )}

      {/* ── Grocery ────────────────────────────────────────────────── */}
      {segment === "grocery" && (
        groceryItems.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="cart-outline" size={48} color={Colors.light.primary} />
            </View>
            <Text style={styles.emptyTitle}>Your grocery list is empty</Text>
            <Text style={styles.emptyBody}>Add ingredients from recipes or your weekly plan.</Text>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <FlatList
              data={categoryGroups}
              keyExtractor={(item) => item.label}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.groceryScrollContent,
                { paddingBottom: Platform.OS === "web" ? 80 : insets.bottom + SCROLL_BOTTOM_INSET },
              ]}
              ListHeaderComponent={
                <View>
                  {/* My Pantry */}
                  <View style={styles.pantrySection}>
                    <Text style={styles.pantryLabel}>My Pantry</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.pantryScroll}
                    >
                      {pantryStaples.filter((s) => s.inKitchen).map((staple) => {
                        const needsMore = pantryNeedIds.has(staple.id);
                        return (
                          <Pressable
                            key={staple.id}
                            onPress={() => handlePantryTap(staple)}
                            style={({ pressed }) => [
                              styles.pantryPill,
                              needsMore && styles.pantryPillNeed,
                              pressed && { opacity: 0.75 },
                            ]}
                          >
                            <Text
                              style={[
                                styles.pantryPillText,
                                needsMore && styles.pantryPillTextNeed,
                              ]}
                            >
                              {staple.ingredient}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  </View>
                </View>
              }
              renderItem={({ item: group }) => (
                <View style={styles.categoryGroup}>
                  <Text style={styles.categoryHeader}>{group.label.toUpperCase()}</Text>
                  {group.items.map((item, idx) => (
                    <GroceryRow
                      key={item.id}
                      item={item}
                      isLast={idx === group.items.length - 1}
                      measurementSystem={measurementSystem}
                      onToggle={() => {
                        if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        toggleGroceryItem(item.id);
                      }}
                    />
                  ))}
                </View>
              )}
              ListFooterComponent={
                <View>
                  <View style={{ flexDirection: "row", justifyContent: "center", gap: 20 }}>
                    {activeGroceryItems.filter((i) => i.checked).length > 0 && (
                      <Pressable onPress={handleClearCompleted} style={styles.clearCompletedBtn}>
                        <Text style={styles.clearCompletedText}>Clear Completed</Text>
                      </Pressable>
                    )}
                    {activeGroceryItems.length > 0 && (
                      <Pressable
                        onPress={() => { haptic(); clearGrocery(); }}
                        style={styles.clearCompletedBtn}
                      >
                        <Text style={[styles.clearCompletedText, { color: Colors.light.error }]}>Clear All</Text>
                      </Pressable>
                    )}
                  </View>
                  {/* In your kitchen collapsible */}
                  {excludedGroceryItems.length > 0 && (
                    <View style={styles.kitchenSection}>
                      <Pressable
                        onPress={() => { haptic(); setKitchenExpanded((v) => !v); }}
                        style={styles.kitchenHeader}
                      >
                        <Ionicons
                          name={kitchenExpanded ? "chevron-down" : "chevron-forward"}
                          size={14}
                          color={Colors.light.secondary}
                        />
                        <Text style={styles.kitchenHeaderText}>
                          In your kitchen ({excludedGroceryItems.length} items)
                        </Text>
                      </Pressable>
                      {kitchenExpanded && (
                        <View style={styles.kitchenList}>
                          {excludedGroceryItems.map((item, idx) => (
                            <Pressable
                              key={item.id}
                              onPress={() => { haptic(); unexcludeGroceryItem(item.id); showToast(`Added ${item.name} to list`); }}
                              style={[styles.kitchenRow, idx < excludedGroceryItems.length - 1 && styles.kitchenRowBorder]}
                            >
                              <Ionicons name="add-circle-outline" size={18} color={Colors.light.primary} />
                              <Text style={styles.kitchenItemName}>{item.name}</Text>
                              <Text style={styles.kitchenItemSource} ellipsizeMode="tail" numberOfLines={1}>{item.recipeName}</Text>
                            </Pressable>
                          ))}
                          <Text style={styles.kitchenHint}>Tap any item to add it back for this trip</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              }
            />

            {/* Sticky summary footer */}
            <View style={[styles.grocerySummary, { paddingBottom: Math.max(insets.bottom, 12) }]}>
              <Text style={styles.grocerySummaryText}>
                {activeGroceryItems.length} items · {activeGroceryItems.filter((i) => i.checked).length} checked
                {excludedGroceryItems.length > 0 && ` · ${excludedGroceryItems.length} in kitchen`}
              </Text>
            </View>

          </View>
        )
      )}

      {/* ── Checkout FAB — shown on both This Week and Grocery views ───── */}
      {uncheckedGroceryCount > 0 && groceryPartner && groceryPartner !== "skip" && (
        <View style={[styles.fabWrap, { bottom: Math.max(insets.bottom, 16) + 60 }]} pointerEvents="box-none">
          <LinearGradient
            colors={["rgba(254,249,243,0)", "rgba(254,249,243,0.95)", Colors.light.surface]}
            style={styles.fabGradient}
            pointerEvents="none"
          />
          <Pressable
            onPress={handleCheckoutFab}
            style={({ pressed }) => [
              styles.fab,
              { backgroundColor: PARTNER_CONFIG[groceryPartner].color },
              pressed && { opacity: 0.88, transform: [{ scale: 0.97 }] },
            ]}
          >
            <View style={styles.fabLogoWrap}>
              <Text style={styles.fabLogoText}>{PARTNER_CONFIG[groceryPartner].initial}</Text>
            </View>
            <Text style={styles.fabText}>
              Add {uncheckedGroceryCount} item{uncheckedGroceryCount !== 1 ? "s" : ""} to {PARTNER_CONFIG[groceryPartner].label}
            </Text>
            <Ionicons name="arrow-forward" size={16} color={Colors.light.onPrimary} />
          </Pressable>
        </View>
      )}

      {/* ── Swap Sheet ─────────────────────────────────────────── */}
      <Modal visible={!!swapDay} transparent animationType="slide" onRequestClose={() => setSwapDay(null)}>
        {swapDay && (
          <SwapSheet
            day={swapDay}
            onSelectRecipe={(recipe) => {
              // Replace the day with the selected recipe
              const updated: ItineraryDay = {
                ...swapDay,
                countryId: recipe.countryId,
                regionId: recipe.region ?? "",
                quickRecipeIds: [recipe.id],
                fullRecipeIds: [recipe.id],
                status: "active",
              };
              // Swap grocery
              const oldIds = swapDay.mode === "quick" ? swapDay.quickRecipeIds : swapDay.fullRecipeIds;
              for (const rid of oldIds) { const r = getRecipeById(rid); if (r) removeFromGrocery(r); }
              addToGrocery(recipe);
              setCurrentItinerary(currentItinerary.map((d) => (d.id === swapDay.id ? updated : d)));
              setSwapDay(null);
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
        </Pressable>
        <Text style={styles.tonightSubtitle}>
          {region ? `${region}, ` : ""}{country.name} · {heroRecipe.time}
        </Text>
        <Text style={styles.tonightServing}>Serving {servings}</Text>

        {/* Start Cooking → goes DIRECTLY to Cook Mode */}
        <Pressable
          onPress={() => { haptic(); router.push({ pathname: "/cook-mode", params: { recipeId: heroRecipe.id } }); }}
          style={({ pressed }) => [styles.startCookingBtn, pressed && { opacity: 0.88 }]}
        >
          <Text style={styles.startCookingText}>Start Cooking →</Text>
        </Pressable>
      </View>
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

// ─── SwapSheet ────────────────────────────────────────────────────────────────

function SwapSheet({ day, onSelectRecipe, onSurprise, onClose, savedRecipeIds }: {
  day: ItineraryDay;
  onSelectRecipe: (recipe: Recipe) => void;
  onSurprise: () => void;
  onClose: () => void;
  savedRecipeIds: string[];
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
          <Text style={swapStyles.title}>Replace {day.dayLabel}'s meal</Text>
          <Text style={swapStyles.subtitle}>Currently: {currentName || "Empty"}</Text>

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
    paddingHorizontal: 24,
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
    borderRadius: 14,
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
    borderRadius: 14,
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
    borderRadius: 14,
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

function WeekRow({ day, isLast, isToday, isPast, onReload, onSkip, onRestore, drag, isActive }: {
  day: ItineraryDay;
  isLast: boolean;
  isToday?: boolean;
  isPast?: boolean;
  onReload: () => void;
  onSkip: () => void;
  onRestore: () => void;
  drag?: () => void;
  isActive?: boolean;
}) {
  const country = getCountryById(day.countryId);
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
    <View style={[styles.daySection, isPast && { opacity: 0.38 }, isActive && { opacity: 0.95 }]}>
      <View style={styles.dayDateRow}>
        <Text style={[styles.dayDateLabel, isToday && { color: Colors.light.primary }]}>
          {dayName} · {dateLabel}
        </Text>
        {isToday && (
          <View style={styles.todayBadge}>
            <Text style={styles.todayBadgeText}>Tonight</Text>
          </View>
        )}
      </View>
      <View style={[styles.dayCard, isActive && { shadowOpacity: 0.18, elevation: 8 }]}>
        {/* Drag handle */}
        {drag && !isSkipped && !isPast && (
          <Pressable
            onLongPress={() => { haptic(); drag(); }}
            delayLongPress={150}
            hitSlop={8}
            style={styles.dragHandle}
          >
            <Ionicons name="reorder-three" size={20} color={Colors.light.onSurfaceVariant} />
          </Pressable>
        )}
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
            <Text style={styles.dayCardRecipe} ellipsizeMode="tail" numberOfLines={1}>
              {isSkipped ? "Skipped" : recipeTitle}
            </Text>
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
          </View>
        </Pressable>
        {!isSkipped && !isPast && (
          <View style={styles.dayCardActions}>
            <Pressable
              onPress={(e) => { e.stopPropagation(); onReload(); }}
              style={styles.dayCardRegenBtn}
              hitSlop={6}
            >
              <Ionicons name="refresh" size={15} color={Colors.light.primary} />
            </Pressable>
            <Pressable
              onPress={(e) => { e.stopPropagation(); haptic(); onSkip(); }}
              style={styles.dayCardCancelBtn}
              hitSlop={6}
            >
              <Ionicons name="close" size={14} color={Colors.light.onSurfaceVariant} />
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

// ─── GroceryRow ───────────────────────────────────────────────────────────────

function GroceryRow({ item, isLast, onToggle, measurementSystem }: { item: GroceryItem; isLast: boolean; onToggle: () => void; measurementSystem: import("@/constants/units").MeasurementSystem }) {
  const sources = item.recipeNames ?? [item.recipeName];
  const sourceLabel = sources.join(", ");
  return (
    <Pressable
      onPress={onToggle}
      style={[
        styles.groceryRow,
        !isLast && styles.groceryRowBorder,
        item.checked && { opacity: 0.4 },
      ]}
    >
      {/* Checkbox */}
      <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
        {item.checked && <Ionicons name="checkmark" size={13} color={Colors.light.surface} />}
      </View>

      {/* Ingredient name + amount */}
      <View style={{ flex: 1 }}>
        <Text style={[styles.groceryName, item.checked && styles.groceryNameChecked]} ellipsizeMode="tail" numberOfLines={1}>
          {item.name}
          {item.amount ? <Text style={styles.groceryAmount}> ({convertAmount(item.amount, measurementSystem)})</Text> : null}
        </Text>
      </View>

      {/* Source recipe — right-aligned */}
      <Text style={styles.grocerySource} ellipsizeMode="tail" numberOfLines={1}>{sourceLabel}</Text>
    </Pressable>
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

  segmentControl: {
    flexDirection: "row",
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: 999,
    padding: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(138,114,102,0.1)",
  },
  segmentBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  segmentBtnActive: {
    backgroundColor: Colors.light.surfaceContainerHighest,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.light.secondary,
  },
  segmentTextActive: {
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.primary,
  },
  segmentBadge: {
    backgroundColor: Colors.light.secondary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  segmentBadgeActive: {
    backgroundColor: Colors.light.primary,
  },
  segmentBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    lineHeight: 16,
    color: Colors.light.surface,
  },
  segmentBadgeTextActive: {
    color: Colors.light.surface,
  },

  // Shared empty state
  emptyState: {
    flex: 1,
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
    height: 52,
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
    paddingHorizontal: 24,
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
    borderRadius: 16,
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
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(138,114,102,0.1)",
  },
  dragHandle: {
    paddingHorizontal: 4,
    paddingVertical: 8,
    justifyContent: "center",
    alignItems: "center",
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
  dayCardRegenBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFDBCB",
    alignItems: "center",
    justifyContent: "center",
  },
  dayCardCancelBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.surfaceContainerHighest,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCardThumb: {
    width: 56,
    height: 56,
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
    borderRadius: 14,
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  emptyDayIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
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

  // Grocery
  groceryScrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 8,
  },

  // My Pantry
  pantrySection: {
    marginBottom: 14,
    gap: 8,
  },
  pantryLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.secondary,
    letterSpacing: 0.3,
  },
  pantryScroll: {
    gap: 8,
    paddingRight: 4,
  },
  pantryPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: Colors.light.primary,
  },
  pantryPillNeed: {
    backgroundColor: Colors.light.surfaceWarm,
    borderWidth: 1.5,
    borderColor: Colors.light.primary,
  },
  pantryPillText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.onPrimary,
  },
  pantryPillTextNeed: {
    color: Colors.light.primary,
  },

  // In your kitchen
  kitchenSection: {
    marginTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.light.outlineVariant,
  },
  kitchenHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
  },
  kitchenHeaderText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.secondary,
  },
  kitchenList: {
    backgroundColor: "#F7F1EA",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 8,
  },
  kitchenRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  kitchenRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.outlineVariant,
  },
  kitchenItemName: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.onSurface,
  },
  kitchenItemSource: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.secondary,
    maxWidth: 100,
    textAlign: "right",
  },
  kitchenHint: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.secondary,
    textAlign: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontStyle: "italic",
  },

  categoryGroup: {
    marginBottom: 20,
  },
  categoryHeader: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.secondary,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 8,
    paddingTop: 16,
  },
  groceryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
    minHeight: 56,
  },
  groceryRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.outlineVariant,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  groceryName: {
    fontFamily: "Inter_500Medium",
    fontSize: 17,
    color: Colors.light.onSurface,
  },
  groceryNameChecked: {
    textDecorationLine: "line-through",
    color: Colors.light.secondary,
  },
  groceryAmount: {
    fontFamily: "Inter_400Regular",
    color: Colors.light.secondary,
  },
  grocerySource: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.secondary,
    maxWidth: 100,
    textAlign: "right",
  },
  qtyBadge: {
    backgroundColor: "#F0E8DE",
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  qtyText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    lineHeight: 18,
    color: Colors.light.primary,
  },
  clearCompletedBtn: {
    alignItems: "center",
    paddingVertical: 16,
    marginTop: 8,
  },
  clearCompletedText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.light.secondary,
  },

  // Grocery summary footer
  grocerySummary: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.outlineVariant,
    backgroundColor: Colors.light.surface,
  },
  grocerySummaryText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
    color: Colors.light.secondary,
    textAlign: "center",
  },
  // Checkout FAB
  fabWrap: {
    position: "absolute",
    left: 20,
    right: 20,
    alignItems: "stretch",
  },
  fabGradient: {
    position: "absolute",
    left: -20,
    right: -20,
    top: -40,
    height: 60,
  },
  fab: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    borderRadius: 26,
    paddingHorizontal: 16,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  fabLogoWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  fabLogoText: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: Colors.light.onPrimary,
  },
  fabText: {
    flex: 1,
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.light.onPrimary,
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
