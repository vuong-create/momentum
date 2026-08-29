import { useState } from "react";

import type { AthleticsPlannedExercise, AthleticsPlannedSession, AthleticsTrainingBlock, PlannedActivity } from "../../../database/db";
import { getActivityStatus } from "../../activities/services/activityLifecycle";
import type { TrainingBlockTemplateUpdate } from "../services/trainingBlockService";

type Props = {
  block?: AthleticsTrainingBlock;
  sessions: AthleticsPlannedSession[];
  activities: PlannedActivity[];
  onSave: (name: string, input: TrainingBlockTemplateUpdate) => Promise<number>;
};

function localId() { return `planned-exercise-${crypto.randomUUID()}`; }
function cloneExercises(exercises: AthleticsPlannedExercise[]) { return exercises.map((item) => ({ ...item, alternatives: item.alternatives ? [...item.alternatives] : undefined })); }

function TemplateEditor({ session, remaining, onSave }: { session: AthleticsPlannedSession; remaining: number; onSave: Props["onSave"] }) {
  const [focus, setFocus] = useState(session.focus);
  const [exercises, setExercises] = useState(() => cloneExercises(session.exercises));
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  function updateExercise(id: string, patch: Partial<AthleticsPlannedExercise>) {
    setExercises((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
  }

  async function save() {
    if (saving) return;
    setSaving(true); setNotice("");
    try {
      const count = await onSave(session.name, { focus, exercises });
      setNotice(`${count} remaining ${count === 1 ? "session" : "sessions"} updated.`);
    } finally { setSaving(false); }
  }

  return <section className="athletics-template-editor">
    <header><div><span className="text-label">Block template</span><h2>{session.name}</h2><p>Changes apply only to incomplete sessions. Completed training stays untouched.</p></div><span>{remaining} remaining</span></header>
    <label className="athletics-template-focus"><span>Session focus</span><input value={focus} onChange={(event) => setFocus(event.target.value)} /></label>
    <div className="athletics-template-exercises">{exercises.map((exercise, index) => <article key={exercise.id}>
      <span>{String(index + 1).padStart(2, "0")}</span>
      <label><small>Exercise</small><input value={exercise.name} onChange={(event) => updateExercise(exercise.id, { name: event.target.value, alternatives: undefined })} /></label>
      <label><small>Type</small><select value={exercise.category} onChange={(event) => { const category = event.target.value as AthleticsPlannedExercise["category"]; updateExercise(exercise.id, { category, tracking: category === "explosive" ? "completion" : "load-reps" }); }}><option value="explosive">Athletic / Explosive</option><option value="hypertrophy">Strength / Hypertrophy</option></select></label>
      <label><small>Sets</small><input type="number" min="1" max="12" value={exercise.prescribedSets} onChange={(event) => updateExercise(exercise.id, { prescribedSets: Number(event.target.value) })} /></label>
      <label><small>Reps / distance</small><input value={exercise.repRange ?? ""} placeholder="6–10" onChange={(event) => updateExercise(exercise.id, { repRange: event.target.value })} /></label>
      <button type="button" aria-label={`Remove ${exercise.name}`} onClick={() => setExercises((current) => current.filter((item) => item.id !== exercise.id))}>×</button>
    </article>)}</div>
    <button type="button" className="athletics-template-add" onClick={() => setExercises((current) => [...current, { id: localId(), name: "", alternatives: undefined, category: "hypertrophy", tracking: "load-reps", prescribedSets: 3, repRange: "8–12", targetLabel: "3 × 8–12" }])}>＋ Add exercise</button>
    <footer>{notice && <span>{notice}</span>}<button type="button" disabled={saving || !exercises.some((item) => item.name.trim())} onClick={save}>{saving ? "Saving…" : "Apply to remaining sessions"}</button></footer>
  </section>;
}

export default function AthleticsBlockTemplates({ block, sessions, activities, onSave }: Props) {
  const templates = sessions.filter((item, index, all) => item.kind === "gym" && all.findIndex((candidate) => candidate.name === item.name && candidate.kind === "gym") === index);
  const [selectedName, setSelectedName] = useState(templates[0]?.name ?? "");
  const selected = templates.find((item) => item.name === selectedName) ?? templates[0];
  if (!block || !selected) return <section className="athletics-template-empty"><span className="text-label">Templates</span><h2>Add a training block first.</h2><p>Your reusable block sessions will appear here.</p></section>;
  const remaining = sessions.filter((item) => item.kind === "gym" && item.name === selected.name && item.status !== "skipped" && getActivityStatus(activities.find((activity) => activity.id === item.plannedActivityId) ?? { completed: false } as PlannedActivity) !== "completed").length;

  return <section className="athletics-block-templates">
    <nav aria-label="Block workout templates">{templates.map((template) => <button key={template.name} type="button" className={template.name === selected.name ? "is-selected" : ""} onClick={() => setSelectedName(template.name)}><strong>{template.name}</strong><span>{template.exercises.length} exercises</span></button>)}</nav>
    <TemplateEditor key={`${selected.name}:${selected.updatedAt}`} session={selected} remaining={remaining} onSave={onSave} />
  </section>;
}
