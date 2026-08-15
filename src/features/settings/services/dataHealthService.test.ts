import "fake-indexeddb/auto";

import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { db } from "../../../database/db";
import { createMomentumBackup } from "./backupService";
import { auditMomentumData } from "./dataHealthService";

async function clearDatabase() {
  await db.open();
  await db.transaction("rw", db.tables, async () => {
    for (const table of db.tables) await table.clear();
  });
}

beforeEach(clearDatabase);

afterAll(async () => {
  db.close();
  await db.delete();
});

describe("read-only data health audit", () => {
  it("verifies a healthy database without changing any record", async () => {
    await db.plannedActivities.add({
      id: 4,
      title: "Read ten pages",
      completed: false,
      status: "planned",
      date: "2026-08-15T10:00:00.000Z",
      day: "Saturday",
      scheduledDate: "2026-08-15",
      pillar: "core",
      xpReward: 10,
      difficulty: "medium",
    });
    await db.focusSessions.add({
      activityId: 4,
      activityTitle: "Read ten pages",
      pillar: "core",
      status: "completed",
      phase: "focus",
      focusMinutes: 25,
      phaseDurationSeconds: 1500,
      remainingSeconds: 0,
      completedCycles: 1,
      focusedSeconds: 1500,
      startedAt: "2026-08-15T10:00:00.000Z",
      endedAt: "2026-08-15T10:25:00.000Z",
      updatedAt: "2026-08-15T10:25:00.000Z",
    });
    const before = await createMomentumBackup(db, undefined);

    const report = await auditMomentumData(db);
    const after = await createMomentumBackup(db, undefined);

    expect(report).toEqual(expect.objectContaining({
      status: "healthy",
      backupReady: true,
      totalRecords: 2,
      tableCount: db.tables.length,
    }));
    expect(report.issues).toEqual([]);
    expect(after.data).toEqual(before.data);
  });

  it("reports broken references without repairing or deleting them", async () => {
    const id = await db.focusSessions.add({
      activityId: 999,
      activityTitle: "Missing activity",
      pillar: "core",
      status: "abandoned",
      phase: "focus",
      focusMinutes: 25,
      phaseDurationSeconds: 1500,
      remainingSeconds: 900,
      completedCycles: 0,
      focusedSeconds: 600,
      startedAt: "2026-08-15T10:00:00.000Z",
      endedAt: "2026-08-15T10:10:00.000Z",
      updatedAt: "2026-08-15T10:10:00.000Z",
    });

    const report = await auditMomentumData(db);

    expect(report.status).toBe("attention");
    expect(report.issues).toContainEqual(expect.objectContaining({
      id: "focusSessions.activityId",
      count: 1,
    }));
    expect(await db.focusSessions.get(id)).toEqual(expect.objectContaining({
      activityId: 999,
    }));
  });
});
