import "fake-indexeddb/auto";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "../../../database/db";
import { addBlockSession, deleteBlockSession, moveBlockSession, restoreBlockSession } from "./trainingOccurrenceService";
import { completeTrainingSession, ensureAthleticsBlockTemplates, getTrainingBlockDefinition, scheduleAthleticsTrainingBlock, updateCurrentTrainingBlock } from "./trainingBlockService";

beforeEach(async () => { await db.transaction("rw", db.tables, async () => { await Promise.all(db.tables.map((table) => table.clear())); }); });
afterAll(async () => { db.close(); await db.delete(); });
async function setup() {
  const templateId = await ensureAthleticsBlockTemplates();
  const { blockId } = await scheduleAthleticsTrainingBlock(templateId, { name: "Actual training", startDate: "2026-10-04", weekCount: 2 });
  const block = (await db.athleticsTrainingBlocks.get(blockId))!;
  const sessions = await db.athleticsPlannedSessions.where("blockId").equals(blockId).toArray();
  return { block, sessions, upper: sessions.find((item) => item.name === "Upper A")! };
}
describe("Current Block occurrence edits", () => {
  it("moves only one occurrence and keeps Planner aligned", async () => {
    const { upper, sessions } = await setup();
    await moveBlockSession(upper.id!, "2026-10-14");
    expect(await db.athleticsPlannedSessions.get(upper.id!)).toMatchObject({ date: "2026-10-14", weekNumber: 2, templateWeekNumber: 1, templateDate: "2026-10-06", manualOverride: true });
    expect(await db.plannedActivities.get(upper.plannedActivityId!)).toMatchObject({ scheduledDate: "2026-10-14", completed: false });
    const other = sessions.find((item) => item.name === "Upper A" && item.id !== upper.id)!;
    expect(await db.athleticsPlannedSessions.get(other.id!)).toEqual(other);
    expect(await db.xpEvents.count()).toBe(0);
  });
  it("corrects completed dates without duplicating XP or losing logging time", async () => {
    const { upper } = await setup();
    await completeTrainingSession(upper.id!, upper.date);
    const task = (await db.plannedActivities.get(upper.plannedActivityId!))!;
    const xp = await db.xpEvents.toArray();
    await moveBlockSession(upper.id!, "2026-10-14");
    const updated = (await db.plannedActivities.get(upper.plannedActivityId!))!;
    expect(updated.scheduledDate).toBe("2026-10-14");
    expect(updated.completedAt?.slice(0, 10)).toBe("2026-10-14");
    expect(updated.completionLoggedAt).toBe(task.completionLoggedAt);
    const after = await db.xpEvents.toArray();
    expect(after).toHaveLength(xp.length);
    expect(after[0]).toMatchObject({ id: xp[0].id, amount: xp[0].amount });
    expect(after[0].date.slice(0, 10)).toBe("2026-10-14");
    expect((await db.activityEvents.toArray())[0].occurredAt.slice(0, 10)).toBe("2026-10-14");
  });
  it("rejects dates outside the block without partial writes", async () => {
    const { upper } = await setup();
    const before = await db.plannedActivities.toArray();
    await expect(moveBlockSession(upper.id!, "2026-10-18")).rejects.toThrow("within the block");
    await expect(moveBlockSession(upper.id!, "2026-10-03")).rejects.toThrow("within the block");
    expect(await db.athleticsPlannedSessions.get(upper.id!)).toEqual(upper);
    expect(await db.plannedActivities.toArray()).toEqual(before);
  });
  it("adds multiple one-offs without changing the weekly design", async () => {
    const { block, sessions } = await setup();
    const input = { date: "2026-10-06", activity: { name: "Extra gym", kind: "gym" as const, focus: "", exercises: [] } };
    const a = await addBlockSession(block.id!, input);
    const b = await addBlockSession(block.id!, { ...input, completed: true });
    expect(a).not.toBe(b);
    const all = await db.athleticsPlannedSessions.toArray();
    expect(all).toHaveLength(sessions.length + 2);
    expect(getTrainingBlockDefinition(block, all)).toEqual(getTrainingBlockDefinition(block, sessions));
  });
  it("copies a reusable session without inheriting its database identity", async () => {
    const { block, upper } = await setup();
    const a = await addBlockSession(block.id!, { date: "2026-10-06", activity: upper });
    const b = await addBlockSession(block.id!, { date: "2026-10-06", activity: upper });
    expect(a).not.toBe(upper.id);
    expect(b).not.toBe(a);
    expect((await db.athleticsPlannedSessions.get(a))?.templateActivityId).toBeUndefined();
    expect(await db.athleticsPlannedSessions.get(upper.id!)).toEqual(upper);
  });
  it("deletes and restores completed session and original XP records", async () => {
    const { upper } = await setup();
    await completeTrainingSession(upper.id!, upper.date);
    const xp = await db.xpEvents.toArray();
    const snapshot = await deleteBlockSession(upper.id!);
    expect((await db.plannedActivities.get(upper.plannedActivityId!))?.deletedAt).toBeTruthy();
    expect((await db.xpEvents.toArray())[0].voidedAt).toBeTruthy();
    await restoreBlockSession(snapshot);
    expect((await db.plannedActivities.get(upper.plannedActivityId!))?.deletedAt).toBeUndefined();
    expect(await db.xpEvents.toArray()).toEqual(xp);
    await expect(restoreBlockSession(snapshot)).rejects.toThrow("already changed");
  });
  it("template saves preserve moved, removed and added occurrences", async () => {
    const { block, sessions, upper } = await setup();
    const definition = getTrainingBlockDefinition(block, sessions);
    await moveBlockSession(upper.id!, "2026-10-14");
    const removed = sessions.find((item) => item.name === "Lower A")!;
    await deleteBlockSession(removed.id!);
    const added = await addBlockSession(block.id!, { date: "2026-10-08", activity: { name: "Extra", kind: "custom", focus: "", exercises: [] } });
    expect(getTrainingBlockDefinition(block, await db.athleticsPlannedSessions.toArray())).toEqual(definition);
    await updateCurrentTrainingBlock(block.id!, definition);
    const all = await db.athleticsPlannedSessions.toArray();
    expect(all).toHaveLength(sessions.length + 1);
    expect(all.find((item) => item.id === upper.id)?.date).toBe("2026-10-14");
    expect(all.find((item) => item.id === removed.id)?.deletedAt).toBeTruthy();
    expect(all.find((item) => item.id === added)?.deletedAt).toBeUndefined();
  });
});
