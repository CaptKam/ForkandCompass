import { Router, type IRouter } from "express";
import { db, countriesTable, recipesTable } from "@workspace/db";
import { ilike, or } from "drizzle-orm";

const router: IRouter = Router();

router.get("/search", async (req, res) => {
  try {
    const q = String(req.query.q ?? "").trim();

    if (!q) {
      res.json({ countries: [], recipes: [] });
      return;
    }

    const term = `%${q}%`;

    const [countries, recipes] = await Promise.all([
      db
        .select()
        .from(countriesTable)
        .where(
          or(
            ilike(countriesTable.name, term),
            ilike(countriesTable.description, term),
            ilike(countriesTable.region, term),
            ilike(countriesTable.cuisineLabel, term)
          )
        )
        .orderBy(countriesTable.name),

      db
        .select()
        .from(recipesTable)
        .where(
          or(
            ilike(recipesTable.title, term),
            ilike(recipesTable.description, term),
            ilike(recipesTable.category, term),
            ilike(recipesTable.difficulty, term)
          )
        )
        .orderBy(recipesTable.title),
    ]);

    res.json({ countries, recipes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Search failed" });
  }
});

export default router;
