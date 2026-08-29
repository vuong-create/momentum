import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";

import { db, type FinanceAccount, type FinanceGoal, type FinanceNetWorthSnapshot, type FinanceTransaction } from "../../database/db";
import useExperience from "../../experience/useExperience";
import ActivityUndoToast from "../activities/components/ActivityUndoToast";
import useActivityUndo from "../activities/hooks/useActivityUndo";
import FinanceAccountModal from "./components/FinanceAccountModal";
import FinanceAccounts from "./components/FinanceAccounts";
import FinanceBudget from "./components/FinanceBudget";
import FinanceBalanceModal from "./components/FinanceBalanceModal";
import FinanceCategoryManager from "./components/FinanceCategoryManager";
import FinanceImportModal from "./components/FinanceImportModal";
import FinanceGoals from "./components/FinanceGoals";
import FinanceMonthlyCloseModal from "./components/FinanceMonthlyCloseModal";
import FinanceOverview from "./components/FinanceOverview";
import FinanceReports from "./components/FinanceReports";
import FinanceRecurringModal from "./components/FinanceRecurringModal";
import FinanceTransactions from "./components/FinanceTransactions";
import TransactionComposer from "./components/TransactionComposer";
import { getAccountBalance, visibleFinanceAccounts, visibleFinanceTransactions } from "./services/financeCalculations";
import { calculateBudgetRows, copyPreviousBudget, setBudgetAllocation } from "./services/financeBudgetService";
import { closeFinanceMonth, reopenFinanceMonth, visibleFinanceReviews } from "./services/financeCloseService";
import { archiveFinanceCategory, createFinanceCategory, ensureFinanceCategories, moveFinanceCategory, renameFinanceCategory, restoreFinanceCategory, visibleFinanceCategories } from "./services/financeCategoryService";
import { createFinanceAccount, createFinanceTransaction, restoreFinanceAccount, restoreFinanceTransaction, setFinanceAccountBalance, setFinanceTransactionLedgerVisibility, softDeleteFinanceAccount, softDeleteFinanceTransaction, updateFinanceAccount, updateFinanceTransaction, type FinanceAccountInput, type FinanceTransactionInput } from "./services/financeService";
import { createFinanceGoal, restoreFinanceGoal, softDeleteFinanceGoal, updateFinanceGoal, visibleFinanceGoals, type FinanceGoalInput } from "./services/financeGoalService";
import { restoreNetWorthSnapshot, saveManualNetWorthSnapshot, softDeleteNetWorthSnapshot, upsertMonthlyNetWorthSnapshot, visibleNetWorthSnapshots } from "./services/financeSnapshotService";
import { importFinanceCsv, revertFinanceImport, type FinanceCsvPreview, type FinanceImportOptions } from "./services/financeImportService";
import { confirmFinanceRecurring, createFinanceRecurring, dueFinanceRecurring, setFinanceRecurringActive, skipFinanceRecurring, softDeleteFinanceRecurring, updateFinanceRecurring, visibleFinanceRecurring, type FinanceRecurringInput } from "./services/financeRecurringService";

import "./finance.css";

type FinanceView = "overview" | "transactions" | "budget" | "goals" | "accounts" | "reports";
const tabs: Array<{ id: FinanceView; label: string; mark: string }> = [
  { id: "overview", label: "Overview", mark: "◇" },
  { id: "transactions", label: "Transactions", mark: "≡" },
  { id: "budget", label: "Budget", mark: "▤" },
  { id: "reports", label: "Reports", mark: "↗" },
  { id: "goals", label: "Goals", mark: "◎" },
  { id: "accounts", label: "Accounts", mark: "○" },
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
  const [recurringOpen, setRecurringOpen] = useState(false);
  const [closingMonth, setClosingMonth] = useState<string | null>(null);
  const [balancesHidden, setBalancesHidden] = useState(() => localStorage.getItem("momentum.finance.hideBalances") === "true");
  const [editingTransaction, setEditingTransaction] = useState<FinanceTransaction | null>(null);
  const [quickEntryHidden, setQuickEntryHidden] = useState(false);
  const allAccounts = useLiveQuery(() => db.financeAccounts.toArray(), []) ?? [];
  const allTransactions = useLiveQuery(() => db.financeTransactions.toArray(), []) ?? [];
  const allRecurring = useLiveQuery(() => db.financeRecurringTransactions.toArray(), []) ?? [];
  const allCategories = useLiveQuery(() => db.financeCategories.toArray(), []) ?? [];
  const budgetMonths = useLiveQuery(() => db.financeBudgetMonths.toArray(), []) ?? [];
  const budgetAllocations = useLiveQuery(() => db.financeBudgetAllocations.toArray(), []) ?? [];
  const allGoals = useLiveQuery(() => db.financeGoals.toArray(), []) ?? [];
  const allReviews = useLiveQuery(() => db.financeMonthlyReviews.toArray(), []) ?? [];
  const allSnapshots = useLiveQuery(() => db.financeNetWorthSnapshots.toArray(), []) ?? [];
  const accounts = visibleFinanceAccounts(allAccounts);
  const transactions = visibleFinanceTransactions(allTransactions);
  const recurring = visibleFinanceRecurring(allRecurring);
  const categories = visibleFinanceCategories(allCategories);
  const snapshots = visibleNetWorthSnapshots(allSnapshots);
  const goals = visibleFinanceGoals(allGoals); const reviews = visibleFinanceReviews(allReviews);
  const todayKey = dateKey(experience.now);
  const month = todayKey.slice(0, 7);
  const currentBudgetRows = calculateBudgetRows(month, budgetAllocations, categories, transactions);

  useEffect(() => { void ensureFinanceCategories(); }, []);
  useEffect(() => { void upsertMonthlyNetWorthSnapshot(accounts, transactions, new Date(`${todayKey}T12:00:00`)); }, [accounts, transactions, todayKey]);
  useEffect(() => {
    if (!editingTransaction || view !== "transactions") return;
    requestAnimationFrame(() => document.querySelector(".finance-transaction-composer")?.scrollIntoView({ behavior: "smooth", block: "center" }));
  }, [editingTransaction, view]);

  function selectView(next: FinanceView) { setView(next); sessionStorage.setItem("momentum.finance.tab", next); window.scrollTo({ top: 0, behavior: "smooth" }); if (next !== "transactions") setEditingTransaction(null); }
  function editTransaction(item: FinanceTransaction) { setQuickEntryHidden(false); setEditingTransaction(item); }
  function toggleBalances() { setBalancesHidden((current) => { const next = !current; localStorage.setItem("momentum.finance.hideBalances", String(next)); return next; }); }
  async function reopenForChange(months: string[]) { for (const affected of [...new Set(months)].sort((a, b) => b.localeCompare(a))) if (reviews.some((item) => item.month === affected)) await reopenFinanceMonth(affected); }
  async function saveAccount(input: FinanceAccountInput) {
    if (accountModal && accountModal !== "new" && accountModal.id) {
      const previous = { ...accountModal }; await updateFinanceAccount(accountModal.id, input); experience.playFeedback("task-updated");
      undo.show({ message: `${input.name.trim()} updated`, undo: () => db.financeAccounts.put(previous) }); return;
    }
    const id = await createFinanceAccount(input); experience.playFeedback("finance-account-added");
    undo.show({ message: `${input.name.trim()} added`, undo: () => softDeleteFinanceAccount(id) });
  }
  async function saveTransaction(input: FinanceTransactionInput, method: "keyboard" | "button" = "button") {
    await reopenForChange([input.date.slice(0, 7), ...(editingTransaction ? [editingTransaction.date.slice(0, 7)] : [])]);
    if (editingTransaction?.id) {
      const previous = { ...editingTransaction }; await updateFinanceTransaction(editingTransaction.id, input); setEditingTransaction(null); experience.playFeedback(method === "keyboard" ? "entry-confirmed" : "task-updated");
      undo.show({ message: "Transaction updated", undo: () => db.financeTransactions.put(previous) }); return;
    }
    const id = await createFinanceTransaction(input); experience.playFeedback(method === "keyboard" ? "entry-confirmed" : input.type === "income" ? "finance-income" : "finance-transaction");
    undo.show({ message: `${input.merchant.trim() || "Transaction"} recorded`, undo: () => softDeleteFinanceTransaction(id) });
  }
  async function removeTransaction(item: FinanceTransaction) { if (!item.id) return; await reopenForChange([item.date.slice(0, 7)]); await softDeleteFinanceTransaction(item.id); experience.playFeedback("task-dismissed"); undo.show({ message: "Transaction removed", undo: () => restoreFinanceTransaction(item.id!) }); }

  return <div className={`finance-page ${balancesHidden ? "is-balances-hidden" : ""} ${view === "transactions" ? "is-transactions-view" : ""} ${quickEntryHidden ? "is-quick-entry-hidden" : ""}`}>
    <header className="finance-page-header finance-page-header-compact"><div><span className="text-label">Clarity · Intention · Growth</span><h1 className="font-pixel">Finance</h1></div></header>
    <nav className="finance-tabs" aria-label="Finance sections">{tabs.map((tab) => <button key={tab.id} type="button" className={view === tab.id ? "is-selected" : ""} onClick={() => selectView(tab.id)}><span>{tab.mark}</span>{tab.label}</button>)}</nav>
    <main className="finance-content">
      {view === "overview" && <FinanceOverview accounts={accounts} transactions={transactions} categories={allCategories} budgetRows={currentBudgetRows} now={experience.now} balancesHidden={balancesHidden} onToggleBalances={toggleBalances} onAddAccount={() => setAccountModal("new")} onOpenTransactions={() => selectView("transactions")} />}
      {view === "transactions" && <FinanceTransactions accounts={accounts} categories={allCategories} transactions={transactions} recurringCount={recurring.length} recurringDueCount={dueFinanceRecurring(recurring, todayKey).length} onRecurring={() => setRecurringOpen(true)} onImport={() => setImportOpen(true)} onEdit={editTransaction} onDelete={removeTransaction} onSetVisibility={async (item, hidden) => { if (!item.id) return; await setFinanceTransactionLedgerVisibility(item.id, hidden); experience.playFeedback(hidden ? "task-dismissed" : "task-restored"); undo.show({ message: hidden ? "Transaction hidden from ledger" : "Transaction restored to ledger", undo: () => setFinanceTransactionLedgerVisibility(item.id!, !hidden) }); }} />}
      {view === "transactions" && (!quickEntryHidden ? <TransactionComposer key={editingTransaction?.id ?? "new"} accounts={accounts} transactions={transactions} categories={categories} editing={editingTransaction} todayKey={todayKey} onSave={saveTransaction} onCancelEdit={() => setEditingTransaction(null)} onHide={() => { setEditingTransaction(null); setQuickEntryHidden(true); }} /> : <button className="finance-quick-entry-restore" type="button" onClick={() => setQuickEntryHidden(false)}>＋ Show Quick Entry</button>)}
      {view === "budget" && <FinanceBudget now={experience.now} categories={categories} months={budgetMonths} allocations={budgetAllocations} transactions={transactions} reviews={reviews} onSetAllocation={async (budgetMonth, categoryId, amount) => { await reopenForChange([budgetMonth]); await setBudgetAllocation(budgetMonth, categoryId, amount); experience.playFeedback("task-updated"); }} onCopyPrevious={async (budgetMonth) => { await reopenForChange([budgetMonth]); const count = await copyPreviousBudget(budgetMonth); experience.playFeedback("task-restored"); return count; }} onManageCategories={() => setCategoryManagerOpen(true)} onCloseMonth={setClosingMonth} onReopenMonth={async (budgetMonth) => { await reopenFinanceMonth(budgetMonth); experience.playFeedback("task-restored"); }} />}
      {view === "goals" && <FinanceGoals now={experience.now} accounts={accounts} transactions={transactions} goals={goals} onCreate={async (input: FinanceGoalInput) => { const id = await createFinanceGoal(input); experience.playFeedback("task-added"); undo.show({ message: `${input.name.trim()} goal created`, undo: () => softDeleteFinanceGoal(id) }); }} onUpdate={async (id, input) => { const previous = { ...allGoals.find((item) => item.id === id)! }; await updateFinanceGoal(id, input); experience.playFeedback("task-updated"); undo.show({ message: "Goal updated", undo: () => db.financeGoals.put(previous) }); }} onDelete={async (goal: FinanceGoal) => { await softDeleteFinanceGoal(goal.id!); experience.playFeedback("task-dismissed"); undo.show({ message: "Goal archived", undo: () => restoreFinanceGoal(goal.id!) }); }} />}
      {view === "accounts" && <FinanceAccounts accounts={accounts} transactions={transactions} balancesHidden={balancesHidden} onToggleBalances={toggleBalances} onAdd={() => setAccountModal("new")} onEdit={setAccountModal} onAdjust={setBalanceAccount} />}
      {view === "reports" && <FinanceReports now={experience.now} accounts={accounts} categories={allCategories} allocations={budgetAllocations} transactions={transactions} snapshots={snapshots} reviews={reviews} onSaveSnapshot={async () => { const id = await saveManualNetWorthSnapshot(accounts, transactions, experience.now); experience.playFeedback("finance-snapshot"); undo.show({ message: "Net worth snapshot saved", undo: () => softDeleteNetWorthSnapshot(id) }); }} onDeleteSnapshot={async (snapshot: FinanceNetWorthSnapshot) => { await softDeleteNetWorthSnapshot(snapshot.id!); experience.playFeedback("task-dismissed"); undo.show({ message: "Snapshot removed", undo: () => restoreNetWorthSnapshot(snapshot.id!) }); }} />}
    </main>
    {accountModal && <FinanceAccountModal account={accountModal === "new" ? null : accountModal} onClose={() => setAccountModal(null)} onSave={saveAccount} onDelete={accountModal !== "new" && accountModal.id ? async () => { await softDeleteFinanceAccount(accountModal.id!); experience.playFeedback("task-dismissed"); undo.show({ message: `${accountModal.name} removed`, undo: () => restoreFinanceAccount(accountModal.id!) }); } : undefined} />}
    {balanceAccount?.id && <FinanceBalanceModal account={balanceAccount} currentBalance={getAccountBalance(balanceAccount, transactions)} todayKey={todayKey} onClose={() => setBalanceAccount(null)} onSave={async (targetBalance, date, notes) => { await reopenForChange([date.slice(0, 7)]); const result = await setFinanceAccountBalance(balanceAccount.id!, targetBalance, date, notes); experience.playFeedback("finance-snapshot"); undo.show({ message: `${balanceAccount.name} balance adjusted`, undo: () => softDeleteFinanceTransaction(result.id) }); }} />}
    {categoryManagerOpen && <FinanceCategoryManager categories={allCategories} onClose={() => setCategoryManagerOpen(false)} onAddCategory={async (name, flowType) => { await createFinanceCategory(name, flowType); experience.playFeedback("task-added"); }} onRenameCategory={renameFinanceCategory} onMoveCategory={moveFinanceCategory} onArchiveCategory={archiveFinanceCategory} onRestoreCategory={restoreFinanceCategory} />}
    {importOpen && <FinanceImportModal accounts={accounts} categories={categories} onClose={() => setImportOpen(false)} onImport={async (preview: FinanceCsvPreview, options: FinanceImportOptions) => { const result = await importFinanceCsv(preview, categories, options); experience.playFeedback("finance-income"); undo.show({ message: `${result.importedCount} transactions imported`, undo: () => revertFinanceImport(result.batchId) }); }} />}
    {recurringOpen && <FinanceRecurringModal accounts={accounts} categories={categories} items={recurring} todayKey={todayKey} onClose={() => setRecurringOpen(false)} onCreate={async (input: FinanceRecurringInput) => { await createFinanceRecurring(input); experience.playFeedback("task-added"); }} onUpdate={async (id, input) => { await updateFinanceRecurring(id, input); experience.playFeedback("task-updated"); }} onToggle={async (id, active) => { await setFinanceRecurringActive(id, active); experience.playFeedback(active ? "task-restored" : "task-dismissed"); }} onDelete={async (id) => { await softDeleteFinanceRecurring(id); experience.playFeedback("task-dismissed"); }} onConfirm={async (id) => { const item = recurring.find((entry) => entry.id === id); if (item) await reopenForChange([item.nextDate.slice(0, 7)]); await confirmFinanceRecurring(id); experience.playFeedback(item?.type === "income" ? "finance-income" : "finance-transaction"); }} onSkip={async (id) => { await skipFinanceRecurring(id); experience.playFeedback("task-dismissed"); }} />}
    {closingMonth && <FinanceMonthlyCloseModal month={closingMonth} allocations={budgetAllocations} categories={categories} transactions={transactions} onClose={() => setClosingMonth(null)} onConfirm={async (rollovers, reflections) => { await closeFinanceMonth({ month: closingMonth, accounts, transactions, categories, budgetMonths, allocations: budgetAllocations, rollovers, reflections }); experience.playFeedback("finance-snapshot"); undo.show({ message: `${closingMonth} closed`, undo: () => reopenFinanceMonth(closingMonth) }); }} />}
    <ActivityUndoToast notice={undo.notice} onDismiss={undo.dismiss} onUndo={undo.undo} />
  </div>;
}
