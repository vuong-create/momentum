# Momentum — App Architecture

**Status:** 🟢 Technical Direction Defined
**Next Step:** Build Foundation

---

# 1. Purpose

This document defines howduct specifications define:

> **What Momentum should do.**

`08 Data Architecture.md` defines:

> **What information Momentum stores.**

This document defines:

> **What technology and application structure will make those systems work together.**

The primary goal is to create an applable

* Easy to expand
* Easy to back up
* Comfortable to develop incrementally

---

# 2. Primary Platform

Momentum Version 1 will be built as a:

> **Chrome / Chromium New Tab Extension**

Opening a new browser tab should open Momentum automatically.

This preserves the original Momentum goal:

> **Momentum should naturally appear throughout the day without requiring the user to remember to open another application.**

Momentum remains entirely local to the Mac.

No cloud service is required.

---

# 3. Why Browser-First

Momentum originally began as a browser New Tab homepage.

That remains the best fit.

Advantages:

* Appears automatically when opening new tabs
* No separate application to remember to launch
* Works naturally with the existing desktop workflow
* Can operate offline
* Can store substantial structured local data
* Can eventually export local backups
* Keeps Version 1 relatively simple

A desktop wrapper is unnecessary for the initial version.

---

# 4. Future Desktop Option

Momentum should not be architected in a way that prevents a desktop version later.

If a future version would benefit from:

* Native Mac integrations
* More direct filesystem access
* Notifications
* Menu bar tools
* Deeper OS integration

the core React application could later potentially be packaged into a desktop shell.

This is not required for Version 1.

---

# 5. Recommended Technology Stack

Momentum Version 1 should use:

## Interface

**React**

## Language

**TypeScript**

## Build Tool

**Vite**

## Local Database

**IndexedDB**

## IndexedDB Wrapper

**Dexie**

## Browser Integration

**Chrome Extension — Manifest V3**

## Styling

Standard CSS organized around Momentum's design system.

Additional libraries should only be introduced when they solve a genuine problem.

---

# 6. Why React

Momentum has grown beyond a simple static HTML page.

It now contains many reusable interactive systems:

* Weekly Planner
* Tasks
* Modals
* Forms
* Tables
* Progress bars
* Workout logger
* Grocery list
* Recipe cards
* Journal
* Charts
* XP
* Navigation

React allows those pieces to become reusable components rather than one large collection of manually manipulated HTML elements.

---

# 7. Why TypeScript

Momentum will contain interconnected records such as:

* Tasks
* Workouts
* Transactions
* Recipes
* XP events
* Journal entries

TypeScript helps define what those records are supposed to contain.

Example conceptual type:

```text
PlannedActivity

id
title
pillar
scheduledDate
status
```

If one part of Momentum attempts to use that object incorrectly, TypeScript helps detect the problem during development rather than allowing silent bugs.

This becomes increasingly valuable as Momentum grows.

---

# 8. Why Vite

Vite will provide the development and build environment.

During development it allows Momentum to:

* Start quickly
* Refresh automatically when code changes
* Compile TypeScript
* Bundle React
* Build optimized production files

The final compiled extension contains normal browser-ready:

* HTML
* CSS
* JavaScript
* Images
* Manifest files

The user does not need to understand the build system during normal Momentum use.

---

# 9. Extension Structure

Conceptually:

```text
Momentum/
│
├── manifest.json
├── package.json
├── vite.config.ts
│
├── docs/
│   ├── 00 Vision.md
│   ├── 01 Core.md
│   ├── 02 XP System.md
│   ├── 03 Finance.md
│   ├── 04 Chinese.md
│   ├── 05 Athletics.md
│   ├── 06 Cooking.md
│   ├── 07 Happiness.md
│   ├── 08 Data Architecture.md
│   └── 09 App Architecture.md
│
├── src/
│   ├── app/
│   ├── components/
│   ├── features/
│   ├── database/
│   ├── services/
│   ├── styles/
│   ├── assets/
│   └── utils/
│
└── dist/
```

`dist/` becomes the folder Chrome actually loads as the extension.

---

# 10. Manifest

Momentum will use a Chrome extension manifest.

The extension identifies its compiled page as the custom New Tab page.

Conceptually:

```text
manifest.json

Momentum
Manifest Version 3
New Tab → index.html
```

The manifest should request as few permissions as possible.

Momentum is a personal local application and should not ask for unrelated browser access.

---

# 11. Minimal Permission Philosophy

Momentum should follow:

> **Request only what the feature actually requires.**

Version 1 should not require broad permissions to:

* Read browsing history
* Read arbitrary websites
* Read tabs
* Monitor browsing
* Access online accounts

The New Tab experience itself should remain tightly scoped.

---

# 12. Application Shell

The first code built should be the **Momentum Shell**.

It provides:

* Main layout
* Navigation
* Page routing
* Database initialization
* Settings initialization
* Shared visual design
* Error handling

The pillars are then built inside this shell.

---

# 13. Main Navigation

Primary navigation:

* Home
* Finance
* Chinese
* Athletics
* Cooking
* Happiness
* Settings

Navigation should remain available throughout Momentum.

## Current Navigation Direction

Momentum uses a permanent icon-only **Momentum Rail** on desktop and a compact
bottom dock on mobile. It never expands into a conventional text sidebar.

The rail uses:

* One cohesive repository-native SVG icon system with precision-line navigation
  symbols and a faceted geodesic Momentum mark
* Muted icon-specific color at rest, with brighter color on hover and selection
* A restrained sliding active lens with pillar-color accents
* Cursor-proximity motion on the hovered icon and its neighbors
* Delayed glass tooltips for labels
* A time-aware presence orb driven by the shared Presence system
* Optional quiet navigation feedback through the shared audio engine
* Keyboard focus states and reduced-motion support

Navigation remains an application shell concern. Feature pages do not own or
duplicate its state, icons, motion logic, or responsive behavior.

Functionally, routing should remain simple.

---

# 14. Page Routing

Momentum uses client-side navigation.

Changing from:

`Home → Finance`

should not reload the entire application.

Routes conceptually include:

```text
/
 /finance
 /finance/transactions
 /finance/budget
 /finance/reports

 /chinese
 /chinese/database
 /chinese/progress

 /athletics
 /athletics/workout
 /athletics/history

 /cooking
 /cooking/meals
 /cooking/groceries

 /journal
 /journal/calendar
 /journal/look-back
 /journal/quotes

 /settings
```

Exact URLs are less important than clean navigation structure.

---

# 15. Feature-Based Code Organization

Code should primarily be organized by feature rather than placing hundreds of unrelated files together.

Conceptually:

```text
src/features/

core/
xp/
finance/
chinese/
athletics/
cooking/
journal/
settings/
```

Each feature can contain its own:

* Components
* Hooks
* Queries
* Logic
* Types
* Helpers

---

# 16. Shared Components

Reusable components belong outside individual pillars.

Examples:

```text
src/components/

Button
Modal
Input
Dropdown
ProgressBar
DataTable
Tabs
Calendar
Heatmap
ConfirmDialog
PhotoViewer
SearchBox
EmptyState
```

A Finance button and Cooking button should share core behavior even if they are styled slightly differently.

---

# 17. Design System

Momentum should have one central design system.

Define global concepts such as:

* Typography
* Spacing
* Border radius
* Shadows
* Surfaces
* Animation speed
* Background layers
* Text hierarchy

Pillars can have personality without becoming visually unrelated applications.

---

# 18. CSS Architecture

Start with standard CSS rather than introducing a large styling framework.

Suggested structure:

```text
styles/

tokens.css
base.css
layout.css
animations.css

home.css
finance.css
chinese.css
athletics.css
cooking.css
journal.css
```

Reusable values should be defined centrally.

Example concepts:

```text
--space-small
--space-medium
--radius-card
--text-muted
--surface-panel
```

This makes future visual redesigns easier.

---

# 18.1 Experience System

Time-aware ambience, interaction sound, and motion preferences belong to one
cross-application experience system.

Current structure:

```text
src/
  experience/
    ExperienceProvider.tsx
    ExperienceContext.ts
    useExperience.ts
    audio/
      audioEngine.ts
    presence/
      clock.ts
      ambience.ts
      greetings.ts
```

Responsibilities:

* Presence calculates local time period, ambience, and greeting.
* The audio engine owns reusable procedural feedback cues.
* The provider applies the visible ambient layer and respects both app and
  system motion preferences.
* Feature UI requests semantic cues such as `task-added` or
  `task-completed`; it does not construct audio directly.
* Persistent preference writes remain in the Settings service.

Normal UI feedback should be brief and non-blocking. Weekly completion,
achievements, and level-up celebrations should use the same system but remain
rarer and more expressive.

---

# 19. Avoid Premature UI Frameworks

Version 1 does not need a huge prebuilt component library.

Momentum's visual identity is intentionally custom.

Using too much generic UI infrastructure could make the application resemble a standard corporate dashboard.

Reusable components should be built specifically for Momentum where practical.

---

# 20. Local Database

Momentum's main structured database will use:

> **IndexedDB**

IndexedDB stores application data inside the browser locally.

Examples:

* Tasks
* XP history
* Transactions
* Workouts
* Recipes
* Chinese entries
* Journal entries

No external database server is required.

---

# 21. Dexie

Momentum will use:

> **Dexie**

as the interface between Momentum and IndexedDB.

Instead of every feature manually dealing with low-level browser database operations:

```text
Open database
Create transaction
Open object store
Create request
Handle callbacks
```

Momentum can use cleaner database queries and versioned schemas.

---

# 22. Database Module

All database definitions should live centrally.

Conceptually:

```text
src/database/

db.ts
schema.ts
migrations.ts
seed.ts
backup.ts
```

Features interact with the shared database layer.

They should not each create their own unrelated storage system.

---

# 23. Database Tables

Initial IndexedDB stores broadly follow `08 Data Architecture.md`.

Core examples:

```text
plannedActivities
activityEvents
recurrenceRules
weeklySummaries

xpEvents
milestones

transactions
financeAccounts
financeCategories
financeSubcategories
monthlyBudgets
budgetAllocations
financialGoals
netWorthSnapshots

chineseEntries
chineseActivities

exercises
workoutTemplates
workoutSessions
workoutExercises
workoutSets
volleyballActivities
personalRecords

recipes
recipeIngredients
groceryItems

journalEntries
quotes
reflectionPrompts

media
settings
```

Exact indexing will be defined during implementation.

---

# 24. Database Schema Versioning

The database starts with:

```text
Schema Version 1
```

Future changes may require:

```text
Version 1
   ↓
migration
   ↓
Version 2
```

Existing Momentum data should migrate automatically where practical.

Users should not lose years of information because the application structure improves.

---

# 25. Database Access Pattern

UI components should not contain large amounts of database logic.

Bad pattern:

```text
FinanceDashboard.tsx
contains:
database reads
budget math
account calculations
UI rendering
formatting
```

Better:

```text
FinanceDashboard
        ↓
Finance service/query
        ↓
Database
```

This keeps logic reusable and testable.

---

# 26. Services

Shared business logic belongs in services.

Conceptually:

```text
src/services/

activityService
xpService
weeklyPlanService
backupService
mediaService
```

Feature-specific services may include:

```text
financeService
workoutService
recipeService
chineseService
journalService
```

---

# 27. Event-Driven Actions

Momentum should treat important real-world actions as events.

Example:

User completes workout.

```text
completeWorkout()
```

That action can trigger:

```text
Workout completion
      ↓
Activity Event
      ↓
Planner completion
      ↓
XP award
      ↓
PR detection
      ↓
UI refresh
```

The user should not manually call each system.

---

# 28. Activity Service

The Activity Service connects pillar actions with Momentum Core.

Responsibilities include:

* Creating Activity Events
* Connecting planned activities
* Marking completion
* Preventing duplicate events
* Providing activity history

This service is one of the most important integration layers in Momentum.

Current activity controls are implemented as a shared feature surface:

```text
src/features/activities/
  components/
    ActivityDetailsPanel
    ActivityUndoToast
    PillarIcon
    PillarQuickSelect
  hooks/
    useActivityUndo
  services/
    activityLifecycle
    activityService
```

Home and Planner open the same details drawer and invoke the same lifecycle
service. The UI requests semantic feedback cues, while mutation, XP, event,
and restoration rules remain outside presentational components.

`PillarIcon` and `PillarQuickSelect` are shared by Home and Planner so pillar
identity, accessibility behavior, and quick recategorization remain consistent
across both task surfaces.

The dense-week Planner composes those same records through view-specific UI:

```text
PlannerPage
  WeekHeader
    SegmentedProgress (shared with Home)
  PlannerComposer
    RecurrenceControls
  PlannerTemplates
  PlannerDayCarousel
    PlannerDayCard
  PlannerDayPanel
    PlannerTask
  ActivityDetailsPanel
    RecurrenceControls
```

Opening activity details from a day retains the selected date as return
context. Day Focus is temporarily replaced by Activity Details, then restored
when the activity inspector closes; drawers are never stacked.

Planner view context is session-persisted: the viewed week, carousel position,
selected composer day, open Day Focus date, per-day collapse/filter choices,
and Day Focus scroll position survive navigation away and back. The last-used
pillar is local-persisted because it is a durable input preference rather than
temporary view state.

Task mutations remain service-owned. Inline rename, drag rescheduling,
unscheduling, copying, manual ordering, quick moves, and bulk rollover all
route through the activity/planner services and surface a reversible undo
notice from `PlannerPage`.

Recurring activity behavior lives in
`features/activities/services/recurrenceService.ts`. It owns template
instantiation, recurrence normalization, duplicate-safe weekly
materialization, one-versus-future updates, skipping, ending, and reversible
series snapshots. Home and Planner both request materialization before reading
a week, then continue rendering ordinary live `PlannedActivity` records.

The Planner Day Focus and Activity Details surfaces are centered modal panels
on desktop. They retain full-screen behavior on narrow mobile layouts, keeping
scroll and action access reliable without preserving drawer-specific layout
assumptions.

---

# 29. XP Service

The XP Service handles:

* Base XP
* Planned bonus
* Duplicate protection
* Weekly bonuses
* Global Lifetime XP
* Pillar XP totals
* Global and pillar level curves
* Contribution summaries
* Milestones
* XP history

Pillars should not manually add numbers to a global XP total.

They report an eligible event.

The XP system decides the award.

One eligible pillar action produces one XP event. The XP service exposes that event through both the global and pillar progression views. Momentum-only bonuses use a separate scope and do not advance any pillar.

Conceptual feature structure:

```text
features/xp/
  components/
  services/
  progression.ts
  types.ts
```

Home consumes a read-only progression summary and opens a centered breakdown surface. Pillars request awards through the shared service and never maintain their own XP counters.

---

# 30. Weekly Planner Service

The Weekly Planner Service manages:

* Task creation
* Scheduling
* Rescheduling
* Completion
* Recurrence
* Dismissal
* Cancellation
* Weekly summaries

Home and pillar pages read from the same service/database records.

---

# 31. Derived Data

Most summary values should be calculated from underlying records.

Examples:

```text
Finance spending this month
Chinese active days
Athletics workouts this week
Cooking meals planned
Journal entries this week
```

These are calculated selectors/queries.

They should not become manually updated variables.

---

# 32. Local State vs. Persistent State

Not everything belongs in IndexedDB.

## Persistent State

Must survive refresh/restart:

* Tasks
* Transactions
* Workouts
* Recipes
* Journal entries
* XP
* Settings

## Temporary UI State

Does not need permanent storage:

* Which modal is open
* Current search field text
* Hover state
* Temporary form validation
* Current animation
* Selected tab during session

Keeping these separate reduces database clutter.

---

# 33. React State Strategy

Version 1 should avoid adding a complicated global state framework unless necessary.

Use:

* React component state
* React context where appropriate
* Dexie live database queries
* Shared hooks/services

If application complexity eventually justifies a dedicated state library, one can be introduced later.

---

# 34. Live Data Updates

Because multiple screens display the same underlying records, changes should propagate automatically.

Example:

Complete workout in Athletics.

Without reloading:

* Home checkbox updates
* Weekly Plan updates
* Athletics summary updates
* XP bar updates

The architecture should favor reactive database queries and shared state.

---

# 35. Media Architecture

Recipe and Journal photos require persistent local storage.

Version 1 should support storing image data locally alongside Momentum's database infrastructure.

The Media table stores metadata and references.

The actual image is stored once and referenced by:

* Recipes
* Journal entries

---

# 36. Image Data

Images should be stored as browser-supported binary data rather than converting everything into giant text strings.

Each image should have:

* Media ID
* Original filename
* File type
* Blob/file data
* Creation date

Potential future fields:

* Width
* Height
* Thumbnail
* Compressed version

---

# 37. Image Compression

Large phone photos can consume substantial storage.

Momentum should eventually compress oversized images when importing them.

Version 1 can begin conservatively:

* Preserve useful visual quality
* Limit extremely large dimensions
* Generate smaller thumbnails for lists/cards

Full-resolution originals do not necessarily need to be duplicated.

---

# 38. Image Thumbnails

Recipe cards and journal timelines should not repeatedly load full-resolution images.

Momentum should use thumbnails for:

* Recipe cards
* Journal previews
* Recently viewed entries

Full-size images load only when opened.

This keeps the New Tab page fast.

---

# 39. Performance Requirement

Momentum is replacing the browser New Tab page.

Therefore:

> **Home must feel immediate.**

The user may open dozens of tabs in a normal day.

Momentum should not:

* Load all financial history at startup
* Load hundreds of recipe images
* Calculate every historical chart
* Load every journal entry

Only required Home data should be loaded initially.

---

# 40. Lazy Loading

Heavy pillar features should load when opened.

Examples:

Opening Home should not immediately initialize:

* Detailed Finance reports
* Workout history charts
* Full recipe gallery
* Journal search

These features can load on demand.

---

# 41. Home Startup Data

Home initially needs only:

* Today's tasks
* Current week's tasks
* XP summary
* Five pillar summaries
* Journal quick entry
* Basic visual assets

This should be optimized heavily.

---

# 42. Charts

Charts should be reusable components.

They will primarily serve:

* Finance
* Athletics
* Chinese progress

A lightweight React-compatible charting library may be used rather than building chart rendering manually.

The exact library can be chosen during implementation.

Charts should remain functional before receiving advanced aesthetic polish.

---

# 43. Drag and Drop

Drag-and-drop will be important for:

* Weekly Planner
* Workout template exercise ordering
* Recipe photo ordering
* Potential other lists

Use a dedicated React-compatible drag-and-drop system rather than manually implementing complex mouse behavior.

The exact library can be selected when this feature is built.

---

# 44. Weekly Planner UI Architecture

The Weekly Planner is a shared component.

Conceptually:

```text
WeeklyPlanner
│
├── DayColumn × 7
│   └── ActivityCard
│
├── QuickAdd
├── WeekNavigation
└── UnfinishedPrompt
```

This same underlying planner data can be filtered inside individual pillars.

---

# 45. Activity Card

A reusable Activity Card should understand:

* Title
* Pillar
* Completion status
* Important status
* Schedule
* Linked record

Examples:

Athletics activity:

`🏋️ Push`

Cooking:

`🍳 Japanese Curry`

General:

`📖 Read`

Click behavior may differ based on the linked record.

---

# 46. Linked Navigation

If an activity references a specialized record:

Clicking it can open that record.

Examples:

`Push`

→ opens workout

`Japanese Curry`

→ opens recipe

`Close Month`

→ opens Finance monthly review

This makes the Weekly Planner actionable rather than merely informational.

---

# 47. Home Architecture

Home is primarily an aggregator.

It does not own most of its displayed data.

Conceptually:

```text
Home

Today
    ↓
Planned Activities

This Week
    ↓
Planned Activities

Pillar Summaries
    ↓
Derived pillar data

What's on Your Mind?
    ↓
Journal Entry

XP
    ↓
XP Events
```

---

# 48. Finance Module

Conceptual folder:

```text
features/finance/

FinancePage
financeCatalog
components/
  FinanceOverview
  TransactionComposer
  FinanceTransactions
  FinanceAccounts
  FinanceAccountModal
  FinanceBudget
  FinanceCategoryManager
  FinanceReports
services/
  financeService
  financeCalculations
  financeCategoryService
  financeBudgetService
  financeSnapshotService
```

Finance remains the largest independent module.

---

# 49. Finance Calculation Layer

Budget calculations should live in Finance logic, not visual components.

Examples:

```text
getMonthlySpending()
getBudgetProgress()
getCategoryTotals()
getSavingsRate()
getNetWorth()
getRollover()
```

This allows the same calculations to power:

* Dashboard
* Budget page
* Reports
* Home summary

without duplicating formulas.

---

# 50. Chinese Module

Conceptual folder:

```text
features/chinese/

ChinesePage
components/
  ChineseToday
  ChineseDatabase
  ChineseProgress
  ChineseEntryModal
services/
  chineseActivityService
  chineseEntryService
  chineseQueries
  pinyinService
  pronunciationService
```

Chinese should remain intentionally small.

The page owns section selection and orchestration. Services own mutations, typed Planner matching, XP eligibility, streak calculations, and pronunciation capability checks. Presentation components receive data and callbacks.

---

# 51. Athletics Module

Conceptual folder:

```text
features/athletics/

AthleticsPage
components/
  AthleticsDashboard
  WorkoutLogger
  AthleticsTemplates
  AthleticsHistory
  AthleticsProgress
services/
  athleticsService
  athleticsQueries
athleticsCatalog
```

Workout logging must prioritize speed and minimal rerendering.

---

# 52. Cooking Module

Conceptual folder:

```text
features/cooking/

CookingPage
cookingCatalog
components/
  CookingWeek
  CookingRecipes
  RecipeModal
  CookingGroceries
  CookingDecide
services/
  recipeService
  groceryService
  cookingPlannerService
```

Meal scheduling reads from the shared Weekly Planner rather than creating a separate scheduling database.

---

# 53. Library / Journal Module

Conceptual folder:

```text
features/journal/

JournalPage
journalPrompts
components/
  JournalToday
  JournalCategorySelect
  JournalHistory
  JournalEntryModal
  JournalLookBack
  JournalQuotes
  JournalLibrary
services/
  journalService
  quoteService
  libraryService
```

The notebook appearance belongs primarily in presentation components.

The underlying Journal data remains normal structured records.

The user-facing pillar is **Library**, while the established `/journal` route,
feature folder, and database table remain stable to avoid a cosmetic rename
causing migration risk. Prompt definitions live as static product configuration;
entries store only an optional category and prompt ID alongside their own text.

---

# 54. Notebook UI Separation

The Journal can visually resemble a notebook without storing content as complicated page coordinates.

Do not make the data model depend on:

* Pixel positions
* Dragged text blocks
* Desktop-publishing layouts

Version 1 stores:

* Entry text
* Photos
* Order
* Captions

The interface creates the notebook appearance.

This preserves searchability and reliability.

---

# 55. Chinese Pinyin

Automatic pinyin generation should be treated as a service.

Conceptually:

```text
Chinese characters
      ↓
Pinyin service
      ↓
Suggested pinyin
```

The user can edit the generated result if needed.

Version 1 uses a browser-compatible TypeScript pinyin service with generated tone marks. The dependency remains isolated behind `pinyinService` so it can be replaced without changing components or stored records.

Core Chinese entry remains usable even if automatic generation temporarily fails.

Pronunciation playback is isolated behind `pronunciationService`. It prefers a `zh-TW` system voice, falls back to another Mandarin voice, and returns a capability result rather than making components call browser speech APIs directly.

---

# 56. Anki Integration

Version 1 should start simple.

`Open Anki`

can launch the relevant local/web destination where technically possible.

`Anki Done`

remains the Momentum-side activity confirmation.

Advanced automatic Anki synchronization is not required.

---

# 57. Error Boundaries

One pillar failing should not destroy the entire Momentum interface.

React-level error boundaries should isolate serious rendering errors.

Example:

If a Finance chart fails:

Home and Weekly Planner should still load.

---

# 58. User-Friendly Errors

Errors should explain what the user can do.

Bad:

> Database transaction failed: DOMException 11

Better:

> Momentum couldn't save this transaction. Your existing data is safe. Try saving again.

Technical details may be available through developer/debug tools.

---

# 59. Autosave Philosophy

Use autosave where it reduces friction safely.

Good candidates:

* Workout sets
* Weekly Planner changes
* Grocery checkboxes
* Settings
* Template ordering

For longer writing:

Journal should still provide a visible Save action while potentially preserving a local draft automatically.

---

# 60. Journal Draft Protection

Because journal entries may contain meaningful writing:

Momentum should preserve unfinished text locally if the page is accidentally closed or refreshed.

After reopening:

> **Unsaved draft recovered**

The user can continue or discard it.

---

# 61. Backup Architecture

Momentum requires user-controlled backups.

Backup should export:

* Structured database data
* Media/photos
* Schema/version metadata

The exported backup should be a portable file or package.

---

# 62. Backup Actions

Settings should eventually provide:

`Create Backup`

`Restore Backup`

`Export Data`

Possibly:

`Automatic Backup Settings`

later.

Version 1 now implements `Export backup` and `Restore from a backup` in Settings. Human-readable pillar exports and automatic backup scheduling remain separate later milestones.

---

# 63. Backup Manifest

Each backup should identify:

* Momentum version
* Database schema version
* Backup date
* Record counts
* Media count

This allows safer restores later.

---

# 64. Restore Safety

Restore flow:

1. Select backup
2. Validate file
3. Show backup date/version
4. Confirm restore
5. Create safety backup of current data where possible
6. Restore database
7. Restore media
8. Rebuild derived data

Restore should never happen from one accidental click.

Version 1 enforces this flow in the application. A selected file is fully validated and summarized before the restore control appears, explicit acknowledgement is required, and a safety backup download is triggered before the database replacement transaction starts. Local preferences are applied only after the IndexedDB transaction succeeds.

---

# 65. Export Beyond Backup

Certain pillars may eventually support human-readable export.

Examples:

Finance:

* CSV

Chinese:

* CSV / Anki-compatible export

Journal:

* Markdown / PDF

Recipes:

* Printable recipe

These are separate from full Momentum backup.

---

# 66. Persistent Storage

Momentum should request persistent browser storage where supported because the application contains valuable long-term data.

Even with persistent browser storage:

> **Backups remain necessary.**

The user should never rely on browser storage as the only copy of years of Momentum history.

---

# 67. Data Ownership

Momentum remains local-first.

No core feature should require:

* OpenAI
* Google
* Firebase
* Supabase
* A custom Momentum server

This substantially reduces complexity and keeps personal information under local control.

---

# 68. No Backend for Version 1

Version 1 does not require a traditional backend.

There is no:

```text
Browser
   ↓
Momentum server
   ↓
Cloud database
```

Instead:

```text
Momentum Extension
      ↓
Local IndexedDB
```

This is sufficient for the initial personal-use application.

---

# 69. Internet-Optional Features

Future features may use the internet.

Examples:

* Import recipe from URL
* Fetch quote libraries
* Retrieve external content
* More advanced integrations

These should be optional enhancements.

If internet access disappears, core Momentum should continue working.

---

# 70. Security Philosophy

Momentum contains personal data.

The application should:

* Avoid unnecessary network requests
* Avoid unnecessary extension permissions
* Keep sensitive information local
* Avoid remote analytics by default
* Avoid embedding secrets in source code

Version 1 does not need telemetry.

---

# 71. Finance Privacy

Finance data should never leave the device as part of normal operation.

No:

* Bank credentials
* Bank API
* Plaid integration
* Account login scraping

is required for Version 1.

Transactions remain manually entered.

---

# 72. Testing Strategy

Testing should focus heavily on shared business logic.

High-value automated tests include:

* XP calculation
* Planned bonus
* Weekly completion
* Perfect Week
* Budget rollover
* Transfers
* Budget spending totals
* Workout PR detection
* Recipe scaling
* Grocery duplicate merging

These are more important than testing purely decorative components.

---

# 73. Integration Tests

Important cross-feature flows should also be tested.

Example:

```text
Schedule workout
      ↓
Complete workout
      ↓
Planner completes
      ↓
Activity event exists
      ↓
XP awarded once
      ↓
Athletics history updated
```

This is exactly where architecture bugs are most likely.

---

# 74. Development Data

Development should use fake/sample data.

Examples:

* Sample transactions
* Sample workouts
* Sample recipes
* Sample Chinese phrases
* Sample journal entries

Real personal data should not be necessary for basic development.

Later, real data can be imported or manually entered for final usability testing.

---

# 75. Seed Data

A development seed function can generate a realistic Momentum environment.

Example:

```text
seedDevelopmentData()
```

This makes it easier to test:

* Charts
* Weekly Planner
* Reports
* Heatmaps
* Long lists
* Milestones

---

# 76. Development Workflow

Normal development loop:

```text
VS Code
   ↓
Edit code
   ↓
Vite build/dev
   ↓
Reload extension
   ↓
Test Momentum
```

The user should not need Git expertise to participate in development.

Instructions should remain explicit and step-by-step.

---

# 77. Git

Git is strongly recommended for the project itself.

However, the user does not need to become a Git expert.

Basic use can be limited to:

* Save checkpoints
* Restore older version
* Keep development safe

The assistant can provide exact commands when needed.

Git should reduce risk rather than create another learning project.

---

# 78. Development Checkpoints

Before major changes, create a stable checkpoint.

Example:

```text
Checkpoint:
Home + Weekly Planner working
```

Then build XP.

Then:

```text
Checkpoint:
XP integration working
```

Then Finance.

This prevents one failed experiment from destroying working progress.

---

# 79. Build Order

Momentum should be built in layers.

## Phase 1 — Foundation

* React/Vite project
* Chrome extension shell
* Navigation
* Design tokens
* IndexedDB/Dexie
* Database schema
* Basic settings

## Phase 2 — Core

* Weekly Planner
* Today
* Quick Add
* Recurring activities
* General tasks
* Home pillar cards

## Phase 3 — XP

* Activity Events
* XP Events
* Global and pillar leveling
* Home progression breakdown
* Weekly bonuses
* Milestones

Current milestone status:

* Database-backed XP ledger with migration and dedupe metadata implemented
* Global and pillar progression curves implemented as derived data
* Planner completion, correction, and restore behavior integrated
* Centered Home progression breakdown and recent history implemented
* Weekly bonus automation, milestone snapshots, and celebrations remain future XP milestones

## Phase 4 — Library / Journal

* Quick journal
* Notebook view
* Photos
* Quotes

Current milestone status:

* Quick Journal, notebook view, history, calendar, editing, and undo implemented
* Look Back and unified quote collection implemented
* Personal Library and bookshelf implemented
* Library pillar naming, optional categories, and prompt-generated templates implemented
* Photo memories remain intentionally deferred

## Phase 5 — Chinese

* Activity logging
* Database
* Heatmap
* Anki shortcut

Current milestone status:

* Traditional Chinese Today, Database, and Progress views implemented
* One-tap activity logging with dedicated sound and motion feedback implemented
* Typed Planner auto-completion and shared pillar/global XP integration implemented
* Explicit streaks, Sunday-first 52-week heatmap, and month comparison implemented
* Generated editable pinyin and Taiwanese Mandarin pronunciation playback implemented

## Phase 6 — Athletics

* Templates
* Workout logger
* History
* PRs
* Volleyball

Current milestone status:

* Premium dashboard and low-friction quick-start flow implemented
* Editable templates and Planner scheduling implemented
* Previous-value set logger, Repeat Last, quick adjustments, and custom workouts implemented
* Automatic weight/rep PR detection and dedicated feedback implemented
* One-tap volleyball logging implemented
* Unified history, monthly summary, 52-week heatmap, exercise bests, and PR history implemented
* Shared Planner completion, Athletics XP, undo, reduced motion, and sound settings integrated

## Phase 7 — Cooking

* Recipes
* Photos
* Weekly meals
* Grocery list
* Suggestions

Current milestone status:

* Sunday-first weekly meal view implemented on the shared Planner
* Recipe CRUD, search, favorites, serving sizes, tags, ingredients, instructions, and notes implemented
* Recipe-to-grocery transfer, scaling, merging, category inference, quick add, completion, clearing, and undo implemented
* Lightweight cookbook-based meal suggestions implemented
* Planned and spontaneous meal completion integrated with Cooking XP, history, sound, motion, and undo
* Recipe photo storage intentionally deferred until the media and backup contract is ready

## Phase 8 — Finance

* Transactions
* Accounts
* Budget
* Dashboard
* Reports
* Monthly Close

Current milestone status:

* Finance 1 account onboarding and opening balances implemented
* Transaction-driven balances, net worth, monthly summaries, and category totals implemented
* Low-friction expense, income, transfer, and investment entry implemented
* Transaction editing, deletion, undo, search, filters, and merchant memory implemented
* Five-second Overview, account table, recent activity, and six-month flow implemented
* One-level flow categories for expenses, investments, income, and long-term saving implemented
* Finance 2 category/subcategory data safely migrates to the approved Finance 2.1 catalog
* Hybrid slider and exact-input monthly planning with copy-last-month behavior implemented
* Automatic monthly and manual net-worth/account-balance snapshots implemented
* Net worth removed from Overview/header and contained within Reports
* Month in Review, budget-versus-actual, savings-rate, net-worth, account-history, cash-flow, and category Reports implemented
* Month in Review redesigned as a graphic, collapsible flow-and-category story; the broader Reports gallery uses coordinated editorial data visuals
* Transaction quick entry includes searchable category selection while preserving merchant-based category memory
* Transaction date and notes remain visible in quick entry; the ledger provides detailed multi-field filters, contextual totals, and denser rows
* Accounts support auditable current-balance reconciliation without rewriting history or distorting monthly cash flow
* Paid-in-full credit cards are spending sources rather than balance accounts, stay out of the Overview account list, and Finance privacy mode blurs sensitive balance figures
* Reports switch between monthly and annual perspectives with twelve-month aggregation
* Investment contributions route from a cash source to an investment account, preserve net worth, and support account/holding contribution reports
* Ledger visibility hides reconciliation entries by default without removing their accounting effects; individual records can be hidden or restored
* Overview category progress is driven by the same Budget rows and over-plan rules as the Budget screen
* Local CSV transaction import includes preview, year confirmation, account/category mapping, row repair, duplicate protection, validation, and immediate toast undo without a persistent receipt
* Ledger rows display transaction notes between category and account routing
* Balance and contribution goals derive progress from linked accounts and ledger activity
* Guided monthly close saves review metrics and reflections, creates the next base plan, and carries only selected positive expense balances
* Closed months can be reopened safely until the following month is closed; negative rollover is never created
* Mutating ledger or budget data for a closed month reopens it before the change, preventing stale historical reviews
* Closed review context and rollover totals are preserved in Reports
* Finance 3 completes the planned Version 1 Finance workflow

## Phase 9 — Polish

* Animations
* Sounds
* Visual identity
* Performance
* Backup/restore Version 1 implemented: complete local JSON export, verified preview, safety backup, transactional restore, and reload flow
* Later backup improvements: automatic schedules, additional backup migrations, media packaging, and human-readable pillar exports
* Focus Mode Version 1 implemented as a task-attached workspace with recoverable Pomodoro timing, break cycles, local procedural soundscapes, session history, and optional Planner completion

---

# 80. Why Finance Is Later

Finance is one of Momentum's most complicated pillars.

Building it after the shared foundations provides:

* Stable database patterns
* Reusable tables
* Reusable forms
* Reusable charts
* Established backup system
* Proven application architecture

This reduces the chance of Finance forcing a rewrite of the entire application.

---

# 81. Vertical Development

Within each phase, build a usable end-to-end slice rather than implementing dozens of disconnected components.

Example for Athletics:

First:

> Start Push → log sets → finish workout → see it in History.

Then add:

* PR animations
* Graphs
* heatmap
* deeper polish

Functional loops come before decorative completeness.

---

# 82. Version 1 Definition

Momentum Version 1 does not mean every feature in every `.md` must be fully polished.

Version 1 means:

> **The major everyday loops work reliably.**

Core loops:

### Home

Plan and complete week.

### Finance

Enter transaction and understand budget.

### Chinese

Log activity and save language.

### Athletics

Log workout.

### Cooking

Plan meal and build grocery list.

### Happiness

Capture journal entry and revisit it.

### XP

Meaningful activity produces correct progression.

---

# 83. Progressive Enhancement

Once core loops work:

Add:

* Better animation
* Richer charts
* Sound
* More visual polish
* More advanced filtering
* Improved photo behavior
* Advanced imports

Functionality comes first.

---

# 84. Performance Budget

Because Momentum appears on every new tab:

Home should prioritize:

* Fast startup
* Minimal database queries
* Small initial JavaScript
* Lazy-loaded pillar modules
* Optimized images
* Limited initial animation work

The New Tab page should never feel like launching a heavy web application.

---

# 85. Accessibility

Momentum should remain keyboard-friendly.

Important actions should work without precise mouse interaction.

Examples:

* Quick Add
* Finance transaction entry
* Search
* Saving journal entry

Focus indicators should remain visible.

Visual styling should maintain readable contrast.

---

# 86. Responsive Design

The primary target is desktop Mac/browser usage.

Momentum should still adapt reasonably to smaller browser windows.

Phone/mobile design is **not** a Version 1 priority.

No phone synchronization is required.

---

# 87. Browser Target

Version 1 should target the user's primary Chromium-based desktop browser.

Cross-browser support is secondary.

This allows Momentum to optimize for the actual environment it will be used in rather than prematurely solving every browser compatibility issue.

---

# 88. Development Philosophy

Momentum should not become over-engineered.

Before introducing:

* New library
* New framework
* New service
* New architecture layer

ask:

> **Does this substantially simplify something we actually need?**

If not, use the simpler option.

---

# 89. Dependency Philosophy

Prefer:

* Few dependencies
* Mature dependencies
* Well-documented dependencies
* Libraries solving difficult browser/UI problems

Avoid dependencies for things easily implemented ourselves.

Every dependency becomes something Momentum may eventually need to update.

---

# 90. Documentation

The `.md` files remain part of the project permanently.

They are not disposable planning notes.

They define:

> **Why Momentum works the way it does.**

When changing an important feature:

1. Check the relevant specification
2. Decide whether behavior is intentionally changing
3. Update specification if necessary
4. Update implementation

This keeps product intent and code aligned.

---

# 91. Source of Truth Hierarchy

When documents disagree:

## 1. Latest explicit user decision

wins.

Then:

## 2. Latest specialized specification

Example:

Finance spec beats old general Finance wording.

Then:

## 3. Data Architecture

defines shared data behavior.

Then:

## 4. App Architecture

defines implementation structure.

Then:

## 5. Vision

defines overall philosophy.

Vision should guide decisions but should not override newer explicit functional decisions.

---

# 92. Project Folder

Recommended project structure:

```text
Momentum/
│
├── docs/
│
├── public/
│   ├── icons/
│   └── static-assets/
│
├── src/
│   ├── app/
│   ├── components/
│   ├── database/
│   ├── features/
│   │   ├── core/
│   │   ├── xp/
│   │   ├── finance/
│   │   ├── chinese/
│   │   ├── athletics/
│   │   ├── cooking/
│   │   └── journal/
│   │
│   ├── services/
│   ├── styles/
│   ├── types/
│   └── utils/
│
├── manifest.json
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

# 93. README

The project should eventually contain a simple README explaining:

* What Momentum is
* How to start development
* How to build it
* How to load it into Chrome
* How backups work
* Where specifications live

This becomes especially useful months later when returning to the project.

---

# 94. Initial Build Target

The first real Momentum build should **not** attempt to implement all five pillars.

The first milestone should be:

> **Momentum opens as a New Tab page and stores persistent local data.**

It should contain:

* Basic navigation
* Home shell
* Weekly Planner placeholder
* Database connection
* Design foundation

Once that works reliably, everything else grows from it.

---

# 95. First Functional Milestone

The first genuinely usable loop should be:

```text
Open New Tab
      ↓
See Today
      ↓
Add task to Weekly Planner
      ↓
Task persists after reload
      ↓
Complete task
      ↓
Completion remains saved
```

At that moment:

> **Momentum is officially alive.**

Everything afterward expands that foundation.

---

# 96. Second Functional Milestone

Add Activity Events + XP:

```text
Plan task
      ↓
Complete task
      ↓
XP awarded
      ↓
XP persists
      ↓
Level progress updates
```

This proves Core and XP integration before adding pillars.

---

# 97. Third Functional Milestone

Add one lightweight pillar.

Recommended:

> **Happiness / Journal**

Why:

* Simple data
* Tests persistent writing
* Tests media/photos
* Tests Home integration
* Tests custom visual styling

This provides architectural confidence before building more complicated systems.

---

# 98. Technical North Star

Momentum's technical architecture succeeds when:

> **The application feels simple even though its systems are deeply connected.**

The user should never need to understand:

* Database tables
* Activity Events
* XP Events
* React state
* Schema migrations

They should experience:

> **I did something once, and Momentum understood what that meant everywhere else.**

---

# 99. Final Technical Direction

Momentum Version 1 will be:

> **A local-first React + TypeScript Chrome New Tab extension using IndexedDB/Dexie for persistent data.**

No required:

* Cloud backend
* User account
* Server
* Mobile app
* Subscription
* Online database

Core priorities:

> **Fast → Reliable → Low-friction → Connected → Beautiful**

---

# 100. Architecture Status

* [x] Primary platform chosen
* [x] Chrome New Tab direction
* [x] React
* [x] TypeScript
* [x] Vite
* [x] IndexedDB
* [x] Dexie
* [x] Manifest V3
* [x] Local-first architecture
* [x] No Version 1 backend
* [x] Feature-based organization
* [x] Shared component strategy
* [x] Shared services
* [x] Event-based integration
* [x] Media architecture
* [x] Performance strategy
* [x] Backup strategy
* [x] Error strategy
* [x] Testing strategy
* [x] Development workflow
* [x] Build phases
* [x] First functional milestones
* [x] Ready to Build

**Momentum App Architecture: COMPLETE**
