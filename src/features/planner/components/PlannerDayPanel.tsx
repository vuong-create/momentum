import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { createPortal } from "react-dom";

import { homePillars, pillarThemes, type PillarKey } from "../../../app/theme";
import SegmentedProgress from "../../../components/SegmentedProgress";
import type { Pillar } from "../../../database/db";
import { isActivityCompleted } from "../../activities/services/activityLifecycle";
import {
  addDays,
  addWeeks,
  getWeekStart,
  sortActivitiesForFocus,
  toDateKey,
} from "../services/plannerService";
import type { CreateActivityInput, PlannerActivity, PlannerDay } from "../types";
import PlannerTask from "./PlannerTask";

type PlannerDayPanelProps = {
  day: PlannerDay | null;
  weekDays: PlannerDay[];
  celebratingActivityId: number | null;
  onClose: () => void;
  onNavigate: (direction: -1 | 1) => void;
  onAdd: (input: CreateActivityInput) => Promise<void>;
  onOpenDetails: (activityId: number) => void;
  onComplete: (activity: PlannerActivity) => Promise<void>;
  onToggleImportant: (activity: PlannerActivity) => Promise<void>;
  onRename: (activity: PlannerActivity, title: string) => Promise<void>;
  onMove: (activity: PlannerActivity, dateKey: string) => Promise<void>;
  onDuplicate: (activity: PlannerActivity, dateKey: string) => Promise<void>;
  onSendToTop: (activity: PlannerActivity, group: PlannerActivity[]) => Promise<void>;
  onReorder: (activities: PlannerActivity[]) => Promise<void>;
  onMoveRemaining: (activities: PlannerActivity[], dateKey: string) => Promise<void>;
};

type DaySectionProps = {
  title: string;
  activities: PlannerActivity[];
  collapsed: boolean;
  weekDays: PlannerDay[];
  celebratingActivityId: number | null;
  onToggle: () => void;
  onOpenDetails: (activityId: number) => void;
  onComplete: (activity: PlannerActivity) => Promise<void>;
  onToggleImportant: (activity: PlannerActivity) => Promise<void>;
  onRename: (activity: PlannerActivity, title: string) => Promise<void>;
  onMove: (activity: PlannerActivity, dateKey: string) => Promise<void>;
  onDuplicate: (activity: PlannerActivity, dateKey: string) => Promise<void>;
  onSendToTop: (activity: PlannerActivity, group: PlannerActivity[]) => Promise<void>;
  onReorder: (activities: PlannerActivity[]) => Promise<void>;
};

const selectablePillars: PillarKey[] = ["core", ...homePillars];
const sectionNames = ["Important", "Scheduled", "Anytime", "Completed"];

function DaySection({
  title,
  activities,
  collapsed,
  weekDays,
  celebratingActivityId,
  onToggle,
  onOpenDetails,
  onComplete,
  onToggleImportant,
  onRename,
  onMove,
  onDuplicate,
  onSendToTop,
  onReorder,
}: DaySectionProps) {
  if (activities.length === 0) return null;

  async function dropBefore(dragged: PlannerActivity, target: PlannerActivity) {
    if (!dragged.id || !target.id || dragged.id === target.id) return;
    if (dragged.scheduledDate !== target.scheduledDate) {
      if (target.scheduledDate) await onMove(dragged, target.scheduledDate);
      return;
    }

    const next = activities.filter((item) => item.id !== dragged.id);
    const targetIndex = next.findIndex((item) => item.id === target.id);
    next.splice(targetIndex, 0, dragged);
    await onReorder(next);
  }

  return (
    <section className={`planner-day-panel-section ${collapsed ? "is-collapsed" : ""}`}>
      <button type="button" className="planner-day-panel-section-header" onClick={onToggle} aria-expanded={!collapsed}>
        <span>{title}</span>
        <small>{activities.length} {collapsed ? "+" : "−"}</small>
      </button>
      {!collapsed && (
        <div>
          {activities.map((activity) => (
            <PlannerTask
              key={activity.id}
              activity={activity}
              weekDays={weekDays}
              celebrating={celebratingActivityId === activity.id}
              onOpenDetails={onOpenDetails}
              onComplete={onComplete}
              onToggleImportant={onToggleImportant}
              onRename={onRename}
              onMove={onMove}
              onDuplicate={onDuplicate}
              onSendToTop={(selected) => onSendToTop(selected, activities)}
              onDropBefore={dropBefore}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default function PlannerDayPanel(props: PlannerDayPanelProps) {
  const {
    day, weekDays, celebratingActivityId, onClose, onNavigate, onAdd,
    onOpenDetails, onComplete, onToggleImportant, onRename, onMove,
    onDuplicate, onSendToTop, onReorder, onMoveRemaining,
  } = props;
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const storageKey = `momentum.planner.day.${day?.dateKey ?? "closed"}`;
  const [title, setTitle] = useState("");
  const [pillar, setPillar] = useState<Pillar>(() =>
    (localStorage.getItem("momentum.planner.pillar") as Pillar | null) ?? "core"
  );
  const [scheduledTime, setScheduledTime] = useState("");
  const [important, setImportant] = useState(false);
  const [showAddOptions, setShowAddOptions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUnfinishedOnly, setShowUnfinishedOnly] = useState(
    () => sessionStorage.getItem(`${storageKey}.unfinished`) === "true"
  );
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    if (!day) return { Completed: true };
    try {
      return JSON.parse(sessionStorage.getItem(`${storageKey}.collapsed`) ?? "{\"Completed\":true}");
    } catch {
      return { Completed: true };
    }
  });

  useEffect(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = Number(sessionStorage.getItem(`${storageKey}.scroll`) ?? 0);
      }
    });
  }, [storageKey]);

  useEffect(() => {
    if (!day) return;
    sessionStorage.setItem(`${storageKey}.collapsed`, JSON.stringify(collapsed));
    sessionStorage.setItem(`${storageKey}.unfinished`, String(showUnfinishedOnly));
  }, [collapsed, day, showUnfinishedOnly, storageKey]);

  useEffect(() => {
    if (!day) return;
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      const isEditing = /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable;
      if (event.key === "Escape") onClose();
      if (!isEditing && event.key === "ArrowLeft") onNavigate(-1);
      if (!isEditing && event.key === "ArrowRight") onNavigate(1);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [day, onClose, onNavigate]);

  if (!day) return null;

  const ordered = sortActivitiesForFocus(day.activities);
  const incomplete = ordered.filter((activity) => !isActivityCompleted(activity));
  const importantActivities = incomplete.filter((activity) => activity.important);
  const scheduled = incomplete.filter((activity) => !activity.important && activity.scheduledTime);
  const anytime = incomplete.filter((activity) => !activity.important && !activity.scheduledTime);
  const completed = ordered.filter(isActivityCompleted);
  const percentage = day.activities.length ? Math.round((completed.length / day.activities.length) * 100) : 0;
  const dayIndex = weekDays.findIndex((item) => item.dateKey === day.dateKey);
  const activeDateKey = day.dateKey;
  const isPast = day.dateKey < toDateKey(new Date());
  const dateLabel = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(day.date);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onAdd({ title: title.trim(), scheduledDate: activeDateKey, pillar, scheduledTime, important });
      localStorage.setItem("momentum.planner.pillar", pillar);
      setTitle("");
      setScheduledTime("");
      setImportant(false);
      inputRef.current?.focus();
    } finally {
      setIsSubmitting(false);
    }
  }

  function toggleSection(section: string) {
    setCollapsed((current) => ({ ...current, [section]: !current[section] }));
  }

  const allCollapsed = sectionNames.every((section) => collapsed[section]);
  const sectionProps = {
    weekDays, celebratingActivityId, onOpenDetails, onComplete,
    onToggleImportant, onRename, onMove, onDuplicate, onSendToTop, onReorder,
  };
  const portalTarget = document.querySelector(".experience-root") ?? document.body;

  return createPortal(
    <div className="planner-day-panel-layer">
      <button type="button" className="planner-day-panel-backdrop" aria-label="Close day overview" onClick={onClose} />
      <aside className="planner-day-panel" role="dialog" aria-modal="true" aria-label={`${day.dayName} overview`}>
        <header className="planner-day-panel-header">
          <button type="button" className="planner-day-panel-nav" disabled={dayIndex <= 0} onClick={() => onNavigate(-1)} aria-label="Previous day">←</button>
          <div>
            <span className="text-label">{day.isToday ? "Today" : "Day overview"}</span>
            <h2 className="font-pixel">{day.dayName}</h2>
            <p>{dateLabel}</p>
          </div>
          <button type="button" className="planner-day-panel-nav" disabled={dayIndex >= weekDays.length - 1} onClick={() => onNavigate(1)} aria-label="Next day">→</button>
          <button type="button" className="planner-day-panel-close" onClick={onClose} aria-label="Close day overview">×</button>
        </header>

        <div className="planner-day-panel-summary">
          <span><strong>{incomplete.length}</strong> remaining</span>
          <span>{importantActivities.length} important · {scheduled.length} scheduled · {anytime.length} anytime</span>
          <SegmentedProgress value={percentage} label={`${percentage}% of ${day.dayName} complete`} />
        </div>

        <form className="planner-day-panel-add" onSubmit={handleSubmit}>
          <div className="planner-day-panel-add-row">
            <span aria-hidden="true">+</span>
            <input ref={inputRef} value={title} onChange={(event) => setTitle(event.target.value)} placeholder={`Add to ${day.dayName}`} aria-label={`Add an activity to ${day.dayName}`} />
            <button type="button" className="planner-day-panel-options-button" onClick={() => setShowAddOptions((current) => !current)}>{showAddOptions ? "Less" : "Options"}</button>
            <button type="submit" disabled={!title.trim() || isSubmitting}>{isSubmitting ? "Adding…" : "Add"}</button>
          </div>
          {showAddOptions && (
            <div className="planner-day-panel-add-options">
              <select value={pillar} onChange={(event) => setPillar(event.target.value as Pillar)} aria-label="Pillar">
                {selectablePillars.map((key) => <option key={key} value={key}>{pillarThemes[key].shortLabel}</option>)}
              </select>
              <input type="time" value={scheduledTime} onChange={(event) => setScheduledTime(event.target.value)} aria-label="Time" />
              <button type="button" className={important ? "is-selected" : ""} onClick={() => setImportant((current) => !current)}>{important ? "★ Important" : "☆ Important"}</button>
            </div>
          )}
        </form>

        <div className="planner-day-panel-toolbar">
          <button type="button" onClick={() => setCollapsed(Object.fromEntries(sectionNames.map((section) => [section, !allCollapsed])))}>{allCollapsed ? "Expand all" : "Collapse all"}</button>
          <button type="button" className={showUnfinishedOnly ? "is-selected" : ""} onClick={() => setShowUnfinishedOnly((current) => !current)}>Show unfinished only</button>
          {isPast && incomplete.length > 0 && (
            <div className="planner-day-panel-move-remaining">
              <span>Move remaining</span>
              <button type="button" onClick={() => onMoveRemaining(incomplete, toDateKey(new Date()))}>Today</button>
              <button type="button" onClick={() => onMoveRemaining(incomplete, toDateKey(addDays(new Date(), 1)))}>Tomorrow</button>
              <button type="button" onClick={() => onMoveRemaining(incomplete, toDateKey(addWeeks(getWeekStart(), 1)))}>Next week</button>
            </div>
          )}
        </div>

        <div className="planner-day-panel-scroll" ref={scrollRef} onScroll={(event) => sessionStorage.setItem(`${storageKey}.scroll`, String(event.currentTarget.scrollTop))}>
          {day.activities.length === 0 ? (
            <div className="planner-day-panel-empty"><strong>Nothing planned yet.</strong><span>Leave the space open or add what matters.</span></div>
          ) : (
            <>
              <DaySection title="Important" activities={importantActivities} collapsed={Boolean(collapsed.Important)} onToggle={() => toggleSection("Important")} {...sectionProps} />
              <DaySection title="Scheduled" activities={scheduled} collapsed={Boolean(collapsed.Scheduled)} onToggle={() => toggleSection("Scheduled")} {...sectionProps} />
              <DaySection title="Anytime" activities={anytime} collapsed={Boolean(collapsed.Anytime)} onToggle={() => toggleSection("Anytime")} {...sectionProps} />
              {!showUnfinishedOnly && <DaySection title="Completed" activities={completed} collapsed={collapsed.Completed !== false} onToggle={() => toggleSection("Completed")} {...sectionProps} />}
            </>
          )}
        </div>
      </aside>
    </div>,
    portalTarget
  );
}
