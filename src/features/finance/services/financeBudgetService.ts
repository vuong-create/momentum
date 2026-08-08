import { db, type FinanceBudgetAllocation, type FinanceBudgetMonth, type FinanceSubcategory, type FinanceTransaction } from "../../../database/db";

function nowISO() { return new Date().toISOString(); }
function money(value: number) { return Math.round(Math.max(0, Number(value) || 0) * 100) / 100; }
export function previousMonthKey(month: string) { const [year, number] = month.split("-").map(Number); const date = new Date(year, number - 2, 1); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`; }

export async function ensureBudgetMonth(month: string) {
  const existing = await db.financeBudgetMonths.where("month").equals(month).first();
  if (existing) return existing.id!;
  const timestamp = nowISO(); return db.financeBudgetMonths.add({ month, expectedIncome: 0, createdAt: timestamp, updatedAt: timestamp });
}

export async function setExpectedIncome(month: string, amount: number) {
  const id = await ensureBudgetMonth(month); await db.financeBudgetMonths.update(id, { expectedIncome: money(amount), updatedAt: nowISO() });
}

export async function setBudgetAllocation(month: string, subcategoryId: number, baseAmount: number) {
  const current = await db.financeBudgetAllocations.where("[month+subcategoryId]").equals([month, subcategoryId]).first();
  const timestamp = nowISO();
  if (current?.id) { await db.financeBudgetAllocations.update(current.id, { baseAmount: money(baseAmount), deletedAt: undefined, updatedAt: timestamp }); return current.id; }
  return db.financeBudgetAllocations.add({ month, subcategoryId, baseAmount: money(baseAmount), rolloverAmount: 0, createdAt: timestamp, updatedAt: timestamp });
}

export async function copyPreviousBudget(month: string) {
  const previous = previousMonthKey(month);
  const sourceMonth = await db.financeBudgetMonths.where("month").equals(previous).first();
  const sourceAllocations = (await db.financeBudgetAllocations.where("month").equals(previous).toArray()).filter((item) => !item.deletedAt);
  if (!sourceMonth && !sourceAllocations.length) throw new Error("There is no previous budget to copy.");
  await db.transaction("rw", db.financeBudgetMonths, db.financeBudgetAllocations, async () => {
    if (sourceMonth) await setExpectedIncome(month, sourceMonth.expectedIncome);
    for (const allocation of sourceAllocations) await setBudgetAllocation(month, allocation.subcategoryId, allocation.baseAmount);
  });
  return sourceAllocations.length;
}

export interface BudgetRow extends FinanceBudgetAllocation {
  subcategory: FinanceSubcategory;
  spent: number;
  available: number;
  remaining: number;
  percentage: number;
}

export function calculateBudgetRows(month: string, allocations: FinanceBudgetAllocation[], subcategories: FinanceSubcategory[], transactions: FinanceTransaction[]) {
  return allocations.filter((item) => !item.deletedAt && item.month === month).flatMap((allocation): BudgetRow[] => {
    const subcategory = subcategories.find((item) => item.id === allocation.subcategoryId); if (!subcategory) return [];
    const spent = transactions.filter((item) => !item.deletedAt && item.type === "expense" && item.date.startsWith(month) && item.subcategoryId === allocation.subcategoryId).reduce((total, item) => total + item.amount, 0);
    const available = allocation.baseAmount + allocation.rolloverAmount; const remaining = available - spent;
    return [{ ...allocation, subcategory, spent, available, remaining, percentage: available > 0 ? spent / available * 100 : spent > 0 ? 100 : 0 }];
  });
}

export function getBudgetSummary(month: FinanceBudgetMonth | undefined, rows: BudgetRow[], actualIncome: number) {
  const budgeted = rows.reduce((total, row) => total + row.available, 0); const spent = rows.reduce((total, row) => total + row.spent, 0);
  return { expectedIncome: month?.expectedIncome ?? 0, actualIncome, budgeted, spent, remaining: budgeted - spent };
}
