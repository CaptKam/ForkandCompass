import { useState, useEffect, useRef } from "react";

export interface RecipeIngredient {
  name: string;
  quantity: number | null;
  unit: string | null;
  preparation: string | null;
}

export interface RecipeIngredientGroup {
  group: string | null;
  ingredients: RecipeIngredient[];
}

export interface RecipeStep {
  step_number: number;
  phase: string;
  text: string;
}

export interface RecipeResult {
  id: string | number;
  title: string;
  description?: string;
  image_url?: string;
  servings?: number;
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  difficulty?: string;
  cuisine?: string;
  dietary_flags?: string[];
  ingredient_groups?: RecipeIngredientGroup[];
  instructions?: RecipeStep[];
  chef_notes?: string[];
  cultural_context?: string;
}

function flatIngredients(groups: RecipeIngredientGroup[] = []): string[] {
  return groups.flatMap((g) =>
    g.ingredients.map((i) => {
      const parts = [
        i.quantity != null ? String(i.quantity) : "",
        i.unit ?? "",
        i.name,
        i.preparation ? `(${i.preparation})` : "",
      ].filter(Boolean);
      return parts.join(" ");
    })
  );
}

export interface RecipeFormatted {
  id: string | number;
  title: string;
  ingredients: string[];
  servings: string;
  instructions: string;
  cuisine?: string;
  difficulty?: string;
  dietary_flags?: string[];
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  image_url?: string;
  chef_notes?: string[];
  cultural_context?: string;
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

        const items: RecipeFormatted[] = (json?.data ?? []).map((r: RecipeResult) => ({
          id: r.id,
          title: r.title,
          ingredients: flatIngredients(r.ingredient_groups),
          servings: r.servings != null ? String(r.servings) : "–",
          instructions: (r.instructions ?? []).map((s) => s.text).join(" "),
          cuisine: r.cuisine,
          difficulty: r.difficulty,
          dietary_flags: r.dietary_flags,
          prep_time_minutes: r.prep_time_minutes,
          cook_time_minutes: r.cook_time_minutes,
          image_url: r.image_url,
          chef_notes: r.chef_notes,
          cultural_context: r.cultural_context,
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
