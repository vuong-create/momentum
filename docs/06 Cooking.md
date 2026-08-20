# Momentum — Cooking Pillar

**Status:** 🟢 Foundation Implemented
**Next Step:** Real-World QA and Refinement

---

# 1. Purpose

The Cooking pillar is a personal meal-planning, recipe, and grocery system.

Its purpose is to answer:

> **What am I eating this week, and what do I need to buy?**

Cooking should make deciding what to eat easier without becoming a complicated recipe-management or nutrition-tracking application.

Core flow:

> **Meals → Weekly Plan → Grocery List → Cook**

---

# 2. Core Principles

## Personal Cookbook

Momentum is primarily a collection of meals the user actually cooks and enjoys.

It is not intended to become a giant recipe discovery website.

## Visual

Cooking should be one of Momentum's most visually enjoyable pillars.

Recipe photos should make browsing meals feel like looking through a personal cookbook.

## Low Friction

Planning meals and creating a grocery list should require very little typing.

## Connected

Cooking integrates directly with the global Momentum Weekly Plan.

Meal planning should never require maintaining a second calendar.

---

# 3. Navigation

Cooking contains four primary sections:

1. This Week
2. Cookbook
3. Groceries
4. Kitchen Journal

---

# 4. Cooking Dashboard

The Cooking landing page should prioritize the current week.

Example:

## Cooking

### This Week

**MON** — Chipotle Bowls
**TUE** — Japanese Curry
**WED** — Leftovers
**THU** — Steak & Potatoes
**FRI** — Eating Out
**SAT** — Ramen
**SUN** — Open

Quick actions:

`+ Plan Meal`

`🛒 Grocery List`

`◉ Kitchen Journal`

---

# 5. Weekly Meal Planning

Cooking displays a meal-focused version of the global Momentum Weekly Plan.

All seven days are visible.

Meals can be:

* Added
* Removed
* Reordered
* Dragged between days
* Replaced

Changes automatically sync with Momentum Home.

---

# 6. One Plan, Multiple Views

Cooking does not maintain a separate calendar.

A planned dinner is the same underlying Weekly Plan item displayed in multiple locations.

Example:

`Thursday — Japanese Curry`

can appear on:

* Momentum Home
* Today
* Weekly Plan
* Cooking

Moving the meal from Thursday to Friday updates every view.

Principle:

> **One item, displayed wherever useful.**

---

# 7. Quick Meal Options

Not every dinner needs a recipe.

Cooking includes quick options:

* Leftovers
* Eating Out
* Open

These can be added directly to the meal plan without creating fake recipe entries.

## Cooking Activity Identity

Not every Cooking activity is a meal. New Cooking Planner activities explicitly choose one of two identities:

* **Meal** — optionally labeled Breakfast, Lunch, Dinner, or Snack
* **Prep / kitchen task** — preparation, cleanup, shopping prep, and other supporting work

Recipe-linked meals and quick meal options are also recognized as meals. Only meal activities appear in the weekly meal plan and cooked-meal history. Both identities still contribute Cooking XP when completed through the normal activity lifecycle.

Existing Cooking activities without an identity are never guessed or rewritten. They remain **unclassified** until the user chooses an identity from activity details. This prevents titles such as “Prep vegetables” from being treated as dinner and protects future grocery generation from unreliable title inference.

---

# 8. Meals Database

Meals is the user's personal cookbook.

It stores meals and recipes that are actually worth cooking again.

Examples:

* Japanese Curry
* Chipotle Bowls
* Com Tấm
* Ramen
* Steak & Potatoes
* Udon Stir-Fry
* Congee
* Chicken Quesadillas

The database should grow naturally over time.

---

# 9. Meals View

Unlike Finance or Chinese, Meals should use a **visual card layout** rather than a spreadsheet-style table.

Example:

```text id="meals-view"
┌──────────────────────┐
│                      │
│       [PHOTO]        │
│                      │
│   Japanese Curry     │
│   Japanese · Easy    │
│                      │
└──────────────────────┘
```

Recipe cover photos should make browsing visually satisfying.

---

# 10. Recipe Structure

Each saved meal can contain:

* Name
* Cover photo
* Additional photos
* Default servings
* Ingredients
* Instructions
* Notes
* Tags
* Favorite status

Not every field is required.

Simple meals can remain simple.

---

# 11. Recipe Page

Example structure:

## Japanese Curry

**[ Large Cover Photo ]**

`⭐ Favorite`

`Add to Week`

`Add to Grocery List`

### Servings

`[-] 2 [+]`

### Ingredients

* Chicken thighs
* Potatoes
* Carrots
* Onion
* Curry blocks

### Instructions

1. Brown chicken.
2. Cook vegetables.
3. Add water.
4. Simmer until tender.
5. Lower heat and add curry blocks.

### Photos

`[ Photo ] [ Photo ] [ + Add ]`

### Notes

Optional cooking notes.

### Tags

`Japanese · Comfort · Easy`

---

# 12. Recipe Photos

Recipes support image uploads.

Each recipe can contain:

* One cover photo
* Multiple additional photos

Users can:

* Upload
* Replace
* Delete
* View larger
* Potentially drag-and-drop images
* Potentially paste images directly

The cover photo appears on the recipe card throughout Cooking.

---

# 13. Photo Persistence

Uploaded recipe photos must remain available after Momentum is closed or refreshed.

Photo persistence is an implementation requirement.

Momentum should not depend on the original image remaining in the same location on the computer.

The exact local storage method will be determined during implementation.

---

# 14. Favorites

Recipes can be marked:

`⭐ Favorite`

Favorites can be quickly filtered from the Meals page.

Favorite status can also influence future meal suggestion features.

---

# 15. Tags

Recipes can have custom tags.

Examples:

* Asian
* Taiwanese
* Vietnamese
* Japanese
* Korean
* Quick
* Comfort
* High Protein
* Date Night
* Easy
* Soup
* Pasta

Tags are customizable.

Recipes can contain multiple tags.

---

# 16. Search & Filtering

Meals supports normal search.

Example:

`🔎 chicken`

could return all recipes containing chicken.

Filters can include:

* Favorites
* Tags
* Recently Cooked

Example quick filters:

`⭐ Favorites · Quick · High Protein · Asian · Comfort · Recently Cooked`

Filtering should remain simple.

---

# 17. Serving Size

Recipes contain a default serving size.

Example:

> **Servings: 2**

The user can adjust servings:

`[-] 2 [+]`

Ingredient quantities automatically scale.

Example:

Original:

`1 lb chicken thighs`

Changing:

`2 servings → 4 servings`

results in:

`2 lb chicken thighs`

Instructions generally remain unchanged.

---

# 18. Grocery List

The Grocery List is a major component of Cooking.

It should function as a fast shopping checklist.

Example:

## Groceries

### Produce

☐ Broccoli
☐ Scallions
☐ Potatoes

### Meat / Seafood

☐ Chicken thighs
☐ Ground beef

### Dairy

☐ Half & half
☐ Monterey Jack

### Pantry

☐ Rice
☐ Soy sauce

### Frozen

☐ Frozen corn

### Other

☐ Paper towels

`+ Add Item`

---

# 19. Grocery Categories

Items automatically sort into:

* Produce
* Meat / Seafood
* Dairy
* Pantry
* Frozen
* Other

Momentum should attempt to assign the category automatically.

The user can manually change the category when needed.

---

# 20. Grocery Quick Add

Adding individual grocery items should be extremely fast.

Primary flow:

`+ Add Item`

Type:

`Eggs`

Press Enter.

Done.

No large form is required.

---

# 21. Frequent Items

Momentum automatically learns frequently added grocery items.

Example:

## Frequent

`Eggs · Milk · Rice · Chicken Thighs · Scallions · Half & Half`

Selecting an item immediately adds it to the grocery list.

Users should not need to manually maintain a separate Favorites database.

---

# 22. Grocery Autocomplete

When typing a grocery item, Momentum can suggest previously used items.

Example:

Type:

`chick...`

Suggestion:

`Chicken Thighs`

Selecting the suggestion adds the existing item quickly.

---

# 23. Recipe → Grocery List

Recipes can send their ingredients directly to the Grocery List.

From a recipe:

`Add Ingredients to Grocery List`

Momentum first displays the ingredients.

Example:

## Add Ingredients

☑ Chicken thighs
☑ Rice
☑ Monterey Jack
☑ Avocado
☑ Sour cream

The user unchecks anything already available at home.

Then:

`Add 3 Items`

Only selected ingredients are added.

---

# 24. Scaled Grocery Ingredients

Recipe ingredient quantities should reflect the selected serving count before being added to the Grocery List.

Example:

Recipe:

`2 servings`

Chicken:

`1 lb`

If changed to:

`4 servings`

Momentum sends:

`2 lb chicken`

to the Grocery List.

---

# 25. Duplicate Ingredients

Momentum should attempt to combine duplicate grocery ingredients.

Example:

Meal A requires:

`1 onion`

Meal B requires:

`2 onions`

Rather than:

`☐ Onion`
`☐ Onion`

Momentum should ideally combine them:

`☐ Onions — 3`

Exact quantity merging can be refined during implementation because ingredient units may differ.

When Momentum cannot confidently combine quantities, it should avoid making incorrect assumptions.

---

# 26. Manual Grocery Items

The Grocery List is not limited to recipes.

Any grocery or household item can be manually added.

Examples:

* Paper towels
* Dish soap
* Coffee
* Snacks
* Cleaning supplies

These items can use the **Other** category or another appropriate category.

---

# 27. Grocery Shopping

While shopping, items can be checked off with one tap.

Example:

`☑ Chicken thighs`

Checked items should visually move out of the way or become subdued.

The exact interaction can be refined during implementation.

---

# 28. Grocery Persistence

The Grocery List remains until items are checked/cleared.

Closing Momentum should not erase the list.

The user should have an easy:

`Clear Completed`

action.

There should also be protection against accidentally deleting the entire active list.

---

# 29. Kitchen Journal

Cooking includes a visual history of meals that actually reached the table.

The Journal derives its entries from completed meal plans and spontaneous cookbook completions. It does not create a second completion system.

Each entry may include:

* Cookbook artwork
* Date cooked
* Recipe link
* Times-made context
* An optional post-cooking note

The history can be searched and viewed by month. Clicking a recipe-linked entry opens the normal cookbook record.

---

# 30. History Philosophy

The Journal should help answer:

> **What have I actually cooked, and what would I remember next time?**

It does not add ratings, nutrition scoring, streak pressure, or a separate cooking database. Planner completion and cooking logs remain authoritative.

Meal suggestions can remain a future, contextual action inside planning rather than occupying a permanent primary tab.

---

# 31. Recently Cooked

Momentum automatically tracks when saved meals are cooked.

A meal can become cooked when its planned Weekly Plan item is completed.

This updates:

**Recently Cooked**

without requiring separate logging.

Example:

* Japanese Curry — Jul 29
* Chipotle Bowls — Jul 27
* Steak & Potatoes — Jul 24

---

# 32. Cook Again

Recently Cooked meals include:

`Cook Again`

Selecting it allows the meal to be quickly added back into the Weekly Plan.

This makes repeating staple meals easy.

---

# 33. Cooking History

Cooking does not require a complicated history page.

Recently Cooked provides enough history for Version 1.

Future versions can add deeper history if it proves useful.

---

# 34. Dashboard / Home Integration

The Momentum Home pillar summary for Cooking can show something like:

## 🍳 Cooking

**5 meals planned this week**

Selecting the card opens Cooking.

Meals scheduled in Cooking also appear directly inside the global Weekly Plan.

---

# 35. Cooking + Today

If today's dinner is:

`🍳 Japanese Curry`

it appears in Momentum Today.

Selecting the meal can open its recipe directly.

This creates a useful flow:

> See dinner → Open recipe → Cook.

---

# 36. Meal Completion

A planned meal can be marked complete.

Completing it:

* Completes the Weekly Plan item
* Updates Recently Cooked
* Updates Cooking history
* Can eventually generate a global XP event

No separate:

`I cooked this`

logging step is required.

---

# 37. Visual Direction

Cooking should be one of Momentum's most visually rich pillars.

Desired feeling:

* Personal cookbook
* Warm
* Cozy
* Food-focused
* Image-heavy
* Easy to browse

The visual direction should fit Momentum's broader cozy Asian café / anime-inspired environment.

Recipe photography should provide much of the visual identity.

---

# 38. Meal Cards

Meal cards should prioritize:

1. Photo
2. Meal name
3. Small useful tags

Avoid displaying excessive recipe information on the card.

Selecting the card opens the complete recipe.

---

# 39. No Nutrition Tracking

Version 1 does not include:

* Calories
* Macros
* Protein tracking
* Weight-loss goals
* Nutrition scores

Cooking is about:

> **What should I cook, what do I need, and how do I make it?**

Nutrition tracking can remain outside Momentum unless there is a future reason to add it.

---

# 40. No Pantry Inventory

Momentum does not maintain a complete inventory of everything currently inside the kitchen.

This would create excessive maintenance.

Instead, Recipe → Grocery List simply allows the user to uncheck ingredients already available.

This preserves the benefit without requiring pantry management.

---

# 41. No Expiration Tracking

Momentum does not track:

* Food expiration dates
* Refrigerator inventory
* Freezer inventory
* Purchase dates

These systems would create more logging than value for Version 1.

---

# 42. Low-Friction Rule

Before adding any Cooking feature, ask:

> **Does this make deciding, shopping, or cooking easier?**

If not, it probably does not belong.

The Cooking pillar should never become another system that requires constant maintenance.

---

# 43. Global Weekly Plan

Cooking relies heavily on the Weekly Plan defined in:

`01 Core & Home.md`

Cooking does not build its own separate scheduling system.

Meals are simply a specialized type of global Weekly Plan item.

This keeps Home and Cooking synchronized automatically.

---

# 44. XP

Cooking does not define its own XP system.

Cooking can generate events that the global Momentum XP system may later use.

Potential events:

* Planned meal cooked
* Meal prep completed
* New recipe saved
* Weekly meal plan completed

Actual XP rules belong in:

`02 XP System.md`

---

# 45. Future Ideas

Potential future additions:

* Import recipe from website
* Import recipe from text
* Recipe sharing
* Ingredient-based meal suggestions
* Better grocery quantity merging
* Recipe ratings
* Cooking notes/history
* Seasonal meal suggestions
* Automatic recipe image compression
* Grocery list export/share
* Print-friendly recipe mode

These are **not required for Version 1**.

---

# 46. North Star

Cooking succeeds when Momentum makes this sequence effortless:

> **What should I eat?**

↓

> **Plan it.**

↓

> **Know what to buy.**

↓

> **Open the recipe and cook.**

The user should spend more time cooking and less time maintaining the system.

---

# 47. Design Status

* [x] Pillar purpose
* [x] Weekly meal planning
* [x] Global Weekly Plan integration
* [x] Leftovers / Eating Out / Open
* [x] Personal Meals database
* [x] Visual recipe cards
* [x] Recipe pages
* [x] Cover photos
* [x] Photo galleries
* [x] Photo persistence requirement
* [x] Favorites
* [x] Tags
* [x] Search & filtering
* [x] Serving scaling
* [x] Grocery List
* [x] Grocery categories
* [x] Quick Add
* [x] Frequent Items
* [x] Grocery autocomplete
* [x] Recipe → Grocery List
* [x] Duplicate ingredient handling
* [x] Grocery persistence
* [x] Kitchen Journal
* [x] Recently Cooked
* [x] Cook Again
* [x] No nutrition tracking
* [x] No pantry inventory
* [x] XP separated from pillar
* [x] Ready for implementation

**Cooking Pillar Design: COMPLETE**

---

# 48. Current Foundation Implementation

The first production foundation is implemented with four focused views:

* **This Week** — a Sunday-first visual menu backed by the shared Planner, with full square cookbook artwork for recipe-linked meals
* **Cookbook** — a compact illustrated menu with five-column desktop browsing, handwritten titles, searchable recipes, favorites, serving sizes, ingredients, instructions, notes, and persistent cover photos
* **Groceries** — recipe transfer, serving scaling, category inference, quick add, checking, clearing, and undo
* **Kitchen Journal** — searchable and month-filtered visual cooking history with recipe links and optional post-cooking notes

Meal plans are normal `PlannedActivity` records with the Cooking pillar and a typed recipe or quick-meal activity kind. Momentum therefore has one calendar and one completion state across Cooking, Planner, Home, and XP.

Meal titles in **This Week** open the shared activity editor. A meal reclassified from Planner can therefore be inspected and edited directly from Cooking without creating a second record.

The implementation stores recipes, grocery items, and cooking logs in dedicated local-first tables. A cooking log records spontaneous **Cooked today** actions; completed planned meals remain authoritative Planner activities and are linked to their log for history and undo.

Completing a planned meal awards shared planned-activity XP. A spontaneous cooked meal awards base Cooking XP. Recipe editing and grocery maintenance never award XP. Both paths provide restrained Cooking-specific sound and motion feedback and respect global experience settings.

Each recipe can store one manually uploaded cover photo. The browser resizes and compresses it before saving it with the recipe, so the image remains local-first and travels with Momentum backup and restore. Existing recipes remain valid without a cover and show a quiet illustrated placeholder. Additional galleries and generated recipe artwork remain deferred.

Recipe cover art is rendered directly into the warm paper surface so white or transparent illustration backgrounds do not appear as detached rectangles. Recipe cards keep actions in a compact hover surface, allowing roughly fifteen meals to remain visible on a large desktop viewport.

Recipes may optionally declare one reusable **Menu section**. The default cookbook remains a dense all-recipes grid, while **Group sections** organizes cards under their section names and places recipes without a section under **Unsorted**. Full section management remains deferred.

The recipe editor derives **times made** and **last made** from cooking logs and completed recipe-linked Planner activities. The value is not manually stored, so completion and undo remain authoritative and cannot drift from the activity history.

The Kitchen Journal uses those same authoritative records. Notes are optional fields on persisted cooking logs; older completed Planner meals remain visible without being rewritten.

**Cooking Foundation: IMPLEMENTED**
