import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, recipesTable } from "@workspace/db";

const router: IRouter = Router();

// GET /recipes/:id — single recipe
router.get("/recipes/:id", async (req, res) => {
  const { id } = req.params;

  const recipe = await db
    .select()
    .from(recipesTable)
    .where(eq(recipesTable.id, id))
    .limit(1);

  if (recipe.length === 0) {
    res.status(404).json({ error: "Recipe not found" });
    return;
  }

  res.json(recipe[0]);
});

export default router;
