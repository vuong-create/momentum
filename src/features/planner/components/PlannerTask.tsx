import {
  pillarThemes,
  type PillarKey,
} from "../../../app/theme";

import type { PlannerActivity } from "../types";
import { calculatePlannedXP } from "../../activities/services/activityLifecycle";

type PlannerTaskProps = {
  activity: PlannerActivity;
  celebrating?: boolean;
  onOpenDetails: (activityId: number) => void;
  onComplete: (activity: PlannerActivity) => Promise<void>;
  onToggleImportant: (activity: PlannerActivity) => Promise<void>;
};

export default function PlannerTask({
  activity,
  celebrating = false,
  onOpenDetails,
  onComplete,
  onToggleImportant,
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
        celebrating ? "planner-task-celebrating" : "",
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

      <button
        type="button"
        className="planner-task-content"
        onClick={() => activity.id && onOpenDetails(activity.id)}
        aria-label={`Open details for ${activity.title}`}
      >
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
      </button>

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
          className="planner-task-action planner-task-details"
          onClick={() => activity.id && onOpenDetails(activity.id)}
          aria-label={`Open details for ${activity.title}`}
          title="Details"
        >
          ···
        </button>
      </div>

      {celebrating && (
        <span className="planner-task-xp">
          +{calculatePlannedXP(activity.xpReward).finalXP} XP
        </span>
      )}
    </article>
  );
}
