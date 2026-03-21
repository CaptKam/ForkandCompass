import { useGetRecipe } from "@workspace/api-client-react";
import { getRecipeById } from "@/constants/data";
import type { Recipe as LocalRecipe } from "@/constants/data";

/**
 * Fetches a single recipe from the API,
 * falling back to hardcoded data if offline.
 */
export function useRecipe(id: string): {
  recipe: LocalRecipe | undefined;
  isLoading: boolean;
  error: unknown;
} {
  const query = useGetRecipe(id);

  const local = getRecipeById(id);

  if (query.data) {
    const r = query.data;
    const recipe: LocalRecipe = local
      ? {
          ...local,
          name: r.title,
          description: r.description,
          image: r.image,
          difficulty: r.difficulty,
        }
      : {
          id: r.id,
          name: r.title,
          countryId: r.countryId,
          countryName: "",
          countryFlag: "",
          category: r.difficulty,
          time: r.prepTime,
          difficulty: r.difficulty,
          image: r.image,
          description: r.description,
          culturalNote: "",
          ingredients: r.ingredients,
          steps: r.steps,
        };

    return { recipe, isLoading: false, error: null };
  }

  return {
    recipe: local,
    isLoading: query.isLoading,
    error: query.error,
  };
}
