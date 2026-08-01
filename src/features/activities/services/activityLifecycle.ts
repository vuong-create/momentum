import type {
  ActivityDisplayStatus,
  ActivityStatus,
  PlannedActivity,
} from "../../../database/db";

const weekDayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function toDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function resolveActivityScheduledDate(
  activity: PlannedActivity,
  referenceDateKey: string
) {
  if (activity.scheduledDate) return activity.scheduledDate;

  const dayIndex = weekDayNames.indexOf(activity.day);

  if (dayIndex < 0) return null;

  const referenceDate = new Date(`${referenceDateKey}T00:00:00`);
  const weekStart = new Date(referenceDate);

  weekStart.setDate(referenceDate.getDate() - referenceDate.getDay());
  weekStart.setDate(weekStart.getDate() + dayIndex);

  return toDateKey(weekStart);
}

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
