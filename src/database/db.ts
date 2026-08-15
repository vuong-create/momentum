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
  originalScheduledDate?: string;
  rescheduleCount?: number;
  lastRescheduledAt?: string;
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
  dayPresetId?: number;
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

export interface DayPresetItem {
  id: string;
  title: string;
  pillar: Pillar;
  difficulty: Difficulty;
  scheduledTime?: string;
  important?: boolean;
  notes?: string;
  activityKind?: string;
}

export interface DayPreset {
  id?: number;
  name: string;
  items: DayPresetItem[];
  sortOrder: number;
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

export interface WeeklyProgressResult {
  id?: number;
  weekStart: string;
  weekEnd: string;
  eligibleCount: number;
  completedCount: number;
  percentage: number;
  bonusXP: number;
  totalWeekXP: number;
  perfectWeek: boolean;
  settledAt: string;
  updatedAt: string;
  acknowledgedAt?: string;
}

export interface MilestoneSnapshot {
  id?: number;
  level: number;
  achievedAt: string;
  lifetimeXP: number;
  title: string;
  pillarXP: Partial<Record<Pillar, number>>;
  completedPlans: number;
  perfectWeeks: number;
  chineseActivities: number;
  athleticsActivities: number;
  mealsCooked: number;
  libraryEntries: number;
  financeActivities: number;
}

export interface ProgressionState {
  id: "global";
  lastRecognizedLevel: number;
  updatedAt: string;
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
  category?: JournalEntryCategory;
  promptId?: string;
  createdAt: string;
  updatedAt: string;
  entryDate: string;
  deletedAt?: string;
}

export type JournalEntryCategory =
  | "reflection"
  | "gratitude"
  | "memory"
  | "growth"
  | "ideas"
  | "books";

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

export type GroceryCategory =
  | "produce"
  | "meat-seafood"
  | "dairy"
  | "pantry"
  | "frozen"
  | "other";

export interface RecipeIngredient {
  id: string;
  name: string;
  quantity?: number;
  unit?: string;
  category: GroceryCategory;
}

export interface CookingRecipe {
  id?: number;
  name: string;
  defaultServings: number;
  prepMinutes?: number;
  ingredients: RecipeIngredient[];
  instructions: string[];
  notes?: string;
  tags: string[];
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface GroceryItem {
  id?: number;
  name: string;
  quantity?: number;
  unit?: string;
  category: GroceryCategory;
  checked: boolean;
  recipeId?: number;
  sourceRecipeName?: string;
  createdAt: string;
  updatedAt: string;
  checkedAt?: string;
  deletedAt?: string;
}

export interface CookingMealLog {
  id?: number;
  recipeId?: number;
  title: string;
  date: string;
  servings?: number;
  plannedActivityId?: number;
  activityEventId?: number;
  xpEventId?: number;
  completedAt: string;
  deletedAt?: string;
}

export type FinanceAccountType =
  | "checking"
  | "savings"
  | "credit"
  | "investment"
  | "retirement"
  | "cash";

export type FinanceTransactionType =
  | "expense"
  | "income"
  | "transfer"
  | "investment"
  | "adjustment";

export type FinanceCategoryFlow =
  | "expense"
  | "investment"
  | "income"
  | "saving";

export interface FinanceAccount {
  id?: number;
  name: string;
  type: FinanceAccountType;
  openingBalance: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface FinanceTransaction {
  id?: number;
  date: string;
  amount: number;
  type: FinanceTransactionType;
  merchant: string;
  accountId?: number;
  fromAccountId?: number;
  toAccountId?: number;
  categoryId?: number;
  subcategoryId?: number;
  category?: string;
  subcategory?: string;
  notes?: string;
  tags: string[];
  investmentHolding?: string;
  adjustmentDirection?: "increase" | "decrease";
  hiddenFromLedger?: boolean;
  importBatchId?: number;
  importFingerprint?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface FinanceCategory {
  id?: number;
  name: string;
  flowType: FinanceCategoryFlow;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface FinanceSubcategory {
  id?: number;
  categoryId: number;
  name: string;
  sortOrder: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface FinanceBudgetMonth {
  id?: number;
  month: string;
  expectedIncome: number;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceBudgetAllocation {
  id?: number;
  month: string;
  categoryId?: number;
  subcategoryId?: number;
  baseAmount: number;
  rolloverAmount: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export type FinanceGoalType = "balance" | "contribution";
export type FinanceGoalTimeframe = "monthly" | "yearly" | "custom";

export interface FinanceGoal {
  id?: number;
  name: string;
  goalType: FinanceGoalType;
  targetAmount: number;
  accountId: number;
  timeframe: FinanceGoalTimeframe;
  startDate: string;
  deadline?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface FinanceRolloverDecision {
  categoryId: number;
  amount: number;
}

export interface FinanceMonthlyReview {
  id?: number;
  month: string;
  nextMonth: string;
  income: number;
  spending: number;
  invested: number;
  saved: number;
  savingsRate: number;
  netWorth: number;
  rolloverEarned: number;
  rollovers: FinanceRolloverDecision[];
  reflectionWentWell?: string;
  reflectionChange?: string;
  reflectionRemember?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
  reopenedAt?: string;
}

export interface FinanceSnapshotAccount {
  accountId: number;
  name: string;
  type: FinanceAccountType;
  balance: number;
}

export interface FinanceNetWorthSnapshot {
  id?: number;
  snapshotKey: string;
  date: string;
  month: string;
  source: "monthly" | "manual";
  assets: number;
  liabilities: number;
  netWorth: number;
  accounts: FinanceSnapshotAccount[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface FinanceImportBatch {
  id?: number;
  fileName: string;
  fileFingerprint: string;
  importYear: number;
  importedCount: number;
  skippedCount: number;
  createdAccountIds: number[];
  createdAt: string;
  revertedAt?: string;
}

export interface AppSettings {
  id: "preferences";
  soundsEnabled: boolean;
  animationsEnabled: boolean;
  soundVolume: number;
  interfaceSoundsEnabled: boolean;
  actionSoundsEnabled: boolean;
  celebrationSoundsEnabled: boolean;
  soundscapeVolume: number;
  updatedAt: string;
}

export type FocusPhase = "focus" | "short-break" | "long-break";
export type FocusSessionStatus = "active" | "paused" | "completed" | "abandoned";

export interface FocusSession {
  id?: number;
  activityId: number;
  activityTitle: string;
  pillar: Pillar;
  status: FocusSessionStatus;
  phase: FocusPhase;
  focusMinutes: number;
  phaseDurationSeconds: number;
  remainingSeconds: number;
  phaseStartedAt?: string;
  phaseEndsAt?: string;
  completedCycles: number;
  focusedSeconds: number;
  startedAt: string;
  endedAt?: string;
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
  cookingRecipes!: Table<CookingRecipe>;
  groceryItems!: Table<GroceryItem>;
  cookingMealLogs!: Table<CookingMealLog>;
  financeAccounts!: Table<FinanceAccount>;
  financeTransactions!: Table<FinanceTransaction>;
  financeCategories!: Table<FinanceCategory>;
  financeSubcategories!: Table<FinanceSubcategory>;
  financeBudgetMonths!: Table<FinanceBudgetMonth>;
  financeBudgetAllocations!: Table<FinanceBudgetAllocation>;
  financeGoals!: Table<FinanceGoal>;
  financeMonthlyReviews!: Table<FinanceMonthlyReview>;
  financeNetWorthSnapshots!: Table<FinanceNetWorthSnapshot>;
  financeImportBatches!: Table<FinanceImportBatch>;
  focusSessions!: Table<FocusSession>;
  dayPresets!: Table<DayPreset>;
  weeklyProgressResults!: Table<WeeklyProgressResult>;
  milestoneSnapshots!: Table<MilestoneSnapshot>;
  progressionState!: Table<ProgressionState, "global">;

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

    this.version(18).stores({
      plannedActivities:
        "++id, title, completed, status, date, day, scheduledDate, planningWeekStart, scheduledTime, pillar, activityKind, sortOrder, deletedAt, templateId, recurrenceRuleId, recurrenceDate, &recurrenceKey",
    }).upgrade(async (transaction) => {
      await transaction
        .table("plannedActivities")
        .toCollection()
        .modify((activity) => {
          activity.originalScheduledDate =
            activity.originalScheduledDate ?? activity.scheduledDate;
          activity.rescheduleCount = activity.rescheduleCount ?? 0;
        });
    });

    this.version(19).stores({
      journalEntries:
        "++id, createdAt, updatedAt, entryDate, category, promptId, deletedAt",
    });

    this.version(20).stores({
      cookingRecipes:
        "++id, name, favorite, updatedAt, *tags, deletedAt",
      groceryItems:
        "++id, name, category, checked, recipeId, updatedAt, deletedAt",
      cookingMealLogs:
        "++id, recipeId, date, plannedActivityId, completedAt, deletedAt",
    });

    this.version(21).stores({
      financeAccounts:
        "++id, name, type, updatedAt, deletedAt",
      financeTransactions:
        "++id, date, type, accountId, fromAccountId, toAccountId, merchant, category, subcategory, updatedAt, *tags, deletedAt",
    });

    this.version(22).stores({
      financeTransactions:
        "++id, date, type, accountId, fromAccountId, toAccountId, categoryId, subcategoryId, merchant, category, subcategory, updatedAt, *tags, deletedAt",
      financeCategories:
        "++id, name, sortOrder, updatedAt, deletedAt",
      financeSubcategories:
        "++id, categoryId, name, sortOrder, isDefault, updatedAt, deletedAt",
      financeBudgetMonths:
        "++id, &month, updatedAt",
      financeBudgetAllocations:
        "++id, month, subcategoryId, &[month+subcategoryId], updatedAt, deletedAt",
      financeNetWorthSnapshots:
        "++id, &snapshotKey, date, month, source, updatedAt, deletedAt",
    });

    this.version(23).stores({
      financeCategories:
        "++id, name, flowType, sortOrder, updatedAt, deletedAt",
      financeBudgetAllocations:
        "++id, month, categoryId, subcategoryId, &[month+categoryId], updatedAt, deletedAt",
    });

    this.version(24).stores({
      financeTransactions:
        "++id, date, type, accountId, fromAccountId, toAccountId, categoryId, merchant, updatedAt, importBatchId, importFingerprint, *tags, deletedAt",
      financeImportBatches:
        "++id, createdAt, fileName, fileFingerprint, importYear, revertedAt",
    });

    this.version(25).stores({
      financeTransactions:
        "++id, date, type, accountId, fromAccountId, toAccountId, categoryId, merchant, updatedAt, importBatchId, importFingerprint, *tags, deletedAt",
    }).upgrade(async (transaction) => {
      await transaction
        .table("financeTransactions")
        .toCollection()
        .modify((item) => {
          if (item.type === "investment" && item.accountId && !item.fromAccountId) {
            item.fromAccountId = item.accountId;
            item.accountId = undefined;
          }
          item.hiddenFromLedger = item.hiddenFromLedger ?? item.type === "adjustment";
        });
    });

    this.version(26).stores({
      financeGoals:
        "++id, goalType, accountId, timeframe, deadline, updatedAt, deletedAt",
      financeMonthlyReviews:
        "++id, &month, closedAt, updatedAt",
    });

    this.version(27).stores({
      focusSessions:
        "++id, activityId, status, phase, startedAt, endedAt, updatedAt",
    });

    this.version(28).stores({
      appSettings: "&id",
    }).upgrade(async (transaction) => {
      await transaction.table("appSettings").toCollection().modify((settings) => {
        settings.soundVolume = settings.soundVolume ?? 0.6;
        settings.interfaceSoundsEnabled = settings.interfaceSoundsEnabled ?? true;
        settings.actionSoundsEnabled = settings.actionSoundsEnabled ?? true;
        settings.celebrationSoundsEnabled = settings.celebrationSoundsEnabled ?? true;
        settings.soundscapeVolume = settings.soundscapeVolume ?? 0.35;
      });
    });

    this.version(29).stores({
      dayPresets:
        "++id, name, sortOrder, updatedAt, deletedAt",
      weeklyProgressResults:
        "++id, &weekStart, weekEnd, percentage, perfectWeek, acknowledgedAt",
      milestoneSnapshots:
        "++id, &level, achievedAt",
      progressionState:
        "&id",
    });
  }
}

export const db = new MomentumDatabase();
