import type {
  FinanceAccount,
  FinanceCategory,
  FinanceRecurringTransaction,
  FinanceTransaction,
} from "../../../database/db";
import type { BudgetRow } from "./financeBudgetService";
import { getMonthSummary } from "./financeCalculations";
import { auditFinanceTransactions } from "./financeLedgerDataService";

export type FinancePaceStatus = "unplanned" | "on-pace" | "running-warm" | "over-plan";

export interface FinanceMonthPace {
  day: number;
  daysInMonth: number;
  calendarPercentage: number;
  planned: number;
  spent: number;
  remaining: number;
  spendingPercentage: number;
  dailyAverage: number;
  projected: number;
  status: FinancePaceStatus;
}

export interface FinanceAttentionItem {
  id: string;
  label: string;
  detail: string;
  tone: "calm" | "watch" | "urgent";
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function dateKey(date: Date) {
  return `${monthKey(date)}-${String(date.getDate()).padStart(2, "0")}`;
}

export function getFinanceMonthPace(rows: BudgetRow[], now: Date): FinanceMonthPace {
  const expenseRows = rows.filter((row) => row.category.flowType === "expense");
  const planned = expenseRows.reduce((total, row) => total + row.available, 0);
  const spent = expenseRows.reduce((total, row) => total + row.actual, 0);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const day = Math.min(daysInMonth, Math.max(1, now.getDate()));
  const calendarPercentage = day / daysInMonth * 100;
  const spendingPercentage = planned > 0 ? spent / planned * 100 : 0;
  const dailyAverage = spent / day;
  const projected = dailyAverage * daysInMonth;
  const status: FinancePaceStatus = planned <= 0
    ? "unplanned"
    : spent > planned
      ? "over-plan"
      : spendingPercentage > calendarPercentage + 10
        ? "running-warm"
        : "on-pace";

  return {
    day,
    daysInMonth,
    calendarPercentage,
    planned,
    spent,
    remaining: planned - spent,
    spendingPercentage,
    dailyAverage,
    projected,
    status,
  };
}

export function getSameDayAllocationComparison(
  transactions: FinanceTransaction[],
  now: Date,
  categories: FinanceCategory[],
) {
  const currentMonth = monthKey(now);
  const previousDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonth = monthKey(previousDate);
  const previousMonthLastDay = new Date(
    previousDate.getFullYear(),
    previousDate.getMonth() + 1,
    0,
  ).getDate();
  const comparisonDay = Math.min(now.getDate(), previousMonthLastDay);
  const previousCutoff = `${previousMonth}-${String(comparisonDay).padStart(2, "0")}`;
  const current = getMonthSummary(transactions, currentMonth, categories);
  const previous = getMonthSummary(
    transactions.filter((item) => !item.date.startsWith(previousMonth) || item.date <= previousCutoff),
    previousMonth,
    categories,
  );
  const allocated = current.expenses + current.invested + current.saved;
  const previousAllocated = previous.expenses + previous.invested + previous.saved;

  return {
    allocated,
    previousAllocated,
    delta: allocated - previousAllocated,
    comparisonDay,
  };
}

export function getFinanceAttention(
  transactions: FinanceTransaction[],
  accounts: FinanceAccount[],
  categories: FinanceCategory[],
  rows: BudgetRow[],
  now: Date,
): FinanceAttentionItem[] {
  const currentMonth = monthKey(now);
  const activeCategories = new Set(
    categories.filter((category) => !category.deletedAt).map((category) => category.id),
  );
  const expenseRows = rows.filter((row) => row.category.flowType === "expense");
  const overPlan = expenseRows.filter((row) => row.available > 0 && row.actual > row.available);
  const approaching = expenseRows.filter((row) => (
    row.available > 0 && row.actual <= row.available && row.percentage >= 80
  ));
  const uncategorized = transactions.filter((item) => (
    !item.deletedAt
    && item.type === "expense"
    && item.date.startsWith(currentMonth)
    && (!item.categoryId || !activeCategories.has(item.categoryId))
  ));
  const audit = auditFinanceTransactions(transactions, accounts, categories);
  const items: FinanceAttentionItem[] = [];

  if (overPlan.length) {
    items.push({
      id: "over-plan",
      label: `${overPlan.length} ${overPlan.length === 1 ? "category is" : "categories are"} over plan`,
      detail: overPlan.slice(0, 3).map((row) => row.category.name).join(" · "),
      tone: "urgent",
    });
  }
  if (approaching.length) {
    items.push({
      id: "approaching",
      label: `${approaching.length} nearing ${approaching.length === 1 ? "its" : "their"} limit`,
      detail: approaching.slice(0, 3).map((row) => row.category.name).join(" · "),
      tone: "watch",
    });
  }
  if (uncategorized.length) {
    items.push({
      id: "uncategorized",
      label: `${uncategorized.length} uncategorized ${uncategorized.length === 1 ? "expense" : "expenses"}`,
      detail: "Assign categories to keep budgets accurate.",
      tone: "watch",
    });
  }
  if (audit.errorCount || audit.reviewCount) {
    const issueCount = audit.errorCount + audit.reviewCount;
    items.push({
      id: "ledger-review",
      label: `${issueCount} ledger ${issueCount === 1 ? "item needs" : "items need"} review`,
      detail: audit.errorCount
        ? `${audit.errorCount} ${audit.errorCount === 1 ? "error" : "errors"} should be checked.`
        : "Possible duplicates or naming variations were found.",
      tone: audit.errorCount ? "urgent" : "calm",
    });
  }

  return items.slice(0, 4);
}

export function getUpcomingFinanceRecurring(
  items: FinanceRecurringTransaction[],
  now: Date,
  limit = 4,
) {
  const today = dateKey(now);
  return items
    .filter((item) => !item.deletedAt && item.active && (!item.endDate || item.nextDate <= item.endDate))
    .sort((left, right) => left.nextDate.localeCompare(right.nextDate) || left.merchant.localeCompare(right.merchant))
    .slice(0, limit)
    .map((item) => ({ ...item, overdue: item.nextDate < today }));
}
