import { describe, expect, it } from "vitest";
import { activityDisplayTitle, datedWorkoutLabel } from "./activityDisplay";

describe("dated workout labels", () => {
  const workout = { title: "Upper A", activityKind: "athletics-plan-session:12", date: "2026-11-16" };
  it("uses the requested MM/DD/YY format", () => {
    expect(activityDisplayTitle(workout)).toBe("Upper A · 11/16/26");
    expect(datedWorkoutLabel("Lower B", "2027-01-03")).toBe("Lower B · 01/03/27");
  });
  it("keeps the original workout date after carryover", () => {
    expect(activityDisplayTitle({ ...workout, originalScheduledDate: "2026-11-16", scheduledDate: "2026-11-18" })).toBe("Upper A · 11/16/26");
  });
  it("omits the old embedded description from generated workout labels", () => {
    expect(activityDisplayTitle({ ...workout, title: "Upper A · Explosive athletic day" })).toBe("Upper A · 11/16/26");
    expect(activityDisplayTitle({ ...workout, title: "Upper A · " })).toBe("Upper A · 11/16/26");
  });
  it("uses the scheduled date for sessions without an original date", () => {
    expect(activityDisplayTitle({ ...workout, scheduledDate: "2026-11-17" })).toBe("Upper A · 11/17/26");
  });
  it("leaves ordinary task names and malformed dates alone", () => {
    expect(activityDisplayTitle({ ...workout, activityKind: undefined })).toBe("Upper A");
    expect(datedWorkoutLabel("Upper A", "")).toBe("Upper A");
  });
});
