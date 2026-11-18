import { useState, type FormEvent } from "react";
import type { AthleticsBlockTemplateActivity, AthleticsTrainingBlock } from "../../../database/db";
import type { AddBlockSessionInput } from "../services/trainingOccurrenceService";
import { parseAthleticsBlockDump } from "../services/trainingBlockService";

type Props = {
  block: AthleticsTrainingBlock;
  initialDate: string;
  todayKey: string;
  choices: AthleticsBlockTemplateActivity[];
  onSave: (input: AddBlockSessionInput) => Promise<void>;
  onCancel: () => void;
};

export default function AddBlockSessionForm({ block, initialDate, todayKey, choices, onSave, onCancel }: Props) {
  const [date, setDate] = useState(initialDate);
  const [choice, setChoice] = useState("");
  const [name, setName] = useState("");
  const [kind, setKind] = useState<"gym" | "volleyball" | "custom">("gym");
  const [exerciseText, setExerciseText] = useState("");
  const [completed, setCompleted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError("");
    try {
      const selected = choices.find((item) => item.id === choice);
      const exercises = kind === "gym" ? (parseAthleticsBlockDump("Workout\n" + exerciseText.split("\n").filter((line) => line.trim()).map((line) => "- " + line.replace(/^[-*•]\s*/, "")).join("\n"))[0]?.exercises ?? []) : [];
      await onSave({ date, completed, activity: selected ?? { name, kind, focus: "", exercises } });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not add session."); setBusy(false); }
  }
  return <form className="athletics-occurrence-form" aria-label="Add block session" onSubmit={submit}>
    <header><h3>Add a session</h3><p>This occurrence only. Your weekly template stays unchanged.</p></header>
    <label>Date<input autoFocus type="date" min={block.startDate} max={block.endDate} required value={date} onChange={(event) => { setDate(event.target.value); if (event.target.value > todayKey) setCompleted(false); }} /></label>
    <label>Session<select value={choice} onChange={(event) => setChoice(event.target.value)}><option value="">New one-off session</option>{choices.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
    {!choice && <>
      <label>Name<input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Upper A, volleyball, …" /></label>
      <label>Type<select value={kind} onChange={(event) => setKind(event.target.value as typeof kind)}><option value="gym">Workout</option><option value="volleyball">Volleyball</option><option value="custom">Other activity</option></select></label>
      {kind === "gym" && <label className="is-wide">Exercises (optional)<textarea value={exerciseText} onChange={(event) => setExerciseText(event.target.value)} placeholder={"Incline press - 3x8\nLat pulldown - 120 for 8"} /><small>One per line. Unspecified sets and reps default to 2 × 8.</small></label>}
    </>}
    <label className="is-wide occurrence-checkbox"><input type="checkbox" checked={completed} disabled={date > todayKey} onChange={(event) => setCompleted(event.target.checked)} />Already completed on this date</label>
    {error && <p className="is-wide" role="alert">{error}</p>}
    <footer><button type="button" disabled={busy} onClick={onCancel}>Cancel</button><button type="submit" disabled={busy || (!choice && !name.trim())}>{busy ? "Adding…" : "Add session"}</button></footer>
  </form>;
}
