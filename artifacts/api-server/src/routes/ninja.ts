import { Router, type IRouter } from "express";

const router: IRouter = Router();

const NINJA_BASE = "https://api.api-ninjas.com/v1";
const API_KEY = process.env.API_NINJAS_KEY ?? "";

export interface NinjaRecipe {
  title: string;
  ingredients: string;
  servings: string;
  instructions: string;
}

router.get("/ninja/recipes", async (req, res) => {
  const query = String(req.query.query ?? "").trim();
  if (!query) {
    res.status(400).json({ error: "query param is required" });
    return;
  }

  if (!API_KEY) {
    res.status(503).json({ error: "API_NINJAS_KEY not configured" });
    return;
  }

  try {
    const upstream = await fetch(
      `${NINJA_BASE}/recipe?query=${encodeURIComponent(query)}`,
      { headers: { "X-Api-Key": API_KEY } }
    );

    if (!upstream.ok) {
      res.status(upstream.status).json({ error: "Upstream error" });
      return;
    }

    const data = (await upstream.json()) as NinjaRecipe[];
    res.json(data);
  } catch (err) {
    console.error("ninja/recipes error", err);
    res.status(500).json({ error: "Failed to fetch recipes" });
  }
});

router.get("/ninja/nutrition", async (req, res) => {
  const query = String(req.query.query ?? "").trim();
  if (!query) {
    res.status(400).json({ error: "query param is required" });
    return;
  }

  if (!API_KEY) {
    res.status(503).json({ error: "API_NINJAS_KEY not configured" });
    return;
  }

  try {
    const upstream = await fetch(
      `${NINJA_BASE}/nutrition?query=${encodeURIComponent(query)}`,
      { headers: { "X-Api-Key": API_KEY } }
    );

    if (!upstream.ok) {
      res.status(upstream.status).json({ error: "Upstream error" });
      return;
    }

    const data = await upstream.json();
    res.json(data);
  } catch (err) {
    console.error("ninja/nutrition error", err);
    res.status(500).json({ error: "Failed to fetch nutrition" });
  }
});

export default router;
