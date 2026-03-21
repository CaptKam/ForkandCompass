import { Router, type IRouter } from "express";
import { db, countriesTable, recipesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/countries", async (_req, res) => {
  try {
    const countries = await db
      .select()
      .from(countriesTable)
      .orderBy(countriesTable.name);
    res.json(countries);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch countries" });
  }
});

router.get("/countries/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [country] = await db
      .select()
      .from(countriesTable)
      .where(eq(countriesTable.id, id))
      .limit(1);

    if (!country) {
      res.status(404).json({ error: "Country not found" });
      return;
    }

    const recipes = await db
      .select()
      .from(recipesTable)
      .where(eq(recipesTable.countryId, id))
      .orderBy(recipesTable.title);

    res.json({ ...country, recipes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch country" });
  }
});

export default router;
