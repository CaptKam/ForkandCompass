import { pgTable, text, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { countriesTable } from "./countries";

export const recipesTable = pgTable("recipes", {
  id: text("id").primaryKey(),
  countryId: text("country_id")
    .notNull()
    .references(() => countriesTable.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  image: text("image").notNull(),
  prepTime: text("prep_time").notNull(),
  cookTime: text("cook_time").notNull(),
  servings: integer("servings").notNull().default(4),
  difficulty: text("difficulty").notNull(),
  ingredients: jsonb("ingredients").notNull().$type<Ingredient[]>(),
  steps: jsonb("steps").notNull().$type<CookStep[]>(),
  tips: text("tips").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export interface Ingredient {
  id: string;
  name: string;
  amount: string;
}

export interface CookStep {
  id: string;
  title: string;
  instruction: string;
  materials: string[];
}

export const insertRecipeSchema = createInsertSchema(recipesTable).omit({
  createdAt: true,
});

export type InsertRecipe = z.infer<typeof insertRecipeSchema>;
export type Recipe = typeof recipesTable.$inferSelect;
