# Momentum — Data Architecture

**Status:** 🟢 Architecture Defined
**Next Step:** `09 App Architecture.md`

---

# 1. Purpose

This document defines how Momentum stores and connects its information.

The most important architectural principle is:

> **One piece of information should have one source of truth.**

Momentum should not maintain separate copies of the same task, workout, meal, activity, or journal entry simply because that information appears on multiple screens.

Instead:

> **One record → multiple views**

Example:

A planned Pull workout on Thursday may appear in:

* Home
* Today
* Weekly Planner
* Athletics
* Weekly consistency
* XP history

But there is still only **one underlying planned activity**.

---

# 2. Architecture Goals

The Momentum data system should be:

* Local-first
* Reliable
* Easy to back up
* Easy to migrate later
* Modular
* Searchable
* Resistant to duplicate data
* Flexible enough for future features

Most importantly:

> **The data model should reduce user logging rather than create more of it.**

---

# 3. Core Architecture Concept

Momentum data is divided into three broad layers.

## Layer 1 — Global Systems

Shared across Momentum:

* Weekly Planner
* Activities
* XP
* Recurrence
* Media/photos
* Settings
* Tags
* Backups

## Layer 2 — Pillar Data

Specialized information:

* Finance
* Chinese
* Athletics
* Cooking
* Happiness / Journal

## Layer 3 — Views

Screens that display data.

Examples:

* Home
* Today
* Finance Dashboard
* Athletics History
* Cooking This Week
* Chinese Progress

Views do not own separate copies of data.

They read from the underlying global/pillar records.

---

# 4. Unique IDs

Every meaningful Momentum record receives a unique ID.

Examples:

`task_abc123`

`workout_def456`

`recipe_ghi789`

`transaction_jkl012`

`journal_mno345`

`xp_pqr678`

IDs allow different parts of Momentum to reference the same item reliably.

A record's ID should never change simply because:

* It was moved
* It was edited
* It was completed
* Its name changed

---

# 5. Timestamps

Important records should include:

* `createdAt`
* `updatedAt`

Completed activities should also include:

* `completedAt`

Scheduled items include:

* `scheduledDate`

Records where timing matters may also contain:

* `scheduledTime`

Dates and times should be stored consistently.

Presentation can format them differently in the interface.

---

# 6. Pillar Identifier

Shared activities can optionally identify their pillar.

Possible values:

* `finance`
* `chinese`
* `athletics`
* `cooking`
* `happiness`
* `general`

Example:

```text
pillar: "athletics"
```

This allows Home to display the correct icon/accent and lets pillar pages retrieve relevant activities.

---

# 7. Global Planned Activity

The most important shared object is the **Planned Activity**.

This powers the Weekly Planner.

Conceptual structure:

```text
PlannedActivity

id
title
pillar
activityType

scheduledDate
scheduledTime
planningWeekStart

status
important

notes

effortTier
plannedBeforeCompletion

recurrenceRuleId

linkedRecordType
linkedRecordId

createdAt
updatedAt
completedAt
```

`scheduledDate` and `planningWeekStart` are mutually exclusive planning
locations. A dated activity uses `scheduledDate`; an item in **Unscheduled This
Week** uses the Sunday date key in `planningWeekStart`. Scheduling an
unscheduled activity clears `planningWeekStart`, and unscheduling a dated
activity clears `scheduledDate`. The activity keeps the same identity,
completion history, and pillar linkage throughout.

---

# 8. Planned Activity Status

A Weekly Planner item can have states such as:

* Planned
* Completed
* Missed
* Dismissed
* Cancelled

The exact user-facing wording can be refined during implementation.

The important distinction:

## Completed

The activity actually happened.

May generate XP.

## Dismissed

The user intentionally chooses not to continue pursuing the item.

No XP.

## Cancelled

The plan is no longer relevant.

Should generally not count against weekly completion.

## Missed

The activity remained incomplete after its intended time.

No punishment.

## Current Lifecycle Implementation

`PlannedActivity` remains the single record through edits, moves, completion,
dismissal, deletion, and restoration. The current service layer provides:

* Detail updates without creating a replacement record
* Date moves that preserve identity and update the derived weekday
* Week-scoped unscheduling that never leaves a stale scheduled date
* Duplication, manual ordering, and bulk moves through the same service layer
* Soft deletion through `deletedAt`
* Restoration for dismissed and soft-deleted activities
* Completion reversal that voids linked Activity and XP events

Dismissal of a previously completed activity first reopens it, ensuring its
completion event and XP award are voided before the status becomes dismissed.
This keeps visible task state, activity history, and level progress consistent.

---

# 9. Why Status Matters

The Weekly Planner completion percentage should not simply count every deleted task.

Example:

Monday:

* Workout completed
* Read completed
* Dentist appointment cancelled by dentist

The cancelled appointment should not make the week:

`2 / 3 = 67%`

Instead, eligible planned activities should be evaluated separately.

This distinction protects Momentum's:

> **No punishment for legitimate plan changes**

philosophy.

---

# 10. One Activity, Multiple Views

Example:

A user schedules:

> **Push Workout — Monday**

Momentum creates:

```text
PlannedActivity
id: task_123
pillar: athletics
activityType: workout
scheduledDate: Monday
linkedRecordId: workout_456
```

Home displays `task_123`.

Today displays `task_123`.

Athletics displays `task_123`.

Completing the workout updates:

```text
task_123.status = completed
```

Every view automatically reflects that state.

No duplicate completion action is necessary.

---

# 11. Linked Pillar Records

A Planned Activity can optionally reference specialized pillar data.

Example:

```text
linkedRecordType: "workout"
linkedRecordId: "workout_456"
```

or:

```text
linkedRecordType: "recipe"
linkedRecordId: "recipe_789"
```

This is how shared planner items gain deeper functionality.

---

# 12. Examples of Linking

## Athletics

Weekly Planner:

`Push`

links to:

`Workout Session`

## Cooking

Weekly Planner:

`Japanese Curry`

links to:

`Recipe`

## Finance

Weekly Planner:

`Close Month`

links to:

`Finance Review`

## Chinese

Weekly Planner:

`Tutor`

may link to:

`Chinese Activity`

## Happiness

Weekly Planner:

`Date Night`

may simply remain a general/personal activity without additional specialized data.

---

# 13. Recurrence Rules

Recurring activities should not store infinite future copies.

Momentum maintains recurrence definitions separately.

Conceptual structure:

```text
RecurrenceRule

id
frequency
interval
weekdays
monthDay
startDate
endDate
```

Possible recurrence types:

* Daily
* Selected weekdays
* Weekly
* Monthly
* Custom

Momentum generates planner occurrences when needed.

---

# 14. Recurring Activity Templates

A recurring activity connects:

```text
Activity Template
        ↓
Recurrence Rule
        ↓
Weekly occurrences
```

Example:

`Read`

every:

`Monday–Friday`

Each actual day can still be individually:

* Completed
* Rescheduled
* Cancelled
* Dismissed

without changing the underlying recurrence unless the user chooses:

> Edit this occurrence

or:

> Edit future occurrences

---

# 15. Global Activity Events

Not every meaningful activity needs to begin as a planned task.

Momentum also needs a lightweight **Activity Event** concept.

Examples:

* Chinese podcast listened to
* Volleyball open gym
* Spontaneous workout
* Reading
* Unplanned meaningful activity

Conceptual structure:

```text
ActivityEvent

id
pillar
activityType
source

linkedRecordType
linkedRecordId

occurredAt

effortTier

plannedActivityId

metadata
```

---

# 16. Planned vs. Spontaneous

If an activity was scheduled:

```text
ActivityEvent.plannedActivityId = task_123
```

If spontaneous:

```text
plannedActivityId = null
```

This allows XP to determine whether the +25% planned bonus applies.

---

# 17. Activity Event Philosophy

Activity Events represent:

> **Something meaningful actually happened.**

They are different from:

* Editing data
* Creating a template
* Adding a grocery item
* Changing settings

This distinction is essential for XP integrity.

---

# 18. XP Event

XP is recorded separately from activities.

Conceptual structure:

```text
XPEvent

id
activityEventId

sourceType
sourceId

pillar

baseXP
plannedBonusXP
weeklyBonusXP
finalXP

createdAt
```

An activity should normally generate at most one primary XP event.

---

# 19. XP Integrity

XP events must prevent duplication.

Example:

A workout is completed.

Momentum creates:

```text
ActivityEvent: event_100
```

Then:

```text
XPEvent:
activityEventId = event_100
```

If the user:

* Reloads the page
* Opens Athletics
* Opens Home
* Checks XP History

Momentum sees that `event_100` already has an XP record.

It does not award XP again.

---

# 20. XP Is Event-Based

Lifetime XP should be calculated from XP Events rather than being an unexplained number that is manually changed.

Conceptually:

```text
Lifetime XP = sum(all valid XP events)
```

A cached total may be stored for speed.

The event history remains the source of truth.

---

# 21. Level Data

Momentum can derive:

* Current level
* XP in current level
* XP needed for next level

from Lifetime XP.

Conceptual progression record:

```text
Progression

lifetimeXP
currentLevel
currentTitle
perfectWeeks
```

Most values should be derived automatically where practical.

---

# 22. Weekly Summary

At the end of each Sunday–Saturday week, Momentum creates a snapshot.

Conceptual structure:

```text
WeeklySummary

id
weekStart
weekEnd

eligiblePlanned
completedPlanned
completionPercentage

weeklyBonusXP
perfectWeek

processedAt
```

This prevents recalculating old weeks indefinitely.

---

# 23. Milestone Snapshot

When reaching levels:

* 5
* 10
* 25
* 50
* 75
* 100

Momentum saves a permanent snapshot.

Conceptual structure:

```text
MilestoneSnapshot

id
level
title
badge

achievedAt
lifetimeXP

statsSnapshot
```

`statsSnapshot` may contain:

* Workouts completed
* Volleyball sessions
* Chinese activity days
* Reading activities
* Meals cooked
* Finance reviews
* Tasks completed
* Perfect Weeks

The snapshot should preserve what was true **at the moment the milestone was earned**.

---

# 24. Finance Architecture

Finance is primarily transaction-driven.

Primary records:

* Transactions
* Categories
* Subcategories
* Accounts
* Budgets
* Budget rollover
* Goals
* Net worth snapshots
* Monthly reviews

---

# 25. Finance Transaction

Conceptual structure:

```text
Transaction

id

date
amount

type

categoryId
subcategoryId

merchant
accountId

notes
tags

investmentHolding

createdAt
updatedAt
```

Transaction types:

* Expense
* Income
* Transfer
* Investment

---

# 26. Transfers

Transfers require special handling.

A transfer should not appear as:

* Spending
* Income

Conceptually it references:

```text
fromAccountId
toAccountId
amount
```

A single transfer should represent movement between accounts rather than two unrelated financial transactions.

Implementation may internally generate balance effects while preserving one logical transfer.

---

# 27. Finance Categories

Conceptual structure:

```text
FinanceCategory

id
name
order
active
```

Subcategory:

```text
FinanceSubcategory

id
categoryId
name
order
active
```

Only two category levels exist.

Merchants remain separate.

---

# 28. Finance Accounts

Conceptual structure:

```text
FinanceAccount

id
name
type

startingBalance
currentBalance

active
```

Account types include:

* Checking
* Savings
* Credit Card
* Investment
* Retirement
* Cash

Ideally, current balance is derived from:

> Starting balance + transaction history

rather than becoming disconnected from transaction data.

---

# 29. Finance Budgets

Monthly budget record:

```text
MonthlyBudget

id
month
year
expectedIncome
```

Individual subcategory budget:

```text
BudgetAllocation

id
monthlyBudgetId
subcategoryId

baseAmount
rolloverAmount
```

Available budget is derived:

```text
available = baseAmount + rolloverAmount
```

Actual spending comes from Transactions.

---

# 30. Budget Rollover

Positive rollover should be stored separately from base budget.

Example:

```text
baseAmount = 500
rolloverAmount = 100
available = 600
```

If overspent:

```text
next rollover = 0
```

Negative rollover is never created.

---

# 31. Rollover Cash-Out

When rollover is moved to savings:

Momentum should record that action.

Conceptual structure:

```text
RolloverTransfer

id
subcategoryId
amount
destinationAccountId
date
```

This allows the system to reduce accumulated rollover while preserving history.

---

# 32. Financial Goals

Conceptual structure:

```text
FinancialGoal

id
name

goalType
targetAmount

accountId

timeframeType
deadline

active
```

Goal types:

* Contribution
* Balance

Timeframes:

* Monthly
* Yearly
* Custom deadline

Progress should derive automatically from related account/transaction data when possible.

---

# 33. Net Worth Snapshots

Conceptual structure:

```text
NetWorthSnapshot

id
date

assets
liabilities
netWorth

accountSnapshot
```

Monthly snapshots preserve historical values.

Manual snapshots can also be created.

---

# 34. Monthly Finance Review

Conceptual structure:

```text
FinanceMonthlyReview

id
month
year

income
spending
savingsRate
invested
rolloverEarned
netWorthChange

reflectionWentWell
reflectionChange
reflectionRemember

closedAt
```

Much of the numerical data should be automatically generated.

---

# 35. Chinese Architecture

Primary records:

* Chinese entries
* Chinese activities
* Chinese daily summaries

---

# 36. Chinese Entry

Conceptual structure:

```text
ChineseEntry

id

chinese
pinyin
meaning

entryType

example
notes

tags
source

createdAt
updatedAt
```

Required:

* Chinese
* Meaning

Everything else may be automatic or optional.

---

# 37. Chinese Activities

Conceptual structure:

```text
ChineseActivity

id
type
date

intensity

source
notes

activityEventId
```

Types may include:

* Anki
* Tutor
* Music
* Podcast
* TV / Video
* Conversation
* Reading
* Other

No study-time field is required.

---

# 38. Chinese Heatmap

The heatmap should be derived from Chinese Activities rather than storing every square manually.

For each date:

```text
Daily intensity =
aggregate(activity intensity for date)
```

This can produce:

* Empty
* Light
* Normal
* Strong

---

# 39. Chinese Database Activity

Adding a useful Chinese entry can count toward activity visualization if desired.

However:

> Adding database entries should not automatically become a major XP source.

Heatmap activity and XP are separate concepts.

---

# 40. Athletics Architecture

Primary records:

* Exercises
* Workout templates
* Workout sessions
* Sets
* Volleyball activities
* PR records

---

# 41. Exercise

Conceptual structure:

```text
Exercise

id
name
active

createdAt
```

Exercises are reusable across workout templates and workout history.

---

# 42. Workout Template

Conceptual structure:

```text
WorkoutTemplate

id
name
active
order
```

Template exercise:

```text
WorkoutTemplateExercise

id
templateId
exerciseId

order
defaultSets
```

Weight and reps do not belong permanently in the template.

They come from workout history.

---

# 43. Workout Session

Conceptual structure:

```text
WorkoutSession

id
templateId

name
startedAt
completedAt

plannedActivityId
activityEventId

notes
```

A custom workout can have:

```text
templateId = null
```

---

# 44. Workout Exercise

Each workout stores the exercises actually performed.

```text
WorkoutExercise

id
workoutSessionId
exerciseId
order
```

This preserves history even if the template changes later.

---

# 45. Workout Set

Conceptual structure:

```text
WorkoutSet

id
workoutExerciseId

setNumber

weight
reps

completed
completedAt
```

No RPE required.

---

# 46. Previous Set Data

"Repeat Last" should query prior Workout Sets.

Example:

For:

`Incline DB Press`

find the most recent completed workout containing that exercise.

Then retrieve corresponding set values.

No separate "last workout values" database is required.

---

# 47. PR Detection

PRs should ideally be derived from workout history.

Types:

* Highest weight
* Most reps at a specific weight

Momentum can cache detected PR events:

```text
PersonalRecord

id
exerciseId
recordType

weight
reps

workoutSetId
achievedAt
```

This allows fast History and celebration rendering.

---

# 48. Volleyball

Conceptual structure:

```text
VolleyballActivity

id
type
date

notes

plannedActivityId
activityEventId
```

Types:

* Practice
* Open Gym
* Tournament
* Coaching / Other

Volleyball does not require gym-style sets.

---

# 49. Athletics Heatmap

Derived from:

* Workout sessions
* Volleyball activities
* Other training activities

No manual heatmap entry exists.

---

# 50. Cooking Architecture

Primary records:

* Recipes
* Recipe ingredients
* Recipe photos
* Grocery items
* Meal plan links
* Cooking history

---

# 51. Recipe

Conceptual structure:

```text
Recipe

id
name

defaultServings

instructions
notes

favorite

coverMediaId

createdAt
updatedAt
```

Tags are stored through the shared tag system.

---

# 52. Recipe Ingredient

Conceptual structure:

```text
RecipeIngredient

id
recipeId

name
quantity
unit

groceryCategory

order
```

Example:

```text
name: chicken thighs
quantity: 1
unit: lb
```

---

# 53. Serving Scaling

Scaled quantity should be calculated rather than permanently modifying the base recipe.

Conceptually:

```text
scaled quantity =
base quantity × requested servings / default servings
```

The original recipe remains unchanged.

---

# 54. Recipe Photos

Recipe photos use the global Media system.

The Recipe only stores references:

```text
coverMediaId
```

Additional photos use relationship records.

This prevents images from being embedded repeatedly across recipe data.

---

# 55. Planned Meal

A planned recipe should use the global Planned Activity system.

Example:

```text
PlannedActivity

title: Japanese Curry
pillar: cooking
activityType: meal

linkedRecordType: recipe
linkedRecordId: recipe_123
```

No separate Cooking calendar is necessary.

---

# 56. Quick Meal Types

Items such as:

* Leftovers
* Eating Out

may exist as planned Cooking activities without a Recipe link.

Example:

```text
linkedRecordId = null
```

`Open` may simply represent the absence of a planned meal rather than a stored task.

---

# 57. Cooking History

"Recently Cooked" should derive from completed planned meal activities.

Example:

Recipe `recipe_123`

linked to:

`task_456`

When `task_456` becomes completed:

Momentum knows the recipe was cooked on that date.

No separate "mark cooked" database is required.

---

# 58. Grocery Item

Conceptual structure:

```text
GroceryItem

id
name

quantity
unit

category

checked
checkedAt

sourceRecipeIds

createdAt
```

Categories:

* Produce
* Meat / Seafood
* Dairy
* Pantry
* Frozen
* Other

---

# 59. Grocery Duplicate Handling

When ingredients are added from multiple recipes:

Momentum can attempt to merge items with compatible:

* Name
* Unit

Example:

`1 onion + 2 onions = 3 onions`

When compatibility is uncertain:

> Keep them separate rather than guessing incorrectly.

---

# 60. Frequent Grocery Items

No separate manually maintained Frequent Items list is necessary initially.

Momentum can derive frequency from Grocery Item history.

Example:

```text
COUNT(items where normalized name = "eggs")
```

Frequently used items then surface automatically.

---

# 61. Happiness / Journal Architecture

Primary records:

* Journal entries
* Quotes
* Reflection prompts
* Media attachments

---

# 62. Journal Entry

Conceptual structure:

```text
JournalEntry

id

title
text

createdAt
updatedAt

entryDate
```

Only text is required.

Title remains optional.

---

# 63. Journal Photos

Photos attach through the shared Media system.

Conceptual relationship:

```text
JournalMedia

id
journalEntryId
mediaId
order
caption
```

This supports:

* Multiple photos
* Reordering
* Optional captions

---

# 64. On This Day

On This Day should be calculated from Journal Entry dates.

Example query:

```text
month(entryDate) = current month
day(entryDate) = current day
year(entryDate) < current year
```

No separate memory records are necessary.

---

# 65. Random Memory

Random Memory selects from existing Journal Entries.

No duplicate "memory" objects are created.

---

# 66. Reflection Prompts

Conceptual structure:

```text
ReflectionPrompt

id
text
active
```

Momentum can randomly rotate active prompts.

Prompts do not need to become journal metadata unless the user explicitly answers one and we later decide preserving the originating prompt is useful.

---

# 67. Quote

Conceptual structure:

```text
Quote

id
text
author
source

favorite

isBuiltIn
createdAt
```

Built-in and user-created quotes use the same data structure.

---

# 68. Shared Tag System

Tags can be useful in multiple pillars.

Examples:

Chinese:

`Taiwan`

Finance:

`Taiwan 2027`

Cooking:

`Japanese`

A shared conceptual tag structure:

```text
Tag

id
name
scope
```

Scope could be:

* Finance
* Chinese
* Cooking
* Global

A tag does not need to work everywhere unless useful.

---

# 69. Media System

Photos are used by:

* Cooking
* Happiness / Journal

Potentially more areas later.

Momentum should use one shared media-management system.

Conceptual structure:

```text
Media

id
type

fileName
mimeType

storageReference

createdAt
```

Type initially:

* Image

---

# 70. Media Relationships

Records store Media IDs instead of repeatedly storing image data.

Examples:

```text
Recipe.coverMediaId
```

or:

```text
JournalMedia.mediaId
```

This gives one consistent image system.

---

# 71. Local Photo Storage

Photos should **not** be stored as huge text/base64 blobs inside normal application records when avoidable.

The chosen technical stack should support appropriate local binary/image storage.

Requirements:

* Persistent
* Local
* Backup-capable
* Efficient
* References remain stable

The exact implementation belongs in `09 App Architecture.md`.

---

# 72. Settings Data

Conceptual structure:

```text
Settings

soundsEnabled
animationsEnabled

appearance

weekStartsOn

dataVersion
```

Momentum's default week is:

**Sunday → Saturday**

---

# 73. Sound Preferences

Sound should be globally disableable.

Future versions may allow individual sound categories.

Version 1 can start with:

```text
soundsEnabled: true / false
```

Current implementation:

```text
appSettings

id: "preferences"
soundsEnabled: boolean
animationsEnabled: boolean
updatedAt: ISO timestamp
```

Both preferences default to enabled and are stored locally in IndexedDB.
System reduced-motion preferences still take precedence over the in-app
animation setting.

---

# 74. Application Metadata

Momentum should maintain internal metadata.

Conceptual structure:

```text
AppMetadata

schemaVersion
createdAt
lastOpenedAt
lastBackupAt
```

`schemaVersion` becomes important as Momentum evolves.

---

# 75. Schema Version

The application's stored data should include a version number.

Example:

```text
schemaVersion: 1
```

If future updates modify the database structure:

Momentum can migrate:

```text
Version 1 → Version 2
```

without destroying existing user data.

---

# 76. Soft Delete vs. Permanent Delete

Some records should use a recoverable deletion strategy.

Conceptually:

```text
deletedAt
```

rather than disappearing immediately.

This is particularly useful for:

* Transactions
* Journal entries
* Recipes
* Tasks

A future trash/recovery system can then restore accidentally deleted information.

Permanent deletion can remain available when needed.

---

# 77. Derived Data

Momentum should avoid permanently storing values that can safely be calculated from authoritative data.

Examples:

Do not separately maintain:

* "Workouts this month"
* "Chinese active days"
* "Meals cooked this week"
* "Current spending by category"

These should derive from underlying records.

This prevents data from becoming inconsistent.

---

# 78. When to Cache Derived Data

Some expensive calculations may eventually be cached for performance.

Examples:

* Dashboard totals
* Report aggregations
* Heatmaps

But:

> **Cached values are not the source of truth.**

They should always be rebuildable from underlying records.

---

# 79. Home Pillar Summaries

Home reads pillar data rather than owning separate metrics.

Examples:

Finance card:

Derived from Finance transactions/budget.

Chinese card:

Derived from Chinese activities.

Athletics card:

Derived from planned/completed workouts.

Cooking card:

Derived from planned meals.

Happiness card:

Derived from Journal entries.

Home never stores a second copy of those values.

---

# 80. Search

Search should be implemented against the authoritative pillar records.

Potential searchable datasets:

* Tasks
* Chinese entries
* Transactions
* Recipes
* Journal entries
* Quotes

Momentum does not necessarily need one global search in Version 1.

The architecture should not prevent one later.

---

# 81. Data Ownership

Each system should have a clear owner.

## Core

Owns:

* Planned activities
* Recurrence
* General activities
* Weekly summaries

## XP

Owns:

* XP events
* Progression
* Milestone snapshots

## Finance

Owns:

* Financial transactions
* Accounts
* Budgets
* Financial goals
* Finance snapshots

## Chinese

Owns:

* Chinese entries
* Chinese activities

## Athletics

Owns:

* Exercises
* Templates
* Workouts
* Sets
* Volleyball activity
* PRs

## Cooking

Owns:

* Recipes
* Ingredients
* Grocery list

## Happiness

Owns:

* Journal
* Quotes
* Reflection prompts

## Shared Media

Owns:

* Images
* Image references

---

# 82. Data Flow Example — Workout

User completes:

> Push Workout

Flow:

```text
Workout Session
      ↓
marked complete
      ↓
Activity Event created
      ↓
Linked Planned Activity completed
      ↓
Athletics history updates
      ↓
Weekly consistency updates
      ↓
Home updates
      ↓
XP Event created
      ↓
XP bar updates
      ↓
PR detection runs
```

The user only performs one meaningful completion action.

---

# 83. Data Flow Example — Cooking

User completes:

> Japanese Curry

Flow:

```text
Planned Meal
      ↓
marked complete
      ↓
Activity Event
      ↓
Cooking Recently Cooked updates
      ↓
Home Weekly Planner updates
      ↓
XP Event created
```

No separate cooking-history form exists.

---

# 84. Data Flow Example — Chinese

User taps:

> Podcast

Flow:

```text
Chinese Activity created
      ↓
Activity Event created
      ↓
Chinese heatmap updates
      ↓
Active day count updates
      ↓
XP Event created if eligible
```

Minimal logging.

---

# 85. Data Flow Example — Journal

User writes through Home:

> What's on your mind?

Flow:

```text
Journal Entry created
      ↓
Happiness Journal updates
      ↓
Calendar updates
      ↓
On This Day becomes possible later
```

No separate Home "Recent Thoughts" database exists.

---

# 86. Data Flow Example — Finance Transaction

User logs:

> Aldi — $68 — Groceries

Flow:

```text
Transaction created
      ↓
Account balance recalculates
      ↓
Groceries spending recalculates
      ↓
Budget progress updates
      ↓
Spending graphs update
      ↓
Reports update
```

Entering the transaction does not require manually updating any other financial data.

---

# 87. Backups

Momentum must support backups because it will contain valuable long-term personal data.

A backup should eventually include:

* Core data
* XP history
* Finance
* Chinese
* Athletics
* Cooking
* Journal
* Quotes
* Settings
* Images/media

---

# 88. Backup Philosophy

Backups should be:

* User-controlled
* Local
* Portable
* Restorable
* Versioned

Momentum should not depend on cloud sync for basic data safety.

---

# 89. Export Format

The exact export format will be chosen during implementation.

Conceptually, a Momentum backup may contain:

```text
Momentum Backup
│
├── data/
│   ├── core
│   ├── xp
│   ├── finance
│   ├── chinese
│   ├── athletics
│   ├── cooking
│   └── journal
│
├── media/
│   └── images
│
└── manifest
```

The manifest can contain:

* Backup version
* Creation date
* Schema version

---

# 90. Import / Restore

Momentum should eventually be able to restore a valid backup.

Restore should:

1. Validate backup
2. Check schema version
3. Confirm before replacing current data
4. Restore records
5. Restore media
6. Rebuild derived data

---

# 91. Automatic Backup

Automatic backups are desirable but not required for the earliest prototype.

Eventually Momentum may create periodic local backups.

The architecture should leave room for this.

---

# 92. Data Safety

Actions capable of causing large amounts of data loss should require confirmation.

Examples:

* Delete all transactions
* Delete journal history
* Reset Momentum
* Restore an old backup
* Clear all application data

Routine actions should remain fast.

---

# 93. Local-First Requirement

Core Momentum functionality should work without internet access.

Internet access may later enhance:

* Recipe import
* Pinyin tools
* Quote libraries
* Anki integration
* Optional future services

But core data must remain usable locally.

---

# 94. No Required Account

Momentum Version 1 does not require:

* Login
* Email
* Cloud account
* Subscription
* Online profile

The Mac itself is the primary environment.

---

# 95. Data Migration

Future versions will change.

Therefore Momentum must be designed assuming migrations will eventually happen.

Example:

```text
Old Recipe
name
ingredientsText
```

could later become:

```text
Recipe
RecipeIngredient[]
```

A migration should transform old data rather than requiring the user to start over.

---

# 96. Data Validation

Momentum should validate important inputs.

Examples:

Finance:

* Amount must be valid number
* Transfer requires two different accounts

Workout:

* Weight cannot be invalid text
* Reps should be valid integer

Recipe:

* Serving count must be positive

Validation should be helpful rather than frustrating.

---

# 97. Preserve User Intent

When uncertain, Momentum should avoid automatically changing important information.

Example:

Grocery List sees:

`1 bunch scallions`

and:

`2 scallions`

If units cannot be confidently combined:

> Keep them separate.

Do not produce mathematically neat but incorrect data.

---

# 98. History Preservation

Historical records should generally remain historically accurate.

Example:

If a workout template changes today:

Last month's completed workout should **not** change.

If a recipe is edited:

A completed historical meal can still reference the current recipe, but its completion date should remain untouched.

If a Finance category is renamed:

Historical transactions may display the updated category name while preserving their original category relationship.

---

# 99. Source of Truth Rules

## Weekly Planner

Source of truth:

`PlannedActivity`

## Real-world completion

Source of truth:

`ActivityEvent` / specialized completed record

## XP

Source of truth:

`XPEvent`

## Finance spending

Source of truth:

`Transaction`

## Chinese progress

Source of truth:

`ChineseActivity`

## Workout progress

Source of truth:

`WorkoutSession + WorkoutSet`

## Cooking history

Source of truth:

Completed meal activities

## Journal history

Source of truth:

`JournalEntry`

---

# 100. No Duplicate Completion Systems

Momentum should never require:

1. Complete workout
2. Mark planner task complete
3. Mark Athletics day active
4. Add XP

These are four consequences of **one action**.

The application handles the consequences automatically.

---

# 101. Architecture Principle — Specialized Detail, Shared Intent

A useful way to think about Momentum:

## Global Core stores:

> **What am I planning / doing?**

## Pillars store:

> **What specialized information does that activity need?**

Example:

Global:

`Push Workout Thursday`

Athletics:

`Incline DB Press — 65 × 9`

XP:

`+25 XP`

These systems connect without duplicating responsibilities.

---

# 102. Architecture Principle — Views Are Disposable

A screen can be redesigned later without changing the underlying data.

Example:

Finance Dashboard Version 1 may use cards.

Finance Dashboard Version 2 may use tables.

Transactions remain the same.

This separation between:

> **Data**

and:

> **Presentation**

will make Momentum easier to evolve.

---

# 103. Architecture Principle — Automate Derived Progress

Whenever data already exists, Momentum should calculate the next step.

Examples:

Workout logged:

→ PR detection

Transactions logged:

→ budget progress

Meal completed:

→ Recently Cooked

Chinese activity:

→ heatmap

Week completed:

→ weekly XP bonus

The user should not become the integration layer.

---

# 104. Version 1 Core Data Objects

The initial implementation should prioritize these objects:

## Global

* PlannedActivity
* ActivityEvent
* RecurrenceRule
* WeeklySummary
* XPEvent
* MilestoneSnapshot
* Media
* Settings

## Finance

* Transaction
* FinanceCategory
* FinanceSubcategory
* FinanceAccount
* MonthlyBudget
* BudgetAllocation
* FinancialGoal
* NetWorthSnapshot
* FinanceMonthlyReview

## Chinese

* ChineseEntry
* ChineseActivity

## Athletics

* Exercise
* WorkoutTemplate
* WorkoutTemplateExercise
* WorkoutSession
* WorkoutExercise
* WorkoutSet
* VolleyballActivity
* PersonalRecord

## Cooking

* Recipe
* RecipeIngredient
* GroceryItem

## Happiness

* JournalEntry
* JournalMedia
* Quote
* ReflectionPrompt

---

# 105. Objects That Should Be Derived

Avoid standalone databases for:

* Today
* This Week
* Recent Transactions
* Recent Workouts
* Recently Cooked
* Chinese Active Days
* Home pillar summaries
* Budget progress
* Net worth current value
* Workout totals
* XP bar progress
* On This Day
* Frequent Grocery Items

These are **views/calculations** of existing data.

---

# 106. Implementation Questions Reserved for 09

This document defines **what information exists**.

It intentionally does not yet lock:

* React vs. another UI framework
* SQLite vs. IndexedDB vs. another local database
* Desktop wrapper vs. browser-only
* Exact photo storage technology
* Routing library
* State-management library
* Charting library
* Build tooling
* Backup file implementation

Those decisions belong in:

`09 App Architecture.md`

---

# 107. North Star

Momentum's data architecture succeeds when:

> **One real-world action updates every place it matters without asking the user to enter it twice.**

The architecture should make the application feel simple even when the systems underneath are powerful.

The user should experience:

> **Do the thing once. Momentum remembers the rest.**

---

# 108. Architecture Status

* [x] Global activity model
* [x] Weekly Planner source of truth
* [x] Pillar linking model
* [x] Recurrence model
* [x] Completion states
* [x] XP event model
* [x] Weekly summaries
* [x] Milestone snapshots
* [x] Finance data model
* [x] Chinese data model
* [x] Athletics data model
* [x] Cooking data model
* [x] Journal data model
* [x] Shared media system
* [x] Shared tags concept
* [x] Derived-data rules
* [x] Backup requirements
* [x] Schema versioning
* [x] Data migration strategy
* [x] One-source-of-truth rules
* [x] Ready for technical architecture

**Momentum Data Architecture: COMPLETE**
