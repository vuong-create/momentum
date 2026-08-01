import type {
  Difficulty,
  Pillar,
  PlannedActivity,
} from "../../database/db";

export type PlannerActivity = PlannedActivity;

export interface CreateActivityInput {
  title: string;
  scheduledDate: string;
  pillar?: Pillar;
  difficulty?: Difficulty;
  scheduledTime?: string;
  important?: boolean;
  notes?: string;
}

export interface PlannerDay {
  date: Date;
  dateKey: string;
  dayName: string;
  shortDayName: string;
  dayNumber: string;
  isToday: boolean;
  activities: PlannerActivity[];
}
