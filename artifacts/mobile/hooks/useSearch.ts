import { useSearch as useApiSearch } from "@workspace/api-client-react";
import type {
  Country as ApiCountry,
  Recipe as ApiRecipe,
} from "@workspace/api-client-react";

import { COUNTRIES, getAllRecipes, resolveImageUrl } from "@/constants/data";
import type { Country, Recipe } from "@/constants/data";

export type SearchResultItem =
  | { type: "country"; item: Country }
  | { type: "recipe"; item: Recipe };

function mapApiCountry(apiCountry: ApiCountry): Country {
  const local = COUNTRIES.find((c) => c.id === apiCountry.id);
  return {
    id: apiCountry.id,
    name: apiCountry.name,
    flag: apiCountry.flag,
    tagline: apiCountry.tagline ?? "",
    description: apiCountry.description,
    region: apiCountry.region ?? "",
    image: apiCountry.image,
    heroImage: apiCountry.heroImage ?? apiCountry.image,
    recipes: local?.recipes ?? [],
  };
}

function mapApiRecipe(r: ApiRecipe): Recipe {
  const country = COUNTRIES.find((c) => c.id === r.countryId);
  return {
    id: r.id,
    name: r.title,
    countryId: r.countryId,
    countryName: country?.name ?? "",
    countryFlag: country?.flag ?? "",
    category: r.category ?? "",
    time: r.prepTime ?? "",
    difficulty: r.difficulty,
    image: resolveImageUrl(r.image),
    description: r.description,
    culturalNote: r.culturalNote ?? "",
    ingredients: r.ingredients,
    steps: r.steps,
  };
}

function localSearch(query: string): SearchResultItem[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const results: SearchResultItem[] = [];
  for (const country of COUNTRIES) {
    if (
      country.name.toLowerCase().includes(q) ||
      country.description.toLowerCase().includes(q) ||
      (country.region ?? "").toLowerCase().includes(q)
    ) {
      results.push({ type: "country", item: country });
    }
  }
  for (const recipe of getAllRecipes()) {
    if (
      recipe.name.toLowerCase().includes(q) ||
      recipe.description.toLowerCase().includes(q) ||
      (recipe.category ?? "").toLowerCase().includes(q) ||
      recipe.ingredients.some((ing) => ing.name.toLowerCase().includes(q))
    ) {
      results.push({ type: "recipe", item: recipe });
    }
  }
  return results;
}

export function useSearch(query: string) {
  const trimmed = query.trim();

  const { data, isLoading } = useApiSearch({ q: trimmed });

  const results: SearchResultItem[] =
    trimmed === ""
      ? []
      : data
        ? [
            ...data.countries.map((c) => ({
              type: "country" as const,
              item: mapApiCountry(c),
            })),
            ...data.recipes.map((r) => ({
              type: "recipe" as const,
              item: mapApiRecipe(r),
            })),
          ]
        : localSearch(query);

  return { results, isLoading: isLoading && trimmed.length > 0 };
}
