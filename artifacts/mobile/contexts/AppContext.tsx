import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import type { GroceryItem, Recipe } from "@/constants/data";

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
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [saved, grocery, welcome, countries, onboarding, cookLevel, appearance, exploreView, savedCtries] = await Promise.all([
          AsyncStorage.getItem(SAVED_KEY).catch(() => null),
          AsyncStorage.getItem(GROCERY_KEY).catch(() => null),
          AsyncStorage.getItem(WELCOME_KEY).catch(() => null),
          AsyncStorage.getItem(SELECTED_COUNTRIES_KEY).catch(() => null),
          AsyncStorage.getItem(ONBOARDING_KEY).catch(() => null),
          AsyncStorage.getItem(COOKING_LEVEL_KEY).catch(() => null),
          AsyncStorage.getItem(APPEARANCE_KEY).catch(() => null),
          AsyncStorage.getItem(EXPLORE_VIEW_KEY).catch(() => null),
          AsyncStorage.getItem(SAVED_COUNTRIES_KEY).catch(() => null),
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

  const toggleSaved = useCallback((id: string) => {
    setSavedRecipeIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }, []);

  const isSaved = useCallback(
    (id: string) => savedRecipeIds.includes(id),
    [savedRecipeIds]
  );

  const addToGrocery = useCallback((recipe: Recipe) => {
    setGroceryItems((prev) => {
      const existingIds = new Set(prev.map((i) => i.id));
      const newItems = recipe.ingredients
        .filter((ing) => !existingIds.has(`${recipe.id}-${ing.id}`))
        .map((ing) => ({
          id: `${recipe.id}-${ing.id}`,
          name: ing.name,
          amount: ing.amount,
          checked: false,
          recipeName: recipe.name,
        }));
      return [...prev, ...newItems];
    });
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
