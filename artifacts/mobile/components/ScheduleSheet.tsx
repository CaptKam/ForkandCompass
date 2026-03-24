import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import Colors from "@/constants/colors";
import { getRecipeById } from "@/constants/data";
import type { Recipe } from "@/constants/data";
import { useApp } from "@/contexts/AppContext";
import type { ItineraryDay } from "@/hooks/useItinerary";

interface ScheduleSheetProps {
  recipe: Recipe;
  onClose: () => void;
  /** Pre-select a specific date (ISO YYYY-MM-DD) */
  preselectedDate?: string;
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const month = d.toLocaleDateString("en-US", { month: "short" });
  return `${month} ${d.getDate()}`;
}

export default function ScheduleSheet({ recipe, onClose, preselectedDate }: ScheduleSheetProps) {
  const {
    currentItinerary,
    setCurrentItinerary,
    addToGrocery,
  } = useApp();

  const [servings, setServings] = useState(4);
  const defaultServings = 4;
  const scaleFactor = servings / defaultServings;

  const haptic = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Build this week's days
  const thisWeekDays = useMemo(() => {
    const monday = getMonday(new Date());
    return DAY_LABELS.map((label, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const iso = toISODate(date);
      const existing = currentItinerary.find((d) => d.date === iso);
      return { label, date: iso, existing };
    });
  }, [currentItinerary]);

  // Build next week's days
  const nextWeekDays = useMemo(() => {
    const monday = getMonday(new Date());
    const nextMonday = new Date(monday);
    nextMonday.setDate(monday.getDate() + 7);
    return DAY_LABELS.map((label, i) => {
      const date = new Date(nextMonday);
      date.setDate(nextMonday.getDate() + i);
      const iso = toISODate(date);
      const existing = currentItinerary.find((d) => d.date === iso);
      return { label, date: iso, existing };
    });
  }, [currentItinerary]);

  const todayISO = toISODate(new Date());

  const scheduleToDate = (dateISO: string, dayLabel: string, addGrocery: boolean) => {
    haptic();

    // Create or update itinerary day
    const existingIdx = currentItinerary.findIndex((d) => d.date === dateISO);

    const newDay: ItineraryDay = {
      id: `scheduled-${dateISO}-${Date.now()}`,
      date: dateISO,
      dayLabel,
      countryId: recipe.countryId,
      regionId: recipe.region ?? "",
      quickRecipeIds: [recipe.id],
      fullRecipeIds: [recipe.id],
      mode: "quick",
      status: "active",
    };

    if (existingIdx >= 0) {
      // Replace existing day
      const updated = [...currentItinerary];
      updated[existingIdx] = newDay;
      setCurrentItinerary(updated);
    } else {
      // Add new day
      setCurrentItinerary([...currentItinerary, newDay]);
    }

    if (addGrocery) {
      addToGrocery(recipe);
    }

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onClose();
  };

  const renderDayRow = (day: { label: string; date: string; existing: ItineraryDay | undefined }) => {
    const isToday = day.date === todayISO;
    const hasRecipe = day.existing && day.existing.status === "active";
    const isSkipped = day.existing?.status === "skipped";
    const existingRecipeIds = day.existing
      ? (day.existing.mode === "quick" ? day.existing.quickRecipeIds : day.existing.fullRecipeIds)
      : [];
    const existingRecipes = existingRecipeIds.map(getRecipeById).filter(Boolean);
    const existingName = existingRecipes.map((r) => r?.name).join(", ");

    return (
      <View
        key={day.date}
        style={[
          styles.dayRow,
          isToday && styles.dayRowToday,
        ]}
      >
        <View style={styles.dayInfo}>
          <Text style={styles.dayLabel}>
            {day.label.slice(0, 3)} {formatShortDate(day.date)}
          </Text>
          {hasRecipe ? (
            <Text style={styles.dayRecipe} numberOfLines={1}>{existingName}</Text>
          ) : isSkipped ? (
            <Text style={styles.dayEmpty}>skipped</Text>
          ) : (
            <Text style={styles.dayEmpty}>— empty —</Text>
          )}
        </View>
        <Pressable
          style={({ pressed }) => [styles.dayAction, pressed && { opacity: 0.7 }]}
          onPress={() => {
            if (hasRecipe) {
              // Confirm swap
              scheduleToDate(day.date, day.label, false);
            } else {
              scheduleToDate(day.date, day.label, false);
            }
          }}
        >
          <Text style={styles.dayActionText}>{hasRecipe ? "swap" : "add"}</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <Pressable style={styles.overlay} onPress={onClose}>
      <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
        <View style={styles.handle} />
        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollArea}>
          {/* Header */}
          <Text style={styles.sheetTitle}>Schedule</Text>
          <Text style={styles.sheetRecipeName}>{recipe.name}</Text>

          {/* This week */}
          <View style={styles.weekSection}>
            <Text style={styles.weekLabel}>THIS WEEK</Text>
            {thisWeekDays.map(renderDayRow)}
          </View>

          {/* Next week */}
          <View style={styles.weekSection}>
            <Text style={styles.weekLabel}>NEXT WEEK</Text>
            {nextWeekDays.map(renderDayRow)}
          </View>

          {/* Servings */}
          <View style={styles.servingsSection}>
            <Text style={styles.servingsLabel}>SERVINGS</Text>
            <View style={styles.servingsRow}>
              <Pressable
                onPress={() => { haptic(); setServings((s) => Math.max(1, s - 1)); }}
                style={({ pressed }) => [styles.servingsBtn, pressed && { opacity: 0.7 }]}
              >
                <Ionicons name="remove" size={20} color={Colors.light.onSurface} />
              </Pressable>
              <Text style={styles.servingsValue}>{servings}</Text>
              <Pressable
                onPress={() => { haptic(); setServings((s) => Math.min(12, s + 1)); }}
                style={({ pressed }) => [styles.servingsBtn, pressed && { opacity: 0.7 }]}
              >
                <Ionicons name="add" size={20} color={Colors.light.onSurface} />
              </Pressable>
            </View>
            <Text style={styles.servingsHelper}>Recipe default: {defaultServings} servings</Text>
          </View>

          {/* Action buttons */}
          <View style={styles.actionsSection}>
            <Pressable
              style={({ pressed }) => [styles.primaryAction, pressed && { opacity: 0.85 }]}
              onPress={() => {
                // Use the first empty day this week, or today
                const emptyDay = thisWeekDays.find((d) => !d.existing || d.existing.status !== "active");
                const target = emptyDay ?? thisWeekDays[0];
                scheduleToDate(target.date, target.label, true);
              }}
            >
              <Text style={styles.primaryActionText}>Schedule & Add to Grocery</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.secondaryAction, pressed && { opacity: 0.85 }]}
              onPress={() => {
                const emptyDay = thisWeekDays.find((d) => !d.existing || d.existing.status !== "active");
                const target = emptyDay ?? thisWeekDays[0];
                scheduleToDate(target.date, target.label, false);
              }}
            >
              <Text style={styles.secondaryActionText}>Schedule Only</Text>
            </Pressable>
          </View>
        </ScrollView>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
    zIndex: 100,
  },
  sheet: {
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    paddingBottom: 40,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.light.surfaceContainerHigh,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  scrollArea: {
    paddingHorizontal: 24,
  },
  sheetTitle: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 22,
    color: Colors.light.onSurface,
    lineHeight: 28,
    marginBottom: 4,
  },
  sheetRecipeName: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: "#8A8279",
    lineHeight: 22,
    marginBottom: 24,
  },

  /* Week sections */
  weekSection: {
    marginBottom: 20,
  },
  weekLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.light.primary,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 12,
    lineHeight: 18,
  },
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E8DFD2",
    minHeight: 52,
  },
  dayRowToday: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.light.primary,
    backgroundColor: "rgba(138,56,0,0.03)",
  },
  dayInfo: {
    flex: 1,
    gap: 2,
  },
  dayLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.light.onSurface,
    lineHeight: 20,
  },
  dayRecipe: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.light.secondary,
    lineHeight: 20,
  },
  dayEmpty: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.light.outlineVariant,
    fontStyle: "italic",
    lineHeight: 20,
  },
  dayAction: {
    backgroundColor: "#F5EDDF",
    borderWidth: 1,
    borderColor: "#E8DFD2",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    minWidth: 52,
    alignItems: "center",
  },
  dayActionText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.light.primary,
    lineHeight: 18,
  },

  /* Servings */
  servingsSection: {
    marginBottom: 24,
    gap: 12,
  },
  servingsLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.light.primary,
    textTransform: "uppercase",
    letterSpacing: 2,
    lineHeight: 18,
  },
  servingsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  servingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F5EDDF",
    borderWidth: 1,
    borderColor: "#E8DFD2",
    alignItems: "center",
    justifyContent: "center",
  },
  servingsValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    color: Colors.light.onSurface,
    minWidth: 32,
    textAlign: "center",
  },
  servingsHelper: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#8A8279",
    lineHeight: 20,
  },

  /* Actions */
  actionsSection: {
    gap: 12,
    paddingBottom: 24,
  },
  primaryAction: {
    backgroundColor: Colors.light.primary,
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryActionText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    color: "#FFFFFF",
  },
  secondaryAction: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: Colors.light.primary,
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryActionText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    color: Colors.light.primary,
  },
});
