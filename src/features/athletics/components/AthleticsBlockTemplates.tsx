import { useMemo, useState, type DragEvent } from "react";

import type {
  AthleticsBlockTemplate,
  AthleticsBlockTemplateActivity,
  AthleticsPlannedExercise,
  AthleticsPlannedSession,
  AthleticsTrainingBlock,
  PlannedActivity,
} from "../../../database/db";
import { getTrainingBlockDefinition, parseAthleticsBlockDump, type AthleticsBlockDefinitionInput } from "../services/trainingBlockService";

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

// Stored offsets remain Monday-first for backward compatibility. The board is intentionally Sunday-first.
const storedDayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const sundayFirstIndices = [6, 0, 1, 2, 3, 4, 5];
const activityLabels: Record<AthleticsBlockTemplateActivity["kind"], string> = { gym: "Workout", volleyball: "Volleyball", custom: "Activity", recovery: "Recovery" };

function localId(prefix: string) { return `${prefix}-${crypto.randomUUID()}`; }
function cloneExercises(exercises: AthleticsPlannedExercise[]) { return exercises.map((item) => ({ ...item, alternatives: item.alternatives ? [...item.alternatives] : undefined })); }
function cloneActivity(activity: AthleticsBlockTemplateActivity) { return { ...activity, exercises: cloneExercises(activity.exercises) }; }
function cloneDefinition(input: AthleticsBlockDefinitionInput): AthleticsBlockDefinitionInput {
  return { ...input, activityLibrary: (input.activityLibrary ?? []).map(cloneActivity), days: input.days.map((day) => ({ ...day, activities: (day.activities ?? []).map(cloneActivity) })), phases: input.phases.map((phase) => ({ ...phase })) };
}
function blankDefinition(): AthleticsBlockDefinitionInput {
  return {
    name: "Untitled Training Block",
    goal: "",
    weekCount: 4,
    activityLibrary: [],
    days: storedDayNames.map((_, dayOffset) => ({ id: localId("day"), dayOffset, activities: [] })),
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
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [dump, setDump] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  const selected = (() => {
    const libraryActivity = (draft.activityLibrary ?? []).find((item) => item.id === selectedActivityId);
    if (libraryActivity) return { activity: libraryActivity, dayIndex: null as number | null };
    for (let dayIndex = 0; dayIndex < draft.days.length; dayIndex += 1) {
      const activity = draft.days[dayIndex].activities.find((item) => item.id === selectedActivityId);
      if (activity) return { activity, dayIndex };
    }
    return null;
  })();

  function updateActivity(id: string, update: (activity: AthleticsBlockTemplateActivity) => AthleticsBlockTemplateActivity) {
    setDraft((current) => ({
      ...current,
      activityLibrary: (current.activityLibrary ?? []).map((activity) => activity.id === id ? update(activity) : activity),
      days: current.days.map((day) => ({ ...day, activities: day.activities.map((activity) => activity.id === id ? update(activity) : activity) })),
    }));
  }
  function moveActivity(id: string, targetDayIndex: number | null) {
    setDraft((current) => {
      const all = [...(current.activityLibrary ?? []), ...current.days.flatMap((day) => day.activities)];
      const activity = all.find((item) => item.id === id);
      if (!activity) return current;
      const days = current.days.map((day) => ({ ...day, activities: day.activities.filter((item) => item.id !== id) }));
      const library = (current.activityLibrary ?? []).filter((item) => item.id !== id);
      if (targetDayIndex === null) library.push(activity);
      else days[targetDayIndex] = { ...days[targetDayIndex], activities: [...days[targetDayIndex].activities, activity] };
      return { ...current, activityLibrary: library, days };
    });
  }
  function deleteActivity(id: string) {
    setDraft((current) => ({ ...current, activityLibrary: (current.activityLibrary ?? []).filter((item) => item.id !== id), days: current.days.map((day) => ({ ...day, activities: day.activities.filter((item) => item.id !== id) })) }));
    if (selectedActivityId === id) setSelectedActivityId(null);
  }
  function addActivity(kind: "gym" | "volleyball" | "custom") {
    const activity = newActivity(kind);
    setDraft((current) => ({ ...current, activityLibrary: [...(current.activityLibrary ?? []), activity] }));
    setSelectedActivityId(activity.id);
  }
  function setWeekCount(value: number) {
    const weekCount = Math.min(12, Math.max(1, value || 1));
    setDraft((current) => ({ ...current, weekCount, phases: Array.from({ length: weekCount }, (_, index) => current.phases[index] ?? { weekNumber: index + 1, name: `Week ${index + 1}`, guidance: "Train with intention and recover well." }) }));
  }
  function beginDrag(event: DragEvent, id: string) { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/momentum-athletics-activity", id); }
  function dropOn(event: DragEvent, targetDayIndex: number | null) { event.preventDefault(); const id = event.dataTransfer.getData("text/momentum-athletics-activity"); if (id) moveActivity(id, targetDayIndex); }
  async function run(action: (input: AthleticsBlockDefinitionInput) => Promise<string>) {
    if (saving) return; setSaving(true); setNotice("");
    try { setNotice(await action(draft)); } finally { setSaving(false); }
  }
  function importDump() {
    const imported = parseAthleticsBlockDump(dump);
    if (!imported.length) { setNotice("Add workout headings with exercises underneath them."); return; }
    setDraft((current) => ({ ...current, activityLibrary: [...(current.activityLibrary ?? []), ...imported] }));
    setDump(""); setNotice(`${imported.length} workout${imported.length === 1 ? "" : "s"} added to the workout tray.`); setSelectedActivityId(imported[0].id);
  }

  const renderCard = (activity: AthleticsBlockTemplateActivity, dayIndex: number | null) => <article key={activity.id} draggable onDragStart={(event) => beginDrag(event, activity.id)} className={`athletics-workout-card${selectedActivityId === activity.id ? " is-selected" : ""}`} onClick={() => setSelectedActivityId(activity.id)}>
    <span className="athletics-card-grip">⠿</span><div><strong>{activity.name}</strong><small>{activity.kind === "gym" ? `${activity.exercises.length} exercises` : activityLabels[activity.kind]}{activity.focus ? ` · ${activity.focus}` : ""}</small></div>
    <button type="button" aria-label={dayIndex === null ? `Delete ${activity.name}` : `Remove ${activity.name} from ${storedDayNames[dayIndex]}`} onClick={(event) => { event.stopPropagation(); if (dayIndex === null) deleteActivity(activity.id); else moveActivity(activity.id, null); }}>{dayIndex === null ? "×" : "↩"}</button>
  </article>;

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

    <section className="athletics-workout-tray" onDragOver={(event) => event.preventDefault()} onDrop={(event) => dropOn(event, null)}>
      <header><div><span className="text-label">Workout tray</span><h3>Build once, place anywhere</h3><p>Drag a card onto a day. Removing it from the week returns it here.</p></div><div><button type="button" onClick={() => addActivity("gym")}>＋ Workout</button><button type="button" onClick={() => addActivity("volleyball")}>＋ Volleyball</button><button type="button" onClick={() => addActivity("custom")}>＋ Activity</button></div></header>
      <div>{(draft.activityLibrary ?? []).length ? (draft.activityLibrary ?? []).map((activity) => renderCard(activity, null)) : <span className="athletics-empty-tray">Drop removed cards here, add one, or use Block Dump below.</span>}</div>
    </section>

    <section className="athletics-week-board" aria-label="Sunday through Saturday training week">
      {sundayFirstIndices.map((dayIndex) => { const day = draft.days[dayIndex]; return <section key={day.id} className="athletics-week-dropzone" onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; }} onDrop={(event) => dropOn(event, dayIndex)}><header><span>{storedDayNames[dayIndex].slice(0, 3)}</span><strong>{storedDayNames[dayIndex]}</strong></header><div>{day.activities.length ? day.activities.map((activity) => renderCard(activity, dayIndex)) : <span>Rest</span>}</div></section>; })}
    </section>

    {selected && <section className="athletics-card-editor">
      <header><div><span className="text-label">Selected card</span><h3>{selected.activity.name}</h3></div><label><span>Place on</span><select value={selected.dayIndex === null ? "library" : String(selected.dayIndex)} onChange={(event) => moveActivity(selected.activity.id, event.target.value === "library" ? null : Number(event.target.value))}><option value="library">Workout tray</option>{sundayFirstIndices.map((dayIndex) => <option key={dayIndex} value={dayIndex}>{storedDayNames[dayIndex]}</option>)}</select></label></header>
      <div className="athletics-card-fields"><label><span>Type</span><select value={selected.activity.kind} onChange={(event) => { const kind = event.target.value as AthleticsBlockTemplateActivity["kind"]; updateActivity(selected.activity.id, (activity) => ({ ...activity, kind, exercises: kind === "gym" ? activity.exercises : [], volleyballType: kind === "volleyball" ? "practice" : undefined })); }}><option value="gym">Workout</option><option value="volleyball">Volleyball</option><option value="custom">Custom activity</option></select></label><label><span>Name</span><input value={selected.activity.name} onChange={(event) => updateActivity(selected.activity.id, (activity) => ({ ...activity, name: event.target.value }))} /></label><label><span>Focus</span><input value={selected.activity.focus} onChange={(event) => updateActivity(selected.activity.id, (activity) => ({ ...activity, focus: event.target.value }))} /></label><label><span>Notes</span><input value={selected.activity.notes ?? ""} onChange={(event) => updateActivity(selected.activity.id, (activity) => ({ ...activity, notes: event.target.value }))} /></label></div>
      {selected.activity.kind === "gym" && <section className="athletics-builder-exercises"><header><span>Exercises</span><button type="button" onClick={() => updateActivity(selected.activity.id, (activity) => ({ ...activity, exercises: [...activity.exercises, newExercise()] }))}>＋ Add exercise</button></header>{selected.activity.exercises.map((exercise, index) => <div key={exercise.id}><span>{index + 1}</span><input aria-label="Exercise name" placeholder="Exercise name" value={exercise.name} onChange={(event) => updateActivity(selected.activity.id, (activity) => ({ ...activity, exercises: activity.exercises.map((item) => item.id === exercise.id ? { ...item, name: event.target.value } : item) }))} /><select aria-label="Exercise type" value={exercise.category} onChange={(event) => { const category = event.target.value as AthleticsPlannedExercise["category"]; updateActivity(selected.activity.id, (activity) => ({ ...activity, exercises: activity.exercises.map((item) => item.id === exercise.id ? { ...item, category, tracking: category === "explosive" ? "completion" : "load-reps" } : item) })); }}><option value="hypertrophy">Strength</option><option value="explosive">Athletic</option></select><input aria-label="Sets" type="number" min="1" max="12" value={exercise.prescribedSets} onChange={(event) => updateActivity(selected.activity.id, (activity) => ({ ...activity, exercises: activity.exercises.map((item) => item.id === exercise.id ? { ...item, prescribedSets: Number(event.target.value) } : item) }))} /><input aria-label="Reps or note" value={exercise.repRange ?? ""} onChange={(event) => updateActivity(selected.activity.id, (activity) => ({ ...activity, exercises: activity.exercises.map((item) => item.id === exercise.id ? { ...item, repRange: event.target.value } : item) }))} /><button type="button" aria-label={`Delete ${exercise.name || "exercise"}`} onClick={() => updateActivity(selected.activity.id, (activity) => ({ ...activity, exercises: activity.exercises.filter((item) => item.id !== exercise.id) }))}>×</button></div>)}</section>}
    </section>}

    <section className="athletics-block-dump"><header><div><span className="text-label">Block Dump</span><h3>Paste the plan. Arrange it after.</h3></div><p>Workout headings become cards. Every bullet underneath becomes an exercise, including loose weight, rep, and effort notes.</p></header><textarea value={dump} onChange={(event) => setDump(event.target.value)} placeholder={"Upper A\n- Incline Chest Machine - 75 for 6\n- Lat Pulldown - 120 for 8\n\nLower A\n- Pogo Circuit\n- Back Squat"} /><button type="button" disabled={!dump.trim()} onClick={importDump}>Create workout cards</button></section>
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
  const templateDefinition = useMemo(() => template ? { name: template.name, goal: template.goal, weekCount: template.weekCount, days: template.days, activityLibrary: template.activityLibrary ?? [], phases: template.phases } : null, [template]);
  const currentDefinition = useMemo(() => block ? getTrainingBlockDefinition(block, sessions) : null, [block, sessions]);
  const editorDefinition = creating ? blankDefinition() : templateDefinition ?? currentDefinition ?? blankDefinition();
  const linkedToCurrent = Boolean(block?.id && template?.id && block.templateId === template.id);

  return <section className="athletics-build-page">
    <header><div><span className="text-label">Build / Edit Block</span><h2>Arrange your training week</h2><p>Build reusable workout cards, then drag them across a Sunday–Saturday week. Nothing reaches Planner until you schedule the finished block.</p></div><button type="button" className="is-new" onClick={() => { setCreating(true); setScheduleOpen(false); }}>＋ New Block</button></header>
    <div className="athletics-build-toolbar"><label><span>Saved blocks</span><select disabled={creating || !templates.length} value={template?.id ?? ""} onChange={(event) => { setCreating(false); setTemplateId(Number(event.target.value)); setScheduleOpen(false); }}>{templates.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><div>{creating && <button type="button" onClick={() => setCreating(false)}>Cancel new block</button>}<button type="button" disabled={creating || !template} onClick={() => { if (!template) return; setBlockName(template.name); setScheduleWeeks(template.weekCount); setScheduleOpen((current) => !current); }}>Schedule Block</button></div></div>
    {scheduleOpen && template && <section className="athletics-schedule-block"><div><span className="text-label">Send to Planner</span><h3>Schedule {template.name}</h3></div><label><span>Block name</span><input value={blockName} onChange={(event) => setBlockName(event.target.value)} /></label><label><span>First Monday</span><input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label><label><span>Weeks</span><input type="number" min="1" max="12" value={scheduleWeeks} onChange={(event) => setScheduleWeeks(Number(event.target.value))} /></label><button type="button" disabled={scheduling || !startDate} onClick={async () => { setScheduling(true); try { await onSchedule(template.id!, { name: blockName || template.name, startDate, weekCount: scheduleWeeks }); setScheduleOpen(false); } finally { setScheduling(false); } }}>{scheduling ? "Creating Planner tasks…" : "Confirm and populate Planner"}</button></section>}
    <BlockEditor key={creating ? "new-block" : `template-${template?.id}-${template?.updatedAt}`} initial={editorDefinition} saveLabel={creating ? "Save New Block" : "Save Block"} onSave={async (input) => { if (creating || !template?.id) { const id = await onCreateTemplate(input); setTemplateId(id); setCreating(false); return "New block saved. You can now schedule it."; } await onSaveTemplate(template.id, input); return "Block saved."; }} onApplyCurrent={linkedToCurrent && block?.id ? async (input) => { await onSaveTemplate(template!.id!, input); const count = await onUpdateBlock(block.id!, input); return `Saved and synchronized ${count} unfinished Planner sessions.`; } : undefined} />
  </section>;
}
