import "fake-indexeddb/auto";

import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { db } from "../../../database/db";
import {
  advanceFocusPhase,
  endFocusSession,
  getRemainingSeconds,
  pauseFocusSession,
  resumeFocusSession,
  startFocusSession,
} from "./focusService";

const activity = {
  id: 1,
  title: "Deep work",
  completed: false,
  status: "planned" as const,
  date: "2026-08-15",
  day: "Saturday",
  scheduledDate: "2026-08-15",
  pillar: "core" as const,
  xpReward: 10,
  difficulty: "medium" as const,
};

beforeEach(async () => {
  await db.focusSessions.clear();
});

afterAll(async () => {
  db.close();
  await db.delete();
});

describe("focus service", () => {
  it("starts one recoverable timer per activity", async () => {
    const start = new Date("2026-08-15T14:00:00.000Z");
    const id = await startFocusSession(activity, 25, start);
    const duplicate = await startFocusSession(activity, 50, start);
    const session = await db.focusSessions.get(id);

    expect(duplicate).toBe(id);
    expect(session).toMatchObject({
      activityId: 1,
      phase: "focus",
      status: "active",
      remainingSeconds: 1500,
    });
    expect(getRemainingSeconds(session!, start)).toBe(1500);
  });

  it("preserves exact remaining time across pause and resume", async () => {
    const start = new Date("2026-08-15T14:00:00.000Z");
    const pausedAt = new Date("2026-08-15T14:01:30.000Z");
    const resumedAt = new Date("2026-08-15T14:02:00.000Z");
    const id = await startFocusSession(activity, 25, start);
    await pauseFocusSession(id, pausedAt);
    const paused = await db.focusSessions.get(id);
    expect(paused?.remainingSeconds).toBe(1410);

    await resumeFocusSession(id, resumedAt);
    const resumed = await db.focusSessions.get(id);
    expect(resumed?.status).toBe("active");
    expect(getRemainingSeconds(resumed!, resumedAt)).toBe(1410);
  });

  it("moves completed focus into a paused break and records time", async () => {
    const start = new Date("2026-08-15T14:00:00.000Z");
    const finishedAt = new Date("2026-08-15T14:25:00.000Z");
    const id = await startFocusSession(activity, 25, start);
    await advanceFocusPhase(id, finishedAt);
    const session = await db.focusSessions.get(id);

    expect(session).toMatchObject({
      phase: "short-break",
      status: "paused",
      completedCycles: 1,
      focusedSeconds: 1500,
      remainingSeconds: 300,
    });
  });

  it("records partial focus when a session ends early", async () => {
    const start = new Date("2026-08-15T14:00:00.000Z");
    const endedAt = new Date("2026-08-15T14:05:00.000Z");
    const id = await startFocusSession(activity, 25, start);
    await endFocusSession(id, false, endedAt);
    const session = await db.focusSessions.get(id);

    expect(session?.status).toBe("completed");
    expect(session?.focusedSeconds).toBe(300);
    expect(session?.endedAt).toBeTruthy();
  });
});
