import type {
  ActivityEvent,
  Difficulty,
  Pillar,
  PlannedActivity,
  XPEvent,
} from "../../../database/db";
import { getCookingActivityIdentity } from "../../cooking/cookingCatalog";

export type TaskLedgerStatus = "completed" | "active" | "dismissed" | "deleted" | "reopened";
export type TaskLedgerSource = "manual" | "preset" | "recurring" | "pillar";

export type TaskLedgerEntry = {
  activity: PlannedActivity;
  ledgerDate: string;
  completedAt?: string;
  everCompleted: boolean;
  status: TaskLedgerStatus;
  source: TaskLedgerSource;
  xp: number;
  xpVoided: boolean;
  cookingIdentity?: ReturnType<typeof getCookingActivityIdentity>;
};

export type TaskLedgerFilters = {
  query: string;
  month: string;
  pillar: "all" | Pillar;
  difficulty: "all" | Difficulty;
  status: "all" | TaskLedgerStatus;
  source: "all" | TaskLedgerSource;
  cookingIdentity: "all" | "meal" | "task" | "unclassified";
  order: "newest" | "oldest";
};

function getStatus(activity: PlannedActivity, event?: ActivityEvent): TaskLedgerStatus {
  if (activity.deletedAt) return "deleted";
  if (event?.voidedAt && !activity.completed) return "reopened";
  if (activity.completed || activity.status === "completed") return "completed";
  if (activity.status === "dismissed" || activity.status === "cancelled") return "dismissed";
  return "active";
}

function getSource(activity: PlannedActivity): TaskLedgerSource {
  if (activity.dayPresetId) return "preset";
  if (activity.recurrenceRuleId || activity.templateId) return "recurring";
  if (activity.activityKind) return "pillar";
  return "manual";
}

export function buildTaskLedgerEntries(
  activities: PlannedActivity[],
  activityEvents: ActivityEvent[],
  xpEvents: XPEvent[],
): TaskLedgerEntry[] {
  const eventByActivity = new Map<number, ActivityEvent>();
  for (const event of activityEvents) {
    const current = eventByActivity.get(event.plannedActivityId);
    if (!current || current.occurredAt < event.occurredAt) {
      eventByActivity.set(event.plannedActivityId, event);
    }
  }
  const xpByEvent = new Map<number, XPEvent>();
  for (const xp of xpEvents) {
    if (xp.activityEventId) xpByEvent.set(xp.activityEventId, xp);
  }

  return activities.flatMap((activity) => {
    if (!activity.id) return [];
    const event = eventByActivity.get(activity.id);
    const xp = event?.id ? xpByEvent.get(event.id) : undefined;
    return [{
      activity,
      ledgerDate: event?.occurredAt ?? activity.completedAt ?? activity.scheduledDate ?? activity.createdAt ?? activity.date,
      completedAt: event?.occurredAt ?? activity.completedAt,
      everCompleted: Boolean(event || activity.completedAt || activity.completed || activity.status === "completed"),
      status: getStatus(activity, event),
      source: getSource(activity),
      xp: xp?.finalXP ?? xp?.amount ?? 0,
      xpVoided: Boolean(xp?.voidedAt || event?.voidedAt),
      cookingIdentity: activity.pillar === "cooking"
        ? getCookingActivityIdentity(activity.activityKind)
        : undefined,
    }];
  });
}

export function filterTaskLedgerEntries(entries: TaskLedgerEntry[], filters: TaskLedgerFilters) {
  const query = filters.query.trim().toLocaleLowerCase();
  return entries
    .filter((entry) => !query || `${entry.activity.title} ${entry.activity.notes ?? ""}`.toLocaleLowerCase().includes(query))
    .filter((entry) => !filters.month || entry.ledgerDate.slice(0, 7) === filters.month)
    .filter((entry) => filters.pillar === "all" || entry.activity.pillar === filters.pillar)
    .filter((entry) => filters.difficulty === "all" || entry.activity.difficulty === filters.difficulty)
    .filter((entry) => filters.status === "all" || (
      filters.status === "completed"
        ? entry.everCompleted
        : entry.status === filters.status
    ))
    .filter((entry) => filters.source === "all" || entry.source === filters.source)
    .filter((entry) => filters.cookingIdentity === "all" || entry.cookingIdentity === filters.cookingIdentity)
    .sort((first, second) => filters.order === "newest"
      ? second.ledgerDate.localeCompare(first.ledgerDate)
      : first.ledgerDate.localeCompare(second.ledgerDate));
}
