import { useMemo, useState } from "react";
import { createPortal } from "react-dom";

import type {
  DayPreset,
  DayPresetItem,
  Difficulty,
  Pillar,
} from "../../../database/db";
import {
  deleteDayPreset,
  duplicateDayPreset,
  saveDayPreset,
} from "../services/dayPresetService";
import CookingIdentityPicker from "../../cooking/components/CookingIdentityPicker";
import {
  getCookingActivityIdentity,
  getCookingTaskActivityKind,
  getCustomMealActivityKind,
  parseCookingMealSlot,
} from "../../cooking/cookingCatalog";

type DayPresetManagerProps = {
  open: boolean;
  presets: DayPreset[];
  initialPreset?: DayPreset;
  onClose: () => void;
};

const pillars: Array<{ value: Pillar; label: string }> = [
  { value: "core", label: "General" },
  { value: "chinese", label: "Chinese" },
  { value: "athletics", label: "Athletics" },
  { value: "cooking", label: "Cooking" },
  { value: "finance", label: "Finance" },
  { value: "happiness", label: "Library" },
];

function newItem(): DayPresetItem {
  return {
    id: crypto.randomUUID(),
    title: "",
    pillar: "core",
    difficulty: "medium",
  };
}

function emptyDraft() {
  return { id: undefined as number | undefined, name: "", items: [newItem()] };
}

function draftFromPreset(preset: DayPreset) {
  return {
    id: preset.id,
    name: preset.name,
    items: preset.items.map((item) => ({ ...item })),
  };
}

export default function DayPresetManager({
  open,
  presets,
  initialPreset,
  onClose,
}: DayPresetManagerProps) {
  const [selectedId, setSelectedId] = useState<number | "new">(initialPreset?.id ?? "new");
  const [draft, setDraft] = useState(() => initialPreset ? draftFromPreset(initialPreset) : emptyDraft());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const selected = useMemo(
    () => presets.find((preset) => preset.id === selectedId),
    [presets, selectedId],
  );

  if (!open) return null;

  function choosePreset(preset?: DayPreset) {
    if (!preset) {
      setSelectedId("new");
      setDraft(emptyDraft());
    } else {
      setSelectedId(preset.id!);
      setDraft(draftFromPreset(preset));
    }
    setError("");
  }

  function updateItem(id: string, patch: Partial<DayPresetItem>) {
    setDraft((current) => ({
      ...current,
      items: current.items.map((item) => item.id === id ? { ...item, ...patch } : item),
    }));
  }

  function moveItem(index: number, direction: -1 | 1) {
    const destination = index + direction;
    if (destination < 0 || destination >= draft.items.length) return;
    setDraft((current) => {
      const items = [...current.items];
      [items[index], items[destination]] = [items[destination], items[index]];
      return { ...current, items };
    });
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const id = await saveDayPreset(draft);
      setSelectedId(id);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The preset could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  const target = document.querySelector(".experience-root") ?? document.body;

  return createPortal(
    <div className="day-preset-manager-layer">
      <button type="button" className="day-preset-manager-backdrop" onClick={onClose} aria-label="Close day preset manager" />
      <section className="day-preset-manager" role="dialog" aria-modal="true" aria-labelledby="day-preset-manager-title">
        <header>
          <div>
            <span className="text-label">Planner system</span>
            <h2 id="day-preset-manager-title" className="font-pixel">Day Presets</h2>
            <p>Build a reusable shape for the kinds of days you repeat.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close">×</button>
        </header>

        <div className="day-preset-manager-body">
          <nav aria-label="Day presets">
            <button type="button" className={selectedId === "new" ? "is-selected" : ""} onClick={() => choosePreset()}>+ New preset</button>
            {presets.map((preset) => (
              <button type="button" className={selectedId === preset.id ? "is-selected" : ""} key={preset.id} onClick={() => choosePreset(preset)}>
                <strong>{preset.name}</strong>
                <small>{preset.items.length} activities</small>
              </button>
            ))}
          </nav>

          <div className="day-preset-editor">
            <label className="day-preset-name">
              <span>Preset name</span>
              <input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Normal Work Day" />
            </label>

            <div className="day-preset-items-heading">
              <span>Activities</span>
              <small>These become normal Planner activities when applied.</small>
            </div>

            <div className="day-preset-items">
              {draft.items.map((item, index) => {
                const cookingIdentity = getCookingActivityIdentity(item.activityKind);
                const mealSlot = parseCookingMealSlot(item.activityKind) ?? "dinner";
                return (
                <article key={item.id}>
                  <div className="day-preset-item-order">
                    <button type="button" disabled={index === 0} onClick={() => moveItem(index, -1)} aria-label={`Move ${item.title || "activity"} up`}>↑</button>
                    <button type="button" disabled={index === draft.items.length - 1} onClick={() => moveItem(index, 1)} aria-label={`Move ${item.title || "activity"} down`}>↓</button>
                  </div>
                  <div className="day-preset-item-fields">
                    <input className="day-preset-item-title" value={item.title} onChange={(event) => updateItem(item.id, { title: event.target.value })} placeholder="Activity title" aria-label="Activity title" />
                    <select value={item.pillar} onChange={(event) => {
                      const nextPillar = event.target.value as Pillar;
                      updateItem(item.id, {
                        pillar: nextPillar,
                        activityKind: nextPillar === "cooking"
                          ? getCustomMealActivityKind("dinner")
                          : undefined,
                      });
                    }} aria-label="Pillar">
                      {pillars.map((pillar) => <option key={pillar.value} value={pillar.value}>{pillar.label}</option>)}
                    </select>
                    <input type="time" value={item.scheduledTime ?? ""} onChange={(event) => updateItem(item.id, { scheduledTime: event.target.value })} aria-label="Preferred time" />
                    <select value={item.difficulty} onChange={(event) => updateItem(item.id, { difficulty: event.target.value as Difficulty })} aria-label="Difficulty">
                      <option value="easy">Quick</option>
                      <option value="medium">Standard</option>
                      <option value="hard">Major</option>
                    </select>
                    <button type="button" className={item.important ? "is-selected" : ""} onClick={() => updateItem(item.id, { important: !item.important })}>{item.important ? "★ Important" : "☆ Important"}</button>
                    <input value={item.notes ?? ""} onChange={(event) => updateItem(item.id, { notes: event.target.value })} placeholder="Optional note" aria-label="Optional note" />
                    {item.pillar === "cooking" && (
                      <div className="day-preset-cooking-identity">
                        <CookingIdentityPicker
                          compact
                          identity={cookingIdentity}
                          mealSlot={mealSlot}
                          showUnclassifiedNote
                          onIdentityChange={(identity) => updateItem(item.id, {
                            activityKind: identity === "meal"
                              ? getCustomMealActivityKind(mealSlot)
                              : getCookingTaskActivityKind(),
                          })}
                          onMealSlotChange={(slot) => updateItem(item.id, {
                            activityKind: getCustomMealActivityKind(slot),
                          })}
                        />
                      </div>
                    )}
                  </div>
                  <button type="button" className="day-preset-item-remove" onClick={() => setDraft((current) => ({ ...current, items: current.items.filter((candidate) => candidate.id !== item.id) }))} aria-label={`Remove ${item.title || "activity"}`}>×</button>
                </article>
              );})}
            </div>

            <button type="button" className="day-preset-add-item" onClick={() => setDraft((current) => ({ ...current, items: [...current.items, newItem()] }))}>+ Add activity</button>
            {error && <p className="day-preset-error">{error}</p>}

            <footer>
              {selected && (
                <>
                  <button type="button" onClick={async () => {
                    const id = await duplicateDayPreset(selected);
                    setSelectedId(id);
                    setDraft({ id, name: `${selected.name} Copy`, items: selected.items.map((item) => ({ ...item, id: crypto.randomUUID() })) });
                  }}>Duplicate</button>
                  <button type="button" className="is-danger" onClick={async () => { await deleteDayPreset(selected.id!); choosePreset(); }}>Delete</button>
                </>
              )}
              <button type="button" className="day-preset-save" disabled={saving} onClick={save}>{saving ? "Saving…" : "Save preset"}</button>
            </footer>
          </div>
        </div>
      </section>
    </div>,
    target,
  );
}
