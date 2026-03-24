const cache = new Map<string, string | null>();
const inFlight = new Map<string, Promise<string | null>>();

const STOP_WORDS = new Set([
  "fresh", "dried", "ground", "whole", "chopped", "sliced", "diced",
  "minced", "grated", "peeled", "frozen", "canned", "large", "small",
  "medium", "fine", "coarse", "raw", "cooked", "boneless", "skinless",
  "extra", "virgin", "organic", "unsalted", "salted", "low", "fat",
  "reduced", "light", "heavy", "full", "half", "a", "an", "of", "with",
]);

function normalizeForSearch(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w))
    .slice(0, 3)
    .join(" ")
    .trim();
}

export async function fetchIngredientImage(name: string): Promise<string | null> {
  const key = name.toLowerCase().trim();

  if (cache.has(key)) return cache.get(key)!;

  if (inFlight.has(key)) return inFlight.get(key)!;

  const promise = (async (): Promise<string | null> => {
    try {
      const query = normalizeForSearch(name);
      if (!query) return null;

      const url =
        `https://world.openfoodfacts.org/cgi/search.pl` +
        `?action=process&search_terms=${encodeURIComponent(query)}` +
        `&json=1&page_size=5&fields=image_front_small_url,image_url,product_name`;

      const res = await fetch(url, {
        headers: { "User-Agent": "ForkAndCompass/1.0 (culinary travel app)" },
      });

      if (!res.ok) {
        cache.set(key, null);
        return null;
      }

      const data = (await res.json()) as {
        products: { image_front_small_url?: string; image_url?: string }[];
      };

      const products = data.products ?? [];
      for (const p of products) {
        const img = p.image_front_small_url ?? p.image_url ?? null;
        if (img && img.startsWith("http")) {
          cache.set(key, img);
          return img;
        }
      }

      cache.set(key, null);
      return null;
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
