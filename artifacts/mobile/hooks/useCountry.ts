import { useGetCountry, getGetCountryQueryKey } from "@workspace/api-client-react";

import {
  mapApiCountryDetail,
  getFallbackCountry,
  type NormalizedCountry,
} from "./types";

export function useCountry(id: string | undefined): {
  country: NormalizedCountry | undefined;
  isLoading: boolean;
  isFromApi: boolean;
} {
  const { data, isLoading, isError } = useGetCountry(id ?? "", {
    query: { queryKey: getGetCountryQueryKey(id ?? ""), enabled: Boolean(id) },
  });

  if (data && !isError) {
    return {
      country: mapApiCountryDetail(data),
      isLoading,
      isFromApi: true,
    };
  }

  return {
    country: id ? getFallbackCountry(id) : undefined,
    isLoading: false,
    isFromApi: false,
  };
}
