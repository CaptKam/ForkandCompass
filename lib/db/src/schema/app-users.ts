import { pgTable, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const appUsersTable = pgTable("app_users", {
  id: text("id").primaryKey(),
  email: text("email"),
  name: text("name"),
  cookingLevel: integer("cooking_level").notNull().default(1),
  cookingTier: text("cooking_tier").notNull().default("first_steps"), // 'first_steps' | 'home_cook' | 'chefs_table'
  recipesCooked: integer("recipes_cooked").notNull().default(0),
  cuisinesExplored: jsonb("cuisines_explored").$type<string[]>().notNull().default([]),
  measurementSystem: text("measurement_system").notNull().default("us"), // 'us' | 'metric' | 'imperial_uk' | 'show_both'
  temperaturePreference: text("temperature_preference").notNull().default("fahrenheit"), // 'fahrenheit' | 'celsius'
  groceryPartner: text("grocery_partner"), // 'instacart' | 'kroger' | 'walmart' | null
  subscriptionPlan: text("subscription_plan").notNull().default("free"), // 'free' | 'pro' | 'premium'
  subscriptionStatus: text("subscription_status").notNull().default("active"), // 'active' | 'cancelled' | 'expired'
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
  lastActiveAt: timestamp("last_active_at"),
});

export const insertAppUserSchema = createInsertSchema(appUsersTable).omit({
  joinedAt: true,
});

export type InsertAppUser = z.infer<typeof insertAppUserSchema>;
export type AppUser = typeof appUsersTable.$inferSelect;
