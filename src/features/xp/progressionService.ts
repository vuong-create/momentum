import {
  db,
  type MilestoneSnapshot,
  type Pillar,
  type WeeklyProgressResult,
} from "../../database/db";
import {
  isActivityCompleted,
  isActivityWeeklyEligible,
  resolveActivityScheduledDate,
} from "../activities/services/activityLifecycle";
import { getMomentumTitle } from "./progression";
import { getXPBreakdown } from "./XPService";

export const MOMENTUM_MILESTONE_LEVELS = [5, 10, 25, 50, 75, 100] as const;

export interface LevelUpNotice {
  previousLevel: number;
  level: number;
  title: string;
}

export interface ProgressionHomeExperience {
  weeklyResult: WeeklyProgressResult | null;
  levelUp: LevelUpNotice | null;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function toProgressionDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function fromDateKey(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date: Date, amount: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

export function getProgressionWeekStart(date: Date) {
  return addDays(date, -date.getDay());
}

export function getWeeklyBonus(percentage: number) {
  if (percentage >= 100) return 200;
  if (percentage >= 90) return 100;
  if (percentage >= 75) return 50;
  return 0;
}

export async function settleProgressionWeek(weekStartKey: string) {
  const weekEndKey = toProgressionDateKey(addDays(fromDateKey(weekStartKey), 6));
  const activities = (await db.plannedActivities.toArray()).filter((activity) => {
    const date = resolveActivityScheduledDate(activity, weekStartKey);
    return (
      isActivityWeeklyEligible(activity) &&
      Boolean(date && date >= weekStartKey && date <= weekEndKey)
    );
  });

  if (activities.length === 0) return null;

  const completedCount = activities.filter(isActivityCompleted).length;
  const completionRatio = completedCount / activities.length;
  const percentage = Math.round(completionRatio * 100);
  const bonusXP = completionRatio >= 1
    ? 200
    : completionRatio >= 0.9
      ? 100
      : completionRatio >= 0.75
        ? 50
        : 0;
  const now = new Date().toISOString();
  const dedupeKey = `weekly-result:${weekStartKey}`;

  await db.transaction(
    "rw",
    db.xpEvents,
    db.weeklyProgressResults,
    async () => {
      const bonusEvent = await db.xpEvents.where("dedupeKey").equals(dedupeKey).first();
      if (bonusXP > 0) {
        const event = {
          amount: bonusXP,
          finalXP: bonusXP,
          weeklyBonusXP: bonusXP,
          source: `week:${weekStartKey}`,
          date: `${weekEndKey}T23:59:59.000Z`,
          scope: "momentum" as const,
          actionType: "weekly-completion-bonus",
          sourceType: "weekly-result",
          sourceId: weekStartKey,
          description: percentage === 100 ? "Perfect Week" : `${percentage}% Weekly Bonus`,
          dedupeKey,
          weekStart: weekStartKey,
          voidedAt: undefined,
        };
        if (bonusEvent?.id) await db.xpEvents.update(bonusEvent.id, event);
        else await db.xpEvents.add(event);
      } else if (bonusEvent?.id && !bonusEvent.voidedAt) {
        await db.xpEvents.update(bonusEvent.id, { voidedAt: now });
      }

      const existing = await db.weeklyProgressResults
        .where("weekStart")
        .equals(weekStartKey)
        .first();
      const weekEvents = (await db.xpEvents.toArray()).filter(
        (event) =>
          !event.voidedAt && event.date.slice(0, 10) >= weekStartKey && event.date.slice(0, 10) <= weekEndKey,
      );
      const result: Omit<WeeklyProgressResult, "id"> = {
        weekStart: weekStartKey,
        weekEnd: weekEndKey,
        eligibleCount: activities.length,
        completedCount,
        percentage,
        bonusXP,
        totalWeekXP: weekEvents.reduce((sum, event) => sum + event.amount, 0),
        perfectWeek: percentage === 100,
        settledAt: existing?.settledAt ?? now,
        updatedAt: now,
        acknowledgedAt: existing?.acknowledgedAt,
      };
      if (existing?.id) await db.weeklyProgressResults.update(existing.id, result);
      else await db.weeklyProgressResults.add(result);
    },
  );

  return db.weeklyProgressResults.where("weekStart").equals(weekStartKey).first();
}

export async function settlePreviousProgressionWeek(today = new Date()) {
  const currentWeekStart = getProgressionWeekStart(today);
  return settleProgressionWeek(toProgressionDateKey(addDays(currentWeekStart, -7)));
}

async function buildMilestoneSnapshot(level: number): Promise<Omit<MilestoneSnapshot, "id">> {
  const [events, completedPlans, weeklyResults, chineseActivities, athleticsActivities, meals, journalEntries, financeTransactions] =
    await Promise.all([
      db.xpEvents.toArray(),
      db.plannedActivities.filter((activity) => isActivityCompleted(activity)).count(),
      db.weeklyProgressResults.toArray(),
      db.chineseActivities.filter((activity) => !activity.deletedAt).count(),
      db.athleticsWorkouts.filter((workout) => workout.status === "completed" && !workout.deletedAt).count(),
      db.cookingMealLogs.filter((meal) => !meal.deletedAt).count(),
      db.journalEntries.filter((entry) => !entry.deletedAt).count(),
      db.financeTransactions.filter((transaction) => !transaction.deletedAt).count(),
    ]);
  const summary = getXPBreakdown(events);
  const pillarXP = Object.fromEntries(
    summary.contributions.map((contribution) => [contribution.pillar, contribution.xp]),
  ) as Partial<Record<Pillar, number>>;

  return {
    level,
    achievedAt: new Date().toISOString(),
    lifetimeXP: summary.totalXP,
    title: getMomentumTitle(level),
    pillarXP,
    completedPlans,
    perfectWeeks: weeklyResults.filter((result) => result.perfectWeek).length,
    chineseActivities,
    athleticsActivities,
    mealsCooked: meals,
    libraryEntries: journalEntries,
    financeActivities: financeTransactions,
  };
}

export async function ensureMilestoneSnapshots(currentLevel: number) {
  for (const level of MOMENTUM_MILESTONE_LEVELS) {
    if (level > currentLevel) continue;
    const existing = await db.milestoneSnapshots.where("level").equals(level).first();
    if (!existing) await db.milestoneSnapshots.add(await buildMilestoneSnapshot(level));
  }
}

export async function prepareProgressionHomeExperience(today = new Date()) {
  await settlePreviousProgressionWeek(today);
  const summary = getXPBreakdown(await db.xpEvents.toArray());
  await ensureMilestoneSnapshots(summary.globalProgression.level);
  const state = await db.progressionState.get("global");

  if (!state) {
    await db.progressionState.put({
      id: "global",
      lastRecognizedLevel: summary.globalProgression.level,
      updatedAt: new Date().toISOString(),
    });
  } else if (summary.globalProgression.level < state.lastRecognizedLevel) {
    await db.progressionState.update("global", {
      lastRecognizedLevel: summary.globalProgression.level,
      updatedAt: new Date().toISOString(),
    });
  }

  const pendingWeekly = (await db.weeklyProgressResults.toArray())
    .filter((result) => !result.acknowledgedAt)
    .sort((first, second) => second.weekStart.localeCompare(first.weekStart))[0] ?? null;
  const levelUp = state && summary.globalProgression.level > state.lastRecognizedLevel
    ? {
        previousLevel: state.lastRecognizedLevel,
        level: summary.globalProgression.level,
        title: getMomentumTitle(summary.globalProgression.level),
      }
    : null;

  return { weeklyResult: pendingWeekly, levelUp } satisfies ProgressionHomeExperience;
}

export async function acknowledgeProgressionHomeExperience(
  experience: ProgressionHomeExperience,
) {
  const now = new Date().toISOString();
  if (experience.weeklyResult?.id) {
    await db.weeklyProgressResults.update(experience.weeklyResult.id, {
      acknowledgedAt: now,
      updatedAt: now,
    });
  }
  if (experience.levelUp) {
    await db.progressionState.put({
      id: "global",
      lastRecognizedLevel: experience.levelUp.level,
      updatedAt: now,
    });
  }
}
