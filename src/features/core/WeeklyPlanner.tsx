import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { db } from "../../database/db";
import TaskCard from "../../components/TaskCard";
import Card from "../../components/Card";

const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const pillars = [
  "core",
  "chinese",
  "athletics",
  "cooking",
  "finance",
  "happiness",
] as const;

type Difficulty = "easy" | "medium" | "hard";

export default function WeeklyPlanner() {
  const [task, setTask] = useState("");
  const [day, setDay] = useState("Monday");
  const [pillar, setPillar] =
    useState<(typeof pillars)[number]>("core");
  const [difficulty, setDifficulty] =
    useState<Difficulty>("medium");

  const tasks = useLiveQuery(
    () => db.plannedActivities.toArray(),
    []
  );

  async function addTask() {
    if (!task.trim()) return;

    const xp =
      difficulty === "easy"
        ? 5
        : difficulty === "hard"
        ? 25
        : 10;

    await db.plannedActivities.add({
      title: task.trim(),
      completed: false,
      date: new Date().toISOString(),
      day,
      pillar,
      difficulty,
      xpReward: xp,
    });

    setTask("");
  }

  async function toggleTask(
    id: number,
    completed: boolean
  ) {
    await db.plannedActivities.update(id, {
      completed: !completed,
    });
  }

  async function deleteTask(id: number) {
    await db.plannedActivities.delete(id);
  }

  return (
    <div>
      <h2>This Week</h2>

      <Card>
        <input
          value={task}
          onChange={(e) => setTask(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              addTask();
            }
          }}
          placeholder="Add task..."
        />

        <select
          value={day}
          onChange={(e) => setDay(e.target.value)}
        >
          {days.map((dayName) => (
            <option key={dayName} value={dayName}>
              {dayName}
            </option>
          ))}
        </select>

        <select
          value={pillar}
          onChange={(e) =>
            setPillar(
              e.target.value as (typeof pillars)[number]
            )
          }
        >
          {pillars.map((pillarName) => (
            <option key={pillarName} value={pillarName}>
              {pillarName}
            </option>
          ))}
        </select>

        <select
          value={difficulty}
          onChange={(e) =>
            setDifficulty(e.target.value as Difficulty)
          }
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>

        <button onClick={addTask}>
          Add
        </button>
      </Card>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
          gap: "16px",
          marginTop: "24px",
        }}
      >
        {days.map((dayName) => (
          <Card key={dayName} title={dayName}>
            {tasks
              ?.filter((item) => item.day === dayName)
              .map((item) => (
                <TaskCard
                  key={item.id}
                  title={item.title}
                  pillar={item.pillar}
                  difficulty={item.difficulty}
                  xpReward={item.xpReward}
                  completed={item.completed}
                  onToggle={() =>
                    toggleTask(
                      item.id!,
                      item.completed
                    )
                  }
                  onDelete={() =>
                    deleteTask(item.id!)
                  }
                />
              ))}
          </Card>
        ))}
      </div>
    </div>
  );
}