import { describe, expect, it } from "vitest";

import type {
  FinanceAccount,
  FinanceCategory,
  FinanceRecurringTransaction,
  FinanceTransaction,
} from "../../../database/db";
import type { BudgetRow } from "./financeBudgetService";
import {
  getFinanceAttention,
  getFinanceMonthPace,
  getSameDayAllocationComparison,
  getUpcomingFinanceRecurring,
} from "./financeOverviewService";

const now = new Date("2026-10-20T12:00:00");
const createdAt = "2026-10-01T12:00:00.000Z";
const accounts: FinanceAccount[] = [{ id: 1, name: "Checking", type: "checking", openingBalance: 0, createdAt, updatedAt: createdAt }];
const categories: FinanceCategory[] = [
  { id: 1, name: "Dining", flowType: "expense", sortOrder: 1, createdAt, updatedAt: createdAt },
  { id: 2, name: "Groceries", flowType: "expense", sortOrder: 2, createdAt, updatedAt: createdAt },
];

function row(category: FinanceCategory, actual: number, available: number): BudgetRow {
  return {
    month: "2026-10",
    categoryId: category.id,
    category,
    actual,
    available,
    remaining: available - actual,
    percentage: available > 0 ? actual / available * 100 : actual > 0 ? 100 : 0,
    baseAmount: available,
    rolloverAmount: 0,
    createdAt,
    updatedAt: createdAt,
  };
}

function transaction(input: Partial<FinanceTransaction>): FinanceTransaction {
  return {
    id: input.id ?? 1,
    date: input.date ?? "2026-10-10",
    amount: input.amount ?? 20,
    type: input.type ?? "expense",
    merchant: input.merchant ?? "Cafe",
    accountId: input.accountId ?? 1,
    categoryId: input.categoryId,
    category: input.category,
    tags: [],
    createdAt,
    updatedAt: createdAt,
    ...input,
  };
}

describe("finance overview insights", () => {
  it("calculates calendar pace and projected spending without changing budget rows", () => {
    const rows = [row(categories[0], 700, 800), row(categories[1], 200, 400)];
    const snapshot = structuredClone(rows);
    expect(getFinanceMonthPace(rows, now)).toMatchObject({
      day: 20,
      daysInMonth: 31,
      planned: 1200,
      spent: 900,
      remaining: 300,
      projected: 1395,
      status: "running-warm",
    });
    expect(rows).toEqual(snapshot);
  });

  it("compares the current allocation with the same point last month", () => {
    const transactions = [
      transaction({ id: 1, date: "2026-10-10", amount: 100, categoryId: 1 }),
      transaction({ id: 2, date: "2026-09-10", amount: 80, categoryId: 1 }),
      transaction({ id: 3, date: "2026-09-28", amount: 900, categoryId: 1 }),
    ];
    expect(getSameDayAllocationComparison(transactions, now, categories)).toMatchObject({
      allocated: 100,
      previousAllocated: 80,
      delta: 20,
      comparisonDay: 20,
    });
  });

  it("surfaces budget and ledger attention without editing transactions", () => {
    const transactions = [transaction({ id: 1, categoryId: 1, category: "Dining" }), transaction({ id: 2, merchant: "Unsorted", categoryId: undefined })];
    const snapshot = structuredClone(transactions);
    const attention = getFinanceAttention(
      transactions,
      accounts,
      categories,
      [row(categories[0], 120, 100), row(categories[1], 85, 100)],
      now,
    );
    expect(attention.map((item) => item.id)).toEqual(expect.arrayContaining(["over-plan", "approaching", "uncategorized", "ledger-review"]));
    expect(transactions).toEqual(snapshot);
  });

  it("orders active recurring items and marks overdue entries", () => {
    const recurring = (id: number, nextDate: string, active = true): FinanceRecurringTransaction => ({
      id,
      type: "expense",
      merchant: `Bill ${id}`,
      amount: id * 10,
      accountId: 1,
      frequency: "monthly",
      nextDate,
      active,
      createdAt,
      updatedAt: createdAt,
    });
    expect(getUpcomingFinanceRecurring([
      recurring(1, "2026-10-25"),
      recurring(2, "2026-10-15"),
      recurring(3, "2026-10-21", false),
    ], now)).toEqual([
      expect.objectContaining({ id: 2, overdue: true }),
      expect.objectContaining({ id: 1, overdue: false }),
    ]);
  });
});
