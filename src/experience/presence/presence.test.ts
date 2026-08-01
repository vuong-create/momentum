import { describe, expect, it } from "vitest";

import { getAmbience } from "./ambience";
import { getDateKey, getTimePeriod } from "./clock";
import { getDailyGreeting } from "./greetings";

describe("time-aware experience", () => {
  it("maps local hours to the intended ambience periods", () => {
    expect(getTimePeriod(new Date(2026, 7, 1, 6))).toBe("morning");
    expect(getTimePeriod(new Date(2026, 7, 1, 12))).toBe("afternoon");
    expect(getTimePeriod(new Date(2026, 7, 1, 18))).toBe("evening");
    expect(getTimePeriod(new Date(2026, 7, 1, 22))).toBe("night");
  });

  it("keeps the ambience and daily greeting deterministic", () => {
    const date = new Date(2026, 7, 1, 15);
    const dateKey = getDateKey(date);

    expect(dateKey).toBe("2026-08-01");
    expect(getAmbience("afternoon").className).toBe(
      "experience-afternoon"
    );
    expect(getDailyGreeting("afternoon", dateKey)).toBe(
      "Good afternoon."
    );
  });
});
