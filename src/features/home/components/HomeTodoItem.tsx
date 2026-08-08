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
  onOpen: (activityId: number) => void;
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
  onOpen,
}: HomeTodoItemProps) {
  const theme =
    pillarThemes[activity.pillar as PillarKey];

  const timeLabel = formatTime(
    activity.scheduledTime
  );

  return (
    <article
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
    >
      <button
        type="button"
        className="home-todo-check"
        onClick={() => onToggle(activity)}
        aria-label={activity.completed ? `Mark ${activity.title} incomplete` : `Complete ${activity.title}`}
      >
        {activity.completed ? "✓" : ""}
      </button>

      <button
        type="button"
        className="home-todo-open"
        onClick={() => activity.id && onOpen(activity.id)}
        aria-label={`Open and edit ${activity.title}`}
      >
        <span className="home-todo-title">
          {activity.title}
        </span>

        {timeLabel && (
          <time className="home-todo-time">
            {timeLabel}
          </time>
        )}
      </button>

      <button
        type="button"
        className="home-todo-edit"
        onClick={() => activity.id && onOpen(activity.id)}
        aria-label={`Edit ${activity.title}`}
      >
        Edit
      </button>

      {celebrating && (
        <span className="home-todo-xp">
          +{calculatePlannedXP(activity.xpReward).finalXP} XP
        </span>
      )}
    </article>
  );
}
