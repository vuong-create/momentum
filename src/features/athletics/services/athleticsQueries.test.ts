import { describe, expect, it } from "vitest";

import type { AthleticsWorkout, PlannedActivity } from "../../../database/db";
import {
  getAthleticsHeatmapDays,
  getExerciseBests,
  getMonthSummary,
  getWeeklyConsistency,
} from "./athleticsQueries";

function workout(
  id: number,
  date: string,
  overrides: Partial<AthleticsWorkout> = {}
): AthleticsWorkout {
  return {
    id,
    kind: "gym",
    name: "Push",
    date,
    status: "completed",
    exercises: [{
      id: `exercise-${id}`,
      name: "Press",
      sets: [{ id: `set-${id}`, weight: 60 + id * 5, reps: 8, completed: true }],
    }],
    startedAt: `${date}T12:00:00.000Z`,
    updatedAt: `${date}T13:00:00.000Z`,
    completedAt: `${date}T13:00:00.000Z`,
    personalRecords: [],
    ...overrides,
  };
}

function plan(id: number, date: string, completed = false): PlannedActivity {
  return {
    id,
    title: "Push",
    completed,
    status: completed ? "completed" : "planned",
    date: `${date}T08:00:00.000Z`,
    day: "Monday",
    scheduledDate: date,
    pillar: "athletics",
    xpReward: 10,
    difficulty: "medium",
  };
}

describe("athletics queries", () => {
  it("treats Sunday as the start of weekly consistency", () => {
    const activities = [
      plan(1, "2026-08-02", true),
      plan(2, "2026-08-08"),
      plan(3, "2026-08-09", true),
    ];

    expect(getWeeklyConsistency([], activities, new Date(2026, 7, 3))).toEqual({
      planned: 2,
      completed: 1,
    });
  });

  it("derives monthly counts and exercise bests from completed sessions", () => {
    const workouts = [
      workout(1, "2026-08-02"),
      workout(2, "2026-08-05", { personalRecords: [{ exerciseName: "Press", type: "weight", weight: 70, reps: 8 }] }),
      workout(3, "2026-08-06", { kind: "volleyball", name: "Volleyball · Practice", volleyballType: "practice", exercises: [] }),
      workout(4, "2026-07-29"),
    ];

    expect(getMonthSummary(workouts, new Date(2026, 7, 10))).toEqual({
      workouts: 2,
      volleyball: 1,
      sets: 2,
      prs: 1,
    });
    expect(getExerciseBests(workouts)[0]).toMatchObject({
      name: "Press",
      weight: 80,
      reps: 8,
      sessions: 3,
    });
  });

  it("builds a Sunday-first 52-week heatmap with automatic intensity", () => {
    const days = getAthleticsHeatmapDays(
      [workout(1, "2026-08-03")],
      new Date(2026, 7, 3)
    );

    expect(days).toHaveLength(364);
    expect(days[0].date.getDay()).toBe(0);
    expect(days.find((day) => day.dateKey === "2026-08-03")).toMatchObject({
      count: 1,
      level: 1,
    });
  });
});
