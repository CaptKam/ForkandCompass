import ingredientImages from "@/constants/ingredientImages.json";

const STATIC_MAP = ingredientImages as Record<string, string>;

const runtimeCache = new Map<string, string | null>();
const inFlight = new Map<string, Promise<string | null>>();

const STRIP_WORDS = new Set([
  "fresh", "dried", "ground", "whole", "chopped", "sliced", "diced",
  "minced", "grated", "peeled", "frozen", "canned", "large", "small",
  "medium", "fine", "coarse", "raw", "cooked", "boneless", "skinless",
  "extra", "virgin", "organic", "unsalted", "salted", "low", "reduced",
  "light", "heavy", "full", "half", "a", "an", "of", "with", "and",
  "the", "to", "taste", "as", "needed", "or", "more", "less", "about",
  "freshly", "thinly", "thickly", "finely", "roughly", "approximately",
]);

function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/[()'']/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STRIP_WORDS.has(w))
    .slice(0, 4)
    .join(" ")
    .trim();
}

function lookupStatic(name: string): string | null {
  const lower = name.toLowerCase().trim();

  // Exact match
  if (STATIC_MAP[lower]) return STATIC_MAP[lower];

  // Normalized match
  const norm = normalize(name);
  if (norm && STATIC_MAP[norm]) return STATIC_MAP[norm];

  // Partial prefix match (e.g. "yellow onion" → "onion")
  const words = norm.split(" ");
  for (let len = words.length - 1; len >= 1; len--) {
    const partial = words.slice(-len).join(" ");
    if (STATIC_MAP[partial]) return STATIC_MAP[partial];
  }

  return null;
}

async function fetchFromWikipedia(query: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`,
      { headers: { "Api-User-Agent": "ForkAndCompass/1.0" } }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      type?: string;
      thumbnail?: { source?: string };
    };
    if (data.type === "disambiguation") return null;
    const img = data.thumbnail?.source ?? null;
    return img && img.startsWith("http") ? img : null;
  } catch {
    return null;
  }
}

export async function fetchIngredientImage(name: string): Promise<string | null> {
  const key = name.toLowerCase().trim();

  // 1. Static map — instant, no network
  const staticUrl = lookupStatic(name);
  if (staticUrl) return staticUrl;

  // 2. Runtime cache for live lookups
  if (runtimeCache.has(key)) return runtimeCache.get(key)!;
  if (inFlight.has(key)) return inFlight.get(key)!;

  const promise = (async (): Promise<string | null> => {
    try {
      const norm = normalize(name);
      const wikiImg = norm ? await fetchFromWikipedia(norm) : null;
      runtimeCache.set(key, wikiImg);
      return wikiImg;
    } catch {
      runtimeCache.set(key, null);
      return null;
    } finally {
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, promise);
  return promise;
}
