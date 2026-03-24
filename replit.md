# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   └── api-server/         # Express API server
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes:
  - `GET /api/healthz` — health check
  - `GET /api/countries` — list all countries (alphabetical)
  - `GET /api/countries/:id` — country detail with recipes array
  - `GET /api/recipes/:id` — single recipe detail
  - `GET /api/search?q=term` — full-text search across countries + recipes
- Depends on: `@workspace/db`, `@workspace/api-zod`
- `pnpm --filter @workspace/api-server run dev` — run the dev server
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/countries.ts` — `countriesTable` (id, name, flag, tagline, description, region, image, heroImage, cuisineLabel, rating, recipeCount, createdAt)
- `src/schema/recipes.ts` — `recipesTable` (id, countryId FK, region, title, description, image, category, prepTime, cookTime, servings, difficulty, ingredients JSONB, steps JSONB, culturalNote, tips text[], createdAt)
- `src/schema/relations.ts` — Drizzle relations (countries hasMany recipes)
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`, automatically provided by Replit)
- Exports: `.` (pool, db, all schema), `./schema` (schema only)

Production migrations are handled by Replit when publishing. In development, use `pnpm --filter @workspace/db run push-force`.

**After modifying schema**: run `tsc -b` inside `lib/db` to rebuild declarations, then typecheck will pass.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages:

1. `lib/api-client-react/src/generated/` — React Query hooks + fetch client
2. `lib/api-zod/src/generated/` — Zod schemas

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec (e.g. `HealthCheckResponse`). Used by `api-server` for response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec (e.g. `useHealthCheck`, `healthCheck`).

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`. Run scripts via `pnpm --filter @workspace/scripts run <script>`. Scripts can import any workspace package (e.g., `@workspace/db`) by adding it as a dependency in `scripts/package.json`.

- `seed` — `pnpm --filter @workspace/scripts run seed` — seeds all countries and recipes from mobile app data into the database (uses upsert, safe to re-run)

### `artifacts/landing` (`@workspace/landing`)

"Fork & Compass" landing page (React + Vite). Serves at root `/` — this is the homepage for `forkandcompass.app`. Features hero section with email waitlist capture, iPhone app mockup, destination grid, and CTA. Waitlist emails persisted to PostgreSQL via `POST /api/waitlist`.

- **Preview path**: `/` (root)
- **Key files**: `src/pages/LandingPage.tsx`, `src/index.css`, `index.html`, `public/og-image.png`

### `artifacts/mobile` (`@workspace/mobile`)

"Fork & Compass" — a premium culinary travel mobile app (Expo/React Native) with a high-end editorial magazine aesthetic. Preview path: `/mobile/`.

- **Design System**: Primary terracotta #9A4100, surface #FEF9F3, Noto Serif for headlines, Inter for body text, no-line border rule (sections defined by color shifts, not borders)
- **Navigation**: Welcome → Onboarding (country picker) → Tab bar (Discover, Journeys, Saved, Profile) with NativeTabs (liquid glass) on iOS 26+, classic BlurView tabs fallback
- **Discover tab (editorial homepage)**: Scrollable editorial landing page with hero section, "Curator's Method" 3-step concept, featured destination journal cards (horizontal scroll), testimonial quote, CTA, and footer
- **Stack screens**: onboarding, country/[id], recipe/[id], cook-mode (modal)
- **State**: AsyncStorage for saved recipes, grocery list, welcome-seen, selected countries, onboarding-completed via AppContext
- **Data**: 97 recipes across 8 countries sourced from recipe-api.com (Italy: 16, Japan: 16, Morocco: 10, Mexico: 13, India: 14, Thailand: 12, Spain: 8, France: 8), stored in constants/data.ts + PostgreSQL DB. Covers diverse categories: appetizers, desserts, beverages, salads, soups, breakfast, condiments, and main courses. AI-generated food photography for each recipe served from `/api/images/recipes/`
- **Region-specific recipes**: Each recipe is assigned to a specific region within its country via `RECIPE_REGION_MAP` in data.ts and `region` column in DB. Region pages filter to show only that region's recipes. Regions: Italy (Tuscany/Rome/Amalfi Coast), Japan (Kyoto/Tokyo/Osaka), Morocco (Marrakech/Chefchaouen/Atlas Mountains), Mexico (Oaxaca/Yucatán/Mexico City), India (Delhi/Kerala/Rajasthan), Thailand (Bangkok/Chiang Mai/Phuket), Spain (Barcelona/Seville/San Sebastián), France (Paris/Provence/Lyon)
- **Recipe Images**: AI-generated dish-specific photos stored in `artifacts/api-server/public/images/recipes/`, served as static files via Express. Image URLs resolved at runtime via `resolveImageUrl()` using `EXPO_PUBLIC_DOMAIN`
- **Recipe API**: recipe-api.com via `/api/ninja/recipes` proxy (500 calls/day, 15k/month). Recipes fetched once and cached locally
- **Instacart Integration**: `/api/instacart/shopping-list` endpoint for grocery ordering (sandbox: `connect.dev.instacart.tools`)
- **Onboarding**: "Where do you want to go?" country picker grid with selectable cards, checkmark badges, and "Start Exploring" CTA
- **Key files**:
  - `constants/colors.ts` — design system colors
  - `constants/data.ts` — all countries/recipes data + ONBOARDING_IMAGES
  - `contexts/AppContext.tsx` — global state (saved, grocery, welcome, selectedCountryIds, hasCompletedOnboarding)
  - `app/index.tsx` — Welcome screen (routes to /onboarding or /(tabs) based on state)
  - `app/onboarding.tsx` — Country picker onboarding screen
  - `app/(tabs)/` — Tab screens (explore, grocery, saved, settings)
  - `app/country/[id].tsx` — Country detail
  - `app/recipe/[id].tsx` — Recipe detail with ingredients
  - `app/cook-mode.tsx` — Full guided Cook Mode with screen wake lock (expo-keep-awake), per-step contextual tips, named timers, doneness cues, segment-control help sheet (Troubleshooting + Chef Tips), pre-cook overnight prep warning interstitial, video technique hints (skill-level adapted), per-step ingredient checklist, equipment callouts, phase-aware backgrounds (prep/cook/finish), and finish screen with star rating + feedback chips
  - `app/(tabs)/cook.tsx` — Cook hub with priority-based layout: active session resume card, tonight's recipe card, "What should we cook?" empty state, compact level progression bar, recently cooked horizontal scroll, beginner recipe suggestions, and collapsible technique video library
  - `constants/techniques.ts` — 15 curated technique videos with action-keyword matching for Cook Mode contextual hints
