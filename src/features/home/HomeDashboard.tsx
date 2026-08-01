import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useLiveQuery } from "dexie-react-hooks";
import { useNavigate } from "react-router-dom";

import {
  db,
  type PlannedActivity,
} from "../../database/db";

import {
  pillarThemes,
  type PillarKey,
} from "../../app/theme";

import usePresence from "../../presence/usePresence";

import {
  getLevel,
  getLevelProgress,
  getLevelTitle,
} from "../gamification/levelSystem";

import {
  getDailyQuote,
  type MomentumQuote,
} from "./quotes";

import HomeTodo from "./components/HomeTodo";

import "./home-dashboard.css";
import "./components/home-todo.css";
import FlipClock from "./components/FlipClock";

const weekDayNames = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function padNumber(value: number) {
  return String(value).padStart(2, "0");
}

function toDateKey(date: Date) {
  return [
    date.getFullYear(),
    padNumber(date.getMonth() + 1),
    padNumber(date.getDate()),
  ].join("-");
}

function addDays(date: Date, amount: number) {
  const result = new Date(date);

  result.setDate(result.getDate() + amount);

  return result;
}

function getCurrentWeekStart(
  date = new Date()
) {
  const result = new Date(date);
  const currentDay = result.getDay();

  const mondayOffset =
    currentDay === 0
      ? -6
      : 1 - currentDay;

  result.setDate(
    result.getDate() + mondayOffset
  );

  result.setHours(0, 0, 0, 0);

  return result;
}

function resolveActivityDate(
  activity: PlannedActivity
) {
  if (activity.scheduledDate) {
    return activity.scheduledDate;
  }

  const dayIndex =
    weekDayNames.indexOf(activity.day);

  if (dayIndex < 0) {
    return null;
  }

  return toDateKey(
    addDays(
      getCurrentWeekStart(),
      dayIndex
    )
  );
}

export default function HomeDashboard() {
  const presence = usePresence();
  const navigate = useNavigate();

  const thoughtsRef =
    useRef<HTMLTextAreaElement>(null);

  const [thought, setThought] =
    useState("");

  const [
    thoughtStatus,
    setThoughtStatus,
  ] = useState<string | null>(null);

  const tasks =
    useLiveQuery(
      () => db.plannedActivities.toArray(),
      []
    ) ?? [];

  const xpEvents =
    useLiveQuery(
      () => db.xpEvents.toArray(),
      []
    ) ?? [];

  const savedQuotes =
    useLiveQuery(
      () => db.savedQuotes.toArray(),
      []
    ) ?? [];

  const today = presence.now;
  const todayKey = toDateKey(today);

  const quote = getDailyQuote(todayKey);

  const quoteSaved = savedQuotes.some(
    (savedQuote) =>
      savedQuote.quoteKey === quote.id
  );

  const totalXP = xpEvents.reduce(
    (sum, event) => sum + event.amount,
    0
  );

  const level = getLevel(totalXP);

  const levelProgress =
    getLevelProgress(totalXP);

  const levelTitle =
    getLevelTitle(level);

  const todayActivities = useMemo(
    () =>
      tasks.filter(
        (activity) =>
          resolveActivityDate(activity) ===
          todayKey
      ),
    [tasks, todayKey]
  );

  const overdueActivities = useMemo(
    () =>
      tasks
        .filter((activity) => {
          const scheduledDate =
            resolveActivityDate(activity);

          return (
            Boolean(scheduledDate) &&
            scheduledDate! < todayKey &&
            !activity.completed
          );
        })
        .sort((first, second) =>
          (
            resolveActivityDate(first) ?? ""
          ).localeCompare(
            resolveActivityDate(second) ?? ""
          )
        ),
    [tasks, todayKey]
  );

  const weekStart =
    getCurrentWeekStart(today);

  const weekDays = useMemo(
    () =>
      weekDayNames.map(
        (dayName, index) => {
          const date = addDays(
            weekStart,
            index
          );

          const dateKey =
            toDateKey(date);

          const activities =
            tasks.filter(
              (activity) =>
                resolveActivityDate(
                  activity
                ) === dateKey
            );

          return {
            dayName,
            shortDayName:
              dayName.slice(0, 3),
            date,
            dateKey,
            activities,
            completed:
              activities.filter(
                (activity) =>
                  activity.completed
              ).length,
            isToday:
              dateKey === todayKey,
          };
        }
      ),
    [tasks, todayKey]
  );

  const weeklyActivities =
    weekDays.flatMap(
      (day) => day.activities
    );

  const weeklyCompleted =
    weeklyActivities.filter(
      (activity) =>
        activity.completed
    ).length;

  const weeklyPercentage =
    weeklyActivities.length > 0
      ? Math.round(
          (
            weeklyCompleted /
            weeklyActivities.length
          ) * 100
        )
      : 0;

  useEffect(() => {
    const textarea =
      thoughtsRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";

    textarea.style.height = `${Math.max(
      textarea.scrollHeight,
      150
    )}px`;
  }, [thought]);

  async function addTodayActivity(
    title: string
  ) {
    const day =
      new Intl.DateTimeFormat(
        "en-US",
        {
          weekday: "long",
        }
      ).format(today);

    await db.plannedActivities.add({
      title,
      completed: false,
      date: new Date().toISOString(),
      day,
      scheduledDate: todayKey,
      pillar: "core",
      difficulty: "medium",
      xpReward: 10,
    });
  }

  async function togglePlannedActivity(
    activity: PlannedActivity
  ) {
    if (!activity.id) {
      return;
    }

    const willComplete =
      !activity.completed;

    await db.plannedActivities.update(
      activity.id,
      {
        completed: willComplete,
      }
    );

    if (willComplete) {
      await db.xpEvents.add({
        amount: activity.xpReward,
        source:
          `activity:${activity.id}`,
        date:
          new Date().toISOString(),
      });
    }
  }

  async function toggleQuote(
    quoteToToggle: MomentumQuote
  ) {
    const existing =
      savedQuotes.find(
        (savedQuote) =>
          savedQuote.quoteKey ===
          quoteToToggle.id
      );

    if (existing?.id) {
      await db.savedQuotes.delete(
        existing.id
      );

      return;
    }

    await db.savedQuotes.add({
      quoteKey: quoteToToggle.id,
      text: quoteToToggle.text,
      author: quoteToToggle.author,
      savedAt:
        new Date().toISOString(),
    });
  }

  function clearThoughtWithStatus(
    status: string
  ) {
    setThoughtStatus(status);

    window.setTimeout(() => {
      setThought("");
    }, 250);

    window.setTimeout(() => {
      setThoughtStatus(null);
    }, 1400);
  }

  async function saveAsNote() {
    const text = thought.trim();

    if (!text) {
      return;
    }

    const now =
      new Date().toISOString();

    await db.notes.add({
      text,
      createdAt: now,
      updatedAt: now,
    });

    clearThoughtWithStatus(
      "Added to Notes"
    );
  }

  function continueInJournal() {
    const text = thought.trim();

    if (!text) {
      return;
    }

    localStorage.setItem(
      "momentum-journal-draft",
      text
    );

    setThoughtStatus(
      "Opening Journal"
    );

    window.setTimeout(() => {
      navigate("/journal");
    }, 400);
  }

  return (
    <div className="living-home">
      <header className="living-home-header">
        <div className="living-home-intro">
          <span className="living-home-label">
            Today
          </span>

          <div className="living-home-date-clock">
            <div className="living-home-date-copy">
              <h1 className="font-pixel">
                {new Intl.DateTimeFormat(
                  "en-US",
                  {
                    month: "long",
                    day: "numeric",
                  }
                ).format(today)}
              </h1>

              <p className="living-home-weekday">
                {new Intl.DateTimeFormat(
                  "en-US",
                  {
                    weekday: "long",
                  }
                ).format(today)}
              </p>
            </div>

            <FlipClock />
          </div>

          {presence.greeting && (
            <span className="living-home-greeting">
              {presence.greeting}
            </span>
          )}

          <div className="daily-quote">
            <blockquote className="font-quote">
              “{quote.text}”
            </blockquote>

            <div className="daily-quote-footer">
              <cite className="font-quote">
                — {quote.author}
              </cite>

              <button
                type="button"
                className={[
                  "daily-quote-save",
                  quoteSaved
                    ? "daily-quote-save-active"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() =>
                  toggleQuote(quote)
                }
              >
                {quoteSaved
                  ? "♥ Saved"
                  : "♡ Save"}
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="momentum-level-display"
          aria-label="Momentum level details"
        >
          <div className="momentum-level-topline">
            <strong>
              Level {level}
            </strong>

            <span>
              {totalXP} XP
            </span>
          </div>

          <div className="momentum-level-bar">
            <div
              className="momentum-level-fill"
              style={{
                width:
                  `${levelProgress}%`,
              }}
            >
              <span />
            </div>
          </div>

          <small>{levelTitle}</small>
        </button>
      </header>

      <main className="living-home-main">
        <HomeTodo
          todayActivities={
            todayActivities
          }
          overdueActivities={
            overdueActivities
          }
          onAdd={addTodayActivity}
          onToggle={
            togglePlannedActivity
          }
        />

        <section className="home-thoughts">
          <h2 className="font-pixel">
            Thoughts
          </h2>

          <div
            className={[
              "home-thoughts-box",
              thoughtStatus
                ? "home-thoughts-box-saving"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <textarea
              ref={thoughtsRef}
              value={thought}
              onChange={(event) =>
                setThought(
                  event.target.value
                )
              }
              aria-label="Thoughts"
            />

            {thoughtStatus && (
              <span className="home-thought-status">
                ✓ {thoughtStatus}
              </span>
            )}
          </div>

          <div
            className={[
              "home-thought-actions",
              thought.trim()
                ? "home-thought-actions-visible"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <button
              type="button"
              onClick={saveAsNote}
            >
              Note
            </button>

            <button
              type="button"
              onClick={
                continueInJournal
              }
            >
              Journal
            </button>
          </div>
        </section>
      </main>

      <section className="home-week-view">
        <div className="home-week-heading">
          <div>
            <span className="living-home-label">
              This Week
            </span>

            <h2 className="font-pixel">
              Weekly Progress
            </h2>
          </div>

          <div className="home-week-summary">
            <strong>
              {weeklyPercentage}%
            </strong>

            <span>
              {weeklyCompleted} of{" "}
              {weeklyActivities.length}{" "}
              activities
            </span>
          </div>
        </div>

       <div
  className="home-week-segments"
  aria-label={`${weeklyPercentage}% of weekly activities completed`}
>
  {Array.from({ length: 10 }).map((_, index) => {
    const segmentThreshold = (index + 1) * 10;

    return (
      <span
        key={index}
        className={
          weeklyPercentage >= segmentThreshold
            ? "home-week-segment-complete"
            : ""
        }
      />
    );
  })}
</div>

        <div className="home-week-grid">
          {weekDays.map((day) => (
            <article
              className={[
                "home-week-day",
                day.isToday
                  ? "home-week-day-today"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
              key={day.dateKey}
            >
              <header>
                <div>
                  <span>
                    {day.shortDayName}
                  </span>

                  <strong>
                    {day.date.getDate()}
                  </strong>
                </div>

                <small>
                  {day.completed}/
                  {day.activities.length}
                </small>
              </header>

              <div className="home-week-day-content">
                {day.activities.length ===
                0 ? (
                  <span className="home-week-open">
                    Open
                  </span>
                ) : (
                  day.activities
                    .slice(0, 3)
                    .map((activity) => {
                      const theme =
                        pillarThemes[
                          activity.pillar as PillarKey
                        ];

                      return (
                        <div
                          className={[
                            "home-week-task",
                            theme.className,
                            activity.completed
                              ? "home-week-task-complete"
                              : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          key={activity.id}
                        >
                          <span />

                          <p>
                            {activity.title}
                          </p>
                        </div>
                      );
                    })
                )}

                {day.activities.length >
                  3 && (
                  <small className="home-week-more">
                    +
                    {day.activities.length -
                      3}{" "}
                    more
                  </small>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}