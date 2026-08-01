import {
  pillarThemes,
  type PillarKey,
} from "../../../app/theme";

import type { PlannedActivity } from "../../../database/db";
import { calculatePlannedXP } from "../../activities/services/activityLifecycle";

type HomeTodoItemProps = {
  activity: PlannedActivity;
  overdue?: boolean;
  celebrating?: boolean;
  onToggle: (activity: PlannedActivity) => void;
};

function formatTime(time?: string) {
  if (!time) return null;

  const [hour, minute] = time.split(":").map(Number);
  const date = new Date();

  date.setHours(hour, minute, 0, 0);

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default function HomeTodoItem({
  activity,
  overdue = false,
  celebrating = false,
  onToggle,
}: HomeTodoItemProps) {
  const theme =
    pillarThemes[activity.pillar as PillarKey];

  const timeLabel = formatTime(
    activity.scheduledTime
  );

  return (
    <button
      type="button"
      className={[
        "home-todo-strip",
        theme.className,
        activity.completed
          ? "home-todo-strip-complete"
          : "",
        overdue
          ? "home-todo-strip-overdue"
          : "",
        celebrating
          ? "home-todo-strip-celebrating"
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={() => onToggle(activity)}
    >
      <span className="home-todo-check">
        {activity.completed ? "✓" : ""}
      </span>

      <span className="home-todo-title">
        {activity.title}
      </span>

      {timeLabel && (
        <time className="home-todo-time">
          {timeLabel}
        </time>
      )}

      {celebrating && (
        <span className="home-todo-xp">
          +{calculatePlannedXP(activity.xpReward).finalXP} XP
        </span>
      )}
    </button>
  );
}
