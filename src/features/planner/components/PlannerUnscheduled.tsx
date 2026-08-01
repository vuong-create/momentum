import { useState, type FormEvent } from "react";

import { pillarThemes, type PillarKey } from "../../../app/theme";
import type { PlannerActivity, PlannerDay } from "../types";

type PlannerUnscheduledProps = {
  activities: PlannerActivity[];
  days: PlannerDay[];
  onAdd: (title: string) => Promise<void>;
  onOpenDetails: (activityId: number) => void;
  onSchedule: (activity: PlannerActivity, dateKey: string) => Promise<void>;
  onUnschedule: (activity: PlannerActivity) => Promise<void>;
};

export default function PlannerUnscheduled({
  activities,
  days,
  onAdd,
  onOpenDetails,
  onSchedule,
  onUnschedule,
}: PlannerUnscheduledProps) {
  const [expanded, setExpanded] = useState(activities.length > 0);
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onAdd(title.trim());
      setTitle("");
      setExpanded(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      className={`planner-unscheduled ${dragOver ? "is-drag-over" : ""}`}
      onDragOver={(event) => {
        event.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragOver(false);
        setExpanded(true);
        const transferred = event.dataTransfer.getData("application/momentum-activity");
        if (!transferred) return;
        try {
          onUnschedule(JSON.parse(transferred) as PlannerActivity);
        } catch {
          // Ignore drag data from outside Momentum.
        }
      }}
    >
      <button type="button" className="planner-unscheduled-heading" onClick={() => setExpanded((current) => !current)} aria-expanded={expanded}>
        <span><strong>Unscheduled this week</strong><small>Hold ideas here, then place them when the week has shape.</small></span>
        <span>{activities.length} {expanded ? "−" : "+"}</span>
      </button>

      {expanded && (
        <div className="planner-unscheduled-body">
          <form onSubmit={handleSubmit}>
            <span aria-hidden="true">+</span>
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Capture without choosing a day" aria-label="Unscheduled activity title" />
            <button type="submit" disabled={!title.trim() || submitting}>{submitting ? "Adding…" : "Add"}</button>
          </form>

          {activities.length > 0 && (
            <div className="planner-unscheduled-list">
              {activities.map((activity) => {
                const theme = pillarThemes[activity.pillar as PillarKey];
                return (
                  <article key={activity.id} className={`planner-unscheduled-item ${theme.className}`} draggable onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("application/momentum-activity", JSON.stringify(activity));
                  }}>
                    <button type="button" className="planner-unscheduled-title" onClick={() => activity.id && onOpenDetails(activity.id)}>
                      <i />
                      <span>{activity.title}</span>
                      <small>{theme.shortLabel}</small>
                    </button>
                    <div className="planner-unscheduled-days" aria-label={`Schedule ${activity.title}`}>
                      {days.map((day) => (
                        <button key={day.dateKey} type="button" title={`Move to ${day.dayName}`} onClick={() => onSchedule(activity, day.dateKey)}>{day.shortDayName.slice(0, 1)}</button>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
