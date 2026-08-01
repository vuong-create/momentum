import type {
  CreateActivityInput,
  PlannerActivity,
  PlannerDay,
} from "../types";

import PlannerTask from "./PlannerTask";
import QuickAdd from "./QuickAdd";

type PlannerColumnProps = {
  day: PlannerDay;
  onAdd: (input: CreateActivityInput) => Promise<void>;
  onComplete: (activity: PlannerActivity) => Promise<void>;
  onMove: (
    activity: PlannerActivity,
    scheduledDate: string
  ) => Promise<void>;
  onToggleImportant: (activity: PlannerActivity) => Promise<void>;
  onDismiss: (activity: PlannerActivity) => Promise<void>;
};

export default function PlannerColumn({
  day,
  onAdd,
  onComplete,
  onMove,
  onToggleImportant,
  onDismiss,
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
              onComplete={onComplete}
              onToggleImportant={onToggleImportant}
              onDismiss={onDismiss}
            />
          ))
        )}
      </div>

      <QuickAdd day={day} onAdd={onAdd} />
    </section>
  );
}
