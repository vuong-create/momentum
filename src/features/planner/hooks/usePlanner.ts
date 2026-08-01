import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";

import {
  addWeeks,
  buildPlannerDays,
  getActivitiesForWeek,
  getWeekStart,
  toDateKey,
} from "../services/plannerService";

export default function usePlanner() {
  const [weekStartKey, setWeekStartKey] =
    useState(() => toDateKey(getWeekStart()));

  const activities =
    useLiveQuery(
      () => getActivitiesForWeek(weekStartKey),
      [weekStartKey]
    ) ?? [];

  const days = useMemo(
    () => buildPlannerDays(weekStartKey, activities),
    [weekStartKey, activities]
  );

  const totalActivities = activities.length;

  const completedActivities = activities.filter(
    (activity) => activity.completed
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
  };
}