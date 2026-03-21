/**
 * Vision Service — Uses Claude Vision API to detect grocery/kitchen items
 * from camera frames captured during scanning.
 *
 * Sends base64-encoded images to the Anthropic API and parses structured
 * item detection results.
 */

import type { DetectedItem, ScanZone } from "@/constants/inventory";
import { productCatalog } from "./productCatalog";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

/** Minimum confidence to keep a detection — anything below is discarded */
const CONFIDENCE_THRESHOLD = 0.75;

// Pull from Expo env (set via .env or app.config)
function getApiKey(): string | null {
  // Expo makes env vars available via process.env with EXPO_PUBLIC_ prefix
  if (typeof process === "undefined") return null;
  const key = (process.env as Record<string, string | undefined>)?.EXPO_PUBLIC_ANTHROPIC_API_KEY;
  return key ?? null;
}

/** The structured format we ask Claude to return */
interface VisionDetectionResponse {
  items: {
    label: string;
    brand: string | null;
    quantity: number | null;
    unit: string | null;
    category: string | null;
    confidence: number;
    bounding_box: { x: number; y: number; width: number; height: number };
  }[];
}

/**
 * Build the detection prompt, tailored for the zone being scanned.
 */
function buildPrompt(zone: ScanZone): string {
  const zoneDescriptions: Record<ScanZone, string> = {
    fridge: "a refrigerator (look for dairy, condiments, beverages, produce, leftovers)",
    pantry: "a pantry or dry storage (look for canned goods, grains, pasta, oils, baking supplies)",
    spice_rack: "a spice rack or spice cabinet (look for spice jars, seasonings, dried herbs)",
    counter: "a kitchen countertop (look for fresh produce, fruit bowls, bread, appliances with visible items)",
    other: "a kitchen storage area",
  };

  return `You are a precise kitchen inventory scanner. Analyze this image of ${zoneDescriptions[zone]}.

CRITICAL RULES — read carefully:
- ONLY report items you can clearly see and positively identify in the image.
- Do NOT guess, infer, or hallucinate items that are not clearly visible.
- Do NOT assume items exist because of the zone type (e.g. don't add "milk" just because it's a fridge).
- If you see a single item, report exactly one item. If you see nothing identifiable, return an empty list.
- Be conservative — it is much better to miss an item than to report a phantom one.
- Your confidence score must honestly reflect how certain you are. If below 0.7, do not include the item.

For each item you can clearly identify:
- **label**: The common name (e.g. "Coca-Cola", "Olive Oil")
- **brand**: The brand ONLY if you can read it on the packaging, otherwise null
- **quantity**: Exact count you can see (integer), or null if unclear
- **unit**: Container type (e.g. "can", "bottle", "jar", "bag"), or null
- **category**: One of "produce", "protein", "dairy", "pantry", "spice", "beverage", "condiment", "frozen", or null
- **confidence**: Honest confidence from 0.0 to 1.0 — only include items where confidence >= 0.7
- **bounding_box**: Approximate normalized position {x, y, width, height} as 0.0-1.0 fractions

Respond with ONLY valid JSON, no markdown:
{"items": [{"label": "...", "brand": "..." or null, "quantity": 1, "unit": "...", "category": "beverage", "confidence": 0.95, "bounding_box": {"x": 0.1, "y": 0.2, "width": 0.3, "height": 0.25}}]}

If you cannot clearly identify any items, respond with: {"items": []}`;
}

/**
 * Detect items in a camera frame using Claude Vision API.
 *
 * @param base64Image - The captured frame as a base64-encoded JPEG/PNG string
 * @param zone - Which kitchen zone is being scanned
 * @returns Array of detected items, or null if the API call fails
 */
export async function detectItemsWithVision(
  base64Image: string,
  zone: ScanZone,
): Promise<DetectedItem[] | null> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("[VisionService] No API key configured — set EXPO_PUBLIC_ANTHROPIC_API_KEY");
    return null;
  }

  // Strip data URI prefix if present
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: "image/jpeg",
                  data: base64Data,
                },
              },
              {
                type: "text",
                text: buildPrompt(zone),
              },
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

    const result = await response.json();

    // Extract the text content from Claude's response
    const textBlock = result.content?.find(
      (block: { type: string }) => block.type === "text",
    );
    if (!textBlock?.text) {
      console.error("[VisionService] No text content in response");
      return null;
    }

    // Parse the JSON response
    const parsed: VisionDetectionResponse = JSON.parse(textBlock.text);

    // Filter out low-confidence hallucinations
    const confident = parsed.items.filter(
      (item) => item.confidence >= CONFIDENCE_THRESHOLD,
    );

    console.log(
      `[VisionService] Raw: ${parsed.items.length} items, kept ${confident.length} above ${CONFIDENCE_THRESHOLD} threshold`,
    );

    // Map to DetectedItem format
    const detectedItems: DetectedItem[] = confident.map((item) => ({
      label: item.label,
      brand: item.brand,
      quantity: item.quantity,
      unit: item.unit,
      confidence: Math.max(0, Math.min(1, item.confidence)),
      boundingBox: {
        x: item.bounding_box.x,
        y: item.bounding_box.y,
        width: item.bounding_box.width,
        height: item.bounding_box.height,
      },
    }));

    // Record only confident detections into the product catalog
    for (const item of confident) {
      productCatalog
        .recordDetection({
          name: item.label,
          brand: item.brand,
          unit: item.unit,
          confidence: item.confidence,
          boundingBox: {
            x: item.bounding_box.x,
            y: item.bounding_box.y,
            width: item.bounding_box.width,
            height: item.bounding_box.height,
          },
          category: item.category ?? undefined,
          frameThumbnail: base64Data,
        })
        .catch((e) => console.warn("[VisionService] Catalog record failed:", e));
    }

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
