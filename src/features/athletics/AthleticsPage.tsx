import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useSearchParams } from "react-router-dom";

import {
  db,
  type AthleticsSet,
  type AthleticsWorkout,
  type AthleticsPlannedSession,
  type VolleyballSessionType,
} from "../../database/db";
import useExperience from "../../experience/useExperience";
import ActivityUndoToast from "../activities/components/ActivityUndoToast";
import useActivityUndo from "../activities/hooks/useActivityUndo";
import { softDeletePlannedActivity } from "../activities/services/activityService";
import { getXPBreakdown } from "../xp/XPService";
import AthleticsDashboard from "./components/AthleticsDashboard";
import AthleticsHistory from "./components/AthleticsHistory";
import AthleticsTrainingCalendar from "./components/AthleticsTrainingCalendar";
import AthleticsProgress from "./components/AthleticsProgress";
import AthleticsTemplates from "./components/AthleticsTemplates";
import WorkoutLogger from "./components/WorkoutLogger";
import {
  addWorkoutExercise,
  addWorkoutSet,
  completeAthleticsWorkout,
  createAthleticsTemplate,
  duplicateAthleticsTemplate,
  ensureStarterTemplates,
  logVolleyballSession,
  removeWorkoutExercise,
  removeWorkoutSet,
  repeatPreviousSet,
  restoreAthleticsWorkout,
  scheduleAthleticsTemplate,
  softDeleteAthleticsTemplate,
  softDeleteAthleticsWorkout,
  startCustomWorkout,
  startTemplateWorkout,
  startPlannedTrainingSession,
  logPlannedVolleyballSession,
  setWorkoutExerciseCompletion,
  updatePlannedExerciseChoice,
  updateAthleticsTemplate,
  updateWorkoutSet,
  visibleAthleticsTemplates,
  visibleAthleticsWorkouts,
  type AthleticsTemplateInput,
} from "./services/athleticsService";
import {
  installSeptember2026TrainingBlock,
  moveTrainingSession,
  setSaturdayTrainingChoice,
  skipTrainingSession,
  visibleTrainingBlocks,
  visibleTrainingSessions,
} from "./services/trainingBlockService";

import "./athletics.css";

type AthleticsView = "dashboard" | "calendar" | "workout" | "templates" | "history" | "progress";

const tabs: Array<{ id: AthleticsView; label: string; mark: string }> = [
  { id: "dashboard", label: "Dashboard", mark: "A" },
  { id: "calendar", label: "Calendar", mark: "C" },
  { id: "workout", label: "Workout", mark: "W" },
  { id: "templates", label: "Templates", mark: "T" },
  { id: "history", label: "History", mark: "H" },
  { id: "progress", label: "Progress", mark: "P" },
];

function getInitialView(): AthleticsView {
  const stored = sessionStorage.getItem("momentum.athletics.tab");
  return tabs.some((tab) => tab.id === stored) ? stored as AthleticsView : "dashboard";
}

export default function AthleticsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const experience = useExperience();
  const undo = useActivityUndo();
  const [view, setView] = useState<AthleticsView>(getInitialView);
  const [finishing, setFinishing] = useState(false);
  const [loggingVolleyball, setLoggingVolleyball] = useState<VolleyballSessionType | null>(null);
  const [installingBlock, setInstallingBlock] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const routedSessionId = Number(searchParams.get("session")) || null;
  const allTemplates = useLiveQuery(() => db.athleticsTemplates.toArray(), []) ?? [];
  const allWorkouts = useLiveQuery(() => db.athleticsWorkouts.toArray(), []) ?? [];
  const plannedActivities = useLiveQuery(() => db.plannedActivities.toArray(), []) ?? [];
  const allTrainingBlocks = useLiveQuery(() => db.athleticsTrainingBlocks.toArray(), []) ?? [];
  const allPlannedSessions = useLiveQuery(() => db.athleticsPlannedSessions.toArray(), []) ?? [];
  const xpEvents = useLiveQuery(() => db.xpEvents.toArray(), []) ?? [];
  const templates = visibleAthleticsTemplates(allTemplates);
  const workouts = visibleAthleticsWorkouts(allWorkouts);
  const trainingBlocks = visibleTrainingBlocks(allTrainingBlocks);
  const trainingSessions = visibleTrainingSessions(allPlannedSessions);
  const activeTrainingBlock = trainingBlocks.find((item) => item.active) ?? trainingBlocks.at(-1);
  const activeWorkout = workouts.find((workout) => workout.status === "active") ?? null;
  const athleticsXP = getXPBreakdown(xpEvents).contributions.find(({ pillar }) => pillar === "athletics")!;
  const month = `${experience.now.getFullYear()}-${String(experience.now.getMonth() + 1).padStart(2, "0")}`;
  const completedThisMonth = workouts.filter((workout) => workout.status === "completed" && workout.date.startsWith(month)).length;
  const displayView: AthleticsView = routedSessionId ? "calendar" : view;

  useEffect(() => { void ensureStarterTemplates(); }, []);

  function selectView(nextView: AthleticsView) {
    setView(nextView);
    sessionStorage.setItem("momentum.athletics.tab", nextView);
  }

  async function handleStartTemplate(id: number) {
    await startTemplateWorkout(id);
    experience.playFeedback("workout-started");
    selectView("workout");
  }

  async function handleStartCustom() {
    await startCustomWorkout();
    experience.playFeedback("workout-started");
    selectView("workout");
  }

  async function handleUpdateSet(
    exerciseId: string,
    setId: string,
    patch: Partial<Pick<AthleticsSet, "weight" | "reps" | "completed">>
  ) {
    if (!activeWorkout?.id) return;
    await updateWorkoutSet(activeWorkout.id, exerciseId, setId, patch);
    if (patch.completed === true) experience.playFeedback("set-completed");
    if (patch.completed === false) experience.playFeedback("task-reopened");
  }

  async function handleFinishWorkout() {
    if (!activeWorkout?.id || finishing) return;
    setFinishing(true);
    try {
      const result = await completeAthleticsWorkout(activeWorkout.id);
      experience.playFeedback(result.personalRecords.length ? "personal-record" : "workout-completed");
      selectView("dashboard");
      undo.show({
        message: result.personalRecords.length
          ? `${result.personalRecords.length} new ${result.personalRecords.length === 1 ? "PR" : "PRs"} · +${result.xpAwarded} XP`
          : result.plannedActivityId
            ? `Workout complete · plan finished · +${result.xpAwarded} XP`
            : `Workout complete · +${result.xpAwarded} XP`,
        undo: () => softDeleteAthleticsWorkout(result.workoutId),
      });
    } finally {
      setFinishing(false);
    }
  }

  async function handleCompleteExercise(exerciseId: string, completed: boolean) {
    if (!activeWorkout?.id) return;
    await setWorkoutExerciseCompletion(activeWorkout.id, exerciseId, completed);
    experience.playFeedback(completed ? "set-completed" : "task-reopened");
  }

  async function handleLogVolleyball(type: VolleyballSessionType) {
    if (loggingVolleyball) return;
    setLoggingVolleyball(type);
    try {
      const result = await logVolleyballSession(type);
      experience.playFeedback("volleyball-logged");
      undo.show({
        message: result.plannedActivityId ? `Volleyball logged · plan complete · +${result.xpAwarded} XP` : `Volleyball logged · +${result.xpAwarded} XP`,
        undo: () => softDeleteAthleticsWorkout(result.workoutId),
      });
    } finally {
      setLoggingVolleyball(null);
    }
  }

  async function handleInstallBlock() {
    if (installingBlock) return; setInstallingBlock(true);
    try { await installSeptember2026TrainingBlock(); experience.playFeedback("task-added"); }
    finally { setInstallingBlock(false); }
  }

  async function handleStartPlannedSession(session: AthleticsPlannedSession) {
    await startPlannedTrainingSession(session.id!); experience.playFeedback("workout-started"); setSelectedSessionId(null); setSearchParams({}); selectView("workout");
  }

  async function handleLogPlannedVolleyball(session: AthleticsPlannedSession) {
    const result = await logPlannedVolleyballSession(session.id!); experience.playFeedback("volleyball-logged"); setSelectedSessionId(null); setSearchParams({});
    undo.show({ message: `Volleyball logged · plan complete · +${result.xpAwarded} XP`, undo: () => softDeleteAthleticsWorkout(result.workoutId) });
  }

  function handleSelectSession(id: number | null) {
    setSelectedSessionId(id); setSearchParams(id ? { session: String(id) } : {}, { replace: true });
  }

  async function handleRemoveWorkout(workout: AthleticsWorkout) {
    if (!workout.id) return;
    await softDeleteAthleticsWorkout(workout.id);
    experience.playFeedback("task-dismissed");
    undo.show({ message: "Training session removed", undo: () => restoreAthleticsWorkout(workout.id!) });
  }

  async function handleCreateTemplate(input: AthleticsTemplateInput) {
    const id = await createAthleticsTemplate(input);
    experience.playFeedback("task-added");
    undo.show({ message: "Workout template created", undo: () => softDeleteAthleticsTemplate(id) });
  }

  async function handleUpdateTemplate(id: number, input: AthleticsTemplateInput) {
    await updateAthleticsTemplate(id, input);
    experience.playFeedback("task-updated");
  }

  async function handleDuplicateTemplate(id: number) {
    const duplicateId = await duplicateAthleticsTemplate(id);
    experience.playFeedback("task-added");
    undo.show({ message: "Workout template duplicated", undo: () => softDeleteAthleticsTemplate(duplicateId) });
  }

  async function handleDeleteTemplate(id: number) {
    await softDeleteAthleticsTemplate(id);
    experience.playFeedback("task-dismissed");
  }

  async function handleScheduleTemplate(id: number, date: string) {
    await scheduleAthleticsTemplate(id, date);
    experience.playFeedback("task-added");
    undo.show({ message: "Workout added to Planner", undo: async () => {
      const activity = await db.plannedActivities.where("activityKind").equals(`athletics-template:${id}`).filter((item) => item.scheduledDate === date && !item.deletedAt).last();
      if (activity?.id) await softDeletePlannedActivity(activity.id);
    } });
  }

  return (
    <div className="athletics-page">
      <header className="athletics-page-header">
        <div><span className="text-label">Train · Recover · Return</span><h1 className="font-pixel">Athletics</h1><p>Consistency without pressure. Progress without extra logging.</p></div>
        <div className="athletics-header-stats">
          <span><strong>{completedThisMonth}</strong><small>sessions this month</small></span>
          <span><strong>{workouts.filter((workout) => workout.status === "completed" && workout.kind === "volleyball").length}</strong><small>volleyball lifetime</small></span>
          <span className="athletics-header-level"><strong>Lv {athleticsXP.progression.level}</strong><small>{athleticsXP.xp} Athletics XP</small><i><span style={{ width: `${athleticsXP.progression.percentage}%` }} /></i></span>
        </div>
      </header>

      <nav className="athletics-tabs" aria-label="Athletics sections">
        {tabs.map((tab) => (
          <button key={tab.id} type="button" className={displayView === tab.id ? "is-selected" : ""} onClick={() => { setSearchParams({}); selectView(tab.id); }}>
            <span>{tab.mark}</span>{tab.label}
            {tab.id === "workout" && activeWorkout && <i aria-label="Workout in progress" />}
          </button>
        ))}
      </nav>

      <main className="athletics-content">
        {displayView === "dashboard" && <AthleticsDashboard templates={templates} workouts={workouts} plannedActivities={plannedActivities} now={experience.now} onStartTemplate={handleStartTemplate} onStartCustom={handleStartCustom} onLogVolleyball={handleLogVolleyball} onOpenWorkout={() => selectView("history")} onOpenTemplates={() => selectView("templates")} loggingVolleyball={loggingVolleyball} />}
        {displayView === "calendar" && <AthleticsTrainingCalendar block={activeTrainingBlock} sessions={activeTrainingBlock?.id ? trainingSessions.filter((item) => item.blockId === activeTrainingBlock.id) : []} activities={plannedActivities} now={experience.now} selectedSessionId={routedSessionId ?? selectedSessionId} installing={installingBlock} onInstall={handleInstallBlock} onSelect={handleSelectSession} onStart={handleStartPlannedSession} onLogVolleyball={handleLogPlannedVolleyball} onSaturdayChoice={async (session, choice) => { await setSaturdayTrainingChoice(session.id!, choice); experience.playFeedback("task-updated"); }} onMove={async (session, date) => { await moveTrainingSession(session.id!, date); experience.playFeedback("task-updated"); }} onSkip={async (session) => { await skipTrainingSession(session.id!); experience.playFeedback("task-dismissed"); setSelectedSessionId(null); setSearchParams({}); }} onExerciseChoice={async (sessionId, exerciseId, name) => { await updatePlannedExerciseChoice(sessionId, exerciseId, name); experience.playFeedback("task-updated"); }} />}
        {displayView === "workout" && activeWorkout && <WorkoutLogger workout={activeWorkout} onUpdateSet={handleUpdateSet} onCompleteExercise={handleCompleteExercise} onRepeatSet={(exerciseId, setId) => repeatPreviousSet(activeWorkout.id!, exerciseId, setId)} onAddSet={(exerciseId) => addWorkoutSet(activeWorkout.id!, exerciseId)} onRemoveSet={(exerciseId, setId) => removeWorkoutSet(activeWorkout.id!, exerciseId, setId)} onAddExercise={(name) => addWorkoutExercise(activeWorkout.id!, name)} onRemoveExercise={(exerciseId) => removeWorkoutExercise(activeWorkout.id!, exerciseId)} onFinish={handleFinishWorkout} onCancel={async () => selectView("dashboard")} finishing={finishing} />}
        {displayView === "workout" && !activeWorkout && <section className="athletics-no-workout"><span className="text-label">Workout</span><h2>Nothing active.</h2><p>Choose a remembered routine or begin with a blank page.</p><div>{templates.slice(0, 3).map((template) => <button key={template.id} type="button" onClick={() => handleStartTemplate(template.id!)}>{template.name}<span>→</span></button>)}<button type="button" onClick={handleStartCustom}>Custom<span>＋</span></button></div></section>}
        {displayView === "templates" && <AthleticsTemplates templates={templates} now={experience.now} onCreate={handleCreateTemplate} onUpdate={handleUpdateTemplate} onDuplicate={handleDuplicateTemplate} onDelete={handleDeleteTemplate} onStart={handleStartTemplate} onSchedule={handleScheduleTemplate} />}
        {displayView === "history" && <AthleticsHistory workouts={workouts} onRemove={handleRemoveWorkout} />}
        {displayView === "progress" && <AthleticsProgress workouts={workouts} now={experience.now} pillarXP={athleticsXP.xp} progression={athleticsXP.progression} />}
      </main>
      <ActivityUndoToast notice={undo.notice} onDismiss={undo.dismiss} onUndo={undo.undo} />
    </div>
  );
}
