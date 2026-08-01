import type { PlannerDay } from "../types";

import PlannerTask from "./PlannerTask";

type PlannerColumnProps = {
  day: PlannerDay;
};

export default function PlannerColumn({
  day,
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
    >
      <header className="planner-column-header">
        <div>
          <span className="planner-column-day">
            {day.shortDayName}
          </span>

          <strong>{day.dayNumber}</strong>
        </div>

        <span className="planner-column-count">
          {completed}/{day.activities.length}
        </span>
      </header>

      <div className="planner-column-content">
        {day.activities.length === 0 ? (
          <div className="planner-empty-day">
            <span>Nothing planned.</span>
            <p>Enjoy the space.</p>
          </div>
        ) : (
          day.activities.map((activity) => (
            <PlannerTask
              key={activity.id}
              activity={activity}
            />
          ))
        )}
      </div>
    </section>
  );
}