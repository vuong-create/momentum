import { test, expect } from "@playwright/test";

test("carry badge uses elapsed days, survives moves, and leaves fresh tasks unmarked", async ({ page }, testInfo) => {
  await page.clock.install({ time: new Date("2026-11-03T12:00:00-05:00") });
  await page.goto("/");
  const input = page.getByRole("textbox", { name: "Add a task for today" });
  await input.fill("Read ten pages"); await input.press("Enter");
  await expect(page.getByRole("button", { name: "Complete Read ten pages", exact: true })).toBeVisible();
  await expect(page.locator(".home-todo-carry")).toHaveCount(0);
  await page.clock.setSystemTime(new Date("2026-11-04T12:00:00-05:00"));
  await page.reload();
  await page.locator(".home-unfinished-heading").click();
  await page.getByRole("button", { name: "Reschedule to today", exact: true }).click();
  await expect(page.locator(".home-todo-carry")).toHaveText("Day 1");
  await page.clock.setSystemTime(new Date("2026-11-05T12:00:00-05:00"));
  await page.reload();
  await page.getByRole("button", { name: "Reschedule to today", exact: true }).click();
  await expect(page.locator(".home-todo-carry")).toHaveText("Day 2");
  await input.fill("Fresh task"); await input.press("Enter");
  await expect(page.locator(".home-todo-carry")).toHaveCount(1);
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    const row = page.locator(".home-todo-strip").filter({ hasText: "Read ten pages" });
    await expect(row.locator(".home-todo-carry")).toBeVisible();
    const bounds = (await row.boundingBox())!;
    const badge = (await row.locator(".home-todo-carry").boundingBox())!;
    expect(badge.x + badge.width).toBeLessThanOrEqual(bounds.x + bounds.width);
    expect(bounds.height).toBeLessThan(60);
    await page.screenshot({ path: testInfo.outputPath("carry-" + width + ".png"), animations: "disabled" });
  }
  await page.getByRole("button", { name: "Complete Read ten pages", exact: true }).click();
  await expect(page.locator(".home-todo-carry")).toHaveCount(0);
});

test("Library and Cooking use the approved shared identities", async ({ page }) => {
  await page.goto("/");
  const tokens = await page.evaluate(() => {
    const style = getComputedStyle(document.documentElement);
    return [style.getPropertyValue("--pillar-journal").trim(), style.getPropertyValue("--pillar-cooking").trim()];
  });
  expect(tokens).toEqual(["#c9c0a5", "#c990a8"]);
  await expect(page.locator('.navigation-illustration[data-icon="journal"]')).toHaveCSS("--icon-native", "#c9c0a5");
  await expect(page.locator('.navigation-illustration[data-icon="cooking"]')).toHaveCSS("--icon-native", "#c990a8");
});
