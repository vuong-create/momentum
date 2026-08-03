import { useState } from "react";
import type { AthleticsWorkout } from "../../../database/db";

type AthleticsHistoryProps = {
  workouts: AthleticsWorkout[];
  onRemove: (workout: AthleticsWorkout) => Promise<void>;
};

function formatDate(dateKey: string) {
  return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" })
    .format(new Date(`${dateKey}T12:00:00`));
}

export default function AthleticsHistory({ workouts, onRemove }: AthleticsHistoryProps) {
  const completed = workouts.filter((workout) => workout.status === "completed");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = completed.find((workout) => workout.id === selectedId) ?? null;

  return (
    <section className="athletics-history-view">
      <header className="athletics-section-heading"><div><span className="text-label">History</span><h2>The work, kept quietly</h2><p>Every gym session and volleyball day in one chronological record.</p></div><strong>{completed.length}<small> sessions</small></strong></header>
      {completed.length === 0 ? (
        <div className="athletics-card athletics-history-empty"><strong>No sessions yet.</strong><span>Completed training will build this timeline automatically.</span></div>
      ) : (
        <div className="athletics-history-layout">
          <div className="athletics-history-list">
            {completed.map((workout) => {
              const totalSets = workout.exercises.reduce((sum, exercise) => sum + exercise.sets.filter((set) => set.completed).length, 0);
              return (
                <button type="button" key={workout.id} className={selectedId === workout.id ? "is-selected" : ""} onClick={() => setSelectedId(workout.id!)}>
                  <time><strong>{new Intl.DateTimeFormat("en-US", { day: "2-digit" }).format(new Date(`${workout.date}T12:00:00`))}</strong><small>{new Intl.DateTimeFormat("en-US", { month: "short" }).format(new Date(`${workout.date}T12:00:00`))}</small></time>
                  <span className={`athletics-kind-mark is-${workout.kind}`}>{workout.kind === "gym" ? "G" : "V"}</span>
                  <span><strong>{workout.name}</strong><small>{workout.kind === "gym" ? `${workout.exercises.length} exercises · ${totalSets} sets` : "Volleyball session"}</small></span>
                  {workout.personalRecords.length > 0 && <i>{workout.personalRecords.length} PR</i>}
                  <b>›</b>
                </button>
              );
            })}
          </div>
          <aside className="athletics-history-detail">
            {selected ? (
              <>
                <header><div><span className="text-label">{formatDate(selected.date)}</span><h3>{selected.name}</h3></div><button type="button" onClick={() => onRemove(selected)}>Remove</button></header>
                {selected.kind === "volleyball" ? (
                  <div className="athletics-history-volleyball"><span className="athletics-sport-mark"><i /><i /><i /></span><strong>Session logged</strong><p>No extra data needed. Showing up is the record.</p></div>
                ) : selected.exercises.map((exercise) => (
                  <section key={exercise.id}><h4>{exercise.name}</h4><div>{exercise.sets.filter((set) => set.completed).map((set, index) => <span key={set.id}><small>Set {index + 1}</small><strong>{set.weight} lb × {set.reps}</strong></span>)}</div></section>
                ))}
                {selected.personalRecords.length > 0 && <div className="athletics-history-prs"><span className="text-label">Personal records</span>{selected.personalRecords.map((record) => <strong key={`${record.exerciseName}-${record.type}`}>◇ {record.exerciseName} · {record.weight} lb × {record.reps}</strong>)}</div>}
              </>
            ) : <div className="athletics-empty"><strong>Select a session.</strong><span>Its exercises, sets, and records will appear here.</span></div>}
          </aside>
        </div>
      )}
    </section>
  );
}
