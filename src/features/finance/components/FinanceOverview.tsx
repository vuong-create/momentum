import { useState } from "react";

import type {
  FinanceAccount,
  FinanceCategory,
  FinanceRecurringTransaction,
  FinanceTransaction,
} from "../../../database/db";
import type { BudgetRow } from "../services/financeBudgetService";
import {
  formatMoney,
  getMonthSummary,
  getSixMonthCashFlow,
  isTransactionHiddenFromLedger,
  transactionSignedAmount,
} from "../services/financeCalculations";
import {
  getFinanceAttention,
  getFinanceMonthPace,
  getSameDayAllocationComparison,
  getUpcomingFinanceRecurring,
} from "../services/financeOverviewService";
import { recurringFrequencyLabel } from "../services/financeRecurringService";

interface Props {
  accounts: FinanceAccount[];
  transactions: FinanceTransaction[];
  recurring: FinanceRecurringTransaction[];
  categories: FinanceCategory[];
  budgetRows: BudgetRow[];
  now: Date;
  balancesHidden: boolean;
  onToggleBalances: () => void;
  onAddAccount: () => void;
  onOpenTransactions: () => void;
  onOpenBudget: () => void;
  onOpenRecurring: () => void;
}

type CategoryView = "all" | "active" | "watch";

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function paceLabel(status: ReturnType<typeof getFinanceMonthPace>["status"]) {
  if (status === "on-pace") return "On pace";
  if (status === "running-warm") return "Running warm";
  if (status === "over-plan") return "Over plan";
  return "No plan yet";
}

function transactionGlyph(type: FinanceTransaction["type"]) {
  if (type === "income") return "＋";
  if (type === "transfer") return "↔";
  if (type === "investment") return "↗";
  if (type === "adjustment") return "≈";
  return "−";
}

export default function FinanceOverview({
  accounts,
  transactions,
  recurring,
  categories: categoryRecords,
  budgetRows,
  now,
  balancesHidden,
  onToggleBalances,
  onAddAccount,
  onOpenTransactions,
  onOpenBudget,
  onOpenRecurring,
}: Props) {
  const [categoryView, setCategoryView] = useState<CategoryView>("all");
  const month = monthKey(now);
  const current = getMonthSummary(transactions, month, categoryRecords);
  const comparison = getSameDayAllocationComparison(transactions, now, categoryRecords);
  const allocationDelta = comparison.delta;
  const pace = getFinanceMonthPace(budgetRows, now);
  const attention = getFinanceAttention(transactions, accounts, categoryRecords, budgetRows, now);
  const upcoming = getUpcomingFinanceRecurring(recurring, now);
  const flow = getSixMonthCashFlow(transactions, now, categoryRecords);
  const flowMax = Math.max(1, ...flow.flatMap((item) => [item.income, item.expenses]));
  const recent = transactions
    .filter((item) => !isTransactionHiddenFromLedger(item))
    .sort((left, right) => right.date.localeCompare(left.date) || right.createdAt.localeCompare(left.createdAt))
    .slice(0, 12);
  const expenseCategories = budgetRows
    .filter((row) => row.category.flowType === "expense")
    .sort((left, right) => (
      Number(right.actual > 0) - Number(left.actual > 0)
      || right.actual - left.actual
      || right.available - left.available
      || left.category.sortOrder - right.category.sortOrder
    ));
  const visibleCategories = expenseCategories.filter((row) => {
    if (categoryView === "active") return row.actual > 0;
    if (categoryView === "watch") return row.available > 0 && row.percentage >= 80;
    return true;
  });

  if (!accounts.length) {
    return <section className="finance-onboarding finance-panel">
      <div className="finance-ledger-mark"><i /><i /><i /></div>
      <span className="text-label">Begin with the truth</span>
      <h2>Set your financial baseline.</h2>
      <p>Add the accounts you want Momentum to understand. Opening balances become the starting point; every future number is derived from the transactions you record.</p>
      <button type="button" onClick={onAddAccount}>Add your first account <span>→</span></button>
      <small>Nothing leaves this local database.</small>
    </section>;
  }

  return <div className="finance-overview finance-overview-v2">
    <section className="finance-net-worth finance-month-focus finance-panel">
      <div className="finance-allocation-hero">
        <header>
          <span className="text-label">Monthly allocation</span>
          <button className="finance-privacy-button" type="button" onClick={onToggleBalances}>{balancesHidden ? "◉ Show amounts" : "◌ Blur amounts"}</button>
        </header>
        <strong className="finance-balance-value">{formatMoney(comparison.allocated)}</strong>
        <p><i className={`${allocationDelta <= 0 ? "is-positive" : "is-negative"} finance-balance-value`}>{allocationDelta <= 0 ? "↓" : "↑"} {formatMoney(Math.abs(allocationDelta), true)}</i> versus this point last month</p>
        <footer>
          <span><small>Spent</small><b className="finance-balance-value">{formatMoney(current.expenses, true)}</b></span>
          <span><small>Invested</small><b className="finance-balance-value">{formatMoney(current.invested, true)}</b></span>
          <span><small>Saved</small><b className="finance-balance-value">{formatMoney(current.saved, true)}</b></span>
        </footer>
      </div>
      <div className="finance-flow-chart" aria-label="Six month income and spending">
        <header><span>Six-month flow</span><small><i className="income" /> Income <i className="expense" /> Spending</small></header>
        <div>{flow.map((item) => <span key={item.month}><b><em className="finance-balance-value">{formatMoney(item.income, true)}</em><em className="finance-balance-value">{formatMoney(item.expenses, true)}</em></b><i className="income" style={{ height: `${Math.max(3, item.income / flowMax * 100)}%` }} /><i className="expense" style={{ height: `${Math.max(3, item.expenses / flowMax * 100)}%` }} /><small>{item.label}</small></span>)}</div>
      </div>
    </section>

    <section className="finance-month-strip">
      <article><span>Income</span><strong className="is-positive finance-balance-value">{formatMoney(current.income)}</strong><small>This month</small></article>
      <article><span>Spending</span><strong className="finance-balance-value">{formatMoney(current.expenses)}</strong><small>{pace.planned > 0 ? `${formatMoney(pace.spent, true)} of ${formatMoney(pace.planned, true)} planned` : "No spending plan"}</small></article>
      <article><span>Invested</span><strong className="finance-balance-value">{formatMoney(current.invested)}</strong><small>Contributions</small></article>
      <article><span>Long-term saved</span><strong className="finance-balance-value">{formatMoney(current.saved)}</strong><small>{current.savingsRate.toFixed(0)}% savings rate</small></article>
    </section>

    <div className="finance-overview-insights">
      <section className={`finance-panel finance-month-pace is-${pace.status}`}>
        <header><div><span className="text-label">Month pace</span><h3>{paceLabel(pace.status)}</h3></div><strong>Day {pace.day}<small>of {pace.daysInMonth}</small></strong></header>
        <div className="finance-pace-track" aria-label={`${Math.round(pace.spendingPercentage)} percent of expense plan used`}>
          <i style={{ width: `${Math.min(100, pace.calendarPercentage)}%` }} />
          <span style={{ width: `${Math.min(100, pace.spendingPercentage)}%` }} />
        </div>
        <div className="finance-pace-legend"><span><i /> Month elapsed <b>{Math.round(pace.calendarPercentage)}%</b></span><span><i /> Budget used <b>{Math.round(pace.spendingPercentage)}%</b></span></div>
        <footer>
          <span><small>Remaining</small><b className={`finance-balance-value ${pace.remaining < 0 ? "is-negative" : ""}`}>{formatMoney(pace.remaining)}</b></span>
          <span><small>Daily average</small><b className="finance-balance-value">{formatMoney(pace.dailyAverage)}</b></span>
          <span><small>Projected finish</small><b className={`finance-balance-value ${pace.planned > 0 && pace.projected > pace.planned ? "is-negative" : ""}`}>{formatMoney(pace.projected)}</b></span>
        </footer>
      </section>

      <section className="finance-panel finance-attention">
        <header><div><span className="text-label">Needs attention</span><h3>{attention.length ? "A few things to review" : "Everything is accounted for"}</h3></div><span className={attention.length ? "is-active" : ""}>{attention.length || "✓"}</span></header>
        {attention.length ? <div>{attention.map((item) => <article className={`is-${item.tone}`} key={item.id}><i /><div><strong>{item.label}</strong><small>{item.detail}</small></div></article>)}</div> : <p>Your budgets and ledger look calm right now.</p>}
        <button type="button" onClick={onOpenTransactions}>Review ledger →</button>
      </section>
    </div>

    <section className="finance-panel finance-category-summary finance-category-summary-v2">
      <header>
        <div><span className="text-label">Spending</span><h3>Every category at a glance</h3></div>
        <div className="finance-category-controls">
          <menu aria-label="Category display">
            {(["all", "active", "watch"] as const).map((view) => <button className={categoryView === view ? "is-selected" : ""} key={view} type="button" onClick={() => setCategoryView(view)}>{view === "watch" ? "Near limit" : view[0].toUpperCase() + view.slice(1)}</button>)}
          </menu>
          <button type="button" onClick={onOpenBudget}>View budget →</button>
        </div>
      </header>
      {visibleCategories.length ? <div>{visibleCategories.map((item) => {
        const over = item.available > 0 && item.actual > item.available;
        const noPlan = item.available <= 0;
        return <article className={`${over ? "is-over" : ""} ${noPlan ? "is-unplanned" : ""}`} key={item.category.id}>
          <span className="finance-category-dot" />
          <div className="finance-category-body">
            <header><span>{item.category.name}</span><strong className="finance-balance-value">{formatMoney(item.actual)}</strong></header>
            <i><span style={{ width: `${Math.min(100, item.percentage)}%` }} /></i>
            <small className={over ? "is-negative" : ""}>{noPlan ? (item.actual > 0 ? "Unplanned spending" : "No activity") : over ? `${formatMoney(Math.abs(item.remaining))} over` : `${formatMoney(item.remaining)} left of ${formatMoney(item.available)} plan`}</small>
          </div>
        </article>;
      })}</div> : <p className="finance-empty-copy">No categories match this view.</p>}
    </section>

    <section className={`finance-panel finance-upcoming ${upcoming.length ? "" : "is-empty"}`}>
      <header><div><span className="text-label">Coming up</span><h3>Recurring activity</h3></div><button type="button" onClick={onOpenRecurring}>{upcoming.length ? "Manage schedules →" : "Add a schedule →"}</button></header>
      {upcoming.length ? <div>{upcoming.map((item) => <article className={item.overdue ? "is-overdue" : ""} key={item.id}>
        <time><b>{new Date(`${item.nextDate}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</b><small>{item.overdue ? "Due now" : recurringFrequencyLabel(item.frequency, item.customInterval, item.customUnit)}</small></time>
        <span className={`finance-transaction-glyph type-${item.type}`}>{transactionGlyph(item.type)}</span>
        <div><strong>{item.merchant}</strong><small>{item.category ?? item.type}</small></div>
        <b className="finance-balance-value">{formatMoney(item.amount)}</b>
      </article>)}</div> : <p className="finance-empty-copy">No recurring activity is scheduled.</p>}
    </section>

    <section className="finance-panel finance-recent finance-recent-v2">
      <header><div><span className="text-label">Recent activity</span><h3>Latest transactions</h3></div><button type="button" onClick={onOpenTransactions}>View all →</button></header>
      {recent.length ? <div>{recent.map((item) => {
        const category = categoryRecords.find((entry) => entry.id === item.categoryId)?.name ?? item.category;
        const signed = transactionSignedAmount(item);
        return <article className={`type-${item.type}`} key={item.id}>
          <time>{new Date(`${item.date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</time>
          <span className={`finance-transaction-glyph type-${item.type}`}>{transactionGlyph(item.type)}</span>
          <div><strong>{item.merchant}</strong><small>{category ?? (item.type === "transfer" ? "Transfer" : item.type === "adjustment" ? "Balance correction" : item.type)}</small></div>
          <b className={`${signed > 0 ? "is-positive" : signed < 0 ? "is-negative" : ""} finance-balance-value`}>{item.type === "transfer" ? formatMoney(item.amount) : `${signed > 0 ? "+" : ""}${formatMoney(signed)}`}</b>
        </article>;
      })}</div> : <p className="finance-empty-copy">Your latest financial decisions will appear here.</p>}
    </section>
  </div>;
}
