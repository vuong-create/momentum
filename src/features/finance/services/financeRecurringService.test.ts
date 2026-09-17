import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";

import { db } from "../../../database/db";
import {
  advanceRecurringDate,
  confirmFinanceRecurring,
  createFinanceRecurring,
  dueFinanceRecurring,
  recurringFrequencyLabel,
  skipFinanceRecurring,
  visibleFinanceRecurring,
} from "./financeRecurringService";

describe("finance recurring service", () => {
  beforeEach(async () => {
    await db.open();
    await db.transaction("rw", db.tables, async () => Promise.all(db.tables.map((table) => table.clear())));
  });

  it("advances calendar dates without drifting at month end", () => {
    expect(advanceRecurringDate("2026-01-31", "monthly")).toBe("2026-02-28");
    expect(advanceRecurringDate("2028-01-31", "monthly")).toBe("2028-02-29");
    expect(advanceRecurringDate("2026-12-29", "weekly")).toBe("2027-01-05");
    expect(advanceRecurringDate("2028-02-29", "yearly")).toBe("2029-02-28");
  });

  it("supports readable custom intervals across calendar units", () => {
    expect(advanceRecurringDate("2026-09-01", "custom", 10, "days")).toBe("2026-09-11");
    expect(advanceRecurringDate("2026-09-01", "custom", 2, "weeks")).toBe("2026-09-15");
    expect(advanceRecurringDate("2026-01-31", "custom", 2, "months")).toBe("2026-03-31");
    expect(advanceRecurringDate("2028-02-29", "custom", 2, "years")).toBe("2030-02-28");
    expect(recurringFrequencyLabel("custom", 2, "weeks")).toBe("Every 2 weeks");
    expect(recurringFrequencyLabel("custom", 1, "months")).toBe("Every 1 month");
  });

  it("preserves decimal amounts and advances a custom schedule", async () => {
    const accountId = await db.financeAccounts.add({ name: "Checking", type: "checking", openingBalance: 0, createdAt: "2026-01-01", updatedAt: "2026-01-01" });
    const id = await createFinanceRecurring({
      type: "expense",
      merchant: "Streaming",
      amount: 12.49,
      accountId,
      frequency: "custom",
      customInterval: 2,
      customUnit: "weeks",
      nextDate: "2026-09-01",
    });

    expect(await db.financeRecurringTransactions.get(id)).toMatchObject({
      amount: 12.49,
      frequency: "custom",
      customInterval: 2,
      customUnit: "weeks",
    });

    await confirmFinanceRecurring(id);
    expect((await db.financeTransactions.toCollection().first())?.amount).toBe(12.49);
    expect((await db.financeRecurringTransactions.get(id))?.nextDate).toBe("2026-09-15");
  });

  it("only posts a transaction after confirmation", async () => {
    const accountId = await db.financeAccounts.add({ name: "Checking", type: "checking", openingBalance: 0, createdAt: "2026-01-01", updatedAt: "2026-01-01" });
    const id = await createFinanceRecurring({ type: "expense", merchant: "Rent", amount: 800, accountId, frequency: "monthly", nextDate: "2026-09-01" });
    expect(await db.financeTransactions.count()).toBe(0);
    expect(dueFinanceRecurring(visibleFinanceRecurring(await db.financeRecurringTransactions.toArray()), "2026-09-01")).toHaveLength(1);
    await confirmFinanceRecurring(id);
    expect(await db.financeTransactions.count()).toBe(1);
    expect((await db.financeRecurringTransactions.get(id))?.nextDate).toBe("2026-10-01");
  });

  it("can skip an occurrence without writing to the ledger", async () => {
    const accountId = await db.financeAccounts.add({ name: "Checking", type: "checking", openingBalance: 0, createdAt: "2026-01-01", updatedAt: "2026-01-01" });
    const id = await createFinanceRecurring({ type: "expense", merchant: "Subscription", amount: 12, accountId, frequency: "monthly", nextDate: "2026-09-15" });
    await skipFinanceRecurring(id);
    expect(await db.financeTransactions.count()).toBe(0);
    expect((await db.financeRecurringTransactions.get(id))?.nextDate).toBe("2026-10-15");
  });
});
