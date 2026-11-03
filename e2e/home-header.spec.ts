import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date("2026-09-30T13:32:00-04:00") });
});

for (const width of [1440, 1100, 768, 390, 320]) {
  test(`Home header fits at ${width}px, including September`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.locator(".living-home-date-copy h1")).toContainText("September");
    await page.evaluate(() => document.fonts.ready);
    const date = (await page.locator(".living-home-date-copy").boundingBox())!;
    const clock = (await page.locator(".living-home-time").boundingBox())!;
    const xp = (await page.locator(".momentum-level-display").boundingBox())!;
    expect(date.x + date.width).toBeLessThanOrEqual(clock.x);
    expect(xp.y).toBeGreaterThanOrEqual(Math.max(date.y + date.height, clock.y + clock.height));
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await expect(page.locator(".pixel-terminal-clock")).toHaveAttribute("aria-label", "Current time 01:32 PM");
    if (width > 1000) {
      const reflection = (await page.getByRole("region", { name: "Daily reflection" }).boundingBox())!;
      expect(reflection.x).toBeGreaterThan(xp.x + xp.width);
    }
  });
}

test("both reflections retain independent saves after reload", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /^Save quote by/ }).click();
  await expect(page.getByRole("button", { name: /^Remove quote by/ })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: /^Save Chinese idiom/ }).click();
  await expect(page.getByRole("button", { name: /^Remove Chinese idiom/ })).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(page.locator(".daily-quote-save[aria-pressed=true]")).toHaveCount(2);
  await page.getByRole("button", { name: /^Remove quote by/ }).click();
  await expect(page.getByRole("button", { name: /^Save quote by/ })).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByRole("button", { name: /^Remove Chinese idiom/ })).toHaveAttribute("aria-pressed", "true");
});

test("progression details still open and compact tasks remain two columns", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".momentum-level-fill")).toHaveAttribute("style", "width: 0%;");
  await page.getByRole("button", { name: /Open progression details/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  const input = page.getByRole("textbox", { name: "Add a task for today" });
  for (let index = 0; index < 10; index++) {
    await input.fill(`Header check ${index}`);
    await input.press("Enter");
    await expect(page.getByRole("button", { name: `Complete Header check ${index}`, exact: true })).toBeVisible();
  }
  const layout = await page.locator(".home-todo-today-list").evaluate((element) => {
    const style = getComputedStyle(element);
    return { columns: style.gridTemplateColumns.split(" ").length, maxHeight: style.maxHeight };
  });
  expect(layout).toEqual({ columns: 2, maxHeight: "318px" });
});

test("clock respects reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".pixel-terminal-minute")).toHaveCSS("animation-name", "none");
});
