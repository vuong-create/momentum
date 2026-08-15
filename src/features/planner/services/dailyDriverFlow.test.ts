import "fake-indexeddb/auto";

import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { db } from "../../../database/db";
import {
  completePlannedActivity,
  reopenPlannedActivity,
} from "../../activities/services/activityService";
import { auditMomentumData } from "../../settings/services/dataHealthService";
import {
  applyDayPreset,
  saveDayPreset,
  undoAppliedDayPreset,
} from "./dayPresetService";

async function clearDatabase() {
  await db.open();
  await db.transaction("rw", db.tables, async () => {
    for (const table of db.tables) await table.clear();
  });
}

beforeEach(clearDatabase);

afterAll(async () => {
  db.close();
  await db.delete();
});

describe("daily-driver Planner flow", () => {
  it("keeps preset, completion, undo, XP, and data health consistent", async () => {
    const presetId = await saveDayPreset({
      name: "Normal Work Day",
      items: [
        { id: "read", title: "Read ten pages", pillar: "happiness", difficulty: "easy" },
        { id: "walk", title: "Go on a walk", pillar: "athletics", difficulty: "medium" },
      ],
    });
    const preset = await db.dayPresets.get(presetId);
    expect(preset).toBeTruthy();

    const applied = await applyDayPreset(preset!, "2026-08-17");
    expect(applied).toEqual({ createdIds: expect.any(Array), skippedCount: 0 });
    expect(applied.createdIds).toHaveLength(2);

    await completePlannedActivity(applied.createdIds[0]);
    expect(await db.activityEvents.count()).toBe(1);
    expect(await db.xpEvents.filter((event) => !event.voidedAt).count()).toBe(1);

    await reopenPlannedActivity(applied.createdIds[0]);
    expect(await db.xpEvents.filter((event) => !event.voidedAt).count()).toBe(0);

    await undoAppliedDayPreset(applied.createdIds);
    const activities = await db.plannedActivities.bulkGet(applied.createdIds);
    expect(activities.every((activity) => Boolean(activity?.deletedAt))).toBe(true);

    const health = await auditMomentumData(db);
    expect(health.status).toBe("healthy");
    expect(health.backupReady).toBe(true);
  });
});
