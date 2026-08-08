import { db, type GroceryCategory, type GroceryItem, type RecipeIngredient } from "../../../database/db";
import { inferGroceryCategory } from "../cookingCatalog";

function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

export async function addGroceryItem(input: {
  name: string;
  quantity?: number;
  unit?: string;
  category?: GroceryCategory;
  recipeId?: number;
  sourceRecipeName?: string;
}) {
  const name = normalizeName(input.name);
  if (!name) throw new Error("A grocery item needs a name.");
  const unit = input.unit?.trim() || undefined;
  const category = input.category ?? inferGroceryCategory(name);
  const existing = await db.groceryItems
    .filter((item) => !item.deletedAt && !item.checked && item.name.toLowerCase() === name.toLowerCase() && (item.unit ?? "") === (unit ?? ""))
    .first();
  const now = new Date().toISOString();

  if (existing?.id) {
    await db.groceryItems.update(existing.id, {
      quantity: existing.quantity && input.quantity
        ? existing.quantity + input.quantity
        : existing.quantity ?? input.quantity,
      updatedAt: now,
    });
    return existing.id;
  }

  return db.groceryItems.add({
    name,
    quantity: input.quantity && input.quantity > 0 ? input.quantity : undefined,
    unit,
    category,
    checked: false,
    recipeId: input.recipeId,
    sourceRecipeName: input.sourceRecipeName,
    createdAt: now,
    updatedAt: now,
  });
}

export async function addRecipeIngredientsToGroceries(input: {
  recipeId: number;
  recipeName: string;
  ingredients: RecipeIngredient[];
  defaultServings: number;
  servings: number;
  ingredientIds?: string[];
}) {
  const selected = input.ingredientIds
    ? input.ingredients.filter((ingredient) => input.ingredientIds!.includes(ingredient.id))
    : input.ingredients;
  const multiplier = input.servings / input.defaultServings;

  const ids: number[] = [];
  for (const ingredient of selected) {
    ids.push(await addGroceryItem({
      name: ingredient.name,
      quantity: ingredient.quantity ? Math.round(ingredient.quantity * multiplier * 100) / 100 : undefined,
      unit: ingredient.unit,
      category: ingredient.category,
      recipeId: input.recipeId,
      sourceRecipeName: input.recipeName,
    }));
  }
  return ids;
}

export async function toggleGroceryItem(id: number) {
  const item = await db.groceryItems.get(id);
  if (!item || item.deletedAt) throw new Error("Grocery item not found.");
  const checked = !item.checked;
  await db.groceryItems.update(id, {
    checked,
    checkedAt: checked ? new Date().toISOString() : undefined,
    updatedAt: new Date().toISOString(),
  });
}

export async function updateGroceryItemCategory(id: number, category: GroceryCategory) {
  await db.groceryItems.update(id, { category, updatedAt: new Date().toISOString() });
}

export async function softDeleteGroceryItem(id: number) {
  await db.groceryItems.update(id, { deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
}

export async function restoreGroceryItem(id: number) {
  await db.groceryItems.update(id, { deletedAt: undefined, updatedAt: new Date().toISOString() });
}

export async function clearCompletedGroceries() {
  const now = new Date().toISOString();
  await db.groceryItems.filter((item) => item.checked && !item.deletedAt).modify({ deletedAt: now, updatedAt: now });
}

export function visibleGroceryItems(items: GroceryItem[]) {
  return items.filter((item) => !item.deletedAt).sort((a, b) => Number(a.checked) - Number(b.checked) || a.createdAt.localeCompare(b.createdAt));
}
