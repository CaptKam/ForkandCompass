import { useListCountries } from "@workspace/api-client-react";
import type { Country as ApiCountry } from "@workspace/api-client-react";

import { COUNTRIES, resolveImageUrl } from "@/constants/data";
import type { Country } from "@/constants/data";

function resolveCountryRecipeImages(country: Country): Country {
  return {
    ...country,
    recipes: country.recipes.map((r) => ({
      ...r,
      image: resolveImageUrl(r.image),
    })),
  };
}

function mapApiCountry(apiCountry: ApiCountry): Country {
  const local = COUNTRIES.find((c) => c.id === apiCountry.id);
  return resolveCountryRecipeImages({
    id: apiCountry.id,
    name: apiCountry.name,
    flag: apiCountry.flag,
    tagline: apiCountry.tagline ?? "",
    description: apiCountry.description,
    region: apiCountry.region ?? "",
    image: apiCountry.image,
    heroImage: apiCountry.heroImage ?? apiCountry.image,
    recipes: local?.recipes ?? [],
  });
}

export function useCountries() {
  const { data, isLoading, isError } = useListCountries();

  const countries: Country[] = data && !isError
    ? data.map(mapApiCountry)
    : COUNTRIES.map(resolveCountryRecipeImages);

  return { countries, isLoading, isFromApi: !!data && !isError };
}
