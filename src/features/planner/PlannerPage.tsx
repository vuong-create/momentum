import { useState } from "react";

import usePlanner from "./hooks/usePlanner";

import WeekHeader from "./components/WeekHeader";
import PlannerComposer from "./components/PlannerComposer";
import PlannerColumn from "./components/PlannerColumn";

import "./planner.css";

export default function PlannerPage() {
  const planner = usePlanner();
  const [requestedDateKey, setRequestedDateKey] = useState<string | null>(
    null
  );
  const [composerFocusRequest, setComposerFocusRequest] = useState(0);

  const preferredDay =
    planner.days.find((day) => day.isToday) ?? planner.days[0];
  const selectedDateKey = planner.days.some(
    (day) => day.dateKey === requestedDateKey
  )
    ? requestedDateKey!
    : preferredDay?.dateKey ?? planner.weekStartKey;

  function requestComposer(dateKey: string) {
    setRequestedDateKey(dateKey);
    setComposerFocusRequest((request) => request + 1);
  }

  function navigateWeek(navigate: () => void) {
    setRequestedDateKey(null);
    navigate();
  }

  return (
    <div className="planner-page">
      <WeekHeader
        weekStartKey={planner.weekStartKey}
        completed={planner.completedActivities}
        total={planner.totalActivities}
        percentage={planner.completionPercentage}
        onPreviousWeek={() => navigateWeek(planner.goToPreviousWeek)}
        onNextWeek={() => navigateWeek(planner.goToNextWeek)}
        onCurrentWeek={() => navigateWeek(planner.goToCurrentWeek)}
      />

      <PlannerComposer
        days={planner.days}
        selectedDateKey={selectedDateKey}
        focusRequest={composerFocusRequest}
        onSelectDate={setRequestedDateKey}
        onAdd={planner.addActivity}
      />

      <div className="planner-board">
        {planner.days.map((day) => (
          <PlannerColumn
            key={day.dateKey}
            day={day}
            onRequestAdd={requestComposer}
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
