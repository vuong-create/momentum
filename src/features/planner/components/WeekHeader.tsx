import SegmentedProgress from "../../../components/SegmentedProgress";

import {
  addDays,
  fromDateKey,
  getRelativeWeekLabel,
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
  const weekLabel = getRelativeWeekLabel(weekStartKey);

  return (
    <header className="planner-week-header">
      <div className="planner-week-title">
        <span className="text-label">Plan with intention</span>
        <h1 className="font-pixel">Weekly Plan</h1>
        <p>{getWeekLabel(weekStartKey)}</p>
      </div>

      <div className="planner-week-controls">
        <div className="planner-week-navigation">
          <button
            className="planner-arrow-button"
            onClick={onPreviousWeek}
            aria-label="Previous week"
          >
            ←
          </button>
          <span className="planner-viewed-week-label">{weekLabel}</span>
          <button
            className="planner-arrow-button"
            onClick={onNextWeek}
            aria-label="Next week"
          >
            →
          </button>
        </div>

        {weekLabel !== "This week" && (
          <button
            className="planner-return-button"
            type="button"
            onClick={onCurrentWeek}
          >
            Return to this week
          </button>
        )}
      </div>

      <div className="planner-progress-summary">
        <div className="planner-progress-copy">
          <span>Follow-through</span>

          <strong>
            {completed} / {total} activities
          </strong>
        </div>

        <strong className="planner-percentage">{percentage}%</strong>

        <SegmentedProgress
          value={percentage}
          label={`${percentage}% of weekly activities completed`}
          className="planner-week-segments"
        />
      </div>
    </header>
  );
}
