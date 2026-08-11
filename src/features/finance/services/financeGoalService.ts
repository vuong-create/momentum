import { db, type FinanceAccount, type FinanceGoal, type FinanceGoalTimeframe, type FinanceGoalType, type FinanceTransaction } from "../../../database/db";
import { getAccountBalance } from "./financeCalculations";

export interface FinanceGoalInput {
  name: string;
  goalType: FinanceGoalType;
  targetAmount: number;
  accountId: number;
  timeframe: FinanceGoalTimeframe;
  startDate: string;
  deadline?: string;
}

export interface FinanceGoalProgress {
  current: number;
  remaining: number;
  percentage: number;
  projected?: number;
  onTrack?: boolean;
  periodStart: string;
  periodEnd: string;
}

function nowISO() { return new Date().toISOString(); }
function dateKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function monthEnd(date: Date) { return dateKey(new Date(date.getFullYear(), date.getMonth() + 1, 0)); }
function money(value: number) { return Math.round(Math.max(0, Number(value) || 0) * 100) / 100; }

export function validateFinanceGoal(input: FinanceGoalInput) {
  if (!input.name.trim()) throw new Error("Give this goal a name.");
  if (money(input.targetAmount) <= 0) throw new Error("Target amount must be greater than zero.");
  if (!input.accountId) throw new Error("Choose the account that owns this goal.");
  if (input.timeframe === "custom" && (!input.deadline || input.deadline < input.startDate)) throw new Error("Choose a deadline on or after the start date.");
}

function normalizeGoal(input: FinanceGoalInput, existing?: FinanceGoal): FinanceGoal {
  validateFinanceGoal(input);
  const timestamp = nowISO();
  return {
    ...existing,
    name: input.name.trim(),
    goalType: input.goalType,
    targetAmount: money(input.targetAmount),
    accountId: input.accountId,
    timeframe: input.timeframe,
    startDate: input.startDate,
    deadline: input.timeframe === "custom" ? input.deadline : undefined,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
    deletedAt: undefined,
  };
}

export async function createFinanceGoal(input: FinanceGoalInput) {
  const account = await db.financeAccounts.get(input.accountId);
  if (!account || account.deletedAt || account.type === "credit") throw new Error("Choose an active balance account.");
  if (input.goalType === "contribution" && !["savings", "investment", "retirement"].includes(account.type)) throw new Error("Contribution goals require a savings or investment account.");
  return db.financeGoals.add(normalizeGoal(input));
}

export async function updateFinanceGoal(id: number, input: FinanceGoalInput) {
  const current = await db.financeGoals.get(id);
  if (!current || current.deletedAt) throw new Error("This goal is no longer available.");
  const account = await db.financeAccounts.get(input.accountId);
  if (!account || account.deletedAt || account.type === "credit") throw new Error("Choose an active balance account.");
  if (input.goalType === "contribution" && !["savings", "investment", "retirement"].includes(account.type)) throw new Error("Contribution goals require a savings or investment account.");
  await db.financeGoals.put({ ...normalizeGoal(input, current), id });
}

export async function softDeleteFinanceGoal(id: number) { const timestamp = nowISO(); await db.financeGoals.update(id, { deletedAt: timestamp, updatedAt: timestamp }); }
export async function restoreFinanceGoal(id: number) { await db.financeGoals.update(id, { deletedAt: undefined, updatedAt: nowISO() }); }
export function visibleFinanceGoals(goals: FinanceGoal[]) { return goals.filter((goal) => !goal.deletedAt).sort((a, b) => a.createdAt.localeCompare(b.createdAt)); }

export function getGoalPeriod(goal: FinanceGoal, now: Date) {
  if (goal.timeframe === "monthly") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start: dateKey(start), end: monthEnd(start) };
  }
  if (goal.timeframe === "yearly") return { start: `${now.getFullYear()}-01-01`, end: `${now.getFullYear()}-12-31` };
  return { start: goal.startDate, end: goal.deadline ?? goal.startDate };
}

export function getFinanceGoalProgress(goal: FinanceGoal, accounts: FinanceAccount[], transactions: FinanceTransaction[], now: Date): FinanceGoalProgress {
  const account = accounts.find((item) => item.id === goal.accountId);
  const period = getGoalPeriod(goal, now); const today = dateKey(now); const throughToday = transactions.filter((item) => item.date <= today);
  const current = goal.goalType === "balance"
    ? Math.max(0, account ? getAccountBalance(account, throughToday) : 0)
    : throughToday.filter((item) => !item.deletedAt && item.toAccountId === goal.accountId && (item.type === "transfer" || item.type === "investment") && item.date >= period.start && item.date <= period.end).reduce((total, item) => total + item.amount, 0);
  const target = Math.max(0.01, goal.targetAmount);
  const result: FinanceGoalProgress = { current, remaining: Math.max(0, target - current), percentage: current / target * 100, periodStart: period.start, periodEnd: period.end };
  if (goal.goalType === "contribution") {
    const start = new Date(`${period.start}T12:00:00`).getTime(); const end = new Date(`${period.end}T12:00:00`).getTime(); const point = Math.min(end, Math.max(start, now.getTime()));
    const elapsed = Math.max(1, point - start + 86_400_000); const duration = Math.max(elapsed, end - start + 86_400_000);
    result.projected = current / elapsed * duration;
    result.onTrack = current >= target || result.projected >= target;
  }
  return result;
}
