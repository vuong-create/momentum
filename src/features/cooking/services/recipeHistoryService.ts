import type { CookingMealLog, PlannedActivity } from "../../../database/db";
import { getActivityStatus } from "../../activities/services/activityLifecycle";
import { parseRecipeActivityKind } from "../cookingCatalog";

export type RecipeCookingHistory = {
  timesMade: number;
  lastMadeDate?: string;
};

export function getRecipeCookingHistory(
  recipeId: number,
  logs: CookingMealLog[],
  plans: PlannedActivity[],
): RecipeCookingHistory {
  const planById = new Map(plans.filter(({ id }) => id).map((plan) => [plan.id!, plan]));
  const visibleLogs = logs.filter((log) => {
    if (log.deletedAt) return false;
    if (log.recipeId === recipeId) return true;
    const plan = log.plannedActivityId ? planById.get(log.plannedActivityId) : undefined;
    return parseRecipeActivityKind(plan?.activityKind) === recipeId;
  });
  const loggedPlanIds = new Set(visibleLogs.map(({ plannedActivityId }) => plannedActivityId).filter(Boolean));
  const legacyCompletedPlans = plans.filter((plan) =>
    plan.id &&
    !plan.deletedAt &&
    parseRecipeActivityKind(plan.activityKind) === recipeId &&
    getActivityStatus(plan) === "completed" &&
    !loggedPlanIds.has(plan.id)
  );
  const dates = [
    ...visibleLogs.map((log) => log.date || log.completedAt.slice(0, 10)),
    ...legacyCompletedPlans.map((plan) => plan.completedAt?.slice(0, 10) ?? plan.scheduledDate ?? plan.updatedAt?.slice(0, 10) ?? plan.date.slice(0, 10)),
  ].filter(Boolean).sort().reverse();

  return {
    timesMade: visibleLogs.length + legacyCompletedPlans.length,
    lastMadeDate: dates[0],
  };
}
