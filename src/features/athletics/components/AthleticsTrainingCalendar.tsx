import { useMemo, useState } from "react";

import type { AthleticsPlannedSession, AthleticsSaturdayChoice, AthleticsTrainingBlock, PlannedActivity } from "../../../database/db";
import { getEffectivePlannedExercises } from "../services/septemberTrainingBlock";
import { getSessionScheduledDate, getTrainingSessionDisplayStatus } from "../services/trainingBlockService";

type Props = {
  block?: AthleticsTrainingBlock;
  sessions: AthleticsPlannedSession[];
  activities: PlannedActivity[];
  now: Date;
  selectedSessionId: number | null;
  installing: boolean;
  onInstall: () => Promise<void>;
  onSelect: (id: number | null) => void;
  onComplete: (session: AthleticsPlannedSession) => Promise<void>;
  onReopen: (session: AthleticsPlannedSession) => Promise<void>;
  onSaturdayChoice: (session: AthleticsPlannedSession, choice: AthleticsSaturdayChoice) => Promise<void>;
  onMove: (session: AthleticsPlannedSession, date: string) => Promise<void>;
  onSkip: (session: AthleticsPlannedSession) => Promise<void>;
  onExerciseChoice: (sessionId: number, exerciseId: string, name: string) => Promise<void>;
};

function toDateKey(date: Date) { return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-"); }
function formatDate(dateKey: string, options: Intl.DateTimeFormatOptions) { return new Intl.DateTimeFormat("en-US", options).format(new Date(`${dateKey}T12:00:00`)); }

export default function AthleticsTrainingCalendar({ block, sessions, activities, now, selectedSessionId, installing, onInstall, onSelect, onComplete, onReopen, onSaturdayChoice, onMove, onSkip, onExerciseChoice }: Props) {
  const [moveDate, setMoveDate] = useState("");
  const todayKey = toDateKey(now);
  const selected = sessions.find((item) => item.id === selectedSessionId) ?? null;
  const selectedStatus = selected ? getTrainingSessionDisplayStatus(selected, activities, todayKey) : null;
  const weeks = useMemo(() => Array.from({ length: 4 }, (_, index) => sessions.filter((item) => item.weekNumber === index + 1)), [sessions]);
  const actionable = sessions.filter((item) => item.kind !== "recovery");
  const completed = actionable.filter((item) => getTrainingSessionDisplayStatus(item, activities, todayKey) === "completed").length;
  const activeWeek = weeks.findIndex((week) => week.some((item) => getSessionScheduledDate(item, activities) === todayKey)) + 1;

  if (!block) return <section className="athletics-plan-import">
    <div className="athletics-plan-import-copy"><span className="text-label">Training blocks</span><h2>September is ready.</h2><p>A four-week hypertrophy and athletic-development block, translated into structured workouts and linked Planner tasks.</p><div><span>65–70%</span><small>Hypertrophy emphasis</small><span>30–35%</span><small>Athletic development</small></div></div>
    <div className="athletics-plan-import-preview"><header><span>Aug 31 — Sep 27</span><strong>4 weeks · 20 planned sessions</strong></header>{["MON · Sand Volleyball", "TUE · Upper A", "WED · Lower A", "THU · Upper B", "FRI · Lower B", "SAT · Recovery / Volleyball", "SUN · Full Rest"].map((item) => <span key={item}>{item}</span>)}<button type="button" disabled={installing} onClick={onInstall}>{installing ? "Building your calendar…" : "Add September block"}</button><small>Previewed, duplicate-safe, and additive. Existing training data stays untouched.</small></div>
  </section>;

  return <section className="athletics-training-calendar">
    <header className="athletics-block-header"><div><span className="text-label">Active block</span><h2>{block.name}</h2><p>{block.goal}</p></div><div className="athletics-block-progress"><strong>{completed}<small> / {actionable.length}</small></strong><span>sessions complete</span><i><span style={{ width: `${actionable.length ? completed / actionable.length * 100 : 0}%` }} /></i></div></header>
    <div className="athletics-current-phase"><span>{activeWeek ? `Current training week · Week ${activeWeek}` : todayKey < block.startDate ? "Block begins August 31" : "Transition period"}</span><strong>{activeWeek ? weeks[activeWeek - 1]?.[0]?.phaseName : "September Training Block"}</strong><p>{activeWeek ? weeks[activeWeek - 1]?.[0]?.phaseGuidance : "Four complete Monday–Sunday training weeks."}</p></div>
    <div className="athletics-block-weeks">{weeks.map((week, index) => <article className={`athletics-block-week${activeWeek === index + 1 ? " is-current" : ""}`} key={index}><header><span>Week {index + 1}</span><strong>{week[0]?.phaseName}</strong><small>{week[0] && `${formatDate(week[0].date, { month: "short", day: "numeric" })} — ${formatDate(week.at(-1)!.date, { month: "short", day: "numeric" })}`}</small></header><div>{week.map((session) => {
      const date = getSessionScheduledDate(session, activities); const status = getTrainingSessionDisplayStatus(session, activities, todayKey);
      return <button type="button" key={session.id} className={`is-${session.kind} status-${status}${session.reducedVolume ? " is-reduced" : ""}`} onClick={() => onSelect(session.id!)}><time><span>{formatDate(date, { weekday: "short" })}</span><strong>{formatDate(date, { day: "numeric" })}</strong></time><span><strong>{session.name}</strong><small>{session.focus}</small></span><i>{status === "completed" ? "✓" : status === "missed" ? "Missed" : status === "skipped" ? "Skipped" : session.reducedVolume ? "Reduced" : session.kind === "recovery" ? "Rest" : "Planned"}</i></button>;
    })}</div></article>)}</div>

    {selected && <div className="athletics-modal-backdrop athletics-session-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onSelect(null); }}><section className={`athletics-session-modal${selected.kind === "recovery" ? " is-compact" : ""}`}><header><div><span className="text-label">Week {selected.weekNumber} · {selected.phaseName}</span><h2>{selected.name}</h2><p>{formatDate(getSessionScheduledDate(selected, activities), { weekday: "long", month: "long", day: "numeric" })} · {selected.focus}</p></div><button type="button" onClick={() => onSelect(null)}>×</button></header>
      <div className="athletics-session-phase"><strong>{selected.phaseName}</strong><span>{selected.phaseGuidance}</span></div>
      {selected.reducedVolume && <div className="athletics-session-adjustment"><strong>Reduced-volume session</strong><span>{selected.weekNumber === 4 ? "Week 4 fatigue reduction is active." : "Saturday volleyball is active. Hypertrophy sets are reduced while explosive work stays crisp."}</span></div>}
      {selected.saturdayChoice && <div className="athletics-saturday-choice"><span className="text-label">Saturday plan</span><div><button disabled={selectedStatus === "completed"} className={selected.saturdayChoice === "recovery" ? "is-selected" : ""} type="button" onClick={() => onSaturdayChoice(selected, "recovery")}>Recovery</button><button disabled={selectedStatus === "completed"} className={selected.saturdayChoice === "volleyball" ? "is-selected" : ""} type="button" onClick={() => onSaturdayChoice(selected, "volleyball")}>Sand Volleyball</button></div><small>{selectedStatus === "completed" ? "Completed sessions are locked." : "Selecting volleyball automatically reduces Friday Lower B."}</small></div>}
      {selected.exercises.length > 0 && <div className="athletics-session-exercises">{(["explosive", "hypertrophy"] as const).map((category) => {
        const exercises = getEffectivePlannedExercises(selected.exercises, Boolean(selected.reducedVolume)).filter((item) => item.category === category); if (!exercises.length) return null;
        return <section key={category}><header><span>{category === "explosive" ? "Athletic / Explosive" : "Strength / Hypertrophy"}</span><small>{category === "explosive" ? "Quality first · full recovery" : "Double progression guidance"}</small></header>{exercises.map((exercise, index) => <article key={exercise.id}><span>{String(index + 1).padStart(2, "0")}</span><div>{exercise.alternatives?.length ? <select value={exercise.name} onChange={(event) => onExerciseChoice(selected.id!, exercise.id, event.target.value)}>{exercise.alternatives.map((option) => <option key={option}>{option}</option>)}</select> : <strong>{exercise.name}</strong>}<small>{exercise.category === "explosive" ? "Quality movement" : "Prescribed work"}</small></div><b>{exercise.targetLabel}</b></article>)}</section>;
      })}</div>}
      {selected.notes && <p className="athletics-session-notes">{selected.notes}</p>}
      {selected.kind === "recovery" && !selected.saturdayChoice ? <footer className="is-compact-footer"><span>Recovery days stay intentionally clear.</span><button type="button" onClick={() => onSelect(null)}>Close</button></footer> : <footer><div>{selectedStatus === "missed" && <><strong>Missed · choose what happens next</strong><button type="button" onClick={() => onMove(selected, todayKey)}>Move to today</button></>}<label>Choose date<input type="date" value={moveDate} onChange={(event) => setMoveDate(event.target.value)} /></label>{moveDate && <button type="button" onClick={async () => { await onMove(selected, moveDate); setMoveDate(""); }}>Move</button>}<button type="button" className="is-skip" disabled={selected.kind === "recovery" || selectedStatus === "completed" || selectedStatus === "skipped"} onClick={() => onSkip(selected)}>Skip</button></div>{selectedStatus === "completed" && <button type="button" className="athletics-reopen-session" onClick={() => onReopen(selected)}>Reopen</button>}{selected.kind !== "recovery" && selectedStatus !== "skipped" && selectedStatus !== "completed" && <button type="button" className="athletics-primary-button" onClick={() => onComplete(selected)}>Mark complete ✓</button>}</footer>}
    </section></div>}
  </section>;
}
