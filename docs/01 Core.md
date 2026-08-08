# Momentum — Core & Home

**Status:** 🟢 Design Complete
**Next Step:** Implementation

---

# 1. Purpose

Momentum Home is the central command center for the entire application.

It should answer three questions quickly:

> **What do I need to do today?**

> **What does the rest of my week look like?**

> **How am I doing across the areas of my life I care about?**

The Home page connects all five Momentum pillars while also supporting normal life tasks that do not belong to a pillar.

---

# 2. Core Philosophy

Momentum should help organize life without becoming another thing that needs constant maintenance.

The Home experience should be:

* Visual
* Calm
* Low-friction
* Useful every day
* Satisfying to interact with
* Easy to understand immediately

The central philosophy is:

> **One task, displayed wherever it is useful.**

Information should never need to be entered twice.

---

# 3. Home Page Hierarchy

The Home page follows this order:

1. Today
2. Weekly Progress
3. Thoughts

This hierarchy prioritizes action before analytics.

The Today list is the primary working surface and spans the available content
width. Weekly Progress follows it, while Thoughts remains a compact end-of-day
capture at the bottom rather than competing with the day's work.

---

# 4. Today

The first major section shows only what matters today.

Example:

## Today — Thursday

`✓ Chinese Tutor`

`○ Pull`

`○ Read`

`○ Cook Dinner`

Today's tasks are pulled automatically from the Weekly Plan.

Tasks can come from:

* Finance
* Chinese
* Athletics
* Cooking
* Happiness / Journal
* General Momentum tasks

Completing an item here completes the same item everywhere else in Momentum.

---

# 5. Weekly Plan

The Weekly Plan is one of Momentum's primary global systems.

It contains all seven days in Sunday-first order:

**Sunday → Saturday**

Example:

| SUN          | MON        | TUE          | WED           | THU      | FRI        | SAT      |
| ------------ | ---------- | ------------ | ------------- | -------- | ---------- | -------- |
| 🍳 Meal Prep | 🏋️ Push ✓ | 🇨🇳 Tutor ✓ | 🏐 Volleyball | 🏋️ Pull | 💰 Finance | 🏋️ Legs |
|              | 📖 Read    | 🍳 Tacos     | 📌 Laundry    | 📖 Read  |            |          |

The Planner presents the week as a horizontal set of day cards. Five cards are
typically visible on a laptop, with arrows and natural horizontal scrolling for
the remaining days. Wider layouts may reveal more cards.

Each card previews a small number of unfinished activities. Opening a card
reveals the complete day in a large Day Focus inspector, allowing ten or more
activities to remain readable without making every weekly card excessively
tall.

Planner capture always resolves to a day. When the user has not deliberately
selected one, the current-week composer defaults to **Today**. This avoids a
second holding area and ensures every captured activity is immediately visible
in the week. When another week is being viewed, the first day in that visible
week is the safe contextual default.

Dense-day controls live inside Day Focus: collapsible sticky sections, an
unfinished-only filter, manual ordering, quick move/copy actions, and a
past-day action for moving remaining work forward. The weekly surface remains
calm while the detailed view carries the operational depth.

Below the weekly cards, Planner provides a full **Month Overview**. It uses a
Sunday-first calendar grid, shows compact activity previews and completion
state, and includes adjacent-month days when needed to preserve whole weeks.
Selecting any date moves the weekly planner to that week and opens the existing
Day Focus inspector. Month navigation does not create a separate task system;
it reads the same Planner activities and materializes the same recurrence data.

---

# 6. One Task, Multiple Views

Momentum does not create duplicate tasks when something appears in multiple places.

On Home, completion and editing are separate actions. The completion control
uses the activity's pillar icon and becomes a check on hover or completion;
selecting the title opens the shared Activity Details editor so the title, day,
time, pillar, importance, notes, and recurrence can be corrected without
visiting Planner first. A compact pillar selector beside each activity supports
quick recategorization without opening the full editor. Day Focus uses the same
interaction pattern.

Example:

A **Pull workout scheduled Thursday** can appear in:

* Momentum Home
* Today
* Weekly Plan
* Athletics

All views reference the same underlying item.

If the workout is moved to Friday from Home, Athletics also reflects Friday.

If completed inside Athletics, Home immediately shows it as completed.

Principle:

> **Enter once. Update everywhere.**

---

# 7. Weekly Plan Task Types

Weekly Plan items can represent almost anything.

Examples:

## Athletics

* Push
* Pull
* Legs
* Volleyball
* Mobility

## Chinese

* Tutor
* Anki
* Chinese activity

## Finance

* Close Month
* Review Budget
* Financial task

## Cooking

* Planned dinner
* Meal prep
* Grocery-related task

## Happiness

* Journal
* Date night
* Personal activity

## General

* Laundry
* Appointment
* Errand
* Cleaning
* Reading
* Administrative task

Tasks do not need to belong to a pillar.

---

# 8. Reading

Reading is a first-class general Momentum activity.

It does not require its own pillar.

Examples:

`📖 Read`

`📖 Read 20 Pages`

`📖 Finish Chapter 6`

Reading can:

* Be scheduled
* Be recurring
* Appear on Today
* Appear on Weekly Plan
* Eventually contribute to global Momentum XP

Detailed reading tracking is not required for Version 1.

---

# 9. Quick Add

Adding something to the Weekly Plan should require as little effort as possible.

Each day card contains a compact:

`+`

button.

Clicking the `+` on Wednesday automatically selects Wednesday in the compact
Quick Add bar. The Day Focus inspector also provides a title-only add field for
that day.

The user primarily needs to:

1. Type task
2. Press Enter

Example:

Click Wednesday `+`

Type:

`Read`

Press Enter.

Done.

Home also includes an optional **Brainstorm** capture for moments when the user
has several loose ideas rather than one ready task. It presents a gentle prompt
and a large one-idea-per-line scratchpad, then adds the cleaned list to Today in
one action. Blank lines, pasted bullets, numbering, and duplicate lines are
normalized before capture. This is a capture aid, not a separate task database.

An eventual **Focus Mode** may combine a Pomodoro timer with optional work
music. It should be attached to a selected activity, respect global sound
settings, and remain outside the first Brainstorm milestone.

---

# 10. Optional Task Details

Quick Add should never open a large required form.

Additional settings live behind:

**More Options**

Optional information can include:

* Pillar
* Notes
* Time
* Repeat
* Important flag

None of these are required for a normal task.

---

# 11. Pillar Assignment

Tasks can optionally belong to a pillar.

Possible assignments:

* Finance
* Chinese
* Athletics
* Cooking
* Happiness
* General

Pillar tasks use a subtle visual identifier such as an icon or accent.

Examples:

💰 Finance
🇨🇳 Chinese
🏋️ Athletics
🍳 Cooking
☀️ Happiness
📌 General

The interface should remain cohesive rather than becoming excessively color-coded.

---

# 12. Task Interaction

Weekly Plan tasks behave like lightweight draggable rows and previews.

Primary interactions:

### Checkbox

Complete / uncomplete without leaving the current view.

### Task Body / Details

Open the shared activity details drawer for title, date, pillar, time,
importance, notes, status, and history.

### Day Card

Open a large Day Focus inspector grouped into Important, Scheduled, Anytime,
and collapsed Completed activities.

### Drag Between Days

Reschedule by dropping onto another day card.

### Drag Within Day

Reorder.

### Double Click / Edit

Open optional task details.

### +

Quick Add to that day.

Interactions should feel immediate and responsive.

---

# 13. Unfinished Tasks

Unfinished tasks remain on the day where they were originally scheduled.

Momentum does not automatically move them.

The following day, Home displays a subtle message:

> **2 unfinished from yesterday**

Options:

`Move to Today`

`Reschedule`

`Dismiss`

This prevents unfinished work from silently accumulating while still allowing the user to decide what happens.

---

# 14. Move to Today

Selecting:

`Move to Today`

changes the scheduled date to today.

The item does not become a duplicate.

All connected pillar views update automatically.

---

# 15. Reschedule

Selecting:

`Reschedule`

allows the task to be moved to another day.

The interaction should be fast.

Ideally:

`Mon · Tue · Wed · Thu · Fri · Sat · Sun · Pick Date`

---

# 16. Dismiss

Dismiss leaves the item historically incomplete but removes it from the unfinished-task prompt.

Momentum should not punish the user for dismissing an unfinished task.

All unfinished-task decisions are recoverable for a short period through an
Undo action. Moving and rescheduling preserve the same activity ID; dismissing
changes lifecycle status instead of deleting the record.

Current Home implementation groups overdue activities into one calm,
expandable review area. Each item shows how many days it has been carried, its
original date, and how many times it has been rescheduled. The available actions
are **Complete now**, **Move to Today**, **Choose date**, and **Delete**. Deletion
requires confirmation and remains recoverable for a short period through Undo.

---

# 17. Recurring Tasks

Tasks can optionally repeat.

Recurrence settings remain hidden unless needed.

Supported recurrence should include:

* Daily
* Selected weekdays
* Weekly
* Monthly
* Custom

Examples:

`📖 Read — Every Day`

`🏋️ Push — Every Monday`

`🗑️ Trash — Every Thursday`

`💰 Close Month — Monthly`

Recurring tasks should automatically populate the appropriate future schedule.

## Current Recurrence Implementation

Momentum materializes recurring occurrences only when Home or Planner views a
week. Each occurrence receives a stable series/date key, so reopening a week
cannot create duplicates and moving one occurrence does not cause the original
date to reappear.

Activity Details supports **This occurrence** and **This and future** editing,
plus Skip and End Recurrence actions. Planner Quick Add supports daily,
weekdays, weekly, monthly, and custom interval rules. Optional end dates remain
hidden with the rest of the recurrence controls until Repeat is enabled.

Reusable templates appear in a compact row beside the Planner capture flow.
They remember the activity defaults and may also remember a recurrence preset.
Workout exercise templates remain owned by the future Athletics feature.

---

# 18. Weekly Navigation

The Weekly Plan supports:

`← Previous Week`

`Today`

`Next Week →`

The **Today** button immediately returns to the current week.

Users can therefore plan future weeks or review previous weeks without losing context.

---

# 19. Important Tasks

Tasks can optionally receive a simple:

`★ Important`

flag.

Momentum does not need multiple priority levels.

There is no:

* Low
* Medium
* High
* Urgent
* Critical

A task is either normal or important.

Important tasks receive subtle visual emphasis.

---

# 20. Weekly Completion

Momentum can calculate basic weekly completion.

Example:

> **18 / 22 planned items completed**

This is informational rather than judgmental.

Incomplete items do not create penalties.

The global XP system can later decide whether completing planned activities contributes to XP.

---

# 21. Pillar Summaries

Below the Weekly Plan are five compact pillar cards.

These are not miniature dashboards.

Each card displays only one or two useful metrics.

Example:

## 💰 Finance

**Budget:** 68% used
**Net Worth:** ↗

## 🇨🇳 Chinese

**18 active days this month**

## 🏋️ Athletics

**3 / 4 workouts this week**

## 🍳 Cooking

**5 meals planned this week**

## ☀️ Happiness

**3 journal entries this week**

Selecting a card opens the full pillar.

---

# 22. Pillar Card Philosophy

Home should not duplicate every pillar's analytics.

Pillar cards exist to answer:

> **Is anything here worth my attention?**

Detailed information belongs inside the pillar.

---

# 23. Thoughts

The bottom portion of Home contains a compact journal-style text box.

## Thoughts

`[ Write anything... ]`

`[ Save Entry ]`

This is not an AI chat.

Momentum does not need to respond to the entry.

The purpose is frictionless thought capture.

---

# 24. Journal Capture

Saving an entry:

* Automatically timestamps it
* Saves it to Happiness / Journal
* Clears the text box
* Shows a subtle successful-save animation

No category is required.

No title is required.

No tags are required.

The user should be able to brain-dump and leave.

Organization can happen later if desired.

---

# 25. Home Visual Direction

The homepage should be one of the most aesthetically enjoyable areas of Momentum.

Overall inspiration:

* Cozy Asian café
* Anime-inspired environment
* Warm city atmosphere
* Cartoon diner influence
* Calm rather than neon-heavy

The aesthetic should frame the interface rather than interfere with usability.

The Weekly Plan and Today sections must remain highly readable.

---

# 26. Environmental Design

The surrounding Home interface can eventually incorporate:

* Café interior details
* Windows / cityscape
* Soft environmental animation
* Weather/time-inspired atmosphere
* Decorative objects
* Subtle characterful details

These elements are visual enhancements, not core functionality.

The application should remain usable before advanced artwork is added.

---

# 27. Micro-Interactions

Home should feel responsive.

Possible effects:

### Task Completed

* Smooth check animation
* Small visual response
* Optional soft sound

### Task Moved

* Smooth card movement

### Journal Saved

* Subtle confirmation animation

### Weekly Goal Completed

* Small success effect

Animations should enhance satisfaction without slowing down normal use.

---

# 28. Sound

Sounds are optional.

Potential sounds:

* Task completion
* Journal save
* Weekly completion
* Major achievement

Global Settings should allow sounds to be disabled.

Momentum should never require sound.

---

# 29. Data Persistence

Momentum data must remain available after:

* Closing the browser
* Restarting the computer
* Refreshing the page

Persistent storage is an implementation requirement.

The exact technical storage system will be determined during implementation.

---

# 30. Shared Data Architecture

Core systems should be reusable across pillars.

Examples:

### Weekly Plan

Used by:

* Home
* Athletics
* Cooking
* Chinese
* Finance
* Happiness

### Activities

Can feed:

* Pillar progress
* Global XP
* Home summaries

### Tasks

Can appear:

* On Home
* Inside a pillar
* In Today
* In Weekly Plan

The application should avoid separate disconnected systems that store the same information multiple times.

---

# 31. Settings

Momentum eventually includes a small Settings area.

Potential settings:

* Sounds on/off
* Animation preferences
* Appearance
* Data management
* Backup/export

Settings do not need extensive design during the initial version.

---

# 32. Notifications

Browser or system notifications are **not required for Version 1**.

The initial goal is to make Momentum useful and attractive enough that opening it naturally becomes part of the day.

Notifications can be reconsidered later.

---

# 33. Global XP

Home will eventually display the global Momentum XP / Level system.

Current direction:

> **One Momentum level shared across all pillars.**

Actions from:

* Finance
* Chinese
* Athletics
* Cooking
* Happiness
* Reading
* General tasks

can potentially contribute toward the same global progression.

The detailed XP rules belong in:

`02 XP System.md`

---

# 34. Home + XP

Potential future Home display:

## Momentum

**Level 14**

`██████████████░░░░`

`1,420 / 1,600 XP`

XP should support the Home experience without becoming more important than the actual Weekly Plan.

The Weekly Plan remains the functional centerpiece.

---

# 35. Home Page Structure

Final conceptual hierarchy:

```text id="dvgmx6"
MOMENTUM                         Level XX

Good Morning.

────────────────────────────────

TODAY — THURSDAY

✓ Chinese Tutor
○ Pull
○ Read
○ Cook Dinner

────────────────────────────────

THIS WEEK

MON  TUE  WED  THU  FRI  SAT  SUN

...

+ Add

────────────────────────────────

YOUR MOMENTUM

Finance
Chinese
Athletics
Cooking
Happiness

────────────────────────────────

WHAT'S ON YOUR MIND?

[ Write anything...              ]

[ Save Entry ]
```

---

# 36. Five-Second Rule

Within approximately five seconds of opening Momentum, the user should understand:

* What needs to happen today
* What the week looks like
* Whether any major life area needs attention

The Home page should not require digging through menus to answer these questions.

---

# 37. Friction Rule

Before adding any Core/Home feature, ask:

> **Does this help me decide what to do or make doing it easier?**

If not, it probably does not belong on Home.

Complexity should live inside deeper pages.

---

# 38. North Star

Momentum Home succeeds when it becomes the natural place to start the day.

It should feel like:

> **My week, my goals, and the important parts of my life — all in one place.**

Not a corporate productivity dashboard.

Not a complicated task manager.

Not a spreadsheet.

A personal home base.

---

# 39. Design Status

* [x] Home purpose
* [x] Today section
* [x] Seven-day Weekly Plan
* [x] Quick Add
* [x] Drag-and-drop scheduling
* [x] Task editing
* [x] Unfinished-task handling
* [x] Recurring tasks
* [x] Important flag
* [x] Week navigation
* [x] Weekly completion
* [x] General tasks
* [x] Reading
* [x] Pillar integration
* [x] Pillar summaries
* [x] Journal quick capture
* [x] Shared task philosophy
* [x] Visual direction
* [x] Data persistence requirement
* [x] XP integration reserved
* [x] Ready for implementation

**Core & Home Design: COMPLETE**
