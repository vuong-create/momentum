import type { FinanceAccount, FinanceTransaction } from "../../../database/db";
import { accountTypeLabel } from "../financeCatalog";
import { formatMoney, getAccountBalances } from "../services/financeCalculations";

interface Props { accounts: FinanceAccount[]; transactions: FinanceTransaction[]; onAdd: () => void; onEdit: (account: FinanceAccount) => void; onAdjust: (account: FinanceAccount) => void; }

export default function FinanceAccounts({ accounts, transactions, onAdd, onEdit, onAdjust }: Props) {
  const balances = getAccountBalances(accounts, transactions);
  return <section className="finance-accounts-view"><header className="finance-section-heading"><div><span className="text-label">Financial baseline</span><h2>Accounts</h2><p>Opening balances plus transaction history. Nothing hidden.</p></div><button className="finance-primary-button" type="button" onClick={onAdd}>＋ Add account</button></header>
    <div className="finance-account-grid">{balances.map(({ account, balance }) => <article className="finance-account-card finance-panel" key={account.id}><button className="finance-account-card-main" type="button" onClick={() => onEdit(account)}><header><span className={`finance-account-symbol type-${account.type}`}>{account.type === "credit" ? "C" : account.type === "investment" || account.type === "retirement" ? "↗" : "○"}</span><small>{accountTypeLabel(account.type)}</small><i>•••</i></header><strong className={balance < 0 ? "is-negative" : ""}>{formatMoney(balance)}</strong><h3>{account.name}</h3></button><footer><span>Opening {formatMoney(account.openingBalance)}</span><button type="button" onClick={() => onAdjust(account)}>Adjust balance</button></footer></article>)}<button className="finance-add-account-card" type="button" onClick={onAdd}><span>＋</span><strong>Add another account</strong><small>Checking, savings, credit, investment, or cash</small></button></div>
  </section>;
}
