import { DATA_RELATIONS } from "./dataRelations";

type RecordData = Record<string, unknown>;

const requiredFields: Record<string, Record<string, "string" | "number" | "boolean" | "array">> = {
  habits: { title: "string", pillar: "string", periods: "array" },
  plannedActivities: { title: "string", pillar: "string", completed: "boolean", difficulty: "string" },
  financeTransactions: { date: "string", amount: "number", type: "string", merchant: "string", tags: "array" },
  financeAccounts: { name: "string", type: "string", openingBalance: "number" },
  financeBudgetAllocations: { month: "string", baseAmount: "number", rolloverAmount: "number" },
  financeRecurringTransactions: { merchant: "string", amount: "number", nextDate: "string", frequency: "string", active: "boolean" },
  athleticsTrainingBlocks: { name: "string", startDate: "string", endDate: "string", active: "boolean" },
  athleticsBlockTemplates: { name: "string", weekCount: "number", days: "array", phases: "array" },
  athleticsPlannedSessions: { blockId: "number", date: "string", weekNumber: "number", name: "string", exercises: "array" },
  journalEntries: { text: "string", entryDate: "string" },
  notes: { text: "string" },
  cookingRecipes: { name: "string", ingredients: "array", instructions: "array", tags: "array" },
  chineseEntries: { traditional: "string", pinyin: "string", meaning: "string", tags: "array" },
  xpEvents: { amount: "number", source: "string", date: "string" },
};

const dateFields = new Set(["date", "entryDate", "scheduledDate", "originalScheduledDate", "startDate", "endDate", "nextDate", "deadline", "weekStart", "weekEnd", "planningWeekStart", "recurrenceDate"]);
const amountFields = new Set(["amount", "baseAmount", "rolloverAmount", "expectedIncome", "targetAmount"]);
const enums: Record<string, Record<string, string[]>> = {
  plannedActivities: { pillar: ["core", "chinese", "athletics", "cooking", "finance", "happiness"], difficulty: ["easy", "medium", "hard"], status: ["planned", "completed", "dismissed", "cancelled"] },
  financeTransactions: { type: ["expense", "income", "transfer", "investment", "adjustment"] },
  financeRecurringTransactions: { frequency: ["weekly", "monthly", "yearly", "custom"], customUnit: ["days", "weeks", "months", "years"] },
};

function isRecord(value: unknown): value is RecordData {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function isValidDateKey(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/** Validate before replacing any stored data; never coerce or silently repair a backup. */
export function validateBackupRecords(data: Record<string, unknown[]>) {
  const ids = new Map<string, Set<number | string>>();
  for (const [table, records] of Object.entries(data)) {
    const tableIds = new Set<number | string>();
    ids.set(table, tableIds);
    for (const candidate of records) {
      if (!isRecord(candidate)) throw new Error(`${table} contains an invalid record.`);
      const record = candidate;
      const id = record.id;
      const validId = typeof id === "number" ? Number.isSafeInteger(id) && id > 0 : typeof id === "string" && id.length > 0;
      if (!validId || tableIds.has(id as number | string)) throw new Error(`${table} has an invalid or duplicate record ID.`);
      tableIds.add(id as number | string);
      for (const [field, type] of Object.entries(requiredFields[table] ?? {})) {
        const valid = type === "array" ? Array.isArray(record[field]) : typeof record[field] === type;
        if (!valid) throw new Error(`${table} #${id}: ${field} is missing or invalid.`);
      }
      for (const [field, value] of Object.entries(record)) {
        if (value === undefined || value === null) continue;
        if (typeof value === "number" && !Number.isFinite(value)) throw new Error(`${table} #${id}: ${field} must be finite.`);
        if (amountFields.has(field) && (typeof value !== "number" || value < 0)) throw new Error(`${table} #${id}: ${field} must be a non-negative number.`);
        if (dateFields.has(field)) {
          // Legacy activity and XP dates may be ISO timestamps rather than day keys.
          const timestamp = (table === "plannedActivities" || table === "xpEvents") && field === "date";
          if (typeof value !== "string" || !(isValidDateKey(value) || (timestamp && isValidDateKey(value.slice(0, 10)) && Number.isFinite(Date.parse(value))))) throw new Error(`${table} #${id}: ${field} is not a valid date.`);
        }
        if ((field === "month" || field === "nextMonth") && (typeof value !== "string" || !isValidDateKey(`${value}-01`))) throw new Error(`${table} #${id}: ${field} is not a valid month.`);
        const allowed = enums[table]?.[field];
        if (allowed && !allowed.includes(String(value))) throw new Error(`${table} #${id}: ${field} has an unsupported value.`);
      }
      if (typeof record.startDate === "string" && typeof record.endDate === "string" && record.startDate > record.endDate) throw new Error(`${table} #${id}: end date precedes start date.`);
      if (table === "habits" && (!(record.periods as unknown[]).length || !(record.periods as unknown[]).every(p => isRecord(p) && typeof p.from === "string" && isValidDateKey(p.from) && (Number.isSafeInteger(p.ruleId) || (Number.isInteger(p.target) && Number(p.target) >= 1 && Number(p.target) <= 7))))) throw new Error("Invalid habit schedule.");
      if (table === "financeRecurringTransactions" && record.frequency === "custom" && (!Number.isSafeInteger(record.customInterval) || Number(record.customInterval) < 1 || !record.customUnit)) throw new Error(`${table} #${id}: custom frequency is invalid.`);
    }
  }
  for (const relation of DATA_RELATIONS) {
    for (const candidate of data[relation.sourceTable] ?? []) {
      const record = candidate as RecordData;
      const reference = record[relation.sourceField];
      if (reference !== undefined && reference !== null && !ids.get(relation.targetTable)?.has(reference as number | string)) throw new Error(`${relation.label} (${relation.sourceTable} #${record.id}).`);
    }
  }
}
