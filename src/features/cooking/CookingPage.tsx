import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";

import { db, type CookingMealLog, type CookingRecipe, type GroceryCategory, type GroceryItem, type PlannedActivity } from "../../database/db";
import useExperience from "../../experience/useExperience";
import ActivityUndoToast from "../activities/components/ActivityUndoToast";
import ActivityDetailsPanel from "../activities/components/ActivityDetailsPanel";
import useActivityUndo from "../activities/hooks/useActivityUndo";
import { restoreSoftDeletedActivity, softDeletePlannedActivity } from "../activities/services/activityService";
import { getActivityStatus } from "../activities/services/activityLifecycle";
import { getXPBreakdown } from "../xp/XPService";
import CookingDecide from "./components/CookingDecide";
import CookingGroceries from "./components/CookingGroceries";
import CookingRecipes from "./components/CookingRecipes";
import CookingWeek from "./components/CookingWeek";
import { getCookingActivityIdentity, type QuickMealType } from "./cookingCatalog";
import {
  completeCookingPlan,
  logCookedRecipe,
  scheduleQuickMeal,
  scheduleRecipeMeal,
  softDeleteCookingMealLog,
  undoCookingPlanCompletion,
  visibleCookingMealLogs,
  visibleCookingPlans,
} from "./services/cookingPlannerService";
import {
  addGroceryItem,
  addRecipeIngredientsToGroceries,
  clearCompletedGroceries,
  restoreGroceryItem,
  softDeleteGroceryItem,
  toggleGroceryItem,
  updateGroceryItemCategory,
  visibleGroceryItems,
} from "./services/groceryService";
import {
  createCookingRecipe,
  restoreCookingRecipe,
  softDeleteCookingRecipe,
  toggleRecipeFavorite,
  updateCookingRecipe,
  visibleCookingRecipes,
  type CookingRecipeInput,
} from "./services/recipeService";

import "./cooking.css";

type CookingView = "week" | "recipes" | "groceries" | "decide";

const tabs: Array<{ id: CookingView; label: string; mark: string }> = [
  { id: "week", label: "This Week", mark: "◷" },
  { id: "recipes", label: "Cookbook", mark: "▤" },
  { id: "groceries", label: "Groceries", mark: "⌑" },
  { id: "decide", label: "What Should I Make?", mark: "?" },
];

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getInitialView(): CookingView {
  const stored = sessionStorage.getItem("momentum.cooking.tab");
  return tabs.some((tab) => tab.id === stored) ? stored as CookingView : "week";
}

export default function CookingPage() {
  const experience = useExperience();
  const undo = useActivityUndo();
  const [view, setView] = useState<CookingView>(getInitialView);
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null);
  const allRecipes = useLiveQuery(() => db.cookingRecipes.toArray(), []) ?? [];
  const allGroceries = useLiveQuery(() => db.groceryItems.toArray(), []) ?? [];
  const allPlans = useLiveQuery(() => db.plannedActivities.toArray(), []) ?? [];
  const allMealLogs = useLiveQuery(() => db.cookingMealLogs.toArray(), []) ?? [];
  const xpEvents = useLiveQuery(() => db.xpEvents.toArray(), []) ?? [];
  const recipes = visibleCookingRecipes(allRecipes);
  const groceries = visibleGroceryItems(allGroceries);
  const plans = visibleCookingPlans(allPlans);
  const unclassifiedCookingCount = allPlans.filter((plan) =>
    plan.pillar === "cooking" &&
    !plan.deletedAt &&
    plan.status !== "dismissed" &&
    plan.status !== "cancelled" &&
    getCookingActivityIdentity(plan.activityKind) === "unclassified"
  ).length;
  const todayKey = toDateKey(experience.now);
  const cookingXP = getXPBreakdown(xpEvents).contributions.find(({ pillar }) => pillar === "cooking")!;
  const currentWeekPrefix = useMemo(() => {
    const sunday = new Date(experience.now);
    sunday.setDate(experience.now.getDate() - experience.now.getDay());
    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(sunday); day.setDate(sunday.getDate() + index); return toDateKey(day);
    });
  }, [experience.now]);
  const weekPlans = plans.filter((plan) => plan.scheduledDate && currentWeekPrefix.includes(plan.scheduledDate));
  const visibleMealLogs = visibleCookingMealLogs(allMealLogs);
  const loggedPlans = new Set(visibleMealLogs.map((log) => log.plannedActivityId).filter(Boolean));
  const derivedMeals: CookingMealLog[] = plans
    .filter((plan) => plan.id && getActivityStatus(plan) === "completed" && !loggedPlans.has(plan.id))
    .map((plan) => ({ title: plan.title, date: plan.scheduledDate ?? plan.completedAt!.slice(0, 10), plannedActivityId: plan.id, completedAt: plan.completedAt ?? plan.updatedAt ?? plan.date }));
  const recentMeals = [...visibleMealLogs, ...derivedMeals].sort((a, b) => b.completedAt.localeCompare(a.completedAt));

  function selectView(next: CookingView) {
    setView(next);
    sessionStorage.setItem("momentum.cooking.tab", next);
  }

  async function handleCreateRecipe(input: CookingRecipeInput) {
    const id = await createCookingRecipe(input);
    experience.playFeedback("task-added");
    undo.show({ message: "Recipe added to your cookbook", undo: () => softDeleteCookingRecipe(id) });
  }

  async function handleUpdateRecipe(recipe: CookingRecipe, input: CookingRecipeInput) {
    if (!recipe.id) return;
    await updateCookingRecipe(recipe.id, input);
    experience.playFeedback("task-updated");
  }

  async function handleDeleteRecipe(recipe: CookingRecipe) {
    if (!recipe.id) return;
    await softDeleteCookingRecipe(recipe.id);
    experience.playFeedback("task-dismissed");
    undo.show({ message: "Recipe removed", undo: () => restoreCookingRecipe(recipe.id!) });
  }

  async function handlePlanRecipe(recipe: CookingRecipe, date: string) {
    if (!recipe.id) return;
    const id = await scheduleRecipeMeal(recipe.id, date, recipe.defaultServings);
    experience.playFeedback("meal-planned");
    undo.show({ message: `${recipe.name} added to Planner`, undo: () => softDeletePlannedActivity(id) });
  }

  async function handleCompletePlan(activity: PlannedActivity) {
    if (!activity.id) return;
    const result = await completeCookingPlan(activity.id);
    experience.playFeedback("meal-cooked");
    undo.show({ message: `Meal cooked · plan complete · +${result.xpAwarded} XP`, undo: () => undoCookingPlanCompletion(activity.id!) });
  }

  async function handleRemovePlan(activity: PlannedActivity) {
    if (!activity.id) return;
    await softDeletePlannedActivity(activity.id);
    experience.playFeedback("task-dismissed");
    undo.show({ message: "Meal removed from this week", undo: () => restoreSoftDeletedActivity(activity.id!) });
  }

  async function handleCookToday(recipe: CookingRecipe) {
    if (!recipe.id) return;
    const result = await logCookedRecipe(recipe.id, todayKey, recipe.defaultServings);
    experience.playFeedback("meal-cooked");
    undo.show({ message: `${recipe.name} cooked · +${result.xpAwarded} XP`, undo: () => softDeleteCookingMealLog(result.logId) });
  }

  async function handleAddGrocery(name: string) {
    const id = await addGroceryItem({ name });
    experience.playFeedback("task-added");
    undo.show({ message: `${name.trim()} added`, undo: () => softDeleteGroceryItem(id) });
  }

  async function handleDeleteGrocery(item: GroceryItem) {
    if (!item.id) return;
    await softDeleteGroceryItem(item.id);
    experience.playFeedback("task-dismissed");
    undo.show({ message: "Grocery item removed", undo: () => restoreGroceryItem(item.id!) });
  }

  async function handleClearCompleted() {
    const ids = groceries.filter((item) => item.checked).map((item) => item.id!).filter(Boolean);
    await clearCompletedGroceries();
    experience.playFeedback("task-dismissed");
    undo.show({ message: `${ids.length} completed ${ids.length === 1 ? "item" : "items"} cleared`, undo: async () => { for (const id of ids) await restoreGroceryItem(id); } });
  }

  return (
    <div className="cooking-page">
      <header className="cooking-page-header">
        <div><span className="text-label">Plan · Shop · Cook</span><h1 className="font-pixel">Cooking</h1><p>A personal cookbook for the meals you actually make.</p></div>
        <div className="cooking-header-stats"><span><strong>{weekPlans.length}</strong><small>meals this week</small></span><span><strong>{groceries.filter((item) => !item.checked).length}</strong><small>groceries left</small></span><span className="cooking-level"><strong>Lv {cookingXP.progression.level}</strong><small>{cookingXP.xp} Cooking XP</small><i><span style={{ width: `${cookingXP.progression.percentage}%` }} /></i></span></div>
      </header>

      <nav className="cooking-tabs" aria-label="Cooking sections">{tabs.map((tab) => <button key={tab.id} type="button" className={view === tab.id ? "is-selected" : ""} onClick={() => selectView(tab.id)}><span>{tab.mark}</span>{tab.label}{tab.id === "groceries" && groceries.filter((item) => !item.checked).length > 0 && <i>{groceries.filter((item) => !item.checked).length}</i>}</button>)}</nav>

      <main className="cooking-content">
        {view === "week" && <CookingWeek now={experience.now} recipes={recipes} plans={weekPlans} recentMeals={recentMeals} unclassifiedCount={unclassifiedCookingCount} onPlanRecipe={(id, date) => { const recipe = recipes.find((item) => item.id === id)!; return handlePlanRecipe(recipe, date); }} onPlanQuick={async (type: QuickMealType, label, date) => { const id = await scheduleQuickMeal(type, label, date); experience.playFeedback("meal-planned"); undo.show({ message: `${label} added to Planner`, undo: () => softDeletePlannedActivity(id) }); }} onComplete={handleCompletePlan} onRemove={handleRemovePlan} onOpen={(activity) => setSelectedActivityId(activity.id ?? null)} onOpenRecipes={() => selectView("recipes")} />}
        {view === "recipes" && <CookingRecipes recipes={recipes} todayKey={todayKey} onCreate={handleCreateRecipe} onUpdate={handleUpdateRecipe} onDelete={handleDeleteRecipe} onToggleFavorite={async (recipe) => { await toggleRecipeFavorite(recipe.id!); experience.playFeedback("task-updated"); }} onPlan={handlePlanRecipe} onCookToday={handleCookToday} onAddGroceries={async (recipe, servings) => {
          const before = await db.groceryItems.toArray();
          await addRecipeIngredientsToGroceries({ recipeId: recipe.id!, recipeName: recipe.name, ingredients: recipe.ingredients, defaultServings: recipe.defaultServings, servings });
          experience.playFeedback("task-added");
          undo.show({ message: `${recipe.ingredients.length} ingredients added to Groceries`, undo: async () => {
            const beforeIds = new Set(before.map((item) => item.id));
            const after = await db.groceryItems.toArray();
            await db.transaction("rw", db.groceryItems, async () => {
              for (const item of after) if (item.id && !beforeIds.has(item.id)) await db.groceryItems.delete(item.id);
              for (const item of before) if (item.id) await db.groceryItems.put(item);
            });
          } });
          selectView("groceries");
        }} />}
        {view === "groceries" && <CookingGroceries items={groceries} onAdd={handleAddGrocery} onToggle={async (item) => { await toggleGroceryItem(item.id!); experience.playFeedback(item.checked ? "task-reopened" : "grocery-checked"); }} onChangeCategory={(item, category: GroceryCategory) => updateGroceryItemCategory(item.id!, category)} onDelete={handleDeleteGrocery} onClearCompleted={handleClearCompleted} />}
        {view === "decide" && <CookingDecide recipes={recipes} todayKey={todayKey} onPlan={handlePlanRecipe} onOpenRecipes={() => selectView("recipes")} />}
      </main>
      <ActivityDetailsPanel activityId={selectedActivityId} onClose={() => setSelectedActivityId(null)} onMutation={undo.show} />
      <ActivityUndoToast notice={undo.notice} onDismiss={undo.dismiss} onUndo={undo.undo} />
    </div>
  );
}
