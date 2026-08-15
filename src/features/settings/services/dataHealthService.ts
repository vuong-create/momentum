import type Dexie from "dexie";

import { db } from "../../../database/db";
import {
  createMomentumBackup,
  validateMomentumBackup,
} from "./backupService";

type StoredRecord = Record<string, unknown>;

type RelationSpec = {
  sourceTable: string;
  sourceField: string;
  targetTable: string;
  label: string;
};

export interface DataHealthIssue {
  id: string;
  label: string;
  count: number;
}

export interface DataHealthReport {
  status: "healthy" | "attention";
  checkedAt: string;
  schemaVersion: number;
  tableCount: number;
  totalRecords: number;
  backupReady: boolean;
  issues: DataHealthIssue[];
}

const RELATIONS: RelationSpec[] = [
  { sourceTable: "activityEvents", sourceField: "plannedActivityId", targetTable: "plannedActivities", label: "Activity history without its Planner activity" },
  { sourceTable: "xpEvents", sourceField: "activityEventId", targetTable: "activityEvents", label: "XP history without its activity event" },
  { sourceTable: "plannedActivities", sourceField: "templateId", targetTable: "activityTemplates", label: "Planner activities without their template" },
  { sourceTable: "plannedActivities", sourceField: "recurrenceRuleId", targetTable: "recurrenceRules", label: "Planner activities without their recurrence rule" },
  { sourceTable: "recurrenceRules", sourceField: "templateId", targetTable: "activityTemplates", label: "Recurrence rules without their template" },
  { sourceTable: "chineseActivities", sourceField: "plannedActivityId", targetTable: "plannedActivities", label: "Chinese logs without their Planner activity" },
  { sourceTable: "chineseActivities", sourceField: "activityEventId", targetTable: "activityEvents", label: "Chinese logs without their activity event" },
  { sourceTable: "chineseActivities", sourceField: "xpEventId", targetTable: "xpEvents", label: "Chinese logs without their XP event" },
  { sourceTable: "athleticsWorkouts", sourceField: "plannedActivityId", targetTable: "plannedActivities", label: "Workouts without their Planner activity" },
  { sourceTable: "athleticsWorkouts", sourceField: "activityEventId", targetTable: "activityEvents", label: "Workouts without their activity event" },
  { sourceTable: "athleticsWorkouts", sourceField: "xpEventId", targetTable: "xpEvents", label: "Workouts without their XP event" },
  { sourceTable: "cookingMealLogs", sourceField: "recipeId", targetTable: "cookingRecipes", label: "Meal history without its recipe" },
  { sourceTable: "cookingMealLogs", sourceField: "plannedActivityId", targetTable: "plannedActivities", label: "Meal history without its Planner activity" },
  { sourceTable: "cookingMealLogs", sourceField: "activityEventId", targetTable: "activityEvents", label: "Meal history without its activity event" },
  { sourceTable: "cookingMealLogs", sourceField: "xpEventId", targetTable: "xpEvents", label: "Meal history without its XP event" },
  { sourceTable: "groceryItems", sourceField: "recipeId", targetTable: "cookingRecipes", label: "Grocery items without their recipe" },
  { sourceTable: "libraryBooks", sourceField: "linkedJournalEntryId", targetTable: "journalEntries", label: "Books without their linked journal entry" },
  { sourceTable: "financeTransactions", sourceField: "accountId", targetTable: "financeAccounts", label: "Transactions without their account" },
  { sourceTable: "financeTransactions", sourceField: "fromAccountId", targetTable: "financeAccounts", label: "Transfers without their source account" },
  { sourceTable: "financeTransactions", sourceField: "toAccountId", targetTable: "financeAccounts", label: "Transfers without their destination account" },
  { sourceTable: "financeTransactions", sourceField: "categoryId", targetTable: "financeCategories", label: "Transactions without their category" },
  { sourceTable: "financeTransactions", sourceField: "subcategoryId", targetTable: "financeSubcategories", label: "Transactions without their subcategory" },
  { sourceTable: "financeTransactions", sourceField: "importBatchId", targetTable: "financeImportBatches", label: "Imported transactions without their import record" },
  { sourceTable: "financeSubcategories", sourceField: "categoryId", targetTable: "financeCategories", label: "Finance subcategories without their category" },
  { sourceTable: "financeBudgetAllocations", sourceField: "categoryId", targetTable: "financeCategories", label: "Budget plans without their category" },
  { sourceTable: "financeBudgetAllocations", sourceField: "subcategoryId", targetTable: "financeSubcategories", label: "Budget plans without their subcategory" },
  { sourceTable: "financeGoals", sourceField: "accountId", targetTable: "financeAccounts", label: "Finance goals without their account" },
  { sourceTable: "focusSessions", sourceField: "activityId", targetTable: "plannedActivities", label: "Focus history without its Planner activity" },
];

function idSet(records: StoredRecord[]) {
  return new Set(
    records
      .map((record) => record.id)
      .filter((id): id is number | string => typeof id === "number" || typeof id === "string"),
  );
}

export async function auditMomentumData(
  database: Dexie = db,
): Promise<DataHealthReport> {
  await database.open();

  const recordsByTable: Record<string, StoredRecord[]> = {};
  await database.transaction("r", database.tables, async () => {
    for (const table of database.tables) {
      recordsByTable[table.name] = await table.toArray() as StoredRecord[];
    }
  });

  const issues: DataHealthIssue[] = [];
  for (const relation of RELATIONS) {
    const sources = recordsByTable[relation.sourceTable] ?? [];
    const targets = idSet(recordsByTable[relation.targetTable] ?? []);
    const count = sources.filter((record) => {
      const value = record[relation.sourceField];
      return value !== undefined && value !== null && !targets.has(value as number | string);
    }).length;

    if (count > 0) {
      issues.push({
        id: `${relation.sourceTable}.${relation.sourceField}`,
        label: relation.label,
        count,
      });
    }
  }

  let backupReady = true;
  try {
    const backup = await createMomentumBackup(database, undefined);
    validateMomentumBackup(structuredClone(backup), database);
  } catch {
    backupReady = false;
    issues.unshift({
      id: "backup-package",
      label: "The current data could not produce a verified backup",
      count: 1,
    });
  }

  const totalRecords = Object.values(recordsByTable).reduce(
    (total, records) => total + records.length,
    0,
  );

  return {
    status: issues.length ? "attention" : "healthy",
    checkedAt: new Date().toISOString(),
    schemaVersion: database.verno,
    tableCount: database.tables.length,
    totalRecords,
    backupReady,
    issues,
  };
}
