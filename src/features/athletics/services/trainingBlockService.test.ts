import "fake-indexeddb/auto";

import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { db } from "../../../database/db";
import { getActivityStatus } from "../../activities/services/activityLifecycle";
import { startPlannedTrainingSession } from "./athleticsService";
import { getEffectivePlannedExercises } from "./septemberTrainingBlock";
import {
  completeTrainingSession,
  getTrainingSessionDisplayStatus,
  installSeptember2026TrainingBlock,
  reopenTrainingSession,
  setSaturdayTrainingChoice,
  updateTrainingBlockTemplate,
} from "./trainingBlockService";

beforeEach(async () => {
  await db.transaction("rw", db.tables, async () => { await Promise.all(db.tables.map((table) => table.clear())); });
});

afterAll(async () => { db.close(); await db.delete(); });

describe("September Athletics training block", () => {
  it("installs four complete weeks and linked tasks exactly once", async () => {
    const first = await installSeptember2026TrainingBlock();
    const second = await installSeptember2026TrainingBlock();
    const sessions = await db.athleticsPlannedSessions.toArray();
    const tasks = await db.plannedActivities.toArray();

    expect(first).toMatchObject({ installed: true, sessionCount: 28 });
    expect(second).toMatchObject({ installed: false, sessionCount: 28 });
    expect(sessions).toHaveLength(28);
    expect(tasks).toHaveLength(20);
    expect(sessions[0]).toMatchObject({ date: "2026-08-31", weekNumber: 1, name: "Sand Volleyball" });
    expect(sessions.at(-1)).toMatchObject({ date: "2026-09-27", weekNumber: 4, name: "Full Rest" });
    expect(tasks.every((item) => item.pillar === "athletics" && item.activityKind?.startsWith("athletics-plan-session:"))).toBe(true);
  });

  it("turns optional Saturday volleyball on and reduces the preceding Friday", async () => {
    await installSeptember2026TrainingBlock();
    const saturday = (await db.athleticsPlannedSessions.where("date").equals("2026-09-12").first())!;
    const friday = (await db.athleticsPlannedSessions.where("date").equals("2026-09-11").first())!;
    expect(saturday.kind).toBe("recovery"); expect(friday.reducedVolume).toBe(false);

    await setSaturdayTrainingChoice(saturday.id!, "volleyball");
    expect(await db.athleticsPlannedSessions.get(saturday.id!)).toMatchObject({ kind: "volleyball", saturdayChoice: "volleyball" });
    expect((await db.athleticsPlannedSessions.get(friday.id!))?.reducedVolume).toBe(true);
    const updatedSaturday = (await db.athleticsPlannedSessions.get(saturday.id!))!;
    const task = await db.plannedActivities.get(updatedSaturday.plannedActivityId!);
    expect(task).toMatchObject({ title: "Sand Volleyball", scheduledDate: "2026-09-12", status: "planned" });

    await setSaturdayTrainingChoice(saturday.id!, "recovery");
    expect((await db.athleticsPlannedSessions.get(friday.id!))?.reducedVolume).toBe(false);
    expect(getActivityStatus((await db.plannedActivities.get(task!.id!))!)).toBe("cancelled");
  });

  it("starts a prescribed workout with category-aware tracking and reduced week-four volume", async () => {
    await installSeptember2026TrainingBlock();
    const lowerA = (await db.athleticsPlannedSessions.where("date").equals("2026-09-23").first())!;
    const effective = getEffectivePlannedExercises(lowerA.exercises, Boolean(lowerA.reducedVolume));
    expect(effective.find((item) => item.name === "Approach Jumps")?.prescribedSets).toBe(3);
    expect(effective.find((item) => item.name === "Squat")?.prescribedSets).toBe(2);

    const workoutId = await startPlannedTrainingSession(lowerA.id!);
    const workout = (await db.athleticsWorkouts.get(workoutId))!;
    expect(workout.plannedActivityId).toBe(lowerA.plannedActivityId);
    expect(workout.exercises.find((item) => item.name === "Approach Jumps")).toMatchObject({ category: "explosive", tracking: "completion", targetLabel: "3 × 3" });
    expect(workout.exercises.find((item) => item.name === "Squat")?.sets).toHaveLength(2);
  });

  it("keeps overdue sessions visibly missed until the user decides", async () => {
    await installSeptember2026TrainingBlock();
    const session = (await db.athleticsPlannedSessions.where("date").equals("2026-09-01").first())!;
    const activities = await db.plannedActivities.toArray();
    expect(getTrainingSessionDisplayStatus(session, activities, "2026-09-02")).toBe("missed");
  });

  it("checks off a planned session without requiring an individual workout log", async () => {
    await installSeptember2026TrainingBlock();
    const session = (await db.athleticsPlannedSessions.where("date").equals("2026-09-01").first())!;
    await completeTrainingSession(session.id!);
    expect(getActivityStatus((await db.plannedActivities.get(session.plannedActivityId!))!)).toBe("completed");
    expect(await db.athleticsWorkouts.count()).toBe(0);
    expect(await db.xpEvents.count()).toBe(1);

    await reopenTrainingSession(session.id!);
    expect(getActivityStatus((await db.plannedActivities.get(session.plannedActivityId!))!)).toBe("planned");
  });

  it("updates a block template only across remaining sessions", async () => {
    await installSeptember2026TrainingBlock();
    const upperSessions = (await db.athleticsPlannedSessions.toArray()).filter((item) => item.name === "Upper A");
    await completeTrainingSession(upperSessions[0].id!);
    const exercises = upperSessions[0].exercises.slice(0, 2).map((item, index) => ({ ...item, name: index ? "Neutral-Grip Pulldown" : "Incline Machine Press", alternatives: undefined }));
    const updated = await updateTrainingBlockTemplate(upperSessions[0].blockId, "Upper A", { focus: "Revised upper session", exercises });

    expect(updated).toBe(3);
    expect((await db.athleticsPlannedSessions.get(upperSessions[0].id!))?.focus).toBe("Chest + Back Hypertrophy");
    expect((await db.athleticsPlannedSessions.get(upperSessions[1].id!))?.focus).toBe("Revised upper session");
    expect((await db.athleticsPlannedSessions.get(upperSessions[1].id!))?.exercises.map((item) => item.name)).toEqual(["Incline Machine Press", "Neutral-Grip Pulldown"]);
    expect((await db.plannedActivities.get(upperSessions[1].plannedActivityId!))?.title).toBe("Upper A · Revised upper session");
  });
});
