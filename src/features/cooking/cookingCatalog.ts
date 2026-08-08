import type { GroceryCategory } from "../../database/db";

export const groceryCategories: Array<{
  id: GroceryCategory;
  label: string;
  mark: string;
}> = [
  { id: "produce", label: "Produce", mark: "葉" },
  { id: "meat-seafood", label: "Meat / Seafood", mark: "切" },
  { id: "dairy", label: "Dairy", mark: "乳" },
  { id: "pantry", label: "Pantry", mark: "瓶" },
  { id: "frozen", label: "Frozen", mark: "氷" },
  { id: "other", label: "Other", mark: "＋" },
];

export const quickMealOptions = [
  { id: "leftovers", label: "Leftovers", mark: "↺" },
  { id: "eating-out", label: "Eating Out", mark: "外" },
  { id: "open", label: "Open", mark: "○" },
] as const;

export type QuickMealType = typeof quickMealOptions[number]["id"];

export function getRecipeActivityKind(recipeId: number) {
  return `cooking:recipe:${recipeId}`;
}

export function parseRecipeActivityKind(value?: string) {
  if (!value?.startsWith("cooking:recipe:")) return undefined;
  const id = Number(value.slice("cooking:recipe:".length));
  return Number.isInteger(id) && id > 0 ? id : undefined;
}

export function getQuickMealActivityKind(type: QuickMealType) {
  return `cooking:quick:${type}`;
}

export function inferGroceryCategory(name: string): GroceryCategory {
  const value = name.toLowerCase();
  if (/chicken|beef|steak|pork|salmon|shrimp|fish|turkey|tofu/.test(value)) return "meat-seafood";
  if (/milk|cream|cheese|yogurt|butter|egg/.test(value)) return "dairy";
  if (/frozen|ice cream/.test(value)) return "frozen";
  if (/onion|garlic|potato|carrot|broccoli|scallion|pepper|avocado|tomato|lettuce|lime|lemon|ginger|mushroom|spinach/.test(value)) return "produce";
  if (/rice|pasta|noodle|sauce|oil|flour|sugar|salt|spice|stock|broth|bean|curry|bread|tortilla/.test(value)) return "pantry";
  return "other";
}
