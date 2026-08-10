import "fake-indexeddb/auto";

import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { db } from "../../../database/db";
import { getAccountBalance, getMonthSummary, getNetWorth } from "./financeCalculations";
import { calculateBudgetRows, calculateMonthReviewRows, calculateYearReviewRows, copyPreviousBudget, setBudgetAllocation } from "./financeBudgetService";
import { ensureFinanceCategories, renameFinanceCategory, visibleFinanceCategories } from "./financeCategoryService";
import { createFinanceAccount, createFinanceTransaction, setFinanceAccountBalance, softDeleteFinanceAccount, softDeleteFinanceTransaction, updateFinanceTransaction } from "./financeService";
import { importFinanceCsv, previewFinanceCsv, revertFinanceImport } from "./financeImportService";
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

  it("treats paid-in-full credit cards as spending sources instead of balance accounts", async () => {
    const checking = await createFinanceAccount({ name: "Checking", type: "checking", openingBalance: 1000 });
    const card = await createFinanceAccount({ name: "Card", type: "credit", openingBalance: -500 });
    await createFinanceTransaction({ date: "2026-08-08", amount: 75, type: "expense", merchant: "Dinner", accountId: card });
    const accounts = await db.financeAccounts.toArray(); const transactions = await db.financeTransactions.toArray();
    expect(getNetWorth(accounts, transactions)).toBe(1000);
    expect(getMonthSummary(transactions, "2026-08")).toMatchObject({ expenses: 75 });
    await saveManualNetWorthSnapshot(accounts, transactions, new Date(2026, 7, 8));
    expect(await db.financeNetWorthSnapshots.toArray()).toEqual([expect.objectContaining({ netWorth: 1000, accounts: [expect.objectContaining({ accountId: checking })] })]);
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

  it("reconciles an account with auditable adjustments that do not change monthly cash flow", async () => {
    const checking = await createFinanceAccount({ name: "Checking", type: "checking", openingBalance: 100 });
    const account = (await db.financeAccounts.get(checking))!;
    const increase = await setFinanceAccountBalance(checking, 175, "2026-08-08", "Reconcile statement");
    expect(increase.delta).toBe(75);
    expect(getAccountBalance(account, await db.financeTransactions.toArray())).toBe(175);
    const decrease = await setFinanceAccountBalance(checking, 120, "2026-08-09");
    expect(decrease.delta).toBe(-55);
    expect(getAccountBalance(account, await db.financeTransactions.toArray())).toBe(120);
    expect(getMonthSummary(await db.financeTransactions.toArray(), "2026-08")).toMatchObject({ income: 0, expenses: 0, invested: 0, saved: 0, remaining: 0 });
  });

  it("protects accounts that still own transaction history", async () => {
    const checking = await createFinanceAccount({ name: "Checking", type: "checking", openingBalance: 100 });
    await createFinanceTransaction({ date: "2026-08-08", amount: 20, type: "expense", merchant: "Cafe", accountId: checking });
    await expect(softDeleteFinanceAccount(checking)).rejects.toThrow(/transactions first/i);
  });

  it("migrates legacy category names to stable category records", async () => {
    const checking = await createFinanceAccount({ name: "Checking", type: "checking", openingBalance: 100 });
    const transactionId = await createFinanceTransaction({ date: "2026-08-08", amount: 20, type: "expense", merchant: "Cafe", accountId: checking, category: "Food", subcategory: "Dining" });
    await db.financeTransactions.update(transactionId, { subcategory: "Dining" });
    await Promise.all([ensureFinanceCategories(), ensureFinanceCategories()]);
    expect(await db.financeCategories.count()).toBe(23);
    const transaction = (await db.financeTransactions.get(transactionId))!;
    expect(transaction.categoryId).toBeTypeOf("number"); expect(transaction.subcategoryId).toBeUndefined(); expect(transaction.category).toBe("Dining");
    await renameFinanceCategory(transaction.categoryId!, "Meals");
    expect(visibleFinanceCategories(await db.financeCategories.toArray()).find((item) => item.id === transaction.categoryId)?.name).toBe("Meals");
    expect((await db.financeTransactions.get(transactionId))?.categoryId).toBe(transaction.categoryId);
  });

  it("resets the Finance 2 catalog while preserving HYSA transfers and compatible plans", async () => {
    const timestamp = new Date().toISOString();
    const savings = await db.financeCategories.add({ name: "Savings", flowType: undefined as never, sortOrder: 0, createdAt: timestamp, updatedAt: timestamp });
    const hysaLegacy = await db.financeSubcategories.add({ categoryId: savings, name: "HYSA", sortOrder: 0, isDefault: false, createdAt: timestamp, updatedAt: timestamp });
    await db.financeBudgetAllocations.add({ month: "2026-08", subcategoryId: hysaLegacy, baseAmount: 600, rolloverAmount: 0, createdAt: timestamp, updatedAt: timestamp });
    const checking = await createFinanceAccount({ name: "Checking", type: "checking", openingBalance: 1000 });
    const hysa = await createFinanceAccount({ name: "HYSA", type: "savings", openingBalance: 0 });
    const transfer = await createFinanceTransaction({ date: "2026-08-08", amount: 500, type: "transfer", merchant: "Save", fromAccountId: checking, toAccountId: hysa });
    await ensureFinanceCategories();
    const hysaCategory = (await db.financeCategories.toArray()).find((item) => item.name === "HYSA")!;
    expect(await db.financeSubcategories.count()).toBe(0);
    expect(await db.financeTransactions.get(transfer)).toMatchObject({ categoryId: hysaCategory.id, category: "HYSA", subcategoryId: undefined });
    expect(await db.financeBudgetAllocations.where("month").equals("2026-08").first()).toMatchObject({ categoryId: hysaCategory.id, baseAmount: 600 });
  });

  it("calculates one-level monthly plans and copies the previous month", async () => {
    await ensureFinanceCategories();
    const categories = await db.financeCategories.toArray(); const dining = categories.find((item) => item.name === "Dining")!;
    const checking = await createFinanceAccount({ name: "Checking", type: "checking", openingBalance: 1000 });
    await createFinanceTransaction({ date: "2026-08-08", amount: 75, type: "expense", merchant: "Dinner", accountId: checking, categoryId: dining.id, category: "Dining" });
    await setBudgetAllocation("2026-08", dining.id!, 250);
    const rows = calculateBudgetRows("2026-08", await db.financeBudgetAllocations.toArray(), categories, await db.financeTransactions.toArray());
    expect(rows.find((item) => item.category.name === "Dining")).toMatchObject({ actual: 75, available: 250, remaining: 175, percentage: 30 });
    await copyPreviousBudget("2026-09");
    expect(await db.financeBudgetAllocations.where("month").equals("2026-09").count()).toBe(1);
  });

  it("separates expenses, investment contributions, income, and HYSA saving in review calculations", async () => {
    await ensureFinanceCategories(); const categories = await db.financeCategories.toArray();
    const category = (name: string) => categories.find((item) => item.name === name)!;
    const checking = await createFinanceAccount({ name: "Checking", type: "checking", openingBalance: 1000 });
    const hysaAccount = await createFinanceAccount({ name: "HYSA", type: "savings", openingBalance: 0 });
    await createFinanceTransaction({ date: "2026-08-08", amount: 2000, type: "income", merchant: "NEO", accountId: checking, categoryId: category("NEO").id, category: "NEO" });
    await createFinanceTransaction({ date: "2026-08-08", amount: 500, type: "expense", merchant: "Rent", accountId: checking, categoryId: category("Rent").id, category: "Rent" });
    await createFinanceTransaction({ date: "2026-08-08", amount: 300, type: "investment", merchant: "Vanguard", accountId: checking, categoryId: category("Vanguard Brokerage").id, category: "Vanguard Brokerage" });
    await createFinanceTransaction({ date: "2026-08-08", amount: 400, type: "transfer", merchant: "Save", fromAccountId: checking, toAccountId: hysaAccount, categoryId: category("HYSA").id, category: "HYSA" });
    await setBudgetAllocation("2026-08", category("Rent").id!, 800); await setBudgetAllocation("2026-08", category("HYSA").id!, 500);
    expect(getMonthSummary(await db.financeTransactions.toArray(), "2026-08", categories)).toMatchObject({ income: 2000, expenses: 500, invested: 300, saved: 400, remaining: 800 });
    const review = calculateMonthReviewRows("2026-08", await db.financeBudgetAllocations.toArray(), categories, await db.financeTransactions.toArray());
    expect(review.find((item) => item.category.name === "HYSA")).toMatchObject({ actual: 400, available: 500, remaining: 100 });
  });

  it("aggregates all monthly plans and activity into an annual review", async () => {
    await ensureFinanceCategories(); const categories = await db.financeCategories.toArray(); const dining = categories.find((item) => item.name === "Dining")!;
    const checking = await createFinanceAccount({ name: "Checking", type: "checking", openingBalance: 1000 });
    await setBudgetAllocation("2026-01", dining.id!, 200); await setBudgetAllocation("2026-02", dining.id!, 300);
    await createFinanceTransaction({ date: "2026-01-10", amount: 80, type: "expense", merchant: "Dinner", accountId: checking, categoryId: dining.id, category: dining.name });
    await createFinanceTransaction({ date: "2026-02-10", amount: 120, type: "expense", merchant: "Dinner", accountId: checking, categoryId: dining.id, category: dining.name });
    const annual = calculateYearReviewRows(2026, await db.financeBudgetAllocations.toArray(), categories, await db.financeTransactions.toArray());
    expect(annual.find((item) => item.category.id === dining.id)).toMatchObject({ available: 500, actual: 200, remaining: 300, averageActual: 100 });
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

  it("previews, imports, deduplicates, and reverts transaction CSV batches", async () => {
    await ensureFinanceCategories(); const categories = await db.financeCategories.toArray();
    const csv = [
      "Month,Day,Category,Sub-Category,Amount,Merchant,Notes,Account",
      "January,2,Expense,Groceries,$12.50,Aldi,Food,BOA",
      "January,15,Income,NEO,$1000.00,NEO,Paycheck,TD BANK",
      "January,15,Long-term Saving,HYSA,$250.00,Discover,Transfer,TD BANK",
      "March,31,,SJ,$600.00,SJVBC,March,TD BANK",
      "July,6,Expense,Clothes/Shoes,$ -,Banana Republic,White Shirt,BOA",
    ].join("\n");
    const preview = previewFinanceCsv(csv, "2026 Transactions.csv");
    expect(preview).toMatchObject({ year: 2026, issues: [{ sourceRow: 6, message: expect.stringMatching(/amount/i) }] });
    expect(preview.rows).toHaveLength(4); expect(preview.rows.find((row) => row.sourceCategory === "SJ")).toMatchObject({ type: "income", suggestedCategory: "SJVBC", needsReview: true });
    const result = await importFinanceCsv(preview, categories, {
      accountMappings: { BOA: { createType: "credit" }, "TD BANK": { createType: "checking" } },
      categoryMappings: { Groceries: "Groceries", NEO: "NEO", HYSA: "HYSA", SJ: "SJVBC" },
      createSavingsAccount: true,
    });
    expect(result).toMatchObject({ importedCount: 4, skippedCount: 1 });
    expect(await db.financeAccounts.count()).toBe(3);
    const imported = await db.financeTransactions.where("importBatchId").equals(result.batchId).toArray();
    expect(imported.find((item) => item.category === "HYSA")).toMatchObject({ type: "transfer", accountId: undefined, fromAccountId: expect.any(Number), toAccountId: expect.any(Number) });
    await expect(importFinanceCsv(preview, categories, { accountMappings: {}, categoryMappings: {} })).rejects.toThrow(/already been imported/i);
    await revertFinanceImport(result.batchId);
    expect((await db.financeTransactions.where("importBatchId").equals(result.batchId).toArray()).every((item) => item.deletedAt)).toBe(true);
    expect((await db.financeAccounts.toArray()).every((item) => item.deletedAt)).toBe(true);
  });
});
