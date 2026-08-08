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
  dismissPlannedActivity,
  duplicatePlannedActivity,
  getPlannedActivity,
  movePlannedActivity,
  movePlannedActivities,
  reopenPlannedActivity,
  restoreDismissedActivity,
  restorePlannedActivitySchedule,
  restoreSoftDeletedActivity,
  softDeletePlannedActivity,
  setPlannedActivityOrder,
  unschedulePlannedActivity,
  updateActivityDetails,
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
  it("creates and schedules an activity held in an unscheduled week", async () => {
    const activityId = await createPlannedActivity({
      title: "Plan August goals",
      planningWeekStart: "2026-08-02",
    });

    expect(await getPlannedActivity(activityId)).toMatchObject({
      day: "Unscheduled",
      planningWeekStart: "2026-08-02",
      scheduledDate: undefined,
    });

    await movePlannedActivity(activityId, "2026-08-05");

    const scheduled = await getPlannedActivity(activityId);
    expect(scheduled).toMatchObject({
      day: "Wednesday",
      scheduledDate: "2026-08-05",
    });
    expect(scheduled?.planningWeekStart).toBeUndefined();
  });

  it("unschedules an activity without retaining its previous date", async () => {
    const activityId = await createPlannedActivity({
      title: "Practice serves",
      scheduledDate: "2026-08-05",
    });

    await unschedulePlannedActivity(activityId, "2026-08-02", 42);

    const unscheduled = await getPlannedActivity(activityId);
    expect(unscheduled).toMatchObject({
      day: "Unscheduled",
      planningWeekStart: "2026-08-02",
      sortOrder: 42,
    });
    expect(unscheduled?.scheduledDate).toBeUndefined();
  });

  it("duplicates into a requested date or unscheduled week", async () => {
    const sourceId = await createPlannedActivity({
      title: "Chinese review",
      scheduledDate: "2026-08-03",
      pillar: "chinese",
      important: true,
    });

    const datedCopyId = await duplicatePlannedActivity(sourceId, {
      scheduledDate: "2026-08-06",
    });
    const unscheduledCopyId = await duplicatePlannedActivity(sourceId, {
      planningWeekStart: "2026-08-02",
    });

    expect(await getPlannedActivity(datedCopyId)).toMatchObject({
      title: "Chinese review",
      scheduledDate: "2026-08-06",
      pillar: "chinese",
      important: true,
    });
    expect(await getPlannedActivity(unscheduledCopyId)).toMatchObject({
      scheduledDate: undefined,
      planningWeekStart: "2026-08-02",
      day: "Unscheduled",
    });
  });

  it("persists manual order and bulk day moves", async () => {
    const firstId = await createPlannedActivity({ title: "First", scheduledDate: "2026-08-03" });
    const secondId = await createPlannedActivity({ title: "Second", scheduledDate: "2026-08-03" });

    await setPlannedActivityOrder([secondId, firstId]);
    const second = await getPlannedActivity(secondId);
    const first = await getPlannedActivity(firstId);
    expect(second!.sortOrder!).toBeLessThan(first!.sortOrder!);

    await movePlannedActivities([secondId, firstId], "2026-08-07");
    const moved = await db.plannedActivities.bulkGet([secondId, firstId]);
    expect(moved.map((activity) => activity?.scheduledDate)).toEqual([
      "2026-08-07",
      "2026-08-07",
    ]);
  });

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
    expect(await db.xpEvents.toCollection().first()).toMatchObject({
      scope: "pillar",
      pillar: "core",
      actionType: "planned-activity-completed",
      sourceType: "planned-activity",
      sourceId: String(activityId),
      description: "Read",
    });
  });

  it("updates optional details on the original activity", async () => {
    const activityId = await createPlannedActivity({
      title: "  Read  ",
      scheduledDate: "2026-08-01",
    });

    await updateActivityDetails(activityId, {
      title: "  Review finances  ",
      scheduledDate: "2026-08-03",
      scheduledTime: "18:30",
      pillar: "finance",
      important: true,
      notes: "  Reconcile July  ",
    });

    const activity = await getPlannedActivity(activityId);

    expect(activity?.id).toBe(activityId);
    expect(activity).toMatchObject({
      title: "Review finances",
      scheduledDate: "2026-08-03",
      scheduledTime: "18:30",
      day: "Monday",
      pillar: "finance",
      important: true,
      notes: "Reconcile July",
    });
    expect(await db.plannedActivities.count()).toBe(1);
  });

  it("moves and restores an activity without changing its identity", async () => {
    const activityId = await createPlannedActivity({
      title: "Cook dinner",
      scheduledDate: "2026-08-01",
      pillar: "cooking",
    });

    const original = await getPlannedActivity(activityId);

    await movePlannedActivity(activityId, "2026-08-05", 400);
    await restorePlannedActivitySchedule(original!);

    const restored = await getPlannedActivity(activityId);

    expect(restored?.id).toBe(activityId);
    expect(restored?.scheduledDate).toBe("2026-08-01");
    expect(restored?.day).toBe("Saturday");
    expect(restored?.sortOrder).toBe(original?.sortOrder);
    expect(restored?.rescheduleCount).toBe(0);
    expect(await db.plannedActivities.count()).toBe(1);
  });

  it("preserves the first date and counts each real reschedule", async () => {
    const activityId = await createPlannedActivity({
      title: "Carry the task",
      scheduledDate: "2026-08-01",
    });

    await movePlannedActivity(activityId, "2026-08-03");
    await movePlannedActivity(activityId, "2026-08-05");

    expect(await getPlannedActivity(activityId)).toMatchObject({
      scheduledDate: "2026-08-05",
      originalScheduledDate: "2026-08-01",
      rescheduleCount: 2,
    });
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

  it("restores dismissed activities without creating a duplicate", async () => {
    const activityId = await createPlannedActivity({
      title: "Review notes",
      scheduledDate: "2026-08-01",
    });

    await dismissPlannedActivity(activityId);
    await restoreDismissedActivity(activityId);

    const activity = await getPlannedActivity(activityId);

    expect(activity?.status).toBe("planned");
    expect(activity?.dismissedAt).toBeUndefined();
    expect(await db.plannedActivities.count()).toBe(1);
  });

  it("restores a soft-deleted activity with its completion history intact", async () => {
    const activityId = await createPlannedActivity({
      title: "Practice serves",
      scheduledDate: "2026-08-01",
      pillar: "athletics",
    });

    await completePlannedActivity(activityId);
    await softDeletePlannedActivity(activityId);
    await restoreSoftDeletedActivity(activityId);

    const activity = await getPlannedActivity(activityId);

    expect(activity?.deletedAt).toBeUndefined();
    expect(activity?.status).toBe("completed");
    expect(await db.activityEvents.count()).toBe(1);
    expect(await db.xpEvents.count()).toBe(1);
  });

  it("voids completion XP before dismissing a completed activity", async () => {
    const activityId = await createPlannedActivity({
      title: "Read a chapter",
      scheduledDate: "2026-08-01",
    });

    await completePlannedActivity(activityId);
    await dismissPlannedActivity(activityId);

    const activity = await getPlannedActivity(activityId);

    expect(activity?.status).toBe("dismissed");
    expect(await getTotalXP()).toBe(0);
  });
});
