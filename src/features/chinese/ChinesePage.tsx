import { useCallback, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";

import {
  db,
  type ChineseActivity,
  type ChineseActivityType,
  type ChineseEntry,
  type ChineseMediaResource,
} from "../../database/db";
import useExperience from "../../experience/useExperience";
import ActivityUndoToast from "../activities/components/ActivityUndoToast";
import useActivityUndo from "../activities/hooks/useActivityUndo";
import { getActivityStatus, isActivityVisible } from "../activities/services/activityLifecycle";
import { getXPBreakdown } from "../xp/XPService";
import { parseChineseActivityKind } from "./activityCatalog";
import ChineseDatabase from "./components/ChineseDatabase";
import ChineseEntryModal from "./components/ChineseEntryModal";
import ChinesePractice from "./components/ChinesePractice";
import ChineseProgress from "./components/ChineseProgress";
import ChineseToday from "./components/ChineseToday";
import {
  logChineseActivity,
  restoreChineseActivity,
  softDeleteChineseActivity,
  visibleChineseActivities,
} from "./services/chineseActivityService";
import {
  createChineseEntry,
  markChineseEntryPractice,
  restoreChineseEntry,
  setChineseEntryFavorite,
  softDeleteChineseEntry,
  updateChineseEntry,
  visibleChineseEntries,
  type ChineseEntryInput,
} from "./services/chineseEntryService";
import { getChineseStreaks, toDateKey } from "./services/chineseQueries";
import {
  createChineseMediaResource,
  restoreChineseMediaResource,
  softDeleteChineseMediaResource,
  visibleChineseMediaResources,
  type ChineseMediaInput,
} from "./services/chineseMediaService";

import "./chinese.css";

type ChineseView = "today" | "practice" | "database" | "progress";

const tabs: { id: ChineseView; label: string; mark: string }[] = [
  { id: "today", label: "Today", mark: "今" },
  { id: "practice", label: "Practice", mark: "練" },
  { id: "database", label: "Database", mark: "詞" },
  { id: "progress", label: "Progress", mark: "續" },
];

function getInitialView(): ChineseView {
  const stored = sessionStorage.getItem("momentum.chinese.tab");
  return tabs.some((tab) => tab.id === stored) ? stored as ChineseView : "today";
}

export default function ChinesePage() {
  const experience = useExperience();
  const undo = useActivityUndo();
  const [view, setView] = useState<ChineseView>(getInitialView);
  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<ChineseEntry | null>(null);
  const [loggingType, setLoggingType] = useState<ChineseActivityType | null>(null);
  const [justLoggedType, setJustLoggedType] = useState<ChineseActivityType | null>(null);
  const todayKey = toDateKey(experience.now);
  const allEntries = useLiveQuery(() => db.chineseEntries.toArray(), []) ?? [];
  const allActivities = useLiveQuery(() => db.chineseActivities.toArray(), []) ?? [];
  const allMediaResources = useLiveQuery(() => db.chineseMediaResources.toArray(), []) ?? [];
  const livePlannedActivities = useLiveQuery(() => db.plannedActivities.toArray(), []);
  const plannedActivities = useMemo(
    () => livePlannedActivities ?? [],
    [livePlannedActivities]
  );
  const xpEvents = useLiveQuery(() => db.xpEvents.toArray(), []) ?? [];
  const entries = visibleChineseEntries(allEntries);
  const activities = visibleChineseActivities(allActivities);
  const mediaResources = visibleChineseMediaResources(allMediaResources);
  const todayActivities = activities.filter((activity) => activity.date === todayKey);
  const streaks = getChineseStreaks(activities, experience.now);
  const xpSummary = getXPBreakdown(xpEvents);
  const chineseXP = xpSummary.contributions.find(({ pillar }) => pillar === "chinese")!;
  const plannedTypes = useMemo(
    () => new Set(
      plannedActivities
        .filter((activity) =>
          activity.pillar === "chinese" &&
          activity.scheduledDate === todayKey &&
          isActivityVisible(activity) &&
          getActivityStatus(activity) !== "completed" &&
          Boolean(parseChineseActivityKind(activity.activityKind))
        )
        .flatMap((activity) => {
          const type = parseChineseActivityKind(activity.activityKind);
          return type ? [type] : [];
        })
    ),
    [plannedActivities, todayKey]
  );

  function selectView(nextView: ChineseView) {
    setView(nextView);
    sessionStorage.setItem("momentum.chinese.tab", nextView);
  }

  async function handleLog(type: ChineseActivityType) {
    if (loggingType) return;
    setLoggingType(type);
    try {
      const result = await logChineseActivity(type, todayKey);
      experience.playFeedback("chinese-logged");
      setJustLoggedType(type);
      window.setTimeout(() => setJustLoggedType(null), 900);
      undo.show({
        message: result.completedPlan ? "Chinese logged · plan completed" : result.xpAwarded > 0 ? `Chinese logged · +${result.xpAwarded} XP` : "Chinese logged · daily XP already earned",
        undo: () => softDeleteChineseActivity(result.chineseActivityId),
      });
    } finally {
      setLoggingType(null);
    }
  }

  async function handleUndoActivity(activity: ChineseActivity) {
    if (!activity.id) return;
    await softDeleteChineseActivity(activity.id);
    experience.playFeedback("task-reopened");
    undo.show({ message: "Chinese activity removed", undo: () => restoreChineseActivity(activity.id!) });
  }

  async function handleCreateEntry(input: ChineseEntryInput) {
    const id = await createChineseEntry(input);
    experience.playFeedback("task-added");
    undo.show({ message: "Added to Chinese Database", undo: () => softDeleteChineseEntry(id) });
  }

  async function handleAddMedia(input: ChineseMediaInput) {
    const id = await createChineseMediaResource(input);
    experience.playFeedback("task-added");
    undo.show({ message: "Practice link saved", undo: () => softDeleteChineseMediaResource(id) });
  }

  async function handleRemoveMedia(resource: ChineseMediaResource) {
    if (!resource.id) return;
    await softDeleteChineseMediaResource(resource.id);
    experience.playFeedback("task-dismissed");
    undo.show({ message: "Practice link removed", undo: () => restoreChineseMediaResource(resource.id!) });
  }

  async function handleSaveModalEntry(input: ChineseEntryInput) {
    if (!selectedEntry?.id) return handleCreateEntry(input);
    const previous: ChineseEntryInput = {
      traditional: selectedEntry.traditional,
      pinyin: selectedEntry.pinyin,
      meaning: selectedEntry.meaning,
      entryType: selectedEntry.entryType,
      example: selectedEntry.example,
      notes: selectedEntry.notes,
      tags: selectedEntry.tags,
      source: selectedEntry.source,
      favorite: selectedEntry.favorite,
      collections: selectedEntry.collections,
    };
    await updateChineseEntry(selectedEntry.id, input);
    experience.playFeedback("task-updated");
    undo.show({ message: "Chinese entry updated", undo: () => updateChineseEntry(selectedEntry.id!, previous) });
  }

  async function handleToggleFavorite(entry: ChineseEntry) {
    if (!entry.id) return;
    const nextFavorite = !entry.favorite;
    await setChineseEntryFavorite(entry.id, nextFavorite);
    experience.playFeedback(nextFavorite ? "task-added" : "task-dismissed");
    undo.show({
      message: nextFavorite ? "Added to Chinese favorites" : "Removed from Chinese favorites",
      undo: () => setChineseEntryFavorite(entry.id!, Boolean(entry.favorite)),
    });
  }

  async function handleMarkPractice(entry: ChineseEntry, status: "keep-practicing" | "comfortable") {
    if (!entry.id) return;
    const previous = {
      practiceStatus: entry.practiceStatus,
      practiceCount: entry.practiceCount,
      lastPracticedAt: entry.lastPracticedAt,
      updatedAt: entry.updatedAt,
    };
    await markChineseEntryPractice(entry.id, status);
    experience.playFeedback(status === "comfortable" ? "task-completed" : "task-updated");
    undo.show({
      message: status === "comfortable" ? "Marked comfortable" : "Kept in your practice rotation",
      undo: async () => { await db.chineseEntries.update(entry.id!, previous); },
    });
  }

  async function handleDeleteEntry() {
    if (!selectedEntry?.id) return;
    await softDeleteChineseEntry(selectedEntry.id);
    experience.playFeedback("task-dismissed");
    undo.show({ message: "Chinese entry removed", undo: () => restoreChineseEntry(selectedEntry.id!) });
  }

  function openNewEntry() {
    setSelectedEntry(null);
    setEntryModalOpen(true);
  }

  function openEntry(entry: ChineseEntry) {
    setSelectedEntry(entry);
    setEntryModalOpen(true);
  }

  const closeEntryModal = useCallback(() => setEntryModalOpen(false), []);

  return (
    <div className="chinese-page">
      <header className="chinese-header">
        <div><span className="text-label">學習 · Traditional Chinese</span><h1 className="font-pixel">Chinese</h1><p>Practice · Collect · Stay close to the language</p></div>
        <div className="chinese-header-stats">
          <span><strong>{streaks.current}</strong><small>day streak</small></span>
          <span><strong>{entries.length}</strong><small>words & phrases</small></span>
          <span className="chinese-header-level"><strong>Lv {chineseXP.progression.level}</strong><small>{chineseXP.xp} Chinese XP</small><i><span style={{ width: `${chineseXP.progression.percentage}%` }} /></i></span>
        </div>
      </header>

      <nav className="chinese-tabs" aria-label="Chinese sections">
        {tabs.map((tab) => (
          <button key={tab.id} type="button" className={view === tab.id ? "is-selected" : ""} onClick={() => selectView(tab.id)}><span>{tab.mark}</span>{tab.label}</button>
        ))}
      </nav>

      <main className="chinese-content">
        {view === "today" && <ChineseToday entries={entries} mediaResources={mediaResources} todayActivities={todayActivities} plannedTypes={plannedTypes} currentStreak={streaks.current} loggingType={loggingType} justLoggedType={justLoggedType} onLog={handleLog} onQuickAdd={handleCreateEntry} onAddMedia={handleAddMedia} onRemoveMedia={handleRemoveMedia} onOpenEntry={openEntry} />}
        {view === "practice" && <ChinesePractice entries={entries} onMark={handleMarkPractice} />}
        {view === "database" && <ChineseDatabase entries={entries} onAdd={openNewEntry} onOpen={openEntry} onToggleFavorite={handleToggleFavorite} />}
        {view === "progress" && <ChineseProgress activities={activities} todayActivities={todayActivities} entries={entries} now={experience.now} pillarXP={chineseXP.xp} progression={chineseXP.progression} onUndoActivity={handleUndoActivity} />}
      </main>

      {entryModalOpen && <ChineseEntryModal entry={selectedEntry} onClose={closeEntryModal} onSave={handleSaveModalEntry} onDelete={selectedEntry ? handleDeleteEntry : undefined} />}
      <ActivityUndoToast notice={undo.notice} onDismiss={undo.dismiss} onUndo={undo.undo} />
    </div>
  );
}
