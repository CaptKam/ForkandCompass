import { useGetRecipe } from "@workspace/api-client-react";
import type { Recipe as ApiRecipe } from "@workspace/api-client-react";

import { getAllRecipes, COUNTRIES } from "@/constants/data";
import type { Recipe } from "@/constants/data";

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
    image: r.image,
    description: r.description,
    culturalNote: r.culturalNote ?? "",
    ingredients: r.ingredients,
    steps: r.steps,
  };
}

export function useRecipe(id: string) {
  const fallback = getAllRecipes().find((r) => r.id === id);

  const { data, isLoading } = useGetRecipe(id);

  const recipe: Recipe | undefined = data ? mapApiRecipe(data) : fallback;

  return { recipe, isLoading: isLoading && !fallback };
}
