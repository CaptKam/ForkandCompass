import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useApp } from "@/contexts/AppContext";
import { useThemeColors } from "@/hooks/useThemeColors";

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "safari", selected: "safari.fill" }} />
        <Label>Discover</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="search">
        <Icon sf={{ default: "magnifyingglass", selected: "magnifyingglass" }} />
        <Label>Search</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="plan">
        <Icon sf={{ default: "calendar.badge.checkmark", selected: "calendar.badge.checkmark" }} />
        <Label>Plan</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="cook">
        <Icon sf={{ default: "fork.knife", selected: "fork.knife" }} />
        <Label>Cook</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: "person.circle", selected: "person.circle.fill" }} />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const safeAreaInsets = useSafeAreaInsets();
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const { activeCookSession } = useApp();
  const colors = useThemeColors();
  const isDark = colors.background === Colors.dark.background;

  return (
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
          title: "Profile",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="person.circle" tintColor={color} size={24} />
            ) : (
              <MaterialIcons name="person-outline" size={24} color={color} />
            ),
        }}
      />
    </Tabs>
      </Tabs>
    </View>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
