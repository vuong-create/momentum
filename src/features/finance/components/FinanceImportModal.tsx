import { useEffect, useMemo, useState, type ChangeEvent } from "react";

import type { FinanceAccount, FinanceCategory, FinanceAccountType } from "../../../database/db";
import { financeAccountTypes, financeFlowLabels, financeFlowOrder } from "../financeCatalog";
import { inferAccountType, previewFinanceCsv, type FinanceCsvPreview, type FinanceImportOptions } from "../services/financeImportService";

interface Props {
  accounts: FinanceAccount[];
  categories: FinanceCategory[];
  onClose: () => void;
  onImport: (preview: FinanceCsvPreview, options: FinanceImportOptions) => Promise<void>;
}

function mappingValue(account: FinanceAccount | undefined, sourceName: string) { return account?.id ? `existing:${account.id}` : `new:${inferAccountType(sourceName)}`; }

export default function FinanceImportModal({ accounts, categories, onClose, onImport }: Props) {
  const [source, setSource] = useState<{ text: string; fileName: string } | null>(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [preview, setPreview] = useState<FinanceCsvPreview | null>(null);
  const [accountMappings, setAccountMappings] = useState<Record<string, string>>({});
  const [categoryMappings, setCategoryMappings] = useState<Record<string, string>>({});
  const [rowOverrides, setRowOverrides] = useState<Record<number, string>>({});
  const [savingsAccount, setSavingsAccount] = useState("new");
  const [reviewOpen, setReviewOpen] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const activeCategories = categories.filter((item) => !item.deletedAt);
  const reviewRows = preview?.rows.filter((row) => row.needsReview) ?? [];

  useEffect(() => { document.body.classList.add("modal-open"); return () => document.body.classList.remove("modal-open"); }, []);

  const categoryGroups = useMemo(() => financeFlowOrder.map((flow) => ({ flow, categories: activeCategories.filter((item) => item.flowType === flow) })), [activeCategories]);

  function loadPreview(text: string, fileName: string, nextYear?: number) {
    const parsed = previewFinanceCsv(text, fileName, nextYear); setPreview(parsed); setYear(parsed.year); setError("");
    setAccountMappings(Object.fromEntries(parsed.accounts.map((sourceName) => [sourceName, mappingValue(accounts.find((account) => !account.deletedAt && account.name.toLocaleLowerCase() === sourceName.toLocaleLowerCase()), sourceName)])));
    const grouped = new Map<string, typeof parsed.rows>(); parsed.rows.forEach((row) => grouped.set(row.sourceCategory, [...(grouped.get(row.sourceCategory) ?? []), row]));
    const nextCategories: Record<string, string> = {}; const nextOverrides: Record<number, string> = {};
    grouped.forEach((rows, sourceCategory) => { const base = rows[0].suggestedCategory; nextCategories[sourceCategory] = base; rows.forEach((row) => { if (row.suggestedCategory !== base || row.needsReview) nextOverrides[row.sourceRow] = row.suggestedCategory; }); });
    setCategoryMappings(nextCategories); setRowOverrides(nextOverrides);
    const existingSavings = accounts.find((account) => !account.deletedAt && account.type === "savings"); setSavingsAccount(existingSavings?.id ? String(existingSavings.id) : "new");
  }

  async function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return;
    try { const text = await file.text(); setSource({ text, fileName: file.name }); loadPreview(text, file.name); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not read this CSV."); }
  }

  function changeYear(value: number) { setYear(value); if (source && value >= 1900 && value <= 2200) loadPreview(source.text, source.fileName, value); }
  function mapCategory(sourceCategory: string, target: string) {
    setCategoryMappings((current) => ({ ...current, [sourceCategory]: target }));
    setRowOverrides((current) => { const next = { ...current }; preview?.rows.filter((row) => row.sourceCategory === sourceCategory).forEach((row) => delete next[row.sourceRow]); return next; });
  }

  async function commit() {
    if (!preview) return; setSaving(true); setError("");
    try {
      const mappings = Object.fromEntries(Object.entries(accountMappings).map(([sourceName, value]) => {
        const [kind, identifier] = value.split(":"); return [sourceName, kind === "existing" ? { accountId: Number(identifier) } : { createType: identifier as FinanceAccountType }];
      }));
      await onImport(preview, { accountMappings: mappings, categoryMappings, rowCategoryOverrides: rowOverrides, savingsAccountId: savingsAccount === "new" ? undefined : Number(savingsAccount), createSavingsAccount: savingsAccount === "new" });
      onClose();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not import this CSV."); }
    finally { setSaving(false); }
  }

  return <div className="finance-modal-layer finance-import-layer" role="dialog" aria-modal="true" aria-label="Import transactions">
    <button className="finance-modal-backdrop" type="button" aria-label="Close" onClick={onClose} />
    <section className="finance-modal finance-import-modal">
      <header><div><span className="text-label">Private · Local · Reversible</span><h2>Import transaction history</h2><p>Preview every mapping before Momentum changes your ledger.</p></div><button type="button" onClick={onClose}>×</button></header>
      {!preview ? <div className="finance-import-drop"><input id="finance-csv-file" type="file" accept=".csv,text/csv" onChange={chooseFile} /><label htmlFor="finance-csv-file"><span>⇧</span><strong>Choose a CSV</strong><small>The file is processed only in this browser.</small></label>{error && <p className="finance-form-error">{error}</p>}</div> : <div className="finance-import-body">
        <section className="finance-import-summary"><div><span>Ready</span><strong>{preview.rows.length}</strong><small>valid transactions</small></div><div><span>Review</span><strong>{reviewRows.length}</strong><small>suggested decisions</small></div><div><span>Skipped</span><strong>{preview.issues.length}</strong><small>invalid source rows</small></div><label><span>Import year</span><input type="number" min="1900" max="2200" value={year} onChange={(event) => changeYear(Number(event.target.value))} /></label></section>

        <section className="finance-import-section"><header><div><span className="text-label">01</span><h3>Match accounts</h3></div><small>Existing accounts are reused</small></header><div className="finance-import-mapping-grid">{preview.accounts.map((sourceName) => <label key={sourceName}><span>{sourceName}</span><select value={accountMappings[sourceName]} onChange={(event) => setAccountMappings((current) => ({ ...current, [sourceName]: event.target.value }))}>{accounts.filter((item) => !item.deletedAt).map((account) => <option key={account.id} value={`existing:${account.id}`}>Use {account.name}</option>)}{financeAccountTypes.map((type) => <option key={type.value} value={`new:${type.value}`}>Create as {type.label}</option>)}</select></label>)}</div>{preview.rows.some((row) => row.type === "transfer") && <label className="finance-import-savings"><span>HYSA destination</span><select value={savingsAccount} onChange={(event) => setSavingsAccount(event.target.value)}><option value="new">Create HYSA savings account</option>{accounts.filter((item) => !item.deletedAt).map((account) => <option key={account.id} value={account.id}>Use {account.name}</option>)}</select></label>}</section>

        <section className="finance-import-section"><header><div><span className="text-label">02</span><h3>Map legacy categories</h3></div><small>Suggestions use merchant and note context</small></header><div className="finance-import-mapping-grid">{preview.sourceCategories.map((sourceCategory) => <label key={sourceCategory}><span>{sourceCategory}</span><select value={categoryMappings[sourceCategory]} onChange={(event) => mapCategory(sourceCategory, event.target.value)}>{categoryGroups.map((group) => <optgroup key={group.flow} label={financeFlowLabels[group.flow]}>{group.categories.map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}</optgroup>)}</select></label>)}</div></section>

        <section className="finance-import-section finance-import-review"><button type="button" onClick={() => setReviewOpen((open) => !open)}><div><span className="text-label">03</span><h3>Review suggested repairs</h3></div><span>{reviewRows.length} rows {reviewOpen ? "−" : "+"}</span></button>{reviewOpen && <div>{reviewRows.map((row) => <article key={row.sourceRow}><div><span>{new Date(`${row.date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span><strong>{row.merchant}</strong><small>{row.notes || `Source row ${row.sourceRow}`} · {row.sourceCategory}</small></div><select aria-label={`Category for ${row.merchant}`} value={rowOverrides[row.sourceRow] ?? categoryMappings[row.sourceCategory]} onChange={(event) => setRowOverrides((current) => ({ ...current, [row.sourceRow]: event.target.value }))}>{categoryGroups.map((group) => <optgroup key={group.flow} label={financeFlowLabels[group.flow]}>{group.categories.map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}</optgroup>)}</select><b>${row.amount.toFixed(2)}</b></article>)}</div>}</section>

        {preview.issues.length > 0 && <section className="finance-import-issues"><strong>{preview.issues.length} source row{preview.issues.length === 1 ? "" : "s"} will be skipped</strong>{preview.issues.map((issue) => <span key={issue.sourceRow}>Row {issue.sourceRow}: {issue.message}</span>)}</section>}
        {error && <p className="finance-form-error">{error}</p>}
      </div>}
      <footer>{preview ? <><button type="button" onClick={() => { setPreview(null); setSource(null); }}>Choose another file</button><span /><button type="button" onClick={onClose}>Cancel</button><button type="button" disabled={saving} onClick={commit}>{saving ? "Importing…" : `Import ${preview.rows.length} transactions`}</button></> : <><span /><button type="button" onClick={onClose}>Cancel</button></>}</footer>
    </section>
  </div>;
}
