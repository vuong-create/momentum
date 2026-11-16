export const navigationOrderKey = "momentum.navigation-order.v1";
export const defaultNavigationOrder = ["/", "/planner", "/chinese", "/athletics", "/cooking", "/finance", "/journal"];

export function normalizeNavigationOrder(value: unknown): string[] {
  const saved = Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && defaultNavigationOrder.includes(item)) : [];
  return [...new Set([...saved, ...defaultNavigationOrder])];
}

export function readNavigationOrder(): string[] {
  try { return normalizeNavigationOrder(JSON.parse(localStorage.getItem(navigationOrderKey) ?? "null")); }
  catch { return [...defaultNavigationOrder]; }
}

export function moveNavigationItem(order: string[], from: string, to: string): string[] {
  const source = order.indexOf(from), target = order.indexOf(to);
  if (source < 0 || target < 0 || source === target) return order;
  const next = [...order];
  next.splice(source, 1);
  next.splice(target, 0, from);
  return next;
}
