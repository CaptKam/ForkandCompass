import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { COUNTRIES } from "@/constants/data";
import { useApp, type CookingLevel, type AppearanceMode } from "@/contexts/AppContext";

const COOKING_LEVELS: { key: CookingLevel; label: string; icon: string }[] = [
  { key: "beginner", label: "Just Learning", icon: "🌱" },
  { key: "intermediate", label: "I've Got This", icon: "🍳" },
  { key: "advanced", label: "Culinary Pro", icon: "👨‍🍳" },
];

const APPEARANCE_MODES: { key: AppearanceMode; label: string }[] = [
  { key: "system", label: "System" },
  { key: "light", label: "Light" },
  { key: "dark", label: "Dark" },
];

const HERO_IMAGE = "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800&q=80";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const {
    clearGrocery,
    setHasSeenWelcome,
    cookingLevel,
    setCookingLevel,
    appearanceMode,
    setAppearanceMode,
    selectedCountryIds,
  } = useApp();

  const haptic = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleReset = () => {
    if (Platform.OS === "web") {
      clearGrocery();
      setHasSeenWelcome(false);
      return;
    }
    Alert.alert(
      "Reset App",
      "This will clear all your data and show the welcome screen again.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            clearGrocery();
            setHasSeenWelcome(false);
          },
        },
      ]
    );
  };

  const bucketListCountries = COUNTRIES.filter((c) => selectedCountryIds.includes(c.id));
  const currentLevel = COOKING_LEVELS.find((l) => l.key === cookingLevel);

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 120 : insets.bottom + 120 }}
      >
        {/* Profile Hero */}
        <View style={[styles.heroWrap, { paddingTop: Platform.OS === "web" ? 0 : insets.top }]}>
          <Image
            source={{ uri: HERO_IMAGE }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
          <LinearGradient
            colors={["rgba(0,0,0,0.1)", "rgba(0,0,0,0.55)"]}
            style={StyleSheet.absoluteFill}
          />

          {/* Avatar + name overlay */}
          <View style={styles.heroContent}>
            <View style={styles.avatarRing}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={36} color={Colors.light.primary} />
              </View>
            </View>
            <Text style={styles.heroName}>Culinary Explorer</Text>
            <Text style={styles.heroLevel}>{currentLevel?.icon} {currentLevel?.label}</Text>
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{selectedCountryIds.length}</Text>
            <Text style={styles.statLabel}>Countries</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{bucketListCountries.length}</Text>
            <Text style={styles.statLabel}>Bucket List</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{COUNTRIES.reduce((n, c) => n + c.recipes.length, 0)}</Text>
            <Text style={styles.statLabel}>Recipes</Text>
          </View>
        </View>

        {/* Cooking Level */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cooking Level</Text>
          <View style={styles.card}>
            {COOKING_LEVELS.map((level, index) => {
              const isSelected = cookingLevel === level.key;
              const isLast = index === COOKING_LEVELS.length - 1;
              return (
                <Pressable
                  key={level.key}
                  onPress={() => { haptic(); setCookingLevel(level.key); }}
                  style={[
                    styles.levelRow,
                    !isLast && styles.levelRowBorder,
                    isSelected && styles.levelRowSelected,
                  ]}
                >
                  <View style={styles.levelLeft}>
                    <Text style={styles.levelIcon}>{level.icon}</Text>
                    <Text style={[styles.levelLabel, isSelected && styles.levelLabelSelected]}>
                      {level.label}
                    </Text>
                  </View>
                  <View style={[styles.radio, isSelected && styles.radioSelected]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Bucket List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Bucket List</Text>
          <View style={styles.card}>
            <View style={styles.bucketFlagsRow}>
              {bucketListCountries.length > 0 ? (
                bucketListCountries.map((c) => (
                  <Text key={c.id} style={styles.bucketFlag}>{c.flag}</Text>
                ))
              ) : (
                <Text style={styles.bucketEmpty}>No countries selected yet</Text>
              )}
            </View>
            <Pressable style={styles.editCountriesRow} onPress={haptic}>
              <Text style={styles.editCountriesText}>Edit countries</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.light.secondary} />
            </Pressable>
          </View>
        </View>

        {/* Appearance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <View style={styles.appearanceToggle}>
            {APPEARANCE_MODES.map((mode) => {
              const isActive = appearanceMode === mode.key;
              return (
                <Pressable
                  key={mode.key}
                  onPress={() => { haptic(); setAppearanceMode(mode.key); }}
                  style={[styles.appearanceButton, isActive && styles.appearanceButtonActive]}
                >
                  <Text style={[styles.appearanceText, isActive && styles.appearanceTextActive]}>
                    {mode.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.card}>
            <Pressable style={[styles.aboutRow, styles.aboutRowBorder]} onPress={haptic}>
              <Text style={styles.aboutLabel}>Privacy Policy</Text>
              <Ionicons name="open-outline" size={16} color={Colors.light.secondary} />
            </Pressable>
            <Pressable style={[styles.aboutRow, styles.aboutRowBorder]} onPress={haptic}>
              <Text style={styles.aboutLabel}>Terms of Service</Text>
              <Ionicons name="open-outline" size={16} color={Colors.light.secondary} />
            </Pressable>
            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabelDim}>Version</Text>
              <Text style={styles.aboutLabelDim}>1.0</Text>
            </View>
          </View>
        </View>

        {/* Reset */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>
          <Pressable
            onPress={handleReset}
            style={({ pressed }) => [styles.resetButton, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="refresh-outline" size={20} color={Colors.light.error} />
            <Text style={styles.resetText}>Reset All Data</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
  },

  /* Hero */
  heroWrap: {
    height: 260,
    position: "relative",
    justifyContent: "flex-end",
  },
  heroContent: {
    alignItems: "center",
    paddingBottom: 28,
    gap: 6,
  },
  avatarRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.7)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.surfaceContainerLow,
    alignItems: "center",
    justifyContent: "center",
  },
  heroName: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 22,
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  heroLevel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    letterSpacing: 0.2,
  },

  /* Stats */
  statsRow: {
    flexDirection: "row",
    backgroundColor: Colors.light.surfaceContainerLow,
    marginHorizontal: 24,
    borderRadius: 18,
    marginTop: -20,
    marginBottom: 28,
    paddingVertical: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statNumber: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 26,
    color: Colors.light.onSurface,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: Colors.light.secondary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(222,193,179,0.3)",
    alignSelf: "stretch",
  },

  /* Sections */
  section: {
    paddingHorizontal: 24,
    marginBottom: 28,
  },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.light.secondary,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  card: {
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: 18,
    overflow: "hidden",
  },

  /* Cooking Level */
  levelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  levelLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  levelIcon: {
    fontSize: 18,
  },
  levelRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(222,193,179,0.15)",
  },
  levelRowSelected: {
    backgroundColor: "rgba(236,231,226,0.5)",
  },
  levelLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.light.onSurface,
  },
  levelLabelSelected: {
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.primary,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "rgba(222,193,179,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: {
    borderColor: Colors.light.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.light.primary,
  },

  /* Bucket List */
  bucketFlagsRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  bucketFlag: {
    fontSize: 26,
  },
  bucketEmpty: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.light.secondary,
  },
  editCountriesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(222,193,179,0.15)",
  },
  editCountriesText: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.light.onSurface,
  },

  /* Appearance */
  appearanceToggle: {
    flexDirection: "row",
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: 18,
    padding: 4,
  },
  appearanceButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: "center",
  },
  appearanceButtonActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  appearanceText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: "rgba(29,27,24,0.5)",
  },
  appearanceTextActive: {
    color: Colors.light.primary,
  },

  /* About */
  aboutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  aboutRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(222,193,179,0.15)",
  },
  aboutLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.light.onSurface,
  },
  aboutLabelDim: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.light.secondary,
  },

  /* Reset */
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  resetText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.light.error,
  },
});
