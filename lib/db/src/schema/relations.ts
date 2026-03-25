import { relations } from "drizzle-orm";
import { countriesTable } from "./countries";
import { recipesTable } from "./recipes";
import { appUsersTable } from "./app-users";
import { cookingHistoryTable } from "./cooking-history";

export const countriesRelations = relations(countriesTable, ({ many }) => ({
  recipes: many(recipesTable),
}));

export const recipesRelations = relations(recipesTable, ({ one, many }) => ({
  country: one(countriesTable, {
    fields: [recipesTable.countryId],
    references: [countriesTable.id],
  }),
  cookingHistory: many(cookingHistoryTable),
}));

export const appUsersRelations = relations(appUsersTable, ({ many }) => ({
  cookingHistory: many(cookingHistoryTable),
}));

export const cookingHistoryRelations = relations(cookingHistoryTable, ({ one }) => ({
  user: one(appUsersTable, {
    fields: [cookingHistoryTable.userId],
    references: [appUsersTable.id],
  }),
  recipe: one(recipesTable, {
    fields: [cookingHistoryTable.recipeId],
    references: [recipesTable.id],
  }),
}));
