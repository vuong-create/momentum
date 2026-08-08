import { useMemo, useState } from "react";

import type { FinanceAccount, FinanceTransaction } from "../../../database/db";
import { formatMoney } from "../services/financeCalculations";

interface Props { accounts: FinanceAccount[]; transactions: FinanceTransaction[]; onEdit: (item: FinanceTransaction) => void; onDelete: (item: FinanceTransaction) => Promise<void>; }

export default function FinanceTransactions({ accounts, transactions, onEdit, onDelete }: Props) {
  const [search, setSearch] = useState(""); const [type, setType] = useState("all");
  const accountMap = new Map(accounts.map((item) => [item.id, item.name]));
  const filtered = useMemo(() => transactions.filter((item) => {
    const haystack = `${item.merchant} ${item.category ?? ""} ${item.subcategory ?? ""} ${item.notes ?? ""}`.toLocaleLowerCase();
    return (type === "all" || item.type === type) && haystack.includes(search.toLocaleLowerCase());
  }).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)), [transactions, search, type]);

  return <section className="finance-transactions-view">
    <header className="finance-section-heading"><div><span className="text-label">Ledger</span><h2>Transactions</h2><p>Every balance begins here.</p></div><div><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search transactions…" /><select value={type} onChange={(event) => setType(event.target.value)}><option value="all">All types</option><option value="expense">Expenses</option><option value="income">Income</option><option value="transfer">Transfers</option><option value="investment">Investments</option></select></div></header>
    <div className="finance-transaction-table finance-panel"><header><span>Date</span><span>Merchant</span><span>Category</span><span>Account</span><span>Amount</span><span /></header>{filtered.length ? filtered.map((item) => {
      const signed = item.type === "expense" ? -item.amount : item.type === "transfer" ? 0 : item.amount;
      const account = item.type === "transfer" ? `${accountMap.get(item.fromAccountId) ?? "—"} → ${accountMap.get(item.toAccountId) ?? "—"}` : accountMap.get(item.accountId) ?? "—";
      return <article key={item.id} onDoubleClick={() => onEdit(item)}><time>{new Date(`${item.date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</time><div><span className={`finance-transaction-glyph type-${item.type}`}>{item.type === "income" ? "＋" : item.type === "transfer" ? "↔" : item.type === "investment" ? "↗" : "−"}</span><strong>{item.merchant}</strong></div><span>{item.type === "transfer" ? "Transfer" : [item.category, item.subcategory].filter(Boolean).join(" / ") || item.type}</span><span>{account}</span><b className={signed > 0 ? "is-positive" : signed < 0 ? "is-negative" : ""}>{item.type === "transfer" ? formatMoney(item.amount) : `${signed > 0 ? "+" : ""}${formatMoney(signed)}`}</b><menu><button type="button" onClick={() => onEdit(item)}>Edit</button><button type="button" onClick={() => onDelete(item)}>Delete</button></menu></article>;
    }) : <div className="finance-table-empty"><span>⌁</span><strong>No matching transactions.</strong><small>New entries appear here immediately.</small></div>}</div>
  </section>;
}
