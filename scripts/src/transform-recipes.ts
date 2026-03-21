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
};

const COUNTRY_META: Record<string, { name: string; flag: string }> = {
  italy: { name: "Italy", flag: "\u{1F1EE}\u{1F1F9}" },
  japan: { name: "Japan", flag: "\u{1F1EF}\u{1F1F5}" },
  morocco: { name: "Morocco", flag: "\u{1F1F2}\u{1F1E6}" },
  mexico: { name: "Mexico", flag: "\u{1F1F2}\u{1F1FD}" },
  india: { name: "India", flag: "\u{1F1EE}\u{1F1F3}" },
  thailand: { name: "Thailand", flag: "\u{1F1F9}\u{1F1ED}" },
};

// Explicit file-id → country mapping
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

// ── Convert instructions to steps (matching CookStep interface) ──────────────

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
  instructions: ApiInstruction[] | undefined,
  ingredients: Array<{ name: string; amount: string }>
): Array<{ id: string; title: string; instruction: string; materials: string[] }> {
  if (!instructions) return [];
  return instructions.map((inst) => {
    let title = "";
    if (inst.structured?.action) {
      title = inst.structured.action;
    } else {
      const words = inst.text.split(/\s+/);
      title = words.slice(0, 4).join(" ");
      if (words.length > 4) title += "...";
    }

    // Extract materials: find ingredient names mentioned in step text
    const materials: string[] = [];
    const lowerText = inst.text.toLowerCase();
    for (const ing of ingredients) {
      if (lowerText.includes(ing.name.toLowerCase())) {
        materials.push(`${ing.amount} ${ing.name}`.trim());
      }
    }

    return {
      id: `s${inst.step_number}`,
      title,
      instruction: inst.text,
      materials,
    };
  });
}

// ── Resolve country ID ───────────────────────────────────────────────────────

function resolveCountryId(
  fileId: string,
  cuisine: string | undefined,
  recipeName: string
): string {
  // 1. Explicit file mapping (most reliable)
  const fromFile = FILE_ID_TO_COUNTRY[fileId];
  if (fromFile) return fromFile;

  // 2. Cuisine string matching
  if (cuisine) {
    const direct = CUISINE_TO_COUNTRY[cuisine];
    if (direct) return direct;
    const normalized =
      cuisine.charAt(0).toUpperCase() + cuisine.slice(1).toLowerCase();
    const fromNormalized = CUISINE_TO_COUNTRY[normalized];
    if (fromNormalized) return fromNormalized;
  }

  // 3. Name-based keyword fallback
  const lowerName = recipeName.toLowerCase();
  if (lowerName.includes("italian") || lowerName.includes("italy"))
    return "italy";
  if (lowerName.includes("japanese") || lowerName.includes("japan"))
    return "japan";
  if (lowerName.includes("moroccan") || lowerName.includes("morocco"))
    return "morocco";
  if (lowerName.includes("mexican") || lowerName.includes("mexico"))
    return "mexico";
  if (lowerName.includes("indian") || lowerName.includes("india"))
    return "india";
  if (lowerName.includes("thai")) return "thailand";

  console.warn(
    `  WARNING: Could not resolve country for "${recipeName}" (file: ${fileId}, cuisine: ${cuisine})`
  );
  return "unknown";
}

// ── Main ─────────────────────────────────────────────────────────────────────

// Matches the Recipe interface in data.ts
interface MobileRecipe {
  id: string;
  name: string;
  countryId: string;
  countryName: string;
  countryFlag: string;
  category: string;
  time: string;
  difficulty: string;
  image: string;
  description: string;
  culturalNote: string;
  ingredients: Array<{ id: string; name: string; amount: string }>;
  steps: Array<{
    id: string;
    title: string;
    instruction: string;
    materials: string[];
  }>;
}

const ROOT = resolve(import.meta.dirname, "../..");
const CACHE_DIR = join(ROOT, ".stitch", "recipes-cache");
const DATA_TS = join(ROOT, "artifacts", "mobile", "constants", "data.ts");
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
    console.warn("No JSON files found in cache directory.");
    return;
  }

  console.log(`Processing ${files.length} recipe files...`);

  // Group recipes by country
  const recipesByCountry: Record<string, MobileRecipe[]> = {};
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
    const countryId = resolveCountryId(fileId, recipe.cuisine, recipeName);

    if (countryId === "unknown") {
      console.warn(`  Skipping "${recipeName}" — no country match`);
      continue;
    }

    const country = COUNTRY_META[countryId];
    const totalTime = parseDuration(recipe.meta?.total_time);
    const difficulty = DIFFICULTY_MAP[recipe.difficulty] ?? "Medium";
    const ingredients = flattenIngredients(recipe.ingredients);
    const steps = convertSteps(recipe.instructions, ingredients);
    const culturalNote: string = recipe.cultural_context ?? "";

    const mobileRecipe: MobileRecipe = {
      id,
      name: recipeName,
      countryId,
      countryName: country?.name ?? countryId,
      countryFlag: country?.flag ?? "",
      category: recipe.category ?? "",
      time: totalTime,
      difficulty,
      image: "",
      description: recipe.description ?? "",
      culturalNote,
      ingredients,
      steps,
    };

    if (!recipesByCountry[countryId]) recipesByCountry[countryId] = [];
    recipesByCountry[countryId].push(mobileRecipe);
    fullRecipes.push({ id, data: recipe });

    console.log(`  ${id} (${countryId}) - ${recipeName}`);
  }

  // ── Inject recipes into data.ts ────────────────────────────────────────────

  let dataTs = readFileSync(DATA_TS, "utf-8");

  for (const [countryId, recipes] of Object.entries(recipesByCountry)) {
    // Find the recipes array for this country and replace it
    // Pattern: after `id: "countryId"`, find `recipes: [` and replace until the matching `]`
    const countryIdPattern = new RegExp(
      `(id:\\s*"${countryId}"[\\s\\S]*?recipes:\\s*)\\[[\\s\\S]*?\\](?=,?\\s*\\n\\s*\\},?)`,
    );

    const recipesJson = JSON.stringify(recipes, null, 6)
      // Indent to match data.ts nesting (6 spaces for recipe array items)
      .replace(/\n/g, "\n    ");

    if (countryIdPattern.test(dataTs)) {
      dataTs = dataTs.replace(countryIdPattern, `$1${recipesJson}`);
      console.log(
        `  Injected ${recipes.length} recipes into ${countryId}`
      );
    } else {
      console.warn(
        `  Could not find recipes array for country "${countryId}" in data.ts`
      );
    }
  }

  writeFileSync(DATA_TS, dataTs, "utf-8");
  console.log(`\nUpdated ${DATA_TS}`);

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
