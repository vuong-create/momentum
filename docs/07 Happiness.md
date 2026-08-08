# Momentum — Happiness & Journal Pillar

**Status:** 🟢 Foundation Implemented
**Next Step:** Photo Memories

---

# 1. Purpose

The Happiness & Journal pillar is Momentum's personal reflection and memory space.

Its purpose is not to measure happiness or turn reflection into another productivity system.

Instead, it should provide a simple place to:

* Capture thoughts
* Reflect when desired
* Save meaningful moments
* Attach photos
* Collect meaningful quotes
* Revisit memories later

Core philosophy:

> **Capture → Reflect → Remember**

The pillar should require almost no maintenance.

---

# 2. Core Principles

## No Pressure

Journaling is optional.

There are:

* No required entries
* No journaling streaks
* No happiness scores
* No mood requirements
* No penalties for not writing

Momentum should invite reflection rather than demand it.

## Frictionless Capture

Writing something down should require almost no setup.

A thought can simply be:

> Write → Save → Done.

## Memories Over Metrics

The long-term value of this pillar comes from being able to look back at life.

The system prioritizes meaningful memories over graphs and statistics.

---

# 3. Navigation

Happiness & Journal contains five lightweight sections:

1. Today
2. Journal
3. Library
4. Look Back
5. Quotes

---

# 4. Today

The Today page contains three primary elements:

### Daily Quote

A rotating quote provides a small moment of inspiration or reflection.

### What's on Your Mind?

A frictionless journal entry box.

### Reflection Prompt

An optional rotating question for days when the user wants something to write about.

Nothing on this page is required.

---

# 5. What's on Your Mind?

The primary journal input is:

## What's on your mind?

`[ Write anything... ]`

`[ Save Entry ]`

No title is required.

No category is required.

No tags are required.

No mood is required.

The goal is to make brain-dumping effortless.

---

# 6. Home Integration

The same **What's on Your Mind?** input also appears on Momentum Home.

Entries written from Home automatically appear in Happiness / Journal.

There is no separate Home journal database.

Principle:

> **Write once. Stored in one place.**

---

# 7. Journal Entries

Each journal entry contains:

### Automatic

* Date
* Time

### Primary

* Text

### Optional

* Title
* Photos

That is enough for Version 1.

---

# 8. Saving an Entry

Selecting:

`Save Entry`

should:

* Save the entry
* Automatically timestamp it
* Clear the writing box
* Display a subtle confirmation animation

Saving should feel immediate.

---

# 9. Editing

Existing journal entries can be:

* Opened again after saving
* Edited
* Deleted
* Copied as plain text for quick recovery or use outside Momentum

Deletion should include a simple confirmation to prevent accidental loss.

Opening a saved entry must hydrate the editor from the selected database record
every time. Editor state must never remain tied to the empty state that existed
when the modal first mounted.

---

# 10. Photos

Journal entries can contain optional photo attachments.

Examples:

* Vacation
* Dinner
* Volleyball tournament
* Friends/family
* A random day
* Something worth remembering

Photos transform the journal from a text archive into a lightweight personal memory archive.

---

# 11. Multiple Photos

A journal entry can contain multiple photos.

Example:

## July 31, 2026

Had a great day today...

`[ Photo ] [ Photo ] [ Photo ] [ + Add ]`

Photos should be viewable at a larger size when selected.

---

# 12. Photo Persistence

Uploaded journal photos must remain available after:

* Refreshing Momentum
* Closing the browser
* Restarting the computer

Momentum should not depend on the original image remaining in its original location.

The exact local storage method will be determined during implementation.

---

# 13. Reflection Prompts

Momentum can optionally display one rotating reflection prompt.

Examples:

> What was good about today?

> What's been on your mind lately?

> What are you looking forward to?

> What made you laugh today?

> What do you want to remember about today?

> What are you grateful for right now?

The prompt library can grow over time.

---

# 14. Prompt Rotation

Reflection prompts rotate automatically.

Actions:

`Write`

`Another Prompt`

`Skip`

The user can always ignore the prompt and write freely.

---

# 15. Prompt Philosophy

Prompts exist only to help when the user does not know what to write.

They should never become:

* Required questions
* Daily homework
* Surveys
* Happiness assessments

Free writing remains the default.

---

# 16. Journal

The Journal page stores entries chronologically.

Newest entries appear first by default.

The experience should feel closer to browsing memories than reading a database.

---

# 17. Journal Search

Journal entries can be searched by text.

Example:

`🔎 Taiwan`

returns entries containing references to Taiwan.

Search should remain simple.

---

# 18. Calendar

Journal includes a calendar view.

Days containing journal entries receive a subtle indicator.

Selecting a day opens the journal entries from that date.

---

# 19. Look Back

Look Back contains:

* On This Day
* Random Memory
* Recent Entries

Its purpose is to resurface things that might otherwise be forgotten.

---

# 20. On This Day

Momentum automatically surfaces journal entries from the same calendar date in previous years.

Example:

## On This Day

### July 31, 2025

> Entry...

`[ Photos ]`

### July 31, 2024

> Entry...

`[ Photos ]`

This feature becomes more valuable the longer Momentum is used.

---

# 21. Random Memory

A:

`🎲 Random Memory`

button surfaces a random previous journal entry.

Action:

`Another Memory`

This provides a lightweight way to rediscover forgotten moments.

---

# 22. Recent Entries

Look Back can display a small selection of recent journal entries.

This makes returning to recent thoughts easy without searching.

---

# 23. Daily Quote

Happiness / Journal includes a rotating quote.

Example:

> “The journey of a thousand miles begins with one step.”
>
> — Lao Tzu

The quote should complement the page rather than dominate it.

---

# 24. Quote Actions

Each displayed quote can have:

`♡ Save Quote`

`↻ Another`

Saving adds the quote to the user's personal Quotes collection.

---

# 25. Quotes Collection

Momentum maintains a lightweight collection of saved quotes.

It contains:

* Saved Momentum quotes
* User-added quotes

---

# 26. Add Your Own Quote

Users can manually save quotes they encounter elsewhere.

Fields:

**Quote**

`[                                      ]`

**Author / Source**

`[                                      ]`

`Save`

Possible sources include:

* Books
* Songs
* Movies
* Chinese sayings
* Conversations
* Personal sayings
* Anything meaningful

---

# 27. Quote Favorites

Quotes can be favorited.

Favorites can be filtered or displayed more frequently.

This allows the collection to become increasingly personal.

---

# 28. Quote Philosophy

Quotes should feel thoughtful rather than like generic motivational spam.

The library should favor:

* Perspective
* Patience
* Growth
* Gratitude
* Life
* Courage
* Balance
* Relationships
* Meaning

A smaller high-quality collection is preferable to thousands of generic quotes.

---

# 29. Home Quote

A small daily quote could eventually appear on Momentum Home if it fits the final visual design.

The primary quote experience belongs inside Happiness / Journal.

Home should not become cluttered.

---

# 30. No Mood Tracking

Version 1 does not require:

* Mood selection
* Emoji mood ratings
* Happiness scales
* Daily scores
* Mood graphs

Momentum should not attempt to reduce emotional life to a number.

---

# 31. No Journal Streak

Happiness does not use a journaling streak.

Missing a day does not:

* Break anything
* Create warnings
* Reduce XP
* Create guilt

Journal when there is something worth capturing.

---

# 32. No Required Statistics

Happiness does not need a detailed Progress page.

Lightweight information such as:

`3 entries this week`

can appear on the Momentum Home pillar card.

Graphs and analytics are intentionally avoided.

---

# 33. Weekly Plan Integration

Happiness activities can optionally appear in the global Weekly Plan.

Examples:

`☀️ Date Night`

`☀️ Journal`

`☀️ Call Family`

`☀️ Go Somewhere New`

The Weekly Plan remains optional for this pillar.

---

# 34. XP

Happiness does not define its own XP system.

Potential global XP events include:

* Journal entry
* Planned personal activity completed
* Reading
* Reflection

XP should never pressure the user into journaling simply to earn points.

Detailed XP rules belong in:

`02 XP System.md`

---

# 35. Visual Direction

Happiness / Journal should be the calmest Momentum pillar.

Desired feeling:

* Warm
* Quiet
* Reflective
* Personal
* Nostalgic
* Comfortable

The interface should feel like a personal notebook and memory album rather than a productivity dashboard.

---

# 36. Notebook Visual Design

The Journal page should visually resemble a **personal physical notebook**.

This notebook aesthetic is a core part of the Journal experience.

The goal is to make opening the Journal feel like opening a notebook containing memories from different periods of life.

## Notebook Page

The primary writing surface should use:

* Warm off-white / cream paper
* Very subtle horizontal ruled lines
* Subtle red notebook margin line
* Generous writing space
* Minimal visible application UI
* Date prominently displayed at the top

The notebook effect should remain tasteful and readable rather than overly realistic.

## Writing Experience

Creating an entry should feel like writing directly onto a blank notebook page.

Example:

### Friday, July 31

`Start writing...`

The user should be able to click directly into the page and begin typing.

There should be no required setup before writing.

No required:

* Title
* Tags
* Category
* Mood
* Prompt

The primary action is simply:

`✓ Save`

## Typography

A subtle handwritten-style accent font can be used for:

* Dates
* Small headings
* Decorative labels

Actual journal entry text should remain highly readable.

Long entries should never be forced into a difficult-to-read handwritten font.

## Photos in the Notebook

Photos should visually feel like they were placed into the notebook.

Possible presentation:

* Lightly taped photographs
* Polaroid-inspired frames
* Slight natural rotation
* Small captions
* Multiple-photo arrangements

Photos remain clickable for full-size viewing.

## Direct Photo Placement

When technically practical, users should be able to:

* Upload photos
* Drag photos onto the page
* Paste photos
* Reorder attached photos
* Remove photos

Adding photos should not require navigating a complicated media manager.

## Page Navigation

Moving between journal entries should reinforce the notebook metaphor.

Controls:

`‹ Previous Entry`

`Next Entry ›`

Transitions can use a subtle page-turn or paper movement animation.

Animations should remain fast.

## Notebook Tabs

Journal navigation can appear as small notebook-style tabs.

Examples:

`Journal`

`Calendar`

`Look Back`

`Quotes`

`Search`

This preserves functionality without covering the notebook with traditional application navigation.

## Calendar

The Calendar functions like an index for the notebook.

Selecting a date opens entries associated with that day.

Dates containing entries receive a subtle visual marker.

## Multiple Entries

If multiple entries exist on the same day, they can appear sequentially on that day's notebook pages.

Each entry retains its original timestamp.

## Reflection Prompts

Rotating reflection prompts can appear subtly near the top of a blank page.

Example:

> *What do you want to remember about today?*

The prompt should visually fade into the background once writing begins.

## Daily Quote

The daily quote can appear like a:

* Handwritten note
* Bookmark
* Sticky note
* Margin element

within the notebook.

It should complement the journal rather than dominate it.

## Look Back

Opening an old memory should feel like returning to an older page of the notebook.

The original:

* Date
* Entry
* Photos
* Time

remain intact.

**On This Day** and **Random Memory** should open the actual notebook entry rather than displaying it in a disconnected analytics card.

## Design Rule

The notebook aesthetic should never make journaling harder.

If there is a conflict between:

**Looking like a notebook**

and

**Being easy to write in**

usability wins.

Desired experience:

> **Open notebook → write something → close it → rediscover it someday.**

---

# 37. Pillar Visual Identity

Each Momentum pillar has its own functional personality:

**Finance** → Financial dashboard

**Chinese** → Learning workspace

**Athletics** → Workout logger

**Cooking** → Personal cookbook

**Happiness / Journal** → Personal notebook

The pillars can feel distinct while still belonging to the same Momentum design system.

---

# 38. Memory Experience

Looking through old entries should feel rewarding.

Potential subtle visual elements:

* Date typography
* Polaroid-style photo presentation
* Gentle page transitions
* Seasonal visual accents
* Soft environmental background details

These should enhance memories without distracting from them.

---

# 39. Privacy

Journal data and personal photos should remain local as part of Momentum's local-first design.

Core functionality should not require uploading journal content to an external service.

Backup/export can be designed during implementation.

---

# 40. Friction Rule

Before adding a Happiness feature, ask:

> **Does this help capture or remember something meaningful?**

If not, it probably does not belong.

The pillar should remain intentionally small.

---

# 41. North Star

Happiness / Journal succeeds if Momentum becomes somewhere the user naturally wants to leave small pieces of life.

Not because they need to maintain a streak.

Not because a graph tells them to.

Simply because someday it will be nice to look back.

> **Capture → Reflect → Remember**

---

# 42. Future Ideas

Possible future additions:

* Export journal to PDF
* Year-in-review memory recap
* Photo timeline
* More reflection prompts
* Custom prompt library
* Quote categories
* Favorite memories
* Journal backup/export
* Search photos by date
* Anniversary memories

These are not required for Version 1.

---

# 43. Personal Library

Library is a small reading space inside Journal rather than a separate productivity system.

Books can be placed in:

* Want to Read
* Reading
* Finished

A book can keep an optional reflection, favorite line, dates, and a link to a normal Journal entry. Finished books appear as a restrained physical bookshelf so the collection becomes more personal over time without requiring cover uploads.

The Library does not use reading streaks, ratings, quotas, or completion pressure.

---

# 44. Foundation Implementation

Implemented in the first Journal milestone:

* Home thoughts save into the same Journal entry source of truth
* Draft continuation from Home to Today
* Warm notebook writing surface
* Entry history, text search, and Sunday-first calendar
* Centered editing, soft deletion, and undo
* On This Day, Random Memory, and recent entries
* Saved Momentum quotes, personal quotes, and favorites
* Personal Library with reading states and a physical bookshelf view
* Optional book reflection link into Journal

Photo attachments, memory galleries, and media compression are intentionally reserved for the next Journal milestone.

---

# 45. Design Status

* [x] Pillar purpose
* [x] What's on Your Mind?
* [x] Home journal integration
* [x] Frictionless entries
* [x] Optional titles
* [x] Photo attachments
* [x] Multiple photos
* [x] Photo persistence requirement
* [x] Rotating reflection prompts
* [x] Prompt skipping
* [x] Journal timeline
* [x] Search
* [x] Calendar
* [x] Look Back
* [x] On This Day
* [x] Random Memory
* [x] Daily quotes
* [x] Saved quotes
* [x] User-added quotes
* [x] Quote favorites
* [x] Notebook visual design
* [x] Notebook-style writing experience
* [x] Notebook photo presentation
* [x] Page navigation
* [x] No mood tracking
* [x] No journal streak
* [x] Weekly Plan integration
* [x] XP separated from pillar
* [x] Ready for implementation

**Happiness & Journal Pillar Design: COMPLETE**
