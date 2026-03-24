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

// Canonical order defined by the local COUNTRIES array
const LOCAL_ORDER = COUNTRIES.map((c) => c.id);

export function useCountries() {
  const { data, isLoading, isError } = useListCountries();

  const countries: Country[] = data && !isError
    ? data
        .map(mapApiCountry)
        .sort((a, b) => {
          const ai = LOCAL_ORDER.indexOf(a.id);
          const bi = LOCAL_ORDER.indexOf(b.id);
          // Unknown countries go to the end
          return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
        })
    : COUNTRIES.map(resolveCountryRecipeImages);

  return { countries, isLoading, isFromApi: !!data && !isError };
}
