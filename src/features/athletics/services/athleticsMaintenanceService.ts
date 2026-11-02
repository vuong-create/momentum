import { db } from "../../../database/db";
import { cancelPlannedActivity } from "../../activities/services/activityService";
import { getActivityStatus, isActivityVisible } from "../../activities/services/activityLifecycle";

function toDateKey(date: Date) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}

/**
 * Keeps expired training history while removing its unfinished work from Planner.
 * Completed activities are never changed and repeated runs are safe.
 */
export async function cleanupExpiredAthleticsPlannerActivities(referenceDate = new Date()) {
  const todayKey = toDateKey(referenceDate);
  const expiredBlocks = await db.athleticsTrainingBlocks.filter((block) => !block.deletedAt && block.endDate < todayKey).toArray();
  if (!expiredBlocks.length) return 0;

  const expiredIds = new Set(expiredBlocks.flatMap((block) => block.id ? [block.id] : []));
  const sessions = await db.athleticsPlannedSessions.filter((session) => !session.deletedAt && expiredIds.has(session.blockId) && Boolean(session.plannedActivityId)).toArray();
  const activities = await db.plannedActivities.bulkGet(sessions.map((session) => session.plannedActivityId!));
  let cancelled = 0;

  for (const activity of activities) {
    if (!activity || !isActivityVisible(activity) || getActivityStatus(activity) === "completed") continue;
    await cancelPlannedActivity(activity.id!);
    cancelled += 1;
  }

  await db.athleticsTrainingBlocks.bulkUpdate(expiredBlocks.filter((block) => block.id && block.active).map((block) => ({ key: block.id!, changes: { active: false, updatedAt: new Date().toISOString() } })));
  return cancelled;
}
