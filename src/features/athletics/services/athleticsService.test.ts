import "fake-indexeddb/auto";

import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { db } from "../../../database/db";
import { getXPBreakdown } from "../../xp/XPService";
import {
  completeAthleticsWorkout,
  detectPersonalRecords,
  ensureStarterTemplates,
  logVolleyballSession,
  restoreAthleticsWorkout,
  scheduleAthleticsTemplate,
  softDeleteAthleticsWorkout,
  startTemplateWorkout,
  setWorkoutExerciseCompletion,
  updateWorkoutSet,
  visibleAthleticsTemplates,
} from "./athleticsService";

beforeEach(async () => {
  await db.transaction("rw", db.tables, async () => {
    await Promise.all(db.tables.map((table) => table.clear()));
  });
});

afterAll(async () => {
  db.close();
  await db.delete();
});

describe("athletics service", () => {
  it("seeds editable starter templates only once", async () => {
    await Promise.all([ensureStarterTemplates(), ensureStarterTemplates()]);

    const templates = visibleAthleticsTemplates(await db.athleticsTemplates.toArray());
    expect(templates.map((template) => template.name)).toEqual(["Push", "Pull", "Legs"]);
    expect(templates[0].exercises.length).toBeGreaterThan(0);

    await db.athleticsTemplates.update(templates[0].id!, {
      deletedAt: new Date().toISOString(),
    });
    await ensureStarterTemplates();
    expect(await db.athleticsTemplates.count()).toBe(3);
  });

  it("starts a template with values remembered from the previous workout", async () => {
    await ensureStarterTemplates();
    const push = (await db.athleticsTemplates.where("name").equals("Push").first())!;
    const previousId = await db.athleticsWorkouts.add({
      kind: "gym",
      name: "Push",
      date: "2026-07-27",
      status: "completed",
      exercises: [{
        id: "previous-exercise",
        name: "Incline DB Press",
        sets: [{ id: "previous-set", weight: 65, reps: 9, completed: true }],
      }],
      startedAt: "2026-07-27T12:00:00.000Z",
      updatedAt: "2026-07-27T13:00:00.000Z",
      completedAt: "2026-07-27T13:00:00.000Z",
      personalRecords: [],
    });
    expect(previousId).toBeTruthy();

    const workoutId = await startTemplateWorkout(push.id!, "2026-08-03");
    const workout = await db.athleticsWorkouts.get(workoutId);

    expect(workout?.status).toBe("active");
    expect(workout?.exercises[0].sets[0]).toMatchObject({ weight: 65, reps: 9, completed: false });
  });

  it("completes a spontaneous workout and awards one Athletics XP event", async () => {
    await ensureStarterTemplates();
    const push = (await db.athleticsTemplates.where("name").equals("Push").first())!;
    const workoutId = await startTemplateWorkout(push.id!, "2026-08-03");
    const workout = (await db.athleticsWorkouts.get(workoutId))!;
    const firstExercise = workout.exercises[0];
    const firstSet = firstExercise.sets[0];

    await updateWorkoutSet(workoutId, firstExercise.id, firstSet.id, {
      weight: 65,
      reps: 8,
      completed: true,
    });
    const completion = await completeAthleticsWorkout(workoutId);
    const summary = getXPBreakdown(await db.xpEvents.toArray());

    expect(completion.xpAwarded).toBe(20);
    expect((await db.athleticsWorkouts.get(workoutId))?.status).toBe("completed");
    expect(summary.totalXP).toBe(20);
    expect(summary.contributions.find(({ pillar }) => pillar === "athletics")?.xp).toBe(20);
  });

  it("marks every set in an exercise complete or reopened together", async () => {
    await ensureStarterTemplates();
    const push = (await db.athleticsTemplates.where("name").equals("Push").first())!;
    const workoutId = await startTemplateWorkout(push.id!, "2026-08-03");
    const exerciseId = (await db.athleticsWorkouts.get(workoutId))!.exercises[0].id;

    await setWorkoutExerciseCompletion(workoutId, exerciseId, true);
    expect((await db.athleticsWorkouts.get(workoutId))!.exercises[0].sets.every((set) => set.completed)).toBe(true);

    await setWorkoutExerciseCompletion(workoutId, exerciseId, false);
    expect((await db.athleticsWorkouts.get(workoutId))!.exercises[0].sets.every((set) => !set.completed && !set.completedAt)).toBe(true);
  });

  it("completes the matching Planner activity instead of creating duplicate XP", async () => {
    await ensureStarterTemplates();
    const pull = (await db.athleticsTemplates.where("name").equals("Pull").first())!;
    const plannedId = await scheduleAthleticsTemplate(pull.id!, "2026-08-04");
    const workoutId = await startTemplateWorkout(pull.id!, "2026-08-04");
    const workout = (await db.athleticsWorkouts.get(workoutId))!;

    await updateWorkoutSet(workoutId, workout.exercises[0].id, workout.exercises[0].sets[0].id, {
      weight: 100,
      reps: 6,
      completed: true,
    });
    const completion = await completeAthleticsWorkout(workoutId);

    expect(completion.plannedActivityId).toBe(plannedId);
    expect(await db.xpEvents.count()).toBe(1);
    expect(await db.activityEvents.count()).toBe(1);
    expect(await db.plannedActivities.get(plannedId)).toMatchObject({ status: "completed", completed: true });
  });

  it("detects stronger weight and rep performances without counting a first baseline", () => {
    const previous = {
      id: 1,
      kind: "gym" as const,
      name: "Push",
      date: "2026-07-27",
      status: "completed" as const,
      exercises: [{ id: "a", name: "Press", sets: [{ id: "a1", weight: 65, reps: 7, completed: true }] }],
      startedAt: "2026-07-27T12:00:00.000Z",
      updatedAt: "2026-07-27T13:00:00.000Z",
      completedAt: "2026-07-27T13:00:00.000Z",
      personalRecords: [],
    };
    const current = {
      ...previous,
      id: 2,
      date: "2026-08-03",
      exercises: [{ id: "b", name: "Press", sets: [
        { id: "b1", weight: 65, reps: 9, completed: true },
        { id: "b2", weight: 70, reps: 6, completed: true },
      ] }],
    };

    expect(detectPersonalRecords(current, [previous])).toEqual([
      expect.objectContaining({ type: "reps", weight: 65, reps: 9 }),
      expect.objectContaining({ type: "weight", weight: 70, reps: 6 }),
    ]);
    expect(detectPersonalRecords(previous, [])).toEqual([]);
  });

  it("logs volleyball instantly and reverses or restores its XP with the session", async () => {
    const completion = await logVolleyballSession("practice", "2026-08-03");
    expect(completion.xpAwarded).toBe(20);
    expect((await db.athleticsWorkouts.get(completion.workoutId))?.kind).toBe("volleyball");

    await softDeleteAthleticsWorkout(completion.workoutId);
    expect(getXPBreakdown(await db.xpEvents.toArray()).totalXP).toBe(0);

    await restoreAthleticsWorkout(completion.workoutId);
    expect(getXPBreakdown(await db.xpEvents.toArray()).totalXP).toBe(20);
    expect(await db.xpEvents.count()).toBe(1);
  });
});
