import { db } from "../../../database/db";
import type {
  FocusPhase,
  FocusSession,
  PlannedActivity,
} from "../../../database/db";

const SHORT_BREAK_SECONDS = 5 * 60;
const LONG_BREAK_SECONDS = 15 * 60;

function nowIso(now = new Date()) {
  return now.toISOString();
}

export function getRemainingSeconds(session: FocusSession, now = new Date()) {
  if (session.status !== "active" || !session.phaseEndsAt) {
    return Math.max(0, session.remainingSeconds);
  }
  return Math.max(
    0,
    Math.ceil((new Date(session.phaseEndsAt).getTime() - now.getTime()) / 1000),
  );
}

export async function startFocusSession(
  activity: PlannedActivity,
  focusMinutes: number,
  now = new Date(),
) {
  if (!activity.id) throw new Error("Choose a saved activity before focusing.");
  const existing = await db.focusSessions
    .where("activityId")
    .equals(activity.id)
    .filter((session) => session.status === "active" || session.status === "paused")
    .first();
  if (existing?.id) return existing.id;

  const startedAt = nowIso(now);
  const duration = Math.max(1, Math.round(focusMinutes)) * 60;
  return db.focusSessions.add({
    activityId: activity.id,
    activityTitle: activity.title,
    pillar: activity.pillar,
    status: "active",
    phase: "focus",
    focusMinutes,
    phaseDurationSeconds: duration,
    remainingSeconds: duration,
    phaseStartedAt: startedAt,
    phaseEndsAt: new Date(now.getTime() + duration * 1000).toISOString(),
    completedCycles: 0,
    focusedSeconds: 0,
    startedAt,
    updatedAt: startedAt,
  });
}

export async function pauseFocusSession(id: number, now = new Date()) {
  const session = await db.focusSessions.get(id);
  if (!session || session.status !== "active") return;
  const updatedAt = nowIso(now);
  await db.focusSessions.update(id, {
    status: "paused",
    remainingSeconds: getRemainingSeconds(session, now),
    phaseEndsAt: undefined,
    updatedAt,
  });
}

export async function resumeFocusSession(id: number, now = new Date()) {
  const session = await db.focusSessions.get(id);
  if (!session || session.status !== "paused") return;
  const updatedAt = nowIso(now);
  await db.focusSessions.update(id, {
    status: "active",
    phaseStartedAt: updatedAt,
    phaseEndsAt: new Date(now.getTime() + session.remainingSeconds * 1000).toISOString(),
    updatedAt,
  });
}

function nextPhase(session: FocusSession, now: Date): {
  phase: FocusPhase;
  duration: number;
  completedCycles: number;
  focusedSeconds: number;
} {
  if (session.phase === "focus") {
    const completedCycles = session.completedCycles + 1;
    return {
      phase: completedCycles % 4 === 0 ? "long-break" : "short-break",
      duration: completedCycles % 4 === 0
        ? LONG_BREAK_SECONDS
        : SHORT_BREAK_SECONDS,
      completedCycles,
      focusedSeconds:
        session.focusedSeconds +
        Math.max(0, session.phaseDurationSeconds - getRemainingSeconds(session, now)),
    };
  }
  const duration = session.focusMinutes * 60;
  return {
    phase: "focus",
    duration,
    completedCycles: session.completedCycles,
    focusedSeconds: session.focusedSeconds,
  };
}

export async function advanceFocusPhase(id: number, now = new Date()) {
  const session = await db.focusSessions.get(id);
  if (!session || session.status === "completed" || session.status === "abandoned") return;
  const next = nextPhase(session, now);
  const updatedAt = nowIso(now);
  await db.focusSessions.update(id, {
    phase: next.phase,
    status: "paused",
    phaseDurationSeconds: next.duration,
    remainingSeconds: next.duration,
    phaseStartedAt: undefined,
    phaseEndsAt: undefined,
    completedCycles: next.completedCycles,
    focusedSeconds: next.focusedSeconds,
    updatedAt,
  });
}

export async function endFocusSession(id: number, abandoned = false, now = new Date()) {
  const session = await db.focusSessions.get(id);
  if (!session) return;
  const remaining = getRemainingSeconds(session, now);
  const elapsedCurrentFocus = session.phase === "focus"
    ? Math.max(0, session.phaseDurationSeconds - remaining)
    : 0;
  const updatedAt = nowIso(now);
  await db.focusSessions.update(id, {
    status: abandoned ? "abandoned" : "completed",
    remainingSeconds: remaining,
    phaseEndsAt: undefined,
    focusedSeconds: session.focusedSeconds + elapsedCurrentFocus,
    endedAt: updatedAt,
    updatedAt,
  });
}
