export interface TechniqueVideo {
  id: string;
  title: string;
  subtitle: string;
  duration: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  cuisine: string | null;
  thumbnailUrl: string;
  videoUrl: string;
  relatedRecipeIds: string[];
  tags: string[];
  /** Maps to CookStep action keywords for contextual matching */
  actionKeywords: string[];
}

/** Action keyword → technique video mapping for Cook Mode hints */
export const ACTION_TECHNIQUE_MAP: Record<string, string> = {
  sear: "searing-technique",
  soak: "hydrating-ingredients",
  puree: "blender-technique",
  simmer: "low-and-slow",
  boil: "boiling-technique",
  saute: "saute-fundamentals",
  sauté: "saute-fundamentals",
  chop: "knife-skills-basic",
  dice: "knife-skills-basic",
  mince: "knife-skills-basic",
  slice: "knife-skills-basic",
  julienne: "knife-skills-basic",
  knead: "dough-kneading",
  fold: "folding-technique",
  temper: "tempering-technique",
  toast: "toasting-spices",
  fry: "heat-control",
  roast: "heat-control",
  bake: "heat-control",
  whisk: "emulsification",
  emulsify: "emulsification",
};

export const TECHNIQUE_VIDEOS: TechniqueVideo[] = [
  {
    id: "knife-skills-basic",
    title: "Knife Skills: The Basic Cuts",
    subtitle: "Master the dice, julienne, and chiffonade",
    duration: "4:30",
    difficulty: "Beginner",
    cuisine: null,
    thumbnailUrl: "https://images.unsplash.com/photo-1566454544259-f4b94c3d758c?w=400&q=80&fit=crop",
    videoUrl: "https://www.youtube.com/watch?v=dCGS067s0zo",
    relatedRecipeIds: [],
    tags: ["knife", "prep", "vegetables", "fundamentals"],
    actionKeywords: ["chop", "dice", "mince", "slice", "julienne"],
  },
  {
    id: "searing-technique",
    title: "The Perfect Sear",
    subtitle: "Golden crust, juicy interior every time",
    duration: "3:15",
    difficulty: "Intermediate",
    cuisine: null,
    thumbnailUrl: "https://images.unsplash.com/photo-1432139509613-5c4255a78e03?w=400&q=80&fit=crop",
    videoUrl: "https://www.youtube.com/watch?v=example-sear",
    relatedRecipeIds: [],
    tags: ["sear", "meat", "heat", "technique"],
    actionKeywords: ["sear"],
  },
  {
    id: "heat-control",
    title: "Heat Control Mastery",
    subtitle: "Searing vs saut\u00e9ing, reading oil temperature",
    duration: "5:00",
    difficulty: "Beginner",
    cuisine: null,
    thumbnailUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80&fit=crop",
    videoUrl: "https://www.youtube.com/watch?v=example-heat",
    relatedRecipeIds: [],
    tags: ["heat", "temperature", "stovetop", "fundamentals"],
    actionKeywords: ["fry", "roast", "bake"],
  },
  {
    id: "perfect-rice",
    title: "Perfect Rice Every Time",
    subtitle: "Never sticky, never burnt",
    duration: "3:45",
    difficulty: "Beginner",
    cuisine: null,
    thumbnailUrl: "https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=400&q=80&fit=crop",
    videoUrl: "https://www.youtube.com/watch?v=example-rice",
    relatedRecipeIds: [],
    tags: ["rice", "grains", "staples"],
    actionKeywords: [],
  },
  {
    id: "pasta-al-dente",
    title: "Pasta Al Dente",
    subtitle: "Timing, salting, and emulsifying pasta water",
    duration: "4:00",
    difficulty: "Beginner",
    cuisine: "Italian",
    thumbnailUrl: "https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=400&q=80&fit=crop",
    videoUrl: "https://www.youtube.com/watch?v=example-pasta",
    relatedRecipeIds: ["classic-garlic-bread", "pizzoccheri-alla-valtellinese"],
    tags: ["pasta", "italian", "boiling", "timing"],
    actionKeywords: [],
  },
  {
    id: "toasting-spices",
    title: "Toasting Whole Spices",
    subtitle: "Unlock deeper flavor from your spice cabinet",
    duration: "2:30",
    difficulty: "Beginner",
    cuisine: null,
    thumbnailUrl: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80&fit=crop",
    videoUrl: "https://www.youtube.com/watch?v=example-spice",
    relatedRecipeIds: [],
    tags: ["spice", "toasting", "flavor", "dry-heat"],
    actionKeywords: ["toast"],
  },
  {
    id: "saute-fundamentals",
    title: "Saut\u00e9 Fundamentals",
    subtitle: "The toss, the heat, the timing",
    duration: "3:00",
    difficulty: "Beginner",
    cuisine: null,
    thumbnailUrl: "https://images.unsplash.com/photo-1607116667981-ff71fc79ed5d?w=400&q=80&fit=crop",
    videoUrl: "https://www.youtube.com/watch?v=example-saute",
    relatedRecipeIds: [],
    tags: ["saute", "pan", "vegetables", "technique"],
    actionKeywords: ["saute", "saut\u00e9"],
  },
  {
    id: "emulsification",
    title: "Sauces & Emulsification",
    subtitle: "Roux, vinaigrettes, and pan sauces from fond",
    duration: "5:30",
    difficulty: "Intermediate",
    cuisine: null,
    thumbnailUrl: "https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=400&q=80&fit=crop",
    videoUrl: "https://www.youtube.com/watch?v=example-sauce",
    relatedRecipeIds: [],
    tags: ["sauce", "emulsion", "roux", "vinaigrette"],
    actionKeywords: ["whisk", "emulsify"],
  },
  {
    id: "low-and-slow",
    title: "Low & Slow: Controlling Heat",
    subtitle: "Braising, simmering, and stewing mastery",
    duration: "4:15",
    difficulty: "Intermediate",
    cuisine: null,
    thumbnailUrl: "https://images.unsplash.com/photo-1534939561126-855b8675edd7?w=400&q=80&fit=crop",
    videoUrl: "https://www.youtube.com/watch?v=example-simmer",
    relatedRecipeIds: [],
    tags: ["simmer", "braise", "stew", "slow-cook"],
    actionKeywords: ["simmer"],
  },
  {
    id: "boiling-technique",
    title: "Rolling Boil vs Gentle Boil",
    subtitle: "Know which boil your recipe needs",
    duration: "2:00",
    difficulty: "Beginner",
    cuisine: null,
    thumbnailUrl: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400&q=80&fit=crop",
    videoUrl: "https://www.youtube.com/watch?v=example-boil",
    relatedRecipeIds: [],
    tags: ["boil", "water", "temperature"],
    actionKeywords: ["boil"],
  },
  {
    id: "dough-kneading",
    title: "Dough Kneading Technique",
    subtitle: "Build gluten structure like a pro",
    duration: "3:30",
    difficulty: "Intermediate",
    cuisine: null,
    thumbnailUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80&fit=crop",
    videoUrl: "https://www.youtube.com/watch?v=example-knead",
    relatedRecipeIds: [],
    tags: ["dough", "bread", "kneading", "gluten"],
    actionKeywords: ["knead"],
  },
  {
    id: "folding-technique",
    title: "Folding Technique for Batters",
    subtitle: "Keep the air in, mix gently",
    duration: "2:15",
    difficulty: "Intermediate",
    cuisine: null,
    thumbnailUrl: "https://images.unsplash.com/photo-1486427944544-d2c246c4df14?w=400&q=80&fit=crop",
    videoUrl: "https://www.youtube.com/watch?v=example-fold",
    relatedRecipeIds: [],
    tags: ["fold", "batter", "gentle", "aeration"],
    actionKeywords: ["fold"],
  },
  {
    id: "wok-hei",
    title: "Wok Hei: Breath of the Wok",
    subtitle: "High heat stir-fry technique",
    duration: "4:45",
    difficulty: "Advanced",
    cuisine: "Thai",
    thumbnailUrl: "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=400&q=80&fit=crop",
    videoUrl: "https://www.youtube.com/watch?v=example-wok",
    relatedRecipeIds: [],
    tags: ["wok", "stir-fry", "high-heat", "asian"],
    actionKeywords: [],
  },
  {
    id: "tempering-technique",
    title: "Tempering Eggs & Chocolate",
    subtitle: "Gradual heat for silky results",
    duration: "3:00",
    difficulty: "Advanced",
    cuisine: null,
    thumbnailUrl: "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=400&q=80&fit=crop",
    videoUrl: "https://www.youtube.com/watch?v=example-temper",
    relatedRecipeIds: [],
    tags: ["temper", "chocolate", "eggs", "custard"],
    actionKeywords: ["temper"],
  },
  {
    id: "tagine-layering",
    title: "Tagine Layering",
    subtitle: "Building flavor in Moroccan tagine",
    duration: "5:15",
    difficulty: "Advanced",
    cuisine: "Moroccan",
    thumbnailUrl: "https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=400&q=80&fit=crop",
    videoUrl: "https://www.youtube.com/watch?v=example-tagine",
    relatedRecipeIds: [],
    tags: ["tagine", "moroccan", "layering", "braising"],
    actionKeywords: [],
  },
];

/** Find a technique video matching a step instruction */
export function findTechniqueForStep(instruction: string): TechniqueVideo | null {
  const lower = instruction.toLowerCase();
  for (const [keyword, videoId] of Object.entries(ACTION_TECHNIQUE_MAP)) {
    // Match whole word boundaries to avoid false positives
    const regex = new RegExp(`\\b${keyword}\\b`, "i");
    if (regex.test(lower)) {
      const video = TECHNIQUE_VIDEOS.find((v) => v.id === videoId);
      if (video) return video;
    }
  }
  return null;
}
