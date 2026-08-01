import ProgressBar from "../../../components/ProgressBar";

import {
  addDays,
  fromDateKey,
} from "../services/plannerService";

type WeekHeaderProps = {
  weekStartKey: string;
  completed: number;
  total: number;
  percentage: number;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onCurrentWeek: () => void;
};

function getWeekLabel(weekStartKey: string) {
  const start = fromDateKey(weekStartKey);
  const end = addDays(start, 6);

  const startLabel = new Intl.DateTimeFormat(
    "en-US",
    {
      month: "short",
      day: "numeric",
    }
  ).format(start);

  const endLabel = new Intl.DateTimeFormat(
    "en-US",
    {
      month:
        start.getMonth() === end.getMonth()
          ? undefined
          : "short",
      day: "numeric",
      year: "numeric",
    }
  ).format(end);

  return `${startLabel} – ${endLabel}`;
}

export default function WeekHeader({
  weekStartKey,
  completed,
  total,
  percentage,
  onPreviousWeek,
  onNextWeek,
  onCurrentWeek,
}: WeekHeaderProps) {
  return (
    <header className="planner-week-header">
      <div className="planner-week-title">
        <span className="text-label">Plan with intention</span>
        <h1 className="font-pixel">Weekly Plan</h1>
        <p>{getWeekLabel(weekStartKey)}</p>
      </div>

      <div className="planner-week-navigation">
        <button
          className="planner-arrow-button"
          onClick={onPreviousWeek}
          aria-label="Previous week"
        >
          ←
        </button>
        <button
          className="planner-today-button"
          onClick={onCurrentWeek}
        >
          Today
        </button>
        <button
          className="planner-arrow-button"
          onClick={onNextWeek}
          aria-label="Next week"
        >
          →
        </button>
      </div>

      <div className="planner-progress-summary">
        <div className="planner-progress-copy">
          <span>Follow-through</span>

          <strong>
            {completed} / {total} activities
          </strong>
        </div>

        <ProgressBar value={percentage} label="Weekly completion" />

        <span className="planner-percentage">
          {percentage}%
        </span>
      </div>
    </header>
  );
}
