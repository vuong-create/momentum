import { useMemo, useState } from "react";

import {
  pillarThemes,
  type PillarKey,
} from "../../../app/theme";
import type { Pillar, PlannedActivity } from "../../../database/db";
import PillarQuickSelect from "../../activities/components/PillarQuickSelect";
import { getActivityCarryDays } from "../../activities/services/activityLifecycle";

import "./unfinished-activities.css";

type UnfinishedActivitiesProps = {
  activities: PlannedActivity[];
  todayKey: string;
  onMoveToToday: (activity: PlannedActivity) => Promise<void>;
  onReschedule: (
    activity: PlannedActivity,
    scheduledDate: string
  ) => Promise<void>;
  onComplete: (activity: PlannedActivity) => Promise<void>;
  onDelete: (activity: PlannedActivity) => Promise<void>;
  onChangePillar: (activity: PlannedActivity, pillar: Pillar) => Promise<void>;
  onOpenDetails: (activityId: number) => void;
};

function toDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function getNextWeekDates(todayKey: string) {
  const today = new Date(`${todayKey}T00:00:00`);
  const nextSunday = new Date(today);
  const daysUntilSunday = today.getDay() === 0 ? 7 : 7 - today.getDay();

  nextSunday.setDate(today.getDate() + daysUntilSunday);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(nextSunday);
    date.setDate(nextSunday.getDate() + index);

    return {
      dateKey: toDateKey(date),
      day: new Intl.DateTimeFormat("en-US", {
        weekday: "short",
      }).format(date),
      number: String(date.getDate()),
    };
  });
}

function formatOriginalDate(dateKey?: string) {
  if (!dateKey) return "Earlier";

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(`${dateKey}T00:00:00`));
}

export default function UnfinishedActivities({
  activities,
  todayKey,
  onMoveToToday,
  onReschedule,
  onComplete,
  onDelete,
  onChangePillar,
  onOpenDetails,
}: UnfinishedActivitiesProps) {
  const [expanded, setExpanded] = useState(true);
  const [reschedulingId, setReschedulingId] = useState<number | null>(
    null
  );
  const [customDate, setCustomDate] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<number | null>(null);
  const nextWeekDates = useMemo(
    () => getNextWeekDates(todayKey),
    [todayKey]
  );

  async function runAction(
    activity: PlannedActivity,
    action: () => Promise<void>
  ) {
    if (!activity.id || busyId) return;

    setBusyId(activity.id);

    try {
      await action();
      setReschedulingId(null);
      setCustomDate("");
    } finally {
      setBusyId(null);
    }
  }

  if (activities.length === 0) return null;

  return (
    <section className="home-unfinished">
      <button
        type="button"
        className="home-unfinished-heading"
        onClick={() => setExpanded((current) => !current)}
        aria-expanded={expanded}
      >
        <span className="home-unfinished-mark" aria-hidden="true" />
        <span>
          <strong>
            {activities.length} unfinished
            {activities.length === 1 ? " activity" : " activities"}
          </strong>
          <small>Choose what happens next.</small>
        </span>
        <span>{expanded ? "−" : "+"}</span>
      </button>

      {expanded && (
        <div className="home-unfinished-list">
          {activities.map((activity) => {
            const theme =
              pillarThemes[activity.pillar as PillarKey];
            const isRescheduling = reschedulingId === activity.id;
            const isBusy = busyId === activity.id;
            const carriedDays = getActivityCarryDays(activity, todayKey);
            const moveCount = activity.rescheduleCount ?? 0;

            return (
              <article
                key={activity.id}
                className={`home-unfinished-item ${theme.className}`}
              >
                <div className="home-unfinished-copy">
                  <PillarQuickSelect
                    value={activity.pillar}
                    iconOnly
                    disabled={isBusy}
                    label={`Change pillar for ${activity.title}`}
                    onChange={(pillar) => onChangePillar(activity, pillar)}
                  />
                  <div>
                    <button
                      type="button"
                      className="home-unfinished-title"
                      onClick={() => activity.id && onOpenDetails(activity.id)}
                    >
                      {activity.title}
                    </button>
                    <span>
                      Carried {carriedDays} {carriedDays === 1 ? "day" : "days"}
                      {moveCount > 0 ? ` · moved ${moveCount}×` : ""}
                      {" · "}from {formatOriginalDate(activity.originalScheduledDate ?? activity.scheduledDate)}
                    </span>
                  </div>
                </div>

                <div className="home-unfinished-actions">
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => runAction(activity, () => onComplete(activity))}
                  >
                    Complete now
                  </button>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() =>
                      runAction(activity, () => onMoveToToday(activity))
                    }
                  >
                    Move to Today
                  </button>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => {
                      setReschedulingId(isRescheduling ? null : activity.id!);
                      setCustomDate("");
                    }}
                  >
                    Choose date
                  </button>
                  <button
                    type="button"
                    disabled={isBusy}
                    className={confirmingDeleteId === activity.id ? "is-confirming-delete" : ""}
                    onClick={() => {
                      if (confirmingDeleteId !== activity.id) {
                        setConfirmingDeleteId(activity.id!);
                        return;
                      }
                      runAction(activity, () => onDelete(activity));
                      setConfirmingDeleteId(null);
                    }}
                  >
                    {confirmingDeleteId === activity.id ? "Confirm delete" : "Delete"}
                  </button>
                </div>

                {isRescheduling && (
                  <div className="home-unfinished-reschedule">
                    <span>Next week</span>
                    <div>
                      {nextWeekDates.map((date) => (
                        <button
                          key={date.dateKey}
                          type="button"
                          disabled={isBusy}
                          onClick={() =>
                            runAction(activity, () =>
                              onReschedule(activity, date.dateKey)
                            )
                          }
                        >
                          {date.day}
                          <span>{date.number}</span>
                        </button>
                      ))}
                    </div>
                    <label>
                      <span>Pick date</span>
                      <input
                        type="date"
                        min={todayKey}
                        value={customDate}
                        onChange={(event) =>
                          setCustomDate(event.target.value)
                        }
                      />
                      <button
                        type="button"
                        disabled={!customDate || isBusy}
                        onClick={() =>
                          runAction(activity, () =>
                            onReschedule(activity, customDate)
                          )
                        }
                      >
                        Move
                      </button>
                    </label>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
