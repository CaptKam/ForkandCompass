import { useGetRecipe, getGetRecipeQueryKey } from "@workspace/api-client-react";

import { mapApiRecipe, mapLocalRecipe, type NormalizedRecipe } from "./types";
import { COUNTRIES } from "@/constants/data";

function getFallbackRecipe(id: string): NormalizedRecipe | undefined {
  for (const country of COUNTRIES) {
    const recipe = country.recipes.find((r) => r.id === id);
    if (recipe) return mapLocalRecipe(recipe);
  }
  return undefined;
}

export function useRecipe(id: string | undefined): {
  recipe: NormalizedRecipe | undefined;
  isLoading: boolean;
  isFromApi: boolean;
} {
  const { data, isLoading, isError } = useGetRecipe(id ?? "", {
    query: { queryKey: getGetRecipeQueryKey(id ?? ""), enabled: Boolean(id) },
  });

  if (data && !isError) {
    const parent = COUNTRIES.find((c) => c.id === data.countryId);
    return {
      recipe: mapApiRecipe(data, parent?.name ?? "", parent?.flag ?? ""),
      isLoading,
      isFromApi: true,
    };
  }

  return {
    recipe: id ? getFallbackRecipe(id) : undefined,
    isLoading: false,
    isFromApi: false,
  };
}
