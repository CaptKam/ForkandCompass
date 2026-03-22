import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import TabHeader from "@/components/TabHeader";

import Colors from "@/constants/colors";
import InventoryPanel from "@/components/InventoryPanel";
import { useApp } from "@/contexts/AppContext";
import type { GroceryItem } from "@/constants/data";

// Categorize ingredients by type based on common keywords
const CATEGORY_RULES: { key: string; emoji: string; label: string; keywords: string[] }[] = [
  { key: "produce", emoji: "\u{1F96C}", label: "Produce", keywords: ["tomato", "basil", "garlic", "onion", "pepper", "lemon", "lime", "cilantro", "chili", "ginger", "scallion", "lettuce", "avocado", "jalape", "serrano", "mint", "lemongrass", "galangal", "shallot", "kaffir", "coriander root", "bean sprout", "vegetable", "herb", "leaves"] },
  { key: "protein", emoji: "\u{1F969}", label: "Protein", keywords: ["chicken", "pork", "beef", "lamb", "fish", "shrimp", "prawn", "egg", "tofu", "meat", "rib", "thigh", "breast", "salmon", "tuna", "prosciutto"] },
  { key: "dairy", emoji: "\u{1F9C8}", label: "Dairy", keywords: ["cheese", "cream", "milk", "butter", "yogurt", "mozzarella", "pecorino", "parmesan", "ghee", "paneer"] },
  { key: "pantry", emoji: "\u{1FAD9}", label: "Pantry", keywords: ["oil", "vinegar", "salt", "sugar", "flour", "rice", "noodle", "pasta", "soy sauce", "fish sauce", "spice", "cumin", "turmeric", "paprika", "cinnamon", "sauce", "stock", "broth", "wine", "miso", "dashi", "coconut", "curry", "paste", "sesame", "peanut", "bread", "tortilla", "wrap"] },
];

function categorizeItem(name: string): { emoji: string; label: string } {
  const lower = name.toLowerCase();
  for (const cat of CATEGORY_RULES) {
    if (cat.keywords.some((kw) => lower.includes(kw))) {
      return { emoji: cat.emoji, label: cat.label };
    }
  }
  return { emoji: "\u{1FAD9}", label: "Pantry" };
}

interface CategoryGroup {
  emoji: string;
  label: string;
  items: GroceryItem[];
}

type GroceryTab = "list" | "kitchen";

export default function GroceryScreen() {
  const { groceryItems, toggleGroceryItem, removeGroceryItem, clearGrocery, inventoryItems } = useApp();
  const [activeTab, setActiveTab] = useState<GroceryTab>("list");

  const checkedCount = groceryItems.filter((i) => i.checked).length;

  const categoryGroups = useMemo(() => {
    const groups: Record<string, CategoryGroup> = {};
    for (const item of groceryItems) {
      const { emoji, label } = categorizeItem(item.name);
      if (!groups[label]) {
        groups[label] = { emoji, label, items: [] };
      }
      groups[label].items.push(item);
    }
    // Sort categories in the CATEGORY_RULES order
    const order = CATEGORY_RULES.map((c) => c.label);
    return Object.values(groups).sort(
      (a, b) => order.indexOf(a.label) - order.indexOf(b.label)
    );
  }, [groceryItems]);

  const handleClear = () => {
    if (Platform.OS === "web") {
      clearGrocery();
      return;
    }
    Alert.alert("Clear List", "Remove all items from your grocery list?", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear All", style: "destructive", onPress: clearGrocery },
    ]);
  };

  const handleClearCompleted = () => {
    const unchecked = groceryItems.filter((i) => !i.checked);
    if (unchecked.length === groceryItems.length) return;
    if (Platform.OS === "web") {
      groceryItems.filter((i) => i.checked).forEach((i) => removeGroceryItem(i.id));
      return;
    }
    Alert.alert("Clear Completed", "Remove all checked items?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        onPress: () => {
          groceryItems.filter((i) => i.checked).forEach((i) => removeGroceryItem(i.id));
        },
      },
    ]);
  };

  const [instacartLoading, setInstacartLoading] = useState(false);

  const handleInstacart = async () => {
    if (instacartLoading) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const itemsToOrder = groceryItems.filter((i) => !i.checked);
    if (itemsToOrder.length === 0) {
      Alert.alert("Nothing to order", "All items are already checked off.");
      return;
    }

    setInstacartLoading(true);
    try {
      const response = await fetch("/api/instacart/shopping-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "My Fork & Compass List",
          items: itemsToOrder.map((i) => ({
            name: i.name,
            amount: i.amount,
            recipeName: i.recipeName,
          })),
        }),
      });

      const data = await response.json() as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        throw new Error(data.error ?? "Could not create shopping list");
      }

      await Linking.openURL(data.url);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      Alert.alert("Instacart Error", message);
    } finally {
      setInstacartLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TabHeader
        title="Grocery"
        rightExtra={
          <Pressable
            style={styles.scanHeaderButton}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/kitchen-scanner");
            }}
          >
            <Ionicons name="scan" size={16} color={Colors.light.primary} />
          </Pressable>
        }
      />

      {/* Tab switcher */}
      <View style={styles.tabBar}>
        <Pressable
          style={[styles.tab, activeTab === "list" && styles.tabActive]}
          onPress={() => setActiveTab("list")}
        >
          <Ionicons
            name="list-outline"
            size={16}
            color={activeTab === "list" ? Colors.light.primary : Colors.light.secondary}
          />
          <Text style={[styles.tabText, activeTab === "list" && styles.tabTextActive]}>
            Shopping List
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === "kitchen" && styles.tabActive]}
          onPress={() => setActiveTab("kitchen")}
        >
          <Ionicons
            name="home-outline"
            size={16}
            color={activeTab === "kitchen" ? Colors.light.primary : Colors.light.secondary}
          />
          <Text style={[styles.tabText, activeTab === "kitchen" && styles.tabTextActive]}>
            My Kitchen
          </Text>
          {inventoryItems.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{inventoryItems.length}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {activeTab === "kitchen" ? (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          <InventoryPanel />
        </ScrollView>
      ) : groceryItems.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="basket-outline" size={48} color={Colors.light.outlineVariant} />
          </View>
          <Text style={styles.emptyTitle}>Your list is empty</Text>
          <Text style={styles.emptySubtitle}>
            Add ingredients from any recipe to start building your grocery list.
          </Text>
        </View>
      ) : (
        <FlatList
          data={categoryGroups}
          keyExtractor={(item) => item.label}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
          ListHeaderComponent={
            <View style={styles.actionBar}>
              <Pressable
                style={[styles.actionButton, instacartLoading && { opacity: 0.7 }]}
                onPress={handleInstacart}
                disabled={instacartLoading}
              >
                <Ionicons
                  name={instacartLoading ? "time-outline" : "cart-outline"}
                  size={18}
                  color={Colors.light.onPrimary}
                />
                <Text style={styles.actionButtonText}>
                  {instacartLoading ? "Opening…" : "Order on Instacart"}
                </Text>
              </Pressable>
              <Pressable style={styles.actionButtonOutline}>
                <Ionicons name="copy-outline" size={18} color={Colors.light.secondary} />
                <Text style={styles.actionButtonOutlineText}>Copy List</Text>
              </Pressable>
            </View>
          }
          renderItem={({ item: group }) => (
            <View style={styles.categoryGroup}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryEmoji}>{group.emoji}</Text>
                <Text style={styles.categoryLabel}>{group.label}</Text>
              </View>
              {group.items.map((item) => (
                <GroceryRow
                  key={item.id}
                  item={item}
                  onToggle={() => {
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    toggleGroceryItem(item.id);
                  }}
                />
              ))}
            </View>
          )}
          ListFooterComponent={
            checkedCount > 0 ? (
              <View style={styles.clearCompletedContainer}>
                <Pressable onPress={handleClearCompleted} style={styles.clearCompletedButton}>
                  <Text style={styles.clearCompletedText}>Clear Completed</Text>
                </Pressable>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

function GroceryRow({ item, onToggle }: { item: GroceryItem; onToggle: () => void }) {
  return (
    <Pressable onPress={onToggle} style={styles.groceryRow}>
      <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
        {item.checked && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
      </View>
      <View style={styles.groceryInfo}>
        <Text style={[styles.groceryName, item.checked && styles.groceryNameChecked]}>
          {item.name}{" "}
          <Text style={styles.groceryAmount}>({item.amount})</Text>
        </Text>
        <Text style={[styles.recipeLabel, item.checked && { opacity: 0.6 }]}>
          Recipe: {item.recipeName}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
  },
  scanHeaderButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.surfaceContainerLow,
    alignItems: "center",
    justifyContent: "center",
  },
  // Tab bar
  tabBar: {
    flexDirection: "row",
    marginHorizontal: 24,
    marginBottom: 16,
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: 12,
    padding: 3,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: Colors.light.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.light.secondary,
  },
  tabTextActive: {
    color: Colors.light.primary,
    fontFamily: "Inter_600SemiBold",
  },
  tabBadge: {
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  tabBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: "#FFFFFF",
  },
  clearAllText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.light.primary,
  },
  // Action bar
  actionBar: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 28,
  },
  actionButton: {
    flex: 1,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.light.primary,
    borderRadius: 14,
  },
  actionButtonText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.light.onPrimary,
  },
  actionButtonOutline: {
    flex: 1,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(222,193,179,0.3)",
    borderRadius: 14,
  },
  actionButtonOutlineText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.light.secondary,
  },
  // Categories
  categoryGroup: {
    marginBottom: 28,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  categoryEmoji: {
    fontSize: 20,
  },
  categoryLabel: {
    fontFamily: "NotoSerif_600SemiBold",
    fontStyle: "italic",
    fontSize: 18,
    color: Colors.light.secondary,
  },
  // Grocery rows
  groceryRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    paddingVertical: 10,
  },
  checkbox: {
    marginTop: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  groceryInfo: {
    flex: 1,
  },
  groceryName: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.light.onSurface,
  },
  groceryNameChecked: {
    color: Colors.light.onSurfaceVariant,
    textDecorationLine: "line-through",
  },
  groceryAmount: {
    fontFamily: "Inter_400Regular",
    color: Colors.light.onSurfaceVariant,
  },
  recipeLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.light.secondary,
    marginTop: 2,
  },
  // Clear completed
  clearCompletedContainer: {
    alignItems: "center",
    marginTop: 16,
  },
  clearCompletedButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(222,193,179,0.3)",
    borderRadius: 24,
  },
  clearCompletedText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.light.secondary,
  },
  // Empty state
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 48,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.light.surfaceContainerLow,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 20,
    color: Colors.light.onSurface,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.light.secondary,
    textAlign: "center",
    lineHeight: 22,
  },
});
