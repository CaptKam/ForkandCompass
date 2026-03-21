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
import { useApp } from "@/contexts/AppContext";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { clearGrocery, setHasSeenWelcome } = useApp();

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

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Platform.OS === "web" ? 67 : insets.top + 8 }]}>
        <View>
          <Text style={styles.headerLabel}>Preferences</Text>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>
      </View>

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.card}>
            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>App</Text>
              <Text style={styles.aboutValue}>The Culinary Editorial</Text>
            </View>
            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>Version</Text>
              <Text style={styles.aboutValue}>1.0.0</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General</Text>
          <View style={styles.card}>
            <SettingsRow
              icon="notifications-outline"
              label="Notifications"
              value="Off"
            />
            <SettingsRow
              icon="language-outline"
              label="Language"
              value="English"
            />
            <SettingsRow
              icon="moon-outline"
              label="Appearance"
              value="Light"
            />
          </View>
        </View>

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

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Made with care for food lovers everywhere.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function SettingsRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <Pressable style={styles.settingsRow}>
      <View style={styles.settingsRowLeft}>
        <Ionicons
          name={icon as any}
          size={20}
          color={Colors.light.secondary}
        />
        <Text style={styles.settingsLabel}>{label}</Text>
      </View>
      <View style={styles.settingsRowRight}>
        <Text style={styles.settingsValue}>{value}</Text>
        <Ionicons name="chevron-forward" size={16} color={Colors.light.outlineVariant} />
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
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.light.secondary,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  card: {
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: 18,
    overflow: "hidden",
  },
  aboutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  aboutLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.light.onSurface,
  },
  aboutValue: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.light.secondary,
  },
  settingsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingsRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingsRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  settingsLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.light.onSurface,
  },
  settingsValue: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.light.secondary,
  },
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
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: "center",
  },
  footerText: {
    fontFamily: "NotoSerif_400Regular_Italic",
    fontSize: 14,
    color: Colors.light.secondary,
    textAlign: "center",
  },
});
