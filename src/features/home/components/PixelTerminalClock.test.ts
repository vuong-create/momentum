import { describe, expect, it } from "vitest";

import { clockParts } from "../services/clockService";

describe("pixel terminal clock", () => {
  it("formats midnight and noon as standard time", () => {
    expect(clockParts(new Date(2026, 7, 1, 0, 5))).toMatchObject({ hour: "12", minute: "05", period: "AM" });
    expect(clockParts(new Date(2026, 7, 1, 12, 5))).toMatchObject({ hour: "12", minute: "05", period: "PM" });
  });

  it("converts afternoon hours from military time", () => {
    expect(clockParts(new Date(2026, 7, 1, 15, 34))).toMatchObject({ hour: "03", minute: "34", period: "PM" });
  });
});
