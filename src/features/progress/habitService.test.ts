import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "../../database/db";
import { createActivityPlan, materializeOccurrencesForWeek } from "../activities/services/recurrenceService";
import { correctCompletionDate, movePlannedActivity, reopenPlannedActivity } from "../activities/services/activityService";
import { createMomentumBackup, restoreMomentumBackup, validateMomentumBackup } from "../settings/services/backupService";
import { completionDay, habitDayTask, offset, saveHabit, sunday, todayKey, trackSeries } from "./habitService";

beforeEach(async()=>{await db.transaction("rw",db.tables,async()=>{for(const table of db.tables) await table.clear();});});
describe("habit history",()=>{
  it("checks off only the selected occurrence, including after a move to an off-day",async()=>{
    const id = await saveHabit("Coach","athletics","2020-10-01",{days:[2,4]});
    await saveHabit("Read","happiness","2020-10-01",{days:[0,1,2,3,4,5,6]});
    await habitDayTask(id,"2020-11-03");
    const task = (await db.plannedActivities.toArray())[0];
    expect(await db.plannedActivities.count()).toBe(1);
    await movePlannedActivity(task.id!,"2020-11-04");
    await habitDayTask(id,"2020-11-04",true);
    await expect(habitDayTask(id,"2020-11-03",true)).rejects.toThrow("moved or removed");
    expect(await db.plannedActivities.count()).toBe(1);
    expect(await db.xpEvents.count()).toBe(1);
  });
  it("adopts one existing series and keeps a single task and XP event when checked off late",async()=>{
    const d = "2020-11-03";
    const task = await createActivityPlan({title:"17E coaching",scheduledDate:d,recurrence:{frequency:"weekly",interval:1,weekdays:[2,4]}});
    const rule = (await db.plannedActivities.get(task))!.recurrenceRuleId!;
    const h = await trackSeries(rule);
    expect(await trackSeries(rule)).toBe(h);
    await materializeOccurrencesForWeek(sunday(d));
    await materializeOccurrencesForWeek(sunday(d));
    expect(await db.plannedActivities.count()).toBe(2);
    expect((await db.plannedActivities.toArray()).every(a=>a.habitId===h)).toBe(true);
  });
  it("credits the performed day and moves the tile across a month boundary without another award",async()=>{
    const h = await saveHabit("Read","happiness","2020-10-01",{days:[0,1,2,3,4,5,6]});
    await habitDayTask(h,"2020-11-01",true);
    await habitDayTask(h,"2020-11-01",true);
    const task = (await db.plannedActivities.where("scheduledDate").equals("2020-11-01").first())!;
    await correctCompletionDate(task.id!,"2020-10-31");
    expect(completionDay((await db.plannedActivities.get(task.id!))!)).toBe("2020-10-31");
    expect(await db.xpEvents.count()).toBe(1);
    await reopenPlannedActivity(task.id!);
    expect(completionDay((await db.plannedActivities.get(task.id!))!)).toBeUndefined();
  });
  it("changes only future expectations, even when those tasks already exist",async()=>{
    const next = offset(sunday(todayKey()),7), prior = offset(next,-7);
    const h = await saveHabit("Coach","athletics",prior,{days:[2,4]});
    await materializeOccurrencesForWeek(prior);await materializeOccurrencesForWeek(next);
    await saveHabit("Coach","athletics",next,{days:[4]},h);
    await materializeOccurrencesForWeek(next);
    const visible = (await db.plannedActivities.toArray()).filter(a=>a.status!=="cancelled");
    expect(visible.map(a=>a.scheduledDate).sort()).toEqual([offset(prior,2),offset(prior,4),offset(next,4)]);
  });
  it("does not schedule a flexible target automatically and restores schedules, credits and links",async()=>{
    const h = await saveHabit("Gym","athletics","2020-11-01",{target:3});
    expect(await db.plannedActivities.count()).toBe(0);
    await Promise.all([habitDayTask(h,"2020-11-03"),habitDayTask(h,"2020-11-03")]);
    expect(await db.plannedActivities.count()).toBe(1);
    await habitDayTask(h,"2020-11-03",true);
    const backup = await createMomentumBackup();
    await db.habits.clear();
    await restoreMomentumBackup(backup);
    expect((await db.habits.get(h))?.periods[0].target).toBe(3);
    expect((await db.plannedActivities.toArray())[0]).toMatchObject({habitId:h,completed:true});
    const old = await createMomentumBackup();old.data.plannedActivities=[];old.data.activityEvents=[];old.data.xpEvents=[];
    delete old.data.habits; old.manifest.schemaVersion=35;delete old.manifest.tableCounts.habits;
    for(const key of Object.keys(old.manifest.tableCounts)) old.manifest.tableCounts[key]=old.data[key].length;
    old.manifest.totalRecords=Object.values(old.manifest.tableCounts).reduce((a,b)=>a+b,0);
    expect(validateMomentumBackup(old).data.habits).toEqual([]);
  });
});
