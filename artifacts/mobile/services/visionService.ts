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
const CONFIDENCE_THRESHOLD = 0.6;

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
    fridge: "a refrigerator",
    pantry: "a pantry or dry storage area",
    spice_rack: "a spice rack or cabinet",
    counter: "a kitchen countertop",
    other: "a kitchen storage area",
  };

  return `Analyze this image of ${zoneDescriptions[zone]} and identify all visible products/items.

RULES:
1. Only report items physically visible in this image.
2. Do not guess items that are hidden, obscured, or not in the frame.
3. DO identify items even if the label is partially visible — use shape, color, and packaging cues. A red Coca-Cola can is still a Coca-Cola can even if the label is angled away.

For each visible item provide:
- "label": Product name (be specific — "Coca-Cola" not just "soda")
- "brand": Brand name if recognizable from packaging, color, or logo, otherwise null
- "quantity": Count visible (integer), or null
- "unit": Container type ("can", "bottle", "jar", "bag", "box"), or null
- "category": One of "produce", "protein", "dairy", "pantry", "spice", "beverage", "condiment", "frozen", or null
- "confidence": How certain you are (0.0-1.0). Be honest.
- "bounding_box": Normalized position {x, y, width, height} as 0.0-1.0 fractions

Respond with ONLY valid JSON:
{"items": [{"label": "...", "brand": null, "quantity": 1, "unit": "...", "category": null, "confidence": 0.95, "bounding_box": {"x": 0.1, "y": 0.2, "width": 0.3, "height": 0.25}}]}

If nothing is identifiable: {"items": []}`;
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
        temperature: 0,
        system: "You are a visual inventory scanner. Report items that are physically visible in the image. Use packaging shape, color, logos, and text to identify products. Be specific with product names and brands when recognizable. Do not fabricate items that aren't in the frame.",
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
