import { pgTable, text, boolean, integer, decimal, timestamp, jsonb } from "drizzle-orm/pg-core";
import { recipesTable } from "./recipes";

export const recipeMetaTable = pgTable("recipe_meta", {
  recipeId: text("recipe_id").primaryKey().references(() => recipesTable.id, { onDelete: "cascade" }),
  activeTime: text("active_time"),
  passiveTime: text("passive_time"),
  totalTime: text("total_time"),
  overnightRequired: boolean("overnight_required").default(false),
  yields: text("yields"),
  yieldCount: integer("yield_count"),
  servingSizeG: integer("serving_size_g"),
});

export const recipeDietaryTable = pgTable("recipe_dietary", {
  recipeId: text("recipe_id").primaryKey().references(() => recipesTable.id, { onDelete: "cascade" }),
  flags: jsonb("flags").$type<string[]>().default([]),
  notSuitableFor: jsonb("not_suitable_for").$type<string[]>().default([]),
});

export const recipeStorageTable = pgTable("recipe_storage", {
  recipeId: text("recipe_id").primaryKey().references(() => recipesTable.id, { onDelete: "cascade" }),
  fridgeNotes: text("fridge_notes"),
  fridgeDuration: text("fridge_duration"),
  freezerNotes: text("freezer_notes"),
  freezerDuration: text("freezer_duration"),
  reheating: text("reheating"),
  doesNotKeep: boolean("does_not_keep").default(false),
});

export const recipeEquipmentTable = pgTable("recipe_equipment", {
  id: text("id").primaryKey(),
  recipeId: text("recipe_id").notNull().references(() => recipesTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  required: boolean("required").default(true),
  alternative: text("alternative"),
  sortOrder: integer("sort_order").default(0),
});

export const recipeIngredientGroupsTable = pgTable("recipe_ingredient_groups", {
  id: text("id").primaryKey(),
  recipeId: text("recipe_id").notNull().references(() => recipesTable.id, { onDelete: "cascade" }),
  groupName: text("group_name").notNull(),
  sortOrder: integer("sort_order").default(0),
});

export const recipeIngredientsTable = pgTable("recipe_ingredients", {
  id: text("id").primaryKey(),
  groupId: text("group_id").notNull().references(() => recipeIngredientGroupsTable.id, { onDelete: "cascade" }),
  recipeId: text("recipe_id").notNull().references(() => recipesTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  quantity: decimal("quantity"),
  unit: text("unit"),
  preparation: text("preparation"),
  notes: text("notes"),
  substitutions: jsonb("substitutions").$type<string[]>().default([]),
  nutritionSource: text("nutrition_source"),
  sortOrder: integer("sort_order").default(0),
});

export const recipeInstructionsTable = pgTable("recipe_instructions", {
  id: text("id").primaryKey(),
  recipeId: text("recipe_id").notNull().references(() => recipesTable.id, { onDelete: "cascade" }),
  stepNumber: integer("step_number").notNull(),
  phase: text("phase"),
  text: text("text").notNull(),
  textFirstSteps: text("text_first_steps"),
  textChefsTable: text("text_chefs_table"),
  action: text("action"),
  tempCelsius: integer("temp_celsius"),
  tempFahrenheit: integer("temp_fahrenheit"),
  duration: text("duration"),
  donenessVisual: text("doneness_visual"),
  donenessTactile: text("doneness_tactile"),
  tips: jsonb("tips").$type<string[]>().default([]),
});

export const recipeTroubleshootingTable = pgTable("recipe_troubleshooting", {
  id: text("id").primaryKey(),
  recipeId: text("recipe_id").notNull().references(() => recipesTable.id, { onDelete: "cascade" }),
  symptom: text("symptom").notNull(),
  likelyCause: text("likely_cause"),
  prevention: text("prevention"),
  fix: text("fix"),
});

export const recipeChefNotesTable = pgTable("recipe_chef_notes", {
  id: text("id").primaryKey(),
  recipeId: text("recipe_id").notNull().references(() => recipesTable.id, { onDelete: "cascade" }),
  note: text("note").notNull(),
  sortOrder: integer("sort_order").default(0),
});

export const recipeNutritionTable = pgTable("recipe_nutrition", {
  recipeId: text("recipe_id").primaryKey().references(() => recipesTable.id, { onDelete: "cascade" }),
  calories: decimal("calories"),
  proteinG: decimal("protein_g"),
  carbohydratesG: decimal("carbohydrates_g"),
  fatG: decimal("fat_g"),
  saturatedFatG: decimal("saturated_fat_g"),
  transFatG: decimal("trans_fat_g"),
  monounsaturatedFatG: decimal("monounsaturated_fat_g"),
  polyunsaturatedFatG: decimal("polyunsaturated_fat_g"),
  fiberG: decimal("fiber_g"),
  sugarG: decimal("sugar_g"),
  sodiumMg: decimal("sodium_mg"),
  cholesterolMg: decimal("cholesterol_mg"),
  potassiumMg: decimal("potassium_mg"),
  calciumMg: decimal("calcium_mg"),
  ironMg: decimal("iron_mg"),
  magnesiumMg: decimal("magnesium_mg"),
  phosphorusMg: decimal("phosphorus_mg"),
  zincMg: decimal("zinc_mg"),
  vitaminAMcg: decimal("vitamin_a_mcg"),
  vitaminCMg: decimal("vitamin_c_mg"),
  vitaminDMcg: decimal("vitamin_d_mcg"),
  vitaminEMg: decimal("vitamin_e_mg"),
  vitaminKMcg: decimal("vitamin_k_mcg"),
  vitaminB6Mg: decimal("vitamin_b6_mg"),
  vitaminB12Mcg: decimal("vitamin_b12_mcg"),
  thiaminMg: decimal("thiamin_mg"),
  riboflavinMg: decimal("riboflavin_mg"),
  niacinMg: decimal("niacin_mg"),
  folateMcg: decimal("folate_mcg"),
  waterG: decimal("water_g"),
  alcoholG: decimal("alcohol_g"),
  caffeineMg: decimal("caffeine_mg"),
  sources: jsonb("sources").$type<string[]>().default([]),
  updatedAt: timestamp("updated_at").defaultNow(),
});
