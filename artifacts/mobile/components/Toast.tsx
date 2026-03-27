import React, { useEffect, useRef } from "react";
import { Animated, Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";

interface ToastProps {
  message: string;
  visible: boolean;
  onHide: () => void;
}

export default function Toast({ message, visible, onHide }: ToastProps) {
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
          onHide();
        });
      }, 2000);
    } else {
      opacity.setValue(0);
    }
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [visible, message]);

  if (!visible) return null;

  return (
    <View style={[styles.container, { top: Platform.OS === "web" ? 20 : insets.top + 8 }]} pointerEvents="none">
      <Animated.View style={[styles.toast, { opacity }]}>
        <Text style={styles.text}>{message}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 20,
    right: 20,
    alignItems: "center",
    zIndex: 999,
  },
  toast: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
      android: { elevation: 6 },
      web: { boxShadow: "0 4px 12px rgba(0,0,0,0.2)" },
    }),
  },
  text: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: "#FFFFFF",
    textAlign: "center",
  },
});
