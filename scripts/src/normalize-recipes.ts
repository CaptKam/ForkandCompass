/**
 * normalize-recipes.ts
 *
 * Populates the 10 normalized recipe sub-tables from two sources:
 *  1. .stitch/recipes-cache/*.json  — 77 full API responses (rich data)
 *  2. DB recipes table JSONB columns — 20 Spain/France recipes (partial data only)
 *
 * Safe to re-run: uses onConflictDoNothing / onConflictDoUpdate throughout.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

import { count, notInArray } from "drizzle-orm";
import {
  db,
  recipesTable,
  recipeMetaTable,
  recipeDietaryTable,
  recipeStorageTable,
  recipeEquipmentTable,
  recipeIngredientGroupsTable,
  recipeIngredientsTable,
  recipeInstructionsTable,
  recipeTroubleshootingTable,
  recipeChefNotesTable,
  recipeNutritionTable,
} from "@workspace/db";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.resolve(__dirname, "../../.stitch/recipes-cache");

// ─── helpers ────────────────────────────────────────────────────────────────

function str(v: unknown): string | null {
  if (v == null) return null;
  return String(v);
}

function num(v: unknown): string | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return isNaN(n) ? null : String(n);
}

function bool(v: unknown, fallback = false): boolean {
  if (v == null) return fallback;
  return Boolean(v);
}

// ─── seed from full API JSON ─────────────────────────────────────────────────

async function seedFromApiJson(r: any, dbId: string): Promise<void> {
  const id: string = dbId;

  // 1. Meta
  if (r.meta) {
    await db
      .insert(recipeMetaTable)
      .values({
        recipeId: id,
        activeTime: str(r.meta.active_time),
        passiveTime: str(r.meta.passive_time),
        totalTime: str(r.meta.total_time),
        overnightRequired: bool(r.meta.overnight_required),
        yields: str(r.meta.yields),
        yieldCount: r.meta.yield_count ?? null,
        servingSizeG: r.meta.serving_size_g ?? null,
      })
      .onConflictDoUpdate({
        target: recipeMetaTable.recipeId,
        set: { totalTime: str(r.meta.total_time) },
      });
  }

  // 2. Dietary
  if (r.dietary) {
    await db
      .insert(recipeDietaryTable)
      .values({
        recipeId: id,
        flags: r.dietary.flags ?? [],
        notSuitableFor: r.dietary.not_suitable_for ?? [],
      })
      .onConflictDoUpdate({
        target: recipeDietaryTable.recipeId,
        set: { flags: r.dietary.flags ?? [] },
      });
  }

  // 3. Storage
  if (r.storage) {
    await db
      .insert(recipeStorageTable)
      .values({
        recipeId: id,
        fridgeNotes: str(r.storage.refrigerator?.notes),
        fridgeDuration: str(r.storage.refrigerator?.duration),
        freezerNotes: str(r.storage.freezer?.notes),
        freezerDuration: str(r.storage.freezer?.duration),
        reheating: str(r.storage.reheating),
        doesNotKeep: bool(r.storage.does_not_keep),
      })
      .onConflictDoUpdate({
        target: recipeStorageTable.recipeId,
        set: { reheating: str(r.storage.reheating) },
      });
  }

  // 4. Equipment
  for (let i = 0; i < (r.equipment ?? []).length; i++) {
    const eq = r.equipment[i];
    await db
      .insert(recipeEquipmentTable)
      .values({
        id: randomUUID(),
        recipeId: id,
        name: eq.name,
        required: bool(eq.required, true),
        alternative: str(eq.alternative),
        sortOrder: i,
      })
      .onConflictDoNothing();
  }

  // 5. Ingredient groups + ingredients
  for (let gi = 0; gi < (r.ingredients ?? []).length; gi++) {
    const group = r.ingredients[gi];
    const groupId = randomUUID();
    await db
      .insert(recipeIngredientGroupsTable)
      .values({
        id: groupId,
        recipeId: id,
        groupName: group.group_name ?? "Ingredients",
        sortOrder: gi,
      })
      .onConflictDoNothing();

    for (let ii = 0; ii < (group.items ?? []).length; ii++) {
      const item = group.items[ii];
      await db
        .insert(recipeIngredientsTable)
        .values({
          id: item.ingredient_id ?? randomUUID(),
          groupId,
          recipeId: id,
          name: item.name,
          quantity: num(item.quantity),
          unit: str(item.unit),
          preparation: str(item.preparation),
          notes: str(item.notes),
          substitutions: item.substitutions ?? [],
          nutritionSource: str(item.nutrition_source),
          sortOrder: ii,
        })
        .onConflictDoNothing();
    }
  }

  // 6. Instructions
  for (const step of r.instructions ?? []) {
    await db
      .insert(recipeInstructionsTable)
      .values({
        id: randomUUID(),
        recipeId: id,
        stepNumber: step.step_number,
        phase: str(step.phase),
        text: step.text,
        textFirstSteps: null,
        textChefsTable: null,
        action: str(step.structured?.action),
        tempCelsius: step.structured?.temperature?.celsius ?? null,
        tempFahrenheit: step.structured?.temperature?.fahrenheit ?? null,
        duration: str(step.structured?.duration),
        donenessVisual: str(step.structured?.doneness_cues?.visual),
        donenessTactile: str(step.structured?.doneness_cues?.tactile),
        tips: step.tips ?? [],
      })
      .onConflictDoNothing();
  }

  // 7. Troubleshooting
  for (const ts of r.troubleshooting ?? []) {
    await db
      .insert(recipeTroubleshootingTable)
      .values({
        id: randomUUID(),
        recipeId: id,
        symptom: ts.symptom,
        likelyCause: str(ts.likely_cause),
        prevention: str(ts.prevention),
        fix: str(ts.fix),
      })
      .onConflictDoNothing();
  }

  // 8. Chef notes
  for (let i = 0; i < (r.chef_notes ?? []).length; i++) {
    await db
      .insert(recipeChefNotesTable)
      .values({
        id: randomUUID(),
        recipeId: id,
        note: r.chef_notes[i],
        sortOrder: i,
      })
      .onConflictDoNothing();
  }

  // 9. Nutrition
  const n = r.nutrition?.per_serving;
  if (n) {
    await db
      .insert(recipeNutritionTable)
      .values({
        recipeId: id,
        calories: num(n.calories),
        proteinG: num(n.protein_g),
        carbohydratesG: num(n.carbohydrates_g),
        fatG: num(n.fat_g),
        saturatedFatG: num(n.saturated_fat_g),
        transFatG: num(n.trans_fat_g),
        monounsaturatedFatG: num(n.monounsaturated_fat_g),
        polyunsaturatedFatG: num(n.polyunsaturated_fat_g),
        fiberG: num(n.fiber_g),
        sugarG: num(n.sugar_g),
        sodiumMg: num(n.sodium_mg),
        cholesterolMg: num(n.cholesterol_mg),
        potassiumMg: num(n.potassium_mg),
        calciumMg: num(n.calcium_mg),
        ironMg: num(n.iron_mg),
        magnesiumMg: num(n.magnesium_mg),
        phosphorusMg: num(n.phosphorus_mg),
        zincMg: num(n.zinc_mg),
        vitaminAMcg: num(n.vitamin_a_mcg),
        vitaminCMg: num(n.vitamin_c_mg),
        vitaminDMcg: num(n.vitamin_d_mcg),
        vitaminEMg: num(n.vitamin_e_mg),
        vitaminKMcg: num(n.vitamin_k_mcg),
        vitaminB6Mg: num(n.vitamin_b6_mg),
        vitaminB12Mcg: num(n.vitamin_b12_mcg),
        thiaminMg: num(n.thiamin_mg),
        riboflavinMg: num(n.riboflavin_mg),
        niacinMg: num(n.niacin_mg),
        folateMcg: num(n.folate_mcg),
        waterG: num(n.water_g),
        alcoholG: num(n.alcohol_g),
        caffeineMg: num(n.caffeine_mg),
        sources: r.nutrition.sources ?? [],
      })
      .onConflictDoUpdate({
        target: recipeNutritionTable.recipeId,
        set: { calories: num(n.calories) },
      });
  }
}

// ─── seed un-cached recipes from DB JSONB ───────────────────────────────────
// These are the 20 Spain/France recipes — we can reconstruct
// ingredient groups + instructions from the JSONB columns, but
// nutrition/equipment/storage/dietary data is simply not available.

async function seedFromDbJsonb(recipe: any): Promise<void> {
  const id: string = recipe.id;

  // Ingredients JSONB: Array<{ id, name, amount }>
  const ingredients: any[] = recipe.ingredients ?? [];
  if (ingredients.length > 0) {
    const groupId = randomUUID();
    await db
      .insert(recipeIngredientGroupsTable)
      .values({ id: groupId, recipeId: id, groupName: "Ingredients", sortOrder: 0 })
      .onConflictDoNothing();

    for (let i = 0; i < ingredients.length; i++) {
      const ing = ingredients[i];
      // amount may look like "200g" or "2 cups" — store as-is in notes
      await db
        .insert(recipeIngredientsTable)
        .values({
          id: ing.id ?? randomUUID(),
          groupId,
          recipeId: id,
          name: ing.name,
          quantity: null,
          unit: null,
          preparation: null,
          notes: str(ing.amount),
          substitutions: [],
          nutritionSource: null,
          sortOrder: i,
        })
        .onConflictDoNothing();
    }
  }

  // Steps JSONB: Array<{ id, title, instruction, materials, instructionFirstSteps?, instructionChefsTable? }>
  const steps: any[] = recipe.steps ?? [];
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    await db
      .insert(recipeInstructionsTable)
      .values({
        id: step.id ?? randomUUID(),
        recipeId: id,
        stepNumber: i + 1,
        phase: null,
        text: step.instruction ?? step.title,
        textFirstSteps: str(step.instructionFirstSteps),
        textChefsTable: str(step.instructionChefsTable),
        action: null,
        tempCelsius: null,
        tempFahrenheit: null,
        duration: null,
        donenessVisual: null,
        donenessTactile: null,
        tips: [],
      })
      .onConflictDoNothing();
  }
}

// ─── main ────────────────────────────────────────────────────────────────────

async function main() {
  // Build title → DB slug-id map so we can match cache files (UUID IDs) to DB rows
  console.log("Loading DB recipe index…");
  const allDbRecipes = await db.select({ id: recipesTable.id, title: recipesTable.title }).from(recipesTable);
  const titleToDbId = new Map<string, string>();
  for (const r of allDbRecipes) {
    titleToDbId.set(r.title.trim().toLowerCase(), r.id);
  }
  console.log(`  ${allDbRecipes.length} DB recipes indexed`);

  console.log("\nReading cache files…");
  const cacheFiles = fs.readdirSync(CACHE_DIR).filter((f) => f.endsWith(".json"));
  console.log(`Found ${cacheFiles.length} cached recipes`);

  // Track which DB IDs have been fully seeded from cache
  const seededDbIds = new Set<string>();

  let done = 0;
  let skipped = 0;
  for (const file of cacheFiles) {
    const raw = JSON.parse(fs.readFileSync(path.join(CACHE_DIR, file), "utf8"));
    const recipe = raw.data ?? raw;
    const recipeName: string = recipe.name ?? "";

    // Match to DB row by title (case-insensitive)
    const dbId = titleToDbId.get(recipeName.trim().toLowerCase());
    if (!dbId) {
      console.warn(`  ⚠ No DB match for "${recipeName}" — skipping`);
      skipped++;
      continue;
    }
    seededDbIds.add(dbId);

    try {
      await seedFromApiJson(recipe, dbId);
      done++;
      if (done % 10 === 0) console.log(`  ✓ ${done}/${cacheFiles.length - skipped} cached recipes processed`);
    } catch (err: any) {
      console.error(`  ✗ "${recipeName}" (${dbId}): ${err.message}`);
    }
  }
  console.log(`\nDone with cached recipes: ${done} seeded, ${skipped} unmatched`);

  // Find DB recipes that weren't matched from cache — fall back to JSONB extraction
  console.log("\nLooking for un-cached recipes in the DB…");
  const uncachedIds = allDbRecipes.map((r) => r.id).filter((id) => !seededDbIds.has(id));
  const uncached = uncachedIds.length > 0
    ? await db.select().from(recipesTable).where(notInArray(recipesTable.id, [...seededDbIds]))
    : [];

  console.log(`Found ${uncached.length} un-cached recipes — extracting from JSONB`);
  let partial = 0;
  for (const recipe of uncached) {
    try {
      await seedFromDbJsonb(recipe);
      partial++;
    } catch (err: any) {
      console.error(`  ✗ ${recipe.id} (${recipe.title}): ${err.message}`);
    }
  }
  console.log(`Done with un-cached recipes: ${partial}/${uncached.length}`);

  // Final counts
  console.log("\n── Row counts ──────────────────────────────────────");
  const counts = await Promise.all([
    db.select({ c: count() }).from(recipeMetaTable).then((r) => ({ table: "recipe_meta", count: r[0]?.c })),
    db.select({ c: count() }).from(recipeDietaryTable).then((r) => ({ table: "recipe_dietary", count: r[0]?.c })),
    db.select({ c: count() }).from(recipeStorageTable).then((r) => ({ table: "recipe_storage", count: r[0]?.c })),
    db.select({ c: count() }).from(recipeEquipmentTable).then((r) => ({ table: "recipe_equipment", count: r[0]?.c })),
    db.select({ c: count() }).from(recipeIngredientGroupsTable).then((r) => ({ table: "recipe_ingredient_groups", count: r[0]?.c })),
    db.select({ c: count() }).from(recipeIngredientsTable).then((r) => ({ table: "recipe_ingredients", count: r[0]?.c })),
    db.select({ c: count() }).from(recipeInstructionsTable).then((r) => ({ table: "recipe_instructions", count: r[0]?.c })),
    db.select({ c: count() }).from(recipeTroubleshootingTable).then((r) => ({ table: "recipe_troubleshooting", count: r[0]?.c })),
    db.select({ c: count() }).from(recipeChefNotesTable).then((r) => ({ table: "recipe_chef_notes", count: r[0]?.c })),
    db.select({ c: count() }).from(recipeNutritionTable).then((r) => ({ table: "recipe_nutrition", count: r[0]?.c })),
  ]);

  for (const { table, count: rowCount } of counts) {
    console.log(`  ${table.padEnd(30)} ${rowCount}`);
  }

  console.log("\nMigration complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
