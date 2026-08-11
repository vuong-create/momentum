import { useState } from "react";

import type { FinanceBudgetAllocation, FinanceBudgetMonth, FinanceCategory, FinanceCategoryFlow, FinanceMonthlyReview, FinanceTransaction } from "../../../database/db";
import { financeFlowLabels, financeFlowOrder } from "../financeCatalog";
import { formatMoney, getMonthSummary } from "../services/financeCalculations";
import { calculateBudgetRows, getBudgetSummary } from "../services/financeBudgetService";

interface Props {
  now: Date; categories: FinanceCategory[]; months: FinanceBudgetMonth[]; allocations: FinanceBudgetAllocation[]; transactions: FinanceTransaction[]; reviews: FinanceMonthlyReview[];
  onSetAllocation: (month: string, categoryId: number, amount: number) => Promise<void>; onCopyPrevious: (month: string) => Promise<number>; onManageCategories: () => void; onCloseMonth: (month: string) => void; onReopenMonth: (month: string) => Promise<void>;
}
function monthKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`; }
function shiftMonth(month: string, offset: number) { const [year, number] = month.split("-").map(Number); const date = new Date(year, number - 1 + offset, 1); return monthKey(date); }
function monthLabel(month: string) { const [year, number] = month.split("-").map(Number); return new Date(year, number - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" }); }
function actualLabel(flow: FinanceCategoryFlow) { return flow === "expense" ? "spent" : flow === "investment" ? "contributed" : flow === "income" ? "received" : "transferred"; }

function AllocationControl({ value, max, onCommit }: { value: number; max: number; onCommit: (amount: number) => Promise<void> }) {
  const [draft, setDraft] = useState(value);
  const [text, setText] = useState(value ? String(value) : "");
  function parseAmount(input: string) { const amount = Number(input.replace(/[$,\s]/g, "")); return Number.isFinite(amount) ? Math.max(0, Math.round(amount * 100) / 100) : value; }
  async function commit(amount: number) { setDraft(amount); setText(amount ? amount.toFixed(amount % 1 ? 2 : 0) : ""); if (amount !== value) await onCommit(amount); }
  return <div className="finance-allocation-control"><input aria-label="Budget slider" type="range" min="0" max={Math.max(max, draft)} step="25" value={draft} onChange={(event) => { const amount = Number(event.target.value); setDraft(amount); setText(String(amount)); }} onPointerUp={(event) => void commit(Number(event.currentTarget.value))} onKeyUp={(event) => { if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) void commit(Number(event.currentTarget.value)); }} /><label><span>$</span><input aria-label="Exact budget amount" inputMode="decimal" value={text} placeholder="0" onFocus={(event) => event.currentTarget.select()} onChange={(event) => setText(event.target.value)} onBlur={(event) => void commit(parseAmount(event.currentTarget.value))} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); if (event.key === "Escape") { setDraft(value); setText(value ? String(value) : ""); event.currentTarget.blur(); } }} /></label></div>;
}

export default function FinanceBudget(props: Props) {
  const [month, setMonth] = useState(monthKey(props.now)); const [notice, setNotice] = useState(""); const [error, setError] = useState("");
  const budgetMonth = props.months.find((item) => item.month === month); const rows = calculateBudgetRows(month, props.allocations, props.categories, props.transactions);
  const review = props.reviews.find((item) => item.month === month && item.closedAt); const isFuture = month > monthKey(props.now);
  const actual = getMonthSummary(props.transactions, month, props.categories); const summary = getBudgetSummary(budgetMonth, rows, actual.income);
  async function copyPrevious() { setError(""); setNotice(""); try { const count = await props.onCopyPrevious(month); setNotice(`${count} ${count === 1 ? "plan" : "plans"} copied.`); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not copy the previous budget."); } }
  return <section className="finance-budget-view">
    <header className="finance-section-heading"><div><span className="text-label">Monthly intention</span><h2>Budget</h2><p>Plan expenses, investments, income, and long-term saving in one calm view.</p></div><div className="finance-budget-month"><button type="button" onClick={() => setMonth(shiftMonth(month, -1))}>←</button><strong>{monthLabel(month)}</strong><button type="button" onClick={() => setMonth(shiftMonth(month, 1))}>→</button></div></header>
    <section className="finance-budget-summary finance-panel"><article><span>Planned income</span><strong>{formatMoney(summary.expectedIncome)}</strong><small>NEO + SJVBC</small></article><article><span>Received</span><strong className="is-positive">{formatMoney(actual.income)}</strong><small>From transactions</small></article><article><span>Planned outflow</span><strong>{formatMoney(summary.budgeted)}</strong><small>Spending, investing, saving</small></article><article><span>Actual outflow</span><strong>{formatMoney(summary.spent)}</strong><small>All planned destinations</small></article><article><span>Unassigned</span><strong className={summary.unassigned >= 0 ? "is-positive" : "is-negative"}>{formatMoney(summary.unassigned)}</strong><small>{summary.unassigned >= 0 ? "Income still available" : "Plan exceeds income"}</small></article></section>
    <div className="finance-budget-actions"><button type="button" onClick={copyPrevious}>Copy last month</button><button type="button" onClick={props.onManageCategories}>Manage categories</button>{review ? <button className="finance-reopen-month" type="button" onClick={async () => { setError(""); try { await props.onReopenMonth(month); setNotice(`${monthLabel(month)} reopened.`); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not reopen this month."); } }}>✓ Closed · Reopen</button> : <button className="finance-close-month" type="button" disabled={isFuture} onClick={() => props.onCloseMonth(month)}>{isFuture ? "Future month" : "Close month →"}</button>}{notice && <small className="is-positive">{notice}</small>}{error && <small className="is-negative">{error}</small>}</div>
    <div className="finance-budget-flows">{financeFlowOrder.map((flow) => {
      const flowRows = rows.filter((row) => row.category.flowType === flow); const planned = flowRows.reduce((total, row) => total + row.available, 0); const realized = flowRows.reduce((total, row) => total + row.actual, 0);
      return <section className={`finance-budget-flow finance-panel flow-${flow}`} key={flow}><header><div><span className="finance-flow-mark">{flow === "expense" ? "−" : flow === "income" ? "+" : flow === "investment" ? "↗" : "◇"}</span><div><h3>{financeFlowLabels[flow]}</h3><small>{formatMoney(realized)} {actualLabel(flow)} of {formatMoney(planned)} planned</small></div></div><strong className={planned - realized < 0 && flow !== "income" ? "is-negative" : ""}>{formatMoney(planned - realized)}</strong></header><div>{flowRows.map((row) => {
        const max = Math.max(500, Math.ceil(Math.max(summary.expectedIncome, row.available * 2, row.actual * 2) / 100) * 100); const over = row.actual > row.available && row.actual > 0;
        return <article key={row.category.id} className={over ? "is-over" : ""}><div><strong>{row.category.name}</strong><small>{row.actual ? `${formatMoney(row.actual)} ${actualLabel(flow)}` : `Nothing ${actualLabel(flow)}`}{row.rolloverAmount > 0 ? ` · +${formatMoney(row.rolloverAmount)} rollover` : ""}</small></div><div className="finance-budget-progress"><i><span style={{ width: `${Math.min(100, row.percentage)}%` }} /></i><small>{row.available ? `${Math.round(row.percentage)}%` : row.actual ? "Unplanned" : "Not set"}</small></div><AllocationControl key={`${row.category.id}:${row.baseAmount}`} value={row.baseAmount} max={max} onCommit={(amount) => props.onSetAllocation(month, row.category.id!, amount)} /><b className={over ? "is-negative" : ""}>{row.available ? over ? `${formatMoney(row.actual - row.available)} over` : `${formatMoney(row.remaining)} left` : "—"}</b></article>;
      })}</div></section>;
    })}</div>
  </section>;
}
