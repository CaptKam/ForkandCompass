import { Router, type IRouter } from "express";

const router: IRouter = Router();

const RECIPE_API_BASE = "https://recipe-api.com/api/v1";
const API_KEY = process.env.RECIPE_API_KEY ?? "";

export interface RecipeMeta {
  active_time?: string;
  passive_time?: string;
  total_time?: string;
  overnight_required?: boolean;
  yields?: string;
  yield_count?: number;
  serving_size_g?: number;
}

export interface RecipeDietary {
  flags?: string[];
  not_suitable_for?: string[];
}

export interface RecipeNutritionSummary {
  calories?: number;
  protein_g?: number;
  carbohydrates_g?: number;
  fat_g?: number;
}

export interface RecipeListItem {
  id: string;
  name: string;
  description?: string;
  category?: string;
  cuisine?: string;
  difficulty?: string;
  tags?: string[];
  meta?: RecipeMeta;
  dietary?: RecipeDietary;
  nutrition_summary?: RecipeNutritionSummary;
}

export interface RecipeListResponse {
  data: RecipeListItem[];
  meta?: { total?: number; page?: number; limit?: number };
}

router.get("/ninja/recipes", async (req, res) => {
  const query = String(req.query.query ?? "").trim();
  if (!query) {
    res.status(400).json({ error: "query param is required" });
    return;
  }

  if (!API_KEY) {
    res.status(503).json({ error: "RECIPE_API_KEY not configured" });
    return;
  }

  try {
    const upstream = await fetch(
      `${RECIPE_API_BASE}/recipes?q=${encodeURIComponent(query)}&limit=10`,
      { headers: { "X-API-Key": API_KEY } }
    );

    if (!upstream.ok) {
      const body = await upstream.text();
      console.error("recipe-api error", upstream.status, body);
      res.status(upstream.status).json({ error: "Upstream error" });
      return;
    }

    const data = (await upstream.json()) as RecipeListResponse;
    res.json(data);
  } catch (err) {
    console.error("ninja/recipes error", err);
    res.status(500).json({ error: "Failed to fetch recipes" });
  }
});

router.get("/ninja/recipes/:id", async (req, res) => {
  const { id } = req.params;

  if (!API_KEY) {
    res.status(503).json({ error: "RECIPE_API_KEY not configured" });
    return;
  }

  try {
    const upstream = await fetch(
      `${RECIPE_API_BASE}/recipes/${encodeURIComponent(id)}`,
      { headers: { "X-API-Key": API_KEY } }
    );

    if (!upstream.ok) {
      res.status(upstream.status).json({ error: "Upstream error" });
      return;
    }

    const data = await upstream.json();
    res.json(data);
  } catch (err) {
    console.error("ninja/recipes/:id error", err);
    res.status(500).json({ error: "Failed to fetch recipe" });
  }
});

export default router;
