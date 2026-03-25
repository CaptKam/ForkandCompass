import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
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
import { COUNTRIES, getAllRecipes, getCountryLocations, LANDMARK_IMAGES, type Country, type Recipe } from "@/constants/data";
import { PARTNER_CONFIG, PARTNER_LIST } from "@/constants/partners";
import { useApp, type CookingLevel, type AppearanceMode, type MeasurementSystem, type TemperatureUnit } from "@/contexts/AppContext";

const MEASUREMENT_SYSTEMS: { key: MeasurementSystem; label: string; desc: string }[] = [
  { key: "us_customary", label: "US Customary", desc: "cups, oz, lb, \u00B0F" },
  { key: "metric", label: "Metric", desc: "g, ml, L, \u00B0C" },
  { key: "imperial_uk", label: "Imperial (UK)", desc: "oz, lb, pints, \u00B0C" },
  { key: "show_both", label: "Show Both", desc: "400 g (14 oz)" },
];

const TEMPERATURE_UNITS: { key: TemperatureUnit; label: string }[] = [
  { key: "fahrenheit", label: "\u00B0F" },
  { key: "celsius", label: "\u00B0C" },
];

const COOKING_LEVELS: { key: CookingLevel; label: string; icon: string }[] = [
  { key: "beginner", label: "Just Learning", icon: "🌱" },
  { key: "intermediate", label: "I've Got This", icon: "🍳" },
  { key: "advanced", label: "Culinary Pro", icon: "👨‍🍳" },
];

const APPEARANCE_MODES: { key: AppearanceMode; label: string }[] = [
  { key: "system", label: "System" },
  { key: "light", label: "Light" },
  { key: "dark", label: "Dark" },
];

const HERO_IMAGE = "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800&q=80";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const {
    clearGrocery,
    setHasSeenWelcome,
    cookingLevel,
    setCookingLevel,
    appearanceMode,
    setAppearanceMode,
    selectedCountryIds,
    itineraryProfile,
    savedRecipeIds,
    savedCountryIds,
    toggleSaved,
    savedRegionIds,
    toggleSavedRegion,
    groceryPartner,
    setGroceryPartner,
    measurementSystem,
    setMeasurementSystem,
    temperatureUnit,
    setTemperatureUnit,
  } = useApp();

  const haptic = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

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

  const bucketListCountries = COUNTRIES.filter((c) => selectedCountryIds.includes(c.id));
  const currentLevel = COOKING_LEVELS.find((l) => l.key === cookingLevel);
  const savedRecipes = getAllRecipes().filter((r) => savedRecipeIds.includes(r.id));
  const savedCountries = COUNTRIES.filter((c) => savedCountryIds.includes(c.id));
  const savedRegions = savedRegionIds.map((rid) => {
    const [countryId, regionName] = rid.split("::");
    const country = COUNTRIES.find((c) => c.id === countryId);
    if (!country) return null;
    const locations = getCountryLocations(country);
    const loc = locations.find((l) => l.name === regionName) ?? locations[0];
    return { id: rid, name: regionName, image: loc?.image ?? country.image, countryId };
  }).filter(Boolean) as { id: string; name: string; image: string; countryId: string }[];

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 120 : insets.bottom + 120 }}
      >
        {/* Profile Hero */}
        <View style={[styles.heroWrap, { paddingTop: Platform.OS === "web" ? 0 : insets.top }]}>
          <Image
            source={{ uri: HERO_IMAGE }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
          <LinearGradient
            colors={["rgba(0,0,0,0.1)", "rgba(0,0,0,0.55)"]}
            style={StyleSheet.absoluteFill}
          />

          {/* Close button (modal dismiss — top-trailing per iOS HIG) */}
          <Pressable
            onPress={() => { haptic(); router.back(); }}
            style={[styles.heroClose, { top: (Platform.OS === "web" ? 16 : insets.top + 4) }]}
            accessibilityLabel="Close"
            hitSlop={12}
          >
            <Ionicons name="close" size={24} color="#FEF9F3" />
          </Pressable>

          {/* Avatar + name overlay */}
          <View style={styles.heroContent}>
            <View style={styles.avatarRing}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={36} color={Colors.light.primary} />
              </View>
            </View>
            <Text style={styles.heroName}>Culinary Explorer</Text>
            <Text style={styles.heroLevel}>{currentLevel?.icon} {currentLevel?.label}</Text>
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{selectedCountryIds.length}</Text>
            <Text style={styles.statLabel}>Countries</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{bucketListCountries.length}</Text>
            <Text style={styles.statLabel}>Bucket List</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{COUNTRIES.reduce((n, c) => n + c.recipes.length, 0)}</Text>
            <Text style={styles.statLabel}>Recipes</Text>
          </View>
        </View>

        {/* Saved — Countries */}
        {savedCountries.length > 0 && (
          <View style={styles.section}>
            <View style={styles.savedSectionHeader}>
              <Text style={styles.savedSectionTitle}>Countries ({savedCountries.length})</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.light.outlineVariant} />
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipScroll}
            >
              {savedCountries.map((country) => (
                <Pressable
                  key={country.id}
                  onPress={() => { haptic(); router.push({ pathname: "/country/[id]", params: { id: country.id } }); }}
                  style={styles.chip}
                >
                  <View style={styles.chipImage}>
                    <Image source={{ uri: LANDMARK_IMAGES[country.id] || country.image }} style={{ width: "100%", height: "100%" }} contentFit="cover" transition={300} />
                  </View>
                  <Text style={styles.chipLabel}>{country.name} {country.flag}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Saved — Regions */}
        {savedRegions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.savedSectionHeader}>
              <Text style={styles.savedSectionTitle}>Regions ({savedRegions.length})</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.light.outlineVariant} />
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipScroll}
            >
              {savedRegions.map((region) => (
                <Pressable
                  key={region.id}
                  onPress={() => { haptic(); router.push({ pathname: "/region/[countryId]/[region]", params: { countryId: region.countryId, region: region.name } }); }}
                  style={styles.chip}
                >
                  <View style={[styles.chipImage, { backgroundColor: Colors.light.surfaceContainerLow }]}>
                    <Image source={{ uri: region.image }} style={{ width: "100%", height: "100%" }} contentFit="cover" transition={300} />
                  </View>
                  <Text style={styles.chipLabel}>{region.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Saved — Recipes */}
        {savedRecipes.length > 0 && (
          <View style={styles.section}>
            <View style={styles.savedSectionHeader}>
              <Text style={styles.savedSectionTitle}>Recipes ({savedRecipes.length})</Text>
              <Text style={styles.savedSortLabel}>Sort By Date</Text>
            </View>
            <View style={styles.card}>
              {savedRecipes.map((recipe, index) => (
                <Pressable
                  key={recipe.id}
                  onPress={() => { haptic(); router.push({ pathname: "/recipe/[id]", params: { id: recipe.id } }); }}
                  style={[styles.savedRecipeRow, index < savedRecipes.length - 1 && styles.savedRecipeRowBorder]}
                >
                  <View style={styles.savedRecipeImage}>
                    <Image source={{ uri: recipe.image }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.savedRecipeName} numberOfLines={1}>{recipe.name}</Text>
                    <Text style={styles.savedRecipeCuisine}>{recipe.category}</Text>
                  </View>
                  <Pressable onPress={() => { haptic(); toggleSaved(recipe.id); }} hitSlop={8} style={{ flexShrink: 0, marginLeft: 8 }}>
                    <Ionicons name="bookmark" size={20} color={Colors.light.primary} />
                  </Pressable>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Empty saved state */}
        {savedCountries.length === 0 && savedRegions.length === 0 && savedRecipes.length === 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Saved</Text>
            <View style={[styles.card, { paddingHorizontal: 16, paddingVertical: 24, alignItems: "center", gap: 8 }]}>
              <Ionicons name="bookmark-outline" size={30} color={Colors.light.outlineVariant} />
              <Text style={{ fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.light.secondary, textAlign: "center", lineHeight: 20 }}>
                Nothing saved yet. Tap the bookmark on any recipe or country to save it here.
              </Text>
            </View>
          </View>
        )}

        {/* Cooking Level */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cooking Level</Text>
          <View style={styles.card}>
            {COOKING_LEVELS.map((level, index) => {
              const isSelected = cookingLevel === level.key;
              const isLast = index === COOKING_LEVELS.length - 1;
              return (
                <Pressable
                  key={level.key}
                  onPress={() => { haptic(); setCookingLevel(level.key); }}
                  style={[
                    styles.levelRow,
                    !isLast && styles.levelRowBorder,
                    isSelected && styles.levelRowSelected,
                  ]}
                >
                  <View style={styles.levelLeft}>
                    <Text style={styles.levelIcon}>{level.icon}</Text>
                    <Text style={[styles.levelLabel, isSelected && styles.levelLabelSelected]}>
                      {level.label}
                    </Text>
                  </View>
                  <View style={[styles.radio, isSelected && styles.radioSelected]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Measurements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Measurements</Text>
          <View style={styles.card}>
            {MEASUREMENT_SYSTEMS.map((sys, index) => {
              const isSelected = measurementSystem === sys.key;
              const isLast = index === MEASUREMENT_SYSTEMS.length - 1;
              return (
                <Pressable
                  key={sys.key}
                  onPress={() => { haptic(); setMeasurementSystem(sys.key); }}
                  style={[
                    styles.levelRow,
                    !isLast && styles.levelRowBorder,
                    isSelected && styles.levelRowSelected,
                  ]}
                >
                  <View style={styles.levelLeft}>
                    <Text style={[styles.levelLabel, isSelected && styles.levelLabelSelected]}>
                      {sys.label}
                    </Text>
                    <Text style={styles.measurementDesc}>{sys.desc}</Text>
                  </View>
                  <View style={[styles.radio, isSelected && styles.radioSelected]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                </Pressable>
              );
            })}
          </View>
          <View style={[styles.card, { marginTop: 12 }]}>
            <View style={styles.tempRow}>
              <Text style={styles.tempLabel}>Temperature</Text>
              <View style={styles.tempToggle}>
                {TEMPERATURE_UNITS.map((u) => {
                  const active = temperatureUnit === u.key;
                  return (
                    <Pressable
                      key={u.key}
                      onPress={() => { haptic(); setTemperatureUnit(u.key); }}
                      style={[styles.tempPill, active && styles.tempPillActive]}
                    >
                      <Text style={[styles.tempPillText, active && styles.tempPillTextActive]}>
                        {u.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        {/* Itinerary Preferences */}
        {itineraryProfile && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Itinerary Preferences</Text>
            <Pressable
              style={styles.card}
              onPress={() => { haptic(); router.push("/itinerary-setup"); }}
            >
              <View style={styles.itineraryPrefRow}>
                <View style={styles.itineraryPrefContent}>
                  <Text style={styles.itineraryPrefSummary}>
                    {itineraryProfile.cookingDays} nights · {itineraryProfile.timePreference === "quick" ? "Quick" : itineraryProfile.timePreference === "moderate" ? "Moderate" : "Relaxed"} · {itineraryProfile.adventurousness === "familiar" ? "Familiar" : itineraryProfile.adventurousness === "mixed" ? "Mixed" : "Surprise"} · {itineraryProfile.defaultServings} {itineraryProfile.defaultServings === 1 ? "serving" : "servings"}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.light.secondary} />
              </View>
            </Pressable>
          </View>
        )}

        {/* Grocery Store */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Grocery Store</Text>
          <View style={styles.card}>
            {PARTNER_LIST.map((p, index) => {
              const isSelected = groceryPartner === p.id;
              const isLast = index === PARTNER_LIST.length - 1 && groceryPartner !== "skip" && groceryPartner !== null;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => { haptic(); setGroceryPartner(p.id); }}
                  style={[
                    styles.levelRow,
                    index < PARTNER_LIST.length - 1 && styles.levelRowBorder,
                    isSelected && styles.levelRowSelected,
                  ]}
                >
                  <View style={styles.levelLeft}>
                    <View style={[styles.settingsPartnerCircle, { backgroundColor: p.light }]}>
                      <Text style={[styles.settingsPartnerInitial, { color: p.color }]}>{p.initial}</Text>
                    </View>
                    <View>
                      <Text style={[styles.levelLabel, isSelected && styles.levelLabelSelected]}>{p.label}</Text>
                      <Text style={styles.settingsPartnerSub}>{p.sub}</Text>
                    </View>
                  </View>
                  <View style={[styles.radio, isSelected && styles.radioSelected]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                </Pressable>
              );
            })}
            <Pressable
              onPress={() => { haptic(); setGroceryPartner("skip"); }}
              style={[styles.levelRow, (groceryPartner === "skip" || groceryPartner === null) && styles.levelRowSelected]}
            >
              <View style={styles.levelLeft}>
                <View style={[styles.settingsPartnerCircle, { backgroundColor: Colors.light.surfaceContainerLow }]}>
                  <Ionicons name="close" size={16} color={Colors.light.secondary} />
                </View>
                <View>
                  <Text style={[styles.levelLabel, (groceryPartner === "skip" || groceryPartner === null) && styles.levelLabelSelected]}>I'll shop myself</Text>
                  <Text style={styles.settingsPartnerSub}>No store link — just the list</Text>
                </View>
              </View>
              <View style={[styles.radio, (groceryPartner === "skip" || groceryPartner === null) && styles.radioSelected]}>
                {(groceryPartner === "skip" || groceryPartner === null) && <View style={styles.radioInner} />}
              </View>
            </Pressable>
          </View>
        </View>

        {/* Bucket List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Bucket List</Text>
          <View style={styles.card}>
            <View style={styles.bucketFlagsRow}>
              {bucketListCountries.length > 0 ? (
                bucketListCountries.map((c) => (
                  <Text key={c.id} style={styles.bucketFlag}>{c.flag}</Text>
                ))
              ) : (
                <Text style={styles.bucketEmpty}>No countries selected yet</Text>
              )}
            </View>
            <Pressable style={styles.editCountriesRow} onPress={haptic}>
              <Text style={styles.editCountriesText}>Edit countries</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.light.secondary} />
            </Pressable>
          </View>
        </View>

        {/* Appearance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <View style={styles.appearanceToggle}>
            {APPEARANCE_MODES.map((mode) => {
              const isActive = appearanceMode === mode.key;
              return (
                <Pressable
                  key={mode.key}
                  onPress={() => { haptic(); setAppearanceMode(mode.key); }}
                  style={[styles.appearanceButton, isActive && styles.appearanceButtonActive]}
                >
                  <Text style={[styles.appearanceText, isActive && styles.appearanceTextActive]}>
                    {mode.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.card}>
            <Pressable style={[styles.aboutRow, styles.aboutRowBorder]} onPress={haptic}>
              <Text style={styles.aboutLabel}>Privacy Policy</Text>
              <Ionicons name="open-outline" size={16} color={Colors.light.secondary} />
            </Pressable>
            <Pressable style={[styles.aboutRow, styles.aboutRowBorder]} onPress={haptic}>
              <Text style={styles.aboutLabel}>Terms of Service</Text>
              <Ionicons name="open-outline" size={16} color={Colors.light.secondary} />
            </Pressable>
            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabelDim}>Version</Text>
              <Text style={styles.aboutLabelDim}>1.0</Text>
            </View>
          </View>
        </View>

        {/* Reset */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>
          <Pressable
            onPress={handleReset}
            style={({ pressed }) => [styles.resetButton, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="refresh-outline" size={20} color={Colors.light.error} />
            <Text style={styles.resetText}>Reset All Data</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
  },

  /* Hero */
  heroWrap: {
    height: 260,
    position: "relative",
    justifyContent: "flex-end",
  },
  heroClose: {
    position: "absolute",
    right: 20,
    minWidth: 44,
    minHeight: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.28)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroContent: {
    alignItems: "center",
    paddingBottom: 28,
    gap: 6,
  },
  avatarRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.7)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.surfaceContainerLow,
    alignItems: "center",
    justifyContent: "center",
  },
  heroName: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 22,
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  heroLevel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    lineHeight: 18,
    color: "rgba(255,255,255,0.8)",
    letterSpacing: 0.2,
  },

  /* Stats */
  statsRow: {
    flexDirection: "row",
    backgroundColor: Colors.light.surfaceContainerLow,
    marginHorizontal: 24,
    borderRadius: 18,
    marginTop: -20,
    marginBottom: 28,
    paddingVertical: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statNumber: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 26,
    color: Colors.light.onSurface,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.secondary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(222,193,179,0.3)",
    alignSelf: "stretch",
  },

  /* Sections */
  section: {
    paddingHorizontal: 24,
    marginBottom: 28,
  },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.secondary,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  card: {
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: 18,
    overflow: "hidden",
  },

  /* Cooking Level */
  levelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  levelLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  levelIcon: {
    fontSize: 18,
  },
  levelRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(222,193,179,0.15)",
  },
  levelRowSelected: {
    backgroundColor: "rgba(236,231,226,0.5)",
  },
  levelLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: Colors.light.onSurface,
  },
  levelLabelSelected: {
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.primary,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "rgba(222,193,179,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: {
    borderColor: Colors.light.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.light.primary,
  },

  /* Measurements */
  measurementDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.light.onSurfaceVariant,
    marginTop: 2,
  },
  tempRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  tempLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.light.onSurface,
  },
  tempToggle: {
    flexDirection: "row" as const,
    backgroundColor: Colors.light.surfaceContainerHigh,
    borderRadius: 8,
    padding: 2,
  },
  tempPill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 6,
  },
  tempPillActive: {
    backgroundColor: Colors.light.primary,
  },
  tempPillText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.light.onSurfaceVariant,
  },
  tempPillTextActive: {
    color: "#FFFFFF",
  },

  /* Itinerary Preferences */
  itineraryPrefRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  itineraryPrefContent: {
    flex: 1,
    marginRight: 8,
  },
  itineraryPrefSummary: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.light.onSurface,
    lineHeight: 20,
  },

  /* Bucket List */
  bucketFlagsRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  bucketFlag: {
    fontSize: 26,
  },
  bucketEmpty: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.secondary,
  },
  editCountriesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(222,193,179,0.15)",
  },
  editCountriesText: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: Colors.light.onSurface,
  },

  /* Appearance */
  appearanceToggle: {
    flexDirection: "row",
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: 18,
    padding: 4,
  },
  appearanceButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: "center",
  },
  appearanceButtonActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  appearanceText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(29,27,24,0.5)",
  },
  appearanceTextActive: {
    color: Colors.light.primary,
  },

  /* About */
  aboutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  aboutRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(222,193,179,0.15)",
  },
  aboutLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: Colors.light.onSurface,
  },
  aboutLabelDim: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: Colors.light.secondary,
  },

  /* Saved section headers */
  savedSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  savedSectionTitle: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 17,
    color: Colors.light.onSurface,
  },
  savedSortLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.primary,
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  /* Country / Region chips */
  chipScroll: {
    gap: 20,
    paddingBottom: 4,
  },
  chip: {
    alignItems: "center",
    gap: 8,
  },
  chipImage: {
    width: 80,
    height: 80,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: Colors.light.surfaceContainerHigh,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(222,193,179,0.15)",
  },
  chipLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.secondary,
    letterSpacing: 1,
    textTransform: "uppercase",
    maxWidth: 80,
    textAlign: "center",
  },

  /* Saved recipes */
  savedRecipeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  savedRecipeRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(222,193,179,0.15)",
  },
  savedRecipeImage: {
    width: 52,
    height: 52,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: Colors.light.surfaceContainerHigh,
  },
  savedRecipeName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.onSurface,
    marginBottom: 3,
  },
  savedRecipeCuisine: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.secondary,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  /* Reset */
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
    fontSize: 16,
    color: Colors.light.error,
  },

  /* Grocery partner */
  settingsPartnerCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsPartnerInitial: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
  settingsPartnerSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
    color: Colors.light.outlineVariant,
    marginTop: 1,
  },
});
