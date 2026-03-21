import { useListCountries } from "@workspace/api-client-react";
import { COUNTRIES } from "@/constants/data";
import type { Country as LocalCountry } from "@/constants/data";

/**
 * Fetches countries from the API, falling back to hardcoded data if offline.
 * Returns data in the local Country shape so the rest of the app doesn't change.
 */
export function useCountries(): {
  countries: LocalCountry[];
  isLoading: boolean;
  error: unknown;
} {
  const query = useListCountries();

  // If the API succeeded, merge API data with local data for full shape
  if (query.data && query.data.length > 0) {
    const countries = query.data.map((apiCountry) => {
      const local = COUNTRIES.find((c) => c.id === apiCountry.id);
      if (local) {
        // Overlay API fields onto local data (local has heroImage, recipes, etc.)
        return {
          ...local,
          name: apiCountry.name,
          flag: apiCountry.flag,
          description: apiCountry.description,
          image: apiCountry.image,
        };
      }
      // API-only country — build a minimal local shape
      return {
        id: apiCountry.id,
        name: apiCountry.name,
        flag: apiCountry.flag,
        tagline: apiCountry.cuisineLabel,
        description: apiCountry.description,
        region: "",
        image: apiCountry.image,
        heroImage: apiCountry.image,
        recipes: [],
      } satisfies LocalCountry;
    });

    return { countries, isLoading: false, error: null };
  }

  // Fallback to hardcoded data
  return {
    countries: COUNTRIES,
    isLoading: query.isLoading,
    error: query.error,
  };
}
