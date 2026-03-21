import { Router, type IRouter } from "express";
import { ilike, or } from "drizzle-orm";
import { db, countriesTable, recipesTable } from "@workspace/db";

const router: IRouter = Router();

// GET /search?q=term — search countries and recipes
router.get("/search", async (req, res) => {
  const q = req.query.q;

  if (typeof q !== "string" || q.trim().length === 0) {
    res.json({ countries: [], recipes: [] });
    return;
  }

  const term = `%${q.trim()}%`;

  const [countries, recipes] = await Promise.all([
    db
      .select()
      .from(countriesTable)
      .where(
        or(
          ilike(countriesTable.name, term),
          ilike(countriesTable.description, term),
          ilike(countriesTable.cuisineLabel, term),
        ),
      ),
    db
      .select()
      .from(recipesTable)
      .where(
        or(
          ilike(recipesTable.title, term),
          ilike(recipesTable.description, term),
        ),
      ),
  ]);

  res.json({ countries, recipes });
});

export default router;
