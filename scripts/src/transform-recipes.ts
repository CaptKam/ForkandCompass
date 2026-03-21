import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

// ── Country mapping ──────────────────────────────────────────────────────────

const CUISINE_TO_COUNTRY: Record<string, string> = {
  Italian: "italy",
  Japanese: "japan",
  Moroccan: "morocco",
  Mexican: "mexico",
  Indian: "india",
  Thai: "thailand",
  // Common API variants
  italian: "italy",
  japanese: "japan",
  moroccan: "morocco",
  mexican: "mexico",
  indian: "india",
  thai: "thailand",
  "North African": "morocco",
  "Southeast Asian": "thailand",
  "South Asian": "india",
  "East Asian": "japan",
  "Latin American": "mexico",
  Mediterranean: "italy",
  Fusion: "unknown",
  American: "unknown",
};

const COUNTRY_NAMES: Record<string, string> = {
  italy: "Italy",
  japan: "Japan",
  morocco: "Morocco",
  mexico: "Mexico",
  india: "India",
  thailand: "Thailand",
};

const COUNTRY_FLAGS: Record<string, string> = {
  italy: "🇮🇹",
  japan: "🇯🇵",
  morocco: "🇲🇦",
  mexico: "🇲🇽",
  india: "🇮🇳",
  thailand: "🇹🇭",
};

// Explicit file-id → country mapping from the user's spec
const FILE_ID_TO_COUNTRY: Record<string, string> = {
  "65bfed85": "italy",
  de363bd9: "italy",
  "60c28b1b": "italy",
  db3837e7: "italy",
  "8c8555bd": "japan",
  bddbd7ed: "japan",
  "226a9367": "japan",
  db020cd7: "japan",
  "3704c3d6": "morocco",
  "3c433d5a": "morocco",
  "147e35b7": "morocco",
  "45d2a725": "morocco",
  ae6389b3: "mexico",
  ed912d38: "mexico",
  "2d1aa4c6": "mexico",
  f4cae949: "mexico",
  "14812bdb": "india",
  "50b43208": "india",
  "34e16832": "india",
  "88c36346": "india",
  "87d6e43c": "thailand",
  "18aaa4b3": "thailand",
  a861fae0: "thailand",
  d018ff66: "thailand",
};

// ── Difficulty mapping ───────────────────────────────────────────────────────

const DIFFICULTY_MAP: Record<string, string> = {
  Easy: "Easy",
  Intermediate: "Medium",
  Advanced: "Hard",
};

// ── ISO 8601 duration → human string ─────────────────────────────────────────

function parseDuration(iso: string | null | undefined): string {
  if (!iso) return "";
  const match = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match) return iso;
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours} hr`);
  if (minutes > 0) parts.push(`${minutes} min`);
  if (seconds > 0) parts.push(`${seconds} sec`);
  return parts.join(" ") || "0 min";
}

// ── Kebab-case slug ──────────────────────────────────────────────────────────

function toKebab(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ── Flatten ingredients ──────────────────────────────────────────────────────

interface ApiIngredientItem {
  name: string;
  quantity?: string | number | null;
  unit?: string | null;
  preparation?: string | null;
  notes?: string | null;
  substitutions?: string[] | null;
  ingredient_id?: string | null;
  nutrition_source?: string | null;
}

interface ApiIngredientGroup {
  group?: string | null;
  items: ApiIngredientItem[];
}

function flattenIngredients(
  groups: ApiIngredientGroup[] | undefined
): Array<{ id: string; name: string; amount: string }> {
  if (!groups) return [];
  let counter = 1;
  const result: Array<{ id: string; name: string; amount: string }> = [];
  for (const group of groups) {
    for (const item of group.items ?? []) {
      const amountParts = [
        item.quantity != null ? String(item.quantity) : "",
        item.unit ?? "",
        item.preparation ?? "",
      ]
        .map((s) => s.trim())
        .filter(Boolean);
      result.push({
        id: String(counter++),
        name: item.name,
        amount: amountParts.join(" "),
      });
    }
  }
  return result;
}

// ── Convert instructions to steps ────────────────────────────────────────────

interface ApiInstruction {
  step_number: number;
  phase?: string | null;
  text: string;
  structured?: {
    action?: string | null;
    temperature?: string | null;
    duration?: string | null;
    doneness_cues?: string[] | null;
  } | null;
}

function convertSteps(
  instructions: ApiInstruction[] | undefined
): Array<{ id: string; title: string; description: string }> {
  if (!instructions) return [];
  return instructions.map((inst) => {
    let title = "";
    if (inst.structured?.action) {
      title = inst.structured.action;
    } else {
      // First few words as title
      const words = inst.text.split(/\s+/);
      title = words.slice(0, 4).join(" ");
      if (words.length > 4) title += "...";
    }
    return {
      id: `s${inst.step_number}`,
      title,
      description: inst.text,
    };
  });
}

// ── Chef notes → tips array ──────────────────────────────────────────────────

function extractTips(
  chefNotes: string | string[] | null | undefined
): string[] {
  if (!chefNotes) return [];
  if (Array.isArray(chefNotes)) return chefNotes;
  // Split on newlines or periods that look like separate tips
  return chefNotes
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// ── Main ─────────────────────────────────────────────────────────────────────

const ROOT = resolve(import.meta.dirname, "../..");
const CACHE_DIR = join(ROOT, ".stitch", "recipes-cache");
const OUT_RECIPES = join(
  ROOT,
  "artifacts",
  "mobile",
  "constants",
  "transformed-recipes.ts"
);
const OUT_API_RECIPES = join(
  ROOT,
  "artifacts",
  "mobile",
  "constants",
  "api-recipes.ts"
);

function main() {
  if (!existsSync(CACHE_DIR)) {
    console.error(`Cache directory not found: ${CACHE_DIR}`);
    process.exit(1);
  }

  const files = readdirSync(CACHE_DIR).filter((f) => f.endsWith(".json"));
  if (files.length === 0) {
    console.warn("No JSON files found in cache directory. Generating empty output.");
  }

  console.log(`Processing ${files.length} recipe files...`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recipes: Array<Record<string, any>> = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fullRecipes: Array<{ id: string; data: any }> = [];

  for (const file of files) {
    const filePath = join(CACHE_DIR, file);
    const fileId = file.replace(".json", "");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let raw: any;
    try {
      raw = JSON.parse(readFileSync(filePath, "utf-8"));
    } catch (err) {
      console.warn(`Skipping ${file}: failed to parse JSON`, err);
      continue;
    }

    const recipe = raw.data;
    if (!recipe) {
      console.warn(`Skipping ${file}: no "data" wrapper found`);
      continue;
    }

    const recipeName: string = recipe.name ?? "Unknown";
    const id = toKebab(recipeName);

    // Resolve country: explicit file mapping > cuisine mapping > name heuristic
    const cuisineNormalized = recipe.cuisine
      ? recipe.cuisine.charAt(0).toUpperCase() + recipe.cuisine.slice(1).toLowerCase()
      : "";
    let countryId =
      FILE_ID_TO_COUNTRY[fileId] ??
      CUISINE_TO_COUNTRY[recipe.cuisine] ??
      CUISINE_TO_COUNTRY[cuisineNormalized] ??
      null;

    if (!countryId) {
      // Fallback: infer from recipe name keywords
      const lowerName = recipeName.toLowerCase();
      if (lowerName.includes("italian") || lowerName.includes("italy")) countryId = "italy";
      else if (lowerName.includes("japanese") || lowerName.includes("japan")) countryId = "japan";
      else if (lowerName.includes("moroccan") || lowerName.includes("morocco")) countryId = "morocco";
      else if (lowerName.includes("mexican") || lowerName.includes("mexico")) countryId = "mexico";
      else if (lowerName.includes("indian") || lowerName.includes("india")) countryId = "india";
      else if (lowerName.includes("thai")) countryId = "thailand";
      else {
        countryId = "unknown";
        console.warn(`  ⚠ Could not resolve country for "${recipeName}" (file: ${fileId}, cuisine: ${recipe.cuisine})`);
      }
    }

    const prepTime = parseDuration(recipe.meta?.active_time);
    const cookTime = parseDuration(recipe.meta?.passive_time);
    const servings = recipe.meta?.yield_count ?? 4;
    const difficulty = DIFFICULTY_MAP[recipe.difficulty] ?? "Medium";
    const ingredients = flattenIngredients(recipe.ingredients);
    const steps = convertSteps(recipe.instructions);
    const tips = extractTips(recipe.chef_notes);
    const culturalNote: string = recipe.cultural_context ?? "";

    recipes.push({
      id,
      countryId,
      title: recipeName,
      description: recipe.description ?? "",
      image: "",
      category: recipe.category ?? "",
      prepTime,
      cookTime,
      servings,
      difficulty,
      ingredients,
      steps,
      culturalNote,
      tips,
    });

    fullRecipes.push({ id, data: recipe });

    console.log(`  ${id} (${countryId}) - ${recipeName}`);
  }

  // ── Generate transformed-recipes.ts ────────────────────────────────────────

  const recipesTs = `// Auto-generated by scripts/src/transform-recipes.ts
// Do NOT edit manually. Re-run the transform script to regenerate.

export interface TransformedRecipe {
  id: string;
  countryId: string;
  title: string;
  description: string;
  image: string;
  category: string;
  prepTime: string;
  cookTime: string;
  servings: number;
  difficulty: "Easy" | "Medium" | "Hard";
  ingredients: Array<{ id: string; name: string; amount: string }>;
  steps: Array<{ id: string; title: string; description: string }>;
  culturalNote: string;
  tips: string[];
}

export const TRANSFORMED_RECIPES: TransformedRecipe[] = ${JSON.stringify(recipes, null, 2)};
`;

  writeFileSync(OUT_RECIPES, recipesTs, "utf-8");
  console.log(`\nWrote ${recipes.length} recipes to ${OUT_RECIPES}`);

  // ── Generate api-recipes.ts ────────────────────────────────────────────────

  const entriesCode = fullRecipes
    .map(
      ({ id, data }) =>
        `  ["${id}", ${JSON.stringify(data, null, 2).replace(/\n/g, "\n  ")}]`
    )
    .join(",\n");

  const apiRecipesTs = `// Auto-generated by scripts/src/transform-recipes.ts
// Full recipe-api.com data for future features (nutrition, equipment, dietary, etc.)
// Do NOT edit manually. Re-run the transform script to regenerate.

/* eslint-disable @typescript-eslint/no-explicit-any */

export const API_RECIPES: Map<string, any> = new Map([
${entriesCode}
]);
`;

  writeFileSync(OUT_API_RECIPES, apiRecipesTs, "utf-8");
  console.log(`Wrote ${fullRecipes.length} full API recipes to ${OUT_API_RECIPES}`);
}

main();
