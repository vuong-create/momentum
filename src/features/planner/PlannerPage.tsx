import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import useExperience from "../../experience/useExperience";
import ActivityDetailsPanel from "../activities/components/ActivityDetailsPanel";
import ActivityUndoToast from "../activities/components/ActivityUndoToast";
import useActivityUndo from "../activities/hooks/useActivityUndo";
import usePlanner from "./hooks/usePlanner";

import type {
  CreateActivityInput,
  PlannerActivity,
} from "./types";

import WeekHeader from "./components/WeekHeader";
import PlannerComposer from "./components/PlannerComposer";
import PlannerColumn from "./components/PlannerColumn";

import "./planner.css";

export default function PlannerPage() {
  const planner = usePlanner();
  const experience = useExperience();
  const activityUndo = useActivityUndo();
  const [requestedDateKey, setRequestedDateKey] = useState<string | null>(
    null
  );
  const [composerFocusRequest, setComposerFocusRequest] = useState(0);
  const [celebratingActivityId, setCelebratingActivityId] = useState<
    number | null
  >(null);
  const [selectedActivityId, setSelectedActivityId] = useState<
    number | null
  >(null);
  const celebrationTimer = useRef<number | null>(null);

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

  const closeActivityDetails = useCallback(() => {
    setSelectedActivityId(null);
  }, []);

  useEffect(() => {
    return () => {
      if (celebrationTimer.current) {
        window.clearTimeout(celebrationTimer.current);
      }
    };
  }, []);

  async function addActivity(input: CreateActivityInput) {
    await planner.addActivity(input);
    experience.playFeedback("task-added");
  }

  async function completeActivity(activity: PlannerActivity) {
    const willComplete = !activity.completed;

    await planner.completeActivity(activity);
    experience.playFeedback(
      willComplete ? "task-completed" : "task-reopened"
    );

    if (
      willComplete &&
      activity.id &&
      experience.motionEnabled
    ) {
      setCelebratingActivityId(activity.id);

      if (celebrationTimer.current) {
        window.clearTimeout(celebrationTimer.current);
      }

      celebrationTimer.current = window.setTimeout(
        () => setCelebratingActivityId(null),
        700
      );
    }
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
        onAdd={addActivity}
      />

      <div className="planner-board">
        {planner.days.map((day) => (
          <PlannerColumn
            key={day.dateKey}
            day={day}
            onRequestAdd={requestComposer}
            celebratingActivityId={celebratingActivityId}
            onOpenDetails={setSelectedActivityId}
            onComplete={completeActivity}
            onMove={planner.rescheduleActivity}
            onToggleImportant={planner.markImportant}
          />
        ))}
      </div>

      <ActivityDetailsPanel
        activityId={selectedActivityId}
        onClose={closeActivityDetails}
        onMutation={activityUndo.show}
      />
      <ActivityUndoToast
        notice={activityUndo.notice}
        onDismiss={activityUndo.dismiss}
        onUndo={activityUndo.undo}
      />
    </div>
  );
}
