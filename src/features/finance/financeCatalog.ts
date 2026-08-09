import type { FinanceAccountType, FinanceCategoryFlow, FinanceTransactionType } from "../../database/db";

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

export const financeFlowLabels: Record<FinanceCategoryFlow, string> = {
  expense: "Expense",
  investment: "Investment",
  income: "Income",
  saving: "Long-term Saving",
};

export const financeFlowOrder: FinanceCategoryFlow[] = ["expense", "investment", "income", "saving"];

export const financeCategories: Array<{ name: string; flowType: FinanceCategoryFlow }> = [
  ...["Rent", "Groceries", "Dining", "Household", "Personal Care", "Clothing", "Fitness", "Volleyball", "Language Learning", "Entertainment", "Gifts", "Travel", "Transportation", "Chump", "Gas", "Subscriptions", "Miscellaneous"].map((name) => ({ name, flowType: "expense" as const })),
  ...["Vanguard Brokerage", "Crypto", "Individual Stocks"].map((name) => ({ name, flowType: "investment" as const })),
  ...["NEO", "SJVBC"].map((name) => ({ name, flowType: "income" as const })),
  { name: "HYSA", flowType: "saving" },
];

export function accountTypeLabel(type: FinanceAccountType) {
  return financeAccountTypes.find((item) => item.value === type)?.label ?? type;
}
