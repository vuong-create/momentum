import { useState } from "react";
import type { AthleticsTemplate } from "../../../database/db";
import type { AthleticsTemplateInput } from "../services/athleticsService";
import { toDateKey } from "../services/athleticsService";

type AthleticsTemplatesProps = {
  templates: AthleticsTemplate[];
  now: Date;
  onCreate: (input: AthleticsTemplateInput) => Promise<void>;
  onUpdate: (id: number, input: AthleticsTemplateInput) => Promise<void>;
  onDuplicate: (id: number) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onStart: (id: number) => Promise<void>;
  onSchedule: (id: number, date: string) => Promise<void>;
};

type EditorState = {
  id?: number;
  name: string;
  exercises: Array<{ name: string; defaultSets: number }>;
};

export default function AthleticsTemplates({
  templates,
  now,
  onCreate,
  onUpdate,
  onDuplicate,
  onDelete,
  onStart,
  onSchedule,
}: AthleticsTemplatesProps) {
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [scheduleId, setScheduleId] = useState<number | null>(null);
  const [scheduleDate, setScheduleDate] = useState(toDateKey(now));
  const [saving, setSaving] = useState(false);

  function openNew() {
    setEditor({ name: "", exercises: [{ name: "", defaultSets: 3 }] });
  }

  function openEdit(template: AthleticsTemplate) {
    setEditor({
      id: template.id,
      name: template.name,
      exercises: template.exercises.map((exercise) => ({
        name: exercise.name,
        defaultSets: exercise.defaultSets,
      })),
    });
  }

  async function saveEditor() {
    if (!editor || !editor.name.trim() || !editor.exercises.some((exercise) => exercise.name.trim())) return;
    setSaving(true);
    try {
      if (editor.id) await onUpdate(editor.id, editor);
      else await onCreate(editor);
      setEditor(null);
    } finally {
      setSaving(false);
    }
  }

  async function confirmSchedule() {
    if (!scheduleId) return;
    await onSchedule(scheduleId, scheduleDate);
    setScheduleId(null);
  }

  return (
    <section className="athletics-templates-view">
      <header className="athletics-section-heading">
        <div><span className="text-label">Templates</span><h2>Your training, remembered</h2><p>Structure the routine once. Momentum brings back the exercises and your previous numbers.</p></div>
        <button type="button" className="athletics-primary-button" onClick={openNew}>＋ New template</button>
      </header>

      <div className="athletics-template-grid">
        {templates.map((template, index) => (
          <article className="athletics-template-card" key={template.id}>
            <header><span>{String(index + 1).padStart(2, "0")}</span><button type="button" onClick={() => openEdit(template)}>Edit</button></header>
            <h3>{template.name}</h3>
            <ol>{template.exercises.map((exercise) => <li key={exercise.id}><span>{exercise.name}</span><small>{exercise.defaultSets} sets</small></li>)}</ol>
            <footer>
              <button type="button" className="is-start" onClick={() => onStart(template.id!)}>Start</button>
              <button type="button" onClick={() => { setScheduleId(template.id!); setScheduleDate(toDateKey(now)); }}>Plan</button>
              <button type="button" onClick={() => onDuplicate(template.id!)}>Duplicate</button>
              <button type="button" className="is-delete" onClick={() => onDelete(template.id!)}>Delete</button>
            </footer>
          </article>
        ))}
      </div>

      {editor && (
        <div className="athletics-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditor(null); }}>
          <section className="athletics-template-modal" role="dialog" aria-modal="true" aria-labelledby="athletics-template-title">
            <header><div><span className="text-label">Workout template</span><h2 id="athletics-template-title">{editor.id ? "Refine the routine" : "Build a routine"}</h2></div><button type="button" onClick={() => setEditor(null)} aria-label="Close">×</button></header>
            <label className="athletics-template-name"><span>Name</span><input autoFocus value={editor.name} onChange={(event) => setEditor({ ...editor, name: event.target.value })} placeholder="Upper, Mobility, Plyometrics…" /></label>
            <div className="athletics-template-exercises">
              <span className="text-label">Exercises</span>
              {editor.exercises.map((exercise, index) => (
                <div key={index}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <input value={exercise.name} onChange={(event) => setEditor({ ...editor, exercises: editor.exercises.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item) })} placeholder="Exercise name" />
                  <label><input type="number" min="1" max="8" value={exercise.defaultSets} onChange={(event) => setEditor({ ...editor, exercises: editor.exercises.map((item, itemIndex) => itemIndex === index ? { ...item, defaultSets: Number(event.target.value) } : item) })} /><small>sets</small></label>
                  <button type="button" onClick={() => setEditor({ ...editor, exercises: editor.exercises.filter((_, itemIndex) => itemIndex !== index) })} aria-label={`Remove exercise ${index + 1}`}>×</button>
                </div>
              ))}
              <button type="button" onClick={() => setEditor({ ...editor, exercises: [...editor.exercises, { name: "", defaultSets: 3 }] })}>＋ Add exercise</button>
            </div>
            <footer><button type="button" onClick={() => setEditor(null)}>Cancel</button><button type="button" className="athletics-primary-button" disabled={saving || !editor.name.trim()} onClick={saveEditor}>{saving ? "Saving…" : "Save template"}</button></footer>
          </section>
        </div>
      )}

      {scheduleId && (
        <div className="athletics-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setScheduleId(null); }}>
          <section className="athletics-schedule-modal" role="dialog" aria-modal="true" aria-labelledby="athletics-schedule-title">
            <span className="text-label">Weekly Planner</span><h2 id="athletics-schedule-title">Choose a training day</h2><p>This creates one shared activity visible here, Home, and Planner.</p>
            <input type="date" min={toDateKey(now)} value={scheduleDate} onChange={(event) => setScheduleDate(event.target.value)} />
            <footer><button type="button" onClick={() => setScheduleId(null)}>Cancel</button><button type="button" className="athletics-primary-button" onClick={confirmSchedule}>Add to Planner</button></footer>
          </section>
        </div>
      )}
    </section>
  );
}
