import { useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";

import type { FinanceAccount, FinanceCategory, FinanceCategoryFlow, FinanceTransaction, FinanceTransactionType } from "../../../database/db";
import { financeTransactionTypes } from "../financeCatalog";
import { merchantSuggestions, type FinanceTransactionInput } from "../services/financeService";
import FinanceCategoryCombobox from "./FinanceCategoryCombobox";

interface Props {
  accounts: FinanceAccount[];
  transactions: FinanceTransaction[];
  categories: FinanceCategory[];
  editing?: FinanceTransaction | null;
  todayKey: string;
  onSave: (input: FinanceTransactionInput) => Promise<void>;
  onCancelEdit?: () => void;
}

function flowFor(type: Exclude<FinanceTransactionType, "adjustment">): FinanceCategoryFlow { return type === "transfer" ? "saving" : type; }

export default function TransactionComposer({ accounts, transactions, categories, editing, todayKey, onSave, onCancelEdit }: Props) {
  const initialType = editing?.type === "adjustment" ? "income" : editing?.type ?? "expense";
  const [type, setType] = useState<Exclude<FinanceTransactionType, "adjustment">>(initialType);
  const [amount, setAmount] = useState(editing ? String(editing.amount) : "");
  const [merchant, setMerchant] = useState(editing?.merchant ?? "");
  const [accountId, setAccountId] = useState(String(editing?.accountId ?? ""));
  const [fromAccountId, setFromAccountId] = useState(String(editing?.fromAccountId ?? (editing?.type === "investment" ? editing.accountId : undefined) ?? (!editing ? accounts.find((item) => !["investment", "retirement", "credit"].includes(item.type))?.id : undefined) ?? ""));
  const [toAccountId, setToAccountId] = useState(String(editing?.toAccountId ?? (!editing ? accounts.find((item) => item.type === "investment" || item.type === "retirement")?.id : undefined) ?? ""));
  const [categoryId, setCategoryId] = useState(String(editing?.categoryId ?? ""));
  const [date, setDate] = useState(editing?.date ?? todayKey);
  const [notes, setNotes] = useState(editing?.notes ?? "");
  const [holding, setHolding] = useState(editing?.investmentHolding ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const amountRef = useRef<HTMLInputElement>(null);
  const memory = useMemo(() => merchantSuggestions(transactions), [transactions]);
  const typeCategories = categories.filter((item) => item.flowType === flowFor(type));
  const preferredName = type === "expense" ? "Groceries" : type === "income" ? "NEO" : type === "investment" ? "Vanguard Brokerage" : "HYSA";
  const fallbackCategory = typeCategories.find((item) => item.name === preferredName) ?? typeCategories[0];
  const selectedCategoryId = Number(categoryId) || fallbackCategory?.id;
  const selectedCategory = categories.find((item) => item.id === selectedCategoryId);
  const contributionSources = accounts.filter((item) => !["investment", "retirement", "credit"].includes(item.type));
  const investmentAccounts = accounts.filter((item) => item.type === "investment" || item.type === "retirement");

  function reset() {
    setAmount(""); setMerchant(""); setDate(todayKey); setNotes(""); setHolding(""); setError("");
  }

  function rememberMerchant(value: string) {
    setMerchant(value);
    const remembered = memory.find((item) => item.merchant.toLocaleLowerCase() === value.toLocaleLowerCase());
    if (!remembered) return;
    if (remembered.accountId) setAccountId(String(remembered.accountId));
    if (remembered.fromAccountId) setFromAccountId(String(remembered.fromAccountId));
    if (remembered.toAccountId) setToAccountId(String(remembered.toAccountId));
    if (remembered.categoryId) setCategoryId(String(remembered.categoryId));
  }

  function completeMerchantOnTab(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Tab" || event.shiftKey || !merchant.trim()) return;
    const query = merchant.trim().toLocaleLowerCase();
    const suggestion = memory.find((item) => item.merchant.toLocaleLowerCase().startsWith(query));
    if (!suggestion || suggestion.merchant.toLocaleLowerCase() === query) return;
    event.preventDefault();
    rememberMerchant(suggestion.merchant);
    requestAnimationFrame(() => amountRef.current?.focus());
  }

  function chooseType(next: Exclude<FinanceTransactionType, "adjustment">) {
    setType(next);
    const nextPreferred = next === "expense" ? "Groceries" : next === "income" ? "NEO" : next === "investment" ? "Vanguard Brokerage" : "HYSA";
    const nextCategory = categories.find((item) => item.flowType === flowFor(next) && item.name === nextPreferred) ?? categories.find((item) => item.flowType === flowFor(next));
    setCategoryId(String(nextCategory?.id ?? ""));
    if (next === "investment") {
      setFromAccountId((current) => contributionSources.some((item) => item.id === Number(current)) ? current : String(contributionSources[0]?.id ?? ""));
      setToAccountId((current) => investmentAccounts.some((item) => item.id === Number(current)) ? current : String(investmentAccounts[0]?.id ?? ""));
    }
  }

  function submitFromKeyboard(event: KeyboardEvent<HTMLFormElement>) {
    if (event.key !== "Enter" || event.shiftKey || saving) return;
    const target = event.target as HTMLElement;
    if (target instanceof HTMLButtonElement || target instanceof HTMLTextAreaElement || (target.getAttribute("role") === "combobox" && target.getAttribute("aria-expanded") === "true")) return;
    event.preventDefault();
    event.currentTarget.requestSubmit();
  }

  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError("");
    try {
      await onSave({ date, amount: Number(amount), type, merchant, accountId: type === "transfer" || type === "investment" ? undefined : Number(accountId || accounts[0]?.id) || undefined, fromAccountId: Number(fromAccountId) || undefined, toAccountId: Number(toAccountId) || undefined, categoryId: selectedCategoryId, category: selectedCategory?.name, notes, investmentHolding: holding });
      reset();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save transaction."); }
    finally { setSaving(false); }
  }

  return <form className={`finance-transaction-composer finance-panel ${editing ? "is-editing" : ""}`} onSubmit={submit} onKeyDown={submitFromKeyboard}>
    <header><div><span className="text-label">{editing ? "Editing transaction" : "Quick entry"}</span><h2>{editing ? editing.merchant : "Record money in seconds."}</h2></div>{editing && <button type="button" onClick={() => { reset(); onCancelEdit?.(); }}>Cancel edit</button>}</header>
    <div className="finance-type-switch">{financeTransactionTypes.map((item) => <button key={item.value} type="button" className={type === item.value ? "is-selected" : ""} onClick={() => chooseType(item.value)}>{item.label}</button>)}</div>
    <div className={`finance-composer-entry ${type === "transfer" ? "is-transfer" : type === "investment" ? "is-investment" : ""}`}>
      <label><span>Date</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
      <label className="finance-merchant-field"><span>{type === "transfer" ? "Description" : type === "income" ? "Source" : "Merchant"}</span><input autoFocus={!editing} list="finance-merchants" value={merchant} onChange={(event) => rememberMerchant(event.target.value)} onKeyDown={completeMerchantOnTab} placeholder={type === "income" ? "Paycheck" : type === "transfer" ? "Move to savings" : "Aldi"} /><datalist id="finance-merchants">{memory.map((item) => <option key={item.merchant} value={item.merchant} />)}</datalist><small>Tab accepts the first match</small></label>
      <label className="finance-amount-field"><span>Amount</span><div><i>$</i><input ref={amountRef} inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" /></div></label>
      {type === "transfer" ? <><label><span>From</span><select value={fromAccountId} onChange={(event) => setFromAccountId(event.target.value)}><option value="">Choose</option>{accounts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label><span>To</span><select value={toAccountId} onChange={(event) => { setToAccountId(event.target.value); const account = accounts.find((item) => item.id === Number(event.target.value)); if (account?.name.toLocaleLowerCase().includes("hysa")) { const hysa = categories.find((item) => item.flowType === "saving" && item.name === "HYSA"); setCategoryId(String(hysa?.id ?? "")); } }}><option value="">Choose</option>{accounts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></> : type === "investment" ? <><label><span>From</span><select value={fromAccountId} onChange={(event) => setFromAccountId(event.target.value)}><option value="">Choose source</option>{contributionSources.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label><span>Investment account</span><select value={toAccountId} onChange={(event) => setToAccountId(event.target.value)}><option value="">Choose destination</option>{investmentAccounts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></> : <label><span>Account</span><select value={accountId || String(accounts[0]?.id ?? "")} onChange={(event) => setAccountId(event.target.value)}><option value="">Choose</option>{accounts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
      <label className="finance-entry-notes"><span>Notes</span><input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional context" /></label>
      <button className="finance-save-transaction" type="submit" aria-keyshortcuts="Enter" disabled={saving || accounts.length === 0}>{saving ? "Saving…" : editing ? "Update" : "Add"}<span>↵</span></button>
    </div>
    <div className="finance-composer-supporting">
      <FinanceCategoryCombobox categories={typeCategories} selectedId={selectedCategoryId} onChange={(id) => setCategoryId(String(id))} />
      {type === "investment" && <label><span>Holding</span><input value={holding} onChange={(event) => setHolding(event.target.value)} placeholder="VOO (optional)" /></label>}
    </div>
    {accounts.length === 0 && <p className="finance-form-error">Add an account before recording a transaction.</p>}
    {type === "investment" && investmentAccounts.length === 0 && <p className="finance-form-error">Add an investment or retirement account before recording a contribution.</p>}
    {error && <p className="finance-form-error">{error}</p>}
  </form>;
}
