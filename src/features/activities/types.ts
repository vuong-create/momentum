import type {
  Difficulty,
  Pillar,
  PlannedActivity,
  RecurrencePattern,
} from "../../database/db";

export interface CreateActivityInput {
  title: string;
  scheduledDate?: string;
  planningWeekStart?: string;
  pillar?: Pillar;
  difficulty?: Difficulty;
  scheduledTime?: string;
  important?: boolean;
  notes?: string;
  recurrence?: RecurrencePattern;
  saveAsTemplate?: boolean;
}

export type ActivityDetailsPatch = Partial<
  Pick<
    PlannedActivity,
    | "title"
    | "pillar"
    | "scheduledDate"
    | "planningWeekStart"
    | "scheduledTime"
    | "important"
    | "notes"
    | "sortOrder"
    | "recurrenceOverride"
  >
>;

export interface CompletionResult {
  activityEventId: number;
  xpAwarded: number;
  wasAlreadyCompleted: boolean;
}
