import {
  pillarThemes,
  type PillarKey,
} from "../../../app/theme";

import type { PlannerActivity } from "../types";

type PlannerTaskProps = {
  activity: PlannerActivity;
  onComplete: (activity: PlannerActivity) => Promise<void>;
  onToggleImportant: (activity: PlannerActivity) => Promise<void>;
  onDismiss: (activity: PlannerActivity) => Promise<void>;
};

export default function PlannerTask({
  activity,
  onComplete,
  onToggleImportant,
  onDismiss,
}: PlannerTaskProps) {
  const theme = pillarThemes[activity.pillar as PillarKey];

  return (
    <article
      draggable
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData(
          "application/momentum-activity",
          JSON.stringify(activity)
        );
      }}
      className={[
        "planner-task",
        theme.className,
        activity.completed ? "planner-task-complete" : "",
        activity.important ? "planner-task-important" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <button
        className="planner-task-toggle"
        onClick={() => onComplete(activity)}
        aria-label={
          activity.completed
            ? `Mark ${activity.title} incomplete`
            : `Complete ${activity.title}`
        }
      >
        {activity.completed ? "✓" : ""}
      </button>

      <div className="planner-task-content">
        <strong>{activity.title}</strong>

        <div className="planner-task-meta">
          <span className="planner-task-pillar">
            <span className="planner-task-pillar-dot" />
            {theme.shortLabel}
          </span>

          {activity.scheduledTime && (
            <span>{activity.scheduledTime}</span>
          )}
        </div>
      </div>

      <div className="planner-task-actions">
        <button
          className="planner-task-action"
          onClick={() => onToggleImportant(activity)}
          aria-label={
            activity.important
              ? `Remove importance from ${activity.title}`
              : `Mark ${activity.title} important`
          }
          title={activity.important ? "Not important" : "Important"}
        >
          {activity.important ? "★" : "☆"}
        </button>

        <button
          className="planner-task-action planner-task-dismiss"
          onClick={() => onDismiss(activity)}
          aria-label={`Dismiss ${activity.title}`}
          title="Dismiss"
        >
          ×
        </button>
      </div>
    </article>
  );
}
