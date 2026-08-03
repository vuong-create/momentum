import type {
  AthleticsTemplate,
  AthleticsWorkout,
  PlannedActivity,
  VolleyballSessionType,
} from "../../../database/db";
import { getActivityStatus, isActivityVisible } from "../../activities/services/activityLifecycle";
import { volleyballSessionCatalog } from "../athleticsCatalog";
import {
  getRecentPersonalRecords,
  getWeeklyConsistency,
} from "../services/athleticsQueries";
import { toDateKey } from "../services/athleticsService";

type AthleticsDashboardProps = {
  templates: AthleticsTemplate[];
  workouts: AthleticsWorkout[];
  plannedActivities: PlannedActivity[];
  now: Date;
  onStartTemplate: (id: number) => Promise<void>;
  onStartCustom: () => Promise<void>;
  onLogVolleyball: (type: VolleyballSessionType) => Promise<void>;
  onOpenWorkout: (id: number) => void;
  onOpenTemplates: () => void;
  loggingVolleyball: VolleyballSessionType | null;
};

function formatTrainingDate(dateKey: string, now: Date) {
  const todayKey = toDateKey(now);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateKey === todayKey) return "Today";
  if (dateKey === toDateKey(yesterday)) return "Yesterday";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" })
    .format(new Date(`${dateKey}T12:00:00`));
}

export default function AthleticsDashboard({
  templates,
  workouts,
  plannedActivities,
  now,
  onStartTemplate,
  onStartCustom,
  onLogVolleyball,
  onOpenWorkout,
  onOpenTemplates,
  loggingVolleyball,
}: AthleticsDashboardProps) {
  const completed = workouts.filter((workout) => workout.status === "completed");
  const recent = completed.slice(0, 4);
  const recentPR = getRecentPersonalRecords(completed)[0];
  const weekly = getWeeklyConsistency(workouts, plannedActivities, now);
  const todayKey = toDateKey(now);
  const upcoming = plannedActivities
    .filter(
      (activity) =>
        activity.pillar === "athletics" &&
        Boolean(activity.scheduledDate) &&
        activity.scheduledDate! >= todayKey &&
        isActivityVisible(activity) &&
        getActivityStatus(activity) !== "completed"
    )
    .sort((first, second) => first.scheduledDate!.localeCompare(second.scheduledDate!))
    .slice(0, 3);

  return (
    <section className="athletics-dashboard">
      <div className="athletics-hero-grid">
        <article className="athletics-card athletics-quick-start">
          <header>
            <div><span className="text-label">Quick start</span><h2>What are we training?</h2></div>
            <button type="button" className="athletics-text-button" onClick={onOpenTemplates}>Manage</button>
          </header>
          <div className="athletics-template-launchers">
            {templates.slice(0, 5).map((template, index) => (
              <button key={template.id} type="button" onClick={() => onStartTemplate(template.id!)}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{template.name}</strong>
                <small>{template.exercises.length} exercises</small>
                <i aria-hidden="true">→</i>
              </button>
            ))}
            <button type="button" className="is-custom" onClick={onStartCustom}>
              <span>＋</span><strong>Custom</strong><small>Start from quiet</small><i aria-hidden="true">→</i>
            </button>
          </div>
        </article>

        <aside className="athletics-card athletics-week-card">
          <span className="text-label">This week</span>
          <div><strong>{weekly.completed}</strong><span>/ {weekly.planned}</span></div>
          <p>{weekly.planned === 0 ? "No sessions planned yet." : weekly.completed === weekly.planned ? "Planned training complete." : `${weekly.planned - weekly.completed} planned ${weekly.planned - weekly.completed === 1 ? "session" : "sessions"} remaining.`}</p>
          <div className="athletics-week-segments" aria-label={`${weekly.completed} of ${weekly.planned} planned sessions completed`}>
            {Array.from({ length: Math.max(weekly.planned, 4) }, (_, index) => (
              <i key={index} className={index < weekly.completed ? "is-complete" : index >= weekly.planned ? "is-open" : ""} />
            ))}
          </div>
          <small>Rest days are part of the plan.</small>
        </aside>
      </div>

      <article className="athletics-card athletics-volleyball-card">
        <div className="athletics-volleyball-copy">
          <span className="athletics-sport-mark" aria-hidden="true"><i /><i /><i /></span>
          <div><span className="text-label">Volleyball</span><h3>Log it in one tap.</h3><p>No scorecard. No unnecessary form.</p></div>
        </div>
        <div className="athletics-volleyball-actions">
          {volleyballSessionCatalog.map((session) => (
            <button key={session.type} type="button" disabled={Boolean(loggingVolleyball)} onClick={() => onLogVolleyball(session.type)}>
              <span>{session.mark}</span>{loggingVolleyball === session.type ? "Logging…" : session.label}
            </button>
          ))}
        </div>
      </article>

      <div className="athletics-dashboard-lower">
        <article className="athletics-card athletics-recent-card">
          <header><div><span className="text-label">Recent training</span><h3>Keep the thread</h3></div><small>{completed.length} lifetime</small></header>
          {recent.length === 0 ? (
            <div className="athletics-empty"><strong>Your training record starts here.</strong><span>Begin a workout or log volleyball above.</span></div>
          ) : (
            <div className="athletics-recent-list">
              {recent.map((workout) => (
                <button key={workout.id} type="button" onClick={() => onOpenWorkout(workout.id!)}>
                  <span className={`athletics-kind-mark is-${workout.kind}`}>{workout.kind === "gym" ? "G" : "V"}</span>
                  <span><strong>{workout.name}</strong><small>{workout.kind === "gym" ? `${workout.exercises.reduce((sum, exercise) => sum + exercise.sets.filter((set) => set.completed).length, 0)} sets` : "Session logged"}</small></span>
                  <time>{formatTrainingDate(workout.date, now)}</time>
                </button>
              ))}
            </div>
          )}
        </article>

        <article className="athletics-card athletics-pr-card">
          <span className="text-label">Recent PR</span>
          {recentPR ? (
            <>
              <span className="athletics-pr-glyph" aria-hidden="true">◇</span>
              <h3>{recentPR.exerciseName}</h3>
              <strong>{recentPR.weight} <small>lb</small> × {recentPR.reps}</strong>
              <p>{recentPR.type === "weight" ? "New weight best" : `New rep best at ${recentPR.weight} lb`} · {formatTrainingDate(recentPR.date, now)}</p>
            </>
          ) : (
            <div className="athletics-empty"><strong>A quiet place for progress.</strong><span>PRs appear automatically after a previous performance exists.</span></div>
          )}
        </article>

        <article className="athletics-card athletics-upcoming-card">
          <header><div><span className="text-label">From Planner</span><h3>Coming up</h3></div></header>
          {upcoming.length === 0 ? (
            <div className="athletics-empty"><strong>The week is open.</strong><span>Schedule a template when you want more structure.</span></div>
          ) : upcoming.map((activity) => (
            <div className="athletics-upcoming-row" key={activity.id}>
              <time><strong>{new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(new Date(`${activity.scheduledDate}T12:00:00`))}</strong><small>{new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(`${activity.scheduledDate}T12:00:00`))}</small></time>
              <span>{activity.title}</span>
              <i className={activity.important ? "is-important" : ""} />
            </div>
          ))}
        </article>
      </div>
    </section>
  );
}
