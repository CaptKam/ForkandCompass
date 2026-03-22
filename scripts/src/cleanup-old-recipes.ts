import { readFileSync } from "fs";
import { join } from "path";
import { db, pool, recipesTable } from "@workspace/db";

async function main() {
  const dataPath = join(process.cwd(), "..", ".stitch", "api-recipes-final.json");
  const allRecipes = JSON.parse(readFileSync(dataPath, "utf8")) as Record<
    string,
    Array<{ id: string }>
  >;

  const newIds: string[] = [];
  for (const recipes of Object.values(allRecipes)) {
    for (const r of recipes) {
      newIds.push(r.id);
    }
  }

  console.log(`Keeping ${newIds.length} new recipe IDs`);

  const placeholders = newIds.map((_, i) => `$${i + 1}`).join(", ");
  const result = await pool.query(
    `DELETE FROM recipes WHERE id NOT IN (${placeholders}) RETURNING id, title`,
    newIds
  );

  console.log(`\nDeleted ${result.rowCount} old recipes:`);
  for (const r of result.rows) {
    console.log(`  - ${r.id}: ${r.title}`);
  }

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
