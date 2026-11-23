import { datedWorkoutLabel } from "../../activities/services/activityDisplay";
import { useState } from "react";
import AddBlockSessionForm from "./AddBlockSessionForm";
import type { AddBlockSessionInput } from "../services/trainingOccurrenceService";

import type { AthleticsBlockTemplate, AthleticsBlockTemplateActivity, AthleticsPlannedSession, AthleticsSaturdayChoice, AthleticsTrainingBlock, PlannedActivity } from "../../../database/db";
import { getEffectivePlannedExercises } from "../services/septemberTrainingBlock";
import { getSessionScheduledDate, getTrainingSessionDisplayStatus } from "../services/trainingBlockService";

type Props = {
  block?: AthleticsTrainingBlock;
  template?: AthleticsBlockTemplate;
  onAdd: (input: AddBlockSessionInput) => Promise<void>;
  onDelete: (session: AthleticsPlannedSession) => Promise<void>;
  sessions: AthleticsPlannedSession[];
  activities: PlannedActivity[];
  now: Date;
  selectedSessionId: number | null;
  onBuild: () => void;
  onSelect: (id: number | null) => void;
  onComplete: (session: AthleticsPlannedSession) => Promise<void>;
  onReopen: (session: AthleticsPlannedSession) => Promise<void>;
  onSaturdayChoice: (session: AthleticsPlannedSession, choice: AthleticsSaturdayChoice) => Promise<void>;
  onMove: (session: AthleticsPlannedSession, date: string) => Promise<void>;
  onSkip: (session: AthleticsPlannedSession) => Promise<void>;
  onExerciseChoice: (sessionId: number, exerciseId: string, name: string) => Promise<void>;
  celebratingWeeks: number[];
};

function toDateKey(date: Date) { return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-"); }
function formatDate(dateKey: string, options: Intl.DateTimeFormatOptions) { return new Intl.DateTimeFormat("en-US", options).format(new Date(`${dateKey}T12:00:00`)); }
function addDays(dateKey: string, days: number) { const date = new Date(`${dateKey}T12:00:00`); date.setDate(date.getDate() + days); return toDateKey(date); }
function dayDistance(start: string, end: string) { return Math.floor((new Date(`${end}T12:00:00`).getTime() - new Date(`${start}T12:00:00`).getTime()) / 86_400_000); }
function startOfSunday(dateKey: string) { const date = new Date(`${dateKey}T12:00:00`); return addDays(dateKey, -date.getDay()); }
function endOfSaturday(dateKey: string) { const date = new Date(`${dateKey}T12:00:00`); return addDays(dateKey, 6 - date.getDay()); }

export default function AthleticsTrainingCalendar({ block, template, onAdd, onDelete, sessions, activities, now, selectedSessionId, onBuild, onSelect, onComplete, onReopen, onSaturdayChoice, onMove, onSkip, onExerciseChoice, celebratingWeeks }: Props) {
  const [moveDate, setMoveDate] = useState("");
  const [dragged, setDragged] = useState<number | null>(null);
  const [dropDate, setDropDate] = useState<string | null>(null);
  const [addDate, setAddDate] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  async function act(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true); setError("");
    try { await action(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update session."); }
    finally { setBusy(false); }
  }
  function move(session: AthleticsPlannedSession, date: string) {
    return act(async () => { await onMove(session, date); setMoveDate(""); setNotice(`${session.name} moved to ${date}.`); });
  }
  function openSession(id: number) { setMoveDate(""); setConfirmDelete(false); setError(""); onSelect(id); }
  const todayKey = toDateKey(now);
  const selected = sessions.find((item) => item.id === selectedSessionId) ?? null;
  const selectedStatus = selected ? getTrainingSessionDisplayStatus(selected, activities, todayKey) : null;
  const calendarStart = startOfSunday(block?.startDate ?? todayKey);
  const calendarEnd = endOfSaturday(block?.endDate ?? todayKey);
  const weeks = Array.from({ length: Math.max(1, Math.ceil((dayDistance(calendarStart, calendarEnd) + 1) / 7)) }, (_, index) => {
    const dates = Array.from({ length: 7 }, (__, dayIndex) => addDays(calendarStart, index * 7 + dayIndex));
    const weekSessions = sessions.filter((session) => dates.includes(getSessionScheduledDate(session, activities)));
    const representative = weekSessions.find((session) => getSessionScheduledDate(session, activities) !== dates[0]) ?? weekSessions[0];
    return { dates, sessions: weekSessions, weekNumber: index + 1, phaseName: template?.phases[index]?.name ?? representative?.phaseName, phaseGuidance: template?.phases[index]?.guidance ?? representative?.phaseGuidance };
  });
  const choices: AthleticsBlockTemplateActivity[] = [];
  for (const item of [...(template?.activityLibrary ?? []), ...(template?.days.flatMap((day) => day.activities ?? []) ?? []), ...sessions.filter((session) => session.kind !== "recovery").map((session) => ({ ...session, id: `session-${session.id}` }))]) {
    if (!choices.some((existing) => existing.name === item.name && existing.kind === item.kind)) choices.push(item);
  }
  const weekCount = weeks.length;
  const actionable = sessions.filter((item) => item.kind !== "recovery");
  const completed = actionable.filter((item) => getTrainingSessionDisplayStatus(item, activities, todayKey) === "completed").length;
  const activeWeekIndex = weeks.findIndex((week) => week.dates.includes(todayKey));
  const activeWeek = activeWeekIndex >= 0 ? weeks[activeWeekIndex] : null;

  if (!block) return <section className="athletics-plan-import">
    <div className="athletics-plan-import-copy"><span className="text-label">Current block</span><h2>No active training block.</h2><p>Your previous blocks remain preserved as history. Build or schedule a block that includes today to place it here.</p></div>
    <div className="athletics-plan-import-preview"><header><span>Sunday — Saturday</span><strong>Nothing is scheduled</strong></header><span>Design the weekly training structure.</span><span>Review its exact dates.</span><span>Then send only the finished block to Planner.</span><button type="button" onClick={onBuild}>Build / schedule a block</button><small>Expired blocks will not appear here or remain in unfinished Planner work.</small></div>
  </section>;

  return <section className="athletics-training-calendar">
    <header className="athletics-block-header"><div><span className="text-label">Current block</span><div className="athletics-block-switcher"><span><strong>{block.name}</strong><small>{formatDate(block.startDate, { month: "short", day: "numeric" })} — {formatDate(block.endDate, { month: "short", day: "numeric", year: "numeric" })}</small></span></div><p>{block.goal}</p></div><div className="athletics-block-progress"><strong>{completed}<small> / {actionable.length}</small></strong><span>sessions complete</span><i><span style={{ width: `${actionable.length ? completed / actionable.length * 100 : 0}%` }} /></i></div></header>
    <div className="athletics-current-phase"><span>{activeWeek ? `Current training week · Week ${activeWeek.weekNumber}` : todayKey < block.startDate ? `Block begins ${formatDate(block.startDate, { month: "long", day: "numeric" })}` : "Transition period"}</span><strong>{activeWeek?.phaseName ?? block.name}</strong><p>{activeWeek?.phaseGuidance ?? `${weekCount} complete Sunday–Saturday calendar ${weekCount === 1 ? "week" : "weeks"}.`}</p></div>
    <div className="athletics-occurrence-toolbar"><p>Drag sessions to the day they happened, or open one to choose a date. Only this block changes.</p><button type="button" onClick={() => setAddDate(todayKey >= block.startDate && todayKey <= block.endDate ? todayKey : block.startDate)}>＋ Add session</button></div>
    {error && <p role="alert" className="athletics-occurrence-message">{error}</p>}
    {notice && <p role="status" className="athletics-occurrence-message">{notice}</p>}
    {addDate && <AddBlockSessionForm key={addDate} block={block} initialDate={addDate} todayKey={todayKey} choices={choices} onCancel={() => setAddDate(null)} onSave={async (input) => { await onAdd(input); setAddDate(null); setNotice("Session added to this block and Planner."); }} />}
    <div className="athletics-block-weeks">{weeks.map((week, index) => {
      const weekActionable = week.sessions.filter((item) => item.kind !== "recovery"); const weekCompleted = weekActionable.length > 0 && weekActionable.every((item) => getTrainingSessionDisplayStatus(item, activities, todayKey) === "completed"); const completedCount = weekActionable.filter((item) => getTrainingSessionDisplayStatus(item, activities, todayKey) === "completed").length; const phaseName = week.phaseName ?? `Calendar week ${index + 1}`;
      return <article className={`athletics-block-week${activeWeekIndex === index ? " is-current" : ""}${weekCompleted ? " is-complete" : ""}${celebratingWeeks.includes(week.weekNumber) ? " is-celebrating" : ""}`} key={week.dates[0]}><header><span>Week {week.weekNumber}</span><strong>{weekCompleted ? `${phaseName} complete ✓` : phaseName}</strong><small>{formatDate(week.dates[0], { month: "short", day: "numeric" })} — {formatDate(week.dates[6], { month: "short", day: "numeric" })}</small><i><b style={{ width: `${weekActionable.length ? completedCount / weekActionable.length * 100 : 0}%` }} /></i></header><div>{week.dates.map((date) => {
        const daySessions = week.sessions.filter((session) => getSessionScheduledDate(session, activities) === date && !session.deletedAt);
        const withinBlock = date >= block.startDate && date <= block.endDate;
        return <section className={`athletics-block-day${dropDate === date ? " is-drop-target" : ""}${!withinBlock ? " is-outside-block" : ""}`} key={date} role="group" aria-label={`Sessions on ${date}`}
          onDragOver={(event) => { if (dragged && withinBlock && !busy) { event.preventDefault(); event.dataTransfer.dropEffect = "move"; setDropDate(date); } }}
          onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDropDate(null); }}
          onDrop={(event) => { event.preventDefault(); const session = sessions.find((item) => item.id === dragged); setDragged(null); setDropDate(null); if (session && withinBlock) void move(session, date); }}>
          <time dateTime={date}><span>{formatDate(date, { weekday: "short" })}</span><strong>{formatDate(date, { day: "numeric" })}</strong></time>
          <div>{daySessions.length ? daySessions.map((session) => { const status = getTrainingSessionDisplayStatus(session, activities, todayKey); return <button type="button" key={session.id} disabled={busy} draggable={!busy} aria-label={`${session.name} on ${date}`}
            onDragStart={(event) => { setDragged(session.id!); event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", String(session.id)); }}
            onDragEnd={() => { setDragged(null); setDropDate(null); }}
            className={`is-${session.kind} status-${status}${session.reducedVolume ? " is-reduced" : ""}${dragged === session.id ? " is-dragging" : ""}`}
            onClick={() => { if (!dragged) openSession(session.id!); }}><span><strong>{datedWorkoutLabel(session.name, date)}</strong><small>{session.focus}</small></span><i>{status === "completed" ? "✓" : status === "missed" ? "Missed" : status === "skipped" ? "Skipped" : status === "recovery" ? "Rest" : session.reducedVolume ? "Reduced" : "Planned"}</i></button>; }) : <span className="athletics-rest-day">{withinBlock ? "Rest" : "Outside block"}</span>}</div>
          {withinBlock && <button type="button" className="athletics-add-day-session" aria-label={`Add session on ${date}`} onClick={() => { setAddDate(date); window.requestAnimationFrame(() => document.querySelector(".athletics-occurrence-form")?.scrollIntoView({ block: "center", behavior: "smooth" })); }}>＋ Add</button>}
        </section>;
      })}</div></article>;
    })}</div>

    {selected && <div className="athletics-modal-backdrop athletics-session-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onSelect(null); }}><section role="dialog" aria-modal="true" aria-label={selected.name} className={`athletics-session-modal${selected.kind === "recovery" ? " is-compact" : ""}`}><header><div><span className="text-label">Week {selected.weekNumber} · {selected.phaseName}</span><h2>{selected.name}</h2><p>{formatDate(getSessionScheduledDate(selected, activities), { weekday: "long", month: "long", day: "numeric" })} · {selected.focus}</p></div><button type="button" onClick={() => onSelect(null)}>×</button></header>
      <div className="athletics-session-phase"><strong>{selected.phaseName}</strong><span>{selected.phaseGuidance}</span></div>
      {selected.reducedVolume && <div className="athletics-session-adjustment"><strong>Reduced-volume session</strong><span>{selected.weekNumber === 4 ? "Week 4 fatigue reduction is active." : "Saturday volleyball is active. Hypertrophy sets are reduced while explosive work stays crisp."}</span></div>}
      {selected.saturdayChoice && <div className="athletics-saturday-choice"><span className="text-label">Saturday plan</span><div><button disabled={selectedStatus === "completed"} className={selected.saturdayChoice === "recovery" ? "is-selected" : ""} type="button" onClick={() => onSaturdayChoice(selected, "recovery")}>Recovery</button><button disabled={selectedStatus === "completed"} className={selected.saturdayChoice === "volleyball" ? "is-selected" : ""} type="button" onClick={() => onSaturdayChoice(selected, "volleyball")}>Sand Volleyball</button></div><small>{selectedStatus === "completed" ? "Completed sessions are locked." : "Selecting volleyball automatically reduces Friday Lower B."}</small></div>}
      {selected.exercises.length > 0 && <div className="athletics-session-exercises">{(["explosive", "hypertrophy"] as const).map((category) => {
        const exercises = getEffectivePlannedExercises(selected.exercises, Boolean(selected.reducedVolume)).filter((item) => item.category === category); if (!exercises.length) return null;
        return <section key={category}><header><span>{category === "explosive" ? "Athletic / Explosive" : "Strength / Hypertrophy"}</span><small>{category === "explosive" ? "Quality first · full recovery" : "Double progression guidance"}</small></header>{exercises.map((exercise, index) => <article key={exercise.id}><span>{String(index + 1).padStart(2, "0")}</span><div>{exercise.alternatives?.length ? <select value={exercise.name} onChange={(event) => onExerciseChoice(selected.id!, exercise.id, event.target.value)}>{exercise.alternatives.map((option) => <option key={option}>{option}</option>)}</select> : <strong>{exercise.name}</strong>}<small>{exercise.category === "explosive" ? "Quality movement" : "Prescribed work"}</small></div><b>{exercise.targetLabel}</b></article>)}</section>;
      })}</div>}
      {selected.notes && <p className="athletics-session-notes">{selected.notes}</p>}
      {error && <p role="alert" className="athletics-occurrence-message">{error}</p>}
      <footer><div>
        <label>Move to date<input type="date" min={block.startDate} max={selectedStatus === "completed" && todayKey < block.endDate ? todayKey : block.endDate} value={moveDate} onChange={(event) => setMoveDate(event.target.value)} /></label>
        <button type="button" disabled={busy || !moveDate} onClick={() => void move(selected, moveDate)}>Move session</button>
        <button type="button" className="is-skip" disabled={busy || selected.kind === "recovery" || selectedStatus === "completed" || selectedStatus === "skipped"} onClick={() => void act(() => onSkip(selected))}>Skip</button>
        <button type="button" disabled={busy} onClick={() => setConfirmDelete(true)}>Delete session</button>
      </div>
      {selectedStatus === "completed" && <button type="button" disabled={busy} className="athletics-reopen-session" onClick={() => void act(() => onReopen(selected))}>Reopen</button>}
      {selected.kind !== "recovery" && selectedStatus !== "skipped" && selectedStatus !== "completed" && <button type="button" disabled={busy} className="athletics-primary-button" onClick={() => void act(() => onComplete(selected))}>Mark complete ✓</button>}
      </footer>
      {confirmDelete && <div className="athletics-delete-confirmation"><p>{selectedStatus === "completed" ? "Delete this completed session and remove its completion and XP credit?" : "Delete this session and its linked Planner task?"} Other sessions and the template stay unchanged.</p><button type="button" disabled={busy} onClick={() => setConfirmDelete(false)}>Keep session</button><button type="button" disabled={busy} onClick={() => void act(async () => { await onDelete(selected); setConfirmDelete(false); onSelect(null); })}>Confirm delete</button></div>}
    </section></div>}
  </section>;
}
