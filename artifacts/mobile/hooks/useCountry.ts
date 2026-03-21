import { useGetCountry } from "@workspace/api-client-react";
import { getCountryById } from "@/constants/data";
import type { Country as LocalCountry, Recipe as LocalRecipe } from "@/constants/data";

/**
 * Fetches a single country with its recipes from the API,
 * falling back to hardcoded data if offline.
 */
export function useCountry(id: string): {
  country: (LocalCountry & { recipes: LocalRecipe[] }) | undefined;
  isLoading: boolean;
  error: unknown;
} {
  const query = useGetCountry(id);

  const local = getCountryById(id);

  if (query.data) {
    const apiData = query.data;

    // Map API recipes to local recipe shape
    const recipes: LocalRecipe[] = apiData.recipes.map((r) => {
      // Try to find a matching local recipe for full shape
      const localRecipe = local?.recipes.find((lr) => lr.id === r.id);
      if (localRecipe) {
        return {
          ...localRecipe,
          name: r.title,
          description: r.description,
          image: r.image,
          difficulty: r.difficulty,
        };
      }
      // API-only recipe
      return {
        id: r.id,
        name: r.title,
        countryId: r.countryId,
        countryName: apiData.name,
        countryFlag: apiData.flag,
        category: r.difficulty,
        time: r.prepTime,
        difficulty: r.difficulty,
        image: r.image,
        description: r.description,
        culturalNote: "",
        ingredients: r.ingredients,
        steps: r.steps,
      };
    });

    const country: LocalCountry = local
      ? { ...local, recipes }
      : {
          id: apiData.id,
          name: apiData.name,
          flag: apiData.flag,
          tagline: apiData.cuisineLabel,
          description: apiData.description,
          region: "",
          image: apiData.image,
          heroImage: apiData.image,
          recipes,
        };

    return { country, isLoading: false, error: null };
  }

  // Fallback to hardcoded
  return {
    country: local,
    isLoading: query.isLoading,
    error: query.error,
  };
}
