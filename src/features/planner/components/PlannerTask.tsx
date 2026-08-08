import { useEffect, useRef, useState } from "react";

import {
  pillarThemes,
  type PillarKey,
} from "../../../app/theme";
import type { Pillar } from "../../../database/db";
import PillarIcon from "../../activities/components/PillarIcon";
import PillarQuickSelect from "../../activities/components/PillarQuickSelect";
import { calculatePlannedXP } from "../../activities/services/activityLifecycle";
import {
  addDays,
  addWeeks,
  formatActivityTime,
  getWeekStart,
  toDateKey,
} from "../services/plannerService";
import type { PlannerActivity, PlannerDay } from "../types";

type PlannerTaskProps = {
  activity: PlannerActivity;
  weekDays?: PlannerDay[];
  celebrating?: boolean;
  onOpenDetails: (activityId: number) => void;
  onComplete: (activity: PlannerActivity) => Promise<void>;
  onToggleImportant: (activity: PlannerActivity) => Promise<void>;
  onChangePillar: (activity: PlannerActivity, pillar: Pillar) => Promise<void>;
  onRename?: (activity: PlannerActivity, title: string) => Promise<void>;
  onMove?: (activity: PlannerActivity, dateKey: string) => Promise<void>;
  onDuplicate?: (activity: PlannerActivity, dateKey: string) => Promise<void>;
  onSendToTop?: (activity: PlannerActivity) => Promise<void>;
  onDropBefore?: (dragged: PlannerActivity, target: PlannerActivity) => Promise<void>;
};

export default function PlannerTask({
  activity,
  weekDays = [],
  celebrating = false,
  onOpenDetails,
  onComplete,
  onToggleImportant,
  onChangePillar,
  onRename,
  onMove,
  onDuplicate,
  onSendToTop,
  onDropBefore,
}: PlannerTaskProps) {
  const theme = pillarThemes[activity.pillar as PillarKey];
  const menuRef = useRef<HTMLDivElement>(null);
  const editRef = useRef<HTMLInputElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(activity.title);

  useEffect(() => {
    if (!menuOpen) return;

    function closeMenu(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    }

    document.addEventListener("mousedown", closeMenu);
    return () => document.removeEventListener("mousedown", closeMenu);
  }, [menuOpen]);

  useEffect(() => {
    if (editing) editRef.current?.select();
  }, [editing]);

  async function saveTitle() {
    const nextTitle = draftTitle.trim();
    setEditing(false);
    if (!onRename || !nextTitle || nextTitle === activity.title) {
      setDraftTitle(activity.title);
      return;
    }
    await onRename(activity, nextTitle);
  }

  const today = new Date();
  const quickMoves = [
    { label: "Today", dateKey: toDateKey(today) },
    { label: "Tomorrow", dateKey: toDateKey(addDays(today, 1)) },
    {
      label: "Next week",
      dateKey: toDateKey(addWeeks(getWeekStart(today), 1)),
    },
  ];

  return (
    <article
      draggable={!editing}
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData(
          "application/momentum-activity",
          JSON.stringify(activity)
        );
      }}
      onDragOver={(event) => {
        if (onDropBefore) event.preventDefault();
      }}
      onDrop={(event) => {
        if (!onDropBefore) return;
        event.preventDefault();
        event.stopPropagation();
        const transferred = event.dataTransfer.getData(
          "application/momentum-activity"
        );
        if (!transferred) return;
        try {
          onDropBefore(JSON.parse(transferred) as PlannerActivity, activity);
        } catch {
          // Ignore drag data from outside Momentum.
        }
      }}
      className={[
        "planner-task",
        theme.className,
        activity.completed ? "planner-task-complete" : "",
        celebrating ? "planner-task-celebrating" : "",
        activity.important ? "planner-task-important" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <button
        type="button"
        className="planner-task-toggle"
        onClick={() => onComplete(activity)}
        aria-label={
          activity.completed
            ? `Mark ${activity.title} incomplete`
            : `Complete ${activity.title}`
        }
      >
        <span className="planner-task-pillar-icon"><PillarIcon pillar={activity.pillar as PillarKey} /></span>
        <span className="planner-task-check-mark">✓</span>
      </button>

      {editing ? (
        <input
          ref={editRef}
          className="planner-task-title-edit"
          value={draftTitle}
          onChange={(event) => setDraftTitle(event.target.value)}
          onBlur={saveTitle}
          onKeyDown={(event) => {
            if (event.key === "Enter") saveTitle();
            if (event.key === "Escape") {
              setDraftTitle(activity.title);
              setEditing(false);
            }
          }}
          aria-label={`Rename ${activity.title}`}
        />
      ) : (
        <button
          type="button"
          className="planner-task-content"
          onClick={() => activity.id && onOpenDetails(activity.id)}
          onDoubleClick={(event) => {
            if (!onRename) return;
            event.preventDefault();
            setEditing(true);
          }}
          aria-label={`Open details for ${activity.title}`}
        >
          <strong>{activity.title}</strong>
          <div className="planner-task-meta">
            {activity.scheduledTime && (
              <span>{formatActivityTime(activity.scheduledTime)}</span>
            )}
            {activity.recurrenceRuleId && <span>↻ Repeat</span>}
          </div>
        </button>
      )}

      <PillarQuickSelect
        value={activity.pillar}
        onChange={(pillar) => onChangePillar(activity, pillar)}
      />

      <div className="planner-task-actions">
        <button
          type="button"
          className="planner-task-action"
          onClick={() => onToggleImportant(activity)}
          aria-label={activity.important ? "Remove importance" : "Mark important"}
          title={activity.important ? "Not important" : "Important"}
        >
          {activity.important ? "★" : "☆"}
        </button>

        <div className="planner-task-menu-wrap" ref={menuRef}>
          <button
            type="button"
            className="planner-task-action planner-task-details"
            onClick={() => setMenuOpen((current) => !current)}
            aria-expanded={menuOpen}
            aria-label={`Actions for ${activity.title}`}
          >
            ···
          </button>

          {menuOpen && (
            <div className="planner-task-menu">
              <button type="button" onClick={() => activity.id && onOpenDetails(activity.id)}>
                Details
              </button>
              {onRename && (
                <button type="button" onClick={() => { setMenuOpen(false); setEditing(true); }}>
                  Rename
                </button>
              )}
              {onSendToTop && (
                <button type="button" onClick={() => { setMenuOpen(false); onSendToTop(activity); }}>
                  Send to top
                </button>
              )}
              {onMove && (
                <>
                  <span>Quick move</span>
                  {quickMoves.map((move) => (
                    <button key={move.label} type="button" onClick={() => { setMenuOpen(false); onMove(activity, move.dateKey); }}>
                      {move.label}
                    </button>
                  ))}
                  <label className="planner-task-menu-date">
                    Pick date
                    <input type="date" onChange={(event) => {
                      if (!event.target.value) return;
                      setMenuOpen(false);
                      onMove(activity, event.target.value);
                    }} />
                  </label>
                </>
              )}
              {onDuplicate && weekDays.length > 0 && (
                <>
                  <span>Copy to</span>
                  <div className="planner-task-copy-days">
                    {weekDays.map((day) => (
                      <button key={day.dateKey} type="button" title={day.dayName} onClick={() => { setMenuOpen(false); onDuplicate(activity, day.dateKey); }}>
                        {day.shortDayName.slice(0, 1)}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {celebrating && (
        <span className="planner-task-xp">
          +{calculatePlannedXP(activity.xpReward).finalXP} XP
        </span>
      )}
    </article>
  );
}
