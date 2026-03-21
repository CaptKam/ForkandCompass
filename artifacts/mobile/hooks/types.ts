import type {
  Country as ApiCountry,
  CountryDetail as ApiCountryDetail,
  Recipe as ApiRecipe,
  SearchResult as ApiSearchResult,
} from "@workspace/api-client-react";

import {
  COUNTRIES,
  getCountryById,
  getAllRecipes,
  type Country as LocalCountry,
  type Recipe as LocalRecipe,
} from "@/constants/data";

export interface NormalizedIngredient {
  id: string;
  name: string;
  amount: string;
}

export interface NormalizedStep {
  id: string;
  title: string;
  instruction: string;
  materials: string[];
}

export interface NormalizedRecipe {
  id: string;
  name: string;
  title: string;
  countryId: string;
  countryName: string;
  countryFlag: string;
  category: string;
  time: string;
  difficulty: string;
  image: string;
  description: string;
  culturalNote: string;
  ingredients: NormalizedIngredient[];
  steps: NormalizedStep[];
  tips: string[];
}

export interface NormalizedCountry {
  id: string;
  name: string;
  flag: string;
  tagline: string;
  description: string;
  region: string;
  image: string;
  heroImage: string;
  recipes: NormalizedRecipe[];
}

export type NormalizedSearchResult =
  | { type: "country"; item: NormalizedCountry }
  | { type: "recipe"; item: NormalizedRecipe };

export function mapApiRecipe(
  r: ApiRecipe,
  countryName: string,
  countryFlag: string
): NormalizedRecipe {
  return {
    id: r.id,
    name: r.title,
    title: r.title,
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
    tips: r.tips,
  };
}

export function mapApiCountry(c: ApiCountry, recipes: NormalizedRecipe[] = []): NormalizedCountry {
  return {
    id: c.id,
    name: c.name,
    flag: c.flag,
    tagline: c.tagline ?? "",
    description: c.description,
    region: c.region ?? "",
    image: c.image,
    heroImage: c.heroImage ?? c.image,
    recipes,
  };
}

export function mapApiCountryDetail(c: ApiCountryDetail): NormalizedCountry {
  const recipes = c.recipes.map((r) =>
    mapApiRecipe(r, c.name, c.flag)
  );
  return mapApiCountry(c, recipes);
}

export function mapLocalRecipe(r: LocalRecipe): NormalizedRecipe {
  return {
    id: r.id,
    name: r.name,
    title: r.name,
    countryId: r.countryId,
    countryName: r.countryName,
    countryFlag: r.countryFlag,
    category: r.category,
    time: r.time,
    difficulty: r.difficulty,
    image: r.image,
    description: r.description,
    culturalNote: r.culturalNote,
    ingredients: r.ingredients,
    steps: r.steps,
    tips: [],
  };
}

export function mapLocalCountry(c: LocalCountry): NormalizedCountry {
  return {
    id: c.id,
    name: c.name,
    flag: c.flag,
    tagline: c.tagline,
    description: c.description,
    region: c.region,
    image: c.image,
    heroImage: c.heroImage,
    recipes: c.recipes.map(mapLocalRecipe),
  };
}

export function getFallbackCountries(): NormalizedCountry[] {
  return COUNTRIES.map(mapLocalCountry);
}

export function getFallbackCountry(id: string): NormalizedCountry | undefined {
  const c = getCountryById(id);
  return c ? mapLocalCountry(c) : undefined;
}

export function getFallbackAllRecipes(): NormalizedRecipe[] {
  return getAllRecipes().map(mapLocalRecipe);
}

export function mapApiSearchResult(result: ApiSearchResult, allApiCountries: ApiCountry[]): NormalizedSearchResult[] {
  const countryResults: NormalizedSearchResult[] = result.countries.map((c) => ({
    type: "country" as const,
    item: mapApiCountry(c),
  }));

  const countryMap = new Map<string, ApiCountry>(
    allApiCountries.map((c) => [c.id, c])
  );

  const recipeResults: NormalizedSearchResult[] = result.recipes.map((r) => {
    const parent = countryMap.get(r.countryId);
    return {
      type: "recipe" as const,
      item: mapApiRecipe(r, parent?.name ?? "", parent?.flag ?? ""),
    };
  });

  return [...countryResults, ...recipeResults];
}
