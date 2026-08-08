import "fake-indexeddb/auto";

import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { db } from "../../../database/db";

import {
  addMonths,
  buildPlannerDays,
  buildPlannerMonthDays,
  getMonthGridBounds,
  getRelativeWeekLabel,
  getWeekStart,
  moveUnscheduledActivitiesToDate,
  sortActivitiesForFocus,
  toDateKey,
} from "./plannerService";
import type { PlannerActivity } from "../types";

beforeEach(async () => {
  await db.open();
  await db.plannedActivities.clear();
});

afterAll(async () => {
  await db.delete();
});

describe("planner week boundaries", () => {
  it("starts the week on Sunday", () => {
    const wednesday = new Date(2026, 7, 5);

    expect(toDateKey(getWeekStart(wednesday))).toBe("2026-08-02");
  });

  it("orders weekly planner days from Sunday through Saturday", () => {
    const days = buildPlannerDays("2026-08-02", []);

    expect(days.map((day) => day.dayName)).toEqual([
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ]);
  });

  it("describes nearby weeks relative to the current Sunday", () => {
    const referenceDate = new Date(2026, 7, 5);

    expect(getRelativeWeekLabel("2026-08-02", referenceDate)).toBe(
      "This week"
    );
    expect(getRelativeWeekLabel("2026-08-09", referenceDate)).toBe(
      "Next week"
    );
    expect(getRelativeWeekLabel("2026-07-26", referenceDate)).toBe(
      "Last week"
    );
    expect(getRelativeWeekLabel("2026-08-16", referenceDate)).toBe(
      "2 weeks ahead"
    );
    expect(getRelativeWeekLabel("2026-07-19", referenceDate)).toBe(
      "2 weeks ago"
    );
  });

  it("uses a full date range beyond the two-week threshold", () => {
    expect(
      getRelativeWeekLabel("2026-07-05", new Date(2026, 7, 5))
    ).toBe("Week of Jul 5, 2026 – Jul 11, 2026");
  });

  it("sorts unfinished focus work by importance, time, then order", () => {
    const activity = (
      id: number,
      patch: Partial<PlannerActivity> = {}
    ): PlannerActivity => ({
      id,
      title: `Activity ${id}`,
      completed: false,
      status: "planned",
      date: "2026-08-01T12:00:00.000Z",
      day: "Wednesday",
      scheduledDate: "2026-08-05",
      pillar: "core",
      xpReward: 10,
      difficulty: "medium",
      sortOrder: id,
      ...patch,
    });

    const ordered = sortActivitiesForFocus([
      activity(1),
      activity(2, { scheduledTime: "14:00" }),
      activity(3, { important: true }),
      activity(4, { scheduledTime: "09:00" }),
      activity(5, { completed: true, status: "completed" }),
    ]);

    expect(ordered.map((item) => item.id)).toEqual([3, 4, 2, 1, 5]);
  });

  it("builds a Sunday-first full month grid", () => {
    const { gridStart, gridEnd } = getMonthGridBounds("2026-08");
    const days = buildPlannerMonthDays("2026-08", [], new Date(2026, 7, 1));

    expect(toDateKey(gridStart)).toBe("2026-07-26");
    expect(toDateKey(gridEnd)).toBe("2026-09-05");
    expect(days).toHaveLength(42);
    expect(days[0]).toMatchObject({ dateKey: "2026-07-26", isInMonth: false });
    expect(days[6]).toMatchObject({ dateKey: "2026-08-01", isInMonth: true, isToday: true });
    expect(days.at(-1)).toMatchObject({ dateKey: "2026-09-05", isInMonth: false });
  });

  it("places scheduled activities on their month dates", () => {
    const activity: PlannerActivity = {
      id: 1,
      title: "Chinese tutor",
      completed: false,
      status: "planned",
      date: "2026-08-12T12:00:00.000Z",
      day: "Wednesday",
      scheduledDate: "2026-08-12",
      pillar: "chinese",
      xpReward: 25,
      difficulty: "hard",
    };
    const days = buildPlannerMonthDays("2026-08", [activity]);

    expect(days.find(({ dateKey }) => dateKey === "2026-08-12")?.activities)
      .toEqual([activity]);
  });

  it("navigates month keys across year boundaries", () => {
    expect(addMonths("2026-12", 1)).toBe("2027-01");
    expect(addMonths("2026-01", -1)).toBe("2025-12");
  });

  it("moves legacy unscheduled work to Today", async () => {
    const id = await db.plannedActivities.add({
      title: "Review vocabulary",
      completed: false,
      status: "planned",
      date: "2026-08-02T12:00:00.000Z",
      day: "Sunday",
      planningWeekStart: "2026-08-02",
      pillar: "chinese",
      xpReward: 10,
      difficulty: "medium",
    });

    await expect(
      moveUnscheduledActivitiesToDate("2026-08-03")
    ).resolves.toBe(1);

    await expect(db.plannedActivities.get(id)).resolves.toMatchObject({
      scheduledDate: "2026-08-03",
      day: "Monday",
    });
  });
});
