import { describe, expect, it } from "vitest";

import type { FinanceCategory, FinanceTransaction } from "../../../database/db";
import type { BudgetRow } from "./financeBudgetService";
import { getExpenseCategoryChanges, getTopExpenseMerchants } from "./financeReportService";

const category: FinanceCategory = { id: 1, name: "Dining", flowType: "expense", sortOrder: 0, createdAt: "", updatedAt: "" };
function row(actual: number): BudgetRow { return { month: "2026-08", categoryId: 1, baseAmount: 200, rolloverAmount: 0, createdAt: "", updatedAt: "", category, actual, available: 200, remaining: 200 - actual, percentage: actual / 2 }; }

describe("finance report insights", () => {
  it("groups top expense merchants for the selected period", () => {
    const transactions = [
      { date: "2026-08-01", type: "expense", merchant: "Wawa", amount: 12 },
      { date: "2026-08-02", type: "expense", merchant: "Wawa", amount: 8 },
      { date: "2026-08-03", type: "expense", merchant: "Aldi", amount: 18 },
      { date: "2026-07-01", type: "expense", merchant: "Old", amount: 99 },
      { date: "2026-08-04", type: "income", merchant: "Work", amount: 500 },
    ] as FinanceTransaction[];
    expect(getTopExpenseMerchants(transactions, "2026-08")).toEqual([{ merchant: "Wawa", amount: 20 }, { merchant: "Aldi", amount: 18 }]);
  });

  it("orders category changes by largest absolute movement", () => {
    expect(getExpenseCategoryChanges([row(175)], [row(100)])).toEqual([{ categoryId: 1, category: "Dining", current: 175, previous: 100, change: 75 }]);
  });
});
