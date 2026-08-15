import { db, type FinanceAccount, type FinanceNetWorthSnapshot, type FinanceTransaction } from "../../../database/db";
import { getAccountBalances, isBalanceTrackedAccount } from "./financeCalculations";

function dateKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function buildSnapshot(accounts: FinanceAccount[], transactions: FinanceTransaction[], date: string, source: FinanceNetWorthSnapshot["source"], snapshotKey: string, existing?: FinanceNetWorthSnapshot): FinanceNetWorthSnapshot {
  const timestamp = new Date().toISOString();
  const rows = getAccountBalances(accounts, transactions).filter(({ account }) => account.id && isBalanceTrackedAccount(account)).map(({ account, balance }) => ({ accountId: account.id!, name: account.name, type: account.type, balance }));
  const assets = rows.filter((item) => item.balance >= 0).reduce((total, item) => total + item.balance, 0);
  const liabilities = rows.filter((item) => item.balance < 0).reduce((total, item) => total + Math.abs(item.balance), 0);
  return { ...existing, snapshotKey, date, month: date.slice(0, 7), source, assets, liabilities, netWorth: assets - liabilities, accounts: rows, createdAt: existing?.createdAt ?? timestamp, updatedAt: timestamp, deletedAt: undefined };
}

function hasSameFinancialPosition(
  existing: FinanceNetWorthSnapshot,
  candidate: FinanceNetWorthSnapshot,
) {
  return !existing.deletedAt &&
    existing.assets === candidate.assets &&
    existing.liabilities === candidate.liabilities &&
    existing.netWorth === candidate.netWorth &&
    JSON.stringify(existing.accounts) === JSON.stringify(candidate.accounts);
}

export async function upsertMonthlyNetWorthSnapshot(accounts: FinanceAccount[], transactions: FinanceTransaction[], now: Date) {
  if (!accounts.length) return;
  const month = dateKey(now).slice(0, 7); const key = `monthly:${month}`;
  const existing = await db.financeNetWorthSnapshots.where("snapshotKey").equals(key).first();
  const candidate = buildSnapshot(accounts, transactions, dateKey(now), "monthly", key, existing);
  if (existing && hasSameFinancialPosition(existing, candidate)) return existing.id;
  return db.financeNetWorthSnapshots.put(candidate);
}

export async function saveManualNetWorthSnapshot(accounts: FinanceAccount[], transactions: FinanceTransaction[], now: Date) {
  if (!accounts.length) throw new Error("Add an account before saving a snapshot.");
  const timestamp = new Date().toISOString(); const key = `manual:${timestamp}`;
  return db.financeNetWorthSnapshots.add(buildSnapshot(accounts, transactions, dateKey(now), "manual", key));
}

export async function softDeleteNetWorthSnapshot(id: number) { await db.financeNetWorthSnapshots.update(id, { deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }); }
export async function restoreNetWorthSnapshot(id: number) { await db.financeNetWorthSnapshots.update(id, { deletedAt: undefined, updatedAt: new Date().toISOString() }); }
export function visibleNetWorthSnapshots(snapshots: FinanceNetWorthSnapshot[]) { return snapshots.filter((item) => !item.deletedAt).sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt)); }
