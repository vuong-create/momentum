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

import type {
  ChineseActivityType,
  Pillar,
  RecurrencePattern,
} from "../../../database/db";
import RecurrenceControls from "../../activities/components/RecurrenceControls";
import {
  chineseActivityCatalog,
  getChineseActivityDefinition,
  getChineseActivityKind,
} from "../../chinese/activityCatalog";
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
  const keepOptionsRef = useRef(false);
  const [title, setTitle] = useState("");
  const [pillar, setPillar] = useState<Pillar>(() =>
    (localStorage.getItem("momentum.planner.pillar") as Pillar | null) ??
    "core"
  );
  const [scheduledTime, setScheduledTime] = useState("");
  const [chineseType, setChineseType] =
    useState<ChineseActivityType>("anki");
  const [important, setImportant] = useState(false);
  const [recurrence, setRecurrence] = useState<RecurrencePattern>();
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [notes, setNotes] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const selectedDay = days.find((day) => day.dateKey === selectedDateKey);

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
      const chineseDefinition = pillar === "chinese"
        ? getChineseActivityDefinition(chineseType)
        : null;

      await onAdd({
        title: title.trim(),
        scheduledDate: selectedDateKey,
        pillar,
        activityKind: chineseDefinition
          ? getChineseActivityKind(chineseType)
          : undefined,
        difficulty: chineseDefinition?.difficulty,
        scheduledTime,
        important,
        notes,
        recurrence,
        saveAsTemplate,
      });

      localStorage.setItem("momentum.planner.pillar", pillar);
      setConfirmation(`Added to ${selectedDay?.dayName ?? "the week"}`);
      window.setTimeout(() => setConfirmation(""), 2200);

      setTitle("");
      setScheduledTime("");
      setImportant(false);
      setNotes("");
      setRecurrence(undefined);
      setSaveAsTemplate(false);
      if (!keepOptionsRef.current) setShowOptions(false);
      keepOptionsRef.current = false;
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
        <span>
          {selectedDay
            ? `${selectedDay.dayName}, ${selectedDay.dayNumber}`
            : "Select a day"}
        </span>
      </div>

      <div className="planner-composer-input-row">
        <span aria-hidden="true">+</span>
        <input
          ref={titleRef}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              keepOptionsRef.current = true;
              composerRef.current?.requestSubmit();
            }
          }}
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
            className={showOptions ? "is-selected" : ""}
            aria-pressed={showOptions}
            onClick={() => setShowOptions((current) => !current)}
          >
            {showOptions ? "Hide options" : "Options"}
          </button>
        </div>
      </div>

      {pillar === "chinese" && (
        <fieldset className="planner-composer-chinese-types">
          <legend>Chinese activity</legend>
          <div>
            {chineseActivityCatalog.map((definition) => (
              <button
                key={definition.type}
                type="button"
                className={chineseType === definition.type ? "is-selected" : ""}
                aria-pressed={chineseType === definition.type}
                onClick={() => setChineseType(definition.type)}
              >
                <span>{definition.mark}</span>
                {definition.label}
              </button>
            ))}
          </div>
          <small>Logging this action from Chinese will complete the plan automatically.</small>
        </fieldset>
      )}

      {showOptions && (
        <div className="planner-composer-details">
          <label>
            <span>Time</span>
            <input
              type="time"
              value={scheduledTime}
              onChange={(event) => setScheduledTime(event.target.value)}
            />
          </label>

          <button
            type="button"
            className={`planner-composer-important ${
              important ? "is-selected" : ""
            }`}
            aria-pressed={important}
            onClick={() => setImportant((current) => !current)}
          >
            <span>{important ? "★" : "☆"}</span>
            {important ? "Marked important" : "Mark important"}
          </button>

          <label className="planner-composer-notes">
            <span>Notes</span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={2}
              placeholder="Optional context"
            />
          </label>

          <RecurrenceControls
            compact
            value={recurrence}
            startDate={selectedDateKey}
            onChange={setRecurrence}
          />

          <button
            type="button"
            className={`planner-composer-template-toggle ${
              saveAsTemplate ? "is-selected" : ""
            }`}
            aria-pressed={saveAsTemplate}
            onClick={() => setSaveAsTemplate((current) => !current)}
          >
            {saveAsTemplate ? "✓ Saved as reusable template" : "Save as reusable template"}
          </button>
        </div>
      )}

      {confirmation && (
        <span className="planner-composer-confirmation" role="status">
          ✓ {confirmation}
        </span>
      )}
    </form>
  );
}
