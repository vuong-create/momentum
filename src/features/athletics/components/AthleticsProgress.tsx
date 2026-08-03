import { useState } from "react";
import type { AthleticsWorkout } from "../../../database/db";
import type { ProgressionSummary } from "../../xp/progression";
import {
  getAthleticsHeatmapDays,
  getExerciseBests,
  getMonthSummary,
  getRecentPersonalRecords,
} from "../services/athleticsQueries";

type AthleticsProgressProps = {
  workouts: AthleticsWorkout[];
  now: Date;
  pillarXP: number;
  progression: ProgressionSummary;
};

export default function AthleticsProgress({ workouts, now, pillarXP, progression }: AthleticsProgressProps) {
  const summary = getMonthSummary(workouts, now);
  const heatmap = getAthleticsHeatmapDays(workouts, now);
  const exerciseBests = getExerciseBests(workouts);
  const records = getRecentPersonalRecords(workouts);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const selected = heatmap.find((day) => day.dateKey === selectedDate);

  return (
    <section className="athletics-progress-view">
      <header className="athletics-section-heading"><div><span className="text-label">Progress</span><h2>Consistency and strength</h2><p>Generated from training—not another set of numbers to maintain.</p></div></header>
      <div className="athletics-progress-stats">
        <article><span>Workouts</span><strong>{summary.workouts}</strong><small>this month</small></article>
        <article><span>Total sets</span><strong>{summary.sets}</strong><small>this month</small></article>
        <article><span>Volleyball</span><strong>{summary.volleyball}</strong><small>sessions</small></article>
        <article><span>New PRs</span><strong>{summary.prs}</strong><small>this month</small></article>
      </div>
      <article className="athletics-level-card">
        <div><span className="text-label">Athletics pillar</span><strong>Level {progression.level}</strong><small>{pillarXP} XP from completed training</small></div>
        <div><span style={{ width: `${progression.percentage}%` }} /></div>
        <p>{progression.xpToNextLevel} XP to Level {progression.level + 1}</p>
      </article>
      <article className="athletics-heatmap-card">
        <header><div><span className="text-label">Last 52 weeks</span><h3>Training rhythm</h3></div><div className="athletics-heatmap-legend"><span>Less</span><i /><i className="level-1" /><i className="level-2" /><i className="level-3" /><span>More</span></div></header>
        <div className="athletics-heatmap-scroll"><div className="athletics-heatmap">{heatmap.map((day) => <button type="button" key={day.dateKey} disabled={day.date > now} className={[day.level ? `level-${day.level}` : "", selectedDate === day.dateKey ? "is-selected" : ""].filter(Boolean).join(" ")} title={`${day.dateKey} · ${day.count} sessions`} onClick={() => setSelectedDate(selectedDate === day.dateKey ? null : day.dateKey)} />)}</div></div>
        {selected && <div className="athletics-heatmap-detail"><strong>{new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(selected.date)}</strong><span>{selected.workouts.length ? selected.workouts.map((workout) => workout.name).join(" · ") : "Rest day"}</span></div>}
      </article>
      <div className="athletics-progress-lower">
        <article className="athletics-card athletics-exercise-bests"><header><div><span className="text-label">Exercise progress</span><h3>Current bests</h3></div></header>{exerciseBests.length ? exerciseBests.slice(0, 8).map((exercise) => <div key={exercise.name}><span><strong>{exercise.name}</strong><small>{exercise.sessions} {exercise.sessions === 1 ? "session" : "sessions"}</small></span><b>{exercise.weight} lb × {exercise.reps}</b></div>) : <div className="athletics-empty"><strong>No exercise history yet.</strong><span>Your strongest completed sets will appear here.</span></div>}</article>
        <article className="athletics-card athletics-pr-history"><header><div><span className="text-label">Milestones</span><h3>PR history</h3></div></header>{records.length ? records.slice(0, 8).map((record) => <div key={`${record.workoutId}-${record.exerciseName}-${record.type}`}><span>◇</span><span><strong>{record.exerciseName}</strong><small>{record.type === "weight" ? "Weight PR" : "Rep PR"} · {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(`${record.date}T12:00:00`))}</small></span><b>{record.weight} × {record.reps}</b></div>) : <div className="athletics-empty"><strong>Progress will introduce itself.</strong><span>No manual PR entry required.</span></div>}</article>
      </div>
    </section>
  );
}
