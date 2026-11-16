import { describe, expect, it } from "vitest";
import { defaultNavigationOrder, moveNavigationItem, normalizeNavigationOrder } from "./navigationOrder";

describe("navigation order", () => {
  it("recovers missing, duplicate, and invalid saved routes", () => {
    expect(normalizeNavigationOrder(["/finance", "/finance", "/missing"])).toEqual(["/finance", ...defaultNavigationOrder.filter((path) => path !== "/finance")]);
    expect(normalizeNavigationOrder(null)).toEqual(defaultNavigationOrder);
  });
  it("moves in either direction without dropping links", () => {
    const order = moveNavigationItem(defaultNavigationOrder, "/finance", "/");
    expect(order[0]).toBe("/finance");
    expect(moveNavigationItem(order, "/finance", "/journal").at(-1)).toBe("/finance");
    expect(new Set(order).size).toBe(defaultNavigationOrder.length);
    expect(moveNavigationItem(order, "/bad", "/")).toBe(order);
  });
});
