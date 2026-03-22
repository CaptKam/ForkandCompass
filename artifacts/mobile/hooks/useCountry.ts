import { useGetCountry } from "@workspace/api-client-react";
import type {
  CountryDetail as ApiCountryDetail,
  Recipe as ApiRecipe,
} from "@workspace/api-client-react";

import { getCountryById, resolveImageUrl } from "@/constants/data";
import type { Country, Recipe } from "@/constants/data";

function mapApiRecipe(
  r: ApiRecipe,
  countryName: string,
  countryFlag: string
): Recipe {
  return {
    id: r.id,
    name: r.title,
    countryId: r.countryId,
    countryName,
    countryFlag,
    category: r.category ?? "",
    time: r.prepTime ?? "",
    difficulty: r.difficulty,
    image: resolveImageUrl(r.image),
    description: r.description,
    culturalNote: r.culturalNote ?? "",
    region: r.region ?? undefined,
    ingredients: r.ingredients,
    steps: r.steps,
  };
}

function mergeRecipes(
  localRecipes: Recipe[],
  apiRecipes: Recipe[]
): Recipe[] {
  // Build a map from API recipes (API data wins when there's an ID collision)
  const apiMap = new Map<string, Recipe>();
  for (const r of apiRecipes) {
    apiMap.set(r.id, r);
  }

  // Start with local recipes, replacing any that exist in the API
  const merged = localRecipes.map((r) => apiMap.get(r.id) ?? r);
  const localIds = new Set(localRecipes.map((r) => r.id));

  // Append API-only recipes (not in local data.ts)
  for (const r of apiRecipes) {
    if (!localIds.has(r.id)) {
      merged.push(r);
    }
  }

  return merged;
}

function mergeWithApiData(local: Country, data: ApiCountryDetail): Country {
  const apiRecipes = data.recipes.map((r) =>
    mapApiRecipe(r, data.name, data.flag)
  );
  return {
    id: data.id,
    name: data.name,
    flag: data.flag,
    tagline: data.tagline ?? "",
    description: data.description,
    region: data.region ?? "",
    image: data.image,
    heroImage: data.heroImage ?? data.image,
    recipes: mergeRecipes(local.recipes, apiRecipes),
  };
}

export function useCountry(id: string) {
  const fallback = getCountryById(id);

  const { data, isLoading } = useGetCountry(id);

  const country: Country | undefined =
    data && fallback
      ? mergeWithApiData(fallback, data)
      : fallback;

  return { country, isLoading: isLoading && !fallback };
}
