import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";

import { db, type FinanceAccount, type FinanceTransaction } from "../../database/db";
import useExperience from "../../experience/useExperience";
import ActivityUndoToast from "../activities/components/ActivityUndoToast";
import useActivityUndo from "../activities/hooks/useActivityUndo";
import FinanceAccountModal from "./components/FinanceAccountModal";
import FinanceAccounts from "./components/FinanceAccounts";
import FinanceOverview from "./components/FinanceOverview";
import FinanceTransactions from "./components/FinanceTransactions";
import TransactionComposer from "./components/TransactionComposer";
import { formatMoney, getMonthSummary, getNetWorth, visibleFinanceAccounts, visibleFinanceTransactions } from "./services/financeCalculations";
import { createFinanceAccount, createFinanceTransaction, restoreFinanceAccount, restoreFinanceTransaction, softDeleteFinanceAccount, softDeleteFinanceTransaction, updateFinanceAccount, updateFinanceTransaction, type FinanceAccountInput, type FinanceTransactionInput } from "./services/financeService";

import "./finance.css";

type FinanceView = "overview" | "transactions" | "accounts";
const tabs: Array<{ id: FinanceView; label: string; mark: string }> = [
  { id: "overview", label: "Overview", mark: "◇" },
  { id: "transactions", label: "Transactions", mark: "≡" },
  { id: "accounts", label: "Accounts", mark: "○" },
];
function initialView(): FinanceView { const stored = sessionStorage.getItem("momentum.finance.tab"); return tabs.some((item) => item.id === stored) ? stored as FinanceView : "overview"; }
function dateKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }

export default function FinancePage() {
  const experience = useExperience(); const undo = useActivityUndo();
  const [view, setView] = useState<FinanceView>(initialView);
  const [accountModal, setAccountModal] = useState<FinanceAccount | "new" | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<FinanceTransaction | null>(null);
  const allAccounts = useLiveQuery(() => db.financeAccounts.toArray(), []) ?? [];
  const allTransactions = useLiveQuery(() => db.financeTransactions.toArray(), []) ?? [];
  const accounts = visibleFinanceAccounts(allAccounts);
  const transactions = visibleFinanceTransactions(allTransactions);
  const month = dateKey(experience.now).slice(0, 7);
  const summary = getMonthSummary(transactions, month);
  const netWorth = getNetWorth(accounts, transactions);

  function selectView(next: FinanceView) { setView(next); sessionStorage.setItem("momentum.finance.tab", next); if (next !== "transactions") setEditingTransaction(null); }
  async function saveAccount(input: FinanceAccountInput) {
    if (accountModal && accountModal !== "new" && accountModal.id) {
      const previous = { ...accountModal }; await updateFinanceAccount(accountModal.id, input); experience.playFeedback("task-updated");
      undo.show({ message: `${input.name.trim()} updated`, undo: () => db.financeAccounts.put(previous) }); return;
    }
    const id = await createFinanceAccount(input); experience.playFeedback("finance-account-added");
    undo.show({ message: `${input.name.trim()} added`, undo: () => softDeleteFinanceAccount(id) });
  }
  async function saveTransaction(input: FinanceTransactionInput) {
    if (editingTransaction?.id) {
      const previous = { ...editingTransaction }; await updateFinanceTransaction(editingTransaction.id, input); setEditingTransaction(null); experience.playFeedback("task-updated");
      undo.show({ message: "Transaction updated", undo: () => db.financeTransactions.put(previous) }); return;
    }
    const id = await createFinanceTransaction(input); experience.playFeedback(input.type === "income" ? "finance-income" : "finance-transaction");
    undo.show({ message: `${input.merchant.trim() || "Transaction"} recorded`, undo: () => softDeleteFinanceTransaction(id) });
  }
  async function removeTransaction(item: FinanceTransaction) { if (!item.id) return; await softDeleteFinanceTransaction(item.id); experience.playFeedback("task-dismissed"); undo.show({ message: "Transaction removed", undo: () => restoreFinanceTransaction(item.id!) }); }

  return <div className="finance-page">
    <header className="finance-page-header"><div><span className="text-label">Clarity · Intention · Growth</span><h1 className="font-pixel">Finance</h1><p>Your financial life, without the spreadsheet friction.</p></div><div className="finance-header-stats"><span><small>Net worth</small><strong>{formatMoney(netWorth, true)}</strong></span><span><small>This month</small><strong className={summary.remaining >= 0 ? "is-positive" : "is-negative"}>{formatMoney(summary.remaining, true)}</strong></span><span><small>Accounts</small><strong>{accounts.length}</strong></span></div></header>
    <nav className="finance-tabs" aria-label="Finance sections">{tabs.map((tab) => <button key={tab.id} type="button" className={view === tab.id ? "is-selected" : ""} onClick={() => selectView(tab.id)}><span>{tab.mark}</span>{tab.label}</button>)}</nav>
    <main className="finance-content">
      {view === "transactions" && <TransactionComposer key={editingTransaction?.id ?? "new"} accounts={accounts} transactions={transactions} editing={editingTransaction} todayKey={dateKey(experience.now)} onSave={saveTransaction} onCancelEdit={() => setEditingTransaction(null)} />}
      {view === "overview" && <FinanceOverview accounts={accounts} transactions={transactions} now={experience.now} onAddAccount={() => setAccountModal("new")} onOpenTransactions={() => selectView("transactions")} />}
      {view === "transactions" && <FinanceTransactions accounts={accounts} transactions={transactions} onEdit={(item) => { setEditingTransaction(item); window.scrollTo({ top: 0, behavior: "smooth" }); }} onDelete={removeTransaction} />}
      {view === "accounts" && <FinanceAccounts accounts={accounts} transactions={transactions} onAdd={() => setAccountModal("new")} onEdit={setAccountModal} />}
    </main>
    {accountModal && <FinanceAccountModal account={accountModal === "new" ? null : accountModal} onClose={() => setAccountModal(null)} onSave={saveAccount} onDelete={accountModal !== "new" && accountModal.id ? async () => { await softDeleteFinanceAccount(accountModal.id!); experience.playFeedback("task-dismissed"); undo.show({ message: `${accountModal.name} removed`, undo: () => restoreFinanceAccount(accountModal.id!) }); } : undefined} />}
    <ActivityUndoToast notice={undo.notice} onDismiss={undo.dismiss} onUndo={undo.undo} />
  </div>;
}
