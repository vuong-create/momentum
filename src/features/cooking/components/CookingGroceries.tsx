import { useMemo, useState, type FormEvent } from "react";

import type { GroceryCategory, GroceryItem } from "../../../database/db";
import { groceryCategories } from "../cookingCatalog";

type CookingGroceriesProps = {
  items: GroceryItem[];
  onAdd: (name: string) => Promise<void>;
  onToggle: (item: GroceryItem) => Promise<void>;
  onChangeCategory: (item: GroceryItem, category: GroceryCategory) => Promise<void>;
  onDelete: (item: GroceryItem) => Promise<void>;
  onClearCompleted: () => Promise<void>;
};

export default function CookingGroceries({ items, onAdd, onToggle, onChangeCategory, onDelete, onClearCompleted }: CookingGroceriesProps) {
  const [name, setName] = useState("");
  const activeCount = items.filter((item) => !item.checked).length;
  const completedCount = items.length - activeCount;
  const grouped = useMemo(() => groceryCategories.map((category) => ({ ...category, items: items.filter((item) => item.category === category.id) })).filter((group) => group.items.length), [items]);
  const frequent = useMemo(() => {
    const counts = new Map<string, { name: string; count: number }>();
    items.forEach((item) => {
      const key = item.name.toLowerCase();
      const current = counts.get(key);
      counts.set(key, { name: item.name, count: (current?.count ?? 0) + 1 });
    });
    return [...counts.values()].sort((a, b) => b.count - a.count).slice(0, 6);
  }, [items]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    await onAdd(name);
    setName("");
  }

  return (
    <div className="cooking-groceries-view">
      <header className="cooking-section-header">
        <div><span className="text-label">Shopping list</span><h2 className="font-pixel">Groceries</h2><p>{activeCount ? `${activeCount} items left to find.` : "Your list is clear."}</p></div>
        {completedCount > 0 && <button type="button" onClick={onClearCompleted}>Clear {completedCount} completed</button>}
      </header>
      <section className="cooking-grocery-composer cooking-card">
        <form onSubmit={submit}><span>＋</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Add an item…" aria-label="Add grocery item" /><button type="submit" disabled={!name.trim()}>Add</button></form>
        {frequent.length > 0 && <div><small>Frequent</small>{frequent.map((item) => <button key={item.name} type="button" onClick={() => onAdd(item.name)}>{item.name}</button>)}</div>}
      </section>
      <div className="cooking-grocery-groups">
        {grouped.map((group) => <section key={group.id} className="cooking-grocery-group cooking-card">
          <header><span>{group.mark}</span><h3>{group.label}</h3><small>{group.items.filter((item) => !item.checked).length}</small></header>
          <div>{group.items.map((item) => <article key={item.id} className={item.checked ? "is-checked" : ""}>
            <button type="button" className="cooking-grocery-check" onClick={() => onToggle(item)} aria-label={`${item.checked ? "Uncheck" : "Check"} ${item.name}`}>{item.checked ? "✓" : ""}</button>
            <span><strong>{item.name}</strong><small>{[item.quantity, item.unit].filter(Boolean).join(" ") || item.sourceRecipeName || "Manual"}</small></span>
            <select value={item.category} onChange={(event) => onChangeCategory(item, event.target.value as GroceryCategory)} aria-label={`Category for ${item.name}`}>{groceryCategories.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}</select>
            <button type="button" className="cooking-grocery-remove" onClick={() => onDelete(item)} aria-label={`Remove ${item.name}`}>×</button>
          </article>)}</div>
        </section>)}
        {!items.length && <div className="cooking-empty-groceries"><span>⌑</span><strong>Your basket is empty.</strong><small>Add an item above or send ingredients from a recipe.</small></div>}
      </div>
    </div>
  );
}
