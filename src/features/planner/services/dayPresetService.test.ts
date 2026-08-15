import "fake-indexeddb/auto";

import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { db } from "../../../database/db";
import { createPlannedActivity } from "../../activities/services/activityService";
import {
  applyDayPreset,
  listDayPresets,
  saveDayPreset,
  undoAppliedDayPreset,
} from "./dayPresetService";

beforeEach(async () => {
  await db.open();
  await db.transaction("rw", db.tables, async () => {
    for (const table of db.tables) await table.clear();
  });
});

afterAll(async () => {
  db.close();
  await db.delete();
});

describe("day preset service", () => {
  it("stores an ordered preset and applies normal planned activities", async () => {
    const id = await saveDayPreset({
      name: "Normal Work Day",
      items: [
        { id: "dinner", title: "Plan dinner", pillar: "cooking", difficulty: "easy", activityKind: "cooking:meal:dinner" },
        { id: "read", title: "Read 10 pages", pillar: "happiness", difficulty: "medium" },
      ],
    });
    const preset = (await listDayPresets()).find((item) => item.id === id)!;
    const result = await applyDayPreset(preset, "2026-08-17");
    const activities = await db.plannedActivities.orderBy("sortOrder").toArray();

    expect(result).toEqual({ createdIds: expect.any(Array), skippedCount: 0 });
    expect(activities.map((activity) => [activity.title, activity.pillar, activity.scheduledDate])).toEqual([
      ["Plan dinner", "cooking", "2026-08-17"],
      ["Read 10 pages", "happiness", "2026-08-17"],
    ]);
    expect(activities[0]).toMatchObject({ activityKind: "cooking:meal:dinner", dayPresetId: id });
  });

  it("skips matching activities and can undo the created batch", async () => {
    await createPlannedActivity({ title: "Plan dinner", scheduledDate: "2026-08-17", pillar: "cooking" });
    const id = await saveDayPreset({
      name: "Work Day",
      items: [
        { id: "dinner", title: "Plan dinner", pillar: "cooking", difficulty: "easy" },
        { id: "walk", title: "Walk", pillar: "athletics", difficulty: "easy" },
      ],
    });
    const preset = (await listDayPresets()).find((item) => item.id === id)!;
    const result = await applyDayPreset(preset, "2026-08-17");

    expect(result.skippedCount).toBe(1);
    expect(result.createdIds).toHaveLength(1);
    await undoAppliedDayPreset(result.createdIds);
    expect((await db.plannedActivities.toArray()).filter((activity) => !activity.deletedAt)).toHaveLength(1);
  });
});
