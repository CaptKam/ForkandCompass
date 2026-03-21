import { relations } from "drizzle-orm";
import { countriesTable } from "./countries";
import { recipesTable } from "./recipes";

export const countriesRelations = relations(countriesTable, ({ many }) => ({
  recipes: many(recipesTable),
}));

export const recipesRelations = relations(recipesTable, ({ one }) => ({
  country: one(countriesTable, {
    fields: [recipesTable.countryId],
    references: [countriesTable.id],
  }),
}));
