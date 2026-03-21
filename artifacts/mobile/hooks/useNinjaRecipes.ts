import { useState, useEffect, useRef } from "react";

export interface RecipeMeta {
  active_time?: string;
  passive_time?: string;
  total_time?: string;
  yields?: string;
  yield_count?: number;
}

export interface RecipeDietary {
  flags?: string[];
  not_suitable_for?: string[];
}

export interface RecipeNutritionSummary {
  calories?: number;
  protein_g?: number;
  carbohydrates_g?: number;
  fat_g?: number;
}

export interface RecipeListItem {
  id: string;
  name: string;
  description?: string;
  category?: string;
  cuisine?: string;
  difficulty?: string;
  tags?: string[];
  meta?: RecipeMeta;
  dietary?: RecipeDietary;
  nutrition_summary?: RecipeNutritionSummary;
}

/** Parse ISO 8601 duration like "PT15M", "PT1H30M" → "15 min" / "1h 30min" */
function parseDuration(iso?: string): string | null {
  if (!iso) return null;
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return null;
  const h = match[1] ? parseInt(match[1]) : 0;
  const m = match[2] ? parseInt(match[2]) : 0;
  if (h > 0 && m > 0) return `${h}h ${m}min`;
  if (h > 0) return `${h}h`;
  if (m > 0) return `${m} min`;
  return null;
}

export interface RecipeFormatted {
  id: string;
  title: string;
  servings: string;
  cuisine?: string;
  difficulty?: string;
  dietary_flags?: string[];
  not_suitable_for?: string[];
  tags?: string[];
  active_time?: string | null;
  total_time?: string | null;
  description?: string;
  calories?: number;
}

export function useNinjaRecipes(query: string) {
  const [results, setResults] = useState<RecipeFormatted[]>([]);
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
        const json = await res.json();

        const items: RecipeFormatted[] = (json?.data ?? []).map((r: RecipeListItem) => ({
          id: r.id,
          title: r.name,
          servings: r.meta?.yields ?? (r.meta?.yield_count ? `${r.meta.yield_count} servings` : "–"),
          cuisine: r.cuisine,
          difficulty: r.difficulty,
          dietary_flags: r.dietary?.flags ?? [],
          not_suitable_for: r.dietary?.not_suitable_for ?? [],
          tags: r.tags ?? [],
          active_time: parseDuration(r.meta?.active_time),
          total_time: parseDuration(r.meta?.total_time),
          description: r.description,
          calories: r.nutrition_summary?.calories,
        }));

        setResults(items);
      } catch {
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
