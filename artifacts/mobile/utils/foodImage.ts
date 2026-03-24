const cache = new Map<string, string | null>();
const inFlight = new Map<string, Promise<string | null>>();

const STRIP_WORDS = new Set([
  "fresh", "dried", "ground", "whole", "chopped", "sliced", "diced",
  "minced", "grated", "peeled", "frozen", "canned", "large", "small",
  "medium", "fine", "coarse", "raw", "cooked", "boneless", "skinless",
  "extra", "virgin", "organic", "unsalted", "salted", "low", "reduced",
  "light", "heavy", "full", "half", "a", "an", "of", "with", "and",
  "the", "to", "taste", "as", "needed", "or", "more", "less", "about",
  "approximately", "roughly", "finely", "thinly", "thickly", "freshly",
]);

const CORRECTIONS: Record<string, string> = {
  "all-purpose flour": "all-purpose flour",
  "all purpose flour": "flour",
  "plain flour": "flour",
  "bread flour": "flour",
  "self-rising flour": "flour",
  "heavy cream": "heavy cream",
  "heavy whipping cream": "heavy cream",
  "double cream": "clotted cream",
  "tomato paste": "tomato paste",
  "tomato puree": "tomato purée",
  "spring onion": "scallion",
  "spring onions": "scallion",
  "green onion": "scallion",
  "green onions": "scallion",
  "scallions": "scallion",
  "cilantro": "coriander",
  "bell pepper": "bell pepper",
  "capsicum": "bell pepper",
  "stock": "broth",
  "chicken stock": "chicken broth",
  "vegetable stock": "vegetable broth",
  "beef stock": "beef broth",
};

function normalizeForWikipedia(name: string): string {
  const lower = name.toLowerCase().replace(/[()]/g, "").trim();

  if (CORRECTIONS[lower]) return CORRECTIONS[lower];

  const words = lower
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STRIP_WORDS.has(w));

  return words.slice(0, 3).join(" ").trim();
}

async function fetchFromWikipedia(query: string): Promise<string | null> {
  const encoded = encodeURIComponent(query);
  const res = await fetch(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`,
    {
      headers: {
        "Api-User-Agent": "ForkAndCompass/1.0 (culinary travel app)",
      },
    }
  );
  if (!res.ok) return null;
  const data = (await res.json()) as {
    type?: string;
    thumbnail?: { source?: string };
    originalimage?: { source?: string };
  };
  if (data.type === "disambiguation") return null;
  const img =
    data.thumbnail?.source ??
    data.originalimage?.source ??
    null;
  return img && img.startsWith("http") ? img : null;
}

async function fetchFromOpenFoodFacts(query: string): Promise<string | null> {
  const res = await fetch(
    `https://world.openfoodfacts.org/cgi/search.pl` +
    `?action=process&search_terms=${encodeURIComponent(query)}` +
    `&json=1&page_size=5&fields=image_front_small_url`,
    { headers: { "User-Agent": "ForkAndCompass/1.0" } }
  );
  if (!res.ok) return null;
  const data = (await res.json()) as {
    products: { image_front_small_url?: string }[];
  };
  for (const p of data.products ?? []) {
    const img = p.image_front_small_url ?? null;
    if (img && img.startsWith("http")) return img;
  }
  return null;
}

export async function fetchIngredientImage(name: string): Promise<string | null> {
  const key = name.toLowerCase().trim();

  if (cache.has(key)) return cache.get(key)!;
  if (inFlight.has(key)) return inFlight.get(key)!;

  const promise = (async (): Promise<string | null> => {
    try {
      const query = normalizeForWikipedia(name);
      if (!query) return null;

      const wikiImg = await fetchFromWikipedia(query);
      if (wikiImg) {
        cache.set(key, wikiImg);
        return wikiImg;
      }

      const offImg = await fetchFromOpenFoodFacts(query);
      cache.set(key, offImg);
      return offImg;
    } catch {
      cache.set(key, null);
      return null;
    } finally {
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, promise);
  return promise;
}
