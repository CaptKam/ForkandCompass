import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo } from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
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

export default function GroceryScreen() {
  const insets = useSafeAreaInsets();
  const { groceryItems, toggleGroceryItem, removeGroceryItem, clearGrocery } = useApp();

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

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Platform.OS === "web" ? 67 : insets.top + 8 }]}>
        <Text style={styles.headerTitle}>Grocery List</Text>
        {groceryItems.length > 0 && (
          <Pressable onPress={handleClear}>
            <Text style={styles.clearAllText}>Clear All</Text>
          </Pressable>
        )}
      </View>

      {groceryItems.length === 0 ? (
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
                style={styles.actionButton}
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Ionicons name="cart-outline" size={18} color={Colors.light.onPrimary} />
                <Text style={styles.actionButtonText}>Order on Instacart</Text>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 28,
    color: Colors.light.onSurface,
    letterSpacing: -0.5,
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
