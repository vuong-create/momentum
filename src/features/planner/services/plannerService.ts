import { db } from "../../../database/db";
import type { PlannedActivity } from "../../../database/db";

import {
  duplicatePlannedActivity,
  movePlannedActivities,
  movePlannedActivity,
  setPlannedActivityOrder,
  toggleActivityImportance,
  togglePlannedActivity,
  unschedulePlannedActivity,
  updateActivityDetails,
} from "../../activities/services/activityService";
import {
  createActivityPlan,
  materializeOccurrencesForWeek,
} from "../../activities/services/recurrenceService";
import { isActivityVisible } from "../../activities/services/activityLifecycle";

import type {
  CreateActivityInput,
  PlannerDay,
  PlannerMonthDay,
} from "../types";

const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
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

  result.setDate(result.getDate() - currentDay);
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

export function toMonthKey(date: Date) {
  return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}`;
}

export function addMonths(monthKey: string, amount: number) {
  const [year, month] = monthKey.split("-").map(Number);
  return toMonthKey(new Date(year, month - 1 + amount, 1));
}

export function getMonthGridBounds(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0);
  const gridStart = getWeekStart(monthStart);
  const gridEnd = addDays(getWeekStart(monthEnd), 6);

  return { monthStart, monthEnd, gridStart, gridEnd };
}

export function formatActivityTime(time?: string) {
  if (!time) return "";

  const [hours, minutes] = time.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return time;

  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;

  return `${displayHour}:${padNumber(minutes)} ${period}`;
}

function getDateKeyUTCValue(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);

  return Date.UTC(year, month - 1, day);
}

export function getRelativeWeekLabel(
  weekStartKey: string,
  referenceDate = new Date()
) {
  const referenceWeekKey = toDateKey(getWeekStart(referenceDate));
  const weekOffset = Math.round(
    (getDateKeyUTCValue(weekStartKey) -
      getDateKeyUTCValue(referenceWeekKey)) /
      (7 * 24 * 60 * 60 * 1000)
  );

  if (weekOffset === 0) return "This week";
  if (weekOffset === 1) return "Next week";
  if (weekOffset === -1) return "Last week";
  if (weekOffset === 2) return "2 weeks ahead";
  if (weekOffset === -2) return "2 weeks ago";

  const start = fromDateKey(weekStartKey);
  const end = addDays(start, 6);
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return `Week of ${formatter.format(start)} – ${formatter.format(end)}`;
}

export function sortActivitiesForFocus(
  activities: PlannedActivity[]
) {
  return [...activities].sort((first, second) => {
    if (first.completed !== second.completed) {
      return first.completed ? 1 : -1;
    }

    if (Boolean(first.important) !== Boolean(second.important)) {
      return first.important ? -1 : 1;
    }

    if (Boolean(first.scheduledTime) !== Boolean(second.scheduledTime)) {
      return first.scheduledTime ? -1 : 1;
    }

    if (first.scheduledTime && second.scheduledTime) {
      const timeComparison = first.scheduledTime.localeCompare(
        second.scheduledTime
      );

      if (timeComparison !== 0) return timeComparison;
    }

    return (
      (first.sortOrder ?? first.id ?? 0) -
      (second.sortOrder ?? second.id ?? 0)
    );
  });
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
  await materializeOccurrencesForWeek(weekStartKey);
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

    if (!scheduledDate) {
      return (
        isActivityVisible(activity) &&
        activity.planningWeekStart === startKey
      );
    }

    return isActivityVisible(activity) && (
      scheduledDate >= startKey &&
      scheduledDate <= endKey
    );
  }).sort((a, b) => (a.sortOrder ?? a.id ?? 0) - (b.sortOrder ?? b.id ?? 0));
}

export async function getActivitiesForMonth(monthKey: string) {
  const { gridStart, gridEnd } = getMonthGridBounds(monthKey);

  for (
    let weekStart = gridStart;
    weekStart <= gridEnd;
    weekStart = addWeeks(weekStart, 1)
  ) {
    await materializeOccurrencesForWeek(toDateKey(weekStart));
  }

  const startKey = toDateKey(gridStart);
  const endKey = toDateKey(gridEnd);
  const currentWeekStart = getWeekStart();
  const activities = await db.plannedActivities.toArray();

  return activities
    .filter((activity) => {
      const scheduledDate = resolveScheduledDate(activity, currentWeekStart);
      return Boolean(
        scheduledDate &&
        scheduledDate >= startKey &&
        scheduledDate <= endKey &&
        isActivityVisible(activity)
      );
    })
    .sort((first, second) =>
      (first.scheduledDate ?? "").localeCompare(second.scheduledDate ?? "") ||
      (first.sortOrder ?? first.id ?? 0) - (second.sortOrder ?? second.id ?? 0)
    );
}

export async function createActivity(
  input: CreateActivityInput
) {
  return createActivityPlan(input);
}

export async function duplicateActivity(
  activity: PlannedActivity,
  destination: { scheduledDate?: string; planningWeekStart?: string } = {}
) {
  if (!activity.id) return;
  return duplicatePlannedActivity(activity.id, destination);
}

export async function renameActivity(
  activity: PlannedActivity,
  title: string
) {
  if (!activity.id) return;
  await updateActivityDetails(activity.id, { title });
}

export async function reorderActivities(ids: number[]) {
  await setPlannedActivityOrder(ids);
}

export async function moveActivities(
  activities: PlannedActivity[],
  scheduledDate: string
) {
  const ids = activities.flatMap((activity) =>
    activity.id ? [activity.id] : []
  );
  await movePlannedActivities(ids, scheduledDate);
}

export async function unscheduleActivity(
  activity: PlannedActivity,
  planningWeekStart: string
) {
  if (!activity.id) return;
  await unschedulePlannedActivity(activity.id, planningWeekStart);
}

export async function toggleActivity(
  activity: PlannedActivity
) {
  if (!activity.id) return;

  await togglePlannedActivity(activity.id);
}

export async function toggleImportant(
  activity: PlannedActivity
) {
  if (!activity.id) return;

  await toggleActivityImportance(activity.id);
}

export async function moveActivity(
  activity: PlannedActivity,
  scheduledDate: string,
  sortOrder = Date.now()
) {
  if (!activity.id) return;

  await movePlannedActivity(
    activity.id,
    scheduledDate,
    sortOrder
  );
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

export function buildPlannerMonthDays(
  monthKey: string,
  activities: PlannedActivity[],
  referenceDate = new Date()
): PlannerMonthDay[] {
  const { gridStart, gridEnd } = getMonthGridBounds(monthKey);
  const todayKey = toDateKey(referenceDate);
  const dayCount = Math.round(
    (Date.UTC(gridEnd.getFullYear(), gridEnd.getMonth(), gridEnd.getDate()) -
      Date.UTC(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate())) /
      86_400_000
  ) + 1;

  return Array.from({ length: dayCount }, (_, index) => {
    const date = addDays(gridStart, index);
    const dateKey = toDateKey(date);
    const dayName = dayNames[date.getDay()];

    return {
      date,
      dateKey,
      dayName,
      shortDayName: dayName.slice(0, 3),
      dayNumber: String(date.getDate()),
      isToday: dateKey === todayKey,
      isInMonth: toMonthKey(date) === monthKey,
      activities: activities.filter((activity) =>
        resolveScheduledDate(activity, getWeekStart(date)) === dateKey
      ),
    };
  });
}
