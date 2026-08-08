import "fake-indexeddb/auto";

import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { db } from "../../../database/db";
import { getXPBreakdown } from "../../xp/XPService";
import {
  completeCookingPlan,
  logCookedRecipe,
  scheduleRecipeMeal,
  undoCookingPlanCompletion,
} from "./cookingPlannerService";
import {
  addGroceryItem,
  addRecipeIngredientsToGroceries,
  toggleGroceryItem,
  visibleGroceryItems,
} from "./groceryService";
import {
  createCookingRecipe,
  softDeleteCookingRecipe,
  updateCookingRecipe,
  visibleCookingRecipes,
} from "./recipeService";

beforeEach(async () => {
  await db.transaction("rw", db.tables, async () => {
    await Promise.all(db.tables.map((table) => table.clear()));
  });
});

afterAll(async () => {
  db.close();
  await db.delete();
});

async function createCurry() {
  return createCookingRecipe({
    name: " Japanese Curry ",
    defaultServings: 2,
    tags: ["Japanese", "Comfort", "Japanese"],
    ingredients: [
      { name: "Chicken thighs", quantity: 1, unit: "lb" },
      { name: "Onion", quantity: 1 },
    ],
    instructions: ["Brown chicken", "Simmer"],
  });
}

describe("cooking services", () => {
  it("creates, normalizes, edits, and soft deletes a recipe", async () => {
    const id = await createCurry();
    expect(await db.cookingRecipes.get(id)).toMatchObject({
      name: "Japanese Curry",
      defaultServings: 2,
      tags: ["Japanese", "Comfort"],
      ingredients: [
        expect.objectContaining({ name: "Chicken thighs", category: "meat-seafood" }),
        expect.objectContaining({ name: "Onion", category: "produce" }),
      ],
    });
    const current = (await db.cookingRecipes.get(id))!;
    await updateCookingRecipe(id, { ...current, favorite: true, defaultServings: 4 });
    expect(await db.cookingRecipes.get(id)).toMatchObject({ favorite: true, defaultServings: 4 });
    await softDeleteCookingRecipe(id);
    expect(visibleCookingRecipes(await db.cookingRecipes.toArray())).toHaveLength(0);
  });

  it("scales and merges compatible grocery ingredients", async () => {
    const recipeId = await createCurry();
    const recipe = (await db.cookingRecipes.get(recipeId))!;
    await addRecipeIngredientsToGroceries({
      recipeId,
      recipeName: recipe.name,
      ingredients: recipe.ingredients,
      defaultServings: 2,
      servings: 4,
    });
    await addGroceryItem({ name: "Chicken thighs", quantity: 1, unit: "lb" });
    const groceries = visibleGroceryItems(await db.groceryItems.toArray());
    expect(groceries).toHaveLength(2);
    expect(groceries.find((item) => item.name === "Chicken thighs")?.quantity).toBe(3);
    await toggleGroceryItem(groceries[0].id!);
    expect((await db.groceryItems.get(groceries[0].id!))?.checked).toBe(true);
  });

  it("schedules one shared Planner meal and completes it with Cooking XP", async () => {
    const recipeId = await createCurry();
    const activityId = await scheduleRecipeMeal(recipeId, "2026-08-09", 2);
    const activity = await db.plannedActivities.get(activityId);
    expect(activity).toMatchObject({
      pillar: "cooking",
      activityKind: `cooking:recipe:${recipeId}`,
      scheduledDate: "2026-08-09",
    });
    const result = await completeCookingPlan(activityId);
    expect(result.xpAwarded).toBe(13);
    expect(await db.cookingMealLogs.where("plannedActivityId").equals(activityId).count()).toBe(1);
    const cookingXP = getXPBreakdown(await db.xpEvents.toArray()).contributions.find(({ pillar }) => pillar === "cooking");
    expect(cookingXP?.xp).toBe(13);

    await undoCookingPlanCompletion(activityId);
    expect((await db.plannedActivities.get(activityId))?.status).toBe("planned");
    expect(await db.cookingMealLogs.where("plannedActivityId").equals(activityId).count()).toBe(0);
    expect(getXPBreakdown(await db.xpEvents.toArray()).totalXP).toBe(0);
  });

  it("logs a spontaneous cooked recipe once with pillar XP", async () => {
    const recipeId = await createCurry();
    const result = await logCookedRecipe(recipeId, "2026-08-09", 2);
    expect(result.xpAwarded).toBe(10);
    expect((await db.cookingMealLogs.get(result.logId))?.recipeId).toBe(recipeId);
    expect(getXPBreakdown(await db.xpEvents.toArray()).totalXP).toBe(10);
  });
});
