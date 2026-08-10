import { useEffect, useState, type FormEvent } from "react";

import type { FinanceAccount } from "../../../database/db";
import { formatMoney } from "../services/financeCalculations";

interface Props {
  account: FinanceAccount;
  currentBalance: number;
  todayKey: string;
  onClose: () => void;
  onSave: (targetBalance: number, date: string, notes?: string) => Promise<void>;
}

export default function FinanceBalanceModal({ account, currentBalance, todayKey, onClose, onSave }: Props) {
  const [target, setTarget] = useState(String(currentBalance));
  const [date, setDate] = useState(todayKey);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const parsed = Number(target);
  const delta = Number.isFinite(parsed) ? parsed - currentBalance : 0;

  useEffect(() => { document.body.classList.add("modal-open"); return () => document.body.classList.remove("modal-open"); }, []);

  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError("");
    try { await onSave(parsed, date, notes); onClose(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not adjust this balance."); }
    finally { setSaving(false); }
  }

  return <div className="finance-modal-layer" role="dialog" aria-modal="true" aria-label={`Adjust ${account.name} balance`}>
    <button className="finance-modal-backdrop" type="button" aria-label="Close" onClick={onClose} />
    <form className="finance-modal finance-balance-modal" onSubmit={submit}>
      <header><div><span className="text-label">Reconcile account</span><h2>Set current balance</h2><p>{account.name} currently shows {formatMoney(currentBalance)}.</p></div><button type="button" onClick={onClose}>×</button></header>
      <div className="finance-balance-editor">
        <label><span>Current real-world balance</span><div className="finance-money-input"><i>$</i><input autoFocus inputMode="decimal" value={target} onFocus={(event) => event.currentTarget.select()} onChange={(event) => setTarget(event.target.value)} /></div></label>
        <div className={`finance-balance-delta ${delta > 0 ? "is-increase" : delta < 0 ? "is-decrease" : ""}`}><span>{delta > 0 ? "Increase by" : delta < 0 ? "Decrease by" : "No adjustment"}</span><strong>{formatMoney(Math.abs(delta))}</strong><small>Recorded as a balance correction, never as income or spending.</small></div>
        <label><span>Adjustment date</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
        <label><span>Note</span><input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional reason" /></label>
        {error && <p className="finance-form-error">{error}</p>}
      </div>
      <footer><button type="button" onClick={onClose}>Cancel</button><button type="submit" disabled={saving || !Number.isFinite(parsed) || Math.abs(delta) < 0.01}>{saving ? "Saving…" : "Adjust balance"}</button></footer>
    </form>
  </div>;
}
