import React, { useState } from "react";
import {
  View,
  Pressable,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import Colors from "@/constants/colors";
import ProfileSheet from "@/components/ProfileSheet";

interface ShellHeaderProps {
  transparent?: boolean;
}

export default function ShellHeader({ transparent = false }: ShellHeaderProps) {
  const insets = useSafeAreaInsets();
  const [showProfile, setShowProfile] = useState(false);

  const handleAvatarPress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowProfile(true);
  };

  return (
    <>
      <View
        style={[
          styles.overlay,
          { top: Platform.OS === "web" ? 56 : insets.top + 8 },
        ]}
        pointerEvents="box-none"
      >
        <Pressable
          onPress={handleAvatarPress}
          style={({ pressed }) => [
            styles.avatarBtn,
            pressed && { opacity: 0.75 },
          ]}
          accessibilityLabel="Open profile"
          accessibilityRole="button"
          accessibilityHint="Opens your profile and settings"
        >
          <View style={[
            styles.avatarCircle,
            transparent && styles.avatarTransparent,
          ]}>
            <Ionicons
              name="person"
              size={14}
              color={transparent ? "#FFFFFF" : Colors.light.primary}
            />
          </View>
        </Pressable>
      </View>

      {showProfile && (
        <ProfileSheet onClose={() => setShowProfile(false)} />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    right: 20,
    zIndex: 100,
  },
  avatarBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.light.surfaceContainerLow,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.light.outlineVariant,
  },
  avatarTransparent: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderColor: "rgba(255,255,255,0.3)",
  },
});
