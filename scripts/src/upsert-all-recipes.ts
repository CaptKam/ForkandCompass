import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { db, pool, recipesTable } from "@workspace/db";

const COUNTRY_IMAGES: Record<string, string> = {
  italy:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAQWVDU6vVZyYj8wQg9Ef0kgt9FP8fAFb-FWR8gHDKnDwGdFDod43xmWw-NXORmWr5qYAhRjODEVDZgjP8TYFNzfNEedf1pJzMhR4JbPfGQ-aqP-lKJ9M0hAZANodDbuHwRwpaNEjsEfjWAPAmVAjL22DACiSGJRYiMPAk0zj_5YKdSHHDXntk1LsXeL9HGaPwzz8_cCehuKWODzY9TwKTrQMR84KaeACHDmNFHIk5I5tTPXWBuS-9gDJH6HCH6_IRUPC48JnM6dlmi",
  japan:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuB_SNvP2LkVLJvKf-aX2iT-o-NSsiCks6uaT9cDdkBLKKaez4-e-RWJAx153upL-rjpz-78MTNARVHvXXE8sKcVHmuyADVdPMSTFjawm9E9n2xXV6Z9eFXx1dFgxRgCiodnPlhMOUOebzbX1FLmcziYWoBD9DsEGvIIr7gvkNKQM0JQYmLB8_84wVWV6_gBkI2BnisBfbHhryUpCm6ZckKlHUsP60jyzxE54P1ls4iOZUzbwoW2ShyIsYQae7O1e0sFcEw4GvBLc3E2",
  morocco:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCuAaqROW9q8mgNaJigvWmdRpSR03vjO8AItTK4uFQZqAeBjh-IFmXevWe2DNO_XOPiZDVVX8gLKBO4tNAkydUrO70Orkgl0ehXa17P0p2FGLCvPDJSCTDEp-A957C72z6oglWbXbG3XoWuJqZffk9qsAemQ_mr0dBWx_sfMtFFbcV0Qiyo3M4VsjCmBv4GaoCDUbCNMnLtItGfseVndV1vti8Pii47AInX_V9pVWM7Pq65Gjqt9i2LIfCbxkC8yK3bU_EhvatXr5Gm",
  mexico:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAQWVDU6vVZyYj8wQg9Ef0kgt9FP8fAFb-FWR8gHDKnDwGdFDod43xmWw-NXORmWr5qYAhRjODEVDZgjP8TYFNzfNEedf1pJzMhR4JbPfGQ-aqP-lKJ9M0hAZANodDbuHwRwpaNEjsEfjWAPAmVAjL22DACiSGJRYiMPAk0zj_5YKdSHHDXntk1LsXeL9HGaPwzz8_cCehuKWODzY9TwKTrQMR84KaeACHDmNFHIk5I5tTPXWBuS-9gDJH6HCH6_IRUPC48JnM6dlmi",
  india:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBN1otg8SY3H_Dxl5JDkMhBhlxkUNAMmtNPZumgtv7NEHzaxNjBID2NvUbMf59nTvrecTodf3buW7xhkdqc2nE7si05Xcu0lALwuYI1LVtG3s0JfdO7l9tyazx5Wau28Rvc5-BJPyoT3TSnoS9icE8oyOdqt6mAgaChjPnK27ln3g7Mpp582waPmuvXGNZJ9AU9kn7VKa_UGt2z4DiSqpveKJ2e-Ge8RohrT3tnHt7Le--79e06APS_NuqVNMo01HzEdBAwCFtcI3pR",
  thailand:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCV0cKfGirSUGQzMCuuqPULy4hM-S6k_j0hLqkSYKZilJHiuN4Jkjdas8pZ_nJ-g0gE11G39N1n_YJf_3Cj0GvCq1wz0OG5ZgpnB97HQ8_g0ik5p-YkSYSCXd6m0Y9y8EV-fJUFelMgJ9rvLTqv8R3yA9s3k76JWwUMRoN0rNa7Ly9AxHIbwWf5JGGz7MDMVJijHW9H2rAZzKYJqBfM2mQbP2GXKU9SRGwkVANhMiDFiqTbdDkUaqvL4kqPuEwAH-6oTxq2Uo4",
};

const CUISINE_TO_COUNTRY: Record<string, string> = {
  Moroccan: "morocco",
  Italian: "italy",
  Japanese: "japan",
  "Japanese-American": "japan",
  "Japanese Fusion": "japan",
  Mexican: "mexico",
  Indian: "india",
  Thai: "thailand",
};

function parseDuration(iso?: string): string {
  if (!iso) return "";
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!m) return "";
  const h = parseInt(m[1] ?? "0");
  const min = parseInt(m[2] ?? "0");
  if (h && min) return `${h} hr ${min} min`;
  if (h) return `${h} hr`;
  if (min) return `${min} min`;
  return "";
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/, "");
}

function toAmount(item: Record<string, unknown>): string {
  const parts: string[] = [];
  if (item.quantity != null) {
    parts.push(`${item.quantity}${item.unit ? " " + String(item.unit) : ""}`);
  }
  if (item.preparation) parts.push(String(item.preparation));
  if (item.notes) parts.push(String(item.notes));
  return parts.join(", ") || "As needed";
}

type Ingredient = { id: string; name: string; amount: string };
type Step = { id: string; title: string; instruction: string; materials: string[] };

type RecipeRow = {
  id: string;
  countryId: string;
  title: string;
  description: string;
  image: string;
  category: string | null;
  prepTime: string | null;
  difficulty: string;
  ingredients: Ingredient[];
  steps: Step[];
  culturalNote: string | null;
  tips: string[];
};

async function main() {
  // Find cache dir relative to workspace root (script runs from scripts/ dir)
  const cacheDir = join(process.cwd(), "..", ".stitch", "recipes-cache");
  const files = readdirSync(cacheDir).filter((f) => f.endsWith(".json"));

  const recipeRows: RecipeRow[] = [];

  for (const file of files) {
    const raw = JSON.parse(readFileSync(join(cacheDir, file), "utf8")) as {
      data: Record<string, unknown>;
    };
    const d = raw.data;
    const countryId = CUISINE_TO_COUNTRY[d.cuisine as string];
    if (!countryId) {
      console.warn(`Skipping unknown cuisine: ${d.cuisine}`);
      continue;
    }

    // Flatten ingredients from groups
    const ingredients: Ingredient[] = [];
    let ingIdx = 1;
    const ingredientGroups = (d.ingredients ?? []) as {
      items?: Record<string, unknown>[];
    }[];
    for (const group of ingredientGroups) {
      for (const item of group.items ?? []) {
        ingredients.push({
          id: String(ingIdx++),
          name: String(item.name ?? ""),
          amount: toAmount(item),
        });
      }
    }

    // Convert instructions to steps
    const instructions = (d.instructions ?? []) as Record<string, unknown>[];
    const steps: Step[] = instructions.map((inst, i) => {
      const structured = inst.structured as Record<string, unknown> | undefined;
      return {
        id: `s${i + 1}`,
        title: structured?.action ? String(structured.action) : `Step ${i + 1}`,
        instruction: String(inst.text ?? ""),
        materials: [],
      };
    });

    const meta = d.meta as Record<string, unknown> | undefined;

    recipeRows.push({
      id: slugify(String(d.name ?? "")),
      countryId,
      title: String(d.name ?? ""),
      description: String(d.description ?? "A delicious recipe."),
      image: COUNTRY_IMAGES[countryId] ?? "",
      category: d.category ? String(d.category) : null,
      prepTime: parseDuration(meta?.total_time as string | undefined) || null,
      difficulty: d.difficulty ? String(d.difficulty) : "Medium",
      ingredients,
      steps,
      culturalNote: d.cultural_context ? String(d.cultural_context) : null,
      tips: [],
    });
  }

  console.log(`Upserting ${recipeRows.length} cached API recipes...`);

  for (const row of recipeRows) {
    await db
      .insert(recipesTable)
      .values(row)
      .onConflictDoUpdate({
        target: recipesTable.id,
        set: {
          title: row.title,
          description: row.description,
          image: row.image,
          category: row.category,
          prepTime: row.prepTime,
          difficulty: row.difficulty,
          ingredients: row.ingredients,
          steps: row.steps,
          culturalNote: row.culturalNote,
        },
      });
    console.log(`  ✓ ${row.id} (${row.countryId})`);
  }

  console.log(`\nDone — ${recipeRows.length} recipes upserted into the database.`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
