import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import Colors from "@/constants/colors";
import type { Recipe } from "@/constants/data";
import { useApp } from "@/contexts/AppContext";
import ScheduleSheet from "@/components/ScheduleSheet";

interface RecipeContextMenuProps {
  recipe: Recipe;
  children: React.ReactNode;
  /** Style passed through to the wrapper */
  style?: any;
}

/**
 * Wraps a recipe card with long-press context menu support.
 * On long-press, shows an action menu overlay with Schedule, Save, Grocery, Cook, Share options.
 */
export default function RecipeContextMenu({ recipe, children, style }: RecipeContextMenuProps) {
  const { isSaved, toggleSaved, addToGrocery } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const saved = isSaved(recipe.id);

  const haptic = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleLongPress = () => {
    haptic();
    setMenuOpen(true);
  };

  const closeMenu = () => setMenuOpen(false);

  const actions = [
    {
      label: "Schedule this recipe",
      icon: "calendar-outline" as const,
      onPress: () => {
        closeMenu();
        setShowSchedule(true);
      },
    },
    {
      label: saved ? "Remove from Saved" : "Save Recipe",
      icon: saved ? "bookmark" as const : "bookmark-outline" as const,
      onPress: () => {
        closeMenu();
        toggleSaved(recipe.id);
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      },
    },
    {
      label: "Add to grocery list",
      icon: "basket-outline" as const,
      onPress: () => {
        closeMenu();
        addToGrocery(recipe);
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      },
    },
    {
      label: "Cook now",
      icon: "restaurant-outline" as const,
      onPress: () => {
        closeMenu();
        router.push({ pathname: "/cook-mode", params: { recipeId: recipe.id } });
      },
    },
  ];

  return (
    <>
      <Pressable onLongPress={handleLongPress} delayLongPress={400} style={style}>
        {children}
      </Pressable>

      {/* Context menu modal */}
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={closeMenu}>
        <Pressable style={styles.menuOverlay} onPress={closeMenu}>
          <Pressable style={styles.menuSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.menuTitle} numberOfLines={1}>{recipe.name}</Text>
            {actions.map((action, idx) => (
              <Pressable
                key={action.label}
                style={({ pressed }) => [
                  styles.menuItem,
                  idx < actions.length - 1 && styles.menuItemBorder,
                  pressed && { backgroundColor: Colors.light.surfaceContainerLow },
                ]}
                onPress={action.onPress}
              >
                <Ionicons name={action.icon} size={20} color={Colors.light.onSurface} />
                <Text style={styles.menuItemText}>{action.label}</Text>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Schedule sheet */}
      <Modal visible={showSchedule} transparent animationType="slide" onRequestClose={() => setShowSchedule(false)}>
        <ScheduleSheet recipe={recipe} onClose={() => setShowSchedule(false)} />
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  menuOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 200,
  },
  menuSheet: {
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    width: 280,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  menuTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.light.secondary,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E8DFD2",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 52,
  },
  menuItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E8DFD2",
  },
  menuItemText: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: Colors.light.onSurface,
    lineHeight: 22,
  },
});
