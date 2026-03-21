import { Router, type IRouter } from "express";
import { db, recipesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/recipes/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [recipe] = await db
      .select()
      .from(recipesTable)
      .where(eq(recipesTable.id, id))
      .limit(1);

    if (!recipe) {
      res.status(404).json({ error: "Recipe not found" });
      return;
    }

    res.json(recipe);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch recipe" });
  }
});

export default router;
