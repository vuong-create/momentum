import {
  db,
  type AthleticsBlockTemplate,
  type AthleticsBlockTemplateDay,
  type AthleticsBlockTemplatePhase,
  type AthleticsPlannedExercise,
  type AthleticsPlannedSession,
  type AthleticsSaturdayChoice,
  type AthleticsTrainingBlock,
  type PlannedActivity,
} from "../../../database/db";
import { cancelPlannedActivity, completePlannedActivity, createPlannedActivity, movePlannedActivity, reopenPlannedActivity } from "../../activities/services/activityService";
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

type SessionSeed = Pick<AthleticsPlannedSession, "date" | "weekNumber" | "phaseName" | "phaseGuidance" | "kind" | "name" | "focus" | "exercises" | "volleyballType" | "saturdayChoice" | "reducedVolume" | "notes" | "templateDayId">;

function addDays(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T12:00:00`); date.setDate(date.getDate() + days);
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}
function daysBetween(start: string, end: string) { return Math.round((new Date(`${end}T12:00:00`).getTime() - new Date(`${start}T12:00:00`).getTime()) / 86_400_000); }

function cloneExercises(exercises: AthleticsPlannedExercise[]) {
  return exercises.map((item) => ({ ...item, alternatives: item.alternatives ? [...item.alternatives] : undefined }));
}

function defaultTemplateDays(): AthleticsBlockTemplateDay[] {
  return [
    { id: "monday-volleyball", dayOffset: 0, kind: "volleyball", name: "Sand Volleyball", focus: "Reactive athleticism · jumping · change of direction · conditioning", exercises: [], volleyballType: "practice", notes: "Volleyball provides the primary reactive jumping and change-of-direction volume." },
    { id: "tuesday-upper-a", dayOffset: 1, kind: "gym", name: "Upper A", focus: "Chest + Back Hypertrophy", exercises: cloneExercises(upperAExercises) },
    { id: "wednesday-lower-a", dayOffset: 2, kind: "gym", name: "Lower A", focus: "Vertical Explosiveness + Quad Hypertrophy", exercises: cloneExercises(lowerAExercises), notes: "Explosive work comes first. Rest fully and stop when jump quality falls." },
    { id: "thursday-upper-b", dayOffset: 3, kind: "gym", name: "Upper B", focus: "Shoulders + Arms + Upper Hypertrophy", exercises: cloneExercises(upperBExercises) },
    { id: "friday-lower-b", dayOffset: 4, kind: "gym", name: "Lower B", focus: "Quickness + Posterior Chain Hypertrophy", exercises: cloneExercises(lowerBExercises), notes: "Explosive work comes first. Friday volume also drops whenever Saturday volleyball is selected." },
    { id: "saturday-choice", dayOffset: 5, kind: "recovery", name: "Saturday Recovery", focus: "Recovery by default · optional Sand Volleyball", exercises: [], saturdayChoice: "recovery" },
    { id: "sunday-rest", dayOffset: 6, kind: "recovery", name: "Full Rest", focus: "Recover and prepare for the next week", exercises: [] },
  ];
}

function defaultTemplatePhases(): AthleticsBlockTemplatePhase[] {
  return septemberTrainingPhases.map((phase) => ({ ...phase, reducedVolume: phase.weekNumber === 4 }));
}

function normalizeTemplateDays(days: AthleticsBlockTemplateDay[]) {
  return days.map((day, index) => ({
    ...day,
    id: day.id || `template-day-${crypto.randomUUID()}`,
    dayOffset: index,
    name: day.name.trim() || (day.kind === "recovery" ? "Recovery" : "Training"),
    focus: day.focus.trim(),
    exercises: cloneExercises(day.exercises.filter((exercise) => exercise.name.trim()).map((exercise) => ({ ...exercise, name: exercise.name.trim(), prescribedSets: Math.max(1, Math.round(exercise.prescribedSets)), repRange: exercise.repRange?.trim() || "complete", targetLabel: `${Math.max(1, Math.round(exercise.prescribedSets))} × ${exercise.repRange?.trim() || "complete"}${exercise.perSide ? " / side" : ""}` }))),
  }));
}

function normalizePhases(phases: AthleticsBlockTemplatePhase[], weekCount: number) {
  return Array.from({ length: weekCount }, (_, index) => {
    const phase = phases[index] ?? phases.at(-1);
    return { weekNumber: index + 1, name: phase?.name.trim() || `Week ${index + 1}`, guidance: phase?.guidance.trim() || "Train with intention and recover well.", reducedVolume: Boolean(phase?.reducedVolume) };
  });
}

export function visibleAthleticsBlockTemplates(templates: AthleticsBlockTemplate[]) { return templates.filter((item) => !item.deletedAt).sort((a, b) => a.createdAt.localeCompare(b.createdAt)); }

export async function ensureAthleticsBlockTemplates() {
  return db.transaction("rw", db.athleticsBlockTemplates, db.athleticsTrainingBlocks, async () => {
    const existing = await db.athleticsBlockTemplates.where("key").equals("hypertrophy-volleyball-base").first();
    if (existing?.id && !existing.deletedAt) return existing.id;
    const timestamp = new Date().toISOString();
    const values = { key: "hypertrophy-volleyball-base", name: "Hypertrophy + Volleyball", goal: "Build muscle while improving explosiveness, quickness, first-step speed, and volleyball performance.", weekCount: 4, days: defaultTemplateDays(), phases: defaultTemplatePhases(), createdAt: existing?.createdAt ?? timestamp, updatedAt: timestamp, deletedAt: undefined };
    let id: number;
    if (existing?.id) { await db.athleticsBlockTemplates.put({ ...existing, ...values, id: existing.id }); id = existing.id; }
    else id = await db.athleticsBlockTemplates.add(values);
    const september = await db.athleticsTrainingBlocks.where("key").equals(SEPTEMBER_2026_BLOCK_KEY).first();
    if (september?.id && !september.templateId) await db.athleticsTrainingBlocks.update(september.id, { templateId: id, updatedAt: timestamp });
    return id;
  });
}

export interface AthleticsBlockDefinitionInput {
  name: string;
  goal: string;
  weekCount: number;
  days: AthleticsBlockTemplateDay[];
  phases: AthleticsBlockTemplatePhase[];
}

export async function updateAthleticsBlockTemplate(templateId: number, input: AthleticsBlockDefinitionInput) {
  const template = await db.athleticsBlockTemplates.get(templateId); if (!template || template.deletedAt) throw new Error("Training template not found.");
  const weekCount = Math.min(12, Math.max(1, Math.round(input.weekCount)));
  await db.athleticsBlockTemplates.update(templateId, { name: input.name.trim() || template.name, goal: input.goal.trim(), weekCount, days: normalizeTemplateDays(input.days), phases: normalizePhases(input.phases, weekCount), updatedAt: new Date().toISOString() });
}

export async function createAthleticsBlockTemplate(input: AthleticsBlockDefinitionInput) {
  const timestamp = new Date().toISOString(); const weekCount = Math.min(12, Math.max(1, Math.round(input.weekCount)));
  return db.athleticsBlockTemplates.add({ key: `custom-${Date.now()}-${crypto.randomUUID()}`, name: input.name.trim() || "Training Block", goal: input.goal.trim(), weekCount, days: normalizeTemplateDays(input.days), phases: normalizePhases(input.phases, weekCount), createdAt: timestamp, updatedAt: timestamp });
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
function sessionActivityTitle(session: Pick<AthleticsPlannedSession, "kind" | "name" | "focus">) { return session.kind === "volleyball" ? session.name || "Volleyball" : `${session.name} · ${session.focus}`; }
function sessionActivityNotes(session: Pick<AthleticsPlannedSession, "phaseName" | "phaseGuidance" | "notes">) { return `${session.phaseName} · ${session.phaseGuidance}${session.notes ? `\n${session.notes}` : ""}`; }
export function getTrainingSessionIdFromActivity(activity: Pick<PlannedActivity, "activityKind">) {
  const match = activity.activityKind?.match(/^athletics-plan-session:(\d+)$/); return match ? Number(match[1]) : null;
}
export function isTrainingSessionActivity(activity: Pick<PlannedActivity, "activityKind">) { return getTrainingSessionIdFromActivity(activity) !== null; }

async function createSessionActivity(session: AthleticsPlannedSession & { id: number }) {
  const id = await createPlannedActivity({
    title: sessionActivityTitle(session),
    scheduledDate: session.date,
    pillar: "athletics",
    activityKind: activityKind(session.id),
    difficulty: session.kind === "gym" ? "hard" : "medium",
    notes: sessionActivityNotes(session),
  });
  await db.athleticsPlannedSessions.update(session.id, { plannedActivityId: id, updatedAt: new Date().toISOString() });
  return id;
}

export async function installSeptember2026TrainingBlock() {
  const templateId = await ensureAthleticsBlockTemplates();
  const existing = await db.athleticsTrainingBlocks.where("key").equals(SEPTEMBER_2026_BLOCK_KEY).filter((item) => !item.deletedAt).first();
  if (existing?.id) { if (!existing.templateId) await db.athleticsTrainingBlocks.update(existing.id, { templateId }); return { blockId: existing.id, installed: false, sessionCount: await db.athleticsPlannedSessions.where("blockId").equals(existing.id).filter((item) => !item.deletedAt).count() }; }

  return db.transaction("rw", db.athleticsTrainingBlocks, db.athleticsPlannedSessions, db.plannedActivities, async () => {
    const now = new Date().toISOString();
    const blockId = await db.athleticsTrainingBlocks.add({ key: SEPTEMBER_2026_BLOCK_KEY, name: "September Training Block", startDate: "2026-08-31", endDate: "2026-09-27", goal: "Build muscle while improving explosiveness, quickness, first-step speed, and volleyball performance.", active: true, templateId, celebratedWeeks: [], createdAt: now, updatedAt: now });
    for (const seed of septemberSessionSeeds()) {
      const sessionId = await db.athleticsPlannedSessions.add({ ...seed, blockId, status: "planned", createdAt: now, updatedAt: now });
      if (seed.kind !== "recovery") await createSessionActivity({ ...seed, id: sessionId, blockId, status: "planned", createdAt: now, updatedAt: now });
    }
    return { blockId, installed: true, sessionCount: 28 };
  });
}

export async function scheduleAthleticsTrainingBlock(templateId: number, input: { name: string; startDate: string; weekCount?: number }) {
  const template = await db.athleticsBlockTemplates.get(templateId); if (!template || template.deletedAt) throw new Error("Training template not found.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.startDate)) throw new Error("Choose a valid start date.");
  const weekCount = Math.min(12, Math.max(1, Math.round(input.weekCount ?? template.weekCount))); const phases = normalizePhases(template.phases, weekCount); const days = normalizeTemplateDays(template.days);
  return db.transaction("rw", db.athleticsTrainingBlocks, db.athleticsPlannedSessions, db.plannedActivities, async () => {
    const timestamp = new Date().toISOString();
    await db.athleticsTrainingBlocks.toCollection().modify((block) => { if (!block.deletedAt) block.active = false; });
    const blockId = await db.athleticsTrainingBlocks.add({ key: `scheduled-${Date.now()}-${crypto.randomUUID()}`, name: input.name.trim() || template.name, startDate: input.startDate, endDate: addDays(input.startDate, weekCount * 7 - 1), goal: template.goal, active: true, templateId, celebratedWeeks: [], createdAt: timestamp, updatedAt: timestamp });
    for (let weekIndex = 0; weekIndex < weekCount; weekIndex += 1) {
      const phase = phases[weekIndex];
      for (const day of days) {
        const sessionId = await db.athleticsPlannedSessions.add({ blockId, date: addDays(input.startDate, weekIndex * 7 + day.dayOffset), weekNumber: weekIndex + 1, phaseName: phase.name, phaseGuidance: phase.guidance, kind: day.kind, name: day.name, focus: day.focus, exercises: cloneExercises(day.exercises), volleyballType: day.volleyballType, saturdayChoice: day.saturdayChoice, reducedVolume: Boolean(phase.reducedVolume), status: "planned", notes: day.notes, templateDayId: day.id, createdAt: timestamp, updatedAt: timestamp });
        if (day.kind !== "recovery") {
          const session = (await db.athleticsPlannedSessions.get(sessionId))!;
          await createSessionActivity({ ...session, id: sessionId });
        }
      }
    }
    return { blockId, sessionCount: weekCount * days.length, taskCount: weekCount * days.filter((day) => day.kind !== "recovery").length };
  });
}

export async function setActiveTrainingBlock(blockId: number) {
  const target = await db.athleticsTrainingBlocks.get(blockId); if (!target || target.deletedAt) throw new Error("Training block not found.");
  const timestamp = new Date().toISOString();
  await db.athleticsTrainingBlocks.toCollection().modify((block) => { if (!block.deletedAt) { block.active = block.id === blockId; block.updatedAt = timestamp; } });
}

export function getTrainingBlockDefinition(block: AthleticsTrainingBlock, sessions: AthleticsPlannedSession[]): AthleticsBlockDefinitionInput {
  const blockSessions = sessions.filter((session) => session.blockId === block.id && !session.deletedAt);
  const weekCount = Math.max(1, ...blockSessions.map((session) => session.weekNumber));
  const firstWeek = blockSessions.filter((session) => session.weekNumber === 1).sort((a, b) => a.date.localeCompare(b.date));
  const days = Array.from({ length: 7 }, (_, dayOffset) => {
    const session = firstWeek.find((item) => Math.abs(daysBetween(block.startDate, item.date)) % 7 === dayOffset);
    return session ? { id: session.templateDayId ?? `block-day-${dayOffset}`, dayOffset, kind: session.kind, name: session.name, focus: session.focus, exercises: cloneExercises(session.exercises), volleyballType: session.volleyballType, saturdayChoice: session.saturdayChoice, notes: session.notes } : { id: `block-day-${dayOffset}`, dayOffset, kind: "recovery" as const, name: "Recovery", focus: "Recover", exercises: [] };
  });
  const phases = Array.from({ length: weekCount }, (_, index) => {
    const session = blockSessions.find((item) => item.weekNumber === index + 1);
    return { weekNumber: index + 1, name: session?.phaseName ?? `Week ${index + 1}`, guidance: session?.phaseGuidance ?? "Train with intention and recover well.", reducedVolume: blockSessions.filter((item) => item.weekNumber === index + 1 && item.kind === "gym").every((item) => item.reducedVolume) };
  });
  return { name: block.name, goal: block.goal, weekCount, days, phases };
}

export async function updateCurrentTrainingBlock(blockId: number, input: AthleticsBlockDefinitionInput) {
  const block = await db.athleticsTrainingBlocks.get(blockId); if (!block || block.deletedAt) throw new Error("Training block not found.");
  const sessions = await db.athleticsPlannedSessions.where("blockId").equals(blockId).filter((session) => !session.deletedAt).toArray();
  const activities = await db.plannedActivities.toArray(); const days = normalizeTemplateDays(input.days); const phases = normalizePhases(input.phases, Math.max(1, ...sessions.map((session) => session.weekNumber))); const timestamp = new Date().toISOString(); let updated = 0;
  await db.transaction("rw", db.athleticsTrainingBlocks, db.athleticsPlannedSessions, db.plannedActivities, async () => {
    await db.athleticsTrainingBlocks.update(blockId, { name: input.name.trim() || block.name, goal: input.goal.trim(), updatedAt: timestamp });
    for (const session of sessions) {
      const activity = activities.find((item) => item.id === session.plannedActivityId);
      if (activity && getActivityStatus(activity) === "completed") continue;
      const dayOffset = ((daysBetween(block.startDate, session.date) % 7) + 7) % 7; const day = days[dayOffset]; const phase = phases[session.weekNumber - 1] ?? phases.at(-1)!;
      const patch = { phaseName: phase.name, phaseGuidance: phase.guidance, kind: day.kind, name: day.name, focus: day.focus, exercises: cloneExercises(day.exercises), volleyballType: day.volleyballType, saturdayChoice: day.saturdayChoice, reducedVolume: Boolean(phase.reducedVolume), notes: day.notes, templateDayId: day.id, status: "planned" as const, updatedAt: timestamp };
      await db.athleticsPlannedSessions.update(session.id!, patch); const updatedSession = { ...session, ...patch };
      if (day.kind === "recovery") {
        if (session.plannedActivityId && activity && isActivityVisible(activity)) await cancelPlannedActivity(session.plannedActivityId);
      } else if (session.plannedActivityId && activity && !activity.deletedAt) {
        await db.plannedActivities.update(session.plannedActivityId, { title: sessionActivityTitle(updatedSession), notes: sessionActivityNotes(updatedSession), pillar: "athletics", activityKind: activityKind(session.id!), difficulty: day.kind === "gym" ? "hard" : "medium", status: "planned", completed: false, completedAt: undefined, cancelledAt: undefined, dismissedAt: undefined, updatedAt: timestamp });
      } else {
        await createSessionActivity({ ...updatedSession, id: session.id! });
      }
      updated += 1;
    }
  });
  return updated;
}

export async function acknowledgeTrainingWeek(blockId: number, weekNumber: number) {
  const block = await db.athleticsTrainingBlocks.get(blockId); if (!block || block.deletedAt) return false;
  const celebratedWeeks = [...new Set([...(block.celebratedWeeks ?? []), weekNumber])].sort((a, b) => a - b);
  if (celebratedWeeks.length === (block.celebratedWeeks ?? []).length) return false;
  await db.athleticsTrainingBlocks.update(blockId, { celebratedWeeks, updatedAt: new Date().toISOString() }); return true;
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

export async function completeTrainingSession(sessionId: number) {
  const session = await db.athleticsPlannedSessions.get(sessionId);
  if (!session?.plannedActivityId || session.deletedAt || session.kind === "recovery" || session.status === "skipped") throw new Error("This training session cannot be completed.");
  return completePlannedActivity(session.plannedActivityId);
}

export async function reopenTrainingSession(sessionId: number) {
  const session = await db.athleticsPlannedSessions.get(sessionId);
  if (!session?.plannedActivityId || session.deletedAt) throw new Error("This training session cannot be reopened.");
  return reopenPlannedActivity(session.plannedActivityId);
}

export interface TrainingBlockTemplateUpdate {
  focus: string;
  exercises: AthleticsPlannedExercise[];
}

export async function updateTrainingBlockTemplate(
  blockId: number,
  sessionName: string,
  input: TrainingBlockTemplateUpdate,
) {
  const [sessions, activities] = await Promise.all([
    db.athleticsPlannedSessions.where("blockId").equals(blockId).toArray(),
    db.plannedActivities.toArray(),
  ]);
  const targets = sessions.filter((session) => session.kind === "gym" && session.name === sessionName && session.status !== "skipped" && !session.deletedAt && getActivityStatus(activities.find((activity) => activity.id === session.plannedActivityId) ?? { completed: false } as PlannedActivity) !== "completed");
  const focus = input.focus.trim() || sessionName;
  const exercises = input.exercises.filter((item) => item.name.trim()).map((item) => ({ ...item, name: item.name.trim(), prescribedSets: Math.max(1, Math.round(item.prescribedSets)), targetLabel: `${Math.max(1, Math.round(item.prescribedSets))} × ${item.repRange?.trim() || "complete"}`, alternatives: item.alternatives?.includes(item.name.trim()) ? item.alternatives : undefined }));
  if (!exercises.length) throw new Error("Keep at least one exercise in the template.");
  const now = new Date().toISOString();

  await db.transaction("rw", db.athleticsPlannedSessions, db.plannedActivities, async () => {
    for (const session of targets) {
      await db.athleticsPlannedSessions.update(session.id!, { focus, exercises: cloneExercises(exercises), updatedAt: now });
      if (session.plannedActivityId) await db.plannedActivities.update(session.plannedActivityId, { title: `${session.name} · ${focus}`, notes: `${session.phaseName} · ${session.phaseGuidance}${session.notes ? `\n${session.notes}` : ""}`, updatedAt: now });
    }
  });
  return targets.length;
}

export async function getTrainingSessionByActivity(activityId: number) {
  return db.athleticsPlannedSessions.where("plannedActivityId").equals(activityId).filter((item) => !item.deletedAt).first();
}

export async function getTrainingBlockProgress(blockId: number) {
  const [sessions, activities] = await Promise.all([db.athleticsPlannedSessions.where("blockId").equals(blockId).toArray(), db.plannedActivities.toArray()]);
  const actionable = sessions.filter((item) => !item.deletedAt && item.kind !== "recovery");
  return { planned: actionable.length, completed: actionable.filter((session) => getActivityStatus(activities.find((item) => item.id === session.plannedActivityId) ?? { completed: false } as PlannedActivity) === "completed").length };
}
