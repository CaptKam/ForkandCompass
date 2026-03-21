import { useSearch } from "@workspace/api-client-react";
import { COUNTRIES, getAllRecipes } from "@/constants/data";
import type { Country as LocalCountry, Recipe as LocalRecipe } from "@/constants/data";

type SearchResult =
  | { type: "country"; item: LocalCountry }
  | { type: "recipe"; item: LocalRecipe };

/**
 * Searches countries and recipes via the API,
 * falling back to local search if offline.
 */
export function useSearchRecipes(query: string): {
  results: SearchResult[];
  isLoading: boolean;
  error: unknown;
} {
  const trimmed = query.trim();

  const apiQuery = useSearch({ q: trimmed });

  // If no query, return empty
  if (trimmed.length === 0) {
    return { results: [], isLoading: false, error: null };
  }

  // If API returned data, map to local shapes
  if (apiQuery.data) {
    const results: SearchResult[] = [];

    for (const apiCountry of apiQuery.data.countries) {
      const local = COUNTRIES.find((c) => c.id === apiCountry.id);
      results.push({
        type: "country",
        item: local ?? {
          id: apiCountry.id,
          name: apiCountry.name,
          flag: apiCountry.flag,
          tagline: apiCountry.cuisineLabel,
          description: apiCountry.description,
          region: "",
          image: apiCountry.image,
          heroImage: apiCountry.image,
          recipes: [],
        },
      });
    }

    for (const apiRecipe of apiQuery.data.recipes) {
      const allRecipes = getAllRecipes();
      const local = allRecipes.find((r) => r.id === apiRecipe.id);
      results.push({
        type: "recipe",
        item: local ?? {
          id: apiRecipe.id,
          name: apiRecipe.title,
          countryId: apiRecipe.countryId,
          countryName: "",
          countryFlag: "",
          category: apiRecipe.difficulty,
          time: apiRecipe.prepTime,
          difficulty: apiRecipe.difficulty,
          image: apiRecipe.image,
          description: apiRecipe.description,
          culturalNote: "",
          ingredients: apiRecipe.ingredients,
          steps: apiRecipe.steps,
        },
      });
    }

    return { results, isLoading: false, error: null };
  }

  // Fallback: local search
  const q = trimmed.toLowerCase();
  const results: SearchResult[] = [];

  for (const country of COUNTRIES) {
    if (
      country.name.toLowerCase().includes(q) ||
      country.description.toLowerCase().includes(q) ||
      country.region.toLowerCase().includes(q)
    ) {
      results.push({ type: "country", item: country });
    }
  }

  const allRecipes = getAllRecipes();
  for (const recipe of allRecipes) {
    if (
      recipe.name.toLowerCase().includes(q) ||
      recipe.description.toLowerCase().includes(q) ||
      recipe.category.toLowerCase().includes(q) ||
      recipe.ingredients.some((ing) => ing.name.toLowerCase().includes(q))
    ) {
      results.push({ type: "recipe", item: recipe });
    }
  }

  return {
    results,
    isLoading: apiQuery.isLoading,
    error: apiQuery.error,
  };
}
