# Discover Page — Layout & Architecture

**File:** `artifacts/mobile/app/(tabs)/index.tsx`

---

## Overview

The Discover page is a single vertically-scrolling screen. The active country index (`activeIndex`) is the central state — swiping the hero carousel or tapping a destination circle updates it, and every section below reactively re-renders to match that country's editorial data.

**Key data sources:**
- `COUNTRIES` — all 8 countries and their recipes from `constants/data.ts`
- `EDITORIAL_BLURBS` — static editorial copy per country (inline in the file)
- `buildDiscoverData(country)` — constructs all editorial sections (locations, quotes, etiquette, spices, reviews, street food, related stories) per country
- `pickTastingMenu(recipes)` — selects one starter, one main, one dessert/drink from the active country's recipes
- `useCountries()` — hook that filters to relevant countries
- `useApp()` — provides saved/bookmark state

---

## Section-by-Section Layout

### 1. Hero Carousel
**Height:** 560px | **Style:** Full-bleed, paginated horizontal scroll

Each slide contains:
- Full-bleed country photo (`ONBOARDING_IMAGES` → `heroImage` → `image` fallback)
- Two `LinearGradient` overlays — left-to-right dark wash + top dark wash
- **Bottom-left content block** (absolute, `bottom: 48, left: 32, right: 32`):
  - Flag emoji (28px)
  - Country name — NotoSerif Bold 38px
  - Editorial blurb — Inter Regular 17px
  - **Action row:** "Let's Go" pill button → `/country/[id]` + circular bookmark toggle
- **Pagination dots** — absolute, `bottom: 20, left: 32`. Active dot is wider (22px) and terracotta coloured.

Swipe behaviour: `onMomentumScrollEnd` + `onScrollEndDrag` both call `onHeroScroll`, which rounds the scroll offset to the nearest page and updates `activeIndex`. A `isProgrammaticScroll` ref prevents feedback loops when dots/thumbnails trigger `scrollTo`.

---

### 2. Explore Destinations
**Style:** Horizontal scroll strip with circle thumbnails

Each item:
- Outer ring view (handles active terracotta border without clipping)
- Inner circle view with `overflow: hidden` → country landmark photo
- Flag emoji badge (absolute, bottom-right of ring)
- Country name label below

Tapping an item calls `setActiveIndex(idx)` + `scrollHeroTo(idx)` which programmatically scrolls the hero carousel. A `useEffect` on `activeIndex` auto-centres the active thumbnail in the strip.

---

### 3. Featured Locations
**Style:** Horizontal scroll, full-bleed image cards with gradient overlay

- 3–4 region cards per country
- Source: `editorial.locations` from `buildDiscoverData`
- Tapping → `/region/[countryId]/[region]`
- Each card: country/region photo, location name, subtitle text overlaid on gradient

---

### 4. Tonight's Tasting Menu
**Style:** Vertical list on a tinted background

- Populated by `pickTastingMenu(activeCountry.recipes)` — returns exactly 3 recipes
- Selection logic: one Appetizer/Side/Salad/Soup, one Main/Lunch, one Dessert/Beverage/Baked Good; fills remaining slots if categories are missing
- Each row: small square thumbnail, category label (uppercase), recipe name, one-line description, chevron
- Wrapped in `RecipeContextMenu` for long-press context actions
- Tapping → `/recipe/[id]`

---

### 5. Editorial Highlight
**Style:** Quote card with icon

- Source: `editorial.quote` + `editorial.quoteAttrib`
- Chat-bubble icon, quoted text in serif italic style, thin divider, attribution line

---

### 6. The Spice Market
**Style:** 2×2 grid

- Source: `editorial.spiceMarket` (4 items)
- Each cell: square photo, ingredient name, 2-line description
- "View All" link → `/country/[id]`

---

### 7. Cultural Etiquette
**Style:** Vertical list on a warm tinted background

- Source: `editorial.etiquette` (3 items)
- Each row: circular icon container (Ionicons), bold title, descriptive text

---

### 8. Heritage Spices
**Style:** Horizontal scroll, tall cards with image + text body

- Source: `editorial.heritageItems` (2 items)
- Each card: image on left half, text body on right — name, 4-line description, badge row (dot + label)
- Section subtitle: "The soul of the [country.region] kitchen"

---

### 9. The Cook's Ledger
**Style:** Stacked review cards with star row header

- Source: `editorial.reviews` (2 reviews)
- Each card: quoted review text, avatar circle (initials or person icon), author name — city
- 5 terracotta stars in the section header

---

### 10. Must-Try Street Food
**Style:** Horizontal scroll, full-bleed image cards with gradient overlay

- Source: `editorial.streetFood` (3–4 items)
- Each card: full-bleed photo, gradient, food name, tagline description overlaid
- Section subtitle: "The vibrant flavors of the [country.region]"

---

### 11. Related Stories
**Style:** Horizontal scroll, smaller portrait cards

- Source: `editorial.relatedStories` + `editorial.relatedLabel`
- Each card: image, country label, short description
- Currently editorial/static — no navigation tap target

---

## State & Reactivity Summary

| State | Set by | Drives |
|---|---|---|
| `activeIndex` | Hero swipe, destination tap, dot tap | Everything from section 3 downward |
| `savedCountryIds` | Bookmark button on each hero slide | Bookmark icon fill state |
| `screenWidth` | `useWindowDimensions()` | Hero carousel page width |
| `isProgrammaticScroll` | ref, toggled by `scrollHeroTo` | Prevents double-fire on programmatic scroll |

---

## Navigation Targets

| Action | Destination |
|---|---|
| "Let's Go" button | `/country/[id]` |
| Featured Location card | `/region/[countryId]/[region]` |
| Tasting Menu recipe row | `/recipe/[id]` |
| Spice Market "View All" | `/country/[id]` |
| Destination circle tap | Updates hero (no push) |

---

## Editorial Data Builder

`buildDiscoverData(country)` is a large inline function that returns a `DiscoverEditorial` object. It has a `byCountry` map keyed by `country.id` with custom data for each country. Any missing key falls back to a generic default. Fields:

- `locations` — array of `{ name, subtitle, image }`
- `quote` + `quoteAttrib`
- `etiquette` — array of `{ icon, title, description }`
- `spiceMarket` — array of `{ name, description, image }`
- `heritageItems` — array of `{ name, description, badge, image }`
- `reviews` — array of `{ text, author, city, initials? }`
- `streetFood` — array of `{ name, description, image }`
- `relatedLabel` + `relatedStories` — array of `{ country, description, image }`
