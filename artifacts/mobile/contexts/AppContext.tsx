import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import type { GroceryItem, Recipe } from "@/constants/data";

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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const SAVED_KEY = "@culinary_saved";
const GROCERY_KEY = "@culinary_grocery";
const WELCOME_KEY = "@culinary_welcome";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [savedRecipeIds, setSavedRecipeIds] = useState<string[]>([]);
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>([]);
  const [hasSeenWelcome, setHasSeenWelcomeState] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [saved, grocery, welcome] = await Promise.all([
          AsyncStorage.getItem(SAVED_KEY).catch(() => null),
          AsyncStorage.getItem(GROCERY_KEY).catch(() => null),
          AsyncStorage.getItem(WELCOME_KEY).catch(() => null),
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
    AsyncStorage.setItem(WELCOME_KEY, v ? "true" : "false");
  }, []);

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
