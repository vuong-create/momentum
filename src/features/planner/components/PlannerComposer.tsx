import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

import {
  homePillars,
  pillarThemes,
  type PillarKey,
} from "../../../app/theme";

import type { Pillar } from "../../../database/db";
import type {
  CreateActivityInput,
  PlannerDay,
} from "../types";

type PlannerComposerProps = {
  days: PlannerDay[];
  selectedDateKey: string;
  focusRequest: number;
  onSelectDate: (dateKey: string) => void;
  onAdd: (input: CreateActivityInput) => Promise<void>;
};

const selectablePillars: PillarKey[] = ["core", ...homePillars];

export default function PlannerComposer({
  days,
  selectedDateKey,
  focusRequest,
  onSelectDate,
  onAdd,
}: PlannerComposerProps) {
  const composerRef = useRef<HTMLFormElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [pillar, setPillar] = useState<Pillar>("core");
  const [scheduledTime, setScheduledTime] = useState("");
  const [important, setImportant] = useState(false);
  const [notes, setNotes] = useState("");
  const [showTime, setShowTime] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (focusRequest === 0) return;

    composerRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    titleRef.current?.focus({ preventScroll: true });
  }, [focusRequest]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      await onAdd({
        title: title.trim(),
        scheduledDate: selectedDateKey,
        pillar,
        scheduledTime,
        important,
        notes,
      });

      setTitle("");
      setScheduledTime("");
      setImportant(false);
      setNotes("");
      setShowTime(false);
      setShowNotes(false);
      titleRef.current?.focus();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      ref={composerRef}
      className="planner-composer"
      onSubmit={handleSubmit}
    >
      <div className="planner-composer-heading">
        <span className="text-label">Quick add</span>
        <span>Enter to add · day and pillar stay selected</span>
      </div>

      <div className="planner-composer-input-row">
        <span aria-hidden="true">+</span>
        <input
          ref={titleRef}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="What do you want to make happen?"
          aria-label="Activity title"
        />
        <button
          className="planner-composer-submit"
          type="submit"
          disabled={!title.trim() || isSubmitting}
        >
          {isSubmitting ? "Adding…" : "Add task"}
        </button>
      </div>

      <div className="planner-composer-controls">
        <fieldset className="planner-composer-group planner-composer-days">
          <legend className="sr-only">Scheduled day</legend>
          {days.map((day) => (
            <button
              key={day.dateKey}
              type="button"
              className={
                selectedDateKey === day.dateKey ? "is-selected" : ""
              }
              aria-pressed={selectedDateKey === day.dateKey}
              aria-label={`${day.dayName}, ${day.dayNumber}`}
              onClick={() => onSelectDate(day.dateKey)}
            >
              {day.shortDayName}
              <span>{day.dayNumber}</span>
            </button>
          ))}
        </fieldset>

        <span className="planner-composer-divider" aria-hidden="true" />

        <fieldset className="planner-composer-group planner-composer-pillars">
          <legend className="sr-only">Pillar</legend>
          {selectablePillars.map((pillarKey) => {
            const theme = pillarThemes[pillarKey];

            return (
              <button
                key={pillarKey}
                type="button"
                className={`${theme.className} ${
                  pillar === pillarKey ? "is-selected" : ""
                }`}
                aria-pressed={pillar === pillarKey}
                onClick={() => setPillar(pillarKey)}
              >
                <span className="planner-composer-pillar-dot" />
                {theme.shortLabel}
              </button>
            );
          })}
        </fieldset>

        <div className="planner-composer-options">
          <button
            type="button"
            className={showTime ? "is-selected" : ""}
            aria-pressed={showTime}
            onClick={() => setShowTime((current) => !current)}
          >
            {showTime ? "Hide time" : "Add time"}
          </button>
          <button
            type="button"
            className={important ? "is-selected" : ""}
            aria-pressed={important}
            onClick={() => setImportant((current) => !current)}
          >
            {important ? "Important ✓" : "Important"}
          </button>
          <button
            type="button"
            className={showNotes ? "is-selected" : ""}
            aria-pressed={showNotes}
            onClick={() => setShowNotes((current) => !current)}
          >
            {showNotes ? "Hide notes" : "Notes"}
          </button>
        </div>
      </div>

      {(showTime || showNotes) && (
        <div className="planner-composer-details">
          {showTime && (
            <label>
              <span>Time</span>
              <input
                type="time"
                value={scheduledTime}
                onChange={(event) => setScheduledTime(event.target.value)}
              />
            </label>
          )}

          {showNotes && (
            <label className="planner-composer-notes">
              <span>Notes</span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={2}
                placeholder="Optional context"
              />
            </label>
          )}
        </div>
      )}
    </form>
  );
}
