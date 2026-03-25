import { pgTable, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { appUsersTable } from "./app-users";
import { recipesTable } from "./recipes";

export const cookingHistoryTable = pgTable("cooking_history", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => appUsersTable.id, { onDelete: "cascade" }),
  recipeId: text("recipe_id")
    .notNull()
    .references(() => recipesTable.id, { onDelete: "cascade" }),
  completedAt: timestamp("completed_at").notNull().defaultNow(),
  rating: integer("rating"), // 1-5
  feedback: jsonb("feedback").$type<string[]>(), // ["Perfect", "Too salty"]
  cookTimeMinutes: integer("cook_time_minutes"),
  servings: integer("servings"),
});

export const insertCookingHistorySchema = createInsertSchema(cookingHistoryTable).omit({
  completedAt: true,
});

export type InsertCookingHistory = z.infer<typeof insertCookingHistorySchema>;
export type CookingHistory = typeof cookingHistoryTable.$inferSelect;
