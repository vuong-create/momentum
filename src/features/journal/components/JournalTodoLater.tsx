import { useState } from "react";

import { pillarThemes } from "../../../app/theme";
import type { PlannedActivity } from "../../../database/db";

type JournalTodoLaterProps = {
  activities: PlannedActivity[];
  todayKey: string;
  onMove: (activity: PlannedActivity, dateKey: string) => Promise<void>;
  onComplete: (activity: PlannedActivity) => Promise<void>;
  onOpen: (activityId: number) => void;
};

function savedLabel(value?: string) {
  if (!value) return "Saved for later";

  return `Saved ${new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value))}`;
}

export default function JournalTodoLater({
  activities,
  todayKey,
  onMove,
  onComplete,
  onOpen,
}: JournalTodoLaterProps) {
  const [chosenDates, setChosenDates] = useState<Record<number, string>>({});

  async function schedule(activity: PlannedActivity) {
    if (!activity.id) return;
    const dateKey = chosenDates[activity.id];
    if (!dateKey) return;

    await onMove(activity, dateKey);
    setChosenDates((current) => {
      const next = { ...current };
      delete next[activity.id!];
      return next;
    });
  }

  return (
    <section className="journal-todo-later">
      <header className="journal-todo-later-header">
        <div>
          <span className="text-label">Keep it without scheduling it</span>
          <h2 className="font-pixel">To Do Later</h2>
          <p>Ideas and intentions that matter, but do not need space in Today yet.</p>
        </div>
        <span><strong>{activities.length}</strong>{activities.length === 1 ? " item" : " items"}</span>
      </header>

      {activities.length > 0 ? (
        <div className="journal-todo-later-list">
          {activities.map((activity) => {
            if (!activity.id) return null;
            const theme = pillarThemes[activity.pillar];
            const dateKey = chosenDates[activity.id] ?? "";

            return (
              <article className={theme.className} key={activity.id}>
                <button className="journal-todo-later-open" type="button" onClick={() => onOpen(activity.id!)}>
                  <span className="journal-todo-later-mark" aria-hidden="true" />
                  <span>
                    <strong>{activity.title}</strong>
                    <small>{theme.shortLabel} · {savedLabel(activity.deferredAt)}</small>
                    {activity.notes && <p>{activity.notes}</p>}
                  </span>
                  <b>Edit</b>
                </button>

                <footer>
                  <button type="button" onClick={() => onComplete(activity)}>✓ Complete</button>
                  <button type="button" onClick={() => onMove(activity, todayKey)}>Move to Today</button>
                  <label>
                    <span>Choose date</span>
                    <input
                      type="date"
                      value={dateKey}
                      onChange={(event) => setChosenDates((current) => ({
                        ...current,
                        [activity.id!]: event.target.value,
                      }))}
                    />
                  </label>
                  <button type="button" disabled={!dateKey} onClick={() => schedule(activity)}>Schedule</button>
                </footer>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="journal-todo-later-empty">
          <span aria-hidden="true">◇</span>
          <strong>Nothing is waiting.</strong>
          <small>Open a task from Home or Planner, then choose “Move to To Do Later.”</small>
        </div>
      )}
    </section>
  );
}
