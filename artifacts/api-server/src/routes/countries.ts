import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, countriesTable, recipesTable } from "@workspace/db";

const router: IRouter = Router();

// GET /countries — list all countries
router.get("/countries", async (_req, res) => {
  const countries = await db.select().from(countriesTable);
  res.json(countries);
});

// GET /countries/:id — single country with its recipes
router.get("/countries/:id", async (req, res) => {
  const { id } = req.params;

  const country = await db
    .select()
    .from(countriesTable)
    .where(eq(countriesTable.id, id))
    .limit(1);

  if (country.length === 0) {
    res.status(404).json({ error: "Country not found" });
    return;
  }

  const recipes = await db
    .select()
    .from(recipesTable)
    .where(eq(recipesTable.countryId, id));

  res.json({ ...country[0], recipes });
});

export default router;
