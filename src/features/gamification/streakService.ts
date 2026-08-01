import { db } from "../../database/db";


export async function updateTodayStreak() {

  const today =
    new Date()
      .toISOString()
      .split("T")[0];


  const existing =
    await db.streakRecords
      .where("date")
      .equals(today)
      .first();


  if (existing) return;


  const completedTasks =
    await db.plannedActivities
      .where("completed")
      .equals(1)
      .toArray();


  await db.streakRecords.add({
    date: today,
    completed:
      completedTasks.length > 0,
  });
}



export async function getCurrentStreak() {

  const records =
    await db.streakRecords
      .orderBy("date")
      .reverse()
      .toArray();


  let streak = 0;


  for (const day of records) {

    if (!day.completed)
      break;


    streak++;

  }


  return streak;
}