import { test, expect } from "@playwright/test";

for (const correction of [false, true]) {
  test(correction ? "correct a rescheduled coaching task without touching Thursday" : "credit late check-off to Tuesday", async ({ page }) => {
    await page.clock.install({ time: new Date("2026-11-01T12:00:00-05:00") });
    await page.goto("/");
    for (const day of ["03", "05"]) {
      const input = page.getByRole("textbox", { name: "Add a task for today" });
      await input.fill("17E coaching");
      await input.press("Enter");
      await page.getByRole("button", { name: "Edit 17E coaching", exact: true }).click();
      const dialog = page.getByRole("dialog", { name: "Activity details" });
      await dialog.locator("input.activity-date-input").fill("2026-11-" + day);
      await dialog.getByRole("button", { name: "Save changes" }).click();
      await expect(dialog).toHaveCount(0);
    }
    await page.clock.setSystemTime(new Date("2026-11-04T12:00:00-05:00"));
    await page.reload();
    await page.locator(".home-unfinished-heading").click();
    if (correction) {
      await page.getByRole("button", { name: "Reschedule to today" }).click();
      await page.getByRole("button", { name: "Complete 17E coaching", exact: true }).click();
      await page.locator(".home-todo-completed-toggle").click();
      await page.getByRole("button", { name: "Edit 17E coaching", exact: true }).click();
      await page.getByRole("button", { name: "Change completion date" }).click();
      await page.getByLabel("Day you did 17E coaching").fill("2026-11-03");
      await page.getByRole("button", { name: "Save completion date" }).click();
      await expect(page.getByRole("dialog")).toHaveCount(0);
    } else {
      await page.getByRole("button", { name: "Did it Tuesday ✓" }).click();
    }
    const week = page.locator(".home-week-day");
    await expect(week.nth(2)).toContainText("1/1");
    await page.reload();
    await expect(week.nth(2)).toContainText("1/1");
    await expect(week.nth(3)).not.toContainText("17E coaching");
    await expect(week.nth(4)).toContainText("0/1");
    await expect(week.nth(4)).toContainText("17E coaching");
    await page.goto("/planner");
    await page.getByRole("button", { name: /All Tasks/i }).first().click();
    const history = page.getByRole("row").filter({ hasText: "17E coaching" });
    await expect(history.filter({ hasText: "completed" })).toHaveCount(1);
    await expect(history.filter({ hasText: "completed" })).toContainText(/Nov 3\b/);
  });
}
