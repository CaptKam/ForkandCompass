import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import Colors from "@/constants/colors";

interface TabHeaderProps {
  title: string;
  rightExtra?: React.ReactNode;
}

export default function TabHeader({ title, rightExtra }: TabHeaderProps) {
  const insets = useSafeAreaInsets();

  const haptic = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: Platform.OS === "web" ? 56 : insets.top + 12 },
      ]}
    >
      <View style={styles.row}>
        {/* Title */}
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>

        {/* Right: optional extra action + avatar */}
        <View style={styles.right}>
          {rightExtra}
          <Pressable
            onPress={() => {
              haptic();
              router.push("/settings");
            }}
            style={styles.avatar}
            hitSlop={8}
          >
            <Ionicons name="person" size={14} color={Colors.light.outline} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.surface,
    paddingHorizontal: 24,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(222,193,179,0.35)",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    flex: 1,
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 20,
    color: Colors.light.primary,
    letterSpacing: -0.3,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: "rgba(222,193,179,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
});
