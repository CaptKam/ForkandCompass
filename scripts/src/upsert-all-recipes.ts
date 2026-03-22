import { readFileSync } from "fs";
import { join } from "path";
import { db, pool, recipesTable } from "@workspace/db";

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
  const dataPath = join(process.cwd(), "..", ".stitch", "api-recipes-final.json");
  const allRecipes = JSON.parse(readFileSync(dataPath, "utf8")) as Record<
    string,
    Array<{
      id: string;
      name: string;
      countryId: string;
      category: string;
      time: string;
      difficulty: string;
      image: string;
      description: string;
      culturalNote: string;
      ingredients: Ingredient[];
      steps: Step[];
    }>
  >;

  const recipeRows: RecipeRow[] = [];

  for (const [countryId, recipes] of Object.entries(allRecipes)) {
    for (const r of recipes) {
      recipeRows.push({
        id: r.id,
        countryId,
        title: r.name,
        description: r.description || "A delicious recipe.",
        image: r.image,
        category: r.category || null,
        prepTime: r.time || null,
        difficulty: r.difficulty || "Medium",
        ingredients: r.ingredients,
        steps: r.steps,
        culturalNote: r.culturalNote || null,
        tips: [],
      });
    }
  }

  console.log(`Upserting ${recipeRows.length} API recipes...`);

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

  console.log(`\nDone — ${recipeRows.length} recipes upserted.`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
