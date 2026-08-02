import "fake-indexeddb/auto";

import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { db } from "../../../database/db";
import { createPlannedActivity } from "../../activities/services/activityService";
import { getTotalXP } from "../../xp/XPService";
import { getChineseActivityKind } from "../activityCatalog";
import {
  logChineseActivity,
  restoreChineseActivity,
  softDeleteChineseActivity,
} from "./chineseActivityService";
import { createChineseEntry } from "./chineseEntryService";
import { getChineseHeatmapDays, getChineseStreaks } from "./chineseQueries";

beforeEach(async () => {
  await db.transaction("rw", db.tables, async () => {
    await Promise.all(db.tables.map((table) => table.clear()));
  });
});

afterAll(async () => {
  db.close();
  await db.delete();
});

describe("Chinese services", () => {
  it("creates a Traditional Chinese entry with generated editable pinyin", async () => {
    const id = await createChineseEntry({
      traditional: "隨便",
      meaning: "whatever / as you like",
      tags: ["Taiwan", "Taiwan", " Casual Speech "],
    });
    const entry = await db.chineseEntries.get(id);

    expect(entry).toMatchObject({
      traditional: "隨便",
      meaning: "whatever / as you like",
      entryType: "word",
      tags: ["Taiwan", "Casual Speech"],
    });
    expect(entry?.pinyin).toContain("suí");
    expect(await db.chineseActivities.count()).toBe(0);
    expect(await getTotalXP()).toBe(0);
  });

  it("awards spontaneous XP once per activity type and day", async () => {
    const first = await logChineseActivity("podcast", "2026-08-02");
    const second = await logChineseActivity("podcast", "2026-08-02");

    expect(first).toMatchObject({ xpAwarded: 10, completedPlan: false });
    expect(second).toMatchObject({ xpAwarded: 0, completedPlan: false });
    expect(await db.chineseActivities.count()).toBe(2);
    expect(await db.xpEvents.count()).toBe(1);
    expect(await getTotalXP()).toBe(10);
  });

  it("completes a typed matching plan and adopts its XP event", async () => {
    const plannedActivityId = await createPlannedActivity({
      title: "Review today’s cards",
      scheduledDate: "2026-08-02",
      pillar: "chinese",
      activityKind: getChineseActivityKind("anki"),
      difficulty: "medium",
    });

    const result = await logChineseActivity("anki", "2026-08-02");
    const plan = await db.plannedActivities.get(plannedActivityId);
    const chineseActivity = await db.chineseActivities.get(
      result.chineseActivityId
    );

    expect(result).toMatchObject({
      plannedActivityId,
      completedPlan: true,
      xpAwarded: 13,
    });
    expect(plan?.completed).toBe(true);
    expect(chineseActivity?.activityEventId).toBeTruthy();
    expect(chineseActivity?.xpEventId).toBeTruthy();
    expect(await db.xpEvents.count()).toBe(1);
    expect(await getTotalXP()).toBe(13);
  });

  it("voids and restores spontaneous XP through activity undo", async () => {
    const logged = await logChineseActivity("music", "2026-08-02");

    await softDeleteChineseActivity(logged.chineseActivityId);
    expect(await getTotalXP()).toBe(0);

    await restoreChineseActivity(logged.chineseActivityId);
    expect(await getTotalXP()).toBe(5);
    expect(await db.xpEvents.count()).toBe(1);
  });

  it("derives explicit current and longest streaks", () => {
    const activities = [
      { type: "anki" as const, date: "2026-07-29", intensity: "normal" as const, createdAt: "1" },
      { type: "music" as const, date: "2026-07-30", intensity: "light" as const, createdAt: "2" },
      { type: "tutor" as const, date: "2026-07-31", intensity: "strong" as const, createdAt: "3" },
      { type: "podcast" as const, date: "2026-08-01", intensity: "normal" as const, createdAt: "4" },
    ];

    expect(getChineseStreaks(activities, new Date("2026-08-02T12:00:00")))
      .toEqual({ current: 4, longest: 4, totalActiveDays: 4 });
  });

  it("aligns the 52-week heatmap to Sunday-first weeks", () => {
    const days = getChineseHeatmapDays([], new Date(2026, 7, 2, 12));

    expect(days).toHaveLength(364);
    expect(days[0].date.getDay()).toBe(0);
    expect(days.at(-1)?.date.getDay()).toBe(6);
  });
});
