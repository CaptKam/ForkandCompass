import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { getRecipeById } from "@/constants/data";
import { CATEGORY_LABELS, type PantryStaple } from "@/constants/pantry";
import { PARTNER_CONFIG, PARTNER_LIST, type GroceryPartner } from "@/constants/partners";
import { useApp } from "@/contexts/AppContext";
import {
  generateItinerary,
  type ItineraryProfile,
} from "@/hooks/useItinerary";

const TOTAL_STEPS = 6;

const COOKING_DAYS_OPTIONS: { value: 3 | 5 | 7; label: string }[] = [
  { value: 3, label: "3" },
  { value: 5, label: "5" },
  { value: 7, label: "7" },
];

const TIME_OPTIONS: { key: ItineraryProfile["timePreference"]; icon: string; label: string; sub: string }[] = [
  { key: "quick", icon: "⚡", label: "Quick & easy", sub: "Under 30 minutes total" },
  { key: "moderate", icon: "🍳", label: "I can manage", sub: "30–60 minutes" },
  { key: "relaxed", icon: "🕯️", label: "I like to cook", sub: "Take all the time you need" },
];

const ADVENTURE_OPTIONS: { key: ItineraryProfile["adventurousness"]; icon: string; label: string; sub: string }[] = [
  { key: "familiar", icon: "🏠", label: "Stick to countries I know", sub: "Only your bucket list selections" },
  { key: "mixed", icon: "🌤️", label: "Mix familiar and new", sub: "Mostly your picks, with surprises" },
  { key: "surprise", icon: "🎲", label: "Surprise me every time", sub: "Any country, any region" },
];

export default function ItinerarySetupScreen() {
  const insets = useSafeAreaInsets();
  const {
    selectedCountryIds,
    itineraryProfile,
    setItineraryProfile,
    setCurrentItinerary,
    itineraryHistory,
    pantryStaples,
    togglePantryStaple,
    addToGrocery,
    clearGrocery,
    groceryPartner,
    setGroceryPartner,
    savedRecipeIds,
  } = useApp();

  const [step, setStep] = useState(0);
  const [cookingDays, setCookingDays] = useState<3 | 5 | 7>(
    itineraryProfile?.cookingDays ?? 5
  );
  const [timePreference, setTimePreference] = useState<ItineraryProfile["timePreference"]>(
    itineraryProfile?.timePreference ?? "moderate"
  );
  const [adventurousness, setAdventurousness] = useState<ItineraryProfile["adventurousness"]>(
    itineraryProfile?.adventurousness ?? "mixed"
  );
  const [servings, setServings] = useState(itineraryProfile?.defaultServings ?? 2);
  const [useSavedOnly, setUseSavedOnly] = useState(false);

  const haptic = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleComplete = () => {
    haptic();
    const profile: ItineraryProfile = {
      cookingDays,
      timePreference,
      adventurousness,
      defaultServings: servings,
    };
    setItineraryProfile(profile);
    const itinerary = generateItinerary(profile, selectedCountryIds, itineraryHistory, useSavedOnly ? savedRecipeIds : undefined);
    setCurrentItinerary(itinerary);
    // Auto-populate grocery with the new week's recipes
    clearGrocery();
    for (const day of itinerary) {
      if (day.status !== "active") continue;
      const ids = day.mode === "quick" ? day.quickRecipeIds : day.fullRecipeIds;
      for (const rid of ids) {
        const recipe = getRecipeById(rid);
        if (recipe) addToGrocery(recipe);
      }
    }
    router.back();
  };

  const handleNext = () => {
    haptic();
    if (step < TOTAL_STEPS - 1) setStep(step + 1);
    else handleComplete();
  };

  const handleBack = () => {
    haptic();
    if (step > 0) setStep(step - 1);
    else router.back();
  };

  const renderProgressDots = () => (
    <View style={styles.dotsRow}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <View
          key={i}
          style={[styles.dot, i === step && styles.dotActive]}
        />
      ))}
    </View>
  );

  const renderStep0 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>How many nights a week do you cook?</Text>
      <View style={styles.daysRow}>
        {COOKING_DAYS_OPTIONS.map((opt) => {
          const selected = cookingDays === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => { haptic(); setCookingDays(opt.value); }}
              style={[styles.dayButton, selected && styles.dayButtonSelected]}
            >
              <Text style={[styles.dayNumber, selected && styles.dayNumberSelected]}>
                {opt.label}
              </Text>
              <Text style={[styles.dayLabel, selected && styles.dayLabelSelected]}>nights</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Saved recipes toggle */}
      {savedRecipeIds.length >= 3 && (
        <Pressable
          onPress={() => { haptic(); setUseSavedOnly(prev => !prev); }}
          style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14, paddingHorizontal: 20, backgroundColor: Colors.light.surface, borderRadius: 12, borderWidth: 1, borderColor: useSavedOnly ? Colors.light.primary : Colors.light.outlineVariant }}
          accessibilityLabel="Use only saved recipes"
        >
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.light.onSurface, marginBottom: 2 }}>Use my saved recipes</Text>
            <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.light.secondary }}>Build your week from your {savedRecipeIds.length} favourites</Text>
          </View>
          <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: useSavedOnly ? Colors.light.primary : Colors.light.outline, backgroundColor: useSavedOnly ? Colors.light.primary : "transparent", alignItems: "center", justifyContent: "center" }}>
            {useSavedOnly && <Ionicons name="checkmark" size={14} color={Colors.light.onPrimary} />}
          </View>
        </Pressable>
      )}
    </View>
  );

  const renderCardOptions = (
    options: { key: string; icon: string; label: string; sub: string }[],
    selected: string,
    onSelect: (key: string) => void,
    title: string
  ) => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{title}</Text>
      <View style={styles.optionsColumn}>
        {options.map((opt) => {
          const isSelected = selected === opt.key;
          return (
            <Pressable
              key={opt.key}
              onPress={() => { haptic(); onSelect(opt.key); }}
              style={[styles.optionCard, isSelected && styles.optionCardSelected]}
            >
              <Text style={styles.optionIcon}>{opt.icon}</Text>
              <View style={styles.optionText}>
                <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                  {opt.label}
                </Text>
                <Text style={styles.optionSub}>{opt.sub}</Text>
              </View>
              {isSelected && (
                <View style={styles.optionCheck}>
                  <Ionicons name="checkmark" size={16} color={Colors.light.onPrimary} />
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Cooking for how many?</Text>
      <View style={styles.stepperRow}>
        <Pressable
          onPress={() => { haptic(); setServings(Math.max(1, servings - 1)); }}
          style={[styles.stepperButton, servings <= 1 && styles.stepperButtonDisabled]}
          disabled={servings <= 1}
        >
          <Ionicons name="remove" size={24} color={servings <= 1 ? Colors.light.outlineVariant : Colors.light.onSurface} />
        </Pressable>
        <View style={styles.stepperValue}>
          <Text style={styles.stepperNumber}>{servings}</Text>
          <Text style={styles.stepperLabel}>{servings === 1 ? "person" : "people"}</Text>
        </View>
        <Pressable
          onPress={() => { haptic(); setServings(Math.min(8, servings + 1)); }}
          style={[styles.stepperButton, servings >= 8 && styles.stepperButtonDisabled]}
          disabled={servings >= 8}
        >
          <Ionicons name="add" size={24} color={servings >= 8 ? Colors.light.outlineVariant : Colors.light.onSurface} />
        </Pressable>
      </View>
    </View>
  );

  const renderStep4 = () => {
    const grouped: Partial<Record<PantryStaple["category"], PantryStaple[]>> = {};
    for (const staple of pantryStaples) {
      if (!grouped[staple.category]) grouped[staple.category] = [];
      grouped[staple.category]!.push(staple);
    }
    const categoryOrder: PantryStaple["category"][] = ["basics", "baking", "sauces", "spices", "pantry"];

    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>What's in your kitchen?</Text>
        <Text style={styles.stepSubtitle}>
          We'll skip these when building your grocery list. Uncheck anything you don't have.
        </Text>
        {categoryOrder.map((cat) => {
          const items = grouped[cat];
          if (!items || items.length === 0) return null;
          return (
            <View key={cat} style={styles.pantryCategory}>
              <Text style={styles.pantryCategoryLabel}>{CATEGORY_LABELS[cat].toUpperCase()}</Text>
              {items.map((staple, idx) => (
                <Pressable
                  key={staple.id}
                  onPress={() => { haptic(); togglePantryStaple(staple.id); }}
                  style={[
                    styles.pantryRow,
                    idx < items.length - 1 && styles.pantryRowBorder,
                  ]}
                >
                  <View style={[styles.pantryCheckbox, staple.inKitchen && styles.pantryCheckboxChecked]}>
                    {staple.inKitchen && (
                      <Ionicons name="checkmark" size={13} color={Colors.light.onPrimary} />
                    )}
                  </View>
                  <Text style={[styles.pantryIngredient, !staple.inKitchen && styles.pantryIngredientOff]}>
                    {staple.ingredient}
                  </Text>
                </Pressable>
              ))}
            </View>
          );
        })}
      </View>
    );
  };

  const renderStep5 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Where do you shop?</Text>
      <Text style={styles.stepSubtitle}>
        We'll send your grocery list there each week. You can always change this later.
      </Text>
      <View style={styles.partnerList}>
        {PARTNER_LIST.map((p) => {
          const selected = groceryPartner === p.id;
          return (
            <Pressable
              key={p.id}
              onPress={() => { haptic(); setGroceryPartner(p.id as GroceryPartner); }}
              style={[styles.partnerRow, selected && styles.partnerRowSelected]}
            >
              <View style={[styles.partnerCircle, { backgroundColor: p.light }]}>
                <Text style={[styles.partnerInitial, { color: p.color }]}>{p.initial}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.partnerLabel, selected && styles.partnerLabelSelected]}>{p.label}</Text>
                <Text style={styles.partnerSub}>{p.sub}</Text>
              </View>
              <View style={[styles.partnerRadio, selected && { borderColor: p.color }]}>
                {selected && <View style={[styles.partnerRadioInner, { backgroundColor: p.color }]} />}
              </View>
            </Pressable>
          );
        })}
        <Pressable
          onPress={() => { haptic(); setGroceryPartner("skip"); }}
          style={[styles.partnerRow, groceryPartner === "skip" && styles.partnerRowSelected]}
        >
          <View style={[styles.partnerCircle, { backgroundColor: Colors.light.surfaceContainerLow }]}>
            <Ionicons name="close" size={18} color={Colors.light.secondary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.partnerLabel, groceryPartner === "skip" && { color: Colors.light.onSurface }]}>
              I'll shop myself
            </Text>
            <Text style={styles.partnerSub}>No store link — just the list</Text>
          </View>
          <View style={[styles.partnerRadio, groceryPartner === "skip" && { borderColor: Colors.light.primary }]}>
            {groceryPartner === "skip" && <View style={[styles.partnerRadioInner, { backgroundColor: Colors.light.primary }]} />}
          </View>
        </Pressable>
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (step) {
      case 0: return renderStep0();
      case 1: return renderCardOptions(TIME_OPTIONS, timePreference, (k) => setTimePreference(k as ItineraryProfile["timePreference"]), "Weeknight energy level?");
      case 2: return renderCardOptions(ADVENTURE_OPTIONS, adventurousness, (k) => setAdventurousness(k as ItineraryProfile["adventurousness"]), "How adventurous?");
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      default: return null;
    }
  };

  const isLastStep = step === TOTAL_STEPS - 1;

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 24 : insets.top + 12 }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} hitSlop={12} style={{ minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" }}>
          <Ionicons name={step === 0 ? "close" : "chevron-back"} size={24} color={Colors.light.onSurface} />
        </Pressable>
        {renderProgressDots()}
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderCurrentStep()}
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.bottomBar, { paddingBottom: Platform.OS === "web" ? 24 : insets.bottom + 12 }]}>
        <Pressable
          onPress={handleNext}
          style={({ pressed }) => [styles.ctaButton, pressed && { opacity: 0.85 }]}
        >
          <Text style={styles.ctaText}>{isLastStep ? "Plan My Week" : "Next"}</Text>
          {!isLastStep && <Ionicons name="chevron-forward" size={18} color={Colors.light.onPrimary} />}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.outlineVariant,
  },
  dotActive: {
    width: 20,
    backgroundColor: Colors.light.primary,
    borderRadius: 3,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  stepContent: {
    flex: 1,
    gap: 32,
  },
  stepTitle: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 26,
    color: Colors.light.onSurface,
    letterSpacing: -0.3,
    lineHeight: 34,
  },
  stepSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 17,
    color: Colors.light.secondary,
    lineHeight: 26,
    marginTop: -20,
  },
  pantryCategory: {
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: 12,
    overflow: "hidden",
  },
  pantryCategoryLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.secondary,
    letterSpacing: 1.2,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  pantryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  pantryRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.outlineVariant,
  },
  pantryCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.light.outlineVariant,
    alignItems: "center",
    justifyContent: "center",
  },
  pantryCheckboxChecked: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  pantryIngredient: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: Colors.light.onSurface,
    flex: 1,
  },
  pantryIngredientOff: {
    color: Colors.light.outlineVariant,
  },

  /* Step 0: Cooking Days */
  daysRow: {
    flexDirection: "row",
    gap: 16,
  },
  dayButton: {
    flex: 1,
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: 20,
    paddingVertical: 28,
    alignItems: "center",
    gap: 6,
    borderWidth: 2,
    borderColor: "transparent",
  },
  dayButtonSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: "rgba(154,65,0,0.06)",
  },
  dayNumber: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 36,
    color: Colors.light.onSurface,
  },
  dayNumberSelected: {
    color: Colors.light.primary,
  },
  dayLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.secondary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  dayLabelSelected: {
    color: Colors.light.primary,
  },

  /* Card Options */
  optionsColumn: {
    gap: 12,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: 20,
    padding: 18,
    gap: 14,
    borderWidth: 2,
    borderColor: "transparent",
  },
  optionCardSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: "rgba(154,65,0,0.06)",
  },
  optionIcon: {
    fontSize: 24,
  },
  optionText: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.light.onSurface,
  },
  optionLabelSelected: {
    color: Colors.light.primary,
  },
  optionSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
    color: Colors.light.secondary,
  },
  optionCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Step 3: Servings Stepper */
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 32,
    paddingTop: 24,
  },
  stepperButton: {
    width: 56,
    height: 48,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: Colors.light.outlineVariant,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperButtonDisabled: {
    opacity: 0.4,
  },
  stepperValue: {
    alignItems: "center",
    gap: 4,
  },
  stepperNumber: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 52,
    color: Colors.light.onSurface,
    letterSpacing: -1,
  },
  stepperLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.secondary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  /* Bottom */
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.light.outlineVariant,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  ctaText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    color: Colors.light.onPrimary,
    letterSpacing: 0.3,
  },

  /* Partner step */
  partnerList: {
    gap: 12,
    marginTop: 8,
  },
  partnerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.light.surfaceContainerLow,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  partnerRowSelected: {
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.primary,
  },
  partnerCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  partnerInitial: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
  },
  partnerLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: Colors.light.secondary,
    marginBottom: 2,
  },
  partnerLabelSelected: {
    color: Colors.light.onSurface,
    fontFamily: "Inter_600SemiBold",
  },
  partnerSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.outlineVariant,
  },
  partnerRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.light.outlineVariant,
    alignItems: "center",
    justifyContent: "center",
  },
  partnerRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
