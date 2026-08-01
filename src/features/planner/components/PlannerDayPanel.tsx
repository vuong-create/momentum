import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { createPortal } from "react-dom";

import SegmentedProgress from "../../../components/SegmentedProgress";
import { isActivityCompleted } from "../../activities/services/activityLifecycle";
import { sortActivitiesForFocus } from "../services/plannerService";
import type {
  CreateActivityInput,
  PlannerActivity,
  PlannerDay,
} from "../types";
import PlannerTask from "./PlannerTask";

type PlannerDayPanelProps = {
  day: PlannerDay | null;
  celebratingActivityId: number | null;
  onClose: () => void;
  onAdd: (input: CreateActivityInput) => Promise<void>;
  onOpenDetails: (activityId: number) => void;
  onComplete: (activity: PlannerActivity) => Promise<void>;
  onToggleImportant: (activity: PlannerActivity) => Promise<void>;
};

type DaySectionProps = {
  title: string;
  activities: PlannerActivity[];
  celebratingActivityId: number | null;
  onOpenDetails: (activityId: number) => void;
  onComplete: (activity: PlannerActivity) => Promise<void>;
  onToggleImportant: (activity: PlannerActivity) => Promise<void>;
};

function DaySection({
  title,
  activities,
  celebratingActivityId,
  onOpenDetails,
  onComplete,
  onToggleImportant,
}: DaySectionProps) {
  if (activities.length === 0) return null;

  return (
    <section className="planner-day-panel-section">
      <header>
        <span>{title}</span>
        <small>{activities.length}</small>
      </header>

      <div>
        {activities.map((activity) => (
          <PlannerTask
            key={activity.id}
            activity={activity}
            celebrating={celebratingActivityId === activity.id}
            onOpenDetails={onOpenDetails}
            onComplete={onComplete}
            onToggleImportant={onToggleImportant}
          />
        ))}
      </div>
    </section>
  );
}

export default function PlannerDayPanel({
  day,
  celebratingActivityId,
  onClose,
  onAdd,
  onOpenDetails,
  onComplete,
  onToggleImportant,
}: PlannerDayPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    if (!day) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [day, onClose]);

  if (!day) return null;

  const ordered = sortActivitiesForFocus(day.activities);
  const incomplete = ordered.filter(
    (activity) => !isActivityCompleted(activity)
  );
  const important = incomplete.filter((activity) => activity.important);
  const scheduled = incomplete.filter(
    (activity) => !activity.important && activity.scheduledTime
  );
  const anytime = incomplete.filter(
    (activity) => !activity.important && !activity.scheduledTime
  );
  const completed = ordered.filter(isActivityCompleted);
  const percentage = day.activities.length
    ? Math.round((completed.length / day.activities.length) * 100)
    : 0;
  const dateLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(day.date);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim() || isSubmitting || !day) return;

    setIsSubmitting(true);

    try {
      await onAdd({
        title: title.trim(),
        scheduledDate: day.dateKey,
        pillar: "core",
      });
      setTitle("");
      inputRef.current?.focus();
    } finally {
      setIsSubmitting(false);
    }
  }

  const portalTarget =
    document.querySelector(".experience-root") ?? document.body;

  return createPortal(
    <div className="planner-day-panel-layer">
      <button
        type="button"
        className="planner-day-panel-backdrop"
        aria-label="Close day overview"
        onClick={onClose}
      />

      <aside
        className="planner-day-panel"
        role="dialog"
        aria-modal="true"
        aria-label={`${day.dayName} overview`}
      >
        <header className="planner-day-panel-header">
          <div>
            <span className="text-label">Day overview</span>
            <h2 className="font-pixel">{day.dayName}</h2>
            <p>{dateLabel}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close day overview"
          >
            ×
          </button>
        </header>

        <div className="planner-day-panel-summary">
          <span>
            <strong>{incomplete.length}</strong> remaining
          </span>
          <span>
            {completed.length} of {day.activities.length} complete
          </span>
          <SegmentedProgress
            value={percentage}
            label={`${percentage}% of ${day.dayName} complete`}
          />
        </div>

        <form className="planner-day-panel-add" onSubmit={handleSubmit}>
          <span aria-hidden="true">+</span>
          <input
            ref={inputRef}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={`Add to ${day.dayName}`}
            aria-label={`Add an activity to ${day.dayName}`}
          />
          <button
            type="submit"
            disabled={!title.trim() || isSubmitting}
          >
            {isSubmitting ? "Adding…" : "Add"}
          </button>
        </form>

        <div className="planner-day-panel-scroll">
          {day.activities.length === 0 ? (
            <div className="planner-day-panel-empty">
              <strong>Nothing planned yet.</strong>
              <span>Leave the space open or add what matters.</span>
            </div>
          ) : (
            <>
              <DaySection
                title="Important"
                activities={important}
                celebratingActivityId={celebratingActivityId}
                onOpenDetails={onOpenDetails}
                onComplete={onComplete}
                onToggleImportant={onToggleImportant}
              />
              <DaySection
                title="Scheduled"
                activities={scheduled}
                celebratingActivityId={celebratingActivityId}
                onOpenDetails={onOpenDetails}
                onComplete={onComplete}
                onToggleImportant={onToggleImportant}
              />
              <DaySection
                title="Anytime"
                activities={anytime}
                celebratingActivityId={celebratingActivityId}
                onOpenDetails={onOpenDetails}
                onComplete={onComplete}
                onToggleImportant={onToggleImportant}
              />

              {completed.length > 0 && (
                <section className="planner-day-panel-section is-completed">
                  <button
                    type="button"
                    className="planner-day-panel-completed-toggle"
                    onClick={() => setShowCompleted((current) => !current)}
                    aria-expanded={showCompleted}
                  >
                    <span>Completed</span>
                    <small>
                      {completed.length} {showCompleted ? "−" : "+"}
                    </small>
                  </button>

                  {showCompleted && (
                    <div>
                      {completed.map((activity) => (
                        <PlannerTask
                          key={activity.id}
                          activity={activity}
                          onOpenDetails={onOpenDetails}
                          onComplete={onComplete}
                          onToggleImportant={onToggleImportant}
                        />
                      ))}
                    </div>
                  )}
                </section>
              )}
            </>
          )}
        </div>
      </aside>
    </div>,
    portalTarget
  );
}
