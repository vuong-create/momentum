import type { FinanceAccountType, FinanceTransactionType } from "../../database/db";

export const financeAccountTypes: Array<{ value: FinanceAccountType; label: string }> = [
  { value: "checking", label: "Checking" },
  { value: "savings", label: "Savings" },
  { value: "credit", label: "Credit Card" },
  { value: "investment", label: "Investment" },
  { value: "retirement", label: "Retirement" },
  { value: "cash", label: "Cash" },
];

export const financeTransactionTypes: Array<{ value: Exclude<FinanceTransactionType, "adjustment">; label: string }> = [
  { value: "expense", label: "Expense" },
  { value: "income", label: "Income" },
  { value: "transfer", label: "Transfer" },
  { value: "investment", label: "Investment" },
];

export const financeCategories: Array<{ name: string; subcategories: string[] }> = [
  { name: "Food", subcategories: ["Groceries", "Dining"] },
  { name: "Housing", subcategories: ["Rent", "Household"] },
  { name: "Transportation", subcategories: ["Gas", "Maintenance"] },
  { name: "Personal", subcategories: ["Hygiene", "Clothing"] },
  { name: "Lifestyle", subcategories: ["Growth Hobbies", "Entertainment", "Gym"] },
  { name: "Gifts & Giving", subcategories: ["Gifts", "Giving"] },
  { name: "Savings", subcategories: ["HYSA", "Vacation"] },
  { name: "Investments", subcategories: ["Brokerage", "401(k)", "Crypto"] },
  { name: "Income", subcategories: ["Paycheck", "Bonus", "Other Income"] },
  { name: "Miscellaneous", subcategories: ["Other"] },
];

export function subcategoriesFor(category: string) {
  return financeCategories.find((item) => item.name === category)?.subcategories ?? [];
}

export function accountTypeLabel(type: FinanceAccountType) {
  return financeAccountTypes.find((item) => item.value === type)?.label ?? type;
}
