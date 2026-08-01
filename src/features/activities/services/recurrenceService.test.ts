import "fake-indexeddb/auto";

import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { db } from "../../../database/db";
import {
  createActivityPlan,
  deleteActivityTemplate,
  deleteCreatedActivityPlan,
  describeRecurrence,
  endRecurrence,
  instantiateTemplate,
  listSavedTemplates,
  materializeOccurrencesForWeek,
  skipOccurrence,
  updateFutureOccurrences,
  updateSingleOccurrence,
} from "./recurrenceService";

beforeEach(async () => {
  await db.transaction("rw", db.tables, async () => {
    await Promise.all(db.tables.map((table) => table.clear()));
  });
});

afterAll(async () => {
  db.close();
  await db.delete();
});

describe("recurrence service", () => {
  it("materializes daily occurrences once per nominal date", async () => {
    await createActivityPlan({
      title: "Read",
      scheduledDate: "2026-08-02",
      recurrence: { frequency: "daily", interval: 1 },
    });

    await materializeOccurrencesForWeek("2026-08-02");
    await materializeOccurrencesForWeek("2026-08-02");

    const activities = await db.plannedActivities.toArray();
    expect(activities).toHaveLength(7);
    expect(new Set(activities.map((item) => item.recurrenceKey)).size).toBe(7);
  });

  it("starts selected-weekday recurrence on the first matching day", async () => {
    await createActivityPlan({
      title: "Chinese review",
      scheduledDate: "2026-08-02",
      recurrence: {
        frequency: "weekly",
        interval: 1,
        weekdays: [1, 3, 5],
      },
    });

    await materializeOccurrencesForWeek("2026-08-02");
    const activities = await db.plannedActivities.toArray();

    expect(activities.map((item) => item.scheduledDate).sort()).toEqual([
      "2026-08-03",
      "2026-08-05",
      "2026-08-07",
    ]);
  });

  it("materializes monthly rules only on their configured day", async () => {
    await createActivityPlan({
      title: "Close month",
      scheduledDate: "2026-08-15",
      recurrence: {
        frequency: "monthly",
        interval: 1,
        monthDay: 15,
      },
    });

    await materializeOccurrencesForWeek("2026-09-13");
    const activities = await db.plannedActivities.toArray();
    expect(activities.map((item) => item.scheduledDate).sort()).toEqual([
      "2026-08-15",
      "2026-09-15",
    ]);
  });

  it("keeps a moved occurrence from being regenerated", async () => {
    await createActivityPlan({
      title: "Workout",
      scheduledDate: "2026-08-03",
      recurrence: { frequency: "weekly", interval: 1, weekdays: [1] },
    });
    const activity = await db.plannedActivities.toCollection().first();
    await db.plannedActivities.update(activity!.id!, {
      scheduledDate: "2026-08-04",
      day: "Tuesday",
      recurrenceOverride: true,
    });

    await materializeOccurrencesForWeek("2026-08-02");

    expect(await db.plannedActivities.count()).toBe(1);
    expect((await db.plannedActivities.get(activity!.id!))?.recurrenceDate).toBe(
      "2026-08-03"
    );
  });

  it("separates one-off edits from future-series edits", async () => {
    await createActivityPlan({
      title: "Read",
      scheduledDate: "2026-08-02",
      recurrence: { frequency: "daily", interval: 1 },
    });
    await materializeOccurrencesForWeek("2026-08-02");
    const activities = await db.plannedActivities.orderBy("scheduledDate").toArray();

    await updateSingleOccurrence(activities[1], { title: "Read outside" });
    await updateFutureOccurrences(activities[3], { title: "Read 20 pages" });

    const updated = await db.plannedActivities.orderBy("scheduledDate").toArray();
    expect(updated[1].title).toBe("Read outside");
    expect(updated[1].recurrenceOverride).toBe(true);
    expect(updated[2].title).toBe("Read");
    expect(updated.slice(3).map((item) => item.title)).toEqual([
      "Read 20 pages",
      "Read 20 pages",
      "Read 20 pages",
      "Read 20 pages",
    ]);
  });

  it("skips one occurrence and ends future materialization", async () => {
    await createActivityPlan({
      title: "Stretch",
      scheduledDate: "2026-08-02",
      recurrence: { frequency: "daily", interval: 1 },
    });
    await materializeOccurrencesForWeek("2026-08-02");
    const activities = await db.plannedActivities.orderBy("scheduledDate").toArray();

    await skipOccurrence(activities[1]);
    await endRecurrence(activities[3]);
    await materializeOccurrencesForWeek("2026-08-09");

    expect((await db.plannedActivities.get(activities[1].id!))?.status).toBe(
      "cancelled"
    );
    expect(await db.plannedActivities.where("scheduledDate").above("2026-08-05").count()).toBe(3);
    expect((await db.recurrenceRules.toCollection().first())?.active).toBe(false);
  });

  it("saves and instantiates reusable templates with recurrence presets", async () => {
    await createActivityPlan({
      title: "Meal prep",
      scheduledDate: "2026-08-02",
      pillar: "cooking",
      recurrence: { frequency: "weekly", interval: 1, weekdays: [0] },
      saveAsTemplate: true,
    });
    const [template] = await listSavedTemplates();
    await instantiateTemplate(template, "2026-08-09");

    expect(template.title).toBe("Meal prep");
    expect(template.recurrencePreset).toMatchObject({ frequency: "weekly" });
    expect(await db.recurrenceRules.count()).toBe(2);
  });

  it("hides a reusable template without ending its active series", async () => {
    await createActivityPlan({
      title: "Weekly review",
      scheduledDate: "2026-08-02",
      recurrence: { frequency: "weekly", interval: 1, weekdays: [0] },
      saveAsTemplate: true,
    });
    const [template] = await listSavedTemplates();
    await deleteActivityTemplate(template.id!);
    await materializeOccurrencesForWeek("2026-08-09");

    expect(await listSavedTemplates()).toHaveLength(0);
    expect(await db.plannedActivities.count()).toBe(2);
    expect((await db.recurrenceRules.toCollection().first())?.active).toBe(true);
  });

  it("removes a newly instantiated recurring plan without deleting its saved template", async () => {
    await createActivityPlan({
      title: "Meal prep",
      scheduledDate: "2026-08-02",
      recurrence: { frequency: "weekly", interval: 1, weekdays: [0] },
      saveAsTemplate: true,
    });
    const [template] = await listSavedTemplates();
    const createdId = await instantiateTemplate(template, "2026-08-09");
    await materializeOccurrencesForWeek("2026-08-09");
    await deleteCreatedActivityPlan(createdId);

    expect(await listSavedTemplates()).toHaveLength(1);
    expect(await db.recurrenceRules.count()).toBe(1);
  });

  it("describes compact recurrence patterns", () => {
    expect(describeRecurrence({ frequency: "daily", interval: 1 })).toBe(
      "Every day"
    );
    expect(
      describeRecurrence({
        frequency: "weekly",
        interval: 1,
        weekdays: [1, 3, 5],
      })
    ).toBe("Weekly · Mon, Wed, Fri");
  });
});
