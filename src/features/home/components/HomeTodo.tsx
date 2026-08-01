import {
  useMemo,
  useState,
} from "react";

import type { PlannedActivity } from "../../../database/db";

import HomeTodoItem from "./HomeTodoItem";

type HomeTodoProps = {
  todayActivities: PlannedActivity[];
  overdueActivities: PlannedActivity[];

  onAdd: (title: string) => Promise<void>;

  onToggle: (
    activity: PlannedActivity
  ) => Promise<void>;
};

function playCompletionSound() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (
        window as typeof window & {
          webkitAudioContext?: typeof AudioContext;
        }
      ).webkitAudioContext;

    if (!AudioContextClass) return;

    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sine";

    oscillator.frequency.setValueAtTime(
      590,
      context.currentTime
    );

    oscillator.frequency.exponentialRampToValueAtTime(
      830,
      context.currentTime + 0.11
    );

    gain.gain.setValueAtTime(
      0.0001,
      context.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.045,
      context.currentTime + 0.015
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      context.currentTime + 0.18
    );

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start();
    oscillator.stop(context.currentTime + 0.19);
  } catch {
    // Sound feedback is optional.
  }
}

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
  const [newTask, setNewTask] = useState("");
  const [adding, setAdding] = useState(false);

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

  async function submitTask() {
    const title = newTask.trim();

    if (!title || adding) return;

    setAdding(true);

    try {
      await onAdd(title);
      setNewTask("");
    } finally {
      setAdding(false);
    }
  }

  async function handleToggle(
    activity: PlannedActivity
  ) {
    const willComplete = !activity.completed;

    if (willComplete && activity.id) {
      setCelebratingActivityId(activity.id);
      playCompletionSound();

      window.setTimeout(() => {
        setCelebratingActivityId(null);
      }, 700);
    }

    await onToggle(activity);

    if (!willComplete) {
      setShowCompleted(true);
    }
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

        <span className="home-todo-count">
          {incompleteToday.length} remaining
        </span>
      </div>

      <div className="home-todo-input-strip">
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
        {overdueActivities.length > 0 && (
          <div className="home-todo-group">
            <span className="home-todo-overdue-label">
              Overdue
            </span>

            {overdueActivities.map((activity) => (
              <HomeTodoItem
                key={activity.id}
                activity={activity}
                overdue
                celebrating={
                  celebratingActivityId ===
                  activity.id
                }
                onToggle={handleToggle}
              />
            ))}
          </div>
        )}

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
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}