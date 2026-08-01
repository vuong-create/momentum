import {
  pillarThemes,
  type PillarKey,
} from "../../../app/theme";

import type { PlannerActivity } from "../types";

import {
  deleteActivity,
  toggleActivity,
} from "../services/plannerService";

type PlannerTaskProps = {
  activity: PlannerActivity;
};

export default function PlannerTask({
  activity,
}: PlannerTaskProps) {
  const theme =
    pillarThemes[activity.pillar as PillarKey];

  return (
    <article
      className={[
        "planner-task",
        theme.className,
        activity.completed
          ? "planner-task-complete"
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <button
        className="planner-task-toggle"
        onClick={() => toggleActivity(activity)}
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

          <span>+{activity.xpReward} XP</span>
        </div>
      </div>

      <button
        className="planner-task-delete"
        onClick={() => {
          if (activity.id) {
            deleteActivity(activity.id);
          }
        }}
        aria-label={`Delete ${activity.title}`}
      >
        ×
      </button>
    </article>
  );
}