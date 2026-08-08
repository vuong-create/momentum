import "fake-indexeddb/auto";

import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { db } from "../../../database/db";
import { getAccountBalance, getMonthSummary, getNetWorth } from "./financeCalculations";
import { createFinanceAccount, createFinanceTransaction, softDeleteFinanceAccount, softDeleteFinanceTransaction, updateFinanceTransaction } from "./financeService";

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
});
