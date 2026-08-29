import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";

import { db } from "../../../database/db";
import { advanceRecurringDate, confirmFinanceRecurring, createFinanceRecurring, dueFinanceRecurring, skipFinanceRecurring, visibleFinanceRecurring } from "./financeRecurringService";

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
