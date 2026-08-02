import type {
  ChineseActivity,
  ChineseActivityIntensity,
  ChineseActivityType,
} from "../../../database/db";
import { chineseActivityCatalog } from "../activityCatalog";

const intensityScores: Record<ChineseActivityIntensity, number> = {
  light: 1,
  normal: 2,
  strong: 3,
};

function fromDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function toDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export interface ChineseDailySummary {
  date: string;
  activities: ChineseActivity[];
  score: number;
  level: 1 | 2 | 3;
}

export function getChineseDailySummaries(activities: ChineseActivity[]) {
  const summaries = new Map<string, ChineseDailySummary>();

  activities
    .filter((activity) => !activity.deletedAt)
    .forEach((activity) => {
      const existing = summaries.get(activity.date) ?? {
        date: activity.date,
        activities: [],
        score: 0,
        level: 1 as const,
      };

      existing.activities.push(activity);
      existing.score += intensityScores[activity.intensity];
      existing.level = Math.min(3, existing.score) as 1 | 2 | 3;
      summaries.set(activity.date, existing);
    });

  return summaries;
}

export function getChineseStreaks(
  activities: ChineseActivity[],
  today = new Date()
) {
  const activeDates = [...getChineseDailySummaries(activities).keys()].sort();
  const activeSet = new Set(activeDates);
  const todayKey = toDateKey(today);
  const yesterday = addDays(today, -1);
  let cursor = activeSet.has(todayKey)
    ? new Date(today)
    : activeSet.has(toDateKey(yesterday))
      ? yesterday
      : null;
  let current = 0;

  while (cursor && activeSet.has(toDateKey(cursor))) {
    current += 1;
    cursor = addDays(cursor, -1);
  }

  let longest = 0;
  let running = 0;
  let previous: Date | null = null;

  activeDates.forEach((dateKey) => {
    const date = fromDateKey(dateKey);
    const isConsecutive = previous &&
      Math.round(
        (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) -
          Date.UTC(previous.getFullYear(), previous.getMonth(), previous.getDate())) /
          86_400_000
      ) === 1;

    running = isConsecutive ? running + 1 : 1;
    longest = Math.max(longest, running);
    previous = date;
  });

  return {
    current,
    longest,
    totalActiveDays: activeDates.length,
  };
}

export function getChineseMonthSummary(
  activities: ChineseActivity[],
  month: Date
) {
  const monthPrefix = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`;
  const monthActivities = activities.filter(
    (activity) => !activity.deletedAt && activity.date.startsWith(monthPrefix)
  );
  const counts = Object.fromEntries(
    chineseActivityCatalog.map(({ type }) => [type, 0])
  ) as Record<ChineseActivityType, number>;

  monthActivities.forEach((activity) => {
    counts[activity.type] += 1;
  });

  return {
    activeDays: getChineseDailySummaries(monthActivities).size,
    totalActivities: monthActivities.length,
    counts,
  };
}

export function getPreviousMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() - 1, 1);
}

export function getChineseHeatmapDays(
  activities: ChineseActivity[],
  endDate: Date,
  dayCount = 364
) {
  const summaries = getChineseDailySummaries(activities);
  const weekCount = Math.max(1, Math.ceil(dayCount / 7));
  const currentWeekStart = addDays(endDate, -endDate.getDay());
  const startDate = addDays(currentWeekStart, -(weekCount - 1) * 7);
  const cellCount = weekCount * 7;

  return Array.from({ length: cellCount }, (_, index) => {
    const date = addDays(startDate, index);
    const dateKey = toDateKey(date);

    return {
      date,
      dateKey,
      summary: summaries.get(dateKey),
    };
  });
}
