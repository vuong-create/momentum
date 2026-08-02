import { describe, expect, it } from "vitest";

import {
  getCumulativeXPForLevel,
  getProgressionSummary,
  getXPRequiredForNextLevel,
} from "./progression";

describe("XP progression", () => {
  it("uses the approved steadily increasing Momentum curve", () => {
    expect(getXPRequiredForNextLevel(1)).toBe(100);
    expect(getXPRequiredForNextLevel(2)).toBe(125);
    expect(getXPRequiredForNextLevel(5)).toBe(200);
    expect(getCumulativeXPForLevel(5)).toBe(550);
  });

  it("returns progress within the current Momentum level", () => {
    expect(getProgressionSummary(224)).toMatchObject({
      level: 2,
      currentLevelStartXP: 100,
      nextLevelXP: 225,
      xpIntoLevel: 124,
      xpForLevel: 125,
      xpToNextLevel: 1,
    });

    expect(getProgressionSummary(225)).toMatchObject({
      level: 3,
      xpIntoLevel: 0,
      xpForLevel: 150,
    });
  });

  it("uses a focused pillar curve without changing global XP", () => {
    expect(getXPRequiredForNextLevel(1, "pillar")).toBe(75);
    expect(getXPRequiredForNextLevel(2, "pillar")).toBe(90);
    expect(getProgressionSummary(75, "pillar")).toMatchObject({
      level: 2,
      totalXP: 75,
      xpIntoLevel: 0,
    });
  });

  it("normalizes negative and fractional XP", () => {
    expect(getProgressionSummary(-10).totalXP).toBe(0);
    expect(getProgressionSummary(100.9).totalXP).toBe(100);
  });
});
