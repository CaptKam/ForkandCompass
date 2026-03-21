import { pgTable, text, real, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const countriesTable = pgTable("countries", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  flag: text("flag").notNull(),
  description: text("description").notNull(),
  image: text("image").notNull(),
  cuisineLabel: text("cuisine_label").notNull(),
  rating: real("rating").notNull().default(4.5),
  recipeCount: integer("recipe_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCountrySchema = createInsertSchema(countriesTable).omit({
  createdAt: true,
});

export type InsertCountry = z.infer<typeof insertCountrySchema>;
export type Country = typeof countriesTable.$inferSelect;
