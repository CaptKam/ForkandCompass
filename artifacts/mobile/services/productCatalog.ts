/**
 * Product Image Catalog — Local reference database of grocery products.
 *
 * Every time Claude Vision identifies an item during scanning, we capture
 * the image crop and store it here. Over time this builds a rich visual
 * fingerprint library of products the user actually has.
 *
 * Future: use on-device embedding matching against this catalog to identify
 * items without any API calls, falling back to Claude Vision only for
 * unknown products.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ProductImage {
  /** Unique ID for this image capture */
  id: string;
  /** Which product entry this image belongs to */
  productId: string;
  /** Base64-encoded JPEG thumbnail (cropped to the item) */
  base64Thumbnail: string;
  /** Which angle/view this represents */
  viewAngle: ViewAngle;
  /** Confidence from the AI identification (0-1) */
  aiConfidence: number;
  /** When this image was captured */
  capturedAt: number;
  /** Bounding box in the original frame (normalized 0-1) */
  boundingBox: { x: number; y: number; width: number; height: number };
}

export type ViewAngle = "front" | "side" | "top" | "partial" | "unknown";

export interface CatalogProduct {
  /** Unique product ID (derived from normalized name + brand) */
  id: string;
  /** Product display name (e.g. "Olive Oil") */
  name: string;
  /** Brand name if known */
  brand: string | null;
  /** Common category */
  category: string | null;
  /** Default unit (e.g. "bottle", "jar") */
  defaultUnit: string | null;
  /** Number of reference images stored for this product */
  imageCount: number;
  /** IDs of associated reference images */
  imageIds: string[];
  /** How many times this product has been detected across scans */
  timesDetected: number;
  /** First time we saw this product */
  firstSeenAt: number;
  /** Last time we saw this product */
  lastSeenAt: number;
  /** Average AI confidence across detections */
  avgConfidence: number;
}

export interface CatalogStats {
  totalProducts: number;
  totalImages: number;
  topProducts: { name: string; brand: string | null; timesDetected: number }[];
}

// ─── Storage Keys ────────────────────────────────────────────────────────────

const CATALOG_PRODUCTS_KEY = "@culinary_catalog_products";
const CATALOG_IMAGES_KEY = "@culinary_catalog_images";
const MAX_IMAGES_PER_PRODUCT = 6; // Keep up to 6 reference angles per product
const THUMBNAIL_MAX_DIMENSION = 200; // Max px for stored thumbnails

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Generate a stable product ID from name + brand */
export function makeProductId(name: string, brand: string | null): string {
  const normalized = `${name.toLowerCase().trim()}::${(brand ?? "generic").toLowerCase().trim()}`;
  // Simple hash — stable across sessions
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `prod_${Math.abs(hash).toString(36)}`;
}

/** Guess the view angle based on bounding box shape */
function guessViewAngle(bbox: { width: number; height: number }): ViewAngle {
  const aspect = bbox.width / bbox.height;
  if (aspect > 1.5) return "side";
  if (aspect < 0.6) return "front";
  if (bbox.width < 0.15 || bbox.height < 0.15) return "partial";
  return "unknown";
}

// ─── Catalog Service ─────────────────────────────────────────────────────────

class ProductCatalogService {
  private products: Map<string, CatalogProduct> = new Map();
  private images: Map<string, ProductImage> = new Map();
  private loaded = false;

  /** Load catalog from persistent storage */
  async load(): Promise<void> {
    if (this.loaded) return;
    try {
      const [productsJson, imagesJson] = await Promise.all([
        AsyncStorage.getItem(CATALOG_PRODUCTS_KEY),
        AsyncStorage.getItem(CATALOG_IMAGES_KEY),
      ]);

      if (productsJson) {
        const arr: CatalogProduct[] = JSON.parse(productsJson);
        for (const p of arr) this.products.set(p.id, p);
      }
      if (imagesJson) {
        const arr: ProductImage[] = JSON.parse(imagesJson);
        for (const img of arr) this.images.set(img.id, img);
      }
      this.loaded = true;
    } catch (e) {
      console.warn("[Catalog] Failed to load:", e);
      this.loaded = true;
    }
  }

  /** Persist catalog to storage */
  private async save(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(
          CATALOG_PRODUCTS_KEY,
          JSON.stringify(Array.from(this.products.values())),
        ),
        AsyncStorage.setItem(
          CATALOG_IMAGES_KEY,
          JSON.stringify(Array.from(this.images.values())),
        ),
      ]);
    } catch (e) {
      console.warn("[Catalog] Failed to save:", e);
    }
  }

  /**
   * Record a detected item into the catalog.
   * If we have a cropped image, store it as a reference.
   *
   * @param name - Item name from AI detection
   * @param brand - Brand from AI detection
   * @param unit - Unit type
   * @param confidence - AI confidence score
   * @param boundingBox - Where in the frame the item was found
   * @param frameThumbnail - Base64 JPEG of the cropped item (optional)
   */
  async recordDetection(params: {
    name: string;
    brand: string | null;
    unit: string | null;
    confidence: number;
    boundingBox: { x: number; y: number; width: number; height: number };
    frameThumbnail?: string;
    category?: string;
  }): Promise<CatalogProduct> {
    await this.load();

    const productId = makeProductId(params.name, params.brand);
    const now = Date.now();

    // Get or create product entry
    let product = this.products.get(productId);
    if (product) {
      // Update existing product
      product.timesDetected += 1;
      product.lastSeenAt = now;
      product.avgConfidence =
        (product.avgConfidence * (product.timesDetected - 1) + params.confidence) /
        product.timesDetected;
      if (params.unit && !product.defaultUnit) {
        product.defaultUnit = params.unit;
      }
    } else {
      // Create new product entry
      product = {
        id: productId,
        name: params.name,
        brand: params.brand,
        category: params.category ?? null,
        defaultUnit: params.unit,
        imageCount: 0,
        imageIds: [],
        timesDetected: 1,
        firstSeenAt: now,
        lastSeenAt: now,
        avgConfidence: params.confidence,
      };
    }

    // Store reference image if provided and we haven't maxed out
    if (params.frameThumbnail && product.imageCount < MAX_IMAGES_PER_PRODUCT) {
      const imageId = `img_${productId}_${now}_${Math.random().toString(36).slice(2, 6)}`;
      const viewAngle = guessViewAngle(params.boundingBox);

      // Check if we already have this angle covered
      const existingAngles = product.imageIds
        .map((id) => this.images.get(id))
        .filter(Boolean)
        .map((img) => img!.viewAngle);

      // Prefer new angles, but accept duplicates if we have room
      const hasAngle = existingAngles.includes(viewAngle);
      if (!hasAngle || product.imageCount < MAX_IMAGES_PER_PRODUCT) {
        const image: ProductImage = {
          id: imageId,
          productId,
          base64Thumbnail: params.frameThumbnail,
          viewAngle,
          aiConfidence: params.confidence,
          capturedAt: now,
          boundingBox: params.boundingBox,
        };

        this.images.set(imageId, image);
        product.imageIds.push(imageId);
        product.imageCount = product.imageIds.length;
      }
    }

    this.products.set(productId, product);
    await this.save();

    return product;
  }

  /** Get all products in the catalog */
  async getAllProducts(): Promise<CatalogProduct[]> {
    await this.load();
    return Array.from(this.products.values()).sort(
      (a, b) => b.lastSeenAt - a.lastSeenAt,
    );
  }

  /** Get a specific product by ID */
  async getProduct(productId: string): Promise<CatalogProduct | null> {
    await this.load();
    return this.products.get(productId) ?? null;
  }

  /** Look up a product by name and brand */
  async findProduct(name: string, brand: string | null): Promise<CatalogProduct | null> {
    const id = makeProductId(name, brand);
    return this.getProduct(id);
  }

  /** Get reference images for a product */
  async getProductImages(productId: string): Promise<ProductImage[]> {
    await this.load();
    const product = this.products.get(productId);
    if (!product) return [];
    return product.imageIds
      .map((id) => this.images.get(id))
      .filter((img): img is ProductImage => img !== undefined);
  }

  /** Get catalog statistics */
  async getStats(): Promise<CatalogStats> {
    await this.load();
    const products = Array.from(this.products.values());
    const topProducts = [...products]
      .sort((a, b) => b.timesDetected - a.timesDetected)
      .slice(0, 10)
      .map((p) => ({ name: p.name, brand: p.brand, timesDetected: p.timesDetected }));

    return {
      totalProducts: products.length,
      totalImages: this.images.size,
      topProducts,
    };
  }

  /** Remove a product and all its images */
  async removeProduct(productId: string): Promise<void> {
    await this.load();
    const product = this.products.get(productId);
    if (product) {
      for (const imgId of product.imageIds) {
        this.images.delete(imgId);
      }
      this.products.delete(productId);
      await this.save();
    }
  }

  /** Clear the entire catalog */
  async clearAll(): Promise<void> {
    this.products.clear();
    this.images.clear();
    await Promise.all([
      AsyncStorage.removeItem(CATALOG_PRODUCTS_KEY),
      AsyncStorage.removeItem(CATALOG_IMAGES_KEY),
    ]);
  }
}

/** Singleton instance */
export const productCatalog = new ProductCatalogService();
