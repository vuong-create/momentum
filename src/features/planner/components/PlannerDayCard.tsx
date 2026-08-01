import {
  pillarThemes,
  type PillarKey,
} from "../../../app/theme";
import { isActivityCompleted } from "../../activities/services/activityLifecycle";
import {
  formatActivityTime,
  sortActivitiesForFocus,
} from "../services/plannerService";
import type {
  PlannerActivity,
  PlannerDay,
} from "../types";
import { useState } from "react";

type PlannerDayCardProps = {
  day: PlannerDay;
  onOpenDay: (dateKey: string) => void;
  onRequestAdd: (dateKey: string) => void;
  onOpenDetails: (activityId: number, dateKey: string) => void;
  onComplete: (activity: PlannerActivity) => Promise<void>;
  onMove: (
    activity: PlannerActivity,
    scheduledDate: string
  ) => Promise<void>;
};

const previewLimit = 4;

export default function PlannerDayCard({
  day,
  onOpenDay,
  onRequestAdd,
  onOpenDetails,
  onComplete,
  onMove,
}: PlannerDayCardProps) {
  const [dragOver, setDragOver] = useState(false);
  const completed = day.activities.filter(isActivityCompleted).length;
  const incomplete = sortActivitiesForFocus(
    day.activities.filter((activity) => !isActivityCompleted(activity))
  );
  const previews = incomplete.slice(0, previewLimit);
  const hiddenIncomplete = Math.max(incomplete.length - previewLimit, 0);

  return (
    <section
      className={[
        "planner-day-card",
        day.isToday ? "planner-day-card-today" : "",
        dragOver ? "is-drag-over" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onDragOver={(event) => { event.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(event) => {
        setDragOver(false);
        const transferred = event.dataTransfer.getData(
          "application/momentum-activity"
        );

        if (!transferred) return;

        try {
          const activity = JSON.parse(transferred) as PlannerActivity;
          onMove(activity, day.dateKey);
        } catch {
          // Ignore drag data from outside Momentum.
        }
      }}
    >
      <button
        type="button"
        className="planner-day-card-header"
        onClick={() => onOpenDay(day.dateKey)}
      >
        <span className="planner-day-card-date">
          {day.isToday && <em>Today</em>}
          <span>
            <small>{day.dayName}</small>
            <strong>{day.dayNumber}</strong>
          </span>
        </span>

        <span className="planner-day-card-count">
          {incomplete.length === 0
            ? day.activities.length === 0
              ? "Open"
              : "Complete"
            : `${incomplete.length} remaining`}
        </span>
      </button>

      <div className="planner-day-card-content">
        {day.activities.length === 0 ? (
          <button
            type="button"
            className="planner-day-card-empty"
            onClick={() => onOpenDay(day.dateKey)}
          >
            Space for what matters.
          </button>
        ) : incomplete.length === 0 ? (
          <button
            type="button"
            className="planner-day-card-complete"
            onClick={() => onOpenDay(day.dateKey)}
          >
            <span>✓</span>
            Everything complete
          </button>
        ) : (
          previews.map((activity) => {
            const theme = pillarThemes[activity.pillar as PillarKey];

            return (
              <article
                key={activity.id}
                className={`planner-day-preview ${theme.className}`}
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData(
                    "application/momentum-activity",
                    JSON.stringify(activity)
                  );
                }}
              >
                <button
                  type="button"
                  className="planner-day-preview-toggle"
                  onClick={() => onComplete(activity)}
                  aria-label={`Complete ${activity.title}`}
                />
                <button
                  type="button"
                  className="planner-day-preview-copy"
                  onClick={() =>
                    activity.id && onOpenDetails(activity.id, day.dateKey)
                  }
                >
                  <strong>{activity.title}</strong>
                  <span>
                    <i />
                    {theme.shortLabel}
                    {activity.scheduledTime && (
                      <time>{formatActivityTime(activity.scheduledTime)}</time>
                    )}
                    {activity.important && <b>Important</b>}
                    {activity.recurrenceRuleId && <b>↻</b>}
                  </span>
                </button>
              </article>
            );
          })
        )}
      </div>

      <footer className="planner-day-card-footer">
        <button
          type="button"
          onClick={() => onRequestAdd(day.dateKey)}
        >
          <span>+</span> Add
        </button>

        <button
          type="button"
          onClick={() => onOpenDay(day.dateKey)}
        >
          {hiddenIncomplete > 0
            ? `+${hiddenIncomplete} more to do`
            : completed > 0
              ? `${completed} complete`
              : "Open day"}
        </button>
      </footer>
    </section>
  );
}
