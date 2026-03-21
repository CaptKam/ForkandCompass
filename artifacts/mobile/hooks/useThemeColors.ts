import { useColorScheme } from "react-native";

import Colors from "@/constants/colors";
import { useApp } from "@/contexts/AppContext";

export function useThemeColors() {
  const { appearanceMode } = useApp();
  const systemScheme = useColorScheme();

  if (appearanceMode === "light") return Colors.light;
  if (appearanceMode === "dark") return Colors.dark;

  // "system" mode
  return systemScheme === "dark" ? Colors.dark : Colors.light;
}
