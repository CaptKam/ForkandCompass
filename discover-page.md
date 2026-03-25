# Discover Page — Complete Reference

**File**: `artifacts/mobile/app/(tabs)/index.tsx`  
**Lines**: ~1,750  
**Dependencies**: `RecipeContextMenu`, `AppContext`, `useCountries`, `useReducedMotion`, `data.ts`

---

## Page Structure (16 Sections)

```
┌──────────────────────────────────────┐
│  1. HERO CAROUSEL                    │
│     Paginated country slides         │
├──────────────────────────────────────┤
│  2. EXPLORE DESTINATIONS             │
│     Circle avatar strip              │
├──────────────────────────────────────┤
│  3. TONIGHT'S PLAN                   │
│     Itinerary card or empty state    │
├──────────────────────────────────────┤
│  4. RECENTLY COOKED (conditional)    │
│     Horizontal history cards         │
├──────────────────────────────────────┤
│  5. CRAVINGS / QUICK PICKS           │
│     Cuisine chips                    │
├──────────────────────────────────────┤
│  6. JUMP BACK IN (conditional)       │
│     Saved recipe cards               │
├──────────────────────────────────────┤
│  7. FEATURED LOCATIONS               │
│     Location cards per country       │
├──────────────────────────────────────┤
│  8. TONIGHT'S TASTING MENU           │
│     3-course balanced menu           │
├──────────────────────────────────────┤
│  9. EDITORIAL HIGHLIGHT              │
│     Quote card                       │
├──────────────────────────────────────┤
│ 10. THE SPICE MARKET                 │
│     2×2 ingredient grid              │
├──────────────────────────────────────┤
│ 11. CULTURAL ETIQUETTE               │
│     3 icon+text rows                 │
├──────────────────────────────────────┤
│ 12. HERITAGE SPICES                  │
│     Horizontal premium cards         │
├──────────────────────────────────────┤
│ 13. THE COOK'S LEDGER                │
│     Review quotes                    │
├──────────────────────────────────────┤
│ 14. MUST-TRY STREET FOOD             │
│     Horizontal cards + context menu  │
├──────────────────────────────────────┤
│ 15. SEASONAL PICKS / EDITORIAL       │
│     Themed editorial card            │
├──────────────────────────────────────┤
│ 16. RELATED STORIES                  │
│     Other country links              │
└──────────────────────────────────────┘
```

---

## Imports

```typescript
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import RecipeContextMenu from "@/components/RecipeContextMenu";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  NativeScrollEvent, NativeSyntheticEvent, Platform,
  Pressable, ScrollView, StyleSheet, Text, View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/contexts/AppContext";
import type { CookSession } from "@/contexts/AppContext";
import {
  COUNTRIES, ONBOARDING_IMAGES, LANDMARK_IMAGES,
  getCountryLocations, getRecipeById,
  type Country, type Recipe
} from "@/constants/data";
import { useCountries } from "@/hooks/useCountries";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import Colors from "@/constants/colors";
```

---

## Helper Functions

### `EDITORIAL_BLURBS`
Static per-country blurbs (Italy, Japan, Morocco, Mexico, India, Thailand) used in the hero carousel.

### `pickTastingMenu(recipes: Recipe[]): Recipe[]`
Picks a balanced 3-course menu: one starter (Appetizer/Side/Salad/Soup), one main (Main Course/Lunch), one finish (Dessert/Beverage/Baked Good). Fills remaining from unused recipes.

### `buildDiscoverData(country: Country): DiscoverEditorial`
Builds editorial data for each country. Has full custom overrides for Morocco and Italy; other countries get generated defaults. Returns: `locations`, `quote`, `quoteAttrib`, `etiquette`, `spiceMarket`, `heritageItems`, `reviews`, `streetFood`, `relatedLabel`, `relatedStories`.

### `getCravingsChips(cuisinesExplored, countries, recentSessions): CravingChip[]`
Computes up to 6 cuisine chips:
1. **Discovery** — unexplored countries (labelled `isNew: true`)
2. **Comfort** — most-cooked cuisine from recent sessions
3. **Fill** — remaining countries for variety

### `EDITORIAL_PICK`
Static seasonal editorial data: `theme`, `headline`, `body`, `cta`.

---

## Component: `DiscoverScreen`

### State & Context

```typescript
const {
  isCountrySaved, toggleSavedCountry,
  savedRecipeIds, cookingProfile,
  recentCookSessions, currentItinerary,
} = useApp();

const { countries } = useCountries();
```

### Derived Data

| Variable | Source | Purpose |
|----------|--------|---------|
| `activeCountry` | `countries[activeIndex]` | Currently selected country in hero |
| `editorial` | `buildDiscoverData(activeCountry)` | All editorial content for active country |
| `todayPlan` | `currentItinerary.find(d => d.date === todayISO)` | Today's itinerary entry (or null) |
| `todayRecipe` | `getRecipeById(todayRecipeId)` | Recipe for tonight's plan |
| `todayCountry` | `countries.find(c => c.id === todayPlan.countryId)` | Country for tonight's plan |
| `savedRecipes` | `savedRecipeIds.map(getRecipeById)` | Resolved saved Recipe objects |
| `recentlyCooked` | `recentCookSessions → getRecipeById` | Last 6 cooked recipes with sessions |
| `cravingChips` | `getCravingsChips(...)` | Cuisine chip data |

### Key Interactions

| Interaction | Handler |
|-------------|---------|
| Hero slide swipe | `onHeroScroll` — updates `activeIndex` via momentum scroll end |
| Destination tap | Sets `activeIndex` + programmatic hero scroll |
| Long-press any recipe card | `RecipeContextMenu` → Schedule, Save, Grocery, Cook |
| "Start Cooking" button | `router.push("/cook-mode", { recipeId })` |
| "Plan My Week" | `router.push("/(tabs)/plan")` |
| "Surprise Me" | Random recipe from active country → recipe detail |
| Craving chip tap | `router.push("/country/[id]")` |
| Street food card tap | `router.push("/recipe/[id]")` |

---

## Section Details

### 1. Hero Carousel
- Paginated `ScrollView` (horizontal, pagingEnabled)
- Each slide: full-bleed image + left gradient + top gradient
- Content overlay: flag emoji, serif title, editorial blurb
- Actions: "Let's Go" pill button + bookmark toggle circle
- Pagination dots at bottom-left (active dot = terracotta pill)

### 2. Explore Destinations
- Horizontal ScrollView of circle avatars (80×80 ring, 72×72 image)
- Active: terracotta border ring
- Flag badge: white circle at bottom-right of each avatar
- Label below each: uppercase country name
- Auto-centers active thumbnail via `destScrollRef`

### 3. Tonight's Plan
- **Has plan**: Row card (128px image left, body right) with:
  - Flag + country name + optional "Quick" flash badge
  - Serif recipe name, italic description
  - Terracotta "Start Cooking" button → Cook Mode
  - Wrapped in `RecipeContextMenu` for long-press
- **No plan**: Dashed border empty state with:
  - Calendar icon
  - "No plan for tonight yet" title
  - "Plan My Week" primary button + "Surprise Me" outline button

### 4. Recently Cooked (conditional)
- Only renders when `recentlyCooked.length > 0`
- Horizontal scroll of 120×148 cards
- Full-bleed image + bottom gradient
- Star rating badge (top-right) if `session.rating` exists
- Recipe name at bottom
- Each card wrapped in `RecipeContextMenu`
- "See All" → Profile tab

### 5. Cravings / Quick Picks
- Title adapts: "Cravings" (if history) or "Explore Cuisines" (new user)
- Subtitle: "Based on your cooking history" or "Pick a cuisine..."
- Flexbox wrap row of pill chips
- `isNew` chips: terracotta left border + "New:" prefix + primary color text
- Regular chips: neutral bg with subtle border
- Tap → country page

### 6. Jump Back In (conditional)
- Only renders when `savedRecipes.length > 0`
- Background: `surfaceContainerLow`
- Horizontal scroll of 152px-wide cards
- Image top (96px), info below (category + name)
- Each wrapped in `RecipeContextMenu`
- "View All" → Saved tab

### 7. Featured Locations
- Horizontal scroll of 192×256 location cards
- Full-bleed image + bottom gradient
- Serif location name + medium subtitle
- Tap → `/region/[countryId]/[region]`

### 8. Tonight's Tasting Menu
- Background: `surfaceContainerLow`
- 3 row cards (72×72 thumbnail, category badge, serif name, italic description)
- Each wrapped in `RecipeContextMenu`
- Chevron right icon

### 9. Editorial Highlight
- Warm background card (`#FCF3E8`)
- Chat bubble icon + italic serif quote
- Horizontal divider + uppercase attribution

### 10. The Spice Market
- "View All" link → country page
- 2×2 grid (47% width each)
- Image (120px) + semibold name + regular description

### 11. Cultural Etiquette
- Top border separator
- 3 rows: icon circle (40×40) + title (uppercase) + description

### 12. Heritage Spices
- Background: `surfaceContainer`
- Italic subtitle: "The soul of the [region] kitchen"
- Horizontal scroll of 240px cards: image top (176px), body with name/description/badge

### 13. The Cook's Ledger
- 5 star icons in header row
- Left-border review quotes (italic)
- Author row: avatar circle (initials or person icon) + uppercase name + city

### 14. Must-Try Street Food
- Header: section title + country flag+name badge (terracotta bg)
- Subtitle: "The vibrant flavors of the [region]"
- Horizontal scroll of 272×176 cards
- Cards try to match a real recipe by name prefix; wrapped in `RecipeContextMenu` if matched
- Full-bleed image + bottom gradient + serif name + description

### 15. Seasonal Picks / Editorial
- Header row: "Seasonal Picks" title + leaf "Editorial" badge
- Card (`#FCF3E8`): theme pill badge (terracotta bg), serif headline, body text
- "Read the Collection" CTA with forward arrow → country page

### 16. Related Stories
- Background: warm translucent
- Uppercase tracking label
- Horizontal scroll of 152px cards: image (96px), country name, description

---

## RecipeContextMenu Component

**File**: `artifacts/mobile/components/RecipeContextMenu.tsx`

Wraps any recipe card with long-press support. On long-press (400ms delay), shows a centered modal overlay with actions:

| Action | Icon | Behavior |
|--------|------|----------|
| Schedule this recipe | `calendar-outline` | Opens `ScheduleSheet` modal |
| Save / Remove from Saved | `bookmark-outline` / `bookmark` | Toggles save state |
| Add to grocery list | `basket-outline` | Adds all ingredients to grocery |
| Cook now | `restaurant-outline` | Navigates to `/cook-mode` |

---

## AppContext Data Used

```typescript
interface AppContextType {
  savedRecipeIds: string[];           // IDs of bookmarked recipes
  toggleSaved: (id: string) => void;
  isSaved: (id: string) => boolean;
  isCountrySaved: (id: string) => boolean;
  toggleSavedCountry: (id: string) => void;
  cookingProfile: CookingProfile;     // recipesCompleted[], cuisinesExplored[], level, streak
  recentCookSessions: CookSession[];  // Last 5 completed cook sessions
  currentItinerary: ItineraryDay[];   // This week's meal plan
  addToGrocery: (recipe: Recipe) => void;
}

interface ItineraryDay {
  id: string;
  date: string;             // "2026-03-25" ISO format
  dayLabel: string;          // "Mon", "Tue", etc.
  countryId: string;
  regionId: string;
  quickRecipeIds: string[];  // Recipe IDs for quick mode
  fullRecipeIds: string[];   // Recipe IDs for full mode
  mode: "quick" | "full";
  status: "active" | "skipped" | "completed";
}

interface CookSession {
  id: string;
  recipeId: string;
  recipeName: string;
  cuisine: string;
  difficulty: string;
  startedAt: string;
  completedAt: string | null;
  totalTime: number;
  rating: number | null;
  feedback: string[];
  stepsCompleted: number;
  totalSteps: number;
}

interface CookingProfile {
  recipesCompleted: string[];
  cuisinesExplored: string[];
  totalCookTime: number;
  sessionsStarted: number;
  sessionsCompleted: number;
  averageRating: number;
  currentLevel: number;        // 1-6
  currentLevelName: string;    // "Kitchen Curious" → "Kitchen Master"
  progressToNext: number;      // 0-1
  streakDays: number;
  lastCookDate: string | null;
}
```

---

## Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| Primary | `Colors.light.primary` (#9A4100) | CTAs, badges, active states |
| Surface | `Colors.light.surface` (#FEF9F3) | Page background |
| Surface Container Low | `Colors.light.surfaceContainerLow` | Tasting menu, Jump Back In bg |
| Warm card bg | `#FCF3E8` | Quote card, Editorial Pick card |
| Tonight's Plan bg | `#FDFAF6` | Tonight's Plan section |
| Headline font | `NotoSerif_700Bold` | Section titles, recipe names |
| Body font | `Inter_400Regular` | Descriptions, subtitles |
| Label font | `Inter_600SemiBold` | Chips, badges, categories |
| Hero height | 560px | Hero carousel slides |
| Destination avatar | 80×80 ring, 72×72 image | Circle country avatars |
| Street food card | 272×176 | Street food cards |
| Recent cooked card | 120×148 | Recently cooked cards |
| Jump Back In card | 152px wide | Saved recipe cards |
| Location card | 192×256 | Featured location cards |

---

## Navigation Routes

| From | To | Params |
|------|----|--------|
| Hero "Let's Go" | `/country/[id]` | `{ id: country.id }` |
| Destination tap | Hero scroll (internal) | — |
| Tonight's Plan card | `/recipe/[id]` | `{ id: recipe.id }` |
| Tonight "Start Cooking" | `/cook-mode` | `{ recipeId }` |
| Tonight "Plan My Week" | `/(tabs)/plan` | — |
| Tonight "Surprise Me" | `/recipe/[id]` | Random recipe |
| Recently Cooked card | `/recipe/[id]` | `{ id: recipe.id }` |
| Recently Cooked "See All" | `/(tabs)/profile` | — |
| Craving chip | `/country/[id]` | `{ id: chip.countryId }` |
| Jump Back In card | `/recipe/[id]` | `{ id: recipe.id }` |
| Jump Back In "View All" | `/(tabs)/saved` | — |
| Location card | `/region/[countryId]/[region]` | `{ countryId, region }` |
| Tasting menu card | `/recipe/[id]` | `{ id: recipe.id }` |
| Spice Market "View All" | `/country/[id]` | `{ id: activeCountry.id }` |
| Street food card | `/recipe/[id]` | `{ id: matchedRecipe.id }` |
| Editorial "Read Collection" | `/country/[id]` | `{ id: activeCountry.id }` |
| Context menu "Cook now" | `/cook-mode` | `{ recipeId }` |
| Context menu "Schedule" | ScheduleSheet modal | — |
