import { describe, expect, it } from "vitest";

import type { FinanceAccount, FinanceCategory, FinanceTransaction } from "../../../database/db";
import { auditFinanceTransactions, buildFinanceTransactionsCsv } from "./financeLedgerDataService";

const timestamp = "2026-08-28T12:00:00.000Z";
const accounts: FinanceAccount[] = [{ id: 1, name: "Checking", type: "checking", openingBalance: 0, createdAt: timestamp, updatedAt: timestamp }];
const categories: FinanceCategory[] = [{ id: 1, name: "Groceries", flowType: "expense", sortOrder: 0, createdAt: timestamp, updatedAt: timestamp }];

function transaction(overrides: Partial<FinanceTransaction> = {}): FinanceTransaction {
  return { id: 1, date: "2026-08-28", amount: 25, type: "expense", merchant: "Wawa", accountId: 1, categoryId: 1, category: "Groceries", tags: [], createdAt: timestamp, updatedAt: timestamp, ...overrides };
}

describe("finance ledger data tools", () => {
  it("finds likely duplicates and merchant spelling variations without changing transactions", () => {
    const input = [
      transaction(),
      transaction({ id: 2, notes: "second import" }),
      transaction({ id: 3, date: "2026-08-27", merchant: "Wawaa", amount: 8 }),
    ];
    const snapshot = structuredClone(input);
    const audit = auditFinanceTransactions(input, accounts, categories);

    expect(audit.transactionCount).toBe(3);
    expect(audit.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: "duplicate", transactionIds: [1, 2] }),
      expect.objectContaining({ kind: "merchant", title: "Possible merchant spelling variation" }),
    ]));
    expect(input).toEqual(snapshot);
  });

  it("reports invalid values and broken account or category links", () => {
    const audit = auditFinanceTransactions([
      transaction({ date: "2026-02-30", amount: 0, accountId: 99, categoryId: 99 }),
    ], accounts, categories);

    expect(audit.errorCount).toBe(3);
    expect(audit.reviewCount).toBe(1);
    expect(audit.issues.map((issue) => issue.title)).toEqual(expect.arrayContaining([
      "Invalid date", "Invalid amount", "Account reference is unavailable", "Category needs review",
    ]));
  });

  it("exports analysis-ready CSV with safe quoting and signed values", () => {
    const csv = buildFinanceTransactionsCsv([
      transaction({ merchant: "Market, Inc.", amount: 12.5, notes: "Milk \"and\" bread", hiddenFromLedger: true }),
    ], accounts, categories);

    expect(csv).toContain("Date,Type,Merchant,Amount,Signed Amount");
    expect(csv).toContain('"Market, Inc.",12.50,-12.50,Groceries,Checking');
    expect(csv).toContain('"Milk ""and"" bread"');
    expect(csv).toContain(",Yes,");
  });
});
