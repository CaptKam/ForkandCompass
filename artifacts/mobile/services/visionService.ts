/**
 * Vision Service — Uses Google Cloud Vision API to detect grocery/kitchen items
 * from camera frames captured during scanning.
 *
 * Uses label detection, logo detection, and object localization for fast,
 * accurate product identification without prompt engineering.
 */

import type { DetectedItem, ScanZone } from "@/constants/inventory";
import { productCatalog } from "./productCatalog";

const VISION_API_URL = "https://vision.googleapis.com/v1/images:annotate";

/** Minimum confidence to keep a detection */
const CONFIDENCE_THRESHOLD = 0.6;

/** Max labels / objects to request per feature */
const MAX_RESULTS = 20;

// Pull from Expo env (set via .env or app.config)
function getApiKey(): string | null {
  if (typeof process === "undefined") return null;
  const key = (process.env as Record<string, string | undefined>)
    ?.EXPO_PUBLIC_GOOGLE_CLOUD_VISION_API_KEY;
  return key ?? null;
}

/** Category mapping based on common label keywords */
function guessCategory(
  label: string,
): "produce" | "protein" | "dairy" | "pantry" | "spice" | "beverage" | "condiment" | "frozen" | null {
  const l = label.toLowerCase();
  if (/milk|cheese|yogurt|butter|cream/.test(l)) return "dairy";
  if (/juice|soda|cola|water|beer|wine|coffee|tea|drink|beverage/.test(l)) return "beverage";
  if (/fruit|vegetable|apple|banana|tomato|lettuce|onion|potato|carrot|pepper/.test(l)) return "produce";
  if (/chicken|beef|pork|fish|meat|salmon|shrimp|turkey|bacon|sausage/.test(l)) return "protein";
  if (/sauce|ketchup|mustard|mayo|dressing|vinegar|salsa/.test(l)) return "condiment";
  if (/spice|cinnamon|pepper|oregano|basil|cumin|paprika|turmeric/.test(l)) return "spice";
  if (/frozen|ice cream/.test(l)) return "frozen";
  if (/rice|pasta|flour|sugar|cereal|bread|crackers|chips|cookie|can|soup/.test(l)) return "pantry";
  return null;
}

/** Guess container type from label */
function guessUnit(label: string): string | null {
  const l = label.toLowerCase();
  if (/can/.test(l)) return "can";
  if (/bottle/.test(l)) return "bottle";
  if (/jar/.test(l)) return "jar";
  if (/bag/.test(l)) return "bag";
  if (/box|carton/.test(l)) return "box";
  return null;
}

interface GCVAnnotateResponse {
  responses: {
    localizedObjectAnnotations?: {
      name: string;
      score: number;
      boundingPoly: {
        normalizedVertices: { x: number; y: number }[];
      };
    }[];
    labelAnnotations?: {
      description: string;
      score: number;
    }[];
    logoAnnotations?: {
      description: string;
      score: number;
      boundingPoly?: {
        normalizedVertices?: { x: number; y: number }[];
      };
    }[];
    error?: { code: number; message: string };
  }[];
}

/**
 * Convert Google Cloud Vision's normalizedVertices (4 corners) into
 * a simple {x, y, width, height} bounding box.
 */
function verticesToBox(vertices: { x: number; y: number }[]): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  if (!vertices || vertices.length === 0) {
    return { x: 0, y: 0, width: 1, height: 1 };
  }
  const xs = vertices.map((v) => v.x ?? 0);
  const ys = vertices.map((v) => v.y ?? 0);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return {
    x: minX,
    y: minY,
    width: Math.max(...xs) - minX,
    height: Math.max(...ys) - minY,
  };
}

/**
 * Detect items in a camera frame using Google Cloud Vision API.
 *
 * Uses three features in a single request:
 * - OBJECT_LOCALIZATION: finds objects with bounding boxes
 * - LOGO_DETECTION: recognizes brand logos (Coca-Cola, Pepsi, etc.)
 * - LABEL_DETECTION: general labels for context
 */
export async function detectItemsWithVision(
  base64Image: string,
  _zone: ScanZone,
): Promise<DetectedItem[] | null> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("[VisionService] No API key — set EXPO_PUBLIC_GOOGLE_CLOUD_VISION_API_KEY");
    return null;
  }

  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");

  try {
    const response = await fetch(`${VISION_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64Data },
            features: [
              { type: "OBJECT_LOCALIZATION", maxResults: MAX_RESULTS },
              { type: "LOGO_DETECTION", maxResults: MAX_RESULTS },
              { type: "LABEL_DETECTION", maxResults: MAX_RESULTS },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[VisionService] API error ${response.status}: ${errorBody}`);
      return null;
    }

    const result: GCVAnnotateResponse = await response.json();
    const anno = result.responses?.[0];

    if (anno?.error) {
      console.error(`[VisionService] GCV error: ${anno.error.message}`);
      return null;
    }

    const objects = anno?.localizedObjectAnnotations ?? [];
    const logos = anno?.logoAnnotations ?? [];
    const labels = anno?.labelAnnotations ?? [];

    // Build a set of top-level label descriptions for extra context
    const labelSet = new Set(labels.map((l) => l.description.toLowerCase()));

    // Collect detected items — objects first, then logos for brand info
    const itemMap = new Map<string, DetectedItem>();

    // 1. Localized objects (these have bounding boxes)
    for (const obj of objects) {
      if (obj.score < CONFIDENCE_THRESHOLD) continue;
      const key = obj.name.toLowerCase();
      if (itemMap.has(key) && (itemMap.get(key)!.confidence >= obj.score)) continue;

      itemMap.set(key, {
        label: obj.name,
        brand: null,
        quantity: 1,
        unit: guessUnit(obj.name),
        confidence: obj.score,
        boundingBox: verticesToBox(obj.boundingPoly?.normalizedVertices ?? []),
      });
    }

    // 2. Logos — either enrich existing objects with brand info, or add as new items
    for (const logo of logos) {
      if (logo.score < CONFIDENCE_THRESHOLD) continue;

      // Try to attach brand to an existing object
      let attached = false;
      for (const [, item] of itemMap) {
        if (!item.brand) {
          item.brand = logo.description;
          // If the object label is generic (e.g. "Packaged goods"), replace it
          const generic = /packaged|food|product|goods|drink/i.test(item.label);
          if (generic) {
            item.label = logo.description;
          }
          attached = true;
          break;
        }
      }

      if (!attached) {
        const key = `logo_${logo.description.toLowerCase()}`;
        const vertices = logo.boundingPoly?.normalizedVertices ?? [];
        itemMap.set(key, {
          label: logo.description,
          brand: logo.description,
          quantity: 1,
          unit: null,
          confidence: logo.score,
          boundingBox: verticesToBox(vertices),
        });
      }
    }

    // 3. Enrich with category from labels
    const detectedItems: DetectedItem[] = [];
    for (const [, item] of itemMap) {
      // Try to find a category from our label set or the item name
      const allText = [item.label, item.brand, ...labelSet].filter(Boolean).join(" ");
      const category = guessCategory(allText);

      detectedItems.push({
        ...item,
        unit: item.unit ?? guessUnit(allText),
      });

      // Record into product catalog
      productCatalog
        .recordDetection({
          name: item.label,
          brand: item.brand,
          unit: item.unit,
          confidence: item.confidence,
          boundingBox: item.boundingBox,
          category: category ?? undefined,
          frameThumbnail: base64Data,
        })
        .catch((e) => console.warn("[VisionService] Catalog record failed:", e));
    }

    console.log(
      `[VisionService] GCV: ${objects.length} objects, ${logos.length} logos, ${labels.length} labels → ${detectedItems.length} items kept`,
    );

    return detectedItems;
  } catch (error) {
    console.error("[VisionService] Detection failed:", error);
    return null;
  }
}

/**
 * Check whether AI-powered detection is available (API key is configured).
 */
export function isVisionAvailable(): boolean {
  return getApiKey() !== null;
}
