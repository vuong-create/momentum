import { db, type FinanceBudgetAllocation, type FinanceBudgetMonth, type FinanceCategory, type FinanceTransaction } from "../../../database/db";

function nowISO() { return new Date().toISOString(); }
function money(value: number) { return Math.round(Math.max(0, Number(value) || 0) * 100) / 100; }
export function previousMonthKey(month: string) { const [year, number] = month.split("-").map(Number); const date = new Date(year, number - 2, 1); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`; }
export function shiftMonthKey(month: string, offset: number) { const [year, number] = month.split("-").map(Number); const date = new Date(year, number - 1 + offset, 1); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`; }

export async function ensureBudgetMonth(month: string) {
  const existing = await db.financeBudgetMonths.where("month").equals(month).first();
  if (existing) return existing.id!;
  const timestamp = nowISO(); return db.financeBudgetMonths.add({ month, expectedIncome: 0, createdAt: timestamp, updatedAt: timestamp });
}

export async function setExpectedIncome(month: string, amount: number) {
  const id = await ensureBudgetMonth(month); await db.financeBudgetMonths.update(id, { expectedIncome: money(amount), updatedAt: nowISO() });
}

export async function setBudgetAllocation(month: string, categoryId: number, baseAmount: number) {
  const current = await db.financeBudgetAllocations.where("[month+categoryId]").equals([month, categoryId]).first();
  const timestamp = nowISO();
  if (current?.id) { await db.financeBudgetAllocations.update(current.id, { baseAmount: money(baseAmount), deletedAt: undefined, updatedAt: timestamp }); return current.id; }
  return db.financeBudgetAllocations.add({ month, categoryId, baseAmount: money(baseAmount), rolloverAmount: 0, createdAt: timestamp, updatedAt: timestamp });
}

export async function copyPreviousBudget(month: string) {
  const previous = previousMonthKey(month);
  const sourceMonth = await db.financeBudgetMonths.where("month").equals(previous).first();
  const sourceAllocations = (await db.financeBudgetAllocations.where("month").equals(previous).toArray()).filter((item) => !item.deletedAt && item.categoryId);
  if (!sourceMonth && !sourceAllocations.length) throw new Error("There is no previous budget to copy.");
  await db.transaction("rw", db.financeBudgetMonths, db.financeBudgetAllocations, async () => {
    if (sourceMonth) await setExpectedIncome(month, sourceMonth.expectedIncome);
    for (const allocation of sourceAllocations) await setBudgetAllocation(month, allocation.categoryId!, allocation.baseAmount);
  });
  return sourceAllocations.length;
}

export function categoryActual(month: string, category: FinanceCategory, transactions: FinanceTransaction[]) {
  return transactions.filter((item) => {
    if (item.deletedAt || !item.date.startsWith(month) || item.categoryId !== category.id) return false;
    if (category.flowType === "saving") return item.type === "transfer";
    return item.type === category.flowType;
  }).reduce((total, item) => total + item.amount, 0);
}

export interface BudgetRow extends FinanceBudgetAllocation {
  category: FinanceCategory;
  actual: number;
  available: number;
  remaining: number;
  percentage: number;
}

export function calculateBudgetRows(month: string, allocations: FinanceBudgetAllocation[], categories: FinanceCategory[], transactions: FinanceTransaction[]) {
  const monthAllocations = new Map(allocations.filter((item) => !item.deletedAt && item.month === month && item.categoryId).map((item) => [item.categoryId!, item]));
  return categories.filter((item) => !item.deletedAt).map((category): BudgetRow => {
    const allocation = monthAllocations.get(category.id!);
    const baseAmount = allocation?.baseAmount ?? 0; const rolloverAmount = allocation?.rolloverAmount ?? 0;
    const actual = categoryActual(month, category, transactions); const available = baseAmount + rolloverAmount;
    return { id: allocation?.id, month, categoryId: category.id, baseAmount, rolloverAmount, createdAt: allocation?.createdAt ?? "", updatedAt: allocation?.updatedAt ?? "", category, actual, available, remaining: available - actual, percentage: available > 0 ? actual / available * 100 : actual > 0 ? 100 : 0 };
  });
}

export function getBudgetSummary(month: FinanceBudgetMonth | undefined, rows: BudgetRow[], actualIncome: number) {
  const plannedIncome = rows.filter((row) => row.category.flowType === "income").reduce((total, row) => total + row.available, 0) || month?.expectedIncome || 0;
  const plannedOutflow = rows.filter((row) => row.category.flowType !== "income").reduce((total, row) => total + row.available, 0);
  const actualOutflow = rows.filter((row) => row.category.flowType !== "income").reduce((total, row) => total + row.actual, 0);
  return { expectedIncome: plannedIncome, actualIncome, budgeted: plannedOutflow, spent: actualOutflow, remaining: plannedOutflow - actualOutflow, unassigned: plannedIncome - plannedOutflow };
}

export interface MonthReviewRow extends BudgetRow { averageActual: number; }

export function calculateMonthReviewRows(month: string, allocations: FinanceBudgetAllocation[], categories: FinanceCategory[], transactions: FinanceTransaction[], averageMonths = 3) {
  return calculateBudgetRows(month, allocations, categories, transactions).map((row): MonthReviewRow => {
    const previousActuals = Array.from({ length: averageMonths }, (_, index) => categoryActual(shiftMonthKey(month, -(index + 1)), row.category, transactions));
    return { ...row, averageActual: previousActuals.reduce((total, value) => total + value, 0) / averageMonths };
  });
}
