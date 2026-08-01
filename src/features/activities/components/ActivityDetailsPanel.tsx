import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { createPortal } from "react-dom";
import { useLiveQuery } from "dexie-react-hooks";

import {
  homePillars,
  pillarThemes,
  type PillarKey,
} from "../../../app/theme";
import type {
  Pillar,
  PlannedActivity,
} from "../../../database/db";
import useExperience from "../../../experience/useExperience";
import {
  getActivityDisplayStatus,
  resolveActivityScheduledDate,
} from "../services/activityLifecycle";
import {
  dismissPlannedActivity,
  getPlannedActivity,
  restoreDismissedActivity,
  restoreSoftDeletedActivity,
  softDeletePlannedActivity,
  togglePlannedActivity,
  updateActivityDetails,
} from "../services/activityService";
import type { ActivityDetailsPatch } from "../types";
import type { ActivityUndoNotice } from "./ActivityUndoToast";

import "./activity-controls.css";

type ActivityDetailsPanelProps = {
  activityId: number | null;
  onClose: () => void;
  onMutation: (notice: ActivityUndoNotice) => void;
};

type ActivityDetailsFormProps = {
  activity: PlannedActivity;
  onClose: () => void;
  onMutation: (notice: ActivityUndoNotice) => void;
};

const selectablePillars: PillarKey[] = ["core", ...homePillars];

function toDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function getQuickDates(dateKey: string) {
  const selected = new Date(`${dateKey}T00:00:00`);
  const sunday = new Date(selected);

  sunday.setDate(selected.getDate() - selected.getDay());

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(sunday);
    date.setDate(sunday.getDate() + index);

    return {
      dateKey: toDateKey(date),
      day: new Intl.DateTimeFormat("en-US", {
        weekday: "short",
      }).format(date),
      number: String(date.getDate()),
    };
  });
}

function formatTimestamp(value?: string) {
  if (!value) return null;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function ActivityDetailsForm({
  activity,
  onClose,
  onMutation,
}: ActivityDetailsFormProps) {
  const experience = useExperience();
  const todayKey = toDateKey(experience.now);
  const titleRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(activity.title);
  const [scheduledDate, setScheduledDate] = useState(
    activity.planningWeekStart
      ? ""
      : resolveActivityScheduledDate(activity, todayKey) ?? todayKey
  );
  const [scheduledTime, setScheduledTime] = useState(
    activity.scheduledTime ?? ""
  );
  const [pillar, setPillar] = useState<Pillar>(activity.pillar);
  const [important, setImportant] = useState(
    activity.important ?? false
  );
  const [notes, setNotes] = useState(activity.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const status = getActivityDisplayStatus(activity, todayKey);
  const quickDates = getQuickDates(scheduledDate || todayKey);

  useEffect(() => {
    titleRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function getPreviousDetails(): ActivityDetailsPatch {
    return {
      title: activity.title,
      scheduledDate: activity.scheduledDate,
      planningWeekStart: activity.planningWeekStart,
      scheduledTime: activity.scheduledTime,
      pillar: activity.pillar,
      important: activity.important,
      notes: activity.notes,
      sortOrder: activity.sortOrder,
    };
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!activity.id || !title.trim() || saving) return;

    setSaving(true);

    try {
      const previous = getPreviousDetails();

      await updateActivityDetails(activity.id, {
        title,
        scheduledDate: scheduledDate || undefined,
        planningWeekStart: scheduledDate
          ? undefined
          : activity.planningWeekStart,
        scheduledTime: scheduledTime || undefined,
        pillar,
        important,
        notes: notes || undefined,
      });

      experience.playFeedback("task-updated");
      onMutation({
        message:
          scheduledDate !== activity.scheduledDate
            ? "Activity rescheduled"
            : "Activity updated",
        undo: () => updateActivityDetails(activity.id!, previous),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleCompletion() {
    if (!activity.id) return;

    await togglePlannedActivity(activity.id);
    experience.playFeedback(
      activity.completed ? "task-reopened" : "task-completed"
    );
    onMutation({
      message: activity.completed
        ? "Activity reopened"
        : "Activity completed",
      undo: () => togglePlannedActivity(activity.id!),
    });
    onClose();
  }

  async function handleDismiss() {
    if (!activity.id) return;

    await dismissPlannedActivity(activity.id);
    experience.playFeedback("task-dismissed");
    onMutation({
      message: "Activity dismissed",
      undo: () => restoreDismissedActivity(activity.id!),
    });
    onClose();
  }

  async function handleDelete() {
    if (!activity.id) return;

    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }

    await softDeletePlannedActivity(activity.id);
    experience.playFeedback("task-dismissed");
    onMutation({
      message: "Activity deleted",
      undo: () => restoreSoftDeletedActivity(activity.id!),
    });
    onClose();
  }

  return (
    <form className="activity-details-form" onSubmit={handleSave}>
      <header className="activity-details-header">
        <div>
          <span className="text-label">Activity details</span>
          <span className={`activity-status activity-status-${status}`}>
            {status}
          </span>
        </div>
        <button
          type="button"
          className="activity-details-close"
          onClick={onClose}
          aria-label="Close activity details"
        >
          ×
        </button>
      </header>

      <div className="activity-details-scroll">
        <label className="activity-field activity-title-field">
          <span>Title</span>
          <input
            ref={titleRef}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Activity title"
          />
        </label>

        <fieldset className="activity-fieldset">
          <legend>Scheduled day</legend>
          <div className="activity-date-chips">
            {quickDates.map((date) => (
              <button
                key={date.dateKey}
                type="button"
                className={
                  date.dateKey === scheduledDate ? "is-selected" : ""
                }
                aria-pressed={date.dateKey === scheduledDate}
                onClick={() => setScheduledDate(date.dateKey)}
              >
                {date.day}
                <span>{date.number}</span>
              </button>
            ))}
          </div>
          <input
            className="activity-date-input"
            type="date"
            value={scheduledDate}
            onChange={(event) => setScheduledDate(event.target.value)}
          />
          {activity.planningWeekStart && !scheduledDate && (
            <small className="activity-date-unscheduled">
              Unscheduled this week
            </small>
          )}
        </fieldset>

        <fieldset className="activity-fieldset">
          <legend>Pillar</legend>
          <div className="activity-pillar-chips">
            {selectablePillars.map((pillarKey) => {
              const theme = pillarThemes[pillarKey];

              return (
                <button
                  key={pillarKey}
                  type="button"
                  className={`${theme.className} ${
                    pillar === pillarKey ? "is-selected" : ""
                  }`}
                  aria-pressed={pillar === pillarKey}
                  onClick={() => setPillar(pillarKey)}
                >
                  <span />
                  {theme.shortLabel}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="activity-field-grid">
          <label className="activity-field">
            <span>Time</span>
            <input
              type="time"
              value={scheduledTime}
              onChange={(event) => setScheduledTime(event.target.value)}
            />
          </label>

          <label className="activity-important-control">
            <span>
              <strong>Important</strong>
              Keep this activity visually elevated.
            </span>
            <input
              type="checkbox"
              checked={important}
              onChange={(event) => setImportant(event.target.checked)}
            />
          </label>
        </div>

        <label className="activity-field">
          <span>Notes</span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={5}
            placeholder="Optional context"
          />
        </label>

        <div className="activity-history">
          <span>Created {formatTimestamp(activity.createdAt ?? activity.date)}</span>
          {activity.completedAt && (
            <span>Completed {formatTimestamp(activity.completedAt)}</span>
          )}
        </div>

        <div className="activity-secondary-actions">
          <button type="button" onClick={handleToggleCompletion}>
            {activity.completed ? "Reopen activity" : "Complete activity"}
          </button>
          {!activity.completed && (
            <button type="button" onClick={handleDismiss}>
              Dismiss
            </button>
          )}
          <button
            type="button"
            className={confirmingDelete ? "is-confirming" : ""}
            onClick={handleDelete}
          >
            {confirmingDelete ? "Confirm delete" : "Delete"}
          </button>
        </div>
      </div>

      <footer className="activity-details-footer">
        <button type="button" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" disabled={!title.trim() || saving}>
          {saving ? "Saving…" : "Save changes"}
        </button>
      </footer>
    </form>
  );
}

export default function ActivityDetailsPanel({
  activityId,
  onClose,
  onMutation,
}: ActivityDetailsPanelProps) {
  const activity = useLiveQuery(
    () => (activityId ? getPlannedActivity(activityId) : undefined),
    [activityId]
  );

  if (!activityId) return null;

  const portalTarget =
    document.querySelector(".experience-root") ?? document.body;

  return createPortal(
    <div className="activity-details-layer">
      <button
        type="button"
        className="activity-details-backdrop"
        aria-label="Close activity details"
        onClick={onClose}
      />
      <aside
        className="activity-details-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Activity details"
      >
        {activity ? (
          <ActivityDetailsForm
            key={`${activity.id}-${activity.updatedAt}`}
            activity={activity}
            onClose={onClose}
            onMutation={onMutation}
          />
        ) : (
          <div className="activity-details-loading">Loading activity…</div>
        )}
      </aside>
    </div>,
    portalTarget
  );
}
