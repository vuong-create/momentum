import { useEffect, useMemo, useRef, useState } from "react";
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
  acknowledgeTrainingWeek,
  createAthleticsBlockTemplate,
  ensureAthleticsBlockTemplates,
  installSeptember2026TrainingBlock,
  moveTrainingSession,
  reopenTrainingSession,
  scheduleAthleticsTrainingBlock,
  setActiveTrainingBlock,
  setSaturdayTrainingChoice,
  skipTrainingSession,
  updateAthleticsBlockTemplate,
  updateCurrentTrainingBlock,
  visibleAthleticsBlockTemplates,
  visibleTrainingBlocks,
  visibleTrainingSessions,
} from "./services/trainingBlockService";

import "./athletics.css";
import "./athleticsBlocks.css";

type AthleticsView = "calendar" | "templates";
const tabs: Array<{ id: AthleticsView; label: string; mark: string }> = [
  { id: "calendar", label: "Current Block", mark: "C" },
  { id: "templates", label: "Build / Edit Block", mark: "B" },
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
  const [selectedBlockId, setSelectedBlockId] = useState<number | null>(() => Number(sessionStorage.getItem("momentum.athletics.block")) || null);
  const [celebratingWeeks, setCelebratingWeeks] = useState<number[]>([]);
  const initializedCelebrations = useRef(new Set<number>());
  const routedSessionId = Number(searchParams.get("session")) || null;
  const plannedActivitiesQuery = useLiveQuery(() => db.plannedActivities.toArray(), []);
  const plannedActivities = useMemo(() => plannedActivitiesQuery ?? [], [plannedActivitiesQuery]);
  const allTrainingBlocks = useLiveQuery(() => db.athleticsTrainingBlocks.toArray(), []) ?? [];
  const allBlockTemplates = useLiveQuery(() => db.athleticsBlockTemplates.toArray(), []) ?? [];
  const allPlannedSessions = useLiveQuery(() => db.athleticsPlannedSessions.toArray(), []) ?? [];
  const xpEvents = useLiveQuery(() => db.xpEvents.toArray(), []) ?? [];
  const trainingBlocks = visibleTrainingBlocks(allTrainingBlocks);
  const blockTemplates = visibleAthleticsBlockTemplates(allBlockTemplates);
  const trainingSessions = visibleTrainingSessions(allPlannedSessions);
  const activeTrainingBlock = trainingBlocks.find((item) => item.id === selectedBlockId) ?? trainingBlocks.find((item) => item.active) ?? trainingBlocks.at(-1);
  const blockSessions = useMemo(() => activeTrainingBlock?.id ? trainingSessions.filter((item) => item.blockId === activeTrainingBlock.id) : [], [activeTrainingBlock, trainingSessions]);
  const actionable = blockSessions.filter((item) => item.kind !== "recovery");
  const completed = actionable.filter((session) => getActivityStatus(plannedActivities.find((activity) => activity.id === session.plannedActivityId) ?? { completed: false } as PlannedActivity) === "completed").length;
  const athleticsXP = getXPBreakdown(xpEvents).contributions.find(({ pillar }) => pillar === "athletics")!;
  const displayView: AthleticsView = routedSessionId ? "calendar" : view;

  useEffect(() => { void ensureAthleticsBlockTemplates(); }, []);
  useEffect(() => {
    if (!activeTrainingBlock?.id || !blockSessions.length) return;
    const completedWeeks = [...new Set(blockSessions.map((item) => item.weekNumber))].filter((weekNumber) => {
      const sessions = blockSessions.filter((item) => item.weekNumber === weekNumber && item.kind !== "recovery");
      return sessions.length > 0 && sessions.every((session) => getActivityStatus(plannedActivities.find((activity) => activity.id === session.plannedActivityId) ?? { completed: false } as PlannedActivity) === "completed");
    });
    if (!initializedCelebrations.current.has(activeTrainingBlock.id)) {
      initializedCelebrations.current.add(activeTrainingBlock.id);
      for (const weekNumber of completedWeeks.filter((week) => !(activeTrainingBlock.celebratedWeeks ?? []).includes(week))) void acknowledgeTrainingWeek(activeTrainingBlock.id, weekNumber);
      return;
    }
    for (const weekNumber of completedWeeks.filter((week) => !(activeTrainingBlock.celebratedWeeks ?? []).includes(week))) {
      void acknowledgeTrainingWeek(activeTrainingBlock.id, weekNumber).then((isNew) => { if (!isNew) return; setCelebratingWeeks((current) => [...new Set([...current, weekNumber])]); experience.playFeedback("level-up"); window.setTimeout(() => setCelebratingWeeks((current) => current.filter((item) => item !== weekNumber)), 1800); });
    }
  }, [activeTrainingBlock, blockSessions, experience, plannedActivities]);

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
      {displayView === "calendar" && <AthleticsTrainingCalendar block={activeTrainingBlock} blocks={trainingBlocks} sessions={blockSessions} activities={plannedActivities} now={experience.now} selectedSessionId={routedSessionId ?? selectedSessionId} installing={installingBlock} celebratingWeeks={celebratingWeeks} onInstall={handleInstallBlock} onBlockSelect={async (blockId) => { await setActiveTrainingBlock(blockId); setSelectedBlockId(blockId); sessionStorage.setItem("momentum.athletics.block", String(blockId)); setCelebratingWeeks([]); }} onSelect={handleSelectSession} onComplete={closeSession} onReopen={async (session) => { await reopenTrainingSession(session.id!); experience.playFeedback("task-reopened"); }} onSaturdayChoice={async (session, choice) => { await setSaturdayTrainingChoice(session.id!, choice); experience.playFeedback("task-updated"); }} onMove={async (session, date) => { await moveTrainingSession(session.id!, date); experience.playFeedback("task-updated"); }} onSkip={async (session) => { await skipTrainingSession(session.id!); experience.playFeedback("task-dismissed"); handleSelectSession(null); }} onExerciseChoice={async (sessionId, exerciseId, name) => { await updatePlannedExerciseChoice(sessionId, exerciseId, name); experience.playFeedback("task-updated"); }} />}
      {displayView === "templates" && <AthleticsBlockTemplates templates={blockTemplates} block={activeTrainingBlock} sessions={blockSessions} activities={plannedActivities} onSaveTemplate={async (id, input) => { await updateAthleticsBlockTemplate(id, input); experience.playFeedback("task-updated"); }} onCreateTemplate={async (input) => { const id = await createAthleticsBlockTemplate(input); experience.playFeedback("task-added"); return id; }} onUpdateBlock={async (id, input) => { const count = await updateCurrentTrainingBlock(id, input); experience.playFeedback("task-updated"); return count; }} onSchedule={async (templateId, input) => { const result = await scheduleAthleticsTrainingBlock(templateId, input); setSelectedBlockId(result.blockId); sessionStorage.setItem("momentum.athletics.block", String(result.blockId)); selectView("calendar"); experience.playFeedback("task-added"); }} />}
    </main>
  </div>;
}
