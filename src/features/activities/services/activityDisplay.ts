import type { PlannedActivity } from "../../../database/db";

/** Format a calendar date directly, avoiding timezone-dependent date shifts. */
export function datedWorkoutLabel(name: string, date: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return name;
  return `${name} · ${match[2]}/${match[3]}/${match[1].slice(-2)}`;
}

export function activityDisplayTitle(activity: Pick<PlannedActivity, "title" | "activityKind" | "originalScheduledDate" | "scheduledDate" | "date">) {
  if (!/^athletics-plan-session:\d+$/.test(activity.activityKind ?? "")) return activity.title;
  // Carrying a workout forward should not erase which session it originally was.
  // Older generated titles embedded the workout description after a separator.
  // Keep those saved records intact while displaying the same compact label.
  const name = activity.title.split(" · ")[0];
  return datedWorkoutLabel(name, activity.originalScheduledDate || activity.scheduledDate || activity.date);
}
