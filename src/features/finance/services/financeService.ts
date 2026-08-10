import { db, type FinanceAccountType, type FinanceTransaction, type FinanceTransactionType } from "../../../database/db";
import { getAccountBalance } from "./financeCalculations";

export interface FinanceAccountInput {
  name: string;
  type: FinanceAccountType;
  openingBalance: number;
}

export interface FinanceTransactionInput {
  date: string;
  amount: number;
  type: Exclude<FinanceTransactionType, "adjustment">;
  merchant: string;
  accountId?: number;
  fromAccountId?: number;
  toAccountId?: number;
  categoryId?: number;
  subcategoryId?: number;
  category?: string;
  subcategory?: string;
  notes?: string;
  tags?: string[];
  investmentHolding?: string;
}

function nowISO() { return new Date().toISOString(); }
function normalizeMoney(value: number) { return Math.round(Math.abs(Number(value) || 0) * 100) / 100; }

export function validateTransaction(input: FinanceTransactionInput) {
  if (!input.date) throw new Error("Choose a transaction date.");
  if (normalizeMoney(input.amount) <= 0) throw new Error("Amount must be greater than zero.");
  if (input.type === "transfer") {
    if (!input.fromAccountId || !input.toAccountId) throw new Error("Choose both transfer accounts.");
    if (input.fromAccountId === input.toAccountId) throw new Error("Transfer accounts must be different.");
  } else if (!input.accountId) throw new Error("Choose an account.");
}

function normalizeTransaction(input: FinanceTransactionInput, existing?: FinanceTransaction): FinanceTransaction {
  validateTransaction(input);
  const timestamp = nowISO();
  return {
    ...existing,
    date: input.date,
    amount: normalizeMoney(input.amount),
    type: input.type,
    merchant: input.merchant.trim() || (input.type === "transfer" ? "Transfer" : "Untitled"),
    accountId: input.type === "transfer" ? undefined : input.accountId,
    fromAccountId: input.type === "transfer" ? input.fromAccountId : undefined,
    toAccountId: input.type === "transfer" ? input.toAccountId : undefined,
    categoryId: input.categoryId,
    subcategoryId: undefined,
    category: input.category,
    subcategory: undefined,
    notes: input.notes?.trim() || undefined,
    tags: [...new Set((input.tags ?? []).map((tag) => tag.trim()).filter(Boolean))],
    investmentHolding: input.type === "investment" ? input.investmentHolding?.trim() || undefined : undefined,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
    deletedAt: undefined,
  };
}

export async function createFinanceAccount(input: FinanceAccountInput) {
  const timestamp = nowISO();
  const name = input.name.trim();
  if (!name) throw new Error("Account name is required.");
  return db.financeAccounts.add({ name, type: input.type, openingBalance: Math.round((Number(input.openingBalance) || 0) * 100) / 100, createdAt: timestamp, updatedAt: timestamp });
}

export async function updateFinanceAccount(id: number, input: FinanceAccountInput) {
  const account = await db.financeAccounts.get(id);
  if (!account) throw new Error("Account not found.");
  const name = input.name.trim();
  if (!name) throw new Error("Account name is required.");
  await db.financeAccounts.update(id, { name, type: input.type, openingBalance: Math.round((Number(input.openingBalance) || 0) * 100) / 100, updatedAt: nowISO() });
}

export async function softDeleteFinanceAccount(id: number) {
  const related = await db.financeTransactions.filter((item) => !item.deletedAt && (item.accountId === id || item.fromAccountId === id || item.toAccountId === id)).count();
  if (related > 0) throw new Error("Move or remove this account's transactions first.");
  await db.financeAccounts.update(id, { deletedAt: nowISO(), updatedAt: nowISO() });
}

export async function restoreFinanceAccount(id: number) {
  await db.financeAccounts.update(id, { deletedAt: undefined, updatedAt: nowISO() });
}

export async function createFinanceTransaction(input: FinanceTransactionInput) {
  return db.financeTransactions.add(normalizeTransaction(input));
}

export async function setFinanceAccountBalance(accountId: number, targetBalance: number, date: string, notes?: string) {
  const account = await db.financeAccounts.get(accountId);
  if (!account || account.deletedAt) throw new Error("Account not found.");
  const currentBalance = getAccountBalance(account, await db.financeTransactions.toArray());
  const delta = Math.round((Number(targetBalance) - currentBalance) * 100) / 100;
  if (!Number.isFinite(delta)) throw new Error("Enter a valid balance.");
  if (Math.abs(delta) < 0.01) throw new Error("This account already has that balance.");
  const timestamp = nowISO();
  const id = await db.financeTransactions.add({
    date,
    amount: Math.abs(delta),
    type: "adjustment",
    merchant: "Balance adjustment",
    accountId,
    notes: notes?.trim() || `Set current balance to ${Math.round(Number(targetBalance) * 100) / 100}`,
    tags: [],
    adjustmentDirection: delta > 0 ? "increase" : "decrease",
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  return { id, delta };
}

export async function updateFinanceTransaction(id: number, input: FinanceTransactionInput) {
  const current = await db.financeTransactions.get(id);
  if (!current) throw new Error("Transaction not found.");
  await db.financeTransactions.put({ ...normalizeTransaction(input, current), id });
}

export async function softDeleteFinanceTransaction(id: number) {
  await db.financeTransactions.update(id, { deletedAt: nowISO(), updatedAt: nowISO() });
}

export async function restoreFinanceTransaction(id: number) {
  await db.financeTransactions.update(id, { deletedAt: undefined, updatedAt: nowISO() });
}

export function merchantSuggestions(transactions: FinanceTransaction[]) {
  const memory = new Map<string, { merchant: string; categoryId?: number; subcategoryId?: number; category?: string; subcategory?: string; accountId?: number; count: number }>();
  transactions.filter((item) => !item.deletedAt && item.merchant).forEach((item) => {
    const key = item.merchant.toLocaleLowerCase();
    const current = memory.get(key);
    memory.set(key, { merchant: item.merchant, categoryId: item.categoryId, subcategoryId: item.subcategoryId, category: item.category, subcategory: item.subcategory, accountId: item.accountId, count: (current?.count ?? 0) + 1 });
  });
  return [...memory.values()].sort((a, b) => b.count - a.count || a.merchant.localeCompare(b.merchant));
}
