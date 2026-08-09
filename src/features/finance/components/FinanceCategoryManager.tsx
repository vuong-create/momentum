import { useEffect, useState, type FormEvent } from "react";

import type { FinanceCategory, FinanceCategoryFlow } from "../../../database/db";
import { financeFlowLabels, financeFlowOrder } from "../financeCatalog";

interface Props {
  categories: FinanceCategory[]; onClose: () => void;
  onAddCategory: (name: string, flowType: FinanceCategoryFlow) => Promise<void>;
  onRenameCategory: (id: number, name: string) => Promise<void>;
  onMoveCategory: (id: number, direction: -1 | 1) => Promise<void>;
  onArchiveCategory: (id: number) => Promise<void>;
  onRestoreCategory: (id: number) => Promise<void>;
}

export default function FinanceCategoryManager(props: Props) {
  const [newCategory, setNewCategory] = useState(""); const [newFlow, setNewFlow] = useState<FinanceCategoryFlow>("expense"); const [showArchived, setShowArchived] = useState(false); const [error, setError] = useState("");
  useEffect(() => { document.body.classList.add("modal-open"); return () => document.body.classList.remove("modal-open"); }, []);
  async function run(action: () => Promise<void>) { setError(""); try { await action(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update categories."); } }
  async function addCategory(event: FormEvent) { event.preventDefault(); await run(async () => { await props.onAddCategory(newCategory, newFlow); setNewCategory(""); }); }
  return <div className="finance-modal-layer" role="dialog" aria-modal="true" aria-label="Manage categories"><button className="finance-modal-backdrop" type="button" aria-label="Close" onClick={props.onClose} /><section className="finance-modal finance-category-modal is-single-level">
    <header><div><span className="text-label">Financial structure</span><h2>Manage categories</h2><p>One clear level. Historical transactions stay connected when names change.</p></div><button type="button" onClick={props.onClose}>×</button></header>
    <div className="finance-category-toolbar"><form onSubmit={addCategory}><select value={newFlow} onChange={(event) => setNewFlow(event.target.value as FinanceCategoryFlow)}>{financeFlowOrder.map((flow) => <option key={flow} value={flow}>{financeFlowLabels[flow]}</option>)}</select><input value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder="New category" /><button type="submit">＋ Add</button></form><button type="button" className={showArchived ? "is-selected" : ""} onClick={() => setShowArchived((value) => !value)}>Archived</button></div>
    {error && <p className="finance-form-error">{error}</p>}
    <div className="finance-category-editor finance-category-groups">{financeFlowOrder.map((flow) => {
      const items = props.categories.filter((item) => item.flowType === flow && (showArchived || !item.deletedAt)).sort((a, b) => a.sortOrder - b.sortOrder);
      return <section key={flow}><header><span>{financeFlowLabels[flow]}</span><small>{items.filter((item) => !item.deletedAt).length} active</small></header><div>{items.map((category, index) => <article key={category.id} className={category.deletedAt ? "is-archived" : ""}><span>{String(index + 1).padStart(2, "0")}</span><input defaultValue={category.name} onBlur={(event) => { if (event.target.value !== category.name) void run(() => props.onRenameCategory(category.id!, event.target.value)); }} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} disabled={Boolean(category.deletedAt)} /><div>{category.deletedAt ? <button type="button" onClick={() => run(() => props.onRestoreCategory(category.id!))}>Restore</button> : <><button type="button" aria-label="Move category up" onClick={() => props.onMoveCategory(category.id!, -1)}>↑</button><button type="button" aria-label="Move category down" onClick={() => props.onMoveCategory(category.id!, 1)}>↓</button><button type="button" onClick={() => run(() => props.onArchiveCategory(category.id!))}>Archive</button></>}</div></article>)}</div></section>;
    })}</div>
    <footer><small>Expense, investment, income, and saving remain separate in calculations.</small><button type="button" onClick={props.onClose}>Done</button></footer>
  </section></div>;
}
