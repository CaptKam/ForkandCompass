import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/contexts/AppContext";
import { WELCOME_HERO_IMAGE } from "@/constants/data";
import { Ionicons } from "@expo/vector-icons";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function WelcomeScreen() {
  const { hasSeenWelcome, setHasSeenWelcome } = useApp();
  const insets = useSafeAreaInsets();

  React.useEffect(() => {
    if (hasSeenWelcome) {
      router.replace("/(tabs)");
    }
  }, [hasSeenWelcome]);

  if (hasSeenWelcome) return null;

  const handleStart = () => {
    setHasSeenWelcome(true);
    router.replace("/(tabs)");
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Image
        source={{ uri: WELCOME_HERO_IMAGE }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={600}
      />
      <LinearGradient
        colors={["transparent", "rgba(29,27,24,0.5)", "rgba(29,27,24,0.85)"]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          styles.content,
          {
            paddingBottom: Math.max(insets.bottom, 24) + 24,
            paddingTop: Platform.OS === "web" ? 67 : insets.top,
          },
        ]}
      >
        <View style={styles.textContainer}>
          <Text style={styles.title}>Eat Your Way{"\n"}Across the Globe.</Text>
          <Text style={styles.subtitle}>
            Pick a country, cook a dinner, feel like you traveled.
          </Text>
          <Pressable
            onPress={handleStart}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.buttonText}>Start Your Journey</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1D1B18",
  },
  content: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 24,
  },
  textContainer: {
    maxWidth: 400,
  },
  title: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 44,
    color: "#FFFFFF",
    lineHeight: 52,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 18,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 26,
    marginBottom: 32,
    maxWidth: 320,
  },
  button: {
    backgroundColor: "#9A4100",
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buttonPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
  buttonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    color: "#FFFFFF",
  },
});
