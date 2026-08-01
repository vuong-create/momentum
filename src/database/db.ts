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

export type ActivityStatus =
  | "planned"
  | "completed"
  | "missed"
  | "dismissed"
  | "cancelled";

export interface PlannedActivity {
  id?: number;
  title: string;
  completed: boolean;
  status?: ActivityStatus;

  date: string;
  day: string;
  scheduledDate?: string;
  scheduledTime?: string;
  sortOrder?: number;

  pillar: Pillar;
  xpReward: number;
  difficulty: Difficulty;
  important?: boolean;
  notes?: string;
  completedAt?: string;
}

export interface XPEvent {
  id?: number;
  amount: number;
  source: string;
  date: string;
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

class MomentumDatabase extends Dexie {
  plannedActivities!: Table<PlannedActivity>;
  xpEvents!: Table<XPEvent>;
  streakRecords!: Table<StreakRecord>;
  journalEntries!: Table<JournalEntry>;
  notes!: Table<Note>;
  savedQuotes!: Table<SavedQuote>;

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
  }
}

export const db = new MomentumDatabase();
