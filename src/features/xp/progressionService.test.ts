import "fake-indexeddb/auto";

import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { db } from "../../database/db";
import { createPlannedActivity, togglePlannedActivity } from "../activities/services/activityService";
import {
  getWeeklyBonus,
  settleProgressionWeek,
} from "./progressionService";

beforeEach(async () => {
  await db.open();
  await db.transaction("rw", db.tables, async () => {
    for (const table of db.tables) await table.clear();
  });
});

afterAll(async () => {
  db.close();
  await db.delete();
});

describe("progression service", () => {
  it("uses only the highest weekly completion tier", () => {
    expect(getWeeklyBonus(74)).toBe(0);
    expect(getWeeklyBonus(75)).toBe(50);
    expect(getWeeklyBonus(90)).toBe(100);
    expect(getWeeklyBonus(100)).toBe(200);
  });

  it("settles a week idempotently and reconciles its bonus", async () => {
    const ids = await Promise.all(
      Array.from({ length: 4 }, (_, index) =>
        createPlannedActivity({
          title: `Task ${index + 1}`,
          scheduledDate: `2026-08-${String(9 + index).padStart(2, "0")}`,
          pillar: "core",
        }),
      ),
    );
    await Promise.all(ids.slice(0, 3).map((id) => togglePlannedActivity(id)));

    const first = await settleProgressionWeek("2026-08-09");
    const second = await settleProgressionWeek("2026-08-09");
    expect(first).toMatchObject({ percentage: 75, bonusXP: 50, perfectWeek: false });
    expect(second?.id).toBe(first?.id);
    expect((await db.xpEvents.toArray()).filter((event) => event.actionType === "weekly-completion-bonus")).toHaveLength(1);

    await togglePlannedActivity(ids[3]);
    const perfect = await settleProgressionWeek("2026-08-09");
    expect(perfect).toMatchObject({ percentage: 100, bonusXP: 200, perfectWeek: true });
    expect((await db.xpEvents.where("dedupeKey").equals("weekly-result:2026-08-09").first())?.amount).toBe(200);
  });

  it("does not create a result for an empty week", async () => {
    expect(await settleProgressionWeek("2026-08-09")).toBeNull();
    expect(await db.weeklyProgressResults.count()).toBe(0);
  });
});
