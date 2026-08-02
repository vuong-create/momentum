import {
  db,
  type ChineseActivity,
  type ChineseActivityType,
  type PlannedActivity,
} from "../../../database/db";
import {
  completePlannedActivity,
  reopenPlannedActivity,
} from "../../activities/services/activityService";
import {
  getActivityStatus,
  isActivityVisible,
} from "../../activities/services/activityLifecycle";
import { recordXPEvent } from "../../xp/XPService";
import {
  getChineseActivityDefinition,
  getChineseActivityKind,
} from "../activityCatalog";

function toDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function getSpontaneousDedupeKey(type: ChineseActivityType, date: string) {
  return `chinese:${type}:${date}:spontaneous`;
}

function buildSpontaneousXPInput(
  activityId: number,
  type: ChineseActivityType,
  date: string
) {
  const definition = getChineseActivityDefinition(type);

  return {
    amount: definition.xp,
    source: `chinese-activity:${activityId}`,
    scope: "pillar" as const,
    pillar: "chinese" as const,
    actionType: `chinese-${type}`,
    sourceType: "chinese-activity",
    sourceId: String(activityId),
    description: definition.label,
    dedupeKey: getSpontaneousDedupeKey(type, date),
    date: `${date}T12:00:00.000Z`,
    baseXP: definition.xp,
  };
}

function sortMatchingPlans(plans: PlannedActivity[]) {
  return plans.sort((first, second) => {
    if (Boolean(first.scheduledTime) !== Boolean(second.scheduledTime)) {
      return first.scheduledTime ? -1 : 1;
    }

    return (
      (first.sortOrder ?? first.id ?? 0) -
      (second.sortOrder ?? second.id ?? 0)
    );
  });
}

async function findMatchingPlan(type: ChineseActivityType, date: string) {
  const matches = await db.plannedActivities
    .where("activityKind")
    .equals(getChineseActivityKind(type))
    .filter(
      (activity) =>
        activity.pillar === "chinese" &&
        activity.scheduledDate === date &&
        isActivityVisible(activity) &&
        getActivityStatus(activity) !== "completed"
    )
    .toArray();

  return sortMatchingPlans(matches)[0];
}

export interface LogChineseActivityResult {
  chineseActivityId: number;
  plannedActivityId?: number;
  xpAwarded: number;
  xpEventId?: number;
  completedPlan: boolean;
}

export async function logChineseActivity(
  type: ChineseActivityType,
  date = toDateKey(new Date())
): Promise<LogChineseActivityResult> {
  const definition = getChineseActivityDefinition(type);

  return db.transaction(
    "rw",
    db.chineseActivities,
    db.plannedActivities,
    db.activityEvents,
    db.xpEvents,
    async () => {
      const plan = await findMatchingPlan(type, date);
      const createdAt = new Date().toISOString();

      if (plan?.id) {
        const completion = await completePlannedActivity(plan.id);
        const xpEvent = await db.xpEvents
          .where("activityEventId")
          .equals(completion.activityEventId)
          .first();
        const chineseActivityId = await db.chineseActivities.add({
          type,
          date,
          intensity: definition.intensity,
          plannedActivityId: plan.id,
          activityEventId: completion.activityEventId,
          xpEventId: xpEvent?.id,
          createdAt,
        });

        return {
          chineseActivityId,
          plannedActivityId: plan.id,
          xpAwarded: completion.xpAwarded,
          xpEventId: xpEvent?.id,
          completedPlan: true,
        };
      }

      const chineseActivityId = await db.chineseActivities.add({
        type,
        date,
        intensity: definition.intensity,
        createdAt,
      });
      const award = await recordXPEvent(
        buildSpontaneousXPInput(chineseActivityId, type, date)
      );

      await db.chineseActivities.update(chineseActivityId, {
        xpEventId: award.id,
      });

      return {
        chineseActivityId,
        xpAwarded: award.xpAwarded,
        xpEventId: award.id,
        completedPlan: false,
      };
    }
  );
}

export async function softDeleteChineseActivity(id: number) {
  return db.transaction(
    "rw",
    db.chineseActivities,
    db.plannedActivities,
    db.activityEvents,
    db.xpEvents,
    async () => {
      const activity = await db.chineseActivities.get(id);

      if (!activity || activity.deletedAt) return;

      const now = new Date().toISOString();
      await db.chineseActivities.update(id, { deletedAt: now });

      if (activity.plannedActivityId) {
        await reopenPlannedActivity(activity.plannedActivityId);
        return;
      }

      const activePeers = await db.chineseActivities
        .where("date")
        .equals(activity.date)
        .filter(
          (candidate) =>
            candidate.id !== id &&
            candidate.type === activity.type &&
            !candidate.deletedAt &&
            !candidate.plannedActivityId
        )
        .count();

      if (activePeers === 0 && activity.xpEventId) {
        await db.xpEvents.update(activity.xpEventId, { voidedAt: now });
      }
    }
  );
}

export async function restoreChineseActivity(id: number) {
  return db.transaction(
    "rw",
    db.chineseActivities,
    db.plannedActivities,
    db.activityEvents,
    db.xpEvents,
    async () => {
      const activity = await db.chineseActivities.get(id);

      if (!activity?.deletedAt) return;

      let xpEventId: number | undefined;

      if (activity.plannedActivityId) {
        const completion = await completePlannedActivity(activity.plannedActivityId);
        const xpEvent = await db.xpEvents
          .where("activityEventId")
          .equals(completion.activityEventId)
          .first();
        xpEventId = xpEvent?.id;
      } else {
        const award = await recordXPEvent(
          buildSpontaneousXPInput(id, activity.type, activity.date)
        );
        xpEventId = award.id;
      }

      await db.chineseActivities.update(id, {
        xpEventId,
        deletedAt: undefined,
      });
    }
  );
}

export function visibleChineseActivities(activities: ChineseActivity[]) {
  return activities
    .filter((activity) => !activity.deletedAt)
    .sort((first, second) => second.createdAt.localeCompare(first.createdAt));
}
