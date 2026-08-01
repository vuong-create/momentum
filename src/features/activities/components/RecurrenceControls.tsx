import type { RecurrenceFrequency, RecurrencePattern } from "../../../database/db";
import { describeRecurrence } from "../services/recurrenceService";

import "./recurrence-controls.css";

type RecurrenceControlsProps = {
  value?: RecurrencePattern;
  startDate: string;
  onChange: (value?: RecurrencePattern) => void;
  compact?: boolean;
};

const weekdays = ["S", "M", "T", "W", "T", "F", "S"];

function startDay(startDate: string) {
  return startDate ? new Date(`${startDate}T00:00:00`).getDay() : new Date().getDay();
}

export default function RecurrenceControls({
  value,
  startDate,
  onChange,
  compact = false,
}: RecurrenceControlsProps) {
  const isWeekdays =
    value?.frequency === "weekly" &&
    JSON.stringify(value.weekdays) === JSON.stringify([1, 2, 3, 4, 5]);
  const preset = !value
    ? "none"
    : value.interval > 1
      ? "custom"
      : value.frequency === "daily"
        ? "daily"
        : isWeekdays
          ? "weekdays"
          : value.frequency;

  function choosePreset(next: string) {
    const day = startDay(startDate);
    if (next === "none") onChange(undefined);
    if (next === "daily") onChange({ frequency: "daily", interval: 1 });
    if (next === "weekdays") {
      onChange({ frequency: "weekly", interval: 1, weekdays: [1, 2, 3, 4, 5] });
    }
    if (next === "weekly") {
      onChange({ frequency: "weekly", interval: 1, weekdays: [day] });
    }
    if (next === "monthly") {
      onChange({
        frequency: "monthly",
        interval: 1,
        monthDay: startDate ? Number(startDate.slice(-2)) : new Date().getDate(),
      });
    }
    if (next === "custom") {
      onChange({ frequency: value?.frequency ?? "weekly", interval: Math.max(2, value?.interval ?? 2), weekdays: value?.weekdays ?? [day] });
    }
  }

  function patch(next: Partial<RecurrencePattern>) {
    if (!value) return;
    onChange({ ...value, ...next });
  }

  return (
    <div className={`recurrence-controls ${compact ? "is-compact" : ""}`}>
      <label>
        <span>Repeat</span>
        <select value={preset} onChange={(event) => choosePreset(event.target.value)}>
          <option value="none">Does not repeat</option>
          <option value="daily">Daily</option>
          <option value="weekdays">Weekdays</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="custom">Custom interval</option>
        </select>
      </label>

      {value && (
        <>
          {preset === "custom" && (
            <div className="recurrence-custom-row">
              <label>
                <span>Every</span>
                <input type="number" min={1} max={52} value={value.interval} onChange={(event) => patch({ interval: Math.max(1, Number(event.target.value)) })} />
              </label>
              <label>
                <span>Unit</span>
                <select value={value.frequency} onChange={(event) => patch({ frequency: event.target.value as RecurrenceFrequency })}>
                  <option value="daily">Days</option>
                  <option value="weekly">Weeks</option>
                  <option value="monthly">Months</option>
                </select>
              </label>
            </div>
          )}

          {value.frequency === "weekly" && (
            <fieldset className="recurrence-weekdays">
              <legend>On days</legend>
              <div>
                {weekdays.map((label, day) => {
                  const selected = (value.weekdays ?? []).includes(day);
                  return (
                    <button key={day} type="button" className={selected ? "is-selected" : ""} aria-pressed={selected} aria-label={["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][day]} onClick={() => {
                      const current = value.weekdays ?? [];
                      const next = selected ? current.filter((item) => item !== day) : [...current, day].sort();
                      if (next.length > 0) patch({ weekdays: next });
                    }}>{label}</button>
                  );
                })}
              </div>
            </fieldset>
          )}

          <label>
            <span>Ends</span>
            <input type="date" min={startDate} value={value.endDate ?? ""} onChange={(event) => patch({ endDate: event.target.value || undefined })} />
          </label>
          <small>{describeRecurrence(value)}</small>
        </>
      )}
    </div>
  );
}
