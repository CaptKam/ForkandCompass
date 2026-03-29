import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { type GroceryItem } from "@/constants/data";
import { PARTNER_CONFIG } from "@/constants/partners";
import { SCROLL_BOTTOM_INSET } from "@/constants/spacing";
import { convertAmount } from "@/constants/units";
import { useApp } from "@/contexts/AppContext";
const CATEGORY_RULES: { key: string; emoji: string; label: string; keywords: string[] }[] = [
  { key: "produce", emoji: "🥬", label: "Produce", keywords: ["tomato", "basil", "garlic", "onion", "pepper", "lemon", "lime", "cilantro", "chili", "ginger", "scallion", "lettuce", "avocado", "jalape", "serrano", "mint", "lemongrass", "galangal", "shallot", "kaffir", "coriander root", "bean sprout", "vegetable", "herb", "leaves"] },
  { key: "protein", emoji: "🥩", label: "Protein", keywords: ["chicken", "pork", "beef", "lamb", "fish", "shrimp", "prawn", "egg", "tofu", "meat", "rib", "thigh", "breast", "salmon", "tuna", "prosciutto"] },
  { key: "dairy", emoji: "🧈", label: "Dairy", keywords: ["cheese", "cream", "milk", "butter", "yogurt", "mozzarella", "pecorino", "parmesan", "ghee", "paneer"] },
  { key: "pantry", emoji: "🫙", label: "Pantry", keywords: ["oil", "vinegar", "salt", "sugar", "flour", "rice", "noodle", "pasta", "soy sauce", "fish sauce", "spice", "cumin", "turmeric", "paprika", "cinnamon", "sauce", "stock", "broth", "wine", "miso", "dashi", "coconut", "curry", "paste", "sesame", "peanut", "bread", "tortilla", "wrap"] },
];

function categorizeItem(name: string, id?: string): { emoji: string; label: string } {
  if (id?.startsWith("manual-")) return { emoji: "🛒", label: "Other" };
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

export default function GroceryScreen() {
  const insets = useSafeAreaInsets();
  const {
    groceryItems,
    toggleGroceryItem,
    removeGroceryItem,
    clearGrocery,
    unexcludeGroceryItem,
    quickAddStaple,
    pantryStaples,
    togglePantryStaple,
    groceryPartner,
    measurementSystem,
    addManualGroceryItem,
  } = useApp();

  const [manualItem, setManualItem] = useState("");
  const [kitchenExpanded, setKitchenExpanded] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
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

  const handleManualAdd = useCallback(() => {
    const trimmed = manualItem.trim();
    if (!trimmed) return;
    addManualGroceryItem(trimmed);
    setManualItem("");
    showToast(`Added "${trimmed}"`);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [manualItem, addManualGroceryItem, showToast]);

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
      const { emoji, label } = categorizeItem(item.name, item.id);
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

  const checkedCount = activeGroceryItems.filter((i) => i.checked).length;
  const totalCount = activeGroceryItems.length;
  const readyToCook = totalCount > 0 && checkedCount / totalCount >= 0.5;
  const allChecked = checkedCount === totalCount && totalCount > 0;
  const progressText = totalCount > 0 ? `${checkedCount} of ${totalCount}` : null;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Platform.OS === "web" ? 56 : insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Groceries</Text>
        {progressText && (
          <View style={[
            styles.progressPill,
            allChecked && { backgroundColor: "rgba(52,199,89,0.12)", borderColor: "rgba(52,199,89,0.3)" },
          ]}>
            <Text style={[
              styles.progressPillText,
              allChecked && { color: "#34c759" },
            ]}>
              {progressText}
            </Text>
          </View>
        )}
      </View>

      {groceryItems.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="cart-outline" size={48} color={Colors.light.primary} />
          </View>
          <Text style={styles.emptyTitle}>Your grocery list is empty</Text>
          <Text style={styles.emptyBody}>Add ingredients from recipes or your weekly plan.</Text>
          <Pressable
            onPress={() => router.push("/(tabs)/plan")}
            style={({ pressed }) => [styles.emptyLink, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.emptyLinkText}>Plan your week to auto-fill →</Text>
          </Pressable>
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
                <View style={styles.manualAddRow}>
                  <TextInput
                    value={manualItem}
                    onChangeText={setManualItem}
                    placeholder="Add an item..."
                    placeholderTextColor={Colors.light.secondary}
                    style={styles.manualAddInput}
                    returnKeyType="done"
                    onSubmitEditing={handleManualAdd}
                  />
                  <Pressable
                    onPress={handleManualAdd}
                    style={[styles.manualAddBtn, { backgroundColor: manualItem.trim() ? Colors.light.primary : Colors.light.surfaceContainerLow }]}
                  >
                    <Ionicons name="add" size={20} color={manualItem.trim() ? Colors.light.onPrimary : Colors.light.secondary} />
                  </Pressable>
                </View>
                <View style={styles.pantrySection}>
                  <View style={styles.pantryHeaderRow}>
                    <Text style={styles.pantryLabel}>Pantry Staples</Text>
                    <Text style={styles.pantryHint}>Tap if running low</Text>
                  </View>
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
                          {needsMore && (
                            <Ionicons name="cart" size={12} color={Colors.light.onPrimary} style={{ marginRight: 4 }} />
                          )}
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
                {readyToCook && (
                  <Pressable
                    onPress={() => {
                      router.push("/(tabs)/cook");
                      if (Platform.OS !== "web") {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      }
                    }}
                    style={styles.readyToCookBtn}
                    accessibilityLabel="All set, let's cook"
                  >
                    <Text style={styles.readyToCookText}>
                      All set — let's cook! →
                    </Text>
                  </Pressable>
                )}
              </View>
            }
          />

          <View style={[styles.grocerySummary, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <Text style={styles.grocerySummaryText}>
              {activeGroceryItems.length} items · {checkedCount} checked
              {excludedGroceryItems.length > 0 && ` · ${excludedGroceryItems.length} in kitchen`}
            </Text>
          </View>
        </View>
      )}

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

      {toast && (
        <View style={[styles.toast, { bottom: (Platform.OS === "web" ? 150 : insets.bottom + SCROLL_BOTTOM_INSET) }]}>
          <Ionicons name="checkmark-circle" size={16} color={Colors.light.surface} />
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}
    </View>
  );
}

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
      <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
        {item.checked && <Ionicons name="checkmark" size={13} color={Colors.light.surface} />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.groceryName, item.checked && styles.groceryNameChecked]} ellipsizeMode="tail" numberOfLines={1}>
          {item.name}
          {item.amount ? <Text style={styles.groceryAmount}> ({convertAmount(item.amount, measurementSystem)})</Text> : null}
        </Text>
      </View>
      <Text style={styles.grocerySource} ellipsizeMode="tail" numberOfLines={1}>{sourceLabel}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.surface },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(222,193,179,0.35)",
  },
  headerTitle: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 20,
    color: Colors.light.primary,
    letterSpacing: -0.3,
  },
  progressPill: {
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.light.outlineVariant,
  },
  progressPillText: {
    fontFamily: "Inter_600SemiBold",
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
  emptyLink: {
    marginTop: 4,
  },
  emptyLinkText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.light.primary,
  },

  groceryScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 8,
  },

  manualAddRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.outlineVariant,
  },
  manualAddInput: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.light.onSurface,
    height: 44,
  },
  manualAddBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  pantrySection: {
    marginBottom: 14,
    marginTop: 12,
    gap: 10,
  },
  pantryHeaderRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  pantryLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    lineHeight: 20,
    color: Colors.light.onSurface,
  },
  pantryHint: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.light.onSurfaceVariant,
  },
  pantryScroll: {
    gap: 8,
    paddingRight: 4,
  },
  pantryPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 22,
    backgroundColor: Colors.light.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: Colors.light.outlineVariant,
  },
  pantryPillNeed: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  pantryPillText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.onSurfaceVariant,
  },
  pantryPillTextNeed: {
    color: Colors.light.onPrimary,
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
    color: Colors.light.onPrimary,
  },

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
    height: 48,
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
    borderRadius: 12,
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
