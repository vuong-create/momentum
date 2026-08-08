import { useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import type { ActivityTemplate } from "../../../database/db";
import {
  instantiateTemplate,
  listSavedTemplates,
} from "../../activities/services/recurrenceService";

import {
  addWeeks,
  buildPlannerDays,
  createActivity,
  duplicateActivity,
  getActivitiesForWeek,
  getWeekStart,
  moveActivity,
  moveActivities,
  moveUnscheduledActivitiesToDate,
  renameActivity,
  reorderActivities,
  toggleActivity,
  toggleImportant,
  toDateKey,
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

  useEffect(() => {
    void moveUnscheduledActivitiesToDate(toDateKey(new Date()));
  }, []);

  const liveActivities = useLiveQuery(
    () => getActivitiesForWeek(weekStartKey),
    [weekStartKey]
  );
  const liveTemplates = useLiveQuery(() => listSavedTemplates(), []);

  const activities = useMemo(
    () => liveActivities ?? [],
    [liveActivities]
  );
  const templates = liveTemplates ?? [];

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

  function goToDate(dateKey: string) {
    setWeekStartKey(toDateKey(getWeekStart(new Date(`${dateKey}T00:00:00`))));
  }

  async function addActivity(input: CreateActivityInput) {
    return createActivity(input);
  }

  async function addFromTemplate(
    template: ActivityTemplate,
    scheduledDate: string
  ) {
    return instantiateTemplate(template, scheduledDate);
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

  return {
    weekStartKey,
    days,
    activities,
    templates,
    totalActivities,
    completedActivities,
    completionPercentage,
    goToPreviousWeek,
    goToNextWeek,
    goToCurrentWeek,
    goToDate,
    addActivity,
    addFromTemplate,
    completeActivity,
    rescheduleActivity,
    markImportant,
    copyActivity,
    changeTitle,
    reorderActivityList,
    rescheduleActivities,
  };
}
