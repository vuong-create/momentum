import { db, type FinanceAccount, type FinanceBudgetAllocation, type FinanceBudgetMonth, type FinanceCategory, type FinanceMonthlyReview, type FinanceRolloverDecision, type FinanceTransaction } from "../../../database/db";
import { calculateBudgetRows, shiftMonthKey } from "./financeBudgetService";
import { getMonthSummary, getNetWorth } from "./financeCalculations";
import { upsertMonthlyNetWorthSnapshot } from "./financeSnapshotService";

export interface FinanceCloseReflections {
  wentWell?: string;
  change?: string;
  remember?: string;
}

export interface FinanceCloseReadiness {
  uncategorized: number;
  overBudget: number;
  unplanned: number;
  positiveRollover: number;
  rolloverCandidates: Array<{ categoryId: number; categoryName: string; amount: number }>;
}

function nowISO() { return new Date().toISOString(); }
function money(value: number) { return Math.round(Math.max(0, Number(value) || 0) * 100) / 100; }
function monthEndDate(month: string) { const [year, number] = month.split("-").map(Number); return new Date(year, number, 0, 12); }

export function visibleFinanceReviews(reviews: FinanceMonthlyReview[]) { return reviews.filter((review) => Boolean(review.closedAt)).sort((a, b) => a.month.localeCompare(b.month)); }

export function getFinanceCloseReadiness(month: string, allocations: FinanceBudgetAllocation[], categories: FinanceCategory[], transactions: FinanceTransaction[]): FinanceCloseReadiness {
  const rows = calculateBudgetRows(month, allocations, categories, transactions);
  const expenses = rows.filter((row) => row.category.flowType === "expense");
  const rolloverCandidates = expenses.filter((row) => row.available > 0 && row.remaining > 0).map((row) => ({ categoryId: row.category.id!, categoryName: row.category.name, amount: money(row.remaining) }));
  const active = transactions.filter((item) => !item.deletedAt && item.date.startsWith(month));
  return {
    uncategorized: active.filter((item) => item.type === "expense" && !item.categoryId).length,
    overBudget: expenses.filter((row) => row.available > 0 && row.actual > row.available).length,
    unplanned: expenses.filter((row) => row.actual > 0 && row.available === 0).length,
    positiveRollover: rolloverCandidates.reduce((total, item) => total + item.amount, 0),
    rolloverCandidates,
  };
}

export async function closeFinanceMonth(input: {
  month: string;
  accounts: FinanceAccount[];
  transactions: FinanceTransaction[];
  categories: FinanceCategory[];
  budgetMonths: FinanceBudgetMonth[];
  allocations: FinanceBudgetAllocation[];
  rollovers: FinanceRolloverDecision[];
  reflections: FinanceCloseReflections;
}) {
  const existing = await db.financeMonthlyReviews.where("month").equals(input.month).first();
  if (existing?.closedAt) throw new Error("This month is already closed.");
  const nextMonth = shiftMonthKey(input.month, 1); const timestamp = nowISO();
  const allowed = new Map(getFinanceCloseReadiness(input.month, input.allocations, input.categories, input.transactions).rolloverCandidates.map((item) => [item.categoryId, item.amount]));
  const rollovers = input.rollovers.filter((item) => allowed.has(item.categoryId)).map((item) => ({ categoryId: item.categoryId, amount: Math.min(money(item.amount), allowed.get(item.categoryId)!) })).filter((item) => item.amount > 0);
  const rolloverMap = new Map(rollovers.map((item) => [item.categoryId, item.amount]));
  const sourceAllocations = input.allocations.filter((item) => !item.deletedAt && item.month === input.month && item.categoryId);
  const currentMonth = input.budgetMonths.find((item) => item.month === input.month);
  const summary = getMonthSummary(input.transactions, input.month, input.categories);
  const closeDate = monthEndDate(input.month); const closeDateKey = `${input.month}-${String(closeDate.getDate()).padStart(2, "0")}`;
  const throughClose = input.transactions.filter((item) => item.date <= closeDateKey);
  const review: FinanceMonthlyReview = {
    ...existing,
    month: input.month,
    nextMonth,
    income: summary.income,
    spending: summary.expenses,
    invested: summary.invested,
    saved: summary.saved,
    savingsRate: summary.savingsRate,
    netWorth: getNetWorth(input.accounts, throughClose),
    rolloverEarned: rollovers.reduce((total, item) => total + item.amount, 0),
    rollovers,
    reflectionWentWell: input.reflections.wentWell?.trim() || undefined,
    reflectionChange: input.reflections.change?.trim() || undefined,
    reflectionRemember: input.reflections.remember?.trim() || undefined,
    closedAt: timestamp,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
    reopenedAt: undefined,
  };

  await db.transaction("rw", db.financeBudgetMonths, db.financeBudgetAllocations, db.financeMonthlyReviews, async () => {
    const nextBudgetMonth = await db.financeBudgetMonths.where("month").equals(nextMonth).first();
    if (nextBudgetMonth?.id) await db.financeBudgetMonths.update(nextBudgetMonth.id, { expectedIncome: nextBudgetMonth.expectedIncome || currentMonth?.expectedIncome || 0, updatedAt: timestamp });
    else await db.financeBudgetMonths.add({ month: nextMonth, expectedIncome: currentMonth?.expectedIncome || 0, createdAt: timestamp, updatedAt: timestamp });

    for (const allocation of sourceAllocations) {
      const categoryId = allocation.categoryId!; const next = await db.financeBudgetAllocations.where("[month+categoryId]").equals([nextMonth, categoryId]).first();
      const values = { month: nextMonth, categoryId, baseAmount: next?.baseAmount ?? allocation.baseAmount, rolloverAmount: rolloverMap.get(categoryId) ?? 0, createdAt: next?.createdAt ?? timestamp, updatedAt: timestamp, deletedAt: undefined };
      if (next?.id) await db.financeBudgetAllocations.put({ ...next, ...values, id: next.id }); else await db.financeBudgetAllocations.add(values);
    }
    await db.financeMonthlyReviews.put(review);
  });
  await upsertMonthlyNetWorthSnapshot(input.accounts, throughClose, closeDate);
  return review;
}

export async function reopenFinanceMonth(month: string) {
  const review = await db.financeMonthlyReviews.where("month").equals(month).first();
  if (!review?.closedAt) throw new Error("This month is not closed.");
  const following = await db.financeMonthlyReviews.where("month").equals(review.nextMonth).first();
  if (following?.closedAt) throw new Error("Reopen the following closed month first.");
  const timestamp = nowISO();
  await db.transaction("rw", db.financeBudgetAllocations, db.financeMonthlyReviews, async () => {
    for (const rollover of review.rollovers) {
      const next = await db.financeBudgetAllocations.where("[month+categoryId]").equals([review.nextMonth, rollover.categoryId]).first();
      if (next?.id) await db.financeBudgetAllocations.update(next.id, { rolloverAmount: 0, updatedAt: timestamp });
    }
    await db.financeMonthlyReviews.update(review.id!, { closedAt: undefined, reopenedAt: timestamp, updatedAt: timestamp });
  });
}
