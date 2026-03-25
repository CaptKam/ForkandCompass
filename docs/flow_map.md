# Fork & Compass — App Flow Map

**Stack:** Expo Router (file-based routing) · React Native · pnpm monorepo
**Last updated:** March 2026

---

## App Entry

```
app/index.tsx  (root gate)
  │
  ├── hasSeenWelcome = false  ──────────────────────► /onboarding
  │
  └── hasSeenWelcome = true   ──────────────────────► /(tabs)  [Discover]
```

---

## Onboarding

```
/onboarding
  └── Complete onboarding ──────────────────────────► /(tabs)  [Discover]
```

---

## Bottom Tab Bar  (5 tabs)

```
┌─────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
│  Discover   │    Search    │     Plan     │     Cook     │   Profile    │
│  (tabs)/    │  (tabs)/     │  (tabs)/     │  (tabs)/     │  (tabs)/     │
│  index.tsx  │  search.tsx  │   plan.tsx   │   cook.tsx   │  profile.tsx │
└─────────────┴──────────────┴──────────────┴──────────────┴──────────────┘
```

---

## Tab: Discover  `(tabs)/index.tsx`

```
Discover
  │
  ├── Hero Carousel  (swipe by country)
  │     ├── "Let's Go" button ──────────────────────► /country/[id]
  │     └── Bookmark toggle   (saves country, no nav)
  │
  ├── Explore Destinations strip
  │     └── Tap circle  (updates activeIndex, no push)
  │
  ├── Featured Locations cards
  │     └── Tap card ────────────────────────────────► /region/[countryId]/[region]
  │
  ├── Tonight's Tasting Menu  (3 auto-picked recipes)
  │     └── Tap recipe row ──────────────────────────► /recipe/[id]
  │
  └── The Spice Market  "View All"
        └── Tap ─────────────────────────────────────► /country/[id]
```

---

## Tab: Search  `(tabs)/search.tsx`

```
Search
  │
  ├── Country result ───────────────────────────────► /country/[id]
  └── Recipe result  ───────────────────────────────► /recipe/[id]
```

---

## Tab: Plan  `(tabs)/plan.tsx`

```
Plan
  │
  ├── No itinerary set
  │     ├── "Set up itinerary" ──────────────────────► /itinerary-setup
  │     └── Edit preferences  ──────────────────────► /itinerary-setup
  │
  ├── Daily plan card
  │     ├── Recipe title / thumbnail ───────────────► /recipe/[id]
  │     └── "Start Cooking" button ─────────────────► /cook-mode  (with recipeId)
  │
  └── Day row tap (expand/collapse)  (no nav)
```

---

## Tab: Cook  `(tabs)/cook.tsx`

```
Cook
  │
  ├── "Start Cooking" on today's recipe ───────────► /cook-mode  (with recipeId)
  ├── "Random recipe" ─────────────────────────────► /cook-mode  (random recipeId)
  ├── Recipe card tap ─────────────────────────────► /recipe/[id]
  └── "Back to Discover" ────────────────────────── ► /(tabs)  [Discover]
```

---

## Tab: Profile  `(tabs)/profile.tsx`

```
Profile
  │
  ├── Saved Countries  (horizontal chips)
  │     └── Tap country chip ────────────────────────► /country/[id]
  │
  ├── Saved Regions  (horizontal chips)
  │     └── Tap region chip ─────────────────────────► /region/[countryId]/[region]
  │
  ├── Saved Recipes  (list)
  │     ├── Tap recipe row ───────────────────────────► /recipe/[id]
  │     └── Bookmark toggle  (unsaves recipe, no nav)
  │
  ├── Itinerary Preferences
  │     └── Tap card ────────────────────────────────► /itinerary-setup
  │
  └── Reset All Data  (clears state → triggers /onboarding)
```

---

## Stack Screen: Country Detail  `/country/[id]`

```
/country/[id]
  │
  ├── Region / location card ───────────────────────► /region/[countryId]/[region]
  ├── Recipe card ─────────────────────────────────► /recipe/[id]
  └── Back button ────────────────────────────────── router.back()
```

---

## Stack Screen: Region Detail  `/region/[countryId]/[region]`

```
/region/[countryId]/[region]
  │
  ├── Recipe card ─────────────────────────────────► /recipe/[id]
  ├── "Experience" / cultural deep-dive ──────────► /experience/[countryId]/[region]
  └── Back button ────────────────────────────────── router.back()
```

---

## Stack Screen: Experience Detail  `/experience/[countryId]/[region]`

```
/experience/[countryId]/[region]
  │
  ├── "Add to Plan" / CTA ─────────────────────────► /(tabs)/plan
  └── Back button ────────────────────────────────── router.back()
```

---

## Stack Screen: Recipe Detail  `/recipe/[id]`

```
/recipe/[id]
  │
  ├── "Start Cooking" ─────────────────────────────► /cook-mode  (with recipeId)
  ├── Related recipe card ─────────────────────────► /recipe/[id]  (another recipe)
  ├── Region / origin link ────────────────────────► /region/[countryId]/[region]
  └── Back button ────────────────────────────────── router.back()
```

---

## Stack Screen: Cook Mode  `/cook-mode`

```
/cook-mode  (receives recipeId param)
  │
  ├── Step-by-step cooking  (no nav while active)
  ├── Exit / done ─────────────────────────────────── router.back()
  └── Recipe not found ────────────────────────────── router.back()
```

---

## Stack Screen: Itinerary Setup  `/itinerary-setup`

```
/itinerary-setup  (multi-step wizard)
  │
  ├── Save & finish ───────────────────────────────── router.back()
  └── Cancel ─────────────────────────────────────── router.back()
```

---

## Stack Screen: Settings  `/settings`

```
/settings  (legacy route — still exists as a stack screen)
  │
  ├── Same content as Profile tab (settings.tsx)
  ├── Saved items, Cooking Level, Itinerary, Grocery, Appearance, About
  └── Back button ────────────────────────────────── router.back()

  Note: Profile tab (profile.tsx) is the primary access point.
        /settings remains accessible via deep link.
```

---

## Full Navigation Graph (summary)

```
                        ┌────────────────────────────┐
                        │       app/index.tsx         │
                        │  (entry / auth gate)        │
                        └────────────┬───────────────┘
                 first launch ◄──────┴──────► returning user
                        │                         │
                 /onboarding               /(tabs) [Discover]
                        │                         │
                        └────────────────►  /(tabs)
                                              │
              ┌──────────┬──────────┬──────────┼──────────┐
              │          │          │          │          │
          Discover    Search      Plan       Cook      Profile
              │          │          │          │          │
              └──────────┴────┬─────┴──────────┘          │
                              │                           │
                    ┌─────────▼──────────────────────┐    │
                    │       /country/[id]             │    │
                    └─────────┬──────────────────────┘    │
                              │                           │
                    ┌─────────▼──────────────────────┐    │
                    │   /region/[countryId]/[region]  │◄───┘
                    └─────────┬──────────────────────┘
                              │
                    ┌─────────▼──────────────────────┐
                    │  /experience/[countryId]/[reg]  │
                    └─────────┬──────────────────────┘
                              │ → /(tabs)/plan
                              │
                    ┌─────────▼──────────────────────┐
                    │        /recipe/[id]             │◄─── all tabs
                    └─────────┬──────────────────────┘
                              │
                    ┌─────────▼──────────────────────┐
                    │          /cook-mode             │◄─── Plan, Cook tabs
                    └────────────────────────────────┘

                    ┌────────────────────────────────┐
                    │       /itinerary-setup          │◄─── Plan, Profile tabs
                    └────────────────────────────────┘
```

---

## Route Reference

| Route | File | Type |
|---|---|---|
| `/` | `app/index.tsx` | Entry gate |
| `/onboarding` | `app/onboarding.tsx` | Stack |
| `/(tabs)` | `app/(tabs)/_layout.tsx` | Tab root |
| `/(tabs)/` | `app/(tabs)/index.tsx` | Tab — Discover |
| `/(tabs)/search` | `app/(tabs)/search.tsx` | Tab — Search |
| `/(tabs)/plan` | `app/(tabs)/plan.tsx` | Tab — Plan |
| `/(tabs)/cook` | `app/(tabs)/cook.tsx` | Tab — Cook |
| `/(tabs)/profile` | `app/(tabs)/profile.tsx` | Tab — Profile |
| `/country/[id]` | `app/country/[id].tsx` | Stack |
| `/region/[countryId]/[region]` | `app/region/[countryId]/[region].tsx` | Stack |
| `/experience/[countryId]/[region]` | `app/experience/[countryId]/[region].tsx` | Stack |
| `/recipe/[id]` | `app/recipe/[id].tsx` | Stack |
| `/cook-mode` | `app/cook-mode.tsx` | Stack |
| `/itinerary-setup` | `app/itinerary-setup.tsx` | Stack |
| `/settings` | `app/settings.tsx` | Stack (legacy) |
