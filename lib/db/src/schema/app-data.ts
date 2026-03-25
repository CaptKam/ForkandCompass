import { pgTable, text, boolean, integer, decimal, timestamp, jsonb, date } from "drizzle-orm/pg-core";
import { appUsersTable } from "./app-users";
import { recipesTable } from "./recipes";
import { countriesTable } from "./countries";

export const regionsTable = pgTable("regions", {
  id: text("id").primaryKey(),
  countryId: text("country_id").notNull().references(() => countriesTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  emoji: text("emoji"),
  heroImageUrl: text("hero_image_url"),
  recipeCount: integer("recipe_count").default(0),
  sortOrder: integer("sort_order").default(0),
});

export const scheduledRecipesTable = pgTable("scheduled_recipes", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => appUsersTable.id, { onDelete: "cascade" }),
  recipeId: text("recipe_id").notNull().references(() => recipesTable.id, { onDelete: "cascade" }),
  scheduledDate: date("scheduled_date").notNull(),
  servings: integer("servings"),
  servingsScaleFactor: decimal("servings_scale_factor"),
  status: text("status").default("scheduled"),
  groceryAdded: boolean("grocery_added").default(false),
  source: text("source"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const groceryItemsTable = pgTable("grocery_items", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => appUsersTable.id, { onDelete: "cascade" }),
  ingredientName: text("ingredient_name").notNull(),
  quantity: decimal("quantity"),
  unit: text("unit"),
  recipeId: text("recipe_id").references(() => recipesTable.id),
  scheduledDate: date("scheduled_date"),
  tier: integer("tier").default(3),
  excluded: boolean("excluded").default(false),
  excludeReason: text("exclude_reason"),
  checked: boolean("checked").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const purchaseHistoryTable = pgTable("purchase_history", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => appUsersTable.id, { onDelete: "cascade" }),
  ingredientName: text("ingredient_name"),
  quantity: text("quantity"),
  purchasedAt: timestamp("purchased_at"),
  partner: text("partner"),
  timesRemoved: integer("times_removed").default(0),
});

export const scannedProductsTable = pgTable("scanned_products", {
  barcode: text("barcode").primaryKey(),
  name: text("name").notNull(),
  brand: text("brand"),
  imageUrl: text("image_url"),
  imageSmallUrl: text("image_small_url"),
  categories: jsonb("categories").$type<string[]>(),
  quantity: text("quantity"),
  lastFetchedAt: timestamp("last_fetched_at").defaultNow(),
});

export const editorialCollectionsTable = pgTable("editorial_collections", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  coverImageUrl: text("cover_image_url"),
  recipeIds: jsonb("recipe_ids").$type<string[]>().default([]),
  active: boolean("active").default(false),
  displayMonth: text("display_month"),
  createdAt: timestamp("created_at").defaultNow(),
});
