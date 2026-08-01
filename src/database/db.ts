import Dexie from "dexie";
import type { Table } from "dexie";

export type Pillar =
  | "core"
  | "chinese"
  | "athletics"
  | "cooking"
  | "finance"
  | "happiness";

export type Difficulty = "easy" | "medium" | "hard";

export type RecurrenceFrequency = "daily" | "weekly" | "monthly";

export interface RecurrencePattern {
  frequency: RecurrenceFrequency;
  interval: number;
  weekdays?: number[];
  monthDay?: number;
  endDate?: string;
}

export type ActivityStatus =
  | "planned"
  | "completed"
  | "dismissed"
  | "cancelled";

export type ActivityDisplayStatus =
  | ActivityStatus
  | "missed";

export interface PlannedActivity {
  id?: number;
  title: string;
  completed: boolean;
  status?: ActivityStatus;

  date: string;
  day: string;
  scheduledDate?: string;
  planningWeekStart?: string;
  scheduledTime?: string;
  sortOrder?: number;

  pillar: Pillar;
  xpReward: number;
  difficulty: Difficulty;
  important?: boolean;
  notes?: string;
  completedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  dismissedAt?: string;
  cancelledAt?: string;
  deletedAt?: string;
  templateId?: number;
  recurrenceRuleId?: number;
  recurrenceDate?: string;
  recurrenceKey?: string;
  recurrenceOverride?: boolean;
}

export interface ActivityTemplate {
  id?: number;
  title: string;
  pillar: Pillar;
  difficulty: Difficulty;
  scheduledTime?: string;
  important?: boolean;
  notes?: string;
  recurrencePreset?: RecurrencePattern;
  saved: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface RecurrenceRule extends RecurrencePattern {
  id?: number;
  templateId: number;
  startDate: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityEvent {
  id?: number;
  plannedActivityId: number;
  pillar: Pillar;
  occurredAt: string;
  effortTier: Difficulty;
  plannedBeforeCompletion: boolean;
  voidedAt?: string;
}

export interface XPEvent {
  id?: number;
  amount: number;
  source: string;
  date: string;
  dedupeKey?: string;
  activityEventId?: number;
  pillar?: Pillar;
  baseXP?: number;
  plannedBonusXP?: number;
  finalXP?: number;
  voidedAt?: string;
}

export interface StreakRecord {
  id?: number;
  date: string;
  completed: boolean;
}

export interface JournalEntry {
  id?: number;
  text: string;
  createdAt: string;
  updatedAt: string;
  entryDate: string;
}

export interface Note {
  id?: number;
  text: string;
  createdAt: string;
  updatedAt: string;
}

export interface SavedQuote {
  id?: number;
  quoteKey: string;
  text: string;
  author: string;
  savedAt: string;
}

export interface AppSettings {
  id: "preferences";
  soundsEnabled: boolean;
  animationsEnabled: boolean;
  updatedAt: string;
}

class MomentumDatabase extends Dexie {
  plannedActivities!: Table<PlannedActivity>;
  activityEvents!: Table<ActivityEvent>;
  xpEvents!: Table<XPEvent>;
  streakRecords!: Table<StreakRecord>;
  journalEntries!: Table<JournalEntry>;
  notes!: Table<Note>;
  savedQuotes!: Table<SavedQuote>;
  appSettings!: Table<AppSettings, "preferences">;
  activityTemplates!: Table<ActivityTemplate>;
  recurrenceRules!: Table<RecurrenceRule>;

  constructor() {
    super("MomentumDatabase");

    this.version(1).stores({
      plannedActivities: "++id, title, completed",
    });

    this.version(2).stores({
      plannedActivities:
        "++id, title, completed, date, pillar",
    });

    this.version(3).stores({
      plannedActivities:
        "++id, title, completed, date, day, pillar",
      xpEvents:
        "++id, amount, source, date",
    });

    this.version(4).stores({
      plannedActivities:
        "++id, title, completed, date, day, pillar",
      xpEvents:
        "++id, amount, source, date",
      streakRecords:
        "++id, date, completed",
    });

    this.version(5).stores({
      plannedActivities:
        "++id, title, completed, date, day, pillar",
      xpEvents:
        "++id, amount, source, date",
      streakRecords:
        "++id, date, completed",
      journalEntries:
        "++id, createdAt, updatedAt, entryDate",
    });

    this.version(6).stores({
      plannedActivities:
        "++id, title, completed, date, day, scheduledDate, pillar",
      xpEvents:
        "++id, amount, source, date",
      streakRecords:
        "++id, date, completed",
      journalEntries:
        "++id, createdAt, updatedAt, entryDate",
    });

    this.version(7).stores({
      plannedActivities:
        "++id, title, completed, date, day, scheduledDate, scheduledTime, pillar",
      xpEvents:
        "++id, amount, source, date",
      streakRecords:
        "++id, date, completed",
      journalEntries:
        "++id, createdAt, updatedAt, entryDate",
      notes:
        "++id, createdAt, updatedAt",
      savedQuotes:
        "++id, &quoteKey, savedAt",
    });

    this.version(8).stores({
      plannedActivities:
        "++id, title, completed, status, date, day, scheduledDate, scheduledTime, pillar, sortOrder",
      xpEvents:
        "++id, amount, source, date",
      streakRecords:
        "++id, date, completed",
      journalEntries:
        "++id, createdAt, updatedAt, entryDate",
      notes:
        "++id, createdAt, updatedAt",
      savedQuotes:
        "++id, &quoteKey, savedAt",
    }).upgrade(async (transaction) => {
      await transaction
        .table("plannedActivities")
        .toCollection()
        .modify((activity) => {
          activity.status = activity.completed
            ? "completed"
            : "planned";
          activity.important = activity.important ?? false;
          activity.sortOrder = activity.sortOrder ?? activity.id ?? 0;
        });
    });

    this.version(9).stores({
      plannedActivities:
        "++id, title, completed, status, date, day, scheduledDate, scheduledTime, pillar, sortOrder, deletedAt",
      activityEvents:
        "++id, plannedActivityId, occurredAt, pillar, voidedAt",
      xpEvents:
        "++id, &dedupeKey, activityEventId, source, date, voidedAt",
      streakRecords:
        "++id, date, completed",
      journalEntries:
        "++id, createdAt, updatedAt, entryDate",
      notes:
        "++id, createdAt, updatedAt",
      savedQuotes:
        "++id, &quoteKey, savedAt",
    }).upgrade(async (transaction) => {
      await transaction
        .table("plannedActivities")
        .toCollection()
        .modify((activity) => {
          const createdAt = activity.createdAt ?? activity.date;

          activity.status = activity.completed
            ? "completed"
            : activity.status ?? "planned";
          activity.createdAt = createdAt;
          activity.updatedAt = activity.updatedAt ?? createdAt;
        });
    });

    this.version(10).stores({
      plannedActivities:
        "++id, title, completed, status, date, day, scheduledDate, scheduledTime, pillar, sortOrder, deletedAt",
      activityEvents:
        "++id, plannedActivityId, occurredAt, pillar, voidedAt",
      xpEvents:
        "++id, &dedupeKey, activityEventId, source, date, voidedAt",
      streakRecords:
        "++id, date, completed",
      journalEntries:
        "++id, createdAt, updatedAt, entryDate",
      notes:
        "++id, createdAt, updatedAt",
      savedQuotes:
        "++id, &quoteKey, savedAt",
      appSettings:
        "&id",
    });

    this.version(11).stores({
      plannedActivities:
        "++id, title, completed, status, date, day, scheduledDate, planningWeekStart, scheduledTime, pillar, sortOrder, deletedAt",
      activityEvents:
        "++id, plannedActivityId, occurredAt, pillar, voidedAt",
      xpEvents:
        "++id, &dedupeKey, activityEventId, source, date, voidedAt",
      streakRecords:
        "++id, date, completed",
      journalEntries:
        "++id, createdAt, updatedAt, entryDate",
      notes:
        "++id, createdAt, updatedAt",
      savedQuotes:
        "++id, &quoteKey, savedAt",
      appSettings:
        "&id",
    });

    this.version(12).stores({
      plannedActivities:
        "++id, title, completed, status, date, day, scheduledDate, planningWeekStart, scheduledTime, pillar, sortOrder, deletedAt, templateId, recurrenceRuleId, recurrenceDate, &recurrenceKey",
      activityTemplates:
        "++id, title, pillar, saved, updatedAt, deletedAt",
      recurrenceRules:
        "++id, templateId, frequency, startDate, active, endDate",
      activityEvents:
        "++id, plannedActivityId, occurredAt, pillar, voidedAt",
      xpEvents:
        "++id, &dedupeKey, activityEventId, source, date, voidedAt",
      streakRecords:
        "++id, date, completed",
      journalEntries:
        "++id, createdAt, updatedAt, entryDate",
      notes:
        "++id, createdAt, updatedAt",
      savedQuotes:
        "++id, &quoteKey, savedAt",
      appSettings:
        "&id",
    });
  }
}

export const db = new MomentumDatabase();
