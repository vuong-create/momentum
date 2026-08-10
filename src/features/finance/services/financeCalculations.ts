import type { FinanceAccount, FinanceCategory, FinanceTransaction } from "../../../database/db";

export function visibleFinanceAccounts(accounts: FinanceAccount[]) {
  return accounts.filter((account) => !account.deletedAt);
}

export function visibleFinanceTransactions(transactions: FinanceTransaction[]) {
  return transactions.filter((transaction) => !transaction.deletedAt);
}

export function isBalanceTrackedAccount(account: FinanceAccount) {
  return account.type !== "credit";
}

export function transactionEffect(transaction: FinanceTransaction, accountId: number) {
  if (transaction.type === "transfer") {
    if (transaction.fromAccountId === accountId) return -transaction.amount;
    if (transaction.toAccountId === accountId) return transaction.amount;
    return 0;
  }
  if (transaction.accountId !== accountId) return 0;
  return transactionSignedAmount(transaction);
}

export function transactionSignedAmount(transaction: FinanceTransaction) {
  if (transaction.type === "expense" || transaction.type === "investment") return -transaction.amount;
  if (transaction.type === "transfer") return 0;
  if (transaction.type === "adjustment") return transaction.adjustmentDirection === "decrease" ? -transaction.amount : transaction.amount;
  return transaction.amount;
}

export function getAccountBalance(account: FinanceAccount, transactions: FinanceTransaction[]) {
  if (!account.id) return account.openingBalance;
  return visibleFinanceTransactions(transactions).reduce(
    (balance, transaction) => balance + transactionEffect(transaction, account.id!),
    account.openingBalance,
  );
}

export function getAccountBalances(accounts: FinanceAccount[], transactions: FinanceTransaction[]) {
  return visibleFinanceAccounts(accounts).map((account) => ({
    account,
    balance: getAccountBalance(account, transactions),
  }));
}

export function getNetWorth(accounts: FinanceAccount[], transactions: FinanceTransaction[]) {
  return getAccountBalances(accounts, transactions).filter(({ account }) => isBalanceTrackedAccount(account)).reduce((total, item) => total + item.balance, 0);
}

export function getMonthSummary(transactions: FinanceTransaction[], month: string, categories: FinanceCategory[] = []) {
  const monthTransactions = visibleFinanceTransactions(transactions).filter((item) => item.date.startsWith(month));
  const income = monthTransactions.filter((item) => item.type === "income").reduce((total, item) => total + item.amount, 0);
  const expenses = monthTransactions.filter((item) => item.type === "expense").reduce((total, item) => total + item.amount, 0);
  const invested = monthTransactions.filter((item) => item.type === "investment").reduce((total, item) => total + item.amount, 0);
  const savingIds = new Set(categories.filter((item) => item.flowType === "saving").map((item) => item.id));
  const saved = monthTransactions.filter((item) => item.type === "transfer" && (savingIds.has(item.categoryId) || item.category === "HYSA")).reduce((total, item) => total + item.amount, 0);
  const remaining = income - expenses - invested - saved;
  return {
    income,
    expenses,
    invested,
    saved,
    remaining,
    savingsRate: income > 0 ? Math.max(0, ((income - expenses) / income) * 100) : 0,
  };
}

export function getCategorySpending(transactions: FinanceTransaction[], month: string, categories: FinanceCategory[] = []) {
  const totals = new Map<string, number>();
  visibleFinanceTransactions(transactions)
    .filter((item) => item.type === "expense" && item.date.startsWith(month))
    .forEach((item) => { const name = categories.find((category) => category.id === item.categoryId)?.name || item.category || "Uncategorized"; totals.set(name, (totals.get(name) ?? 0) + item.amount); });
  return [...totals.entries()].map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount);
}

export function getCashFlowRange(transactions: FinanceTransaction[], now: Date, count: number, categories: FinanceCategory[] = []) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (count - 1 - index), 1);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    return { month, label: date.toLocaleDateString("en-US", { month: "short" }), ...getMonthSummary(transactions, month, categories) };
  });
}

export function getSixMonthCashFlow(transactions: FinanceTransaction[], now: Date, categories: FinanceCategory[] = []) {
  return getCashFlowRange(transactions, now, 6, categories);
}

export function formatMoney(value: number, compact = false) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: compact ? 0 : 2,
    notation: compact && Math.abs(value) >= 10000 ? "compact" : "standard",
  }).format(value);
}
