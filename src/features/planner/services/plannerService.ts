import { db } from "../../../database/db";
import type {
  Difficulty,
  PlannedActivity,
} from "../../../database/db";

import type {
  CreateActivityInput,
  PlannerDay,
} from "../types";

const dayNames = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function padNumber(value: number) {
  return String(value).padStart(2, "0");
}

export function toDateKey(date: Date) {
  return [
    date.getFullYear(),
    padNumber(date.getMonth() + 1),
    padNumber(date.getDate()),
  ].join("-");
}

export function fromDateKey(dateKey: string) {
  const [year, month, day] = dateKey
    .split("-")
    .map(Number);

  return new Date(year, month - 1, day);
}

export function getWeekStart(date = new Date()) {
  const result = new Date(date);
  const currentDay = result.getDay();
  const mondayOffset =
    currentDay === 0 ? -6 : 1 - currentDay;

  result.setDate(result.getDate() + mondayOffset);
  result.setHours(0, 0, 0, 0);

  return result;
}

export function addDays(date: Date, amount: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);

  return result;
}

export function addWeeks(date: Date, amount: number) {
  return addDays(date, amount * 7);
}

function getXPReward(difficulty: Difficulty) {
  if (difficulty === "easy") return 5;
  if (difficulty === "hard") return 25;

  return 10;
}

function getLegacyScheduledDate(
  activity: PlannedActivity,
  requestedWeekStart: Date
) {
  const currentWeekStart = getWeekStart(new Date());

  if (
    toDateKey(requestedWeekStart) !==
    toDateKey(currentWeekStart)
  ) {
    return null;
  }

  const dayIndex = dayNames.indexOf(activity.day);

  if (dayIndex < 0) return null;

  return toDateKey(addDays(currentWeekStart, dayIndex));
}

function resolveScheduledDate(
  activity: PlannedActivity,
  requestedWeekStart: Date
) {
  return (
    activity.scheduledDate ??
    getLegacyScheduledDate(activity, requestedWeekStart)
  );
}

export async function getActivitiesForWeek(
  weekStartKey: string
) {
  const weekStart = fromDateKey(weekStartKey);
  const weekEnd = addDays(weekStart, 6);

  const startKey = toDateKey(weekStart);
  const endKey = toDateKey(weekEnd);

  const activities =
    await db.plannedActivities.toArray();

  return activities.filter((activity) => {
    const scheduledDate = resolveScheduledDate(
      activity,
      weekStart
    );

    if (!scheduledDate) return false;

    return (
      scheduledDate >= startKey &&
      scheduledDate <= endKey
    );
  });
}

export async function createActivity(
  input: CreateActivityInput
) {
  const scheduledDate = fromDateKey(
    input.scheduledDate
  );

  const day = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
  }).format(scheduledDate);

  await db.plannedActivities.add({
    title: input.title.trim(),
    completed: false,
    date: new Date().toISOString(),
    day,
    scheduledDate: input.scheduledDate,
    pillar: input.pillar,
    difficulty: input.difficulty,
    xpReward: getXPReward(input.difficulty),
  });
}

export async function toggleActivity(
  activity: PlannedActivity
) {
  if (!activity.id) return;

  await db.plannedActivities.update(activity.id, {
    completed: !activity.completed,
  });
}

export async function deleteActivity(id: number) {
  await db.plannedActivities.delete(id);
}

export async function moveActivity(
  activity: PlannedActivity,
  scheduledDate: string
) {
  if (!activity.id) return;

  const date = fromDateKey(scheduledDate);

  const day = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
  }).format(date);

  await db.plannedActivities.update(activity.id, {
    scheduledDate,
    day,
  });
}

export function buildPlannerDays(
  weekStartKey: string,
  activities: PlannedActivity[]
): PlannerDay[] {
  const weekStart = fromDateKey(weekStartKey);
  const todayKey = toDateKey(new Date());

  return dayNames.map((dayName, index) => {
    const date = addDays(weekStart, index);
    const dateKey = toDateKey(date);

    const dayActivities = activities.filter(
      (activity) => {
        const resolvedDate = resolveScheduledDate(
          activity,
          weekStart
        );

        return resolvedDate === dateKey;
      }
    );

    return {
      date,
      dateKey,
      dayName,
      shortDayName: dayName.slice(0, 3),
      dayNumber: String(date.getDate()),
      isToday: dateKey === todayKey,
      activities: dayActivities,
    };
  });
}