import "fake-indexeddb/auto";

import {
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import { db } from "../../../database/db";
import { getTotalXP } from "../../xp/XPService";

import {
  completePlannedActivity,
  createPlannedActivity,
  getPlannedActivity,
  reopenPlannedActivity,
  softDeletePlannedActivity,
} from "./activityService";

beforeEach(async () => {
  await db.transaction("rw", db.tables, async () => {
    await Promise.all(db.tables.map((table) => table.clear()));
  });
});

afterAll(async () => {
  db.close();
  await db.delete();
});

describe("activity service", () => {
  it("creates one completion event and one XP event", async () => {
    const activityId = await createPlannedActivity({
      title: "Read",
      scheduledDate: "2026-08-01",
    });

    const first = await completePlannedActivity(activityId);
    const second = await completePlannedActivity(activityId);

    expect(first.xpAwarded).toBe(13);
    expect(second.wasAlreadyCompleted).toBe(true);
    expect(await db.activityEvents.count()).toBe(1);
    expect(await db.xpEvents.count()).toBe(1);
    expect(await getTotalXP()).toBe(13);
  });

  it("voids and restores the same events when completion is corrected", async () => {
    const activityId = await createPlannedActivity({
      title: "Workout",
      scheduledDate: "2026-08-01",
      pillar: "athletics",
      difficulty: "hard",
    });

    await completePlannedActivity(activityId);
    await reopenPlannedActivity(activityId);

    expect(await getTotalXP()).toBe(0);

    await completePlannedActivity(activityId);

    expect(await db.activityEvents.count()).toBe(1);
    expect(await db.xpEvents.count()).toBe(1);
    expect(await getTotalXP()).toBe(31);
  });

  it("adopts a legacy XP record instead of awarding a duplicate", async () => {
    const activityId = await createPlannedActivity({
      title: "Meal prep",
      scheduledDate: "2026-08-01",
      pillar: "cooking",
    });

    await db.xpEvents.add({
      amount: 10,
      source: `activity:${activityId}`,
      date: "2026-08-01T12:00:00.000Z",
    });

    const completion = await completePlannedActivity(activityId);
    const xpEvent = await db.xpEvents.toCollection().first();

    expect(completion.xpAwarded).toBe(0);
    expect(await db.xpEvents.count()).toBe(1);
    expect(xpEvent?.dedupeKey).toBe(
      `planned-activity:${activityId}:completion`
    );
    expect(await getTotalXP()).toBe(13);
  });

  it("voids legacy XP when an old completed activity is reopened", async () => {
    const activityId = await createPlannedActivity({
      title: "Laundry",
      scheduledDate: "2026-08-01",
    });

    await db.plannedActivities.update(activityId, {
      completed: true,
      status: "completed",
    });
    await db.xpEvents.add({
      amount: 10,
      source: `activity:${activityId}`,
      date: "2026-08-01T12:00:00.000Z",
    });

    await reopenPlannedActivity(activityId);

    expect(await getTotalXP()).toBe(0);

    await completePlannedActivity(activityId);

    expect(await db.xpEvents.count()).toBe(1);
    expect(await getTotalXP()).toBe(13);
  });

  it("soft deletes without erasing legitimate event history", async () => {
    const activityId = await createPlannedActivity({
      title: "Chinese tutor",
      scheduledDate: "2026-08-01",
      pillar: "chinese",
    });

    await completePlannedActivity(activityId);
    await softDeletePlannedActivity(activityId);

    const activity = await getPlannedActivity(activityId);

    expect(activity?.deletedAt).toBeTruthy();
    expect(await db.activityEvents.count()).toBe(1);
    expect(await db.xpEvents.count()).toBe(1);
  });
});
