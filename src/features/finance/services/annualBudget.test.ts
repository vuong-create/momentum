import { describe, expect, it } from "vitest";
import type { FinanceBudgetAllocation, FinanceCategory } from "../../../database/db";
import { calculateBudgetRows, calculateYearReviewRows } from "./financeBudgetService";

const category: FinanceCategory = { id: 1, name: "Dining", flowType: "expense", sortOrder: 0, createdAt: "", updatedAt: "" };
const allocation = (month: string, baseAmount: number, rolloverAmount: number, manualAdjustmentAmount = 0): FinanceBudgetAllocation => ({ month, categoryId: 1, baseAmount, rolloverAmount, manualAdjustmentAmount, createdAt: "", updatedAt: "" });

describe("annual funding", () => {
  it("counts incoming January funds once and excludes repeated monthly carryovers", () => {
    const allocations = [allocation("2026-01", 100, 50), allocation("2026-02", 100, 150), allocation("2026-03", 100, 250, -20)];
    const [annual] = calculateYearReviewRows(2026, allocations, [category], []);
    expect(annual).toMatchObject({ baseAmount: 300, rolloverAmount: 50, manualAdjustmentAmount: -20, available: 330, remaining: 330 });
    expect(calculateBudgetRows("2026-03", allocations, [category], [])[0].available).toBe(330);
  });

  it("does not treat a midyear rollover as new money when earlier allocations are missing", () => {
    expect(calculateYearReviewRows(2026, [allocation("2026-08", 100, 700)], [category], [])[0].available).toBe(100);
  });
});
