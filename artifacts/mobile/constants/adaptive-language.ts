/**
 * Adaptive Cooking Language
 *
 * Provides action-verb highlighting and tier-based instruction selection.
 * Three tiers: First Steps (beginner), Home Cook (intermediate), Chef's Table (advanced).
 * The API text is written for Home Cook. Beginner and advanced rewrites are stored
 * alongside the original in each step's data.
 */

import type { CookingLevel } from "@/contexts/AppContext";

/* ── Action verb list ─────────────────────────────────────────── */

export const COOKING_ACTIONS = [
  // Heat
  "heat", "preheat", "warm",
  // Sear / brown
  "sear", "brown", "char", "crisp", "caramelize",
  // Liquid cooking
  "boil", "simmer", "poach", "blanch", "steam", "braise", "stew",
  // Dry cooking
  "bake", "roast", "grill", "broil", "toast", "smoke",
  // Pan cooking
  "sauté", "saute", "fry", "stir-fry", "pan-fry", "deep-fry",
  // Mixing
  "combine", "mix", "stir", "whisk", "fold", "toss", "blend", "puree",
  // Cutting
  "chop", "dice", "mince", "slice", "julienne", "cut", "tear", "shred",
  // Liquid management
  "drain", "strain", "reduce", "deglaze",
  // Prep
  "soak", "marinate", "brine", "season", "coat", "dredge", "rub",
  // Assembly
  "add", "pour", "place", "layer", "spread", "arrange",
  // Finishing
  "serve", "plate", "garnish", "drizzle", "sprinkle", "remove", "discard",
  // Technique
  "knead", "roll", "shape", "press", "flatten", "stuff", "wrap",
  "temper", "emulsify", "infuse", "rest", "cool", "chill", "freeze",
];

// Pre-build a Set for fast whole-word lookup
const ACTION_SET = new Set(COOKING_ACTIONS.map((a) => a.toLowerCase()));

/**
 * Segment types for rendering highlighted instruction text.
 * - "text" segments render in default style
 * - "action" segments render in bold terracotta
 */
export interface InstructionSegment {
  type: "text" | "action";
  value: string;
}

/**
 * Parse instruction text into segments with action verbs marked for highlighting.
 *
 * Rules per spec:
 * - Bold only the first occurrence of each action verb per sentence
 * - Match whole words only ("heat" but not "wheat")
 * - Case-insensitive matching, preserve original casing
 */
export function parseActionVerbs(text: string): InstructionSegment[] {
  if (!text) return [];

  // Split into sentences, process each, then recombine
  // We process sentence-by-sentence to enforce "first occurrence per sentence" rule
  const sentences = splitSentences(text);
  const allSegments: InstructionSegment[] = [];

  for (const sentence of sentences) {
    const highlighted = highlightSentence(sentence);
    allSegments.push(...highlighted);
  }

  return mergeAdjacentText(allSegments);
}

/**
 * Split text into sentence-ish chunks, preserving delimiters.
 * Handles ".", "!", "?" followed by space or end-of-string.
 */
function splitSentences(text: string): string[] {
  const parts: string[] = [];
  let current = "";

  for (let i = 0; i < text.length; i++) {
    current += text[i];
    if (
      (text[i] === "." || text[i] === "!" || text[i] === "?") &&
      (i + 1 >= text.length || text[i + 1] === " " || text[i + 1] === "\n")
    ) {
      // Include trailing whitespace in this sentence chunk
      while (i + 1 < text.length && (text[i + 1] === " " || text[i + 1] === "\n")) {
        i++;
        current += text[i];
      }
      parts.push(current);
      current = "";
    }
  }
  if (current) parts.push(current);

  return parts;
}

/**
 * Highlight action verbs in a single sentence.
 * Only the first occurrence of each unique action verb gets highlighted.
 */
function highlightSentence(sentence: string): InstructionSegment[] {
  const segments: InstructionSegment[] = [];
  const usedActions = new Set<string>();

  // Use word-boundary regex to find whole words
  // \b doesn't work perfectly with accented chars, so we do manual boundary checks
  let remaining = sentence;
  let lastIndex = 0;

  // Build a regex that matches any action verb as a whole word
  // Sort by length descending so longer matches win (e.g. "stir-fry" before "stir")
  const sortedActions = [...COOKING_ACTIONS].sort((a, b) => b.length - a.length);
  const pattern = new RegExp(
    `\\b(${sortedActions.map(escapeRegex).join("|")})\\b`,
    "gi"
  );

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(sentence)) !== null) {
    const word = match[1];
    const wordLower = word.toLowerCase();

    // Only highlight first occurrence per sentence
    if (usedActions.has(wordLower)) continue;
    usedActions.add(wordLower);

    // Add text before this match
    if (match.index > lastIndex) {
      segments.push({ type: "text", value: sentence.slice(lastIndex, match.index) });
    }

    // Add the action verb segment (preserving original casing)
    segments.push({ type: "action", value: word });
    lastIndex = match.index + word.length;
  }

  // Add remaining text
  if (lastIndex < sentence.length) {
    segments.push({ type: "text", value: sentence.slice(lastIndex) });
  }

  return segments;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Merge adjacent text segments to keep the array compact */
function mergeAdjacentText(segments: InstructionSegment[]): InstructionSegment[] {
  const merged: InstructionSegment[] = [];
  for (const seg of segments) {
    const last = merged[merged.length - 1];
    if (last && last.type === "text" && seg.type === "text") {
      last.value += seg.value;
    } else {
      merged.push({ ...seg });
    }
  }
  return merged;
}

/* ── Tier mapping ─────────────────────────────────────────────── */

export type CookingTier = "first_steps" | "home_cook" | "chefs_table";

/** Map the app's CookingLevel to the spec's tier names */
export function levelToTier(level: CookingLevel): CookingTier {
  switch (level) {
    case "beginner":
      return "first_steps";
    case "intermediate":
      return "home_cook";
    case "advanced":
      return "chefs_table";
  }
}

/** Display labels for each tier */
export const TIER_LABELS: Record<CookingTier, { emoji: string; name: string }> = {
  first_steps: { emoji: "🌱", name: "First Steps" },
  home_cook: { emoji: "🍳", name: "Home Cook" },
  chefs_table: { emoji: "👨‍🍳", name: "Chef's Table" },
};

/** Extended step interface with adaptive text fields */
export interface AdaptiveStep {
  id: string;
  title: string;
  instruction: string;           // Home Cook (API original)
  instructionFirstSteps?: string; // Beginner adaptation
  instructionChefsTable?: string; // Advanced adaptation
  materials: string[];
}

/**
 * Select the appropriate instruction text for the user's tier.
 * Falls back to the original instruction if an adaptation isn't available.
 */
export function getAdaptiveInstruction(
  step: { instruction: string; instructionFirstSteps?: string; instructionChefsTable?: string },
  tier: CookingTier
): string {
  switch (tier) {
    case "first_steps":
      return step.instructionFirstSteps || step.instruction;
    case "chefs_table":
      return step.instructionChefsTable || step.instruction;
    case "home_cook":
    default:
      return step.instruction;
  }
}

/* ── Tier auto-progression ────────────────────────────────────── */

export interface TierProgressionResult {
  shouldLevelUp: boolean;
  newTier: CookingTier;
}

/**
 * Check if the user has crossed a tier threshold.
 *
 * Transitions:
 *   🌱 → 🍳 : 10 recipes across 2+ cuisines
 *   🍳 → 👨‍🍳 : 40 recipes across 5+ cuisines (including 5+ intermediate/advanced)
 */
export function checkTierProgression(
  currentTier: CookingTier,
  recipesCompleted: number,
  cuisinesCount: number,
  _hardRecipesCount?: number
): TierProgressionResult {
  const hardRecipes = _hardRecipesCount ?? 0;

  if (currentTier === "first_steps" && recipesCompleted >= 10 && cuisinesCount >= 2) {
    return { shouldLevelUp: true, newTier: "home_cook" };
  }

  if (
    currentTier === "home_cook" &&
    recipesCompleted >= 40 &&
    cuisinesCount >= 5 &&
    hardRecipes >= 5
  ) {
    return { shouldLevelUp: true, newTier: "chefs_table" };
  }

  return { shouldLevelUp: false, newTier: currentTier };
}
