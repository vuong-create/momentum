# Momentum — Athletics Pillar

**Status:** 🟢 Athletics V2 Training Blocks Implemented
**Next Step:** September 2026 Real-World Training QA

---

# 1. Purpose

The Athletics pillar is a fast, low-friction workout and volleyball tracker.

Its purpose is to answer:

> **Am I training consistently, and am I getting stronger?**

Momentum should make workout logging easier than using notes or manually maintaining a spreadsheet.

The pillar should collect useful training data without turning every workout into a data-entry session.

Core philosophy:

> **Log workouts quickly → Momentum calculates progress automatically.**

---

# 2. Core Principles

## Fast Logging

Logging a set should take approximately one tap whenever possible.

Buttons, remembered values, and workout templates should reduce typing.

## Track Training, Not Everything

Athletics focuses on:

* Gym workouts
* Exercises
* Sets
* Weight
* Reps
* Volleyball
* Training consistency
* PRs

It does not track:

* Body weight
* Calories
* Nutrition
* Detailed health information
* RPE
* Complicated athletic scores

## Rest Is Normal

Momentum should never encourage training every day simply to preserve a streak.

Athletics uses **weekly consistency**, not a daily workout streak.

---

# 3. Athletics Navigation

Primary sections:

1. Dashboard
2. Calendar
3. Workout
4. Templates
5. History
6. Progress

---

# 3.1 Structured Training Blocks

Athletics supports time-bounded programs containing structured sessions rather
than representing every workout as an unstructured task.

A training block stores:

* Start and end dates
* Weekly phases and coaching guidance
* Gym, volleyball, and recovery days
* Exercise prescriptions
* Explosive versus hypertrophy categories
* Exercise alternatives
* Planner task links

The September 2026 block runs across four complete Monday–Sunday weeks from
August 31 through September 27. September 28–30 remain an intentional
transition period.

Installing a block is additive, previewed, and duplicate-safe. Existing tasks,
templates, workouts, and history are never overwritten.

## Planner Relationship

The Athletics planned session owns the workout prescription. Its linked
Planner activity owns the current scheduled date.

This means:

* Moving a session in Planner also moves it on the Athletics calendar
* Home and Planner display the same Athletics commitment
* Selecting the task opens the structured Athletics session
* A task completes only when the workout is finished or volleyball is logged
* Completing the workout cannot award duplicate task XP
* Overdue sessions remain Missed until moved, completed, or explicitly skipped

Recovery days remain visible in the training calendar but do not create noisy
Planner tasks.

## Saturday Volleyball Decision

Saturday begins as Recovery. It can be changed to Sand Volleyball from its day
detail.

When volleyball is selected, the preceding Lower B session becomes a
reduced-volume workout:

* Explosive work retains its prescribed low-fatigue volume
* Four hypertrophy sets become three
* Three hypertrophy sets become two
* Two hypertrophy sets become one

Switching Saturday back to Recovery restores normal Friday volume, except in
Week 4 where the planned deload remains active.

## September Progression

* Week 1 — Baseline: working weights and 2–3 reps in reserve
* Week 2 — Progress: add repetitions inside each range
* Week 3 — Overload: hardest week and 1–2 reps in reserve
* Week 4 — Reduced Fatigue: 30–40% less lifting volume

Hypertrophy work uses double progression. Planned workouts carry previous
weights and reps forward, while History and Progress preserve completed
performances. Explosive exercises use simple quality-focused set completion so
speed work does not become unnecessary data entry.

---

# 4. Athletics Dashboard

The dashboard should make starting a workout extremely easy.

Example:

## Athletics

**This Week: 3 / 4 Planned Sessions**

### Quick Start

`[ Push ] [ Pull ] [ Legs ] [ + Template ]`

`[ + Volleyball ] [ + Custom Workout ]`

### Recent Training

* Push — Yesterday
* Volleyball — July 29
* Pull — July 27

### Recent PR

🏆 Incline DB Press

`65 lb × 9`

The dashboard should prioritize **starting training**, not looking at analytics.

---

# 5. Workout Templates

Users can create reusable workout templates.

Examples:

* Push
* Pull
* Legs
* Upper
* Lower
* Plyometrics
* Mobility
* Custom routines

Templates are fully customizable.

Each template stores:

* Template name
* Exercises
* Exercise order
* Default number of sets

Templates do **not** need to permanently store the weight/reps used during every future session.

Momentum pulls those values from the most recent workout.

---

# 6. Template Management

Templates can be:

* Created
* Renamed
* Duplicated
* Reordered
* Edited
* Deleted
* Scheduled

Exercises inside templates can also be reordered.

Starting a template immediately creates a new workout with the exercises already populated.

---

# 7. Starting a Workout

Selecting a template opens the workout screen.

Example:

## Push

### Incline DB Press

Previous:

`65 × 7`

Current workout:

`Set 1`

**65 lb × 7 reps**

Quick controls:

`Repeat Last`

`-5 lb` `+5 lb`

`-1 Rep` `+1 Rep`

`✓ Set`

Values can also be manually typed when necessary.

---

# 8. Exercise Logging

Exercise logging remains intentionally basic.

Each set tracks only:

* Weight
* Reps
* Completion

No required RPE or difficulty rating.

Momentum remembers:

* Previous weight
* Previous reps
* Previous sets
* Exercise history

The goal is to minimize typing.

---

# 9. Repeat Last

A prominent **Repeat Last** action copies the previous corresponding set.

Example:

Last workout:

`Set 1 — 65 × 7`

Selecting:

`Repeat Last`

immediately populates:

`65 × 7`

The user can then adjust using quick buttons.

---

# 10. Quick Adjustment Buttons

Common adjustments should require one tap.

Examples:

### Weight

`-5 lb` `+5 lb`

### Reps

`-1` `+1`

The exact increment may eventually be customizable if useful.

Manual entry remains available.

---

# 11. Workout Editing

During a workout, users can:

* Add exercise
* Remove exercise
* Reorder exercises
* Add set
* Remove set
* Skip exercise
* Substitute exercise

If the workout differs from the original template, Momentum can eventually offer:

> Save these changes to the template?

Options:

* This workout only
* Update template

This prevents temporary substitutions from permanently changing routines.

---

# 12. Exercise History

Momentum maintains history for each exercise automatically.

Example:

## Incline DB Press

Recent sessions:

* Jul 31 — 65 × 9
* Jul 24 — 65 × 7
* Jul 17 — 60 × 9
* Jul 10 — 60 × 8

Selecting an exercise opens its complete history.

---

# 13. Automatic PR Detection

Momentum automatically detects simple strength PRs.

PR types:

## Weight PR

The heaviest weight ever completed for the exercise.

## Rep PR

The most repetitions completed at a specific weight.

Example:

🏆 **New Rep PR**

Incline DB Press

`65 lb × 9`

Previous:

`65 lb × 7`

PRs require no manual logging.

---

# 14. PR Experience

PRs should feel satisfying.

Potential effects:

* Small animation
* Subtle success sound
* PR badge
* Recent PR displayed on Dashboard

Effects should remain tasteful rather than excessive.

---

# 15. Custom Workouts

Not every workout needs a template.

Users can select:

`+ Custom Workout`

and add exercises manually.

Afterward, the workout can optionally be saved as a new template.

---

# 16. Volleyball

Volleyball should not be treated like a gym workout.

A dedicated:

`+ Volleyball`

button allows extremely fast logging.

Options:

* Practice
* Open Gym
* Tournament
* Coaching / Other

Selecting one immediately logs the activity.

Notes are optional.

No additional information is required.

---

# 17. Volleyball History

Volleyball sessions appear in Athletics History alongside gym workouts.

Momentum can automatically calculate:

* Sessions this week
* Sessions this month
* Sessions this year

Volleyball contributes toward Athletics activity and the activity heatmap.

---

# 18. Weekly Planning

Athletics supports scheduled workouts.

Example:

* Monday — Push
* Tuesday — Volleyball
* Wednesday — Rest
* Thursday — Pull
* Friday — Rest
* Saturday — Legs
* Sunday — Rest

However, the weekly planning system does **not belong exclusively to Athletics**.

It is part of the global Momentum system.

---

# 19. Global Momentum Weekly Plan

Momentum Home will eventually contain a universal Weekly Plan.

It can contain:

* Athletics workouts
* Chinese activities
* Finance tasks
* Cooking plans
* Happiness activities
* General tasks
* Anything outside the five pillars

Example:

## This Week

**MON** — 🏋️ Push ✓
**TUE** — 🇨🇳 Chinese Tutor ✓
**WED** — 🏐 Volleyball
**THU** — 🏋️ Pull
**FRI** — 📌 Renew Registration
**SAT** — 🏋️ Legs
**SUN** — 🍳 Meal Prep

This system will be designed fully as part of Momentum Core/Home.

---

# 20. One Task, Multiple Views

Scheduled workouts are not duplicated.

Example:

Scheduling:

`Thursday — Pull`

inside Athletics creates the same underlying item shown on Momentum Home.

If moved to Friday from Momentum Home, Athletics also reflects Friday.

If completed from either location, it appears completed everywhere.

Principle:

> **One task, displayed in multiple places.**

---

# 21. Weekly Consistency

Athletics does not use a traditional daily streak.

Instead:

> **This Week: 3 / 4 Planned Sessions**

If four training sessions are planned and all four are completed:

> **4 / 4 ✓**

Rest days do not count against the user.

This encourages sustainable training rather than unnecessary daily workouts.

---

# 22. History

History provides a chronological view of previous training.

It includes:

* Gym workouts
* Volleyball
* Custom workouts
* Completed templates

A calendar view makes workout days easy to identify.

Selecting a day opens the complete workout.

---

# 23. Monthly Summary

History can display simple monthly statistics.

Example:

## July

**Workouts:** 16
**PRs:** 4
**Total Sets:** 92
**Volleyball Sessions:** 6

These values are calculated automatically.

No additional logging is required.

---

# 24. Activity Heatmap

Athletics receives a GitHub-style yearly activity heatmap similar to Chinese.

Each square represents one day.

Intensity represents the amount/type of Athletics activity.

Example:

### Light

* Mobility
* Short session

### Normal

* Typical gym workout
* Volleyball practice

### Heavy

* Higher-volume workout
* Tournament
* Significant training day

Momentum calculates intensity automatically whenever possible.

The user does not manually rate workout intensity.

---

# 25. Progress

Progress is generated automatically from workout data.

Primary metrics:

* Workouts per week
* Workouts per month
* Weekly consistency
* Total sets
* PR history
* Volleyball sessions
* Exercise progress
* Activity heatmap

No separate progress logging is required.

---

# 26. Exercise Progress

Selecting an exercise provides deeper progress information.

Example:

## Incline DB Press

History:

`60 × 8 → 60 × 9 → 65 × 7 → 65 × 9`

A simple graph can visualize progress over time.

The graph should rely on actual workout data rather than requiring manual benchmarks.

---

# 27. Workout Calendar

Progress / History includes a calendar showing training days.

Selecting a date reveals:

* Workout type
* Exercises
* Sets
* Weight
* Reps
* PRs
* Volleyball activity
* Optional notes

---

# 28. No Body Weight Tracking

Momentum Athletics does not track body weight.

The pillar focuses on training behavior and performance.

Body composition tracking can remain outside Momentum unless there is a future reason to add it.

---

# 29. No RPE

RPE is intentionally excluded from Version 1.

A completed gym set needs only:

**Weight + Reps**

This keeps logging friction low.

---

# 30. No Detailed Athletic Testing

Version 1 does not require:

* Vertical jump testing
* Sprint testing
* Agility testing
* Mobility scores
* Athletic ratings
* Composite performance scores

These can be reconsidered later if there is a genuine use case.

Momentum should not add measurements simply because they can be measured.

---

# 31. Sounds & Animations

Athletics can use subtle feedback.

Potential examples:

### Set Completed

Small visual confirmation.

### Workout Completed

Satisfying completion animation.

### PR

Small celebration + optional sound.

### Weekly Goal Completed

Subtle success animation.

Sounds should be optional globally.

---

# 32. XP

Athletics does not define its own XP rules.

Completed training creates events that the global Momentum XP system can later evaluate.

Potential events include:

* Workout completed
* Planned workout completed
* Volleyball session
* Weekly training goal completed
* PR achieved

XP values and rules belong in:

`02 XP System.md`

---

# 33. Friction Rule

Before adding an Athletics feature, ask:

> **Does this make logging training easier or make the resulting data more useful?**

If neither is true, the feature probably does not belong.

Examples intentionally excluded:

* RPE
* Calories
* Body weight
* Detailed recovery surveys
* Excessive workout notes
* Manual PR entry
* Manual progress tracking

---

# 34. North Star

The Athletics pillar succeeds when:

> **Logging a workout is easier than not logging it.**

Momentum should remember the routine, previous numbers, and history.

The user primarily needs to:

**Train → Tap → Continue.**

Everything else should happen automatically.

---

# 35. Design Status

* [x] Pillar purpose
* [x] Workout templates
* [x] Template management
* [x] Fast set logging
* [x] Previous workout values
* [x] Repeat Last
* [x] Quick weight/repetition controls
* [x] Custom workouts
* [x] Automatic PR detection
* [x] Exercise history
* [x] Volleyball quick logging
* [x] Workout history
* [x] Activity heatmap
* [x] Weekly consistency
* [x] Global Weekly Plan integration defined
* [x] Progress metrics
* [x] Dashboard
* [x] XP separated from pillar
* [x] Ready for implementation

**Athletics Pillar Design: COMPLETE**

---

# 36. Implementation Status

The first Athletics product milestone is implemented as a feature-based module backed by Dexie.

Implemented:

* Premium Athletics dashboard focused on starting training
* Editable Push, Pull, and Legs starter templates
* Custom template creation, editing, duplication, deletion, and Planner scheduling
* Active workout sessions with remembered values from the previous matching exercise
* Repeat Last, quick weight/repetition adjustment, set creation, and one-tap set completion
* Custom workouts and in-session exercise changes
* Automatic weight and same-weight repetition PR detection
* One-tap Practice, Open Gym, Tournament, and Coaching / Other volleyball logging
* Unified chronological gym and volleyball history
* Monthly summaries, 52-week heatmap, exercise bests, and PR history
* Shared Planner identity and automatic completion of the matching planned workout
* Shared global + Athletics pillar XP ledger
* Reversible workout deletion with linked Planner and XP correction
* Dedicated set, workout, volleyball, and PR feedback sounds
* Reduced-motion and global sound preference support

The implementation intentionally keeps template and session exercises as embedded snapshots. Editing a template therefore never rewrites historical workouts, while previous values and progress remain derived from completed session data.

**Athletics Pillar Foundation: COMPLETE**
