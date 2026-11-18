import { db, type AthleticsBlockTemplateActivity, type AthleticsPlannedSession } from "../../../database/db";
import { completePlannedActivity, correctCompletionDate, movePlannedActivity } from "../../activities/services/activityService";
import { getActivityStatus, getCompletionDedupeKey, toDateKey } from "../../activities/services/activityLifecycle";
import { createSessionActivity } from "./trainingBlockService";

const tables = () => [db.athleticsTrainingBlocks, db.athleticsBlockTemplates, db.athleticsPlannedSessions, db.plannedActivities, db.activityEvents, db.xpEvents];

async function requireBlockDate(blockId: number, date: string) {
  const block = await db.athleticsTrainingBlocks.get(blockId);
  if (!block || block.deletedAt) throw new Error("Training block not found.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || toDateKey(new Date(`${date}T12:00:00`)) !== date) throw new Error("Choose a valid date.");
  if (date < block.startDate || date > block.endDate) throw new Error("Keep this session within the block dates.");
  return block;
}

function weekAt(start: string, date: string) {
  return Math.floor((Date.parse(date) - Date.parse(start)) / (7 * 86400000)) + 1;
}

export async function moveBlockSession(sessionId: number, date: string) {
  return db.transaction("rw", tables(), async () => {
    const session = await db.athleticsPlannedSessions.get(sessionId);
    if (!session || session.deletedAt) throw new Error("Training session not found.");
    const block = await requireBlockDate(session.blockId, date);
    const activity = session.plannedActivityId ? await db.plannedActivities.get(session.plannedActivityId) : undefined;
    if (session.plannedActivityId && (!activity || activity.deletedAt)) throw new Error("The linked Planner task is unavailable.");
    if (activity && getActivityStatus(activity) === "completed") {
      // Preserves completionLoggedAt and the existing XP amount/identity.
      await correctCompletionDate(activity.id!, date);
    } else if (activity) {
      await movePlannedActivity(activity.id!, date);
    }
    await db.athleticsPlannedSessions.update(sessionId, {
      date, weekNumber: weekAt(block.startDate, date),
      templateWeekNumber: session.templateWeekNumber ?? session.weekNumber,
      templateDate: session.templateDate ?? session.date,
      templateActivityId: session.templateActivityId ?? (session.manualOverride ? undefined : `session-activity-${session.id}`),
      manualOverride: true, updatedAt: new Date().toISOString(),
    });
  });
}

export type AddBlockSessionInput = {
  date: string;
  activity: Pick<AthleticsBlockTemplateActivity, "name" | "kind" | "focus" | "exercises" | "notes" | "volleyballType">;
  completed?: boolean;
};

export async function addBlockSession(blockId: number, input: AddBlockSessionInput) {
  return db.transaction("rw", tables(), async () => {
    const block = await requireBlockDate(blockId, input.date);
    const name = input.activity.name.trim();
    if (!name) throw new Error("Give this session a name.");
    if (input.activity.kind === "recovery") throw new Error("Choose a workout, volleyball, or custom activity.");
    const weekNumber = weekAt(block.startDate, input.date);
    const template = block.templateId ? await db.athleticsBlockTemplates.get(block.templateId) : undefined;
    const phase = template?.phases[weekNumber - 1];
    const now = new Date().toISOString();
    const session: AthleticsPlannedSession = {
      name, kind: input.activity.kind, focus: input.activity.focus.trim(),
      exercises: structuredClone(input.activity.exercises), notes: input.activity.notes,
      volleyballType: input.activity.volleyballType,
      blockId, date: input.date, weekNumber, phaseName: phase?.name ?? `Week ${weekNumber}`,
      phaseGuidance: phase?.guidance ?? "", reducedVolume: Boolean(phase?.reducedVolume),
      status: "planned", manualOverride: true, createdAt: now, updatedAt: now,
    };
    const id = await db.athleticsPlannedSessions.add(session);
    const activityId = await createSessionActivity({ ...session, id });
    if (input.completed) await completePlannedActivity(activityId, input.date);
    return id;
  });
}

export async function deleteBlockSession(sessionId: number) {
  return db.transaction("rw", tables(), async () => {
    const session = await db.athleticsPlannedSessions.get(sessionId);
    if (!session || session.deletedAt) throw new Error("Training session not found.");
    const activity = session.plannedActivityId ? await db.plannedActivities.get(session.plannedActivityId) : undefined;
    const events = activity?.id ? await db.activityEvents.where("plannedActivityId").equals(activity.id).toArray() : [];
    const eventIds = new Set(events.map((event) => event.id));
    const xp = activity?.id ? await db.xpEvents.filter((event) =>
      event.dedupeKey === getCompletionDedupeKey(activity.id!) || event.source === `activity:${activity.id}` ||
      (event.activityEventId !== undefined && eventIds.has(event.activityEventId))
    ).toArray() : [];
    const deletedAt = new Date().toISOString();
    await db.athleticsPlannedSessions.update(sessionId, { deletedAt, manualOverride: true, templateWeekNumber: session.templateWeekNumber ?? session.weekNumber, templateDate: session.templateDate ?? session.date, templateActivityId: session.templateActivityId ?? (session.manualOverride ? undefined : `session-activity-${session.id}`), updatedAt: deletedAt });
    if (activity?.id) await db.plannedActivities.update(activity.id, { deletedAt, updatedAt: deletedAt });
    for (const event of events) if (!event.voidedAt) await db.activityEvents.update(event.id!, { voidedAt: deletedAt });
    for (const event of xp) if (!event.voidedAt) await db.xpEvents.update(event.id!, { voidedAt: deletedAt });
    return { session, activity, events, xp, deletedAt };
  });
}

export type DeletedBlockSession = Awaited<ReturnType<typeof deleteBlockSession>>;

export async function restoreBlockSession(snapshot: DeletedBlockSession) {
  return db.transaction("rw", tables(), async () => {
    const current = await db.athleticsPlannedSessions.get(snapshot.session.id!);
    if (!current || current.deletedAt !== snapshot.deletedAt) throw new Error("This deletion has already changed.");
    const now = new Date().toISOString();
    await db.athleticsPlannedSessions.update(current.id!, { deletedAt: undefined, manualOverride: true, updatedAt: now });
    if (snapshot.activity?.id) await db.plannedActivities.update(snapshot.activity.id, { deletedAt: snapshot.activity.deletedAt, updatedAt: now });
    for (const event of snapshot.events) await db.activityEvents.update(event.id!, { voidedAt: event.voidedAt });
    for (const event of snapshot.xp) await db.xpEvents.update(event.id!, { voidedAt: event.voidedAt });
  });
}
