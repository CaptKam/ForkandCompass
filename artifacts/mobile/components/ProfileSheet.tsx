import React, { useRef } from "react";
import {
  Alert,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";

import Colors from "@/constants/colors";
import { COUNTRIES } from "@/constants/data";
import { useApp, type CookingLevel, type AppearanceMode } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";

const COOKING_LEVELS: { key: CookingLevel; label: string; icon: string }[] = [
  { key: "beginner", label: "Simmer", icon: "🌱" },
  { key: "intermediate", label: "Sauté", icon: "🍳" },
  { key: "advanced", label: "Sear", icon: "👨‍🍳" },
];

const APPEARANCE_MODES: { key: AppearanceMode; label: string }[] = [
  { key: "system", label: "System" },
  { key: "light", label: "Light" },
  { key: "dark", label: "Dark" },
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
  } = useApp();
  const { isAuthenticated, user, signOut } = useAuth();

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

  return (
    <Pressable style={styles.overlay} onPress={onClose}>
      <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
        <View {...panResponder.panHandlers} style={styles.handle} />

        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 500 }}>
          {/* Auth section */}
          {isAuthenticated ? (
            <View style={styles.authRow}>
              <View style={styles.avatarLarge}>
                <Ionicons name="person" size={24} color={Colors.light.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.userName}>{user?.email ?? "Chef"}</Text>
                <Text style={styles.userSub}>Signed in</Text>
              </View>
            </View>
          ) : (
            <Pressable
              style={styles.signInRow}
              onPress={() => { onClose(); setTimeout(() => router.push("/auth"), 200); }}
            >
              <View style={styles.avatarLarge}>
                <Ionicons name="person-outline" size={24} color={Colors.light.secondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.userName}>Sign in</Text>
                <Text style={styles.userSub}>Sync your data across devices</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.light.secondary} />
            </Pressable>
          )}

          {/* Cooking Level */}
          <Text style={styles.sectionTitle}>Cooking Level</Text>
          <View style={styles.card}>
            {COOKING_LEVELS.map((level, idx) => {
              const isSelected = cookingLevel === level.key;
              return (
                <Pressable
                  key={level.key}
                  onPress={() => { haptic(); setCookingLevel(level.key); }}
                  style={[styles.levelRow, idx < COOKING_LEVELS.length - 1 && styles.levelRowBorder, isSelected && styles.levelRowSelected]}
                >
                  <Text style={{ fontSize: 18 }}>{level.icon}</Text>
                  <Text style={[styles.levelLabel, isSelected && styles.levelLabelSelected]}>{level.label}</Text>
                  <View style={[styles.radio, isSelected && styles.radioSelected]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Appearance */}
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
                  <Text style={[styles.appearanceText, isActive && styles.appearanceTextActive]}>{mode.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Bucket List */}
          <Text style={styles.sectionTitle}>Bucket List</Text>
          <View style={styles.flagsRow}>
            {bucketListCountries.length > 0 ? (
              bucketListCountries.map((c) => (
                <Text key={c.id} style={{ fontSize: 26 }}>{c.flag}</Text>
              ))
            ) : (
              <Text style={styles.emptyText}>No countries selected</Text>
            )}
          </View>
          <Pressable
            onPress={() => { onClose(); setTimeout(() => router.push("/onboarding"), 200); }}
            style={styles.editRow}
          >
            <Text style={styles.editText}>Edit countries</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.light.secondary} />
          </Pressable>

          {/* Sign Out */}
          {isAuthenticated && (
            <Pressable
              onPress={() => {
                Alert.alert("Sign Out", "Are you sure?", [
                  { text: "Cancel", style: "cancel" },
                  { text: "Sign Out", style: "destructive", onPress: () => { signOut(); onClose(); } },
                ]);
              }}
              style={styles.signOutRow}
            >
              <Ionicons name="log-out-outline" size={18} color={Colors.light.error} />
              <Text style={styles.signOutText}>Sign Out</Text>
            </Pressable>
          )}

          {/* Full Settings */}
          <Pressable
            onPress={() => { onClose(); setTimeout(() => router.push("/settings"), 200); }}
            style={styles.fullSettingsRow}
          >
            <Ionicons name="settings-outline" size={18} color={Colors.light.secondary} />
            <Text style={styles.fullSettingsText}>All Settings</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.light.secondary} />
          </Pressable>
        </ScrollView>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
    zIndex: 1000,
  },
  sheet: {
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.light.surfaceContainerHigh,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
    paddingVertical: 12,
  },
  authRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 20,
  },
  signInRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 20,
    paddingVertical: 8,
  },
  avatarLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.surfaceContainerHigh,
    alignItems: "center",
    justifyContent: "center",
  },
  userName: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 17,
    color: Colors.light.onSurface,
  },
  userSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.light.secondary,
    marginTop: 2,
  },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: Colors.light.secondary,
    marginBottom: 8,
    marginTop: 16,
  },
  card: {
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: 12,
    overflow: "hidden",
  },
  levelRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  levelRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(222,193,179,0.15)",
  },
  levelRowSelected: {
    backgroundColor: "rgba(236,231,226,0.5)",
  },
  levelLabel: {
    flex: 1,
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
  radioSelected: { borderColor: Colors.light.primary },
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
    borderRadius: 10,
    alignItems: "center",
  },
  appearanceBtnActive: {
    backgroundColor: Colors.light.surface,
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
  appearanceTextActive: { color: Colors.light.primary },
  flagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.light.secondary,
  },
  editRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    minHeight: 44,
  },
  editText: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.light.onSurface,
  },
  signOutRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
    marginTop: 8,
    minHeight: 44,
  },
  signOutText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.light.error,
  },
  fullSettingsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(222,193,179,0.2)",
    marginTop: 4,
    minHeight: 44,
  },
  fullSettingsText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.light.secondary,
  },
});
