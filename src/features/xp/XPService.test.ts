import "fake-indexeddb/auto";

import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { db, type XPEvent } from "../../database/db";
import {
  getTotalXP,
  getXPBreakdown,
  recordXPEvent,
} from "./XPService";

beforeEach(async () => {
  await db.transaction("rw", db.tables, async () => {
    await Promise.all(db.tables.map((table) => table.clear()));
  });
});

afterAll(async () => {
  db.close();
  await db.delete();
});

describe("XP ledger", () => {
  it("derives global and pillar progress from the same event", () => {
    const events: XPEvent[] = [
      {
        amount: 25,
        source: "activity:1",
        date: "2026-08-01T12:00:00.000Z",
        scope: "pillar",
        pillar: "chinese",
      },
    ];

    const summary = getXPBreakdown(events);

    expect(summary.totalXP).toBe(25);
    expect(summary.contributions.find(({ pillar }) => pillar === "chinese"))
      .toMatchObject({ xp: 25, eventCount: 1, percentage: 100 });
  });

  it("keeps Momentum-only bonuses out of pillar levels", () => {
    const summary = getXPBreakdown([
      {
        amount: 25,
        source: "activity:1",
        date: "2026-08-01T12:00:00.000Z",
        scope: "pillar",
        pillar: "chinese",
      },
      {
        amount: 100,
        source: "weekly:2026-07-26",
        date: "2026-08-01T23:59:00.000Z",
        scope: "momentum",
      },
    ]);

    expect(summary.totalXP).toBe(125);
    expect(summary.momentumOnlyXP).toBe(100);
    expect(summary.contributions.find(({ pillar }) => pillar === "chinese")?.xp)
      .toBe(25);
  });

  it("ignores voided events while preserving them in storage", async () => {
    await db.xpEvents.bulkAdd([
      {
        amount: 20,
        source: "active",
        date: "2026-08-01T12:00:00.000Z",
        scope: "momentum",
      },
      {
        amount: 30,
        source: "voided",
        date: "2026-08-01T13:00:00.000Z",
        scope: "momentum",
        voidedAt: "2026-08-01T14:00:00.000Z",
      },
    ]);

    expect(await getTotalXP()).toBe(20);
    expect(await db.xpEvents.count()).toBe(2);
  });

  it("deduplicates a requested award and restores a voided event", async () => {
    const input = {
      amount: 25,
      source: "chinese:tutor:1",
      scope: "pillar" as const,
      pillar: "chinese" as const,
      actionType: "tutor-session",
      sourceType: "chinese-activity",
      sourceId: "1",
      description: "Tutor session",
      dedupeKey: "chinese:tutor:1",
    };

    const first = await recordXPEvent(input);
    const duplicate = await recordXPEvent(input);

    expect(first.xpAwarded).toBe(25);
    expect(duplicate).toMatchObject({ xpAwarded: 0, duplicate: true });
    expect(await db.xpEvents.count()).toBe(1);

    await db.xpEvents.update(first.id, {
      voidedAt: "2026-08-01T14:00:00.000Z",
    });

    const restored = await recordXPEvent(input);

    expect(restored.xpAwarded).toBe(25);
    expect(await db.xpEvents.count()).toBe(1);
  });
});
