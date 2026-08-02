import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";

import { getActivityStatus } from "../../activities/services/activityLifecycle";
import {
  addDays,
  addMonths,
  buildPlannerMonthDays,
  fromDateKey,
  getActivitiesForMonth,
  sortActivitiesForFocus,
  toDateKey,
  toMonthKey,
} from "../services/plannerService";

type PlannerMonthOverviewProps = {
  activeWeekStartKey: string;
  onOpenDay: (dateKey: string) => void;
};

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getMonthForWeek(weekStartKey: string) {
  return toMonthKey(addDays(fromDateKey(weekStartKey), 3));
}

export default function PlannerMonthOverview({
  activeWeekStartKey,
  onOpenDay,
}: PlannerMonthOverviewProps) {
  const [monthKey, setMonthKey] = useState(() => getMonthForWeek(activeWeekStartKey));
  const liveActivities = useLiveQuery(
    () => getActivitiesForMonth(monthKey),
    [monthKey]
  );
  const activities = useMemo(() => liveActivities ?? [], [liveActivities]);
  const days = useMemo(
    () => buildPlannerMonthDays(monthKey, activities),
    [monthKey, activities]
  );
  const monthDate = fromDateKey(`${monthKey}-01`);
  const monthActivities = days
    .filter((day) => day.isInMonth)
    .flatMap((day) => day.activities);
  const completed = monthActivities.filter((activity) =>
    getActivityStatus(activity) === "completed"
  ).length;
  const activeWeekEndKey = toDateKey(
    addDays(fromDateKey(activeWeekStartKey), 6)
  );

  return (
    <section className="planner-month-overview" aria-labelledby="planner-month-title">
      <header>
        <div>
          <span className="text-label">Month overview</span>
          <h2 id="planner-month-title">
            {new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(monthDate)}
          </h2>
          <p>{completed} of {monthActivities.length} scheduled activities complete</p>
        </div>
        <div className="planner-month-navigation">
          <button type="button" onClick={() => setMonthKey((current) => addMonths(current, -1))} aria-label="Previous month">←</button>
          <button type="button" onClick={() => setMonthKey(toMonthKey(new Date()))}>This month</button>
          <button type="button" onClick={() => setMonthKey((current) => addMonths(current, 1))} aria-label="Next month">→</button>
        </div>
      </header>

      <div className="planner-month-scroll">
        <div className="planner-month-weekdays" aria-hidden="true">
          {weekdayLabels.map((label) => <span key={label}>{label}</span>)}
        </div>

        <div className="planner-month-grid">
          {days.map((day) => {
            const preview = sortActivitiesForFocus(day.activities).slice(0, 2);
            const remaining = Math.max(0, day.activities.length - preview.length);
            const isInActiveWeek =
              day.dateKey >= activeWeekStartKey &&
              day.dateKey <= activeWeekEndKey;

            return (
              <button
                type="button"
                key={day.dateKey}
                className={[
                  "planner-month-day",
                  day.isInMonth ? "" : "is-outside-month",
                  day.isToday ? "is-today" : "",
                  isInActiveWeek ? "is-active-week" : "",
                ].filter(Boolean).join(" ")}
                onClick={() => onOpenDay(day.dateKey)}
                aria-label={`${day.dayName}, ${new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric" }).format(day.date)} · ${day.activities.length} activities`}
              >
                <span className="planner-month-date">
                  <strong>{day.dayNumber}</strong>
                  {day.isToday && <small>Today</small>}
                  {day.activities.length > 0 && <b>{day.activities.length}</b>}
                </span>
                <span className="planner-month-day-activities">
                  {preview.map((activity) => (
                    <span
                      key={activity.id}
                      className={`pillar-${activity.pillar}${getActivityStatus(activity) === "completed" ? " is-completed" : ""}`}
                    >
                      <i />{activity.title}
                    </span>
                  ))}
                  {remaining > 0 && <small>+{remaining} more</small>}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
