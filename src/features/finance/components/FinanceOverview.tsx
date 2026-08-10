import type { FinanceAccount, FinanceCategory, FinanceTransaction } from "../../../database/db";
import { accountTypeLabel } from "../financeCatalog";
import type { BudgetRow } from "../services/financeBudgetService";
import { formatMoney, getAccountBalances, getMonthSummary, getSixMonthCashFlow, isTransactionHiddenFromLedger, transactionSignedAmount } from "../services/financeCalculations";

interface Props {
  accounts: FinanceAccount[];
  transactions: FinanceTransaction[];
  categories: FinanceCategory[];
  budgetRows: BudgetRow[];
  now: Date;
  balancesHidden: boolean;
  onToggleBalances: () => void;
  onAddAccount: () => void;
  onOpenTransactions: () => void;
}

function monthKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`; }

export default function FinanceOverview({ accounts, transactions, categories: categoryRecords, budgetRows, now, balancesHidden, onToggleBalances, onAddAccount, onOpenTransactions }: Props) {
  const month = monthKey(now);
  const previousDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const current = getMonthSummary(transactions, month, categoryRecords);
  const previous = getMonthSummary(transactions, monthKey(previousDate), categoryRecords);
  const balances = getAccountBalances(accounts, transactions).filter(({ account }) => account.type !== "credit");
  const categories = budgetRows.filter((row) => row.category.flowType === "expense" && row.actual > 0).sort((a, b) => b.actual - a.actual);
  const recent = transactions.filter((item) => !isTransactionHiddenFromLedger(item)).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)).slice(0, 7);
  const flow = getSixMonthCashFlow(transactions, now, categoryRecords);
  const flowMax = Math.max(1, ...flow.flatMap((item) => [item.income, item.expenses]));
  const allocated = current.expenses + current.invested + current.saved;
  const previousAllocated = previous.expenses + previous.invested + previous.saved;
  const allocationDelta = allocated - previousAllocated;

  if (!accounts.length) return <section className="finance-onboarding finance-panel">
    <div className="finance-ledger-mark"><i /><i /><i /></div><span className="text-label">Begin with the truth</span><h2>Set your financial baseline.</h2><p>Add the accounts you want Momentum to understand. Opening balances become the starting point; every future number is derived from the transactions you record.</p><button type="button" onClick={onAddAccount}>Add your first account <span>→</span></button><small>Nothing leaves this local database.</small>
  </section>;

  return <div className="finance-overview">
    <section className="finance-net-worth finance-month-focus finance-panel">
      <div className="finance-allocation-hero"><header><span className="text-label">Monthly allocation</span><button className="finance-privacy-button" type="button" onClick={onToggleBalances}>{balancesHidden ? "◉ Show amounts" : "◌ Blur amounts"}</button></header><strong className="finance-balance-value">{formatMoney(allocated)}</strong><p><i className={`${allocationDelta <= 0 ? "is-positive" : "is-negative"} finance-balance-value`}>{allocationDelta <= 0 ? "↓" : "↑"} {formatMoney(Math.abs(allocationDelta), true)}</i> compared with last month</p><footer><span><small>Spent</small><b className="finance-balance-value">{formatMoney(current.expenses, true)}</b></span><span><small>Invested</small><b className="finance-balance-value">{formatMoney(current.invested, true)}</b></span><span><small>Saved</small><b className="finance-balance-value">{formatMoney(current.saved, true)}</b></span></footer></div>
      <div className="finance-flow-chart" aria-label="Six month income and spending"><header><span>Six-month flow</span><small><i className="income" /> Income <i className="expense" /> Spending</small></header><div>{flow.map((item) => <span key={item.month}><b><em className="finance-balance-value">{formatMoney(item.income, true)}</em><em className="finance-balance-value">{formatMoney(item.expenses, true)}</em></b><i className="income" style={{ height: `${Math.max(3, item.income / flowMax * 100)}%` }} /><i className="expense" style={{ height: `${Math.max(3, item.expenses / flowMax * 100)}%` }} /><small>{item.label}</small></span>)}</div></div>
    </section>

    <section className="finance-month-strip">
      <article><span>Income</span><strong className="is-positive finance-balance-value">{formatMoney(current.income)}</strong><small>This month</small></article>
      <article><span>Spending</span><strong className="finance-balance-value">{formatMoney(current.expenses)}</strong><small>This month</small></article>
      <article><span>Invested</span><strong className="finance-balance-value">{formatMoney(current.invested)}</strong><small>Contributions</small></article>
      <article><span>Long-term saved</span><strong className="finance-balance-value">{formatMoney(current.saved)}</strong><small>{current.savingsRate.toFixed(0)}% savings rate</small></article>
    </section>

    <div className="finance-overview-grid">
      <section className="finance-panel finance-account-summary"><header><div><span className="text-label">Accounts</span><h3>Where you stand</h3></div><button type="button" onClick={onAddAccount}>＋ Add</button></header><div>{balances.map(({ account, balance }) => <article key={account.id}><span className={`finance-account-dot type-${account.type}`} /><div><strong>{account.name}</strong><small>{accountTypeLabel(account.type)}</small></div><b className={`${account.type !== "credit" && balance < 0 ? "is-negative" : ""} ${account.type !== "credit" ? "finance-balance-value" : ""}`}>{account.type === "credit" ? "Paid in full" : formatMoney(balance)}</b></article>)}</div></section>
      <section className="finance-panel finance-category-summary"><header><div><span className="text-label">Spending</span><h3>By category</h3></div><small>{new Intl.DateTimeFormat("en-US", { month: "long" }).format(now)}</small></header>{categories.length ? <div>{categories.slice(0, 5).map((item, index) => { const over = item.actual > item.available && item.actual > 0; return <article className={over ? "is-over" : ""} key={item.category.id}><span className="finance-category-rank">{String(index + 1).padStart(2, "0")}</span><div className="finance-category-body"><header><span>{item.category.name}</span><strong className="finance-balance-value">{formatMoney(item.actual)}</strong></header><i><span style={{ width: `${Math.min(100, item.percentage)}%` }} /></i><small className={over ? "is-negative" : ""}>{item.available ? over ? `${Math.round(item.percentage)}% · ${formatMoney(item.actual - item.available)} over plan` : `${Math.round(item.percentage)}% of ${formatMoney(item.available)} plan` : "Unplanned spending"}</small></div></article>; })}</div> : <p className="finance-empty-copy">Expenses will organize themselves here.</p>}</section>
    </div>

    <section className="finance-panel finance-recent"><header><div><span className="text-label">Recent activity</span><h3>Latest transactions</h3></div><button type="button" onClick={onOpenTransactions}>View all →</button></header>{recent.length ? <div>{recent.map((item) => { const category = categoryRecords.find((entry) => entry.id === item.categoryId)?.name ?? item.category; const signed = transactionSignedAmount(item); return <article key={item.id}><time>{new Date(`${item.date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</time><span className={`finance-transaction-glyph type-${item.type}`}>{item.type === "income" ? "＋" : item.type === "transfer" ? "↔" : item.type === "investment" ? "↗" : item.type === "adjustment" ? "≈" : "−"}</span><div><strong>{item.merchant}</strong><small>{category ?? (item.type === "transfer" ? "Transfer" : item.type === "adjustment" ? "Balance correction" : item.type)}</small></div><b className={`${signed > 0 ? "is-positive" : signed < 0 ? "is-negative" : ""} finance-balance-value`}>{item.type === "transfer" ? formatMoney(item.amount) : `${signed > 0 ? "+" : ""}${formatMoney(signed)}`}</b></article>; })}</div> : <p className="finance-empty-copy">Your latest financial decisions will appear here.</p>}</section>
  </div>;
}
