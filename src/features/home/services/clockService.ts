export function clockParts(date: Date) {
  const hour24 = date.getHours();
  return {
    hour: String(hour24 % 12 || 12).padStart(2, "0"),
    minute: String(date.getMinutes()).padStart(2, "0"),
    period: hour24 >= 12 ? "PM" : "AM",
    metadata: new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    }).format(date).replace(",", "").toUpperCase(),
  };
}
