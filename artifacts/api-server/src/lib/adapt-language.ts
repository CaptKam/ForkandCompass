/**
 * Adaptive Cooking Language — Build-time Pipeline Script
 *
 * Rewrites recipe instructions at three tiers:
 *   🌱 First Steps (beginner) — expanded, plain language, sub-steps
 *   🍳 Home Cook (intermediate) — API original (no change)
 *   👨‍🍳 Chef's Table (advanced) — compressed, professional terms
 *
 * Usage:
 *   npx tsx src/lib/adapt-language.ts
 *
 * This reads all recipes from the database, generates beginner and advanced
 * rewrites for each step using Claude, and stores them back in the database.
 *
 * Cost: ~$3-5 per 100 recipes using Claude Haiku.
 */

import type { CookStep, Ingredient } from "@workspace/db/schema/recipes";

/* ── Types ─────────────────────────────────────────────────────── */

interface RecipeForAdaptation {
  id: string;
  title: string;
  ingredients: Ingredient[];
  steps: CookStep[];
}

/* ── Prompt Templates ──────────────────────────────────────────── */

function getIngredientsForStep(
  stepText: string,
  ingredients: Ingredient[]
): Ingredient[] {
  const lower = stepText.toLowerCase();
  return ingredients.filter((item) => lower.includes(item.name.toLowerCase()));
}

export function buildBeginnerPrompt(
  step: CookStep,
  recipe: RecipeForAdaptation
): string {
  const stepIngredients = getIngredientsForStep(step.instruction, recipe.ingredients);
  return `Rewrite this cooking instruction for a complete beginner who has never cooked this type of dish before.

Rules:
- Explain every technique in plain language
- Add what to look for (visual, sound, smell cues)
- Add a brief "why" explanation for the technique
- Include safety notes if relevant (hot oil, sharp knives, steam)
- Break compound actions into sub-steps
- Be warm and encouraging but not patronizing
- Keep measurements but add familiar unit equivalents
- Define any unfamiliar ingredients briefly
- DO NOT change the actual cooking action or ingredients
- DO NOT add or remove any ingredients
- Use markdown: bold for sub-step headers, 🔍 for sensory cues, 💡 for "why" notes, ⚠️ for safety

Recipe: ${recipe.title}
Step ${step.id}: "${step.instruction}"
Ingredients in this step: ${
    stepIngredients.length > 0
      ? stepIngredients.map((i) => `${i.name} (${i.amount})`).join(", ")
      : "None specific"
  }`;
}

export function buildAdvancedPrompt(
  step: CookStep,
  recipe: RecipeForAdaptation
): string {
  return `Rewrite this cooking instruction for an experienced cook who is fluent in culinary terminology.

Rules:
- Use professional culinary terms (sear, deglaze, reduce, fond, etc.)
- Be concise — remove filler and obvious steps
- Combine simple sequential actions into single sentences
- Assume knowledge of basic techniques
- Include pro nuances where relevant (e.g. "in batches to avoid steaming")
- Temperature can be precise (Celsius and Fahrenheit)
- DO NOT change the actual cooking action or ingredients
- Keep it to 1-2 sentences maximum

Recipe: ${recipe.title}
Step ${step.id}: "${step.instruction}"`;
}

/* ── Adaptation Pipeline ───────────────────────────────────────── */

/**
 * Adapt a single recipe's steps to all three tiers.
 * The `callAI` callback should call Claude/GPT and return the rewritten text.
 */
export async function adaptRecipeLanguage(
  recipe: RecipeForAdaptation,
  callAI: (prompt: string) => Promise<string>
): Promise<CookStep[]> {
  const adaptedSteps: CookStep[] = [];

  for (const step of recipe.steps) {
    // Home Cook = API original (no change)
    const beginnerPrompt = buildBeginnerPrompt(step, recipe);
    const advancedPrompt = buildAdvancedPrompt(step, recipe);

    const [firstSteps, chefsTable] = await Promise.all([
      callAI(beginnerPrompt),
      callAI(advancedPrompt),
    ]);

    adaptedSteps.push({
      ...step,
      instructionFirstSteps: firstSteps,
      instructionChefsTable: chefsTable,
    });
  }

  return adaptedSteps;
}

/* ── Action Verb Highlighting (build-time) ─────────────────────── */

const COOKING_ACTIONS = [
  "heat", "preheat", "warm",
  "sear", "brown", "char", "crisp", "caramelize",
  "boil", "simmer", "poach", "blanch", "steam", "braise", "stew",
  "bake", "roast", "grill", "broil", "toast", "smoke",
  "sauté", "saute", "fry", "stir-fry", "pan-fry", "deep-fry",
  "combine", "mix", "stir", "whisk", "fold", "toss", "blend", "puree",
  "chop", "dice", "mince", "slice", "julienne", "cut", "tear", "shred",
  "drain", "strain", "reduce", "deglaze",
  "soak", "marinate", "brine", "season", "coat", "dredge", "rub",
  "add", "pour", "place", "layer", "spread", "arrange",
  "serve", "plate", "garnish", "drizzle", "sprinkle", "remove", "discard",
  "knead", "roll", "shape", "press", "flatten", "stuff", "wrap",
  "temper", "emulsify", "infuse", "rest", "cool", "chill", "freeze",
];

/**
 * Wrap action verbs in **bold** markdown markers.
 * First occurrence per sentence only, whole words, case-insensitive.
 */
export function highlightActions(text: string): string {
  // Split into sentences
  const sentences = text.split(/(?<=[.!?])\s+/);
  const sortedActions = [...COOKING_ACTIONS].sort((a, b) => b.length - a.length);

  return sentences
    .map((sentence) => {
      const used = new Set<string>();
      let result = sentence;

      for (const action of sortedActions) {
        const lower = action.toLowerCase();
        if (used.has(lower)) continue;

        const regex = new RegExp(`\\b(${action.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})\\b`, "i");
        const match = result.match(regex);
        if (match) {
          used.add(lower);
          result = result.replace(regex, "**$1**");
        }
      }

      return result;
    })
    .join(" ");
}

/* ── CLI Entry Point ───────────────────────────────────────────── */

// When run directly as a script, this would:
// 1. Connect to the database
// 2. Fetch all recipes
// 3. For each recipe, call adaptRecipeLanguage with a Claude API callback
// 4. Update the database with the adapted steps
//
// Example:
//
//   import Anthropic from "@anthropic-ai/sdk";
//   const client = new Anthropic();
//
//   async function callClaude(prompt: string): Promise<string> {
//     const response = await client.messages.create({
//       model: "claude-haiku-4-5-20251001",
//       max_tokens: 1024,
//       messages: [{ role: "user", content: prompt }],
//     });
//     return response.content[0].type === "text" ? response.content[0].text : "";
//   }
//
//   // Then for each recipe:
//   const adapted = await adaptRecipeLanguage(recipe, callClaude);
//   await db.update(recipesTable).set({ steps: adapted }).where(eq(recipesTable.id, recipe.id));
