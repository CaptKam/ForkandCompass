import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
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
import { getAllRecipes, type Recipe } from "@/constants/data";

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const { savedRecipeIds, toggleSaved } = useApp();

  const savedRecipes = getAllRecipes().filter((r) =>
    savedRecipeIds.includes(r.id)
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Platform.OS === "web" ? 67 : insets.top + 8 }]}>
        <View>
          <Text style={styles.headerLabel}>Your Collection</Text>
          <Text style={styles.headerTitle}>Saved Recipes</Text>
        </View>
      </View>

      {savedRecipes.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="bookmark-outline" size={48} color={Colors.light.outlineVariant} />
          </View>
          <Text style={styles.emptyTitle}>Nothing saved yet</Text>
          <Text style={styles.emptySubtitle}>
            Tap the bookmark icon on any recipe to save it here for later.
          </Text>
        </View>
      ) : (
        <FlatList
          data={savedRecipes}
          keyExtractor={(item) => item.id}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <SavedRecipeCard
              recipe={item}
              onRemove={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                toggleSaved(item.id);
              }}
            />
          )}
        />
      )}
    </View>
  );
}

function SavedRecipeCard({
  recipe,
  onRemove,
}: {
  recipe: Recipe;
  onRemove: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({ pathname: "/recipe/[id]", params: { id: recipe.id } });
      }}
      style={({ pressed }) => [
        styles.savedCard,
        pressed && { transform: [{ scale: 0.98 }] },
      ]}
    >
      <Image
        source={{ uri: recipe.image }}
        style={styles.savedImage}
        contentFit="cover"
        transition={300}
      />
      <View style={styles.savedContent}>
        <Text style={styles.savedCategory}>{recipe.category}</Text>
        <Text style={styles.savedName} numberOfLines={2}>
          {recipe.name}
        </Text>
        <View style={styles.savedMeta}>
          <Text style={styles.savedMetaText}>
            {recipe.countryFlag} {recipe.countryName}
          </Text>
          <Text style={styles.savedMetaText}>{recipe.time}</Text>
        </View>
      </View>
      <Pressable onPress={onRemove} style={styles.removeButton} hitSlop={8}>
        <Ionicons name="bookmark" size={20} color={Colors.light.primary} />
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
  savedCard: {
    flexDirection: "row",
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 12,
  },
  savedImage: {
    width: 100,
    height: 110,
  },
  savedContent: {
    flex: 1,
    padding: 14,
    justifyContent: "center",
  },
  savedCategory: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: Colors.light.primary,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  savedName: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 16,
    color: Colors.light.onSurface,
    lineHeight: 21,
    marginBottom: 8,
  },
  savedMeta: {
    flexDirection: "row",
    gap: 12,
  },
  savedMetaText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.light.secondary,
  },
  removeButton: {
    padding: 14,
    justifyContent: "center",
  },
});
