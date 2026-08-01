import { useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";

import {
  addWeeks,
  buildPlannerDays,
  createActivity,
  duplicateActivity,
  getActivitiesForWeek,
  getWeekStart,
  moveActivity,
  moveActivities,
  renameActivity,
  reorderActivities,
  toggleActivity,
  toggleImportant,
  toDateKey,
  unscheduleActivity,
} from "../services/plannerService";

import type { CreateActivityInput, PlannerActivity } from "../types";

export default function usePlanner() {
  const [weekStartKey, setWeekStartKey] =
    useState(() => {
      const saved = sessionStorage.getItem("momentum.planner.week");
      return /^\d{4}-\d{2}-\d{2}$/.test(saved ?? "")
        ? saved!
        : toDateKey(getWeekStart());
    });

  useEffect(() => {
    sessionStorage.setItem("momentum.planner.week", weekStartKey);
  }, [weekStartKey]);

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

  const unscheduledActivities = activities.filter(
    (activity) =>
      !activity.scheduledDate &&
      activity.planningWeekStart === weekStartKey
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

  async function copyActivity(
    activity: PlannerActivity,
    destination: { scheduledDate?: string; planningWeekStart?: string } = {}
  ) {
    return duplicateActivity(activity, destination);
  }

  async function changeTitle(activity: PlannerActivity, title: string) {
    await renameActivity(activity, title);
  }

  async function reorderActivityList(ids: number[]) {
    await reorderActivities(ids);
  }

  async function rescheduleActivities(
    selectedActivities: PlannerActivity[],
    scheduledDate: string
  ) {
    await moveActivities(selectedActivities, scheduledDate);
  }

  async function moveToUnscheduled(activity: PlannerActivity) {
    await unscheduleActivity(activity, weekStartKey);
  }

  return {
    weekStartKey,
    days,
    activities,
    unscheduledActivities,
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
    copyActivity,
    changeTitle,
    reorderActivityList,
    rescheduleActivities,
    moveToUnscheduled,
  };
}
