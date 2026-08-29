import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { createPortal } from "react-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { useNavigate } from "react-router-dom";

import {
  homePillars,
  pillarThemes,
  type PillarKey,
} from "../../../app/theme";
import type {
  ChineseActivityType,
  Pillar,
  PlannedActivity,
  RecurrencePattern,
  RecurrenceRule,
} from "../../../database/db";
import useExperience from "../../../experience/useExperience";
import {
  chineseActivityCatalog,
  getChineseActivityDefinition,
  getChineseActivityKind,
  parseChineseActivityKind,
} from "../../chinese/activityCatalog";
import CookingIdentityPicker from "../../cooking/components/CookingIdentityPicker";
import {
  getCookingActivityIdentity,
  getCookingTaskActivityKind,
  getCustomMealActivityKind,
  parseCookingMealSlot,
  type CookingActivityIdentity,
  type CookingMealSlot,
} from "../../cooking/cookingCatalog";
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
import RecurrenceControls from "./RecurrenceControls";
import { getTrainingSessionIdFromActivity } from "../../athletics/services/trainingBlockService";
import {
  applyRecurrenceToActivity,
  captureRecurrenceSeries,
  describeRecurrence,
  endRecurrence,
  getRecurrenceRule,
  removeRecurrenceFromActivity,
  restoreRecurrenceSeries,
  skipOccurrence,
  updateFutureOccurrences,
  updateSingleOccurrence,
} from "../services/recurrenceService";

import "./activity-controls.css";

type ActivityDetailsPanelProps = {
  activityId: number | null;
  onClose: () => void;
  onMutation: (notice: ActivityUndoNotice) => void;
};

type ActivityDetailsFormProps = {
  activity: PlannedActivity;
  recurrenceRule?: RecurrenceRule;
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
  recurrenceRule,
  onClose,
  onMutation,
}: ActivityDetailsFormProps) {
  const experience = useExperience();
  const navigate = useNavigate();
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
  const [chineseType, setChineseType] = useState<ChineseActivityType>(
    parseChineseActivityKind(activity.activityKind) ?? "anki"
  );
  const originalCookingIdentity = getCookingActivityIdentity(activity.activityKind);
  const originalMealSlot = parseCookingMealSlot(activity.activityKind) ?? "dinner";
  const [cookingIdentity, setCookingIdentity] = useState<CookingActivityIdentity>(originalCookingIdentity);
  const [mealSlot, setMealSlot] = useState<CookingMealSlot>(originalMealSlot);
  const [important, setImportant] = useState(
    activity.important ?? false
  );
  const [notes, setNotes] = useState(activity.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [confirmingEnd, setConfirmingEnd] = useState(false);
  const [editScope, setEditScope] = useState<"occurrence" | "future">(
    activity.recurrenceRuleId ? "occurrence" : "future"
  );
  const [recurrence, setRecurrence] = useState<RecurrencePattern | undefined>(
    recurrenceRule
      ? {
          frequency: recurrenceRule.frequency,
          interval: recurrenceRule.interval,
          weekdays: recurrenceRule.weekdays,
          monthDay: recurrenceRule.monthDay,
          endDate: recurrenceRule.endDate,
        }
      : undefined
  );
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);

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
      activityKind: activity.activityKind,
      difficulty: activity.difficulty,
      xpReward: activity.xpReward,
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
      const chineseDefinition = pillar === "chinese"
        ? getChineseActivityDefinition(chineseType)
        : null;
      const cookingActivityKind = pillar === "cooking"
        ? cookingIdentity === "unclassified"
          ? activity.activityKind
          : cookingIdentity === "task"
            ? getCookingTaskActivityKind()
            : originalCookingIdentity === "meal" && mealSlot === originalMealSlot
              ? activity.activityKind
              : getCustomMealActivityKind(mealSlot)
        : undefined;
      const patch: ActivityDetailsPatch = {
        title,
        scheduledDate: scheduledDate || undefined,
        planningWeekStart: scheduledDate
          ? undefined
          : activity.planningWeekStart,
        scheduledTime: scheduledTime || undefined,
        pillar,
        activityKind: chineseDefinition
          ? getChineseActivityKind(chineseType)
          : cookingActivityKind,
        difficulty: chineseDefinition?.difficulty ?? activity.difficulty,
        xpReward: chineseDefinition?.xp ?? activity.xpReward,
        important,
        notes: notes || undefined,
      };
      const snapshot = activity.recurrenceRuleId
        ? await captureRecurrenceSeries(activity)
        : null;

      if (activity.recurrenceRuleId && editScope === "future") {
        if (recurrence) {
          await updateFutureOccurrences(activity, patch, recurrence);
        } else {
          await updateSingleOccurrence(activity, patch);
          await endRecurrence(activity);
        }
      } else {
        await updateSingleOccurrence(activity, patch);
      }

      let createdSeries:
        | { templateId: number; ruleId: number }
        | undefined;
      if (!activity.recurrenceRuleId && recurrence && scheduledDate) {
        createdSeries = await applyRecurrenceToActivity(
          {
            ...activity,
            ...patch,
            scheduledDate,
          },
          recurrence,
          saveAsTemplate
        );
      }

      experience.playFeedback("task-updated");
      onMutation({
        message:
          scheduledDate !== activity.scheduledDate
            ? "Activity rescheduled"
            : "Activity updated",
        undo: async () => {
          if (snapshot) {
            await restoreRecurrenceSeries(snapshot);
          } else if (createdSeries) {
            await removeRecurrenceFromActivity(
              activity.id!,
              createdSeries.templateId,
              createdSeries.ruleId
            );
            await updateActivityDetails(activity.id!, previous);
          } else {
            await updateActivityDetails(activity.id!, previous);
          }
        },
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleCompletion() {
    if (!activity.id) return;

    const trainingSessionId = getTrainingSessionIdFromActivity(activity);
    if (trainingSessionId) {
      onClose();
      navigate(`/athletics?session=${trainingSessionId}`);
      return;
    }

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

  async function handleSkipOccurrence() {
    const snapshot = await captureRecurrenceSeries(activity);
    await skipOccurrence(activity);
    experience.playFeedback("task-dismissed");
    onMutation({
      message: "Occurrence skipped",
      undo: () => snapshot
        ? restoreRecurrenceSeries(snapshot)
        : Promise.resolve(),
    });
    onClose();
  }

  async function handleEndRecurrence() {
    if (!confirmingEnd) {
      setConfirmingEnd(true);
      return;
    }
    const snapshot = await captureRecurrenceSeries(activity);
    await endRecurrence(activity);
    experience.playFeedback("task-updated");
    onMutation({
      message: "Recurrence ended",
      undo: () => snapshot
        ? restoreRecurrenceSeries(snapshot)
        : Promise.resolve(),
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

        {pillar === "chinese" && (
          <fieldset className="activity-fieldset activity-chinese-kind-fieldset">
            <legend>Chinese activity</legend>
            <div className="activity-chinese-kind-chips">
              {chineseActivityCatalog.map((definition) => (
                <button
                  key={definition.type}
                  type="button"
                  className={chineseType === definition.type ? "is-selected" : ""}
                  aria-pressed={chineseType === definition.type}
                  onClick={() => setChineseType(definition.type)}
                >
                  <span>{definition.mark}</span>
                  {definition.label}
                </button>
              ))}
            </div>
            <small>Completes automatically when logged from Chinese.</small>
          </fieldset>
        )}

        {pillar === "cooking" && (
          <fieldset className="activity-fieldset activity-cooking-kind-fieldset">
            <legend>Cooking activity</legend>
            <CookingIdentityPicker
              identity={cookingIdentity}
              mealSlot={mealSlot}
              showUnclassifiedNote
              onIdentityChange={setCookingIdentity}
              onMealSlotChange={setMealSlot}
            />
            <small>Only meals feed the Cooking meal plan and future grocery workflow.</small>
          </fieldset>
        )}

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

        <fieldset className="activity-fieldset activity-recurrence-fieldset">
          <legend>Recurrence</legend>
          {activity.recurrenceRuleId && recurrenceRule && (
            <>
              <div className="activity-series-summary">
                <span>↻</span>
                <div>
                  <strong>{describeRecurrence(recurrenceRule)}</strong>
                  <small>Part of a recurring series</small>
                </div>
              </div>
              <div className="activity-edit-scope">
                <button type="button" className={editScope === "occurrence" ? "is-selected" : ""} onClick={() => setEditScope("occurrence")}>This occurrence</button>
                <button type="button" className={editScope === "future" ? "is-selected" : ""} onClick={() => setEditScope("future")}>This and future</button>
              </div>
            </>
          )}

          {(!activity.recurrenceRuleId || editScope === "future") && scheduledDate && (
            <RecurrenceControls
              value={recurrence}
              startDate={activity.recurrenceDate ?? scheduledDate}
              onChange={setRecurrence}
            />
          )}

          {!activity.recurrenceRuleId && recurrence && (
            <button type="button" className={`activity-save-template ${saveAsTemplate ? "is-selected" : ""}`} onClick={() => setSaveAsTemplate((current) => !current)}>
              {saveAsTemplate ? "✓ Save as reusable template" : "Save this series as a reusable template"}
            </button>
          )}
        </fieldset>

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
          {activity.recurrenceRuleId && !activity.completed && (
            <button type="button" onClick={handleSkipOccurrence}>
              Skip this occurrence
            </button>
          )}
          {activity.recurrenceRuleId && (
            <button type="button" className={confirmingEnd ? "is-confirming" : ""} onClick={handleEndRecurrence}>
              {confirmingEnd ? "Confirm end series" : "End recurrence"}
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
  const details = useLiveQuery(
    async () => {
      const activity = activityId
        ? await getPlannedActivity(activityId)
        : undefined;
      const recurrenceRule = await getRecurrenceRule(
        activity?.recurrenceRuleId
      );
      return { activity, recurrenceRule };
    },
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
        {details?.activity ? (
          <ActivityDetailsForm
            key={`${details.activity.id}-${details.activity.updatedAt}`}
            activity={details.activity}
            recurrenceRule={details.recurrenceRule}
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
