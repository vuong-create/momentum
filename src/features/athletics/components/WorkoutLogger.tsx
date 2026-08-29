import { useState } from "react";
import type { AthleticsSet, AthleticsWorkout } from "../../../database/db";

type WorkoutLoggerProps = {
  workout: AthleticsWorkout;
  onUpdateSet: (exerciseId: string, setId: string, patch: Partial<Pick<AthleticsSet, "weight" | "reps" | "completed">>) => Promise<void>;
  onCompleteExercise: (exerciseId: string, completed: boolean) => Promise<void>;
  onRepeatSet: (exerciseId: string, setId: string) => Promise<void>;
  onAddSet: (exerciseId: string) => Promise<void>;
  onRemoveSet: (exerciseId: string, setId: string) => Promise<void>;
  onAddExercise: (name: string) => Promise<void>;
  onRemoveExercise: (exerciseId: string) => Promise<void>;
  onFinish: () => Promise<void>;
  onCancel: () => Promise<void>;
  finishing: boolean;
};

export default function WorkoutLogger({
  workout,
  onUpdateSet,
  onCompleteExercise,
  onRepeatSet,
  onAddSet,
  onRemoveSet,
  onAddExercise,
  onRemoveExercise,
  onFinish,
  onCancel,
  finishing,
}: WorkoutLoggerProps) {
  const [exerciseName, setExerciseName] = useState("");
  const allSets = workout.exercises.flatMap((exercise) => exercise.sets);
  const completedSets = allSets.filter((set) => set.completed).length;

  async function submitExercise() {
    if (!exerciseName.trim()) return;
    await onAddExercise(exerciseName);
    setExerciseName("");
  }

  return (
    <section className="athletics-workout-view">
      <header className="athletics-workout-header">
        <div>
          <button type="button" className="athletics-back-button" onClick={onCancel}>← Dashboard</button>
          <span className="text-label">Workout in progress</span>
          <h2>{workout.name}</h2>
          <p>Previous values are waiting. Train, tap, continue.</p>
        </div>
        <div className="athletics-workout-summary">
          <span><strong>{completedSets}</strong><small>sets done</small></span>
          <span><strong>{workout.exercises.length}</strong><small>exercises</small></span>
          <button type="button" disabled={completedSets === 0 || finishing} onClick={onFinish}>{finishing ? "Finishing…" : "Finish workout"}</button>
        </div>
      </header>

      <div className="athletics-exercise-stack">
        {workout.exercises.map((exercise, exerciseIndex) => {
          const exerciseCompleted = exercise.sets.length > 0 && exercise.sets.every((set) => set.completed);
          return (
          <article className={`athletics-exercise-card${exercise.category ? ` is-${exercise.category}` : ""}`} key={exercise.id}>
            <header>
              <span>{String(exerciseIndex + 1).padStart(2, "0")}</span>
              <div><h3>{exercise.name}</h3><small>{exercise.category === "explosive" ? "Athletic / Explosive" : exercise.category === "hypertrophy" ? "Strength / Hypertrophy" : "Exercise"} · {exercise.targetLabel ?? `${exercise.sets.length} sets`} · {exercise.sets.filter((set) => set.completed).length} done</small></div>
              <div className="athletics-exercise-actions">
                <button type="button" className="athletics-complete-exercise" onClick={() => onCompleteExercise(exercise.id, !exerciseCompleted)}>{exerciseCompleted ? "Reopen exercise" : "Complete exercise"}</button>
                <button type="button" onClick={() => onRemoveExercise(exercise.id)} aria-label={`Remove ${exercise.name}`}>Remove</button>
              </div>
            </header>
            <div className={`athletics-set-labels${exercise.tracking === "completion" ? " is-completion" : ""}`}><span>Set</span>{exercise.tracking === "completion" ? <><span>Quality target</span><span>Done</span></> : <><span>Weight</span><span>Reps</span><span>Quick adjust</span><span>Done</span></>}</div>
            <div className="athletics-set-list">
              {exercise.sets.map((set, setIndex) => (
                <div className={`athletics-set-row${set.completed ? " is-complete" : ""}${exercise.tracking === "completion" ? " is-completion" : ""}`} key={set.id}>
                  <span className="athletics-set-number">{setIndex + 1}</span>
                  {exercise.tracking === "completion" ? <strong className="athletics-quality-target">{exercise.repRange}{exercise.targetLabel?.includes("side") ? " / side" : ""}<small>Full recovery · stop when quality drops</small></strong> : <><label><input type="number" inputMode="decimal" min="0" value={set.weight} onChange={(event) => onUpdateSet(exercise.id, set.id, { weight: Number(event.target.value) })} /><small>lb</small></label>
                  <label><input type="number" inputMode="numeric" min="0" value={set.reps} onChange={(event) => onUpdateSet(exercise.id, set.id, { reps: Number(event.target.value) })} /><small>reps</small></label>
                  <div className="athletics-set-adjustments">
                    <button type="button" onClick={() => onUpdateSet(exercise.id, set.id, { weight: set.weight - 5 })}>−5</button>
                    <button type="button" onClick={() => onUpdateSet(exercise.id, set.id, { weight: set.weight + 5 })}>+5</button>
                    <button type="button" onClick={() => onUpdateSet(exercise.id, set.id, { reps: set.reps - 1 })}>−1</button>
                    <button type="button" onClick={() => onUpdateSet(exercise.id, set.id, { reps: set.reps + 1 })}>+1</button>
                    <button type="button" className="athletics-repeat-button" onClick={() => onRepeatSet(exercise.id, set.id)}>Repeat last</button>
                  </div></>}
                  <button type="button" className="athletics-set-complete" aria-label={`${set.completed ? "Reopen" : "Complete"} set ${setIndex + 1}`} onClick={() => onUpdateSet(exercise.id, set.id, { completed: !set.completed })}><span>✓</span></button>
                  {exercise.sets.length > 1 && <button type="button" className="athletics-remove-set" onClick={() => onRemoveSet(exercise.id, set.id)} aria-label={`Remove set ${setIndex + 1}`}>×</button>}
                </div>
              ))}
            </div>
            <button type="button" className="athletics-add-set" onClick={() => onAddSet(exercise.id)}>＋ Add set</button>
          </article>
          );
        })}
      </div>

      <div className="athletics-add-exercise">
        <span>＋</span>
        <input value={exerciseName} onChange={(event) => setExerciseName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void submitExercise(); }} placeholder="Add another exercise…" aria-label="Exercise name" />
        <button type="button" disabled={!exerciseName.trim()} onClick={submitExercise}>Add exercise</button>
      </div>
    </section>
  );
}
