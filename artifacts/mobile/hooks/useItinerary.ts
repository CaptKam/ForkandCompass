import { COUNTRIES, getRecipeById, type Country, type Recipe } from "@/constants/data";

export interface ItineraryProfile {
  cookingDays: 3 | 5 | 7;
  timePreference: "quick" | "moderate" | "relaxed";
  adventurousness: "familiar" | "mixed" | "surprise";
  defaultServings: number;
}

export interface ItineraryDay {
  id: string;
  date: string;
  dayLabel: string;
  countryId: string;
  regionId: string;
  quickRecipeIds: string[];
  fullRecipeIds: string[];
  extraRecipeIds?: string[];  // User-added courses (appetizer, dessert, drink)
                              // These are in addition to quickRecipeIds/fullRecipeIds
                              // and are always shown regardless of mode
  mode: "quick" | "full";
  status: "active" | "skipped" | "completed";
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function parseTimeMinutes(time: string): number {
  if (!time) return 0;
  const lower = time.toLowerCase();
  let total = 0;

  // Match days: "2 day", "2 days"
  const dayMatch = lower.match(/(\d+)\s*day/);
  if (dayMatch) total += parseInt(dayMatch[1]) * 1440;

  // Match hours: "2 hr", "2 hrs", "2 hour", "2 hours"
  const hrMatch = lower.match(/(\d+)\s*h/);
  if (hrMatch) total += parseInt(hrMatch[1]) * 60;

  // Match minutes: "40 min", "40 mins", "40 minutes"
  const minMatch = lower.match(/(\d+)\s*m(?!o)/); // exclude "month"
  if (minMatch) total += parseInt(minMatch[1]);

  // Fallback: plain number
  if (total === 0) {
    const numMatch = lower.match(/(\d+)/);
    if (numMatch) total = parseInt(numMatch[1]);
  }

  return total;
}

function filterByTime(recipes: Recipe[], preference: "quick" | "moderate" | "relaxed"): Recipe[] {
  if (preference === "relaxed") return recipes;
  const maxMin = preference === "quick" ? 45 : 90; // quick = under 45min, moderate = under 90min
  const filtered = recipes.filter((r) => parseTimeMinutes(r.time) <= maxMin);
  // Fallback: if too few recipes pass the filter, return all
  return filtered.length >= 2 ? filtered : recipes;
}

/**
 * Canonical course eating order used to sort recipes for display.
 * Appetizers / starters come first, then main courses.
 * Categories not listed here sort to the end.
 */
const COURSE_ORDER: Record<string, number> = {
  appetizer: 0,
  soup: 1,
  salad: 2,
  "side dish": 3,
  "baked good": 4,
  lunch: 5,
  brunch: 5,
  "main course": 6,
  dessert: 7,
  beverage: 8,
  condiment: 9,
  base: 9,
  preserve: 9,
};

/** Sort recipe IDs so courses appear in eating order (appetizer → main → dessert) */
function sortByEatingOrder(ids: string[]): string[] {
  return [...ids].sort((a, b) => {
    const ra = getRecipeById(a);
    const rb = getRecipeById(b);
    const oa = COURSE_ORDER[ra?.category.toLowerCase() ?? ""] ?? 6;
    const ob = COURSE_ORDER[rb?.category.toLowerCase() ?? ""] ?? 6;
    return oa - ob;
  });
}

function pickRecipesForDay(
  country: Country,
  preference: "quick" | "moderate" | "relaxed",
  avoidRecipeIds?: string[]
): { quickRecipeIds: string[]; fullRecipeIds: string[] } {
  const allRecipes = country.recipes;
  let filtered = filterByTime(allRecipes, preference);

  // Avoid recipes already used on other days this week
  if (avoidRecipeIds?.length) {
    const notUsed = filtered.filter((r) => !avoidRecipeIds.includes(r.id));
    if (notUsed.length >= 2) filtered = notUsed;
  }

  // Shuffle so different days get different recipes from the same country
  filtered = shuffle(filtered);

  const findByCategory = (recipes: Recipe[], keywords: string[]): Recipe | undefined => {
    return recipes.find((r) => {
      const cat = r.category.toLowerCase();
      return keywords.some((kw) => cat.includes(kw));
    });
  };

  // Pick a main course
  const main = findByCategory(filtered, ["main", "pasta", "curry", "stew", "pork", "chicken", "beef", "fish", "rice"])
    || filtered[0];

  // Pick an appetizer / starter — try filtered first, then all recipes
  const remaining = filtered.filter((r) => r.id !== main?.id);
  const allRemaining = allRecipes.filter((r) => r.id !== main?.id);
  const starterPool = remaining.length > 0 ? remaining : allRemaining;
  const appetizer = findByCategory(starterPool, ["appetizer"])
    || findByCategory(starterPool, ["soup"])
    || findByCategory(starterPool, ["salad"])
    || findByCategory(starterPool, ["side"])
    || starterPool[0];

  // Quick: appetizer first, then main (eating order)
  const quickIds = [appetizer?.id, main?.id].filter(Boolean) as string[];

  // Full: all recipes from this country, sorted by eating order
  const fullIds = sortByEatingOrder(allRecipes.map((r) => r.id));

  return { quickRecipeIds: quickIds, fullRecipeIds: fullIds };
}

export function generateItinerary(
  profile: ItineraryProfile,
  selectedCountryIds: string[],
  history?: ItineraryDay[][],
  useSavedRecipeIds?: string[],
  targetMonday?: Date
): ItineraryDay[] {
  // 0. If using saved recipes only, build a country pool from those recipes
  const savedRecipeCountryIds = useSavedRecipeIds?.length
    ? [...new Set(useSavedRecipeIds.map(id => {
        const r = getRecipeById(id);
        return r?.countryId;
      }).filter(Boolean) as string[])]
    : null;

  // 1. Build country pool
  let countryPool: Country[];
  const allCountries = COUNTRIES;

  if (savedRecipeCountryIds) {
    // When using saved recipes, only use countries that have saved recipes
    countryPool = allCountries.filter((c) => savedRecipeCountryIds.includes(c.id));
  } else if (profile.adventurousness === "familiar") {
    countryPool = allCountries.filter((c) => selectedCountryIds.includes(c.id));
  } else if (profile.adventurousness === "mixed") {
    const familiar = allCountries.filter((c) => selectedCountryIds.includes(c.id));
    const others = shuffle(allCountries.filter((c) => !selectedCountryIds.includes(c.id)));
    const extraCount = Math.max(1, Math.ceil(others.length * 0.3));
    countryPool = [...familiar, ...others.slice(0, extraCount)];
  } else {
    countryPool = [...allCountries];
  }

  // Fallback
  if (countryPool.length === 0) countryPool = [...allCountries];

  // 2. Get history country IDs to avoid
  const historyCountryIds = new Set(
    (history || []).flat().map((d) => d.countryId)
  );

  // 3. Pick N countries, no back-to-back repeats
  const shuffled = shuffle(countryPool);
  // Prefer non-history countries first
  const preferred = shuffled.filter((c) => !historyCountryIds.has(c.id));
  const fallback = shuffled.filter((c) => historyCountryIds.has(c.id));
  const ordered = [...preferred, ...fallback];

  const pickedCountries: Country[] = [];
  let pool = [...ordered];

  for (let i = 0; i < profile.cookingDays; i++) {
    const lastCountryId = pickedCountries[pickedCountries.length - 1]?.id;
    const candidate = pool.find((c) => c.id !== lastCountryId)
      || pool[0]
      || ordered[i % ordered.length];
    pickedCountries.push(candidate);
    pool = pool.filter((c) => c.id !== candidate.id);
    if (pool.length === 0) pool = shuffle([...ordered]);
  }

  // 4. Map to weekday indices
  let dayIndices: number[];
  if (profile.cookingDays === 3) {
    dayIndices = [0, 2, 4]; // Mon, Wed, Fri
  } else if (profile.cookingDays === 5) {
    dayIndices = [0, 1, 2, 3, 4]; // Mon-Fri
  } else {
    dayIndices = [0, 1, 2, 3, 4, 5, 6]; // Mon-Sun
  }

  // 5. Calculate dates — use targetMonday if provided, otherwise smart Monday selection
  let monday: Date;
  if (targetMonday) {
    monday = targetMonday;
  } else {
    const todayDow = new Date().getDay();
    const useNextWeek = todayDow === 0 || todayDow >= 4;
    monday = getMonday(new Date());
    if (useNextWeek) monday.setDate(monday.getDate() + 7);
  }

  // 6. Build itinerary days — track used recipes to avoid repeats
  const usedRecipeIds: string[] = [];
  const days: ItineraryDay[] = pickedCountries.map((country, i) => {
    const dayIdx = dayIndices[i];
    const date = new Date(monday);
    date.setDate(monday.getDate() + dayIdx);

    let { quickRecipeIds, fullRecipeIds } = pickRecipesForDay(country, profile.timePreference, usedRecipeIds);
    usedRecipeIds.push(...quickRecipeIds);

    // When using saved recipes, filter to only include saved ones
    if (useSavedRecipeIds?.length) {
      quickRecipeIds = quickRecipeIds.filter(id => useSavedRecipeIds.includes(id));
      fullRecipeIds = fullRecipeIds.filter(id => useSavedRecipeIds.includes(id));
      // Ensure at least one recipe per day from saved pool
      if (quickRecipeIds.length === 0) {
        const countrySaved = country.recipes.filter(r => useSavedRecipeIds.includes(r.id));
        if (countrySaved.length > 0) quickRecipeIds = [countrySaved[0].id];
      }
    }

    return {
      id: `${toISODate(date)}-${country.id}`,
      date: toISODate(date),
      dayLabel: DAY_LABELS[dayIdx],
      countryId: country.id,
      regionId: country.region.toLowerCase().replace(/\s+/g, "-"),
      quickRecipeIds,
      fullRecipeIds,
      mode: "quick" as const,
      status: "active" as const,
    };
  });

  return days;
}

export function reloadDay(
  day: ItineraryDay,
  currentItinerary: ItineraryDay[],
  profile: ItineraryProfile,
  selectedCountryIds: string[]
): ItineraryDay {
  const dayIndex = currentItinerary.findIndex((d) => d.id === day.id);
  const adjacentIds = new Set<string>();
  if (dayIndex > 0) adjacentIds.add(currentItinerary[dayIndex - 1].countryId);
  if (dayIndex < currentItinerary.length - 1) adjacentIds.add(currentItinerary[dayIndex + 1].countryId);
  adjacentIds.add(day.countryId); // also avoid current

  // Build pool
  let pool: Country[];
  if (profile.adventurousness === "familiar") {
    pool = COUNTRIES.filter((c) => selectedCountryIds.includes(c.id));
  } else if (profile.adventurousness === "mixed") {
    const familiar = COUNTRIES.filter((c) => selectedCountryIds.includes(c.id));
    const others = shuffle(COUNTRIES.filter((c) => !selectedCountryIds.includes(c.id)));
    pool = [...familiar, ...others.slice(0, Math.ceil(others.length * 0.3))];
  } else {
    pool = [...COUNTRIES];
  }
  if (pool.length === 0) pool = [...COUNTRIES];

  // Pick a different country
  const candidates = shuffle(pool).filter((c) => !adjacentIds.has(c.id));
  const country = candidates[0] || shuffle(pool)[0];

  const { quickRecipeIds, fullRecipeIds } = pickRecipesForDay(country, profile.timePreference);

  return {
    ...day,
    countryId: country.id,
    regionId: country.region.toLowerCase().replace(/\s+/g, "-"),
    quickRecipeIds,
    fullRecipeIds,
    status: "active",
  };
}
