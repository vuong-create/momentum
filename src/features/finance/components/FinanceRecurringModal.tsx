import { useEffect, useMemo, useState, type FormEvent } from "react";

import type { FinanceAccount, FinanceCategory, FinanceRecurringTransaction, FinanceTransactionType } from "../../../database/db";
import { formatMoney } from "../services/financeCalculations";
import type { FinanceRecurringInput } from "../services/financeRecurringService";

type RecurringType = Exclude<FinanceTransactionType, "adjustment">;
interface Props {
  accounts: FinanceAccount[];
  categories: FinanceCategory[];
  items: FinanceRecurringTransaction[];
  todayKey: string;
  onClose: () => void;
  onCreate: (input: FinanceRecurringInput) => Promise<void>;
  onUpdate: (id: number, input: FinanceRecurringInput) => Promise<void>;
  onToggle: (id: number, active: boolean) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onConfirm: (id: number) => Promise<void>;
  onSkip: (id: number) => Promise<void>;
}

function emptyInput(todayKey: string): FinanceRecurringInput {
  return { type: "expense", merchant: "", amount: 0, frequency: "monthly", nextDate: todayKey };
}

export default function FinanceRecurringModal({ accounts, categories, items, todayKey, onClose, onCreate, onUpdate, onToggle, onDelete, onConfirm, onSkip }: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [input, setInput] = useState<FinanceRecurringInput>(() => emptyInput(todayKey));
  const [editorOpen, setEditorOpen] = useState(items.length === 0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const due = useMemo(() => items.filter((item) => item.active && item.nextDate <= todayKey && (!item.endDate || item.nextDate <= item.endDate)), [items, todayKey]);
  const upcoming = items.filter((item) => !due.includes(item));
  const expenseCategories = categories.filter((item) => !item.deletedAt && (input.type === "income" ? item.flowType === "income" : input.type === "investment" ? item.flowType === "investment" : item.flowType === "expense"));
  const liquidAccounts = accounts.filter((item) => !["investment", "retirement", "credit"].includes(item.type));
  const investmentAccounts = accounts.filter((item) => ["investment", "retirement"].includes(item.type));

  useEffect(() => { document.body.classList.add("modal-open"); return () => document.body.classList.remove("modal-open"); }, []);
  function patch<K extends keyof FinanceRecurringInput>(key: K, value: FinanceRecurringInput[K]) { setInput((current) => ({ ...current, [key]: value })); }
  function startNew() { setEditingId(null); setInput(emptyInput(todayKey)); setEditorOpen(true); setError(""); }
  function edit(item: FinanceRecurringTransaction) {
    setEditingId(item.id!);
    setInput({ type: item.type, merchant: item.merchant, amount: item.amount, accountId: item.accountId, fromAccountId: item.fromAccountId, toAccountId: item.toAccountId, categoryId: item.categoryId, category: item.category, notes: item.notes, investmentHolding: item.investmentHolding, frequency: item.frequency, nextDate: item.nextDate, endDate: item.endDate });
    setEditorOpen(true); setError("");
  }
  async function act(action: () => Promise<void>) { setBusy(true); setError(""); try { await action(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update this recurring item."); } finally { setBusy(false); } }
  async function submit(event: FormEvent) { event.preventDefault(); await act(async () => { if (editingId) await onUpdate(editingId, input); else await onCreate(input); setEditorOpen(false); setEditingId(null); }); }
  function accountSelect(label: string, value: number | undefined, choices: FinanceAccount[], key: "accountId" | "fromAccountId" | "toAccountId") {
    return <label><span>{label}</span><select value={value ?? ""} onChange={(event) => patch(key, Number(event.target.value) || undefined)}><option value="">Choose account</option>{choices.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label>;
  }
  function row(item: FinanceRecurringTransaction, isDue: boolean) {
    return <article key={item.id} className={`${isDue ? "is-due" : ""} ${!item.active ? "is-paused" : ""}`}><div><strong>{item.merchant}</strong><span>{formatMoney(item.amount)} · {item.frequency} · {item.nextDate}</span>{item.notes && <small>{item.notes}</small>}</div><menu>{isDue && <><button type="button" disabled={busy} className="is-confirm" onClick={() => act(() => onConfirm(item.id!))}>Add to ledger</button><button type="button" disabled={busy} onClick={() => act(() => onSkip(item.id!))}>Skip</button></>}<button type="button" onClick={() => edit(item)}>Edit</button><button type="button" onClick={() => act(() => onToggle(item.id!, !item.active))}>{item.active ? "Pause" : "Resume"}</button></menu></article>;
  }

  return <div className="finance-modal-layer" role="dialog" aria-modal="true" aria-labelledby="finance-recurring-title"><button className="finance-modal-backdrop" type="button" aria-label="Close" onClick={onClose} /><section className="finance-modal finance-recurring-modal"><header><div><span className="text-label">Review before posting</span><h2 id="finance-recurring-title">Recurring transactions</h2></div><button type="button" onClick={onClose}>×</button></header><div className="finance-recurring-body">
    <div className="finance-recurring-toolbar"><p>Momentum prepares each occurrence. Nothing enters your ledger until you confirm it.</p><button type="button" onClick={startNew}>＋ New recurring item</button></div>
    {error && <p className="finance-form-error">{error}</p>}
    {due.length > 0 && <section className="finance-recurring-group"><header><span>Ready for review</span><strong>{due.length}</strong></header>{due.map((item) => row(item, true))}</section>}
    <section className="finance-recurring-group"><header><span>Upcoming & paused</span><strong>{upcoming.length}</strong></header>{upcoming.length ? upcoming.map((item) => row(item, false)) : <p className="finance-recurring-empty">No upcoming items yet.</p>}</section>
    {editorOpen && <form className="finance-recurring-editor" onSubmit={submit}><header><strong>{editingId ? "Edit schedule" : "New recurring item"}</strong><button type="button" onClick={() => setEditorOpen(false)}>×</button></header><div className="finance-type-switch">{(["expense", "income", "transfer", "investment"] as RecurringType[]).map((type) => <button type="button" key={type} className={input.type === type ? "is-selected" : ""} onClick={() => setInput({ ...emptyInput(input.nextDate), type, frequency: input.frequency })}>{type}</button>)}</div><div className="finance-modal-fields">
      <label><span>{input.type === "transfer" ? "Label" : "Merchant"}</span><input autoFocus value={input.merchant} onChange={(event) => patch("merchant", event.target.value)} placeholder={input.type === "transfer" ? "Monthly transfer" : "Rent"} /></label>
      <label><span>Amount</span><div className="finance-money-input"><i>$</i><input inputMode="decimal" value={input.amount || ""} onChange={(event) => patch("amount", Number(event.target.value))} /></div></label>
      {(input.type === "expense" || input.type === "income") && accountSelect("Account", input.accountId, accounts, "accountId")}
      {(input.type === "transfer" || input.type === "investment") && accountSelect("From", input.fromAccountId, input.type === "investment" ? liquidAccounts : accounts, "fromAccountId")}
      {(input.type === "transfer" || input.type === "investment") && accountSelect("To", input.toAccountId, input.type === "investment" ? investmentAccounts : accounts, "toAccountId")}
      {input.type !== "transfer" && <label><span>Category</span><select value={input.categoryId ?? ""} onChange={(event) => patch("categoryId", Number(event.target.value) || undefined)}><option value="">No category</option>{expenseCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>}
      <label><span>Frequency</span><select value={input.frequency} onChange={(event) => patch("frequency", event.target.value as FinanceRecurringInput["frequency"])}><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select></label>
      <label><span>Next date</span><input type="date" value={input.nextDate} onChange={(event) => patch("nextDate", event.target.value)} /></label>
      <label><span>Optional end date</span><input type="date" min={input.nextDate} value={input.endDate ?? ""} onChange={(event) => patch("endDate", event.target.value || undefined)} /></label>
      <label className="finance-field-wide"><span>Notes</span><input value={input.notes ?? ""} onChange={(event) => patch("notes", event.target.value)} placeholder="Optional context" /></label>
    </div><footer>{editingId ? <button type="button" className="is-danger" onClick={() => act(async () => { await onDelete(editingId); setEditorOpen(false); })}>Remove</button> : <span />}<button type="button" onClick={() => setEditorOpen(false)}>Cancel</button><button type="submit" disabled={busy}>{busy ? "Saving…" : "Save schedule"}</button></footer></form>}
  </div></section></div>;
}
