import { pgTable, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { countriesTable } from "./countries";

export type Ingredient = { id: string; name: string; amount: string };
export type CookStep = {
  id: string;
  title: string;
  instruction: string;
  materials: string[];
};

export const recipesTable = pgTable("recipes", {
  id: text("id").primaryKey(),
  countryId: text("country_id")
    .notNull()
    .references(() => countriesTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  image: text("image").notNull(),
  category: text("category"),
  prepTime: text("prep_time"),
  cookTime: text("cook_time"),
  servings: integer("servings").default(4),
  difficulty: text("difficulty").notNull(),
  ingredients: jsonb("ingredients").notNull().$type<Ingredient[]>(),
  steps: jsonb("steps").notNull().$type<CookStep[]>(),
  culturalNote: text("cultural_note"),
  tips: text("tips").array().notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertRecipeSchema = createInsertSchema(recipesTable).omit({
  createdAt: true,
});

export type InsertRecipe = z.infer<typeof insertRecipeSchema>;
export type Recipe = typeof recipesTable.$inferSelect;
