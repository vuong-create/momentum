import "fake-indexeddb/auto";

import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { db } from "../../../database/db";
import { getAccountBalance, getMonthSummary, getNetWorth } from "./financeCalculations";
import { calculateBudgetRows, copyPreviousBudget, setBudgetAllocation, setExpectedIncome } from "./financeBudgetService";
import { ensureFinanceCategories, renameFinanceCategory, visibleFinanceCategories } from "./financeCategoryService";
import { createFinanceAccount, createFinanceTransaction, softDeleteFinanceAccount, softDeleteFinanceTransaction, updateFinanceTransaction } from "./financeService";
import { saveManualNetWorthSnapshot, upsertMonthlyNetWorthSnapshot, visibleNetWorthSnapshots } from "./financeSnapshotService";

beforeEach(async () => {
  await db.transaction("rw", db.tables, async () => {
    await Promise.all(db.tables.map((table) => table.clear()));
  });
});

afterAll(async () => {
  db.close();
  await db.delete();
});

describe("finance foundation", () => {
  it("derives balances and monthly totals from transactions", async () => {
    const checking = await createFinanceAccount({ name: "Checking", type: "checking", openingBalance: 1000 });
    await createFinanceTransaction({ date: "2026-08-08", amount: 2500, type: "income", merchant: "Paycheck", accountId: checking, category: "Income", subcategory: "Paycheck" });
    await createFinanceTransaction({ date: "2026-08-08", amount: 120.45, type: "expense", merchant: "Aldi", accountId: checking, category: "Food", subcategory: "Groceries" });
    const account = (await db.financeAccounts.get(checking))!;
    const transactions = await db.financeTransactions.toArray();
    expect(getAccountBalance(account, transactions)).toBe(3379.55);
    expect(getMonthSummary(transactions, "2026-08")).toMatchObject({ income: 2500, expenses: 120.45, remaining: 2379.55 });
  });

  it("moves money once without changing net worth or cash flow", async () => {
    const checking = await createFinanceAccount({ name: "Checking", type: "checking", openingBalance: 1000 });
    const savings = await createFinanceAccount({ name: "HYSA", type: "savings", openingBalance: 5000 });
    await createFinanceTransaction({ date: "2026-08-08", amount: 300, type: "transfer", merchant: "Savings transfer", fromAccountId: checking, toAccountId: savings });
    const accounts = await db.financeAccounts.toArray();
    const transactions = await db.financeTransactions.toArray();
    expect(getNetWorth(accounts, transactions)).toBe(6000);
    expect(getMonthSummary(transactions, "2026-08")).toMatchObject({ income: 0, expenses: 0, remaining: 0 });
  });

  it("updates and soft deletes transactions without corrupting balances", async () => {
    const checking = await createFinanceAccount({ name: "Checking", type: "checking", openingBalance: 100 });
    const id = await createFinanceTransaction({ date: "2026-08-08", amount: 20, type: "expense", merchant: "Cafe", accountId: checking, category: "Food", subcategory: "Dining" });
    await updateFinanceTransaction(id, { date: "2026-08-08", amount: 15, type: "expense", merchant: "Cafe", accountId: checking, category: "Food", subcategory: "Dining" });
    const account = (await db.financeAccounts.get(checking))!;
    expect(getAccountBalance(account, await db.financeTransactions.toArray())).toBe(85);
    await softDeleteFinanceTransaction(id);
    expect(getAccountBalance(account, await db.financeTransactions.toArray())).toBe(100);
  });

  it("protects accounts that still own transaction history", async () => {
    const checking = await createFinanceAccount({ name: "Checking", type: "checking", openingBalance: 100 });
    await createFinanceTransaction({ date: "2026-08-08", amount: 20, type: "expense", merchant: "Cafe", accountId: checking });
    await expect(softDeleteFinanceAccount(checking)).rejects.toThrow(/transactions first/i);
  });

  it("migrates legacy category names to stable category records", async () => {
    const checking = await createFinanceAccount({ name: "Checking", type: "checking", openingBalance: 100 });
    const transactionId = await createFinanceTransaction({ date: "2026-08-08", amount: 20, type: "expense", merchant: "Cafe", accountId: checking, category: "Food", subcategory: "Dining" });
    await Promise.all([ensureFinanceCategories(), ensureFinanceCategories()]);
    expect(await db.financeCategories.count()).toBe(10);
    const transaction = (await db.financeTransactions.get(transactionId))!;
    expect(transaction.categoryId).toBeTypeOf("number"); expect(transaction.subcategoryId).toBeTypeOf("number");
    await renameFinanceCategory(transaction.categoryId!, "Meals");
    expect(visibleFinanceCategories(await db.financeCategories.toArray()).find((item) => item.id === transaction.categoryId)?.name).toBe("Meals");
    expect((await db.financeTransactions.get(transactionId))?.categoryId).toBe(transaction.categoryId);
  });

  it("calculates monthly budgets from transaction-linked subcategories and copies the previous month", async () => {
    await ensureFinanceCategories();
    const dining = (await db.financeSubcategories.toArray()).find((item) => item.name === "Dining")!;
    const checking = await createFinanceAccount({ name: "Checking", type: "checking", openingBalance: 1000 });
    await createFinanceTransaction({ date: "2026-08-08", amount: 75, type: "expense", merchant: "Dinner", accountId: checking, categoryId: dining.categoryId, subcategoryId: dining.id, category: "Food", subcategory: "Dining" });
    await setExpectedIncome("2026-08", 3000); await setBudgetAllocation("2026-08", dining.id!, 250);
    const rows = calculateBudgetRows("2026-08", await db.financeBudgetAllocations.toArray(), await db.financeSubcategories.toArray(), await db.financeTransactions.toArray());
    expect(rows[0]).toMatchObject({ spent: 75, available: 250, remaining: 175, percentage: 30 });
    await copyPreviousBudget("2026-09");
    expect(await db.financeBudgetAllocations.where("month").equals("2026-09").count()).toBe(1);
    expect((await db.financeBudgetMonths.where("month").equals("2026-09").first())?.expectedIncome).toBe(3000);
  });

  it("updates one monthly snapshot and preserves manual checkpoints with account balances", async () => {
    const checking = await createFinanceAccount({ name: "Checking", type: "checking", openingBalance: 1000 });
    const accounts = await db.financeAccounts.toArray();
    await upsertMonthlyNetWorthSnapshot(accounts, [], new Date(2026, 7, 8));
    await createFinanceTransaction({ date: "2026-08-08", amount: 200, type: "income", merchant: "Paycheck", accountId: checking });
    const transactions = await db.financeTransactions.toArray();
    await upsertMonthlyNetWorthSnapshot(accounts, transactions, new Date(2026, 7, 9));
    await saveManualNetWorthSnapshot(accounts, transactions, new Date(2026, 7, 9));
    const snapshots = visibleNetWorthSnapshots(await db.financeNetWorthSnapshots.toArray());
    expect(snapshots).toHaveLength(2);
    expect(snapshots.find((item) => item.source === "monthly")).toMatchObject({ date: "2026-08-09", netWorth: 1200, accounts: [expect.objectContaining({ name: "Checking", balance: 1200 })] });
  });
});
