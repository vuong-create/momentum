import { describe, expect, it } from "vitest";

import {
  buildPlannerDays,
  getWeekStart,
  toDateKey,
} from "./plannerService";

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
});
