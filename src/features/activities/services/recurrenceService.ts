import { db } from "../../../database/db";
import type {
  ActivityTemplate,
  PlannedActivity,
  RecurrencePattern,
  RecurrenceRule,
} from "../../../database/db";
import type { ActivityDetailsPatch, CreateActivityInput } from "../types";
import {
  cancelPlannedActivity,
  createPlannedActivity,
  updateActivityDetails,
} from "./activityService";

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function fromDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function getWeekStart(date: Date) {
  return addDays(date, -date.getDay());
}

function dayDifference(firstKey: string, secondKey: string) {
  const first = fromDateKey(firstKey);
  const second = fromDateKey(secondKey);
  return Math.round(
    (Date.UTC(second.getFullYear(), second.getMonth(), second.getDate()) -
      Date.UTC(first.getFullYear(), first.getMonth(), first.getDate())) /
      86_400_000
  );
}

export function normalizeRecurrence(
  pattern: RecurrencePattern,
  startDate: string
): RecurrencePattern {
  const start = fromDateKey(startDate);
  const weekdays = pattern.weekdays?.length
    ? [...new Set(pattern.weekdays)].sort((a, b) => a - b)
    : [start.getDay()];

  return {
    frequency: pattern.frequency,
    interval: Math.max(1, Math.floor(pattern.interval || 1)),
    weekdays: pattern.frequency === "weekly" ? weekdays : undefined,
    monthDay:
      pattern.frequency === "monthly"
        ? pattern.monthDay ?? start.getDate()
        : undefined,
    endDate: pattern.endDate || undefined,
  };
}

export function describeRecurrence(pattern: RecurrencePattern) {
  const interval = Math.max(1, pattern.interval || 1);
  if (pattern.frequency === "daily") {
    return interval === 1 ? "Every day" : `Every ${interval} days`;
  }
  if (pattern.frequency === "monthly") {
    const day = pattern.monthDay ?? 1;
    return interval === 1
      ? `Monthly on day ${day}`
      : `Every ${interval} months on day ${day}`;
  }

  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const days = (pattern.weekdays ?? []).map((day) => names[day]).join(", ");
  return interval === 1
    ? `Weekly${days ? ` · ${days}` : ""}`
    : `Every ${interval} weeks${days ? ` · ${days}` : ""}`;
}

function matchesRule(rule: RecurrenceRule, dateKey: string) {
  if (!rule.active || dateKey < rule.startDate) return false;
  if (rule.endDate && dateKey > rule.endDate) return false;

  const interval = Math.max(1, rule.interval || 1);
  const date = fromDateKey(dateKey);

  if (rule.frequency === "daily") {
    return dayDifference(rule.startDate, dateKey) % interval === 0;
  }

  if (rule.frequency === "weekly") {
    const startWeekKey = toDateKey(getWeekStart(fromDateKey(rule.startDate)));
    const dateWeekKey = toDateKey(getWeekStart(date));
    const weekDistance = dayDifference(startWeekKey, dateWeekKey) / 7;
    return (
      weekDistance % interval === 0 &&
      (rule.weekdays ?? [fromDateKey(rule.startDate).getDay()]).includes(
        date.getDay()
      )
    );
  }

  const start = fromDateKey(rule.startDate);
  const monthDistance =
    (date.getFullYear() - start.getFullYear()) * 12 +
    date.getMonth() -
    start.getMonth();
  return (
    monthDistance >= 0 &&
    monthDistance % interval === 0 &&
    date.getDate() === (rule.monthDay ?? start.getDate())
  );
}

function getFirstOccurrenceDate(
  startDate: string,
  pattern: RecurrencePattern
) {
  const rule: RecurrenceRule = {
    ...pattern,
    templateId: 0,
    startDate,
    active: true,
    createdAt: "",
    updatedAt: "",
  };
  for (let offset = 0; offset < 370; offset += 1) {
    const dateKey = toDateKey(addDays(fromDateKey(startDate), offset));
    if (matchesRule(rule, dateKey)) return dateKey;
  }
  return startDate;
}

function templateFromInput(
  input: CreateActivityInput,
  saved: boolean,
  recurrencePreset?: RecurrencePattern
): Omit<ActivityTemplate, "id"> {
  const now = new Date().toISOString();
  return {
    title: input.title.trim(),
    pillar: input.pillar ?? "core",
    activityKind: input.activityKind,
    difficulty: input.difficulty ?? "medium",
    scheduledTime: input.scheduledTime || undefined,
    important: input.important ?? false,
    notes: input.notes?.trim() || undefined,
    recurrencePreset,
    saved,
    createdAt: now,
    updatedAt: now,
  };
}

async function attachOccurrence(
  activityId: number,
  templateId: number,
  ruleId: number,
  recurrenceDate: string
) {
  await db.plannedActivities.update(activityId, {
    templateId,
    recurrenceRuleId: ruleId,
    recurrenceDate,
    recurrenceKey: `${ruleId}:${recurrenceDate}`,
    recurrenceOverride: false,
  });
}

export async function createActivityPlan(input: CreateActivityInput) {
  if (!input.recurrence && !input.saveAsTemplate) {
    return createPlannedActivity(input);
  }
  if (input.recurrence && !input.scheduledDate) {
    throw new Error("Recurring activities need a starting date.");
  }

  return db.transaction(
    "rw",
    db.plannedActivities,
    db.activityTemplates,
    db.recurrenceRules,
    async () => {
      const recurrence = input.recurrence && input.scheduledDate
        ? normalizeRecurrence(input.recurrence, input.scheduledDate)
        : undefined;
      const templateId = await db.activityTemplates.add(
        templateFromInput(input, Boolean(input.saveAsTemplate), recurrence)
      );
      const occurrenceDate = recurrence && input.scheduledDate
        ? getFirstOccurrenceDate(input.scheduledDate, recurrence)
        : input.scheduledDate;
      const activityId = await createPlannedActivity({
        ...input,
        scheduledDate: occurrenceDate,
      });

      if (!recurrence || !input.scheduledDate || !occurrenceDate) {
        await db.plannedActivities.update(activityId, { templateId });
        return activityId;
      }

      const now = new Date().toISOString();
      const ruleId = await db.recurrenceRules.add({
        ...recurrence,
        templateId,
        startDate: input.scheduledDate,
        active: true,
        createdAt: now,
        updatedAt: now,
      });
      await attachOccurrence(
        activityId,
        templateId,
        ruleId,
        occurrenceDate
      );
      return activityId;
    }
  );
}

export async function listSavedTemplates() {
  return db.activityTemplates
    .filter((template) => template.saved && !template.deletedAt)
    .toArray();
}

export async function instantiateTemplate(
  template: ActivityTemplate,
  scheduledDate: string
) {
  if (!template.id) throw new Error("Template was not found.");

  const input: CreateActivityInput = {
    title: template.title,
    scheduledDate,
    pillar: template.pillar,
    activityKind: template.activityKind,
    difficulty: template.difficulty,
    scheduledTime: template.scheduledTime,
    important: template.important,
    notes: template.notes,
  };

  if (!template.recurrencePreset) {
    const activityId = await createPlannedActivity(input);
    await db.plannedActivities.update(activityId, { templateId: template.id });
    return activityId;
  }

  return db.transaction(
    "rw",
    db.plannedActivities,
    db.recurrenceRules,
    async () => {
      const pattern = normalizeRecurrence(template.recurrencePreset!, scheduledDate);
      const occurrenceDate = getFirstOccurrenceDate(scheduledDate, pattern);
      const now = new Date().toISOString();
      const ruleId = await db.recurrenceRules.add({
        ...pattern,
        templateId: template.id!,
        startDate: scheduledDate,
        active: true,
        createdAt: now,
        updatedAt: now,
      });
      const activityId = await createPlannedActivity({
        ...input,
        scheduledDate: occurrenceDate,
      });
      await attachOccurrence(activityId, template.id!, ruleId, occurrenceDate);
      return activityId;
    }
  );
}

export async function materializeOccurrencesForWeek(weekStartKey: string) {
  const rules = await db.recurrenceRules
    .filter((rule) => rule.active && (!rule.endDate || rule.endDate >= weekStartKey))
    .toArray();
  if (rules.length === 0) return;

  const weekStart = fromDateKey(weekStartKey);
  const dates = Array.from({ length: 7 }, (_, index) =>
    toDateKey(addDays(weekStart, index))
  );

  return db.transaction(
    "rw",
    db.plannedActivities,
    db.activityTemplates,
    async () => {
      for (const rule of rules) {
        if (!rule.id) continue;
        const template = await db.activityTemplates.get(rule.templateId);
        if (!template || template.deletedAt) continue;

        for (const dateKey of dates) {
          if (!matchesRule(rule, dateKey)) continue;
          const recurrenceKey = `${rule.id}:${dateKey}`;
          const existing = await db.plannedActivities
            .where("recurrenceKey")
            .equals(recurrenceKey)
            .first();
          if (existing) continue;

          const activityId = await createPlannedActivity({
            title: template.title,
            scheduledDate: dateKey,
            pillar: template.pillar,
            activityKind: template.activityKind,
            difficulty: template.difficulty,
            scheduledTime: template.scheduledTime,
            important: template.important,
            notes: template.notes,
          });
          await attachOccurrence(
            activityId,
            template.id!,
            rule.id,
            dateKey
          );
        }
      }
    }
  );
}

export async function getRecurrenceRule(ruleId?: number) {
  return ruleId ? db.recurrenceRules.get(ruleId) : undefined;
}

export async function updateSingleOccurrence(
  activity: PlannedActivity,
  patch: ActivityDetailsPatch
) {
  if (!activity.id) return;
  await updateActivityDetails(activity.id, {
    ...patch,
    recurrenceOverride: Boolean(activity.recurrenceRuleId),
  });
}

export async function updateFutureOccurrences(
  activity: PlannedActivity,
  patch: ActivityDetailsPatch,
  recurrence?: RecurrencePattern
) {
  if (!activity.id || !activity.recurrenceRuleId || !activity.templateId) {
    return updateSingleOccurrence(activity, patch);
  }

  const effectiveDate = activity.recurrenceDate ?? activity.scheduledDate;
  if (!effectiveDate) return;
  const now = new Date().toISOString();
  const templatePatch = {
    title: patch.title,
    pillar: patch.pillar,
    activityKind: patch.activityKind,
    difficulty: patch.difficulty,
    scheduledTime: patch.scheduledTime,
    important: patch.important,
    notes: patch.notes,
    updatedAt: now,
  };

  await db.transaction(
    "rw",
    db.plannedActivities,
    db.activityTemplates,
    db.recurrenceRules,
    async () => {
      await db.activityTemplates.update(activity.templateId!, templatePatch);
      await updateActivityDetails(activity.id!, patch);
      if (recurrence) {
        const currentRule = await db.recurrenceRules.get(
          activity.recurrenceRuleId!
        );
        const normalized = normalizeRecurrence(recurrence, effectiveDate);
        await db.recurrenceRules.update(activity.recurrenceRuleId!, {
          ...normalized,
          startDate: effectiveDate,
          updatedAt: now,
        });
        await db.activityTemplates.update(activity.templateId!, {
          recurrencePreset: normalized,
        });

        if (currentRule) {
          const updatedRule: RecurrenceRule = {
            ...currentRule,
            ...normalized,
            startDate: effectiveDate,
            updatedAt: now,
          };
          const materialized = await db.plannedActivities
            .where("recurrenceRuleId")
            .equals(activity.recurrenceRuleId!)
            .toArray();
          await db.plannedActivities.bulkDelete(
            materialized
              .filter(
                (item) =>
                  (item.recurrenceDate ?? "") >= effectiveDate &&
                  item.id !== activity.id &&
                  !item.recurrenceOverride &&
                  !item.completed &&
                  !matchesRule(updatedRule, item.recurrenceDate ?? "")
              )
              .flatMap((item) => (item.id ? [item.id] : []))
          );
        }
      }

      const occurrences = await db.plannedActivities
        .where("recurrenceRuleId")
        .equals(activity.recurrenceRuleId!)
        .toArray();
      await Promise.all(
        occurrences
          .filter(
            (item) =>
              (item.recurrenceDate ?? "") >= effectiveDate &&
              !item.recurrenceOverride &&
              !item.completed
          )
          .map((item) =>
            db.plannedActivities.update(item.id!, {
              ...templatePatch,
              updatedAt: now,
            })
          )
      );
    }
  );
}

export async function applyRecurrenceToActivity(
  activity: PlannedActivity,
  pattern: RecurrencePattern,
  saveAsTemplate = false
) {
  if (!activity.id || !activity.scheduledDate) return;
  const normalized = normalizeRecurrence(pattern, activity.scheduledDate);
  const input: CreateActivityInput = {
    title: activity.title,
    scheduledDate: activity.scheduledDate,
    pillar: activity.pillar,
    activityKind: activity.activityKind,
    difficulty: activity.difficulty,
    scheduledTime: activity.scheduledTime,
    important: activity.important,
    notes: activity.notes,
  };

  return db.transaction(
    "rw",
    db.plannedActivities,
    db.activityTemplates,
    db.recurrenceRules,
    async () => {
      const templateId = await db.activityTemplates.add(
        templateFromInput(input, saveAsTemplate, normalized)
      );
      const now = new Date().toISOString();
      const ruleId = await db.recurrenceRules.add({
        ...normalized,
        templateId,
        startDate: activity.scheduledDate!,
        active: true,
        createdAt: now,
        updatedAt: now,
      });
      await attachOccurrence(
        activity.id!,
        templateId,
        ruleId,
        activity.scheduledDate!
      );
      return { templateId, ruleId };
    }
  );
}

export async function removeRecurrenceFromActivity(
  activityId: number,
  templateId: number,
  ruleId: number
) {
  await db.transaction(
    "rw",
    db.plannedActivities,
    db.activityTemplates,
    db.recurrenceRules,
    async () => {
      const occurrences = await db.plannedActivities
        .where("recurrenceRuleId")
        .equals(ruleId)
        .toArray();
      await db.plannedActivities.bulkDelete(
        occurrences.flatMap((item) =>
          item.id && item.id !== activityId ? [item.id] : []
        )
      );
      await db.plannedActivities.update(activityId, {
        templateId: undefined,
        recurrenceRuleId: undefined,
        recurrenceDate: undefined,
        recurrenceKey: undefined,
        recurrenceOverride: undefined,
      });
      await db.recurrenceRules.delete(ruleId);
      await db.activityTemplates.delete(templateId);
    }
  );
}

export async function captureRecurrenceSeries(activity: PlannedActivity) {
  if (!activity.recurrenceRuleId || !activity.templateId) return null;
  const [rule, template, occurrences] = await Promise.all([
    db.recurrenceRules.get(activity.recurrenceRuleId),
    db.activityTemplates.get(activity.templateId),
    db.plannedActivities
      .where("recurrenceRuleId")
      .equals(activity.recurrenceRuleId)
      .toArray(),
  ]);
  return rule && template ? { rule, template, occurrences } : null;
}

export async function restoreRecurrenceSeries(
  snapshot: NonNullable<Awaited<ReturnType<typeof captureRecurrenceSeries>>>
) {
  await db.transaction(
    "rw",
    db.plannedActivities,
    db.activityTemplates,
    db.recurrenceRules,
    async () => {
      const current = await db.plannedActivities
        .where("recurrenceRuleId")
        .equals(snapshot.rule.id!)
        .toArray();
      const snapshotIds = new Set(
        snapshot.occurrences.map((item) => item.id)
      );
      await db.plannedActivities.bulkDelete(
        current.flatMap((item) =>
          item.id && !snapshotIds.has(item.id) ? [item.id] : []
        )
      );
      await db.recurrenceRules.put(snapshot.rule);
      await db.activityTemplates.put(snapshot.template);
      await db.plannedActivities.bulkPut(snapshot.occurrences);
    }
  );
}

export async function deleteCreatedActivityPlan(activityId: number) {
  const activity = await db.plannedActivities.get(activityId);
  if (!activity) return;
  if (!activity.recurrenceRuleId) {
    await db.plannedActivities.update(activityId, {
      deletedAt: new Date().toISOString(),
    });
    return;
  }

  await db.transaction(
    "rw",
    db.plannedActivities,
    db.activityTemplates,
    db.recurrenceRules,
    async () => {
      const occurrences = await db.plannedActivities
        .where("recurrenceRuleId")
        .equals(activity.recurrenceRuleId!)
        .toArray();
      await db.plannedActivities.bulkDelete(
        occurrences.flatMap((item) => (item.id ? [item.id] : []))
      );
      await db.recurrenceRules.delete(activity.recurrenceRuleId!);
      if (activity.templateId) {
        const template = await db.activityTemplates.get(activity.templateId);
        if (template && !template.saved) {
          await db.activityTemplates.delete(activity.templateId);
        }
      }
    }
  );
}

export async function skipOccurrence(activity: PlannedActivity) {
  if (!activity.id) return;
  await cancelPlannedActivity(activity.id);
}

export async function endRecurrence(activity: PlannedActivity) {
  if (!activity.recurrenceRuleId) return;
  const effectiveDate = activity.recurrenceDate ?? activity.scheduledDate ?? "";
  const now = new Date().toISOString();

  await db.transaction(
    "rw",
    db.recurrenceRules,
    db.plannedActivities,
    async () => {
      await db.recurrenceRules.update(activity.recurrenceRuleId!, {
        active: false,
        endDate: effectiveDate,
        updatedAt: now,
      });
      const future = await db.plannedActivities
        .where("recurrenceRuleId")
        .equals(activity.recurrenceRuleId!)
        .toArray();
      await Promise.all(
        future
          .filter(
            (item) =>
              (item.recurrenceDate ?? "") > effectiveDate && !item.completed
          )
          .map((item) =>
            db.plannedActivities.update(item.id!, {
              deletedAt: now,
              updatedAt: now,
            })
          )
      );
    }
  );
}

export async function deleteActivityTemplate(id: number) {
  await db.activityTemplates.update(id, {
    saved: false,
    updatedAt: new Date().toISOString(),
  });
}

export async function restoreActivityTemplate(id: number) {
  await db.activityTemplates.update(id, {
    deletedAt: undefined,
    saved: true,
    updatedAt: new Date().toISOString(),
  });
}
