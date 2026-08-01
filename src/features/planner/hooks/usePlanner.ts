import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";

import {
  addWeeks,
  buildPlannerDays,
  createActivity,
  getActivitiesForWeek,
  getWeekStart,
  moveActivity,
  toggleActivity,
  toggleImportant,
  toDateKey,
} from "../services/plannerService";

import type { CreateActivityInput, PlannerActivity } from "../types";

export default function usePlanner() {
  const [weekStartKey, setWeekStartKey] =
    useState(() => toDateKey(getWeekStart()));

  const liveActivities = useLiveQuery(
    () => getActivitiesForWeek(weekStartKey),
    [weekStartKey]
  );

  const activities = useMemo(
    () => liveActivities ?? [],
    [liveActivities]
  );

  const days = useMemo(
    () => buildPlannerDays(weekStartKey, activities),
    [weekStartKey, activities]
  );

  const eligibleActivities = activities.filter(
    (activity) =>
      activity.status !== "cancelled" &&
      activity.status !== "dismissed"
  );

  const totalActivities = eligibleActivities.length;

  const completedActivities = eligibleActivities.filter(
    (activity) =>
      activity.status === "completed" || activity.completed
  ).length;

  const completionPercentage =
    totalActivities > 0
      ? Math.round(
          (completedActivities / totalActivities) * 100
        )
      : 0;

  function goToPreviousWeek() {
    setWeekStartKey((current) =>
      toDateKey(
        addWeeks(new Date(`${current}T00:00:00`), -1)
      )
    );
  }

  function goToNextWeek() {
    setWeekStartKey((current) =>
      toDateKey(
        addWeeks(new Date(`${current}T00:00:00`), 1)
      )
    );
  }

  function goToCurrentWeek() {
    setWeekStartKey(toDateKey(getWeekStart()));
  }

  async function addActivity(input: CreateActivityInput) {
    await createActivity(input);
  }

  async function completeActivity(activity: PlannerActivity) {
    await toggleActivity(activity);
  }

  async function rescheduleActivity(
    activity: PlannerActivity,
    scheduledDate: string
  ) {
    await moveActivity(activity, scheduledDate);
  }

  async function markImportant(activity: PlannerActivity) {
    await toggleImportant(activity);
  }

  return {
    weekStartKey,
    days,
    activities,
    totalActivities,
    completedActivities,
    completionPercentage,
    goToPreviousWeek,
    goToNextWeek,
    goToCurrentWeek,
    addActivity,
    completeActivity,
    rescheduleActivity,
    markImportant,
  };
}
