import { describe, expect, it } from "vitest";

import type { PlannedActivity } from "../../../database/db";

import {
  calculatePlannedXP,
  getActivityDisplayStatus,
  getActivityCarryDays,
  getActivityStatus,
  isActivityVisible,
  isActivityWeeklyEligible,
  resolveActivityScheduledDate,
} from "./activityLifecycle";

function buildActivity(
  patch: Partial<PlannedActivity> = {}
): PlannedActivity {
  return {
    id: 1,
    title: "Read",
    completed: false,
    status: "planned",
    date: "2026-08-01T12:00:00.000Z",
    day: "Saturday",
    scheduledDate: "2026-08-01",
    pillar: "core",
    xpReward: 10,
    difficulty: "medium",
    ...patch,
  };
}

describe("activity lifecycle rules", () => {
  it("derives missed without mutating the stored status", () => {
    const activity = buildActivity();

    expect(getActivityStatus(activity)).toBe("planned");
    expect(
      getActivityDisplayStatus(activity, "2026-08-02")
    ).toBe("missed");
    expect(activity.status).toBe("planned");
  });

  it("keeps cancelled, dismissed, and deleted activities out of active views", () => {
    expect(
      isActivityVisible(buildActivity({ status: "dismissed" }))
    ).toBe(false);
    expect(
      isActivityWeeklyEligible(
        buildActivity({ status: "cancelled" })
      )
    ).toBe(false);
    expect(
      isActivityVisible(
        buildActivity({ deletedAt: "2026-08-02T12:00:00.000Z" })
      )
    ).toBe(false);
  });

  it("applies and rounds the planned XP bonus once", () => {
    expect(calculatePlannedXP(10)).toEqual({
      baseXP: 10,
      plannedBonusXP: 3,
      finalXP: 13,
    });
  });

  it("resolves a legacy weekday against a Sunday-first reference week", () => {
    const legacyActivity = buildActivity({
      scheduledDate: undefined,
      day: "Wednesday",
    });

    expect(
      resolveActivityScheduledDate(legacyActivity, "2026-08-01")
    ).toBe("2026-07-29");
  });

  it("measures carried days from the first scheduled date", () => {
    const activity = buildActivity({
      scheduledDate: "2026-08-06",
      originalScheduledDate: "2026-08-01",
      rescheduleCount: 2,
    });

    expect(getActivityCarryDays(activity, "2026-08-08")).toBe(7);
  });

  it("never reports future work as carried", () => {
    expect(
      getActivityCarryDays(
        buildActivity({ scheduledDate: "2026-08-10" }),
        "2026-08-08"
      )
    ).toBe(0);
  });
});
