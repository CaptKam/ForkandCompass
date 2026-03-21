import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
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

export default function GroceryScreen() {
  const insets = useSafeAreaInsets();
  const { groceryItems, toggleGroceryItem, removeGroceryItem, clearGrocery } = useApp();

  const checkedCount = groceryItems.filter((i) => i.checked).length;
  const groupedByRecipe = groceryItems.reduce<Record<string, GroceryItem[]>>((acc, item) => {
    if (!acc[item.recipeName]) acc[item.recipeName] = [];
    acc[item.recipeName].push(item);
    return acc;
  }, {});

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

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Platform.OS === "web" ? 67 : insets.top + 8 }]}>
        <View>
          <Text style={styles.headerLabel}>Shopping</Text>
          <Text style={styles.headerTitle}>Grocery List</Text>
        </View>
        {groceryItems.length > 0 && (
          <Pressable onPress={handleClear} style={styles.clearButton}>
            <Text style={styles.clearText}>Clear all</Text>
          </Pressable>
        )}
      </View>

      {groceryItems.length > 0 && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(checkedCount / groceryItems.length) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {checkedCount} of {groceryItems.length} items
          </Text>
        </View>
      )}

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
          data={Object.entries(groupedByRecipe)}
          keyExtractor={([name]) => name}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: [recipeName, items] }) => (
            <View style={styles.recipeGroup}>
              <Text style={styles.groupTitle}>{recipeName}</Text>
              {items.map((item) => (
                <GroceryRow
                  key={item.id}
                  item={item}
                  onToggle={() => {
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    toggleGroceryItem(item.id);
                  }}
                  onRemove={() => removeGroceryItem(item.id)}
                />
              ))}
            </View>
          )}
        />
      )}
    </View>
  );
}

function GroceryRow({
  item,
  onToggle,
  onRemove,
}: {
  item: GroceryItem;
  onToggle: () => void;
  onRemove: () => void;
}) {
  return (
    <Pressable onPress={onToggle} style={styles.groceryRow}>
      <View
        style={[
          styles.checkbox,
          item.checked && styles.checkboxChecked,
        ]}
      >
        {item.checked && (
          <Ionicons name="checkmark" size={14} color="#FFFFFF" />
        )}
      </View>
      <View style={styles.groceryInfo}>
        <Text
          style={[
            styles.groceryName,
            item.checked && styles.groceryNameChecked,
          ]}
        >
          {item.name}
        </Text>
        <Text style={styles.groceryAmount}>{item.amount}</Text>
      </View>
      <Pressable onPress={onRemove} hitSlop={8}>
        <Ionicons name="close" size={18} color={Colors.light.outlineVariant} />
      </Pressable>
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
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  headerLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.light.primary,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  headerTitle: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 28,
    color: Colors.light.onSurface,
    letterSpacing: -0.5,
  },
  clearButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: Colors.light.surfaceContainerLow,
  },
  clearText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.light.primary,
  },
  progressContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.light.surfaceContainerHigh,
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: Colors.light.primary,
  },
  progressText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.light.secondary,
  },
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
  recipeGroup: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  groupTitle: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 16,
    color: Colors.light.onSurface,
    marginBottom: 12,
  },
  groceryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 14,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.light.outlineVariant,
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
    color: Colors.light.secondary,
    textDecorationLine: "line-through",
  },
  groceryAmount: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.light.secondary,
    marginTop: 2,
  },
});
