import {
  db,
  type DayPreset,
  type DayPresetItem,
  type PlannedActivity,
} from "../../../database/db";
import { isActivityVisible } from "../../activities/services/activityLifecycle";
import {
  createPlannedActivity,
  softDeletePlannedActivity,
} from "../../activities/services/activityService";

export interface ApplyDayPresetResult {
  createdIds: number[];
  skippedCount: number;
}

function normalizeTitle(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

function cleanItems(items: DayPresetItem[]) {
  return items
    .filter((item) => item.title.trim())
    .map((item) => ({
      ...item,
      id: item.id || crypto.randomUUID(),
      title: item.title.trim(),
      scheduledTime: item.scheduledTime || undefined,
      important: Boolean(item.important),
      notes: item.notes?.trim() || undefined,
    }));
}

export async function listDayPresets() {
  return db.dayPresets
    .filter((preset) => !preset.deletedAt)
    .sortBy("sortOrder");
}

export async function saveDayPreset(
  input: Pick<DayPreset, "name" | "items"> & { id?: number },
) {
  const name = input.name.trim();
  const items = cleanItems(input.items);
  if (!name) throw new Error("A day preset needs a name.");
  if (items.length === 0) throw new Error("Add at least one activity to this preset.");
  const now = new Date().toISOString();

  if (input.id) {
    await db.dayPresets.update(input.id, { name, items, updatedAt: now });
    return input.id;
  }

  return db.dayPresets.add({
    name,
    items,
    sortOrder: Date.now(),
    createdAt: now,
    updatedAt: now,
  });
}

export async function duplicateDayPreset(preset: DayPreset) {
  return saveDayPreset({
    name: `${preset.name} Copy`,
    items: preset.items.map((item) => ({ ...item, id: crypto.randomUUID() })),
  });
}

export async function deleteDayPreset(id: number) {
  await db.dayPresets.update(id, {
    deletedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

export async function applyDayPreset(
  preset: DayPreset,
  scheduledDate: string,
): Promise<ApplyDayPresetResult> {
  const activities = await db.plannedActivities.toArray();
  const existingKeys = new Set(
    activities
      .filter(
        (activity) =>
          isActivityVisible(activity) && activity.scheduledDate === scheduledDate,
      )
      .map((activity) => `${activity.pillar}:${normalizeTitle(activity.title)}`),
  );
  const createdIds: number[] = [];
  let skippedCount = 0;

  for (const item of preset.items) {
    const key = `${item.pillar}:${normalizeTitle(item.title)}`;
    if (existingKeys.has(key)) {
      skippedCount += 1;
      continue;
    }
    const id = await createPlannedActivity({
      title: item.title,
      scheduledDate,
      pillar: item.pillar,
      difficulty: item.difficulty,
      scheduledTime: item.scheduledTime,
      important: item.important,
      notes: item.notes,
    });
    createdIds.push(id);
    existingKeys.add(key);
  }

  return { createdIds, skippedCount };
}

export async function undoAppliedDayPreset(ids: number[]) {
  await Promise.all(ids.map((id) => softDeletePlannedActivity(id)));
}

export async function createDayPresetFromActivities(
  name: string,
  activities: PlannedActivity[],
) {
  const id = await saveDayPreset({
    name,
    items: activities
      .filter(isActivityVisible)
      .sort((first, second) => (first.sortOrder ?? 0) - (second.sortOrder ?? 0))
      .map((activity) => ({
        id: crypto.randomUUID(),
        title: activity.title,
        pillar: activity.pillar,
        difficulty: activity.difficulty,
        scheduledTime: activity.scheduledTime,
        important: activity.important,
        notes: activity.notes,
      })),
  });
  return db.dayPresets.get(id);
}
