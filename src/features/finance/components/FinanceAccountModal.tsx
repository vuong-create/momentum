import { useEffect, useState, type FormEvent } from "react";

import type { FinanceAccount, FinanceAccountType } from "../../../database/db";
import { financeAccountTypes } from "../financeCatalog";
import type { FinanceAccountInput } from "../services/financeService";

interface Props {
  account?: FinanceAccount | null;
  onClose: () => void;
  onSave: (input: FinanceAccountInput) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export default function FinanceAccountModal({ account, onClose, onSave, onDelete }: Props) {
  const [name, setName] = useState(account?.name ?? "");
  const [type, setType] = useState<FinanceAccountType>(account?.type ?? "checking");
  const [openingBalance, setOpeningBalance] = useState(String(account?.openingBalance ?? 0));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { document.body.classList.add("modal-open"); return () => document.body.classList.remove("modal-open"); }, []);

  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError("");
    try { await onSave({ name, type, openingBalance: Number(openingBalance) }); onClose(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save account."); }
    finally { setSaving(false); }
  }

  return <div className="finance-modal-layer" role="dialog" aria-modal="true" aria-label={account ? "Edit account" : "Add account"}>
    <button className="finance-modal-backdrop" type="button" aria-label="Close" onClick={onClose} />
    <form className="finance-modal finance-account-modal" onSubmit={submit}>
      <header><div><span className="text-label">Financial baseline</span><h2>{account ? "Edit account" : "Add an account"}</h2></div><button type="button" onClick={onClose}>×</button></header>
      <div className="finance-modal-fields">
        <label><span>Account name</span><input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Checking" /></label>
        <label><span>Account type</span><select value={type} onChange={(event) => setType(event.target.value as FinanceAccountType)}>{financeAccountTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        <label className="finance-field-wide"><span>Opening balance</span><div className="finance-money-input"><i>$</i><input inputMode="decimal" value={openingBalance} onChange={(event) => setOpeningBalance(event.target.value)} /></div><small>{type === "credit" ? "Enter debt as a negative amount, such as -620." : "The balance before your first Momentum transaction."}</small></label>
        {error && <p className="finance-form-error">{error}</p>}
      </div>
      <footer>{account && onDelete ? <button className="is-danger" type="button" onClick={async () => { try { await onDelete(); onClose(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not remove account."); } }}>Remove</button> : <span />}<button type="button" onClick={onClose}>Cancel</button><button type="submit" disabled={saving}>{saving ? "Saving…" : "Save account"}</button></footer>
    </form>
  </div>;
}
