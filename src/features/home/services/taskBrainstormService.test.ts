import { describe, expect, it } from "vitest";

import { parseBrainstormTasks } from "./taskBrainstormService";

describe("task brainstorm service", () => {
  it("turns a loose list into clean task titles", () => {
    expect(parseBrainstormTasks("- Call dentist\n2. Buy rice\n\n• Read chapter 4")).toEqual([
      "Call dentist",
      "Buy rice",
      "Read chapter 4",
    ]);
  });

  it("removes case-insensitive duplicates while preserving order", () => {
    expect(parseBrainstormTasks("Laundry\nlaundry\nPlan weekend")).toEqual([
      "Laundry",
      "Plan weekend",
    ]);
  });

  it("limits one brainstorm capture to thirty tasks", () => {
    const input = Array.from({ length: 35 }, (_, index) => `Idea ${index + 1}`).join("\n");
    expect(parseBrainstormTasks(input)).toHaveLength(30);
  });
});
