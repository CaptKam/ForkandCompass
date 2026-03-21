import { useGetCountry } from "@workspace/api-client-react";
import type {
  CountryDetail as ApiCountryDetail,
  Recipe as ApiRecipe,
} from "@workspace/api-client-react";

import { getCountryById } from "@/constants/data";
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
    image: r.image,
    description: r.description,
    culturalNote: r.culturalNote ?? "",
    ingredients: r.ingredients,
    steps: r.steps,
  };
}

function mapApiCountryDetail(data: ApiCountryDetail): Country {
  return {
    id: data.id,
    name: data.name,
    flag: data.flag,
    tagline: data.tagline ?? "",
    description: data.description,
    region: data.region ?? "",
    image: data.image,
    heroImage: data.heroImage ?? data.image,
    recipes: data.recipes.map((r) => mapApiRecipe(r, data.name, data.flag)),
  };
}

export function useCountry(id: string) {
  const fallback = getCountryById(id);

  const { data, isLoading } = useGetCountry(id);

  const country: Country | undefined = data ? mapApiCountryDetail(data) : fallback;

  return { country, isLoading: isLoading && !fallback };
}
