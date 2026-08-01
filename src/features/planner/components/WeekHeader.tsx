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
      <div className="planner-week-navigation">
        <button
          className="button-ghost planner-arrow-button"
          onClick={onPreviousWeek}
          aria-label="Previous week"
        >
          ←
        </button>

        <div className="planner-week-title">
          <span className="text-label">
            Weekly Planner
          </span>

          <h1>This Week</h1>

          <p>{getWeekLabel(weekStartKey)}</p>
        </div>

        <button
          className="button-ghost planner-arrow-button"
          onClick={onNextWeek}
          aria-label="Next week"
        >
          →
        </button>
      </div>

      <button
        className="planner-today-button"
        onClick={onCurrentWeek}
      >
        Today
      </button>

      <div className="planner-progress-summary">
        <div className="planner-progress-copy">
          <span>Week Progress</span>

          <strong>
            {completed} / {total} activities
          </strong>
        </div>

        <ProgressBar
          value={percentage}
          label="Weekly completion"
        />

        <span className="planner-percentage">
          {percentage}%
        </span>
      </div>
    </header>
  );
}