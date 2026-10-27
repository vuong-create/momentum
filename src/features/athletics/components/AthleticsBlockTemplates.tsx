import { useMemo, useState } from "react";

import type {
  AthleticsBlockTemplate,
  AthleticsBlockTemplateActivity,
  AthleticsBlockTemplateDay,
  AthleticsPlannedExercise,
  AthleticsPlannedSession,
  AthleticsTrainingBlock,
  PlannedActivity,
} from "../../../database/db";
import { getTrainingBlockDefinition, type AthleticsBlockDefinitionInput } from "../services/trainingBlockService";

type Props = {
  templates: AthleticsBlockTemplate[];
  block?: AthleticsTrainingBlock;
  sessions: AthleticsPlannedSession[];
  activities: PlannedActivity[];
  onSaveTemplate: (id: number, input: AthleticsBlockDefinitionInput) => Promise<void>;
  onCreateTemplate: (input: AthleticsBlockDefinitionInput) => Promise<number>;
  onUpdateBlock: (id: number, input: AthleticsBlockDefinitionInput) => Promise<number>;
  onSchedule: (templateId: number, input: { name: string; startDate: string; weekCount: number }) => Promise<void>;
};

const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const activityLabels: Record<AthleticsBlockTemplateActivity["kind"], string> = { gym: "Workout", volleyball: "Volleyball", custom: "Activity", recovery: "Recovery" };

function localId(prefix: string) { return `${prefix}-${crypto.randomUUID()}`; }
function cloneExercises(exercises: AthleticsPlannedExercise[]) { return exercises.map((item) => ({ ...item, alternatives: item.alternatives ? [...item.alternatives] : undefined })); }
function cloneDefinition(input: AthleticsBlockDefinitionInput): AthleticsBlockDefinitionInput {
  return { ...input, days: input.days.map((day) => ({ ...day, activities: (day.activities ?? []).map((activity) => ({ ...activity, exercises: cloneExercises(activity.exercises) })) })), phases: input.phases.map((phase) => ({ ...phase })) };
}
function blankDefinition(): AthleticsBlockDefinitionInput {
  return {
    name: "Untitled Training Block",
    goal: "",
    weekCount: 4,
    days: dayNames.map((_, dayOffset) => ({ id: localId("day"), dayOffset, activities: [] })),
    phases: Array.from({ length: 4 }, (_, index) => ({ weekNumber: index + 1, name: `Week ${index + 1}`, guidance: "Train with intention and recover well.", reducedVolume: false })),
  };
}
function newActivity(kind: "gym" | "volleyball" | "custom"): AthleticsBlockTemplateActivity {
  return { id: localId("activity"), kind, name: kind === "gym" ? "New Workout" : kind === "volleyball" ? "Volleyball" : "New Activity", focus: "", exercises: [], volleyballType: kind === "volleyball" ? "practice" : undefined };
}
function newExercise(): AthleticsPlannedExercise {
  return { id: localId("exercise"), name: "", category: "hypertrophy", tracking: "load-reps", prescribedSets: 3, repRange: "8–12", targetLabel: "3 × 8–12" };
}

function BlockEditor({ initial, onSave, onApplyCurrent, saveLabel }: { initial: AthleticsBlockDefinitionInput; onSave: (input: AthleticsBlockDefinitionInput) => Promise<string>; onApplyCurrent?: (input: AthleticsBlockDefinitionInput) => Promise<string>; saveLabel: string }) {
  const [draft, setDraft] = useState(() => cloneDefinition(initial));
  const [selectedDay, setSelectedDay] = useState(0);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const day = draft.days[selectedDay];

  function patchDay(update: (day: AthleticsBlockTemplateDay) => AthleticsBlockTemplateDay) {
    setDraft((current) => ({ ...current, days: current.days.map((item, index) => index === selectedDay ? update(item) : item) }));
  }
  function patchActivity(id: string, patch: Partial<AthleticsBlockTemplateActivity>) {
    patchDay((current) => ({ ...current, activities: current.activities.map((activity) => activity.id === id ? { ...activity, ...patch } : activity) }));
  }
  function patchExercise(activityId: string, exerciseId: string, patch: Partial<AthleticsPlannedExercise>) {
    patchDay((current) => ({ ...current, activities: current.activities.map((activity) => activity.id === activityId ? { ...activity, exercises: activity.exercises.map((exercise) => exercise.id === exerciseId ? { ...exercise, ...patch } : exercise) } : activity) }));
  }
  function setWeekCount(value: number) {
    const weekCount = Math.min(12, Math.max(1, value || 1));
    setDraft((current) => ({ ...current, weekCount, phases: Array.from({ length: weekCount }, (_, index) => current.phases[index] ?? { weekNumber: index + 1, name: `Week ${index + 1}`, guidance: "Train with intention and recover well." }) }));
  }
  async function run(action: (input: AthleticsBlockDefinitionInput) => Promise<string>) {
    if (saving) return; setSaving(true); setNotice("");
    try { setNotice(await action(draft)); } finally { setSaving(false); }
  }

  return <section className="athletics-builder">
    <header className="athletics-builder-overview">
      <label><span>Block name</span><input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} /></label>
      <label><span>Goal</span><input value={draft.goal} placeholder="What is this block designed to improve?" onChange={(event) => setDraft((current) => ({ ...current, goal: event.target.value }))} /></label>
      <label><span>Weeks</span><input type="number" min="1" max="12" value={draft.weekCount} onChange={(event) => setWeekCount(Number(event.target.value))} /></label>
    </header>

    <details className="athletics-builder-advanced">
      <summary>Block settings and weekly progression</summary>
      <div>{draft.phases.map((phase, index) => <article key={phase.weekNumber}><span>Week {index + 1}</span><input aria-label={`Week ${index + 1} phase name`} value={phase.name} onChange={(event) => setDraft((current) => ({ ...current, phases: current.phases.map((item, phaseIndex) => phaseIndex === index ? { ...item, name: event.target.value } : item) }))} /><input aria-label={`Week ${index + 1} guidance`} value={phase.guidance} onChange={(event) => setDraft((current) => ({ ...current, phases: current.phases.map((item, phaseIndex) => phaseIndex === index ? { ...item, guidance: event.target.value } : item) }))} /><label><input type="checkbox" checked={Boolean(phase.reducedVolume)} onChange={(event) => setDraft((current) => ({ ...current, phases: current.phases.map((item, phaseIndex) => phaseIndex === index ? { ...item, reducedVolume: event.target.checked } : item) }))} /> Reduced volume</label></article>)}</div>
    </details>

    <nav className="athletics-builder-days" aria-label="Weekly block days">
      {draft.days.map((item, index) => <button key={item.id} type="button" className={selectedDay === index ? "is-selected" : ""} onClick={() => setSelectedDay(index)}><span>{dayNames[index]}</span><strong>{item.activities.length ? `${item.activities.length} ${item.activities.length === 1 ? "activity" : "activities"}` : "Rest day"}</strong></button>)}
    </nav>

    <section className="athletics-builder-day">
      <header><div><span className="text-label">Weekly schedule</span><h3>{dayNames[selectedDay]}</h3></div><div><button type="button" onClick={() => patchDay((current) => ({ ...current, activities: [...current.activities, newActivity("gym")] }))}>＋ Workout</button><button type="button" onClick={() => patchDay((current) => ({ ...current, activities: [...current.activities, newActivity("volleyball")] }))}>＋ Volleyball</button><button type="button" onClick={() => patchDay((current) => ({ ...current, activities: [...current.activities, newActivity("custom")] }))}>＋ Activity</button></div></header>
      {!day.activities.length && <div className="athletics-builder-rest"><strong>Recovery day</strong><span>Leave this day clear, or add any activity above.</span></div>}
      <div className="athletics-builder-activities">{day.activities.map((activity, activityIndex) => <article key={activity.id}>
        <header><span>{String(activityIndex + 1).padStart(2, "0")}</span><strong>{activityLabels[activity.kind]}</strong><button type="button" onClick={() => patchDay((current) => ({ ...current, activities: current.activities.filter((item) => item.id !== activity.id) }))}>Delete</button></header>
        <div className="athletics-builder-fields"><label><span>Type</span><select value={activity.kind} onChange={(event) => { const kind = event.target.value as AthleticsBlockTemplateActivity["kind"]; patchActivity(activity.id, { kind, exercises: kind === "gym" ? activity.exercises : [], volleyballType: kind === "volleyball" ? "practice" : undefined }); }}><option value="gym">Workout</option><option value="volleyball">Volleyball</option><option value="custom">Custom activity</option></select></label><label><span>Name</span><input value={activity.name} onChange={(event) => patchActivity(activity.id, { name: event.target.value })} /></label><label><span>Focus</span><input value={activity.focus} onChange={(event) => patchActivity(activity.id, { focus: event.target.value })} /></label><label><span>Notes</span><input value={activity.notes ?? ""} onChange={(event) => patchActivity(activity.id, { notes: event.target.value })} /></label></div>
        {activity.kind === "gym" && <section className="athletics-builder-exercises"><header><span>Exercises</span><button type="button" onClick={() => patchActivity(activity.id, { exercises: [...activity.exercises, newExercise()] })}>＋ Add exercise</button></header>{activity.exercises.map((exercise, index) => <div key={exercise.id}><span>{index + 1}</span><input aria-label="Exercise name" placeholder="Exercise name" value={exercise.name} onChange={(event) => patchExercise(activity.id, exercise.id, { name: event.target.value })} /><select aria-label="Exercise type" value={exercise.category} onChange={(event) => { const category = event.target.value as AthleticsPlannedExercise["category"]; patchExercise(activity.id, exercise.id, { category, tracking: category === "explosive" ? "completion" : "load-reps" }); }}><option value="hypertrophy">Strength</option><option value="explosive">Athletic</option></select><input aria-label="Sets" type="number" min="1" max="12" value={exercise.prescribedSets} onChange={(event) => patchExercise(activity.id, exercise.id, { prescribedSets: Number(event.target.value) })} /><input aria-label="Reps or distance" value={exercise.repRange ?? ""} onChange={(event) => patchExercise(activity.id, exercise.id, { repRange: event.target.value })} /><button type="button" aria-label={`Delete ${exercise.name || "exercise"}`} onClick={() => patchActivity(activity.id, { exercises: activity.exercises.filter((item) => item.id !== exercise.id) })}>×</button></div>)}</section>}
      </article>)}</div>
    </section>
    <footer>{notice && <span>{notice}</span>}{onApplyCurrent && <button type="button" disabled={saving} onClick={() => void run(onApplyCurrent)}>Save + apply to current block</button>}<button type="button" className="is-primary" disabled={saving} onClick={() => void run(onSave)}>{saving ? "Saving…" : saveLabel}</button></footer>
  </section>;
}

export default function AthleticsBlockTemplates({ templates, block, sessions, onSaveTemplate, onCreateTemplate, onUpdateBlock, onSchedule }: Props) {
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? 0);
  const [creating, setCreating] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [blockName, setBlockName] = useState("");
  const [scheduleWeeks, setScheduleWeeks] = useState(4);
  const [scheduling, setScheduling] = useState(false);
  const template = templates.find((item) => item.id === templateId) ?? templates[0];
  const templateDefinition = useMemo(() => template ? { name: template.name, goal: template.goal, weekCount: template.weekCount, days: template.days, phases: template.phases } : null, [template]);
  const currentDefinition = useMemo(() => block ? getTrainingBlockDefinition(block, sessions) : null, [block, sessions]);
  const editorDefinition = creating ? blankDefinition() : templateDefinition ?? currentDefinition ?? blankDefinition();
  const linkedToCurrent = Boolean(block?.id && template?.id && block.templateId === template.id);

  return <section className="athletics-build-page">
    <header><div><span className="text-label">Build / Edit Block</span><h2>Design your training week</h2><p>Add as many workouts or activities as each day needs. Nothing reaches Planner until you schedule the finished block.</p></div><button type="button" className="is-new" onClick={() => { setCreating(true); setScheduleOpen(false); }}>＋ New Block</button></header>
    <div className="athletics-build-toolbar"><label><span>Saved blocks</span><select disabled={creating || !templates.length} value={template?.id ?? ""} onChange={(event) => { setCreating(false); setTemplateId(Number(event.target.value)); setScheduleOpen(false); }}>{templates.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><div>{creating && <button type="button" onClick={() => setCreating(false)}>Cancel new block</button>}<button type="button" disabled={creating || !template} onClick={() => { if (!template) return; setBlockName(template.name); setScheduleWeeks(template.weekCount); setScheduleOpen((current) => !current); }}>Schedule Block</button></div></div>
    {scheduleOpen && template && <section className="athletics-schedule-block"><div><span className="text-label">Send to Planner</span><h3>Schedule {template.name}</h3></div><label><span>Block name</span><input value={blockName} onChange={(event) => setBlockName(event.target.value)} /></label><label><span>Starts</span><input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label><label><span>Weeks</span><input type="number" min="1" max="12" value={scheduleWeeks} onChange={(event) => setScheduleWeeks(Number(event.target.value))} /></label><button type="button" disabled={scheduling || !startDate} onClick={async () => { setScheduling(true); try { await onSchedule(template.id!, { name: blockName || template.name, startDate, weekCount: scheduleWeeks }); setScheduleOpen(false); } finally { setScheduling(false); } }}>{scheduling ? "Creating Planner tasks…" : "Confirm and populate Planner"}</button></section>}
    <BlockEditor key={creating ? "new-block" : `template-${template?.id}-${template?.updatedAt}`} initial={editorDefinition} saveLabel={creating ? "Save New Block" : "Save Block"} onSave={async (input) => { if (creating || !template?.id) { const id = await onCreateTemplate(input); setTemplateId(id); setCreating(false); return "New block saved. You can now schedule it."; } await onSaveTemplate(template.id, input); return "Block saved."; }} onApplyCurrent={linkedToCurrent && block?.id ? async (input) => { await onSaveTemplate(template!.id!, input); const count = await onUpdateBlock(block.id!, input); return `Saved and synchronized ${count} unfinished Planner sessions.`; } : undefined} />
  </section>;
}
