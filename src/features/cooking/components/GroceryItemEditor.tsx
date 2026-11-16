import { useState, type FormEvent } from "react";
import type { GroceryItem } from "../../../database/db";

export type GroceryEdit = { name: string; quantity?: number; unit?: string };

export default function GroceryItemEditor({ item, onSave, onCancel }: { item: GroceryItem; onSave: (input: GroceryEdit) => Promise<void>; onCancel: () => void }) {
  const [name, setName] = useState(item.name);
  const [quantity, setQuantity] = useState(item.quantity?.toString() ?? "");
  const [unit, setUnit] = useState(item.unit ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true); setError("");
    try { await onSave({ name, quantity: quantity === "" ? undefined : Number(quantity), unit }); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save this item."); setSaving(false); }
  }
  return <form className="grocery-item-editor" aria-label={`Edit ${item.name}`} onSubmit={submit}>
    <label>Name<input autoFocus required value={name} onChange={(event) => setName(event.target.value)} /></label>
    <label>Quantity<input type="number" inputMode="decimal" min="0.001" step="any" value={quantity} onChange={(event) => setQuantity(event.target.value)} placeholder="Optional" /></label>
    <label>Unit<input value={unit} onChange={(event) => setUnit(event.target.value)} placeholder="lb, bags, …" /></label>
    {error && <p role="alert">{error}</p>}
    <div><button type="button" disabled={saving} onClick={onCancel}>Cancel</button><button type="submit" disabled={saving || !name.trim()}>{saving ? "Saving…" : "Save item"}</button></div>
  </form>;
}
