# Fork & Compass — Mobile App Navigation Flow Map

> Every button and tap target, and where it takes the user.

---

## App Launch

```
App opens
  └─ Checks if user has completed onboarding
        ├─ Not onboarded ──────────────────────► ONBOARDING
        └─ Already onboarded ──────────────────► DISCOVER (tab)
```

---

## ONBOARDING  `/onboarding`

| Button / Tap | Destination |
|---|---|
| "Start Your Journey →" | **DISCOVER tab** (replaces history — cannot go back) |

---

## BOTTOM TAB BAR  (always visible)

| Tab | Screen |
|---|---|
| Discover | `/(tabs)/index` |
| Itinerary | `/(tabs)/itinerary` |
| Search | `/(tabs)/search` |
| Grocery | `/(tabs)/grocery` |
| Cook | `/(tabs)/cook` |
| Saved | `/(tabs)/saved` |

> Settings is a hidden tab — not in the tab bar; accessed via Discover only.

---

## DISCOVER TAB  `/(tabs)/index`

| Button / Tap | Destination |
|---|---|
| Country destination card | **COUNTRY** `/country/[id]` |
| Featured recipe card | **RECIPE DETAIL** `/recipe/[id]` |
| "View All" on featured country | **COUNTRY** `/country/[id]` |
| Gear / Settings icon (top-right) | **SETTINGS** `/(tabs)/settings` |

---

## SEARCH TAB  `/(tabs)/search`

| Button / Tap | Destination |
|---|---|
| Country result card | **COUNTRY** `/country/[id]` |
| Recipe result card | **RECIPE DETAIL** `/recipe/[id]` |
| "Italy" quick-pick chip | **COUNTRY** `/country/italy` |
| "Japan" quick-pick chip | **COUNTRY** `/country/japan` |

---

## ITINERARY TAB  `/(tabs)/itinerary`

### Empty state (no itinerary set up)

| Button / Tap | Destination |
|---|---|
| "Plan My Week" | **ITINERARY SETUP** `/itinerary-setup` |

### Active itinerary

| Button / Tap | Destination |
|---|---|
| "Edit" (header, top-right) | **ITINERARY SETUP** `/itinerary-setup` |
| Tonight's card — tap image or title | **RECIPE DETAIL** `/recipe/[id]` |
| Tonight's card — "View Full Experience" | **RECIPE DETAIL** `/recipe/[id]` |
| Tonight's card — "Start Cooking →" | **COOK MODE** `/cook-mode` |
| Tonight's card — mode chip (Quick / Full) | Toggles mode *(state change, no navigation)* |
| Day card — tap anywhere | **RECIPE DETAIL** `/recipe/[id]` |
| Day card — ↺ Reload button | Swaps recipe for that day *(state change)* |
| Day card — ✕ Skip button | Marks day as skipped *(state change)* |
| Day card — "Restore" (on skipped days) | Re-activates the skipped day *(state change)* |
| "Generate new week" (bottom link) | Generates a fresh week *(state change)* |
| "Get All Ingredients" FAB | Adds all active recipes to grocery list *(state change)* |

### All-done state (all days completed or skipped)

| Button / Tap | Destination |
|---|---|
| "Plan Next Week" | Generates a new week *(state change)* |

---

## ITINERARY SETUP  `/itinerary-setup`  (multi-step wizard)

| Button / Tap | Destination |
|---|---|
| Back arrow (header) | **Previous screen** (back) |
| Cooking days option chips | Selects days-per-week *(state change)* |
| Country/cuisine checkboxes | Selects preferred cuisines *(state change)* |
| Servings − / + buttons | Adjusts serving size *(state change)* |
| "Next →" | Advances to next wizard step |
| "Generate My Week" (final step) | Saves preferences and returns to **ITINERARY tab** |

---

## GROCERY TAB  `/(tabs)/grocery`

| Button / Tap | Destination |
|---|---|
| "Scan Ingredients" / camera icon | **KITCHEN SCANNER** `/kitchen-scanner` |
| Ingredient row checkbox | Checks/unchecks ingredient *(state change)* |

---

## COOK TAB  `/(tabs)/cook`

| Button / Tap | Destination |
|---|---|
| Featured recipe card | **RECIPE DETAIL** `/recipe/[id]` |
| Recipe list item | **RECIPE DETAIL** `/recipe/[id]` |

---

## SAVED TAB  `/(tabs)/saved`

| Button / Tap | Destination |
|---|---|
| Country group header | **COUNTRY** `/country/[id]` |
| Saved recipe card | **RECIPE DETAIL** `/recipe/[id]` |

---

## SETTINGS  `/(tabs)/settings`  *(hidden from tab bar)*

| Button / Tap | Destination |
|---|---|
| "Edit Itinerary Preferences" | **ITINERARY SETUP** `/itinerary-setup` |

---

## COUNTRY  `/country/[id]`

| Button / Tap | Destination |
|---|---|
| Back ← (header) | **Previous screen** |
| Region card | **REGION** `/region/[countryId]/[region]` |

---

## REGION  `/region/[countryId]/[region]`

| Button / Tap | Destination |
|---|---|
| Back ← (header) | **Previous screen** |
| Recipe card | **RECIPE DETAIL** `/recipe/[id]` |
| "Explore [Region]" button | **EXPERIENCE** `/experience/[countryId]/[region]` |

---

## EXPERIENCE  `/experience/[countryId]/[region]`

> Full editorial experience for a specific region (immersive scroll).

| Button / Tap | Destination |
|---|---|
| Back ← (header) | **Previous screen** |
| "Add to Grocery" button | **GROCERY tab** `/(tabs)/grocery` |

---

## RECIPE DETAIL  `/recipe/[id]`

| Button / Tap | Destination |
|---|---|
| Back ← (header) | **Previous screen** |
| Bookmark / Save icon | Saves or unsaves recipe *(state change)* |
| Ingredient checkbox | Checks/unchecks *(state change)* |
| "Add to Grocery List" | Adds recipe to grocery list *(state change)* |
| "Enter Cook Mode" | **COOK MODE** `/cook-mode?id=[id]` |
| Next recipe card (bottom) | **RECIPE DETAIL** `/recipe/[id]` (another recipe) |

---

## COOK MODE  `/cook-mode`

> Step-by-step guided cooking with a timer.

| Button / Tap | Destination |
|---|---|
| ✕ Close / Back | **Previous screen** |
| Step navigation (prev / next) | Advances through recipe steps *(state change)* |

---

## KITCHEN SCANNER  `/kitchen-scanner`

> Camera-based ingredient scanning.

| Button / Tap | Destination |
|---|---|
| Back ← / ✕ Close | **Previous screen** |
| Scan result actions | Adds scanned items to grocery list *(state change)* |

---

## Full Flow Diagram (simplified)

```
LAUNCH
  └─ ONBOARDING ────────────────────────────────────► DISCOVER (tab)
                                                            │
        ┌───────────────────────────────────────────────────┤
        │                                                   │
   [Settings icon]                              [Country card / Recipe card]
        │                                                   │
        ▼                                                   ▼
    SETTINGS ──[Edit Prefs]──► ITINERARY SETUP      COUNTRY ──► REGION ──► RECIPE DETAIL
                                     │                                          │    │
                              (saves & returns)                        [Cook Mode] [Add Grocery]
                                     │                                     │
                                     ▼                                     ▼
                               ITINERARY (tab)                        COOK MODE
                                     │
               ┌─────────────────────┼─────────────────────┐
               │                     │                     │
          [Tonight's card]     [Day card tap]      [Get Ingredients FAB]
               │                     │                     │
               ▼                     ▼                     ▼
         RECIPE DETAIL         RECIPE DETAIL         (adds to list, stays)
               │
          [Cook Mode btn]
               │
               ▼
           COOK MODE

GROCERY (tab) ──[Scan]──► KITCHEN SCANNER
SEARCH (tab)  ──[result]──► COUNTRY or RECIPE DETAIL
COOK (tab)    ──[recipe]──► RECIPE DETAIL
SAVED (tab)   ──[recipe]──► RECIPE DETAIL
              ──[country]──► COUNTRY
```
