import type {
  ActivityDisplayStatus,
  ActivityStatus,
  PlannedActivity,
} from "../../../database/db";

export function getActivityStatus(
  activity: PlannedActivity
): ActivityStatus {
  return activity.status ??
    (activity.completed ? "completed" : "planned");
}

export function getActivityDisplayStatus(
  activity: PlannedActivity,
  todayKey: string
): ActivityDisplayStatus {
  const status = getActivityStatus(activity);

  if (
    status === "planned" &&
    activity.scheduledDate &&
    activity.scheduledDate < todayKey
  ) {
    return "missed";
  }

  return status;
}

export function isActivityCompleted(
  activity: PlannedActivity
) {
  return getActivityStatus(activity) === "completed";
}

export function isActivityVisible(
  activity: PlannedActivity
) {
  const status = getActivityStatus(activity);

  return !activity.deletedAt &&
    status !== "dismissed" &&
    status !== "cancelled";
}

export function isActivityWeeklyEligible(
  activity: PlannedActivity
) {
  return isActivityVisible(activity);
}

export function calculatePlannedXP(baseXP: number) {
  const plannedBonusXP = Math.round(baseXP * 0.25);

  return {
    baseXP,
    plannedBonusXP,
    finalXP: baseXP + plannedBonusXP,
  };
}

export function getCompletionDedupeKey(activityId: number) {
  return `planned-activity:${activityId}:completion`;
}
