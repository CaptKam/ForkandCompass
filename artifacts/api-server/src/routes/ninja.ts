import { Router, type IRouter } from "express";

const router: IRouter = Router();

const RECIPE_API_BASE = "https://recipe-api.com/api/v1";
const API_KEY = process.env.RECIPE_API_KEY ?? "";

export interface RecipeIngredient {
  name: string;
  quantity: number | null;
  unit: string | null;
  preparation: string | null;
}

export interface RecipeIngredientGroup {
  group: string | null;
  ingredients: RecipeIngredient[];
}

export interface RecipeStep {
  step_number: number;
  phase: string;
  text: string;
  structured?: {
    action: string;
    temperature?: { celsius: number; fahrenheit: number } | null;
    duration?: string | null;
    doneness_cues?: { visual?: string | null; tactile?: string | null } | null;
  };
  tips?: string[];
}

export interface RecipeNutrition {
  per_serving?: {
    calories?: number;
    protein_g?: number;
    carbohydrates_g?: number;
    fat_g?: number;
    fiber_g?: number;
    sodium_mg?: number;
  };
}

export interface RecipeResult {
  id: string | number;
  title: string;
  slug?: string;
  description?: string;
  image_url?: string;
  servings?: number;
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  difficulty?: string;
  cuisine?: string;
  dietary_flags?: string[];
  ingredient_groups?: RecipeIngredientGroup[];
  instructions?: RecipeStep[];
  chef_notes?: string[];
  cultural_context?: string;
  nutrition?: RecipeNutrition;
}

export interface RecipeListResponse {
  data: RecipeResult[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
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

    const data = (await upstream.json()) as RecipeResult;
    res.json(data);
  } catch (err) {
    console.error("ninja/recipes/:id error", err);
    res.status(500).json({ error: "Failed to fetch recipe" });
  }
});

export default router;
