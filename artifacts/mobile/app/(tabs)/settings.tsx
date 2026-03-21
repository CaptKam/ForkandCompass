import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
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

const COOKING_LEVELS: { key: CookingLevel; label: string; description: string }[] = [
  { key: "beginner", label: "Just learning", description: "Detailed step-by-step guidance" },
  { key: "intermediate", label: "I've got this", description: "Standard professional recipes" },
  { key: "advanced", label: "Culinary Pro", description: "Complex techniques & timing" },
];

const APPEARANCE_MODES: { key: AppearanceMode; label: string }[] = [
  { key: "system", label: "System" },
  { key: "light", label: "Light" },
  { key: "dark", label: "Dark" },
];

export default function SettingsScreen() {
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

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Platform.OS === "web" ? 67 : insets.top + 8 }]}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
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
                  onPress={() => {
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setCookingLevel(level.key);
                  }}
                  style={[
                    styles.levelRow,
                    !isLast && styles.levelRowBorder,
                    isSelected && styles.levelRowSelected,
                  ]}
                >
                  <Text style={[styles.levelLabel, isSelected && styles.levelLabelSelected]}>
                    {level.label}
                  </Text>
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
            <Pressable style={styles.editCountriesRow}>
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
                  onPress={() => {
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setAppearanceMode(mode.key);
                  }}
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
            <View style={[styles.aboutRow, styles.aboutRowBorder]}>
              <Text style={styles.aboutLabel}>Privacy Policy</Text>
              <Ionicons name="open-outline" size={16} color={Colors.light.secondary} />
            </View>
            <View style={[styles.aboutRow, styles.aboutRowBorder]}>
              <Text style={styles.aboutLabel}>Terms of Service</Text>
              <Ionicons name="open-outline" size={16} color={Colors.light.secondary} />
            </View>
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
            style={({ pressed }) => [
              styles.resetButton,
              pressed && { opacity: 0.7 },
            ]}
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
  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 28,
    color: Colors.light.onSurface,
    letterSpacing: -0.5,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 28,
  },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
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
  // Cooking Level
  levelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  levelRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(222,193,179,0.1)",
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
    borderColor: "rgba(222,193,179,0.3)",
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
  // Bucket List
  bucketFlagsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  bucketFlag: {
    fontSize: 24,
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
    borderTopColor: "rgba(222,193,179,0.1)",
  },
  editCountriesText: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.light.onSurface,
  },
  // Appearance
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
    color: "rgba(29,27,24,0.6)",
  },
  appearanceTextActive: {
    color: Colors.light.primary,
  },
  // About
  aboutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  aboutRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(222,193,179,0.1)",
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
  // Reset
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
