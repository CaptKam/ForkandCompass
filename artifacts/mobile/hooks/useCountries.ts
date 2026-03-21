import { useListCountries } from "@workspace/api-client-react";
import type { Country as ApiCountry } from "@workspace/api-client-react";

import { COUNTRIES } from "@/constants/data";
import type { Country } from "@/constants/data";

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

export function useCountries() {
  const { data, isLoading, isError } = useListCountries();

  const countries: Country[] = data && !isError ? data.map(mapApiCountry) : COUNTRIES;

  return { countries, isLoading, isFromApi: !!data && !isError };
}
