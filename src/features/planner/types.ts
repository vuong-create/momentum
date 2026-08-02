import type { PlannedActivity } from "../../database/db";

import type { CreateActivityInput } from "../activities/types";

export type PlannerActivity = PlannedActivity;

export type { CreateActivityInput };

export interface PlannerDay {
  date: Date;
  dateKey: string;
  dayName: string;
  shortDayName: string;
  dayNumber: string;
  isToday: boolean;
  activities: PlannerActivity[];
}

export interface PlannerMonthDay extends PlannerDay {
  isInMonth: boolean;
}
