import { useMemo, useState, type FormEvent } from "react";

import type { FinanceAccount, FinanceTransaction, FinanceTransactionType } from "../../../database/db";
import { financeCategories, financeTransactionTypes, subcategoriesFor } from "../financeCatalog";
import { merchantSuggestions, type FinanceTransactionInput } from "../services/financeService";

interface Props {
  accounts: FinanceAccount[];
  transactions: FinanceTransaction[];
  editing?: FinanceTransaction | null;
  todayKey: string;
  onSave: (input: FinanceTransactionInput) => Promise<void>;
  onCancelEdit?: () => void;
}

export default function TransactionComposer({ accounts, transactions, editing, todayKey, onSave, onCancelEdit }: Props) {
  const initialType = editing?.type === "adjustment" ? "income" : editing?.type ?? "expense";
  const [type, setType] = useState<Exclude<FinanceTransactionType, "adjustment">>(initialType);
  const [amount, setAmount] = useState(editing ? String(editing.amount) : "");
  const [merchant, setMerchant] = useState(editing?.merchant ?? "");
  const [accountId, setAccountId] = useState(String(editing?.accountId ?? ""));
  const [fromAccountId, setFromAccountId] = useState(String(editing?.fromAccountId ?? ""));
  const [toAccountId, setToAccountId] = useState(String(editing?.toAccountId ?? ""));
  const [category, setCategory] = useState(editing?.category ?? "Food");
  const [subcategory, setSubcategory] = useState(editing?.subcategory ?? "Groceries");
  const [date, setDate] = useState(editing?.date ?? todayKey);
  const [notes, setNotes] = useState(editing?.notes ?? "");
  const [holding, setHolding] = useState(editing?.investmentHolding ?? "");
  const [detailsOpen, setDetailsOpen] = useState(Boolean(editing));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const memory = useMemo(() => merchantSuggestions(transactions), [transactions]);

  function reset() {
    setAmount(""); setMerchant(""); setDate(todayKey); setNotes(""); setHolding(""); setError("");
    if (!editing) setDetailsOpen(false);
  }

  function rememberMerchant(value: string) {
    setMerchant(value);
    const remembered = memory.find((item) => item.merchant.toLocaleLowerCase() === value.toLocaleLowerCase());
    if (!remembered) return;
    if (remembered.accountId) setAccountId(String(remembered.accountId));
    if (remembered.category) { setCategory(remembered.category); setSubcategory(remembered.subcategory ?? subcategoriesFor(remembered.category)[0] ?? ""); }
  }

  function chooseType(next: Exclude<FinanceTransactionType, "adjustment">) {
    setType(next);
    if (next === "income") { setCategory("Income"); setSubcategory("Paycheck"); }
    if (next === "expense" && category === "Income") { setCategory("Food"); setSubcategory("Groceries"); }
  }

  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError("");
    try {
      await onSave({ date, amount: Number(amount), type, merchant, accountId: Number(accountId || accounts[0]?.id) || undefined, fromAccountId: Number(fromAccountId) || undefined, toAccountId: Number(toAccountId) || undefined, category, subcategory, notes, investmentHolding: holding });
      reset();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save transaction."); }
    finally { setSaving(false); }
  }

  const subcategories = subcategoriesFor(category);
  return <form className={`finance-transaction-composer finance-panel ${editing ? "is-editing" : ""}`} onSubmit={submit}>
    <header><div><span className="text-label">{editing ? "Editing transaction" : "Quick entry"}</span><h2>{editing ? editing.merchant : "Record money in seconds."}</h2></div>{editing && <button type="button" onClick={() => { reset(); onCancelEdit?.(); }}>Cancel edit</button>}</header>
    <div className="finance-type-switch">{financeTransactionTypes.map((item) => <button key={item.value} type="button" className={type === item.value ? "is-selected" : ""} onClick={() => chooseType(item.value)}>{item.label}</button>)}</div>
    <div className={`finance-composer-primary ${type === "transfer" ? "is-transfer" : ""}`}>
      <label className="finance-amount-field"><span>Amount</span><div><i>$</i><input autoFocus={!editing} inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" /></div></label>
      <label><span>{type === "transfer" ? "Description" : type === "income" ? "Source" : "Merchant"}</span><input list="finance-merchants" value={merchant} onChange={(event) => rememberMerchant(event.target.value)} placeholder={type === "income" ? "Paycheck" : type === "transfer" ? "Move to savings" : "Aldi"} /><datalist id="finance-merchants">{memory.map((item) => <option key={item.merchant} value={item.merchant} />)}</datalist></label>
      {type === "transfer" ? <><label><span>From</span><select value={fromAccountId} onChange={(event) => setFromAccountId(event.target.value)}><option value="">Choose</option>{accounts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label><span>To</span><select value={toAccountId} onChange={(event) => setToAccountId(event.target.value)}><option value="">Choose</option>{accounts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></> : <label><span>Account</span><select value={accountId || String(accounts[0]?.id ?? "")} onChange={(event) => setAccountId(event.target.value)}><option value="">Choose</option>{accounts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
      <button className="finance-save-transaction" type="submit" disabled={saving || accounts.length === 0}>{saving ? "Saving…" : editing ? "Update" : "Add"}<span>↵</span></button>
    </div>
    <div className="finance-composer-toggle"><button type="button" onClick={() => setDetailsOpen((open) => !open)}>{detailsOpen ? "Hide details" : "Category, date & details"}<span>{detailsOpen ? "−" : "+"}</span></button>{!detailsOpen && <small>{type === "transfer" ? `${accounts.find((item) => item.id === Number(fromAccountId))?.name ?? "From account"} → ${accounts.find((item) => item.id === Number(toAccountId))?.name ?? "To account"}` : type === "investment" ? `${holding || "Investment"} · ${accounts.find((item) => item.id === Number(accountId || accounts[0]?.id))?.name ?? "Choose account"}` : `${category} · ${subcategory}`} · {date === todayKey ? "Today" : date}</small>}</div>
    {detailsOpen && <div className="finance-composer-details">
      {(type === "expense" || type === "income") && <><label><span>Category</span><select value={category} onChange={(event) => { setCategory(event.target.value); setSubcategory(subcategoriesFor(event.target.value)[0] ?? ""); }}>{financeCategories.map((item) => <option key={item.name}>{item.name}</option>)}</select></label><label><span>Subcategory</span><select value={subcategory} onChange={(event) => setSubcategory(event.target.value)}>{subcategories.map((item) => <option key={item}>{item}</option>)}</select></label></>}
      {type === "investment" && <label><span>Holding</span><input value={holding} onChange={(event) => setHolding(event.target.value)} placeholder="VOO (optional)" /></label>}
      <label><span>Date</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
      <label className="finance-detail-notes"><span>Notes</span><input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional context" /></label>
    </div>}
    {accounts.length === 0 && <p className="finance-form-error">Add an account before recording a transaction.</p>}
    {error && <p className="finance-form-error">{error}</p>}
  </form>;
}
