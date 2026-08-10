import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";

import { db, type FinanceAccount, type FinanceImportBatch, type FinanceNetWorthSnapshot, type FinanceTransaction } from "../../database/db";
import useExperience from "../../experience/useExperience";
import ActivityUndoToast from "../activities/components/ActivityUndoToast";
import useActivityUndo from "../activities/hooks/useActivityUndo";
import FinanceAccountModal from "./components/FinanceAccountModal";
import FinanceAccounts from "./components/FinanceAccounts";
import FinanceBudget from "./components/FinanceBudget";
import FinanceBalanceModal from "./components/FinanceBalanceModal";
import FinanceCategoryManager from "./components/FinanceCategoryManager";
import FinanceImportModal from "./components/FinanceImportModal";
import FinanceOverview from "./components/FinanceOverview";
import FinanceReports from "./components/FinanceReports";
import FinanceTransactions from "./components/FinanceTransactions";
import TransactionComposer from "./components/TransactionComposer";
import { formatMoney, getAccountBalance, getMonthSummary, visibleFinanceAccounts, visibleFinanceTransactions } from "./services/financeCalculations";
import { calculateBudgetRows, copyPreviousBudget, setBudgetAllocation } from "./services/financeBudgetService";
import { archiveFinanceCategory, createFinanceCategory, ensureFinanceCategories, moveFinanceCategory, renameFinanceCategory, restoreFinanceCategory, visibleFinanceCategories } from "./services/financeCategoryService";
import { createFinanceAccount, createFinanceTransaction, restoreFinanceAccount, restoreFinanceTransaction, setFinanceAccountBalance, softDeleteFinanceAccount, softDeleteFinanceTransaction, updateFinanceAccount, updateFinanceTransaction, type FinanceAccountInput, type FinanceTransactionInput } from "./services/financeService";
import { restoreNetWorthSnapshot, saveManualNetWorthSnapshot, softDeleteNetWorthSnapshot, upsertMonthlyNetWorthSnapshot, visibleNetWorthSnapshots } from "./services/financeSnapshotService";
import { importFinanceCsv, revertFinanceImport, type FinanceCsvPreview, type FinanceImportOptions } from "./services/financeImportService";

import "./finance.css";

type FinanceView = "overview" | "transactions" | "budget" | "accounts" | "reports";
const tabs: Array<{ id: FinanceView; label: string; mark: string }> = [
  { id: "overview", label: "Overview", mark: "◇" },
  { id: "transactions", label: "Transactions", mark: "≡" },
  { id: "budget", label: "Budget", mark: "▤" },
  { id: "accounts", label: "Accounts", mark: "○" },
  { id: "reports", label: "Reports", mark: "↗" },
];
function initialView(): FinanceView { const stored = sessionStorage.getItem("momentum.finance.tab"); return tabs.some((item) => item.id === stored) ? stored as FinanceView : "overview"; }
function dateKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }

export default function FinancePage() {
  const experience = useExperience(); const undo = useActivityUndo();
  const [view, setView] = useState<FinanceView>(initialView);
  const [accountModal, setAccountModal] = useState<FinanceAccount | "new" | null>(null);
  const [balanceAccount, setBalanceAccount] = useState<FinanceAccount | null>(null);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [balancesHidden, setBalancesHidden] = useState(() => localStorage.getItem("momentum.finance.hideBalances") === "true");
  const [editingTransaction, setEditingTransaction] = useState<FinanceTransaction | null>(null);
  const allAccounts = useLiveQuery(() => db.financeAccounts.toArray(), []) ?? [];
  const allTransactions = useLiveQuery(() => db.financeTransactions.toArray(), []) ?? [];
  const allCategories = useLiveQuery(() => db.financeCategories.toArray(), []) ?? [];
  const budgetMonths = useLiveQuery(() => db.financeBudgetMonths.toArray(), []) ?? [];
  const budgetAllocations = useLiveQuery(() => db.financeBudgetAllocations.toArray(), []) ?? [];
  const allSnapshots = useLiveQuery(() => db.financeNetWorthSnapshots.toArray(), []) ?? [];
  const importBatches = useLiveQuery(() => db.financeImportBatches.toArray(), []) ?? [];
  const accounts = visibleFinanceAccounts(allAccounts);
  const transactions = visibleFinanceTransactions(allTransactions);
  const categories = visibleFinanceCategories(allCategories);
  const snapshots = visibleNetWorthSnapshots(allSnapshots);
  const latestImport = [...importBatches].filter((item) => !item.revertedAt).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const todayKey = dateKey(experience.now);
  const month = todayKey.slice(0, 7);
  const summary = getMonthSummary(transactions, month, categories);
  const currentBudgetRows = calculateBudgetRows(month, budgetAllocations, categories, transactions);
  const expenseBudgetRemaining = currentBudgetRows.filter((row) => row.category.flowType === "expense").reduce((total, row) => total + row.remaining, 0);

  useEffect(() => { void ensureFinanceCategories(); }, []);
  useEffect(() => { void upsertMonthlyNetWorthSnapshot(accounts, transactions, new Date(`${todayKey}T12:00:00`)); }, [accounts, transactions, todayKey]);

  function selectView(next: FinanceView) { setView(next); sessionStorage.setItem("momentum.finance.tab", next); window.scrollTo({ top: 0, behavior: "smooth" }); if (next !== "transactions") setEditingTransaction(null); }
  function toggleBalances() { setBalancesHidden((current) => { const next = !current; localStorage.setItem("momentum.finance.hideBalances", String(next)); return next; }); }
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

  return <div className={`finance-page ${balancesHidden ? "is-balances-hidden" : ""}`}>
    <header className="finance-page-header"><div><span className="text-label">Clarity · Intention · Growth</span><h1 className="font-pixel">Finance</h1><p>Your financial life, without the spreadsheet friction.</p></div><div className="finance-header-stats"><span><small>Spent this month</small><strong className="finance-balance-value">{formatMoney(summary.expenses, true)}</strong></span><span><small>Savings rate</small><strong className={`${summary.savingsRate >= 0 ? "is-positive" : "is-negative"} finance-balance-value`}>{summary.savingsRate.toFixed(0)}%</strong></span><span><small>Budget remaining</small><strong className={`${expenseBudgetRemaining >= 0 ? "is-positive" : "is-negative"} finance-balance-value`}>{formatMoney(expenseBudgetRemaining, true)}</strong></span></div></header>
    <nav className="finance-tabs" aria-label="Finance sections">{tabs.map((tab) => <button key={tab.id} type="button" className={view === tab.id ? "is-selected" : ""} onClick={() => selectView(tab.id)}><span>{tab.mark}</span>{tab.label}</button>)}</nav>
    <main className="finance-content">
      {view === "transactions" && <TransactionComposer key={editingTransaction?.id ?? "new"} accounts={accounts} transactions={transactions} categories={categories} editing={editingTransaction} todayKey={todayKey} onSave={saveTransaction} onCancelEdit={() => setEditingTransaction(null)} />}
      {view === "overview" && <FinanceOverview accounts={accounts} transactions={transactions} categories={allCategories} now={experience.now} balancesHidden={balancesHidden} onToggleBalances={toggleBalances} onAddAccount={() => setAccountModal("new")} onOpenTransactions={() => selectView("transactions")} />}
      {view === "transactions" && <FinanceTransactions accounts={accounts} categories={allCategories} transactions={transactions} latestImport={latestImport} onImport={() => setImportOpen(true)} onRevertImport={async (batch: FinanceImportBatch) => { await revertFinanceImport(batch.id!); experience.playFeedback("task-dismissed"); }} onEdit={(item) => { setEditingTransaction(item); window.scrollTo({ top: 0, behavior: "smooth" }); }} onDelete={removeTransaction} />}
      {view === "budget" && <FinanceBudget now={experience.now} categories={categories} months={budgetMonths} allocations={budgetAllocations} transactions={transactions} onSetAllocation={async (budgetMonth, categoryId, amount) => { await setBudgetAllocation(budgetMonth, categoryId, amount); experience.playFeedback("task-updated"); }} onCopyPrevious={async (budgetMonth) => { const count = await copyPreviousBudget(budgetMonth); experience.playFeedback("task-restored"); return count; }} onManageCategories={() => setCategoryManagerOpen(true)} />}
      {view === "accounts" && <FinanceAccounts accounts={accounts} transactions={transactions} balancesHidden={balancesHidden} onToggleBalances={toggleBalances} onAdd={() => setAccountModal("new")} onEdit={setAccountModal} onAdjust={setBalanceAccount} />}
      {view === "reports" && <FinanceReports now={experience.now} accounts={accounts} categories={allCategories} allocations={budgetAllocations} transactions={transactions} snapshots={snapshots} onSaveSnapshot={async () => { const id = await saveManualNetWorthSnapshot(accounts, transactions, experience.now); experience.playFeedback("finance-snapshot"); undo.show({ message: "Net worth snapshot saved", undo: () => softDeleteNetWorthSnapshot(id) }); }} onDeleteSnapshot={async (snapshot: FinanceNetWorthSnapshot) => { await softDeleteNetWorthSnapshot(snapshot.id!); experience.playFeedback("task-dismissed"); undo.show({ message: "Snapshot removed", undo: () => restoreNetWorthSnapshot(snapshot.id!) }); }} />}
    </main>
    {accountModal && <FinanceAccountModal account={accountModal === "new" ? null : accountModal} onClose={() => setAccountModal(null)} onSave={saveAccount} onDelete={accountModal !== "new" && accountModal.id ? async () => { await softDeleteFinanceAccount(accountModal.id!); experience.playFeedback("task-dismissed"); undo.show({ message: `${accountModal.name} removed`, undo: () => restoreFinanceAccount(accountModal.id!) }); } : undefined} />}
    {balanceAccount?.id && <FinanceBalanceModal account={balanceAccount} currentBalance={getAccountBalance(balanceAccount, transactions)} todayKey={todayKey} onClose={() => setBalanceAccount(null)} onSave={async (targetBalance, date, notes) => { const result = await setFinanceAccountBalance(balanceAccount.id!, targetBalance, date, notes); experience.playFeedback("finance-snapshot"); undo.show({ message: `${balanceAccount.name} balance adjusted`, undo: () => softDeleteFinanceTransaction(result.id) }); }} />}
    {categoryManagerOpen && <FinanceCategoryManager categories={allCategories} onClose={() => setCategoryManagerOpen(false)} onAddCategory={async (name, flowType) => { await createFinanceCategory(name, flowType); experience.playFeedback("task-added"); }} onRenameCategory={renameFinanceCategory} onMoveCategory={moveFinanceCategory} onArchiveCategory={archiveFinanceCategory} onRestoreCategory={restoreFinanceCategory} />}
    {importOpen && <FinanceImportModal accounts={accounts} categories={categories} onClose={() => setImportOpen(false)} onImport={async (preview: FinanceCsvPreview, options: FinanceImportOptions) => { const result = await importFinanceCsv(preview, categories, options); experience.playFeedback("finance-income"); undo.show({ message: `${result.importedCount} transactions imported`, undo: () => revertFinanceImport(result.batchId) }); }} />}
    <ActivityUndoToast notice={undo.notice} onDismiss={undo.dismiss} onUndo={undo.undo} />
  </div>;
}
