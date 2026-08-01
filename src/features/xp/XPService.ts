import { db } from "../../database/db";

export async function awardXP(
  amount: number,
  source: string
) {
  await db.xpEvents.add({
    amount,
    source,
    date: new Date().toISOString(),
  });
}

export async function getTotalXP() {
  const events = await db.xpEvents.toArray();

  return events.reduce(
    (total, event) => total + event.amount,
    0
  );
}

export function calculateLevel(xp: number) {
  return Math.floor(xp / 100) + 1;
}

export function calculateLevelProgress(xp: number) {
  return xp % 100;
}