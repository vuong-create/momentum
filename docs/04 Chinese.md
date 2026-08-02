# Momentum — Chinese Learning Pillar

**Status:** 🟢 Foundation Implemented
**Next Step:** Today, Database, Progress, and Planner Linkage

---

# 1. Purpose

The Chinese pillar is a lightweight daily home base for Mandarin learning.

Unlike Finance, this pillar should require almost no maintenance or detailed logging.

Its purpose is to help answer:

> **Am I consistently keeping Chinese in my life?**

Momentum does not need to replace dedicated language-learning tools.

Instead, it should make it easy to:

* Practice Chinese regularly
* Collect useful words and phrases
* Log Chinese exposure with almost zero friction
* See consistency and progress over time
* Quickly access Anki for dedicated spaced repetition

The pillar should encourage frequent exposure rather than obsess over study hours or proficiency scores.

Momentum uses **Traditional Chinese** throughout this pillar. Pronunciation playback prefers a Taiwanese Mandarin voice (`zh-TW`) when the device provides one.

---

# 2. Core Philosophy

The Chinese pillar follows three ideas:

**Practice → Collect → See Progress**

## Low Friction

Logging Chinese should take seconds.

Finance can tolerate detailed manual entry.

Chinese should not.

## Any Chinese Counts

Chinese learning happens outside formal study.

Meaningful exposure includes:

* Anki
* Tutor sessions
* Music
* Podcasts
* YouTube/videos
* TV shows
* Movies
* Conversations
* Reading
* Other meaningful Chinese exposure

All of these can contribute toward an active Chinese day.

## Momentum Is the Home Base

Momentum organizes Chinese learning and tracks consistency.

It does not need to recreate every specialized language-learning tool.

---

# 3. Navigation

The Chinese pillar has three primary sections:

1. Today
2. Database
3. Progress

The structure should remain intentionally small.

---

# 4. Chinese Dashboard / Today

The Chinese homepage should immediately provide something useful without overwhelming the user.

Example structure:

## Chinese

**🔥 12 Day Streak**
**📚 184 Words & Phrases**

### Today

**Anki Review**

`[ Open Anki ]`

Momentum should make it easy to jump directly into Anki for dedicated spaced repetition.

After completing Anki:

`[ ✓ Anki Done ]`

This logs Chinese activity for the day.

---

# 5. Quick Activity Logging

Outside Chinese exposure should require approximately one click to log.

Quick actions:

* Anki
* Tutor
* Music
* Podcast
* TV / Video
* Conversation
* Reading
* Other

Clicking an activity immediately logs it for the current day.

No additional form is required.

Optional details can be added afterward if desired.

For example:

**Podcast**

Optional:

* Title/source
* Notes

These details are never required.

---

# 6. Planner Linkage

Chinese quick actions connect to the shared Weekly Planner through typed activity metadata.

If today's Planner contains an unfinished Chinese activity with the same activity type, tapping the Chinese quick action:

* Creates one Chinese Activity
* Completes the matching Planner activity
* Uses the Planner's completion and planned XP bonus
* Does not create a second XP award

Momentum must not match Planner activities by title text. The shared record stores an explicit Chinese activity type such as `anki`, `tutor`, or `podcast`.

If no matching plan exists, the action is logged as spontaneous Chinese activity.

---

# 7. Activity Weight

Any meaningful Chinese activity makes the day active.

However, not every activity needs to contribute the same amount of activity intensity.

Examples:

### Light Activity

* Listening to a Chinese song
* Adding a phrase
* Brief exposure

### Normal Activity

* Anki review
* Podcast
* Watching Chinese content

### Strong Activity

* Tutor session
* Significant Chinese practice
* Multiple activities in one day

These weights primarily affect the activity heatmap visualization.

They should not make logging more complicated.

---

# 8. Personal Language Database

Momentum maintains a personal database of useful Chinese encountered in real life.

This is not intended to replace an Anki deck.

Instead, it becomes a searchable record of:

> **Chinese that is personally useful or meaningful to me.**

Words and phrases live together in one database.

---

# 9. Adding Language

Adding something should be extremely fast.

Primary entry:

**Chinese → Meaning → Save**

Example:

Chinese:

`隨便`

Meaning:

`whatever / as you like`

Then:

`[ Save ]`

---

# 10. Database Fields

## Primary Fields

* Chinese
* Meaning

## Automatic / Quick Fields

* Pinyin
* Date Added

Pinyin should ideally be generated automatically from the Chinese characters.

Generated pinyin is always editable because names, regional vocabulary, and polyphonic characters may need correction.

## Optional Fields

* Type
* Example
* Notes
* Tags
* Source

Database maintenance does not earn XP and does not activate the streak. Collecting language and practicing Chinese remain deliberately separate behaviors.

---

# 10A. Pronunciation

Pronunciation is a first-class action throughout the Chinese pillar.

Every saved entry can provide:

* Traditional Chinese text
* Tone-mark pinyin
* One-tap Taiwanese Mandarin playback

Today also surfaces a recent entry as a small pronunciation focus card. Playback uses the device's speech system and fails gracefully when a compatible voice is unavailable.

Microphone recording, pronunciation scoring, and tutor-style feedback remain future enhancements rather than requirements for the first reliable version.

---

# 11. Word / Phrase Type

Database entries can optionally be identified as:

* Word
* Phrase

Words and phrases remain together in the same database.

There are no separate databases.

---

# 12. Source

Source is optional.

Possible sources include:

* Tutor
* Song
* Podcast
* TV / Movie
* Conversation
* Other

Source should not appear as a required field during normal quick entry.

---

# 13. Tags

Entries can optionally have custom tags.

Examples:

* Taiwan
* Food
* Travel
* Casual Speech
* Tutor
* Slang
* Restaurant
* Family

Tags help organize the database without creating complicated folder structures.

---

# 14. Database Page

The Database page uses a clean searchable table.

Example:

| Chinese | Pinyin   | Meaning                |
| ------- | -------- | ---------------------- |
| 隨便      | suíbiàn  | whatever / as you like |
| 反正      | fǎnzhèng | anyway                 |

The database supports:

* Search
* Sorting
* Tag filtering
* Source filtering
* Date filtering
* Word / Phrase filtering

A prominent:

`+ Add`

button allows quick entry.

---

# 15. Entry Details

Clicking an entry opens its complete information.

Example:

## 隨便

**Pinyin:** suíbiàn

**Meaning:** whatever / as you like

**Type:** Word

**Source:** Tutor

**Tags:** Casual Speech

**Example:** optional

**Notes:** optional

**Added:** July 31, 2026

Entries can be edited or deleted from this view.

---

# 16. Recently Added

The Chinese dashboard displays the **10 most recently added** words or phrases.

Example:

| Chinese | Pinyin   | Meaning                |
| ------- | -------- | ---------------------- |
| 隨便      | suíbiàn  | whatever / as you like |
| 反正      | fǎnzhèng | anyway                 |

Selecting an item opens its full database entry.

This provides frequent passive exposure to recently learned language.

---

# 17. Anki Integration Philosophy

Momentum does not attempt to recreate Anki.

Anki remains the dedicated tool for:

* Spaced repetition
* Memorization
* Review scheduling
* Flashcards
* Long-term retention

Momentum acts as the Chinese learning hub around it.

The relationship is:

**Momentum → organize and collect**

**Anki → memorize and review**

---

# 18. Open Anki

The Today page contains a prominent:

`Open Anki`

action.

This should make starting a short review session as frictionless as possible.

Afterward:

`✓ Anki Done`

can mark Chinese activity for the day.

---

# 19. Future Anki Possibilities

Potential future functionality may include:

## Export to Anki

A Momentum database entry could eventually be exported into an Anki-compatible format.

Example:

Front:

`隨便`

Back:

`suíbiàn — whatever / as you like`

This prevents entering the same language twice.

This is a future enhancement and is not required for the first version.

---

# 20. Progress Philosophy

Progress focuses on **consistency and exposure**, not artificial language proficiency scores.

Momentum should not attempt to calculate:

* Fluency percentage
* Mandarin level
* Vocabulary proficiency score
* Mastery percentage

Anki already handles detailed memorization progress.

Momentum focuses on whether Chinese is consistently present in daily life.

---

# 21. Progress Page

The Progress page contains four primary statistics:

* Current Streak
* Longest Streak
* Total Active Days
* Words & Phrases Saved

These should be clearly visible at the top.

---

# 22. Activity Heatmap

The main Progress visualization is a GitHub-style yearly activity heatmap.

Each square represents one day.

Example concept:

```text
      Aug  Sep  Oct  Nov  Dec  Jan

Mon    ■   □   ■   ■   □   ■
Tue    ■   ■   ■   □   □   ■
Wed    □   ■   ■   ■   ■   ■
Thu    ■   ■   □   ■   ■   ■
Fri    ■   ■   ■   ■   □   ■
```

An empty square means no recorded Chinese activity.

Increasing intensity represents more substantial Chinese activity.

The purpose is to make consistency visually satisfying.

---

# 23. Heatmap Interaction

Hovering over or selecting a day can show basic activity information.

Example:

## July 31

* Anki
* Podcast
* Added 2 phrases

No study-time calculation is required.

---

# 24. What Counts as an Active Day

Any meaningful Chinese activity can activate the day.

Examples:

* Anki
* Tutor session
* Music
* Podcast
* TV
* Movie
* YouTube/video
* Conversation
* Reading
* Other intentional Chinese exposure

Momentum should encourage exposure rather than enforce a rigid definition of studying.

---

# 25. Monthly Activity

The Progress page contains a simple current-month summary.

Example:

## July

**Active Days:** 21
**Anki Reviews:** 14
**Tutor Sessions:** 4
**Music / Podcast:** 11
**TV / Video:** 6
**New Words / Phrases:** 18

The exact activity categories can evolve as the app is used.

---

# 26. Month-to-Month Comparison

Momentum displays a simple comparison with the previous month.

Example:

> **21 active days this month ↑ from 16 last month**

This provides useful progress feedback without requiring complex analytics.

---

# 27. Activity Breakdown

Progress includes a simple visual breakdown of activity types.

Possible categories:

* Anki
* Tutor
* Music
* Podcast
* TV / Video
* Other

This helps reveal how Chinese is being incorporated into daily life.

It is informational rather than evaluative.

---

# 28. No Study-Time Tracking

Momentum does not require tracking minutes or hours spent studying Chinese.

Time can be optionally added to an activity in the future if useful, but it is not a core metric.

The system prioritizes:

**Did Chinese meaningfully appear in my day?**

over:

**Exactly how many minutes did I study?**

---

# 29. No Mastered Metric

Momentum does not classify words or phrases as mastered.

Anki is responsible for memorization and retention tracking.

The Momentum database is primarily a personal language collection and reference system.

---

# 30. Dashboard Design

The Chinese Dashboard should remain significantly lighter than Finance.

Suggested structure:

## Chinese

**🔥 Current Streak**

**📚 Words & Phrases Saved**

---

### Today

`[ Open Anki ]`

---

### Quick Log

`Tutor · Music · Podcast · TV/Video · Other`

---

### Recently Added

Show the 10 newest database entries.

---

The full activity heatmap belongs on the **Progress page**, not the main dashboard.

---

# 31. Visual Direction

Chinese remains part of the overall Momentum aesthetic.

It should feel:

* Calm
* Welcoming
* Lightweight
* Satisfying
* Easy to return to

The Asian café / cozy city aesthetic can be particularly visible in this pillar without sacrificing readability.

The interface should make opening Chinese feel inviting rather than like opening homework.

---

# 32. Friction Rule

Before adding any Chinese feature, ask:

> **Does this make practicing Chinese easier, or does it create another thing I have to maintain?**

If it creates unnecessary logging or maintenance, it probably should not be included.

Finance is intentionally data-heavy.

Chinese is intentionally lightweight.

Different Momentum pillars are allowed to behave completely differently.

---

# 33. XP

Eligible Chinese activities use the shared XP ledger implemented in `02 XP System.md`.

One Chinese XP event contributes to both:

* The global Momentum level
* The Chinese pillar level

It is never awarded twice.

Initial spontaneous activity values:

* Music / Other: 5 XP
* Anki / Podcast / TV & Video / Reading: 10 XP
* Conversation: 15 XP
* Tutor: 25 XP

The first spontaneous log of an activity type per day is XP-eligible. Repeated logs remain valid activity history but do not farm XP. Typed Planner completions use the Planner's configured reward and +25% planned bonus instead.

Adding or editing vocabulary, browsing entries, replaying pronunciation, and changing notes do not earn XP.

---

# 33A. Feedback

Logging an activity should feel satisfying without turning the pillar into an arcade.

Each successful quick action uses:

* A short restrained confirmation motion
* A subtle Chinese-specific two-tone sound when sounds are enabled
* Immediate count and streak updates
* An undo path from today's activity history

Feedback respects Momentum's global sound, animation, and reduced-motion settings.

---

# 34. Future Ideas

Possible future additions include:

* Export database entries to Anki
* Better automatic pinyin generation
* Database import/export
* Favorites
* Taiwan-specific collections
* Tutor-session notes
* Simple learning goals
* Pronunciation recording and playback comparison
* Optional speech-recognition feedback

These are intentionally **not required for Version 1**.

---

# 35. Design Status

* [x] Pillar purpose
* [x] Low-friction philosophy
* [x] Dashboard / Today
* [x] Quick activity logging
* [x] Typed Planner auto-completion
* [x] Activity weighting
* [x] Personal word/phrase database
* [x] Quick language entry
* [x] Optional sources
* [x] Tags
* [x] Recently added
* [x] Traditional Chinese default
* [x] Taiwanese pronunciation playback
* [x] Dedicated feedback sound and motion
* [x] Anki role
* [x] Progress metrics
* [x] Activity heatmap
* [x] Monthly activity
* [x] Month-to-month comparison
* [x] No required time tracking
* [x] No mastery metric
* [x] Shared global + Chinese pillar XP ledger
* [x] Daily XP anti-farming rule
* [x] Foundation implemented

**Chinese Learning Pillar Foundation: COMPLETE**
