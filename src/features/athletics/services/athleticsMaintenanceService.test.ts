import "fake-indexeddb/auto";

import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { db } from "../../../database/db";
import { getActivityStatus } from "../../activities/services/activityLifecycle";
import { cleanupExpiredAthleticsPlannerActivities } from "./athleticsMaintenanceService";
import { completeTrainingSession, installSeptember2026TrainingBlock } from "./trainingBlockService";

beforeEach(async () => {
  await db.transaction("rw", db.tables, async () => { await Promise.all(db.tables.map((table) => table.clear())); });
});

afterAll(async () => { db.close(); await db.delete(); });

describe("Athletics data maintenance", () => {
  it("keeps workouts deliberately moved beyond the expired block", async () => {
    await installSeptember2026TrainingBlock();
    const session = (await db.athleticsPlannedSessions.toArray()).find((item) => item.plannedActivityId)!;
    await db.plannedActivities.update(session.plannedActivityId!, { scheduledDate: "2026-11-03", rescheduleCount: 1 });
    await cleanupExpiredAthleticsPlannerActivities(new Date("2026-11-02T12:00:00"));
    expect(getActivityStatus((await db.plannedActivities.get(session.plannedActivityId!))!)).toBe("planned");
  });
  it("removes unfinished expired sessions from Planner without deleting history", async () => {
    await installSeptember2026TrainingBlock();
    const sessions = await db.athleticsPlannedSessions.toArray();
    await completeTrainingSession(sessions.find((session) => session.kind !== "recovery")!.id!);

    const cancelled = await cleanupExpiredAthleticsPlannerActivities(new Date("2026-11-02T12:00:00"));
    const activities = await db.plannedActivities.toArray();
    const completed = activities.filter((activity) => getActivityStatus(activity) === "completed");
    const unfinished = activities.filter((activity) => getActivityStatus(activity) !== "completed");
    const block = await db.athleticsTrainingBlocks.where("key").equals("september-2026-training-block").first();

    expect(cancelled).toBe(19);
    expect(completed).toHaveLength(1);
    expect(unfinished.every((activity) => getActivityStatus(activity) === "cancelled")).toBe(true);
    expect(await db.athleticsPlannedSessions.count()).toBe(28);
    expect(block?.active).toBe(false);
    expect(await cleanupExpiredAthleticsPlannerActivities(new Date("2026-11-02T12:00:00"))).toBe(0);
  });
});
