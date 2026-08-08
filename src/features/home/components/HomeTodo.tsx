import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { PlannedActivity } from "../../../database/db";
import useExperience from "../../../experience/useExperience";
import ActivityDetailsPanel from "../../activities/components/ActivityDetailsPanel";
import ActivityUndoToast from "../../activities/components/ActivityUndoToast";
import useActivityUndo from "../../activities/hooks/useActivityUndo";
import {
  dismissPlannedActivity,
  movePlannedActivity,
  restoreDismissedActivity,
} from "../../activities/services/activityService";
import { resolveActivityScheduledDate } from "../../activities/services/activityLifecycle";
import { toDateKey } from "../../planner/services/plannerService";

import HomeTodoItem from "./HomeTodoItem";
import TaskBrainstormModal from "./TaskBrainstormModal";
import UnfinishedActivities from "./UnfinishedActivities";

type HomeTodoProps = {
  todayActivities: PlannedActivity[];
  overdueActivities: PlannedActivity[];

  onAdd: (title: string) => Promise<void>;

  onToggle: (
    activity: PlannedActivity
  ) => Promise<void>;
};

function sortIncomplete(
  activities: PlannedActivity[]
) {
  return activities
    .filter((activity) => !activity.completed)
    .sort((first, second) => {
      if (
        first.scheduledTime &&
        second.scheduledTime
      ) {
        return first.scheduledTime.localeCompare(
          second.scheduledTime
        );
      }

      if (first.scheduledTime) return -1;
      if (second.scheduledTime) return 1;

      return (first.id ?? 0) - (second.id ?? 0);
    });
}

export default function HomeTodo({
  todayActivities,
  overdueActivities,
  onAdd,
  onToggle,
}: HomeTodoProps) {
  const experience = useExperience();
  const activityUndo = useActivityUndo();
  const [newTask, setNewTask] = useState("");
  const [adding, setAdding] = useState(false);
  const [showAddedFeedback, setShowAddedFeedback] = useState(false);
  const [brainstormOpen, setBrainstormOpen] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState<
    number | null
  >(null);
  const addedFeedbackTimer = useRef<number | null>(null);
  const completionFeedbackTimer = useRef<number | null>(null);

  const [
    celebratingActivityId,
    setCelebratingActivityId,
  ] = useState<number | null>(null);

  const [
    showCompleted,
    setShowCompleted,
  ] = useState(false);

  const incompleteToday = useMemo(
    () => sortIncomplete(todayActivities),
    [todayActivities]
  );

  const completedToday = useMemo(
    () =>
      todayActivities.filter(
        (activity) => activity.completed
      ),
    [todayActivities]
  );

  const allTodayComplete =
    todayActivities.length > 0 &&
    incompleteToday.length === 0;
  const todayKey = toDateKey(experience.now);
  const closeActivityDetails = useCallback(
    () => setSelectedActivityId(null),
    []
  );

  useEffect(() => {
    return () => {
      [addedFeedbackTimer, completionFeedbackTimer].forEach((timer) => {
        if (timer.current) window.clearTimeout(timer.current);
      });
    };
  }, []);

  function scheduleFeedbackClear(
    timer: typeof addedFeedbackTimer,
    callback: () => void,
    delay: number
  ) {
    if (timer.current) {
      window.clearTimeout(timer.current);
    }

    timer.current = window.setTimeout(callback, delay);
  }

  async function submitTask() {
    const title = newTask.trim();

    if (!title || adding) return;

    setAdding(true);

    try {
      await onAdd(title);
      setNewTask("");
      experience.playFeedback("task-added");

      if (experience.motionEnabled) {
        setShowAddedFeedback(true);
        scheduleFeedbackClear(
          addedFeedbackTimer,
          () => setShowAddedFeedback(false),
          420
        );
      }
    } finally {
      setAdding(false);
    }
  }

  async function addBrainstormTasks(tasks: string[]) {
    for (const task of tasks) {
      await onAdd(task);
    }
    experience.playFeedback("task-added");
  }

  async function handleToggle(
    activity: PlannedActivity
  ) {
    const willComplete = !activity.completed;

    if (
      willComplete &&
      activity.id &&
      experience.motionEnabled
    ) {
      setCelebratingActivityId(activity.id);
      scheduleFeedbackClear(
        completionFeedbackTimer,
        () => setCelebratingActivityId(null),
        700
      );
    }

    await onToggle(activity);
    experience.playFeedback(
      willComplete ? "task-completed" : "task-reopened"
    );

    if (!willComplete) {
      setShowCompleted(true);
    }
  }

  async function moveUnfinishedActivity(
    activity: PlannedActivity,
    scheduledDate: string,
    message: string
  ) {
    if (!activity.id) return;

    const previousDate = resolveActivityScheduledDate(activity, todayKey);

    if (!previousDate) return;
    const previousSortOrder = activity.sortOrder;

    await movePlannedActivity(activity.id, scheduledDate);
    experience.playFeedback("task-updated");
    activityUndo.show({
      message,
      undo: () =>
        movePlannedActivity(
          activity.id!,
          previousDate,
          previousSortOrder
        ),
    });
  }

  async function dismissUnfinishedActivity(activity: PlannedActivity) {
    if (!activity.id) return;

    await dismissPlannedActivity(activity.id);
    experience.playFeedback("task-dismissed");
    activityUndo.show({
      message: "Activity dismissed",
      undo: () => restoreDismissedActivity(activity.id!),
    });
  }

  return (
    <section className="home-todo">
      <div className="home-todo-heading">
        <div>
          <span className="home-todo-eyebrow">
            Today
          </span>

          <h2 className="font-pixel">To Do</h2>
        </div>

        <div className="home-todo-heading-actions">
          <button type="button" onClick={() => setBrainstormOpen(true)}>
            ✦ Brainstorm
          </button>
          <span className="home-todo-count">
            {incompleteToday.length} remaining
          </span>
        </div>
      </div>

      <div
        className={[
          "home-todo-input-strip",
          showAddedFeedback ? "home-todo-input-strip-confirmed" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <span aria-hidden="true">+</span>

        <input
          value={newTask}
          onChange={(event) =>
            setNewTask(event.target.value)
          }
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submitTask();
            }
          }}
          placeholder={
            todayActivities.length === 0
              ? "What needs your attention?"
              : "Add another task..."
          }
          aria-label="Add a task for today"
          disabled={adding}
        />
      </div>

      <div className="home-todo-content">
        <UnfinishedActivities
          activities={overdueActivities}
          todayKey={todayKey}
          onMoveToToday={(activity) =>
            moveUnfinishedActivity(activity, todayKey, "Moved to Today")
          }
          onReschedule={(activity, scheduledDate) =>
            moveUnfinishedActivity(
              activity,
              scheduledDate,
              "Activity rescheduled"
            )
          }
          onDismiss={dismissUnfinishedActivity}
          onOpenDetails={setSelectedActivityId}
        />

        {incompleteToday.length > 0 && (
          <div className="home-todo-group">
            {incompleteToday.map((activity) => (
              <HomeTodoItem
                key={activity.id}
                activity={activity}
                celebrating={
                  celebratingActivityId ===
                  activity.id
                }
                onToggle={handleToggle}
                onOpen={setSelectedActivityId}
              />
            ))}
          </div>
        )}

        {todayActivities.length === 0 && (
          <p className="home-todo-empty">
            Enjoy the day.
          </p>
        )}

        {allTodayComplete && (
          <div className="home-todo-finished">
            <strong>Everything’s done.</strong>
            <span>Enjoy the rest of your day.</span>
          </div>
        )}

        {completedToday.length > 0 && (
          <div className="home-todo-completed">
            <button
              type="button"
              className="home-todo-completed-toggle"
              onClick={() =>
                setShowCompleted((current) => !current)
              }
            >
              Completed ({completedToday.length})
              <span>
                {showCompleted ? "−" : "+"}
              </span>
            </button>

            {showCompleted && (
              <div className="home-todo-group home-todo-completed-list">
                {completedToday.map((activity) => (
                  <HomeTodoItem
                    key={activity.id}
                    activity={activity}
                    onToggle={handleToggle}
                    onOpen={setSelectedActivityId}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <ActivityDetailsPanel
        activityId={selectedActivityId}
        onClose={closeActivityDetails}
        onMutation={activityUndo.show}
      />
      <TaskBrainstormModal
        open={brainstormOpen}
        onClose={() => setBrainstormOpen(false)}
        onAddTasks={addBrainstormTasks}
      />
      <ActivityUndoToast
        notice={activityUndo.notice}
        onDismiss={activityUndo.dismiss}
        onUndo={activityUndo.undo}
      />
    </section>
  );
}
