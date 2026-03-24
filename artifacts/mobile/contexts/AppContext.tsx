import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import type { GroceryItem, Recipe } from "@/constants/data";
import type { ItineraryProfile, ItineraryDay } from "@/hooks/useItinerary";
import type { GroceryPartner } from "@/constants/partners";

/* ── Cooking Profile Types ─────────────────────────────────── */

export interface CookSession {
  id: string;
  recipeId: string;
  recipeName: string;
  cuisine: string;
  difficulty: string;
  startedAt: string;
  completedAt: string | null;
  totalTime: number;
  rating: number | null;
  feedback: string[];
  stepsCompleted: number;
  totalSteps: number;
}

const LEVEL_THRESHOLDS: { level: number; name: string; recipes: number; cuisines: number }[] = [
  { level: 1, name: "Kitchen Curious", recipes: 0, cuisines: 0 },
  { level: 2, name: "Apprentice", recipes: 3, cuisines: 0 },
  { level: 3, name: "Home Chef", recipes: 10, cuisines: 0 },
  { level: 4, name: "Skilled Cook", recipes: 25, cuisines: 0 },
  { level: 5, name: "Culinary Explorer", recipes: 50, cuisines: 6 },
  { level: 6, name: "Kitchen Master", recipes: 100, cuisines: 8 },
];

function computeLevel(recipesCount: number, cuisinesCount: number) {
  let level = LEVEL_THRESHOLDS[0];
  for (const t of LEVEL_THRESHOLDS) {
    if (recipesCount >= t.recipes && cuisinesCount >= t.cuisines) {
      level = t;
    }
  }
  // Progress to next level
  const nextIdx = LEVEL_THRESHOLDS.findIndex((t) => t.level === level.level + 1);
  let progressToNext = 1;
  if (nextIdx >= 0) {
    const next = LEVEL_THRESHOLDS[nextIdx];
    const recipesNeeded = Math.max(next.recipes - level.recipes, 1);
    const recipeProgress = Math.min((recipesCount - level.recipes) / recipesNeeded, 1);
    progressToNext = recipeProgress;
  }
  return { level: level.level, levelName: level.name, progressToNext };
}

export interface CookingProfile {
  recipesCompleted: string[];
  cuisinesExplored: string[];
  totalCookTime: number;
  sessionsStarted: number;
  sessionsCompleted: number;
  averageRating: number;
  currentLevel: number;
  currentLevelName: string;
  progressToNext: number;
  streakDays: number;
  lastCookDate: string | null;
}

export interface ActiveCookSession {
  recipeId: string;
  recipeName: string;
  currentStep: number;
  totalSteps: number;
  timerRemaining: number | null;
  timerRunning: boolean;
  startedAt: string;
  servings: number;
}

const DEFAULT_COOKING_PROFILE: CookingProfile = {
  recipesCompleted: [],
  cuisinesExplored: [],
  totalCookTime: 0,
  sessionsStarted: 0,
  sessionsCompleted: 0,
  averageRating: 0,
  currentLevel: 1,
  currentLevelName: "Kitchen Curious",
  progressToNext: 0,
  streakDays: 0,
  lastCookDate: null,
};

/** Parse an amount string like "200g", "1 cup", "2 tbsp" into numeric + unit parts */
function parseAmount(raw: string): { quantity: number; unit: string; parsed: boolean } {
  const trimmed = raw.trim();
  const match = trimmed.match(/^(\d+(?:[.,\/]\d+)?)\s*(.*)/);
  if (match) {
    let quantity: number;
    const numStr = match[1];
    if (numStr.includes("/")) {
      const [num, den] = numStr.split("/");
      quantity = parseInt(num, 10) / parseInt(den, 10);
    } else {
      quantity = parseFloat(numStr.replace(",", "."));
    }
    const unit = (match[2] ?? "").trim().toLowerCase();
    if (!isNaN(quantity)) {
      return { quantity, unit, parsed: true };
    }
  }
  return { quantity: 1, unit: "", parsed: false };
}

/** Format a quantity + unit back into a display string */
function formatAmount(quantity: number, unit: string): string {
  const display = Number.isInteger(quantity) ? String(quantity) : quantity.toFixed(1).replace(/\.0$/, "");
  return unit ? `${display} ${unit}` : display;
}
import {
  DEFAULT_PANTRY_STAPLES,
  findMatchingStaple,
  type PantryStaple,
} from "@/constants/pantry";

export type CookingLevel = "beginner" | "intermediate" | "advanced";
export type AppearanceMode = "system" | "light" | "dark";
export type ExploreViewMode = "feed" | "grid";
export type { GroceryPartner };

interface AppContextType {
  savedRecipeIds: string[];
  toggleSaved: (id: string) => void;
  isSaved: (id: string) => boolean;
  groceryItems: GroceryItem[];
  addToGrocery: (recipe: Recipe) => void;
  removeFromGrocery: (recipe: Recipe) => void;
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
  groceryPartner: GroceryPartner;
  setGroceryPartner: (partner: GroceryPartner) => void;
  // Cooking profile
  cookingProfile: CookingProfile;
  cookSessions: CookSession[];
  completeCookSession: (session: CookSession) => void;
  recentCookSessions: CookSession[];
  // Active cook session (resume)
  activeCookSession: ActiveCookSession | null;
  setActiveCookSession: (session: ActiveCookSession | null) => void;
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
const PANTRY_KEY = "@culinary_pantry_staples";
const GROCERY_PARTNER_KEY = "@culinary_grocery_partner";
const COOKING_PROFILE_KEY_V2 = "@culinary_cooking_profile_v2";
const COOK_SESSIONS_KEY = "@culinary_cook_sessions";
const ACTIVE_COOK_SESSION_KEY = "@culinary_active_cook_session";

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
  const [pantryStaples, setPantryStaples] = useState<PantryStaple[]>(DEFAULT_PANTRY_STAPLES);
  const [groceryPartner, setGroceryPartnerState] = useState<GroceryPartner>(null);
  const [cookingProfile, setCookingProfileState] = useState<CookingProfile>(DEFAULT_COOKING_PROFILE);
  const [cookSessions, setCookSessions] = useState<CookSession[]>([]);
  const [activeCookSession, setActiveCookSessionState] = useState<ActiveCookSession | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [saved, grocery, welcome, countries, onboarding, cookLevel, appearance, exploreView, savedCtries, savedRegs, itinProfile, itinCurrent, itinHistory, pantry, groceryPartnerRaw, cookProfileRaw, cookSessionsRaw, activeCookRaw] = await Promise.all([
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
          AsyncStorage.getItem(PANTRY_KEY).catch(() => null),
          AsyncStorage.getItem(GROCERY_PARTNER_KEY).catch(() => null),
          AsyncStorage.getItem(COOKING_PROFILE_KEY_V2).catch(() => null),
          AsyncStorage.getItem(COOK_SESSIONS_KEY).catch(() => null),
          AsyncStorage.getItem(ACTIVE_COOK_SESSION_KEY).catch(() => null),
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
        if (groceryPartnerRaw && ["instacart", "kroger", "walmart", "skip"].includes(groceryPartnerRaw)) {
          setGroceryPartnerState(groceryPartnerRaw as GroceryPartner);
        }
        if (cookProfileRaw) {
          try {
            const parsed = JSON.parse(cookProfileRaw);
            if (parsed && typeof parsed === "object") setCookingProfileState({ ...DEFAULT_COOKING_PROFILE, ...parsed });
          } catch {}
        }
        if (cookSessionsRaw) {
          try {
            const parsed = JSON.parse(cookSessionsRaw);
            if (Array.isArray(parsed)) setCookSessions(parsed);
          } catch {}
        }
        if (activeCookRaw) {
          try {
            const parsed = JSON.parse(activeCookRaw);
            if (parsed && typeof parsed === "object" && parsed.recipeId) setActiveCookSessionState(parsed);
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

  // Cooking profile persistence
  useEffect(() => {
    if (loaded) AsyncStorage.setItem(COOKING_PROFILE_KEY_V2, JSON.stringify(cookingProfile)).catch(() => {});
  }, [cookingProfile, loaded]);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(COOK_SESSIONS_KEY, JSON.stringify(cookSessions)).catch(() => {});
  }, [cookSessions, loaded]);

  useEffect(() => {
    if (!loaded) return;
    if (activeCookSession) {
      AsyncStorage.setItem(ACTIVE_COOK_SESSION_KEY, JSON.stringify(activeCookSession)).catch(() => {});
    } else {
      AsyncStorage.removeItem(ACTIVE_COOK_SESSION_KEY).catch(() => {});
    }
  }, [activeCookSession, loaded]);

  const setActiveCookSession = useCallback((session: ActiveCookSession | null) => {
    setActiveCookSessionState(session);
  }, []);

  const completeCookSession = useCallback((session: CookSession) => {
    setCookSessions((prev) => [session, ...prev].slice(0, 50)); // keep last 50
    setCookingProfileState((prev) => {
      const newCompleted = session.completedAt
        ? [...new Set([...prev.recipesCompleted, session.recipeId])]
        : prev.recipesCompleted;
      const newCuisines = session.cuisine
        ? [...new Set([...prev.cuisinesExplored, session.cuisine])]
        : prev.cuisinesExplored;
      const newTotalTime = prev.totalCookTime + session.totalTime;
      const newSessionsCompleted = session.completedAt ? prev.sessionsCompleted + 1 : prev.sessionsCompleted;
      const newSessionsStarted = prev.sessionsStarted + 1;
      const ratings = [session, ...cookSessions].filter((s) => s.rating != null).map((s) => s.rating!);
      const newAvg = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const lastDate = prev.lastCookDate;
      let newStreak = prev.streakDays;
      if (lastDate) {
        const yd = new Date(Date.now() - 86400000);
        const yesterday = `${yd.getFullYear()}-${String(yd.getMonth() + 1).padStart(2, "0")}-${String(yd.getDate()).padStart(2, "0")}`;
        if (lastDate === today) {
          // same day, no change
        } else if (lastDate === yesterday) {
          newStreak += 1;
        } else {
          newStreak = 1;
        }
      } else {
        newStreak = 1;
      }
      const { level, levelName, progressToNext } = computeLevel(newCompleted.length, newCuisines.length);
      return {
        recipesCompleted: newCompleted,
        cuisinesExplored: newCuisines,
        totalCookTime: newTotalTime,
        sessionsStarted: newSessionsStarted,
        sessionsCompleted: newSessionsCompleted,
        averageRating: newAvg,
        currentLevel: level,
        currentLevelName: levelName,
        progressToNext,
        streakDays: newStreak,
        lastCookDate: today,
      };
    });
  }, [cookSessions]);

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
        const updated = [...prev];
        for (const ing of recipe.ingredients) {
          const normalizedName = ing.name.toLowerCase().trim();
          const stableId = `ingredient-${normalizedName.replace(/[^a-z0-9]+/g, "-")}`;
          // Match by stableId OR normalized name — handles old-format IDs from AsyncStorage
          const existingIdx = updated.findIndex(
            (i) => i.id === stableId || i.name.toLowerCase().trim() === normalizedName
          );

          if (existingIdx >= 0) {
            // Merge into existing — sum amounts and add recipe source
            const existing = updated[existingIdx];
            const names = existing.recipeNames ?? [existing.recipeName];
            if (!names.includes(recipe.name)) {
              const existingParsed = parseAmount(existing.amount);
              const incomingParsed = parseAmount(ing.amount);
              let mergedAmount = existing.amount;
              let mergedQty = (existing.qty ?? 1) + 1;
              // Sum amounts when both have the same unit
              if (
                existingParsed.parsed &&
                incomingParsed.parsed &&
                existingParsed.unit === incomingParsed.unit
              ) {
                mergedAmount = formatAmount(
                  existingParsed.quantity + incomingParsed.quantity,
                  existingParsed.unit
                );
              }
              const mergedNames = [...names, recipe.name];
              updated[existingIdx] = {
                ...existing,
                id: stableId, // Upgrade old-format IDs to stable format
                amount: mergedAmount,
                qty: mergedQty,
                recipeNames: mergedNames,
                recipeName: mergedNames.join(", "),
              };
            }
          } else {
            const matchedStaple = findMatchingStaple(ing.name, pantryStaples);
            const isPantryExcluded = matchedStaple?.inKitchen === true;
            updated.push({
              id: stableId,
              name: ing.name,
              amount: ing.amount,
              checked: false,
              recipeName: recipe.name,
              recipeNames: [recipe.name],
              recipeImage: recipe.image,
              qty: 1,
              tier: (isPantryExcluded ? 1 : 3) as 1 | 3,
              excluded: isPantryExcluded,
              excludeReason: isPantryExcluded ? ("pantry_staple" as const) : null,
            });
          }
        }
        return updated;
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

  const setGroceryPartner = useCallback((partner: GroceryPartner) => {
    setGroceryPartnerState(partner);
    AsyncStorage.setItem(GROCERY_PARTNER_KEY, partner ?? "").catch(() => {});
  }, []);

  const removeFromGrocery = useCallback((recipe: Recipe) => {
    setGroceryItems((prev) => {
      let updated = [...prev];
      for (const ing of recipe.ingredients) {
        const normalizedName = ing.name.toLowerCase().trim();
        const stableId = `ingredient-${normalizedName.replace(/[^a-z0-9]+/g, "-")}`;
        const idx = updated.findIndex(
          (i) => i.id === stableId || i.name.toLowerCase().trim() === normalizedName
        );
        if (idx < 0) continue;
        const item = updated[idx];
        const qty = item.qty ?? 1;
        const recipeNames = (item.recipeNames ?? [item.recipeName]).filter(
          (n) => n !== recipe.name
        );
        if (qty <= 1 || recipeNames.length === 0) {
          updated = updated.filter((_, i) => i !== idx);
        } else {
          updated[idx] = {
            ...item,
            qty: qty - 1,
            recipeNames,
            recipeName: recipeNames.join(", "),
          };
        }
      }
      return updated;
    });
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
        removeFromGrocery,
        groceryPartner,
        setGroceryPartner,
        cookingProfile,
        cookSessions,
        completeCookSession,
        recentCookSessions: cookSessions.filter((s) => s.completedAt).slice(0, 5),
        activeCookSession,
        setActiveCookSession,
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
