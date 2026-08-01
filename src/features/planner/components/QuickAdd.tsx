import { useState } from "react";

import {
  homePillars,
  pillarThemes,
  type PillarKey,
} from "../../../app/theme";

import type { Pillar } from "../../../database/db";
import type {
  CreateActivityInput,
  PlannerDay,
} from "../types";

type QuickAddProps = {
  day: PlannerDay;
  onAdd: (input: CreateActivityInput) => Promise<void>;
};

export default function QuickAdd({ day, onAdd }: QuickAddProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [title, setTitle] = useState("");
  const [pillar, setPillar] = useState<Pillar>("core");
  const [scheduledTime, setScheduledTime] = useState("");
  const [important, setImportant] = useState(false);
  const [notes, setNotes] = useState("");

  const selectablePillars: PillarKey[] = ["core", ...homePillars];

  function reset() {
    setTitle("");
    setPillar("core");
    setScheduledTime("");
    setImportant(false);
    setNotes("");
    setShowOptions(false);
    setIsOpen(false);
  }

  async function handleSubmit() {
    if (!title.trim()) return;

    await onAdd({
      title,
      scheduledDate: day.dateKey,
      pillar,
      scheduledTime,
      important,
      notes,
    });

    reset();
  }

  if (!isOpen) {
    return (
      <button
        className="planner-day-add"
        onClick={() => setIsOpen(true)}
        aria-label={`Add activity to ${day.dayName}`}
      >
        <span>+</span>
        Add
      </button>
    );
  }

  return (
    <div className="planner-inline-add">
      <input
        autoFocus
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !showOptions) handleSubmit();
          if (event.key === "Escape") reset();
        }}
        placeholder="What do you want to do?"
        aria-label={`Activity for ${day.dayName}`}
      />

      {showOptions && (
        <div className="planner-inline-options">
          <label>
            <span>Pillar</span>
            <select
              value={pillar}
              onChange={(event) =>
                setPillar(event.target.value as Pillar)
              }
            >
              {selectablePillars.map((pillarKey) => (
                <option key={pillarKey} value={pillarKey}>
                  {pillarThemes[pillarKey].shortLabel}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Time</span>
            <input
              type="time"
              value={scheduledTime}
              onChange={(event) => setScheduledTime(event.target.value)}
            />
          </label>

          <label className="planner-important-option">
            <input
              type="checkbox"
              checked={important}
              onChange={(event) => setImportant(event.target.checked)}
            />
            <span>Important</span>
          </label>

          <label className="planner-notes-option">
            <span>Notes</span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={2}
              placeholder="Optional context"
            />
          </label>
        </div>
      )}

      <div className="planner-inline-actions">
        <button
          className="planner-more-options"
          onClick={() => setShowOptions((current) => !current)}
        >
          {showOptions ? "Fewer options" : "More options"}
        </button>

        <div>
          <button className="planner-cancel-add" onClick={reset}>
            Cancel
          </button>
          <button
            className="planner-confirm-add"
            onClick={handleSubmit}
            disabled={!title.trim()}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
