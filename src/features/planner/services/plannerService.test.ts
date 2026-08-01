import { describe, expect, it } from "vitest";

import {
  buildPlannerDays,
  getRelativeWeekLabel,
  getWeekStart,
  sortActivitiesForFocus,
  toDateKey,
} from "./plannerService";
import type { PlannerActivity } from "../types";

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
});
