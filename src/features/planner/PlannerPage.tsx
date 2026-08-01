import usePlanner from "./hooks/usePlanner";

import WeekHeader from "./components/WeekHeader";
import PlannerColumn from "./components/PlannerColumn";

import "./planner.css";

export default function PlannerPage() {
  const planner = usePlanner();

  return (
    <div className="planner-page">
      <WeekHeader
        weekStartKey={planner.weekStartKey}
        completed={planner.completedActivities}
        total={planner.totalActivities}
        percentage={planner.completionPercentage}
        onPreviousWeek={planner.goToPreviousWeek}
        onNextWeek={planner.goToNextWeek}
        onCurrentWeek={planner.goToCurrentWeek}
      />

      <div className="planner-board">
        {planner.days.map((day) => (
          <PlannerColumn
            key={day.dateKey}
            day={day}
            onAdd={planner.addActivity}
            onComplete={planner.completeActivity}
            onMove={planner.rescheduleActivity}
            onToggleImportant={planner.markImportant}
            onDismiss={planner.dismiss}
          />
        ))}
      </div>
    </div>
  );
}
