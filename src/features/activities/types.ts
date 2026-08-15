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
  activityKind?: string;
  difficulty?: Difficulty;
  scheduledTime?: string;
  important?: boolean;
  notes?: string;
  recurrence?: RecurrencePattern;
  saveAsTemplate?: boolean;
  dayPresetId?: number;
}

export type ActivityDetailsPatch = Partial<
  Pick<
    PlannedActivity,
    | "title"
    | "pillar"
    | "activityKind"
    | "difficulty"
    | "xpReward"
    | "scheduledDate"
    | "originalScheduledDate"
    | "rescheduleCount"
    | "lastRescheduledAt"
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
