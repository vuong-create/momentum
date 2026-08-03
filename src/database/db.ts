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

export type ChineseActivityType =
  | "anki"
  | "tutor"
  | "music"
  | "podcast"
  | "video"
  | "conversation"
  | "reading"
  | "other";

export type ChineseActivityIntensity = "light" | "normal" | "strong";

export type ChineseEntryType = "word" | "phrase";

export type ChineseMediaType = "video" | "podcast" | "music" | "reading";

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
  activityKind?: string;
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
  activityKind?: string;
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

export type XPScope = "pillar" | "momentum";

export interface XPEvent {
  id?: number;
  amount: number;
  source: string;
  date: string;
  scope?: XPScope;
  actionType?: string;
  sourceType?: string;
  sourceId?: string;
  description?: string;
  dedupeKey?: string;
  activityEventId?: number;
  pillar?: Pillar;
  baseXP?: number;
  plannedBonusXP?: number;
  weeklyBonusXP?: number;
  weekStart?: string;
  finalXP?: number;
  voidedAt?: string;
}

export interface ChineseEntry {
  id?: number;
  traditional: string;
  pinyin: string;
  meaning: string;
  entryType: ChineseEntryType;
  example?: string;
  notes?: string;
  tags: string[];
  source?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface ChineseActivity {
  id?: number;
  type: ChineseActivityType;
  date: string;
  intensity: ChineseActivityIntensity;
  source?: string;
  notes?: string;
  plannedActivityId?: number;
  activityEventId?: number;
  xpEventId?: number;
  createdAt: string;
  deletedAt?: string;
}

export interface ChineseMediaResource {
  id?: number;
  title: string;
  url: string;
  type: ChineseMediaType;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export type AthleticsWorkoutKind = "gym" | "volleyball";
export type AthleticsWorkoutStatus = "active" | "completed";
export type VolleyballSessionType =
  | "practice"
  | "open-gym"
  | "tournament"
  | "coaching";
export type AthleticsPRType = "weight" | "reps";

export interface AthleticsTemplateExercise {
  id: string;
  name: string;
  defaultSets: number;
}

export interface AthleticsTemplate {
  id?: number;
  name: string;
  exercises: AthleticsTemplateExercise[];
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface AthleticsSet {
  id: string;
  weight: number;
  reps: number;
  completed: boolean;
  completedAt?: string;
}

export interface AthleticsWorkoutExercise {
  id: string;
  name: string;
  sets: AthleticsSet[];
}

export interface AthleticsPersonalRecord {
  exerciseName: string;
  type: AthleticsPRType;
  weight: number;
  reps: number;
  previousBest?: number;
}

export interface AthleticsWorkout {
  id?: number;
  kind: AthleticsWorkoutKind;
  name: string;
  date: string;
  status: AthleticsWorkoutStatus;
  templateId?: number;
  volleyballType?: VolleyballSessionType;
  exercises: AthleticsWorkoutExercise[];
  notes?: string;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
  plannedActivityId?: number;
  activityEventId?: number;
  xpEventId?: number;
  personalRecords: AthleticsPersonalRecord[];
  deletedAt?: string;
}

export interface StreakRecord {
  id?: number;
  date: string;
  completed: boolean;
}

export interface JournalEntry {
  id?: number;
  title?: string;
  text: string;
  createdAt: string;
  updatedAt: string;
  entryDate: string;
  deletedAt?: string;
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
  source?: string;
  favorite?: boolean;
  isBuiltIn?: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
}

export type LibraryBookStatus = "want-to-read" | "reading" | "finished";

export type BookSpineTone =
  | "stone"
  | "umber"
  | "sage"
  | "navy"
  | "wine";

export interface LibraryBook {
  id?: number;
  title: string;
  author?: string;
  status: LibraryBookStatus;
  startedDate?: string;
  finishedDate?: string;
  reflection?: string;
  favoriteQuote?: string;
  linkedJournalEntryId?: number;
  spineTone: BookSpineTone;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
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
  libraryBooks!: Table<LibraryBook>;
  chineseEntries!: Table<ChineseEntry>;
  chineseActivities!: Table<ChineseActivity>;
  chineseMediaResources!: Table<ChineseMediaResource>;
  athleticsTemplates!: Table<AthleticsTemplate>;
  athleticsWorkouts!: Table<AthleticsWorkout>;

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

    this.version(13).stores({
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
        "++id, createdAt, updatedAt, entryDate, deletedAt",
      libraryBooks:
        "++id, title, author, status, finishedDate, updatedAt, sortOrder, deletedAt",
      notes:
        "++id, createdAt, updatedAt",
      savedQuotes:
        "++id, &quoteKey, savedAt, favorite, isBuiltIn, deletedAt",
      appSettings:
        "&id",
    }).upgrade(async (transaction) => {
      await transaction
        .table("savedQuotes")
        .toCollection()
        .modify((quote) => {
          quote.favorite = quote.favorite ?? false;
          quote.isBuiltIn = quote.isBuiltIn ?? true;
          quote.createdAt = quote.createdAt ?? quote.savedAt;
          quote.updatedAt = quote.updatedAt ?? quote.savedAt;
        });
    });

    this.version(14).stores({
      plannedActivities:
        "++id, title, completed, status, date, day, scheduledDate, planningWeekStart, scheduledTime, pillar, sortOrder, deletedAt, templateId, recurrenceRuleId, recurrenceDate, &recurrenceKey",
      activityTemplates:
        "++id, title, pillar, saved, updatedAt, deletedAt",
      recurrenceRules:
        "++id, templateId, frequency, startDate, active, endDate",
      activityEvents:
        "++id, plannedActivityId, occurredAt, pillar, voidedAt",
      xpEvents:
        "++id, &dedupeKey, activityEventId, source, date, voidedAt, scope, pillar, actionType, sourceType, sourceId, weekStart",
      streakRecords:
        "++id, date, completed",
      journalEntries:
        "++id, createdAt, updatedAt, entryDate, deletedAt",
      libraryBooks:
        "++id, title, author, status, finishedDate, updatedAt, sortOrder, deletedAt",
      notes:
        "++id, createdAt, updatedAt",
      savedQuotes:
        "++id, &quoteKey, savedAt, favorite, isBuiltIn, deletedAt",
      appSettings:
        "&id",
    }).upgrade(async (transaction) => {
      await transaction
        .table("xpEvents")
        .toCollection()
        .modify((event) => {
          event.scope = event.scope ?? (event.pillar ? "pillar" : "momentum");

          if (event.source?.startsWith("activity:")) {
            event.actionType = event.actionType ?? "planned-activity-completed";
            event.sourceType = event.sourceType ?? "planned-activity";
            event.sourceId = event.sourceId ?? event.source.slice("activity:".length);
          }
        });
    });

    this.version(15).stores({
      plannedActivities:
        "++id, title, completed, status, date, day, scheduledDate, planningWeekStart, scheduledTime, pillar, activityKind, sortOrder, deletedAt, templateId, recurrenceRuleId, recurrenceDate, &recurrenceKey",
      activityTemplates:
        "++id, title, pillar, activityKind, saved, updatedAt, deletedAt",
      recurrenceRules:
        "++id, templateId, frequency, startDate, active, endDate",
      activityEvents:
        "++id, plannedActivityId, occurredAt, pillar, voidedAt",
      xpEvents:
        "++id, &dedupeKey, activityEventId, source, date, voidedAt, scope, pillar, actionType, sourceType, sourceId, weekStart",
      chineseEntries:
        "++id, traditional, pinyin, meaning, entryType, source, *tags, createdAt, updatedAt, deletedAt",
      chineseActivities:
        "++id, type, date, intensity, plannedActivityId, activityEventId, xpEventId, createdAt, deletedAt",
      streakRecords:
        "++id, date, completed",
      journalEntries:
        "++id, createdAt, updatedAt, entryDate, deletedAt",
      libraryBooks:
        "++id, title, author, status, finishedDate, updatedAt, sortOrder, deletedAt",
      notes:
        "++id, createdAt, updatedAt",
      savedQuotes:
        "++id, &quoteKey, savedAt, favorite, isBuiltIn, deletedAt",
      appSettings:
        "&id",
    });

    this.version(16).stores({
      chineseMediaResources:
        "++id, type, title, url, createdAt, updatedAt, deletedAt",
    });

    this.version(17).stores({
      athleticsTemplates:
        "++id, name, sortOrder, updatedAt, deletedAt",
      athleticsWorkouts:
        "++id, kind, status, date, completedAt, templateId, volleyballType, plannedActivityId, deletedAt",
    });
  }
}

export const db = new MomentumDatabase();
