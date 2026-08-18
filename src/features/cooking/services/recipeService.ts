import { db, type CookingRecipe, type GroceryCategory } from "../../../database/db";
import { inferGroceryCategory } from "../cookingCatalog";

export type RecipeIngredientInput = {
  id?: string;
  name: string;
  quantity?: number;
  unit?: string;
  category?: GroceryCategory;
};

export type CookingRecipeInput = {
  name: string;
  coverImageDataUrl?: string;
  menuSection?: string;
  defaultServings?: number;
  prepMinutes?: number;
  ingredients?: RecipeIngredientInput[];
  instructions?: string[];
  notes?: string;
  tags?: string[];
  favorite?: boolean;
};

function normalizeRecipeInput(input: CookingRecipeInput, timestamp: string) {
  const name = input.name.trim();
  if (!name) throw new Error("A recipe needs a name.");

  return {
    name,
    coverImageDataUrl: input.coverImageDataUrl?.trim() || undefined,
    menuSection: input.menuSection?.trim() || undefined,
    defaultServings: Math.max(1, Math.round(input.defaultServings ?? 2)),
    prepMinutes: input.prepMinutes && input.prepMinutes > 0
      ? Math.round(input.prepMinutes)
      : undefined,
    ingredients: (input.ingredients ?? [])
      .filter((ingredient) => ingredient.name.trim())
      .map((ingredient, index) => ({
        id: ingredient.id ?? `ingredient-${timestamp}-${index}`,
        name: ingredient.name.trim(),
        quantity: ingredient.quantity && ingredient.quantity > 0
          ? ingredient.quantity
          : undefined,
        unit: ingredient.unit?.trim() || undefined,
        category: ingredient.category ?? inferGroceryCategory(ingredient.name),
      })),
    instructions: (input.instructions ?? []).map((step) => step.trim()).filter(Boolean),
    notes: input.notes?.trim() || undefined,
    tags: [...new Set((input.tags ?? []).map((tag) => tag.trim()).filter(Boolean))],
    favorite: input.favorite ?? false,
  };
}

export async function createCookingRecipe(input: CookingRecipeInput) {
  const now = new Date().toISOString();
  return db.cookingRecipes.add({
    ...normalizeRecipeInput(input, now),
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateCookingRecipe(id: number, input: CookingRecipeInput) {
  const recipe = await db.cookingRecipes.get(id);
  if (!recipe || recipe.deletedAt) throw new Error("Recipe not found.");
  const now = new Date().toISOString();
  await db.cookingRecipes.update(id, {
    ...normalizeRecipeInput(input, now),
    updatedAt: now,
  });
}

export async function toggleRecipeFavorite(id: number) {
  const recipe = await db.cookingRecipes.get(id);
  if (!recipe || recipe.deletedAt) throw new Error("Recipe not found.");
  await db.cookingRecipes.update(id, {
    favorite: !recipe.favorite,
    updatedAt: new Date().toISOString(),
  });
}

export async function softDeleteCookingRecipe(id: number) {
  await db.cookingRecipes.update(id, {
    deletedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

export async function restoreCookingRecipe(id: number) {
  await db.cookingRecipes.update(id, {
    deletedAt: undefined,
    updatedAt: new Date().toISOString(),
  });
}

export function visibleCookingRecipes(recipes: CookingRecipe[]) {
  return recipes
    .filter((recipe) => !recipe.deletedAt)
    .sort((a, b) => Number(b.favorite) - Number(a.favorite) || b.updatedAt.localeCompare(a.updatedAt));
}
