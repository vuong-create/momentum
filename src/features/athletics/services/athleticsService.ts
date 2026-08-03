import {
  db,
  type AthleticsPersonalRecord,
  type AthleticsSet,
  type AthleticsTemplate,
  type AthleticsTemplateExercise,
  type AthleticsWorkout,
  type AthleticsWorkoutExercise,
  type PlannedActivity,
  type VolleyballSessionType,
} from "../../../database/db";
import {
  completePlannedActivity,
  createPlannedActivity,
  reopenPlannedActivity,
} from "../../activities/services/activityService";
import {
  getActivityStatus,
  isActivityVisible,
} from "../../activities/services/activityLifecycle";
import { recordXPEvent } from "../../xp/XPService";
import {
  getAthleticsTemplateActivityKind,
  getVolleyballActivityKind,
  getVolleyballDefinition,
  starterAthleticsTemplates,
} from "../athleticsCatalog";

export type AthleticsTemplateInput = {
  name: string;
  exercises: Array<Pick<AthleticsTemplateExercise, "name" | "defaultSets">>;
};

export type WorkoutCompletionResult = {
  workoutId: number;
  xpAwarded: number;
  plannedActivityId?: number;
  personalRecords: AthleticsPersonalRecord[];
};

function makeLocalId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function toDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function normalizeTemplateExercises(
  exercises: AthleticsTemplateInput["exercises"]
): AthleticsTemplateExercise[] {
  return exercises
    .map((exercise) => ({
      id: makeLocalId("exercise"),
      name: exercise.name.trim(),
      defaultSets: Math.min(8, Math.max(1, Math.round(exercise.defaultSets))),
    }))
    .filter((exercise) => exercise.name);
}

export async function ensureStarterTemplates() {
  await db.transaction("rw", db.athleticsTemplates, async () => {
    const storedCount = await db.athleticsTemplates.count();
    if (storedCount > 0) return;

    const now = new Date().toISOString();
    await db.athleticsTemplates.bulkAdd(
      starterAthleticsTemplates.map((template, index) => ({
        name: template.name,
        exercises: normalizeTemplateExercises(template.exercises),
        sortOrder: index,
        createdAt: now,
        updatedAt: now,
      }))
    );
  });
}

export async function createAthleticsTemplate(input: AthleticsTemplateInput) {
  const name = input.name.trim();
  const exercises = normalizeTemplateExercises(input.exercises);

  if (!name) throw new Error("A workout template needs a name.");
  if (exercises.length === 0) throw new Error("Add at least one exercise.");

  const now = new Date().toISOString();

  return db.athleticsTemplates.add({
    name,
    exercises,
    sortOrder: Date.now(),
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateAthleticsTemplate(
  id: number,
  input: AthleticsTemplateInput
) {
  const template = await db.athleticsTemplates.get(id);
  if (!template || template.deletedAt) throw new Error("Template not found.");

  const name = input.name.trim();
  const exercises = normalizeTemplateExercises(input.exercises);
  if (!name || exercises.length === 0) throw new Error("Keep a name and one exercise.");

  await db.athleticsTemplates.update(id, {
    name,
    exercises,
    updatedAt: new Date().toISOString(),
  });
}

export async function duplicateAthleticsTemplate(id: number) {
  const template = await db.athleticsTemplates.get(id);
  if (!template || template.deletedAt) throw new Error("Template not found.");

  return createAthleticsTemplate({
    name: `${template.name} Copy`,
    exercises: template.exercises,
  });
}

export async function softDeleteAthleticsTemplate(id: number) {
  await db.athleticsTemplates.update(id, {
    deletedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

export function visibleAthleticsTemplates(templates: AthleticsTemplate[]) {
  return templates
    .filter((template) => !template.deletedAt)
    .sort((first, second) => first.sortOrder - second.sortOrder);
}

function findPreviousExercise(
  workouts: AthleticsWorkout[],
  exerciseName: string
) {
  return workouts
    .filter((workout) => workout.status === "completed" && !workout.deletedAt)
    .sort((first, second) =>
      (second.completedAt ?? second.startedAt).localeCompare(
        first.completedAt ?? first.startedAt
      )
    )
    .flatMap((workout) => workout.exercises)
    .find((exercise) => exercise.name.toLowerCase() === exerciseName.toLowerCase());
}

function buildWorkoutExercises(
  template: AthleticsTemplate,
  previousWorkouts: AthleticsWorkout[]
): AthleticsWorkoutExercise[] {
  return template.exercises.map((exercise) => {
    const previous = findPreviousExercise(previousWorkouts, exercise.name);

    return {
      id: makeLocalId("workout-exercise"),
      name: exercise.name,
      sets: Array.from({ length: exercise.defaultSets }, (_, index) => {
        const previousSet = previous?.sets[index] ?? previous?.sets.at(-1);

        return {
          id: makeLocalId("set"),
          weight: previousSet?.weight ?? 0,
          reps: previousSet?.reps ?? 0,
          completed: false,
        };
      }),
    };
  });
}

export async function startTemplateWorkout(
  templateId: number,
  date = toDateKey(new Date())
) {
  const template = await db.athleticsTemplates.get(templateId);
  if (!template || template.deletedAt) throw new Error("Template not found.");

  const active = await db.athleticsWorkouts
    .where("status")
    .equals("active")
    .filter((workout) => !workout.deletedAt)
    .first();
  if (active?.id) return active.id;

  const previousWorkouts = await db.athleticsWorkouts.toArray();
  const now = new Date().toISOString();

  return db.athleticsWorkouts.add({
    kind: "gym",
    name: template.name,
    date,
    status: "active",
    templateId,
    exercises: buildWorkoutExercises(template, previousWorkouts),
    startedAt: now,
    updatedAt: now,
    personalRecords: [],
  });
}

export async function startCustomWorkout(
  name = "Custom Workout",
  date = toDateKey(new Date())
) {
  const active = await db.athleticsWorkouts
    .where("status")
    .equals("active")
    .filter((workout) => !workout.deletedAt)
    .first();
  if (active?.id) return active.id;

  const now = new Date().toISOString();
  return db.athleticsWorkouts.add({
    kind: "gym",
    name: name.trim() || "Custom Workout",
    date,
    status: "active",
    exercises: [],
    startedAt: now,
    updatedAt: now,
    personalRecords: [],
  });
}

async function requireActiveWorkout(id: number) {
  const workout = await db.athleticsWorkouts.get(id);
  if (!workout || workout.deletedAt || workout.status !== "active") {
    throw new Error("Active workout not found.");
  }
  return workout;
}

export async function addWorkoutExercise(id: number, name: string) {
  const workout = await requireActiveWorkout(id);
  const normalizedName = name.trim();
  if (!normalizedName) return;

  await db.athleticsWorkouts.update(id, {
    exercises: [
      ...workout.exercises,
      {
        id: makeLocalId("workout-exercise"),
        name: normalizedName,
        sets: [{ id: makeLocalId("set"), weight: 0, reps: 0, completed: false }],
      },
    ],
    updatedAt: new Date().toISOString(),
  });
}

export async function removeWorkoutExercise(id: number, exerciseId: string) {
  const workout = await requireActiveWorkout(id);
  await db.athleticsWorkouts.update(id, {
    exercises: workout.exercises.filter((exercise) => exercise.id !== exerciseId),
    updatedAt: new Date().toISOString(),
  });
}

export async function addWorkoutSet(id: number, exerciseId: string) {
  const workout = await requireActiveWorkout(id);
  const exercises = workout.exercises.map((exercise) => {
    if (exercise.id !== exerciseId) return exercise;
    const previous = exercise.sets.at(-1);
    return {
      ...exercise,
      sets: [
        ...exercise.sets,
        {
          id: makeLocalId("set"),
          weight: previous?.weight ?? 0,
          reps: previous?.reps ?? 0,
          completed: false,
        },
      ],
    };
  });

  await db.athleticsWorkouts.update(id, {
    exercises,
    updatedAt: new Date().toISOString(),
  });
}

export async function removeWorkoutSet(
  id: number,
  exerciseId: string,
  setId: string
) {
  const workout = await requireActiveWorkout(id);
  const exercises = workout.exercises.map((exercise) =>
    exercise.id === exerciseId
      ? { ...exercise, sets: exercise.sets.filter((set) => set.id !== setId) }
      : exercise
  );
  await db.athleticsWorkouts.update(id, {
    exercises,
    updatedAt: new Date().toISOString(),
  });
}

export async function updateWorkoutSet(
  id: number,
  exerciseId: string,
  setId: string,
  patch: Partial<Pick<AthleticsSet, "weight" | "reps" | "completed">>
) {
  const workout = await requireActiveWorkout(id);
  const now = new Date().toISOString();
  const exercises = workout.exercises.map((exercise) =>
    exercise.id === exerciseId
      ? {
          ...exercise,
          sets: exercise.sets.map((set) =>
            set.id === setId
              ? {
                  ...set,
                  ...patch,
                  weight: Math.max(0, patch.weight ?? set.weight),
                  reps: Math.max(0, Math.round(patch.reps ?? set.reps)),
                  completedAt:
                    patch.completed === true
                      ? now
                      : patch.completed === false
                        ? undefined
                        : set.completedAt,
                }
              : set
          ),
        }
      : exercise
  );

  await db.athleticsWorkouts.update(id, { exercises, updatedAt: now });
}

export async function repeatPreviousSet(
  id: number,
  exerciseId: string,
  setId: string
) {
  const workout = await requireActiveWorkout(id);
  const currentExercise = workout.exercises.find((exercise) => exercise.id === exerciseId);
  if (!currentExercise) return;
  const setIndex = currentExercise.sets.findIndex((set) => set.id === setId);
  const priorInWorkout = setIndex > 0 ? currentExercise.sets[setIndex - 1] : undefined;
  const previousWorkouts = await db.athleticsWorkouts.toArray();
  const previousExercise = findPreviousExercise(
    previousWorkouts.filter((candidate) => candidate.id !== id),
    currentExercise.name
  );
  const previous = priorInWorkout ?? previousExercise?.sets[setIndex] ?? previousExercise?.sets.at(-1);
  if (!previous) return;
  await updateWorkoutSet(id, exerciseId, setId, {
    weight: previous.weight,
    reps: previous.reps,
  });
}

function completedSets(workout: AthleticsWorkout) {
  return workout.exercises.flatMap((exercise) =>
    exercise.sets
      .filter((set) => set.completed)
      .map((set) => ({ exerciseName: exercise.name, set }))
  );
}

export function detectPersonalRecords(
  workout: AthleticsWorkout,
  priorWorkouts: AthleticsWorkout[]
) {
  const previousSets = priorWorkouts
    .filter(
      (candidate) =>
        candidate.id !== workout.id &&
        candidate.status === "completed" &&
        !candidate.deletedAt
    )
    .flatMap(completedSets);
  const records: AthleticsPersonalRecord[] = [];

  for (const { exerciseName, set } of completedSets(workout)) {
    const matching = previousSets.filter(
      (item) => item.exerciseName.toLowerCase() === exerciseName.toLowerCase()
    );
    if (matching.length === 0) continue;

    const previousWeight = Math.max(...matching.map((item) => item.set.weight));
    if (set.weight > previousWeight) {
      records.push({
        exerciseName,
        type: "weight",
        weight: set.weight,
        reps: set.reps,
        previousBest: previousWeight,
      });
      continue;
    }

    const sameWeight = matching.filter((item) => item.set.weight === set.weight);
    const previousReps = sameWeight.length
      ? Math.max(...sameWeight.map((item) => item.set.reps))
      : 0;
    if (set.reps > previousReps) {
      records.push({
        exerciseName,
        type: "reps",
        weight: set.weight,
        reps: set.reps,
        previousBest: previousReps,
      });
    }
  }

  return [...records.reduce((strongest, record) => {
    const key = `${record.exerciseName.toLowerCase()}:${record.type}`;
    const current = strongest.get(key);
    const isBetter = !current || record.weight > current.weight ||
      (record.weight === current.weight && record.reps > current.reps);
    if (isBetter) strongest.set(key, record);
    return strongest;
  }, new Map<string, AthleticsPersonalRecord>()).values()];
}

function sortMatchingPlans(plans: PlannedActivity[]) {
  return plans.sort((first, second) =>
    (first.sortOrder ?? first.id ?? 0) - (second.sortOrder ?? second.id ?? 0)
  );
}

async function findWorkoutPlan(workout: AthleticsWorkout) {
  const candidates = await db.plannedActivities
    .where("pillar")
    .equals("athletics")
    .filter(
      (activity) =>
        activity.scheduledDate === workout.date &&
        isActivityVisible(activity) &&
        getActivityStatus(activity) !== "completed"
    )
    .toArray();
  const exactKind = workout.templateId
    ? getAthleticsTemplateActivityKind(workout.templateId)
    : undefined;
  return sortMatchingPlans(candidates).find(
    (activity) =>
      (exactKind && activity.activityKind === exactKind) ||
      activity.title.toLowerCase() === workout.name.toLowerCase()
  );
}

async function linkCompletionXP(
  workout: AthleticsWorkout,
  spontaneousXP: number,
  actionType: string
) {
  const plan = await findWorkoutPlan(workout);
  if (plan?.id) {
    const completion = await completePlannedActivity(plan.id);
    const xpEvent = await db.xpEvents
      .where("activityEventId")
      .equals(completion.activityEventId)
      .first();
    return {
      plannedActivityId: plan.id,
      activityEventId: completion.activityEventId,
      xpEventId: xpEvent?.id,
      xpAwarded: completion.xpAwarded,
    };
  }

  const award = await recordXPEvent({
    amount: spontaneousXP,
    source: `athletics-workout:${workout.id}`,
    scope: "pillar",
    pillar: "athletics",
    actionType,
    sourceType: "athletics-workout",
    sourceId: String(workout.id),
    description: workout.name,
    dedupeKey: `athletics-workout:${workout.id}:completion`,
    baseXP: spontaneousXP,
  });
  return { xpEventId: award.id, xpAwarded: award.xpAwarded };
}

export async function completeAthleticsWorkout(
  id: number
): Promise<WorkoutCompletionResult> {
  return db.transaction(
    "rw",
    db.athleticsWorkouts,
    db.plannedActivities,
    db.activityEvents,
    db.xpEvents,
    async () => {
      const workout = await requireActiveWorkout(id);
      const hasCompletedSet = workout.exercises.some((exercise) =>
        exercise.sets.some((set) => set.completed)
      );
      if (!hasCompletedSet) throw new Error("Complete at least one set first.");

      const priorWorkouts = await db.athleticsWorkouts.toArray();
      const personalRecords = detectPersonalRecords(workout, priorWorkouts);
      const completion = await linkCompletionXP(workout, 20, "workout-completed");
      const now = new Date().toISOString();

      await db.athleticsWorkouts.update(id, {
        status: "completed",
        completedAt: now,
        updatedAt: now,
        personalRecords,
        ...completion,
      });

      return {
        workoutId: id,
        xpAwarded: completion.xpAwarded,
        plannedActivityId: completion.plannedActivityId,
        personalRecords,
      };
    }
  );
}

export async function logVolleyballSession(
  type: VolleyballSessionType,
  date = toDateKey(new Date())
): Promise<WorkoutCompletionResult> {
  return db.transaction(
    "rw",
    db.athleticsWorkouts,
    db.plannedActivities,
    db.activityEvents,
    db.xpEvents,
    async () => {
      const definition = getVolleyballDefinition(type);
      const now = new Date().toISOString();
      const workoutId = await db.athleticsWorkouts.add({
        kind: "volleyball",
        name: `Volleyball · ${definition.label}`,
        volleyballType: type,
        date,
        status: "completed",
        exercises: [],
        startedAt: now,
        completedAt: now,
        updatedAt: now,
        personalRecords: [],
      });
      const workout = (await db.athleticsWorkouts.get(workoutId))!;
      const completion = await linkCompletionXP(
        workout,
        definition.xp,
        `volleyball-${type}`
      );
      await db.athleticsWorkouts.update(workoutId, completion);

      return {
        workoutId,
        xpAwarded: completion.xpAwarded,
        plannedActivityId: completion.plannedActivityId,
        personalRecords: [],
      };
    }
  );
}

export async function scheduleAthleticsTemplate(
  templateId: number,
  scheduledDate: string
) {
  const template = await db.athleticsTemplates.get(templateId);
  if (!template || template.deletedAt) throw new Error("Template not found.");

  return createPlannedActivity({
    title: template.name,
    scheduledDate,
    pillar: "athletics",
    activityKind: getAthleticsTemplateActivityKind(templateId),
    difficulty: "medium",
  });
}

export async function scheduleVolleyball(
  type: VolleyballSessionType,
  scheduledDate: string
) {
  const definition = getVolleyballDefinition(type);
  return createPlannedActivity({
    title: `Volleyball · ${definition.label}`,
    scheduledDate,
    pillar: "athletics",
    activityKind: getVolleyballActivityKind(type),
    difficulty: type === "tournament" ? "hard" : "medium",
  });
}

export async function softDeleteAthleticsWorkout(id: number) {
  return db.transaction(
    "rw",
    db.athleticsWorkouts,
    db.plannedActivities,
    db.activityEvents,
    db.xpEvents,
    async () => {
      const workout = await db.athleticsWorkouts.get(id);
      if (!workout || workout.deletedAt) return;
      const now = new Date().toISOString();
      await db.athleticsWorkouts.update(id, { deletedAt: now, updatedAt: now });
      if (workout.plannedActivityId) {
        await reopenPlannedActivity(workout.plannedActivityId);
      } else if (workout.xpEventId) {
        await db.xpEvents.update(workout.xpEventId, { voidedAt: now });
      }
    }
  );
}

export async function restoreAthleticsWorkout(id: number) {
  return db.transaction(
    "rw",
    db.athleticsWorkouts,
    db.plannedActivities,
    db.activityEvents,
    db.xpEvents,
    async () => {
      const workout = await db.athleticsWorkouts.get(id);
      if (!workout?.deletedAt) return;
      let completion: {
        plannedActivityId?: number;
        activityEventId?: number;
        xpEventId?: number;
        xpAwarded: number;
      };

      if (workout.plannedActivityId) {
        const planCompletion = await completePlannedActivity(workout.plannedActivityId);
        const xpEvent = await db.xpEvents
          .where("activityEventId")
          .equals(planCompletion.activityEventId)
          .first();
        completion = {
          plannedActivityId: workout.plannedActivityId,
          activityEventId: planCompletion.activityEventId,
          xpEventId: xpEvent?.id,
          xpAwarded: planCompletion.xpAwarded,
        };
      } else {
        const xp = workout.kind === "volleyball" && workout.volleyballType
          ? getVolleyballDefinition(workout.volleyballType).xp
          : 20;
        const award = await recordXPEvent({
          amount: xp,
          source: `athletics-workout:${id}`,
          scope: "pillar",
          pillar: "athletics",
          actionType: workout.kind === "volleyball" ? `volleyball-${workout.volleyballType}` : "workout-completed",
          sourceType: "athletics-workout",
          sourceId: String(id),
          description: workout.name,
          dedupeKey: `athletics-workout:${id}:completion`,
          baseXP: xp,
        });
        completion = { xpEventId: award.id, xpAwarded: award.xpAwarded };
      }

      await db.athleticsWorkouts.update(id, {
        deletedAt: undefined,
        updatedAt: new Date().toISOString(),
        ...completion,
      });
    }
  );
}

export function visibleAthleticsWorkouts(workouts: AthleticsWorkout[]) {
  return workouts
    .filter((workout) => !workout.deletedAt)
    .sort((first, second) =>
      (second.completedAt ?? second.startedAt).localeCompare(
        first.completedAt ?? first.startedAt
      )
    );
}
