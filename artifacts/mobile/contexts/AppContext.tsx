import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import type { GroceryItem, Recipe } from "@/constants/data";
import type { InventoryItem, ScanZone } from "@/constants/inventory";
import type { ItineraryProfile, ItineraryDay } from "@/hooks/useItinerary";
import {
  DEFAULT_PANTRY_STAPLES,
  findMatchingStaple,
  type PantryStaple,
} from "@/constants/pantry";

export type CookingLevel = "beginner" | "intermediate" | "advanced";
export type AppearanceMode = "system" | "light" | "dark";
export type ExploreViewMode = "feed" | "grid";

interface AppContextType {
  savedRecipeIds: string[];
  toggleSaved: (id: string) => void;
  isSaved: (id: string) => boolean;
  groceryItems: GroceryItem[];
  addToGrocery: (recipe: Recipe) => void;
  toggleGroceryItem: (id: string) => void;
  removeGroceryItem: (id: string) => void;
  clearGrocery: () => void;
  unexcludeGroceryItem: (id: string) => void;
  quickAddStaple: (staple: PantryStaple) => void;
  // Pantry staples
  pantryStaples: PantryStaple[];
  togglePantryStaple: (id: string) => void;
  isInKitchen: (ingredientName: string) => boolean;
  hasSeenWelcome: boolean;
  setHasSeenWelcome: (v: boolean) => void;
  selectedCountryIds: string[];
  toggleCountrySelection: (id: string) => void;
  hasCompletedOnboarding: boolean;
  setHasCompletedOnboarding: (v: boolean) => void;
  cookingLevel: CookingLevel;
  setCookingLevel: (level: CookingLevel) => void;
  appearanceMode: AppearanceMode;
  setAppearanceMode: (mode: AppearanceMode) => void;
  exploreViewMode: ExploreViewMode;
  setExploreViewMode: (mode: ExploreViewMode) => void;
  savedCountryIds: string[];
  toggleSavedCountry: (id: string) => void;
  isCountrySaved: (id: string) => boolean;
  savedRegionIds: string[];
  toggleSavedRegion: (id: string) => void;
  isSavedRegion: (id: string) => boolean;
  // Culinary Itinerary
  itineraryProfile: ItineraryProfile | null;
  setItineraryProfile: (profile: ItineraryProfile) => void;
  currentItinerary: ItineraryDay[];
  setCurrentItinerary: (itinerary: ItineraryDay[]) => void;
  itineraryHistory: ItineraryDay[][];
  addToItineraryHistory: (week: ItineraryDay[]) => void;
  // Kitchen Inventory Scanner (Beta)
  inventoryItems: InventoryItem[];
  addInventoryItems: (items: InventoryItem[]) => void;
  removeInventoryItem: (id: string) => void;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void;
  clearInventory: () => void;
  clearInventoryZone: (zone: ScanZone) => void;
  lastScanTimestamp: number | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const SAVED_KEY = "@culinary_saved";
const GROCERY_KEY = "@culinary_grocery";
const WELCOME_KEY = "@culinary_welcome";
const SELECTED_COUNTRIES_KEY = "@culinary_selected_countries";
const ONBOARDING_KEY = "@culinary_onboarding";
const COOKING_LEVEL_KEY = "@culinary_cooking_level";
const APPEARANCE_KEY = "@culinary_appearance";
const EXPLORE_VIEW_KEY = "@culinary_explore_view";
const SAVED_COUNTRIES_KEY = "@culinary_saved_countries";
const SAVED_REGIONS_KEY = "@culinary_saved_regions";
const ITINERARY_PROFILE_KEY = "@culinary_itinerary_profile";
const CURRENT_ITINERARY_KEY = "@culinary_current_itinerary";
const ITINERARY_HISTORY_KEY = "@culinary_itinerary_history";
const INVENTORY_KEY = "@culinary_inventory";
const LAST_SCAN_KEY = "@culinary_last_scan";
const PANTRY_KEY = "@culinary_pantry_staples";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [savedRecipeIds, setSavedRecipeIds] = useState<string[]>([]);
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>([]);
  const [hasSeenWelcome, setHasSeenWelcomeState] = useState(false);
  const [selectedCountryIds, setSelectedCountryIds] = useState<string[]>([]);
  const [hasCompletedOnboarding, setHasCompletedOnboardingState] = useState(false);
  const [cookingLevel, setCookingLevelState] = useState<CookingLevel>("intermediate");
  const [appearanceMode, setAppearanceModeState] = useState<AppearanceMode>("light");
  const [exploreViewMode, setExploreViewModeState] = useState<ExploreViewMode>("feed");
  const [savedCountryIds, setSavedCountryIds] = useState<string[]>([]);
  const [savedRegionIds, setSavedRegionIds] = useState<string[]>([]);
  const [itineraryProfile, setItineraryProfileState] = useState<ItineraryProfile | null>(null);
  const [currentItinerary, setCurrentItineraryState] = useState<ItineraryDay[]>([]);
  const [itineraryHistory, setItineraryHistoryState] = useState<ItineraryDay[][]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [lastScanTimestamp, setLastScanTimestamp] = useState<number | null>(null);
  const [pantryStaples, setPantryStaples] = useState<PantryStaple[]>(DEFAULT_PANTRY_STAPLES);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [saved, grocery, welcome, countries, onboarding, cookLevel, appearance, exploreView, savedCtries, savedRegs, itinProfile, itinCurrent, itinHistory, inventory, lastScan, pantry] = await Promise.all([
          AsyncStorage.getItem(SAVED_KEY).catch(() => null),
          AsyncStorage.getItem(GROCERY_KEY).catch(() => null),
          AsyncStorage.getItem(WELCOME_KEY).catch(() => null),
          AsyncStorage.getItem(SELECTED_COUNTRIES_KEY).catch(() => null),
          AsyncStorage.getItem(ONBOARDING_KEY).catch(() => null),
          AsyncStorage.getItem(COOKING_LEVEL_KEY).catch(() => null),
          AsyncStorage.getItem(APPEARANCE_KEY).catch(() => null),
          AsyncStorage.getItem(EXPLORE_VIEW_KEY).catch(() => null),
          AsyncStorage.getItem(SAVED_COUNTRIES_KEY).catch(() => null),
          AsyncStorage.getItem(SAVED_REGIONS_KEY).catch(() => null),
          AsyncStorage.getItem(ITINERARY_PROFILE_KEY).catch(() => null),
          AsyncStorage.getItem(CURRENT_ITINERARY_KEY).catch(() => null),
          AsyncStorage.getItem(ITINERARY_HISTORY_KEY).catch(() => null),
          AsyncStorage.getItem(INVENTORY_KEY).catch(() => null),
          AsyncStorage.getItem(LAST_SCAN_KEY).catch(() => null),
          AsyncStorage.getItem(PANTRY_KEY).catch(() => null),
        ]);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) setSavedRecipeIds(parsed);
          } catch {}
        }
        if (grocery) {
          try {
            const parsed = JSON.parse(grocery);
            if (Array.isArray(parsed)) setGroceryItems(parsed);
          } catch {}
        }
        if (welcome === "true") setHasSeenWelcomeState(true);
        if (countries) {
          try {
            const parsed = JSON.parse(countries);
            if (Array.isArray(parsed)) setSelectedCountryIds(parsed);
          } catch {}
        }
        if (onboarding === "true") setHasCompletedOnboardingState(true);
        if (cookLevel && ["beginner", "intermediate", "advanced"].includes(cookLevel)) {
          setCookingLevelState(cookLevel as CookingLevel);
        }
        if (appearance && ["system", "light", "dark"].includes(appearance)) {
          setAppearanceModeState(appearance as AppearanceMode);
        }
        if (exploreView && ["feed", "grid"].includes(exploreView)) {
          setExploreViewModeState(exploreView as ExploreViewMode);
        }
        if (savedCtries) {
          try {
            const parsed = JSON.parse(savedCtries);
            if (Array.isArray(parsed)) setSavedCountryIds(parsed);
          } catch {}
        }
        if (savedRegs) {
          try {
            const parsed = JSON.parse(savedRegs);
            if (Array.isArray(parsed)) setSavedRegionIds(parsed);
          } catch {}
        }
        if (itinProfile) {
          try {
            const parsed = JSON.parse(itinProfile);
            if (parsed && typeof parsed === "object") setItineraryProfileState(parsed);
          } catch {}
        }
        if (itinCurrent) {
          try {
            const parsed = JSON.parse(itinCurrent);
            if (Array.isArray(parsed)) setCurrentItineraryState(parsed);
          } catch {}
        }
        if (itinHistory) {
          try {
            const parsed = JSON.parse(itinHistory);
            if (Array.isArray(parsed)) setItineraryHistoryState(parsed);
          } catch {}
        }
        if (inventory) {
          try {
            const parsed = JSON.parse(inventory);
            if (Array.isArray(parsed)) setInventoryItems(parsed);
          } catch {}
        }
        if (lastScan) {
          const ts = Number(lastScan);
          if (!Number.isNaN(ts)) setLastScanTimestamp(ts);
        }
        if (pantry) {
          try {
            const parsed = JSON.parse(pantry) as PantryStaple[];
            if (Array.isArray(parsed) && parsed.length > 0) {
              // Merge stored inKitchen states onto the canonical DEFAULT list
              // so new staples added in future versions still appear
              const storedMap = new Map(parsed.map((s) => [s.id, s.inKitchen]));
              setPantryStaples(
                DEFAULT_PANTRY_STAPLES.map((s) => ({
                  ...s,
                  inKitchen: storedMap.has(s.id) ? (storedMap.get(s.id) as boolean) : s.inKitchen,
                }))
              );
            }
          } catch {}
        }
      } catch {}
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(SAVED_KEY, JSON.stringify(savedRecipeIds)).catch(() => {});
  }, [savedRecipeIds, loaded]);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(GROCERY_KEY, JSON.stringify(groceryItems)).catch(() => {});
  }, [groceryItems, loaded]);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(PANTRY_KEY, JSON.stringify(pantryStaples)).catch(() => {});
  }, [pantryStaples, loaded]);

  const toggleSaved = useCallback((id: string) => {
    setSavedRecipeIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }, []);

  const isSaved = useCallback(
    (id: string) => savedRecipeIds.includes(id),
    [savedRecipeIds]
  );

  const isInKitchen = useCallback(
    (ingredientName: string) => {
      const staple = findMatchingStaple(ingredientName, pantryStaples);
      return staple?.inKitchen === true;
    },
    [pantryStaples]
  );

  const addToGrocery = useCallback(
    (recipe: Recipe) => {
      setGroceryItems((prev) => {
        const existingIds = new Set(prev.map((i) => i.id));
        const newItems = recipe.ingredients
          .filter((ing) => !existingIds.has(`${recipe.id}-${ing.id}`))
          .map((ing) => {
            const matchedStaple = findMatchingStaple(ing.name, pantryStaples);
            const isPantryExcluded = matchedStaple?.inKitchen === true;
            return {
              id: `${recipe.id}-${ing.id}`,
              name: ing.name,
              amount: ing.amount,
              checked: false,
              recipeName: recipe.name,
              tier: (isPantryExcluded ? 1 : 3) as 1 | 3,
              excluded: isPantryExcluded,
              excludeReason: isPantryExcluded ? ("pantry_staple" as const) : null,
            };
          });
        return [...prev, ...newItems];
      });
    },
    [pantryStaples]
  );

  const unexcludeGroceryItem = useCallback((id: string) => {
    setGroceryItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, excluded: false } : i))
    );
  }, []);

  const quickAddStaple = useCallback((staple: PantryStaple) => {
    setGroceryItems((prev) => {
      // Check if there's already an excluded item matching this staple
      const excludedMatch = prev.find(
        (i) =>
          i.excluded &&
          staple.keywords.some((kw) => i.name.toLowerCase().includes(kw.toLowerCase()))
      );
      if (excludedMatch) {
        // Unexclude it
        return prev.map((i) => (i.id === excludedMatch.id ? { ...i, excluded: false } : i));
      }
      // Otherwise create a new item (if not already in active list)
      const alreadyActive = prev.some(
        (i) =>
          !i.excluded &&
          staple.keywords.some((kw) => i.name.toLowerCase().includes(kw.toLowerCase()))
      );
      if (alreadyActive) return prev;
      const newItem: GroceryItem = {
        id: `pantry-${staple.id}-${Date.now()}`,
        name: staple.ingredient,
        amount: "",
        checked: false,
        recipeName: "Kitchen Staple",
        tier: 1,
        excluded: false,
        excludeReason: null,
      };
      return [...prev, newItem];
    });
  }, []);

  const togglePantryStaple = useCallback((id: string) => {
    setPantryStaples((prev) =>
      prev.map((s) => (s.id === id ? { ...s, inKitchen: !s.inKitchen } : s))
    );
  }, []);

  const toggleGroceryItem = useCallback((id: string) => {
    setGroceryItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i))
    );
  }, []);

  const removeGroceryItem = useCallback((id: string) => {
    setGroceryItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clearGrocery = useCallback(() => {
    setGroceryItems([]);
  }, []);

  const setHasSeenWelcome = useCallback((v: boolean) => {
    setHasSeenWelcomeState(v);
    AsyncStorage.setItem(WELCOME_KEY, v ? "true" : "false").catch(() => {});
  }, []);

  const toggleCountrySelection = useCallback((id: string) => {
    setSelectedCountryIds((prev) => {
      const next = prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id];
      AsyncStorage.setItem(SELECTED_COUNTRIES_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const setHasCompletedOnboarding = useCallback((v: boolean) => {
    setHasCompletedOnboardingState(v);
    AsyncStorage.setItem(ONBOARDING_KEY, v ? "true" : "false").catch(() => {});
  }, []);

  const setCookingLevel = useCallback((level: CookingLevel) => {
    setCookingLevelState(level);
    AsyncStorage.setItem(COOKING_LEVEL_KEY, level).catch(() => {});
  }, []);

  const setAppearanceMode = useCallback((mode: AppearanceMode) => {
    setAppearanceModeState(mode);
    AsyncStorage.setItem(APPEARANCE_KEY, mode).catch(() => {});
  }, []);

  const setExploreViewMode = useCallback((mode: ExploreViewMode) => {
    setExploreViewModeState(mode);
    AsyncStorage.setItem(EXPLORE_VIEW_KEY, mode).catch(() => {});
  }, []);

  // Itinerary persistence
  useEffect(() => {
    if (loaded) {
      if (itineraryProfile) {
        AsyncStorage.setItem(ITINERARY_PROFILE_KEY, JSON.stringify(itineraryProfile)).catch(() => {});
      }
    }
  }, [itineraryProfile, loaded]);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(CURRENT_ITINERARY_KEY, JSON.stringify(currentItinerary)).catch(() => {});
  }, [currentItinerary, loaded]);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(ITINERARY_HISTORY_KEY, JSON.stringify(itineraryHistory)).catch(() => {});
  }, [itineraryHistory, loaded]);

  const setItineraryProfile = useCallback((profile: ItineraryProfile) => {
    setItineraryProfileState(profile);
  }, []);

  const setCurrentItinerary = useCallback((itinerary: ItineraryDay[]) => {
    setCurrentItineraryState(itinerary);
  }, []);

  const addToItineraryHistory = useCallback((week: ItineraryDay[]) => {
    setItineraryHistoryState((prev) => {
      const next = [...prev, week].slice(-4); // keep last 4 weeks
      return next;
    });
  }, []);

  // Inventory persistence
  useEffect(() => {
    if (loaded) AsyncStorage.setItem(INVENTORY_KEY, JSON.stringify(inventoryItems)).catch(() => {});
  }, [inventoryItems, loaded]);

  useEffect(() => {
    if (loaded && lastScanTimestamp !== null) {
      AsyncStorage.setItem(LAST_SCAN_KEY, String(lastScanTimestamp)).catch(() => {});
    }
  }, [lastScanTimestamp, loaded]);

  const addInventoryItems = useCallback((items: InventoryItem[]) => {
    setInventoryItems((prev) => {
      // Merge: update existing items by name+zone, add new ones
      const updated = [...prev];
      for (const item of items) {
        const existingIdx = updated.findIndex(
          (e) => e.name.toLowerCase() === item.name.toLowerCase() && e.zone === item.zone
        );
        if (existingIdx >= 0) {
          updated[existingIdx] = { ...updated[existingIdx], ...item, quantity: item.quantity };
        } else {
          updated.push(item);
        }
      }
      return updated;
    });
    setLastScanTimestamp(Date.now());
  }, []);

  const removeInventoryItem = useCallback((id: string) => {
    setInventoryItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateInventoryItem = useCallback((id: string, updates: Partial<InventoryItem>) => {
    setInventoryItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...updates } : i))
    );
  }, []);

  const clearInventory = useCallback(() => {
    setInventoryItems([]);
    setLastScanTimestamp(null);
  }, []);

  const clearInventoryZone = useCallback((zone: ScanZone) => {
    setInventoryItems((prev) => prev.filter((i) => i.zone !== zone));
  }, []);

  const toggleSavedCountry = useCallback((id: string) => {
    setSavedCountryIds((prev) => {
      const next = prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id];
      AsyncStorage.setItem(SAVED_COUNTRIES_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const isCountrySaved = useCallback(
    (id: string) => savedCountryIds.includes(id),
    [savedCountryIds]
  );

  const toggleSavedRegion = useCallback((id: string) => {
    setSavedRegionIds((prev) => {
      const next = prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id];
      AsyncStorage.setItem(SAVED_REGIONS_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const isSavedRegion = useCallback(
    (id: string) => savedRegionIds.includes(id),
    [savedRegionIds]
  );

  if (!loaded) return null;

  return (
    <AppContext.Provider
      value={{
        savedRecipeIds,
        toggleSaved,
        isSaved,
        groceryItems,
        addToGrocery,
        toggleGroceryItem,
        removeGroceryItem,
        clearGrocery,
        unexcludeGroceryItem,
        quickAddStaple,
        pantryStaples,
        togglePantryStaple,
        isInKitchen,
        hasSeenWelcome,
        setHasSeenWelcome,
        selectedCountryIds,
        toggleCountrySelection,
        hasCompletedOnboarding,
        setHasCompletedOnboarding,
        cookingLevel,
        setCookingLevel,
        appearanceMode,
        setAppearanceMode,
        exploreViewMode,
        setExploreViewMode,
        savedCountryIds,
        toggleSavedCountry,
        isCountrySaved,
        savedRegionIds,
        toggleSavedRegion,
        isSavedRegion,
        itineraryProfile,
        setItineraryProfile,
        currentItinerary,
        setCurrentItinerary,
        itineraryHistory,
        addToItineraryHistory,
        inventoryItems,
        addInventoryItems,
        removeInventoryItem,
        updateInventoryItem,
        clearInventory,
        clearInventoryZone,
        lastScanTimestamp,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
