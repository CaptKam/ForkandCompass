# Fork & Compass — Complete Build Reference

> A premium culinary travel app. 8 countries, 97 curated recipes, adaptive skill-level cooking, full meal planning, and editorial food storytelling.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Monorepo Structure](#monorepo-structure)
3. [Database Schema](#database-schema)
4. [Mobile App — Tabs & Navigation](#mobile-app--tabs--navigation)
5. [Discover Tab (Home)](#discover-tab-home)
6. [Cook Tab](#cook-tab)
7. [Cook Mode (Full-Screen Cooking)](#cook-mode-full-screen-cooking)
8. [Plan Tab](#plan-tab)
9. [Adaptive Language System](#adaptive-language-system)
10. [Technique Videos](#technique-videos)
11. [Unit Conversion Engine](#unit-conversion-engine)
12. [Recipe Context Menu](#recipe-context-menu)
13. [Schedule Sheet](#schedule-sheet)
14. [Itinerary Engine](#itinerary-engine)
15. [Pantry System](#pantry-system)
16. [AppContext — Global State](#appcontext--global-state)
17. [API Server](#api-server)
18. [Admin Dashboard](#admin-dashboard)
19. [Landing Page](#landing-page)
20. [Design Tokens](#design-tokens)
21. [Key File Index](#key-file-index)

---

## Architecture Overview

**Monorepo** managed by pnpm workspaces. Five artifacts run as separate dev servers:

| Artifact | Kind | Package | Port |
|---|---|---|---|
| Mobile app (Expo/React Native) | `mobile` | `@workspace/mobile` | Expo Dev Server |
| Web landing site | `web` | `@workspace/landing` | Vite |
| Express API | `api` | `@workspace/api-server` | Express |
| Admin dashboard | `web` | `@workspace/admin` | Vite |
| Mockup sandbox | `design` | `@workspace/mockup-sandbox` | Vite |

Shared library: `@workspace/db` at `lib/db/` — Drizzle ORM over PostgreSQL.

---

## Monorepo Structure

```
/
├── artifacts/
│   ├── mobile/             # Expo/React Native app
│   │   ├── app/
│   │   │   ├── (tabs)/     # Tab screens (index, cook, plan, profile, saved)
│   │   │   ├── cook-mode.tsx          # Full-screen cooking experience
│   │   │   ├── recipe/[id].tsx        # Recipe detail page
│   │   │   ├── country/[id].tsx       # Country detail page
│   │   │   └── onboarding.tsx         # First-launch onboarding
│   │   ├── components/     # Shared UI components
│   │   ├── constants/      # Static data, adaptive language, techniques, units
│   │   ├── contexts/       # AppContext (global state)
│   │   └── hooks/          # useItinerary, useCountries, useReducedMotion
│   ├── landing/            # Marketing website (React + Vite)
│   ├── api-server/         # Express REST API
│   ├── admin/              # Admin dashboard (React + Vite + Wouter)
│   └── mockup-sandbox/     # Design component previews
├── lib/
│   └── db/                 # Drizzle ORM schema & migrations
│       └── src/schema/     # All table definitions
└── scripts/                # Seed scripts, data normalization
```

---

## Database Schema

PostgreSQL via Drizzle ORM. 14 tables across 10 schema files (400 LOC total).

### Core Tables

**`recipes`** — 97 rows, one per curated recipe
- `id` (text PK, slug format e.g. `classic-individual-tiramisu`)
- `name`, `description`, `country_id`, `region`, `category`, `difficulty`
- `time`, `image`, `cultural_note`, `status`

**`countries`** — 8 rows (Italy, Japan, Morocco, Mexico, India, Thailand, Spain, France)
- `id`, `name`, `region`, `hero_image`, `description`, `flag_emoji`

### Recipe Detail Tables (all FK → `recipes.id`, cascade delete)

| Table | Purpose | Key Columns |
|---|---|---|
| `recipe_meta` | Timing & yield | `active_time`, `passive_time`, `overnight_required`, `yields`, `serving_size_g` |
| `recipe_dietary` | Diet flags | `flags` (jsonb string[]), `not_suitable_for` (jsonb string[]) |
| `recipe_storage` | Leftovers | `fridge_notes`, `fridge_duration`, `freezer_notes`, `reheating`, `does_not_keep` |
| `recipe_equipment` | Tools needed | `name`, `required` (bool), `alternative`, `sort_order` |
| `recipe_ingredient_groups` | Ingredient sections | `group_name`, `sort_order` |
| `recipe_ingredients` | Individual ingredients | `name`, `quantity`, `unit`, `preparation`, `notes`, `substitutions` (jsonb), FK → `ingredient_groups.id` |
| `recipe_instructions` | Step-by-step | `step_number`, `phase`, `text`, **`text_first_steps`**, **`text_chefs_table`**, `action`, `temp_celsius`, `temp_fahrenheit`, `duration`, `doneness_visual`, `doneness_tactile`, `tips` (jsonb) |
| `recipe_troubleshooting` | Common problems | `symptom`, `likely_cause`, `prevention`, `fix` |
| `recipe_chef_notes` | Pro tips | `note`, `sort_order` |
| `recipe_nutrition` | Full nutritional data | 30+ nutrient columns (calories through caffeine), `sources` (jsonb), `updated_at` |

### Other Tables

| Table | Purpose |
|---|---|
| `admin_users` | Dashboard auth |
| `app_users` | Mobile user accounts |
| `app_data` | Key-value app configuration |
| `cooking_history` | Persisted cook sessions |
| `waitlist` | Landing page signups |

---

## Mobile App — Tabs & Navigation

Five bottom tabs: **Discover** (home icon), **Cook** (flame), **Plan** (calendar), **Saved** (bookmark), **Profile** (person).

Key routes:
- `/(tabs)/index.tsx` — Discover tab (1,837 LOC)
- `/(tabs)/cook.tsx` — Cook tab (765 LOC)
- `/(tabs)/plan.tsx` — Plan tab (1,709 LOC)
- `/cook-mode.tsx` — Full-screen Cook Mode (1,673 LOC)
- `/recipe/[id].tsx` — Recipe detail
- `/country/[id].tsx` — Country detail
- `/onboarding.tsx` — First-launch flow

---

## Discover Tab (Home)

File: `artifacts/mobile/app/(tabs)/index.tsx` (1,837 lines)

A vertically-scrolling editorial magazine experience. Content adapts based on user state (saved recipes, cook history, itinerary, cooking level).

### Sections (in scroll order)

1. **Hero carousel** — Full-bleed country cards with editorial blurbs, auto-advances. Shows country flag, region label, recipe count. Tap → country detail.

2. **Tonight's Plan** — If today has an itinerary entry: shows country flag + recipe card with "Start Cooking" CTA. If no itinerary: shows empty state with "Plan My Week" and "Surprise Me" buttons.

3. **Recently Cooked** — Horizontal scroll of last 5 completed cook sessions. Shows recipe image, name, time-ago label. Only appears if `recentCookSessions` has completed entries.

4. **Cravings / Quick Picks** — Dynamic cuisine filter chips. Shows "New:" badge on unexplored cuisines (not in `cuisinesExplored`). Tapping a chip navigates to that country's detail page.

5. **Jump Back In** — Shows saved recipes the user hasn't cooked yet. Wrapped in `RecipeContextMenu` for long-press actions (schedule, save, grocery, cook now).

6. **Tasting Menu** — Per-country curated 3-recipe tasting flight (starter → main → dessert). Built by `pickTastingMenu()` which picks one from each course category.

7. **Country deep-dive sections** — For each country, shows:
   - Editorial quote with attribution
   - Etiquette tips (icon + title + description)
   - Locations carousel (landmark photos)
   - Spice market items
   - Heritage items with badges
   - Traveler reviews
   - Street food cards (with country flag badge + context menu)
   - Related stories linking to other countries

8. **Seasonal / Editorial Picks** — Static monthly editorial card (e.g. "March: Spring Awakening").

### Data Sources
- `useApp()` → `savedRecipeIds`, `isSaved()`, `cuisinesExplored`, `currentItinerary`, `recentCookSessions`, `cookingProfile`
- `useCountries()` → country data with recipes
- `COUNTRIES`, `ONBOARDING_IMAGES`, `LANDMARK_IMAGES` from `@/constants/data`
- `buildDiscoverData()` — generates per-country editorial content (quotes, etiquette, spice market, reviews, street food)
- `EDITORIAL_BLURBS` — one-liner per country for hero cards

---

## Cook Tab

File: `artifacts/mobile/app/(tabs)/cook.tsx` (765 lines)

The "command center" for active cooking. Priority-based card system:

### Priority 1 (mutually exclusive — only one shows)

**Active Cook Session** — If `activeCookSession` is not null:
- Shows recipe name, current step progress, timer status
- "Continue Cooking →" button resumes cook-mode at saved step
- "Abandon this session" link (with confirmation alert)

**Tonight's Recipe** — If no active session but today's itinerary has a recipe:
- Hero image, recipe name, origin, cook time
- Serving count from `itineraryProfile.defaultServings`
- "Start Cooking →" button

**What Should We Cook?** — If neither of above:
- "Surprise me" button → picks random recipe filtered by skill level
- "Browse" button → navigates to Discover tab

### Priority 2 — Always visible

**Your Level** — Compact inline bar showing:
- Level name + number (e.g. "Home Cook · Level 3")
- Progress bar toward next level
- Stats: recipes cooked + cuisines explored

### Priority 3 — Conditional

**Recently Cooked** — Horizontal scroll of last 5 completed recipes (same as Discover tab, different styling)

**Start With These** — Shows for new users (< 3 recipes cooked, no recent history). Curated beginner-friendly recipes: Pasta Aglio e Olio, Pad Thai, Guacamole, Cacio e Pepe, Miso Soup, Chicken Tikka Masala.

### Priority 4 — Collapsible

**Techniques** — Expandable section listing all technique videos with thumbnails, titles, durations. Shows video count in header.

---

## Cook Mode (Full-Screen Cooking)

File: `artifacts/mobile/app/cook-mode.tsx` (1,673 lines)

Immersive step-by-step cooking experience. Screen stays awake (`useKeepAwake`). Animated step transitions (swipe left/right with Reanimated).

### Pre-Cook: Advance Prep Warning
If recipe has overnight/long-wait steps, shows a "Heads Up" screen before cooking starts:
- Lists steps requiring advance prep with durations
- "I'm ready — Start Cooking" button
- "Start prep now" button (jumps to first prep step)
- "Go back" link

### Step View (main cooking UI)

**Header bar:**
- Close button (with save-progress confirmation if mid-cook)
- Step counter ("Step 3 of 8")
- Recipe name
- Help button (opens troubleshooting/tips sheet)
- Timer pill (shows "Start" if step has duration, countdown when running, "Done!" when complete)

**Phase indicator:** Color-coded pill — PREP (cream), COOK (warm peach `#FEF0E6`), FINISH (green `#EEFAF2`)

**Instruction text:** Adaptive text based on user's cooking tier. Action verbs highlighted in bold terracotta using `parseActionVerbs()`.

**Timer section** (when active):
- Large countdown digits
- Progress bar
- Pause/Start and Reset buttons
- Timer name (auto-generated from step context)

**Bento grid** (contextual, side-by-side cards):
- **Video Technique** — Shows if technique video matches step keywords AND user is beginner/intermediate. Thumbnail with play button overlay.
- **Doneness Cue** — Extracted from "until..." phrases in instruction text. Shows as a visual cue card.

**First-step chef note:** "Read all the steps before you start" — only on step 0.

**Per-step ingredients:** Checkbox list of ingredients mentioned in current step text. Shows ingredient name + converted amount. Matched by scanning instruction text for ingredient names.

**Equipment list:** Shows required materials for current step.

**Bottom navigation:**
- Progress dots (variable width, completed/active/upcoming states)
- Prev/Next buttons with directional arrows
- "Finish" button on last step (checkmark icon, green style)

### Contextual Tips System
26 technique-specific tips mapped to cooking action keywords:
- `sear` → "Don't overcrowd the pan when searing..."
- `simmer` → "A gentle simmer means small, occasional bubbles..."
- `boil` → "Always salt your water generously..."
- `knead` → "Dough is ready when it springs back slowly..."
- etc.

Max 2 tips shown per step, matched by scanning instruction text for keywords.

### Help Sheet (Bottom sheet overlay)
Two-segment tabbed view:

**Troubleshooting tab:**
- "Dish tastes bland?" → Under-seasoned fix
- "Ingredients burning?" → Heat too high fix
- "Sauce too thin?" → Reduction time fix
- "Texture is off?" → Overcooking/under-resting fix

**Chef Tips tab:**
- General pro tips (taste as you go, mise en place, pan temperature, resting proteins)
- Cultural note for the recipe (if available)

### Completion Screen
After finishing all steps:
- "Well done." headline
- Recipe name, origin, time, difficulty
- "Cuisine #N explored" badge if new cuisine
- Star rating (1-5, tappable)
- Feedback chips: "Too salty", "Perfect", "Bland", "Too spicy", "Undercooked"
- "Done" button → saves CookSession, clears active session, navigates back

### State Management
- `CookSession` persisted with: id, recipeId, recipeName, cuisine, difficulty, startedAt, completedAt, totalTime, rating, feedback[], stepsCompleted, totalSteps
- `ActiveCookSession` tracked in real-time: recipeId, recipeName, currentStep, totalSteps, timerRemaining, timerRunning, startedAt, servings
- Timer uses `setInterval` with 1-second ticks, haptic feedback on completion

---

## Plan Tab

File: `artifacts/mobile/app/(tabs)/plan.tsx` (1,709 lines)

Weekly meal planning with grocery list management.

### Itinerary Setup (first use)
If no `itineraryProfile` set, shows setup flow:
- Cooking days selector: 3, 5, or 7 days/week
- Time preference: Quick (≤30 min), Moderate (≤60 min), Relaxed (no limit)
- Adventurousness: Familiar (selected countries only), Mixed (mostly selected + some new), Surprise Me (all countries)
- Default servings: stepper control

### This Week View
Shows all 7 days of the week (Monday through Sunday), regardless of how many cooking days were selected:

**Active meal days:** Full recipe card with:
- Country flag + name
- Recipe name, difficulty, cook time
- Quick/Full mode toggle
- Skip day button
- Reload button (picks new country, avoids adjacent repeats)

**Empty days (no meal planned):** "No meal planned" in muted text + terracotta "+ Add meal" button. Tapping adds a random recipe from user's preferred countries and auto-adds ingredients to grocery list.

**Skipped days:** "Skipped" label with "Restore" button.

### Grocery List
Auto-managed — ingredients added/removed automatically when:
- New week generated
- Day reloaded
- Day skipped/restored
- Meal added to empty day

**Categorized display:**
- 🥬 Produce (tomatoes, basil, garlic, onion, pepper, herbs...)
- 🥩 Protein (chicken, pork, beef, fish, shrimp, tofu...)
- 🧈 Dairy (cheese, cream, milk, butter, yogurt...)
- 🫙 Pantry (oil, vinegar, flour, rice, noodles, spices...)
- ✨ Other (uncategorized)

Each item shows: name, amount (unit-converted), recipe source. Checkbox to mark as bought. Swipe-to-delete available.

**Pantry staples** section at bottom — common items (salt, pepper, olive oil, etc.) that don't need to be bought every time.

### Partner Integration
Instacart "Order Ingredients" button — sends grocery list items to Instacart API for direct ordering.

---

## Adaptive Language System

File: `artifacts/mobile/constants/adaptive-language.ts` (262 lines)

Three skill tiers with distinct instruction voices:

| Tier | Level | Voice Style |
|---|---|---|
| 🌱 First Steps | Beginner | Encouraging, explains WHY, gentle pacing |
| 🍳 Home Cook | Intermediate | Standard recipe language (API original text) |
| 👨‍🍳 Chef's Table | Advanced | Terse, chef vocabulary, precision temps |

### How It Works

1. **`levelToTier(cookingLevel)`** — Maps app's `CookingLevel` ("beginner" / "intermediate" / "advanced") to tier names ("first_steps" / "home_cook" / "chefs_table")

2. **`getAdaptiveInstruction(step, tier)`** — Selects the right instruction text:
   - First Steps → `step.instructionFirstSteps` (fallback: original)
   - Home Cook → `step.instruction` (always the API original)
   - Chef's Table → `step.instructionChefsTable` (fallback: original)

3. **`parseActionVerbs(text)`** — Parses instruction text into segments for rendering:
   - Splits text into sentences
   - Identifies cooking action verbs (80+ verbs in `COOKING_ACTIONS` list)
   - Only highlights first occurrence per sentence per verb
   - Whole-word matching only ("heat" but not "wheat")
   - Returns `InstructionSegment[]` with `type: "text" | "action"`

### Tier Auto-Progression

**`checkTierProgression()`** — Automatic level-up checks:
- 🌱 → 🍳: 10 recipes completed across 2+ cuisines
- 🍳 → 👨‍🍳: 40 recipes completed across 5+ cuisines, including 5+ hard recipes

### Action Verb Vocabulary (80+ verbs)

Organized by technique:
- **Heat:** heat, preheat, warm
- **Sear/Brown:** sear, brown, char, crisp, caramelize
- **Liquid:** boil, simmer, poach, blanch, steam, braise, stew
- **Dry:** bake, roast, grill, broil, toast, smoke
- **Pan:** sauté, fry, stir-fry, pan-fry, deep-fry
- **Mixing:** combine, mix, stir, whisk, fold, toss, blend, puree
- **Cutting:** chop, dice, mince, slice, julienne, cut, tear, shred
- **Liquid mgmt:** drain, strain, reduce, deglaze
- **Prep:** soak, marinate, brine, season, coat, dredge, rub
- **Assembly:** add, pour, place, layer, spread, arrange
- **Finishing:** serve, plate, garnish, drizzle, sprinkle, remove, discard
- **Technique:** knead, roll, shape, press, flatten, stuff, wrap, temper, emulsify, infuse, rest, cool, chill, freeze

---

## Technique Videos

File: `artifacts/mobile/constants/techniques.ts` (252 lines)

Curated technique video library with contextual linking to cook mode steps.

### Video Catalog

Each video has: id, title, subtitle, duration, difficulty level, cuisine affinity, thumbnail URL, video URL, related recipe IDs, tags, action keywords.

### Action → Technique Mapping

`ACTION_TECHNIQUE_MAP` links cooking verbs to relevant technique videos:
- `sear` → "searing-technique" (The Perfect Sear, 3:15)
- `chop/dice/mince/slice/julienne` → "knife-skills-basic" (Knife Skills: The Basic Cuts, 4:30)
- `simmer` → "low-and-slow"
- `knead` → "dough-kneading"
- `toast` → "toasting-spices"
- `whisk/emulsify` → "emulsification"
- `fry/roast/bake` → "heat-control"
- `fold` → "folding-technique"
- `temper` → "tempering-technique"
- `soak` → "hydrating-ingredients"
- `puree` → "blender-technique"
- `saute/sauté` → "saute-fundamentals"

### Contextual Display Logic (Cook Mode)
`findTechniqueForStep(instructionText)` scans step text for action keywords. Video hint card shows in Cook Mode when:
- A matching technique video exists for the step AND
- User is level ≤ 2 (always show) OR level ≤ 4 and technique isn't "Beginner" difficulty

---

## Unit Conversion Engine

File: `artifacts/mobile/constants/units.ts` (310 lines)

Full measurement system and temperature conversion.

### Supported Systems
- **US Customary** (cups, tablespoons, teaspoons, ounces, pounds, quarts, gallons, fluid ounces)
- **Metric** (grams, kilograms, milliliters, liters)
- **Imperial UK** (same as US but with imperial fluid ounce conversion)
- **Show Both** (displays US and metric side by side)

### Features
- `parseAmount(raw)` — Parses strings like "200g", "1 cup", "2 tbsp", "1/2" into `{ quantity, unit, rest }`
- `convertAmount(amount, system)` — Converts ingredient amounts between measurement systems
- `convertTemperatureInText(text, unit)` — Finds temperature mentions in instruction text and converts between °F and °C
- `toFriendlyNumber(value)` — Renders fractions as Unicode symbols (¼, ½, ⅓, ¾, ⅛, etc.) with configurable tolerance

---

## Recipe Context Menu

File: `artifacts/mobile/components/RecipeContextMenu.tsx` (173 lines)

Long-press context menu wrapper for any recipe card. Used throughout Discover tab, Saved tab, and Plan tab.

### Actions (in order)
1. **Schedule this recipe** — Opens ScheduleSheet modal
2. **Save / Remove from Saved** — Toggles bookmark state
3. **Add to grocery list** — Adds all recipe ingredients to grocery
4. **Cook now** — Navigates directly to Cook Mode

### UX Details
- Long-press delay: 400ms
- Medium haptic feedback on activation
- Success haptic on save/grocery actions
- Modal overlay with 40% black backdrop
- Sheet width: 280px, 16px border radius

---

## Schedule Sheet

File: `artifacts/mobile/components/ScheduleSheet.tsx` (433 lines)

Bottom-sheet modal for scheduling a recipe to a specific day.

### Features
- Shows this week and next week as day slots (Monday–Sunday)
- Each day shows existing recipe if scheduled, or "Available" if open
- Past days and today are disabled (can't schedule in the past)
- Servings adjuster (stepper)
- Option to add ingredients to grocery list when scheduling
- Creates/updates `ItineraryDay` entry with recipe assigned

---

## Itinerary Engine

File: `artifacts/mobile/hooks/useItinerary.ts` (253 lines)

Generates and manages weekly meal plans.

### Core Types

```typescript
interface ItineraryProfile {
  cookingDays: 3 | 5 | 7;
  timePreference: "quick" | "moderate" | "relaxed";
  adventurousness: "familiar" | "mixed" | "surprise";
  defaultServings: number;
}

interface ItineraryDay {
  id: string;
  date: string;          // ISO YYYY-MM-DD
  dayLabel: string;      // "Mon", "Tue", etc.
  countryId: string;
  regionId: string;
  quickRecipeIds: string[];
  fullRecipeIds: string[];
  mode: "quick" | "full";
  status: "active" | "skipped" | "completed";
}
```

### Generation Algorithm (`generateItinerary`)

1. **Build country pool** based on adventurousness:
   - Familiar: only user's selected countries
   - Mixed: selected + ~30% random others
   - Surprise: all 8 countries

2. **Avoid history**: deprioritize countries from previous weeks

3. **Pick N countries** (N = cookingDays), no back-to-back repeats

4. **Map to weekday indices:**
   - 3 days → Mon, Wed, Fri
   - 5 days → Mon–Fri
   - 7 days → Mon–Sun

5. **Pick recipes per day** (`pickRecipesForDay`):
   - Filter by time preference
   - Quick mode: 1 appetizer/starter + 1 main (eating order)
   - Full mode: all country recipes sorted by eating order

### Eating Order (course sorting)
Appetizer → Soup → Salad → Side Dish → Baked Good → Lunch/Brunch → Main Course → Dessert → Beverage → Condiment/Base/Preserve

### Day Reload (`reloadDay`)
Picks a new country for a specific day, avoiding adjacent countries and the current country. Rebuilds recipe picks using same time preference.

---

## Pantry System

File: `artifacts/mobile/constants/pantry.ts` (192 lines)

Defines common pantry staples that users likely already have. Used in grocery list to separate "need to buy" from "already have" items.

---

## AppContext — Global State

File: `artifacts/mobile/contexts/AppContext.tsx`

Central React Context providing all app state. Persisted to AsyncStorage.

### Key State & Methods

| State | Type | Description |
|---|---|---|
| `savedRecipeIds` | `string[]` | Bookmarked recipe IDs |
| `cookingLevel` | `"beginner" \| "intermediate" \| "advanced"` | Current skill tier |
| `cookingProfile` | `CookingProfile` | Level name, number, XP, recipes completed, cuisines explored |
| `currentItinerary` | `ItineraryDay[]` | This week's meal plan |
| `itineraryHistory` | `ItineraryDay[][]` | Past weeks' plans |
| `itineraryProfile` | `ItineraryProfile \| null` | Meal plan preferences |
| `cookSessions` | `CookSession[]` | All cook session history (last 50) |
| `activeCookSession` | `ActiveCookSession \| null` | Currently in-progress cook |
| `recentCookSessions` | `CookSession[]` | Last 5 completed sessions |
| `measurementSystem` | `MeasurementSystem` | US/Metric/UK/Both |
| `temperatureUnit` | `TemperatureUnit` | Fahrenheit/Celsius |
| `selectedCountryIds` | `string[]` | User's preferred countries |
| `groceryList` | `GroceryItem[]` | Current grocery items |

| Method | Description |
|---|---|
| `toggleSaved(id)` | Add/remove recipe from saved |
| `isSaved(id)` | Check if recipe is saved |
| `addToGrocery(recipe)` | Add all recipe ingredients to grocery list |
| `completeCookSession(session)` | Save completed cook session, update profile |
| `setActiveCookSession(session)` | Track in-progress cook |

### Persistence
All state synced to AsyncStorage with separate keys. Loaded on app start with `loaded` flag to prevent flash of default state.

### Key Types

```typescript
interface CookSession {
  id: string;
  recipeId: string;
  recipeName: string;
  cuisine: string;
  difficulty: string;
  startedAt: string;      // ISO datetime
  completedAt: string | null;
  totalTime: number;      // minutes
  rating: number | null;  // 1-5
  feedback: string[];     // ["Perfect", "Too spicy"]
  stepsCompleted: number;
  totalSteps: number;
}

interface ActiveCookSession {
  recipeId: string;
  recipeName: string;
  currentStep: number;
  totalSteps: number;
  timerRemaining: number | null;
  timerRunning: boolean;
  startedAt: string;
  servings: number;
}
```

---

## API Server

File: `artifacts/api-server/` — Express REST API

### Routes

| Route | File | Purpose |
|---|---|---|
| `GET /health` | `health.ts` | Health check |
| `GET /api/recipes` | `recipes.ts` | List all recipes |
| `GET /api/recipes/search` | `search.ts` | Full-text recipe search |
| `GET /api/countries` | `countries.ts` | List countries with recipe counts |
| `POST /api/waitlist` | `waitlist.ts` | Landing page email signup |
| `GET/PUT /api/admin/*` | `admin.ts` | Admin dashboard CRUD (452 LOC) |
| `POST /api/instacart` | `instacart.ts` | Instacart grocery ordering proxy |
| `GET /api/ninja/*` | `ninja.ts` | API Ninjas nutrition lookup proxy |

### Admin API Endpoints (in `admin.ts`)
- `GET /api/admin/recipes` — List recipes with completion status
- `GET /api/admin/recipes/:id` — Full recipe detail with all related data
- `PUT /api/admin/recipes/:id/instructions/:stepId` — Update instruction text (including adaptive variants)
- `GET /api/admin/stats` — Dashboard statistics

---

## Admin Dashboard

Directory: `artifacts/admin/` — React + Vite + Wouter

### Pages
- **Dashboard** — Recipe completion stats, country breakdown
- **Recipe List** — Filterable table of all 97 recipes with completion indicators
- **Recipe Editor** — Per-recipe instruction editor with skill-level variant fields (`text_first_steps`, `text_chefs_table`)

### Design
- Cream background (`#FEF9F3`)
- Terracotta accents (`#9A4100`)
- Dark sidebar (`#1C1A17`)
- Noto Serif headings
- Wouter v3 routing (note: `<Link>` renders as `<a>`, don't nest)

---

## Landing Page

Directory: `artifacts/landing/` — React + Vite marketing site

### Pages (7 total)
- **Landing** (`LandingPage.tsx`, 373 LOC) — Hero, features, country previews, waitlist CTA
- **Destinations** (`DestinationsPage.tsx`, 148 LOC) — Country grid with recipe counts
- **Features** (`FeaturesPage.tsx`, 104 LOC) — App feature showcase
- **About** (`AboutPage.tsx`, 85 LOC) — Team/mission
- **Press** (`PressPage.tsx`, 122 LOC) — Press mentions
- **Privacy** (`PrivacyPage.tsx`, 112 LOC) — Privacy policy
- **Terms** (`TermsPage.tsx`, 92 LOC) — Terms of service

---

## Design Tokens

### Colors
| Token | Hex | Usage |
|---|---|---|
| Terracotta | `#9A4100` / `#8A3800` | Primary accent, CTAs, highlights |
| Cream | `#FEF9F3` | Background, cards |
| Dark | `#1C1A17` | Primary text |
| Secondary text | `#5C5549` | Muted labels |
| Border | `#E8DFD2` | Card borders, dividers |
| Cook phase bg | `#FEF0E6` | Warm peach for active cooking |
| Finish phase | `#EEFAF2` | Green tint for finishing steps |
| Finish accent | `#2D7A4F` | Green text for completion |

### Typography
- **Noto Serif** (700 Bold, 600 SemiBold) — Headlines, recipe names
- **Inter** (400 Regular, 500 Medium, 600 SemiBold) — Body text, labels, buttons

### Haptics
- `Light` — Standard taps, navigation
- `Medium` — Long-press menus, timer start
- `Success notification` — Completing a cook, saving a recipe

---

## Key File Index

| File | Lines | Purpose |
|---|---|---|
| `mobile/app/cook-mode.tsx` | 1,673 | Full-screen cooking experience |
| `mobile/app/(tabs)/index.tsx` | 1,837 | Discover tab (editorial home) |
| `mobile/app/(tabs)/plan.tsx` | 1,709 | Meal planning + grocery list |
| `mobile/app/(tabs)/cook.tsx` | 765 | Cook tab (session management) |
| `mobile/components/ScheduleSheet.tsx` | 433 | Recipe scheduling modal |
| `mobile/constants/units.ts` | 310 | Unit conversion engine |
| `mobile/constants/adaptive-language.ts` | 262 | Adaptive instruction system |
| `mobile/constants/techniques.ts` | 252 | Technique video catalog |
| `mobile/hooks/useItinerary.ts` | 253 | Itinerary generation |
| `mobile/constants/pantry.ts` | 192 | Pantry staple definitions |
| `mobile/components/RecipeContextMenu.tsx` | 173 | Long-press recipe menu |
| `lib/db/src/schema/recipe-details.ts` | 131 | Recipe detail DB tables |
| `api-server/src/routes/admin.ts` | 452 | Admin API endpoints |

**Total custom code:** ~8,500+ lines across mobile, API, admin, and shared DB.
