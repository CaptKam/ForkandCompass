import AsyncStorage from "@react-native-async-storage/async-storage";
import type { GroceryItem } from "@/constants/data";

const API_BASE = "/api";
const CACHE_PREFIX = "@off_product_";
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface OFFProduct {
  barcode: string;
  name: string | null;
  brand: string | null;
  imageUrl: string | null;
  imageSmallUrl: string | null;
  categories: string[];
  quantity: string | null;
}

interface CachedProduct {
  product: OFFProduct;
  cachedAt: number;
}

/** Look up a product by barcode, checking local cache first */
export async function lookupBarcode(barcode: string): Promise<OFFProduct | null> {
  // Check cache
  try {
    const cached = await AsyncStorage.getItem(`${CACHE_PREFIX}${barcode}`);
    if (cached) {
      const parsed = JSON.parse(cached) as CachedProduct;
      if (Date.now() - parsed.cachedAt < CACHE_TTL_MS) {
        return parsed.product;
      }
    }
  } catch {
    // Cache miss — continue to network
  }

  try {
    const res = await fetch(`${API_BASE}/off/product/${encodeURIComponent(barcode)}`);
    if (!res.ok) return null;

    const product = (await res.json()) as OFFProduct;

    // Cache the result
    try {
      await AsyncStorage.setItem(
        `${CACHE_PREFIX}${barcode}`,
        JSON.stringify({ product, cachedAt: Date.now() }),
      );
    } catch {
      // Cache write failure is non-critical
    }

    return product;
  } catch {
    return null;
  }
}

/** Match a scanned product to an item in the grocery list */
export function matchProductToGrocery(
  product: OFFProduct,
  groceryItems: GroceryItem[],
): GroceryItem | null {
  const productName = (product.name ?? "").toLowerCase();
  const brandName = (product.brand ?? "").toLowerCase();
  const combined = `${brandName} ${productName}`.trim();

  // Only match unchecked items
  const candidates = groceryItems.filter((i) => !i.checked);

  // 1. Direct substring match on ingredient name
  for (const item of candidates) {
    const normalizedIngredient = item.name.toLowerCase();
    if (
      combined.includes(normalizedIngredient) ||
      normalizedIngredient.includes(productName)
    ) {
      return item;
    }
  }

  // 2. Category match (e.g. "en:soy-sauces" → "soy sauce")
  for (const item of candidates) {
    const normalizedIngredient = item.name.toLowerCase();
    for (const cat of product.categories) {
      const normalizedCat = cat
        .replace(/^en:/, "")
        .replace(/-/g, " ");
      if (normalizedCat.includes(normalizedIngredient)) {
        return item;
      }
    }
  }

  // 3. Word-overlap match — check if significant words overlap
  const productWords = combined
    .split(/\s+/)
    .filter((w) => w.length > 2);
  for (const item of candidates) {
    const ingredientWords = item.name
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2);
    const overlap = ingredientWords.filter((w) =>
      productWords.some((pw) => pw.includes(w) || w.includes(pw)),
    );
    if (overlap.length > 0 && overlap.length >= ingredientWords.length * 0.5) {
      return item;
    }
  }

  return null;
}
