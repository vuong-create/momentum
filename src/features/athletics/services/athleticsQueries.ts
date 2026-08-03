import type {
  AthleticsPersonalRecord,
  AthleticsWorkout,
  PlannedActivity,
} from "../../../database/db";
import {
  getActivityStatus,
  isActivityVisible,
} from "../../activities/services/activityLifecycle";
import { toDateKey } from "./athleticsService";

function atLocalMidnight(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function getWeekRange(now: Date) {
  const start = atLocalMidnight(now);
  start.setDate(start.getDate() - start.getDay());
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return { start, end, startKey: toDateKey(start), endKey: toDateKey(end) };
}

export function getWeeklyConsistency(
  workouts: AthleticsWorkout[],
  activities: PlannedActivity[],
  now: Date
) {
  const { startKey, endKey } = getWeekRange(now);
  const plans = activities.filter(
    (activity) =>
      activity.pillar === "athletics" &&
      Boolean(activity.scheduledDate) &&
      activity.scheduledDate! >= startKey &&
      activity.scheduledDate! <= endKey &&
      isActivityVisible(activity)
  );
  const completedPlanIds = new Set(
    workouts
      .filter((workout) => !workout.deletedAt && workout.status === "completed")
      .flatMap((workout) => workout.plannedActivityId ? [workout.plannedActivityId] : [])
  );

  return {
    planned: plans.length,
    completed: plans.filter(
      (activity) =>
        getActivityStatus(activity) === "completed" ||
        (activity.id ? completedPlanIds.has(activity.id) : false)
    ).length,
  };
}

export function getMonthSummary(workouts: AthleticsWorkout[], now: Date) {
  const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const month = workouts.filter(
    (workout) =>
      !workout.deletedAt &&
      workout.status === "completed" &&
      workout.date.startsWith(prefix)
  );

  return {
    workouts: month.filter((workout) => workout.kind === "gym").length,
    volleyball: month.filter((workout) => workout.kind === "volleyball").length,
    sets: month.reduce(
      (total, workout) =>
        total + workout.exercises.reduce(
          (exerciseTotal, exercise) =>
            exerciseTotal + exercise.sets.filter((set) => set.completed).length,
          0
        ),
      0
    ),
    prs: month.reduce((total, workout) => total + workout.personalRecords.length, 0),
  };
}

export type AthleticsHeatmapDay = {
  date: Date;
  dateKey: string;
  count: number;
  level: 0 | 1 | 2 | 3;
  workouts: AthleticsWorkout[];
};

export function getAthleticsHeatmapDays(
  workouts: AthleticsWorkout[],
  now: Date,
  weeks = 52
) {
  const end = atLocalMidnight(now);
  end.setDate(end.getDate() + (6 - end.getDay()));
  const start = new Date(end);
  start.setDate(start.getDate() - weeks * 7 + 1);
  const byDate = new Map<string, AthleticsWorkout[]>();

  workouts
    .filter((workout) => !workout.deletedAt && workout.status === "completed")
    .forEach((workout) => {
      byDate.set(workout.date, [...(byDate.get(workout.date) ?? []), workout]);
    });

  return Array.from({ length: weeks * 7 }, (_, index): AthleticsHeatmapDay => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const dateKey = toDateKey(date);
    const dayWorkouts = byDate.get(dateKey) ?? [];
    const completedSets = dayWorkouts.reduce(
      (total, workout) =>
        total + workout.exercises.reduce(
          (sum, exercise) => sum + exercise.sets.filter((set) => set.completed).length,
          0
        ),
      0
    );
    const tournament = dayWorkouts.some((workout) => workout.volleyballType === "tournament");
    const level: 0 | 1 | 2 | 3 = dayWorkouts.length === 0
      ? 0
      : tournament || completedSets >= 16 || dayWorkouts.length >= 2
        ? 3
        : completedSets > 0 && completedSets <= 5
          ? 1
          : 2;

    return { date, dateKey, count: dayWorkouts.length, level, workouts: dayWorkouts };
  });
}

export type RecentPersonalRecord = AthleticsPersonalRecord & {
  workoutId: number;
  workoutName: string;
  date: string;
};

export function getRecentPersonalRecords(workouts: AthleticsWorkout[]) {
  return workouts
    .filter(
      (workout) =>
        Boolean(workout.id) &&
        !workout.deletedAt &&
        workout.status === "completed"
    )
    .flatMap((workout) =>
      workout.personalRecords.map((record) => ({
        ...record,
        workoutId: workout.id!,
        workoutName: workout.name,
        date: workout.date,
      }))
    )
    .sort((first, second) => second.date.localeCompare(first.date));
}

export type ExerciseBest = {
  name: string;
  weight: number;
  reps: number;
  sessions: number;
  lastDate: string;
};

export function getExerciseBests(workouts: AthleticsWorkout[]) {
  const bests = new Map<string, ExerciseBest>();

  workouts
    .filter((workout) => !workout.deletedAt && workout.status === "completed")
    .forEach((workout) => {
      workout.exercises.forEach((exercise) => {
        const sets = exercise.sets.filter((set) => set.completed);
        if (sets.length === 0) return;
        const strongest = sets.slice().sort(
          (first, second) => second.weight - first.weight || second.reps - first.reps
        )[0];
        const key = exercise.name.toLowerCase();
        const current = bests.get(key);
        const isBetter = !current || strongest.weight > current.weight ||
          (strongest.weight === current.weight && strongest.reps > current.reps);

        bests.set(key, {
          name: exercise.name,
          weight: isBetter ? strongest.weight : current!.weight,
          reps: isBetter ? strongest.reps : current!.reps,
          sessions: (current?.sessions ?? 0) + 1,
          lastDate: current && current.lastDate > workout.date ? current.lastDate : workout.date,
        });
      });
    });

  return [...bests.values()].sort((first, second) =>
    second.lastDate.localeCompare(first.lastDate)
  );
}
