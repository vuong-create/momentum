import {
  db,
  type Pillar,
  type XPEvent,
  type XPScope,
} from "../../database/db";
import {
  getMomentumTitle,
  getProgressionSummary,
  type ProgressionSummary,
} from "./progression";

export const XP_PILLARS: Pillar[] = [
  "chinese",
  "athletics",
  "cooking",
  "finance",
  "happiness",
  "core",
];

export interface XPContribution {
  pillar: Pillar;
  xp: number;
  eventCount: number;
  percentage: number;
  progression: ProgressionSummary;
}

export interface XPBreakdown {
  totalXP: number;
  momentumOnlyXP: number;
  globalProgression: ProgressionSummary;
  globalTitle: string;
  contributions: XPContribution[];
  recentEvents: XPEvent[];
}

export interface RecordXPEventInput {
  amount: number;
  source: string;
  scope: XPScope;
  actionType: string;
  sourceType: string;
  sourceId: string;
  description: string;
  pillar?: Pillar;
  dedupeKey: string;
  date?: string;
  activityEventId?: number;
  baseXP?: number;
  plannedBonusXP?: number;
  weeklyBonusXP?: number;
  weekStart?: string;
}

export function isActiveXPEvent(event: XPEvent) {
  return !event.voidedAt;
}

function contributesToPillar(event: XPEvent, pillar: Pillar) {
  return (
    isActiveXPEvent(event) &&
    event.pillar === pillar &&
    event.scope !== "momentum"
  );
}

export function getXPBreakdown(events: XPEvent[]): XPBreakdown {
  const activeEvents = events.filter(isActiveXPEvent);
  const totalXP = activeEvents.reduce((sum, event) => sum + event.amount, 0);
  const momentumOnlyXP = activeEvents.reduce(
    (sum, event) =>
      event.scope === "momentum" || !event.pillar
        ? sum + event.amount
        : sum,
    0
  );
  const globalProgression = getProgressionSummary(totalXP, "momentum");

  return {
    totalXP,
    momentumOnlyXP,
    globalProgression,
    globalTitle: getMomentumTitle(globalProgression.level),
    contributions: XP_PILLARS.map((pillar) => {
      const pillarEvents = activeEvents.filter((event) =>
        contributesToPillar(event, pillar)
      );
      const xp = pillarEvents.reduce((sum, event) => sum + event.amount, 0);

      return {
        pillar,
        xp,
        eventCount: pillarEvents.length,
        percentage: totalXP > 0 ? (xp / totalXP) * 100 : 0,
        progression: getProgressionSummary(xp, "pillar"),
      };
    }),
    recentEvents: activeEvents
      .slice()
      .sort((first, second) => second.date.localeCompare(first.date)),
  };
}

export async function recordXPEvent(input: RecordXPEventInput) {
  if (!Number.isInteger(input.amount) || input.amount <= 0) {
    throw new Error("XP awards must be a positive whole number.");
  }

  if (input.scope === "pillar" && !input.pillar) {
    throw new Error("Pillar XP needs a pillar.");
  }

  if (input.scope === "momentum" && input.pillar) {
    throw new Error("Momentum-only XP cannot belong to a pillar.");
  }

  return db.transaction("rw", db.xpEvents, async () => {
    const existing = await db.xpEvents
      .where("dedupeKey")
      .equals(input.dedupeKey)
      .first();
    const date = input.date ?? new Date().toISOString();

    if (existing?.id) {
      if (!existing.voidedAt) {
        return { id: existing.id, xpAwarded: 0, duplicate: true };
      }

      await db.xpEvents.update(existing.id, {
        ...input,
        finalXP: input.amount,
        date,
        voidedAt: undefined,
      });

      return { id: existing.id, xpAwarded: input.amount, duplicate: false };
    }

    const id = await db.xpEvents.add({
      ...input,
      finalXP: input.amount,
      date,
    });

    return { id, xpAwarded: input.amount, duplicate: false };
  });
}

export async function awardXP(amount: number, source: string) {
  return recordXPEvent({
    amount,
    source,
    scope: "momentum",
    actionType: "legacy-award",
    sourceType: "legacy",
    sourceId: source,
    description: source,
    dedupeKey: `legacy:${source}`,
  });
}

export async function getTotalXP() {
  return getXPBreakdown(await db.xpEvents.toArray()).totalXP;
}

export function calculateLevel(xp: number) {
  return getProgressionSummary(xp).level;
}

export function calculateLevelProgress(xp: number) {
  return getProgressionSummary(xp).percentage;
}
