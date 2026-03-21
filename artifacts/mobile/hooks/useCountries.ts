import { useListCountries } from "@workspace/api-client-react";

import {
  mapApiCountry,
  getFallbackCountries,
  type NormalizedCountry,
} from "./types";

export function useCountries(): {
  countries: NormalizedCountry[];
  isLoading: boolean;
  isFromApi: boolean;
} {
  const { data, isLoading, isError } = useListCountries();

  if (data && !isError) {
    return {
      countries: data.map((c) => mapApiCountry(c)),
      isLoading,
      isFromApi: true,
    };
  }

  return {
    countries: getFallbackCountries(),
    isLoading: false,
    isFromApi: false,
  };
}
