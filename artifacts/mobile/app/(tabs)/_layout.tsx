import { BlurView } from "expo-blur";
import { Tabs, usePathname } from "expo-router";
import { SymbolView } from "expo-symbols";
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useApp } from "@/contexts/AppContext";
import { useThemeColors } from "@/hooks/useThemeColors";
import ShellHeader from "@/components/ShellHeader";

export default function TabLayout() {
  const safeAreaInsets = useSafeAreaInsets();
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const { activeCookSession } = useApp();
  const colors = useThemeColors();
  const isDark = colors.background === Colors.dark.background;
  const pathname = usePathname();

  const isDiscover =
    !pathname.includes("/search") &&
    !pathname.includes("/plan") &&
    !pathname.includes("/grocery") &&
    !pathname.includes("/cook");

  return (
    <View style={{ flex: 1 }}>
      <ShellHeader transparent={isDiscover} />
      <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.secondary,
        tabBarLabelStyle: {
          fontFamily: "Inter_500Medium",
          fontSize: 10,
        },
        tabBarStyle: {
          position: "absolute" as const,
          backgroundColor: isIOS
            ? "transparent"
            : isDark
              ? "rgba(18,17,16,0.95)"
              : "rgba(254,249,243,0.95)",
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: "rgba(138,56,0,0.15)",
          elevation: 0,
          paddingBottom: safeAreaInsets.bottom,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={80}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: isDark
                    ? "rgba(18,17,16,0.95)"
                    : "rgba(254,249,243,0.95)",
                },
              ]}
            />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Discover",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="safari" tintColor={color} size={24} />
            ) : (
              <MaterialIcons name="explore" size={24} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="magnifyingglass" tintColor={color} size={24} />
            ) : (
              <MaterialIcons name="search" size={24} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: "Plan",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="calendar.badge.checkmark" tintColor={color} size={24} />
            ) : (
              <MaterialIcons name="event-note" size={24} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="grocery"
        options={{
          title: "Groceries",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="cart" tintColor={color} size={24} />
            ) : (
              <MaterialIcons name="shopping-cart" size={24} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="cook"
        options={{
          title: "Cook",
          tabBarIcon: ({ color }) => (
            <View style={{ width: 28, height: 28, alignItems: "center", justifyContent: "center" }}>
              {isIOS ? (
                <SymbolView name="fork.knife" tintColor={color} size={24} />
              ) : (
                <MaterialIcons name="restaurant" size={24} color={color} />
              )}
              {activeCookSession != null && (
                <View style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: colors.primary,
                  borderWidth: 1.5,
                  borderColor: colors.surface,
                }} />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
        }}
      />
    </Tabs>
    </View>
  );
}
