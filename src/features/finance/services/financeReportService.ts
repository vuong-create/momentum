import type { FinanceTransaction } from "../../../database/db";
import type { BudgetRow } from "./financeBudgetService";

export function getTopExpenseMerchants(transactions: FinanceTransaction[], periodPrefix: string, limit = 6) {
  const totals = new Map<string, number>();
  for (const item of transactions) {
    if (item.deletedAt || item.type !== "expense" || !item.date.startsWith(periodPrefix)) continue;
    const merchant = item.merchant.trim() || "Unlabeled";
    totals.set(merchant, (totals.get(merchant) ?? 0) + item.amount);
  }
  return [...totals].map(([merchant, amount]) => ({ merchant, amount: Math.round(amount * 100) / 100 })).sort((a, b) => b.amount - a.amount || a.merchant.localeCompare(b.merchant)).slice(0, limit);
}

export function getExpenseCategoryChanges(currentRows: BudgetRow[], previousRows: BudgetRow[], limit = 6) {
  const previous = new Map(previousRows.filter((row) => row.category.flowType === "expense").map((row) => [row.category.id!, row.actual]));
  return currentRows
    .filter((row) => row.category.flowType === "expense" && (row.actual > 0 || (previous.get(row.category.id!) ?? 0) > 0))
    .map((row) => ({ categoryId: row.category.id!, category: row.category.name, current: row.actual, previous: previous.get(row.category.id!) ?? 0, change: row.actual - (previous.get(row.category.id!) ?? 0) }))
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change) || a.category.localeCompare(b.category))
    .slice(0, limit);
}
