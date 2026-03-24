import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";

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

export type ScannedProduct = typeof scannedProductsTable.$inferSelect;
