import { Router, type IRouter } from "express";
import {
  db,
  recipesTable,
  countriesTable,
  appUsersTable,
  cookingHistoryTable,
} from "@workspace/db";
import {
  eq,
  ilike,
  sql,
  desc,
  asc,
  count,
  countDistinct,
  and,
  or,
} from "drizzle-orm";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// ---------------------------------------------------------------------------
// GET /admin/stats - Dashboard stats
// ---------------------------------------------------------------------------
router.get("/admin/stats", async (_req, res) => {
  try {
    const [recipeCount, userCount, countryCount, regionCount, recentRecipes] = await Promise.all([
      db.select({ value: count() }).from(recipesTable),
      db.select({ value: count() }).from(appUsersTable),
      db.select({ value: count() }).from(countriesTable),
      db.select({ value: countDistinct(countriesTable.region) }).from(countriesTable),
      db
        .select({
          id: recipesTable.id,
          title: recipesTable.title,
          createdAt: recipesTable.createdAt,
        })
        .from(recipesTable)
        .orderBy(desc(recipesTable.createdAt))
        .limit(5),
    ]);

    res.json({
      recipes: recipeCount[0].value,
      users: userCount[0].value,
      countries: countryCount[0].value,
      regions: regionCount[0].value,
      recentRecipes,
    });
  } catch (err) {
    logger.error(err, "Failed to fetch admin stats");
    res.status(500).json({ error: "Failed to fetch admin stats" });
  }
});

// ---------------------------------------------------------------------------
// GET /admin/recipes - List all recipes with filters
// ---------------------------------------------------------------------------
router.get("/admin/recipes", async (req, res) => {
  try {
    const {
      country,
      region,
      difficulty,
      status,
      search,
      page = "1",
      limit = "20",
      sort = "createdAt",
      order = "desc",
    } = req.query as Record<string, string | undefined>;

    const pageNum = Math.max(1, parseInt(page ?? "1", 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit ?? "20", 10)));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];

    if (country) {
      conditions.push(eq(recipesTable.countryId, country));
    }
    if (region) {
      conditions.push(eq(recipesTable.region, region));
    }
    if (difficulty) {
      conditions.push(eq(recipesTable.difficulty, difficulty));
    }
    if (status) {
      conditions.push(eq(recipesTable.status, status));
    }
    if (search) {
      conditions.push(
        or(
          ilike(recipesTable.title, `%${search}%`),
          ilike(recipesTable.description, `%${search}%`),
        )!,
      );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    // Resolve sort column
    const sortColumnMap = {
      createdAt: recipesTable.createdAt,
      title: recipesTable.title,
      difficulty: recipesTable.difficulty,
      cookCount: recipesTable.cookCount,
      status: recipesTable.status,
      category: recipesTable.category,
      countryId: recipesTable.countryId,
    } as const;
    type SortKey = keyof typeof sortColumnMap;
    const sortKey = (sort && sort in sortColumnMap ? sort : "createdAt") as SortKey;
    const sortColumn = sortColumnMap[sortKey];
    const orderFn = order === "asc" ? asc : desc;

    const [recipes, totalResult] = await Promise.all([
      db
        .select()
        .from(recipesTable)
        .where(where)
        .orderBy(orderFn(sortColumn))
        .limit(limitNum)
        .offset(offset),
      db
        .select({ value: count() })
        .from(recipesTable)
        .where(where),
    ]);

    res.json({
      data: recipes,
      total: totalResult[0].value,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalResult[0].value / limitNum),
    });
  } catch (err) {
    logger.error(err, "Failed to fetch admin recipes");
    res.status(500).json({ error: "Failed to fetch admin recipes" });
  }
});

// ---------------------------------------------------------------------------
// GET /admin/recipes/:id - Get single recipe
// ---------------------------------------------------------------------------
router.get("/admin/recipes/:id", async (req, res) => {
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
    logger.error(err, "Failed to fetch admin recipe");
    res.status(500).json({ error: "Failed to fetch admin recipe" });
  }
});

// ---------------------------------------------------------------------------
// PATCH /admin/recipes/:id - Update recipe fields
// ---------------------------------------------------------------------------
router.patch("/admin/recipes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const [updated] = await db
      .update(recipesTable)
      .set(updates)
      .where(eq(recipesTable.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Recipe not found" });
      return;
    }

    res.json(updated);
  } catch (err) {
    logger.error(err, "Failed to update recipe");
    res.status(500).json({ error: "Failed to update recipe" });
  }
});

// ---------------------------------------------------------------------------
// DELETE /admin/recipes/:id - Delete a recipe
// ---------------------------------------------------------------------------
router.delete("/admin/recipes/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [deleted] = await db
      .delete(recipesTable)
      .where(eq(recipesTable.id, id))
      .returning();

    if (!deleted) {
      res.status(404).json({ error: "Recipe not found" });
      return;
    }

    res.json({ message: "Recipe deleted", id: deleted.id });
  } catch (err) {
    logger.error(err, "Failed to delete recipe");
    res.status(500).json({ error: "Failed to delete recipe" });
  }
});

// ---------------------------------------------------------------------------
// POST /admin/recipes/:id/feature - Toggle featured status
// ---------------------------------------------------------------------------
router.post("/admin/recipes/:id/feature", async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await db
      .select({ featured: recipesTable.featured })
      .from(recipesTable)
      .where(eq(recipesTable.id, id))
      .limit(1);

    if (!existing) {
      res.status(404).json({ error: "Recipe not found" });
      return;
    }

    const [updated] = await db
      .update(recipesTable)
      .set({ featured: !existing.featured })
      .where(eq(recipesTable.id, id))
      .returning();

    res.json(updated);
  } catch (err) {
    logger.error(err, "Failed to toggle featured status");
    res.status(500).json({ error: "Failed to toggle featured status" });
  }
});

// ---------------------------------------------------------------------------
// PATCH /admin/recipes/:id/status - Change status (live/hidden/draft)
// ---------------------------------------------------------------------------
router.patch("/admin/recipes/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !["live", "hidden", "draft"].includes(status)) {
      res.status(400).json({ error: "Invalid status. Must be one of: live, hidden, draft" });
      return;
    }

    const [updated] = await db
      .update(recipesTable)
      .set({ status })
      .where(eq(recipesTable.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Recipe not found" });
      return;
    }

    res.json(updated);
  } catch (err) {
    logger.error(err, "Failed to update recipe status");
    res.status(500).json({ error: "Failed to update recipe status" });
  }
});

// ---------------------------------------------------------------------------
// GET /admin/users - List all users with filters
// ---------------------------------------------------------------------------
router.get("/admin/users", async (req, res) => {
  try {
    const {
      search,
      level,
      plan,
      page = "1",
      limit = "20",
    } = req.query as Record<string, string | undefined>;

    const pageNum = Math.max(1, parseInt(page ?? "1", 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit ?? "20", 10)));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(appUsersTable.name, `%${search}%`),
          ilike(appUsersTable.email, `%${search}%`),
        )!,
      );
    }
    if (level) {
      conditions.push(eq(appUsersTable.cookingLevel, parseInt(level, 10)));
    }
    if (plan) {
      conditions.push(eq(appUsersTable.subscriptionPlan, plan));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [users, totalResult] = await Promise.all([
      db
        .select()
        .from(appUsersTable)
        .where(where)
        .orderBy(desc(appUsersTable.joinedAt))
        .limit(limitNum)
        .offset(offset),
      db
        .select({ value: count() })
        .from(appUsersTable)
        .where(where),
    ]);

    res.json({
      data: users,
      total: totalResult[0].value,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalResult[0].value / limitNum),
    });
  } catch (err) {
    logger.error(err, "Failed to fetch admin users");
    res.status(500).json({ error: "Failed to fetch admin users" });
  }
});

// ---------------------------------------------------------------------------
// GET /admin/users/:id - Get single user with cooking history
// ---------------------------------------------------------------------------
router.get("/admin/users/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [user] = await db
      .select()
      .from(appUsersTable)
      .where(eq(appUsersTable.id, id))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const history = await db
      .select()
      .from(cookingHistoryTable)
      .where(eq(cookingHistoryTable.userId, id))
      .orderBy(desc(cookingHistoryTable.completedAt));

    res.json({ ...user, cookingHistory: history });
  } catch (err) {
    logger.error(err, "Failed to fetch admin user");
    res.status(500).json({ error: "Failed to fetch admin user" });
  }
});

// ---------------------------------------------------------------------------
// GET /admin/featured/:countryId - Get featured recipes for a country
// ---------------------------------------------------------------------------
router.get("/admin/featured/:countryId", async (req, res) => {
  try {
    const { countryId } = req.params;

    const recipes = await db
      .select()
      .from(recipesTable)
      .where(
        and(
          eq(recipesTable.countryId, countryId),
          eq(recipesTable.featured, true),
        ),
      )
      .orderBy(asc(recipesTable.featuredOrder));

    res.json(recipes);
  } catch (err) {
    logger.error(err, "Failed to fetch featured recipes");
    res.status(500).json({ error: "Failed to fetch featured recipes" });
  }
});

// ---------------------------------------------------------------------------
// PUT /admin/featured/:countryId - Update featured recipe order for a country
// ---------------------------------------------------------------------------
router.put("/admin/featured/:countryId", async (req, res) => {
  try {
    const { countryId } = req.params;
    const { recipeIds } = req.body as { recipeIds: string[] };

    if (!Array.isArray(recipeIds)) {
      res.status(400).json({ error: "recipeIds must be an array of recipe IDs" });
      return;
    }

    // Clear existing featured for this country
    await db
      .update(recipesTable)
      .set({ featured: false, featuredOrder: null })
      .where(
        and(
          eq(recipesTable.countryId, countryId),
          eq(recipesTable.featured, true),
        ),
      );

    // Set new featured order
    const updated = [];
    for (let i = 0; i < recipeIds.length; i++) {
      const [recipe] = await db
        .update(recipesTable)
        .set({ featured: true, featuredOrder: i })
        .where(
          and(
            eq(recipesTable.id, recipeIds[i]),
            eq(recipesTable.countryId, countryId),
          ),
        )
        .returning();

      if (recipe) {
        updated.push(recipe);
      }
    }

    res.json(updated);
  } catch (err) {
    logger.error(err, "Failed to update featured recipes");
    res.status(500).json({ error: "Failed to update featured recipes" });
  }
});

export default router;
