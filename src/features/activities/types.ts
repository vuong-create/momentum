import type {
  Difficulty,
  Pillar,
  PlannedActivity,
} from "../../database/db";

export interface CreateActivityInput {
  title: string;
  scheduledDate: string;
  pillar?: Pillar;
  difficulty?: Difficulty;
  scheduledTime?: string;
  important?: boolean;
  notes?: string;
}

export type ActivityDetailsPatch = Partial<
  Pick<
    PlannedActivity,
    | "title"
    | "pillar"
    | "scheduledDate"
    | "scheduledTime"
    | "important"
    | "notes"
    | "sortOrder"
  >
>;

export interface CompletionResult {
  activityEventId: number;
  xpAwarded: number;
  wasAlreadyCompleted: boolean;
}
