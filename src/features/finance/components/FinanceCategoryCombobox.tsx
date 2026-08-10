import { useMemo, useState, type KeyboardEvent } from "react";

import type { FinanceCategory } from "../../../database/db";

interface Props { categories: FinanceCategory[]; selectedId?: number; onChange: (id: number) => void; }

export default function FinanceCategoryCombobox({ categories, selectedId, onChange }: Props) {
  const selected = categories.find((item) => item.id === selectedId);
  const [open, setOpen] = useState(false); const [query, setQuery] = useState(""); const [active, setActive] = useState(0);
  const filtered = useMemo(() => categories.filter((item) => item.name.toLocaleLowerCase().includes(query.toLocaleLowerCase())), [categories, query]);
  function choose(category: FinanceCategory) { if (category.id) onChange(category.id); setQuery(""); setOpen(false); }
  function keyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") { event.preventDefault(); setOpen(true); setActive((value) => Math.min(filtered.length - 1, value + 1)); }
    if (event.key === "ArrowUp") { event.preventDefault(); setActive((value) => Math.max(0, value - 1)); }
    if (event.key === "Enter" && open && filtered[active]) { event.preventDefault(); choose(filtered[active]); }
    if (event.key === "Escape") { setOpen(false); setQuery(""); }
  }
  return <label className="finance-category-combobox"><span>Category</span><div onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) { setOpen(false); setQuery(""); } }}><input role="combobox" aria-expanded={open} aria-controls="finance-category-options" value={open ? query : selected?.name ?? ""} placeholder="Search category" onFocus={() => { setOpen(true); setQuery(""); setActive(0); }} onChange={(event) => { setQuery(event.target.value); setOpen(true); setActive(0); }} onKeyDown={keyDown} /><i>⌄</i>{open && <div id="finance-category-options" role="listbox">{filtered.length ? filtered.map((category, index) => <button type="button" role="option" aria-selected={category.id === selectedId} className={index === active ? "is-active" : ""} key={category.id} onMouseDown={(event) => event.preventDefault()} onClick={() => choose(category)}><span>{category.name}</span>{category.id === selectedId && <b>✓</b>}</button>) : <small>No matching category</small>}</div>}</div></label>;
}
