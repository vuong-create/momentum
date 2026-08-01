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
import type { ActivityTemplate } from "../../database/db";
import {
  movePlannedActivity,
  softDeletePlannedActivity,
  unschedulePlannedActivity,
  updateActivityDetails,
} from "../activities/services/activityService";
import {
  deleteActivityTemplate,
  deleteCreatedActivityPlan,
  restoreActivityTemplate,
} from "../activities/services/recurrenceService";
import usePlanner from "./hooks/usePlanner";

import type {
  CreateActivityInput,
  PlannerActivity,
} from "./types";

import WeekHeader from "./components/WeekHeader";
import PlannerComposer from "./components/PlannerComposer";
import PlannerDayCarousel from "./components/PlannerDayCarousel";
import PlannerDayPanel from "./components/PlannerDayPanel";
import PlannerUnscheduled from "./components/PlannerUnscheduled";
import PlannerTemplates from "./components/PlannerTemplates";

import "./planner.css";

export default function PlannerPage() {
  const planner = usePlanner();
  const experience = useExperience();
  const activityUndo = useActivityUndo();
  const [requestedDateKey, setRequestedDateKey] = useState<string | null>(
    () => sessionStorage.getItem("momentum.planner.composer-day")
  );
  const [composerFocusRequest, setComposerFocusRequest] = useState(0);
  const [celebratingActivityId, setCelebratingActivityId] = useState<
    number | null
  >(null);
  const [selectedActivityId, setSelectedActivityId] = useState<
    number | null
  >(null);
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(
    () => sessionStorage.getItem("momentum.planner.selected-day")
  );
  const celebrationTimer = useRef<number | null>(null);

  useEffect(() => {
    if (requestedDateKey) {
      sessionStorage.setItem("momentum.planner.composer-day", requestedDateKey);
    }
  }, [requestedDateKey]);

  useEffect(() => {
    if (selectedDayKey) {
      sessionStorage.setItem("momentum.planner.selected-day", selectedDayKey);
    } else {
      sessionStorage.removeItem("momentum.planner.selected-day");
    }
  }, [selectedDayKey]);

  const preferredDay =
    planner.days.find((day) => day.isToday) ?? planner.days[0];
  const selectedDateKey = planner.days.some(
    (day) => day.dateKey === requestedDateKey
  )
    ? requestedDateKey!
    : preferredDay?.dateKey ?? planner.weekStartKey;

  function requestComposer(dateKey: string) {
    setRequestedDateKey(dateKey);
    setSelectedDayKey(null);
    setComposerFocusRequest((request) => request + 1);
  }

  function navigateWeek(navigate: () => void) {
    setRequestedDateKey(null);
    setSelectedDayKey(null);
    setSelectedActivityId(null);
    navigate();
  }

  const closeActivityDetails = useCallback(() => {
    setSelectedActivityId(null);
  }, []);

  const closeDayPanel = useCallback(() => {
    setSelectedDayKey(null);
  }, []);

  const selectedDay =
    planner.days.find((day) => day.dateKey === selectedDayKey) ?? null;

  function openActivityDetails(activityId: number, dateKey?: string) {
    if (dateKey) setSelectedDayKey(dateKey);
    setSelectedActivityId(activityId);
  }

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

  async function restoreActivityLocation(activity: PlannerActivity) {
    if (!activity.id) return Promise.resolve();
    if (activity.scheduledDate) {
      await movePlannedActivity(
        activity.id,
        activity.scheduledDate,
        activity.sortOrder
      );
    } else {
      await unschedulePlannedActivity(
        activity.id,
        activity.planningWeekStart ?? planner.weekStartKey,
        activity.sortOrder
      );
    }
    await updateActivityDetails(activity.id, {
      recurrenceOverride: activity.recurrenceOverride,
    });
  }

  async function moveActivity(activity: PlannerActivity, dateKey: string) {
    await planner.rescheduleActivity(activity, dateKey);
    experience.playFeedback("task-updated");
    activityUndo.show({
      message: `Moved to ${new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date(`${dateKey}T00:00:00`))}`,
      undo: () => restoreActivityLocation(activity),
    });
  }

  async function moveToUnscheduled(activity: PlannerActivity) {
    if (!activity.scheduledDate && activity.planningWeekStart === planner.weekStartKey) return;
    await planner.moveToUnscheduled(activity);
    experience.playFeedback("task-updated");
    activityUndo.show({
      message: "Moved to Unscheduled This Week",
      undo: () => restoreActivityLocation(activity),
    });
  }

  async function duplicateActivity(activity: PlannerActivity, dateKey: string) {
    const newId = await planner.copyActivity(activity, { scheduledDate: dateKey });
    experience.playFeedback("task-added");
    if (newId) {
      activityUndo.show({
        message: "Activity copied",
        undo: () => softDeletePlannedActivity(newId),
      });
    }
  }

  async function renameActivity(activity: PlannerActivity, title: string) {
    await planner.changeTitle(activity, title);
    experience.playFeedback("task-updated");
    activityUndo.show({
      message: "Activity renamed",
      undo: () => updateActivityDetails(activity.id!, { title: activity.title }),
    });
  }

  async function reorderActivities(activities: PlannerActivity[]) {
    const ids = activities.flatMap((activity) => activity.id ? [activity.id] : []);
    const previous = [...activities]
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .flatMap((activity) => activity.id ? [activity.id] : []);
    await planner.reorderActivityList(ids);
    experience.playFeedback("task-updated");
    activityUndo.show({ message: "Order updated", undo: () => planner.reorderActivityList(previous) });
  }

  async function sendToTop(activity: PlannerActivity, group: PlannerActivity[]) {
    const next = [activity, ...group.filter((item) => item.id !== activity.id)];
    await reorderActivities(next);
  }

  async function moveRemaining(activities: PlannerActivity[], dateKey: string) {
    await planner.rescheduleActivities(activities, dateKey);
    experience.playFeedback("task-updated");
    activityUndo.show({
      message: `${activities.length} ${activities.length === 1 ? "activity" : "activities"} moved`,
      undo: async () => {
        await Promise.all(activities.map(restoreActivityLocation));
      },
    });
  }

  function navigateDay(direction: -1 | 1) {
    if (!selectedDay) return;
    const index = planner.days.findIndex((day) => day.dateKey === selectedDay.dateKey);
    const target = planner.days[index + direction];
    if (target) setSelectedDayKey(target.dateKey);
  }

  async function addUnscheduled(title: string) {
    await addActivity({ title, planningWeekStart: planner.weekStartKey, pillar: "core" });
  }

  async function useTemplate(template: ActivityTemplate) {
    const newId = await planner.addFromTemplate(template, selectedDateKey);
    experience.playFeedback("task-added");
    activityUndo.show({
      message: `Added ${template.title}`,
      undo: () => deleteCreatedActivityPlan(newId),
    });
  }

  async function removeTemplate(template: ActivityTemplate) {
    if (!template.id) return;
    await deleteActivityTemplate(template.id);
    activityUndo.show({
      message: "Template removed",
      undo: () => restoreActivityTemplate(template.id!),
    });
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

      <PlannerTemplates
        templates={planner.templates}
        selectedDayLabel={
          planner.days.find((day) => day.dateKey === selectedDateKey)?.dayName ??
          "the selected day"
        }
        onUse={useTemplate}
        onDelete={removeTemplate}
      />

      <PlannerUnscheduled
        activities={planner.unscheduledActivities}
        days={planner.days}
        onAdd={addUnscheduled}
        onOpenDetails={(activityId) => openActivityDetails(activityId)}
        onSchedule={moveActivity}
        onUnschedule={moveToUnscheduled}
      />

      <PlannerDayCarousel
        days={planner.days}
        onOpenDay={setSelectedDayKey}
        onRequestAdd={requestComposer}
        onOpenDetails={openActivityDetails}
        onComplete={completeActivity}
        onMove={moveActivity}
      />

      {!selectedActivityId && (
        <PlannerDayPanel
          key={selectedDay?.dateKey ?? "closed"}
          day={selectedDay}
          weekDays={planner.days}
          celebratingActivityId={celebratingActivityId}
          onClose={closeDayPanel}
          onNavigate={navigateDay}
          onAdd={addActivity}
          onOpenDetails={(activityId) => openActivityDetails(activityId)}
          onComplete={completeActivity}
          onToggleImportant={planner.markImportant}
          onRename={renameActivity}
          onMove={moveActivity}
          onDuplicate={duplicateActivity}
          onSendToTop={sendToTop}
          onReorder={reorderActivities}
          onMoveRemaining={moveRemaining}
        />
      )}

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
