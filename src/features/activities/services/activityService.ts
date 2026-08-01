import { db } from "../../../database/db";
import type {
  ActivityStatus,
  Difficulty,
  PlannedActivity,
} from "../../../database/db";

import type {
  ActivityDetailsPatch,
  CompletionResult,
  CreateActivityInput,
} from "../types";

import {
  calculatePlannedXP,
  getActivityStatus,
  getCompletionDedupeKey,
} from "./activityLifecycle";

function getXPReward(difficulty: Difficulty) {
  if (difficulty === "easy") return 5;
  if (difficulty === "hard") return 25;

  return 10;
}

function getDayName(dateKey: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
  }).format(new Date(`${dateKey}T00:00:00`));
}

async function requireActivity(id: number) {
  const activity = await db.plannedActivities.get(id);

  if (!activity || activity.deletedAt) {
    throw new Error(`Activity ${id} was not found.`);
  }

  return activity;
}

export async function createPlannedActivity(
  input: CreateActivityInput
) {
  if (!input.scheduledDate && !input.planningWeekStart) {
    throw new Error("An activity needs a scheduled date or planning week.");
  }

  const now = new Date().toISOString();
  const difficulty = input.difficulty ?? "medium";

  return db.plannedActivities.add({
    title: input.title.trim(),
    completed: false,
    status: "planned",
    date: now,
    createdAt: now,
    updatedAt: now,
    day: input.scheduledDate
      ? getDayName(input.scheduledDate)
      : "Unscheduled",
    scheduledDate: input.scheduledDate,
    planningWeekStart: input.scheduledDate
      ? undefined
      : input.planningWeekStart,
    scheduledTime: input.scheduledTime || undefined,
    pillar: input.pillar ?? "core",
    difficulty,
    xpReward: getXPReward(difficulty),
    important: input.important ?? false,
    notes: input.notes?.trim() || undefined,
    sortOrder: Date.now(),
  });
}

export async function updateActivityDetails(
  id: number,
  patch: ActivityDetailsPatch
) {
  const activity = await requireActivity(id);
  const normalizedPatch: ActivityDetailsPatch = { ...patch };

  if (patch.title !== undefined) {
    normalizedPatch.title = patch.title.trim();
  }

  if (patch.notes !== undefined) {
    normalizedPatch.notes = patch.notes.trim() || undefined;
  }

  if (patch.scheduledDate) {
    normalizedPatch.scheduledDate = patch.scheduledDate;
    normalizedPatch.planningWeekStart = undefined;
  } else if (patch.planningWeekStart) {
    normalizedPatch.scheduledDate = undefined;
  }

  await db.plannedActivities.update(id, {
    ...normalizedPatch,
    day: patch.scheduledDate
      ? getDayName(patch.scheduledDate)
      : patch.planningWeekStart
        ? "Unscheduled"
        : activity.day,
    updatedAt: new Date().toISOString(),
  });
}

export async function movePlannedActivity(
  id: number,
  scheduledDate: string,
  sortOrder = Date.now()
) {
  await requireActivity(id);

  await db.plannedActivities.update(id, {
    scheduledDate,
    planningWeekStart: undefined,
    day: getDayName(scheduledDate),
    sortOrder,
    updatedAt: new Date().toISOString(),
  });
}

export async function unschedulePlannedActivity(
  id: number,
  planningWeekStart: string,
  sortOrder = Date.now()
) {
  await requireActivity(id);

  await db.plannedActivities.update(id, {
    scheduledDate: undefined,
    planningWeekStart,
    day: "Unscheduled",
    sortOrder,
    updatedAt: new Date().toISOString(),
  });
}

export async function duplicatePlannedActivity(
  id: number,
  destination: {
    scheduledDate?: string;
    planningWeekStart?: string;
  } = {}
) {
  const activity = await requireActivity(id);
  const scheduledDate = destination.planningWeekStart
    ? undefined
    : destination.scheduledDate ?? activity.scheduledDate;

  return createPlannedActivity({
    title: activity.title,
    scheduledDate,
    planningWeekStart: scheduledDate
      ? undefined
      : destination.planningWeekStart ?? activity.planningWeekStart,
    scheduledTime: activity.scheduledTime,
    pillar: activity.pillar,
    difficulty: activity.difficulty,
    important: activity.important,
    notes: activity.notes,
  });
}

export async function setPlannedActivityOrder(ids: number[]) {
  const now = new Date();
  const baseOrder = now.getTime();

  await db.transaction("rw", db.plannedActivities, async () => {
    await Promise.all(
      ids.map((id, index) =>
        db.plannedActivities.update(id, {
          sortOrder: baseOrder + index,
          updatedAt: now.toISOString(),
        })
      )
    );
  });
}

export async function movePlannedActivities(
  ids: number[],
  scheduledDate: string
) {
  const now = new Date();
  const baseOrder = now.getTime();

  await db.transaction("rw", db.plannedActivities, async () => {
    await Promise.all(
      ids.map((id, index) =>
        db.plannedActivities.update(id, {
          scheduledDate,
          planningWeekStart: undefined,
          day: getDayName(scheduledDate),
          sortOrder: baseOrder + index,
          updatedAt: now.toISOString(),
        })
      )
    );
  });
}

export async function toggleActivityImportance(id: number) {
  const activity = await requireActivity(id);

  await db.plannedActivities.update(id, {
    important: !activity.important,
    updatedAt: new Date().toISOString(),
  });
}

export async function completePlannedActivity(
  id: number
): Promise<CompletionResult> {
  return db.transaction(
    "rw",
    db.plannedActivities,
    db.activityEvents,
    db.xpEvents,
    async () => {
      const activity = await requireActivity(id);
      const existingStatus = getActivityStatus(activity);
      const dedupeKey = getCompletionDedupeKey(id);

      const existingEvent = await db.activityEvents
        .where("plannedActivityId")
        .equals(id)
        .first();

      const existingXP =
        (await db.xpEvents.where("dedupeKey").equals(dedupeKey).first()) ??
        (await db.xpEvents.where("source").equals(`activity:${id}`).first());

      if (
        existingStatus === "completed" &&
        existingEvent?.id
      ) {
        return {
          activityEventId: existingEvent.id,
          xpAwarded: 0,
          wasAlreadyCompleted: true,
        };
      }

      const now = new Date().toISOString();
      const plannedXP = calculatePlannedXP(activity.xpReward);

      await db.plannedActivities.update(id, {
        status: "completed",
        completed: true,
        completedAt: now,
        updatedAt: now,
        dismissedAt: undefined,
        cancelledAt: undefined,
      });

      let activityEventId: number;

      if (existingEvent?.id) {
        activityEventId = existingEvent.id;
        await db.activityEvents.update(activityEventId, {
          occurredAt: now,
          voidedAt: undefined,
        });
      } else {
        activityEventId = await db.activityEvents.add({
          plannedActivityId: id,
          pillar: activity.pillar,
          occurredAt: now,
          effortTier: activity.difficulty,
          plannedBeforeCompletion: true,
        });
      }

      if (existingXP?.id) {
        await db.xpEvents.update(existingXP.id, {
          dedupeKey,
          activityEventId,
          pillar: activity.pillar,
          amount: plannedXP.finalXP,
          baseXP: plannedXP.baseXP,
          plannedBonusXP: plannedXP.plannedBonusXP,
          finalXP: plannedXP.finalXP,
          voidedAt: undefined,
        });
      } else {
        await db.xpEvents.add({
          dedupeKey,
          activityEventId,
          pillar: activity.pillar,
          amount: plannedXP.finalXP,
          baseXP: plannedXP.baseXP,
          plannedBonusXP: plannedXP.plannedBonusXP,
          finalXP: plannedXP.finalXP,
          source: `activity:${id}`,
          date: now,
        });
      }

      return {
        activityEventId,
        xpAwarded: existingXP?.voidedAt || !existingXP
          ? plannedXP.finalXP
          : 0,
        wasAlreadyCompleted: false,
      };
    }
  );
}

export async function reopenPlannedActivity(id: number) {
  return db.transaction(
    "rw",
    db.plannedActivities,
    db.activityEvents,
    db.xpEvents,
    async () => {
      await requireActivity(id);
      const now = new Date().toISOString();
      const dedupeKey = getCompletionDedupeKey(id);

      await db.plannedActivities.update(id, {
        status: "planned",
        completed: false,
        completedAt: undefined,
        updatedAt: now,
      });

      const activityEvent = await db.activityEvents
        .where("plannedActivityId")
        .equals(id)
        .first();

      if (activityEvent?.id) {
        await db.activityEvents.update(activityEvent.id, {
          voidedAt: now,
        });
      }

      const xpEvent =
        (await db.xpEvents
          .where("dedupeKey")
          .equals(dedupeKey)
          .first()) ??
        (await db.xpEvents
          .where("source")
          .equals(`activity:${id}`)
          .first());

      if (xpEvent?.id) {
        await db.xpEvents.update(xpEvent.id, {
          dedupeKey,
          voidedAt: now,
        });
      }
    }
  );
}

export async function togglePlannedActivity(id: number) {
  const activity = await requireActivity(id);

  if (getActivityStatus(activity) === "completed") {
    await reopenPlannedActivity(id);
    return;
  }

  await completePlannedActivity(id);
}

async function setTerminalStatus(
  id: number,
  status: Extract<ActivityStatus, "dismissed" | "cancelled">
) {
  const activity = await requireActivity(id);

  if (getActivityStatus(activity) === "completed") {
    await reopenPlannedActivity(id);
  }

  const now = new Date().toISOString();

  await db.plannedActivities.update(id, {
    status,
    completed: false,
    updatedAt: now,
    dismissedAt: status === "dismissed" ? now : undefined,
    cancelledAt: status === "cancelled" ? now : undefined,
  });
}

export function dismissPlannedActivity(id: number) {
  return setTerminalStatus(id, "dismissed");
}

export function cancelPlannedActivity(id: number) {
  return setTerminalStatus(id, "cancelled");
}

export async function restoreDismissedActivity(id: number) {
  const activity = await db.plannedActivities.get(id);

  if (!activity || activity.deletedAt) {
    throw new Error(`Activity ${id} was not found.`);
  }

  await db.plannedActivities.update(id, {
    status: "planned",
    completed: false,
    completedAt: undefined,
    dismissedAt: undefined,
    cancelledAt: undefined,
    updatedAt: new Date().toISOString(),
  });
}

export async function softDeletePlannedActivity(id: number) {
  await requireActivity(id);
  const now = new Date().toISOString();

  await db.plannedActivities.update(id, {
    deletedAt: now,
    updatedAt: now,
  });
}

export async function restoreSoftDeletedActivity(id: number) {
  const activity = await db.plannedActivities.get(id);

  if (!activity) {
    throw new Error(`Activity ${id} was not found.`);
  }

  await db.plannedActivities.update(id, {
    deletedAt: undefined,
    updatedAt: new Date().toISOString(),
  });
}

export async function getPlannedActivity(id: number) {
  return db.plannedActivities.get(id);
}

export async function listPlannedActivities() {
  return db.plannedActivities
    .filter((activity: PlannedActivity) => !activity.deletedAt)
    .toArray();
}
