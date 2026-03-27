import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useRef } from "react";
import {
  Alert,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import Colors from "@/constants/colors";
import { COUNTRIES } from "@/constants/data";
import { useApp, type CookingLevel, type AppearanceMode } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";

const COOKING_LEVELS: { key: CookingLevel; label: string; icon: string }[] = [
  { key: "beginner", label: "Simmer", icon: "\uD83C\uDF31" },
  { key: "intermediate", label: "Saut\u00E9", icon: "\uD83C\uDF73" },
  { key: "advanced", label: "Sear", icon: "\uD83D\uDC68\u200D\uD83C\uDF73" },
];

const APPEARANCE_MODES: { key: AppearanceMode; label: string }[] = [
  { key: "light", label: "Light" },
  { key: "dark", label: "Dark" },
  { key: "system", label: "System" },
];

interface ProfileSheetProps {
  onClose: () => void;
}

export default function ProfileSheet({ onClose }: ProfileSheetProps) {
  const {
    cookingLevel,
    setCookingLevel,
    appearanceMode,
    setAppearanceMode,
    selectedCountryIds,
    clearGrocery,
    setHasSeenWelcome,
  } = useApp();
  const { user, isAuthenticated, signOut } = useAuth();

  const haptic = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 10,
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 50) onClose();
      },
    })
  ).current;

  const bucketListCountries = COUNTRIES.filter((c) => selectedCountryIds.includes(c.id));

  const handleSignOut = async () => {
    if (Platform.OS === "web") {
      await signOut();
      onClose();
      return;
    }
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          onClose();
        },
      },
    ]);
  };

  const handleReset = () => {
    if (Platform.OS === "web") {
      clearGrocery();
      setHasSeenWelcome(false);
      onClose();
      return;
    }
    Alert.alert("Reset App", "This will clear all your data and show the welcome screen again.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        style: "destructive",
        onPress: () => {
          clearGrocery();
          setHasSeenWelcome(false);
          onClose();
        },
      },
    ]);
  };

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          <View {...panResponder.panHandlers} style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            bounces={false}
          >
            <View style={styles.headerRow}>
              <View style={styles.avatarCircle}>
                <Ionicons name="person" size={28} color={Colors.light.primary} />
              </View>
              <View style={{ flex: 1 }}>
                {isAuthenticated && user?.email ? (
                  <Text style={styles.email} numberOfLines={1}>{user.email}</Text>
                ) : (
                  <Text style={styles.signInPrompt}>Guest Explorer</Text>
                )}
                <Text style={styles.levelBadge}>
                  {COOKING_LEVELS.find((l) => l.key === cookingLevel)?.icon}{" "}
                  {COOKING_LEVELS.find((l) => l.key === cookingLevel)?.label}
                </Text>
              </View>
              <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color={Colors.light.secondary} />
              </Pressable>
            </View>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Cooking Level</Text>
            <View style={styles.card}>
              {COOKING_LEVELS.map((level, idx) => {
                const isSelected = cookingLevel === level.key;
                return (
                  <Pressable
                    key={level.key}
                    onPress={() => { haptic(); setCookingLevel(level.key); }}
                    style={[
                      styles.optionRow,
                      idx < COOKING_LEVELS.length - 1 && styles.optionRowBorder,
                      isSelected && styles.optionRowSelected,
                    ]}
                  >
                    <Text style={styles.optionIcon}>{level.icon}</Text>
                    <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>{level.label}</Text>
                    <View style={[styles.radio, isSelected && styles.radioSelected]}>
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.sectionTitle}>Appearance</Text>
            <View style={styles.appearanceToggle}>
              {APPEARANCE_MODES.map((mode) => {
                const isActive = appearanceMode === mode.key;
                return (
                  <Pressable
                    key={mode.key}
                    onPress={() => { haptic(); setAppearanceMode(mode.key); }}
                    style={[styles.appearanceBtn, isActive && styles.appearanceBtnActive]}
                  >
                    <Text style={[styles.appearanceText, isActive && styles.appearanceTextActive]}>
                      {mode.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.sectionTitle}>Your Bucket List</Text>
            <View style={styles.card}>
              <View style={styles.bucketRow}>
                {bucketListCountries.length > 0 ? (
                  bucketListCountries.map((c) => (
                    <Text key={c.id} style={styles.bucketFlag}>{c.flag}</Text>
                  ))
                ) : (
                  <Text style={styles.bucketEmpty}>No countries selected yet</Text>
                )}
              </View>
              <Pressable
                style={styles.editRow}
                onPress={() => { haptic(); onClose(); router.push("/onboarding"); }}
              >
                <Text style={styles.editText}>Edit countries</Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.light.secondary} />
              </Pressable>
            </View>

            <Pressable
              style={styles.settingsLink}
              onPress={() => { haptic(); onClose(); router.push("/settings"); }}
            >
              <Ionicons name="settings-outline" size={18} color={Colors.light.secondary} />
              <Text style={styles.settingsLinkText}>All Settings</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.light.outlineVariant} />
            </Pressable>

            {isAuthenticated && (
              <Pressable
                onPress={handleSignOut}
                style={({ pressed }) => [styles.signOutBtn, pressed && { opacity: 0.7 }]}
              >
                <Ionicons name="log-out-outline" size={18} color={Colors.light.error} />
                <Text style={styles.signOutText}>Sign Out</Text>
              </Pressable>
            )}

            <Pressable
              onPress={handleReset}
              style={({ pressed }) => [styles.resetBtn, pressed && { opacity: 0.7 }]}
            >
              <Ionicons name="refresh-outline" size={18} color={Colors.light.error} />
              <Text style={styles.resetText}>Reset All Data</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 16 },
      android: { elevation: 12 },
      web: { boxShadow: "0 -4px 32px rgba(0,0,0,0.15)" },
    }),
  },
  handleWrap: {
    alignItems: "center",
    paddingVertical: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.light.outlineVariant,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.surfaceContainerHigh,
    alignItems: "center",
    justifyContent: "center",
  },
  email: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.light.onSurface,
  },
  signInPrompt: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.light.onSurface,
  },
  levelBadge: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.light.secondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.surfaceContainerHigh,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.light.outlineVariant,
  },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.light.secondary,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginTop: 4,
  },
  card: {
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: 16,
    overflow: "hidden",
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  optionRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(222,193,179,0.15)",
  },
  optionRowSelected: {
    backgroundColor: "rgba(236,231,226,0.5)",
  },
  optionIcon: {
    fontSize: 18,
  },
  optionLabel: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: Colors.light.onSurface,
  },
  optionLabelSelected: {
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
  appearanceToggle: {
    flexDirection: "row",
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: 12,
    padding: 3,
  },
  appearanceBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },
  appearanceBtnActive: {
    backgroundColor: Colors.light.primary,
  },
  appearanceText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.light.onSurfaceVariant,
  },
  appearanceTextActive: {
    color: Colors.light.onPrimary,
    fontFamily: "Inter_600SemiBold",
  },
  bucketRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
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
  editRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(222,193,179,0.15)",
  },
  editText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.light.primary,
  },
  settingsLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: 16,
  },
  settingsLinkText: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.light.onSurface,
  },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,59,48,0.2)",
  },
  signOutText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.light.error,
  },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  resetText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.light.error,
  },
});
