import { db, type Habit, type Pillar, type PlannedActivity } from "../../database/db";
import { toDateKey, isActivityVisible } from "../activities/services/activityLifecycle";
import { createPlannedActivity, completePlannedActivity } from "../activities/services/activityService";
import { materializeOccurrencesForWeek, matchesRule } from "../activities/services/recurrenceService";
import { isValidDateKey } from "../settings/services/backupRecordValidation";

export const todayKey = () => toDateKey(new Date());
export function offset(day: string, n: number) {
  const d = new Date(day + "T12:00:00"); d.setDate(d.getDate() + n); return toDateKey(d);
}
export function sunday(day: string) { return offset(day, -new Date(day + "T12:00:00").getDay()); }
export const periodOn = (h: Habit, day: string) => h.periods.filter(p => p.from <= day).at(-1);
type Schedule = { days: number[] } | { target: number };

export async function saveHabit(title: string, pillar: Pillar, from: string, schedule: Schedule, id?: number, activityKind?: string) {
  if (!title.trim() || !isValidDateKey(from)) throw new Error("Choose a name and start date.");
  if ("days" in schedule ? !schedule.days.length || schedule.days.some(d => !Number.isInteger(d) || d < 0 || d > 6)
    : !Number.isInteger(schedule.target) || schedule.target < 1 || schedule.target > 7) throw new Error("Choose days or a weekly target from 1 to 7.");
  return db.transaction("rw", [db.habits, db.recurrenceRules, db.activityTemplates, db.plannedActivities], async () => {
    const habit = id ? await db.habits.get(id) : undefined;
    if (id && !habit) throw new Error("Habit not found.");
    if (habit && (from < todayKey() || from < habit.periods.at(-1)!.from)) throw new Error("Schedule changes must start today or later, after the last schedule starts.");
    const kind = habit?.activityKind ?? activityKind;
    const habitId = id ?? await db.habits.add({ title: title.trim(), pillar, activityKind: kind, periods: [] });
    const now = new Date().toISOString();
    const previous = habit?.periods.at(-1)?.ruleId;
    if (previous) {
      const rule = await db.recurrenceRules.get(previous);
      if (rule) await db.recurrenceRules.update(previous, from <= rule.startDate ? { active: false } : { endDate: offset(from,-1) });
      await db.plannedActivities.where("recurrenceRuleId").equals(previous)
        .filter(a => !!a.recurrenceDate && a.recurrenceDate >= from && !a.completed && !a.recurrenceOverride && isActivityVisible(a))
        .modify({ status: "cancelled", cancelledAt: now, updatedAt: now });
    }
    let ruleId: number | undefined;
    if ("days" in schedule) {
      const linkedRule = previous ? await db.recurrenceRules.get(previous) : undefined;
      const templateId = linkedRule?.templateId ?? await db.activityTemplates.add({ title: title.trim(), pillar, activityKind: kind, difficulty: "medium", saved: false, createdAt: now, updatedAt: now });
      ruleId = await db.recurrenceRules.add({ habitId, templateId, active: true, startDate: from, frequency: "weekly", interval: 1, weekdays: schedule.days, createdAt: now, updatedAt: now });
    }
    const period = "target" in schedule ? { from, target: schedule.target } : { from, ruleId };
    await db.habits.update(habitId, { periods: [...(habit?.periods ?? []).filter(p => p.from < from), period] });
    return habitId;
  });
}

export async function trackSeries(ruleId: number) {
  return db.transaction("rw", [db.habits,db.recurrenceRules,db.activityTemplates,db.plannedActivities], async () => {
    const rule = await db.recurrenceRules.get(ruleId);
    if (!rule?.active) throw new Error("This series is not active.");
    if (rule.habitId) return rule.habitId;
    const tpl = await db.activityTemplates.get(rule.templateId);
    if (!tpl) throw new Error("Template not found.");
    const id = await db.habits.add({ title: tpl.title, pillar: tpl.pillar, activityKind: tpl.activityKind, periods: [{ from: todayKey(), ruleId }] });
    await db.recurrenceRules.update(ruleId,{ habitId: id });
    await db.plannedActivities.where("recurrenceRuleId").equals(ruleId).modify({ habitId: id });
    return id;
  });
}

export async function habitDayTask(id: number, day: string, checkOff = false) {
  if (!isValidDateKey(day) || (checkOff && day > todayKey())) throw new Error("Choose a valid day.");
  return db.transaction("rw", [db.habits,db.plannedActivities,db.recurrenceRules,db.activityTemplates,db.activityEvents,db.xpEvents], async () => {
    const h = await db.habits.get(id);
    const p = h && periodOn(h,day);
    if (!h || !p) throw new Error("This habit had not started yet.");
    const lookup = () => db.plannedActivities.where("scheduledDate").equals(day).filter(a => a.habitId === id && isActivityVisible(a)).first();
    let task = await lookup();
    if (p.ruleId && !task) {
      const rule = await db.recurrenceRules.get(p.ruleId);
      if (!rule || !matchesRule(rule, day)) throw new Error("Not a scheduled day.");
      await materializeOccurrencesForWeek(sunday(day),{ruleId:p.ruleId,date:day});
      task = await lookup();
    }
    if (!task && p.target) {
      const taskId = await createPlannedActivity({ title: h.title, pillar: h.pillar, activityKind: h.activityKind, scheduledDate: day });
      await db.plannedActivities.update(taskId,{ habitId: id });
      task = await db.plannedActivities.get(taskId);
    }
    if (!task?.id) throw new Error("This occurrence was moved or removed; check Planner.");
    if (checkOff && !task.completed) await completePlannedActivity(task.id,day);
  });
}

export function completionDay(a: PlannedActivity) {
  return a.completed && isActivityVisible(a) ? (a.completedAt ? toDateKey(new Date(a.completedAt)) : a.scheduledDate) : undefined;
}
