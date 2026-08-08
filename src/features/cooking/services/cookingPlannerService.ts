import { db, type CookingMealLog, type PlannedActivity } from "../../../database/db";
import { createPlannedActivity, completePlannedActivity, reopenPlannedActivity, softDeletePlannedActivity } from "../../activities/services/activityService";
import { recordXPEvent } from "../../xp/XPService";
import { getQuickMealActivityKind, getRecipeActivityKind, type QuickMealType } from "../cookingCatalog";

export async function scheduleRecipeMeal(recipeId: number, scheduledDate: string, servings?: number) {
  const recipe = await db.cookingRecipes.get(recipeId);
  if (!recipe || recipe.deletedAt) throw new Error("Recipe not found.");
  return createPlannedActivity({
    title: recipe.name,
    scheduledDate,
    pillar: "cooking",
    activityKind: getRecipeActivityKind(recipeId),
    difficulty: "medium",
    notes: servings ? `Servings: ${servings}` : undefined,
  });
}

export async function scheduleQuickMeal(type: QuickMealType, label: string, scheduledDate: string) {
  return createPlannedActivity({
    title: label,
    scheduledDate,
    pillar: "cooking",
    activityKind: getQuickMealActivityKind(type),
    difficulty: "easy",
  });
}

export async function completeCookingPlan(activityId: number) {
  const activity = await db.plannedActivities.get(activityId);
  if (!activity || activity.deletedAt || activity.pillar !== "cooking") throw new Error("Cooking plan not found.");
  const completion = await completePlannedActivity(activityId);
  const existing = await db.cookingMealLogs.where("plannedActivityId").equals(activityId).first();
  if (!existing) {
    await db.cookingMealLogs.add({
      title: activity.title,
      date: activity.scheduledDate ?? activity.completedAt?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
      plannedActivityId: activityId,
      activityEventId: completion.activityEventId,
      completedAt: new Date().toISOString(),
    });
  }
  return completion;
}

export async function logCookedRecipe(recipeId: number, date: string, servings?: number) {
  const recipe = await db.cookingRecipes.get(recipeId);
  if (!recipe || recipe.deletedAt) throw new Error("Recipe not found.");
  const completedAt = new Date().toISOString();
  const logId = await db.cookingMealLogs.add({
    recipeId,
    title: recipe.name,
    date,
    servings,
    completedAt,
  });
  const award = await recordXPEvent({
    amount: 10,
    source: `cooking-meal:${logId}`,
    scope: "pillar",
    pillar: "cooking",
    actionType: "meal-cooked",
    sourceType: "cooking-meal",
    sourceId: String(logId),
    description: recipe.name,
    dedupeKey: `cooking-meal:${logId}:completion`,
    baseXP: 10,
  });
  await db.cookingMealLogs.update(logId, { xpEventId: award.id });
  return { logId, xpAwarded: award.xpAwarded };
}

export async function removeCookingPlan(activityId: number) {
  await softDeletePlannedActivity(activityId);
}

export async function undoCookingPlanCompletion(activityId: number) {
  const log = await db.cookingMealLogs.where("plannedActivityId").equals(activityId).first();
  if (log?.id) await db.cookingMealLogs.delete(log.id);
  await reopenPlannedActivity(activityId);
}

export async function softDeleteCookingMealLog(id: number) {
  const log = await db.cookingMealLogs.get(id);
  if (!log || log.deletedAt) return;
  const now = new Date().toISOString();
  await db.cookingMealLogs.update(id, { deletedAt: now });
  if (log.xpEventId) await db.xpEvents.update(log.xpEventId, { voidedAt: now });
}

export function visibleCookingPlans(activities: PlannedActivity[]) {
  return activities.filter((activity) => activity.pillar === "cooking" && !activity.deletedAt && activity.status !== "dismissed" && activity.status !== "cancelled");
}

export function visibleCookingMealLogs(logs: CookingMealLog[]) {
  return logs.filter((log) => !log.deletedAt).sort((a, b) => b.completedAt.localeCompare(a.completedAt));
}
