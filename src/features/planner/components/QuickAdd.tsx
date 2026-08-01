import { useState } from "react";

import {
  homePillars,
  pillarThemes,
  type PillarKey,
} from "../../../app/theme";

import type {
  Difficulty,
  Pillar,
} from "../../../database/db";

import type { PlannerDay } from "../types";

import { createActivity } from "../services/plannerService";

type QuickAddProps = {
  days: PlannerDay[];
};

const difficultyOptions: {
  value: Difficulty;
  label: string;
  symbol: string;
}[] = [
  {
    value: "easy",
    label: "Easy",
    symbol: "○",
  },
  {
    value: "medium",
    label: "Medium",
    symbol: "◐",
  },
  {
    value: "hard",
    label: "Hard",
    symbol: "●",
  },
];

export default function QuickAdd({
  days,
}: QuickAddProps) {
  const today =
    days.find((day) => day.isToday) ?? days[0];

  const [title, setTitle] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    today?.dateKey ?? ""
  );

  const [pillar, setPillar] =
    useState<Pillar>("core");

  const [difficulty, setDifficulty] =
    useState<Difficulty>("medium");

  const selectablePillars: PillarKey[] = [
    "core",
    ...homePillars,
  ];

  async function handleSubmit() {
    if (!title.trim() || !selectedDate) return;

    await createActivity({
      title,
      scheduledDate: selectedDate,
      pillar,
      difficulty,
    });

    setTitle("");
  }

  return (
    <section className="planner-quick-add">
      <div className="planner-quick-add-primary">
        <input
          value={title}
          onChange={(event) =>
            setTitle(event.target.value)
          }
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              handleSubmit();
            }
          }}
          placeholder="Add an activity..."
          aria-label="Activity title"
        />

        <button
          className="button-primary"
          onClick={handleSubmit}
          disabled={!title.trim()}
        >
          Add Activity
        </button>
      </div>

      <div className="planner-quick-options">
        <div className="planner-option-group">
          <span className="planner-option-label">
            Day
          </span>

          <div className="planner-chip-row">
            {days.map((day) => (
              <button
                key={day.dateKey}
                className={[
                  "planner-chip",
                  selectedDate === day.dateKey
                    ? "planner-chip-active"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() =>
                  setSelectedDate(day.dateKey)
                }
              >
                {day.shortDayName}
              </button>
            ))}
          </div>
        </div>

        <div className="planner-option-group">
          <span className="planner-option-label">
            Pillar
          </span>

          <div className="planner-chip-row">
            {selectablePillars.map((pillarKey) => {
              const theme = pillarThemes[pillarKey];

              return (
                <button
                  key={pillarKey}
                  className={[
                    "planner-chip",
                    theme.className,
                    pillar === pillarKey
                      ? "planner-chip-active"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() =>
                    setPillar(pillarKey)
                  }
                >
                  <span className="planner-chip-dot" />
                  {theme.shortLabel}
                </button>
              );
            })}
          </div>
        </div>

        <div className="planner-option-group">
          <span className="planner-option-label">
            Effort
          </span>

          <div className="planner-chip-row">
            {difficultyOptions.map((option) => (
              <button
                key={option.value}
                className={[
                  "planner-chip",
                  difficulty === option.value
                    ? "planner-chip-active"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() =>
                  setDifficulty(option.value)
                }
              >
                <span>{option.symbol}</span>
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}