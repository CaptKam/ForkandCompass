import { Router, type IRouter } from "express";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const OFF_BASE = "https://world.openfoodfacts.org";
const USER_AGENT = "ForkAndCompass/1.0 (iOS; contact@forkandcompass.app)";

const PRODUCT_FIELDS =
  "product_name,brands,image_front_url,image_front_small_url,categories_tags_en,quantity";

router.get("/off/product/:barcode", async (req, res) => {
  const { barcode } = req.params;

  if (!/^\d{8,14}$/.test(barcode)) {
    res.status(400).json({ error: "Invalid barcode format" });
    return;
  }

  try {
    const upstream = await fetch(
      `${OFF_BASE}/api/v2/product/${encodeURIComponent(barcode)}.json?fields=${PRODUCT_FIELDS}`,
      { headers: { "User-Agent": USER_AGENT } },
    );

    if (!upstream.ok) {
      res.status(upstream.status).json({ error: "Upstream error" });
      return;
    }

    const data = (await upstream.json()) as {
      code?: string;
      status?: number;
      product?: Record<string, unknown>;
    };

    if (data.status === 0 || !data.product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    const p = data.product;
    res.json({
      barcode: data.code,
      name: (p.product_name as string) || null,
      brand: (p.brands as string) || null,
      imageUrl: (p.image_front_url as string) || null,
      imageSmallUrl: (p.image_front_small_url as string) || null,
      categories: (p.categories_tags_en as string[]) || [],
      quantity: (p.quantity as string) || null,
    });
  } catch (err) {
    logger.error(err, "OFF product lookup error");
    res.status(500).json({ error: "Failed to look up product" });
  }
});

router.get("/off/search", async (req, res) => {
  const q = String(req.query.q ?? "").trim();
  const limit = Math.min(Number(req.query.limit) || 5, 10);

  if (!q) {
    res.status(400).json({ error: "q parameter is required" });
    return;
  }

  try {
    const upstream = await fetch(
      `${OFF_BASE}/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=${limit}&fields=code,product_name,brands,image_front_small_url`,
      { headers: { "User-Agent": USER_AGENT } },
    );

    if (!upstream.ok) {
      res.status(upstream.status).json({ error: "Upstream error" });
      return;
    }

    const data = (await upstream.json()) as {
      products?: Array<Record<string, unknown>>;
    };

    res.json({
      products: (data.products ?? []).map((p) => ({
        barcode: p.code ?? null,
        name: (p.product_name as string) || null,
        brand: (p.brands as string) || null,
        imageSmallUrl: (p.image_front_small_url as string) || null,
      })),
    });
  } catch (err) {
    logger.error(err, "OFF search error");
    res.status(500).json({ error: "Failed to search products" });
  }
});

export default router;
