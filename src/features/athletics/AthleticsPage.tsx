import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useSearchParams } from "react-router-dom";

import { db, type AthleticsPlannedSession, type PlannedActivity } from "../../database/db";
import useExperience from "../../experience/useExperience";
import { getActivityStatus } from "../activities/services/activityLifecycle";
import { getXPBreakdown } from "../xp/XPService";
import AthleticsBlockTemplates from "./components/AthleticsBlockTemplates";
import AthleticsTrainingCalendar from "./components/AthleticsTrainingCalendar";
import { updatePlannedExerciseChoice } from "./services/athleticsService";
import {
  completeTrainingSession,
  installSeptember2026TrainingBlock,
  moveTrainingSession,
  reopenTrainingSession,
  setSaturdayTrainingChoice,
  skipTrainingSession,
  updateTrainingBlockTemplate,
  visibleTrainingBlocks,
  visibleTrainingSessions,
} from "./services/trainingBlockService";

import "./athletics.css";

type AthleticsView = "calendar" | "templates";
const tabs: Array<{ id: AthleticsView; label: string; mark: string }> = [
  { id: "calendar", label: "Block", mark: "B" },
  { id: "templates", label: "Templates", mark: "T" },
];

function getInitialView(): AthleticsView {
  return sessionStorage.getItem("momentum.athletics.tab") === "templates" ? "templates" : "calendar";
}

export default function AthleticsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const experience = useExperience();
  const [view, setView] = useState<AthleticsView>(getInitialView);
  const [installingBlock, setInstallingBlock] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const routedSessionId = Number(searchParams.get("session")) || null;
  const plannedActivities = useLiveQuery(() => db.plannedActivities.toArray(), []) ?? [];
  const allTrainingBlocks = useLiveQuery(() => db.athleticsTrainingBlocks.toArray(), []) ?? [];
  const allPlannedSessions = useLiveQuery(() => db.athleticsPlannedSessions.toArray(), []) ?? [];
  const xpEvents = useLiveQuery(() => db.xpEvents.toArray(), []) ?? [];
  const trainingBlocks = visibleTrainingBlocks(allTrainingBlocks);
  const trainingSessions = visibleTrainingSessions(allPlannedSessions);
  const activeTrainingBlock = trainingBlocks.find((item) => item.active) ?? trainingBlocks.at(-1);
  const blockSessions = activeTrainingBlock?.id ? trainingSessions.filter((item) => item.blockId === activeTrainingBlock.id) : [];
  const actionable = blockSessions.filter((item) => item.kind !== "recovery");
  const completed = actionable.filter((session) => getActivityStatus(plannedActivities.find((activity) => activity.id === session.plannedActivityId) ?? { completed: false } as PlannedActivity) === "completed").length;
  const athleticsXP = getXPBreakdown(xpEvents).contributions.find(({ pillar }) => pillar === "athletics")!;
  const displayView: AthleticsView = routedSessionId ? "calendar" : view;

  function selectView(nextView: AthleticsView) {
    setView(nextView); setSearchParams({}); sessionStorage.setItem("momentum.athletics.tab", nextView);
  }

  function handleSelectSession(id: number | null) {
    setSelectedSessionId(id); setSearchParams(id ? { session: String(id) } : {}, { replace: true });
  }

  async function handleInstallBlock() {
    if (installingBlock) return;
    setInstallingBlock(true);
    try { await installSeptember2026TrainingBlock(); experience.playFeedback("task-added"); }
    finally { setInstallingBlock(false); }
  }

  async function closeSession(session: AthleticsPlannedSession) {
    await completeTrainingSession(session.id!);
    experience.playFeedback("workout-completed");
    handleSelectSession(null);
  }

  return <div className="athletics-page">
    <header className="athletics-page-header">
      <div><span className="text-label">Plan · Follow · Complete</span><h1 className="font-pixel">Athletics</h1><p>Your training block, one session at a time.</p></div>
      <div className="athletics-header-stats">
        <span><strong>{completed}</strong><small>sessions complete</small></span>
        <span><strong>{actionable.length}</strong><small>in this block</small></span>
        <span className="athletics-header-level"><strong>Lv {athleticsXP.progression.level}</strong><small>{athleticsXP.xp} Athletics XP</small><i><span style={{ width: `${athleticsXP.progression.percentage}%` }} /></i></span>
      </div>
    </header>

    <nav className="athletics-tabs" aria-label="Athletics sections">{tabs.map((tab) => <button key={tab.id} type="button" className={displayView === tab.id ? "is-selected" : ""} onClick={() => selectView(tab.id)}><span>{tab.mark}</span>{tab.label}</button>)}</nav>

    <main className="athletics-content">
      {displayView === "calendar" && <AthleticsTrainingCalendar block={activeTrainingBlock} sessions={blockSessions} activities={plannedActivities} now={experience.now} selectedSessionId={routedSessionId ?? selectedSessionId} installing={installingBlock} onInstall={handleInstallBlock} onSelect={handleSelectSession} onComplete={closeSession} onReopen={async (session) => { await reopenTrainingSession(session.id!); experience.playFeedback("task-reopened"); }} onSaturdayChoice={async (session, choice) => { await setSaturdayTrainingChoice(session.id!, choice); experience.playFeedback("task-updated"); }} onMove={async (session, date) => { await moveTrainingSession(session.id!, date); experience.playFeedback("task-updated"); }} onSkip={async (session) => { await skipTrainingSession(session.id!); experience.playFeedback("task-dismissed"); handleSelectSession(null); }} onExerciseChoice={async (sessionId, exerciseId, name) => { await updatePlannedExerciseChoice(sessionId, exerciseId, name); experience.playFeedback("task-updated"); }} />}
      {displayView === "templates" && <AthleticsBlockTemplates block={activeTrainingBlock} sessions={blockSessions} activities={plannedActivities} onSave={async (name, input) => { const count = await updateTrainingBlockTemplate(activeTrainingBlock!.id!, name, input); experience.playFeedback("task-updated"); return count; }} />}
    </main>
  </div>;
}
