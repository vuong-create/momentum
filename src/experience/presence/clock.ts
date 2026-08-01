export type TimePeriod =
  | "morning"
  | "afternoon"
  | "evening"
  | "night";

export function getTimePeriod(date = new Date()): TimePeriod {
  const hour = date.getHours();

  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  if (hour >= 18 && hour < 22) return "evening";

  return "night";
}

export function getDateKey(date = new Date()) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}
