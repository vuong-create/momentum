import { describe, expect, it } from "vitest";

import type { ActivityEvent, PlannedActivity, XPEvent } from "../../../database/db";
import { buildTaskLedgerEntries, filterTaskLedgerEntries, type TaskLedgerFilters } from "./taskLedgerService";

const baseActivity: PlannedActivity = {
  id: 1,
  title: "Cook dinner",
  completed: false,
  status: "planned",
  date: "2026-08-10T12:00:00.000Z",
  day: "Monday",
  scheduledDate: "2026-08-10",
  pillar: "cooking",
  activityKind: "cooking:meal:dinner",
  xpReward: 10,
  difficulty: "medium",
};

const filters: TaskLedgerFilters = {
  query: "",
  month: "",
  pillar: "all",
  difficulty: "all",
  status: "completed",
  source: "all",
  cookingIdentity: "all",
  order: "newest",
};

describe("task ledger service", () => {
  it("keeps a reopened completion in completed history and voids its XP total", () => {
    const event: ActivityEvent = {
      id: 8,
      plannedActivityId: 1,
      pillar: "cooking",
      occurredAt: "2026-08-11T12:00:00.000Z",
      effortTier: "medium",
      plannedBeforeCompletion: true,
      voidedAt: "2026-08-12T12:00:00.000Z",
    };
    const xp: XPEvent = {
      id: 9,
      amount: 13,
      finalXP: 13,
      source: "activity:1",
      date: event.occurredAt,
      activityEventId: 8,
      voidedAt: event.voidedAt,
    };
    const entries = buildTaskLedgerEntries([baseActivity], [event], [xp]);
    const completedHistory = filterTaskLedgerEntries(entries, filters);

    expect(completedHistory).toHaveLength(1);
    expect(completedHistory[0]).toMatchObject({ status: "reopened", xp: 13, xpVoided: true, cookingIdentity: "meal" });
  });

  it("recognizes preset source and filters unclassified Cooking tasks", () => {
    const entries = buildTaskLedgerEntries([
      { ...baseActivity, id: 2, dayPresetId: 4, completed: true, status: "completed" },
      { ...baseActivity, id: 3, title: "Prep onions", activityKind: undefined },
    ], [], []);
    expect(entries[0].source).toBe("preset");
    expect(filterTaskLedgerEntries(entries, { ...filters, status: "all", cookingIdentity: "unclassified" }).map((entry) => entry.activity.id)).toEqual([3]);
  });
});
