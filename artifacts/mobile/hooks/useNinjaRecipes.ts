import { useState, useEffect, useRef } from "react";

export interface NinjaRecipe {
  title: string;
  ingredients: string;
  servings: string;
  instructions: string;
}

function getIngredientsList(raw: string): string[] {
  return raw
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
}

export interface NinjaRecipeFormatted {
  title: string;
  ingredients: string[];
  servings: string;
  instructions: string;
}

export function useNinjaRecipes(query: string) {
  const [results, setResults] = useState<NinjaRecipeFormatted[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed) {
      setResults([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/ninja/recipes?query=${encodeURIComponent(trimmed)}`
        );
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data: NinjaRecipe[] = await res.json();
        setResults(
          data.map((r) => ({
            title: r.title,
            ingredients: getIngredientsList(r.ingredients),
            servings: r.servings,
            instructions: r.instructions,
          }))
        );
      } catch (e) {
        setError("Couldn't load recipes right now.");
      } finally {
        setIsLoading(false);
      }
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  return { results, isLoading, error };
}
