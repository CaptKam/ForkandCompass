# The Culinary Editorial — Project Spec & Build Outline

> A premium culinary travel platform: Expo/React Native mobile app, web landing page, and Express API backend — structured as a pnpm monorepo.

---

## 1. Product Overview

**The Culinary Editorial** is a high-end editorial culinary travel app. The aesthetic is inspired by luxury print magazines — warm terracotta palette, serif headlines, generous white space, and rich photography. Users discover countries through a food-first lens, save destinations and recipes, build grocery lists, and step through guided cooking sessions.

---

## 2. Monorepo Structure

```
artifacts-monorepo/
├── artifacts/
│   ├── mobile/          — Expo/React Native app (iOS, Android, Web)
│   ├── landing/         — React + Vite web landing page
│   ├── api-server/      — Express 5 API backend
│   └── mockup-sandbox/  — Component preview/design sandbox (internal)
├── lib/
│   ├── db/              — Drizzle ORM + PostgreSQL schema
│   ├── api-spec/        — OpenAPI 3.1 spec + Orval codegen config
│   ├── api-client-react/— Generated React Query hooks
│   └── api-zod/         — Generated Zod schemas
├── scripts/
│   └── src/seed.ts      — DB seeder (countries + recipes)
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── tsconfig.json
```

**Package manager**: pnpm  
**Node version**: 24  
**TypeScript**: 5.9 (composite project references, `emitDeclarationOnly`)

---

## 3. Design System

| Token | Value |
|---|---|
| Primary (Terracotta) | `#9A4100` |
| Surface (Cream) | `#FEF9F3` |
| Headline font | Noto Serif 700 Bold |
| Body font | Inter 400 Regular / 500 Medium |
| Border rule | None — sections separated by color shifts, not lines |
| Motion | Respects `useReducedMotion()` throughout |

---

## 4. Mobile App — `artifacts/mobile`

### 4.1 Tech Stack

- Expo SDK (managed workflow)
- Expo Router (file-based routing)
- React Native + StyleSheet (no external UI library)
- `expo-blur`, `expo-symbols`, `expo-camera`, `expo-glass-effect`
- `expo-haptics` for tactile feedback
- `react-native-safe-area-context`
- `expo-image` for optimised image loading
- `expo-linear-gradient` for hero overlays
- `AsyncStorage` for persistence (via `AppContext`)

---

### 4.2 Navigation Architecture

```
app/
├── index.tsx              — Welcome / splash gate
├── onboarding.tsx         — Country picker onboarding
├── (tabs)/
│   ├── _layout.tsx        — Tab bar (NativeTabs on iOS 26+ / BlurView classic)
│   ├── index.tsx          — Discover tab
│   ├── search.tsx         — Search tab
│   ├── grocery.tsx        — Grocery tab
│   ├── cook.tsx           — Cook tab
│   └── saved.tsx          — Saved tab
│   └── settings.tsx       — Profile (hidden from tab bar, pushed via router)
├── country/[id].tsx       — Country detail screen
├── recipe/[id].tsx        — Recipe detail screen
├── cook-mode.tsx          — Step-by-step cooking modal
├── kitchen-scanner.tsx    — Kitchen scanner screen (expo-camera)
├── region/[countryId]/[region].tsx     — Regional sub-screen
└── experience/[countryId]/[region].tsx — Experience detail screen
```

**Tab bar behaviour**:
- iOS 26+: `NativeTabs` (liquid glass system chrome, SF Symbols)
- iOS < 26 / Android / Web: `expo-router Tabs` with `BlurView` frosted glass background, `SymbolView` (iOS) or `MaterialIcons` (Android/Web)
- `settings` (Profile) is hidden from the tab bar (`href: null`) and accessed by pressing the avatar icon on the Discover header

---

### 4.3 Global State — `AppContext`

Persisted via `AsyncStorage`:

| State key | Type | Purpose |
|---|---|---|
| `savedRecipeIds` | `string[]` | Bookmarked recipes |
| `savedCountryIds` | `string[]` | Bookmarked countries |
| `groceryItems` | `GroceryItem[]` | Active grocery list |
| `selectedCountryIds` | `string[]` | Countries chosen during onboarding |
| `hasCompletedOnboarding` | `boolean` | Onboarding gate flag |
| `welcomeSeen` | `boolean` | Welcome splash gate flag |
| `cookingLevel` | `"beginner" \| "home-cook" \| "enthusiast"` | User skill level |
| `appearanceMode` | `"light" \| "dark" \| "system"` | Theme preference |
| `inventoryItems` | `InventoryItem[]` | Pantry inventory |

---

### 4.4 Data Layer — `constants/data.ts`

Hardcoded offline dataset (never modified — serves as fallback and seed source):

**Countries** (6): Italy, Japan, Morocco, Mexico, India, Thailand  
Each country has: `id`, `name`, `flag`, `tagline`, `description`, `region`, `image`, `heroImage`, `cuisineLabel`, `rating`, `recipeCount`

**Recipes**: Multiple per country, each with: `id`, `countryId`, `title`, `description`, `image`, `category`, `prepTime`, `cookTime`, `servings`, `difficulty` (`Easy/Medium/Hard`), `ingredients[]`, `steps[]`, `culturalNote`, `tips[]`

**`ONBOARDING_IMAGES`**: High-quality Unsplash hero URLs per country id

---

### 4.5 Screens in Detail

#### Welcome (`app/index.tsx`)
- Checks `welcomeSeen` and `hasCompletedOnboarding`
- Routes to `/onboarding` or `/(tabs)` accordingly
- Full-screen hero with brand mark

---

#### Onboarding (`app/onboarding.tsx`)
- "Where do you want to go?" headline
- Grid of selectable country cards with flag + name
- Checkmark badge appears on selection
- "Start Exploring" CTA writes `selectedCountryIds` + `hasCompletedOnboarding`

---

#### Discover Tab (`app/(tabs)/index.tsx`)

**Hero Carousel** (560 px tall):
- Horizontal paginated `ScrollView` — one slide per country
- Each slide: full-bleed hero image, gradient overlay, country flag emoji, country name + inline bookmark button, editorial blurb, "Let's Go" CTA
- Bookmark icon sits inline right of the country name in a frosted circle; toggling saves/unsaves the country
- Pagination dots at `bottom: 20` (terracotta pill for active, white circle for inactive)
- Header rendered last in JSX (above scroll in touch chain): hamburger menu left, avatar → Profile right

**Explore Destinations strip**:
- Horizontally scrollable country rings
- Each: 94×94 border ring (`destRing`) + 88×88 clipped image circle (`destCircle`) + flag badge
- Active country gets terracotta ring
- Tapping a circle syncs `activeIndex` and scrolls hero

**Below-fold editorial content** (driven by `buildDiscoverData(activeCountry)`):
- Tasting menu course tags (Appetizer, Main Course, Dessert, Signature Dish, Special)
- Featured recipe journal cards — horizontal scroll with difficulty badge
- "Curator's Method" 3-step concept section
- Testimonial pull quote
- CTA section

---

#### Search Tab (`app/(tabs)/search.tsx`)
- `TabHeader` (hamburger + title + avatar → Profile)
- Search bar with `useSearch(query)` hook (searches across countries + recipes)
- Diet filter chips: Vegan, Gluten-Free, Dairy-Free, Keto
- Recent searches: Summer Truffle Pasta, Artisanal Sourdough, Kyoto Matcha Bar
- Cuisine category grid
- Results list shows matching countries and recipes

---

#### Grocery Tab (`app/(tabs)/grocery.tsx`)
- `TabHeader`
- Two sub-tabs: **List** and **Inventory**
- List view: items grouped by auto-detected category (Produce, Protein, Dairy, Pantry, etc.) with emoji icon
- Check/uncheck items; badge shows checked count
- "Clear completed" and "Clear all" actions
- Category detection via `CATEGORY_RULES` keyword matching

---

#### Cook Tab (`app/(tabs)/cook.tsx`)
- `TabHeader`
- Search bar wired to `useNinjaRecipes(query)` — live recipe search via API Ninjas proxy
- Debounced 500 ms; results show title, servings badge, ingredients list, instructions
- When not searching: all recipes grouped by difficulty (Easy / Medium / Hard sections)
- Featured recipe card at top (Italy, first recipe)
- Haptic feedback on interactions

---

#### Saved Tab (`app/(tabs)/saved.tsx`)
- `TabHeader`
- **Saved Countries** section: horizontal chip row (country flag + name, tap to navigate)
- **Saved Recipes** section: list rows with image, title, country, difficulty badge, remove button
- Empty state when nothing saved

---

#### Profile Tab (`app/(tabs)/settings.tsx`)
- Accessed via avatar press (hidden from tab bar)
- Hero image banner (Unsplash food photo)
- **Bucket List Countries**: chips for `selectedCountryIds`
- **Cooking Level** selector: Beginner / Home Cook / Enthusiast (terracotta pill highlight)
- **Appearance** selector: Light / Dark / System
- **Reset onboarding** action

---

#### Country Detail (`app/country/[id].tsx`)
- Full-screen hero with gradient overlay
- Back navigation
- Country tagline, description, rating, cuisine label
- Recipe cards grid — tap to Recipe Detail

---

#### Recipe Detail (`app/recipe/[id].tsx`)
- Hero image + title + meta (prep time, cook time, servings, difficulty)
- Cultural note section
- Ingredients list with amounts
- Steps list
- Tips section
- "Start Cooking" → `cook-mode` modal
- Save/unsave recipe; Add all ingredients to Grocery List

---

#### Cook Mode (`app/cook-mode.tsx`)
- Full-screen modal
- Step-by-step instructions with progress indicator
- Prev / Next navigation
- Step counter

---

#### Kitchen Scanner (`app/kitchen-scanner.tsx`)
- Uses `expo-camera`
- Scans pantry items to add to Inventory

---

### 4.6 Shared Components

| Component | File | Purpose |
|---|---|---|
| `TabHeader` | `components/TabHeader.tsx` | Hamburger left + title centre + avatar right; used on Search, Grocery, Cook, Saved |
| `ErrorBoundary` | `components/ErrorBoundary.tsx` | Catches render errors |
| `ErrorFallback` | `components/ErrorFallback.tsx` | Fallback UI for errors |
| `InventoryPanel` | `components/InventoryPanel.tsx` | Pantry inventory UI panel |
| `KeyboardAwareScrollViewCompat` | `components/KeyboardAwareScrollViewCompat.tsx` | Cross-platform keyboard-avoiding scroll |

---

### 4.7 Hooks

| Hook | File | Purpose |
|---|---|---|
| `useCountries` | `hooks/useCountries.ts` | Fetches countries from API, falls back to local data |
| `useCountry` | `hooks/useCountry.ts` | Single country by id |
| `useRecipe` | `hooks/useRecipe.ts` | Single recipe by id |
| `useSearch` | `hooks/useSearch.ts` | Full-text search across local data |
| `useNinjaRecipes` | `hooks/useNinjaRecipes.ts` | Live recipe search via API Ninjas proxy (debounced 500 ms, parses pipe-separated ingredients) |
| `useReducedMotion` | `hooks/useReducedMotion.ts` | Respects OS accessibility setting |
| `useScaledStyles` | `hooks/useScaledStyles.ts` | Dynamic font scaling |
| `useThemeColors` | `hooks/useThemeColors.ts` | Returns palette tokens for current theme |

---

## 5. API Server — `artifacts/api-server`

**Framework**: Express 5  
**Entry**: `src/index.ts` (reads `PORT`)  
**App setup**: `src/app.ts` (CORS, JSON parsing, routes at `/api`)

### Routes

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/healthz` | Health check |
| `GET` | `/api/countries` | All countries (alphabetical) |
| `GET` | `/api/countries/:id` | Country detail with recipes array |
| `GET` | `/api/recipes/:id` | Single recipe detail |
| `GET` | `/api/search?q=term` | Full-text search across countries + recipes |
| `GET` | `/api/ninja/recipes?query=...` | Proxy to API Ninjas recipe search (server-held key) |
| `POST` | `/api/ninja/nutrition` | Proxy to API Ninjas nutrition endpoint |

**API Ninjas key** stored as Replit secret `API_NINJAS_KEY` — never exposed to the client.

---

## 6. Database — `lib/db`

**ORM**: Drizzle ORM  
**Database**: PostgreSQL (Replit-managed, `DATABASE_URL` auto-provided)

### Schema

**`countries`**
```
id, name, flag, tagline, description, region,
image, heroImage, cuisineLabel, rating, recipeCount, createdAt
```

**`recipes`**
```
id, countryId (FK → countries), title, description,
image, category, prepTime, cookTime, servings, difficulty,
ingredients (JSONB), steps (JSONB), culturalNote, tips (text[]), createdAt
```

**Relations**: countries `hasMany` recipes

**Seed**: `pnpm --filter @workspace/scripts run seed` — upserts all local data into the DB (safe to re-run).

---

## 7. Web Landing Page — `artifacts/landing`

**Framework**: React + Vite  
**Styling**: Tailwind CSS + shadcn/ui component library  
**Single page**: `src/pages/LandingPage.tsx`  
Matches the editorial brand identity of the mobile app.

---

## 8. API Codegen Pipeline

```
lib/api-spec/openapi.yaml
        ↓ (Orval)
lib/api-client-react/src/generated/   — React Query hooks
lib/api-zod/src/generated/            — Zod schemas
```

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

---

## 9. Environment & Secrets

| Secret | Used by | Purpose |
|---|---|---|
| `DATABASE_URL` | `lib/db`, `api-server` | PostgreSQL connection (auto-provided by Replit) |
| `API_NINJAS_KEY` | `api-server` | API Ninjas recipe + nutrition proxy |

---

## 10. Key Build Commands

| Command | Purpose |
|---|---|
| `pnpm run typecheck` | Full monorepo type check (project references) |
| `pnpm run build` | Typecheck + build all packages |
| `pnpm --filter @workspace/api-server run dev` | Start API dev server |
| `pnpm --filter @workspace/landing run dev` | Start web landing dev server |
| `pnpm --filter @workspace/mobile run dev` | Start Expo dev server |
| `pnpm --filter @workspace/scripts run seed` | Seed database |
| `pnpm --filter @workspace/api-spec run codegen` | Regenerate API client + Zod schemas |
| `pnpm --filter @workspace/db run push-force` | Push schema changes to dev DB |

---

## 11. Feature Status

| Feature | Status |
|---|---|
| Onboarding country picker | Complete |
| Welcome → Onboarding → Tab routing gate | Complete |
| Discover hero carousel (swipe + dots + country circles) | Complete |
| Country circle active ring + flag badge | Complete |
| Inline bookmark (country name row) | Complete |
| Profile navigation via avatar (Discover header) | Complete |
| Search tab with filters + useSearch | Complete |
| Grocery tab with categories + Inventory panel | Complete |
| Cook tab with difficulty grouping | Complete |
| Live recipe search (API Ninjas via proxy) | Complete |
| Saved tab (countries + recipes) | Complete |
| Profile tab (cooking level, appearance, bucket list) | Complete |
| Country detail screen | Complete |
| Recipe detail screen | Complete |
| Cook mode (step-by-step) | Complete |
| Kitchen scanner (expo-camera) | Complete |
| Tab bar — NativeTabs (iOS 26+) + BlurView (classic) | Complete |
| TabHeader shared component | Complete |
| API server — countries + recipes + search routes | Complete |
| API Ninjas proxy route (server-side key) | Complete |
| PostgreSQL schema + Drizzle ORM | Complete |
| DB seeder script | Complete |
| Web landing page | Complete |
| Haptic feedback throughout | Complete |
| Reduced motion support | Complete |
