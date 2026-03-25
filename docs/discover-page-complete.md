# Discover Page — Complete Reference

**File:** `artifacts/mobile/app/(tabs)/index.tsx`
**Route:** `/(tabs)/` (default tab)
**Lines:** 1,197

---

## Purpose

The Discover page is the editorial heart of the app. It is a single vertically-scrolling screen that showcases one country at a time. Swiping the hero or tapping a destination circle switches the active country and reactively updates every section below it. The page is designed to feel like a travel magazine — not a recipe list.

---

## Imports & Dependencies

| Import | Purpose |
|---|---|
| `expo-image` `Image` | Optimised image rendering throughout |
| `expo-haptics` | Light/medium haptic feedback on interactions |
| `expo-linear-gradient` `LinearGradient` | Gradient overlays on hero, cards |
| `expo-router` `router` | Navigation pushes |
| `expo-status-bar` `StatusBar` | Forces light status bar over hero |
| `useWindowDimensions` | Tracks screen width for hero carousel paging |
| `useSafeAreaInsets` | Accounts for notch/home indicator |
| `useApp` | `isCountrySaved`, `toggleSavedCountry` from AppContext |
| `useCountries` | Filtered list of countries |
| `useReducedMotion` | Disables transitions if user prefers reduced motion |
| `COUNTRIES` | All 8 country objects |
| `ONBOARDING_IMAGES` | Hero-quality country images |
| `LANDMARK_IMAGES` | Landmark images for destination circles |
| `getCountryLocations` | Returns region locations for a country |
| `RecipeContextMenu` | Long-press context menu wrapper on tasting menu |
| `Colors` | Design token colours |

---

## State

| Variable | Type | Default | Purpose |
|---|---|---|---|
| `activeIndex` | `number` | `2` (Morocco) | Which country is currently active |
| `heroScrollRef` | `useRef<ScrollView>` | — | Controls the hero carousel scroll position |
| `destScrollRef` | `useRef<ScrollView>` | — | Controls the destination strip scroll position |
| `isProgrammaticScroll` | `useRef<boolean>` | `false` | Prevents double-fire when code triggers `scrollTo` |
| `screenWidth` | `number` | device width | Hero carousel page width |

---

## Helper Functions

### `pickTastingMenu(recipes)`
Selects exactly 3 recipes from a country's recipe list for "Tonight's Tasting Menu".

**Logic:**
1. Finds one **starter** — category in `["Appetizer", "Side Dish", "Salad", "Soup"]`
2. Finds one **main** — category in `["Main Course", "Lunch"]`
3. Finds one **finish** — category in `["Dessert", "Beverage", "Baked Good"]`
4. If fewer than 3 are found, fills remaining slots with unused recipes in list order
5. Returns exactly 3 recipes (`slice(0, 3)`)

---

### `buildDiscoverData(country)`
Returns a `DiscoverEditorial` object used to populate sections 3–11.

**Returns:**
```typescript
interface DiscoverEditorial {
  locations:      { name: string; subtitle: string; image: string }[]
  quote:          string
  quoteAttrib:    string
  etiquette:      { icon: string; title: string; description: string }[]
  spiceMarket:    { name: string; description: string; image: string }[]
  heritageItems:  { name: string; description: string; badge: string; image: string }[]
  reviews:        { text: string; author: string; city: string; initials?: string }[]
  streetFood:     { name: string; description: string; image: string }[]
  relatedLabel:   string
  relatedStories: { country: string; description: string; image: string }[]
}
```

**Custom editorial data exists for:**
- `morocco` — full custom data (saffron, cumin, ras el hanout, sfenj, maakouda, brochettes, etc.)
- `italy` — full custom data (pecorino, parmigiano, supplì, arancini, porchetta, etc.)

**All other countries** fall back to generic defaults that pull from the country's recipe data (first 4 recipes for spice market, first 2 for heritage items, first 3 for street food).

---

## Scroll Behaviour

### Hero Swipe
Both `onMomentumScrollEnd` and `onScrollEndDrag` call `onHeroScroll`, which:
1. Calculates `idx = Math.round(contentOffset.x / screenWidth)`
2. Guards against out-of-bounds and duplicate calls
3. Calls `setActiveIndex(idx)` + haptic feedback

### Programmatic Scroll (`scrollHeroTo`)
Used when dots or destination circles are tapped:
1. Sets `isProgrammaticScroll.current = true`
2. Calls `heroScrollRef.current?.scrollTo({ x: idx * screenWidth, animated: true })`
3. Clears flag after 600ms (animation settle time)

The `isProgrammaticScroll` ref prevents `onHeroScroll` from firing redundantly during programmatic scrolls.

### Destination Strip Auto-Centre
A `useEffect` on `activeIndex` auto-scrolls `destScrollRef` so the active circle is always centred:
```
itemCenter = DEST_PADDING + activeIndex * (DEST_ITEM_WIDTH + DEST_GAP) + DEST_ITEM_WIDTH / 2
scrollX = max(0, itemCenter - screenWidth / 2)
```
`DEST_ITEM_WIDTH = 94`, `DEST_GAP = 24`, `DEST_PADDING = 24`

---

## Section-by-Section Layout

### 1 — Hero Carousel
| Property | Value |
|---|---|
| Height | 560px |
| Style | Full-bleed, horizontal paginated scroll |
| Image source | `ONBOARDING_IMAGES[country.id]` → `country.heroImage` → `country.image` |

**Per slide:**
- Full-bleed country photo
- `LinearGradient` 1 — left-to-right dark wash (`rgba(0,0,0,0.78)` → transparent) gives depth to left-aligned text
- `LinearGradient` 2 — top-down wash (`rgba(0,0,0,0.4)` → transparent, height 120px) ensures readability over bright skies
- **Content block** — absolute, `bottom: 48, left: 32, right: 32`:
  - Flag emoji — 28px
  - Country name — NotoSerif Bold 38px, white, `letterSpacing: -0.5`
  - Editorial blurb — Inter Regular 17px, 85% white, `lineHeight: 26`
  - Action row:
    - **"Let's Go" pill** — white background, Inter SemiBold 17px dark text, 52px tall, 26px radius, pushes to `/country/[id]`
    - **Bookmark circle** — 52px, 26px radius, frosted white, bookmark icon toggle (filled/outline)

**Pagination dots** — absolute, `bottom: 20, left: 32`:
- Inactive: 6×6px circle, 40% white
- Active: 22×6px pill, terracotta (`Colors.light.primary`)
- Each dot is tappable (hitSlop: 18) and triggers `setActiveIndex` + `scrollHeroTo`

---

### 2 — Explore Destinations
| Property | Value |
|---|---|
| Style | Horizontal scroll strip |
| Item width | 94px ring (80px outer ring, 72px inner circle) |
| Gap | 24px between items |
| Padding | 24px horizontal |

**Per destination circle:**
- Outer ring — 80×80px, 3px border, transparent normally / terracotta when active
- Inner circle — 72×72px, `overflow: hidden`, clips image to circle
- Image source — `LANDMARK_IMAGES[country.id]` → `country.image`
- Flag badge — 24×24px white circle, absolute bottom-right of ring, 13px flag emoji
- Country name label — Inter SemiBold 13px, uppercase, terracotta when active

Tapping calls `setActiveIndex(idx)` + `scrollHeroTo(idx)` + haptic.

---

### 3 — Featured Locations
| Property | Value |
|---|---|
| Style | Horizontal scroll |
| Card size | 192×256px |
| Border radius | 12px |
| Source | `editorial.locations` from `buildDiscoverData` (= `getCountryLocations(country)`) |

**Per card:**
- Full-bleed region photo
- Gradient overlay — transparent → `rgba(0,0,0,0.72)`
- Overlaid text — location name (NotoSerif Bold 17px white) + subtitle (Inter Medium 14px, 80% white)
- Tapping → `/region/[countryId]/[region]`

---

### 4 — Tonight's Tasting Menu
| Property | Value |
|---|---|
| Style | Vertical list on `surfaceContainerLow` background |
| Cards | 3 recipes, auto-picked by `pickTastingMenu` |
| Card style | White card, 1px border, 12px radius |

**Per card:**
- 72×72px thumbnail (8px radius)
- Category label — Inter SemiBold 14px, terracotta, uppercase, letterSpacing 1.5
- Recipe name — NotoSerif Bold 17px
- Description — Inter Regular 14px, italic, muted
- Chevron right icon
- Wrapped in `RecipeContextMenu` for long-press actions
- Tapping → `/recipe/[id]`

---

### 5 — Editorial Highlight
| Property | Value |
|---|---|
| Style | Centred quote card |
| Background | `#FCF3E8` (warm cream) with terracotta border |
| Padding | 28px all sides, 20px border radius |

- Chat-bubble-ellipses icon (28px, terracotta)
- Quote text — NotoSerif SemiBold 17px italic, `lineHeight: 28`, centred
- 32px thin terracotta divider line
- Attribution — Inter SemiBold 14px, uppercase, muted brown, `letterSpacing: 2`

---

### 6 — The Spice Market
| Property | Value |
|---|---|
| Style | 2×2 `flexWrap` grid |
| Cell width | 47% |
| Image size | 100% wide × 120px tall, 8px radius |
| Source | `editorial.spiceMarket` (4 items) |

**Per cell:** image → ingredient name (Inter SemiBold 14px) → 2-line description (Inter Regular 14px muted)

"View All" link (top-right of section header) → `/country/[id]`

---

### 7 — Cultural Etiquette
| Property | Value |
|---|---|
| Style | Vertical list, top border, warm background |
| Gap | 32px between rows |
| Source | `editorial.etiquette` (3 items) |

**Per row:**
- 40×40px circular icon container (`secondaryContainer` colour) with Ionicons icon
- Bold uppercase title (Inter SemiBold 14px)
- Description text (Inter Regular 14px, muted, `lineHeight: 20`)

---

### 8 — Heritage Spices
| Property | Value |
|---|---|
| Style | Horizontal scroll on `surfaceContainer` background |
| Card size | 240px wide, white background, 16px radius |
| Image height | 176px |
| Source | `editorial.heritageItems` (2 items) |

**Per card:**
- Top image (176px tall)
- Body padding 20px: name (NotoSerif Bold 18px) → description (Inter Regular 14px, 4 lines) → badge row (6px terracotta dot + Inter SemiBold 13px terracotta uppercase label)

Section subtitle: _"The soul of the [country.region] kitchen"_ in italic Inter Regular 14px.

---

### 9 — The Cook's Ledger
| Property | Value |
|---|---|
| Style | Stacked review items with left terracotta border accent |
| Gap | 40px between reviews |
| Source | `editorial.reviews` (2 reviews) |

**Header:** section title + row of 5 terracotta 12px stars

**Per review:**
- Italic Inter Regular 14px quote text, 16px left padding, 1px terracotta-tinted left border
- Author row: 24×24px avatar circle (initials if provided, person icon otherwise) + "Author — City" in uppercase Inter SemiBold 13px

---

### 10 — Must-Try Street Food
| Property | Value |
|---|---|
| Style | Horizontal scroll on white background |
| Card size | 272×176px, 16px radius |
| Source | `editorial.streetFood` (3–4 items) |

**Per card:**
- Full-bleed photo
- Gradient — transparent → `rgba(0,0,0,0.65)`
- Overlaid text — food name (NotoSerif Bold 20px white) + tagline (Inter Medium 14px, 80% white)

Section subtitle: _"The vibrant flavors of the [country.region]"_

---

### 11 — Related Stories
| Property | Value |
|---|---|
| Style | Horizontal scroll on warm-tinted background |
| Card size | 152px wide |
| Image height | 96px, 8px radius |
| Source | `editorial.relatedStories` (3 items) |

**Per card:** image → country name (Inter SemiBold 14px) → description (Inter Regular 14px muted)

No tap navigation currently — editorial/static.

---

## Navigation Map

| Interaction | Destination |
|---|---|
| "Let's Go" on hero slide | `/country/[id]` |
| Hero bookmark toggle | (saves country — no nav) |
| Pagination dot tap | Updates `activeIndex` only |
| Destination circle tap | Updates `activeIndex` only |
| Featured Location card | `/region/[countryId]/[region]` |
| Tasting Menu recipe row | `/recipe/[id]` |
| Spice Market "View All" | `/country/[id]` |
| Related Stories card | No navigation (static) |

---

## Typography Reference

| Role | Font | Size | Weight |
|---|---|---|---|
| Country name (hero) | NotoSerif | 38px | Bold |
| Editorial blurb | Inter | 17px | Regular |
| Section title | NotoSerif | 20px | Bold |
| "Let's Go" button | Inter | 17px | SemiBold |
| Destination label | Inter | 13px | SemiBold |
| Tasting course tag | Inter | 14px | SemiBold |
| Tasting recipe name | NotoSerif | 17px | Bold |
| Quote text | NotoSerif | 17px | SemiBold Italic |
| Etiquette title | Inter | 14px | SemiBold |
| Heritage name | NotoSerif | 18px | Bold |
| Street food name | NotoSerif | 20px | Bold |

---

## Colour Tokens Used

| Token | Hex | Usage |
|---|---|---|
| `Colors.light.primary` | `#9A4100` | Active states, terracotta accents, buttons |
| `Colors.light.surface` | `#FEF9F3` | Page background |
| `Colors.light.surfaceContainerLow` | — | Tasting menu background |
| `Colors.light.surfaceContainer` | — | Heritage spices background |
| `Colors.light.surfaceContainerHigh` | — | Placeholder image backgrounds |
| `Colors.light.onSurface` | — | Primary text |
| `Colors.light.onSurfaceVariant` | — | Secondary/muted text |
| `Colors.light.secondaryContainer` | — | Etiquette icon circle bg |
| `#FCF3E8` | — | Quote card background |
| `#FFFFFF` | — | Tasting cards, heritage cards, street food bg |
