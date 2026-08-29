import {
  db,
  type AthleticsPlannedExercise,
  type AthleticsPlannedSession,
  type AthleticsSaturdayChoice,
  type AthleticsTrainingBlock,
  type PlannedActivity,
} from "../../../database/db";
import { cancelPlannedActivity, createPlannedActivity, movePlannedActivity } from "../../activities/services/activityService";
import { getActivityDisplayStatus, getActivityStatus, isActivityVisible } from "../../activities/services/activityLifecycle";
import {
  lowerAExercises,
  lowerBExercises,
  SEPTEMBER_2026_BLOCK_KEY,
  septemberTrainingPhases,
  upperAExercises,
  upperBExercises,
} from "./septemberTrainingBlock";

export type TrainingSessionDisplayStatus = "planned" | "completed" | "missed" | "skipped" | "recovery";

type SessionSeed = Pick<AthleticsPlannedSession, "date" | "weekNumber" | "phaseName" | "phaseGuidance" | "kind" | "name" | "focus" | "exercises" | "volleyballType" | "saturdayChoice" | "reducedVolume" | "notes">;

function addDays(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T12:00:00`); date.setDate(date.getDate() + days);
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}

function cloneExercises(exercises: AthleticsPlannedExercise[]) {
  return exercises.map((item) => ({ ...item, alternatives: item.alternatives ? [...item.alternatives] : undefined }));
}

function septemberSessionSeeds(): SessionSeed[] {
  return septemberTrainingPhases.flatMap((phase, index) => {
    const monday = addDays("2026-08-31", index * 7); const reduced = phase.weekNumber === 4;
    const shared = { weekNumber: phase.weekNumber, phaseName: phase.name, phaseGuidance: phase.guidance };
    return [
      { ...shared, date: monday, kind: "volleyball", name: "Sand Volleyball", focus: "Reactive athleticism · jumping · change of direction · conditioning", exercises: [], volleyballType: "practice", notes: "Volleyball provides the primary reactive jumping and change-of-direction volume." },
      { ...shared, date: addDays(monday, 1), kind: "gym", name: "Upper A", focus: "Chest + Back Hypertrophy", exercises: cloneExercises(upperAExercises), reducedVolume: reduced },
      { ...shared, date: addDays(monday, 2), kind: "gym", name: "Lower A", focus: "Vertical Explosiveness + Quad Hypertrophy", exercises: cloneExercises(lowerAExercises), reducedVolume: reduced, notes: "Explosive work comes first. Rest fully and stop when jump quality falls." },
      { ...shared, date: addDays(monday, 3), kind: "gym", name: "Upper B", focus: "Shoulders + Arms + Upper Hypertrophy", exercises: cloneExercises(upperBExercises), reducedVolume: reduced },
      { ...shared, date: addDays(monday, 4), kind: "gym", name: "Lower B", focus: "Quickness + Posterior Chain Hypertrophy", exercises: cloneExercises(lowerBExercises), reducedVolume: reduced, notes: "Explosive work comes first. Friday volume also drops whenever Saturday volleyball is selected." },
      { ...shared, date: addDays(monday, 5), kind: "recovery", name: "Saturday Recovery", focus: "Recovery by default · optional Sand Volleyball", exercises: [], saturdayChoice: "recovery" },
      { ...shared, date: addDays(monday, 6), kind: "recovery", name: "Full Rest", focus: "Recover and prepare for the next week", exercises: [] },
    ] as SessionSeed[];
  });
}

function activityKind(sessionId: number) { return `athletics-plan-session:${sessionId}`; }
export function getTrainingSessionIdFromActivity(activity: Pick<PlannedActivity, "activityKind">) {
  const match = activity.activityKind?.match(/^athletics-plan-session:(\d+)$/); return match ? Number(match[1]) : null;
}
export function isTrainingSessionActivity(activity: Pick<PlannedActivity, "activityKind">) { return getTrainingSessionIdFromActivity(activity) !== null; }

async function createSessionActivity(session: AthleticsPlannedSession & { id: number }) {
  const id = await createPlannedActivity({
    title: session.kind === "volleyball" ? "Sand Volleyball" : `${session.name} · ${session.focus}`,
    scheduledDate: session.date,
    pillar: "athletics",
    activityKind: activityKind(session.id),
    difficulty: session.kind === "gym" ? "hard" : "medium",
    notes: `${session.phaseName} · ${session.phaseGuidance}${session.notes ? `\n${session.notes}` : ""}`,
  });
  await db.athleticsPlannedSessions.update(session.id, { plannedActivityId: id, updatedAt: new Date().toISOString() });
  return id;
}

export async function installSeptember2026TrainingBlock() {
  const existing = await db.athleticsTrainingBlocks.where("key").equals(SEPTEMBER_2026_BLOCK_KEY).filter((item) => !item.deletedAt).first();
  if (existing?.id) return { blockId: existing.id, installed: false, sessionCount: await db.athleticsPlannedSessions.where("blockId").equals(existing.id).filter((item) => !item.deletedAt).count() };

  return db.transaction("rw", db.athleticsTrainingBlocks, db.athleticsPlannedSessions, db.plannedActivities, async () => {
    const now = new Date().toISOString();
    const blockId = await db.athleticsTrainingBlocks.add({ key: SEPTEMBER_2026_BLOCK_KEY, name: "September Training Block", startDate: "2026-08-31", endDate: "2026-09-27", goal: "Build muscle while improving explosiveness, quickness, first-step speed, and volleyball performance.", active: true, createdAt: now, updatedAt: now });
    for (const seed of septemberSessionSeeds()) {
      const sessionId = await db.athleticsPlannedSessions.add({ ...seed, blockId, status: "planned", createdAt: now, updatedAt: now });
      if (seed.kind !== "recovery") await createSessionActivity({ ...seed, id: sessionId, blockId, status: "planned", createdAt: now, updatedAt: now });
    }
    return { blockId, installed: true, sessionCount: 28 };
  });
}

export function visibleTrainingBlocks(blocks: AthleticsTrainingBlock[]) { return blocks.filter((item) => !item.deletedAt).sort((a, b) => a.startDate.localeCompare(b.startDate)); }
export function visibleTrainingSessions(sessions: AthleticsPlannedSession[]) { return sessions.filter((item) => !item.deletedAt).sort((a, b) => a.date.localeCompare(b.date)); }

export function getSessionScheduledDate(session: AthleticsPlannedSession, activities: PlannedActivity[]) {
  return activities.find((item) => item.id === session.plannedActivityId)?.scheduledDate ?? session.date;
}

export function getTrainingSessionDisplayStatus(session: AthleticsPlannedSession, activities: PlannedActivity[], todayKey: string): TrainingSessionDisplayStatus {
  if (session.status === "skipped") return "skipped";
  if (session.kind === "recovery") return "recovery";
  const activity = activities.find((item) => item.id === session.plannedActivityId);
  if (!activity || !isActivityVisible(activity)) return "skipped";
  const status = getActivityDisplayStatus(activity, todayKey);
  if (status === "completed") return "completed";
  if (status === "missed") return "missed";
  return "planned";
}

export async function setSaturdayTrainingChoice(sessionId: number, choice: AthleticsSaturdayChoice) {
  return db.transaction("rw", db.athleticsPlannedSessions, db.plannedActivities, async () => {
    const session = await db.athleticsPlannedSessions.get(sessionId);
    if (!session || session.deletedAt || !session.saturdayChoice) throw new Error("Saturday decision not found.");
    const now = new Date().toISOString();
    if (choice === "volleyball") {
      await db.athleticsPlannedSessions.update(sessionId, { kind: "volleyball", name: "Sand Volleyball", focus: "Optional Saturday sand session", volleyballType: "practice", saturdayChoice: choice, status: "planned", updatedAt: now });
      if (!session.plannedActivityId) {
        const updated = (await db.athleticsPlannedSessions.get(sessionId))!;
        await createSessionActivity({ ...updated, id: sessionId });
      } else {
        await db.plannedActivities.update(session.plannedActivityId, { title: "Sand Volleyball", status: "planned", completed: false, cancelledAt: undefined, dismissedAt: undefined, updatedAt: now });
      }
    } else {
      await db.athleticsPlannedSessions.update(sessionId, { kind: "recovery", name: "Saturday Recovery", focus: "Recovery by default · optional Sand Volleyball", volleyballType: undefined, saturdayChoice: choice, status: "planned", updatedAt: now });
      if (session.plannedActivityId) await cancelPlannedActivity(session.plannedActivityId);
    }
    const friday = await db.athleticsPlannedSessions.where("blockId").equals(session.blockId).filter((item) => item.date === addDays(session.date, -1) && item.name === "Lower B" && !item.deletedAt).first();
    if (friday?.id) await db.athleticsPlannedSessions.update(friday.id, { reducedVolume: choice === "volleyball" || friday.weekNumber === 4, updatedAt: now });
  });
}

export async function skipTrainingSession(sessionId: number) {
  const session = await db.athleticsPlannedSessions.get(sessionId); if (!session || session.deletedAt) throw new Error("Training session not found.");
  await db.athleticsPlannedSessions.update(sessionId, { status: "skipped", updatedAt: new Date().toISOString() });
  if (session.plannedActivityId) await cancelPlannedActivity(session.plannedActivityId);
}

export async function moveTrainingSession(sessionId: number, date: string) {
  const session = await db.athleticsPlannedSessions.get(sessionId); if (!session?.plannedActivityId) throw new Error("This session is not linked to Planner.");
  await movePlannedActivity(session.plannedActivityId, date);
}

export async function getTrainingSessionByActivity(activityId: number) {
  return db.athleticsPlannedSessions.where("plannedActivityId").equals(activityId).filter((item) => !item.deletedAt).first();
}

export async function getTrainingBlockProgress(blockId: number) {
  const [sessions, activities] = await Promise.all([db.athleticsPlannedSessions.where("blockId").equals(blockId).toArray(), db.plannedActivities.toArray()]);
  const actionable = sessions.filter((item) => !item.deletedAt && item.kind !== "recovery");
  return { planned: actionable.length, completed: actionable.filter((session) => getActivityStatus(activities.find((item) => item.id === session.plannedActivityId) ?? { completed: false } as PlannedActivity) === "completed").length };
}
