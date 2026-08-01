import type {
  PlannerActivity,
  PlannerDay,
} from "../types";

import PlannerTask from "./PlannerTask";

type PlannerColumnProps = {
  day: PlannerDay;
  celebratingActivityId: number | null;
  onRequestAdd: (dateKey: string) => void;
  onOpenDetails: (activityId: number) => void;
  onComplete: (activity: PlannerActivity) => Promise<void>;
  onMove: (
    activity: PlannerActivity,
    scheduledDate: string
  ) => Promise<void>;
  onToggleImportant: (activity: PlannerActivity) => Promise<void>;
};

export default function PlannerColumn({
  day,
  celebratingActivityId,
  onRequestAdd,
  onOpenDetails,
  onComplete,
  onMove,
  onToggleImportant,
}: PlannerColumnProps) {
  const completed = day.activities.filter(
    (activity) => activity.completed
  ).length;

  return (
    <section
      className={[
        "planner-column",
        day.isToday ? "planner-column-today" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        const transferred = event.dataTransfer.getData(
          "application/momentum-activity"
        );

        if (!transferred) return;

        const activity = JSON.parse(transferred) as PlannerActivity;
        onMove(activity, day.dateKey);
      }}
    >
      <header className="planner-column-header">
        <div>
          <span className="planner-column-day">
            {day.shortDayName}
          </span>

          <strong>{day.dayNumber}</strong>
        </div>

        {day.activities.length > 0 && (
          <span className="planner-column-count">
            {completed}/{day.activities.length}
          </span>
        )}
      </header>

      <div className="planner-column-content">
        {day.activities.length === 0 ? (
          <div className="planner-empty-day">
            <span>Open space</span>
          </div>
        ) : (
          day.activities.map((activity) => (
            <PlannerTask
              key={activity.id}
              activity={activity}
              celebrating={celebratingActivityId === activity.id}
              onOpenDetails={onOpenDetails}
              onComplete={onComplete}
              onToggleImportant={onToggleImportant}
            />
          ))
        )}
      </div>

      <button
        className="planner-day-add"
        type="button"
        onClick={() => onRequestAdd(day.dateKey)}
        aria-label={`Add activity to ${day.dayName}`}
      >
        <span>+</span>
        Add to {day.shortDayName}
      </button>
    </section>
  );
}
