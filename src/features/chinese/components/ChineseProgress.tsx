import { useMemo, useState } from "react";

import type { ChineseActivity, ChineseEntry } from "../../../database/db";
import { chineseActivityCatalog, getChineseActivityDefinition } from "../activityCatalog";
import {
  getChineseHeatmapDays,
  getChineseMonthSummary,
  getChineseStreaks,
  getPreviousMonth,
} from "../services/chineseQueries";
import type { ProgressionSummary } from "../../xp/progression";

type ChineseProgressProps = {
  activities: ChineseActivity[];
  todayActivities: ChineseActivity[];
  entries: ChineseEntry[];
  now: Date;
  pillarXP: number;
  progression: ProgressionSummary;
  onUndoActivity: (activity: ChineseActivity) => Promise<void>;
};

export default function ChineseProgress({ activities, todayActivities, entries, now, pillarXP, progression, onUndoActivity }: ChineseProgressProps) {
  const streaks = useMemo(() => getChineseStreaks(activities, now), [activities, now]);
  const currentMonth = useMemo(() => getChineseMonthSummary(activities, now), [activities, now]);
  const previousMonthDate = useMemo(() => getPreviousMonth(now), [now]);
  const previousMonth = useMemo(() => getChineseMonthSummary(activities, previousMonthDate), [activities, previousMonthDate]);
  const heatmapDays = useMemo(() => getChineseHeatmapDays(activities, now), [activities, now]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const selectedDay = heatmapDays.find((day) => day.dateKey === selectedDate);
  const maxCount = Math.max(1, ...Object.values(currentMonth.counts));
  const comparison = currentMonth.activeDays - previousMonth.activeDays;

  return (
    <section className="chinese-progress">
      <header className="chinese-section-header">
        <div><span className="text-label">Progress</span><h2>Consistency, not fluency</h2><p>A calm record of how often Chinese meaningfully appeared in your life.</p></div>
      </header>

      <div className="chinese-progress-stats">
        <article><span>Current streak</span><strong>{streaks.current}</strong><small>days</small></article>
        <article><span>Longest streak</span><strong>{streaks.longest}</strong><small>days</small></article>
        <article><span>Active days</span><strong>{streaks.totalActiveDays}</strong><small>lifetime</small></article>
        <article><span>Words & phrases</span><strong>{entries.length}</strong><small>saved</small></article>
      </div>

      <article className="chinese-level-card">
        <div><span className="text-label">Chinese pillar</span><strong>Level {progression.level}</strong><small>{pillarXP} XP from meaningful Chinese activity</small></div>
        <div><span style={{ width: `${progression.percentage}%` }} /></div>
        <p>{progression.xpToNextLevel} XP to Level {progression.level + 1}</p>
      </article>

      <section className="chinese-progress-today">
        <header>
          <div><span className="text-label">Activity</span><h3>Today’s Chinese</h3></div>
          <small>{todayActivities.length} logged</small>
        </header>
        {todayActivities.length === 0 ? (
          <div className="chinese-empty-small"><strong>Nothing logged yet.</strong><span>One meaningful moment is enough to make today active.</span></div>
        ) : (
          <div className="chinese-today-activity-list">
            {todayActivities.map((activity) => {
              const definition = getChineseActivityDefinition(activity.type);
              return (
                <article key={activity.id}>
                  <span>{definition.mark}</span>
                  <div><strong>{definition.label}</strong><small>{activity.plannedActivityId ? "Completed from your plan" : "Spontaneous activity"}</small></div>
                  <time>{new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(activity.createdAt))}</time>
                  <button type="button" onClick={() => onUndoActivity(activity)} aria-label={`Undo ${definition.label}`}>×</button>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="chinese-heatmap-card">
        <header>
          <div><span className="text-label">Last 52 weeks</span><h3>Chinese activity</h3></div>
          <div className="chinese-heatmap-legend"><span>Less</span><i /><i className="level-1" /><i className="level-2" /><i className="level-3" /><span>More</span></div>
        </header>
        <div className="chinese-heatmap-scroll">
          <div className="chinese-heatmap" aria-label="Chinese activity heatmap">
            {heatmapDays.map((day) => (
              <button
                type="button"
                key={day.dateKey}
                className={[
                  day.summary ? `level-${day.summary.level}` : "",
                  day.dateKey === selectedDate ? "is-selected" : "",
                  day.date > now ? "is-future" : "",
                ].filter(Boolean).join(" ")}
                title={`${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(day.date)} · ${day.summary?.activities.length ?? 0} activities`}
                onClick={() => setSelectedDate(day.dateKey === selectedDate ? null : day.dateKey)}
                disabled={day.date > now}
              />
            ))}
          </div>
        </div>
        {selectedDay && (
          <div className="chinese-heatmap-detail">
            <strong>{new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(selectedDay.date)}</strong>
            <span>{selectedDay.summary ? selectedDay.summary.activities.map((activity) => getChineseActivityDefinition(activity.type).label).join(" · ") : "No Chinese activity"}</span>
          </div>
        )}
      </section>

      <div className="chinese-progress-lower">
        <section className="chinese-month-card">
          <header><div><span className="text-label">This month</span><h3>{new Intl.DateTimeFormat("en-US", { month: "long" }).format(now)}</h3></div><strong>{currentMonth.activeDays}</strong></header>
          <p>{comparison === 0 ? "The same number of active days as last month." : comparison > 0 ? `${comparison} more active ${comparison === 1 ? "day" : "days"} than last month.` : `${Math.abs(comparison)} fewer active ${Math.abs(comparison) === 1 ? "day" : "days"} than last month.`}</p>
          <div><span>{currentMonth.totalActivities} activities</span><span>{previousMonth.activeDays} active days last month</span></div>
        </section>

        <section className="chinese-breakdown-card">
          <header><span className="text-label">Activity mix</span><h3>How Chinese showed up</h3></header>
          <div>
            {chineseActivityCatalog.map((definition) => {
              const count = currentMonth.counts[definition.type];
              return (
                <div key={definition.type}><span>{definition.mark}</span><strong>{definition.label}</strong><i><span style={{ width: `${(count / maxCount) * 100}%` }} /></i><b>{count}</b></div>
              );
            })}
          </div>
        </section>
      </div>
    </section>
  );
}
