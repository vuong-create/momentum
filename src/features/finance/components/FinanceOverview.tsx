import type { FinanceAccount, FinanceCategory, FinanceSubcategory, FinanceTransaction } from "../../../database/db";
import { accountTypeLabel } from "../financeCatalog";
import { formatMoney, getAccountBalances, getCategorySpending, getMonthSummary, getNetWorth, getSixMonthCashFlow } from "../services/financeCalculations";

interface Props {
  accounts: FinanceAccount[];
  transactions: FinanceTransaction[];
  categories: FinanceCategory[];
  subcategories: FinanceSubcategory[];
  now: Date;
  onAddAccount: () => void;
  onOpenTransactions: () => void;
}

function monthKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`; }
function transactionAmount(item: FinanceTransaction) { return item.type === "expense" ? -item.amount : item.type === "transfer" ? 0 : item.amount; }

export default function FinanceOverview({ accounts, transactions, categories: categoryRecords, subcategories: subcategoryRecords, now, onAddAccount, onOpenTransactions }: Props) {
  const month = monthKey(now);
  const previousDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const current = getMonthSummary(transactions, month);
  const previous = getMonthSummary(transactions, monthKey(previousDate));
  const balances = getAccountBalances(accounts, transactions);
  const netWorth = getNetWorth(accounts, transactions);
  const categories = getCategorySpending(transactions, month, categoryRecords);
  const recent = [...transactions].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)).slice(0, 7);
  const flow = getSixMonthCashFlow(transactions, now);
  const flowMax = Math.max(1, ...flow.flatMap((item) => [item.income, item.expenses]));

  if (!accounts.length) return <section className="finance-onboarding finance-panel">
    <div className="finance-ledger-mark"><i /><i /><i /></div><span className="text-label">Begin with the truth</span><h2>Set your financial baseline.</h2><p>Add the accounts you want Momentum to understand. Opening balances become the starting point; every future number is derived from the transactions you record.</p><button type="button" onClick={onAddAccount}>Add your first account <span>→</span></button><small>Nothing leaves this local database.</small>
  </section>;

  return <div className="finance-overview">
    <section className="finance-net-worth finance-panel">
      <div><span className="text-label">Net worth</span><strong>{formatMoney(netWorth)}</strong><p><i className={current.remaining >= previous.remaining ? "is-positive" : "is-negative"}>{current.remaining >= previous.remaining ? "↑" : "↓"} {formatMoney(Math.abs(current.remaining - previous.remaining), true)}</i> monthly cash-flow change</p></div>
      <div className="finance-flow-chart" aria-label="Six month income and spending"><header><span>Six-month flow</span><small>Income / spending</small></header><div>{flow.map((item) => <span key={item.month}><i className="income" style={{ height: `${Math.max(3, item.income / flowMax * 100)}%` }} /><i className="expense" style={{ height: `${Math.max(3, item.expenses / flowMax * 100)}%` }} /><small>{item.label}</small></span>)}</div></div>
    </section>

    <section className="finance-month-strip">
      <article><span>Income</span><strong className="is-positive">{formatMoney(current.income)}</strong><small>This month</small></article>
      <article><span>Spending</span><strong>{formatMoney(current.expenses)}</strong><small>This month</small></article>
      <article><span>Invested</span><strong>{formatMoney(current.invested)}</strong><small>Contributions</small></article>
      <article><span>Remaining</span><strong className={current.remaining >= 0 ? "is-positive" : "is-negative"}>{formatMoney(current.remaining)}</strong><small>{current.savingsRate.toFixed(0)}% savings rate</small></article>
    </section>

    <div className="finance-overview-grid">
      <section className="finance-panel finance-account-summary"><header><div><span className="text-label">Accounts</span><h3>Where you stand</h3></div><button type="button" onClick={onAddAccount}>＋ Add</button></header><div>{balances.map(({ account, balance }) => <article key={account.id}><span className={`finance-account-dot type-${account.type}`} /><div><strong>{account.name}</strong><small>{accountTypeLabel(account.type)}</small></div><b className={balance < 0 ? "is-negative" : ""}>{formatMoney(balance)}</b></article>)}</div></section>
      <section className="finance-panel finance-category-summary"><header><div><span className="text-label">Spending</span><h3>By category</h3></div><small>{new Intl.DateTimeFormat("en-US", { month: "long" }).format(now)}</small></header>{categories.length ? <div>{categories.slice(0, 5).map((item) => <article key={item.category}><div><span>{item.category}</span><strong>{formatMoney(item.amount)}</strong></div><i><span style={{ width: `${item.amount / categories[0].amount * 100}%` }} /></i></article>)}</div> : <p className="finance-empty-copy">Expenses will organize themselves here.</p>}</section>
    </div>

    <section className="finance-panel finance-recent"><header><div><span className="text-label">Recent activity</span><h3>Latest transactions</h3></div><button type="button" onClick={onOpenTransactions}>View all →</button></header>{recent.length ? <div>{recent.map((item) => { const category = categoryRecords.find((entry) => entry.id === item.categoryId)?.name ?? item.category; const subcategory = subcategoryRecords.find((entry) => entry.id === item.subcategoryId)?.name ?? item.subcategory; return <article key={item.id}><time>{new Date(`${item.date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</time><span className={`finance-transaction-glyph type-${item.type}`}>{item.type === "income" ? "＋" : item.type === "transfer" ? "↔" : item.type === "investment" ? "↗" : "−"}</span><div><strong>{item.merchant}</strong><small>{item.type === "transfer" ? "Transfer" : [category, subcategory].filter(Boolean).join(" · ") || item.type}</small></div><b className={transactionAmount(item) > 0 ? "is-positive" : transactionAmount(item) < 0 ? "is-negative" : ""}>{item.type === "transfer" ? formatMoney(item.amount) : `${transactionAmount(item) > 0 ? "+" : ""}${formatMoney(transactionAmount(item))}`}</b></article>; })}</div> : <p className="finance-empty-copy">Your latest financial decisions will appear here.</p>}</section>
  </div>;
}
