import { useSearch as useApiSearch, useListCountries, getSearchQueryKey } from "@workspace/api-client-react";

import {
  mapApiSearchResult,
  mapLocalRecipe,
  mapLocalCountry,
  getFallbackCountries,
  getFallbackAllRecipes,
  type NormalizedSearchResult,
} from "./types";
import { COUNTRIES, getAllRecipes } from "@/constants/data";

function searchLocal(query: string): NormalizedSearchResult[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const results: NormalizedSearchResult[] = [];

  for (const country of COUNTRIES) {
    if (
      country.name.toLowerCase().includes(q) ||
      country.description.toLowerCase().includes(q) ||
      country.region.toLowerCase().includes(q)
    ) {
      results.push({ type: "country", item: mapLocalCountry(country) });
    }
  }

  for (const recipe of getAllRecipes()) {
    if (
      recipe.name.toLowerCase().includes(q) ||
      recipe.description.toLowerCase().includes(q) ||
      recipe.category.toLowerCase().includes(q) ||
      recipe.ingredients.some((ing) => ing.name.toLowerCase().includes(q))
    ) {
      results.push({ type: "recipe", item: mapLocalRecipe(recipe) });
    }
  }

  return results;
}

export function useSearch(query: string): {
  results: NormalizedSearchResult[];
  isLoading: boolean;
  isFromApi: boolean;
} {
  const trimmed = query.trim();

  const { data: countriesData } = useListCountries();

  const { data, isLoading, isError } = useApiSearch(
    { q: trimmed },
    { query: { queryKey: getSearchQueryKey({ q: trimmed }), enabled: trimmed.length > 0 } }
  );

  if (trimmed.length === 0) {
    return { results: [], isLoading: false, isFromApi: false };
  }

  if (data && !isError) {
    const allApiCountries = countriesData ?? [];
    return {
      results: mapApiSearchResult(data, allApiCountries),
      isLoading,
      isFromApi: true,
    };
  }

  return {
    results: searchLocal(trimmed),
    isLoading: false,
    isFromApi: false,
  };
}
