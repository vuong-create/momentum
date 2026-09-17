import {
  db,
  type FinanceRecurrenceFrequency,
  type FinanceRecurrenceUnit,
  type FinanceRecurringTransaction,
} from "../../../database/db";
import { createFinanceTransaction, validateTransaction, type FinanceTransactionInput } from "./financeService";

export interface FinanceRecurringInput extends Omit<FinanceTransactionInput, "date" | "tags"> {
  frequency: FinanceRecurrenceFrequency;
  customInterval?: number;
  customUnit?: FinanceRecurrenceUnit;
  nextDate: string;
  endDate?: string;
}

function nowISO() { return new Date().toISOString(); }
function dateKey(date: Date) { return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-"); }

function addCalendarMonths(date: string, count: number) {
  const [year, month, day] = date.split("-").map(Number);
  const nextMonthIndex = month - 1 + count;
  const nextYear = year + Math.floor(nextMonthIndex / 12);
  const nextMonth = ((nextMonthIndex % 12) + 12) % 12;
  const lastDay = new Date(nextYear, nextMonth + 1, 0).getDate();
  return `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-${String(Math.min(day, lastDay)).padStart(2, "0")}`;
}

function addCalendarYears(date: string, count: number) {
  const [year, month, day] = date.split("-").map(Number);
  const nextYear = year + count;
  const lastDay = new Date(nextYear, month, 0).getDate();
  return `${nextYear}-${String(month).padStart(2, "0")}-${String(Math.min(day, lastDay)).padStart(2, "0")}`;
}

export function advanceRecurringDate(
  date: string,
  frequency: FinanceRecurrenceFrequency,
  customInterval = 1,
  customUnit: FinanceRecurrenceUnit = "months"
) {
  const interval = Math.max(1, Math.floor(customInterval));
  const [year, month, day] = date.split("-").map(Number);
  const unit = frequency === "custom"
    ? customUnit
    : frequency === "weekly"
      ? "weeks"
      : frequency === "yearly"
        ? "years"
        : "months";

  if (unit === "months") return addCalendarMonths(date, interval);
  if (unit === "years") return addCalendarYears(date, interval);

  const next = new Date(year, month - 1, day, 12);
  next.setDate(next.getDate() + interval * (unit === "weeks" ? 7 : 1));
  return dateKey(next);
}

export function recurringFrequencyLabel(
  frequency: FinanceRecurrenceFrequency,
  customInterval?: number,
  customUnit?: FinanceRecurrenceUnit
) {
  if (frequency !== "custom") {
    return frequency.charAt(0).toUpperCase() + frequency.slice(1);
  }

  const interval = Math.max(1, Math.floor(customInterval ?? 1));
  const unit = customUnit ?? "months";
  const unitLabel = interval === 1 ? unit.slice(0, -1) : unit;
  return `Every ${interval} ${unitLabel}`;
}

function normalize(input: FinanceRecurringInput, existing?: FinanceRecurringTransaction): FinanceRecurringTransaction {
  validateTransaction({ ...input, date: input.nextDate });
  if (!input.nextDate) throw new Error("Choose the next payment date.");
  if (input.endDate && input.endDate < input.nextDate) throw new Error("The end date must be after the next payment.");
  if (
    input.frequency === "custom" &&
    (!Number.isInteger(input.customInterval) || (input.customInterval ?? 0) < 1)
  ) {
    throw new Error("Custom frequency must repeat at least every 1 unit.");
  }
  const timestamp = nowISO();
  return {
    ...existing,
    type: input.type,
    merchant: input.merchant.trim() || (input.type === "transfer" ? "Transfer" : "Untitled"),
    amount: Math.round(Math.abs(Number(input.amount) || 0) * 100) / 100,
    accountId: input.type === "transfer" || input.type === "investment" ? undefined : input.accountId,
    fromAccountId: input.type === "transfer" || input.type === "investment" ? input.fromAccountId : undefined,
    toAccountId: input.type === "transfer" || input.type === "investment" ? input.toAccountId : undefined,
    categoryId: input.categoryId,
    category: input.category,
    notes: input.notes?.trim() || undefined,
    investmentHolding: input.type === "investment" ? input.investmentHolding?.trim() || undefined : undefined,
    frequency: input.frequency,
    customInterval: input.frequency === "custom" ? input.customInterval : undefined,
    customUnit: input.frequency === "custom" ? input.customUnit ?? "months" : undefined,
    nextDate: input.nextDate,
    endDate: input.endDate || undefined,
    active: existing?.active ?? true,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
    deletedAt: undefined,
  };
}

export function visibleFinanceRecurring(items: FinanceRecurringTransaction[]) { return items.filter((item) => !item.deletedAt).sort((a, b) => a.nextDate.localeCompare(b.nextDate) || a.merchant.localeCompare(b.merchant)); }
export function dueFinanceRecurring(items: FinanceRecurringTransaction[], today: string) { return visibleFinanceRecurring(items).filter((item) => item.active && item.nextDate <= today && (!item.endDate || item.nextDate <= item.endDate)); }

export async function createFinanceRecurring(input: FinanceRecurringInput) { return db.financeRecurringTransactions.add(normalize(input)); }
export async function updateFinanceRecurring(id: number, input: FinanceRecurringInput) {
  const existing = await db.financeRecurringTransactions.get(id); if (!existing || existing.deletedAt) throw new Error("Recurring item not found.");
  await db.financeRecurringTransactions.put({ ...normalize(input, existing), id });
}
export async function setFinanceRecurringActive(id: number, active: boolean) { await db.financeRecurringTransactions.update(id, { active, updatedAt: nowISO() }); }
export async function softDeleteFinanceRecurring(id: number) { await db.financeRecurringTransactions.update(id, { deletedAt: nowISO(), updatedAt: nowISO() }); }

async function advanceOccurrence(id: number, processedDate: string) {
  const item = await db.financeRecurringTransactions.get(id); if (!item || item.deletedAt) throw new Error("Recurring item not found.");
  const nextDate = advanceRecurringDate(
    processedDate,
    item.frequency,
    item.customInterval,
    item.customUnit
  );
  const active = item.active && (!item.endDate || nextDate <= item.endDate);
  await db.financeRecurringTransactions.update(id, { nextDate, active, lastProcessedDate: processedDate, updatedAt: nowISO() });
  return { nextDate, active };
}

export async function confirmFinanceRecurring(id: number) {
  return db.transaction("rw", db.financeRecurringTransactions, db.financeTransactions, db.financeAccounts, async () => {
    const item = await db.financeRecurringTransactions.get(id); if (!item || item.deletedAt || !item.active) throw new Error("Recurring item is not active.");
    const transactionId = await createFinanceTransaction({ date: item.nextDate, amount: item.amount, type: item.type, merchant: item.merchant, accountId: item.accountId, fromAccountId: item.fromAccountId, toAccountId: item.toAccountId, categoryId: item.categoryId, category: item.category, notes: item.notes, investmentHolding: item.investmentHolding });
    return { transactionId, processedDate: item.nextDate, ...(await advanceOccurrence(id, item.nextDate)) };
  });
}

export async function skipFinanceRecurring(id: number) {
  const item = await db.financeRecurringTransactions.get(id); if (!item || item.deletedAt || !item.active) throw new Error("Recurring item is not active.");
  return { processedDate: item.nextDate, ...(await advanceOccurrence(id, item.nextDate)) };
}
