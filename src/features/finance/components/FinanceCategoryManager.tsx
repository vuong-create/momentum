import { useEffect, useState, type FormEvent } from "react";

import type { FinanceCategory, FinanceSubcategory } from "../../../database/db";

interface Props {
  categories: FinanceCategory[]; subcategories: FinanceSubcategory[]; onClose: () => void;
  onAddCategory: (name: string) => Promise<void>; onRenameCategory: (id: number, name: string) => Promise<void>; onMoveCategory: (id: number, direction: -1 | 1) => Promise<void>; onArchiveCategory: (id: number) => Promise<void>; onRestoreCategory: (id: number) => Promise<void>;
  onAddSubcategory: (categoryId: number, name: string) => Promise<void>; onUpdateSubcategory: (id: number, patch: { name?: string; categoryId?: number }) => Promise<void>; onArchiveSubcategory: (id: number) => Promise<void>; onRestoreSubcategory: (id: number) => Promise<void>; onSetDefault: (id: number) => Promise<void>;
}

export default function FinanceCategoryManager(props: Props) {
  const [newCategory, setNewCategory] = useState(""); const [newSubcategory, setNewSubcategory] = useState<Record<number, string>>({}); const [showArchived, setShowArchived] = useState(false); const [error, setError] = useState("");
  useEffect(() => { document.body.classList.add("modal-open"); return () => document.body.classList.remove("modal-open"); }, []);
  const visibleCategories = props.categories.filter((item) => showArchived || !item.deletedAt).sort((a, b) => a.sortOrder - b.sortOrder);
  async function run(action: () => Promise<void>) { setError(""); try { await action(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update categories."); } }
  async function addCategory(event: FormEvent) { event.preventDefault(); await run(async () => { await props.onAddCategory(newCategory); setNewCategory(""); }); }
  return <div className="finance-modal-layer" role="dialog" aria-modal="true" aria-label="Manage categories"><button className="finance-modal-backdrop" type="button" aria-label="Close" onClick={props.onClose} /><section className="finance-modal finance-category-modal">
    <header><div><span className="text-label">Budget structure</span><h2>Manage categories</h2><p>Changes preserve every historical transaction.</p></div><button type="button" onClick={props.onClose}>×</button></header>
    <div className="finance-category-toolbar"><form onSubmit={addCategory}><input value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder="New category" /><button type="submit">＋ Add</button></form><button type="button" className={showArchived ? "is-selected" : ""} onClick={() => setShowArchived((value) => !value)}>Archived</button></div>
    {error && <p className="finance-form-error">{error}</p>}
    <div className="finance-category-editor">{visibleCategories.map((category, index) => <article key={category.id} className={category.deletedAt ? "is-archived" : ""}>
      <header><span>{String(index + 1).padStart(2, "0")}</span><input defaultValue={category.name} onBlur={(event) => { if (event.target.value !== category.name) void run(() => props.onRenameCategory(category.id!, event.target.value)); }} disabled={Boolean(category.deletedAt)} /><div>{category.deletedAt ? <button type="button" onClick={() => run(() => props.onRestoreCategory(category.id!))}>Restore</button> : <><button type="button" aria-label="Move category up" onClick={() => props.onMoveCategory(category.id!, -1)}>↑</button><button type="button" aria-label="Move category down" onClick={() => props.onMoveCategory(category.id!, 1)}>↓</button><button type="button" onClick={() => run(() => props.onArchiveCategory(category.id!))}>Archive</button></>}</div></header>
      {!category.deletedAt && <div>{props.subcategories.filter((item) => item.categoryId === category.id && (showArchived || !item.deletedAt)).sort((a, b) => a.sortOrder - b.sortOrder).map((subcategory) => <div key={subcategory.id} className={subcategory.deletedAt ? "is-archived" : ""}><button className={subcategory.isDefault ? "is-default" : ""} type="button" title="Use for uncategorized expenses" onClick={() => !subcategory.deletedAt && props.onSetDefault(subcategory.id!)}>{subcategory.isDefault ? "◆" : "◇"}</button><input defaultValue={subcategory.name} disabled={Boolean(subcategory.deletedAt)} onBlur={(event) => { if (event.target.value !== subcategory.name) void run(() => props.onUpdateSubcategory(subcategory.id!, { name: event.target.value })); }} /><select value={subcategory.categoryId} disabled={Boolean(subcategory.deletedAt)} onChange={(event) => run(() => props.onUpdateSubcategory(subcategory.id!, { categoryId: Number(event.target.value) }))}>{props.categories.filter((item) => !item.deletedAt).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>{subcategory.deletedAt ? <button type="button" onClick={() => props.onRestoreSubcategory(subcategory.id!)}>Restore</button> : <button type="button" onClick={() => props.onArchiveSubcategory(subcategory.id!)}>×</button>}</div>)}
        <form onSubmit={async (event) => { event.preventDefault(); const value = newSubcategory[category.id!] ?? ""; await run(async () => { await props.onAddSubcategory(category.id!, value); setNewSubcategory((current) => ({ ...current, [category.id!]: "" })); }); }}><span>＋</span><input value={newSubcategory[category.id!] ?? ""} onChange={(event) => setNewSubcategory((current) => ({ ...current, [category.id!]: event.target.value }))} placeholder="Add subcategory" /><button type="submit">Add</button></form>
      </div>}
    </article>)}</div>
    <footer><small><b>◆</b> Default for uncategorized expenses</small><button type="button" onClick={props.onClose}>Done</button></footer>
  </section></div>;
}
