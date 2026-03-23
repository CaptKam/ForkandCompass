export interface PantryStaple {
  id: string;
  ingredient: string;
  category: "basics" | "baking" | "sauces" | "spices" | "pantry";
  keywords: string[];
  excludePatterns?: string[];
  inKitchen: boolean;
}

export const DEFAULT_PANTRY_STAPLES: PantryStaple[] = [
  // Basics
  {
    id: "salt",
    ingredient: "Salt",
    category: "basics",
    keywords: ["salt"],
    excludePatterns: ["assault"],
    inKitchen: true,
  },
  {
    id: "black-pepper",
    ingredient: "Black Pepper",
    category: "basics",
    keywords: ["black pepper", "white pepper", "ground pepper"],
    inKitchen: true,
  },
  {
    id: "olive-oil",
    ingredient: "Olive Oil",
    category: "basics",
    keywords: ["olive oil"],
    inKitchen: true,
  },
  {
    id: "vegetable-oil",
    ingredient: "Vegetable Oil",
    category: "basics",
    keywords: ["vegetable oil", "canola oil", "sunflower oil", "neutral oil"],
    inKitchen: true,
  },
  {
    id: "butter",
    ingredient: "Butter",
    category: "basics",
    keywords: ["butter"],
    excludePatterns: ["peanut butter", "almond butter", "nut butter", "cashew butter", "butter lettuce", "butternut"],
    inKitchen: true,
  },
  // Baking
  {
    id: "flour",
    ingredient: "All-Purpose Flour",
    category: "baking",
    keywords: ["all-purpose flour", "plain flour", "all purpose flour", "flour"],
    excludePatterns: ["rice flour", "almond flour", "corn flour", "cornflour", "chickpea flour", "bread flour", "whole wheat flour", "tapioca flour"],
    inKitchen: true,
  },
  {
    id: "sugar",
    ingredient: "Sugar",
    category: "baking",
    keywords: ["granulated sugar", "white sugar", "caster sugar"],
    inKitchen: true,
  },
  {
    id: "baking-powder",
    ingredient: "Baking Powder",
    category: "baking",
    keywords: ["baking powder"],
    inKitchen: true,
  },
  // Sauces
  {
    id: "soy-sauce",
    ingredient: "Soy Sauce",
    category: "sauces",
    keywords: ["soy sauce", "tamari", "light soy", "dark soy"],
    inKitchen: true,
  },
  {
    id: "vinegar",
    ingredient: "Vinegar",
    category: "sauces",
    keywords: ["rice vinegar", "white vinegar", "apple cider vinegar", "balsamic vinegar", "vinegar"],
    excludePatterns: ["rice wine vinegar"],
    inKitchen: true,
  },
  {
    id: "hot-sauce",
    ingredient: "Hot Sauce",
    category: "sauces",
    keywords: ["hot sauce", "sriracha", "tabasco"],
    inKitchen: false,
  },
  // Spices
  {
    id: "garlic-powder",
    ingredient: "Garlic Powder",
    category: "spices",
    keywords: ["garlic powder"],
    inKitchen: true,
  },
  {
    id: "onion-powder",
    ingredient: "Onion Powder",
    category: "spices",
    keywords: ["onion powder"],
    inKitchen: true,
  },
  {
    id: "cumin",
    ingredient: "Cumin",
    category: "spices",
    keywords: ["cumin", "ground cumin", "cumin seeds"],
    inKitchen: true,
  },
  {
    id: "paprika",
    ingredient: "Paprika",
    category: "spices",
    keywords: ["paprika", "smoked paprika", "sweet paprika"],
    inKitchen: true,
  },
  {
    id: "oregano",
    ingredient: "Oregano",
    category: "spices",
    keywords: ["dried oregano", "oregano"],
    inKitchen: true,
  },
  {
    id: "red-pepper-flakes",
    ingredient: "Red Pepper Flakes",
    category: "spices",
    keywords: ["red pepper flakes", "chili flakes", "chilli flakes", "crushed red pepper"],
    inKitchen: false,
  },
  // Pantry
  {
    id: "white-rice",
    ingredient: "White Rice",
    category: "pantry",
    keywords: ["white rice", "jasmine rice", "basmati rice", "long-grain rice", "short-grain rice", "sushi rice"],
    inKitchen: true,
  },
  {
    id: "dried-pasta",
    ingredient: "Dried Pasta",
    category: "pantry",
    keywords: ["dried pasta", "dried spaghetti", "dried penne", "dried linguine", "dried fettuccine"],
    inKitchen: true,
  },
  {
    id: "canned-tomatoes",
    ingredient: "Canned Tomatoes",
    category: "pantry",
    keywords: ["canned tomatoes", "tinned tomatoes", "crushed tomatoes", "diced tomatoes", "whole peeled tomatoes"],
    inKitchen: false,
  },
  {
    id: "broth",
    ingredient: "Chicken / Vegetable Broth",
    category: "pantry",
    keywords: ["chicken stock", "vegetable stock", "chicken broth", "vegetable broth", "beef stock", "beef broth", "dashi stock"],
    inKitchen: false,
  },
];

export const CATEGORY_LABELS: Record<PantryStaple["category"], string> = {
  basics: "Basics",
  baking: "Baking",
  sauces: "Sauces & Condiments",
  spices: "Spices",
  pantry: "Pantry",
};

export function isIngredientMatchingStaple(ingredientName: string, staple: PantryStaple): boolean {
  const nameLower = ingredientName.toLowerCase().trim();
  const matches = staple.keywords.some((kw) => nameLower.includes(kw.toLowerCase()));
  if (!matches) return false;
  if (staple.excludePatterns) {
    return !staple.excludePatterns.some((ep) => nameLower.includes(ep.toLowerCase()));
  }
  return true;
}

export function findMatchingStaple(
  ingredientName: string,
  staples: PantryStaple[]
): PantryStaple | undefined {
  return staples.find((s) => isIngredientMatchingStaple(ingredientName, s));
}
