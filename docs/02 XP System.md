# Momentum — XP & Progression System

**Status:** 🟢 Design Complete
**Next Step:** Implementation

---

# 1. Purpose

The Momentum XP system provides a lightweight sense of progression across the entire application.

There is **one global Momentum level**.

Finance, Chinese, Athletics, Cooking, Happiness, Reading, and general life tasks can all contribute toward the same progression.

The system should reward:

> **Doing meaningful things in real life.**

It should not reward spending more time managing Momentum.

---

# 2. Core Philosophy

Momentum XP follows four major principles:

### Action Over Logging

Real activity earns XP.

Entering, editing, or organizing data generally does not.

### Planning Matters

Activities completed through the Weekly Planner earn more XP than spontaneous activities.

### No Punishment

Momentum never removes XP because something was missed.

### Long-Term Progress

Levels represent accumulated real-life progress over months and years.

---

# 3. The Weekly Planner Is the Engine

The global Weekly Planner defined in:

`01 Core & Home.md`

is the central system behind Momentum progression.

The pillars provide activities.

The Weekly Planner represents intention.

XP rewards follow-through.

Core loop:

> **Plan → Do → Complete → Earn XP → Build Momentum**

---

# 4. One Global Level

Momentum does not maintain separate levels for:

* Finance
* Chinese
* Athletics
* Cooking
* Happiness

Instead:

> **Everything contributes toward one Momentum Level.**

Example:

## Momentum

**Level 14 — [Title]**

`██████████████░░░░`

`1,420 / 1,600 XP`

---

# 5. Lifetime XP

Momentum permanently tracks total XP earned.

Example:

> **Lifetime XP: 12,850**

Lifetime XP never decreases.

It can be used for:

* Level calculations
* Milestone snapshots
* Progress history
* Long-term statistics

---

# 6. XP Never Decreases

Momentum does not use negative XP.

Missing:

* A workout
* Chinese practice
* A planned meal
* A task
* A journal entry
* A weekly goal

does not remove XP.

Momentum rewards progress rather than punishing inconsistency.

---

# 7. Levels Never Decrease

Once a Momentum level is earned, it is permanent.

There is no:

* Level decay
* XP decay
* Demotion
* Seasonal reset

Momentum Level represents cumulative progress.

---

# 8. What Earns XP

XP should primarily come from meaningful completed activities.

Examples:

### Athletics

* Complete workout
* Volleyball session
* Mobility session
* Other meaningful training

### Chinese

* Study session
* Tutor session
* Listening activity
* Anki/review activity
* Meaningful language practice

### Cooking

* Cook planned meal
* Meal prep

### Finance

* Complete financial review
* Complete meaningful finance task

### Happiness / Personal

* Complete planned personal activity
* Reflection when appropriate

### General

* Reading
* Laundry
* Cleaning
* Errands
* Administrative tasks
* Other Weekly Plan activities

---

# 9. What Does NOT Earn XP

Momentum should not significantly reward application maintenance.

Examples:

* Enter transaction
* Edit transaction
* Add grocery item
* Upload recipe photo
* Edit recipe
* Add Chinese word
* Edit workout template
* Rearrange dashboard
* Create/delete tasks repeatedly
* Change settings

Principle:

> **Using Momentum is not the achievement. Doing the thing is.**

---

# 10. XP Effort Tiers

Activities use three primary XP tiers.

## Quick

**5 XP**

Used for smaller meaningful actions.

Examples:

* Laundry
* Take trash out
* Small errand
* Short administrative task
* Small household task

## Standard

**20 XP**

Used for normal meaningful activities.

Examples:

* Workout
* Chinese study session
* Tutor session
* Cooking dinner
* Meaningful reading session
* Normal personal goal

## Major

**50 XP**

Used for unusually significant activities.

Examples:

* Major project
* Large financial review
* Tournament
* Significant milestone task
* Large one-time responsibility

---

# 11. Automatic XP Classification

The user should **not normally need to choose XP manually**.

Momentum should infer the appropriate XP tier based on the activity type.

Examples:

`🏋️ Push Workout`

Automatically:

**Standard — 20 XP**

`🗑️ Take Trash Out`

Automatically:

**Quick — 5 XP**

`💰 Monthly Financial Review`

Automatically:

**Major — 50 XP**

---

# 12. Manual Override

XP effort can optionally be changed under:

`More Options`

Possible choices:

* Quick
* Standard
* Major

This setting should remain hidden during normal Quick Add.

The goal is to preserve:

> `+ → Task → Enter`

rather than turning task creation into XP configuration.

---

# 13. Planned Activity Bonus

Activities placed on the Weekly Planner **before completion** receive an XP bonus.

Planned activities receive:

> **+25% XP**

This rewards intention and follow-through.

---

# 14. Planned XP Examples

Approximate values:

| Activity | Spontaneous | Planned |
| -------- | ----------: | ------: |
| Quick    |        5 XP |   ~6 XP |
| Standard |       20 XP |   25 XP |
| Major    |       50 XP |  ~63 XP |

Exact rounding behavior can be standardized during implementation.

---

# 15. Spontaneous Activities

Meaningful spontaneous activities still earn XP.

Example:

A workout was not planned, but the user completes and logs it.

Result:

> **+20 XP**

The user should never feel that something meaningful “doesn't count” simply because it was not scheduled.

The Weekly Planner provides a bonus, not a requirement.

---

# 16. What Counts as Planned

To receive the Planned Activity Bonus, the activity must exist in the Weekly Planner **before it is completed**.

Creating an already-completed task afterward does not qualify.

This prevents:

> Do activity → create task afterward → claim planning bonus.

---

# 17. Small Chores

Everyday chores can earn XP.

Examples:

`🧺 Laundry` → 5 XP

`🗑️ Trash` → 5 XP

`🧹 Cleaning` → 5 XP

`📌 Small Errand` → 5 XP

These activities matter, but their low XP value prevents them from overpowering larger activities.

---

# 18. Anti-Farming Philosophy

Momentum should prevent XP farming without introducing restrictive daily caps.

Core rule:

> **Real repeated activity can earn XP. Repeated manipulation of Momentum cannot.**

---

# 19. No Daily XP Cap

There is no maximum amount of XP that can be earned in a day.

A highly productive day should be rewarded.

Example:

* Workout
* Chinese tutor
* Read
* Cook
* Complete errands
* Finish planned tasks

All legitimate activities can contribute XP.

Momentum should never say:

> You've earned enough XP today.

---

# 20. Anti-Farming Rules

Potential protections include:

* Deleted completed tasks cannot simply be recreated for additional XP.
* Completing/uncompleting the same activity repeatedly does not repeatedly award XP.
* Editing task details does not generate XP.
* Duplicate completion events are ignored.
* Certain repeatable micro-activities can be limited when necessary.
* Database entries do not automatically generate XP.
* XP events receive unique identifiers.

Exact implementation can be determined during development.

---

# 21. Weekly Completion

Momentum tracks completion of the Weekly Planner.

Example:

> **18 / 22 planned items completed**

Weekly completion provides one of the most important progression bonuses in Momentum.

---

# 22. Weekly Completion Percentage

At the end of each week:

**Completed planned tasks ÷ eligible planned tasks = Weekly Completion %**

Example:

`18 completed / 20 planned = 90%`

---

# 23. Weekly XP Bonuses

Weekly completion thresholds:

### 75%

**+50 XP**

### 90%

**+100 XP**

### 100% — Perfect Week

**+200 XP**

Only the highest achieved bonus applies.

Bonuses do not stack.

---

# 24. Perfect Week

Completing 100% of eligible planned activities creates a:

## 🏆 Perfect Week

Reward:

**+200 XP**

Perfect Weeks are tracked historically.

Example:

> **Perfect Weeks: 14**

---

# 25. No Weekly Penalty

Completing less than 75% of the Weekly Planner results in:

**No weekly bonus.**

Nothing else happens.

There is:

* No XP loss
* No level loss
* No warning
* No punishment

Next week begins normally.

---

# 26. Weekly Bonus Eligibility

Tasks added after they have already been completed do not count toward Weekly Planner completion bonuses.

This protects the meaning of:

> **I planned this and followed through.**

Tasks genuinely added during the week before completion can still qualify.

---

# 27. Dismissed Tasks

If a task is dismissed rather than completed:

* It earns no XP
* It does not generate a completion event
* It does not create a penalty

Weekly completion calculations should use consistent rules regarding dismissed/cancelled tasks so users are not punished for legitimate schedule changes.

The exact distinction between **dismissed**, **cancelled**, and **missed** can be finalized during implementation.

---

# 28. No Global Daily Streak

Momentum does not use a global:

> **Do something every single day or lose your streak**

system.

Different pillars have different natural schedules.

Examples:

* Rest days matter in Athletics
* Finance does not require daily activity
* Cooking may not happen every day
* Journaling should never feel mandatory

A global daily streak would encourage meaningless activity simply to preserve a number.

---

# 29. Pillar Streaks

Individual pillars can maintain useful streaks where appropriate.

Example:

Chinese can track activity days through its contribution graph.

These pillar-specific systems do **not multiply global XP**.

Global progression remains centered around Weekly Planner follow-through.

---

# 30. No Global Streak Multiplier

Momentum does not use an escalating daily XP multiplier.

The original streak-multiplier concept is replaced by:

> **Weekly Planner Completion Bonuses**

This better matches how Momentum is designed to be used.

---

# 31. Level Progression

Early Momentum levels should arrive relatively quickly.

As levels increase, progression gradually slows.

Desired feeling:

### Early

Frequent progression and immediate feedback.

### Middle

Approximately one or two levels per month depending on activity.

### High

Levels become meaningful long-term accomplishments.

---

# 32. Initial XP Curve

Early progression can begin approximately:

`Level 1 → 2: 100 XP`

`Level 2 → 3: 125 XP`

`Level 3 → 4: 150 XP`

`Level 4 → 5: 175 XP`

`Level 5 → 6: 200 XP`

Required XP continues increasing gradually.

---

# 33. Progression Curve Philosophy

The curve should **not grow exponentially**.

Momentum should avoid situations where a high-level user needs an absurd amount of time to gain one level.

The progression curve should increase steadily enough that higher levels remain meaningful without becoming unreachable.

The exact formula will be tuned during implementation.

---

# 34. Level 100

Level 100 should represent **years of meaningful Momentum use**.

It should not realistically be grindable in a few months.

The system should reward consistency across real life rather than repetitive XP farming.

---

# 35. Level Up

When enough XP is earned:

> ✨ **LEVEL UP**
>
> **Momentum Level 17 → 18**

The XP bar completes and transitions into the next level.

Level-up feedback can include:

* Animation
* Optional sound
* Small visual celebration

It should feel satisfying without interrupting normal use.

---

# 36. Milestone Levels

Certain levels are major Momentum milestones.

Initial milestones:

* Level 5
* Level 10
* Level 25
* Level 50
* Level 75
* Level 100

Milestone levels receive stronger recognition than normal levels.

---

# 37. Milestone Badges

Each milestone earns a permanent badge.

Conceptually:

`● 5`

`◆ 10`

`✦ 25`

`★ 50`

`♛ 100`

These are placeholders rather than final badge designs.

Actual visual designs will be created during UI implementation.

---

# 38. Badge Collection

Earned milestone badges are permanently stored.

The user can view previous milestone achievements.

Badges represent genuine long-term Momentum progression rather than purchasable cosmetics.

---

# 39. Momentum Titles

Milestone levels also change the user's Momentum title.

Concept:

`Level 1–4` → Starting title

`Level 5–9` → Title II

`Level 10–24` → Title III

`Level 25–49` → Title IV

`Level 50–74` → Title V

`Level 75–99` → Title VI

`Level 100+` → Final title tier

Exact title names are intentionally **not locked yet**.

They should be designed later when the visual progression system is implemented.

---

# 40. Milestone Celebration

Milestone levels receive a larger celebration.

Example:

## ✦ LEVEL 25

### MILESTONE REACHED

**New Title: [Title]**

**Your Journey So Far**

🏋️ 81 workouts

🇨🇳 106 Chinese activities

📖 42 reading activities

🍳 57 meals cooked

✅ 294 plans completed

**Lifetime XP: 12,850**

---

# 41. Milestone Snapshot

When a milestone is reached, Momentum permanently saves a snapshot of progress at that moment.

Possible snapshot data:

* Date achieved
* Lifetime XP
* Workouts completed
* Chinese activities
* Reading activities
* Meals cooked
* Finance activities
* Weekly Plan tasks completed
* Perfect Weeks
* Other meaningful global statistics

This creates a historical record of the journey.

---

# 42. Milestone History

Previous milestone snapshots can be revisited.

Example:

## Momentum Journey

**Level 5**
Reached: September 2026

**Level 10**
Reached: December 2026

**Level 25**
Reached: August 2027

Selecting a milestone opens its saved snapshot.

This allows the user to see how life and Momentum usage evolved over time.

---

# 43. Recognition Over Cosmetics

Momentum milestones do not primarily unlock:

* Backgrounds
* Furniture
* Decorative objects
* Themes
* Large cosmetic inventories

The reward is:

* Level
* Badge
* Title
* Milestone snapshot
* Recognition of actual accomplishments

This better reflects Momentum's purpose.

---

# 44. Home Integration

Momentum Level and XP appear on Home.

Example:

## Momentum

**Level 14 — [Title]**

`██████████████░░░░`

`1,420 / 1,600 XP`

However:

> **The Weekly Planner remains the centerpiece of Home.**

XP supports the experience rather than taking over the interface.

---

# 45. XP Feedback

When XP is earned, feedback should be subtle.

Example:

Task completed:

`✓ Push Workout`

Small animation:

`+25 XP`

The number can briefly appear and then fade.

The user should not need to open another page to see that XP was earned.

---

# 46. Weekly Results

At the end of a week, Momentum can show a lightweight summary.

Example:

## Week Complete

**18 / 20 planned activities**

**90% Completion**

Weekly Bonus:

**+100 XP**

Total XP Earned:

**+425 XP**

`Continue →`

Perfect Weeks receive a stronger version.

---

# 47. Perfect Week Celebration

Example:

## 🏆 PERFECT WEEK

**22 / 22 completed**

**100%**

Weekly Bonus:

**+200 XP**

The celebration should feel special because Perfect Weeks should represent genuine follow-through.

---

# 48. Weekly Planner Remains Flexible

XP should never make the Weekly Planner rigid.

Users can still:

* Move tasks
* Reschedule
* Cancel legitimate plans
* Add new plans
* Complete spontaneous activities

The progression system should support real life rather than encourage gaming the planner.

---

# 49. Pillar Balance

No single pillar should dominate XP simply because it contains more buttons or more database entries.

XP values should reflect meaningful actions rather than data volume.

For example:

Adding 10 Chinese vocabulary entries should **not** outperform completing an entire workout.

This principle should be considered whenever new pillar features are added.

---

# 50. XP Event System

Implementation should treat XP awards as events.

Example conceptual event:

`workout_completed`

could contain:

* Event ID
* Date/time
* Pillar
* Activity ID
* Base XP
* Planned status
* Bonus XP
* Final XP

This helps prevent duplicate XP and allows progression history to remain reliable.

---

# 51. XP History

Momentum should retain enough XP history to understand where Lifetime XP came from.

A full complicated ledger does not need to dominate the interface.

However, users should eventually be able to inspect recent XP activity.

Example:

## Recent XP

`+25` Push Workout

`+6` Laundry

`+25` Chinese Tutor

`+20` Reading

`+100` Weekly 90% Bonus

This is particularly useful for troubleshooting progression.

---

# 52. XP Rounding

Planned activities receive +25%.

Because this can create decimals, Momentum should use a consistent rounding rule.

Example:

Quick:

`5 × 1.25 = 6.25`

Displayed XP could become:

`6 XP`

Major:

`50 × 1.25 = 62.5`

Displayed XP could become:

`63 XP`

The exact rounding method should be consistent across the application.

---

# 53. Global Activity Identity

Activities should maintain unique identities.

This allows Momentum to know that:

> The Push Workout completed in Athletics

is the same activity as:

> Push shown on Thursday's Weekly Planner

and therefore should award XP only once.

This reinforces the Core/Home principle:

> **One item, displayed wherever useful.**

---

# 54. XP and Deleted Tasks

Deleting an activity after XP was legitimately earned should not necessarily erase Lifetime XP.

XP represents something that actually happened.

However, accidental or fraudulent completion handling should be considered during implementation.

The system should prioritize data integrity without becoming frustrating.

---

# 55. Weekly Bonus Timing

Weekly completion bonuses are awarded once the week closes.

The default Momentum week is:

> **Monday → Sunday**

The weekly result can be processed when the user next opens Momentum after the week ends.

No server or background process is required for the local-first version.

---

# 56. Offline / Local-First Progression

The XP system should work completely locally.

It should not require:

* User accounts
* Cloud servers
* Internet connection
* Online leaderboards

Progression belongs to the user.

---

# 57. No Leaderboards

Momentum does not compare the user's level against other people.

There is no:

* Global leaderboard
* Friend leaderboard
* Competitive ranking
* Percentile

The comparison is:

> **You now vs. you before.**

---

# 58. No XP Purchases

XP cannot be purchased.

There are no:

* XP boosters
* Premium multipliers
* Paid levels
* Purchasable badges

Progression reflects activity.

---

# 59. No Seasonal Reset

Momentum does not reset levels for:

* New year
* New season
* New month
* Application updates

Lifetime progression remains permanent.

Weekly Planner completion naturally provides shorter-term cycles without erasing long-term progress.

---

# 60. Progression Hierarchy

Momentum progression operates at three timescales:

### Daily

Complete meaningful activities.

↓

### Weekly

Follow through on the Weekly Planner.

↓

### Long-Term

Gain levels, titles, badges, and milestone snapshots.

This creates progression without requiring a daily streak.

---

# 61. Relationship to the Pillars

Each pillar answers a different question.

**Finance**

> How am I managing my money?

**Chinese**

> How am I progressing with Chinese?

**Athletics**

> How am I training?

**Cooking**

> What am I eating and cooking?

**Happiness / Journal**

> What do I want to capture and remember?

The XP system asks:

> **Am I continuing to move forward overall?**

---

# 62. Friction Rule

Before adding an XP feature, ask:

> **Does this reward real progress, or does it encourage me to use the app more?**

If it primarily encourages unnecessary interaction with Momentum, it should not be added.

---

# 63. North Star

Momentum XP succeeds when the user can look at:

> **Level 50**

and understand that the number represents hundreds or thousands of real actions completed over a long period of life.

The goal is not to become good at Momentum.

The goal is to use Momentum to become more consistent with the things that matter.

> **Plan → Do → Build Momentum**

---

# 64. Design Status

* [x] One global Momentum level
* [x] Lifetime XP
* [x] XP never decreases
* [x] Levels never decrease
* [x] Weekly Planner as progression engine
* [x] Meaningful activity rewards
* [x] Quick / Standard / Major XP tiers
* [x] Automatic XP classification
* [x] Manual effort override
* [x] Planned +25% bonus
* [x] Spontaneous activity XP
* [x] Small XP for chores
* [x] No daily XP cap
* [x] Anti-farming philosophy
* [x] No global daily streak
* [x] Weekly completion system
* [x] 75% weekly bonus
* [x] 90% weekly bonus
* [x] Perfect Week bonus
* [x] Perfect Week history
* [x] Increasing level curve
* [x] Long-term Level 100 target
* [x] Milestone levels
* [x] Permanent milestone badges
* [x] Momentum titles
* [x] Milestone progress snapshots
* [x] Milestone history
* [x] XP feedback animations
* [x] Weekly results
* [x] Pillar balance
* [x] XP event architecture
* [x] XP history
* [x] Local-first progression
* [x] No leaderboards
* [x] No seasonal resets
* [x] Ready for implementation

**Momentum XP System Design: COMPLETE**
